import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface PermissionConfig {
    bypassEnabled: boolean;
    safetyMode: 'strict' | 'moderate' | 'permissive';
    autoResponse: boolean;
    restrictedCommands: string[];
    allowedFileExtensions: string[];
    dangerousOperationsAllowed: boolean;
}

export interface WorkspaceConfig {
    sandboxEnabled: boolean;
    allowedPaths: string[];
    restrictedPaths: string[];
    maxFileSize: number; // MB
    autoBackup: boolean;
    preserveGitIgnore: boolean;
}

export interface MonitoringConfig {
    terminalEnabled: boolean;
    verbosityLevel: 'quiet' | 'normal' | 'verbose' | 'debug';
    logRetentionDays: number;
    performanceTracking: boolean;
    realTimeUpdates: boolean;
    errorReporting: boolean;
}

export interface TokenOptimizationConfig {
    enabled: boolean;
    maxTokensPerAgent: number;
    contextWindowSize: number;
    cacheEnabled: boolean;
    compressionLevel: 'none' | 'low' | 'medium' | 'high';
}

export interface CustomCommandConfig {
    enabledCommands: string[];
    disabledCommands: string[];
    customCommandPaths: string[];
    requireConfirmation: string[];
}

export interface ConfigurationSchema {
    version: string;
    permissions: PermissionConfig;
    workspace: WorkspaceConfig;
    monitoring: MonitoringConfig;
    tokenOptimization: TokenOptimizationConfig;
    customCommands: CustomCommandConfig;
    updatedAt: string;
}

export class AgentwiseConfiguration {
    private static instance: AgentwiseConfiguration;
    private readonly LOCAL_CONFIG_PATH = '.agentwise-config.json';
    private readonly GLOBAL_CONFIG_DIR = path.join(os.homedir(), '.agentwise');
    private readonly GLOBAL_CONFIG_PATH = path.join(this.GLOBAL_CONFIG_DIR, 'config.json');
    private config: ConfigurationSchema;

    private defaultConfig: ConfigurationSchema = {
        version: '1.0.0',
        permissions: {
            bypassEnabled: false,
            safetyMode: 'moderate',
            autoResponse: false,
            restrictedCommands: ['rm', 'rmdir', 'del', 'format', 'fdisk'],
            allowedFileExtensions: ['.ts', '.js', '.json', '.md', '.txt', '.yml', '.yaml', '.css', '.html'],
            dangerousOperationsAllowed: false
        },
        workspace: {
            sandboxEnabled: true,
            allowedPaths: ['./workspace', './src', './.claude'],
            restrictedPaths: ['/system', '/usr', '/etc', '/bin', '/sbin'],
            maxFileSize: 10,
            autoBackup: true,
            preserveGitIgnore: true
        },
        monitoring: {
            terminalEnabled: true,
            verbosityLevel: 'normal',
            logRetentionDays: 30,
            performanceTracking: true,
            realTimeUpdates: true,
            errorReporting: true
        },
        tokenOptimization: {
            enabled: true,
            maxTokensPerAgent: 8000,
            contextWindowSize: 32000,
            cacheEnabled: true,
            compressionLevel: 'medium'
        },
        customCommands: {
            enabledCommands: ['create', 'task', 'projects', 'monitor', 'setup-mcps'],
            disabledCommands: [],
            customCommandPaths: ['./.claude/commands'],
            requireConfirmation: ['reset', 'delete-project', 'import']
        },
        updatedAt: new Date().toISOString()
    };

    constructor() {
        this.config = this.defaultConfig;
    }

    async load(): Promise<ConfigurationSchema> {
        // Try to load local config first, then global, then defaults
        let config = this.defaultConfig;

        try {
            // Load global config
            if (await this.fileExists(this.GLOBAL_CONFIG_PATH)) {
                const globalConfigData = await fs.readFile(this.GLOBAL_CONFIG_PATH, 'utf-8');
                const globalConfig = JSON.parse(globalConfigData);
                config = this.mergeConfigs(config, globalConfig);
            }

            // Load local config (overrides global)
            if (await this.fileExists(this.LOCAL_CONFIG_PATH)) {
                const localConfigData = await fs.readFile(this.LOCAL_CONFIG_PATH, 'utf-8');
                const localConfig = JSON.parse(localConfigData);
                config = this.mergeConfigs(config, localConfig);
            }

            // Apply environment variable overrides
            config = this.applyEnvironmentOverrides(config);

        } catch (error) {
            console.warn('⚠️  Failed to load configuration, using defaults:', error);
            config = this.defaultConfig;
        }

        // Store the loaded config in the instance
        this.config = config;
        return config;
    }

    async save(config: ConfigurationSchema, global: boolean = false): Promise<void> {
        config.updatedAt = new Date().toISOString();
        
        const targetPath = global ? this.GLOBAL_CONFIG_PATH : this.LOCAL_CONFIG_PATH;
        
        if (global) {
            await fs.mkdir(this.GLOBAL_CONFIG_DIR, { recursive: true });
        }

        await fs.writeFile(targetPath, JSON.stringify(config, null, 2), 'utf-8');
    }

    async reset(): Promise<void> {
        // Reset both local and global configs
        try {
            if (await this.fileExists(this.LOCAL_CONFIG_PATH)) {
                await fs.unlink(this.LOCAL_CONFIG_PATH);
            }
            if (await this.fileExists(this.GLOBAL_CONFIG_PATH)) {
                await fs.unlink(this.GLOBAL_CONFIG_PATH);
            }
        } catch (error) {
            throw new Error(`Failed to reset configuration: ${error}`);
        }
    }

    async export(): Promise<string> {
        const config = await this.load();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const exportPath = `agentwise-config-${timestamp}.json`;
        
        await fs.writeFile(exportPath, JSON.stringify(config, null, 2), 'utf-8');
        return path.resolve(exportPath);
    }

    async import(filePath: string): Promise<ConfigurationSchema> {
        const configData = await fs.readFile(filePath, 'utf-8');
        const importedConfig = JSON.parse(configData);
        
        // Validate the imported config has the correct structure
        if (!this.isValidConfigStructure(importedConfig)) {
            throw new Error('Invalid configuration file structure');
        }

        return this.mergeConfigs(this.defaultConfig, importedConfig);
    }

    private mergeConfigs(base: ConfigurationSchema, override: Partial<ConfigurationSchema>): ConfigurationSchema {
        return {
            ...base,
            ...override,
            permissions: { ...base.permissions, ...override.permissions },
            workspace: { ...base.workspace, ...override.workspace },
            monitoring: { ...base.monitoring, ...override.monitoring },
            tokenOptimization: { ...base.tokenOptimization, ...override.tokenOptimization },
            customCommands: { ...base.customCommands, ...override.customCommands }
        };
    }

    private applyEnvironmentOverrides(config: ConfigurationSchema): ConfigurationSchema {
        const envOverrides: Partial<ConfigurationSchema> = {};

        // Permission overrides
        if (process.env.AGENTWISE_BYPASS_ENABLED) {
            envOverrides.permissions = {
                ...config.permissions,
                bypassEnabled: process.env.AGENTWISE_BYPASS_ENABLED === 'true'
            };
        }

        if (process.env.AGENTWISE_SAFETY_MODE) {
            envOverrides.permissions = {
                ...envOverrides.permissions,
                ...config.permissions,
                safetyMode: process.env.AGENTWISE_SAFETY_MODE as any
            };
        }

        // Workspace overrides
        if (process.env.AGENTWISE_SANDBOX_ENABLED) {
            envOverrides.workspace = {
                ...config.workspace,
                sandboxEnabled: process.env.AGENTWISE_SANDBOX_ENABLED === 'true'
            };
        }

        if (process.env.AGENTWISE_MAX_FILE_SIZE) {
            envOverrides.workspace = {
                ...envOverrides.workspace,
                ...config.workspace,
                maxFileSize: parseInt(process.env.AGENTWISE_MAX_FILE_SIZE, 10)
            };
        }

        // Monitoring overrides
        if (process.env.AGENTWISE_MONITORING_ENABLED) {
            envOverrides.monitoring = {
                ...config.monitoring,
                terminalEnabled: process.env.AGENTWISE_MONITORING_ENABLED === 'true'
            };
        }

        if (process.env.AGENTWISE_VERBOSITY) {
            envOverrides.monitoring = {
                ...envOverrides.monitoring,
                ...config.monitoring,
                verbosityLevel: process.env.AGENTWISE_VERBOSITY as any
            };
        }

        // Token optimization overrides
        if (process.env.AGENTWISE_TOKEN_OPTIMIZATION) {
            envOverrides.tokenOptimization = {
                ...config.tokenOptimization,
                enabled: process.env.AGENTWISE_TOKEN_OPTIMIZATION === 'true'
            };
        }

        return this.mergeConfigs(config, envOverrides);
    }

    private async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    private isValidConfigStructure(config: any): config is ConfigurationSchema {
        return (
            typeof config === 'object' &&
            config !== null &&
            typeof config.version === 'string' &&
            typeof config.permissions === 'object' &&
            typeof config.workspace === 'object' &&
            typeof config.monitoring === 'object' &&
            typeof config.tokenOptimization === 'object' &&
            typeof config.customCommands === 'object'
        );
    }

    getDefaultConfig(): ConfigurationSchema {
        return { ...this.defaultConfig };
    }

    getAll(): ConfigurationSchema {
        return { ...this.config || this.defaultConfig };
    }

    static getInstance(): AgentwiseConfiguration {
        if (!AgentwiseConfiguration.instance) {
            AgentwiseConfiguration.instance = new AgentwiseConfiguration();
        }
        return AgentwiseConfiguration.instance;
    }
}