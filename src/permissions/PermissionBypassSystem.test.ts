/**
 * Permission Bypass System - Unit Tests
 * 
 * Comprehensive tests for the Permission Bypass System functionality
 */

import { PermissionBypassSystem, DEFAULT_CONFIG, PermissionDecision } from './PermissionBypassSystem';
import { PermissionIntegrationService } from './PermissionIntegrationService';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';

describe('PermissionBypassSystem', () => {
  let permissionSystem: PermissionBypassSystem;
  let tempDir: string;
  let configPath: string;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentwise-test-'));
    configPath = path.join(tempDir, '.agentwise-config.json');
    
    permissionSystem = new PermissionBypassSystem(configPath);
  });

  afterEach(async () => {
    // Cleanup
    await permissionSystem.cleanup();
    await fs.remove(tempDir);
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      await permissionSystem.initialize();
      const config = permissionSystem.getConfiguration();
      
      expect(config.permissions.enableBypass).toBe(true);
      expect(config.permissions.workspaceRoot).toBe('./workspace');
      expect(config.system.maxConcurrentAgents).toBe(3);
    });

    it('should create configuration file on first run', async () => {
      await permissionSystem.initialize();
      
      const configExists = await fs.pathExists(configPath);
      expect(configExists).toBe(true);
      
      const savedConfig = await fs.readJson(configPath);
      expect(savedConfig.permissions.enableBypass).toBe(true);
    });

    it('should load existing configuration', async () => {
      const customConfig = {
        ...DEFAULT_CONFIG,
        permissions: {
          ...DEFAULT_CONFIG.permissions,
          enableBypass: false,
          workspaceRoot: './custom-workspace'
        }
      };
      
      await fs.writeJson(configPath, customConfig);
      await permissionSystem.initialize();
      
      const config = permissionSystem.getConfiguration();
      expect(config.permissions.enableBypass).toBe(false);
      expect(config.permissions.workspaceRoot).toBe('./custom-workspace');
    });
  });

  describe('Sandbox Management', () => {
    beforeEach(async () => {
      await permissionSystem.initialize();
    });

    it('should initialize project sandbox', async () => {
      const projectPath = path.join(tempDir, 'workspace', 'test-project');
      
      await permissionSystem.initializeSandbox(projectPath);
      
      // Check if project structure was created
      expect(await fs.pathExists(projectPath)).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'src'))).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, '.agentwise'))).toBe(true);
      
      const metadata = await fs.readJson(path.join(projectPath, '.agentwise', 'metadata.json'));
      expect(metadata.sandboxInitialized).toBe(true);
    });

    it('should validate sandbox boundaries', async () => {
      const workspaceDir = path.join(tempDir, 'workspace');
      const projectPath = path.join(workspaceDir, 'test-project');
      const systemPath = '/usr/local/bin/test';
      
      // Update config to use temp directory
      permissionSystem.updateConfiguration({
        permissions: {
          ...permissionSystem.getConfiguration().permissions,
          workspaceRoot: workspaceDir
        }
      });
      
      await permissionSystem.initializeSandbox(projectPath);
      
      // Test sandbox boundary validation
      expect(permissionSystem.isWithinSandbox(projectPath)).toBe(true);
      expect(permissionSystem.isWithinSandbox(path.join(projectPath, 'src/app.ts'))).toBe(true);
      expect(permissionSystem.isWithinSandbox(systemPath)).toBe(false);
    });

    it('should handle allowed directories outside workspace', async () => {
      const allowedDir = path.join(tempDir, 'allowed');
      await fs.ensureDir(allowedDir);
      
      permissionSystem.updateConfiguration({
        permissions: {
          ...permissionSystem.getConfiguration().permissions,
          allowedDirectories: [allowedDir]
        }
      });
      
      expect(permissionSystem.isWithinSandbox(allowedDir)).toBe(true);
      expect(permissionSystem.isWithinSandbox(path.join(allowedDir, 'file.txt'))).toBe(true);
    });
  });

  describe('Permission Validation', () => {
    beforeEach(async () => {
      await permissionSystem.initialize();
    });

    it('should allow operations within workspace', async () => {
      const workspaceDir = path.join(tempDir, 'workspace');
      const projectPath = path.join(workspaceDir, 'test-project');
      
      permissionSystem.updateConfiguration({
        permissions: {
          ...permissionSystem.getConfiguration().permissions,
          workspaceRoot: workspaceDir
        }
      });
      
      const isAllowed = await permissionSystem.validateExecution(
        'write file',
        { targetPath: projectPath, operation: 'write' }
      );
      
      expect(isAllowed).toBe(true);
    });

    it('should deny operations outside workspace', async () => {
      const systemPath = '/usr/local/bin/test';
      
      const isAllowed = await permissionSystem.validateExecution(
        'write file',
        { targetPath: systemPath, operation: 'write' }
      );
      
      expect(isAllowed).toBe(false);
    });

    it('should allow system commands', async () => {
      const isAllowed = await permissionSystem.validateExecution(
        '/monitor start',
        { 
          targetPath: '/tmp/monitor',
          operation: 'execute',
          isSystemCommand: true
        }
      );
      
      expect(isAllowed).toBe(true);
    });

    it('should respect bypass enable/disable setting', async () => {
      // Disable bypass
      permissionSystem.updateConfiguration({
        permissions: {
          ...permissionSystem.getConfiguration().permissions,
          enableBypass: false
        }
      });
      
      const isAllowed = await permissionSystem.validateExecution('any command');
      expect(isAllowed).toBe(true); // Should allow everything when disabled
    });
  });

  describe('Permission Prompt Handling', () => {
    beforeEach(async () => {
      await permissionSystem.initialize();
    });

    it('should handle file write prompts', () => {
      const workspaceDir = path.join(tempDir, 'workspace');
      const filePath = path.join(workspaceDir, 'test-project', 'app.ts');
      
      permissionSystem.updateConfiguration({
        permissions: {
          ...permissionSystem.getConfiguration().permissions,
          workspaceRoot: workspaceDir
        }
      });
      
      const prompt = `Do you want to write to ${filePath}? [y/n]`;
      const response = permissionSystem.handlePermissionPrompt(prompt);
      
      expect(response).toBe('y');
    });

    it('should handle system directory prompts', () => {
      const prompt = 'Do you want to write to /usr/local/bin/test? [y/n]';
      const response = permissionSystem.handlePermissionPrompt(prompt);
      
      expect(response).toBe('n');
    });

    it('should handle safe command execution prompts', () => {
      permissionSystem.updateConfiguration({
        permissions: {
          ...permissionSystem.getConfiguration().permissions,
          autoApproveCommon: true
        }
      });
      
      const prompt = 'Execute command "npm install"? [y/n]';
      const response = permissionSystem.handlePermissionPrompt(prompt);
      
      expect(response).toBe('y');
    });

    it('should handle unknown prompts with fallback', () => {
      permissionSystem.updateConfiguration({
        permissions: {
          ...permissionSystem.getConfiguration().permissions,
          fallbackToManual: false
        }
      });
      
      const prompt = 'Some unknown operation? [y/n]';
      const response = permissionSystem.handlePermissionPrompt(prompt);
      
      expect(response).toBe('n');
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await permissionSystem.initialize();
    });

    it('should update configuration', () => {
      const originalConfig = permissionSystem.getConfiguration();
      
      permissionSystem.updateConfiguration({
        permissions: {
          ...originalConfig.permissions,
          verboseLogging: true
        }
      });
      
      const updatedConfig = permissionSystem.getConfiguration();
      expect(updatedConfig.permissions.verboseLogging).toBe(true);
    });

    it('should save configuration to file', async () => {
      permissionSystem.updateConfiguration({
        permissions: {
          ...permissionSystem.getConfiguration().permissions,
          verboseLogging: true
        }
      });
      
      await permissionSystem.saveConfiguration();
      
      const savedConfig = await fs.readJson(configPath);
      expect(savedConfig.permissions.verboseLogging).toBe(true);
    });

    it('should emit configuration update events', (done) => {
      permissionSystem.once('configurationUpdated', (config) => {
        expect(config.permissions.verboseLogging).toBe(true);
        done();
      });
      
      permissionSystem.updateConfiguration({
        permissions: {
          ...permissionSystem.getConfiguration().permissions,
          verboseLogging: true
        }
      });
    });
  });
});

describe('PermissionIntegrationService', () => {
  let integrationService: PermissionIntegrationService;
  let permissionSystem: PermissionBypassSystem;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentwise-integration-test-'));
    permissionSystem = new PermissionBypassSystem(path.join(tempDir, '.agentwise-config.json'));
    integrationService = new PermissionIntegrationService(permissionSystem);
  });

  afterEach(async () => {
    await integrationService.cleanup();
    await fs.remove(tempDir);
  });

  describe('Integration', () => {
    it('should initialize successfully', async () => {
      await integrationService.initialize();
      const status = integrationService.getIntegrationStatus();
      
      expect(status.isIntegrated).toBe(true);
      expect(status.permissionBypassEnabled).toBe(true);
    });

    it('should create project workspace', async () => {
      await integrationService.initialize();
      
      const projectPath = await integrationService.createProjectStructure('test-project', 'web-app');
      
      expect(await fs.pathExists(projectPath)).toBe(true);
      expect(await fs.pathExists(path.join(projectPath, 'src/components'))).toBe(true);
    });

    it('should validate file operations', async () => {
      await integrationService.initialize();
      
      const workspacePath = integrationService.getProjectWorkspacePath('test-project');
      const safeFilePath = path.join(workspacePath, 'test.txt');
      const unsafeFilePath = '/usr/local/bin/test';
      
      const canWriteSafe = await integrationService.validateFileOperation('write', safeFilePath);
      const canWriteUnsafe = await integrationService.validateFileOperation('write', unsafeFilePath);
      
      expect(canWriteSafe).toBe(true);
      expect(canWriteUnsafe).toBe(false);
    });

    it('should execute commands with workspace safety', async () => {
      await integrationService.initialize();
      
      let executionCount = 0;
      
      await integrationService.withWorkspaceSafety(
        '/test command',
        'test-project',
        async () => {
          executionCount++;
          
          // Verify we're in the correct directory
          const cwd = process.cwd();
          expect(cwd).toContain('test-project');
        }
      );
      
      expect(executionCount).toBe(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Create invalid configuration
      const invalidConfigPath = path.join(tempDir, '.agentwise-config.json');
      await fs.writeFile(invalidConfigPath, 'invalid json');
      
      const invalidSystem = new PermissionBypassSystem(invalidConfigPath);
      const invalidIntegration = new PermissionIntegrationService(invalidSystem);
      
      // Should not throw, but handle gracefully
      await expect(invalidIntegration.initialize()).resolves.not.toThrow();
    });

    it('should handle command validation errors', async () => {
      await integrationService.initialize();
      
      // This should not throw, but return false
      const result = await integrationService.validateFileOperation(
        'write',
        '/invalid/path/that/does/not/exist'
      );
      
      expect(result).toBe(false);
    });
  });
});

// Integration test with real file system operations
describe('Real File System Integration', () => {
  let permissionSystem: PermissionBypassSystem;
  let tempWorkspace: string;

  beforeEach(async () => {
    tempWorkspace = await fs.mkdtemp(path.join(os.tmpdir(), 'agentwise-real-test-'));
    
    const configPath = path.join(tempWorkspace, '.agentwise-config.json');
    permissionSystem = new PermissionBypassSystem(configPath);
    
    // Configure to use temp workspace
    await permissionSystem.initialize();
    permissionSystem.updateConfiguration({
      permissions: {
        ...permissionSystem.getConfiguration().permissions,
        workspaceRoot: tempWorkspace
      }
    });
  });

  afterEach(async () => {
    await permissionSystem.cleanup();
    await fs.remove(tempWorkspace);
  });

  it('should create and validate real project structure', async () => {
    const projectName = 'real-test-project';
    const projectPath = path.join(tempWorkspace, projectName);
    
    // Initialize sandbox
    await permissionSystem.initializeSandbox(projectPath);
    
    // Verify structure exists
    expect(await fs.pathExists(path.join(projectPath, 'src'))).toBe(true);
    expect(await fs.pathExists(path.join(projectPath, 'docs'))).toBe(true);
    expect(await fs.pathExists(path.join(projectPath, '.agentwise/metadata.json'))).toBe(true);
    
    // Test file operations within sandbox
    const testFile = path.join(projectPath, 'src', 'test.js');
    
    // This should be allowed
    const canWrite = await permissionSystem.validateExecution(
      'write file',
      { targetPath: testFile, operation: 'write' }
    );
    expect(canWrite).toBe(true);
    
    // Actually write the file
    await fs.writeFile(testFile, 'console.log("Hello from Agentwise!");');
    expect(await fs.pathExists(testFile)).toBe(true);
    
    const content = await fs.readFile(testFile, 'utf-8');
    expect(content).toContain('Hello from Agentwise!');
  });

  it('should prevent operations outside workspace', async () => {
    // Try to validate operation outside workspace
    const outsidePath = path.join(os.tmpdir(), 'outside-workspace.txt');
    
    const canWrite = await permissionSystem.validateExecution(
      'write file',
      { targetPath: outsidePath, operation: 'write' }
    );
    
    expect(canWrite).toBe(false);
  });
});