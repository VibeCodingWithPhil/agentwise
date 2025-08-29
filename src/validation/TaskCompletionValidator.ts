/**
 * Task Completion Validator
 * Ensures tasks are properly marked as completed in MD files
 * Monitors agent terminal output and updates task status
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface TaskValidationResult {
  taskId: string;
  phase: number;
  completed: boolean;
  validationPassed: boolean;
  evidence: string[];
  timestamp: string;
}

export interface AgentTaskStatus {
  agentName: string;
  phase: number;
  taskNumber: number;
  description: string;
  completed: boolean;
  validationStatus?: 'pending' | 'checking' | 'validated' | 'failed';
}

export class TaskCompletionValidator extends EventEmitter {
  private projectPath: string;
  private agentTasks: Map<string, AgentTaskStatus[]>;
  private terminalOutputBuffer: Map<string, string[]>;
  private validationInterval: NodeJS.Timeout | null = null;

  constructor(projectPath: string) {
    super();
    this.projectPath = projectPath;
    this.agentTasks = new Map();
    this.terminalOutputBuffer = new Map();
  }

  /**
   * Start monitoring for task completion
   */
  async startMonitoring(): Promise<void> {
    console.log('🔍 Task Completion Validator started');
    
    // Load initial task states
    await this.loadAllAgentTasks();
    
    // Start validation check interval
    this.validationInterval = setInterval(() => {
      this.validatePendingTasks();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.validationInterval) {
      clearInterval(this.validationInterval as NodeJS.Timeout);
      this.validationInterval = null;
    }
  }

  /**
   * Load all agent tasks from MD files
   */
  private async loadAllAgentTasks(): Promise<void> {
    const agentTodosPath = path.join(this.projectPath, 'agent-todos');
    
    if (!await fs.pathExists(agentTodosPath)) {
      return;
    }

    const agents = await fs.readdir(agentTodosPath);
    
    for (const agent of agents) {
      const agentPath = path.join(agentTodosPath, agent);
      const stats = await fs.stat(agentPath);
      
      if (stats.isDirectory()) {
        await this.loadAgentTasks(agent, agentPath);
      }
    }
  }

  /**
   * Load tasks for a specific agent
   */
  private async loadAgentTasks(agentName: string, agentPath: string): Promise<void> {
    const tasks: AgentTaskStatus[] = [];
    
    // Check all phase files
    for (let phase = 1; phase <= 5; phase++) {
      const phaseFile = path.join(agentPath, `phase${phase}-todo.md`);
      
      if (await fs.pathExists(phaseFile)) {
        const content = await fs.readFile(phaseFile, 'utf-8');
        const phaseTasks = this.parseTasksFromMD(content, agentName, phase);
        tasks.push(...phaseTasks);
      }
    }
    
    this.agentTasks.set(agentName, tasks);
  }

  /**
   * Parse tasks from MD content
   */
  private parseTasksFromMD(content: string, agentName: string, phase: number): AgentTaskStatus[] {
    const tasks: AgentTaskStatus[] = [];
    const lines = content.split('\n');
    
    let taskNumber = 0;
    for (const line of lines) {
      // Match task patterns: "1. [ ] Task description" or "1. [x] Task description"
      const taskMatch = line.match(/^(\d+)\.\s*\[([ x])\]\s*(.+)/);
      
      if (taskMatch) {
        taskNumber++;
        const completed = taskMatch[2] === 'x';
        const description = taskMatch[3].trim();
        
        // Skip validation tasks themselves
        if (!description.includes('✓ Validate:') && !description.includes('🔍 Verify:')) {
          tasks.push({
            agentName,
            phase,
            taskNumber,
            description,
            completed,
            validationStatus: completed ? 'validated' : 'pending'
          });
        }
      }
    }
    
    return tasks;
  }

  /**
   * Add terminal output for an agent
   */
  addTerminalOutput(agentName: string, output: string): void {
    if (!this.terminalOutputBuffer.has(agentName)) {
      this.terminalOutputBuffer.set(agentName, []);
    }
    
    const buffer = this.terminalOutputBuffer.get(agentName)!;
    buffer.push(output);
    
    // Keep only last 100 lines
    if (buffer.length > 100) {
      buffer.shift();
    }
    
    // Check if this output indicates task completion
    this.checkForTaskCompletion(agentName, output);
  }

  /**
   * Check if terminal output indicates task completion
   */
  private checkForTaskCompletion(agentName: string, output: string): void {
    const completionIndicators = [
      /✅\s*completed/i,
      /✓\s*done/i,
      /task\s+completed/i,
      /finished\s+task/i,
      /successfully\s+completed/i,
      /task\s+\d+\s*:\s*done/i,
      /\[x\]/,
      /marking\s+as\s+complete/i
    ];
    
    for (const indicator of completionIndicators) {
      if (indicator.test(output)) {
        // Try to identify which task was completed
        this.identifyAndMarkCompletedTask(agentName, output);
        break;
      }
    }
  }

  /**
   * Identify and mark a task as completed based on output
   */
  private async identifyAndMarkCompletedTask(agentName: string, output: string): Promise<void> {
    const tasks = this.agentTasks.get(agentName);
    if (!tasks) return;
    
    // Find the current incomplete task
    const currentTask = tasks.find(t => !t.completed && t.validationStatus === 'pending');
    if (!currentTask) return;
    
    // Mark task as checking
    currentTask.validationStatus = 'checking';
    
    // Validate the task completion
    const validated = await this.validateTaskCompletion(currentTask, output);
    
    if (validated) {
      // Update the MD file
      await this.updateTaskInMDFile(currentTask, true);
      
      // Add validation task completion
      await this.addValidationTaskCompletion(currentTask);
      
      // Update status
      currentTask.completed = true;
      currentTask.validationStatus = 'validated';
      
      // Emit event for monitor
      this.emit('taskCompleted', {
        agent: agentName,
        phase: currentTask.phase,
        task: currentTask.taskNumber,
        description: currentTask.description
      });
      
      console.log(`✅ Task validated and marked complete: ${agentName} - Phase ${currentTask.phase} - Task ${currentTask.taskNumber}`);
    } else {
      currentTask.validationStatus = 'pending';
    }
  }

  /**
   * Validate if a task is truly completed
   */
  private async validateTaskCompletion(task: AgentTaskStatus, output: string): Promise<boolean> {
    // Check for task-specific keywords in output
    const taskKeywords = this.extractKeywordsFromTask(task.description);
    let matchCount = 0;
    
    for (const keyword of taskKeywords) {
      if (output.toLowerCase().includes(keyword.toLowerCase())) {
        matchCount++;
      }
    }
    
    // Require at least 30% keyword match
    const matchPercentage = matchCount / taskKeywords.length;
    return matchPercentage >= 0.3;
  }

  /**
   * Extract keywords from task description
   */
  private extractKeywordsFromTask(description: string): string[] {
    // Remove common words and symbols
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    const words = description
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word.toLowerCase()));
    
    return words;
  }

  /**
   * Update task status in MD file
   */
  private async updateTaskInMDFile(task: AgentTaskStatus, completed: boolean): Promise<void> {
    const phaseFile = path.join(
      this.projectPath,
      'agent-todos',
      task.agentName,
      `phase${task.phase}-todo.md`
    );
    
    if (!await fs.pathExists(phaseFile)) {
      return;
    }
    
    let content = await fs.readFile(phaseFile, 'utf-8');
    const lines = content.split('\n');
    
    let taskCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const taskMatch = lines[i].match(/^(\d+)\.\s*\[([ x])\]\s*(.+)/);
      
      if (taskMatch) {
        taskCount++;
        if (taskCount === task.taskNumber) {
          // Update the checkbox
          const checkbox = completed ? 'x' : ' ';
          lines[i] = `${taskMatch[1]}. [${checkbox}] ${taskMatch[3]}`;
          break;
        }
      }
    }
    
    // Write back the updated content
    content = lines.join('\n');
    await fs.writeFile(phaseFile, content, 'utf-8');
  }

  /**
   * Add validation task completion after a regular task
   */
  private async addValidationTaskCompletion(task: AgentTaskStatus): Promise<void> {
    const phaseFile = path.join(
      this.projectPath,
      'agent-todos',
      task.agentName,
      `phase${task.phase}-todo.md`
    );
    
    if (!await fs.pathExists(phaseFile)) {
      return;
    }
    
    let content = await fs.readFile(phaseFile, 'utf-8');
    const lines = content.split('\n');
    
    let taskCount = 0;
    let insertIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const taskMatch = lines[i].match(/^(\d+)\.\s*\[([ x])\]\s*(.+)/);
      
      if (taskMatch) {
        taskCount++;
        if (taskCount === task.taskNumber) {
          insertIndex = i + 1;
          break;
        }
      }
    }
    
    if (insertIndex > 0) {
      // Check if validation task already exists
      const nextLine = lines[insertIndex] || '';
      if (!nextLine.includes('✓ Validate:')) {
        // Insert validation task
        const validationTask = `   ✓ Validate: Task ${task.taskNumber} completed and verified at ${new Date().toISOString()}`;
        lines.splice(insertIndex, 0, validationTask);
        
        // Write back the updated content
        content = lines.join('\n');
        await fs.writeFile(phaseFile, content, 'utf-8');
      }
    }
  }

  /**
   * Validate all pending tasks
   */
  private async validatePendingTasks(): Promise<void> {
    for (const [agentName, tasks] of this.agentTasks) {
      for (const task of tasks) {
        if (!task.completed && task.validationStatus === 'pending') {
          // Check recent output for this agent
          const recentOutput = this.getRecentOutput(agentName);
          if (recentOutput) {
            await this.identifyAndMarkCompletedTask(agentName, recentOutput);
          }
        }
      }
    }
  }

  /**
   * Get recent output for an agent
   */
  private getRecentOutput(agentName: string): string {
    const buffer = this.terminalOutputBuffer.get(agentName);
    if (!buffer || buffer.length === 0) {
      return '';
    }
    
    // Return last 10 lines
    return buffer.slice(-10).join('\n');
  }

  /**
   * Force validate a specific task
   */
  async forceValidateTask(agentName: string, phase: number, taskNumber: number): Promise<boolean> {
    const tasks = this.agentTasks.get(agentName);
    if (!tasks) return false;
    
    const task = tasks.find(t => t.phase === phase && t.taskNumber === taskNumber);
    if (!task) return false;
    
    await this.updateTaskInMDFile(task, true);
    await this.addValidationTaskCompletion(task);
    
    task.completed = true;
    task.validationStatus = 'validated';
    
    this.emit('taskCompleted', {
      agent: agentName,
      phase: task.phase,
      task: task.taskNumber,
      description: task.description
    });
    
    return true;
  }

  /**
   * Get current task status for all agents
   */
  getTaskStatus(): Map<string, AgentTaskStatus[]> {
    return new Map(this.agentTasks);
  }

  /**
   * Get completion percentage for an agent
   */
  getAgentCompletionPercentage(agentName: string): number {
    const tasks = this.agentTasks.get(agentName);
    if (!tasks || tasks.length === 0) return 0;
    
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  }
}

export default TaskCompletionValidator;