import * as fs from 'fs-extra';
import * as path from 'path';
import { MDTaskUpdater } from '../monitoring/MDTaskUpdater';
import { TaskCompletionDetector } from '../monitoring/TaskCompletionDetector';

export interface PhaseTask {
  id: string;
  description: string;
  completed: boolean;
  agent: string;
  phase: number;
  lineNumber?: number;
}

export interface PhaseProgress {
  phase: number;
  totalTasks: number;
  completedTasks: number;
  percentage: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export class EnhancedPhaseManager {
  private projectPath: string;
  private mdTaskUpdater: MDTaskUpdater;
  private taskCompletionDetector: TaskCompletionDetector;
  private phaseWatchers: Map<string, fs.FSWatcher> = new Map();
  private completionCheckInterval: NodeJS.Timeout | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.mdTaskUpdater = new MDTaskUpdater();
    this.taskCompletionDetector = new TaskCompletionDetector(projectPath);
  }

  /**
   * Start monitoring all phase files for all agents
   */
  async startPhaseMonitoring(): Promise<void> {
    const agentTodoDir = path.join(this.projectPath, 'agent-todos');
    
    if (!await fs.pathExists(agentTodoDir)) {
      console.warn('No agent-todos directory found');
      return;
    }

    const agents = await fs.readdir(agentTodoDir);
    
    for (const agent of agents) {
      const agentDir = path.join(agentTodoDir, agent);
      const stats = await fs.stat(agentDir);
      
      if (stats.isDirectory()) {
        await this.monitorAgentPhases(agent, agentDir);
      }
    }

    console.log(`✅ Started monitoring phases for ${agents.length} agents`);
    
    // Start automatic task completion detection
    await this.startTaskCompletionDetection();
  }

  /**
   * Start automatic task completion detection
   */
  private async startTaskCompletionDetection(): Promise<void> {
    // Run initial scan
    console.log('🔍 Running initial task completion scan...');
    await this.runTaskCompletionScan();
    
    // Set up periodic scanning (every 30 seconds)
    this.completionCheckInterval = setInterval(async () => {
      await this.runTaskCompletionScan();
    }, 30000);
    
    console.log('✅ Automatic task completion detection started');
  }

  /**
   * Run task completion scan
   */
  private async runTaskCompletionScan(): Promise<void> {
    try {
      const results = await this.taskCompletionDetector.scanAndUpdateCompletedTasks(this.projectPath);
      
      if (results.length > 0) {
        const totalCompleted = results.reduce((sum, r) => sum + r.tasksCompleted, 0);
        if (totalCompleted > 0) {
          console.log(`🎯 Automatically marked ${totalCompleted} tasks as complete across ${results.length} agents`);
        }
      }
    } catch (error) {
      console.error('Error during task completion scan:', error);
    }
  }

  /**
   * Stop monitoring and cleanup
   */
  async stopMonitoring(): Promise<void> {
    // Clear interval
    if (this.completionCheckInterval) {
      clearInterval(this.completionCheckInterval);
      this.completionCheckInterval = null;
    }
    
    // Close file watchers
    for (const watcher of this.phaseWatchers.values()) {
      watcher.close();
    }
    this.phaseWatchers.clear();
    
    console.log('🛑 Phase monitoring stopped');
  }

  /**
   * Monitor all phase files for a specific agent
   */
  private async monitorAgentPhases(agent: string, agentDir: string): Promise<void> {
    const phaseFiles = await this.findPhaseFiles(agentDir);
    
    for (const phaseFile of phaseFiles) {
      const watchKey = `${agent}:${path.basename(phaseFile)}`;
      
      // Set up file watcher for this phase file
      const watcher = fs.watch(phaseFile, async (eventType) => {
        if (eventType === 'change') {
          await this.handlePhaseFileChange(agent, phaseFile);
        }
      });

      this.phaseWatchers.set(watchKey, watcher);
    }
  }

  /**
   * Find all phase todo files for an agent
   */
  private async findPhaseFiles(agentDir: string): Promise<string[]> {
    const files = await fs.readdir(agentDir);
    const phaseFiles = files
      .filter(f => f.match(/^phase\d+-todo\.md$/))
      .map(f => path.join(agentDir, f))
      .sort((a, b) => {
        const aNum = parseInt(path.basename(a).match(/phase(\d+)/)?.[1] || '0', 10);
        const bNum = parseInt(path.basename(b).match(/phase(\d+)/)?.[1] || '0', 10);
        return aNum - bNum;
      });

    return phaseFiles;
  }

  /**
   * Handle changes to a phase file
   */
  private async handlePhaseFileChange(agent: string, phaseFile: string): Promise<void> {
    const phaseNumber = this.extractPhaseNumber(phaseFile);
    const progress = await this.getPhaseProgress(phaseFile);

    console.log(`📝 ${agent} - Phase ${phaseNumber}: ${progress.completedTasks}/${progress.totalTasks} tasks (${progress.percentage.toFixed(1)}%)`);

    // If phase is completed, check if we should mark next phase as ready
    if (progress.status === 'completed') {
      await this.handlePhaseCompletion(agent, phaseNumber);
    }
  }

  /**
   * Get progress for a specific phase file
   */
  async getPhaseProgress(phaseFile: string): Promise<PhaseProgress> {
    const content = await fs.readFile(phaseFile, 'utf-8');
    const lines = content.split('\n');
    
    let totalTasks = 0;
    let completedTasks = 0;

    for (const line of lines) {
      const checkboxMatch = line.match(/^(\s*)[-*]\s*\[([ xX])\]\s*(.+)/);
      if (checkboxMatch) {
        totalTasks++;
        if (checkboxMatch[2].toLowerCase() === 'x') {
          completedTasks++;
        }
      }
    }

    const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const phaseNumber = this.extractPhaseNumber(phaseFile);

    return {
      phase: phaseNumber,
      totalTasks,
      completedTasks,
      percentage,
      status: percentage === 100 ? 'completed' : percentage > 0 ? 'in_progress' : 'pending'
    };
  }

  /**
   * Mark tasks as complete in a phase file
   */
  async markTasksComplete(agent: string, phase: number, taskDescriptions: string[]): Promise<void> {
    const phaseFile = path.join(this.projectPath, 'agent-todos', agent, `phase${phase}-todo.md`);
    
    if (!await fs.pathExists(phaseFile)) {
      console.warn(`Phase file not found: ${phaseFile}`);
      return;
    }

    const content = await fs.readFile(phaseFile, 'utf-8');
    const lines = content.split('\n');
    const updates: any[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const checkboxMatch = line.match(/^(\s*)[-*]\s*\[\s*\]\s*(.+)/);
      
      if (checkboxMatch) {
        const taskText = checkboxMatch[2].trim();
        
        // Check if this task should be marked complete
        if (taskDescriptions.some(desc => taskText.includes(desc) || desc.includes(taskText))) {
          updates.push({
            filePath: phaseFile,
            lineNumber: i + 1,
            isCompleted: true,
            addTimestamp: true
          });
        }
      }
    }

    if (updates.length > 0) {
      await this.mdTaskUpdater.updateTasks(updates);
      console.log(`✅ Marked ${updates.length} tasks complete in ${agent} phase ${phase}`);
    }
  }

  /**
   * Handle phase completion
   */
  private async handlePhaseCompletion(agent: string, completedPhase: number): Promise<void> {
    console.log(`🎉 ${agent} completed phase ${completedPhase}`);

    // Check if there's a next phase
    const nextPhaseFile = path.join(
      this.projectPath, 
      'agent-todos', 
      agent, 
      `phase${completedPhase + 1}-todo.md`
    );

    if (await fs.pathExists(nextPhaseFile)) {
      // Notify that next phase is ready
      console.log(`📋 ${agent} ready for phase ${completedPhase + 1}`);
      
      // Create a status file to track phase transitions
      const statusFile = path.join(
        this.projectPath,
        'agent-todos',
        agent,
        'phase-status.json'
      );

      const status = {
        currentPhase: completedPhase + 1,
        completedPhases: Array.from({ length: completedPhase }, (_, i) => i + 1),
        lastCompleted: new Date().toISOString(),
        ready: true
      };

      await fs.writeJSON(statusFile, status, { spaces: 2 });
    } else {
      console.log(`✨ ${agent} completed all phases!`);
    }
  }

  /**
   * Get overall project progress across all phases and agents
   */
  async getProjectProgress(): Promise<any> {
    const agentTodoDir = path.join(this.projectPath, 'agent-todos');
    
    if (!await fs.pathExists(agentTodoDir)) {
      return { agents: {}, overallProgress: 0 };
    }

    const agents = await fs.readdir(agentTodoDir);
    const agentProgress: any = {};
    let totalTasks = 0;
    let completedTasks = 0;

    for (const agent of agents) {
      const agentDir = path.join(agentTodoDir, agent);
      const stats = await fs.stat(agentDir);
      
      if (stats.isDirectory()) {
        const phaseFiles = await this.findPhaseFiles(agentDir);
        const phases: PhaseProgress[] = [];

        for (const phaseFile of phaseFiles) {
          const progress = await this.getPhaseProgress(phaseFile);
          phases.push(progress);
          totalTasks += progress.totalTasks;
          completedTasks += progress.completedTasks;
        }

        agentProgress[agent] = {
          phases,
          totalPhases: phases.length,
          completedPhases: phases.filter(p => p.status === 'completed').length,
          overallProgress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0
        };
      }
    }

    return {
      agents: agentProgress,
      overallProgress: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      totalTasks,
      completedTasks
    };
  }

  /**
   * Extract phase number from filename
   */
  private extractPhaseNumber(filename: string): number {
    const match = path.basename(filename).match(/phase(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }

  /**
   * Auto-mark tasks based on completed work
   */
  async autoMarkCompletedTasks(agent: string, completedWork: string[]): Promise<void> {
    const agentDir = path.join(this.projectPath, 'agent-todos', agent);
    const phaseFiles = await this.findPhaseFiles(agentDir);

    for (const phaseFile of phaseFiles) {
      const content = await fs.readFile(phaseFile, 'utf-8');
      const lines = content.split('\n');
      const updates: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const checkboxMatch = line.match(/^(\s*)[-*]\s*\[\s*\]\s*(.+)/);
        
        if (checkboxMatch) {
          const taskText = checkboxMatch[2].trim().toLowerCase();
          
          // Check if this task matches completed work
          for (const work of completedWork) {
            const workLower = work.toLowerCase();
            if (taskText.includes(workLower) || workLower.includes(taskText)) {
              updates.push({
                filePath: phaseFile,
                lineNumber: i + 1,
                isCompleted: true,
                addTimestamp: false
              });
              break;
            }
          }
        }
      }

      if (updates.length > 0) {
        await this.mdTaskUpdater.updateTasks(updates);
        const phaseNumber = this.extractPhaseNumber(phaseFile);
        console.log(`✅ Auto-marked ${updates.length} tasks in ${agent} phase ${phaseNumber}`);
      }
    }
  }


  /**
   * Initialize phase files for a new project
   */
  async initializePhaseFiles(agents: string[], phases: number): Promise<void> {
    const agentTodoDir = path.join(this.projectPath, 'agent-todos');
    await fs.ensureDir(agentTodoDir);

    for (const agent of agents) {
      const agentDir = path.join(agentTodoDir, agent);
      await fs.ensureDir(agentDir);

      // Create phase files if they don't exist
      for (let phase = 1; phase <= phases; phase++) {
        const phaseFile = path.join(agentDir, `phase${phase}-todo.md`);
        
        if (!await fs.pathExists(phaseFile)) {
          const content = `# Phase ${phase} - ${agent}\n\n## Tasks\n\n- [ ] Initialize phase ${phase}\n`;
          await fs.writeFile(phaseFile, content);
        }
      }

      // Create initial status file
      const statusFile = path.join(agentDir, 'phase-status.json');
      const status = {
        currentPhase: 1,
        completedPhases: [] as any[],
        totalPhases: phases,
        lastUpdated: new Date().toISOString(),
        ready: true
      };
      
      await fs.writeJSON(statusFile, status, { spaces: 2 });
    }

    console.log(`✅ Initialized ${phases} phases for ${agents.length} agents`);
  }
}