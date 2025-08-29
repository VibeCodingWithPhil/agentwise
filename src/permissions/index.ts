/**
 * Permission Bypass System - Main Export
 * 
 * Central export point for all Permission Bypass System components.
 * This provides a clean API for using the permission system throughout Agentwise.
 */

// Core system exports
export { 
  PermissionBypassSystem, 
  DEFAULT_CONFIG,
  PermissionDecision,
  permissionSystem
} from './PermissionBypassSystem';

export type { 
  AgentwiseConfig, 
  PermissionContext 
} from './PermissionBypassSystem';

// Integration service exports
export { 
  PermissionIntegrationService, 
  permissionIntegration 
} from './PermissionIntegrationService';

// Command interface exports
export { PermissionCommand } from './PermissionCommand';

// Utility functions for common operations
import { permissionIntegration } from './PermissionIntegrationService';
import { permissionSystem } from './PermissionBypassSystem';
import * as path from 'path';

/**
 * Quick setup function for new projects
 */
export async function setupProjectPermissions(
  projectName: string,
  template: 'web-app' | 'backend' | 'fullstack' = 'web-app'
): Promise<string> {
  await permissionIntegration.initialize();
  return await permissionIntegration.createProjectStructure(projectName, template);
}

/**
 * Quick validation function for file operations
 */
export async function validatePath(
  filePath: string,
  operation: 'read' | 'write' | 'delete' = 'write'
): Promise<boolean> {
  return await permissionIntegration.validateFileOperation(operation, filePath);
}

/**
 * Check if permission bypass is currently active
 */
export async function isPermissionBypassActive(): Promise<boolean> {
  try {
    const status = permissionIntegration.getIntegrationStatus();
    return status.isIntegrated && status.permissionBypassEnabled;
  } catch (error) {
    return false;
  }
}

/**
 * Get workspace path for a project
 */
export function getProjectPath(projectName: string): string {
  return permissionIntegration.getProjectWorkspacePath(projectName);
}

/**
 * Safe command execution wrapper
 */
export async function executeWithPermissions<T>(
  command: string,
  projectName: string | undefined,
  callback: () => Promise<T>
): Promise<T> {
  return await permissionIntegration.withWorkspaceSafety(command, projectName, callback);
}

/**
 * Initialize the entire permission system
 */
export async function initializePermissionSystem(): Promise<boolean> {
  try {
    await permissionIntegration.initialize();
    return true;
  } catch (error) {
    console.error('Failed to initialize Permission Bypass System:', error);
    return false;
  }
}

/**
 * Get comprehensive system status
 */
export interface SystemStatus {
  permissionBypassActive: boolean;
  hasSystemPermissions: boolean;
  workspaceRoot: string;
  activeProjects: string[];
  configurationValid: boolean;
  integrationStatus: 'active' | 'inactive' | 'error';
  securityLevel: 'high' | 'medium' | 'low';
}

export async function getSystemStatus(): Promise<SystemStatus> {
  try {
    const integrationStatus = permissionIntegration.getIntegrationStatus();
    const config = permissionIntegration.getConfiguration();
    const needsBypass = await permissionIntegration.needsPermissionBypass();
    
    // Determine security level based on configuration
    let securityLevel: 'high' | 'medium' | 'low' = 'high';
    if (!config.permissions.enableBypass && !integrationStatus.hasSystemPermissions) {
      securityLevel = 'low'; // No bypass and no system permissions
    } else if (config.permissions.autoApproveCommon) {
      securityLevel = 'medium'; // Auto-approval enabled
    }
    
    return {
      permissionBypassActive: integrationStatus.permissionBypassEnabled,
      hasSystemPermissions: integrationStatus.hasSystemPermissions,
      workspaceRoot: config.permissions.workspaceRoot,
      activeProjects: integrationStatus.activeProjects,
      configurationValid: !!config && !!config.permissions && !!config.system,
      integrationStatus: integrationStatus.isIntegrated ? 'active' : 'inactive',
      securityLevel
    };
  } catch (error) {
    return {
      permissionBypassActive: false,
      hasSystemPermissions: false,
      workspaceRoot: './workspace',
      activeProjects: [],
      configurationValid: false,
      integrationStatus: 'error',
      securityLevel: 'low'
    };
  }
}

/**
 * Display system status in a human-readable format
 */
export async function displaySystemStatus(): Promise<void> {
  const status = await getSystemStatus();
  
  console.log('\n🔒 Agentwise Permission Bypass System Status');
  console.log('═══════════════════════════════════════════════');
  
  // Integration status
  const integrationIcon = status.integrationStatus === 'active' ? '✅' : '❌';
  console.log(`Integration: ${integrationIcon} ${status.integrationStatus.toUpperCase()}`);
  
  // Permission bypass status
  const bypassIcon = status.permissionBypassActive ? '🔒' : '⚠️';
  const bypassText = status.permissionBypassActive ? 'ACTIVE' : 'INACTIVE';
  console.log(`Permission Bypass: ${bypassIcon} ${bypassText}`);
  
  // System permissions
  const systemIcon = status.hasSystemPermissions ? '✅' : '⚠️';
  const systemText = status.hasSystemPermissions ? 'AVAILABLE' : 'LIMITED';
  console.log(`System Permissions: ${systemIcon} ${systemText}`);
  
  // Security level
  const securityIcons = { high: '🛡️', medium: '🔓', low: '⚠️' };
  const securityIcon = securityIcons[status.securityLevel];
  console.log(`Security Level: ${securityIcon} ${status.securityLevel.toUpperCase()}`);
  
  console.log(`\nWorkspace: ${status.workspaceRoot}`);
  console.log(`Active Projects: ${status.activeProjects.length}`);
  
  if (status.activeProjects.length > 0) {
    status.activeProjects.forEach(project => {
      console.log(`  - ${project}`);
    });
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  if (!status.permissionBypassActive && !status.hasSystemPermissions) {
    console.log('  • Enable Permission Bypass System with: /permissions enable');
    console.log('  • Or start Claude Code with: --dangerously-skip-permissions');
  } else if (status.permissionBypassActive) {
    console.log('  • Permission Bypass System is working correctly');
    console.log('  • You can use Agentwise without --dangerously-skip-permissions');
  } else {
    console.log('  • System permissions detected - all features available');
  }
  
  if (status.securityLevel === 'low') {
    console.log('  • Consider enabling Permission Bypass for better security');
  }
  
  console.log('\nFor more options, run: /permissions help');
}

/**
 * Emergency disable function for troubleshooting
 */
export async function emergencyDisable(): Promise<void> {
  try {
    const config = permissionIntegration.getConfiguration();
    permissionIntegration.updateConfiguration({
      permissions: {
        ...config.permissions,
        enableBypass: false
      }
    });
    
    console.log('⚠️  Permission Bypass System disabled');
    console.log('You will need to restart Claude Code with --dangerously-skip-permissions');
    
  } catch (error) {
    console.error('❌ Emergency disable failed:', error);
  }
}

/**
 * Health check function
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const status = await getSystemStatus();
    
    const checks = [
      status.configurationValid,
      status.integrationStatus === 'active',
      status.permissionBypassActive || status.hasSystemPermissions
    ];
    
    const passed = checks.filter(Boolean).length;
    const total = checks.length;
    
    console.log(`Health Check: ${passed}/${total} checks passed`);
    
    return passed === total;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
}

// Re-export everything for convenience
export * from './PermissionBypassSystem';
export * from './PermissionIntegrationService';
export * from './PermissionCommand';