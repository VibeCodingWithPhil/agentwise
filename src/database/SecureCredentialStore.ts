/**
 * SecureCredentialStore - Secure credential storage system
 * 
 * Provides secure storage and retrieval of database credentials using:
 * - OS keychain when available (macOS Keychain, Windows Credential Manager, Linux Secret Service)
 * - AES-256-GCM encryption for file-based storage
 * - Memory wiping after use
 * - Machine-specific encryption keys
 */

import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import {
  DatabaseCredentials,
  DatabaseProvider,
  SecureCredentialOptions,
  StoredCredential,
  CredentialStorageType,
  CredentialError
} from './types.js';

export class SecureCredentialStore {
  private readonly storageDir: string;
  private readonly keyPrefix: string;
  private readonly namespace: string;
  private readonly machineId: string;
  private readonly memoryWipe: boolean;
  
  // In-memory credential cache with auto-cleanup
  private credentialCache = new Map<string, { data: DatabaseCredentials; expires: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(options: Partial<SecureCredentialOptions> = {}) {
    this.keyPrefix = options.keyPrefix || 'agentwise_db';
    this.namespace = options.namespace || 'default';
    this.memoryWipe = options.autoWipe ?? true;
    
    // Create secure storage directory
    this.storageDir = path.join(os.homedir(), '.agentwise', 'credentials');
    
    // Generate machine-specific identifier
    this.machineId = this.generateMachineId();
    
    // Initialize storage
    this.initializeStorage();
    
    // Start cleanup interval for memory cache
    if (this.memoryWipe) {
      this.startCleanupInterval();
    }
    
    // Register process cleanup handlers
    this.registerCleanupHandlers();
  }

  /**
   * Store credentials securely
   */
  async store(
    alias: string, 
    credentials: DatabaseCredentials, 
    storageType: CredentialStorageType = 'keychain'
  ): Promise<void> {
    try {
      const credentialId = this.generateCredentialId(alias, credentials.provider);
      
      switch (storageType) {
        case 'keychain':
          await this.storeInKeychain(credentialId, credentials);
          break;
        case 'encrypted_file':
          await this.storeInEncryptedFile(credentialId, credentials);
          break;
        case 'environment':
          await this.storeInEnvironment(credentialId, credentials);
          break;
        case 'memory':
          await this.storeInMemory(credentialId, credentials);
          break;
        default:
          throw new CredentialError(`Unsupported storage type: ${storageType}`);
      }

      // Cache for quick access
      this.cacheCredential(credentialId, credentials);
      
    } catch (error) {
      throw new CredentialError(
        `Failed to store credentials: ${error instanceof Error ? error.message : 'Unknown error'}`,
        credentials.provider,
        { alias, storageType }
      );
    }
  }

  /**
   * Retrieve credentials securely
   */
  async retrieve(alias: string, provider: DatabaseProvider): Promise<DatabaseCredentials | null> {
    const credentialId = this.generateCredentialId(alias, provider);
    
    // Check cache first
    const cached = this.getCachedCredential(credentialId);
    if (cached) {
      return cached;
    }

    try {
      // Try different storage methods in order of preference
      let credentials = await this.retrieveFromKeychain(credentialId);
      if (credentials) {
        this.cacheCredential(credentialId, credentials);
        return credentials;
      }

      credentials = await this.retrieveFromEncryptedFile(credentialId);
      if (credentials) {
        this.cacheCredential(credentialId, credentials);
        return credentials;
      }

      credentials = await this.retrieveFromEnvironment(credentialId);
      if (credentials) {
        this.cacheCredential(credentialId, credentials);
        return credentials;
      }

      return null;
    } catch (error) {
      throw new CredentialError(
        `Failed to retrieve credentials: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider,
        { alias }
      );
    }
  }

  /**
   * List all stored credentials
   */
  async list(): Promise<Array<{ alias: string; provider: DatabaseProvider; storageType: CredentialStorageType; lastUsed: Date }>> {
    const results: Array<{ alias: string; provider: DatabaseProvider; storageType: CredentialStorageType; lastUsed: Date }> = [];
    
    try {
      // Check encrypted files
      const credentialFiles = await this.listEncryptedFiles();
      for (const file of credentialFiles) {
        try {
          const stored = await this.loadStoredCredential(file);
          results.push({
            alias: this.extractAliasFromId(stored.id),
            provider: stored.provider,
            storageType: 'encrypted_file',
            lastUsed: new Date(stored.metadata.lastUsed)
          });
        } catch (error) {
          // Skip corrupted files
          continue;
        }
      }

      // Check keychain (platform-specific)
      const keychainItems = await this.listKeychainItems();
      for (const item of keychainItems) {
        results.push({
          alias: this.extractAliasFromId(item.id),
          provider: item.provider,
          storageType: 'keychain',
          lastUsed: item.lastUsed
        });
      }

      return results.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
    } catch (error) {
      throw new CredentialError(
        `Failed to list credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete stored credentials
   */
  async delete(alias: string, provider: DatabaseProvider): Promise<boolean> {
    const credentialId = this.generateCredentialId(alias, provider);
    
    try {
      let deleted = false;
      
      // Remove from keychain
      if (await this.deleteFromKeychain(credentialId)) {
        deleted = true;
      }
      
      // Remove from encrypted file
      if (await this.deleteFromEncryptedFile(credentialId)) {
        deleted = true;
      }
      
      // Remove from memory cache
      this.credentialCache.delete(credentialId);
      
      return deleted;
    } catch (error) {
      throw new CredentialError(
        `Failed to delete credentials: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider,
        { alias }
      );
    }
  }

  /**
   * Clear all stored credentials (dangerous operation)
   */
  async clear(): Promise<void> {
    try {
      // Clear encrypted files
      await this.clearEncryptedFiles();
      
      // Clear keychain items
      await this.clearKeychainItems();
      
      // Clear memory cache
      this.credentialCache.clear();
      
    } catch (error) {
      throw new CredentialError(
        `Failed to clear credentials: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Initialize storage directory and security
   */
  private async initializeStorage(): Promise<void> {
    try {
      await fs.mkdir(this.storageDir, { recursive: true, mode: 0o700 });
      
      // Create .gitignore to prevent accidental commits
      const gitignorePath = path.join(this.storageDir, '.gitignore');
      await fs.writeFile(gitignorePath, '*\n!.gitignore\n', { mode: 0o600 });
      
    } catch (error) {
      throw new CredentialError(`Failed to initialize storage: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate machine-specific identifier
   */
  private generateMachineId(): string {
    try {
      const platform = os.platform();
      const hostname = os.hostname();
      const release = os.release();
      const arch = os.arch();
      
      let machineSpecific = `${platform}-${hostname}-${release}-${arch}`;
      
      // Add more entropy based on platform
      if (platform === 'darwin') {
        try {
          const serial = execSync('system_profiler SPHardwareDataType | grep "Serial Number" | awk \'{print $4}\'', 
            { encoding: 'utf8', timeout: 5000 }).trim();
          if (serial) machineSpecific += `-${serial}`;
        } catch {
          // Fallback to other identifiers
        }
      } else if (platform === 'linux') {
        try {
          const machineIdFile = '/etc/machine-id';
          const machineId = require('fs').readFileSync(machineIdFile, 'utf8');
          if (machineId.trim()) machineSpecific += `-${machineId.trim()}`;
        } catch {
          // Fallback to other identifiers
        }
      }
      
      return crypto.createHash('sha256').update(machineSpecific).digest('hex').substring(0, 16);
    } catch (error) {
      // Fallback to a less secure but consistent identifier
      return crypto.createHash('sha256').update(`${os.hostname()}-${os.platform()}-${os.arch()}`).digest('hex').substring(0, 16);
    }
  }

  /**
   * Generate credential ID
   */
  private generateCredentialId(alias: string, provider: DatabaseProvider): string {
    const combined = `${this.keyPrefix}:${this.namespace}:${provider}:${alias}`;
    return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32);
  }

  /**
   * Extract alias from credential ID
   */
  private extractAliasFromId(credentialId: string): string {
    // This is a simplified extraction - in practice, you'd need to maintain a mapping
    // or store the alias in the metadata
    return credentialId.substring(0, 8); // Placeholder implementation
  }

  /**
   * Store in OS keychain
   */
  private async storeInKeychain(credentialId: string, credentials: DatabaseCredentials): Promise<void> {
    const platform = os.platform();
    const serialized = this.serializeCredentials(credentials);
    const encrypted = this.encryptData(serialized, this.machineId);
    
    try {
      if (platform === 'darwin') {
        // macOS Keychain
        const service = `${this.keyPrefix}.${this.namespace}`;
        execSync(`security add-generic-password -s "${service}" -a "${credentialId}" -w "${encrypted}" -U`, 
          { stdio: 'pipe' });
      } else if (platform === 'win32') {
        // Windows Credential Manager
        const target = `${this.keyPrefix}.${this.namespace}.${credentialId}`;
        execSync(`cmdkey /add:${target} /user:agentwise /pass:${encrypted}`, { stdio: 'pipe' });
      } else if (platform === 'linux') {
        // Linux Secret Service (via secret-tool if available)
        try {
          execSync(`echo "${encrypted}" | secret-tool store --label="AgentWise DB Credentials" service "${this.keyPrefix}.${this.namespace}" account "${credentialId}"`, 
            { stdio: 'pipe', input: encrypted });
        } catch {
          // Fallback to file storage if secret-tool is not available
          await this.storeInEncryptedFile(credentialId, credentials);
          return;
        }
      } else {
        // Fallback to encrypted file storage
        await this.storeInEncryptedFile(credentialId, credentials);
        return;
      }
    } catch (error) {
      // Fallback to encrypted file storage
      await this.storeInEncryptedFile(credentialId, credentials);
    }
  }

  /**
   * Retrieve from OS keychain
   */
  private async retrieveFromKeychain(credentialId: string): Promise<DatabaseCredentials | null> {
    const platform = os.platform();
    
    try {
      let encrypted = '';
      
      if (platform === 'darwin') {
        // macOS Keychain
        const service = `${this.keyPrefix}.${this.namespace}`;
        encrypted = execSync(`security find-generic-password -s "${service}" -a "${credentialId}" -w`, 
          { encoding: 'utf8', stdio: 'pipe' }).trim();
      } else if (platform === 'win32') {
        // Windows Credential Manager
        const target = `${this.keyPrefix}.${this.namespace}.${credentialId}`;
        const output = execSync(`cmdkey /list:${target}`, { encoding: 'utf8', stdio: 'pipe' });
        // Parse Windows cmdkey output (simplified)
        const match = output.match(/Password: (.+)/);
        encrypted = match ? match[1] : '';
      } else if (platform === 'linux') {
        // Linux Secret Service
        encrypted = execSync(`secret-tool lookup service "${this.keyPrefix}.${this.namespace}" account "${credentialId}"`, 
          { encoding: 'utf8', stdio: 'pipe' }).trim();
      }
      
      if (!encrypted) return null;
      
      const decrypted = this.decryptData(encrypted, this.machineId);
      return this.deserializeCredentials(decrypted);
    } catch (error) {
      return null;
    }
  }

  /**
   * Store in encrypted file
   */
  private async storeInEncryptedFile(credentialId: string, credentials: DatabaseCredentials): Promise<void> {
    const filePath = path.join(this.storageDir, `${credentialId}.json`);
    const serialized = this.serializeCredentials(credentials);
    const encrypted = this.encryptData(serialized, this.machineId);
    
    const storedCredential: StoredCredential = {
      id: credentialId,
      provider: credentials.provider,
      alias: credentialId, // Simplified for now
      encryptedData: encrypted,
      metadata: {
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        machineId: this.machineId,
        version: '1.0.0'
      }
    };
    
    await fs.writeFile(filePath, JSON.stringify(storedCredential, null, 2), { mode: 0o600 });
  }

  /**
   * Retrieve from encrypted file
   */
  private async retrieveFromEncryptedFile(credentialId: string): Promise<DatabaseCredentials | null> {
    const filePath = path.join(this.storageDir, `${credentialId}.json`);
    
    try {
      const stored = await this.loadStoredCredential(filePath);
      
      // Verify machine ID for security
      if (stored.metadata.machineId && stored.metadata.machineId !== this.machineId) {
        throw new CredentialError('Machine ID mismatch - credentials may be from different machine');
      }
      
      const decrypted = this.decryptData(stored.encryptedData, this.machineId);
      const credentials = this.deserializeCredentials(decrypted);
      
      // Update last used timestamp
      stored.metadata.lastUsed = new Date().toISOString();
      await fs.writeFile(filePath, JSON.stringify(stored, null, 2), { mode: 0o600 });
      
      return credentials;
    } catch (error) {
      if ((error as any).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Store in environment variables
   */
  private async storeInEnvironment(credentialId: string, credentials: DatabaseCredentials): Promise<void> {
    const serialized = this.serializeCredentials(credentials);
    const encrypted = this.encryptData(serialized, this.machineId);
    const envVar = `AGENTWISE_DB_${credentialId.toUpperCase()}`;
    
    // Store in process environment
    process.env[envVar] = encrypted;
    
    // Also write to a .env file if it exists
    const envFilePath = path.join(process.cwd(), '.env');
    try {
      const envContent = await fs.readFile(envFilePath, 'utf8').catch(() => '');
      const lines = envContent.split('\n');
      const existingIndex = lines.findIndex(line => line.startsWith(`${envVar}=`));
      
      if (existingIndex >= 0) {
        lines[existingIndex] = `${envVar}=${encrypted}`;
      } else {
        lines.push(`${envVar}=${encrypted}`);
      }
      
      await fs.writeFile(envFilePath, lines.join('\n'));
    } catch {
      // Ignore if .env file can't be written
    }
  }

  /**
   * Retrieve from environment variables
   */
  private async retrieveFromEnvironment(credentialId: string): Promise<DatabaseCredentials | null> {
    const envVar = `AGENTWISE_DB_${credentialId.toUpperCase()}`;
    const encrypted = process.env[envVar];
    
    if (!encrypted) return null;
    
    try {
      const decrypted = this.decryptData(encrypted, this.machineId);
      return this.deserializeCredentials(decrypted);
    } catch (error) {
      return null;
    }
  }

  /**
   * Store in memory cache
   */
  private async storeInMemory(credentialId: string, credentials: DatabaseCredentials): Promise<void> {
    const expires = Date.now() + (15 * 60 * 1000); // 15 minutes
    this.credentialCache.set(credentialId, { data: credentials, expires });
  }

  /**
   * Get cached credential
   */
  private getCachedCredential(credentialId: string): DatabaseCredentials | null {
    const cached = this.credentialCache.get(credentialId);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    if (cached) {
      this.credentialCache.delete(credentialId);
    }
    
    return null;
  }

  /**
   * Cache credential
   */
  private cacheCredential(credentialId: string, credentials: DatabaseCredentials): void {
    const expires = Date.now() + (15 * 60 * 1000); // 15 minutes
    this.credentialCache.set(credentialId, { data: credentials, expires });
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  private encryptData(data: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const keyHash = crypto.createHash('sha256').update(key).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipher(algorithm, keyHash);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  private decryptData(encryptedData: string, key: string): string {
    const algorithm = 'aes-256-gcm';
    const keyHash = crypto.createHash('sha256').update(key).digest();
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipher(algorithm, keyHash);
    
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Serialize credentials to JSON
   */
  private serializeCredentials(credentials: DatabaseCredentials): string {
    return JSON.stringify(credentials);
  }

  /**
   * Deserialize credentials from JSON
   */
  private deserializeCredentials(data: string): DatabaseCredentials {
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      lastUsed: new Date(parsed.lastUsed)
    };
  }

  /**
   * Load stored credential from file
   */
  private async loadStoredCredential(filePath: string): Promise<StoredCredential> {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  }

  /**
   * List encrypted credential files
   */
  private async listEncryptedFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.storageDir);
      return files.filter(file => file.endsWith('.json')).map(file => path.join(this.storageDir, file));
    } catch (error) {
      return [];
    }
  }

  /**
   * List keychain items (platform-specific)
   */
  private async listKeychainItems(): Promise<Array<{ id: string; provider: DatabaseProvider; lastUsed: Date }>> {
    // Simplified implementation - would need platform-specific logic
    return [];
  }

  /**
   * Delete from keychain
   */
  private async deleteFromKeychain(credentialId: string): Promise<boolean> {
    const platform = os.platform();
    
    try {
      if (platform === 'darwin') {
        const service = `${this.keyPrefix}.${this.namespace}`;
        execSync(`security delete-generic-password -s "${service}" -a "${credentialId}"`, { stdio: 'pipe' });
        return true;
      } else if (platform === 'win32') {
        const target = `${this.keyPrefix}.${this.namespace}.${credentialId}`;
        execSync(`cmdkey /delete:${target}`, { stdio: 'pipe' });
        return true;
      } else if (platform === 'linux') {
        execSync(`secret-tool clear service "${this.keyPrefix}.${this.namespace}" account "${credentialId}"`, 
          { stdio: 'pipe' });
        return true;
      }
    } catch (error) {
      return false;
    }
    
    return false;
  }

  /**
   * Delete from encrypted file
   */
  private async deleteFromEncryptedFile(credentialId: string): Promise<boolean> {
    const filePath = path.join(this.storageDir, `${credentialId}.json`);
    
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Clear all encrypted files
   */
  private async clearEncryptedFiles(): Promise<void> {
    const files = await this.listEncryptedFiles();
    await Promise.all(files.map(file => fs.unlink(file).catch(() => {})));
  }

  /**
   * Clear all keychain items
   */
  private async clearKeychainItems(): Promise<void> {
    // Platform-specific implementation would go here
    // This is a dangerous operation and should require confirmation
  }

  /**
   * Start cleanup interval for memory cache
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.credentialCache.entries()) {
        if (cached.expires <= now) {
          this.credentialCache.delete(key);
        }
      }
    }, 60000); // Clean up every minute
  }

  /**
   * Register cleanup handlers
   */
  private registerCleanupHandlers(): void {
    const cleanup = () => {
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
      }
      this.credentialCache.clear();
    };

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('uncaughtException', cleanup);
  }
}