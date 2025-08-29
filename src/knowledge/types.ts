/**
 * Knowledge Graph Type Definitions
 * Comprehensive type system for the knowledge graph infrastructure
 */

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  path: string;
  relativePath: string;
  name: string;
  hash: string;
  lastModified: Date;
  lastAnalyzed: Date;
  size: number;
  metadata: NodeMetadata;
  relationships: Relationship[];
  semantics: SemanticInfo;
  errors: ErrorState[];
  tags: string[];
}

export type NodeType = 
  | 'module'
  | 'class' 
  | 'interface'
  | 'function'
  | 'variable'
  | 'type'
  | 'component'
  | 'service'
  | 'controller'
  | 'model'
  | 'utility'
  | 'test'
  | 'config'
  | 'asset'
  | 'directory';

export interface NodeMetadata {
  language: string;
  framework?: string;
  exports: ExportInfo[];
  imports: ImportInfo[];
  dependencies: string[];
  testCoverage?: number;
  complexity?: number;
  maintainabilityIndex?: number;
  cyclomaticComplexity?: number;
  linesOfCode: number;
  documentation?: DocumentationInfo;
  annotations: AnnotationInfo[];
}

export interface ExportInfo {
  name: string;
  type: 'default' | 'named' | 'namespace';
  signature?: string;
  description?: string;
  accessibility: 'public' | 'private' | 'protected';
}

export interface ImportInfo {
  module: string;
  imports: string[];
  type: 'static' | 'dynamic';
  isExternal: boolean;
  version?: string;
}

export interface DocumentationInfo {
  summary?: string;
  description?: string;
  examples?: string[];
  parameters?: ParameterInfo[];
  returns?: ReturnInfo;
  throws?: string[];
  since?: string;
  deprecated?: boolean;
}

export interface ParameterInfo {
  name: string;
  type: string;
  description?: string;
  optional: boolean;
  defaultValue?: string;
}

export interface ReturnInfo {
  type: string;
  description?: string;
}

export interface AnnotationInfo {
  type: string;
  value: any;
  description?: string;
}

export interface Relationship {
  id: string;
  type: RelationshipType;
  from: string;
  to: string;
  weight: number;
  metadata: RelationshipMetadata;
  bidirectional: boolean;
}

export type RelationshipType =
  | 'imports'
  | 'exports'
  | 'extends'
  | 'implements'
  | 'calls'
  | 'uses'
  | 'contains'
  | 'tests'
  | 'configures'
  | 'depends_on'
  | 'similar_to'
  | 'related_to';

export interface RelationshipMetadata {
  strength: number;
  frequency: number;
  context: string[];
  lastObserved: Date;
  confidence: number;
}

export interface SemanticInfo {
  purpose: string;
  operations: OperationInfo[];
  dataFlow: DataFlowInfo;
  businessLogic?: BusinessLogicInfo;
  patterns: PatternInfo[];
  responsibilities: string[];
}

export interface OperationInfo {
  name: string;
  type: 'create' | 'read' | 'update' | 'delete' | 'transform' | 'validate' | 'compute' | 'communicate';
  inputs: DataTypeInfo[];
  outputs: DataTypeInfo[];
  sideEffects: string[];
  complexity: 'low' | 'medium' | 'high';
}

export interface DataTypeInfo {
  name: string;
  type: string;
  optional: boolean;
  description?: string;
  validation?: ValidationRule[];
}

export interface ValidationRule {
  type: string;
  constraint: any;
  message: string;
}

export interface DataFlowInfo {
  inputs: string[];
  outputs: string[];
  transforms: TransformInfo[];
  persistence: PersistenceInfo[];
  streams: StreamInfo[];
}

export interface TransformInfo {
  operation: string;
  input: string;
  output: string;
  description: string;
}

export interface PersistenceInfo {
  type: 'database' | 'file' | 'cache' | 'memory' | 'external';
  location: string;
  operations: ('read' | 'write' | 'delete')[];
}

export interface StreamInfo {
  name: string;
  type: 'event' | 'data' | 'state';
  direction: 'inbound' | 'outbound' | 'bidirectional';
  protocol?: string;
}

export interface BusinessLogicInfo {
  domain: string;
  rules: BusinessRule[];
  constraints: string[];
  invariants: string[];
}

export interface BusinessRule {
  id: string;
  description: string;
  condition: string;
  action: string;
  priority: number;
}

export interface PatternInfo {
  name: string;
  type: 'design' | 'architectural' | 'code' | 'domain';
  confidence: number;
  description: string;
  examples: string[];
}

export interface ErrorState {
  id: string;
  type: ErrorType;
  severity: 'error' | 'warning' | 'info';
  message: string;
  location?: LocationInfo;
  suggestion?: string;
  fixable: boolean;
  lastSeen: Date;
}

export type ErrorType =
  | 'syntax'
  | 'type'
  | 'import'
  | 'export'
  | 'dependency'
  | 'security'
  | 'performance'
  | 'accessibility'
  | 'maintainability'
  | 'documentation'
  | 'test_coverage'
  | 'code_quality';

export interface LocationInfo {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  file: string;
}

export interface KnowledgeGraph {
  id: string;
  projectPath: string;
  nodes: Map<string, KnowledgeNode>;
  relationships: Map<string, Relationship>;
  metadata: GraphMetadata;
  statistics: GraphStatistics;
  lastUpdated: Date;
  version: number;
}

export interface GraphMetadata {
  projectName: string;
  language: string;
  framework?: string;
  totalFiles: number;
  totalLines: number;
  dependencies: string[];
  entryPoints: string[];
  testFiles: string[];
  coverage: CoverageInfo;
}

export interface CoverageInfo {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  threshold: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
}

export interface GraphStatistics {
  nodeCount: number;
  relationshipCount: number;
  maxDepth: number;
  averageConnectivity: number;
  complexityDistribution: Record<string, number>;
  patternFrequency: Record<string, number>;
  errorFrequency: Record<ErrorType, number>;
  dependencyMetrics: DependencyMetrics;
}

export interface DependencyMetrics {
  totalDependencies: number;
  externalDependencies: number;
  internalDependencies: number;
  circularDependencies: string[][];
  unusedDependencies: string[];
  outdatedDependencies: OutdatedDependency[];
}

export interface OutdatedDependency {
  name: string;
  current: string;
  latest: string;
  type: 'major' | 'minor' | 'patch';
}

export interface KnowledgeQuery {
  select: QuerySelector;
  where?: QueryCondition[];
  orderBy?: QuerySort[];
  limit?: number;
  offset?: number;
  includeRelationships?: boolean;
  includeMetadata?: boolean;
}

export interface QuerySelector {
  nodes?: string[] | '*';
  relationships?: string[] | '*';
  metadata?: string[] | '*';
}

export interface QueryCondition {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'matches' | 'greater' | 'less' | 'in' | 'exists';
  value: any;
  connector?: 'and' | 'or';
}

export interface QuerySort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryResult {
  nodes: KnowledgeNode[];
  relationships: Relationship[];
  metadata: any;
  totalCount: number;
  executionTime: number;
}

export interface AnalysisConfig {
  includeTests: boolean;
  includeNodeModules: boolean;
  includeDocumentation: boolean;
  maxFileSize: number;
  supportedExtensions: string[];
  analysisDepth: 'shallow' | 'medium' | 'deep';
  enableSemanticAnalysis: boolean;
  enablePatternDetection: boolean;
  enableErrorDetection: boolean;
  customPatterns: PatternDefinition[];
}

export interface PatternDefinition {
  name: string;
  type: string;
  matcher: string | RegExp;
  description: string;
  confidence: number;
}

export interface UpdateResult {
  added: string[];
  modified: string[];
  removed: string[];
  errors: AnalysisError[];
  duration: number;
}

export interface AnalysisError {
  file: string;
  error: string;
  type: 'parse' | 'analysis' | 'generation';
  recoverable: boolean;
}

export interface KnowledgeGraphEvent {
  type: 'node_added' | 'node_updated' | 'node_removed' | 'relationship_added' | 'relationship_updated' | 'relationship_removed' | 'graph_updated';
  data: {
    nodeId?: string;
    relationshipId?: string;
    changes?: any;
    metadata?: any;
  };
  timestamp: Date;
}