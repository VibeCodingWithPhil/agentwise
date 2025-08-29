import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ProjectSpecs } from '../orchestrator/SpecGenerator';

const execAsync = promisify(exec);

export interface TechStackComponents {
  frontend?: {
    framework: string;
    version?: string;
    cssFramework?: string;
    stateManagement?: string[];
    buildTool?: string;
  };
  backend?: {
    runtime: string;
    framework: string;
    version?: string;
    database?: string;
    orm?: string;
  };
  testing?: {
    framework: string;
    tools: string[];
  };
  deployment?: {
    platform: string;
    containerization?: string;
    cicd?: string;
  };
  architecture?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: Recommendation[];
  optimizedStack?: TechStackComponents;
}

export interface ValidationError {
  type: 'compatibility' | 'conflict' | 'version' | 'architecture';
  severity: 'critical' | 'high' | 'medium';
  message: string;
  affectedComponents: string[];
  solution?: string;
}

export interface ValidationWarning {
  type: string;
  message: string;
  impact?: string;
}

export interface Recommendation {
  category: string;
  suggestion: string;
  reason: string;
  alternatives?: string[];
}

interface CompatibilityRule {
  component: string;
  version?: string;
  requires?: Array<{ component: string; version?: string }>;
  incompatibleWith?: string[];
  recommendedWith?: string[];
}

export class TechSpecValidator {
  private compatibilityRules: Map<string, CompatibilityRule>;
  private versionConstraints: Map<string, any>;
  private architecturePatterns: Map<string, any>;
  private bestPractices: Map<string, any>;

  constructor() {
    this.compatibilityRules = this.loadCompatibilityRules();
    this.versionConstraints = this.loadVersionConstraints();
    this.architecturePatterns = this.loadArchitecturePatterns();
    this.bestPractices = this.loadBestPractices();
  }

  private loadCompatibilityRules(): Map<string, CompatibilityRule> {
    const rules = new Map<string, CompatibilityRule>();
    
    // Frontend Framework Rules
    rules.set('react-18', {
      component: 'react',
      version: '>=18.0.0',
      requires: [
        { component: 'node', version: '>=16.0.0' },
        { component: 'react-dom', version: '>=18.0.0' }
      ],
      incompatibleWith: ['vue', 'angular', 'svelte'],
      recommendedWith: ['typescript', 'vite', 'tailwindcss']
    });

    rules.set('nextjs-14', {
      component: 'next',
      version: '>=14.0.0',
      requires: [
        { component: 'react', version: '>=18.2.0' },
        { component: 'node', version: '>=18.17.0' }
      ],
      incompatibleWith: ['vue', 'angular', 'gatsby'],
      recommendedWith: ['typescript', 'tailwindcss', 'vercel']
    });

    rules.set('vue-3', {
      component: 'vue',
      version: '>=3.0.0',
      requires: [
        { component: 'node', version: '>=16.0.0' }
      ],
      incompatibleWith: ['react', 'angular', 'svelte'],
      recommendedWith: ['vite', 'pinia', 'typescript']
    });

    // CSS Framework Rules
    rules.set('tailwindcss', {
      component: 'tailwindcss',
      version: '>=3.0.0',
      incompatibleWith: ['bootstrap', 'bulma', 'foundation'],
      recommendedWith: ['postcss', 'autoprefixer']
    });

    // Database Rules
    rules.set('postgresql', {
      component: 'postgresql',
      incompatibleWith: ['mysql', 'mongodb', 'sqlite'],
      recommendedWith: ['prisma', 'typeorm', 'sequelize']
    });

    rules.set('mongodb', {
      component: 'mongodb',
      incompatibleWith: ['postgresql', 'mysql', 'sqlite'],
      recommendedWith: ['mongoose', 'mongodb-native']
    });

    // Build Tool Rules
    rules.set('vite', {
      component: 'vite',
      version: '>=5.0.0',
      requires: [{ component: 'node', version: '>=18.0.0' }],
      incompatibleWith: ['webpack', 'parcel', 'rollup'],
      recommendedWith: ['react', 'vue', 'svelte', 'typescript']
    });

    rules.set('webpack', {
      component: 'webpack',
      version: '>=5.0.0',
      incompatibleWith: ['vite', 'parcel', 'rollup'],
      recommendedWith: ['babel', 'typescript']
    });

    return rules;
  }

  private loadVersionConstraints(): Map<string, any> {
    const constraints = new Map();
    
    constraints.set('node-versions', {
      '20.x': { lts: true, recommended: true, endOfLife: '2026-04-30' },
      '18.x': { lts: true, recommended: true, endOfLife: '2025-04-30' },
      '16.x': { lts: false, recommended: false, endOfLife: '2023-09-11' }
    });

    constraints.set('typescript-versions', {
      '5.x': { recommended: true, minNode: '16.0.0' },
      '4.x': { recommended: false, minNode: '14.0.0' }
    });

    return constraints;
  }

  private loadArchitecturePatterns(): Map<string, any> {
    const patterns = new Map();
    
    patterns.set('microservices', {
      requires: ['api-gateway', 'service-discovery', 'distributed-logging'],
      incompatibleWith: ['monolithic', 'shared-database'],
      recommendedStack: {
        backend: ['nodejs', 'express', 'fastify'],
        database: ['postgresql', 'mongodb'],
        messaging: ['rabbitmq', 'kafka'],
        containerization: ['docker', 'kubernetes']
      }
    });

    patterns.set('serverless', {
      requires: ['stateless-functions', 'external-storage'],
      incompatibleWith: ['persistent-connections', 'websockets'],
      recommendedStack: {
        backend: ['aws-lambda', 'vercel-functions', 'netlify-functions'],
        database: ['dynamodb', 'fauna', 'planetscale'],
        storage: ['s3', 'cloudinary']
      }
    });

    patterns.set('spa', {
      requires: ['client-routing', 'api-backend'],
      recommendedStack: {
        frontend: ['react', 'vue', 'angular'],
        buildTool: ['vite', 'webpack'],
        deployment: ['vercel', 'netlify', 'cloudflare']
      }
    });

    patterns.set('ssr', {
      requires: ['server-rendering', 'node-runtime'],
      recommendedStack: {
        frontend: ['nextjs', 'nuxt', 'sveltekit'],
        deployment: ['vercel', 'railway', 'render']
      }
    });

    return patterns;
  }

  private loadBestPractices(): Map<string, any> {
    const practices = new Map();
    
    practices.set('security', {
      authentication: ['jwt', 'oauth2', 'auth0', 'clerk'],
      encryption: ['bcrypt', 'argon2'],
      validation: ['zod', 'joi', 'yup'],
      cors: ['cors-middleware'],
      rateLimit: ['express-rate-limit', 'redis']
    });

    practices.set('performance', {
      caching: ['redis', 'memcached'],
      cdn: ['cloudflare', 'fastly', 'cloudfront'],
      optimization: ['lazy-loading', 'code-splitting', 'tree-shaking'],
      monitoring: ['datadog', 'new-relic', 'sentry']
    });

    practices.set('testing', {
      unit: ['jest', 'vitest', 'mocha'],
      integration: ['supertest', 'playwright'],
      e2e: ['cypress', 'playwright', 'puppeteer'],
      coverage: ['c8', 'nyc', 'istanbul']
    });

    return practices;
  }

  async validateTechStack(specs: ProjectSpecs): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const recommendations: Recommendation[] = [];
    
    // Extract tech stack from specs
    const techStack = this.extractTechStack(specs);
    
    // 1. Validate compatibility
    this.validateCompatibility(techStack, errors, warnings);
    
    // 2. Validate versions
    await this.validateVersions(techStack, errors, warnings);
    
    // 3. Validate architecture
    this.validateArchitecture(techStack, errors, warnings);
    
    // 4. Check for conflicts
    this.checkConflicts(techStack, errors, warnings);
    
    // 5. Generate recommendations
    this.generateRecommendations(techStack, recommendations);
    
    // 6. Optimize tech stack
    const optimizedStack = this.optimizeTechStack(techStack, errors, warnings);
    
    // 7. Research and verify latest best practices
    await this.researchLatestBestPractices(techStack, recommendations);
    
    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      warnings,
      recommendations,
      optimizedStack
    };
  }

  private extractTechStack(specs: ProjectSpecs): TechStackComponents {
    const stack: TechStackComponents = {};
    const fullSpec = `${specs.mainSpec}\n${specs.projectSpec}\n${specs.todoSpec}`.toLowerCase();
    
    // Extract frontend framework
    if (fullSpec.includes('react')) {
      stack.frontend = { 
        framework: 'react',
        version: fullSpec.includes('react 18') ? '18.x' : '17.x'
      };
    } else if (fullSpec.includes('vue')) {
      stack.frontend = { 
        framework: 'vue',
        version: fullSpec.includes('vue 3') ? '3.x' : '2.x'
      };
    } else if (fullSpec.includes('angular')) {
      stack.frontend = { framework: 'angular' };
    } else if (fullSpec.includes('nextjs') || fullSpec.includes('next.js')) {
      stack.frontend = { 
        framework: 'nextjs',
        version: '14.x'
      };
    }
    
    // Extract CSS framework
    if (stack.frontend) {
      if (fullSpec.includes('tailwind')) {
        stack.frontend.cssFramework = 'tailwindcss';
      } else if (fullSpec.includes('bootstrap')) {
        stack.frontend.cssFramework = 'bootstrap';
      } else if (fullSpec.includes('material')) {
        stack.frontend.cssFramework = 'material-ui';
      }
      
      // Extract build tool
      if (fullSpec.includes('vite')) {
        stack.frontend.buildTool = 'vite';
      } else if (fullSpec.includes('webpack')) {
        stack.frontend.buildTool = 'webpack';
      }
    }
    
    // Extract backend
    if (fullSpec.includes('node') || fullSpec.includes('express') || fullSpec.includes('fastify')) {
      stack.backend = {
        runtime: 'node',
        framework: fullSpec.includes('express') ? 'express' : 
                  fullSpec.includes('fastify') ? 'fastify' : 
                  fullSpec.includes('nestjs') ? 'nestjs' : 'node'
      };
    }
    
    // Extract database
    if (stack.backend) {
      if (fullSpec.includes('postgresql') || fullSpec.includes('postgres')) {
        stack.backend.database = 'postgresql';
      } else if (fullSpec.includes('mongodb') || fullSpec.includes('mongo')) {
        stack.backend.database = 'mongodb';
      } else if (fullSpec.includes('mysql')) {
        stack.backend.database = 'mysql';
      }
      
      // Extract ORM
      if (fullSpec.includes('prisma')) {
        stack.backend.orm = 'prisma';
      } else if (fullSpec.includes('typeorm')) {
        stack.backend.orm = 'typeorm';
      } else if (fullSpec.includes('mongoose')) {
        stack.backend.orm = 'mongoose';
      }
    }
    
    // Extract architecture
    if (fullSpec.includes('microservice')) {
      stack.architecture = 'microservices';
    } else if (fullSpec.includes('serverless')) {
      stack.architecture = 'serverless';
    } else if (fullSpec.includes('spa') || fullSpec.includes('single page')) {
      stack.architecture = 'spa';
    } else if (fullSpec.includes('ssr') || fullSpec.includes('server') && fullSpec.includes('render')) {
      stack.architecture = 'ssr';
    }
    
    // Extract testing
    if (fullSpec.includes('jest') || fullSpec.includes('vitest') || fullSpec.includes('test')) {
      stack.testing = {
        framework: fullSpec.includes('vitest') ? 'vitest' : 'jest',
        tools: []
      };
      
      if (fullSpec.includes('cypress')) {
        stack.testing.tools.push('cypress');
      }
      if (fullSpec.includes('playwright')) {
        stack.testing.tools.push('playwright');
      }
    }
    
    return stack;
  }

  private validateCompatibility(
    stack: TechStackComponents, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Check frontend framework compatibility
    if (stack.frontend?.framework) {
      const ruleKey = `${stack.frontend.framework}-${stack.frontend.version?.split('.')[0]}`;
      const rule = this.compatibilityRules.get(ruleKey) || 
                  this.compatibilityRules.get(stack.frontend.framework);
      
      if (rule) {
        // Check incompatible components
        if (rule.incompatibleWith) {
          for (const incompatible of rule.incompatibleWith) {
            if (this.stackContains(stack, incompatible)) {
              errors.push({
                type: 'compatibility',
                severity: 'critical',
                message: `${stack.frontend.framework} is incompatible with ${incompatible}`,
                affectedComponents: [stack.frontend.framework, incompatible],
                solution: `Remove ${incompatible} or choose a different frontend framework`
              });
            }
          }
        }
        
        // Check required components
        if (rule.requires) {
          for (const requirement of rule.requires) {
            if (!this.stackContains(stack, requirement.component)) {
              warnings.push({
                type: 'missing-requirement',
                message: `${stack.frontend.framework} requires ${requirement.component} ${requirement.version || ''}`,
                impact: 'May cause runtime errors or build failures'
              });
            }
          }
        }
      }
    }
    
    // Check CSS framework conflicts
    if (stack.frontend?.cssFramework) {
      const cssRule = this.compatibilityRules.get(stack.frontend.cssFramework);
      if (cssRule?.incompatibleWith) {
        for (const incompatible of cssRule.incompatibleWith) {
          if (this.stackContains(stack, incompatible)) {
            errors.push({
              type: 'conflict',
              severity: 'high',
              message: `CSS framework conflict: ${stack.frontend.cssFramework} with ${incompatible}`,
              affectedComponents: [stack.frontend.cssFramework, incompatible],
              solution: 'Use only one CSS framework'
            });
          }
        }
      }
    }
    
    // Check database compatibility
    if (stack.backend?.database && stack.backend?.orm) {
      const validCombos: Record<string, string[]> = {
        'postgresql': ['prisma', 'typeorm', 'sequelize'],
        'mongodb': ['mongoose', 'prisma'],
        'mysql': ['prisma', 'typeorm', 'sequelize']
      };
      
      const validOrms = validCombos[stack.backend.database];
      if (validOrms && !validOrms.includes(stack.backend.orm)) {
        errors.push({
          type: 'compatibility',
          severity: 'high',
          message: `${stack.backend.orm} is not optimal for ${stack.backend.database}`,
          affectedComponents: [stack.backend.orm, stack.backend.database],
          solution: `Consider using ${validOrms.join(' or ')} with ${stack.backend.database}`
        });
      }
    }
  }

  private async validateVersions(
    stack: TechStackComponents,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    // Check Node.js version if backend exists
    if (stack.backend?.runtime === 'node') {
      try {
        const { stdout } = await execAsync('node --version');
        const nodeVersion = stdout.trim().replace('v', '');
        const majorVersion = parseInt(nodeVersion.split('.')[0]);
        
        const nodeConstraints = this.versionConstraints.get('node-versions');
        const versionInfo = nodeConstraints[`${majorVersion}.x`];
        
        if (!versionInfo) {
          errors.push({
            type: 'version',
            severity: 'critical',
            message: `Node.js version ${nodeVersion} is not supported`,
            affectedComponents: ['node'],
            solution: 'Upgrade to Node.js 18.x or 20.x (LTS versions)'
          });
        } else if (!versionInfo.recommended) {
          warnings.push({
            type: 'version',
            message: `Node.js version ${nodeVersion} is not recommended`,
            impact: 'May have compatibility issues or missing features'
          });
        }
      } catch (error) {
        warnings.push({
          type: 'environment',
          message: 'Could not verify Node.js version',
          impact: 'Version compatibility cannot be guaranteed'
        });
      }
    }
    
    // Verify package versions through npm/yarn
    if (stack.frontend?.framework) {
      try {
        const { stdout } = await execAsync(`npm view ${stack.frontend.framework} version`);
        const latestVersion = stdout.trim();
        
        if (stack.frontend.version) {
          const specifiedMajor = stack.frontend.version.split('.')[0];
          const latestMajor = latestVersion.split('.')[0];
          
          if (parseInt(specifiedMajor) < parseInt(latestMajor) - 1) {
            warnings.push({
              type: 'version',
              message: `${stack.frontend.framework} version ${stack.frontend.version} is outdated. Latest is ${latestVersion}`,
              impact: 'Missing latest features and security updates'
            });
          }
        }
      } catch (error) {
        // Package not found or network error
      }
    }
  }

  private validateArchitecture(
    stack: TechStackComponents,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    if (!stack.architecture) return;
    
    const pattern = this.architecturePatterns.get(stack.architecture);
    if (!pattern) return;
    
    // Check required components for architecture
    if (pattern.requires) {
      for (const requirement of pattern.requires) {
        if (!this.stackContains(stack, requirement)) {
          warnings.push({
            type: 'architecture',
            message: `${stack.architecture} architecture typically requires ${requirement}`,
            impact: 'May not fully leverage architecture benefits'
          });
        }
      }
    }
    
    // Check incompatible patterns
    if (pattern.incompatibleWith) {
      for (const incompatible of pattern.incompatibleWith) {
        if (this.stackContains(stack, incompatible)) {
          errors.push({
            type: 'architecture',
            severity: 'high',
            message: `${stack.architecture} architecture conflicts with ${incompatible}`,
            affectedComponents: [stack.architecture, incompatible],
            solution: 'Reconsider architecture choice or remove conflicting component'
          });
        }
      }
    }
  }

  private checkConflicts(
    stack: TechStackComponents,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for multiple state management libraries
    if (stack.frontend?.stateManagement && stack.frontend.stateManagement.length > 1) {
      warnings.push({
        type: 'redundancy',
        message: `Multiple state management libraries detected: ${stack.frontend.stateManagement.join(', ')}`,
        impact: 'Increased bundle size and complexity'
      });
    }
    
    // Check build tool conflicts
    if (stack.frontend?.buildTool) {
      const buildTools = ['vite', 'webpack', 'parcel', 'rollup'];
      const otherTools = buildTools.filter(t => t !== stack.frontend?.buildTool);
      
      for (const tool of otherTools) {
        if (this.stackContains(stack, tool)) {
          errors.push({
            type: 'conflict',
            severity: 'medium',
            message: `Build tool conflict: ${stack.frontend.buildTool} and ${tool}`,
            affectedComponents: [stack.frontend.buildTool, tool],
            solution: 'Use only one build tool'
          });
        }
      }
    }
  }

  private generateRecommendations(
    stack: TechStackComponents,
    recommendations: Recommendation[]
  ): void {
    // Frontend recommendations
    if (stack.frontend?.framework) {
      const rule = this.compatibilityRules.get(stack.frontend.framework);
      if (rule?.recommendedWith) {
        for (const recommended of rule.recommendedWith) {
          if (!this.stackContains(stack, recommended)) {
            recommendations.push({
              category: 'enhancement',
              suggestion: `Consider adding ${recommended}`,
              reason: `Works exceptionally well with ${stack.frontend.framework}`,
              alternatives: this.getAlternatives(recommended)
            });
          }
        }
      }
      
      // TypeScript recommendation
      if (!this.stackContains(stack, 'typescript')) {
        recommendations.push({
          category: 'type-safety',
          suggestion: 'Add TypeScript for type safety',
          reason: 'Reduces runtime errors and improves developer experience',
          alternatives: ['jsdoc', 'flow']
        });
      }
    }
    
    // Security recommendations
    const securityPractices = this.bestPractices.get('security');
    if (stack.backend && !this.stackContains(stack, 'authentication')) {
      recommendations.push({
        category: 'security',
        suggestion: 'Implement authentication',
        reason: 'Essential for securing user data and API endpoints',
        alternatives: securityPractices.authentication
      });
    }
    
    // Performance recommendations
    const performancePractices = this.bestPractices.get('performance');
    if (stack.backend?.database && !this.stackContains(stack, 'cache')) {
      recommendations.push({
        category: 'performance',
        suggestion: 'Add caching layer',
        reason: 'Significantly improves response times and reduces database load',
        alternatives: performancePractices.caching
      });
    }
    
    // Testing recommendations
    if (!stack.testing) {
      recommendations.push({
        category: 'quality',
        suggestion: 'Add testing framework',
        reason: 'Essential for maintaining code quality and preventing regressions',
        alternatives: ['jest', 'vitest', 'mocha']
      });
    }
  }

  private optimizeTechStack(
    stack: TechStackComponents,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): TechStackComponents {
    const optimized = JSON.parse(JSON.stringify(stack));
    
    // Remove conflicting components
    for (const error of errors) {
      if (error.type === 'conflict' || error.type === 'compatibility') {
        // Remove the less important component
        for (const component of error.affectedComponents) {
          this.removeComponent(optimized, component);
        }
      }
    }
    
    // Add missing requirements
    for (const warning of warnings) {
      if (warning.type === 'missing-requirement') {
        // Add required component
        const match = warning.message.match(/requires (\w+)/);
        if (match) {
          this.addComponent(optimized, match[1]);
        }
      }
    }
    
    // Optimize based on architecture
    if (optimized.architecture) {
      const pattern = this.architecturePatterns.get(optimized.architecture);
      if (pattern?.recommendedStack) {
        // Apply recommended stack choices
        if (pattern.recommendedStack.frontend && !optimized.frontend) {
          optimized.frontend = {
            framework: pattern.recommendedStack.frontend[0]
          };
        }
        if (pattern.recommendedStack.backend && !optimized.backend) {
          optimized.backend = {
            runtime: 'node',
            framework: pattern.recommendedStack.backend[0]
          };
        }
      }
    }
    
    return optimized;
  }

  private async researchLatestBestPractices(
    stack: TechStackComponents,
    recommendations: Recommendation[]
  ): Promise<void> {
    // This would normally make API calls to package registries,
    // check GitHub trends, Stack Overflow surveys, etc.
    // For now, we'll use our knowledge base
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    
    // Framework-specific best practices
    if (stack.frontend?.framework === 'react') {
      if (currentYear >= 2024) {
        recommendations.push({
          category: 'modern-practices',
          suggestion: 'Use React Server Components',
          reason: 'Improved performance and reduced client bundle size',
          alternatives: ['Next.js App Router', 'Remix']
        });
      }
    }
    
    if (stack.frontend?.framework === 'vue') {
      recommendations.push({
        category: 'modern-practices',
        suggestion: 'Use Composition API over Options API',
        reason: 'Better TypeScript support and code reusability',
        alternatives: ['setup syntax', 'script setup']
      });
    }
    
    // Database best practices
    if (stack.backend?.database === 'postgresql') {
      recommendations.push({
        category: 'performance',
        suggestion: 'Enable connection pooling',
        reason: 'Reduces connection overhead and improves scalability',
        alternatives: ['pg-pool', 'pgbouncer']
      });
    }
    
    // General 2024+ best practices
    recommendations.push({
      category: 'deployment',
      suggestion: 'Use edge deployment for better global performance',
      reason: 'Reduces latency for users worldwide',
      alternatives: ['Vercel Edge', 'Cloudflare Workers', 'Deno Deploy']
    });
    
    recommendations.push({
      category: 'ai-integration',
      suggestion: 'Consider AI-powered features',
      reason: 'Enhance user experience with intelligent features',
      alternatives: ['OpenAI API', 'Anthropic Claude API', 'Local LLMs']
    });
  }

  private stackContains(stack: TechStackComponents, component: string): boolean {
    const stackStr = JSON.stringify(stack).toLowerCase();
    return stackStr.includes(component.toLowerCase());
  }

  private removeComponent(stack: TechStackComponents, component: string): void {
    // Remove component from stack
    if (stack.frontend?.framework === component) {
      delete stack.frontend;
    }
    if (stack.backend?.framework === component) {
      stack.backend.framework = 'node';
    }
    if (stack.backend?.database === component) {
      delete stack.backend.database;
    }
  }

  private addComponent(stack: TechStackComponents, component: string): void {
    // Add component to stack based on type
    if (component === 'node' && !stack.backend) {
      stack.backend = { runtime: 'node', framework: 'express' };
    }
    if (component === 'typescript') {
      // TypeScript can be added to any stack
      if (stack.frontend) {
        stack.frontend.stateManagement = stack.frontend.stateManagement || [];
        stack.frontend.stateManagement.push('typescript');
      }
    }
  }

  private getAlternatives(component: string): string[] {
    const alternatives: Record<string, string[]> = {
      'typescript': ['jsdoc', 'flow'],
      'tailwindcss': ['css-modules', 'styled-components', 'emotion'],
      'vite': ['webpack', 'parcel', 'esbuild'],
      'jest': ['vitest', 'mocha', 'ava'],
      'prisma': ['typeorm', 'sequelize', 'drizzle']
    };
    
    return alternatives[component] || [];
  }

  public async generateValidationReport(result: ValidationResult): Promise<string> {
    let report = '# Tech Stack Validation Report\n\n';
    
    // Summary
    report += `## Summary\n`;
    report += `- **Validation Status**: ${result.isValid ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- **Critical Errors**: ${result.errors.filter(e => e.severity === 'critical').length}\n`;
    report += `- **Warnings**: ${result.warnings.length}\n`;
    report += `- **Recommendations**: ${result.recommendations.length}\n\n`;
    
    // Errors
    if (result.errors.length > 0) {
      report += `## Errors (${result.errors.length})\n\n`;
      for (const error of result.errors) {
        report += `### ${error.severity.toUpperCase()}: ${error.type}\n`;
        report += `- **Message**: ${error.message}\n`;
        report += `- **Affected**: ${error.affectedComponents.join(', ')}\n`;
        if (error.solution) {
          report += `- **Solution**: ${error.solution}\n`;
        }
        report += '\n';
      }
    }
    
    // Warnings
    if (result.warnings.length > 0) {
      report += `## Warnings (${result.warnings.length})\n\n`;
      for (const warning of result.warnings) {
        report += `- **${warning.type}**: ${warning.message}\n`;
        if (warning.impact) {
          report += `  - Impact: ${warning.impact}\n`;
        }
      }
      report += '\n';
    }
    
    // Recommendations
    if (result.recommendations.length > 0) {
      report += `## Recommendations (${result.recommendations.length})\n\n`;
      for (const rec of result.recommendations) {
        report += `### ${rec.category}\n`;
        report += `- **Suggestion**: ${rec.suggestion}\n`;
        report += `- **Reason**: ${rec.reason}\n`;
        if (rec.alternatives && rec.alternatives.length > 0) {
          report += `- **Options**: ${rec.alternatives.join(', ')}\n`;
        }
        report += '\n';
      }
    }
    
    // Optimized Stack
    if (result.optimizedStack) {
      report += `## Optimized Tech Stack\n\n`;
      report += '```json\n';
      report += JSON.stringify(result.optimizedStack, null, 2);
      report += '\n```\n';
    }
    
    return report;
  }
}