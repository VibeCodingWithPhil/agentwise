/**
 * Production Optimization System
 * Complete initialization and management of all optimization components
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import OptimizationOrchestrator, { OptimizationConfig } from './OptimizationOrchestrator';
import { TokenOptimizer } from './TokenOptimizer';
import { SharedContextClient } from '../context/SharedContextClient';

export interface SystemConfig {
  environment: 'development' | 'staging' | 'production';
  configFile?: string;
  projectId?: string;
  enableSharedContext?: boolean;
  sharedContextUrl?: string;
}

export class ProductionOptimizationSystem {
  private orchestrator: OptimizationOrchestrator | null = null;
  private tokenOptimizer: TokenOptimizer | null = null;
  private sharedContextClient: SharedContextClient | null = null;
  private config: SystemConfig;
  private initialized: boolean = false;

  constructor(config: SystemConfig) {
    this.config = {
      enableSharedContext: false,
      ...config
    };
  }

  /**
   * Initialize the complete optimization system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('Production Optimization System already initialized');
      return;
    }

    console.log('🚀 Initializing Production Optimization System...');
    console.log(`📊 Environment: ${this.config.environment}`);

    try {
      // Step 1: Load configuration
      const optimizationConfig = await this.loadConfiguration();

      // Step 2: Initialize SharedContextClient if enabled
      if (this.config.enableSharedContext && this.config.projectId) {
        this.sharedContextClient = new SharedContextClient({
          projectId: this.config.projectId,
          agentId: 'optimization-system',
          serverUrl: this.config.sharedContextUrl,
          enableStreaming: optimizationConfig.environment === 'production'
        });
        
        console.log('🔗 SharedContextClient initialized');
      }

      // Step 3: Initialize TokenOptimizer with SharedContext
      this.tokenOptimizer = new TokenOptimizer(this.sharedContextClient || undefined);
      console.log('⚡ TokenOptimizer initialized');

      // Step 4: Initialize OptimizationOrchestrator
      this.orchestrator = new OptimizationOrchestrator(optimizationConfig, this.tokenOptimizer);
      
      // Wait for orchestrator to fully initialize
      await new Promise<void>((resolve) => {
        this.orchestrator!.once('initialized', () => {
          resolve();
        });
      });

      // Step 5: Warm up the system
      await this.orchestrator.warmUp();

      this.initialized = true;
      console.log('✅ Production Optimization System fully initialized');

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Failed to initialize Production Optimization System:', error);
      throw error;
    }
  }

  /**
   * Load configuration from file or use defaults
   */
  private async loadConfiguration(): Promise<OptimizationConfig> {
    let config: OptimizationConfig = {
      environment: this.config.environment || 'development' || 'development',
      enableMemoryManagement: true,
      enableAdvancedCaching: true,
      enableContextFiltering: true,
      enableProductionMonitoring: (this.config.environment || 'development') === 'production',
      autoTuning: (this.config.environment || 'development') === 'production'
    };

    // Try to load from config file
    if (this.config.configFile) {
      const configPath = path.resolve(this.config.configFile);
      if (await fs.pathExists(configPath)) {
        const fileConfig = await fs.readJSON(configPath);
        config = { ...config, ...fileConfig };
        console.log(`📁 Configuration loaded from: ${configPath}`);
      }
    } else {
      // Try to load environment-specific config
      const defaultConfigPath = path.join(
        process.cwd(), 
        'config', 
        `optimization.${this.config.environment || 'development'}.json`
      );
      
      if (await fs.pathExists(defaultConfigPath)) {
        const fileConfig = await fs.readJSON(defaultConfigPath);
        config = { ...config, ...fileConfig };
        console.log(`📁 Configuration loaded from: ${defaultConfigPath}`);
      } else {
        console.log('📁 Using default configuration');
      }
    }

    return config;
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`🛑 Received ${signal}, shutting down gracefully...`);
      await this.shutdown();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('💥 Uncaught Exception:', error);
      await this.emergencyShutdown();
      process.exit(1);
    });

    process.on('unhandledRejection', async (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      await this.emergencyShutdown();
      process.exit(1);
    });
  }

  /**
   * Optimize context for agent (main public interface)
   */
  async optimizeAgentContext(agentId: string, context: any, options: any = {}): Promise<any> {
    if (!this.initialized || !this.orchestrator) {
      throw new Error('Production Optimization System not initialized');
    }

    return await this.orchestrator.optimizeAgentContext(agentId, context, options);
  }

  /**
   * Get cached response
   */
  async getCachedResponse(query: string, agentId?: string): Promise<any | null> {
    if (!this.initialized || !this.orchestrator) {
      return null;
    }

    return await this.orchestrator.getCachedResponse(query, agentId);
  }

  /**
   * Cache response
   */
  async cacheResponse(query: string, response: any, ttl?: number): Promise<void> {
    if (!this.initialized || !this.orchestrator) {
      return;
    }

    await this.orchestrator.cacheResponse(query, response, ttl);
  }

  /**
   * Check if agent should be throttled
   */
  shouldThrottleAgent(agentId: string): boolean {
    if (!this.initialized || !this.orchestrator) {
      return false;
    }

    return this.orchestrator.shouldThrottleAgent(agentId);
  }

  /**
   * Get recommended context size for agent
   */
  getRecommendedContextSize(agentId: string, requestedSize: number): number {
    if (!this.initialized || !this.orchestrator) {
      return requestedSize;
    }

    return this.orchestrator.getRecommendedContextSize(agentId, requestedSize);
  }

  /**
   * Get system status
   */
  getStatus(): any {
    if (!this.initialized || !this.orchestrator) {
      return {
        initialized: false,
        error: 'System not initialized'
      };
    }

    return {
      initialized: true,
      ...this.orchestrator.getStatus(),
      tokenOptimizer: this.tokenOptimizer?.getEnhancedOptimizationReport(),
      sharedContext: this.sharedContextClient?.getStats()
    };
  }

  /**
   * Get comprehensive system health
   */
  getHealthStatus(): any {
    if (!this.initialized || !this.tokenOptimizer) {
      return {
        overall: 'down',
        score: 0,
        message: 'System not initialized'
      };
    }

    const tokenOptimizerHealth = this.tokenOptimizer.getProductionHealthStatus();
    const orchestratorStats = this.orchestrator?.getOptimizationStats();
    
    return {
      ...tokenOptimizerHealth,
      systemStats: orchestratorStats,
      uptime: process.uptime(),
      environment: this.config.environment || 'development'
    };
  }

  /**
   * Generate comprehensive system report
   */
  async generateSystemReport(): Promise<string> {
    if (!this.initialized || !this.orchestrator) {
      throw new Error('System not initialized');
    }

    const reportPath = await this.orchestrator.generateOptimizationReport();
    console.log(`📊 System report generated: ${reportPath}`);
    return reportPath;
  }

  /**
   * Update system configuration
   */
  async updateConfiguration(newConfig: Partial<OptimizationConfig>): Promise<void> {
    if (!this.initialized || !this.orchestrator) {
      throw new Error('System not initialized');
    }

    await this.orchestrator.updateConfiguration(newConfig);
    console.log('🔧 System configuration updated');
  }

  /**
   * Perform system maintenance
   */
  async performMaintenance(): Promise<void> {
    if (!this.initialized) {
      throw new Error('System not initialized');
    }

    console.log('🧹 Performing system maintenance...');

    // TokenOptimizer cleanup
    if (this.tokenOptimizer) {
      await this.tokenOptimizer.performProductionCleanup();
    }

    // Force garbage collection
    if (global.gc) {
      global.gc();
    }

    console.log('✅ System maintenance completed');
  }

  /**
   * Start monitoring dashboard (if available)
   */
  async startMonitoringDashboard(): Promise<void> {
    // This would integrate with the existing monitoring system
    console.log('📊 Monitoring dashboard integration available through existing /monitor command');
  }

  /**
   * Emergency shutdown with minimal cleanup
   */
  private async emergencyShutdown(): Promise<void> {
    console.log('🚨 Emergency shutdown initiated...');
    
    try {
      if (this.orchestrator) {
        await this.orchestrator.shutdown();
      }
      
      if (this.sharedContextClient) {
        await this.sharedContextClient.disconnect();
      }
    } catch (error) {
      console.error('Error during emergency shutdown:', error);
    }
    
    console.log('🚨 Emergency shutdown completed');
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    console.log('🛑 Shutting down Production Optimization System...');

    try {
      // Generate final report
      if (this.orchestrator) {
        await this.orchestrator.generateOptimizationReport();
      }

      // Shutdown orchestrator
      if (this.orchestrator) {
        await this.orchestrator.shutdown();
      }

      // Disconnect shared context
      if (this.sharedContextClient) {
        await this.sharedContextClient.disconnect();
      }

      this.initialized = false;
      console.log('✅ Production Optimization System shutdown completed');

    } catch (error) {
      console.error('Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Static factory method for easy initialization
   */
  static async create(config: SystemConfig): Promise<ProductionOptimizationSystem> {
    const system = new ProductionOptimizationSystem(config);
    await system.initialize();
    return system;
  }

  /**
   * Get singleton instance (for global use)
   */
  private static instance: ProductionOptimizationSystem | null = null;
  
  static async getInstance(config?: SystemConfig): Promise<ProductionOptimizationSystem> {
    if (!ProductionOptimizationSystem.instance) {
      if (!config) {
        throw new Error('Configuration required for first initialization');
      }
      ProductionOptimizationSystem.instance = await ProductionOptimizationSystem.create(config);
    }
    return ProductionOptimizationSystem.instance;
  }

  /**
   * Check if system is ready for production use
   */
  isProductionReady(): boolean {
    if (!this.initialized || !this.tokenOptimizer) {
      return false;
    }

    const health = this.tokenOptimizer.getProductionHealthStatus();
    return health.overall !== 'critical' && health.score > 70;
  }
}

export default ProductionOptimizationSystem;