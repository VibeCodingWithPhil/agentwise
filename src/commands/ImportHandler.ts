/**
 * Import Handler - Properly handles project imports with agent-todos creation
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DynamicAgentManager } from '../orchestrator/DynamicAgentManager';
import { MDFileWatcher } from '../monitoring/MDFileWatcher';
import { ProjectIntegrationManager } from '../integration/ProjectIntegrationManager';

const execAsync = promisify(exec);

export interface ImportResult {
  success: boolean;
  projectName: string;
  projectPath: string;
  selectedAgents: string[];
  message: string;
}

interface ProjectAnalysis {
  technologies: string[];
  projectType: string;
  frameworks: string[];
  buildTools: string[];
  testFrameworks: string[];
  hasBackend: boolean;
  hasFrontend: boolean;
  hasDatabase: boolean;
  hasDocker: boolean;
  hasCI: boolean;
}

interface RegistryProject {
  name: string;
  originalPath: string;
  analysis: ProjectAnalysis;
  status: string;
  workspace?: string;
  selectedAgents?: string[];
  createdAt: string;
}

export class ImportHandler {
  private agentManager: DynamicAgentManager;
  private mdWatcher: MDFileWatcher;
  private integrationManager: ProjectIntegrationManager;

  constructor() {
    this.agentManager = new DynamicAgentManager();
    this.mdWatcher = new MDFileWatcher();
    this.integrationManager = new ProjectIntegrationManager();
  }

  /**
   * Initialize import - analyze external project
   */
  async initImport(): Promise<{ path: string; analysis: any }> {
    console.log('\n📂 Select project folder to import...');
    
    // Get folder path using system dialog
    const selectedPath = await this.selectFolder();
    if (!selectedPath) {
      throw new Error('No folder selected');
    }

    console.log(`\n📍 Selected: ${selectedPath}`);
    console.log('🔍 Analyzing project structure...');

    const analysis = await this.analyzeProject(selectedPath);
    
    // Save to registry for task-import
    await this.saveInitializedImport(selectedPath, analysis);

    console.log('\n✅ Project initialized for import');
    console.log('📋 Detected technologies:', analysis.technologies.join(', '));
    console.log('📁 Project type:', analysis.projectType);
    console.log('\nRun /task-import to complete the import with agent analysis');

    return { path: selectedPath, analysis };
  }

  /**
   * Execute import with proper agent-todos creation
   */
  async executeImport(): Promise<ImportResult> {
    // Get initialized project from registry
    const projects: Record<string, RegistryProject> = await fs.readJson(
      path.join(process.cwd(), 'src', 'project-registry', 'projects.json')
    );

    const importProject = Object.values(projects).find(
      (p: RegistryProject) => p.status === 'initialized'
    );

    if (!importProject) {
      throw new Error('No initialized project found. Run /init-import first');
    }

    const projectName = importProject.name;
    const sourcePath = importProject.originalPath;
    const workspacePath = path.join(process.cwd(), 'workspace');
    const targetPath = path.join(workspacePath, projectName);
    
    // Ensure workspace exists
    await fs.ensureDir(workspacePath);

    console.log(`\n📦 Importing ${projectName}...`);
    console.log(`📂 From: ${sourcePath}`);
    console.log(`📂 To: ${targetPath}`);

    // SECURITY: Validate paths before file operations
    if (!this.validateCopyOperation(sourcePath, targetPath)) {
      throw new Error('Security validation failed: Invalid file copy operation');
    }

    // Copy project to workspace
    await fs.copy(sourcePath, targetPath);
    console.log('✅ Project copied to workspace');
    
    // Initialize project with full integration
    await this.integrationManager.initializeProject(targetPath, {
      validateStructure: true,
      initializeContext: true,
      syncRegistry: true,
      createAgentsMd: true,
      startWatching: true
    });
    
    // Create analysis folder for codebase analysis
    const analysisPath = path.join(targetPath, '.analysis');
    console.log('🔬 Creating analysis workspace...');
    await fs.ensureDir(analysisPath);
    
    // Save analysis results
    await fs.writeFile(
      path.join(analysisPath, 'import-analysis.json'),
      JSON.stringify({
        projectName,
        sourcePath,
        analysis: importProject.analysis,
        importDate: new Date().toISOString(),
        status: 'analyzing'
      }, null, 2)
    );

    // Analyze and select agents using full codebase context
    console.log('\n🤖 Selecting specialized agents...');
    const projectContext = await this.integrationManager.getProjectContext(projectName);
    const selectedAgents = await this.selectAgentsForProject(importProject.analysis, projectContext);
    
    console.log(`✅ Selected ${selectedAgents.length} agents:`);
    selectedAgents.forEach(agent => console.log(`   • ${agent}`));

    // Generate project specifications based on existing code
    console.log('\n🔧 Generating project specifications...');
    await this.generateProjectSpecs(projectName, targetPath, importProject.analysis);

    // Create agent-todos folders and phase files (note the 's' for consistency)
    console.log('\n📁 Creating agent-todos folders...');
    await this.createAgentTodoFolders(projectName, selectedAgents);

    // Generate initial tasks for each agent
    console.log('\n📝 Generating analysis tasks...');
    await this.generateImportTasks(projectName, selectedAgents, importProject.analysis);

    // Update project status
    importProject.status = 'imported';
    importProject.workspace = targetPath;
    importProject.selectedAgents = selectedAgents;
    await fs.writeJson(
      path.join(process.cwd(), 'src', 'project-registry', 'projects.json'),
      projects,
      { spaces: 2 }
    );

    // Initialize monitoring for the new project
    await this.initializeMonitoring(projectName);
    
    // Clean up analysis folder and other temporary folders after successful setup
    console.log('🧹 Cleaning up analysis workspace...');
    await fs.remove(analysisPath);
    await this.integrationManager.cleanTemporaryFolders(projectName);

    // Launch agents in parallel
    console.log('\n🚀 Launching agents for parallel analysis...');
    await this.launchAgents(projectName, selectedAgents);

    return {
      success: true,
      projectName,
      projectPath: targetPath,
      selectedAgents,
      message: `Successfully imported ${projectName} with ${selectedAgents.length} agents working in parallel`
    };
  }

  /**
   * Select folder using secure input prompt
   * SECURITY FIX: Replaced command injection-prone shell commands with secure user input
   */
  private async selectFolder(): Promise<string | null> {
    console.log('\n📁 Project Folder Selection');
    console.log('Please enter the full path to the project folder you want to import:');
    console.log('Example: /Users/username/my-project or C:\\Users\\username\\my-project');
    
    try {
      // Use readline for secure user input instead of executing shell commands
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      return new Promise((resolve) => {
        rl.question('Project folder path: ', (answer: string) => {
          rl.close();
          
          // Validate the input path securely
          const sanitizedPath = this.validateAndSanitizePath(answer.trim());
          if (sanitizedPath && fs.existsSync(sanitizedPath) && fs.statSync(sanitizedPath).isDirectory()) {
            console.log(`✅ Valid project folder: ${sanitizedPath}`);
            resolve(sanitizedPath);
          } else {
            console.log('❌ Invalid path or directory does not exist');
            console.log('Please ensure the path exists and is a directory');
            resolve(null);
          }
        });
      });
    } catch (error) {
      console.error('Failed to get user input:', error);
      return null;
    }
  }

  /**
   * SECURITY: Validate and sanitize file paths to prevent path traversal attacks
   */
  private validateAndSanitizePath(inputPath: string): string | null {
    try {
      // Basic input validation
      if (!inputPath || typeof inputPath !== 'string' || inputPath.length === 0) {
        return null;
      }

      // Remove leading/trailing whitespace and quotes
      let cleanPath = inputPath.trim().replace(/^["']|["']$/g, '');

      // Check for obvious path traversal attempts
      const dangerousPatterns = ['../', '..\\', '../', '~/', '${', '`'];
      for (const pattern of dangerousPatterns) {
        if (cleanPath.includes(pattern)) {
          console.log('⚠️  Path contains dangerous patterns - rejected for security');
          return null;
        }
      }

      // Resolve to absolute path
      const resolvedPath = path.resolve(cleanPath);
      
      // Additional security check - ensure path is reasonable
      const rootPath = path.parse(resolvedPath).root;
      if (resolvedPath === rootPath || resolvedPath.length < rootPath.length + 2) {
        console.log('⚠️  Path too close to system root - rejected for security');
        return null;
      }

      return resolvedPath;
    } catch (error) {
      console.log('⚠️  Path validation failed');
      return null;
    }
  }

  /**
   * SECURITY: Validate file copy operations to prevent dangerous operations
   */
  private validateCopyOperation(sourcePath: string, targetPath: string): boolean {
    try {
      // Resolve both paths to absolute paths
      const resolvedSource = path.resolve(sourcePath);
      const resolvedTarget = path.resolve(targetPath);
      
      // Ensure source exists and is readable
      if (!fs.existsSync(resolvedSource)) {
        console.log('⚠️  Source path does not exist');
        return false;
      }

      // Get workspace path for validation
      const workspacePath = path.resolve(process.cwd(), 'workspace');
      
      // Ensure target is within workspace directory
      if (!resolvedTarget.startsWith(workspacePath)) {
        console.log('⚠️  Target path must be within workspace directory');
        return false;
      }

      // Prevent copying system directories or sensitive locations
      const sensitivePatterns = [
        '/etc', '/sys', '/proc', '/dev', '/var', '/usr/bin', '/usr/sbin',
        'C:\\Windows', 'C:\\Program Files', 'C:\\System', '/System',
        '/Library/System', '/Applications', '/.ssh', '/.aws'
      ];

      for (const pattern of sensitivePatterns) {
        if (resolvedSource.toLowerCase().includes(pattern.toLowerCase())) {
          console.log('⚠️  Cannot copy from sensitive system directory');
          return false;
        }
      }

      // Ensure target directory doesn't already exist to prevent overwriting
      if (fs.existsSync(resolvedTarget)) {
        console.log('⚠️  Target directory already exists');
        return false;
      }

      return true;
    } catch (error) {
      console.log('⚠️  Copy operation validation failed');
      return false;
    }
  }

  /**
   * Analyze project structure and technologies
   */
  private async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    const analysis = {
      technologies: [] as string[],
      projectType: 'unknown',
      frameworks: [] as string[],
      buildTools: [] as string[],
      testFrameworks: [] as string[],
      hasBackend: false,
      hasFrontend: false,
      hasDatabase: false,
      hasDocker: false,
      hasCI: false
    };

    // Check for package.json (Node.js)
    if (await fs.pathExists(path.join(projectPath, 'package.json'))) {
      const pkg = await fs.readJson(path.join(projectPath, 'package.json'));
      analysis.technologies.push('Node.js');
      
      // Detect frameworks
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.react) analysis.frameworks.push('React');
      if (deps.vue) analysis.frameworks.push('Vue');
      if (deps.angular) analysis.frameworks.push('Angular');
      if (deps.next) analysis.frameworks.push('Next.js');
      if (deps.express) { analysis.frameworks.push('Express'); analysis.hasBackend = true; }
      if (deps.fastify) { analysis.frameworks.push('Fastify'); analysis.hasBackend = true; }
      if (deps.jest) analysis.testFrameworks.push('Jest');
      if (deps.mocha) analysis.testFrameworks.push('Mocha');
      if (deps.cypress) analysis.testFrameworks.push('Cypress');
      if (deps.playwright) analysis.testFrameworks.push('Playwright');
      
      analysis.hasFrontend = analysis.frameworks.some(f => 
        ['React', 'Vue', 'Angular', 'Next.js'].includes(f)
      );
    }

    // Check for Python
    if (await fs.pathExists(path.join(projectPath, 'requirements.txt')) ||
        await fs.pathExists(path.join(projectPath, 'setup.py')) ||
        await fs.pathExists(path.join(projectPath, 'pyproject.toml'))) {
      analysis.technologies.push('Python');
      analysis.hasBackend = true;
    }

    // Check for Go
    if (await fs.pathExists(path.join(projectPath, 'go.mod'))) {
      analysis.technologies.push('Go');
      analysis.hasBackend = true;
    }

    // Check for database
    if (await fs.pathExists(path.join(projectPath, 'docker-compose.yml'))) {
      const compose = await fs.readFile(path.join(projectPath, 'docker-compose.yml'), 'utf-8');
      if (compose.includes('postgres') || compose.includes('mysql') || compose.includes('mongo')) {
        analysis.hasDatabase = true;
      }
      analysis.hasDocker = true;
    }

    // Check for CI/CD
    if (await fs.pathExists(path.join(projectPath, '.github', 'workflows')) ||
        await fs.pathExists(path.join(projectPath, '.gitlab-ci.yml')) ||
        await fs.pathExists(path.join(projectPath, 'Jenkinsfile'))) {
      analysis.hasCI = true;
    }

    // Determine project type
    if (analysis.hasFrontend && analysis.hasBackend) {
      analysis.projectType = 'fullstack';
    } else if (analysis.hasFrontend) {
      analysis.projectType = 'frontend';
    } else if (analysis.hasBackend) {
      analysis.projectType = 'backend';
    }

    return analysis;
  }

  /**
   * Save initialized import to registry
   */
  private async saveInitializedImport(sourcePath: string, analysis: ProjectAnalysis): Promise<void> {
    const projectName = path.basename(sourcePath);
    const registryPath = path.join(process.cwd(), 'src', 'project-registry', 'projects.json');
    
    let projects: Record<string, RegistryProject> = {};
    if (await fs.pathExists(registryPath)) {
      projects = await fs.readJson(registryPath);
    }

    projects[projectName] = {
      name: projectName,
      originalPath: sourcePath,
      analysis,
      status: 'initialized',
      createdAt: new Date().toISOString()
    };

    await fs.writeJson(registryPath, projects, { spaces: 2 });
  }

  /**
   * Select appropriate agents based on project analysis
   */
  private async selectAgentsForProject(analysis: ProjectAnalysis, projectContext?: any): Promise<string[]> {
    const agents = [];

    // Always include these core agents
    agents.push('orchestrator-specialist');

    // Add agents based on analysis
    if (analysis.hasFrontend) {
      agents.push('frontend-specialist');
      agents.push('designer-specialist');
    }

    if (analysis.hasBackend) {
      agents.push('backend-specialist');
      agents.push('api-specialist');
    }

    if (analysis.hasDatabase) {
      agents.push('database-specialist');
    }

    if (analysis.hasDocker || analysis.hasCI) {
      agents.push('devops-specialist');
    }

    if (analysis.testFrameworks.length > 0) {
      agents.push('testing-specialist');
    }

    // Add code review for any project
    agents.push('code-review-specialist');

    return agents;
  }

  /**
   * Create agent-todos folders with proper structure
   */
  private async createAgentTodoFolders(projectName: string, agents: string[]): Promise<void> {
    const workspacePath = path.join(process.cwd(), 'workspace', projectName);

    for (const agent of agents) {
      // Use 'agent-todos' with 's' for consistency with other commands
      const agentTodoPath = path.join(workspacePath, 'agent-todos', agent);
      await fs.ensureDir(agentTodoPath);

      // Create phase files with proper naming convention
      for (let phase = 1; phase <= 3; phase++) {
        const phaseFile = path.join(agentTodoPath, `phase${phase}-todo.md`);
        if (!await fs.pathExists(phaseFile)) {
          await fs.writeFile(phaseFile, `# Phase ${phase} - ${agent}\n\n## Tasks\n\n`);
        }
      }
      
      // Create phase status file
      const statusFile = path.join(agentTodoPath, 'phase-status.json');
      await fs.writeJson(statusFile, {
        current_phase: 1,
        total_phases: 3,
        completed_phases: [],
        status: 'ready',
        tasks_completed: 0,
        tasks_total: 0
      }, { spaces: 2 });
    }

    console.log(`✅ Created ${agents.length} agent-todos folders`);
  }

  /**
   * Generate import analysis tasks for each agent
   */
  private async generateImportTasks(projectName: string, agents: string[], analysis: ProjectAnalysis): Promise<void> {
    const workspacePath = path.join(process.cwd(), 'workspace', projectName);

    const taskTemplates: Record<string, string[]> = {
      'orchestrator-specialist': [
        '🔍 Analyze overall project architecture',
        '📋 Document project structure and dependencies',
        '🎯 Identify improvement opportunities',
        '📊 Create integration strategy'
      ],
      'frontend-specialist': [
        '🎨 Analyze UI component structure',
        '📱 Review responsive design implementation',
        '⚡ Identify performance bottlenecks',
        '♿ Check accessibility compliance'
      ],
      'backend-specialist': [
        '🔌 Map API endpoints and routes',
        '🔐 Review authentication/authorization',
        '📊 Analyze data flow and business logic',
        '⚡ Identify optimization opportunities'
      ],
      'database-specialist': [
        '🗄️ Analyze database schema',
        '🔍 Review query performance',
        '🔗 Map data relationships',
        '📈 Suggest optimization strategies'
      ],
      'testing-specialist': [
        '🧪 Assess current test coverage',
        '🔍 Identify missing test cases',
        '📋 Review test quality and patterns',
        '🚀 Create comprehensive test strategy'
      ],
      'devops-specialist': [
        '🔧 Review deployment configuration',
        '🔄 Analyze CI/CD pipeline',
        '🐳 Check containerization setup',
        '📊 Evaluate monitoring and logging'
      ],
      'designer-specialist': [
        '🎨 Analyze design consistency',
        '🎯 Review user experience flow',
        '📱 Check responsive design',
        '🎨 Document design system'
      ],
      'api-specialist': [
        '📡 Document API endpoints',
        '📋 Review API contracts',
        '🔐 Check API security',
        '📈 Analyze API performance'
      ],
      'code-review-specialist': [
        '🔍 Review code quality',
        '🐛 Identify potential bugs',
        '🔒 Check security vulnerabilities',
        '📚 Review documentation completeness'
      ]
    };

    // Import MCP manager for task enhancement
    const { MCPIntegrationManager } = await import('../mcp/MCPIntegrationManager');
    const mcpManager = new MCPIntegrationManager();
    
    for (const agent of agents) {
      const phase1File = path.join(workspacePath, 'agent-todos', agent, 'phase1-todo.md');
      const tasks = taskTemplates[agent] || ['📋 Analyze project for your specialization'];
      
      // Get MCPs for this agent
      const agentMCPs = await mcpManager.getAgentMCPs(agent);
      
      let content = `# Phase 1 - ${agent}\n\n## Import Analysis Tasks\n\n`;
      content += `Project Type: ${analysis.projectType}\n`;
      content += `Technologies: ${analysis.technologies.join(', ')}\n`;
      content += `Available MCPs: ${agentMCPs.join(', ') || 'Standard tools only'}\n\n`;
      content += `### Tasks\n\n`;
      
      tasks.forEach((task, index) => {
        // Check if task could benefit from MCPs
        const relevantMCPs = this.identifyRelevantMCPs(task, agentMCPs);
        const mcpNote = relevantMCPs.length > 0 ? ` [MCP: ${relevantMCPs.join(', ')}]` : '';
        content += `${index + 1}. [ ] ${task}${mcpNote}\n`;
      });
      
      content += `\n## MCP Usage Guidelines\n`;
      content += `- Use available MCP tools when relevant to tasks\n`;
      content += `- Document MCP usage in task completion notes\n`;
      content += `- Report any MCP integration issues encountered\n`;

      await fs.writeFile(phase1File, content);
    }

    console.log(`✅ Generated import tasks for ${agents.length} agents`);
  }

  /**
   * Generate project specifications from existing code
   */
  private async generateProjectSpecs(projectName: string, projectPath: string, analysis: ProjectAnalysis): Promise<void> {
    const specsPath = path.join(projectPath, 'specs');
    await fs.ensureDir(specsPath);

    // Generate main spec (use standard naming without project prefix)
    const mainSpec = this.generateMainSpecFromAnalysis(projectName, analysis);
    await fs.writeFile(path.join(specsPath, 'main-spec.md'), mainSpec);

    // Generate project spec
    const projectSpec = this.generateProjectSpecFromAnalysis(projectName, analysis, projectPath);
    await fs.writeFile(path.join(specsPath, 'project-spec.md'), projectSpec);

    // Generate todo spec
    const todoSpec = this.generateTodoSpecFromAnalysis(projectName, analysis);
    await fs.writeFile(path.join(specsPath, 'todo-spec.md'), todoSpec);

    console.log('✅ Generated 3 specification files based on existing codebase');
  }

  private identifyRelevantMCPs(task: string, availableMCPs: string[]): string[] {
    const taskLower = task.toLowerCase();
    const relevant: string[] = [];
    
    const mcpKeywords: Record<string, string[]> = {
      'github': ['repository', 'commit', 'code quality', 'version'],
      'database': ['schema', 'query', 'data', 'database'],
      'docker': ['container', 'deployment', 'docker'],
      'jest': ['test', 'coverage', 'testing'],
      'figma': ['design', 'ui', 'component', 'user experience']
    };
    
    for (const [mcp, keywords] of Object.entries(mcpKeywords)) {
      if (availableMCPs.includes(mcp)) {
        if (keywords.some(keyword => taskLower.includes(keyword))) {
          relevant.push(mcp);
        }
      }
    }
    
    return relevant;
  }
  
  private generateMainSpecFromAnalysis(projectName: string, analysis: ProjectAnalysis): string {
    const spec = [];
    spec.push(`# ${projectName} - Main Specification\n`);
    spec.push(`## Project Overview`);
    spec.push(`Imported existing ${analysis.projectType} project with established codebase.\n`);
    
    spec.push(`## Technology Stack`);
    spec.push(`- **Languages**: ${analysis.technologies.join(', ')}`);
    spec.push(`- **Frameworks**: ${analysis.frameworks.join(', ') || 'None detected'}`);
    spec.push(`- **Build Tools**: ${analysis.buildTools.join(', ') || 'Standard'}`);
    spec.push(`- **Testing**: ${analysis.testFrameworks.join(', ') || 'None detected'}\n`);
    
    spec.push(`## Architecture`);
    if (analysis.hasFrontend) spec.push(`- Frontend application layer`);
    if (analysis.hasBackend) spec.push(`- Backend API/service layer`);
    if (analysis.hasDatabase) spec.push(`- Database persistence layer`);
    if (analysis.hasDocker) spec.push(`- Containerized deployment`);
    if (analysis.hasCI) spec.push(`- CI/CD pipeline configured`);
    spec.push('');
    
    spec.push(`## Import Analysis Required`);
    spec.push(`1. Code structure and organization review`);
    spec.push(`2. Dependency audit and updates`);
    spec.push(`3. Security vulnerability assessment`);
    spec.push(`4. Performance optimization opportunities`);
    spec.push(`5. Documentation completeness check`);
    
    return spec.join('\n');
  }

  private generateProjectSpecFromAnalysis(projectName: string, analysis: ProjectAnalysis, projectPath: string): string {
    const spec = [];
    spec.push(`# ${projectName} - Project Specification\n`);
    
    spec.push(`## Current State Analysis`);
    spec.push(`- **Type**: ${analysis.projectType}`);
    spec.push(`- **Location**: ${projectPath}`);
    spec.push(`- **Import Date**: ${new Date().toISOString()}\n`);
    
    spec.push(`## Detected Components`);
    if (analysis.hasFrontend) {
      spec.push(`### Frontend`);
      spec.push(`- Frameworks: ${analysis.frameworks.filter((f: string) => 
        ['React', 'Vue', 'Angular', 'Next.js'].includes(f)).join(', ') || 'Unknown'}`);
      spec.push(`- UI Components: To be analyzed`);
      spec.push(`- State Management: To be analyzed\n`);
    }
    
    if (analysis.hasBackend) {
      spec.push(`### Backend`);
      spec.push(`- Frameworks: ${analysis.frameworks.filter((f: string) => 
        ['Express', 'Fastify', 'Django', 'Flask'].includes(f)).join(', ') || 'Unknown'}`);
      spec.push(`- API Structure: To be analyzed`);
      spec.push(`- Authentication: To be analyzed\n`);
    }
    
    if (analysis.hasDatabase) {
      spec.push(`### Database`);
      spec.push(`- Type: To be determined`);
      spec.push(`- Schema: To be analyzed`);
      spec.push(`- Migrations: To be checked\n`);
    }
    
    spec.push(`## Enhancement Opportunities`);
    spec.push(`Based on initial analysis, consider:`);
    spec.push(`1. Modernizing dependencies to latest stable versions`);
    spec.push(`2. Implementing missing test coverage`);
    spec.push(`3. Adding comprehensive documentation`);
    spec.push(`4. Optimizing build and deployment processes`);
    spec.push(`5. Enhancing security measures`);
    
    return spec.join('\n');
  }

  private generateTodoSpecFromAnalysis(projectName: string, analysis: ProjectAnalysis): string {
    const spec = [];
    spec.push(`# ${projectName} - Todo Specification\n`);
    
    spec.push(`## Phase 1: Analysis & Assessment`);
    spec.push(`- [ ] Complete codebase analysis`);
    spec.push(`- [ ] Document existing architecture`);
    spec.push(`- [ ] Identify technical debt`);
    spec.push(`- [ ] Create dependency inventory`);
    spec.push(`- [ ] Assess code quality metrics\n`);
    
    spec.push(`## Phase 2: Planning & Design`);
    spec.push(`- [ ] Define improvement roadmap`);
    spec.push(`- [ ] Plan refactoring strategy`);
    spec.push(`- [ ] Design missing components`);
    spec.push(`- [ ] Create testing strategy`);
    spec.push(`- [ ] Plan documentation structure\n`);
    
    spec.push(`## Phase 3: Implementation`);
    spec.push(`- [ ] Implement priority improvements`);
    spec.push(`- [ ] Add missing tests`);
    spec.push(`- [ ] Update documentation`);
    spec.push(`- [ ] Optimize performance`);
    spec.push(`- [ ] Enhance security\n`);
    
    spec.push(`## Technology-Specific Tasks`);
    
    if (analysis.technologies.includes('Node.js')) {
      spec.push(`### Node.js`);
      spec.push(`- [ ] Audit npm packages for vulnerabilities`);
      spec.push(`- [ ] Update to latest LTS version if needed`);
      spec.push(`- [ ] Optimize package.json scripts\n`);
    }
    
    if (analysis.frameworks.includes('React')) {
      spec.push(`### React`);
      spec.push(`- [ ] Check for React best practices`);
      spec.push(`- [ ] Optimize component structure`);
      spec.push(`- [ ] Implement proper error boundaries\n`);
    }
    
    if (analysis.hasDatabase) {
      spec.push(`### Database`);
      spec.push(`- [ ] Review database schema`);
      spec.push(`- [ ] Optimize queries`);
      spec.push(`- [ ] Implement proper indexing\n`);
    }
    
    return spec.join('\n');
  }

  /**
   * Initialize monitoring for the imported project
   */
  private async initializeMonitoring(projectName: string): Promise<void> {
    const workspacePath = path.join(process.cwd(), 'workspace', projectName);
    
    // Start watching the agent-todos folders
    await this.mdWatcher.watchProject(workspacePath);
    
    console.log('✅ Monitoring initialized for imported project');
  }

  /**
   * Launch agents in parallel
   */
  private async launchAgents(projectName: string, agents: string[]): Promise<void> {
    const workspacePath = path.join(process.cwd(), 'workspace', projectName);
    
    // Launch all agents in parallel
    const launchPromises = agents.map(async (agent) => {
      try {
        await this.agentManager.launchAgent(
          { name: agent, role: agent, tools: [] },
          workspacePath
        );
        console.log(`   ✅ Launched ${agent}`);
      } catch (error) {
        console.error(`   ❌ Failed to launch ${agent}:`, error);
      }
    });

    await Promise.all(launchPromises);
    
    console.log('\n🎉 All agents launched and working in parallel!');
    console.log('📊 Monitor their progress at: http://localhost:3001');
  }
}