import readline from 'readline';
import { 
    ConfigurationSchema, 
    PermissionConfig, 
    WorkspaceConfig, 
    MonitoringConfig, 
    TokenOptimizationConfig,
    CustomCommandConfig 
} from './AgentwiseConfiguration.js';

export class ConfigurationWizard {
    private rl: readline.Interface;

    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async run(): Promise<ConfigurationSchema> {
        console.log('🧙‍♂️ Welcome to the Agentwise Configuration Wizard!\n');
        console.log('This wizard will help you configure Agentwise settings for optimal performance and security.\n');

        const config: ConfigurationSchema = {
            version: '1.0.0',
            permissions: await this.configurePermissions(),
            workspace: await this.configureWorkspace(),
            monitoring: await this.configureMonitoring(),
            tokenOptimization: await this.configureTokenOptimization(),
            customCommands: await this.configureCustomCommands(),
            updatedAt: new Date().toISOString()
        };

        console.log('\n🎉 Configuration complete! Here\'s a summary:');
        this.displayConfigSummary(config);

        this.rl.close();
        return config;
    }

    async runPermissionWizard(currentConfig: PermissionConfig): Promise<PermissionConfig> {
        console.log('🔒 Configuring Permission System...\n');

        const bypassEnabled = await this.askYesNo(
            'Enable permission bypass system? (Allows bypassing file system restrictions)',
            currentConfig.bypassEnabled
        );

        const safetyMode = await this.askChoice(
            'Select safety mode',
            ['strict', 'moderate', 'permissive'],
            currentConfig.safetyMode,
            {
                'strict': 'Maximum security, restricted operations',
                'moderate': 'Balanced security and functionality',
                'permissive': 'Minimal restrictions, maximum flexibility'
            }
        );

        const autoResponse = await this.askYesNo(
            'Enable automatic responses to permission prompts?',
            currentConfig.autoResponse
        );

        const dangerousOperationsAllowed = await this.askYesNo(
            'Allow dangerous operations? (system commands, file deletion)',
            currentConfig.dangerousOperationsAllowed
        );

        const restrictedCommands = await this.askList(
            'Enter restricted commands (comma-separated)',
            currentConfig.restrictedCommands
        );

        const allowedFileExtensions = await this.askList(
            'Enter allowed file extensions (comma-separated, include dots)',
            currentConfig.allowedFileExtensions
        );

        return {
            bypassEnabled,
            safetyMode: safetyMode as 'strict' | 'moderate' | 'permissive',
            autoResponse,
            restrictedCommands,
            allowedFileExtensions,
            dangerousOperationsAllowed
        };
    }

    async runWorkspaceWizard(currentConfig: WorkspaceConfig): Promise<WorkspaceConfig> {
        console.log('📁 Configuring Workspace Settings...\n');

        const sandboxEnabled = await this.askYesNo(
            'Enable workspace sandboxing?',
            currentConfig.sandboxEnabled
        );

        const allowedPaths = await this.askList(
            'Enter allowed paths (comma-separated)',
            currentConfig.allowedPaths
        );

        const restrictedPaths = await this.askList(
            'Enter restricted paths (comma-separated)',
            currentConfig.restrictedPaths
        );

        const maxFileSize = await this.askNumber(
            'Maximum file size in MB',
            currentConfig.maxFileSize,
            1,
            1000
        );

        const autoBackup = await this.askYesNo(
            'Enable automatic backups?',
            currentConfig.autoBackup
        );

        const preserveGitIgnore = await this.askYesNo(
            'Preserve .gitignore rules?',
            currentConfig.preserveGitIgnore
        );

        return {
            sandboxEnabled,
            allowedPaths,
            restrictedPaths,
            maxFileSize,
            autoBackup,
            preserveGitIgnore
        };
    }

    async runMonitoringWizard(currentConfig: MonitoringConfig): Promise<MonitoringConfig> {
        console.log('📊 Configuring Monitoring Settings...\n');

        const terminalEnabled = await this.askYesNo(
            'Enable terminal monitoring?',
            currentConfig.terminalEnabled
        );

        const verbosityLevel = await this.askChoice(
            'Select verbosity level',
            ['quiet', 'normal', 'verbose', 'debug'],
            currentConfig.verbosityLevel,
            {
                'quiet': 'Minimal output',
                'normal': 'Standard output',
                'verbose': 'Detailed output',
                'debug': 'Maximum detail for troubleshooting'
            }
        );

        const logRetentionDays = await this.askNumber(
            'Log retention period in days',
            currentConfig.logRetentionDays,
            1,
            365
        );

        const performanceTracking = await this.askYesNo(
            'Enable performance tracking?',
            currentConfig.performanceTracking
        );

        const realTimeUpdates = await this.askYesNo(
            'Enable real-time updates?',
            currentConfig.realTimeUpdates
        );

        const errorReporting = await this.askYesNo(
            'Enable error reporting?',
            currentConfig.errorReporting
        );

        return {
            terminalEnabled,
            verbosityLevel: verbosityLevel as 'quiet' | 'normal' | 'verbose' | 'debug',
            logRetentionDays,
            performanceTracking,
            realTimeUpdates,
            errorReporting
        };
    }

    private async configurePermissions(): Promise<PermissionConfig> {
        console.log('🔒 Permission System Configuration\n');
        
        const bypassEnabled = await this.askYesNo(
            'Enable permission bypass system? (Allows bypassing file system restrictions)',
            false
        );

        if (bypassEnabled) {
            console.log('\n⚠️  WARNING: Enabling permission bypass can pose security risks!');
            const confirmed = await this.askYesNo('Are you sure you want to continue?', false);
            if (!confirmed) {
                return this.configurePermissions(); // Restart permission config
            }
        }

        const safetyMode = await this.askChoice(
            'Select safety mode',
            ['strict', 'moderate', 'permissive'],
            'moderate',
            {
                'strict': 'Maximum security, restricted operations',
                'moderate': 'Balanced security and functionality',
                'permissive': 'Minimal restrictions, maximum flexibility'
            }
        );

        const autoResponse = await this.askYesNo(
            'Enable automatic responses to permission prompts?',
            false
        );

        const dangerousOperationsAllowed = await this.askYesNo(
            'Allow dangerous operations? (system commands, file deletion)',
            false
        );

        return {
            bypassEnabled,
            safetyMode: safetyMode as 'strict' | 'moderate' | 'permissive',
            autoResponse,
            restrictedCommands: ['rm', 'rmdir', 'del', 'format', 'fdisk'],
            allowedFileExtensions: ['.ts', '.js', '.json', '.md', '.txt', '.yml', '.yaml', '.css', '.html'],
            dangerousOperationsAllowed
        };
    }

    private async configureWorkspace(): Promise<WorkspaceConfig> {
        console.log('\n📁 Workspace Configuration\n');

        const sandboxEnabled = await this.askYesNo(
            'Enable workspace sandboxing? (Restricts file access to specific directories)',
            true
        );

        const maxFileSize = await this.askNumber(
            'Maximum file size in MB',
            10,
            1,
            1000
        );

        const autoBackup = await this.askYesNo(
            'Enable automatic backups before operations?',
            true
        );

        return {
            sandboxEnabled,
            allowedPaths: ['./workspace', './src', './.claude'],
            restrictedPaths: ['/system', '/usr', '/etc', '/bin', '/sbin'],
            maxFileSize,
            autoBackup,
            preserveGitIgnore: true
        };
    }

    private async configureMonitoring(): Promise<MonitoringConfig> {
        console.log('\n📊 Monitoring Configuration\n');

        const terminalEnabled = await this.askYesNo(
            'Enable terminal monitoring?',
            true
        );

        const verbosityLevel = await this.askChoice(
            'Select default verbosity level',
            ['quiet', 'normal', 'verbose', 'debug'],
            'normal',
            {
                'quiet': 'Minimal output',
                'normal': 'Standard output',
                'verbose': 'Detailed output',
                'debug': 'Maximum detail for troubleshooting'
            }
        );

        const performanceTracking = await this.askYesNo(
            'Enable performance tracking?',
            true
        );

        return {
            terminalEnabled,
            verbosityLevel: verbosityLevel as 'quiet' | 'normal' | 'verbose' | 'debug',
            logRetentionDays: 30,
            performanceTracking,
            realTimeUpdates: true,
            errorReporting: true
        };
    }

    private async configureTokenOptimization(): Promise<TokenOptimizationConfig> {
        console.log('\n🚀 Token Optimization Configuration\n');

        const enabled = await this.askYesNo(
            'Enable token optimization? (Reduces API usage by 30-40%)',
            true
        );

        const maxTokensPerAgent = await this.askNumber(
            'Maximum tokens per agent',
            8000,
            1000,
            32000
        );

        const cacheEnabled = await this.askYesNo(
            'Enable response caching?',
            true
        );

        const compressionLevel = await this.askChoice(
            'Select compression level',
            ['none', 'low', 'medium', 'high'],
            'medium',
            {
                'none': 'No compression',
                'low': 'Light compression',
                'medium': 'Balanced compression',
                'high': 'Maximum compression'
            }
        );

        return {
            enabled,
            maxTokensPerAgent,
            contextWindowSize: 32000,
            cacheEnabled,
            compressionLevel: compressionLevel as 'none' | 'low' | 'medium' | 'high'
        };
    }

    private async configureCustomCommands(): Promise<CustomCommandConfig> {
        console.log('\n⚡ Custom Commands Configuration\n');

        const defaultCommands = ['create', 'task', 'projects', 'monitor', 'setup-mcps'];
        
        return {
            enabledCommands: defaultCommands,
            disabledCommands: [],
            customCommandPaths: ['./.claude/commands'],
            requireConfirmation: ['reset', 'delete-project', 'import']
        };
    }

    private async askYesNo(question: string, defaultValue: boolean = false): Promise<boolean> {
        const defaultStr = defaultValue ? 'Y/n' : 'y/N';
        const answer = await this.ask(`${question} (${defaultStr}): `);
        
        if (answer.toLowerCase() === '') {
            return defaultValue;
        }
        
        return answer.toLowerCase().startsWith('y');
    }

    private async askChoice(
        question: string, 
        choices: string[], 
        defaultChoice: string,
        descriptions?: Record<string, string>
    ): Promise<string> {
        console.log(`${question}:`);
        
        choices.forEach((choice, index) => {
            const marker = choice === defaultChoice ? '>' : ' ';
            const description = descriptions?.[choice] ? ` - ${descriptions[choice]}` : '';
            console.log(`${marker} ${index + 1}. ${choice}${description}`);
        });

        while (true) {
            const answer = await this.ask(`Select (1-${choices.length}) [${defaultChoice}]: `);
            
            if (answer === '') {
                return defaultChoice;
            }

            const index = parseInt(answer, 10) - 1;
            if (index >= 0 && index < choices.length) {
                return choices[index];
            }

            console.log('❌ Invalid selection. Please try again.');
        }
    }

    private async askNumber(
        question: string, 
        defaultValue: number, 
        min?: number, 
        max?: number
    ): Promise<number> {
        while (true) {
            const answer = await this.ask(`${question} [${defaultValue}]: `);
            
            if (answer === '') {
                return defaultValue;
            }

            const num = parseInt(answer, 10);
            
            if (isNaN(num)) {
                console.log('❌ Please enter a valid number.');
                continue;
            }

            if (min !== undefined && num < min) {
                console.log(`❌ Number must be at least ${min}.`);
                continue;
            }

            if (max !== undefined && num > max) {
                console.log(`❌ Number must be at most ${max}.`);
                continue;
            }

            return num;
        }
    }

    private async askList(question: string, defaultValue: string[]): Promise<string[]> {
        const defaultStr = defaultValue.join(', ');
        const answer = await this.ask(`${question} [${defaultStr}]: `);
        
        if (answer === '') {
            return defaultValue;
        }

        return answer.split(',').map(item => item.trim()).filter(item => item.length > 0);
    }

    private async ask(question: string): Promise<string> {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer.trim());
            });
        });
    }

    async confirm(message: string): Promise<boolean> {
        return this.askYesNo(message, false);
    }

    private displayConfigSummary(config: ConfigurationSchema): void {
        console.log('\n📋 Configuration Summary:');
        console.log(`   Version: ${config.version}`);
        console.log(`   Permission bypass: ${config.permissions.bypassEnabled ? '✅' : '❌'}`);
        console.log(`   Safety mode: ${config.permissions.safetyMode}`);
        console.log(`   Sandbox enabled: ${config.workspace.sandboxEnabled ? '✅' : '❌'}`);
        console.log(`   Monitoring: ${config.monitoring.terminalEnabled ? '✅' : '❌'}`);
        console.log(`   Token optimization: ${config.tokenOptimization.enabled ? '✅' : '❌'}`);
        console.log(`   Updated: ${new Date(config.updatedAt).toLocaleString()}`);
    }
}