/**
 * Unified Project Wizard Types
 * 
 * Complete TypeScript interfaces for the unified project creation wizard
 * that orchestrates requirements generation, database setup, GitHub integration,
 * and protection systems into one seamless experience.
 */

import { Requirements } from '../requirements/types';
import { DatabaseCredentials, DatabaseProvider, WizardResult as DatabaseWizardResult } from '../database/types';
import { GitHubRepository, CreateRepositoryOptions, BranchProtectionOptions } from '../github/types';
import { ProtectionConfig } from '../protection/types';

// Re-export common types
export { DatabaseProvider };

// Core wizard types
export interface WizardStep {
  id: string;
  name: string;
  description: string;
  required: boolean;
  completed: boolean;
  skipped: boolean;
  order: number;
  estimatedTime: number; // in minutes
  dependencies: string[];
}

export interface WizardProgress {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  skippedSteps: number;
  overallProgress: number; // 0-100
  estimatedTimeRemaining: number; // in minutes
  startTime: Date;
  errors: WizardError[];
}

export interface WizardError {
  id: string;
  step: string;
  type: 'warning' | 'error' | 'critical';
  message: string;
  details?: any;
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
}

// User preferences and configuration
export interface UserPreferences {
  // General preferences
  preferredLanguages: string[];
  preferredFrameworks: string[];
  defaultProjectType: string;
  alwaysUseGit: boolean;
  preferPrivateRepos: boolean;
  
  // Database preferences
  preferredDatabase: DatabaseProvider;
  alwaysSetupDatabase: boolean;
  preferLocalDatabase: boolean;
  
  // Protection preferences
  alwaysEnableProtection: boolean;
  autoCommitFrequency: number;
  securityLevel: 'basic' | 'standard' | 'strict';
  
  // UI preferences
  useColorOutput: boolean;
  showProgressBars: boolean;
  verboseOutput: boolean;
  confirmDestructiveActions: boolean;
  
  // Saved configurations
  savedConfigurations: SavedConfiguration[];
  lastUsedConfiguration?: string;
  
  // Skip options
  skipRequirementsGeneration: boolean;
  skipDatabaseSetup: boolean;
  skipGitHubSetup: boolean;
  skipProtectionSetup: boolean;
  
  metadata: {
    version: string;
    createdAt: Date;
    updatedAt: Date;
    totalWizardRuns: number;
    successfulRuns: number;
  };
}

export interface SavedConfiguration {
  id: string;
  name: string;
  description?: string;
  projectType: string;
  template: ProjectTemplate;
  createdAt: Date;
  usageCount: number;
  lastUsed: Date;
}

// Project templates and configuration
export interface ProjectTemplate {
  name: string;
  description: string;
  category: ProjectCategory;
  techStack: TechStackTemplate;
  features: string[];
  requirements: Partial<Requirements>;
  databaseConfig?: DatabaseTemplateConfig;
  githubConfig?: GitHubTemplateConfig;
  protectionConfig?: ProtectionTemplateConfig;
  estimatedTime: number;
  complexity: 'simple' | 'moderate' | 'complex';
  tags: string[];
}

export interface TechStackTemplate {
  frontend?: {
    framework: string;
    version?: string;
    packages: string[];
  };
  backend?: {
    framework: string;
    runtime: string;
    packages: string[];
  };
  database?: {
    type: DatabaseProvider;
    orm?: string;
  };
  tools: string[];
}

export interface DatabaseTemplateConfig {
  required: boolean;
  provider?: DatabaseProvider;
  setupType: 'local' | 'cloud' | 'both';
  generateTypes: boolean;
  seedData: boolean;
}

export interface GitHubTemplateConfig {
  required: boolean;
  private: boolean;
  enableProtection: boolean;
  setupWorkflows: boolean;
  addReadme: boolean;
}

export interface ProtectionTemplateConfig {
  required: boolean;
  autoCommit: boolean;
  securityMonitoring: boolean;
  backups: boolean;
  reporting: boolean;
}

// Wizard configuration and options
export interface WizardOptions {
  projectName: string;
  projectPath: string;
  template?: string;
  interactive: boolean;
  skipSteps: string[];
  overridePreferences: Partial<UserPreferences>;
  dryRun: boolean;
  verbose: boolean;
  autoConfirm: boolean;
  continueOnError: boolean;
  maxRetries: number;
  timeout: number; // in minutes
}

export interface WizardContext {
  options: WizardOptions;
  preferences: UserPreferences;
  progress: WizardProgress;
  currentStep: WizardStep;
  results: WizardStepResults;
  errors: WizardError[];
  warnings: string[];
  startTime: Date;
  workingDirectory: string;
  tempFiles: string[];
}

// Results from each wizard step
export interface WizardStepResults {
  requirements?: Requirements;
  database?: DatabaseWizardResult;
  github?: GitHubSetupResult;
  protection?: ProtectionSetupResult;
  summary?: ProjectSummaryResult;
}

export interface GitHubSetupResult {
  success: boolean;
  repository?: GitHubRepository;
  cloneUrl?: string;
  sshUrl?: string;
  protectionEnabled: boolean;
  workflowsCreated: string[];
  secretsUploaded: string[];
  error?: string;
}

export interface ProtectionSetupResult {
  success: boolean;
  config?: ProtectionConfig;
  servicesStarted: string[];
  backupConfigured: boolean;
  monitoringEnabled: boolean;
  error?: string;
}

export interface ProjectSummaryResult {
  success: boolean;
  summaryFile?: string;
  markdownReport?: string;
  nextSteps: string[];
  recommendations: string[];
  estimatedTimeline?: ProjectTimeline;
}

export interface ProjectTimeline {
  totalDuration: number; // in days
  phases: TimelinePhase[];
  criticalPath: string[];
  milestones: TimelineMilestone[];
}

export interface TimelinePhase {
  name: string;
  duration: number;
  startDate: Date;
  endDate: Date;
  tasks: string[];
  dependencies: string[];
}

export interface TimelineMilestone {
  name: string;
  date: Date;
  description: string;
  deliverables: string[];
}

// UI and interaction types
export interface UITheme {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  dim: string;
  bold: string;
  underline: string;
}

export interface ProgressBarOptions {
  total: number;
  current: number;
  width: number;
  label?: string;
  showPercentage: boolean;
  showEta: boolean;
  showElapsed: boolean;
  theme: UITheme;
}

export interface TableColumn {
  key: string;
  label: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  formatter?: (value: any) => string;
}

export interface TableOptions {
  columns: TableColumn[];
  data: Record<string, any>[];
  theme: UITheme;
  borders: boolean;
  padding: number;
  maxWidth?: number;
}

export interface PromptOptions {
  type: 'input' | 'select' | 'multiselect' | 'confirm' | 'password';
  message: string;
  choices?: PromptChoice[];
  default?: any;
  validation?: (value: any) => boolean | string;
  required?: boolean;
  theme: UITheme;
}

export interface PromptChoice {
  name: string;
  value: any;
  description?: string;
  disabled?: boolean | string;
  selected?: boolean;
}

// Setup flow types
export interface SetupFlow {
  id: string;
  name: string;
  description: string;
  steps: WizardStep[];
  prerequisites: string[];
  estimatedTime: number;
  complexity: 'simple' | 'moderate' | 'complex';
}

export interface FlowExecution {
  flow: SetupFlow;
  context: WizardContext;
  currentStepIndex: number;
  results: Map<string, any>;
  errors: WizardError[];
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
}

// Integration types
export interface IntegrationStatus {
  name: string;
  status: 'available' | 'configured' | 'error' | 'disabled';
  version?: string;
  lastChecked: Date;
  error?: string;
  dependencies: string[];
  requiredFor: string[];
}

export interface SystemRequirements {
  node: {
    minimum: string;
    recommended: string;
  };
  git: {
    required: boolean;
    minimum: string;
  };
  tools: {
    name: string;
    required: boolean;
    installCommand?: string;
    checkCommand: string;
  }[];
  permissions: {
    fileSystem: boolean;
    network: boolean;
    git: boolean;
  };
}

// Validation and error handling
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
  fixable: boolean;
  fix?: string;
}

export interface ValidationWarning {
  message: string;
  code: string;
  ignorable: boolean;
  impact: string;
}

// Event system for the wizard
export interface WizardEvent {
  type: WizardEventType;
  timestamp: Date;
  step?: string;
  data: any;
}

export type WizardEventType = 
  | 'wizard_started'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'step_skipped'
  | 'user_input'
  | 'validation_failed'
  | 'error_occurred'
  | 'wizard_completed'
  | 'wizard_cancelled'
  | 'preferences_updated'
  | 'configuration_saved';

export interface EventHandler {
  handle(event: WizardEvent): Promise<void>;
}

// Analytics and reporting
export interface WizardAnalytics {
  sessionId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  projectType: string;
  template?: string;
  stepsCompleted: string[];
  stepsSkipped: string[];
  errorsEncountered: WizardError[];
  userChoices: Record<string, any>;
  performance: {
    totalTime: number;
    stepTimes: Record<string, number>;
    memoryUsage: number;
    networkRequests: number;
  };
  outcome: 'completed' | 'failed' | 'cancelled';
  rating?: number;
  feedback?: string;
}

export interface UsageStatistics {
  totalRuns: number;
  successRate: number;
  averageDuration: number;
  popularTemplates: Record<string, number>;
  commonErrors: Record<string, number>;
  stepSuccessRates: Record<string, number>;
  userSatisfaction: {
    averageRating: number;
    totalResponses: number;
    commonFeedback: string[];
  };
  trends: {
    runsPerWeek: number[];
    successRateOverTime: number[];
    errorFrequency: number[];
  };
}

// Plugin system
export interface WizardPlugin {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  
  // Lifecycle hooks
  initialize?(context: WizardContext): Promise<void>;
  beforeStep?(step: WizardStep, context: WizardContext): Promise<void>;
  afterStep?(step: WizardStep, result: any, context: WizardContext): Promise<void>;
  onError?(error: WizardError, context: WizardContext): Promise<void>;
  cleanup?(context: WizardContext): Promise<void>;
  
  // Custom steps
  customSteps?: CustomStepDefinition[];
  
  // UI customization
  customTemplates?: Record<string, ProjectTemplate>;
  customThemes?: Record<string, UITheme>;
}

export interface CustomStepDefinition {
  id: string;
  name: string;
  description: string;
  required: boolean;
  order: number;
  execute(context: WizardContext): Promise<any>;
  validate?(result: any): Promise<ValidationResult>;
  rollback?(result: any, context: WizardContext): Promise<void>;
}

// Configuration management
export interface WizardConfiguration {
  version: string;
  defaults: {
    theme: string;
    templates: ProjectTemplate[];
    plugins: string[];
    preferences: Partial<UserPreferences>;
  };
  features: {
    requirementsGeneration: boolean;
    databaseIntegration: boolean;
    githubIntegration: boolean;
    protectionSystem: boolean;
    analytics: boolean;
    plugins: boolean;
  };
  limits: {
    maxProjectNameLength: number;
    maxStepRetries: number;
    maxExecutionTime: number;
    maxTemplateSize: number;
    maxPlugins: number;
  };
  security: {
    validateInputs: boolean;
    sanitizeUserInput: boolean;
    allowRemoteTemplates: boolean;
    allowCustomPlugins: boolean;
    encryptPreferences: boolean;
  };
  integrations: {
    github: {
      enabled: boolean;
      apiUrl: string;
      timeout: number;
    };
    database: {
      enabled: boolean;
      supportedProviders: DatabaseProvider[];
      defaultProvider: DatabaseProvider;
    };
    protection: {
      enabled: boolean;
      defaultConfig: Partial<ProtectionConfig>;
    };
  };
}

// Project categories for organization
export type ProjectCategory = 
  | 'web-application'
  | 'mobile-application'
  | 'api-service'
  | 'cli-tool'
  | 'library'
  | 'data-pipeline'
  | 'ai-ml-project'
  | 'game'
  | 'desktop-application'
  | 'extension'
  | 'microservice'
  | 'full-stack'
  | 'frontend-only'
  | 'backend-only';

// Final wizard result
export interface UnifiedWizardResult {
  success: boolean;
  sessionId: string;
  projectName: string;
  projectPath: string;
  template?: string;
  
  // Step results
  requirements?: Requirements;
  database?: DatabaseWizardResult;
  github?: GitHubSetupResult;
  protection?: ProtectionSetupResult;
  
  // Generated files and configurations
  generatedFiles: string[];
  configurationFiles: string[];
  documentationFiles: string[];
  
  // Summary and next steps
  summary: ProjectSummaryResult;
  nextSteps: string[];
  recommendations: string[];
  timeline?: ProjectTimeline;
  
  // Metadata
  duration: number;
  stepResults: Map<string, any>;
  errors: WizardError[];
  warnings: string[];
  analytics: WizardAnalytics;
  
  // Cleanup information
  tempFiles: string[];
  rollbackInstructions?: string[];
}

// Error types
export class WizardConfigurationError extends Error {
  constructor(message: string, public code: string, public details?: any) {
    super(message);
    this.name = 'WizardConfigurationError';
  }
}

export class WizardExecutionError extends Error {
  constructor(message: string, public step: string, public code: string, public details?: any) {
    super(message);
    this.name = 'WizardExecutionError';
  }
}

export class WizardValidationError extends Error {
  constructor(message: string, public validationErrors: ValidationError[]) {
    super(message);
    this.name = 'WizardValidationError';
  }
}

export class WizardTimeoutError extends Error {
  constructor(message: string, public step: string, public timeout: number) {
    super(message);
    this.name = 'WizardTimeoutError';
  }
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Constants and defaults
export const DEFAULT_WIZARD_TIMEOUT = 60; // minutes
export const DEFAULT_MAX_RETRIES = 3;
export const DEFAULT_PROGRESS_WIDTH = 50;

export const WIZARD_STEPS = {
  INITIALIZATION: 'initialization',
  REQUIREMENTS: 'requirements',
  DATABASE: 'database',
  GITHUB: 'github',
  PROTECTION: 'protection',
  SUMMARY: 'summary',
  FINALIZATION: 'finalization'
} as const;

export const WIZARD_THEMES = {
  DEFAULT: 'default',
  DARK: 'dark',
  LIGHT: 'light',
  COLORFUL: 'colorful',
  MINIMAL: 'minimal'
} as const;