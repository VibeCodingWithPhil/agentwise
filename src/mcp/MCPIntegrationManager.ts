import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MCPServer {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  capabilities: string[];
  requiredAuth?: {
    type: 'api_key' | 'oauth' | 'token';
    envVar?: string;
  };
  setupInstructions?: string;
}

export interface AgentMCPMapping {
  agentName: string;
  mcpServers: MCPServer[];
  autoInstall: boolean;
  priority: number;
}

export interface MCPConfiguration {
  mcpServers: Record<string, MCPServer>;
  agentMappings: AgentMCPMapping[];
  globalSettings: {
    autoInstall: boolean;
    securityMode: 'strict' | 'standard' | 'permissive';
    cacheDuration: number;
  };
}

export class MCPIntegrationManager {
  private configPath: string;
  private mcpConfig!: MCPConfiguration;
  private installedServers: Set<string>;
  private serverRegistry: Map<string, MCPServer>;

  constructor() {
    this.configPath = path.join(process.cwd(), 'config', 'mcp-config.json');
    this.installedServers = new Set();
    this.serverRegistry = new Map();
    this.initializeDefaultServers();
    this.loadConfiguration();
  }

  private initializeDefaultServers(): void {
    // Initialize with comprehensive MCP server definitions
    const defaultServers: MCPServer[] = [
      // Design & UI MCPs
      {
        name: 'figma',
        command: 'npx',
        args: ['-y', 'figma-mcp-server'],
        capabilities: ['design-access', 'component-export', 'design-tokens'],
        requiredAuth: { type: 'token', envVar: 'FIGMA_TOKEN' },
        setupInstructions: 'Requires Figma paid plan with Dev Mode access'
      },
      {
        name: 'shadcn-ui',
        command: 'npx',
        args: ['-y', 'shadcn-ui-mcp-server'],
        capabilities: ['component-library', 'react-components', 'vue-components', 'svelte-components'],
      },
      {
        name: 'canva',
        command: 'npx',
        args: ['-y', 'canva-mcp-server'],
        capabilities: ['design-creation', 'template-access'],
        requiredAuth: { type: 'api_key', envVar: 'CANVA_API_KEY' }
      },

      // Database MCPs
      {
        name: 'postgresql',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres'],
        capabilities: ['database-query', 'schema-inspection', 'read-only'],
        env: { DATABASE_URL: '${POSTGRES_URL}' }
      },
      {
        name: 'mongodb',
        command: 'npx',
        args: ['-y', 'mongodb-mcp-server'],
        capabilities: ['nosql-query', 'collection-management', 'aggregation'],
        env: { MONGODB_URI: '${MONGODB_URI}' }
      },
      {
        name: 'mysql',
        command: 'npx',
        args: ['-y', 'mysql-mcp-server'],
        capabilities: ['database-query', 'schema-inspection'],
        env: { MYSQL_CONNECTION: '${MYSQL_URL}' }
      },

      // Development MCPs
      {
        name: 'github',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-github'],
        capabilities: ['repo-management', 'issue-tracking', 'pr-management'],
        requiredAuth: { type: 'token', envVar: 'GITHUB_TOKEN' }
      },
      {
        name: 'git',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-git'],
        capabilities: ['version-control', 'repo-operations', 'commit-history']
      },
      {
        name: 'docker',
        command: 'npx',
        args: ['-y', 'docker-mcp-server'],
        capabilities: ['container-management', 'compose-operations', 'image-building']
      },

      // Web Scraping & Cloning MCPs
      {
        name: 'firecrawl',
        command: 'npx',
        args: ['-y', '@firecrawl/mcp-server'],
        capabilities: ['website-scraping', 'design-extraction', 'component-analysis', 'site-cloning'],
        requiredAuth: { type: 'api_key', envVar: 'FIRECRAWL_API_KEY' },
        setupInstructions: 'Get API key from https://firecrawl.dev'
      },

      // API & Service MCPs
      {
        name: 'stripe',
        command: 'npx',
        args: ['-y', 'stripe-mcp-server'],
        capabilities: ['payment-processing', 'subscription-management', 'invoice-handling'],
        requiredAuth: { type: 'api_key', envVar: 'STRIPE_API_KEY' }
      },
      {
        name: 'paypal',
        command: 'npx',
        args: ['-y', 'paypal-mcp-server'],
        capabilities: ['payment-processing', 'merchant-services'],
        requiredAuth: { type: 'oauth', envVar: 'PAYPAL_CLIENT_ID' }
      },
      {
        name: 'twilio',
        command: 'npx',
        args: ['-y', 'twilio-mcp-server'],
        capabilities: ['sms-messaging', 'voice-calls', 'notifications'],
        requiredAuth: { type: 'token', envVar: 'TWILIO_AUTH_TOKEN' }
      },
      {
        name: 'apollo-graphql',
        command: 'npx',
        args: ['-y', 'apollo-mcp-server'],
        capabilities: ['graphql-schema', 'api-orchestration', 'query-optimization']
      },

      // Cloud & Infrastructure MCPs
      {
        name: 'aws',
        command: 'npx',
        args: ['-y', 'aws-mcp-server'],
        capabilities: ['aws-services', 'infrastructure-management', 'cost-analysis'],
        requiredAuth: { type: 'api_key', envVar: 'AWS_ACCESS_KEY_ID' }
      },
      {
        name: 'azure',
        command: 'npx',
        args: ['-y', 'azure-mcp-server'],
        capabilities: ['azure-services', 'storage-operations', 'cosmos-db'],
        requiredAuth: { type: 'token', envVar: 'AZURE_SUBSCRIPTION_ID' }
      },
      {
        name: 'terraform',
        command: 'npx',
        args: ['-y', 'terraform-mcp-server'],
        capabilities: ['infrastructure-as-code', 'state-management', 'provider-access']
      },

      // Testing MCPs
      {
        name: 'playwright',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-playwright'],
        capabilities: ['browser-automation', 'e2e-testing', 'cross-browser-testing']
      },
      {
        name: 'cypress',
        command: 'npx',
        args: ['-y', 'cypress-mcp-server'],
        capabilities: ['e2e-testing', 'component-testing', 'visual-testing']
      },
      {
        name: 'jest',
        command: 'npx',
        args: ['-y', 'jest-mcp-server'],
        capabilities: ['unit-testing', 'integration-testing', 'coverage-analysis']
      },

      // Documentation MCPs
      {
        name: 'confluence',
        command: 'npx',
        args: ['-y', 'confluence-mcp-server'],
        capabilities: ['documentation-management', 'page-creation', 'search'],
        requiredAuth: { type: 'token', envVar: 'CONFLUENCE_TOKEN' }
      },
      {
        name: 'notion',
        command: 'npx',
        args: ['-y', 'notion-mcp-server'],
        capabilities: ['workspace-management', 'database-operations', 'content-creation'],
        requiredAuth: { type: 'token', envVar: 'NOTION_TOKEN' }
      },

      // Utility MCPs
      {
        name: 'memory',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        capabilities: ['persistent-memory', 'knowledge-graph', 'context-retention']
      },
      {
        name: 'brave-search',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-brave-search'],
        capabilities: ['web-search', 'private-search', 'local-search'],
        requiredAuth: { type: 'api_key', envVar: 'BRAVE_API_KEY' }
      },
      {
        name: 'sequential-thinking',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
        capabilities: ['problem-solving', 'multi-step-reasoning', 'planning']
      },

      // New Design & Development MCPs
      {
        name: 'claude-desktop',
        command: 'npx',
        args: ['-y', '@anthropic/mcp-server-claude-desktop'],
        capabilities: ['desktop-integration', 'local-file-access', 'system-commands'],
        setupInstructions: 'Requires Claude Desktop app installed and running'
      },
      {
        name: 'tailwindcss',
        command: 'npx',
        args: ['-y', 'tailwindcss-mcp-server'],
        capabilities: ['utility-classes', 'design-tokens', 'responsive-design']
      },
      {
        name: 'storybook',
        command: 'npx',
        args: ['-y', 'storybook-mcp-server'],
        capabilities: ['component-documentation', 'visual-testing', 'interaction-testing']
      },
      {
        name: 'framer',
        command: 'npx',
        args: ['-y', 'framer-mcp-server'],
        capabilities: ['motion-design', 'animations', 'interactions'],
        requiredAuth: { type: 'token', envVar: 'FRAMER_TOKEN' }
      },
      {
        name: 'sketch',
        command: 'npx',
        args: ['-y', 'sketch-mcp-server'],
        capabilities: ['design-import', 'asset-export', 'symbol-management'],
        requiredAuth: { type: 'token', envVar: 'SKETCH_TOKEN' }
      },
      {
        name: 'adobe-xd',
        command: 'npx',
        args: ['-y', 'adobe-xd-mcp-server'],
        capabilities: ['design-import', 'prototyping', 'asset-generation'],
        requiredAuth: { type: 'api_key', envVar: 'ADOBE_API_KEY' }
      },
      {
        name: 'material-ui',
        command: 'npx',
        args: ['-y', 'material-ui-mcp-server'],
        capabilities: ['component-library', 'theming', 'material-design']
      },
      {
        name: 'ant-design',
        command: 'npx',
        args: ['-y', 'ant-design-mcp-server'],
        capabilities: ['component-library', 'enterprise-ui', 'form-builder']
      },
      {
        name: 'chakra-ui',
        command: 'npx',
        args: ['-y', 'chakra-ui-mcp-server'],
        capabilities: ['component-library', 'modular-design', 'accessibility']
      },
      {
        name: 'radix-ui',
        command: 'npx',
        args: ['-y', 'radix-ui-mcp-server'],
        capabilities: ['headless-components', 'accessibility', 'primitives']
      },
      {
        name: 'mantine',
        command: 'npx',
        args: ['-y', 'mantine-mcp-server'],
        capabilities: ['component-library', 'hooks', 'form-management']
      },
      {
        name: 'web-vitals',
        command: 'npx',
        args: ['-y', 'web-vitals-mcp-server'],
        capabilities: ['performance-metrics', 'core-web-vitals', 'optimization']
      },
      {
        name: 'lighthouse',
        command: 'npx',
        args: ['-y', 'lighthouse-mcp-server'],
        capabilities: ['performance-audit', 'accessibility-audit', 'seo-audit']
      },
      {
        name: 'webpack',
        command: 'npx',
        args: ['-y', 'webpack-mcp-server'],
        capabilities: ['bundling', 'optimization', 'module-federation']
      },
      {
        name: 'vite',
        command: 'npx',
        args: ['-y', 'vite-mcp-server'],
        capabilities: ['fast-bundling', 'hmr', 'dev-server']
      },
      {
        name: 'next',
        command: 'npx',
        args: ['-y', 'next-mcp-server'],
        capabilities: ['ssr', 'ssg', 'api-routes', 'app-router']
      },
      {
        name: 'remix',
        command: 'npx',
        args: ['-y', 'remix-mcp-server'],
        capabilities: ['nested-routing', 'data-loading', 'progressive-enhancement']
      },
      {
        name: 'astro',
        command: 'npx',
        args: ['-y', 'astro-mcp-server'],
        capabilities: ['islands-architecture', 'partial-hydration', 'content-sites']
      },

      // Backend Development MCPs
      {
        name: 'rest-api',
        command: 'npx',
        args: ['-y', '@smithery/cli', 'install', 'dkmaker-mcp-rest-api', '--client', 'claude'],
        capabilities: ['api-testing', 'rest-methods', 'authentication', 'headers'],
        setupInstructions: 'Supports GET/POST/PUT/DELETE with auth (Basic, Bearer, API Key)'
      },
      {
        name: 'testsprite',
        command: 'npm',
        args: ['install', '-g', '@testsprite/testsprite-mcp@latest'],
        capabilities: ['api-testing', 'functional-testing', 'security-testing', 'boundary-testing'],
        setupInstructions: 'Automated API testing with comprehensive coverage'
      },
      {
        name: 'fetch',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-fetch'],
        capabilities: ['http-requests', 'web-scraping', 'api-calls'],
      },

      // Advanced Database MCPs
      {
        name: 'postgres-advanced',
        command: 'npm',
        args: ['install', '-g', '@henkey/postgres-mcp-server'],
        capabilities: ['database-management', 'query-optimization', 'schema-design', '18-tools'],
        env: { DATABASE_URL: '${POSTGRES_URL}' },
        setupInstructions: 'Advanced PostgreSQL with 18 intelligent tools'
      },
      {
        name: 'database-multi',
        command: 'npx',
        args: ['-y', '@executeautomation/database-server'],
        capabilities: ['sqlite', 'sql-server', 'postgresql', 'mysql', 'multi-database'],
        setupInstructions: 'Supports multiple database types in one server'
      },
      {
        name: 'mongodb-atlas',
        command: 'npx',
        args: ['-y', 'mongodb-mcp-server'],
        capabilities: ['atlas-management', 'cluster-creation', 'access-control', 'organization-management'],
        requiredAuth: { type: 'api_key', envVar: 'MONGODB_ATLAS_KEY' }
      },

      // DevOps & Infrastructure MCPs
      {
        name: 'kubernetes',
        command: 'npx',
        args: ['kubernetes-mcp-server@latest'],
        capabilities: ['k8s-api', 'cluster-management', 'no-kubectl', 'cross-platform'],
        env: { KUBECONFIG: '${KUBECONFIG_PATH}' },
        setupInstructions: 'Native K8s API integration without kubectl dependency'
      },
      {
        name: 'azure-devops',
        command: 'npx',
        args: ['-y', '@azure-devops/mcp'],
        capabilities: ['ci-cd', 'repository-management', 'work-items', 'builds', 'releases'],
        requiredAuth: { type: 'token', envVar: 'AZURE_DEVOPS_TOKEN' }
      },
      {
        name: 'buildkite',
        command: 'npx',
        args: ['-y', 'buildkite-mcp-server'],
        capabilities: ['pipeline-monitoring', 'build-status', 'job-management'],
        requiredAuth: { type: 'api_key', envVar: 'BUILDKITE_API_KEY' }
      },

      // Testing & Quality MCPs
      {
        name: 'mcp-inspector',
        command: 'npx',
        args: ['@modelcontextprotocol/inspector'],
        capabilities: ['server-testing', 'protocol-verification', 'debugging', 'interactive'],
        setupInstructions: 'Official MCP testing tool for server development'
      },
      {
        name: 'mcp-tester',
        command: 'npx',
        args: ['-y', 'mcp-server-tester'],
        capabilities: ['automated-testing', 'claude-integration', 'schema-validation', 'config-driven'],
        setupInstructions: 'Configuration-driven testing framework'
      },
      {
        name: 'puppeteer',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-puppeteer'],
        capabilities: ['browser-automation', 'web-scraping', 'screenshot', 'e2e-testing']
      },
      {
        name: 'a11y',
        command: 'npx',
        args: ['-y', 'a11y-mcp-server'],
        capabilities: ['accessibility-audit', 'wcag-compliance', 'axe-core'],
        setupInstructions: 'Accessibility testing with axe-core engine'
      },

      // Messaging & Communication MCPs
      {
        name: 'slack',
        command: 'npx',
        args: ['-y', 'slack-mcp-server'],
        capabilities: ['messaging', 'channel-management', 'file-sharing', 'webhooks'],
        requiredAuth: { type: 'oauth', envVar: 'SLACK_TOKEN' }
      },
      {
        name: 'discord',
        command: 'npx',
        args: ['-y', 'discord-mcp-server'],
        capabilities: ['bot-creation', 'channel-management', 'messaging', 'voice'],
        requiredAuth: { type: 'token', envVar: 'DISCORD_BOT_TOKEN' }
      },

      // Monitoring & Analytics MCPs
      {
        name: 'browserstack',
        command: 'npx',
        args: ['-y', 'browserstack-mcp-server'],
        capabilities: ['cross-browser-testing', 'real-device-testing', 'automation'],
        requiredAuth: { type: 'api_key', envVar: 'BROWSERSTACK_KEY' }
      },
      {
        name: 'sentry',
        command: 'npx',
        args: ['-y', 'sentry-mcp-server'],
        capabilities: ['error-tracking', 'performance-monitoring', 'release-tracking'],
        requiredAuth: { type: 'token', envVar: 'SENTRY_DSN' }
      },
      {
        name: 'cloudflare',
        command: 'npx',
        args: ['-y', 'cloudflare-mcp-server'],
        capabilities: ['workers', 'kv-storage', 'r2', 'd1-database'],
        requiredAuth: { type: 'api_key', envVar: 'CLOUDFLARE_API_KEY' }
      }
    ];

    // Populate server registry
    for (const server of defaultServers) {
      this.serverRegistry.set(server.name, server);
    }
  }

  private async loadConfiguration(): Promise<void> {
    try {
      if (await fs.pathExists(this.configPath)) {
        this.mcpConfig = await fs.readJson(this.configPath);
      } else {
        this.mcpConfig = this.generateDefaultConfiguration();
        await this.saveConfiguration();
      }
    } catch (error) {
      console.error('Error loading MCP configuration:', error);
      this.mcpConfig = this.generateDefaultConfiguration();
    }
  }

  private generateDefaultConfiguration(): MCPConfiguration {
    return {
      mcpServers: Object.fromEntries(this.serverRegistry),
      agentMappings: this.generateDefaultMappings(),
      globalSettings: {
        autoInstall: true,
        securityMode: 'standard',
        cacheDuration: 3600000 // 1 hour
      }
    };
  }

  private generateDefaultMappings(): AgentMCPMapping[] {
    return [
      // Frontend Specialist
      {
        agentName: 'frontend-specialist',
        mcpServers: [
          this.serverRegistry.get('figma')!,
          this.serverRegistry.get('shadcn-ui')!,
          this.serverRegistry.get('firecrawl')!,
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('playwright')!,
          this.serverRegistry.get('memory')!
        ],
        autoInstall: true,
        priority: 1
      },
      // Backend Specialist
      {
        agentName: 'backend-specialist',
        mcpServers: [
          this.serverRegistry.get('postgresql')!,
          this.serverRegistry.get('mongodb')!,
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('docker')!,
          this.serverRegistry.get('jest')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('rest-api')!,
          this.serverRegistry.get('testsprite')!,
          this.serverRegistry.get('fetch')!,
          this.serverRegistry.get('slack')!,
          this.serverRegistry.get('sentry')!
        ],
        autoInstall: true,
        priority: 1
      },
      // Database Specialist
      {
        agentName: 'database-specialist',
        mcpServers: [
          this.serverRegistry.get('postgresql')!,
          this.serverRegistry.get('mongodb')!,
          this.serverRegistry.get('mysql')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('postgres-advanced')!,
          this.serverRegistry.get('database-multi')!,
          this.serverRegistry.get('mongodb-atlas')!
        ],
        autoInstall: true,
        priority: 1
      },
      // DevOps Specialist
      {
        agentName: 'devops-specialist',
        mcpServers: [
          this.serverRegistry.get('docker')!,
          this.serverRegistry.get('aws')!,
          this.serverRegistry.get('terraform')!,
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('kubernetes')!,
          this.serverRegistry.get('azure-devops')!,
          this.serverRegistry.get('buildkite')!,
          this.serverRegistry.get('cloudflare')!,
          this.serverRegistry.get('azure')!
        ],
        autoInstall: true,
        priority: 1
      },
      // Testing Specialist
      {
        agentName: 'testing-specialist',
        mcpServers: [
          this.serverRegistry.get('jest')!,
          this.serverRegistry.get('playwright')!,
          this.serverRegistry.get('cypress')!,
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('mcp-inspector')!,
          this.serverRegistry.get('mcp-tester')!,
          this.serverRegistry.get('puppeteer')!,
          this.serverRegistry.get('a11y')!,
          this.serverRegistry.get('browserstack')!,
          this.serverRegistry.get('testsprite')!
        ],
        autoInstall: true,
        priority: 1
      },
      // Designer Specialist (NEW)
      {
        agentName: 'designer-specialist',
        mcpServers: [
          this.serverRegistry.get('figma')!,
          this.serverRegistry.get('firecrawl')!,
          this.serverRegistry.get('canva')!,
          this.serverRegistry.get('shadcn-ui')!,
          this.serverRegistry.get('brave-search')!,
          this.serverRegistry.get('memory')!
        ],
        autoInstall: true,
        priority: 1
      },
      // AI Integration Specialist
      {
        agentName: 'ai-integration-specialist',
        mcpServers: [
          this.serverRegistry.get('sequential-thinking')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('brave-search')!
        ],
        autoInstall: true,
        priority: 2
      },
      // E-commerce Specialist
      {
        agentName: 'ecommerce-specialist',
        mcpServers: [
          this.serverRegistry.get('stripe')!,
          this.serverRegistry.get('paypal')!,
          this.serverRegistry.get('postgresql')!,
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('memory')!
        ],
        autoInstall: true,
        priority: 2
      },
      // Infrastructure Specialist
      {
        agentName: 'infrastructure-specialist',
        mcpServers: [
          this.serverRegistry.get('terraform')!,
          this.serverRegistry.get('aws')!,
          this.serverRegistry.get('azure')!,
          this.serverRegistry.get('docker')!,
          this.serverRegistry.get('memory')!
        ],
        autoInstall: true,
        priority: 2
      },
      // Documentation Specialist
      {
        agentName: 'documentation-specialist',
        mcpServers: [
          this.serverRegistry.get('confluence')!,
          this.serverRegistry.get('notion')!,
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('memory')!
        ],
        autoInstall: true,
        priority: 3
      },
      // Research Specialist (NEW)
      {
        agentName: 'research-specialist',
        mcpServers: [
          this.serverRegistry.get('brave-search')!,
          this.serverRegistry.get('sequential-thinking')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('claude-desktop')!,
          this.serverRegistry.get('fetch')!
        ],
        autoInstall: true,
        priority: 1
      }
    ];
  }

  async getMCPsForAgent(agentName: string): Promise<MCPServer[]> {
    const mapping = this.mcpConfig.agentMappings.find(
      m => m.agentName === agentName
    );
    
    if (!mapping) {
      // Return default MCPs for unknown agents
      return [
        this.serverRegistry.get('github')!,
        this.serverRegistry.get('memory')!
      ].filter(Boolean);
    }
    
    return mapping.mcpServers;
  }

  async installMCPServer(server: MCPServer): Promise<boolean> {
    if (this.installedServers.has(server.name)) {
      console.log(`✅ MCP server ${server.name} already installed`);
      return true;
    }

    console.log(`📦 Installing MCP server: ${server.name}`);
    
    try {
      // Check if authentication is required
      if (server.requiredAuth) {
        const envVar = process.env[server.requiredAuth.envVar!];
        if (!envVar) {
          console.warn(`⚠️  ${server.name} requires ${server.requiredAuth.envVar} environment variable`);
          if (server.setupInstructions) {
            console.log(`   Setup: ${server.setupInstructions}`);
          }
          return false;
        }
      }

      // Install the MCP server package
      const installCommand = `${server.command} ${server.args?.join(' ') || ''}`;
      const { stderr } = await execAsync(installCommand);
      
      if (stderr && !stderr.includes('warning')) {
        console.error(`Error installing ${server.name}:`, stderr);
        return false;
      }
      
      this.installedServers.add(server.name);
      console.log(`✅ Successfully installed ${server.name}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to install ${server.name}:`, (error as Error).message);
      return false;
    }
  }

  async setupAgentMCPs(agentName: string): Promise<void> {
    console.log(`🔧 Setting up MCPs for ${agentName}`);
    
    const mcpServers = await this.getMCPsForAgent(agentName);
    
    if (mcpServers.length === 0) {
      console.log(`   No MCPs configured for ${agentName}`);
      return;
    }
    
    console.log(`   Found ${mcpServers.length} MCPs for ${agentName}`);
    
    // Install required MCPs if auto-install is enabled
    const mapping = this.mcpConfig.agentMappings.find(m => m.agentName === agentName);
    if (mapping?.autoInstall || this.mcpConfig.globalSettings.autoInstall) {
      for (const server of mcpServers) {
        await this.installMCPServer(server);
      }
    }
    
    // Generate agent-specific MCP configuration
    await this.generateAgentMCPConfig(agentName, mcpServers);
  }

  private async generateAgentMCPConfig(agentName: string, servers: MCPServer[]): Promise<void> {
    const agentConfigPath = path.join(
      process.cwd(),
      '.claude',
      'agents',
      'configs',
      `${agentName}-mcp.json`
    );
    
    const config = {
      agent: agentName,
      mcpServers: servers.map(server => ({
        name: server.name,
        command: server.command,
        args: server.args,
        env: this.resolveEnvironmentVariables(server.env),
        capabilities: server.capabilities
      })),
      generated: new Date().toISOString()
    };
    
    await fs.ensureDir(path.dirname(agentConfigPath));
    await fs.writeJson(agentConfigPath, config, { spaces: 2 });
    
    console.log(`   Generated MCP config for ${agentName}`);
  }

  private resolveEnvironmentVariables(env?: Record<string, string>): Record<string, string> | undefined {
    if (!env) return undefined;
    
    const resolved: Record<string, string> = {};
    for (const [key, value] of Object.entries(env)) {
      // Replace ${VAR_NAME} with actual environment variable
      const envVarMatch = value.match(/\$\{([^}]+)\}/);
      if (envVarMatch) {
        const envVarName = envVarMatch[1];
        resolved[key] = process.env[envVarName] || value;
      } else {
        resolved[key] = value;
      }
    }
    
    return resolved;
  }

  async addCustomMCPMapping(
    agentName: string,
    mcpServerNames: string[],
    autoInstall: boolean = true
  ): Promise<void> {
    const servers = mcpServerNames
      .map(name => this.serverRegistry.get(name))
      .filter(Boolean) as MCPServer[];
    
    if (servers.length === 0) {
      console.error(`No valid MCP servers found for ${agentName}`);
      return;
    }
    
    // Check if mapping already exists
    const existingIndex = this.mcpConfig.agentMappings.findIndex(
      m => m.agentName === agentName
    );
    
    const newMapping: AgentMCPMapping = {
      agentName,
      mcpServers: servers,
      autoInstall,
      priority: 3 // Custom agents get lower priority
    };
    
    if (existingIndex >= 0) {
      this.mcpConfig.agentMappings[existingIndex] = newMapping;
    } else {
      this.mcpConfig.agentMappings.push(newMapping);
    }
    
    await this.saveConfiguration();
    console.log(`✅ Added MCP mapping for ${agentName}`);
  }

  async analyzeMCPNeeds(projectSpecs: any): Promise<string[]> {
    const neededMCPs: Set<string> = new Set();
    const specContent = JSON.stringify(projectSpecs).toLowerCase();
    
    // Analyze for MCP needs based on project requirements
    const mcpPatterns = {
      'figma': ['design', 'ui/ux', 'mockup', 'wireframe'],
      'shadcn-ui': ['component', 'ui library', 'react components'],
      'postgresql': ['postgres', 'sql', 'relational database'],
      'mongodb': ['mongo', 'nosql', 'document database'],
      'stripe': ['payment', 'subscription', 'billing'],
      'docker': ['container', 'deployment', 'orchestration'],
      'aws': ['amazon', 'cloud', 's3', 'lambda'],
      'playwright': ['e2e', 'browser testing', 'automation'],
      'github': ['version control', 'repository', 'collaboration']
    };
    
    for (const [mcp, keywords] of Object.entries(mcpPatterns)) {
      if (keywords.some(keyword => specContent.includes(keyword))) {
        neededMCPs.add(mcp);
      }
    }
    
    // Always include essential MCPs
    neededMCPs.add('github');
    neededMCPs.add('memory');
    
    return Array.from(neededMCPs);
  }

  async optimizeMCPsForProject(projectSpecs: any, selectedAgents: string[]): Promise<void> {
    console.log('🎯 Optimizing MCP configuration for project...');
    
    const neededMCPs = await this.analyzeMCPNeeds(projectSpecs);
    console.log(`   Detected need for MCPs: ${neededMCPs.join(', ')}`);
    
    // Update agent mappings based on project needs
    for (const agentName of selectedAgents) {
      const mapping = this.mcpConfig.agentMappings.find(m => m.agentName === agentName);
      if (mapping) {
        // Add project-specific MCPs to agent
        const additionalMCPs = neededMCPs
          .map(name => this.serverRegistry.get(name))
          .filter(Boolean) as MCPServer[];
        
        // Merge without duplicates
        const existingNames = new Set(mapping.mcpServers.map(s => s.name));
        for (const mcp of additionalMCPs) {
          if (!existingNames.has(mcp.name)) {
            mapping.mcpServers.push(mcp);
          }
        }
      }
    }
    
    await this.saveConfiguration();
  }

  private async saveConfiguration(): Promise<void> {
    await fs.ensureDir(path.dirname(this.configPath));
    await fs.writeJson(this.configPath, this.mcpConfig, { spaces: 2 });
  }

  async validateMCPSetup(): Promise<boolean> {
    console.log('🔍 Validating MCP setup...');
    
    let allValid = true;
    const issues: string[] = [];
    
    // Check for required environment variables
    for (const [name, server] of this.serverRegistry) {
      if (server.requiredAuth) {
        const envVar = process.env[server.requiredAuth.envVar!];
        if (!envVar) {
          issues.push(`${name}: Missing ${server.requiredAuth.envVar}`);
          allValid = false;
        }
      }
    }
    
    if (!allValid) {
      console.log('⚠️  MCP setup issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    } else {
      console.log('✅ MCP setup validated successfully');
    }
    
    return allValid;
  }

  getAvailableMCPs(): MCPServer[] {
    return Array.from(this.serverRegistry.values());
  }

  getMCPCapabilities(mcpName: string): string[] {
    const server = this.serverRegistry.get(mcpName);
    return server?.capabilities || [];
  }
}