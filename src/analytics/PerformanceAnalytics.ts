import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface PerformanceMetric {
  timestamp: Date;
  metricType: 'agent' | 'system' | 'project' | 'task';
  name: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
}

export interface AgentPerformance {
  agentName: string;
  tasksCompleted: number;
  tasksFailed: number;
  averageCompletionTime: number;
  tokenUsage: number;
  successRate: number;
  errorRate: number;
  efficiency: number;
  specializations: Map<string, number>;
  timeSeriesData: TimeSeriesData[];
}

export interface SystemPerformance {
  totalAgents: number;
  activeAgents: number;
  totalTasks: number;
  completedTasks: number;
  systemUptime: number;
  memoryUsage: number;
  cpuUsage: number;
  tokenUsageTotal: number;
  tokenSavings: number;
  throughput: number;
}

export interface ProjectPerformance {
  projectId: string;
  projectName: string;
  startTime: Date;
  completionTime?: Date;
  progress: number;
  agentsUsed: number;
  tasksTotal: number;
  tasksCompleted: number;
  tokenUsage: number;
  estimatedCost: number;
  quality: number;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
}

export interface AnalyticsReport {
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  summary: {
    totalProjects: number;
    totalTasks: number;
    averageSuccessRate: number;
    totalTokens: number;
    tokenSavings: number;
    estimatedCostSavings: number;
  };
  agentPerformance: AgentPerformance[];
  systemPerformance: SystemPerformance;
  projectPerformance: ProjectPerformance[];
  insights: string[];
  recommendations: string[];
}

export interface RealTimeMetric {
  id: string;
  metric: PerformanceMetric;
  trend: 'up' | 'down' | 'stable';
  alert?: {
    level: 'info' | 'warning' | 'critical';
    message: string;
  };
}

export class PerformanceAnalytics extends EventEmitter {
  private metrics: PerformanceMetric[];
  private agentMetrics: Map<string, AgentPerformance>;
  private projectMetrics: Map<string, ProjectPerformance>;
  private systemMetrics: SystemPerformance;
  private metricsPath: string;
  private realTimeMetrics: Map<string, RealTimeMetric>;
  private aggregationInterval: NodeJS.Timeout | null;
  private alertThresholds: Map<string, number>;
  
  constructor() {
    super();
    this.metrics = [];
    this.agentMetrics = new Map();
    this.projectMetrics = new Map();
    this.realTimeMetrics = new Map();
    this.aggregationInterval = null;
    this.alertThresholds = new Map();
    
    this.metricsPath = path.join(process.cwd(), '.analytics');
    
    this.systemMetrics = {
      totalAgents: 0,
      activeAgents: 0,
      totalTasks: 0,
      completedTasks: 0,
      systemUptime: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      tokenUsageTotal: 0,
      tokenSavings: 0,
      throughput: 0
    };
    
    this.initializeThresholds();
    this.loadHistoricalMetrics();
    this.startAggregation();
  }

  private initializeThresholds(): void {
    // Set default alert thresholds
    this.alertThresholds.set('error_rate', 0.1); // 10% error rate
    this.alertThresholds.set('token_usage', 100000); // 100k tokens
    this.alertThresholds.set('memory_usage', 0.8); // 80% memory
    this.alertThresholds.set('cpu_usage', 0.9); // 90% CPU
    this.alertThresholds.set('task_failure_rate', 0.2); // 20% failure
  }

  private async loadHistoricalMetrics(): Promise<void> {
    try {
      if (await fs.pathExists(this.metricsPath)) {
        const files = await fs.readdir(this.metricsPath);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const content = await fs.readJson(path.join(this.metricsPath, file));
            
            if (file.includes('agent-metrics')) {
              this.agentMetrics = new Map(Object.entries(content));
            } else if (file.includes('project-metrics')) {
              this.projectMetrics = new Map(Object.entries(content));
            } else if (file.includes('system-metrics')) {
              this.systemMetrics = content;
            } else if (file.includes('historical')) {
              this.metrics = content.slice(-10000); // Keep last 10k metrics
            }
          }
        }
        
        console.log('📊 Loaded historical analytics data');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  }

  private async saveMetrics(): Promise<void> {
    try {
      await fs.ensureDir(this.metricsPath);
      
      // Save different metric types
      await fs.writeJson(
        path.join(this.metricsPath, 'agent-metrics.json'),
        Object.fromEntries(this.agentMetrics),
        { spaces: 2 }
      );
      
      await fs.writeJson(
        path.join(this.metricsPath, 'project-metrics.json'),
        Object.fromEntries(this.projectMetrics),
        { spaces: 2 }
      );
      
      await fs.writeJson(
        path.join(this.metricsPath, 'system-metrics.json'),
        this.systemMetrics,
        { spaces: 2 }
      );
      
      // Save historical metrics (keep last 10k)
      await fs.writeJson(
        path.join(this.metricsPath, 'historical.json'),
        this.metrics.slice(-10000),
        { spaces: 2 }
      );
    } catch (error) {
      console.error('Error saving analytics:', error);
    }
  }

  private startAggregation(): void {
    // Aggregate metrics every minute
    this.aggregationInterval = setInterval(() => {
      this.aggregateMetrics();
      this.checkAlerts();
      this.emit('metrics-updated', this.getRealtimeSnapshot());
    }, 60000);
  }

  /**
   * Record a performance metric
   */
  async recordMetric(
    metricType: PerformanceMetric['metricType'],
    name: string,
    value: number,
    unit: string = 'count',
    tags: Record<string, string> = {}
  ): Promise<void> {
    const metric: PerformanceMetric = {
      timestamp: new Date(),
      metricType,
      name,
      value,
      unit,
      tags
    };
    
    this.metrics.push(metric);
    
    // Update real-time metrics
    this.updateRealTimeMetric(metric);
    
    // Update specific metric stores
    switch (metricType) {
      case 'agent':
        this.updateAgentMetrics(metric);
        break;
      case 'project':
        this.updateProjectMetrics(metric);
        break;
      case 'system':
        this.updateSystemMetrics(metric);
        break;
      case 'task':
        this.updateTaskMetrics(metric);
        break;
    }
    
    // Emit real-time event
    this.emit('metric-recorded', metric);
    
    // Save periodically (every 100 metrics)
    if (this.metrics.length % 100 === 0) {
      await this.saveMetrics();
    }
  }

  private updateRealTimeMetric(metric: PerformanceMetric): void {
    const key = `${metric.metricType}-${metric.name}`;
    
    const trend = this.calculateTrend(key, metric.value);
    const alert = this.checkThreshold(metric);
    
    this.realTimeMetrics.set(key, {
      id: key,
      metric,
      trend,
      alert
    });
  }

  private calculateTrend(key: string, currentValue: number): 'up' | 'down' | 'stable' {
    const history = this.metrics
      .filter(m => `${m.metricType}-${m.name}` === key)
      .slice(-10);
    
    if (history.length < 2) return 'stable';
    
    const average = history.reduce((acc, m) => acc + m.value, 0) / history.length;
    const difference = currentValue - average;
    const percentChange = Math.abs(difference / average);
    
    if (percentChange < 0.05) return 'stable';
    return difference > 0 ? 'up' : 'down';
  }

  private checkThreshold(metric: PerformanceMetric): RealTimeMetric['alert'] | undefined {
    const thresholdKey = metric.name.toLowerCase().replace(/\s+/g, '_');
    const threshold = this.alertThresholds.get(thresholdKey);
    
    if (!threshold) return undefined;
    
    if (metric.value > threshold) {
      const severity = metric.value > threshold * 1.5 ? 'critical' : 'warning';
      return {
        level: severity,
        message: `${metric.name} exceeded threshold: ${metric.value} > ${threshold}`
      };
    }
    
    return undefined;
  }

  private updateAgentMetrics(metric: PerformanceMetric): void {
    const agentName = metric.tags.agent || 'unknown';
    let agent = this.agentMetrics.get(agentName);
    
    if (!agent) {
      agent = {
        agentName,
        tasksCompleted: 0,
        tasksFailed: 0,
        averageCompletionTime: 0,
        tokenUsage: 0,
        successRate: 0,
        errorRate: 0,
        efficiency: 0,
        specializations: new Map(),
        timeSeriesData: []
      };
      this.agentMetrics.set(agentName, agent);
    }
    
    // Update based on metric name
    switch (metric.name) {
      case 'task_completed':
        agent.tasksCompleted++;
        break;
      case 'task_failed':
        agent.tasksFailed++;
        break;
      case 'completion_time':
        agent.averageCompletionTime = this.updateAverage(
          agent.averageCompletionTime,
          metric.value,
          agent.tasksCompleted
        );
        break;
      case 'token_usage':
        agent.tokenUsage += metric.value;
        break;
    }
    
    // Update calculated metrics
    const totalTasks = agent.tasksCompleted + agent.tasksFailed;
    if (totalTasks > 0) {
      agent.successRate = agent.tasksCompleted / totalTasks;
      agent.errorRate = agent.tasksFailed / totalTasks;
      agent.efficiency = agent.tasksCompleted / (agent.tokenUsage / 1000);
    }
    
    // Add to time series
    agent.timeSeriesData.push({
      timestamp: metric.timestamp,
      value: metric.value
    });
    
    // Keep only last 1000 data points
    if (agent.timeSeriesData.length > 1000) {
      agent.timeSeriesData = agent.timeSeriesData.slice(-1000);
    }
  }

  private updateProjectMetrics(metric: PerformanceMetric): void {
    const projectId = metric.tags.project || 'unknown';
    let project = this.projectMetrics.get(projectId);
    
    if (!project) {
      project = {
        projectId,
        projectName: metric.tags.projectName || projectId,
        startTime: new Date(),
        progress: 0,
        agentsUsed: 0,
        tasksTotal: 0,
        tasksCompleted: 0,
        tokenUsage: 0,
        estimatedCost: 0,
        quality: 0
      };
      this.projectMetrics.set(projectId, project);
    }
    
    // Update based on metric name
    switch (metric.name) {
      case 'project_start':
        project.startTime = metric.timestamp;
        break;
      case 'project_complete':
        project.completionTime = metric.timestamp;
        break;
      case 'task_total':
        project.tasksTotal = metric.value;
        break;
      case 'task_completed':
        project.tasksCompleted++;
        break;
      case 'agent_assigned':
        project.agentsUsed++;
        break;
      case 'token_usage':
        project.tokenUsage += metric.value;
        break;
    }
    
    // Update calculated metrics
    if (project.tasksTotal > 0) {
      project.progress = project.tasksCompleted / project.tasksTotal;
    }
    
    // Estimate cost (rough estimate: $0.01 per 1000 tokens)
    project.estimatedCost = (project.tokenUsage / 1000) * 0.01;
    
    // Calculate quality score (simplified)
    project.quality = project.progress * (1 - this.systemMetrics.activeAgents * 0.01);
  }

  private updateSystemMetrics(metric: PerformanceMetric): void {
    switch (metric.name) {
      case 'agents_total':
        this.systemMetrics.totalAgents = metric.value;
        break;
      case 'agents_active':
        this.systemMetrics.activeAgents = metric.value;
        break;
      case 'tasks_total':
        this.systemMetrics.totalTasks = metric.value;
        break;
      case 'tasks_completed':
        this.systemMetrics.completedTasks = metric.value;
        break;
      case 'memory_usage':
        this.systemMetrics.memoryUsage = metric.value;
        break;
      case 'cpu_usage':
        this.systemMetrics.cpuUsage = metric.value;
        break;
      case 'token_usage':
        this.systemMetrics.tokenUsageTotal += metric.value;
        break;
      case 'uptime':
        this.systemMetrics.systemUptime = metric.value;
        break;
    }
    
    // Calculate throughput (tasks per hour)
    if (this.systemMetrics.systemUptime > 0) {
      const hoursUp = this.systemMetrics.systemUptime / 3600;
      this.systemMetrics.throughput = this.systemMetrics.completedTasks / hoursUp;
    }
    
    // Calculate token savings (compared to non-optimized)
    const expectedTokens = this.systemMetrics.completedTasks * 1000; // Assume 1000 tokens per task baseline
    this.systemMetrics.tokenSavings = Math.max(0, expectedTokens - this.systemMetrics.tokenUsageTotal);
  }

  private updateTaskMetrics(metric: PerformanceMetric): void {
    // Task-specific metrics update both agent and project metrics
    if (metric.tags.agent) {
      this.updateAgentMetrics({
        ...metric,
        metricType: 'agent'
      });
    }
    
    if (metric.tags.project) {
      this.updateProjectMetrics({
        ...metric,
        metricType: 'project'
      });
    }
  }

  private updateAverage(currentAvg: number, newValue: number, count: number): number {
    if (count === 0) return newValue;
    return ((currentAvg * count) + newValue) / (count + 1);
  }

  private aggregateMetrics(): void {
    // Aggregate metrics for better performance
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    
    // Remove old metrics
    this.metrics = this.metrics.filter(m => m.timestamp > oneHourAgo);
    
    // Update system metrics
    this.updateSystemAggregates();
  }

  private updateSystemAggregates(): void {
    // Get system resource usage
    const memUsage = process.memoryUsage();
    this.systemMetrics.memoryUsage = memUsage.heapUsed / memUsage.heapTotal;
    
    // Update uptime
    this.systemMetrics.systemUptime = process.uptime();
  }

  private checkAlerts(): void {
    // Check for alert conditions
    for (const [key, metric] of Array.from(this.realTimeMetrics.entries())) {
      if (metric.alert) {
        this.emit('alert', {
          metric: key,
          alert: metric.alert,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Generate analytics report
   */
  async generateReport(
    period: AnalyticsReport['period'] = 'daily'
  ): Promise<AnalyticsReport> {
    const now = new Date();
    const startDate = this.getStartDate(now, period);
    
    // Filter metrics for the period
    const periodMetrics = this.metrics.filter(
      m => m.timestamp >= startDate && m.timestamp <= now
    );
    
    // Calculate summary
    const summary = {
      totalProjects: this.projectMetrics.size,
      totalTasks: this.systemMetrics.totalTasks,
      averageSuccessRate: this.calculateAverageSuccessRate(),
      totalTokens: this.systemMetrics.tokenUsageTotal,
      tokenSavings: this.systemMetrics.tokenSavings,
      estimatedCostSavings: (this.systemMetrics.tokenSavings / 1000) * 0.01
    };
    
    // Generate insights
    const insights = this.generateInsights(periodMetrics);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations();
    
    return {
      period,
      startDate,
      endDate: now,
      summary,
      agentPerformance: Array.from(this.agentMetrics.values()),
      systemPerformance: this.systemMetrics,
      projectPerformance: Array.from(this.projectMetrics.values()),
      insights,
      recommendations
    };
  }

  private getStartDate(endDate: Date, period: AnalyticsReport['period']): Date {
    const start = new Date(endDate);
    
    switch (period) {
      case 'hourly':
        start.setHours(start.getHours() - 1);
        break;
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
    }
    
    return start;
  }

  private calculateAverageSuccessRate(): number {
    let totalSuccess = 0;
    let count = 0;
    
    for (const agent of Array.from(this.agentMetrics.values())) {
      totalSuccess += agent.successRate;
      count++;
    }
    
    return count > 0 ? totalSuccess / count : 0;
  }

  private generateInsights(_metrics: PerformanceMetric[]): string[] {
    const insights: string[] = [];
    
    // Analyze agent performance
    const topAgent = this.findTopPerformingAgent();
    if (topAgent) {
      insights.push(`Top performing agent: ${topAgent.agentName} with ${(topAgent.successRate * 100).toFixed(1)}% success rate`);
    }
    
    // Token efficiency
    if (this.systemMetrics.tokenSavings > 0) {
      const savingsPercent = (this.systemMetrics.tokenSavings / this.systemMetrics.tokenUsageTotal) * 100;
      insights.push(`Token optimization saved ${savingsPercent.toFixed(1)}% compared to baseline`);
    }
    
    // Project completion trends
    const completedProjects = Array.from(this.projectMetrics.values())
      .filter(p => p.completionTime);
    if (completedProjects.length > 0) {
      const avgCompletionTime = completedProjects.reduce((acc, p) => {
        const duration = (p.completionTime!.getTime() - p.startTime.getTime()) / 1000;
        return acc + duration;
      }, 0) / completedProjects.length;
      
      insights.push(`Average project completion time: ${(avgCompletionTime / 3600).toFixed(1)} hours`);
    }
    
    // System throughput
    if (this.systemMetrics.throughput > 0) {
      insights.push(`System throughput: ${this.systemMetrics.throughput.toFixed(1)} tasks/hour`);
    }
    
    // Error patterns
    const highErrorAgents = Array.from(this.agentMetrics.values())
      .filter(a => a.errorRate > 0.1);
    if (highErrorAgents.length > 0) {
      insights.push(`${highErrorAgents.length} agents have error rates above 10%`);
    }
    
    return insights;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    
    // Check for underperforming agents
    for (const agent of Array.from(this.agentMetrics.values())) {
      if (agent.errorRate > 0.2) {
        recommendations.push(`Consider retraining ${agent.agentName} (error rate: ${(agent.errorRate * 100).toFixed(1)}%)`);
      }
      
      if (agent.efficiency < 0.5) {
        recommendations.push(`Optimize ${agent.agentName} for better token efficiency`);
      }
    }
    
    // System-level recommendations
    if (this.systemMetrics.memoryUsage > 0.8) {
      recommendations.push('High memory usage detected - consider scaling resources');
    }
    
    if (this.systemMetrics.activeAgents > this.systemMetrics.totalAgents * 0.8) {
      recommendations.push('High agent utilization - consider adding more agents');
    }
    
    // Token optimization
    if (this.systemMetrics.tokenSavings < this.systemMetrics.tokenUsageTotal * 0.3) {
      recommendations.push('Token optimization can be improved - review compression strategies');
    }
    
    // Project recommendations
    const slowProjects = Array.from(this.projectMetrics.values())
      .filter(p => p.progress < 0.5 && !p.completionTime);
    if (slowProjects.length > 0) {
      recommendations.push(`${slowProjects.length} projects are progressing slowly - review task distribution`);
    }
    
    return recommendations;
  }

  private findTopPerformingAgent(): AgentPerformance | undefined {
    let topAgent: AgentPerformance | undefined;
    let topScore = 0;
    
    for (const agent of Array.from(this.agentMetrics.values())) {
      const score = agent.successRate * agent.efficiency;
      if (score > topScore) {
        topScore = score;
        topAgent = agent;
      }
    }
    
    return topAgent;
  }

  /**
   * Get real-time snapshot for dashboard
   */
  getRealtimeSnapshot(): any {
    return {
      system: this.systemMetrics,
      agents: Array.from(this.agentMetrics.values()).map(a => ({
        name: a.agentName,
        status: a.tasksCompleted > 0 ? 'active' : 'idle',
        successRate: a.successRate,
        currentTask: a.timeSeriesData[a.timeSeriesData.length - 1]
      })),
      projects: Array.from(this.projectMetrics.values()).map(p => ({
        id: p.projectId,
        name: p.projectName,
        progress: p.progress,
        status: p.completionTime ? 'completed' : 'active'
      })),
      alerts: Array.from(this.realTimeMetrics.values())
        .filter(m => m.alert)
        .map(m => m.alert),
      metrics: Array.from(this.realTimeMetrics.values())
    };
  }

  /**
   * Export metrics for external analysis
   */
  async exportMetrics(format: 'json' | 'csv' = 'json'): Promise<string> {
    const data = {
      metrics: this.metrics,
      agents: Object.fromEntries(this.agentMetrics),
      projects: Object.fromEntries(this.projectMetrics),
      system: this.systemMetrics,
      timestamp: new Date()
    };
    
    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // Convert to CSV format
      return this.convertToCSV(data);
    }
  }

  private convertToCSV(_data: any): string {
    const lines: string[] = [];
    
    // Headers
    lines.push('timestamp,type,name,value,unit,tags');
    
    // Metrics
    for (const metric of this.metrics) {
      lines.push(
        `${metric.timestamp.toISOString()},${metric.metricType},${metric.name},${metric.value},${metric.unit},"${JSON.stringify(metric.tags)}"`
      );
    }
    
    return lines.join('\n');
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    if (this.aggregationInterval) {
      clearInterval(this.aggregationInterval);
    }
    
    await this.saveMetrics();
    
    this.removeAllListeners();
  }
}