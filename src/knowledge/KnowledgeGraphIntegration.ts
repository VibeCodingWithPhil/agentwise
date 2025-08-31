/**
 * Knowledge Graph Integration
 * Experimental: Integrates the Knowledge Graph system with the existing context system
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';

import { KnowledgeGraphGenerator } from './KnowledgeGraphGenerator';
import { KnowledgeGraphStore } from './KnowledgeGraphStore';
import { KnowledgeGraphQuery } from './KnowledgeGraphQuery';
import { CodebaseContextManager, ProjectContext, FileContext } from '../context/CodebaseContextManager';

import {
  KnowledgeGraph,
  KnowledgeNode,
  AnalysisConfig,
  UpdateResult,
  KnowledgeGraphEvent
} from './types';

export interface KnowledgeGraphIntegrationConfig {
  enableAutoGeneration: boolean;
  enableIncrementalUpdates: boolean;
  generateKnowledgeFiles: boolean;
  knowledgeFileFormat: 'markdown' | 'json';
  analysisConfig: Partial<AnalysisConfig>;
  storageConfig: {
    basePath: string;
    enableCompression: boolean;
    maxCacheSize: number;
  };
}

export class KnowledgeGraphIntegration extends EventEmitter {
  private generator: KnowledgeGraphGenerator;
  private store: KnowledgeGraphStore;
  private query: KnowledgeGraphQuery;
  private contextManager: CodebaseContextManager;
  private config: KnowledgeGraphIntegrationConfig;
  private projectGraphs: Map<string, string> = new Map(); // projectPath -> graphId
  private isInitialized: boolean = false;

  constructor(
    contextManager: CodebaseContextManager,
    config: Partial<KnowledgeGraphIntegrationConfig> = {}
  ) {
    super();
    
    this.contextManager = contextManager;
    this.config = {
      enableAutoGeneration: true,
      enableIncrementalUpdates: true,
      generateKnowledgeFiles: true,
      knowledgeFileFormat: 'markdown',
      analysisConfig: {
        includeTests: true,
        includeNodeModules: false,
        analysisDepth: 'medium',
        enableSemanticAnalysis: true,
        enablePatternDetection: true,
        enableErrorDetection: true
      },
      storageConfig: {
        basePath: '.knowledge',
        enableCompression: false,
        maxCacheSize: 100
      },
      ...config
    };

    // Initialize components
    this.generator = new KnowledgeGraphGenerator(this.config.analysisConfig);
    this.store = new KnowledgeGraphStore(this.config.storageConfig.basePath);
    this.query = new KnowledgeGraphQuery(this.store);

    this.setupEventHandlers();
  }

  /**
   * Initialize the knowledge graph integration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🧠 Initializing Knowledge Graph Integration...');

    // Initialize storage
    await this.store.initialize();

    // Set up context manager event handlers
    this.setupContextIntegration();

    this.isInitialized = true;
    console.log('  ✅ Knowledge Graph Integration initialized');

    this.emit('integration_ready');
  }

  /**
   * Generate knowledge graph for a project
   */
  async generateProjectKnowledgeGraph(projectPath: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Knowledge Graph Integration not initialized');
    }

    console.log(`🧠 Generating knowledge graph for project: ${path.basename(projectPath)}`);

    // Generate the knowledge graph
    const graph = await this.generator.generateGraph(projectPath);

    // Store the graph
    await this.store.storeGraph(graph);

    // Map project to graph
    this.projectGraphs.set(projectPath, graph.id);

    // Generate knowledge files if enabled
    if (this.config.generateKnowledgeFiles) {
      await this.generateKnowledgeFiles(graph);
    }

    // Initialize context manager for this project if not already done
    const projectContext = await this.contextManager.initializeProjectContext(projectPath);

    console.log(`  ✅ Knowledge graph generated: ${graph.id}`);
    console.log(`  📊 ${graph.nodes.size} nodes, ${graph.relationships.size} relationships`);

    this.emit('graph_generated', { projectPath, graphId: graph.id, graph });

    return graph.id;
  }

  /**
   * Update knowledge graph for changed files
   */
  async updateKnowledgeGraph(projectPath: string, changedFiles: string[]): Promise<UpdateResult | null> {
    const graphId = this.projectGraphs.get(projectPath);
    if (!graphId) {
      console.log('No knowledge graph found for project, generating new one...');
      await this.generateProjectKnowledgeGraph(projectPath);
      return null;
    }

    console.log(`🔄 Updating knowledge graph for ${changedFiles.length} changed files...`);

    const result = await this.generator.updateGraph(
      await this.store.loadGraph(graphId)!,
      changedFiles
    );

    // Update stored graph
    const updatedGraph = await this.store.loadGraph(graphId);
    if (updatedGraph) {
      await this.store.storeGraph(updatedGraph);

      // Update knowledge files for changed nodes
      if (this.config.generateKnowledgeFiles) {
        await this.updateKnowledgeFiles(updatedGraph, [...result.added, ...result.modified]);
      }
    }

    console.log(`  ✅ Knowledge graph updated: +${result.added.length} -${result.removed.length} ~${result.modified.length}`);

    this.emit('graph_updated', { projectPath, graphId, result });

    return result;
  }

  /**
   * Query knowledge graph
   */
  async queryProject(projectPath: string, query: any): Promise<any> {
    const graphId = this.projectGraphs.get(projectPath);
    if (!graphId) {
      throw new Error(`No knowledge graph found for project: ${projectPath}`);
    }

    return await this.query.executeQuery(graphId, query);
  }

  /**
   * Get project knowledge graph
   */
  async getProjectGraph(projectPath: string): Promise<KnowledgeGraph | undefined> {
    const graphId = this.projectGraphs.get(projectPath);
    if (!graphId) return undefined;

    return await this.store.loadGraph(graphId);
  }

  /**
   * Get knowledge summary for a file
   */
  async getFileKnowledge(projectPath: string, filePath: string): Promise<KnowledgeNode[]> {
    const graphId = this.projectGraphs.get(projectPath);
    if (!graphId) return [];

    const relativePath = path.relative(projectPath, filePath);
    return await this.store.searchNodes(graphId, { path: relativePath });
  }

  /**
   * Find related files
   */
  async findRelatedFiles(projectPath: string, filePath: string, maxResults: number = 10): Promise<{
    file: string;
    relationship: string;
    score: number;
  }[]> {
    const graphId = this.projectGraphs.get(projectPath);
    if (!graphId) return [];

    // Get nodes for the file
    const relativePath = path.relative(projectPath, filePath);
    const fileNodes = await this.store.searchNodes(graphId, { path: relativePath });
    
    if (fileNodes.length === 0) return [];

    const relations: { file: string; relationship: string; score: number }[] = [];

    for (const node of fileNodes) {
      // Get neighbors using findNodesInRadius
      const neighbors = await this.query.findNodesInRadius(graphId, node.id, 2);
      
      for (const [neighborId, distance] of neighbors) {
        const neighborNode = (await this.store.loadGraph(graphId))?.nodes.get(neighborId);
        const neighborPath = (neighborNode?.metadata as any)?.path;
        if (neighborNode && neighborPath && neighborPath !== filePath) {
          const relationships = await this.store.findRelationships(graphId, node.id);
          const directRelationship = relationships.find(
            r => r.from === neighborId || r.to === neighborId
          );
          
          if (directRelationship) {
            relations.push({
              file: neighborPath,
              relationship: directRelationship.type,
              score: directRelationship.weight
            });
          }
        }
      }
    }

    // Sort by score and limit results
    relations.sort((a, b) => b.score - a.score);
    return relations.slice(0, maxResults);
  }

  /**
   * Get module dependencies
   */
  async getModuleDependencies(projectPath: string, modulePath: string): Promise<{
    dependencies: string[];
    dependents: string[];
    circularDependencies: string[][];
  }> {
    const graphId = this.projectGraphs.get(projectPath);
    if (!graphId) {
      return { dependencies: [], dependents: [], circularDependencies: [] };
    }

    const relativePath = path.relative(projectPath, modulePath);
    const nodes = await this.store.searchNodes(graphId, { path: relativePath });
    
    if (nodes.length === 0) {
      return { dependencies: [], dependents: [], circularDependencies: [] };
    }

    const node = nodes[0];
    
    // Get dependencies (outgoing relationships)
    const outgoingRels = await this.store.findRelationships(graphId, node.id, 'imports', 'outgoing');
    const dependencies = outgoingRels.map(rel => {
      const targetNode = this.store.loadGraph(graphId).then(g => g?.nodes.get(rel.to));
      return targetNode;
    }).filter(Boolean);

    // Get dependents (incoming relationships)
    const incomingRels = await this.store.findRelationships(graphId, node.id, 'imports', 'incoming');
    const dependents = incomingRels.map(rel => {
      const sourceNode = this.store.loadGraph(graphId).then(g => g?.nodes.get(rel.from));
      return sourceNode;
    }).filter(Boolean);

    // Detect circular dependencies (simplified)
    const circularDependencies: string[][] = [];
    // This would require a more sophisticated cycle detection algorithm

    return {
      dependencies: await Promise.all(dependencies).then(deps => 
        deps.filter(Boolean).map(d => d!.path)
      ),
      dependents: await Promise.all(dependents).then(deps => 
        deps.filter(Boolean).map(d => d!.path)
      ),
      circularDependencies
    };
  }

  /**
   * Enhance context with knowledge graph data
   */
  async enhanceProjectContext(projectContext: ProjectContext): Promise<ProjectContext> {
    const graphId = this.projectGraphs.get(projectContext.root);
    if (!graphId) return projectContext;

    const graph = await this.store.loadGraph(graphId);
    if (!graph) return projectContext;

    // Add knowledge graph statistics to context
    const enhancedContext = {
      ...projectContext,
      knowledgeGraph: {
        id: graphId,
        nodes: graph.nodes.size,
        relationships: graph.relationships.size,
        lastUpdated: graph.lastUpdated,
        statistics: graph.statistics
      }
    };

    return enhancedContext;
  }

  /**
   * Generate knowledge files (.kg.md files)
   */
  private async generateKnowledgeFiles(graph: KnowledgeGraph): Promise<void> {
    const knowledgeDir = path.join(graph.projectPath, '.knowledge');
    await fs.ensureDir(knowledgeDir);

    console.log('📝 Generating knowledge files...');

    let generatedFiles = 0;

    for (const [nodeId, node] of graph.nodes) {
      const knowledgeContent = this.generateNodeKnowledgeContent(node, graph);
      
      // Create directory structure mirroring the source
      const relativeDirs = path.dirname(node.relativePath);
      const targetDir = path.join(knowledgeDir, relativeDirs);
      await fs.ensureDir(targetDir);

      // Generate knowledge file
      const knowledgeFile = path.join(targetDir, `${path.basename(node.relativePath)}.kg.md`);
      await fs.writeFile(knowledgeFile, knowledgeContent);
      
      generatedFiles++;
    }

    // Generate index file
    const indexContent = this.generateIndexContent(graph);
    await fs.writeFile(path.join(knowledgeDir, 'index.md'), indexContent);

    console.log(`  ✅ Generated ${generatedFiles} knowledge files`);
  }

  /**
   * Update specific knowledge files
   */
  private async updateKnowledgeFiles(graph: KnowledgeGraph, nodeIds: string[]): Promise<void> {
    const knowledgeDir = path.join(graph.projectPath, '.knowledge');

    for (const nodeId of nodeIds) {
      const node = graph.nodes.get(nodeId);
      if (!node) continue;

      const knowledgeContent = this.generateNodeKnowledgeContent(node, graph);
      
      const relativeDirs = path.dirname(node.relativePath);
      const targetDir = path.join(knowledgeDir, relativeDirs);
      await fs.ensureDir(targetDir);

      const knowledgeFile = path.join(targetDir, `${path.basename(node.relativePath)}.kg.md`);
      await fs.writeFile(knowledgeFile, knowledgeContent);
    }

    // Update index
    const indexContent = this.generateIndexContent(graph);
    await fs.writeFile(path.join(knowledgeDir, 'index.md'), indexContent);
  }

  /**
   * Generate knowledge content for a node
   */
  private generateNodeKnowledgeContent(node: KnowledgeNode, graph: KnowledgeGraph): string {
    const sections = [
      `# ${node.name}`,
      '',
      `**Type**: ${node.type}`,
      `**Path**: \`${node.relativePath}\``,
      `**Language**: ${node.metadata.language}`,
      `**Last Modified**: ${node.lastModified.toISOString()}`,
      `**Size**: ${node.size} bytes`,
      '',
      '## Purpose',
      node.semantics.purpose || 'No purpose documented',
      '',
      '## Metadata',
      `- **Lines of Code**: ${node.metadata.linesOfCode}`,
      `- **Complexity**: ${node.metadata.cyclomaticComplexity || 'N/A'}`,
      `- **Maintainability Index**: ${node.metadata.maintainabilityIndex || 'N/A'}`,
      '',
      '## Exports',
      ...(node.metadata.exports.length > 0 ? 
        node.metadata.exports.map(exp => `- **${exp.name}** (${exp.type}): ${exp.signature || 'No signature'}`) :
        ['None']
      ),
      '',
      '## Imports',
      ...(node.metadata.imports.length > 0 ?
        node.metadata.imports.map(imp => `- ${imp.module} (${imp.type})`) :
        ['None']
      ),
      '',
      '## Operations',
      ...(node.semantics.operations.length > 0 ?
        node.semantics.operations.map(op => 
          `- **${op.name}** (${op.type}): ${op.inputs.length} inputs, ${op.outputs.length} outputs`
        ) :
        ['None documented']
      ),
      '',
      '## Data Flow',
      `**Inputs**: ${node.semantics.dataFlow.inputs.join(', ') || 'None'}`,
      `**Outputs**: ${node.semantics.dataFlow.outputs.join(', ') || 'None'}`,
      `**Transforms**: ${node.semantics.dataFlow.transforms.length} transformations`,
      '',
      '## Patterns',
      ...(node.semantics.patterns.length > 0 ?
        node.semantics.patterns.map(pattern => 
          `- **${pattern.name}** (${pattern.type}): ${pattern.description} (confidence: ${pattern.confidence})`
        ) :
        ['No patterns detected']
      ),
      '',
      '## Responsibilities',
      ...(node.semantics.responsibilities.length > 0 ?
        node.semantics.responsibilities.map(resp => `- ${resp}`) :
        ['None documented']
      ),
      '',
      '## Tags',
      node.tags.map(tag => `\`${tag}\``).join(', ') || 'None',
      '',
      '## Errors',
      ...(node.errors.length > 0 ?
        node.errors.map(error => 
          `- **${error.type}** (${error.severity}): ${error.message}`
        ) :
        ['No errors detected']
      ),
      '',
      '## Relationships',
      // This would be populated by analyzing relationships
      'See graph visualization for relationship details.',
      '',
      '---',
      `*Generated by Agentwise Knowledge Graph on ${new Date().toISOString()}*`
    ];

    return sections.join('\n');
  }

  /**
   * Generate index content for the knowledge graph
   */
  private generateIndexContent(graph: KnowledgeGraph): string {
    const nodesByType = new Map<string, KnowledgeNode[]>();
    
    for (const node of graph.nodes.values()) {
      if (!nodesByType.has(node.type)) {
        nodesByType.set(node.type, []);
      }
      nodesByType.get(node.type)!.push(node);
    }

    const sections = [
      `# Knowledge Graph Index`,
      `*Project: ${graph.metadata.projectName}*`,
      '',
      '## Overview',
      `- **Total Nodes**: ${graph.nodes.size}`,
      `- **Total Relationships**: ${graph.relationships.size}`,
      `- **Language**: ${graph.metadata.language}`,
      `- **Framework**: ${graph.metadata.framework || 'None'}`,
      `- **Last Updated**: ${graph.lastUpdated.toISOString()}`,
      `- **Version**: ${graph.version}`,
      '',
      '## Statistics',
      `- **Average Connectivity**: ${graph.statistics.averageConnectivity.toFixed(2)}`,
      `- **Max Depth**: ${graph.statistics.maxDepth}`,
      `- **Total Dependencies**: ${graph.statistics.dependencyMetrics.totalDependencies}`,
      `- **External Dependencies**: ${graph.statistics.dependencyMetrics.externalDependencies}`,
      `- **Internal Dependencies**: ${graph.statistics.dependencyMetrics.internalDependencies}`,
      '',
      '## Nodes by Type'
    ];

    for (const [type, nodes] of nodesByType) {
      sections.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)} (${nodes.length})`);
      sections.push('');
      
      for (const node of nodes.slice(0, 20)) { // Limit to first 20 per type
        const knowledgeFile = `${node.relativePath}.kg.md`;
        sections.push(`- [${node.name}](${knowledgeFile}) - ${node.semantics.purpose || 'No description'}`);
      }
      
      if (nodes.length > 20) {
        sections.push(`- ... and ${nodes.length - 20} more`);
      }
      
      sections.push('');
    }

    sections.push(
      '## Error Summary',
      ''
    );

    for (const [errorType, count] of Object.entries(graph.statistics.errorFrequency)) {
      sections.push(`- **${errorType}**: ${count} occurrences`);
    }

    sections.push(
      '',
      '## Pattern Summary',
      ''
    );

    for (const [pattern, count] of Object.entries(graph.statistics.patternFrequency)) {
      sections.push(`- **${pattern}**: ${count} occurrences`);
    }

    sections.push(
      '',
      '---',
      `*Generated by Agentwise Knowledge Graph on ${new Date().toISOString()}*`
    );

    return sections.join('\n');
  }

  /**
   * Set up event handlers
   */
  private setupEventHandlers(): void {
    this.generator.on('progress', (event) => {
      this.emit('analysis_progress', event);
    });

    this.generator.on('graph_generated', (event) => {
      this.emit('graph_ready', event);
    });

    this.store.on('graph_stored', (event) => {
      this.emit('storage_updated', event);
    });
  }

  /**
   * Set up context integration
   */
  private setupContextIntegration(): void {
    // Listen for context updates
    this.contextManager.on('context-updated', async (event) => {
      if (this.config.enableIncrementalUpdates) {
        const projectPath = event.project;
        const update = event.update;
        
        if (update.type === 'file-modified' || update.type === 'file-added') {
          await this.updateKnowledgeGraph(projectPath, [update.path]);
        }
      }
    });

    // Listen for context ready events
    this.contextManager.on('context-ready', async (event) => {
      if (this.config.enableAutoGeneration) {
        const projectPath = event.project;
        
        // Generate knowledge graph if not exists
        if (!this.projectGraphs.has(projectPath)) {
          await this.generateProjectKnowledgeGraph(projectPath);
        }
      }
    });
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.removeAllListeners();
    this.generator.removeAllListeners();
    this.store.removeAllListeners();
  }
}