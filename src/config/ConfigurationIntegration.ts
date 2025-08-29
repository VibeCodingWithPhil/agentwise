import { AgentwiseConfiguration } from './AgentwiseConfiguration.js';

/**
 * Integration helper that applies configuration settings to various Agentwise systems
 */
export class ConfigurationIntegration {
    private config: AgentwiseConfiguration;

    constructor() {
        this.config = new AgentwiseConfiguration();
    }

    /**
     * Apply configuration to Token Optimizer
     */
    async applyToTokenOptimizer(): Promise<any> {
        const settings = await this.config.load();
        
        if (!settings.tokenOptimization.enabled) {
            return null;
        }

        // Configuration settings that would be applied to TokenOptimizer
        const tokenOptimizerConfig = {
            enabled: settings.tokenOptimization.enabled,
            maxTokensPerAgent: settings.tokenOptimization.maxTokensPerAgent,
            contextWindowSize: settings.tokenOptimization.contextWindowSize,
            cacheEnabled: settings.tokenOptimization.cacheEnabled,
            compressionLevel: settings.tokenOptimization.compressionLevel
        };

        console.log('🚀 Token Optimizer configured:', tokenOptimizerConfig);
        return tokenOptimizerConfig;
    }

    /**
     * Apply configuration to Permission Bypass System
     */
    async applyToPermissionSystem(): Promise<any> {
        const settings = await this.config.load();
        
        const permissionConfig = {
            bypassEnabled: settings.permissions.bypassEnabled,
            safetyMode: settings.permissions.safetyMode,
            autoResponse: settings.permissions.autoResponse,
            restrictedCommands: settings.permissions.restrictedCommands,
            allowedFileExtensions: settings.permissions.allowedFileExtensions,
            dangerousOperationsAllowed: settings.permissions.dangerousOperationsAllowed
        };

        console.log('🔒 Permission System configured:', permissionConfig);
        return permissionConfig;
    }

    /**
     * Apply configuration to Terminal Monitor
     */
    async applyToTerminalMonitor(): Promise<any> {
        const settings = await this.config.load();
        
        if (!settings.monitoring.terminalEnabled) {
            return null;
        }

        const monitorConfig = {
            enabled: settings.monitoring.terminalEnabled,
            verbosityLevel: settings.monitoring.verbosityLevel,
            logRetentionDays: settings.monitoring.logRetentionDays,
            performanceTracking: settings.monitoring.performanceTracking,
            realTimeUpdates: settings.monitoring.realTimeUpdates,
            errorReporting: settings.monitoring.errorReporting
        };

        console.log('📊 Terminal Monitor configured:', monitorConfig);
        return monitorConfig;
    }

    /**
     * Apply configuration to Workspace Security
     */
    async applyToWorkspaceSecurity(): Promise<any> {
        const settings = await this.config.load();
        
        const workspaceConfig = {
            sandboxEnabled: settings.workspace.sandboxEnabled,
            allowedPaths: settings.workspace.allowedPaths,
            restrictedPaths: settings.workspace.restrictedPaths,
            maxFileSize: settings.workspace.maxFileSize,
            autoBackup: settings.workspace.autoBackup,
            preserveGitIgnore: settings.workspace.preserveGitIgnore
        };

        console.log('📁 Workspace Security configured:', workspaceConfig);
        return workspaceConfig;
    }

    /**
     * Apply configuration to Custom Commands
     */
    async applyToCustomCommands(): Promise<any> {
        const settings = await this.config.load();
        
        const commandConfig = {
            enabledCommands: settings.customCommands.enabledCommands,
            disabledCommands: settings.customCommands.disabledCommands,
            customCommandPaths: settings.customCommands.customCommandPaths,
            requireConfirmation: settings.customCommands.requireConfirmation
        };

        console.log('⚡ Custom Commands configured:', commandConfig);
        return commandConfig;
    }

    /**
     * Apply all configurations to their respective systems
     */
    async applyAllConfigurations(): Promise<{
        tokenOptimizer?: any;
        permissionSystem?: any;
        terminalMonitor?: any;
        workspaceSecurity?: any;
        customCommands?: any;
    }> {
        console.log('🔧 Applying Agentwise configuration to all systems...\n');

        const results = {
            tokenOptimizer: await this.applyToTokenOptimizer(),
            permissionSystem: await this.applyToPermissionSystem(),
            terminalMonitor: await this.applyToTerminalMonitor(),
            workspaceSecurity: await this.applyToWorkspaceSecurity(),
            customCommands: await this.applyToCustomCommands()
        };

        console.log('\n✅ All configurations applied successfully!');
        return results;
    }

    /**
     * Get current configuration summary
     */
    async getConfigurationSummary(): Promise<string> {
        const settings = await this.config.load();
        
        return `
🔧 Agentwise Configuration Summary:
   Version: ${settings.version}
   Permission Bypass: ${settings.permissions.bypassEnabled ? '✅ Enabled' : '❌ Disabled'}
   Safety Mode: ${settings.permissions.safetyMode}
   Workspace Sandbox: ${settings.workspace.sandboxEnabled ? '✅ Enabled' : '❌ Disabled'}
   Terminal Monitoring: ${settings.monitoring.terminalEnabled ? '✅ Enabled' : '❌ Disabled'}
   Token Optimization: ${settings.tokenOptimization.enabled ? '✅ Enabled' : '❌ Disabled'}
   Updated: ${new Date(settings.updatedAt).toLocaleString()}
        `;
    }

    /**
     * Check for dangerous configuration combinations
     */
    async checkSecurityWarnings(): Promise<string[]> {
        const settings = await this.config.load();
        const warnings: string[] = [];

        if (settings.permissions.bypassEnabled && !settings.workspace.sandboxEnabled) {
            warnings.push('⚠️  Permission bypass enabled without workspace sandbox - HIGH SECURITY RISK');
        }

        if (settings.permissions.dangerousOperationsAllowed && settings.permissions.autoResponse) {
            warnings.push('⚠️  Dangerous operations with auto-response - CRITICAL SECURITY RISK');
        }

        if (settings.permissions.safetyMode === 'permissive' && settings.permissions.bypassEnabled) {
            warnings.push('⚠️  Permissive mode with bypass enabled - MODERATE SECURITY RISK');
        }

        if (settings.workspace.allowedPaths.includes('/') || settings.workspace.allowedPaths.includes('/*')) {
            warnings.push('⚠️  Root directory access allowed - HIGH SECURITY RISK');
        }

        return warnings;
    }

    /**
     * Initialize configuration on system startup
     */
    async initializeOnStartup(): Promise<void> {
        console.log('🚀 Initializing Agentwise configuration system...');
        
        try {
            // Apply all configurations
            await this.applyAllConfigurations();
            
            // Show configuration summary
            const summary = await this.getConfigurationSummary();
            console.log(summary);
            
            // Check for security warnings
            const warnings = await this.checkSecurityWarnings();
            if (warnings.length > 0) {
                console.log('\n🚨 Security Warnings:');
                warnings.forEach(warning => console.log(`   ${warning}`));
            }
            
        } catch (error) {
            console.error('❌ Failed to initialize configuration:', error);
        }
    }
}

// Export singleton instance for global use
export const configurationIntegration = new ConfigurationIntegration();