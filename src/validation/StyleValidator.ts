import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface StyleValidationResult {
  valid: boolean;
  errors: StyleError[];
  warnings: StyleWarning[];
  fixes: StyleFix[];
}

export interface StyleError {
  file: string;
  line?: number;
  type: 'missing-styles' | 'tailwind-config' | 'css-modules' | 'dark-mode' | 'compilation';
  message: string;
  severity: 'critical' | 'high' | 'medium';
}

export interface StyleWarning {
  file: string;
  message: string;
  suggestion?: string;
}

export interface StyleFix {
  file: string;
  issue: string;
  solution: string;
  code?: string;
}

export class StyleValidator {
  private projectPath: string;
  private framework: string | null = null;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.detectFramework();
  }

  /**
   * Detect the framework being used
   */
  private async detectFramework(): Promise<void> {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJSON(packageJsonPath);
      
      if (pkg.dependencies?.next || pkg.devDependencies?.next) {
        this.framework = 'nextjs';
      } else if (pkg.dependencies?.react) {
        this.framework = 'react';
      } else if (pkg.dependencies?.vue) {
        this.framework = 'vue';
      } else if (pkg.dependencies?.['@angular/core']) {
        this.framework = 'angular';
      }
    }
  }

  /**
   * Validate all styling in the project
   */
  async validateStyles(): Promise<StyleValidationResult> {
    const errors: StyleError[] = [];
    const warnings: StyleWarning[] = [];
    const fixes: StyleFix[] = [];

    // 1. Check Tailwind CSS configuration
    const tailwindResult = await this.validateTailwindSetup();
    errors.push(...tailwindResult.errors);
    fixes.push(...tailwindResult.fixes);

    // 2. Check global styles
    const globalResult = await this.validateGlobalStyles();
    errors.push(...globalResult.errors);
    warnings.push(...globalResult.warnings);

    // 3. Check component styles
    const componentResult = await this.validateComponentStyles();
    errors.push(...componentResult.errors);
    warnings.push(...componentResult.warnings);

    // 4. Check dark mode configuration
    const darkModeResult = await this.validateDarkMode();
    errors.push(...darkModeResult.errors);
    fixes.push(...darkModeResult.fixes);

    // 5. Build CSS to check for compilation errors
    const buildResult = await this.validateCSSBuild();
    errors.push(...buildResult.errors);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      fixes
    };
  }

  /**
   * Validate Tailwind CSS setup
   */
  private async validateTailwindSetup(): Promise<{ errors: StyleError[]; fixes: StyleFix[] }> {
    const errors: StyleError[] = [];
    const fixes: StyleFix[] = [];

    const tailwindConfigPath = path.join(this.projectPath, 'tailwind.config.js');
    const tailwindConfigTsPath = path.join(this.projectPath, 'tailwind.config.ts');
    const postcssConfigPath = path.join(this.projectPath, 'postcss.config.js');

    // Check if using Tailwind
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    const pkg = await fs.readJSON(packageJsonPath);
    
    if (pkg.dependencies?.tailwindcss || pkg.devDependencies?.tailwindcss) {
      // Tailwind is installed, check configuration
      
      if (!await fs.pathExists(tailwindConfigPath) && !await fs.pathExists(tailwindConfigTsPath)) {
        errors.push({
          file: 'tailwind.config.js',
          type: 'tailwind-config',
          message: 'Tailwind CSS installed but configuration file missing',
          severity: 'critical'
        });

        fixes.push({
          file: 'tailwind.config.js',
          issue: 'Missing Tailwind configuration',
          solution: 'Create tailwind.config.js',
          code: this.generateTailwindConfig()
        });
      } else {
        // Check content paths
        const configPath = await fs.pathExists(tailwindConfigPath) ? tailwindConfigPath : tailwindConfigTsPath;
        const configContent = await fs.readFile(configPath, 'utf-8');
        
        if (!configContent.includes('content:') && !configContent.includes('purge:')) {
          errors.push({
            file: path.basename(configPath),
            type: 'tailwind-config',
            message: 'Tailwind config missing content paths - styles will not be generated',
            severity: 'critical'
          });

          fixes.push({
            file: path.basename(configPath),
            issue: 'Missing content paths',
            solution: 'Add content paths to config',
            code: `content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ]`
          });
        }
      }

      // Check PostCSS configuration
      if (!await fs.pathExists(postcssConfigPath)) {
        errors.push({
          file: 'postcss.config.js',
          type: 'tailwind-config',
          message: 'PostCSS configuration missing for Tailwind CSS',
          severity: 'high'
        });

        fixes.push({
          file: 'postcss.config.js',
          issue: 'Missing PostCSS config',
          solution: 'Create postcss.config.js',
          code: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`
        });
      }

      // Check if Tailwind directives are imported
      const globalCssFiles = await this.findGlobalCSSFiles();
      let hasDirectives = false;

      for (const cssFile of globalCssFiles) {
        const content = await fs.readFile(cssFile, 'utf-8');
        if (content.includes('@tailwind base') || content.includes('@import "tailwindcss/base"')) {
          hasDirectives = true;
          break;
        }
      }

      if (!hasDirectives && globalCssFiles.length > 0) {
        errors.push({
          file: globalCssFiles[0],
          type: 'missing-styles',
          message: 'Tailwind CSS directives not imported in global styles',
          severity: 'critical'
        });

        fixes.push({
          file: globalCssFiles[0],
          issue: 'Missing Tailwind directives',
          solution: 'Add Tailwind imports to global CSS',
          code: `@tailwind base;
@tailwind components;
@tailwind utilities;`
        });
      }
    }

    return { errors, fixes };
  }

  /**
   * Validate global styles
   */
  private async validateGlobalStyles(): Promise<{ errors: StyleError[]; warnings: StyleWarning[] }> {
    const errors: StyleError[] = [];
    const warnings: StyleWarning[] = [];

    const globalCssFiles = await this.findGlobalCSSFiles();

    if (globalCssFiles.length === 0) {
      errors.push({
        file: 'global.css',
        type: 'missing-styles',
        message: 'No global CSS file found',
        severity: 'medium'
      });
    } else {
      for (const cssFile of globalCssFiles) {
        const content = await fs.readFile(cssFile, 'utf-8');

        // Check for basic resets
        if (!content.includes('box-sizing') && !content.includes('@tailwind base')) {
          warnings.push({
            file: cssFile,
            message: 'Missing CSS reset or normalize styles',
            suggestion: 'Add box-sizing: border-box reset'
          });
        }

        // Check for body styles
        if (!content.includes('body') && !content.includes('@tailwind base')) {
          warnings.push({
            file: cssFile,
            message: 'No body styles defined',
            suggestion: 'Add default body styles for fonts and colors'
          });
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate component styles
   */
  private async validateComponentStyles(): Promise<{ errors: StyleError[]; warnings: StyleWarning[] }> {
    const errors: StyleError[] = [];
    const warnings: StyleWarning[] = [];

    // Find all component files
    const componentFiles = await this.findComponentFiles();

    for (const file of componentFiles) {
      const content = await fs.readFile(file, 'utf-8');
      const relPath = path.relative(this.projectPath, file);

      // Check for className vs class (React/Vue)
      if (this.framework === 'react' || this.framework === 'nextjs') {
        if (content.includes('class=') && !content.includes('className=')) {
          errors.push({
            file: relPath,
            type: 'css-modules',
            message: 'Using "class" instead of "className" in React component',
            severity: 'high'
          });
        }
      }

      // Check for inline styles without proper formatting
      if (content.includes('style="') && this.framework === 'react') {
        errors.push({
          file: relPath,
          type: 'css-modules',
          message: 'Using string style instead of object in React',
          severity: 'medium'
        });
      }

      // Check for undefined CSS classes (basic check)
      const classNameMatches = content.matchAll(/className=["']([^"']+)["']/g);
      for (const match of classNameMatches) {
        const classes = match[1].split(' ');
        for (const cls of classes) {
          // Skip dynamic classes and Tailwind classes
          if (!cls.includes('{') && !cls.includes('$') && !this.isTailwindClass(cls)) {
            // Check if it's a CSS module
            const cssModulePath = file.replace(/\.(jsx?|tsx?)$/, '.module.css');
            if (!await fs.pathExists(cssModulePath)) {
              warnings.push({
                file: relPath,
                message: `Class "${cls}" used but no CSS module found`,
                suggestion: 'Create CSS module or use Tailwind classes'
              });
              break; // Only warn once per file
            }
          }
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Validate dark mode setup
   */
  private async validateDarkMode(): Promise<{ errors: StyleError[]; fixes: StyleFix[] }> {
    const errors: StyleError[] = [];
    const fixes: StyleFix[] = [];

    // Check if dark mode is configured
    const tailwindConfigPath = path.join(this.projectPath, 'tailwind.config.js');
    const tailwindConfigTsPath = path.join(this.projectPath, 'tailwind.config.ts');

    if (await fs.pathExists(tailwindConfigPath) || await fs.pathExists(tailwindConfigTsPath)) {
      const configPath = await fs.pathExists(tailwindConfigPath) ? tailwindConfigPath : tailwindConfigTsPath;
      const content = await fs.readFile(configPath, 'utf-8');

      // Check for dark mode configuration
      if (content.includes('dark:')) {
        // Dark mode classes are used
        if (!content.includes('darkMode:')) {
          errors.push({
            file: path.basename(configPath),
            type: 'dark-mode',
            message: 'Dark mode classes used but darkMode not configured',
            severity: 'medium'
          });

          fixes.push({
            file: path.basename(configPath),
            issue: 'Missing dark mode configuration',
            solution: 'Add darkMode to Tailwind config',
            code: `darkMode: 'class', // or 'media'`
          });
        }
      }
    }

    // Check for CSS variables for theming
    const globalCssFiles = await this.findGlobalCSSFiles();
    for (const cssFile of globalCssFiles) {
      const content = await fs.readFile(cssFile, 'utf-8');
      
      if (content.includes('dark:') || content.includes('.dark')) {
        if (!content.includes(':root') || !content.includes('--')) {
          // TODO: Add warning for dark mode styles without CSS variables
          // This should be a warning, not an error
        }
      }
    }

    return { errors, fixes };
  }

  /**
   * Validate CSS build
   */
  private async validateCSSBuild(): Promise<{ errors: StyleError[] }> {
    const errors: StyleError[] = [];

    try {
      // Try to build CSS
      const buildCommands = [
        'npm run build:css',
        'npm run build',
        'npx tailwindcss build',
        'npx postcss'
      ];

      for (const command of buildCommands) {
        try {
          const { stderr } = await execAsync(command, { 
            cwd: this.projectPath,
            timeout: 30000 
          });

          if (stderr && stderr.includes('error')) {
            errors.push({
              file: 'CSS Build',
              type: 'compilation',
              message: `CSS build error: ${stderr.substring(0, 200)}`,
              severity: 'high'
            });
          }
          break; // If one command works, don't try others
        } catch {
          // Try next command
        }
      }
    } catch (error) {
      // Build commands not available, skip
    }

    return { errors };
  }

  /**
   * Find global CSS files
   */
  private async findGlobalCSSFiles(): Promise<string[]> {
    const possiblePaths = [
      'src/styles/globals.css',
      'src/styles/global.css',
      'src/app/globals.css',
      'src/app/global.css',
      'styles/globals.css',
      'styles/global.css',
      'app/globals.css',
      'app/global.css',
      'src/index.css',
      'src/main.css',
      'src/App.css'
    ];

    const files: string[] = [];
    for (const relPath of possiblePaths) {
      const fullPath = path.join(this.projectPath, relPath);
      if (await fs.pathExists(fullPath)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  /**
   * Find component files
   */
  private async findComponentFiles(): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.jsx', '.tsx', '.vue'];

    async function walk(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory()) {
            if (!['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
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

    await walk(this.projectPath);
    return files;
  }

  /**
   * Check if a class is a Tailwind utility
   */
  private isTailwindClass(className: string): boolean {
    // Basic check for common Tailwind patterns
    const tailwindPatterns = [
      /^(m|p|w|h|text|bg|border|flex|grid|absolute|relative|fixed|block|inline)/,
      /^(sm|md|lg|xl|2xl):/,
      /^hover:/,
      /^focus:/,
      /^dark:/
    ];

    return tailwindPatterns.some(pattern => pattern.test(className));
  }

  /**
   * Generate Tailwind config
   */
  private generateTailwindConfig(): string {
    const isNextJs = this.framework === 'nextjs';
    
    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    ${isNextJs ? `"./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",` : 
    `"./src/**/*.{js,ts,jsx,tsx}",
    "./index.html",`}
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  plugins: [],
}`;
  }

  /**
   * Apply fixes automatically
   */
  async applyFixes(fixes: StyleFix[]): Promise<void> {
    for (const fix of fixes) {
      const filePath = path.join(this.projectPath, fix.file);
      
      if (fix.code) {
        if (await fs.pathExists(filePath)) {
          // Append to existing file
          const content = await fs.readFile(filePath, 'utf-8');
          if (!content.includes(fix.code)) {
            await fs.writeFile(filePath, content + '\n\n' + fix.code);
            console.log(`✅ Applied fix to ${fix.file}: ${fix.issue}`);
          }
        } else {
          // Create new file
          await fs.writeFile(filePath, fix.code);
          console.log(`✅ Created ${fix.file}: ${fix.solution}`);
        }
      }
    }
  }
}