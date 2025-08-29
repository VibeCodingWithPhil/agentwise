/**
 * Permission Command Interface
 * 
 * Provides command-line interface for managing the Permission Bypass System
 */

import { PermissionIntegrationService } from './PermissionIntegrationService';
import { AgentwiseConfig } from './PermissionBypassSystem';
import * as path from 'path';

export interface CommandResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Command interface for permission system management
 */
export class PermissionCommand {
  private integrationService: PermissionIntegrationService;

  constructor(integrationService: PermissionIntegrationService) {
    this.integrationService = integrationService;
  }

  /**
   * Enable permission bypass system
   */
  async enable(): Promise<CommandResult> {
    try {
      const config = this.integrationService.getConfiguration();
      this.integrationService.updateConfiguration({
        permissions: {
          ...config.permissions,
          enableBypass: true
        }
      });

      return {
        success: true,
        message: '✅ Permission Bypass System enabled'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to enable permission bypass: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Disable permission bypass system
   */
  async disable(): Promise<CommandResult> {
    try {
      const config = this.integrationService.getConfiguration();
      this.integrationService.updateConfiguration({
        permissions: {
          ...config.permissions,
          enableBypass: false
        }
      });

      return {
        success: true,
        message: '⚠️  Permission Bypass System disabled'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to disable permission bypass: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Show current status
   */
  async status(): Promise<CommandResult> {
    try {
      const status = this.integrationService.getIntegrationStatus();
      
      return {
        success: true,
        message: 'Permission system status retrieved',
        data: status
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to get status: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Initialize a project sandbox
   */
  async initProject(projectName: string, template?: string): Promise<CommandResult> {
    try {
      const projectPath = await this.integrationService.createProjectStructure(projectName, template);
      
      return {
        success: true,
        message: `✅ Project '${projectName}' initialized at ${projectPath}`,
        data: { projectPath }
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to initialize project: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Validate a file operation
   */
  async validateFile(filePath: string, operation: 'read' | 'write' | 'delete' = 'write'): Promise<CommandResult> {
    try {
      const isValid = await this.integrationService.validateFileOperation(operation, filePath);
      
      return {
        success: true,
        message: isValid ? `✅ ${operation} operation allowed for ${filePath}` : `❌ ${operation} operation denied for ${filePath}`,
        data: { isValid, operation, filePath }
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to validate file operation: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Update configuration
   */
  async configure(updates: Partial<AgentwiseConfig>): Promise<CommandResult> {
    try {
      this.integrationService.updateConfiguration(updates);
      
      return {
        success: true,
        message: '✅ Configuration updated'
      };
    } catch (error) {
      return {
        success: false,
        message: `❌ Failed to update configuration: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Show help information
   */
  async help(): Promise<CommandResult> {
    const helpText = `
🔒 Agentwise Permission Bypass System Commands

Basic Commands:
  enable          - Enable permission bypass system
  disable         - Disable permission bypass system  
  status          - Show current system status
  help            - Show this help message

Project Management:
  init <name>     - Initialize project sandbox
  validate <path> - Check if file operation is allowed

Configuration:
  configure       - Update system configuration

Examples:
  /permissions enable
  /permissions init my-web-app
  /permissions validate ./src/app.ts write
  /permissions status

The Permission Bypass System allows Agentwise to work without
--dangerously-skip-permissions by providing intelligent sandboxing
and automatic permission handling.
    `;

    return {
      success: true,
      message: helpText
    };
  }
}