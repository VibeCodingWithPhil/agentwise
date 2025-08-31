import { jest } from '@jest/globals';
import { CreateProjectWizard } from '../src/wizard/CreateProjectWizard';
import { UnifiedProjectSetup } from '../src/wizard/UnifiedProjectSetup';
import { UserPreferences } from '../src/wizard/UserPreferences';
import { WizardUI } from '../src/wizard/WizardUI';
import { ProjectSummary } from '../src/wizard/ProjectSummary';
import {
  WizardOptions,
  WizardContext,
  WizardStep,
  WizardProgress,
  WizardError,
  ProjectTemplate,
  WizardStepResults,
  UnifiedWizardResult,
  UserPreferences as UserPreferencesType,
  SavedConfiguration,
  TechStackTemplate,
  ProjectCategory,
  WizardEvent,
  WizardEventType,
  ValidationResult,
  ValidationError,
  FlowExecution,
  SetupFlow,
  IntegrationStatus,
  SystemRequirements,
  WizardAnalytics,
  UsageStatistics,
  WizardConfigurationError,
  WizardExecutionError,
  WizardValidationError,
  WizardTimeoutError,
  ProjectTimeline,
  TimelinePhase,
  NextAction
} from '../src/wizard/types';

// Mock external dependencies
jest.mock('inquirer');
jest.mock('fs-extra');
jest.mock('chalk');
jest.mock('ora');

describe('Wizard System Tests', () => {
  let createProjectWizard: CreateProjectWizard;
  let unifiedProjectSetup: UnifiedProjectSetup;
  let userPreferences: UserPreferences;
  let wizardUI: WizardUI;
  let projectSummary: ProjectSummary;

  const mockUserPreferences: UserPreferencesType = {
    preferredLanguages: ['typescript', 'javascript'],
    preferredFrameworks: ['react', 'express'],
    defaultProjectType: 'web-application',
    alwaysUseGit: true,
    preferPrivateRepos: false,
    preferredDatabase: 'postgresql',
    alwaysSetupDatabase: true,
    preferLocalDatabase: false,
    alwaysEnableProtection: true,
    autoCommitFrequency: 5,
    securityLevel: 'standard',
    useColorOutput: true,
    showProgressBars: true,
    verboseOutput: false,
    confirmDestructiveActions: true,
    savedConfigurations: [],
    skipRequirementsGeneration: false,
    skipDatabaseSetup: false,
    skipGitHubSetup: false,
    skipProtectionSetup: false,
    metadata: {
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      totalWizardRuns: 5,
      successfulRuns: 4
    }
  };

  const mockWizardOptions: WizardOptions = {
    projectName: 'test-project',
    projectPath: '/tmp/test-project',
    template: 'web-app-template',
    interactive: true,
    skipSteps: [],
    overridePreferences: {},
    dryRun: false,
    verbose: false,
    autoConfirm: false,
    continueOnError: false,
    maxRetries: 3,
    timeout: 30
  };

  const mockProjectTemplate: ProjectTemplate = {
    name: 'Full Stack Web App',
    description: 'A complete full-stack web application with React frontend and Express backend',
    category: 'full-stack',
    techStack: {
      frontend: {
        framework: 'react',
        version: '18.x',
        packages: ['react-router-dom', 'axios', 'styled-components']
      },
      backend: {
        framework: 'express',
        runtime: 'node',
        packages: ['express', 'cors', 'helmet', 'morgan']
      },
      database: {
        type: 'postgresql',
        orm: 'prisma'
      },
      tools: ['typescript', 'eslint', 'prettier', 'jest']
    },
    features: ['authentication', 'api', 'database', 'testing'],
    requirements: {
      name: 'Full Stack App',
      description: 'Web application with modern stack',
      type: 'web-application',
      features: [],
      techStack: {} as any,
      timeline: {
        total: 30,
        phases: []
      },
      complexity: 'moderate',
      priority: 'high'
    },
    databaseConfig: {
      required: true,
      provider: 'postgresql',
      setupType: 'local',
      generateTypes: true,
      seedData: true
    },
    githubConfig: {
      required: true,
      private: false,
      enableProtection: true,
      setupWorkflows: true,
      addReadme: true
    },
    protectionConfig: {
      required: true,
      autoCommit: true,
      securityMonitoring: true,
      backups: true,
      reporting: true
    },
    estimatedTime: 30,
    complexity: 'moderate',
    tags: ['web', 'full-stack', 'modern']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    userPreferences = new UserPreferences();
    wizardUI = new WizardUI(mockUserPreferences);
    projectSummary = new ProjectSummary();
    createProjectWizard = new CreateProjectWizard(userPreferences, wizardUI);
    unifiedProjectSetup = new UnifiedProjectSetup();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CreateProjectWizard', () => {
    describe('Wizard Initialization', () => {
      it('should initialize wizard with default options', async () => {
        const wizard = await createProjectWizard.initialize(mockWizardOptions);

        expect(wizard.context.options).toEqual(mockWizardOptions);
        expect(wizard.context.preferences).toBeDefined();
        expect(wizard.context.progress.currentStep).toBe(0);
        expect(wizard.context.progress.totalSteps).toBeGreaterThan(0);
        expect(wizard.context.startTime).toBeInstanceOf(Date);
      });

      it('should validate wizard options', async () => {
        const invalidOptions: WizardOptions = {
          ...mockWizardOptions,
          projectName: '', // Invalid empty name
          timeout: -1 // Invalid negative timeout
        };

        await expect(createProjectWizard.initialize(invalidOptions))
          .rejects.toThrow(WizardValidationError);
      });

      it('should load user preferences', async () => {
        // Mock preferences file
        const mockFs = {
          pathExists: jest.fn().mockResolvedValue(true),
          readJson: jest.fn().mockResolvedValue(mockUserPreferences)
        };
        Object.assign(require('fs-extra'), mockFs);

        const wizard = await createProjectWizard.initialize(mockWizardOptions);

        expect(wizard.context.preferences.preferredLanguages).toContain('typescript');
        expect(wizard.context.preferences.preferredFrameworks).toContain('react');
      });
    });

    describe('Step Execution', () => {
      let mockContext: WizardContext;

      beforeEach(() => {
        mockContext = {
          options: mockWizardOptions,
          preferences: mockUserPreferences,
          progress: {
            currentStep: 0,
            totalSteps: 6,
            completedSteps: 0,
            skippedSteps: 0,
            overallProgress: 0,
            estimatedTimeRemaining: 30,
            startTime: new Date(),
            errors: []
          },
          currentStep: {
            id: 'initialization',
            name: 'Project Initialization',
            description: 'Setting up project structure',
            required: true,
            completed: false,
            skipped: false,
            order: 0,
            estimatedTime: 5,
            dependencies: []
          },
          results: {},
          errors: [],
          warnings: [],
          startTime: new Date(),
          workingDirectory: '/tmp/test-project',
          tempFiles: []
        };
      });

      it('should execute requirements generation step', async () => {
        const mockRequirementsGenerator = {
          generateRequirements: jest.fn().mockResolvedValue({
            name: 'Test Project',
            description: 'A test project',
            type: 'web-application',
            features: ['auth', 'api'],
            techStack: mockProjectTemplate.techStack,
            timeline: { total: 30, phases: [] },
            complexity: 'moderate',
            priority: 'high'
          })
        };

        createProjectWizard.requirementsGenerator = mockRequirementsGenerator;

        const result = await createProjectWizard.executeStep('requirements', mockContext);

        expect(result.success).toBe(true);
        expect(result.data.name).toBe('Test Project');
        expect(mockRequirementsGenerator.generateRequirements).toHaveBeenCalled();
      });

      it('should execute database setup step', async () => {
        const mockDatabaseWizard = {
          runWizard: jest.fn().mockResolvedValue({
            success: true,
            provider: 'postgresql',
            credentials: {
              provider: 'postgresql',
              host: 'localhost',
              port: 5432,
              database: 'test_db',
              username: 'test_user',
              password: 'test_password',
              createdAt: new Date(),
              lastUsed: new Date()
            },
            configFiles: ['prisma/schema.prisma', '.env'],
            mcpConfig: {
              mcpServers: {
                postgres: {
                  name: 'postgres',
                  command: 'npx',
                  args: ['@modelcontextprotocol/server-postgres']
                }
              }
            }
          })
        };

        createProjectWizard.databaseWizard = mockDatabaseWizard;

        const result = await createProjectWizard.executeStep('database', mockContext);

        expect(result.success).toBe(true);
        expect(result.data.provider).toBe('postgresql');
        expect(mockDatabaseWizard.runWizard).toHaveBeenCalled();
      });

      it('should execute GitHub setup step', async () => {
        const mockGitHubSetup = {
          setupRepository: jest.fn().mockResolvedValue({
            success: true,
            repository: {
              id: 123,
              name: 'test-project',
              fullName: 'user/test-project',
              htmlUrl: 'https://github.com/user/test-project',
              cloneUrl: 'https://github.com/user/test-project.git',
              sshUrl: 'git@github.com:user/test-project.git',
              defaultBranch: 'main',
              private: false,
              owner: { login: 'user', type: 'User' },
              permissions: { admin: true, push: true, pull: true }
            },
            cloneUrl: 'https://github.com/user/test-project.git',
            sshUrl: 'git@github.com:user/test-project.git',
            protectionEnabled: true,
            workflowsCreated: ['ci.yml', 'deploy.yml'],
            secretsUploaded: ['DATABASE_URL', 'API_KEY']
          })
        };

        createProjectWizard.githubSetup = mockGitHubSetup;

        const result = await createProjectWizard.executeStep('github', mockContext);

        expect(result.success).toBe(true);
        expect(result.data.repository.name).toBe('test-project');
        expect(result.data.workflowsCreated).toContain('ci.yml');
      });

      it('should execute protection setup step', async () => {
        const mockProtectionSetup = {
          setupProtection: jest.fn().mockResolvedValue({
            success: true,
            config: {
              autoCommit: {
                enabled: true,
                watchPaths: ['src/**/*.ts'],
                excludePaths: ['node_modules/**'],
                commitRules: [],
                intervalMinutes: 5,
                maxFilesPerCommit: 10,
                requireSecurityCheck: true,
                generateIntelligentMessages: true
              },
              security: {
                enabled: true,
                scanInterval: 300000,
                realTimeScan: true,
                autoFix: false,
                secretPatterns: [],
                excludeFiles: [],
                owaspChecks: true,
                dependencyCheck: true,
                alertThresholds: { critical: 1, high: 3, medium: 10 }
              },
              review: {
                enabled: true,
                blockOnFailure: true,
                minimumScore: 8.0,
                checks: {
                  quality: true,
                  security: true,
                  performance: true,
                  testCoverage: true,
                  style: true
                },
                thresholds: {
                  complexity: 10,
                  coverage: 80,
                  maintainability: 7.0,
                  security: 8.0
                }
              },
              backup: {
                enabled: true,
                strategy: 'continuous',
                destinations: [],
                retention: { daily: 7, weekly: 4, monthly: 12 },
                compression: true,
                encryption: true,
                verifyBackups: true
              },
              reporting: {
                enabled: true,
                schedule: '0 9 * * *',
                recipients: ['dev@example.com'],
                format: 'markdown',
                includeMetrics: true,
                commitToRepo: true
              },
              alerts: {
                enabled: true,
                channels: ['console', 'file'],
                thresholds: {
                  criticalVulnerabilities: 1,
                  backupFailures: 3,
                  qualityDrop: 2.0
                }
              }
            },
            servicesStarted: ['autoCommit', 'securityMonitor', 'backupSystem'],
            backupConfigured: true,
            monitoringEnabled: true
          })
        };

        createProjectWizard.protectionSetup = mockProtectionSetup;

        const result = await createProjectWizard.executeStep('protection', mockContext);

        expect(result.success).toBe(true);
        expect(result.data.servicesStarted).toContain('autoCommit');
        expect(result.data.backupConfigured).toBe(true);
      });
    });

    describe('Error Handling', () => {
      it('should handle step failures gracefully', async () => {
        const mockContext: WizardContext = {
          options: mockWizardOptions,
          preferences: mockUserPreferences,
          progress: {
            currentStep: 1,
            totalSteps: 6,
            completedSteps: 0,
            skippedSteps: 0,
            overallProgress: 0,
            estimatedTimeRemaining: 25,
            startTime: new Date(),
            errors: []
          },
          currentStep: {
            id: 'database',
            name: 'Database Setup',
            description: 'Setting up database connection',
            required: true,
            completed: false,
            skipped: false,
            order: 1,
            estimatedTime: 10,
            dependencies: []
          },
          results: {},
          errors: [],
          warnings: [],
          startTime: new Date(),
          workingDirectory: '/tmp/test-project',
          tempFiles: []
        };

        const mockDatabaseWizard = {
          runWizard: jest.fn().mockRejectedValue(new Error('Database connection failed'))
        };

        createProjectWizard.databaseWizard = mockDatabaseWizard;

        const result = await createProjectWizard.executeStep('database', mockContext);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Database connection failed');
        expect(mockContext.errors).toHaveLength(1);
        expect(mockContext.errors[0].type).toBe('error');
      });

      it('should implement retry logic for transient failures', async () => {
        let attemptCount = 0;
        const mockFailingStep = jest.fn().mockImplementation(() => {
          attemptCount++;
          if (attemptCount < 3) {
            throw new Error('Transient failure');
          }
          return { success: true, data: 'success' };
        });

        createProjectWizard.executeStepWithRetry = jest.fn().mockImplementation(async (stepId, context) => {
          return mockFailingStep();
        });

        const result = await createProjectWizard.executeStepWithRetry('test-step', {} as WizardContext);

        expect(result.success).toBe(true);
        expect(attemptCount).toBe(3);
      });

      it('should handle timeout errors', async () => {
        const timeoutOptions: WizardOptions = {
          ...mockWizardOptions,
          timeout: 0.1 // 0.1 minutes = 6 seconds
        };

        const mockSlowStep = jest.fn().mockImplementation(() => {
          return new Promise(resolve => setTimeout(() => resolve({ success: true }), 10000)); // 10 seconds
        });

        createProjectWizard.executeStep = mockSlowStep;

        await expect(createProjectWizard.run(timeoutOptions))
          .rejects.toThrow(WizardTimeoutError);
      });
    });

    describe('Template System', () => {
      it('should load and apply project templates', async () => {
        const mockFs = {
          readJson: jest.fn().mockResolvedValue(mockProjectTemplate)
        };
        Object.assign(require('fs-extra'), mockFs);

        const template = await createProjectWizard.loadTemplate('web-app-template');

        expect(template.name).toBe('Full Stack Web App');
        expect(template.category).toBe('full-stack');
        expect(template.techStack.frontend?.framework).toBe('react');
        expect(template.techStack.backend?.framework).toBe('express');
      });

      it('should validate template compatibility', async () => {
        const incompatibleTemplate: ProjectTemplate = {
          ...mockProjectTemplate,
          techStack: {
            frontend: {
              framework: 'angular', // Not in user preferences
              packages: []
            }
          }
        };

        const validation = await createProjectWizard.validateTemplate(incompatibleTemplate, mockUserPreferences);

        expect(validation.valid).toBe(false);
        expect(validation.warnings.some(w => w.message.includes('angular'))).toBe(true);
      });

      it('should customize templates based on user preferences', async () => {
        const customPreferences: UserPreferencesType = {
          ...mockUserPreferences,
          preferredFrameworks: ['vue', 'fastify'],
          preferredDatabase: 'mysql'
        };

        const customizedTemplate = await createProjectWizard.customizeTemplate(mockProjectTemplate, customPreferences);

        expect(customizedTemplate.techStack.frontend?.framework).toBe('vue');
        expect(customizedTemplate.techStack.backend?.framework).toBe('fastify');
        expect(customizedTemplate.techStack.database?.type).toBe('mysql');
      });
    });
  });

  describe('UnifiedProjectSetup', () => {
    describe('Complete Setup Flow', () => {
      it('should run complete setup flow successfully', async () => {
        const mockStepResults: WizardStepResults = {
          requirements: {
            name: 'Unified Test Project',
            description: 'Complete test project setup',
            type: 'web-application',
            features: ['auth', 'api', 'database'],
            techStack: mockProjectTemplate.techStack,
            timeline: { total: 30, phases: [] },
            complexity: 'moderate',
            priority: 'high'
          },
          database: {
            success: true,
            provider: 'postgresql',
            credentials: {
              provider: 'postgresql',
              host: 'localhost',
              port: 5432,
              database: 'test_db',
              username: 'test_user',
              createdAt: new Date(),
              lastUsed: new Date()
            },
            configFiles: ['schema.prisma'],
            mcpConfig: { mcpServers: {} }
          },
          github: {
            success: true,
            repository: {
              id: 123,
              name: 'test-project',
              fullName: 'user/test-project',
              htmlUrl: 'https://github.com/user/test-project',
              cloneUrl: 'https://github.com/user/test-project.git',
              sshUrl: 'git@github.com:user/test-project.git',
              defaultBranch: 'main',
              private: false,
              owner: { login: 'user', type: 'User' },
              permissions: { admin: true, push: true, pull: true }
            },
            protectionEnabled: true,
            workflowsCreated: ['ci.yml'],
            secretsUploaded: ['DATABASE_URL']
          },
          protection: {
            success: true,
            servicesStarted: ['autoCommit', 'securityMonitor'],
            backupConfigured: true,
            monitoringEnabled: true
          }
        };

        // Mock all components
        unifiedProjectSetup.requirementsGenerator = {
          generateRequirements: jest.fn().mockResolvedValue(mockStepResults.requirements)
        };
        unifiedProjectSetup.databaseWizard = {
          runWizard: jest.fn().mockResolvedValue(mockStepResults.database)
        };
        unifiedProjectSetup.githubSetup = {
          setupRepository: jest.fn().mockResolvedValue(mockStepResults.github)
        };
        unifiedProjectSetup.protectionSetup = {
          setupProtection: jest.fn().mockResolvedValue(mockStepResults.protection)
        };

        const result = await unifiedProjectSetup.runCompleteSetup(mockWizardOptions);

        expect(result.success).toBe(true);
        expect(result.requirements?.name).toBe('Unified Test Project');
        expect(result.database?.success).toBe(true);
        expect(result.github?.success).toBe(true);
        expect(result.protection?.success).toBe(true);
      });

      it('should handle partial failures and continue with remaining steps', async () => {
        // Mock database failure but other steps succeed
        unifiedProjectSetup.requirementsGenerator = {
          generateRequirements: jest.fn().mockResolvedValue(mockProjectTemplate.requirements)
        };
        unifiedProjectSetup.databaseWizard = {
          runWizard: jest.fn().mockRejectedValue(new Error('Database setup failed'))
        };
        unifiedProjectSetup.githubSetup = {
          setupRepository: jest.fn().mockResolvedValue({
            success: true,
            repository: {} as any,
            protectionEnabled: false,
            workflowsCreated: [],
            secretsUploaded: []
          })
        };
        unifiedProjectSetup.protectionSetup = {
          setupProtection: jest.fn().mockResolvedValue({
            success: true,
            servicesStarted: ['autoCommit'],
            backupConfigured: true,
            monitoringEnabled: true
          })
        };

        const result = await unifiedProjectSetup.runCompleteSetup({
          ...mockWizardOptions,
          continueOnError: true
        });

        expect(result.success).toBe(false); // Overall failure due to database
        expect(result.requirements).toBeDefined();
        expect(result.database).toBeUndefined();
        expect(result.github?.success).toBe(true);
        expect(result.protection?.success).toBe(true);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Rollback and Cleanup', () => {
      it('should rollback changes on critical failure', async () => {
        const mockFs = {
          remove: jest.fn(),
          pathExists: jest.fn().mockResolvedValue(true)
        };
        Object.assign(require('fs-extra'), mockFs);

        const mockExec = jest.fn().mockImplementation((cmd, callback) => {
          if (cmd.includes('git')) {
            callback(null, { stdout: '', stderr: '' });
          }
        });
        require('child_process').exec = mockExec;

        // Simulate critical failure during GitHub setup
        unifiedProjectSetup.githubSetup = {
          setupRepository: jest.fn().mockRejectedValue(new Error('Critical GitHub error'))
        };

        const result = await unifiedProjectSetup.runCompleteSetup({
          ...mockWizardOptions,
          continueOnError: false
        });

        expect(result.success).toBe(false);
        expect(result.rollbackInstructions).toBeDefined();
        expect(result.rollbackInstructions!.length).toBeGreaterThan(0);
      });

      it('should clean up temporary files', async () => {
        const tempFiles = ['/tmp/wizard_123.json', '/tmp/config_456.yaml'];
        
        const mockFs = {
          remove: jest.fn()
        };
        Object.assign(require('fs-extra'), mockFs);

        await unifiedProjectSetup.cleanup(tempFiles);

        expect(mockFs.remove).toHaveBeenCalledTimes(2);
        expect(mockFs.remove).toHaveBeenCalledWith('/tmp/wizard_123.json');
        expect(mockFs.remove).toHaveBeenCalledWith('/tmp/config_456.yaml');
      });
    });
  });

  describe('UserPreferences', () => {
    describe('Preferences Management', () => {
      it('should load preferences from file', async () => {
        const mockFs = {
          pathExists: jest.fn().mockResolvedValue(true),
          readJson: jest.fn().mockResolvedValue(mockUserPreferences)
        };
        Object.assign(require('fs-extra'), mockFs);

        const preferences = await userPreferences.load();

        expect(preferences.preferredLanguages).toContain('typescript');
        expect(preferences.preferredFrameworks).toContain('react');
        expect(preferences.metadata.totalWizardRuns).toBe(5);
      });

      it('should save preferences to file', async () => {
        const mockFs = {
          ensureDir: jest.fn(),
          writeJson: jest.fn()
        };
        Object.assign(require('fs-extra'), mockFs);

        await userPreferences.save(mockUserPreferences);

        expect(mockFs.writeJson).toHaveBeenCalledWith(
          expect.stringMatching(/preferences\.json$/),
          expect.objectContaining({
            preferredLanguages: mockUserPreferences.preferredLanguages,
            metadata: expect.objectContaining({
              updatedAt: expect.any(Date)
            })
          }),
          { spaces: 2 }
        );
      });

      it('should merge preferences with defaults', () => {
        const partialPreferences = {
          preferredLanguages: ['python'],
          alwaysUseGit: false
        };

        const mergedPreferences = userPreferences.mergeWithDefaults(partialPreferences);

        expect(mergedPreferences.preferredLanguages).toEqual(['python']);
        expect(mergedPreferences.alwaysUseGit).toBe(false);
        expect(mergedPreferences.preferredDatabase).toBe('postgresql'); // Default value
        expect(mergedPreferences.useColorOutput).toBe(true); // Default value
      });
    });

    describe('Saved Configurations', () => {
      it('should save project configuration', async () => {
        const projectConfig: SavedConfiguration = {
          id: 'config_001',
          name: 'My Web App Config',
          description: 'Standard full-stack web application setup',
          projectType: 'web-application',
          template: mockProjectTemplate,
          createdAt: new Date(),
          usageCount: 0,
          lastUsed: new Date()
        };

        await userPreferences.saveConfiguration(projectConfig);

        const preferences = userPreferences.getPreferences();
        expect(preferences.savedConfigurations).toContainEqual(projectConfig);
      });

      it('should load saved configurations', async () => {
        const mockPreferences = {
          ...mockUserPreferences,
          savedConfigurations: [
            {
              id: 'config_001',
              name: 'API Service',
              projectType: 'api-service',
              template: mockProjectTemplate,
              createdAt: new Date(),
              usageCount: 3,
              lastUsed: new Date()
            }
          ]
        };

        const mockFs = {
          pathExists: jest.fn().mockResolvedValue(true),
          readJson: jest.fn().mockResolvedValue(mockPreferences)
        };
        Object.assign(require('fs-extra'), mockFs);

        await userPreferences.load();
        const configurations = userPreferences.getSavedConfigurations();

        expect(configurations).toHaveLength(1);
        expect(configurations[0].name).toBe('API Service');
        expect(configurations[0].usageCount).toBe(3);
      });
    });

    describe('Usage Analytics', () => {
      it('should track wizard runs', () => {
        userPreferences.trackWizardRun(true); // Successful run

        const preferences = userPreferences.getPreferences();
        expect(preferences.metadata.totalWizardRuns).toBe(1);
        expect(preferences.metadata.successfulRuns).toBe(1);
      });

      it('should track configuration usage', () => {
        const configId = 'config_001';
        userPreferences.trackConfigurationUsage(configId);

        const configurations = userPreferences.getSavedConfigurations();
        const usedConfig = configurations.find(c => c.id === configId);
        
        if (usedConfig) {
          expect(usedConfig.usageCount).toBeGreaterThan(0);
          expect(usedConfig.lastUsed).toBeInstanceOf(Date);
        }
      });
    });
  });

  describe('WizardUI', () => {
    describe('Interactive Prompts', () => {
      it('should prompt for project name', async () => {
        const mockInquirer = {
          prompt: jest.fn().mockResolvedValue({ projectName: 'my-awesome-project' })
        };
        require('inquirer').prompt = mockInquirer.prompt;

        const projectName = await wizardUI.promptForProjectName();

        expect(projectName).toBe('my-awesome-project');
        expect(mockInquirer.prompt).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              type: 'input',
              name: 'projectName',
              message: expect.stringMatching(/project name/i)
            })
          ])
        );
      });

      it('should prompt for template selection', async () => {
        const templates = [mockProjectTemplate];
        
        const mockInquirer = {
          prompt: jest.fn().mockResolvedValue({ template: mockProjectTemplate.name })
        };
        require('inquirer').prompt = mockInquirer.prompt;

        const selectedTemplate = await wizardUI.promptForTemplate(templates);

        expect(selectedTemplate).toBe(mockProjectTemplate.name);
        expect(mockInquirer.prompt).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              type: 'list',
              name: 'template',
              choices: expect.arrayContaining([
                expect.objectContaining({
                  name: mockProjectTemplate.name,
                  value: mockProjectTemplate.name
                })
              ])
            })
          ])
        );
      });

      it('should confirm destructive actions', async () => {
        const mockInquirer = {
          prompt: jest.fn().mockResolvedValue({ confirm: true })
        };
        require('inquirer').prompt = mockInquirer.prompt;

        const confirmed = await wizardUI.confirmAction('Delete existing files?', true);

        expect(confirmed).toBe(true);
        expect(mockInquirer.prompt).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.objectContaining({
              type: 'confirm',
              name: 'confirm',
              message: 'Delete existing files?',
              default: true
            })
          ])
        );
      });
    });

    describe('Progress Display', () => {
      it('should display progress bar', async () => {
        const mockOra = {
          start: jest.fn().mockReturnThis(),
          succeed: jest.fn(),
          fail: jest.fn(),
          text: ''
        };
        require('ora').mockReturnValue(mockOra);

        const progress = wizardUI.createProgressBar('Setting up project');
        
        expect(mockOra.start).toHaveBeenCalled();
        
        progress.update('Installing dependencies');
        expect(mockOra.text).toBe('Installing dependencies');
        
        progress.succeed('Project setup complete');
        expect(mockOra.succeed).toHaveBeenCalledWith('Project setup complete');
      });

      it('should display step progress', () => {
        const mockProgress: WizardProgress = {
          currentStep: 2,
          totalSteps: 5,
          completedSteps: 1,
          skippedSteps: 0,
          overallProgress: 40,
          estimatedTimeRemaining: 15,
          startTime: new Date(),
          errors: []
        };

        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        wizardUI.displayProgress(mockProgress);

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringMatching(/Step 2 of 5.*40%/)
        );

        consoleSpy.mockRestore();
      });
    });

    describe('Error Display', () => {
      it('should display errors with colors', () => {
        const mockChalk = {
          red: jest.fn().mockReturnValue('red text'),
          yellow: jest.fn().mockReturnValue('yellow text'),
          bold: jest.fn().mockReturnValue('bold text')
        };
        require('chalk').red = mockChalk.red;
        require('chalk').yellow = mockChalk.yellow;
        require('chalk').bold = mockChalk.bold;

        const error: WizardError = {
          id: 'error_001',
          step: 'database',
          type: 'error',
          message: 'Connection failed',
          timestamp: new Date(),
          resolved: false
        };

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        wizardUI.displayError(error);

        expect(mockChalk.red).toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });
    });
  });

  describe('ProjectSummary', () => {
    describe('Summary Generation', () => {
      it('should generate project summary', async () => {
        const mockResults: WizardStepResults = {
          requirements: mockProjectTemplate.requirements,
          database: {
            success: true,
            provider: 'postgresql',
            credentials: {} as any,
            configFiles: ['schema.prisma'],
            mcpConfig: { mcpServers: {} }
          },
          github: {
            success: true,
            repository: {} as any,
            protectionEnabled: true,
            workflowsCreated: ['ci.yml'],
            secretsUploaded: ['DATABASE_URL']
          },
          protection: {
            success: true,
            servicesStarted: ['autoCommit'],
            backupConfigured: true,
            monitoringEnabled: true
          }
        };

        const summary = await projectSummary.generateSummary(mockResults);

        expect(summary.success).toBe(true);
        expect(summary.nextSteps).toHaveLength(3); // At least 3 next steps
        expect(summary.recommendations).toHaveLength(2); // At least 2 recommendations
        expect(summary.nextSteps[0]).toMatch(/install dependencies/i);
      });

      it('should generate markdown report', async () => {
        const mockResults: WizardStepResults = {
          requirements: mockProjectTemplate.requirements,
          database: {
            success: true,
            provider: 'postgresql',
            credentials: {} as any,
            configFiles: ['schema.prisma'],
            mcpConfig: { mcpServers: {} }
          }
        };

        const markdownReport = await projectSummary.generateMarkdownReport(mockResults);

        expect(markdownReport).toContain('# Project Setup Summary');
        expect(markdownReport).toContain('## Requirements');
        expect(markdownReport).toContain('## Database Setup');
        expect(markdownReport).toContain('- PostgreSQL configured');
      });

      it('should generate project timeline', async () => {
        const timeline = await projectSummary.generateTimeline(mockProjectTemplate.requirements);

        expect(timeline.totalDuration).toBe(30);
        expect(timeline.phases).toHaveLength(3); // Development phases
        expect(timeline.milestones).toHaveLength(2); // Key milestones
        expect(timeline.phases[0].name).toBe('Foundation');
        expect(timeline.phases[1].name).toBe('Development');
        expect(timeline.phases[2].name).toBe('Deployment');
      });
    });

    describe('Next Actions', () => {
      it('should prioritize next actions', () => {
        const actions: NextAction[] = [
          {
            id: 'action_1',
            priority: 'medium',
            type: 'development',
            title: 'Setup testing',
            description: 'Configure Jest testing framework',
            estimatedTime: 30,
            automated: false
          },
          {
            id: 'action_2',
            priority: 'urgent',
            type: 'security',
            title: 'Fix security issues',
            description: 'Address critical vulnerabilities',
            estimatedTime: 60,
            automated: false
          },
          {
            id: 'action_3',
            priority: 'low',
            type: 'documentation',
            title: 'Write documentation',
            description: 'Create API documentation',
            estimatedTime: 120,
            automated: false
          }
        ];

        const prioritized = projectSummary.prioritizeActions(actions);

        expect(prioritized[0].priority).toBe('urgent');
        expect(prioritized[1].priority).toBe('medium');
        expect(prioritized[2].priority).toBe('low');
      });
    });
  });

  describe('Integration and Flow Tests', () => {
    it('should handle system requirements check', async () => {
      const systemReqs: SystemRequirements = {
        node: {
          minimum: '16.0.0',
          recommended: '18.0.0'
        },
        git: {
          required: true,
          minimum: '2.20.0'
        },
        tools: [
          {
            name: 'npm',
            required: true,
            checkCommand: 'npm --version'
          }
        ],
        permissions: {
          fileSystem: true,
          network: true,
          git: true
        }
      };

      const mockExec = jest.fn().mockImplementation((cmd, callback) => {
        if (cmd.includes('node --version')) {
          callback(null, { stdout: 'v18.17.0' });
        } else if (cmd.includes('git --version')) {
          callback(null, { stdout: 'git version 2.40.0' });
        } else if (cmd.includes('npm --version')) {
          callback(null, { stdout: '9.6.4' });
        }
      });
      require('child_process').exec = mockExec;

      const checkResult = await createProjectWizard.checkSystemRequirements(systemReqs);

      expect(checkResult.valid).toBe(true);
      expect(checkResult.errors).toHaveLength(0);
    });

    it('should validate project path and permissions', async () => {
      const projectPath = '/tmp/test-project';

      const mockFs = {
        pathExists: jest.fn().mockResolvedValue(false),
        ensureDir: jest.fn(),
        access: jest.fn() // Should not throw for writable directory
      };
      Object.assign(require('fs-extra'), mockFs);

      const isValid = await createProjectWizard.validateProjectPath(projectPath);

      expect(isValid).toBe(true);
      expect(mockFs.ensureDir).toHaveBeenCalledWith(projectPath);
    });

    it('should handle integration status checks', async () => {
      const integrations: IntegrationStatus[] = [
        {
          name: 'github',
          status: 'configured',
          version: '2.40.0',
          lastChecked: new Date(),
          dependencies: [],
          requiredFor: ['repository-setup', 'ci-cd']
        },
        {
          name: 'database',
          status: 'available',
          lastChecked: new Date(),
          dependencies: ['postgresql'],
          requiredFor: ['data-persistence']
        }
      ];

      const statusCheck = await createProjectWizard.checkIntegrations(integrations);

      expect(statusCheck.every(s => s.status !== 'error')).toBe(true);
    });
  });

  describe('Performance and Scalability Tests', () => {
    it('should handle large template catalogs efficiently', async () => {
      const largeTemplateCatalog = Array.from({ length: 100 }, (_, i) => ({
        ...mockProjectTemplate,
        id: `template_${i}`,
        name: `Template ${i}`
      }));

      const startTime = Date.now();
      const filtered = await createProjectWizard.filterTemplates(largeTemplateCatalog, {
        category: 'web-application',
        complexity: 'moderate'
      });
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete in less than 1 second
      expect(filtered.length).toBeLessThan(largeTemplateCatalog.length);
    });

    it('should batch file operations efficiently', async () => {
      const largeFileList = Array.from({ length: 500 }, (_, i) => `file_${i}.ts`);

      const mockFs = {
        writeFile: jest.fn(),
        copy: jest.fn(),
        ensureDir: jest.fn()
      };
      Object.assign(require('fs-extra'), mockFs);

      const startTime = Date.now();
      await createProjectWizard.createProjectFiles(largeFileList);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(5000); // Should complete in less than 5 seconds
    });
  });

  describe('Error Types and Handling', () => {
    it('should throw WizardConfigurationError for invalid configuration', () => {
      expect(() => {
        throw new WizardConfigurationError('Invalid config', 'CONFIG_001', { field: 'timeout' });
      }).toThrow(WizardConfigurationError);
    });

    it('should throw WizardExecutionError for step failures', () => {
      const error = new WizardExecutionError('Step failed', 'database', 'EXEC_001', { code: 'ECONNREFUSED' });
      
      expect(error.name).toBe('WizardExecutionError');
      expect(error.step).toBe('database');
      expect(error.code).toBe('EXEC_001');
    });

    it('should throw WizardValidationError for validation failures', () => {
      const validationErrors: ValidationError[] = [
        {
          field: 'projectName',
          message: 'Project name is required',
          code: 'REQUIRED',
          severity: 'error',
          fixable: true,
          fix: 'Provide a valid project name'
        }
      ];

      const error = new WizardValidationError('Validation failed', validationErrors);
      
      expect(error.name).toBe('WizardValidationError');
      expect(error.validationErrors).toHaveLength(1);
    });

    it('should throw WizardTimeoutError for timeout scenarios', () => {
      const error = new WizardTimeoutError('Operation timed out', 'database', 30);
      
      expect(error.name).toBe('WizardTimeoutError');
      expect(error.step).toBe('database');
      expect(error.timeout).toBe(30);
    });
  });
});