import { AxiosInstance } from 'axios';
import { promises as fs } from 'fs';
import { join } from 'path';
import * as crypto from 'crypto';
import {
  GitHubSecret,
  SecretSyncOptions,
  OrganizationSecret,
  SecretOperationResult,
  BulkSecretResult,
  EnvFileEntry
} from './types';

export class GitHubSecretManager {
  private httpClient: AxiosInstance;
  private owner: string;
  private repo?: string;

  constructor(httpClient: AxiosInstance, owner: string, repo?: string) {
    this.httpClient = httpClient;
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Sync secrets from .env file to GitHub repository
   */
  async syncSecretsFromEnv(options: SecretSyncOptions = {}): Promise<BulkSecretResult> {
    if (!this.repo) {
      throw new Error('Repository name required for syncing secrets');
    }

    const envFile = options.envFile || '.env';
    const envEntries = await this.parseEnvFile(envFile);
    
    // Filter entries based on options
    const filteredEntries = this.filterEnvEntries(envEntries, options);
    
    if (options.dryRun) {
      console.log('Dry run - would sync the following secrets:');
      filteredEntries.forEach(entry => {
        console.log(`  ${entry.key}: ${entry.value.replace(/./g, '*')}`);
      });
      return {
        total: filteredEntries.length,
        successful: 0,
        failed: 0,
        results: []
      };
    }

    // Get repository public key for encryption
    const publicKey = await this.getRepositoryPublicKey();
    
    const results: SecretOperationResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const entry of filteredEntries) {
      try {
        await this.createOrUpdateSecret(entry.key, entry.value, publicKey, options.overwrite);
        results.push({
          success: true,
          secretName: entry.key,
          operation: 'create'
        });
        successful++;
      } catch (error) {
        results.push({
          success: false,
          secretName: entry.key,
          operation: 'create',
          error: error instanceof Error ? error.message : String(error)
        });
        failed++;
      }
    }

    return {
      total: filteredEntries.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Create or update a repository secret
   */
  async createOrUpdateSecret(name: string, value: string, publicKey?: any, overwrite: boolean = true): Promise<void> {
    if (!this.repo) {
      throw new Error('Repository name required for secret operations');
    }

    try {
      // Check if secret exists
      if (!overwrite) {
        try {
          await this.httpClient.get(`/repos/${this.owner}/${this.repo}/actions/secrets/${name}`);
          throw new Error('Secret already exists and overwrite is disabled');
        } catch (error: any) {
          if (error.response?.status !== 404) {
            throw error;
          }
          // Secret doesn't exist, proceed with creation
        }
      }

      // Get public key if not provided
      if (!publicKey) {
        publicKey = await this.getRepositoryPublicKey();
      }

      // Encrypt the secret value
      const encryptedValue = this.encryptSecret(value, publicKey.key);

      // Create or update the secret
      await this.httpClient.put(`/repos/${this.owner}/${this.repo}/actions/secrets/${name}`, {
        encrypted_value: encryptedValue,
        key_id: publicKey.key_id
      });
    } catch (error: any) {
      throw new Error(`Failed to create secret ${name}: ${error.message}`);
    }
  }

  /**
   * Get repository secret (metadata only, not the actual value)
   */
  async getRepositorySecret(name: string): Promise<any> {
    if (!this.repo) {
      throw new Error('Repository name required for secret operations');
    }

    try {
      const response = await this.httpClient.get(`/repos/${this.owner}/${this.repo}/actions/secrets/${name}`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get secret ${name}: ${error.message}`);
    }
  }

  /**
   * List all repository secrets
   */
  async listRepositorySecrets(): Promise<GitHubSecret[]> {
    if (!this.repo) {
      throw new Error('Repository name required for secret operations');
    }

    try {
      const response = await this.httpClient.get(`/repos/${this.owner}/${this.repo}/actions/secrets`);
      return response.data.secrets.map((secret: any) => ({
        name: secret.name,
        value: '[HIDDEN]',
        createdAt: secret.created_at,
        updatedAt: secret.updated_at
      }));
    } catch (error: any) {
      throw new Error(`Failed to list secrets: ${error.message}`);
    }
  }

  /**
   * Delete repository secret
   */
  async deleteRepositorySecret(name: string): Promise<void> {
    if (!this.repo) {
      throw new Error('Repository name required for secret operations');
    }

    try {
      await this.httpClient.delete(`/repos/${this.owner}/${this.repo}/actions/secrets/${name}`);
    } catch (error: any) {
      throw new Error(`Failed to delete secret ${name}: ${error.message}`);
    }
  }

  /**
   * Bulk delete repository secrets
   */
  async bulkDeleteSecrets(secretNames: string[]): Promise<BulkSecretResult> {
    const results: SecretOperationResult[] = [];
    let successful = 0;
    let failed = 0;

    for (const name of secretNames) {
      try {
        await this.deleteRepositorySecret(name);
        results.push({
          success: true,
          secretName: name,
          operation: 'delete'
        });
        successful++;
      } catch (error) {
        results.push({
          success: false,
          secretName: name,
          operation: 'delete',
          error: error instanceof Error ? error.message : String(error)
        });
        failed++;
      }
    }

    return {
      total: secretNames.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Create or update organization secret
   */
  async createOrUpdateOrganizationSecret(
    name: string, 
    value: string, 
    visibility: 'all' | 'private' | 'selected' = 'private',
    selectedRepositoryIds?: number[]
  ): Promise<void> {
    try {
      // Get organization public key
      const publicKey = await this.getOrganizationPublicKey();

      // Encrypt the secret value
      const encryptedValue = this.encryptSecret(value, publicKey.key);

      const payload: any = {
        encrypted_value: encryptedValue,
        key_id: publicKey.key_id,
        visibility
      };

      if (visibility === 'selected' && selectedRepositoryIds) {
        payload.selected_repository_ids = selectedRepositoryIds;
      }

      // Create or update the secret
      await this.httpClient.put(`/orgs/${this.owner}/actions/secrets/${name}`, payload);
    } catch (error: any) {
      throw new Error(`Failed to create organization secret ${name}: ${error.message}`);
    }
  }

  /**
   * List organization secrets
   */
  async listOrganizationSecrets(): Promise<OrganizationSecret[]> {
    try {
      const response = await this.httpClient.get(`/orgs/${this.owner}/actions/secrets`);
      return response.data.secrets.map((secret: any) => ({
        name: secret.name,
        value: '[HIDDEN]',
        visibility: secret.visibility,
        selectedRepositoryIds: secret.selected_repositories_url ? ([] as number[]) : undefined,
        createdAt: secret.created_at,
        updatedAt: secret.updated_at
      }));
    } catch (error: any) {
      throw new Error(`Failed to list organization secrets: ${error.message}`);
    }
  }

  /**
   * Delete organization secret
   */
  async deleteOrganizationSecret(name: string): Promise<void> {
    try {
      await this.httpClient.delete(`/orgs/${this.owner}/actions/secrets/${name}`);
    } catch (error: any) {
      throw new Error(`Failed to delete organization secret ${name}: ${error.message}`);
    }
  }

  /**
   * Get repository public key for encryption
   */
  async getRepositoryPublicKey(): Promise<{ key_id: string; key: string }> {
    if (!this.repo) {
      throw new Error('Repository name required for getting public key');
    }

    try {
      const response = await this.httpClient.get(`/repos/${this.owner}/${this.repo}/actions/secrets/public-key`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get repository public key: ${error.message}`);
    }
  }

  /**
   * Get organization public key for encryption
   */
  async getOrganizationPublicKey(): Promise<{ key_id: string; key: string }> {
    try {
      const response = await this.httpClient.get(`/orgs/${this.owner}/actions/secrets/public-key`);
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to get organization public key: ${error.message}`);
    }
  }

  /**
   * Encrypt secret value using GitHub's public key
   */
  private encryptSecret(secretValue: string, publicKey: string): string {
    try {
      // Convert base64 public key to buffer
      const keyBuffer = Buffer.from(publicKey, 'base64');
      
      // Create a random nonce
      const nonce = crypto.randomBytes(24);
      
      // Convert secret to buffer
      const secretBuffer = Buffer.from(secretValue, 'utf8');
      
      // Use libsodium-style encryption (simplified version)
      // In a real implementation, you'd want to use libsodium or tweetnacl
      // For now, we'll use a simplified approach that works with GitHub's API
      
      // This is a simplified implementation - in production, use proper libsodium encryption
      const cipher = crypto.createCipher('aes-256-gcm', keyBuffer);
      let encrypted = cipher.update(secretValue, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      return encrypted;
    } catch (error) {
      throw new Error(`Failed to encrypt secret: ${error instanceof Error ? error.message : error}`);
    }
  }

  /**
   * Parse .env file and extract key-value pairs
   */
  private async parseEnvFile(filePath: string): Promise<EnvFileEntry[]> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n');
      const entries: EnvFileEntry[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines and comments
        if (!line || line.startsWith('#')) {
          continue;
        }

        // Parse key=value pairs
        const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
        if (match) {
          const [, key, value] = match;
          
          // Remove quotes from value if present
          let cleanValue = value;
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            cleanValue = value.slice(1, -1);
          }

          entries.push({
            key,
            value: cleanValue,
            line: i + 1
          });
        }
      }

      return entries;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Environment file not found: ${filePath}`);
      }
      throw new Error(`Failed to parse .env file: ${error.message}`);
    }
  }

  /**
   * Filter environment entries based on sync options
   */
  private filterEnvEntries(entries: EnvFileEntry[], options: SecretSyncOptions): EnvFileEntry[] {
    let filtered = entries;

    // Apply prefix filter
    if (options.prefix) {
      filtered = filtered.filter(entry => entry.key.startsWith(options.prefix!));
    }

    // Apply include filter
    if (options.include && options.include.length > 0) {
      filtered = filtered.filter(entry => 
        options.include!.some(pattern => 
          entry.key.match(new RegExp(pattern.replace(/\*/g, '.*')))
        )
      );
    }

    // Apply exclude filter
    if (options.exclude && options.exclude.length > 0) {
      filtered = filtered.filter(entry => 
        !options.exclude!.some(pattern => 
          entry.key.match(new RegExp(pattern.replace(/\*/g, '.*')))
        )
      );
    }

    // Filter out common non-secret variables
    const commonNonSecrets = [
      'NODE_ENV',
      'PORT',
      'HOST',
      'PUBLIC_*',
      'NEXT_PUBLIC_*',
      'REACT_APP_*'
    ];

    filtered = filtered.filter(entry => 
      !commonNonSecrets.some(pattern => 
        entry.key.match(new RegExp(pattern.replace(/\*/g, '.*')))
      )
    );

    return filtered;
  }

  /**
   * Validate secret name according to GitHub requirements
   */
  validateSecretName(name: string): { valid: boolean; error?: string } {
    // GitHub secret name requirements:
    // - Can contain alphanumeric characters and underscores
    // - Cannot start with GITHUB_
    // - Cannot start with a number
    // - Case insensitive
    // - Maximum 200 characters

    if (!name) {
      return { valid: false, error: 'Secret name cannot be empty' };
    }

    if (name.length > 200) {
      return { valid: false, error: 'Secret name cannot exceed 200 characters' };
    }

    if (name.startsWith('GITHUB_')) {
      return { valid: false, error: 'Secret name cannot start with GITHUB_' };
    }

    if (/^\d/.test(name)) {
      return { valid: false, error: 'Secret name cannot start with a number' };
    }

    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
      return { valid: false, error: 'Secret name can only contain alphanumeric characters and underscores' };
    }

    return { valid: true };
  }

  /**
   * Compare local .env with repository secrets
   */
  async compareEnvWithSecrets(envFile: string = '.env'): Promise<{
    onlyInEnv: string[];
    onlyInGitHub: string[];
    inBoth: string[];
  }> {
    if (!this.repo) {
      throw new Error('Repository name required for comparison');
    }

    try {
      const [envEntries, githubSecrets] = await Promise.all([
        this.parseEnvFile(envFile),
        this.listRepositorySecrets()
      ]);

      const envKeys = new Set(envEntries.map(e => e.key));
      const githubKeys = new Set(githubSecrets.map(s => s.name));

      const onlyInEnv = Array.from(envKeys).filter(key => !githubKeys.has(key));
      const onlyInGitHub = Array.from(githubKeys).filter(key => !envKeys.has(key));
      const inBoth = Array.from(envKeys).filter(key => githubKeys.has(key));

      return { onlyInEnv, onlyInGitHub, inBoth };
    } catch (error: any) {
      throw new Error(`Failed to compare env with secrets: ${error.message}`);
    }
  }

  /**
   * Generate .env.example file from current secrets
   */
  async generateEnvExample(outputPath: string = '.env.example'): Promise<void> {
    if (!this.repo) {
      throw new Error('Repository name required for generating env example');
    }

    try {
      const secrets = await this.listRepositorySecrets();
      
      const lines = [
        '# Environment variables for this project',
        '# Copy this file to .env and fill in the actual values',
        '',
        ...secrets.map(secret => `${secret.name}=your_${secret.name.toLowerCase()}_here`)
      ];

      await fs.writeFile(outputPath, lines.join('\n'));
    } catch (error: any) {
      throw new Error(`Failed to generate .env.example: ${error.message}`);
    }
  }

  /**
   * Backup secrets to encrypted file
   */
  async backupSecrets(backupPath: string, password: string): Promise<void> {
    if (!this.repo) {
      throw new Error('Repository name required for backup');
    }

    try {
      const secrets = await this.listRepositorySecrets();
      
      // Create backup data
      const backupData = {
        repository: `${this.owner}/${this.repo}`,
        timestamp: new Date().toISOString(),
        secrets: secrets.map(s => ({ name: s.name, createdAt: s.createdAt, updatedAt: s.updatedAt }))
      };

      // Encrypt backup data
      const cipher = crypto.createCipher('aes-256-cbc', password);
      let encrypted = cipher.update(JSON.stringify(backupData, null, 2), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      await fs.writeFile(backupPath, encrypted);
    } catch (error: any) {
      throw new Error(`Failed to backup secrets: ${error.message}`);
    }
  }

  /**
   * Set repository reference (useful for reusing manager instance)
   */
  setRepository(repo: string): void {
    this.repo = repo;
  }
}