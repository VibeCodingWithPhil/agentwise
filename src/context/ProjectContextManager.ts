import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';
import { exec } from 'child_process';

export interface ProjectContext {
  projectName: string;
  projectPath: string;
  activatedAt: Date;
  lastActivity: Date;
  isActive: boolean;
  metadata: {
    framework?: string;
    language?: string;
    phase?: number;
    agents?: string[];
  };
}

export class ProjectContextManager extends EventEmitter {
  private contextFile: string;
  private activeContext: ProjectContext | null = null;
  private autoActivate: boolean = true;

  constructor() {
    super();
    this.contextFile = path.join(process.cwd(), '.agentwise-context.json');
    this.loadContext();
  }

  /**
   * Load persisted context from file
   */
  private async loadContext(): Promise<void> {
    try {
      if (await fs.pathExists(this.contextFile)) {
        const data = await fs.readJSON(this.contextFile);
        
        // Check if context is still valid (not older than 24 hours)
        const lastActivity = new Date(data.lastActivity);
        const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceActivity < 24) {
          this.activeContext = {
            ...data,
            activatedAt: new Date(data.activatedAt),
            lastActivity: new Date(data.lastActivity)
          };
          
          // Verify project still exists
          if (await fs.pathExists(this.activeContext.projectPath)) {
            console.log(`✅ Restored context for project: ${this.activeContext.projectName}`);
            this.emit('contextRestored', this.activeContext);
          } else {
            console.log('⚠️  Project no longer exists, clearing context');
            await this.clearContext();
          }
        } else {
          console.log('⚠️  Context expired, clearing');
          await this.clearContext();
        }
      }
    } catch (error) {
      console.error('Error loading context:', error);
    }
  }

  /**
   * Save context to file
   */
  private async saveContext(): Promise<void> {
    if (this.activeContext) {
      try {
        await fs.writeJSON(this.contextFile, this.activeContext, { spaces: 2 });
      } catch (error) {
        console.error('Error saving context:', error);
      }
    }
  }

  /**
   * Activate a project context
   */
  async activateProject(projectName: string, projectPath?: string): Promise<void> {
    const resolvedPath = projectPath || path.join(process.cwd(), 'workspace', projectName);
    
    if (!await fs.pathExists(resolvedPath)) {
      throw new Error(`Project not found: ${projectName}`);
    }

    // Load project metadata
    const metadata = await this.loadProjectMetadata(resolvedPath);

    this.activeContext = {
      projectName,
      projectPath: resolvedPath,
      activatedAt: new Date(),
      lastActivity: new Date(),
      isActive: true,
      metadata
    };

    await this.saveContext();
    
    // Set environment variable for child processes
    process.env.AGENTWISE_ACTIVE_PROJECT = projectName;
    process.env.AGENTWISE_PROJECT_PATH = resolvedPath;
    
    console.log(`✅ Activated project: ${projectName}`);
    
    // Auto-launch monitor dashboard if not running
    this.launchMonitor();
    
    this.emit('projectActivated', this.activeContext);
  }

  /**
   * Load project metadata
   */
  private async loadProjectMetadata(projectPath: string): Promise<any> {
    const metadata: any = {};

    // Check package.json for framework info
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJSON(packageJsonPath);
      
      if (pkg.dependencies?.react) metadata.framework = 'react';
      else if (pkg.dependencies?.vue) metadata.framework = 'vue';
      else if (pkg.dependencies?.['@angular/core']) metadata.framework = 'angular';
      else if (pkg.dependencies?.next) metadata.framework = 'nextjs';
      
      metadata.language = 'javascript';
      if (pkg.devDependencies?.typescript) metadata.language = 'typescript';
    }

    // Check for project context file
    const contextPath = path.join(projectPath, 'project-context.md');
    if (await fs.pathExists(contextPath)) {
      const content = await fs.readFile(contextPath, 'utf-8');
      const phaseMatch = content.match(/Phase:\s*(\d+)/i);
      if (phaseMatch) {
        metadata.phase = parseInt(phaseMatch[1], 10);
      }
    }

    // Check for active agents
    const agentTodoPath = path.join(projectPath, 'agent-todos');
    if (await fs.pathExists(agentTodoPath)) {
      const agentDirs = await fs.readdir(agentTodoPath);
      metadata.agents = agentDirs.filter(d => !d.startsWith('.'));
    }

    return metadata;
  }

  /**
   * Get active project context
   */
  getActiveProject(): ProjectContext | null {
    if (this.activeContext) {
      // Update last activity
      this.activeContext.lastActivity = new Date();
      this.saveContext();
    }
    return this.activeContext;
  }

  /**
   * Check if a project is active
   */
  isProjectActive(projectName: string): boolean {
    return this.activeContext?.projectName === projectName && this.activeContext.isActive;
  }

  /**
   * Deactivate current project
   */
  async deactivateProject(): Promise<void> {
    if (this.activeContext) {
      this.activeContext.isActive = false;
      await this.saveContext();
      
      delete process.env.AGENTWISE_ACTIVE_PROJECT;
      delete process.env.AGENTWISE_PROJECT_PATH;
      
      console.log(`✅ Deactivated project: ${this.activeContext.projectName}`);
      this.emit('projectDeactivated', this.activeContext);
      
      this.activeContext = null;
    }
  }

  /**
   * Clear all context
   */
  async clearContext(): Promise<void> {
    this.activeContext = null;
    
    try {
      if (await fs.pathExists(this.contextFile)) {
        await fs.remove(this.contextFile);
      }
    } catch (error) {
      console.error('Error clearing context:', error);
    }
    
    delete process.env.AGENTWISE_ACTIVE_PROJECT;
    delete process.env.AGENTWISE_PROJECT_PATH;
  }

  /**
   * Auto-activate project when commands are run
   */
  async autoActivateForCommand(command: string, args?: string[]): Promise<ProjectContext | null> {
    if (!this.autoActivate) return this.activeContext;

    // Check if command implies a project
    if (command === 'create' && args?.[0]) {
      const projectName = this.extractProjectName(args[0]);
      await this.activateProject(projectName);
      return this.activeContext;
    }

    if (command === 'task' && !this.activeContext) {
      // Try to find most recent project
      const recentProject = await this.findMostRecentProject();
      if (recentProject) {
        await this.activateProject(recentProject.name, recentProject.path);
        return this.activeContext;
      }
    }

    if (command.startsWith('task-')) {
      const projectName = command.substring(5);
      await this.activateProject(projectName);
      return this.activeContext;
    }

    return this.activeContext;
  }

  /**
   * Extract project name from command argument
   */
  private extractProjectName(arg: string): string {
    const nameMatch = arg.match(/(?:called|named|project)\s+["']?(\w+)["']?/i);
    if (nameMatch) {
      return nameMatch[1].toLowerCase();
    }
    
    const words = arg.split(' ').slice(0, 3);
    return words.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Find most recently modified project
   */
  private async findMostRecentProject(): Promise<{ name: string; path: string } | null> {
    const workspacePath = path.join(process.cwd(), 'workspace');
    
    try {
      if (!await fs.pathExists(workspacePath)) {
        return null;
      }

      const projects = await fs.readdir(workspacePath);
      let mostRecent: { name: string; path: string; mtime: Date } | null = null;

      for (const project of projects) {
        const projectPath = path.join(workspacePath, project);
        const stats = await fs.stat(projectPath);
        
        if (stats.isDirectory()) {
          if (!mostRecent || stats.mtime > mostRecent.mtime) {
            mostRecent = {
              name: project,
              path: projectPath,
              mtime: stats.mtime
            };
          }
        }
      }

      return mostRecent ? { name: mostRecent.name, path: mostRecent.path } : null;
    } catch (error) {
      console.error('Error finding recent project:', error);
      return null;
    }
  }

  /**
   * Update project metadata
   */
  async updateMetadata(updates: Partial<ProjectContext['metadata']>): Promise<void> {
    if (this.activeContext) {
      this.activeContext.metadata = {
        ...this.activeContext.metadata,
        ...updates
      };
      this.activeContext.lastActivity = new Date();
      await this.saveContext();
    }
  }

  /**
   * Get context for display
   */
  getContextSummary(): string {
    if (!this.activeContext) {
      return 'No active project';
    }

    const { projectName, metadata, lastActivity } = this.activeContext;
    const timeSinceActivity = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60));
    
    return `
Active Project: ${projectName}
Framework: ${metadata.framework || 'unknown'}
Language: ${metadata.language || 'unknown'}
Phase: ${metadata.phase || 1}
Agents: ${metadata.agents?.join(', ') || 'none'}
Last Activity: ${timeSinceActivity} minutes ago
    `.trim();
  }

  /**
   * Enable/disable auto-activation
   */
  setAutoActivate(enabled: boolean): void {
    this.autoActivate = enabled;
  }

  /**
   * Launch monitor dashboard if not already running
   */
  private launchMonitor(): void {
    const monitorPath = path.join(__dirname, '../monitor');
    
    // Check if monitor servers are already running
    exec('lsof -ti:3001,3002', (error, stdout) => {
      if (!stdout || stdout.trim() === '') {
        // Not running, start the monitor
        console.log('📊 Launching Agentwise Monitor...');
        exec(`cd ${monitorPath} && ./start.sh > /dev/null 2>&1 &`, (error) => {
          if (!error) {
            console.log('📊 Monitor dashboard launching at: http://localhost:3001');
            
            // Open in browser after a short delay
            setTimeout(() => {
              exec('open http://localhost:3001');
            }, 3000);
          }
        });
      } else {
        console.log('📊 Monitor dashboard already running at: http://localhost:3001');
      }
    });
  }
}