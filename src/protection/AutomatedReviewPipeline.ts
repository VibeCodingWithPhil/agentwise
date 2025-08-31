import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  ReviewPipelineConfig,
  ReviewCheckResult,
  ReviewIssue,
  CodeQualityMetrics,
  ReviewError,
  Logger,
  PerformanceMonitor,
  FileSystem,
  GitIntegration
} from './types';

const execAsync = promisify(exec);

interface LintResult {
  filePath: string;
  messages: {
    ruleId: string;
    severity: number;
    message: string;
    line: number;
    column: number;
    nodeType: string;
    endLine?: number;
    endColumn?: number;
  }[];
}

interface TestResult {
  numFailedTests: number;
  numPassedTests: number;
  numTotalTests: number;
  testResults: {
    assertionResults: {
      ancestorTitles: string[];
      title: string;
      status: 'passed' | 'failed';
      failureMessages: string[];
    }[];
  }[];
}

interface ComplexityResult {
  complexity: number;
  loc: number;
  functions: {
    name: string;
    complexity: number;
    loc: number;
  }[];
}

export class AutomatedReviewPipeline {
  private config: ReviewPipelineConfig;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private fileSystem: FileSystem;
  private gitIntegration: GitIntegration;
  private isRunning = false;

  constructor(
    config: ReviewPipelineConfig,
    logger: Logger,
    performanceMonitor: PerformanceMonitor,
    fileSystem: FileSystem,
    gitIntegration: GitIntegration
  ) {
    this.config = config;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.fileSystem = fileSystem;
    this.gitIntegration = gitIntegration;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('ReviewPipeline is already running');
      return;
    }

    const perfId = this.performanceMonitor.start('review-pipeline-start');
    
    try {
      this.logger.info('Starting AutomatedReviewPipeline', { config: this.config });
      
      // Validate tools are available
      await this.validateRequiredTools();
      
      this.isRunning = true;
      this.logger.info('AutomatedReviewPipeline started successfully');
      
    } catch (error) {
      this.logger.error('Failed to start ReviewPipeline', { error });
      throw new ReviewError(
        'Failed to start review pipeline',
        'REVIEW_PIPELINE_START_FAILED',
        { error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      this.performanceMonitor.end(perfId);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('ReviewPipeline is not running');
      return;
    }

    this.logger.info('Stopping AutomatedReviewPipeline');
    this.isRunning = false;
    this.logger.info('AutomatedReviewPipeline stopped successfully');
  }

  private async validateRequiredTools(): Promise<void> {
    const tools = [
      { command: 'node --version', name: 'Node.js' },
      { command: 'npm --version', name: 'npm' }
    ];

    for (const tool of tools) {
      try {
        await execAsync(tool.command);
      } catch (error) {
        throw new ReviewError(
          `Required tool not available: ${tool.name}`,
          'TOOL_NOT_AVAILABLE',
          { tool: tool.name }
        );
      }
    }
  }

  async reviewChanges(filePaths?: string[]): Promise<ReviewCheckResult> {
    if (!this.isRunning) {
      throw new ReviewError('Review pipeline is not running', 'PIPELINE_NOT_RUNNING');
    }

    const perfId = this.performanceMonitor.start('review-changes');
    
    try {
      this.logger.info('Starting code review', { filePaths: filePaths?.length || 'all changed files' });
      
      // Get files to review
      const reviewFiles = filePaths || await this.gitIntegration.getChangedFiles();
      
      if (reviewFiles.length === 0) {
        this.logger.info('No files to review');
        return this.createEmptyResult();
      }
      
      const issues: ReviewIssue[] = [];
      let metrics: CodeQualityMetrics = this.initializeMetrics();
      
      // Run enabled checks
      if (this.config.checks.quality) {
        const qualityIssues = await this.checkCodeQuality(reviewFiles);
        issues.push(...qualityIssues);
      }
      
      if (this.config.checks.security) {
        const securityIssues = await this.checkSecurity(reviewFiles);
        issues.push(...securityIssues);
      }
      
      if (this.config.checks.performance) {
        const perfIssues = await this.checkPerformance(reviewFiles);
        issues.push(...perfIssues);
      }
      
      if (this.config.checks.testCoverage) {
        const testCoverageResult = await this.checkTestCoverage(reviewFiles);
        metrics.testCoverage = testCoverageResult.coverage;
        issues.push(...testCoverageResult.issues);
      }
      
      if (this.config.checks.style) {
        const styleIssues = await this.checkStyle(reviewFiles);
        issues.push(...styleIssues);
      }
      
      // Calculate overall metrics
      metrics = await this.calculateMetrics(reviewFiles, issues);
      
      // Calculate score
      const score = this.calculateScore(metrics, issues);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics, issues);
      
      const result: ReviewCheckResult = {
        passed: score >= this.config.minimumScore && this.checkThresholds(metrics),
        score,
        issues,
        metrics,
        recommendations
      };
      
      this.logger.info('Code review completed', { 
        score, 
        passed: result.passed,
        issueCount: issues.length,
        files: reviewFiles.length
      });
      
      // Block on failure if configured
      if (this.config.blockOnFailure && !result.passed) {
        throw new ReviewError(
          `Review failed - score: ${score}, minimum required: ${this.config.minimumScore}`,
          'REVIEW_FAILED',
          { score, minimumScore: this.config.minimumScore, issues: issues.length }
        );
      }
      
      return result;
      
    } catch (error) {
      this.logger.error('Code review failed', { error });
      if (error instanceof ReviewError) {
        throw error;
      }
      throw new ReviewError(
        'Code review failed',
        'REVIEW_EXECUTION_FAILED',
        { error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      this.performanceMonitor.end(perfId);
    }
  }

  private async checkCodeQuality(files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    try {
      // Run ESLint if available
      if (await this.fileSystem.exists('.eslintrc.js') || await this.fileSystem.exists('.eslintrc.json')) {
        const lintIssues = await this.runESLint(files);
        issues.push(...lintIssues);
      }
      
      // Check complexity
      const complexityIssues = await this.checkComplexity(files);
      issues.push(...complexityIssues);
      
      // Check maintainability
      const maintainabilityIssues = await this.checkMaintainability(files);
      issues.push(...maintainabilityIssues);
      
    } catch (error) {
      this.logger.error('Code quality check failed', { error });
      issues.push({
        type: 'quality',
        severity: 'error',
        file: 'pipeline',
        line: 0,
        message: `Code quality check failed: ${error instanceof Error ? error.message : String(error)}`,
        rule: 'pipeline-error',
        fixable: false
      });
    }
    
    return issues;
  }

  private async runESLint(files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    try {
      const tsFiles = files.filter(f => f.endsWith('.ts') || f.endsWith('.js') || f.endsWith('.tsx') || f.endsWith('.jsx'));
      
      if (tsFiles.length === 0) return issues;
      
      const command = `npx eslint --format json ${tsFiles.map(f => `"${f}"`).join(' ')}`;
      
      try {
        const { stdout } = await execAsync(command);
        const results: LintResult[] = JSON.parse(stdout);
        
        results.forEach(result => {
          result.messages.forEach(message => {
            issues.push({
              type: 'quality',
              severity: message.severity === 2 ? 'error' : 'warning',
              file: result.filePath,
              line: message.line,
              message: message.message,
              rule: message.ruleId || 'unknown',
              fixable: false // ESLint fixable info not easily accessible here
            });
          });
        });
      } catch (execError) {
        // ESLint returns non-zero exit code when issues found, but still outputs JSON
        if (execError && typeof execError === 'object' && 'stdout' in execError && execError.stdout) {
          const results: LintResult[] = JSON.parse(execError.stdout as string);
          results.forEach(result => {
            result.messages.forEach(message => {
              issues.push({
                type: 'quality',
                severity: message.severity === 2 ? 'error' : 'warning',
                file: result.filePath,
                line: message.line,
                message: message.message,
                rule: message.ruleId || 'unknown',
                fixable: false
              });
            });
          });
        }
      }
    } catch (error) {
      this.logger.warn('ESLint check failed', { error: error instanceof Error ? error.message : String(error) });
    }
    
    return issues;
  }

  private async checkComplexity(files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    for (const file of files) {
      try {
        if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
        
        const content = await this.fileSystem.read(file);
        const complexity = this.calculateCyclomaticComplexity(content);
        
        if (complexity > this.config.thresholds.complexity) {
          issues.push({
            type: 'quality',
            severity: 'warning',
            file,
            line: 1,
            message: `High cyclomatic complexity: ${complexity} (threshold: ${this.config.thresholds.complexity})`,
            rule: 'complexity-threshold',
            fixable: false
          });
        }
      } catch (error) {
        this.logger.warn('Complexity check failed for file', { file, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    return issues;
  }

  private calculateCyclomaticComplexity(content: string): number {
    // Simple cyclomatic complexity calculation
    const complexityKeywords = [
      /\bif\b/g,
      /\belse\s+if\b/g,
      /\bwhile\b/g,
      /\bfor\b/g,
      /\bswitch\b/g,
      /\bcase\b/g,
      /\bcatch\b/g,
      /\b&&\b/g,
      /\b\|\|\b/g,
      /\?\s*.*\s*:/g // ternary operator
    ];
    
    let complexity = 1; // Base complexity
    
    complexityKeywords.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }

  private async checkMaintainability(files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    for (const file of files) {
      try {
        const content = await this.fileSystem.read(file);
        
        // Check for code smells
        const smells = this.detectCodeSmells(content, file);
        issues.push(...smells);
        
        // Check for duplicated code
        const duplicates = await this.detectDuplicatedCode(content, file);
        issues.push(...duplicates);
        
      } catch (error) {
        this.logger.warn('Maintainability check failed for file', { file, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    return issues;
  }

  private detectCodeSmells(content: string, filePath: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Long line
      if (line.length > 120) {
        issues.push({
          type: 'quality',
          severity: 'info',
          file: filePath,
          line: lineNumber,
          message: `Line too long: ${line.length} characters (recommended: 120)`,
          rule: 'max-line-length',
          fixable: false
        });
      }
      
      // Magic numbers
      const magicNumberPattern = /\b(?!0|1|2|10|100|1000)\d{2,}\b/g;
      if (magicNumberPattern.test(line)) {
        issues.push({
          type: 'quality',
          severity: 'warning',
          file: filePath,
          line: lineNumber,
          message: 'Potential magic number found, consider using named constants',
          rule: 'no-magic-numbers',
          fixable: false
        });
      }
      
      // TODO comments
      if (/TODO|FIXME|HACK/i.test(line)) {
        issues.push({
          type: 'quality',
          severity: 'info',
          file: filePath,
          line: lineNumber,
          message: 'TODO comment found',
          rule: 'no-todo',
          fixable: false
        });
      }
    });
    
    return issues;
  }

  private async detectDuplicatedCode(content: string, filePath: string): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    // Simple duplicate detection - look for repeated blocks of 5+ lines
    const lines = content.split('\n');
    const minBlockSize = 5;
    
    for (let i = 0; i < lines.length - minBlockSize; i++) {
      const block = lines.slice(i, i + minBlockSize).join('\n');
      const blockHash = this.hashString(block);
      
      // Look for the same block later in the file
      for (let j = i + minBlockSize; j < lines.length - minBlockSize; j++) {
        const otherBlock = lines.slice(j, j + minBlockSize).join('\n');
        const otherHash = this.hashString(otherBlock);
        
        if (blockHash === otherHash) {
          issues.push({
            type: 'quality',
            severity: 'warning',
            file: filePath,
            line: i + 1,
            message: `Duplicated code block found (also at line ${j + 1})`,
            rule: 'no-duplicate-code',
            fixable: false
          });
          break;
        }
      }
    }
    
    return issues;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private async checkSecurity(files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    for (const file of files) {
      try {
        const content = await this.fileSystem.read(file);
        
        // Basic security checks
        const securityIssues = this.detectSecurityIssues(content, file);
        issues.push(...securityIssues);
        
      } catch (error) {
        this.logger.warn('Security check failed for file', { file, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    return issues;
  }

  private detectSecurityIssues(content: string, filePath: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    const securityPatterns = [
      {
        pattern: /eval\s*\(/gi,
        message: 'Use of eval() is dangerous and should be avoided',
        severity: 'error' as const
      },
      {
        pattern: /document\.write\s*\(/gi,
        message: 'document.write() can be dangerous and should be avoided',
        severity: 'warning' as const
      },
      {
        pattern: /innerHTML\s*=\s*.*\+/gi,
        message: 'Dynamic innerHTML assignment can lead to XSS vulnerabilities',
        severity: 'warning' as const
      },
      {
        pattern: /password\s*[:=]\s*["'][^"']*["']/gi,
        message: 'Hardcoded password detected',
        severity: 'critical' as const
      }
    ];
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      securityPatterns.forEach(({ pattern, message, severity }) => {
        if (pattern.test(line)) {
          issues.push({
            type: 'security',
            severity,
            file: filePath,
            line: lineNumber,
            message,
            rule: 'security-check',
            fixable: false
          });
        }
      });
    });
    
    return issues;
  }

  private async checkPerformance(files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    for (const file of files) {
      try {
        const content = await this.fileSystem.read(file);
        
        // Performance checks
        const perfIssues = this.detectPerformanceIssues(content, file);
        issues.push(...perfIssues);
        
      } catch (error) {
        this.logger.warn('Performance check failed for file', { file, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    return issues;
  }

  private detectPerformanceIssues(content: string, filePath: string): ReviewIssue[] {
    const issues: ReviewIssue[] = [];
    const lines = content.split('\n');
    
    const performancePatterns = [
      {
        pattern: /for\s*\([^)]*\)\s*{[^}]*for\s*\(/gi,
        message: 'Nested loops detected - consider optimizing algorithm complexity',
        severity: 'warning' as const
      },
      {
        pattern: /\.forEach\s*\([^)]*\)\s*{[^}]*\.forEach\s*\(/gi,
        message: 'Nested forEach detected - consider using more efficient iteration',
        severity: 'info' as const
      },
      {
        pattern: /new\s+RegExp\s*\(/gi,
        message: 'Dynamic RegExp creation in loop context can be expensive',
        severity: 'info' as const
      }
    ];
    
    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      performancePatterns.forEach(({ pattern, message, severity }) => {
        if (pattern.test(line)) {
          issues.push({
            type: 'performance',
            severity,
            file: filePath,
            line: lineNumber,
            message,
            rule: 'performance-check',
            fixable: false
          });
        }
      });
    });
    
    return issues;
  }

  private async checkTestCoverage(files: string[]): Promise<{ coverage: number; issues: ReviewIssue[] }> {
    const issues: ReviewIssue[] = [];
    let coverage = 0;
    
    try {
      // Check if Jest is configured
      if (await this.fileSystem.exists('jest.config.js') || await this.fileSystem.exists('package.json')) {
        const { stdout } = await execAsync('npm test -- --coverage --watchAll=false --passWithNoTests');
        
        // Parse coverage from output (simplified)
        const coverageMatch = stdout.match(/All files[^|]*\|[^|]*\|\s*(\d+\.?\d*)/);
        if (coverageMatch) {
          coverage = parseFloat(coverageMatch[1]);
        }
        
        if (coverage < this.config.thresholds.coverage) {
          issues.push({
            type: 'test',
            severity: 'warning',
            file: 'project',
            line: 1,
            message: `Test coverage ${coverage}% is below threshold ${this.config.thresholds.coverage}%`,
            rule: 'coverage-threshold',
            fixable: false
          });
        }
      }
    } catch (error) {
      this.logger.warn('Test coverage check failed', { error: error instanceof Error ? error.message : String(error) });
      issues.push({
        type: 'test',
        severity: 'warning',
        file: 'project',
        line: 1,
        message: 'Unable to determine test coverage',
        rule: 'coverage-check-failed',
        fixable: false
      });
    }
    
    return { coverage, issues };
  }

  private async checkStyle(files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    try {
      // Check if Prettier is configured
      if (await this.fileSystem.exists('.prettierrc') || await this.fileSystem.exists('prettier.config.js')) {
        const prettierIssues = await this.runPrettier(files);
        issues.push(...prettierIssues);
      }
    } catch (error) {
      this.logger.warn('Style check failed', { error: error instanceof Error ? error.message : String(error) });
    }
    
    return issues;
  }

  private async runPrettier(files: string[]): Promise<ReviewIssue[]> {
    const issues: ReviewIssue[] = [];
    
    try {
      const relevantFiles = files.filter(f => 
        f.endsWith('.ts') || f.endsWith('.js') || 
        f.endsWith('.tsx') || f.endsWith('.jsx') ||
        f.endsWith('.json') || f.endsWith('.css')
      );
      
      if (relevantFiles.length === 0) return issues;
      
      for (const file of relevantFiles) {
        try {
          const { stdout } = await execAsync(`npx prettier --check "${file}"`);
          // No issues if prettier doesn't complain
        } catch (error) {
          if (error instanceof Error ? error.message : String(error).includes('needs to be formatted')) {
            issues.push({
              type: 'style',
              severity: 'warning',
              file,
              line: 1,
              message: 'File is not formatted according to Prettier rules',
              rule: 'prettier',
              fixable: true
            });
          }
        }
      }
    } catch (error) {
      this.logger.warn('Prettier check failed', { error: error instanceof Error ? error.message : String(error) });
    }
    
    return issues;
  }

  private async calculateMetrics(files: string[], issues: ReviewIssue[]): Promise<CodeQualityMetrics> {
    let totalComplexity = 0;
    let totalLoc = 0;
    let totalTechnicalDebt = 0;
    
    for (const file of files) {
      try {
        if (!file.endsWith('.ts') && !file.endsWith('.js')) continue;
        
        const content = await this.fileSystem.read(file);
        const complexity = this.calculateCyclomaticComplexity(content);
        const loc = content.split('\n').length;
        
        totalComplexity += complexity;
        totalLoc += loc;
        
        // Estimate technical debt based on issues
        const fileIssues = issues.filter(i => i.file === file);
        totalTechnicalDebt += fileIssues.length * 15; // 15 minutes per issue
        
      } catch (error) {
        this.logger.warn('Error calculating metrics for file', { file, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    const avgComplexity = files.length > 0 ? totalComplexity / files.length : 0;
    const maintainability = Math.max(0, 100 - avgComplexity - (issues.length * 2));
    const duplicateIssues = issues.filter(i => i.rule === 'no-duplicate-code').length;
    
    return {
      complexity: avgComplexity,
      maintainability,
      testCoverage: 0, // Set by test coverage check
      duplicateLines: duplicateIssues * 10, // Estimate
      linesOfCode: totalLoc,
      technicalDebt: totalTechnicalDebt,
      securityScore: Math.max(0, 100 - (issues.filter(i => i.type === 'security').length * 10))
    };
  }

  private calculateScore(metrics: CodeQualityMetrics, issues: ReviewIssue[]): number {
    let score = 100;
    
    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'error':
          score -= 10;
          break;
        case 'warning':
          score -= 5;
          break;
        case 'info':
          score -= 1;
          break;
      }
    });
    
    // Deduct points for poor metrics
    if (metrics.complexity > this.config.thresholds.complexity) {
      score -= 10;
    }
    
    if (metrics.testCoverage < this.config.thresholds.coverage) {
      score -= 15;
    }
    
    if (metrics.maintainability < this.config.thresholds.maintainability) {
      score -= 10;
    }
    
    if (metrics.securityScore < this.config.thresholds.security) {
      score -= 20;
    }
    
    return Math.max(0, score);
  }

  private checkThresholds(metrics: CodeQualityMetrics): boolean {
    return (
      metrics.complexity <= this.config.thresholds.complexity &&
      metrics.testCoverage >= this.config.thresholds.coverage &&
      metrics.maintainability >= this.config.thresholds.maintainability &&
      metrics.securityScore >= this.config.thresholds.security
    );
  }

  private generateRecommendations(metrics: CodeQualityMetrics, issues: ReviewIssue[]): string[] {
    const recommendations: string[] = [];
    
    if (metrics.complexity > this.config.thresholds.complexity) {
      recommendations.push('Consider breaking down complex functions into smaller, more manageable pieces');
    }
    
    if (metrics.testCoverage < this.config.thresholds.coverage) {
      recommendations.push('Increase test coverage by adding unit tests for uncovered code paths');
    }
    
    if (metrics.maintainability < this.config.thresholds.maintainability) {
      recommendations.push('Improve code maintainability by reducing complexity and fixing code smells');
    }
    
    if (metrics.securityScore < this.config.thresholds.security) {
      recommendations.push('Address security vulnerabilities to improve overall security posture');
    }
    
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    if (criticalIssues > 0) {
      recommendations.push(`Fix ${criticalIssues} critical issue(s) immediately`);
    }
    
    const errorIssues = issues.filter(i => i.severity === 'error').length;
    if (errorIssues > 0) {
      recommendations.push(`Address ${errorIssues} error(s) before proceeding`);
    }
    
    const fixableIssues = issues.filter(i => i.fixable).length;
    if (fixableIssues > 0) {
      recommendations.push(`${fixableIssues} issue(s) can be automatically fixed`);
    }
    
    return recommendations;
  }

  private createEmptyResult(): ReviewCheckResult {
    return {
      passed: true,
      score: 100,
      issues: [],
      metrics: this.initializeMetrics(),
      recommendations: []
    };
  }

  private initializeMetrics(): CodeQualityMetrics {
    return {
      complexity: 0,
      maintainability: 100,
      testCoverage: 0,
      duplicateLines: 0,
      linesOfCode: 0,
      technicalDebt: 0,
      securityScore: 100
    };
  }

  // Public API methods
  async fixIssues(fixableOnly: boolean = true): Promise<number> {
    if (!this.isRunning) {
      throw new ReviewError('Review pipeline is not running', 'PIPELINE_NOT_RUNNING');
    }

    let fixedCount = 0;
    
    try {
      // Run Prettier to fix style issues
      if (await this.fileSystem.exists('.prettierrc') || await this.fileSystem.exists('prettier.config.js')) {
        try {
          await execAsync('npx prettier --write .');
          fixedCount += 1;
          this.logger.info('Applied Prettier formatting');
        } catch (error) {
          this.logger.warn('Prettier fix failed', { error: error instanceof Error ? error.message : String(error) });
        }
      }
      
      // Run ESLint auto-fix
      if (await this.fileSystem.exists('.eslintrc.js') || await this.fileSystem.exists('.eslintrc.json')) {
        try {
          await execAsync('npx eslint --fix .');
          fixedCount += 1;
          this.logger.info('Applied ESLint fixes');
        } catch (error) {
          this.logger.warn('ESLint fix failed', { error: error instanceof Error ? error.message : String(error) });
        }
      }
      
    } catch (error) {
      this.logger.error('Error fixing issues', { error });
    }
    
    return fixedCount;
  }

  getStatus(): {
    isRunning: boolean;
    lastReview: Date | null;
    config: ReviewPipelineConfig;
  } {
    return {
      isRunning: this.isRunning,
      lastReview: null, // Could be tracked if needed
      config: this.config
    };
  }

  async updateConfig(newConfig: Partial<ReviewPipelineConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    this.logger.info('ReviewPipeline configuration updated', { config: this.config });
  }
}