/**
 * Claim Tracker - Extracts and tracks claims made by agents
 * Monitors agent responses for performance improvements, bug fixes, feature completions, etc.
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import { 
  AgentClaim, 
  ClaimType, 
  SpecificClaim, 
  ClaimContext, 
  SystemSnapshot,
  ClaimEvidence,
  ClaimVerificationEvents
} from './types';

export class ClaimTracker extends EventEmitter {
  private claims: Map<string, AgentClaim> = new Map();
  private claimsPath: string;
  private patterns: Map<ClaimType, RegExp[]> = new Map();
  private contextSnapshots: Map<string, SystemSnapshot> = new Map();
  private evidenceBuffer: Map<string, ClaimEvidence[]> = new Map();

  constructor(projectPath?: string) {
    super();
    this.claimsPath = path.join(projectPath || process.cwd(), '.agentwise', 'claims');
    this.initializePatterns();
    this.loadExistingClaims();
  }

  /**
   * Initialize claim detection patterns
   */
  private initializePatterns(): void {
    // Performance improvement patterns
    this.patterns.set('performance', [
      /reduced?\s+(?:token|memory|cpu)\s+usage\s+by\s+(\d+(?:\.\d+)?)\s*%/i,
      /improved?\s+performance\s+by\s+(\d+(?:\.\d+)?)\s*%/i,
      /(\d+(?:\.\d+)?)\s*%\s+(?:faster|quicker|improvement)/i,
      /optimized?\s+.*?\s+(?:by|saving)\s+(\d+(?:\.\d+)?)\s*%/i,
      /execution\s+time\s+reduced?\s+(?:by|from).*?to\s+(\d+(?:\.\d+)?)\s*(ms|seconds?|minutes?)/i
    ]);

    // Token reduction patterns  
    this.patterns.set('token_reduction', [
      /token\s+(?:usage|consumption)\s+reduced?\s+(?:by|from)\s+(\d+(?:\.\d+)?)\s*%/i,
      /saved?\s+(\d+(?:\.\d+)?)\s*%\s+(?:tokens?|token\s+usage)/i,
      /token\s+optimization\s+achieved?\s+(\d+(?:\.\d+)?)\s*%/i,
      /context\s+compression\s+saved?\s+(\d+(?:\.\d+)?)\s*%/i
    ]);

    // Speed improvement patterns
    this.patterns.set('speed_improvement', [
      /(\d+(?:\.\d+)?)\s*x\s+faster/i,
      /speed\s+improved?\s+by\s+(\d+(?:\.\d+)?)\s*%/i,
      /execution\s+time\s+(?:reduced?|improved?)\s+by\s+(\d+(?:\.\d+)?)\s*%/i,
      /build\s+time\s+reduced?\s+(?:by|from).*?(\d+(?:\.\d+)?)\s*(ms|seconds?|minutes?)/i
    ]);

    // Bug fix patterns
    this.patterns.set('bug_fix', [
      /fixed?\s+(\d+)\s+bugs?/i,
      /resolved?\s+(\d+)\s+issues?/i,
      /eliminated?\s+(?:all\s+)?(\d+)?\s*(?:critical|major|security)?\s+bugs?/i,
      /bug\s+(?:fix|fixes?)\s+(?:complete|completed|done)/i,
      /(?:error|exception|crash)\s+(?:fixed|resolved|eliminated)/i
    ]);

    // Feature completion patterns
    this.patterns.set('feature_completion', [
      /(?:feature|functionality)\s+(?:complete|completed|implemented|done)/i,
      /successfully\s+implemented\s+(.+)/i,
      /added?\s+(?:new\s+)?(?:feature|capability|functionality)/i,
      /(?:task|requirement)\s+(?:complete|completed|fulfilled)/i,
      /delivered?\s+(?:all\s+)?(?:requested\s+)?features?/i
    ]);

    // Quality enhancement patterns
    this.patterns.set('quality_enhancement', [
      /code\s+quality\s+improved?\s+by\s+(\d+(?:\.\d+)?)\s*%/i,
      /test\s+coverage\s+increased?\s+(?:by|to)\s+(\d+(?:\.\d+)?)\s*%/i,
      /maintainability\s+(?:score|index)\s+improved?\s+(?:by|to)\s+(\d+(?:\.\d+)?)/i,
      /complexity\s+reduced?\s+by\s+(\d+(?:\.\d+)?)\s*%/i,
      /added?\s+(\d+)\s+(?:new\s+)?tests?/i
    ]);

    // Security fix patterns
    this.patterns.set('security_fix', [
      /(?:security\s+)?vulnerabilit(?:y|ies)\s+(?:fixed|resolved|patched)/i,
      /security\s+(?:score|rating)\s+improved?\s+(?:by|to)\s+(\d+(?:\.\d+)?)/i,
      /eliminated?\s+(\d+)\s+security\s+(?:issues?|vulnerabilit(?:y|ies))/i,
      /(?:hardened|secured)\s+.*?(?:authentication|authorization|validation)/i
    ]);

    // Code optimization patterns
    this.patterns.set('code_optimization', [
      /optimized?\s+(.+?)\s+(?:for|by|reducing)/i,
      /refactored?\s+(.+?)\s+(?:for\s+better|improving)/i,
      /reduced?\s+code\s+duplication\s+by\s+(\d+(?:\.\d+)?)\s*%/i,
      /bundle\s+size\s+reduced?\s+(?:by|from).*?(\d+(?:\.\d+)?)\s*(?:kb|mb|%)/i
    ]);

    // Test coverage patterns
    this.patterns.set('test_coverage', [
      /test\s+coverage\s+(?:increased?|improved?|reached?)\s+(?:by|to)\s+(\d+(?:\.\d+)?)\s*%/i,
      /added?\s+(\d+)\s+(?:new\s+)?(?:unit|integration|e2e)?\s*tests?/i,
      /all\s+tests?\s+(?:passing|pass)/i,
      /test\s+suite\s+(?:complete|completed)/i
    ]);

    // Dependency update patterns
    this.patterns.set('dependency_update', [
      /updated?\s+(.+?)\s+(?:to\s+version\s+|from\s+.+?\s+to\s+)(\d+\.\d+\.\d+)/i,
      /upgraded?\s+(\d+)\s+dependencies?/i,
      /dependency\s+(?:updates?|upgrades?)\s+complete/i,
      /all\s+dependencies?\s+(?:up[- ]to[- ]date|updated?)/i
    ]);

    // Configuration change patterns
    this.patterns.set('configuration_change', [
      /configured?\s+(.+?)\s+(?:for|to|with)/i,
      /settings?\s+(?:updated?|optimized?|configured?)/i,
      /environment\s+(?:setup|configured?)\s+(?:complete|successfully)/i,
      /configuration\s+(?:changes?|updates?)\s+applied?/i
    ]);
  }

  /**
   * Load existing claims from storage
   */
  private async loadExistingClaims(): Promise<void> {
    try {
      if (await fs.pathExists(this.claimsPath)) {
        const files = await fs.readdir(this.claimsPath);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            const filePath = path.join(this.claimsPath, file);
            const claim = await fs.readJson(filePath);
            
            // Convert date strings back to Date objects
            claim.timestamp = new Date(claim.timestamp);
            if (claim.validation?.startTime) {
              claim.validation.startTime = new Date(claim.validation.startTime);
            }
            if (claim.validation?.endTime) {
              claim.validation.endTime = new Date(claim.validation.endTime);
            }
            
            this.claims.set(claim.id, claim);
          }
        }
        
        console.log(`📊 Loaded ${this.claims.size} existing claims`);
      }
    } catch (error) {
      console.error('Error loading existing claims:', error);
    }
  }

  /**
   * Extract claims from agent response text
   */
  async extractClaims(
    agentId: string,
    agentName: string,
    responseText: string,
    context: Partial<ClaimContext> = {}
  ): Promise<AgentClaim[]> {
    const extractedClaims: AgentClaim[] = [];
    const timestamp = new Date();

    // Create system snapshot for context
    const beforeSnapshot = this.contextSnapshots.get(`${agentId}_before`);
    const afterSnapshot = await this.createSystemSnapshot(context.projectId);
    
    const fullContext: ClaimContext = {
      ...context,
      files: context.files || [],
      dependencies: context.dependencies || [],
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        timestamp
      },
      beforeSnapshot,
      afterSnapshot
    };

    // Process each claim type
    for (const [claimType, patterns] of this.patterns.entries()) {
      for (const pattern of patterns) {
        const matches = responseText.matchAll(new RegExp(pattern.source, pattern.flags + 'g'));
        
        for (const match of matches) {
          const claim = await this.createClaim(
            agentId,
            agentName,
            claimType,
            match,
            responseText,
            fullContext,
            timestamp
          );
          
          if (claim) {
            extractedClaims.push(claim);
          }
        }
      }
    }

    // Store claims and emit events
    for (const claim of extractedClaims) {
      this.claims.set(claim.id, claim);
      await this.persistClaim(claim);
      this.emit('claim-extracted', claim);
    }

    // Store after snapshot for next comparison
    this.contextSnapshots.set(`${agentId}_before`, afterSnapshot);

    return extractedClaims;
  }

  /**
   * Create a claim object from a pattern match
   */
  private async createClaim(
    agentId: string,
    agentName: string,
    claimType: ClaimType,
    match: RegExpMatchArray,
    responseText: string,
    context: ClaimContext,
    timestamp: Date
  ): Promise<AgentClaim | null> {
    const claimId = crypto.randomUUID();
    const matchText = match[0];
    
    // Extract specific claims based on type
    const specificClaims = this.extractSpecificClaims(claimType, match, matchText);
    
    if (specificClaims.length === 0) {
      return null; // No specific claims found
    }

    // Calculate confidence based on pattern match and context
    const confidence = this.calculateClaimConfidence(matchText, responseText, context);

    // Extract evidence from surrounding text
    const evidence = this.extractEvidence(matchText, responseText, timestamp);

    const claim: AgentClaim = {
      id: claimId,
      agentId,
      agentName,
      timestamp,
      claimType,
      description: matchText.trim(),
      specificClaims,
      context,
      status: 'pending',
      confidence,
      evidence
    };

    return claim;
  }

  /**
   * Extract specific measurable claims from a match
   */
  private extractSpecificClaims(
    claimType: ClaimType,
    match: RegExpMatchArray,
    matchText: string
  ): SpecificClaim[] {
    const specificClaims: SpecificClaim[] = [];

    switch (claimType) {
      case 'performance':
      case 'token_reduction':
      case 'speed_improvement':
        // Extract percentage or numeric improvements
        const percentMatch = matchText.match(/(\d+(?:\.\d+)?)\s*%/);
        const timeMatch = matchText.match(/(\d+(?:\.\d+)?)\s*(ms|seconds?|minutes?)/);
        const multiplierMatch = matchText.match(/(\d+(?:\.\d+)?)\s*x/);

        if (percentMatch) {
          specificClaims.push({
            id: crypto.randomUUID(),
            type: 'quantitative',
            description: `${claimType} improvement percentage`,
            claimedValue: parseFloat(percentMatch[1]),
            unit: 'percentage',
            tolerance: 5, // 5% tolerance
            verified: false
          });
        }

        if (timeMatch) {
          specificClaims.push({
            id: crypto.randomUUID(),
            type: 'quantitative',
            description: `Time reduction`,
            claimedValue: parseFloat(timeMatch[1]),
            unit: timeMatch[2],
            tolerance: 10, // 10% tolerance for time measurements
            verified: false
          });
        }

        if (multiplierMatch) {
          specificClaims.push({
            id: crypto.randomUUID(),
            type: 'quantitative',
            description: 'Speed multiplier',
            claimedValue: parseFloat(multiplierMatch[1]),
            unit: 'multiplier',
            tolerance: 0.2, // 20% tolerance for speed claims
            verified: false
          });
        }
        break;

      case 'bug_fix':
        const bugCountMatch = matchText.match(/(\d+)\s+bugs?/);
        if (bugCountMatch) {
          specificClaims.push({
            id: crypto.randomUUID(),
            type: 'quantitative',
            description: 'Number of bugs fixed',
            claimedValue: parseInt(bugCountMatch[1], 10),
            unit: 'count',
            tolerance: 0, // Exact match required for bug counts
            verified: false
          });
        } else {
          // Binary claim - bugs were fixed
          specificClaims.push({
            id: crypto.randomUUID(),
            type: 'binary',
            description: 'Bugs were fixed',
            claimedValue: true,
            verified: false
          });
        }
        break;

      case 'feature_completion':
        // Binary claim - feature was completed
        specificClaims.push({
          id: crypto.randomUUID(),
          type: 'binary',
          description: 'Feature implementation completed',
          claimedValue: true,
          verified: false
        });

        // Extract feature name if possible
        const featureMatch = matchText.match(/(?:implemented|added|completed)\s+(.+?)(?:\s+feature|\s+functionality|$)/i);
        if (featureMatch) {
          specificClaims.push({
            id: crypto.randomUUID(),
            type: 'qualitative',
            description: 'Feature name',
            claimedValue: featureMatch[1].trim(),
            verified: false
          });
        }
        break;

      case 'test_coverage':
        const coverageMatch = matchText.match(/(\d+(?:\.\d+)?)\s*%/);
        const testCountMatch = matchText.match(/(\d+)\s+(?:new\s+)?tests?/);

        if (coverageMatch) {
          specificClaims.push({
            id: crypto.randomUUID(),
            type: 'quantitative',
            description: 'Test coverage percentage',
            claimedValue: parseFloat(coverageMatch[1]),
            unit: 'percentage',
            tolerance: 2, // 2% tolerance for coverage
            verified: false
          });
        }

        if (testCountMatch) {
          specificClaims.push({
            id: crypto.randomUUID(),
            type: 'quantitative',
            description: 'Number of new tests',
            claimedValue: parseInt(testCountMatch[1], 10),
            unit: 'count',
            tolerance: 0, // Exact match required
            verified: false
          });
        }
        break;

      case 'dependency_update':
        const versionMatch = matchText.match(/(?:to\s+version\s+|to\s+)(\d+\.\d+\.\d+)/);
        const depCountMatch = matchText.match(/(\d+)\s+dependencies?/);

        if (versionMatch) {
          specificClaims.push({
            id: crypto.randomUUID(),
            type: 'qualitative',
            description: 'Updated version',
            claimedValue: versionMatch[1],
            verified: false
          });
        }

        if (depCountMatch) {
          specificClaims.push({
            id: crypto.randomUUID(),
            type: 'quantitative',
            description: 'Number of dependencies updated',
            claimedValue: parseInt(depCountMatch[1], 10),
            unit: 'count',
            tolerance: 0,
            verified: false
          });
        }
        break;

      default:
        // Generic binary claim for other types
        specificClaims.push({
          id: crypto.randomUUID(),
          type: 'binary',
          description: `${claimType} was completed`,
          claimedValue: true,
          verified: false
        });
    }

    return specificClaims;
  }

  /**
   * Calculate confidence score for a claim
   */
  private calculateClaimConfidence(
    matchText: string,
    responseText: string,
    context: ClaimContext
  ): number {
    let confidence = 50; // Base confidence

    // Higher confidence for specific numeric claims
    if (/\d+(?:\.\d+)?\s*%/.test(matchText)) {
      confidence += 20;
    }

    // Higher confidence if evidence files are present
    if (context.files && context.files.length > 0) {
      confidence += 15;
    }

    // Higher confidence for before/after snapshots
    if (context.beforeSnapshot && context.afterSnapshot) {
      confidence += 15;
    }

    // Lower confidence for vague claims
    if (/(?:some|several|many|few|various)/.test(matchText.toLowerCase())) {
      confidence -= 20;
    }

    // Higher confidence for specific technical terms
    const technicalTerms = ['ms', 'seconds', 'bytes', 'tokens', 'percentage', 'version'];
    const termCount = technicalTerms.filter(term => 
      matchText.toLowerCase().includes(term)
    ).length;
    confidence += termCount * 5;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Extract evidence from response text
   */
  private extractEvidence(
    matchText: string,
    responseText: string,
    timestamp: Date
  ): ClaimEvidence[] {
    const evidence: ClaimEvidence[] = [];

    // Extract the sentence containing the claim
    const sentences = responseText.split(/[.!?]+/);
    const claimSentence = sentences.find(s => s.includes(matchText));
    
    if (claimSentence) {
      evidence.push({
        id: crypto.randomUUID(),
        type: 'terminal_output',
        source: 'agent_response',
        content: claimSentence.trim(),
        timestamp,
        relevance: 100,
        credibility: 80
      });
    }

    // Extract surrounding context (previous and next sentences)
    const claimIndex = sentences.findIndex(s => s.includes(matchText));
    if (claimIndex > 0) {
      evidence.push({
        id: crypto.randomUUID(),
        type: 'terminal_output',
        source: 'context_before',
        content: sentences[claimIndex - 1].trim(),
        timestamp,
        relevance: 60,
        credibility: 70
      });
    }

    if (claimIndex < sentences.length - 1) {
      evidence.push({
        id: crypto.randomUUID(),
        type: 'terminal_output',
        source: 'context_after',
        content: sentences[claimIndex + 1].trim(),
        timestamp,
        relevance: 60,
        credibility: 70
      });
    }

    return evidence;
  }

  /**
   * Create system snapshot for context
   */
  private async createSystemSnapshot(projectId?: string): Promise<SystemSnapshot> {
    const timestamp = new Date();

    // This would be enhanced to capture actual system state
    // For now, creating a basic snapshot structure
    return {
      timestamp,
      files: [], // Would scan project files
      dependencies: [], // Would read package.json
      performance: {
        tokenUsage: 0, // Would get from metrics
        executionTime: 0,
        memoryUsage: process.memoryUsage().heapUsed,
        cpuUsage: 0 // Would use system monitoring
      },
      security: {
        vulnerabilities: [],
        score: 100,
        lastScan: timestamp
      },
      tests: {
        total: 0, // Would run test discovery
        passed: 0,
        failed: 0,
        coverage: 0,
        duration: 0,
        newTests: 0,
        modifiedTests: 0
      }
    };
  }

  /**
   * Persist claim to storage
   */
  private async persistClaim(claim: AgentClaim): Promise<void> {
    try {
      await fs.ensureDir(this.claimsPath);
      const filePath = path.join(this.claimsPath, `${claim.id}.json`);
      await fs.writeJson(filePath, claim, { spaces: 2 });
    } catch (error) {
      console.error('Error persisting claim:', error);
    }
  }

  /**
   * Add evidence to existing claim
   */
  async addEvidence(claimId: string, evidence: ClaimEvidence): Promise<boolean> {
    const claim = this.claims.get(claimId);
    if (!claim) return false;

    claim.evidence.push(evidence);
    await this.persistClaim(claim);
    
    return true;
  }

  /**
   * Update claim status
   */
  async updateClaimStatus(claimId: string, status: AgentClaim['status']): Promise<boolean> {
    const claim = this.claims.get(claimId);
    if (!claim) return false;

    claim.status = status;
    await this.persistClaim(claim);
    
    return true;
  }

  /**
   * Get all claims for an agent
   */
  getAgentClaims(agentId: string): AgentClaim[] {
    return Array.from(this.claims.values()).filter(claim => claim.agentId === agentId);
  }

  /**
   * Get claims by type
   */
  getClaimsByType(claimType: ClaimType): AgentClaim[] {
    return Array.from(this.claims.values()).filter(claim => claim.claimType === claimType);
  }

  /**
   * Get claims by status
   */
  getClaimsByStatus(status: AgentClaim['status']): AgentClaim[] {
    return Array.from(this.claims.values()).filter(claim => claim.status === status);
  }

  /**
   * Get recent claims (last N days)
   */
  getRecentClaims(days: number = 7): AgentClaim[] {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return Array.from(this.claims.values())
      .filter(claim => claim.timestamp >= cutoff)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get claim by ID
   */
  getClaim(claimId: string): AgentClaim | undefined {
    return this.claims.get(claimId);
  }

  /**
   * Get all claims
   */
  getAllClaims(): AgentClaim[] {
    return Array.from(this.claims.values());
  }

  /**
   * Store system snapshot for future comparison
   */
  storeSystemSnapshot(agentId: string, snapshot: SystemSnapshot): void {
    this.contextSnapshots.set(`${agentId}_before`, snapshot);
  }

  /**
   * Get claim statistics
   */
  getClaimStatistics(): {
    total: number;
    byType: Map<ClaimType, number>;
    byStatus: Map<string, number>;
    byAgent: Map<string, number>;
  } {
    const stats = {
      total: this.claims.size,
      byType: new Map<ClaimType, number>(),
      byStatus: new Map<string, number>(),
      byAgent: new Map<string, number>()
    };

    for (const claim of this.claims.values()) {
      // By type
      const typeCount = stats.byType.get(claim.claimType) || 0;
      stats.byType.set(claim.claimType, typeCount + 1);

      // By status
      const statusCount = stats.byStatus.get(claim.status) || 0;
      stats.byStatus.set(claim.status, statusCount + 1);

      // By agent
      const agentCount = stats.byAgent.get(claim.agentName) || 0;
      stats.byAgent.set(claim.agentName, agentCount + 1);
    }

    return stats;
  }

  /**
   * Clean up old claims based on retention policy
   */
  async cleanup(retentionDays: number = 90): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    let cleaned = 0;
    const toRemove: string[] = [];

    for (const [id, claim] of this.claims.entries()) {
      if (claim.timestamp < cutoff && claim.status !== 'pending') {
        toRemove.push(id);
        
        // Remove file
        try {
          await fs.remove(path.join(this.claimsPath, `${id}.json`));
          cleaned++;
        } catch (error) {
          console.error(`Error removing claim file ${id}:`, error);
        }
      }
    }

    // Remove from memory
    toRemove.forEach(id => this.claims.delete(id));

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old claims`);
    }

    return cleaned;
  }
}

export default ClaimTracker;