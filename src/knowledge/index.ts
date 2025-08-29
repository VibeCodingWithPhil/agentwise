/**
 * Knowledge Graph System - Main Exports
 * Comprehensive knowledge graph system for Agentwise
 */

// Core types
export * from './types';

// Main components
export { KnowledgeGraphGenerator } from './KnowledgeGraphGenerator';
export { KnowledgeGraphStore } from './KnowledgeGraphStore';
export { KnowledgeGraphQuery } from './KnowledgeGraphQuery';
export { KnowledgeGraphIntegration, type KnowledgeGraphIntegrationConfig } from './KnowledgeGraphIntegration';

// Re-export commonly used types
export type {
  KnowledgeNode,
  KnowledgeGraph,
  Relationship,
  NodeType,
  RelationshipType,
  SemanticInfo,
  OperationInfo,
  DataFlowInfo,
  PatternInfo,
  ErrorState,
  KnowledgeQuery,
  QueryResult,
  AnalysisConfig,
  UpdateResult,
  KnowledgeGraphEvent
} from './types';

/**
 * Create a complete knowledge graph system instance
 */
export function createKnowledgeGraphSystem(
  contextManager: any,
  config?: Partial<import('./KnowledgeGraphIntegration').KnowledgeGraphIntegrationConfig>
) {
  const { KnowledgeGraphIntegration } = require('./KnowledgeGraphIntegration');
  return new KnowledgeGraphIntegration(contextManager, config);
}

/**
 * Default configuration for knowledge graph analysis
 */
export const DEFAULT_ANALYSIS_CONFIG: Partial<import('./types').AnalysisConfig> = {
  includeTests: true,
  includeNodeModules: false,
  includeDocumentation: true,
  maxFileSize: 1024 * 1024, // 1MB
  supportedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'],
  analysisDepth: 'medium',
  enableSemanticAnalysis: true,
  enablePatternDetection: true,
  enableErrorDetection: true,
  customPatterns: []
};

/**
 * Default integration configuration
 */
export const DEFAULT_INTEGRATION_CONFIG: Partial<import('./KnowledgeGraphIntegration').KnowledgeGraphIntegrationConfig> = {
  enableAutoGeneration: true,
  enableIncrementalUpdates: true,
  generateKnowledgeFiles: true,
  knowledgeFileFormat: 'markdown',
  analysisConfig: DEFAULT_ANALYSIS_CONFIG,
  storageConfig: {
    basePath: '.knowledge',
    enableCompression: false,
    maxCacheSize: 100
  }
};