/**
 * Codebase Context Manager
 * Provides full context awareness of the codebase without relying on MD files
 * Maintains modular, hierarchical understanding of project structure and content
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as crypto from 'crypto';

export interface FileContext {
  path: string;
  relativePath: string;
  type: 'file';
  language?: string;
  size: number;
  hash: string;
  imports?: string[];
  exports?: string[];
  classes?: string[];
  functions?: string[];
  dependencies?: string[];
  lastModified: Date;
  summary?: string;
}

export interface FolderContext {
  path: string;
  relativePath: string;
  type: 'folder';
  children: Map<string, FileContext | FolderContext>;
  summary?: string;
  purpose?: string;
}

export interface ProjectContext {
  name: string;
  root: string;
  structure: FolderContext;
  framework?: string;
  language?: string;
  dependencies: Map<string, string>;
  scripts: Map<string, string>;
  entryPoints: string[];
  testFiles: string[];
  configFiles: Map<string, any>;
  agentsMd?: AgentsMdContent;
  lastUpdated: Date;
  contextVersion: number;
}

export interface AgentsMdContent {
  devEnvironment?: string;
  testingInstructions?: string;
  prInstructions?: string;
  setupCommands?: string[];
  buildCommands?: string[];
  conventions?: string;
  architecture?: string;
  customSections?: Map<string, string>;
}

export interface ContextUpdate {
  type: 'file-added' | 'file-modified' | 'file-deleted' | 'structure-changed';
  path: string;
  oldContext?: FileContext | FolderContext;
  newContext?: FileContext | FolderContext;
  timestamp: Date;
}

export class CodebaseContextManager extends EventEmitter {
  private projectContexts: Map<string, ProjectContext>;
  private contextCache: Map<string, any>;
  private fileWatchers: Map<string, fs.FSWatcher>;
  private contextUpdateQueue: ContextUpdate[];
  private isProcessingQueue: boolean = false;

  constructor() {
    super();
    this.projectContexts = new Map();
    this.contextCache = new Map();
    this.fileWatchers = new Map();
    this.contextUpdateQueue = [];
  }

  /**
   * Initialize context for a project
   */
  async initializeProjectContext(projectPath: string): Promise<ProjectContext> {
    console.log(`🧠 Initializing context awareness for ${path.basename(projectPath)}...`);
    
    // Check if context already exists and is recent
    const existingContext = this.projectContexts.get(projectPath);
    if (existingContext && this.isContextRecent(existingContext)) {
      console.log('  ✓ Using cached context');
      return existingContext;
    }

    // Load or create agents.md
    const agentsMd = await this.loadAgentsMd(projectPath);
    
    // Analyze project structure
    const structure = await this.analyzeStructure(projectPath);
    
    // Detect framework and language
    const { framework, language } = await this.detectTechStack(projectPath);
    
    // Load dependencies
    const dependencies = await this.loadDependencies(projectPath);
    
    // Load scripts
    const scripts = await this.loadScripts(projectPath);
    
    // Find entry points
    const entryPoints = await this.findEntryPoints(projectPath);
    
    // Find test files
    const testFiles = await this.findTestFiles(projectPath);
    
    // Load config files
    const configFiles = await this.loadConfigFiles(projectPath);

    const context: ProjectContext = {
      name: path.basename(projectPath),
      root: projectPath,
      structure,
      framework,
      language,
      dependencies,
      scripts,
      entryPoints,
      testFiles,
      configFiles,
      agentsMd,
      lastUpdated: new Date(),
      contextVersion: 1
    };

    // Store context
    this.projectContexts.set(projectPath, context);
    
    // Start watching for changes
    this.startWatching(projectPath);
    
    // Emit context ready event
    this.emit('context-ready', { project: projectPath, context });
    
    console.log('  ✅ Context awareness initialized');
    return context;
  }

  /**
   * Load or create agents.md file
   */
  private async loadAgentsMd(projectPath: string): Promise<AgentsMdContent | undefined> {
    const agentsMdPath = path.join(projectPath, 'AGENTS.md');
    
    if (!await fs.pathExists(agentsMdPath)) {
      // Create default agents.md
      await this.createDefaultAgentsMd(projectPath);
    }

    try {
      const content = await fs.readFile(agentsMdPath, 'utf-8');
      return this.parseAgentsMd(content);
    } catch (error) {
      console.warn('  ⚠️ Could not load AGENTS.md');
      return undefined;
    }
  }

  /**
   * Create default AGENTS.md file
   */
  private async createDefaultAgentsMd(projectPath: string): Promise<void> {
    const agentsMdPath = path.join(projectPath, 'AGENTS.md');
    
    const content = `# AGENTS.md

## Dev Environment Tips

This project uses modern web development tools and practices.

### Setup
\`\`\`bash
npm install
\`\`\`

### Development
\`\`\`bash
npm run dev
\`\`\`

### Build
\`\`\`bash
npm run build
\`\`\`

## Testing Instructions

### Run Tests
\`\`\`bash
npm test
\`\`\`

### Test Coverage
\`\`\`bash
npm run test:coverage
\`\`\`

## PR Instructions

### Before Submitting
1. Run tests: \`npm test\`
2. Check linting: \`npm run lint\`
3. Build project: \`npm run build\`

### Commit Format
Use conventional commits:
- \`feat:\` for new features
- \`fix:\` for bug fixes
- \`docs:\` for documentation
- \`refactor:\` for code refactoring
- \`test:\` for tests

## Project Structure

\`\`\`
${await this.generateProjectStructure(projectPath)}
\`\`\`

## Key Files
- Entry point: \`src/index.ts\` or \`src/main.ts\`
- Configuration: \`package.json\`, \`tsconfig.json\`
- Tests: \`src/**/*.test.ts\` or \`tests/**\`

## Architecture Notes

This project follows a modular architecture with clear separation of concerns.

## Coding Conventions

- Use TypeScript for type safety
- Follow ESLint rules
- Write tests for new features
- Document complex functions
- Keep functions small and focused
`;

    await fs.writeFile(agentsMdPath, content);
    console.log('  📝 Created AGENTS.md for AI guidance');
  }

  /**
   * Parse AGENTS.md content
   */
  private parseAgentsMd(content: string): AgentsMdContent {
    const sections = content.split(/^##\s+/m);
    const result: AgentsMdContent = {
      customSections: new Map()
    };

    for (const section of sections) {
      const lines = section.trim().split('\n');
      const title = lines[0]?.toLowerCase().trim();
      const body = lines.slice(1).join('\n').trim();

      if (title?.includes('dev environment')) {
        result.devEnvironment = body;
      } else if (title?.includes('testing')) {
        result.testingInstructions = body;
      } else if (title?.includes('pr')) {
        result.prInstructions = body;
      } else if (title?.includes('setup')) {
        result.setupCommands = this.extractCommands(body);
      } else if (title?.includes('build')) {
        result.buildCommands = this.extractCommands(body);
      } else if (title?.includes('convention')) {
        result.conventions = body;
      } else if (title?.includes('architecture')) {
        result.architecture = body;
      } else if (title) {
        result.customSections?.set(title, body);
      }
    }

    return result;
  }

  /**
   * Extract commands from text
   */
  private extractCommands(text: string): string[] {
    const commands: string[] = [];
    const codeBlocks = text.match(/```(?:bash|sh|shell)?\n([\s\S]*?)```/g);
    
    if (codeBlocks) {
      for (const block of codeBlocks) {
        const code = block.replace(/```(?:bash|sh|shell)?\n/, '').replace(/```$/, '');
        commands.push(...code.split('\n').filter(line => line.trim()));
      }
    }

    return commands;
  }

  /**
   * Analyze project structure recursively
   */
  private async analyzeStructure(
    dirPath: string,
    relativePath: string = ''
  ): Promise<FolderContext> {
    const folder: FolderContext = {
      path: dirPath,
      relativePath,
      type: 'folder',
      children: new Map()
    };

    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      // Skip node_modules, .git, and other large/irrelevant directories
      if (this.shouldSkipPath(item)) continue;

      const itemPath = path.join(dirPath, item);
      const itemRelativePath = path.join(relativePath, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        const subFolder = await this.analyzeStructure(itemPath, itemRelativePath);
        folder.children.set(item, subFolder);
      } else {
        const fileContext = await this.analyzeFile(itemPath, itemRelativePath);
        if (fileContext) {
          folder.children.set(item, fileContext);
        }
      }
    }

    // Generate folder summary
    folder.summary = this.generateFolderSummary(folder);
    folder.purpose = this.inferFolderPurpose(relativePath, folder);

    return folder;
  }

  /**
   * Analyze individual file
   */
  private async analyzeFile(filePath: string, relativePath: string): Promise<FileContext | null> {
    try {
      const stats = await fs.stat(filePath);
      const content = await fs.readFile(filePath, 'utf-8');
      const hash = crypto.createHash('md5').update(content).digest('hex');

      const fileContext: FileContext = {
        path: filePath,
        relativePath,
        type: 'file',
        size: stats.size,
        hash,
        lastModified: stats.mtime,
        language: this.detectLanguage(filePath)
      };

      // Analyze file content based on type
      if (this.isCodeFile(filePath)) {
        fileContext.imports = this.extractImports(content, fileContext.language);
        fileContext.exports = this.extractExports(content, fileContext.language);
        fileContext.classes = this.extractClasses(content, fileContext.language);
        fileContext.functions = this.extractFunctions(content, fileContext.language);
        fileContext.summary = this.generateFileSummary(fileContext);
      }

      return fileContext;
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect file language
   */
  private detectLanguage(filePath: string): string | undefined {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript-react',
      '.js': 'javascript',
      '.jsx': 'javascript-react',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.vue': 'vue',
      '.svelte': 'svelte'
    };
    return languageMap[ext];
  }

  /**
   * Extract imports from code
   */
  private extractImports(content: string, language?: string): string[] {
    const imports: string[] = [];
    
    if (language?.includes('javascript') || language?.includes('typescript')) {
      // ES6 imports
      const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
      
      // CommonJS requires
      const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
      while ((match = requireRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }

    return imports;
  }

  /**
   * Extract exports from code
   */
  private extractExports(content: string, language?: string): string[] {
    const exports: string[] = [];
    
    if (language?.includes('javascript') || language?.includes('typescript')) {
      // Named exports
      const namedExportRegex = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
      let match;
      while ((match = namedExportRegex.exec(content)) !== null) {
        exports.push(match[1]);
      }
      
      // Default export
      if (/export\s+default/g.test(content)) {
        exports.push('default');
      }
    }

    return exports;
  }

  /**
   * Extract classes from code
   */
  private extractClasses(content: string, language?: string): string[] {
    const classes: string[] = [];
    
    if (language?.includes('javascript') || language?.includes('typescript')) {
      const classRegex = /class\s+(\w+)/g;
      let match;
      while ((match = classRegex.exec(content)) !== null) {
        classes.push(match[1]);
      }
    }

    return classes;
  }

  /**
   * Extract functions from code
   */
  private extractFunctions(content: string, language?: string): string[] {
    const functions: string[] = [];
    
    if (language?.includes('javascript') || language?.includes('typescript')) {
      // Function declarations
      const funcRegex = /(?:async\s+)?function\s+(\w+)/g;
      let match;
      while ((match = funcRegex.exec(content)) !== null) {
        functions.push(match[1]);
      }
      
      // Arrow functions assigned to variables
      const arrowRegex = /(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/g;
      while ((match = arrowRegex.exec(content)) !== null) {
        functions.push(match[1]);
      }
    }

    return functions;
  }

  /**
   * Detect tech stack
   */
  private async detectTechStack(projectPath: string): Promise<{ framework?: string; language?: string }> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Detect framework
      let framework: string | undefined;
      if (deps['next']) framework = 'nextjs';
      else if (deps['react']) framework = 'react';
      else if (deps['vue']) framework = 'vue';
      else if (deps['@angular/core']) framework = 'angular';
      else if (deps['svelte']) framework = 'svelte';
      else if (deps['express']) framework = 'express';
      else if (deps['fastify']) framework = 'fastify';
      else if (deps['nestjs']) framework = 'nestjs';
      
      // Detect language
      const language = deps['typescript'] ? 'typescript' : 'javascript';
      
      return { framework, language };
    }
    
    return {};
  }

  /**
   * Load project dependencies
   */
  private async loadDependencies(projectPath: string): Promise<Map<string, string>> {
    const deps = new Map<string, string>();
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      
      // Combine all dependencies
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies
      };
      
      for (const [name, version] of Object.entries(allDeps)) {
        deps.set(name, version as string);
      }
    }
    
    return deps;
  }

  /**
   * Load project scripts
   */
  private async loadScripts(projectPath: string): Promise<Map<string, string>> {
    const scripts = new Map<string, string>();
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      
      if (packageJson.scripts) {
        for (const [name, command] of Object.entries(packageJson.scripts)) {
          scripts.set(name, command as string);
        }
      }
    }
    
    return scripts;
  }

  /**
   * Find entry points
   */
  private async findEntryPoints(projectPath: string): Promise<string[]> {
    const entryPoints: string[] = [];
    const possibleEntries = [
      'src/index.ts',
      'src/index.js',
      'src/main.ts',
      'src/main.js',
      'src/app.ts',
      'src/app.js',
      'index.ts',
      'index.js',
      'main.ts',
      'main.js',
      'app.ts',
      'app.js'
    ];

    for (const entry of possibleEntries) {
      const entryPath = path.join(projectPath, entry);
      if (await fs.pathExists(entryPath)) {
        entryPoints.push(entry);
      }
    }

    return entryPoints;
  }

  /**
   * Find test files
   */
  private async findTestFiles(projectPath: string): Promise<string[]> {
    const testFiles: string[] = [];
    
    const findTests = async (dir: string, relative: string = ''): Promise<void> => {
      const items = await fs.readdir(dir);
      
      for (const item of items) {
        if (this.shouldSkipPath(item)) continue;
        
        const itemPath = path.join(dir, item);
        const itemRelative = path.join(relative, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          await findTests(itemPath, itemRelative);
        } else if (this.isTestFile(item)) {
          testFiles.push(itemRelative);
        }
      }
    };

    await findTests(projectPath);
    return testFiles;
  }

  /**
   * Load configuration files
   */
  private async loadConfigFiles(projectPath: string): Promise<Map<string, any>> {
    const configs = new Map<string, any>();
    const configFiles = [
      'tsconfig.json',
      '.eslintrc.json',
      '.prettierrc',
      'webpack.config.js',
      'vite.config.js',
      'next.config.js',
      '.env',
      '.env.local'
    ];

    for (const configFile of configFiles) {
      const configPath = path.join(projectPath, configFile);
      if (await fs.pathExists(configPath)) {
        try {
          if (configFile.endsWith('.json')) {
            configs.set(configFile, await fs.readJson(configPath));
          } else {
            configs.set(configFile, await fs.readFile(configPath, 'utf-8'));
          }
        } catch (error) {
          // Skip invalid config files
        }
      }
    }

    return configs;
  }

  /**
   * Start watching for changes
   */
  private startWatching(projectPath: string): void {
    const watcher = fs.watch(projectPath, { recursive: true }, async (eventType, filename) => {
      if (filename && !this.shouldSkipPath(filename)) {
        const filePath = path.join(projectPath, filename);
        
        // Queue context update
        this.queueContextUpdate({
          type: eventType === 'rename' ? 'structure-changed' : 'file-modified',
          path: filePath,
          timestamp: new Date()
        });
      }
    });

    this.fileWatchers.set(projectPath, watcher);
  }

  /**
   * Queue context update
   */
  private queueContextUpdate(update: ContextUpdate): void {
    this.contextUpdateQueue.push(update);
    
    if (!this.isProcessingQueue) {
      this.processUpdateQueue();
    }
  }

  /**
   * Process update queue
   */
  private async processUpdateQueue(): Promise<void> {
    this.isProcessingQueue = true;
    
    while (this.contextUpdateQueue.length > 0) {
      const update = this.contextUpdateQueue.shift()!;
      
      // Find project for this update
      for (const [projectPath, context] of this.projectContexts) {
        if (update.path.startsWith(projectPath)) {
          await this.updateProjectContext(projectPath, update);
          break;
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  /**
   * Update project context
   */
  private async updateProjectContext(projectPath: string, update: ContextUpdate): Promise<void> {
    const context = this.projectContexts.get(projectPath);
    if (!context) return;

    // Update specific part of context based on update type
    const relativePath = path.relative(projectPath, update.path);
    
    if (update.type === 'file-modified' || update.type === 'file-added') {
      // Update file context
      const fileContext = await this.analyzeFile(update.path, relativePath);
      if (fileContext) {
        this.updateContextTree(context.structure, relativePath, fileContext);
      }
    } else if (update.type === 'file-deleted') {
      // Remove from context
      this.removeFromContextTree(context.structure, relativePath);
    }

    // Update version and timestamp
    context.contextVersion++;
    context.lastUpdated = new Date();

    // Emit update event
    this.emit('context-updated', { project: projectPath, update });
  }

  /**
   * Update context tree
   */
  private updateContextTree(
    folder: FolderContext,
    relativePath: string,
    newContext: FileContext | FolderContext
  ): void {
    const parts = relativePath.split(path.sep);
    const fileName = parts.pop()!;
    
    let current = folder;
    for (const part of parts) {
      const child = current.children.get(part);
      if (child && child.type === 'folder') {
        current = child;
      } else {
        return; // Path doesn't exist
      }
    }
    
    current.children.set(fileName, newContext);
  }

  /**
   * Remove from context tree
   */
  private removeFromContextTree(folder: FolderContext, relativePath: string): void {
    const parts = relativePath.split(path.sep);
    const fileName = parts.pop()!;
    
    let current = folder;
    for (const part of parts) {
      const child = current.children.get(part);
      if (child && child.type === 'folder') {
        current = child;
      } else {
        return; // Path doesn't exist
      }
    }
    
    current.children.delete(fileName);
  }

  /**
   * Get project context
   */
  getProjectContext(projectPath: string): ProjectContext | undefined {
    return this.projectContexts.get(projectPath);
  }

  /**
   * Get file context
   */
  getFileContext(projectPath: string, filePath: string): FileContext | undefined {
    const context = this.projectContexts.get(projectPath);
    if (!context) return undefined;

    const relativePath = path.relative(projectPath, filePath);
    const parts = relativePath.split(path.sep);
    
    let current: FileContext | FolderContext = context.structure;
    for (const part of parts) {
      if (current.type === 'folder') {
        const child = current.children.get(part);
        if (child) {
          current = child;
        } else {
          return undefined;
        }
      } else {
        return undefined;
      }
    }
    
    return current.type === 'file' ? current : undefined;
  }

  /**
   * Search for files by pattern
   */
  searchFiles(projectPath: string, pattern: string | RegExp): FileContext[] {
    const context = this.projectContexts.get(projectPath);
    if (!context) return [];

    const results: FileContext[] = [];
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    const search = (folder: FolderContext): void => {
      for (const [name, child] of folder.children) {
        if (child.type === 'file' && regex.test(child.relativePath)) {
          results.push(child);
        } else if (child.type === 'folder') {
          search(child);
        }
      }
    };
    
    search(context.structure);
    return results;
  }

  /**
   * Get context summary
   */
  getContextSummary(projectPath: string): string {
    const context = this.projectContexts.get(projectPath);
    if (!context) return 'No context available';

    const fileCount = this.countFiles(context.structure);
    const folderCount = this.countFolders(context.structure);
    
    return `Project: ${context.name}
Framework: ${context.framework || 'Unknown'}
Language: ${context.language || 'Unknown'}
Files: ${fileCount}
Folders: ${folderCount}
Dependencies: ${context.dependencies.size}
Entry Points: ${context.entryPoints.join(', ')}
Test Files: ${context.testFiles.length}
Last Updated: ${context.lastUpdated.toISOString()}
Version: ${context.contextVersion}`;
  }

  /**
   * Utility methods
   */
  private shouldSkipPath(path: string): boolean {
    const skipPatterns = [
      'node_modules',
      '.git',
      'dist',
      'build',
      '.next',
      'coverage',
      '.cache',
      '.vscode',
      '.idea',
      'tmp',
      'temp'
    ];
    return skipPatterns.some(pattern => path.includes(pattern));
  }

  private isCodeFile(filePath: string): boolean {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs', '.cpp', '.c', '.cs', '.rb', '.php'];
    return codeExtensions.some(ext => filePath.endsWith(ext));
  }

  private isTestFile(fileName: string): boolean {
    return fileName.includes('.test.') || fileName.includes('.spec.') || fileName.includes('test');
  }

  private isContextRecent(context: ProjectContext): boolean {
    const hoursSinceUpdate = (Date.now() - context.lastUpdated.getTime()) / (1000 * 60 * 60);
    return hoursSinceUpdate < 1; // Context is fresh if updated within last hour
  }

  private generateFolderSummary(folder: FolderContext): string {
    const fileCount = this.countFiles(folder);
    const subfolderCount = this.countFolders(folder) - 1; // Exclude self
    return `${fileCount} files, ${subfolderCount} folders`;
  }

  private generateFileSummary(file: FileContext): string {
    const parts: string[] = [];
    if (file.classes?.length) parts.push(`${file.classes.length} classes`);
    if (file.functions?.length) parts.push(`${file.functions.length} functions`);
    if (file.imports?.length) parts.push(`${file.imports.length} imports`);
    if (file.exports?.length) parts.push(`${file.exports.length} exports`);
    return parts.join(', ');
  }

  private inferFolderPurpose(relativePath: string, folder: FolderContext): string {
    const name = path.basename(relativePath);
    const purposeMap: Record<string, string> = {
      'src': 'Source code',
      'components': 'UI components',
      'pages': 'Application pages',
      'routes': 'API routes',
      'utils': 'Utility functions',
      'services': 'Business logic',
      'models': 'Data models',
      'controllers': 'Request handlers',
      'middleware': 'Middleware functions',
      'tests': 'Test files',
      'styles': 'Stylesheets',
      'assets': 'Static assets',
      'public': 'Public files',
      'config': 'Configuration',
      'scripts': 'Build scripts'
    };
    return purposeMap[name] || 'Project folder';
  }

  private countFiles(folder: FolderContext): number {
    let count = 0;
    for (const child of folder.children.values()) {
      if (child.type === 'file') {
        count++;
      } else {
        count += this.countFiles(child);
      }
    }
    return count;
  }

  private countFolders(folder: FolderContext): number {
    let count = 1; // Count self
    for (const child of folder.children.values()) {
      if (child.type === 'folder') {
        count += this.countFolders(child);
      }
    }
    return count;
  }

  private async generateProjectStructure(projectPath: string): Promise<string> {
    const structure: string[] = [];
    
    const buildTree = async (dir: string, prefix: string = '', isLast: boolean = true): Promise<void> => {
      const items = await fs.readdir(dir);
      const filtered = items.filter(item => !this.shouldSkipPath(item));
      
      for (let i = 0; i < filtered.length && structure.length < 20; i++) {
        const item = filtered[i];
        const isLastItem = i === filtered.length - 1;
        const itemPath = path.join(dir, item);
        const stats = await fs.stat(itemPath);
        
        const connector = isLastItem ? '└── ' : '├── ';
        const extension = isLastItem ? '    ' : '│   ';
        
        structure.push(prefix + connector + item + (stats.isDirectory() ? '/' : ''));
        
        if (stats.isDirectory() && structure.length < 20) {
          await buildTree(itemPath, prefix + extension, isLastItem);
        }
      }
    };
    
    await buildTree(projectPath);
    return structure.join('\n');
  }

  /**
   * Cleanup and dispose
   */
  dispose(): void {
    // Stop all file watchers
    for (const watcher of this.fileWatchers.values()) {
      watcher.close();
    }
    this.fileWatchers.clear();
    this.projectContexts.clear();
    this.contextCache.clear();
    this.contextUpdateQueue = [];
  }
}

export default CodebaseContextManager;