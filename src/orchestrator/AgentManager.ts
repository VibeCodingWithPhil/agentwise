import * as os from 'os';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface Agent {
  name: string;
  description: string;
  tools: string[];
}

export class AgentManager {
  private agents: Agent[] = [
    {
      name: 'frontend-specialist',
      description: 'UI/UX development expert',
      tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob', 'WebFetch']
    },
    {
      name: 'backend-specialist',
      description: 'API and server development expert',
      tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob', 'WebFetch']
    },
    {
      name: 'database-specialist',
      description: 'Database architecture expert',
      tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob']
    },
    {
      name: 'devops-specialist',
      description: 'Infrastructure and deployment expert',
      tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob', 'WebFetch']
    },
    {
      name: 'testing-specialist',
      description: 'Quality assurance expert',
      tools: ['Read', 'Edit', 'Write', 'Bash', 'Grep', 'Glob']
    }
  ];

  getAgents(): Agent[] {
    return this.agents;
  }

  async launchAgents(projectPath: string): Promise<void> {
    const platform = os.platform();
    const claudePath = path.join(os.homedir(), '.claude', 'local', 'claude');
    
    for (const agent of this.agents) {
      await this.launchAgentTerminal(agent, projectPath, claudePath, platform);
      // Small delay between launches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async launchAgentTerminal(
    agent: Agent,
    projectPath: string,
    claudePath: string,
    platform: NodeJS.Platform
  ): Promise<void> {
    const agentCommand = `/agent "${agent.name}"`;
    const todoPath = path.join(projectPath, 'agent-todos', agent.name, 'phase1-todo.md');
    
    try {
      if (platform === 'darwin') {
        // macOS: Use Terminal.app
        const script = `
          tell application "Terminal"
            activate
            do script "cd '${projectPath}' && '${claudePath}' --dangerously-skip-permissions"
            delay 2
            do script "${agentCommand}" in front window
            delay 1
            do script "cat '${todoPath}'" in front window
          end tell
        `;
        
        // Properly escape the script: first backslashes, then quotes
        const escapedScript = script
          .replace(/\\/g, '\\\\')  // Escape backslashes first
          .replace(/"/g, '\\"');   // Then escape quotes
        
        await execAsync(`osascript -e "${escapedScript}"`);
        console.log(`✅ Launched ${agent.name} in Terminal tab`);
        
      } else if (platform === 'win32') {
        // Windows: Use Windows Terminal
        await execAsync(
          `wt new-tab --title "${agent.name}" cmd /k "cd /d ${projectPath} && ${claudePath} --dangerously-skip-permissions"`
        );
        console.log(`✅ Launched ${agent.name} in Windows Terminal tab`);
        
      } else {
        // Linux: Use gnome-terminal
        await execAsync(
          `gnome-terminal --tab --title="${agent.name}" -- bash -c "cd ${projectPath} && ${claudePath} --dangerously-skip-permissions; exec bash"`
        );
        console.log(`✅ Launched ${agent.name} in terminal tab`);
      }
    } catch (error) {
      console.error(`⚠️  Failed to launch ${agent.name}:`, error);
      // Fallback: Log instructions for manual launch
      console.log(`
Manual launch instructions for ${agent.name}:
1. Open a new terminal
2. cd ${projectPath}
3. ${claudePath} --dangerously-skip-permissions
4. ${agentCommand}
5. Review ${todoPath}
      `);
    }
  }
}