/**
 * Enhanced Task Monitor
 * Integrates TaskCompletionValidator with the monitoring dashboard
 * Ensures real-time task completion tracking and validation
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs-extra';
import { TaskCompletionValidator } from '../validation/TaskCompletionValidator';
import { MDFileWatcher } from './MDFileWatcher';
import { WebSocketIntegration } from './WebSocketIntegration';
import { ProgressTracker } from './ProgressTracker';

export interface TaskUpdate {
  projectName: string;
  agentName: string;
  phase: number;
  taskNumber: number;
  status: 'pending' | 'in-progress' | 'completed' | 'validated';
  description: string;
  timestamp: string;
}

export interface AgentStatus {
  name: string;
  status: 'idle' | 'working' | 'validating' | 'completed';
  currentTask?: string;
  currentPhase?: number;
  completionPercentage: number;
}

export class EnhancedTaskMonitor extends EventEmitter {
  private validators: Map<string, TaskCompletionValidator>;
  private mdWatcher: MDFileWatcher;
  private wsIntegration: WebSocketIntegration;
  private progressTracker: ProgressTracker;
  private agentStatuses: Map<string, AgentStatus>;
  private workspacePath: string;
  private monitorInterval: NodeJS.Timeout | null = null;

  constructor(workspacePath: string = path.join(process.cwd(), 'workspace')) {
    super();
    this.workspacePath = workspacePath;
    this.validators = new Map();
    this.mdWatcher = new MDFileWatcher(workspacePath);
    this.progressTracker = new ProgressTracker();
    this.wsIntegration = new WebSocketIntegration(this.progressTracker);
    this.agentStatuses = new Map();
  }

  /**
   * Start monitoring all projects in workspace
   */
  async startMonitoring(): Promise<void> {
    console.log('🚀 Enhanced Task Monitor starting...');
    
    // Connect to WebSocket for dashboard updates
    try {
      await this.wsIntegration.connect();
      console.log('✅ Connected to monitor dashboard');
    } catch (error) {
      console.log('⚠️ Monitor dashboard not available, continuing without real-time updates');
    }
    
    // Start MD file watcher
    await this.mdWatcher.start();
    this.setupMDWatcherListeners();
    
    // Initialize validators for existing projects
    await this.initializeProjectValidators();
    
    // Start periodic status check
    this.monitorInterval = setInterval(() => {
      this.updateAllAgentStatuses();
    }, 3000); // Update every 3 seconds
    
    console.log('✅ Enhanced monitoring active');
  }

  /**
   * Stop monitoring
   */
  async stopMonitoring(): Promise<void> {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval as NodeJS.Timeout);
      this.monitorInterval = null;
    }
    
    // Stop all validators
    for (const validator of this.validators.values()) {
      validator.stopMonitoring();
    }
    
    await this.mdWatcher.stop();
    this.wsIntegration.disconnect();
    
    console.log('🛑 Enhanced monitoring stopped');
  }

  /**
   * Initialize validators for all projects
   */
  private async initializeProjectValidators(): Promise<void> {
    if (!await fs.pathExists(this.workspacePath)) {
      return;
    }
    
    const projects = await fs.readdir(this.workspacePath);
    
    for (const project of projects) {
      const projectPath = path.join(this.workspacePath, project);
      const stats = await fs.stat(projectPath);
      
      if (stats.isDirectory() && !project.startsWith('.')) {
        await this.addProjectValidator(project, projectPath);
      }
    }
  }

  /**
   * Add validator for a specific project
   */
  private async addProjectValidator(projectName: string, projectPath: string): Promise<void> {
    if (this.validators.has(projectName)) {
      return;
    }
    
    const validator = new TaskCompletionValidator(projectPath);
    
    // Setup validator listeners
    validator.on('taskCompleted', (data) => {
      this.handleTaskCompletion(projectName, data);
    });
    
    // Start validator monitoring
    await validator.startMonitoring();
    
    this.validators.set(projectName, validator);
    console.log(`📊 Monitoring project: ${projectName}`);
  }

  /**
   * Setup MD watcher listeners
   */
  private setupMDWatcherListeners(): void {
    this.mdWatcher.on('taskAdded', (data) => {
      this.handleTaskAdded(data);
    });
    
    this.mdWatcher.on('taskUpdated', (data) => {
      this.handleTaskUpdated(data);
    });
    
    this.mdWatcher.on('fileChanged', (data) => {
      this.handleFileChanged(data);
    });
  }

  /**
   * Handle task completion from validator
   */
  private handleTaskCompletion(projectName: string, data: any): void {
    const update: TaskUpdate = {
      projectName,
      agentName: data.agent,
      phase: data.phase,
      taskNumber: data.task,
      status: 'validated',
      description: data.description,
      timestamp: new Date().toISOString()
    };
    
    // Update agent status
    const agentKey = `${projectName}:${data.agent}`;
    const agentStatus: AgentStatus = this.agentStatuses.get(agentKey) || {
      name: data.agent,
      status: 'working' as const,
      completionPercentage: 0,
      currentTask: undefined,
      currentPhase: undefined
    };
    
    // Get completion percentage from validator
    const validator = this.validators.get(projectName);
    if (validator) {
      agentStatus.completionPercentage = validator.getAgentCompletionPercentage(data.agent);
      
      // Update status based on completion
      if (agentStatus.completionPercentage >= 100) {
        agentStatus.status = 'completed';
      } else {
        agentStatus.status = 'working';
      }
    }
    
    agentStatus.currentTask = `Phase ${data.phase} - Task ${data.task} completed`;
    agentStatus.currentPhase = data.phase;
    
    this.agentStatuses.set(agentKey, agentStatus);
    
    // Send update to dashboard
    this.sendDashboardUpdate('task-completed', update);
    this.sendDashboardUpdate('agent-status', agentStatus);
    
    // Emit event for other listeners
    this.emit('taskCompleted', update);
    
    console.log(`✅ Task validated: ${projectName}/${data.agent} - Phase ${data.phase}, Task ${data.task}`);
  }

  /**
   * Handle task added event
   */
  private handleTaskAdded(data: any): void {
    // Extract project name from file path
    const projectName = this.extractProjectName(data.file);
    if (!projectName) return;
    
    // Ensure validator exists for project
    const projectPath = path.join(this.workspacePath, projectName);
    this.addProjectValidator(projectName, projectPath);
  }

  /**
   * Handle task updated event
   */
  private handleTaskUpdated(data: any): void {
    const projectName = this.extractProjectName(data.file);
    if (!projectName) return;
    
    // Force validator to reload tasks
    const validator = this.validators.get(projectName);
    if (validator) {
      validator.startMonitoring(); // This will reload tasks
    }
  }

  /**
   * Handle file changed event
   */
  private handleFileChanged(data: any): void {
    const projectName = this.extractProjectName(data.path);
    if (!projectName) return;
    
    // Check if it's an agent output file
    if (data.path.includes('agent-todos')) {
      // Extract agent name
      const agentName = this.extractAgentName(data.path);
      if (agentName) {
        // Update agent status
        this.updateAgentStatus(projectName, agentName);
      }
    }
  }

  /**
   * Update all agent statuses
   */
  private async updateAllAgentStatuses(): Promise<void> {
    for (const [projectName, validator] of this.validators) {
      const taskStatuses = validator.getTaskStatus();
      
      for (const [agentName, tasks] of taskStatuses) {
        const agentKey = `${projectName}:${agentName}`;
        
        // Calculate current status
        const incompleteTasks = tasks.filter(t => !t.completed);
        const currentTask = incompleteTasks[0];
        
        const agentStatus: AgentStatus = {
          name: agentName,
          status: currentTask ? 'working' : 'idle',
          currentTask: currentTask ? currentTask.description : undefined,
          currentPhase: currentTask ? currentTask.phase : undefined,
          completionPercentage: validator.getAgentCompletionPercentage(agentName)
        };
        
        // Check if status changed
        const previousStatus = this.agentStatuses.get(agentKey);
        if (!previousStatus || JSON.stringify(previousStatus) !== JSON.stringify(agentStatus)) {
          this.agentStatuses.set(agentKey, agentStatus);
          this.sendDashboardUpdate('agent-status', {
            project: projectName,
            ...agentStatus
          });
        }
      }
    }
  }

  /**
   * Update single agent status
   */
  private async updateAgentStatus(projectName: string, agentName: string): Promise<void> {
    const validator = this.validators.get(projectName);
    if (!validator) return;
    
    const agentKey = `${projectName}:${agentName}`;
    const taskStatuses = validator.getTaskStatus();
    const agentTasks = taskStatuses.get(agentName);
    
    if (!agentTasks) return;
    
    const incompleteTasks = agentTasks.filter(t => !t.completed);
    const currentTask = incompleteTasks[0];
    
    const agentStatus: AgentStatus = {
      name: agentName,
      status: currentTask ? 'working' : 'idle',
      currentTask: currentTask ? currentTask.description : undefined,
      currentPhase: currentTask ? currentTask.phase : undefined,
      completionPercentage: validator.getAgentCompletionPercentage(agentName)
    };
    
    this.agentStatuses.set(agentKey, agentStatus);
    this.sendDashboardUpdate('agent-status', {
      project: projectName,
      ...agentStatus
    });
  }

  /**
   * Send update to dashboard via WebSocket
   */
  private sendDashboardUpdate(type: string, data: any): void {
    try {
      // TODO: Implement dashboard update mechanism
      // The ProgressTracker doesn't have an updateProjectProgress method
      // For now, we'll just log the updates
      console.log(`[Dashboard Update] ${type}:`, data);
    } catch (error) {
      // Silent fail if WebSocket not connected
    }
  }

  /**
   * Extract project name from file path
   */
  private extractProjectName(filePath: string): string | null {
    const relativePath = path.relative(this.workspacePath, filePath);
    const parts = relativePath.split(path.sep);
    return parts[0] || null;
  }

  /**
   * Extract agent name from file path
   */
  private extractAgentName(filePath: string): string | null {
    if (!filePath.includes('agent-todos')) return null;
    
    const parts = filePath.split(path.sep);
    const agentTodosIndex = parts.indexOf('agent-todos');
    
    if (agentTodosIndex !== -1 && parts[agentTodosIndex + 1]) {
      return parts[agentTodosIndex + 1];
    }
    
    return null;
  }

  /**
   * Add terminal output for an agent (for task completion detection)
   */
  addAgentOutput(projectName: string, agentName: string, output: string): void {
    const validator = this.validators.get(projectName);
    if (validator) {
      validator.addTerminalOutput(agentName, output);
    }
  }

  /**
   * Force validate a specific task
   */
  async forceValidateTask(
    projectName: string, 
    agentName: string, 
    phase: number, 
    taskNumber: number
  ): Promise<boolean> {
    const validator = this.validators.get(projectName);
    if (!validator) return false;
    
    return await validator.forceValidateTask(agentName, phase, taskNumber);
  }

  /**
   * Get current status of all agents
   */
  getAllAgentStatuses(): Map<string, AgentStatus> {
    return new Map(this.agentStatuses);
  }

  /**
   * Get task completion statistics for a project
   */
  getProjectStatistics(projectName: string): any {
    const validator = this.validators.get(projectName);
    if (!validator) return null;
    
    const taskStatuses = validator.getTaskStatus();
    let totalTasks = 0;
    let completedTasks = 0;
    const agentStats: any[] = [];
    
    for (const [agentName, tasks] of taskStatuses) {
      const agentCompleted = tasks.filter(t => t.completed).length;
      totalTasks += tasks.length;
      completedTasks += agentCompleted;
      
      agentStats.push({
        agent: agentName,
        totalTasks: tasks.length,
        completedTasks: agentCompleted,
        percentage: validator.getAgentCompletionPercentage(agentName)
      });
    }
    
    return {
      projectName,
      totalTasks,
      completedTasks,
      overallPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      agents: agentStats
    };
  }
}

export default EnhancedTaskMonitor;