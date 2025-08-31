/**
 * Knowledge Graph Command Handler
 * Integrates knowledge graph functionality with Agentwise command system
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { CodebaseContextManager } from '../context/CodebaseContextManager';
import { 
  KnowledgeGraphIntegration, 
  KnowledgeQuery,
  DEFAULT_INTEGRATION_CONFIG 
} from '../knowledge';

export class KnowledgeGraphCommand {
  private integration: KnowledgeGraphIntegration;
  private contextManager: CodebaseContextManager;
  private isInitialized: boolean = false;

  constructor(contextManager: CodebaseContextManager) {
    this.contextManager = contextManager;
    this.integration = new KnowledgeGraphIntegration(contextManager, {
      ...DEFAULT_INTEGRATION_CONFIG,
      enableAutoGeneration: true,
      generateKnowledgeFiles: true
    });
  }

  /**
   * Initialize knowledge graph system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.integration.initialize();
    this.isInitialized = true;
    console.log('🧠 Knowledge Graph system initialized');
  }

  /**
   * Handle /knowledge command
   */
  async handleKnowledgeCommand(args: string[], projectPath: string): Promise<void> {
    await this.initialize();

    if (args.length === 0) {
      await this.showKnowledgeHelp();
      return;
    }

    const subcommand = args[0].toLowerCase();

    switch (subcommand) {
      case 'generate':
        await this.generateKnowledgeGraph(projectPath, args.slice(1));
        break;
      
      case 'query':
        await this.queryKnowledgeGraph(projectPath, args.slice(1));
        break;
      
      case 'analyze':
        await this.analyzeProject(projectPath, args.slice(1));
        break;
      
      case 'related':
        await this.findRelatedFiles(projectPath, args.slice(1));
        break;
      
      case 'dependencies':
        await this.analyzeDependencies(projectPath, args.slice(1));
        break;
      
      case 'similar':
        await this.findSimilarNodes(projectPath, args.slice(1));
        break;
      
      case 'patterns':
        await this.analyzePatterns(projectPath);
        break;
      
      case 'errors':
        await this.analyzeErrors(projectPath);
        break;
      
      case 'stats':
        await this.showStatistics(projectPath);
        break;
      
      case 'search':
        await this.searchKnowledge(projectPath, args.slice(1));
        break;
      
      case 'export':
        await this.exportKnowledge(projectPath, args.slice(1));
        break;
      
      case 'update':
        await this.updateKnowledgeGraph(projectPath, args.slice(1));
        break;

      default:
        console.log(`❌ Unknown knowledge command: ${subcommand}`);
        await this.showKnowledgeHelp();
        break;
    }
  }

  /**
   * Generate knowledge graph for project
   */
  private async generateKnowledgeGraph(projectPath: string, args: string[]): Promise<void> {
    console.log(`🧠 Generating knowledge graph for ${path.basename(projectPath)}...`);
    
    const startTime = Date.now();
    const graphId = await this.integration.generateProjectKnowledgeGraph(projectPath);
    const duration = Date.now() - startTime;

    const graph = await this.integration.getProjectGraph(projectPath);
    if (graph) {
      console.log(`\n✅ Knowledge graph generated successfully!`);
      console.log(`   Graph ID: ${graphId}`);
      console.log(`   Nodes: ${graph.nodes.size}`);
      console.log(`   Relationships: ${graph.relationships.size}`);
      console.log(`   Duration: ${duration}ms`);
      
      if (args.includes('--verbose')) {
        console.log(`\n📊 Detailed Statistics:`);
        console.log(`   Framework: ${graph.metadata.framework || 'None detected'}`);
        console.log(`   Language: ${graph.metadata.language}`);
        console.log(`   Total Files: ${graph.metadata.totalFiles}`);
        console.log(`   Total Lines: ${graph.metadata.totalLines}`);
        console.log(`   Dependencies: ${graph.metadata.dependencies.length}`);
        console.log(`   Average Connectivity: ${graph.statistics.averageConnectivity.toFixed(2)}`);
      }

      // Show knowledge files location
      const knowledgeDir = path.join(projectPath, '.knowledge');
      if (await fs.pathExists(knowledgeDir)) {
        console.log(`\n📄 Knowledge files generated in: ${knowledgeDir}`);
        console.log(`   View index: ${path.join(knowledgeDir, 'index.md')}`);
      }
    }
  }

  /**
   * Query knowledge graph
   */
  private async queryKnowledgeGraph(projectPath: string, args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log('❌ Query type required. Available: classes, components, functions, imports, exports, errors');
      return;
    }

    const queryType = args[0].toLowerCase();
    const limit = args.includes('--limit') ? 
      parseInt(args[args.indexOf('--limit') + 1]) || 10 : 10;

    let query: KnowledgeQuery;

    switch (queryType) {
      case 'classes':
        query = {
          select: { nodes: '*' },
          where: [{ field: 'type', operator: 'equals', value: 'class' }],
          orderBy: [{ field: 'metadata.linesOfCode', direction: 'desc' }],
          limit,
          includeMetadata: true
        };
        break;

      case 'components':
        query = {
          select: { nodes: '*' },
          where: [{ field: 'type', operator: 'equals', value: 'component' }],
          orderBy: [{ field: 'metadata.cyclomaticComplexity', direction: 'desc' }],
          limit,
          includeMetadata: true
        };
        break;

      case 'functions':
        query = {
          select: { nodes: '*' },
          where: [{ field: 'type', operator: 'equals', value: 'function' }],
          orderBy: [{ field: 'metadata.cyclomaticComplexity', direction: 'desc' }],
          limit,
          includeMetadata: true
        };
        break;

      case 'complex':
        query = {
          select: { nodes: '*' },
          where: [{ field: 'metadata.cyclomaticComplexity', operator: 'greater', value: 10 }],
          orderBy: [{ field: 'metadata.cyclomaticComplexity', direction: 'desc' }],
          limit,
          includeMetadata: true
        };
        break;

      case 'errors':
        query = {
          select: { nodes: '*' },
          where: [{ field: 'errors', operator: 'exists', value: true }],
          orderBy: [{ field: 'name', direction: 'asc' }],
          limit,
          includeMetadata: true
        };
        break;

      default:
        console.log(`❌ Unknown query type: ${queryType}`);
        return;
    }

    console.log(`🔍 Querying ${queryType}...`);
    const result = await this.integration.queryProject(projectPath, query);

    console.log(`\n📋 Found ${result.nodes.length} ${queryType}:`);
    for (const node of result.nodes) {
      const complexity = node.metadata.cyclomaticComplexity;
      const loc = node.metadata.linesOfCode;
      const errorCount = node.errors.length;

      console.log(`\n  📁 ${node.name} (${node.type})`);
      console.log(`     Path: ${node.relativePath}`);
      console.log(`     Purpose: ${node.semantics.purpose || 'Not documented'}`);
      
      if (loc) console.log(`     Lines of Code: ${loc}`);
      if (complexity) console.log(`     Complexity: ${complexity}`);
      if (errorCount > 0) console.log(`     Errors: ${errorCount}`);
      
      if (node.semantics.operations.length > 0) {
        console.log(`     Operations: ${node.semantics.operations.map((op: { name: string }) => op.name).join(', ')}`);
      }
      
      if (node.tags.length > 0) {
        console.log(`     Tags: ${node.tags.join(', ')}`);
      }
    }

    console.log(`\n⏱️  Query executed in ${result.executionTime}ms`);
  }

  /**
   * Analyze project structure
   */
  private async analyzeProject(projectPath: string, args: string[]): Promise<void> {
    console.log(`📊 Analyzing project structure...`);

    const graph = await this.integration.getProjectGraph(projectPath);
    if (!graph) {
      console.log('❌ No knowledge graph found. Run `/knowledge generate` first.');
      return;
    }

    // Basic statistics
    console.log(`\n📈 Project Analysis for ${graph.metadata.projectName}:`);
    console.log(`   Total Nodes: ${graph.nodes.size}`);
    console.log(`   Total Relationships: ${graph.relationships.size}`);
    console.log(`   Framework: ${graph.metadata.framework || 'Unknown'}`);
    console.log(`   Language: ${graph.metadata.language}`);

    // Node type distribution
    const nodeTypes = new Map<string, number>();
    for (const node of graph.nodes.values()) {
      nodeTypes.set(node.type, (nodeTypes.get(node.type) || 0) + 1);
    }

    console.log(`\n🏗️  Node Type Distribution:`);
    for (const [type, count] of Array.from(nodeTypes.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`   ${type}: ${count}`);
    }

    // Complexity analysis
    if (graph.statistics.complexityDistribution) {
      console.log(`\n🔧 Complexity Distribution:`);
      for (const [level, count] of Object.entries(graph.statistics.complexityDistribution)) {
        console.log(`   ${level}: ${count} nodes`);
      }
    }

    // Dependency metrics
    const depMetrics = graph.statistics.dependencyMetrics;
    console.log(`\n📦 Dependency Analysis:`);
    console.log(`   Total Dependencies: ${depMetrics.totalDependencies}`);
    console.log(`   External Dependencies: ${depMetrics.externalDependencies}`);
    console.log(`   Internal Dependencies: ${depMetrics.internalDependencies}`);
    
    if (depMetrics.circularDependencies.length > 0) {
      console.log(`   ⚠️  Circular Dependencies: ${depMetrics.circularDependencies.length} detected`);
    }

    // Error summary
    if (Object.keys(graph.statistics.errorFrequency).length > 0) {
      console.log(`\n🚨 Error Summary:`);
      for (const [errorType, count] of Object.entries(graph.statistics.errorFrequency)) {
        console.log(`   ${errorType}: ${count} occurrences`);
      }
    }

    // Pattern summary
    if (Object.keys(graph.statistics.patternFrequency).length > 0) {
      console.log(`\n🎯 Pattern Summary:`);
      for (const [pattern, count] of Object.entries(graph.statistics.patternFrequency)) {
        if (count > 1) {
          console.log(`   ${pattern}: ${count} occurrences`);
        }
      }
    }
  }

  /**
   * Find files related to a specific file
   */
  private async findRelatedFiles(projectPath: string, args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log('❌ File path required. Usage: /knowledge related <file-path>');
      return;
    }

    const filePath = args[0];
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(projectPath, filePath);

    console.log(`🔗 Finding files related to ${path.basename(filePath)}...`);

    const related = await this.integration.findRelatedFiles(projectPath, fullPath, 10);

    if (related.length === 0) {
      console.log('   No related files found.');
      return;
    }

    console.log(`\n📁 Related files (${related.length} found):`);
    for (const relation of related) {
      const relativeFile = path.relative(projectPath, relation.file);
      console.log(`   ${relativeFile}`);
      console.log(`   └─ Relationship: ${relation.relationship} (score: ${relation.score.toFixed(2)})`);
    }
  }

  /**
   * Analyze dependencies for a file or module
   */
  private async analyzeDependencies(projectPath: string, args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log('❌ File path required. Usage: /knowledge dependencies <file-path>');
      return;
    }

    const filePath = args[0];
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(projectPath, filePath);

    console.log(`📦 Analyzing dependencies for ${path.basename(filePath)}...`);

    const deps = await this.integration.getModuleDependencies(projectPath, fullPath);

    console.log(`\n🔽 Dependencies (${deps.dependencies.length}):`);
    for (const dep of deps.dependencies.slice(0, 10)) {
      const relativeDep = path.relative(projectPath, dep);
      console.log(`   ${relativeDep}`);
    }

    if (deps.dependencies.length > 10) {
      console.log(`   ... and ${deps.dependencies.length - 10} more`);
    }

    console.log(`\n🔼 Dependents (${deps.dependents.length}):`);
    for (const dependent of deps.dependents.slice(0, 10)) {
      const relativeDependent = path.relative(projectPath, dependent);
      console.log(`   ${relativeDependent}`);
    }

    if (deps.dependents.length > 10) {
      console.log(`   ... and ${deps.dependents.length - 10} more`);
    }

    if (deps.circularDependencies.length > 0) {
      console.log(`\n⚠️  Circular Dependencies (${deps.circularDependencies.length}):`);
      for (const cycle of deps.circularDependencies.slice(0, 3)) {
        console.log(`   ${cycle.map(c => path.relative(projectPath, c)).join(' → ')}`);
      }
    }
  }

  /**
   * Search knowledge base
   */
  private async searchKnowledge(projectPath: string, args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log('❌ Search term required. Usage: /knowledge search <term>');
      return;
    }

    const searchTerm = args.join(' ');
    const fuzzy = args.includes('--fuzzy');

    console.log(`🔍 Searching for "${searchTerm}"${fuzzy ? ' (fuzzy)' : ''}...`);

    // This would require implementing search in the integration
    // For now, we'll use a basic query approach
    const query: KnowledgeQuery = {
      select: { nodes: '*' },
      where: [
        { field: 'name', operator: 'contains', value: searchTerm },
        { field: 'semantics.purpose', operator: 'contains', value: searchTerm, connector: 'or' }
      ],
      limit: 20,
      includeMetadata: true
    };

    const result = await this.integration.queryProject(projectPath, query);

    console.log(`\n📋 Search Results (${result.nodes.length} found):`);
    for (const node of result.nodes) {
      console.log(`\n  📄 ${node.name} (${node.type})`);
      console.log(`     Path: ${node.relativePath}`);
      console.log(`     Purpose: ${node.semantics.purpose || 'Not documented'}`);
      
      if (node.tags.length > 0) {
        console.log(`     Tags: ${node.tags.join(', ')}`);
      }
    }
  }

  /**
   * Show knowledge graph statistics
   */
  private async showStatistics(projectPath: string): Promise<void> {
    console.log(`📊 Knowledge Graph Statistics`);

    const graph = await this.integration.getProjectGraph(projectPath);
    if (!graph) {
      console.log('❌ No knowledge graph found. Run `/knowledge generate` first.');
      return;
    }

    const stats = graph.statistics;

    console.log(`\n🏗️  Structure:`);
    console.log(`   Nodes: ${graph.nodes.size}`);
    console.log(`   Relationships: ${graph.relationships.size}`);
    console.log(`   Average Connectivity: ${stats.averageConnectivity.toFixed(2)}`);
    console.log(`   Max Depth: ${stats.maxDepth}`);

    console.log(`\n📦 Dependencies:`);
    console.log(`   Total: ${stats.dependencyMetrics.totalDependencies}`);
    console.log(`   External: ${stats.dependencyMetrics.externalDependencies}`);
    console.log(`   Internal: ${stats.dependencyMetrics.internalDependencies}`);
    console.log(`   Circular: ${stats.dependencyMetrics.circularDependencies.length}`);
    console.log(`   Unused: ${stats.dependencyMetrics.unusedDependencies.length}`);

    console.log(`\n🔧 Complexity:`);
    for (const [level, count] of Object.entries(stats.complexityDistribution)) {
      console.log(`   ${level}: ${count} nodes`);
    }

    console.log(`\n🚨 Errors:`);
    for (const [type, count] of Object.entries(stats.errorFrequency)) {
      console.log(`   ${type}: ${count} occurrences`);
    }

    console.log(`\n🎯 Patterns:`);
    for (const [pattern, count] of Object.entries(stats.patternFrequency)) {
      console.log(`   ${pattern}: ${count} occurrences`);
    }

    console.log(`\n📈 Metadata:`);
    console.log(`   Framework: ${graph.metadata.framework || 'Unknown'}`);
    console.log(`   Language: ${graph.metadata.language}`);
    console.log(`   Total Files: ${graph.metadata.totalFiles}`);
    console.log(`   Total Lines: ${graph.metadata.totalLines}`);
    console.log(`   Last Updated: ${graph.lastUpdated.toLocaleString()}`);
    console.log(`   Version: ${graph.version}`);
  }

  /**
   * Update knowledge graph
   */
  private async updateKnowledgeGraph(projectPath: string, args: string[]): Promise<void> {
    const files = args.length > 0 ? 
      args.map(f => path.isAbsolute(f) ? f : path.join(projectPath, f)) : 
      [];

    if (files.length === 0) {
      console.log('🔄 Performing incremental update based on file changes...');
      // This would typically be triggered by file system events
      console.log('   No specific files provided. Use: /knowledge update <file1> <file2> ...');
      return;
    }

    console.log(`🔄 Updating knowledge graph for ${files.length} files...`);

    const result = await this.integration.updateKnowledgeGraph(projectPath, files);
    if (result) {
      console.log(`\n✅ Update completed:`);
      console.log(`   Added: ${result.added.length} nodes`);
      console.log(`   Modified: ${result.modified.length} nodes`);
      console.log(`   Removed: ${result.removed.length} nodes`);
      console.log(`   Duration: ${result.duration}ms`);

      if (result.errors.length > 0) {
        console.log(`\n❌ Errors encountered:`);
        for (const error of result.errors.slice(0, 5)) {
          console.log(`   ${path.basename(error.file)}: ${error.error}`);
        }
        if (result.errors.length > 5) {
          console.log(`   ... and ${result.errors.length - 5} more errors`);
        }
      }
    }
  }

  /**
   * Show help information
   */
  private async showKnowledgeHelp(): Promise<void> {
    console.log(`
🧠 Knowledge Graph Commands
============================

Usage: /knowledge <command> [options]

Commands:
  generate                    Generate knowledge graph for current project
  query <type>               Query nodes by type (classes, components, functions, complex, errors)
  analyze                    Analyze project structure and metrics
  related <file>             Find files related to specified file
  dependencies <file>        Analyze dependencies for specified file
  search <term>              Search knowledge base for term
  stats                      Show knowledge graph statistics
  update [files...]          Update knowledge graph for specific files
  patterns                   Analyze detected patterns
  errors                     Analyze detected errors

Options:
  --limit <n>                Limit results (default: 10)
  --verbose                  Show detailed information
  --fuzzy                    Use fuzzy search (for search command)

Examples:
  /knowledge generate                    # Generate knowledge graph
  /knowledge query classes --limit 5    # Show top 5 classes by size
  /knowledge related src/App.tsx        # Find files related to App.tsx
  /knowledge search "authentication"    # Search for authentication-related code
  /knowledge stats                      # Show comprehensive statistics

The knowledge graph provides:
  ✨ Semantic understanding of your codebase
  🔗 Relationship mapping between modules
  📊 Complexity and quality metrics
  🎯 Pattern and anti-pattern detection
  🚨 Error and issue identification
  📄 Auto-generated documentation
`);
  }

  /**
   * Analyze patterns in the codebase
   */
  private async analyzePatterns(projectPath: string): Promise<void> {
    console.log(`🎯 Analyzing code patterns...`);

    const graph = await this.integration.getProjectGraph(projectPath);
    if (!graph) {
      console.log('❌ No knowledge graph found. Run `/knowledge generate` first.');
      return;
    }

    const patternFreq = graph.statistics.patternFrequency;
    
    if (Object.keys(patternFreq).length === 0) {
      console.log('   No patterns detected in the codebase.');
      return;
    }

    console.log(`\n📊 Pattern Frequency:`);
    const sortedPatterns = Object.entries(patternFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15);

    for (const [pattern, count] of sortedPatterns) {
      console.log(`   ${pattern}: ${count} occurrences`);
    }

    // Find nodes with specific patterns
    const patternQuery: KnowledgeQuery = {
      select: { nodes: '*' },
      where: [{ field: 'semantics.patterns', operator: 'exists', value: true }],
      limit: 5,
      includeMetadata: true
    };

    const nodesWithPatterns = await this.integration.queryProject(projectPath, patternQuery);
    
    if (nodesWithPatterns.nodes.length > 0) {
      console.log(`\n📄 Files with Notable Patterns:`);
      for (const node of nodesWithPatterns.nodes) {
        if (node.semantics.patterns.length > 0) {
          console.log(`   ${node.name}:`);
          for (const pattern of node.semantics.patterns.slice(0, 3)) {
            console.log(`     • ${pattern.name} (${pattern.type}) - confidence: ${pattern.confidence}`);
          }
        }
      }
    }
  }

  /**
   * Analyze errors in the codebase
   */
  private async analyzeErrors(projectPath: string): Promise<void> {
    console.log(`🚨 Analyzing code errors and issues...`);

    const graph = await this.integration.getProjectGraph(projectPath);
    if (!graph) {
      console.log('❌ No knowledge graph found. Run `/knowledge generate` first.');
      return;
    }

    const errorFreq = graph.statistics.errorFrequency;
    
    if (Object.keys(errorFreq).length === 0) {
      console.log('   ✅ No errors detected in the codebase!');
      return;
    }

    console.log(`\n📊 Error Frequency:`);
    const sortedErrors = Object.entries(errorFreq)
      .sort((a, b) => b[1] - a[1]);

    for (const [errorType, count] of sortedErrors) {
      console.log(`   ${errorType}: ${count} occurrences`);
    }

    // Find nodes with errors
    const errorQuery: KnowledgeQuery = {
      select: { nodes: '*' },
      where: [{ field: 'errors', operator: 'exists', value: true }],
      limit: 10,
      includeMetadata: true
    };

    const nodesWithErrors = await this.integration.queryProject(projectPath, errorQuery);
    
    if (nodesWithErrors.nodes.length > 0) {
      console.log(`\n📄 Files with Issues:`);
      for (const node of nodesWithErrors.nodes) {
        if (node.errors.length > 0) {
          console.log(`   ${node.name} (${node.errors.length} issues):`);
          for (const error of node.errors.slice(0, 3)) {
            const severity = error.severity === 'error' ? '❌' : error.severity === 'warning' ? '⚠️' : 'ℹ️';
            console.log(`     ${severity} ${error.type}: ${error.message}`);
            if (error.suggestion) {
              console.log(`       💡 Suggestion: ${error.suggestion}`);
            }
          }
          if (node.errors.length > 3) {
            console.log(`     ... and ${node.errors.length - 3} more issues`);
          }
        }
      }
    }
  }

  /**
   * Export knowledge graph data
   */
  private async exportKnowledge(projectPath: string, args: string[]): Promise<void> {
    const format = args.includes('--json') ? 'json' : 'markdown';
    const outputPath = args.find(arg => !arg.startsWith('--')) || 
      path.join(projectPath, `knowledge-export.${format === 'json' ? 'json' : 'md'}`);

    console.log(`📤 Exporting knowledge graph as ${format}...`);

    const graph = await this.integration.getProjectGraph(projectPath);
    if (!graph) {
      console.log('❌ No knowledge graph found. Run `/knowledge generate` first.');
      return;
    }

    if (format === 'json') {
      // Export as JSON
      const exportData = {
        metadata: graph.metadata,
        statistics: graph.statistics,
        nodes: Array.from(graph.nodes.values()),
        relationships: Array.from(graph.relationships.values()),
        exportedAt: new Date().toISOString()
      };

      await fs.writeJson(outputPath, exportData, { spaces: 2 });
    } else {
      // Export as Markdown
      const sections = [
        `# Knowledge Graph Export`,
        `*Project: ${graph.metadata.projectName}*`,
        `*Exported: ${new Date().toLocaleString()}*`,
        '',
        '## Overview',
        `- **Nodes**: ${graph.nodes.size}`,
        `- **Relationships**: ${graph.relationships.size}`,
        `- **Framework**: ${graph.metadata.framework || 'Unknown'}`,
        `- **Language**: ${graph.metadata.language}`,
        '',
        '## Statistics',
        JSON.stringify(graph.statistics, null, 2),
        '',
        '## Node Summary',
        ''
      ];

      const nodeTypes = new Map<string, number>();
      for (const node of graph.nodes.values()) {
        nodeTypes.set(node.type, (nodeTypes.get(node.type) || 0) + 1);
      }

      for (const [type, count] of nodeTypes) {
        sections.push(`- **${type}**: ${count} nodes`);
      }

      await fs.writeFile(outputPath, sections.join('\n'));
    }

    console.log(`   ✅ Knowledge graph exported to: ${outputPath}`);
  }

  /**
   * Find similar nodes
   */
  private async findSimilarNodes(projectPath: string, args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log('❌ File path required. Usage: /knowledge similar <file-path>');
      return;
    }

    const filePath = args[0];
    const fullPath = path.isAbsolute(filePath) ? filePath : path.join(projectPath, filePath);

    console.log(`🔍 Finding nodes similar to ${path.basename(filePath)}...`);

    // Get file knowledge to find a node
    const fileNodes = await this.integration.getFileKnowledge(projectPath, fullPath);
    if (fileNodes.length === 0) {
      console.log('   No nodes found for the specified file.');
      return;
    }

    // This would require implementing similarity search in the integration
    // For now, show a placeholder
    console.log(`\n📋 Similarity analysis would be performed for:`);
    for (const node of fileNodes) {
      console.log(`   ${node.name} (${node.type})`);
      console.log(`   Purpose: ${node.semantics.purpose}`);
      console.log(`   Tags: ${node.tags.join(', ')}`);
    }

    console.log(`\n💡 Full similarity analysis coming soon...`);
  }
}