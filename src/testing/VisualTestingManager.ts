/**
 * Visual Testing Manager
 * Coordinates visual testing and browser automation across all Agentwise agents
 */

import { PlaywrightMCPIntegration } from '../integrations/PlaywrightMCPIntegration';
import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface VisualTestConfig {
  projectPath: string;
  baseUrl: string;
  viewports?: ('mobile' | 'tablet' | 'desktop' | 'wide')[];
  autoFix?: boolean;
  captureConsole?: boolean;
  captureNetwork?: boolean;
  performanceThresholds?: {
    loadTime?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
  };
}

export interface TestScenario {
  name: string;
  description: string;
  steps: TestStep[];
  expectedOutcome?: string;
  criticalPath?: boolean;
}

export interface TestStep {
  action: 'navigate' | 'click' | 'type' | 'select' | 'hover' | 'scroll' | 'wait' | 'screenshot' | 'validate';
  selector?: string;
  value?: string;
  options?: any;
  validation?: {
    type: 'visible' | 'text' | 'attribute' | 'style' | 'count';
    expected: any;
  };
}

export interface VisualTestResult {
  scenario: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  screenshots: string[];
  issues: any[];
  metrics?: any;
  fixes?: string[];
}

export class VisualTestingManager extends EventEmitter {
  private playwright: PlaywrightMCPIntegration;
  private config: VisualTestConfig;
  private testResults: Map<string, VisualTestResult>;
  private isRunning: boolean = false;

  constructor(config: VisualTestConfig) {
    super();
    this.config = config;
    this.playwright = new PlaywrightMCPIntegration(config.projectPath);
    this.testResults = new Map();
  }

  /**
   * Initialize visual testing
   */
  async initialize(): Promise<void> {
    await this.playwright.initialize();
    console.log('✅ Visual Testing Manager initialized');
  }

  /**
   * Run visual tests for a feature
   */
  async testFeature(
    featureName: string,
    scenarios: TestScenario[]
  ): Promise<{
    feature: string;
    passed: boolean;
    results: VisualTestResult[];
    summary: string;
  }> {
    console.log(`\n🧪 Testing feature: ${featureName}`);
    this.isRunning = true;
    const results: VisualTestResult[] = [];

    for (const scenario of scenarios) {
      const result = await this.runScenario(scenario);
      results.push(result);
      this.testResults.set(scenario.name, result);
      
      // Emit progress
      this.emit('scenario-complete', {
        feature: featureName,
        scenario: scenario.name,
        result
      });
    }

    this.isRunning = false;
    
    const passed = results.every(r => r.status === 'passed');
    const summary = this.generateSummary(featureName, results);

    return {
      feature: featureName,
      passed,
      results,
      summary
    };
  }

  /**
   * Run a single test scenario
   */
  private async runScenario(scenario: TestScenario): Promise<VisualTestResult> {
    console.log(`  📋 Running scenario: ${scenario.name}`);
    const startTime = Date.now();
    const screenshots: string[] = [];
    const issues: any[] = [];
    const fixes: string[] = [];

    try {
      // Execute test steps
      for (const step of scenario.steps) {
        await this.executeStep(step, screenshots);
      }

      // Validate visual appearance
      const validationResult = await this.playwright.validateVisual({
        url: this.config.baseUrl,
        viewports: this.config.viewports,
        checkAccessibility: true,
        checkPerformance: true
      });

      screenshots.push(...validationResult.screenshots);
      issues.push(...validationResult.issues);

      // Auto-fix if enabled
      if (this.config.autoFix && issues.length > 0) {
        const fixResult = await this.playwright.autoFixIssues(issues);
        fixes.push(...fixResult.changes);
        
        // Re-validate after fixes
        if (fixResult.fixed.length > 0) {
          console.log(`    🔧 Applied ${fixResult.fixed.length} auto-fixes`);
          const revalidation = await this.playwright.validateVisual({
            url: this.config.baseUrl,
            viewports: ['desktop']
          });
          
          // Update issues with remaining problems
          issues.length = 0;
          issues.push(...revalidation.issues);
        }
      }

      const duration = Date.now() - startTime;
      const status = issues.filter(i => 
        i.severity === 'critical' || i.severity === 'major'
      ).length === 0 ? 'passed' : 'failed';

      return {
        scenario: scenario.name,
        status,
        duration,
        screenshots,
        issues,
        fixes
      };

    } catch (error: any) {
      return {
        scenario: scenario.name,
        status: 'failed',
        duration: Date.now() - startTime,
        screenshots,
        issues: [{
          type: 'error',
          severity: 'critical',
          description: error.message
        }],
        fixes
      };
    }
  }

  /**
   * Execute a single test step
   */
  private async executeStep(step: TestStep, screenshots: string[]): Promise<void> {
    switch (step.action) {
      case 'navigate':
        await this.playwright.navigate(step.value!);
        break;
      
      case 'click':
        await this.playwright.click(step.selector!);
        break;
      
      case 'type':
        await this.playwright.type(step.selector!, step.value!);
        break;
      
      case 'screenshot':
        const screenshot = await this.playwright.screenshot({
          fullPage: step.options?.fullPage !== false
        });
        screenshots.push(screenshot);
        break;
      
      case 'wait':
        await new Promise(resolve => setTimeout(resolve, parseInt(step.value!) || 1000));
        break;
      
      case 'validate':
        if (step.validation) {
          // Perform validation based on type
          // This would use Playwright to check elements
        }
        break;
    }
  }

  /**
   * Test responsive design across viewports
   */
  async testResponsiveness(url: string): Promise<{
    passed: boolean;
    issues: any[];
    screenshots: Map<string, string>;
  }> {
    console.log('📱 Testing responsive design...');
    const viewports: Array<'mobile' | 'tablet' | 'desktop'> = ['mobile', 'tablet', 'desktop'];
    const screenshots = new Map<string, string>();
    const allIssues: any[] = [];

    for (const viewport of viewports) {
      console.log(`  Testing ${viewport} viewport...`);
      await this.playwright.setViewport(viewport);
      
      const screenshot = await this.playwright.screenshot({
        fullPage: true,
        path: path.join(this.config.projectPath, `.playwright/responsive-${viewport}.png`)
      });
      screenshots.set(viewport, screenshot);

      // Check for responsive issues
      const validation = await this.playwright.validateVisual({
        url,
        viewports: [viewport]
      });
      
      allIssues.push(...validation.issues.filter(i => i.type === 'responsive'));
    }

    return {
      passed: allIssues.length === 0,
      issues: allIssues,
      screenshots
    };
  }

  /**
   * Test user flow
   */
  async testUserFlow(flowName: string, steps: TestStep[]): Promise<VisualTestResult> {
    console.log(`🔄 Testing user flow: ${flowName}`);
    
    const scenario: TestScenario = {
      name: flowName,
      description: `User flow test for ${flowName}`,
      steps,
      criticalPath: true
    };

    return await this.runScenario(scenario);
  }

  /**
   * Quick visual check after changes
   */
  async quickVisualCheck(
    changedFiles: string[],
    affectedRoutes: string[]
  ): Promise<{
    passed: boolean;
    checkedRoutes: string[];
    issues: any[];
    screenshots: string[];
  }> {
    console.log('👁️ Performing quick visual check...');
    const screenshots: string[] = [];
    const issues: any[] = [];

    // Test each affected route
    for (const route of affectedRoutes) {
      const url = `${this.config.baseUrl}${route}`;
      console.log(`  Checking route: ${route}`);
      
      // Quick validation on desktop only
      const validation = await this.playwright.validateVisual({
        url,
        viewports: ['desktop'],
        checkAccessibility: false,
        checkPerformance: false
      });

      screenshots.push(...validation.screenshots);
      issues.push(...validation.issues);

      // Check console for errors
      const consoleErrors = await this.playwright.getConsoleMessages();
      if (consoleErrors.length > 0) {
        issues.push({
          type: 'functionality',
          severity: 'major',
          description: `Console errors detected: ${consoleErrors.join(', ')}`
        });
      }
    }

    return {
      passed: issues.filter(i => i.severity === 'critical').length === 0,
      checkedRoutes: affectedRoutes,
      issues,
      screenshots
    };
  }

  /**
   * Generate test summary
   */
  private generateSummary(feature: string, results: VisualTestResult[]): string {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
    const totalFixes = results.reduce((sum, r) => sum + (r.fixes?.length || 0), 0);

    let summary = `Visual Testing Summary for ${feature}\n`;
    summary += `${'='.repeat(50)}\n`;
    summary += `✅ Passed: ${passed}/${results.length} scenarios\n`;
    
    if (failed > 0) {
      summary += `❌ Failed: ${failed} scenarios\n`;
    }
    
    if (totalIssues > 0) {
      summary += `⚠️ Issues found: ${totalIssues}\n`;
    }
    
    if (totalFixes > 0) {
      summary += `🔧 Auto-fixes applied: ${totalFixes}\n`;
    }

    // Add details for failed scenarios
    const failedScenarios = results.filter(r => r.status === 'failed');
    if (failedScenarios.length > 0) {
      summary += `\nFailed Scenarios:\n`;
      for (const scenario of failedScenarios) {
        summary += `  - ${scenario.scenario}\n`;
        const criticalIssues = scenario.issues.filter(i => i.severity === 'critical');
        for (const issue of criticalIssues) {
          summary += `    ⚠️ ${issue.description}\n`;
        }
      }
    }

    return summary;
  }

  /**
   * Export test report
   */
  async exportReport(format: 'html' | 'json' | 'markdown' = 'html'): Promise<string> {
    const reportDir = path.join(this.config.projectPath, '.playwright', 'reports');
    await fs.ensureDir(reportDir);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `visual-test-report-${timestamp}.${format}`;
    const filepath = path.join(reportDir, filename);

    const report = {
      timestamp: new Date().toISOString(),
      project: this.config.projectPath,
      baseUrl: this.config.baseUrl,
      results: Array.from(this.testResults.values())
    };

    if (format === 'json') {
      await fs.writeJson(filepath, report, { spaces: 2 });
    } else if (format === 'markdown') {
      const markdown = this.generateMarkdownReport(report);
      await fs.writeFile(filepath, markdown);
    } else {
      const html = this.generateHTMLReport(report);
      await fs.writeFile(filepath, html);
    }

    return filepath;
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(report: any): string {
    let md = `# Visual Testing Report\n\n`;
    md += `**Date**: ${report.timestamp}\n`;
    md += `**Project**: ${report.project}\n`;
    md += `**URL**: ${report.baseUrl}\n\n`;
    
    md += `## Test Results\n\n`;
    
    for (const result of report.results) {
      const emoji = result.status === 'passed' ? '✅' : '❌';
      md += `### ${emoji} ${result.scenario}\n`;
      md += `- **Status**: ${result.status}\n`;
      md += `- **Duration**: ${result.duration}ms\n`;
      md += `- **Issues**: ${result.issues.length}\n`;
      
      if (result.screenshots.length > 0) {
        md += `- **Screenshots**: ${result.screenshots.length} captured\n`;
      }
      
      if (result.issues.length > 0) {
        md += `\n#### Issues Found:\n`;
        for (const issue of result.issues) {
          md += `- **${issue.severity}**: ${issue.description}\n`;
        }
      }
      
      md += '\n';
    }
    
    return md;
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: any): string {
    // Generate a simple HTML report
    // In production, this would use a proper template engine
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Visual Testing Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    .passed { color: green; }
    .failed { color: red; }
    .issue { background: #fff3cd; padding: 10px; margin: 10px 0; border-radius: 5px; }
    .screenshot { max-width: 300px; margin: 10px; }
  </style>
</head>
<body>
  <h1>Visual Testing Report</h1>
  <p><strong>Date:</strong> ${report.timestamp}</p>
  <p><strong>Project:</strong> ${report.project}</p>
  <p><strong>URL:</strong> ${report.baseUrl}</p>
  
  <h2>Test Results</h2>
  ${report.results.map((r: any) => `
    <div class="${r.status}">
      <h3>${r.scenario} - ${r.status.toUpperCase()}</h3>
      <p>Duration: ${r.duration}ms</p>
      ${r.issues.length > 0 ? `
        <div class="issue">
          <h4>Issues:</h4>
          <ul>
            ${r.issues.map((i: any) => `<li>${i.severity}: ${i.description}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>
  `).join('')}
</body>
</html>
    `;
  }
}

export default VisualTestingManager;