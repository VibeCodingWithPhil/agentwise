/**
 * Project Registry Sync - Ensures registry stays synchronized with workspace
 * Validates projects exist, detects renames, and cleans up stale entries
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { ProjectRegistry, Project } from './ProjectRegistry';

export class ProjectRegistrySync {
  private registry: ProjectRegistry;
  private workspacePath: string;

  constructor() {
    this.registry = new ProjectRegistry();
    this.workspacePath = path.join(process.cwd(), 'workspace');
  }

  /**
   * Sync registry with workspace - main entry point
   */
  async syncRegistry(): Promise<{
    added: string[];
    removed: string[];
    renamed: Array<{ old: string; new: string }>;
    validated: string[];
  }> {
    console.log('🔄 Syncing project registry with workspace...');
    
    const result = {
      added: [] as string[],
      removed: [] as string[],
      renamed: [] as Array<{ old: string; new: string }>,
      validated: [] as string[]
    };

    // Ensure workspace exists
    await fs.ensureDir(this.workspacePath);

    // Get all projects from registry
    const registeredProjects = await this.registry.listProjects();
    
    // Get all actual project folders in workspace
    const workspaceFolders = await this.getWorkspaceProjects();

    // 1. Check for removed or renamed projects
    for (const project of registeredProjects) {
      const projectPath = path.join(this.workspacePath, project.id);
      
      if (!await fs.pathExists(projectPath)) {
        // Project folder doesn't exist - check if renamed
        const renamedTo = await this.detectRenamedProject(project, workspaceFolders);
        
        if (renamedTo) {
          // Project was renamed
          result.renamed.push({ old: project.id, new: renamedTo });
          await this.handleRenamedProject(project, renamedTo);
        } else {
          // Project was deleted
          result.removed.push(project.id);
          await this.registry.deleteProject(project.id);
          console.log(`  ❌ Removed deleted project: ${project.id}`);
        }
      } else {
        // Project exists - validate its contents
        const isValid = await this.validateProjectIntegrity(project);
        if (isValid) {
          result.validated.push(project.id);
        } else {
          // Try to repair project
          await this.repairProject(project);
        }
      }
    }

    // 2. Check for new projects not in registry
    const registeredIds = registeredProjects.map(p => p.id);
    for (const folder of workspaceFolders) {
      if (!registeredIds.includes(folder)) {
        // New project found
        const projectInfo = await this.detectProjectInfo(folder);
        if (projectInfo) {
          await this.registry.addProject(projectInfo);
          result.added.push(folder);
          console.log(`  ✅ Added new project: ${folder}`);
        }
      }
    }

    // 3. Update project metadata
    await this.updateAllProjectMetadata();

    // 4. Save updated registry
    await this.registry.save();

    console.log(`✅ Registry sync complete:
  - Validated: ${result.validated.length} projects
  - Added: ${result.added.length} new projects
  - Removed: ${result.removed.length} deleted projects
  - Renamed: ${result.renamed.length} renamed projects`);

    return result;
  }

  /**
   * Get all project folders in workspace
   */
  private async getWorkspaceProjects(): Promise<string[]> {
    try {
      const items = await fs.readdir(this.workspacePath);
      const projects: string[] = [];

      for (const item of items) {
        const itemPath = path.join(this.workspacePath, item);
        const stat = await fs.stat(itemPath);
        
        if (stat.isDirectory()) {
          // Check if it's a valid project folder
          const hasProjectFiles = await this.hasProjectFiles(itemPath);
          if (hasProjectFiles) {
            projects.push(item);
          }
        }
      }

      return projects;
    } catch (error) {
      console.error('Error reading workspace:', error);
      return [];
    }
  }

  /**
   * Check if folder has project files
   */
  private async hasProjectFiles(projectPath: string): Promise<boolean> {
    // Check for key project files
    const requiredFiles = [
      'project-context.md',
      'todo-spec.md'
    ];

    const optionalIndicators = [
      'agent-todos',
      'specs',
      'src',
      'package.json'
    ];

    // Must have at least one required file
    for (const file of requiredFiles) {
      if (await fs.pathExists(path.join(projectPath, file))) {
        return true;
      }
    }

    // Or have multiple optional indicators
    let indicatorCount = 0;
    for (const indicator of optionalIndicators) {
      if (await fs.pathExists(path.join(projectPath, indicator))) {
        indicatorCount++;
      }
    }

    return indicatorCount >= 2;
  }

  /**
   * Detect if a project was renamed by comparing content signatures
   */
  private async detectRenamedProject(
    project: Project, 
    workspaceFolders: string[]
  ): Promise<string | null> {
    // Look for folders with similar content
    for (const folder of workspaceFolders) {
      const folderPath = path.join(this.workspacePath, folder);
      
      // Check if project-context.md contains similar content
      const contextPath = path.join(folderPath, 'project-context.md');
      if (await fs.pathExists(contextPath)) {
        const content = await fs.readFile(contextPath, 'utf-8');
        
        // Check if content matches project idea or name
        if (content.includes(project.idea) || 
            content.includes(project.name) ||
            this.calculateSimilarity(content, project.idea) > 0.7) {
          return folder;
        }
      }
    }

    return null;
  }

  /**
   * Calculate string similarity (simple implementation)
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * Handle renamed project
   */
  private async handleRenamedProject(project: Project, newId: string): Promise<void> {
    console.log(`  🔄 Project renamed: ${project.id} → ${newId}`);
    
    // Update project ID and path
    await this.registry.updateProject(project.id, {
      id: newId,
      path: path.join(this.workspacePath, newId)
    });
  }

  /**
   * Validate project integrity
   */
  private async validateProjectIntegrity(project: Project): Promise<boolean> {
    const projectPath = path.join(this.workspacePath, project.id);
    
    // Check essential files exist
    const essentialFiles = ['project-context.md'];
    
    for (const file of essentialFiles) {
      if (!await fs.pathExists(path.join(projectPath, file))) {
        console.log(`  ⚠️ Project ${project.id} missing ${file}`);
        return false;
      }
    }

    // Validate project-context.md isn't empty
    const contextPath = path.join(projectPath, 'project-context.md');
    const content = await fs.readFile(contextPath, 'utf-8');
    if (content.trim().length < 10) {
      console.log(`  ⚠️ Project ${project.id} has empty context`);
      return false;
    }

    return true;
  }

  /**
   * Repair project with missing files
   */
  private async repairProject(project: Project): Promise<void> {
    console.log(`  🔧 Repairing project: ${project.id}`);
    const projectPath = path.join(this.workspacePath, project.id);

    // Ensure project-context.md exists
    const contextPath = path.join(projectPath, 'project-context.md');
    if (!await fs.pathExists(contextPath)) {
      await fs.writeFile(contextPath, `# ${project.name}

## Project Idea
${project.idea}

## Status
${project.status}

## Created
${project.created}

## Technologies
${project.technologies?.join(', ') || 'Not specified'}
`);
    }

    // Ensure todo-spec.md exists
    const todoPath = path.join(projectPath, 'todo-spec.md');
    if (!await fs.pathExists(todoPath)) {
      await fs.writeFile(todoPath, `# Todo Specification - ${project.name}

## Pending Tasks
- [ ] Project setup

## Completed Tasks
- [x] Project initialized
`);
    }
  }

  /**
   * Detect project info from folder
   */
  private async detectProjectInfo(folderId: string): Promise<Omit<Project, 'modified'> | null> {
    const projectPath = path.join(this.workspacePath, folderId);
    
    try {
      // Try to read project-context.md
      const contextPath = path.join(projectPath, 'project-context.md');
      let name = folderId;
      let idea = 'Imported project';
      
      if (await fs.pathExists(contextPath)) {
        const content = await fs.readFile(contextPath, 'utf-8');
        
        // Extract project name from first heading
        const nameMatch = content.match(/^#\s+(.+)$/m);
        if (nameMatch) {
          name = nameMatch[1];
        }
        
        // Extract idea from content
        const ideaMatch = content.match(/##\s+Project Idea\s+([\s\S]+?)(?=##|$)/);
        if (ideaMatch) {
          idea = ideaMatch[1].trim();
        }
      }

      // Get folder stats for creation date
      const stats = await fs.stat(projectPath);

      return {
        id: folderId,
        name,
        idea,
        path: projectPath,
        created: stats.birthtime.toISOString(),
        status: 'active'
      };
    } catch (error) {
      console.error(`Failed to detect project info for ${folderId}:`, error);
      return null;
    }
  }

  /**
   * Update metadata for all projects
   */
  private async updateAllProjectMetadata(): Promise<void> {
    const projects = await this.registry.listProjects();
    
    for (const project of projects) {
      const projectPath = path.join(this.workspacePath, project.id);
      
      if (await fs.pathExists(projectPath)) {
        // Update modified time based on folder
        // const stats = await fs.stat(projectPath);
        
        // Count tasks in todo-spec.md
        const todoPath = path.join(projectPath, 'todo-spec.md');
        if (await fs.pathExists(todoPath)) {
          const content = await fs.readFile(todoPath, 'utf-8');
          const completedTasks = (content.match(/\[x\]/gi) || []).length;
          const totalTasks = (content.match(/\[[ x]\]/gi) || []).length;
          
          await this.registry.updateProjectMetrics(project.id, {
            tasksCompleted: completedTasks,
            tasksTotal: totalTasks
          });
        }
        
        // Update phases if phase files exist
        const agentTodoPath = path.join(projectPath, 'agent-todos');
        if (await fs.pathExists(agentTodoPath)) {
          const phases = await this.detectProjectPhases(agentTodoPath);
          if (phases) {
            await this.registry.updateProjectPhases(project.id, phases);
          }
        }
      }
    }
  }

  /**
   * Detect project phases from agent-todos folder
   */
  private async detectProjectPhases(agentTodoPath: string): Promise<Project['phases'] | null> {
    try {
      const agents = await fs.readdir(agentTodoPath);
      let maxPhase = 1;
      const completedPhases = new Set<number>();

      for (const agent of agents) {
        const agentPath = path.join(agentTodoPath, agent);
        if ((await fs.stat(agentPath)).isDirectory()) {
          const files = await fs.readdir(agentPath);
          
          for (const file of files) {
            const phaseMatch = file.match(/phase-(\d+)\.md$/);
            if (phaseMatch) {
              const phase = parseInt(phaseMatch[1]);
              maxPhase = Math.max(maxPhase, phase);
              
              // Check if phase is completed
              const content = await fs.readFile(path.join(agentPath, file), 'utf-8');
              const tasks = content.match(/\[[ x]\]/g) || [];
              const completed = content.match(/\[x\]/g) || [];
              
              if (tasks.length > 0 && tasks.length === completed.length) {
                completedPhases.add(phase);
              }
            }
          }
        }
      }

      return {
        current: Math.max(...Array.from(completedPhases), 0) + 1,
        total: maxPhase,
        completed: Array.from(completedPhases)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Clean up orphaned registry entries
   */
  async cleanOrphanedEntries(): Promise<number> {
    const projects = await this.registry.listProjects();
    let removed = 0;

    for (const project of projects) {
      const projectPath = path.join(this.workspacePath, project.id);
      if (!await fs.pathExists(projectPath)) {
        await this.registry.deleteProject(project.id);
        removed++;
        console.log(`  🧹 Cleaned orphaned entry: ${project.id}`);
      }
    }

    return removed;
  }

  /**
   * Validate single project
   */
  async validateProject(projectId: string): Promise<boolean> {
    const project = await this.registry.getProject(projectId);
    if (!project) return false;

    const projectPath = path.join(this.workspacePath, projectId);
    if (!await fs.pathExists(projectPath)) {
      await this.registry.deleteProject(projectId);
      return false;
    }

    return await this.validateProjectIntegrity(project);
  }
}