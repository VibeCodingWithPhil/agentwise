import { AxiosInstance } from 'axios';
import { exec, execFile } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { promisify } from 'util';
import {
  GitHubRepository,
  CreateRepositoryOptions,
  BranchProtectionOptions,
  WebhookConfig,
  GitHubAPIResponse,
  GitHubError,
  GitHubCommit,
  WorkflowRun
} from './types';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export class GitHubRepoManager {
  private httpClient: AxiosInstance;
  private owner: string;

  constructor(httpClient: AxiosInstance, owner: string) {
    this.httpClient = httpClient;
    this.owner = owner;
  }

  /**
   * Create a new repository
   */
  async createRepository(options: CreateRepositoryOptions): Promise<GitHubRepository> {
    try {
      const payload = {
        name: options.name,
        description: options.description,
        private: options.private ?? false,
        gitignore_template: options.gitignoreTemplate,
        license_template: options.licenseTemplate,
        allow_squash_merge: options.allowSquashMerge ?? true,
        allow_merge_commit: options.allowMergeCommit ?? true,
        allow_rebase_merge: options.allowRebaseMerge ?? true,
        delete_branch_on_merge: options.deleteBranchOnMerge ?? true,
        has_issues: options.hasIssues ?? true,
        has_projects: options.hasProjects ?? true,
        has_wiki: options.hasWiki ?? false,
        auto_init: true // Always initialize with README
      };

      const response = await this.httpClient.post('/user/repos', payload);
      return this.transformRepository(response.data);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create repository');
    }
  }

  /**
   * Get repository details
   */
  async getRepository(repo: string): Promise<GitHubRepository> {
    try {
      const response = await this.httpClient.get(`/repos/${this.owner}/${repo}`);
      return this.transformRepository(response.data);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get repository');
    }
  }

  /**
   * List repositories for the authenticated user
   */
  async listRepositories(options: {
    type?: 'owner' | 'member' | 'all';
    sort?: 'created' | 'updated' | 'pushed' | 'full_name';
    direction?: 'asc' | 'desc';
    per_page?: number;
  } = {}): Promise<GitHubRepository[]> {
    try {
      const params = {
        type: options.type || 'owner',
        sort: options.sort || 'updated',
        direction: options.direction || 'desc',
        per_page: options.per_page || 30
      };

      const response = await this.httpClient.get('/user/repos', { params });
      return response.data.map((repo: any) => this.transformRepository(repo));
    } catch (error: any) {
      throw this.handleError(error, 'Failed to list repositories');
    }
  }

  /**
   * Connect to existing repository (verify access)
   */
  async connectToRepository(repo: string): Promise<GitHubRepository> {
    try {
      const repository = await this.getRepository(repo);
      
      // Verify we have push access
      if (!repository.permissions?.push) {
        throw new Error('No push access to repository');
      }

      return repository;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to connect to repository');
    }
  }

  /**
   * Set up branch protection rules
   */
  async setupBranchProtection(repo: string, protection: BranchProtectionOptions): Promise<void> {
    try {
      const payload: any = {
        required_status_checks: protection.requiredStatusChecks ? {
          strict: protection.requiredStatusChecks.strict,
          contexts: protection.requiredStatusChecks.contexts
        } : null,
        enforce_admins: protection.enforceAdmins ?? false,
        required_pull_request_reviews: protection.requiredPullRequestReviews ? {
          required_approving_review_count: protection.requiredPullRequestReviews.requiredApprovingReviewCount,
          dismiss_stale_reviews: protection.requiredPullRequestReviews.dismissStaleReviews,
          require_code_owner_reviews: protection.requiredPullRequestReviews.requireCodeOwnerReviews,
          dismissal_restrictions: protection.requiredPullRequestReviews.dismissalRestrictions ? {
            users: protection.requiredPullRequestReviews.dismissalRestrictions.users,
            teams: protection.requiredPullRequestReviews.dismissalRestrictions.teams
          } : null
        } : null,
        restrictions: protection.restrictions ? {
          users: protection.restrictions.users,
          teams: protection.restrictions.teams,
          apps: protection.restrictions.apps
        } : null
      };

      await this.httpClient.put(
        `/repos/${this.owner}/${repo}/branches/${protection.branch}/protection`,
        payload
      );
    } catch (error: any) {
      throw this.handleError(error, 'Failed to setup branch protection');
    }
  }

  /**
   * Configure webhook for repository
   */
  async configureWebhook(repo: string, webhook: WebhookConfig): Promise<any> {
    try {
      const payload = {
        name: webhook.name,
        config: {
          url: webhook.url,
          content_type: webhook.contentType,
          secret: webhook.secret,
          insecure_ssl: '0'
        },
        events: webhook.events,
        active: webhook.active
      };

      const response = await this.httpClient.post(
        `/repos/${this.owner}/${repo}/hooks`,
        payload
      );

      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to configure webhook');
    }
  }

  /**
   * List webhooks for repository
   */
  async listWebhooks(repo: string): Promise<any[]> {
    try {
      const response = await this.httpClient.get(`/repos/${this.owner}/${repo}/hooks`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to list webhooks');
    }
  }

  /**
   * Delete webhook
   */
  async deleteWebhook(repo: string, hookId: number): Promise<void> {
    try {
      await this.httpClient.delete(`/repos/${this.owner}/${repo}/hooks/${hookId}`);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to delete webhook');
    }
  }

  /**
   * Create initial commit with files
   */
  async createInitialCommit(repo: string, files: Record<string, string>, message: string = 'Initial commit'): Promise<GitHubCommit> {
    try {
      // Get the repository to find the default branch
      const repository = await this.getRepository(repo);
      const branch = repository.defaultBranch;

      // Get the current commit SHA (if any)
      let parentSha: string | undefined;
      try {
        const branchResponse = await this.httpClient.get(`/repos/${this.owner}/${repo}/branches/${branch}`);
        parentSha = branchResponse.data.commit.sha;
      } catch {
        // Repository might be empty, which is fine for initial commit
      }

      // Create blobs for all files
      const fileBlobs: Array<{ path: string; sha: string; mode: string }> = [];
      
      for (const [path, content] of Object.entries(files)) {
        const blobResponse = await this.httpClient.post(`/repos/${this.owner}/${repo}/git/blobs`, {
          content: Buffer.from(content).toString('base64'),
          encoding: 'base64'
        });
        
        fileBlobs.push({
          path,
          sha: blobResponse.data.sha,
          mode: '100644'
        });
      }

      // Create tree
      const treePayload: any = {
        tree: fileBlobs.map(blob => ({
          path: blob.path,
          mode: blob.mode,
          type: 'blob',
          sha: blob.sha
        }))
      };

      if (parentSha) {
        treePayload.base_tree = parentSha;
      }

      const treeResponse = await this.httpClient.post(`/repos/${this.owner}/${repo}/git/trees`, treePayload);

      // Create commit
      const commitPayload: any = {
        message,
        tree: treeResponse.data.sha
      };

      if (parentSha) {
        commitPayload.parents = [parentSha];
      }

      const commitResponse = await this.httpClient.post(`/repos/${this.owner}/${repo}/git/commits`, commitPayload);

      // Update branch reference
      await this.httpClient.patch(`/repos/${this.owner}/${repo}/git/refs/heads/${branch}`, {
        sha: commitResponse.data.sha,
        force: false
      });

      return commitResponse.data;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to create initial commit');
    }
  }

  /**
   * Clone repository locally
   */
  async cloneRepository(repo: string, localPath: string, useSsh: boolean = false): Promise<void> {
    try {
      const repository = await this.getRepository(repo);
      const cloneUrl = useSsh ? repository.sshUrl : repository.cloneUrl;

      await execFileAsync('git', ['clone', cloneUrl, localPath]);
    } catch (error: any) {
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  /**
   * Check if local repository is connected to GitHub
   */
  async isLocalRepoConnected(localPath: string, repo: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync('git remote get-url origin', { cwd: localPath });
      const remoteUrl = stdout.trim();
      
      return remoteUrl.includes(`${this.owner}/${repo}`) || 
             remoteUrl.includes(`${this.owner}/${repo}.git`);
    } catch {
      return false;
    }
  }

  /**
   * Connect local repository to GitHub
   */
  async connectLocalRepo(localPath: string, repo: string, useSsh: boolean = false): Promise<void> {
    try {
      const repository = await this.getRepository(repo);
      const remoteUrl = useSsh ? repository.sshUrl : repository.cloneUrl;

      // Check if origin already exists
      try {
        await execAsync('git remote get-url origin', { cwd: localPath });
        // If it exists, update it
        await execFileAsync('git', ['remote', 'set-url', 'origin', remoteUrl], { cwd: localPath });
      } catch {
        // If it doesn't exist, add it
        await execFileAsync('git', ['remote', 'add', 'origin', remoteUrl], { cwd: localPath });
      }

      // Push current branch
      const { stdout } = await execAsync('git branch --show-current', { cwd: localPath });
      const currentBranch = stdout.trim();
      
      if (currentBranch) {
        await execAsync(`git push -u origin ${currentBranch}`, { cwd: localPath });
      }
    } catch (error: any) {
      throw new Error(`Failed to connect local repository: ${error.message}`);
    }
  }

  /**
   * Get repository workflow runs
   */
  async getWorkflowRuns(repo: string, options: {
    workflow_id?: string;
    actor?: string;
    branch?: string;
    status?: 'queued' | 'in_progress' | 'completed';
    per_page?: number;
  } = {}): Promise<WorkflowRun[]> {
    try {
      const params = {
        ...options,
        per_page: options.per_page || 30
      };

      const response = await this.httpClient.get(`/repos/${this.owner}/${repo}/actions/runs`, { params });
      return response.data.workflow_runs;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get workflow runs');
    }
  }

  /**
   * Get repository topics/tags
   */
  async getRepositoryTopics(repo: string): Promise<string[]> {
    try {
      const response = await this.httpClient.get(`/repos/${this.owner}/${repo}/topics`, {
        headers: {
          'Accept': 'application/vnd.github.mercy-preview+json'
        }
      });
      return response.data.names;
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get repository topics');
    }
  }

  /**
   * Update repository topics/tags
   */
  async updateRepositoryTopics(repo: string, topics: string[]): Promise<void> {
    try {
      await this.httpClient.put(`/repos/${this.owner}/${repo}/topics`, {
        names: topics
      }, {
        headers: {
          'Accept': 'application/vnd.github.mercy-preview+json'
        }
      });
    } catch (error: any) {
      throw this.handleError(error, 'Failed to update repository topics');
    }
  }

  /**
   * Archive repository
   */
  async archiveRepository(repo: string): Promise<void> {
    try {
      await this.httpClient.patch(`/repos/${this.owner}/${repo}`, {
        archived: true
      });
    } catch (error: any) {
      throw this.handleError(error, 'Failed to archive repository');
    }
  }

  /**
   * Delete repository (use with caution!)
   */
  async deleteRepository(repo: string): Promise<void> {
    try {
      await this.httpClient.delete(`/repos/${this.owner}/${repo}`);
    } catch (error: any) {
      throw this.handleError(error, 'Failed to delete repository');
    }
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats(repo: string): Promise<any> {
    try {
      const [contributors, languages, codeFrequency, participation] = await Promise.all([
        this.httpClient.get(`/repos/${this.owner}/${repo}/contributors`).catch((): null => null),
        this.httpClient.get(`/repos/${this.owner}/${repo}/languages`).catch((): null => null),
        this.httpClient.get(`/repos/${this.owner}/${repo}/stats/code_frequency`).catch((): null => null),
        this.httpClient.get(`/repos/${this.owner}/${repo}/stats/participation`).catch((): null => null)
      ]);

      return {
        contributors: contributors?.data || [],
        languages: languages?.data || {},
        codeFrequency: codeFrequency?.data || [],
        participation: participation?.data || {}
      };
    } catch (error: any) {
      throw this.handleError(error, 'Failed to get repository statistics');
    }
  }

  /**
   * Transform API repository response to our type
   */
  private transformRepository(apiRepo: any): GitHubRepository {
    return {
      name: apiRepo.name,
      fullName: apiRepo.full_name,
      description: apiRepo.description,
      private: apiRepo.private,
      htmlUrl: apiRepo.html_url,
      cloneUrl: apiRepo.clone_url,
      sshUrl: apiRepo.ssh_url,
      defaultBranch: apiRepo.default_branch,
      id: apiRepo.id,
      owner: {
        login: apiRepo.owner.login,
        type: apiRepo.owner.type
      },
      permissions: apiRepo.permissions ? {
        admin: apiRepo.permissions.admin,
        push: apiRepo.permissions.push,
        pull: apiRepo.permissions.pull
      } : undefined
    };
  }

  /**
   * Handle API errors with better error messages
   */
  private handleError(error: any, context: string): Error {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;
      const errors = error.response.data?.errors || [];
      
      let errorMessage = `${context}: ${message}`;
      
      if (errors.length > 0) {
        const errorDetails = errors.map((e: any) => `${e.field}: ${e.message}`).join(', ');
        errorMessage += ` (${errorDetails})`;
      }

      const gitHubError = new Error(errorMessage) as any;
      gitHubError.status = status;
      gitHubError.code = error.response.data?.code;
      gitHubError.documentation_url = error.response.data?.documentation_url;
      gitHubError.errors = errors;
      
      return gitHubError;
    }

    return new Error(`${context}: ${error.message}`);
  }

  /**
   * Check if repository exists
   */
  async repositoryExists(repo: string): Promise<boolean> {
    try {
      await this.getRepository(repo);
      return true;
    } catch (error: any) {
      if (error.status === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Wait for repository to be ready (useful after creation)
   */
  async waitForRepository(repo: string, maxWaitTime: number = 30000): Promise<GitHubRepository> {
    const startTime = Date.now();
    const pollInterval = 1000; // 1 second

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const repository = await this.getRepository(repo);
        // Check if repository is fully initialized
        if (repository.defaultBranch) {
          return repository;
        }
      } catch (error: any) {
        if (error.status !== 404) {
          throw error;
        }
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Repository ${repo} not ready after ${maxWaitTime}ms`);
  }
}