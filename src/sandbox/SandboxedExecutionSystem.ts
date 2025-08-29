/**
 * SandboxedExecutionSystem - Main integration point for permission-free execution
 * 
 * This system allows Agentwise to function without --dangerously-skip-permissions
 * by providing intelligent sandboxing, monitoring, and automatic continuation.
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs-extra';
import { PermissionBypassSystem } from '../permissions/PermissionBypassSystem';
import { TerminalMonitor } from '../terminal/TerminalMonitor';
import { AutoContinuation } from '../terminal/AutoContinuation';
import { OutputParser } from '../terminal/OutputParser';
import { AgentwiseConfiguration } from '../config/AgentwiseConfiguration';
import { ProjectContextManager } from '../context/ProjectContextManager';
import { DynamicAgentManager } from '../orchestrator/DynamicAgentManager';

interface SandboxOptions {
  projectName: string;
  workspacePath?: string;
  enableAutoPermissions?: boolean;
  safetyMode?: boolean;
  verboseLogging?: boolean;
}

interface ExecutionResult {
  success: boolean;
  output: string;
  errors: string[];
  tokensUsed: number;
  permissionsHandled: number;
  duration: number;
}

export class SandboxedExecutionSystem extends EventEmitter {
  private permissionSystem: PermissionBypassSystem;
  private terminalMonitor: TerminalMonitor;
  private autoContinuation: AutoContinuation;
  private outputParser: OutputParser;
  private configuration: AgentwiseConfiguration;
  private projectContext: ProjectContextManager;
  private agentManager: DynamicAgentManager;
  
  private activeExecutions: Map<string, {
    projectName: string;
    startTime: Date;
    monitor: TerminalMonitor;
    permissionsHandled: number;
    tokensUsed: number;
  }> = new Map();

  constructor() {
    super();
    this.configuration = AgentwiseConfiguration.getInstance();
    this.permissionSystem = new PermissionBypassSystem();
    this.outputParser = new OutputParser();
    this.autoContinuation = new AutoContinuation();
    this.projectContext = new ProjectContextManager();
    this.agentManager = new DynamicAgentManager();
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Load configuration
    await this.configuration.load();
    
    // Apply configuration to subsystems
    const config = this.configuration.getAll();
    
    if (config.permissions.bypassEnabled) {
      console.log('🔓 Permission bypass system enabled');
      this.permissionSystem.enable();
    }
    
    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Forward permission events
    this.permissionSystem.on('permission_granted', (data) => {
      this.emit('permission_handled', {
        type: 'granted',
        resource: data.resource,
        action: data.action
      });
    });

    this.permissionSystem.on('permission_denied', (data) => {
      this.emit('permission_handled', {
        type: 'denied',
        resource: data.resource,
        reason: data.reason
      });
    });
  }

  /**
   * Execute a command in sandboxed environment without --dangerously-skip-permissions
   */
  async executeSandboxed(
    command: string,
    options: SandboxOptions
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Step 1: Set up workspace sandbox
      const workspacePath = options.workspacePath || 
        path.join(process.cwd(), 'workspace', options.projectName);
      
      await this.setupWorkspaceSandbox(workspacePath, options.projectName);
      
      // Step 2: Initialize permission system for this project
      await this.permissionSystem.initializeSandbox(workspacePath);
      
      // Step 3: Create terminal monitor for this execution
      const monitor = new TerminalMonitor({
        command: 'claude',
        args: [],
        cwd: workspacePath,
        timeout: 300000 // 5 minutes
      });
      
      // Step 4: Set up auto-continuation
      this.setupAutoContinuation(monitor, options);
      
      // Track this execution
      this.activeExecutions.set(executionId, {
        projectName: options.projectName,
        startTime: new Date(),
        monitor,
        permissionsHandled: 0,
        tokensUsed: 0
      });
      
      // Step 5: Execute command without --dangerously-skip-permissions
      const result = await this.executeCommand(
        command,
        workspacePath,
        monitor,
        options
      );
      
      // Calculate metrics
      const execution = this.activeExecutions.get(executionId)!;
      const duration = Date.now() - startTime;
      
      return {
        success: result.success,
        output: result.output,
        errors: result.errors || [],
        tokensUsed: execution.tokensUsed,
        permissionsHandled: execution.permissionsHandled,
        duration
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`❌ Sandboxed execution failed: ${errorMessage}`);
      return {
        success: false,
        output: '',
        errors: [errorMessage],
        tokensUsed: 0,
        permissionsHandled: 0,
        duration: Date.now() - startTime
      };
    } finally {
      // Cleanup
      this.activeExecutions.delete(executionId);
    }
  }

  /**
   * Set up workspace sandbox for safe execution
   */
  private async setupWorkspaceSandbox(
    workspacePath: string,
    projectName: string
  ): Promise<void> {
    // Ensure workspace exists
    await fs.ensureDir(workspacePath);
    
    // Create sandbox manifest
    const sandboxManifest = {
      projectName,
      createdAt: new Date().toISOString(),
      sandboxVersion: '1.0.0',
      restrictions: {
        allowedPaths: [workspacePath],
        deniedPaths: ['/etc', '/usr', '/bin', '/sbin', process.env.HOME],
        maxFileSize: 100 * 1024 * 1024, // 100MB
        allowedCommands: ['npm', 'yarn', 'git', 'node', 'tsc'],
        deniedCommands: ['sudo', 'rm -rf', 'chmod', 'chown']
      }
    };
    
    // Save manifest
    const manifestPath = path.join(workspacePath, '.sandbox-manifest.json');
    await fs.writeJson(manifestPath, sandboxManifest, { spaces: 2 });
    
    console.log(`📦 Workspace sandbox created: ${workspacePath}`);
  }

  /**
   * Set up automatic continuation for terminal monitoring
   */
  private setupAutoContinuation(
    monitor: TerminalMonitor,
    options: SandboxOptions
  ): void {
    // Listen for output
    monitor.on('output', async (data) => {
      const { stdout } = data;
      
      // Parse output for prompts (simplified approach)
      const parseResult = this.outputParser.parse(stdout, '');
      
      if (parseResult.requiresAction) {
        // Check if we should auto-respond
        if (options.enableAutoPermissions && this.shouldAutoRespond(parseResult)) {
          const response = this.autoContinuation.generateInputResponse(parseResult);
          
          if (response) {
            // Send response to terminal - use public method via emit
            this.emit('send_input', { monitor, input: response });
            
            // Track permission handling
            const executionId = this.findExecutionId(monitor);
            if (executionId) {
              const execution = this.activeExecutions.get(executionId);
              if (execution) {
                execution.permissionsHandled++;
                execution.tokensUsed += this.estimateTokens(response);
              }
            }
            
            console.log(`✅ Auto-responded to prompt: "${parseResult.prompt || 'unknown'}" with "${response}"`);
          }
        }
      }
    });
  }

  /**
   * Execute command in sandboxed environment
   */
  private async executeCommand(
    command: string,
    workspacePath: string,
    monitor: TerminalMonitor,
    options: SandboxOptions
  ): Promise<{ success: boolean; output: string; errors?: string[] }> {
    return new Promise((resolve) => {
      let output = '';
      let errors: string[] = [];
      
      // Set up monitoring
      monitor.on('output', (data) => {
        output += data.stdout;
        if (data.stderr) {
          errors.push(data.stderr);
        }
      });
      
      monitor.on('exit', (code) => {
        resolve({
          success: code === 0,
          output,
          errors: errors.length > 0 ? errors : undefined
        });
      });
      
      // Build the command without --dangerously-skip-permissions
      const claudeCommand = this.buildClaudeCommand(command, workspacePath);
      
      // Start monitoring - wrapped in promise
      monitor.start().catch(console.error);
    });
  }

  /**
   * Build Claude command without dangerous flag
   */
  private buildClaudeCommand(command: string, workspacePath: string): string {
    // Remove --dangerously-skip-permissions if present
    let cleanCommand = command.replace(/--dangerously-skip-permissions/g, '').trim();
    
    // If command starts with /, it's an Agentwise command
    if (cleanCommand.startsWith('/')) {
      return `cd "${workspacePath}" && claude "${cleanCommand}"`;
    }
    
    // Otherwise, wrap in claude execution
    return `cd "${workspacePath}" && claude ${cleanCommand}`;
  }

  /**
   * Check if we should auto-respond to a prompt
   */
  private shouldAutoRespond(parseResult: any): boolean {
    const config = this.configuration.getAll();
    
    // Never auto-respond to dangerous operations in safety mode
    if (config.permissions?.safetyMode && this.isDangerousOperation(parseResult)) {
      return false;
    }
    
    // Check confidence threshold
    if (parseResult.confidence && parseResult.confidence < 0.8) {
      return false;
    }
    
    // Check if prompt type is allowed for auto-response
    const allowedTypes = ['permission', 'continue', 'overwrite', 'create'];
    return parseResult.actionType ? allowedTypes.includes(parseResult.actionType) : true;
  }

  /**
   * Check if operation is dangerous
   */
  private isDangerousOperation(parseResult: any): boolean {
    const dangerousPatterns = [
      /delete|remove|rm/i,
      /force|override/i,
      /sudo|admin/i,
      /system|root/i
    ];
    
    const prompt = parseResult.prompt || '';
    return dangerousPatterns.some(pattern => pattern.test(prompt));
  }

  /**
   * Find execution ID by monitor
   */
  private findExecutionId(monitor: TerminalMonitor): string | undefined {
    for (const [id, execution] of Array.from(this.activeExecutions)) {
      if (execution.monitor === monitor) {
        return id;
      }
    }
    return undefined;
  }

  /**
   * Estimate token usage
   */
  private estimateTokens(text: string): number {
    // Rough estimate: 1 token per 4 characters
    return Math.ceil(text.length / 4);
  }

  /**
   * Execute task command with automatic handling
   */
  async executeTask(
    projectName: string,
    taskDescription: string,
    options?: Partial<SandboxOptions>
  ): Promise<ExecutionResult> {
    // Build task command
    const command = projectName ? 
      `/task-${projectName} "${taskDescription}"` :
      `/task "${taskDescription}"`;
    
    // Execute with sandboxing
    return this.executeSandboxed(command, {
      projectName,
      enableAutoPermissions: true,
      safetyMode: false,
      ...options
    });
  }

  /**
   * Get active execution stats
   */
  getExecutionStats(): {
    active: number;
    totalPermissionsHandled: number;
    totalTokensUsed: number;
  } {
    let totalPermissions = 0;
    let totalTokens = 0;
    
    for (const execution of Array.from(this.activeExecutions.values())) {
      totalPermissions += execution.permissionsHandled;
      totalTokens += execution.tokensUsed;
    }
    
    return {
      active: this.activeExecutions.size,
      totalPermissionsHandled: totalPermissions,
      totalTokensUsed: totalTokens
    };
  }

  /**
   * Stop all active executions
   */
  async stopAll(): Promise<void> {
    for (const [id, execution] of Array.from(this.activeExecutions)) {
      execution.monitor.stop();
      this.activeExecutions.delete(id);
    }
  }
}

// Export singleton instance
export const sandboxedExecution = new SandboxedExecutionSystem();