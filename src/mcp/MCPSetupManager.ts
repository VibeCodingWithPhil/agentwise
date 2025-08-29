/**
 * MCP Setup Manager
 * Handles automatic configuration of all MCPs for Claude Code
 * Ensures all MCPs are properly installed and configured
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

const execAsync = promisify(exec);

export interface MCPConfig {
  name: string;
  displayName: string;
  category: string;
  setupCommand: string;
  installCommand?: string;
  requiresAuth?: boolean;
  envVars?: string[];
  documentation?: string;
  isLocal?: boolean;
  port?: number;
}

export class MCPSetupManager {
  private mcpConfigs: MCPConfig[];
  private claudeConfigPath: string;

  constructor() {
    // Claude config is typically in user's home directory
    this.claudeConfigPath = path.join(os.homedir(), '.config', 'claude');
    this.mcpConfigs = this.initializeMCPConfigs();
  }

  /**
   * Initialize all MCP configurations with proper setup commands
   */
  private initializeMCPConfigs(): MCPConfig[] {
    return [
      // Design & UI MCPs
      {
        name: 'figma-dev-mode',
        displayName: 'Figma Dev Mode MCP',
        category: 'Design',
        setupCommand: 'claude mcp add figma-dev-mode-mcp-server --transport sse http://127.0.0.1:3845/sse',
        installCommand: 'npm install -g figma-dev-mode-mcp-server',
        requiresAuth: true,
        envVars: ['FIGMA_ACCESS_TOKEN'],
        isLocal: true,
        port: 3845,
        documentation: 'Requires Figma Dev Mode access. Get token from Figma settings.'
      },
      {
        name: 'figma-context',
        displayName: 'Figma Context MCP',
        category: 'Design',
        setupCommand: 'claude mcp add @glips/figma-context-mcp',
        installCommand: 'npm install -g @glips/figma-context-mcp',
        requiresAuth: true,
        envVars: ['FIGMA_PERSONAL_ACCESS_TOKEN'],
        documentation: 'Enhanced Figma context integration from https://github.com/GLips/Figma-Context-MCP'
      },
      {
        name: 'canva',
        displayName: 'Canva MCP',
        category: 'Design',
        setupCommand: 'claude mcp add @canva/mcp-server',
        installCommand: 'npm install -g @canva/mcp-server',
        requiresAuth: true,
        envVars: ['CANVA_API_KEY']
      },
      {
        name: 'shadcn-ui',
        displayName: 'shadcn/ui MCP',
        category: 'UI Components',
        setupCommand: 'claude mcp add @shadcn/mcp-server',
        installCommand: 'npm install -g @shadcn/mcp-server'
      },

      // Database MCPs
      {
        name: 'postgresql',
        displayName: 'PostgreSQL MCP',
        category: 'Database',
        setupCommand: 'claude mcp add @modelcontextprotocol/server-postgres',
        installCommand: 'npm install -g @modelcontextprotocol/server-postgres',
        envVars: ['POSTGRES_CONNECTION_STRING']
      },
      {
        name: 'mongodb',
        displayName: 'MongoDB MCP',
        category: 'Database',
        setupCommand: 'claude mcp add @mongodb/mcp-server',
        installCommand: 'npm install -g @mongodb/mcp-server',
        envVars: ['MONGODB_URI']
      },
      {
        name: 'mysql',
        displayName: 'MySQL MCP',
        category: 'Database',
        setupCommand: 'claude mcp add @mysql/mcp-server',
        installCommand: 'npm install -g @mysql/mcp-server',
        envVars: ['MYSQL_CONNECTION_STRING']
      },
      {
        name: 'upstash-context',
        displayName: 'Upstash Context MCP',
        category: 'Database',
        setupCommand: 'claude mcp add @upstash/context-mcp',
        installCommand: 'npm install -g @upstash/context-mcp',
        requiresAuth: true,
        envVars: ['UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'],
        documentation: 'Redis-based context storage from https://github.com/upstash/context'
      },

      // Development & Testing MCPs
      {
        name: 'github',
        displayName: 'GitHub MCP',
        category: 'Development',
        setupCommand: 'claude mcp add @modelcontextprotocol/server-github',
        installCommand: 'npm install -g @modelcontextprotocol/server-github',
        requiresAuth: true,
        envVars: ['GITHUB_TOKEN']
      },
      {
        name: 'git',
        displayName: 'Git MCP',
        category: 'Development',
        setupCommand: 'claude mcp add @modelcontextprotocol/server-git',
        installCommand: 'npm install -g @modelcontextprotocol/server-git'
      },
      {
        name: 'docker',
        displayName: 'Docker MCP',
        category: 'DevOps',
        setupCommand: 'claude mcp add @docker/mcp-server',
        installCommand: 'npm install -g @docker/mcp-server'
      },
      {
        name: 'playwright',
        displayName: 'Playwright MCP',
        category: 'Testing',
        setupCommand: 'claude mcp add @microsoft/playwright-mcp',
        installCommand: 'npm install -g @microsoft/playwright-mcp',
        documentation: 'Browser automation and testing from https://github.com/microsoft/playwright-mcp'
      },
      {
        name: 'jest',
        displayName: 'Jest MCP',
        category: 'Testing',
        setupCommand: 'claude mcp add @jest/mcp-server',
        installCommand: 'npm install -g @jest/mcp-server'
      },
      {
        name: 'cypress',
        displayName: 'Cypress MCP',
        category: 'Testing',
        setupCommand: 'claude mcp add @cypress/mcp-server',
        installCommand: 'npm install -g @cypress/mcp-server'
      },
      {
        name: 'puppeteer',
        displayName: 'Puppeteer MCP',
        category: 'Testing',
        setupCommand: 'claude mcp add @puppeteer/mcp-server',
        installCommand: 'npm install -g @puppeteer/mcp-server'
      },

      // Cloud & Infrastructure MCPs
      {
        name: 'aws',
        displayName: 'AWS MCP',
        category: 'Cloud',
        setupCommand: 'claude mcp add @aws/mcp-server',
        installCommand: 'npm install -g @aws/mcp-server',
        requiresAuth: true,
        envVars: ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION']
      },
      {
        name: 'azure',
        displayName: 'Azure MCP',
        category: 'Cloud',
        setupCommand: 'claude mcp add @azure/mcp-server',
        installCommand: 'npm install -g @azure/mcp-server',
        requiresAuth: true,
        envVars: ['AZURE_SUBSCRIPTION_ID', 'AZURE_CLIENT_ID', 'AZURE_CLIENT_SECRET', 'AZURE_TENANT_ID']
      },
      {
        name: 'cloudflare',
        displayName: 'Cloudflare MCP',
        category: 'Cloud',
        setupCommand: 'claude mcp add @cloudflare/mcp-server',
        installCommand: 'npm install -g @cloudflare/mcp-server',
        requiresAuth: true,
        envVars: ['CLOUDFLARE_API_TOKEN']
      },
      {
        name: 'terraform',
        displayName: 'Terraform MCP',
        category: 'Infrastructure',
        setupCommand: 'claude mcp add @terraform/mcp-server',
        installCommand: 'npm install -g @terraform/mcp-server'
      },
      {
        name: 'kubernetes',
        displayName: 'Kubernetes MCP',
        category: 'Infrastructure',
        setupCommand: 'claude mcp add @kubernetes/mcp-server',
        installCommand: 'npm install -g @kubernetes/mcp-server'
      },

      // API & Services MCPs
      {
        name: 'stripe',
        displayName: 'Stripe MCP',
        category: 'Payments',
        setupCommand: 'claude mcp add @stripe/mcp-server',
        installCommand: 'npm install -g @stripe/mcp-server',
        requiresAuth: true,
        envVars: ['STRIPE_API_KEY']
      },
      {
        name: 'paypal',
        displayName: 'PayPal MCP',
        category: 'Payments',
        setupCommand: 'claude mcp add @paypal/mcp-server',
        installCommand: 'npm install -g @paypal/mcp-server',
        requiresAuth: true,
        envVars: ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET']
      },
      {
        name: 'twilio',
        displayName: 'Twilio MCP',
        category: 'Communication',
        setupCommand: 'claude mcp add @twilio/mcp-server',
        installCommand: 'npm install -g @twilio/mcp-server',
        requiresAuth: true,
        envVars: ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN']
      },
      {
        name: 'sendgrid',
        displayName: 'SendGrid MCP',
        category: 'Communication',
        setupCommand: 'claude mcp add @sendgrid/mcp-server',
        installCommand: 'npm install -g @sendgrid/mcp-server',
        requiresAuth: true,
        envVars: ['SENDGRID_API_KEY']
      },
      {
        name: 'slack',
        displayName: 'Slack MCP',
        category: 'Communication',
        setupCommand: 'claude mcp add @slack/mcp-server',
        installCommand: 'npm install -g @slack/mcp-server',
        requiresAuth: true,
        envVars: ['SLACK_BOT_TOKEN']
      },
      {
        name: 'discord',
        displayName: 'Discord MCP',
        category: 'Communication',
        setupCommand: 'claude mcp add @discord/mcp-server',
        installCommand: 'npm install -g @discord/mcp-server',
        requiresAuth: true,
        envVars: ['DISCORD_BOT_TOKEN']
      },

      // Web & Content MCPs
      {
        name: 'firecrawl',
        displayName: 'Firecrawl MCP',
        category: 'Web Scraping',
        setupCommand: 'claude mcp add @firecrawl/mcp-server',
        installCommand: 'npm install -g @firecrawl/mcp-server',
        requiresAuth: true,
        envVars: ['FIRECRAWL_API_KEY']
      },
      {
        name: 'brave-search',
        displayName: 'Brave Search MCP',
        category: 'Search',
        setupCommand: 'claude mcp add @brave/search-mcp',
        installCommand: 'npm install -g @brave/search-mcp',
        requiresAuth: true,
        envVars: ['BRAVE_SEARCH_API_KEY']
      },
      {
        name: 'fetch',
        displayName: 'Fetch MCP',
        category: 'HTTP',
        setupCommand: 'claude mcp add @modelcontextprotocol/server-fetch',
        installCommand: 'npm install -g @modelcontextprotocol/server-fetch'
      },

      // Build Tools & Frameworks MCPs
      {
        name: 'webpack',
        displayName: 'Webpack MCP',
        category: 'Build Tools',
        setupCommand: 'claude mcp add @webpack/mcp-server',
        installCommand: 'npm install -g @webpack/mcp-server'
      },
      {
        name: 'vite',
        displayName: 'Vite MCP',
        category: 'Build Tools',
        setupCommand: 'claude mcp add @vitejs/mcp-server',
        installCommand: 'npm install -g @vitejs/mcp-server'
      },
      {
        name: 'nextjs',
        displayName: 'Next.js MCP',
        category: 'Frameworks',
        setupCommand: 'claude mcp add @nextjs/mcp-server',
        installCommand: 'npm install -g @nextjs/mcp-server'
      },
      {
        name: 'remix',
        displayName: 'Remix MCP',
        category: 'Frameworks',
        setupCommand: 'claude mcp add @remix-run/mcp-server',
        installCommand: 'npm install -g @remix-run/mcp-server'
      },
      {
        name: 'astro',
        displayName: 'Astro MCP',
        category: 'Frameworks',
        setupCommand: 'claude mcp add @astrojs/mcp-server',
        installCommand: 'npm install -g @astrojs/mcp-server'
      },

      // Monitoring & Analytics MCPs
      {
        name: 'sentry',
        displayName: 'Sentry MCP',
        category: 'Monitoring',
        setupCommand: 'claude mcp add @sentry/mcp-server',
        installCommand: 'npm install -g @sentry/mcp-server',
        requiresAuth: true,
        envVars: ['SENTRY_DSN', 'SENTRY_AUTH_TOKEN']
      },
      {
        name: 'lighthouse',
        displayName: 'Lighthouse MCP',
        category: 'Performance',
        setupCommand: 'claude mcp add @lighthouse/mcp-server',
        installCommand: 'npm install -g @lighthouse/mcp-server'
      },
      {
        name: 'web-vitals',
        displayName: 'Web Vitals MCP',
        category: 'Performance',
        setupCommand: 'claude mcp add @web-vitals/mcp-server',
        installCommand: 'npm install -g @web-vitals/mcp-server'
      },

      // Documentation MCPs
      {
        name: 'confluence',
        displayName: 'Confluence MCP',
        category: 'Documentation',
        setupCommand: 'claude mcp add @atlassian/confluence-mcp',
        installCommand: 'npm install -g @atlassian/confluence-mcp',
        requiresAuth: true,
        envVars: ['CONFLUENCE_BASE_URL', 'CONFLUENCE_API_TOKEN']
      },
      {
        name: 'notion',
        displayName: 'Notion MCP',
        category: 'Documentation',
        setupCommand: 'claude mcp add @notion/mcp-server',
        installCommand: 'npm install -g @notion/mcp-server',
        requiresAuth: true,
        envVars: ['NOTION_API_KEY']
      },

      // Utility MCPs
      {
        name: 'memory',
        displayName: 'Memory MCP',
        category: 'Utility',
        setupCommand: 'claude mcp add @modelcontextprotocol/server-memory',
        installCommand: 'npm install -g @modelcontextprotocol/server-memory'
      },
      {
        name: 'sequential-thinking',
        displayName: 'Sequential Thinking MCP',
        category: 'AI Enhancement',
        setupCommand: 'claude mcp add @modelcontextprotocol/server-sequential-thinking',
        installCommand: 'npm install -g @modelcontextprotocol/server-sequential-thinking'
      },
      {
        name: 'filesystem',
        displayName: 'Filesystem MCP',
        category: 'System',
        setupCommand: 'claude mcp add @modelcontextprotocol/server-filesystem',
        installCommand: 'npm install -g @modelcontextprotocol/server-filesystem'
      }
    ];
  }

  /**
   * Setup all MCPs
   */
  async setupAllMCPs(options: { 
    skipInstall?: boolean; 
    verbose?: boolean;
    categories?: string[];
  } = {}): Promise<{ 
    success: boolean; 
    installed: string[]; 
    failed: string[];
    skipped: string[];
  }> {
    const results = {
      success: true,
      installed: [] as string[],
      failed: [] as string[],
      skipped: [] as string[]
    };

    console.log('🚀 Starting MCP Setup for Claude Code...\n');

    // Filter by categories if specified
    let mcpsToSetup = this.mcpConfigs;
    if (options.categories && options.categories.length > 0) {
      mcpsToSetup = this.mcpConfigs.filter(mcp => 
        options.categories!.includes(mcp.category)
      );
    }

    // Group by category for better display
    const grouped = this.groupByCategory(mcpsToSetup);

    for (const [category, mcps] of Object.entries(grouped)) {
      console.log(`\n📦 Setting up ${category} MCPs:`);
      console.log('─'.repeat(40));

      for (const mcp of mcps) {
        try {
          const result = await this.setupSingleMCP(mcp, options);
          if (result.status === 'success') {
            results.installed.push(mcp.name);
            console.log(`✅ ${mcp.displayName} - Configured`);
          } else if (result.status === 'skipped') {
            results.skipped.push(mcp.name);
            console.log(`⏭️  ${mcp.displayName} - ${result.reason}`);
          } else {
            results.failed.push(mcp.name);
            console.log(`❌ ${mcp.displayName} - ${result.error}`);
          }
        } catch (error) {
          results.failed.push(mcp.name);
          console.log(`❌ ${mcp.displayName} - Error: ${error}`);
        }
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(50));
    console.log('📊 Setup Summary:');
    console.log(`   ✅ Installed: ${results.installed.length}`);
    console.log(`   ⏭️  Skipped: ${results.skipped.length}`);
    console.log(`   ❌ Failed: ${results.failed.length}`);
    console.log('═'.repeat(50));

    // Check for required environment variables
    await this.checkRequiredEnvVars(mcpsToSetup);

    results.success = results.failed.length === 0;
    return results;
  }

  /**
   * Setup a single MCP
   */
  private async setupSingleMCP(
    mcp: MCPConfig, 
    options: { skipInstall?: boolean; verbose?: boolean }
  ): Promise<{ 
    status: 'success' | 'failed' | 'skipped'; 
    reason?: string; 
    error?: string 
  }> {
    try {
      // Check if already configured
      const isConfigured = await this.isMCPConfigured(mcp.name);
      if (isConfigured && !options.verbose) {
        return { status: 'skipped', reason: 'Already configured' };
      }

      // Install if needed
      if (!options.skipInstall && mcp.installCommand) {
        if (options.verbose) {
          console.log(`   Installing ${mcp.displayName}...`);
        }
        
        try {
          await execAsync(mcp.installCommand);
        } catch (error) {
          // Check if already installed
          const checkCommand = mcp.installCommand.replace('install', 'list').replace('-g', '--global --depth=0');
          try {
            const { stdout } = await execAsync(checkCommand);
            if (!stdout.includes(mcp.name.split('/').pop() || mcp.name)) {
              throw error;
            }
          } catch {
            throw error;
          }
        }
      }

      // Configure in Claude
      if (options.verbose) {
        console.log(`   Configuring ${mcp.displayName} in Claude...`);
      }
      
      await execAsync(mcp.setupCommand);

      // Start local server if needed
      if (mcp.isLocal && mcp.port) {
        await this.startLocalMCPServer(mcp);
      }

      return { status: 'success' };
    } catch (error: any) {
      return { 
        status: 'failed', 
        error: error.message || 'Unknown error' 
      };
    }
  }

  /**
   * Check if MCP is already configured
   */
  private async isMCPConfigured(mcpName: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync('claude mcp list');
      return stdout.includes(mcpName);
    } catch {
      return false;
    }
  }

  /**
   * Start local MCP server
   */
  private async startLocalMCPServer(mcp: MCPConfig): Promise<void> {
    if (!mcp.isLocal || !mcp.port) return;

    // Check if already running
    try {
      const { stdout } = await execAsync(`lsof -ti:${mcp.port}`);
      if (stdout.trim()) {
        console.log(`   ℹ️  ${mcp.displayName} server already running on port ${mcp.port}`);
        return;
      }
    } catch {
      // Port is free, start server
    }

    // Start the server in background
    const serverCommand = mcp.installCommand?.replace('npm install -g', 'npx') || '';
    if (serverCommand) {
      exec(`${serverCommand} --port ${mcp.port}`, (error) => {
        if (error && !error.message.includes('EADDRINUSE')) {
          console.error(`   ⚠️  Failed to start ${mcp.displayName} server: ${error.message}`);
        }
      });
      console.log(`   🌐 Started ${mcp.displayName} server on port ${mcp.port}`);
    }
  }

  /**
   * Check required environment variables
   */
  private async checkRequiredEnvVars(mcps: MCPConfig[]): Promise<void> {
    const missingVars: { mcp: string; vars: string[] }[] = [];

    for (const mcp of mcps) {
      if (mcp.requiresAuth && mcp.envVars) {
        const missing = mcp.envVars.filter(v => !process.env[v]);
        if (missing.length > 0) {
          missingVars.push({ mcp: mcp.displayName, vars: missing });
        }
      }
    }

    if (missingVars.length > 0) {
      console.log('\n⚠️  Required Environment Variables:');
      console.log('─'.repeat(40));
      
      for (const { mcp, vars } of missingVars) {
        console.log(`\n${mcp}:`);
        for (const v of vars) {
          console.log(`   export ${v}="your-value-here"`);
        }
      }
      
      console.log('\n💡 Add these to your ~/.zshrc or ~/.bashrc file');
    }
  }

  /**
   * Group MCPs by category
   */
  private groupByCategory(mcps: MCPConfig[]): Record<string, MCPConfig[]> {
    const grouped: Record<string, MCPConfig[]> = {};
    
    for (const mcp of mcps) {
      if (!grouped[mcp.category]) {
        grouped[mcp.category] = [];
      }
      grouped[mcp.category].push(mcp);
    }
    
    return grouped;
  }

  /**
   * Get list of available MCPs
   */
  getAvailableMCPs(): MCPConfig[] {
    return this.mcpConfigs;
  }

  /**
   * Get MCPs by category
   */
  getMCPsByCategory(category: string): MCPConfig[] {
    return this.mcpConfigs.filter(mcp => mcp.category === category);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return [...new Set(this.mcpConfigs.map(mcp => mcp.category))];
  }

  /**
   * Generate environment template file
   */
  async generateEnvTemplate(): Promise<void> {
    const envPath = path.join(process.cwd(), '.env.mcp.template');
    const lines: string[] = [
      '# MCP Environment Variables Template',
      '# Copy this to .env and fill in your values',
      '',
      '# Generated by Agentwise MCP Setup',
      `# Date: ${new Date().toISOString()}`,
      ''
    ];

    const grouped = this.groupByCategory(this.mcpConfigs);
    
    for (const [category, mcps] of Object.entries(grouped)) {
      lines.push(`# ${category}`);
      lines.push('#' + '─'.repeat(40));
      
      for (const mcp of mcps) {
        if (mcp.envVars && mcp.envVars.length > 0) {
          lines.push(`\n# ${mcp.displayName}`);
          if (mcp.documentation) {
            lines.push(`# ${mcp.documentation}`);
          }
          for (const v of mcp.envVars) {
            lines.push(`${v}=`);
          }
        }
      }
      lines.push('');
    }

    await fs.writeFile(envPath, lines.join('\n'));
    console.log(`\n✅ Environment template created: ${envPath}`);
  }
}

export default MCPSetupManager;