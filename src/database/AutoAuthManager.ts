/**
 * AutoAuthManager - Automatic database authentication system
 * 
 * Automatically detects and manages database authentication:
 * - Supports Supabase, Neon, PlanetScale, PostgreSQL, MySQL, SQLite
 * - Auto-detects existing credentials from various sources
 * - Securely stores and manages credentials
 * - Auto-configures MCP integration
 * - Propagates environment variables
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import { URL } from 'url';
import {
  DatabaseCredentials,
  DatabaseProvider,
  AuthenticationResult,
  AutoDetectionMethod,
  DatabaseProviderConfig,
  ConnectionTestResult,
  CredentialError,
  ConnectionError
} from './types.js';
import { SecureCredentialStore } from './SecureCredentialStore.js';
import { EnvironmentPropagator } from './EnvironmentPropagator.js';
import { MCPAutoConfigurator } from './MCPAutoConfigurator.js';

export class AutoAuthManager {
  private credentialStore: SecureCredentialStore;
  private environmentPropagator: EnvironmentPropagator;
  private mcpConfigurator: MCPAutoConfigurator;
  private detectionMethods: Map<DatabaseProvider, AutoDetectionMethod[]>;
  private providerConfigs: Map<DatabaseProvider, DatabaseProviderConfig>;

  constructor(projectRoot: string = process.cwd()) {
    this.credentialStore = new SecureCredentialStore();
    this.environmentPropagator = new EnvironmentPropagator(projectRoot);
    this.mcpConfigurator = new MCPAutoConfigurator(projectRoot);
    
    this.initializeProviderConfigs();
    this.initializeDetectionMethods();
  }

  /**
   * Auto-detect and authenticate database credentials
   */
  async autoDetect(projectPath: string = process.cwd()): Promise<AuthenticationResult[]> {
    const results: AuthenticationResult[] = [];
    const providers = Array.from(this.providerConfigs.keys());

    for (const provider of providers) {
      try {
        const result = await this.detectProvider(provider, projectPath);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        results.push({
          success: false,
          provider,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return results.sort((a, b) => {
      // Sort successful results first, then by provider priority
      if (a.success && !b.success) return -1;
      if (!a.success && b.success) return 1;
      return this.getProviderPriority(a.provider) - this.getProviderPriority(b.provider);
    });
  }

  /**
   * Detect credentials for a specific provider
   */
  async detectProvider(provider: DatabaseProvider, projectPath: string): Promise<AuthenticationResult | null> {
    const methods = this.detectionMethods.get(provider) || [];
    
    for (const method of methods.sort((a, b) => b.priority - a.priority)) {
      try {
        const credentials = await method.detect(projectPath);
        if (credentials) {
          const result: AuthenticationResult = {
            success: true,
            provider,
            credentials,
            connectionString: this.buildConnectionString(credentials),
            metadata: {
              detectionMethod: method.name,
              configLocation: projectPath,
              validatedAt: new Date()
            }
          };

          // Test connection if possible
          try {
            const connectionTest = await this.testConnection(credentials);
            if (connectionTest.success) {
              result.metadata!.validatedAt = new Date();
            }
          } catch (error) {
            // Connection test failed, but credentials were detected
            result.metadata!.connectionTestError = error instanceof Error ? error.message : 'Unknown error';
          }

          return result;
        }
      } catch (error) {
        // Continue to next detection method
        continue;
      }
    }

    return null;
  }

  /**
   * Authenticate using provided credentials
   */
  async authenticate(
    credentials: DatabaseCredentials,
    alias: string = 'default',
    autoSetup: boolean = true
  ): Promise<AuthenticationResult> {
    try {
      // Validate credentials
      this.validateCredentials(credentials);

      // Test connection
      const connectionTest = await this.testConnection(credentials);
      if (!connectionTest.success) {
        return {
          success: false,
          provider: credentials.provider,
          error: connectionTest.errors.join('; ')
        };
      }

      // Store credentials securely
      await this.credentialStore.store(alias, credentials, 'keychain');

      // Auto-setup if requested
      if (autoSetup) {
        await this.setupIntegration(credentials, alias);
      }

      return {
        success: true,
        provider: credentials.provider,
        credentials,
        connectionString: this.buildConnectionString(credentials),
        metadata: {
          detectionMethod: 'manual',
          configLocation: process.cwd(),
          validatedAt: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        provider: credentials.provider,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Setup complete integration for authenticated database
   */
  async setupIntegration(credentials: DatabaseCredentials, alias: string = 'default'): Promise<void> {
    try {
      // Propagate environment variables
      await this.environmentPropagator.propagateCredentials(credentials, {
        createTypeDefinitions: true,
        updateBuildConfigs: true,
        ensureGitignore: true,
        backup: true
      });

      // Setup MCP integration
      await this.mcpConfigurator.configureMCP(credentials, {
        backupExisting: true,
        mergeWithExisting: true,
        updateClaudeDesktop: true
      });

    } catch (error) {
      throw new CredentialError(
        `Failed to setup integration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        credentials.provider
      );
    }
  }

  /**
   * Test database connection
   */
  async testConnection(credentials: DatabaseCredentials): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const result: ConnectionTestResult = {
      success: false,
      provider: credentials.provider,
      features: [],
      warnings: [],
      errors: [],
      metadata: {
        testedAt: new Date(),
        method: 'connection_test'
      }
    };

    try {
      switch (credentials.provider) {
        case 'supabase':
          await this.testSupabaseConnection(credentials, result);
          break;
        case 'neon':
          await this.testNeonConnection(credentials, result);
          break;
        case 'planetscale':
          await this.testPlanetScaleConnection(credentials, result);
          break;
        case 'postgresql':
          await this.testPostgreSQLConnection(credentials, result);
          break;
        case 'mysql':
          await this.testMySQLConnection(credentials, result);
          break;
        case 'sqlite':
          await this.testSQLiteConnection(credentials, result);
          break;
        default:
          throw new ConnectionError(`Unsupported provider: ${credentials.provider}`);
      }

      result.latency = Date.now() - startTime;
      result.success = true;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
      result.latency = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Initialize provider configurations
   */
  private initializeProviderConfigs(): void {
    this.providerConfigs = new Map([
      ['supabase', {
        provider: 'supabase',
        name: 'Supabase',
        defaultPort: 5432,
        supportsSSL: true,
        authMethods: ['url', 'credentials', 'service_key'],
        connectionStringFormat: 'postgresql://<user>:<password>@<host>:<port>/<database>',
        mcpServerName: 'supabase',
        environmentVariables: {
          required: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
          optional: ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_PROJECT_ID'],
          sensitive: ['SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
        },
        typeMapping: {
          'text': 'string',
          'varchar': 'string',
          'integer': 'number',
          'bigint': 'number',
          'boolean': 'boolean',
          'timestamp': 'Date',
          'uuid': 'string',
          'jsonb': 'object'
        },
        features: {
          schemas: true,
          views: true,
          functions: true,
          customTypes: true,
          fullTextSearch: true,
          jsonb: true,
          arrays: true
        }
      }],
      ['neon', {
        provider: 'neon',
        name: 'Neon',
        defaultPort: 5432,
        supportsSSL: true,
        authMethods: ['url'],
        connectionStringFormat: 'postgresql://<user>:<password>@<host>/<database>?sslmode=require',
        environmentVariables: {
          required: ['DATABASE_URL'],
          optional: ['NEON_PROJECT_ID', 'NEON_BRANCH'],
          sensitive: ['DATABASE_URL']
        },
        typeMapping: {
          'text': 'string',
          'varchar': 'string',
          'integer': 'number',
          'bigint': 'number',
          'boolean': 'boolean',
          'timestamp': 'Date',
          'uuid': 'string',
          'jsonb': 'object'
        },
        features: {
          schemas: true,
          views: true,
          functions: true,
          customTypes: true,
          fullTextSearch: true,
          jsonb: true,
          arrays: true
        }
      }],
      ['planetscale', {
        provider: 'planetscale',
        name: 'PlanetScale',
        defaultPort: 3306,
        supportsSSL: true,
        authMethods: ['url'],
        connectionStringFormat: 'mysql://<user>:<password>@<host>/<database>?sslaccept=strict',
        environmentVariables: {
          required: ['DATABASE_URL'],
          optional: ['PLANETSCALE_DB', 'PLANETSCALE_BRANCH'],
          sensitive: ['DATABASE_URL']
        },
        typeMapping: {
          'varchar': 'string',
          'text': 'string',
          'int': 'number',
          'bigint': 'number',
          'tinyint': 'boolean',
          'datetime': 'Date',
          'timestamp': 'Date',
          'json': 'object'
        },
        features: {
          schemas: false,
          views: true,
          functions: false,
          customTypes: false,
          fullTextSearch: true,
          jsonb: false,
          arrays: false
        }
      }],
      ['postgresql', {
        provider: 'postgresql',
        name: 'PostgreSQL',
        defaultPort: 5432,
        supportsSSL: true,
        authMethods: ['url', 'credentials'],
        connectionStringFormat: 'postgresql://<user>:<password>@<host>:<port>/<database>',
        environmentVariables: {
          required: ['DATABASE_URL'],
          optional: ['PGHOST', 'PGPORT', 'PGUSER', 'PGPASSWORD', 'PGDATABASE'],
          sensitive: ['DATABASE_URL', 'PGPASSWORD']
        },
        typeMapping: {
          'text': 'string',
          'varchar': 'string',
          'integer': 'number',
          'bigint': 'number',
          'boolean': 'boolean',
          'timestamp': 'Date',
          'uuid': 'string',
          'jsonb': 'object'
        },
        features: {
          schemas: true,
          views: true,
          functions: true,
          customTypes: true,
          fullTextSearch: true,
          jsonb: true,
          arrays: true
        }
      }],
      ['mysql', {
        provider: 'mysql',
        name: 'MySQL',
        defaultPort: 3306,
        supportsSSL: true,
        authMethods: ['url', 'credentials'],
        connectionStringFormat: 'mysql://<user>:<password>@<host>:<port>/<database>',
        environmentVariables: {
          required: ['DATABASE_URL'],
          optional: ['MYSQL_HOST', 'MYSQL_PORT', 'MYSQL_USER', 'MYSQL_PASSWORD', 'MYSQL_DATABASE'],
          sensitive: ['DATABASE_URL', 'MYSQL_PASSWORD']
        },
        typeMapping: {
          'varchar': 'string',
          'text': 'string',
          'int': 'number',
          'bigint': 'number',
          'tinyint': 'boolean',
          'datetime': 'Date',
          'timestamp': 'Date',
          'json': 'object'
        },
        features: {
          schemas: true,
          views: true,
          functions: true,
          customTypes: false,
          fullTextSearch: true,
          jsonb: false,
          arrays: false
        }
      }],
      ['sqlite', {
        provider: 'sqlite',
        name: 'SQLite',
        defaultPort: 0,
        supportsSSL: false,
        authMethods: ['credentials'],
        connectionStringFormat: 'file:<path>',
        environmentVariables: {
          required: ['DATABASE_PATH'],
          optional: [],
          sensitive: []
        },
        typeMapping: {
          'TEXT': 'string',
          'INTEGER': 'number',
          'REAL': 'number',
          'BLOB': 'Buffer',
          'NUMERIC': 'number'
        },
        features: {
          schemas: false,
          views: true,
          functions: false,
          customTypes: false,
          fullTextSearch: true,
          jsonb: false,
          arrays: false
        }
      }]
    ]);
  }

  /**
   * Initialize detection methods for each provider
   */
  private initializeDetectionMethods(): void {
    this.detectionMethods = new Map([
      ['supabase', [
        {
          name: 'supabase_config',
          description: 'Detect from Supabase config files',
          priority: 10,
          detect: this.detectSupabaseConfig.bind(this)
        },
        {
          name: 'environment_variables',
          description: 'Detect from environment variables',
          priority: 8,
          detect: this.detectSupabaseFromEnv.bind(this)
        },
        {
          name: 'package_json',
          description: 'Detect from package.json dependencies',
          priority: 6,
          detect: this.detectSupabaseFromPackageJson.bind(this)
        }
      ]],
      ['neon', [
        {
          name: 'neon_config',
          description: 'Detect from Neon config files',
          priority: 10,
          detect: this.detectNeonConfig.bind(this)
        },
        {
          name: 'environment_variables',
          description: 'Detect from environment variables',
          priority: 8,
          detect: this.detectNeonFromEnv.bind(this)
        }
      ]],
      ['planetscale', [
        {
          name: 'planetscale_config',
          description: 'Detect from PlanetScale config files',
          priority: 10,
          detect: this.detectPlanetScaleConfig.bind(this)
        },
        {
          name: 'environment_variables',
          description: 'Detect from environment variables',
          priority: 8,
          detect: this.detectPlanetScaleFromEnv.bind(this)
        }
      ]],
      ['postgresql', [
        {
          name: 'pg_config',
          description: 'Detect from PostgreSQL config files',
          priority: 10,
          detect: this.detectPostgreSQLConfig.bind(this)
        },
        {
          name: 'environment_variables',
          description: 'Detect from environment variables',
          priority: 8,
          detect: this.detectPostgreSQLFromEnv.bind(this)
        }
      ]],
      ['mysql', [
        {
          name: 'mysql_config',
          description: 'Detect from MySQL config files',
          priority: 10,
          detect: this.detectMySQLConfig.bind(this)
        },
        {
          name: 'environment_variables',
          description: 'Detect from environment variables',
          priority: 8,
          detect: this.detectMySQLFromEnv.bind(this)
        }
      ]],
      ['sqlite', [
        {
          name: 'sqlite_files',
          description: 'Detect SQLite database files',
          priority: 10,
          detect: this.detectSQLiteFiles.bind(this)
        },
        {
          name: 'environment_variables',
          description: 'Detect from environment variables',
          priority: 8,
          detect: this.detectSQLiteFromEnv.bind(this)
        }
      ]]
    ]);
  }

  /**
   * Detection methods for Supabase
   */
  private async detectSupabaseConfig(projectPath: string): Promise<DatabaseCredentials | null> {
    const configPaths = [
      path.join(projectPath, 'supabase', 'config.toml'),
      path.join(projectPath, '.supabase', 'config.toml')
    ];

    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        try {
          const content = await fs.readFile(configPath, 'utf8');
          // Parse TOML config (simplified)
          const urlMatch = content.match(/api\.url\s*=\s*"([^"]+)"/);
          const keyMatch = content.match(/anon_key\s*=\s*"([^"]+)"/);

          if (urlMatch && keyMatch) {
            return {
              provider: 'supabase',
              connectionUrl: urlMatch[1],
              apiKey: keyMatch[1],
              createdAt: new Date(),
              lastUsed: new Date()
            };
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  private async detectSupabaseFromEnv(projectPath: string): Promise<DatabaseCredentials | null> {
    const envFiles = ['.env.local', '.env', '.env.example'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(projectPath, envFile);
      if (existsSync(envPath)) {
        try {
          const content = await fs.readFile(envPath, 'utf8');
          const lines = content.split('\n');
          
          let supabaseUrl = '';
          let supabaseKey = '';
          
          for (const line of lines) {
            const match = line.match(/^(SUPABASE_URL|NEXT_PUBLIC_SUPABASE_URL)\s*=\s*(.+)$/);
            if (match) supabaseUrl = match[2].replace(/['"]/g, '');
            
            const keyMatch = line.match(/^(SUPABASE_ANON_KEY|NEXT_PUBLIC_SUPABASE_ANON_KEY)\s*=\s*(.+)$/);
            if (keyMatch) supabaseKey = keyMatch[2].replace(/['"]/g, '');
          }
          
          if (supabaseUrl && supabaseKey) {
            return {
              provider: 'supabase',
              connectionUrl: supabaseUrl,
              apiKey: supabaseKey,
              createdAt: new Date(),
              lastUsed: new Date()
            };
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  private async detectSupabaseFromPackageJson(projectPath: string): Promise<DatabaseCredentials | null> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    if (existsSync(packageJsonPath)) {
      try {
        const content = await fs.readFile(packageJsonPath, 'utf8');
        const packageJson = JSON.parse(content);
        
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (dependencies['@supabase/supabase-js'] || dependencies['supabase']) {
          // Found Supabase dependency, but need to get credentials from elsewhere
          return await this.detectSupabaseFromEnv(projectPath);
        }
      } catch (error) {
        // Continue
      }
    }

    return null;
  }

  /**
   * Detection methods for Neon
   */
  private async detectNeonConfig(projectPath: string): Promise<DatabaseCredentials | null> {
    // Neon typically uses DATABASE_URL, check for Neon-specific patterns
    return this.detectNeonFromEnv(projectPath);
  }

  private async detectNeonFromEnv(projectPath: string): Promise<DatabaseCredentials | null> {
    const envFiles = ['.env.local', '.env', '.env.example'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(projectPath, envFile);
      if (existsSync(envPath)) {
        try {
          const content = await fs.readFile(envPath, 'utf8');
          const urlMatch = content.match(/^DATABASE_URL\s*=\s*(.+)$/m);
          
          if (urlMatch) {
            const url = urlMatch[1].replace(/['"]/g, '');
            if (url.includes('neon') || url.includes('@ep-')) {
              return {
                provider: 'neon',
                connectionUrl: url,
                createdAt: new Date(),
                lastUsed: new Date()
              };
            }
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Detection methods for PlanetScale
   */
  private async detectPlanetScaleConfig(projectPath: string): Promise<DatabaseCredentials | null> {
    return this.detectPlanetScaleFromEnv(projectPath);
  }

  private async detectPlanetScaleFromEnv(projectPath: string): Promise<DatabaseCredentials | null> {
    const envFiles = ['.env.local', '.env', '.env.example'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(projectPath, envFile);
      if (existsSync(envPath)) {
        try {
          const content = await fs.readFile(envPath, 'utf8');
          const urlMatch = content.match(/^DATABASE_URL\s*=\s*(.+)$/m);
          
          if (urlMatch) {
            const url = urlMatch[1].replace(/['"]/g, '');
            if (url.includes('planetscale') || url.includes('pscale_pw_')) {
              return {
                provider: 'planetscale',
                connectionUrl: url,
                createdAt: new Date(),
                lastUsed: new Date()
              };
            }
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Detection methods for PostgreSQL
   */
  private async detectPostgreSQLConfig(projectPath: string): Promise<DatabaseCredentials | null> {
    const configPaths = [
      path.join(projectPath, 'postgresql.conf'),
      path.join(projectPath, 'pg_hba.conf'),
      path.join(projectPath, '.pgpass')
    ];

    // Check for standard PostgreSQL config files
    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        // Found PostgreSQL config, try to extract connection info
        return this.detectPostgreSQLFromEnv(projectPath);
      }
    }

    return null;
  }

  private async detectPostgreSQLFromEnv(projectPath: string): Promise<DatabaseCredentials | null> {
    const envFiles = ['.env.local', '.env', '.env.example'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(projectPath, envFile);
      if (existsSync(envPath)) {
        try {
          const content = await fs.readFile(envPath, 'utf8');
          
          // Look for DATABASE_URL with postgresql:// scheme
          const urlMatch = content.match(/^DATABASE_URL\s*=\s*(.+)$/m);
          if (urlMatch) {
            const url = urlMatch[1].replace(/['"]/g, '');
            if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
              return {
                provider: 'postgresql',
                connectionUrl: url,
                createdAt: new Date(),
                lastUsed: new Date()
              };
            }
          }
          
          // Look for individual PostgreSQL environment variables
          const pgvars: any = {};
          const pgVarPattern = /^(PGHOST|PGPORT|PGUSER|PGPASSWORD|PGDATABASE)\s*=\s*(.+)$/gm;
          let match;
          
          while ((match = pgVarPattern.exec(content)) !== null) {
            pgvars[match[1]] = match[2].replace(/['"]/g, '');
          }
          
          if (pgvars.PGHOST && pgvars.PGDATABASE) {
            return {
              provider: 'postgresql',
              host: pgvars.PGHOST,
              port: pgvars.PGPORT ? parseInt(pgvars.PGPORT) : 5432,
              database: pgvars.PGDATABASE,
              username: pgvars.PGUSER,
              password: pgvars.PGPASSWORD,
              createdAt: new Date(),
              lastUsed: new Date()
            };
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Detection methods for MySQL
   */
  private async detectMySQLConfig(projectPath: string): Promise<DatabaseCredentials | null> {
    const configPaths = [
      path.join(projectPath, 'my.cnf'),
      path.join(projectPath, '.my.cnf'),
      path.join(projectPath, 'mysql.conf')
    ];

    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        return this.detectMySQLFromEnv(projectPath);
      }
    }

    return null;
  }

  private async detectMySQLFromEnv(projectPath: string): Promise<DatabaseCredentials | null> {
    const envFiles = ['.env.local', '.env', '.env.example'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(projectPath, envFile);
      if (existsSync(envPath)) {
        try {
          const content = await fs.readFile(envPath, 'utf8');
          
          // Look for DATABASE_URL with mysql:// scheme
          const urlMatch = content.match(/^DATABASE_URL\s*=\s*(.+)$/m);
          if (urlMatch) {
            const url = urlMatch[1].replace(/['"]/g, '');
            if (url.startsWith('mysql://')) {
              return {
                provider: 'mysql',
                connectionUrl: url,
                createdAt: new Date(),
                lastUsed: new Date()
              };
            }
          }
          
          // Look for individual MySQL environment variables
          const mysqlVars: any = {};
          const mysqlVarPattern = /^(MYSQL_HOST|MYSQL_PORT|MYSQL_USER|MYSQL_PASSWORD|MYSQL_DATABASE)\s*=\s*(.+)$/gm;
          let match;
          
          while ((match = mysqlVarPattern.exec(content)) !== null) {
            mysqlVars[match[1]] = match[2].replace(/['"]/g, '');
          }
          
          if (mysqlVars.MYSQL_HOST && mysqlVars.MYSQL_DATABASE) {
            return {
              provider: 'mysql',
              host: mysqlVars.MYSQL_HOST,
              port: mysqlVars.MYSQL_PORT ? parseInt(mysqlVars.MYSQL_PORT) : 3306,
              database: mysqlVars.MYSQL_DATABASE,
              username: mysqlVars.MYSQL_USER,
              password: mysqlVars.MYSQL_PASSWORD,
              createdAt: new Date(),
              lastUsed: new Date()
            };
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Detection methods for SQLite
   */
  private async detectSQLiteFiles(projectPath: string): Promise<DatabaseCredentials | null> {
    const commonPaths = [
      path.join(projectPath, 'database.sqlite'),
      path.join(projectPath, 'db.sqlite'),
      path.join(projectPath, 'app.db'),
      path.join(projectPath, 'data.db'),
      path.join(projectPath, 'prisma', 'dev.db')
    ];

    for (const dbPath of commonPaths) {
      if (existsSync(dbPath)) {
        return {
          provider: 'sqlite',
          database: dbPath,
          createdAt: new Date(),
          lastUsed: new Date()
        };
      }
    }

    return null;
  }

  private async detectSQLiteFromEnv(projectPath: string): Promise<DatabaseCredentials | null> {
    const envFiles = ['.env.local', '.env', '.env.example'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(projectPath, envFile);
      if (existsSync(envPath)) {
        try {
          const content = await fs.readFile(envPath, 'utf8');
          
          // Look for SQLite-specific variables
          const pathMatch = content.match(/^(DATABASE_PATH|SQLITE_PATH|DB_FILE)\s*=\s*(.+)$/m);
          if (pathMatch) {
            const dbPath = pathMatch[2].replace(/['"]/g, '');
            return {
              provider: 'sqlite',
              database: dbPath,
              createdAt: new Date(),
              lastUsed: new Date()
            };
          }
          
          // Look for file:// URLs
          const urlMatch = content.match(/^DATABASE_URL\s*=\s*(.+)$/m);
          if (urlMatch) {
            const url = urlMatch[1].replace(/['"]/g, '');
            if (url.startsWith('file:')) {
              return {
                provider: 'sqlite',
                database: url.replace('file:', ''),
                createdAt: new Date(),
                lastUsed: new Date()
              };
            }
          }
        } catch (error) {
          continue;
        }
      }
    }

    return null;
  }

  /**
   * Connection testing methods
   */
  private async testSupabaseConnection(credentials: DatabaseCredentials, result: ConnectionTestResult): Promise<void> {
    if (!credentials.connectionUrl || !credentials.apiKey) {
      throw new ConnectionError('Supabase requires URL and API key');
    }

    // Test REST API endpoint
    const response = await fetch(`${credentials.connectionUrl}/rest/v1/`, {
      headers: {
        'apikey': credentials.apiKey,
        'Authorization': `Bearer ${credentials.apiKey}`
      }
    });

    if (!response.ok) {
      throw new ConnectionError(`Supabase API error: ${response.status} ${response.statusText}`);
    }

    result.features.push('REST API', 'Real-time', 'Auth', 'Storage');
    result.metadata.endpoint = credentials.connectionUrl;
  }

  private async testNeonConnection(credentials: DatabaseCredentials, result: ConnectionTestResult): Promise<void> {
    if (!credentials.connectionUrl) {
      throw new ConnectionError('Neon requires connection URL');
    }

    // Simple connection test using node-postgres would go here
    // For now, validate URL format
    try {
      const url = new URL(credentials.connectionUrl);
      if (!url.hostname.includes('neon') && !url.hostname.includes('ep-')) {
        throw new ConnectionError('Invalid Neon connection URL');
      }
      
      result.features.push('PostgreSQL', 'Branching', 'Auto-scaling');
      result.metadata.endpoint = url.hostname;
    } catch (error) {
      throw new ConnectionError('Invalid connection URL format');
    }
  }

  private async testPlanetScaleConnection(credentials: DatabaseCredentials, result: ConnectionTestResult): Promise<void> {
    if (!credentials.connectionUrl) {
      throw new ConnectionError('PlanetScale requires connection URL');
    }

    try {
      const url = new URL(credentials.connectionUrl);
      if (!url.hostname.includes('planetscale') && !url.password?.includes('pscale_pw_')) {
        throw new ConnectionError('Invalid PlanetScale connection URL');
      }
      
      result.features.push('MySQL', 'Branching', 'Online DDL');
      result.metadata.endpoint = url.hostname;
    } catch (error) {
      throw new ConnectionError('Invalid connection URL format');
    }
  }

  private async testPostgreSQLConnection(credentials: DatabaseCredentials, result: ConnectionTestResult): Promise<void> {
    // Basic validation - full connection test would require pg library
    if (credentials.connectionUrl) {
      try {
        const url = new URL(credentials.connectionUrl);
        result.metadata.endpoint = url.hostname;
      } catch (error) {
        throw new ConnectionError('Invalid PostgreSQL connection URL');
      }
    } else if (!credentials.host || !credentials.database) {
      throw new ConnectionError('PostgreSQL requires host and database');
    }

    result.features.push('ACID', 'JSONB', 'Full-text Search', 'Extensions');
  }

  private async testMySQLConnection(credentials: DatabaseCredentials, result: ConnectionTestResult): Promise<void> {
    // Basic validation - full connection test would require mysql library
    if (credentials.connectionUrl) {
      try {
        const url = new URL(credentials.connectionUrl);
        result.metadata.endpoint = url.hostname;
      } catch (error) {
        throw new ConnectionError('Invalid MySQL connection URL');
      }
    } else if (!credentials.host || !credentials.database) {
      throw new ConnectionError('MySQL requires host and database');
    }

    result.features.push('InnoDB', 'MyISAM', 'Full-text Search', 'Replication');
  }

  private async testSQLiteConnection(credentials: DatabaseCredentials, result: ConnectionTestResult): Promise<void> {
    if (!credentials.database) {
      throw new ConnectionError('SQLite requires database path');
    }

    if (!existsSync(credentials.database)) {
      throw new ConnectionError(`SQLite database file not found: ${credentials.database}`);
    }

    result.features.push('Serverless', 'File-based', 'ACID', 'Full-text Search');
    result.metadata.endpoint = credentials.database;
  }

  /**
   * Utility methods
   */
  private validateCredentials(credentials: DatabaseCredentials): void {
    const config = this.providerConfigs.get(credentials.provider);
    if (!config) {
      throw new CredentialError(`Unsupported provider: ${credentials.provider}`);
    }

    // Provider-specific validation
    switch (credentials.provider) {
      case 'supabase':
        if (!credentials.connectionUrl && !credentials.apiKey) {
          throw new CredentialError('Supabase requires connection URL and API key');
        }
        break;
      case 'neon':
      case 'planetscale':
        if (!credentials.connectionUrl) {
          throw new CredentialError(`${credentials.provider} requires connection URL`);
        }
        break;
      case 'postgresql':
      case 'mysql':
        if (!credentials.connectionUrl && (!credentials.host || !credentials.database)) {
          throw new CredentialError(`${credentials.provider} requires connection URL or host/database`);
        }
        break;
      case 'sqlite':
        if (!credentials.database) {
          throw new CredentialError('SQLite requires database path');
        }
        break;
    }
  }

  private buildConnectionString(credentials: DatabaseCredentials): string | undefined {
    if (credentials.connectionUrl) {
      return credentials.connectionUrl;
    }

    const config = this.providerConfigs.get(credentials.provider);
    if (!config) return undefined;

    // Build connection string from individual components
    switch (credentials.provider) {
      case 'postgresql':
        return `postgresql://${credentials.username}:${credentials.password}@${credentials.host}:${credentials.port || config.defaultPort}/${credentials.database}`;
      case 'mysql':
        return `mysql://${credentials.username}:${credentials.password}@${credentials.host}:${credentials.port || config.defaultPort}/${credentials.database}`;
      case 'sqlite':
        return `file:${credentials.database}`;
      default:
        return undefined;
    }
  }

  private getProviderPriority(provider: DatabaseProvider): number {
    const priorities: Record<DatabaseProvider, number> = {
      supabase: 1,
      neon: 2,
      planetscale: 3,
      postgresql: 4,
      mysql: 5,
      sqlite: 6
    };
    return priorities[provider] || 10;
  }
}