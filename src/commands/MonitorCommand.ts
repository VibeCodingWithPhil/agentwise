/**
 * Monitor Command Handler - Handles /monitor command and global installation
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GlobalMonitorInstaller } from './GlobalMonitorInstaller';

const execAsync = promisify(exec);

export class MonitorCommand {
  private installer: GlobalMonitorInstaller;
  private monitorPath: string;

  constructor() {
    this.installer = new GlobalMonitorInstaller();
    this.monitorPath = path.resolve(path.join(process.cwd(), 'src', 'monitor'));
  }

  /**
   * Handle the /monitor command
   */
  async handle(args: string[] = []): Promise<void> {
    console.log('🎭 Agentwise Monitor Dashboard');
    console.log('============================\n');

    // Check if monitor directory exists
    if (!await fs.pathExists(this.monitorPath)) {
      console.error('❌ Monitor directory not found');
      console.error('Please ensure you\'re running this from the Agentwise project root');
      return;
    }

    // Handle subcommands
    if (args.length > 0) {
      const subcommand = args[0].toLowerCase();
      
      switch (subcommand) {
        case 'install':
        case 'global':  // Support both 'install' and 'global'
          await this.installGlobalCommand();
          return;
        case 'uninstall':
          await this.uninstallGlobalCommand();
          return;
        case 'status':
          await this.showStatus();
          return;
        case 'help':
          this.showHelp();
          return;
        default:
          console.warn(`⚠️  Unknown subcommand: ${subcommand}`);
          this.showHelp();
          return;
      }
    }

    // Default: Start monitor and install global command if not already installed
    await this.startMonitor();
  }

  /**
   * Start the monitor dashboard
   */
  private async startMonitor(): Promise<void> {
    try {
      // Check if global command is installed, if not, install it
      const isInstalled = await this.installer.isInstalled();
      if (!isInstalled) {
        console.log('🔧 Installing global monitor command for future use...');
        const result = await this.installer.install();
        
        if (result.success) {
          console.log(`✅ ${result.message}`);
          console.log('💡 You can now run "agentwise-monitor" from anywhere!\n');
        } else {
          console.warn(`⚠️  ${result.message}`);
          console.log('Monitor will still start, but global command not available\n');
        }
      }

      console.log('🚀 Starting Agentwise Monitor Dashboard...');
      console.log('📍 Monitor path:', this.monitorPath);
      console.log('🌐 Dashboard URL: http://localhost:3001');
      console.log('📊 WebSocket server: ws://localhost:3002');
      console.log('\n🔄 The monitor will auto-open in your browser');
      console.log('Press Ctrl+C to stop the monitor\n');

      // Validate monitor path before changing directory
      if (!this.monitorPath.includes(process.cwd())) {
        throw new Error('Monitor path validation failed - path traversal detected');
      }
      
      // Change to monitor directory and start
      process.chdir(this.monitorPath);
      
      // Use spawn instead of exec for better process control
      const { spawn } = require('child_process');
      const startScript = path.join(this.monitorPath, 'start.sh');
      
      // Make sure start.sh is executable
      await fs.chmod(startScript, '755');
      
      // Check if dependencies are installed
      const depsPath = path.join(this.monitorPath, 'node_modules');
      if (!await fs.pathExists(depsPath)) {
        console.log('📦 Installing monitor dependencies (first time setup)...');
        try {
          await execAsync('npm install', { cwd: this.monitorPath });
          console.log('✅ Dependencies installed');
        } catch (error) {
          console.error('❌ Failed to install dependencies:', error);
        }
      }
      
      // Start the monitor
      const monitorProcess = spawn('bash', [startScript], {
        stdio: 'inherit',
        cwd: this.monitorPath,
        detached: false  // Keep attached to parent process
      });
      
      // Keep the parent process alive
      process.stdin.resume();

      // Handle process events
      monitorProcess.on('error', (error) => {
        console.error('❌ Failed to start monitor:', error.message);
        console.log('\n💡 Try running: cd src/monitor && npm install && npm start');
        process.exit(1);
      });

      monitorProcess.on('exit', (code) => {
        if (code !== 0) {
          console.log(`\n🛑 Monitor stopped with exit code: ${code}`);
        } else {
          console.log('\n✅ Monitor stopped successfully');
        }
        process.exit(code || 0);
      });
      
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Stopping monitor...');
        monitorProcess.kill('SIGTERM');
        setTimeout(() => process.exit(0), 1000);
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down monitor...');
        monitorProcess.kill('SIGTERM');
        process.exit(0);
      });

    } catch (error) {
      console.error('❌ Error starting monitor:', error.message);
      
      // Fallback: try manual start
      console.log('\n🔄 Attempting fallback startup...');
      try {
        await execAsync('./start.sh', { cwd: this.monitorPath });
      } catch (fallbackError) {
        console.error('❌ Fallback startup also failed:', fallbackError.message);
        console.log('\n💡 Manual startup instructions:');
        console.log('   1. cd src/monitor');
        console.log('   2. ./start.sh');
      }
    }
  }

  /**
   * Install global command
   */
  private async installGlobalCommand(): Promise<void> {
    console.log('🔧 Installing global agentwise-monitor command...\n');
    
    const result = await this.installer.install();
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
      
      if (result.commandPath) {
        console.log(`📍 Command installed at: ${result.commandPath}`);
      }
      
      console.log('\n💡 Usage:');
      console.log('   agentwise-monitor          # Start monitor dashboard');
      console.log('   agentwise-monitor status   # Check installation status');
      console.log('   agentwise-monitor help     # Show help');
      
    } else {
      console.error(`❌ ${result.message}`);
      console.log('\n🔧 You may need to:');
      console.log('   - Run with appropriate permissions');
      console.log('   - Check your PATH environment variable');
      console.log('   - Manually add the command to your shell profile');
    }
  }

  /**
   * Uninstall global command
   */
  private async uninstallGlobalCommand(): Promise<void> {
    console.log('🗑️  Uninstalling global agentwise-monitor command...\n');
    
    const result = await this.installer.uninstall();
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ ${result.message}`);
    }
  }

  /**
   * Show installation status
   */
  private async showStatus(): Promise<void> {
    console.log('📊 Agentwise Monitor Status\n');
    
    const status = await this.installer.getStatus();
    
    console.log(`Platform: ${status.platform}`);
    console.log(`Global command installed: ${status.installed ? '✅ Yes' : '❌ No'}`);
    
    if (status.installed) {
      if (status.commandPath) {
        console.log(`Command path: ${status.commandPath}`);
      }
      if (status.version) {
        console.log(`Version: ${status.version}`);
      }
    }
    
    // Check monitor directory
    const monitorExists = await fs.pathExists(this.monitorPath);
    console.log(`Monitor directory: ${monitorExists ? '✅ Found' : '❌ Missing'}`);
    
    if (monitorExists) {
      console.log(`Monitor path: ${this.monitorPath}`);
      
      // Check if dependencies are installed
      const nodeModulesPath = path.join(this.monitorPath, 'node_modules');
      const depsInstalled = await fs.pathExists(nodeModulesPath);
      console.log(`Dependencies installed: ${depsInstalled ? '✅ Yes' : '❌ No'}`);
      
      if (!depsInstalled) {
        console.log('\n💡 To install dependencies:');
        console.log('   cd src/monitor && npm install');
      }
    }
    
    console.log('\n💡 Usage:');
    console.log('   /monitor                   # Start monitor (Claude Code)');
    console.log('   agentwise-monitor          # Start monitor (global command)');
    console.log('   agentwise-monitor install  # Install global command');
    console.log('   agentwise-monitor status   # Show this status');
  }

  /**
   * Show help
   */
  private showHelp(): void {
    console.log('🎭 Agentwise Monitor Command Help\n');
    console.log('Usage:');
    console.log('   /monitor [subcommand]\n');
    console.log('Subcommands:');
    console.log('   (none)     Start the monitor dashboard');
    console.log('   install    Install global agentwise-monitor command');
    console.log('   uninstall  Remove global agentwise-monitor command');
    console.log('   status     Show installation and system status');
    console.log('   help       Show this help message\n');
    console.log('Global Command (after installation):');
    console.log('   agentwise-monitor          # Start monitor from anywhere');
    console.log('   agentwise-monitor status   # Check status');
    console.log('   agentwise-monitor help     # Show help\n');
    console.log('Dashboard Features:');
    console.log('   • Real-time agent status monitoring');
    console.log('   • Live task completion tracking');
    console.log('   • Interactive agent controls (pause/resume)');
    console.log('   • System health and performance metrics');
    console.log('   • WebSocket-based live updates\n');
    console.log('Requirements:');
    console.log('   • Node.js 18+ installed');
    console.log('   • Monitor dependencies: cd src/monitor && npm install');
    console.log('   • Claude Code with --dangerously-skip-permissions flag');
  }
}