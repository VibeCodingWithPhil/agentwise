import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as chokidar from 'chokidar';
import {
  BackupConfig,
  BackupDestination,
  BackupResult,
  BackupHistory,
  BackupError,
  Logger,
  PerformanceMonitor,
  FileSystem,
  GitIntegration,
  HttpClient
} from './types';

const execAsync = promisify(exec);

interface BackupMetadata {
  id: string;
  timestamp: Date;
  version: string;
  files: string[];
  size: number;
  hash: string;
  strategy: string;
  destination: string;
}

interface BackupJob {
  id: string;
  type: 'scheduled' | 'immediate' | 'event-based';
  files?: string[];
  destination?: BackupDestination;
  priority: number;
  createdAt: Date;
}

export class IntegratedBackupSystem {
  private config: BackupConfig;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private fileSystem: FileSystem;
  private gitIntegration: GitIntegration;
  private httpClient: HttpClient;
  
  private isRunning = false;
  private backupQueue: BackupJob[] = [];
  private isProcessingQueue = false;
  private watcher: chokidar.FSWatcher | null = null;
  private backupTimer: NodeJS.Timeout | null = null;
  private backupHistory: BackupHistory;
  private lastCriticalBackup: Date | null = null;

  constructor(
    config: BackupConfig,
    logger: Logger,
    performanceMonitor: PerformanceMonitor,
    fileSystem: FileSystem,
    gitIntegration: GitIntegration,
    httpClient: HttpClient
  ) {
    this.config = config;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.fileSystem = fileSystem;
    this.gitIntegration = gitIntegration;
    this.httpClient = httpClient;
    
    this.backupHistory = {
      backups: [],
      totalSize: 0,
      lastSuccessful: new Date(0),
      failureCount: 0,
      successRate: 100
    };
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('BackupSystem is already running');
      return;
    }

    const perfId = this.performanceMonitor.start('backup-system-start');
    
    try {
      this.logger.info('Starting IntegratedBackupSystem', { config: this.config });
      
      // Load existing backup history
      await this.loadBackupHistory();
      
      // Validate destinations
      await this.validateDestinations();
      
      // Start continuous backup if configured
      if (this.config.strategy === 'continuous') {
        await this.startContinuousBackup();
      }
      
      // Start interval backup if configured
      if (this.config.strategy === 'interval') {
        this.startIntervalBackup();
      }
      
      // Start event-based backup if configured
      if (this.config.strategy === 'event-based') {
        await this.startEventBasedBackup();
      }
      
      // Start queue processor
      this.startQueueProcessor();
      
      this.isRunning = true;
      this.logger.info('IntegratedBackupSystem started successfully');
      
    } catch (error) {
      this.logger.error('Failed to start BackupSystem', { error });
      throw new BackupError(
        'Failed to start backup system',
        'BACKUP_SYSTEM_START_FAILED',
        { error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      this.performanceMonitor.end(perfId);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('BackupSystem is not running');
      return;
    }

    const perfId = this.performanceMonitor.start('backup-system-stop');
    
    try {
      this.logger.info('Stopping IntegratedBackupSystem');
      
      // Stop file watcher
      if (this.watcher) {
        await this.watcher.close();
        this.watcher = null;
      }
      
      // Stop interval timer
      if (this.backupTimer) {
        clearInterval(this.backupTimer);
        this.backupTimer = null;
      }
      
      // Process remaining queue items
      if (this.backupQueue.length > 0) {
        this.logger.info('Processing remaining backup queue items');
        await this.processBackupQueue();
      }
      
      // Save backup history
      await this.saveBackupHistory();
      
      this.isRunning = false;
      this.logger.info('IntegratedBackupSystem stopped successfully');
      
    } catch (error) {
      this.logger.error('Error stopping BackupSystem', { error });
      throw new BackupError(
        'Failed to stop backup system',
        'BACKUP_SYSTEM_STOP_FAILED',
        { error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      this.performanceMonitor.end(perfId);
    }
  }

  private async loadBackupHistory(): Promise<void> {
    try {
      const historyPath = path.join(process.cwd(), '.backup-history.json');
      if (await this.fileSystem.exists(historyPath)) {
        const historyData = await this.fileSystem.read(historyPath);
        this.backupHistory = JSON.parse(historyData);
        
        // Convert date strings back to Date objects
        this.backupHistory.backups.forEach(backup => {
          backup.timestamp = new Date(backup.timestamp);
        });
        this.backupHistory.lastSuccessful = new Date(this.backupHistory.lastSuccessful);
      }
    } catch (error) {
      this.logger.warn('Failed to load backup history', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async saveBackupHistory(): Promise<void> {
    try {
      const historyPath = path.join(process.cwd(), '.backup-history.json');
      await this.fileSystem.write(historyPath, JSON.stringify(this.backupHistory, null, 2));
    } catch (error) {
      this.logger.warn('Failed to save backup history', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async validateDestinations(): Promise<void> {
    for (const destination of this.config.destinations) {
      try {
        await this.validateDestination(destination);
        this.logger.info('Backup destination validated', { type: destination.type, path: destination.path });
      } catch (error) {
        this.logger.error('Backup destination validation failed', { 
          destination: destination.type,
          path: destination.path,
          error: error instanceof Error ? error.message : String(error) 
        });
        
        if (destination.priority === 1) {
          throw new BackupError(
            'Primary backup destination is not available',
            'PRIMARY_DESTINATION_UNAVAILABLE',
            { destination }
          );
        }
      }
    }
  }

  private async validateDestination(destination: BackupDestination): Promise<void> {
    switch (destination.type) {
      case 'local':
        await this.validateLocalDestination(destination);
        break;
      case 'github':
        await this.validateGitHubDestination(destination);
        break;
      case 's3':
        await this.validateS3Destination(destination);
        break;
      case 'gdrive':
        await this.validateGDriveDestination(destination);
        break;
      default:
        throw new BackupError(
          `Unsupported destination type: ${destination.type}`,
          'UNSUPPORTED_DESTINATION_TYPE',
          { destination }
        );
    }
  }

  private async validateLocalDestination(destination: BackupDestination): Promise<void> {
    try {
      await fs.ensureDir(destination.path);
      
      // Test write permissions
      const testFile = path.join(destination.path, 'backup-test.txt');
      await fs.writeFile(testFile, 'test');
      await fs.remove(testFile);
      
    } catch (error) {
      throw new BackupError(
        'Local destination validation failed',
        'LOCAL_DESTINATION_INVALID',
        { path: destination.path, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async validateGitHubDestination(destination: BackupDestination): Promise<void> {
    try {
      // Check if we can access the repository
      // Note: Basic validation - would need proper repository access check
      if (!destination.credentials?.token && !destination.credentials) {
        throw new Error('GitHub destination requires authentication token or credentials');
      }
      
      // Check if we can create branches (for backup branches)
      const currentBranch = await this.gitIntegration.getCurrentBranch();
      if (!currentBranch) {
        throw new Error('Unable to determine current branch');
      }
      
    } catch (error) {
      throw new BackupError(
        'GitHub destination validation failed',
        'GITHUB_DESTINATION_INVALID',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async validateS3Destination(destination: BackupDestination): Promise<void> {
    // S3 validation would require AWS SDK integration
    // For now, just check if credentials are provided
    if (!destination.credentials?.accessKeyId || !destination.credentials?.secretAccessKey) {
      throw new BackupError(
        'S3 destination missing required credentials',
        'S3_CREDENTIALS_MISSING',
        { destination }
      );
    }
  }

  private async validateGDriveDestination(destination: BackupDestination): Promise<void> {
    // Google Drive validation would require Google APIs integration
    // For now, just check if credentials are provided
    if (!destination.credentials?.clientId || !destination.credentials?.clientSecret) {
      throw new BackupError(
        'Google Drive destination missing required credentials',
        'GDRIVE_CREDENTIALS_MISSING',
        { destination }
      );
    }
  }

  private async startContinuousBackup(): Promise<void> {
    // Watch for file changes and trigger backups
    this.watcher = chokidar.watch(process.cwd(), {
      ignored: [
        /(^|[\/\\])\../,
        'node_modules/**',
        'dist/**',
        '.git/**',
        '*.tmp',
        '*.temp'
      ],
      persistent: true,
      ignoreInitial: true
    });

    this.watcher
      .on('add', (filePath) => this.handleFileChange(filePath, 'added'))
      .on('change', (filePath) => this.handleFileChange(filePath, 'modified'))
      .on('unlink', (filePath) => this.handleFileChange(filePath, 'deleted'))
      .on('error', (error) => {
        this.logger.error('File watcher error', { error });
      });

    this.logger.info('Continuous backup monitoring started');
  }

  private async handleFileChange(filePath: string, changeType: string): Promise<void> {
    try {
      // Check if this is a critical file that needs immediate backup
      if (this.isCriticalFile(filePath)) {
        const job: BackupJob = {
          id: crypto.randomUUID(),
          type: 'immediate',
          files: [filePath],
          priority: 1,
          createdAt: new Date()
        };
        
        this.backupQueue.unshift(job); // High priority - add to front
        this.logger.info('Critical file change detected, queuing immediate backup', { 
          filePath, 
          changeType 
        });
      }
    } catch (error) {
      this.logger.error('Error handling file change', { filePath, changeType, error });
    }
  }

  private isCriticalFile(filePath: string): boolean {
    const criticalPatterns = [
      /package\.json$/,
      /tsconfig\.json$/,
      /\.env$/,
      /config\.(js|ts|json)$/,
      /database\.sql$/,
      /\.key$/,
      /\.pem$/,
      /secrets\./,
      /credentials\./
    ];
    
    return criticalPatterns.some(pattern => pattern.test(filePath));
  }

  private startIntervalBackup(): void {
    // Default to daily backups if no specific interval is configured
    const intervalMs = 24 * 60 * 60 * 1000; // 24 hours
    
    this.backupTimer = setInterval(async () => {
      const job: BackupJob = {
        id: crypto.randomUUID(),
        type: 'scheduled',
        priority: 3,
        createdAt: new Date()
      };
      
      this.backupQueue.push(job);
      this.logger.info('Scheduled backup queued');
    }, intervalMs);
    
    this.logger.info('Interval backup scheduling started', { intervalHours: 24 });
  }

  private async startEventBasedBackup(): Promise<void> {
    // Listen for git events
    try {
      const currentBranch = await this.gitIntegration.getCurrentBranch();
      this.logger.info('Event-based backup monitoring started', { branch: currentBranch });
      
      // This would typically hook into git hooks or other events
      // For now, we'll trigger on significant git operations
      
    } catch (error) {
      this.logger.warn('Failed to start event-based backup monitoring', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  private startQueueProcessor(): void {
    // Process backup queue every 30 seconds
    setInterval(async () => {
      if (!this.isProcessingQueue && this.backupQueue.length > 0) {
        await this.processBackupQueue();
      }
    }, 30 * 1000);
  }

  private async processBackupQueue(): Promise<void> {
    if (this.isProcessingQueue || this.backupQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;
    
    try {
      // Sort queue by priority (lower number = higher priority)
      this.backupQueue.sort((a, b) => a.priority - b.priority);
      
      while (this.backupQueue.length > 0) {
        const job = this.backupQueue.shift()!;
        
        try {
          await this.processBackupJob(job);
        } catch (error) {
          this.logger.error('Backup job failed', { 
            jobId: job.id, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }
      
    } catch (error) {
      this.logger.error('Error processing backup queue', { error });
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async processBackupJob(job: BackupJob): Promise<void> {
    const perfId = this.performanceMonitor.start('process-backup-job');
    
    try {
      this.logger.info('Processing backup job', { jobId: job.id, type: job.type });
      
      // Determine what to backup
      const filesToBackup = job.files || await this.getFilesToBackup();
      
      // Process destinations in priority order
      const sortedDestinations = [...this.config.destinations].sort((a, b) => a.priority - b.priority);
      
      for (const destination of sortedDestinations) {
        try {
          const result = await this.performBackup(filesToBackup, destination, job);
          
          // Add to history
          this.updateBackupHistory(result);
          
          this.logger.info('Backup job completed successfully', { 
            jobId: job.id,
            destination: destination.type,
            files: result.filesBackedUp,
            size: result.size
          });
          
          break; // Success - no need to try other destinations
          
        } catch (error) {
          this.logger.error('Backup failed for destination', { 
            jobId: job.id,
            destination: destination.type,
            error: error instanceof Error ? error.message : String(error) 
          });
          
          // Try next destination
          continue;
        }
      }
      
    } catch (error) {
      this.logger.error('Backup job processing failed', { jobId: job.id, error });
    } finally {
      this.performanceMonitor.end(perfId);
    }
  }

  private async getFilesToBackup(): Promise<string[]> {
    try {
      // Get all files excluding common ignore patterns
      const allFiles = await this.getAllFiles(process.cwd());
      
      return allFiles.filter(file => !this.shouldExcludeFromBackup(file));
      
    } catch (error) {
      this.logger.error('Error getting files to backup', { error });
      return [];
    }
  }

  private async getAllFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const entries = await this.fileSystem.list(dir);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = await this.fileSystem.stat(fullPath);
        
        if (stat.size === -1) { // Directory
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      this.logger.warn('Error reading directory for backup', { dir, error: error instanceof Error ? error.message : String(error) });
    }
    
    return files;
  }

  private shouldExcludeFromBackup(filePath: string): boolean {
    const excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /\.nyc_output/,
      /\.cache/,
      /\.temp/,
      /\.tmp/,
      /\.log$/,
      /\.pid$/,
      /\.swp$/,
      /\.DS_Store$/,
      /Thumbs\.db$/
    ];
    
    return excludePatterns.some(pattern => pattern.test(filePath));
  }

  private async performBackup(
    files: string[], 
    destination: BackupDestination, 
    job: BackupJob
  ): Promise<BackupResult> {
    const perfId = this.performanceMonitor.start('perform-backup');
    const backupId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting backup', { 
        backupId,
        destination: destination.type,
        fileCount: files.length 
      });
      
      let result: BackupResult;
      
      switch (destination.type) {
        case 'local':
          result = await this.backupToLocal(backupId, files, destination);
          break;
        case 'github':
          result = await this.backupToGitHub(backupId, files, destination);
          break;
        case 's3':
          result = await this.backupToS3(backupId, files, destination);
          break;
        case 'gdrive':
          result = await this.backupToGDrive(backupId, files, destination);
          break;
        default:
          throw new BackupError(
            `Unsupported backup destination: ${destination.type}`,
            'UNSUPPORTED_DESTINATION',
            { destination }
          );
      }
      
      result.duration = Date.now() - startTime;
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const failedResult: BackupResult = {
        id: backupId,
        timestamp: new Date(),
        status: 'failed',
        destination: `${destination.type}:${destination.path}`,
        filesBackedUp: 0,
        size: 0,
        duration,
        error: error instanceof Error ? error.message : String(error),
        hash: ''
      };
      
      return failedResult;
    } finally {
      this.performanceMonitor.end(perfId);
    }
  }

  private async backupToLocal(
    backupId: string, 
    files: string[], 
    destination: BackupDestination
  ): Promise<BackupResult> {
    const timestamp = new Date();
    const backupDir = path.join(destination.path, `backup-${backupId}`);
    
    await fs.ensureDir(backupDir);
    
    let totalSize = 0;
    let backedUpFiles = 0;
    
    // Create backup manifest
    const manifest = {
      id: backupId,
      timestamp,
      files: [] as Array<{
        original: string;
        backup: string;
        size: number;
        modified: Date;
      }>,
      version: '1.0'
    };
    
    for (const file of files) {
      try {
        const relativePath = path.relative(process.cwd(), file);
        const backupPath = path.join(backupDir, relativePath);
        
        await fs.ensureDir(path.dirname(backupPath));
        
        if (await this.fileSystem.exists(file)) {
          await fs.copy(file, backupPath);
          
          const stat = await this.fileSystem.stat(file);
          totalSize += stat.size;
          backedUpFiles++;
          
          manifest.files.push({
            original: file,
            backup: backupPath,
            size: stat.size,
            modified: stat.modified
          });
        }
      } catch (error) {
        this.logger.warn('Failed to backup file', { file, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    // Save manifest
    await fs.writeJSON(path.join(backupDir, 'manifest.json'), manifest, { spaces: 2 });
    
    // Create archive if compression is enabled
    if (this.config.compression) {
      await this.compressBackup(backupDir);
    }
    
    // Calculate hash
    const hash = await this.calculateBackupHash(backupDir);
    
    return {
      id: backupId,
      timestamp,
      status: 'success',
      destination: `local:${backupDir}`,
      filesBackedUp: backedUpFiles,
      size: totalSize,
      duration: 0, // Will be set by caller
      hash
    };
  }

  private async backupToGitHub(
    backupId: string, 
    files: string[], 
    destination: BackupDestination
  ): Promise<BackupResult> {
    const timestamp = new Date();
    const branchName = `backup-${backupId}`;
    
    try {
      // Create backup branch
      await this.gitIntegration.createBranch(branchName);
      
      // Add all files to git
      const addCommand = `git add ${files.map(f => `"${f}"`).join(' ')}`;
      await execAsync(addCommand);
      
      // Commit
      const commitMessage = `Automated backup - ${timestamp.toISOString()}`;
      await execAsync(`git commit -m "${commitMessage}"`);
      
      // Push backup branch
      await this.gitIntegration.push(branchName);
      
      const totalSize = await this.calculateTotalSize(files);
      
      return {
        id: backupId,
        timestamp,
        status: 'success',
        destination: `github:${branchName}`,
        filesBackedUp: files.length,
        size: totalSize,
        duration: 0,
        hash: backupId // Use backup ID as hash for GitHub
      };
      
    } catch (error) {
      throw new BackupError(
        'GitHub backup failed',
        'GITHUB_BACKUP_FAILED',
        { backupId, error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  private async backupToS3(
    backupId: string, 
    files: string[], 
    destination: BackupDestination
  ): Promise<BackupResult> {
    // S3 backup would require AWS SDK
    // For now, return a placeholder implementation
    throw new BackupError(
      'S3 backup not implemented',
      'S3_BACKUP_NOT_IMPLEMENTED',
      { backupId }
    );
  }

  private async backupToGDrive(
    backupId: string, 
    files: string[], 
    destination: BackupDestination
  ): Promise<BackupResult> {
    // Google Drive backup would require Google APIs
    // For now, return a placeholder implementation
    throw new BackupError(
      'Google Drive backup not implemented',
      'GDRIVE_BACKUP_NOT_IMPLEMENTED',
      { backupId }
    );
  }

  private async compressBackup(backupDir: string): Promise<void> {
    try {
      const archivePath = `${backupDir}.tar.gz`;
      await execAsync(`tar -czf "${archivePath}" -C "${path.dirname(backupDir)}" "${path.basename(backupDir)}"`);
      
      // Remove uncompressed directory
      await fs.remove(backupDir);
      
      this.logger.info('Backup compressed successfully', { archivePath });
    } catch (error) {
      this.logger.warn('Backup compression failed', { backupDir, error: error instanceof Error ? error.message : String(error) });
    }
  }

  private async calculateBackupHash(backupPath: string): Promise<string> {
    try {
      const hash = crypto.createHash('sha256');
      
      if (backupPath.endsWith('.tar.gz')) {
        const content = await fs.readFile(backupPath);
        hash.update(content);
      } else {
        // Hash directory contents
        const files = await this.getAllFiles(backupPath);
        files.sort(); // Ensure consistent ordering
        
        for (const file of files) {
          const content = await fs.readFile(file);
          hash.update(content);
        }
      }
      
      return hash.digest('hex');
    } catch (error) {
      this.logger.warn('Failed to calculate backup hash', { backupPath, error: error instanceof Error ? error.message : String(error) });
      return '';
    }
  }

  private async calculateTotalSize(files: string[]): Promise<number> {
    let totalSize = 0;
    
    for (const file of files) {
      try {
        if (await this.fileSystem.exists(file)) {
          const stat = await this.fileSystem.stat(file);
          totalSize += stat.size;
        }
      } catch (error) {
        // Ignore individual file errors
      }
    }
    
    return totalSize;
  }

  private updateBackupHistory(result: BackupResult): void {
    this.backupHistory.backups.push(result);
    this.backupHistory.totalSize += result.size;
    
    if (result.status === 'success') {
      this.backupHistory.lastSuccessful = result.timestamp;
    } else {
      this.backupHistory.failureCount++;
    }
    
    // Calculate success rate
    const totalBackups = this.backupHistory.backups.length;
    const successfulBackups = this.backupHistory.backups.filter(b => b.status === 'success').length;
    this.backupHistory.successRate = totalBackups > 0 ? (successfulBackups / totalBackups) * 100 : 100;
    
    // Keep only recent backups (last 100)
    if (this.backupHistory.backups.length > 100) {
      this.backupHistory.backups = this.backupHistory.backups.slice(-100);
    }
  }

  // Public API methods
  async createBackup(files?: string[], destination?: BackupDestination): Promise<BackupResult> {
    if (!this.isRunning) {
      throw new BackupError('Backup system is not running', 'SYSTEM_NOT_RUNNING');
    }

    const job: BackupJob = {
      id: crypto.randomUUID(),
      type: 'immediate',
      files,
      destination,
      priority: 1,
      createdAt: new Date()
    };
    
    // Process immediately
    await this.processBackupJob(job);
    
    // Return the latest backup result
    return this.backupHistory.backups[this.backupHistory.backups.length - 1];
  }

  async restoreBackup(backupId: string, targetPath?: string): Promise<void> {
    const backup = this.backupHistory.backups.find(b => b.id === backupId);
    
    if (!backup) {
      throw new BackupError(
        'Backup not found',
        'BACKUP_NOT_FOUND',
        { backupId }
      );
    }
    
    this.logger.info('Starting backup restoration', { backupId, targetPath });
    
    // Implementation would depend on backup destination and format
    // For now, throw not implemented
    throw new BackupError(
      'Backup restoration not implemented',
      'RESTORE_NOT_IMPLEMENTED',
      { backupId }
    );
  }

  getBackupHistory(): BackupHistory {
    return { ...this.backupHistory };
  }

  getStatus(): {
    isRunning: boolean;
    queueLength: number;
    lastBackup: Date | null;
    successRate: number;
  } {
    return {
      isRunning: this.isRunning,
      queueLength: this.backupQueue.length,
      lastBackup: this.backupHistory.lastSuccessful,
      successRate: this.backupHistory.successRate
    };
  }

  async updateConfig(newConfig: Partial<BackupConfig>): Promise<void> {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      await this.stop();
    }
    
    this.config = { ...this.config, ...newConfig };
    
    if (wasRunning) {
      await this.start();
    }
    
    this.logger.info('BackupSystem configuration updated', { config: this.config });
  }
}