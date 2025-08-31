import * as fs from 'fs-extra';
import * as path from 'path';
import * as chokidar from 'chokidar';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import { 
  AutoCommitConfig, 
  FileChangeEvent, 
  CommitInfo, 
  CommitRule,
  ProtectionError,
  Logger,
  PerformanceMonitor
} from './types';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export class AutoCommitManager {
  private config: AutoCommitConfig;
  private watcher: chokidar.FSWatcher | null = null;
  private pendingChanges: Map<string, FileChangeEvent> = new Map();
  private intervalTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private lastCommitTime: Date = new Date();
  private commitQueue: string[] = [];
  private isCommitting = false;

  constructor(
    config: AutoCommitConfig,
    logger: Logger,
    performanceMonitor: PerformanceMonitor
  ) {
    this.config = config;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('AutoCommitManager is already running');
      return;
    }

    const perfId = this.performanceMonitor.start('auto-commit-start');
    
    try {
      this.logger.info('Starting AutoCommitManager', { config: this.config });
      
      // Validate git repository
      await this.validateGitRepository();
      
      // Start file watching if enabled
      if (this.config.enabled) {
        await this.startFileWatching();
        
        // Start interval commits if configured
        if (this.config.intervalMinutes > 0) {
          this.startIntervalCommits();
        }
      }
      
      this.isRunning = true;
      this.logger.info('AutoCommitManager started successfully');
      
    } catch (error) {
      this.logger.error('Failed to start AutoCommitManager', { error });
      throw new ProtectionError(
        'Failed to start auto-commit manager',
        'AUTO_COMMIT_START_FAILED',
        'autocommit',
        { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) }
      );
    } finally {
      this.performanceMonitor.end(perfId);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('AutoCommitManager is not running');
      return;
    }

    const perfId = this.performanceMonitor.start('auto-commit-stop');
    
    try {
      this.logger.info('Stopping AutoCommitManager');
      
      // Stop file watcher
      if (this.watcher) {
        await this.watcher.close();
        this.watcher = null;
      }
      
      // Stop interval timer
      if (this.intervalTimer) {
        clearInterval(this.intervalTimer);
        this.intervalTimer = null;
      }
      
      // Commit any pending changes
      if (this.pendingChanges.size > 0) {
        await this.commitPendingChanges('AutoCommitManager stopping - committing pending changes');
      }
      
      this.isRunning = false;
      this.logger.info('AutoCommitManager stopped successfully');
      
    } catch (error) {
      this.logger.error('Error stopping AutoCommitManager', { error });
      throw new ProtectionError(
        'Failed to stop auto-commit manager',
        'AUTO_COMMIT_STOP_FAILED',
        'autocommit',
        { error: error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error) }
      );
    } finally {
      this.performanceMonitor.end(perfId);
    }
  }

  private async validateGitRepository(): Promise<void> {
    try {
      await execFileAsync('git', ['rev-parse', '--is-inside-work-tree']);
    } catch (error) {
      throw new ProtectionError(
        'Not a git repository',
        'NOT_GIT_REPOSITORY',
        'autocommit'
      );
    }
  }

  private async startFileWatching(): Promise<void> {
    const watchPaths = this.config.watchPaths.length > 0 
      ? this.config.watchPaths 
      : [process.cwd()];

    this.watcher = chokidar.watch(watchPaths, {
      ignored: [
        /(^|[\/\\])\../, // Hidden files
        'node_modules/**',
        'dist/**',
        '.git/**',
        ...this.config.excludePaths
      ],
      persistent: true,
      ignoreInitial: true,
      followSymlinks: false,
      depth: 10
    });

    this.watcher
      .on('add', (filePath) => this.handleFileChange(filePath, 'added'))
      .on('change', (filePath) => this.handleFileChange(filePath, 'modified'))
      .on('unlink', (filePath) => this.handleFileChange(filePath, 'deleted'))
      .on('error', (error) => {
        this.logger.error('File watcher error', { error });
      });

    this.logger.info('File watching started', { paths: watchPaths });
  }

  private async handleFileChange(filePath: string, changeType: 'added' | 'modified' | 'deleted'): Promise<void> {
    try {
      const perfId = this.performanceMonitor.start('handle-file-change');
      
      // Create file change event
      const event: FileChangeEvent = {
        path: filePath,
        type: changeType,
        timestamp: new Date(),
        size: changeType !== 'deleted' ? (await this.getFileSize(filePath)) : 0
      };

      // Add to pending changes
      this.pendingChanges.set(filePath, event);
      
      // Check if file matches immediate commit rules
      const immediateRule = this.findMatchingRule(filePath, true);
      if (immediateRule) {
        this.logger.info('File matches immediate commit rule', { 
          file: filePath, 
          rule: immediateRule.description 
        });
        await this.commitImmediately(filePath, immediateRule);
      }
      
      this.performanceMonitor.end(perfId);
      
    } catch (error) {
      this.logger.error('Error handling file change', { filePath, changeType, error });
    }
  }

  private findMatchingRule(filePath: string, immediateOnly: boolean = false): CommitRule | null {
    return this.config.commitRules.find(rule => {
      if (immediateOnly && !rule.immediate) return false;
      return this.matchesPattern(filePath, rule.pattern);
    }) || null;
  }

  private matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex - escape special characters properly
    const regexPattern = pattern
      .replace(/\\/g, '\\\\')  // Escape backslashes first
      .replace(/\./g, '\\.')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\[/g, '\\[')
      .replace(/\]/g, '\\]')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/\^/g, '\\^')
      .replace(/\$/g, '\\$')
      .replace(/\+/g, '\\+')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\|/g, '\\|');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath) || regex.test(path.basename(filePath));
  }

  private async commitImmediately(filePath: string, rule: CommitRule): Promise<void> {
    if (this.isCommitting) {
      this.commitQueue.push(filePath);
      return;
    }

    this.isCommitting = true;
    
    try {
      // Run security check if required
      if (this.config.requireSecurityCheck) {
        const isSecure = await this.runSecurityCheck([filePath]);
        if (!isSecure) {
          this.logger.warn('Security check failed, skipping immediate commit', { filePath });
          return;
        }
      }

      // Generate commit message
      const message = this.config.generateIntelligentMessages
        ? await this.generateIntelligentMessage([filePath], rule)
        : `${rule.description}: ${path.basename(filePath)}`;

      // Commit the file
      await this.gitCommit([filePath], message);
      
      // Remove from pending changes
      this.pendingChanges.delete(filePath);
      
      this.logger.info('Immediate commit completed', { filePath, message });
      
    } catch (error) {
      this.logger.error('Immediate commit failed', { filePath, error });
    } finally {
      this.isCommitting = false;
      
      // Process queue
      if (this.commitQueue.length > 0) {
        const nextFile = this.commitQueue.shift()!;
        const nextRule = this.findMatchingRule(nextFile, true);
        if (nextRule) {
          setImmediate(() => this.commitImmediately(nextFile, nextRule));
        }
      }
    }
  }

  private startIntervalCommits(): void {
    const intervalMs = this.config.intervalMinutes * 60 * 1000;
    
    this.intervalTimer = setInterval(async () => {
      if (this.pendingChanges.size > 0) {
        await this.commitPendingChanges('Scheduled auto-commit');
      }
    }, intervalMs);
    
    this.logger.info('Interval commits started', { intervalMinutes: this.config.intervalMinutes });
  }

  private async commitPendingChanges(baseMessage: string): Promise<void> {
    if (this.isCommitting || this.pendingChanges.size === 0) {
      return;
    }

    this.isCommitting = true;
    const perfId = this.performanceMonitor.start('commit-pending-changes');
    
    try {
      const changes = Array.from(this.pendingChanges.values());
      const filePaths = changes.map(c => c.path);
      
      // Limit files per commit
      const filesToCommit = filePaths.slice(0, this.config.maxFilesPerCommit);
      
      // Run security check if required
      if (this.config.requireSecurityCheck) {
        const isSecure = await this.runSecurityCheck(filesToCommit);
        if (!isSecure) {
          this.logger.warn('Security check failed, skipping batch commit', { 
            fileCount: filesToCommit.length 
          });
          return;
        }
      }

      // Generate commit message
      const message = this.config.generateIntelligentMessages
        ? await this.generateBatchCommitMessage(changes.slice(0, this.config.maxFilesPerCommit))
        : `${baseMessage} - ${filesToCommit.length} file(s)`;

      // Commit files
      await this.gitCommit(filesToCommit, message);
      
      // Remove committed files from pending changes
      filesToCommit.forEach(file => this.pendingChanges.delete(file));
      
      this.lastCommitTime = new Date();
      this.logger.info('Batch commit completed', { 
        fileCount: filesToCommit.length, 
        message 
      });
      
    } catch (error) {
      this.logger.error('Batch commit failed', { error });
    } finally {
      this.isCommitting = false;
      this.performanceMonitor.end(perfId);
    }
  }

  private async runSecurityCheck(filePaths: string[]): Promise<boolean> {
    try {
      // Basic security checks
      for (const filePath of filePaths) {
        if (!(await fs.exists(filePath))) continue;
        
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Check for common secrets
        const secretPatterns = [
          /api[_-]?key\s*[:=]\s*["']?[a-zA-Z0-9]{20,}["']?/i,
          /password\s*[:=]\s*["']?[^"'\s]{8,}["']?/i,
          /secret\s*[:=]\s*["']?[a-zA-Z0-9]{16,}["']?/i,
          /token\s*[:=]\s*["']?[a-zA-Z0-9]{20,}["']?/i,
          /-----BEGIN.*PRIVATE KEY-----/,
        ];
        
        for (const pattern of secretPatterns) {
          if (pattern.test(content)) {
            this.logger.warn('Potential secret detected', { filePath, pattern: pattern.toString() });
            return false;
          }
        }
      }
      
      return true;
      
    } catch (error) {
      this.logger.error('Security check error', { error });
      return false;
    }
  }

  private async generateIntelligentMessage(filePaths: string[], rule?: CommitRule): Promise<string> {
    try {
      const fileTypes = this.categorizeFiles(filePaths);
      const action = this.determineAction(filePaths);
      
      if (rule) {
        return `${rule.description}: ${action} ${this.formatFileList(fileTypes)}`;
      }
      
      if (filePaths.length === 1) {
        const fileName = path.basename(filePaths[0]);
        const extension = path.extname(fileName);
        return `${action} ${this.getFileTypeDescription(extension)} ${fileName}`;
      }
      
      return `${action} ${filePaths.length} files: ${this.formatFileList(fileTypes)}`;
      
    } catch (error) {
      this.logger.error('Error generating intelligent message', { error });
      return `Auto-commit: ${filePaths.length} file(s)`;
    }
  }

  private async generateBatchCommitMessage(changes: FileChangeEvent[]): Promise<string> {
    try {
      const added = changes.filter(c => c.type === 'added').length;
      const modified = changes.filter(c => c.type === 'modified').length;
      const deleted = changes.filter(c => c.type === 'deleted').length;
      
      const parts: string[] = [];
      if (added > 0) parts.push(`${added} added`);
      if (modified > 0) parts.push(`${modified} modified`);
      if (deleted > 0) parts.push(`${deleted} deleted`);
      
      const summary = parts.join(', ');
      const fileTypes = this.categorizeFiles(changes.map(c => c.path));
      
      return `Auto-commit: ${summary} - ${this.formatFileList(fileTypes)}`;
      
    } catch (error) {
      this.logger.error('Error generating batch commit message', { error });
      return `Auto-commit: ${changes.length} file(s)`;
    }
  }

  private categorizeFiles(filePaths: string[]): Map<string, number> {
    const categories = new Map<string, number>();
    
    filePaths.forEach(filePath => {
      const extension = path.extname(filePath).toLowerCase();
      const category = this.getCategoryForExtension(extension);
      categories.set(category, (categories.get(category) || 0) + 1);
    });
    
    return categories;
  }

  private getCategoryForExtension(extension: string): string {
    const categoryMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.js': 'JavaScript',
      '.json': 'Configuration',
      '.md': 'Documentation',
      '.yml': 'Configuration',
      '.yaml': 'Configuration',
      '.css': 'Styles',
      '.scss': 'Styles',
      '.html': 'Templates',
      '.tsx': 'React',
      '.jsx': 'React',
      '.py': 'Python',
      '.java': 'Java',
      '.cs': 'C#',
      '.cpp': 'C++',
      '.c': 'C',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust',
      '.sql': 'Database',
      '.sh': 'Scripts',
      '.bat': 'Scripts',
      '.ps1': 'Scripts'
    };
    
    return categoryMap[extension] || 'Files';
  }

  private determineAction(filePaths: string[]): string {
    // Simple heuristics for determining the action
    const hasNew = filePaths.some(p => !fs.existsSync(p));
    const hasConfig = filePaths.some(p => 
      p.includes('config') || p.includes('package.json') || p.includes('.env')
    );
    const hasTest = filePaths.some(p => 
      p.includes('test') || p.includes('spec') || p.includes('.test.') || p.includes('.spec.')
    );
    
    if (hasNew) return 'Add';
    if (hasTest) return 'Update tests for';
    if (hasConfig) return 'Update configuration in';
    return 'Update';
  }

  private formatFileList(fileTypes: Map<string, number>): string {
    const parts: string[] = [];
    fileTypes.forEach((count, type) => {
      if (count === 1) {
        parts.push(`1 ${type.toLowerCase()} file`);
      } else {
        parts.push(`${count} ${type.toLowerCase()} files`);
      }
    });
    return parts.join(', ');
  }

  private getFileTypeDescription(extension: string): string {
    const descriptions: Record<string, string> = {
      '.ts': 'TypeScript file',
      '.js': 'JavaScript file',
      '.json': 'configuration file',
      '.md': 'documentation',
      '.css': 'stylesheet',
      '.html': 'template'
    };
    
    return descriptions[extension] || 'file';
  }

  private async gitCommit(filePaths: string[], message: string): Promise<CommitInfo> {
    try {
      // Add files to staging
      await execFileAsync('git', ['add', ...filePaths]);
      
      // Commit with message
      const { stdout } = await execFileAsync('git', ['commit', '-m', message]);
      
      // Get commit info
      const { stdout: hashOutput } = await execFileAsync('git', ['rev-parse', 'HEAD']);
      const hash = hashOutput.trim();
      
      const { stdout: authorOutput } = await execFileAsync('git', ['config', 'user.name']);
      const author = authorOutput.trim();
      
      const { stdout: branchOutput } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
      const branch = branchOutput.trim();
      
      const commitInfo: CommitInfo = {
        hash,
        message,
        timestamp: new Date(),
        files: filePaths,
        author,
        branch
      };
      
      this.logger.info('Git commit successful', commitInfo);
      return commitInfo;
      
    } catch (error) {
      this.logger.error('Git commit failed', { filePaths, message, error });
      throw new ProtectionError(
        'Git commit failed',
        'GIT_COMMIT_FAILED',
        'autocommit',
        { filePaths, message, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  // Public API methods
  async forceCommit(message?: string): Promise<CommitInfo> {
    const commitMessage = message || 'Manual force commit';
    
    if (this.pendingChanges.size === 0) {
      throw new ProtectionError(
        'No pending changes to commit',
        'NO_PENDING_CHANGES',
        'autocommit'
      );
    }
    
    const filePaths = Array.from(this.pendingChanges.keys());
    return await this.gitCommit(filePaths, commitMessage);
  }

  getPendingChanges(): FileChangeEvent[] {
    return Array.from(this.pendingChanges.values());
  }

  getStatus(): {
    isRunning: boolean;
    pendingChanges: number;
    lastCommitTime: Date;
    isCommitting: boolean;
    queueLength: number;
  } {
    return {
      isRunning: this.isRunning,
      pendingChanges: this.pendingChanges.size,
      lastCommitTime: this.lastCommitTime,
      isCommitting: this.isCommitting,
      queueLength: this.commitQueue.length
    };
  }

  async updateConfig(newConfig: Partial<AutoCommitConfig>): Promise<void> {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      await this.stop();
    }
    
    this.config = { ...this.config, ...newConfig };
    
    if (wasRunning) {
      await this.start();
    }
    
    this.logger.info('AutoCommitManager configuration updated', { config: this.config });
  }

  async getCommitHistory(limit: number = 10): Promise<CommitInfo[]> {
    try {
      const { stdout } = await execFileAsync('git', [
        'log',
        '--oneline',
        '-n',
        String(limit),
        '--pretty=format:%H|%s|%an|%ad',
        '--date=iso'
      ]);
      
      if (!stdout.trim()) {
        return [];
      }
      
      return stdout.trim().split('\n').map(line => {
        const [hash, message, author, dateStr] = line.split('|');
        return {
          hash,
          message,
          author,
          timestamp: new Date(dateStr),
          files: [] as string[], // Would need separate call to get files
          branch: '' // Would need separate call to get branch
        };
      });
      
    } catch (error) {
      this.logger.error('Error getting commit history', { error });
      return [];
    }
  }
}