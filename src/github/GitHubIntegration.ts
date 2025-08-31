import { AxiosInstance } from 'axios';
import { GitHubAutoAuth } from './GitHubAutoAuth';
import { GitHubRepoManager } from './GitHubRepoManager';
import { GitHubActionsGenerator } from './GitHubActionsGenerator';
import { GitHubSecretManager } from './GitHubSecretManager';
import {
  GitHubIntegrationOptions,
  GitHubAuthResult,
  GitHubRepository,
  SetupFlowOptions,
  GitHubIntegrationStatus,
  GitHubUser,
  GitHubOrganization,
  WorkflowTemplate,
  BulkSecretResult,
  CreateRepositoryOptions
} from './types';

export class GitHubIntegration {
  private auth: GitHubAutoAuth;
  private repoManager?: GitHubRepoManager;
  private actionsGenerator?: GitHubActionsGenerator;
  private secretManager?: GitHubSecretManager;
  private httpClient?: AxiosInstance;
  private options: GitHubIntegrationOptions;
  private currentRepository?: GitHubRepository;

  constructor(options: GitHubIntegrationOptions) {
    this.options = options;
    this.auth = new GitHubAutoAuth(options.authConfig);
  }

  /**
   * Initialize the GitHub integration with authentication
   */
  async initialize(): Promise<GitHubAuthResult> {
    const authResult = await this.auth.authenticate();
    
    if (authResult.success) {
      this.httpClient = this.auth.getHttpClient();
      this.initializeManagers();
    }

    return authResult;
  }

  /**
   * Initialize all manager classes after successful authentication
   */
  private initializeManagers(): void {
    if (!this.httpClient) {
      throw new Error('HTTP client not initialized. Call initialize() first.');
    }

    this.repoManager = new GitHubRepoManager(this.httpClient, this.options.owner);
    this.secretManager = new GitHubSecretManager(this.httpClient, this.options.owner, this.options.repo);
    
    if (this.options.repo) {
      this.actionsGenerator = new GitHubActionsGenerator(this.httpClient, this.options.owner, this.options.repo);
    }
  }

  /**
   * Complete GitHub setup flow
   */
  async setupComplete(setupOptions: SetupFlowOptions): Promise<{
    repository: GitHubRepository;
    workflows: WorkflowTemplate[];
    secretsResult?: BulkSecretResult;
    summary: string;
  }> {
    if (!this.repoManager) {
      throw new Error('Not initialized. Call initialize() first.');
    }

    let repository: GitHubRepository;
    const workflows: WorkflowTemplate[] = [];
    let secretsResult: BulkSecretResult | undefined;

    try {
      // Step 1: Create or connect to repository
      if (setupOptions.createRepo) {
        console.log('Creating repository...');
        repository = await this.repoManager.createRepository(setupOptions.createRepo);
        this.currentRepository = repository;
        
        // Wait for repository to be ready
        await this.repoManager.waitForRepository(repository.name);
        
        // Initialize Actions Generator for the new repo
        this.actionsGenerator = new GitHubActionsGenerator(
          this.httpClient!, 
          this.options.owner, 
          repository.name
        );
        this.secretManager?.setRepository(repository.name);
      } else if (this.options.repo) {
        console.log(`Connecting to existing repository: ${this.options.repo}`);
        repository = await this.repoManager.connectToRepository(this.options.repo);
        this.currentRepository = repository;
      } else {
        throw new Error('Either createRepo options or existing repo name must be provided');
      }

      // Step 2: Set up branch protection
      if (setupOptions.branchProtection && setupOptions.branchProtection.length > 0) {
        console.log('Setting up branch protection...');
        for (const protection of setupOptions.branchProtection) {
          await this.repoManager.setupBranchProtection(repository.name, protection);
        }
      }

      // Step 3: Configure webhooks
      if (setupOptions.webhooks && setupOptions.webhooks.length > 0) {
        console.log('Configuring webhooks...');
        for (const webhook of setupOptions.webhooks) {
          await this.repoManager.configureWebhook(repository.name, webhook);
        }
      }

      // Step 4: Create initial commit if specified
      if (setupOptions.initialCommit) {
        console.log('Creating initial commit...');
        await this.repoManager.createInitialCommit(
          repository.name,
          setupOptions.initialCommit.files,
          setupOptions.initialCommit.message
        );
      }

      // Step 5: Generate and create workflows
      if (!this.actionsGenerator) {
        this.actionsGenerator = new GitHubActionsGenerator(
          this.httpClient!, 
          this.options.owner, 
          repository.name
        );
      }

      // CI workflow
      if (setupOptions.ciConfig) {
        console.log('Creating CI workflow...');
        const ciWorkflow = this.actionsGenerator.generateCIWorkflow(setupOptions.ciConfig);
        await this.actionsGenerator.createWorkflow(ciWorkflow);
        workflows.push(ciWorkflow);

        // Test workflow
        const testWorkflow = this.actionsGenerator.generateTestWorkflow(setupOptions.ciConfig);
        await this.actionsGenerator.createWorkflow(testWorkflow);
        workflows.push(testWorkflow);
      }

      // Deployment workflow
      if (setupOptions.deploymentConfig) {
        console.log('Creating deployment workflow...');
        const deployWorkflow = this.actionsGenerator.generateDeploymentWorkflow(setupOptions.deploymentConfig);
        await this.actionsGenerator.createWorkflow(deployWorkflow);
        workflows.push(deployWorkflow);
      }

      // Security workflow
      if (setupOptions.securityConfig) {
        console.log('Creating security workflow...');
        const securityWorkflow = this.actionsGenerator.generateSecurityWorkflow(setupOptions.securityConfig);
        await this.actionsGenerator.createWorkflow(securityWorkflow);
        workflows.push(securityWorkflow);
      }

      // Step 6: Set up secrets
      if (setupOptions.secrets && setupOptions.secrets.length > 0) {
        console.log('Setting up repository secrets...');
        if (!this.secretManager) {
          this.secretManager = new GitHubSecretManager(this.httpClient!, this.options.owner, repository.name);
        }

        const publicKey = await this.secretManager.getRepositoryPublicKey();
        const results = [];

        for (const secret of setupOptions.secrets) {
          try {
            await this.secretManager.createOrUpdateSecret(secret.name, secret.value, publicKey);
            results.push({ success: true, secretName: secret.name, operation: 'create' as const });
          } catch (error) {
            results.push({ 
              success: false, 
              secretName: secret.name, 
              operation: 'create' as const,
              error: error instanceof Error ? error.message : String(error)
            });
          }
        }

        secretsResult = {
          total: setupOptions.secrets.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results
        };
      }

      // Generate summary
      const summary = this.generateSetupSummary(repository, workflows, secretsResult);

      return {
        repository,
        workflows,
        secretsResult,
        summary
      };

    } catch (error) {
      throw new Error(`Setup failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Quick setup for common project types
   */
  async quickSetup(projectType: 'node' | 'python' | 'go' | 'static', repoName: string): Promise<any> {
    const setupOptions: SetupFlowOptions = {
      createRepo: {
        name: repoName,
        description: `A ${projectType} project created with Agentwise GitHub Integration`,
        private: false,
        hasIssues: true,
        hasProjects: true,
        hasWiki: false
      },
      branchProtection: [
        {
          branch: 'main',
          requiredPullRequestReviews: {
            requiredApprovingReviewCount: 1,
            dismissStaleReviews: true,
            requireCodeOwnerReviews: false
          },
          enforceAdmins: false
        }
      ],
      securityConfig: {
        enableCodeQL: true,
        enableDependencyReview: true,
        enableSecretScanning: true
      }
    };

    // Project-specific configurations
    switch (projectType) {
      case 'node':
        setupOptions.ciConfig = {
          languages: ['javascript', 'typescript'],
          nodeVersion: ['16', '18', '20'],
          testCommand: 'npm test',
          buildCommand: 'npm run build',
          lintCommand: 'npm run lint'
        };
        setupOptions.initialCommit = {
          message: 'Initial Node.js project setup',
          files: {
            'package.json': JSON.stringify({
              name: repoName,
              version: '1.0.0',
              description: '',
              main: 'index.js',
              scripts: {
                test: 'echo "Error: no test specified" && exit 1',
                build: 'echo "Build script not configured"',
                lint: 'echo "Lint script not configured"'
              }
            }, null, 2),
            'README.md': `# ${repoName}\n\nA Node.js project.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm test\n\`\`\``,
            '.gitignore': 'node_modules/\n.env\n.env.local\ndist/\nbuild/\n*.log'
          }
        };
        break;

      case 'python':
        setupOptions.ciConfig = {
          languages: ['python'],
          pythonVersion: ['3.8', '3.9', '3.10', '3.11'],
          testCommand: 'python -m pytest',
          lintCommand: 'flake8'
        };
        setupOptions.initialCommit = {
          message: 'Initial Python project setup',
          files: {
            'requirements.txt': '# Add your dependencies here',
            'README.md': `# ${repoName}\n\nA Python project.\n\n## Getting Started\n\n\`\`\`bash\npip install -r requirements.txt\npython -m pytest\n\`\`\``,
            '.gitignore': '__pycache__/\n*.pyc\n*.pyo\n*.pyd\n.env\nvenv/\n.venv/\ndist/\nbuild/\n*.egg-info/'
          }
        };
        break;

      case 'go':
        setupOptions.ciConfig = {
          languages: ['go'],
          goVersion: ['1.19', '1.20', '1.21'],
          testCommand: 'go test ./...',
          buildCommand: 'go build'
        };
        setupOptions.initialCommit = {
          message: 'Initial Go project setup',
          files: {
            'go.mod': `module ${repoName}\n\ngo 1.21`,
            'README.md': `# ${repoName}\n\nA Go project.\n\n## Getting Started\n\n\`\`\`bash\ngo mod tidy\ngo test ./...\ngo build\n\`\`\``,
            '.gitignore': '# Binaries\n*.exe\n*.exe~\n*.dll\n*.so\n*.dylib\n\n# Go build cache\n.cache/\n\n# Environment\n.env'
          }
        };
        break;

      case 'static':
        setupOptions.deploymentConfig = {
          environment: 'production',
          provider: 'netlify',
          outputDirectory: 'dist'
        };
        setupOptions.initialCommit = {
          message: 'Initial static site setup',
          files: {
            'index.html': `<!DOCTYPE html>\n<html>\n<head>\n    <title>${repoName}</title>\n</head>\n<body>\n    <h1>Welcome to ${repoName}</h1>\n</body>\n</html>`,
            'README.md': `# ${repoName}\n\nA static website.\n\n## Getting Started\n\nOpen \`index.html\` in your browser.`,
            '.gitignore': 'node_modules/\n.env\ndist/\nbuild/'
          }
        };
        break;
    }

    return await this.setupComplete(setupOptions);
  }

  /**
   * Get current user information
   */
  async getCurrentUser(): Promise<GitHubUser> {
    if (!this.httpClient) {
      throw new Error('Not authenticated. Call initialize() first.');
    }

    try {
      const response = await this.httpClient.get('/user');
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get user information: ${error.message}`);
    }
  }

  /**
   * Get organization information
   */
  async getOrganization(): Promise<GitHubOrganization> {
    if (!this.httpClient) {
      throw new Error('Not authenticated. Call initialize() first.');
    }

    try {
      const response = await this.httpClient.get(`/orgs/${this.options.owner}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get organization information: ${error.message}`);
    }
  }

  /**
   * Get integration status
   */
  async getStatus(): Promise<GitHubIntegrationStatus> {
    const authStatus = this.auth.getAuthStatus();
    let repository: GitHubRepository | undefined;
    let rateLimitRemaining: number | undefined;
    let rateLimitReset: Date | undefined;

    if (this.httpClient && this.options.repo && this.repoManager) {
      try {
        repository = await this.repoManager.getRepository(this.options.repo);
      } catch {
        // Repository might not exist or no access
      }

      // Get rate limit info
      try {
        const rateLimitResponse = await this.httpClient.get('/rate_limit');
        rateLimitRemaining = rateLimitResponse.data.rate.remaining;
        rateLimitReset = new Date(rateLimitResponse.data.rate.reset * 1000);
      } catch {
        // Rate limit info not available
      }
    }

    return {
      authenticated: authStatus.authenticated,
      authMethod: authStatus.method,
      username: authStatus.username,
      rateLimitRemaining,
      rateLimitReset,
      repository
    };
  }

  /**
   * Sync environment variables to repository secrets
   */
  async syncEnvToSecrets(envFile: string = '.env', options: { dryRun?: boolean; overwrite?: boolean } = {}): Promise<BulkSecretResult> {
    if (!this.secretManager) {
      throw new Error('Secret manager not initialized. Ensure repository is set.');
    }

    return await this.secretManager.syncSecretsFromEnv({
      envFile,
      dryRun: options.dryRun,
      overwrite: options.overwrite
    });
  }

  /**
   * Create workflow from template
   */
  async createWorkflowFromTemplate(templateName: string): Promise<WorkflowTemplate> {
    if (!this.actionsGenerator) {
      throw new Error('Actions generator not initialized. Ensure repository is set.');
    }

    const templates = this.actionsGenerator.getTemplateLibrary();
    const templateFunction = templates[templateName];
    
    if (!templateFunction) {
      throw new Error(`Template '${templateName}' not found. Available templates: ${Object.keys(templates).join(', ')}`);
    }

    const template = templateFunction();
    await this.actionsGenerator.createWorkflow(template);
    
    return template;
  }

  /**
   * Clone repository to local directory
   */
  async cloneToLocal(localPath: string, useSsh: boolean = false): Promise<void> {
    if (!this.repoManager || !this.options.repo) {
      throw new Error('Repository manager not initialized or no repository specified.');
    }

    await this.repoManager.cloneRepository(this.options.repo, localPath, useSsh);
  }

  /**
   * Connect local repository to GitHub
   */
  async connectLocalToGitHub(localPath: string, useSsh: boolean = false): Promise<void> {
    if (!this.repoManager || !this.options.repo) {
      throw new Error('Repository manager not initialized or no repository specified.');
    }

    await this.repoManager.connectLocalRepo(localPath, this.options.repo, useSsh);
  }

  /**
   * Generate setup summary
   */
  private generateSetupSummary(
    repository: GitHubRepository, 
    workflows: WorkflowTemplate[], 
    secretsResult?: BulkSecretResult
  ): string {
    const lines = [
      '🎉 GitHub Integration Setup Complete!',
      '',
      `📁 Repository: ${repository.fullName}`,
      `🔗 URL: ${repository.htmlUrl}`,
      `🌟 Default Branch: ${repository.defaultBranch}`,
      `🔒 Private: ${repository.private ? 'Yes' : 'No'}`,
      ''
    ];

    if (workflows.length > 0) {
      lines.push('⚙️ Workflows Created:');
      workflows.forEach(workflow => {
        lines.push(`  • ${workflow.description} (${workflow.name})`);
      });
      lines.push('');
    }

    if (secretsResult) {
      lines.push(`🔐 Secrets: ${secretsResult.successful}/${secretsResult.total} configured successfully`);
      if (secretsResult.failed > 0) {
        lines.push(`  ⚠️  ${secretsResult.failed} secrets failed to configure`);
      }
      lines.push('');
    }

    lines.push('🚀 Your repository is ready for development!');
    lines.push('');
    lines.push('Next steps:');
    lines.push('1. Clone the repository locally');
    lines.push('2. Start developing your project');
    lines.push('3. Push changes to trigger workflows');

    return lines.join('\n');
  }

  /**
   * Get repository manager instance
   */
  getRepoManager(): GitHubRepoManager {
    if (!this.repoManager) {
      throw new Error('Repository manager not initialized. Call initialize() first.');
    }
    return this.repoManager;
  }

  /**
   * Get actions generator instance
   */
  getActionsGenerator(): GitHubActionsGenerator {
    if (!this.actionsGenerator) {
      throw new Error('Actions generator not initialized. Ensure repository is set.');
    }
    return this.actionsGenerator;
  }

  /**
   * Get secret manager instance
   */
  getSecretManager(): GitHubSecretManager {
    if (!this.secretManager) {
      throw new Error('Secret manager not initialized. Call initialize() first.');
    }
    return this.secretManager;
  }

  /**
   * Get auth instance
   */
  getAuth(): GitHubAutoAuth {
    return this.auth;
  }

  /**
   * Get HTTP client (authenticated)
   */
  getHttpClient(): AxiosInstance {
    if (!this.httpClient) {
      throw new Error('HTTP client not initialized. Call initialize() first.');
    }
    return this.httpClient;
  }

  /**
   * Set repository for operations
   */
  setRepository(repo: string): void {
    this.options.repo = repo;
    if (this.secretManager) {
      this.secretManager.setRepository(repo);
    }
    if (this.httpClient) {
      this.actionsGenerator = new GitHubActionsGenerator(this.httpClient, this.options.owner, repo);
    }
  }

  /**
   * Get current repository
   */
  getCurrentRepository(): GitHubRepository | undefined {
    return this.currentRepository;
  }
}