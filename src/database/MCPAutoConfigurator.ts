/**
 * MCPAutoConfigurator - MCP setup automation system
 * 
 * Automatically configures MCP (Model Context Protocol) integration:
 * - Creates .mcp.json configuration files
 * - Configures Supabase MCP server
 * - Sets up agent-specific MCP configurations
 * - Updates Claude Desktop configuration if available
 * - Manages MCP server lifecycle
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { existsSync } from 'fs';
import {
  DatabaseCredentials,
  DatabaseProvider,
  MCPConfiguration,
  MCPConfigFile,
  ClaudeDesktopConfig,
  MCPAutoConfigOptions,
  ConfigurationError
} from './types.js';

export class MCPAutoConfigurator {
  private readonly projectRoot: string;
  private readonly claudeConfigPaths: string[];

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.claudeConfigPaths = this.getClaudeDesktopConfigPaths();
  }

  /**
   * Configure MCP for database credentials
   */
  async configureMCP(
    credentials: DatabaseCredentials,
    options: MCPAutoConfigOptions = {}
  ): Promise<{ configFile: string; serverName: string; claudeDesktopUpdated: boolean }> {
    try {
      // Determine target configuration file
      const targetFile = options.targetFile || path.join(this.projectRoot, '.mcp.json');
      
      // Backup existing configuration if requested
      if (options.backupExisting && existsSync(targetFile)) {
        await this.backupConfigFile(targetFile);
      }

      // Load existing configuration or create new one
      let mcpConfig: MCPConfigFile = { mcpServers: {} };
      if (options.mergeWithExisting && existsSync(targetFile)) {
        mcpConfig = await this.loadMCPConfig(targetFile);
      }

      // Generate MCP server configuration
      const serverConfig = this.generateServerConfig(credentials, options);
      const serverName = this.generateServerName(credentials, options);

      // Add or update server configuration
      mcpConfig.mcpServers[serverName] = serverConfig;

      // Write MCP configuration file
      await this.writeMCPConfig(targetFile, mcpConfig);

      // Update Claude Desktop configuration if requested
      let claudeDesktopUpdated = false;
      if (options.updateClaudeDesktop) {
        claudeDesktopUpdated = await this.updateClaudeDesktopConfig(serverName, serverConfig);
      }

      return {
        configFile: targetFile,
        serverName,
        claudeDesktopUpdated
      };
    } catch (error) {
      throw new ConfigurationError(
        `Failed to configure MCP: ${error instanceof Error ? error.message : 'Unknown error'}`,
        credentials.provider
      );
    }
  }

  /**
   * Generate agent-specific MCP configuration
   */
  async configureAgentMCP(
    credentials: DatabaseCredentials,
    agentId: string,
    agentName: string,
    options: Omit<MCPAutoConfigOptions, 'agentSpecific' | 'agentId'> = {}
  ): Promise<string> {
    try {
      const agentConfigDir = path.join(this.projectRoot, '.claude', 'agents', agentId);
      await fs.mkdir(agentConfigDir, { recursive: true });

      const targetFile = path.join(agentConfigDir, 'mcp.json');
      
      // Create agent-specific MCP configuration
      const serverConfig = this.generateServerConfig(credentials, { ...options, agentSpecific: true, agentId });
      const serverName = `${credentials.provider}_${agentId}`;

      const mcpConfig: MCPConfigFile = {
        mcpServers: {
          [serverName]: {
            ...serverConfig,
            // Add agent-specific environment isolation
            env: {
              ...serverConfig.env,
              AGENT_ID: agentId,
              AGENT_NAME: agentName,
              MCP_AGENT_SCOPE: agentId
            }
          }
        }
      };

      await this.writeMCPConfig(targetFile, mcpConfig);
      return targetFile;
    } catch (error) {
      throw new ConfigurationError(
        `Failed to configure agent MCP: ${error instanceof Error ? error.message : 'Unknown error'}`,
        credentials.provider,
        { agentId }
      );
    }
  }

  /**
   * Remove MCP configuration
   */
  async removeMCPConfig(serverName: string, configFile?: string): Promise<boolean> {
    try {
      const targetFile = configFile || path.join(this.projectRoot, '.mcp.json');
      
      if (!existsSync(targetFile)) {
        return false;
      }

      const mcpConfig = await this.loadMCPConfig(targetFile);
      
      if (mcpConfig.mcpServers[serverName]) {
        delete mcpConfig.mcpServers[serverName];
        await this.writeMCPConfig(targetFile, mcpConfig);
        
        // Also remove from Claude Desktop config
        await this.removeFromClaudeDesktopConfig(serverName);
        
        return true;
      }

      return false;
    } catch (error) {
      throw new ConfigurationError(
        `Failed to remove MCP configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * List all configured MCP servers
   */
  async listMCPServers(configFile?: string): Promise<Array<{ name: string; provider: DatabaseProvider; command: string; disabled?: boolean }>> {
    try {
      const targetFile = configFile || path.join(this.projectRoot, '.mcp.json');
      
      if (!existsSync(targetFile)) {
        return [];
      }

      const mcpConfig = await this.loadMCPConfig(targetFile);
      const servers: Array<{ name: string; provider: DatabaseProvider; command: string; disabled?: boolean }> = [];

      for (const [name, config] of Object.entries(mcpConfig.mcpServers)) {
        servers.push({
          name,
          provider: this.extractProviderFromServerName(name),
          command: config.command,
          disabled: config.disabled
        });
      }

      return servers;
    } catch (error) {
      throw new ConfigurationError(
        `Failed to list MCP servers: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Test MCP server connection
   */
  async testMCPServer(serverName: string, configFile?: string): Promise<{ success: boolean; error?: string; capabilities?: string[] }> {
    try {
      const targetFile = configFile || path.join(this.projectRoot, '.mcp.json');
      
      if (!existsSync(targetFile)) {
        return { success: false, error: 'MCP configuration file not found' };
      }

      const mcpConfig = await this.loadMCPConfig(targetFile);
      const serverConfig = mcpConfig.mcpServers[serverName];

      if (!serverConfig) {
        return { success: false, error: 'MCP server not found in configuration' };
      }

      if (serverConfig.disabled) {
        return { success: false, error: 'MCP server is disabled' };
      }

      // Test server startup (simplified)
      const capabilities = await this.probeMCPServerCapabilities(serverConfig);
      
      return {
        success: true,
        capabilities
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate server configuration based on database provider
   */
  private generateServerConfig(credentials: DatabaseCredentials, options: MCPAutoConfigOptions): MCPConfiguration {
    const baseConfig: MCPConfiguration = {
      name: this.getServerName(credentials.provider),
      command: this.getServerCommand(credentials.provider),
      args: this.getServerArgs(credentials.provider, options),
      env: this.generateEnvironmentVariables(credentials, options),
      disabled: false
    };

    // Provider-specific configurations
    switch (credentials.provider) {
      case 'supabase':
        return this.configureSupabaseMCP(baseConfig, credentials, options);
      case 'neon':
        return this.configureNeonMCP(baseConfig, credentials, options);
      case 'planetscale':
        return this.configurePlanetScaleMCP(baseConfig, credentials, options);
      case 'postgresql':
        return this.configurePostgreSQLMCP(baseConfig, credentials, options);
      case 'mysql':
        return this.configureMySQLMCP(baseConfig, credentials, options);
      case 'sqlite':
        return this.configureSQLiteMCP(baseConfig, credentials, options);
      default:
        return baseConfig;
    }
  }

  /**
   * Configure Supabase MCP server
   */
  private configureSupabaseMCP(
    baseConfig: MCPConfiguration, 
    credentials: DatabaseCredentials, 
    options: MCPAutoConfigOptions
  ): MCPConfiguration {
    return {
      ...baseConfig,
      command: 'npx',
      args: ['-y', '@supabase/mcp-server'],
      env: {
        ...baseConfig.env,
        SUPABASE_URL: credentials.connectionUrl || '',
        SUPABASE_ANON_KEY: credentials.apiKey || '',
        ...(credentials.serviceKey && { SUPABASE_SERVICE_ROLE_KEY: credentials.serviceKey }),
        ...(credentials.projectId && { SUPABASE_PROJECT_ID: credentials.projectId })
      }
    };
  }

  /**
   * Configure Neon MCP server
   */
  private configureNeonMCP(
    baseConfig: MCPConfiguration,
    credentials: DatabaseCredentials,
    options: MCPAutoConfigOptions
  ): MCPConfiguration {
    return {
      ...baseConfig,
      command: 'npx',
      args: ['-y', '@neondatabase/mcp-server'],
      env: {
        ...baseConfig.env,
        DATABASE_URL: credentials.connectionUrl || '',
        ...(credentials.projectId && { NEON_PROJECT_ID: credentials.projectId }),
        ...(credentials.region && { NEON_REGION: credentials.region })
      }
    };
  }

  /**
   * Configure PlanetScale MCP server
   */
  private configurePlanetScaleMCP(
    baseConfig: MCPConfiguration,
    credentials: DatabaseCredentials,
    options: MCPAutoConfigOptions
  ): MCPConfiguration {
    return {
      ...baseConfig,
      command: 'npx',
      args: ['-y', '@planetscale/mcp-server'],
      env: {
        ...baseConfig.env,
        DATABASE_URL: credentials.connectionUrl || '',
        ...(credentials.database && { PLANETSCALE_DATABASE: credentials.database })
      }
    };
  }

  /**
   * Configure PostgreSQL MCP server
   */
  private configurePostgreSQLMCP(
    baseConfig: MCPConfiguration,
    credentials: DatabaseCredentials,
    options: MCPAutoConfigOptions
  ): MCPConfiguration {
    return {
      ...baseConfig,
      command: 'npx',
      args: ['-y', '@postgresql/mcp-server'],
      env: {
        ...baseConfig.env,
        DATABASE_URL: credentials.connectionUrl || this.buildPostgreSQLUrl(credentials),
        ...(credentials.host && { PGHOST: credentials.host }),
        ...(credentials.port && { PGPORT: credentials.port.toString() }),
        ...(credentials.database && { PGDATABASE: credentials.database }),
        ...(credentials.username && { PGUSER: credentials.username }),
        ...(credentials.password && { PGPASSWORD: credentials.password })
      }
    };
  }

  /**
   * Configure MySQL MCP server
   */
  private configureMySQLMCP(
    baseConfig: MCPConfiguration,
    credentials: DatabaseCredentials,
    options: MCPAutoConfigOptions
  ): MCPConfiguration {
    return {
      ...baseConfig,
      command: 'npx',
      args: ['-y', '@mysql/mcp-server'],
      env: {
        ...baseConfig.env,
        DATABASE_URL: credentials.connectionUrl || this.buildMySQLUrl(credentials),
        ...(credentials.host && { MYSQL_HOST: credentials.host }),
        ...(credentials.port && { MYSQL_PORT: credentials.port.toString() }),
        ...(credentials.database && { MYSQL_DATABASE: credentials.database }),
        ...(credentials.username && { MYSQL_USER: credentials.username }),
        ...(credentials.password && { MYSQL_PASSWORD: credentials.password })
      }
    };
  }

  /**
   * Configure SQLite MCP server
   */
  private configureSQLiteMCP(
    baseConfig: MCPConfiguration,
    credentials: DatabaseCredentials,
    options: MCPAutoConfigOptions
  ): MCPConfiguration {
    return {
      ...baseConfig,
      command: 'npx',
      args: ['-y', '@sqlite/mcp-server'],
      env: {
        ...baseConfig.env,
        DATABASE_PATH: credentials.database || '',
        SQLITE_DATABASE: credentials.database || ''
      }
    };
  }

  /**
   * Get server name for provider
   */
  private getServerName(provider: DatabaseProvider): string {
    const names: Record<DatabaseProvider, string> = {
      supabase: 'supabase-mcp',
      neon: 'neon-mcp',
      planetscale: 'planetscale-mcp',
      postgresql: 'postgresql-mcp',
      mysql: 'mysql-mcp',
      sqlite: 'sqlite-mcp'
    };

    return names[provider] || `${provider}-mcp`;
  }

  /**
   * Get server command for provider
   */
  private getServerCommand(provider: DatabaseProvider): string {
    const commands: Record<DatabaseProvider, string> = {
      supabase: 'npx',
      neon: 'npx',
      planetscale: 'npx',
      postgresql: 'npx',
      mysql: 'npx',
      sqlite: 'npx'
    };

    return commands[provider] || 'npx';
  }

  /**
   * Get server arguments for provider
   */
  private getServerArgs(provider: DatabaseProvider, options: MCPAutoConfigOptions): string[] {
    const args: Record<DatabaseProvider, string[]> = {
      supabase: ['-y', '@supabase/mcp-server'],
      neon: ['-y', '@neondatabase/mcp-server'],
      planetscale: ['-y', '@planetscale/mcp-server'],
      postgresql: ['-y', '@postgresql/mcp-server'],
      mysql: ['-y', '@mysql/mcp-server'],
      sqlite: ['-y', '@sqlite/mcp-server']
    };

    const baseArgs = args[provider] || ['-y', `@${provider}/mcp-server`];

    // Add agent-specific arguments if needed
    if (options.agentSpecific && options.agentId) {
      baseArgs.push('--agent-id', options.agentId);
    }

    return baseArgs;
  }

  /**
   * Generate environment variables for MCP server
   */
  private generateEnvironmentVariables(credentials: DatabaseCredentials, options: MCPAutoConfigOptions): Record<string, string> {
    const env: Record<string, string> = {
      NODE_ENV: 'production',
      MCP_PROVIDER: credentials.provider
    };

    // Add agent-specific environment variables
    if (options.agentSpecific && options.agentId) {
      env.MCP_AGENT_ID = options.agentId;
    }

    // Add debugging if needed
    if (process.env.NODE_ENV === 'development') {
      env.DEBUG = 'mcp:*';
    }

    return env;
  }

  /**
   * Generate server name
   */
  private generateServerName(credentials: DatabaseCredentials, options: MCPAutoConfigOptions): string {
    if (options.agentSpecific && options.agentId) {
      return `${credentials.provider}-${options.agentId}`;
    }

    return `${credentials.provider}-db`;
  }

  /**
   * Load MCP configuration file
   */
  private async loadMCPConfig(configPath: string): Promise<MCPConfigFile> {
    try {
      const content = await fs.readFile(configPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      // Return default configuration if file doesn't exist or is invalid
      return { mcpServers: {} };
    }
  }

  /**
   * Write MCP configuration file
   */
  private async writeMCPConfig(configPath: string, config: MCPConfigFile): Promise<void> {
    const configDir = path.dirname(configPath);
    await fs.mkdir(configDir, { recursive: true });

    const content = JSON.stringify(config, null, 2);
    await fs.writeFile(configPath, content, 'utf8');
  }

  /**
   * Get Claude Desktop configuration file paths
   */
  private getClaudeDesktopConfigPaths(): string[] {
    const platform = os.platform();
    const homeDir = os.homedir();

    switch (platform) {
      case 'darwin': // macOS
        return [
          path.join(homeDir, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json')
        ];
      case 'win32': // Windows
        return [
          path.join(homeDir, 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json')
        ];
      case 'linux': // Linux
        return [
          path.join(homeDir, '.config', 'Claude', 'claude_desktop_config.json'),
          path.join(homeDir, '.claude', 'claude_desktop_config.json')
        ];
      default:
        return [];
    }
  }

  /**
   * Load Claude Desktop configuration
   */
  private async loadClaudeDesktopConfig(): Promise<{ config: ClaudeDesktopConfig; path: string } | null> {
    for (const configPath of this.claudeConfigPaths) {
      if (existsSync(configPath)) {
        try {
          const content = await fs.readFile(configPath, 'utf8');
          const config: ClaudeDesktopConfig = JSON.parse(content);
          return { config, path: configPath };
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Update Claude Desktop configuration
   */
  private async updateClaudeDesktopConfig(serverName: string, serverConfig: MCPConfiguration): Promise<boolean> {
    try {
      const existing = await this.loadClaudeDesktopConfig();
      let config: ClaudeDesktopConfig;
      let configPath: string;

      if (existing) {
        config = existing.config;
        configPath = existing.path;
      } else {
        // Create new configuration
        config = { mcpServers: {} };
        configPath = this.claudeConfigPaths[0]; // Use first available path
        
        // Ensure directory exists
        const configDir = path.dirname(configPath);
        await fs.mkdir(configDir, { recursive: true });
      }

      // Add or update server configuration
      config.mcpServers[serverName] = serverConfig;

      // Write configuration
      const content = JSON.stringify(config, null, 2);
      await fs.writeFile(configPath, content, 'utf8');

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Remove server from Claude Desktop configuration
   */
  private async removeFromClaudeDesktopConfig(serverName: string): Promise<boolean> {
    try {
      const existing = await this.loadClaudeDesktopConfig();
      if (!existing) return false;

      const { config, path: configPath } = existing;
      
      if (config.mcpServers[serverName]) {
        delete config.mcpServers[serverName];
        
        const content = JSON.stringify(config, null, 2);
        await fs.writeFile(configPath, content, 'utf8');
        
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Backup existing configuration file
   */
  private async backupConfigFile(configPath: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${configPath}.backup.${timestamp}`;
    await fs.copyFile(configPath, backupPath);
  }

  /**
   * Extract provider from server name
   */
  private extractProviderFromServerName(serverName: string): DatabaseProvider {
    if (serverName.includes('supabase')) return 'supabase';
    if (serverName.includes('neon')) return 'neon';
    if (serverName.includes('planetscale')) return 'planetscale';
    if (serverName.includes('postgresql') || serverName.includes('postgres')) return 'postgresql';
    if (serverName.includes('mysql')) return 'mysql';
    if (serverName.includes('sqlite')) return 'sqlite';
    return 'postgresql'; // Default fallback
  }

  /**
   * Build PostgreSQL connection URL
   */
  private buildPostgreSQLUrl(credentials: DatabaseCredentials): string {
    const host = credentials.host || 'localhost';
    const port = credentials.port || 5432;
    const database = credentials.database || '';
    const username = credentials.username || '';
    const password = credentials.password || '';

    return `postgresql://${username}:${password}@${host}:${port}/${database}`;
  }

  /**
   * Build MySQL connection URL
   */
  private buildMySQLUrl(credentials: DatabaseCredentials): string {
    const host = credentials.host || 'localhost';
    const port = credentials.port || 3306;
    const database = credentials.database || '';
    const username = credentials.username || '';
    const password = credentials.password || '';

    return `mysql://${username}:${password}@${host}:${port}/${database}`;
  }

  /**
   * Probe MCP server capabilities (simplified implementation)
   */
  private async probeMCPServerCapabilities(serverConfig: MCPConfiguration): Promise<string[]> {
    // This is a simplified implementation
    // In practice, you would start the MCP server and query its capabilities
    
    const capabilities: string[] = ['read', 'write'];
    
    // Add provider-specific capabilities
    if (serverConfig.env?.MCP_PROVIDER) {
      switch (serverConfig.env.MCP_PROVIDER) {
        case 'supabase':
          capabilities.push('auth', 'storage', 'realtime', 'functions');
          break;
        case 'neon':
          capabilities.push('branching', 'auto-scaling');
          break;
        case 'planetscale':
          capabilities.push('branching', 'online-ddl');
          break;
        case 'postgresql':
          capabilities.push('extensions', 'jsonb', 'full-text-search');
          break;
        case 'mysql':
          capabilities.push('replication', 'partitioning');
          break;
        case 'sqlite':
          capabilities.push('embedded', 'file-based');
          break;
      }
    }

    return capabilities;
  }

  /**
   * Validate MCP configuration
   */
  async validateMCPConfig(configPath: string): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      if (!existsSync(configPath)) {
        errors.push('MCP configuration file not found');
        return { valid: false, errors, warnings };
      }

      const config = await this.loadMCPConfig(configPath);

      // Validate structure
      if (!config.mcpServers || typeof config.mcpServers !== 'object') {
        errors.push('Invalid mcpServers configuration');
      } else {
        // Validate each server configuration
        for (const [serverName, serverConfig] of Object.entries(config.mcpServers)) {
          if (!serverConfig.command) {
            errors.push(`Server ${serverName}: missing command`);
          }

          if (serverConfig.env) {
            // Check for required environment variables
            const provider = serverConfig.env.MCP_PROVIDER;
            if (provider) {
              const requiredVars = this.getRequiredEnvironmentVariables(provider as DatabaseProvider);
              for (const varName of requiredVars) {
                if (!serverConfig.env[varName]) {
                  warnings.push(`Server ${serverName}: missing environment variable ${varName}`);
                }
              }
            }
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`Failed to validate configuration: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { valid: false, errors, warnings };
    }
  }

  /**
   * Get required environment variables for provider
   */
  private getRequiredEnvironmentVariables(provider: DatabaseProvider): string[] {
    const requirements: Record<DatabaseProvider, string[]> = {
      supabase: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
      neon: ['DATABASE_URL'],
      planetscale: ['DATABASE_URL'],
      postgresql: ['DATABASE_URL'],
      mysql: ['DATABASE_URL'],
      sqlite: ['DATABASE_PATH']
    };

    return requirements[provider] || [];
  }
}