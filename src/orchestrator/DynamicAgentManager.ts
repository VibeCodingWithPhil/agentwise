import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import { TokenOptimizer } from '../optimization/TokenOptimizer';

const execAsync = promisify(exec);

export interface Agent {
  name: string;
  description: string;
  tools: string[];
  specialization?: string;
  priority?: number;
}

export class DynamicAgentManager {
  private agents: Agent[] = [];
  private agentsDir: string;
  private lastScanTime: number = 0;
  private scanInterval: number = 5000; // Re-scan every 5 seconds
  private tokenOptimizer: TokenOptimizer;

  constructor(agentsDir: string = path.join(process.cwd(), '.claude', 'agents')) {
    this.agentsDir = agentsDir;
    this.tokenOptimizer = new TokenOptimizer();
    this.scanForAgents();
  }

  /**
   * Dynamically scan and load all agents from .claude/agents folder
   */
  async scanForAgents(): Promise<void> {
    const now = Date.now();
    if (now - this.lastScanTime < this.scanInterval) {
      return; // Don't scan too frequently
    }

    try {
      // Ensure agents directory exists
      await fs.ensureDir(this.agentsDir);

      const files = await fs.readdir(this.agentsDir);
      const agentFiles = files.filter(f => f.endsWith('.md'));

      // Clear existing agents to reload
      this.agents = [];

      for (const file of agentFiles) {
        const agentPath = path.join(this.agentsDir, file);
        const agent = await this.loadAgent(agentPath);
        if (agent) {
          this.agents.push(agent);
        }
      }

      this.lastScanTime = now;
      console.log(`✅ Loaded ${this.agents.length} agents dynamically`);
    } catch (error) {
      console.error('Error scanning for agents:', error);
      // Fall back to default agents if scan fails
      this.loadDefaultAgents();
    }
  }

  /**
   * Load an individual agent from its definition file
   */
  private async loadAgent(filePath: string): Promise<Agent | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const agentName = path.basename(filePath, '.md');

      // Parse YAML frontmatter
      const metadataMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!metadataMatch) {
        console.warn(`Agent ${agentName} missing metadata`);
        return null;
      }

      const metadata = metadataMatch[1];
      
      // Extract agent information
      const nameMatch = metadata.match(/name:\s*(.+)/);
      const descMatch = metadata.match(/description:\s*(.+)/);
      const specMatch = metadata.match(/specialization:\s*(.+)/);
      const toolsMatch = metadata.match(/tools:\s*\[([^\]]+)\]/);
      const priorityMatch = metadata.match(/priority:\s*(\d+)/);

      const agent: Agent = {
        name: nameMatch ? nameMatch[1].trim() : agentName,
        description: descMatch ? descMatch[1].trim() : 'Specialized agent',
        tools: toolsMatch 
          ? toolsMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''))
          : ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob'],
        specialization: specMatch ? specMatch[1].trim() : 'general',
        priority: priorityMatch ? parseInt(priorityMatch[1], 10) : 1
      };

      return agent;
    } catch (error) {
      console.error(`Error loading agent from ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Load default agents as fallback
   */
  private loadDefaultAgents(): void {
    this.agents = [
      {
        name: 'frontend-specialist',
        description: 'UI/UX development expert',
        tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob', 'WebFetch'],
        specialization: 'frontend',
        priority: 3
      },
      {
        name: 'backend-specialist',
        description: 'API and server development expert',
        tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob', 'WebFetch'],
        specialization: 'backend',
        priority: 3
      },
      {
        name: 'database-specialist',
        description: 'Database architecture expert',
        tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob'],
        specialization: 'database',
        priority: 2
      },
      {
        name: 'devops-specialist',
        description: 'Infrastructure and deployment expert',
        tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob', 'WebFetch'],
        specialization: 'devops',
        priority: 2
      },
      {
        name: 'testing-specialist',
        description: 'Quality assurance expert',
        tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob'],
        specialization: 'testing',
        priority: 1
      }
    ];
  }

  /**
   * Get all available agents (with re-scan)
   */
  async getAgents(): Promise<Agent[]> {
    await this.scanForAgents();
    return this.agents;
  }

  /**
   * Launch agents with token optimization
   */
  async launchAgentsOptimized(
    projectPath: string, 
    selectedAgents?: string[]
  ): Promise<void> {
    // Re-scan for new agents
    await this.scanForAgents();

    const agentsToLaunch = selectedAgents 
      ? this.agents.filter(a => selectedAgents.includes(a.name))
      : this.agents;

    // Optimize token usage by batching agents
    const optimizedConfig = await this.tokenOptimizer.optimizeAgentConfiguration(
      agentsToLaunch.map(a => a.name),
      { projectPath, tasks: [] }
    );

    const platform = os.platform();
    const claudePath = await this.findClaudePath();

    // Launch agents in optimized batches
    for (const batch of optimizedConfig.batches) {
      await this.launchBatch(batch, projectPath, claudePath, platform);
      // Delay between batches to prevent overload
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log(`✅ Launched ${agentsToLaunch.length} agents with ${optimizedConfig.savings} token savings`);
  }

  /**
   * Launch a batch of agents
   */
  private async launchBatch(
    agentNames: string[],
    projectPath: string,
    claudePath: string,
    platform: NodeJS.Platform
  ): Promise<void> {
    const agents = this.agents.filter(a => agentNames.includes(a.name));
    
    for (const agent of agents) {
      await this.launchAgentTerminal(agent, projectPath, claudePath, platform);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Launch an individual agent terminal
   */
  private async launchAgentTerminal(
    agent: Agent,
    projectPath: string,
    claudePath: string,
    platform: NodeJS.Platform
  ): Promise<void> {
    const agentCommand = `/agent "${agent.name}"`;
    
    // Check for agent-specific todo files across all phases
    const todoFiles = await this.findAgentTodoFiles(projectPath, agent.name);
    
    try {
      if (platform === 'darwin') {
        // macOS: Use Terminal.app with optimized context
        const script = `
          tell application "Terminal"
            activate
            do script "cd '${projectPath}' && '${claudePath}' --dangerously-skip-permissions"
            delay 2
            do script "${agentCommand}" in front window
            ${todoFiles.length > 0 ? `delay 1
            do script "echo 'Tasks loaded from: ${todoFiles[0]}'" in front window` : ''}
          end tell
        `;
        
        // Properly escape the script: first backslashes, then quotes
        const escapedScript = script
          .replace(/\\/g, '\\\\')  // Escape backslashes first
          .replace(/"/g, '\\"');   // Then escape quotes
        
        await execAsync(`osascript -e "${escapedScript}"`);
        console.log(`✅ Launched ${agent.name} in Terminal tab`);
        
      } else if (platform === 'win32') {
        // Windows: Use Windows Terminal with execFile for security
        const { execFile } = require('child_process');
        const { promisify } = require('util');
        const execFileAsync = promisify(execFile);
        
        // Use execFile with arguments array to prevent injection
        await execFileAsync('wt', [
          'new-tab',
          '--title', agent.name,
          'cmd', '/k',
          `cd /d "${projectPath}" && "${claudePath}" --dangerously-skip-permissions`
        ]);
        console.log(`✅ Launched ${agent.name} in Windows Terminal tab`);
        
      } else {
        // Linux: Use execFile for security
        const { execFile } = require('child_process');
        const { promisify } = require('util');
        const execFileAsync = promisify(execFile);
        
        try {
          // Use gnome-terminal with execFile
          await execFileAsync('gnome-terminal', [
            '--tab',
            `--title=${agent.name}`,
            '--',
            'bash', '-c',
            `cd "${projectPath}" && "${claudePath}" --dangerously-skip-permissions; exec bash`
          ]);
        } catch {
          // Try xterm as fallback with execFile
          await execFileAsync('xterm', [
            '-T', agent.name,
            '-e', 'bash', '-c',
            `cd "${projectPath}" && "${claudePath}" --dangerously-skip-permissions; bash`
          ]);
        }
        console.log(`✅ Launched ${agent.name} in terminal tab`);
      }
    } catch (error) {
      console.error(`⚠️  Failed to launch ${agent.name}:`, error);
      this.logManualInstructions(agent, projectPath, claudePath, todoFiles);
    }
  }

  /**
   * Find Claude executable path
   */
  private async findClaudePath(): Promise<string> {
    const possiblePaths = [
      path.join(os.homedir(), '.claude', 'local', 'claude'),
      path.join(os.homedir(), '.claude', 'bin', 'claude'),
      '/usr/local/bin/claude',
      'claude' // System PATH
    ];

    for (const claudePath of possiblePaths) {
      if (await fs.pathExists(claudePath)) {
        return claudePath;
      }
    }

    // Try to find in PATH
    try {
      const { stdout } = await execAsync('which claude');
      return stdout.trim();
    } catch {
      console.warn('Claude executable not found, using default path');
      return possiblePaths[0];
    }
  }

  /**
   * Find all todo files for an agent across phases
   */
  private async findAgentTodoFiles(projectPath: string, agentName: string): Promise<string[]> {
    const todoDir = path.join(projectPath, 'agent-todos', agentName);
    const todoFiles: string[] = [];

    try {
      if (await fs.pathExists(todoDir)) {
        const files = await fs.readdir(todoDir);
        const phaseFiles = files
          .filter(f => f.match(/phase\d+-todo\.md/))
          .sort((a, b) => {
            const aNum = parseInt(a.match(/phase(\d+)/)?.[1] || '0', 10);
            const bNum = parseInt(b.match(/phase(\d+)/)?.[1] || '0', 10);
            return aNum - bNum;
          });

        for (const file of phaseFiles) {
          todoFiles.push(path.join(todoDir, file));
        }
      }
    } catch (error) {
      console.error(`Error finding todo files for ${agentName}:`, error);
    }

    return todoFiles;
  }

  /**
   * Log manual launch instructions
   */
  private logManualInstructions(
    agent: Agent,
    projectPath: string,
    claudePath: string,
    todoFiles: string[]
  ): void {
    console.log(`
Manual launch instructions for ${agent.name}:
1. Open a new terminal
2. cd ${projectPath}
3. ${claudePath} --dangerously-skip-permissions
4. /agent "${agent.name}"
${todoFiles.length > 0 ? `5. Review todo files:
   ${todoFiles.map(f => `   - ${f}`).join('\n')}` : ''}
    `);
  }

  /**
   * Register a new agent dynamically
   */
  async registerAgent(agentDefinition: Partial<Agent>): Promise<void> {
    const agent: Agent = {
      name: agentDefinition.name || 'custom-agent',
      description: agentDefinition.description || 'Custom agent',
      tools: agentDefinition.tools || ['Read', 'Edit', 'Write', 'Bash'],
      specialization: agentDefinition.specialization || 'general',
      priority: agentDefinition.priority || 1
    };

    // Save agent definition to file
    const agentPath = path.join(this.agentsDir, `${agent.name}.md`);
    const content = `---
name: ${agent.name}
description: ${agent.description}
specialization: ${agent.specialization}
tools: [${agent.tools.join(', ')}]
priority: ${agent.priority}
---

# ${agent.name}

${agent.description}

## Tools
${agent.tools.map(t => `- ${t}`).join('\n')}
`;

    await fs.writeFile(agentPath, content);
    
    // Add to current agents list
    this.agents.push(agent);
    
    console.log(`✅ Registered new agent: ${agent.name}`);
  }

  /**
   * Get agent by name
   */
  getAgent(name: string): Agent | undefined {
    return this.agents.find(a => a.name === name);
  }

  /**
   * Check if agent exists
   */
  hasAgent(name: string): boolean {
    return this.agents.some(a => a.name === name);
  }

  /**
   * Launch a single agent - simplified interface for ImportHandler
   */
  async launchAgent(agentConfig: { name: string; role: string; tools: string[] }, projectPath: string): Promise<void> {
    // Find agent by name or create a new one
    let agent = this.getAgent(agentConfig.name);
    
    if (!agent) {
      // Register the agent if it doesn't exist
      await this.registerAgent({
        name: agentConfig.name,
        description: `${agentConfig.role} specialist`,
        tools: agentConfig.tools.length > 0 ? agentConfig.tools : ['Read', 'Edit', 'Write', 'Bash'],
        specialization: agentConfig.role
      });
      
      agent = this.getAgent(agentConfig.name);
    }

    if (!agent) {
      throw new Error(`Failed to create agent: ${agentConfig.name}`);
    }

    // Launch the agent using existing infrastructure
    const claudePath = await this.findClaudePath();
    const platform = process.platform;
    
    await this.launchAgentTerminal(agent, projectPath, claudePath, platform);
  }
}