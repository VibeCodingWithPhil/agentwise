import { AxiosInstance } from 'axios';
import * as yaml from 'js-yaml';
import {
  WorkflowTemplate,
  GitHubAction,
  CIPipelineConfig,
  DeploymentConfig,
  SecurityScanConfig
} from './types';

interface WorkflowStep {
  name: string;
  uses?: string;
  run?: string;
  with?: Record<string, any>;
  env?: Record<string, any>;
  if?: string;
}

export class GitHubActionsGenerator {
  private httpClient: AxiosInstance;
  private owner: string;
  private repo: string;

  constructor(httpClient: AxiosInstance, owner: string, repo: string) {
    this.httpClient = httpClient;
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Generate CI pipeline workflow
   */
  generateCIWorkflow(config: CIPipelineConfig): WorkflowTemplate {
    const workflow: GitHubAction = {
      name: 'CI Pipeline',
      on: {
        push: {
          branches: ['main', 'master', 'develop']
        },
        pull_request: {
          branches: ['main', 'master', 'develop']
        }
      },
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          strategy: this.generateStrategy(config),
          steps: this.generateCISteps(config) as any
        }
      }
    };

    if (config.cacheDirectories && config.cacheDirectories.length > 0) {
      workflow.env = {
        CI: 'true'
      };
    }

    return {
      name: 'ci.yml',
      description: 'Continuous Integration pipeline',
      type: 'ci',
      content: this.workflowToYAML(workflow),
      variables: config
    };
  }

  /**
   * Generate CD/deployment workflow
   */
  generateDeploymentWorkflow(config: DeploymentConfig): WorkflowTemplate {
    const workflow: GitHubAction = {
      name: `Deploy to ${config.environment}`,
      on: {
        push: {
          branches: config.environment === 'production' ? ['main', 'master'] : ['develop']
        },
        workflow_run: {
          workflows: ['CI Pipeline'],
          types: ['completed'],
          branches: ['main', 'master']
        }
      },
      jobs: {
        deploy: {
          'runs-on': 'ubuntu-latest',
          if: "${{ github.event.workflow_run.conclusion == 'success' || github.event_name == 'push' }}",
          environment: config.environment,
          steps: this.generateDeploymentSteps(config) as any
        }
      }
    };

    return {
      name: `deploy-${config.environment}.yml`,
      description: `Deployment workflow for ${config.environment}`,
      type: 'cd',
      content: this.workflowToYAML(workflow),
      variables: config
    };
  }

  /**
   * Generate security scanning workflow
   */
  generateSecurityWorkflow(config: SecurityScanConfig): WorkflowTemplate {
    const jobs: Record<string, any> = {};

    // CodeQL Analysis
    if (config.enableCodeQL) {
      jobs.codeql = {
        'runs-on': 'ubuntu-latest',
        permissions: {
          actions: 'read',
          contents: 'read',
          'security-events': 'write'
        },
        steps: [
          {
            name: 'Checkout code',
            uses: 'actions/checkout@v4'
          },
          {
            name: 'Initialize CodeQL',
            uses: 'github/codeql-action/init@v2',
            with: {
              languages: config.codeQLLanguages?.join(', ') || 'javascript,typescript'
            }
          },
          {
            name: 'Autobuild',
            uses: 'github/codeql-action/autobuild@v2'
          },
          {
            name: 'Perform CodeQL Analysis',
            uses: 'github/codeql-action/analyze@v2'
          }
        ]
      };
    }

    // Dependency Review
    if (config.enableDependencyReview) {
      jobs['dependency-review'] = {
        'runs-on': 'ubuntu-latest',
        if: "${{ github.event_name == 'pull_request' }}",
        steps: [
          {
            name: 'Checkout code',
            uses: 'actions/checkout@v4'
          },
          {
            name: 'Dependency Review',
            uses: 'actions/dependency-review-action@v3'
          }
        ]
      };
    }

    // Secret Scanning
    if (config.enableSecretScanning) {
      jobs['secret-scan'] = {
        'runs-on': 'ubuntu-latest',
        steps: [
          {
            name: 'Checkout code',
            uses: 'actions/checkout@v4'
          },
          {
            name: 'Run Trivy vulnerability scanner',
            uses: 'aquasecurity/trivy-action@master',
            with: {
              'scan-type': 'fs',
              'scan-ref': '.',
              format: 'sarif',
              'output': 'trivy-results.sarif'
            }
          },
          {
            name: 'Upload Trivy scan results to GitHub Security tab',
            uses: 'github/codeql-action/upload-sarif@v2',
            if: 'always()',
            with: {
              'sarif_file': 'trivy-results.sarif'
            }
          }
        ]
      };
    }

    const workflow: GitHubAction = {
      name: 'Security Scanning',
      on: {
        push: {
          branches: ['main', 'master', 'develop']
        },
        pull_request: {
          branches: ['main', 'master', 'develop']
        },
        schedule: [
          {
            cron: '0 6 * * 1' // Weekly on Monday at 6 AM
          }
        ]
      },
      jobs
    };

    return {
      name: 'security.yml',
      description: 'Security scanning and analysis',
      type: 'security',
      content: this.workflowToYAML(workflow),
      variables: config
    };
  }

  /**
   * Generate test workflow
   */
  generateTestWorkflow(config: CIPipelineConfig): WorkflowTemplate {
    const workflow: GitHubAction = {
      name: 'Tests',
      on: {
        push: {
          branches: ['**']
        },
        pull_request: {
          branches: ['main', 'master', 'develop']
        }
      },
      jobs: {
        test: {
          'runs-on': 'ubuntu-latest',
          strategy: this.generateStrategy(config),
          steps: [
            {
              name: 'Checkout code',
              uses: 'actions/checkout@v4'
            },
            ...this.generateLanguageSetupSteps(config) as any,
            ...this.generateCacheSteps(config) as any,
            {
              name: 'Install dependencies',
              run: this.getInstallCommand(config.languages)
            },
            {
              name: 'Run tests',
              run: config.testCommand || this.getDefaultTestCommand(config.languages)
            },
            {
              name: 'Upload coverage reports',
              uses: 'codecov/codecov-action@v3',
              if: "${{ success() }}",
              with: {
                token: "${{ secrets.CODECOV_TOKEN }}",
                files: './coverage/lcov.info',
                'fail_ci_if_error': false
              }
            }
          ]
        }
      }
    };

    return {
      name: 'test.yml',
      description: 'Test suite execution',
      type: 'test',
      content: this.workflowToYAML(workflow),
      variables: config
    };
  }

  /**
   * Create workflow file in repository
   */
  async createWorkflow(template: WorkflowTemplate): Promise<void> {
    try {
      const path = `.github/workflows/${template.name}`;
      const message = `Add ${template.description} workflow`;

      // Check if file already exists
      let sha: string | undefined;
      try {
        const existingFile = await this.httpClient.get(`/repos/${this.owner}/${this.repo}/contents/${path}`);
        sha = existingFile.data.sha;
      } catch {
        // File doesn't exist, which is fine
      }

      const payload: any = {
        message,
        content: Buffer.from(template.content).toString('base64'),
        branch: 'main'
      };

      if (sha) {
        payload.sha = sha;
      }

      await this.httpClient.put(`/repos/${this.owner}/${this.repo}/contents/${path}`, payload);
    } catch (error: any) {
      throw new Error(`Failed to create workflow: ${error.message}`);
    }
  }

  /**
   * List existing workflows
   */
  async listWorkflows(): Promise<any[]> {
    try {
      const response = await this.httpClient.get(`/repos/${this.owner}/${this.repo}/actions/workflows`);
      return response.data.workflows;
    } catch (error: any) {
      throw new Error(`Failed to list workflows: ${error.message}`);
    }
  }

  /**
   * Delete workflow file
   */
  async deleteWorkflow(workflowName: string): Promise<void> {
    try {
      const path = `.github/workflows/${workflowName}`;
      
      // Get file SHA
      const fileResponse = await this.httpClient.get(`/repos/${this.owner}/${this.repo}/contents/${path}`);
      const sha = fileResponse.data.sha;

      // Delete file
      await this.httpClient.delete(`/repos/${this.owner}/${this.repo}/contents/${path}`, {
        data: {
          message: `Remove ${workflowName} workflow`,
          sha,
          branch: 'main'
        }
      });
    } catch (error: any) {
      throw new Error(`Failed to delete workflow: ${error.message}`);
    }
  }

  /**
   * Generate custom workflow from template
   */
  generateCustomWorkflow(
    name: string,
    triggers: any,
    jobs: Record<string, any>,
    env?: Record<string, any>
  ): WorkflowTemplate {
    const workflow: GitHubAction = {
      name,
      on: triggers,
      jobs,
      env
    };

    return {
      name: `${name.toLowerCase().replace(/\s+/g, '-')}.yml`,
      description: `Custom workflow: ${name}`,
      type: 'custom',
      content: this.workflowToYAML(workflow)
    };
  }

  /**
   * Generate strategy matrix for different language versions
   */
  private generateStrategy(config: CIPipelineConfig): any {
    const matrix: any = {};

    if (config.nodeVersion && config.nodeVersion.length > 1) {
      matrix['node-version'] = config.nodeVersion;
    }
    if (config.pythonVersion && config.pythonVersion.length > 1) {
      matrix['python-version'] = config.pythonVersion;
    }
    if (config.javaVersion && config.javaVersion.length > 1) {
      matrix['java-version'] = config.javaVersion;
    }
    if (config.goVersion && config.goVersion.length > 1) {
      matrix['go-version'] = config.goVersion;
    }

    return Object.keys(matrix).length > 0 ? { matrix } : undefined;
  }

  /**
   * Generate CI steps based on configuration
   */
  private generateCISteps(config: CIPipelineConfig): any[] {
    const steps: any[] = [
      {
        name: 'Checkout code',
        uses: 'actions/checkout@v4'
      }
    ];

    steps.push(...this.generateLanguageSetupSteps(config) as any);
    steps.push(...this.generateCacheSteps(config) as any);

    steps.push({
      name: 'Install dependencies',
      run: this.getInstallCommand(config.languages)
    });

    if (config.lintCommand) {
      steps.push({
        name: 'Run linting',
        run: config.lintCommand
      });
    }

    if (config.testCommand) {
      steps.push({
        name: 'Run tests',
        run: config.testCommand
      });
    }

    if (config.buildCommand) {
      steps.push({
        name: 'Build project',
        run: config.buildCommand
      });
    }

    return steps;
  }

  /**
   * Generate deployment steps based on provider
   */
  private generateDeploymentSteps(config: DeploymentConfig): any[] {
    const steps: any[] = [
      {
        name: 'Checkout code',
        uses: 'actions/checkout@v4'
      }
    ];

    // Add build steps if needed
    if (config.buildCommand) {
      steps.push({
        name: 'Build project',
        run: config.buildCommand
      });
    }

    // Provider-specific deployment steps
    switch (config.provider) {
      case 'vercel':
        steps.push({
          name: 'Deploy to Vercel',
          uses: 'amondnet/vercel-action@v25',
          with: {
            'vercel-token': '${{ secrets.VERCEL_TOKEN }}',
            'vercel-org-id': '${{ secrets.VERCEL_ORG_ID }}',
            'vercel-project-id': '${{ secrets.VERCEL_PROJECT_ID }}',
            'working-directory': config.outputDirectory || './',
            'scope': '${{ secrets.VERCEL_ORG_ID }}'
          }
        });
        break;

      case 'netlify':
        steps.push({
          name: 'Deploy to Netlify',
          uses: 'nwtgck/actions-netlify@v2.1',
          with: {
            'publish-dir': config.outputDirectory || './dist',
            'production-branch': 'main',
            'github-token': '${{ secrets.GITHUB_TOKEN }}',
            'deploy-message': 'Deploy from GitHub Actions',
            'enable-pull-request-comment': false,
            'enable-commit-comment': true,
            'overwrites-pull-request-comment': true
          },
          env: {
            NETLIFY_AUTH_TOKEN: '${{ secrets.NETLIFY_AUTH_TOKEN }}',
            NETLIFY_SITE_ID: '${{ secrets.NETLIFY_SITE_ID }}'
          }
        });
        break;

      case 'heroku':
        steps.push({
          name: 'Deploy to Heroku',
          uses: 'akhileshns/heroku-deploy@v3.12.14',
          with: {
            heroku_api_key: '${{ secrets.HEROKU_API_KEY }}',
            heroku_app_name: '${{ secrets.HEROKU_APP_NAME }}',
            heroku_email: '${{ secrets.HEROKU_EMAIL }}'
          }
        });
        break;

      case 'aws':
        steps.push({
          name: 'Configure AWS credentials',
          uses: 'aws-actions/configure-aws-credentials@v4',
          with: {
            'aws-access-key-id': '${{ secrets.AWS_ACCESS_KEY_ID }}',
            'aws-secret-access-key': '${{ secrets.AWS_SECRET_ACCESS_KEY }}',
            'aws-region': '${{ secrets.AWS_REGION || "us-east-1" }}'
          }
        });
        
        if (config.deployScript) {
          steps.push({
            name: 'Deploy to AWS',
            run: config.deployScript
          });
        }
        break;

      case 'custom':
        if (config.deployScript) {
          steps.push({
            name: 'Custom deployment',
            run: config.deployScript
          });
        }
        break;

      default:
        steps.push({
          name: 'Custom deployment step',
          run: config.deployScript || 'echo "No deployment script provided"'
        });
    }

    return steps;
  }

  /**
   * Generate language setup steps
   */
  private generateLanguageSetupSteps(config: CIPipelineConfig): any[] {
    const steps: any[] = [];

    if (config.languages.includes('javascript') || config.languages.includes('typescript')) {
      steps.push({
        name: 'Setup Node.js',
        uses: 'actions/setup-node@v4',
        with: {
          'node-version': config.nodeVersion?.[0] || '18'
        }
      });
    }

    if (config.languages.includes('python')) {
      steps.push({
        name: 'Setup Python',
        uses: 'actions/setup-python@v4',
        with: {
          'python-version': config.pythonVersion?.[0] || '3.9'
        }
      });
    }

    if (config.languages.includes('java')) {
      steps.push({
        name: 'Setup Java',
        uses: 'actions/setup-java@v3',
        with: {
          'java-version': config.javaVersion?.[0] || '11',
          'distribution': 'temurin'
        }
      });
    }

    if (config.languages.includes('go')) {
      steps.push({
        name: 'Setup Go',
        uses: 'actions/setup-go@v4',
        with: {
          'go-version': config.goVersion?.[0] || '1.21'
        }
      });
    }

    return steps;
  }

  /**
   * Generate caching steps for dependencies
   */
  private generateCacheSteps(config: CIPipelineConfig): any[] {
    const steps: any[] = [];

    if (config.languages.includes('javascript') || config.languages.includes('typescript')) {
      steps.push({
        name: 'Cache Node.js modules',
        uses: 'actions/cache@v3',
        with: {
          path: '~/.npm\nnode_modules',
          key: "${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}",
          'restore-keys': '${{ runner.os }}-node-'
        }
      });
    }

    if (config.languages.includes('python')) {
      steps.push({
        name: 'Cache Python packages',
        uses: 'actions/cache@v3',
        with: {
          path: '~/.cache/pip',
          key: "${{ runner.os }}-pip-${{ hashFiles('**/requirements*.txt') }}",
          'restore-keys': '${{ runner.os }}-pip-'
        }
      });
    }

    if (config.languages.includes('go')) {
      steps.push({
        name: 'Cache Go modules',
        uses: 'actions/cache@v3',
        with: {
          path: '~/go/pkg/mod',
          key: "${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}",
          'restore-keys': '${{ runner.os }}-go-'
        }
      });
    }

    return steps;
  }

  /**
   * Get install command based on languages
   */
  private getInstallCommand(languages: string[]): string {
    if (languages.includes('javascript') || languages.includes('typescript')) {
      return 'npm ci';
    }
    if (languages.includes('python')) {
      return 'pip install -r requirements.txt';
    }
    if (languages.includes('go')) {
      return 'go mod download';
    }
    if (languages.includes('java')) {
      return './gradlew build --no-daemon';
    }
    return 'echo "No install command specified"';
  }

  /**
   * Get default test command based on languages
   */
  private getDefaultTestCommand(languages: string[]): string {
    if (languages.includes('javascript') || languages.includes('typescript')) {
      return 'npm test';
    }
    if (languages.includes('python')) {
      return 'python -m pytest';
    }
    if (languages.includes('go')) {
      return 'go test ./...';
    }
    if (languages.includes('java')) {
      return './gradlew test';
    }
    return 'echo "No test command specified"';
  }

  /**
   * Convert workflow object to YAML string
   */
  private workflowToYAML(workflow: GitHubAction): string {
    return yaml.dump(workflow, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
  }

  /**
   * Validate workflow YAML
   */
  validateWorkflow(content: string): boolean {
    try {
      yaml.load(content);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get workflow templates for common scenarios
   */
  getTemplateLibrary(): Record<string, () => WorkflowTemplate> {
    return {
      'node-ci': () => this.generateCIWorkflow({
        languages: ['javascript', 'typescript'],
        nodeVersion: ['16', '18', '20'],
        testCommand: 'npm test',
        buildCommand: 'npm run build',
        lintCommand: 'npm run lint'
      }),
      
      'python-ci': () => this.generateCIWorkflow({
        languages: ['python'],
        pythonVersion: ['3.8', '3.9', '3.10'],
        testCommand: 'python -m pytest',
        lintCommand: 'flake8'
      }),
      
      'go-ci': () => this.generateCIWorkflow({
        languages: ['go'],
        goVersion: ['1.20', '1.21'],
        testCommand: 'go test ./...',
        buildCommand: 'go build'
      }),
      
      'security-scan': () => this.generateSecurityWorkflow({
        enableCodeQL: true,
        enableDependencyReview: true,
        enableSecretScanning: true,
        codeQLLanguages: ['javascript', 'typescript']
      })
    };
  }
}