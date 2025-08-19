import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BackupInfo {
  id: string;
  projectName: string;
  timestamp: Date;
  size: number;
  hash: string;
  description: string;
  files: number;
}

export interface RestoreOptions {
  backupId: string;
  projectName: string;
  confirmRestore?: boolean;
}

export class BackupManager {
  private backupDir: string;
  private workspaceDir: string;
  private metadataFile: string;
  private maxBackups: number = 10; // Keep last 10 backups per project

  constructor(
    backupDir: string = path.join(process.cwd(), '.backups'),
    workspaceDir: string = path.join(process.cwd(), 'workspace')
  ) {
    this.backupDir = backupDir;
    this.workspaceDir = workspaceDir;
    this.metadataFile = path.join(backupDir, 'backup-metadata.json');
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  private async ensureBackupDirectory(): Promise<void> {
    await fs.ensureDir(this.backupDir);
    
    // Create .gitignore to prevent backups from being committed
    const gitignorePath = path.join(this.backupDir, '.gitignore');
    if (!await fs.pathExists(gitignorePath)) {
      await fs.writeFile(gitignorePath, '*\n!.gitignore\n!backup-metadata.json\n');
    }
  }

  /**
   * Create a backup of a project
   */
  async createBackup(projectName: string, description: string = 'Manual backup'): Promise<BackupInfo> {
    const projectPath = path.join(this.workspaceDir, projectName);
    
    if (!await fs.pathExists(projectPath)) {
      throw new Error(`Project not found: ${projectName}`);
    }

    // Generate backup ID
    const timestamp = new Date();
    const backupId = `${projectName}-${timestamp.toISOString().replace(/[:.]/g, '-')}`;
    const backupPath = path.join(this.backupDir, `${backupId}.tar.gz`);

    console.log(`Creating backup for ${projectName}...`);

    try {
      // Create tarball excluding node_modules and other unnecessary files
      const excludes = [
        '--exclude=node_modules',
        '--exclude=.git',
        '--exclude=dist',
        '--exclude=build',
        '--exclude=coverage',
        '--exclude=.env.local',
        '--exclude=.env.*.local',
        '--exclude=*.log'
      ].join(' ');

      const command = `tar -czf "${backupPath}" ${excludes} -C "${this.workspaceDir}" "${projectName}"`;
      await execAsync(command);

      // Calculate file hash for integrity
      const fileBuffer = await fs.readFile(backupPath);
      const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

      // Get backup size
      const stats = await fs.stat(backupPath);

      // Count files in backup
      const { stdout } = await execAsync(`tar -tzf "${backupPath}" | wc -l`);
      const fileCount = parseInt(stdout.trim(), 10);

      // Create backup info
      const backupInfo: BackupInfo = {
        id: backupId,
        projectName,
        timestamp,
        size: stats.size,
        hash,
        description,
        files: fileCount
      };

      // Save metadata
      await this.saveBackupMetadata(backupInfo);

      // Clean old backups
      await this.cleanOldBackups(projectName);

      console.log(`✓ Backup created: ${backupId} (${this.formatSize(stats.size)})`);
      
      return backupInfo;
    } catch (error) {
      // Clean up failed backup
      if (await fs.pathExists(backupPath)) {
        await fs.remove(backupPath);
      }
      throw error;
    }
  }

  /**
   * Restore a project from backup
   */
  async restoreBackup(options: RestoreOptions): Promise<void> {
    const { backupId, projectName, confirmRestore = true } = options;
    const backupPath = path.join(this.backupDir, `${backupId}.tar.gz`);
    const projectPath = path.join(this.workspaceDir, projectName);

    if (!await fs.pathExists(backupPath)) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    // Verify backup integrity
    const metadata = await this.getBackupMetadata(backupId);
    if (metadata) {
      const fileBuffer = await fs.readFile(backupPath);
      const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
      
      if (currentHash !== metadata.hash) {
        throw new Error('Backup integrity check failed - file may be corrupted');
      }
    }

    // Create safety backup of current state if project exists
    if (await fs.pathExists(projectPath)) {
      if (confirmRestore) {
        console.log(`Creating safety backup of current ${projectName} before restore...`);
        await this.createBackup(projectName, 'Pre-restore safety backup');
      }

      // Remove current project
      console.log(`Removing current ${projectName}...`);
      await fs.remove(projectPath);
    }

    console.log(`Restoring ${projectName} from backup ${backupId}...`);

    try {
      // Extract backup
      const command = `tar -xzf "${backupPath}" -C "${this.workspaceDir}"`;
      await execAsync(command);

      console.log(`✓ Successfully restored ${projectName} from backup`);
    } catch (error) {
      console.error(`Failed to restore backup: ${error}`);
      throw error;
    }
  }

  /**
   * List all backups for a project
   */
  async listBackups(projectName?: string): Promise<BackupInfo[]> {
    const metadata = await this.loadAllMetadata();
    
    if (projectName) {
      return metadata.filter(backup => backup.projectName === projectName);
    }
    
    return metadata;
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(backupId: string): Promise<void> {
    const backupPath = path.join(this.backupDir, `${backupId}.tar.gz`);
    
    if (await fs.pathExists(backupPath)) {
      await fs.remove(backupPath);
      await this.removeBackupMetadata(backupId);
      console.log(`✓ Deleted backup: ${backupId}`);
    }
  }

  /**
   * Get backup information
   */
  async getBackupInfo(backupId: string): Promise<BackupInfo | null> {
    return this.getBackupMetadata(backupId);
  }

  /**
   * Create incremental backup (only changed files)
   */
  async createIncrementalBackup(projectName: string, description?: string): Promise<BackupInfo> {
    // For now, create a full backup
    // TODO: Implement incremental backup using rsync or git
    return this.createBackup(projectName, description || 'Incremental backup');
  }

  /**
   * Auto-backup before risky operations
   */
  async autoBackup(projectName: string, operation: string): Promise<BackupInfo> {
    const description = `Auto-backup before: ${operation}`;
    return this.createBackup(projectName, description);
  }

  /**
   * Clean old backups to maintain storage limits
   */
  private async cleanOldBackups(projectName: string): Promise<void> {
    const backups = await this.listBackups(projectName);
    
    if (backups.length > this.maxBackups) {
      // Sort by timestamp, oldest first
      const sortedBackups = backups.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );

      // Delete oldest backups
      const toDelete = sortedBackups.slice(0, backups.length - this.maxBackups);
      
      for (const backup of toDelete) {
        // Don't delete safety backups
        if (!backup.description.includes('safety')) {
          await this.deleteBackup(backup.id);
        }
      }
    }
  }

  /**
   * Save backup metadata
   */
  private async saveBackupMetadata(info: BackupInfo): Promise<void> {
    const metadata = await this.loadAllMetadata();
    metadata.push(info);
    await fs.writeJSON(this.metadataFile, metadata, { spaces: 2 });
  }

  /**
   * Load all backup metadata
   */
  private async loadAllMetadata(): Promise<BackupInfo[]> {
    if (await fs.pathExists(this.metadataFile)) {
      return await fs.readJSON(this.metadataFile);
    }
    return [];
  }

  /**
   * Get specific backup metadata
   */
  private async getBackupMetadata(backupId: string): Promise<BackupInfo | null> {
    const metadata = await this.loadAllMetadata();
    return metadata.find(backup => backup.id === backupId) || null;
  }

  /**
   * Remove backup metadata
   */
  private async removeBackupMetadata(backupId: string): Promise<void> {
    const metadata = await this.loadAllMetadata();
    const filtered = metadata.filter(backup => backup.id !== backupId);
    await fs.writeJSON(this.metadataFile, filtered, { spaces: 2 });
  }

  /**
   * Format file size for display
   */
  private formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Verify backup integrity
   */
  async verifyBackup(backupId: string): Promise<boolean> {
    const backupPath = path.join(this.backupDir, `${backupId}.tar.gz`);
    
    if (!await fs.pathExists(backupPath)) {
      return false;
    }

    try {
      // Test if tar file is valid
      const { stderr } = await execAsync(`tar -tzf "${backupPath}" > /dev/null`);
      if (stderr) {
        console.error(`Backup verification failed: ${stderr}`);
        return false;
      }

      // Verify hash if metadata exists
      const metadata = await this.getBackupMetadata(backupId);
      if (metadata) {
        const fileBuffer = await fs.readFile(backupPath);
        const currentHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        return currentHash === metadata.hash;
      }

      return true;
    } catch (error) {
      console.error(`Backup verification error: ${error}`);
      return false;
    }
  }
}