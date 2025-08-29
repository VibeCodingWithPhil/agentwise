/**
 * Agent Visual Testing Enhancer
 * Dynamically adds visual testing capabilities to all Agentwise agents
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { VisualTestingManager } from '../testing/VisualTestingManager';
import { PlaywrightMCPIntegration } from '../integrations/PlaywrightMCPIntegration';

export interface AgentEnhancement {
  visualTesting: boolean;
  autoValidation: boolean;
  screenshotOnChange: boolean;
  responsiveCheck: boolean;
  accessibilityCheck: boolean;
}

export class AgentVisualTestingEnhancer {
  private agentsPath: string;
  private enhancements: Map<string, AgentEnhancement>;
  private visualTestingCapabilities: string;

  constructor() {
    this.agentsPath = path.join(process.cwd(), '.claude', 'agents');
    this.enhancements = new Map();
    this.visualTestingCapabilities = this.getVisualTestingCapabilities();
  }

  /**
   * Enhance all agents with visual testing capabilities
   */
  async enhanceAllAgents(): Promise<void> {
    console.log('🎨 Enhancing all agents with visual testing capabilities...');
    
    // Get all agent files
    const agentFiles = await this.getAgentFiles();
    
    for (const agentFile of agentFiles) {
      await this.enhanceAgent(agentFile);
    }
    
    console.log(`✅ Enhanced ${agentFiles.length} agents with visual testing`);
  }

  /**
   * Enhance a specific agent with visual testing
   */
  async enhanceAgent(agentFile: string): Promise<void> {
    const agentPath = path.join(this.agentsPath, agentFile);
    const agentName = path.basename(agentFile, '.md');
    
    // Skip if already enhanced or is the design review agent
    if (agentName === 'design-review-specialist') {
      return;
    }
    
    // Read agent content
    let content = await fs.readFile(agentPath, 'utf-8');
    
    // Check if already has visual testing
    if (content.includes('## Visual Testing Capabilities')) {
      console.log(`  ⏭️ ${agentName} already has visual testing`);
      return;
    }
    
    // Determine if agent needs visual testing based on type
    const needsVisualTesting = this.agentNeedsVisualTesting(agentName, content);
    
    if (!needsVisualTesting) {
      console.log(`  ⏭️ ${agentName} doesn't need visual testing`);
      return;
    }
    
    // Add visual testing section
    content = this.addVisualTestingSection(content, agentName);
    
    // Write enhanced agent
    await fs.writeFile(agentPath, content);
    
    // Track enhancement
    this.enhancements.set(agentName, {
      visualTesting: true,
      autoValidation: true,
      screenshotOnChange: true,
      responsiveCheck: agentName.includes('frontend') || agentName.includes('designer'),
      accessibilityCheck: true
    });
    
    console.log(`  ✅ Enhanced ${agentName} with visual testing`);
  }

  /**
   * Check if agent needs visual testing based on its role
   */
  private agentNeedsVisualTesting(agentName: string, content: string): boolean {
    // Frontend-related agents always need visual testing
    const frontendKeywords = [
      'frontend', 'ui', 'ux', 'design', 'css', 'style', 
      'react', 'vue', 'angular', 'component', 'interface'
    ];
    
    // Backend-only agents don't need visual testing
    const backendOnlyKeywords = [
      'database', 'api', 'backend', 'server', 'infrastructure',
      'devops', 'deployment', 'security', 'data'
    ];
    
    const nameLower = agentName.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Check if it's a frontend agent
    const isFrontend = frontendKeywords.some(keyword => 
      nameLower.includes(keyword) || contentLower.includes(keyword)
    );
    
    // Check if it's backend-only
    const isBackendOnly = backendOnlyKeywords.every(keyword => 
      !nameLower.includes('frontend') && 
      (nameLower.includes(keyword) || contentLower.includes(keyword))
    );
    
    // Frontend agents and general agents need visual testing
    // Backend-only agents don't
    return isFrontend || !isBackendOnly;
  }

  /**
   * Add visual testing section to agent content
   */
  private addVisualTestingSection(content: string, agentName: string): string {
    const visualSection = `

## Visual Testing Capabilities

You have access to Playwright MCP for visual testing and browser automation. Use these capabilities to verify your frontend implementations.

### After Making UI Changes

Always perform a quick visual check:
1. Navigate to the affected page using \`playwright_navigate\`
2. Take a screenshot using \`playwright_screenshot\`
3. Check console for errors using \`playwright_getConsole\`
4. If responsive design is important, test different viewports
5. Report any visual issues found

### Available Playwright Tools

**Navigation & Screenshots:**
- \`playwright_navigate <url>\` - Navigate to a page
- \`playwright_screenshot\` - Capture current view
- \`playwright_screenshot --fullPage\` - Capture entire page

**Viewport Testing:**
- \`playwright_setViewport 375 812\` - Mobile view
- \`playwright_setViewport 768 1024\` - Tablet view
- \`playwright_setViewport 1440 900\` - Desktop view

**Interactions:**
- \`playwright_click <selector>\` - Click element
- \`playwright_type <selector> <text>\` - Enter text
- \`playwright_hover <selector>\` - Hover over element

**Validation:**
- \`playwright_getConsole\` - Check for console errors
- \`playwright_getNetwork\` - Check network requests
- \`playwright_waitForSelector <selector>\` - Wait for element

### Visual Validation Workflow

\`\`\`javascript
// After implementing a feature
await playwright_navigate('http://localhost:3000/feature');
await playwright_screenshot('feature-implementation');

// Check responsiveness
await playwright_setViewport(375, 812); // Mobile
await playwright_screenshot('feature-mobile');

await playwright_setViewport(768, 1024); // Tablet
await playwright_screenshot('feature-tablet');

// Check for errors
const consoleErrors = await playwright_getConsole();
if (consoleErrors.length > 0) {
  // Fix the errors before proceeding
}
\`\`\`

### When to Use Visual Testing

**Always test after:**
- Creating new components
- Modifying layouts
- Changing styles
- Implementing responsive designs
- Adding animations or interactions

**Skip visual testing for:**
- Backend-only changes
- Configuration updates
- Documentation changes
- Test file updates

### Auto-Fix Common Issues

If you detect visual issues, you can often fix them automatically:
- **Responsive problems**: Adjust CSS media queries
- **Overlapping elements**: Fix positioning or z-index
- **Text overflow**: Add text truncation or wrapping
- **Missing styles**: Ensure CSS is properly imported
- **Console errors**: Fix JavaScript issues

Remember: Visual testing ensures your implementations match the requirements and provide a good user experience.
`;

    // Add before the last section or at the end
    const lines = content.split('\n');
    const insertIndex = lines.length;
    
    lines.splice(insertIndex, 0, visualSection);
    
    return lines.join('\n');
  }

  /**
   * Get visual testing capabilities text
   */
  private getVisualTestingCapabilities(): string {
    return `
### Playwright MCP Integration

All agents now have access to Playwright MCP for visual testing. This enables:
- Browser automation and interaction
- Screenshot capture for validation
- Responsive design testing
- Console and network monitoring
- Accessibility checking
- Performance metrics

Use the Design Review Agent for comprehensive visual testing:
\`@design-review-specialist Please review this implementation\`
`;
  }

  /**
   * Get all agent files
   */
  private async getAgentFiles(): Promise<string[]> {
    if (!await fs.pathExists(this.agentsPath)) {
      return [];
    }
    
    const files = await fs.readdir(this.agentsPath);
    return files.filter(file => file.endsWith('.md'));
  }

  /**
   * Create visual testing configuration for project
   */
  async createProjectVisualConfig(projectPath: string): Promise<void> {
    const configPath = path.join(projectPath, '.playwright', 'config.json');
    
    const config = {
      baseUrl: 'http://localhost:3000',
      viewports: ['mobile', 'tablet', 'desktop'],
      autoFix: true,
      captureConsole: true,
      captureNetwork: true,
      performanceThresholds: {
        loadTime: 3000,
        firstContentfulPaint: 1500,
        largestContentfulPaint: 2500
      },
      testScenarios: [
        {
          name: 'Homepage',
          path: '/',
          criticalPath: true
        },
        {
          name: 'Login Flow',
          path: '/login',
          criticalPath: true
        }
      ]
    };
    
    await fs.ensureDir(path.dirname(configPath));
    await fs.writeJson(configPath, config, { spaces: 2 });
  }

  /**
   * Generate visual testing tasks for agents
   */
  generateVisualTestingTasks(phase: number, componentName?: string): string[] {
    const tasks: string[] = [];
    
    if (phase === 1) {
      tasks.push(
        '- [ ] Set up Playwright MCP for visual testing',
        '- [ ] Create visual testing configuration',
        '- [ ] Establish screenshot baseline'
      );
    }
    
    if (componentName) {
      tasks.push(
        `- [ ] Implement ${componentName} component`,
        `- [ ] Take screenshot of ${componentName} implementation`,
        `- [ ] Test ${componentName} responsiveness (mobile, tablet, desktop)`,
        `- [ ] Check console for errors after ${componentName} renders`,
        `- [ ] Validate ${componentName} against design specifications`
      );
    }
    
    if (phase === 3 || phase === 4) {
      tasks.push(
        '- [ ] Perform comprehensive visual testing across all pages',
        '- [ ] Test all user flows with screenshots',
        '- [ ] Validate responsive design at all breakpoints',
        '- [ ] Check accessibility compliance',
        '- [ ] Generate visual testing report'
      );
    }
    
    return tasks;
  }

  /**
   * Check if project has visual testing setup
   */
  async hasVisualTestingSetup(projectPath: string): Promise<boolean> {
    const configPath = path.join(projectPath, '.playwright', 'config.json');
    return await fs.pathExists(configPath);
  }

  /**
   * Get visual testing report template
   */
  getReportTemplate(): string {
    return `
# Visual Testing Report

## Test Summary
- **Date**: {date}
- **Total Tests**: {totalTests}
- **Passed**: {passed}
- **Failed**: {failed}
- **Screenshots**: {screenshotCount}

## Responsive Design
- [ ] Mobile (375px): {mobileStatus}
- [ ] Tablet (768px): {tabletStatus}
- [ ] Desktop (1440px): {desktopStatus}
- [ ] Wide (1920px): {wideStatus}

## Issues Found
{issues}

## Screenshots
{screenshots}

## Recommendations
{recommendations}

## Next Steps
{nextSteps}
`;
  }

  /**
   * Get enhancement status for all agents
   */
  getEnhancementStatus(): Map<string, AgentEnhancement> {
    return this.enhancements;
  }

  /**
   * Monitor and auto-enhance new agents
   */
  async startAutoEnhancement(): Promise<void> {
    console.log('👁️ Starting auto-enhancement monitor for new agents...');
    
    // Watch for new agent files
    const watcher = fs.watch(this.agentsPath, async (eventType, filename) => {
      if (eventType === 'rename' && filename?.endsWith('.md')) {
        console.log(`  🆕 New agent detected: ${filename}`);
        await this.enhanceAgent(filename);
      }
    });
    
    // Keep reference to watcher
    (global as any).agentEnhancementWatcher = watcher;
  }
}

export default AgentVisualTestingEnhancer;