import * as chokidar from 'chokidar';
import * as path from 'path';
import * as fs from 'fs-extra';
import { EventEmitter } from 'events';

export interface TaskChange {
  projectId: string;
  filePath: string;
  taskId: string;
  taskDescription: string;
  isCompleted: boolean;
  phase?: string;
  agent?: string;
  timestamp: Date;
}

export class MDFileWatcher extends EventEmitter {
  private watcher: chokidar.FSWatcher | null = null;
  private workspacePath: string;
  private watchPatterns: string[];
  private fileStates: Map<string, string> = new Map();

  constructor(workspacePath: string = path.join(process.cwd(), 'workspace')) {
    super();
    this.workspacePath = workspacePath;
    this.watchPatterns = [
      '*/todo-spec.md',
      '*/phase-*.md',
      '*/*-implementation.md',
      '*/agent-todos/**/*.md'
    ];
  }

  async start(): Promise<void> {
    console.log('📁 Starting MD file watcher...');
    
    // Build watch paths
    const watchPaths = this.watchPatterns.map(pattern => 
      path.join(this.workspacePath, pattern)
    );

    // Initialize watcher
    this.watcher = chokidar.watch(watchPaths, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: {
        stabilityThreshold: 500,
        pollInterval: 100
      }
    });

    // Set up event handlers
    this.watcher
      .on('add', (filePath) => this.handleFileAdded(filePath))
      .on('change', (filePath) => this.handleFileChanged(filePath))
      .on('error', (error) => console.error('Watcher error:', error));

    console.log(`✅ Watching MD files in: ${this.workspacePath}`);
  }

  private async handleFileAdded(filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      this.fileStates.set(filePath, content);
      
      // Parse initial state
      const tasks = this.parseTasksFromContent(content, filePath);
      const projectId = this.extractProjectId(filePath);
      
      // Emit initial state for all tasks
      for (const task of tasks) {
        this.emit('task:found', {
          ...task,
          projectId,
          filePath
        });
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }

  private async handleFileChanged(filePath: string): Promise<void> {
    try {
      const newContent = await fs.readFile(filePath, 'utf-8');
      const oldContent = this.fileStates.get(filePath) || '';
      
      // Check if content actually changed
      if (newContent === oldContent) return;
      
      // Parse tasks from both versions
      const oldTasks = this.parseTasksFromContent(oldContent, filePath);
      const newTasks = this.parseTasksFromContent(newContent, filePath);
      
      // Find changes
      const changes = this.detectTaskChanges(oldTasks, newTasks, filePath);
      
      // Update stored state
      this.fileStates.set(filePath, newContent);
      
      // Emit changes
      for (const change of changes) {
        this.emit('task:changed', change);
      }
    } catch (error) {
      console.error(`Error processing file change ${filePath}:`, error);
    }
  }

  private parseTasksFromContent(content: string, filePath: string): Array<{
    id: string;
    description: string;
    isCompleted: boolean;
    line: number;
  }> {
    const tasks: Array<{
      id: string;
      description: string;
      isCompleted: boolean;
      line: number;
    }> = [];
    
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Match checkbox patterns: - [ ] or - [x] or - [X]
      const checkboxMatch = line.match(/^(\s*)[-*]\s*\[([ xX])\]\s*(.+)/);
      
      if (checkboxMatch) {
        const isCompleted = checkboxMatch[2].toLowerCase() === 'x';
        const description = checkboxMatch[3].trim();
        
        // Generate task ID from file path and line number
        const taskId = this.generateTaskId(filePath, i, description);
        
        tasks.push({
          id: taskId,
          description,
          isCompleted,
          line: i
        });
      }
    }
    
    return tasks;
  }

  private detectTaskChanges(
    oldTasks: Array<{ id: string; description: string; isCompleted: boolean; line: number }>,
    newTasks: Array<{ id: string; description: string; isCompleted: boolean; line: number }>,
    filePath: string
  ): TaskChange[] {
    const changes: TaskChange[] = [];
    const projectId = this.extractProjectId(filePath);
    const phase = this.extractPhase(filePath);
    const agent = this.extractAgent(filePath);
    
    // Create maps for easier comparison
    const oldTaskMap = new Map(oldTasks.map(t => [t.id, t]));
    const newTaskMap = new Map(newTasks.map(t => [t.id, t]));
    
    // Check for status changes
    for (const [taskId, newTask] of newTaskMap) {
      const oldTask = oldTaskMap.get(taskId);
      
      if (oldTask) {
        // Task exists in both - check if status changed
        if (oldTask.isCompleted !== newTask.isCompleted) {
          changes.push({
            projectId,
            filePath,
            taskId,
            taskDescription: newTask.description,
            isCompleted: newTask.isCompleted,
            phase,
            agent,
            timestamp: new Date()
          });
        }
      } else {
        // New task added
        changes.push({
          projectId,
          filePath,
          taskId,
          taskDescription: newTask.description,
          isCompleted: newTask.isCompleted,
          phase,
          agent,
          timestamp: new Date()
        });
      }
    }
    
    return changes;
  }

  private extractProjectId(filePath: string): string {
    // Extract project name from path: workspace/project-name/...
    const relativePath = path.relative(this.workspacePath, filePath);
    const parts = relativePath.split(path.sep);
    return parts[0] || 'unknown';
  }

  private extractPhase(filePath: string): string | undefined {
    // Extract phase from filename: phase-1-implementation.md
    const filename = path.basename(filePath);
    const phaseMatch = filename.match(/phase-(\d+)/i);
    return phaseMatch ? phaseMatch[1] : undefined;
  }

  private extractAgent(filePath: string): string | undefined {
    // Extract agent from path: agent-todos/frontend-specialist/...
    if (filePath.includes('agent-todos')) {
      const parts = filePath.split(path.sep);
      const agentIndex = parts.indexOf('agent-todos');
      if (agentIndex !== -1 && parts[agentIndex + 1]) {
        return parts[agentIndex + 1];
      }
    }
    
    // Try to extract from file content patterns
    const filename = path.basename(filePath);
    const agentPatterns = [
      'frontend',
      'backend',
      'database',
      'devops',
      'testing'
    ];
    
    for (const pattern of agentPatterns) {
      if (filename.toLowerCase().includes(pattern)) {
        return `${pattern}-specialist`;
      }
    }
    
    return undefined;
  }

  private generateTaskId(filePath: string, lineNumber: number, description: string): string {
    // Generate a stable ID based on file, line, and description
    const fileId = path.basename(filePath).replace(/[^a-zA-Z0-9]/g, '_');
    const descId = description.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_');
    return `${fileId}_L${lineNumber}_${descId}`;
  }

  async watchProject(projectPath: string): Promise<void> {
    // Stop existing watcher if running
    await this.stop();
    
    // Start watching the specific project
    console.log(`🔍 Starting to watch project: ${projectPath}`);
    
    const watchPatterns = this.watchPatterns.map(pattern => 
      path.join(projectPath, pattern)
    );
    
    this.watcher = chokidar.watch(watchPatterns, {
      ignored: /node_modules/,
      persistent: true,
      ignoreInitial: false
    });

    this.watcher
      .on('change', (filePath) => this.handleFileChanged(filePath))
      .on('add', (filePath) => this.handleFileChanged(filePath))
      .on('error', (error) => console.error('Watcher error:', error))
      .on('ready', () => console.log('✅ Project watcher ready'));
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      this.fileStates.clear();
      console.log('🛑 MD file watcher stopped');
    }
  }

  // Get current state of all tasks in a project
  async getProjectTasks(projectId: string): Promise<TaskChange[]> {
    const tasks: TaskChange[] = [];
    const projectPath = path.join(this.workspacePath, projectId);
    
    if (!await fs.pathExists(projectPath)) {
      return tasks;
    }
    
    // Find all MD files in project
    const patterns = [
      'todo-spec.md',
      'phase-*.md',
      '*-implementation.md',
      'agent-todos/**/*.md'
    ];
    
    for (const pattern of patterns) {
      const files = await this.findFiles(projectPath, pattern);
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const fileTasks = this.parseTasksFromContent(content, file);
        
        for (const task of fileTasks) {
          tasks.push({
            projectId,
            filePath: file,
            taskId: task.id,
            taskDescription: task.description,
            isCompleted: task.isCompleted,
            phase: this.extractPhase(file),
            agent: this.extractAgent(file),
            timestamp: new Date()
          });
        }
      }
    }
    
    return tasks;
  }

  private async findFiles(directory: string, _pattern: string): Promise<string[]> {
    // Simple file finder - pattern parameter kept for future use
    const files: string[] = [];
    
    // This is a simplified implementation
    // In production, you'd want to use a proper glob library
    try {
      const items = await fs.readdir(directory);
      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isFile() && item.endsWith('.md')) {
          files.push(fullPath);
        } else if (stat.isDirectory() && item === 'agent-todos') {
          // Recursively search agent-todos directory
          const agentFiles = await this.findFilesRecursive(fullPath, '.md');
          files.push(...agentFiles);
        }
      }
    } catch (error) {
      console.error(`Error finding files in ${directory}:`, error);
    }
    
    return files;
  }

  private async findFilesRecursive(directory: string, extension: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const items = await fs.readdir(directory);
      
      for (const item of items) {
        const fullPath = path.join(directory, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isFile() && item.endsWith(extension)) {
          files.push(fullPath);
        } else if (stat.isDirectory()) {
          const subFiles = await this.findFilesRecursive(fullPath, extension);
          files.push(...subFiles);
        }
      }
    } catch (error) {
      console.error(`Error in recursive search ${directory}:`, error);
    }
    
    return files;
  }
}