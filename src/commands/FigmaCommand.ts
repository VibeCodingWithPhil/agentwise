import { FigmaMCPClient } from '../integrations/FigmaMCPClient';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import * as path from 'path';

export class FigmaCommand {
    private client: FigmaMCPClient;
    private spinner: any;

    constructor() {
        this.client = new FigmaMCPClient();
    }

    async handle(args: string[]): Promise<void> {
        const subcommand = args[0] || 'help';

        try {
            switch (subcommand) {
                case 'connect':
                    await this.connect();
                    break;
                case 'generate':
                case 'gen':
                    await this.generate(args.slice(1));
                    break;
                case 'sync':
                    await this.sync();
                    break;
                case 'tokens':
                    await this.exportTokens(args.slice(1));
                    break;
                case 'screenshot':
                case 'image':
                    await this.screenshot(args.slice(1));
                    break;
                case 'rules':
                    await this.createRules(args.slice(1));
                    break;
                case 'status':
                    await this.status();
                    break;
                case 'help':
                default:
                    this.showHelp();
                    break;
            }
        } catch (error: any) {
            console.error(chalk.red(`❌ Error: ${error.message}`));
            process.exit(1);
        }
    }

    private async connect(): Promise<void> {
        this.spinner = ora('Connecting to Figma Dev Mode MCP Server...').start();
        
        try {
            await this.client.initialize();
            this.spinner.succeed('Connected to Figma Dev Mode MCP Server');
            
            console.log(chalk.cyan('\n📋 Available commands:'));
            console.log(chalk.gray('  /figma generate - Generate code from Figma selection'));
            console.log(chalk.gray('  /figma sync     - Sync design tokens and components'));
            console.log(chalk.gray('  /figma tokens   - Export design tokens'));
            console.log(chalk.gray('  /figma image    - Capture screenshot of selection'));
            console.log(chalk.gray('  /figma rules    - Generate design system rules'));
        } catch (error: any) {
            this.spinner.fail('Failed to connect to Figma MCP Server');
            console.log(chalk.yellow('\n⚠️  Prerequisites:'));
            console.log(chalk.gray('  1. Figma desktop app is running'));
            console.log(chalk.gray('  2. Dev Mode MCP Server is enabled in Figma Preferences'));
            console.log(chalk.gray('  3. You have a Dev or Full seat on a paid Figma plan'));
            throw error;
        }
    }

    private async generate(args: string[]): Promise<void> {
        await this.ensureConnected();

        const componentName = args[0];
        if (!componentName) {
            const answer = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Enter component name:',
                    validate: (input) => input.length > 0
                }
            ]);
            args[0] = answer.name;
        }

        const frameworks = ['react', 'vue', 'angular', 'html', 'swift', 'kotlin'];
        const answer = await inquirer.prompt([
            {
                type: 'list',
                name: 'framework',
                message: 'Select target framework:',
                choices: frameworks,
                default: 'react'
            },
            {
                type: 'confirm',
                name: 'includeStyles',
                message: 'Include styles?',
                default: true
            },
            {
                type: 'confirm',
                name: 'useCodeConnect',
                message: 'Use Code Connect if available?',
                default: true
            }
        ]);

        this.spinner = ora(`Generating ${answer.framework} component from Figma selection...`).start();

        try {
            await this.client.generateComponent(args[0], answer.framework);
            this.spinner.succeed(`Component "${args[0]}" generated successfully`);
            
            console.log(chalk.green('\n✅ Generation complete!'));
            console.log(chalk.gray(`📁 Component location: src/components/${args[0]}/`));
        } catch (error: any) {
            this.spinner.fail('Code generation failed');
            throw error;
        }
    }

    private async sync(): Promise<void> {
        await this.ensureConnected();

        this.spinner = ora('Syncing with Figma...').start();

        try {
            await this.client.syncWithFigma();
            this.spinner.succeed('Sync complete');
            
            const context = await this.client.getDesignContext();
            
            console.log(chalk.green('\n📊 Sync Summary:'));
            console.log(chalk.gray(`  • ${context.variables.length} design variables`));
            console.log(chalk.gray(`  • ${context.components.length} connected components`));
            console.log(chalk.gray(`  • Design tokens exported to: src/design-tokens.json`));
        } catch (error: any) {
            this.spinner.fail('Sync failed');
            throw error;
        }
    }

    private async exportTokens(args: string[]): Promise<void> {
        await this.ensureConnected();

        const outputPath = args[0] || path.join(process.cwd(), 'src', 'design-tokens.json');

        this.spinner = ora('Exporting design tokens...').start();

        try {
            await this.client.exportDesignTokens(outputPath);
            this.spinner.succeed('Design tokens exported');
            console.log(chalk.gray(`📁 Tokens saved to: ${outputPath}`));
        } catch (error: any) {
            this.spinner.fail('Token export failed');
            throw error;
        }
    }

    private async screenshot(args: string[]): Promise<void> {
        await this.ensureConnected();

        const outputPath = args[0] || path.join(process.cwd(), 'figma-screenshot.png');

        this.spinner = ora('Capturing screenshot...').start();

        try {
            await this.client.getImage(outputPath);
            this.spinner.succeed('Screenshot captured');
            console.log(chalk.gray(`📸 Image saved to: ${outputPath}`));
        } catch (error: any) {
            this.spinner.fail('Screenshot failed');
            throw error;
        }
    }

    private async createRules(args: string[]): Promise<void> {
        await this.ensureConnected();

        const outputDir = args[0] || path.join(process.cwd(), 'src', 'design-system');

        this.spinner = ora('Generating design system rules...').start();

        try {
            await this.client.createDesignSystemRules(outputDir);
            this.spinner.succeed('Design system rules created');
            console.log(chalk.gray(`📁 Rules saved to: ${outputDir}/design-system-rules.json`));
        } catch (error: any) {
            this.spinner.fail('Rule generation failed');
            throw error;
        }
    }

    private async status(): Promise<void> {
        this.spinner = ora('Checking Figma MCP Server status...').start();

        try {
            await this.client.initialize();
            this.spinner.succeed('Figma MCP Server is running');
            
            const context = await this.client.getDesignContext();
            
            console.log(chalk.cyan('\n📊 Server Status:'));
            console.log(chalk.green('  ✅ Server: Active'));
            console.log(chalk.green('  ✅ Connection: Established'));
            console.log(chalk.gray(`  📦 Components: ${context.components.length}`));
            console.log(chalk.gray(`  🎨 Variables: ${context.variables.length}`));
        } catch (error) {
            this.spinner.fail('Figma MCP Server is not accessible');
            console.log(chalk.yellow('\n⚠️  Troubleshooting:'));
            console.log(chalk.gray('  1. Ensure Figma desktop app is running'));
            console.log(chalk.gray('  2. Enable Dev Mode MCP Server in Figma Preferences'));
            console.log(chalk.gray('  3. Verify you have proper Figma plan access'));
        }
    }

    private async ensureConnected(): Promise<void> {
        try {
            await this.client.initialize();
        } catch (error) {
            console.log(chalk.yellow('⚠️  Not connected to Figma. Attempting to connect...'));
            await this.connect();
        }
    }

    private showHelp(): void {
        console.log(chalk.cyan('\n🎨 Figma Dev Mode MCP Integration\n'));
        console.log(chalk.white('Usage: /figma [command] [options]\n'));
        console.log(chalk.white('Commands:'));
        console.log(chalk.gray('  connect              Connect to Figma MCP Server'));
        console.log(chalk.gray('  generate [name]      Generate component from Figma selection'));
        console.log(chalk.gray('  sync                 Sync design tokens and components'));
        console.log(chalk.gray('  tokens [path]        Export design tokens to JSON'));
        console.log(chalk.gray('  image [path]         Capture screenshot of selection'));
        console.log(chalk.gray('  rules [dir]          Generate design system rules'));
        console.log(chalk.gray('  status               Check server connection status'));
        console.log(chalk.gray('  help                 Show this help message'));
        console.log(chalk.white('\nExamples:'));
        console.log(chalk.gray('  /figma connect'));
        console.log(chalk.gray('  /figma generate Button'));
        console.log(chalk.gray('  /figma sync'));
        console.log(chalk.gray('  /figma tokens ./tokens.json'));
        console.log(chalk.white('\nPrerequisites:'));
        console.log(chalk.gray('  • Figma desktop app installed and running'));
        console.log(chalk.gray('  • Dev Mode MCP Server enabled in Figma Preferences'));
        console.log(chalk.gray('  • Dev or Full seat on Professional/Organization/Enterprise plan'));
    }
}

export default FigmaCommand;