#!/usr/bin/env node

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { MonitorCommand } from './commands/MonitorCommand';
import { DocsCommand } from './commands/DocsCommand';
import { FigmaCommand } from './commands/FigmaCommand';
import { PermissionChecker } from './utils/PermissionChecker';

async function main() {
  console.log(`
╔══════════════════════════════════════╗
║         🎭 AGENTWISE v2.0.0          ║
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
  /figma [subcommand]       - Figma Dev Mode integration

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
    // Handle /resume command first (doesn't need permission check)
    if (args[0] === '/resume') {
      await PermissionChecker.resume();
      return;
    }
    
    // Handle /monitor command with permission check
    if (args[0] === '/monitor') {
      await PermissionChecker.withPermissionCheck('/monitor', async () => {
        const monitorCommand = new MonitorCommand();
        await monitorCommand.handle(args.slice(1));
      });
      return;
    }
    
    // Handle /docs command
    if (args[0] === '/docs') {
      const docsCommand = new DocsCommand();
      await docsCommand.handle(args.slice(1));
      return;
    }
    
    // Handle /figma command
    if (args[0] === '/figma') {
      const figmaCommand = new FigmaCommand();
      await figmaCommand.handle(args.slice(1));
      return;
    }
    
    // Handle /init-import command
    if (args[0] === '/init-import') {
      const { ImportHandler } = await import('./commands/ImportHandler');
      const importHandler = new ImportHandler();
      await importHandler.initImport();
      return;
    }
    
    // Handle /task-import command
    if (args[0] === '/task-import') {
      const { ImportHandler } = await import('./commands/ImportHandler');
      const importHandler = new ImportHandler();
      await importHandler.executeImport();
      return;
    }
    
    // Handle /github command (LOCAL ONLY - not in repository)
    if (args[0] === '/github') {
      try {
        // Try to load the local-only GitHub management command
        const { GitHubManagementCommand } = await import('./commands/GitHubManagementCommand');
        const githubCommand = new GitHubManagementCommand();
        await githubCommand.handle(args.slice(1));
      } catch (error) {
        // Silently fail if the command doesn't exist (it's local-only)
        console.log('GitHub management command not available');
      }
      return;
    }
  }
}

main().catch(console.error);