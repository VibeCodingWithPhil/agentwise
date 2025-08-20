/**
 * Task Completion Detector - Automatically detects when tasks are completed
 * and updates phase files accordingly
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { MDTaskUpdater } from './MDTaskUpdater';

export interface TaskMatch {
  description: string;
  evidence: string[];
  confidence: number;
  lineNumber: number;
}

export interface CompletionResult {
  agent: string;
  phase: number;
  tasksCompleted: number;
  totalTasks: number;
  completedTasks: TaskMatch[];
}

export class TaskCompletionDetector {
  private mdTaskUpdater: MDTaskUpdater;
  private workspacePath: string;

  constructor(workspacePath: string) {
    this.workspacePath = workspacePath;
    this.mdTaskUpdater = new MDTaskUpdater();
  }

  /**
   * Scan project for completed tasks and update phase files
   */
  async scanAndUpdateCompletedTasks(projectPath: string): Promise<CompletionResult[]> {
    const results: CompletionResult[] = [];
    const agentTodosPath = path.join(projectPath, 'agent-todos');

    if (!await fs.pathExists(agentTodosPath)) {
      console.warn('No agent-todos directory found');
      return results;
    }

    const agents = await fs.readdir(agentTodosPath);

    for (const agent of agents) {
      const agentPath = path.join(agentTodosPath, agent);
      const stats = await fs.stat(agentPath);

      if (stats.isDirectory()) {
        const agentResults = await this.scanAgentTasks(agent, agentPath, projectPath);
        results.push(...agentResults);
      }
    }

    return results;
  }

  /**
   * Scan tasks for a specific agent
   */
  private async scanAgentTasks(agent: string, agentPath: string, projectPath: string): Promise<CompletionResult[]> {
    const results: CompletionResult[] = [];
    const phaseFiles = await this.findPhaseFiles(agentPath);

    for (const phaseFile of phaseFiles) {
      const phase = this.extractPhaseNumber(phaseFile);
      const result = await this.scanPhaseFile(agent, phase, phaseFile, projectPath);
      if (result.tasksCompleted > 0) {
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Scan a specific phase file for completed tasks
   */
  private async scanPhaseFile(agent: string, phase: number, phaseFile: string, projectPath: string): Promise<CompletionResult> {
    const content = await fs.readFile(phaseFile, 'utf-8');
    const lines = content.split('\n');
    const completedTasks: TaskMatch[] = [];
    let totalTasks = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const taskMatch = line.match(/^(\s*)[-*]\s*\[\s*\]\s*(.+)/);

      if (taskMatch) {
        totalTasks++;
        const taskDescription = taskMatch[2].trim();
        
        // Check if this task is actually completed in the project
        const completion = await this.detectTaskCompletion(taskDescription, agent, projectPath);
        
        if (completion.confidence > 0.7) { // 70% confidence threshold
          completedTasks.push({
            description: taskDescription,
            evidence: completion.evidence,
            confidence: completion.confidence,
            lineNumber: i
          });
        }
      }
    }

    // Update the phase file if we found completed tasks
    if (completedTasks.length > 0) {
      await this.updatePhaseFile(phaseFile, completedTasks);
    }

    return {
      agent,
      phase,
      tasksCompleted: completedTasks.length,
      totalTasks,
      completedTasks
    };
  }

  /**
   * Detect if a task is completed based on project evidence
   */
  private async detectTaskCompletion(taskDescription: string, agent: string, projectPath: string): Promise<{
    confidence: number;
    evidence: string[];
  }> {
    const evidence: string[] = [];
    let confidence = 0;

    // Define task completion patterns
    const completionChecks = [
      // Frontend tasks
      {
        pattern: /react.*project|initialize.*react|vite/i,
        check: async () => {
          const packageJson = path.join(projectPath, 'package.json');
          if (await fs.pathExists(packageJson)) {
            const pkg = await fs.readJson(packageJson);
            if (pkg.dependencies?.react || pkg.devDependencies?.vite) {
              evidence.push('package.json contains React/Vite dependencies');
              return 0.9;
            }
          }
          return 0;
        }
      },
      {
        pattern: /typescript.*config|configure.*typescript/i,
        check: async () => {
          const tsconfig = path.join(projectPath, 'tsconfig.json');
          if (await fs.pathExists(tsconfig)) {
            evidence.push('tsconfig.json exists');
            return 0.9;
          }
          return 0;
        }
      },
      {
        pattern: /tailwind.*css|setup.*tailwind/i,
        check: async () => {
          const tailwindConfig = path.join(projectPath, 'tailwind.config.js');
          const packageJson = path.join(projectPath, 'package.json');
          if (await fs.pathExists(tailwindConfig) || 
              (await fs.pathExists(packageJson) && 
               (await fs.readJson(packageJson)).devDependencies?.tailwindcss)) {
            evidence.push('Tailwind CSS configured');
            return 0.9;
          }
          return 0;
        }
      },
      {
        pattern: /eslint.*config|configure.*eslint/i,
        check: async () => {
          const eslintConfig = path.join(projectPath, 'eslint.config.js');
          const eslintRc = path.join(projectPath, '.eslintrc.js');
          if (await fs.pathExists(eslintConfig) || await fs.pathExists(eslintRc)) {
            evidence.push('ESLint configuration found');
            return 0.9;
          }
          return 0;
        }
      },
      {
        pattern: /prettier.*config|setup.*prettier/i,
        check: async () => {
          const prettierRc = path.join(projectPath, '.prettierrc');
          const packageJson = path.join(projectPath, 'package.json');
          if (await fs.pathExists(prettierRc) || 
              (await fs.pathExists(packageJson) && 
               (await fs.readJson(packageJson)).devDependencies?.prettier)) {
            evidence.push('Prettier configuration found');
            return 0.9;
          }
          return 0;
        }
      },
      {
        pattern: /project.*structure|setup.*structure|create.*folders/i,
        check: async () => {
          const srcDir = path.join(projectPath, 'src');
          const componentsDir = path.join(projectPath, 'src', 'components');
          if (await fs.pathExists(srcDir)) {
            evidence.push('src directory structure exists');
            return await fs.pathExists(componentsDir) ? 0.9 : 0.7;
          }
          return 0;
        }
      },
      // Testing tasks
      {
        pattern: /vitest|testing.*library|test.*setup/i,
        check: async () => {
          const packageJson = path.join(projectPath, 'package.json');
          if (await fs.pathExists(packageJson)) {
            const pkg = await fs.readJson(packageJson);
            if (pkg.devDependencies?.vitest || pkg.devDependencies?.['@testing-library/react']) {
              evidence.push('Testing dependencies installed');
              return 0.9;
            }
          }
          return 0;
        }
      },
      // Generic file existence checks
      {
        pattern: /create.*component|base.*component/i,
        check: async () => {
          const srcDir = path.join(projectPath, 'src');
          const componentsDir = path.join(projectPath, 'src', 'components');
          if (await fs.pathExists(componentsDir)) {
            const files = await fs.readdir(componentsDir);
            if (files.length > 0) {
              evidence.push(`Components directory has ${files.length} files`);
              return 0.8;
            }
          }
          return 0;
        }
      }
    ];

    // Run completion checks
    for (const check of completionChecks) {
      if (check.pattern.test(taskDescription)) {
        try {
          const checkConfidence = await check.check();
          confidence = Math.max(confidence, checkConfidence);
        } catch (error) {
          // Ignore check errors
        }
      }
    }

    // Additional generic checks
    if (confidence < 0.5) {
      // Check for general file creation based on task description
      const genericConfidence = await this.checkGenericCompletion(taskDescription, projectPath);
      confidence = Math.max(confidence, genericConfidence.confidence);
      evidence.push(...genericConfidence.evidence);
    }

    return { confidence, evidence };
  }

  /**
   * Generic completion detection based on keywords
   */
  private async checkGenericCompletion(taskDescription: string, projectPath: string): Promise<{
    confidence: number;
    evidence: string[];
  }> {
    const evidence: string[] = [];
    let confidence = 0;

    // Extract potential file/folder names from task description
    const keywords = taskDescription.toLowerCase().match(/\b\w+\.(js|ts|jsx|tsx|json|md|css|scss)\b/g) || [];
    const folderKeywords = taskDescription.toLowerCase().match(/\b(components?|utils?|hooks?|types?|styles?|assets?)\b/g) || [];

    // Check for file existence
    for (const keyword of keywords) {
      const filePath = path.join(projectPath, keyword);
      const srcFilePath = path.join(projectPath, 'src', keyword);
      
      if (await fs.pathExists(filePath) || await fs.pathExists(srcFilePath)) {
        evidence.push(`File ${keyword} exists`);
        confidence = Math.max(confidence, 0.6);
      }
    }

    // Check for folder existence
    for (const folder of folderKeywords) {
      const folderPath = path.join(projectPath, 'src', folder);
      if (await fs.pathExists(folderPath)) {
        evidence.push(`Folder ${folder} exists`);
        confidence = Math.max(confidence, 0.5);
      }
    }

    return { confidence, evidence };
  }

  /**
   * Update phase file with completed tasks
   */
  private async updatePhaseFile(phaseFile: string, completedTasks: TaskMatch[]): Promise<void> {
    const updates = completedTasks.map(task => ({
      filePath: phaseFile,
      lineNumber: task.lineNumber,
      isCompleted: true,
      addTimestamp: true
    }));

    const results = await this.mdTaskUpdater.updateTasks(updates);
    const successCount = results.reduce((sum, r) => sum + r.tasksUpdated, 0);
    
    if (successCount > 0) {
      console.log(`✅ Marked ${successCount} tasks as complete in ${path.basename(phaseFile)}`);
      
      // Log evidence for debugging
      completedTasks.forEach(task => {
        console.log(`  - "${task.description}" (${(task.confidence * 100).toFixed(0)}% confidence)`);
        task.evidence.forEach(ev => console.log(`    Evidence: ${ev}`));
      });
    }
  }

  /**
   * Find all phase files in an agent directory
   */
  private async findPhaseFiles(agentDir: string): Promise<string[]> {
    const files = await fs.readdir(agentDir);
    return files
      .filter(f => f.match(/^phase\d+-todo\.md$/))
      .map(f => path.join(agentDir, f))
      .sort();
  }

  /**
   * Extract phase number from file path
   */
  private extractPhaseNumber(filePath: string): number {
    const match = path.basename(filePath).match(/phase(\d+)/);
    return match ? parseInt(match[1], 10) : 1;
  }
}