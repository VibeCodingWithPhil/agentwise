import * as fs from 'fs-extra';
import * as path from 'path';

export class ProjectManager {
  async getCurrentProject(): Promise<string | null> {
    // Stub implementation - returns active project from registry
    return null;
  }

  async createProject(name: string, config: any): Promise<string> {
    const projectPath = path.join(process.cwd(), 'workspace', name);
    
    // Create project directory
    await fs.ensureDir(projectPath);
    
    // Create basic project structure
    await fs.ensureDir(path.join(projectPath, 'specs'));
    await fs.ensureDir(path.join(projectPath, 'agent-todos'));
    
    // Save project config
    await fs.writeJson(
      path.join(projectPath, 'project.json'),
      {
        name,
        createdAt: new Date().toISOString(),
        ...config
      },
      { spaces: 2 }
    );
    
    return projectPath;
  }
}