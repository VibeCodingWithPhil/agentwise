import * as fs from 'fs-extra';
import * as path from 'path';

export interface Project {
  id: string;
  name: string;
  idea: string;
  path: string;
  created: string;
  modified: string;
  status: 'initializing' | 'active' | 'completed' | 'archived' | 'imported';
  activeProject?: boolean;
  technologies?: string[];
  phases?: {
    current: number;
    total: number;
    completed: number[];
  };
  metrics?: {
    tokensUsed?: number;
    tasksCompleted?: number;
    tasksTotal?: number;
  };
}

export interface Registry {
  projects: Project[];
  activeProjectId?: string;
  lastUpdated: string;
}

export class ProjectRegistry {
  private registryPath: string;
  private registry: Registry;

  constructor() {
    // Store registry in workspace/.registry folder
    const workspaceRegistryPath = path.join(process.cwd(), 'workspace', '.registry');
    fs.ensureDirSync(workspaceRegistryPath);
    this.registryPath = path.join(workspaceRegistryPath, 'projects.json');
    this.registry = { projects: [], lastUpdated: new Date().toISOString() };
  }

  async load(): Promise<void> {
    try {
      await fs.ensureFile(this.registryPath);
      const data = await fs.readFile(this.registryPath, 'utf-8');
      if (data.trim()) {
        this.registry = JSON.parse(data);
      }
    } catch (error) {
      console.error('Failed to load project registry:', error);
      this.registry = { projects: [], lastUpdated: new Date().toISOString() };
    }
  }

  async save(): Promise<void> {
    try {
      this.registry.lastUpdated = new Date().toISOString();
      await fs.writeJson(this.registryPath, this.registry, { spaces: 2 });
    } catch (error) {
      console.error('Failed to save project registry:', error);
    }
  }

  async addProject(project: Omit<Project, 'modified'>): Promise<Project> {
    await this.load();
    
    const newProject: Project = {
      ...project,
      modified: new Date().toISOString()
    };
    
    this.registry.projects.push(newProject);
    
    // Set as active if it's the only project
    if (this.registry.projects.length === 1) {
      this.registry.activeProjectId = newProject.id;
      newProject.activeProject = true;
    }
    
    await this.save();
    return newProject;
  }

  async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    await this.load();
    
    const projectIndex = this.registry.projects.findIndex(p => p.id === projectId);
    if (projectIndex === -1) {
      return null;
    }
    
    this.registry.projects[projectIndex] = {
      ...this.registry.projects[projectIndex],
      ...updates,
      modified: new Date().toISOString()
    };
    
    await this.save();
    return this.registry.projects[projectIndex];
  }

  async getProject(projectId: string): Promise<Project | null> {
    await this.load();
    return this.registry.projects.find(p => p.id === projectId) || null;
  }

  async getActiveProject(): Promise<Project | null> {
    await this.load();
    
    if (this.registry.activeProjectId) {
      return this.registry.projects.find(p => p.id === this.registry.activeProjectId) || null;
    }
    
    // Return first project if no active project set
    return this.registry.projects[0] || null;
  }

  async setActiveProject(projectId: string): Promise<boolean> {
    await this.load();
    
    const project = this.registry.projects.find(p => p.id === projectId);
    if (!project) {
      return false;
    }
    
    // Clear previous active project
    this.registry.projects.forEach(p => {
      p.activeProject = false;
    });
    
    // Set new active project
    project.activeProject = true;
    this.registry.activeProjectId = projectId;
    
    await this.save();
    return true;
  }

  async listProjects(): Promise<Project[]> {
    await this.load();
    return this.registry.projects;
  }

  async deleteProject(projectId: string): Promise<boolean> {
    await this.load();
    
    const initialLength = this.registry.projects.length;
    this.registry.projects = this.registry.projects.filter(p => p.id !== projectId);
    
    if (this.registry.activeProjectId === projectId) {
      this.registry.activeProjectId = undefined;
      // Set first remaining project as active
      if (this.registry.projects.length > 0) {
        this.registry.projects[0].activeProject = true;
        this.registry.activeProjectId = this.registry.projects[0].id;
      }
    }
    
    await this.save();
    return this.registry.projects.length < initialLength;
  }

  async getProjectStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    imported: number;
  }> {
    await this.load();
    
    return {
      total: this.registry.projects.length,
      active: this.registry.projects.filter(p => p.status === 'active').length,
      completed: this.registry.projects.filter(p => p.status === 'completed').length,
      imported: this.registry.projects.filter(p => p.status === 'imported').length
    };
  }

  async updateProjectMetrics(
    projectId: string, 
    metrics: Partial<Project['metrics']>
  ): Promise<void> {
    await this.load();
    
    const project = this.registry.projects.find(p => p.id === projectId);
    if (project) {
      project.metrics = {
        ...project.metrics,
        ...metrics
      };
      project.modified = new Date().toISOString();
      await this.save();
    }
  }

  async updateProjectPhases(
    projectId: string,
    phases: Partial<Project['phases']>
  ): Promise<void> {
    await this.load();
    
    const project = this.registry.projects.find(p => p.id === projectId);
    if (project) {
      project.phases = {
        ...project.phases,
        ...phases
      } as Project['phases'];
      project.modified = new Date().toISOString();
      await this.save();
    }
  }
}