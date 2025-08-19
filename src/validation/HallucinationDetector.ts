import * as fs from 'fs-extra';
import * as path from 'path';

export interface HallucinationCheck {
  passed: boolean;
  issues: HallucinationIssue[];
  confidence: number;
  recommendations: string[];
}

export interface HallucinationIssue {
  type: 'inconsistency' | 'impossibility' | 'contradiction' | 'fabrication' | 'drift';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location?: string;
  evidence?: string[];
}

export class HallucinationDetector {
  private projectPath: string;
  private contextHistory: Map<string, any> = new Map();
  private factDatabase: Map<string, string[]> = new Map();

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.initializeFactDatabase();
  }

  /**
   * Initialize known facts and constraints
   */
  private initializeFactDatabase(): void {
    // Technical facts
    this.factDatabase.set('react_versions', ['16', '17', '18']);
    this.factDatabase.set('node_versions', ['14', '16', '18', '20']);
    this.factDatabase.set('valid_http_methods', ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD']);
    this.factDatabase.set('valid_status_codes', ['200', '201', '204', '301', '302', '400', '401', '403', '404', '500', '502', '503']);
    
    // Common package constraints
    this.factDatabase.set('typescript_constraints', [
      'TypeScript cannot import .ts files in runtime JavaScript',
      'TypeScript types are removed at compile time',
      'Type assertions do not perform runtime checks'
    ]);

    // Logical constraints
    this.factDatabase.set('logical_constraints', [
      'A function cannot return multiple values simultaneously',
      'A variable cannot be const and reassigned',
      'A server cannot listen on the same port twice',
      'A file cannot be read before it exists'
    ]);
  }

  /**
   * Check agent output for hallucinations
   */
  async checkAgentOutput(
    agentId: string,
    output: string,
    context: any
  ): Promise<HallucinationCheck> {
    const issues: HallucinationIssue[] = [];
    
    // Store context for drift detection
    this.contextHistory.set(agentId, context);

    // 1. Check for logical impossibilities
    const impossibilities = this.checkImpossibilities(output);
    issues.push(...impossibilities);

    // 2. Check for contradictions with project state
    const contradictions = await this.checkContradictions(output);
    issues.push(...contradictions);

    // 3. Check for fabricated information
    const fabrications = this.checkFabrications(output);
    issues.push(...fabrications);

    // 4. Check for context drift
    const drifts = this.checkContextDrift(agentId, output, context);
    issues.push(...drifts);

    // 5. Check for inconsistencies
    const inconsistencies = await this.checkInconsistencies(output);
    issues.push(...inconsistencies);

    // Calculate confidence score
    const confidence = this.calculateConfidence(issues);

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues);

    return {
      passed: issues.filter(i => i.severity === 'critical' || i.severity === 'high').length === 0,
      issues,
      confidence,
      recommendations
    };
  }

  /**
   * Check for logical impossibilities
   */
  private checkImpossibilities(output: string): HallucinationIssue[] {
    const issues: HallucinationIssue[] = [];

    // Check for impossible version combinations
    if (/React 15.*with.*TypeScript 5/i.test(output)) {
      issues.push({
        type: 'impossibility',
        severity: 'high',
        description: 'React 15 is not compatible with TypeScript 5',
        evidence: ['React 15 predates TypeScript 5 by several years']
      });
    }

    // Check for impossible port numbers
    const portMatch = output.match(/port[:\s]+(\d+)/i);
    if (portMatch) {
      const port = parseInt(portMatch[1], 10);
      if (port > 65535 || port < 0) {
        issues.push({
          type: 'impossibility',
          severity: 'critical',
          description: `Invalid port number: ${port}`,
          evidence: ['Port numbers must be between 0 and 65535']
        });
      }
    }

    // Check for impossible file paths
    if (/C:\\.*\/usr\//.test(output) || /\/home\/.*C:/.test(output)) {
      issues.push({
        type: 'impossibility',
        severity: 'high',
        description: 'Mixed Windows and Unix path formats',
        evidence: ['Cannot mix Windows and Unix path separators']
      });
    }

    // Check for impossible async patterns
    if (/await.*\.then\(.*await/s.test(output)) {
      issues.push({
        type: 'impossibility',
        severity: 'medium',
        description: 'Mixing await with .then() in confusing way',
        evidence: ['Should use either await or .then(), not both unnecessarily']
      });
    }

    return issues;
  }

  /**
   * Check for contradictions with project state
   */
  private async checkContradictions(output: string): Promise<HallucinationIssue[]> {
    const issues: HallucinationIssue[] = [];

    // Check package.json claims
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJSON(packageJsonPath);
      
      // Check for claiming to install packages that are already installed
      const installMatch = output.match(/npm install ([a-z@\-/]+)/gi);
      if (installMatch) {
        for (const match of installMatch) {
          const pkg = match.replace('npm install ', '').trim();
          if (packageJson.dependencies?.[pkg] || packageJson.devDependencies?.[pkg]) {
            issues.push({
              type: 'contradiction',
              severity: 'low',
              description: `Claims to install ${pkg} but it's already in package.json`,
              location: 'package.json'
            });
          }
        }
      }

      // Check for wrong framework claims
      if (/using React/i.test(output) && !packageJson.dependencies?.react) {
        issues.push({
          type: 'contradiction',
          severity: 'high',
          description: 'Claims to use React but React is not installed',
          location: 'package.json'
        });
      }
    }

    // Check for files that supposedly exist
    const fileReferences = output.matchAll(/(?:file|created|updated|modified):\s*([./\w\-]+\.\w+)/gi);
    for (const match of fileReferences) {
      const filePath = path.join(this.projectPath, match[1]);
      if (match[0].includes('created') && await fs.pathExists(filePath)) {
        issues.push({
          type: 'contradiction',
          severity: 'medium',
          description: `Claims to create ${match[1]} but file already exists`,
          location: match[1]
        });
      }
    }

    return issues;
  }

  /**
   * Check for fabricated information
   */
  private checkFabrications(output: string): HallucinationIssue[] {
    const issues: HallucinationIssue[] = [];

    // Check for made-up configuration values
    if (/API_KEY\s*=\s*["']sk-[a-zA-Z0-9]{48}["']/i.test(output)) {
      issues.push({
        type: 'fabrication',
        severity: 'critical',
        description: 'Fabricated API key detected',
        evidence: ['API keys should not be generated or guessed']
      });
    }

    // Check for fake URLs
    const urlMatch = output.matchAll(/https?:\/\/(?:api|backend|server)\.example\.com/gi);
    if ([...urlMatch].length > 0) {
      issues.push({
        type: 'fabrication',
        severity: 'medium',
        description: 'Using example.com URLs instead of real endpoints',
        evidence: ['example.com should not be used in actual implementations']
      });
    }

    // Check for Lorem Ipsum or placeholder text
    if (/lorem ipsum|placeholder text|sample data|foo.*bar.*baz/i.test(output)) {
      issues.push({
        type: 'fabrication',
        severity: 'medium',
        description: 'Placeholder text detected in output',
        evidence: ['Real content should be used instead of placeholders']
      });
    }

    // Check for suspicious test data
    if (/test@test\.com|password123|admin\/admin/i.test(output)) {
      issues.push({
        type: 'fabrication',
        severity: 'high',
        description: 'Weak or fake credentials detected',
        evidence: ['Production code should not contain test credentials']
      });
    }

    return issues;
  }

  /**
   * Check for context drift
   */
  private checkContextDrift(agentId: string, output: string, currentContext: any): HallucinationIssue[] {
    const issues: HallucinationIssue[] = [];
    const previousContext = this.contextHistory.get(agentId);

    if (previousContext) {
      // Check if agent has drifted from original task
      if (previousContext.task && currentContext.task) {
        const similarity = this.calculateSimilarity(previousContext.task, currentContext.task);
        if (similarity < 0.3) {
          issues.push({
            type: 'drift',
            severity: 'high',
            description: 'Agent has drifted significantly from original task',
            evidence: [
              `Original: ${previousContext.task.substring(0, 50)}...`,
              `Current: ${currentContext.task.substring(0, 50)}...`
            ]
          });
        }
      }

      // Check for technology stack drift
      const prevTech = this.extractTechnologies(previousContext.output || '');
      const currTech = this.extractTechnologies(output);
      
      const removed = prevTech.filter(t => !currTech.includes(t));
      if (removed.length > 2) {
        issues.push({
          type: 'drift',
          severity: 'medium',
          description: 'Significant technology stack changes detected',
          evidence: [`Removed: ${removed.join(', ')}`]
        });
      }
    }

    return issues;
  }

  /**
   * Check for inconsistencies
   */
  private async checkInconsistencies(output: string): Promise<HallucinationIssue[]> {
    const issues: HallucinationIssue[] = [];

    // Check for inconsistent naming
    const componentNames = output.matchAll(/(?:component|class|function)\s+([A-Z][a-zA-Z]+)/g);
    const references = output.matchAll(/(?:import|export|new|render)\s+.*?([A-Z][a-zA-Z]+)/g);
    
    const defined = new Set([...componentNames].map(m => m[1]));
    const used = new Set([...references].map(m => m[1]));
    
    for (const name of used) {
      if (!defined.has(name) && name.length > 3) {
        const similar = this.findSimilarName(name, defined);
        if (similar) {
          issues.push({
            type: 'inconsistency',
            severity: 'medium',
            description: `Inconsistent naming: ${name} vs ${similar}`,
            evidence: ['Names should be consistent throughout']
          });
        }
      }
    }

    // Check for inconsistent paths
    const imports = [...output.matchAll(/from\s+["']([.\/\w\-]+)["']/g)].map(m => m[1]);
    const inconsistentPaths = imports.filter(p => p.includes('..') && p.includes('./'));
    
    if (inconsistentPaths.length > 0) {
      issues.push({
        type: 'inconsistency',
        severity: 'low',
        description: 'Inconsistent import path styles',
        evidence: inconsistentPaths
      });
    }

    return issues;
  }

  /**
   * Calculate text similarity (simple implementation)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * Extract technology mentions
   */
  private extractTechnologies(text: string): string[] {
    const technologies = [
      'react', 'vue', 'angular', 'next.js', 'express', 'fastify',
      'postgresql', 'mysql', 'mongodb', 'redis', 'docker', 'kubernetes',
      'typescript', 'javascript', 'python', 'java', 'go', 'rust'
    ];

    return technologies.filter(tech => 
      new RegExp(`\\b${tech}\\b`, 'i').test(text)
    );
  }

  /**
   * Find similar names (for typo detection)
   */
  private findSimilarName(name: string, defined: Set<string>): string | null {
    for (const def of defined) {
      if (this.levenshteinDistance(name, def) <= 2) {
        return def;
      }
    }
    return null;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(issues: HallucinationIssue[]): number {
    if (issues.length === 0) return 100;

    const severityWeights = {
      low: 5,
      medium: 15,
      high: 30,
      critical: 50
    };

    const totalPenalty = issues.reduce((sum, issue) => 
      sum + severityWeights[issue.severity], 0
    );

    return Math.max(0, 100 - totalPenalty);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(issues: HallucinationIssue[]): string[] {
    const recommendations: string[] = [];
    const issueTypes = new Set(issues.map(i => i.type));

    if (issueTypes.has('impossibility')) {
      recommendations.push('Review technical constraints and version compatibility');
    }

    if (issueTypes.has('contradiction')) {
      recommendations.push('Verify project state before making claims');
      recommendations.push('Check existing files and dependencies');
    }

    if (issueTypes.has('fabrication')) {
      recommendations.push('Use real data and configurations');
      recommendations.push('Avoid placeholder content in production code');
    }

    if (issueTypes.has('drift')) {
      recommendations.push('Stay focused on the original task');
      recommendations.push('Maintain consistency with project requirements');
    }

    if (issueTypes.has('inconsistency')) {
      recommendations.push('Ensure consistent naming conventions');
      recommendations.push('Maintain uniform code style throughout');
    }

    if (issues.filter(i => i.severity === 'critical').length > 0) {
      recommendations.unshift('CRITICAL: Address critical issues before proceeding');
    }

    return recommendations;
  }

  /**
   * Validate agent reasoning
   */
  async validateReasoning(
    agentId: string,
    reasoning: string,
    action: string
  ): Promise<boolean> {
    // Check if reasoning matches action
    const reasoningLower = reasoning.toLowerCase();
    const actionLower = action.toLowerCase();

    // Extract key terms from action
    const actionTerms = actionLower.split(/\s+/).filter(w => w.length > 3);
    
    // Check if reasoning mentions key action terms
    const mentioned = actionTerms.filter(term => reasoningLower.includes(term));
    
    // Reasoning should mention at least 30% of action terms
    return mentioned.length >= actionTerms.length * 0.3;
  }

  /**
   * Reset context for an agent
   */
  resetAgentContext(agentId: string): void {
    this.contextHistory.delete(agentId);
  }
}