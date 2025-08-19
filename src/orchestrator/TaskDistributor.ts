import { Phase } from './PhaseController';
import { ProjectSpecs } from './SpecGenerator';

export interface AgentTask {
  description: string;
  priority: number;
  dependencies: string[];
}

export class TaskDistributor {
  
  async distribute(specs: ProjectSpecs, phases: Phase[]): Promise<Record<string, AgentTask[][]>> {
    const tasks = this.parseTasks(specs.todoSpec);
    const agentTasks: Record<string, AgentTask[][]> = {
      'frontend-specialist': [],
      'backend-specialist': [],
      'database-specialist': [],
      'devops-specialist': [],
      'testing-specialist': []
    };
    
    // Distribute tasks across phases and agents
    for (let phaseIndex = 0; phaseIndex < phases.length; phaseIndex++) {
      const phaseTasks = this.getPhaseTasks(tasks, phaseIndex);
      
      // Initialize phase arrays
      for (const agent in agentTasks) {
        agentTasks[agent][phaseIndex] = [];
      }
      
      // Assign tasks to appropriate agents
      for (const task of phaseTasks) {
        const agent = this.determineAgent(task);
        if (agentTasks[agent]) {
          agentTasks[agent][phaseIndex].push(task);
        }
      }
    }
    
    return agentTasks;
  }
  
  private parseTasks(todoSpec: string): AgentTask[] {
    const lines = todoSpec.split('\n');
    const tasks: AgentTask[] = [];
    
    for (const line of lines) {
      // Detect phase headers
      if (line.startsWith('## Phase')) {
        continue;
      }
      
      // Parse task lines
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
  
  private getPhaseTasks(allTasks: AgentTask[], phaseIndex: number): AgentTask[] {
    // Simple distribution: divide tasks evenly across phases
    // In production, this would be more intelligent
    const tasksPerPhase = Math.ceil(allTasks.length / 5);
    const start = phaseIndex * tasksPerPhase;
    const end = Math.min(start + tasksPerPhase, allTasks.length);
    
    return allTasks.slice(start, end);
  }
  
  private determineAgent(task: AgentTask): string {
    const desc = task.description.toLowerCase();
    
    // Keywords for each agent
    const agentKeywords = {
      'frontend-specialist': ['ui', 'component', 'frontend', 'react', 'vue', 'angular', 'css', 'style', 'design', 'interface', 'routing', 'state'],
      'backend-specialist': ['api', 'server', 'backend', 'endpoint', 'auth', 'middleware', 'business logic', 'validation', 'controller'],
      'database-specialist': ['database', 'schema', 'migration', 'model', 'query', 'sql', 'mongo', 'redis', 'data'],
      'devops-specialist': ['docker', 'deploy', 'ci/cd', 'pipeline', 'container', 'kubernetes', 'infrastructure', 'environment', 'config'],
      'testing-specialist': ['test', 'spec', 'coverage', 'unit', 'integration', 'e2e', 'quality', 'bug', 'fix']
    };
    
    // Score each agent based on keyword matches
    let bestAgent = 'backend-specialist'; // default
    let bestScore = 0;
    
    for (const [agent, keywords] of Object.entries(agentKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (desc.includes(keyword)) {
          score++;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestAgent = agent;
      }
    }
    
    return bestAgent;
  }
  
  private determinePriority(description: string): number {
    const desc = description.toLowerCase();
    
    // High priority keywords
    if (desc.includes('critical') || desc.includes('setup') || desc.includes('initialize')) {
      return 1;
    }
    
    // Medium priority
    if (desc.includes('implement') || desc.includes('create')) {
      return 2;
    }
    
    // Low priority
    if (desc.includes('optimize') || desc.includes('document') || desc.includes('polish')) {
      return 3;
    }
    
    return 2; // default medium
  }
  
  private extractDependencies(description: string): string[] {
    const dependencies: string[] = [];
    
    // Look for explicit dependencies
    const depMatch = description.match(/\(depends on: ([^)]+)\)/);
    if (depMatch) {
      dependencies.push(...depMatch[1].split(',').map(d => d.trim()));
    }
    
    // Infer common dependencies
    const desc = description.toLowerCase();
    
    if (desc.includes('test')) {
      dependencies.push('implementation');
    }
    
    if (desc.includes('deploy')) {
      dependencies.push('testing', 'build');
    }
    
    if (desc.includes('integrate')) {
      dependencies.push('components');
    }
    
    return dependencies;
  }
}