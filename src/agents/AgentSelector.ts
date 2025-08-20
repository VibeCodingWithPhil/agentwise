import * as fs from 'fs-extra';
import * as path from 'path';
// import { PromptEnhancer } from '../ai/PromptEnhancer';

export interface AgentCapability {
  id: string;
  name: string;
  specialization: string;
  keywords: string[];
  patterns: RegExp[];
  priority: number;
}

export interface SelectionResult {
  selectedAgents: string[];
  reasoning: string;
  requiresAllAgents: boolean;
  userConfirmationNeeded: boolean;
}

export class AgentSelector {
  private agents: Map<string, AgentCapability> = new Map();
  private agentsDir: string;
  // private promptEnhancer: PromptEnhancer;
  private lastScanTime: number = 0;
  private scanInterval: number = 5000; // Re-scan every 5 seconds

  constructor(agentsDir: string = path.join(process.cwd(), '.claude', 'agents')) {
    this.agentsDir = agentsDir;
    // this.promptEnhancer = new PromptEnhancer();
    this.scanForAgents();
  }

  /**
   * Scan for all available agents including newly added ones
   */
  private async scanForAgents(): Promise<void> {
    const now = Date.now();
    if (now - this.lastScanTime < this.scanInterval) {
      return; // Don't scan too frequently
    }

    try {
      if (!await fs.pathExists(this.agentsDir)) {
        console.warn(`Agents directory not found: ${this.agentsDir}`);
        return;
      }

      const files = await fs.readdir(this.agentsDir);
      const agentFiles = files.filter(f => f.endsWith('.md'));

      for (const file of agentFiles) {
        const agentId = path.basename(file, '.md');
        if (!this.agents.has(agentId)) {
          await this.loadAgent(agentId, path.join(this.agentsDir, file));
        }
      }

      this.lastScanTime = now;
    } catch (error) {
      console.error('Error scanning for agents:', error);
    }
  }

  /**
   * Load an agent's capabilities from its definition file
   */
  private async loadAgent(agentId: string, filePath: string): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const capability = this.parseAgentCapabilities(agentId, content);
      this.agents.set(agentId, capability);
      console.log(`Loaded agent: ${agentId} (${capability.specialization})`);
    } catch (error) {
      console.error(`Error loading agent ${agentId}:`, error);
    }
  }

  /**
   * Parse agent capabilities from the agent definition
   */
  private parseAgentCapabilities(agentId: string, content: string): AgentCapability {
    // Extract metadata from YAML frontmatter
    const metadataMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let name = agentId;
    let specialization = 'general';
    let keywords: string[] = [];

    if (metadataMatch) {
      const metadata = metadataMatch[1];
      const nameMatch = metadata.match(/name:\s*(.+)/);
      if (nameMatch) name = nameMatch[1].trim();
      
      const specMatch = metadata.match(/specialization:\s*(.+)/);
      if (specMatch) specialization = specMatch[1].trim();
    }

    // Define capability patterns based on agent type
    const patterns: RegExp[] = [];
    
    switch (agentId) {
      case 'frontend-specialist':
        keywords = ['ui', 'ux', 'frontend', 'react', 'vue', 'angular', 'css', 'html', 'design', 'component', 'interface', 'styling', 'responsive', 'accessibility'];
        patterns.push(
          /\b(frontend|ui|ux|react|vue|angular|component|interface|styling|css|html)\b/i,
          /\b(design|layout|responsive|accessibility|user interface)\b/i
        );
        break;
      
      case 'backend-specialist':
        keywords = ['backend', 'api', 'server', 'database', 'authentication', 'security', 'endpoint', 'rest', 'graphql', 'middleware'];
        patterns.push(
          /\b(backend|api|server|endpoint|rest|graphql|middleware|authentication)\b/i,
          /\b(database|sql|orm|query|migration)\b/i
        );
        break;
      
      case 'database-specialist':
        keywords = ['database', 'sql', 'query', 'schema', 'migration', 'optimization', 'index', 'postgresql', 'mysql', 'mongodb'];
        patterns.push(
          /\b(database|sql|schema|migration|query|index|optimization)\b/i,
          /\b(postgresql|mysql|mongodb|redis|timescale)\b/i
        );
        break;
      
      case 'devops-specialist':
        keywords = ['docker', 'kubernetes', 'ci/cd', 'deployment', 'infrastructure', 'monitoring', 'logging', 'scaling', 'aws', 'cloud'];
        patterns.push(
          /\b(docker|kubernetes|deployment|infrastructure|ci\/cd|pipeline)\b/i,
          /\b(monitoring|logging|scaling|cloud|aws|azure|gcp)\b/i
        );
        break;
      
      case 'testing-specialist':
        keywords = ['test', 'testing', 'unit', 'integration', 'e2e', 'coverage', 'jest', 'mocha', 'cypress', 'playwright', 'quality'];
        patterns.push(
          /\b(test|testing|unit|integration|e2e|coverage|quality)\b/i,
          /\b(jest|mocha|cypress|playwright|vitest|mock)\b/i
        );
        break;
      
      default:
        // For custom agents, extract keywords from content
        keywords = this.extractKeywordsFromContent(content);
        patterns.push(new RegExp(`\\b(${keywords.join('|')})\\b`, 'i'));
    }

    return {
      id: agentId,
      name,
      specialization,
      keywords,
      patterns,
      priority: this.getAgentPriority(agentId)
    };
  }

  /**
   * Extract keywords from agent content for custom agents
   */
  private extractKeywordsFromContent(content: string): string[] {
    const keywords: string[] = [];
    
    // Look for expertise section
    const expertiseMatch = content.match(/## Expertise[\s\S]*?(?=##|$)/);
    if (expertiseMatch) {
      const words = expertiseMatch[0].toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 4 && !['expertise', 'areas', 'skills'].includes(w));
      keywords.push(...words.slice(0, 10));
    }

    return keywords;
  }

  /**
   * Get agent priority (some agents are more important for certain tasks)
   */
  private getAgentPriority(agentId: string): number {
    const priorities: Record<string, number> = {
      'frontend-specialist': 3,
      'backend-specialist': 3,
      'database-specialist': 2,
      'devops-specialist': 2,
      'testing-specialist': 1
    };
    return priorities[agentId] || 1;
  }

  /**
   * Select appropriate agents for a task
   */
  async selectAgents(task: string, context?: string): Promise<SelectionResult> {
    // Re-scan for new agents
    await this.scanForAgents();

    const taskLower = task.toLowerCase();
    const contextLower = (context || '').toLowerCase();
    const combined = `${taskLower} ${contextLower}`;

    // Score each agent based on keyword matches
    const agentScores: Map<string, number> = new Map();
    
    for (const [agentId, capability] of this.agents) {
      let score = 0;

      // Check keyword matches
      for (const keyword of capability.keywords) {
        if (combined.includes(keyword)) {
          score += 2;
        }
      }

      // Check pattern matches
      for (const pattern of capability.patterns) {
        const matches = combined.match(pattern);
        if (matches) {
          score += 3 * matches.length;
        }
      }

      // Apply priority multiplier
      score *= capability.priority;

      if (score > 0) {
        agentScores.set(agentId, score);
      }
    }

    // Determine if this is a full-stack task requiring all agents
    const isFullStack = this.isFullStackTask(task, context);
    const isComplexTask = this.isComplexTask(task, context);

    // Select agents based on scores
    let selectedAgents: string[] = [];
    let requiresAllAgents = false;
    let userConfirmationNeeded = false;

    if (isFullStack || isComplexTask) {
      // Use all agents for complex or full-stack tasks
      selectedAgents = Array.from(this.agents.keys());
      requiresAllAgents = true;
    } else if (agentScores.size === 0) {
      // No specific matches, ask user if they want all agents
      selectedAgents = ['frontend-specialist', 'backend-specialist']; // Default minimal set
      userConfirmationNeeded = true;
    } else {
      // Select top scoring agents
      const sortedAgents = Array.from(agentScores.entries())
        .sort((a, b) => b[1] - a[1]);

      // Take agents with significant scores
      const threshold = sortedAgents[0][1] * 0.3; // 30% of top score
      selectedAgents = sortedAgents
        .filter(([_, score]) => score >= threshold)
        .map(([agentId, _]) => agentId);

      // If we selected less than all agents, ask for confirmation
      if (selectedAgents.length < this.agents.size) {
        userConfirmationNeeded = true;
      }
    }

    // Generate reasoning
    const reasoning = this.generateSelectionReasoning(
      task,
      selectedAgents,
      agentScores,
      isFullStack,
      isComplexTask
    );

    return {
      selectedAgents,
      reasoning,
      requiresAllAgents,
      userConfirmationNeeded
    };
  }

  /**
   * Check if task requires full-stack development
   */
  private isFullStackTask(task: string, context?: string): boolean {
    const fullStackPatterns = [
      /\b(full[- ]?stack|entire application|complete system|whole project)\b/i,
      /\b(frontend and backend|ui and api|client and server)\b/i,
      /\b(end[- ]to[- ]end|e2e implementation|complete feature)\b/i,
      /\b(dashboard|application|platform|system) (with|including|and)/i
    ];

    const combined = `${task} ${context || ''}`;
    return fullStackPatterns.some(pattern => pattern.test(combined));
  }

  /**
   * Check if task is complex and requires multiple specialists
   */
  private isComplexTask(task: string, context?: string): boolean {
    const complexIndicators = [
      /\b(complex|comprehensive|extensive|large[- ]scale|enterprise)\b/i,
      /\b(multiple|several|various) (components|features|services)\b/i,
      /\b(integrate|integration|connect|synchronize)\b/i,
      /\b(migrate|refactor|redesign|rebuild|modernize)\b/i
    ];

    const combined = `${task} ${context || ''}`;
    const matchCount = complexIndicators.filter(pattern => pattern.test(combined)).length;
    
    // Also check task length as an indicator of complexity
    const wordCount = combined.split(/\s+/).length;
    
    return matchCount >= 2 || wordCount > 50;
  }

  /**
   * Generate human-readable reasoning for agent selection
   */
  private generateSelectionReasoning(
    _task: string,
    selectedAgents: string[],
    scores: Map<string, number>,
    isFullStack: boolean,
    isComplex: boolean
  ): string {
    const reasons: string[] = [];

    if (isFullStack) {
      reasons.push('This appears to be a full-stack task requiring coordination across all layers.');
    }

    if (isComplex) {
      reasons.push('The task complexity suggests multiple specialists should collaborate.');
    }

    if (selectedAgents.length === this.agents.size) {
      reasons.push('All available agents have been selected to ensure comprehensive coverage.');
    } else {
      const agentNames = selectedAgents.map(id => {
        const agent = this.agents.get(id);
        return agent ? agent.name : id;
      });

      reasons.push(`Selected ${agentNames.join(', ')} based on task requirements.`);

      // Add specific reasons for top agents
      for (const agentId of selectedAgents.slice(0, 3)) {
        const score = scores.get(agentId);
        const agent = this.agents.get(agentId);
        if (score && agent && score > 5) {
          reasons.push(`${agent.name}: Strong match for ${agent.specialization} aspects.`);
        }
      }
    }

    return reasons.join(' ');
  }

  /**
   * Get all available agents
   */
  async getAllAgents(): Promise<AgentCapability[]> {
    await this.scanForAgents();
    return Array.from(this.agents.values());
  }

  /**
   * Check if a specific agent exists
   */
  async hasAgent(agentId: string): Promise<boolean> {
    await this.scanForAgents();
    return this.agents.has(agentId);
  }
}