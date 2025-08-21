/**
 * Usage Analytics for Agentwise
 * Tracks anonymous usage to improve the software
 * No personal data is collected
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import * as os from 'os';

interface UsageData {
  version: string;
  command: string;
  timestamp: number;
  success: boolean;
  duration?: number;
  error?: string;
}

interface SystemInfo {
  platform: string;
  nodeVersion: string;
  agentCount?: number;
  projectType?: string;
}

export class UsageAnalytics {
  private readonly analyticsFile: string;
  private readonly sessionId: string;
  private readonly isEnabled: boolean;
  private readonly version: string = '1.0.0';

  constructor() {
    // Check if analytics are enabled (opt-in)
    this.isEnabled = process.env.AGENTWISE_ANALYTICS !== 'false';
    
    // Generate anonymous session ID
    this.sessionId = this.generateSessionId();
    
    // Store analytics locally
    const dataDir = path.join(os.homedir(), '.agentwise', 'analytics');
    fs.ensureDirSync(dataDir);
    this.analyticsFile = path.join(dataDir, 'usage.json');
    
    if (this.isEnabled) {
      this.initializeAnalytics();
    }
  }

  /**
   * Generate anonymous session ID
   */
  private generateSessionId(): string {
    const data = `${os.platform()}-${os.arch()}-${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
  }

  /**
   * Initialize analytics file
   */
  private initializeAnalytics(): void {
    if (!fs.existsSync(this.analyticsFile)) {
      fs.writeJsonSync(this.analyticsFile, {
        firstUse: Date.now(),
        sessions: [],
        systemInfo: this.getSystemInfo()
      });
    }
  }

  /**
   * Get anonymous system information
   */
  private getSystemInfo(): SystemInfo {
    return {
      platform: os.platform(),
      nodeVersion: process.version,
      agentCount: undefined, // Will be set when agents are loaded
      projectType: undefined  // Will be set when project is created
    };
  }

  /**
   * Track command usage
   */
  async trackCommand(
    command: string,
    success: boolean = true,
    duration?: number,
    error?: string
  ): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const usage: UsageData = {
        version: this.version,
        command: command.split(' ')[0], // Only track command name, not arguments
        timestamp: Date.now(),
        success,
        duration,
        error: error ? this.sanitizeError(error) : undefined
      };

      // Read existing data
      const data = await fs.readJson(this.analyticsFile);
      
      // Find or create current session
      let session = data.sessions.find((s: any) => s.id === this.sessionId);
      if (!session) {
        session = {
          id: this.sessionId,
          startTime: Date.now(),
          usage: []
        };
        data.sessions.push(session);
      }
      
      // Add usage data
      session.usage.push(usage);
      
      // Keep only last 100 sessions
      if (data.sessions.length > 100) {
        data.sessions = data.sessions.slice(-100);
      }
      
      // Save updated data
      await fs.writeJson(this.analyticsFile, data, { spaces: 2 });
    } catch (error) {
      // Silently fail - analytics should never break the application
      console.debug('Analytics error:', error);
    }
  }

  /**
   * Sanitize error messages to remove sensitive data
   */
  private sanitizeError(error: string): string {
    // Remove file paths, URLs, and other potentially sensitive data
    return error
      .replace(/\/[^\s]+/g, '[path]')
      .replace(/https?:\/\/[^\s]+/g, '[url]')
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email]')
      .substring(0, 200); // Limit error message length
  }

  /**
   * Track project creation
   */
  async trackProjectCreation(projectType: string, agentCount: number): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const data = await fs.readJson(this.analyticsFile);
      data.systemInfo.projectType = projectType;
      data.systemInfo.agentCount = agentCount;
      await fs.writeJson(this.analyticsFile, data, { spaces: 2 });
    } catch (error) {
      console.debug('Analytics error:', error);
    }
  }

  /**
   * Get anonymous usage statistics
   */
  async getUsageStatistics(): Promise<any> {
    if (!this.isEnabled || !fs.existsSync(this.analyticsFile)) {
      return null;
    }

    try {
      const data = await fs.readJson(this.analyticsFile);
      
      // Calculate statistics
      const totalCommands = data.sessions.reduce((acc: number, session: any) => 
        acc + session.usage.length, 0
      );
      
      const commandCounts: Record<string, number> = {};
      const successRate: Record<string, { success: number; total: number }> = {};
      
      data.sessions.forEach((session: any) => {
        session.usage.forEach((usage: UsageData) => {
          commandCounts[usage.command] = (commandCounts[usage.command] || 0) + 1;
          if (!successRate[usage.command]) {
            successRate[usage.command] = { success: 0, total: 0 };
          }
          successRate[usage.command].total++;
          if (usage.success) {
            successRate[usage.command].success++;
          }
        });
      });
      
      return {
        totalCommands,
        commandCounts,
        successRate: Object.keys(successRate).reduce((acc, cmd) => {
          acc[cmd] = (successRate[cmd].success / successRate[cmd].total) * 100;
          return acc;
        }, {} as Record<string, number>),
        systemInfo: data.systemInfo,
        firstUse: data.firstUse
      };
    } catch (error) {
      console.debug('Analytics error:', error);
      return null;
    }
  }

  /**
   * Check if user is using the software (for fork detection)
   */
  async detectForkUsage(): Promise<boolean> {
    try {
      // Check if .git exists and remote is not the original
      const gitConfig = path.join(process.cwd(), '.git', 'config');
      if (fs.existsSync(gitConfig)) {
        const config = fs.readFileSync(gitConfig, 'utf-8');
        const isOriginal = config.includes('VibeCodingWithPhil/agentwise');
        
        if (!isOriginal && this.isEnabled) {
          // Track fork usage (anonymously)
          await this.trackCommand('fork-detected', true);
        }
        
        return !isOriginal;
      }
    } catch (error) {
      console.debug('Fork detection error:', error);
    }
    
    return false;
  }

  /**
   * Display analytics opt-out message
   */
  static displayPrivacyNotice(): void {
    console.log('\n📊 Anonymous Usage Analytics');
    console.log('Agentwise collects anonymous usage data to improve the software.');
    console.log('No personal information is collected.');
    console.log('To opt out, set: export AGENTWISE_ANALYTICS=false\n');
  }
}