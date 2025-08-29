import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import { OutputParser, TerminalState, ParsedOutput } from './OutputParser';
import { AutoContinuation } from './AutoContinuation';

export interface TerminalConfig {
  command: string;
  args: string[];
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  maxRetries?: number;
}

export interface MonitorEvent {
  type: 'output' | 'state_change' | 'continuation' | 'error' | 'exit';
  timestamp: Date;
  data: any;
}

export class TerminalMonitor extends EventEmitter {
  private process: ChildProcess | null = null;
  private outputParser: OutputParser;
  private autoContinuation: AutoContinuation;
  private config: TerminalConfig;
  private isRunning = false;
  private currentState = TerminalState.IDLE;
  private retryCount = 0;
  private outputBuffer: string[] = [];
  private lastActivity = Date.now();
  private activityTimer: NodeJS.Timeout | null = null;

  constructor(config: TerminalConfig) {
    super();
    this.config = {
      timeout: 30000, // 30 seconds default timeout
      maxRetries: 3,
      ...config
    };
    
    this.outputParser = new OutputParser();
    this.autoContinuation = new AutoContinuation();
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.outputParser.on('state_change', (oldState: TerminalState, newState: TerminalState) => {
      this.currentState = newState;
      this.emit('state_change', { oldState, newState, timestamp: new Date() });
    });

    this.outputParser.on('permission_required', (parsedOutput: ParsedOutput) => {
      this.handlePermissionRequest(parsedOutput);
    });

    this.outputParser.on('input_required', (parsedOutput: ParsedOutput) => {
      this.handleInputRequest(parsedOutput);
    });

    this.autoContinuation.on('response_sent', (response: string) => {
      this.emit('continuation', { response, timestamp: new Date() });
    });

    // Monitor for inactivity
    this.startActivityMonitor();
  }

  public async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Terminal monitor is already running');
    }

    try {
      this.process = spawn(this.config.command, this.config.args, {
        cwd: this.config.cwd || process.cwd(),
        env: { ...process.env, ...this.config.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      this.isRunning = true;
      this.retryCount = 0;
      this.setupProcessHandlers();
      
      this.emit('output', {
        type: 'info',
        message: `Started monitoring: ${this.config.command} ${this.config.args.join(' ')}`,
        timestamp: new Date()
      });

    } catch (error) {
      this.emit('error', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      });
      throw error;
    }
  }

  private setupProcessHandlers(): void {
    if (!this.process) return;

    this.process.stdout?.on('data', (data: Buffer) => {
      this.handleOutput('stdout', data.toString());
    });

    this.process.stderr?.on('data', (data: Buffer) => {
      this.handleOutput('stderr', data.toString());
    });

    this.process.on('exit', (code: number | null, signal: string | null) => {
      this.handleExit(code, signal);
    });

    this.process.on('error', (error: Error) => {
      this.emit('error', {
        error: error.message,
        timestamp: new Date(),
        context: 'process_error'
      });
    });
  }

  private handleOutput(stream: 'stdout' | 'stderr', data: string): void {
    this.lastActivity = Date.now();
    this.outputBuffer.push(data);
    
    // Keep buffer manageable
    if (this.outputBuffer.length > 1000) {
      this.outputBuffer = this.outputBuffer.slice(-500);
    }

    // Parse output for patterns
    const parsedOutput = this.outputParser.parse(data, this.getRecentContext());
    
    this.emit('output', {
      stream,
      data,
      parsed: parsedOutput,
      timestamp: new Date()
    });

    // Handle special cases
    if (parsedOutput.requiresAction) {
      this.handleActionRequired(parsedOutput);
    }
  }

  private handlePermissionRequest(parsedOutput: ParsedOutput): void {
    const response = this.autoContinuation.generatePermissionResponse(parsedOutput);
    if (response) {
      this.sendInput(response);
      this.emit('continuation', {
        type: 'permission',
        prompt: parsedOutput.prompt,
        response,
        timestamp: new Date()
      });
    }
  }

  private handleInputRequest(parsedOutput: ParsedOutput): void {
    const response = this.autoContinuation.generateInputResponse(parsedOutput);
    if (response) {
      this.sendInput(response);
      this.emit('continuation', {
        type: 'input',
        prompt: parsedOutput.prompt,
        response,
        timestamp: new Date()
      });
    }
  }

  private handleActionRequired(parsedOutput: ParsedOutput): void {
    switch (parsedOutput.actionType) {
      case 'continue':
        this.sendInput('y\n');
        break;
      case 'overwrite':
        this.sendInput('y\n');
        break;
      case 'skip':
        this.sendInput('s\n');
        break;
      case 'abort':
        this.sendInput('n\n');
        break;
      case 'custom':
        const customResponse = this.autoContinuation.generateCustomResponse(parsedOutput);
        if (customResponse) {
          this.sendInput(customResponse);
        }
        break;
    }
  }

  private sendInput(input: string): void {
    if (this.process && this.process.stdin) {
      this.process.stdin.write(input);
      this.emit('output', {
        type: 'input',
        data: input,
        timestamp: new Date()
      });
    }
  }

  private handleExit(code: number | null, signal: string | null): void {
    this.isRunning = false;
    this.stopActivityMonitor();
    
    this.emit('exit', {
      code,
      signal,
      timestamp: new Date(),
      success: code === 0
    });

    // Auto-restart on unexpected exit
    if (code !== 0 && this.retryCount < (this.config.maxRetries || 3)) {
      this.retryCount++;
      setTimeout(() => {
        this.emit('output', {
          type: 'info',
          message: `Restarting after exit (attempt ${this.retryCount})`,
          timestamp: new Date()
        });
        this.start().catch(console.error);
      }, 2000);
    }
  }

  private getRecentContext(): string {
    return this.outputBuffer.slice(-10).join('').slice(-1000);
  }

  private startActivityMonitor(): void {
    this.activityTimer = setInterval(() => {
      const timeSinceActivity = Date.now() - this.lastActivity;
      
      if (timeSinceActivity > (this.config.timeout || 30000)) {
        this.emit('output', {
          type: 'warning',
          message: 'No activity detected, checking if process needs input',
          timestamp: new Date()
        });
        
        // Send a gentle probe
        this.sendInput('\n');
      }
    }, 10000); // Check every 10 seconds
  }

  private stopActivityMonitor(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
  }

  public stop(): void {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
    this.isRunning = false;
    this.stopActivityMonitor();
  }

  public getCurrentState(): TerminalState {
    return this.currentState;
  }

  public getRecentOutput(lines = 20): string[] {
    return this.outputBuffer.slice(-lines);
  }

  public isActive(): boolean {
    return this.isRunning && this.process !== null;
  }

  public getStats(): {
    isRunning: boolean;
    currentState: TerminalState;
    retryCount: number;
    bufferSize: number;
    lastActivity: Date;
  } {
    return {
      isRunning: this.isRunning,
      currentState: this.currentState,
      retryCount: this.retryCount,
      bufferSize: this.outputBuffer.length,
      lastActivity: new Date(this.lastActivity)
    };
  }
}