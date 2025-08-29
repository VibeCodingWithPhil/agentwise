import * as fs from 'fs-extra';
import * as path from 'path';
import { ProgressTracker } from '../monitoring/ProgressTracker';

export interface Phase {
  number: number;
  name: string;
  description: string;
  tasks: number;
}

export interface PhaseStatus {
  current_phase: number;
  total_phases: number;
  completed_phases: number[];
  status: 'ready' | 'in_progress' | 'completed' | 'waiting';
  tasks_completed: number;
  tasks_total: number;
}

export class PhaseController {
  private progressTracker: ProgressTracker;

  constructor() {
    this.progressTracker = new ProgressTracker();
  }
  
  analyzeComplexity(specs: any): Phase[] {
    const phases: Phase[] = [];
    
    // Parse todo spec to determine complexity
    const todos = this.parseTodoSpec(specs.todoSpec);
    const totalTasks = todos.length;
    
    // Determine number of phases based on complexity
    let phaseCount = 1;
    
    if (totalTasks > 50) {
      phaseCount = 5;
    } else if (totalTasks > 30) {
      phaseCount = 4;
    } else if (totalTasks > 15) {
      phaseCount = 3;
    } else if (totalTasks > 5) {
      phaseCount = 2;
    }
    
    // Additional phase for complex projects
    if (specs.projectSpec.includes('microservices') || 
        specs.projectSpec.includes('distributed')) {
      phaseCount++;
    }
    
    // Create phase definitions
    const basePhases = [
      { name: 'Setup & Architecture', description: 'Project setup and core architecture' },
      { name: 'Core Implementation', description: 'Main features and functionality' },
      { name: 'Integration', description: 'Component integration and connections' },
      { name: 'Enhancement', description: 'Additional features and optimizations' },
      { name: 'Testing & Polish', description: 'Testing, bug fixes, and refinements' },
      { name: 'Deployment', description: 'Deployment preparation and documentation' }
    ];
    
    // Distribute tasks across phases
    const tasksPerPhase = Math.ceil(totalTasks / phaseCount);
    
    for (let i = 0; i < phaseCount; i++) {
      phases.push({
        number: i + 1,
        name: basePhases[i]?.name || `Phase ${i + 1}`,
        description: basePhases[i]?.description || `Phase ${i + 1} tasks`,
        tasks: Math.min(tasksPerPhase, totalTasks - (i * tasksPerPhase))
      });
    }
    
    return phases;
  }
  
  private parseTodoSpec(todoSpec: string): string[] {
    // Extract tasks from todo spec
    const lines = todoSpec.split('\n');
    const tasks: string[] = [];
    
    for (const line of lines) {
      // Look for task patterns (e.g., "- [ ] Task", "1. Task", "* Task")
      if (line.match(/^[-*]\s+\[?\s*\]?\s*.+/) || line.match(/^\d+\.\s+.+/)) {
        tasks.push(line.trim());
      }
    }
    
    return tasks;
  }
  
  async checkPhaseCompletion(projectPath: string): Promise<boolean> {
    const agents = ['frontend', 'backend', 'database', 'devops', 'testing'];
    let allComplete = true;
    
    for (const agent of agents) {
      const statusPath = path.join(projectPath, 'agent-todos', agent, 'phase-status.json');
      
      try {
        const status: PhaseStatus = await fs.readJson(statusPath);
        
        if (status.status !== 'completed') {
          allComplete = false;
          break;
        }
      } catch {
        // Status file doesn't exist or can't be read
        allComplete = false;
        break;
      }
    }
    
    return allComplete;
  }
  
  async triggerNextPhase(projectPath: string, projectId?: string): Promise<void> {
    const agents = ['frontend', 'backend', 'database', 'devops', 'testing'];
    
    for (const agent of agents) {
      const statusPath = path.join(projectPath, 'agent-todos', agent, 'phase-status.json');
      
      try {
        const status: PhaseStatus = await fs.readJson(statusPath);
        
        if (status.current_phase < status.total_phases) {
          // Move to next phase
          status.completed_phases.push(status.current_phase);
          status.current_phase++;
          status.status = 'ready';
          status.tasks_completed = 0;
          
          // Load tasks for new phase
          const phasePath = path.join(
            projectPath, 
            'agent-todos', 
            agent, 
            `phase${status.current_phase}-todo.md`
          );
          
          if (await fs.pathExists(phasePath)) {
            const phaseContent = await fs.readFile(phasePath, 'utf-8');
            const tasks = this.parseTodoSpec(phaseContent);
            status.tasks_total = tasks.length;
          }
          
          await fs.writeJson(statusPath, status, { spaces: 2 });
          
          // Update progress tracker
          if (projectId) {
            await this.progressTracker.startPhase(projectId, status.current_phase);
          }
        }
      } catch (error) {
        console.error(`Failed to update phase for ${agent}:`, error);
      }
    }
    
    console.log('✅ Triggered next phase for all agents');
  }
  
  async monitorProgress(projectPath: string): Promise<void> {
    const checkInterval = 30000; // Check every 30 seconds
    
    const monitor = async () => {
      const complete = await this.checkPhaseCompletion(projectPath);
      
      if (complete) {
        console.log('✅ Current phase complete!');
        await this.triggerNextPhase(projectPath);
      }
      
      // Continue monitoring
      setTimeout(monitor, checkInterval);
    };
    
    // Start monitoring
    monitor();
  }
}