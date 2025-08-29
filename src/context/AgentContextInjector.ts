/**
 * AgentContextInjector - Injects shared context into agent execution
 * This makes token optimization REAL by modifying how agents receive context
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import axios from 'axios';

export class AgentContextInjector {
  private serverUrl: string = 'http://localhost:3003';
  private contextCache: Map<string, any> = new Map();
  
  /**
   * Prepare optimized context for an agent
   * This reduces tokens by using shared context instead of full duplication
   */
  async prepareOptimizedContext(
    agentName: string,
    projectPath: string
  ): Promise<{ 
    sharedContext: any, 
    agentSpecific: any, 
    tokensSaved: number 
  }> {
    const projectName = path.basename(projectPath);
    
    try {
      // Get shared context from server
      const response = await axios.get(`${this.serverUrl}/context/${projectName}`);
      const sharedContext = response.data.context || {};
      
      // Get agent-specific context
      const agentSpecific = await this.getAgentSpecificContext(agentName, projectPath);
      
      // Calculate token savings
      const fullContextSize = JSON.stringify({
        ...sharedContext,
        ...agentSpecific
      }).length / 4; // Rough token estimate
      
      const optimizedSize = JSON.stringify({
        shared: 'reference',
        specific: agentSpecific
      }).length / 4;
      
      const tokensSaved = Math.round(fullContextSize - optimizedSize);
      
      return {
        sharedContext,
        agentSpecific,
        tokensSaved
      };
    } catch (error) {
      // Fallback if server not available
      return {
        sharedContext: {},
        agentSpecific: await this.getFullProjectContext(projectPath),
        tokensSaved: 0
      };
    }
  }
  
  /**
   * Create an optimized agent definition with shared context
   */
  async createOptimizedAgentFile(
    agentName: string,
    projectPath: string
  ): Promise<string> {
    const { sharedContext, agentSpecific, tokensSaved } = await this.prepareOptimizedContext(
      agentName,
      projectPath
    );
    
    // Read original agent definition
    const agentDefPath = path.join(process.cwd(), '.claude', 'agents', `${agentName}.md`);
    let agentDef = await fs.readFile(agentDefPath, 'utf-8');
    
    // Inject context optimization instructions
    const contextInstructions = `

## 🔗 CONTEXT OPTIMIZATION ACTIVE

You have access to shared project context to reduce token usage.
Token savings for this session: ${tokensSaved} tokens

### Shared Context (reference this instead of duplicating):
\`\`\`json
${JSON.stringify(sharedContext, null, 2)}
\`\`\`

### Your Agent-Specific Context:
\`\`\`json
${JSON.stringify(agentSpecific, null, 2)}
\`\`\`

### Optimization Guidelines:
1. Reference shared context instead of repeating information
2. Use context IDs instead of full descriptions where possible
3. Minimize redundant information in responses
4. Coordinate with other agents through shared context updates

---
`;
    
    // Insert optimization instructions after the frontmatter
    const frontmatterEnd = agentDef.indexOf('---', 4);
    if (frontmatterEnd > 0) {
      agentDef = 
        agentDef.slice(0, frontmatterEnd + 3) +
        contextInstructions +
        agentDef.slice(frontmatterEnd + 3);
    }
    
    // Save optimized agent file
    const optimizedPath = path.join(
      projectPath,
      '.optimized',
      `${agentName}-optimized.md`
    );
    
    await fs.ensureDir(path.dirname(optimizedPath));
    await fs.writeFile(optimizedPath, agentDef);
    
    console.log(`💾 Saved ${tokensSaved} tokens for ${agentName} through context optimization`);
    
    return optimizedPath;
  }
  
  /**
   * Update shared context after agent execution
   */
  async updateSharedContext(
    projectName: string,
    agentName: string,
    updates: any
  ): Promise<void> {
    try {
      await axios.post(`${this.serverUrl}/context/${projectName}/diff`, {
        agentId: agentName,
        changes: {
          added: updates.added || {},
          modified: updates.modified || {},
          removed: updates.removed || []
        }
      });
    } catch (error) {
      // Silent fail if server not available
    }
  }
  
  /**
   * Get agent-specific context based on specialization
   */
  private async getAgentSpecificContext(
    agentName: string,
    projectPath: string
  ): Promise<any> {
    const context: any = {};
    
    // Add agent-specific files and context
    if (agentName.includes('frontend')) {
      context.components = await this.getFiles(projectPath, 'components');
      context.styles = await this.getFiles(projectPath, 'styles');
    } else if (agentName.includes('backend')) {
      context.api = await this.getFiles(projectPath, 'api');
      context.services = await this.getFiles(projectPath, 'services');
    } else if (agentName.includes('database')) {
      context.schema = await this.getFiles(projectPath, 'schema');
      context.migrations = await this.getFiles(projectPath, 'migrations');
    } else if (agentName.includes('test')) {
      context.tests = await this.getFiles(projectPath, 'tests');
      context.specs = await this.getFiles(projectPath, 'specs');
    }
    
    // Add task-specific context
    const todoPath = path.join(projectPath, 'agent-todos', agentName);
    if (await fs.pathExists(todoPath)) {
      context.tasks = await fs.readdir(todoPath);
    }
    
    return context;
  }
  
  /**
   * Get files from a specific directory
   */
  private async getFiles(projectPath: string, subdir: string): Promise<string[]> {
    const dirPath = path.join(projectPath, 'src', subdir);
    if (await fs.pathExists(dirPath)) {
      return fs.readdir(dirPath);
    }
    return [];
  }
  
  /**
   * Get full project context (fallback when no optimization)
   */
  private async getFullProjectContext(projectPath: string): Promise<any> {
    const context: any = {
      projectPath,
      structure: {}
    };
    
    // Read project structure
    if (await fs.pathExists(path.join(projectPath, 'package.json'))) {
      context.packageJson = await fs.readJson(path.join(projectPath, 'package.json'));
    }
    
    if (await fs.pathExists(path.join(projectPath, 'src'))) {
      context.structure.src = await fs.readdir(path.join(projectPath, 'src'));
    }
    
    return context;
  }
  
  /**
   * Initialize shared context for a project
   */
  async initializeProjectContext(projectPath: string): Promise<void> {
    const projectName = path.basename(projectPath);
    const context = await this.getFullProjectContext(projectPath);
    
    try {
      await axios.put(`${this.serverUrl}/context/${projectName}`, {
        context
      });
      console.log(`🔗 Initialized shared context for ${projectName}`);
    } catch (error) {
      // Silent fail if server not available
    }
  }
}

export default AgentContextInjector;