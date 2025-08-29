/**
 * Production-Grade Memory Manager
 * Advanced memory management with garbage collection, monitoring, and alerts
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface MemoryConfig {
  maxMemoryUsage: number; // Maximum memory in MB
  alertThreshold: number; // Alert threshold as percentage
  gcInterval: number; // Garbage collection interval in ms
  contextRetentionTime: number; // Context retention time in ms
  agentMemoryLimit: number; // Per-agent memory limit in MB
  enableDetailedLogging: boolean;
  environment: 'development' | 'staging' | 'production';
}

export interface MemoryUsage {
  total: number;
  used: number;
  free: number;
  percentage: number;
  timestamp: Date;
}

export interface AgentMemoryStats {
  agentId: string;
  contextSize: number;
  cacheSize: number;
  totalMemory: number;
  lastAccessed: Date;
  isThrottled: boolean;
}

export interface MemoryAlert {
  type: 'warning' | 'critical' | 'info';
  message: string;
  memoryUsage: number;
  threshold: number;
  timestamp: Date;
  recommendations: string[];
}

export class MemoryManager extends EventEmitter {
  private config: MemoryConfig;
  private agentMemoryMap: Map<string, AgentMemoryStats> = new Map();
  private memoryHistory: MemoryUsage[] = [];
  private gcInterval: NodeJS.Timeout | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private contextRetentionMap: Map<string, Date> = new Map();
  private throttledAgents: Set<string> = new Set();
  private alertHistory: MemoryAlert[] = [];

  constructor(config: Partial<MemoryConfig> = {}) {
    super();
    
    this.config = {
      maxMemoryUsage: config.maxMemoryUsage || 2048, // 2GB default
      alertThreshold: config.alertThreshold || 80, // 80% threshold
      gcInterval: config.gcInterval || 60000, // 1 minute
      contextRetentionTime: config.contextRetentionTime || 1800000, // 30 minutes
      agentMemoryLimit: config.agentMemoryLimit || 256, // 256MB per agent
      enableDetailedLogging: config.enableDetailedLogging || false,
      environment: config.environment || 'development'
    };

    this.startMonitoring();
    this.startGarbageCollection();
  }

  /**
   * Start memory monitoring and alerts
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      this.checkMemoryUsage();
      this.cleanupStaleData();
    }, 10000); // Check every 10 seconds

    console.log(`🧠 Memory Manager started (${this.config.environment} mode)`);
    console.log(`📊 Max Memory: ${this.config.maxMemoryUsage}MB, Alert at: ${this.config.alertThreshold}%`);
  }

  /**
   * Start garbage collection process
   */
  private startGarbageCollection(): void {
    this.gcInterval = setInterval(() => {
      this.performGarbageCollection();
    }, this.config.gcInterval);
  }

  /**
   * Check current memory usage and trigger alerts
   */
  private checkMemoryUsage(): void {
    const memInfo = process.memoryUsage();
    const systemMem = os.totalmem();
    const freeMem = os.freemem();
    
    const processMemoryMB = memInfo.rss / 1024 / 1024;
    const systemUsedMB = (systemMem - freeMem) / 1024 / 1024;
    const systemTotalMB = systemMem / 1024 / 1024;
    
    const usage: MemoryUsage = {
      total: systemTotalMB,
      used: systemUsedMB,
      free: freeMem / 1024 / 1024,
      percentage: (systemUsedMB / systemTotalMB) * 100,
      timestamp: new Date()
    };

    // Store in history (keep last 1000 entries)
    this.memoryHistory.push(usage);
    if (this.memoryHistory.length > 1000) {
      this.memoryHistory.shift();
    }

    // Check for alerts
    if (processMemoryMB > this.config.maxMemoryUsage * (this.config.alertThreshold / 100)) {
      this.triggerMemoryAlert('warning', processMemoryMB);
    }

    if (processMemoryMB > this.config.maxMemoryUsage * 0.95) {
      this.triggerMemoryAlert('critical', processMemoryMB);
    }

    // Emit monitoring event
    this.emit('memoryUpdate', {
      process: processMemoryMB,
      system: usage,
      agents: this.getAgentMemoryStats()
    });

    if (this.config.enableDetailedLogging) {
      console.log(`🧠 Memory: Process ${processMemoryMB.toFixed(1)}MB, System ${usage.percentage.toFixed(1)}%`);
    }
  }

  /**
   * Trigger memory alert
   */
  private triggerMemoryAlert(type: 'warning' | 'critical' | 'info', memoryUsage: number): void {
    const recommendations = this.generateRecommendations(type, memoryUsage);
    
    const alert: MemoryAlert = {
      type,
      message: `Memory usage ${type}: ${memoryUsage.toFixed(1)}MB (${((memoryUsage / this.config.maxMemoryUsage) * 100).toFixed(1)}%)`,
      memoryUsage,
      threshold: this.config.maxMemoryUsage * (this.config.alertThreshold / 100),
      timestamp: new Date(),
      recommendations
    };

    this.alertHistory.push(alert);
    if (this.alertHistory.length > 100) {
      this.alertHistory.shift();
    }

    this.emit('memoryAlert', alert);
    
    if (type === 'critical') {
      console.error(`🚨 CRITICAL MEMORY ALERT: ${alert.message}`);
      this.performEmergencyCleanup();
    } else {
      console.warn(`⚠️ Memory Alert: ${alert.message}`);
    }

    // Execute automatic actions for critical alerts
    if (type === 'critical') {
      this.throttleAgents();
      this.performGarbageCollection();
    }
  }

  /**
   * Generate memory optimization recommendations
   */
  private generateRecommendations(type: string, memoryUsage: number): string[] {
    const recommendations: string[] = [];

    if (type === 'critical') {
      recommendations.push('Immediately throttle all agents');
      recommendations.push('Clear all non-essential caches');
      recommendations.push('Force garbage collection');
      recommendations.push('Consider reducing agent pool size');
    }

    if (memoryUsage > this.config.maxMemoryUsage * 0.7) {
      recommendations.push('Reduce context window sizes');
      recommendations.push('Clear old cache entries');
      recommendations.push('Consider increasing cache eviction frequency');
    }

    recommendations.push('Monitor agent memory usage patterns');
    recommendations.push('Consider scaling horizontally if sustained');

    return recommendations;
  }

  /**
   * Register agent memory usage
   */
  registerAgentMemory(agentId: string, contextSize: number, cacheSize: number): void {
    const totalMemory = contextSize + cacheSize;
    
    const stats: AgentMemoryStats = {
      agentId,
      contextSize,
      cacheSize,
      totalMemory,
      lastAccessed: new Date(),
      isThrottled: this.throttledAgents.has(agentId)
    };

    this.agentMemoryMap.set(agentId, stats);

    // Check if agent exceeds limit
    if (totalMemory / 1024 / 1024 > this.config.agentMemoryLimit) {
      this.throttleAgent(agentId);
    }

    this.emit('agentMemoryUpdate', stats);
  }

  /**
   * Throttle specific agent to reduce memory usage
   */
  private throttleAgent(agentId: string): void {
    if (this.throttledAgents.has(agentId)) return;

    this.throttledAgents.add(agentId);
    
    const stats = this.agentMemoryMap.get(agentId);
    if (stats) {
      stats.isThrottled = true;
      this.agentMemoryMap.set(agentId, stats);
    }

    console.warn(`🚦 Agent ${agentId} throttled due to high memory usage`);
    this.emit('agentThrottled', { agentId, reason: 'memory_limit_exceeded' });
  }

  /**
   * Throttle all agents during critical memory situations
   */
  private throttleAgents(): void {
    console.warn('🚦 Throttling all agents due to critical memory usage');
    
    for (const [agentId] of Array.from(this.agentMemoryMap.entries())) {
      this.throttleAgent(agentId);
    }
  }

  /**
   * Unthrottle agent if memory usage is acceptable
   */
  unthrottleAgent(agentId: string): void {
    if (!this.throttledAgents.has(agentId)) return;

    const stats = this.agentMemoryMap.get(agentId);
    if (stats && stats.totalMemory / 1024 / 1024 < this.config.agentMemoryLimit * 0.8) {
      this.throttledAgents.delete(agentId);
      stats.isThrottled = false;
      this.agentMemoryMap.set(agentId, stats);
      
      console.log(`✅ Agent ${agentId} unthrottled`);
      this.emit('agentUnthrottled', { agentId });
    }
  }

  /**
   * Perform garbage collection
   */
  private performGarbageCollection(): void {
    const before = process.memoryUsage().rss;
    
    // Force Node.js garbage collection if exposed
    if (global.gc) {
      global.gc();
    }

    // Clean up expired context entries
    this.cleanupExpiredContext();
    
    // Clean up agent memory for inactive agents
    this.cleanupInactiveAgents();
    
    const after = process.memoryUsage().rss;
    const freed = (before - after) / 1024 / 1024;
    
    if (freed > 0) {
      console.log(`🗑️ Garbage collection freed ${freed.toFixed(1)}MB`);
    }

    this.emit('garbageCollected', { freedMemory: freed, timestamp: new Date() });
  }

  /**
   * Clean up expired context entries
   */
  private cleanupExpiredContext(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, lastAccess] of Array.from(this.contextRetentionMap.entries())) {
      if (now - lastAccess.getTime() > this.config.contextRetentionTime) {
        this.contextRetentionMap.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired context entries`);
    }
  }

  /**
   * Clean up memory stats for inactive agents
   */
  private cleanupInactiveAgents(): void {
    const now = Date.now();
    const inactiveThreshold = 10 * 60 * 1000; // 10 minutes
    let cleaned = 0;

    for (const [agentId, stats] of Array.from(this.agentMemoryMap.entries())) {
      if (now - stats.lastAccessed.getTime() > inactiveThreshold) {
        this.agentMemoryMap.delete(agentId);
        this.throttledAgents.delete(agentId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} inactive agent memory stats`);
    }
  }

  /**
   * Clean up stale data periodically
   */
  private cleanupStaleData(): void {
    // Cleanup old memory history (keep last 24 hours)
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    this.memoryHistory = this.memoryHistory.filter(usage => 
      usage.timestamp.getTime() > cutoff
    );

    // Cleanup old alerts (keep last 48 hours)
    const alertCutoff = Date.now() - (48 * 60 * 60 * 1000);
    this.alertHistory = this.alertHistory.filter(alert => 
      alert.timestamp.getTime() > alertCutoff
    );
  }

  /**
   * Perform emergency cleanup during critical memory situations
   */
  private performEmergencyCleanup(): void {
    console.warn('🚨 Performing emergency memory cleanup');
    
    // Clear all non-essential data
    this.contextRetentionMap.clear();
    
    // Force aggressive garbage collection
    this.performGarbageCollection();
    
    // Reduce memory history
    this.memoryHistory = this.memoryHistory.slice(-100);
    
    this.emit('emergencyCleanup', { timestamp: new Date() });
  }

  /**
   * Check if agent should be throttled based on memory usage
   */
  shouldThrottleAgent(agentId: string): boolean {
    return this.throttledAgents.has(agentId);
  }

  /**
   * Get recommended context size for agent based on current memory situation
   */
  getRecommendedContextSize(agentId: string, requestedSize: number): number {
    const currentUsage = process.memoryUsage().rss / 1024 / 1024;
    const usageRatio = currentUsage / this.config.maxMemoryUsage;

    // Reduce context size based on memory pressure
    if (usageRatio > 0.9) {
      return Math.floor(requestedSize * 0.5); // 50% reduction
    } else if (usageRatio > 0.8) {
      return Math.floor(requestedSize * 0.7); // 30% reduction
    } else if (usageRatio > 0.7) {
      return Math.floor(requestedSize * 0.85); // 15% reduction
    }

    // Check if agent is throttled
    if (this.shouldThrottleAgent(agentId)) {
      return Math.floor(requestedSize * 0.6); // 40% reduction for throttled agents
    }

    return requestedSize;
  }

  /**
   * Update context retention tracking
   */
  updateContextAccess(contextKey: string): void {
    this.contextRetentionMap.set(contextKey, new Date());
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): any {
    const memInfo = process.memoryUsage();
    const systemMem = os.totalmem();
    const freeMem = os.freemem();
    
    return {
      process: {
        rss: memInfo.rss / 1024 / 1024,
        heapTotal: memInfo.heapTotal / 1024 / 1024,
        heapUsed: memInfo.heapUsed / 1024 / 1024,
        external: memInfo.external / 1024 / 1024
      },
      system: {
        total: systemMem / 1024 / 1024,
        free: freeMem / 1024 / 1024,
        used: (systemMem - freeMem) / 1024 / 1024,
        percentage: ((systemMem - freeMem) / systemMem) * 100
      },
      config: {
        maxMemory: this.config.maxMemoryUsage,
        alertThreshold: this.config.alertThreshold,
        agentLimit: this.config.agentMemoryLimit
      },
      agents: this.getAgentMemoryStats(),
      throttledAgents: Array.from(this.throttledAgents),
      recentAlerts: this.alertHistory.slice(-5)
    };
  }

  /**
   * Get agent memory statistics
   */
  private getAgentMemoryStats(): AgentMemoryStats[] {
    return Array.from(this.agentMemoryMap.values());
  }

  /**
   * Get memory usage history
   */
  getMemoryHistory(): MemoryUsage[] {
    return [...this.memoryHistory];
  }

  /**
   * Get memory health score (0-100)
   */
  getHealthScore(): number {
    const currentUsage = process.memoryUsage().rss / 1024 / 1024;
    const usageRatio = currentUsage / this.config.maxMemoryUsage;
    
    // Calculate health score based on various factors
    let score = 100;
    
    // Deduct based on memory usage
    score -= usageRatio * 50;
    
    // Deduct for throttled agents
    score -= this.throttledAgents.size * 10;
    
    // Deduct for recent alerts
    const recentAlerts = this.alertHistory.filter(alert => 
      Date.now() - alert.timestamp.getTime() < 5 * 60 * 1000 // Last 5 minutes
    );
    score -= recentAlerts.length * 5;
    
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(newConfig: Partial<MemoryConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    console.log('🔧 Memory Manager configuration updated');
    this.emit('configUpdated', { oldConfig, newConfig: this.config });
    
    // Restart intervals if timing changed
    if (newConfig.gcInterval && newConfig.gcInterval !== oldConfig.gcInterval) {
      if (this.gcInterval) {
        clearInterval(this.gcInterval);
        this.startGarbageCollection();
      }
    }
  }

  /**
   * Stop memory manager
   */
  stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.gcInterval) {
      clearInterval(this.gcInterval);
      this.gcInterval = null;
    }
    
    console.log('🛑 Memory Manager stopped');
    this.emit('stopped');
  }

  /**
   * Export memory report for analysis
   */
  async exportMemoryReport(filePath?: string): Promise<string> {
    const report = {
      timestamp: new Date(),
      config: this.config,
      currentStats: this.getMemoryStats(),
      memoryHistory: this.memoryHistory.slice(-1000),
      alertHistory: this.alertHistory,
      healthScore: this.getHealthScore()
    };
    
    const reportPath = filePath || path.join(process.cwd(), `memory-report-${Date.now()}.json`);
    await fs.writeJSON(reportPath, report, { spaces: 2 });
    
    console.log(`📊 Memory report exported to: ${reportPath}`);
    return reportPath;
  }
}

export default MemoryManager;