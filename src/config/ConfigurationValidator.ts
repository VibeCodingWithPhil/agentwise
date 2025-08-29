import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { ConfigurationSchema } from './AgentwiseConfiguration.js';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export class ConfigurationValidator {
    async validate(config: ConfigurationSchema): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Version validation
        if (!this.isValidVersion(config.version)) {
            errors.push('Invalid version format');
        }

        // Permission validation
        const permissionValidation = await this.validatePermissions(config.permissions);
        errors.push(...permissionValidation.errors);
        warnings.push(...permissionValidation.warnings);

        // Workspace validation
        const workspaceValidation = await this.validateWorkspace(config.workspace);
        errors.push(...workspaceValidation.errors);
        warnings.push(...workspaceValidation.warnings);

        // Monitoring validation
        const monitoringValidation = this.validateMonitoring(config.monitoring);
        errors.push(...monitoringValidation.errors);
        warnings.push(...monitoringValidation.warnings);

        // Token optimization validation
        const tokenValidation = this.validateTokenOptimization(config.tokenOptimization);
        errors.push(...tokenValidation.errors);
        warnings.push(...tokenValidation.warnings);

        // Custom commands validation
        const commandValidation = await this.validateCustomCommands(config.customCommands);
        errors.push(...commandValidation.errors);
        warnings.push(...commandValidation.warnings);

        // Cross-validation (check for conflicting settings)
        const crossValidation = this.validateCrossSettings(config);
        errors.push(...crossValidation.errors);
        warnings.push(...crossValidation.warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    private async validatePermissions(permissions: any): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check required fields
        if (typeof permissions.bypassEnabled !== 'boolean') {
            errors.push('Permission bypassEnabled must be a boolean');
        }

        if (!['strict', 'moderate', 'permissive'].includes(permissions.safetyMode)) {
            errors.push('Permission safetyMode must be "strict", "moderate", or "permissive"');
        }

        if (typeof permissions.autoResponse !== 'boolean') {
            errors.push('Permission autoResponse must be a boolean');
        }

        if (typeof permissions.dangerousOperationsAllowed !== 'boolean') {
            errors.push('Permission dangerousOperationsAllowed must be a boolean');
        }

        // Validate arrays
        if (!Array.isArray(permissions.restrictedCommands)) {
            errors.push('Permission restrictedCommands must be an array');
        } else if (permissions.restrictedCommands.some((cmd: any) => typeof cmd !== 'string')) {
            errors.push('All restricted commands must be strings');
        }

        if (!Array.isArray(permissions.allowedFileExtensions)) {
            errors.push('Permission allowedFileExtensions must be an array');
        } else {
            // Validate file extensions format
            const invalidExtensions = permissions.allowedFileExtensions.filter((ext: string) => !ext.startsWith('.'));
            if (invalidExtensions.length > 0) {
                warnings.push(`File extensions should start with a dot: ${invalidExtensions.join(', ')}`);
            }
        }

        // Security warnings
        if (permissions.bypassEnabled && permissions.safetyMode === 'permissive') {
            warnings.push('Bypass enabled with permissive mode creates significant security risks');
        }

        if (permissions.dangerousOperationsAllowed && permissions.autoResponse) {
            warnings.push('Dangerous operations with auto-response enabled is highly risky');
        }

        if (permissions.restrictedCommands.length === 0) {
            warnings.push('No restricted commands configured - consider adding common dangerous commands');
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    private async validateWorkspace(workspace: any): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check required fields
        if (typeof workspace.sandboxEnabled !== 'boolean') {
            errors.push('Workspace sandboxEnabled must be a boolean');
        }

        if (typeof workspace.maxFileSize !== 'number' || workspace.maxFileSize <= 0) {
            errors.push('Workspace maxFileSize must be a positive number');
        } else if (workspace.maxFileSize > 1000) {
            warnings.push('Max file size is very large (>1GB) - consider reducing for performance');
        }

        if (typeof workspace.autoBackup !== 'boolean') {
            errors.push('Workspace autoBackup must be a boolean');
        }

        if (typeof workspace.preserveGitIgnore !== 'boolean') {
            errors.push('Workspace preserveGitIgnore must be a boolean');
        }

        // Validate path arrays
        if (!Array.isArray(workspace.allowedPaths)) {
            errors.push('Workspace allowedPaths must be an array');
        } else {
            // Check if allowed paths exist
            for (const allowedPath of workspace.allowedPaths) {
                if (typeof allowedPath !== 'string') {
                    errors.push('All allowed paths must be strings');
                    continue;
                }

                try {
                    const resolvedPath = path.resolve(allowedPath);
                    await fs.access(resolvedPath);
                } catch {
                    warnings.push(`Allowed path does not exist: ${allowedPath}`);
                }
            }
        }

        if (!Array.isArray(workspace.restrictedPaths)) {
            errors.push('Workspace restrictedPaths must be an array');
        } else if (workspace.restrictedPaths.some((path: any) => typeof path !== 'string')) {
            errors.push('All restricted paths must be strings');
        }

        // Security checks
        if (workspace.allowedPaths.includes('/') || workspace.allowedPaths.includes('/*')) {
            warnings.push('Allowing root directory access poses security risks');
        }

        const systemPaths = ['/system', '/usr', '/etc', '/bin', '/sbin', '/root'];
        const allowedSystemPaths = workspace.allowedPaths.filter((path: string) => 
            systemPaths.some(sysPath => path.startsWith(sysPath))
        );
        
        if (allowedSystemPaths.length > 0) {
            warnings.push(`Allowing system paths is dangerous: ${allowedSystemPaths.join(', ')}`);
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    private validateMonitoring(monitoring: any): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check required fields
        if (typeof monitoring.terminalEnabled !== 'boolean') {
            errors.push('Monitoring terminalEnabled must be a boolean');
        }

        if (!['quiet', 'normal', 'verbose', 'debug'].includes(monitoring.verbosityLevel)) {
            errors.push('Monitoring verbosityLevel must be "quiet", "normal", "verbose", or "debug"');
        }

        if (typeof monitoring.logRetentionDays !== 'number' || monitoring.logRetentionDays < 1) {
            errors.push('Monitoring logRetentionDays must be a positive number');
        } else if (monitoring.logRetentionDays > 365) {
            warnings.push('Log retention period is very long (>1 year) - consider reducing for storage efficiency');
        }

        if (typeof monitoring.performanceTracking !== 'boolean') {
            errors.push('Monitoring performanceTracking must be a boolean');
        }

        if (typeof monitoring.realTimeUpdates !== 'boolean') {
            errors.push('Monitoring realTimeUpdates must be a boolean');
        }

        if (typeof monitoring.errorReporting !== 'boolean') {
            errors.push('Monitoring errorReporting must be a boolean');
        }

        // Performance warnings
        if (monitoring.verbosityLevel === 'debug' && monitoring.realTimeUpdates) {
            warnings.push('Debug verbosity with real-time updates may impact performance');
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    private validateTokenOptimization(tokenOptimization: any): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check required fields
        if (typeof tokenOptimization.enabled !== 'boolean') {
            errors.push('TokenOptimization enabled must be a boolean');
        }

        if (typeof tokenOptimization.maxTokensPerAgent !== 'number' || tokenOptimization.maxTokensPerAgent < 1000) {
            errors.push('TokenOptimization maxTokensPerAgent must be at least 1000');
        } else if (tokenOptimization.maxTokensPerAgent > 32000) {
            warnings.push('Max tokens per agent is very high - may impact response quality');
        }

        if (typeof tokenOptimization.contextWindowSize !== 'number' || tokenOptimization.contextWindowSize < 1000) {
            errors.push('TokenOptimization contextWindowSize must be at least 1000');
        } else if (tokenOptimization.contextWindowSize > 200000) {
            warnings.push('Context window size is very large - may impact performance');
        }

        if (typeof tokenOptimization.cacheEnabled !== 'boolean') {
            errors.push('TokenOptimization cacheEnabled must be a boolean');
        }

        if (!['none', 'low', 'medium', 'high'].includes(tokenOptimization.compressionLevel)) {
            errors.push('TokenOptimization compressionLevel must be "none", "low", "medium", or "high"');
        }

        // Logical validation
        if (tokenOptimization.maxTokensPerAgent > tokenOptimization.contextWindowSize) {
            errors.push('Max tokens per agent cannot exceed context window size');
        }

        if (!tokenOptimization.enabled && tokenOptimization.compressionLevel !== 'none') {
            warnings.push('Token optimization is disabled but compression is enabled');
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    private async validateCustomCommands(customCommands: any): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check required fields
        if (!Array.isArray(customCommands.enabledCommands)) {
            errors.push('CustomCommands enabledCommands must be an array');
        } else if (customCommands.enabledCommands.some((cmd: any) => typeof cmd !== 'string')) {
            errors.push('All enabled commands must be strings');
        }

        if (!Array.isArray(customCommands.disabledCommands)) {
            errors.push('CustomCommands disabledCommands must be an array');
        } else if (customCommands.disabledCommands.some((cmd: any) => typeof cmd !== 'string')) {
            errors.push('All disabled commands must be strings');
        }

        if (!Array.isArray(customCommands.customCommandPaths)) {
            errors.push('CustomCommands customCommandPaths must be an array');
        } else {
            // Check if custom command paths exist
            for (const commandPath of customCommands.customCommandPaths) {
                if (typeof commandPath !== 'string') {
                    errors.push('All custom command paths must be strings');
                    continue;
                }

                try {
                    const resolvedPath = path.resolve(commandPath);
                    await fs.access(resolvedPath);
                } catch {
                    warnings.push(`Custom command path does not exist: ${commandPath}`);
                }
            }
        }

        if (!Array.isArray(customCommands.requireConfirmation)) {
            errors.push('CustomCommands requireConfirmation must be an array');
        } else if (customCommands.requireConfirmation.some((cmd: any) => typeof cmd !== 'string')) {
            errors.push('All commands requiring confirmation must be strings');
        }

        // Logical validation
        const enabledSet = new Set(customCommands.enabledCommands);
        const disabledSet = new Set(customCommands.disabledCommands);
        const conflicts = customCommands.enabledCommands.filter((cmd: string) => disabledSet.has(cmd));
        
        if (conflicts.length > 0) {
            errors.push(`Commands cannot be both enabled and disabled: ${conflicts.join(', ')}`);
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    private validateCrossSettings(config: ConfigurationSchema): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check for security combinations
        if (config.permissions.bypassEnabled && 
            !config.workspace.sandboxEnabled && 
            config.permissions.dangerousOperationsAllowed) {
            warnings.push('Extremely dangerous configuration: bypass enabled, no sandbox, dangerous ops allowed');
        }

        // Check for performance combinations
        if (config.monitoring.verbosityLevel === 'debug' && 
            config.monitoring.realTimeUpdates && 
            config.tokenOptimization.enabled) {
            warnings.push('Debug monitoring with real-time updates may conflict with token optimization');
        }

        // Check for logical inconsistencies
        if (!config.tokenOptimization.enabled && config.tokenOptimization.cacheEnabled) {
            warnings.push('Token optimization disabled but caching enabled');
        }

        if (config.workspace.maxFileSize > 100 && config.tokenOptimization.enabled) {
            warnings.push('Large file sizes may impact token optimization effectiveness');
        }

        // Check for missing essential commands
        const essentialCommands = ['create', 'task', 'projects'];
        const missingEssential = essentialCommands.filter(cmd => 
            !config.customCommands.enabledCommands.includes(cmd)
        );
        
        if (missingEssential.length > 0) {
            warnings.push(`Essential commands not enabled: ${missingEssential.join(', ')}`);
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    private isValidVersion(version: string): boolean {
        return /^\d+\.\d+\.\d+$/.test(version);
    }

    async validateEnvironment(): Promise<ValidationResult> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0], 10);
        
        if (majorVersion < 16) {
            errors.push(`Node.js version ${nodeVersion} is not supported. Please use Node.js 16 or later.`);
        } else if (majorVersion < 18) {
            warnings.push(`Node.js version ${nodeVersion} is supported but Node.js 18+ is recommended.`);
        }

        // Check available memory
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

        if (memoryUsagePercent > 90) {
            warnings.push('System memory usage is very high (>90%) - may impact performance');
        }

        // Check disk space
        try {
            const stats = await fs.stat(process.cwd());
            // Note: Getting actual disk space would require additional libraries
            // This is a placeholder for disk space validation
        } catch (error) {
            warnings.push('Unable to check disk space availability');
        }

        return { isValid: errors.length === 0, errors, warnings };
    }
}