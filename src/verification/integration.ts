/**
 * Agent Claim Verification Integration
 * Integrates the verification system with existing Agentwise components
 */

import * as path from 'path';
import ClaimVerificationSystem from './ClaimVerificationSystem';
import { ValidationConfig } from './types';
import { PerformanceAnalytics } from '../analytics/PerformanceAnalytics';
import { TokenOptimizer } from '../optimization/TokenOptimizer';

export class AgentClaimVerificationIntegration {
  private verificationSystem: ClaimVerificationSystem;
  private performanceAnalytics?: PerformanceAnalytics;
  private tokenOptimizer?: TokenOptimizer;
  private projectPath: string;

  constructor(
    projectPath: string = process.cwd(),
    config?: Partial<ValidationConfig>,
    performanceAnalytics?: PerformanceAnalytics,
    tokenOptimizer?: TokenOptimizer
  ) {
    this.projectPath = projectPath;
    this.performanceAnalytics = performanceAnalytics;
    this.tokenOptimizer = tokenOptimizer;
    
    // Initialize verification system with production-ready configuration
    const defaultConfig: Partial<ValidationConfig> = {
      enabled: true,
      strictMode: false,
      timeouts: {
        testExecution: 120000, // 2 minutes for complex tests
        overallValidation: 600000 // 10 minutes for comprehensive validation
      },
      tolerances: {
        performance: 15, // 15% tolerance for performance claims
        coverage: 5, // 5% tolerance for test coverage
        size: 20 // 20% tolerance for size-related claims
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 2000 // 2 second initial delay
      },
      notifications: {
        onClaimDebunked: true,
        onSystemIssue: true,
        onTrustScoreChanged: true
      },
      archival: {
        retentionDays: 180, // 6 months retention
        compressionAfterDays: 30
      }
    };

    this.verificationSystem = new ClaimVerificationSystem(
      projectPath,
      { ...defaultConfig, ...config }
    );

    this.setupIntegrations();
  }

  /**
   * Setup integrations with existing Agentwise components
   */
  private setupIntegrations(): void {
    // Integrate with PerformanceAnalytics
    if (this.performanceAnalytics) {
      this.verificationSystem.on('claim-verified', (claim) => {
        this.performanceAnalytics?.recordMetric(
          'agent',
          'claim_verified',
          1,
          'count',
          { 
            agent: claim.agentName,
            claimType: claim.claimType,
            confidence: claim.confidence.toString()
          }
        );
      });

      this.verificationSystem.on('claim-debunked', (claim) => {
        this.performanceAnalytics?.recordMetric(
          'agent',
          'claim_debunked',
          1,
          'count',
          { 
            agent: claim.agentName,
            claimType: claim.claimType,
            confidence: claim.confidence.toString()
          }
        );
      });

      this.verificationSystem.on('validation-completed', (claimId, result) => {
        this.performanceAnalytics?.recordMetric(
          'system',
          'validation_completed',
          result.score,
          'score',
          { 
            claimId,
            passed: result.passed.toString()
          }
        );
      });
    }

    // Integrate with TokenOptimizer
    if (this.tokenOptimizer) {
      this.verificationSystem.on('claim-extracted', (claim) => {
        // Track token usage for claim processing
        const estimatedTokens = this.estimateClaimTokenUsage(claim);
        this.tokenOptimizer?.trackUsage(claim.agentId, estimatedTokens, 'claim_extraction');
      });

      this.verificationSystem.on('validation-completed', (claimId, result) => {
        // Track validation token usage
        const estimatedTokens = this.estimateValidationTokenUsage(result);
        this.tokenOptimizer?.trackUsage('system', estimatedTokens, 'claim_validation');
      });
    }

    // Setup event logging
    this.setupEventLogging();
  }

  /**
   * Setup comprehensive event logging
   */
  private setupEventLogging(): void {
    this.verificationSystem.on('claim-extracted', (claim) => {
      console.log(`[VERIFICATION] 📝 Extracted claim from ${claim.agentName}: ${claim.description.substring(0, 100)}...`);
    });

    this.verificationSystem.on('claim-verified', (claim) => {
      console.log(`[VERIFICATION] ✅ Claim VERIFIED: ${claim.agentName} - ${claim.description.substring(0, 50)}...`);
    });

    this.verificationSystem.on('claim-debunked', (claim, discrepancies) => {
      console.log(`[VERIFICATION] ❌ Claim DEBUNKED: ${claim.agentName} - ${claim.description.substring(0, 50)}...`);
      console.log(`[VERIFICATION]    Discrepancies: ${discrepancies.length} issues found`);
      
      if (discrepancies.some((d: any) => d.severity === 'critical')) {
        console.log(`[VERIFICATION] 🚨 CRITICAL ISSUES DETECTED - Agent may require retraining`);
      }
    });

    this.verificationSystem.on('trust-score-updated', (agentId, oldScore, newScore) => {
      const change = newScore - oldScore;
      const direction = change > 0 ? '📈' : '📉';
      console.log(`[VERIFICATION] ${direction} Trust score updated for ${agentId}: ${oldScore.toFixed(1)} → ${newScore.toFixed(1)} (${change > 0 ? '+' : ''}${change.toFixed(1)})`);
    });

    this.verificationSystem.on('system-issue-detected', (issue) => {
      console.log(`[VERIFICATION] ⚠️  System issue detected: ${issue.type} - ${issue.description}`);
      if (issue.severity === 'critical') {
        console.log(`[VERIFICATION] 🚨 CRITICAL SYSTEM ISSUE - Immediate attention required`);
      }
    });

    this.verificationSystem.on('rework-required', (claimId, requirements) => {
      console.log(`[VERIFICATION] 🔧 Rework required for claim ${claimId.substring(0, 8)}...`);
      console.log(`[VERIFICATION]    Requirements: ${requirements.join(', ')}`);
    });
  }

  /**
   * Intercept agent responses for claim extraction
   * This method should be called whenever an agent provides a response
   */
  async interceptAgentResponse(
    agentId: string,
    agentName: string,
    response: string,
    context: {
      projectId?: string;
      taskId?: string;
      phase?: number;
      files?: string[];
      dependencies?: string[];
    } = {}
  ): Promise<void> {
    try {
      // Extract claims from agent response
      const claims = await this.verificationSystem.extractClaims(
        agentId,
        agentName,
        response,
        {
          projectId: context.projectId,
          taskId: context.taskId,
          phase: context.phase,
          files: context.files || [],
          dependencies: context.dependencies || [],
          environment: {
            nodeVersion: process.version,
            platform: process.platform,
            timestamp: new Date()
          }
        }
      );

      if (claims.length > 0) {
        console.log(`[VERIFICATION] 📊 Intercepted ${claims.length} claims from ${agentName}`);
        
        // Log individual claims for transparency
        for (const claim of claims) {
          console.log(`[VERIFICATION]   - ${claim.claimType}: ${claim.description.substring(0, 80)}...`);
        }
      }
    } catch (error) {
      console.error(`[VERIFICATION] ❌ Error intercepting agent response from ${agentName}:`, error);
    }
  }

  /**
   * Force verification of a specific claim (for manual verification)
   */
  async forceVerifyClaim(claimId: string): Promise<boolean> {
    try {
      const validation = await this.verificationSystem.forceReverifyClaim(claimId);
      return validation?.overallResult.passed || false;
    } catch (error) {
      console.error(`[VERIFICATION] Error force-verifying claim ${claimId}:`, error);
      return false;
    }
  }

  /**
   * Get agent performance report
   */
  getAgentPerformanceReport(agentId: string): {
    trustScore?: any;
    recentClaims: any[];
    validationHistory: any[];
    recommendations: string[];
  } {
    const trustScore = this.verificationSystem.getAgentTrustScore(agentId);
    const allClaims = this.verificationSystem['claimTracker'].getAllClaims();
    const recentClaims = allClaims
      .filter(claim => claim.agentId === agentId)
      .slice(-10)
      .map(claim => ({
        id: claim.id,
        type: claim.claimType,
        description: claim.description,
        status: claim.status,
        timestamp: claim.timestamp,
        confidence: claim.confidence
      }));

    const validationHistory = this.verificationSystem['claimDebunker']
      .getAllValidationResults()
      .filter(validation => {
        const claim = allClaims.find(c => c.id === validation.validationId);
        return claim?.agentId === agentId;
      })
      .slice(-5);

    const recommendations: string[] = [];
    
    if (trustScore) {
      if (trustScore.accuracyRate < 70) {
        recommendations.push('Improve claim accuracy - consider more conservative estimates');
      }
      
      if (trustScore.consistency < 80) {
        recommendations.push('Work on consistency across different claim types');
      }
      
      if (trustScore.reliability < 80) {
        recommendations.push('Provide more evidence and higher quality claims');
      }
      
      if (trustScore.penalties.filter(p => p.active).length > 0) {
        recommendations.push('Address recent claim discrepancies to remove penalties');
      }
    }

    return {
      trustScore,
      recentClaims,
      validationHistory,
      recommendations
    };
  }

  /**
   * Generate comprehensive verification report
   */
  async generateSystemReport(): Promise<any> {
    const report = await this.verificationSystem.generateReport();
    const metrics = this.verificationSystem.getMetrics();
    const allTrustScores = this.verificationSystem.getAllTrustScores();
    const systemIssues = this.verificationSystem.getSystemIssues();

    return {
      ...report,
      systemMetrics: metrics,
      agentTrustScores: allTrustScores,
      activeIssues: systemIssues.filter(issue => 
        (Date.now() - issue.firstDetected.getTime()) < (7 * 24 * 60 * 60 * 1000) // Last 7 days
      ),
      summary: {
        ...report.summary,
        systemHealth: this.calculateSystemHealth(metrics, allTrustScores),
        riskLevel: this.calculateRiskLevel(systemIssues, allTrustScores)
      }
    };
  }

  /**
   * Get real-time verification dashboard data
   */
  getDashboardData(): {
    metrics: any;
    recentClaims: any[];
    trustScoreDistribution: any;
    issueStats: any;
    recommendations: string[];
  } {
    const metrics = this.verificationSystem.getMetrics();
    const allClaims = this.verificationSystem['claimTracker'].getAllClaims();
    const recentClaims = allClaims
      .slice(-20)
      .map(claim => ({
        agent: claim.agentName,
        type: claim.claimType,
        status: claim.status,
        confidence: claim.confidence,
        timestamp: claim.timestamp
      }));

    const trustScores = this.verificationSystem.getAllTrustScores();
    const trustScoreDistribution = {
      excellent: trustScores.filter(t => t.overallScore >= 90).length,
      good: trustScores.filter(t => t.overallScore >= 75 && t.overallScore < 90).length,
      fair: trustScores.filter(t => t.overallScore >= 60 && t.overallScore < 75).length,
      poor: trustScores.filter(t => t.overallScore < 60).length
    };

    const systemIssues = this.verificationSystem.getSystemIssues();
    const issueStats = {
      critical: systemIssues.filter(i => i.severity === 'critical').length,
      high: systemIssues.filter(i => i.severity === 'high').length,
      medium: systemIssues.filter(i => i.severity === 'medium').length,
      low: systemIssues.filter(i => i.severity === 'low').length
    };

    const recommendations = this.generateSystemRecommendations(metrics, trustScores, systemIssues);

    return {
      metrics,
      recentClaims,
      trustScoreDistribution,
      issueStats,
      recommendations
    };
  }

  /**
   * Clean up verification system
   */
  async cleanup(): Promise<void> {
    await this.verificationSystem.cleanup();
  }

  /**
   * Shutdown verification system
   */
  async shutdown(): Promise<void> {
    await this.verificationSystem.shutdown();
  }

  /**
   * Update verification configuration
   */
  updateConfiguration(config: Partial<ValidationConfig>): void {
    this.verificationSystem.updateConfig(config);
  }

  /**
   * Get verification system instance (for advanced usage)
   */
  getVerificationSystem(): ClaimVerificationSystem {
    return this.verificationSystem;
  }

  // Private helper methods

  private estimateClaimTokenUsage(claim: any): number {
    // Rough estimation based on claim content
    const baseTokens = 50; // Base tokens for processing
    const descriptionTokens = Math.ceil(claim.description.length / 4);
    const contextTokens = claim.evidence.length * 20;
    const specificClaimTokens = claim.specificClaims.length * 15;
    
    return baseTokens + descriptionTokens + contextTokens + specificClaimTokens;
  }

  private estimateValidationTokenUsage(result: any): number {
    // Rough estimation based on validation complexity
    const baseTokens = 100;
    const issueTokens = result.issues ? result.issues.length * 25 : 0;
    const deviationTokens = result.deviations ? result.deviations.length * 30 : 0;
    
    return baseTokens + issueTokens + deviationTokens;
  }

  private calculateSystemHealth(metrics: any, trustScores: any[]): 'excellent' | 'good' | 'fair' | 'poor' {
    if (trustScores.length === 0) return 'fair';
    
    const avgTrustScore = trustScores.reduce((sum, t) => sum + t.overallScore, 0) / trustScores.length;
    const accuracy = metrics.overallAccuracy;
    
    const combinedScore = (avgTrustScore + accuracy) / 2;
    
    if (combinedScore >= 90) return 'excellent';
    if (combinedScore >= 75) return 'good';
    if (combinedScore >= 60) return 'fair';
    return 'poor';
  }

  private calculateRiskLevel(issues: any[], trustScores: any[]): 'low' | 'medium' | 'high' | 'critical' {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    const lowTrustAgents = trustScores.filter(t => t.overallScore < 60).length;
    
    if (criticalIssues > 0 || lowTrustAgents > trustScores.length * 0.3) {
      return 'critical';
    }
    
    if (highIssues > 2 || lowTrustAgents > trustScores.length * 0.2) {
      return 'high';
    }
    
    if (highIssues > 0 || lowTrustAgents > 0) {
      return 'medium';
    }
    
    return 'low';
  }

  private generateSystemRecommendations(metrics: any, trustScores: any[], issues: any[]): string[] {
    const recommendations: string[] = [];
    
    if (metrics.overallAccuracy < 80) {
      recommendations.push('Overall system accuracy is below 80% - review agent training and validation processes');
    }
    
    if (trustScores.filter(t => t.overallScore < 70).length > 0) {
      recommendations.push('Some agents have low trust scores - consider retraining or additional validation');
    }
    
    if (issues.filter(i => i.severity === 'critical').length > 0) {
      recommendations.push('Critical system issues detected - immediate attention required');
    }
    
    if (metrics.pendingClaims > metrics.totalClaims * 0.2) {
      recommendations.push('High number of pending claims - consider scaling validation resources');
    }
    
    return recommendations;
  }
}

// Export singleton instance for easy integration
let globalVerificationIntegration: AgentClaimVerificationIntegration | null = null;

export function getVerificationIntegration(
  projectPath?: string,
  config?: Partial<ValidationConfig>,
  performanceAnalytics?: PerformanceAnalytics,
  tokenOptimizer?: TokenOptimizer
): AgentClaimVerificationIntegration {
  if (!globalVerificationIntegration) {
    globalVerificationIntegration = new AgentClaimVerificationIntegration(
      projectPath,
      config,
      performanceAnalytics,
      tokenOptimizer
    );
  }
  
  return globalVerificationIntegration;
}

export function resetVerificationIntegration(): void {
  if (globalVerificationIntegration) {
    globalVerificationIntegration.shutdown().then(() => {
      globalVerificationIntegration = null;
    });
  }
}

export default AgentClaimVerificationIntegration;