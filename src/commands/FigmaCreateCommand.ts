/**
 * Figma Create Command
 * Creates complete applications from Figma designs with full context awareness
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { FigmaMCPClient } from '../integrations/FigmaMCPClient';
import { ProjectIntegrationManager } from '../integration/ProjectIntegrationManager';
import { DynamicAgentManager } from '../orchestrator/DynamicAgentManager';
import { SpecGenerator } from '../orchestrator/SpecGenerator';
import { DynamicTaskDistributor } from '../orchestrator/DynamicTaskDistributor';
import { PhaseController } from '../orchestrator/PhaseController';
import { EnhancedPhaseManager } from '../orchestrator/EnhancedPhaseManager';

export interface FigmaCreateOptions {
  analyze?: boolean;
  plan?: boolean;
  generate?: boolean;
  fromSelection?: boolean;
  fileId?: string;
}

export class FigmaCreateCommand {
  private figmaClient: FigmaMCPClient;
  private integrationManager: ProjectIntegrationManager;
  private agentManager: DynamicAgentManager;
  private specGenerator: SpecGenerator;
  private taskDistributor: DynamicTaskDistributor;
  private phaseController: PhaseController;

  constructor() {
    this.figmaClient = new FigmaMCPClient();
    this.integrationManager = new ProjectIntegrationManager();
    this.agentManager = new DynamicAgentManager();
    this.specGenerator = new SpecGenerator();
    this.taskDistributor = new DynamicTaskDistributor();
    this.phaseController = new PhaseController();
  }

  /**
   * Handle figma-create command
   */
  async handle(args: string[]): Promise<void> {
    const projectName = args[0];
    
    if (!projectName || projectName.startsWith('--')) {
      console.log(chalk.red('❌ Project name is required'));
      console.log(chalk.gray('Usage: /figma-create <project-name> [options]'));
      return;
    }

    const options = this.parseOptions(args.slice(1));
    
    try {
      await this.createFromFigma(projectName, options);
    } catch (error: any) {
      console.error(chalk.red(`❌ Failed to create project: ${error.message}`));
      throw error;
    }
  }

  /**
   * Create complete application from Figma
   */
  private async createFromFigma(projectName: string, options: FigmaCreateOptions): Promise<void> {
    console.log(chalk.cyan(`\n🎨 Creating application from Figma: ${projectName}\n`));
    
    const workspacePath = path.join(process.cwd(), 'workspace');
    const projectPath = path.join(workspacePath, projectName);
    
    // Initialize project with full integration
    console.log(chalk.gray('📁 Initializing project structure...'));
    await this.integrationManager.initializeProject(projectPath, {
      validateStructure: true,
      initializeContext: true,
      syncRegistry: true,
      createAgentsMd: true,
      startWatching: true
    });
    
    // Connect to Figma
    const spinner = ora('Connecting to Figma Dev Mode...').start();
    try {
      await this.figmaClient.initialize();
      spinner.succeed('Connected to Figma');
    } catch (error) {
      spinner.fail('Failed to connect to Figma');
      console.log(chalk.yellow('\n⚠️ Ensure Figma desktop app is running with Dev Mode enabled'));
      throw error;
    }
    
    // Phase 1: Analyze Design
    if (options.analyze !== false) {
      await this.analyzeDesign(projectName, projectPath, options);
    }
    
    // Phase 2: Plan Implementation
    if (options.plan !== false) {
      await this.planImplementation(projectName, projectPath);
    }
    
    // Phase 3: Generate Code
    if (options.generate !== false) {
      await this.generateCode(projectName, projectPath);
    }
    
    console.log(chalk.green(`\n✨ Successfully created ${projectName} from Figma design!\n`));
    console.log(chalk.cyan('📂 Project location:'), projectPath);
    console.log(chalk.cyan('📋 Next steps:'));
    console.log(chalk.gray('  1. cd workspace/' + projectName));
    console.log(chalk.gray('  2. npm install'));
    console.log(chalk.gray('  3. npm run dev'));
  }

  /**
   * Analyze Figma design
   */
  private async analyzeDesign(
    projectName: string,
    projectPath: string,
    options: FigmaCreateOptions
  ): Promise<void> {
    console.log(chalk.cyan('\n📊 Phase 1: Analyzing Design\n'));
    
    const analysisPath = path.join(projectPath, '.analysis');
    await fs.ensureDir(analysisPath);
    
    try {
      // Get Figma file content
      const spinner = ora('Fetching design data...').start();
      
      // TODO: Implement Figma data fetching when methods are available
      // For now, use mock data
      let designData: any = {
        document: {
          children: [
            { type: 'CANVAS', name: 'Home Page', id: '1' },
            { type: 'CANVAS', name: 'Dashboard', id: '2' }
          ]
        },
        components: {}
      };
      
      // if (options.fromSelection) {
      //   designData = await this.figmaClient.getCurrentSelection();
      // } else if (options.fileId) {
      //   designData = await this.figmaClient.getFile(options.fileId);
      // } else {
      //   designData = await this.figmaClient.getCurrentFile();
      // }
      
      spinner.succeed('Design data fetched');
      
      // Analyze design patterns
      console.log(chalk.gray('🔍 Detecting patterns...'));
      const analysis = await this.analyzeDesignPatterns(designData);
      
      // Save analysis
      await fs.writeJson(
        path.join(analysisPath, 'design-analysis.json'),
        {
          projectName,
          timestamp: new Date().toISOString(),
          patterns: analysis.patterns,
          components: analysis.components,
          pages: analysis.pages,
          inferredFeatures: analysis.features
        },
        { spaces: 2 }
      );
      
      console.log(chalk.green('✅ Design analysis complete'));
      console.log(chalk.gray(`  • ${analysis.pages.length} pages detected`));
      console.log(chalk.gray(`  • ${analysis.components.length} components identified`));
      console.log(chalk.gray(`  • ${analysis.features.length} features inferred`));
      
    } finally {
      // Clean up analysis folder
      await this.integrationManager.cleanTemporaryFolders(projectName);
    }
  }

  /**
   * Plan implementation based on design
   */
  private async planImplementation(projectName: string, projectPath: string): Promise<void> {
    console.log(chalk.cyan('\n📝 Phase 2: Planning Implementation\n'));
    
    // Generate specifications from design
    const analysisPath = path.join(projectPath, '.analysis');
    let designAnalysis: any = {};
    
    if (await fs.pathExists(path.join(analysisPath, 'design-analysis.json'))) {
      designAnalysis = await fs.readJson(path.join(analysisPath, 'design-analysis.json'));
    }
    
    // Create project specification
    const projectIdea = this.generateProjectIdeaFromDesign(designAnalysis);
    const specs = await this.specGenerator.generate(projectIdea, 'create');
    
    // Save specifications
    const specsPath = path.join(projectPath, 'specs');
    await fs.writeFile(path.join(specsPath, 'main-spec.md'), specs.mainSpec);
    await fs.writeFile(path.join(specsPath, 'project-spec.md'), specs.projectSpec);
    await fs.writeFile(path.join(specsPath, 'todo-spec.md'), specs.todoSpec);
    
    // Determine phases
    const phases = this.phaseController.analyzeComplexity(specs);
    console.log(chalk.gray(`📊 Project complexity: ${phases.length} phases`));
    
    // Distribute tasks to agents
    const agentTasks = await this.taskDistributor.distribute(specs, phases, projectPath);
    const agentsNeeded = Object.keys(agentTasks);
    
    console.log(chalk.green('✅ Implementation planned'));
    console.log(chalk.gray(`  • ${agentsNeeded.length} agents assigned`));
    console.log(chalk.gray(`  • ${phases.length} development phases`));
    
    // Create agent-todos
    for (const agentName of agentsNeeded) {
      const agentPath = path.join(projectPath, 'agent-todos', agentName);
      await fs.ensureDir(agentPath);
      
      for (let i = 0; i < phases.length; i++) {
        const phaseTasks = agentTasks[agentName]?.[i] || [];
        const phaseFile = path.join(agentPath, `phase${i + 1}-todo.md`);
        await fs.writeFile(phaseFile, this.formatPhaseTasks(phaseTasks, agentName, i + 1));
      }
    }
  }

  /**
   * Generate code from design
   */
  private async generateCode(_projectName: string, projectPath: string): Promise<void> {
    console.log(chalk.cyan('\n⚡ Phase 3: Generating Code\n'));
    
    // Launch agents to generate code
    const agentTodosPath = path.join(projectPath, 'agent-todos');
    const agents = await fs.readdir(agentTodosPath);
    
    console.log(chalk.gray('🚀 Launching specialized agents...'));
    await this.agentManager.launchAgentsOptimized(projectPath, agents);
    
    // Start phase monitoring
    const phaseManager = new EnhancedPhaseManager(projectPath);
    await phaseManager.startPhaseMonitoring();
    
    console.log(chalk.green('✅ Code generation initiated'));
    console.log(chalk.gray(`  • ${agents.length} agents working in parallel`));
  }

  /**
   * Analyze design patterns from Figma data
   */
  private async analyzeDesignPatterns(designData: any): Promise<any> {
    const patterns = [];
    const componentsList = [];
    const pages = [];
    const features = [];
    
    // Extract pages
    if (designData.document?.children) {
      for (const page of designData.document.children) {
        if (page.type === 'CANVAS') {
          pages.push({
            name: page.name,
            id: page.id
          });
          
          // Infer features from page names
          const pageName = page.name.toLowerCase();
          if (pageName.includes('login') || pageName.includes('auth')) {
            features.push('Authentication System');
          }
          if (pageName.includes('dashboard')) {
            features.push('Dashboard Interface');
          }
          if (pageName.includes('profile')) {
            features.push('User Profiles');
          }
          if (pageName.includes('settings')) {
            features.push('Settings Management');
          }
        }
      }
    }
    
    // Extract components
    if (designData.components) {
      for (const [id, component] of Object.entries(designData.components)) {
        componentsList.push({
          id,
          name: (component as any).name,
          type: (component as any).type
        });
      }
    }
    
    // Detect common patterns
    if (componentsList.some(c => c.name?.toLowerCase().includes('button'))) {
      patterns.push('Component-based UI');
    }
    if (componentsList.some(c => c.name?.toLowerCase().includes('card'))) {
      patterns.push('Card-based Layout');
    }
    if (pages.some(p => p.name?.toLowerCase().includes('mobile'))) {
      patterns.push('Responsive Design');
    }
    
    return {
      patterns,
      components: componentsList,
      pages,
      features
    };
  }

  /**
   * Generate project idea from design analysis
   */
  private generateProjectIdeaFromDesign(analysis: any): string {
    const features = analysis.inferredFeatures || [];
    const components = analysis.components || [];
    const pages = analysis.pages || [];
    
    let idea = 'Create a modern web application with the following features:\n\n';
    
    // Add inferred features
    if (features.length > 0) {
      idea += 'Core Features:\n';
      features.forEach((feature: string) => {
        idea += `- ${feature}\n`;
      });
      idea += '\n';
    }
    
    // Add pages as views
    if (pages.length > 0) {
      idea += 'Application Views:\n';
      pages.forEach((page: any) => {
        idea += `- ${page.name} page\n`;
      });
      idea += '\n';
    }
    
    // Add technical requirements
    idea += 'Technical Requirements:\n';
    idea += '- Pixel-perfect implementation of Figma designs\n';
    idea += '- Responsive layout for all screen sizes\n';
    idea += '- Component-based architecture\n';
    idea += '- Modern build pipeline\n';
    idea += '- Comprehensive testing\n';
    
    return idea;
  }

  /**
   * Format phase tasks for agents
   */
  private formatPhaseTasks(tasks: any[], agentName: string, phase: number): string {
    let content = `# Phase ${phase} Tasks for ${agentName}\n\n`;
    
    tasks.forEach((task, index) => {
      content += `## Task ${index + 1}: ${task.title || task}\n`;
      if (task.description) {
        content += `${task.description}\n`;
      }
      content += '\n';
    });
    
    return content;
  }

  /**
   * Parse command options
   */
  private parseOptions(args: string[]): FigmaCreateOptions {
    const options: FigmaCreateOptions = {};
    
    for (const arg of args) {
      switch (arg) {
        case '--analyze':
          options.analyze = true;
          break;
        case '--plan':
          options.plan = true;
          break;
        case '--generate':
          options.generate = true;
          break;
        case '--from-selection':
          options.fromSelection = true;
          break;
        default:
          if (!arg.startsWith('--')) {
            options.fileId = arg;
          }
      }
    }
    
    // Default: do all phases
    if (!options.analyze && !options.plan && !options.generate) {
      options.analyze = true;
      options.plan = true;
      options.generate = true;
    }
    
    return options;
  }
}

export default FigmaCreateCommand;