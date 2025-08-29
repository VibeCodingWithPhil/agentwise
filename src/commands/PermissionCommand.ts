/**
 * Permission Command - Manage the Permission Bypass System
 * 
 * Provides CLI interface for configuring and managing the Permission Bypass System
 * that allows Agentwise to function without --dangerously-skip-permissions flag.
 */

import { permissionIntegration } from '../permissions/PermissionIntegrationService';
import { AgentwiseConfig, DEFAULT_CONFIG } from '../permissions/PermissionBypassSystem';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as readline from 'readline';

export class PermissionCommand {
  /**
   * Handle permission-related commands
   */
  async handle(args: string[]): Promise<void> {
    const subcommand = args[0] || 'status';

    switch (subcommand) {
      case 'status':
        await this.showStatus();
        break;
      
      case 'enable':
        await this.enableBypass();
        break;
        
      case 'disable':
        await this.disableBypass();
        break;
        
      case 'configure':
        await this.configureSystem();
        break;
        
      case 'workspace':
        await this.manageWorkspace(args.slice(1));
        break;
        
      case 'allowed-dirs':
        await this.manageAllowedDirectories(args.slice(1));
        break;
        
      case 'reset':
        await this.resetConfiguration();
        break;
        
      case 'test':
        await this.testPermissions();
        break;
        
      case 'help':
      default:
        this.showHelp();
        break;
    }
  }

  /**
   * Show current permission system status
   */
  private async showStatus(): Promise<void> {
    try {
      const status = permissionIntegration.getIntegrationStatus();
      const config = permissionIntegration.getConfiguration();

      console.log('\n🔒 Permission Bypass System Status');
      console.log('═══════════════════════════════════════');
      console.log(`Integration Status: ${status.isIntegrated ? '✅ Active' : '❌ Inactive'}`);
      console.log(`Permission Bypass: ${status.permissionBypassEnabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`System Permissions: ${status.hasSystemPermissions ? '✅ Available' : '⚠️  Limited'}`);
      console.log(`Active Projects: ${status.activeProjects.length}`);
      
      if (status.activeProjects.length > 0) {
        status.activeProjects.forEach(project => {
          console.log(`  - ${project}`);
        });
      }

      console.log('\n📁 Workspace Configuration');
      console.log('═══════════════════════════════════════');
      console.log(`Workspace Root: ${config.permissions.workspaceRoot}`);
      console.log(`Allowed Directories: ${config.permissions.allowedDirectories.length}`);
      
      config.permissions.allowedDirectories.forEach(dir => {
        console.log(`  - ${dir}`);
      });

      console.log(`\nSystem Commands: ${config.permissions.systemAccessCommands.length}`);
      config.permissions.systemAccessCommands.forEach(cmd => {
        console.log(`  - ${cmd}`);
      });

      console.log('\n⚙️  System Settings');
      console.log('═══════════════════════════════════════');
      console.log(`Max Concurrent Agents: ${config.system.maxConcurrentAgents}`);
      console.log(`Token Optimization: ${config.system.tokenOptimization}`);
      console.log(`Performance Monitoring: ${config.system.enableMonitoring ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`Auto-Approve Common: ${config.permissions.autoApproveCommon ? '✅ Yes' : '❌ No'}`);
      console.log(`Verbose Logging: ${config.permissions.verboseLogging ? '✅ Yes' : '❌ No'}`);

    } catch (error) {
      console.error('❌ Error retrieving permission status:', error);
    }
  }

  /**
   * Enable permission bypass system
   */
  private async enableBypass(): Promise<void> {
    try {
      const config = permissionIntegration.getConfiguration();
      
      permissionIntegration.updateConfiguration({
        permissions: {
          ...config.permissions,
          enableBypass: true
        }
      });

      console.log('✅ Permission Bypass System enabled');
      console.log('🔒 Agentwise will now function without --dangerously-skip-permissions');
      console.log('🛡️  All operations will be sandboxed to workspace directories');
      
    } catch (error) {
      console.error('❌ Error enabling permission bypass:', error);
    }
  }

  /**
   * Disable permission bypass system
   */
  private async disableBypass(): Promise<void> {
    try {
      const config = permissionIntegration.getConfiguration();
      
      permissionIntegration.updateConfiguration({
        permissions: {
          ...config.permissions,
          enableBypass: false
        }
      });

      console.log('⚠️  Permission Bypass System disabled');
      console.log('📋 You will need to start Claude Code with --dangerously-skip-permissions');
      console.log('   for full Agentwise functionality');
      
    } catch (error) {
      console.error('❌ Error disabling permission bypass:', error);
    }
  }

  /**
   * Interactive configuration wizard
   */
  private async configureSystem(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      console.log('\n⚙️  Permission System Configuration Wizard');
      console.log('══════════════════════════════════════════════');

      const config = permissionIntegration.getConfiguration();

      // Enable/Disable bypass
      const enableBypass = await this.askQuestion(rl, 
        `Enable Permission Bypass System? (current: ${config.permissions.enableBypass}) [y/n]: `
      );
      
      if (enableBypass.toLowerCase() === 'y' || enableBypass.toLowerCase() === 'yes') {
        // Workspace root
        const workspaceRoot = await this.askQuestion(rl,
          `Workspace root directory (current: ${config.permissions.workspaceRoot}): `
        );

        // Auto-approve common operations
        const autoApprove = await this.askQuestion(rl,
          `Auto-approve common safe operations? (current: ${config.permissions.autoApproveCommon}) [y/n]: `
        );

        // Verbose logging
        const verboseLogging = await this.askQuestion(rl,
          `Enable verbose logging for debugging? (current: ${config.permissions.verboseLogging}) [y/n]: `
        );

        // Max concurrent agents
        const maxAgents = await this.askQuestion(rl,
          `Maximum concurrent agents (current: ${config.system.maxConcurrentAgents}): `
        );

        // Token optimization
        const tokenOpt = await this.askQuestion(rl,
          `Token optimization level [conservative/balanced/aggressive] (current: ${config.system.tokenOptimization}): `
        );

        // Apply configuration
        const newConfig: Partial<AgentwiseConfig> = {
          permissions: {
            ...config.permissions,
            enableBypass: true,
            workspaceRoot: workspaceRoot.trim() || config.permissions.workspaceRoot,
            autoApproveCommon: autoApprove.toLowerCase() === 'y' || autoApprove.toLowerCase() === 'yes',
            verboseLogging: verboseLogging.toLowerCase() === 'y' || verboseLogging.toLowerCase() === 'yes'
          },
          system: {
            ...config.system,
            maxConcurrentAgents: parseInt(maxAgents.trim()) || config.system.maxConcurrentAgents,
            tokenOptimization: (['conservative', 'balanced', 'aggressive'].includes(tokenOpt.trim())) 
              ? tokenOpt.trim() as 'conservative' | 'balanced' | 'aggressive'
              : config.system.tokenOptimization
          }
        };

        permissionIntegration.updateConfiguration(newConfig);
        console.log('\n✅ Configuration updated successfully!');
        
      } else {
        permissionIntegration.updateConfiguration({
          permissions: {
            ...config.permissions,
            enableBypass: false
          }
        });
        console.log('\n⚠️  Permission Bypass System disabled');
      }

    } catch (error) {
      console.error('❌ Error during configuration:', error);
    } finally {
      rl.close();
    }
  }

  /**
   * Manage workspace settings
   */
  private async manageWorkspace(args: string[]): Promise<void> {
    const action = args[0];
    const config = permissionIntegration.getConfiguration();

    switch (action) {
      case 'set':
        if (args[1]) {
          const newWorkspace = path.resolve(args[1]);
          permissionIntegration.updateConfiguration({
            permissions: {
              ...config.permissions,
              workspaceRoot: newWorkspace
            }
          });
          
          // Create the directory if it doesn't exist
          await fs.ensureDir(newWorkspace);
          console.log(`✅ Workspace root set to: ${newWorkspace}`);
        } else {
          console.log('❌ Please provide a workspace path');
          console.log('Usage: /permissions workspace set <path>');
        }
        break;

      case 'create':
        if (args[1]) {
          const projectName = args[1];
          const projectPath = await permissionIntegration.createProjectStructure(projectName);
          console.log(`✅ Created project workspace: ${projectPath}`);
        } else {
          console.log('❌ Please provide a project name');
          console.log('Usage: /permissions workspace create <project-name>');
        }
        break;

      case 'list':
        try {
          const workspaceDir = config.permissions.workspaceRoot;
          if (await fs.pathExists(workspaceDir)) {
            const projects = await fs.readdir(workspaceDir);
            console.log(`\n📁 Projects in workspace (${workspaceDir}):`);
            if (projects.length === 0) {
              console.log('  No projects found');
            } else {
              for (const project of projects) {
                const projectPath = path.join(workspaceDir, project);
                const stats = await fs.stat(projectPath);
                if (stats.isDirectory()) {
                  console.log(`  - ${project}`);
                }
              }
            }
          } else {
            console.log('❌ Workspace directory does not exist');
          }
        } catch (error) {
          console.error('❌ Error listing workspace projects:', error);
        }
        break;

      default:
        console.log('Available workspace commands:');
        console.log('  set <path>     - Set workspace root directory');
        console.log('  create <name>  - Create new project workspace');
        console.log('  list           - List all project workspaces');
        break;
    }
  }

  /**
   * Manage allowed directories
   */
  private async manageAllowedDirectories(args: string[]): Promise<void> {
    const action = args[0];
    const config = permissionIntegration.getConfiguration();

    switch (action) {
      case 'add':
        if (args[1]) {
          const newDir = path.resolve(args[1]);
          const updatedDirs = [...config.permissions.allowedDirectories, newDir];
          
          permissionIntegration.updateConfiguration({
            permissions: {
              ...config.permissions,
              allowedDirectories: updatedDirs
            }
          });
          
          console.log(`✅ Added allowed directory: ${newDir}`);
        } else {
          console.log('❌ Please provide a directory path');
          console.log('Usage: /permissions allowed-dirs add <path>');
        }
        break;

      case 'remove':
        if (args[1]) {
          const targetDir = path.resolve(args[1]);
          const updatedDirs = config.permissions.allowedDirectories.filter(dir => 
            path.resolve(dir) !== targetDir
          );
          
          permissionIntegration.updateConfiguration({
            permissions: {
              ...config.permissions,
              allowedDirectories: updatedDirs
            }
          });
          
          console.log(`✅ Removed allowed directory: ${targetDir}`);
        } else {
          console.log('❌ Please provide a directory path');
          console.log('Usage: /permissions allowed-dirs remove <path>');
        }
        break;

      case 'list':
        console.log('\n📂 Allowed Directories:');
        config.permissions.allowedDirectories.forEach((dir, index) => {
          console.log(`  ${index + 1}. ${dir}`);
        });
        break;

      default:
        console.log('Available allowed-dirs commands:');
        console.log('  add <path>     - Add directory to allowed list');
        console.log('  remove <path>  - Remove directory from allowed list');
        console.log('  list           - List all allowed directories');
        break;
    }
  }

  /**
   * Reset configuration to defaults
   */
  private async resetConfiguration(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    try {
      const confirm = await this.askQuestion(rl, 
        'Are you sure you want to reset to default configuration? [y/n]: '
      );
      
      if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
        permissionIntegration.updateConfiguration(DEFAULT_CONFIG);
        console.log('✅ Configuration reset to defaults');
      } else {
        console.log('Configuration reset cancelled');
      }
    } finally {
      rl.close();
    }
  }

  /**
   * Test permission system functionality
   */
  private async testPermissions(): Promise<void> {
    console.log('\n🧪 Testing Permission Bypass System');
    console.log('═══════════════════════════════════════');

    try {
      // Test 1: Workspace sandbox check
      console.log('Test 1: Workspace sandbox validation...');
      const config = permissionIntegration.getConfiguration();
      const workspacePath = path.join(config.permissions.workspaceRoot, 'test-project');
      const isInSandbox = await permissionIntegration.validateFileOperation('write', workspacePath);
      console.log(`  Workspace write access: ${isInSandbox ? '✅ PASS' : '❌ FAIL'}`);

      // Test 2: System directory restriction
      console.log('Test 2: System directory restriction...');
      const systemPath = '/usr/local/bin/test';
      const isSystemRestricted = !(await permissionIntegration.validateFileOperation('write', systemPath));
      console.log(`  System write restriction: ${isSystemRestricted ? '✅ PASS' : '❌ FAIL'}`);

      // Test 3: Allowed directory access
      console.log('Test 3: Allowed directory access...');
      const allowedPath = './package.json';
      const isAllowedAccess = await permissionIntegration.validateFileOperation('read', allowedPath);
      console.log(`  Allowed read access: ${isAllowedAccess ? '✅ PASS' : '❌ FAIL'}`);

      // Test 4: Integration status
      console.log('Test 4: Integration status...');
      const status = permissionIntegration.getIntegrationStatus();
      console.log(`  System integration: ${status.isIntegrated ? '✅ PASS' : '❌ FAIL'}`);

      // Test 5: Configuration loading
      console.log('Test 5: Configuration loading...');
      const loadedConfig = permissionIntegration.getConfiguration();
      const hasValidConfig = loadedConfig && loadedConfig.permissions && loadedConfig.system;
      console.log(`  Configuration loaded: ${hasValidConfig ? '✅ PASS' : '❌ FAIL'}`);

      console.log('\n📊 Test Results Summary');
      const passedTests = [isInSandbox, isSystemRestricted, isAllowedAccess, status.isIntegrated, hasValidConfig]
        .filter(Boolean).length;
      console.log(`Tests passed: ${passedTests}/5`);
      
      if (passedTests === 5) {
        console.log('🎉 All tests passed! Permission system is working correctly.');
      } else {
        console.log('⚠️  Some tests failed. Please check your configuration.');
      }

    } catch (error) {
      console.error('❌ Error during permission testing:', error);
    }
  }

  /**
   * Helper method to ask questions in CLI
   */
  private askQuestion(rl: readline.Interface, question: string): Promise<string> {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log('\n🔒 Permission Bypass System Commands');
    console.log('═══════════════════════════════════════════');
    console.log('Usage: /permissions <subcommand> [options]');
    console.log('');
    console.log('Subcommands:');
    console.log('  status              - Show current permission system status');
    console.log('  enable              - Enable permission bypass system');
    console.log('  disable             - Disable permission bypass system');
    console.log('  configure           - Interactive configuration wizard');
    console.log('  workspace <action>  - Manage workspace settings');
    console.log('    set <path>        - Set workspace root directory');
    console.log('    create <name>     - Create new project workspace');
    console.log('    list              - List all project workspaces');
    console.log('  allowed-dirs <action> - Manage allowed directories');
    console.log('    add <path>        - Add directory to allowed list');
    console.log('    remove <path>     - Remove directory from allowed list');
    console.log('    list              - List all allowed directories');
    console.log('  reset               - Reset configuration to defaults');
    console.log('  test                - Test permission system functionality');
    console.log('  help                - Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  /permissions status');
    console.log('  /permissions enable');
    console.log('  /permissions workspace create my-app');
    console.log('  /permissions allowed-dirs add ./custom-dir');
    console.log('  /permissions test');
    console.log('');
    console.log('📖 The Permission Bypass System allows Agentwise to function');
    console.log('   without the --dangerously-skip-permissions flag by providing');
    console.log('   workspace sandboxing and intelligent permission management.');
  }
}