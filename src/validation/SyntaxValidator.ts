import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface SyntaxValidationResult {
  valid: boolean;
  errors: SyntaxError[];
  warnings: SyntaxWarning[];
  packageIssues: PackageIssue[];
  requiresInstall: boolean;
}

export interface SyntaxError {
  file: string;
  line: number;
  column: number;
  message: string;
  type: 'syntax' | 'import' | 'type' | 'runtime';
  severity: 'error' | 'critical';
}

export interface SyntaxWarning {
  file: string;
  message: string;
  type: string;
}

export interface PackageIssue {
  package: string;
  issue: 'missing' | 'version-mismatch' | 'peer-dependency';
  required?: string;
  installed?: string;
}

export class SyntaxValidator {
  private projectPath: string;
  private framework: string | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Perform comprehensive syntax validation
   */
  async validateProject(): Promise<SyntaxValidationResult> {
    const errors: SyntaxError[] = [];
    const warnings: SyntaxWarning[] = [];
    const packageIssues: PackageIssue[] = [];

    // Detect project type
    await this.detectProjectType();

    // 1. Check TypeScript/JavaScript syntax
    const syntaxResult = await this.checkSyntax();
    errors.push(...syntaxResult.errors);
    warnings.push(...syntaxResult.warnings);

    // 2. Check import statements
    const importResult = await this.checkImports();
    errors.push(...importResult.errors);
    packageIssues.push(...importResult.packageIssues);

    // 3. Check package dependencies
    const depResult = await this.checkDependencies();
    packageIssues.push(...depResult);

    // 4. Run build to catch compilation errors
    const buildResult = await this.checkBuild();
    errors.push(...buildResult.errors);

    // 5. Check for common runtime errors
    const runtimeResult = await this.checkRuntimeIssues();
    errors.push(...runtimeResult);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      packageIssues,
      requiresInstall: packageIssues.some(p => p.issue === 'missing')
    };
  }

  /**
   * Detect project type and framework
   */
  private async detectProjectType(): Promise<void> {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJSON(packageJsonPath);
      
      if (pkg.dependencies?.next || pkg.devDependencies?.next) {
        this.framework = 'nextjs';
      } else if (pkg.dependencies?.react) {
        this.framework = 'react';
      } else if (pkg.dependencies?.vue) {
        this.framework = 'vue';
      } else if (pkg.dependencies?.express) {
        this.framework = 'express';
      }
    }
  }

  /**
   * Check TypeScript/JavaScript syntax
   */
  private async checkSyntax(): Promise<{ errors: SyntaxError[]; warnings: SyntaxWarning[] }> {
    const errors: SyntaxError[] = [];
    const warnings: SyntaxWarning[] = [];

    // Try TypeScript compiler
    const tsconfigPath = path.join(this.projectPath, 'tsconfig.json');
    if (await fs.pathExists(tsconfigPath)) {
      try {
        const { stdout, stderr } = await execAsync(
          'npx tsc --noEmit --pretty false',
          { cwd: this.projectPath, timeout: 30000 }
        );

        const output = stderr || stdout;
        if (output) {
          const lines = output.split('\n');
          
          for (const line of lines) {
            // Parse TypeScript errors: file(line,col): error TS####: message
            const match = line.match(/(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)/);
            if (match) {
              errors.push({
                file: match[1],
                line: parseInt(match[2], 10),
                column: parseInt(match[3], 10),
                message: match[5],
                type: 'type',
                severity: 'error'
              });
            }
          }
        }
      } catch (error: any) {
        // Parse error output
        if (error.stdout || error.stderr) {
          const output = error.stderr || error.stdout;
          const lines = output.split('\n');
          
          for (const line of lines) {
            const match = line.match(/(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)/);
            if (match) {
              errors.push({
                file: match[1],
                line: parseInt(match[2], 10),
                column: parseInt(match[3], 10),
                message: match[5],
                type: 'syntax',
                severity: 'error'
              });
            }
          }
        }
      }
    }

    // Try ESLint
    try {
      const { stdout } = await execAsync(
        'npx eslint . --ext .js,.jsx,.ts,.tsx --format json',
        { cwd: this.projectPath, timeout: 30000 }
      );

      if (stdout) {
        const results = JSON.parse(stdout);
        for (const result of results) {
          for (const message of result.messages) {
            if (message.severity === 2) {
              errors.push({
                file: result.filePath,
                line: message.line,
                column: message.column,
                message: message.message,
                type: 'syntax',
                severity: 'error'
              });
            } else if (message.severity === 1) {
              warnings.push({
                file: result.filePath,
                message: message.message,
                type: 'eslint'
              });
            }
          }
        }
      }
    } catch {
      // ESLint not configured, skip
    }

    return { errors, warnings };
  }

  /**
   * Check import statements for missing packages
   */
  private async checkImports(): Promise<{ errors: SyntaxError[]; packageIssues: PackageIssue[] }> {
    const errors: SyntaxError[] = [];
    const packageIssues: PackageIssue[] = [];
    const checkedPackages = new Set<string>();

    // Find all source files
    const sourceFiles = await this.findSourceFiles();
    
    for (const file of sourceFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      
      // Check imports
      lines.forEach((line, index) => {
        // Match import statements
        const importMatch = line.match(/^import\s+.*from\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          const importPath = importMatch[1];
          
          // Check if it's a package import (not relative)
          if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
            // Extract package name
            const packageName = importPath.startsWith('@') 
              ? importPath.split('/').slice(0, 2).join('/')
              : importPath.split('/')[0];

            if (!checkedPackages.has(packageName)) {
              checkedPackages.add(packageName);
              
              // Check if package is installed
              const isInstalled = this.isPackageInstalled(packageName);
              if (!isInstalled && !this.isBuiltinModule(packageName)) {
                packageIssues.push({
                  package: packageName,
                  issue: 'missing'
                });

                errors.push({
                  file: path.relative(this.projectPath, file),
                  line: index + 1,
                  column: 0,
                  message: `Cannot find module '${packageName}'`,
                  type: 'import',
                  severity: 'error'
                });
              }
            }
          }
        }
      });
    }

    return { errors, packageIssues };
  }

  /**
   * Check package dependencies
   */
  private async checkDependencies(): Promise<PackageIssue[]> {
    const issues: PackageIssue[] = [];
    
    try {
      // Run npm ls to check for missing dependencies
      const { stderr } = await execAsync(
        'npm ls --depth=0 --json',
        { cwd: this.projectPath, timeout: 10000 }
      );

      if (stderr) {
        // Parse npm ls errors
        const lines = stderr.split('\n');
        for (const line of lines) {
          if (line.includes('UNMET DEPENDENCY')) {
            const match = line.match(/UNMET DEPENDENCY\s+(.+?)@(.+)/);
            if (match) {
              issues.push({
                package: match[1],
                issue: 'missing',
                required: match[2]
              });
            }
          }
        }
      }
    } catch {
      // npm ls failed, try to check package.json directly
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      const nodeModulesPath = path.join(this.projectPath, 'node_modules');
      
      if (await fs.pathExists(packageJsonPath)) {
        const pkg = await fs.readJSON(packageJsonPath);
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        
        for (const [dep, version] of Object.entries(allDeps)) {
          const depPath = path.join(nodeModulesPath, dep as string);
          if (!await fs.pathExists(depPath)) {
            issues.push({
              package: dep,
              issue: 'missing',
              required: version as string
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Check build process
   */
  private async checkBuild(): Promise<{ errors: SyntaxError[] }> {
    const errors: SyntaxError[] = [];

    // Try to run build
    const buildCommands = ['npm run build', 'npm run compile', 'npx tsc'];
    
    for (const command of buildCommands) {
      try {
        await execAsync(command, { 
          cwd: this.projectPath, 
          timeout: 60000 
        });
        break; // Build succeeded
      } catch (error: any) {
        if (error.stderr) {
          // Parse build errors
          const lines = error.stderr.split('\n');
          for (const line of lines) {
            // Look for error patterns
            if (line.includes('SyntaxError:')) {
              const match = line.match(/SyntaxError:\s+(.+)/);
              if (match) {
                errors.push({
                  file: 'build',
                  line: 0,
                  column: 0,
                  message: match[1],
                  type: 'syntax',
                  severity: 'critical'
                });
              }
            }
            
            // Webpack errors
            if (line.includes('Module build failed:')) {
              const match = line.match(/Module build failed:?\s+(.+)/);
              if (match) {
                errors.push({
                  file: 'webpack',
                  line: 0,
                  column: 0,
                  message: match[1],
                  type: 'syntax',
                  severity: 'error'
                });
              }
            }
          }
        }
        
        // Only try first working command
        if (errors.length === 0) {
          continue;
        } else {
          break;
        }
      }
    }

    return { errors };
  }

  /**
   * Check for common runtime issues
   */
  private async checkRuntimeIssues(): Promise<SyntaxError[]> {
    const errors: SyntaxError[] = [];
    const sourceFiles = await this.findSourceFiles();

    for (const file of sourceFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');
      const relPath = path.relative(this.projectPath, file);

      lines.forEach((line, index) => {
        // Check for undefined variables (basic check)
        if (line.includes('undefined.') || line.includes('null.')) {
          errors.push({
            file: relPath,
            line: index + 1,
            column: 0,
            message: `Potential null/undefined access at line ${index + 1}`,
            type: 'runtime',
            severity: 'error'
          });
        }

        // Check for missing await
        if (line.includes('.then(') && !line.includes('await') && !line.includes('return')) {
          errors.push({
            file: relPath,
            line: index + 1,
            column: 0,
            message: `Potential missing await at line ${index + 1}`,
            type: 'runtime',
            severity: 'error'
          });
        }
      });
    }

    return errors;
  }

  /**
   * Find all source files
   */
  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs'];

    async function walk(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) {
              await walk(fullPath);
            }
          } else if (extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch {
        // Directory not accessible
      }
    }

    const srcPath = path.join(this.projectPath, 'src');
    if (await fs.pathExists(srcPath)) {
      await walk(srcPath);
    } else {
      await walk(this.projectPath);
    }

    return files;
  }

  /**
   * Check if a package is installed
   */
  private isPackageInstalled(packageName: string): boolean {
    try {
      const packageJsonPath = path.join(this.projectPath, 'package.json');
      if (fs.existsSync(packageJsonPath)) {
        const pkg = fs.readJsonSync(packageJsonPath);
        return !!(
          pkg.dependencies?.[packageName] ||
          pkg.devDependencies?.[packageName] ||
          pkg.peerDependencies?.[packageName]
        );
      }
    } catch {
      // Error reading package.json
    }
    return false;
  }

  /**
   * Check if module is built-in
   */
  private isBuiltinModule(moduleName: string): boolean {
    const builtins = [
      'fs', 'path', 'os', 'crypto', 'util', 'stream', 'events',
      'http', 'https', 'net', 'url', 'querystring', 'child_process',
      'cluster', 'dgram', 'dns', 'domain', 'readline', 'repl',
      'tls', 'tty', 'vm', 'zlib', 'assert', 'buffer', 'console',
      'constants', 'process', 'punycode', 'string_decoder', 'timers'
    ];
    
    return builtins.includes(moduleName);
  }

  /**
   * Auto-fix issues
   */
  async autoFix(): Promise<{ fixed: number; message: string }> {
    const validation = await this.validateProject();
    let fixed = 0;

    // Auto-install missing packages
    if (validation.requiresInstall) {
      console.log('📦 Installing missing packages...');
      try {
        await execAsync('npm install', { 
          cwd: this.projectPath,
          timeout: 120000 
        });
        fixed += validation.packageIssues.filter(p => p.issue === 'missing').length;
      } catch (error) {
        console.error('Failed to install packages:', error);
      }
    }

    return {
      fixed,
      message: `Fixed ${fixed} issues (installed missing packages)`
    };
  }
}