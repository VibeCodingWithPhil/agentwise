import { exec } from 'child_process';
import { promises as fs } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { promisify } from 'util';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  GitHubAuthConfig, 
  GitHubAuthResult, 
  DeviceAuthResponse, 
  OAuthTokenResponse,
  SSHKey,
  GitHubUser 
} from './types';

const execAsync = promisify(exec);

export class GitHubAutoAuth {
  private config: GitHubAuthConfig;
  private httpClient: AxiosInstance;
  private authToken?: string;
  private authMethod?: string;

  constructor(config?: Partial<GitHubAuthConfig>) {
    this.config = {
      authMethod: 'cli',
      ...config
    };

    this.httpClient = axios.create({
      baseURL: 'https://api.github.com',
      timeout: 30000,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Agentwise-GitHub-Integration/1.0.0'
      }
    });

    // Add request interceptor for authentication
    this.httpClient.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `token ${this.authToken}`;
      }
      return config;
    });
  }

  /**
   * Attempt authentication using multiple methods in order of preference
   */
  async authenticate(): Promise<GitHubAuthResult> {
    const methods = this.getAuthMethods();
    
    for (const method of methods) {
      try {
        const result = await this.tryAuthMethod(method);
        if (result.success) {
          this.authToken = result.token;
          this.authMethod = result.method;
          await this.storeCredentials(result);
          return result;
        }
      } catch (error) {
        console.warn(`Authentication method ${method} failed:`, error instanceof Error ? error.message : error);
      }
    }

    return {
      success: false,
      method: 'none',
      error: 'All authentication methods failed'
    };
  }

  /**
   * Try a specific authentication method
   */
  private async tryAuthMethod(method: string): Promise<GitHubAuthResult> {
    switch (method) {
      case 'cli':
        return await this.authenticateWithCLI();
      case 'token':
        return await this.authenticateWithToken();
      case 'ssh':
        return await this.authenticateWithSSH();
      case 'oauth':
        return await this.authenticateWithOAuth();
      default:
        throw new Error(`Unknown authentication method: ${method}`);
    }
  }

  /**
   * Get ordered list of authentication methods to try
   */
  private getAuthMethods(): string[] {
    if (this.config.authMethod !== 'cli') {
      return [this.config.authMethod];
    }

    // Default order: CLI first, then token, then SSH, then OAuth
    return ['cli', 'token', 'ssh', 'oauth'];
  }

  /**
   * Authenticate using GitHub CLI
   */
  private async authenticateWithCLI(): Promise<GitHubAuthResult> {
    try {
      // Check if GitHub CLI is installed
      await execAsync('gh --version');
    } catch {
      throw new Error('GitHub CLI not installed');
    }

    try {
      // Check if already authenticated
      const { stdout: statusOutput } = await execAsync('gh auth status');
      if (!statusOutput.includes('Logged in to github.com')) {
        throw new Error('GitHub CLI not authenticated');
      }

      // Get the token
      const { stdout: tokenOutput } = await execAsync('gh auth token');
      const token = tokenOutput.trim();

      if (!token) {
        throw new Error('No token available from GitHub CLI');
      }

      // Verify token works
      const user = await this.verifyToken(token);
      
      return {
        success: true,
        method: 'cli',
        token,
        username: user.login,
        email: user.email
      };
    } catch (error) {
      throw new Error(`GitHub CLI authentication failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Authenticate using personal access token
   */
  private async authenticateWithToken(): Promise<GitHubAuthResult> {
    let token = this.config.token;

    if (!token) {
      // Try to read from environment variables
      token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    }

    if (!token) {
      // Try to read from stored credentials
      token = await this.getStoredToken();
    }

    if (!token) {
      throw new Error('No GitHub token available');
    }

    // Verify token works
    const user = await this.verifyToken(token);

    return {
      success: true,
      method: 'token',
      token,
      username: user.login,
      email: user.email
    };
  }

  /**
   * Authenticate using SSH keys
   */
  private async authenticateWithSSH(): Promise<GitHubAuthResult> {
    try {
      // First, try to get token from GitHub CLI or stored credentials
      let token = await this.getStoredToken();
      if (!token) {
        // Try to use GitHub CLI to get token for API access
        try {
          const { stdout } = await execAsync('gh auth token');
          token = stdout.trim();
        } catch {
          throw new Error('SSH authentication requires a token for API access');
        }
      }

      // Test SSH connection
      const sshKeyPath = this.config.sshKeyPath || join(homedir(), '.ssh/id_rsa');
      
      try {
        await execAsync(`ssh -T git@github.com -i "${sshKeyPath}" -o StrictHostKeyChecking=no`, {
          timeout: 10000
        });
      } catch (error: any) {
        // SSH to GitHub always returns exit code 1 with success message
        if (!error.stdout?.includes('successfully authenticated')) {
          throw new Error('SSH key authentication failed');
        }
      }

      // Verify we can access API with token
      const user = await this.verifyToken(token);

      return {
        success: true,
        method: 'ssh',
        token,
        username: user.login,
        email: user.email
      };
    } catch (error) {
      throw new Error(`SSH authentication failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Authenticate using OAuth device flow
   */
  private async authenticateWithOAuth(): Promise<GitHubAuthResult> {
    try {
      // Step 1: Request device and user verification codes
      const deviceAuth = await this.requestDeviceCode();
      
      console.log(`Please visit: ${deviceAuth.verificationUri}`);
      console.log(`And enter code: ${deviceAuth.userCode}`);
      console.log('Waiting for authorization...');

      // Step 2: Poll for access token
      const token = await this.pollForAccessToken(deviceAuth);

      // Step 3: Verify token
      const user = await this.verifyToken(token);

      return {
        success: true,
        method: 'oauth',
        token,
        username: user.login,
        email: user.email
      };
    } catch (error) {
      throw new Error(`OAuth authentication failed: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Request device code for OAuth flow
   */
  private async requestDeviceCode(): Promise<DeviceAuthResponse> {
    const response = await axios.post(
      'https://github.com/login/device/code',
      {
        client_id: 'Iv1.b507a08c87ecfe98', // GitHub CLI client ID
        scope: 'repo,workflow,admin:public_key,user:email'
      },
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );

    return {
      deviceCode: response.data.device_code,
      userCode: response.data.user_code,
      verificationUri: response.data.verification_uri,
      expiresIn: response.data.expires_in,
      interval: response.data.interval
    };
  }

  /**
   * Poll for access token in OAuth flow
   */
  private async pollForAccessToken(deviceAuth: DeviceAuthResponse): Promise<string> {
    const maxAttempts = Math.floor(deviceAuth.expiresIn / deviceAuth.interval);
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, deviceAuth.interval * 1000));
      
      try {
        const response = await axios.post(
          'https://github.com/login/oauth/access_token',
          {
            client_id: 'Iv1.b507a08c87ecfe98',
            device_code: deviceAuth.deviceCode,
            grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
          },
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (response.data.access_token) {
          return response.data.access_token;
        }

        if (response.data.error === 'authorization_pending') {
          continue;
        }

        throw new Error(response.data.error_description || response.data.error);
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('OAuth flow timed out');
  }

  /**
   * Verify that a token is valid and get user information
   */
  private async verifyToken(token: string): Promise<GitHubUser> {
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    return response.data;
  }

  /**
   * Get stored token from local storage
   */
  private async getStoredToken(): Promise<string | null> {
    try {
      const credentialsPath = join(homedir(), '.agentwise', 'github-credentials.json');
      const data = await fs.readFile(credentialsPath, 'utf8');
      const credentials = JSON.parse(data);
      return credentials.token || null;
    } catch {
      return null;
    }
  }

  /**
   * Store credentials securely
   */
  private async storeCredentials(authResult: GitHubAuthResult): Promise<void> {
    try {
      const credentialsDir = join(homedir(), '.agentwise');
      await fs.mkdir(credentialsDir, { recursive: true });
      
      const credentialsPath = join(credentialsDir, 'github-credentials.json');
      const credentials = {
        method: authResult.method,
        token: authResult.token,
        username: authResult.username,
        email: authResult.email,
        updatedAt: new Date().toISOString()
      };

      await fs.writeFile(credentialsPath, JSON.stringify(credentials, null, 2));
      
      // Set restrictive permissions
      await fs.chmod(credentialsPath, 0o600);
    } catch (error) {
      console.warn('Failed to store credentials:', error);
    }
  }

  /**
   * Get the authenticated HTTP client
   */
  getHttpClient(): AxiosInstance {
    if (!this.authToken) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }
    return this.httpClient;
  }

  /**
   * Get current auth status
   */
  getAuthStatus(): { authenticated: boolean; method?: string; username?: string } {
    return {
      authenticated: !!this.authToken,
      method: this.authMethod,
      username: this.config.username
    };
  }

  /**
   * Revoke current authentication
   */
  async revokeAuth(): Promise<void> {
    if (this.authToken && this.authMethod === 'oauth') {
      try {
        await axios.delete(`https://api.github.com/applications/Iv1.b507a08c87ecfe98/token`, {
          auth: {
            username: 'Iv1.b507a08c87ecfe98',
            password: this.authToken
          }
        });
      } catch (error) {
        console.warn('Failed to revoke OAuth token:', error);
      }
    }

    this.authToken = undefined;
    this.authMethod = undefined;

    // Remove stored credentials
    try {
      const credentialsPath = join(homedir(), '.agentwise', 'github-credentials.json');
      await fs.unlink(credentialsPath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Test current authentication by making a simple API call
   */
  async testAuth(): Promise<boolean> {
    if (!this.authToken) {
      return false;
    }

    try {
      await this.httpClient.get('/user');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current user's SSH keys
   */
  async getSSHKeys(): Promise<SSHKey[]> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    const response = await this.httpClient.get('/user/keys');
    return response.data;
  }

  /**
   * Add SSH key to user's account
   */
  async addSSHKey(title: string, key: string): Promise<SSHKey> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }

    const response = await this.httpClient.post('/user/keys', {
      title,
      key
    });
    
    return response.data;
  }

  /**
   * Check if GitHub CLI is available and authenticated
   */
  static async isGitHubCLIAvailable(): Promise<boolean> {
    try {
      await execAsync('gh --version');
      const { stdout } = await execAsync('gh auth status');
      return stdout.includes('Logged in to github.com');
    } catch {
      return false;
    }
  }

  /**
   * Prompt user to authenticate with GitHub CLI
   */
  static async promptGitHubCLIAuth(): Promise<void> {
    console.log('Please authenticate with GitHub CLI:');
    console.log('Run: gh auth login');
    console.log('Follow the prompts to complete authentication.');
  }
}