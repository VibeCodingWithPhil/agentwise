/**
 * User Preferences Manager
 * 
 * Manages user preferences, auto-detection, saved configurations,
 * and provides smart defaults for the unified project wizard.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  UserPreferences,
  SavedConfiguration,
  ProjectTemplate,
  WizardOptions,
  TechStackTemplate,
  DatabaseProvider,
  ProjectCategory,
  ValidationResult,
  ValidationError
} from './types';

export class UserPreferencesManager {
  private preferencesPath: string;
  private preferences: UserPreferences | null = null;
  private configDir: string;

  constructor(configDir?: string) {
    this.configDir = configDir || path.join(os.homedir(), '.agentwise');
    this.preferencesPath = path.join(this.configDir, 'wizard-preferences.json');
  }

  /**
   * Load user preferences from disk
   */
  async loadPreferences(): Promise<UserPreferences> {
    if (this.preferences) {
      return this.preferences;
    }

    try {
      await fs.access(this.preferencesPath);
      const content = await fs.readFile(this.preferencesPath, 'utf-8');
      const prefs = JSON.parse(content);
      
      // Migrate old preferences if needed
      this.preferences = this.migratePreferences(prefs);
      
      // Update metadata
      this.preferences.metadata.updatedAt = new Date();
      
      await this.savePreferences();
      return this.preferences;
    } catch (error) {
      // Create default preferences if file doesn't exist
      this.preferences = this.getDefaultPreferences();
      await this.savePreferences();
      return this.preferences;
    }
  }

  /**
   * Save preferences to disk
   */
  async savePreferences(): Promise<void> {
    if (!this.preferences) {
      throw new Error('No preferences to save');
    }

    try {
      await fs.mkdir(this.configDir, { recursive: true });
      
      this.preferences.metadata.updatedAt = new Date();
      
      const content = JSON.stringify(this.preferences, null, 2);
      await fs.writeFile(this.preferencesPath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save preferences: ${error}`);
    }
  }

  /**
   * Update specific preference values
   */
  async updatePreferences(updates: Partial<UserPreferences>): Promise<void> {
    const prefs = await this.loadPreferences();
    
    // Deep merge the updates
    this.preferences = {
      ...prefs,
      ...updates,
      metadata: {
        ...prefs.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    };

    await this.savePreferences();
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(): UserPreferences {
    return {
      // General preferences
      preferredLanguages: ['typescript', 'javascript'],
      preferredFrameworks: ['react', 'next.js', 'node.js'],
      defaultProjectType: 'web-application',
      alwaysUseGit: true,
      preferPrivateRepos: false,
      
      // Database preferences
      preferredDatabase: 'postgresql',
      alwaysSetupDatabase: false,
      preferLocalDatabase: false,
      
      // Protection preferences
      alwaysEnableProtection: false,
      autoCommitFrequency: 30,
      securityLevel: 'standard',
      
      // UI preferences
      useColorOutput: true,
      showProgressBars: true,
      verboseOutput: false,
      confirmDestructiveActions: true,
      
      // Saved configurations
      savedConfigurations: [],
      
      // Skip options
      skipRequirementsGeneration: false,
      skipDatabaseSetup: false,
      skipGitHubSetup: false,
      skipProtectionSetup: false,
      
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        totalWizardRuns: 0,
        successfulRuns: 0
      }
    };
  }

  /**
   * Migrate old preference format to current version
   */
  private migratePreferences(prefs: any): UserPreferences {
    const current = this.getDefaultPreferences();
    
    // Version-specific migrations
    if (!prefs.metadata || !prefs.metadata.version) {
      // Pre-versioned preferences, apply v1.0.0 migration
      return {
        ...current,
        ...prefs,
        metadata: {
          ...current.metadata,
          version: '1.0.0',
          createdAt: prefs.createdAt ? new Date(prefs.createdAt) : current.metadata.createdAt,
          updatedAt: new Date(),
          totalWizardRuns: prefs.totalWizardRuns || 0,
          successfulRuns: prefs.successfulRuns || 0
        }
      };
    }

    // Handle future migrations here
    return {
      ...current,
      ...prefs,
      metadata: {
        ...current.metadata,
        ...prefs.metadata,
        createdAt: new Date(prefs.metadata.createdAt),
        updatedAt: new Date(prefs.metadata.updatedAt)
      }
    };
  }

  /**
   * Auto-detect project preferences based on environment
   */
  async autoDetectPreferences(projectPath: string): Promise<Partial<UserPreferences>> {
    const detected: Partial<UserPreferences> = {};

    try {
      // Check for package.json and detect language/framework preferences
      const packageJsonPath = path.join(projectPath, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        
        // Detect languages
        if (packageJson.dependencies?.typescript || packageJson.devDependencies?.typescript) {
          detected.preferredLanguages = ['typescript', ...(detected.preferredLanguages || [])];
        }
        
        // Detect frameworks
        const frameworks = [];
        if (packageJson.dependencies?.react) frameworks.push('react');
        if (packageJson.dependencies?.['next']) frameworks.push('next.js');
        if (packageJson.dependencies?.express) frameworks.push('express');
        if (packageJson.dependencies?.vue) frameworks.push('vue');
        if (packageJson.dependencies?.angular) frameworks.push('angular');
        
        if (frameworks.length > 0) {
          detected.preferredFrameworks = frameworks;
        }

        // Detect database preferences
        if (packageJson.dependencies?.pg || packageJson.dependencies?.['@types/pg']) {
          detected.preferredDatabase = 'postgresql';
        } else if (packageJson.dependencies?.mysql2 || packageJson.dependencies?.mysql) {
          detected.preferredDatabase = 'mysql';
        } else if (packageJson.dependencies?.sqlite3) {
          detected.preferredDatabase = 'sqlite';
        } else if (packageJson.dependencies?.mongodb || packageJson.dependencies?.mongoose) {
          detected.preferredDatabase = 'mongodb' as DatabaseProvider;
        }
      } catch {
        // Package.json doesn't exist, continue
      }

      // Check for git repository
      try {
        await fs.access(path.join(projectPath, '.git'));
        detected.alwaysUseGit = true;
      } catch {
        // Not a git repository
      }

      // Check for database configuration files
      const dbFiles = [
        'supabase/config.toml',
        '.env',
        'docker-compose.yml',
        'prisma/schema.prisma',
        'drizzle.config.ts'
      ];

      for (const file of dbFiles) {
        try {
          await fs.access(path.join(projectPath, file));
          detected.alwaysSetupDatabase = true;
          break;
        } catch {
          // File doesn't exist
        }
      }

      // Check for existing protection/security configurations
      const securityFiles = [
        '.github/workflows',
        '.husky',
        '.pre-commit-config.yaml',
        'jest.config.js',
        'vitest.config.ts'
      ];

      for (const file of securityFiles) {
        try {
          await fs.access(path.join(projectPath, file));
          detected.alwaysEnableProtection = true;
          break;
        } catch {
          // File doesn't exist
        }
      }

    } catch (error) {
      console.warn(`Failed to auto-detect preferences: ${error}`);
    }

    return detected;
  }

  /**
   * Save a project configuration as a template
   */
  async saveConfiguration(config: SavedConfiguration): Promise<void> {
    const prefs = await this.loadPreferences();
    
    // Check if configuration with same name exists
    const existingIndex = prefs.savedConfigurations.findIndex(c => c.name === config.name);
    
    if (existingIndex >= 0) {
      prefs.savedConfigurations[existingIndex] = {
        ...config,
        usageCount: prefs.savedConfigurations[existingIndex].usageCount + 1,
        lastUsed: new Date()
      };
    } else {
      prefs.savedConfigurations.push({
        ...config,
        usageCount: 1,
        lastUsed: new Date()
      });
    }

    this.preferences = prefs;
    await this.savePreferences();
  }

  /**
   * Load a saved configuration
   */
  async loadConfiguration(name: string): Promise<SavedConfiguration | null> {
    const prefs = await this.loadPreferences();
    const config = prefs.savedConfigurations.find(c => c.name === name);
    
    if (config) {
      // Update usage statistics
      config.usageCount++;
      config.lastUsed = new Date();
      prefs.lastUsedConfiguration = name;
      
      this.preferences = prefs;
      await this.savePreferences();
    }
    
    return config || null;
  }

  /**
   * Delete a saved configuration
   */
  async deleteConfiguration(name: string): Promise<boolean> {
    const prefs = await this.loadPreferences();
    const index = prefs.savedConfigurations.findIndex(c => c.name === name);
    
    if (index >= 0) {
      prefs.savedConfigurations.splice(index, 1);
      
      if (prefs.lastUsedConfiguration === name) {
        prefs.lastUsedConfiguration = undefined;
      }
      
      this.preferences = prefs;
      await this.savePreferences();
      return true;
    }
    
    return false;
  }

  /**
   * Get all saved configurations, sorted by usage
   */
  async getSavedConfigurations(): Promise<SavedConfiguration[]> {
    const prefs = await this.loadPreferences();
    return prefs.savedConfigurations.sort((a, b) => {
      // Sort by last used, then by usage count
      if (a.lastUsed !== b.lastUsed) {
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      }
      return b.usageCount - a.usageCount;
    });
  }

  /**
   * Get project templates based on preferences and category
   */
  async getRecommendedTemplates(category?: ProjectCategory): Promise<ProjectTemplate[]> {
    const prefs = await this.loadPreferences();
    const templates = this.getBuiltInTemplates();
    
    let filtered = templates;
    if (category) {
      filtered = templates.filter(t => t.category === category);
    }
    
    // Score templates based on user preferences
    const scored = filtered.map(template => {
      let score = 0;
      
      // Check language preferences
      if (template.techStack.frontend?.framework && 
          prefs.preferredLanguages.includes(template.techStack.frontend.framework)) {
        score += 2;
      }
      
      if (template.techStack.backend?.framework && 
          prefs.preferredFrameworks.includes(template.techStack.backend.framework)) {
        score += 2;
      }
      
      // Check database preferences
      if (template.databaseConfig?.provider === prefs.preferredDatabase) {
        score += 1;
      }
      
      // Check complexity against user experience (inferred from successful runs)
      const userExperience = prefs.metadata.successfulRuns;
      if (userExperience < 5 && template.complexity === 'simple') {
        score += 1;
      } else if (userExperience >= 10 && template.complexity === 'complex') {
        score += 1;
      }
      
      return { template, score };
    });
    
    // Sort by score and return templates
    return scored
      .sort((a, b) => b.score - a.score)
      .map(s => s.template);
  }

  /**
   * Apply user preferences to wizard options
   */
  async applyPreferencesToOptions(options: WizardOptions): Promise<WizardOptions> {
    const prefs = await this.loadPreferences();
    
    return {
      ...options,
      // Override with preferences if not explicitly set
      interactive: options.interactive !== false ? !prefs.verboseOutput : options.interactive,
      verbose: options.verbose || prefs.verboseOutput,
      autoConfirm: options.autoConfirm || !prefs.confirmDestructiveActions,
      skipSteps: [
        ...options.skipSteps,
        ...(prefs.skipRequirementsGeneration ? ['requirements'] : []),
        ...(prefs.skipDatabaseSetup ? ['database'] : []),
        ...(prefs.skipGitHubSetup ? ['github'] : []),
        ...(prefs.skipProtectionSetup ? ['protection'] : [])
      ].filter((step, index, arr) => arr.indexOf(step) === index), // Remove duplicates
      overridePreferences: {
        ...prefs,
        ...options.overridePreferences
      }
    };
  }

  /**
   * Update wizard run statistics
   */
  async updateStatistics(success: boolean): Promise<void> {
    const prefs = await this.loadPreferences();
    
    prefs.metadata.totalWizardRuns++;
    if (success) {
      prefs.metadata.successfulRuns++;
    }
    prefs.metadata.updatedAt = new Date();
    
    this.preferences = prefs;
    await this.savePreferences();
  }

  /**
   * Validate preferences structure
   */
  validatePreferences(preferences: Partial<UserPreferences>): ValidationResult {
    const errors: ValidationError[] = [];
    
    // Validate required fields
    if (preferences.preferredLanguages && !Array.isArray(preferences.preferredLanguages)) {
      errors.push({
        field: 'preferredLanguages',
        message: 'Must be an array of strings',
        code: 'INVALID_TYPE',
        severity: 'error',
        fixable: true,
        fix: 'Set to default value: ["typescript", "javascript"]'
      });
    }
    
    if (preferences.securityLevel && 
        !['basic', 'standard', 'strict'].includes(preferences.securityLevel)) {
      errors.push({
        field: 'securityLevel',
        message: 'Must be one of: basic, standard, strict',
        code: 'INVALID_VALUE',
        severity: 'error',
        fixable: true,
        fix: 'Set to "standard"'
      });
    }
    
    if (preferences.autoCommitFrequency && 
        (typeof preferences.autoCommitFrequency !== 'number' || preferences.autoCommitFrequency < 1)) {
      errors.push({
        field: 'autoCommitFrequency',
        message: 'Must be a positive number',
        code: 'INVALID_VALUE',
        severity: 'error',
        fixable: true,
        fix: 'Set to 30'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
      suggestions: [
        'Consider enabling auto-protection for better project security',
        'Try different database providers to find your preference',
        'Enable verbose output for better debugging during setup'
      ]
    };
  }

  /**
   * Get built-in project templates
   */
  private getBuiltInTemplates(): ProjectTemplate[] {
    return [
      {
        name: 'Next.js Full-Stack App',
        description: 'Modern React application with TypeScript, database, and authentication',
        category: 'full-stack',
        techStack: {
          frontend: {
            framework: 'next.js',
            version: 'latest',
            packages: ['react', 'typescript', 'tailwindcss']
          },
          backend: {
            framework: 'next.js',
            runtime: 'node.js',
            packages: ['prisma', '@auth/prisma-adapter']
          },
          database: {
            type: 'postgresql',
            orm: 'prisma'
          },
          tools: ['eslint', 'prettier', 'husky']
        },
        features: ['authentication', 'database', 'api', 'responsive-ui'],
        requirements: {
          projectType: 'web-application',
          scope: 'standard',
          architecture: 'ssr'
        } as any,
        databaseConfig: {
          required: true,
          provider: 'postgresql',
          setupType: 'cloud',
          generateTypes: true,
          seedData: true
        },
        githubConfig: {
          required: false,
          private: false,
          enableProtection: true,
          setupWorkflows: true,
          addReadme: true
        },
        protectionConfig: {
          required: false,
          autoCommit: true,
          securityMonitoring: true,
          backups: false,
          reporting: false
        },
        estimatedTime: 45,
        complexity: 'moderate',
        tags: ['react', 'typescript', 'full-stack', 'popular']
      },
      {
        name: 'Express API Server',
        description: 'REST API server with TypeScript, database, and authentication',
        category: 'api-service',
        techStack: {
          backend: {
            framework: 'express',
            runtime: 'node.js',
            packages: ['typescript', 'cors', 'helmet', 'joi']
          },
          database: {
            type: 'postgresql',
            orm: 'prisma'
          },
          tools: ['jest', 'supertest', 'nodemon']
        },
        features: ['api', 'authentication', 'validation', 'security'],
        requirements: {
          projectType: 'api-service',
          scope: 'standard',
          architecture: 'layered'
        } as any,
        databaseConfig: {
          required: true,
          provider: 'postgresql',
          setupType: 'both',
          generateTypes: true,
          seedData: true
        },
        githubConfig: {
          required: false,
          private: false,
          enableProtection: true,
          setupWorkflows: true,
          addReadme: true
        },
        protectionConfig: {
          required: true,
          autoCommit: true,
          securityMonitoring: true,
          backups: false,
          reporting: false
        },
        estimatedTime: 30,
        complexity: 'simple',
        tags: ['api', 'typescript', 'backend', 'simple']
      },
      {
        name: 'React Frontend App',
        description: 'Modern React application with TypeScript and styling',
        category: 'frontend-only',
        techStack: {
          frontend: {
            framework: 'react',
            version: 'latest',
            packages: ['typescript', 'vite', 'tailwindcss', 'react-router-dom']
          },
          tools: ['eslint', 'prettier', 'vitest']
        },
        features: ['responsive-ui', 'routing', 'state-management'],
        requirements: {
          projectType: 'web-application',
          scope: 'minimal',
          architecture: 'spa'
        } as any,
        estimatedTime: 20,
        complexity: 'simple',
        tags: ['react', 'frontend', 'typescript', 'simple']
      },
      {
        name: 'CLI Tool',
        description: 'Command-line application with TypeScript and testing',
        category: 'cli-tool',
        techStack: {
          backend: {
            framework: 'commander.js',
            runtime: 'node.js',
            packages: ['typescript', 'inquirer', 'chalk', 'ora']
          },
          tools: ['jest', 'pkg']
        },
        features: ['cli-interface', 'configuration', 'help-system'],
        requirements: {
          projectType: 'cli-tool',
          scope: 'minimal',
          architecture: 'component-based'
        } as any,
        estimatedTime: 25,
        complexity: 'simple',
        tags: ['cli', 'typescript', 'tools', 'simple']
      }
    ];
  }

  /**
   * Export preferences to a file
   */
  async exportPreferences(filePath: string): Promise<void> {
    const prefs = await this.loadPreferences();
    const exportData = {
      version: prefs.metadata.version,
      exportedAt: new Date().toISOString(),
      preferences: prefs
    };
    
    await fs.writeFile(filePath, JSON.stringify(exportData, null, 2), 'utf-8');
  }

  /**
   * Import preferences from a file
   */
  async importPreferences(filePath: string, merge: boolean = true): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const importData = JSON.parse(content);
      
      if (!importData.preferences) {
        throw new Error('Invalid preferences file format');
      }
      
      const importedPrefs = importData.preferences;
      const validation = this.validatePreferences(importedPrefs);
      
      if (!validation.valid) {
        throw new Error(`Invalid preferences: ${validation.errors.map(e => e.message).join(', ')}`);
      }
      
      if (merge) {
        const currentPrefs = await this.loadPreferences();
        this.preferences = {
          ...currentPrefs,
          ...importedPrefs,
          metadata: {
            ...currentPrefs.metadata,
            updatedAt: new Date()
          }
        };
      } else {
        this.preferences = this.migratePreferences(importedPrefs);
      }
      
      await this.savePreferences();
    } catch (error) {
      throw new Error(`Failed to import preferences: ${error}`);
    }
  }

  /**
   * Reset preferences to defaults
   */
  async resetPreferences(): Promise<void> {
    const currentStats = this.preferences?.metadata || { totalWizardRuns: 0, successfulRuns: 0 };
    this.preferences = {
      ...this.getDefaultPreferences(),
      metadata: {
        ...this.getDefaultPreferences().metadata,
        totalWizardRuns: currentStats.totalWizardRuns || 0,
        successfulRuns: currentStats.successfulRuns || 0
      }
    };
    
    await this.savePreferences();
  }
}