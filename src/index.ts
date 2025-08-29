#!/usr/bin/env node

import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { MonitorCommand } from './commands/MonitorCommand';
import { DocsCommand } from './commands/DocsCommand';
import { FigmaCommand } from './commands/FigmaCommand';
import { FigmaCreateCommand } from './commands/FigmaCreateCommand';
import { PermissionChecker } from './utils/PermissionChecker';
import { permissionIntegration } from './permissions/PermissionIntegrationService';
import { configurationIntegration } from './config/ConfigurationIntegration.js';
import { SandboxedExecutionSystem } from './sandbox/SandboxedExecutionSystem';
import { AgentwiseConfiguration } from './config/AgentwiseConfiguration';
import { ConfigureAgentwiseCommand } from './commands/ConfigureAgentwiseCommand';

/**
 * SECURITY: Securely start SharedContextServer with proper validation and error handling
 */
async function startSharedContextServerSecurely(): Promise<void> {
  try {
    // Check if port is already in use (safer than lsof command)
    const net = require('net');
    const server = net.createServer();
    
    await new Promise<void>((resolve, reject) => {
      server.listen(3003, () => {
        server.close();
        // Port is available, start the context server
        startContextServerProcess();
        resolve();
      });
      
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.log('\n🔗 SharedContextServer already running at: http://localhost:3003');
          console.log('💡 Token optimization active');
          resolve();
        } else {
          reject(err);
        }
      });
    });
  } catch (error) {
    console.log('⚠️  Could not start SharedContextServer:', error);
  }
}

/**
 * SECURITY: Safely spawn the context server process with proper validation
 */
function startContextServerProcess(): void {
  console.log('\n🔗 Starting SharedContextServer for token optimization...');
  
  // Validate the script path exists and is safe
  // Use the working JavaScript version, not the TypeScript compiled one
  const contextServerScript = path.join(__dirname, 'context/startContextServer-working.js');
  const resolvedPath = path.resolve(contextServerScript);
  
  // Security check: ensure the script is within our project directory
  const projectRoot = path.resolve(__dirname, '..');
  if (!resolvedPath.startsWith(projectRoot)) {
    console.error('⚠️  Security: Context server script path is outside project directory');
    return;
  }

  // Check if the script file exists
  if (!fs.existsSync(resolvedPath)) {
    console.log('⚠️  Context server script not found, skipping shared context optimization');
    return;
  }

  try {
    const { spawn } = require('child_process');
    const contextServer = spawn('node', [resolvedPath], {
      detached: true,
      stdio: ['ignore', 'ignore', 'pipe'], // Capture stderr for error handling
      cwd: projectRoot // Set safe working directory
    });

    // Handle process errors
    contextServer.on('error', (error: Error) => {
      console.error('⚠️  Failed to start SharedContextServer:', error.message);
    });

    contextServer.stderr?.on('data', (data: Buffer) => {
      const error = data.toString().trim();
      if (error) {
        console.error('SharedContextServer error:', error);
      }
    });

    // Handle process exit
    contextServer.on('exit', (code: number | null, signal: string | null) => {
      if (code && code !== 0) {
        console.log(`⚠️  SharedContextServer exited with code ${code}`);
      }
    });

    contextServer.unref();
    
    // Give it a moment to start
    setTimeout(() => {
      console.log('SharedContextServer available at: http://localhost:3003');
      console.log('💡 Token optimization active for all agents');
    }, 2000);
  } catch (error) {
    console.error('⚠️  Error spawning SharedContextServer:', error);
  }
}

async function main() {
  // Initialize Configuration System
  const config = AgentwiseConfiguration.getInstance();
  await config.load();
  await configurationIntegration.initializeOnStartup();
  
  // Initialize Sandboxed Execution System if enabled
  const sandboxSystem = new SandboxedExecutionSystem();
  const configData = config.getAll();
  
  if (configData.permissions?.bypassEnabled) {
    console.log('🔐 Sandboxed execution system enabled - no --dangerously-skip-permissions needed');
  }
  
  // Initialize Permission Bypass System
  try {
    await permissionIntegration.initialize();
    const status = permissionIntegration.getIntegrationStatus();
    const permissionStatus = status.permissionBypassEnabled ? '🔒 Permission Bypass Active' : '⚠️  Manual Permissions Required';
    
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
  /context [subcommand]     - Shared context server management
  /docs                     - Open documentation hub
  /figma [subcommand]       - Figma Dev Mode integration
  /figma-create <project>   - Create app from Figma design
  /setup-mcps [subcommand]  - Configure MCPs for Claude Code
  /knowledge [subcommand]   - Knowledge graph analysis and queries
  /configure-agentwise      - Configure Agentwise settings
  /configure-agentwise      - Configure Agentwise system settings
  /permissions [subcommand] - Manage Permission Bypass System
  /configure-agentwise      - Configure Agentwise system settings

Status: ✅ System Ready | ${permissionStatus}
`);
  } catch (error) {
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
  /context [subcommand]     - Shared context server management
  /docs                     - Open documentation hub
  /figma [subcommand]       - Figma Dev Mode integration
  /figma-create <project>   - Create app from Figma design
  /setup-mcps [subcommand]  - Configure MCPs for Claude Code
  /knowledge [subcommand]   - Knowledge graph analysis and queries
  /configure-agentwise      - Configure Agentwise settings
  /configure-agentwise      - Configure Agentwise system settings

Status: ✅ System Ready | ⚠️  Permission System Error: ${error}
`);
  }

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

  // Auto-start SharedContextServer if not running (SECURITY: Improved process spawning)
  await startSharedContextServerSecurely();

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
    
    // Handle /context command
    if (args[0] === '/context') {
      const { ContextCommand } = await import('./commands/ContextCommand');
      const contextCommand = new ContextCommand();
      await contextCommand.handle(args.slice(1));
      return;
    }
    
    // Handle /docs command
    if (args[0] === '/docs') {
      const docsCommand = new DocsCommand();
      await docsCommand.handle(args.slice(1));
      return;
    }
    
    // Handle /permissions command
    if (args[0] === '/permissions') {
      const { PermissionCommand } = await import('./commands/PermissionCommand');
      const permissionCommand = new PermissionCommand();
      await permissionCommand.handle(args.slice(1));
      return;
    }
    
    // Handle /figma command
    if (args[0] === '/figma') {
      const figmaCommand = new FigmaCommand();
      await figmaCommand.handle(args.slice(1));
      return;
    }
    
    // Handle /figma-create command
    if (args[0] === '/figma-create') {
      const figmaCreateCommand = new FigmaCreateCommand();
      await figmaCreateCommand.handle(args.slice(1));
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
    
    // Handle /setup-mcps command
    if (args[0] === '/setup-mcps') {
      const { MCPSetupCommand } = await import('./commands/MCPSetupCommand');
      const mcpSetupCommand = new MCPSetupCommand();
      await mcpSetupCommand.handle(args.slice(1));
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
    
    // Handle /knowledge command
    if (args[0] === '/knowledge') {
      const { KnowledgeGraphCommand } = await import('./commands/KnowledgeGraphCommand');
      const { CodebaseContextManager } = await import('./context/CodebaseContextManager');
      
      const contextManager = new CodebaseContextManager();
      const knowledgeCommand = new KnowledgeGraphCommand(contextManager);
      
      // Get current working directory as project path
      const currentDir = process.cwd();
      await knowledgeCommand.handleKnowledgeCommand(args.slice(1), currentDir);
      return;
    }
    
    // Handle /configure-agentwise command
    if (args[0] === '/configure-agentwise') {
      const { ConfigureAgentwiseCommand } = await import('./commands/ConfigureAgentwiseCommand');
      const configureCommand = new ConfigureAgentwiseCommand();
      await configureCommand.execute(args.slice(1));
      return;
    }
  }
}

main().catch(console.error);