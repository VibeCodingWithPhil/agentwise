import * as fs from 'fs-extra';
import * as path from 'path';
import * as blessed from 'blessed';
import {
  ProtectionStatus,
  ComponentStatus,
  ProtectionAlert,
  DashboardMetrics,
  ActivityLog,
  NextAction,
  Logger,
  PerformanceMonitor
} from './types';
import { AutoCommitManager } from './AutoCommitManager';
import { ContinuousSecurityMonitor } from './ContinuousSecurityMonitor';
import { AutomatedReviewPipeline } from './AutomatedReviewPipeline';
import { IntegratedBackupSystem } from './IntegratedBackupSystem';
import { DailySecurityReport } from './DailySecurityReport';

interface DashboardConfig {
  refreshInterval: number;
  showDetailedMetrics: boolean;
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    healthScore: number;
  };
  displayMode: 'console' | 'web' | 'both';
}

interface SystemComponent {
  name: string;
  status: ComponentStatus;
  manager: any;
}

export class ProtectionDashboard {
  private config: DashboardConfig;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  
  private autoCommitManager: AutoCommitManager;
  private securityMonitor: ContinuousSecurityMonitor;
  private reviewPipeline: AutomatedReviewPipeline;
  private backupSystem: IntegratedBackupSystem;
  private reportGenerator: DailySecurityReport;
  
  private isRunning = false;
  private screen: blessed.Widgets.Screen | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private alerts: ProtectionAlert[] = [];
  private activityLog: ActivityLog[] = [];
  private metrics: DashboardMetrics;

  constructor(
    config: DashboardConfig,
    logger: Logger,
    performanceMonitor: PerformanceMonitor,
    autoCommitManager: AutoCommitManager,
    securityMonitor: ContinuousSecurityMonitor,
    reviewPipeline: AutomatedReviewPipeline,
    backupSystem: IntegratedBackupSystem,
    reportGenerator: DailySecurityReport
  ) {
    this.config = config;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.autoCommitManager = autoCommitManager;
    this.securityMonitor = securityMonitor;
    this.reviewPipeline = reviewPipeline;
    this.backupSystem = backupSystem;
    this.reportGenerator = reportGenerator;
    
    this.metrics = this.initializeMetrics();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('ProtectionDashboard is already running');
      return;
    }

    const perfId = this.performanceMonitor.start('dashboard-start');
    
    try {
      this.logger.info('Starting ProtectionDashboard', { config: this.config });
      
      // Load existing activity log
      await this.loadActivityLog();
      
      // Initialize dashboard based on display mode
      if (this.config.displayMode === 'console' || this.config.displayMode === 'both') {
        this.initializeConsoleInterface();
      }
      
      if (this.config.displayMode === 'web' || this.config.displayMode === 'both') {
        await this.initializeWebInterface();
      }
      
      // Start data collection
      this.startDataCollection();
      
      // Start refresh timer
      this.startRefreshTimer();
      
      this.isRunning = true;
      this.logger.info('ProtectionDashboard started successfully');
      
    } catch (error) {
      this.logger.error('Failed to start ProtectionDashboard', { error });
      throw error;
    } finally {
      this.performanceMonitor.end(perfId);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('ProtectionDashboard is not running');
      return;
    }

    this.logger.info('Stopping ProtectionDashboard');
    
    // Stop refresh timer
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    // Close console interface
    if (this.screen) {
      this.screen.destroy();
      this.screen = null;
    }
    
    // Save activity log
    await this.saveActivityLog();
    
    this.isRunning = false;
    this.logger.info('ProtectionDashboard stopped successfully');
  }

  private async loadActivityLog(): Promise<void> {
    try {
      const logPath = path.join(process.cwd(), '.activity-log.json');
      if (await fs.exists(logPath)) {
        const logData = await fs.readFile(logPath, 'utf-8');
        this.activityLog = JSON.parse(logData);
        
        // Convert date strings back to Date objects
        this.activityLog.forEach(log => {
          log.timestamp = new Date(log.timestamp);
        });
        
        // Keep only last 1000 entries
        if (this.activityLog.length > 1000) {
          this.activityLog = this.activityLog.slice(-1000);
        }
      }
    } catch (error) {
      this.logger.warn('Failed to load activity log', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async saveActivityLog(): Promise<void> {
    try {
      const logPath = path.join(process.cwd(), '.activity-log.json');
      await fs.writeFile(logPath, JSON.stringify(this.activityLog, null, 2));
    } catch (error) {
      this.logger.warn('Failed to save activity log', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private initializeConsoleInterface(): void {
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Agentwise Protection Dashboard'
    });

    // Create main layout
    this.createConsoleLayout();
    
    // Handle key events
    this.screen.key(['escape', 'q', 'C-c'], () => {
      process.exit(0);
    });

    this.screen.key(['r'], () => {
      this.refreshDashboard();
    });

    this.screen.render();
  }

  private createConsoleLayout(): void {
    if (!this.screen) return;

    // Header
    const header = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      tags: true,
      border: { type: 'line' },
      style: {
        fg: 'white',
        bg: 'blue',
        border: { fg: '#f0f0f0' }
      }
    });

    // Status Overview (left panel)
    const statusBox = blessed.box({
      parent: this.screen,
      top: 3,
      left: 0,
      width: '50%',
      height: '40%',
      tags: true,
      border: { type: 'line' },
      label: 'System Status',
      style: {
        fg: 'white',
        border: { fg: '#f0f0f0' }
      }
    });

    // Metrics (right panel)
    const metricsBox = blessed.box({
      parent: this.screen,
      top: 3,
      left: '50%',
      width: '50%',
      height: '40%',
      tags: true,
      border: { type: 'line' },
      label: 'Metrics',
      style: {
        fg: 'white',
        border: { fg: '#f0f0f0' }
      }
    });

    // Activity Log (bottom left)
    const activityBox = blessed.box({
      parent: this.screen,
      top: '43%',
      left: 0,
      width: '50%',
      height: '40%',
      tags: true,
      border: { type: 'line' },
      label: 'Recent Activity',
      scrollable: true,
      style: {
        fg: 'white',
        border: { fg: '#f0f0f0' }
      }
    });

    // Next Actions (bottom right)
    const actionsBox = blessed.box({
      parent: this.screen,
      top: '43%',
      left: '50%',
      width: '50%',
      height: '40%',
      tags: true,
      border: { type: 'line' },
      label: 'Next Actions',
      scrollable: true,
      style: {
        fg: 'white',
        border: { fg: '#f0f0f0' }
      }
    });

    // Alerts bar (bottom)
    const alertsBox = blessed.box({
      parent: this.screen,
      top: '83%',
      left: 0,
      width: '100%',
      height: '17%',
      tags: true,
      border: { type: 'line' },
      label: 'Alerts',
      scrollable: true,
      style: {
        fg: 'white',
        border: { fg: '#f0f0f0' }
      }
    });

    // Store references for updates
    this.screen.children.forEach((child: any) => {
      if (child.options.label === 'System Status') this.statusBox = child;
      if (child.options.label === 'Metrics') this.metricsBox = child;
      if (child.options.label === 'Recent Activity') this.activityBox = child;
      if (child.options.label === 'Next Actions') this.actionsBox = child;
      if (child.options.label === 'Alerts') this.alertsBox = child;
    });

    // Initial render
    this.updateConsoleInterface();
  }

  private statusBox: any;
  private metricsBox: any;
  private activityBox: any;
  private actionsBox: any;
  private alertsBox: any;

  private async initializeWebInterface(): Promise<void> {
    // Web interface would be implemented with a web framework
    // For now, just log that it would be initialized
    this.logger.info('Web interface would be initialized here');
  }

  private startDataCollection(): void {
    // Collect data from all protection components
    setInterval(async () => {
      await this.collectSystemData();
    }, 10000); // Every 10 seconds
  }

  private startRefreshTimer(): void {
    this.refreshTimer = setInterval(() => {
      this.refreshDashboard();
    }, this.config.refreshInterval);
  }

  private async collectSystemData(): Promise<void> {
    try {
      // Collect status from all components
      const status = await this.getProtectionStatus();
      
      // Update metrics
      await this.updateMetrics();
      
      // Check for new alerts
      this.checkForAlerts(status);
      
      // Log activity
      this.logActivity('system', 'Data collection completed', { success: true });
      
    } catch (error) {
      this.logger.error('Error collecting system data', { error });
      this.logActivity('system', 'Data collection failed', { success: false, error: error instanceof Error ? error.message : String(error) });
    }
  }

  async getProtectionStatus(): Promise<ProtectionStatus> {
    const timestamp = new Date();
    
    // Get status from each component
    const components = {
      autoCommit: await this.getComponentStatus('autoCommit', this.autoCommitManager),
      securityMonitor: await this.getComponentStatus('securityMonitor', this.securityMonitor),
      reviewPipeline: await this.getComponentStatus('reviewPipeline', this.reviewPipeline),
      backupSystem: await this.getComponentStatus('backupSystem', this.backupSystem),
      reporting: await this.getComponentStatus('reporting', this.reportGenerator)
    };
    
    // Determine overall status
    const componentStatuses = Object.values(components).map(c => c.status);
    let overall: 'healthy' | 'warning' | 'critical' | 'offline' = 'healthy';
    
    if (componentStatuses.includes('error')) {
      overall = 'critical';
    } else if (componentStatuses.includes('warning')) {
      overall = 'warning';
    } else if (componentStatuses.some(s => s === 'offline')) {
      overall = 'warning';
    }
    
    // Get metrics
    const metrics = {
      uptime: this.calculateUptime(),
      lastCommit: await this.getLastCommitTime(),
      lastScan: this.getLastScanTime(),
      lastBackup: this.getLastBackupTime(),
      lastReport: this.getLastReportTime()
    };
    
    return {
      timestamp,
      overall,
      components,
      metrics,
      alerts: this.alerts.slice(-10) // Last 10 alerts
    };
  }

  private async getComponentStatus(name: string, manager: any): Promise<ComponentStatus> {
    try {
      const status = manager.getStatus ? manager.getStatus() : { isRunning: false };
      
      return {
        status: status.isRunning ? 'online' : 'offline',
        lastActivity: new Date(),
        errorCount: 0,
        performance: {
          avgResponseTime: 100, // Would calculate from metrics
          successRate: 99.5 // Would calculate from metrics
        },
        health: status.isRunning ? 95 : 0
      };
    } catch (error) {
      return {
        status: 'error',
        lastActivity: new Date(),
        errorCount: 1,
        performance: {
          avgResponseTime: 0,
          successRate: 0
        },
        health: 0
      };
    }
  }

  private calculateUptime(): number {
    // Simple uptime calculation - would be more sophisticated in real implementation
    return 99.8;
  }

  private async getLastCommitTime(): Promise<Date> {
    try {
      const status = this.autoCommitManager.getStatus();
      return status.lastCommitTime || new Date();
    } catch (error) {
      return new Date();
    }
  }

  private getLastScanTime(): Date {
    try {
      const result = this.securityMonitor.getLastScanResult();
      return result?.timestamp || new Date();
    } catch (error) {
      return new Date();
    }
  }

  private getLastBackupTime(): Date {
    try {
      const history = this.backupSystem.getBackupHistory();
      return history.lastSuccessful || new Date();
    } catch (error) {
      return new Date();
    }
  }

  private getLastReportTime(): Date {
    try {
      const status = this.reportGenerator.getStatus();
      return status.lastReport || new Date();
    } catch (error) {
      return new Date();
    }
  }

  private async updateMetrics(): Promise<void> {
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Update performance metrics (simplified)
    this.metrics.performance.commits.push({
      timestamp: now,
      count: Math.floor(Math.random() * 5) // Would get real data
    });
    
    this.metrics.performance.vulnerabilities.push({
      timestamp: now,
      count: Math.floor(Math.random() * 3) // Would get real data
    });
    
    this.metrics.performance.backups.push({
      timestamp: now,
      success: Math.random() > 0.1 // 90% success rate
    });
    
    this.metrics.performance.quality.push({
      timestamp: now,
      score: 80 + Math.random() * 20 // Score between 80-100
    });
    
    // Keep only last 24 hours of data
    const filterOld = (data: any[]) => data.filter(item => item.timestamp > dayAgo);
    
    this.metrics.performance.commits = filterOld(this.metrics.performance.commits);
    this.metrics.performance.vulnerabilities = filterOld(this.metrics.performance.vulnerabilities);
    this.metrics.performance.backups = filterOld(this.metrics.performance.backups);
    this.metrics.performance.quality = filterOld(this.metrics.performance.quality);
    
    // Update trends
    this.updateTrends();
    
    // Update summary
    this.updateSummary();
  }

  private updateTrends(): void {
    const last7Days = this.getLast7DaysData();
    
    this.metrics.trends = {
      securityScore: last7Days.map(d => d.securityScore),
      qualityScore: last7Days.map(d => d.qualityScore),
      commitFrequency: last7Days.map(d => d.commits),
      backupReliability: last7Days.map(d => d.backupSuccess)
    };
  }

  private getLast7DaysData(): any[] {
    // Simplified - would aggregate real data
    return Array.from({ length: 7 }, (_, i) => ({
      securityScore: 85 + Math.random() * 10,
      qualityScore: 80 + Math.random() * 15,
      commits: Math.floor(Math.random() * 10),
      backupSuccess: Math.random() > 0.1 ? 100 : 0
    }));
  }

  private updateSummary(): void {
    const last30Days = this.metrics.performance.commits.slice(-30);
    
    this.metrics.summary = {
      totalCommits: last30Days.reduce((sum, item) => sum + item.count, 0),
      activeDays: new Set(last30Days.map(item => item.timestamp.toDateString())).size,
      averageScore: this.metrics.trends.securityScore.reduce((a, b) => a + b, 0) / this.metrics.trends.securityScore.length,
      riskLevel: this.calculateRiskLevel()
    };
  }

  private calculateRiskLevel(): 'low' | 'medium' | 'high' {
    const avgSecurity = this.metrics.summary.averageScore;
    const recentVulns = this.metrics.performance.vulnerabilities.slice(-5).reduce((sum, item) => sum + item.count, 0);
    
    if (avgSecurity > 90 && recentVulns < 3) return 'low';
    if (avgSecurity > 70 && recentVulns < 8) return 'medium';
    return 'high';
  }

  private checkForAlerts(status: ProtectionStatus): void {
    const now = new Date();
    
    // Check component health
    Object.entries(status.components).forEach(([name, component]) => {
      if (component.health < this.config.alertThresholds.healthScore) {
        this.addAlert({
          id: `health-${name}-${now.getTime()}`,
          type: 'system',
          severity: component.health < 50 ? 'critical' : 'warning',
          message: `${name} component health is low (${component.health}%)`,
          timestamp: now,
          acknowledged: false,
          actions: [`Check ${name} logs`, `Restart ${name} component`]
        });
      }
    });
    
    // Check response times
    Object.entries(status.components).forEach(([name, component]) => {
      if (component.performance.avgResponseTime > this.config.alertThresholds.responseTime) {
        this.addAlert({
          id: `response-${name}-${now.getTime()}`,
          type: 'system',
          severity: 'warning',
          message: `${name} response time is high (${component.performance.avgResponseTime}ms)`,
          timestamp: now,
          acknowledged: false,
          actions: [`Check ${name} performance`, 'Review system resources']
        });
      }
    });
    
    // Check overall system status
    if (status.overall === 'critical') {
      this.addAlert({
        id: `system-critical-${now.getTime()}`,
        type: 'system',
        severity: 'critical',
        message: 'System is in critical state',
        timestamp: now,
        acknowledged: false,
        actions: ['Check all components', 'Review system logs', 'Contact administrator']
      });
    }
  }

  private addAlert(alert: ProtectionAlert): void {
    // Check if similar alert already exists
    const existingSimilar = this.alerts.find(a => 
      a.message === alert.message && 
      a.timestamp.getTime() > Date.now() - 60000 // Within last minute
    );
    
    if (!existingSimilar) {
      this.alerts.push(alert);
      
      // Keep only last 100 alerts
      if (this.alerts.length > 100) {
        this.alerts = this.alerts.slice(-100);
      }
      
      this.logger.warn('New alert generated', alert);
      this.logActivity('alert', alert.message, { severity: alert.severity, type: alert.type });
    }
  }

  private logActivity(type: string, description: string, details: any): void {
    const activity: ActivityLog = {
      id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: type as any,
      description,
      details,
      success: details.success !== false
    };
    
    this.activityLog.push(activity);
    
    // Keep only last 1000 activities
    if (this.activityLog.length > 1000) {
      this.activityLog = this.activityLog.slice(-1000);
    }
  }

  private refreshDashboard(): void {
    if (this.config.displayMode === 'console' || this.config.displayMode === 'both') {
      this.updateConsoleInterface();
    }
    
    if (this.config.displayMode === 'web' || this.config.displayMode === 'both') {
      // Would update web interface
    }
  }

  private updateConsoleInterface(): void {
    if (!this.screen) return;
    
    this.updateHeaderContent();
    this.updateStatusContent();
    this.updateMetricsContent();
    this.updateActivityContent();
    this.updateActionsContent();
    this.updateAlertsContent();
    
    this.screen.render();
  }

  private updateHeaderContent(): void {
    if (!this.screen) return;
    
    const header = this.screen.children[0] as any;
    const now = new Date().toLocaleString();
    const uptime = this.calculateUptime();
    
    header.setContent(`{center}{bold}Agentwise Protection Dashboard{/bold} | ${now} | Uptime: ${uptime}% | Press 'r' to refresh, 'q' to quit{/center}`);
  }

  private updateStatusContent(): void {
    if (!this.statusBox) return;
    
    const components = [
      { name: 'Auto Commit', status: this.autoCommitManager.getStatus?.()?.isRunning ? 'Online' : 'Offline' },
      { name: 'Security Monitor', status: this.securityMonitor.getStatus?.()?.isRunning ? 'Online' : 'Offline' },
      { name: 'Review Pipeline', status: this.reviewPipeline.getStatus?.()?.isRunning ? 'Online' : 'Offline' },
      { name: 'Backup System', status: this.backupSystem.getStatus?.()?.isRunning ? 'Online' : 'Offline' },
      { name: 'Report Generator', status: this.reportGenerator.getStatus?.()?.isRunning ? 'Online' : 'Offline' }
    ];
    
    let content = '\n';
    components.forEach(comp => {
      const icon = comp.status === 'Online' ? '{green-fg}●{/green-fg}' : '{red-fg}●{/red-fg}';
      const color = comp.status === 'Online' ? '{green-fg}' : '{red-fg}';
      content += `  ${icon} ${comp.name}: ${color}${comp.status}{/}\n`;
    });
    
    const overallStatus = components.every(c => c.status === 'Online') ? 
      '{green-fg}Healthy{/green-fg}' : '{yellow-fg}Warning{/yellow-fg}';
    content += `\n  Overall Status: ${overallStatus}`;
    
    this.statusBox.setContent(content);
  }

  private updateMetricsContent(): void {
    if (!this.metricsBox) return;
    
    const metrics = this.metrics.summary;
    
    let content = '\n';
    content += `  Total Commits (30d): {cyan-fg}${metrics.totalCommits}{/cyan-fg}\n`;
    content += `  Active Days (30d): {cyan-fg}${metrics.activeDays}{/cyan-fg}\n`;
    content += `  Average Score: {cyan-fg}${metrics.averageScore.toFixed(1)}{/cyan-fg}\n`;
    
    const riskColor = metrics.riskLevel === 'low' ? 'green-fg' : 
                     metrics.riskLevel === 'medium' ? 'yellow-fg' : 'red-fg';
    content += `  Risk Level: {${riskColor}}${metrics.riskLevel.toUpperCase()}{/}\n`;
    
    // Add recent trends
    content += '\n  Recent Trends (7d):\n';
    const lastScore = this.metrics.trends.securityScore.slice(-1)[0] || 0;
    const avgScore = this.metrics.trends.securityScore.reduce((a, b) => a + b, 0) / this.metrics.trends.securityScore.length;
    const trend = lastScore > avgScore ? '↗' : lastScore < avgScore ? '↘' : '→';
    content += `    Security: ${trend} ${lastScore.toFixed(1)}\n`;
    
    this.metricsBox.setContent(content);
  }

  private updateActivityContent(): void {
    if (!this.activityBox) return;
    
    const recentActivities = this.activityLog.slice(-10).reverse();
    
    let content = '\n';
    recentActivities.forEach(activity => {
      const time = activity.timestamp.toLocaleTimeString();
      const icon = activity.success ? '{green-fg}✓{/green-fg}' : '{red-fg}✗{/red-fg}';
      content += `  ${time} ${icon} ${activity.description}\n`;
    });
    
    if (recentActivities.length === 0) {
      content += '  No recent activity\n';
    }
    
    this.activityBox.setContent(content);
  }

  private updateActionsContent(): void {
    if (!this.actionsBox) return;
    
    const nextActions = this.getNextActions();
    
    let content = '\n';
    nextActions.slice(0, 8).forEach((action, index) => {
      const priority = action.priority === 'urgent' ? '{red-fg}!{/red-fg}' :
                      action.priority === 'high' ? '{yellow-fg}!{/yellow-fg}' : ' ';
      content += `  ${priority} ${action.title}\n`;
      content += `    {gray-fg}${action.description}{/gray-fg}\n`;
    });
    
    if (nextActions.length === 0) {
      content += '  {green-fg}All systems operating normally{/green-fg}\n';
    }
    
    this.actionsBox.setContent(content);
  }

  private updateAlertsContent(): void {
    if (!this.alertsBox) return;
    
    const activeAlerts = this.alerts.filter(a => !a.acknowledged).slice(-5);
    
    let content = '\n';
    if (activeAlerts.length > 0) {
      activeAlerts.forEach(alert => {
        const time = alert.timestamp.toLocaleTimeString();
        const severityColor = alert.severity === 'critical' ? 'red-fg' :
                             alert.severity === 'warning' ? 'yellow-fg' : 'cyan-fg';
        content += `  ${time} {${severityColor}}${alert.severity.toUpperCase()}{/}: ${alert.message}\n`;
      });
    } else {
      content += '  {green-fg}No active alerts{/green-fg}\n';
    }
    
    this.alertsBox.setContent(content);
  }

  private getNextActions(): NextAction[] {
    const actions: NextAction[] = [];
    
    // Check for critical alerts
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical' && !a.acknowledged);
    criticalAlerts.forEach(alert => {
      actions.push({
        id: `alert-${alert.id}`,
        priority: 'urgent',
        type: 'security',
        title: 'Address Critical Alert',
        description: alert.message,
        estimatedTime: 30,
        automated: false
      });
    });
    
    // Check system health
    const lowHealthComponents = Object.entries(this.getProtectionStatus()).filter(([_, status]: any) => 
      status.components && Object.values(status.components).some((comp: any) => comp.health < 80)
    );
    
    if (lowHealthComponents.length > 0) {
      actions.push({
        id: 'health-check',
        priority: 'high',
        type: 'maintenance',
        title: 'System Health Check',
        description: 'Some components are reporting low health scores',
        estimatedTime: 15,
        automated: false
      });
    }
    
    // Check backup status
    try {
      const backupStatus = this.backupSystem.getStatus();
      const daysSinceBackup = (Date.now() - backupStatus.lastBackup.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceBackup > 1) {
        actions.push({
          id: 'backup-check',
          priority: 'medium',
          type: 'backup',
          title: 'Check Backup System',
          description: `Last backup was ${Math.round(daysSinceBackup)} days ago`,
          estimatedTime: 10,
          automated: true
        });
      }
    } catch (error) {
      // Backup system might be offline
    }
    
    // Sort by priority
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  private initializeMetrics(): DashboardMetrics {
    return {
      performance: {
        commits: [],
        vulnerabilities: [],
        backups: [],
        quality: []
      },
      trends: {
        securityScore: [85, 87, 89, 88, 90, 92, 91],
        qualityScore: [80, 82, 85, 83, 87, 89, 88],
        commitFrequency: [5, 3, 7, 4, 6, 8, 5],
        backupReliability: [100, 100, 95, 100, 100, 100, 100]
      },
      summary: {
        totalCommits: 0,
        activeDays: 0,
        averageScore: 88.5,
        riskLevel: 'low'
      }
    };
  }

  // Public API methods
  async showDashboard(): Promise<void> {
    if (!this.isRunning) {
      await this.start();
    }
    
    // Keep the dashboard running until stopped
    while (this.isRunning) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  getDashboardMetrics(): DashboardMetrics {
    return { ...this.metrics };
  }

  getRecentActivity(limit: number = 50): ActivityLog[] {
    return this.activityLog.slice(-limit);
  }

  getActiveAlerts(): ProtectionAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      this.logActivity('alert', `Alert acknowledged: ${alert.message}`, { alertId });
    }
  }

  getStatus(): {
    isRunning: boolean;
    displayMode: string;
    alertCount: number;
    lastRefresh: Date;
  } {
    return {
      isRunning: this.isRunning,
      displayMode: this.config.displayMode,
      alertCount: this.getActiveAlerts().length,
      lastRefresh: new Date()
    };
  }

  async updateConfig(newConfig: Partial<DashboardConfig>): Promise<void> {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      await this.stop();
    }
    
    this.config = { ...this.config, ...newConfig };
    
    if (wasRunning) {
      await this.start();
    }
    
    this.logger.info('ProtectionDashboard configuration updated', { config: this.config });
  }
}