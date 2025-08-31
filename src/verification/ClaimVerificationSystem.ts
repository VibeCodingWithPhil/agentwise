/**
 * Claim Verification System - Main orchestrator for agent claim verification
 * Automatically validates all claims made by agents and ensures 100% accuracy
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import {
  AgentClaim,
  ClaimValidation,
  AgentTrustScore,
  VerificationReport,
  ValidationConfig,
  ClaimMetrics,
  ClaimVerificationEvents,
  ClaimDiscrepancy,
  TrustPenalty,
  SystemIssue,
  ReportRecommendation
} from './types';
import ClaimTracker from './ClaimTracker';
import ClaimDebunker from './ClaimDebunker';
import PerformanceValidator from './PerformanceValidator';

export class ClaimVerificationSystem extends EventEmitter {
  private claimTracker: ClaimTracker;
  private claimDebunker: ClaimDebunker;
  private performanceValidator: PerformanceValidator;
  private agentTrustScores: Map<string, AgentTrustScore> = new Map();
  private systemIssues: Map<string, SystemIssue> = new Map();
  private verificationReports: VerificationReport[] = [];
  private config: ValidationConfig;
  private projectPath: string;
  private verificationInterval: NodeJS.Timeout | null = null;
  private reportInterval: NodeJS.Timeout | null = null;

  constructor(projectPath?: string, config?: Partial<ValidationConfig>) {
    super();
    
    this.projectPath = projectPath || process.cwd();
    this.config = this.mergeConfig(config);
    
    // Initialize components
    this.claimTracker = new ClaimTracker(this.projectPath);
    this.claimDebunker = new ClaimDebunker(this.projectPath);
    this.performanceValidator = new PerformanceValidator(this.projectPath);
    
    this.setupEventHandlers();
    this.loadTrustScores();
    
    if (this.config.enabled) {
      this.startVerificationProcess();
    }
    
    console.log('🔍 Agent Claim Verification System initialized');
  }

  /**
   * Merge configuration with defaults
   */
  private mergeConfig(config?: Partial<ValidationConfig>): ValidationConfig {
    const defaults: ValidationConfig = {
      enabled: true,
      strictMode: false,
      timeouts: {
        testExecution: 60000, // 1 minute
        overallValidation: 300000 // 5 minutes
      },
      tolerances: {
        performance: 10, // 10% tolerance
        coverage: 5, // 5% tolerance
        size: 15 // 15% tolerance
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 1000
      },
      notifications: {
        onClaimDebunked: true,
        onSystemIssue: true,
        onTrustScoreChanged: true
      },
      archival: {
        retentionDays: 90,
        compressionAfterDays: 30
      }
    };

    return { ...defaults, ...config };
  }

  /**
   * Setup event handlers for inter-component communication
   */
  private setupEventHandlers(): void {
    // Claim tracker events
    this.claimTracker.on('claim-extracted', this.onClaimExtracted.bind(this));
    
    // Claim debunker events
    this.claimDebunker.on('claim-verified', this.onClaimVerified.bind(this));
    this.claimDebunker.on('claim-debunked', this.onClaimDebunked.bind(this));
    this.claimDebunker.on('validation-completed', this.onValidationCompleted.bind(this));
    
    // Internal event forwarding
    this.on('trust-score-updated', this.onTrustScoreUpdated.bind(this));
    this.on('system-issue-detected', this.onSystemIssueDetected.bind(this));
  }

  /**
   * Start the verification process
   */
  private startVerificationProcess(): void {
    // Periodic verification of pending claims
    this.verificationInterval = setInterval(() => {
      this.verifyPendingClaims();
    }, 30000); // Every 30 seconds

    // Periodic report generation
    this.reportInterval = setInterval(() => {
      this.generatePeriodicReport();
    }, 3600000); // Every hour

    console.log('⚡ Claim verification process started');
  }

  /**
   * Stop the verification process
   */
  stopVerificationProcess(): void {
    if (this.verificationInterval) {
      clearInterval(this.verificationInterval);
      this.verificationInterval = null;
    }

    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }

    console.log('⏹️  Claim verification process stopped');
  }

  /**
   * Extract claims from agent response
   */
  async extractClaims(
    agentId: string,
    agentName: string,
    responseText: string,
    context: any = {}
  ): Promise<AgentClaim[]> {
    try {
      const claims = await this.claimTracker.extractClaims(agentId, agentName, responseText, context);
      
      console.log(`📝 Extracted ${claims.length} claims from ${agentName}`);
      
      // Queue claims for verification if auto-verification is enabled
      if (this.config.enabled) {
        for (const claim of claims) {
          setTimeout(() => this.verifyClaim(claim.id), 1000); // Delay to allow context to settle
        }
      }
      
      return claims;
    } catch (error: any) {
      console.error('Error extracting claims:', error);
      this.emit('system-issue-detected', {
        id: crypto.randomUUID(),
        type: 'systematic_error',
        severity: 'medium',
        description: `Claim extraction failed for ${agentName}: ${error.message}`,
        affectedAgents: [agentId],
        firstDetected: new Date(),
        frequency: 1,
        suggestedFix: 'Check agent response format and claim extraction patterns'
      } as SystemIssue);
      
      return [];
    }
  }

  /**
   * Verify a specific claim
   */
  async verifyClaim(claimId: string): Promise<ClaimValidation | null> {
    const claim = this.claimTracker.getClaim(claimId);
    if (!claim) {
      console.error(`Claim ${claimId} not found`);
      return null;
    }

    if (claim.status === 'testing' || claim.status === 'verified' || claim.status === 'debunked') {
      return this.claimDebunker.getValidationResult(claimId) || null;
    }

    try {
      // Update claim status
      await this.claimTracker.updateClaimStatus(claimId, 'testing');
      
      console.log(`🔬 Verifying claim: ${claim.description.substring(0, 50)}...`);
      
      // Run verification with timeout
      const validation = await this.runWithTimeout(
        () => this.claimDebunker.debunkClaim(claim),
        this.config.timeouts.overallValidation,
        'Claim verification timed out'
      );
      
      // Update claim status based on result
      const newStatus = validation.overallResult.passed ? 'verified' : 'debunked';
      await this.claimTracker.updateClaimStatus(claimId, newStatus);
      
      // Handle retries for failed validations
      if (!validation.overallResult.passed && validation.retestRequired) {
        this.scheduleRetest(claim, validation);
      }
      
      return validation;
      
    } catch (error: any) {
      console.error(`Claim verification failed for ${claimId}:`, error);
      
      await this.claimTracker.updateClaimStatus(claimId, 'inconclusive');
      
      this.emit('system-issue-detected', {
        id: crypto.randomUUID(),
        type: 'validation_gap',
        severity: 'high',
        description: `Verification failed for claim ${claimId}: ${error.message}`,
        affectedAgents: [claim.agentId],
        firstDetected: new Date(),
        frequency: 1,
        suggestedFix: 'Review validation process and agent claim format'
      } as SystemIssue);
      
      return null;
    }
  }

  /**
   * Schedule a retest for failed claim
   */
  private scheduleRetest(claim: AgentClaim, validation: ClaimValidation): void {
    const retryCount = (claim as any)._retryCount || 0;
    
    if (retryCount >= this.config.retryPolicy.maxRetries) {
      console.log(`⚠️  Max retries reached for claim ${claim.id}, marking as debunked`);
      this.emit('rework-required', claim.id, validation.recommendations);
      return;
    }
    
    const delay = this.config.retryPolicy.initialDelay * Math.pow(this.config.retryPolicy.backoffMultiplier, retryCount);
    
    setTimeout(async () => {
      console.log(`🔄 Retesting claim ${claim.id} (attempt ${retryCount + 1})`);
      (claim as any)._retryCount = retryCount + 1;
      await this.claimTracker.updateClaimStatus(claim.id, 'retesting');
      await this.verifyClaim(claim.id);
    }, delay);
  }

  /**
   * Verify all pending claims
   */
  private async verifyPendingClaims(): Promise<void> {
    const pendingClaims = this.claimTracker.getClaimsByStatus('pending');
    
    if (pendingClaims.length === 0) {
      return;
    }
    
    console.log(`🔍 Verifying ${pendingClaims.length} pending claims`);
    
    // Process claims in batches to avoid overwhelming the system
    const batchSize = 5;
    for (let i = 0; i < pendingClaims.length; i += batchSize) {
      const batch = pendingClaims.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(claim => this.verifyClaim(claim.id))
      );
      
      // Small delay between batches
      if (i + batchSize < pendingClaims.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Force re-verification of a claim (override previous results)
   */
  async forceReverifyClaim(claimId: string): Promise<ClaimValidation | null> {
    const claim = this.claimTracker.getClaim(claimId);
    if (!claim) {
      return null;
    }
    
    // Reset claim status
    await this.claimTracker.updateClaimStatus(claimId, 'pending');
    
    console.log(`🔄 Force re-verifying claim: ${claim.description.substring(0, 50)}...`);
    
    return await this.verifyClaim(claimId);
  }

  /**
   * Get agent trust score
   */
  getAgentTrustScore(agentId: string): AgentTrustScore | undefined {
    return this.agentTrustScores.get(agentId);
  }

  /**
   * Update agent trust score based on verification results
   */
  private async updateAgentTrustScore(agentId: string, agentName: string, claim: AgentClaim, validated: boolean): Promise<void> {
    let trustScore = this.agentTrustScores.get(agentId);
    
    if (!trustScore) {
      trustScore = {
        agentId,
        agentName,
        overallScore: 100,
        totalClaims: 0,
        verifiedClaims: 0,
        debunkedClaims: 0,
        accuracyRate: 100,
        consistency: 100,
        reliability: 100,
        history: [],
        penalties: [],
        badges: []
      };
    }
    
    const oldScore = trustScore.overallScore;
    
    // Update claim counts
    trustScore.totalClaims++;
    if (validated) {
      trustScore.verifiedClaims++;
    } else {
      trustScore.debunkedClaims++;
    }
    
    // Calculate new accuracy rate
    trustScore.accuracyRate = (trustScore.verifiedClaims / trustScore.totalClaims) * 100;
    
    // Calculate consistency (how consistent claims are with each other)
    trustScore.consistency = this.calculateConsistency(agentId);
    
    // Calculate reliability (factoring in claim confidence and evidence quality)
    trustScore.reliability = this.calculateReliability(agentId);
    
    // Calculate overall score
    trustScore.overallScore = (trustScore.accuracyRate * 0.5) + (trustScore.consistency * 0.3) + (trustScore.reliability * 0.2);
    
    // Apply penalties
    this.applyTrustPenalties(trustScore, claim, validated);
    
    // Award badges
    this.checkForBadges(trustScore);
    
    // Add to history
    trustScore.history.push({
      timestamp: new Date(),
      score: trustScore.overallScore,
      event: validated ? 'claim_verified' : 'claim_debunked',
      details: claim.description.substring(0, 100)
    });
    
    // Keep history manageable
    if (trustScore.history.length > 100) {
      trustScore.history = trustScore.history.slice(-100);
    }
    
    this.agentTrustScores.set(agentId, trustScore);
    await this.saveTrustScores();
    
    if (Math.abs(oldScore - trustScore.overallScore) >= 5) {
      this.emit('trust-score-updated', agentId, oldScore, trustScore.overallScore);
    }
  }

  /**
   * Calculate agent consistency
   */
  private calculateConsistency(agentId: string): number {
    const claims = this.claimTracker.getAgentClaims(agentId);
    if (claims.length < 3) return 100; // Not enough data
    
    // Look at claim types and success patterns
    const claimTypes = new Map<string, { verified: number; total: number }>();
    
    for (const claim of claims) {
      if (claim.status === 'verified' || claim.status === 'debunked') {
        const stats = claimTypes.get(claim.claimType) || { verified: 0, total: 0 };
        stats.total++;
        if (claim.status === 'verified') stats.verified++;
        claimTypes.set(claim.claimType, stats);
      }
    }
    
    // Calculate consistency across claim types
    let totalVariance = 0;
    let typeCount = 0;
    
    for (const stats of claimTypes.values()) {
      if (stats.total >= 2) {
        const rate = stats.verified / stats.total;
        totalVariance += Math.pow(rate - 0.8, 2); // Deviation from expected 80% success
        typeCount++;
      }
    }
    
    if (typeCount === 0) return 100;
    
    const avgVariance = totalVariance / typeCount;
    const consistency = Math.max(0, 100 - (avgVariance * 500)); // Scale variance to 0-100
    
    return consistency;
  }

  /**
   * Calculate agent reliability
   */
  private calculateReliability(agentId: string): number {
    const claims = this.claimTracker.getAgentClaims(agentId);
    if (claims.length === 0) return 100;
    
    let totalConfidence = 0;
    let totalEvidence = 0;
    let validClaims = 0;
    
    for (const claim of claims) {
      if (claim.status === 'verified' || claim.status === 'debunked') {
        totalConfidence += claim.confidence;
        totalEvidence += claim.evidence.length;
        validClaims++;
      }
    }
    
    if (validClaims === 0) return 100;
    
    const avgConfidence = totalConfidence / validClaims;
    const avgEvidence = totalEvidence / validClaims;
    
    // Combine confidence and evidence quality
    const reliabilityScore = (avgConfidence * 0.7) + Math.min(avgEvidence * 10, 30); // Cap evidence bonus at 30
    
    return Math.min(100, reliabilityScore);
  }

  /**
   * Apply trust penalties for poor performance
   */
  private applyTrustPenalties(trustScore: AgentTrustScore, claim: AgentClaim, validated: boolean): void {
    if (validated) return; // No penalties for verified claims
    
    const validation = this.claimDebunker.getValidationResult(claim.id);
    if (!validation) return;
    
    const criticalDiscrepancies = validation.discrepancies.filter(d => d.severity === 'critical').length;
    const majorDiscrepancies = validation.discrepancies.filter(d => d.severity === 'major').length;
    
    if (criticalDiscrepancies > 0) {
      const penalty: TrustPenalty = {
        id: crypto.randomUUID(),
        type: 'false_claim',
        severity: 'severe',
        points: criticalDiscrepancies * 20,
        description: `Critical discrepancies in claim: ${claim.description.substring(0, 50)}...`,
        timestamp: new Date(),
        duration: 30, // 30 days
        active: true
      };
      
      trustScore.penalties.push(penalty);
      trustScore.overallScore = Math.max(0, trustScore.overallScore - penalty.points);
    } else if (majorDiscrepancies > 0) {
      const penalty: TrustPenalty = {
        id: crypto.randomUUID(),
        type: 'exaggerated_improvement',
        severity: 'major',
        points: majorDiscrepancies * 10,
        description: `Major discrepancies in claim: ${claim.description.substring(0, 50)}...`,
        timestamp: new Date(),
        duration: 14, // 14 days
        active: true
      };
      
      trustScore.penalties.push(penalty);
      trustScore.overallScore = Math.max(0, trustScore.overallScore - penalty.points);
    }
    
    // Clean up expired penalties
    const now = new Date();
    for (const penalty of trustScore.penalties) {
      if (penalty.active && penalty.duration > 0) {
        const elapsed = (now.getTime() - penalty.timestamp.getTime()) / (1000 * 60 * 60 * 24);
        if (elapsed > penalty.duration) {
          penalty.active = false;
          trustScore.overallScore = Math.min(100, trustScore.overallScore + penalty.points);
        }
      }
    }
  }

  /**
   * Check for and award trust badges
   */
  private checkForBadges(trustScore: AgentTrustScore): void {
    const existingBadgeNames = new Set(trustScore.badges.map(b => b.name));
    
    // Accuracy badges
    if (trustScore.accuracyRate >= 95 && !existingBadgeNames.has('Precision Master')) {
      trustScore.badges.push({
        id: crypto.randomUUID(),
        name: 'Precision Master',
        description: 'Maintained 95%+ claim accuracy',
        criteria: 'Accuracy >= 95%',
        earnedDate: new Date(),
        icon: '🎯',
        color: '#gold'
      });
    }
    
    // Consistency badges
    if (trustScore.consistency >= 90 && !existingBadgeNames.has('Reliable Reporter')) {
      trustScore.badges.push({
        id: crypto.randomUUID(),
        name: 'Reliable Reporter',
        description: 'Consistent performance across claim types',
        criteria: 'Consistency >= 90%',
        earnedDate: new Date(),
        icon: '📊',
        color: '#silver'
      });
    }
    
    // Volume badges
    if (trustScore.totalClaims >= 100 && !existingBadgeNames.has('Prolific Performer')) {
      trustScore.badges.push({
        id: crypto.randomUUID(),
        name: 'Prolific Performer',
        description: 'Made 100+ verified claims',
        criteria: 'Total claims >= 100',
        earnedDate: new Date(),
        icon: '🚀',
        color: '#bronze'
      });
    }
  }

  /**
   * Generate comprehensive verification report
   */
  async generateReport(period: { start: Date; end: Date } = this.getDefaultPeriod()): Promise<VerificationReport> {
    const reportId = crypto.randomUUID();
    const timestamp = new Date();
    
    console.log(`📊 Generating verification report for period ${period.start.toISOString()} to ${period.end.toISOString()}`);
    
    // Get claims in period
    const allClaims = this.claimTracker.getAllClaims();
    const periodClaims = allClaims.filter(claim => 
      claim.timestamp >= period.start && claim.timestamp <= period.end
    );
    
    // Calculate summary
    const verifiedClaims = periodClaims.filter(c => c.status === 'verified').length;
    const debunkedClaims = periodClaims.filter(c => c.status === 'debunked').length;
    const pendingClaims = periodClaims.filter(c => c.status === 'pending').length;
    const overallAccuracy = periodClaims.length > 0 ? (verifiedClaims / periodClaims.length) * 100 : 0;
    
    // Calculate average validation time
    const validations = this.claimDebunker.getAllValidationResults();
    const periodValidations = validations.filter(v => 
      v.startTime >= period.start && v.startTime <= period.end && v.endTime
    );
    const avgValidationTime = periodValidations.length > 0 ? 
      periodValidations.reduce((sum, v) => sum + (v.endTime!.getTime() - v.startTime.getTime()), 0) / periodValidations.length : 0;
    
    const summary = {
      totalClaims: periodClaims.length,
      verifiedClaims,
      debunkedClaims,
      pendingClaims,
      overallAccuracy,
      averageValidationTime: avgValidationTime
    };
    
    // Agent performance summaries
    const agentPerformance = this.generateAgentPerformanceSummaries(periodClaims);
    
    // Claim type summaries
    const claimTypes = this.generateClaimTypeSummaries(periodClaims);
    
    // Trend analysis
    const trends = this.analyzeTrends(period);
    
    // System issues
    const issues = Array.from(this.systemIssues.values())
      .filter(issue => issue.firstDetected >= period.start);
    
    // Recommendations
    const recommendations = this.generateRecommendations(periodClaims, agentPerformance);
    
    const report: VerificationReport = {
      reportId,
      timestamp,
      period,
      summary,
      agentPerformance,
      claimTypes,
      trends,
      issues,
      recommendations
    };
    
    this.verificationReports.push(report);
    
    // Keep only last 10 reports in memory
    if (this.verificationReports.length > 10) {
      this.verificationReports = this.verificationReports.slice(-10);
    }
    
    await this.saveReport(report);
    
    console.log(`✅ Verification report generated: ${report.reportId}`);
    
    return report;
  }

  /**
   * Generate agent performance summaries
   */
  private generateAgentPerformanceSummaries(claims: AgentClaim[]): any[] {
    const agentStats = new Map<string, {
      agentId: string;
      agentName: string;
      claims: AgentClaim[];
      verified: number;
      debunked: number;
      totalConfidence: number;
    }>();
    
    // Collect stats by agent
    for (const claim of claims) {
      const stats = agentStats.get(claim.agentId) || {
        agentId: claim.agentId,
        agentName: claim.agentName,
        claims: [],
        verified: 0,
        debunked: 0,
        totalConfidence: 0
      };
      
      stats.claims.push(claim);
      stats.totalConfidence += claim.confidence;
      
      if (claim.status === 'verified') stats.verified++;
      if (claim.status === 'debunked') stats.debunked++;
      
      agentStats.set(claim.agentId, stats);
    }
    
    // Convert to summary format
    return Array.from(agentStats.values()).map(stats => {
      const totalClaims = stats.claims.length;
      const accuracyRate = totalClaims > 0 ? (stats.verified / totalClaims) * 100 : 0;
      const averageConfidence = totalClaims > 0 ? stats.totalConfidence / totalClaims : 0;
      const trustScore = this.agentTrustScores.get(stats.agentId)?.overallScore || 100;
      
      // Find strongest and weakest areas
      const claimTypeStats = new Map<string, { verified: number; total: number }>();
      for (const claim of stats.claims) {
        const typeStats = claimTypeStats.get(claim.claimType) || { verified: 0, total: 0 };
        typeStats.total++;
        if (claim.status === 'verified') typeStats.verified++;
        claimTypeStats.set(claim.claimType, typeStats);
      }
      
      let strongestArea = '';
      let weakestArea = '';
      let highestRate = 0;
      let lowestRate = 100;
      
      for (const [type, typeStats] of claimTypeStats.entries()) {
        if (typeStats.total >= 2) { // Need at least 2 claims for meaningful comparison
          const rate = (typeStats.verified / typeStats.total) * 100;
          if (rate > highestRate) {
            highestRate = rate;
            strongestArea = type;
          }
          if (rate < lowestRate) {
            lowestRate = rate;
            weakestArea = type;
          }
        }
      }
      
      return {
        agentId: stats.agentId,
        agentName: stats.agentName,
        totalClaims,
        accuracyRate,
        averageConfidence,
        trustScore,
        strongestArea: strongestArea as any,
        weakestArea: weakestArea as any,
        improvement: 0 // Would compare with previous period
      };
    });
  }

  /**
   * Generate claim type summaries
   */
  private generateClaimTypeSummaries(claims: AgentClaim[]): any[] {
    const typeStats = new Map<string, {
      total: number;
      verified: number;
      totalConfidence: number;
      issues: string[];
    }>();
    
    for (const claim of claims) {
      const stats = typeStats.get(claim.claimType) || {
        total: 0,
        verified: 0,
        totalConfidence: 0,
        issues: []
      };
      
      stats.total++;
      stats.totalConfidence += claim.confidence;
      if (claim.status === 'verified') stats.verified++;
      
      // Collect common issues from validation results
      const validation = this.claimDebunker.getValidationResult(claim.id);
      if (validation) {
        for (const discrepancy of validation.discrepancies) {
          if (!stats.issues.includes(discrepancy.type)) {
            stats.issues.push(discrepancy.type);
          }
        }
      }
      
      typeStats.set(claim.claimType, stats);
    }
    
    return Array.from(typeStats.entries()).map(([type, stats]) => ({
      type: type as any,
      totalClaims: stats.total,
      verificationRate: stats.total > 0 ? (stats.verified / stats.total) * 100 : 0,
      averageAccuracy: stats.total > 0 ? stats.totalConfidence / stats.total : 0,
      commonIssues: stats.issues.slice(0, 3) // Top 3 issues
    }));
  }

  /**
   * Analyze trends over time
   */
  private analyzeTrends(period: { start: Date; end: Date }): any[] {
    const trends = [];
    
    // Overall accuracy trend
    const claims = this.claimTracker.getAllClaims();
    const periodClaims = claims.filter(c => c.timestamp >= period.start && c.timestamp <= period.end);
    const verifiedCount = periodClaims.filter(c => c.status === 'verified').length;
    const currentAccuracy = periodClaims.length > 0 ? (verifiedCount / periodClaims.length) * 100 : 0;
    
    // Compare with previous period (simplified)
    const previousStart = new Date(period.start);
    previousStart.setTime(previousStart.getTime() - (period.end.getTime() - period.start.getTime()));
    const previousClaims = claims.filter(c => c.timestamp >= previousStart && c.timestamp < period.start);
    const previousVerified = previousClaims.filter(c => c.status === 'verified').length;
    const previousAccuracy = previousClaims.length > 0 ? (previousVerified / previousClaims.length) * 100 : 0;
    
    const accuracyChange = currentAccuracy - previousAccuracy;
    
    trends.push({
      metric: 'overall_accuracy',
      direction: accuracyChange > 5 ? 'improving' : accuracyChange < -5 ? 'declining' : 'stable',
      change: accuracyChange,
      significance: Math.abs(accuracyChange) > 10 ? 'major' : Math.abs(accuracyChange) > 5 ? 'moderate' : 'minor',
      timeframe: 'period_comparison'
    });
    
    return trends;
  }

  /**
   * Generate system recommendations
   */
  private generateRecommendations(claims: AgentClaim[], agentPerformance: any[]): ReportRecommendation[] {
    const recommendations: ReportRecommendation[] = [];
    
    // Low-performing agents
    const lowPerformingAgents = agentPerformance.filter(agent => agent.accuracyRate < 70);
    if (lowPerformingAgents.length > 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'agent_training',
        priority: 'high',
        title: 'Improve Low-Performing Agents',
        description: `${lowPerformingAgents.length} agents have accuracy rates below 70%`,
        expectedImpact: 'Increased overall system accuracy',
        estimatedEffort: 'Medium',
        affectedAgents: lowPerformingAgents.map(a => a.agentId)
      });
    }
    
    // High number of pending claims
    const pendingClaims = claims.filter(c => c.status === 'pending').length;
    if (pendingClaims > claims.length * 0.2) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'system_improvement',
        priority: 'medium',
        title: 'Reduce Claim Validation Backlog',
        description: `${pendingClaims} claims are still pending validation`,
        expectedImpact: 'Faster claim processing and feedback',
        estimatedEffort: 'Low'
      });
    }
    
    // System issues
    const activeIssues = Array.from(this.systemIssues.values()).filter(issue => 
      issue.frequency > 3 // Issues occurring more than 3 times
    );
    
    if (activeIssues.length > 0) {
      recommendations.push({
        id: crypto.randomUUID(),
        type: 'system_improvement',
        priority: 'critical',
        title: 'Address Recurring System Issues',
        description: `${activeIssues.length} system issues are occurring frequently`,
        expectedImpact: 'Improved system reliability and reduced validation errors',
        estimatedEffort: 'High'
      });
    }
    
    return recommendations;
  }

  /**
   * Event handlers
   */
  private async onClaimExtracted(claim: AgentClaim): Promise<void> {
    console.log(`📝 Claim extracted from ${claim.agentName}: ${claim.description.substring(0, 50)}...`);
    this.emit('claim-extracted', claim);
  }

  private async onClaimVerified(claim: AgentClaim): Promise<void> {
    console.log(`✅ Claim verified: ${claim.description.substring(0, 50)}...`);
    await this.updateAgentTrustScore(claim.agentId, claim.agentName, claim, true);
    this.emit('claim-verified', claim);
  }

  private async onClaimDebunked(claim: AgentClaim, discrepancies: ClaimDiscrepancy[]): Promise<void> {
    console.log(`❌ Claim debunked: ${claim.description.substring(0, 50)}... (${discrepancies.length} discrepancies)`);
    await this.updateAgentTrustScore(claim.agentId, claim.agentName, claim, false);
    
    if (this.config.notifications.onClaimDebunked) {
      console.log(`🚨 CLAIM DEBUNKED: Agent ${claim.agentName} made false claim`);
      console.log(`   Claim: ${claim.description}`);
      console.log(`   Discrepancies: ${discrepancies.map(d => d.description).join(', ')}`);
    }
    
    this.emit('claim-debunked', claim, discrepancies);
  }

  private onValidationCompleted(claimId: string, result: any): void {
    this.emit('validation-completed', claimId, result);
  }

  private onTrustScoreUpdated(agentId: string, oldScore: number, newScore: number): void {
    if (this.config.notifications.onTrustScoreChanged) {
      const agent = this.agentTrustScores.get(agentId);
      const change = newScore - oldScore;
      const direction = change > 0 ? 'increased' : 'decreased';
      
      console.log(`📊 Trust score ${direction} for ${agent?.agentName || agentId}: ${oldScore.toFixed(1)} → ${newScore.toFixed(1)} (${change > 0 ? '+' : ''}${change.toFixed(1)})`);
    }
  }

  private onSystemIssueDetected(issue: SystemIssue): void {
    const existingIssue = this.systemIssues.get(issue.description);
    if (existingIssue) {
      existingIssue.frequency++;
    } else {
      this.systemIssues.set(issue.description, issue);
    }
    
    if (this.config.notifications.onSystemIssue) {
      console.log(`🚨 System issue detected: ${issue.description} (Severity: ${issue.severity})`);
    }
  }

  /**
   * Utility methods
   */
  private async runWithTimeout<T>(
    promise: () => Promise<T>,
    timeout: number,
    timeoutMessage: string
  ): Promise<T> {
    return Promise.race([
      promise(),
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(timeoutMessage)), timeout)
      )
    ]);
  }

  private getDefaultPeriod(): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7); // Last 7 days
    return { start, end };
  }

  private generatePeriodicReport(): void {
    if (this.config.enabled) {
      this.generateReport().catch(error => {
        console.error('Error generating periodic report:', error);
      });
    }
  }

  /**
   * Persistence methods
   */
  private async loadTrustScores(): Promise<void> {
    try {
      const trustPath = path.join(this.projectPath, '.agentwise', 'trust-scores.json');
      
      if (await fs.pathExists(trustPath)) {
        const data = await fs.readJson(trustPath);
        
        for (const [agentId, score] of Object.entries(data)) {
          // Convert date strings back to Date objects
          const trustScore = score as AgentTrustScore;
          trustScore.history = trustScore.history.map(h => ({
            ...h,
            timestamp: new Date(h.timestamp)
          }));
          trustScore.penalties = trustScore.penalties.map(p => ({
            ...p,
            timestamp: new Date(p.timestamp)
          }));
          trustScore.badges = trustScore.badges.map(b => ({
            ...b,
            earnedDate: new Date(b.earnedDate)
          }));
          
          this.agentTrustScores.set(agentId, trustScore);
        }
        
        console.log(`📊 Loaded trust scores for ${this.agentTrustScores.size} agents`);
      }
    } catch (error) {
      console.error('Error loading trust scores:', error);
    }
  }

  private async saveTrustScores(): Promise<void> {
    try {
      const trustPath = path.join(this.projectPath, '.agentwise', 'trust-scores.json');
      await fs.ensureDir(path.dirname(trustPath));
      
      const data: Record<string, AgentTrustScore> = {};
      for (const [agentId, score] of this.agentTrustScores.entries()) {
        data[agentId] = score;
      }
      
      await fs.writeJson(trustPath, data, { spaces: 2 });
    } catch (error) {
      console.error('Error saving trust scores:', error);
    }
  }

  private async saveReport(report: VerificationReport): Promise<void> {
    try {
      const reportsPath = path.join(this.projectPath, '.agentwise', 'reports');
      await fs.ensureDir(reportsPath);
      
      const filename = `verification-report-${report.timestamp.toISOString().split('T')[0]}-${report.reportId.substring(0, 8)}.json`;
      const reportPath = path.join(reportsPath, filename);
      
      await fs.writeJson(reportPath, report, { spaces: 2 });
    } catch (error) {
      console.error('Error saving report:', error);
    }
  }

  /**
   * Public API methods
   */

  /**
   * Get comprehensive system metrics
   */
  getMetrics(): ClaimMetrics {
    const allClaims = this.claimTracker.getAllClaims();
    const stats = this.claimTracker.getClaimStatistics();
    
    const verifiedClaims = allClaims.filter(c => c.status === 'verified').length;
    const debunkedClaims = allClaims.filter(c => c.status === 'debunked').length;
    const pendingClaims = allClaims.filter(c => c.status === 'pending').length;
    
    const validations = this.claimDebunker.getAllValidationResults();
    const avgValidationTime = validations.length > 0 ? 
      validations.reduce((sum, v) => {
        if (v.endTime && v.startTime) {
          return sum + (v.endTime.getTime() - v.startTime.getTime());
        }
        return sum;
      }, 0) / validations.length : 0;
    
    const overallAccuracy = allClaims.length > 0 ? (verifiedClaims / allClaims.length) * 100 : 0;
    
    return {
      totalClaims: allClaims.length,
      verifiedClaims,
      debunkedClaims,
      pendingClaims,
      averageValidationTime: avgValidationTime,
      overallAccuracy,
      claimsByType: stats.byType,
      claimsByAgent: stats.byAgent,
      accuracyByType: new Map(), // Would be calculated
      accuracyByAgent: new Map(), // Would be calculated
      trendData: new Map() // Would be calculated
    };
  }

  /**
   * Get all agent trust scores
   */
  getAllTrustScores(): AgentTrustScore[] {
    return Array.from(this.agentTrustScores.values());
  }

  /**
   * Get system issues
   */
  getSystemIssues(): SystemIssue[] {
    return Array.from(this.systemIssues.values());
  }

  /**
   * Get recent verification reports
   */
  getReports(limit: number = 10): VerificationReport[] {
    return this.verificationReports.slice(-limit);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...config };
    
    if (config.enabled !== undefined) {
      if (config.enabled && !this.verificationInterval) {
        this.startVerificationProcess();
      } else if (!config.enabled && this.verificationInterval) {
        this.stopVerificationProcess();
      }
    }
    
    console.log('⚙️  Configuration updated');
  }

  /**
   * Clean up system (remove old data)
   */
  async cleanup(): Promise<void> {
    const { retentionDays } = this.config.archival;
    
    console.log('🧹 Starting claim verification system cleanup...');
    
    const claimsRemoved = await this.claimTracker.cleanup(retentionDays);
    const validationsRemoved = await this.claimDebunker.cleanup(retentionDays);
    
    // Clean up old trust score history
    for (const trustScore of this.agentTrustScores.values()) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - retentionDays);
      
      trustScore.history = trustScore.history.filter(h => h.timestamp >= cutoff);
      trustScore.penalties = trustScore.penalties.filter(p => p.timestamp >= cutoff);
    }
    
    await this.saveTrustScores();
    
    console.log(`✅ Cleanup completed: removed ${claimsRemoved} claims, ${validationsRemoved} validations`);
  }

  /**
   * Shutdown system gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down claim verification system...');
    
    this.stopVerificationProcess();
    await this.saveTrustScores();
    
    // Clean up any pending operations
    this.removeAllListeners();
    
    console.log('✅ Claim verification system shutdown complete');
  }
}

export default ClaimVerificationSystem;