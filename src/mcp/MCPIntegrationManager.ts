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
    // Initialize with VERIFIED MCP server definitions only
    const defaultServers: MCPServer[] = [
      // Core Official MCPs (Verified Working)
      {
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem'],
        capabilities: ['file-operations', 'directory-management', 'file-search']
      },
      {
        name: 'memory',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-memory'],
        capabilities: ['persistent-memory', 'knowledge-graph', 'context-retention']
      },
      {
        name: 'fetch',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-fetch'],
        capabilities: ['http-requests', 'web-scraping', 'api-calls']
      },
      {
        name: 'puppeteer',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-puppeteer'],
        capabilities: ['browser-automation', 'web-scraping', 'screenshot', 'e2e-testing']
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
      {
        name: 'everything',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-everything'],
        capabilities: ['comprehensive-tools', 'utilities', 'testing']
      },

      // Design & UI MCPs (Verified)
      {
        name: 'figma-dev-mode',
        command: '--transport http',
        args: ['figma-dev-mode-mcp-server', 'http://127.0.0.1:3845/mcp'],
        capabilities: ['design-access', 'component-export', 'design-tokens'],
        requiredAuth: { type: 'token', envVar: 'FIGMA_ACCESS_TOKEN' },
        setupInstructions: 'Requires local server running on port 3845'
      },
      {
        name: 'figma-personal',
        command: 'npx',
        args: ['-y', 'figma-developer-mcp', '--stdio'],
        capabilities: ['design-access', 'component-export', 'design-tokens'],
        requiredAuth: { type: 'api_key', envVar: 'FIGMA_API_KEY' },
        setupInstructions: 'Personal use only - users need their own Figma API key'
      },
      {
        name: 'shadcn',
        command: 'pnpm',
        args: ['dlx', 'shadcn@latest', 'mcp', 'init', '--client', 'claude'],
        capabilities: ['component-library', 'react-components', 'ui-patterns'],
        setupInstructions: 'Initialize shadcn/ui MCP for component library access'
      },
      {
        name: 'canva',
        command: 'npx',
        args: ['-y', '@canva/cli@latest', 'mcp'],
        capabilities: ['design-creation', 'template-access'],
        requiredAuth: { type: 'api_key', envVar: 'CANVA_API_KEY' }
      },

      // Database MCPs (From archived official repo)
      {
        name: 'postgresql',
        command: 'node',
        args: ['~/mcp-servers/servers-archived/src/postgres/dist/index.js'],
        capabilities: ['database-query', 'schema-inspection', 'read-only'],
        env: { DATABASE_URL: '${POSTGRES_URL}' },
        setupInstructions: 'Requires building from modelcontextprotocol/servers-archived'
      },
      {
        name: 'mysql',
        command: 'mcp_server_mysql',
        args: [],
        capabilities: ['database-query', 'schema-inspection'],
        env: { MYSQL_CONNECTION: '${MYSQL_URL}' },
        setupInstructions: 'Install mcp_server_mysql separately'
      },

      // Development MCPs (Verified)
      {
        name: 'github',
        command: '--transport http',
        args: ['github', 'https://api.githubcopilot.com/mcp', '-H', '"Authorization: Bearer ${GITHUB_PAT}"'],
        capabilities: ['repo-management', 'issue-tracking', 'pr-management'],
        requiredAuth: { type: 'token', envVar: 'GITHUB_PAT' },
        setupInstructions: 'Requires GitHub Personal Access Token'
      },
      {
        name: 'git-mcp',
        command: 'npx',
        args: ['-y', 'git-mcp'],
        capabilities: ['version-control', 'repo-operations', 'commit-history'],
        setupInstructions: 'From https://github.com/idosal/git-mcp'
      },
      {
        name: 'docker-mcp',
        command: 'npx',
        args: ['-y', 'docker-mcp'],
        capabilities: ['container-management', 'compose-operations', 'image-building'],
        setupInstructions: 'From https://github.com/QuantGeekDev/docker-mcp'
      },

      // Web Scraping & Context MCPs (Verified)
      {
        name: 'firecrawl',
        command: 'npx',
        args: ['-y', 'firecrawl-mcp'],
        capabilities: ['website-scraping', 'design-extraction', 'component-analysis', 'site-cloning'],
        requiredAuth: { type: 'api_key', envVar: 'FIRECRAWL_API_KEY' },
        setupInstructions: 'Get API key from https://firecrawl.dev'
      },
      {
        name: 'context7',
        command: '--transport http',
        args: ['context7', 'https://mcp.context7.com/mcp', '--header', '"CONTEXT7_API_KEY: ${CONTEXT7_API_KEY}"'],
        capabilities: ['documentation-fetch', 'library-context', 'real-time-docs'],
        requiredAuth: { type: 'api_key', envVar: 'CONTEXT7_API_KEY' },
        setupInstructions: 'Get API key from https://context7.com'
      },
      {
        name: 'upstash-context',
        command: 'npx',
        args: ['-y', '@upstash/context-mcp'],
        capabilities: ['context-management', 'redis-storage', 'session-persistence', 'distributed-context'],
        requiredAuth: { type: 'api_key', envVar: 'UPSTASH_REDIS_REST_URL' },
        setupInstructions: 'Requires Upstash Redis database'
      },



      // Testing MCPs (Verified)
      {
        name: 'playwright',
        command: 'npx',
        args: ['@playwright/mcp@latest'],
        capabilities: ['browser-automation', 'e2e-testing', 'cross-browser-testing', 'visual-testing', 'screenshot-capture', 'console-monitoring', 'network-inspection', 'performance-metrics']
      },




      // Backend Development MCPs (Verified)
      {
        name: 'rest-api',
        command: 'npx',
        args: ['-y', '@smithery/cli', 'install', 'dkmaker-mcp-rest-api', '--client', 'claude'],
        capabilities: ['api-testing', 'rest-methods', 'authentication', 'headers'],
        setupInstructions: 'Supports GET/POST/PUT/DELETE with auth'
      },
      {
        name: 'testsprite',
        command: 'npm',
        args: ['install', '-g', '@testsprite/testsprite-mcp@latest'],
        capabilities: ['api-testing', 'functional-testing', 'security-testing', 'boundary-testing'],
        setupInstructions: 'Automated API testing'
      },

      // Advanced Database MCPs (Verified)
      {
        name: 'postgres-advanced',
        command: 'npm',
        args: ['install', '-g', '@henkey/postgres-mcp-server'],
        capabilities: ['database-management', 'query-optimization', 'schema-design', '18-tools'],
        env: { DATABASE_URL: '${POSTGRES_URL}' },
        setupInstructions: 'Advanced PostgreSQL with 18 tools'
      },
      {
        name: 'database-multi',
        command: 'npx',
        args: ['-y', '@executeautomation/database-server'],
        capabilities: ['sqlite', 'sql-server', 'postgresql', 'mysql', 'multi-database'],
        setupInstructions: 'Supports multiple database types'
      },

      // DevOps & Infrastructure MCPs (Verified)
      {
        name: 'kubernetes',
        command: 'npx',
        args: ['kubernetes-mcp-server@latest'],
        capabilities: ['k8s-api', 'cluster-management', 'no-kubectl', 'cross-platform'],
        env: { KUBECONFIG: '${KUBECONFIG_PATH}' },
        setupInstructions: 'Native K8s API integration'
      },
      {
        name: 'azure-devops',
        command: 'npx',
        args: ['-y', '@azure-devops/mcp'],
        capabilities: ['ci-cd', 'repository-management', 'work-items', 'builds', 'releases'],
        requiredAuth: { type: 'token', envVar: 'AZURE_DEVOPS_TOKEN' }
      },

      // Testing & Quality MCPs (Verified)
      {
        name: 'mcp-inspector',
        command: 'npx',
        args: ['@modelcontextprotocol/inspector'],
        capabilities: ['server-testing', 'protocol-verification', 'debugging', 'interactive'],
        setupInstructions: 'Official MCP testing tool'
      },
      {
        name: 'mcp-tester',
        command: 'npx',
        args: ['-y', 'mcp-server-tester'],
        capabilities: ['automated-testing', 'claude-integration', 'schema-validation', 'config-driven'],
        setupInstructions: 'Testing framework'
      },

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
          this.serverRegistry.get('figma-dev-mode')!,
          this.serverRegistry.get('shadcn')!,
          this.serverRegistry.get('firecrawl')!,
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('playwright')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('upstash-context')!,
          this.serverRegistry.get('puppeteer')!
        ].filter(Boolean),
        autoInstall: true,
        priority: 1
      },
      // Backend Specialist
      {
        agentName: 'backend-specialist',
        mcpServers: [
          this.serverRegistry.get('postgresql')!,
          this.serverRegistry.get('mysql')!,
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('docker-mcp')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('rest-api')!,
          this.serverRegistry.get('testsprite')!,
          this.serverRegistry.get('fetch')!,
          this.serverRegistry.get('git-mcp')!
        ].filter(Boolean),
        autoInstall: true,
        priority: 1
      },
      // Database Specialist
      {
        agentName: 'database-specialist',
        mcpServers: [
          this.serverRegistry.get('postgresql')!,
          this.serverRegistry.get('mysql')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('postgres-advanced')!,
          this.serverRegistry.get('database-multi')!
        ].filter(Boolean),
        autoInstall: true,
        priority: 1
      },
      // DevOps Specialist
      {
        agentName: 'devops-specialist',
        mcpServers: [
          this.serverRegistry.get('docker-mcp')!,
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('kubernetes')!,
          this.serverRegistry.get('azure-devops')!,
          this.serverRegistry.get('git-mcp')!
        ].filter(Boolean),
        autoInstall: true,
        priority: 1
      },
      // Testing Specialist
      {
        agentName: 'testing-specialist',
        mcpServers: [
          this.serverRegistry.get('playwright')!,
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('mcp-inspector')!,
          this.serverRegistry.get('mcp-tester')!,
          this.serverRegistry.get('puppeteer')!,
          this.serverRegistry.get('testsprite')!
        ].filter(Boolean),
        autoInstall: true,
        priority: 1
      },
      // Designer Specialist
      {
        agentName: 'designer-specialist',
        mcpServers: [
          this.serverRegistry.get('figma-dev-mode')!,
          this.serverRegistry.get('firecrawl')!,
          this.serverRegistry.get('canva')!,
          this.serverRegistry.get('shadcn')!,
          this.serverRegistry.get('brave-search')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('upstash-context')!,
          this.serverRegistry.get('playwright')!
        ].filter(Boolean),
        autoInstall: true,
        priority: 1
      },
      // Design Review Specialist
      {
        agentName: 'design-review-specialist',
        mcpServers: [
          this.serverRegistry.get('playwright')!,
          this.serverRegistry.get('figma-dev-mode')!,
          this.serverRegistry.get('puppeteer')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('fetch')!
        ].filter(Boolean),
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
          this.serverRegistry.get('brave-search')!,
          this.serverRegistry.get('upstash-context')!,
          this.serverRegistry.get('context7')!
        ].filter(Boolean),
        autoInstall: true,
        priority: 2
      },
      // Infrastructure Specialist
      {
        agentName: 'infrastructure-specialist',
        mcpServers: [
          this.serverRegistry.get('docker-mcp')!,
          this.serverRegistry.get('kubernetes')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('github')!
        ].filter(Boolean),
        autoInstall: true,
        priority: 2
      },
      // Documentation Specialist
      {
        agentName: 'documentation-specialist',
        mcpServers: [
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('fetch')!
        ].filter(Boolean),
        autoInstall: true,
        priority: 3
      },
      // Research Specialist
      {
        agentName: 'research-specialist',
        mcpServers: [
          this.serverRegistry.get('brave-search')!,
          this.serverRegistry.get('sequential-thinking')!,
          this.serverRegistry.get('memory')!,
          this.serverRegistry.get('github')!,
          this.serverRegistry.get('fetch')!,
          this.serverRegistry.get('context7')!
        ].filter(Boolean),
        autoInstall: true,
        priority: 1
      }
    ];
  }

  async getAgentMCPs(agentName: string): Promise<string[]> {
    const mapping = this.mcpConfig.agentMappings.find(
      m => m.agentName === agentName
    );
    
    if (!mapping) {
      return [];
    }
    
    return mapping.mcpServers
      .filter(server => server !== undefined)
      .map(server => server.name);
  }
  
  async getProjectMCPs(projectName: string): Promise<string[]> {
    // Get all unique MCPs configured for the project
    const projectMCPs = new Set<string>();
    
    for (const mapping of this.mcpConfig.agentMappings) {
      for (const server of mapping.mcpServers) {
        if (server) {
          projectMCPs.add(server.name);
        }
      }
    }
    
    return Array.from(projectMCPs);
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