/**
 * Import Handler - Properly handles project imports with agent-todo creation
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { DynamicAgentManager } from '../orchestrator/DynamicAgentManager';
import { DynamicTaskDistributor } from '../orchestrator/DynamicTaskDistributor';
import { ProjectRegistrySync } from '../project-registry/ProjectRegistrySync';
import { MDFileWatcher } from '../monitoring/MDFileWatcher';

const execAsync = promisify(exec);

export interface ImportResult {
  success: boolean;
  projectName: string;
  projectPath: string;
  selectedAgents: string[];
  message: string;
}

export class ImportHandler {
  private agentManager: DynamicAgentManager;
  private taskDistributor: DynamicTaskDistributor;
  private registrySync: ProjectRegistrySync;
  private mdWatcher: MDFileWatcher;

  constructor() {
    this.agentManager = new DynamicAgentManager();
    this.taskDistributor = new DynamicTaskDistributor();
    this.registrySync = new ProjectRegistrySync();
    this.mdWatcher = new MDFileWatcher();
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
   * Execute import with proper agent-todo creation
   */
  async executeImport(): Promise<ImportResult> {
    // Get initialized project from registry
    const projects = await fs.readJson(
      path.join(process.cwd(), 'src', 'project-registry', 'projects.json')
    );

    const importProject = Object.values(projects).find(
      (p: any) => p.status === 'initialized'
    );

    if (!importProject) {
      throw new Error('No initialized project found. Run /init-import first');
    }

    const projectName = importProject.name;
    const sourcePath = importProject.originalPath;
    const targetPath = path.join(process.cwd(), 'workspace', projectName);

    console.log(`\n📦 Importing ${projectName}...`);
    console.log(`📂 From: ${sourcePath}`);
    console.log(`📂 To: ${targetPath}`);

    // Copy project to workspace
    await fs.copy(sourcePath, targetPath);
    console.log('✅ Project copied to workspace');

    // Analyze and select agents
    console.log('\n🤖 Selecting specialized agents...');
    const selectedAgents = await this.selectAgentsForProject(importProject.analysis);
    
    console.log(`✅ Selected ${selectedAgents.length} agents:`);
    selectedAgents.forEach(agent => console.log(`   • ${agent}`));

    // Generate project specifications based on existing code
    console.log('\n🔧 Generating project specifications...');
    await this.generateProjectSpecs(projectName, targetPath, importProject.analysis);

    // Create agent-todo folders and phase files
    console.log('\n📁 Creating agent-todo folders...');
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
   * Select folder using system dialog
   */
  private async selectFolder(): Promise<string | null> {
    const platform = process.platform;

    try {
      if (platform === 'darwin') {
        // macOS: Use osascript
        const { stdout } = await execAsync(`osascript -e 'POSIX path of (choose folder with prompt "Select project folder to import")'`);
        return stdout.trim();
      } else if (platform === 'win32') {
        // Windows: Use PowerShell
        const { stdout } = await execAsync(`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; $dialog.Description = 'Select project folder to import'; if($dialog.ShowDialog() -eq 'OK'){$dialog.SelectedPath}"`);
        return stdout.trim();
      } else {
        // Linux: Try zenity or kdialog
        try {
          const { stdout } = await execAsync(`zenity --file-selection --directory --title="Select project folder to import"`);
          return stdout.trim();
        } catch {
          const { stdout } = await execAsync(`kdialog --getexistingdirectory . "Select project folder to import"`);
          return stdout.trim();
        }
      }
    } catch (error) {
      console.error('Failed to open folder dialog:', error);
      return null;
    }
  }

  /**
   * Analyze project structure and technologies
   */
  private async analyzeProject(projectPath: string): Promise<any> {
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
  private async saveInitializedImport(sourcePath: string, analysis: any): Promise<void> {
    const projectName = path.basename(sourcePath);
    const registryPath = path.join(process.cwd(), 'src', 'project-registry', 'projects.json');
    
    let projects = {};
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
  private async selectAgentsForProject(analysis: any): Promise<string[]> {
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
   * Create agent-todo folders with proper structure
   */
  private async createAgentTodoFolders(projectName: string, agents: string[]): Promise<void> {
    const workspacePath = path.join(process.cwd(), 'workspace', projectName);

    for (const agent of agents) {
      const agentTodoPath = path.join(workspacePath, 'agent-todo', agent);
      await fs.ensureDir(agentTodoPath);

      // Create phase files
      for (let phase = 1; phase <= 3; phase++) {
        const phaseFile = path.join(agentTodoPath, `phase${phase}.md`);
        if (!await fs.pathExists(phaseFile)) {
          await fs.writeFile(phaseFile, `# Phase ${phase} - ${agent}\n\n## Tasks\n\n`);
        }
      }
    }

    console.log(`✅ Created ${agents.length} agent-todo folders`);
  }

  /**
   * Generate import analysis tasks for each agent
   */
  private async generateImportTasks(projectName: string, agents: string[], analysis: any): Promise<void> {
    const workspacePath = path.join(process.cwd(), 'workspace', projectName);

    const taskTemplates = {
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

    for (const agent of agents) {
      const phase1File = path.join(workspacePath, 'agent-todo', agent, 'phase1.md');
      const tasks = taskTemplates[agent] || ['📋 Analyze project for your specialization'];
      
      let content = `# Phase 1 - ${agent}\n\n## Import Analysis Tasks\n\n`;
      content += `Project Type: ${analysis.projectType}\n`;
      content += `Technologies: ${analysis.technologies.join(', ')}\n\n`;
      content += `### Tasks\n\n`;
      
      tasks.forEach((task, index) => {
        content += `${index + 1}. [ ] ${task}\n`;
      });

      await fs.writeFile(phase1File, content);
    }

    console.log(`✅ Generated import tasks for ${agents.length} agents`);
  }

  /**
   * Generate project specifications from existing code
   */
  private async generateProjectSpecs(projectName: string, projectPath: string, analysis: any): Promise<void> {
    const specsPath = path.join(projectPath, 'specs');
    await fs.ensureDir(specsPath);

    // Generate main spec
    const mainSpec = this.generateMainSpecFromAnalysis(projectName, analysis);
    await fs.writeFile(path.join(specsPath, `${projectName}-main-spec.md`), mainSpec);

    // Generate project spec
    const projectSpec = this.generateProjectSpecFromAnalysis(projectName, analysis, projectPath);
    await fs.writeFile(path.join(specsPath, `${projectName}-project-spec.md`), projectSpec);

    // Generate todo spec
    const todoSpec = this.generateTodoSpecFromAnalysis(projectName, analysis);
    await fs.writeFile(path.join(specsPath, `${projectName}-todo-spec.md`), todoSpec);

    console.log('✅ Generated 3 specification files based on existing codebase');
  }

  private generateMainSpecFromAnalysis(projectName: string, analysis: any): string {
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

  private generateProjectSpecFromAnalysis(projectName: string, analysis: any, projectPath: string): string {
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

  private generateTodoSpecFromAnalysis(projectName: string, analysis: any): string {
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
    
    // Start watching the agent-todo folders
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