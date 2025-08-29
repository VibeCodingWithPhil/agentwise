import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { AgentwiseConfiguration, ConfigurationSchema } from '../config/AgentwiseConfiguration.js';
import { ConfigurationWizard } from '../config/ConfigurationWizard.js';
import { ConfigurationValidator } from '../config/ConfigurationValidator.js';

export class ConfigureAgentwiseCommand {
    private config: AgentwiseConfiguration;
    private wizard: ConfigurationWizard;
    private validator: ConfigurationValidator;

    constructor() {
        this.config = new AgentwiseConfiguration();
        this.wizard = new ConfigurationWizard();
        this.validator = new ConfigurationValidator();
    }

    async execute(args: string[]): Promise<void> {
        console.log('🔧 Agentwise Configuration Manager\n');

        if (args.length === 0) {
            await this.launchWizard();
            return;
        }

        const command = args[0];
        const subArgs = args.slice(1);

        switch (command) {
            case 'permissions':
                await this.configurePermissions();
                break;
            case 'workspace':
                await this.configureWorkspace();
                break;
            case 'monitoring':
                await this.configureMonitoring();
                break;
            case 'reset':
                await this.resetConfiguration();
                break;
            case 'export':
                await this.exportConfiguration();
                break;
            case 'import':
                if (subArgs.length > 0) {
                    await this.importConfiguration(subArgs[0]);
                } else {
                    console.log('❌ Please specify a file to import');
                }
                break;
            case 'show':
                await this.showConfiguration();
                break;
            case 'validate':
                await this.validateConfiguration();
                break;
            default:
                this.showHelp();
        }
    }

    private async launchWizard(): Promise<void> {
        console.log('🧙‍♂️ Launching interactive configuration wizard...\n');
        
        try {
            const newConfig = await this.wizard.run();
            const validation = await this.validator.validate(newConfig);

            if (!validation.isValid) {
                console.log('\n❌ Configuration validation failed:');
                validation.errors.forEach(error => console.log(`   • ${error}`));
                return;
            }

            await this.config.save(newConfig);
            console.log('\n✅ Configuration saved successfully!');
            
            if (newConfig.permissions.bypassEnabled) {
                console.log('\n⚠️  Permission bypass is enabled. Please review security implications.');
            }

        } catch (error) {
            console.error('❌ Configuration wizard failed:', error);
        }
    }

    private async configurePermissions(): Promise<void> {
        console.log('🔒 Permission System Configuration\n');
        
        const currentConfig = await this.config.load();
        
        console.log('Current permission settings:');
        console.log(`   • Bypass enabled: ${currentConfig.permissions.bypassEnabled ? '✅' : '❌'}`);
        console.log(`   • Safety mode: ${currentConfig.permissions.safetyMode}`);
        console.log(`   • Auto-response: ${currentConfig.permissions.autoResponse ? '✅' : '❌'}`);
        console.log(`   • Restricted commands: ${currentConfig.permissions.restrictedCommands.join(', ') || 'None'}\n`);

        const newPermissionConfig = await this.wizard.runPermissionWizard(currentConfig.permissions);
        
        const updatedConfig = {
            ...currentConfig,
            permissions: newPermissionConfig
        };

        const validation = await this.validator.validate(updatedConfig);
        if (!validation.isValid) {
            console.log('\n❌ Permission configuration validation failed:');
            validation.errors.forEach(error => console.log(`   • ${error}`));
            return;
        }

        await this.config.save(updatedConfig);
        console.log('\n✅ Permission configuration updated successfully!');
    }

    private async configureWorkspace(): Promise<void> {
        console.log('📁 Workspace Configuration\n');
        
        const currentConfig = await this.config.load();
        
        console.log('Current workspace settings:');
        console.log(`   • Sandbox enabled: ${currentConfig.workspace.sandboxEnabled ? '✅' : '❌'}`);
        console.log(`   • Allowed paths: ${currentConfig.workspace.allowedPaths.join(', ')}`);
        console.log(`   • Restricted paths: ${currentConfig.workspace.restrictedPaths.join(', ') || 'None'}`);
        console.log(`   • Max file size: ${currentConfig.workspace.maxFileSize}MB\n`);

        const newWorkspaceConfig = await this.wizard.runWorkspaceWizard(currentConfig.workspace);
        
        const updatedConfig = {
            ...currentConfig,
            workspace: newWorkspaceConfig
        };

        const validation = await this.validator.validate(updatedConfig);
        if (!validation.isValid) {
            console.log('\n❌ Workspace configuration validation failed:');
            validation.errors.forEach(error => console.log(`   • ${error}`));
            return;
        }

        await this.config.save(updatedConfig);
        console.log('\n✅ Workspace configuration updated successfully!');
    }

    private async configureMonitoring(): Promise<void> {
        console.log('📊 Monitoring Configuration\n');
        
        const currentConfig = await this.config.load();
        
        console.log('Current monitoring settings:');
        console.log(`   • Terminal monitoring: ${currentConfig.monitoring.terminalEnabled ? '✅' : '❌'}`);
        console.log(`   • Verbosity level: ${currentConfig.monitoring.verbosityLevel}`);
        console.log(`   • Log retention: ${currentConfig.monitoring.logRetentionDays} days`);
        console.log(`   • Performance tracking: ${currentConfig.monitoring.performanceTracking ? '✅' : '❌'}\n`);

        const newMonitoringConfig = await this.wizard.runMonitoringWizard(currentConfig.monitoring);
        
        const updatedConfig = {
            ...currentConfig,
            monitoring: newMonitoringConfig
        };

        const validation = await this.validator.validate(updatedConfig);
        if (!validation.isValid) {
            console.log('\n❌ Monitoring configuration validation failed:');
            validation.errors.forEach(error => console.log(`   • ${error}`));
            return;
        }

        await this.config.save(updatedConfig);
        console.log('\n✅ Monitoring configuration updated successfully!');
    }

    private async resetConfiguration(): Promise<void> {
        console.log('🔄 Resetting Agentwise Configuration\n');
        
        const confirm = await this.wizard.confirm(
            'Are you sure you want to reset all configuration to defaults? This cannot be undone.'
        );

        if (!confirm) {
            console.log('Reset cancelled.');
            return;
        }

        try {
            await this.config.reset();
            console.log('✅ Configuration reset to defaults successfully!');
        } catch (error) {
            console.error('❌ Failed to reset configuration:', error);
        }
    }

    private async exportConfiguration(): Promise<void> {
        console.log('📤 Exporting Agentwise Configuration\n');
        
        try {
            const exportPath = await this.config.export();
            console.log(`✅ Configuration exported to: ${exportPath}`);
        } catch (error) {
            console.error('❌ Failed to export configuration:', error);
        }
    }

    private async importConfiguration(filePath: string): Promise<void> {
        console.log(`📥 Importing Agentwise Configuration from: ${filePath}\n`);
        
        try {
            if (!fs.existsSync(filePath)) {
                console.log('❌ Configuration file not found');
                return;
            }

            const importedConfig = await this.config.import(filePath);
            const validation = await this.validator.validate(importedConfig);

            if (!validation.isValid) {
                console.log('\n❌ Imported configuration validation failed:');
                validation.errors.forEach(error => console.log(`   • ${error}`));
                return;
            }

            const confirm = await this.wizard.confirm(
                'This will overwrite your current configuration. Continue?'
            );

            if (confirm) {
                await this.config.save(importedConfig);
                console.log('✅ Configuration imported successfully!');
            } else {
                console.log('Import cancelled.');
            }

        } catch (error) {
            console.error('❌ Failed to import configuration:', error);
        }
    }

    private async showConfiguration(): Promise<void> {
        console.log('📋 Current Agentwise Configuration\n');
        
        try {
            const currentConfig = await this.config.load();
            console.log(JSON.stringify(currentConfig, null, 2));
        } catch (error) {
            console.error('❌ Failed to load configuration:', error);
        }
    }

    private async validateConfiguration(): Promise<void> {
        console.log('🔍 Validating Agentwise Configuration\n');
        
        try {
            const currentConfig = await this.config.load();
            const validation = await this.validator.validate(currentConfig);

            if (validation.isValid) {
                console.log('✅ Configuration is valid!');
            } else {
                console.log('❌ Configuration validation failed:');
                validation.errors.forEach(error => console.log(`   • ${error}`));
                
                if (validation.warnings.length > 0) {
                    console.log('\n⚠️  Warnings:');
                    validation.warnings.forEach(warning => console.log(`   • ${warning}`));
                }
            }
        } catch (error) {
            console.error('❌ Failed to validate configuration:', error);
        }
    }

    private showHelp(): void {
        console.log('📖 Agentwise Configuration Commands\n');
        console.log('Usage: /configure-agentwise [command] [options]\n');
        console.log('Commands:');
        console.log('   (no args)     Launch interactive configuration wizard');
        console.log('   permissions   Configure permission bypass system');
        console.log('   workspace     Configure workspace restrictions');
        console.log('   monitoring    Configure terminal monitoring');
        console.log('   reset         Reset configuration to defaults');
        console.log('   export        Export current configuration');
        console.log('   import <file> Import configuration from file');
        console.log('   show          Display current configuration');
        console.log('   validate      Validate current configuration');
        console.log('   help          Show this help message\n');
        console.log('Examples:');
        console.log('   /configure-agentwise');
        console.log('   /configure-agentwise permissions');
        console.log('   /configure-agentwise import ./my-config.json');
    }
}