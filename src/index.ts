#!/usr/bin/env node

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { MonitorCommand } from './commands/MonitorCommand';
import { DocsCommand } from './commands/DocsCommand';

async function main() {
  console.log(`
╔══════════════════════════════════════╗
║         🎭 AGENTWISE v1.0.0          ║
║   Multi-Agent Orchestration System   ║
║        for Claude Code               ║
╚══════════════════════════════════════╝

Available Commands:
  /create <project idea>     - Create new project
  /create-plan <idea>        - Collaborative planning
  /projects                  - List existing projects
  /task <feature>           - Add feature to active project
  /task-[project] <feature> - Add feature to specific project
  /task-plan <feature>      - Plan feature collaboratively
  /init-import              - Import external project
  /task-import              - Execute import with planning
  /generate-agent <spec>    - Create custom agent
  /monitor [subcommand]     - Monitor dashboard & global install
  /docs                     - Open documentation hub

Status: ✅ System Ready
`);

  // Check if .claude folder exists
  const claudePath = path.join(__dirname, '..', '.claude');
  if (await fs.pathExists(claudePath)) {
    const agents = await fs.readdir(path.join(claudePath, 'agents'));
    console.log(`Agents Available: ${agents.length}`);
    agents.forEach(agent => console.log(`  - ${agent.replace('.md', '')}`));
  }

  // Check workspace
  const workspacePath = path.join(__dirname, '..', 'workspace');
  if (await fs.pathExists(workspacePath)) {
    const projects = await fs.readdir(workspacePath);
    console.log(`\nProjects in Workspace: ${projects.length}`);
  }

  // Auto-start monitor if not running
  const monitorPath = path.join(__dirname, 'monitor');
  if (await fs.pathExists(monitorPath)) {
    exec('lsof -ti:3001,3002', (error, stdout) => {
      if (!stdout || stdout.trim() === '') {
        console.log('\n📊 Starting Agentwise Monitor...');
        exec(`cd ${monitorPath} && ./start.sh`, (error) => {
          if (!error) {
            console.log('Monitor dashboard available at: http://localhost:3001');
          }
        });
      } else {
        console.log('\n📊 Monitor dashboard already running at: http://localhost:3001');
      }
    });
  }

  console.log('\nTo use Agentwise, run any command from within Claude Code.');
  console.log('Example: /create a todo app with React and Node.js\n');
  
  // Handle command line arguments
  const args = process.argv.slice(2);
  if (args.length > 0) {
    // Handle /monitor command
    if (args[0] === '/monitor') {
      const monitorCommand = new MonitorCommand();
      await monitorCommand.handle(args.slice(1));
      return;
    }
    
    // Handle /docs command
    if (args[0] === '/docs') {
      const docsCommand = new DocsCommand();
      await docsCommand.handle(args.slice(1));
      return;
    }
  }
}

main().catch(console.error);