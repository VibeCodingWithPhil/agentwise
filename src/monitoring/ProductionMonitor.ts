/**
 * Production Monitoring and Alerting System
 * Comprehensive monitoring for memory, cache, and optimization performance
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import * as fs from 'fs-extra';
import * as path from 'path';
import MemoryManager, { MemoryAlert, MemoryUsage } from '../optimization/MemoryManager';
import AdvancedCacheManager, { CacheStats } from '../caching/AdvancedCacheManager';
import AgentContextFilter from '../context/AgentContextFilter';

export interface MonitoringConfig {
  alertsEnabled: boolean;
  alertThresholds: {
    memoryWarning: number;
    memoryCritical: number;
    cacheHitRateWarning: number;
    cpuWarning: number;
    cpuCritical: number;
    diskUsageWarning: number;
  };
  healthCheckInterval: number;
  metricsRetention: number; // days
  enableSlackAlerts: boolean;
  enableEmailAlerts: boolean;
  environment: 'development' | 'staging' | 'production';
}

export interface SystemMetrics {
  timestamp: Date;
  memory: {
    process: number;
    system: number;
    available: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  disk: {
    usage: number;
    available: number;
    percentage: number;
  };
  cache: CacheStats;
  agents: {
    active: number;
    throttled: number;
    totalMemory: number;
  };
  performance: {
    responseTime: number;
    throughput: number;
    errorRate: number;
  };
}

export interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  component: 'memory' | 'cache' | 'cpu' | 'disk' | 'agents' | 'performance';
  title: string;
  message: string;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  metadata: any;
}

export interface HealthCheck {
  component: string;
  status: 'healthy' | 'warning' | 'critical' | 'down';
  score: number;
  message: string;
  timestamp: Date;
  metrics?: any;
}

export class ProductionMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private memoryManager: MemoryManager;
  private cacheManager: AdvancedCacheManager;
  private contextFilter: AgentContextFilter;
  
  private metrics: SystemMetrics[] = [];
  private alerts: Alert[] = [];
  private activeAlerts: Map<string, Alert> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  
  private monitoringInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsCleanupInterval: NodeJS.Timeout | null = null;
  
  private performanceMetrics = {
    requestCount: 0,
    totalResponseTime: 0,
    errorCount: 0,
    lastReset: Date.now()
  };

  constructor(
    config: Partial<MonitoringConfig>,
    memoryManager: MemoryManager,
    cacheManager: AdvancedCacheManager,
    contextFilter: AgentContextFilter
  ) {
    super();
    
    this.config = {
      alertsEnabled: config.alertsEnabled !== false,
      alertThresholds: {
        memoryWarning: 80,
        memoryCritical: 95,
        cacheHitRateWarning: 60,
        cpuWarning: 80,
        cpuCritical: 95,
        diskUsageWarning: 85,
        ...config.alertThresholds
      },
      healthCheckInterval: config.healthCheckInterval || 30000, // 30 seconds
      metricsRetention: config.metricsRetention || 7, // 7 days
      enableSlackAlerts: config.enableSlackAlerts || false,
      enableEmailAlerts: config.enableEmailAlerts || false,
      environment: config.environment || 'development'
    };
    
    this.memoryManager = memoryManager;
    this.cacheManager = cacheManager;
    this.contextFilter = contextFilter;
    
    this.setupEventListeners();
    this.startMonitoring();
  }

  /**
   * Setup event listeners for components
   */
  private setupEventListeners(): void {
    // Memory Manager events
    this.memoryManager.on('memoryAlert', (alert: MemoryAlert) => {
      this.handleMemoryAlert(alert);
    });
    
    this.memoryManager.on('memoryUpdate', (data: any) => {
      this.updatePerformanceMetrics('memory', data);
    });
    
    // Cache Manager events
    this.cacheManager.on('cacheHit', (data: any) => {
      this.performanceMetrics.requestCount++;
    });
    
    this.cacheManager.on('cacheMiss', (data: any) => {
      this.performanceMetrics.requestCount++;
    });
    
    this.cacheManager.on('maintenance', (data: any) => {
      this.runHealthCheck('cache');
    });
    
    // Context Filter events
    this.contextFilter.on('contextFiltered', (data: any) => {
      this.updatePerformanceMetrics('context', data);
    });
  }

  /**
   * Start monitoring system
   */
  private startMonitoring(): void {
    console.log(`📊 Production Monitor starting (${this.config.environment})`);
    
    // Main monitoring loop
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 10000); // Every 10 seconds
    
    // Health checks
    this.healthCheckInterval = setInterval(() => {
      this.runAllHealthChecks();
    }, this.config.healthCheckInterval);
    
    // Metrics cleanup
    this.metricsCleanupInterval = setInterval(() => {
      this.cleanupOldMetrics();
    }, 24 * 60 * 60 * 1000); // Daily
    
    // Initial health check
    setTimeout(() => this.runAllHealthChecks(), 5000);
  }

  /**
   * Collect system metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const memInfo = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const loadAvg = os.loadavg();
      
      // Calculate CPU usage percentage
      const cpuPercent = this.calculateCPUUsage(cpuUsage);
      
      // Get disk usage
      const diskUsage = await this.getDiskUsage();
      
      // Get cache stats
      const cacheStats = this.cacheManager.getStats();
      
      // Get memory manager stats
      const memoryStats = this.memoryManager.getMemoryStats();
      
      // Calculate performance metrics
      const currentTime = Date.now();
      const timeDiff = (currentTime - this.performanceMetrics.lastReset) / 1000;
      const throughput = this.performanceMetrics.requestCount / timeDiff;
      const avgResponseTime = this.performanceMetrics.totalResponseTime / 
                            Math.max(this.performanceMetrics.requestCount, 1);
      const errorRate = this.performanceMetrics.errorCount / 
                       Math.max(this.performanceMetrics.requestCount, 1) * 100;
      
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        memory: {
          process: memInfo.rss / 1024 / 1024,
          system: (os.totalmem() - os.freemem()) / 1024 / 1024,
          available: os.freemem() / 1024 / 1024,
          percentage: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
        },
        cpu: {
          usage: cpuPercent,
          loadAverage: loadAvg
        },
        disk: diskUsage,
        cache: cacheStats,
        agents: {
          active: memoryStats.agents?.length || 0,
          throttled: memoryStats.throttledAgents?.length || 0,
          totalMemory: memoryStats.agents?.reduce((sum: number, agent: any) => sum + agent.totalMemory, 0) / 1024 / 1024 || 0
        },
        performance: {
          responseTime: avgResponseTime,
          throughput,
          errorRate
        }
      };
      
      // Store metrics
      this.metrics.push(metrics);
      if (this.metrics.length > 8640) { // Keep ~24 hours at 10s intervals
        this.metrics.shift();
      }
      
      // Check for alerts
      this.checkAlerts(metrics);
      
      // Reset performance counters periodically
      if (timeDiff > 300) { // Reset every 5 minutes
        this.resetPerformanceCounters();
      }
      
      this.emit('metricsCollected', metrics);
    } catch (error) {
      console.error('Failed to collect metrics:', error);
      this.createAlert('critical', 'performance', 'Metrics Collection Failed', 
                      `Failed to collect system metrics: ${error}`);
    }
  }

  /**
   * Calculate CPU usage percentage
   */
  private calculateCPUUsage(cpuUsage: NodeJS.CpuUsage): number {
    // This is a simplified calculation
    // In production, you might want to use a more sophisticated method
    const totalUsage = cpuUsage.user + cpuUsage.system;
    return Math.min(100, totalUsage / 1000000 / 10); // Rough approximation
  }

  /**
   * Get disk usage information
   */
  private async getDiskUsage(): Promise<{ usage: number; available: number; percentage: number }> {
    try {
      const stats = await fs.stat(process.cwd());
      // This is a simplified version - in production you'd want to use statvfs or similar
      return {
        usage: 0, // Would need system call to get actual usage
        available: 1000000, // Placeholder
        percentage: 0
      };
    } catch (error) {
      return { usage: 0, available: 0, percentage: 0 };
    }
  }

  /**
   * Check for alert conditions
   */
  private checkAlerts(metrics: SystemMetrics): void {
    // Memory alerts
    if (metrics.memory.percentage > this.config.alertThresholds.memoryCritical) {
      this.createAlert('critical', 'memory', 'Critical Memory Usage', 
                      `System memory usage: ${metrics.memory.percentage.toFixed(1)}%`);
    } else if (metrics.memory.percentage > this.config.alertThresholds.memoryWarning) {
      this.createAlert('warning', 'memory', 'High Memory Usage', 
                      `System memory usage: ${metrics.memory.percentage.toFixed(1)}%`);
    }
    
    // CPU alerts
    if (metrics.cpu.usage > this.config.alertThresholds.cpuCritical) {
      this.createAlert('critical', 'cpu', 'Critical CPU Usage', 
                      `CPU usage: ${metrics.cpu.usage.toFixed(1)}%`);
    } else if (metrics.cpu.usage > this.config.alertThresholds.cpuWarning) {
      this.createAlert('warning', 'cpu', 'High CPU Usage', 
                      `CPU usage: ${metrics.cpu.usage.toFixed(1)}%`);
    }
    
    // Cache hit rate alerts
    if (metrics.cache.overall.hitRate < this.config.alertThresholds.cacheHitRateWarning / 100) {
      this.createAlert('warning', 'cache', 'Low Cache Hit Rate', 
                      `Cache hit rate: ${(metrics.cache.overall.hitRate * 100).toFixed(1)}%`);
    }
    
    // Agent throttling alerts
    if (metrics.agents.throttled > 0) {
      this.createAlert('warning', 'agents', 'Agents Throttled', 
                      `${metrics.agents.throttled} agents are currently throttled`);
    }
    
    // Performance alerts
    if (metrics.performance.errorRate > 10) {
      this.createAlert('critical', 'performance', 'High Error Rate', 
                      `Error rate: ${metrics.performance.errorRate.toFixed(1)}%`);
    }
    
    if (metrics.performance.responseTime > 5000) { // 5 seconds
      this.createAlert('warning', 'performance', 'Slow Response Times', 
                      `Average response time: ${metrics.performance.responseTime.toFixed(0)}ms`);
    }
  }

  /**
   * Handle memory alerts from MemoryManager
   */
  private handleMemoryAlert(alert: MemoryAlert): void {
    const severity = alert.type === 'critical' ? 'critical' : 'warning';
    this.createAlert(severity, 'memory', `Memory Alert: ${alert.type}`, alert.message, {
      memoryUsage: alert.memoryUsage,
      threshold: alert.threshold,
      recommendations: alert.recommendations
    });
  }

  /**
   * Create or update alert
   */
  private createAlert(
    type: Alert['type'], 
    component: Alert['component'], 
    title: string, 
    message: string, 
    metadata: any = {}
  ): void {
    if (!this.config.alertsEnabled) return;
    
    const alertKey = `${component}-${title}`;
    const existingAlert = this.activeAlerts.get(alertKey);
    
    // Don't create duplicate alerts within 5 minutes
    if (existingAlert && Date.now() - existingAlert.timestamp.getTime() < 300000) {
      return;
    }
    
    const alert: Alert = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      component,
      title,
      message,
      timestamp: new Date(),
      resolved: false,
      metadata
    };
    
    this.alerts.push(alert);
    this.activeAlerts.set(alertKey, alert);
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts.shift();
    }
    
    console.log(`🚨 ${type.toUpperCase()} ALERT [${component}]: ${title} - ${message}`);
    
    // Send notifications
    this.sendNotification(alert);
    
    this.emit('alertCreated', alert);
  }

  /**
   * Send alert notification
   */
  private async sendNotification(alert: Alert): Promise<void> {
    try {
      // Console notification (always enabled)
      const icon = alert.type === 'critical' ? '🔴' : alert.type === 'warning' ? '🟡' : '🔵';
      console.log(`${icon} ${alert.title}: ${alert.message}`);
      
      // Slack notification
      if (this.config.enableSlackAlerts && process.env.SLACK_WEBHOOK_URL) {
        await this.sendSlackNotification(alert);
      }
      
      // Email notification
      if (this.config.enableEmailAlerts && process.env.EMAIL_SERVICE_API) {
        await this.sendEmailNotification(alert);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(alert: Alert): Promise<void> {
    // Implementation would depend on your Slack setup
    console.log(`📱 Slack notification would be sent: ${alert.title}`);
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(alert: Alert): Promise<void> {
    // Implementation would depend on your email service
    console.log(`📧 Email notification would be sent: ${alert.title}`);
  }

  /**
   * Run all health checks
   */
  private async runAllHealthChecks(): Promise<void> {
    const components = ['memory', 'cache', 'agents', 'system', 'performance'];
    
    for (const component of components) {
      await this.runHealthCheck(component);
    }
    
    this.emit('healthCheckCompleted', this.getOverallHealth());
  }

  /**
   * Run health check for specific component
   */
  private async runHealthCheck(component: string): Promise<void> {
    try {
      let healthCheck: HealthCheck;
      
      switch (component) {
        case 'memory':
          healthCheck = await this.checkMemoryHealth();
          break;
        case 'cache':
          healthCheck = await this.checkCacheHealth();
          break;
        case 'agents':
          healthCheck = await this.checkAgentsHealth();
          break;
        case 'system':
          healthCheck = await this.checkSystemHealth();
          break;
        case 'performance':
          healthCheck = await this.checkPerformanceHealth();
          break;
        default:
          return;
      }
      
      this.healthChecks.set(component, healthCheck);
      this.emit('healthCheckResult', healthCheck);
      
    } catch (error) {
      const healthCheck: HealthCheck = {
        component,
        status: 'down',
        score: 0,
        message: `Health check failed: ${error}`,
        timestamp: new Date()
      };
      
      this.healthChecks.set(component, healthCheck);
      console.error(`Health check failed for ${component}:`, error);
    }
  }

  /**
   * Check memory health
   */
  private async checkMemoryHealth(): Promise<HealthCheck> {
    const memoryStats = this.memoryManager.getMemoryStats();
    const score = this.memoryManager.getHealthScore();
    
    let status: HealthCheck['status'] = 'healthy';
    let message = 'Memory usage is optimal';
    
    if (score < 30) {
      status = 'critical';
      message = 'Critical memory issues detected';
    } else if (score < 60) {
      status = 'warning';
      message = 'Memory usage is elevated';
    }
    
    return {
      component: 'memory',
      status,
      score,
      message,
      timestamp: new Date(),
      metrics: memoryStats
    };
  }

  /**
   * Check cache health
   */
  private async checkCacheHealth(): Promise<HealthCheck> {
    const cacheStats = this.cacheManager.getStats();
    const score = this.cacheManager.getHealthScore();
    
    let status: HealthCheck['status'] = 'healthy';
    let message = 'Cache performance is good';
    
    if (score < 30) {
      status = 'critical';
      message = 'Cache performance is poor';
    } else if (score < 60) {
      status = 'warning';
      message = 'Cache performance could be improved';
    }
    
    return {
      component: 'cache',
      status,
      score,
      message,
      timestamp: new Date(),
      metrics: cacheStats
    };
  }

  /**
   * Check agents health
   */
  private async checkAgentsHealth(): Promise<HealthCheck> {
    const memoryStats = this.memoryManager.getMemoryStats();
    const throttledCount = memoryStats.throttledAgents?.length || 0;
    const totalAgents = memoryStats.agents?.length || 0;
    
    let score = 100;
    let status: HealthCheck['status'] = 'healthy';
    let message = 'All agents operating normally';
    
    if (throttledCount > 0) {
      const throttleRatio = throttledCount / Math.max(totalAgents, 1);
      score -= throttleRatio * 60;
      
      if (throttleRatio > 0.5) {
        status = 'critical';
        message = `${throttledCount} agents throttled (${(throttleRatio * 100).toFixed(0)}%)`;
      } else {
        status = 'warning';
        message = `${throttledCount} agents throttled`;
      }
    }
    
    return {
      component: 'agents',
      status,
      score: Math.max(0, score),
      message,
      timestamp: new Date(),
      metrics: { totalAgents, throttledCount }
    };
  }

  /**
   * Check system health
   */
  private async checkSystemHealth(): Promise<HealthCheck> {
    const latestMetrics = this.metrics[this.metrics.length - 1];
    if (!latestMetrics) {
      return {
        component: 'system',
        status: 'down',
        score: 0,
        message: 'No metrics available',
        timestamp: new Date()
      };
    }
    
    let score = 100;
    let status: HealthCheck['status'] = 'healthy';
    let message = 'System performance is good';
    
    // Deduct for high memory usage
    if (latestMetrics.memory.percentage > 90) {
      score -= 40;
      status = 'critical';
      message = 'Critical system resource usage';
    } else if (latestMetrics.memory.percentage > 80) {
      score -= 20;
      status = 'warning';
      message = 'High system resource usage';
    }
    
    // Deduct for high CPU usage
    if (latestMetrics.cpu.usage > 90) {
      score -= 30;
      status = status === 'critical' ? 'critical' : 'warning';
    }
    
    return {
      component: 'system',
      status,
      score: Math.max(0, score),
      message,
      timestamp: new Date(),
      metrics: latestMetrics
    };
  }

  /**
   * Check performance health
   */
  private async checkPerformanceHealth(): Promise<HealthCheck> {
    const latestMetrics = this.metrics[this.metrics.length - 1];
    if (!latestMetrics) {
      return {
        component: 'performance',
        status: 'down',
        score: 0,
        message: 'No performance data available',
        timestamp: new Date()
      };
    }
    
    let score = 100;
    let status: HealthCheck['status'] = 'healthy';
    let message = 'Performance is optimal';
    
    // Check error rate
    if (latestMetrics.performance.errorRate > 10) {
      score -= 50;
      status = 'critical';
      message = 'High error rate detected';
    } else if (latestMetrics.performance.errorRate > 5) {
      score -= 25;
      status = 'warning';
      message = 'Elevated error rate';
    }
    
    // Check response time
    if (latestMetrics.performance.responseTime > 5000) {
      score -= 30;
      status = status === 'critical' ? 'critical' : 'warning';
    }
    
    return {
      component: 'performance',
      status,
      score: Math.max(0, score),
      message,
      timestamp: new Date(),
      metrics: latestMetrics.performance
    };
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(type: string, data: any): void {
    this.performanceMetrics.requestCount++;
    
    if (data.responseTime) {
      this.performanceMetrics.totalResponseTime += data.responseTime;
    }
    
    if (data.error) {
      this.performanceMetrics.errorCount++;
    }
  }

  /**
   * Reset performance counters
   */
  private resetPerformanceCounters(): void {
    this.performanceMetrics = {
      requestCount: 0,
      totalResponseTime: 0,
      errorCount: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Clean up old metrics and alerts
   */
  private cleanupOldMetrics(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.metricsRetention);
    
    // Clean metrics
    this.metrics = this.metrics.filter(metric => 
      metric.timestamp.getTime() > cutoffDate.getTime()
    );
    
    // Clean alerts
    this.alerts = this.alerts.filter(alert => 
      alert.timestamp.getTime() > cutoffDate.getTime()
    );
    
    console.log(`🧹 Cleaned up old metrics and alerts (retention: ${this.config.metricsRetention} days)`);
  }

  /**
   * Get overall system health
   */
  getOverallHealth(): { score: number; status: string; components: HealthCheck[] } {
    const components = Array.from(this.healthChecks.values());
    
    if (components.length === 0) {
      return { score: 0, status: 'unknown', components: [] };
    }
    
    const avgScore = components.reduce((sum, hc) => sum + hc.score, 0) / components.length;
    
    let status = 'healthy';
    if (avgScore < 30 || components.some(hc => hc.status === 'critical')) {
      status = 'critical';
    } else if (avgScore < 70 || components.some(hc => hc.status === 'warning')) {
      status = 'warning';
    }
    
    return { score: avgScore, status, components };
  }

  /**
   * Get current metrics
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metrics[this.metrics.length - 1] || null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(hours: number = 24): SystemMetrics[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    
    return this.metrics.filter(metric => 
      metric.timestamp.getTime() > cutoff.getTime()
    );
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(hours: number = 24): Alert[] {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - hours);
    
    return this.alerts.filter(alert => 
      alert.timestamp.getTime() > cutoff.getTime()
    ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      // Remove from active alerts
      for (const [key, activeAlert] of this.activeAlerts) {
        if (activeAlert.id === alertId) {
          this.activeAlerts.delete(key);
          break;
        }
      }
      
      this.emit('alertResolved', alert);
      return true;
    }
    
    return false;
  }

  /**
   * Get monitoring status
   */
  getStatus(): any {
    const overallHealth = this.getOverallHealth();
    const currentMetrics = this.getCurrentMetrics();
    const recentAlerts = this.getRecentAlerts(1); // Last hour
    
    return {
      environment: this.config.environment,
      uptime: process.uptime(),
      health: overallHealth,
      metrics: currentMetrics,
      alerts: {
        total: recentAlerts.length,
        critical: recentAlerts.filter(a => a.type === 'critical').length,
        warnings: recentAlerts.filter(a => a.type === 'warning').length,
        recent: recentAlerts.slice(0, 5)
      },
      components: {
        memory: this.healthChecks.get('memory'),
        cache: this.healthChecks.get('cache'),
        agents: this.healthChecks.get('agents'),
        system: this.healthChecks.get('system'),
        performance: this.healthChecks.get('performance')
      }
    };
  }

  /**
   * Export monitoring report
   */
  async exportReport(filePath?: string): Promise<string> {
    const report = {
      timestamp: new Date(),
      config: this.config,
      status: this.getStatus(),
      metricsHistory: this.getMetricsHistory(24),
      alertHistory: this.getRecentAlerts(24),
      healthChecks: Object.fromEntries(this.healthChecks)
    };
    
    const reportPath = filePath || path.join(process.cwd(), `monitoring-report-${Date.now()}.json`);
    await fs.writeJSON(reportPath, report, { spaces: 2 });
    
    console.log(`📊 Monitoring report exported to: ${reportPath}`);
    return reportPath;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MonitoringConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    console.log('🔧 Production Monitor configuration updated');
    this.emit('configUpdated', { oldConfig, newConfig: this.config });
    
    // Restart intervals if timing changed
    if (newConfig.healthCheckInterval && newConfig.healthCheckInterval !== oldConfig.healthCheckInterval) {
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = setInterval(() => {
          this.runAllHealthChecks();
        }, this.config.healthCheckInterval);
      }
    }
  }

  /**
   * Stop monitoring
   */
  async stop(): Promise<void> {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    if (this.metricsCleanupInterval) {
      clearInterval(this.metricsCleanupInterval);
      this.metricsCleanupInterval = null;
    }
    
    console.log('🛑 Production Monitor stopped');
    this.emit('stopped');
  }
}

export default ProductionMonitor;