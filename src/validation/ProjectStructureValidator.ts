/**
 * Project Structure Validator
 * Ensures all projects follow the correct workspace structure and conventions
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface ProjectStructure {
  root: string;
  name: string;
  specs: {
    mainSpec?: string;
    projectSpec?: string;
    todoSpec?: string;
  };
  agentTodos: Map<string, string[]>; // agent -> phase files
  temporaryFolders: {
    analysis?: string;
    planning?: string;
  };
  agentsMd?: string;
  hasValidStructure: boolean;
  issues: string[];
  fixes: string[];
}

export interface StructureValidationResult {
  valid: boolean;
  structure: ProjectStructure;
  issues: string[];
  fixes: string[];
  suggestions: string[];
}

export class ProjectStructureValidator extends EventEmitter {
  private workspacePath: string;
  private requiredStructure = {
    folders: ['specs', 'agent-todos'],
    specs: ['main-spec.md', 'project-spec.md', 'todo-spec.md'],
    temporaryFolders: ['.analysis', '.planning'],
    rootFiles: ['AGENTS.md']
  };

  constructor(workspacePath: string = path.join(process.cwd(), 'workspace')) {
    super();
    this.workspacePath = workspacePath;
    this.ensureWorkspaceExists();
  }

  /**
   * Ensure workspace folder exists
   */
  private async ensureWorkspaceExists(): Promise<void> {
    if (!await fs.pathExists(this.workspacePath)) {
      await fs.ensureDir(this.workspacePath);
      console.log(`📁 Created workspace folder at ${this.workspacePath}`);
      
      // Add .gitignore to workspace
      const gitignorePath = path.join(this.workspacePath, '.gitignore');
      const gitignoreContent = `# Ignore all workspace content by default
*
!.gitignore
!.registry/

# Allow specific files if needed
!README.md
`;
      await fs.writeFile(gitignorePath, gitignoreContent);
    }
  }

  /**
   * Validate project structure
   */
  async validateProjectStructure(projectPath: string): Promise<StructureValidationResult> {
    console.log(`🔍 Validating project structure for ${path.basename(projectPath)}...`);
    
    const structure: ProjectStructure = {
      root: projectPath,
      name: path.basename(projectPath),
      specs: {},
      agentTodos: new Map(),
      temporaryFolders: {},
      hasValidStructure: true,
      issues: [],
      fixes: []
    };

    const result: StructureValidationResult = {
      valid: true,
      structure,
      issues: [],
      fixes: [],
      suggestions: []
    };

    // Check if project is in workspace
    if (!projectPath.startsWith(this.workspacePath)) {
      result.issues.push('Project is not in workspace folder');
      result.valid = false;
      structure.hasValidStructure = false;
    }

    // Validate folder structure
    await this.validateFolders(structure, result);
    
    // Validate spec files
    await this.validateSpecs(structure, result);
    
    // Validate agent-todos structure
    await this.validateAgentTodos(structure, result);
    
    // Validate AGENTS.md
    await this.validateAgentsMd(structure, result);
    
    // Check for temporary folders
    await this.checkTemporaryFolders(structure, result);
    
    // Generate suggestions
    this.generateSuggestions(structure, result);

    structure.issues = result.issues;
    structure.fixes = result.fixes;
    
    this.emit('validation-complete', result);
    
    return result;
  }

  /**
   * Validate required folders exist
   */
  private async validateFolders(
    structure: ProjectStructure,
    result: StructureValidationResult
  ): Promise<void> {
    for (const folder of this.requiredStructure.folders) {
      const folderPath = path.join(structure.root, folder);
      
      if (!await fs.pathExists(folderPath)) {
        result.issues.push(`Missing required folder: ${folder}`);
        result.fixes.push(`Create ${folder} folder`);
        result.valid = false;
        structure.hasValidStructure = false;
        
        // Auto-create if possible
        await this.createFolder(folderPath);
      }
    }
  }

  /**
   * Validate spec files
   */
  private async validateSpecs(
    structure: ProjectStructure,
    result: StructureValidationResult
  ): Promise<void> {
    const specsPath = path.join(structure.root, 'specs');
    
    if (await fs.pathExists(specsPath)) {
      for (const specFile of this.requiredStructure.specs) {
        const specPath = path.join(specsPath, specFile);
        
        if (await fs.pathExists(specPath)) {
          const specType = specFile.replace('.md', '').replace('-', '');
          structure.specs[specType as keyof typeof structure.specs] = specPath;
        } else {
          result.issues.push(`Missing spec file: ${specFile}`);
          result.fixes.push(`Create ${specFile} in specs folder`);
          
          // Auto-create basic spec
          await this.createDefaultSpec(specPath, specFile);
        }
      }
    }
  }

  /**
   * Validate agent-todos structure
   */
  private async validateAgentTodos(
    structure: ProjectStructure,
    result: StructureValidationResult
  ): Promise<void> {
    const agentTodosPath = path.join(structure.root, 'agent-todos');
    
    // Check for incorrect naming (agent-todo without 's')
    const incorrectPath = path.join(structure.root, 'agent-todo');
    if (await fs.pathExists(incorrectPath)) {
      result.issues.push('Found "agent-todo" folder (should be "agent-todos" with an "s")');
      result.fixes.push('Rename agent-todo to agent-todos');
      
      // Auto-rename
      await this.renameFolder(incorrectPath, agentTodosPath);
    }
    
    if (await fs.pathExists(agentTodosPath)) {
      const agents = await fs.readdir(agentTodosPath);
      
      for (const agent of agents) {
        const agentPath = path.join(agentTodosPath, agent);
        const stats = await fs.stat(agentPath);
        
        if (stats.isDirectory()) {
          const phaseFiles: string[] = [];
          const files = await fs.readdir(agentPath);
          
          for (const file of files) {
            if (file.match(/^phase\d+-todo\.md$/)) {
              phaseFiles.push(file);
            }
          }
          
          structure.agentTodos.set(agent, phaseFiles);
          
          // Check for proper phase files
          if (phaseFiles.length === 0) {
            result.issues.push(`Agent ${agent} has no phase files`);
            result.suggestions.push(`Create phase files for ${agent}`);
          }
        }
      }
    }
  }

  /**
   * Validate AGENTS.md file
   */
  private async validateAgentsMd(
    structure: ProjectStructure,
    result: StructureValidationResult
  ): Promise<void> {
    const agentsMdPath = path.join(structure.root, 'AGENTS.md');
    
    if (await fs.pathExists(agentsMdPath)) {
      structure.agentsMd = agentsMdPath;
    } else {
      result.issues.push('Missing AGENTS.md file for AI guidance');
      result.fixes.push('Create AGENTS.md with project information');
      
      // Auto-create AGENTS.md
      await this.createDefaultAgentsMd(structure.root);
      structure.agentsMd = agentsMdPath;
    }
  }

  /**
   * Check for temporary folders
   */
  private async checkTemporaryFolders(
    structure: ProjectStructure,
    result: StructureValidationResult
  ): Promise<void> {
    const analysisPath = path.join(structure.root, '.analysis');
    const planningPath = path.join(structure.root, '.planning');
    
    if (await fs.pathExists(analysisPath)) {
      structure.temporaryFolders.analysis = analysisPath;
      result.suggestions.push('Temporary .analysis folder exists - consider cleaning up');
    }
    
    if (await fs.pathExists(planningPath)) {
      structure.temporaryFolders.planning = planningPath;
      result.suggestions.push('Temporary .planning folder exists - consider cleaning up');
    }
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(
    structure: ProjectStructure,
    result: StructureValidationResult
  ): void {
    // Check for missing agents
    if (structure.agentTodos.size === 0) {
      result.suggestions.push('No agents assigned yet - run task distribution');
    }
    
    // Check for incomplete specs
    if (!structure.specs.mainSpec) {
      result.suggestions.push('Create main specification document');
    }
    
    // Check for testing setup
    const testPath = path.join(structure.root, 'tests');
    if (!fs.pathExistsSync(testPath)) {
      result.suggestions.push('Consider adding tests folder');
    }
    
    // Check for documentation
    const readmePath = path.join(structure.root, 'README.md');
    if (!fs.pathExistsSync(readmePath)) {
      result.suggestions.push('Add README.md for project documentation');
    }
  }

  /**
   * Fix project structure issues
   */
  async fixProjectStructure(projectPath: string): Promise<StructureValidationResult> {
    console.log(`🔧 Fixing project structure for ${path.basename(projectPath)}...`);
    
    const validation = await this.validateProjectStructure(projectPath);
    
    if (validation.fixes.length === 0) {
      console.log('  ✅ No fixes needed');
      return validation;
    }
    
    // Apply all fixes
    for (const fix of validation.fixes) {
      console.log(`  Applying: ${fix}`);
      // Fixes are already applied during validation
    }
    
    // Re-validate after fixes
    const revalidation = await this.validateProjectStructure(projectPath);
    
    if (revalidation.valid) {
      console.log('  ✅ Project structure fixed successfully');
    } else {
      console.log('  ⚠️ Some issues remain - manual intervention needed');
    }
    
    return revalidation;
  }

  /**
   * Ensure project exists in workspace
   */
  async ensureProjectInWorkspace(projectName: string): Promise<string> {
    const projectPath = path.join(this.workspacePath, projectName);
    
    if (!await fs.pathExists(projectPath)) {
      await fs.ensureDir(projectPath);
      console.log(`📁 Created project folder: ${projectName}`);
      
      // Create basic structure
      await this.createProjectStructure(projectPath);
    }
    
    return projectPath;
  }

  /**
   * Create complete project structure
   */
  async createProjectStructure(projectPath: string): Promise<void> {
    console.log('📁 Creating project structure...');
    
    // Create required folders
    const folders = ['specs', 'agent-todos'];
    for (const folder of folders) {
      const folderPath = path.join(projectPath, folder);
      await fs.ensureDir(folderPath);
    }
    
    // Create AGENTS.md
    await this.createDefaultAgentsMd(projectPath);
    
    // Create default specs
    const specsPath = path.join(projectPath, 'specs');
    for (const specFile of this.requiredStructure.specs) {
      const specPath = path.join(specsPath, specFile);
      if (!await fs.pathExists(specPath)) {
        await this.createDefaultSpec(specPath, specFile);
      }
    }
    
    console.log('  ✅ Project structure created');
  }

  /**
   * Clean temporary folders
   */
  async cleanTemporaryFolders(projectPath: string): Promise<void> {
    console.log('🧹 Cleaning temporary folders...');
    
    const tempFolders = ['.analysis', '.planning'];
    
    for (const folder of tempFolders) {
      const folderPath = path.join(projectPath, folder);
      
      if (await fs.pathExists(folderPath)) {
        await fs.remove(folderPath);
        console.log(`  Removed ${folder}`);
      }
    }
    
    console.log('  ✅ Temporary folders cleaned');
  }

  /**
   * Helper methods
   */
  private async createFolder(folderPath: string): Promise<void> {
    try {
      await fs.ensureDir(folderPath);
      this.emit('folder-created', folderPath);
    } catch (error) {
      console.error(`Failed to create folder: ${folderPath}`);
    }
  }

  private async renameFolder(oldPath: string, newPath: string): Promise<void> {
    try {
      if (await fs.pathExists(oldPath)) {
        await fs.rename(oldPath, newPath);
        this.emit('folder-renamed', { oldPath, newPath });
        console.log(`  ✅ Renamed ${path.basename(oldPath)} to ${path.basename(newPath)}`);
      }
    } catch (error) {
      console.error(`Failed to rename folder: ${error}`);
    }
  }

  private async createDefaultSpec(specPath: string, specFile: string): Promise<void> {
    const specType = specFile.replace('.md', '').replace(/-/g, ' ');
    const content = `# ${specType.charAt(0).toUpperCase() + specType.slice(1)}

## Overview
Project specification document.

## Requirements
- To be defined

## Technical Details
- To be defined

## Success Criteria
- To be defined
`;
    
    await fs.writeFile(specPath, content);
    this.emit('spec-created', specPath);
  }

  private async createDefaultAgentsMd(projectPath: string): Promise<void> {
    const agentsMdPath = path.join(projectPath, 'AGENTS.md');
    const projectName = path.basename(projectPath);
    
    const content = `# AGENTS.md - ${projectName}

## Dev Environment Tips

This project follows Agentwise conventions and structure.

### Project Structure
\`\`\`
${projectName}/
├── specs/              # Specification documents
├── agent-todos/        # Agent task assignments
├── src/                # Source code
├── tests/              # Test files
└── AGENTS.md           # This file
\`\`\`

### Setup Commands
\`\`\`bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
\`\`\`

## Testing Instructions

### Unit Tests
\`\`\`bash
npm test
\`\`\`

### Integration Tests
\`\`\`bash
npm run test:integration
\`\`\`

### E2E Tests
\`\`\`bash
npm run test:e2e
\`\`\`

## PR Instructions

Before submitting a PR:
1. Run all tests: \`npm test\`
2. Check linting: \`npm run lint\`
3. Build project: \`npm run build\`
4. Update documentation if needed

### Commit Convention
- feat: New feature
- fix: Bug fix
- docs: Documentation
- refactor: Code refactoring
- test: Tests
- chore: Maintenance

## Architecture Notes

This project uses a modular architecture with:
- Clear separation of concerns
- Component-based structure
- Service layer for business logic
- Proper error handling
- Comprehensive testing

## Coding Conventions

- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Conventional commits
- Test coverage > 80%
- Document complex logic

## Agent Guidelines

When working on this project:
1. Always validate changes with visual testing (Playwright MCP)
2. Ensure all tests pass before marking tasks complete
3. Update specs when requirements change
4. Maintain clean, readable code
5. Follow the established patterns

## Key Files

- Entry point: \`src/index.ts\`
- Configuration: \`package.json\`, \`tsconfig.json\`
- Specifications: \`specs/\`
- Agent tasks: \`agent-todos/\`

## Dependencies

Check \`package.json\` for full list of dependencies.

## Notes

This file is automatically read by AI agents to understand the project context.
Keep it updated with important project-specific information.
`;
    
    await fs.writeFile(agentsMdPath, content);
    this.emit('agents-md-created', agentsMdPath);
  }

  /**
   * Validate all projects in workspace
   */
  async validateAllProjects(): Promise<Map<string, StructureValidationResult>> {
    console.log('🔍 Validating all projects in workspace...');
    
    const results = new Map<string, StructureValidationResult>();
    
    if (!await fs.pathExists(this.workspacePath)) {
      console.log('  No workspace folder found');
      return results;
    }
    
    const projects = await fs.readdir(this.workspacePath);
    
    for (const project of projects) {
      if (project.startsWith('.')) continue; // Skip hidden folders
      
      const projectPath = path.join(this.workspacePath, project);
      const stats = await fs.stat(projectPath);
      
      if (stats.isDirectory()) {
        const result = await this.validateProjectStructure(projectPath);
        results.set(project, result);
      }
    }
    
    // Summary
    const validCount = Array.from(results.values()).filter(r => r.valid).length;
    const totalCount = results.size;
    
    console.log(`\n📊 Validation Summary:`);
    console.log(`  ✅ Valid: ${validCount}/${totalCount}`);
    
    if (validCount < totalCount) {
      console.log(`  ⚠️ Issues found in ${totalCount - validCount} projects`);
    }
    
    return results;
  }

  /**
   * Get workspace path
   */
  getWorkspacePath(): string {
    return this.workspacePath;
  }

  /**
   * Check if path is in workspace
   */
  isInWorkspace(projectPath: string): boolean {
    return projectPath.startsWith(this.workspacePath);
  }
}

export default ProjectStructureValidator;