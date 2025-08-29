/**
 * Agent-Specific Context Filter
 * Filters and optimizes context based on agent specialization and current system load
 */

import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs-extra';

export interface AgentSpecialization {
  name: string;
  keywords: string[];
  filePatterns: string[];
  contextPriorities: Record<string, number>;
  maxContextSize: number;
  requiredFields: string[];
  optionalFields: string[];
  excludePatterns: string[];
}

export interface ContextFilterConfig {
  maxContextPerAgent: number; // Max context size per agent in MB
  globalMaxContext: number; // Global max context size in MB
  adaptiveReduction: boolean; // Enable adaptive context reduction based on memory
  contextImportanceThreshold: number; // Minimum importance score to include
  enableSpecializationFiltering: boolean;
  memoryAwareFiltering: boolean;
}

export interface ContextElement {
  key: string;
  content: any;
  size: number;
  importance: number;
  relevance: number;
  category: string;
  lastAccessed: Date;
  agentRelevance: Record<string, number>;
}

export interface FilteredContext {
  agentId: string;
  original: any;
  filtered: any;
  reductionRatio: number;
  removedElements: string[];
  importanceScores: Record<string, number>;
  memoryUsage: number;
  adaptations: string[];
}

export class AgentContextFilter extends EventEmitter {
  private config: ContextFilterConfig;
  private agentSpecs: Map<string, AgentSpecialization> = new Map();
  private contextCache: Map<string, ContextElement[]> = new Map();
  private memoryUsage: number = 0;
  private adaptations: string[] = [];

  constructor(config: Partial<ContextFilterConfig> = {}) {
    super();
    
    this.config = {
      maxContextPerAgent: config.maxContextPerAgent || 50, // 50MB per agent
      globalMaxContext: config.globalMaxContext || 500, // 500MB global max
      adaptiveReduction: config.adaptiveReduction !== false,
      contextImportanceThreshold: config.contextImportanceThreshold || 0.3,
      enableSpecializationFiltering: config.enableSpecializationFiltering !== false,
      memoryAwareFiltering: config.memoryAwareFiltering !== false
    };

    this.loadAgentSpecializations();
  }

  /**
   * Load agent specializations from the agents directory
   */
  private async loadAgentSpecializations(): Promise<void> {
    try {
      const agentsDir = path.join(process.cwd(), '.claude', 'agents');
      if (!await fs.pathExists(agentsDir)) {
        console.warn('Agents directory not found, using default specializations');
        this.loadDefaultSpecializations();
        return;
      }

      const agentFiles = await fs.readdir(agentsDir);
      
      for (const file of agentFiles) {
        if (file.endsWith('.md')) {
          const agentPath = path.join(agentsDir, file);
          const content = await fs.readFile(agentPath, 'utf-8');
          const spec = this.parseAgentSpecialization(file, content);
          this.agentSpecs.set(spec.name, spec);
        }
      }

      console.log(`📋 Loaded ${this.agentSpecs.size} agent specializations`);
    } catch (error) {
      console.error('Failed to load agent specializations:', error);
      this.loadDefaultSpecializations();
    }
  }

  /**
   * Parse agent specialization from markdown file
   */
  private parseAgentSpecialization(filename: string, content: string): AgentSpecialization {
    const name = filename.replace('.md', '');
    
    // Extract keywords from content
    const keywords = this.extractKeywords(content);
    
    // Determine file patterns based on agent type
    const filePatterns = this.getFilePatterns(name);
    
    // Define context priorities
    const contextPriorities = this.getContextPriorities(name);
    
    // Determine max context size based on agent type
    const maxContextSize = this.getMaxContextSize(name);
    
    // Define required and optional fields
    const { requiredFields, optionalFields } = this.getContextFields(name);
    
    // Define exclude patterns
    const excludePatterns = this.getExcludePatterns(name);
    
    return {
      name,
      keywords,
      filePatterns,
      contextPriorities,
      maxContextSize,
      requiredFields,
      optionalFields,
      excludePatterns
    };
  }

  /**
   * Extract keywords from agent description
   */
  private extractKeywords(content: string): string[] {
    const keywords: string[] = [];
    
    // Extract from title and descriptions
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.startsWith('#') || line.includes('specialize') || line.includes('expert')) {
        const words = line.toLowerCase()
          .replace(/[^a-z\s]/g, ' ')
          .split(/\s+/)
          .filter(word => word.length > 3);
        keywords.push(...words);
      }
    }
    
    return [...new Set(keywords)];
  }

  /**
   * Get file patterns relevant to agent type
   */
  private getFilePatterns(agentName: string): string[] {
    const patterns: Record<string, string[]> = {
      'frontend-specialist': ['*.tsx', '*.jsx', '*.css', '*.scss', '*.html', '*.vue'],
      'backend-specialist': ['*.js', '*.ts', '*.py', '*.go', '*.java', '*.php'],
      'database-specialist': ['*.sql', '*.json', '*.yaml', '*.yml', 'migrations/*'],
      'devops-specialist': ['Dockerfile', '*.yml', '*.yaml', 'deploy/*', 'scripts/*'],
      'testing-specialist': ['*.test.*', '*.spec.*', '__tests__/*', 'tests/*'],
      'security-specialist': ['*.env*', 'secrets/*', 'auth/*', 'security/*'],
      'mobile-specialist': ['*.swift', '*.kt', '*.dart', '*.java', 'android/*', 'ios/*']
    };
    
    return patterns[agentName] || ['*'];
  }

  /**
   * Get context priorities for agent type
   */
  private getContextPriorities(agentName: string): Record<string, number> {
    const priorities: Record<string, Record<string, number>> = {
      'frontend-specialist': {
        'ui': 10, 'components': 9, 'styling': 9, 'routing': 8, 'state': 8,
        'api': 6, 'database': 3, 'deployment': 4, 'testing': 7
      },
      'backend-specialist': {
        'api': 10, 'database': 9, 'services': 9, 'middleware': 8, 'auth': 8,
        'ui': 3, 'styling': 2, 'frontend': 3, 'testing': 7
      },
      'database-specialist': {
        'database': 10, 'schema': 9, 'queries': 9, 'migrations': 8, 'data': 8,
        'ui': 2, 'styling': 1, 'frontend': 2, 'api': 6
      },
      'devops-specialist': {
        'deployment': 10, 'infrastructure': 9, 'monitoring': 9, 'scaling': 8,
        'ui': 2, 'database': 6, 'api': 6, 'testing': 7
      },
      'testing-specialist': {
        'testing': 10, 'quality': 9, 'coverage': 9, 'automation': 8,
        'ui': 7, 'api': 7, 'database': 6, 'deployment': 5
      }
    };
    
    return priorities[agentName] || {
      'general': 5, 'project': 8, 'tasks': 7, 'structure': 6
    };
  }

  /**
   * Get max context size for agent type
   */
  private getMaxContextSize(agentName: string): number {
    const sizes: Record<string, number> = {
      'frontend-specialist': 60, // More context needed for UI work
      'backend-specialist': 50,
      'database-specialist': 40,
      'devops-specialist': 45,
      'testing-specialist': 55, // Needs to understand full system
      'security-specialist': 35,
      'mobile-specialist': 50
    };
    
    return sizes[agentName] || 40;
  }

  /**
   * Get required and optional context fields
   */
  private getContextFields(agentName: string): { requiredFields: string[]; optionalFields: string[] } {
    const fieldMaps: Record<string, { requiredFields: string[]; optionalFields: string[] }> = {
      'frontend-specialist': {
        requiredFields: ['projectStructure', 'currentTask', 'uiRequirements', 'designSpecs'],
        optionalFields: ['apiEndpoints', 'testRequirements', 'deploymentConfig']
      },
      'backend-specialist': {
        requiredFields: ['projectStructure', 'currentTask', 'apiRequirements', 'databaseSchema'],
        optionalFields: ['uiRequirements', 'deploymentConfig', 'testRequirements']
      },
      'database-specialist': {
        requiredFields: ['currentTask', 'dataRequirements', 'schemaDefinitions'],
        optionalFields: ['apiRequirements', 'projectStructure', 'testRequirements']
      },
      'devops-specialist': {
        requiredFields: ['currentTask', 'deploymentRequirements', 'infrastructure'],
        optionalFields: ['projectStructure', 'testRequirements', 'monitoring']
      }
    };
    
    return fieldMaps[agentName] || {
      requiredFields: ['currentTask', 'projectStructure'],
      optionalFields: ['requirements', 'specifications', 'dependencies']
    };
  }

  /**
   * Get patterns to exclude for agent type
   */
  private getExcludePatterns(agentName: string): string[] {
    const excludes: Record<string, string[]> = {
      'frontend-specialist': ['database_migrations', 'server_logs', 'deployment_scripts'],
      'backend-specialist': ['ui_mockups', 'design_assets', 'frontend_tests'],
      'database-specialist': ['ui_components', 'styling', 'frontend_routing'],
      'devops-specialist': ['ui_tests', 'component_specs', 'design_requirements'],
      'testing-specialist': [], // Testing agent needs broad context
      'security-specialist': ['ui_styling', 'design_assets', 'mockups']
    };
    
    return excludes[agentName] || [];
  }

  /**
   * Load default specializations if agent files not found
   */
  private loadDefaultSpecializations(): void {
    const defaultSpecs = [
      'frontend-specialist', 'backend-specialist', 'database-specialist',
      'devops-specialist', 'testing-specialist', 'security-specialist'
    ];
    
    for (const name of defaultSpecs) {
      const spec = this.parseAgentSpecialization(`${name}.md`, '');
      this.agentSpecs.set(name, spec);
    }
  }

  /**
   * Filter context for specific agent
   */
  async filterContext(
    agentId: string, 
    originalContext: any, 
    currentMemoryUsage: number = 0,
    systemLoad: number = 0
  ): Promise<FilteredContext> {
    
    // Get agent specialization
    const agentSpec = this.agentSpecs.get(agentId);
    if (!agentSpec && this.config.enableSpecializationFiltering) {
      console.warn(`No specialization found for agent: ${agentId}, using generic filtering`);
    }

    // Convert context to analyzable elements
    const contextElements = this.analyzeContext(originalContext, agentSpec);
    
    // Apply filters
    let filteredElements = contextElements;
    
    if (this.config.enableSpecializationFiltering && agentSpec) {
      filteredElements = this.applySpecializationFilter(filteredElements, agentSpec);
    }
    
    if (this.config.memoryAwareFiltering) {
      filteredElements = this.applyMemoryAwareFilter(filteredElements, currentMemoryUsage, systemLoad);
    }
    
    // Apply importance threshold
    filteredElements = filteredElements.filter(elem => 
      elem.importance >= this.config.contextImportanceThreshold
    );
    
    // Apply size limits
    filteredElements = this.applySizeLimit(filteredElements, agentSpec?.maxContextSize || this.config.maxContextPerAgent);
    
    // Reconstruct filtered context
    const filtered = this.reconstructContext(filteredElements);
    const originalSize = this.calculateContextSize(originalContext);
    const filteredSize = this.calculateContextSize(filtered);
    const reductionRatio = 1 - (filteredSize / originalSize);
    
    const result: FilteredContext = {
      agentId,
      original: originalContext,
      filtered,
      reductionRatio,
      removedElements: contextElements
        .filter(elem => !filteredElements.includes(elem))
        .map(elem => elem.key),
      importanceScores: this.getImportanceScores(filteredElements),
      memoryUsage: filteredSize,
      adaptations: [...this.adaptations]
    };
    
    this.adaptations = []; // Reset adaptations for next call
    this.emit('contextFiltered', result);
    
    return result;
  }

  /**
   * Analyze context and create scoreable elements
   */
  private analyzeContext(context: any, agentSpec?: AgentSpecialization): ContextElement[] {
    const elements: ContextElement[] = [];
    
    const analyzeObject = (obj: any, keyPath: string = '', category: string = 'general') => {
      if (typeof obj !== 'object' || obj === null) return;
      
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = keyPath ? `${keyPath}.${key}` : key;
        const size = this.calculateSize(value);
        
        // Determine category
        const elemCategory = this.categorizeElement(fullKey, value);
        
        // Calculate base importance
        const importance = this.calculateImportance(fullKey, value, agentSpec);
        
        // Calculate relevance to agent
        const relevance = agentSpec ? this.calculateRelevance(fullKey, value, agentSpec) : 0.5;
        
        // Calculate agent-specific relevance scores
        const agentRelevance: Record<string, number> = {};
        for (const [specName, spec] of this.agentSpecs) {
          agentRelevance[specName] = this.calculateRelevance(fullKey, value, spec);
        }
        
        elements.push({
          key: fullKey,
          content: value,
          size,
          importance,
          relevance,
          category: elemCategory,
          lastAccessed: new Date(),
          agentRelevance
        });
        
        // Recursively analyze objects
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          analyzeObject(value, fullKey, elemCategory);
        }
      }
    };
    
    analyzeObject(context);
    return elements;
  }

  /**
   * Categorize context element
   */
  private categorizeElement(key: string, value: any): string {
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('ui') || keyLower.includes('component') || keyLower.includes('style')) return 'ui';
    if (keyLower.includes('api') || keyLower.includes('endpoint') || keyLower.includes('service')) return 'api';
    if (keyLower.includes('database') || keyLower.includes('schema') || keyLower.includes('data')) return 'database';
    if (keyLower.includes('test') || keyLower.includes('spec') || keyLower.includes('coverage')) return 'testing';
    if (keyLower.includes('deploy') || keyLower.includes('infra') || keyLower.includes('config')) return 'deployment';
    if (keyLower.includes('auth') || keyLower.includes('security') || keyLower.includes('permission')) return 'security';
    if (keyLower.includes('task') || keyLower.includes('todo') || keyLower.includes('requirement')) return 'task';
    if (keyLower.includes('project') || keyLower.includes('structure') || keyLower.includes('meta')) return 'project';
    
    return 'general';
  }

  /**
   * Calculate importance score for context element
   */
  private calculateImportance(key: string, value: any, agentSpec?: AgentSpecialization): number {
    let score = 0.5; // Base score
    
    // Required fields get high importance
    if (agentSpec?.requiredFields.some(field => key.includes(field))) {
      score += 0.4;
    }
    
    // Current task and active work get higher priority
    if (key.includes('currentTask') || key.includes('activeWork')) {
      score += 0.3;
    }
    
    // Recent or frequently accessed items
    if (key.includes('recent') || key.includes('active') || key.includes('current')) {
      score += 0.2;
    }
    
    // Size penalty for very large items
    const size = this.calculateSize(value);
    if (size > 10000) { // 10KB+
      score -= 0.1;
    }
    
    // Bonus for structured data
    if (typeof value === 'object' && value !== null) {
      score += 0.1;
    }
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate relevance to specific agent
   */
  private calculateRelevance(key: string, value: any, agentSpec: AgentSpecialization): number {
    let relevance = 0;
    
    // Check against agent keywords
    const keyLower = key.toLowerCase();
    const contentStr = JSON.stringify(value).toLowerCase();
    
    for (const keyword of agentSpec.keywords) {
      if (keyLower.includes(keyword) || contentStr.includes(keyword)) {
        relevance += 0.1;
      }
    }
    
    // Check against context priorities
    for (const [priority, weight] of Object.entries(agentSpec.contextPriorities)) {
      if (keyLower.includes(priority)) {
        relevance += weight / 10;
      }
    }
    
    // Check exclude patterns
    for (const pattern of agentSpec.excludePatterns) {
      if (keyLower.includes(pattern)) {
        relevance -= 0.3;
      }
    }
    
    return Math.max(0, Math.min(1, relevance));
  }

  /**
   * Apply specialization-based filtering
   */
  private applySpecializationFilter(elements: ContextElement[], agentSpec: AgentSpecialization): ContextElement[] {
    const filtered: ContextElement[] = [];
    
    for (const element of elements) {
      // Always include required fields
      if (agentSpec.requiredFields.some(field => element.key.includes(field))) {
        filtered.push(element);
        continue;
      }
      
      // Filter by relevance threshold
      if (element.relevance >= 0.3) {
        filtered.push(element);
        continue;
      }
      
      // Include high importance items regardless of specialization
      if (element.importance >= 0.8) {
        filtered.push(element);
      }
    }
    
    this.adaptations.push(`Specialization filtering: ${elements.length} -> ${filtered.length} elements`);
    return filtered;
  }

  /**
   * Apply memory-aware filtering
   */
  private applyMemoryAwareFilter(elements: ContextElement[], currentMemoryUsage: number, systemLoad: number): ContextElement[] {
    if (!this.config.adaptiveReduction || currentMemoryUsage < this.config.globalMaxContext * 0.7) {
      return elements;
    }
    
    // Calculate reduction factor based on memory pressure
    const memoryPressure = currentMemoryUsage / this.config.globalMaxContext;
    const loadPressure = systemLoad / 100;
    const totalPressure = Math.max(memoryPressure, loadPressure);
    
    let reductionFactor = 1;
    if (totalPressure > 0.9) {
      reductionFactor = 0.4; // Keep only 40%
    } else if (totalPressure > 0.8) {
      reductionFactor = 0.6; // Keep 60%
    } else if (totalPressure > 0.7) {
      reductionFactor = 0.8; // Keep 80%
    }
    
    if (reductionFactor < 1) {
      // Sort by combined importance and relevance score
      elements.sort((a, b) => {
        const scoreA = (a.importance + a.relevance) / 2;
        const scoreB = (b.importance + b.relevance) / 2;
        return scoreB - scoreA;
      });
      
      const keepCount = Math.floor(elements.length * reductionFactor);
      const filtered = elements.slice(0, keepCount);
      
      this.adaptations.push(`Memory-aware filtering: reduced to ${(reductionFactor * 100).toFixed(0)}% due to memory pressure`);
      return filtered;
    }
    
    return elements;
  }

  /**
   * Apply size limits to filtered elements
   */
  private applySizeLimit(elements: ContextElement[], maxSizeMB: number): ContextElement[] {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    let totalSize = 0;
    const result: ContextElement[] = [];
    
    // Sort by importance * relevance score
    const sorted = elements.sort((a, b) => {
      const scoreA = a.importance * (1 + a.relevance);
      const scoreB = b.importance * (1 + b.relevance);
      return scoreB - scoreA;
    });
    
    for (const element of sorted) {
      if (totalSize + element.size <= maxSizeBytes) {
        result.push(element);
        totalSize += element.size;
      } else {
        // Check if this is a required field and we can make room
        const isRequired = element.key.includes('currentTask') || 
                          element.key.includes('projectStructure') ||
                          element.importance > 0.8;
        
        if (isRequired && result.length > 0) {
          // Remove least important non-required element to make room
          let removedSize = 0;
          for (let i = result.length - 1; i >= 0; i--) {
            if (result[i].importance < 0.8) {
              removedSize += result[i].size;
              result.splice(i, 1);
              
              if (removedSize >= element.size) break;
            }
          }
          
          if (totalSize - removedSize + element.size <= maxSizeBytes) {
            result.push(element);
            totalSize = totalSize - removedSize + element.size;
          }
        }
      }
    }
    
    if (result.length < elements.length) {
      this.adaptations.push(`Size limit applied: ${elements.length} -> ${result.length} elements (${(totalSize / 1024 / 1024).toFixed(1)}MB)`);
    }
    
    return result;
  }

  /**
   * Reconstruct context from filtered elements
   */
  private reconstructContext(elements: ContextElement[]): any {
    const result: any = {};
    
    for (const element of elements) {
      const keyParts = element.key.split('.');
      let current = result;
      
      for (let i = 0; i < keyParts.length - 1; i++) {
        if (!(keyParts[i] in current)) {
          current[keyParts[i]] = {};
        }
        current = current[keyParts[i]];
      }
      
      current[keyParts[keyParts.length - 1]] = element.content;
    }
    
    return result;
  }

  /**
   * Calculate size of any value
   */
  private calculateSize(value: any): number {
    return Buffer.byteLength(JSON.stringify(value), 'utf8');
  }

  /**
   * Calculate total context size
   */
  private calculateContextSize(context: any): number {
    return this.calculateSize(context);
  }

  /**
   * Get importance scores from filtered elements
   */
  private getImportanceScores(elements: ContextElement[]): Record<string, number> {
    const scores: Record<string, number> = {};
    for (const element of elements) {
      scores[element.key] = element.importance;
    }
    return scores;
  }

  /**
   * Get filtering statistics
   */
  getFilterStats(): any {
    return {
      agentSpecializations: this.agentSpecs.size,
      cachedContexts: this.contextCache.size,
      currentMemoryUsage: this.memoryUsage,
      config: this.config
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ContextFilterConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    console.log('🔧 Context Filter configuration updated');
    this.emit('configUpdated', { oldConfig, newConfig: this.config });
  }

  /**
   * Add or update agent specialization
   */
  addAgentSpecialization(spec: AgentSpecialization): void {
    this.agentSpecs.set(spec.name, spec);
    console.log(`📋 Added agent specialization: ${spec.name}`);
    this.emit('specializationAdded', spec);
  }

  /**
   * Get recommended context size for current system state
   */
  getRecommendedContextSize(agentId: string, systemLoad: number, memoryUsage: number): number {
    const agentSpec = this.agentSpecs.get(agentId);
    const baseSize = agentSpec?.maxContextSize || this.config.maxContextPerAgent;
    
    // Adjust based on system conditions
    const memoryFactor = Math.max(0.3, 1 - (memoryUsage / this.config.globalMaxContext));
    const loadFactor = Math.max(0.3, 1 - (systemLoad / 100));
    
    const adjustedSize = baseSize * memoryFactor * loadFactor;
    
    return Math.max(10, Math.floor(adjustedSize)); // Minimum 10MB
  }
}

export default AgentContextFilter;