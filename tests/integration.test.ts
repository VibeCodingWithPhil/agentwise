import { jest } from '@jest/globals';
import path from 'path';
import { CreateProjectWizard } from '../src/wizard/CreateProjectWizard';
import { UnifiedProjectSetup } from '../src/wizard/UnifiedProjectSetup';
import { GitHubIntegration } from '../src/github/GitHubIntegration';
import { DatabaseWizard } from '../src/database/DatabaseWizard';
import { RequirementsGenerator } from '../src/requirements/RequirementsGenerator';
import { AutoCommitManager } from '../src/protection/AutoCommitManager';
import { ContinuousSecurityMonitor } from '../src/protection/ContinuousSecurityMonitor';
import { ProtectionDashboard } from '../src/protection/ProtectionDashboard';
import {
  WizardOptions,
  UnifiedWizardResult,
  WizardStepResults,
  ProjectTemplate,
  UserPreferences
} from '../src/wizard/types';
import {
  Requirements,
  TechStack,
  Feature,
  ComplexityLevel,
  Priority
} from '../src/requirements/types';
import {
  DatabaseProvider,
  DatabaseCredentials,
  WizardResult as DatabaseWizardResult
} from '../src/database/types';
import {
  GitHubRepository,
  GitHubAuthConfig,
  GitHubSetupResult
} from '../src/github/types';
import {
  ProtectionConfig,
  SecurityReport,
  ProtectionStatus
} from '../src/protection/types';

// Mock external dependencies
jest.mock('fs-extra');
jest.mock('child_process');
jest.mock('inquirer');
jest.mock('axios');
jest.mock('chokidar');

describe('Agentwise Integration Tests', () => {
  let tempProjectDir: string;
  let testProjectName: string;

  beforeAll(() => {
    tempProjectDir = '/tmp/agentwise-integration-tests';
    testProjectName = 'integration-test-project';
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup common mocks
    setupFileSystemMocks();
    setupGitMocks();
    setupNetworkMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Complete Project Creation Workflow', () => {
    it('should create a full-stack web application from start to finish', async () => {
      // Setup test data
      const wizardOptions: WizardOptions = {
        projectName: 'full-stack-app',
        projectPath: path.join(tempProjectDir, 'full-stack-app'),
        template: 'full-stack-template',
        interactive: false,
        skipSteps: [],
        overridePreferences: {},
        dryRun: false,
        verbose: true,
        autoConfirm: true,
        continueOnError: false,
        maxRetries: 3,
        timeout: 60
      };

      const mockTechStack: TechStack = {
        frontend: {
          framework: 'React',
          language: 'TypeScript',
          cssFramework: 'Tailwind CSS',
          stateManagement: 'Redux Toolkit',
          bundler: 'Vite'
        },
        backend: {
          runtime: 'Node.js',
          framework: 'Express',
          language: 'TypeScript',
          authentication: 'JWT',
          validation: 'Zod'
        },
        database: {
          primary: {
            type: 'PostgreSQL',
            orm: 'Prisma',
            migrations: true
          }
        },
        testing: {
          framework: 'Jest',
          coverage: true,
          e2e: 'Playwright'
        },
        deployment: {
          platform: 'Vercel',
          containerization: 'Docker',
          cicd: 'GitHub Actions'
        },
        monitoring: {
          logging: 'Winston',
          metrics: 'Prometheus',
          tracing: 'OpenTelemetry'
        }
      };

      const expectedRequirements: Requirements = {
        name: 'Full Stack Web Application',
        description: 'A modern full-stack web application with React frontend and Express backend',
        type: 'web-application',
        features: [
          {
            id: 'user-auth',
            name: 'User Authentication',
            description: 'JWT-based user authentication system',
            type: 'core',
            priority: 'high',
            complexity: 'medium',
            estimatedHours: 16,
            dependencies: [],
            acceptanceCriteria: [
              'Users can register with email/password',
              'Users can login and logout',
              'JWT tokens are properly validated',
              'Password reset functionality'
            ]
          },
          {
            id: 'user-management',
            name: 'User Management',
            description: 'CRUD operations for user profiles',
            type: 'core',
            priority: 'high',
            complexity: 'low',
            estimatedHours: 12,
            dependencies: ['user-auth'],
            acceptanceCriteria: [
              'Users can view their profile',
              'Users can update their information',
              'Admin can manage all users'
            ]
          },
          {
            id: 'api-endpoints',
            name: 'REST API Endpoints',
            description: 'RESTful API with proper error handling',
            type: 'core',
            priority: 'high',
            complexity: 'medium',
            estimatedHours: 24,
            dependencies: ['user-auth'],
            acceptanceCriteria: [
              'CRUD endpoints for all resources',
              'Proper HTTP status codes',
              'Request validation',
              'Error handling middleware'
            ]
          }
        ],
        techStack: mockTechStack,
        timeline: {
          total: 45,
          phases: [
            {
              name: 'Setup & Foundation',
              duration: 5,
              startDate: new Date(),
              endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
              tasks: ['Project setup', 'Database schema', 'Basic auth'],
              dependencies: []
            },
            {
              name: 'Core Development',
              duration: 30,
              startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
              tasks: ['API development', 'Frontend components', 'Integration'],
              dependencies: ['Setup & Foundation']
            },
            {
              name: 'Testing & Deployment',
              duration: 10,
              startDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
              endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
              tasks: ['Testing', 'CI/CD setup', 'Production deployment'],
              dependencies: ['Core Development']
            }
          ],
          milestones: [
            {
              name: 'MVP Ready',
              date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
              description: 'Core features implemented and tested',
              deliverables: ['Working authentication', 'Basic CRUD operations', 'Frontend integration']
            },
            {
              name: 'Production Ready',
              date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
              description: 'Fully tested and deployed application',
              deliverables: ['Complete test suite', 'CI/CD pipeline', 'Production deployment']
            }
          ]
        },
        complexity: 'moderate',
        priority: 'high',
        estimatedHours: 52,
        dependencies: [],
        constraints: [
          'Must be mobile responsive',
          'Must support modern browsers',
          'Must handle 1000+ concurrent users'
        ],
        assumptions: [
          'Team has React experience',
          'PostgreSQL hosting available',
          'GitHub Actions for CI/CD'
        ],
        risks: [
          {
            description: 'Performance issues with large datasets',
            impact: 'medium',
            probability: 'low',
            mitigation: 'Implement pagination and caching'
          }
        ]
      };

      const expectedDatabaseResult: DatabaseWizardResult = {
        success: true,
        provider: 'postgresql',
        credentials: {
          provider: 'postgresql',
          host: 'localhost',
          port: 5432,
          database: 'full_stack_app',
          username: 'app_user',
          password: 'secure_password_123',
          createdAt: new Date(),
          lastUsed: new Date()
        },
        configFiles: [
          'prisma/schema.prisma',
          '.env',
          'src/lib/database.ts'
        ],
        mcpConfig: {
          mcpServers: {
            postgres: {
              name: 'postgres',
              command: 'npx',
              args: ['@modelcontextprotocol/server-postgres'],
              env: {
                POSTGRES_CONNECTION_STRING: 'postgresql://app_user:secure_password_123@localhost:5432/full_stack_app'
              }
            }
          }
        }
      };

      const expectedGitHubResult: GitHubSetupResult = {
        success: true,
        repository: {
          id: 123456789,
          name: 'full-stack-app',
          fullName: 'testuser/full-stack-app',
          description: 'A modern full-stack web application',
          private: false,
          htmlUrl: 'https://github.com/testuser/full-stack-app',
          cloneUrl: 'https://github.com/testuser/full-stack-app.git',
          sshUrl: 'git@github.com:testuser/full-stack-app.git',
          defaultBranch: 'main',
          owner: {
            login: 'testuser',
            type: 'User'
          },
          permissions: {
            admin: true,
            push: true,
            pull: true
          }
        },
        cloneUrl: 'https://github.com/testuser/full-stack-app.git',
        sshUrl: 'git@github.com:testuser/full-stack-app.git',
        protectionEnabled: true,
        workflowsCreated: [
          '.github/workflows/ci.yml',
          '.github/workflows/deploy.yml',
          '.github/workflows/security.yml'
        ],
        secretsUploaded: [
          'DATABASE_URL',
          'JWT_SECRET',
          'VERCEL_TOKEN'
        ]
      };

      const expectedProtectionConfig: ProtectionConfig = {
        autoCommit: {
          enabled: true,
          watchPaths: ['src/**/*.ts', 'src/**/*.tsx', 'prisma/**/*.prisma'],
          excludePaths: ['node_modules/**', 'dist/**', '.next/**'],
          commitRules: [
            {
              pattern: 'src/**/*.{ts,tsx}',
              immediate: true,
              description: 'Source code changes',
              priority: 'high'
            },
            {
              pattern: 'prisma/**/*.prisma',
              immediate: true,
              description: 'Database schema changes',
              priority: 'critical'
            }
          ],
          intervalMinutes: 5,
          maxFilesPerCommit: 15,
          requireSecurityCheck: true,
          generateIntelligentMessages: true
        },
        security: {
          enabled: true,
          scanInterval: 300000, // 5 minutes
          realTimeScan: true,
          autoFix: false,
          secretPatterns: [
            'password\\s*=\\s*["\'][^"\']+["\']',
            'api[_-]?key\\s*=\\s*["\'][^"\']+["\']',
            'secret\\s*=\\s*["\'][^"\']+["\']',
            'token\\s*=\\s*["\'][^"\']+["\']'
          ],
          excludeFiles: ['*.log', 'node_modules/**', '*.test.ts'],
          owaspChecks: true,
          dependencyCheck: true,
          alertThresholds: {
            critical: 1,
            high: 3,
            medium: 10
          }
        },
        review: {
          enabled: true,
          blockOnFailure: true,
          minimumScore: 8.5,
          checks: {
            quality: true,
            security: true,
            performance: true,
            testCoverage: true,
            style: true
          },
          thresholds: {
            complexity: 8,
            coverage: 85,
            maintainability: 8.0,
            security: 9.0
          }
        },
        backup: {
          enabled: true,
          strategy: 'continuous',
          destinations: [
            {
              type: 'github',
              path: 'full-stack-app-backups',
              priority: 1
            },
            {
              type: 'local',
              path: path.join(tempProjectDir, 'backups'),
              priority: 2
            }
          ],
          retention: {
            daily: 7,
            weekly: 4,
            monthly: 12
          },
          compression: true,
          encryption: true,
          verifyBackups: true
        },
        reporting: {
          enabled: true,
          schedule: '0 9 * * *', // Daily at 9 AM
          recipients: ['developer@example.com'],
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
      };

      // Mock all system components
      mockRequirementsGenerator(expectedRequirements);
      mockDatabaseWizard(expectedDatabaseResult);
      mockGitHubIntegration(expectedGitHubResult);
      mockProtectionSystem(expectedProtectionConfig);

      // Run the complete workflow
      const unifiedSetup = new UnifiedProjectSetup();
      const result: UnifiedWizardResult = await unifiedSetup.runCompleteSetup(wizardOptions);

      // Verify overall success
      expect(result.success).toBe(true);
      expect(result.projectName).toBe('full-stack-app');
      expect(result.projectPath).toBe(wizardOptions.projectPath);

      // Verify requirements generation
      expect(result.requirements).toBeDefined();
      expect(result.requirements?.name).toBe('Full Stack Web Application');
      expect(result.requirements?.features).toHaveLength(3);
      expect(result.requirements?.techStack.frontend?.framework).toBe('React');
      expect(result.requirements?.techStack.backend?.framework).toBe('Express');

      // Verify database setup
      expect(result.database).toBeDefined();
      expect(result.database?.success).toBe(true);
      expect(result.database?.provider).toBe('postgresql');
      expect(result.database?.configFiles).toContain('prisma/schema.prisma');

      // Verify GitHub integration
      expect(result.github).toBeDefined();
      expect(result.github?.success).toBe(true);
      expect(result.github?.repository?.name).toBe('full-stack-app');
      expect(result.github?.workflowsCreated).toContain('.github/workflows/ci.yml');
      expect(result.github?.secretsUploaded).toContain('DATABASE_URL');

      // Verify protection system
      expect(result.protection).toBeDefined();
      expect(result.protection?.success).toBe(true);
      expect(result.protection?.servicesStarted).toContain('autoCommit');
      expect(result.protection?.backupConfigured).toBe(true);

      // Verify generated files
      expect(result.generatedFiles.length).toBeGreaterThan(10);
      expect(result.generatedFiles).toContain('package.json');
      expect(result.generatedFiles).toContain('src/App.tsx');
      expect(result.generatedFiles).toContain('src/server.ts');
      expect(result.generatedFiles).toContain('prisma/schema.prisma');

      // Verify configuration files
      expect(result.configurationFiles).toContain('.env');
      expect(result.configurationFiles).toContain('tsconfig.json');
      expect(result.configurationFiles).toContain('tailwind.config.js');

      // Verify next steps
      expect(result.nextSteps).toHaveLength(5);
      expect(result.nextSteps[0]).toMatch(/install dependencies/i);
      expect(result.nextSteps[1]).toMatch(/database.*migrate/i);
      expect(result.nextSteps[2]).toMatch(/development server/i);

      // Verify no critical errors
      expect(result.errors.filter(e => e.type === 'critical')).toHaveLength(0);

      // Verify execution time was reasonable
      expect(result.duration).toBeLessThan(120000); // Less than 2 minutes for mocked operations
    }, 180000); // 3 minute timeout

    it('should handle partial failures and continue with recovery', async () => {
      const wizardOptions: WizardOptions = {
        projectName: 'partial-failure-test',
        projectPath: path.join(tempProjectDir, 'partial-failure-test'),
        interactive: false,
        skipSteps: [],
        overridePreferences: {},
        dryRun: false,
        verbose: true,
        autoConfirm: true,
        continueOnError: true,
        maxRetries: 2,
        timeout: 30
      };

      // Mock successful requirements and database, but failing GitHub
      mockRequirementsGenerator({
        name: 'Partial Test Project',
        description: 'Test partial failure recovery',
        type: 'web-application',
        features: [],
        techStack: {} as any,
        timeline: { total: 15, phases: [], milestones: [] },
        complexity: 'simple',
        priority: 'medium'
      });

      mockDatabaseWizard({
        success: true,
        provider: 'sqlite',
        credentials: {
          provider: 'sqlite',
          database: 'test.db',
          createdAt: new Date(),
          lastUsed: new Date()
        },
        configFiles: ['database.sqlite'],
        mcpConfig: { mcpServers: {} }
      });

      // Mock GitHub failure
      mockGitHubIntegrationFailure(new Error('GitHub API rate limit exceeded'));

      mockProtectionSystem({} as any);

      const unifiedSetup = new UnifiedProjectSetup();
      const result = await unifiedSetup.runCompleteSetup(wizardOptions);

      // Should fail overall but have partial success
      expect(result.success).toBe(false);
      expect(result.requirements).toBeDefined();
      expect(result.database?.success).toBe(true);
      expect(result.github).toBeUndefined();
      expect(result.errors.length).toBeGreaterThan(0);

      // Should provide recovery recommendations
      expect(result.recommendations).toContain(
        expect.stringMatching(/github.*retry.*later/i)
      );

      // Should still generate local files
      expect(result.generatedFiles.length).toBeGreaterThan(5);
    });

    it('should validate system requirements before starting', async () => {
      const wizardOptions: WizardOptions = {
        projectName: 'requirements-test',
        projectPath: path.join(tempProjectDir, 'requirements-test'),
        interactive: false,
        skipSteps: [],
        overridePreferences: {},
        dryRun: false,
        verbose: false,
        autoConfirm: true,
        continueOnError: false,
        maxRetries: 3,
        timeout: 30
      };

      // Mock system requirements check
      mockSystemRequirementsCheck({
        node: { available: true, version: '18.17.0' },
        git: { available: true, version: '2.40.0' },
        npm: { available: true, version: '9.6.4' },
        permissions: {
          fileSystem: true,
          network: true,
          git: true
        }
      });

      const unifiedSetup = new UnifiedProjectSetup();
      const result = await unifiedSetup.checkSystemRequirements();

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Cross-System Integration Tests', () => {
    it('should integrate protection system with GitHub workflows', async () => {
      const protectionConfig: ProtectionConfig = {
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
          recipients: [],
          format: 'markdown',
          includeMetrics: true,
          commitToRepo: true
        },
        alerts: {
          enabled: true,
          channels: ['console'],
          thresholds: {
            criticalVulnerabilities: 1,
            backupFailures: 3,
            qualityDrop: 2.0
          }
        }
      };

      const githubConfig: GitHubAuthConfig = {
        authMethod: 'token',
        token: 'test-token',
        username: 'testuser',
        email: 'test@example.com'
      };

      // Initialize systems
      const autoCommitManager = new AutoCommitManager(protectionConfig.autoCommit);
      const securityMonitor = new ContinuousSecurityMonitor(protectionConfig.security);
      const githubIntegration = new GitHubIntegration({
        owner: 'testuser',
        repo: 'integration-test',
        authConfig: githubConfig
      });

      // Mock GitHub API responses
      mockGitHubAPIResponses();

      // Simulate file changes that trigger security scan and auto-commit
      const fileChanges = [
        'src/components/LoginForm.tsx',
        'src/utils/auth.ts',
        'tests/auth.test.ts'
      ];

      // Start monitoring
      await securityMonitor.startRealTimeMonitoring();
      await autoCommitManager.start();

      // Simulate security scan
      const scanResult = await securityMonitor.scanFiles(fileChanges);
      expect(scanResult.vulnerabilities).toHaveLength(0);

      // Simulate auto-commit
      const commitResult = await autoCommitManager.commitFiles(fileChanges);
      expect(commitResult.hash).toBeDefined();
      expect(commitResult.files).toEqual(fileChanges);

      // Verify GitHub integration
      const workflowRuns = await githubIntegration.getWorkflowRuns();
      expect(workflowRuns.length).toBeGreaterThanOrEqual(0);
    });

    it('should sync database credentials with GitHub secrets', async () => {
      const databaseCredentials: DatabaseCredentials = {
        provider: 'postgresql',
        host: 'db.example.com',
        port: 5432,
        database: 'production_db',
        username: 'app_user',
        password: 'super_secure_password',
        createdAt: new Date(),
        lastUsed: new Date()
      };

      const githubConfig: GitHubAuthConfig = {
        authMethod: 'token',
        token: 'test-token'
      };

      const githubIntegration = new GitHubIntegration({
        owner: 'testuser',
        repo: 'sync-test',
        authConfig: githubConfig
      });

      // Mock secret creation
      const mockCreateSecret = jest.fn().mockResolvedValue(undefined);
      const mockSecretManager = {
        createSecret: mockCreateSecret,
        listSecrets: jest.fn().mockResolvedValue([]),
        deleteSecret: jest.fn().mockResolvedValue(undefined)
      };

      githubIntegration.secrets = mockSecretManager;

      // Sync credentials to GitHub secrets
      const connectionString = `postgresql://${databaseCredentials.username}:${databaseCredentials.password}@${databaseCredentials.host}:${databaseCredentials.port}/${databaseCredentials.database}`;

      await githubIntegration.secrets.createSecret({
        name: 'DATABASE_URL',
        value: connectionString
      });

      expect(mockCreateSecret).toHaveBeenCalledWith({
        name: 'DATABASE_URL',
        value: connectionString
      });
    });

    it('should generate comprehensive project documentation', async () => {
      const projectResults: WizardStepResults = {
        requirements: {
          name: 'Documentation Test Project',
          description: 'Test comprehensive documentation generation',
          type: 'web-application',
          features: [
            {
              id: 'feature-1',
              name: 'Test Feature',
              description: 'A test feature',
              type: 'core',
              priority: 'high',
              complexity: 'low',
              estimatedHours: 8,
              dependencies: [],
              acceptanceCriteria: ['Works correctly']
            }
          ],
          techStack: {
            frontend: {
              framework: 'React',
              language: 'TypeScript'
            },
            backend: {
              runtime: 'Node.js',
              framework: 'Express',
              language: 'TypeScript'
            }
          } as any,
          timeline: { total: 30, phases: [], milestones: [] },
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
          configFiles: ['prisma/schema.prisma'],
          mcpConfig: { mcpServers: {} }
        },
        github: {
          success: true,
          repository: {
            id: 123,
            name: 'doc-test',
            fullName: 'user/doc-test',
            htmlUrl: 'https://github.com/user/doc-test',
            cloneUrl: 'https://github.com/user/doc-test.git',
            sshUrl: 'git@github.com:user/doc-test.git',
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

      // Mock file operations
      const mockFs = {
        writeFile: jest.fn(),
        ensureDir: jest.fn(),
        copy: jest.fn()
      };
      Object.assign(require('fs-extra'), mockFs);

      const projectSummary = new (require('../src/wizard/ProjectSummary').ProjectSummary)();
      const documentationResult = await projectSummary.generateComprehensiveDocumentation(projectResults);

      expect(documentationResult.files).toContain('README.md');
      expect(documentationResult.files).toContain('docs/SETUP.md');
      expect(documentationResult.files).toContain('docs/API.md');
      expect(documentationResult.files).toContain('docs/DEPLOYMENT.md');

      // Verify README content
      const readmeCall = mockFs.writeFile.mock.calls.find(call => 
        call[0].endsWith('README.md')
      );
      expect(readmeCall).toBeDefined();
      const readmeContent = readmeCall[1];
      expect(readmeContent).toContain('# Documentation Test Project');
      expect(readmeContent).toContain('## Getting Started');
      expect(readmeContent).toContain('## Tech Stack');
      expect(readmeContent).toContain('- React');
      expect(readmeContent).toContain('- Express');
      expect(readmeContent).toContain('- PostgreSQL');
    });
  });

  describe('End-to-End Workflow Tests', () => {
    it('should handle a complete development lifecycle', async () => {
      const lifecycleTest = {
        // Phase 1: Project Creation
        creation: {
          projectName: 'lifecycle-test-app',
          template: 'full-stack-template',
          features: ['auth', 'api', 'database', 'testing']
        },
        
        // Phase 2: Initial Development
        development: {
          initialFiles: [
            'src/components/App.tsx',
            'src/server.ts',
            'prisma/schema.prisma'
          ],
          commits: ['Initial project setup', 'Add basic components', 'Setup database schema']
        },
        
        // Phase 3: Testing and Quality Assurance
        testing: {
          testFiles: [
            'tests/components/App.test.tsx',
            'tests/api/auth.test.ts',
            'tests/integration/workflow.test.ts'
          ],
          coverage: 85,
          qualityScore: 8.5
        },
        
        // Phase 4: Security and Protection
        security: {
          vulnerabilityScans: 3,
          issuesFound: 0,
          backupsCreated: 5,
          reportsGenerated: 1
        },
        
        // Phase 5: Deployment
        deployment: {
          environments: ['staging', 'production'],
          workflows: ['ci.yml', 'deploy.yml'],
          secrets: ['DATABASE_URL', 'JWT_SECRET', 'API_KEY']
        }
      };

      // Simulate complete lifecycle
      const results: any = {};

      // Phase 1: Project Creation
      const creationOptions: WizardOptions = {
        projectName: lifecycleTest.creation.projectName,
        projectPath: path.join(tempProjectDir, lifecycleTest.creation.projectName),
        template: lifecycleTest.creation.template,
        interactive: false,
        skipSteps: [],
        overridePreferences: {},
        dryRun: false,
        verbose: false,
        autoConfirm: true,
        continueOnError: false,
        maxRetries: 3,
        timeout: 60
      };

      mockCompleteSetupScenario(lifecycleTest);
      
      const unifiedSetup = new UnifiedProjectSetup();
      results.creation = await unifiedSetup.runCompleteSetup(creationOptions);

      expect(results.creation.success).toBe(true);
      expect(results.creation.generatedFiles.length).toBeGreaterThanOrEqual(10);

      // Phase 2: Simulate Development Activity
      const autoCommitManager = new AutoCommitManager({
        enabled: true,
        watchPaths: ['src/**/*.ts', 'src/**/*.tsx'],
        excludePaths: ['node_modules/**'],
        commitRules: [],
        intervalMinutes: 5,
        maxFilesPerCommit: 10,
        requireSecurityCheck: true,
        generateIntelligentMessages: true
      });

      mockFileChanges(lifecycleTest.development.initialFiles);
      
      for (const file of lifecycleTest.development.initialFiles) {
        await autoCommitManager.processFileChange({
          path: file,
          type: 'modified',
          timestamp: new Date(),
          size: 1024
        });
      }

      // Phase 3: Quality Assurance
      const securityMonitor = new ContinuousSecurityMonitor({
        enabled: true,
        scanInterval: 60000,
        realTimeScan: true,
        autoFix: false,
        secretPatterns: [],
        excludeFiles: [],
        owaspChecks: true,
        dependencyCheck: true,
        alertThresholds: { critical: 1, high: 3, medium: 10 }
      });

      results.security = await securityMonitor.scanFiles(lifecycleTest.testing.testFiles);
      expect(results.security.vulnerabilities.length).toBe(lifecycleTest.security.issuesFound);

      // Phase 4: Protection and Monitoring
      const protectionDashboard = new ProtectionDashboard();
      results.protection = await protectionDashboard.getProtectionStatus();
      expect(results.protection.overall).toBe('healthy');

      // Phase 5: Deployment Verification
      const githubIntegration = new GitHubIntegration({
        owner: 'testuser',
        repo: lifecycleTest.creation.projectName,
        authConfig: { authMethod: 'token', token: 'test-token' }
      });

      mockGitHubAPIResponses();
      
      const workflowRuns = await githubIntegration.getWorkflowRuns();
      expect(workflowRuns.length).toBeGreaterThanOrEqual(1);

      // Verify complete lifecycle success
      expect(results.creation.success).toBe(true);
      expect(results.security.summary.total).toBe(0);
      expect(results.protection.overall).toBe('healthy');
    }, 300000); // 5 minute timeout for complete lifecycle
  });

  describe('Performance and Scalability Integration', () => {
    it('should handle large projects efficiently', async () => {
      const largeProjectConfig = {
        fileCount: 500,
        featureCount: 25,
        testFileCount: 150,
        dependencyCount: 50
      };

      const startTime = Date.now();

      // Mock large project setup
      const largeFileList = Array.from({ length: largeProjectConfig.fileCount }, 
        (_, i) => `src/components/Component${i}.tsx`
      );
      
      const largeFeatureList = Array.from({ length: largeProjectConfig.featureCount },
        (_, i) => ({
          id: `feature-${i}`,
          name: `Feature ${i}`,
          description: `Auto-generated feature ${i}`,
          type: 'core' as const,
          priority: 'medium' as const,
          complexity: 'low' as const,
          estimatedHours: 8,
          dependencies: [],
          acceptanceCriteria: [`Feature ${i} works correctly`]
        })
      );

      mockLargeProjectScenario(largeProjectConfig);

      const wizardOptions: WizardOptions = {
        projectName: 'large-project-test',
        projectPath: path.join(tempProjectDir, 'large-project-test'),
        interactive: false,
        skipSteps: [],
        overridePreferences: {},
        dryRun: false,
        verbose: false,
        autoConfirm: true,
        continueOnError: false,
        maxRetries: 3,
        timeout: 180
      };

      const unifiedSetup = new UnifiedProjectSetup();
      const result = await unifiedSetup.runCompleteSetup(wizardOptions);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(result.success).toBe(true);
      expect(result.generatedFiles.length).toBe(largeProjectConfig.fileCount);
      expect(result.requirements?.features).toHaveLength(largeProjectConfig.featureCount);
      
      // Should complete in reasonable time (less than 30 seconds for mocked operations)
      expect(duration).toBeLessThan(30000);
    }, 60000);

    it('should handle concurrent operations safely', async () => {
      const concurrentOperations = Array.from({ length: 10 }, (_, i) => ({
        projectName: `concurrent-test-${i}`,
        projectPath: path.join(tempProjectDir, `concurrent-test-${i}`)
      }));

      const startTime = Date.now();

      // Mock concurrent project setups
      mockConcurrentOperations();

      const promises = concurrentOperations.map(async (op) => {
        const wizardOptions: WizardOptions = {
          projectName: op.projectName,
          projectPath: op.projectPath,
          interactive: false,
          skipSteps: ['github', 'protection'], // Skip to reduce complexity
          overridePreferences: {},
          dryRun: false,
          verbose: false,
          autoConfirm: true,
          continueOnError: true,
          maxRetries: 1,
          timeout: 30
        };

        const unifiedSetup = new UnifiedProjectSetup();
        return unifiedSetup.runCompleteSetup(wizardOptions);
      });

      const results = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // All operations should succeed
      expect(results.every(r => r.success)).toBe(true);
      
      // Should complete concurrently (not sequentially)
      expect(duration).toBeLessThan(60000); // Less than 1 minute
    }, 120000);
  });

  // Helper functions for mocking
  function setupFileSystemMocks() {
    const mockFs = {
      pathExists: jest.fn().mockResolvedValue(false),
      ensureDir: jest.fn(),
      writeFile: jest.fn(),
      readFile: jest.fn().mockResolvedValue(''),
      readJson: jest.fn().mockResolvedValue({}),
      writeJson: jest.fn(),
      copy: jest.fn(),
      remove: jest.fn(),
      stat: jest.fn().mockResolvedValue({ 
        isFile: () => true, 
        size: 1024,
        birthtime: new Date(),
        mtime: new Date()
      })
    };
    Object.assign(require('fs-extra'), mockFs);
  }

  function setupGitMocks() {
    const mockExec = jest.fn().mockImplementation((cmd, callback) => {
      if (cmd.includes('git status')) {
        callback(null, { stdout: 'On branch main\nnothing to commit', stderr: '' });
      } else if (cmd.includes('git add')) {
        callback(null, { stdout: '', stderr: '' });
      } else if (cmd.includes('git commit')) {
        callback(null, { stdout: 'commit abc123', stderr: '' });
      } else if (cmd.includes('git push')) {
        callback(null, { stdout: 'pushed successfully', stderr: '' });
      } else if (cmd.includes('node --version')) {
        callback(null, { stdout: 'v18.17.0', stderr: '' });
      } else if (cmd.includes('git --version')) {
        callback(null, { stdout: 'git version 2.40.0', stderr: '' });
      } else if (cmd.includes('npm --version')) {
        callback(null, { stdout: '9.6.4', stderr: '' });
      } else {
        callback(null, { stdout: '', stderr: '' });
      }
    });
    require('child_process').exec = mockExec;
  }

  function setupNetworkMocks() {
    const mockAxios = {
      get: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
      post: jest.fn().mockResolvedValue({ data: {}, status: 201 }),
      put: jest.fn().mockResolvedValue({ data: {}, status: 200 }),
      delete: jest.fn().mockResolvedValue({ status: 204 })
    };
    require('axios').get = mockAxios.get;
    require('axios').post = mockAxios.post;
    require('axios').put = mockAxios.put;
    require('axios').delete = mockAxios.delete;
  }

  function mockRequirementsGenerator(expectedRequirements: any) {
    const RequirementsGenerator = require('../src/requirements/RequirementsGenerator').RequirementsGenerator;
    RequirementsGenerator.prototype.generateRequirements = jest.fn().mockResolvedValue(expectedRequirements);
  }

  function mockDatabaseWizard(expectedResult: any) {
    const DatabaseWizard = require('../src/database/DatabaseWizard').DatabaseWizard;
    DatabaseWizard.prototype.runWizard = jest.fn().mockResolvedValue(expectedResult);
  }

  function mockGitHubIntegration(expectedResult: any) {
    const GitHubIntegration = require('../src/github/GitHubIntegration').GitHubIntegration;
    GitHubIntegration.prototype.setupRepository = jest.fn().mockResolvedValue(expectedResult);
    GitHubIntegration.prototype.authenticate = jest.fn().mockResolvedValue({ success: true });
    GitHubIntegration.prototype.getRepository = jest.fn().mockResolvedValue(expectedResult.repository);
  }

  function mockGitHubIntegrationFailure(error: Error) {
    const GitHubIntegration = require('../src/github/GitHubIntegration').GitHubIntegration;
    GitHubIntegration.prototype.setupRepository = jest.fn().mockRejectedValue(error);
  }

  function mockProtectionSystem(expectedConfig: any) {
    const AutoCommitManager = require('../src/protection/AutoCommitManager').AutoCommitManager;
    const ContinuousSecurityMonitor = require('../src/protection/ContinuousSecurityMonitor').ContinuousSecurityMonitor;
    
    AutoCommitManager.prototype.start = jest.fn();
    ContinuousSecurityMonitor.prototype.startRealTimeMonitoring = jest.fn();
  }

  function mockSystemRequirementsCheck(requirements: any) {
    // Mock system requirement checks
    const mockExec = jest.fn().mockImplementation((cmd, callback) => {
      if (cmd.includes('node --version')) {
        callback(null, { stdout: requirements.node.version });
      } else if (cmd.includes('git --version')) {
        callback(null, { stdout: `git version ${requirements.git.version}` });
      } else if (cmd.includes('npm --version')) {
        callback(null, { stdout: requirements.npm.version });
      }
    });
    require('child_process').exec = mockExec;
  }

  function mockGitHubAPIResponses() {
    const mockAxios = {
      get: jest.fn().mockResolvedValue({
        data: { workflow_runs: [] },
        status: 200
      }),
      post: jest.fn().mockResolvedValue({ status: 201 })
    };
    require('axios').get = mockAxios.get;
    require('axios').post = mockAxios.post;
  }

  function mockCompleteSetupScenario(scenario: any) {
    mockRequirementsGenerator({
      name: scenario.creation.projectName,
      features: scenario.creation.features.map((f: string, i: number) => ({
        id: f,
        name: f,
        type: 'core',
        priority: 'medium',
        complexity: 'low',
        estimatedHours: 8,
        dependencies: [],
        acceptanceCriteria: []
      })),
      techStack: {} as any,
      timeline: { total: 30, phases: [], milestones: [] },
      complexity: 'moderate',
      priority: 'high'
    });

    mockDatabaseWizard({
      success: true,
      provider: 'postgresql',
      credentials: {} as any,
      configFiles: ['prisma/schema.prisma'],
      mcpConfig: { mcpServers: {} }
    });

    mockGitHubIntegration({
      success: true,
      repository: {} as any,
      workflowsCreated: scenario.deployment.workflows,
      secretsUploaded: scenario.deployment.secrets
    });

    mockProtectionSystem({});
  }

  function mockFileChanges(files: string[]) {
    const mockWatcher = {
      on: jest.fn(),
      close: jest.fn()
    };
    require('chokidar').watch = jest.fn().mockReturnValue(mockWatcher);

    // Simulate file changes
    files.forEach(file => {
      const changeHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'change')?.[1];
      if (changeHandler) {
        changeHandler(file);
      }
    });
  }

  function mockLargeProjectScenario(config: any) {
    const largeFiles = Array.from({ length: config.fileCount }, (_, i) => `file_${i}.ts`);
    
    require('fs-extra').readdir = jest.fn().mockResolvedValue(largeFiles);
    require('fs-extra').stat = jest.fn().mockResolvedValue({ 
      isFile: () => true, 
      size: 1024 
    });
  }

  function mockConcurrentOperations() {
    // Ensure mocks can handle concurrent calls safely
    const mockFs = require('fs-extra');
    mockFs.ensureDir = jest.fn().mockImplementation(async (dir) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    });
    
    mockFs.writeFile = jest.fn().mockImplementation(async (file, content) => {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    });
  }
});