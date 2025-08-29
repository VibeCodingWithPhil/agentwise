import { EventEmitter } from 'events';
import { TerminalMonitor, TerminalConfig } from './TerminalMonitor';
import { OutputParser, TerminalState } from './OutputParser';
import { AutoContinuation, ContinuationConfig } from './AutoContinuation';

export interface TerminalSession {
  id: string;
  monitor: TerminalMonitor;
  startTime: Date;
  config: TerminalConfig;
  status: 'active' | 'paused' | 'stopped' | 'error';
}

export interface IntegrationConfig extends Partial<ContinuationConfig> {
  maxConcurrentSessions?: number;
  sessionTimeout?: number;
  enableLogging?: boolean;
  logPath?: string;
}

export class TerminalIntegration extends EventEmitter {
  private sessions = new Map<string, TerminalSession>();
  private config: IntegrationConfig;
  private sessionCounter = 0;

  constructor(config: IntegrationConfig = {}) {
    super();
    
    this.config = {
      maxConcurrentSessions: 5,
      sessionTimeout: 300000, // 5 minutes
      enableLogging: true,
      enableAutoPermissions: true,
      enableAutoInput: true,
      safetyMode: true,
      defaultPermissionResponse: 'yes',
      maxAutoResponses: 50,
      responseDelay: 100,
      ...config
    };
  }

  public async startClaudeCodeSession(
    args: string[] = [],
    options: Partial<TerminalConfig> = {}
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    
    const terminalConfig: TerminalConfig = {
      command: 'claude',
      args: ['code', ...args],
      cwd: process.cwd(),
      ...options
    };

    return this.startSession(sessionId, terminalConfig);
  }

  public async startCustomSession(
    command: string,
    args: string[] = [],
    options: Partial<TerminalConfig> = {}
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    
    const terminalConfig: TerminalConfig = {
      command,
      args,
      cwd: process.cwd(),
      ...options
    };

    return this.startSession(sessionId, terminalConfig);
  }

  private async startSession(sessionId: string, terminalConfig: TerminalConfig): Promise<string> {
    if (this.sessions.size >= (this.config.maxConcurrentSessions || 5)) {
      throw new Error('Maximum concurrent sessions reached');
    }

    const monitor = new TerminalMonitor(terminalConfig);
    
    const session: TerminalSession = {
      id: sessionId,
      monitor,
      startTime: new Date(),
      config: terminalConfig,
      status: 'active'
    };

    // Set up event forwarding
    this.setupSessionEventHandlers(session);
    
    this.sessions.set(sessionId, session);

    try {
      await monitor.start();
      
      this.emit('session_started', {
        sessionId,
        config: terminalConfig,
        timestamp: new Date()
      });

      // Set up session timeout
      setTimeout(() => {
        if (this.sessions.has(sessionId)) {
          this.stopSession(sessionId, 'timeout');
        }
      }, this.config.sessionTimeout);

      return sessionId;
      
    } catch (error) {
      this.sessions.delete(sessionId);
      throw error;
    }
  }

  private setupSessionEventHandlers(session: TerminalSession): void {
    const { id: sessionId, monitor } = session;

    monitor.on('output', (event) => {
      this.emit('session_output', {
        sessionId,
        ...event
      });

      if (this.config.enableLogging) {
        this.logEvent(sessionId, 'output', event);
      }
    });

    monitor.on('state_change', (event) => {
      this.emit('session_state_change', {
        sessionId,
        ...event
      });

      if (this.config.enableLogging) {
        this.logEvent(sessionId, 'state_change', event);
      }
    });

    monitor.on('continuation', (event) => {
      this.emit('session_continuation', {
        sessionId,
        ...event
      });

      if (this.config.enableLogging) {
        this.logEvent(sessionId, 'continuation', event);
      }
    });

    monitor.on('error', (event) => {
      session.status = 'error';
      this.emit('session_error', {
        sessionId,
        ...event
      });

      if (this.config.enableLogging) {
        this.logEvent(sessionId, 'error', event);
      }
    });

    monitor.on('exit', (event) => {
      session.status = 'stopped';
      this.emit('session_exit', {
        sessionId,
        ...event
      });

      if (this.config.enableLogging) {
        this.logEvent(sessionId, 'exit', event);
      }

      // Clean up session
      setTimeout(() => {
        this.sessions.delete(sessionId);
      }, 5000); // Keep for 5 seconds for final events
    });
  }

  public stopSession(sessionId: string, reason = 'manual'): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'stopped';
    session.monitor.stop();

    this.emit('session_stopped', {
      sessionId,
      reason,
      timestamp: new Date()
    });

    if (this.config.enableLogging) {
      this.logEvent(sessionId, 'stopped', { reason });
    }
  }

  public pauseSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'paused';
    
    this.emit('session_paused', {
      sessionId,
      timestamp: new Date()
    });
  }

  public resumeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.status = 'active';
    
    this.emit('session_resumed', {
      sessionId,
      timestamp: new Date()
    });
  }

  public sendInputToSession(sessionId: string, input: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status !== 'active') {
      throw new Error(`Session ${sessionId} is not active`);
    }

    // Send input directly to the terminal
    if (session.monitor.isActive()) {
      (session.monitor as any).sendInput(input);
    }
  }

  public getSession(sessionId: string): TerminalSession | undefined {
    return this.sessions.get(sessionId);
  }

  public getAllSessions(): TerminalSession[] {
    return Array.from(this.sessions.values());
  }

  public getActiveSessionIds(): string[] {
    return Array.from(this.sessions.entries())
      .filter(([_, session]) => session.status === 'active')
      .map(([id, _]) => id);
  }

  public getSessionStats(sessionId: string): any {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      id: sessionId,
      startTime: session.startTime,
      status: session.status,
      config: session.config,
      runtime: Date.now() - session.startTime.getTime(),
      monitorStats: session.monitor.getStats()
    };
  }

  public getAllStats(): {
    totalSessions: number;
    activeSessions: number;
    pausedSessions: number;
    stoppedSessions: number;
    errorSessions: number;
    config: IntegrationConfig;
  } {
    const sessions = Array.from(this.sessions.values());
    
    return {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      pausedSessions: sessions.filter(s => s.status === 'paused').length,
      stoppedSessions: sessions.filter(s => s.status === 'stopped').length,
      errorSessions: sessions.filter(s => s.status === 'error').length,
      config: { ...this.config }
    };
  }

  private generateSessionId(): string {
    return `terminal_${++this.sessionCounter}_${Date.now()}`;
  }

  private logEvent(sessionId: string, eventType: string, eventData: any): void {
    if (!this.config.enableLogging) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId,
      eventType,
      data: eventData
    };

    // In a real implementation, this would write to a log file or database
    console.log(`[TerminalIntegration] ${JSON.stringify(logEntry)}`);
  }

  public updateConfig(updates: Partial<IntegrationConfig>): void {
    this.config = { ...this.config, ...updates };
    
    // Update all active sessions if needed
    for (const session of this.sessions.values()) {
      // Update the monitor's auto-continuation config
      if (updates.enableAutoPermissions !== undefined || 
          updates.enableAutoInput !== undefined ||
          updates.safetyMode !== undefined) {
        // This would require extending the monitor to accept config updates
        // For now, we'll just emit an event
        this.emit('config_updated', {
          sessionId: session.id,
          updates,
          timestamp: new Date()
        });
      }
    }
  }

  public stopAllSessions(): void {
    for (const sessionId of this.sessions.keys()) {
      try {
        this.stopSession(sessionId, 'shutdown');
      } catch (error) {
        console.error(`Error stopping session ${sessionId}:`, error);
      }
    }
  }

  public destroy(): void {
    this.stopAllSessions();
    this.removeAllListeners();
  }

  // Convenience methods for common operations
  public async runClaudeCodeCommand(
    command: string,
    timeout = 120000
  ): Promise<{
    sessionId: string;
    output: string[];
    success: boolean;
    exitCode?: number;
  }> {
    const sessionId = await this.startClaudeCodeSession(command.split(' '));
    
    return new Promise((resolve, reject) => {
      const output: string[] = [];
      let resolved = false;

      const cleanup = () => {
        if (!resolved) {
          resolved = true;
          this.stopSession(sessionId);
        }
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Command timeout'));
      }, timeout);

      this.on('session_output', (event) => {
        if (event.sessionId === sessionId) {
          output.push(event.data);
        }
      });

      this.on('session_exit', (event) => {
        if (event.sessionId === sessionId && !resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          resolve({
            sessionId,
            output,
            success: event.success,
            exitCode: event.code
          });
        }
      });

      this.on('session_error', (event) => {
        if (event.sessionId === sessionId && !resolved) {
          resolved = true;
          clearTimeout(timeoutId);
          cleanup();
          reject(new Error(event.error));
        }
      });
    });
  }
}