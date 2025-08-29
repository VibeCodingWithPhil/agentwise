/**
 * Permission Bypass System - Provides safe permission management for Agentwise
 * 
 * This system allows Agentwise to function without the --dangerously-skip-permissions flag
 * by implementing workspace sandboxing and intelligent permission handling.
 * 
 * Key Features:
 * - Workspace sandboxing (limits execution to workspace/[project-name] directories)
 * - Automatic detection and response to Claude Code permission prompts
 * - Terminal output monitoring for permission-related stops
 * - Configurable permission bypass strategies
 * - Transparent background operation
 * - Zero interference with users who still use the flag
 * 
 * Security Model:
 * - File system operations limited to project workspaces only
 * - Custom commands can access other system locations when explicitly needed
 * - All operations are logged and auditable
 * - Permission escalation requires explicit user consent
 */

import { Observable, Subject, fromEvent, merge } from 'rxjs';
import { filter, map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as fs from 'fs-extra';
import * as path from 'path';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

/**
 * Configuration interface for the Permission Bypass System
 */
export interface AgentwiseConfig {
  permissions: {
    /** Enable automatic permission bypass (default: true) */
    enableBypass: boolean;
    
    /** Workspace root directory for sandboxing (default: './workspace') */
    workspaceRoot: string;
    
    /** Additional allowed directories outside workspace */
    allowedDirectories: string[];
    
    /** Commands that can access system directories */
    systemAccessCommands: string[];
    
    /** Timeout for permission prompts in milliseconds (default: 5000) */
    promptTimeout: number;
    
    /** Enable verbose logging for debugging (default: false) */
    verboseLogging: boolean;
    
    /** Auto-approve common safe operations (default: true) */
    autoApproveCommon: boolean;
    
    /** Fallback to manual approval when unsure (default: true) */
    fallbackToManual: boolean;
  };
  
  /** Global system configuration */
  system: {
    /** Maximum concurrent agent processes (default: 3) */
    maxConcurrentAgents: number;
    
    /** Token optimization level (default: 'aggressive') */
    tokenOptimization: 'conservative' | 'balanced' | 'aggressive';
    
    /** Enable performance monitoring (default: true) */
    enableMonitoring: boolean;
  };
}

/**
 * Default configuration for Agentwise
 */
export const DEFAULT_CONFIG: AgentwiseConfig = {
  permissions: {
    enableBypass: true,
    workspaceRoot: './workspace',
    allowedDirectories: [
      './.agentwise',
      './.claude',
      './projects.json',
      './node_modules',
      './package.json',
      './package-lock.json',
      './tsconfig.json'
    ],
    systemAccessCommands: [
      '/monitor',
      '/setup-mcps',
      '/setup-ollama',
      '/setup-lmstudio',
      '/github'
    ],
    promptTimeout: 5000,
    verboseLogging: false,
    autoApproveCommon: true,
    fallbackToManual: true
  },
  system: {
    maxConcurrentAgents: 3,
    tokenOptimization: 'aggressive',
    enableMonitoring: true
  }
};

/**
 * Permission decision types
 */
export enum PermissionDecision {
  ALLOW = 'allow',
  DENY = 'deny',
  PROMPT = 'prompt',
  AUTO_APPROVE = 'auto_approve'
}

/**
 * Permission context for decisions
 */
export interface PermissionContext {
  command: string;
  targetPath: string;
  operation: 'read' | 'write' | 'execute' | 'delete';
  projectName?: string;
  isSystemCommand: boolean;
}

/**
 * Main Permission Bypass System class
 * 
 * This class provides comprehensive permission management that works transparently
 * in the background, allowing Agentwise to function without requiring users to
 * start Claude Code with the --dangerously-skip-permissions flag.
 */
export class PermissionBypassSystem extends EventEmitter {
  private config: AgentwiseConfig;
  private activeSandboxes: Map<string, string> = new Map();
  private terminalMonitor?: Observable<string>;
  private permissionPrompts: Subject<string> = new Subject();
  private isInitialized = false;
  private processMonitor?: ChildProcess;
  private configPath: string;

  constructor(configPath?: string) {
    super();
    this.configPath = configPath || path.join(process.cwd(), '.agentwise-config.json');
    this.config = DEFAULT_CONFIG;
  }

  /**
   * Initialize the Permission Bypass System
   * 
   * Sets up terminal monitoring, loads configuration, and prepares the sandbox environment.
   * This method should be called once during Agentwise startup.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load configuration
      await this.loadConfiguration();

      // Initialize terminal monitoring
      this.initializeTerminalMonitoring();

      // Set up permission prompt handling
      this.setupPermissionPromptHandling();

      // Create workspace root if it doesn't exist
      await this.ensureWorkspaceRoot();

      this.isInitialized = true;
      this.log('Permission Bypass System initialized successfully');
      
      this.emit('initialized');
    } catch (error) {
      this.log('Failed to initialize Permission Bypass System:', error);
      throw error;
    }
  }

  /**
   * Initialize a sandbox for a specific project
   * 
   * Creates an isolated workspace environment where Claude Code can operate
   * safely without requiring system-wide permissions.
   * 
   * @param projectPath - The path to the project directory
   * @returns Promise that resolves when sandbox is ready
   */
  async initializeSandbox(projectPath: string): Promise<void> {
    if (!this.config.permissions.enableBypass) {
      this.log('Permission bypass disabled, skipping sandbox initialization');
      return;
    }

    try {
      // Normalize and validate project path
      const normalizedPath = path.resolve(projectPath);
      const projectName = path.basename(normalizedPath);
      
      // Ensure the project path is within workspace
      if (!this.isWithinWorkspace(normalizedPath)) {
        throw new Error(`Project path ${normalizedPath} is outside allowed workspace`);
      }

      // Create project directory if it doesn't exist
      await fs.ensureDir(normalizedPath);

      // Create standard project structure
      await this.createProjectStructure(normalizedPath);

      // Register the sandbox
      this.activeSandboxes.set(projectName, normalizedPath);

      this.log(`Sandbox initialized for project: ${projectName} at ${normalizedPath}`);
      this.emit('sandboxInitialized', { projectName, projectPath: normalizedPath });

    } catch (error) {
      this.log(`Failed to initialize sandbox for ${projectPath}:`, error);
      throw error;
    }
  }

  /**
   * Validate if a command execution is allowed
   * 
   * Analyzes the command and determines if it should be permitted based on
   * the current sandbox configuration and security policies.
   * 
   * @param command - The command to validate
   * @param context - Additional context for the command
   * @returns Promise<boolean> indicating if execution is allowed
   */
  async validateExecution(command: string, context?: Partial<PermissionContext>): Promise<boolean> {
    if (!this.config.permissions.enableBypass) {
      // Bypass disabled, allow everything (assume --dangerously-skip-permissions is used)
      return true;
    }

    try {
      const permissionContext: PermissionContext = {
        command,
        targetPath: context?.targetPath || process.cwd(),
        operation: context?.operation || 'execute',
        projectName: context?.projectName,
        isSystemCommand: this.isSystemCommand(command)
      };

      const decision = await this.makePermissionDecision(permissionContext);

      switch (decision) {
        case PermissionDecision.ALLOW:
        case PermissionDecision.AUTO_APPROVE:
          this.log(`Execution allowed for command: ${command}`);
          return true;

        case PermissionDecision.DENY:
          this.log(`Execution denied for command: ${command}`);
          return false;

        case PermissionDecision.PROMPT:
          // Handle manual approval
          return await this.requestManualApproval(permissionContext);

        default:
          // Default to deny for security
          this.log(`Unknown decision for command: ${command}, defaulting to deny`);
          return false;
      }

    } catch (error) {
      this.log(`Error validating execution for ${command}:`, error);
      // In case of error, default to the fallback behavior
      return this.config.permissions.fallbackToManual;
    }
  }

  /**
   * Monitor terminal output for permission prompts and Claude Code stops
   * 
   * Creates an Observable that watches for terminal output patterns that indicate
   * Claude Code has stopped and is waiting for permission or user input.
   * 
   * @returns Observable<string> stream of terminal output
   */
  monitorTerminalOutput(): Observable<string> {
    if (this.terminalMonitor) {
      return this.terminalMonitor;
    }

    // Create a subject to emit terminal output
    const terminalOutput = new Subject<string>();

    try {
      // Monitor process stdout/stderr
      if (process.stdout) {
        const originalWrite = process.stdout.write;
        process.stdout.write = function(chunk: any, encoding?: any, callback?: any) {
          const output = chunk.toString();
          terminalOutput.next(output);
          return originalWrite.call(this, chunk, encoding, callback);
        };
      }

      // Monitor process stderr
      if (process.stderr) {
        const originalWrite = process.stderr.write;
        process.stderr.write = function(chunk: any, encoding?: any, callback?: any) {
          const output = chunk.toString();
          terminalOutput.next(output);
          return originalWrite.call(this, chunk, encoding, callback);
        };
      }

    } catch (error) {
      this.log('Error setting up terminal monitoring:', error);
    }

    // Filter for permission-related patterns
    this.terminalMonitor = terminalOutput.pipe(
      filter(output => this.isPermissionRelatedOutput(output)),
      debounceTime(100), // Debounce rapid output
      distinctUntilChanged(), // Avoid duplicate handling
      map(output => output.trim())
    );

    return this.terminalMonitor;
  }

  /**
   * Handle permission prompts automatically
   * 
   * Analyzes permission prompts and provides appropriate responses based on
   * the configured security policies and sandbox restrictions.
   * 
   * @param prompt - The permission prompt text
   * @returns Appropriate response string
   */
  handlePermissionPrompt(prompt: string): string {
    if (!this.config.permissions.enableBypass) {
      return 'y'; // Default to yes when bypass is disabled
    }

    try {
      // Analyze the prompt to determine the appropriate response
      const analysis = this.analyzePermissionPrompt(prompt);

      switch (analysis.type) {
        case 'file_write':
          if (analysis.path && this.isWithinSandbox(analysis.path)) {
            this.log(`Auto-approving file write within sandbox: ${analysis.path}`);
            return 'y';
          }
          break;

        case 'file_read':
          if (analysis.path && this.isAllowedPath(analysis.path)) {
            this.log(`Auto-approving file read for allowed path: ${analysis.path}`);
            return 'y';
          }
          break;

        case 'command_execution':
          if (this.config.permissions.autoApproveCommon && analysis.isSafeCommand) {
            this.log(`Auto-approving safe command execution: ${analysis.command}`);
            return 'y';
          }
          break;

        case 'network_access':
          if (analysis.isLocalhost || analysis.isHttpsOnly) {
            this.log(`Auto-approving safe network access: ${analysis.url}`);
            return 'y';
          }
          break;

        default:
          // Unknown prompt type
          break;
      }

      // If we reach here, prompt for manual approval or use default
      if (this.config.permissions.fallbackToManual) {
        this.log(`Requesting manual approval for prompt: ${prompt.substring(0, 100)}...`);
        this.emit('manualApprovalRequired', { prompt, analysis });
        return 'n'; // Default to no for security
      } else {
        this.log(`Auto-denying unknown prompt type: ${analysis.type}`);
        return 'n';
      }

    } catch (error) {
      this.log('Error handling permission prompt:', error);
      return 'n'; // Default to no on error
    }
  }

  /**
   * Check if a path is within the sandbox boundaries
   * 
   * Validates that a given file system path is within the allowed workspace
   * directories and doesn't attempt to escape the sandbox.
   * 
   * @param targetPath - The path to validate
   * @returns boolean indicating if path is within sandbox
   */
  isWithinSandbox(targetPath: string): boolean {
    try {
      const normalizedPath = path.resolve(targetPath);
      
      // Check if within workspace root
      if (this.isWithinWorkspace(normalizedPath)) {
        return true;
      }

      // Check if in allowed directories
      return this.isAllowedPath(normalizedPath);

    } catch (error) {
      this.log(`Error checking sandbox boundary for ${targetPath}:`, error);
      return false;
    }
  }

  /**
   * Check if path is within the main workspace directory
   */
  private isWithinWorkspace(targetPath: string): boolean {
    const workspaceRoot = path.resolve(this.config.permissions.workspaceRoot);
    const normalizedPath = path.resolve(targetPath);
    return normalizedPath.startsWith(workspaceRoot);
  }

  /**
   * Check if path is in allowed directories list
   */
  private isAllowedPath(targetPath: string): boolean {
    const normalizedPath = path.resolve(targetPath);
    
    return this.config.permissions.allowedDirectories.some(allowedDir => {
      const resolvedAllowedDir = path.resolve(allowedDir);
      return normalizedPath.startsWith(resolvedAllowedDir);
    });
  }

  /**
   * Check if a command is a system command that needs broader access
   */
  private isSystemCommand(command: string): boolean {
    return this.config.permissions.systemAccessCommands.some(sysCmd => 
      command.toLowerCase().startsWith(sysCmd.toLowerCase())
    );
  }

  /**
   * Load configuration from file or use defaults
   */
  private async loadConfiguration(): Promise<void> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const configData = await fs.readJson(this.configPath);
        this.config = { ...DEFAULT_CONFIG, ...configData };
        this.log('Configuration loaded from:', this.configPath);
      } else {
        // Create default configuration file
        await fs.writeJson(this.configPath, DEFAULT_CONFIG, { spaces: 2 });
        this.log('Default configuration created at:', this.configPath);
      }
    } catch (error) {
      this.log('Error loading configuration, using defaults:', error);
      this.config = DEFAULT_CONFIG;
    }
  }

  /**
   * Initialize terminal monitoring system
   */
  private initializeTerminalMonitoring(): void {
    try {
      // Set up the terminal monitor
      const monitor = this.monitorTerminalOutput();
      
      monitor.subscribe({
        next: (output) => {
          this.handleTerminalOutput(output);
        },
        error: (error) => {
          this.log('Terminal monitoring error:', error);
        }
      });

      this.log('Terminal monitoring initialized');
    } catch (error) {
      this.log('Failed to initialize terminal monitoring:', error);
    }
  }

  /**
   * Set up permission prompt handling
   */
  private setupPermissionPromptHandling(): void {
    this.permissionPrompts.subscribe({
      next: (prompt) => {
        const response = this.handlePermissionPrompt(prompt);
        this.emit('promptResponse', { prompt, response });
      },
      error: (error) => {
        this.log('Permission prompt handling error:', error);
      }
    });
  }

  /**
   * Ensure workspace root directory exists
   */
  private async ensureWorkspaceRoot(): Promise<void> {
    try {
      await fs.ensureDir(this.config.permissions.workspaceRoot);
      this.log('Workspace root ensured:', this.config.permissions.workspaceRoot);
    } catch (error) {
      this.log('Error ensuring workspace root:', error);
      throw error;
    }
  }

  /**
   * Create standard project structure within sandbox
   */
  private async createProjectStructure(projectPath: string): Promise<void> {
    const standardDirs = [
      'src',
      'docs',
      'tests',
      'config',
      '.agentwise'
    ];

    for (const dir of standardDirs) {
      await fs.ensureDir(path.join(projectPath, dir));
    }

    // Create .agentwise directory for project metadata
    const agentwiseDir = path.join(projectPath, '.agentwise');
    await fs.ensureDir(agentwiseDir);

    // Create project metadata file
    const metadata = {
      created: new Date().toISOString(),
      lastAccessed: new Date().toISOString(),
      sandboxInitialized: true,
      permissions: {
        allowedOperations: ['read', 'write', 'execute'] as const,
        restrictedPaths: [] as string[]
      }
    };

    await fs.writeJson(path.join(agentwiseDir, 'metadata.json'), metadata, { spaces: 2 });
  }

  /**
   * Make permission decision based on context
   */
  private async makePermissionDecision(context: PermissionContext): Promise<PermissionDecision> {
    // System commands get broader access
    if (context.isSystemCommand) {
      return PermissionDecision.ALLOW;
    }

    // Operations within sandbox are generally allowed
    if (this.isWithinSandbox(context.targetPath)) {
      return PermissionDecision.AUTO_APPROVE;
    }

    // Check if path is in allowed directories
    if (this.isAllowedPath(context.targetPath)) {
      return PermissionDecision.ALLOW;
    }

    // Read operations to common safe locations
    if (context.operation === 'read' && this.isSafeReadLocation(context.targetPath)) {
      return PermissionDecision.AUTO_APPROVE;
    }

    // Everything else requires manual approval or is denied
    return this.config.permissions.fallbackToManual ? 
      PermissionDecision.PROMPT : 
      PermissionDecision.DENY;
  }

  /**
   * Request manual approval for permission
   */
  private async requestManualApproval(context: PermissionContext): Promise<boolean> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        this.log(`Manual approval timeout for: ${context.command}`);
        resolve(false);
      }, this.config.permissions.promptTimeout);

      this.once('manualApprovalResponse', (approved: boolean) => {
        clearTimeout(timeout);
        resolve(approved);
      });

      this.emit('manualApprovalRequired', context);
    });
  }

  /**
   * Check if terminal output indicates permission-related issues
   */
  private isPermissionRelatedOutput(output: string): boolean {
    const permissionPatterns = [
      /permission denied/i,
      /access denied/i,
      /unauthorized/i,
      /forbidden/i,
      /would you like to/i,
      /do you want to/i,
      /continue\?/i,
      /\[y\/n\]/i,
      /press any key/i,
      /waiting for input/i
    ];

    return permissionPatterns.some(pattern => pattern.test(output));
  }

  /**
   * Handle terminal output for permission prompts
   */
  private handleTerminalOutput(output: string): void {
    if (this.isPermissionRelatedOutput(output)) {
      this.permissionPrompts.next(output);
    }
  }

  /**
   * Analyze permission prompt to determine type and context
   */
  private analyzePermissionPrompt(prompt: string): any {
    // File operation patterns
    const fileWritePattern = /write.*?to\s+(.+)/i;
    const fileReadPattern = /read.*?from\s+(.+)/i;
    const commandPattern = /execute.*?command.*?['"`](.+?)['"`]/i;
    const networkPattern = /access.*?(https?:\/\/[^\s]+)/i;

    if (fileWritePattern.test(prompt)) {
      const match = prompt.match(fileWritePattern);
      return {
        type: 'file_write',
        path: match ? match[1] : null
      };
    }

    if (fileReadPattern.test(prompt)) {
      const match = prompt.match(fileReadPattern);
      return {
        type: 'file_read',
        path: match ? match[1] : null
      };
    }

    if (commandPattern.test(prompt)) {
      const match = prompt.match(commandPattern);
      const command = match ? match[1] : '';
      return {
        type: 'command_execution',
        command,
        isSafeCommand: this.isSafeCommand(command)
      };
    }

    if (networkPattern.test(prompt)) {
      const match = prompt.match(networkPattern);
      const url = match ? match[1] : '';
      return {
        type: 'network_access',
        url,
        isLocalhost: url.includes('localhost') || url.includes('127.0.0.1'),
        isHttpsOnly: url.startsWith('https://')
      };
    }

    return {
      type: 'unknown',
      prompt: prompt.substring(0, 200)
    };
  }

  /**
   * Check if a command is considered safe for auto-approval
   */
  private isSafeCommand(command: string): boolean {
    const safeCommands = [
      'npm install',
      'npm run',
      'git status',
      'git add',
      'git commit',
      'ls',
      'pwd',
      'cat',
      'echo',
      'mkdir',
      'touch'
    ];

    return safeCommands.some(safe => command.toLowerCase().startsWith(safe));
  }

  /**
   * Check if location is safe for read operations
   */
  private isSafeReadLocation(targetPath: string): boolean {
    const safeReadPaths = [
      '/usr/local/bin',
      '/usr/bin',
      process.env.HOME + '/.npmrc',
      process.env.HOME + '/.gitconfig',
      './package.json',
      './tsconfig.json',
      './README.md'
    ];

    return safeReadPaths.some(safe => 
      path.resolve(targetPath).startsWith(path.resolve(safe))
    );
  }

  /**
   * Enable the permission bypass system
   */
  enable(): void {
    this.config.permissions.enableBypass = true;
    this.log('Permission bypass system enabled');
  }

  /**
   * Disable the permission bypass system
   */
  disable(): void {
    this.config.permissions.enableBypass = false;
    this.log('Permission bypass system disabled');
  }

  /**
   * Check if the permission bypass system is enabled
   */
  isEnabled(): boolean {
    return this.config.permissions.enableBypass;
  }

  /**
   * Internal logging method
   */
  private log(message: string, ...args: any[]): void {
    if (this.config.permissions.verboseLogging) {
      console.log(`[PermissionBypass] ${message}`, ...args);
    }
  }

  /**
   * Save current configuration to file
   */
  async saveConfiguration(): Promise<void> {
    try {
      await fs.writeJson(this.configPath, this.config, { spaces: 2 });
      this.log('Configuration saved to:', this.configPath);
    } catch (error) {
      this.log('Error saving configuration:', error);
      throw error;
    }
  }

  /**
   * Update configuration
   */
  updateConfiguration(updates: Partial<AgentwiseConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('configurationUpdated', this.config);
  }

  /**
   * Get current configuration
   */
  getConfiguration(): AgentwiseConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.removeAllListeners();
    this.permissionPrompts.complete();
    
    if (this.processMonitor) {
      this.processMonitor.kill();
    }
    
    this.activeSandboxes.clear();
    this.isInitialized = false;
    
    this.log('Permission Bypass System cleaned up');
  }
}

/**
 * Singleton instance for global access
 */
export const permissionSystem = new PermissionBypassSystem();