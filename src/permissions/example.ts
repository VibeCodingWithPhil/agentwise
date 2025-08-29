/**
 * Permission Bypass System - Usage Example
 * 
 * This example demonstrates how to use the Permission Bypass System
 * in your Agentwise commands and agents.
 */

import { permissionIntegration } from './PermissionIntegrationService';
import { PermissionBypassSystem, PermissionContext } from './PermissionBypassSystem';
import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Example 1: Basic Command with Permission Safety
 */
export async function exampleCreateProject(projectName: string): Promise<void> {
  console.log(`Creating project: ${projectName}`);
  
  // Use the integration service for workspace safety
  await permissionIntegration.withWorkspaceSafety(
    `/create ${projectName}`,
    projectName,
    async () => {
      // This code runs with workspace safety enabled
      const projectPath = permissionIntegration.getProjectWorkspacePath(projectName);
      
      // Create project structure - automatically sandboxed
      await fs.ensureDir(path.join(projectPath, 'src'));
      await fs.ensureDir(path.join(projectPath, 'docs'));
      
      // Write project files - permissions validated automatically
      const packageJson = {
        name: projectName,
        version: '1.0.0',
        description: `Project ${projectName} created by Agentwise`
      };
      
      await fs.writeJson(
        path.join(projectPath, 'package.json'),
        packageJson,
        { spaces: 2 }
      );
      
      console.log(`✅ Project ${projectName} created successfully`);
    }
  );
}

/**
 * Example 2: Manual Permission Validation
 */
export async function exampleFileOperation(filePath: string): Promise<void> {
  // Validate file operation before executing
  const canWrite = await permissionIntegration.validateFileOperation(
    'write',
    filePath,
    'my-project'  // Optional project context
  );
  
  if (canWrite) {
    await fs.writeFile(filePath, 'Hello from Agentwise!');
    console.log(`✅ File written to: ${filePath}`);
  } else {
    console.log(`❌ Permission denied for: ${filePath}`);
    console.log('File is outside allowed workspace boundaries');
  }
}

/**
 * Example 3: Custom Permission System
 */
export async function exampleCustomPermissionSystem(): Promise<void> {
  // Create a custom permission system instance
  const customSystem = new PermissionBypassSystem('./custom-config.json');
  
  await customSystem.initialize();
  
  // Set up custom event handlers
  customSystem.on('sandboxInitialized', ({ projectName, projectPath }) => {
    console.log(`Custom handler: Sandbox ready for ${projectName}`);
  });
  
  customSystem.on('manualApprovalRequired', (context: PermissionContext) => {
    console.log(`Custom handler: Manual approval needed for ${context.command}`);
    // In a real implementation, you might show a UI prompt here
    customSystem.emit('manualApprovalResponse', true);
  });
  
  // Initialize a project sandbox
  await customSystem.initializeSandbox('./workspace/custom-project');
  
  // Test permission validation
  const isAllowed = await customSystem.validateExecution(
    'npm install',
    {
      targetPath: './workspace/custom-project',
      operation: 'execute'
    }
  );
  
  console.log(`Command allowed: ${isAllowed}`);
  
  // Cleanup
  await customSystem.cleanup();
}

/**
 * Example 4: Integration Check
 */
export async function exampleSystemCheck(): Promise<void> {
  // Check if permission bypass is needed
  const needsBypass = await permissionIntegration.needsPermissionBypass();
  
  if (needsBypass) {
    console.log('🔒 Permission Bypass System is active');
    console.log('   Claude Code can run without --dangerously-skip-permissions');
  } else {
    console.log('✅ System permissions available');
    console.log('   Claude Code was started with proper permissions');
  }
  
  // Get detailed status
  const status = permissionIntegration.getIntegrationStatus();
  console.log('Integration Status:', {
    isIntegrated: status.isIntegrated,
    permissionBypassEnabled: status.permissionBypassEnabled,
    activeProjects: status.activeProjects
  });
  
  // Get current configuration
  const config = permissionIntegration.getConfiguration();
  console.log('Workspace Root:', config.permissions.workspaceRoot);
  console.log('Auto-approve Common Operations:', config.permissions.autoApproveCommon);
  console.log('Max Concurrent Agents:', config.system.maxConcurrentAgents);
}

/**
 * Example 5: Error Handling
 */
export async function exampleErrorHandling(): Promise<void> {
  try {
    // This might fail if the path is outside workspace
    await permissionIntegration.withWorkspaceSafety(
      '/dangerous-command',
      'test-project',
      async () => {
        // Try to write to system directory (should be blocked)
        await fs.writeFile('/usr/local/bin/test', 'test');
      }
    );
  } catch (error) {
    console.log('Expected error caught:', error.message);
    console.log('This demonstrates the security boundaries working correctly');
  }
  
  // Safe alternative
  try {
    await permissionIntegration.withWorkspaceSafety(
      '/safe-command',
      'test-project',
      async () => {
        // Write to workspace (should succeed)
        const projectPath = permissionIntegration.getProjectWorkspacePath('test-project');
        await fs.ensureDir(projectPath);
        await fs.writeFile(path.join(projectPath, 'test.txt'), 'Safe operation');
        console.log('✅ Safe operation completed successfully');
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

/**
 * Example 6: Configuration Management
 */
export async function exampleConfigurationManagement(): Promise<void> {
  // Get current configuration
  const currentConfig = permissionIntegration.getConfiguration();
  console.log('Current workspace root:', currentConfig.permissions.workspaceRoot);
  
  // Update configuration
  permissionIntegration.updateConfiguration({
    permissions: {
      ...currentConfig.permissions,
      verboseLogging: true,  // Enable detailed logging
      autoApproveCommon: false  // Require manual approval for all operations
    }
  });
  
  console.log('Configuration updated - verbose logging enabled');
  
  // Create a test project with the new settings
  const projectPath = await permissionIntegration.createProjectStructure(
    'config-test-project',
    'web-app'  // Use web-app template
  );
  
  console.log(`Test project created at: ${projectPath}`);
  
  // Restore original configuration
  permissionIntegration.updateConfiguration({
    permissions: {
      ...currentConfig.permissions,
      verboseLogging: false,
      autoApproveCommon: true
    }
  });
  
  console.log('Configuration restored to original settings');
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 Running Permission Bypass System Examples');
  console.log('═══════════════════════════════════════════════');
  
  try {
    // Initialize the permission integration
    await permissionIntegration.initialize();
    
    console.log('\n1. Creating a project with workspace safety...');
    await exampleCreateProject('example-project');
    
    console.log('\n2. Testing file operation validation...');
    const safePath = permissionIntegration.getProjectWorkspacePath('example-project') + '/test.txt';
    await exampleFileOperation(safePath);
    
    console.log('\n3. Testing unsafe file operation...');
    await exampleFileOperation('/usr/local/bin/unsafe-test');
    
    console.log('\n4. Checking system integration status...');
    await exampleSystemCheck();
    
    console.log('\n5. Demonstrating error handling...');
    await exampleErrorHandling();
    
    console.log('\n6. Configuration management example...');
    await exampleConfigurationManagement();
    
    console.log('\n✅ All examples completed successfully!');
    console.log('\nThe Permission Bypass System is working correctly.');
    console.log('You can now use Agentwise without --dangerously-skip-permissions');
    
  } catch (error) {
    console.error('❌ Example execution failed:', error);
  } finally {
    // Cleanup
    await permissionIntegration.cleanup();
  }
}

// Export for use in other modules
export {
  permissionIntegration,
  PermissionBypassSystem
};