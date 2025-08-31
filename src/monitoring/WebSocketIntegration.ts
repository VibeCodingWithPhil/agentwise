/**
 * WebSocket Integration - Connects ProgressTracker to Monitor Dashboard
 * Sends real-time updates to the web monitor
 */

import { EventEmitter } from 'events';
import { ProgressTracker, ProjectProgress, TaskProgress } from './ProgressTracker';
import WebSocket from 'ws';

export class WebSocketIntegration extends EventEmitter {
  private progressTracker: ProgressTracker;
  private wsClient: WebSocket | null = null;
  private sharedContextClient: WebSocket | null = null;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private contextReconnectInterval: NodeJS.Timeout | null = null;
  private monitorUrl: string = 'ws://localhost:3002';
  private sharedContextUrl: string = 'ws://localhost:3003/context/stream';
  private connected: boolean = false;
  private contextConnected: boolean = false;

  constructor(progressTracker: ProgressTracker) {
    super();
    this.progressTracker = progressTracker;
    this.setupProgressTrackerEvents();
  }

  /**
   * Connect to the monitor WebSocket server
   */
  async connect(): Promise<void> {
    await Promise.all([
      this.connectToMonitor(),
      this.connectToSharedContext()
    ]);
  }

  /**
   * Connect to monitor dashboard
   */
  private async connectToMonitor(): Promise<void> {
    try {
      this.wsClient = new WebSocket(this.monitorUrl);

      this.wsClient.on('open', () => {
        console.log('✅ Connected to monitor dashboard');
        this.connected = true;
        
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }

        // Send initial data
        this.sendInitialData();
      });

      this.wsClient.on('close', () => {
        console.log('❌ Disconnected from monitor dashboard');
        this.connected = false;
        this.scheduleReconnect();
      });

      this.wsClient.on('error', (error) => {
        console.error('Monitor WebSocket error:', error.message);
        this.connected = false;
        this.scheduleReconnect();
      });

      // Handle incoming messages from monitor
      this.wsClient.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMonitorMessage(message);
        } catch (error) {
          console.error('Error parsing monitor message:', error);
        }
      });

    } catch (error) {
      console.error('Failed to connect to monitor:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Connect to SharedContextServer for real-time task pool data
   */
  private async connectToSharedContext(): Promise<void> {
    try {
      this.sharedContextClient = new WebSocket(this.sharedContextUrl);

      this.sharedContextClient.on('open', () => {
        console.log('✅ Connected to SharedContextServer');
        this.contextConnected = true;
        
        if (this.contextReconnectInterval) {
          clearInterval(this.contextReconnectInterval);
          this.contextReconnectInterval = null;
        }

        // Subscribe to task pool updates
        this.subscribeToContextUpdates();
      });

      this.sharedContextClient.on('close', () => {
        console.log('❌ Disconnected from SharedContextServer');
        this.contextConnected = false;
        this.scheduleContextReconnect();
      });

      this.sharedContextClient.on('error', (error) => {
        console.error('SharedContext WebSocket error:', error.message);
        this.contextConnected = false;
        this.scheduleContextReconnect();
      });

      // Handle context sharing messages
      this.sharedContextClient.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleContextMessage(message);
        } catch (error) {
          console.error('Error parsing context message:', error);
        }
      });

    } catch (error) {
      console.error('Failed to connect to SharedContextServer:', error);
      this.scheduleContextReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectInterval) return;

    this.reconnectInterval = setInterval(() => {
      console.log('🔄 Attempting to reconnect to monitor...');
      this.connectToMonitor();
    }, 5000);
  }

  /**
   * Schedule SharedContext reconnection
   */
  private scheduleContextReconnect(): void {
    if (this.contextReconnectInterval) return;
    
    this.contextReconnectInterval = setInterval(() => {
      console.log('🔄 Attempting to reconnect to SharedContextServer...');
      this.connectToSharedContext();
    }, 5000);
  }

  /**
   * Subscribe to context updates
   */
  private subscribeToContextUpdates(): void {
    if (this.sharedContextClient?.readyState === WebSocket.OPEN) {
      // Subscribe to task pool updates
      this.sharedContextClient.send(JSON.stringify({
        type: 'subscribe',
        topics: ['task_pool', 'token_optimization', 'agent_coordination', 'context_sharing']
      }));
    }
  }

  /**
   * Handle messages from monitor dashboard
   */
  private handleMonitorMessage(message: any): void {
    switch (message.type) {
      case 'rebalance_tasks':
        console.log('📋 Rebalancing tasks requested from dashboard');
        // Forward to task pool manager if available
        this.emit('rebalance_tasks');
        break;
        
      case 'reassign_tasks':
        console.log(`🔄 Reassigning tasks from ${message.fromAgent} to ${message.toAgent}`);
        this.emit('reassign_tasks', message.fromAgent, message.toAgent);
        break;
        
      case 'pause_agent':
      case 'resume_agent':
        // Forward agent control messages
        this.emit(message.type, message.agentId);
        break;
    }
  }

  /**
   * Handle messages from SharedContextServer
   */
  private handleContextMessage(message: any): void {
    switch (message.type) {
      case 'task_pool_update':
        this.sendToMonitor({
          type: 'task_pool_update',
          data: message.data
        });
        break;
        
      case 'context_sharing_update':
        this.sendToMonitor({
          type: 'context_sharing_update',
          data: {
            contextShares: message.data.contextShares,
            tokenMetrics: {
              totalTokensSaved: message.data.totalTokensSaved,
              averageSavingsPerTask: message.data.averageSavingsPerTask,
              contextShareRate: message.data.contextShareRate,
              cachingEfficiency: message.data.cachingEfficiency,
              compressionRatio: message.data.compressionRatio,
              realTimeOptimization: message.data.realTimeOptimization
            }
          }
        });
        break;
        
      case 'agent_coordination_update':
        this.sendToMonitor({
          type: 'agent_coordination_update',
          data: message.data
        });
        break;
        
      case 'metrics_update':
        // Forward real-time metrics to dashboard
        this.sendToMonitor({
          type: 'shared_context_metrics',
          data: message.data
        });
        break;
    }
  }

  /**
   * Send message to monitor dashboard
   */
  private sendToMonitor(message: any): void {
    if (this.connected && this.wsClient?.readyState === WebSocket.OPEN) {
      try {
        this.wsClient.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending to monitor:', error);
      }
    }
  }

  /**
   * Setup events from ProgressTracker
   */
  private setupProgressTrackerEvents(): void {
    // Listen for task updates
    this.progressTracker.on('task:updated', (task: TaskProgress) => {
      this.sendToMonitor({
        type: 'task_update',
        data: {
          id: task.id,
          agentId: task.agentId,
          agentName: this.formatAgentName(task.agentId),
          description: task.task,
          status: task.status,
          timestamp: new Date().toISOString(),
          duration: task.duration ? this.formatDuration(task.duration) : undefined
        }
      });
    });

    // Listen for agent progress updates
    this.progressTracker.on('progress:updated', (progress: ProjectProgress) => {
      const agents = this.convertProgressToAgents(progress);
      this.sendToMonitor({
        type: 'agents_update',
        data: agents
      });
    });

    // Listen for project changes
    this.progressTracker.on('project:changed', (projectId: string) => {
      this.sendToMonitor({
        type: 'project_changed',
        data: { projectId }
      });
    });
  }

  /**
   * Send initial data when connecting
   */
  private async sendInitialData(): Promise<void> {
    try {
      const allProgress = this.progressTracker.getAllProgress();
      
      if (allProgress.length > 0) {
        const currentProject = allProgress[0]; // Use first project as active
        const agents = this.convertProgressToAgents(currentProject);
        
        this.sendToMonitor({
          type: 'initial_data',
          data: {
            project: {
              name: currentProject.projectName,
              path: currentProject.projectId
            },
            agents: agents,
            tasks: [], // Will be populated as tasks are updated
            phases: this.convertPhases(currentProject.phases),
            systemHealth: {
              cpu: 25,
              memory: 45,
              disk: 35,
              network: 2
            },
            sharedContextConnected: this.contextConnected
          }
        });
        
        // Also send SharedContext connection status
        this.sendToMonitor({
          type: 'shared_context_connected',
          connected: this.contextConnected
        });
      }
    } catch (error) {
      console.error('Error sending initial data to monitor:', error);
    }
  }

  /**
   * Convert progress data to monitor agent format
   */
  private convertProgressToAgents(progress: ProjectProgress): any[] {
    const agents: any[] = [];
    
    // Create agents from phase data
    progress.phases.forEach(phase => {
      Object.keys(phase.agents).forEach(agentId => {
        const agentData = phase.agents[agentId];
        const existingAgent = agents.find(a => a.id === agentId);
        
        if (existingAgent) {
          // Update existing agent
          existingAgent.totalTasks += agentData.tasks;
          existingAgent.completedTasks += agentData.completed;
        } else {
          // Create new agent
          const progressPercent = agentData.tasks > 0 
            ? Math.round((agentData.completed / agentData.tasks) * 100)
            : 0;
            
          agents.push({
            id: agentId,
            name: this.formatAgentName(agentId),
            type: agentId.split('-')[0] || 'agent',
            icon: this.getAgentIcon(agentId),
            color: this.getAgentColor(agentId),
            status: this.getAgentStatus(progressPercent, agentData.failed),
            progress: progressPercent,
            currentTask: this.getCurrentTask(agentId, progress.activeTasks),
            completedTasks: agentData.completed,
            totalTasks: agentData.tasks,
            duration: '0h 0m', // TODO: Calculate from active tasks
            tokens: Math.round(Math.random() * 5000) // TODO: Get real token usage
          });
        }
      });
    });

    return agents;
  }

  /**
   * Convert phases to monitor format
   */
  private convertPhases(phases: any[]): any[] {
    return phases.map(phase => ({
      id: `phase-${phase.phase}`,
      name: phase.name,
      status: phase.status,
      progress: phase.totalTasks > 0 
        ? Math.round((phase.completedTasks / phase.totalTasks) * 100)
        : 0,
      agents: Object.keys(phase.agents)
    }));
  }

  /**
   * Format agent name for display
   */
  private formatAgentName(agentId: string): string {
    return agentId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get current task for agent
   */
  private getCurrentTask(agentId: string, activeTasks: TaskProgress[]): string {
    const agentTask = activeTasks.find(task => task.agentId === agentId);
    return agentTask?.task || 'Waiting for tasks...';
  }

  /**
   * Get agent status based on progress
   */
  private getAgentStatus(progress: number, failedTasks: number): string {
    if (failedTasks > 0) return 'error';
    if (progress === 100) return 'completed';
    if (progress > 0) return 'working';
    return 'idle';
  }

  /**
   * Get agent icon
   */
  private getAgentIcon(agentId: string): string {
    const icons: { [key: string]: string } = {
      'frontend': '🎨',
      'backend': '⚙️',
      'database': '🗄️',
      'devops': '🚀',
      'testing': '🧪',
      'security': '🔒',
      'mobile': '📱',
      'ai': '🤖',
      'designer': '🎨',
      'code-review': '🔍'
    };
    
    const type = agentId.split('-')[0];
    return icons[type] || '🤖';
  }

  /**
   * Get agent color
   */
  private getAgentColor(agentId: string): string {
    const colors: { [key: string]: string } = {
      'frontend': 'blue',
      'backend': 'green',
      'database': 'purple',
      'devops': 'orange',
      'testing': 'red',
      'security': 'yellow',
      'mobile': 'cyan',
      'ai': 'pink',
      'designer': 'blue',
      'code-review': 'gray'
    };
    
    const type = agentId.split('-')[0];
    return colors[type] || 'gray';
  }

  /**
   * Format duration in readable format
   */
  private formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Disconnect from monitor and SharedContextServer
   */
  disconnect(): void {
    // Clear reconnection timers
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    
    if (this.contextReconnectInterval) {
      clearInterval(this.contextReconnectInterval);
      this.contextReconnectInterval = null;
    }
    
    // Close monitor connection
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = null;
    }
    
    // Close SharedContext connection
    if (this.sharedContextClient) {
      this.sharedContextClient.close();
      this.sharedContextClient = null;
    }
    
    this.connected = false;
    this.contextConnected = false;
  }
}