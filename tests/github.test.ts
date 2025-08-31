import { jest } from '@jest/globals';
import { GitHubIntegration } from '../src/github/GitHubIntegration';
import { GitHubRepoManager } from '../src/github/GitHubRepoManager';
import { GitHubAutoAuth } from '../src/github/GitHubAutoAuth';
import { GitHubActionsGenerator } from '../src/github/GitHubActionsGenerator';
import { GitHubSecretManager } from '../src/github/GitHubSecretManager';
import {
  GitHubAuthConfig,
  GitHubRepository,
  CreateRepositoryOptions,
  BranchProtectionOptions,
  WebhookConfig,
  CIPipelineConfig,
  SecurityScanConfig,
  GitHubSecret,
  GitHubUser,
  GitHubError,
  WorkflowRun
} from '../src/github/types';

// Mock external dependencies
jest.mock('axios');
jest.mock('fs-extra');
jest.mock('child_process');

describe('GitHub Integration System Tests', () => {
  let githubIntegration: GitHubIntegration;
  let repoManager: GitHubRepoManager;
  let autoAuth: GitHubAutoAuth;
  let actionsGenerator: GitHubActionsGenerator;
  let secretManager: GitHubSecretManager;

  const mockGitHubUser: GitHubUser = {
    login: 'testuser',
    id: 12345,
    nodeId: 'U_test123',
    avatarUrl: 'https://avatars.githubusercontent.com/u/12345',
    name: 'Test User',
    email: 'test@example.com',
    company: 'Test Corp',
    publicRepos: 10,
    publicGists: 5,
    followers: 100,
    following: 50,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    type: 'User'
  };

  const mockRepository: GitHubRepository = {
    id: 123456789,
    name: 'test-repo',
    fullName: 'testuser/test-repo',
    description: 'Test repository for integration tests',
    private: false,
    htmlUrl: 'https://github.com/testuser/test-repo',
    cloneUrl: 'https://github.com/testuser/test-repo.git',
    sshUrl: 'git@github.com:testuser/test-repo.git',
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    const authConfig: GitHubAuthConfig = {
      authMethod: 'token',
      token: 'test-token',
      username: 'testuser',
      email: 'test@example.com'
    };

    githubIntegration = new GitHubIntegration({
      owner: 'testuser',
      repo: 'test-repo',
      authConfig
    });

    repoManager = new GitHubRepoManager(githubIntegration);
    autoAuth = new GitHubAutoAuth();
    actionsGenerator = new GitHubActionsGenerator(githubIntegration);
    secretManager = new GitHubSecretManager(githubIntegration);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GitHubIntegration', () => {
    describe('Authentication', () => {
      it('should authenticate with token successfully', async () => {
        const mockApiResponse = {
          data: mockGitHubUser,
          status: 200,
          headers: {},
          rateLimitRemaining: 5000,
          rateLimitReset: new Date(Date.now() + 3600000)
        };

        // Mock the HTTP request
        const mockRequest = jest.fn().mockResolvedValue(mockApiResponse);
        (githubIntegration as any).request = mockRequest;

        const result = await githubIntegration.authenticate();

        expect(result.success).toBe(true);
        expect(result.method).toBe('token');
        expect(result.username).toBe('testuser');
        expect(mockRequest).toHaveBeenCalledWith('GET', '/user');
      });

      it('should handle authentication failure', async () => {
        const mockError: GitHubError = {
          message: 'Bad credentials',
          status: 401,
          code: 'bad_credentials'
        };

        const mockRequest = jest.fn().mockRejectedValue(mockError);
        (githubIntegration as any).request = mockRequest;

        const result = await githubIntegration.authenticate();

        expect(result.success).toBe(false);
        expect(result.error).toContain('Bad credentials');
      });

      it('should handle rate limiting gracefully', async () => {
        const mockError = {
          status: 429,
          headers: {
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': Math.floor((Date.now() + 3600000) / 1000).toString()
          }
        };

        const mockRequest = jest.fn().mockRejectedValue(mockError);
        (githubIntegration as any).request = mockRequest;

        const result = await githubIntegration.authenticate();

        expect(result.success).toBe(false);
        expect(result.error).toContain('Rate limit exceeded');
      });
    });

    describe('Repository Operations', () => {
      beforeEach(() => {
        const mockRequest = jest.fn()
          .mockResolvedValueOnce({
            data: mockGitHubUser,
            status: 200,
            headers: {}
          });
        (githubIntegration as any).request = mockRequest;
      });

      it('should get repository information', async () => {
        const mockRequest = jest.fn().mockResolvedValue({
          data: mockRepository,
          status: 200,
          headers: {}
        });
        (githubIntegration as any).request = mockRequest;

        const repository = await githubIntegration.getRepository();

        expect(repository).toEqual(mockRepository);
        expect(mockRequest).toHaveBeenCalledWith('GET', '/repos/testuser/test-repo');
      });

      it('should handle repository not found', async () => {
        const mockRequest = jest.fn().mockRejectedValue({
          status: 404,
          message: 'Not Found'
        });
        (githubIntegration as any).request = mockRequest;

        await expect(githubIntegration.getRepository()).rejects.toThrow('Not Found');
      });

      it('should list user repositories', async () => {
        const mockRepos = [mockRepository];
        const mockRequest = jest.fn().mockResolvedValue({
          data: mockRepos,
          status: 200,
          headers: {}
        });
        (githubIntegration as any).request = mockRequest;

        const repositories = await githubIntegration.listRepositories();

        expect(repositories).toEqual(mockRepos);
        expect(repositories).toHaveLength(1);
      });
    });

    describe('Workflow Management', () => {
      const mockWorkflowRun: WorkflowRun = {
        id: 987654321,
        nodeId: 'WR_test123',
        headBranch: 'main',
        headSha: 'abc123def456',
        runNumber: 42,
        status: 'completed',
        conclusion: 'success',
        workflowId: 12345,
        url: 'https://api.github.com/repos/testuser/test-repo/actions/runs/987654321',
        htmlUrl: 'https://github.com/testuser/test-repo/actions/runs/987654321',
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-01T10:05:00Z',
        runStartedAt: '2024-01-01T10:00:30Z',
        jobsUrl: 'https://api.github.com/repos/testuser/test-repo/actions/runs/987654321/jobs',
        logsUrl: 'https://api.github.com/repos/testuser/test-repo/actions/runs/987654321/logs',
        checkSuiteUrl: 'https://api.github.com/repos/testuser/test-repo/check-suites/123456',
        artifactsUrl: 'https://api.github.com/repos/testuser/test-repo/actions/runs/987654321/artifacts',
        cancelUrl: 'https://api.github.com/repos/testuser/test-repo/actions/runs/987654321/cancel',
        rerunUrl: 'https://api.github.com/repos/testuser/test-repo/actions/runs/987654321/rerun',
        headCommit: {
          sha: 'abc123def456',
          nodeId: 'C_test123',
          commit: {
            author: { name: 'Test User', email: 'test@example.com', date: '2024-01-01T10:00:00Z' },
            committer: { name: 'Test User', email: 'test@example.com', date: '2024-01-01T10:00:00Z' },
            message: 'Test commit',
            tree: { sha: 'tree123', url: 'https://api.github.com/repos/testuser/test-repo/git/trees/tree123' },
            url: 'https://api.github.com/repos/testuser/test-repo/git/commits/abc123def456',
            commentCount: 0
          },
          url: 'https://api.github.com/repos/testuser/test-repo/commits/abc123def456',
          htmlUrl: 'https://github.com/testuser/test-repo/commit/abc123def456',
          commentsUrl: 'https://api.github.com/repos/testuser/test-repo/commits/abc123def456/comments',
          author: mockGitHubUser,
          committer: mockGitHubUser,
          parents: []
        },
        repository: mockRepository
      };

      it('should get workflow runs', async () => {
        const mockRequest = jest.fn().mockResolvedValue({
          data: { workflow_runs: [mockWorkflowRun] },
          status: 200,
          headers: {}
        });
        (githubIntegration as any).request = mockRequest;

        const runs = await githubIntegration.getWorkflowRuns();

        expect(runs).toHaveLength(1);
        expect(runs[0]).toEqual(mockWorkflowRun);
      });

      it('should trigger workflow dispatch', async () => {
        const mockRequest = jest.fn().mockResolvedValue({
          status: 204,
          headers: {}
        });
        (githubIntegration as any).request = mockRequest;

        await githubIntegration.triggerWorkflow('ci.yml', 'main', { environment: 'test' });

        expect(mockRequest).toHaveBeenCalledWith(
          'POST',
          '/repos/testuser/test-repo/actions/workflows/ci.yml/dispatches',
          {
            ref: 'main',
            inputs: { environment: 'test' }
          }
        );
      });
    });
  });

  describe('GitHubRepoManager', () => {
    beforeEach(() => {
      const mockRequest = jest.fn()
        .mockResolvedValueOnce({
          data: mockGitHubUser,
          status: 200,
          headers: {}
        });
      (githubIntegration as any).request = mockRequest;
    });

    describe('Repository Creation', () => {
      it('should create a new repository with default options', async () => {
        const options: CreateRepositoryOptions = {
          name: 'new-test-repo',
          description: 'A new test repository',
          private: true
        };

        const expectedRepo = {
          ...mockRepository,
          name: options.name,
          fullName: `testuser/${options.name}`,
          description: options.description,
          private: options.private
        };

        const mockRequest = jest.fn().mockResolvedValue({
          data: expectedRepo,
          status: 201,
          headers: {}
        });
        (githubIntegration as any).request = mockRequest;

        const repository = await repoManager.createRepository(options);

        expect(repository).toEqual(expectedRepo);
        expect(mockRequest).toHaveBeenCalledWith('POST', '/user/repos', expect.objectContaining({
          name: options.name,
          description: options.description,
          private: options.private
        }));
      });

      it('should handle repository creation conflicts', async () => {
        const options: CreateRepositoryOptions = {
          name: 'existing-repo'
        };

        const mockRequest = jest.fn().mockRejectedValue({
          status: 422,
          message: 'Repository creation failed',
          errors: [{ field: 'name', code: 'already_exists', message: 'name already exists on this account' }]
        });
        (githubIntegration as any).request = mockRequest;

        await expect(repoManager.createRepository(options)).rejects.toThrow('Repository creation failed');
      });
    });

    describe('Branch Protection', () => {
      it('should set up branch protection rules', async () => {
        const protectionOptions: BranchProtectionOptions = {
          branch: 'main',
          requiredStatusChecks: {
            strict: true,
            contexts: ['continuous-integration']
          },
          enforceAdmins: true,
          requiredPullRequestReviews: {
            requiredApprovingReviewCount: 2,
            dismissStaleReviews: true,
            requireCodeOwnerReviews: true
          }
        };

        const mockRequest = jest.fn().mockResolvedValue({
          data: { protection: 'enabled' },
          status: 200,
          headers: {}
        });
        (githubIntegration as any).request = mockRequest;

        await repoManager.setBranchProtection(protectionOptions);

        expect(mockRequest).toHaveBeenCalledWith(
          'PUT',
          '/repos/testuser/test-repo/branches/main/protection',
          expect.objectContaining({
            required_status_checks: protectionOptions.requiredStatusChecks,
            enforce_admins: protectionOptions.enforceAdmins,
            required_pull_request_reviews: protectionOptions.requiredPullRequestReviews
          })
        );
      });

      it('should remove branch protection', async () => {
        const mockRequest = jest.fn().mockResolvedValue({
          status: 204,
          headers: {}
        });
        (githubIntegration as any).request = mockRequest;

        await repoManager.removeBranchProtection('main');

        expect(mockRequest).toHaveBeenCalledWith(
          'DELETE',
          '/repos/testuser/test-repo/branches/main/protection'
        );
      });
    });

    describe('Webhook Management', () => {
      it('should create webhooks', async () => {
        const webhookConfig: WebhookConfig = {
          name: 'web',
          url: 'https://example.com/webhook',
          secret: 'webhook-secret',
          events: ['push', 'pull_request'],
          active: true,
          contentType: 'json'
        };

        const mockRequest = jest.fn().mockResolvedValue({
          data: { id: 12345, ...webhookConfig },
          status: 201,
          headers: {}
        });
        (githubIntegration as any).request = mockRequest;

        const webhook = await repoManager.createWebhook(webhookConfig);

        expect(webhook.id).toBe(12345);
        expect(mockRequest).toHaveBeenCalledWith(
          'POST',
          '/repos/testuser/test-repo/hooks',
          expect.objectContaining({
            name: webhookConfig.name,
            config: {
              url: webhookConfig.url,
              content_type: webhookConfig.contentType,
              secret: webhookConfig.secret
            },
            events: webhookConfig.events,
            active: webhookConfig.active
          })
        );
      });
    });
  });

  describe('GitHubAutoAuth', () => {
    describe('Authentication Detection', () => {
      it('should detect CLI authentication', async () => {
        // Mock child_process.exec for `gh auth status`
        const mockExec = jest.fn().mockImplementation((cmd, callback) => {
          if (cmd.includes('gh auth status')) {
            callback(null, { stdout: 'Logged in to github.com as testuser', stderr: '' });
          }
        });
        require('child_process').exec = mockExec;

        const result = await autoAuth.detectAuth();

        expect(result.success).toBe(true);
        expect(result.method).toBe('cli');
        expect(result.username).toBe('testuser');
      });

      it('should detect SSH key authentication', async () => {
        // Mock fs-extra to simulate SSH key existence
        const mockFs = {
          pathExists: jest.fn().mockResolvedValue(true),
          readFile: jest.fn().mockResolvedValue('ssh-rsa AAAAB3N... test@example.com')
        };
        require('fs-extra').pathExists = mockFs.pathExists;
        require('fs-extra').readFile = mockFs.readFile;

        // Mock SSH key test
        const mockExec = jest.fn().mockImplementation((cmd, callback) => {
          if (cmd.includes('ssh -T git@github.com')) {
            callback(null, { stdout: '', stderr: 'Hi testuser! You\'ve successfully authenticated' });
          }
        });
        require('child_process').exec = mockExec;

        const result = await autoAuth.detectAuth();

        expect(result.success).toBe(true);
        expect(result.method).toBe('ssh');
      });

      it('should detect environment token', async () => {
        process.env.GITHUB_TOKEN = 'test-env-token';

        const result = await autoAuth.detectAuth();

        expect(result.success).toBe(true);
        expect(result.method).toBe('token');
        expect(result.token).toBe('test-env-token');

        delete process.env.GITHUB_TOKEN;
      });

      it('should handle no authentication available', async () => {
        // Mock all auth methods to fail
        const mockExec = jest.fn().mockImplementation((cmd, callback) => {
          callback(new Error('Command failed'), null);
        });
        require('child_process').exec = mockExec;

        const mockFs = {
          pathExists: jest.fn().mockResolvedValue(false)
        };
        require('fs-extra').pathExists = mockFs.pathExists;

        const result = await autoAuth.detectAuth();

        expect(result.success).toBe(false);
        expect(result.error).toContain('No authentication method');
      });
    });

    describe('OAuth Device Flow', () => {
      it('should initiate device flow authentication', async () => {
        const mockDeviceResponse = {
          deviceCode: 'ABC123',
          userCode: 'WXYZ-1234',
          verificationUri: 'https://github.com/login/device',
          expiresIn: 900,
          interval: 5
        };

        // Mock HTTP request for device flow
        const mockRequest = jest.fn().mockResolvedValue({
          data: mockDeviceResponse,
          status: 200
        });

        const deviceAuth = await autoAuth.initiateDeviceFlow();

        expect(deviceAuth.deviceCode).toBe('ABC123');
        expect(deviceAuth.userCode).toBe('WXYZ-1234');
        expect(deviceAuth.verificationUri).toBe('https://github.com/login/device');
      });

      it('should poll for device flow completion', async () => {
        const mockTokenResponse = {
          accessToken: 'gho_test_token_123',
          tokenType: 'bearer',
          scope: 'repo'
        };

        // Mock polling response
        const mockRequest = jest.fn()
          .mockRejectedValueOnce({ status: 428 }) // authorization_pending
          .mockRejectedValueOnce({ status: 428 }) // authorization_pending
          .mockResolvedValueOnce({
            data: mockTokenResponse,
            status: 200
          });

        const token = await autoAuth.pollDeviceFlow('ABC123', 1); // 1 second interval for testing

        expect(token.accessToken).toBe('gho_test_token_123');
        expect(mockRequest).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('GitHubActionsGenerator', () => {
    describe('CI Pipeline Generation', () => {
      it('should generate Node.js CI workflow', async () => {
        const ciConfig: CIPipelineConfig = {
          languages: ['javascript'],
          nodeVersion: ['16', '18', '20'],
          testCommand: 'npm test',
          buildCommand: 'npm run build',
          lintCommand: 'npm run lint',
          cacheDirectories: ['node_modules', '.npm']
        };

        const workflow = await actionsGenerator.generateCIPipeline(ciConfig);

        expect(workflow.name).toBe('CI');
        expect(workflow.on).toHaveProperty('push');
        expect(workflow.on).toHaveProperty('pull_request');
        expect(workflow.jobs.test).toBeDefined();
        
        const testJob = workflow.jobs.test;
        expect(testJob.strategy.matrix['node-version']).toEqual(['16', '18', '20']);
        expect(testJob.steps).toEqual(expect.arrayContaining([
          expect.objectContaining({ name: expect.stringMatching(/checkout/i) }),
          expect.objectContaining({ name: expect.stringMatching(/node/i) }),
          expect.objectContaining({ run: expect.stringContaining('npm test') })
        ]));
      });

      it('should generate Python CI workflow', async () => {
        const ciConfig: CIPipelineConfig = {
          languages: ['python'],
          pythonVersion: ['3.8', '3.9', '3.10'],
          testCommand: 'pytest',
          lintCommand: 'flake8 .'
        };

        const workflow = await actionsGenerator.generateCIPipeline(ciConfig);

        const testJob = workflow.jobs.test;
        expect(testJob.strategy.matrix['python-version']).toEqual(['3.8', '3.9', '3.10']);
        expect(testJob.steps).toEqual(expect.arrayContaining([
          expect.objectContaining({ name: expect.stringMatching(/python/i) }),
          expect.objectContaining({ run: expect.stringContaining('pytest') })
        ]));
      });
    });

    describe('Security Workflows', () => {
      it('should generate security scanning workflow', async () => {
        const securityConfig: SecurityScanConfig = {
          enableCodeQL: true,
          enableDependencyReview: true,
          enableSecretScanning: true,
          codeQLLanguages: ['javascript', 'python']
        };

        const workflow = await actionsGenerator.generateSecurityWorkflow(securityConfig);

        expect(workflow.name).toBe('Security');
        expect(workflow.jobs.codeql).toBeDefined();
        expect(workflow.jobs.dependency_review).toBeDefined();
        
        const codeqlJob = workflow.jobs.codeql;
        expect(codeqlJob.strategy.matrix.language).toEqual(['javascript', 'python']);
      });
    });

    describe('Deployment Workflows', () => {
      it('should generate Vercel deployment workflow', async () => {
        const deployConfig = {
          environment: 'production',
          provider: 'vercel' as const,
          buildCommand: 'npm run build',
          outputDirectory: 'dist'
        };

        const workflow = await actionsGenerator.generateDeploymentWorkflow(deployConfig);

        expect(workflow.name).toBe('Deploy to Production');
        expect(workflow.jobs.deploy).toBeDefined();
        expect(workflow.jobs.deploy.steps).toEqual(expect.arrayContaining([
          expect.objectContaining({ name: expect.stringMatching(/vercel/i) })
        ]));
      });
    });
  });

  describe('GitHubSecretManager', () => {
    describe('Secret Operations', () => {
      it('should create repository secret', async () => {
        const secret: GitHubSecret = {
          name: 'DATABASE_URL',
          value: 'postgresql://localhost:5432/test'
        };

        const mockRequest = jest.fn().mockResolvedValue({
          status: 201,
          headers: {}
        });
        (githubIntegration as any).request = mockRequest;

        await secretManager.createSecret(secret);

        expect(mockRequest).toHaveBeenCalledWith(
          'PUT',
          '/repos/testuser/test-repo/actions/secrets/DATABASE_URL',
          expect.objectContaining({
            encrypted_value: expect.any(String),
            key_id: expect.any(String)
          })
        );
      });

      it('should list repository secrets', async () => {
        const mockSecrets = {
          total_count: 2,
          secrets: [
            { name: 'SECRET_ONE', created_at: '2023-01-01T00:00:00Z', updated_at: '2023-01-01T00:00:00Z' },
            { name: 'SECRET_TWO', created_at: '2023-01-02T00:00:00Z', updated_at: '2023-01-02T00:00:00Z' }
          ]
        };

        const mockRequest = jest.fn().mockResolvedValue({
          data: mockSecrets,
          status: 200,
          headers: {}
        });
        (githubIntegration as any).request = mockRequest;

        const secrets = await secretManager.listSecrets();

        expect(secrets).toHaveLength(2);
        expect(secrets[0].name).toBe('SECRET_ONE');
        expect(secrets[1].name).toBe('SECRET_TWO');
      });

      it('should delete repository secret', async () => {
        const mockRequest = jest.fn().mockResolvedValue({
          status: 204,
          headers: {}
        });
        (githubIntegration as any).request = mockRequest;

        await secretManager.deleteSecret('OLD_SECRET');

        expect(mockRequest).toHaveBeenCalledWith(
          'DELETE',
          '/repos/testuser/test-repo/actions/secrets/OLD_SECRET'
        );
      });
    });

    describe('Bulk Secret Operations', () => {
      it('should sync secrets from environment file', async () => {
        const mockEnvContent = `
# Database configuration
DATABASE_URL=postgresql://localhost:5432/test
API_KEY=sk-test-12345

# Optional secrets
DEBUG=true
`;

        // Mock fs.readFile
        require('fs-extra').readFile = jest.fn().mockResolvedValue(mockEnvContent);

        const mockRequest = jest.fn().mockResolvedValue({
          status: 201,
          headers: {}
        });
        (githubIntegration as any).request = mockRequest;

        const result = await secretManager.syncFromEnvFile('.env.example');

        expect(result.total).toBe(3);
        expect(result.successful).toBe(3);
        expect(result.failed).toBe(0);
        expect(result.results).toHaveLength(3);
      });

      it('should handle partial sync failures', async () => {
        const secrets: GitHubSecret[] = [
          { name: 'VALID_SECRET', value: 'value1' },
          { name: 'INVALID_SECRET_NAME!', value: 'value2' }, // Invalid name
          { name: 'ANOTHER_VALID', value: 'value3' }
        ];

        const mockRequest = jest.fn()
          .mockResolvedValueOnce({ status: 201 }) // First secret succeeds
          .mockRejectedValueOnce({ status: 422, message: 'Invalid secret name' }) // Second fails
          .mockResolvedValueOnce({ status: 201 }); // Third succeeds
        (githubIntegration as any).request = mockRequest;

        const result = await secretManager.bulkCreateSecrets(secrets);

        expect(result.total).toBe(3);
        expect(result.successful).toBe(2);
        expect(result.failed).toBe(1);
        expect(result.results.find(r => !r.success)?.secretName).toBe('INVALID_SECRET_NAME!');
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle concurrent API requests efficiently', async () => {
      const mockRequest = jest.fn().mockResolvedValue({
        data: mockRepository,
        status: 200,
        headers: {}
      });
      (githubIntegration as any).request = mockRequest;

      const startTime = Date.now();
      
      // Make 10 concurrent requests
      const promises = Array(10).fill(null).map(() => githubIntegration.getRepository());
      await Promise.all(promises);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in reasonable time (less than 1 second for mocked requests)
      expect(duration).toBeLessThan(1000);
      expect(mockRequest).toHaveBeenCalledTimes(10);
    });

    it('should implement request caching for repeated calls', async () => {
      const mockRequest = jest.fn().mockResolvedValue({
        data: mockRepository,
        status: 200,
        headers: {}
      });
      (githubIntegration as any).request = mockRequest;

      // Enable caching (assuming the integration supports it)
      githubIntegration.enableCache = true;

      // Make the same request multiple times
      await githubIntegration.getRepository();
      await githubIntegration.getRepository();
      await githubIntegration.getRepository();

      // Should only make one actual API call due to caching
      expect(mockRequest).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should retry on transient failures', async () => {
      const mockRequest = jest.fn()
        .mockRejectedValueOnce({ status: 500, message: 'Internal Server Error' })
        .mockRejectedValueOnce({ status: 502, message: 'Bad Gateway' })
        .mockResolvedValueOnce({
          data: mockRepository,
          status: 200,
          headers: {}
        });
      (githubIntegration as any).request = mockRequest;

      const repository = await githubIntegration.getRepository();

      expect(repository).toEqual(mockRepository);
      expect(mockRequest).toHaveBeenCalledTimes(3);
    });

    it('should implement circuit breaker for repeated failures', async () => {
      const mockRequest = jest.fn().mockRejectedValue({
        status: 500,
        message: 'Internal Server Error'
      });
      (githubIntegration as any).request = mockRequest;

      // Make multiple failing requests
      for (let i = 0; i < 5; i++) {
        try {
          await githubIntegration.getRepository();
        } catch (error) {
          // Expected to fail
        }
      }

      // Circuit breaker should be open now
      const startTime = Date.now();
      try {
        await githubIntegration.getRepository();
      } catch (error) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Should fail fast due to circuit breaker (< 100ms)
        expect(duration).toBeLessThan(100);
      }
    });

    it('should validate input parameters', async () => {
      await expect(repoManager.createRepository({ name: '' }))
        .rejects.toThrow('Repository name is required');

      await expect(repoManager.createRepository({ name: 'invalid name with spaces!' }))
        .rejects.toThrow('Invalid repository name');

      await expect(secretManager.createSecret({ name: '', value: 'test' }))
        .rejects.toThrow('Secret name is required');

      await expect(secretManager.createSecret({ name: 'VALID_NAME', value: '' }))
        .rejects.toThrow('Secret value is required');
    });
  });

  describe('Integration Status and Health', () => {
    it('should provide integration status', async () => {
      const mockRequest = jest.fn()
        .mockResolvedValueOnce({
          data: mockGitHubUser,
          status: 200,
          headers: {
            'x-ratelimit-remaining': '4999',
            'x-ratelimit-reset': Math.floor((Date.now() + 3600000) / 1000).toString()
          }
        })
        .mockResolvedValueOnce({
          data: mockRepository,
          status: 200,
          headers: {}
        });
      (githubIntegration as any).request = mockRequest;

      const status = await githubIntegration.getStatus();

      expect(status.authenticated).toBe(true);
      expect(status.username).toBe('testuser');
      expect(status.rateLimitRemaining).toBeGreaterThan(4000);
      expect(status.repository).toEqual(mockRepository);
    });

    it('should track operation history', async () => {
      const mockRequest = jest.fn().mockResolvedValue({
        data: mockRepository,
        status: 200,
        headers: {}
      });
      (githubIntegration as any).request = mockRequest;

      await githubIntegration.getRepository();
      
      const status = await githubIntegration.getStatus();
      
      expect(status.lastOperation).toBeDefined();
      expect(status.lastOperation?.type).toBe('getRepository');
      expect(status.lastOperation?.success).toBe(true);
      expect(status.lastOperation?.timestamp).toBeInstanceOf(Date);
    });
  });
});