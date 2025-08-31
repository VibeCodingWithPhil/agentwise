/**
 * Knowledge Graph Store
 * Storage and retrieval system for knowledge graph data with efficient indexing
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';

import {
  KnowledgeGraph,
  KnowledgeNode,
  Relationship,
  NodeType,
  RelationshipType,
  KnowledgeGraphEvent,
  UpdateResult
} from './types';

interface StorageIndex {
  byType: Map<NodeType, Set<string>>;
  byPath: Map<string, string>;
  byName: Map<string, Set<string>>;
  byTag: Map<string, Set<string>>;
  byLanguage: Map<string, Set<string>>;
  relationships: Map<string, Set<string>>;
  lastUpdated: Date;
  version: number;
}

interface StorageMetadata {
  graphId: string;
  projectPath: string;
  totalNodes: number;
  totalRelationships: number;
  storageVersion: string;
  lastSync: Date;
  checksums: Map<string, string>;
}

export class KnowledgeGraphStore extends EventEmitter {
  private storagePath: string;
  private indices: Map<string, StorageIndex> = new Map();
  private metadata: Map<string, StorageMetadata> = new Map();
  private loadedGraphs: Map<string, KnowledgeGraph> = new Map();
  private writeQueue: Map<string, () => Promise<void>> = new Map();
  private isProcessing: boolean = false;
  private readonly STORAGE_VERSION = '1.0.0';

  constructor(basePath: string = '.knowledge') {
    super();
    this.storagePath = basePath;
  }

  /**
   * Initialize storage system
   */
  async initialize(): Promise<void> {
    await fs.ensureDir(this.storagePath);
    await this.loadIndices();
    await this.loadMetadata();
    
    console.log('🗄️ Knowledge Graph Store initialized');
    this.emit('store_ready');
  }

  /**
   * Store a complete knowledge graph
   */
  async storeGraph(graph: KnowledgeGraph): Promise<void> {
    console.log(`💾 Storing knowledge graph ${graph.id}...`);
    
    const graphDir = path.join(this.storagePath, graph.id);
    await fs.ensureDir(graphDir);

    // Queue write operations
    this.queueWrite(`graph-${graph.id}`, async () => {
      await this.writeGraphData(graph, graphDir);
      await this.updateIndices(graph);
      await this.updateMetadata(graph);
    });

    await this.processWriteQueue();

    this.loadedGraphs.set(graph.id, graph);
    console.log(`  ✅ Graph stored with ${graph.nodes.size} nodes and ${graph.relationships.size} relationships`);

    this.emit('graph_stored', { graphId: graph.id });
  }

  /**
   * Load a knowledge graph from storage
   */
  async loadGraph(graphId: string): Promise<KnowledgeGraph | undefined> {
    // Check if already loaded in memory
    if (this.loadedGraphs.has(graphId)) {
      return this.loadedGraphs.get(graphId);
    }

    const graphDir = path.join(this.storagePath, graphId);
    if (!await fs.pathExists(graphDir)) {
      return undefined;
    }

    console.log(`📖 Loading knowledge graph ${graphId}...`);

    try {
      const graph = await this.readGraphData(graphId, graphDir);
      this.loadedGraphs.set(graphId, graph);
      
      console.log(`  ✅ Graph loaded with ${graph.nodes.size} nodes and ${graph.relationships.size} relationships`);
      
      this.emit('graph_loaded', { graphId });
      return graph;

    } catch (error) {
      console.error(`  ❌ Failed to load graph ${graphId}:`, error);
      this.emit('graph_load_error', { graphId, error });
      return undefined;
    }
  }

  /**
   * Update nodes in existing graph
   */
  async updateNodes(graphId: string, nodes: KnowledgeNode[]): Promise<void> {
    const graph = await this.loadGraph(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    console.log(`🔄 Updating ${nodes.length} nodes in graph ${graphId}...`);

    // Update nodes in memory
    for (const node of nodes) {
      graph.nodes.set(node.id, node);
    }

    // Update graph metadata
    graph.lastUpdated = new Date();
    graph.version++;

    // Queue write operation
    this.queueWrite(`nodes-${graphId}`, async () => {
      await this.writeNodes(graphId, nodes);
      await this.updateIndices(graph);
    });

    await this.processWriteQueue();

    this.emit('nodes_updated', { graphId, nodeCount: nodes.length });
  }

  /**
   * Update relationships in existing graph
   */
  async updateRelationships(graphId: string, relationships: Relationship[]): Promise<void> {
    const graph = await this.loadGraph(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    console.log(`🔗 Updating ${relationships.length} relationships in graph ${graphId}...`);

    // Update relationships in memory
    for (const relationship of relationships) {
      graph.relationships.set(relationship.id, relationship);
    }

    // Update graph metadata
    graph.lastUpdated = new Date();
    graph.version++;

    // Queue write operation
    this.queueWrite(`relationships-${graphId}`, async () => {
      await this.writeRelationships(graphId, relationships);
      await this.updateIndices(graph);
    });

    await this.processWriteQueue();

    this.emit('relationships_updated', { graphId, relationshipCount: relationships.length });
  }

  /**
   * Delete nodes from graph
   */
  async deleteNodes(graphId: string, nodeIds: string[]): Promise<void> {
    const graph = await this.loadGraph(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    console.log(`🗑️ Deleting ${nodeIds.length} nodes from graph ${graphId}...`);

    // Remove nodes from memory
    for (const nodeId of nodeIds) {
      graph.nodes.delete(nodeId);

      // Remove related relationships
      const relationshipsToDelete: string[] = [];
      for (const [relId, relationship] of graph.relationships) {
        if (relationship.from === nodeId || relationship.to === nodeId) {
          relationshipsToDelete.push(relId);
        }
      }
      
      for (const relId of relationshipsToDelete) {
        graph.relationships.delete(relId);
      }
    }

    // Update graph metadata
    graph.lastUpdated = new Date();
    graph.version++;

    // Queue write operation
    this.queueWrite(`delete-nodes-${graphId}`, async () => {
      await this.removeNodes(graphId, nodeIds);
      await this.updateIndices(graph);
    });

    await this.processWriteQueue();

    this.emit('nodes_deleted', { graphId, deletedCount: nodeIds.length });
  }

  /**
   * Get all graphs metadata
   */
  async listGraphs(): Promise<StorageMetadata[]> {
    return Array.from(this.metadata.values());
  }

  /**
   * Get graph statistics
   */
  async getGraphStats(graphId: string): Promise<any> {
    const graph = await this.loadGraph(graphId);
    if (!graph) {
      return null;
    }

    return {
      id: graph.id,
      nodeCount: graph.nodes.size,
      relationshipCount: graph.relationships.size,
      lastUpdated: graph.lastUpdated,
      version: graph.version,
      statistics: graph.statistics
    };
  }

  /**
   * Search nodes by various criteria
   */
  async searchNodes(
    graphId: string,
    criteria: {
      type?: NodeType;
      name?: string;
      path?: string;
      tags?: string[];
      language?: string;
    }
  ): Promise<KnowledgeNode[]> {
    const graph = await this.loadGraph(graphId);
    if (!graph) {
      return [];
    }

    const index = this.indices.get(graphId);
    if (!index) {
      return [];
    }

    let candidateIds = new Set<string>();

    // Start with all nodes, then filter
    if (criteria.type) {
      candidateIds = index.byType.get(criteria.type) || new Set();
    } else if (criteria.language) {
      candidateIds = index.byLanguage.get(criteria.language) || new Set();
    } else if (criteria.tags && criteria.tags.length > 0) {
      // Intersect all tag sets
      for (const tag of criteria.tags) {
        const tagNodes = index.byTag.get(tag) || new Set();
        if (candidateIds.size === 0) {
          candidateIds = new Set(tagNodes);
        } else {
          candidateIds = new Set([...candidateIds].filter(id => tagNodes.has(id)));
        }
      }
    } else {
      candidateIds = new Set(graph.nodes.keys());
    }

    // Apply additional filters
    const results: KnowledgeNode[] = [];
    for (const nodeId of candidateIds) {
      const node = graph.nodes.get(nodeId);
      if (!node) continue;

      // Filter by name
      if (criteria.name && !node.name.includes(criteria.name)) continue;

      // Filter by path
      if (criteria.path && !node.path.includes(criteria.path)) continue;

      results.push(node);
    }

    return results;
  }

  /**
   * Find relationships for a node
   */
  async findRelationships(
    graphId: string,
    nodeId: string,
    type?: RelationshipType,
    direction: 'incoming' | 'outgoing' | 'both' = 'both'
  ): Promise<Relationship[]> {
    const graph = await this.loadGraph(graphId);
    if (!graph) {
      return [];
    }

    const relationships: Relationship[] = [];

    for (const relationship of graph.relationships.values()) {
      let matches = false;

      if (direction === 'outgoing' || direction === 'both') {
        if (relationship.from === nodeId) matches = true;
      }
      
      if (direction === 'incoming' || direction === 'both') {
        if (relationship.to === nodeId) matches = true;
      }

      if (matches && (!type || relationship.type === type)) {
        relationships.push(relationship);
      }
    }

    return relationships;
  }

  /**
   * Get node neighbors
   */
  async getNeighbors(
    graphId: string,
    nodeId: string,
    maxDepth: number = 1,
    relationshipTypes?: RelationshipType[]
  ): Promise<KnowledgeNode[]> {
    const graph = await this.loadGraph(graphId);
    if (!graph) {
      return [];
    }

    const visited = new Set<string>();
    const neighbors = new Set<string>();
    const queue: { nodeId: string; depth: number }[] = [{ nodeId, depth: 0 }];

    while (queue.length > 0) {
      const { nodeId: currentId, depth } = queue.shift()!;
      
      if (visited.has(currentId) || depth >= maxDepth) continue;
      visited.add(currentId);

      // Find all relationships
      const relationships = await this.findRelationships(graphId, currentId);
      
      for (const relationship of relationships) {
        if (relationshipTypes && !relationshipTypes.includes(relationship.type)) continue;

        const neighborId = relationship.from === currentId ? relationship.to : relationship.from;
        
        if (!visited.has(neighborId)) {
          neighbors.add(neighborId);
          if (depth + 1 < maxDepth) {
            queue.push({ nodeId: neighborId, depth: depth + 1 });
          }
        }
      }
    }

    // Convert to nodes
    const result: KnowledgeNode[] = [];
    for (const neighborId of neighbors) {
      const node = graph.nodes.get(neighborId);
      if (node) result.push(node);
    }

    return result;
  }

  /**
   * Backup graph to external location
   */
  async backupGraph(graphId: string, backupPath: string): Promise<void> {
    const graph = await this.loadGraph(graphId);
    if (!graph) {
      throw new Error(`Graph ${graphId} not found`);
    }

    console.log(`💾 Creating backup of graph ${graphId}...`);

    const backupDir = path.join(backupPath, `${graphId}-backup-${Date.now()}`);
    await fs.ensureDir(backupDir);

    // Copy graph data
    const sourceDir = path.join(this.storagePath, graphId);
    await fs.copy(sourceDir, backupDir);

    // Create backup metadata
    const backupMetadata = {
      graphId,
      originalPath: this.storagePath,
      backupDate: new Date(),
      version: graph.version,
      nodeCount: graph.nodes.size,
      relationshipCount: graph.relationships.size
    };

    await fs.writeJson(path.join(backupDir, 'backup-metadata.json'), backupMetadata, { spaces: 2 });

    console.log(`  ✅ Backup created at ${backupDir}`);
    this.emit('graph_backed_up', { graphId, backupPath: backupDir });
  }

  /**
   * Restore graph from backup
   */
  async restoreGraph(backupPath: string): Promise<string> {
    console.log(`📥 Restoring graph from backup ${backupPath}...`);

    const metadataPath = path.join(backupPath, 'backup-metadata.json');
    if (!await fs.pathExists(metadataPath)) {
      throw new Error('Invalid backup: metadata not found');
    }

    const backupMetadata = await fs.readJson(metadataPath);
    const graphId = backupMetadata.graphId;

    // Copy backup to storage
    const targetDir = path.join(this.storagePath, graphId);
    await fs.remove(targetDir); // Remove existing if any
    await fs.copy(backupPath, targetDir);
    await fs.remove(path.join(targetDir, 'backup-metadata.json')); // Remove backup metadata

    // Reload graph
    this.loadedGraphs.delete(graphId);
    const graph = await this.loadGraph(graphId);
    
    if (graph) {
      await this.updateMetadata(graph);
      console.log(`  ✅ Graph ${graphId} restored successfully`);
      this.emit('graph_restored', { graphId });
      return graphId;
    } else {
      throw new Error('Failed to load restored graph');
    }
  }

  /**
   * Delete entire graph
   */
  async deleteGraph(graphId: string): Promise<void> {
    console.log(`🗑️ Deleting graph ${graphId}...`);

    // Remove from memory
    this.loadedGraphs.delete(graphId);
    this.indices.delete(graphId);
    this.metadata.delete(graphId);

    // Remove from storage
    const graphDir = path.join(this.storagePath, graphId);
    await fs.remove(graphDir);

    // Update metadata index
    await this.saveMetadata();

    console.log(`  ✅ Graph ${graphId} deleted`);
    this.emit('graph_deleted', { graphId });
  }

  /**
   * Cleanup and optimization
   */
  async optimize(): Promise<void> {
    console.log('🔧 Optimizing knowledge graph storage...');

    for (const graphId of this.loadedGraphs.keys()) {
      await this.optimizeGraph(graphId);
    }

    // Cleanup orphaned files
    await this.cleanupOrphanedFiles();

    // Rebuild indices
    await this.rebuildIndices();

    console.log('  ✅ Storage optimization complete');
    this.emit('storage_optimized');
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(): Promise<any> {
    const stats = {
      totalGraphs: this.metadata.size,
      loadedGraphs: this.loadedGraphs.size,
      totalNodes: 0,
      totalRelationships: 0,
      storageSize: 0,
      lastOptimized: new Date()
    };

    for (const metadata of this.metadata.values()) {
      stats.totalNodes += metadata.totalNodes;
      stats.totalRelationships += metadata.totalRelationships;
    }

    // Calculate storage size
    try {
      const size = await this.calculateDirectorySize(this.storagePath);
      stats.storageSize = size;
    } catch (error) {
      // Ignore size calculation errors
    }

    return stats;
  }

  // Private methods for internal operations

  private async writeGraphData(graph: KnowledgeGraph, graphDir: string): Promise<void> {
    // Write nodes
    const nodesDir = path.join(graphDir, 'nodes');
    await fs.ensureDir(nodesDir);
    
    const nodeChunks = this.chunkNodes(Array.from(graph.nodes.values()));
    for (let i = 0; i < nodeChunks.length; i++) {
      const chunkPath = path.join(nodesDir, `chunk-${i}.json`);
      await fs.writeJson(chunkPath, nodeChunks[i], { spaces: 2 });
    }

    // Write relationships
    const relationshipsDir = path.join(graphDir, 'relationships');
    await fs.ensureDir(relationshipsDir);
    
    const relationshipChunks = this.chunkRelationships(Array.from(graph.relationships.values()));
    for (let i = 0; i < relationshipChunks.length; i++) {
      const chunkPath = path.join(relationshipsDir, `chunk-${i}.json`);
      await fs.writeJson(chunkPath, relationshipChunks[i], { spaces: 2 });
    }

    // Write graph metadata
    const graphMetadata = {
      id: graph.id,
      projectPath: graph.projectPath,
      metadata: graph.metadata,
      statistics: graph.statistics,
      lastUpdated: graph.lastUpdated,
      version: graph.version
    };
    
    await fs.writeJson(path.join(graphDir, 'graph.json'), graphMetadata, { spaces: 2 });
  }

  private async readGraphData(graphId: string, graphDir: string): Promise<KnowledgeGraph> {
    // Read graph metadata
    const graphPath = path.join(graphDir, 'graph.json');
    const graphData = await fs.readJson(graphPath);

    // Read nodes
    const nodes = new Map<string, KnowledgeNode>();
    const nodesDir = path.join(graphDir, 'nodes');
    
    if (await fs.pathExists(nodesDir)) {
      const chunkFiles = await fs.readdir(nodesDir);
      for (const chunkFile of chunkFiles) {
        if (chunkFile.endsWith('.json')) {
          const chunkPath = path.join(nodesDir, chunkFile);
          const chunkNodes: KnowledgeNode[] = await fs.readJson(chunkPath);
          for (const node of chunkNodes) {
            nodes.set(node.id, node);
          }
        }
      }
    }

    // Read relationships
    const relationships = new Map<string, Relationship>();
    const relationshipsDir = path.join(graphDir, 'relationships');
    
    if (await fs.pathExists(relationshipsDir)) {
      const chunkFiles = await fs.readdir(relationshipsDir);
      for (const chunkFile of chunkFiles) {
        if (chunkFile.endsWith('.json')) {
          const chunkPath = path.join(relationshipsDir, chunkFile);
          const chunkRelationships: Relationship[] = await fs.readJson(chunkPath);
          for (const relationship of chunkRelationships) {
            relationships.set(relationship.id, relationship);
          }
        }
      }
    }

    return {
      ...graphData,
      nodes,
      relationships
    } as KnowledgeGraph;
  }

  private async writeNodes(graphId: string, nodes: KnowledgeNode[]): Promise<void> {
    const graphDir = path.join(this.storagePath, graphId, 'nodes');
    await fs.ensureDir(graphDir);

    // For incremental updates, we append to existing chunks or create new ones
    // This is a simplified implementation
    const timestamp = Date.now();
    const chunkPath = path.join(graphDir, `update-${timestamp}.json`);
    await fs.writeJson(chunkPath, nodes, { spaces: 2 });
  }

  private async writeRelationships(graphId: string, relationships: Relationship[]): Promise<void> {
    const graphDir = path.join(this.storagePath, graphId, 'relationships');
    await fs.ensureDir(graphDir);

    const timestamp = Date.now();
    const chunkPath = path.join(graphDir, `update-${timestamp}.json`);
    await fs.writeJson(chunkPath, relationships, { spaces: 2 });
  }

  private async removeNodes(graphId: string, nodeIds: string[]): Promise<void> {
    // Mark nodes as deleted (tombstone approach)
    const graphDir = path.join(this.storagePath, graphId);
    const deletedPath = path.join(graphDir, 'deleted.json');
    
    let deleted: string[] = [];
    if (await fs.pathExists(deletedPath)) {
      deleted = await fs.readJson(deletedPath);
    }
    
    deleted.push(...nodeIds);
    await fs.writeJson(deletedPath, deleted);
  }

  private chunkNodes(nodes: KnowledgeNode[], chunkSize: number = 1000): KnowledgeNode[][] {
    const chunks: KnowledgeNode[][] = [];
    for (let i = 0; i < nodes.length; i += chunkSize) {
      chunks.push(nodes.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private chunkRelationships(relationships: Relationship[], chunkSize: number = 1000): Relationship[][] {
    const chunks: Relationship[][] = [];
    for (let i = 0; i < relationships.length; i += chunkSize) {
      chunks.push(relationships.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private async updateIndices(graph: KnowledgeGraph): Promise<void> {
    const index: StorageIndex = {
      byType: new Map(),
      byPath: new Map(),
      byName: new Map(),
      byTag: new Map(),
      byLanguage: new Map(),
      relationships: new Map(),
      lastUpdated: new Date(),
      version: graph.version
    };

    // Index nodes
    for (const [nodeId, node] of graph.nodes) {
      // Index by type
      if (!index.byType.has(node.type)) {
        index.byType.set(node.type, new Set());
      }
      index.byType.get(node.type)!.add(nodeId);

      // Index by path
      index.byPath.set(node.path, nodeId);

      // Index by name
      if (!index.byName.has(node.name)) {
        index.byName.set(node.name, new Set());
      }
      index.byName.get(node.name)!.add(nodeId);

      // Index by tags
      for (const tag of node.tags) {
        if (!index.byTag.has(tag)) {
          index.byTag.set(tag, new Set());
        }
        index.byTag.get(tag)!.add(nodeId);
      }

      // Index by language
      const language = node.metadata.language;
      if (language) {
        if (!index.byLanguage.has(language)) {
          index.byLanguage.set(language, new Set());
        }
        index.byLanguage.get(language)!.add(nodeId);
      }
    }

    // Index relationships
    for (const [relId, relationship] of graph.relationships) {
      if (!index.relationships.has(relationship.from)) {
        index.relationships.set(relationship.from, new Set());
      }
      index.relationships.get(relationship.from)!.add(relId);

      if (!index.relationships.has(relationship.to)) {
        index.relationships.set(relationship.to, new Set());
      }
      index.relationships.get(relationship.to)!.add(relId);
    }

    this.indices.set(graph.id, index);
    await this.saveIndices();
  }

  private async updateMetadata(graph: KnowledgeGraph): Promise<void> {
    const metadata: StorageMetadata = {
      graphId: graph.id,
      projectPath: graph.projectPath,
      totalNodes: graph.nodes.size,
      totalRelationships: graph.relationships.size,
      storageVersion: this.STORAGE_VERSION,
      lastSync: new Date(),
      checksums: new Map()
    };

    this.metadata.set(graph.id, metadata);
    await this.saveMetadata();
  }

  private async loadIndices(): Promise<void> {
    const indicesPath = path.join(this.storagePath, 'indices.json');
    if (await fs.pathExists(indicesPath)) {
      try {
        const data = await fs.readJson(indicesPath);
        // Convert plain objects back to Maps
        for (const [graphId, indexData] of Object.entries(data)) {
          const typedIndexData = indexData as any;
          const index: StorageIndex = {
            byType: new Map(Object.entries(typedIndexData.byType || {}).map(([k, v]) => [k as NodeType, new Set(v as string[])])),
            byPath: new Map(Object.entries(typedIndexData.byPath || {})),
            byName: new Map(Object.entries(typedIndexData.byName || {}).map(([k, v]) => [k, new Set(v as string[])])),
            byTag: new Map(Object.entries(typedIndexData.byTag || {}).map(([k, v]) => [k, new Set(v as string[])])),
            byLanguage: new Map(Object.entries(typedIndexData.byLanguage || {}).map(([k, v]) => [k, new Set(v as string[])])),
            relationships: new Map(Object.entries(typedIndexData.relationships || {}).map(([k, v]) => [k, new Set(v as string[])])),
            lastUpdated: new Date(typedIndexData.lastUpdated || Date.now()),
            version: typedIndexData.version || 1
          };
          this.indices.set(graphId, index);
        }
      } catch (error) {
        console.warn('Failed to load indices, will rebuild');
      }
    }
  }

  private async saveIndices(): Promise<void> {
    const data: any = {};
    
    for (const [graphId, index] of this.indices) {
      data[graphId] = {
        byType: Object.fromEntries(Array.from(index.byType.entries()).map(([k, v]) => [k, Array.from(v)])),
        byPath: Object.fromEntries(index.byPath),
        byName: Object.fromEntries(Array.from(index.byName.entries()).map(([k, v]) => [k, Array.from(v)])),
        byTag: Object.fromEntries(Array.from(index.byTag.entries()).map(([k, v]) => [k, Array.from(v)])),
        byLanguage: Object.fromEntries(Array.from(index.byLanguage.entries()).map(([k, v]) => [k, Array.from(v)])),
        relationships: Object.fromEntries(Array.from(index.relationships.entries()).map(([k, v]) => [k, Array.from(v)])),
        lastUpdated: index.lastUpdated,
        version: index.version
      };
    }

    const indicesPath = path.join(this.storagePath, 'indices.json');
    await fs.writeJson(indicesPath, data, { spaces: 2 });
  }

  private async loadMetadata(): Promise<void> {
    const metadataPath = path.join(this.storagePath, 'metadata.json');
    if (await fs.pathExists(metadataPath)) {
      try {
        const data = await fs.readJson(metadataPath);
        for (const [graphId, metadata] of Object.entries(data)) {
          const typedMetadata = metadata as any;
          this.metadata.set(graphId, {
            ...typedMetadata,
            lastSync: new Date(typedMetadata.lastSync),
            checksums: new Map(Object.entries(typedMetadata.checksums || {}))
          } as StorageMetadata);
        }
      } catch (error) {
        console.warn('Failed to load metadata');
      }
    }
  }

  private async saveMetadata(): Promise<void> {
    const data: any = {};
    
    for (const [graphId, metadata] of this.metadata) {
      data[graphId] = {
        ...metadata,
        checksums: Object.fromEntries(metadata.checksums)
      };
    }

    const metadataPath = path.join(this.storagePath, 'metadata.json');
    await fs.writeJson(metadataPath, data, { spaces: 2 });
  }

  private queueWrite(key: string, operation: () => Promise<void>): void {
    this.writeQueue.set(key, operation);
  }

  private async processWriteQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      for (const [key, operation] of this.writeQueue) {
        await operation();
        this.writeQueue.delete(key);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async optimizeGraph(graphId: string): Promise<void> {
    // Consolidate chunks, remove tombstones, etc.
    // This is a placeholder for optimization logic
  }

  private async cleanupOrphanedFiles(): Promise<void> {
    // Remove files that are no longer referenced
    // This is a placeholder for cleanup logic
  }

  private async rebuildIndices(): Promise<void> {
    // Rebuild all indices from scratch
    for (const graphId of this.loadedGraphs.keys()) {
      const graph = this.loadedGraphs.get(graphId);
      if (graph) {
        await this.updateIndices(graph);
      }
    }
  }

  private async calculateDirectorySize(dirPath: string): Promise<number> {
    let totalSize = 0;
    
    const items = await fs.readdir(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        totalSize += await this.calculateDirectorySize(itemPath);
      } else {
        totalSize += stats.size;
      }
    }
    
    return totalSize;
  }
}