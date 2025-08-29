/**
 * Knowledge Graph System Usage Examples
 * Demonstrates how to use the knowledge graph system with Agentwise
 */

import * as path from 'path';
import { CodebaseContextManager } from '../../context/CodebaseContextManager';
import {
  KnowledgeGraphIntegration,
  KnowledgeGraphQuery,
  KnowledgeQuery,
  DEFAULT_INTEGRATION_CONFIG
} from '../index';

export class KnowledgeGraphExamples {
  private integration: KnowledgeGraphIntegration;
  private contextManager: CodebaseContextManager;

  constructor() {
    this.contextManager = new CodebaseContextManager();
    this.integration = new KnowledgeGraphIntegration(
      this.contextManager,
      DEFAULT_INTEGRATION_CONFIG
    );
  }

  /**
   * Example 1: Basic Knowledge Graph Generation
   */
  async example1_BasicGeneration(): Promise<void> {
    console.log('📚 Example 1: Basic Knowledge Graph Generation');
    console.log('===============================================');

    const projectPath = '/Users/example/my-project';

    // Initialize the integration
    await this.integration.initialize();

    // Generate knowledge graph for a project
    const graphId = await this.integration.generateProjectKnowledgeGraph(projectPath);
    
    console.log(`Generated knowledge graph: ${graphId}`);

    // Get the generated graph
    const graph = await this.integration.getProjectGraph(projectPath);
    if (graph) {
      console.log(`Graph contains ${graph.nodes.size} nodes and ${graph.relationships.size} relationships`);
      console.log(`Framework: ${graph.metadata.framework}`);
      console.log(`Language: ${graph.metadata.language}`);
    }
  }

  /**
   * Example 2: Querying the Knowledge Graph
   */
  async example2_QueryingGraph(): Promise<void> {
    console.log('\n🔍 Example 2: Querying the Knowledge Graph');
    console.log('==========================================');

    const projectPath = '/Users/example/my-project';

    // Ensure graph exists
    await this.integration.generateProjectKnowledgeGraph(projectPath);

    // Example query: Find all TypeScript classes
    const classQuery: KnowledgeQuery = {
      select: { nodes: '*' },
      where: [
        { field: 'type', operator: 'equals', value: 'class' },
        { field: 'metadata.language', operator: 'equals', value: 'typescript', connector: 'and' }
      ],
      orderBy: [
        { field: 'metadata.linesOfCode', direction: 'desc' }
      ],
      limit: 10,
      includeRelationships: true,
      includeMetadata: true
    };

    const classResults = await this.integration.queryProject(projectPath, classQuery);
    console.log(`Found ${classResults.nodes.length} TypeScript classes`);

    for (const node of classResults.nodes) {
      console.log(`- ${node.name} (${node.metadata.linesOfCode} LOC, complexity: ${node.metadata.cyclomaticComplexity || 'N/A'})`);
    }

    // Example query: Find components with high complexity
    const complexComponentsQuery: KnowledgeQuery = {
      select: { nodes: '*' },
      where: [
        { field: 'type', operator: 'equals', value: 'component' },
        { field: 'metadata.cyclomaticComplexity', operator: 'greater', value: 10 }
      ],
      orderBy: [
        { field: 'metadata.cyclomaticComplexity', direction: 'desc' }
      ]
    };

    const complexComponents = await this.integration.queryProject(projectPath, complexComponentsQuery);
    console.log(`\nFound ${complexComponents.nodes.length} complex components:`);

    for (const node of complexComponents.nodes) {
      console.log(`- ${node.name} (complexity: ${node.metadata.cyclomaticComplexity})`);
      if (node.errors.length > 0) {
        console.log(`  Errors: ${node.errors.map(e => e.message).join(', ')}`);
      }
    }
  }

  /**
   * Example 3: Finding Related Files and Dependencies
   */
  async example3_FindingRelations(): Promise<void> {
    console.log('\n🔗 Example 3: Finding Related Files and Dependencies');
    console.log('===================================================');

    const projectPath = '/Users/example/my-project';
    const filePath = path.join(projectPath, 'src/components/UserProfile.tsx');

    // Find related files
    const relatedFiles = await this.integration.findRelatedFiles(projectPath, filePath, 5);
    console.log(`Files related to ${path.basename(filePath)}:`);

    for (const relation of relatedFiles) {
      console.log(`- ${path.basename(relation.file)} (${relation.relationship}, score: ${relation.score})`);
    }

    // Get module dependencies
    const dependencies = await this.integration.getModuleDependencies(projectPath, filePath);
    console.log(`\nDependencies for ${path.basename(filePath)}:`);
    console.log(`- Dependencies: ${dependencies.dependencies.length}`);
    console.log(`- Dependents: ${dependencies.dependents.length}`);
    
    if (dependencies.circularDependencies.length > 0) {
      console.log(`- Circular dependencies: ${dependencies.circularDependencies.length} cycles detected`);
    }

    // Get file knowledge
    const fileKnowledge = await this.integration.getFileKnowledge(projectPath, filePath);
    console.log(`\nKnowledge nodes for ${path.basename(filePath)}: ${fileKnowledge.length}`);

    for (const node of fileKnowledge) {
      console.log(`- ${node.type}: ${node.name}`);
      console.log(`  Purpose: ${node.semantics.purpose}`);
      console.log(`  Operations: ${node.semantics.operations.length}`);
      console.log(`  Patterns: ${node.semantics.patterns.map(p => p.name).join(', ') || 'None'}`);
    }
  }

  /**
   * Example 4: Advanced Graph Analysis
   */
  async example4_AdvancedAnalysis(): Promise<void> {
    console.log('\n📊 Example 4: Advanced Graph Analysis');
    console.log('====================================');

    const projectPath = '/Users/example/my-project';
    const graph = await this.integration.getProjectGraph(projectPath);
    
    if (!graph) {
      console.log('No graph found for project');
      return;
    }

    const query = new KnowledgeGraphQuery(this.integration['store']);

    // Find shortest path between two components
    const componentNodes = await this.integration.queryProject(projectPath, {
      select: { nodes: '*' },
      where: [{ field: 'type', operator: 'equals', value: 'component' }],
      limit: 2
    });

    if (componentNodes.nodes.length >= 2) {
      const fromNode = componentNodes.nodes[0];
      const toNode = componentNodes.nodes[1];

      const shortestPath = await query.findShortestPath(
        graph.id,
        fromNode.id,
        toNode.id,
        10,
        ['imports', 'uses', 'calls']
      );

      if (shortestPath) {
        console.log(`Shortest path from ${fromNode.name} to ${toNode.name}:`);
        console.log(`- Path length: ${shortestPath.depth}`);
        console.log(`- Path score: ${shortestPath.score}`);
        console.log(`- Nodes in path: ${shortestPath.nodes.map(n => n.name).join(' → ')}`);
      }
    }

    // Full-text search
    const searchResults = await query.fullTextSearch(
      graph.id,
      'authentication',
      ['name', 'purpose', 'description'],
      true
    );

    console.log(`\nFull-text search for "authentication":`);
    for (const result of searchResults.slice(0, 5)) {
      console.log(`- ${result.node.name} (score: ${result.score.toFixed(2)}, matches: ${result.matches.join(', ')})`);
    }

    // Find nodes in radius
    if (componentNodes.nodes.length > 0) {
      const centerNode = componentNodes.nodes[0];
      const nodesInRadius = await query.findNodesInRadius(graph.id, centerNode.id, 3);

      console.log(`\nNodes within radius 3 of ${centerNode.name}:`);
      const sortedNodes = Array.from(nodesInRadius.entries())
        .sort((a, b) => a[1] - b[1])
        .slice(1, 6); // Exclude the center node itself

      for (const [nodeId, distance] of sortedNodes) {
        const node = graph.nodes.get(nodeId);
        if (node) {
          console.log(`- ${node.name} (distance: ${distance})`);
        }
      }
    }

    // Graph analysis
    const analysis = await query.analyzeGraph(graph.id);
    console.log(`\nGraph Analysis:`);
    console.log(`- Clusters detected: ${analysis.clusters.length}`);
    console.log(`- Strongly connected components: ${analysis.stronglyConnected.length}`);
    console.log(`- Cycles detected: ${analysis.cycleDetection.length}`);

    // Top nodes by centrality
    const topCentral = Array.from(analysis.centralityMeasures.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    console.log(`\nTop 5 most connected nodes:`);
    for (const [nodeId, centrality] of topCentral) {
      const node = graph.nodes.get(nodeId);
      if (node) {
        console.log(`- ${node.name} (connections: ${centrality})`);
      }
    }
  }

  /**
   * Example 5: Similarity and Pattern Detection
   */
  async example5_SimilarityAndPatterns(): Promise<void> {
    console.log('\n🎯 Example 5: Similarity and Pattern Detection');
    console.log('===============================================');

    const projectPath = '/Users/example/my-project';
    const graph = await this.integration.getProjectGraph(projectPath);
    
    if (!graph) {
      console.log('No graph found for project');
      return;
    }

    const query = new KnowledgeGraphQuery(this.integration['store']);

    // Find a component to analyze
    const componentQuery = await this.integration.queryProject(projectPath, {
      select: { nodes: '*' },
      where: [{ field: 'type', operator: 'equals', value: 'component' }],
      limit: 1
    });

    if (componentQuery.nodes.length === 0) {
      console.log('No components found for similarity analysis');
      return;
    }

    const targetComponent = componentQuery.nodes[0];
    console.log(`Analyzing similarity for: ${targetComponent.name}`);

    // Find similar nodes
    const similarNodes = await query.findSimilarNodes(
      graph.id,
      targetComponent.id,
      {
        structural: 0.4,
        semantic: 0.4,
        relationship: 0.2
      },
      5
    );

    console.log(`\nSimilar nodes to ${targetComponent.name}:`);
    for (const similar of similarNodes) {
      console.log(`- ${similar.node.name} (score: ${similar.score.toFixed(2)})`);
      console.log(`  Reasons: ${similar.reasons.join(', ')}`);
    }

    // Pattern analysis
    console.log(`\nPatterns in the codebase:`);
    const patternFrequency = graph.statistics.patternFrequency;
    
    for (const [pattern, count] of Object.entries(patternFrequency)) {
      if (count > 1) {
        console.log(`- ${pattern}: ${count} occurrences`);
      }
    }

    // Error analysis
    console.log(`\nError frequency analysis:`);
    const errorFrequency = graph.statistics.errorFrequency;
    
    for (const [errorType, count] of Object.entries(errorFrequency)) {
      console.log(`- ${errorType}: ${count} occurrences`);
    }

    // Complexity distribution
    console.log(`\nComplexity distribution:`);
    const complexityDist = graph.statistics.complexityDistribution;
    
    for (const [level, count] of Object.entries(complexityDist)) {
      console.log(`- ${level} complexity: ${count} nodes`);
    }
  }

  /**
   * Example 6: Incremental Updates and Real-time Monitoring
   */
  async example6_IncrementalUpdates(): Promise<void> {
    console.log('\n🔄 Example 6: Incremental Updates and Real-time Monitoring');
    console.log('=========================================================');

    const projectPath = '/Users/example/my-project';

    // Set up event listeners
    this.integration.on('graph_updated', (event) => {
      console.log(`Graph updated for ${path.basename(event.projectPath)}`);
      console.log(`- Added: ${event.result.added.length} nodes`);
      console.log(`- Modified: ${event.result.modified.length} nodes`);
      console.log(`- Removed: ${event.result.removed.length} nodes`);
      console.log(`- Errors: ${event.result.errors.length} errors`);
    });

    this.integration.on('analysis_progress', (event) => {
      if (event.data.processed % 10 === 0) {
        console.log(`Analysis progress: ${event.data.processed}/${event.data.total} files`);
      }
    });

    // Simulate file changes
    const changedFiles = [
      path.join(projectPath, 'src/components/UserProfile.tsx'),
      path.join(projectPath, 'src/services/UserService.ts'),
      path.join(projectPath, 'src/types/User.ts')
    ];

    console.log('Simulating file changes...');
    const updateResult = await this.integration.updateKnowledgeGraph(projectPath, changedFiles);

    if (updateResult) {
      console.log('\nUpdate completed:');
      console.log(`- Duration: ${updateResult.duration}ms`);
      console.log(`- Success: ${updateResult.added.length + updateResult.modified.length} files processed`);
      
      if (updateResult.errors.length > 0) {
        console.log(`- Errors encountered:`);
        for (const error of updateResult.errors) {
          console.log(`  - ${path.basename(error.file)}: ${error.error}`);
        }
      }
    }
  }

  /**
   * Run all examples
   */
  async runAllExamples(): Promise<void> {
    try {
      await this.example1_BasicGeneration();
      await this.example2_QueryingGraph();
      await this.example3_FindingRelations();
      await this.example4_AdvancedAnalysis();
      await this.example5_SimilarityAndPatterns();
      await this.example6_IncrementalUpdates();

      console.log('\n✅ All examples completed successfully!');

    } catch (error) {
      console.error('\n❌ Error running examples:', error);
    } finally {
      // Clean up
      this.integration.dispose();
      this.contextManager.dispose();
    }
  }
}

/**
 * Run examples if this file is executed directly
 */
if (require.main === module) {
  const examples = new KnowledgeGraphExamples();
  examples.runAllExamples().catch(console.error);
}