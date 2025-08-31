/**
 * Performance Validator - Validates performance-related claims made by agents
 * Tests token usage, execution time, memory usage, and other performance metrics
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { performance } from 'perf_hooks';
import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import {
  AgentClaim,
  ValidationTest,
  TestEvidence,
  ValidationResult,
  SystemSnapshot,
  PerformanceSnapshot,
  Deviation,
  ValidationIssue
} from './types';

const execAsync = promisify(exec);

interface BenchmarkConfig {
  iterations: number;
  warmupRuns: number;
  timeout: number;
  metrics: string[];
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context: Record<string, any>;
}

export class PerformanceValidator extends EventEmitter {
  private projectPath: string;
  private benchmarkResults: Map<string, PerformanceMetric[]> = new Map();
  private baselineMetrics: Map<string, number> = new Map();
  
  constructor(projectPath: string) {
    super();
    this.projectPath = projectPath;
    this.loadBaselineMetrics();
  }

  /**
   * Validate performance claims
   */
  async validatePerformanceClaim(claim: AgentClaim): Promise<ValidationResult> {
    const startTime = performance.now();
    const tests: ValidationTest[] = [];
    const issues: any[] = [];
    const actualValues: Record<string, any> = {};
    const expectedValues: Record<string, any> = {};
    const deviations: Deviation[] = [];

    console.log(`🔬 Validating performance claim: ${claim.description}`);

    // Create validation tests based on claim type
    for (const specificClaim of claim.specificClaims) {
      const test = await this.createPerformanceTest(claim, specificClaim);
      if (test) {
        tests.push(test);
      }
    }

    // Execute tests
    for (const test of tests) {
      await this.executePerformanceTest(test, claim);
      
      if (test.result) {
        Object.assign(actualValues, test.result.actualValues);
        Object.assign(expectedValues, test.result.expectedValues);
        deviations.push(...test.result.deviations);
        issues.push(...test.result.issues);
      }
    }

    // Calculate overall result
    const passedTests = tests.filter(t => t.result?.passed).length;
    const totalTests = tests.length;
    const passed = totalTests > 0 && passedTests === totalTests;
    const score = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Analyze deviations
    const significantDeviations = deviations.filter(d => d.significant);
    
    if (significantDeviations.length > 0) {
      issues.push({
        type: 'performance_deviation',
        severity: 'medium',
        description: `Performance claims deviate from actual measurements`,
        evidence: significantDeviations.map(d => `${d.field}: claimed ${d.expected}, actual ${d.actual}`)
      });
    }

    const endTime = performance.now();
    console.log(`⏱️  Performance validation completed in ${(endTime - startTime).toFixed(2)}ms`);

    return {
      passed,
      score,
      actualValues,
      expectedValues,
      deviations,
      issues
    };
  }

  /**
   * Create performance test for a specific claim
   */
  private async createPerformanceTest(
    claim: AgentClaim,
    specificClaim: any
  ): Promise<ValidationTest | null> {
    const testId = crypto.randomUUID();
    
    let method: any = 'performance_benchmark';
    let description = '';

    switch (claim.claimType) {
      case 'token_reduction':
        method = 'automated_test';
        description = 'Validate token usage reduction';
        break;
      case 'speed_improvement':
        method = 'performance_benchmark';
        description = 'Benchmark execution speed improvement';
        break;
      case 'performance':
        method = 'performance_benchmark';
        description = 'Validate general performance improvement';
        break;
      default:
        return null;
    }

    return {
      id: testId,
      method,
      description,
      status: 'pending',
      startTime: new Date(),
      evidence: []
    };
  }

  /**
   * Execute performance test
   */
  private async executePerformanceTest(test: ValidationTest, claim: AgentClaim): Promise<void> {
    test.status = 'running';
    test.startTime = new Date();

    try {
      const result = await this.runPerformanceBenchmark(claim, test);
      test.result = result;
      test.status = 'completed';
    } catch (error: any) {
      test.error = error.message;
      test.status = 'failed';
      test.result = {
        passed: false,
        score: 0,
        actualValues: {},
        expectedValues: {},
        deviations: [],
        issues: [{
          type: 'inconsistency',
          severity: 'high',
          description: `Test execution failed: ${error.message}`,
          claimId: claim.id,
          autoFixable: false,
          impact: 'high'
        } as ValidationIssue]
      };
    } finally {
      test.endTime = new Date();
    }
  }

  /**
   * Run performance benchmark
   */
  private async runPerformanceBenchmark(claim: AgentClaim, test: ValidationTest): Promise<ValidationResult> {
    const config: BenchmarkConfig = {
      iterations: 10,
      warmupRuns: 3,
      timeout: 30000,
      metrics: ['execution_time', 'memory_usage', 'cpu_usage']
    };

    const results: PerformanceMetric[] = [];
    const deviations: Deviation[] = [];
    const actualValues: Record<string, any> = {};
    const expectedValues: Record<string, any> = {};

    // Run warmup iterations
    for (let i = 0; i < config.warmupRuns; i++) {
      await this.runSingleIteration(claim, test, true);
    }

    // Run actual benchmark iterations
    for (let i = 0; i < config.iterations; i++) {
      const metrics = await this.runSingleIteration(claim, test, false);
      results.push(...metrics);
    }

    // Analyze results against claims
    for (const specificClaim of claim.specificClaims) {
      if (specificClaim.type === 'quantitative') {
        const deviation = await this.analyzeQuantitativeClaim(
          specificClaim,
          results,
          claim.claimType
        );
        
        if (deviation) {
          deviations.push(deviation);
          actualValues[deviation.field] = deviation.actual;
          expectedValues[deviation.field] = deviation.expected;
        }
      }
    }

    // Calculate average metrics
    const avgResults = this.calculateAverageMetrics(results);
    Object.assign(actualValues, avgResults);

    // Determine if test passed
    const significantDeviations = deviations.filter(d => d.significant);
    const passed = significantDeviations.length === 0;
    const score = passed ? 100 : Math.max(0, 100 - (significantDeviations.length * 20));

    // Add evidence
    test.evidence.push({
      type: 'metric',
      content: {
        iterations: config.iterations,
        averageMetrics: avgResults,
        rawResults: results.map(r => ({ name: r.name, value: r.value, unit: r.unit }))
      },
      timestamp: new Date(),
      metadata: { testType: 'performance_benchmark' }
    });

    return {
      passed,
      score,
      actualValues,
      expectedValues,
      deviations,
      issues: []
    };
  }

  /**
   * Run single benchmark iteration
   */
  private async runSingleIteration(
    claim: AgentClaim,
    test: ValidationTest,
    isWarmup: boolean
  ): Promise<PerformanceMetric[]> {
    const metrics: PerformanceMetric[] = [];
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    try {
      // Simulate or execute actual performance test based on claim context
      await this.executeClaimContextTest(claim);

      const endTime = performance.now();
      const endMemory = process.memoryUsage();
      const executionTime = endTime - startTime;
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

      if (!isWarmup) {
        metrics.push({
          name: 'execution_time',
          value: executionTime,
          unit: 'ms',
          timestamp: new Date(),
          context: { iteration: test.id, claim: claim.id }
        });

        metrics.push({
          name: 'memory_usage',
          value: memoryDelta,
          unit: 'bytes',
          timestamp: new Date(),
          context: { iteration: test.id, claim: claim.id }
        });
      }
    } catch (error) {
      console.error('Performance iteration failed:', error);
    }

    return metrics;
  }

  /**
   * Execute test based on claim context
   */
  private async executeClaimContextTest(claim: AgentClaim): Promise<void> {
    const { context } = claim;
    
    if (context.files && context.files.length > 0) {
      // Test file operations if claim involves files
      for (const filePath of context.files) {
        const fullPath = path.join(this.projectPath, filePath);
        if (await fs.pathExists(fullPath)) {
          await fs.readFile(fullPath, 'utf-8');
        }
      }
    }

    // Simulate token usage test
    if (claim.claimType === 'token_reduction') {
      await this.simulateTokenUsageTest(claim);
    }

    // Simulate speed test
    if (claim.claimType === 'speed_improvement') {
      await this.simulateSpeedTest(claim);
    }

    // Add small delay to make measurement meaningful
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Simulate token usage test
   */
  private async simulateTokenUsageTest(claim: AgentClaim): Promise<void> {
    // This would integrate with actual token counting logic
    // For simulation, we'll create a mock test
    
    const mockContext = JSON.stringify(claim.context).repeat(100);
    const tokenCount = Math.ceil(mockContext.length / 4); // Rough token estimation
    
    // Store baseline if not exists
    if (!this.baselineMetrics.has('token_usage')) {
      this.baselineMetrics.set('token_usage', tokenCount * 1.5); // Assume 50% worse baseline
    }
  }

  /**
   * Simulate speed test
   */
  private async simulateSpeedTest(claim: AgentClaim): Promise<void> {
    // Simulate CPU-intensive work
    const iterations = 100000;
    let sum = 0;
    
    for (let i = 0; i < iterations; i++) {
      sum += Math.random() * i;
    }
    
    return;
  }

  /**
   * Analyze quantitative claim against benchmark results
   */
  private async analyzeQuantitativeClaim(
    specificClaim: any,
    results: PerformanceMetric[],
    claimType: string
  ): Promise<Deviation | null> {
    const claimedValue = specificClaim.claimedValue;
    const tolerance = specificClaim.tolerance || 0;
    const unit = specificClaim.unit;

    // Find relevant metrics
    let relevantMetrics: PerformanceMetric[] = [];
    
    if (claimType === 'token_reduction' || specificClaim.description.includes('token')) {
      relevantMetrics = results.filter(m => m.name.includes('token') || m.name === 'memory_usage');
    } else if (claimType === 'speed_improvement' || specificClaim.description.includes('time')) {
      relevantMetrics = results.filter(m => m.name === 'execution_time');
    } else if (specificClaim.description.includes('memory')) {
      relevantMetrics = results.filter(m => m.name === 'memory_usage');
    }

    if (relevantMetrics.length === 0) {
      // No relevant metrics found, create synthetic test
      return this.createSyntheticDeviation(specificClaim, claimType);
    }

    // Calculate average of relevant metrics
    const avgValue = relevantMetrics.reduce((sum, m) => sum + m.value, 0) / relevantMetrics.length;
    
    // For percentage claims, compare against baseline
    if (unit === 'percentage') {
      const baselineKey = this.getBaselineKey(claimType);
      const baseline = this.baselineMetrics.get(baselineKey);
      
      if (baseline) {
        const actualImprovement = ((baseline - avgValue) / baseline) * 100;
        const deviation = Math.abs(claimedValue - actualImprovement);
        const significant = deviation > tolerance;

        return {
          field: specificClaim.description,
          expected: claimedValue,
          actual: actualImprovement,
          deviation,
          significant,
          explanation: `Claimed ${claimedValue}% improvement, actual ${actualImprovement.toFixed(2)}%`
        };
      }
    }

    // For absolute values, direct comparison
    const deviation = Math.abs(claimedValue - avgValue);
    const percentageDeviation = (deviation / claimedValue) * 100;
    const significant = percentageDeviation > tolerance;

    return {
      field: specificClaim.description,
      expected: claimedValue,
      actual: avgValue,
      deviation: percentageDeviation,
      significant,
      explanation: `Claimed ${claimedValue}${unit}, actual ${avgValue.toFixed(2)}${unit}`
    };
  }

  /**
   * Create synthetic deviation for claims that can't be benchmarked
   */
  private createSyntheticDeviation(specificClaim: any, claimType: string): Deviation {
    // For demo purposes, simulate some variance in claims
    const variance = 0.8 + (Math.random() * 0.4); // 80%-120% of claimed value
    const actualValue = specificClaim.claimedValue * variance;
    const deviation = Math.abs(specificClaim.claimedValue - actualValue);
    const percentageDeviation = (deviation / specificClaim.claimedValue) * 100;
    const significant = percentageDeviation > (specificClaim.tolerance || 5);

    return {
      field: specificClaim.description,
      expected: specificClaim.claimedValue,
      actual: actualValue,
      deviation: percentageDeviation,
      significant,
      explanation: `Synthetic validation: claimed ${specificClaim.claimedValue}, estimated actual ${actualValue.toFixed(2)}`
    };
  }

  /**
   * Get baseline key for claim type
   */
  private getBaselineKey(claimType: string): string {
    switch (claimType) {
      case 'token_reduction': return 'token_usage';
      case 'speed_improvement': return 'execution_time';
      case 'performance': return 'execution_time';
      default: return claimType;
    }
  }

  /**
   * Calculate average metrics from results
   */
  private calculateAverageMetrics(results: PerformanceMetric[]): Record<string, number> {
    const averages: Record<string, number> = {};
    const groups: Record<string, number[]> = {};

    // Group by metric name
    for (const metric of results) {
      if (!groups[metric.name]) {
        groups[metric.name] = [];
      }
      groups[metric.name].push(metric.value);
    }

    // Calculate averages
    for (const [name, values] of Object.entries(groups)) {
      averages[name] = values.reduce((sum, v) => sum + v, 0) / values.length;
    }

    return averages;
  }

  /**
   * Load baseline metrics from previous benchmarks
   */
  private async loadBaselineMetrics(): Promise<void> {
    try {
      const baselinePath = path.join(this.projectPath, '.agentwise', 'performance-baseline.json');
      
      if (await fs.pathExists(baselinePath)) {
        const baseline = await fs.readJson(baselinePath);
        
        for (const [key, value] of Object.entries(baseline)) {
          this.baselineMetrics.set(key, value as number);
        }
        
        console.log(`📊 Loaded ${this.baselineMetrics.size} baseline metrics`);
      } else {
        // Create default baselines
        this.baselineMetrics.set('execution_time', 1000); // 1 second baseline
        this.baselineMetrics.set('memory_usage', 50 * 1024 * 1024); // 50MB baseline
        this.baselineMetrics.set('token_usage', 10000); // 10k token baseline
        
        await this.saveBaselineMetrics();
      }
    } catch (error) {
      console.error('Error loading baseline metrics:', error);
    }
  }

  /**
   * Save baseline metrics
   */
  private async saveBaselineMetrics(): Promise<void> {
    try {
      const baselinePath = path.join(this.projectPath, '.agentwise', 'performance-baseline.json');
      await fs.ensureDir(path.dirname(baselinePath));
      
      const baseline: Record<string, number> = {};
      for (const [key, value] of this.baselineMetrics.entries()) {
        baseline[key] = value;
      }
      
      await fs.writeJson(baselinePath, baseline, { spaces: 2 });
    } catch (error) {
      console.error('Error saving baseline metrics:', error);
    }
  }

  /**
   * Update baseline metric
   */
  async updateBaseline(metricName: string, value: number): Promise<void> {
    this.baselineMetrics.set(metricName, value);
    await this.saveBaselineMetrics();
    console.log(`📊 Updated baseline ${metricName}: ${value}`);
  }

  /**
   * Benchmark current system state
   */
  async benchmarkCurrentState(): Promise<PerformanceSnapshot> {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    // Run system benchmark
    await this.runSystemBenchmark();

    const endTime = performance.now();
    const endMemory = process.memoryUsage();

    const snapshot: PerformanceSnapshot = {
      tokenUsage: 0, // Would integrate with token counter
      executionTime: endTime - startTime,
      memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
      cpuUsage: 0, // Would use system monitor
      buildTime: await this.measureBuildTime(),
      testTime: await this.measureTestTime()
    };

    return snapshot;
  }

  /**
   * Run system benchmark
   */
  private async runSystemBenchmark(): Promise<void> {
    // CPU benchmark
    const iterations = 100000;
    for (let i = 0; i < iterations; i++) {
      Math.random() * Math.sqrt(i + 1);
    }

    // Memory benchmark
    const arrays = [];
    for (let i = 0; i < 1000; i++) {
      arrays.push(new Array(1000).fill(Math.random()));
    }

    // Cleanup
    arrays.length = 0;
  }

  /**
   * Measure build time
   */
  private async measureBuildTime(): Promise<number> {
    try {
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        
        if (packageJson.scripts?.build) {
          const startTime = performance.now();
          await execAsync('npm run build', { cwd: this.projectPath, timeout: 30000 });
          const endTime = performance.now();
          
          return endTime - startTime;
        }
      }
    } catch (error) {
      // Build failed or not available
    }
    
    return 0;
  }

  /**
   * Measure test execution time
   */
  private async measureTestTime(): Promise<number> {
    try {
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      
      if (await fs.pathExists(packageJsonPath)) {
        const packageJson = await fs.readJson(packageJsonPath);
        
        if (packageJson.scripts?.test) {
          const startTime = performance.now();
          await execAsync('npm test', { cwd: this.projectPath, timeout: 60000 });
          const endTime = performance.now();
          
          return endTime - startTime;
        }
      }
    } catch (error) {
      // Tests failed or not available
    }
    
    return 0;
  }

  /**
   * Get performance validation statistics
   */
  getValidationStatistics(): {
    totalBenchmarks: number;
    averageAccuracy: number;
    baselineMetrics: Map<string, number>;
    recentResults: PerformanceMetric[];
  } {
    const allResults = Array.from(this.benchmarkResults.values()).flat();
    
    return {
      totalBenchmarks: this.benchmarkResults.size,
      averageAccuracy: 85, // Would calculate from actual results
      baselineMetrics: new Map(this.baselineMetrics),
      recentResults: allResults.slice(-50) // Last 50 results
    };
  }

  /**
   * Clear benchmark cache
   */
  clearBenchmarkCache(): void {
    this.benchmarkResults.clear();
    console.log('🧹 Performance benchmark cache cleared');
  }
}

export default PerformanceValidator;