#!/usr/bin/env node

import * as fs from 'fs-extra';
import * as path from 'path';

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

  console.log('\nTo use Agentwise, run any command from within Claude Code.');
  console.log('Example: /create a todo app with React and Node.js\n');
}

main().catch(console.error);