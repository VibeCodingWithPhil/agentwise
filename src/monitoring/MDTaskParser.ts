import * as fs from 'fs-extra';
import * as path from 'path';

export interface ParsedTask {
  id: string;
  description: string;
  isCompleted: boolean;
  priority: 'P0' | 'P1' | 'P2' | 'P3' | 'normal';
  agent?: string;
  phase?: string;
  category?: string;
  lineNumber: number;
  indentLevel: number;
  parentTask?: string;
  subtasks?: ParsedTask[];
}

export interface ParsedPhase {
  number: number;
  name: string;
  tasks: ParsedTask[];
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
}

export interface ParsedDocument {
  filePath: string;
  projectId: string;
  documentType: 'todo-spec' | 'phase-implementation' | 'agent-todos' | 'unknown';
  phases: ParsedPhase[];
  totalTasks: number;
  completedTasks: number;
  completionPercentage: number;
  agentAssignments: Map<string, ParsedTask[]>;
}

export class MDTaskParser {
  private agentKeywords = {
    'frontend-specialist': [
      'ui', 'ux', 'component', 'frontend', 'react', 'vue', 'angular', 
      'css', 'style', 'layout', 'design', 'interface', 'client', 'browser'
    ],
    'backend-specialist': [
      'api', 'server', 'backend', 'endpoint', 'auth', 'middleware', 
      'express', 'node', 'database connection', 'rest', 'graphql'
    ],
    'database-specialist': [
      'database', 'schema', 'migration', 'model', 'query', 'sql', 
      'postgres', 'mysql', 'mongodb', 'redis', 'table', 'index'
    ],
    'devops-specialist': [
      'docker', 'deploy', 'ci/cd', 'pipeline', 'kubernetes', 'infrastructure',
      'environment', 'config', 'aws', 'azure', 'gcp', 'terraform'
    ],
    'testing-specialist': [
      'test', 'spec', 'coverage', 'unit', 'integration', 'e2e', 
      'jest', 'cypress', 'mocha', 'quality', 'qa', 'bug'
    ]
  };

  async parseFile(filePath: string): Promise<ParsedDocument> {
    const content = await fs.readFile(filePath, 'utf-8');
    const projectId = this.extractProjectId(filePath);
    const documentType = this.determineDocumentType(filePath);
    
    const document: ParsedDocument = {
      filePath,
      projectId,
      documentType,
      phases: [],
      totalTasks: 0,
      completedTasks: 0,
      completionPercentage: 0,
      agentAssignments: new Map()
    };

    // Parse content based on document type
    if (documentType === 'todo-spec') {
      document.phases = this.parseTodoSpec(content);
    } else if (documentType === 'phase-implementation') {
      document.phases = this.parsePhaseImplementation(content, filePath);
    } else if (documentType === 'agent-todos') {
      document.phases = this.parseAgentTodo(content, filePath);
    } else {
      document.phases = this.parseGenericMD(content);
    }

    // Calculate totals
    this.calculateTotals(document);
    
    // Assign tasks to agents
    this.assignTasksToAgents(document);

    return document;
  }

  private parseTodoSpec(content: string): ParsedPhase[] {
    const phases: ParsedPhase[] = [];
    const lines = content.split('\n');
    
    let currentPhase: ParsedPhase | null = null;
    let currentCategory: string | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for phase header (## Phase 1: ...)
      const phaseMatch = line.match(/^##\s+Phase\s+(\d+):\s*(.+)/i);
      if (phaseMatch) {
        if (currentPhase) {
          phases.push(currentPhase);
        }
        
        currentPhase = {
          number: parseInt(phaseMatch[1]),
          name: phaseMatch[2].trim(),
          tasks: [],
          totalTasks: 0,
          completedTasks: 0,
          completionPercentage: 0
        };
        currentCategory = null;
        continue;
      }
      
      // Check for category header (### Category Name)
      const categoryMatch = line.match(/^###\s+(.+)/);
      if (categoryMatch) {
        currentCategory = categoryMatch[1].trim();
        continue;
      }
      
      // Parse task line
      const task = this.parseTaskLine(line, i);
      if (task && currentPhase) {
        task.phase = `Phase ${currentPhase.number}`;
        task.category = currentCategory || undefined;
        
        // Extract priority from task
        task.priority = this.extractPriority(line);
        
        currentPhase.tasks.push(task);
      }
    }
    
    // Add last phase
    if (currentPhase) {
      phases.push(currentPhase);
    }
    
    // Calculate completion for each phase
    phases.forEach(phase => {
      phase.totalTasks = phase.tasks.length;
      phase.completedTasks = phase.tasks.filter(t => t.isCompleted).length;
      phase.completionPercentage = phase.totalTasks > 0 
        ? Math.round((phase.completedTasks / phase.totalTasks) * 100)
        : 0;
    });
    
    return phases;
  }

  private parsePhaseImplementation(content: string, filePath: string): ParsedPhase[] {
    const phases: ParsedPhase[] = [];
    const lines = content.split('\n');
    
    // Extract phase number from filename
    const phaseNumber = this.extractPhaseNumber(filePath);
    const phaseName = this.extractPhaseName(lines);
    
    const phase: ParsedPhase = {
      number: phaseNumber,
      name: phaseName,
      tasks: [],
      totalTasks: 0,
      completedTasks: 0,
      completionPercentage: 0
    };
    
    let currentAgent: string | null = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for agent section header
      const agentMatch = line.match(/###?\s*(Frontend|Backend|Database|DevOps|Testing)\s+Specialist/i);
      if (agentMatch) {
        currentAgent = `${agentMatch[1].toLowerCase()}-specialist`;
        continue;
      }
      
      // Parse task line
      const task = this.parseTaskLine(line, i);
      if (task) {
        task.phase = `Phase ${phaseNumber}`;
        task.agent = currentAgent || this.inferAgentFromTask(task.description);
        phase.tasks.push(task);
      }
    }
    
    // Calculate completion
    phase.totalTasks = phase.tasks.length;
    phase.completedTasks = phase.tasks.filter(t => t.isCompleted).length;
    phase.completionPercentage = phase.totalTasks > 0
      ? Math.round((phase.completedTasks / phase.totalTasks) * 100)
      : 0;
    
    phases.push(phase);
    return phases;
  }

  private parseAgentTodo(content: string, filePath: string): ParsedPhase[] {
    // Extract agent name from path
    const agent = this.extractAgentFromPath(filePath);
    const phaseNumber = this.extractPhaseNumber(filePath);
    
    const phase: ParsedPhase = {
      number: phaseNumber,
      name: `Agent Tasks - ${agent}`,
      tasks: [],
      totalTasks: 0,
      completedTasks: 0,
      completionPercentage: 0
    };
    
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const task = this.parseTaskLine(lines[i], i);
      if (task) {
        task.agent = agent;
        task.phase = `Phase ${phaseNumber}`;
        phase.tasks.push(task);
      }
    }
    
    // Calculate completion
    phase.totalTasks = phase.tasks.length;
    phase.completedTasks = phase.tasks.filter(t => t.isCompleted).length;
    phase.completionPercentage = phase.totalTasks > 0
      ? Math.round((phase.completedTasks / phase.totalTasks) * 100)
      : 0;
    
    return [phase];
  }

  private parseGenericMD(content: string): ParsedPhase[] {
    const phase: ParsedPhase = {
      number: 1,
      name: 'Tasks',
      tasks: [],
      totalTasks: 0,
      completedTasks: 0,
      completionPercentage: 0
    };
    
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const task = this.parseTaskLine(lines[i], i);
      if (task) {
        phase.tasks.push(task);
      }
    }
    
    // Calculate completion
    phase.totalTasks = phase.tasks.length;
    phase.completedTasks = phase.tasks.filter(t => t.isCompleted).length;
    phase.completionPercentage = phase.totalTasks > 0
      ? Math.round((phase.completedTasks / phase.totalTasks) * 100)
      : 0;
    
    return [phase];
  }

  private parseTaskLine(line: string, lineNumber: number): ParsedTask | null {
    // Match checkbox patterns with various formats
    const patterns = [
      /^(\s*)[-*]\s*\[([ xX])\]\s*(.+)/,  // - [ ] or - [x] format
      /^(\s*)(\d+\.)\s*\[([ xX])\]\s*(.+)/, // 1. [ ] numbered format
    ];
    
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        const indentLevel = match[1] ? match[1].length / 2 : 0;
        const isCompleted = match[2].toLowerCase() === 'x' || match[3]?.toLowerCase() === 'x';
        const description = (match[3] || match[4]).trim();
        
        // Remove priority indicators from description
        const cleanDescription = description.replace(/^(🔴|🟡|🟢|🔵|P[0-3]:?\s*)/i, '').trim();
        
        return {
          id: this.generateTaskId(lineNumber, cleanDescription),
          description: cleanDescription,
          isCompleted,
          priority: this.extractPriority(line),
          lineNumber,
          indentLevel
        };
      }
    }
    
    return null;
  }

  private extractPriority(line: string): ParsedTask['priority'] {
    // Check for emoji priority indicators
    if (line.includes('🔴') || /\bP0\b/i.test(line)) return 'P0';
    if (line.includes('🟡') || /\bP1\b/i.test(line)) return 'P1';
    if (line.includes('🟢') || /\bP2\b/i.test(line)) return 'P2';
    if (line.includes('🔵') || /\bP3\b/i.test(line)) return 'P3';
    
    return 'normal';
  }

  private inferAgentFromTask(description: string): string {
    const descLower = description.toLowerCase();
    let bestMatch = 'backend-specialist'; // default
    let bestScore = 0;
    
    for (const [agent, keywords] of Object.entries(this.agentKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (descLower.includes(keyword)) {
          score++;
        }
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = agent;
      }
    }
    
    return bestMatch;
  }

  private calculateTotals(document: ParsedDocument): void {
    document.totalTasks = 0;
    document.completedTasks = 0;
    
    for (const phase of document.phases) {
      document.totalTasks += phase.totalTasks;
      document.completedTasks += phase.completedTasks;
    }
    
    document.completionPercentage = document.totalTasks > 0
      ? Math.round((document.completedTasks / document.totalTasks) * 100)
      : 0;
  }

  private assignTasksToAgents(document: ParsedDocument): void {
    for (const phase of document.phases) {
      for (const task of phase.tasks) {
        const agent = task.agent || this.inferAgentFromTask(task.description);
        
        if (!document.agentAssignments.has(agent)) {
          document.agentAssignments.set(agent, []);
        }
        
        document.agentAssignments.get(agent)!.push(task);
      }
    }
  }

  private extractProjectId(filePath: string): string {
    // Extract from workspace/project-name/...
    const parts = filePath.split(path.sep);
    const workspaceIndex = parts.indexOf('workspace');
    
    if (workspaceIndex !== -1 && parts[workspaceIndex + 1]) {
      return parts[workspaceIndex + 1];
    }
    
    return 'unknown';
  }

  private determineDocumentType(filePath: string): ParsedDocument['documentType'] {
    const filename = path.basename(filePath).toLowerCase();
    
    if (filename.includes('todo-spec')) return 'todo-spec';
    if (filename.includes('phase') && filename.includes('implementation')) return 'phase-implementation';
    if (filePath.includes('agent-todos')) return 'agent-todos';
    
    return 'unknown';
  }

  private extractPhaseNumber(filePath: string): number {
    const filename = path.basename(filePath);
    const match = filename.match(/phase[-_]?(\d+)/i);
    return match ? parseInt(match[1]) : 1;
  }

  private extractPhaseName(lines: string[]): string {
    // Look for phase name in first few lines
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const match = lines[i].match(/^#\s+(.+)/);
      if (match) {
        return match[1].replace(/Phase\s+\d+:\s*/i, '').trim();
      }
    }
    return 'Implementation';
  }

  private extractAgentFromPath(filePath: string): string {
    const parts = filePath.split(path.sep);
    const agentTodoIndex = parts.indexOf('agent-todos');
    
    if (agentTodoIndex !== -1 && parts[agentTodoIndex + 1]) {
      return parts[agentTodoIndex + 1];
    }
    
    return 'unknown-specialist';
  }

  private generateTaskId(lineNumber: number, description: string): string {
    const descId = description.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '_');
    return `task_L${lineNumber}_${descId}`;
  }

  // Get completion statistics for a project
  async getProjectStatistics(projectPath: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    completionPercentage: number;
    phaseBreakdown: Array<{
      phase: string;
      total: number;
      completed: number;
      percentage: number;
    }>;
    agentBreakdown: Array<{
      agent: string;
      total: number;
      completed: number;
      percentage: number;
    }>;
  }> {
    const stats = {
      totalTasks: 0,
      completedTasks: 0,
      completionPercentage: 0,
      phaseBreakdown: [] as any[],
      agentBreakdown: [] as any[]
    };

    // Find all MD files in project
    const mdFiles = await this.findMDFiles(projectPath);
    
    const phaseMap = new Map<string, { total: number; completed: number }>();
    const agentMap = new Map<string, { total: number; completed: number }>();
    
    for (const file of mdFiles) {
      const document = await this.parseFile(file);
      
      stats.totalTasks += document.totalTasks;
      stats.completedTasks += document.completedTasks;
      
      // Aggregate by phase
      for (const phase of document.phases) {
        const key = `Phase ${phase.number}`;
        if (!phaseMap.has(key)) {
          phaseMap.set(key, { total: 0, completed: 0 });
        }
        const phaseStats = phaseMap.get(key)!;
        phaseStats.total += phase.totalTasks;
        phaseStats.completed += phase.completedTasks;
      }
      
      // Aggregate by agent
      for (const [agent, tasks] of document.agentAssignments) {
        if (!agentMap.has(agent)) {
          agentMap.set(agent, { total: 0, completed: 0 });
        }
        const agentStats = agentMap.get(agent)!;
        agentStats.total += tasks.length;
        agentStats.completed += tasks.filter(t => t.isCompleted).length;
      }
    }
    
    // Calculate overall percentage
    stats.completionPercentage = stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;
    
    // Build phase breakdown
    for (const [phase, data] of phaseMap) {
      stats.phaseBreakdown.push({
        phase,
        total: data.total,
        completed: data.completed,
        percentage: data.total > 0
          ? Math.round((data.completed / data.total) * 100)
          : 0
      });
    }
    
    // Build agent breakdown
    for (const [agent, data] of agentMap) {
      stats.agentBreakdown.push({
        agent,
        total: data.total,
        completed: data.completed,
        percentage: data.total > 0
          ? Math.round((data.completed / data.total) * 100)
          : 0
      });
    }
    
    // Sort breakdowns
    stats.phaseBreakdown.sort((a, b) => a.phase.localeCompare(b.phase));
    stats.agentBreakdown.sort((a, b) => b.total - a.total);
    
    return stats;
  }

  private async findMDFiles(directory: string): Promise<string[]> {
    const files: string[] = [];
    
    const items = await fs.readdir(directory);
    
    for (const item of items) {
      const fullPath = path.join(directory, item);
      const stat = await fs.stat(fullPath);
      
      if (stat.isFile() && item.endsWith('.md')) {
        files.push(fullPath);
      } else if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        const subFiles = await this.findMDFiles(fullPath);
        files.push(...subFiles);
      }
    }
    
    return files;
  }
}