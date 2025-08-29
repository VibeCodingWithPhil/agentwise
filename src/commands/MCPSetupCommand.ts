/**
 * MCP Setup Command
 * Handles the /setup-mcps command to configure all MCPs for Claude Code
 */

import { MCPSetupManager } from '../mcp/MCPSetupManager';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

export class MCPSetupCommand {
  private setupManager: MCPSetupManager;

  constructor() {
    this.setupManager = new MCPSetupManager();
  }

  /**
   * Handle the /setup-mcps command
   */
  async handle(args: string[]): Promise<void> {
    console.log(chalk.bold.cyan('\n🔌 Agentwise MCP Setup Wizard\n'));
    console.log('This wizard will help you configure all MCPs for Claude Code.');
    console.log('MCPs enable agents to interact with external services and tools.\n');

    // Parse arguments
    const command = args[0];
    
    if (command === 'list') {
      await this.listMCPs();
      return;
    }
    
    if (command === 'env') {
      await this.generateEnvTemplate();
      return;
    }
    
    if (command === 'check') {
      await this.checkMCPStatus();
      return;
    }

    if (command === 'help') {
      this.showHelp();
      return;
    }

    // Main setup flow
    await this.runSetupWizard();
  }

  /**
   * Run the interactive setup wizard
   */
  private async runSetupWizard(): Promise<void> {
    const categories = this.setupManager.getCategories();
    
    // Ask what to setup
    const { setupMode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'setupMode',
        message: 'What would you like to setup?',
        choices: [
          { name: '🚀 Setup All MCPs (Recommended)', value: 'all' },
          { name: '📦 Setup by Category', value: 'category' },
          { name: '🎯 Setup Essential MCPs Only', value: 'essential' },
          { name: '🔧 Custom Selection', value: 'custom' },
          { name: '❌ Cancel', value: 'cancel' }
        ]
      }
    ]);

    if (setupMode === 'cancel') {
      console.log(chalk.yellow('\nSetup cancelled.'));
      return;
    }

    let selectedCategories: string[] = [];

    switch (setupMode) {
      case 'all':
        selectedCategories = categories;
        break;
      
      case 'category':
        const { categories: selected } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'categories',
            message: 'Select categories to setup:',
            choices: categories.map(cat => ({
              name: `${this.getCategoryEmoji(cat)} ${cat}`,
              value: cat
            }))
          }
        ]);
        selectedCategories = selected;
        break;
      
      case 'essential':
        selectedCategories = ['Development', 'Database', 'Testing', 'Design'];
        break;
      
      case 'custom':
        const allMCPs = this.setupManager.getAvailableMCPs();
        const { mcps } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'mcps',
            message: 'Select MCPs to setup:',
            choices: allMCPs.map(mcp => ({
              name: `${mcp.displayName} (${mcp.category})`,
              value: mcp.name
            })),
            pageSize: 15
          }
        ]);
        // For custom selection, extract categories from selected MCPs
        const selectedMCPs = mcps as string[];
        selectedCategories = [...new Set(
          allMCPs
            .filter(mcp => selectedMCPs.includes(mcp.name))
            .map(mcp => mcp.category)
        )];
        break;
    }

    // Ask about installation
    const { skipInstall } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'skipInstall',
        message: 'Skip npm installation? (Choose Yes if MCPs are already installed)',
        default: false
      }
    ]);

    // Ask about verbosity
    const { verbose } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'verbose',
        message: 'Show detailed output?',
        default: false
      }
    ]);

    // Start setup
    console.log(chalk.bold.green('\n🚀 Starting MCP Setup...\n'));
    
    const spinner = ora('Configuring MCPs...').start();

    try {
      const results = await this.setupManager.setupAllMCPs({
        skipInstall,
        verbose,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined
      });

      spinner.stop();

      // Show results
      this.showResults(results);

      // Ask about environment template
      if (results.installed.length > 0) {
        const { generateEnv } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'generateEnv',
            message: 'Generate .env template file for required API keys?',
            default: true
          }
        ]);

        if (generateEnv) {
          await this.setupManager.generateEnvTemplate();
        }
      }

      // Show next steps
      this.showNextSteps(results);

    } catch (error) {
      spinner.fail('Setup failed');
      console.error(chalk.red(`\n❌ Error: ${error}`));
    }
  }

  /**
   * List all available MCPs
   */
  private async listMCPs(): Promise<void> {
    console.log(chalk.bold.cyan('\n📦 Available MCPs\n'));
    
    const categories = this.setupManager.getCategories();
    
    for (const category of categories) {
      const mcps = this.setupManager.getMCPsByCategory(category);
      
      console.log(chalk.bold(`\n${this.getCategoryEmoji(category)} ${category}`));
      console.log('─'.repeat(50));
      
      for (const mcp of mcps) {
        const authBadge = mcp.requiresAuth ? chalk.yellow(' [Auth Required]') : '';
        const localBadge = mcp.isLocal ? chalk.blue(' [Local Server]') : '';
        console.log(`  • ${mcp.displayName}${authBadge}${localBadge}`);
        
        if (mcp.documentation) {
          console.log(chalk.gray(`    ${mcp.documentation}`));
        }
      }
    }
    
    console.log(chalk.gray('\n💡 Run "agentwise setup-mcps" to configure these MCPs'));
  }

  /**
   * Check MCP status
   */
  private async checkMCPStatus(): Promise<void> {
    console.log(chalk.bold.cyan('\n🔍 Checking MCP Status...\n'));
    
    const spinner = ora('Checking configured MCPs...').start();
    
    try {
      const { execSync } = require('child_process');
      const output = execSync('claude mcp list', { encoding: 'utf-8' });
      
      spinner.stop();
      
      console.log(chalk.bold('Configured MCPs:'));
      console.log('─'.repeat(50));
      
      const lines = output.split('\n').filter((line: string) => line.trim());
      
      if (lines.length === 0) {
        console.log(chalk.yellow('No MCPs configured yet.'));
        console.log(chalk.gray('Run "agentwise setup-mcps" to configure MCPs.'));
      } else {
        lines.forEach((line: string) => {
          console.log(`  ✅ ${line}`);
        });
      }
      
      // Check for local servers
      console.log(chalk.bold('\n\nLocal MCP Servers:'));
      console.log('─'.repeat(50));
      
      const localMCPs = this.setupManager.getAvailableMCPs().filter(m => m.isLocal);
      
      for (const mcp of localMCPs) {
        if (mcp.port) {
          try {
            execSync(`lsof -ti:${mcp.port}`, { encoding: 'utf-8' });
            console.log(`  🟢 ${mcp.displayName} - Running on port ${mcp.port}`);
          } catch {
            console.log(`  🔴 ${mcp.displayName} - Not running (port ${mcp.port})`);
          }
        }
      }
      
    } catch (error) {
      spinner.fail('Failed to check MCP status');
      console.error(chalk.red('Error checking status. Make sure Claude CLI is installed.'));
    }
  }

  /**
   * Generate environment template
   */
  private async generateEnvTemplate(): Promise<void> {
    console.log(chalk.bold.cyan('\n📄 Generating Environment Template...\n'));
    
    try {
      await this.setupManager.generateEnvTemplate();
      console.log(chalk.green('✅ Template generated successfully!'));
      console.log(chalk.gray('Edit .env.mcp.template and rename to .env'));
    } catch (error) {
      console.error(chalk.red(`❌ Failed to generate template: ${error}`));
    }
  }

  /**
   * Show setup results
   */
  private showResults(results: {
    success: boolean;
    installed: string[];
    failed: string[];
    skipped: string[];
  }): void {
    console.log(chalk.bold('\n📊 Setup Results:\n'));
    
    if (results.installed.length > 0) {
      console.log(chalk.green(`✅ Successfully configured: ${results.installed.length} MCPs`));
      results.installed.forEach(mcp => {
        console.log(chalk.green(`   • ${mcp}`));
      });
    }
    
    if (results.skipped.length > 0) {
      console.log(chalk.yellow(`\n⏭️  Skipped: ${results.skipped.length} MCPs`));
      results.skipped.forEach(mcp => {
        console.log(chalk.yellow(`   • ${mcp}`));
      });
    }
    
    if (results.failed.length > 0) {
      console.log(chalk.red(`\n❌ Failed: ${results.failed.length} MCPs`));
      results.failed.forEach(mcp => {
        console.log(chalk.red(`   • ${mcp}`));
      });
    }
  }

  /**
   * Show next steps
   */
  private showNextSteps(results: any): void {
    console.log(chalk.bold.cyan('\n📝 Next Steps:\n'));
    
    const steps = [
      '1. Set up required environment variables in your .env file',
      '2. Run "claude mcp list" to verify MCPs are configured',
      '3. Use "/mcp" in Claude Code to see available MCPs',
      '4. Agents will now automatically use relevant MCPs for their tasks'
    ];
    
    steps.forEach(step => {
      console.log(chalk.white(`   ${step}`));
    });
    
    if (results.failed.length > 0) {
      console.log(chalk.yellow('\n⚠️  Some MCPs failed to configure.'));
      console.log(chalk.yellow('   Check error messages and try manual setup if needed.'));
    }
    
    console.log(chalk.gray('\n💡 For more help, visit: https://docs.agentwise.ai/mcps'));
  }

  /**
   * Show help message
   */
  private showHelp(): void {
    console.log(chalk.bold.cyan('\n📚 MCP Setup Help\n'));
    
    const commands = [
      { cmd: 'setup-mcps', desc: 'Run interactive setup wizard' },
      { cmd: 'setup-mcps list', desc: 'List all available MCPs' },
      { cmd: 'setup-mcps check', desc: 'Check current MCP status' },
      { cmd: 'setup-mcps env', desc: 'Generate .env template file' },
      { cmd: 'setup-mcps help', desc: 'Show this help message' }
    ];
    
    console.log(chalk.bold('Available Commands:'));
    console.log('─'.repeat(50));
    
    commands.forEach(({ cmd, desc }) => {
      console.log(`  ${chalk.cyan(cmd.padEnd(20))} ${desc}`);
    });
    
    console.log(chalk.bold('\n\nExamples:'));
    console.log('─'.repeat(50));
    console.log('  agentwise setup-mcps           # Run setup wizard');
    console.log('  agentwise setup-mcps list      # See all MCPs');
    console.log('  agentwise setup-mcps check     # Check status');
    
    console.log(chalk.gray('\n💡 MCPs enable agents to interact with external services'));
  }

  /**
   * Get emoji for category
   */
  private getCategoryEmoji(category: string): string {
    const emojis: Record<string, string> = {
      'Design': '🎨',
      'UI Components': '🧩',
      'Database': '🗄️',
      'Development': '💻',
      'Testing': '🧪',
      'DevOps': '🔧',
      'Cloud': '☁️',
      'Infrastructure': '🏗️',
      'Payments': '💳',
      'Communication': '💬',
      'Web Scraping': '🕷️',
      'Search': '🔍',
      'HTTP': '🌐',
      'Build Tools': '🔨',
      'Frameworks': '🚀',
      'Monitoring': '📊',
      'Performance': '⚡',
      'Documentation': '📚',
      'Utility': '🛠️',
      'AI Enhancement': '🤖',
      'System': '💾'
    };
    
    return emojis[category] || '📦';
  }
}

export default MCPSetupCommand;