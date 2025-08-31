/**
 * Create Project Wizard - Main Orchestrator
 * 
 * The main wizard orchestrator that guides users through complete project setup,
 * integrating requirements generation, database setup, GitHub setup, and protection
 * systems into one seamless experience.
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { EventEmitter } from 'events';
import {
  WizardOptions,
  WizardContext,
  WizardStep,
  WizardProgress,
  WizardError,
  WizardStepResults,
  UnifiedWizardResult,
  WizardEvent,
  WizardEventType,
  UserPreferences,
  ProjectTemplate,
  SavedConfiguration,
  ValidationResult,
  WizardExecutionError,
  WizardValidationError,
  WizardTimeoutError,
  WIZARD_STEPS,
  DEFAULT_WIZARD_TIMEOUT,
  DEFAULT_MAX_RETRIES
} from './types';
import { WizardUI, themes } from './WizardUI';
import { UserPreferencesManager } from './UserPreferences';
import { UnifiedProjectSetup } from './UnifiedProjectSetup';
import { ProjectSummaryGenerator } from './ProjectSummary';

export class CreateProjectWizard extends EventEmitter {
  private ui: WizardUI;
  private preferencesManager: UserPreferencesManager;
  private projectSetup: UnifiedProjectSetup;
  private summaryGenerator: ProjectSummaryGenerator;
  private context: WizardContext | null = null;
  private sessionId: string;
  private startTime: Date;
  private abortController: AbortController;

  constructor() {
    super();
    
    this.sessionId = this.generateSessionId();
    this.startTime = new Date();
    this.abortController = new AbortController();
    
    // Initialize components
    this.ui = new WizardUI('default', true);
    this.preferencesManager = new UserPreferencesManager();
    this.projectSetup = new UnifiedProjectSetup();
    this.summaryGenerator = new ProjectSummaryGenerator();
    
    // Setup error handling
    this.setupErrorHandlers();
  }

  /**
   * Run the complete project creation wizard
   */
  async run(options: WizardOptions): Promise<UnifiedWizardResult> {
    try {
      // Initialize wizard context
      await this.initializeContext(options);
      
      // Show welcome banner
      this.showWelcomeBanner();
      
      // Validate prerequisites
      await this.validatePrerequisites();
      
      // Load and apply user preferences
      await this.loadUserPreferences();
      
      // Show project setup overview
      await this.showSetupOverview();
      
      // Execute wizard steps
      const result = await this.executeSteps();
      
      // Generate project summary
      await this.generateProjectSummary(result);
      
      // Update user preferences and statistics
      await this.updateUserStatistics(true);
      
      // Show completion message
      this.showCompletionMessage(result);
      
      return result;
      
    } catch (error) {
      await this.handleError(error);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Initialize wizard context
   */
  private async initializeContext(options: WizardOptions): Promise<void> {
    this.emit('wizard_started', { options });
    
    // Validate options
    const validation = this.validateOptions(options);
    if (!validation.valid) {
      throw new WizardValidationError('Invalid wizard options', validation.errors);
    }
    
    // Load preferences and apply to options
    const preferences = await this.preferencesManager.loadPreferences();
    const enhancedOptions = await this.preferencesManager.applyPreferencesToOptions(options);
    
    // Create steps based on options
    const steps = this.createSteps(enhancedOptions);
    
    this.context = {
      options: enhancedOptions,
      preferences,
      progress: {
        currentStep: 0,
        totalSteps: steps.length,
        completedSteps: 0,
        skippedSteps: 0,
        overallProgress: 0,
        estimatedTimeRemaining: this.calculateTotalTime(steps),
        startTime: this.startTime,
        errors: []
      },
      currentStep: steps[0],
      results: {},
      errors: [],
      warnings: [],
      startTime: this.startTime,
      workingDirectory: path.resolve(enhancedOptions.projectPath),
      tempFiles: []
    };
    
    // Update UI theme based on preferences
    if (preferences.useColorOutput) {
      this.ui = new WizardUI(this.getThemeFromPreferences(preferences), true);
    }
  }

  /**
   * Show welcome banner
   */
  private showWelcomeBanner(): void {
    this.ui.clear();
    
    const banner = this.ui.banner(
      '🎯 Agentwise Project Wizard',
      'Create amazing projects with AI-powered assistance'
    );
    
    console.log(banner);
    
    const introText = [
      'This wizard will guide you through creating a complete project setup including:',
      '',
      '• 📝 Intelligent requirements generation',
      '• 🗄️  Database setup and configuration',
      '• 🐙 GitHub repository and workflows',
      '• 🛡️  Security and protection systems',
      '• 📊 Progress tracking and reporting',
      '',
      'Let\'s build something amazing together! 🚀'
    ].join('\n');
    
    console.log(this.ui.box(introText, 'Getting Started', 2));
  }

  /**
   * Validate system prerequisites
   */
  private async validatePrerequisites(): Promise<void> {
    if (!this.context) throw new Error('Context not initialized');
    
    this.ui.showInfo('Checking system prerequisites...');
    
    const checks = [
      {
        name: 'Node.js',
        check: async () => {
          try {
            const { execSync } = require('child_process');
            const version = execSync('node --version', { encoding: 'utf8' }).trim();
            const major = parseInt(version.slice(1).split('.')[0]);
            return { success: major >= 16, version };
          } catch {
            return { success: false, version: 'not found' };
          }
        },
        required: true
      },
      {
        name: 'Git',
        check: async () => {
          try {
            const { execSync } = require('child_process');
            const version = execSync('git --version', { encoding: 'utf8' }).trim();
            return { success: true, version };
          } catch {
            return { success: false, version: 'not found' };
          }
        },
        required: this.context.preferences.alwaysUseGit
      },
      {
        name: 'npm/yarn',
        check: async () => {
          try {
            const { execSync } = require('child_process');
            try {
              const version = execSync('npm --version', { encoding: 'utf8' }).trim();
              return { success: true, version: `npm ${version}` };
            } catch {
              const version = execSync('yarn --version', { encoding: 'utf8' }).trim();
              return { success: true, version: `yarn ${version}` };
            }
          } catch {
            return { success: false, version: 'not found' };
          }
        },
        required: true
      }
    ];
    
    const results = [];
    for (const check of checks) {
      const result = await check.check();
      results.push({
        label: check.name,
        value: result.version,
        status: result.success ? 'success' as const : 'error' as const
      });
      
      if (check.required && !result.success) {
        throw new WizardExecutionError(
          `Missing required dependency: ${check.name}`,
          'prerequisites',
          'MISSING_DEPENDENCY',
          { check: check.name, version: result.version }
        );
      }
    }
    
    this.ui.showSummary('System Prerequisites', results);
  }

  /**
   * Load and apply user preferences
   */
  private async loadUserPreferences(): Promise<void> {
    if (!this.context) throw new Error('Context not initialized');
    
    try {
      // Auto-detect preferences based on project directory
      const autoDetected = await this.preferencesManager.autoDetectPreferences(
        this.context.workingDirectory
      );
      
      if (Object.keys(autoDetected).length > 0) {
        this.ui.showInfo('Auto-detected project preferences');
        
        const detectedItems = Object.entries(autoDetected).map(([key, value]) => ({
          label: this.formatPreferenceKey(key),
          value: Array.isArray(value) ? value.join(', ') : String(value),
          status: 'success' as const
        }));
        
        this.ui.showSummary('Detected Preferences', detectedItems);
        
        // Ask user if they want to apply auto-detected preferences
        if (this.context.options.interactive) {
          const apply = await this.ui.prompt({
            type: 'confirm',
            message: 'Apply auto-detected preferences?',
            default: true,
            theme: this.ui.getTheme()
          });
          
          if (apply) {
            await this.preferencesManager.updatePreferences(autoDetected);
            this.context.preferences = await this.preferencesManager.loadPreferences();
          }
        }
      }
    } catch (error) {
      this.ui.showWarning(`Failed to auto-detect preferences: ${error}`);
    }
  }

  /**
   * Show setup overview and get user confirmation
   */
  private async showSetupOverview(): Promise<void> {
    if (!this.context) throw new Error('Context not initialized');
    
    const overview = [
      `Project Name: ${this.ui.bold(this.context.options.projectName)}`,
      `Project Path: ${this.ui.dim(this.context.workingDirectory)}`,
      `Estimated Time: ${this.ui.info(this.context.progress.estimatedTimeRemaining + ' minutes')}`,
      '',
      'Setup Steps:',
      ...this.getStepsOverview().map(step => `  ${step}`)
    ].join('\n');
    
    console.log(this.ui.box(overview, 'Project Setup Overview', 2));
    
    if (this.context.options.interactive && !this.context.options.autoConfirm) {
      const proceed = await this.ui.prompt({
        type: 'confirm',
        message: 'Proceed with project setup?',
        default: true,
        theme: this.ui.getTheme()
      });
      
      if (!proceed) {
        throw new WizardExecutionError('User cancelled setup', 'overview', 'USER_CANCELLED');
      }
    }
  }

  /**
   * Execute all wizard steps
   */
  private async executeSteps(): Promise<UnifiedWizardResult> {
    if (!this.context) throw new Error('Context not initialized');
    
    const steps = this.createSteps(this.context.options);
    const results: UnifiedWizardResult = {
      success: false,
      sessionId: this.sessionId,
      projectName: this.context.options.projectName,
      projectPath: this.context.workingDirectory,
      template: this.context.options.template,
      generatedFiles: [],
      configurationFiles: [],
      documentationFiles: [],
      summary: {
        success: false,
        nextSteps: [],
        recommendations: []
      },
      nextSteps: [],
      recommendations: [],
      duration: 0,
      stepResults: new Map(),
      errors: [],
      warnings: this.context.warnings,
      analytics: {
        sessionId: this.sessionId,
        startTime: this.startTime,
        projectType: this.context.options.projectName,
        template: this.context.options.template,
        stepsCompleted: [],
        stepsSkipped: this.context.options.skipSteps,
        errorsEncountered: [],
        userChoices: {},
        performance: {
          totalTime: 0,
          stepTimes: {},
          memoryUsage: process.memoryUsage().heapUsed,
          networkRequests: 0
        },
        outcome: 'failed'
      },
      tempFiles: this.context.tempFiles
    };
    
    try {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Skip if in skip list
        if (this.context.options.skipSteps.includes(step.id)) {
          await this.skipStep(step);
          continue;
        }
        
        // Update current step
        this.context.currentStep = step;
        this.context.progress.currentStep = i;
        
        // Execute step with timeout
        await this.executeStepWithTimeout(step, results);
        
        // Update progress
        this.context.progress.completedSteps++;
        this.context.progress.overallProgress = 
          Math.round((this.context.progress.completedSteps / steps.length) * 100);
        
        // Update estimated time remaining
        this.updateEstimatedTimeRemaining(steps, i + 1);
        
        // Show progress
        this.ui.showProgress(this.context.progress);
      }
      
      results.success = true;
      results.analytics.outcome = 'completed';
      results.duration = Date.now() - this.startTime.getTime();
      
      return results;
      
    } catch (error) {
      results.errors.push({
        id: Date.now().toString(),
        step: this.context.currentStep?.id || 'unknown',
        type: 'error',
        message: error instanceof Error ? error.message : String(error),
        details: error,
        timestamp: new Date(),
        resolved: false
      });
      
      results.analytics.errorsEncountered = results.errors;
      throw error;
    }
  }

  /**
   * Execute a single step with timeout
   */
  private async executeStepWithTimeout(step: WizardStep, results: UnifiedWizardResult): Promise<void> {
    if (!this.context) throw new Error('Context not initialized');
    
    const stepStartTime = Date.now();
    this.emit('step_started', { step, context: this.context });
    
    this.ui.showStep(step, this.context.progress);
    
    try {
      // Create timeout promise
      const timeoutMs = (this.context.options.timeout || DEFAULT_WIZARD_TIMEOUT) * 60 * 1000;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new WizardTimeoutError(`Step ${step.name} timed out`, step.id, timeoutMs));
        }, timeoutMs);
      });
      
      // Execute step
      let stepResult: any;
      
      switch (step.id) {
        case WIZARD_STEPS.INITIALIZATION:
          stepResult = await this.executeInitializationStep();
          break;
        case WIZARD_STEPS.REQUIREMENTS:
          stepResult = await Promise.race([
            this.executeRequirementsStep(),
            timeoutPromise
          ]);
          this.context.results.requirements = stepResult;
          break;
        case WIZARD_STEPS.DATABASE:
          stepResult = await Promise.race([
            this.executeDatabaseStep(),
            timeoutPromise
          ]);
          this.context.results.database = stepResult;
          break;
        case WIZARD_STEPS.GITHUB:
          stepResult = await Promise.race([
            this.executeGitHubStep(),
            timeoutPromise
          ]);
          this.context.results.github = stepResult;
          break;
        case WIZARD_STEPS.PROTECTION:
          stepResult = await Promise.race([
            this.executeProtectionStep(),
            timeoutPromise
          ]);
          this.context.results.protection = stepResult;
          break;
        case WIZARD_STEPS.SUMMARY:
          stepResult = await this.executeSummaryStep();
          this.context.results.summary = stepResult;
          break;
        case WIZARD_STEPS.FINALIZATION:
          stepResult = await this.executeFinalizationStep();
          break;
        default:
          throw new WizardExecutionError(`Unknown step: ${step.id}`, step.id, 'UNKNOWN_STEP');
      }
      
      // Record step result and timing
      results.stepResults.set(step.id, stepResult);
      results.analytics.performance.stepTimes[step.id] = Date.now() - stepStartTime;
      results.analytics.stepsCompleted.push(step.id);
      
      step.completed = true;
      this.ui.showSuccess(`Completed: ${step.name}`);
      
      this.emit('step_completed', { step, result: stepResult, context: this.context });
      
    } catch (error) {
      step.completed = false;
      
      const wizardError: WizardError = {
        id: Date.now().toString(),
        step: step.id,
        type: error instanceof WizardTimeoutError ? 'critical' : 'error',
        message: error instanceof Error ? error.message : String(error),
        details: error,
        timestamp: new Date(),
        resolved: false
      };
      
      this.context.errors.push(wizardError);
      this.ui.showError(wizardError);
      
      this.emit('step_failed', { step, error: wizardError, context: this.context });
      
      // Ask user if they want to retry or continue
      if (this.context.options.interactive && !this.context.options.continueOnError) {
        const action = await this.ui.prompt({
          type: 'select',
          message: `Step "${step.name}" failed. What would you like to do?`,
          choices: [
            { name: 'Retry step', value: 'retry' },
            { name: 'Skip step and continue', value: 'skip' },
            { name: 'Abort wizard', value: 'abort' }
          ],
          theme: this.ui.getTheme()
        });
        
        switch (action) {
          case 'retry':
            // Retry the step (recursively)
            await this.executeStepWithTimeout(step, results);
            return;
          case 'skip':
            step.skipped = true;
            this.context.progress.skippedSteps++;
            return;
          case 'abort':
            throw error;
        }
      }
      
      if (!this.context.options.continueOnError) {
        throw error;
      }
      
      // Mark as skipped if continuing on error
      step.skipped = true;
      this.context.progress.skippedSteps++;
    }
  }

  /**
   * Execute initialization step
   */
  private async executeInitializationStep(): Promise<any> {
    if (!this.context) throw new Error('Context not initialized');
    
    // Create project directory if it doesn't exist
    try {
      await fs.mkdir(this.context.workingDirectory, { recursive: true });
    } catch (error) {
      throw new WizardExecutionError(
        `Failed to create project directory: ${error}`,
        WIZARD_STEPS.INITIALIZATION,
        'DIRECTORY_CREATION_FAILED'
      );
    }
    
    // Initialize git repository if needed
    if (this.context.preferences.alwaysUseGit) {
      try {
        const { execSync } = require('child_process');
        execSync('git init', { cwd: this.context.workingDirectory, stdio: 'ignore' });
        this.ui.showInfo('Initialized Git repository');
      } catch (error) {
        this.ui.showWarning(`Failed to initialize Git repository: ${error}`);
      }
    }
    
    return { directoryCreated: true, gitInitialized: this.context.preferences.alwaysUseGit };
  }

  /**
   * Execute requirements generation step
   */
  private async executeRequirementsStep(): Promise<any> {
    if (!this.context) throw new Error('Context not initialized');
    
    return await this.projectSetup.generateRequirements({
      projectName: this.context.options.projectName,
      projectPath: this.context.workingDirectory,
      preferences: this.context.preferences,
      template: this.context.options.template
    });
  }

  /**
   * Execute database setup step
   */
  private async executeDatabaseStep(): Promise<any> {
    if (!this.context) throw new Error('Context not initialized');
    
    // Skip if user doesn't want database
    if (!this.context.preferences.alwaysSetupDatabase) {
      if (this.context.options.interactive) {
        const setupDb = await this.ui.prompt({
          type: 'confirm',
          message: 'Set up database integration?',
          default: false,
          theme: this.ui.getTheme()
        });
        
        if (!setupDb) {
          return { skipped: true };
        }
      } else {
        return { skipped: true };
      }
    }
    
    return await this.projectSetup.setupDatabase({
      projectPath: this.context.workingDirectory,
      provider: this.context.preferences.preferredDatabase,
      preferences: this.context.preferences,
      requirements: this.context.results.requirements
    });
  }

  /**
   * Execute GitHub setup step
   */
  private async executeGitHubStep(): Promise<any> {
    if (!this.context) throw new Error('Context not initialized');
    
    // Skip if not using git
    if (!this.context.preferences.alwaysUseGit) {
      return { skipped: true };
    }
    
    if (this.context.options.interactive) {
      const setupGithub = await this.ui.prompt({
        type: 'confirm',
        message: 'Set up GitHub repository and workflows?',
        default: false,
        theme: this.ui.getTheme()
      });
      
      if (!setupGithub) {
        return { skipped: true };
      }
    }
    
    return await this.projectSetup.setupGitHub({
      projectName: this.context.options.projectName,
      projectPath: this.context.workingDirectory,
      preferences: this.context.preferences,
      requirements: this.context.results.requirements,
      database: this.context.results.database
    });
  }

  /**
   * Execute protection setup step
   */
  private async executeProtectionStep(): Promise<any> {
    if (!this.context) throw new Error('Context not initialized');
    
    // Skip if user doesn't want protection
    if (!this.context.preferences.alwaysEnableProtection) {
      if (this.context.options.interactive) {
        const setupProtection = await this.ui.prompt({
          type: 'confirm',
          message: 'Enable project protection and security monitoring?',
          default: this.context.preferences.securityLevel !== 'basic',
          theme: this.ui.getTheme()
        });
        
        if (!setupProtection) {
          return { skipped: true };
        }
      } else {
        return { skipped: true };
      }
    }
    
    return await this.projectSetup.setupProtection({
      projectPath: this.context.workingDirectory,
      preferences: this.context.preferences,
      requirements: this.context.results.requirements,
      github: this.context.results.github
    });
  }

  /**
   * Execute summary generation step
   */
  private async executeSummaryStep(): Promise<any> {
    if (!this.context) throw new Error('Context not initialized');
    
    return await this.summaryGenerator.generate({
      projectName: this.context.options.projectName,
      projectPath: this.context.workingDirectory,
      results: this.context.results,
      preferences: this.context.preferences,
      analytics: {
        sessionId: this.sessionId,
        startTime: this.startTime,
        duration: Date.now() - this.startTime.getTime()
      }
    });
  }

  /**
   * Execute finalization step
   */
  private async executeFinalizationStep(): Promise<any> {
    if (!this.context) throw new Error('Context not initialized');
    
    // Clean up temp files
    for (const tempFile of this.context.tempFiles) {
      try {
        await fs.unlink(tempFile);
      } catch {
        // Ignore errors when cleaning temp files
      }
    }
    
    // Final validations and cleanup
    return { cleanupCompleted: true, tempFilesRemoved: this.context.tempFiles.length };
  }

  /**
   * Skip a step
   */
  private async skipStep(step: WizardStep): Promise<void> {
    if (!this.context) throw new Error('Context not initialized');
    
    step.skipped = true;
    this.context.progress.skippedSteps++;
    
    this.ui.showWarning(`Skipped: ${step.name}`);
    this.emit('step_skipped', { step, context: this.context });
  }

  /**
   * Generate project summary
   */
  private async generateProjectSummary(result: UnifiedWizardResult): Promise<void> {
    if (!this.context || !this.context.results.summary) return;
    
    result.summary = this.context.results.summary;
    result.nextSteps = this.context.results.summary.nextSteps;
    result.recommendations = this.context.results.summary.recommendations;
  }

  /**
   * Update user statistics
   */
  private async updateUserStatistics(success: boolean): Promise<void> {
    try {
      await this.preferencesManager.updateStatistics(success);
    } catch (error) {
      this.ui.showWarning(`Failed to update user statistics: ${error}`);
    }
  }

  /**
   * Show completion message
   */
  private showCompletionMessage(result: UnifiedWizardResult): void {
    this.ui.clear();
    
    const duration = Math.round(result.duration / 1000 / 60);
    const banner = this.ui.banner(
      '🎉 Project Setup Complete!',
      `Created in ${duration} minutes`
    );
    
    console.log(banner);
    
    const summaryItems = [
      { label: 'Project Name', value: result.projectName, status: 'success' as const },
      { label: 'Project Path', value: result.projectPath },
      { label: 'Files Generated', value: result.generatedFiles.length.toString() },
      { label: 'Configurations Created', value: result.configurationFiles.length.toString() }
    ];
    
    if (result.requirements) {
      summaryItems.push({ label: 'Requirements', value: 'Generated', status: 'success' as const });
    }
    if (result.database?.success) {
      summaryItems.push({ label: 'Database', value: 'Configured', status: 'success' as const });
    }
    if (result.github?.success) {
      summaryItems.push({ label: 'GitHub', value: 'Repository Created', status: 'success' as const });
    }
    if (result.protection?.success) {
      summaryItems.push({ label: 'Protection', value: 'Enabled', status: 'success' as const });
    }
    
    this.ui.showSummary('Project Summary', summaryItems);
    
    if (result.nextSteps.length > 0) {
      const nextStepsText = result.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n');
      console.log('\n' + this.ui.box(nextStepsText, '🚀 Next Steps'));
    }
    
    if (result.recommendations.length > 0) {
      const recommendationsText = result.recommendations.map(rec => `• ${rec}`).join('\n');
      console.log('\n' + this.ui.box(recommendationsText, '💡 Recommendations'));
    }
  }

  /**
   * Handle errors
   */
  private async handleError(error: any): Promise<void> {
    this.emit('error_occurred', { error });
    
    if (this.context) {
      await this.updateUserStatistics(false);
    }
    
    this.ui.showError({
      id: Date.now().toString(),
      step: this.context?.currentStep?.id || 'unknown',
      type: 'critical',
      message: error instanceof Error ? error.message : String(error),
      details: error,
      timestamp: new Date(),
      resolved: false
    });
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    this.ui.cleanup();
    
    if (this.context) {
      // Clean up any remaining temp files
      for (const tempFile of this.context.tempFiles) {
        try {
          await fs.unlink(tempFile);
        } catch {
          // Ignore cleanup errors
        }
      }
    }
    
    this.emit('wizard_completed');
  }

  /**
   * Utility methods
   */
  private generateSessionId(): string {
    const crypto = require('crypto');
    const randomBytes = crypto.randomBytes(6).toString('hex');
    return `wizard_${Date.now()}_${randomBytes}`;
  }

  private validateOptions(options: WizardOptions): ValidationResult {
    const errors = [];
    
    if (!options.projectName || typeof options.projectName !== 'string') {
      errors.push({
        field: 'projectName',
        message: 'Project name is required and must be a string',
        code: 'REQUIRED',
        severity: 'error' as const,
        fixable: false
      });
    }
    
    if (!options.projectPath || typeof options.projectPath !== 'string') {
      errors.push({
        field: 'projectPath',
        message: 'Project path is required and must be a string',
        code: 'REQUIRED',
        severity: 'error' as const,
        fixable: false
      });
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings: [],
      suggestions: []
    };
  }

  private createSteps(options: WizardOptions): WizardStep[] {
    const allSteps = [
      {
        id: WIZARD_STEPS.INITIALIZATION,
        name: 'Initialize Project',
        description: 'Create project directory and basic structure',
        required: true,
        completed: false,
        skipped: false,
        order: 1,
        estimatedTime: 2,
        dependencies: [] as string[]
      },
      {
        id: WIZARD_STEPS.REQUIREMENTS,
        name: 'Generate Requirements',
        description: 'AI-powered requirements generation and analysis',
        required: false,
        completed: false,
        skipped: false,
        order: 2,
        estimatedTime: 10,
        dependencies: [WIZARD_STEPS.INITIALIZATION]
      },
      {
        id: WIZARD_STEPS.DATABASE,
        name: 'Setup Database',
        description: 'Configure database integration and generate types',
        required: false,
        completed: false,
        skipped: false,
        order: 3,
        estimatedTime: 8,
        dependencies: [WIZARD_STEPS.REQUIREMENTS]
      },
      {
        id: WIZARD_STEPS.GITHUB,
        name: 'Setup GitHub',
        description: 'Create repository, workflows, and branch protection',
        required: false,
        completed: false,
        skipped: false,
        order: 4,
        estimatedTime: 5,
        dependencies: [WIZARD_STEPS.INITIALIZATION]
      },
      {
        id: WIZARD_STEPS.PROTECTION,
        name: 'Enable Protection',
        description: 'Setup security monitoring and automated backups',
        required: false,
        completed: false,
        skipped: false,
        order: 5,
        estimatedTime: 7,
        dependencies: [WIZARD_STEPS.GITHUB]
      },
      {
        id: WIZARD_STEPS.SUMMARY,
        name: 'Generate Summary',
        description: 'Create project documentation and next steps',
        required: true,
        completed: false,
        skipped: false,
        order: 6,
        estimatedTime: 3,
        dependencies: [] as string[]
      },
      {
        id: WIZARD_STEPS.FINALIZATION,
        name: 'Finalize Setup',
        description: 'Complete setup and cleanup temporary files',
        required: true,
        completed: false,
        skipped: false,
        order: 7,
        estimatedTime: 1,
        dependencies: [WIZARD_STEPS.SUMMARY]
      }
    ];
    
    // Filter out skipped steps
    return allSteps.filter(step => !options.skipSteps.includes(step.id));
  }

  private calculateTotalTime(steps: WizardStep[]): number {
    return steps.reduce((total, step) => total + step.estimatedTime, 0);
  }

  private updateEstimatedTimeRemaining(steps: WizardStep[], currentIndex: number): void {
    if (!this.context) return;
    
    const remainingSteps = steps.slice(currentIndex);
    this.context.progress.estimatedTimeRemaining = this.calculateTotalTime(remainingSteps);
  }

  private getStepsOverview(): string[] {
    if (!this.context) return [];
    
    const steps = this.createSteps(this.context.options);
    return steps.map(step => {
      const icon = this.context!.options.skipSteps.includes(step.id) ? '⏭️' : '▶️';
      const time = this.ui.dim(`(${step.estimatedTime}min)`);
      return `${icon} ${step.name} ${time}`;
    });
  }

  private formatPreferenceKey(key: string): string {
    return key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^./, str => str.toUpperCase());
  }

  private getThemeFromPreferences(preferences: UserPreferences): string {
    // You could add theme preference to UserPreferences in the future
    return preferences.verboseOutput ? 'colorful' : 'default';
  }

  private setupErrorHandlers(): void {
    process.on('SIGINT', async () => {
      console.log('\n' + this.ui.warning('Wizard cancelled by user'));
      await this.cleanup();
      process.exit(1);
    });
    
    process.on('uncaughtException', async (error) => {
      console.error('\n' + this.ui.error('Uncaught exception:'), error);
      await this.cleanup();
      process.exit(1);
    });
  }
}