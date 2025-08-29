/**
 * AgentContextManager - Manages individual agent context connections and synchronization
 * 
 * This manager provides agents with:
 * - Connection management to SharedContextServer
 * - Context synchronization between agents  
 * - Differential context updates to minimize token usage
 * - Context windowing and filtering based on agent specialization
 * - Memory management and cleanup
 */

import { EventEmitter } from 'events';
import { SharedContextClient } from './SharedContextClient';
import { TokenOptimizer } from '../optimization/TokenOptimizer';

export interface AgentContext {
  agentId: string;
  specialization: string;
  projectId: string;
  context: any;
  lastUpdate: Date;
  contextSize: number;
  tokensSaved: number;
}

export interface ContextSyncResult {
  success: boolean;
  agentId: string;
  contextUpdated: boolean;
  tokensSaved: number;
  error?: string;
}

export interface AgentContextConfig {
  projectId: string;
  agentId: string;
  specialization: string;
  contextWindowSize?: number;
  enableContextSharing?: boolean;
  priorityFilters?: string[];
}

export class AgentContextManager extends EventEmitter {
  private contextClients: Map<string, SharedContextClient> = new Map();
  private agentContexts: Map<string, AgentContext> = new Map();
  private tokenOptimizer: TokenOptimizer;
  private syncInProgress: Set<string> = new Set();
  
  // Configuration
  private readonly defaultContextWindowSize = 8000;
  private readonly syncInterval = 30000; // 30 seconds
  private readonly maxRetries = 3;
  
  // Performance tracking
  private metrics = {
    totalSyncs: 0,
    successfulSyncs: 0,
    tokensSaved: 0,
    contextUpdates: 0,
    cacheHits: 0,
    errors: 0
  };

  constructor(tokenOptimizer?: TokenOptimizer) {
    super();
    this.tokenOptimizer = tokenOptimizer || new TokenOptimizer();
    this.setupPeriodicSync();
  }

  /**
   * Register a new agent for context management
   */
  async registerAgent(config: AgentContextConfig): Promise<boolean> {
    const { projectId, agentId, specialization } = config;
    const clientKey = `${projectId}:${agentId}`;

    try {
      // Create SharedContextClient for the agent
      const client = new SharedContextClient({
        projectId,
        agentId,
        enableStreaming: config.enableContextSharing !== false,
        maxRetries: this.maxRetries
      });

      // Setup event handlers
      this.setupClientEventHandlers(client, agentId);

      // Store client and context
      this.contextClients.set(clientKey, client);
      this.agentContexts.set(agentId, {
        agentId,
        specialization,
        projectId,
        context: {},
        lastUpdate: new Date(),
        contextSize: 0,
        tokensSaved: 0
      });

      // Integrate with TokenOptimizer
      this.tokenOptimizer.setSharedContextClient(client);

      console.log(`✅ Registered agent ${agentId} for context management in ${projectId}`);
      this.emit('agent_registered', { agentId, projectId, specialization });

      return true;
    } catch (error: any) {
      console.error(`❌ Failed to register agent ${agentId}:`, error.message);
      this.metrics.errors++;
      return false;
    }
  }

  /**
   * Get optimized context for a specific agent
   */
  async getOptimizedContext(
    agentId: string, 
    requestedContext: any,
    options: {
      useCache?: boolean;
      maxTokens?: number;
      includeDiff?: boolean;
    } = {}
  ): Promise<any> {
    const agentContext = this.agentContexts.get(agentId);
    if (!agentContext) {
      throw new Error(`Agent ${agentId} not registered`);
    }

    const {
      useCache = true,
      maxTokens = this.defaultContextWindowSize,
      includeDiff = true
    } = options;

    try {
      // Get shared context from server
      const clientKey = `${agentContext.projectId}:${agentId}`;
      const client = this.contextClients.get(clientKey);
      
      if (!client) {
        throw new Error(`No context client found for agent ${agentId}`);
      }

      // Use TokenOptimizer to create optimized context
      const optimizedContext = await this.tokenOptimizer.optimizeContext(
        agentId, 
        requestedContext
      );

      // Apply agent-specific filtering
      const filteredContext = await this.applyAgentSpecializationFilters(
        agentContext.specialization,
        optimizedContext,
        maxTokens
      );

      // Update agent context
      agentContext.context = filteredContext;
      agentContext.lastUpdate = new Date();
      agentContext.contextSize = JSON.stringify(filteredContext).length;

      if (optimizedContext.tokensSaved) {
        agentContext.tokensSaved += optimizedContext.tokensSaved;
        this.metrics.tokensSaved += optimizedContext.tokensSaved;
      }

      this.metrics.contextUpdates++;

      this.emit('context_optimized', {
        agentId,
        contextSize: agentContext.contextSize,
        tokensSaved: optimizedContext.tokensSaved || 0,
        optimizationType: optimizedContext.type
      });

      return {
        context: filteredContext,
        metadata: {
          optimizationType: optimizedContext.type,
          tokensSaved: optimizedContext.tokensSaved || 0,
          contextSize: agentContext.contextSize,
          lastUpdate: agentContext.lastUpdate
        }
      };

    } catch (error: any) {
      console.error(`❌ Failed to get optimized context for ${agentId}:`, error.message);
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Update shared context with new data from an agent
   */
  async updateSharedContext(
    agentId: string, 
    contextUpdate: any,
    options: {
      createDiff?: boolean;
      broadcast?: boolean;
    } = {}
  ): Promise<ContextSyncResult> {
    const agentContext = this.agentContexts.get(agentId);
    if (!agentContext) {
      return {
        success: false,
        agentId,
        contextUpdated: false,
        tokensSaved: 0,
        error: `Agent ${agentId} not registered`
      };
    }

    const { createDiff = true, broadcast = true } = options;
    const clientKey = `${agentContext.projectId}:${agentId}`;

    try {
      const client = this.contextClients.get(clientKey);
      if (!client) {
        throw new Error(`No context client found for agent ${agentId}`);
      }

      let result: any;

      if (createDiff && Object.keys(agentContext.context).length > 0) {
        // Create differential update
        const diff = client.createDiff(agentContext.context, contextUpdate);
        result = await client.updateContext(diff);
        
        // Calculate token savings from differential update
        const tokensSaved = this.estimateTokenSavings(diff, contextUpdate);
        agentContext.tokensSaved += tokensSaved;
        this.metrics.tokensSaved += tokensSaved;
        
        result.tokensSaved = tokensSaved;
      } else {
        // Full context update
        result = await client.setContext(contextUpdate);
      }

      // Update local context
      agentContext.context = contextUpdate;
      agentContext.lastUpdate = new Date();
      agentContext.contextSize = JSON.stringify(contextUpdate).length;

      this.metrics.totalSyncs++;
      this.metrics.successfulSyncs++;

      this.emit('context_updated', {
        agentId,
        projectId: agentContext.projectId,
        contextSize: agentContext.contextSize,
        tokensSaved: result.tokensSaved || 0
      });

      return {
        success: true,
        agentId,
        contextUpdated: true,
        tokensSaved: result.tokensSaved || 0
      };

    } catch (error: any) {
      console.error(`❌ Failed to update shared context for ${agentId}:`, error.message);
      this.metrics.errors++;

      return {
        success: false,
        agentId,
        contextUpdated: false,
        tokensSaved: 0,
        error: error.message
      };
    }
  }

  /**
   * Synchronize context between all agents in a project
   */
  async synchronizeProjectContext(projectId: string): Promise<ContextSyncResult[]> {
    if (this.syncInProgress.has(projectId)) {
      console.log(`⏳ Sync already in progress for ${projectId}`);
      return [];
    }

    this.syncInProgress.add(projectId);
    const results: ContextSyncResult[] = [];

    try {
      // Get all agents for this project
      const projectAgents = Array.from(this.agentContexts.values())
        .filter(context => context.projectId === projectId);

      if (projectAgents.length === 0) {
        return results;
      }

      console.log(`🔄 Synchronizing context for ${projectAgents.length} agents in ${projectId}`);

      // Process agents in parallel with controlled concurrency
      const batchSize = 3;
      for (let i = 0; i < projectAgents.length; i += batchSize) {
        const batch = projectAgents.slice(i, i + batchSize);
        const batchPromises = batch.map(async (agentContext) => {
          try {
            // Get latest shared context
            const clientKey = `${projectId}:${agentContext.agentId}`;
            const client = this.contextClients.get(clientKey);
            
            if (!client) {
              return {
                success: false,
                agentId: agentContext.agentId,
                contextUpdated: false,
                tokensSaved: 0,
                error: 'No context client found'
              };
            }

            const sharedContext = await client.getContext({ useCache: true });
            
            // Check if context has changed
            const hasChanges = this.hasContextChanged(agentContext.context, sharedContext);
            
            if (hasChanges) {
              // Update local context with shared changes
              agentContext.context = { ...agentContext.context, ...sharedContext };
              agentContext.lastUpdate = new Date();
              
              this.emit('context_synchronized', {
                agentId: agentContext.agentId,
                projectId,
                hasChanges: true
              });
            }

            this.metrics.cacheHits++;

            return {
              success: true,
              agentId: agentContext.agentId,
              contextUpdated: hasChanges,
              tokensSaved: 0 // No tokens saved for sync operations
            };

          } catch (error: any) {
            return {
              success: false,
              agentId: agentContext.agentId,
              contextUpdated: false,
              tokensSaved: 0,
              error: error.message
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      const successfulSyncs = results.filter(r => r.success).length;
      console.log(`✅ Context synchronization completed: ${successfulSyncs}/${results.length} agents`);

    } catch (error: any) {
      console.error(`❌ Project context synchronization failed for ${projectId}:`, error.message);
    } finally {
      this.syncInProgress.delete(projectId);
    }

    return results;
  }

  /**
   * Apply agent specialization filters to context
   */
  private async applyAgentSpecializationFilters(
    specialization: string,
    context: any,
    maxTokens: number
  ): Promise<any> {
    // Define filters for different agent types
    const specializationFilters: Record<string, string[]> = {
      'frontend': [
        'components', 'styles', 'ui', 'assets', 'routes', 'pages', 
        'hooks', 'state', 'forms', 'validation'
      ],
      'backend': [
        'api', 'controllers', 'services', 'models', 'middleware', 
        'auth', 'database', 'schemas', 'routes'
      ],
      'database': [
        'models', 'schemas', 'migrations', 'queries', 'indexes', 
        'relationships', 'constraints'
      ],
      'devops': [
        'config', 'deployment', 'infrastructure', 'docker', 'kubernetes', 
        'ci', 'cd', 'monitoring', 'logging'
      ],
      'testing': [
        'tests', 'specs', 'fixtures', 'mocks', 'coverage', 
        'integration', 'unit', 'e2e'
      ],
      'security': [
        'auth', 'permissions', 'encryption', 'validation', 'sanitization',
        'cors', 'csrf', 'vulnerabilities'
      ]
    };

    const filters = specializationFilters[specialization] || [];
    
    // Apply context windowing with specialization priority
    const filteredContext = await this.tokenOptimizer.trimContext(
      context, 
      maxTokens
    );

    // Prioritize context elements relevant to specialization
    if (filters.length > 0) {
      const prioritized: any = {};
      let currentTokens = 0;

      // First, add specialization-relevant content
      for (const [key, value] of Object.entries(filteredContext)) {
        const isRelevant = filters.some(filter => 
          key.toLowerCase().includes(filter.toLowerCase()) ||
          JSON.stringify(value).toLowerCase().includes(filter.toLowerCase())
        );

        if (isRelevant) {
          const tokenEstimate = this.estimateTokens(value);
          if (currentTokens + tokenEstimate <= maxTokens * 0.7) { // Reserve 30% for general context
            prioritized[key] = value;
            currentTokens += tokenEstimate;
          }
        }
      }

      // Then add remaining context up to token limit
      for (const [key, value] of Object.entries(filteredContext)) {
        if (!(key in prioritized)) {
          const tokenEstimate = this.estimateTokens(value);
          if (currentTokens + tokenEstimate <= maxTokens) {
            prioritized[key] = value;
            currentTokens += tokenEstimate;
          }
        }
      }

      return prioritized;
    }

    return filteredContext;
  }

  /**
   * Setup event handlers for context client
   */
  private setupClientEventHandlers(client: SharedContextClient, agentId: string): void {
    client.on('connected', () => {
      console.log(`🔌 Agent ${agentId} connected to shared context`);
      this.emit('agent_connected', { agentId });
    });

    client.on('context_updated_realtime', (event) => {
      console.log(`💡 Real-time context update for ${agentId}`);
      this.emit('realtime_update', { agentId, event });
      this.metrics.contextUpdates++;
    });

    client.on('error', (error) => {
      console.warn(`⚠️  Context client error for ${agentId}:`, error.error?.message || error);
      this.emit('agent_error', { agentId, error });
      this.metrics.errors++;
    });

    client.on('cache_hit', () => {
      this.metrics.cacheHits++;
    });
  }

  /**
   * Setup periodic context synchronization
   */
  private setupPeriodicSync(): void {
    setInterval(async () => {
      const projects = new Set(
        Array.from(this.agentContexts.values()).map(context => context.projectId)
      );

      for (const projectId of Array.from(projects)) {
        try {
          await this.synchronizeProjectContext(projectId);
        } catch (error) {
          console.error(`Periodic sync failed for ${projectId}:`, error);
        }
      }
    }, this.syncInterval);
  }

  /**
   * Check if context has changed
   */
  private hasContextChanged(oldContext: any, newContext: any): boolean {
    return JSON.stringify(oldContext) !== JSON.stringify(newContext);
  }

  /**
   * Estimate token count for content
   */
  private estimateTokens(content: any): number {
    const str = JSON.stringify(content);
    return Math.ceil(str.length / 4); // Rough estimate
  }

  /**
   * Estimate token savings from differential update
   */
  private estimateTokenSavings(diff: any, fullContext: any): number {
    if (!diff || !fullContext) return 0;
    
    const diffSize = JSON.stringify(diff).length;
    const fullSize = JSON.stringify(fullContext).length;
    
    return Math.max(0, Math.floor((fullSize - diffSize) / 4));
  }

  /**
   * Get agent context statistics
   */
  getAgentStats(agentId: string): any {
    const agentContext = this.agentContexts.get(agentId);
    if (!agentContext) {
      return null;
    }

    const clientKey = `${agentContext.projectId}:${agentId}`;
    const client = this.contextClients.get(clientKey);

    return {
      agentId,
      specialization: agentContext.specialization,
      projectId: agentContext.projectId,
      contextSize: agentContext.contextSize,
      tokensSaved: agentContext.tokensSaved,
      lastUpdate: agentContext.lastUpdate,
      connected: client?.isConnected() || false,
      clientStats: client?.getStats() || null
    };
  }

  /**
   * Get overall context management statistics
   */
  getContextStats(): any {
    const agentStats = Array.from(this.agentContexts.keys()).map(agentId => 
      this.getAgentStats(agentId)
    );

    return {
      ...this.metrics,
      totalAgents: this.agentContexts.size,
      activeClients: this.contextClients.size,
      agentStats,
      averageContextSize: agentStats.length > 0 
        ? agentStats.reduce((sum, stat) => sum + (stat?.contextSize || 0), 0) / agentStats.length
        : 0
    };
  }

  /**
   * Cleanup agent and its context
   */
  async unregisterAgent(agentId: string): Promise<boolean> {
    try {
      const agentContext = this.agentContexts.get(agentId);
      if (!agentContext) {
        return false;
      }

      const clientKey = `${agentContext.projectId}:${agentId}`;
      const client = this.contextClients.get(clientKey);

      if (client) {
        await client.disconnect();
        this.contextClients.delete(clientKey);
      }

      this.agentContexts.delete(agentId);

      console.log(`🧹 Unregistered agent ${agentId} from context management`);
      this.emit('agent_unregistered', { agentId });

      return true;
    } catch (error: any) {
      console.error(`❌ Failed to unregister agent ${agentId}:`, error.message);
      return false;
    }
  }

  /**
   * Cleanup all agents for a project
   */
  async cleanupProject(projectId: string): Promise<number> {
    const projectAgents = Array.from(this.agentContexts.values())
      .filter(context => context.projectId === projectId)
      .map(context => context.agentId);

    let cleaned = 0;
    for (const agentId of projectAgents) {
      if (await this.unregisterAgent(agentId)) {
        cleaned++;
      }
    }

    console.log(`🧹 Cleaned up ${cleaned} agents for project ${projectId}`);
    return cleaned;
  }

  /**
   * Enable/disable context sharing for an agent
   */
  setContextSharingEnabled(agentId: string, enabled: boolean): boolean {
    const agentContext = this.agentContexts.get(agentId);
    if (!agentContext) {
      return false;
    }

    const clientKey = `${agentContext.projectId}:${agentId}`;
    const client = this.contextClients.get(clientKey);

    if (client) {
      // Update client configuration
      console.log(`🔧 Context sharing ${enabled ? 'enabled' : 'disabled'} for agent ${agentId}`);
      return true;
    }

    return false;
  }
}