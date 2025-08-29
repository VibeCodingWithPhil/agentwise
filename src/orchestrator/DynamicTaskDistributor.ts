import * as fs from 'fs-extra';
import * as path from 'path';
import { Phase } from './PhaseController';
import { ProjectSpecs } from './SpecGenerator';
import { AgentSelector } from '../agents/AgentSelector';
import { DynamicAgentManager } from './DynamicAgentManager';

export interface AgentTask {
  description: string;
  priority: number;
  dependencies: string[];
}

export interface ProjectAnalysis {
  requiredAgents: string[];
  reasoning: string;
  requiresDatabase: boolean;
  requiresFrontend: boolean;
  requiresBackend: boolean;
  requiresDevOps: boolean;
  requiresTesting: boolean;
  customAgentsNeeded: string[];
}

export class DynamicTaskDistributor {
  private agentSelector: AgentSelector;
  private agentManager: DynamicAgentManager;
  
  constructor() {
    this.agentSelector = new AgentSelector();
    this.agentManager = new DynamicAgentManager();
  }

  /**
   * Analyze project requirements and determine which agents are needed
   */
  async analyzeProjectRequirements(specs: ProjectSpecs): Promise<ProjectAnalysis> {
    const mainSpec = specs.mainSpec || '';
    const projectSpec = specs.projectSpec || '';
    const todoSpec = specs.todoSpec || '';
    
    const fullContext = `${mainSpec}\n${projectSpec}\n${todoSpec}`.toLowerCase();
    
    // Analyze what the project needs
    const analysis: ProjectAnalysis = {
      requiredAgents: [],
      reasoning: '',
      requiresDatabase: false,
      requiresFrontend: false,
      requiresBackend: false,
      requiresDevOps: false,
      requiresTesting: true, // Always include testing
      customAgentsNeeded: []
    };

    // Check for frontend requirements
    if (this.checkForFrontend(fullContext)) {
      analysis.requiresFrontend = true;
      analysis.requiredAgents.push('frontend-specialist');
    }

    // Check for backend requirements
    if (this.checkForBackend(fullContext)) {
      analysis.requiresBackend = true;
      analysis.requiredAgents.push('backend-specialist');
    }

    // Check for database requirements
    if (this.checkForDatabase(fullContext)) {
      analysis.requiresDatabase = true;
      analysis.requiredAgents.push('database-specialist');
    }

    // Check for DevOps requirements
    if (this.checkForDevOps(fullContext)) {
      analysis.requiresDevOps = true;
      analysis.requiredAgents.push('devops-specialist');
    }

    // Always include testing specialist
    analysis.requiredAgents.push('testing-specialist');

    // Check for code review needs
    if (this.checkForCodeReview(fullContext)) {
      analysis.customAgentsNeeded.push('code-review-specialist');
      analysis.requiredAgents.push('code-review-specialist');
    }

    // Check for deployment needs
    if (this.checkForDeployment(fullContext)) {
      analysis.customAgentsNeeded.push('deployment-specialist');
      analysis.requiredAgents.push('deployment-specialist');
    }

    // Use AgentSelector for more sophisticated selection
    const selectionResult = await this.agentSelector.selectAgents(
      `${specs.mainSpec}\n${specs.projectSpec}`
    );
    
    // Merge selected agents with our analysis
    for (const agent of selectionResult.selectedAgents) {
      if (!analysis.requiredAgents.includes(agent)) {
        analysis.requiredAgents.push(agent);
      }
    }

    analysis.reasoning = this.generateReasoning(analysis);
    
    return analysis;
  }

  /**
   * Distribute tasks to only the required agents
   */
  async distribute(
    specs: ProjectSpecs, 
    phases: Phase[],
    projectPath: string
  ): Promise<Record<string, AgentTask[][]>> {
    // First analyze what agents are needed
    const analysis = await this.analyzeProjectRequirements(specs);
    
    console.log('📊 Project Analysis:');
    console.log(`   Required agents: ${analysis.requiredAgents.join(', ')}`);
    console.log(`   Reasoning: ${analysis.reasoning}`);
    
    // Get all available agents
    await this.agentManager.scanForAgents();
    const allAgents = await this.agentManager.getAgents();
    
    // Filter to only required agents that exist
    const availableAgentNames = allAgents.map(a => a.name);
    const agentsToUse = analysis.requiredAgents.filter(
      agent => availableAgentNames.includes(agent)
    );
    
    // Add any missing custom agents that were detected
    for (const customAgent of analysis.customAgentsNeeded) {
      if (availableAgentNames.includes(customAgent) && !agentsToUse.includes(customAgent)) {
        agentsToUse.push(customAgent);
      }
    }
    
    console.log(`✅ Using agents: ${agentsToUse.join(', ')}`);
    
    // Create agent-todos folders only for required agents
    await this.createAgentTodoFolders(projectPath, agentsToUse, phases.length);
    
    // Initialize task distribution
    const agentTasks: Record<string, AgentTask[][]> = {};
    for (const agent of agentsToUse) {
      agentTasks[agent] = [];
      for (let i = 0; i < phases.length; i++) {
        agentTasks[agent][i] = [];
      }
    }
    
    // Parse and distribute tasks
    const tasks = this.parseTasks(specs.todoSpec);
    
    for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
      const phaseTasks = this.getPhaseTasks(tasks, phaseIndex, phases.length);
      
      for (const task of phaseTasks) {
        const agent = this.determineAgent(task, agentsToUse);
        if (agent && agentTasks[agent]) {
          agentTasks[agent][phaseIndex].push(task);
        }
      }
    }
    
    return agentTasks;
  }

  /**
   * Create agent-todos folders only for required agents
   */
  private async createAgentTodoFolders(
    projectPath: string, 
    agents: string[], 
    phaseCount: number
  ): Promise<void> {
    const agentTodoPath = path.join(projectPath, 'agent-todos');
    
    // Create main agent-todos directory
    await fs.ensureDir(agentTodoPath);
    
    // Create folders only for required agents
    for (const agent of agents) {
      const agentPath = path.join(agentTodoPath, agent);
      await fs.ensureDir(agentPath);
      
      // Create phase files for this agent
      for (let phase = 1; phase <= phaseCount; phase++) {
        const phaseFile = path.join(agentPath, `phase${phase}-todo.md`);
        if (!await fs.pathExists(phaseFile)) {
          await fs.writeFile(phaseFile, `# Phase ${phase} Tasks for ${agent}\n\n`);
        }
      }
    }
    
    console.log(`📁 Created agent-todos folders for: ${agents.join(', ')}`);
  }

  // Check methods for different requirements
  private checkForFrontend(context: string): boolean {
    const frontendKeywords = [
      'ui', 'interface', 'frontend', 'react', 'vue', 'angular', 
      'component', 'webpage', 'website', 'css', 'style', 'design',
      'responsive', 'html', 'browser', 'client-side', 'user interface'
    ];
    return frontendKeywords.some(keyword => context.includes(keyword));
  }

  private checkForBackend(context: string): boolean {
    const backendKeywords = [
      'api', 'server', 'backend', 'endpoint', 'rest', 'graphql',
      'authentication', 'authorization', 'middleware', 'route',
      'controller', 'service', 'business logic', 'server-side'
    ];
    return backendKeywords.some(keyword => context.includes(keyword));
  }

  private checkForDatabase(context: string): boolean {
    const dbKeywords = [
      'database', 'sql', 'mysql', 'postgresql', 'mongodb', 'redis',
      'schema', 'migration', 'model', 'query', 'orm', 'data',
      'persistence', 'storage', 'collection', 'table'
    ];
    return dbKeywords.some(keyword => context.includes(keyword));
  }

  private checkForDevOps(context: string): boolean {
    const devopsKeywords = [
      'docker', 'kubernetes', 'deploy', 'ci/cd', 'pipeline',
      'container', 'infrastructure', 'aws', 'cloud', 'scaling',
      'monitoring', 'logging', 'production', 'environment'
    ];
    return devopsKeywords.some(keyword => context.includes(keyword));
  }

  private checkForCodeReview(context: string): boolean {
    const reviewKeywords = [
      'review', 'quality', 'code quality', 'best practices',
      'standards', 'clean code', 'refactor', 'optimize',
      'security', 'vulnerability', 'audit', 'analysis'
    ];
    return reviewKeywords.some(keyword => context.includes(keyword));
  }

  private checkForDeployment(context: string): boolean {
    const deployKeywords = [
      'deploy', 'production', 'release', 'publish',
      'hosting', 'server setup', 'domain', 'ssl',
      'cdn', 'load balancer', 'scaling', 'go live'
    ];
    return deployKeywords.some(keyword => context.includes(keyword));
  }

  private generateReasoning(analysis: ProjectAnalysis): string {
    const parts: string[] = [];
    
    if (analysis.requiresFrontend) {
      parts.push('Frontend needed for UI/interface');
    }
    if (analysis.requiresBackend) {
      parts.push('Backend needed for server/API');
    }
    if (analysis.requiresDatabase) {
      parts.push('Database needed for data persistence');
    }
    if (analysis.requiresDevOps) {
      parts.push('DevOps needed for deployment/infrastructure');
    }
    if (analysis.customAgentsNeeded.length > 0) {
      parts.push(`Custom agents: ${analysis.customAgentsNeeded.join(', ')}`);
    }
    
    return parts.join('; ');
  }

  private parseTasks(todoSpec: string): AgentTask[] {
    const lines = todoSpec.split('\n');
    const tasks: AgentTask[] = [];
    
    for (const line of lines) {
      const taskMatch = line.match(/^[-*]\s+\[?\s*\]?\s*(.+)/);
      if (taskMatch) {
        tasks.push({
          description: taskMatch[1].trim(),
          priority: this.determinePriority(taskMatch[1]),
          dependencies: this.extractDependencies(taskMatch[1])
        });
      }
    }
    
    return tasks;
  }

  private getPhaseTasks(allTasks: AgentTask[], phaseIndex: number, totalPhases: number): AgentTask[] {
    const tasksPerPhase = Math.ceil(allTasks.length / totalPhases);
    const start = phaseIndex * tasksPerPhase;
    const end = Math.min(start + tasksPerPhase, allTasks.length);
    return allTasks.slice(start, end);
  }

  private determineAgent(task: AgentTask, availableAgents: string[]): string {
    const desc = task.description.toLowerCase();
    
    // Dynamic keyword mapping based on available agents
    const agentScores: Map<string, number> = new Map();
    
    for (const agent of availableAgents) {
      let score = 0;
      const agentName = agent.toLowerCase();
      
      // Score based on agent name matching
      if (desc.includes(agentName.replace('-specialist', ''))) {
        score += 3;
      }
      
      // Specific keyword matching
      if (agent === 'frontend-specialist' && this.checkForFrontend(desc)) {
        score += 2;
      }
      if (agent === 'backend-specialist' && this.checkForBackend(desc)) {
        score += 2;
      }
      if (agent === 'database-specialist' && this.checkForDatabase(desc)) {
        score += 2;
      }
      if (agent === 'devops-specialist' && this.checkForDevOps(desc)) {
        score += 2;
      }
      if (agent === 'testing-specialist' && desc.includes('test')) {
        score += 2;
      }
      if (agent === 'code-review-specialist' && this.checkForCodeReview(desc)) {
        score += 2;
      }
      if (agent === 'deployment-specialist' && this.checkForDeployment(desc)) {
        score += 2;
      }
      
      agentScores.set(agent, score);
    }
    
    // Find agent with highest score
    let bestAgent = availableAgents[0];
    let bestScore = 0;
    
    for (const [agent, score] of agentScores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }
    
    return bestAgent;
  }

  private determinePriority(description: string): number {
    const desc = description.toLowerCase();
    
    if (desc.includes('critical') || desc.includes('setup') || desc.includes('initialize')) {
      return 1;
    }
    if (desc.includes('implement') || desc.includes('create')) {
      return 2;
    }
    if (desc.includes('optimize') || desc.includes('document')) {
      return 3;
    }
    
    return 2;
  }

  private extractDependencies(description: string): string[] {
    const dependencies: string[] = [];
    const depMatch = description.match(/\(depends on: ([^)]+)\)/);
    
    if (depMatch) {
      dependencies.push(...depMatch[1].split(',').map(d => d.trim()));
    }
    
    return dependencies;
  }
}