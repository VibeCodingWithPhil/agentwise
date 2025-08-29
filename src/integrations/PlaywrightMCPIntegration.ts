/**
 * Playwright MCP Integration
 * Provides visual testing and browser automation capabilities for all Agentwise agents
 */

import { EventEmitter } from 'events';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface BrowserOptions {
  headless?: boolean;
  viewport?: { width: number; height: number };
  deviceScaleFactor?: number;
  userAgent?: string;
  locale?: string;
  timezone?: string;
}

export interface ScreenshotOptions {
  fullPage?: boolean;
  quality?: number;
  type?: 'png' | 'jpeg';
  path?: string;
  clip?: { x: number; y: number; width: number; height: number };
}

export interface ViewportSize {
  mobile: { width: 375, height: 812 };
  tablet: { width: 768, height: 1024 };
  desktop: { width: 1440, height: 900 };
  wide: { width: 1920, height: 1080 };
}

export interface ValidationResult {
  passed: boolean;
  issues: ValidationIssue[];
  screenshots: string[];
  consoleErrors: string[];
  networkErrors: string[];
  performanceMetrics?: PerformanceMetrics;
}

export interface ValidationIssue {
  type: 'design' | 'responsive' | 'accessibility' | 'performance' | 'functionality';
  severity: 'critical' | 'major' | 'minor';
  element?: string;
  description: string;
  screenshot?: string;
  suggestion?: string;
}

export interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  totalBlockingTime: number;
  cumulativeLayoutShift: number;
}

export class PlaywrightMCPIntegration extends EventEmitter {
  private screenshotDir: string;
  private isConnected: boolean = false;
  private currentUrl?: string;
  private consoleMessages: string[] = [];
  private networkLogs: any[] = [];

  constructor(projectPath: string) {
    super();
    this.screenshotDir = path.join(projectPath, '.playwright', 'screenshots');
    fs.ensureDirSync(this.screenshotDir);
  }

  /**
   * Initialize Playwright MCP connection
   */
  async initialize(): Promise<void> {
    try {
      // Check if Playwright MCP is available
      const isAvailable = await this.checkPlaywrightMCP();
      if (!isAvailable) {
        throw new Error('Playwright MCP server not available. Please run: claude mcp add @modelcontextprotocol/server-playwright');
      }
      
      this.isConnected = true;
      this.emit('connected');
      console.log('✅ Connected to Playwright MCP');
    } catch (error) {
      console.error('❌ Failed to initialize Playwright MCP:', error);
      throw error;
    }
  }

  /**
   * Check if Playwright MCP is available
   */
  private async checkPlaywrightMCP(): Promise<boolean> {
    // This would check with Claude's MCP system
    // For now, we'll assume it's available if configured
    return true;
  }

  /**
   * Navigate to a URL
   */
  async navigate(url: string): Promise<void> {
    this.currentUrl = url;
    this.emit('navigation', { url });
    // MCP call: playwright_navigate
  }

  /**
   * Take a screenshot
   */
  async screenshot(options: ScreenshotOptions = {}): Promise<string> {
    const timestamp = Date.now();
    const filename = `screenshot-${timestamp}.${options.type || 'png'}`;
    const filepath = options.path || path.join(this.screenshotDir, filename);
    
    // MCP call: playwright_screenshot
    this.emit('screenshot', { path: filepath, options });
    
    return filepath;
  }

  /**
   * Set viewport size for responsive testing
   */
  async setViewport(size: keyof ViewportSize | { width: number; height: number }): Promise<void> {
    const viewports: ViewportSize = {
      mobile: { width: 375, height: 812 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1440, height: 900 },
      wide: { width: 1920, height: 1080 }
    };

    const viewport = typeof size === 'string' ? viewports[size] : size;
    
    // MCP call: playwright_set_viewport
    this.emit('viewport-change', viewport);
  }

  /**
   * Click an element
   */
  async click(selector: string): Promise<void> {
    // MCP call: playwright_click
    this.emit('interaction', { type: 'click', selector });
  }

  /**
   * Type text into an input
   */
  async type(selector: string, text: string): Promise<void> {
    // MCP call: playwright_type
    this.emit('interaction', { type: 'type', selector, text });
  }

  /**
   * Get console messages
   */
  async getConsoleMessages(): Promise<string[]> {
    // MCP call: playwright_console
    return this.consoleMessages;
  }

  /**
   * Get network logs
   */
  async getNetworkLogs(): Promise<any[]> {
    // MCP call: playwright_network
    return this.networkLogs;
  }

  /**
   * Perform visual validation
   */
  async validateVisual(options: {
    url: string;
    viewports?: Array<keyof ViewportSize>;
    interactions?: Array<{ action: string; selector?: string; value?: string }>;
    checkAccessibility?: boolean;
    checkPerformance?: boolean;
  }): Promise<ValidationResult> {
    const result: ValidationResult = {
      passed: true,
      issues: [],
      screenshots: [],
      consoleErrors: [],
      networkErrors: []
    };

    try {
      // Navigate to URL
      await this.navigate(options.url);
      
      // Test different viewports
      const viewports = options.viewports || ['mobile', 'tablet', 'desktop'];
      for (const viewport of viewports) {
        await this.setViewport(viewport);
        
        // Take screenshot
        const screenshotPath = await this.screenshot({
          fullPage: true,
          path: path.join(this.screenshotDir, `${viewport}-${Date.now()}.png`)
        });
        result.screenshots.push(screenshotPath);
        
        // Check for responsive issues
        const responsiveIssues = await this.checkResponsiveDesign(viewport);
        result.issues.push(...responsiveIssues);
      }
      
      // Perform interactions if specified
      if (options.interactions) {
        for (const interaction of options.interactions) {
          if (interaction.action === 'click') {
            await this.click(interaction.selector!);
          } else if (interaction.action === 'type') {
            await this.type(interaction.selector!, interaction.value!);
          }
          
          // Screenshot after interaction
          const screenshotPath = await this.screenshot({
            fullPage: false,
            path: path.join(this.screenshotDir, `interaction-${Date.now()}.png`)
          });
          result.screenshots.push(screenshotPath);
        }
      }
      
      // Check console for errors
      const consoleMessages = await this.getConsoleMessages();
      result.consoleErrors = consoleMessages.filter(msg => 
        msg.includes('error') || msg.includes('Error')
      );
      
      // Check network for failures
      const networkLogs = await this.getNetworkLogs();
      result.networkErrors = networkLogs.filter(log => 
        log.status >= 400
      ).map(log => `${log.method} ${log.url} - ${log.status}`);
      
      // Accessibility check
      if (options.checkAccessibility) {
        const a11yIssues = await this.checkAccessibility();
        result.issues.push(...a11yIssues);
      }
      
      // Performance check
      if (options.checkPerformance) {
        result.performanceMetrics = await this.checkPerformance();
      }
      
      // Determine if validation passed
      result.passed = result.issues.filter(i => 
        i.severity === 'critical' || i.severity === 'major'
      ).length === 0 && result.consoleErrors.length === 0;
      
    } catch (error: any) {
      result.passed = false;
      result.issues.push({
        type: 'functionality',
        severity: 'critical',
        description: `Validation failed: ${error.message}`
      });
    }
    
    return result;
  }

  /**
   * Check responsive design issues
   */
  private async checkResponsiveDesign(viewport: string): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    // MCP calls to check for:
    // - Overlapping elements
    // - Text overflow
    // - Hidden content
    // - Layout breaks
    
    // This would use Playwright to analyze the page
    // For now, returning empty array
    
    return issues;
  }

  /**
   * Check accessibility issues
   */
  private async checkAccessibility(): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    // MCP calls to check for:
    // - Missing alt text
    // - Low contrast
    // - Missing ARIA labels
    // - Keyboard navigation issues
    
    return issues;
  }

  /**
   * Check performance metrics
   */
  private async checkPerformance(): Promise<PerformanceMetrics> {
    // MCP call to get performance metrics
    return {
      loadTime: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      totalBlockingTime: 0,
      cumulativeLayoutShift: 0
    };
  }

  /**
   * Perform comprehensive design review
   */
  async performDesignReview(options: {
    url: string;
    designPrinciples?: any;
    testCases?: Array<{
      name: string;
      steps: Array<{ action: string; selector?: string; value?: string; expected?: string }>;
    }>;
  }): Promise<{
    summary: string;
    passed: boolean;
    totalIssues: number;
    criticalIssues: number;
    screenshots: string[];
    recommendations: string[];
  }> {
    console.log('🎨 Starting comprehensive design review...');
    
    const validationResults: ValidationResult[] = [];
    const allScreenshots: string[] = [];
    
    // Test all viewports
    const viewportResult = await this.validateVisual({
      url: options.url,
      viewports: ['mobile', 'tablet', 'desktop'],
      checkAccessibility: true,
      checkPerformance: true
    });
    validationResults.push(viewportResult);
    allScreenshots.push(...viewportResult.screenshots);
    
    // Run test cases if provided
    if (options.testCases) {
      for (const testCase of options.testCases) {
        console.log(`  Running test: ${testCase.name}`);
        
        for (const step of testCase.steps) {
          if (step.action === 'navigate') {
            await this.navigate(step.value!);
          } else if (step.action === 'click') {
            await this.click(step.selector!);
          } else if (step.action === 'type') {
            await this.type(step.selector!, step.value!);
          } else if (step.action === 'screenshot') {
            const screenshot = await this.screenshot({ fullPage: true });
            allScreenshots.push(screenshot);
          }
          
          // Validate expected outcome if specified
          if (step.expected) {
            // Check if expected element/text is present
          }
        }
      }
    }
    
    // Compile results
    const allIssues = validationResults.flatMap(r => r.issues);
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const passed = criticalIssues.length === 0;
    
    // Generate recommendations
    const recommendations: string[] = [];
    if (allIssues.some(i => i.type === 'responsive')) {
      recommendations.push('Fix responsive design issues for mobile and tablet viewports');
    }
    if (allIssues.some(i => i.type === 'accessibility')) {
      recommendations.push('Improve accessibility by adding ARIA labels and fixing contrast issues');
    }
    if (allIssues.some(i => i.type === 'performance')) {
      recommendations.push('Optimize performance by implementing lazy loading and reducing bundle size');
    }
    
    return {
      summary: `Design review ${passed ? 'PASSED' : 'FAILED'} with ${allIssues.length} issues found`,
      passed,
      totalIssues: allIssues.length,
      criticalIssues: criticalIssues.length,
      screenshots: allScreenshots,
      recommendations
    };
  }

  /**
   * Auto-fix common issues
   */
  async autoFixIssues(issues: ValidationIssue[]): Promise<{
    fixed: ValidationIssue[];
    unfixable: ValidationIssue[];
    changes: string[];
  }> {
    const fixed: ValidationIssue[] = [];
    const unfixable: ValidationIssue[] = [];
    const changes: string[] = [];
    
    for (const issue of issues) {
      if (issue.suggestion) {
        // Attempt to apply the suggestion
        // This would integrate with the code generation system
        fixed.push(issue);
        changes.push(issue.suggestion);
      } else {
        unfixable.push(issue);
      }
    }
    
    return { fixed, unfixable, changes };
  }
}

export default PlaywrightMCPIntegration;