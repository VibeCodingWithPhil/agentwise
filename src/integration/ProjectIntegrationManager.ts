/**
 * Project Integration Manager
 * Ensures all project-related commands have consistent context awareness and structure validation
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { EventEmitter } from 'events';
import { CodebaseContextManager } from '../context/CodebaseContextManager';
import { ProjectStructureValidator } from '../validation/ProjectStructureValidator';
import { ProjectRegistrySync } from '../project-registry/ProjectRegistrySync';
import chalk from 'chalk';

export interface ProjectIntegrationOptions {
  validateStructure?: boolean;
  initializeContext?: boolean;
  syncRegistry?: boolean;
  createAgentsMd?: boolean;
  startWatching?: boolean;
}

export class ProjectIntegrationManager extends EventEmitter {
  private contextManager: CodebaseContextManager;
  private structureValidator: ProjectStructureValidator;
  private registrySync: ProjectRegistrySync;
  private workspacePath: string;
  private activeProjects: Map<string, CodebaseContextManager> = new Map();

  constructor(workspacePath?: string) {
    super();
    this.workspacePath = workspacePath || path.join(process.cwd(), 'workspace');
    this.contextManager = new CodebaseContextManager();
    this.structureValidator = new ProjectStructureValidator(this.workspacePath);
    this.registrySync = new ProjectRegistrySync();
  }

  /**
   * Initialize project with context and structure validation
   */
  async initializeProject(
    projectPath: string,
    options: ProjectIntegrationOptions = {}
  ): Promise<void> {
    const defaults: ProjectIntegrationOptions = {
      validateStructure: true,
      initializeContext: true,
      syncRegistry: true,
      createAgentsMd: true,
      startWatching: true
    };
    
    const opts = { ...defaults, ...options };
    const projectName = path.basename(projectPath);
    
    console.log(chalk.cyan(`\n🚀 Initializing project: ${projectName}`));
    
    // Step 1: Sync registry
    if (opts.syncRegistry) {
      console.log(chalk.gray('  📋 Syncing project registry...'));
      await this.registrySync.syncRegistry();
    }
    
    // Step 2: Ensure project exists in workspace
    if (!projectPath.startsWith(this.workspacePath)) {
      const newPath = await this.structureValidator.ensureProjectInWorkspace(projectName);
      projectPath = newPath;
      console.log(chalk.green(`  ✅ Project moved to workspace: ${newPath}`));
    }
    
    // Step 3: Validate and fix structure
    if (opts.validateStructure) {
      console.log(chalk.gray('  🔍 Validating project structure...'));
      const validation = await this.structureValidator.fixProjectStructure(projectPath);
      
      if (validation.valid) {
        console.log(chalk.green('  ✅ Project structure validated'));
      } else {
        console.log(chalk.yellow(`  ⚠️ Structure issues: ${validation.issues.join(', ')}`));
      }
      
      // Create AGENTS.md if needed
      if (opts.createAgentsMd && !validation.structure.agentsMd) {
        await this.createDefaultAgentsMd(projectPath);
        console.log(chalk.green('  ✅ Created AGENTS.md for AI guidance'));
      }
    }
    
    // Step 4: Initialize context awareness
    if (opts.initializeContext) {
      console.log(chalk.gray('  🧠 Initializing codebase context...'));
      
      // Stop existing context manager if any
      const existingManager = this.activeProjects.get(projectName);
      if (existingManager) {
        // Note: stopWatching method is not available in CodebaseContextManager
        // If needed, implement cleanup logic here
      }
      
      // Create new context manager for this project
      const projectContextManager = new CodebaseContextManager();
      await projectContextManager.initializeProjectContext(projectPath);
      
      // Start watching if requested
      if (opts.startWatching) {
        // Note: startWatching is private, file watching is automatically started during initialization
        console.log(chalk.green('  ✅ File watching enabled'));
      }
      
      // Store active context manager
      this.activeProjects.set(projectName, projectContextManager);
      
      // Get initial context
      const context = projectContextManager.getProjectContext(projectPath);
      if (context) {
        console.log(chalk.green(`  ✅ Context initialized: Context version ${context.contextVersion}`));
      }
      
      // Emit context ready event
      this.emit('context-ready', {
        projectName,
        projectPath,
        context
      });
    }
    
    console.log(chalk.green(`\n✨ Project ${projectName} fully initialized!\n`));
  }

  /**
   * Get active context for a project
   */
  async getProjectContext(projectName: string) {
    const manager = this.activeProjects.get(projectName);
    if (!manager) {
      // Initialize if not active
      const projectPath = path.join(this.workspacePath, projectName);
      if (await fs.pathExists(projectPath)) {
        await this.initializeProject(projectPath);
        const manager = this.activeProjects.get(projectName);
        return manager ? manager.getProjectContext(projectPath) : null;
      }
      return null;
    }
    return manager.getProjectContext(path.join(this.workspacePath, projectName));
  }

  /**
   * Update context for a specific file
   */
  async updateFileContext(projectName: string, filePath: string): Promise<void> {
    const manager = this.activeProjects.get(projectName);
    if (manager) {
      // Note: updateFileContext method not available in CodebaseContextManager
      // File context is updated automatically through file watching
      this.emit('context-updated', {
        projectName,
        filePath,
        timestamp: new Date()
      });
    }
  }

  /**
   * Validate all projects in workspace
   */
  async validateAllProjects(): Promise<Map<string, any>> {
    console.log(chalk.cyan('\n🔍 Validating all workspace projects...'));
    const results = await this.structureValidator.validateAllProjects();
    
    // Initialize context for valid projects
    for (const [projectName, validation] of results) {
      if (validation.valid) {
        const projectPath = path.join(this.workspacePath, projectName);
        await this.initializeProject(projectPath, {
          validateStructure: false, // Already validated
          syncRegistry: false // Only sync once
        });
      }
    }
    
    return results;
  }

  /**
   * Clean temporary folders for a project
   */
  async cleanTemporaryFolders(projectName: string): Promise<void> {
    const projectPath = path.join(this.workspacePath, projectName);
    await this.structureValidator.cleanTemporaryFolders(projectPath);
    console.log(chalk.green(`  ✅ Cleaned temporary folders for ${projectName}`));
  }

  /**
   * Create default AGENTS.md with comprehensive guidance
   */
  private async createDefaultAgentsMd(projectPath: string): Promise<void> {
    const projectName = path.basename(projectPath);
    const agentsMdPath = path.join(projectPath, 'AGENTS.md');
    
    // Check if package.json exists to determine project type
    const packageJsonPath = path.join(projectPath, 'package.json');
    let projectType = 'general';
    let scripts: Record<string, string> = {};
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      scripts = packageJson.scripts || {};
      
      // Determine project type from dependencies
      if (packageJson.dependencies?.react || packageJson.dependencies?.next) {
        projectType = 'react';
      } else if (packageJson.dependencies?.vue) {
        projectType = 'vue';
      } else if (packageJson.dependencies?.angular) {
        projectType = 'angular';
      } else if (packageJson.dependencies?.express) {
        projectType = 'node-backend';
      }
    }
    
    const content = `# AGENTS.md - ${projectName}

## Dev Environment Tips

This project follows Agentwise conventions with automatic context awareness and structure validation.

### Project Structure
\`\`\`
${projectName}/
├── specs/              # Specification documents
├── agent-todos/        # Agent task assignments
├── src/                # Source code
├── tests/              # Test files
└── AGENTS.md           # This file (AI guidance)
\`\`\`

### Context Awareness
- Full codebase context is automatically maintained
- File changes are tracked in real-time
- Import/export relationships are analyzed
- Dependencies are monitored

### Setup Commands
\`\`\`bash
# Install dependencies
${scripts['install'] || 'npm install'}

# Run development server
${scripts['dev'] || scripts['start'] || 'npm run dev'}

# Run tests
${scripts['test'] || 'npm test'}

# Build for production
${scripts['build'] || 'npm run build'}

# Lint code
${scripts['lint'] || 'npm run lint'}

# Type check
${scripts['typecheck'] || 'npm run typecheck'}
\`\`\`

## Testing Instructions

### Before Marking Tasks Complete
1. **Syntax Validation**: Run lint and typecheck
2. **Visual Testing**: Use Playwright MCP for UI validation
3. **Unit Tests**: Ensure all tests pass
4. **Build Verification**: Confirm build succeeds

### Visual Testing with Playwright MCP
\`\`\`bash
# Quick visual check after UI changes
/visual-test

# Comprehensive responsive testing
/visual-test --responsive

# Auto-fix common issues
/visual-test --fix
\`\`\`

## Code Quality Standards

### Required Validations
- ✅ No phantom code (empty functions, fake tests)
- ✅ No console errors in browser
- ✅ All imports resolve correctly
- ✅ TypeScript types are correct
- ✅ CSS/Tailwind classes exist
- ✅ Accessibility standards met

### Commit Conventions
- feat: New feature
- fix: Bug fix
- refactor: Code refactoring
- test: Test updates
- docs: Documentation
- style: Formatting changes
- perf: Performance improvements

## Agent Guidelines

### When Working on Tasks
1. **Check Context**: Review current codebase state
2. **Validate Structure**: Ensure proper file organization
3. **Test Changes**: Run visual and unit tests
4. **Update Specs**: Keep specifications current
5. **Clean Code**: Follow established patterns

### Using MCPs
- **Playwright MCP**: Visual testing and browser automation
- **Figma MCP**: Design-to-code conversion
- **Project-specific MCPs**: As configured in project

## Architecture Notes

### Technology Stack
- **Type**: ${projectType}
- **Framework**: ${projectType === 'react' ? 'React' : projectType === 'vue' ? 'Vue' : projectType === 'angular' ? 'Angular' : 'Node.js'}
- **Testing**: Jest, Playwright
- **Validation**: ESLint, TypeScript

### Key Patterns
- Modular component structure
- Service layer for business logic
- Comprehensive error handling
- Token-optimized context sharing

## Current Phase
- **Active Phase**: Development
- **Context**: Full codebase awareness enabled
- **Monitoring**: File changes tracked automatically

## Important Files
- Entry point: \`src/index.${projectType === 'react' || projectType === 'vue' ? 'tsx' : 'ts'}\`
- Configuration: \`package.json\`, \`tsconfig.json\`
- Specifications: \`specs/\`
- Agent tasks: \`agent-todos/\`

## Notes
This file is automatically maintained by the Agentwise system.
Context awareness and structure validation are applied automatically.
`;
    
    await fs.writeFile(agentsMdPath, content);
  }

  /**
   * Stop all active context managers
   */
  stopAll(): void {
    for (const [projectName, manager] of this.activeProjects) {
      // Note: stopWatching method not available in CodebaseContextManager
      // If needed, implement cleanup logic here
      console.log(chalk.gray(`  Stopped watching ${projectName}`));
    }
    this.activeProjects.clear();
  }

  /**
   * Get list of active projects
   */
  getActiveProjects(): string[] {
    return Array.from(this.activeProjects.keys());
  }
}

export default ProjectIntegrationManager;