export interface GitHubAuthConfig {
  authMethod: 'cli' | 'ssh' | 'token' | 'oauth';
  token?: string;
  sshKeyPath?: string;
  username?: string;
  email?: string;
}

export interface GitHubAuthResult {
  success: boolean;
  method: string;
  token?: string;
  username?: string;
  email?: string;
  error?: string;
}

export interface GitHubRepository {
  name: string;
  fullName: string;
  description?: string;
  private: boolean;
  htmlUrl: string;
  cloneUrl: string;
  sshUrl: string;
  defaultBranch: string;
  id: number;
  owner: {
    login: string;
    type: 'User' | 'Organization';
  };
  permissions?: {
    admin: boolean;
    push: boolean;
    pull: boolean;
  };
}

export interface CreateRepositoryOptions {
  name: string;
  description?: string;
  private?: boolean;
  gitignoreTemplate?: string;
  licenseTemplate?: string;
  allowSquashMerge?: boolean;
  allowMergeCommit?: boolean;
  allowRebaseMerge?: boolean;
  deleteBranchOnMerge?: boolean;
  hasIssues?: boolean;
  hasProjects?: boolean;
  hasWiki?: boolean;
}

export interface BranchProtectionOptions {
  branch: string;
  requiredStatusChecks?: {
    strict: boolean;
    contexts: string[];
  };
  enforceAdmins?: boolean;
  requiredPullRequestReviews?: {
    requiredApprovingReviewCount: number;
    dismissStaleReviews: boolean;
    requireCodeOwnerReviews: boolean;
    dismissalRestrictions?: {
      users: string[];
      teams: string[];
    };
  };
  restrictions?: {
    users: string[];
    teams: string[];
    apps: string[];
  };
}

export interface WebhookConfig {
  name: string;
  url: string;
  secret?: string;
  events: string[];
  active: boolean;
  contentType: 'json' | 'form';
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  type: 'ci' | 'cd' | 'test' | 'security' | 'custom';
  content: string;
  variables?: Record<string, any>;
}

export interface GitHubAction {
  name: string;
  on: any;
  jobs: Record<string, any>;
  env?: Record<string, any>;
}

export interface CIPipelineConfig {
  languages: string[];
  nodeVersion?: string[];
  pythonVersion?: string[];
  javaVersion?: string[];
  goVersion?: string[];
  testCommand?: string;
  buildCommand?: string;
  lintCommand?: string;
  cacheDirectories?: string[];
}

export interface DeploymentConfig {
  environment: string;
  provider: 'vercel' | 'netlify' | 'heroku' | 'aws' | 'gcp' | 'azure' | 'custom';
  buildCommand?: string;
  outputDirectory?: string;
  environmentVariables?: Record<string, string>;
  deployScript?: string;
}

export interface SecurityScanConfig {
  enableCodeQL: boolean;
  enableDependencyReview: boolean;
  enableSecretScanning: boolean;
  codeQLLanguages?: string[];
  customSecurityWorkflows?: string[];
}

export interface GitHubSecret {
  name: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SecretSyncOptions {
  envFile?: string;
  prefix?: string;
  exclude?: string[];
  include?: string[];
  dryRun?: boolean;
  overwrite?: boolean;
}

export interface OrganizationSecret extends GitHubSecret {
  visibility: 'all' | 'private' | 'selected';
  selectedRepositoryIds?: number[];
}

export interface GitHubIntegrationOptions {
  owner: string;
  repo?: string;
  authConfig?: GitHubAuthConfig;
  baseUrl?: string;
  timeout?: number;
}

export interface SetupFlowOptions {
  createRepo?: CreateRepositoryOptions;
  branchProtection?: BranchProtectionOptions[];
  webhooks?: WebhookConfig[];
  ciConfig?: CIPipelineConfig;
  deploymentConfig?: DeploymentConfig;
  securityConfig?: SecurityScanConfig;
  secrets?: GitHubSecret[];
  initialCommit?: {
    message: string;
    files: Record<string, string>;
  };
}

export interface GitHubAPIResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, any>;
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
}

export interface GitHubError {
  message: string;
  status: number;
  code?: string;
  documentation_url?: string;
  errors?: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}

export interface GitHubUser {
  login: string;
  id: number;
  nodeId: string;
  avatarUrl: string;
  name: string;
  email: string;
  company?: string;
  blog?: string;
  location?: string;
  bio?: string;
  twitterUsername?: string;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
  type: 'User' | 'Organization';
}

export interface GitHubOrganization {
  login: string;
  id: number;
  nodeId: string;
  url: string;
  reposUrl: string;
  eventsUrl: string;
  hooksUrl: string;
  issuesUrl: string;
  membersUrl: string;
  publicMembersUrl: string;
  avatarUrl: string;
  description: string;
  name: string;
  company?: string;
  blog?: string;
  location?: string;
  email?: string;
  twitterUsername?: string;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  type: 'Organization';
}

export interface GitHubCommit {
  sha: string;
  nodeId: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    url: string;
    commentCount: number;
  };
  url: string;
  htmlUrl: string;
  commentsUrl: string;
  author: GitHubUser;
  committer: GitHubUser;
  parents: Array<{
    sha: string;
    url: string;
    htmlUrl: string;
  }>;
}

export interface WorkflowRun {
  id: number;
  nodeId: string;
  headBranch: string;
  headSha: string;
  runNumber: number;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
  workflowId: number;
  url: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  runStartedAt: string;
  jobsUrl: string;
  logsUrl: string;
  checkSuiteUrl: string;
  artifactsUrl: string;
  cancelUrl: string;
  rerunUrl: string;
  headCommit: GitHubCommit;
  repository: GitHubRepository;
}

export interface GitHubIntegrationStatus {
  authenticated: boolean;
  authMethod?: string;
  username?: string;
  rateLimitRemaining?: number;
  rateLimitReset?: Date;
  repository?: GitHubRepository;
  lastOperation?: {
    type: string;
    timestamp: Date;
    success: boolean;
    error?: string;
  };
}

export interface EnvFileEntry {
  key: string;
  value: string;
  comment?: string;
  line: number;
}

export interface SecretOperationResult {
  success: boolean;
  secretName: string;
  operation: 'create' | 'update' | 'delete';
  error?: string;
}

export interface BulkSecretResult {
  total: number;
  successful: number;
  failed: number;
  results: SecretOperationResult[];
}

// OAuth device flow types
export interface DeviceAuthResponse {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresIn: number;
  interval: number;
}

export interface OAuthTokenResponse {
  accessToken: string;
  tokenType: string;
  scope: string;
}

// SSH Key types
export interface SSHKey {
  id: number;
  key: string;
  url: string;
  title: string;
  createdAt: string;
  verified: boolean;
  readOnly: boolean;
}

// Webhook event types
export interface WebhookEvent {
  action?: string;
  number?: number;
  pull_request?: any;
  issue?: any;
  repository: GitHubRepository;
  sender: GitHubUser;
}

// Rate limiting
export interface RateLimit {
  limit: number;
  remaining: number;
  reset: Date;
  used: number;
  resource: string;
}

export interface RateLimitResponse {
  rate: RateLimit;
  resources: {
    core: RateLimit;
    search: RateLimit;
    graphql: RateLimit;
    integration_manifest: RateLimit;
    source_import: RateLimit;
    code_scanning_upload: RateLimit;
    actions_runner_registration: RateLimit;
    scim: RateLimit;
  };
}