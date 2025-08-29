# Agentwise Knowledge Graph System

A comprehensive knowledge graph system that provides semantic understanding, relationship mapping, and intelligent analysis of your codebase.

## Overview

The Knowledge Graph system extends Agentwise's Context 3.0 system by creating a rich semantic model of your project that includes:

- **Semantic Understanding**: Deep analysis of code purpose, operations, and business logic
- **Relationship Mapping**: Tracks dependencies, inheritance, usage patterns, and data flows
- **Pattern Detection**: Identifies design patterns, anti-patterns, and architectural decisions
- **Error Analysis**: Detects potential issues, code smells, and maintainability problems
- **Documentation Generation**: Auto-generates comprehensive `.kg.md` knowledge files

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Knowledge Graph System                      │
├─────────────────────────────────────────────────────────────────┤
│  KnowledgeGraphIntegration (Main Interface)                    │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │ KnowledgeGraph      │  │ KnowledgeGraph   │  │ KnowledgeGraph│ │
│  │ Generator           │  │ Store            │  │ Query         │ │
│  │                     │  │                  │  │               │ │
│  │ • File Analysis     │  │ • Efficient      │  │ • SQL-like    │ │
│  │ • TypeScript AST    │  │   Storage        │  │   Queries     │ │
│  │ • Semantic          │  │ • Indexing       │  │ • Graph       │ │
│  │   Extraction        │  │ • Caching        │  │   Traversal   │ │
│  │ • Pattern           │  │ • Backup &       │  │ • Similarity  │ │
│  │   Detection         │  │   Restore        │  │   Search      │ │
│  └─────────────────────┘  └──────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                   Context 3.0 Integration                      │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### 🧠 Semantic Analysis
- **Purpose Detection**: Automatically identifies what each module, class, and function does
- **Operation Mapping**: Catalogs CRUD operations, transformations, and side effects
- **Business Logic Analysis**: Extracts domain rules and constraints
- **Data Flow Tracking**: Maps how data moves through your application

### 🔗 Relationship Intelligence
- **Dependency Mapping**: Tracks imports, exports, and usage relationships
- **Inheritance Hierarchies**: Maps class inheritance and interface implementations
- **Call Graphs**: Tracks function and method invocations
- **Component Relationships**: Maps React/Vue component hierarchies

### 🎯 Pattern Detection
- **Design Patterns**: Identifies Singleton, Factory, Observer, MVC, etc.
- **Architectural Patterns**: Detects microservices, layered architecture, etc.
- **Anti-Patterns**: Flags code smells, circular dependencies, god objects
- **Custom Patterns**: Supports user-defined pattern detection rules

### 🚨 Quality Analysis
- **Complexity Metrics**: Cyclomatic complexity, maintainability index
- **Error Detection**: Syntax errors, type mismatches, missing dependencies
- **Security Issues**: Potential vulnerabilities and unsafe patterns
- **Performance Issues**: Inefficient algorithms and resource usage

### 📄 Auto-Documentation
- **Knowledge Files**: Generates `.kg.md` files for each module
- **Relationship Diagrams**: Visual representation of dependencies
- **API Documentation**: Extracts and formats function signatures
- **Architecture Overview**: High-level project structure documentation

## Usage

### Command Line Interface

```bash
# Generate knowledge graph for current project
/knowledge generate

# Query the knowledge graph
/knowledge query classes --limit 10
/knowledge query components --verbose
/knowledge query complex  # High complexity nodes

# Analyze project structure
/knowledge analyze

# Find related files
/knowledge related src/components/UserProfile.tsx

# Analyze dependencies
/knowledge dependencies src/services/AuthService.ts

# Search knowledge base
/knowledge search "authentication" --fuzzy

# Show statistics
/knowledge stats

# Find patterns and errors
/knowledge patterns
/knowledge errors

# Update knowledge graph
/knowledge update src/modified-file.ts
```

### Programmatic Usage

```typescript
import { 
  KnowledgeGraphIntegration, 
  CodebaseContextManager,
  DEFAULT_INTEGRATION_CONFIG 
} from './knowledge';

// Initialize system
const contextManager = new CodebaseContextManager();
const integration = new KnowledgeGraphIntegration(
  contextManager, 
  DEFAULT_INTEGRATION_CONFIG
);

await integration.initialize();

// Generate knowledge graph
const graphId = await integration.generateProjectKnowledgeGraph('./my-project');

// Query the graph
const classes = await integration.queryProject('./my-project', {
  select: { nodes: '*' },
  where: [{ field: 'type', operator: 'equals', value: 'class' }],
  orderBy: [{ field: 'metadata.linesOfCode', direction: 'desc' }],
  limit: 10
});

// Find related files
const related = await integration.findRelatedFiles(
  './my-project',
  './src/components/App.tsx',
  5
);

// Get dependencies
const deps = await integration.getModuleDependencies(
  './my-project',
  './src/services/UserService.ts'
);
```

### Advanced Querying

```typescript
import { KnowledgeGraphQuery } from './knowledge';

const query = new KnowledgeGraphQuery(store);

// Find shortest path between components
const path = await query.findShortestPath(
  graphId,
  'src/components/App.tsx::component::App',
  'src/services/UserService.ts::class::UserService',
  10,
  ['imports', 'calls', 'uses']
);

// Full-text search
const searchResults = await query.fullTextSearch(
  graphId,
  'user authentication',
  ['name', 'purpose', 'description'],
  true // fuzzy search
);

// Find similar nodes
const similar = await query.findSimilarNodes(
  graphId,
  'src/components/UserProfile.tsx::component::UserProfile',
  {
    structural: 0.4,
    semantic: 0.4,
    relationship: 0.2
  },
  10
);

// Analyze graph structure
const analysis = await query.analyzeGraph(graphId);
console.log(`Clusters: ${analysis.clusters.length}`);
console.log(`Cycles: ${analysis.cycleDetection.length}`);
```

## Generated Knowledge Files

The system generates comprehensive `.kg.md` files in the `.knowledge/` directory:

```
.knowledge/
├── index.md                    # Main overview
├── src/
│   ├── components/
│   │   ├── App.tsx.kg.md      # Component knowledge
│   │   └── UserProfile.tsx.kg.md
│   ├── services/
│   │   └── UserService.ts.kg.md
│   └── types/
│       └── User.ts.kg.md
└── graph-metadata.json        # Graph metadata
```

Each `.kg.md` file contains:
- **Purpose**: What the module does
- **Operations**: Functions and methods with signatures
- **Data Flow**: Inputs, outputs, and transformations
- **Relationships**: Dependencies and connections
- **Patterns**: Detected design patterns
- **Errors**: Issues and suggestions
- **Metrics**: Complexity and quality metrics

## Integration with Context 3.0

The Knowledge Graph system seamlessly integrates with Agentwise's Context 3.0:

- **Automatic Generation**: Knowledge graphs are created when projects are initialized
- **Incremental Updates**: Changes are reflected in real-time as files are modified
- **Context Enhancement**: Adds semantic understanding to existing file context
- **Agent Optimization**: Provides rich context for AI agents to make better decisions

## Configuration

```typescript
const config: KnowledgeGraphIntegrationConfig = {
  enableAutoGeneration: true,        // Auto-generate on project init
  enableIncrementalUpdates: true,    // Update on file changes
  generateKnowledgeFiles: true,      // Create .kg.md files
  knowledgeFileFormat: 'markdown',   // Output format
  
  analysisConfig: {
    includeTests: true,              // Analyze test files
    includeNodeModules: false,       // Skip node_modules
    analysisDepth: 'medium',         // shallow | medium | deep
    enableSemanticAnalysis: true,    // Extract semantic info
    enablePatternDetection: true,    // Detect patterns
    enableErrorDetection: true,      // Find issues
    maxFileSize: 1024 * 1024,       // 1MB limit
    supportedExtensions: [           // File types to analyze
      '.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'
    ]
  },

  storageConfig: {
    basePath: '.knowledge',          // Storage directory
    enableCompression: false,        // Compress data
    maxCacheSize: 100               // Cache size limit
  }
};
```

## Performance

The Knowledge Graph system is designed for efficiency:

- **Incremental Updates**: Only analyzes changed files
- **Smart Caching**: Caches analysis results and graph data
- **Chunked Storage**: Large graphs are split into manageable chunks
- **Indexed Queries**: Fast lookups using multiple indices
- **Background Processing**: Analysis runs in the background
- **Memory Optimization**: Efficient data structures and garbage collection

## Use Cases

### 🔍 Code Exploration
- **New Team Members**: Quickly understand codebase structure
- **Legacy Code**: Navigate and document legacy systems
- **Architecture Review**: Analyze system design and patterns

### 🧹 Code Maintenance
- **Refactoring**: Find all usages and dependencies before changes
- **Dependency Management**: Identify unused or outdated dependencies
- **Circular Dependencies**: Detect and resolve circular imports

### 📊 Quality Assurance
- **Code Reviews**: Automated quality and complexity analysis
- **Technical Debt**: Identify areas needing improvement
- **Security Audits**: Find potential security vulnerabilities

### 📖 Documentation
- **Automated Docs**: Generate comprehensive documentation
- **API Documentation**: Extract and format API signatures
- **Architecture Diagrams**: Visual system representations

### 🤖 AI Enhancement
- **Context for AI**: Provide rich semantic context to AI agents
- **Smart Suggestions**: Enable AI to make informed recommendations
- **Automated Tasks**: AI can understand project structure for better task execution

## Future Enhancements

- **Visual Graph Explorer**: Interactive web-based graph visualization
- **Machine Learning**: Pattern detection using ML models
- **Collaboration Features**: Team knowledge sharing and annotations
- **Integration APIs**: Connect with external tools and services
- **Performance Profiling**: Runtime analysis and optimization suggestions
- **Multi-Language Support**: Expand beyond TypeScript/JavaScript

## Contributing

The Knowledge Graph system is designed to be extensible:

1. **Custom Pattern Detection**: Add your own pattern definitions
2. **New Analysis Types**: Implement additional semantic analyzers  
3. **Query Extensions**: Add new query operators and functions
4. **Export Formats**: Support additional output formats
5. **Storage Backends**: Implement alternative storage systems

For more information, see the [contribution guidelines](../CONTRIBUTING.md).