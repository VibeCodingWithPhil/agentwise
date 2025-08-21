/**
 * Permission Checker - Detects if Claude Code was started with required flag
 * and offers to restart with proper permissions
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as readline from 'readline';

const execAsync = promisify(exec);

export class PermissionChecker {
  private static hasChecked = false;
  private static hasPermissions = false;

  /**
   * Check if Claude Code was started with --dangerously-skip-permissions
   */
  static async checkPermissions(): Promise<boolean> {
    if (this.hasChecked) {
      return this.hasPermissions;
    }

    try {
      // Try to perform an operation that requires permissions
      const testPath = path.join(process.cwd(), '.permission-test');
      
      // Try to execute a simple command
      await execAsync('echo "test"');
      
      // Try to write a test file
      await fs.writeFile(testPath, 'test');
      await fs.remove(testPath);
      
      this.hasPermissions = true;
    } catch (error) {
      // If any operation fails, we likely don't have permissions
      this.hasPermissions = false;
    }

    this.hasChecked = true;
    return this.hasPermissions;
  }

  /**
   * Prompt user to restart with proper permissions
   */
  static async promptForRestart(commandName: string): Promise<boolean> {
    console.log('\n⚠️  Permission Issue Detected');
    console.log('════════════════════════════════════════════');
    console.log(`The command "${commandName}" requires Claude Code to be started with`);
    console.log('the --dangerously-skip-permissions flag.\n');
    console.log('This flag is required for:');
    console.log('  • File system operations');
    console.log('  • Monitor dashboard access');
    console.log('  • Agent parallel execution');
    console.log('  • Global command installation\n');
    
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question('Would you like to restart Claude Code with the required flag? (y/n): ', async (answer) => {
        rl.close();
        
        if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
          console.log('\n📝 Instructions to restart with proper permissions:');
          console.log('════════════════════════════════════════════');
          console.log('1. Exit Claude Code (Ctrl+C or type "exit")');
          console.log('2. Restart with: claude --dangerously-skip-permissions');
          console.log('3. Run /resume to continue where you left off');
          console.log('4. Re-run your command: ' + commandName);
          
          // Save state for resume
          await this.saveStateForResume(commandName);
          
          console.log('\n💾 Your session state has been saved.');
          console.log('After restarting, use /resume to continue.\n');
          
          resolve(true);
        } else {
          console.log('\n⚠️  Warning: Some features may not work without proper permissions.');
          console.log('You can manually restart Claude Code with:');
          console.log('  claude --dangerously-skip-permissions\n');
          resolve(false);
        }
      });
    });
  }

  /**
   * Save current state for /resume command
   */
  private static async saveStateForResume(lastCommand: string): Promise<void> {
    const statePath = path.join(process.cwd(), '.agentwise-state.json');
    
    const state = {
      timestamp: new Date().toISOString(),
      lastCommand,
      workingDirectory: process.cwd(),
      activeProject: await this.getActiveProject()
    };

    await fs.writeJson(statePath, state, { spaces: 2 });
  }

  /**
   * Get the currently active project
   */
  private static async getActiveProject(): Promise<string | null> {
    try {
      const contextPath = path.join(process.cwd(), '.active-project');
      if (await fs.pathExists(contextPath)) {
        return await fs.readFile(contextPath, 'utf-8');
      }
    } catch {
      // Ignore errors
    }
    return null;
  }

  /**
   * Resume from saved state
   */
  static async resume(): Promise<void> {
    const statePath = path.join(process.cwd(), '.agentwise-state.json');
    
    if (!await fs.pathExists(statePath)) {
      console.log('No saved state found. Nothing to resume.');
      return;
    }

    try {
      const state = await fs.readJson(statePath);
      
      console.log('\n📂 Resuming Agentwise Session');
      console.log('════════════════════════════════════════════');
      console.log(`Last command: ${state.lastCommand}`);
      console.log(`Timestamp: ${state.timestamp}`);
      
      if (state.activeProject) {
        console.log(`Active project: ${state.activeProject}`);
        
        // Restore active project
        const contextPath = path.join(process.cwd(), '.active-project');
        await fs.writeFile(contextPath, state.activeProject);
      }
      
      console.log('\n✅ Session restored successfully!');
      console.log(`You can now run: ${state.lastCommand}\n`);
      
      // Clean up state file
      await fs.remove(statePath);
    } catch (error) {
      console.error('Failed to resume session:', error);
    }
  }

  /**
   * Check if a command requires permissions
   */
  static requiresPermissions(command: string): boolean {
    const commandsRequiringPermissions = [
      '/create',
      '/task',
      '/monitor',
      '/init-import',
      '/task-import',
      '/generate-agent',
      '/clone-website',
      '/upload',
      '/figma'
    ];

    return commandsRequiringPermissions.some(cmd => 
      command.toLowerCase().startsWith(cmd)
    );
  }

  /**
   * Wrap a command with permission check
   */
  static async withPermissionCheck(
    command: string, 
    callback: () => Promise<void>
  ): Promise<void> {
    // Check if command requires permissions
    if (!this.requiresPermissions(command)) {
      // Command doesn't require special permissions
      await callback();
      return;
    }

    // Check if we have permissions
    const hasPermissions = await this.checkPermissions();
    
    if (!hasPermissions) {
      // Prompt user to restart
      const shouldRestart = await this.promptForRestart(command);
      
      if (shouldRestart) {
        // User wants to restart, exit gracefully
        process.exit(0);
      } else {
        // User declined, try to run anyway (may fail)
        console.log('Attempting to run command without full permissions...\n');
        try {
          await callback();
        } catch (error) {
          console.error('\n❌ Command failed due to insufficient permissions.');
          console.error('Please restart Claude Code with: claude --dangerously-skip-permissions');
        }
      }
    } else {
      // We have permissions, run normally
      await callback();
    }
  }
}