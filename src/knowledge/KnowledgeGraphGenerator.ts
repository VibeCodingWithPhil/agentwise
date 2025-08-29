/**
 * Knowledge Graph Generator
 * Main generator class that analyzes TypeScript/JavaScript files and creates comprehensive knowledge graphs
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import * as ts from 'typescript';

import {
  KnowledgeNode,
  KnowledgeGraph,
  NodeType,
  NodeMetadata,
  SemanticInfo,
  OperationInfo,
  DataFlowInfo,
  PatternInfo,
  ErrorState,
  Relationship,
  RelationshipType,
  AnalysisConfig,
  UpdateResult,
  AnalysisError,
  KnowledgeGraphEvent,
  ExportInfo,
  ImportInfo,
  DocumentationInfo,
  BusinessLogicInfo
} from './types';

export class KnowledgeGraphGenerator extends EventEmitter {
  private config: AnalysisConfig;
  private typeChecker?: ts.TypeChecker;
  private program?: ts.Program;
  private sourceFiles: Map<string, ts.SourceFile> = new Map();
  private analysisCache: Map<string, any> = new Map();

  constructor(config: Partial<AnalysisConfig> = {}) {
    super();
    this.config = {
      includeTests: true,
      includeNodeModules: false,
      includeDocumentation: true,
      maxFileSize: 1024 * 1024, // 1MB
      supportedExtensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'],
      analysisDepth: 'medium',
      enableSemanticAnalysis: true,
      enablePatternDetection: true,
      enableErrorDetection: true,
      customPatterns: [],
      ...config
    };
  }

  /**
   * Generate knowledge graph for a project
   */
  async generateGraph(projectPath: string): Promise<KnowledgeGraph> {
    console.log(`🧠 Generating knowledge graph for ${path.basename(projectPath)}...`);
    
    const startTime = Date.now();
    const graphId = crypto.createHash('md5').update(projectPath).digest('hex');

    // Initialize TypeScript program for semantic analysis
    await this.initializeTypeScript(projectPath);

    // Discover all relevant files
    const files = await this.discoverFiles(projectPath);
    console.log(`  📂 Found ${files.length} files to analyze`);

    // Create knowledge graph structure
    const graph: KnowledgeGraph = {
      id: graphId,
      projectPath,
      nodes: new Map(),
      relationships: new Map(),
      metadata: {
        projectName: path.basename(projectPath),
        language: 'typescript',
        framework: await this.detectFramework(projectPath),
        totalFiles: files.length,
        totalLines: 0,
        dependencies: [],
        entryPoints: [],
        testFiles: [],
        coverage: {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0,
          threshold: { statements: 80, branches: 80, functions: 80, lines: 80 }
        }
      },
      statistics: {
        nodeCount: 0,
        relationshipCount: 0,
        maxDepth: 0,
        averageConnectivity: 0,
        complexityDistribution: {},
        patternFrequency: {},
        errorFrequency: {
          syntax: 0,
          type: 0,
          import: 0,
          export: 0,
          dependency: 0,
          security: 0,
          performance: 0,
          accessibility: 0,
          maintainability: 0,
          documentation: 0,
          test_coverage: 0,
          code_quality: 0
        },
        dependencyMetrics: {
          totalDependencies: 0,
          externalDependencies: 0,
          internalDependencies: 0,
          circularDependencies: [],
          unusedDependencies: [],
          outdatedDependencies: []
        }
      },
      lastUpdated: new Date(),
      version: 1
    };

    // Analyze each file
    const errors: AnalysisError[] = [];
    let processedFiles = 0;

    for (const filePath of files) {
      try {
        const nodes = await this.analyzeFile(filePath, projectPath);
        
        // Add nodes to graph
        for (const node of nodes) {
          graph.nodes.set(node.id, node);
          graph.statistics.nodeCount++;
        }

        processedFiles++;
        if (processedFiles % 10 === 0) {
          console.log(`  ⚡ Processed ${processedFiles}/${files.length} files`);
          this.emit('progress', {
            type: 'analysis_progress',
            data: { processed: processedFiles, total: files.length }
          });
        }

      } catch (error) {
        const analysisError: AnalysisError = {
          file: filePath,
          error: error instanceof Error ? error.message : String(error),
          type: 'analysis',
          recoverable: true
        };
        errors.push(analysisError);
      }
    }

    // Generate relationships between nodes
    console.log('  🔗 Generating relationships...');
    await this.generateRelationships(graph);

    // Detect patterns and semantic information
    if (this.config.enablePatternDetection) {
      console.log('  🎯 Detecting patterns...');
      await this.detectPatterns(graph);
    }

    if (this.config.enableSemanticAnalysis) {
      console.log('  🧮 Analyzing semantics...');
      await this.analyzeSemantics(graph);
    }

    // Generate statistics
    await this.generateStatistics(graph);

    // Store graph metadata
    await this.storeGraphMetadata(graph);

    const duration = Date.now() - startTime;
    console.log(`  ✅ Knowledge graph generated in ${duration}ms`);
    console.log(`  📊 ${graph.statistics.nodeCount} nodes, ${graph.statistics.relationshipCount} relationships`);

    this.emit('graph_generated', { graph, errors, duration });

    return graph;
  }

  /**
   * Update knowledge graph incrementally
   */
  async updateGraph(graph: KnowledgeGraph, changedFiles: string[]): Promise<UpdateResult> {
    const startTime = Date.now();
    const result: UpdateResult = {
      added: [],
      modified: [],
      removed: [],
      errors: [],
      duration: 0
    };

    console.log(`🔄 Updating knowledge graph for ${changedFiles.length} changed files...`);

    for (const filePath of changedFiles) {
      try {
        const relativePath = path.relative(graph.projectPath, filePath);
        const nodeId = this.generateNodeId(relativePath, 'module');
        
        // Check if file still exists
        if (!await fs.pathExists(filePath)) {
          // File was deleted
          if (graph.nodes.has(nodeId)) {
            graph.nodes.delete(nodeId);
            result.removed.push(nodeId);
            
            // Remove related relationships
            const relationshipsToRemove: string[] = [];
            for (const [relId, relationship] of graph.relationships) {
              if (relationship.from === nodeId || relationship.to === nodeId) {
                relationshipsToRemove.push(relId);
              }
            }
            relationshipsToRemove.forEach(id => graph.relationships.delete(id));
          }
          continue;
        }

        // Analyze file
        const nodes = await this.analyzeFile(filePath, graph.projectPath);
        
        for (const node of nodes) {
          if (graph.nodes.has(node.id)) {
            // Update existing node
            graph.nodes.set(node.id, node);
            result.modified.push(node.id);
          } else {
            // Add new node
            graph.nodes.set(node.id, node);
            result.added.push(node.id);
          }
        }

      } catch (error) {
        const analysisError: AnalysisError = {
          file: filePath,
          error: error instanceof Error ? error.message : String(error),
          type: 'analysis',
          recoverable: true
        };
        result.errors.push(analysisError);
      }
    }

    // Regenerate affected relationships
    await this.updateRelationships(graph, [...result.added, ...result.modified]);

    // Update statistics
    await this.generateStatistics(graph);

    // Update version and timestamp
    graph.version++;
    graph.lastUpdated = new Date();

    result.duration = Date.now() - startTime;
    console.log(`  ✅ Graph updated in ${result.duration}ms`);

    this.emit('graph_updated', { result });

    return result;
  }

  /**
   * Initialize TypeScript program for semantic analysis
   */
  private async initializeTypeScript(projectPath: string): Promise<void> {
    const tsconfigPath = path.join(projectPath, 'tsconfig.json');
    let compilerOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      strict: false,
      esModuleInterop: true,
      skipLibCheck: true
    };

    if (await fs.pathExists(tsconfigPath)) {
      const tsconfig = await fs.readJson(tsconfigPath);
      compilerOptions = { ...compilerOptions, ...tsconfig.compilerOptions };
    }

    const files = await this.discoverFiles(projectPath);
    this.program = ts.createProgram(files, compilerOptions);
    this.typeChecker = this.program.getTypeChecker();

    // Cache source files
    for (const sourceFile of this.program.getSourceFiles()) {
      if (!sourceFile.fileName.includes('node_modules')) {
        this.sourceFiles.set(sourceFile.fileName, sourceFile);
      }
    }
  }

  /**
   * Discover all files to analyze
   */
  private async discoverFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];

    const scanDirectory = async (dirPath: string): Promise<void> => {
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          // Skip certain directories
          if (this.shouldSkipDirectory(item)) continue;
          await scanDirectory(itemPath);
        } else if (stats.isFile()) {
          // Check if file should be analyzed
          if (this.shouldAnalyzeFile(itemPath, stats.size)) {
            files.push(itemPath);
          }
        }
      }
    };

    await scanDirectory(projectPath);
    return files;
  }

  /**
   * Analyze a single file and extract knowledge nodes
   */
  private async analyzeFile(filePath: string, projectPath: string): Promise<KnowledgeNode[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = await fs.stat(filePath);
    const hash = crypto.createHash('md5').update(content).digest('hex');
    const relativePath = path.relative(projectPath, filePath);
    
    const nodes: KnowledgeNode[] = [];
    
    // Create main file node
    const fileNode = await this.createFileNode(filePath, relativePath, content, hash, stats);
    nodes.push(fileNode);

    // Parse TypeScript/JavaScript for deeper analysis
    if (this.isCodeFile(filePath)) {
      const sourceFile = this.sourceFiles.get(filePath);
      if (sourceFile) {
        const codeNodes = await this.analyzeSourceFile(sourceFile, projectPath);
        nodes.push(...codeNodes);
      }
    }

    return nodes;
  }

  /**
   * Create a file-level knowledge node
   */
  private async createFileNode(
    filePath: string,
    relativePath: string,
    content: string,
    hash: string,
    stats: fs.Stats
  ): Promise<KnowledgeNode> {
    const nodeType = this.determineNodeType(filePath, content);
    const language = this.detectLanguage(filePath);

    // Extract basic metadata
    const metadata: NodeMetadata = {
      language,
      exports: this.extractExports(content, language),
      imports: this.extractImports(content, language),
      dependencies: [],
      linesOfCode: content.split('\n').length,
      annotations: []
    };

    // Extract semantic information
    const semantics = await this.extractSemantics(content, nodeType, language);

    // Detect errors
    const errors = this.config.enableErrorDetection ? 
      await this.detectErrors(content, filePath, language) : [];

    const node: KnowledgeNode = {
      id: this.generateNodeId(relativePath, nodeType),
      type: nodeType,
      path: filePath,
      relativePath,
      name: path.basename(filePath),
      hash,
      lastModified: stats.mtime,
      lastAnalyzed: new Date(),
      size: stats.size,
      metadata,
      relationships: [],
      semantics,
      errors,
      tags: this.generateTags(nodeType, semantics, filePath)
    };

    return node;
  }

  /**
   * Analyze TypeScript source file for detailed code structure
   */
  private async analyzeSourceFile(sourceFile: ts.SourceFile, projectPath: string): Promise<KnowledgeNode[]> {
    const nodes: KnowledgeNode[] = [];
    const relativePath = path.relative(projectPath, sourceFile.fileName);

    const visit = (node: ts.Node): void => {
      // Extract classes
      if (ts.isClassDeclaration(node) && node.name) {
        const classNode = this.createClassNode(node, relativePath, sourceFile);
        if (classNode) nodes.push(classNode);
      }

      // Extract interfaces
      if (ts.isInterfaceDeclaration(node)) {
        const interfaceNode = this.createInterfaceNode(node, relativePath, sourceFile);
        if (interfaceNode) nodes.push(interfaceNode);
      }

      // Extract functions
      if (ts.isFunctionDeclaration(node) && node.name) {
        const functionNode = this.createFunctionNode(node, relativePath, sourceFile);
        if (functionNode) nodes.push(functionNode);
      }

      // Extract type aliases
      if (ts.isTypeAliasDeclaration(node)) {
        const typeNode = this.createTypeNode(node, relativePath, sourceFile);
        if (typeNode) nodes.push(typeNode);
      }

      // Continue traversing
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return nodes;
  }

  /**
   * Create class node from TypeScript AST
   */
  private createClassNode(
    classDecl: ts.ClassDeclaration,
    relativePath: string,
    sourceFile: ts.SourceFile
  ): KnowledgeNode | null {
    if (!classDecl.name) return null;

    const className = classDecl.name.text;
    const nodeId = this.generateNodeId(relativePath, 'class', className);

    // Extract class metadata
    const methods = classDecl.members
      .filter(ts.isMethodDeclaration)
      .map(method => method.name?.getText(sourceFile) || 'anonymous')
      .filter(name => name !== 'anonymous');

    const properties = classDecl.members
      .filter(ts.isPropertyDeclaration)
      .map(prop => prop.name?.getText(sourceFile) || 'anonymous')
      .filter(name => name !== 'anonymous');

    // Extract documentation
    const documentation = this.extractTSDocumentation(classDecl);

    const metadata: NodeMetadata = {
      language: 'typescript',
      exports: [{
        name: className,
        type: 'named',
        accessibility: 'public',
        signature: `class ${className}`
      }],
      imports: [],
      dependencies: [],
      linesOfCode: this.getNodeLineCount(classDecl, sourceFile),
      documentation,
      annotations: []
    };

    const semantics: SemanticInfo = {
      purpose: `Class definition for ${className}`,
      operations: this.extractClassOperations(classDecl, sourceFile),
      dataFlow: {
        inputs: properties,
        outputs: methods,
        transforms: [],
        persistence: [],
        streams: []
      },
      patterns: [],
      responsibilities: [`Encapsulates ${className} behavior and state`]
    };

    return {
      id: nodeId,
      type: 'class',
      path: sourceFile.fileName,
      relativePath,
      name: className,
      hash: crypto.createHash('md5').update(classDecl.getFullText(sourceFile)).digest('hex'),
      lastModified: new Date(),
      lastAnalyzed: new Date(),
      size: classDecl.getFullText(sourceFile).length,
      metadata,
      relationships: [],
      semantics,
      errors: [],
      tags: ['class', 'typescript', ...this.inferClassTags(classDecl, sourceFile)]
    };
  }

  /**
   * Create interface node from TypeScript AST
   */
  private createInterfaceNode(
    interfaceDecl: ts.InterfaceDeclaration,
    relativePath: string,
    sourceFile: ts.SourceFile
  ): KnowledgeNode {
    const interfaceName = interfaceDecl.name.text;
    const nodeId = this.generateNodeId(relativePath, 'interface', interfaceName);

    // Extract interface members
    const members = interfaceDecl.members.map(member => {
      if (ts.isPropertySignature(member) && member.name) {
        return member.name.getText(sourceFile);
      }
      if (ts.isMethodSignature(member) && member.name) {
        return member.name.getText(sourceFile);
      }
      return 'anonymous';
    }).filter(name => name !== 'anonymous');

    const documentation = this.extractTSDocumentation(interfaceDecl);

    const metadata: NodeMetadata = {
      language: 'typescript',
      exports: [{
        name: interfaceName,
        type: 'named',
        accessibility: 'public',
        signature: `interface ${interfaceName}`
      }],
      imports: [],
      dependencies: [],
      linesOfCode: this.getNodeLineCount(interfaceDecl, sourceFile),
      documentation,
      annotations: []
    };

    const semantics: SemanticInfo = {
      purpose: `Type definition for ${interfaceName}`,
      operations: [],
      dataFlow: {
        inputs: [],
        outputs: members,
        transforms: [],
        persistence: [],
        streams: []
      },
      patterns: [],
      responsibilities: [`Defines contract for ${interfaceName}`]
    };

    return {
      id: nodeId,
      type: 'interface',
      path: sourceFile.fileName,
      relativePath,
      name: interfaceName,
      hash: crypto.createHash('md5').update(interfaceDecl.getFullText(sourceFile)).digest('hex'),
      lastModified: new Date(),
      lastAnalyzed: new Date(),
      size: interfaceDecl.getFullText(sourceFile).length,
      metadata,
      relationships: [],
      semantics,
      errors: [],
      tags: ['interface', 'typescript', 'contract']
    };
  }

  /**
   * Create function node from TypeScript AST
   */
  private createFunctionNode(
    funcDecl: ts.FunctionDeclaration,
    relativePath: string,
    sourceFile: ts.SourceFile
  ): KnowledgeNode | null {
    if (!funcDecl.name) return null;

    const functionName = funcDecl.name.text;
    const nodeId = this.generateNodeId(relativePath, 'function', functionName);

    const documentation = this.extractTSDocumentation(funcDecl);
    const complexity = this.calculateCyclomaticComplexity(funcDecl);

    const metadata: NodeMetadata = {
      language: 'typescript',
      exports: [{
        name: functionName,
        type: 'named',
        accessibility: 'public',
        signature: this.getFunctionSignature(funcDecl, sourceFile)
      }],
      imports: [],
      dependencies: [],
      linesOfCode: this.getNodeLineCount(funcDecl, sourceFile),
      cyclomaticComplexity: complexity,
      documentation,
      annotations: []
    };

    const operations = this.extractFunctionOperations(funcDecl, sourceFile);
    const semantics: SemanticInfo = {
      purpose: documentation?.summary || `Function ${functionName}`,
      operations,
      dataFlow: this.extractFunctionDataFlow(funcDecl, sourceFile),
      patterns: [],
      responsibilities: this.inferFunctionResponsibilities(funcDecl, sourceFile)
    };

    return {
      id: nodeId,
      type: 'function',
      path: sourceFile.fileName,
      relativePath,
      name: functionName,
      hash: crypto.createHash('md5').update(funcDecl.getFullText(sourceFile)).digest('hex'),
      lastModified: new Date(),
      lastAnalyzed: new Date(),
      size: funcDecl.getFullText(sourceFile).length,
      metadata,
      relationships: [],
      semantics,
      errors: [],
      tags: ['function', 'typescript', ...this.inferFunctionTags(funcDecl, sourceFile)]
    };
  }

  /**
   * Create type node from TypeScript AST
   */
  private createTypeNode(
    typeDecl: ts.TypeAliasDeclaration,
    relativePath: string,
    sourceFile: ts.SourceFile
  ): KnowledgeNode {
    const typeName = typeDecl.name.text;
    const nodeId = this.generateNodeId(relativePath, 'type', typeName);

    const documentation = this.extractTSDocumentation(typeDecl);

    const metadata: NodeMetadata = {
      language: 'typescript',
      exports: [{
        name: typeName,
        type: 'named',
        accessibility: 'public',
        signature: `type ${typeName}`
      }],
      imports: [],
      dependencies: [],
      linesOfCode: this.getNodeLineCount(typeDecl, sourceFile),
      documentation,
      annotations: []
    };

    const semantics: SemanticInfo = {
      purpose: `Type alias for ${typeName}`,
      operations: [],
      dataFlow: {
        inputs: [],
        outputs: [typeName],
        transforms: [],
        persistence: [],
        streams: []
      },
      patterns: [],
      responsibilities: [`Defines type alias ${typeName}`]
    };

    return {
      id: nodeId,
      type: 'type',
      path: sourceFile.fileName,
      relativePath,
      name: typeName,
      hash: crypto.createHash('md5').update(typeDecl.getFullText(sourceFile)).digest('hex'),
      lastModified: new Date(),
      lastAnalyzed: new Date(),
      size: typeDecl.getFullText(sourceFile).length,
      metadata,
      relationships: [],
      semantics,
      errors: [],
      tags: ['type', 'typescript', 'alias']
    };
  }

  /**
   * Generate relationships between nodes
   */
  private async generateRelationships(graph: KnowledgeGraph): Promise<void> {
    const relationships: Relationship[] = [];

    for (const [nodeId, node] of graph.nodes) {
      // Import relationships
      for (const importInfo of node.metadata.imports) {
        const targetNodeId = this.findNodeByModuleName(graph, importInfo.module);
        if (targetNodeId) {
          relationships.push(this.createRelationship(
            nodeId,
            targetNodeId,
            'imports',
            { strength: 1, frequency: 1, context: ['import'], lastObserved: new Date(), confidence: 0.9 }
          ));
        }
      }

      // Inheritance relationships (for classes)
      if (node.type === 'class') {
        const inheritance = this.extractInheritance(node);
        for (const baseClass of inheritance) {
          const baseNodeId = this.findNodeByName(graph, baseClass, 'class');
          if (baseNodeId) {
            relationships.push(this.createRelationship(
              nodeId,
              baseNodeId,
              'extends',
              { strength: 1, frequency: 1, context: ['inheritance'], lastObserved: new Date(), confidence: 1 }
            ));
          }
        }
      }

      // Usage relationships
      const usages = await this.extractUsageRelationships(node, graph);
      relationships.push(...usages);
    }

    // Store relationships
    for (const relationship of relationships) {
      graph.relationships.set(relationship.id, relationship);
      graph.statistics.relationshipCount++;
    }
  }

  /**
   * Detect patterns in the codebase
   */
  private async detectPatterns(graph: KnowledgeGraph): Promise<void> {
    const patterns = new Map<string, number>();

    for (const node of graph.nodes.values()) {
      const nodePatterns = await this.analyzeNodePatterns(node, graph);
      
      for (const pattern of nodePatterns) {
        node.semantics.patterns.push(pattern);
        patterns.set(pattern.name, (patterns.get(pattern.name) || 0) + 1);
      }
    }

    graph.statistics.patternFrequency = Object.fromEntries(patterns);
  }

  /**
   * Analyze semantic information
   */
  private async analyzeSemantics(graph: KnowledgeGraph): Promise<void> {
    for (const node of graph.nodes.values()) {
      if (this.config.analysisDepth === 'deep') {
        await this.enhanceSemanticAnalysis(node, graph);
      }
    }
  }

  /**
   * Generate comprehensive statistics
   */
  private async generateStatistics(graph: KnowledgeGraph): Promise<void> {
    // Update node count
    graph.statistics.nodeCount = graph.nodes.size;
    graph.statistics.relationshipCount = graph.relationships.size;

    // Calculate complexity distribution
    const complexities = new Map<string, number>();
    for (const node of graph.nodes.values()) {
      const complexity = node.metadata.cyclomaticComplexity || 1;
      let level = 'low';
      if (complexity > 10) level = 'high';
      else if (complexity > 5) level = 'medium';
      
      complexities.set(level, (complexities.get(level) || 0) + 1);
    }
    graph.statistics.complexityDistribution = Object.fromEntries(complexities);

    // Calculate average connectivity
    const totalConnections = Array.from(graph.relationships.values()).length * 2; // bidirectional
    graph.statistics.averageConnectivity = graph.nodes.size > 0 ? 
      totalConnections / graph.nodes.size : 0;

    // Analyze dependencies
    await this.analyzeDependencies(graph);

    // Count errors by type
    const errorCounts = new Map();
    for (const node of graph.nodes.values()) {
      for (const error of node.errors) {
        errorCounts.set(error.type, (errorCounts.get(error.type) || 0) + 1);
      }
    }
    graph.statistics.errorFrequency = Object.fromEntries(errorCounts);
  }

  /**
   * Store graph metadata to filesystem
   */
  private async storeGraphMetadata(graph: KnowledgeGraph): Promise<void> {
    const metadataPath = path.join(graph.projectPath, '.knowledge', 'graph-metadata.json');
    await fs.ensureDir(path.dirname(metadataPath));
    
    const metadata = {
      id: graph.id,
      version: graph.version,
      lastUpdated: graph.lastUpdated,
      statistics: graph.statistics,
      metadata: graph.metadata
    };

    await fs.writeJson(metadataPath, metadata, { spaces: 2 });
  }

  // Helper methods
  private shouldSkipDirectory(dirname: string): boolean {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.cache'];
    return skipDirs.includes(dirname) || 
           (!this.config.includeNodeModules && dirname === 'node_modules');
  }

  private shouldAnalyzeFile(filePath: string, size: number): boolean {
    if (size > this.config.maxFileSize) return false;
    
    const ext = path.extname(filePath);
    if (!this.config.supportedExtensions.includes(ext)) return false;

    if (!this.config.includeTests && this.isTestFile(filePath)) return false;

    return true;
  }

  private isTestFile(filePath: string): boolean {
    return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) || 
           filePath.includes('__tests__') || 
           filePath.includes('/tests/');
  }

  private isCodeFile(filePath: string): boolean {
    return /\.(ts|tsx|js|jsx)$/.test(filePath);
  }

  private generateNodeId(relativePath: string, type: NodeType, name?: string): string {
    const base = `${relativePath}::${type}`;
    return name ? `${base}::${name}` : base;
  }

  private determineNodeType(filePath: string, content: string): NodeType {
    const basename = path.basename(filePath);
    const ext = path.extname(filePath);

    if (this.isTestFile(filePath)) return 'test';
    if (basename.includes('config')) return 'config';
    if (ext === '.json' || ext === '.yaml' || ext === '.yml') return 'config';
    if (content.includes('export default') && content.includes('component')) return 'component';
    if (content.includes('class ') && content.includes('Controller')) return 'controller';
    if (content.includes('interface ') || content.includes('type ')) return 'model';
    if (basename.includes('service') || basename.includes('Service')) return 'service';
    if (basename.includes('util') || basename.includes('helper')) return 'utility';
    
    return 'module';
  }

  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath);
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.vue': 'vue',
      '.svelte': 'svelte',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust'
    };
    return languageMap[ext] || 'unknown';
  }

  private async detectFramework(projectPath: string): Promise<string | undefined> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!await fs.pathExists(packageJsonPath)) return undefined;

    const packageJson = await fs.readJson(packageJsonPath);
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    if (deps['next']) return 'nextjs';
    if (deps['react']) return 'react';
    if (deps['vue']) return 'vue';
    if (deps['@angular/core']) return 'angular';
    if (deps['svelte']) return 'svelte';
    if (deps['express']) return 'express';
    if (deps['fastify']) return 'fastify';

    return undefined;
  }

  // Additional helper methods would be implemented here...
  // This includes methods for:
  // - extractExports, extractImports
  // - extractSemantics, detectErrors
  // - createRelationship, updateRelationships
  // - extractUsageRelationships, analyzeNodePatterns
  // - calculateCyclomaticComplexity, extractTSDocumentation
  // - And many more utility methods

  private extractExports(content: string, language: string): ExportInfo[] {
    // Implementation would extract exports based on language
    return [];
  }

  private extractImports(content: string, language: string): ImportInfo[] {
    // Implementation would extract imports based on language
    return [];
  }

  private async extractSemantics(content: string, nodeType: NodeType, language: string): Promise<SemanticInfo> {
    return {
      purpose: `${nodeType} implementation`,
      operations: [],
      dataFlow: { inputs: [], outputs: [], transforms: [], persistence: [], streams: [] },
      patterns: [],
      responsibilities: []
    };
  }

  private async detectErrors(content: string, filePath: string, language: string): Promise<ErrorState[]> {
    return [];
  }

  private generateTags(nodeType: NodeType, semantics: SemanticInfo, filePath: string): string[] {
    const tags = [nodeType];
    if (this.isTestFile(filePath)) tags.push('test');
    if (filePath.includes('component')) tags.push('component');
    return tags;
  }

  private findNodeByModuleName(graph: KnowledgeGraph, moduleName: string): string | undefined {
    // Try to find node by module name
    for (const [nodeId, node] of graph.nodes) {
      // Check if the node path matches the module name
      if (node.path) {
        const nodeName = node.path.replace(/\.(ts|tsx|js|jsx)$/, '');
        const normalizedModule = moduleName.replace(/^\.\//, '').replace(/^@\//, 'src/');
        
        if (nodeName.endsWith(normalizedModule) || nodeName.endsWith(moduleName)) {
          return nodeId;
        }
        
        // Check if module name matches the node name
        if (node.name === moduleName || node.name === normalizedModule) {
          return nodeId;
        }
      }
    }
    return undefined;
  }

  private findNodeByName(graph: KnowledgeGraph, name: string, type: NodeType): string | undefined {
    // Find nodes by name and type
    for (const [nodeId, node] of graph.nodes) {
      if (node.name === name && node.type === type) {
        return nodeId;
      }
    }
    return undefined;
  }

  private extractInheritance(node: KnowledgeNode): string[] {
    // Extract inheritance from metadata
    const inheritance: string[] = [];
    
    // For now, return empty array since we don't have content access
    // In a full implementation, this would parse the actual file content
    // to extract extends and implements clauses
    
    return inheritance;
  }

  private async extractUsageRelationships(node: KnowledgeNode, graph: KnowledgeGraph): Promise<Relationship[]> {
    // Implementation would extract usage relationships
    return [];
  }

  private createRelationship(
    from: string, 
    to: string, 
    type: RelationshipType, 
    metadata: any
  ): Relationship {
    return {
      id: `${from}-${type}-${to}`,
      type,
      from,
      to,
      weight: 1,
      metadata,
      bidirectional: false
    };
  }

  private async analyzeNodePatterns(node: KnowledgeNode, graph: KnowledgeGraph): Promise<PatternInfo[]> {
    // Implementation would analyze patterns in nodes
    return [];
  }

  private async enhanceSemanticAnalysis(node: KnowledgeNode, graph: KnowledgeGraph): Promise<void> {
    // Implementation would enhance semantic analysis
  }

  private async analyzeDependencies(graph: KnowledgeGraph): Promise<void> {
    // Implementation would analyze project dependencies
  }

  private getNodeLineCount(node: ts.Node, sourceFile: ts.SourceFile): number {
    const start = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const end = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    return end.line - start.line + 1;
  }

  private extractTSDocumentation(node: ts.Node): DocumentationInfo | undefined {
    // Implementation would extract TSDoc comments
    return undefined;
  }

  private extractClassOperations(classDecl: ts.ClassDeclaration, sourceFile: ts.SourceFile): OperationInfo[] {
    // Implementation would extract class operations
    return [];
  }

  private inferClassTags(classDecl: ts.ClassDeclaration, sourceFile: ts.SourceFile): string[] {
    // Implementation would infer tags for classes
    return [];
  }

  private calculateCyclomaticComplexity(func: ts.FunctionDeclaration): number {
    // Implementation would calculate cyclomatic complexity
    return 1;
  }

  private getFunctionSignature(func: ts.FunctionDeclaration, sourceFile: ts.SourceFile): string {
    // Implementation would extract function signature
    return func.name?.text || 'anonymous';
  }

  private extractFunctionOperations(func: ts.FunctionDeclaration, sourceFile: ts.SourceFile): OperationInfo[] {
    // Implementation would extract function operations
    return [];
  }

  private extractFunctionDataFlow(func: ts.FunctionDeclaration, sourceFile: ts.SourceFile): DataFlowInfo {
    // Implementation would extract function data flow
    return { inputs: [], outputs: [], transforms: [], persistence: [], streams: [] };
  }

  private inferFunctionResponsibilities(func: ts.FunctionDeclaration, sourceFile: ts.SourceFile): string[] {
    // Implementation would infer function responsibilities
    return [];
  }

  private inferFunctionTags(func: ts.FunctionDeclaration, sourceFile: ts.SourceFile): string[] {
    // Implementation would infer function tags
    return [];
  }

  private async updateRelationships(graph: KnowledgeGraph, affectedNodeIds: string[]): Promise<void> {
    // Implementation would update relationships for affected nodes
  }
}