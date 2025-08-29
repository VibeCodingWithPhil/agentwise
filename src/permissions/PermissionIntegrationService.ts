/**
 * Permission Integration Service
 * 
 * Integrates the PermissionBypassSystem with existing Agentwise components
 * to provide seamless permission management without requiring the
 * --dangerously-skip-permissions flag.
 */

import { PermissionBypassSystem, AgentwiseConfig, PermissionContext } from './PermissionBypassSystem';
import { PermissionChecker } from '../utils/PermissionChecker';
import { ProjectContextManager } from '../context/ProjectContextManager';
import * as path from 'path';
import * as fs from 'fs-extra';

/**
 * Integration service that connects permission system with existing components
 */
export class PermissionIntegrationService {
  private permissionSystem: PermissionBypassSystem;
  private contextManager?: ProjectContextManager;
  private isIntegrated = false;

  constructor(permissionSystem: PermissionBypassSystem) {
    this.permissionSystem = permissionSystem;
  }

  /**
   * Initialize integration with existing Agentwise systems
   */
  async initialize(): Promise<void> {
    if (this.isIntegrated) {
      return;
    }

    try {
      // Initialize the permission system
      await this.permissionSystem.initialize();

      // Set up event handlers
      this.setupEventHandlers();

      // Integrate with existing permission checker
      this.integrateWithPermissionChecker();

      // Set up project context integration
      await this.setupProjectContextIntegration();

      this.isIntegrated = true;
      console.log('✅ Permission Integration Service initialized');

    } catch (error) {
      console.error('❌ Failed to initialize Permission Integration Service:', error);
      throw error;
    }
  }

  /**
   * Create a workspace-safe command wrapper
   */
  async withWorkspaceSafety<T>(
    command: string,
    projectName: string | undefined,
    callback: () => Promise<T>
  ): Promise<T> {
    // If permission bypass is disabled, use original behavior
    const config = this.permissionSystem.getConfiguration();
    if (!config.permissions.enableBypass) {
      return await callback();
    }

    try {
      // Determine project path
      const projectPath = projectName 
        ? path.join(config.permissions.workspaceRoot, projectName)
        : process.cwd();

      // Initialize sandbox for the project
      if (projectName) {
        await this.permissionSystem.initializeSandbox(projectPath);
      }

      // Validate the command execution
      const isAllowed = await this.permissionSystem.validateExecution(command, {
        projectName,
        targetPath: projectPath,
        operation: 'execute'
      });

      if (!isAllowed) {
        throw new Error(`Command '${command}' not allowed in current context`);
      }

      // Execute the callback with workspace safety
      const originalCwd = process.cwd();
      
      if (projectName && this.permissionSystem.isWithinSandbox(projectPath)) {
        // Change to project directory for sandboxed execution
        process.chdir(projectPath);
      }

      try {
        const result = await callback();
        return result;
      } finally {
        // Restore original working directory
        process.chdir(originalCwd);
      }

    } catch (error) {
      console.error(`Error executing command '${command}':`, error);
      throw error;
    }
  }

  /**
   * Validate file operation with sandbox checking
   */
  async validateFileOperation(
    operation: 'read' | 'write' | 'delete',
    filePath: string,
    projectName?: string
  ): Promise<boolean> {
    const context: Partial<PermissionContext> = {
      targetPath: filePath,
      operation,
      projectName
    };

    return await this.permissionSystem.validateExecution(`file_${operation}`, context);
  }

  /**
   * Get safe workspace path for a project
   */
  getProjectWorkspacePath(projectName: string): string {
    const config = this.permissionSystem.getConfiguration();
    return path.join(config.permissions.workspaceRoot, projectName);
  }

  /**
   * Check if current environment needs permission bypass
   */
  async needsPermissionBypass(): Promise<boolean> {
    // Check if --dangerously-skip-permissions was used
    const hasPermissions = await PermissionChecker.checkPermissions();
    
    // If already has permissions, bypass is not needed
    if (hasPermissions) {
      return false;
    }

    // Check if permission bypass is enabled in config
    const config = this.permissionSystem.getConfiguration();
    return config.permissions.enableBypass;
  }

  /**
   * Create project structure with proper permissions
   */
  async createProjectStructure(projectName: string, template?: string): Promise<string> {
    const projectPath = this.getProjectWorkspacePath(projectName);
    
    // Initialize sandbox for the project
    await this.permissionSystem.initializeSandbox(projectPath);

    // Create additional structure based on template
    if (template) {
      await this.createTemplateStructure(projectPath, template);
    }

    return projectPath;
  }

  /**
   * Setup event handlers for permission system
   */
  private setupEventHandlers(): void {
    // Handle manual approval requests
    this.permissionSystem.on('manualApprovalRequired', (context) => {
      this.handleManualApprovalRequest(context);
    });

    // Handle sandbox initialization
    this.permissionSystem.on('sandboxInitialized', ({ projectName, projectPath }) => {
      console.log(`🔒 Sandbox initialized for project: ${projectName}`);
    });

    // Handle configuration updates
    this.permissionSystem.on('configurationUpdated', (config) => {
      console.log('⚙️  Permission configuration updated');
    });
  }

  /**
   * Integrate with existing PermissionChecker
   */
  private integrateWithPermissionChecker(): void {
    // Monkey patch PermissionChecker to use our system
    const originalWithPermissionCheck = PermissionChecker.withPermissionCheck;
    
    PermissionChecker.withPermissionCheck = async (command: string, callback: () => Promise<void>) => {
      // Check if we should use bypass system
      if (await this.needsPermissionBypass()) {
        // Use our permission bypass system
        const isAllowed = await this.permissionSystem.validateExecution(command);
        
        if (isAllowed) {
          await callback();
        } else {
          console.error(`❌ Command '${command}' denied by permission system`);
          throw new Error(`Permission denied for command: ${command}`);
        }
      } else {
        // Use original implementation
        await originalWithPermissionCheck.call(PermissionChecker, command, callback);
      }
    };
  }

  /**
   * Setup project context integration
   */
  private async setupProjectContextIntegration(): Promise<void> {
    try {
      // Import ProjectContextManager dynamically to avoid circular dependencies
      const { ProjectContextManager } = await import('../context/ProjectContextManager');
      this.contextManager = new ProjectContextManager();
      
      console.log('📁 Project context integration enabled');
    } catch (error) {
      console.log('⚠️  Project context integration not available:', error);
    }
  }

  /**
   * Handle manual approval requests
   */
  private async handleManualApprovalRequest(context: any): Promise<void> {
    console.log('\n🔐 Manual Permission Approval Required');
    console.log('═══════════════════════════════════════');
    console.log(`Command: ${context.command}`);
    console.log(`Target: ${context.targetPath}`);
    console.log(`Operation: ${context.operation}`);
    
    if (context.projectName) {
      console.log(`Project: ${context.projectName}`);
    }

    console.log('\nThis operation requires explicit permission.');
    console.log('The Permission Bypass System is protecting your system.');
    
    // For now, emit the response (in a real implementation, this would prompt the user)
    // This is a placeholder - actual implementation would use readline or similar
    setTimeout(() => {
      this.permissionSystem.emit('manualApprovalResponse', false); // Default to deny
    }, 100);
  }

  /**
   * Create template-based project structure
   */
  private async createTemplateStructure(projectPath: string, template: string): Promise<void> {
    const templates: Record<string, string[]> = {
      'web-app': [
        'src/components',
        'src/pages',
        'src/styles',
        'src/utils',
        'public',
        'tests'
      ],
      'backend': [
        'src/controllers',
        'src/models',
        'src/middleware',
        'src/routes',
        'src/services',
        'tests',
        'config'
      ],
      'fullstack': [
        'frontend/src/components',
        'frontend/src/pages',
        'frontend/public',
        'backend/src/controllers',
        'backend/src/models',
        'backend/src/routes',
        'shared/types',
        'tests'
      ]
    };

    const directories = templates[template] || templates['web-app'];
    
    for (const dir of directories) {
      await fs.ensureDir(path.join(projectPath, dir));
    }
  }

  /**
   * Get integration status
   */
  getIntegrationStatus(): {
    isIntegrated: boolean;
    permissionBypassEnabled: boolean;
    hasSystemPermissions: boolean;
    activeProjects: string[];
  } {
    const config = this.permissionSystem.getConfiguration();
    
    return {
      isIntegrated: this.isIntegrated,
      permissionBypassEnabled: config.permissions.enableBypass,
      hasSystemPermissions: false, // Will be updated by permission check
      activeProjects: Array.from((this.permissionSystem as any).activeSandboxes.keys())
    };
  }

  /**
   * Update permission configuration
   */
  updateConfiguration(updates: Partial<AgentwiseConfig>): void {
    this.permissionSystem.updateConfiguration(updates);
  }

  /**
   * Get current configuration
   */
  getConfiguration(): AgentwiseConfig {
    return this.permissionSystem.getConfiguration();
  }

  /**
   * Cleanup integration
   */
  async cleanup(): Promise<void> {
    await this.permissionSystem.cleanup();
    this.isIntegrated = false;
  }
}

/**
 * Singleton instance for global access
 */
let permissionSystemInstance: PermissionBypassSystem;

try {
  const { permissionSystem } = require('./PermissionBypassSystem');
  permissionSystemInstance = permissionSystem;
} catch (error) {
  // Fallback to creating a new instance if import fails
  permissionSystemInstance = new PermissionBypassSystem();
}

export const permissionIntegration = new PermissionIntegrationService(permissionSystemInstance);