/**
 * ContextIntegration - Integration layer for SharedContextServer with existing systems
 * 
 * This module integrates the SharedContextServer with:
 * - TokenOptimizer for enhanced optimization strategies
 * - DynamicAgentManager for coordinated agent management
 * - WebSocketIntegration for monitoring dashboard updates
 * - ProjectContextManager for project lifecycle management
 */

import { SharedContextServer } from './SharedContextServer';
import { SharedContextClient } from './SharedContextClient';
import { TokenOptimizer } from '../optimization/TokenOptimizer';
import { DynamicAgentManager } from '../orchestrator/DynamicAgentManager';
import { WebSocketIntegration } from '../monitoring/WebSocketIntegration';
import { ProjectContextManager } from './ProjectContextManager';
import { EventEmitter } from 'events';

export interface ContextIntegrationConfig {
  enableServer?: boolean;
  serverPort?: number;
  enableMonitoringIntegration?: boolean;
  tokenOptimizationLevel?: 'basic' | 'advanced' | 'aggressive';
  agentCoordinationEnabled?: boolean;
}

export class ContextIntegration extends EventEmitter {
  private server: SharedContextServer | null = null;
  private clients: Map<string, SharedContextClient> = new Map();
  private tokenOptimizer: TokenOptimizer;
  private agentManager: DynamicAgentManager;
  private projectContextManager: ProjectContextManager;
  private wsIntegration: WebSocketIntegration | null = null;
  private config: Required<ContextIntegrationConfig>;

  // Performance tracking
  private stats = {
    totalTokensSaved: 0,
    contextsShared: 0,
    agentsConnected: 0,
    optimizationRate: 0
  };

  constructor(
    tokenOptimizer: TokenOptimizer,
    agentManager: DynamicAgentManager,
    projectContextManager: ProjectContextManager,
    wsIntegration?: WebSocketIntegration,
    config: ContextIntegrationConfig = {}
  ) {
    super();
    
    this.tokenOptimizer = tokenOptimizer;
    this.agentManager = agentManager;
    this.projectContextManager = projectContextManager;
    this.wsIntegration = wsIntegration || null;
    
    this.config = {
      enableServer: config.enableServer !== false,
      serverPort: config.serverPort || 3003,
      enableMonitoringIntegration: config.enableMonitoringIntegration !== false,
      tokenOptimizationLevel: config.tokenOptimizationLevel || 'advanced',
      agentCoordinationEnabled: config.agentCoordinationEnabled !== false
    };

    // Setup integration will be called in initialize()
  }

  /**
   * Initialize the context integration system
   */
  async initialize(): Promise<void> {
    try {
      // Start the shared context server
      if (this.config.enableServer) {
        this.server = new SharedContextServer(this.tokenOptimizer);
        await this.server.start();
        
        // Setup server event handlers
        this.setupServerEventHandlers();
        console.log('✅ SharedContextServer initialized');
      }

      // Setup project context integration
      this.setupProjectContextIntegration();

      // Setup monitoring integration
      if (this.config.enableMonitoringIntegration && this.wsIntegration) {
        this.setupMonitoringIntegration();
      }

      // Setup agent management integration
      if (this.config.agentCoordinationEnabled) {
        this.setupAgentCoordination();
      }

      this.emit('initialized');
      console.log('🔗 Context integration system initialized');

    } catch (error) {
      console.error('Failed to initialize context integration:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Create a context client for an agent
   */
  async createClientForAgent(
    projectId: string, 
    agentId: string,
    options: { enableStreaming?: boolean } = {}
  ): Promise<SharedContextClient> {
    const clientKey = `${projectId}:${agentId}`;
    
    if (this.clients.has(clientKey)) {
      return this.clients.get(clientKey)!;
    }

    const client = new SharedContextClient({
      projectId,
      agentId,
      enableStreaming: options.enableStreaming !== false,
      serverUrl: `http://localhost:${this.config.serverPort}`
    });

    // Setup client event handlers
    this.setupClientEventHandlers(client, projectId, agentId);

    this.clients.set(clientKey, client);
    this.stats.agentsConnected++;

    console.log(`🔌 Created context client for agent ${agentId} in project ${projectId}`);
    return client;
  }

  /**
   * Optimize context sharing for multiple agents
   */
  async optimizeForAgents(
    projectId: string, 
    agentIds: string[]
  ): Promise<{
    sharedContext: any;
    agentConfigs: Record<string, any>;
    tokensSaved: number;
  }> {
    if (!this.server) {
      throw new Error('SharedContextServer not initialized');
    }

    // Get project context
    const projectContext = this.projectContextManager.getActiveProject();
    if (!projectContext || projectContext.projectName !== projectId) {
      throw new Error('Project not active or not found');
    }

    // Use server's optimization capabilities
    const serverOptimization = await this.server.optimizeForAgents(projectId, agentIds);
    
    // Apply TokenOptimizer strategies
    const tokenOptimization = await this.tokenOptimizer.optimizeAgentConfiguration(
      agentIds, 
      {
        projectPath: projectContext.projectPath,
        tasks: [],
        sharedContext: serverOptimization?.shared
      }
    );

    // Combine optimizations
    const result = {
      sharedContext: serverOptimization?.shared || tokenOptimization.shared,
      agentConfigs: tokenOptimization.agents,
      tokensSaved: this.calculateTokenSavings(tokenOptimization)
    };

    this.stats.totalTokensSaved += result.tokensSaved;
    this.stats.contextsShared++;
    this.updateOptimizationRate();

    this.emit('optimization_applied', {
      projectId,
      agentIds,
      tokensSaved: result.tokensSaved
    });

    return result;
  }

  /**
   * Get real-time context updates for monitoring
   */
  async getContextMetrics(): Promise<any> {
    const serverStats = this.server?.getStats() || {};
    const clientStats = Array.from(this.clients.values()).map(c => c.getStats());

    return {
      server: serverStats,
      clients: clientStats,
      integration: this.stats,
      performance: {
        totalTokensSaved: this.stats.totalTokensSaved,
        optimizationRate: this.stats.optimizationRate,
        activeClients: this.clients.size,
        contextsShared: this.stats.contextsShared
      }
    };
  }

  /**
   * Shutdown the integration system
   */
  async shutdown(): Promise<void> {
    // Disconnect all clients
    for (const client of Array.from(this.clients.values())) {
      await client.disconnect();
    }
    this.clients.clear();

    // Stop the server
    if (this.server) {
      await this.server.stop();
      this.server = null;
    }

    this.emit('shutdown');
    console.log('🛑 Context integration system shutdown');
  }

  /**
   * Setup server event handlers
   */
  private setupServerEventHandlers(): void {
    if (!this.server) return;

    this.server.on('started', () => {
      this.emit('server_started');
    });

    this.server.on('stopped', () => {
      this.emit('server_stopped');
    });

    this.server.on('error', (error) => {
      console.error('SharedContextServer error:', error);
      this.emit('server_error', error);
    });
  }

  /**
   * Setup client event handlers
   */
  private setupClientEventHandlers(
    client: SharedContextClient, 
    projectId: string, 
    agentId: string
  ): void {
    client.on('context_updated', (event) => {
      this.stats.totalTokensSaved += event.tokensSaved || 0;
      this.updateOptimizationRate();
      
      this.emit('agent_context_updated', {
        projectId,
        agentId,
        ...event
      });

      // Forward to monitoring if enabled
      if (this.wsIntegration) {
        this.forwardToMonitoring('context_update', {
          projectId,
          agentId,
          tokensSaved: event.tokensSaved
        });
      }
    });

    client.on('connected', () => {
      console.log(`📡 Agent ${agentId} connected to context stream`);
      this.emit('agent_connected', { projectId, agentId });
    });

    client.on('disconnected', () => {
      console.log(`📡 Agent ${agentId} disconnected from context stream`);
      this.emit('agent_disconnected', { projectId, agentId });
    });

    client.on('error', (error) => {
      console.error(`Context client error for ${agentId}:`, error);
      this.emit('client_error', { projectId, agentId, error });
    });
  }

  /**
   * Setup project context integration
   */
  private setupProjectContextIntegration(): void {
    // Listen for project activation
    this.projectContextManager.on('projectActivated', async (context) => {
      const projectId = context.projectName;
      
      // Initialize shared context for the project
      if (this.server && context.metadata.agents) {
        try {
          // Create clients for existing agents
          for (const agentId of context.metadata.agents) {
            await this.createClientForAgent(projectId, agentId);
          }

          console.log(`🎯 Initialized context sharing for project: ${projectId}`);
        } catch (error) {
          console.error('Error initializing project context:', error);
        }
      }
    });

    // Listen for project deactivation
    this.projectContextManager.on('projectDeactivated', (context) => {
      const projectId = context.projectName;
      
      // Clean up clients for this project
      const projectClients = Array.from(this.clients.entries())
        .filter(([key]) => key.startsWith(`${projectId}:`));
      
      for (const [key, client] of projectClients) {
        client.disconnect();
        this.clients.delete(key);
      }

      console.log(`🧹 Cleaned up context clients for project: ${projectId}`);
    });
  }

  /**
   * Setup monitoring integration
   */
  private setupMonitoringIntegration(): void {
    if (!this.wsIntegration) return;

    // Send context metrics to monitoring dashboard
    setInterval(async () => {
      try {
        const metrics = await this.getContextMetrics();
        this.forwardToMonitoring('context_metrics', metrics);
      } catch (error) {
        console.error('Error sending context metrics to monitor:', error);
      }
    }, 5000); // Every 5 seconds
  }

  /**
   * Setup agent coordination
   */
  private setupAgentCoordination(): void {
    // Integrate with agent launch process
    const originalLaunchOptimized = this.agentManager.launchAgentsOptimized.bind(this.agentManager);
    
    this.agentManager.launchAgentsOptimized = async (projectPath: string, selectedAgents?: string[]) => {
      const projectName = projectPath.split('/').pop() || 'unknown';
      
      // Create context clients for agents before launching
      if (selectedAgents) {
        for (const agentId of selectedAgents) {
          await this.createClientForAgent(projectName, agentId);
        }
      }

      // Apply context optimization
      if (selectedAgents) {
        try {
          const optimization = await this.optimizeForAgents(projectName, selectedAgents);
          console.log(`💡 Applied context optimization: ${optimization.tokensSaved} tokens saved`);
        } catch (error: any) {
          console.warn('Context optimization failed, proceeding with standard launch:', error.message);
        }
      }

      // Proceed with original launch
      return originalLaunchOptimized(projectPath, selectedAgents);
    };
  }

  /**
   * Forward events to monitoring system
   */
  private forwardToMonitoring(type: string, data: any): void {
    if (!this.wsIntegration) return;

    try {
      // This would need to be implemented based on WebSocketIntegration's interface
      // For now, we'll emit an event that monitoring can listen to
      this.emit('monitoring_data', { type, data });
    } catch (error) {
      console.error('Error forwarding to monitoring:', error);
    }
  }

  /**
   * Calculate token savings from optimization
   */
  private calculateTokenSavings(optimization: any): number {
    if (!optimization.estimatedTokens || !optimization.savings) {
      return 0;
    }

    // Extract percentage from savings string like "65% reduction"
    const savingsMatch = optimization.savings.match(/(\d+)%/);
    const percentage = savingsMatch ? parseInt(savingsMatch[1], 10) : 0;
    
    return Math.floor((optimization.estimatedTokens * percentage) / 100);
  }

  /**
   * Update optimization rate
   */
  private updateOptimizationRate(): void {
    if (this.stats.contextsShared > 0) {
      this.stats.optimizationRate = this.stats.totalTokensSaved / this.stats.contextsShared;
    }
  }

  /**
   * Get integration statistics
   */
  getStats(): any {
    return {
      ...this.stats,
      serverRunning: !!this.server,
      clientsCount: this.clients.size,
      config: this.config
    };
  }

  /**
   * Enable/disable specific optimization features
   */
  updateOptimizationLevel(level: 'basic' | 'advanced' | 'aggressive'): void {
    this.config.tokenOptimizationLevel = level;
    
    // Apply configuration changes
    switch (level) {
      case 'aggressive':
        // Enable all optimizations with aggressive settings
        break;
      case 'advanced':
        // Enable standard optimizations
        break;
      case 'basic':
        // Enable only basic optimizations
        break;
    }

    console.log(`🔧 Updated optimization level to: ${level}`);
    this.emit('optimization_level_changed', level);
  }

  /**
   * Health check for the integration system
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: any;
  }> {
    const details: any = {
      server: null,
      clients: 0,
      errors: []
    };

    try {
      // Check server health
      if (this.server) {
        // Assuming server has a health check method
        details.server = 'running';
      } else if (this.config.enableServer) {
        details.errors.push('Server should be running but is not');
      }

      // Check client connections
      let healthyClients = 0;
      for (const client of Array.from(this.clients.values())) {
        if (client.isConnected()) {
          healthyClients++;
        }
      }
      details.clients = healthyClients;

      // Determine overall status
      const hasErrors = details.errors.length > 0;
      const clientIssues = this.clients.size > 0 && healthyClients / this.clients.size < 0.8;

      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (hasErrors) {
        status = 'unhealthy';
      } else if (clientIssues) {
        status = 'degraded';
      } else {
        status = 'healthy';
      }

      return { status, details };

    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          ...details
        }
      };
    }
  }
}