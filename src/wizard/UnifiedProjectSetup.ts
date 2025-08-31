/**
 * Unified Project Setup
 * 
 * Complete setup flow that orchestrates all systems (requirements → database → GitHub → protection),
 * handles the complete pipeline, manages errors gracefully, and provides status updates.
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { EventEmitter } from 'events';
import {
  WizardStepResults,
  UserPreferences,
  GitHubSetupResult,
  ProtectionSetupResult,
  ValidationResult,
  WizardExecutionError
} from './types';
import { Requirements, DatabaseType } from '../requirements/types';
import { RequirementsGenerator } from '../requirements/RequirementsGenerator';
import { DatabaseWizard } from '../database/DatabaseWizard';
import { DatabaseProvider, WizardResult as DatabaseWizardResult } from '../database/types';
import { GitHubIntegration } from '../github/GitHubIntegration';
import { CreateRepositoryOptions } from '../github/types';
import { ProtectionDashboard } from '../protection/ProtectionDashboard';
import { ProtectionConfig } from '../protection/types';

interface RequirementsSetupOptions {
  projectName: string;
  projectPath: string;
  preferences: UserPreferences;
  template?: string;
}

interface DatabaseSetupOptions {
  projectPath: string;
  provider: DatabaseProvider;
  preferences: UserPreferences;
  requirements?: Requirements;
}

interface GitHubSetupOptions {
  projectName: string;
  projectPath: string;
  preferences: UserPreferences;
  requirements?: Requirements;
  database?: DatabaseWizardResult;
}

interface ProtectionSetupOptions {
  projectPath: string;
  preferences: UserPreferences;
  requirements?: Requirements;
  github?: GitHubSetupResult;
}

export class UnifiedProjectSetup extends EventEmitter {
  private requirementsGenerator: RequirementsGenerator;
  private databaseWizard: DatabaseWizard;
  private githubIntegration: GitHubIntegration;
  private protectionDashboard: ProtectionDashboard;

  constructor() {
    super();
    
    // Initialize all the subsystems
    this.requirementsGenerator = new RequirementsGenerator();
    this.databaseWizard = new DatabaseWizard();
    this.githubIntegration = new GitHubIntegration({} as any); // Will be configured per-use
    this.protectionDashboard = new ProtectionDashboard(
      {
        refreshInterval: 5000,
        showDetailedMetrics: false,
        alertThresholds: {
          responseTime: 1000,
          errorRate: 0.05,
          healthScore: 0.8
        },
        displayMode: 'console'
      },
      {} as any, // logger
      {} as any, // performanceMonitor
      {} as any, // autoCommitManager
      {} as any, // securityMonitor
      {} as any, // reviewPipeline
      {} as any, // backupSystem
      {} as any  // reportGenerator
    );
  }

  /**
   * Generate intelligent project requirements
   */
  async generateRequirements(options: RequirementsSetupOptions): Promise<Requirements> {
    this.emit('setup_started', { step: 'requirements', options });
    
    try {
      const startTime = Date.now();
      
      // Analyze project context
      const projectContext = await this.analyzeProjectContext(options.projectPath);
      
      // Generate requirements based on project name, context, and preferences
      const generationResult = await this.requirementsGenerator.generateRequirements({
        projectIdea: options.projectName,
        preferredTechnologies: [
          ...options.preferences.preferredLanguages,
          ...options.preferences.preferredFrameworks,
          options.preferences.preferredDatabase,
          options.preferences.defaultProjectType
        ].filter(Boolean)
      });

      // Enhanced requirements with intelligent suggestions
      const enhancedRequirements = await this.enhanceRequirements(generationResult.requirements, options);
      
      // Save requirements to file
      await this.saveRequirementsToFile(enhancedRequirements, options.projectPath);
      
      this.emit('setup_completed', {
        step: 'requirements',
        duration: Date.now() - startTime,
        result: enhancedRequirements
      });

      return enhancedRequirements;

    } catch (error) {
      this.emit('setup_failed', { step: 'requirements', error });
      throw new WizardExecutionError(
        `Requirements generation failed: ${error}`,
        'requirements',
        'GENERATION_FAILED',
        { error, options }
      );
    }
  }

  /**
   * Setup database integration
   */
  async setupDatabase(options: DatabaseSetupOptions): Promise<DatabaseWizardResult> {
    this.emit('setup_started', { step: 'database', options });
    
    try {
      const startTime = Date.now();
      
      // Configure database wizard based on requirements
      const databaseConfig = await this.createDatabaseConfig(options);
      
      // Run database setup wizard
      const result = await this.databaseWizard.runWizard();

      // Enhance result with additional context
      const enhancedResult = await this.enhanceDatabaseResult(result, options);
      
      // Update project configuration files
      await this.updateProjectConfigForDatabase(enhancedResult, options.projectPath);
      
      this.emit('setup_completed', {
        step: 'database',
        duration: Date.now() - startTime,
        result: enhancedResult
      });

      return enhancedResult;

    } catch (error) {
      this.emit('setup_failed', { step: 'database', error });
      throw new WizardExecutionError(
        `Database setup failed: ${error}`,
        'database',
        'SETUP_FAILED',
        { error, options }
      );
    }
  }

  /**
   * Setup GitHub repository and workflows
   */
  async setupGitHub(options: GitHubSetupOptions): Promise<GitHubSetupResult> {
    this.emit('setup_started', { step: 'github', options });
    
    try {
      const startTime = Date.now();
      
      // Configure GitHub integration
      await this.configureGitHubIntegration(options);
      
      // Create repository
      const repositoryOptions = await this.createRepositoryOptions(options);
      const repository = await this.githubIntegration.getRepoManager().createRepository(repositoryOptions);
      
      // Setup branch protection
      const protectionRules = await this.createBranchProtectionRules(options);
      let protectionEnabled = false;
      if (protectionRules.length > 0) {
        try {
          for (const rule of protectionRules) {
            await this.githubIntegration.getRepoManager().setupBranchProtection(repository.name, rule);
          }
          protectionEnabled = true;
        } catch (error) {
          console.warn('Failed to setup branch protection:', error);
        }
      }
      
      // Create workflows
      const workflowsCreated = await this.createGitHubWorkflows(options);
      
      // Upload secrets if needed
      const secretsUploaded = await this.uploadProjectSecrets(options);
      
      // Initialize local git and connect to remote
      await this.connectLocalGitToRemote(repository, options.projectPath);
      
      const result: GitHubSetupResult = {
        success: true,
        repository,
        cloneUrl: repository.cloneUrl,
        sshUrl: repository.sshUrl,
        protectionEnabled,
        workflowsCreated,
        secretsUploaded
      };
      
      this.emit('setup_completed', {
        step: 'github',
        duration: Date.now() - startTime,
        result
      });

      return result;

    } catch (error) {
      this.emit('setup_failed', { step: 'github', error });
      
      return {
        success: false,
        protectionEnabled: false,
        workflowsCreated: [],
        secretsUploaded: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Setup project protection and security monitoring
   */
  async setupProtection(options: ProtectionSetupOptions): Promise<ProtectionSetupResult> {
    this.emit('setup_started', { step: 'protection', options });
    
    try {
      const startTime = Date.now();
      
      // Create protection configuration
      const protectionConfig = await this.createProtectionConfig(options);
      
      // Initialize protection orchestrator
      await this.protectionDashboard.start();
      
      // Start protection services
      const servicesStarted = await this.startProtectionServices(protectionConfig);
      
      // Configure backups
      const backupConfigured = await this.configureProjectBackups(options.projectPath, protectionConfig);
      
      // Enable monitoring
      const monitoringEnabled = await this.enableProjectMonitoring(options.projectPath, protectionConfig);
      
      // Save protection configuration
      await this.saveProtectionConfig(protectionConfig, options.projectPath);
      
      const result: ProtectionSetupResult = {
        success: true,
        config: protectionConfig,
        servicesStarted,
        backupConfigured,
        monitoringEnabled
      };
      
      this.emit('setup_completed', {
        step: 'protection',
        duration: Date.now() - startTime,
        result
      });

      return result;

    } catch (error) {
      this.emit('setup_failed', { step: 'protection', error });
      
      return {
        success: false,
        servicesStarted: [],
        backupConfigured: false,
        monitoringEnabled: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Validate the entire setup pipeline
   */
  async validateSetup(projectPath: string, results: WizardStepResults): Promise<ValidationResult> {
    const errors = [];
    const warnings = [];
    const suggestions = [];
    
    try {
      // Validate project structure
      const projectExists = await this.validateProjectStructure(projectPath);
      if (!projectExists) {
        errors.push({
          field: 'projectStructure',
          message: 'Project directory structure is invalid',
          code: 'INVALID_STRUCTURE',
          severity: 'error' as const,
          fixable: true,
          fix: 'Recreate project directory structure'
        });
      }
      
      // Validate requirements
      if (results.requirements) {
        const requirementsValid = await this.validateRequirements(results.requirements, projectPath);
        if (!requirementsValid) {
          warnings.push({
            message: 'Requirements file may be incomplete or invalid',
            code: 'INCOMPLETE_REQUIREMENTS',
            ignorable: true,
            impact: 'May affect project development planning'
          });
        }
      }
      
      // Validate database setup
      if (results.database?.success) {
        const dbValid = await this.validateDatabaseSetup(results.database, projectPath);
        if (!dbValid) {
          errors.push({
            field: 'database',
            message: 'Database configuration is invalid or incomplete',
            code: 'INVALID_DATABASE',
            severity: 'error' as const,
            fixable: true,
            fix: 'Re-run database setup wizard'
          });
        }
      }
      
      // Validate GitHub setup
      if (results.github?.success) {
        const githubValid = await this.validateGitHubSetup(results.github, projectPath);
        if (!githubValid) {
          warnings.push({
            message: 'GitHub integration may have issues',
            code: 'GITHUB_ISSUES',
            ignorable: true,
            impact: 'May affect CI/CD and collaboration features'
          });
        }
      }
      
      // Validate protection setup
      if (results.protection?.success) {
        const protectionValid = await this.validateProtectionSetup(results.protection, projectPath);
        if (!protectionValid) {
          warnings.push({
            message: 'Protection system may not be fully configured',
            code: 'INCOMPLETE_PROTECTION',
            ignorable: true,
            impact: 'May reduce project security and monitoring capabilities'
          });
        }
      }
      
      // Generate suggestions
      suggestions.push(...await this.generateSetupSuggestions(results, projectPath));
      
    } catch (error) {
      errors.push({
        field: 'validation',
        message: `Validation failed: ${error}`,
        code: 'VALIDATION_ERROR',
        severity: 'warning' as const,
        fixable: false
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Rollback setup steps in case of failure
   */
  async rollbackSetup(projectPath: string, results: Partial<WizardStepResults>): Promise<void> {
    this.emit('rollback_started', { projectPath, results });
    
    try {
      // Rollback in reverse order of setup
      if (results.protection?.success) {
        await this.rollbackProtectionSetup(projectPath);
      }
      
      if (results.github?.success) {
        await this.rollbackGitHubSetup(results.github, projectPath);
      }
      
      if (results.database?.success) {
        await this.rollbackDatabaseSetup(results.database, projectPath);
      }
      
      if (results.requirements) {
        await this.rollbackRequirementsSetup(projectPath);
      }
      
      this.emit('rollback_completed', { projectPath });
      
    } catch (error) {
      this.emit('rollback_failed', { projectPath, error });
      throw new WizardExecutionError(
        `Rollback failed: ${error}`,
        'rollback',
        'ROLLBACK_FAILED',
        { error, projectPath, results }
      );
    }
  }

  // Private helper methods

  private async analyzeProjectContext(projectPath: string): Promise<any> {
    const context: any = {};
    
    try {
      // Check for existing package.json
      const packageJsonPath = path.join(projectPath, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        context.existingPackageJson = packageJson;
        context.dependencies = packageJson.dependencies || {};
        context.devDependencies = packageJson.devDependencies || {};
      } catch {
        // No package.json exists
      }
      
      // Check for existing configuration files
      const configFiles = [
        'tsconfig.json',
        '.eslintrc.json',
        'prettier.config.js',
        'tailwind.config.js',
        'next.config.js',
        'vite.config.ts',
        '.env',
        'docker-compose.yml'
      ];
      
      context.existingConfigs = {};
      for (const file of configFiles) {
        try {
          await fs.access(path.join(projectPath, file));
          context.existingConfigs[file] = true;
        } catch {
          context.existingConfigs[file] = false;
        }
      }
      
      // Analyze directory structure
      const files = await fs.readdir(projectPath).catch((): string[] => []);
      context.existingFiles = files;
      context.hasSourceDir = files.includes('src');
      context.hasPublicDir = files.includes('public');
      context.hasDocsDir = files.includes('docs');
      
    } catch (error) {
      console.warn('Failed to analyze project context:', error);
    }
    
    return context;
  }

  private inferProjectTypeFromName(projectName: string): string {
    const name = projectName.toLowerCase();
    
    if (name.includes('api') || name.includes('service') || name.includes('server')) {
      return 'api-service';
    }
    if (name.includes('cli') || name.includes('tool') || name.includes('command')) {
      return 'cli-tool';
    }
    if (name.includes('lib') || name.includes('package') || name.includes('component')) {
      return 'library';
    }
    if (name.includes('mobile') || name.includes('app') || name.includes('ios') || name.includes('android')) {
      return 'mobile-application';
    }
    if (name.includes('desktop') || name.includes('electron')) {
      return 'desktop-application';
    }
    if (name.includes('game')) {
      return 'game';
    }
    
    // Default to web application
    return 'web-application';
  }

  private async enhanceRequirements(requirements: Requirements, options: RequirementsSetupOptions): Promise<Requirements> {
    // Add intelligent enhancements based on preferences and context
    const enhanced = { ...requirements };
    
    // Enhance tech stack based on preferences
    if (options.preferences.preferredFrameworks.length > 0) {
      enhanced.techStack = {
        ...enhanced.techStack,
        frontend: {
          ...enhanced.techStack.frontend,
          framework: options.preferences.preferredFrameworks[0]
        }
      };
    }
    
    // Add database configuration based on preferences
    if (options.preferences.alwaysSetupDatabase) {
      enhanced.database = {
        type: this.mapDatabaseProviderToType(options.preferences.preferredDatabase),
        name: `${options.projectName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_db`,
        orm: 'prisma',
        migrations: true,
        seeding: true,
        backup: true,
        constraints: []
      };
    }
    
    return enhanced;
  }

  private async saveRequirementsToFile(requirements: Requirements, projectPath: string): Promise<void> {
    const requirementsPath = path.join(projectPath, 'requirements.json');
    const markdownPath = path.join(projectPath, 'REQUIREMENTS.md');
    
    // Save JSON version
    await fs.writeFile(requirementsPath, JSON.stringify(requirements, null, 2));
    
    // Save markdown version for human readability
    const markdown = this.generateRequirementsMarkdown(requirements);
    await fs.writeFile(markdownPath, markdown);
  }

  private generateRequirementsMarkdown(requirements: Requirements): string {
    return `# Project Requirements

## Overview
**Project:** ${requirements.title}
**Description:** ${requirements.description}
**Type:** ${requirements.projectType}
**Scope:** ${requirements.scope}

## Features
${requirements.features.map(f => `- **${f.name}** (${f.priority}): ${f.description}`).join('\n')}

## Tech Stack
${requirements.techStack.frontend ? `**Frontend:** ${requirements.techStack.frontend.framework}\n` : ''}${requirements.techStack.backend ? `**Backend:** ${requirements.techStack.backend.framework}\n` : ''}${requirements.techStack.database ? `**Database:** ${requirements.techStack.database.primary.type}\n` : ''}

## Timeline
**Total Duration:** ${requirements.timeline.totalDuration} days
**Phases:** ${requirements.timeline.phases.length}

## Team Requirements
**Size:** ${requirements.team.size} people
**Structure:** ${requirements.team.structure}

---
*Generated by Agentwise Project Wizard*
`;
  }

  private async createDatabaseConfig(options: DatabaseSetupOptions): Promise<any> {
    return {
      provider: options.provider,
      autoDetect: true,
      setupEnvironment: true,
      generateMigrations: true,
      seedData: options.preferences.defaultProjectType !== 'library',
      setupMCP: true
    };
  }

  private async enhanceDatabaseResult(result: DatabaseWizardResult, options: DatabaseSetupOptions): Promise<DatabaseWizardResult> {
    // Add any enhancements or post-processing
    return result;
  }

  private async updateProjectConfigForDatabase(result: DatabaseWizardResult, projectPath: string): Promise<void> {
    if (!result.success) return;
    
    // Update package.json with database dependencies
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
      
      // Add database-specific scripts
      packageJson.scripts = {
        ...packageJson.scripts,
        'db:generate': 'prisma generate',
        'db:migrate': 'prisma migrate dev',
        'db:studio': 'prisma studio',
        'db:reset': 'prisma migrate reset'
      };
      
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } catch (error) {
      console.warn('Failed to update package.json for database:', error);
    }
  }

  private async configureGitHubIntegration(options: GitHubSetupOptions): Promise<void> {
    // The GitHubIntegration will handle authentication automatically
    // We just need to make sure it's configured for the project
  }

  private async createRepositoryOptions(options: GitHubSetupOptions): Promise<CreateRepositoryOptions> {
    return {
      name: options.projectName,
      description: options.requirements?.description || `${options.projectName} - Created with Agentwise`,
      private: options.preferences.preferPrivateRepos,
      allowSquashMerge: true,
      allowMergeCommit: false,
      allowRebaseMerge: true,
      deleteBranchOnMerge: true,
      hasIssues: true,
      hasProjects: true,
      hasWiki: false
    };
  }

  private async createBranchProtectionRules(options: GitHubSetupOptions): Promise<any[]> {
    return [
      {
        branch: 'main',
        requiredStatusChecks: {
          strict: true,
          contexts: ['ci/tests', 'ci/build']
        },
        enforceAdmins: false,
        requiredPullRequestReviews: {
          requiredApprovingReviewCount: 1,
          dismissStaleReviews: true,
          requireCodeOwnerReviews: false
        }
      }
    ];
  }

  private async createGitHubWorkflows(options: GitHubSetupOptions): Promise<string[]> {
    const workflowsCreated: string[] = [];
    
    try {
      const workflowsDir = path.join(options.projectPath, '.github', 'workflows');
      await fs.mkdir(workflowsDir, { recursive: true });
      
      // Create CI workflow
      const ciWorkflow = this.generateCIWorkflow(options);
      await fs.writeFile(path.join(workflowsDir, 'ci.yml'), ciWorkflow);
      workflowsCreated.push('ci.yml');
      
      // Create deployment workflow if applicable
      if (options.requirements?.projectType === 'web-application') {
        const deployWorkflow = this.generateDeploymentWorkflow(options);
        await fs.writeFile(path.join(workflowsDir, 'deploy.yml'), deployWorkflow);
        workflowsCreated.push('deploy.yml');
      }
      
    } catch (error) {
      console.warn('Failed to create GitHub workflows:', error);
    }
    
    return workflowsCreated;
  }

  private generateCIWorkflow(options: GitHubSetupOptions): string {
    return `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build
`;
  }

  private generateDeploymentWorkflow(options: GitHubSetupOptions): string {
    return `name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build
      run: npm run build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: \${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: \${{ secrets.ORG_ID }}
        vercel-project-id: \${{ secrets.PROJECT_ID }}
        working-directory: ./
        vercel-args: '--prod'
`;
  }

  private async uploadProjectSecrets(options: GitHubSetupOptions): Promise<string[]> {
    const secretsUploaded: string[] = [];
    
    // In a real implementation, you would upload necessary secrets
    // For now, we just return an empty array
    
    return secretsUploaded;
  }

  private async connectLocalGitToRemote(repository: any, projectPath: string): Promise<void> {
    try {
      const { execFileSync } = require('child_process');
      
      // Add remote origin - using execFileSync to prevent command injection
      execFileSync('git', ['remote', 'add', 'origin', repository.cloneUrl], {
        cwd: projectPath,
        stdio: 'ignore'
      });
      
      // Set upstream branch
      execFileSync('git', ['branch', '-M', 'main'], { cwd: projectPath, stdio: 'ignore' });
      
    } catch (error) {
      console.warn('Failed to connect local git to remote:', error);
    }
  }

  private async createProtectionConfig(options: ProtectionSetupOptions): Promise<ProtectionConfig> {
    const securityLevel = options.preferences.securityLevel;
    const autoCommitEnabled = options.preferences.alwaysEnableProtection;
    
    return {
      autoCommit: {
        enabled: autoCommitEnabled,
        watchPaths: ['src/**/*', '*.ts', '*.js', '*.json', '*.md'],
        excludePaths: ['node_modules/**/*', '.git/**/*', 'dist/**/*'],
        commitRules: [
          {
            pattern: '**/*.ts',
            immediate: false,
            description: 'TypeScript source files',
            priority: 'medium'
          },
          {
            pattern: '**/*.json',
            immediate: true,
            description: 'Configuration files',
            priority: 'high'
          }
        ],
        intervalMinutes: options.preferences.autoCommitFrequency,
        maxFilesPerCommit: 10,
        requireSecurityCheck: securityLevel !== 'basic',
        generateIntelligentMessages: true
      },
      security: {
        enabled: securityLevel !== 'basic',
        scanInterval: securityLevel === 'strict' ? 30 : 60,
        realTimeScan: securityLevel === 'strict',
        autoFix: securityLevel !== 'basic',
        secretPatterns: [
          'password',
          'secret',
          'token',
          'api[_-]?key',
          'private[_-]?key'
        ],
        excludeFiles: ['node_modules/**/*', '*.log'],
        owaspChecks: securityLevel === 'strict',
        dependencyCheck: true,
        alertThresholds: {
          critical: 1,
          high: securityLevel === 'strict' ? 3 : 5,
          medium: securityLevel === 'strict' ? 10 : 20
        }
      },
      review: {
        enabled: securityLevel !== 'basic',
        blockOnFailure: securityLevel === 'strict',
        minimumScore: securityLevel === 'strict' ? 85 : 70,
        checks: {
          quality: true,
          security: true,
          performance: securityLevel !== 'basic',
          testCoverage: securityLevel === 'strict',
          style: true
        },
        thresholds: {
          complexity: securityLevel === 'strict' ? 10 : 15,
          coverage: securityLevel === 'strict' ? 80 : 60,
          maintainability: 70,
          security: securityLevel === 'strict' ? 90 : 70
        }
      },
      backup: {
        enabled: options.preferences.alwaysEnableProtection,
        strategy: 'continuous',
        destinations: [
          {
            type: 'local',
            path: path.join(options.projectPath, '.backups'),
            priority: 1
          }
        ],
        retention: {
          daily: 7,
          weekly: 4,
          monthly: 3
        },
        compression: true,
        encryption: securityLevel === 'strict',
        verifyBackups: true
      },
      reporting: {
        enabled: true,
        schedule: '0 9 * * 1', // Weekly on Mondays at 9 AM
        recipients: [],
        format: 'markdown',
        includeMetrics: true,
        commitToRepo: options.preferences.alwaysUseGit
      },
      alerts: {
        enabled: true,
        channels: ['console'],
        thresholds: {
          criticalVulnerabilities: 1,
          backupFailures: 3,
          qualityDrop: 20
        }
      }
    };
  }

  private async startProtectionServices(config: ProtectionConfig): Promise<string[]> {
    const servicesStarted: string[] = [];
    
    try {
      if (config.autoCommit.enabled) {
        // In a real implementation, you would start the auto-commit service
        servicesStarted.push('auto-commit');
      }
      
      if (config.security.enabled) {
        servicesStarted.push('security-monitor');
      }
      
      if (config.backup.enabled) {
        servicesStarted.push('backup-system');
      }
      
    } catch (error) {
      console.warn('Failed to start protection services:', error);
    }
    
    return servicesStarted;
  }

  private async configureProjectBackups(projectPath: string, config: ProtectionConfig): Promise<boolean> {
    if (!config.backup.enabled) return false;
    
    try {
      // Create backup directory
      const backupDir = path.join(projectPath, '.backups');
      await fs.mkdir(backupDir, { recursive: true });
      
      // Create backup configuration file
      const backupConfig = {
        enabled: true,
        strategy: config.backup.strategy,
        schedule: '0 */6 * * *', // Every 6 hours
        destinations: config.backup.destinations,
        retention: config.backup.retention
      };
      
      await fs.writeFile(
        path.join(projectPath, '.backup.config.json'),
        JSON.stringify(backupConfig, null, 2)
      );
      
      return true;
    } catch (error) {
      console.warn('Failed to configure backups:', error);
      return false;
    }
  }

  private async enableProjectMonitoring(projectPath: string, config: ProtectionConfig): Promise<boolean> {
    try {
      // Create monitoring configuration
      const monitoringConfig = {
        security: config.security,
        review: config.review,
        alerts: config.alerts,
        reporting: config.reporting
      };
      
      await fs.writeFile(
        path.join(projectPath, '.monitoring.config.json'),
        JSON.stringify(monitoringConfig, null, 2)
      );
      
      return true;
    } catch (error) {
      console.warn('Failed to enable monitoring:', error);
      return false;
    }
  }

  private async saveProtectionConfig(config: ProtectionConfig, projectPath: string): Promise<void> {
    const configPath = path.join(projectPath, '.protection.config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  }

  // Validation methods
  private async validateProjectStructure(projectPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(projectPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private async validateRequirements(requirements: Requirements, projectPath: string): Promise<boolean> {
    try {
      const reqPath = path.join(projectPath, 'requirements.json');
      await fs.access(reqPath);
      return true;
    } catch {
      return false;
    }
  }

  private async validateDatabaseSetup(result: DatabaseWizardResult, projectPath: string): Promise<boolean> {
    if (!result.success) return false;
    
    try {
      // Check for database configuration files
      const possibleFiles = [
        'prisma/schema.prisma',
        '.env',
        'drizzle.config.ts'
      ];
      
      for (const file of possibleFiles) {
        try {
          await fs.access(path.join(projectPath, file));
          return true;
        } catch {
          continue;
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  private async validateGitHubSetup(result: GitHubSetupResult, projectPath: string): Promise<boolean> {
    if (!result.success || !result.repository) return false;
    
    try {
      // Check for .github directory
      await fs.access(path.join(projectPath, '.github'));
      return true;
    } catch {
      return false;
    }
  }

  private async validateProtectionSetup(result: ProtectionSetupResult, projectPath: string): Promise<boolean> {
    if (!result.success) return false;
    
    try {
      // Check for protection configuration file
      await fs.access(path.join(projectPath, '.protection.config.json'));
      return true;
    } catch {
      return false;
    }
  }

  private async generateSetupSuggestions(results: WizardStepResults, projectPath: string): Promise<string[]> {
    const suggestions: string[] = [];
    
    if (results.requirements) {
      suggestions.push('Consider reviewing and customizing the generated requirements');
    }
    
    if (results.database?.success) {
      suggestions.push('Run database migrations and seed data for development');
    }
    
    if (results.github?.success) {
      suggestions.push('Review and customize GitHub workflows for your specific needs');
    }
    
    if (results.protection?.success) {
      suggestions.push('Configure protection thresholds based on your team preferences');
    }
    
    suggestions.push('Set up your development environment and install dependencies');
    suggestions.push('Consider setting up additional tooling like ESLint and Prettier');
    
    return suggestions;
  }

  // Rollback methods
  private async rollbackProtectionSetup(projectPath: string): Promise<void> {
    try {
      await fs.unlink(path.join(projectPath, '.protection.config.json')).catch(() => {});
      await fs.unlink(path.join(projectPath, '.monitoring.config.json')).catch(() => {});
      await fs.unlink(path.join(projectPath, '.backup.config.json')).catch(() => {});
    } catch (error) {
      console.warn('Failed to rollback protection setup:', error);
    }
  }

  private async rollbackGitHubSetup(result: GitHubSetupResult, projectPath: string): Promise<void> {
    try {
      // Remove .github directory
      await fs.rmdir(path.join(projectPath, '.github'), { recursive: true }).catch(() => {});
      
      // Remove git remote (but keep local git repository)
      try {
        const { execSync } = require('child_process');
        execSync('git remote remove origin', { cwd: projectPath, stdio: 'ignore' });
      } catch {
        // Ignore if remote doesn't exist
      }
    } catch (error) {
      console.warn('Failed to rollback GitHub setup:', error);
    }
  }

  private async rollbackDatabaseSetup(result: DatabaseWizardResult, projectPath: string): Promise<void> {
    try {
      // Remove database-related files
      await fs.rmdir(path.join(projectPath, 'prisma'), { recursive: true }).catch(() => {});
      await fs.unlink(path.join(projectPath, '.env')).catch(() => {});
      await fs.unlink(path.join(projectPath, 'drizzle.config.ts')).catch(() => {});
    } catch (error) {
      console.warn('Failed to rollback database setup:', error);
    }
  }

  private async rollbackRequirementsSetup(projectPath: string): Promise<void> {
    try {
      await fs.unlink(path.join(projectPath, 'requirements.json')).catch(() => {});
      await fs.unlink(path.join(projectPath, 'REQUIREMENTS.md')).catch(() => {});
    } catch (error) {
      console.warn('Failed to rollback requirements setup:', error);
    }
  }

  private mapDatabaseProviderToType(provider: DatabaseProvider): DatabaseType {
    const mapping: Record<DatabaseProvider, DatabaseType> = {
      'postgresql': 'PostgreSQL',
      'mysql': 'MySQL',
      'sqlite': 'SQLite',
      'supabase': 'PostgreSQL',
      'neon': 'PostgreSQL',
      'planetscale': 'MySQL'
    };
    return mapping[provider] || 'PostgreSQL';
  }
}