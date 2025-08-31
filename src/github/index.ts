/**
 * GitHub Integration System for Agentwise
 * 
 * Complete GitHub integration with multi-method authentication,
 * repository management, CI/CD pipeline generation, and secrets management.
 */

// Main integration class
export { GitHubIntegration } from './GitHubIntegration';

// Core components
export { GitHubAutoAuth } from './GitHubAutoAuth';
export { GitHubRepoManager } from './GitHubRepoManager';
export { GitHubActionsGenerator } from './GitHubActionsGenerator';
export { GitHubSecretManager } from './GitHubSecretManager';

// Types and interfaces
export * from './types';

// Convenience exports for quick setup
import { GitHubIntegration } from './GitHubIntegration';
export const GitHub = GitHubIntegration;
export const GitHubClient = GitHubIntegration;

/**
 * Quick setup function for common use cases
 * 
 * @example
 * ```typescript
 * import { setupGitHub } from './github';
 * 
 * const github = await setupGitHub({
 *   owner: 'myusername',
 *   repo: 'my-project'
 * });
 * 
 * const result = await github.quickSetup('node', 'my-new-project');
 * console.log(result.summary);
 * ```
 */
export async function setupGitHub(options: {
  owner: string;
  repo?: string;
  authMethod?: 'cli' | 'token' | 'ssh' | 'oauth';
  token?: string;
}): Promise<GitHubIntegration> {
  const { GitHubIntegration } = await import('./GitHubIntegration');
  
  const github = new GitHubIntegration({
    owner: options.owner,
    repo: options.repo,
    authConfig: {
      authMethod: options.authMethod || 'cli',
      token: options.token
    }
  });
  
  await github.initialize();
  return github;
}

/**
 * Authentication helper
 * 
 * @example
 * ```typescript
 * import { authenticateGitHub } from './github';
 * 
 * const auth = await authenticateGitHub();
 * console.log(`Authenticated as: ${auth.username}`);
 * ```
 */
export async function authenticateGitHub(authMethod?: 'cli' | 'token' | 'ssh' | 'oauth') {
  const { GitHubAutoAuth } = await import('./GitHubAutoAuth');
  
  const auth = new GitHubAutoAuth({ authMethod });
  return await auth.authenticate();
}

/**
 * Quick repository creation
 * 
 * @example
 * ```typescript
 * import { createRepository } from './github';
 * 
 * const repo = await createRepository('myusername', {
 *   name: 'my-new-project',
 *   description: 'A new project',
 *   private: false
 * });
 * 
 * console.log(`Created: ${repo.htmlUrl}`);
 * ```
 */
export async function createRepository(
  owner: string, 
  options: {
    name: string;
    description?: string;
    private?: boolean;
    gitignoreTemplate?: string;
    licenseTemplate?: string;
  }
) {
  const github = await setupGitHub({ owner });
  const repoManager = github.getRepoManager();
  return await repoManager.createRepository(options);
}

/**
 * Quick secret sync from environment file
 * 
 * @example
 * ```typescript
 * import { syncSecrets } from './github';
 * 
 * const result = await syncSecrets('myusername', 'my-project', '.env.production');
 * console.log(`Synced ${result.successful}/${result.total} secrets`);
 * ```
 */
export async function syncSecrets(
  owner: string,
  repo: string,
  envFile: string = '.env',
  options: { dryRun?: boolean; overwrite?: boolean } = {}
) {
  const github = await setupGitHub({ owner, repo });
  return await github.syncEnvToSecrets(envFile, options);
}

/**
 * Quick workflow creation from template
 * 
 * @example
 * ```typescript
 * import { createWorkflow } from './github';
 * 
 * const workflow = await createWorkflow('myusername', 'my-project', 'node-ci');
 * console.log(`Created workflow: ${workflow.name}`);
 * ```
 */
export async function createWorkflow(
  owner: string,
  repo: string,
  templateName: string
) {
  const github = await setupGitHub({ owner, repo });
  return await github.createWorkflowFromTemplate(templateName);
}

// Version information
export const VERSION = '1.0.0';
export const AUTHOR = 'Agentwise GitHub Integration';
export const REPOSITORY = 'https://github.com/agentwise/agentwise';

// Default exports for convenience
const defaultExports = {
  GitHubIntegration,
  setupGitHub,
  authenticateGitHub,
  createRepository,
  syncSecrets,
  createWorkflow,
  VERSION,
  AUTHOR,
  REPOSITORY
};

export default defaultExports;