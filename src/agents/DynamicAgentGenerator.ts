import * as fs from 'fs-extra';
import * as path from 'path';

export interface AgentTemplate {
  name: string;
  specialization: string;
  description: string;
  capabilities: string[];
  tools: string[];
  expertise: string[];
  prompts: {
    system: string;
    taskHandler: string;
    reviewProcess: string;
  };
}

export interface GenerationResult {
  success: boolean;
  agentPath?: string;
  message: string;
  agent?: AgentTemplate;
}

export class DynamicAgentGenerator {
  private agentsBasePath: string;
  private existingAgents: Map<string, AgentTemplate>;

  constructor() {
    this.agentsBasePath = path.join(process.cwd(), '.claude', 'agents');
    this.existingAgents = new Map();
    this.loadExistingAgents();
  }

  private async loadExistingAgents(): Promise<void> {
    try {
      const agentFiles = await fs.readdir(this.agentsBasePath);
      
      for (const file of agentFiles) {
        if (file.endsWith('.md')) {
          const agentName = file.replace('.md', '');
          const content = await fs.readFile(
            path.join(this.agentsBasePath, file),
            'utf-8'
          );
          
          // Parse agent capabilities from content
          const template = this.parseAgentFromContent(agentName, content);
          this.existingAgents.set(agentName, template);
        }
      }
    } catch (error) {
      console.error('Error loading existing agents:', error);
    }
  }

  private parseAgentFromContent(name: string, content: string): AgentTemplate {
    // Extract key information from agent file
    const lines = content.split('\n');
    const description = lines.find(l => l.includes('You are'))?.replace('You are', '').trim() || '';
    
    // Extract capabilities
    const capabilitiesStart = content.indexOf('## Capabilities');
    const capabilitiesEnd = content.indexOf('##', capabilitiesStart + 1);
    const capabilitiesSection = capabilitiesStart > -1 
      ? content.substring(capabilitiesStart, capabilitiesEnd > -1 ? capabilitiesEnd : undefined)
      : '';
    
    const capabilities = capabilitiesSection
      .split('\n')
      .filter(line => line.startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim());

    return {
      name,
      specialization: name.replace('-specialist', ''),
      description,
      capabilities: capabilities.length > 0 ? capabilities : ['General development tasks'],
      tools: this.extractTools(content),
      expertise: this.extractExpertise(content),
      prompts: {
        system: content.substring(0, 500),
        taskHandler: '',
        reviewProcess: ''
      }
    };
  }

  private extractTools(content: string): string[] {
    const tools = [];
    const toolPatterns = [
      'Bash', 'Read', 'Write', 'Edit', 'Grep', 'Glob',
      'WebSearch', 'WebFetch', 'TodoWrite', 'Task'
    ];
    
    for (const tool of toolPatterns) {
      if (content.includes(tool)) {
        tools.push(tool);
      }
    }
    
    return tools.length > 0 ? tools : ['Bash', 'Read', 'Write', 'Edit'];
  }

  private extractExpertise(content: string): string[] {
    const expertise = [];
    const expertisePatterns = {
      'frontend': ['React', 'Vue', 'Angular', 'UI', 'CSS', 'HTML'],
      'backend': ['API', 'server', 'database', 'Node', 'Python'],
      'database': ['SQL', 'MongoDB', 'PostgreSQL', 'schema', 'migration'],
      'devops': ['Docker', 'Kubernetes', 'CI/CD', 'deployment'],
      'testing': ['Jest', 'test', 'QA', 'coverage'],
      'security': ['authentication', 'encryption', 'vulnerability'],
      'design': ['Figma', 'UI/UX', 'wireframe', 'prototype']
    };
    
    for (const [category, patterns] of Object.entries(expertisePatterns)) {
      if (patterns.some(p => content.toLowerCase().includes(p.toLowerCase()))) {
        expertise.push(category);
      }
    }
    
    return expertise;
  }

  async analyzeProjectNeeds(projectSpecs: any): Promise<string[]> {
    const neededAgents: string[] = [];
    const specContent = JSON.stringify(projectSpecs).toLowerCase();
    
    // Analyze for missing agent capabilities
    const capabilityGaps: Record<string, { keywords: string[]; notCoveredBy: string[] }> = {
      'designer-specialist': {
        keywords: ['design', 'figma', 'ui/ux', 'wireframe', 'mockup', 'prototype'],
        notCoveredBy: ['frontend-specialist']
      },
      'ai-integration-specialist': {
        keywords: ['ai', 'machine learning', 'llm', 'openai', 'claude', 'gpt'],
        notCoveredBy: [] as string[]
      },
      'performance-specialist': {
        keywords: ['optimize', 'performance', 'speed', 'cache', 'cdn', 'load time'],
        notCoveredBy: ['devops-specialist']
      },
      'accessibility-specialist': {
        keywords: ['accessibility', 'a11y', 'wcag', 'screen reader', 'aria'],
        notCoveredBy: ['frontend-specialist']
      },
      'mobile-specialist': {
        keywords: ['mobile', 'react native', 'flutter', 'ios', 'android', 'responsive'],
        notCoveredBy: ['frontend-specialist']
      },
      'blockchain-specialist': {
        keywords: ['blockchain', 'crypto', 'smart contract', 'web3', 'ethereum'],
        notCoveredBy: [] as string[]
      },
      'data-specialist': {
        keywords: ['analytics', 'data science', 'visualization', 'bi', 'reporting'],
        notCoveredBy: ['database-specialist']
      }
    };

    for (const [agentName, config] of Object.entries(capabilityGaps)) {
      // Check if project needs this capability
      const hasNeed = config.keywords.some(keyword => specContent.includes(keyword));
      
      if (hasNeed) {
        // Check if existing agents cover this
        const isCovered = config.notCoveredBy.some(existing => 
          this.existingAgents.has(existing)
        );
        
        if (!isCovered && !this.existingAgents.has(agentName)) {
          neededAgents.push(agentName);
        }
      }
    }

    return neededAgents;
  }

  async generateAgent(
    specialization: string,
    projectContext?: string
  ): Promise<GenerationResult> {
    const agentName = `${specialization.toLowerCase().replace(/\s+/g, '-')}-specialist`;
    
    // Check if agent already exists
    if (this.existingAgents.has(agentName)) {
      return {
        success: false,
        message: `Agent ${agentName} already exists`,
        agent: this.existingAgents.get(agentName)
      };
    }

    console.log(`🤖 Generating new agent: ${agentName}`);

    // Generate agent template based on specialization
    const template = await this.createAgentTemplate(specialization, projectContext);
    
    // Create agent file
    const agentPath = path.join(this.agentsBasePath, `${agentName}.md`);
    const agentContent = this.generateAgentContent(template);
    
    try {
      await fs.writeFile(agentPath, agentContent);
      
      // Add to existing agents
      this.existingAgents.set(agentName, template);
      
      console.log(`✅ Successfully generated ${agentName}`);
      
      return {
        success: true,
        agentPath,
        message: `Successfully generated ${agentName}`,
        agent: template
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to generate agent: ${(error as Error).message}`
      };
    }
  }

  private async createAgentTemplate(
    specialization: string,
    projectContext?: string
  ): Promise<AgentTemplate> {
    // Define specialized templates for common agent types
    const specializedTemplates: Record<string, Partial<AgentTemplate>> = {
      'designer': {
        description: 'a UI/UX design specialist focused on creating beautiful, intuitive interfaces',
        capabilities: [
          'Create wireframes and mockups',
          'Design component libraries',
          'Develop design systems',
          'Ensure visual consistency',
          'Optimize user experience',
          'Create responsive designs',
          'Work with design tokens',
          'Implement accessibility standards'
        ],
        tools: ['Read', 'Write', 'Edit', 'WebFetch', 'TodoWrite'],
        expertise: ['design', 'ui/ux', 'figma', 'css', 'frontend']
      },
      'ai-integration': {
        description: 'an AI integration specialist focused on implementing AI/ML features',
        capabilities: [
          'Integrate LLM APIs (OpenAI, Claude, etc.)',
          'Implement AI-powered features',
          'Optimize prompts and context',
          'Handle AI responses and streaming',
          'Implement RAG systems',
          'Create embeddings and vector stores',
          'Fine-tune models',
          'Implement AI safety measures'
        ],
        tools: ['Bash', 'Read', 'Write', 'Edit', 'WebFetch', 'Task'],
        expertise: ['ai', 'backend', 'api', 'data']
      },
      'performance': {
        description: 'a performance optimization specialist focused on speed and efficiency',
        capabilities: [
          'Profile application performance',
          'Optimize bundle sizes',
          'Implement caching strategies',
          'Optimize database queries',
          'Reduce API response times',
          'Implement lazy loading',
          'Configure CDN and edge computing',
          'Monitor performance metrics'
        ],
        tools: ['Bash', 'Read', 'Edit', 'Grep', 'Task'],
        expertise: ['performance', 'optimization', 'devops', 'frontend', 'backend']
      },
      'accessibility': {
        description: 'an accessibility specialist ensuring inclusive web experiences',
        capabilities: [
          'Implement WCAG 2.1 standards',
          'Add ARIA labels and roles',
          'Ensure keyboard navigation',
          'Test with screen readers',
          'Implement focus management',
          'Create accessible forms',
          'Ensure color contrast compliance',
          'Write accessibility documentation'
        ],
        tools: ['Read', 'Edit', 'Grep', 'TodoWrite'],
        expertise: ['accessibility', 'frontend', 'testing']
      },
      'mobile': {
        description: 'a mobile development specialist for native and cross-platform apps',
        capabilities: [
          'Develop React Native applications',
          'Implement mobile-specific features',
          'Optimize for mobile performance',
          'Handle device permissions',
          'Implement push notifications',
          'Create responsive layouts',
          'Test on multiple devices',
          'Handle offline functionality'
        ],
        tools: ['Bash', 'Read', 'Write', 'Edit', 'Task'],
        expertise: ['mobile', 'frontend', 'testing']
      },
      'blockchain': {
        description: 'a blockchain specialist for Web3 and decentralized applications',
        capabilities: [
          'Develop smart contracts',
          'Integrate Web3 wallets',
          'Implement token systems',
          'Create DeFi features',
          'Ensure contract security',
          'Optimize gas usage',
          'Implement IPFS storage',
          'Create NFT functionality'
        ],
        tools: ['Bash', 'Read', 'Write', 'Edit', 'Task'],
        expertise: ['blockchain', 'security', 'backend']
      },
      'data': {
        description: 'a data specialist for analytics and business intelligence',
        capabilities: [
          'Design data pipelines',
          'Create analytics dashboards',
          'Implement data visualization',
          'Build reporting systems',
          'Optimize data queries',
          'Implement ETL processes',
          'Create data models',
          'Ensure data quality'
        ],
        tools: ['Bash', 'Read', 'Write', 'Edit', 'Grep', 'Task'],
        expertise: ['data', 'database', 'backend', 'visualization']
      }
    };

    // Find matching template or create generic
    const baseSpec = specialization.toLowerCase().replace('-specialist', '');
    const template = specializedTemplates[baseSpec] || {
      description: `a ${specialization} specialist with deep expertise in the domain`,
      capabilities: [
        `Handle ${specialization}-related tasks`,
        'Implement best practices',
        'Ensure quality and standards',
        'Optimize for performance',
        'Write documentation'
      ],
      tools: ['Bash', 'Read', 'Write', 'Edit', 'Task'],
      expertise: [specialization.toLowerCase()]
    };

    // Enhance with project context if provided
    if (projectContext && template.capabilities) {
      template.capabilities.push(`Specialized for: ${projectContext}`);
    }

    return {
      name: `${baseSpec}-specialist`,
      specialization: baseSpec,
      description: template.description || `a ${specialization} specialist with deep expertise in the domain`,
      capabilities: template.capabilities || [],
      tools: template.tools || ['Bash', 'Read', 'Write', 'Edit', 'Task'],
      expertise: template.expertise || [specialization.toLowerCase()],
      prompts: this.generatePrompts(baseSpec, template)
    };
  }

  private generatePrompts(specialization: string, template: Partial<AgentTemplate>): any {
    return {
      system: `You are ${template.description || 'a specialist'}.

Your expertise includes:
${(template.capabilities || []).map(c => `- ${c}`).join('\n')}

You have access to the following tools: ${(template.tools || []).join(', ')}

Focus on delivering high-quality ${specialization} solutions while following best practices and industry standards.`,
      
      taskHandler: `When given a task related to ${specialization}:
1. Analyze requirements thoroughly
2. Plan your approach
3. Implement with best practices
4. Validate your work
5. Document your solution`,
      
      reviewProcess: `Review checklist for ${specialization}:
- Code quality and standards
- Performance implications  
- Security considerations
- Accessibility (if applicable)
- Documentation completeness`
    };
  }

  private generateAgentContent(template: AgentTemplate): string {
    return `---
description: ${template.name} - ${template.description}
allowed-tools: ${template.tools.join(', ')}
---

# ${template.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}

${template.prompts.system}

## Capabilities

${template.capabilities.map(c => `- ${c}`).join('\n')}

## Expertise Areas

${template.expertise.map(e => `- ${e.charAt(0).toUpperCase() + e.slice(1)}`).join('\n')}

## Task Handling Process

${template.prompts.taskHandler}

## Quality Assurance

${template.prompts.reviewProcess}

## Working Process

1. **Analysis Phase**
   - Understand project requirements
   - Identify technical constraints
   - Plan implementation approach

2. **Implementation Phase**
   - Follow best practices for ${template.specialization}
   - Write clean, maintainable code
   - Ensure compatibility and standards

3. **Validation Phase**
   - Test implementation thoroughly
   - Verify against requirements
   - Optimize for performance

4. **Documentation Phase**
   - Document technical decisions
   - Create usage examples
   - Write clear comments

## Integration Guidelines

When working with other agents:
- Coordinate on shared interfaces
- Maintain consistent coding standards
- Communicate dependencies clearly
- Ensure smooth handoffs between phases

## Best Practices

- Always validate inputs and outputs
- Follow established patterns and conventions
- Prioritize user experience and accessibility
- Maintain security best practices
- Document complex logic and decisions
`;
  }

  async generateRequiredAgents(projectSpecs: any): Promise<GenerationResult[]> {
    const neededAgents = await this.analyzeProjectNeeds(projectSpecs);
    const results: GenerationResult[] = [];
    
    console.log(`📊 Detected need for ${neededAgents.length} new specialist agents`);
    
    for (const agentSpec of neededAgents) {
      const result = await this.generateAgent(
        agentSpec.replace('-specialist', ''),
        JSON.stringify(projectSpecs).substring(0, 500)
      );
      results.push(result);
      
      // Add small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return results;
  }

  async ensureAgentExists(agentName: string): Promise<boolean> {
    const agentPath = path.join(this.agentsBasePath, `${agentName}.md`);
    
    if (await fs.pathExists(agentPath)) {
      return true;
    }
    
    // Try to generate the agent
    const specialization = agentName.replace('-specialist', '');
    const result = await this.generateAgent(specialization);
    
    return result.success;
  }

  getExistingAgents(): AgentTemplate[] {
    return Array.from(this.existingAgents.values());
  }

  async refreshAgentList(): Promise<void> {
    this.existingAgents.clear();
    await this.loadExistingAgents();
  }
}