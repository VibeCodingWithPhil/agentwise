import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';
import { ProjectRegistry } from '../project-registry/ProjectRegistry';
import { MDFileWatcher, TaskChange } from './MDFileWatcher';
import { MDTaskParser } from './MDTaskParser';
import { MDTaskUpdater } from './MDTaskUpdater';

export interface TaskProgress {
  id: string;
  agentId: string;
  phase: number;
  task: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  output?: string;
  error?: string;
}

export interface PhaseProgress {
  phase: number;
  name: string;
  status: 'pending' | 'in_progress' | 'completed';
  startTime?: Date;
  endTime?: Date;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  agents: {
    [agentId: string]: {
      tasks: number;
      completed: number;
      failed: number;
    };
  };
}

export interface ProjectProgress {
  projectId: string;
  projectName: string;
  overallProgress: number;
  phases: PhaseProgress[];
  activeTasks: TaskProgress[];
  metrics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number;
    estimatedTimeRemaining: number;
    tokensUsed: number;
  };
}

export class ProgressTracker extends EventEmitter {
  private projectRegistry: ProjectRegistry;
  private progressData: Map<string, ProjectProgress>;
  private progressFile: string;
  private updateInterval: NodeJS.Timeout | null = null;
  private mdWatcher: MDFileWatcher;
  private mdParser: MDTaskParser;
  private mdUpdater: MDTaskUpdater;
  private workspacePath: string;

  constructor(workspacePath?: string) {
    super();
    this.projectRegistry = new ProjectRegistry();
    this.progressData = new Map();
    this.progressFile = path.join(__dirname, '..', '..', 'progress.json');
    this.workspacePath = workspacePath || path.join(process.cwd(), 'workspace');
    
    // Initialize MD components
    this.mdWatcher = new MDFileWatcher(this.workspacePath);
    this.mdParser = new MDTaskParser();
    this.mdUpdater = new MDTaskUpdater();
    
    // Set up MD file watching events
    this.setupMDWatcherEvents();
  }

  async initialize(): Promise<void> {
    await this.loadProgress();
    this.startMonitoring();
    
    // Start watching MD files
    await this.mdWatcher.start();
    console.log('✅ MD file monitoring initialized');
  }
  
  private setupMDWatcherEvents(): void {
    // Listen for task changes in MD files
    this.mdWatcher.on('task:changed', async (change: TaskChange) => {
      await this.handleMDTaskChange(change);
    });
    
    // Listen for new tasks found
    this.mdWatcher.on('task:found', async (task: TaskChange) => {
      await this.handleMDTaskFound(task);
    });
  }
  
  private async handleMDTaskChange(change: TaskChange): Promise<void> {
    console.log(`📝 Task ${change.isCompleted ? 'completed' : 'unchecked'}: ${change.taskDescription}`);
    
    const progress = this.progressData.get(change.projectId);
    if (!progress) {
      // Initialize project if not exists
      await this.startProject(change.projectId, change.projectId, ['Phase 1']);
    }
    
    // Update progress based on MD change
    if (change.isCompleted) {
      await this.markTaskCompleted(change);
    } else {
      await this.markTaskIncomplete(change);
    }
    
    // Emit event for dashboard
    this.emit('md:task:changed', change);
  }
  
  private async handleMDTaskFound(task: TaskChange): Promise<void> {
    // Register newly discovered task
    const progress = this.progressData.get(task.projectId);
    if (progress) {
      // Add to total task count if not already tracked
      const existingTask = progress.activeTasks.find(t => 
        t.task === task.taskDescription
      );
      
      if (!existingTask) {
        progress.metrics.totalTasks++;
        if (task.isCompleted) {
          progress.metrics.completedTasks++;
        }
        this.updateOverallProgress(progress);
        await this.saveProgress();
      }
    }
  }
  
  private async markTaskCompleted(change: TaskChange): Promise<void> {
    const progress = this.progressData.get(change.projectId);
    if (!progress) return;
    
    // Update metrics
    progress.metrics.completedTasks++;
    
    // Update phase if specified
    if (change.phase) {
      const phaseNum = parseInt(change.phase);
      const phase = progress.phases.find(p => p.phase === phaseNum);
      if (phase) {
        phase.completedTasks++;
        if (change.agent && phase.agents[change.agent]) {
          phase.agents[change.agent].completed++;
        }
      }
    }
    
    this.updateOverallProgress(progress);
    await this.saveProgress();
    
    // Update the MD file with timestamp
    await this.mdUpdater.updateTask({
      filePath: change.filePath,
      lineNumber: 0, // Would need to track this
      isCompleted: true,
      addTimestamp: true
    });
  }
  
  private async markTaskIncomplete(change: TaskChange): Promise<void> {
    const progress = this.progressData.get(change.projectId);
    if (!progress) return;
    
    // Update metrics
    if (progress.metrics.completedTasks > 0) {
      progress.metrics.completedTasks--;
    }
    
    // Update phase if specified
    if (change.phase) {
      const phaseNum = parseInt(change.phase);
      const phase = progress.phases.find(p => p.phase === phaseNum);
      if (phase && phase.completedTasks > 0) {
        phase.completedTasks--;
        if (change.agent && phase.agents[change.agent] && phase.agents[change.agent].completed > 0) {
          phase.agents[change.agent].completed--;
        }
      }
    }
    
    this.updateOverallProgress(progress);
    await this.saveProgress();
  }

  private async loadProgress(): Promise<void> {
    try {
      await fs.ensureFile(this.progressFile);
      const data = await fs.readFile(this.progressFile, 'utf-8');
      if (data.trim()) {
        const progressArray = JSON.parse(data);
        progressArray.forEach((progress: ProjectProgress) => {
          this.progressData.set(progress.projectId, progress);
        });
      }
    } catch (error) {
      console.error('Failed to load progress data:', error);
    }
  }

  private async saveProgress(): Promise<void> {
    try {
      const progressArray = Array.from(this.progressData.values());
      await fs.writeJson(this.progressFile, progressArray, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save progress data:', error);
    }
  }

  async startProject(projectId: string, projectName: string, phases: string[]): Promise<void> {
    const projectProgress: ProjectProgress = {
      projectId,
      projectName,
      overallProgress: 0,
      phases: phases.map((name, index) => ({
        phase: index + 1,
        name,
        status: 'pending',
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        agents: {}
      })),
      activeTasks: [],
      metrics: {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageTaskDuration: 0,
        estimatedTimeRemaining: 0,
        tokensUsed: 0
      }
    };

    this.progressData.set(projectId, projectProgress);
    await this.saveProgress();
    
    // Sync with existing MD files if they exist
    await this.syncWithMDFiles(projectId);
    
    this.emit('project:started', projectProgress);
  }

  async startPhase(projectId: string, phaseNumber: number): Promise<void> {
    const progress = this.progressData.get(projectId);
    if (!progress) return;

    const phase = progress.phases.find(p => p.phase === phaseNumber);
    if (!phase) return;

    phase.status = 'in_progress';
    phase.startTime = new Date();
    
    await this.saveProgress();
    this.emit('phase:started', { projectId, phase });
  }

  async completePhase(projectId: string, phaseNumber: number): Promise<void> {
    const progress = this.progressData.get(projectId);
    if (!progress) return;

    const phase = progress.phases.find(p => p.phase === phaseNumber);
    if (!phase) return;

    phase.status = 'completed';
    phase.endTime = new Date();
    
    this.updateOverallProgress(progress);
    await this.saveProgress();
    this.emit('phase:completed', { projectId, phase });
  }

  async startTask(
    projectId: string, 
    phaseNumber: number, 
    agentId: string, 
    task: string
  ): Promise<string> {
    const progress = this.progressData.get(projectId);
    if (!progress) throw new Error('Project not found');

    const taskId = `${projectId}-${phaseNumber}-${agentId}-${Date.now()}`;
    const taskProgress: TaskProgress = {
      id: taskId,
      agentId,
      phase: phaseNumber,
      task,
      status: 'in_progress',
      startTime: new Date()
    };

    progress.activeTasks.push(taskProgress);
    progress.metrics.totalTasks++;

    const phase = progress.phases.find(p => p.phase === phaseNumber);
    if (phase) {
      phase.totalTasks++;
      if (!phase.agents[agentId]) {
        phase.agents[agentId] = { tasks: 0, completed: 0, failed: 0 };
      }
      phase.agents[agentId].tasks++;
    }

    await this.saveProgress();
    this.emit('task:started', { projectId, task: taskProgress });
    
    return taskId;
  }

  async completeTask(taskId: string, output?: string): Promise<void> {
    const progress = this.findProgressByTaskId(taskId);
    if (!progress) return;

    const task = progress.activeTasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = 'completed';
    task.endTime = new Date();
    task.duration = task.endTime.getTime() - (task.startTime?.getTime() || 0);
    task.output = output;

    progress.metrics.completedTasks++;
    this.updateAverageTaskDuration(progress);

    const phase = progress.phases.find(p => p.phase === task.phase);
    if (phase) {
      phase.completedTasks++;
      if (phase.agents[task.agentId]) {
        phase.agents[task.agentId].completed++;
      }
    }

    progress.activeTasks = progress.activeTasks.filter(t => t.id !== taskId);
    this.updateOverallProgress(progress);
    
    await this.saveProgress();
    this.emit('task:completed', { 
      projectId: progress.projectId, 
      task 
    });
  }

  async failTask(taskId: string, error: string): Promise<void> {
    const progress = this.findProgressByTaskId(taskId);
    if (!progress) return;

    const task = progress.activeTasks.find(t => t.id === taskId);
    if (!task) return;

    task.status = 'failed';
    task.endTime = new Date();
    task.duration = task.endTime.getTime() - (task.startTime?.getTime() || 0);
    task.error = error;

    progress.metrics.failedTasks++;

    const phase = progress.phases.find(p => p.phase === task.phase);
    if (phase) {
      phase.failedTasks++;
      if (phase.agents[task.agentId]) {
        phase.agents[task.agentId].failed++;
      }
    }

    progress.activeTasks = progress.activeTasks.filter(t => t.id !== taskId);
    
    await this.saveProgress();
    this.emit('task:failed', { 
      projectId: progress.projectId, 
      task 
    });
  }

  async updateTokenUsage(projectId: string, tokens: number): Promise<void> {
    const progress = this.progressData.get(projectId);
    if (!progress) return;

    progress.metrics.tokensUsed += tokens;
    
    await this.projectRegistry.updateProjectMetrics(projectId, {
      tokensUsed: progress.metrics.tokensUsed
    });

    await this.saveProgress();
    this.emit('tokens:updated', { projectId, tokens: progress.metrics.tokensUsed });
  }

  getProjectProgress(projectId: string): ProjectProgress | undefined {
    return this.progressData.get(projectId);
  }

  getAllProgress(): ProjectProgress[] {
    return Array.from(this.progressData.values());
  }

  getActiveProjects(): ProjectProgress[] {
    return Array.from(this.progressData.values()).filter(
      p => p.overallProgress < 100
    );
  }

  private findProgressByTaskId(taskId: string): ProjectProgress | undefined {
    for (const progress of this.progressData.values()) {
      if (progress.activeTasks.some(t => t.id === taskId)) {
        return progress;
      }
    }
    return undefined;
  }

  private updateOverallProgress(progress: ProjectProgress): void {
    const totalPhases = progress.phases.length;
    const completedPhases = progress.phases.filter(p => p.status === 'completed').length;
    const inProgressPhase = progress.phases.find(p => p.status === 'in_progress');
    
    let phaseProgress = completedPhases;
    if (inProgressPhase && inProgressPhase.totalTasks > 0) {
      phaseProgress += inProgressPhase.completedTasks / inProgressPhase.totalTasks;
    }
    
    progress.overallProgress = Math.round((phaseProgress / totalPhases) * 100);
    
    this.updateEstimatedTimeRemaining(progress);
  }

  private updateAverageTaskDuration(progress: ProjectProgress): void {
    if (progress.metrics.completedTasks === 0) return;
    
    let totalDuration = 0;
    let count = 0;
    
    for (const phase of progress.phases) {
      totalDuration += phase.completedTasks * (progress.metrics.averageTaskDuration || 0);
      count += phase.completedTasks;
    }
    
    if (count > 0) {
      progress.metrics.averageTaskDuration = totalDuration / count;
    }
  }

  private updateEstimatedTimeRemaining(progress: ProjectProgress): void {
    const remainingTasks = progress.metrics.totalTasks - progress.metrics.completedTasks;
    progress.metrics.estimatedTimeRemaining = 
      remainingTasks * (progress.metrics.averageTaskDuration || 60000);
  }

  private startMonitoring(): void {
    this.updateInterval = setInterval(() => {
      this.checkForStaleProjects();
    }, 60000);
  }

  private checkForStaleProjects(): void {
    const now = new Date();
    for (const progress of this.progressData.values()) {
      for (const task of progress.activeTasks) {
        if (task.startTime) {
          const duration = now.getTime() - new Date(task.startTime).getTime();
          if (duration > 3600000) {
            this.emit('task:stale', { 
              projectId: progress.projectId, 
              task 
            });
          }
        }
      }
    }
  }

  async generateReport(projectId: string): Promise<string> {
    const progress = this.progressData.get(projectId);
    if (!progress) return 'No progress data found';

    const report = [
      `# Progress Report: ${progress.projectName}`,
      '',
      `## Overall Progress: ${progress.overallProgress}%`,
      '',
      '## Phase Status:',
      ...progress.phases.map(phase => {
        const status = phase.status === 'completed' ? '✅' : 
                      phase.status === 'in_progress' ? '🔄' : '⏳';
        return `- ${status} Phase ${phase.phase}: ${phase.name} (${phase.completedTasks}/${phase.totalTasks} tasks)`;
      }),
      '',
      '## Metrics:',
      `- Total Tasks: ${progress.metrics.totalTasks}`,
      `- Completed: ${progress.metrics.completedTasks}`,
      `- Failed: ${progress.metrics.failedTasks}`,
      `- Tokens Used: ${progress.metrics.tokensUsed}`,
      `- Average Task Duration: ${Math.round(progress.metrics.averageTaskDuration / 1000)}s`,
      `- Estimated Time Remaining: ${Math.round(progress.metrics.estimatedTimeRemaining / 60000)} minutes`,
      '',
      '## Active Tasks:',
      ...progress.activeTasks.map(task => 
        `- [${task.agentId}] ${task.task} (Phase ${task.phase})`
      )
    ];

    return report.join('\n');
  }

  async destroy(): Promise<void> {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Stop MD file watcher
    await this.mdWatcher.stop();
    
    this.removeAllListeners();
  }
  
  /**
   * Sync progress with existing MD files for a project
   */
  async syncWithMDFiles(projectId: string): Promise<void> {
    console.log(`🔄 Syncing progress with MD files for project: ${projectId}`);
    
    const projectPath = path.join(this.workspacePath, projectId);
    if (!await fs.pathExists(projectPath)) {
      console.warn(`Project path not found: ${projectPath}`);
      return;
    }
    
    // Get current task states from MD files (triggers update)
    await this.mdWatcher.getProjectTasks(projectId);
    
    // Get statistics from MD files
    const stats = await this.mdParser.getProjectStatistics(projectPath);
    
    // Update progress data
    const progress = this.progressData.get(projectId);
    if (progress) {
      progress.metrics.totalTasks = stats.totalTasks;
      progress.metrics.completedTasks = stats.completedTasks;
      progress.overallProgress = stats.completionPercentage;
      
      // Update phase data
      for (const phaseData of stats.phaseBreakdown) {
        const phase = progress.phases.find(p => p.name === phaseData.phase);
        if (phase) {
          phase.totalTasks = phaseData.total;
          phase.completedTasks = phaseData.completed;
        }
      }
      
      // Update agent data
      for (const agentData of stats.agentBreakdown) {
        for (const phase of progress.phases) {
          if (!phase.agents[agentData.agent]) {
            phase.agents[agentData.agent] = { tasks: 0, completed: 0, failed: 0 };
          }
        }
      }
      
      await this.saveProgress();
      console.log(`✅ Synced ${stats.totalTasks} tasks (${stats.completedTasks} completed)`);
    }
  }
}