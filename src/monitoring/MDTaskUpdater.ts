import * as fs from 'fs-extra';
import * as path from 'path';

export interface UpdateTask {
  filePath: string;
  lineNumber: number;
  isCompleted: boolean;
  addTimestamp?: boolean;
}

export interface UpdateResult {
  success: boolean;
  filePath: string;
  tasksUpdated: number;
  error?: string;
}

export class MDTaskUpdater {
  private backupDir: string;

  constructor(backupDir: string = path.join(process.cwd(), '.backup', 'md-updates')) {
    this.backupDir = backupDir;
  }

  /**
   * Update a single task's checkbox state in an MD file
   */
  async updateTask(task: UpdateTask): Promise<UpdateResult> {
    try {
      // Read the file
      const content = await fs.readFile(task.filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Validate line number
      if (task.lineNumber < 0 || task.lineNumber >= lines.length) {
        return {
          success: false,
          filePath: task.filePath,
          tasksUpdated: 0,
          error: `Invalid line number: ${task.lineNumber}`
        };
      }
      
      // Create backup before modifying
      await this.createBackup(task.filePath);
      
      // Update the specific line
      const updatedLine = this.updateCheckboxLine(
        lines[task.lineNumber],
        task.isCompleted,
        task.addTimestamp
      );
      
      if (updatedLine === lines[task.lineNumber]) {
        // No change needed
        return {
          success: true,
          filePath: task.filePath,
          tasksUpdated: 0
        };
      }
      
      lines[task.lineNumber] = updatedLine;
      
      // Write back to file
      await fs.writeFile(task.filePath, lines.join('\n'), 'utf-8');
      
      return {
        success: true,
        filePath: task.filePath,
        tasksUpdated: 1
      };
      
    } catch (error) {
      return {
        success: false,
        filePath: task.filePath,
        tasksUpdated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update multiple tasks in batch
   */
  async updateTasks(tasks: UpdateTask[]): Promise<UpdateResult[]> {
    const results: UpdateResult[] = [];
    
    // Group tasks by file for efficiency
    const tasksByFile = new Map<string, UpdateTask[]>();
    
    for (const task of tasks) {
      if (!tasksByFile.has(task.filePath)) {
        tasksByFile.set(task.filePath, []);
      }
      tasksByFile.get(task.filePath)!.push(task);
    }
    
    // Process each file
    for (const [filePath, fileTasks] of tasksByFile) {
      const result = await this.updateTasksInFile(filePath, fileTasks);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Update multiple tasks in a single file
   */
  private async updateTasksInFile(filePath: string, tasks: UpdateTask[]): Promise<UpdateResult> {
    try {
      // Read the file
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      // Create backup
      await this.createBackup(filePath);
      
      // Sort tasks by line number (descending) to avoid index shifting
      const sortedTasks = tasks.sort((a, b) => b.lineNumber - a.lineNumber);
      
      let updatedCount = 0;
      
      for (const task of sortedTasks) {
        if (task.lineNumber >= 0 && task.lineNumber < lines.length) {
          const updatedLine = this.updateCheckboxLine(
            lines[task.lineNumber],
            task.isCompleted,
            task.addTimestamp
          );
          
          if (updatedLine !== lines[task.lineNumber]) {
            lines[task.lineNumber] = updatedLine;
            updatedCount++;
          }
        }
      }
      
      // Write back to file if there were changes
      if (updatedCount > 0) {
        await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
      }
      
      return {
        success: true,
        filePath,
        tasksUpdated: updatedCount
      };
      
    } catch (error) {
      return {
        success: false,
        filePath,
        tasksUpdated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update a checkbox line while preserving formatting
   */
  private updateCheckboxLine(line: string, isCompleted: boolean, addTimestamp: boolean = true): string {
    // Match various checkbox patterns
    const patterns = [
      {
        // Standard format: - [ ] or - [x]
        regex: /^(\s*)([-*])\s*\[([ xX])\](\s*)(.+)/,
        replace: (match: RegExpMatchArray) => {
          const indent = match[1];
          const bullet = match[2];
          const newState = isCompleted ? 'x' : ' ';
          const spacing = match[4];
          let description = match[5];
          
          // Add or update timestamp if completing
          if (isCompleted && addTimestamp) {
            description = this.addCompletionTimestamp(description);
          } else if (!isCompleted) {
            description = this.removeCompletionTimestamp(description);
          }
          
          return `${indent}${bullet} [${newState}]${spacing}${description}`;
        }
      },
      {
        // Numbered format: 1. [ ] or 1. [x]
        regex: /^(\s*)(\d+\.)\s*\[([ xX])\](\s*)(.+)/,
        replace: (match: RegExpMatchArray) => {
          const indent = match[1];
          const number = match[2];
          const newState = isCompleted ? 'x' : ' ';
          const spacing = match[4];
          let description = match[5];
          
          if (isCompleted && addTimestamp) {
            description = this.addCompletionTimestamp(description);
          } else if (!isCompleted) {
            description = this.removeCompletionTimestamp(description);
          }
          
          return `${indent}${number} [${newState}]${spacing}${description}`;
        }
      }
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern.regex);
      if (match) {
        return pattern.replace(match);
      }
    }
    
    // Return unchanged if no pattern matches
    return line;
  }

  /**
   * Add completion timestamp to task description
   */
  private addCompletionTimestamp(description: string): string {
    // Remove existing timestamp if present
    description = this.removeCompletionTimestamp(description);
    
    // Add new timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    return `${description} <!-- completed: ${timestamp} -->`;
  }

  /**
   * Remove completion timestamp from task description
   */
  private removeCompletionTimestamp(description: string): string {
    return description.replace(/\s*<!--\s*completed:\s*[\d-]+\s*-->/g, '');
  }

  /**
   * Create a backup of the file before modification
   */
  private async createBackup(filePath: string): Promise<void> {
    try {
      await fs.ensureDir(this.backupDir);
      
      const filename = path.basename(filePath);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(this.backupDir, `${timestamp}_${filename}`);
      
      await fs.copyFile(filePath, backupPath);
      
      // Clean old backups (keep only last 10 per file)
      await this.cleanOldBackups(filename);
      
    } catch (error) {
      console.error(`Failed to create backup for ${filePath}:`, error);
      // Continue with update even if backup fails
    }
  }

  /**
   * Clean old backup files
   */
  private async cleanOldBackups(filename: string): Promise<void> {
    try {
      const files = await fs.readdir(this.backupDir);
      const backups = files
        .filter(f => f.endsWith(`_${filename}`))
        .sort()
        .reverse();
      
      // Keep only the 10 most recent backups
      const toDelete = backups.slice(10);
      
      for (const file of toDelete) {
        await fs.remove(path.join(this.backupDir, file));
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  /**
   * Mark all tasks in a phase as completed
   */
  async completePhase(filePath: string, phaseNumber: number): Promise<UpdateResult> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      let inTargetPhase = false;
      let updatedCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check for phase header
        const phaseMatch = line.match(/^##\s+Phase\s+(\d+)/i);
        if (phaseMatch) {
          inTargetPhase = parseInt(phaseMatch[1]) === phaseNumber;
          continue;
        }
        
        // Check for next phase or major section (exit current phase)
        if (line.match(/^##\s+/)) {
          inTargetPhase = false;
          continue;
        }
        
        // Update tasks in target phase
        if (inTargetPhase && this.isTaskLine(line)) {
          const updatedLine = this.updateCheckboxLine(line, true, true);
          if (updatedLine !== line) {
            lines[i] = updatedLine;
            updatedCount++;
          }
        }
      }
      
      if (updatedCount > 0) {
        await this.createBackup(filePath);
        await fs.writeFile(filePath, lines.join('\n'), 'utf-8');
      }
      
      return {
        success: true,
        filePath,
        tasksUpdated: updatedCount
      };
      
    } catch (error) {
      return {
        success: false,
        filePath,
        tasksUpdated: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Check if a line contains a task checkbox
   */
  private isTaskLine(line: string): boolean {
    return /^(\s*)[-*\d.]+\s*\[[ xX]\]/.test(line);
  }

  /**
   * Get task at specific line number
   */
  async getTaskAtLine(filePath: string, lineNumber: number): Promise<{
    description: string;
    isCompleted: boolean;
  } | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');
      
      if (lineNumber < 0 || lineNumber >= lines.length) {
        return null;
      }
      
      const line = lines[lineNumber];
      const match = line.match(/^(\s*)[-*\d.]+\s*\[([ xX])\]\s*(.+)/);
      
      if (match) {
        return {
          description: match[3].trim(),
          isCompleted: match[2].toLowerCase() === 'x'
        };
      }
      
      return null;
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Restore file from backup
   */
  async restoreFromBackup(filePath: string, backupTimestamp?: string): Promise<boolean> {
    try {
      const filename = path.basename(filePath);
      const files = await fs.readdir(this.backupDir);
      const backups = files
        .filter(f => f.endsWith(`_${filename}`))
        .sort()
        .reverse();
      
      if (backups.length === 0) {
        return false;
      }
      
      let backupFile: string;
      
      if (backupTimestamp) {
        // Find specific backup
        backupFile = backups.find(f => f.includes(backupTimestamp)) || backups[0];
      } else {
        // Use most recent backup
        backupFile = backups[0];
      }
      
      const backupPath = path.join(this.backupDir, backupFile);
      await fs.copyFile(backupPath, filePath);
      
      return true;
      
    } catch (error) {
      console.error(`Failed to restore backup for ${filePath}:`, error);
      return false;
    }
  }
}