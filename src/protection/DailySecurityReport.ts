import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  SecurityReport,
  SecurityVulnerability,
  CodeQualityMetrics,
  BackupHistory,
  CommitInfo,
  Logger,
  PerformanceMonitor,
  FileSystem,
  GitIntegration
} from './types';
import { ContinuousSecurityMonitor } from './ContinuousSecurityMonitor';
import { AutomatedReviewPipeline } from './AutomatedReviewPipeline';
import { IntegratedBackupSystem } from './IntegratedBackupSystem';

const execAsync = promisify(exec);

interface ReportTemplate {
  name: string;
  format: 'markdown' | 'html' | 'json';
  template: string;
}

interface TrendData {
  date: Date;
  securityScore: number;
  qualityScore: number;
  vulnerabilities: number;
  commits: number;
}

interface ReportConfig {
  enabled: boolean;
  schedule: string;
  recipients: string[];
  format: 'markdown' | 'html' | 'json';
  includeMetrics: boolean;
  commitToRepo: boolean;
  outputPath: string;
  emailSettings?: {
    smtp: string;
    username: string;
    password: string;
  };
}

export class DailySecurityReport {
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private fileSystem: FileSystem;
  private gitIntegration: GitIntegration;
  private securityMonitor: ContinuousSecurityMonitor;
  private reviewPipeline: AutomatedReviewPipeline;
  private backupSystem: IntegratedBackupSystem;
  
  private config: ReportConfig;
  private scheduleTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private reportHistory: SecurityReport[] = [];
  private trendData: TrendData[] = [];

  constructor(
    config: ReportConfig,
    logger: Logger,
    performanceMonitor: PerformanceMonitor,
    fileSystem: FileSystem,
    gitIntegration: GitIntegration,
    securityMonitor: ContinuousSecurityMonitor,
    reviewPipeline: AutomatedReviewPipeline,
    backupSystem: IntegratedBackupSystem
  ) {
    this.config = config;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.fileSystem = fileSystem;
    this.gitIntegration = gitIntegration;
    this.securityMonitor = securityMonitor;
    this.reviewPipeline = reviewPipeline;
    this.backupSystem = backupSystem;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('DailySecurityReport is already running');
      return;
    }

    const perfId = this.performanceMonitor.start('report-system-start');
    
    try {
      this.logger.info('Starting DailySecurityReport', { config: this.config });
      
      // Load existing report history
      await this.loadReportHistory();
      
      // Load trend data
      await this.loadTrendData();
      
      // Ensure output directory exists
      await fs.ensureDir(path.dirname(this.config.outputPath));
      
      // Start scheduled reporting
      if (this.config.enabled) {
        this.startScheduledReporting();
      }
      
      this.isRunning = true;
      this.logger.info('DailySecurityReport started successfully');
      
    } catch (error) {
      this.logger.error('Failed to start DailySecurityReport', { error });
      throw error;
    } finally {
      this.performanceMonitor.end(perfId);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('DailySecurityReport is not running');
      return;
    }

    this.logger.info('Stopping DailySecurityReport');
    
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
    }
    
    // Save report history
    await this.saveReportHistory();
    
    this.isRunning = false;
    this.logger.info('DailySecurityReport stopped successfully');
  }

  private async loadReportHistory(): Promise<void> {
    try {
      const historyPath = path.join(process.cwd(), '.report-history.json');
      if (await this.fileSystem.exists(historyPath)) {
        const historyData = await this.fileSystem.read(historyPath);
        this.reportHistory = JSON.parse(historyData);
        
        // Convert date strings back to Date objects
        this.reportHistory.forEach(report => {
          report.timestamp = new Date(report.timestamp);
          report.period.start = new Date(report.period.start);
          report.period.end = new Date(report.period.end);
        });
      }
    } catch (error) {
      this.logger.warn('Failed to load report history', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async saveReportHistory(): Promise<void> {
    try {
      const historyPath = path.join(process.cwd(), '.report-history.json');
      await this.fileSystem.write(historyPath, JSON.stringify(this.reportHistory, null, 2));
    } catch (error) {
      this.logger.warn('Failed to save report history', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async loadTrendData(): Promise<void> {
    try {
      const trendPath = path.join(process.cwd(), '.trend-data.json');
      if (await this.fileSystem.exists(trendPath)) {
        const trendDataStr = await this.fileSystem.read(trendPath);
        this.trendData = JSON.parse(trendDataStr);
        
        // Convert date strings back to Date objects
        this.trendData.forEach(data => {
          data.date = new Date(data.date);
        });
      }
    } catch (error) {
      this.logger.warn('Failed to load trend data', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async saveTrendData(): Promise<void> {
    try {
      const trendPath = path.join(process.cwd(), '.trend-data.json');
      await this.fileSystem.write(trendPath, JSON.stringify(this.trendData, null, 2));
    } catch (error) {
      this.logger.warn('Failed to save trend data', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private startScheduledReporting(): void {
    // Parse cron schedule (simplified - daily at specified time)
    const scheduleMatch = this.config.schedule.match(/^(\d{1,2}):(\d{2})$/);
    let targetHour = 9; // Default to 9 AM
    let targetMinute = 0;
    
    if (scheduleMatch) {
      targetHour = parseInt(scheduleMatch[1]);
      targetMinute = parseInt(scheduleMatch[2]);
    }
    
    const scheduleDaily = () => {
      const now = new Date();
      const target = new Date();
      target.setHours(targetHour, targetMinute, 0, 0);
      
      // If target time has passed today, schedule for tomorrow
      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }
      
      const msUntilTarget = target.getTime() - now.getTime();
      
      this.scheduleTimer = setTimeout(async () => {
        await this.generateDailyReport();
        scheduleDaily(); // Schedule next day
      }, msUntilTarget);
      
      this.logger.info('Next report scheduled', { 
        time: target.toISOString(),
        msUntil: msUntilTarget 
      });
    };
    
    scheduleDaily();
  }

  async generateDailyReport(): Promise<SecurityReport> {
    if (!this.isRunning) {
      throw new Error('Report system is not running');
    }

    const perfId = this.performanceMonitor.start('generate-daily-report');
    
    try {
      this.logger.info('Generating daily security report');
      
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Collect data from all protection systems
      const report = await this.collectReportData(yesterday, now);
      
      // Update trend data
      await this.updateTrendData(report);
      
      // Generate report in requested format
      const reportContent = await this.formatReport(report);
      
      // Save report to file
      await this.saveReportToFile(report, reportContent);
      
      // Commit to repository if enabled
      if (this.config.commitToRepo) {
        await this.commitReportToRepo(report);
      }
      
      // Send to recipients if configured
      if (this.config.recipients.length > 0) {
        await this.sendReportToRecipients(report, reportContent);
      }
      
      // Add to history
      this.reportHistory.push(report);
      
      // Keep only last 30 reports
      if (this.reportHistory.length > 30) {
        this.reportHistory = this.reportHistory.slice(-30);
      }
      
      this.logger.info('Daily security report generated successfully', {
        reportId: report.id,
        vulnerabilities: report.summary.vulnerabilitiesFound,
        overallScore: report.summary.overallScore
      });
      
      return report;
      
    } catch (error) {
      this.logger.error('Failed to generate daily report', { error });
      throw error;
    } finally {
      this.performanceMonitor.end(perfId);
    }
  }

  private async collectReportData(startDate: Date, endDate: Date): Promise<SecurityReport> {
    const reportId = crypto.randomUUID();
    
    // Get security scan results
    const lastScanResult = this.securityMonitor.getLastScanResult();
    const vulnerabilities = lastScanResult?.vulnerabilities || [];
    
    // Get code quality metrics (run a quick review)
    let qualityMetrics: CodeQualityMetrics;
    try {
      const reviewResult = await this.reviewPipeline.reviewChanges();
      qualityMetrics = reviewResult.metrics;
    } catch (error) {
      this.logger.warn('Failed to get quality metrics', { error: error instanceof Error ? error.message : String(error) });
      qualityMetrics = this.getDefaultMetrics();
    }
    
    // Get backup status
    const backupHistory = this.backupSystem.getBackupHistory();
    
    // Get commit information
    const commits = await this.getRecentCommits(7); // Last 7 days
    
    // Calculate summary
    const summary = this.calculateSummary(vulnerabilities, qualityMetrics, commits);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(vulnerabilities, qualityMetrics, backupHistory);
    
    const report: SecurityReport = {
      id: reportId,
      timestamp: new Date(),
      period: {
        start: startDate,
        end: endDate
      },
      summary,
      sections: {
        vulnerabilities,
        codeQuality: qualityMetrics,
        backupStatus: backupHistory,
        commits,
        recommendations
      },
      metrics: {
        securityScore: qualityMetrics.securityScore,
        qualityScore: this.calculateQualityScore(qualityMetrics),
        coveragePercent: qualityMetrics.testCoverage,
        technicalDebtHours: Math.round(qualityMetrics.technicalDebt / 60)
      }
    };
    
    return report;
  }

  private calculateSummary(
    vulnerabilities: SecurityVulnerability[], 
    qualityMetrics: CodeQualityMetrics,
    commits: CommitInfo[]
  ) {
    const overallScore = this.calculateOverallScore(vulnerabilities, qualityMetrics);
    
    // Determine trend by comparing with previous report
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (this.reportHistory.length > 0) {
      const lastReport = this.reportHistory[this.reportHistory.length - 1];
      const scoreDiff = overallScore - lastReport.summary.overallScore;
      
      if (scoreDiff > 5) trend = 'improving';
      else if (scoreDiff < -5) trend = 'declining';
    }
    
    // Count new vulnerabilities
    let newVulnerabilities = vulnerabilities.length;
    if (this.reportHistory.length > 0) {
      const lastReport = this.reportHistory[this.reportHistory.length - 1];
      const lastVulnIds = new Set(lastReport.sections.vulnerabilities.map(v => v.description));
      newVulnerabilities = vulnerabilities.filter(v => !lastVulnIds.has(v.description)).length;
    }
    
    return {
      overallScore,
      trend,
      vulnerabilitiesFound: vulnerabilities.length,
      vulnerabilitiesFixed: 0, // Would need to track fixes
      newVulnerabilities
    };
  }

  private calculateOverallScore(vulnerabilities: SecurityVulnerability[], qualityMetrics: CodeQualityMetrics): number {
    let score = 100;
    
    // Deduct points for vulnerabilities
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });
    
    // Factor in quality metrics
    score = (score + qualityMetrics.securityScore + qualityMetrics.maintainability) / 3;
    
    return Math.max(0, Math.round(score));
  }

  private calculateQualityScore(metrics: CodeQualityMetrics): number {
    // Weighted average of quality metrics
    const weights = {
      maintainability: 0.3,
      testCoverage: 0.3,
      complexity: 0.2,
      security: 0.2
    };
    
    const complexityScore = Math.max(0, 100 - metrics.complexity * 5);
    
    return Math.round(
      metrics.maintainability * weights.maintainability +
      metrics.testCoverage * weights.testCoverage +
      complexityScore * weights.complexity +
      metrics.securityScore * weights.security
    );
  }

  private generateRecommendations(
    vulnerabilities: SecurityVulnerability[],
    qualityMetrics: CodeQualityMetrics,
    backupHistory: BackupHistory
  ): string[] {
    const recommendations: string[] = [];
    
    // Security recommendations
    const criticalVulns = vulnerabilities.filter(v => v.severity === 'critical').length;
    const highVulns = vulnerabilities.filter(v => v.severity === 'high').length;
    
    if (criticalVulns > 0) {
      recommendations.push(`🚨 **URGENT**: Fix ${criticalVulns} critical security vulnerabilities immediately`);
    }
    
    if (highVulns > 0) {
      recommendations.push(`⚠️ Address ${highVulns} high-severity security issues within 24 hours`);
    }
    
    // Quality recommendations
    if (qualityMetrics.testCoverage < 80) {
      recommendations.push(`📈 Increase test coverage from ${qualityMetrics.testCoverage}% to at least 80%`);
    }
    
    if (qualityMetrics.complexity > 10) {
      recommendations.push(`🔧 Reduce code complexity (current: ${qualityMetrics.complexity}, target: <10)`);
    }
    
    if (qualityMetrics.technicalDebt > 480) { // 8 hours
      recommendations.push(`⚡ Address technical debt (current: ${Math.round(qualityMetrics.technicalDebt/60)} hours)`);
    }
    
    // Backup recommendations
    if (backupHistory.successRate < 95) {
      recommendations.push(`💾 Improve backup reliability (current: ${backupHistory.successRate.toFixed(1)}%)`);
    }
    
    const daysSinceLastBackup = (Date.now() - backupHistory.lastSuccessful.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceLastBackup > 1) {
      recommendations.push(`🔄 Last successful backup was ${Math.round(daysSinceLastBackup)} days ago - check backup system`);
    }
    
    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('✅ System is healthy - maintain current security practices');
    } else {
      recommendations.push('📊 Run security scan after implementing fixes to verify improvements');
    }
    
    return recommendations;
  }

  private async getRecentCommits(days: number): Promise<CommitInfo[]> {
    try {
      const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const command = `git log --since="${sinceDate.toISOString()}" --pretty=format:"%H|%s|%an|%ad" --date=iso`;
      
      const { stdout } = await execAsync(command);
      
      if (!stdout.trim()) {
        return [];
      }
      
      return stdout.trim().split('\n').map(line => {
        const [hash, message, author, dateStr] = line.split('|');
        return {
          hash,
          message,
          author,
          timestamp: new Date(dateStr),
          files: [] as string[], // Would need separate call to get files
          branch: '' // Would need separate call to get branch
        };
      });
      
    } catch (error) {
      this.logger.warn('Failed to get recent commits', { error: error instanceof Error ? error.message : String(error) });
      return [];
    }
  }

  private getDefaultMetrics(): CodeQualityMetrics {
    return {
      complexity: 5,
      maintainability: 70,
      testCoverage: 0,
      duplicateLines: 0,
      linesOfCode: 0,
      technicalDebt: 0,
      securityScore: 80
    };
  }

  private async updateTrendData(report: SecurityReport): Promise<void> {
    const trendPoint: TrendData = {
      date: new Date(),
      securityScore: report.metrics.securityScore,
      qualityScore: report.metrics.qualityScore,
      vulnerabilities: report.summary.vulnerabilitiesFound,
      commits: report.sections.commits.length
    };
    
    this.trendData.push(trendPoint);
    
    // Keep only last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    this.trendData = this.trendData.filter(data => data.date >= ninetyDaysAgo);
    
    await this.saveTrendData();
  }

  private async formatReport(report: SecurityReport): Promise<string> {
    switch (this.config.format) {
      case 'markdown':
        return this.formatMarkdownReport(report);
      case 'html':
        return this.formatHtmlReport(report);
      case 'json':
        return JSON.stringify(report, null, 2);
      default:
        throw new Error(`Unsupported report format: ${this.config.format}`);
    }
  }

  private formatMarkdownReport(report: SecurityReport): string {
    const trend = report.summary.trend === 'improving' ? '📈' : 
                  report.summary.trend === 'declining' ? '📉' : '➡️';
    
    let markdown = `# Daily Security Report
*Generated on ${report.timestamp.toDateString()}*

## 📊 Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| Overall Score | **${report.summary.overallScore}/100** | ${this.getScoreStatus(report.summary.overallScore)} |
| Trend | ${trend} ${report.summary.trend} | ${this.getTrendStatus(report.summary.trend)} |
| Vulnerabilities | ${report.summary.vulnerabilitiesFound} | ${this.getVulnStatus(report.summary.vulnerabilitiesFound)} |
| New Issues | ${report.summary.newVulnerabilities} | ${this.getNewVulnStatus(report.summary.newVulnerabilities)} |

## 🛡️ Security Overview

### Vulnerabilities by Severity
`;

    // Add vulnerability breakdown
    const vulnBySeverity = {
      critical: report.sections.vulnerabilities.filter(v => v.severity === 'critical').length,
      high: report.sections.vulnerabilities.filter(v => v.severity === 'high').length,
      medium: report.sections.vulnerabilities.filter(v => v.severity === 'medium').length,
      low: report.sections.vulnerabilities.filter(v => v.severity === 'low').length
    };

    markdown += `
| Severity | Count |
|----------|-------|
| 🔴 Critical | ${vulnBySeverity.critical} |
| 🟠 High | ${vulnBySeverity.high} |
| 🟡 Medium | ${vulnBySeverity.medium} |
| 🟢 Low | ${vulnBySeverity.low} |

`;

    // Add detailed vulnerabilities if any
    if (report.sections.vulnerabilities.length > 0) {
      markdown += `### 🔍 Detailed Vulnerabilities\n\n`;
      
      report.sections.vulnerabilities.slice(0, 10).forEach((vuln, index) => {
        const icon = vuln.severity === 'critical' ? '🔴' : 
                    vuln.severity === 'high' ? '🟠' :
                    vuln.severity === 'medium' ? '🟡' : '🟢';
        
        markdown += `#### ${index + 1}. ${icon} ${vuln.description}
- **File**: \`${vuln.file}\` (line ${vuln.line})
- **Severity**: ${vuln.severity.toUpperCase()}
- **Type**: ${vuln.type}
- **Recommendation**: ${vuln.recommendation}

`;
      });
    }

    // Add code quality metrics
    markdown += `## 📈 Code Quality Metrics

| Metric | Value | Target |
|--------|-------|--------|
| Maintainability | ${report.sections.codeQuality.maintainability}/100 | >70 |
| Test Coverage | ${report.sections.codeQuality.testCoverage}% | >80% |
| Complexity | ${report.sections.codeQuality.complexity} | <10 |
| Security Score | ${report.sections.codeQuality.securityScore}/100 | >90 |
| Technical Debt | ${report.metrics.technicalDebtHours}h | <8h |

`;

    // Add backup status
    markdown += `## 💾 Backup Status

| Metric | Value |
|--------|-------|
| Success Rate | ${report.sections.backupStatus.successRate.toFixed(1)}% |
| Last Successful | ${report.sections.backupStatus.lastSuccessful.toDateString()} |
| Total Backups | ${report.sections.backupStatus.backups.length} |
| Total Size | ${this.formatBytes(report.sections.backupStatus.totalSize)} |

`;

    // Add recent activity
    if (report.sections.commits.length > 0) {
      markdown += `## 📝 Recent Activity (Last 7 Days)

${report.sections.commits.slice(0, 5).map(commit => 
  `- **${commit.author}**: ${commit.message} *(${commit.timestamp.toLocaleDateString()})*`
).join('\n')}

`;
    }

    // Add recommendations
    markdown += `## 🎯 Recommendations

${report.sections.recommendations.map(rec => `- ${rec}`).join('\n')}

## 📊 Trend Analysis

`;

    // Add trend data if available
    if (this.trendData.length > 1) {
      const recent = this.trendData.slice(-7);
      markdown += `### Last 7 Days

| Date | Security | Quality | Vulnerabilities |
|------|----------|---------|-----------------|
${recent.map(data => 
  `| ${data.date.toLocaleDateString()} | ${data.securityScore} | ${data.qualityScore} | ${data.vulnerabilities} |`
).join('\n')}

`;
    }

    markdown += `
---
*Report generated by Agentwise Automated Protection System*
*Next report: ${new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()}*
`;

    return markdown;
  }

  private formatHtmlReport(report: SecurityReport): string {
    // Convert markdown to HTML (simplified)
    const markdownReport = this.formatMarkdownReport(report);
    
    // Basic markdown to HTML conversion
    let html = markdownReport
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^\*(.*)$/gm, '<em>$1</em>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/^\| (.*) \|$/gm, '<tr><td>$1</td></tr>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^- (.*$)/gm, '<li>$1</li>');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Daily Security Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1, h2, h3 { color: #333; }
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .score-high { color: green; font-weight: bold; }
        .score-medium { color: orange; font-weight: bold; }
        .score-low { color: red; font-weight: bold; }
        .trend-improving { color: green; }
        .trend-declining { color: red; }
        .trend-stable { color: blue; }
    </style>
</head>
<body>
${html}
</body>
</html>
    `;
  }

  private getScoreStatus(score: number): string {
    if (score >= 80) return '✅ Excellent';
    if (score >= 60) return '⚠️ Good';
    if (score >= 40) return '🟡 Fair';
    return '🔴 Poor';
  }

  private getTrendStatus(trend: string): string {
    switch (trend) {
      case 'improving': return '✅ Improving';
      case 'declining': return '⚠️ Declining';
      default: return '➡️ Stable';
    }
  }

  private getVulnStatus(count: number): string {
    if (count === 0) return '✅ None';
    if (count <= 5) return '⚠️ Low';
    if (count <= 10) return '🟡 Medium';
    return '🔴 High';
  }

  private getNewVulnStatus(count: number): string {
    if (count === 0) return '✅ None';
    if (count <= 2) return '⚠️ Few';
    return '🔴 Many';
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  private async saveReportToFile(report: SecurityReport, content: string): Promise<void> {
    try {
      const timestamp = report.timestamp.toISOString().split('T')[0];
      const extension = this.config.format === 'json' ? 'json' : 
                       this.config.format === 'html' ? 'html' : 'md';
      
      const filename = `security-report-${timestamp}.${extension}`;
      const filepath = path.join(this.config.outputPath, filename);
      
      await this.fileSystem.write(filepath, content);
      
      this.logger.info('Report saved to file', { filepath });
      
    } catch (error) {
      this.logger.error('Failed to save report to file', { error });
    }
  }

  private async commitReportToRepo(report: SecurityReport): Promise<void> {
    try {
      const timestamp = report.timestamp.toISOString().split('T')[0];
      const filename = `security-report-${timestamp}.md`;
      const filepath = path.join('reports', filename);
      
      // Ensure reports directory exists
      await fs.ensureDir('reports');
      
      // Generate markdown content
      const content = this.formatMarkdownReport(report);
      
      // Write to reports directory
      await this.fileSystem.write(filepath, content);
      
      // Commit to git
      const commitMessage = `Add daily security report for ${timestamp}

Overall Score: ${report.summary.overallScore}/100
Vulnerabilities: ${report.summary.vulnerabilitiesFound}
Trend: ${report.summary.trend}

Generated automatically by Agentwise Protection System`;
      
      await this.gitIntegration.commit([filepath], commitMessage);
      
      this.logger.info('Report committed to repository', { filepath });
      
    } catch (error) {
      this.logger.error('Failed to commit report to repository', { error });
    }
  }

  private async sendReportToRecipients(report: SecurityReport, content: string): Promise<void> {
    // Email sending would require SMTP configuration
    // For now, just log that we would send
    this.logger.info('Report would be sent to recipients', {
      recipients: this.config.recipients,
      reportId: report.id
    });
  }

  // Public API methods
  async generateReport(): Promise<SecurityReport> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return this.generateDailyReport();
  }

  getReportHistory(): SecurityReport[] {
    return [...this.reportHistory];
  }

  getTrendData(): TrendData[] {
    return [...this.trendData];
  }

  getStatus(): {
    isRunning: boolean;
    lastReport: Date | null;
    nextScheduled: Date | null;
    reportCount: number;
  } {
    return {
      isRunning: this.isRunning,
      lastReport: this.reportHistory.length > 0 ? 
        this.reportHistory[this.reportHistory.length - 1].timestamp : null,
      nextScheduled: null, // Could calculate from schedule
      reportCount: this.reportHistory.length
    };
  }

  async updateConfig(newConfig: Partial<ReportConfig>): Promise<void> {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      await this.stop();
    }
    
    this.config = { ...this.config, ...newConfig };
    
    if (wasRunning) {
      await this.start();
    }
    
    this.logger.info('DailySecurityReport configuration updated', { config: this.config });
  }
}