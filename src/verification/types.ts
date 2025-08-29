/**
 * Agent Claim Verification System - Types and Interfaces
 * Comprehensive type definitions for tracking and validating agent claims
 */

import { HallucinationIssue } from '../validation/HallucinationDetector';

export type ClaimType = 
  | 'performance' 
  | 'bug_fix' 
  | 'feature_completion' 
  | 'token_reduction' 
  | 'speed_improvement' 
  | 'quality_enhancement' 
  | 'security_fix' 
  | 'code_optimization' 
  | 'test_coverage' 
  | 'dependency_update'
  | 'configuration_change';

export type ClaimStatus = 
  | 'pending'      // Claim made but not yet tested
  | 'testing'      // Actively being validated
  | 'verified'     // Claim confirmed as accurate
  | 'debunked'     // Claim proven false
  | 'partial'      // Claim partially true
  | 'inconclusive' // Cannot be definitively verified
  | 'retesting';   // Re-validating after initial failure

export type ValidationMethod = 
  | 'automated_test' 
  | 'performance_benchmark' 
  | 'code_analysis' 
  | 'file_comparison' 
  | 'execution_test' 
  | 'integration_test' 
  | 'security_scan' 
  | 'coverage_analysis'
  | 'manual_inspection';

export interface AgentClaim {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: Date;
  claimType: ClaimType;
  description: string;
  specificClaims: SpecificClaim[];
  context: ClaimContext;
  status: ClaimStatus;
  confidence: number; // 0-100
  evidence: ClaimEvidence[];
  validation?: ClaimValidation;
}

export interface SpecificClaim {
  id: string;
  type: 'metric' | 'binary' | 'qualitative' | 'quantitative';
  description: string;
  claimedValue?: number | string | boolean;
  actualValue?: number | string | boolean;
  unit?: string;
  tolerance?: number; // For numeric comparisons
  verified: boolean;
  accuracy?: number; // 0-100, how accurate was the claim
}

export interface ClaimContext {
  projectId?: string;
  taskId?: string;
  phase?: number;
  files: string[];
  dependencies: string[];
  environment: {
    nodeVersion?: string;
    platform?: string;
    timestamp: Date;
  };
  beforeSnapshot?: SystemSnapshot;
  afterSnapshot?: SystemSnapshot;
}

export interface SystemSnapshot {
  timestamp: Date;
  files: FileSnapshot[];
  dependencies: DependencySnapshot[];
  performance: PerformanceSnapshot;
  security: SecuritySnapshot;
  tests: TestSnapshot;
}

export interface FileSnapshot {
  path: string;
  size: number;
  checksum: string;
  lastModified: Date;
  lineCount: number;
  complexity?: number;
}

export interface DependencySnapshot {
  name: string;
  version: string;
  dev: boolean;
  vulnerabilities: number;
  size: number;
}

export interface PerformanceSnapshot {
  tokenUsage: number;
  executionTime: number;
  memoryUsage: number;
  cpuUsage: number;
  buildTime?: number;
  testTime?: number;
  bundleSize?: number;
}

export interface SecuritySnapshot {
  vulnerabilities: SecurityVulnerability[];
  score: number; // 0-100
  lastScan: Date;
}

export interface SecurityVulnerability {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  affected: string[];
}

export interface TestSnapshot {
  total: number;
  passed: number;
  failed: number;
  coverage: number;
  duration: number;
  newTests: number;
  modifiedTests: number;
}

export interface ClaimEvidence {
  id: string;
  type: 'terminal_output' | 'file_change' | 'test_result' | 'benchmark' | 'screenshot' | 'log_entry';
  source: string;
  content: string;
  timestamp: Date;
  relevance: number; // 0-100
  credibility: number; // 0-100
}

export interface ClaimValidation {
  validationId: string;
  startTime: Date;
  endTime?: Date;
  methods: ValidationMethod[];
  tests: ValidationTest[];
  overallResult: ValidationResult;
  confidence: number; // 0-100
  discrepancies: ClaimDiscrepancy[];
  recommendations: string[];
  retestRequired: boolean;
}

export interface ValidationTest {
  id: string;
  method: ValidationMethod;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime: Date;
  endTime?: Date;
  result?: ValidationResult;
  evidence: TestEvidence[];
  error?: string;
}

export interface TestEvidence {
  type: 'output' | 'metric' | 'file' | 'screenshot' | 'log';
  content: any;
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface ValidationResult {
  passed: boolean;
  score: number; // 0-100
  actualValues: Record<string, any>;
  expectedValues: Record<string, any>;
  deviations: Deviation[];
  issues: ValidationIssue[];
}

export interface Deviation {
  field: string;
  expected: any;
  actual: any;
  deviation: number; // Percentage or absolute difference
  significant: boolean;
  explanation?: string;
}

export interface ValidationIssue extends HallucinationIssue {
  claimId: string;
  testId?: string;
  autoFixable: boolean;
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface ClaimDiscrepancy {
  id: string;
  claimId: string;
  specificClaimId: string;
  type: 'value_mismatch' | 'missing_evidence' | 'contradictory_evidence' | 'insufficient_improvement' | 'regression';
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  description: string;
  expected: any;
  actual: any;
  impact: string;
  suggestedFix?: string;
  requiresRework: boolean;
}

export interface AgentTrustScore {
  agentId: string;
  agentName: string;
  overallScore: number; // 0-100
  totalClaims: number;
  verifiedClaims: number;
  debunkedClaims: number;
  accuracyRate: number; // 0-100
  consistency: number; // 0-100
  reliability: number; // 0-100
  history: TrustScoreHistory[];
  penalties: TrustPenalty[];
  badges: TrustBadge[];
}

export interface TrustScoreHistory {
  timestamp: Date;
  score: number;
  event: 'claim_verified' | 'claim_debunked' | 'penalty_applied' | 'badge_earned' | 'manual_adjustment';
  details: string;
}

export interface TrustPenalty {
  id: string;
  type: 'false_claim' | 'exaggerated_improvement' | 'missing_implementation' | 'inconsistent_reporting';
  severity: 'minor' | 'moderate' | 'major' | 'severe';
  points: number;
  description: string;
  timestamp: Date;
  duration: number; // in days, 0 = permanent
  active: boolean;
}

export interface TrustBadge {
  id: string;
  name: string;
  description: string;
  criteria: string;
  earnedDate: Date;
  icon: string;
  color: string;
}

export interface VerificationReport {
  reportId: string;
  timestamp: Date;
  period: {
    start: Date;
    end: Date;
  };
  summary: {
    totalClaims: number;
    verifiedClaims: number;
    debunkedClaims: number;
    pendingClaims: number;
    overallAccuracy: number;
    averageValidationTime: number;
  };
  agentPerformance: AgentVerificationSummary[];
  claimTypes: ClaimTypeSummary[];
  trends: VerificationTrend[];
  issues: SystemIssue[];
  recommendations: ReportRecommendation[];
}

export interface AgentVerificationSummary {
  agentId: string;
  agentName: string;
  totalClaims: number;
  accuracyRate: number;
  averageConfidence: number;
  trustScore: number;
  strongestArea: ClaimType;
  weakestArea: ClaimType;
  improvement: number; // Change since last period
}

export interface ClaimTypeSummary {
  type: ClaimType;
  totalClaims: number;
  verificationRate: number;
  averageAccuracy: number;
  commonIssues: string[];
}

export interface VerificationTrend {
  metric: string;
  direction: 'improving' | 'declining' | 'stable';
  change: number;
  significance: 'minor' | 'moderate' | 'major';
  timeframe: string;
}

export interface SystemIssue {
  id: string;
  type: 'systematic_error' | 'agent_pattern' | 'validation_gap' | 'infrastructure_problem';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedAgents: string[];
  firstDetected: Date;
  frequency: number;
  suggestedFix: string;
}

export interface ReportRecommendation {
  id: string;
  type: 'agent_training' | 'system_improvement' | 'process_change' | 'tool_enhancement';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  expectedImpact: string;
  estimatedEffort: string;
  affectedAgents?: string[];
}

export interface ValidationConfig {
  enabled: boolean;
  strictMode: boolean; // Fail on any discrepancy vs. allow minor deviations
  timeouts: {
    testExecution: number;
    overallValidation: number;
  };
  tolerances: {
    performance: number; // % tolerance for performance claims
    coverage: number; // % tolerance for test coverage claims
    size: number; // % tolerance for file size claims
  };
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  notifications: {
    onClaimDebunked: boolean;
    onSystemIssue: boolean;
    onTrustScoreChanged: boolean;
  };
  archival: {
    retentionDays: number;
    compressionAfterDays: number;
  };
}

export interface ClaimMetrics {
  totalClaims: number;
  verifiedClaims: number;
  debunkedClaims: number;
  pendingClaims: number;
  averageValidationTime: number;
  overallAccuracy: number;
  claimsByType: Map<ClaimType, number>;
  claimsByAgent: Map<string, number>;
  accuracyByType: Map<ClaimType, number>;
  accuracyByAgent: Map<string, number>;
  trendData: Map<string, number[]>;
}

// Event types for the verification system
export interface ClaimVerificationEvents {
  'claim-extracted': (claim: AgentClaim) => void;
  'validation-started': (claimId: string, validation: ClaimValidation) => void;
  'validation-completed': (claimId: string, result: ValidationResult) => void;
  'claim-verified': (claim: AgentClaim) => void;
  'claim-debunked': (claim: AgentClaim, discrepancies: ClaimDiscrepancy[]) => void;
  'trust-score-updated': (agentId: string, oldScore: number, newScore: number) => void;
  'system-issue-detected': (issue: SystemIssue) => void;
  'rework-required': (claimId: string, requirements: string[]) => void;
}

export type ClaimValidationCallback = (claim: AgentClaim, result: ValidationResult) => Promise<void>;
export type TrustScoreCallback = (agentId: string, score: AgentTrustScore) => Promise<void>;