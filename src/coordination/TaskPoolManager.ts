/**
 * TaskPoolManager - Shared task queue for agent coordination
 * 
 * Manages a shared task pool that multiple agents can reference,
 * with priority system, dependency tracking, and load balancing.
 */

import { EventEmitter } from 'events';
import { DynamicAgentManager } from '../orchestrator/DynamicAgentManager';
import { SharedContextClient } from '../context/SharedContextClient';

export interface PooledTask {
  id: string;
  projectId: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  estimatedTokens: number;
  requiredSkills: string[];
  dependencies: string[];
  assignedAgent?: string;
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed' | 'blocked';
  createdAt: Date;
  assignedAt?: Date;
  completedAt?: Date;
  contextHash?: string;
  phase: number;
  retryCount: number;
  maxRetries: number;
  metadata: Record<string, any>;
}

export interface AgentCapability {
  agentId: string;
  skills: string[];
  currentLoad: number;
  maxLoad: number;
  averageTokensPerTask: number;
  successRate: number;
  isActive: boolean;
  lastTaskCompleted?: Date;
}

export interface TaskDistributionMetrics {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  failedTasks: number;
  blockedTasks: number;
  averageWaitTime: number;
  averageExecutionTime: number;
  agentUtilization: { [agentId: string]: number };
  tokenOptimizationSavings: number;
}

export class TaskPoolManager extends EventEmitter {
  private taskPool: Map<string, PooledTask> = new Map();
  private agentCapabilities: Map<string, AgentCapability> = new Map();
  private taskQueue: PooledTask[] = [];
  private distributionMetrics: TaskDistributionMetrics;
  private assignmentHistory: Array<{ taskId: string; agentId: string; timestamp: Date }> = [];
  
  private contextClient: SharedContextClient;
  private agentManager: DynamicAgentManager;
  
  // Configuration
  private readonly maxQueueSize = 1000;
  private readonly rebalanceInterval = 30000; // 30 seconds
  private readonly metricsUpdateInterval = 5000; // 5 seconds
  private rebalanceTimer?: NodeJS.Timeout;
  private metricsTimer?: NodeJS.Timeout;

  constructor(agentManager: DynamicAgentManager, contextClient: SharedContextClient) {
    super();
    this.agentManager = agentManager;
    this.contextClient = contextClient;
    
    this.distributionMetrics = {
      totalTasks: 0,
      pendingTasks: 0,
      inProgressTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      blockedTasks: 0,
      averageWaitTime: 0,
      averageExecutionTime: 0,
      agentUtilization: {},
      tokenOptimizationSavings: 0
    };
    
    this.startPeriodicTasks();
    this.setupAgentEvents();
  }

  /**
   * Add task to the pool
   */
  async addTask(task: Omit<PooledTask, 'id' | 'createdAt' | 'status' | 'retryCount'>): Promise<string> {
    const taskId = this.generateTaskId();
    const pooledTask: PooledTask = {
      ...task,
      id: taskId,
      createdAt: new Date(),
      status: 'pending',
      retryCount: 0,
      maxRetries: 3
    };

    // Check dependencies
    if (task.dependencies.length > 0) {
      const blockedByDependencies = this.checkDependencies(task.dependencies);
      if (blockedByDependencies.length > 0) {
        pooledTask.status = 'blocked';
        console.log(`🚫 Task ${taskId} blocked by dependencies: ${blockedByDependencies.join(', ')}`);
      }
    }

    this.taskPool.set(taskId, pooledTask);
    this.taskQueue.push(pooledTask);
    this.sortTaskQueue();
    
    this.emit('task:added', pooledTask);
    this.updateMetrics();
    
    // Try immediate assignment if not blocked
    if (pooledTask.status === 'pending') {
      await this.tryAssignTask(pooledTask);
    }
    
    return taskId;
  }

  /**
   * Assign task to best available agent
   */
  private async tryAssignTask(task: PooledTask): Promise<boolean> {
    const bestAgent = this.findBestAgent(task);
    if (!bestAgent) {
      console.log(`⏳ No available agent for task ${task.id}, queuing...`);
      return false;
    }

    // Assign task
    task.assignedAgent = bestAgent.agentId;
    task.status = 'assigned';
    task.assignedAt = new Date();
    
    // Update agent load
    bestAgent.currentLoad++;
    
    // Record assignment
    this.assignmentHistory.push({
      taskId: task.id,
      agentId: bestAgent.agentId,
      timestamp: new Date()
    });
    
    // Share context if applicable
    if (task.contextHash) {
      await this.contextClient.setContext(task.contextHash);
    }
    
    this.emit('task:assigned', task, bestAgent);
    this.updateMetrics();
    
    console.log(`✅ Task ${task.id} assigned to ${bestAgent.agentId}`);
    return true;
  }

  /**
   * Find the best agent for a task based on skills, load, and performance
   */
  private findBestAgent(task: PooledTask): AgentCapability | null {
    const availableAgents = Array.from(this.agentCapabilities.values())
      .filter(agent => 
        agent.isActive && 
        agent.currentLoad < agent.maxLoad &&
        this.hasRequiredSkills(agent, task.requiredSkills)
      );

    if (availableAgents.length === 0) {
      return null;
    }

    // Score agents based on multiple factors
    const scoredAgents = availableAgents.map(agent => {
      const loadFactor = 1 - (agent.currentLoad / agent.maxLoad);
      const skillMatch = this.calculateSkillMatch(agent.skills, task.requiredSkills);
      const performanceFactor = agent.successRate;
      const tokenEfficiency = task.estimatedTokens / (agent.averageTokensPerTask || 1000);
      
      const score = (loadFactor * 0.3) + (skillMatch * 0.4) + (performanceFactor * 0.2) + (tokenEfficiency * 0.1);
      
      return { agent, score };
    });

    // Sort by score and return best agent
    scoredAgents.sort((a, b) => b.score - a.score);
    return scoredAgents[0].agent;
  }

  /**
   * Check if agent has required skills
   */
  private hasRequiredSkills(agent: AgentCapability, requiredSkills: string[]): boolean {
    return requiredSkills.every(skill => 
      agent.skills.some(agentSkill => 
        agentSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(agentSkill.toLowerCase())
      )
    );
  }

  /**
   * Calculate skill match percentage
   */
  private calculateSkillMatch(agentSkills: string[], requiredSkills: string[]): number {
    if (requiredSkills.length === 0) return 1;
    
    const matches = requiredSkills.filter(req =>
      agentSkills.some(skill => 
        skill.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(skill.toLowerCase())
      )
    );
    
    return matches.length / requiredSkills.length;
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId: string, status: PooledTask['status'], metadata?: Record<string, any>): Promise<void> {
    const task = this.taskPool.get(taskId);
    if (!task) {
      console.error(`Task ${taskId} not found in pool`);
      return;
    }

    const oldStatus = task.status;
    task.status = status;
    
    if (metadata) {
      task.metadata = { ...task.metadata, ...metadata };
    }

    // Update completion time
    if (status === 'completed' || status === 'failed') {
      task.completedAt = new Date();
      
      // Release agent load
      if (task.assignedAgent) {
        const agent = this.agentCapabilities.get(task.assignedAgent);
        if (agent && agent.currentLoad > 0) {
          agent.currentLoad--;
          
          // Update success rate
          if (status === 'completed') {
            agent.successRate = (agent.successRate * 0.9) + (1 * 0.1); // Moving average
            agent.lastTaskCompleted = new Date();
          } else {
            agent.successRate = (agent.successRate * 0.9) + (0 * 0.1);
          }
        }
      }
      
      // Handle retry logic for failed tasks
      if (status === 'failed' && task.retryCount < task.maxRetries) {
        task.retryCount++;
        task.status = 'pending';
        task.assignedAgent = undefined;
        task.assignedAt = undefined;
        
        console.log(`🔄 Retrying task ${taskId} (attempt ${task.retryCount + 1}/${task.maxRetries + 1})`);
        await this.tryAssignTask(task);
      }
    }

    // Check if this unblocks other tasks
    if (status === 'completed') {
      await this.checkAndUnblockTasks(taskId);
    }

    this.emit('task:updated', task, oldStatus);
    this.updateMetrics();
  }

  /**
   * Register agent capabilities
   */
  registerAgent(agentId: string, skills: string[], maxLoad: number = 3): void {
    this.agentCapabilities.set(agentId, {
      agentId,
      skills,
      currentLoad: 0,
      maxLoad,
      averageTokensPerTask: 1000,
      successRate: 1.0,
      isActive: true
    });
    
    this.emit('agent:registered', agentId, skills);
    console.log(`🤖 Agent ${agentId} registered with skills: ${skills.join(', ')}`);
  }

  /**
   * Update agent status
   */
  updateAgentStatus(agentId: string, isActive: boolean): void {
    const agent = this.agentCapabilities.get(agentId);
    if (agent) {
      agent.isActive = isActive;
      this.emit('agent:status_changed', agentId, isActive);
    }
  }

  /**
   * Get current task pool state
   */
  getTaskPoolState(): {
    tasks: PooledTask[];
    agents: AgentCapability[];
    metrics: TaskDistributionMetrics;
    queueLength: number;
  } {
    return {
      tasks: Array.from(this.taskPool.values()),
      agents: Array.from(this.agentCapabilities.values()),
      metrics: this.distributionMetrics,
      queueLength: this.taskQueue.length
    };
  }

  /**
   * Get tasks by status
   */
  getTasksByStatus(status: PooledTask['status']): PooledTask[] {
    return Array.from(this.taskPool.values()).filter(task => task.status === status);
  }

  /**
   * Get agent workload
   */
  getAgentWorkload(agentId: string): {
    currentTasks: PooledTask[];
    load: number;
    maxLoad: number;
    utilization: number;
  } {
    const agent = this.agentCapabilities.get(agentId);
    const currentTasks = Array.from(this.taskPool.values()).filter(
      task => task.assignedAgent === agentId && ['assigned', 'in-progress'].includes(task.status)
    );
    
    return {
      currentTasks,
      load: agent?.currentLoad || 0,
      maxLoad: agent?.maxLoad || 0,
      utilization: agent ? (agent.currentLoad / agent.maxLoad) * 100 : 0
    };
  }

  /**
   * Force rebalance task assignments
   */
  async rebalanceTasks(): Promise<void> {
    console.log('🔄 Starting task pool rebalancing...');
    
    // Get overloaded and underloaded agents
    const agents = Array.from(this.agentCapabilities.values());
    const overloaded = agents.filter(a => a.currentLoad > a.maxLoad * 0.8 && a.isActive);
    const underloaded = agents.filter(a => a.currentLoad < a.maxLoad * 0.5 && a.isActive);
    
    if (overloaded.length === 0 || underloaded.length === 0) {
      return;
    }
    
    // Try to reassign pending tasks first
    const pendingTasks = this.getTasksByStatus('pending');
    for (const task of pendingTasks) {
      await this.tryAssignTask(task);
    }
    
    // Process blocked tasks
    const blockedTasks = this.getTasksByStatus('blocked');
    for (const task of blockedTasks) {
      if (this.checkDependencies(task.dependencies).length === 0) {
        task.status = 'pending';
        await this.tryAssignTask(task);
      }
    }
    
    this.emit('pool:rebalanced', {
      overloadedAgents: overloaded.length,
      underloadedAgents: underloaded.length,
      reassignedTasks: pendingTasks.length + blockedTasks.length
    });
  }

  /**
   * Private helper methods
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private checkDependencies(dependencies: string[]): string[] {
    return dependencies.filter(depId => {
      const depTask = this.taskPool.get(depId);
      return !depTask || depTask.status !== 'completed';
    });
  }

  private async checkAndUnblockTasks(completedTaskId: string): Promise<void> {
    const blockedTasks = this.getTasksByStatus('blocked');
    
    for (const task of blockedTasks) {
      if (task.dependencies.includes(completedTaskId)) {
        const remainingDeps = this.checkDependencies(task.dependencies);
        if (remainingDeps.length === 0) {
          task.status = 'pending';
          await this.tryAssignTask(task);
          console.log(`✅ Task ${task.id} unblocked by completion of ${completedTaskId}`);
        }
      }
    }
  }

  private sortTaskQueue(): void {
    this.taskQueue.sort((a, b) => {
      // Priority first
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by creation time (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  private updateMetrics(): void {
    const tasks = Array.from(this.taskPool.values());
    
    this.distributionMetrics = {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      inProgressTasks: tasks.filter(t => ['assigned', 'in-progress'].includes(t.status)).length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      blockedTasks: tasks.filter(t => t.status === 'blocked').length,
      averageWaitTime: this.calculateAverageWaitTime(tasks),
      averageExecutionTime: this.calculateAverageExecutionTime(tasks),
      agentUtilization: this.calculateAgentUtilization(),
      tokenOptimizationSavings: this.calculateTokenSavings()
    };
    
    this.emit('metrics:updated', this.distributionMetrics);
  }

  private calculateAverageWaitTime(tasks: PooledTask[]): number {
    const assignedTasks = tasks.filter(t => t.assignedAt);
    if (assignedTasks.length === 0) return 0;
    
    const totalWaitTime = assignedTasks.reduce((sum, task) => {
      return sum + (task.assignedAt!.getTime() - task.createdAt.getTime());
    }, 0);
    
    return totalWaitTime / assignedTasks.length;
  }

  private calculateAverageExecutionTime(tasks: PooledTask[]): number {
    const completedTasks = tasks.filter(t => t.completedAt && t.assignedAt);
    if (completedTasks.length === 0) return 0;
    
    const totalExecutionTime = completedTasks.reduce((sum, task) => {
      return sum + (task.completedAt!.getTime() - task.assignedAt!.getTime());
    }, 0);
    
    return totalExecutionTime / completedTasks.length;
  }

  private calculateAgentUtilization(): { [agentId: string]: number } {
    const utilization: { [agentId: string]: number } = {};
    
    for (const [agentId, agent] of this.agentCapabilities) {
      utilization[agentId] = agent.maxLoad > 0 ? (agent.currentLoad / agent.maxLoad) * 100 : 0;
    }
    
    return utilization;
  }

  private calculateTokenSavings(): number {
    // Estimate token savings from context sharing
    const completedTasks = Array.from(this.taskPool.values()).filter(t => t.status === 'completed');
    return completedTasks.reduce((total, task) => {
      return total + (task.contextHash ? task.estimatedTokens * 0.3 : 0); // 30% savings estimate
    }, 0);
  }

  private setupAgentEvents(): void {
    // Note: DynamicAgentManager does not extend EventEmitter
    // Agent discovery and status changes are handled through polling
    // If needed, these can be implemented as callback-based methods
  }

  private startPeriodicTasks(): void {
    // Rebalance tasks periodically
    this.rebalanceTimer = setInterval(() => {
      this.rebalanceTasks();
    }, this.rebalanceInterval);
    
    // Update metrics periodically
    this.metricsTimer = setInterval(() => {
      this.updateMetrics();
    }, this.metricsUpdateInterval);
  }

  /**
   * Stop the task pool manager
   */
  stop(): void {
    if (this.rebalanceTimer) {
      clearInterval(this.rebalanceTimer);
    }
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    
    this.removeAllListeners();
    console.log('🛑 TaskPoolManager stopped');
  }
}