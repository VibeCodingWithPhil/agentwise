/**
 * Model-related command handlers for Agentwise
 * Handles local model setup, discovery, and routing configuration
 */

import { SmartModelRouter } from '../models/SmartModelRouter';
import * as chalk from 'chalk';

export class ModelCommands {
  private router: SmartModelRouter;

  constructor() {
    this.router = new SmartModelRouter();
  }

  /**
   * Handle /setup-ollama command
   */
  async handleSetupOllama(autoInstall: boolean = true): Promise<void> {
    console.log(chalk.blue('🚀 Setting up Ollama for local model support...\n'));
    
    const success = await this.router.setupOllama(autoInstall);
    
    if (success) {
      await this.router.discoverModels();
      const models = this.router.getAvailableModels().get('ollama') || [];
      
      console.log(chalk.green(`\n✅ Ollama setup complete!`));
      console.log(chalk.cyan(`Found ${models.length} models:`));
      
      models.forEach(model => {
        console.log(`  • ${model.model}`);
      });
      
      console.log(chalk.gray('\nUse /local-models to see all available models'));
      console.log(chalk.gray('Use /configure-routing to customize model selection'));
    } else {
      console.log(chalk.red('\n❌ Ollama setup failed'));
      console.log(chalk.yellow('Please install Ollama from https://ollama.ai'));
    }
  }

  /**
   * Handle /setup-lmstudio command
   */
  async handleSetupLMStudio(): Promise<void> {
    console.log(chalk.blue('🚀 Setting up LM Studio for local model support...\n'));
    
    const success = await this.router.setupLMStudio();
    
    if (success) {
      await this.router.discoverModels();
      const models = this.router.getAvailableModels().get('lmstudio') || [];
      
      console.log(chalk.green(`\n✅ LM Studio setup complete!`));
      console.log(chalk.cyan(`Found ${models.length} models:`));
      
      models.forEach(model => {
        console.log(`  • ${model.model}`);
      });
      
      console.log(chalk.gray('\nUse /local-models to see all available models'));
      console.log(chalk.gray('Use /configure-routing to customize model selection'));
    } else {
      console.log(chalk.red('\n⚠️ LM Studio not detected'));
      console.log(chalk.yellow('Please ensure LM Studio is:'));
      console.log('  1. Installed from https://lmstudio.ai');
      console.log('  2. Running with a model loaded');
      console.log('  3. Local server started on port 1234');
    }
  }

  /**
   * Handle /local-models command
   */
  async handleLocalModels(): Promise<void> {
    console.log(chalk.blue('🤖 Available Local Models:\n'));
    
    await this.router.discoverModels();
    const allModels = this.router.getAvailableModels();
    
    // Display Ollama models
    const ollamaModels = allModels.get('ollama') || [];
    if (ollamaModels.length > 0) {
      console.log(chalk.cyan('Ollama Models:'));
      ollamaModels.forEach(model => {
        console.log(`  • ${chalk.white(model.model)}`);
      });
      console.log();
    }
    
    // Display LM Studio models
    const lmStudioModels = allModels.get('lmstudio') || [];
    if (lmStudioModels.length > 0) {
      console.log(chalk.cyan('LM Studio Models:'));
      lmStudioModels.forEach(model => {
        console.log(`  • ${chalk.white(model.model)}`);
      });
      console.log();
    }
    
    // Display current routing configuration
    const config = this.router.getConfig();
    console.log(chalk.cyan('Current Routing Configuration:'));
    
    config.rules.forEach(rule => {
      const model = `${rule.preferredModel.provider}/${rule.preferredModel.model}`;
      console.log(`  • ${chalk.yellow(rule.taskType)} → ${chalk.white(model)}`);
      if (rule.fallbackModel) {
        const fallback = `${rule.fallbackModel.provider}/${rule.fallbackModel.model}`;
        console.log(`    ${chalk.gray('Fallback:')} ${fallback}`);
      }
    });
    
    // Summary
    const totalModels = ollamaModels.length + lmStudioModels.length;
    console.log(chalk.gray(`\nTotal Local Models: ${totalModels}`));
    
    if (totalModels === 0) {
      console.log(chalk.yellow('\n💡 No local models found'));
      console.log('Run /setup-ollama or /setup-lmstudio to get started');
    }
  }

  /**
   * Handle /configure-routing command
   */
  async handleConfigureRouting(args: string[]): Promise<void> {
    if (args.length === 0 || args[0] === 'show') {
      // Show current configuration
      const config = this.router.getConfig();
      console.log(chalk.blue('📋 Current Routing Configuration:\n'));
      console.log(JSON.stringify(config, null, 2));
      return;
    }
    
    if (args[0] === 'test') {
      // Test routing
      await this.router.testRouting();
      return;
    }
    
    if (args[0] === 'reset') {
      // Reset to defaults
      console.log(chalk.yellow('Resetting to default configuration...'));
      // This will recreate the default config
      this.router = new SmartModelRouter();
      console.log(chalk.green('✅ Configuration reset to defaults'));
      return;
    }
    
    if (args[0] === 'optimize') {
      // Auto-optimize based on available models
      await this.optimizeRouting();
      return;
    }
    
    // Configure specific routing rule
    if (args.length >= 3) {
      const [taskType, provider, model] = args;
      
      const config = this.router.getConfig();
      const rule = config.rules.find(r => r.taskType === taskType);
      
      if (rule) {
        rule.preferredModel = {
          provider: provider as ('claude' | 'ollama' | 'lmstudio' | 'openrouter'),
          model: model
        };
        
        await this.router.configureRouting(config);
        console.log(chalk.green(`✅ Updated routing for ${taskType}`));
        console.log(`  → ${provider}/${model}`);
      } else {
        console.log(chalk.red(`❌ Unknown task type: ${taskType}`));
        console.log('Valid types: code-generation, code-review, documentation, testing, ui-design');
      }
    } else {
      console.log(chalk.red('Usage: /configure-routing <task-type> <provider> <model>'));
      console.log('   or: /configure-routing [show|test|reset|optimize]');
    }
  }

  /**
   * Auto-optimize routing based on available models
   */
  private async optimizeRouting(): Promise<void> {
    console.log(chalk.blue('🔧 Optimizing model routing...\n'));
    
    await this.router.discoverModels();
    const available = this.router.getAvailableModels();
    const config = this.router.getConfig();
    
    // Optimize each rule
    config.rules.forEach(rule => {
      // Prefer local models for non-critical tasks
      if (['documentation', 'testing'].includes(rule.taskType)) {
        const ollamaModels = available.get('ollama') || [];
        if (ollamaModels.length > 0) {
          // Use best available Ollama model
          const codeModel = ollamaModels.find(m => m.model.includes('code'));
          rule.preferredModel = {
            provider: 'ollama',
            model: codeModel ? codeModel.model : ollamaModels[0].model
          };
          console.log(`  ✅ ${rule.taskType} → Ollama (free)`);
        }
      }
    });
    
    // Enable cost optimization
    config.costOptimization = true;
    config.enableFallback = true;
    
    await this.router.configureRouting(config);
    console.log(chalk.green('\n✅ Routing optimized for cost and performance'));
  }
}