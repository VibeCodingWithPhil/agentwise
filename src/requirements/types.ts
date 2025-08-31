export interface Requirements {
  id: string;
  title: string;
  description: string;
  projectType: ProjectType;
  scope: ProjectScope;
  features: Feature[];
  techStack: TechStack;
  database?: DatabaseConfig;
  architecture: ArchitecturePattern;
  deployment: DeploymentStack;
  timeline: Timeline;
  complexity: ComplexityLevel;
  budget?: BudgetRange;
  team: TeamConfig;
  constraints: Constraint[];
  metadata: RequirementsMetadata;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  category: FeatureCategory;
  priority: Priority;
  complexity: ComplexityLevel;
  estimatedHours: number;
  dependencies: string[];
  requirements: string[];
  acceptance_criteria: string[];
  tags: string[];
  status: FeatureStatus;
  techRequirements: TechRequirement[];
}

export interface TechStack {
  frontend?: FrontendStack;
  backend?: BackendStack;
  database?: DatabaseStack;
  testing?: TestingStack;
  deployment?: DeploymentStack;
  tools?: DevelopmentTools;
  infrastructure?: InfrastructureStack;
}

export interface FrontendStack {
  framework: string;
  version?: string;
  language: string;
  cssFramework?: string;
  stateManagement?: string[];
  buildTool: string;
  packageManager: string;
  additionalLibraries: string[];
  designSystem?: string;
  componentLibrary?: string;
}

export interface BackendStack {
  runtime: string;
  framework: string;
  version?: string;
  language: string;
  apiType: 'REST' | 'GraphQL' | 'gRPC' | 'WebSocket' | 'Mixed';
  authentication: string[];
  authorization: string[];
  middleware: string[];
  logging: string[];
  monitoring: string[];
  additionalLibraries: string[];
}

export interface DatabaseStack {
  primary: DatabaseConfig;
  secondary?: DatabaseConfig[];
  caching?: CacheConfig;
  search?: SearchConfig;
  analytics?: AnalyticsConfig;
}

export interface DatabaseConfig {
  type: DatabaseType;
  name: string;
  version?: string;
  orm?: string;
  migrations: boolean;
  seeding: boolean;
  backup: boolean;
  replication?: ReplicationConfig;
  sharding?: ShardingConfig;
  indexing?: IndexingStrategy[];
  constraints: DatabaseConstraint[];
}

export interface CacheConfig {
  provider: 'Redis' | 'Memcached' | 'In-Memory' | 'CloudFlare' | 'CDN';
  strategy: CacheStrategy[];
  ttl: number;
  invalidation: InvalidationStrategy[];
}

export interface SearchConfig {
  provider: 'Elasticsearch' | 'Algolia' | 'Solr' | 'MeiliSearch' | 'PostgreSQL Full Text';
  indexing: IndexingConfig;
  features: SearchFeature[];
}

export interface AnalyticsConfig {
  provider: string;
  events: AnalyticsEvent[];
  dashboard: boolean;
  realtime: boolean;
}

export interface TestingStack {
  unit: string[];
  integration: string[];
  e2e: string[];
  performance: string[];
  security: string[];
  coverage: CoverageConfig;
  ci: boolean;
}

export interface CoverageConfig {
  threshold: number;
  reports: CoverageReportType[];
  exclude: string[];
}

export interface DeploymentStack {
  platform: string[];
  containerization?: ContainerConfig;
  orchestration?: OrchestrationConfig;
  cicd: CICDConfig;
  monitoring: MonitoringConfig;
  backup: BackupConfig;
  scaling: ScalingConfig;
}

export interface ContainerConfig {
  technology: 'Docker' | 'Podman';
  registry: string;
  optimization: string[];
}

export interface OrchestrationConfig {
  technology: 'Kubernetes' | 'Docker Swarm' | 'ECS' | 'Cloud Run';
  manifests: boolean;
  secrets: boolean;
  configMaps: boolean;
}

export interface CICDConfig {
  provider: string[];
  triggers: CICDTrigger[];
  stages: CICDStage[];
  environments: Environment[];
  approvals: boolean;
  rollback: boolean;
}

export interface MonitoringConfig {
  logging: LoggingConfig;
  metrics: MetricsConfig;
  alerting: AlertingConfig;
  tracing?: TracingConfig;
  healthChecks: HealthCheckConfig;
}

export interface LoggingConfig {
  provider: string;
  level: LogLevel[];
  retention: number;
  structured: boolean;
  correlation: boolean;
}

export interface MetricsConfig {
  provider: string;
  dashboards: string[];
  customMetrics: CustomMetric[];
  sla: SLAConfig[];
}

export interface AlertingConfig {
  provider: string;
  channels: AlertChannel[];
  rules: AlertRule[];
  escalation: EscalationPolicy[];
}

export interface TracingConfig {
  provider: string;
  sampling: number;
  correlation: boolean;
}

export interface HealthCheckConfig {
  endpoints: HealthCheckEndpoint[];
  frequency: number;
  timeout: number;
  retries: number;
}

export interface BackupConfig {
  strategy: BackupStrategy[];
  frequency: BackupFrequency;
  retention: RetentionPolicy;
  encryption: boolean;
  testing: boolean;
}

export interface ScalingConfig {
  type: 'horizontal' | 'vertical' | 'both';
  auto: boolean;
  triggers: ScalingTrigger[];
  limits: ScalingLimits;
}

export interface DevelopmentTools {
  ide: string[];
  versionControl: VersionControlConfig;
  projectManagement: string[];
  communication: string[];
  documentation: DocumentationConfig;
  codeQuality: CodeQualityConfig;
}

export interface VersionControlConfig {
  provider: string;
  workflow: GitWorkflow;
  hooks: GitHook[];
  protection: BranchProtection[];
}

export interface DocumentationConfig {
  tools: string[];
  apiDocs: boolean;
  codeComments: boolean;
  architecture: boolean;
  deployment: boolean;
  userGuide: boolean;
}

export interface CodeQualityConfig {
  linting: LintingConfig;
  formatting: FormattingConfig;
  typeChecking: boolean;
  security: SecurityScanConfig;
  dependencies: DependencyScanConfig;
}

export interface LintingConfig {
  tools: string[];
  rules: string[];
  preCommit: boolean;
  ci: boolean;
}

export interface FormattingConfig {
  tools: string[];
  rules: string[];
  preCommit: boolean;
  editorConfig: boolean;
}

export interface SecurityScanConfig {
  tools: string[];
  frequency: ScanFrequency;
  types: SecurityScanType[];
  threshold: SecurityThreshold;
}

export interface DependencyScanConfig {
  tools: string[];
  vulnerability: boolean;
  license: boolean;
  outdated: boolean;
  frequency: ScanFrequency;
}

export interface InfrastructureStack {
  cloud?: CloudConfig;
  networking?: NetworkConfig;
  security?: SecurityConfig;
  storage?: StorageConfig;
  compute?: ComputeConfig;
}

export interface CloudConfig {
  provider: CloudProvider[];
  regions: string[];
  services: CloudService[];
  cost: CostManagement;
}

export interface NetworkConfig {
  architecture: NetworkArchitecture;
  security: NetworkSecurity[];
  loadBalancing: LoadBalancerConfig;
  cdn: CDNConfig;
}

export interface SecurityConfig {
  authentication: AuthConfig[];
  authorization: AuthzConfig[];
  encryption: EncryptionConfig;
  compliance: ComplianceConfig[];
  firewall: FirewallConfig;
}

export interface StorageConfig {
  types: StorageType[];
  backup: boolean;
  encryption: boolean;
  replication: boolean;
  lifecycle: boolean;
}

export interface ComputeConfig {
  types: ComputeType[];
  scaling: ComputeScaling;
  optimization: ComputeOptimization[];
}

export interface Timeline {
  phases: ProjectPhase[];
  totalDuration: number;
  milestones: Milestone[];
  dependencies: PhaseDependency[];
  bufferTime: number;
  criticalPath: string[];
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  duration: number;
  startDate?: Date;
  endDate?: Date;
  features: string[];
  deliverables: Deliverable[];
  risks: Risk[];
  resources: ResourceRequirement[];
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  dueDate: Date;
  criteria: string[];
  dependencies: string[];
  critical: boolean;
}

export interface Deliverable {
  id: string;
  name: string;
  description: string;
  type: DeliverableType;
  acceptance_criteria: string[];
  reviewer: string;
}

export interface Risk {
  id: string;
  description: string;
  probability: RiskProbability;
  impact: RiskImpact;
  mitigation: string[];
  contingency: string[];
  owner: string;
}

export interface ResourceRequirement {
  role: string;
  skillLevel: SkillLevel;
  allocation: number; // percentage
  duration: number; // in days
  responsibilities: string[];
}

export interface TeamConfig {
  size: number;
  roles: TeamRole[];
  skills: SkillRequirement[];
  structure: TeamStructure;
  communication: CommunicationPlan;
  development: DevelopmentMethodology;
}

export interface TeamRole {
  name: string;
  count: number;
  responsibilities: string[];
  skills: string[];
  seniority: SkillLevel;
  collaboration: string[];
}

export interface SkillRequirement {
  category: SkillCategory;
  skills: string[];
  level: SkillLevel;
  priority: Priority;
  training: boolean;
}

export interface CommunicationPlan {
  meetings: MeetingType[];
  tools: string[];
  reporting: ReportingSchedule[];
  escalation: EscalationPath[];
}

export interface Constraint {
  id: string;
  type: ConstraintType;
  description: string;
  impact: ConstraintImpact;
  severity: Priority;
  workaround?: string[];
  acceptance_criteria: string[];
}

export interface RequirementsMetadata {
  version: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  stakeholders: Stakeholder[];
  approvals: Approval[];
  changeLog: ChangeLogEntry[];
  tags: string[];
  source: RequirementsSource;
}

export interface Stakeholder {
  name: string;
  role: string;
  influence: Priority;
  interest: Priority;
  contact: string;
  responsibilities: string[];
}

export interface Approval {
  stakeholder: string;
  status: ApprovalStatus;
  date?: Date;
  comments?: string;
  conditions?: string[];
}

export interface ChangeLogEntry {
  version: string;
  date: Date;
  author: string;
  changes: string[];
  impact: ChangeImpact;
  reason: string;
}

export interface TechRequirement {
  category: TechRequirementCategory;
  requirement: string;
  justification: string;
  alternatives: string[];
  priority: Priority;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: Recommendation[];
  score: ValidationScore;
  completeness: CompletenessCheck;
  compatibility: CompatibilityCheck;
}

export interface ValidationError {
  id: string;
  type: ValidationErrorType;
  severity: Severity;
  category: ErrorCategory;
  message: string;
  field: string;
  value?: any;
  expectedValue?: any;
  suggestions: string[];
  impact: ErrorImpact;
  fix?: AutoFix;
}

export interface ValidationWarning {
  id: string;
  type: ValidationWarningType;
  category: WarningCategory;
  message: string;
  field: string;
  impact: WarningImpact;
  suggestions: string[];
  ignorable: boolean;
}

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  type: RecommendationType;
  title: string;
  description: string;
  rationale: string;
  benefits: string[];
  risks: string[];
  effort: EffortLevel;
  impact: ImpactLevel;
  priority: Priority;
  alternatives: Alternative[];
  implementation: ImplementationGuide;
}

export interface ValidationScore {
  overall: number;
  categories: Record<string, number>;
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  completeness: number;
  feasibility: number;
  clarity: number;
  consistency: number;
  testability: number;
  maintainability: number;
}

export interface CompletenessCheck {
  requiredFields: FieldCheck[];
  recommendedFields: FieldCheck[];
  coverage: number;
  missingCritical: string[];
  missingRecommended: string[];
}

export interface FieldCheck {
  field: string;
  present: boolean;
  quality: FieldQuality;
  suggestions: string[];
}

export interface CompatibilityCheck {
  techStack: TechCompatibility;
  architecture: ArchitectureCompatibility;
  team: TeamCompatibility;
  timeline: TimelineCompatibility;
}

export interface TechCompatibility {
  compatible: boolean;
  conflicts: TechConflict[];
  gaps: TechGap[];
  optimizations: TechOptimization[];
}

export interface ArchitectureCompatibility {
  suitable: boolean;
  concerns: ArchitectureConcern[];
  alternatives: string[];
}

export interface TeamCompatibility {
  adequate: boolean;
  gaps: SkillGap[];
  overallocations: ResourceOverallocation[];
  recommendations: TeamRecommendation[];
}

export interface TimelineCompatibility {
  realistic: boolean;
  risks: TimelineRisk[];
  optimizations: TimelineOptimization[];
}

export interface ProjectOptions {
  generateSampleData: boolean;
  includeTestData: boolean;
  generateDocumentation: boolean;
  includeSecurityFeatures: boolean;
  optimizeForPerformance: boolean;
  includeAnalytics: boolean;
  generateAPIDocumentation: boolean;
  includeErrorHandling: boolean;
  includeLogging: boolean;
  includeMonitoring: boolean;
  containerized: boolean;
  cloudReady: boolean;
  mobileOptimized: boolean;
  accessibilityCompliant: boolean;
  internationalized: boolean;
  seoOptimized: boolean;
  pwа: boolean;
  offlineCapable: boolean;
}

// Enums and Union Types
export type ProjectType = 
  | 'web-application' 
  | 'mobile-application' 
  | 'desktop-application'
  | 'api-service'
  | 'microservice'
  | 'cli-tool'
  | 'library'
  | 'framework'
  | 'game'
  | 'data-pipeline'
  | 'ai-ml-model'
  | 'iot-application'
  | 'blockchain-application'
  | 'extension'
  | 'hybrid';

export type ProjectScope = 'minimal' | 'standard' | 'comprehensive' | 'enterprise';

export type FeatureCategory = 
  | 'authentication'
  | 'authorization'
  | 'user-management'
  | 'data-management'
  | 'api'
  | 'ui-ux'
  | 'security'
  | 'performance'
  | 'integration'
  | 'analytics'
  | 'monitoring'
  | 'deployment'
  | 'testing'
  | 'documentation'
  | 'business-logic'
  | 'communication'
  | 'file-management'
  | 'search'
  | 'notification'
  | 'payment'
  | 'reporting'
  | 'automation'
  | 'compliance'
  | 'accessibility'
  | 'internationalization'
  | 'mobile'
  | 'offline'
  | 'real-time'
  | 'ai-ml'
  | 'third-party';

export type Priority = 'critical' | 'high' | 'medium' | 'low' | 'optional';

export type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'very-complex';

export type FeatureStatus = 'proposed' | 'approved' | 'in-development' | 'testing' | 'completed' | 'deferred' | 'cancelled';

export type DatabaseType = 
  | 'PostgreSQL'
  | 'MySQL'
  | 'SQLite'
  | 'MongoDB'
  | 'Redis'
  | 'Elasticsearch'
  | 'DynamoDB'
  | 'Firestore'
  | 'CouchDB'
  | 'Neo4j'
  | 'InfluxDB'
  | 'Cassandra'
  | 'MariaDB'
  | 'Oracle'
  | 'SQL Server';

export type ArchitecturePattern = 
  | 'monolithic'
  | 'microservices'
  | 'serverless'
  | 'spa'
  | 'ssr'
  | 'ssg'
  | 'jamstack'
  | 'event-driven'
  | 'layered'
  | 'hexagonal'
  | 'clean'
  | 'mvvm'
  | 'mvc'
  | 'component-based'
  | 'plugin-based'
  | 'hybrid';

export type BudgetRange = 
  | 'under-10k'
  | '10k-50k'
  | '50k-100k'
  | '100k-500k'
  | '500k-1m'
  | 'over-1m'
  | 'open-ended';

export type TeamStructure = 
  | 'single-developer'
  | 'small-team'
  | 'cross-functional'
  | 'specialized'
  | 'distributed'
  | 'agile-pods'
  | 'matrix'
  | 'hierarchical';

export type DevelopmentMethodology = 
  | 'agile'
  | 'scrum'
  | 'kanban'
  | 'waterfall'
  | 'lean'
  | 'devops'
  | 'extreme-programming'
  | 'feature-driven'
  | 'rapid-prototyping';

export type ConstraintType = 
  | 'technical'
  | 'business'
  | 'legal'
  | 'regulatory'
  | 'budgetary'
  | 'timeline'
  | 'resource'
  | 'platform'
  | 'integration'
  | 'security'
  | 'performance'
  | 'scalability'
  | 'usability'
  | 'accessibility'
  | 'compliance'
  | 'environmental';

export type ConstraintImpact = 'blocking' | 'limiting' | 'preferential' | 'informational';

export type RequirementsSource = 
  | 'stakeholder-interview'
  | 'user-story'
  | 'business-analysis'
  | 'technical-analysis'
  | 'competitor-analysis'
  | 'user-research'
  | 'ai-generated'
  | 'template-based'
  | 'legacy-migration'
  | 'regulatory-requirement';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'conditional' | 'deferred';

export type ChangeImpact = 'minor' | 'moderate' | 'major' | 'breaking';

export type TechRequirementCategory = 
  | 'framework'
  | 'library'
  | 'tool'
  | 'service'
  | 'platform'
  | 'database'
  | 'infrastructure'
  | 'security'
  | 'integration'
  | 'performance'
  | 'monitoring'
  | 'testing'
  | 'deployment'
  | 'documentation';

// Additional supporting types
export type SkillLevel = 'junior' | 'mid' | 'senior' | 'lead' | 'principal';
export type SkillCategory = 'technical' | 'domain' | 'soft' | 'leadership' | 'process';
export type DeliverableType = 'document' | 'code' | 'design' | 'prototype' | 'test' | 'deployment';
export type RiskProbability = 'very-low' | 'low' | 'medium' | 'high' | 'very-high';
export type RiskImpact = 'negligible' | 'minor' | 'moderate' | 'major' | 'catastrophic' | 'low' | 'medium' | 'high';
export type MeetingType = 'standup' | 'planning' | 'review' | 'retrospective' | 'stakeholder' | 'technical';
export type ReportingSchedule = 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'milestone' | 'ad-hoc';
export type EscalationPath = 'team-lead' | 'project-manager' | 'stakeholder' | 'executive';
export type ValidationErrorType = 'missing' | 'invalid' | 'conflict' | 'incompatible' | 'deprecated' | 'security';
export type ValidationWarningType = 'suboptimal' | 'redundant' | 'unclear' | 'risky' | 'outdated' | 'invalid';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ErrorCategory = 'completeness' | 'feasibility' | 'clarity' | 'consistency' | 'security' | 'performance';
export type WarningCategory = 'best-practice' | 'optimization' | 'maintainability' | 'scalability' | 'usability';
export type ErrorImpact = 'blocks-development' | 'degrades-quality' | 'increases-risk' | 'affects-timeline';
export type WarningImpact = 'minor' | 'moderate' | 'significant';
export type RecommendationCategory = 'enhancement' | 'optimization' | 'security' | 'performance' | 'maintainability';
export type RecommendationType = 'add' | 'remove' | 'modify' | 'replace' | 'upgrade';
export type EffortLevel = 'minimal' | 'low' | 'medium' | 'high' | 'very-high';
export type ImpactLevel = 'minimal' | 'low' | 'medium' | 'high' | 'very-high';
export type FieldQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
export type CloudProvider = 'AWS' | 'Azure' | 'GCP' | 'Vercel' | 'Netlify' | 'DigitalOcean' | 'Heroku';
export type NetworkArchitecture = 'simple' | 'multi-tier' | 'mesh' | 'hub-spoke' | 'hybrid';
export type ComputeType = 'vm' | 'container' | 'serverless' | 'edge' | 'bare-metal';
export type StorageType = 'block' | 'object' | 'file' | 'database' | 'cache' | 'cdn';
export type ScanFrequency = 'continuous' | 'daily' | 'weekly' | 'monthly' | 'on-demand';
export type SecurityScanType = 'sast' | 'dast' | 'dependency' | 'container' | 'infrastructure';
export type SecurityThreshold = 'critical' | 'high' | 'medium' | 'low';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';
export type CoverageReportType = 'html' | 'json' | 'lcov' | 'cobertura' | 'clover';
export type GitWorkflow = 'feature-branch' | 'gitflow' | 'github-flow' | 'gitlab-flow' | 'trunk-based';
export type BackupStrategy = 'full' | 'incremental' | 'differential' | 'continuous';
export type BackupFrequency = 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
export type CacheStrategy = 'write-through' | 'write-back' | 'write-around' | 'refresh-ahead';
export type InvalidationStrategy = 'ttl' | 'manual' | 'event-based' | 'dependency-based';

// Complex nested types
export interface ReplicationConfig {
  type: 'master-slave' | 'master-master' | 'cluster';
  nodes: number;
  consistency: 'strong' | 'eventual' | 'weak';
  failover: boolean;
}

export interface ShardingConfig {
  strategy: 'range' | 'hash' | 'directory';
  shards: number;
  rebalancing: boolean;
}

export interface IndexingStrategy {
  type: 'btree' | 'hash' | 'gin' | 'gist' | 'full-text';
  fields: string[];
  unique: boolean;
  partial: boolean;
}

export interface DatabaseConstraint {
  type: 'primary-key' | 'foreign-key' | 'unique' | 'check' | 'not-null';
  fields: string[];
  reference?: string;
  condition?: string;
}

export interface IndexingConfig {
  fields: string[];
  analyzers: string[];
  filters: string[];
}

export interface SearchFeature {
  type: 'full-text' | 'faceted' | 'autocomplete' | 'geospatial' | 'fuzzy';
  enabled: boolean;
  configuration?: Record<string, any>;
}

export interface AnalyticsEvent {
  name: string;
  properties: string[];
  frequency: 'rare' | 'common' | 'frequent';
}

export interface CICDTrigger {
  type: 'push' | 'pull-request' | 'schedule' | 'manual' | 'webhook';
  branches?: string[];
  schedule?: string;
  condition?: string;
}

export interface CICDStage {
  name: string;
  jobs: CICDJob[];
  dependencies: string[];
  condition?: string;
}

export interface CICDJob {
  name: string;
  steps: CICDStep[];
  environment?: string;
  timeout?: number;
}

export interface CICDStep {
  name: string;
  action: string;
  parameters?: Record<string, any>;
  condition?: string;
}

export interface Environment {
  name: string;
  type: 'development' | 'staging' | 'production' | 'testing';
  url?: string;
  variables: Record<string, string>;
  secrets: string[];
  protection?: EnvironmentProtection;
}

export interface EnvironmentProtection {
  reviewers: string[];
  branches: string[];
  deploymentTimeout: number;
}

export interface CustomMetric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labels: string[];
  threshold?: MetricThreshold;
}

export interface MetricThreshold {
  warning: number;
  critical: number;
  comparison: 'greater' | 'less' | 'equal';
}

export interface SLAConfig {
  name: string;
  target: number;
  measurement: string;
  timeWindow: string;
  consequences: string[];
}

export interface AlertChannel {
  type: 'email' | 'slack' | 'pagerduty' | 'webhook' | 'sms';
  configuration: Record<string, any>;
  severity: Severity[];
}

export interface AlertRule {
  name: string;
  condition: string;
  threshold: number;
  duration: string;
  severity: Severity;
  channels: string[];
}

export interface EscalationPolicy {
  level: number;
  delay: number;
  targets: string[];
  actions: string[];
}

export interface HealthCheckEndpoint {
  path: string;
  method: string;
  expectedStatus: number;
  expectedBody?: string;
  headers?: Record<string, string>;
}

export interface RetentionPolicy {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

export interface ScalingTrigger {
  metric: string;
  threshold: number;
  comparison: 'greater' | 'less';
  duration: number;
}

export interface ScalingLimits {
  min: number;
  max: number;
  stepSize: number;
}

export interface GitHook {
  type: 'pre-commit' | 'pre-push' | 'post-commit' | 'post-receive';
  script: string;
  enabled: boolean;
}

export interface BranchProtection {
  branch: string;
  requiredReviews: number;
  requireCodeOwnerReview: boolean;
  dismissStaleReviews: boolean;
  requireStatusChecks: boolean;
  requiredChecks: string[];
  restrictPushes: boolean;
  allowedPushers: string[];
}

export interface CloudService {
  name: string;
  type: 'compute' | 'storage' | 'database' | 'networking' | 'security' | 'ai-ml';
  tier: 'free' | 'basic' | 'standard' | 'premium';
  region: string[];
  backup: boolean;
}

export interface CostManagement {
  budgets: Budget[];
  alerts: CostAlert[];
  optimization: CostOptimization[];
  monitoring: boolean;
}

export interface Budget {
  name: string;
  amount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  scope: string[];
  alerts: number[];
}

export interface CostAlert {
  threshold: number;
  type: 'actual' | 'forecast';
  recipients: string[];
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface CostOptimization {
  type: 'rightsizing' | 'scheduling' | 'reserved-instances' | 'spot-instances';
  enabled: boolean;
  schedule?: string;
}

export interface NetworkSecurity {
  type: 'firewall' | 'waf' | 'ddos-protection' | 'ssl-termination';
  configuration: Record<string, any>;
}

export interface LoadBalancerConfig {
  type: 'application' | 'network' | 'classic';
  algorithm: 'round-robin' | 'least-connections' | 'ip-hash';
  healthCheck: HealthCheckConfig;
  ssl: boolean;
}

export interface CDNConfig {
  provider: string;
  caching: CDNCachingConfig;
  compression: boolean;
  security: CDNSecurity;
}

export interface CDNCachingConfig {
  rules: CacheRule[];
  ttl: number;
  purging: PurgingConfig;
}

export interface CacheRule {
  path: string;
  ttl: number;
  headers: string[];
}

export interface PurgingConfig {
  automatic: boolean;
  manual: boolean;
  webhook: boolean;
}

export interface CDNSecurity {
  waf: boolean;
  ddos: boolean;
  bot: boolean;
  geo: boolean;
}

export interface AuthConfig {
  type: 'jwt' | 'oauth2' | 'saml' | 'ldap' | 'social';
  provider?: string;
  configuration: Record<string, any>;
  mfa: boolean;
}

export interface AuthzConfig {
  model: 'rbac' | 'abac' | 'acl' | 'pbac';
  rules: AuthzRule[];
  inheritance: boolean;
}

export interface AuthzRule {
  subject: string;
  action: string;
  resource: string;
  condition?: string;
}

export interface EncryptionConfig {
  atRest: boolean;
  inTransit: boolean;
  algorithms: string[];
  keyManagement: KeyManagementConfig;
}

export interface KeyManagementConfig {
  provider: string;
  rotation: boolean;
  rotationPeriod: number;
  backup: boolean;
}

export interface ComplianceConfig {
  standard: 'gdpr' | 'hipaa' | 'pci-dss' | 'sox' | 'iso-27001';
  controls: ComplianceControl[];
  auditing: boolean;
  reporting: boolean;
}

export interface ComplianceControl {
  id: string;
  description: string;
  implemented: boolean;
  evidence: string[];
}

export interface FirewallConfig {
  type: 'network' | 'application' | 'next-generation';
  rules: FirewallRule[];
  logging: boolean;
  monitoring: boolean;
}

export interface FirewallRule {
  name: string;
  action: 'allow' | 'deny' | 'log';
  source: string[];
  destination: string[];
  ports: number[];
  protocols: string[];
}

export interface ComputeScaling {
  type: 'auto' | 'manual' | 'scheduled';
  triggers: ComputeScalingTrigger[];
  limits: ComputeScalingLimits;
}

export interface ComputeScalingTrigger {
  metric: 'cpu' | 'memory' | 'network' | 'custom';
  threshold: number;
  duration: number;
  action: 'scale-up' | 'scale-down';
}

export interface ComputeScalingLimits {
  minInstances: number;
  maxInstances: number;
  cooldown: number;
}

export interface ComputeOptimization {
  type: 'performance' | 'cost' | 'availability';
  techniques: string[];
  monitoring: boolean;
}

export interface PhaseDependency {
  from: string;
  to: string;
  type: 'finish-start' | 'start-start' | 'finish-finish' | 'start-finish';
  lag?: number;
}

export interface TechConflict {
  component1: string;
  component2: string;
  severity: Severity;
  description: string;
  resolution: string[];
}

export interface TechGap {
  category: string;
  missing: string[];
  impact: ImpactLevel;
  alternatives: string[];
}

export interface TechOptimization {
  category: string;
  current: string;
  recommended: string;
  benefit: string;
  effort: EffortLevel;
}

export interface ArchitectureConcern {
  aspect: string;
  issue: string;
  severity: Severity;
  mitigation: string[];
}

export interface SkillGap {
  skill: string;
  currentLevel: SkillLevel;
  requiredLevel: SkillLevel;
  gap: number;
  trainingOptions: string[];
}

export interface ResourceOverallocation {
  resource: string;
  allocated: number;
  capacity: number;
  overallocation: number;
  recommendations: string[];
}

export interface TeamRecommendation {
  type: 'hiring' | 'training' | 'reallocation' | 'outsourcing';
  description: string;
  urgency: Priority;
  cost: number;
}

export interface TimelineRisk {
  phase: string;
  risk: string;
  probability: RiskProbability;
  impact: number; // days
  mitigation: string[];
}

export interface TimelineOptimization {
  type: 'parallel' | 'fast-track' | 'resource' | 'scope';
  description: string;
  timeSaving: number; // days
  cost: number;
  risk: RiskImpact;
}

export interface Alternative {
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  effort: EffortLevel;
  risk: RiskImpact;
}

export interface ImplementationGuide {
  steps: ImplementationStep[];
  prerequisites: string[];
  dependencies: string[];
  timeline: number; // days
  resources: string[];
}

export interface ImplementationStep {
  order: number;
  title: string;
  description: string;
  duration: number; // hours
  dependencies: number[];
  deliverables: string[];
}

export interface AutoFix {
  applicable: boolean;
  description: string;
  commands: string[];
  risk: RiskImpact;
  backup: boolean;
}