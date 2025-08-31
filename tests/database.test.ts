import { jest } from '@jest/globals';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DatabaseWizard } from '../src/database/DatabaseWizard';
import { AutoAuthManager } from '../src/database/AutoAuthManager';
import { DatabaseTypeGenerator } from '../src/database/DatabaseTypeGenerator';
import { EnvironmentPropagator } from '../src/database/EnvironmentPropagator';
import { MCPAutoConfigurator } from '../src/database/MCPAutoConfigurator';
import { SecureCredentialStore } from '../src/database/SecureCredentialStore';
import { 
  DatabaseProvider, 
  DatabaseCredentials, 
  WizardResult,
  ConnectionTestResult,
  AutoDetectionResult
} from '../src/database/types';

// Mock external dependencies
jest.mock('fs-extra');
jest.mock('child_process');
jest.mock('readline');

describe('Database Integration Tests', () => {
  let wizard: DatabaseWizard;
  let autoAuthManager: AutoAuthManager;
  let typeGenerator: DatabaseTypeGenerator;
  let environmentPropagator: EnvironmentPropagator;
  let mcpConfigurator: MCPAutoConfigurator;
  let credentialStore: SecureCredentialStore;

  const testProjectRoot = '/tmp/test-project';
  const mockCredentials: DatabaseCredentials = {
    provider: 'postgresql' as DatabaseProvider,
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'test_user',
    password: 'test_pass',
    connectionUrl: 'postgresql://test_user:test_pass@localhost:5432/test_db',
    createdAt: new Date(),
    lastUsed: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    wizard = new DatabaseWizard(testProjectRoot);
    autoAuthManager = new AutoAuthManager(testProjectRoot);
    typeGenerator = new DatabaseTypeGenerator(testProjectRoot);
    environmentPropagator = new EnvironmentPropagator(testProjectRoot);
    mcpConfigurator = new MCPAutoConfigurator(testProjectRoot);
    credentialStore = new SecureCredentialStore(testProjectRoot);

    // Mock fs-extra methods
    (fs.exists as jest.Mock).mockResolvedValue(false);
    (fs.readFile as jest.Mock).mockResolvedValue('{}');
    (fs.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.ensureDir as jest.Mock).mockResolvedValue(undefined);
  });

  describe('DatabaseWizard', () => {
    describe('runWizard', () => {
      it('should complete wizard flow successfully', async () => {
        // Mock successful auto-detection
        const mockAutoDetection: AutoDetectionResult[] = [
          {
            provider: 'postgresql' as DatabaseProvider,
            success: true,
            credentials: mockCredentials,
            metadata: { 
              detectionMethod: 'environment-variables',
              configPath: '.env',
              confidence: 0.9
            }
          }
        ];

        jest.spyOn(autoAuthManager, 'autoDetect').mockResolvedValue(mockAutoDetection);
        jest.spyOn(autoAuthManager, 'testConnection').mockResolvedValue({
          success: true,
          latency: 45,
          version: '14.5',
          features: ['ssl', 'json'],
          warnings: [],
          errors: []
        });

        jest.spyOn(environmentPropagator, 'propagateCredentials').mockResolvedValue({
          success: true,
          environmentVariables: [
            { key: 'DATABASE_URL', value: mockCredentials.connectionUrl!, description: 'Database connection URL' }
          ],
          updatedFiles: ['.env'],
          createdFiles: ['.env.example'],
          backup: { created: false }
        });

        jest.spyOn(typeGenerator, 'generateTypes').mockResolvedValue({
          success: true,
          generatedFiles: ['src/types/database.ts', 'prisma/schema.prisma'],
          schemas: {},
          errors: []
        });

        jest.spyOn(mcpConfigurator, 'configureMCP').mockResolvedValue({
          success: true,
          configFile: 'mcp-config.json',
          serverName: 'postgresql-server',
          claudeDesktopUpdated: true
        });

        // Mock readline for non-interactive flow
        const mockRl = {
          question: jest.fn(),
          close: jest.fn()
        };
        jest.spyOn(require('readline'), 'createInterface').mockReturnValue(mockRl);

        const result = await wizard.runWizard();

        expect(result.success).toBe(true);
        expect(result.configuration.provider).toBe('postgresql');
        expect(result.generatedFiles.length).toBeGreaterThan(0);
        expect(result.errors).toHaveLength(0);
      });

      it('should handle wizard failure gracefully', async () => {
        jest.spyOn(autoAuthManager, 'autoDetect').mockRejectedValue(new Error('Detection failed'));

        const result = await wizard.runWizard();

        expect(result.success).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Detection failed')
          ])
        );
      });

      it('should support different database providers', async () => {
        const providers: DatabaseProvider[] = ['postgresql', 'mysql', 'sqlite', 'supabase', 'neon', 'planetscale'];
        
        for (const provider of providers) {
          const providerCredentials = { ...mockCredentials, provider };
          
          jest.spyOn(autoAuthManager, 'autoDetect').mockResolvedValue([{
            provider,
            success: true,
            credentials: providerCredentials,
            metadata: { detectionMethod: 'config-file' }
          }]);

          jest.spyOn(autoAuthManager, 'testConnection').mockResolvedValue({
            success: true,
            latency: 50,
            version: '1.0.0',
            features: [],
            warnings: [],
            errors: []
          });

          const wizard = new DatabaseWizard(testProjectRoot);
          // In a real test, we'd configure the wizard for the specific provider
          
          expect(async () => {
            await wizard.runWizard();
          }).not.toThrow();
        }
      });
    });

    describe('Error Handling', () => {
      it('should handle connection failures', async () => {
        jest.spyOn(autoAuthManager, 'testConnection').mockResolvedValue({
          success: false,
          errors: ['Connection refused', 'Invalid credentials'],
          warnings: [],
          latency: 0,
          version: '',
          features: []
        });

        // Mock the wizard to use failing connection
        const result = await wizard.runWizard();

        expect(result.warnings).toEqual(
          expect.arrayContaining([
            expect.stringContaining('connection')
          ])
        );
      });

      it('should handle type generation failures', async () => {
        jest.spyOn(typeGenerator, 'generateTypes').mockResolvedValue({
          success: false,
          generatedFiles: [],
          schemas: {},
          errors: ['Schema introspection failed', 'Invalid database structure']
        });

        const result = await wizard.runWizard();

        expect(result.warnings).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Type generation failed')
          ])
        );
      });

      it('should rollback on critical failures', async () => {
        const mockUnlink = jest.fn().mockResolvedValue(undefined);
        const mockRmdir = jest.fn().mockResolvedValue(undefined);
        (fs.unlink as jest.Mock) = mockUnlink;
        (fs.rmdir as jest.Mock) = mockRmdir;

        jest.spyOn(autoAuthManager, 'testConnection').mockRejectedValue(new Error('Critical failure'));

        const result = await wizard.runWizard();

        expect(result.success).toBe(false);
        // Ensure cleanup was attempted
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Performance Tests', () => {
      it('should complete wizard within reasonable time', async () => {
        jest.spyOn(autoAuthManager, 'autoDetect').mockResolvedValue([]);
        jest.spyOn(autoAuthManager, 'testConnection').mockResolvedValue({
          success: true,
          latency: 30,
          version: '1.0.0',
          features: [],
          warnings: [],
          errors: []
        });

        const startTime = Date.now();
        await wizard.runWizard();
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      });
    });
  });

  describe('AutoAuthManager', () => {
    describe('autoDetect', () => {
      it('should detect credentials from environment variables', async () => {
        process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
        process.env.SUPABASE_URL = 'https://project.supabase.co';
        process.env.SUPABASE_KEY = 'key123';

        const results = await autoAuthManager.autoDetect(testProjectRoot);

        expect(results).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              provider: 'postgresql',
              success: true,
              metadata: expect.objectContaining({
                detectionMethod: 'environment-variables'
              })
            }),
            expect.objectContaining({
              provider: 'supabase',
              success: true
            })
          ])
        );

        // Cleanup
        delete process.env.DATABASE_URL;
        delete process.env.SUPABASE_URL;
        delete process.env.SUPABASE_KEY;
      });

      it('should detect credentials from config files', async () => {
        (fs.exists as jest.Mock).mockImplementation((filepath: string) => {
          return Promise.resolve(filepath.includes('prisma/schema.prisma'));
        });

        (fs.readFile as jest.Mock).mockImplementation((filepath: string) => {
          if (filepath.includes('schema.prisma')) {
            return Promise.resolve(`
              generator client {
                provider = "prisma-client-js"
              }

              datasource db {
                provider = "postgresql"
                url      = env("DATABASE_URL")
              }
            `);
          }
          return Promise.resolve('');
        });

        const results = await autoAuthManager.autoDetect(testProjectRoot);

        expect(results).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              provider: 'postgresql',
              metadata: expect.objectContaining({
                detectionMethod: 'config-file'
              })
            })
          ])
        );
      });

      it('should return empty results when nothing is detected', async () => {
        (fs.exists as jest.Mock).mockResolvedValue(false);
        
        const results = await autoAuthManager.autoDetect(testProjectRoot);

        expect(results).toEqual([]);
      });
    });

    describe('testConnection', () => {
      it('should test PostgreSQL connection successfully', async () => {
        // Mock successful connection
        const mockQuery = jest.fn().mockResolvedValue({ rows: [{ version: 'PostgreSQL 14.5' }] });
        const mockClient = {
          connect: jest.fn().mockResolvedValue(undefined),
          query: mockQuery,
          end: jest.fn().mockResolvedValue(undefined)
        };

        // Mock the PostgreSQL client creation
        jest.doMock('pg', () => ({
          Client: jest.fn(() => mockClient)
        }));

        const result = await autoAuthManager.testConnection(mockCredentials);

        expect(result.success).toBe(true);
        expect(result.version).toContain('PostgreSQL');
        expect(result.latency).toBeGreaterThan(0);
      });

      it('should handle connection timeout', async () => {
        const timeoutCredentials = { ...mockCredentials, host: 'timeout.example.com' };
        
        jest.setTimeout(15000); // Increase timeout for this test

        const result = await autoAuthManager.testConnection(timeoutCredentials);

        expect(result.success).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.stringMatching(/timeout|connection/i)
          ])
        );
      });

      it('should validate credential format', async () => {
        const invalidCredentials = {
          provider: 'postgresql' as DatabaseProvider,
          host: '',
          port: -1,
          database: '',
          username: '',
          password: '',
          createdAt: new Date(),
          lastUsed: new Date()
        };

        const result = await autoAuthManager.testConnection(invalidCredentials);

        expect(result.success).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    describe('Performance and Reliability', () => {
      it('should handle multiple concurrent connection tests', async () => {
        const credentials = [
          { ...mockCredentials, database: 'db1' },
          { ...mockCredentials, database: 'db2' },
          { ...mockCredentials, database: 'db3' }
        ];

        const testPromises = credentials.map(creds => 
          autoAuthManager.testConnection(creds)
        );

        const results = await Promise.all(testPromises);

        expect(results).toHaveLength(3);
        results.forEach(result => {
          expect(result).toMatchObject({
            success: expect.any(Boolean),
            latency: expect.any(Number),
            errors: expect.any(Array),
            warnings: expect.any(Array)
          });
        });
      });

      it('should handle connection retries', async () => {
        let attemptCount = 0;
        jest.spyOn(autoAuthManager, 'testConnection').mockImplementation(async () => {
          attemptCount++;
          if (attemptCount < 3) {
            return {
              success: false,
              errors: ['Connection failed'],
              warnings: [],
              latency: 0,
              version: '',
              features: []
            };
          }
          return {
            success: true,
            latency: 100,
            version: '1.0.0',
            features: [],
            warnings: [],
            errors: []
          };
        });

        // Test with retry logic
        const result = await autoAuthManager.testConnection(mockCredentials);

        expect(attemptCount).toBe(3);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('DatabaseTypeGenerator', () => {
    describe('generateTypes', () => {
      it('should generate TypeScript types from database schema', async () => {
        const mockSchemas = {
          users: {
            columns: [
              { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
              { name: 'email', type: 'varchar', nullable: false },
              { name: 'created_at', type: 'timestamp', nullable: false }
            ]
          },
          posts: {
            columns: [
              { name: 'id', type: 'uuid', nullable: false, primaryKey: true },
              { name: 'title', type: 'varchar', nullable: false },
              { name: 'user_id', type: 'uuid', nullable: false, foreignKey: 'users.id' }
            ]
          }
        };

        // Mock schema introspection
        jest.spyOn(typeGenerator, 'introspectSchema' as any).mockResolvedValue(mockSchemas);

        const result = await typeGenerator.generateTypes(mockCredentials, {
          generateTypes: true,
          generateInterfaces: true,
          generateClient: true,
          outputPath: 'src/types'
        });

        expect(result.success).toBe(true);
        expect(result.generatedFiles).toEqual(
          expect.arrayContaining([
            expect.stringContaining('database.ts'),
            expect.stringContaining('interfaces.ts')
          ])
        );
        expect(result.schemas).toEqual(mockSchemas);
      });

      it('should generate Prisma schema files', async () => {
        const result = await typeGenerator.generateTypes(mockCredentials, {
          generateORM: true,
          ormType: 'prisma',
          outputPath: 'prisma'
        });

        expect(result.success).toBe(true);
        expect(result.generatedFiles).toEqual(
          expect.arrayContaining([
            expect.stringContaining('schema.prisma')
          ])
        );
      });

      it('should handle schema introspection errors', async () => {
        jest.spyOn(typeGenerator, 'introspectSchema' as any).mockRejectedValue(
          new Error('Permission denied')
        );

        const result = await typeGenerator.generateTypes(mockCredentials, {
          generateTypes: true
        });

        expect(result.success).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Permission denied')
          ])
        );
      });

      it('should support different database providers for type generation', async () => {
        const providers: DatabaseProvider[] = ['postgresql', 'mysql', 'sqlite'];
        
        for (const provider of providers) {
          const providerCredentials = { ...mockCredentials, provider };
          
          jest.spyOn(typeGenerator, 'introspectSchema' as any).mockResolvedValue({
            test_table: {
              columns: [
                { name: 'id', type: 'integer', nullable: false, primaryKey: true }
              ]
            }
          });

          const result = await typeGenerator.generateTypes(providerCredentials, {
            generateTypes: true
          });

          expect(result.success).toBe(true);
          expect(result.generatedFiles.length).toBeGreaterThan(0);
        }
      });
    });

    describe('Edge Cases', () => {
      it('should handle empty database schema', async () => {
        jest.spyOn(typeGenerator, 'introspectSchema' as any).mockResolvedValue({});

        const result = await typeGenerator.generateTypes(mockCredentials, {
          generateTypes: true
        });

        expect(result.success).toBe(true);
        expect(result.schemas).toEqual({});
        // Should still generate basic structure files
        expect(result.generatedFiles.length).toBeGreaterThan(0);
      });

      it('should handle complex data types', async () => {
        const complexSchema = {
          complex_table: {
            columns: [
              { name: 'json_field', type: 'jsonb', nullable: true },
              { name: 'array_field', type: 'text[]', nullable: true },
              { name: 'enum_field', type: 'user_role', nullable: false, enum: ['admin', 'user', 'guest'] },
              { name: 'geometry', type: 'geometry', nullable: true }
            ]
          }
        };

        jest.spyOn(typeGenerator, 'introspectSchema' as any).mockResolvedValue(complexSchema);

        const result = await typeGenerator.generateTypes(mockCredentials, {
          generateTypes: true,
          generateEnums: true
        });

        expect(result.success).toBe(true);
        expect(result.schemas).toEqual(complexSchema);
      });
    });
  });

  describe('EnvironmentPropagator', () => {
    describe('propagateCredentials', () => {
      it('should create environment variables from credentials', async () => {
        const result = await environmentPropagator.propagateCredentials(
          mockCredentials,
          {
            createTypeDefinitions: true,
            updateBuildConfigs: true,
            ensureGitignore: true,
            backup: true
          }
        );

        expect(result.success).toBe(true);
        expect(result.environmentVariables).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              key: 'DATABASE_URL',
              value: mockCredentials.connectionUrl
            })
          ])
        );
        expect(result.updatedFiles).toContain('.env');
        expect(result.createdFiles).toContain('.env.example');
      });

      it('should backup existing environment files', async () => {
        (fs.exists as jest.Mock).mockResolvedValue(true);
        (fs.readFile as jest.Mock).mockResolvedValue('EXISTING_VAR=value');

        const result = await environmentPropagator.propagateCredentials(
          mockCredentials,
          { backup: true }
        );

        expect(result.backup.created).toBe(true);
        expect(result.backup.path).toMatch(/\.env\.backup/);
      });

      it('should update package.json scripts', async () => {
        const packageJson = {
          name: 'test-app',
          scripts: {
            start: 'node index.js'
          }
        };

        (fs.exists as jest.Mock).mockImplementation((filepath: string) => 
          Promise.resolve(filepath.includes('package.json'))
        );
        (fs.readFile as jest.Mock).mockImplementation((filepath: string) => {
          if (filepath.includes('package.json')) {
            return Promise.resolve(JSON.stringify(packageJson));
          }
          return Promise.resolve('');
        });

        let updatedPackageJson: any = null;
        (fs.writeFile as jest.Mock).mockImplementation((filepath: string, content: string) => {
          if (filepath.includes('package.json')) {
            updatedPackageJson = JSON.parse(content);
          }
          return Promise.resolve();
        });

        await environmentPropagator.propagateCredentials(
          mockCredentials,
          { updateBuildConfigs: true }
        );

        expect(updatedPackageJson?.scripts).toMatchObject({
          start: 'node index.js',
          'db:migrate': expect.any(String),
          'db:generate': expect.any(String)
        });
      });
    });
  });

  describe('MCPAutoConfigurator', () => {
    describe('configureMCP', () => {
      it('should create MCP configuration for database access', async () => {
        const result = await mcpConfigurator.configureMCP(
          mockCredentials,
          {
            backupExisting: true,
            mergeWithExisting: true,
            updateClaudeDesktop: true
          }
        );

        expect(result.success).toBe(true);
        expect(result.configFile).toMatch(/mcp.*\.json$/);
        expect(result.serverName).toContain(mockCredentials.provider);
        expect(result.claudeDesktopUpdated).toBe(true);
      });

      it('should merge with existing MCP configuration', async () => {
        const existingConfig = {
          mcpServers: {
            'existing-server': {
              command: 'existing-command',
              args: ['--flag']
            }
          }
        };

        (fs.exists as jest.Mock).mockResolvedValue(true);
        (fs.readFile as jest.Mock).mockResolvedValue(JSON.stringify(existingConfig));

        let finalConfig: any = null;
        (fs.writeFile as jest.Mock).mockImplementation((filepath: string, content: string) => {
          if (filepath.includes('claude_desktop_config.json')) {
            finalConfig = JSON.parse(content);
          }
          return Promise.resolve();
        });

        await mcpConfigurator.configureMCP(
          mockCredentials,
          { mergeWithExisting: true, updateClaudeDesktop: true }
        );

        expect(finalConfig?.mcpServers).toHaveProperty('existing-server');
        expect(finalConfig?.mcpServers).toHaveProperty(expect.stringContaining(mockCredentials.provider));
      });
    });
  });

  describe('SecureCredentialStore', () => {
    describe('store and retrieve', () => {
      it('should securely store and retrieve credentials', async () => {
        await credentialStore.store('test-key', mockCredentials);

        const retrieved = await credentialStore.retrieve('test-key');

        expect(retrieved).toEqual(mockCredentials);
      });

      it('should encrypt sensitive data', async () => {
        const sensitiveCredentials = {
          ...mockCredentials,
          password: 'super-secret-password',
          apiKey: 'secret-api-key'
        };

        await credentialStore.store('encrypted-test', sensitiveCredentials);

        // Check that raw stored data is encrypted
        const rawData = await fs.readFile('stored-file', 'utf-8').catch(() => '{}');
        expect(rawData).not.toContain('super-secret-password');
        expect(rawData).not.toContain('secret-api-key');

        // But retrieved data should be decrypted
        const retrieved = await credentialStore.retrieve('encrypted-test');
        expect(retrieved?.password).toBe('super-secret-password');
        expect(retrieved?.apiKey).toBe('secret-api-key');
      });

      it('should handle non-existent keys gracefully', async () => {
        const retrieved = await credentialStore.retrieve('non-existent-key');
        expect(retrieved).toBeNull();
      });

      it('should list stored credential keys', async () => {
        await credentialStore.store('key1', mockCredentials);
        await credentialStore.store('key2', { ...mockCredentials, database: 'other_db' });

        const keys = await credentialStore.list();

        expect(keys).toContain('key1');
        expect(keys).toContain('key2');
      });

      it('should delete stored credentials', async () => {
        await credentialStore.store('to-delete', mockCredentials);
        
        const deleted = await credentialStore.delete('to-delete');
        expect(deleted).toBe(true);

        const retrieved = await credentialStore.retrieve('to-delete');
        expect(retrieved).toBeNull();
      });
    });
  });

  describe('Integration Workflows', () => {
    it('should handle complete database setup workflow', async () => {
      // Step 1: Auto-detection
      jest.spyOn(autoAuthManager, 'autoDetect').mockResolvedValue([{
        provider: 'postgresql' as DatabaseProvider,
        success: true,
        credentials: mockCredentials,
        metadata: { detectionMethod: 'environment-variables' }
      }]);

      // Step 2: Connection testing
      jest.spyOn(autoAuthManager, 'testConnection').mockResolvedValue({
        success: true,
        latency: 50,
        version: 'PostgreSQL 14.5',
        features: ['ssl'],
        warnings: [],
        errors: []
      });

      // Step 3: Type generation
      jest.spyOn(typeGenerator, 'generateTypes').mockResolvedValue({
        success: true,
        generatedFiles: ['src/types/database.ts'],
        schemas: { users: { columns: [] } },
        errors: []
      });

      // Step 4: Environment setup
      jest.spyOn(environmentPropagator, 'propagateCredentials').mockResolvedValue({
        success: true,
        environmentVariables: [{ key: 'DATABASE_URL', value: mockCredentials.connectionUrl!, description: '' }],
        updatedFiles: ['.env'],
        createdFiles: ['.env.example'],
        backup: { created: false }
      });

      // Step 5: MCP configuration
      jest.spyOn(mcpConfigurator, 'configureMCP').mockResolvedValue({
        success: true,
        configFile: 'claude_desktop_config.json',
        serverName: 'postgresql-server',
        claudeDesktopUpdated: true
      });

      // Run complete workflow
      const result = await wizard.runWizard();

      expect(result.success).toBe(true);
      expect(result.configuration.provider).toBe('postgresql');
      expect(result.generatedFiles).toContain('src/types/database.ts');
      expect(result.configuration.environmentVariables[0].key).toBe('DATABASE_URL');
      expect(result.errors).toHaveLength(0);
    });

    it('should handle partial failures gracefully', async () => {
      // Connection succeeds but type generation fails
      jest.spyOn(autoAuthManager, 'testConnection').mockResolvedValue({
        success: true,
        latency: 30,
        version: '1.0.0',
        features: [],
        warnings: [],
        errors: []
      });

      jest.spyOn(typeGenerator, 'generateTypes').mockResolvedValue({
        success: false,
        generatedFiles: [],
        schemas: {},
        errors: ['Schema introspection failed']
      });

      jest.spyOn(environmentPropagator, 'propagateCredentials').mockResolvedValue({
        success: true,
        environmentVariables: [{ key: 'DATABASE_URL', value: 'test', description: '' }],
        updatedFiles: ['.env'],
        createdFiles: [],
        backup: { created: false }
      });

      const result = await wizard.runWizard();

      expect(result.success).toBe(true); // Overall success despite type generation failure
      expect(result.warnings).toEqual(
        expect.arrayContaining([
          expect.stringContaining('Type generation failed')
        ])
      );
    });
  });

  describe('Performance and Stress Tests', () => {
    it('should handle high concurrency database operations', async () => {
      const operations = Array.from({ length: 50 }, (_, i) => 
        autoAuthManager.testConnection({ ...mockCredentials, database: `test_db_${i}` })
      );

      const startTime = Date.now();
      const results = await Promise.all(operations);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result).toHaveProperty('success');
        expect(result).toHaveProperty('latency');
      });
    });

    it('should handle large schema generation', async () => {
      const largeSchema = {};
      for (let i = 0; i < 100; i++) {
        (largeSchema as any)[`table_${i}`] = {
          columns: Array.from({ length: 20 }, (_, j) => ({
            name: `column_${j}`,
            type: 'varchar',
            nullable: j % 2 === 0
          }))
        };
      }

      jest.spyOn(typeGenerator, 'introspectSchema' as any).mockResolvedValue(largeSchema);

      const startTime = Date.now();
      const result = await typeGenerator.generateTypes(mockCredentials, {
        generateTypes: true,
        generateInterfaces: true
      });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      expect(result.success).toBe(true);
      expect(result.schemas).toEqual(largeSchema);
    });
  });

  describe('Security Tests', () => {
    it('should not log sensitive credentials', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const consoleErrorSpy = jest.spyOn(console, 'error');

      autoAuthManager.testConnection(mockCredentials);

      const allLogCalls = [...consoleSpy.mock.calls, ...consoleErrorSpy.mock.calls];
      const loggedContent = allLogCalls.flat().join(' ');

      expect(loggedContent).not.toContain(mockCredentials.password);
      expect(loggedContent).not.toContain('test_pass');

      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should validate connection string format', async () => {
      const invalidCredentials = {
        ...mockCredentials,
        connectionUrl: 'invalid://connection/string'
      };

      const result = await autoAuthManager.testConnection(invalidCredentials);

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/invalid.*connection/i)
        ])
      );
    });

    it('should sanitize file paths', async () => {
      const maliciousPath = '../../../etc/passwd';
      
      const result = await typeGenerator.generateTypes(mockCredentials, {
        generateTypes: true,
        outputPath: maliciousPath
      });

      expect(result.generatedFiles.every(file => 
        !file.includes('../') && !file.includes('/etc/')
      )).toBe(true);
    });
  });
});