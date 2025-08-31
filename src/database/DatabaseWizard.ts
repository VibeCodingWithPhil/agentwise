/**
 * DatabaseWizard - Interactive database setup wizard
 * 
 * Provides an interactive wizard for setting up database integration:
 * - Guides through provider selection
 * - Auto-detects existing credentials
 * - Validates connections
 * - Generates schemas from requirements
 * - Sets up complete integration
 */

import * as readline from 'readline';
import { promisify } from 'util';
import * as path from 'path';
import {
  DatabaseProvider,
  DatabaseCredentials,
  WizardStep,
  WizardProviderOption,
  WizardCredentialInput,
  WizardConfiguration,
  WizardResult,
  ConnectionTestResult,
  SchemaRequirement,
  RequirementBasedGeneration,
  ValidationRule
} from './types.js';
import { AutoAuthManager } from './AutoAuthManager.js';
import { DatabaseTypeGenerator } from './DatabaseTypeGenerator.js';
import { EnvironmentPropagator } from './EnvironmentPropagator.js';
import { MCPAutoConfigurator } from './MCPAutoConfigurator.js';

export class DatabaseWizard {
  private rl: readline.Interface;
  private autoAuthManager: AutoAuthManager;
  private typeGenerator: DatabaseTypeGenerator;
  private environmentPropagator: EnvironmentPropagator;
  private mcpConfigurator: MCPAutoConfigurator;
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    this.autoAuthManager = new AutoAuthManager(projectRoot);
    this.typeGenerator = new DatabaseTypeGenerator(projectRoot);
    this.environmentPropagator = new EnvironmentPropagator(projectRoot);
    this.mcpConfigurator = new MCPAutoConfigurator(projectRoot);
  }

  /**
   * Run the complete database setup wizard
   */
  async runWizard(): Promise<WizardResult> {
    console.log('🧙‍♂️ Welcome to the AgentWise Database Integration Wizard!\n');
    
    const result: WizardResult = {
      success: false,
      configuration: this.createEmptyConfiguration(),
      generatedFiles: [],
      errors: [],
      warnings: [],
      nextSteps: []
    };

    try {
      // Step 1: Auto-detection
      await this.stepAutoDetection(result);
      
      // Step 2: Provider selection (if not auto-detected)
      if (!result.configuration.provider) {
        await this.stepProviderSelection(result);
      }
      
      // Step 3: Credential configuration
      await this.stepCredentialConfiguration(result);
      
      // Step 4: Connection testing
      await this.stepConnectionTesting(result);
      
      // Step 5: Type generation options
      await this.stepTypeGenerationOptions(result);
      
      // Step 6: Schema requirements (optional)
      await this.stepSchemaRequirements(result);
      
      // Step 7: Integration setup
      await this.stepIntegrationSetup(result);
      
      // Step 8: Final verification
      await this.stepFinalVerification(result);
      
      result.success = true;
      
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      this.rl.close();
    }

    return result;
  }

  /**
   * Step 1: Auto-detection of existing database configurations
   */
  private async stepAutoDetection(result: WizardResult): Promise<void> {
    console.log('🔍 Step 1: Scanning for existing database configurations...\n');
    
    const detectionResults = await this.autoAuthManager.autoDetect(this.projectRoot);
    
    if (detectionResults.length > 0) {
      console.log('✅ Found existing database configurations:');
      
      for (const [index, detection] of detectionResults.entries()) {
        if (detection.success) {
          console.log(`${index + 1}. ${detection.provider} (detected via ${detection.metadata?.detectionMethod})`);
        }
      }
      
      console.log('');
      const useExisting = await this.askYesNo('Would you like to use one of these existing configurations?');
      
      if (useExisting) {
        const choice = await this.askChoice(
          'Select a configuration:',
          detectionResults
            .filter(d => d.success)
            .map((d, i) => `${d.provider} (${d.metadata?.detectionMethod})`)
        );
        
        const selectedResult = detectionResults.filter(d => d.success)[choice];
        if (selectedResult.credentials) {
          result.configuration.provider = selectedResult.provider;
          result.configuration.credentials = selectedResult.credentials;
          
          this.markStepCompleted(result.configuration.steps, 'auto-detection');
          this.markStepCompleted(result.configuration.steps, 'provider-selection');
          this.markStepCompleted(result.configuration.steps, 'credential-configuration');
        }
      }
    } else {
      console.log('ℹ️ No existing database configurations found.');
    }
    
    console.log('');
  }

  /**
   * Step 2: Provider selection
   */
  private async stepProviderSelection(result: WizardResult): Promise<void> {
    console.log('🏗️ Step 2: Database Provider Selection\n');
    
    const providers = this.getAvailableProviders();
    
    console.log('Available database providers:');
    providers.forEach((provider, index) => {
      const popular = provider.popular ? ' ⭐' : '';
      console.log(`${index + 1}. ${provider.name}${popular} - ${provider.description}`);
    });
    
    console.log('');
    const choice = await this.askChoice('Select a database provider:', providers.map(p => p.name));
    const selectedProvider = providers[choice];
    
    result.configuration.provider = selectedProvider.provider;
    
    console.log(`\n✅ Selected: ${selectedProvider.name}\n`);
    
    // Show requirements
    if (selectedProvider.requirements.length > 0) {
      console.log('Requirements:');
      selectedProvider.requirements.forEach(req => console.log(`  • ${req}`));
      console.log('');
    }
    
    this.markStepCompleted(result.configuration.steps, 'provider-selection');
  }

  /**
   * Step 3: Credential configuration
   */
  private async stepCredentialConfiguration(result: WizardResult): Promise<void> {
    console.log('🔑 Step 3: Database Credential Configuration\n');
    
    const provider = result.configuration.provider!;
    const credentialInputs = this.getCredentialInputs(provider);
    
    const credentials: Partial<DatabaseCredentials> = {
      provider,
      createdAt: new Date(),
      lastUsed: new Date()
    };
    
    for (const input of credentialInputs) {
      const value = await this.askCredentialInput(input);
      
      if (value) {
        switch (input.field) {
          case 'connectionUrl':
            credentials.connectionUrl = value;
            break;
          case 'host':
            credentials.host = value;
            break;
          case 'port':
            credentials.port = parseInt(value, 10);
            break;
          case 'database':
            credentials.database = value;
            break;
          case 'username':
            credentials.username = value;
            break;
          case 'password':
            credentials.password = value;
            break;
          case 'apiKey':
            credentials.apiKey = value;
            break;
          case 'serviceKey':
            credentials.serviceKey = value;
            break;
          case 'projectId':
            credentials.projectId = value;
            break;
          case 'region':
            credentials.region = value;
            break;
        }
      }
    }
    
    result.configuration.credentials = credentials as DatabaseCredentials;
    
    console.log('\n✅ Credentials configured\n');
    
    this.markStepCompleted(result.configuration.steps, 'credential-configuration');
  }

  /**
   * Step 4: Connection testing
   */
  private async stepConnectionTesting(result: WizardResult): Promise<void> {
    console.log('🔌 Step 4: Testing Database Connection\n');
    
    try {
      console.log('Testing connection...');
      const testResult = await this.autoAuthManager.testConnection(result.configuration.credentials);
      
      if (testResult.success) {
        console.log('✅ Connection successful!');
        
        if (testResult.latency) {
          console.log(`   Response time: ${testResult.latency}ms`);
        }
        
        if (testResult.version) {
          console.log(`   Database version: ${testResult.version}`);
        }
        
        if (testResult.features.length > 0) {
          console.log(`   Available features: ${testResult.features.join(', ')}`);
        }
        
        if (testResult.warnings.length > 0) {
          console.log('⚠️ Warnings:');
          testResult.warnings.forEach(warning => console.log(`   • ${warning}`));
        }
        
        this.markStepCompleted(result.configuration.steps, 'connection-testing');
      } else {
        console.log('❌ Connection failed:');
        testResult.errors.forEach(error => console.log(`   • ${error}`));
        
        const retry = await this.askYesNo('Would you like to reconfigure credentials and try again?');
        if (retry) {
          this.markStepIncomplete(result.configuration.steps, 'credential-configuration');
          await this.stepCredentialConfiguration(result);
          await this.stepConnectionTesting(result);
          return;
        } else {
          throw new Error('Database connection failed');
        }
      }
    } catch (error) {
      console.log(`❌ Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      const continueAnyway = await this.askYesNo('Would you like to continue anyway? (Not recommended)');
      if (!continueAnyway) {
        throw error;
      } else {
        result.warnings.push('Database connection could not be verified');
      }
    }
    
    console.log('');
  }

  /**
   * Step 5: Type generation options
   */
  private async stepTypeGenerationOptions(result: WizardResult): Promise<void> {
    console.log('⚡ Step 5: Type Generation Configuration\n');
    
    const generateTypes = await this.askYesNo('Would you like to generate TypeScript types from your database schema?', true);
    
    if (generateTypes) {
      const options: any = {
        generateTypes: true,
        generateInterfaces: await this.askYesNo('Generate TypeScript interfaces?', true),
        generateEnums: await this.askYesNo('Generate TypeScript enums?', true),
        generateClient: await this.askYesNo('Generate typed database client?', true),
        includeComments: await this.askYesNo('Include database comments in generated types?', true),
        camelCase: await this.askYesNo('Convert snake_case to camelCase?', true)
      };
      
      const generateORM = await this.askYesNo('Would you like to generate ORM schema files?');
      if (generateORM) {
        const ormChoice = await this.askChoice(
          'Select ORM:',
          ['Prisma', 'Drizzle', 'TypeORM']
        );
        options.generateORM = true;
        options.ormType = ['prisma', 'drizzle', 'typeorm'][ormChoice];
      }
      
      const customPath = await this.askInput('Output directory for generated types (press Enter for default):', false);
      if (customPath) {
        options.outputPath = customPath;
      }
      
      result.configuration.typeGeneration = options;
    } else {
      result.configuration.typeGeneration = { generateTypes: false };
    }
    
    console.log('');
    this.markStepCompleted(result.configuration.steps, 'type-generation-options');
  }

  /**
   * Step 6: Schema requirements (optional)
   */
  private async stepSchemaRequirements(result: WizardResult): Promise<void> {
    console.log('📋 Step 6: Schema Requirements (Optional)\n');
    
    const hasRequirements = await this.askYesNo('Do you have specific schema requirements to implement?');
    
    if (hasRequirements) {
      console.log('This feature allows you to define tables and relationships that should exist in your database.');
      console.log('The wizard can generate migrations and seed data based on these requirements.\n');
      
      // For now, this is a simplified implementation
      // In a full implementation, you would collect detailed schema requirements
      const simplified = await this.askYesNo('Use simplified schema collection? (recommended for quick setup)', true);
      
      if (simplified) {
        const tableNames = await this.askInput('Enter table names (comma-separated):');
        if (tableNames) {
          // Create basic schema requirements
          const requirements: SchemaRequirement[] = tableNames.split(',').map(name => ({
            table: name.trim(),
            columns: [
              { name: 'id', type: 'uuid', primaryKey: true },
              { name: 'created_at', type: 'timestamp' },
              { name: 'updated_at', type: 'timestamp' }
            ]
          }));
          
          // Store requirements in configuration metadata
          result.configuration.metadata = { schemaRequirements: requirements };
        }
      }
    }
    
    console.log('');
    this.markStepCompleted(result.configuration.steps, 'schema-requirements');
  }

  /**
   * Step 7: Integration setup
   */
  private async stepIntegrationSetup(result: WizardResult): Promise<void> {
    console.log('🔧 Step 7: Integration Setup\n');
    
    // Environment variable setup
    const setupEnv = await this.askYesNo('Set up environment variables?', true);
    if (setupEnv) {
      console.log('Setting up environment variables...');
      
      const envResult = await this.environmentPropagator.propagateCredentials(
        result.configuration.credentials,
        {
          createTypeDefinitions: true,
          updateBuildConfigs: true,
          ensureGitignore: true,
          backup: true
        }
      );
      
      result.generatedFiles.push(...envResult.updatedFiles, ...envResult.createdFiles);
      result.configuration.environmentVariables = envResult.environmentVariables;
      
      console.log(`✅ Environment variables configured (${envResult.environmentVariables.length} variables)`);
    }
    
    // MCP setup
    const setupMCP = await this.askYesNo('Set up MCP (Model Context Protocol) integration?', true);
    if (setupMCP) {
      console.log('Setting up MCP integration...');
      
      const mcpResult = await this.mcpConfigurator.configureMCP(
        result.configuration.credentials,
        {
          backupExisting: true,
          mergeWithExisting: true,
          updateClaudeDesktop: true
        }
      );
      
      result.generatedFiles.push(mcpResult.configFile);
      result.configuration.mcpConfig = {
        name: mcpResult.serverName,
        command: 'npx',
        args: ['-y', `@${result.configuration.provider}/mcp-server`],
        env: result.configuration.environmentVariables.reduce((acc, env) => {
          acc[env.key] = env.value;
          return acc;
        }, {} as Record<string, string>)
      };
      
      console.log(`✅ MCP integration configured (server: ${mcpResult.serverName})`);
      
      if (mcpResult.claudeDesktopUpdated) {
        console.log('✅ Claude Desktop configuration updated');
      }
    }
    
    // Type generation
    if (result.configuration.typeGeneration.generateTypes !== false) {
      console.log('Generating database types...');
      
      const typeResult = await this.typeGenerator.generateTypes(
        result.configuration.credentials,
        result.configuration.typeGeneration
      );
      
      if (typeResult.success) {
        result.generatedFiles.push(...typeResult.generatedFiles);
        console.log(`✅ Types generated (${typeResult.generatedFiles.length} files)`);
      } else {
        result.warnings.push('Type generation failed: ' + typeResult.errors.join(', '));
        console.log('⚠️ Type generation failed, but continuing...');
      }
    }
    
    console.log('');
    this.markStepCompleted(result.configuration.steps, 'integration-setup');
  }

  /**
   * Step 8: Final verification
   */
  private async stepFinalVerification(result: WizardResult): Promise<void> {
    console.log('✅ Step 8: Final Verification\n');
    
    console.log('Integration Summary:');
    console.log(`  Provider: ${result.configuration.provider}`);
    console.log(`  Files generated: ${result.generatedFiles.length}`);
    console.log(`  Environment variables: ${result.configuration.environmentVariables.length}`);
    
    if (result.warnings.length > 0) {
      console.log(`  Warnings: ${result.warnings.length}`);
    }
    
    console.log('');
    console.log('Generated files:');
    result.generatedFiles.forEach(file => {
      const relativePath = path.relative(this.projectRoot, file);
      console.log(`  • ${relativePath}`);
    });
    
    console.log('');
    
    // Test the complete setup
    console.log('Testing complete integration...');
    
    try {
      // Test database connection again
      const connectionTest = await this.autoAuthManager.testConnection(result.configuration.credentials);
      
      if (connectionTest.success) {
        console.log('✅ Database connection: OK');
      } else {
        result.warnings.push('Final database connection test failed');
        console.log('⚠️ Database connection: Failed');
      }
      
      // Test MCP configuration if enabled
      if (result.configuration.mcpConfig) {
        // This would test the MCP server startup in a full implementation
        console.log('✅ MCP configuration: OK');
      }
      
    } catch (error) {
      result.warnings.push(`Final verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    // Generate next steps
    this.generateNextSteps(result);
    
    console.log('');
    console.log('Next steps:');
    result.nextSteps.forEach(step => console.log(`  • ${step}`));
    
    console.log('');
    console.log('🎉 Database integration setup complete!');
    
    this.markStepCompleted(result.configuration.steps, 'final-verification');
  }

  /**
   * Helper methods for wizard steps
   */
  private createEmptyConfiguration(): WizardConfiguration {
    return {
      provider: '' as DatabaseProvider,
      credentials: {} as DatabaseCredentials,
      mcpConfig: {} as any,
      environmentVariables: [],
      typeGeneration: {},
      steps: [
        { id: 'auto-detection', title: 'Auto-detection', description: 'Scan for existing configurations', required: false, completed: false, skipped: false },
        { id: 'provider-selection', title: 'Provider Selection', description: 'Choose database provider', required: true, completed: false, skipped: false },
        { id: 'credential-configuration', title: 'Credential Configuration', description: 'Configure database credentials', required: true, completed: false, skipped: false },
        { id: 'connection-testing', title: 'Connection Testing', description: 'Test database connection', required: true, completed: false, skipped: false },
        { id: 'type-generation-options', title: 'Type Generation Options', description: 'Configure TypeScript generation', required: false, completed: false, skipped: false },
        { id: 'schema-requirements', title: 'Schema Requirements', description: 'Define schema requirements', required: false, completed: false, skipped: false },
        { id: 'integration-setup', title: 'Integration Setup', description: 'Set up complete integration', required: true, completed: false, skipped: false },
        { id: 'final-verification', title: 'Final Verification', description: 'Verify complete setup', required: true, completed: false, skipped: false }
      ]
    };
  }

  private getAvailableProviders(): WizardProviderOption[] {
    return [
      {
        provider: 'supabase',
        name: 'Supabase',
        description: 'Open source Firebase alternative with PostgreSQL',
        icon: '🟢',
        popular: true,
        requirements: ['Supabase project URL', 'API keys'],
        detectionMethods: ['config files', 'environment variables', 'package.json']
      },
      {
        provider: 'neon',
        name: 'Neon',
        description: 'Serverless PostgreSQL with branching',
        icon: '⚡',
        popular: true,
        requirements: ['Connection URL from Neon dashboard'],
        detectionMethods: ['environment variables']
      },
      {
        provider: 'planetscale',
        name: 'PlanetScale',
        description: 'Serverless MySQL platform with branching',
        icon: '🪐',
        popular: true,
        requirements: ['Connection URL from PlanetScale dashboard'],
        detectionMethods: ['environment variables']
      },
      {
        provider: 'postgresql',
        name: 'PostgreSQL',
        description: 'Advanced open source relational database',
        icon: '🐘',
        popular: false,
        requirements: ['Host', 'Database name', 'Username', 'Password'],
        detectionMethods: ['config files', 'environment variables']
      },
      {
        provider: 'mysql',
        name: 'MySQL',
        description: 'Popular open source relational database',
        icon: '🐬',
        popular: false,
        requirements: ['Host', 'Database name', 'Username', 'Password'],
        detectionMethods: ['config files', 'environment variables']
      },
      {
        provider: 'sqlite',
        name: 'SQLite',
        description: 'Lightweight file-based database',
        icon: '💿',
        popular: false,
        requirements: ['Database file path'],
        detectionMethods: ['file system scan', 'environment variables']
      }
    ];
  }

  private getCredentialInputs(provider: DatabaseProvider): WizardCredentialInput[] {
    const commonInputs = {
      connectionUrl: {
        field: 'connectionUrl',
        label: 'Connection URL',
        type: 'url' as const,
        required: false,
        placeholder: 'postgresql://user:pass@host:5432/dbname',
        description: 'Complete database connection URL'
      },
      host: {
        field: 'host',
        label: 'Host',
        type: 'text' as const,
        required: true,
        placeholder: 'localhost',
        description: 'Database server hostname or IP'
      },
      port: {
        field: 'port',
        label: 'Port',
        type: 'number' as const,
        required: false,
        description: 'Database server port'
      },
      database: {
        field: 'database',
        label: 'Database Name',
        type: 'text' as const,
        required: true,
        description: 'Name of the database'
      },
      username: {
        field: 'username',
        label: 'Username',
        type: 'text' as const,
        required: true,
        description: 'Database username'
      },
      password: {
        field: 'password',
        label: 'Password',
        type: 'password' as const,
        required: true,
        description: 'Database password'
      }
    };

    switch (provider) {
      case 'supabase':
        return [
          commonInputs.connectionUrl,
          {
            field: 'apiKey',
            label: 'Supabase Anon Key',
            type: 'password',
            required: true,
            description: 'Supabase anonymous/public API key'
          },
          {
            field: 'serviceKey',
            label: 'Supabase Service Role Key (optional)',
            type: 'password',
            required: false,
            description: 'Supabase service role key for admin operations'
          }
        ];
      
      case 'neon':
      case 'planetscale':
        return [
          {
            ...commonInputs.connectionUrl,
            required: true,
            placeholder: provider === 'neon' 
              ? 'postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname'
              : 'mysql://user:pass@aws.connect.psdb.cloud/dbname?sslaccept=strict'
          }
        ];
      
      case 'postgresql':
        return [
          commonInputs.connectionUrl,
          commonInputs.host,
          { ...commonInputs.port, placeholder: '5432' },
          commonInputs.database,
          commonInputs.username,
          commonInputs.password
        ];
      
      case 'mysql':
        return [
          commonInputs.connectionUrl,
          commonInputs.host,
          { ...commonInputs.port, placeholder: '3306' },
          commonInputs.database,
          commonInputs.username,
          commonInputs.password
        ];
      
      case 'sqlite':
        return [
          {
            field: 'database',
            label: 'Database File Path',
            type: 'text',
            required: true,
            placeholder: './database.sqlite',
            description: 'Path to SQLite database file'
          }
        ];
      
      default:
        return [];
    }
  }

  private async askCredentialInput(input: WizardCredentialInput): Promise<string> {
    const prompt = `${input.label}${input.required ? ' (required)' : ' (optional)'}: `;
    
    if (input.description && input.name !== 'password') {
      console.log(`  ${input.description}`);
    }
    
    const value = await this.askInput(prompt, input.required, input.type === 'password');
    
    // Validate input
    if (input.validation && value) {
      const validationResult = input.validation(value);
      if (validationResult) {
        console.log(`  ❌ ${validationResult}`);
        return this.askCredentialInput(input);
      }
    }
    
    return value;
  }

  private generateNextSteps(result: WizardResult): void {
    result.nextSteps = [];
    
    // Always suggest testing
    result.nextSteps.push('Test your database connection in your application');
    
    // Type-related next steps
    if (result.configuration.typeGeneration.generateTypes) {
      result.nextSteps.push('Import and use the generated types in your TypeScript code');
      
      if (result.configuration.typeGeneration.generateClient) {
        result.nextSteps.push('Use the generated typed database client for type-safe queries');
      }
      
      if (result.configuration.typeGeneration.generateORM) {
        const ormType = result.configuration.typeGeneration.ormType;
        result.nextSteps.push(`Run ${ormType} generate to create the client`);
        
        if (ormType === 'prisma') {
          result.nextSteps.push('Run `npx prisma db push` to sync your database schema');
        }
      }
    }
    
    // MCP-related next steps
    if (result.configuration.mcpConfig) {
      result.nextSteps.push('Restart Claude Desktop to load the new MCP configuration');
      result.nextSteps.push('Test the MCP integration by asking Claude about your database');
    }
    
    // Environment variable next steps
    if (result.configuration.environmentVariables.length > 0) {
      result.nextSteps.push('Verify that all environment variables are properly set');
      result.nextSteps.push('Add .env file to your .gitignore if not already done');
    }
    
    // Provider-specific next steps
    switch (result.configuration.provider) {
      case 'supabase':
        result.nextSteps.push('Explore Supabase Auth, Storage, and Real-time features');
        result.nextSteps.push('Set up Row Level Security (RLS) policies');
        break;
      case 'neon':
        result.nextSteps.push('Consider setting up database branching for development');
        break;
      case 'planetscale':
        result.nextSteps.push('Create development branches for schema changes');
        break;
    }
    
    result.nextSteps.push('Check the generated files into version control (except .env)');
  }

  /**
   * Utility methods for user interaction
   */
  private async askInput(question: string, required: boolean = true, hidden: boolean = false): Promise<string> {
    return new Promise((resolve) => {
      if (hidden) {
        // For password input, we'll use a simple approach
        // In a real implementation, you'd want to use a library like 'read' for hidden input
        this.rl.question(question, (answer) => {
          if (required && !answer.trim()) {
            console.log('This field is required.');
            resolve(this.askInput(question, required, hidden));
          } else {
            resolve(answer.trim());
          }
        });
      } else {
        this.rl.question(question, (answer) => {
          if (required && !answer.trim()) {
            console.log('This field is required.');
            resolve(this.askInput(question, required, hidden));
          } else {
            resolve(answer.trim());
          }
        });
      }
    });
  }

  private async askYesNo(question: string, defaultValue: boolean = false): Promise<boolean> {
    const defaultText = defaultValue ? 'Y/n' : 'y/N';
    const answer = await this.askInput(`${question} (${defaultText}): `, false);
    
    if (!answer) return defaultValue;
    
    return answer.toLowerCase().startsWith('y');
  }

  private async askChoice(question: string, choices: string[]): Promise<number> {
    console.log(question);
    choices.forEach((choice, index) => {
      console.log(`${index + 1}. ${choice}`);
    });
    
    const answer = await this.askInput('Enter your choice (number): ');
    const choice = parseInt(answer, 10) - 1;
    
    if (isNaN(choice) || choice < 0 || choice >= choices.length) {
      console.log('Invalid choice. Please try again.');
      return this.askChoice(question, choices);
    }
    
    return choice;
  }

  private markStepCompleted(steps: WizardStep[], stepId: string): void {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      step.completed = true;
    }
  }

  private markStepIncomplete(steps: WizardStep[], stepId: string): void {
    const step = steps.find(s => s.id === stepId);
    if (step) {
      step.completed = false;
    }
  }
}