/**
 * Claim Debunker - Tests and debunks false agent claims
 * Comprehensive validation system that verifies all agent claims and identifies discrepancies
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import {
  AgentClaim,
  ClaimValidation,
  ValidationTest,
  ValidationResult,
  ValidationIssue,
  ClaimDiscrepancy,
  TestEvidence,
  ValidationMethod,
  SystemSnapshot,
  ClaimVerificationEvents
} from './types';
import { HallucinationDetector } from '../validation/HallucinationDetector';
import PerformanceValidator from './PerformanceValidator';

const execAsync = promisify(exec);

interface DebunkingStrategy {
  name: string;
  claimTypes: string[];
  priority: number;
  execute: (claim: AgentClaim) => Promise<ValidationResult>;
}

export class ClaimDebunker extends EventEmitter {
  private projectPath: string;
  private hallucinationDetector: HallucinationDetector;
  private performanceValidator: PerformanceValidator;
  private debunkingStrategies: Map<string, DebunkingStrategy> = new Map();
  private validationResults: Map<string, ClaimValidation> = new Map();
  private discrepancyPatterns: Map<string, RegExp[]> = new Map();

  constructor(projectPath: string) {
    super();
    this.projectPath = projectPath;
    this.hallucinationDetector = new HallucinationDetector(projectPath);
    this.performanceValidator = new PerformanceValidator(projectPath);
    this.initializeStrategies();
    this.initializePatterns();
  }

  /**
   * Initialize debunking strategies
   */
  private initializeStrategies(): void {
    // File-based verification strategy
    this.debunkingStrategies.set('file_verification', {
      name: 'File-based Verification',
      claimTypes: ['feature_completion', 'bug_fix', 'code_optimization'],
      priority: 1,
      execute: this.verifyFileClaims.bind(this)
    });

    // Performance testing strategy
    this.debunkingStrategies.set('performance_testing', {
      name: 'Performance Testing',
      claimTypes: ['performance', 'token_reduction', 'speed_improvement'],
      priority: 2,
      execute: this.verifyPerformanceClaims.bind(this)
    });

    // Code analysis strategy
    this.debunkingStrategies.set('code_analysis', {
      name: 'Code Analysis',
      claimTypes: ['code_optimization', 'security_fix', 'quality_enhancement'],
      priority: 3,
      execute: this.verifyCodeClaims.bind(this)
    });

    // Test execution strategy
    this.debunkingStrategies.set('test_execution', {
      name: 'Test Execution',
      claimTypes: ['test_coverage', 'bug_fix', 'feature_completion'],
      priority: 4,
      execute: this.verifyTestClaims.bind(this)
    });

    // Dependency verification strategy
    this.debunkingStrategies.set('dependency_verification', {
      name: 'Dependency Verification',
      claimTypes: ['dependency_update', 'security_fix'],
      priority: 5,
      execute: this.verifyDependencyClaims.bind(this)
    });

    // Configuration verification strategy
    this.debunkingStrategies.set('configuration_verification', {
      name: 'Configuration Verification',
      claimTypes: ['configuration_change'],
      priority: 6,
      execute: this.verifyConfigurationClaims.bind(this)
    });
  }

  /**
   * Initialize discrepancy detection patterns
   */
  private initializePatterns(): void {
    // Phantom implementation patterns
    this.discrepancyPatterns.set('phantom_implementation', [
      /\/\/\s*TODO:/i,
      /\/\/\s*FIXME:/i,
      /\/\/\s*placeholder/i,
      /console\.log\(['"](?:test|debug|placeholder)/i,
      /throw new Error\(['"](?:not implemented|todo)/i,
      /return null; \/\/ TODO/i
    ]);

    // Fake test patterns
    this.discrepancyPatterns.set('fake_tests', [
      /it\(['"].*['"], \(\) => \{\s*\}\)/,
      /test\(['"].*['"], \(\) => \{\s*\}\)/,
      /expect\(true\)\.toBe\(true\)/,
      /assert\(true\)/,
      /\/\/ test placeholder/i
    ]);

    // Exaggerated claims patterns
    this.discrepancyPatterns.set('exaggerated_claims', [
      /100% improvement/i,
      /infinite speed/i,
      /perfect optimization/i,
      /zero latency/i,
      /instant response/i
    ]);

    // Missing evidence patterns
    this.discrepancyPatterns.set('missing_evidence', [
      /performance improved/i, // Without metrics
      /bug fixed/i, // Without test
      /optimized/i, // Without before/after comparison
    ]);
  }

  /**
   * Debunk a claim by running comprehensive validation
   */
  async debunkClaim(claim: AgentClaim): Promise<ClaimValidation> {
    const validationId = crypto.randomUUID();
    const startTime = new Date();

    console.log(`🔍 Debunking claim: ${claim.description}`);

    const validation: ClaimValidation = {
      validationId,
      startTime,
      methods: [],
      tests: [],
      overallResult: {
        passed: false,
        score: 0,
        actualValues: {},
        expectedValues: {},
        deviations: [],
        issues: []
      },
      confidence: 0,
      discrepancies: [],
      recommendations: [],
      retestRequired: false
    };

    try {
      // Step 1: Run hallucination detection
      const hallucinationCheck = await this.hallucinationDetector.checkAgentOutput(
        claim.agentId,
        claim.description,
        claim.context
      );

      if (!hallucinationCheck.passed) {
        validation.discrepancies.push(...hallucinationCheck.issues.map(issue => ({
          id: crypto.randomUUID(),
          claimId: claim.id,
          specificClaimId: '',
          type: 'contradictory_evidence' as const,
          severity: issue.severity as any,
          description: issue.description,
          expected: 'truthful claim',
          actual: 'hallucinated content',
          impact: 'Reduces claim credibility',
          requiresRework: issue.severity === 'critical' || issue.severity === 'high'
        })));
      }

      // Step 2: Select and run appropriate debunking strategies
      const applicableStrategies = this.selectStrategies(claim);
      
      for (const strategy of applicableStrategies) {
        console.log(`  📋 Running strategy: ${strategy.name}`);
        
        const result = await strategy.execute(claim);
        const test: ValidationTest = {
          id: crypto.randomUUID(),
          method: this.getMethodFromStrategy(strategy.name),
          description: strategy.name,
          status: 'completed',
          startTime: new Date(),
          endTime: new Date(),
          result,
          evidence: []
        };

        validation.tests.push(test);
        validation.methods.push(test.method);

        // Merge results
        if (result.actualValues) {
          Object.assign(validation.overallResult.actualValues, result.actualValues);
        }
        if (result.expectedValues) {
          Object.assign(validation.overallResult.expectedValues, result.expectedValues);
        }
        if (result.deviations) {
          validation.overallResult.deviations.push(...result.deviations);
        }
        if (result.issues) {
          validation.overallResult.issues.push(...result.issues);
        }
      }

      // Step 3: Analyze discrepancies
      await this.analyzeDiscrepancies(claim, validation);

      // Step 4: Calculate overall result
      this.calculateOverallResult(validation);

      // Step 5: Generate recommendations
      this.generateRecommendations(claim, validation);

      validation.endTime = new Date();
      validation.confidence = this.calculateConfidence(validation);

      // Store validation result
      this.validationResults.set(claim.id, validation);

      // Emit events based on result
      if (validation.overallResult.passed) {
        this.emit('claim-verified', claim);
      } else {
        this.emit('claim-debunked', claim, validation.discrepancies);
      }

      console.log(`✅ Claim validation completed. Result: ${validation.overallResult.passed ? 'VERIFIED' : 'DEBUNKED'} (Score: ${validation.overallResult.score.toFixed(1)})`);

    } catch (error: any) {
      validation.endTime = new Date();
      validation.overallResult.issues.push({
        type: 'inconsistency',
        severity: 'critical',
        description: `Validation failed: ${error.message}`,
        claimId: claim.id,
        autoFixable: false,
        impact: 'critical'
      } as ValidationIssue);
      
      console.error('Claim debunking failed:', error);
    }

    this.emit('validation-completed', claim.id, validation.overallResult);
    return validation;
  }

  /**
   * Select appropriate debunking strategies for a claim
   */
  private selectStrategies(claim: AgentClaim): DebunkingStrategy[] {
    const strategies: DebunkingStrategy[] = [];

    for (const strategy of this.debunkingStrategies.values()) {
      if (strategy.claimTypes.includes(claim.claimType)) {
        strategies.push(strategy);
      }
    }

    // Sort by priority
    return strategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Verify file-based claims (features, bug fixes, optimizations)
   */
  private async verifyFileClaims(claim: AgentClaim): Promise<ValidationResult> {
    const result: ValidationResult = {
      passed: false,
      score: 0,
      actualValues: {},
      expectedValues: {},
      deviations: [],
      issues: []
    };

    const { context } = claim;
    let fileChecks = 0;
    let passedChecks = 0;

    // Check if claimed files exist and contain expected changes
    if (context.files && context.files.length > 0) {
      for (const filePath of context.files) {
        fileChecks++;
        const fullPath = path.join(this.projectPath, filePath);
        
        if (await fs.pathExists(fullPath)) {
          const content = await fs.readFile(fullPath, 'utf-8');
          
          // Check for phantom implementations
          const phantomPatterns = this.discrepancyPatterns.get('phantom_implementation') || [];
          let hasPhantomCode = false;
          
          for (const pattern of phantomPatterns) {
            if (pattern.test(content)) {
              hasPhantomCode = true;
              result.issues.push({
                type: 'fabrication',
                severity: 'high',
                description: `File ${filePath} contains placeholder/TODO code`,
                evidence: [pattern.source],
                claimId: claim.id,
                autoFixable: true,
                impact: 'high'
              } as ValidationIssue);
              break;
            }
          }

          if (!hasPhantomCode) {
            passedChecks++;
          }

          // Analyze code complexity and quality
          const complexity = this.calculateCodeComplexity(content);
          const quality = this.assessCodeQuality(content);
          
          result.actualValues[`${filePath}_complexity`] = complexity;
          result.actualValues[`${filePath}_quality`] = quality;

        } else {
          result.issues.push({
            type: 'contradiction',
            severity: 'critical',
            description: `Claimed file ${filePath} does not exist`,
            evidence: [`File path: ${filePath}`],
            claimId: claim.id,
            autoFixable: false,
            impact: 'critical'
          } as ValidationIssue);
        }
      }
    }

    // Check for specific claim validation
    for (const specificClaim of claim.specificClaims) {
      if (specificClaim.type === 'binary' && specificClaim.description.includes('completed')) {
        // For completion claims, check if there's actual implementation
        result.expectedValues['feature_completed'] = true;
        result.actualValues['feature_completed'] = passedChecks > fileChecks * 0.8;
      }
    }

    result.score = fileChecks > 0 ? (passedChecks / fileChecks) * 100 : 0;
    result.passed = result.score >= 80 && result.issues.filter(i => i.severity === 'critical').length === 0;

    return result;
  }

  /**
   * Verify performance claims using PerformanceValidator
   */
  private async verifyPerformanceClaims(claim: AgentClaim): Promise<ValidationResult> {
    return await this.performanceValidator.validatePerformanceClaim(claim);
  }

  /**
   * Verify code analysis claims
   */
  private async verifyCodeClaims(claim: AgentClaim): Promise<ValidationResult> {
    const result: ValidationResult = {
      passed: false,
      score: 0,
      actualValues: {},
      expectedValues: {},
      deviations: [],
      issues: []
    };

    const { context } = claim;

    if (context.files && context.files.length > 0) {
      for (const filePath of context.files) {
        const fullPath = path.join(this.projectPath, filePath);
        
        if (await fs.pathExists(fullPath)) {
          const content = await fs.readFile(fullPath, 'utf-8');
          
          // Analyze code metrics
          const metrics = await this.analyzeCodeMetrics(content, filePath);
          Object.assign(result.actualValues, metrics);
          
          // Compare against before snapshot if available
          if (context.beforeSnapshot) {
            const beforeFile = context.beforeSnapshot.files.find(f => f.path === filePath);
            if (beforeFile && beforeFile.complexity !== undefined) {
              const improvement = ((beforeFile.complexity - metrics.complexity) / beforeFile.complexity) * 100;
              
              // Check against claimed improvement
              const improvementClaim = claim.specificClaims.find(c => 
                c.description.toLowerCase().includes('complexity') && c.unit === 'percentage'
              );
              
              if (improvementClaim) {
                const deviation = Math.abs(improvementClaim.claimedValue as number - improvement);
                const significant = deviation > (improvementClaim.tolerance || 5);
                
                result.deviations.push({
                  field: 'complexity_improvement',
                  expected: improvementClaim.claimedValue as number,
                  actual: improvement,
                  deviation,
                  significant,
                  explanation: `Complexity improvement: claimed ${improvementClaim.claimedValue}%, actual ${improvement.toFixed(2)}%`
                });
              }
            }
          }
        }
      }
    }

    // Run security scan if security claim
    if (claim.claimType === 'security_fix') {
      const securityResult = await this.runSecurityScan();
      Object.assign(result.actualValues, securityResult);
    }

    const significantDeviations = result.deviations.filter(d => d.significant);
    result.score = significantDeviations.length === 0 ? 100 : Math.max(0, 100 - (significantDeviations.length * 25));
    result.passed = result.score >= 75;

    return result;
  }

  /**
   * Verify test-related claims
   */
  private async verifyTestClaims(claim: AgentClaim): Promise<ValidationResult> {
    const result: ValidationResult = {
      passed: false,
      score: 0,
      actualValues: {},
      expectedValues: {},
      deviations: [],
      issues: []
    };

    try {
      // Check if tests exist and run
      const testResult = await this.runTests();
      Object.assign(result.actualValues, testResult);

      // Check for fake test patterns
      const testFiles = await this.findTestFiles();
      let fakeTestCount = 0;

      for (const testFile of testFiles) {
        const content = await fs.readFile(testFile, 'utf-8');
        const fakePatterns = this.discrepancyPatterns.get('fake_tests') || [];
        
        for (const pattern of fakePatterns) {
          if (pattern.test(content)) {
            fakeTestCount++;
            result.issues.push({
              type: 'fabrication',
              severity: 'high',
              description: `Fake test detected in ${testFile}`,
              evidence: [pattern.source],
              claimId: claim.id,
              autoFixable: true,
              impact: 'high'
            } as ValidationIssue);
          }
        }
      }

      // Validate test coverage claims
      const coverageClaim = claim.specificClaims.find(c => 
        c.description.toLowerCase().includes('coverage')
      );

      if (coverageClaim && testResult.coverage !== undefined) {
        const deviation = Math.abs((coverageClaim.claimedValue as number) - testResult.coverage);
        const significant = deviation > (coverageClaim.tolerance || 2);

        result.deviations.push({
          field: 'test_coverage',
          expected: coverageClaim.claimedValue as number,
          actual: testResult.coverage,
          deviation,
          significant,
          explanation: `Test coverage: claimed ${coverageClaim.claimedValue}%, actual ${testResult.coverage}%`
        });
      }

      result.score = fakeTestCount === 0 && result.deviations.filter(d => d.significant).length === 0 ? 100 : 50;
      result.passed = result.score >= 75;

    } catch (error: any) {
      result.issues.push({
        type: 'inconsistency',
        severity: 'high',
        description: `Test execution failed: ${error.message}`,
        claimId: claim.id,
        autoFixable: false,
        impact: 'high'
      } as ValidationIssue);
    }

    return result;
  }

  /**
   * Verify dependency update claims
   */
  private async verifyDependencyClaims(claim: AgentClaim): Promise<ValidationResult> {
    const result: ValidationResult = {
      passed: false,
      score: 0,
      actualValues: {},
      expectedValues: {},
      deviations: [],
      issues: []
    };

    const packageJsonPath = path.join(this.projectPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      const lockPath = path.join(this.projectPath, 'package-lock.json');
      
      let lockFile = null;
      if (await fs.pathExists(lockPath)) {
        lockFile = await fs.readJson(lockPath);
      }

      // Check dependency versions against claims
      for (const specificClaim of claim.specificClaims) {
        if (specificClaim.type === 'qualitative' && specificClaim.description.includes('version')) {
          // Find the dependency name from claim context
          const versionMatch = claim.description.match(/updated?\s+(.+?)\s+(?:to\s+version\s+|to\s+)(\d+\.\d+\.\d+)/i);
          
          if (versionMatch) {
            const depName = versionMatch[1];
            const claimedVersion = specificClaim.claimedValue as string;
            
            const actualVersion = packageJson.dependencies?.[depName] || 
                                packageJson.devDependencies?.[depName] ||
                                lockFile?.dependencies?.[depName]?.version;

            if (actualVersion) {
              const actualClean = actualVersion.replace(/[^\d.]/g, '');
              const matches = actualClean === claimedVersion;
              
              result.actualValues[`${depName}_version`] = actualClean;
              result.expectedValues[`${depName}_version`] = claimedVersion;

              if (!matches) {
                result.deviations.push({
                  field: `${depName}_version`,
                  expected: claimedVersion,
                  actual: actualClean,
                  deviation: 0,
                  significant: true,
                  explanation: `${depName} version mismatch`
                });
              }
            } else {
              result.issues.push({
                type: 'contradiction',
                severity: 'high',
                description: `Claimed dependency ${depName} not found in package.json`,
                claimId: claim.id,
                autoFixable: true,
                impact: 'high'
              } as ValidationIssue);
            }
          }
        }
      }

      // Run security audit
      try {
        const auditResult = await execAsync('npm audit --json', { cwd: this.projectPath });
        const audit = JSON.parse(auditResult.stdout);
        result.actualValues['vulnerability_count'] = audit.metadata?.vulnerabilities?.total || 0;
      } catch (error) {
        // Audit may fail, but that's not necessarily bad for our verification
      }
    }

    const significantDeviations = result.deviations.filter(d => d.significant);
    result.score = significantDeviations.length === 0 ? 100 : Math.max(0, 100 - (significantDeviations.length * 30));
    result.passed = result.score >= 80;

    return result;
  }

  /**
   * Verify configuration change claims
   */
  private async verifyConfigurationClaims(claim: AgentClaim): Promise<ValidationResult> {
    const result: ValidationResult = {
      passed: false,
      score: 0,
      actualValues: {},
      expectedValues: {},
      deviations: [],
      issues: []
    };

    // Check common configuration files
    const configFiles = [
      'tsconfig.json', '.eslintrc.js', '.eslintrc.json', 'prettier.config.js',
      '.prettierrc', 'webpack.config.js', 'vite.config.js', 'next.config.js'
    ];

    let configChecks = 0;
    let validConfigs = 0;

    for (const configFile of configFiles) {
      const configPath = path.join(this.projectPath, configFile);
      
      if (await fs.pathExists(configPath)) {
        configChecks++;
        
        try {
          const content = await fs.readFile(configPath, 'utf-8');
          
          // Basic validation - check if it's valid JSON/JS
          if (configFile.endsWith('.json')) {
            JSON.parse(content);
          }
          
          // Check if configuration looks reasonable (not empty, has expected structure)
          if (content.trim().length > 10) {
            validConfigs++;
          }
          
          result.actualValues[`${configFile}_valid`] = true;
          
        } catch (error) {
          result.issues.push({
            type: 'inconsistency',
            severity: 'medium',
            description: `Configuration file ${configFile} is invalid`,
            claimId: claim.id,
            autoFixable: false,
            impact: 'medium'
          } as ValidationIssue);
          
          result.actualValues[`${configFile}_valid`] = false;
        }
      }
    }

    result.score = configChecks > 0 ? (validConfigs / configChecks) * 100 : 0;
    result.passed = result.score >= 90;

    return result;
  }

  /**
   * Analyze discrepancies between claims and actual results
   */
  private async analyzeDiscrepancies(claim: AgentClaim, validation: ClaimValidation): Promise<void> {
    const { overallResult } = validation;

    // Check for exaggerated claims
    const exaggeratedPatterns = this.discrepancyPatterns.get('exaggerated_claims') || [];
    for (const pattern of exaggeratedPatterns) {
      if (pattern.test(claim.description)) {
        validation.discrepancies.push({
          id: crypto.randomUUID(),
          claimId: claim.id,
          specificClaimId: '',
          type: 'insufficient_improvement',
          severity: 'major',
          description: 'Claim contains exaggerated language',
          expected: 'realistic improvement metrics',
          actual: 'hyperbolic claims',
          impact: 'Misleading performance expectations',
          suggestedFix: 'Provide specific, measurable improvements',
          requiresRework: true
        });
      }
    }

    // Analyze significant deviations
    for (const deviation of overallResult.deviations.filter(d => d.significant)) {
      validation.discrepancies.push({
        id: crypto.randomUUID(),
        claimId: claim.id,
        specificClaimId: '',
        type: 'value_mismatch',
        severity: deviation.deviation > 50 ? 'critical' : deviation.deviation > 20 ? 'major' : 'moderate',
        description: deviation.explanation || `Significant deviation in ${deviation.field}`,
        expected: deviation.expected,
        actual: deviation.actual,
        impact: `Claim accuracy reduced by ${deviation.deviation.toFixed(1)}%`,
        requiresRework: deviation.deviation > 25
      });
    }

    // Check for missing evidence
    if (claim.evidence.length === 0) {
      validation.discrepancies.push({
        id: crypto.randomUUID(),
        claimId: claim.id,
        specificClaimId: '',
        type: 'missing_evidence',
        severity: 'moderate',
        description: 'No supporting evidence provided for claim',
        expected: 'Evidence or proof of implementation',
        actual: 'No evidence available',
        impact: 'Cannot verify claim accuracy',
        suggestedFix: 'Provide before/after comparisons, test results, or implementation details',
        requiresRework: false
      });
    }

    // Check for critical issues
    const criticalIssues = overallResult.issues.filter(i => i.severity === 'critical');
    for (const issue of criticalIssues) {
      validation.discrepancies.push({
        id: crypto.randomUUID(),
        claimId: claim.id,
        specificClaimId: '',
        type: 'contradictory_evidence',
        severity: 'critical',
        description: issue.description,
        expected: 'Working implementation',
        actual: 'Critical issues detected',
        impact: 'Implementation does not meet claimed functionality',
        requiresRework: true
      });
    }
  }

  /**
   * Calculate overall validation result
   */
  private calculateOverallResult(validation: ClaimValidation): void {
    const { tests, discrepancies } = validation;
    const { overallResult } = validation;

    if (tests.length === 0) {
      overallResult.passed = false;
      overallResult.score = 0;
      return;
    }

    // Calculate average test score
    const validTests = tests.filter(t => t.result);
    const totalScore = validTests.reduce((sum, test) => sum + (test.result?.score || 0), 0);
    const avgScore = validTests.length > 0 ? totalScore / validTests.length : 0;

    // Apply penalties for discrepancies
    const criticalDiscrepancies = discrepancies.filter(d => d.severity === 'critical').length;
    const majorDiscrepancies = discrepancies.filter(d => d.severity === 'major').length;
    const moderateDiscrepancies = discrepancies.filter(d => d.severity === 'moderate').length;

    const penalty = (criticalDiscrepancies * 40) + (majorDiscrepancies * 20) + (moderateDiscrepancies * 10);
    
    overallResult.score = Math.max(0, avgScore - penalty);
    overallResult.passed = overallResult.score >= 70 && criticalDiscrepancies === 0;
  }

  /**
   * Generate recommendations for improving claims
   */
  private generateRecommendations(claim: AgentClaim, validation: ClaimValidation): void {
    const { discrepancies, overallResult } = validation;

    if (discrepancies.length === 0 && overallResult.passed) {
      validation.recommendations.push('Claim verified successfully - no improvements needed');
      return;
    }

    // General recommendations based on issues
    if (discrepancies.some(d => d.type === 'missing_evidence')) {
      validation.recommendations.push('Provide concrete evidence for claims (before/after comparisons, metrics, test results)');
    }

    if (discrepancies.some(d => d.type === 'value_mismatch')) {
      validation.recommendations.push('Ensure claimed metrics are accurate and measurable');
    }

    if (discrepancies.some(d => d.type === 'insufficient_improvement')) {
      validation.recommendations.push('Use realistic language and avoid hyperbolic claims');
    }

    if (overallResult.issues.some(i => i.type === 'fabrication')) {
      validation.recommendations.push('Remove TODO/placeholder code and implement actual functionality');
    }

    if (overallResult.issues.some(i => i.type === 'fabrication')) {
      validation.recommendations.push('Write meaningful tests that actually verify functionality');
    }

    // Determine if rework is required
    const requiresRework = discrepancies.some(d => d.requiresRework);
    validation.retestRequired = requiresRework || overallResult.score < 50;

    if (validation.retestRequired) {
      validation.recommendations.unshift('REWORK REQUIRED: Address critical issues before re-validation');
    }
  }

  /**
   * Helper method to get validation method from strategy name
   */
  private getMethodFromStrategy(strategyName: string): ValidationMethod {
    const methodMap: Record<string, ValidationMethod> = {
      'File-based Verification': 'file_comparison',
      'Performance Testing': 'performance_benchmark',
      'Code Analysis': 'code_analysis',
      'Test Execution': 'automated_test',
      'Dependency Verification': 'integration_test',
      'Configuration Verification': 'manual_inspection'
    };

    return methodMap[strategyName] || 'manual_inspection';
  }

  /**
   * Calculate code complexity (simplified McCabe complexity)
   */
  private calculateCodeComplexity(content: string): number {
    const complexityKeywords = [
      'if', 'else if', 'while', 'for', 'do', 'switch', 'case', 
      'catch', 'try', '&&', '||', '?', ':'
    ];

    let complexity = 1; // Base complexity

    for (const keyword of complexityKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Assess code quality (simplified metrics)
   */
  private assessCodeQuality(content: string): number {
    let quality = 100;

    // Penalties for poor practices
    if (/console\.log/.test(content)) quality -= 10;
    if (/\/\/\s*TODO/.test(content)) quality -= 20;
    if (/eval\(/.test(content)) quality -= 30;
    if (content.length > 0 && content.split('\n').length / content.length > 0.05) quality -= 10; // Too many short lines

    return Math.max(0, quality);
  }

  /**
   * Analyze code metrics
   */
  private async analyzeCodeMetrics(content: string, filePath: string): Promise<Record<string, any>> {
    return {
      [`${filePath}_lines`]: content.split('\n').length,
      [`${filePath}_complexity`]: this.calculateCodeComplexity(content),
      [`${filePath}_quality`]: this.assessCodeQuality(content),
      [`${filePath}_size`]: content.length
    };
  }

  /**
   * Run security scan (simplified)
   */
  private async runSecurityScan(): Promise<Record<string, any>> {
    try {
      // This would run actual security tools in production
      const result: Record<string, any> = { 
        vulnerabilities: 0, 
        security_score: 100 
      };
      
      // Check for basic security patterns
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        
        // Check for outdated dependencies (simplified)
        const depCount = Object.keys(packageJson.dependencies || {}).length;
        result.dependency_count = depCount;
      }
      
      return result;
    } catch (error) {
      return { vulnerabilities: -1, security_score: 0, error: 'Security scan failed' };
    }
  }

  /**
   * Run tests and get results
   */
  private async runTests(): Promise<Record<string, any>> {
    try {
      const result = await execAsync('npm test -- --coverage --json', { 
        cwd: this.projectPath,
        timeout: 60000 
      });
      
      // Parse test results (this would be more sophisticated in practice)
      const testOutput = result.stdout + result.stderr;
      
      return {
        tests_run: true,
        coverage: this.extractCoverageFromOutput(testOutput),
        test_count: this.extractTestCountFromOutput(testOutput)
      };
    } catch (error: any) {
      // Tests might fail, but we still want to analyze what we can
      return {
        tests_run: false,
        test_error: error.message,
        coverage: 0,
        test_count: 0
      };
    }
  }

  /**
   * Find test files in the project
   */
  private async findTestFiles(): Promise<string[]> {
    const testFiles: string[] = [];
    
    const searchPaths = [
      path.join(this.projectPath, 'test'),
      path.join(this.projectPath, 'tests'),
      path.join(this.projectPath, '__tests__'),
      path.join(this.projectPath, 'src')
    ];

    for (const searchPath of searchPaths) {
      if (await fs.pathExists(searchPath)) {
        const files = await this.findFilesRecursive(searchPath, /\.(test|spec)\.(js|ts|jsx|tsx)$/);
        testFiles.push(...files);
      }
    }

    return testFiles;
  }

  /**
   * Find files recursively
   */
  private async findFilesRecursive(dir: string, pattern: RegExp): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          const subFiles = await this.findFilesRecursive(fullPath, pattern);
          files.push(...subFiles);
        } else if (pattern.test(item)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not be accessible
    }
    
    return files;
  }

  /**
   * Extract coverage percentage from test output
   */
  private extractCoverageFromOutput(output: string): number {
    const coverageMatch = output.match(/All files\s+\|\s+(\d+(?:\.\d+)?)/);
    if (coverageMatch) {
      return parseFloat(coverageMatch[1]);
    }
    
    // Try alternative patterns
    const altCoverageMatch = output.match(/Lines\s*:\s*(\d+(?:\.\d+)?)%/);
    if (altCoverageMatch) {
      return parseFloat(altCoverageMatch[1]);
    }
    
    return 0;
  }

  /**
   * Extract test count from test output
   */
  private extractTestCountFromOutput(output: string): number {
    const testMatch = output.match(/(\d+) (tests?|specs?) passed/);
    if (testMatch) {
      return parseInt(testMatch[1], 10);
    }
    
    return 0;
  }

  /**
   * Calculate confidence in validation result
   */
  private calculateConfidence(validation: ClaimValidation): number {
    let confidence = 50; // Base confidence

    // Higher confidence with more tests
    confidence += Math.min(validation.tests.length * 10, 30);

    // Higher confidence with multiple validation methods
    confidence += Math.min(validation.methods.length * 5, 20);

    // Lower confidence with discrepancies
    const criticalCount = validation.discrepancies.filter(d => d.severity === 'critical').length;
    const majorCount = validation.discrepancies.filter(d => d.severity === 'major').length;
    
    confidence -= criticalCount * 30;
    confidence -= majorCount * 15;

    // Higher confidence if tests pass
    if (validation.overallResult.passed) {
      confidence += 20;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Get validation result by claim ID
   */
  getValidationResult(claimId: string): ClaimValidation | undefined {
    return this.validationResults.get(claimId);
  }

  /**
   * Get all validation results
   */
  getAllValidationResults(): ClaimValidation[] {
    return Array.from(this.validationResults.values());
  }

  /**
   * Get debunking statistics
   */
  getDebunkingStatistics(): {
    totalValidations: number;
    verifiedClaims: number;
    debunkedClaims: number;
    averageConfidence: number;
    commonDiscrepancies: string[];
  } {
    const results = Array.from(this.validationResults.values());
    const verifiedCount = results.filter(r => r.overallResult.passed).length;
    const totalConfidence = results.reduce((sum, r) => sum + r.confidence, 0);
    const avgConfidence = results.length > 0 ? totalConfidence / results.length : 0;

    const discrepancyTypes = results
      .flatMap(r => r.discrepancies)
      .reduce((acc, d) => {
        acc[d.type] = (acc[d.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const commonDiscrepancies = Object.entries(discrepancyTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type]) => type);

    return {
      totalValidations: results.length,
      verifiedClaims: verifiedCount,
      debunkedClaims: results.length - verifiedCount,
      averageConfidence: avgConfidence,
      commonDiscrepancies
    };
  }

  /**
   * Clean up old validation results
   */
  async cleanup(retentionDays: number = 30): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - retentionDays);

    let cleaned = 0;
    const toRemove: string[] = [];

    for (const [claimId, validation] of this.validationResults.entries()) {
      if (validation.startTime < cutoff) {
        toRemove.push(claimId);
        cleaned++;
      }
    }

    toRemove.forEach(id => this.validationResults.delete(id));

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old validation results`);
    }

    return cleaned;
  }
}

export default ClaimDebunker;