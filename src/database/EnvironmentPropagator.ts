/**
 * EnvironmentPropagator - Environment variable management system
 * 
 * Manages environment variables for database connections:
 * - Updates .env files safely
 * - Creates TypeScript type definitions
 * - Updates build configurations
 * - Ensures proper gitignore entries
 * - Validates environment variables
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import {
  EnvironmentVariable,
  EnvironmentPropagationResult,
  EnvironmentPropagationOptions,
  DatabaseCredentials,
  DatabaseProvider,
  ConfigurationError
} from './types.js';

export class EnvironmentPropagator {
  private readonly projectRoot: string;
  private readonly backupDir: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.backupDir = path.join(projectRoot, '.agentwise', 'backups', 'env');
  }

  /**
   * Propagate database credentials as environment variables
   */
  async propagateCredentials(
    credentials: DatabaseCredentials,
    options: EnvironmentPropagationOptions = {}
  ): Promise<EnvironmentPropagationResult> {
    const result: EnvironmentPropagationResult = {
      success: false,
      updatedFiles: [],
      createdFiles: [],
      errors: [],
      environmentVariables: []
    };

    try {
      // Generate environment variables from credentials
      const envVars = this.generateEnvironmentVariables(credentials, options.prefix);
      result.environmentVariables = envVars;

      // Backup existing files if requested
      if (options.backup) {
        await this.createBackups();
      }

      // Update or create .env file
      const envFile = options.targetEnvFile || path.join(this.projectRoot, '.env');
      if (await this.updateEnvFile(envFile, envVars)) {
        if (existsSync(envFile)) {
          result.updatedFiles.push(envFile);
        } else {
          result.createdFiles.push(envFile);
        }
      }

      // Create TypeScript type definitions
      if (options.createTypeDefinitions) {
        const typeDefFile = await this.createTypeDefinitions(envVars, options.prefix);
        if (typeDefFile) {
          result.createdFiles.push(typeDefFile);
        }
      }

      // Update build configurations
      if (options.updateBuildConfigs) {
        const configFiles = await this.updateBuildConfigurations(envVars);
        result.updatedFiles.push(...configFiles);
      }

      // Ensure gitignore entries
      if (options.ensureGitignore) {
        const gitignoreFile = await this.ensureGitignoreEntries();
        if (gitignoreFile) {
          result.updatedFiles.push(gitignoreFile);
        }
      }

      result.success = true;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Generate environment variables from database credentials
   */
  private generateEnvironmentVariables(
    credentials: DatabaseCredentials, 
    prefix: string = 'DB'
  ): EnvironmentVariable[] {
    const vars: EnvironmentVariable[] = [];
    const upperPrefix = prefix.toUpperCase();

    // Database URL (primary)
    if (credentials.connectionUrl) {
      vars.push({
        key: `${upperPrefix}_URL`,
        value: credentials.connectionUrl,
        description: `${credentials.provider} database connection URL`,
        required: true,
        sensitive: true
      });
    }

    // Individual connection parameters
    if (credentials.host) {
      vars.push({
        key: `${upperPrefix}_HOST`,
        value: credentials.host,
        description: `${credentials.provider} database host`,
        required: !credentials.connectionUrl,
        sensitive: false
      });
    }

    if (credentials.port) {
      vars.push({
        key: `${upperPrefix}_PORT`,
        value: credentials.port.toString(),
        description: `${credentials.provider} database port`,
        required: false,
        sensitive: false
      });
    }

    if (credentials.database) {
      vars.push({
        key: `${upperPrefix}_NAME`,
        value: credentials.database,
        description: `${credentials.provider} database name`,
        required: !credentials.connectionUrl,
        sensitive: false
      });
    }

    if (credentials.username) {
      vars.push({
        key: `${upperPrefix}_USER`,
        value: credentials.username,
        description: `${credentials.provider} database username`,
        required: !credentials.connectionUrl,
        sensitive: false
      });
    }

    if (credentials.password) {
      vars.push({
        key: `${upperPrefix}_PASSWORD`,
        value: credentials.password,
        description: `${credentials.provider} database password`,
        required: !credentials.connectionUrl,
        sensitive: true
      });
    }

    // API keys and service keys
    if (credentials.apiKey) {
      vars.push({
        key: `${upperPrefix}_API_KEY`,
        value: credentials.apiKey,
        description: `${credentials.provider} API key`,
        required: false,
        sensitive: true
      });
    }

    if (credentials.serviceKey) {
      vars.push({
        key: `${upperPrefix}_SERVICE_KEY`,
        value: credentials.serviceKey,
        description: `${credentials.provider} service key`,
        required: false,
        sensitive: true
      });
    }

    // Provider-specific variables
    if (credentials.projectId) {
      vars.push({
        key: `${upperPrefix}_PROJECT_ID`,
        value: credentials.projectId,
        description: `${credentials.provider} project ID`,
        required: false,
        sensitive: false
      });
    }

    if (credentials.region) {
      vars.push({
        key: `${upperPrefix}_REGION`,
        value: credentials.region,
        description: `${credentials.provider} region`,
        required: false,
        sensitive: false
      });
    }

    // SSL configuration
    if (credentials.ssl !== undefined) {
      vars.push({
        key: `${upperPrefix}_SSL`,
        value: credentials.ssl.toString(),
        description: `${credentials.provider} SSL enabled`,
        required: false,
        sensitive: false
      });
    }

    // Provider type
    vars.push({
      key: `${upperPrefix}_PROVIDER`,
      value: credentials.provider,
      description: 'Database provider type',
      required: false,
      sensitive: false
    });

    return vars;
  }

  /**
   * Update or create .env file
   */
  private async updateEnvFile(envPath: string, variables: EnvironmentVariable[]): Promise<boolean> {
    try {
      let content = '';
      const envExists = existsSync(envPath);
      
      if (envExists) {
        content = await fs.readFile(envPath, 'utf8');
      }

      const lines = content.split('\n').filter(line => line.trim() !== '');
      const existingVars = new Map<string, string>();

      // Parse existing variables
      for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          existingVars.set(match[1], match[2]);
        }
      }

      // Update or add new variables
      const updatedLines: string[] = [];
      const processedKeys = new Set<string>();

      // Add header comment if file is new
      if (!envExists) {
        updatedLines.push('# Database Configuration');
        updatedLines.push('# Generated by AgentWise Database Integration System');
        updatedLines.push('# WARNING: This file contains sensitive information. Do not commit to version control.');
        updatedLines.push('');
      }

      // Process existing lines, updating values as needed
      for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1];
          const variable = variables.find(v => v.key === key);
          
          if (variable) {
            updatedLines.push(`${key}=${this.quoteValue(variable.value)}`);
            processedKeys.add(key);
          } else {
            updatedLines.push(line);
          }
        } else {
          updatedLines.push(line);
        }
      }

      // Add new variables
      let addedSection = false;
      for (const variable of variables) {
        if (!processedKeys.has(variable.key)) {
          if (!addedSection && envExists) {
            updatedLines.push('');
            updatedLines.push('# Database credentials');
            addedSection = true;
          }
          
          if (variable.description) {
            updatedLines.push(`# ${variable.description}`);
          }
          updatedLines.push(`${variable.key}=${this.quoteValue(variable.value)}`);
        }
      }

      const newContent = updatedLines.join('\n') + '\n';
      await fs.writeFile(envPath, newContent, 'utf8');

      return true;
    } catch (error) {
      throw new ConfigurationError(
        `Failed to update .env file: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create TypeScript type definitions for environment variables
   */
  private async createTypeDefinitions(
    variables: EnvironmentVariable[], 
    prefix: string = 'DB'
  ): Promise<string | null> {
    try {
      const typeDefPath = path.join(this.projectRoot, 'types', 'environment.d.ts');
      const typeDir = path.dirname(typeDefPath);

      // Ensure types directory exists
      await fs.mkdir(typeDir, { recursive: true });

      const typeContent = this.generateTypeDefinitions(variables, prefix);
      await fs.writeFile(typeDefPath, typeContent, 'utf8');

      return typeDefPath;
    } catch (error) {
      throw new ConfigurationError(
        `Failed to create type definitions: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate TypeScript type definitions content
   */
  private generateTypeDefinitions(variables: EnvironmentVariable[], prefix: string): string {
    const lines: string[] = [];
    
    lines.push('/**');
    lines.push(' * Environment Variables Type Definitions');
    lines.push(' * Generated by AgentWise Database Integration System');
    lines.push(' * Do not edit manually - this file will be regenerated');
    lines.push(' */');
    lines.push('');
    
    // Declare global NodeJS namespace extension
    lines.push('declare global {');
    lines.push('  namespace NodeJS {');
    lines.push('    interface ProcessEnv {');
    
    for (const variable of variables) {
      if (variable.description) {
        lines.push(`      /** ${variable.description} */`);
      }
      
      const optional = variable.required ? '' : '?';
      lines.push(`      ${variable.key}${optional}: string;`);
    }
    
    lines.push('    }');
    lines.push('  }');
    lines.push('}');
    lines.push('');
    
    // Export type for use in modules
    lines.push(`export interface ${prefix}Environment {`);
    for (const variable of variables) {
      if (variable.description) {
        lines.push(`  /** ${variable.description} */`);
      }
      
      const optional = variable.required ? '' : '?';
      lines.push(`  ${variable.key}${optional}: string;`);
    }
    lines.push('}');
    lines.push('');
    
    // Export helper function
    lines.push(`export function get${prefix}Environment(): ${prefix}Environment {`);
    lines.push('  return {');
    for (const variable of variables) {
      lines.push(`    ${variable.key}: process.env.${variable.key}${variable.required ? '!' : ''},`);
    }
    lines.push('  };');
    lines.push('}');
    lines.push('');
    
    // Export validation function
    lines.push(`export function validate${prefix}Environment(): { valid: boolean; missing: string[] } {`);
    lines.push('  const missing: string[] = [];');
    lines.push('');
    
    for (const variable of variables.filter(v => v.required)) {
      lines.push(`  if (!process.env.${variable.key}) {`);
      lines.push(`    missing.push('${variable.key}');`);
      lines.push('  }');
    }
    
    lines.push('');
    lines.push('  return {');
    lines.push('    valid: missing.length === 0,');
    lines.push('    missing');
    lines.push('  };');
    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Update build configurations with environment variables
   */
  private async updateBuildConfigurations(variables: EnvironmentVariable[]): Promise<string[]> {
    const updatedFiles: string[] = [];

    try {
      // Update Next.js configuration
      const nextConfigPath = await this.updateNextJsConfig(variables);
      if (nextConfigPath) updatedFiles.push(nextConfigPath);

      // Update Vite configuration
      const viteConfigPath = await this.updateViteConfig(variables);
      if (viteConfigPath) updatedFiles.push(viteConfigPath);

      // Update Webpack configuration
      const webpackConfigPath = await this.updateWebpackConfig(variables);
      if (webpackConfigPath) updatedFiles.push(webpackConfigPath);

      // Update package.json scripts if needed
      const packageJsonPath = await this.updatePackageJsonScripts(variables);
      if (packageJsonPath) updatedFiles.push(packageJsonPath);

    } catch (error) {
      throw new ConfigurationError(
        `Failed to update build configurations: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    return updatedFiles;
  }

  /**
   * Update Next.js configuration
   */
  private async updateNextJsConfig(variables: EnvironmentVariable[]): Promise<string | null> {
    const configPaths = [
      path.join(this.projectRoot, 'next.config.js'),
      path.join(this.projectRoot, 'next.config.mjs'),
      path.join(this.projectRoot, 'next.config.ts')
    ];

    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        try {
          let content = await fs.readFile(configPath, 'utf8');
          
          // Simple approach: add env section if not present
          if (!content.includes('env:') && !content.includes('serverRuntimeConfig')) {
            const envSection = this.generateNextJsEnvSection(variables);
            
            // Insert before module.exports or export default
            if (content.includes('module.exports')) {
              content = content.replace(
                /module\.exports\s*=\s*{/,
                `module.exports = {\n${envSection}`
              );
            } else if (content.includes('export default')) {
              content = content.replace(
                /export\s+default\s*{/,
                `export default {\n${envSection}`
              );
            }
            
            await fs.writeFile(configPath, content, 'utf8');
            return configPath;
          }
        } catch (error) {
          // Continue to next config file
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Generate Next.js environment section
   */
  private generateNextJsEnvSection(variables: EnvironmentVariable[]): string {
    const lines: string[] = [];
    lines.push('  env: {');
    
    for (const variable of variables) {
      if (!variable.sensitive) { // Only expose non-sensitive variables to client
        lines.push(`    ${variable.key}: process.env.${variable.key},`);
      }
    }
    
    lines.push('  },');
    return lines.join('\n');
  }

  /**
   * Update Vite configuration
   */
  private async updateViteConfig(variables: EnvironmentVariable[]): Promise<string | null> {
    const configPaths = [
      path.join(this.projectRoot, 'vite.config.js'),
      path.join(this.projectRoot, 'vite.config.ts'),
      path.join(this.projectRoot, 'vite.config.mjs')
    ];

    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        try {
          let content = await fs.readFile(configPath, 'utf8');
          
          // Add define section for environment variables
          const defineSection = this.generateViteDefineSection(variables);
          
          if (!content.includes('define:')) {
            content = content.replace(
              /export\s+default\s+defineConfig\(\s*{/,
              `export default defineConfig({\n${defineSection}`
            );
            
            await fs.writeFile(configPath, content, 'utf8');
            return configPath;
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Generate Vite define section
   */
  private generateViteDefineSection(variables: EnvironmentVariable[]): string {
    const lines: string[] = [];
    lines.push('  define: {');
    
    for (const variable of variables) {
      if (!variable.sensitive) {
        lines.push(`    'process.env.${variable.key}': JSON.stringify(process.env.${variable.key}),`);
      }
    }
    
    lines.push('  },');
    return lines.join('\n');
  }

  /**
   * Update Webpack configuration
   */
  private async updateWebpackConfig(variables: EnvironmentVariable[]): Promise<string | null> {
    const configPath = path.join(this.projectRoot, 'webpack.config.js');
    
    if (existsSync(configPath)) {
      try {
        let content = await fs.readFile(configPath, 'utf8');
        
        // Add DefinePlugin for environment variables
        const definePlugin = this.generateWebpackDefinePlugin(variables);
        
        if (!content.includes('DefinePlugin')) {
          // Simple insertion - would need more sophisticated parsing for real implementation
          content = content.replace(
            /plugins:\s*\[/,
            `plugins: [\n${definePlugin},`
          );
          
          await fs.writeFile(configPath, content, 'utf8');
          return configPath;
        }
      } catch (error) {
        // Continue
      }
    }

    return null;
  }

  /**
   * Generate Webpack DefinePlugin
   */
  private generateWebpackDefinePlugin(variables: EnvironmentVariable[]): string {
    const lines: string[] = [];
    lines.push('    new webpack.DefinePlugin({');
    
    for (const variable of variables) {
      if (!variable.sensitive) {
        lines.push(`      'process.env.${variable.key}': JSON.stringify(process.env.${variable.key}),`);
      }
    }
    
    lines.push('    })');
    return lines.join('\n');
  }

  /**
   * Update package.json scripts
   */
  private async updatePackageJsonScripts(variables: EnvironmentVariable[]): Promise<string | null> {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (existsSync(packageJsonPath)) {
      try {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        
        // Add environment validation script
        if (!packageJson.scripts) {
          packageJson.scripts = {};
        }
        
        if (!packageJson.scripts['env:validate']) {
          packageJson.scripts['env:validate'] = 'node -e "require(\'./types/environment.d.ts\').validateDBEnvironment()"';
        }
        
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
        return packageJsonPath;
      } catch (error) {
        // Continue
      }
    }

    return null;
  }

  /**
   * Ensure gitignore entries for sensitive files
   */
  private async ensureGitignoreEntries(): Promise<string | null> {
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    const requiredEntries = [
      '.env',
      '.env.local',
      '.env.*.local',
      '**/.env',
      '**/node_modules',
      '.agentwise/credentials/',
      '.agentwise/backups/'
    ];

    try {
      let content = '';
      let exists = existsSync(gitignorePath);
      
      if (exists) {
        content = await fs.readFile(gitignorePath, 'utf8');
      }

      const lines = content.split('\n');
      const existingEntries = new Set(lines.map(line => line.trim()));
      const newEntries: string[] = [];

      for (const entry of requiredEntries) {
        if (!existingEntries.has(entry) && !existingEntries.has(entry.replace(/\*\*/g, '*'))) {
          newEntries.push(entry);
        }
      }

      if (newEntries.length > 0) {
        const separator = exists ? '\n\n# Database and AgentWise files\n' : '# Database and AgentWise files\n';
        const newContent = content + separator + newEntries.join('\n') + '\n';
        
        await fs.writeFile(gitignorePath, newContent, 'utf8');
        return gitignorePath;
      }

      return exists ? null : gitignorePath;
    } catch (error) {
      throw new ConfigurationError(
        `Failed to update .gitignore: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create backups of existing files
   */
  private async createBackups(): Promise<void> {
    await fs.mkdir(this.backupDir, { recursive: true });
    
    const filesToBackup = [
      '.env',
      '.env.local',
      '.gitignore',
      'next.config.js',
      'vite.config.js',
      'webpack.config.js'
    ];

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    for (const filename of filesToBackup) {
      const sourcePath = path.join(this.projectRoot, filename);
      
      if (existsSync(sourcePath)) {
        const backupPath = path.join(this.backupDir, `${filename}.${timestamp}`);
        try {
          await fs.copyFile(sourcePath, backupPath);
        } catch (error) {
          // Continue with other files
        }
      }
    }
  }

  /**
   * Quote environment variable value if needed
   */
  private quoteValue(value: string): string {
    // Quote if contains spaces or special characters
    if (value.includes(' ') || value.includes('\n') || value.includes('\t') || value.includes('"') || value.includes('\\')) {
      // Escape backslashes first, then quotes
      const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `"${escaped}"`;
    }
    return value;
  }

  /**
   * Validate environment variables
   */
  async validateEnvironment(variables: EnvironmentVariable[]): Promise<{ valid: boolean; missing: string[]; invalid: string[] }> {
    const missing: string[] = [];
    const invalid: string[] = [];

    for (const variable of variables) {
      const value = process.env[variable.key];
      
      if (variable.required && !value) {
        missing.push(variable.key);
      } else if (value) {
        // Basic validation - could be extended
        if (variable.key.includes('URL') && value && !this.isValidUrl(value)) {
          invalid.push(variable.key);
        }
        if (variable.key.includes('PORT') && value && !this.isValidPort(value)) {
          invalid.push(variable.key);
        }
      }
    }

    return {
      valid: missing.length === 0 && invalid.length === 0,
      missing,
      invalid
    };
  }

  /**
   * Validate URL format
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate port number
   */
  private isValidPort(port: string): boolean {
    const num = parseInt(port, 10);
    return !isNaN(num) && num > 0 && num <= 65535;
  }
}