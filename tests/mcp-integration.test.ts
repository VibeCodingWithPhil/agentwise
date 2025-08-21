/**
 * Tests for enhanced MCP Integration with 46+ servers
 */

import { MCPIntegrationManager } from '../src/mcp/MCPIntegrationManager';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('MCPIntegrationManager - Enhanced', () => {
  let mcpManager: MCPIntegrationManager;

  beforeEach(() => {
    mcpManager = new MCPIntegrationManager();
  });

  describe('New MCP Server Registration', () => {
    it('should have Claude Desktop MCP registered', async () => {
      const servers = await mcpManager.getAvailableServers();
      const claudeDesktop = servers.find(s => s.name === 'claude-desktop');
      
      expect(claudeDesktop).toBeDefined();
      expect(claudeDesktop?.capabilities).toContain('desktop-integration');
      expect(claudeDesktop?.capabilities).toContain('local-file-access');
      expect(claudeDesktop?.capabilities).toContain('system-commands');
    });

    it('should have all UI library MCPs registered', async () => {
      const servers = await mcpManager.getAvailableServers();
      const uiLibraries = [
        'tailwindcss', 'material-ui', 'ant-design', 
        'chakra-ui', 'radix-ui', 'mantine'
      ];
      
      for (const lib of uiLibraries) {
        const server = servers.find(s => s.name === lib);
        expect(server).toBeDefined();
        expect(server?.capabilities).toContain('component-library');
      }
    });

    it('should have design tool MCPs registered', async () => {
      const servers = await mcpManager.getAvailableServers();
      const designTools = ['framer', 'sketch', 'adobe-xd'];
      
      for (const tool of designTools) {
        const server = servers.find(s => s.name === tool);
        expect(server).toBeDefined();
      }
    });

    it('should have performance MCPs registered', async () => {
      const servers = await mcpManager.getAvailableServers();
      const perfTools = ['lighthouse', 'web-vitals'];
      
      for (const tool of perfTools) {
        const server = servers.find(s => s.name === tool);
        expect(server).toBeDefined();
        expect(server?.capabilities.some(c => 
          c.includes('performance') || c.includes('audit')
        )).toBe(true);
      }
    });

    it('should have build tool MCPs registered', async () => {
      const servers = await mcpManager.getAvailableServers();
      const buildTools = ['webpack', 'vite', 'next', 'remix', 'astro'];
      
      for (const tool of buildTools) {
        const server = servers.find(s => s.name === tool);
        expect(server).toBeDefined();
      }
    });

    it('should have at least 46 MCP servers registered', async () => {
      const servers = await mcpManager.getAvailableServers();
      expect(servers.length).toBeGreaterThanOrEqual(46);
    });
  });

  describe('MCP Server Capabilities', () => {
    it('should have proper capabilities for Tailwind CSS MCP', async () => {
      const servers = await mcpManager.getAvailableServers();
      const tailwind = servers.find(s => s.name === 'tailwindcss');
      
      expect(tailwind?.capabilities).toContain('utility-classes');
      expect(tailwind?.capabilities).toContain('design-tokens');
      expect(tailwind?.capabilities).toContain('responsive-design');
    });

    it('should have proper capabilities for Storybook MCP', async () => {
      const servers = await mcpManager.getAvailableServers();
      const storybook = servers.find(s => s.name === 'storybook');
      
      expect(storybook?.capabilities).toContain('component-documentation');
      expect(storybook?.capabilities).toContain('visual-testing');
      expect(storybook?.capabilities).toContain('interaction-testing');
    });

    it('should have proper capabilities for Next.js MCP', async () => {
      const servers = await mcpManager.getAvailableServers();
      const nextjs = servers.find(s => s.name === 'next');
      
      expect(nextjs?.capabilities).toContain('ssr');
      expect(nextjs?.capabilities).toContain('ssg');
      expect(nextjs?.capabilities).toContain('api-routes');
      expect(nextjs?.capabilities).toContain('app-router');
    });
  });

  describe('Agent MCP Assignments', () => {
    it('should assign design MCPs to designer-specialist', async () => {
      const mapping = await mcpManager.getAgentMCPMapping('designer-specialist');
      const mcpNames = mapping?.mcpServers.map(s => s.name) || [];
      
      expect(mcpNames).toContain('figma');
      expect(mcpNames).toContain('shadcn-ui');
      // Designer should have access to various UI libraries
      const hasUILibrary = mcpNames.some(name => 
        ['tailwindcss', 'material-ui', 'chakra-ui'].includes(name)
      );
      expect(hasUILibrary).toBe(true);
    });

    it('should assign Claude Desktop MCP to orchestrator', async () => {
      const mapping = await mcpManager.getAgentMCPMapping('orchestrator-specialist');
      const mcpNames = mapping?.mcpServers.map(s => s.name) || [];
      
      // Orchestrator should have Claude Desktop for system coordination
      expect(mcpNames).toContain('claude-desktop');
    });

    it('should assign performance MCPs to testing-specialist', async () => {
      const mapping = await mcpManager.getAgentMCPMapping('testing-specialist');
      const mcpNames = mapping?.mcpServers.map(s => s.name) || [];
      
      // Testing specialist should have performance tools
      const hasPerfTools = mcpNames.some(name => 
        ['lighthouse', 'web-vitals'].includes(name)
      );
      expect(hasPerfTools).toBe(true);
    });
  });

  describe('MCP Authentication', () => {
    it('should identify MCPs requiring authentication', async () => {
      const servers = await mcpManager.getAvailableServers();
      
      const framer = servers.find(s => s.name === 'framer');
      expect(framer?.requiredAuth?.type).toBe('token');
      expect(framer?.requiredAuth?.envVar).toBe('FRAMER_TOKEN');
      
      const adobeXd = servers.find(s => s.name === 'adobe-xd');
      expect(adobeXd?.requiredAuth?.type).toBe('api_key');
      expect(adobeXd?.requiredAuth?.envVar).toBe('ADOBE_API_KEY');
    });

    it('should have no auth required for open-source UI libraries', async () => {
      const servers = await mcpManager.getAvailableServers();
      const openSourceLibs = ['tailwindcss', 'material-ui', 'chakra-ui', 'radix-ui'];
      
      for (const lib of openSourceLibs) {
        const server = servers.find(s => s.name === lib);
        expect(server?.requiredAuth).toBeUndefined();
      }
    });
  });

  describe('MCP Installation', () => {
    it('should verify npx commands for new MCPs', async () => {
      const servers = await mcpManager.getAvailableServers();
      
      const claudeDesktop = servers.find(s => s.name === 'claude-desktop');
      expect(claudeDesktop?.command).toBe('npx');
      expect(claudeDesktop?.args).toContain('-y');
      expect(claudeDesktop?.args).toContain('@anthropic/mcp-server-claude-desktop');
      
      const tailwind = servers.find(s => s.name === 'tailwindcss');
      expect(tailwind?.command).toBe('npx');
      expect(tailwind?.args).toContain('tailwindcss-mcp-server');
    });

    it('should have setup instructions for special MCPs', async () => {
      const servers = await mcpManager.getAvailableServers();
      
      const claudeDesktop = servers.find(s => s.name === 'claude-desktop');
      expect(claudeDesktop?.setupInstructions).toContain('Claude Desktop app');
    });
  });

  describe('MCP Categories', () => {
    it('should categorize MCPs correctly', async () => {
      const servers = await mcpManager.getAvailableServers();
      
      // Design MCPs
      const designMCPs = servers.filter(s => 
        s.capabilities.some(c => c.includes('design'))
      );
      expect(designMCPs.length).toBeGreaterThan(5);
      
      // Component Library MCPs
      const componentMCPs = servers.filter(s => 
        s.capabilities.includes('component-library')
      );
      expect(componentMCPs.length).toBeGreaterThan(5);
      
      // Performance MCPs
      const perfMCPs = servers.filter(s => 
        s.capabilities.some(c => 
          c.includes('performance') || c.includes('optimization')
        )
      );
      expect(perfMCPs.length).toBeGreaterThan(2);
      
      // Build Tool MCPs
      const buildMCPs = servers.filter(s => 
        s.capabilities.some(c => 
          c.includes('bundling') || c.includes('build')
        )
      );
      expect(buildMCPs.length).toBeGreaterThan(3);
    });
  });

  describe('MCP Configuration', () => {
    it('should save and load MCP configuration', async () => {
      const configPath = path.join(process.cwd(), 'config', 'mcp-config.json');
      
      // Save configuration
      await mcpManager.saveConfiguration();
      expect(await fs.pathExists(configPath)).toBe(true);
      
      // Load and verify
      const config = await fs.readJson(configPath);
      expect(Object.keys(config.mcpServers).length).toBeGreaterThanOrEqual(46);
      expect(config.agentMappings).toBeDefined();
      expect(config.globalSettings).toBeDefined();
    });

    it('should maintain backward compatibility', async () => {
      // Ensure original 27 MCPs are still present
      const servers = await mcpManager.getAvailableServers();
      const originalMCPs = [
        'figma', 'shadcn-ui', 'github', 'postgresql', 
        'docker', 'firecrawl', 'stripe', 'aws'
      ];
      
      for (const mcp of originalMCPs) {
        const server = servers.find(s => s.name === mcp);
        expect(server).toBeDefined();
      }
    });
  });
});

describe('Documentation Site Integration', () => {
  it('should have documentation for all MCPs', async () => {
    const mcpManager = new MCPIntegrationManager();
    const servers = await mcpManager.getAvailableServers();
    
    // Each MCP should have documentation
    for (const server of servers) {
      expect(server.name).toBeDefined();
      expect(server.capabilities).toBeDefined();
      expect(server.capabilities.length).toBeGreaterThan(0);
    }
  });

  it('should provide MCP data for documentation API', async () => {
    const mcpManager = new MCPIntegrationManager();
    const mcpData = await mcpManager.getMCPDocumentationData();
    
    expect(mcpData).toBeDefined();
    expect(mcpData.totalServers).toBeGreaterThanOrEqual(46);
    expect(mcpData.categories).toBeDefined();
    expect(mcpData.categories.design).toBeDefined();
    expect(mcpData.categories.uiLibraries).toBeDefined();
    expect(mcpData.categories.performance).toBeDefined();
  });
});