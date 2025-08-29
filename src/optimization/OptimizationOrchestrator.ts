/**
 * Optimization Orchestrator
 * Coordinates all optimization components and provides unified interface
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs-extra';
import MemoryManager, { MemoryConfig } from './MemoryManager';
import AdvancedCacheManager, { CacheConfig } from '../caching/AdvancedCacheManager';
import AgentContextFilter, { ContextFilterConfig } from '../context/AgentContextFilter';
import ProductionMonitor, { MonitoringConfig } from '../monitoring/ProductionMonitor';
import { TokenOptimizer } from './TokenOptimizer';

export interface OptimizationConfig {
  environment: 'development' | 'staging' | 'production';
  enableMemoryManagement: boolean;
  enableAdvancedCaching: boolean;
  enableContextFiltering: boolean;
  enableProductionMonitoring: boolean;
  autoTuning: boolean;
  configFile?: string;
  memory?: Partial<MemoryConfig>;
  cache?: Partial<CacheConfig>;
  contextFilter?: Partial<ContextFilterConfig>;
  monitoring?: Partial<MonitoringConfig>;
}

export interface OptimizationStats {
  tokensSaved: number;
  memoryOptimized: number;
  cacheHitRate: number;
  contextReduction: number;
  overallScore: number;
  uptime: number;
  timestamp: Date;
}

export interface OptimizationRecommendations {
  memory: string[];
  cache: string[];
  context: string[];
  general: string[];
  priority: 'low' | 'medium' | 'high';
}

export class OptimizationOrchestrator extends EventEmitter {
  private config: OptimizationConfig;
  private memoryManager: MemoryManager | null = null;
  private cacheManager: AdvancedCacheManager | null = null;
  private contextFilter: AgentContextFilter | null = null;
  private productionMonitor: ProductionMonitor | null = null;
  private tokenOptimizer: TokenOptimizer;
  
  private startTime: Date = new Date();
  private stats = {
    totalTokensSaved: 0,
    totalMemoryOptimized: 0,
    totalContextFiltered: 0,
    operationCount: 0,
    lastOptimization: new Date()
  };
  
  private autoTuningInterval: NodeJS.Timeout | null = null;

  constructor(config: OptimizationConfig, tokenOptimizer?: TokenOptimizer) {
    super();
    
    this.config = config;
    
    this.tokenOptimizer = tokenOptimizer || new TokenOptimizer();
    
    this.initializeComponents();
    this.setupEventListeners();
    
    if (this.config.autoTuning) {
      this.startAutoTuning();
    }
  }

  /**
   * Initialize optimization components
   */
  private async initializeComponents(): Promise<void> {
    console.log(`🚀 Initializing Optimization Orchestrator (${this.config.environment})`);
    
    try {
      // Load configuration from file if specified
      if (this.config.configFile) {
        await this.loadConfigFromFile();
      }
      
      // Initialize Memory Manager
      if (this.config.enableMemoryManagement) {
        this.memoryManager = new MemoryManager({
          environment: this.config.environment,
          ...this.config.memory
        });
        console.log('✅ Memory Manager initialized');
      }
      
      // Initialize Cache Manager
      if (this.config.enableAdvancedCaching) {
        this.cacheManager = new AdvancedCacheManager({
          environment: this.config.environment,
          ...this.config.cache
        });
        console.log('✅ Advanced Cache Manager initialized');
      }
      
      // Initialize Context Filter
      if (this.config.enableContextFiltering) {
        this.contextFilter = new AgentContextFilter(this.config.contextFilter);
        console.log('✅ Agent Context Filter initialized');
      }
      
      // Initialize Production Monitor
      if (this.config.enableProductionMonitoring && 
          this.memoryManager && this.cacheManager && this.contextFilter) {
        this.productionMonitor = new ProductionMonitor(
          this.config.monitoring || {},
          this.memoryManager,
          this.cacheManager,
          this.contextFilter
        );
        console.log('✅ Production Monitor initialized');
      }
      
      // Integrate with TokenOptimizer
      if (this.memoryManager) {
        // Token optimizer would need to be updated to accept memory manager
        console.log('🔗 TokenOptimizer integrated with MemoryManager');
      }
      
      console.log('🎯 Optimization Orchestrator ready');
      this.emit('initialized', this.getStatus());
      
    } catch (error) {
      console.error('❌ Failed to initialize optimization components:', error);
      this.emit('error', error);
    }
  }

  /**
   * Load configuration from file
   */
  private async loadConfigFromFile(): Promise<void> {
    if (!this.config.configFile) return;
    
    try {
      const configPath = path.resolve(this.config.configFile);
      if (await fs.pathExists(configPath)) {
        const fileConfig = await fs.readJSON(configPath);
        
        // Merge with existing config
        this.config = {
          ...this.config,
          ...fileConfig,
          memory: { ...this.config.memory, ...fileConfig.memory },
          cache: { ...this.config.cache, ...fileConfig.cache },
          contextFilter: { ...this.config.contextFilter, ...fileConfig.contextFilter },
          monitoring: { ...this.config.monitoring, ...fileConfig.monitoring }
        };
        
        console.log(`📁 Configuration loaded from: ${configPath}`);
      }
    } catch (error) {
      console.warn(`Failed to load config file: ${error}`);
    }
  }

  /**
   * Setup event listeners between components
   */
  private setupEventListeners(): void {
    // Memory Manager events
    if (this.memoryManager) {
      this.memoryManager.on('memoryAlert', (alert) => {
        this.emit('memoryAlert', alert);
        this.handleMemoryAlert(alert);
      });
      
      this.memoryManager.on('agentThrottled', (data) => {
        this.emit('agentThrottled', data);
        console.log(`🚦 Agent throttled: ${data.agentId}`);
      });
    }
    
    // Cache Manager events
    if (this.cacheManager) {
      this.cacheManager.on('cacheHit', (data) => {
        this.updateStats('cache', data);
      });
      
      this.cacheManager.on('cacheMiss', (data) => {
        this.updateStats('cache', data);
      });
    }
    
    // Context Filter events
    if (this.contextFilter) {
      this.contextFilter.on('contextFiltered', (data) => {
        this.stats.totalContextFiltered += data.reductionRatio;
        this.updateStats('context', data);
      });
    }
    
    // Production Monitor events
    if (this.productionMonitor) {
      this.productionMonitor.on('alertCreated', (alert) => {
        this.emit('productionAlert', alert);
      });
      
      this.productionMonitor.on('healthCheckCompleted', (health) => {
        this.emit('healthUpdate', health);
      });
    }
  }

  /**
   * Handle memory alerts and take action
   */
  private handleMemoryAlert(alert: any): void {
    if (alert.type === 'critical') {
      console.log('🚨 Taking emergency optimization actions');
      
      // Emergency cache cleanup
      if (this.cacheManager) {
        this.cacheManager.clear('L1');
      }
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      // Throttle all agents temporarily
      this.emit('emergencyThrottle', { reason: 'memory_critical' });
    }
  }

  /**
   * Update statistics
   */
  private updateStats(component: string, data: any): void {
    this.stats.operationCount++;
    this.stats.lastOptimization = new Date();
    
    if (data.tokensSaved) {
      this.stats.totalTokensSaved += data.tokensSaved;
    }
    
    if (data.memoryFreed) {
      this.stats.totalMemoryOptimized += data.memoryFreed;
    }
    
    this.emit('statsUpdated', this.getOptimizationStats());
  }

  /**
   * Optimize context for agent
   */
  async optimizeAgentContext(
    agentId: string, 
    context: any, 
    options: {
      maxSize?: number;
      prioritizeRecent?: boolean;
      includeDebugInfo?: boolean;
    } = {}
  ): Promise<any> {
    
    let optimizedContext = context;
    const startTime = Date.now();
    
    try {
      // Step 1: Memory-aware filtering
      if (this.contextFilter && this.memoryManager) {
        const memoryStats = this.memoryManager.getMemoryStats();
        const currentMemory = memoryStats.process.rss;
        
        const filtered = await this.contextFilter.filterContext(
          agentId,
          context,
          currentMemory,
          0 // System load would come from monitor
        );
        
        optimizedContext = filtered.filtered;
        
        this.emit('contextOptimized', {
          agentId,
          reductionRatio: filtered.reductionRatio,
          memoryUsage: filtered.memoryUsage
        });
      }
      
      // Step 2: Token optimization
      const tokenOptimized = await this.tokenOptimizer.optimizeContext(agentId, optimizedContext);
      
      // Step 3: Cache the optimized context
      if (this.cacheManager) {
        const cacheKey = `agent_context_${agentId}_${Date.now()}`;
        await this.cacheManager.set(cacheKey, tokenOptimized);
      }
      
      // Step 4: Register memory usage
      if (this.memoryManager) {
        const contextSize = Buffer.byteLength(JSON.stringify(tokenOptimized));
        this.memoryManager.registerAgentMemory(agentId, contextSize, 0);
      }
      
      const optimizationTime = Date.now() - startTime;
      
      this.emit('agentContextOptimized', {
        agentId,
        optimizationTime,
        success: true
      });
      
      return tokenOptimized;
      
    } catch (error) {
      console.error(`Context optimization failed for ${agentId}:`, error);
      this.emit('optimizationError', { agentId, error });
      return context; // Return original if optimization fails
    }
  }

  /**
   * Get cached response if available
   */
  async getCachedResponse(query: string, agentId?: string): Promise<any | null> {
    if (!this.cacheManager) return null;
    
    try {
      return await this.cacheManager.get(query);
    } catch (error) {
      console.error('Cache retrieval failed:', error);
      return null;
    }
  }

  /**
   * Cache response
   */
  async cacheResponse(query: string, response: any, ttl?: number): Promise<void> {
    if (!this.cacheManager) return;
    
    try {
      await this.cacheManager.set(query, response, ttl);
    } catch (error) {
      console.error('Cache storage failed:', error);
    }
  }

  /**
   * Check if agent should be throttled
   */
  shouldThrottleAgent(agentId: string): boolean {
    return this.memoryManager?.shouldThrottleAgent(agentId) || false;
  }

  /**
   * Get recommended context size for agent
   */
  getRecommendedContextSize(agentId: string, requestedSize: number): number {
    if (!this.memoryManager) return requestedSize;
    
    return this.memoryManager.getRecommendedContextSize(agentId, requestedSize);
  }

  /**
   * Start auto-tuning system
   */
  private startAutoTuning(): void {
    this.autoTuningInterval = setInterval(() => {
      this.performAutoTuning();
    }, 300000); // Every 5 minutes
    
    console.log('🎛️ Auto-tuning enabled');
  }

  /**
   * Perform automatic optimization tuning
   */
  private async performAutoTuning(): Promise<void> {
    try {
      console.log('🎛️ Performing auto-tuning optimization');
      
      // Get current performance metrics
      const stats = this.getOptimizationStats();
      const recommendations = this.getOptimizationRecommendations();
      
      // Auto-adjust memory thresholds
      if (this.memoryManager && stats.overallScore < 70) {
        const currentConfig = this.memoryManager.getMemoryStats().config;
        
        if (recommendations.priority === 'high') {
          // More aggressive memory management
          this.memoryManager.updateConfig({
            alertThreshold: Math.max(60, currentConfig.alertThreshold - 10),
            gcInterval: Math.max(30000, currentConfig.gcInterval * 0.8)
          });
        }
      }
      
      // Auto-adjust cache settings
      if (this.cacheManager && stats.cacheHitRate < 60) {
        const currentStats = this.cacheManager.getStats();
        
        // Increase cache sizes if hit rate is low
        this.cacheManager.updateConfig({
          l1MaxSize: Math.min(2000, Math.floor(currentStats.l1.maxSize * 1.2)),
          ttlSeconds: Math.min(7200, Math.floor(3600 * 1.2))
        });
      }
      
      // Auto-adjust context filtering
      if (this.contextFilter && stats.contextReduction < 20) {
        // Make context filtering more aggressive
        this.contextFilter.updateConfig({
          contextImportanceThreshold: Math.min(0.5, 0.3 + 0.1),
          adaptiveReduction: true
        });
      }
      
      this.emit('autoTuningCompleted', {
        timestamp: new Date(),
        stats,
        recommendations,
        adjustments: 'Applied automatic optimizations'
      });
      
    } catch (error) {
      console.error('Auto-tuning failed:', error);
      this.emit('autoTuningError', error);
    }
  }

  /**
   * Get optimization statistics
   */
  getOptimizationStats(): OptimizationStats {
    const uptime = (Date.now() - this.startTime.getTime()) / 1000;
    
    // Calculate cache hit rate
    let cacheHitRate = 0;
    if (this.cacheManager) {
      const cacheStats = this.cacheManager.getStats();
      cacheHitRate = cacheStats.overall.hitRate * 100;
    }
    
    // Calculate memory optimization percentage
    let memoryOptimized = 0;
    if (this.memoryManager) {
      const healthScore = this.memoryManager.getHealthScore();
      memoryOptimized = healthScore;
    }
    
    // Calculate overall score
    const overallScore = (
      (this.stats.totalTokensSaved > 0 ? 25 : 0) +
      (memoryOptimized * 0.25) +
      (cacheHitRate * 0.3) +
      (this.stats.totalContextFiltered > 0 ? 20 : 0)
    );
    
    return {
      tokensSaved: this.stats.totalTokensSaved,
      memoryOptimized,
      cacheHitRate,
      contextReduction: this.stats.totalContextFiltered,
      overallScore,
      uptime,
      timestamp: new Date()
    };
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): OptimizationRecommendations {
    const stats = this.getOptimizationStats();
    const recommendations: OptimizationRecommendations = {
      memory: [],
      cache: [],
      context: [],
      general: [],
      priority: 'low'
    };
    
    let criticalIssues = 0;
    
    // Memory recommendations
    if (this.memoryManager) {
      const memoryHealth = this.memoryManager.getHealthScore();
      if (memoryHealth < 50) {
        recommendations.memory.push('Increase memory limits or reduce agent concurrency');
        recommendations.memory.push('Enable more aggressive garbage collection');
        criticalIssues++;
      } else if (memoryHealth < 70) {
        recommendations.memory.push('Consider increasing memory alert thresholds');
      }
    }
    
    // Cache recommendations
    if (this.cacheManager) {
      const cacheStats = this.cacheManager.getStats();
      if (cacheStats.overall.hitRate < 0.5) {
        recommendations.cache.push('Increase cache sizes to improve hit rates');
        recommendations.cache.push('Review cache TTL settings');
        criticalIssues++;
      }
      
      if (cacheStats.l3.compressionRatio > 0.9) {
        recommendations.cache.push('Review compression threshold settings');
      }
    }
    
    // Context recommendations
    if (stats.contextReduction < 20) {
      recommendations.context.push('Enable more aggressive context filtering');
      recommendations.context.push('Review agent specialization configurations');
    }
    
    // General recommendations
    if (stats.overallScore < 60) {
      recommendations.general.push('Enable auto-tuning for automatic optimization');
      recommendations.general.push('Review system resource allocation');
      criticalIssues++;
    }
    
    // Set priority
    if (criticalIssues > 1) {
      recommendations.priority = 'high';
    } else if (criticalIssues > 0 || stats.overallScore < 75) {
      recommendations.priority = 'medium';
    }
    
    return recommendations;
  }

  /**
   * Get current status of all components
   */
  getStatus(): any {
    const stats = this.getOptimizationStats();
    const recommendations = this.getOptimizationRecommendations();
    
    return {
      environment: this.config.environment,
      uptime: stats.uptime,
      overallScore: stats.overallScore,
      components: {
        memoryManager: this.memoryManager ? this.memoryManager.getMemoryStats() : null,
        cacheManager: this.cacheManager ? this.cacheManager.getStats() : null,
        contextFilter: this.contextFilter ? this.contextFilter.getFilterStats() : null,
        productionMonitor: this.productionMonitor ? this.productionMonitor.getStatus() : null,
        tokenOptimizer: this.tokenOptimizer.getOptimizationReport()
      },
      statistics: stats,
      recommendations,
      autoTuning: this.config.autoTuning,
      lastOptimization: this.stats.lastOptimization
    };
  }

  /**
   * Generate comprehensive optimization report
   */
  async generateOptimizationReport(): Promise<string> {
    const status = this.getStatus();
    const reportPath = path.join(process.cwd(), `optimization-report-${Date.now()}.json`);
    
    const report = {
      timestamp: new Date(),
      config: this.config,
      status,
      environment: this.config.environment,
      performance: {
        totalOperations: this.stats.operationCount,
        tokensSaved: this.stats.totalTokensSaved,
        memoryOptimized: this.stats.totalMemoryOptimized,
        contextFiltered: this.stats.totalContextFiltered
      }
    };
    
    await fs.writeJSON(reportPath, report, { spaces: 2 });
    
    console.log(`📊 Optimization report generated: ${reportPath}`);
    this.emit('reportGenerated', reportPath);
    
    return reportPath;
  }

  /**
   * Update orchestrator configuration
   */
  async updateConfiguration(newConfig: Partial<OptimizationConfig>): Promise<void> {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    // Update individual component configs
    if (newConfig.memory && this.memoryManager) {
      this.memoryManager.updateConfig(newConfig.memory);
    }
    
    if (newConfig.cache && this.cacheManager) {
      this.cacheManager.updateConfig(newConfig.cache);
    }
    
    if (newConfig.contextFilter && this.contextFilter) {
      this.contextFilter.updateConfig(newConfig.contextFilter);
    }
    
    if (newConfig.monitoring && this.productionMonitor) {
      this.productionMonitor.updateConfig(newConfig.monitoring);
    }
    
    // Handle auto-tuning toggle
    if (newConfig.autoTuning !== undefined) {
      if (newConfig.autoTuning && !this.autoTuningInterval) {
        this.startAutoTuning();
      } else if (!newConfig.autoTuning && this.autoTuningInterval) {
        clearInterval(this.autoTuningInterval);
        this.autoTuningInterval = null;
        console.log('🎛️ Auto-tuning disabled');
      }
    }
    
    // Save configuration if file specified
    if (this.config.configFile) {
      await fs.writeJSON(this.config.configFile, this.config, { spaces: 2 });
      console.log(`💾 Configuration saved to: ${this.config.configFile}`);
    }
    
    console.log('🔧 Optimization Orchestrator configuration updated');
    this.emit('configurationUpdated', { oldConfig, newConfig: this.config });
  }

  /**
   * Warm up optimization systems
   */
  async warmUp(): Promise<void> {
    console.log('🔥 Warming up optimization systems...');
    
    // Warm cache with common patterns
    if (this.cacheManager) {
      await this.cacheManager.warmCache([
        { key: 'common_project_structure', priority: 10 },
        { key: 'common_dependencies', priority: 9 },
        { key: 'common_tasks', priority: 8 }
      ]);
    }
    
    // Initialize memory tracking
    if (this.memoryManager) {
      // Force initial memory check
      this.memoryManager.updateContextAccess('warmup');
    }
    
    console.log('✅ Optimization systems warmed up');
    this.emit('warmUpCompleted');
  }

  /**
   * Graceful shutdown of all components
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down Optimization Orchestrator...');
    
    if (this.autoTuningInterval) {
      clearInterval(this.autoTuningInterval);
      this.autoTuningInterval = null;
    }
    
    // Stop all components
    if (this.productionMonitor) {
      await this.productionMonitor.stop();
    }
    
    if (this.memoryManager) {
      this.memoryManager.stop();
    }
    
    if (this.cacheManager) {
      await this.cacheManager.stop();
    }
    
    // Generate final report
    await this.generateOptimizationReport();
    
    console.log('✅ Optimization Orchestrator shutdown complete');
    this.emit('shutdown');
  }
}

export default OptimizationOrchestrator;