/**
 * Knowledge Graph Query Interface
 * Advanced query system for knowledge graphs with SQL-like syntax and graph traversal
 */

import {
  KnowledgeGraph,
  KnowledgeNode,
  Relationship,
  KnowledgeQuery,
  QueryResult,
  QueryCondition,
  QuerySelector,
  QuerySort,
  NodeType,
  RelationshipType
} from './types';

import { KnowledgeGraphStore } from './KnowledgeGraphStore';

interface TraversalResult {
  path: string[];
  nodes: KnowledgeNode[];
  relationships: Relationship[];
  depth: number;
  score: number;
}

interface AggregationResult {
  count: number;
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  distinct?: any[];
}

export class KnowledgeGraphQuery {
  private store: KnowledgeGraphStore;
  private cache: Map<string, QueryResult> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  constructor(store: KnowledgeGraphStore) {
    this.store = store;
  }

  /**
   * Execute a knowledge graph query
   */
  async executeQuery(graphId: string, query: KnowledgeQuery): Promise<QueryResult> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(graphId, query);
    const cachedResult = this.getCachedResult(cacheKey);
    if (cachedResult) {
      return {
        ...cachedResult,
        executionTime: Date.now() - startTime
      };
    }

    console.log('🔍 Executing knowledge graph query...');

    const graph = await this.store.loadGraph(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    let nodes: KnowledgeNode[] = [];
    let relationships: Relationship[] = [];
    let metadata: any = {};

    // Apply WHERE conditions to filter nodes
    const filteredNodeIds = await this.applyWhereConditions(graph, query.where);
    
    // Get nodes based on selector
    if (query.select.nodes) {
      if (query.select.nodes === '*') {
        nodes = filteredNodeIds.map(id => graph.nodes.get(id)!).filter(Boolean);
      } else {
        nodes = query.select.nodes
          .map(id => graph.nodes.get(id))
          .filter(Boolean) as KnowledgeNode[];
        
        // Apply WHERE conditions to selected nodes
        if (filteredNodeIds.length > 0) {
          const filteredSet = new Set(filteredNodeIds);
          nodes = nodes.filter(node => filteredSet.has(node.id));
        }
      }
    }

    // Get relationships if requested
    if (query.select.relationships && query.includeRelationships) {
      const nodeIds = new Set(nodes.map(n => n.id));
      
      if (query.select.relationships === '*') {
        relationships = Array.from(graph.relationships.values())
          .filter(rel => nodeIds.has(rel.from) || nodeIds.has(rel.to));
      } else {
        relationships = query.select.relationships
          .map(id => graph.relationships.get(id))
          .filter(Boolean) as Relationship[];
      }
    }

    // Apply sorting
    if (query.orderBy && query.orderBy.length > 0) {
      nodes = this.applySorting(nodes, query.orderBy);
    }

    // Apply pagination
    let totalCount = nodes.length;
    if (query.limit || query.offset) {
      const offset = query.offset || 0;
      const limit = query.limit;
      nodes = limit ? nodes.slice(offset, offset + limit) : nodes.slice(offset);
    }

    // Include metadata if requested
    if (query.includeMetadata) {
      metadata = this.extractMetadata(nodes, relationships, graph);
    }

    const result: QueryResult = {
      nodes,
      relationships,
      metadata,
      totalCount,
      executionTime: Date.now() - startTime
    };

    // Cache result
    this.cacheResult(cacheKey, result);

    console.log(`  ✅ Query executed in ${result.executionTime}ms, returned ${nodes.length} nodes`);

    return result;
  }

  /**
   * Find shortest path between two nodes
   */
  async findShortestPath(
    graphId: string,
    fromNodeId: string,
    toNodeId: string,
    maxDepth: number = 10,
    relationshipTypes?: RelationshipType[]
  ): Promise<TraversalResult | null> {
    const graph = await this.store.loadGraph(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    console.log(`🛤️ Finding shortest path from ${fromNodeId} to ${toNodeId}...`);

    const queue: { 
      nodeId: string; 
      path: string[]; 
      relationships: Relationship[];
      depth: number;
    }[] = [{ 
      nodeId: fromNodeId, 
      path: [fromNodeId], 
      relationships: [],
      depth: 0 
    }];

    const visited = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (current.nodeId === toNodeId) {
        // Found target
        const nodes = current.path.map(id => graph.nodes.get(id)!).filter(Boolean);
        
        return {
          path: current.path,
          nodes,
          relationships: current.relationships,
          depth: current.depth,
          score: this.calculatePathScore(current.relationships)
        };
      }

      if (visited.has(current.nodeId) || current.depth >= maxDepth) {
        continue;
      }

      visited.add(current.nodeId);

      // Find neighbors
      const neighborRelationships = await this.store.findRelationships(graphId, current.nodeId);
      
      for (const relationship of neighborRelationships) {
        if (relationshipTypes && !relationshipTypes.includes(relationship.type)) {
          continue;
        }

        const neighborId = relationship.from === current.nodeId ? 
          relationship.to : relationship.from;

        if (!visited.has(neighborId)) {
          queue.push({
            nodeId: neighborId,
            path: [...current.path, neighborId],
            relationships: [...current.relationships, relationship],
            depth: current.depth + 1
          });
        }
      }
    }

    console.log('  ⚠️ No path found');
    return null;
  }

  /**
   * Find all paths between two nodes
   */
  async findAllPaths(
    graphId: string,
    fromNodeId: string,
    toNodeId: string,
    maxDepth: number = 6,
    maxPaths: number = 100
  ): Promise<TraversalResult[]> {
    const graph = await this.store.loadGraph(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    console.log(`🛤️ Finding all paths from ${fromNodeId} to ${toNodeId}...`);

    const paths: TraversalResult[] = [];
    
    const dfs = (
      currentId: string,
      targetId: string,
      visited: Set<string>,
      currentPath: string[],
      currentRelationships: Relationship[],
      depth: number
    ) => {
      if (paths.length >= maxPaths || depth >= maxDepth) {
        return;
      }

      if (currentId === targetId) {
        const nodes = currentPath.map(id => graph.nodes.get(id)!).filter(Boolean);
        paths.push({
          path: [...currentPath],
          nodes,
          relationships: [...currentRelationships],
          depth,
          score: this.calculatePathScore(currentRelationships)
        });
        return;
      }

      visited.add(currentId);

      // Get all relationships for current node
      const relationships = Array.from(graph.relationships.values())
        .filter(rel => rel.from === currentId || rel.to === currentId);

      for (const relationship of relationships) {
        const nextId = relationship.from === currentId ? relationship.to : relationship.from;
        
        if (!visited.has(nextId)) {
          dfs(
            nextId,
            targetId,
            new Set(visited),
            [...currentPath, nextId],
            [...currentRelationships, relationship],
            depth + 1
          );
        }
      }
    };

    dfs(fromNodeId, toNodeId, new Set(), [fromNodeId], [], 0);

    // Sort paths by score
    paths.sort((a, b) => b.score - a.score);

    console.log(`  ✅ Found ${paths.length} paths`);
    return paths;
  }

  /**
   * Find nodes within a certain distance
   */
  async findNodesInRadius(
    graphId: string,
    centerNodeId: string,
    radius: number,
    relationshipTypes?: RelationshipType[]
  ): Promise<Map<string, number>> {
    const graph = await this.store.loadGraph(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    const distances = new Map<string, number>();
    const queue: { nodeId: string; distance: number }[] = [{ nodeId: centerNodeId, distance: 0 }];
    const visited = new Set<string>();

    distances.set(centerNodeId, 0);

    while (queue.length > 0) {
      const { nodeId, distance } = queue.shift()!;

      if (visited.has(nodeId) || distance >= radius) {
        continue;
      }

      visited.add(nodeId);

      // Find neighbors
      const relationships = Array.from(graph.relationships.values())
        .filter(rel => (rel.from === nodeId || rel.to === nodeId) &&
                      (!relationshipTypes || relationshipTypes.includes(rel.type)));

      for (const relationship of relationships) {
        const neighborId = relationship.from === nodeId ? relationship.to : relationship.from;
        const newDistance = distance + 1;

        if (!distances.has(neighborId) || distances.get(neighborId)! > newDistance) {
          distances.set(neighborId, newDistance);
          
          if (newDistance < radius) {
            queue.push({ nodeId: neighborId, distance: newDistance });
          }
        }
      }
    }

    return distances;
  }

  /**
   * Perform graph analysis queries
   */
  async analyzeGraph(graphId: string): Promise<{
    centralityMeasures: Map<string, number>;
    clusters: string[][];
    stronglyConnected: string[][];
    cycleDetection: string[][];
    degreeDistribution: Map<number, number>;
  }> {
    const graph = await this.store.loadGraph(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    console.log('📊 Analyzing graph structure...');

    return {
      centralityMeasures: await this.calculateCentralityMeasures(graph),
      clusters: await this.detectClusters(graph),
      stronglyConnected: await this.findStronglyConnectedComponents(graph),
      cycleDetection: await this.detectCycles(graph),
      degreeDistribution: await this.calculateDegreeDistribution(graph)
    };
  }

  /**
   * Search nodes using full-text search
   */
  async fullTextSearch(
    graphId: string,
    searchTerm: string,
    fields: string[] = ['name', 'purpose', 'description'],
    fuzzy: boolean = false
  ): Promise<{ node: KnowledgeNode; score: number; matches: string[] }[]> {
    const graph = await this.store.loadGraph(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    const results: { node: KnowledgeNode; score: number; matches: string[] }[] = [];
    const searchTermLower = searchTerm.toLowerCase();

    for (const node of graph.nodes.values()) {
      let score = 0;
      const matches: string[] = [];

      // Search in specified fields
      for (const field of fields) {
        let fieldValue: string = '';
        
        switch (field) {
          case 'name':
            fieldValue = node.name;
            break;
          case 'purpose':
            fieldValue = node.semantics.purpose || '';
            break;
          case 'description':
            fieldValue = node.metadata.documentation?.description || '';
            break;
          case 'path':
            fieldValue = node.relativePath;
            break;
        }

        if (fieldValue) {
          const fieldValueLower = fieldValue.toLowerCase();
          
          if (fuzzy) {
            const similarity = this.calculateStringSimilarity(searchTermLower, fieldValueLower);
            if (similarity > 0.6) {
              score += similarity * (field === 'name' ? 2 : 1);
              matches.push(field);
            }
          } else {
            if (fieldValueLower.includes(searchTermLower)) {
              score += field === 'name' ? 2 : 1;
              matches.push(field);
            }
          }
        }
      }

      if (score > 0) {
        results.push({ node, score, matches });
      }
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * Execute aggregation queries
   */
  async aggregate(
    graphId: string,
    aggregations: {
      field: string;
      operation: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct';
      groupBy?: string;
    }[]
  ): Promise<Map<string, AggregationResult>> {
    const graph = await this.store.loadGraph(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    const results = new Map<string, AggregationResult>();

    for (const agg of aggregations) {
      const values = this.extractFieldValues(graph, agg.field, agg.groupBy);
      const result = this.performAggregation(values, agg.operation);
      results.set(`${agg.field}_${agg.operation}`, result);
    }

    return results;
  }

  /**
   * Find similar nodes based on various criteria
   */
  async findSimilarNodes(
    graphId: string,
    nodeId: string,
    similarity: {
      structural: number;
      semantic: number;
      relationship: number;
    },
    limit: number = 10
  ): Promise<{ node: KnowledgeNode; score: number; reasons: string[] }[]> {
    const graph = await this.store.loadGraph(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    const targetNode = graph.nodes.get(nodeId);
    if (!targetNode) {
      throw new Error(`Node ${nodeId} not found`);
    }

    const similarities: { node: KnowledgeNode; score: number; reasons: string[] }[] = [];

    for (const [id, node] of graph.nodes) {
      if (id === nodeId) continue;

      const structuralScore = this.calculateStructuralSimilarity(targetNode, node);
      const semanticScore = this.calculateSemanticSimilarity(targetNode, node);
      const relationshipScore = await this.calculateRelationshipSimilarity(graphId, targetNode, node);

      const totalScore = 
        (structuralScore * similarity.structural) +
        (semanticScore * similarity.semantic) +
        (relationshipScore * similarity.relationship);

      const reasons: string[] = [];
      if (structuralScore > 0.7) reasons.push('Similar structure');
      if (semanticScore > 0.7) reasons.push('Similar semantics');
      if (relationshipScore > 0.7) reasons.push('Similar relationships');

      if (totalScore > 0.5) {
        similarities.push({ node, score: totalScore, reasons });
      }
    }

    // Sort by score and limit results
    similarities.sort((a, b) => b.score - a.score);
    return similarities.slice(0, limit);
  }

  // Private helper methods

  private async applyWhereConditions(
    graph: KnowledgeGraph,
    conditions?: QueryCondition[]
  ): Promise<string[]> {
    if (!conditions || conditions.length === 0) {
      return Array.from(graph.nodes.keys());
    }

    const matchingNodes: string[] = [];

    for (const [nodeId, node] of graph.nodes) {
      if (this.evaluateConditions(node, conditions)) {
        matchingNodes.push(nodeId);
      }
    }

    return matchingNodes;
  }

  private evaluateConditions(node: KnowledgeNode, conditions: QueryCondition[]): boolean {
    let result = true;
    let currentConnector: 'and' | 'or' = 'and';

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(node, condition);
      
      if (currentConnector === 'and') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      currentConnector = condition.connector || 'and';
    }

    return result;
  }

  private evaluateCondition(node: KnowledgeNode, condition: QueryCondition): boolean {
    const fieldValue = this.getFieldValue(node, condition.field);
    
    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(condition.value).toLowerCase());
      case 'startsWith':
        return String(fieldValue).toLowerCase().startsWith(String(condition.value).toLowerCase());
      case 'endsWith':
        return String(fieldValue).toLowerCase().endsWith(String(condition.value).toLowerCase());
      case 'matches':
        const regex = new RegExp(condition.value, 'i');
        return regex.test(String(fieldValue));
      case 'greater':
        return Number(fieldValue) > Number(condition.value);
      case 'less':
        return Number(fieldValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  private getFieldValue(node: KnowledgeNode, field: string): any {
    const parts = field.split('.');
    let value: any = node;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  private applySorting(nodes: KnowledgeNode[], sorts: QuerySort[]): KnowledgeNode[] {
    return nodes.sort((a, b) => {
      for (const sort of sorts) {
        const aValue = this.getFieldValue(a, sort.field);
        const bValue = this.getFieldValue(b, sort.field);
        
        let comparison = 0;
        if (aValue < bValue) comparison = -1;
        else if (aValue > bValue) comparison = 1;
        
        if (sort.direction === 'desc') {
          comparison = -comparison;
        }
        
        if (comparison !== 0) {
          return comparison;
        }
      }
      return 0;
    });
  }

  private extractMetadata(
    nodes: KnowledgeNode[],
    relationships: Relationship[],
    graph: KnowledgeGraph
  ): any {
    return {
      nodeTypes: this.countByType(nodes, 'type'),
      languages: this.countByType(nodes, 'metadata.language'),
      relationshipTypes: this.countByType(relationships, 'type'),
      totalComplexity: nodes.reduce((sum, node) => 
        sum + (node.metadata.cyclomaticComplexity || 0), 0),
      averageSize: nodes.length > 0 ? 
        nodes.reduce((sum, node) => sum + node.size, 0) / nodes.length : 0
    };
  }

  private countByType(items: any[], field: string): Record<string, number> {
    const counts: Record<string, number> = {};
    
    for (const item of items) {
      const value = this.getFieldValue(item, field);
      if (value) {
        counts[value] = (counts[value] || 0) + 1;
      }
    }
    
    return counts;
  }

  private calculatePathScore(relationships: Relationship[]): number {
    return relationships.reduce((score, rel) => score + rel.weight, 0);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance implementation
    const matrix: number[][] = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
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

    const maxLen = Math.max(len1, len2);
    return maxLen === 0 ? 1 : (maxLen - matrix[len2][len1]) / maxLen;
  }

  private async calculateCentralityMeasures(graph: KnowledgeGraph): Promise<Map<string, number>> {
    // Simplified degree centrality calculation
    const centrality = new Map<string, number>();
    
    for (const nodeId of graph.nodes.keys()) {
      const relationships = await this.store.findRelationships(graph.id, nodeId);
      centrality.set(nodeId, relationships.length);
    }
    
    return centrality;
  }

  private async detectClusters(graph: KnowledgeGraph): Promise<string[][]> {
    // Simplified clustering implementation
    return [];
  }

  private async findStronglyConnectedComponents(graph: KnowledgeGraph): Promise<string[][]> {
    // Placeholder for strongly connected components algorithm
    return [];
  }

  private async detectCycles(graph: KnowledgeGraph): Promise<string[][]> {
    // Placeholder for cycle detection algorithm
    return [];
  }

  private async calculateDegreeDistribution(graph: KnowledgeGraph): Promise<Map<number, number>> {
    const distribution = new Map<number, number>();
    
    for (const nodeId of graph.nodes.keys()) {
      const relationships = await this.store.findRelationships(graph.id, nodeId);
      const degree = relationships.length;
      distribution.set(degree, (distribution.get(degree) || 0) + 1);
    }
    
    return distribution;
  }

  private extractFieldValues(graph: KnowledgeGraph, field: string, groupBy?: string): Map<string, any[]> {
    const values = new Map<string, any[]>();
    
    for (const node of graph.nodes.values()) {
      const groupKey = groupBy ? String(this.getFieldValue(node, groupBy)) : 'default';
      const fieldValue = this.getFieldValue(node, field);
      
      if (!values.has(groupKey)) {
        values.set(groupKey, []);
      }
      values.get(groupKey)!.push(fieldValue);
    }
    
    return values;
  }

  private performAggregation(values: Map<string, any[]>, operation: string): AggregationResult {
    const result: AggregationResult = { count: 0 };
    
    for (const [group, groupValues] of values) {
      const validValues = groupValues.filter(v => v !== undefined && v !== null);
      
      switch (operation) {
        case 'count':
          result.count += validValues.length;
          break;
        case 'sum':
          result.sum = (result.sum || 0) + validValues.reduce((sum, v) => sum + Number(v), 0);
          break;
        case 'avg':
          const sum = validValues.reduce((sum, v) => sum + Number(v), 0);
          result.avg = validValues.length > 0 ? sum / validValues.length : 0;
          break;
        case 'min':
          const min = Math.min(...validValues.map(v => Number(v)));
          result.min = result.min === undefined ? min : Math.min(result.min, min);
          break;
        case 'max':
          const max = Math.max(...validValues.map(v => Number(v)));
          result.max = result.max === undefined ? max : Math.max(result.max, max);
          break;
        case 'distinct':
          if (!result.distinct) result.distinct = [];
          result.distinct.push(...new Set(validValues));
          break;
      }
    }
    
    return result;
  }

  private calculateStructuralSimilarity(node1: KnowledgeNode, node2: KnowledgeNode): number {
    let similarity = 0;
    
    // Type similarity
    if (node1.type === node2.type) similarity += 0.3;
    
    // Language similarity
    if (node1.metadata.language === node2.metadata.language) similarity += 0.2;
    
    // Size similarity
    const sizeDiff = Math.abs(node1.size - node2.size) / Math.max(node1.size, node2.size);
    similarity += (1 - sizeDiff) * 0.2;
    
    // Complexity similarity
    const complexity1 = node1.metadata.cyclomaticComplexity || 1;
    const complexity2 = node2.metadata.cyclomaticComplexity || 1;
    const complexityDiff = Math.abs(complexity1 - complexity2) / Math.max(complexity1, complexity2);
    similarity += (1 - complexityDiff) * 0.3;
    
    return Math.min(similarity, 1);
  }

  private calculateSemanticSimilarity(node1: KnowledgeNode, node2: KnowledgeNode): number {
    let similarity = 0;
    
    // Purpose similarity
    if (node1.semantics.purpose && node2.semantics.purpose) {
      similarity += this.calculateStringSimilarity(
        node1.semantics.purpose,
        node2.semantics.purpose
      ) * 0.4;
    }
    
    // Tags similarity
    const commonTags = node1.tags.filter(tag => node2.tags.includes(tag));
    const totalTags = new Set([...node1.tags, ...node2.tags]).size;
    if (totalTags > 0) {
      similarity += (commonTags.length / totalTags) * 0.3;
    }
    
    // Operations similarity
    const ops1 = node1.semantics.operations.map(op => op.name);
    const ops2 = node2.semantics.operations.map(op => op.name);
    const commonOps = ops1.filter(op => ops2.includes(op));
    const totalOps = new Set([...ops1, ...ops2]).size;
    if (totalOps > 0) {
      similarity += (commonOps.length / totalOps) * 0.3;
    }
    
    return Math.min(similarity, 1);
  }

  private async calculateRelationshipSimilarity(
    graphId: string,
    node1: KnowledgeNode,
    node2: KnowledgeNode
  ): Promise<number> {
    const rel1 = await this.store.findRelationships(graphId, node1.id);
    const rel2 = await this.store.findRelationships(graphId, node2.id);
    
    // Compare relationship types
    const types1 = new Set(rel1.map(r => r.type));
    const types2 = new Set(rel2.map(r => r.type));
    const commonTypes = [...types1].filter(t => types2.has(t));
    const totalTypes = new Set([...types1, ...types2]).size;
    
    return totalTypes > 0 ? commonTypes.length / totalTypes : 0;
  }

  private generateCacheKey(graphId: string, query: KnowledgeQuery): string {
    return crypto.createHash('md5')
      .update(JSON.stringify({ graphId, query }))
      .digest('hex');
  }

  private getCachedResult(cacheKey: string): QueryResult | null {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.executionTime < this.cacheExpiry) {
      return cached;
    }
    return null;
  }

  private cacheResult(cacheKey: string, result: QueryResult): void {
    this.cache.set(cacheKey, result);
    
    // Clean up old cache entries
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].executionTime - b[1].executionTime);
      const toDelete = entries.slice(0, 20);
      for (const [key] of toDelete) {
        this.cache.delete(key);
      }
    }
  }
}

// Import crypto for cache key generation
import * as crypto from 'crypto';