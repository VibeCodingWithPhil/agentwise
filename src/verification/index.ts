/**
 * Agent Claim Verification System - Main Export File
 * Production-ready claim verification system for AI agents
 */

// Core system exports
export { default as ClaimVerificationSystem } from './ClaimVerificationSystem';
export { default as ClaimTracker } from './ClaimTracker';
export { default as ClaimDebunker } from './ClaimDebunker';
export { default as PerformanceValidator } from './PerformanceValidator';

// Integration exports
export { 
  AgentClaimVerificationIntegration,
  getVerificationIntegration,
  resetVerificationIntegration
} from './integration';

// Import for default export
import { default as ClaimVerificationSystemClass } from './ClaimVerificationSystem';
import { AgentClaimVerificationIntegration as AgentClaimVerificationIntegrationClass, getVerificationIntegration as getVerificationIntegrationFunc } from './integration';

// Type definitions
export * from './types';

// Utility functions and examples
export * as Examples from './example-usage';

// Version and metadata
export const VERSION = '1.0.0';
export const DESCRIPTION = 'Comprehensive Agent Claim Verification System for Agentwise';

/**
 * Quick start function for easy initialization
 * 
 * @example
 * ```typescript
 * import { initializeVerification } from './verification';
 * 
 * const verification = await initializeVerification({
 *   projectPath: '/path/to/project',
 *   enabled: true,
 *   strictMode: false
 * });
 * ```
 */
export async function initializeVerification(options: {
  projectPath?: string;
  enabled?: boolean;
  strictMode?: boolean;
  tolerances?: {
    performance?: number;
    coverage?: number;
    size?: number;
  };
} = {}): Promise<any> {
  const { AgentClaimVerificationIntegration } = await import('./integration');
  
  const config = {
    enabled: options.enabled ?? true,
    strictMode: options.strictMode ?? false,
    tolerances: {
      performance: 15,
      coverage: 5,
      size: 20,
      ...options.tolerances
    }
  };

  const Integration = AgentClaimVerificationIntegrationClass;
  const verification = new Integration(
    options.projectPath || process.cwd(),
    config
  );

  console.log('✅ Agent Claim Verification System initialized');
  console.log(`   Project: ${options.projectPath || process.cwd()}`);
  console.log(`   Enabled: ${config.enabled}`);
  console.log(`   Strict Mode: ${config.strictMode}`);
  console.log(`   Performance Tolerance: ${config.tolerances.performance}%`);

  return verification;
}

/**
 * Factory function for creating verification system with predefined configurations
 */
export const VerificationFactory = {
  /**
   * Development configuration - lenient settings for development
   */
  development: (projectPath?: string) => {
    return new AgentClaimVerificationIntegrationClass(projectPath, {
      enabled: true,
      strictMode: false,
      tolerances: {
        performance: 25,
        coverage: 10,
        size: 30
      },
      retryPolicy: {
        maxRetries: 1,
        backoffMultiplier: 1.5,
        initialDelay: 1000
      }
    });
  },

  /**
   * Production configuration - strict settings for production
   */
  production: (projectPath?: string) => {
    const Integration = AgentClaimVerificationIntegrationClass;
    return new Integration(projectPath, {
      enabled: true,
      strictMode: true,
      tolerances: {
        performance: 10,
        coverage: 3,
        size: 15
      },
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 2000
      },
      archival: {
        retentionDays: 180,
        compressionAfterDays: 30
      }
    });
  },

  /**
   * Testing configuration - optimized for test environments
   */
  testing: (projectPath?: string) => {
    return new AgentClaimVerificationIntegrationClass(projectPath, {
      enabled: true,
      strictMode: false,
      timeouts: {
        testExecution: 10000,
        overallValidation: 30000
      },
      tolerances: {
        performance: 20,
        coverage: 15,
        size: 25
      },
      retryPolicy: {
        maxRetries: 2,
        backoffMultiplier: 1.5,
        initialDelay: 500
      }
    });
  },

  /**
   * High-performance configuration - optimized for speed
   */
  highPerformance: (projectPath?: string) => {
    return new AgentClaimVerificationIntegrationClass(projectPath, {
      enabled: true,
      strictMode: false,
      timeouts: {
        testExecution: 5000,
        overallValidation: 15000
      },
      tolerances: {
        performance: 30,
        coverage: 20,
        size: 35
      },
      retryPolicy: {
        maxRetries: 1,
        backoffMultiplier: 1,
        initialDelay: 200
      }
    });
  }
};

/**
 * Utility functions for common verification tasks
 */
export const VerificationUtils = {
  /**
   * Extract claims from text without full system setup
   */
  async extractClaimsFromText(text: string, agentName: string = 'unknown'): Promise<any[]> {
    const { default: ClaimTracker } = await import('./ClaimTracker');
    const tracker = new ClaimTracker();
    
    return await tracker.extractClaims(
      'temp-agent',
      agentName,
      text,
      {
        files: [],
        dependencies: [],
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          timestamp: new Date()
        }
      }
    );
  },

  /**
   * Validate a single claim manually
   */
  async validateClaim(claimData: any, projectPath?: string): Promise<boolean> {
    const { default: ClaimDebunker } = await import('./ClaimDebunker');
    const debunker = new ClaimDebunker(projectPath || process.cwd());
    
    const validation = await debunker.debunkClaim(claimData);
    return validation.overallResult.passed;
  },

  /**
   * Calculate trust score for an agent based on claim history
   */
  calculateTrustScore(claims: any[]): {
    score: number;
    accuracy: number;
    consistency: number;
    reliability: number;
  } {
    if (claims.length === 0) {
      return { score: 100, accuracy: 100, consistency: 100, reliability: 100 };
    }

    const verifiedClaims = claims.filter(c => c.status === 'verified').length;
    const totalClaims = claims.length;
    const accuracy = (verifiedClaims / totalClaims) * 100;

    // Simplified consistency calculation
    const claimTypes = new Set(claims.map(c => c.claimType));
    const consistency = Math.min(100, (claimTypes.size / 10) * 100); // Assuming 10 max types

    // Simplified reliability based on confidence
    const avgConfidence = claims.reduce((sum, c) => sum + c.confidence, 0) / claims.length;
    const reliability = avgConfidence;

    const score = (accuracy * 0.5) + (consistency * 0.3) + (reliability * 0.2);

    return {
      score: Math.round(score),
      accuracy: Math.round(accuracy),
      consistency: Math.round(consistency),
      reliability: Math.round(reliability)
    };
  },

  /**
   * Generate a quick verification report for claims
   */
  generateQuickReport(claims: any[]): {
    summary: any;
    byType: any;
    byStatus: any;
    recommendations: string[];
  } {
    const summary = {
      total: claims.length,
      verified: claims.filter(c => c.status === 'verified').length,
      debunked: claims.filter(c => c.status === 'debunked').length,
      pending: claims.filter(c => c.status === 'pending').length
    };

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const claim of claims) {
      byType[claim.claimType] = (byType[claim.claimType] || 0) + 1;
      byStatus[claim.status] = (byStatus[claim.status] || 0) + 1;
    }

    const recommendations: string[] = [];
    
    if (summary.total > 0) {
      const accuracy = (summary.verified / summary.total) * 100;
      
      if (accuracy < 70) {
        recommendations.push('Low claim accuracy detected - review agent training');
      }
      
      if (summary.pending > summary.total * 0.3) {
        recommendations.push('High number of pending claims - increase validation resources');
      }
      
      if (summary.debunked > summary.total * 0.2) {
        recommendations.push('High number of false claims - implement stricter validation');
      }
    }

    return {
      summary,
      byType,
      byStatus,
      recommendations
    };
  }
};

/**
 * Health check function for the verification system
 */
export async function healthCheck(verification?: any): Promise<{
  status: 'healthy' | 'warning' | 'critical';
  checks: Array<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
  }>;
}> {
  const checks: Array<{
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
  }> = [];
  let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';

  // Check if verification system is provided and functional
  if (verification) {
    try {
      const metrics = verification.getDashboardData();
      
      checks.push({
        name: 'System Initialization',
        status: 'pass',
        message: 'Verification system is running'
      });

      // Check system accuracy
      if (metrics.metrics.overallAccuracy >= 80) {
        checks.push({
          name: 'System Accuracy',
          status: 'pass',
          message: `Accuracy: ${metrics.metrics.overallAccuracy.toFixed(1)}%`
        });
      } else if (metrics.metrics.overallAccuracy >= 60) {
        checks.push({
          name: 'System Accuracy',
          status: 'warn',
          message: `Low accuracy: ${metrics.metrics.overallAccuracy.toFixed(1)}%`
        });
        overallStatus = 'warning';
      } else {
        checks.push({
          name: 'System Accuracy',
          status: 'fail',
          message: `Critical accuracy: ${metrics.metrics.overallAccuracy.toFixed(1)}%`
        });
        overallStatus = 'critical';
      }

      // Check for critical issues
      const criticalIssues = metrics.issueStats.critical;
      if (criticalIssues === 0) {
        checks.push({
          name: 'Critical Issues',
          status: 'pass',
          message: 'No critical issues detected'
        });
      } else {
        checks.push({
          name: 'Critical Issues',
          status: 'fail',
          message: `${criticalIssues} critical issues found`
        });
        overallStatus = 'critical';
      }

      // Check trust score distribution
      const lowTrustAgents = metrics.trustScoreDistribution.poor;
      if (lowTrustAgents === 0) {
        checks.push({
          name: 'Agent Trust Scores',
          status: 'pass',
          message: 'All agents have acceptable trust scores'
        });
      } else if (lowTrustAgents <= 2) {
        checks.push({
          name: 'Agent Trust Scores',
          status: 'warn',
          message: `${lowTrustAgents} agents with low trust scores`
        });
        if (overallStatus === 'healthy') overallStatus = 'warning';
      } else {
        checks.push({
          name: 'Agent Trust Scores',
          status: 'fail',
          message: `${lowTrustAgents} agents with critically low trust scores`
        });
        overallStatus = 'critical';
      }

    } catch (error: any) {
      checks.push({
        name: 'System Health Check',
        status: 'fail',
        message: `Health check failed: ${error.message}`
      });
      overallStatus = 'critical';
    }
  } else {
    checks.push({
      name: 'System Initialization',
      status: 'fail',
      message: 'Verification system not initialized'
    });
    overallStatus = 'critical';
  }

  return {
    status: overallStatus,
    checks
  };
}

// Default export for convenience
export default {
  ClaimVerificationSystem: ClaimVerificationSystemClass,
  AgentClaimVerificationIntegration: AgentClaimVerificationIntegrationClass,
  getVerificationIntegration: getVerificationIntegrationFunc,
  initializeVerification,
  VerificationFactory,
  VerificationUtils,
  healthCheck,
  VERSION,
  DESCRIPTION
};