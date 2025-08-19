import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  phantomCodeDetected: boolean;
  suggestions: string[];
}

export interface ValidationError {
  type: 'phantom' | 'syntax' | 'import' | 'logic' | 'test';
  file: string;
  line?: number;
  message: string;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  type: string;
  file: string;
  line?: number;
  message: string;
}

export class CodeValidator {
  private projectPath: string;
  private phantomPatterns: RegExp[];
  private testPatterns: RegExp[];

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    
    // Patterns that indicate phantom/fake code
    this.phantomPatterns = [
      /\/\/ TODO: Implement this function/i,
      /\/\/ Placeholder implementation/i,
      /\/\/ Mock implementation/i,
      /return\s+(true|false|null|undefined|0|''|"")\s*;?\s*\/\/\s*temporary/i,
      /throw\s+new\s+Error\(['"`]Not implemented['"`]\)/i,
      /console\.log\(['"`]Function called['"`]\)/i,
      /\/\/ Simulated (response|data|result)/i,
      /return\s+\{\s*\};\s*\/\/\s*empty/i,
      /await\s+new\s+Promise.*setTimeout.*\/\/\s*fake delay/i,
      /function\s+\w+\([^)]*\)\s*\{\s*\}/,  // Empty function body
      /test\(['"`].*['"`],\s*\(\)\s*=>\s*\{\s*\}\)/,  // Empty test
      /expect\(true\)\.toBe\(true\)/,  // Meaningless test
      /it\.skip\(/,  // Skipped tests
      /describe\.skip\(/  // Skipped test suites
    ];

    // Patterns for detecting fake tests
    this.testPatterns = [
      /test\(['"`].*['"`],\s*\(\)\s*=>\s*\{\s*expect\(true\)\.toBe\(true\)\s*\}\)/,
      /it\(['"`].*['"`],\s*\(\)\s*=>\s*\{\s*\}\)/,
      /test\.todo\(/,
      /it\.todo\(/,
      /\/\/ Test not implemented/i,
      /expect\(\)\.toEqual\(\)/,  // Empty expectations
      /expect\(.*\)\.toBeDefined\(\)\s*$/  // Only checking if defined
    ];
  }

  /**
   * Validate an entire project
   */
  async validateProject(): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let phantomCodeDetected = false;

    try {
      // 1. Check for phantom code patterns
      const phantomResults = await this.detectPhantomCode();
      errors.push(...phantomResults.errors);
      phantomCodeDetected = phantomResults.detected;

      // 2. Validate TypeScript/JavaScript syntax
      const syntaxResults = await this.validateSyntax();
      errors.push(...syntaxResults);

      // 3. Check for broken imports
      const importResults = await this.validateImports();
      errors.push(...importResults);

      // 4. Validate test files
      const testResults = await this.validateTests();
      errors.push(...testResults.errors);
      warnings.push(...testResults.warnings);

      // 5. Check for logical inconsistencies
      const logicResults = await this.validateLogic();
      warnings.push(...logicResults);

      // Generate suggestions
      const suggestions = this.generateSuggestions(errors, warnings);

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        phantomCodeDetected,
        suggestions
      };
    } catch (error) {
      console.error('Validation error:', error);
      errors.push({
        type: 'logic',
        file: 'unknown',
        message: `Validation process failed: ${error}`,
        severity: 'critical'
      });

      return {
        valid: false,
        errors,
        warnings,
        phantomCodeDetected,
        suggestions: ['Fix validation errors before proceeding']
      };
    }
  }

  /**
   * Detect phantom/fake code
   */
  private async detectPhantomCode(): Promise<{ detected: boolean; errors: ValidationError[] }> {
    const errors: ValidationError[] = [];
    let detected = false;

    const files = await this.findSourceFiles();
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');

      lines.forEach((line, index) => {
        for (const pattern of this.phantomPatterns) {
          if (pattern.test(line)) {
            detected = true;
            errors.push({
              type: 'phantom',
              file: path.relative(this.projectPath, file),
              line: index + 1,
              message: `Phantom code detected: "${line.trim().substring(0, 50)}..."`,
              severity: 'error'
            });
          }
        }
      });
    }

    return { detected, errors };
  }

  /**
   * Validate syntax using language tools
   */
  private async validateSyntax(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    try {
      // Try TypeScript compiler
      const tsconfigPath = path.join(this.projectPath, 'tsconfig.json');
      if (await fs.pathExists(tsconfigPath)) {
        const { stdout, stderr } = await execAsync(
          `npx tsc --noEmit --project "${tsconfigPath}"`,
          { cwd: this.projectPath }
        );

        if (stderr || stdout) {
          const output = stderr || stdout;
          const lines = output.split('\n');
          
          for (const line of lines) {
            const match = line.match(/(.+)\((\d+),\d+\):\s+error\s+TS\d+:\s+(.+)/);
            if (match) {
              errors.push({
                type: 'syntax',
                file: match[1],
                line: parseInt(match[2], 10),
                message: match[3],
                severity: 'error'
              });
            }
          }
        }
      }

      // Try ESLint
      const eslintPath = path.join(this.projectPath, '.eslintrc.json');
      if (await fs.pathExists(eslintPath)) {
        try {
          await execAsync(
            `npx eslint . --ext .js,.jsx,.ts,.tsx --format json`,
            { cwd: this.projectPath }
          );
        } catch (lintError: any) {
          if (lintError.stdout) {
            const results = JSON.parse(lintError.stdout);
            for (const result of results) {
              for (const message of result.messages) {
                if (message.severity === 2) { // Error level
                  errors.push({
                    type: 'syntax',
                    file: path.relative(this.projectPath, result.filePath),
                    line: message.line,
                    message: message.message,
                    severity: 'error'
                  });
                }
              }
            }
          }
        }
      }
    } catch (error) {
      // Syntax validation tools not available, skip
    }

    return errors;
  }

  /**
   * Validate imports and dependencies
   */
  private async validateImports(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    const files = await this.findSourceFiles();

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');
      const importMatches = content.matchAll(/import\s+.*from\s+['"](.+)['"]/g);

      for (const match of importMatches) {
        const importPath = match[1];
        
        // Check relative imports
        if (importPath.startsWith('.')) {
          const resolvedPath = path.resolve(path.dirname(file), importPath);
          const extensions = ['.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
          
          let found = false;
          for (const ext of extensions) {
            if (await fs.pathExists(resolvedPath + ext) || await fs.pathExists(resolvedPath)) {
              found = true;
              break;
            }
          }

          if (!found) {
            errors.push({
              type: 'import',
              file: path.relative(this.projectPath, file),
              message: `Cannot resolve import: ${importPath}`,
              severity: 'error'
            });
          }
        }
        // Check node_modules imports
        else if (!importPath.startsWith('@') && !importPath.includes('/')) {
          const packageJsonPath = path.join(this.projectPath, 'package.json');
          if (await fs.pathExists(packageJsonPath)) {
            const packageJson = await fs.readJSON(packageJsonPath);
            const deps = {
              ...packageJson.dependencies,
              ...packageJson.devDependencies
            };

            if (!deps[importPath] && !['fs', 'path', 'crypto', 'util', 'child_process'].includes(importPath)) {
              errors.push({
                type: 'import',
                file: path.relative(this.projectPath, file),
                message: `Missing dependency: ${importPath}`,
                severity: 'error'
              });
            }
          }
        }
      }
    }

    return errors;
  }

  /**
   * Validate test files
   */
  private async validateTests(): Promise<{ errors: ValidationError[]; warnings: ValidationWarning[] }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const testFiles = await this.findTestFiles();
    
    for (const file of testFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const lines = content.split('\n');

      // Check for fake tests
      lines.forEach((line, index) => {
        for (const pattern of this.testPatterns) {
          if (pattern.test(line)) {
            errors.push({
              type: 'test',
              file: path.relative(this.projectPath, file),
              line: index + 1,
              message: `Fake or incomplete test detected`,
              severity: 'error'
            });
          }
        }
      });

      // Check if test file has actual test cases
      const hasTests = /test\(|it\(|describe\(/.test(content);
      const hasExpectations = /expect\(/.test(content);

      if (hasTests && !hasExpectations) {
        warnings.push({
          type: 'test',
          file: path.relative(this.projectPath, file),
          message: 'Test file has tests but no expectations'
        });
      }

      // Check for commented out tests
      const commentedTests = content.match(/\/\/\s*(test|it|describe)\(/g);
      if (commentedTests && commentedTests.length > 2) {
        warnings.push({
          type: 'test',
          file: path.relative(this.projectPath, file),
          message: `${commentedTests.length} commented out tests found`
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate logical consistency
   */
  private async validateLogic(): Promise<ValidationWarning[]> {
    const warnings: ValidationWarning[] = [];
    const files = await this.findSourceFiles();

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8');

      // Check for unreachable code
      if (/return[\s\S]+\n\s+\w/.test(content)) {
        warnings.push({
          type: 'logic',
          file: path.relative(this.projectPath, file),
          message: 'Possible unreachable code after return statement'
        });
      }

      // Check for infinite loops
      if (/while\s*\(\s*true\s*\)/.test(content) && !/break/.test(content)) {
        warnings.push({
          type: 'logic',
          file: path.relative(this.projectPath, file),
          message: 'Possible infinite loop detected'
        });
      }

      // Check for unused variables (simple check)
      const varDeclarations = content.matchAll(/(?:const|let|var)\s+(\w+)/g);
      for (const match of varDeclarations) {
        const varName = match[1];
        const regex = new RegExp(`\\b${varName}\\b`, 'g');
        const occurrences = (content.match(regex) || []).length;
        
        if (occurrences === 1) {
          warnings.push({
            type: 'logic',
            file: path.relative(this.projectPath, file),
            message: `Possibly unused variable: ${varName}`
          });
        }
      }
    }

    return warnings;
  }

  /**
   * Find all source files
   */
  private async findSourceFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    async function walk(dir: string) {
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
    }

    await walk(this.projectPath);
    return files;
  }

  /**
   * Find test files
   */
  private async findTestFiles(): Promise<string[]> {
    const allFiles = await this.findSourceFiles();
    return allFiles.filter(file => 
      file.includes('.test.') || 
      file.includes('.spec.') || 
      file.includes('__tests__')
    );
  }

  /**
   * Generate suggestions based on validation results
   */
  private generateSuggestions(errors: ValidationError[], warnings: ValidationWarning[]): string[] {
    const suggestions: string[] = [];

    // Count error types
    const errorTypes = new Map<string, number>();
    errors.forEach(error => {
      errorTypes.set(error.type, (errorTypes.get(error.type) || 0) + 1);
    });

    // Generate suggestions based on error patterns
    if (errorTypes.get('phantom') || 0 > 0) {
      suggestions.push('Complete all placeholder implementations before proceeding');
      suggestions.push('Remove TODO comments and implement actual functionality');
    }

    if (errorTypes.get('test') || 0 > 0) {
      suggestions.push('Write meaningful tests with actual assertions');
      suggestions.push('Ensure tests validate real functionality, not just existence');
    }

    if (errorTypes.get('syntax') || 0 > 0) {
      suggestions.push('Fix syntax errors using TypeScript compiler feedback');
      suggestions.push('Run "npm run typecheck" to identify type issues');
    }

    if (errorTypes.get('import') || 0 > 0) {
      suggestions.push('Install missing dependencies with npm install');
      suggestions.push('Fix import paths to point to existing files');
    }

    if (warnings.length > 5) {
      suggestions.push('Address code quality warnings to improve maintainability');
    }

    return suggestions;
  }

  /**
   * Quick validation for a single file
   */
  async validateFile(filePath: string): Promise<ValidationResult> {
    const relPath = path.relative(this.projectPath, filePath);
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Check for phantom code
      lines.forEach((line, index) => {
        for (const pattern of this.phantomPatterns) {
          if (pattern.test(line)) {
            errors.push({
              type: 'phantom',
              file: relPath,
              line: index + 1,
              message: `Phantom code: "${line.trim().substring(0, 50)}..."`,
              severity: 'error'
            });
          }
        }
      });

      // Check for test issues if it's a test file
      if (filePath.includes('.test.') || filePath.includes('.spec.')) {
        lines.forEach((line, index) => {
          for (const pattern of this.testPatterns) {
            if (pattern.test(line)) {
              errors.push({
                type: 'test',
                file: relPath,
                line: index + 1,
                message: 'Fake or incomplete test',
                severity: 'error'
              });
            }
          }
        });
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        phantomCodeDetected: errors.some(e => e.type === 'phantom'),
        suggestions: this.generateSuggestions(errors, warnings)
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          type: 'logic',
          file: relPath,
          message: `Failed to validate file: ${error}`,
          severity: 'critical'
        }],
        warnings,
        phantomCodeDetected: false,
        suggestions: ['Fix file access issues']
      };
    }
  }
}