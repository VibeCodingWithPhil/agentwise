export interface CommitRule {
  pattern: string;
  immediate: boolean;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AutoCommitConfig {
  enabled: boolean;
  watchPaths: string[];
  excludePaths: string[];
  commitRules: CommitRule[];
  intervalMinutes: number;
  maxFilesPerCommit: number;
  requireSecurityCheck: boolean;
  generateIntelligentMessages: boolean;
}

export interface FileChangeEvent {
  path: string;
  type: 'added' | 'modified' | 'deleted' | 'renamed';
  timestamp: Date;
  size: number;
  hash?: string;
}

export interface CommitInfo {
  hash: string;
  message: string;
  timestamp: Date;
  files: string[];
  author: string;
  branch: string;
}

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'secret' | 'dependency' | 'code' | 'config' | 'permission';
  file: string;
  line: number;
  description: string;
  recommendation: string;
  autoFixAvailable: boolean;
  cwe?: string;
  cvss?: number;
  cve?: string;
}

export interface SecurityScanResult {
  timestamp: Date;
  scanId: string;
  vulnerabilities: SecurityVulnerability[];
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  duration: number;
  filesScanned: number;
}

export interface SecurityMonitorConfig {
  enabled: boolean;
  scanInterval: number;
  realTimeScan: boolean;
  autoFix: boolean;
  secretPatterns: string[];
  excludeFiles: string[];
  owaspChecks: boolean;
  dependencyCheck: boolean;
  alertThresholds: {
    critical: number;
    high: number;
    medium: number;
  };
}

export interface CodeQualityMetrics {
  complexity: number;
  maintainability: number;
  testCoverage: number;
  duplicateLines: number;
  linesOfCode: number;
  technicalDebt: number;
  securityScore: number;
}

export interface ReviewCheckResult {
  passed: boolean;
  score: number;
  issues: ReviewIssue[];
  metrics: CodeQualityMetrics;
  recommendations: string[];
}

export interface ReviewIssue {
  type: 'quality' | 'security' | 'performance' | 'style' | 'test';
  severity: 'info' | 'warning' | 'error' | 'critical';
  file: string;
  line: number;
  message: string;
  rule: string;
  fixable: boolean;
}

export interface ReviewPipelineConfig {
  enabled: boolean;
  blockOnFailure: boolean;
  minimumScore: number;
  checks: {
    quality: boolean;
    security: boolean;
    performance: boolean;
    testCoverage: boolean;
    style: boolean;
  };
  thresholds: {
    complexity: number;
    coverage: number;
    maintainability: number;
    security: number;
  };
}

export interface BackupConfig {
  enabled: boolean;
  strategy: 'continuous' | 'interval' | 'event-based';
  destinations: BackupDestination[];
  retention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  compression: boolean;
  encryption: boolean;
  verifyBackups: boolean;
}

export interface BackupDestination {
  type: 'local' | 'github' | 's3' | 'gdrive';
  path: string;
  credentials?: Record<string, string>;
  priority: number;
}

export interface BackupResult {
  id: string;
  timestamp: Date;
  status: 'success' | 'partial' | 'failed';
  destination: string;
  filesBackedUp: number;
  size: number;
  duration: number;
  error?: string;
  hash: string;
}

export interface BackupHistory {
  backups: BackupResult[];
  totalSize: number;
  lastSuccessful: Date;
  failureCount: number;
  successRate: number;
}

export interface SecurityReport {
  id: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    overallScore: number;
    trend: 'improving' | 'stable' | 'declining';
    vulnerabilitiesFound: number;
    vulnerabilitiesFixed: number;
    newVulnerabilities: number;
  };
  sections: {
    vulnerabilities: SecurityVulnerability[];
    codeQuality: CodeQualityMetrics;
    backupStatus: BackupHistory;
    commits: CommitInfo[];
    recommendations: string[];
  };
  metrics: {
    securityScore: number;
    qualityScore: number;
    coveragePercent: number;
    technicalDebtHours: number;
  };
}

export interface ProtectionStatus {
  timestamp: Date;
  overall: 'healthy' | 'warning' | 'critical' | 'offline';
  components: {
    autoCommit: ComponentStatus;
    securityMonitor: ComponentStatus;
    reviewPipeline: ComponentStatus;
    backupSystem: ComponentStatus;
    reporting: ComponentStatus;
  };
  metrics: {
    uptime: number;
    lastCommit: Date;
    lastScan: Date;
    lastBackup: Date;
    lastReport: Date;
  };
  alerts: ProtectionAlert[];
}

export interface ComponentStatus {
  status: 'online' | 'offline' | 'error' | 'warning';
  lastActivity: Date;
  errorCount: number;
  performance: {
    avgResponseTime: number;
    successRate: number;
  };
  health: number; // 0-100
}

export interface ProtectionAlert {
  id: string;
  type: 'security' | 'backup' | 'quality' | 'system';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  actions: string[];
}

export interface DashboardMetrics {
  performance: {
    commits: { timestamp: Date; count: number }[];
    vulnerabilities: { timestamp: Date; count: number }[];
    backups: { timestamp: Date; success: boolean }[];
    quality: { timestamp: Date; score: number }[];
  };
  trends: {
    securityScore: number[];
    qualityScore: number[];
    commitFrequency: number[];
    backupReliability: number[];
  };
  summary: {
    totalCommits: number;
    activeDays: number;
    averageScore: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

export interface ActivityLog {
  id: string;
  timestamp: Date;
  type: 'commit' | 'scan' | 'backup' | 'review' | 'alert' | 'fix';
  description: string;
  details: Record<string, any>;
  success: boolean;
  duration?: number;
}

export interface NextAction {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'security' | 'quality' | 'backup' | 'review' | 'maintenance';
  title: string;
  description: string;
  estimatedTime: number;
  dueDate?: Date;
  automated: boolean;
}

export interface ProtectionConfig {
  autoCommit: AutoCommitConfig;
  security: SecurityMonitorConfig;
  review: ReviewPipelineConfig;
  backup: BackupConfig;
  reporting: {
    enabled: boolean;
    schedule: string; // cron format
    recipients: string[];
    format: 'markdown' | 'html' | 'json';
    includeMetrics: boolean;
    commitToRepo: boolean;
  };
  alerts: {
    enabled: boolean;
    channels: ('console' | 'file' | 'webhook')[];
    webhookUrl?: string;
    thresholds: {
      criticalVulnerabilities: number;
      backupFailures: number;
      qualityDrop: number;
    };
  };
}

// Event system types
export interface ProtectionEvent {
  id: string;
  type: string;
  timestamp: Date;
  data: Record<string, any>;
}

export interface EventHandler {
  handle(event: ProtectionEvent): Promise<void>;
}

export interface EventEmitter {
  emit(event: ProtectionEvent): void;
  on(eventType: string, handler: EventHandler): void;
  off(eventType: string, handler: EventHandler): void;
}

// Plugin system types
export interface ProtectionPlugin {
  name: string;
  version: string;
  description: string;
  initialize(config: any): Promise<void>;
  destroy(): Promise<void>;
}

export interface PluginManager {
  register(plugin: ProtectionPlugin): void;
  unregister(pluginName: string): void;
  getPlugin(name: string): ProtectionPlugin | undefined;
  listPlugins(): ProtectionPlugin[];
}

// Integration types
export interface GitIntegration {
  getCurrentBranch(): Promise<string>;
  getChangedFiles(): Promise<string[]>;
  commit(files: string[], message: string): Promise<CommitInfo>;
  push(branch?: string): Promise<void>;
  createBranch(name: string): Promise<void>;
  mergeBranch(source: string, target: string): Promise<void>;
  getCommitHistory(limit: number): Promise<CommitInfo[]>;
  getFileHistory(file: string): Promise<CommitInfo[]>;
}

export interface GitHubIntegration {
  createPullRequest(title: string, body: string, base: string, head: string): Promise<string>;
  updatePullRequest(id: string, data: any): Promise<void>;
  createIssue(title: string, body: string, labels?: string[]): Promise<string>;
  addComment(issueId: string, comment: string): Promise<void>;
  getRepositoryInfo(): Promise<any>;
  uploadArtifact(name: string, data: Buffer): Promise<string>;
}

// Error types
export class ProtectionError extends Error {
  constructor(
    message: string,
    public code: string,
    public component: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ProtectionError';
  }
}

export class SecurityError extends ProtectionError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, 'security', details);
    this.name = 'SecurityError';
  }
}

export class BackupError extends ProtectionError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, 'backup', details);
    this.name = 'BackupError';
  }
}

export class ReviewError extends ProtectionError {
  constructor(message: string, code: string, details?: any) {
    super(message, code, 'review', details);
    this.name = 'ReviewError';
  }
}

// Utility types
export interface Logger {
  debug(message: string, meta?: any): void;
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}

export interface FileSystem {
  exists(path: string): Promise<boolean>;
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  delete(path: string): Promise<void>;
  list(directory: string): Promise<string[]>;
  stat(path: string): Promise<{ size: number; modified: Date }>;
  watch(path: string, callback: (event: FileChangeEvent) => void): () => void;
}

export interface Database {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  list(pattern?: string): Promise<string[]>;
  clear(): Promise<void>;
}

export interface HttpClient {
  get<T>(url: string, headers?: Record<string, string>): Promise<T>;
  post<T>(url: string, data: any, headers?: Record<string, string>): Promise<T>;
  put<T>(url: string, data: any, headers?: Record<string, string>): Promise<T>;
  delete<T>(url: string, headers?: Record<string, string>): Promise<T>;
}

// Configuration validation
export interface ConfigValidator {
  validate(config: any): { valid: boolean; errors: string[] };
  getDefaults(): any;
  migrate(oldConfig: any, newVersion: string): any;
}

// Performance monitoring
export interface PerformanceMetrics {
  startTime: number;
  duration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  operations: number;
  errors: number;
}

export interface PerformanceMonitor {
  start(operation: string): string;
  end(id: string): PerformanceMetrics;
  getMetrics(operation?: string): PerformanceMetrics[];
  reset(): void;
}