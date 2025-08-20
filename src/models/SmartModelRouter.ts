/**
 * Smart Model Router - Intelligently routes tasks to appropriate models
 * Supports Claude (Opus/Sonnet), Ollama, LM Studio, and OpenRouter
 */

import { execFileSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

interface ModelConfig {
  provider: 'claude' | 'ollama' | 'lmstudio' | 'openrouter';
  model: string;
  endpoint?: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
}

interface RoutingRule {
  taskType: string;
  patterns: string[];
  preferredModel: ModelConfig;
  fallbackModel?: ModelConfig;
  description: string;
}

interface RouterConfig {
  rules: RoutingRule[];
  defaultModel: ModelConfig;
  localModelsPath?: string;
  enableFallback: boolean;
  costOptimization: boolean;
}

export class SmartModelRouter {
  private config: RouterConfig;
  private availableModels: Map<string, ModelConfig[]> = new Map();
  private modelPerformance: Map<string, number> = new Map();
  private configPath = path.join(process.cwd(), '.agentwise-models.json');

  constructor() {
    this.config = this.loadConfig();
    // Note: discoverModels() is async and will be called when needed
  }

  /**
   * Load or create default configuration
   */
  private loadConfig(): RouterConfig {
    if (fs.existsSync(this.configPath)) {
      return fs.readJsonSync(this.configPath);
    }

    // Default configuration
    const defaultConfig: RouterConfig = {
      rules: [
        {
          taskType: 'code-generation',
          patterns: ['create', 'implement', 'write', 'generate'],
          preferredModel: {
            provider: 'claude',
            model: 'claude-3-opus-20240229'
          },
          fallbackModel: {
            provider: 'ollama',
            model: 'codellama:34b'
          },
          description: 'Complex code generation tasks'
        },
        {
          taskType: 'code-review',
          patterns: ['review', 'analyze', 'audit', 'check'],
          preferredModel: {
            provider: 'claude',
            model: 'claude-3-sonnet-20240229'
          },
          fallbackModel: {
            provider: 'ollama',
            model: 'mistral:latest'
          },
          description: 'Code review and analysis'
        },
        {
          taskType: 'documentation',
          patterns: ['document', 'explain', 'describe', 'readme'],
          preferredModel: {
            provider: 'ollama',
            model: 'llama2:13b'
          },
          description: 'Documentation and explanations'
        },
        {
          taskType: 'testing',
          patterns: ['test', 'spec', 'jest', 'cypress'],
          preferredModel: {
            provider: 'lmstudio',
            model: 'local-model'
          },
          fallbackModel: {
            provider: 'openrouter',
            model: 'gpt-3.5-turbo'
          },
          description: 'Test generation and validation'
        },
        {
          taskType: 'ui-design',
          patterns: ['design', 'ui', 'ux', 'style', 'css'],
          preferredModel: {
            provider: 'claude',
            model: 'claude-3-opus-20240229'
          },
          description: 'UI/UX design and styling'
        }
      ],
      defaultModel: {
        provider: 'claude',
        model: 'claude-3-sonnet-20240229'
      },
      enableFallback: true,
      costOptimization: true,
      localModelsPath: process.env.LOCAL_MODELS_PATH || '~/.ollama/models'
    };

    this.saveConfig(defaultConfig);
    return defaultConfig;
  }

  /**
   * Save configuration to file
   */
  private saveConfig(config: RouterConfig): void {
    fs.writeJsonSync(this.configPath, config, { spaces: 2 });
  }

  /**
   * Discover available models from all providers
   */
  public async discoverModels(): Promise<void> {
    console.log('🔍 Discovering available models...');

    // Discover Ollama models
    const ollamaModels = await this.discoverOllamaModels();
    if (ollamaModels.length > 0) {
      this.availableModels.set('ollama', ollamaModels);
      console.log(`  ✅ Found ${ollamaModels.length} Ollama models`);
    }

    // Discover LM Studio models
    const lmStudioModels = await this.discoverLMStudioModels();
    if (lmStudioModels.length > 0) {
      this.availableModels.set('lmstudio', lmStudioModels);
      console.log(`  ✅ Found ${lmStudioModels.length} LM Studio models`);
    }

    // Claude models are always available
    this.availableModels.set('claude', [
      { provider: 'claude', model: 'claude-3-opus-20240229' },
      { provider: 'claude', model: 'claude-3-sonnet-20240229' }
    ]);

    // OpenRouter models (subset)
    this.availableModels.set('openrouter', [
      { provider: 'openrouter', model: 'gpt-4-turbo' },
      { provider: 'openrouter', model: 'gpt-3.5-turbo' },
      { provider: 'openrouter', model: 'mistral-medium' },
      { provider: 'openrouter', model: 'llama-2-70b' }
    ]);
  }

  /**
   * Discover Ollama models
   */
  private async discoverOllamaModels(): Promise<ModelConfig[]> {
    try {
      const result = execFileSync('ollama', ['list'], { encoding: 'utf-8' });
      const lines = result.split('\n').slice(1); // Skip header
      
      return lines
        .filter(line => line.trim())
        .map(line => {
          const [name] = line.split(/\s+/);
          return {
            provider: 'ollama' as const,
            model: name,
            endpoint: 'http://localhost:11434'
          };
        });
    } catch {
      return [];
    }
  }

  /**
   * Discover LM Studio models
   */
  private async discoverLMStudioModels(): Promise<ModelConfig[]> {
    try {
      // Check if LM Studio is running
      const response = await fetch('http://localhost:1234/v1/models');
      if (response.ok) {
        const data = await response.json();
        return data.data.map((model: any) => ({
          provider: 'lmstudio' as const,
          model: model.id,
          endpoint: 'http://localhost:1234'
        }));
      }
    } catch {
      // LM Studio not running or not installed
    }
    return [];
  }

  /**
   * Route a task to the appropriate model
   */
  public async routeTask(
    task: string,
    context?: any
  ): Promise<{
    model: ModelConfig;
    reason: string;
    estimated_cost?: number;
  }> {
    // Find matching rule
    const rule = this.findMatchingRule(task);
    
    if (rule) {
      // Check if preferred model is available
      const isAvailable = this.isModelAvailable(rule.preferredModel);
      
      if (isAvailable) {
        return {
          model: rule.preferredModel,
          reason: `Matched rule: ${rule.taskType} - ${rule.description}`,
          estimated_cost: this.estimateCost(rule.preferredModel, task)
        };
      }
      
      // Try fallback if enabled
      if (this.config.enableFallback && rule.fallbackModel) {
        const fallbackAvailable = this.isModelAvailable(rule.fallbackModel);
        if (fallbackAvailable) {
          return {
            model: rule.fallbackModel,
            reason: `Using fallback for: ${rule.taskType}`,
            estimated_cost: this.estimateCost(rule.fallbackModel, task)
          };
        }
      }
    }
    
    // Use default model
    return {
      model: this.config.defaultModel,
      reason: 'Using default model',
      estimated_cost: this.estimateCost(this.config.defaultModel, task)
    };
  }

  /**
   * Find matching routing rule
   */
  private findMatchingRule(task: string): RoutingRule | undefined {
    const taskLower = task.toLowerCase();
    
    return this.config.rules.find(rule => 
      rule.patterns.some(pattern => 
        taskLower.includes(pattern.toLowerCase())
      )
    );
  }

  /**
   * Check if model is available
   */
  private isModelAvailable(model: ModelConfig): boolean {
    const providerModels = this.availableModels.get(model.provider);
    if (!providerModels) return false;
    
    return providerModels.some(m => 
      m.model === model.model || 
      m.model.includes(model.model)
    );
  }

  /**
   * Estimate cost for a task
   */
  private estimateCost(model: ModelConfig, task: string): number {
    const tokenCount = task.length / 4; // Rough estimate
    
    const costs: Record<string, number> = {
      'claude-3-opus': 0.015,
      'claude-3-sonnet': 0.003,
      'gpt-4-turbo': 0.01,
      'gpt-3.5-turbo': 0.001,
      'ollama': 0, // Local models are free
      'lmstudio': 0 // Local models are free
    };
    
    const modelKey = model.provider === 'ollama' || model.provider === 'lmstudio' 
      ? model.provider 
      : model.model.split('-').slice(0, 3).join('-');
    
    return (costs[modelKey] || 0.001) * tokenCount / 1000;
  }

  /**
   * Configure routing rules via command
   */
  public async configureRouting(updates: Partial<RouterConfig>): Promise<void> {
    this.config = { ...this.config, ...updates };
    this.saveConfig(this.config);
    console.log('✅ Model routing configuration updated');
  }

  /**
   * Add custom routing rule
   */
  public addRoutingRule(rule: RoutingRule): void {
    this.config.rules.push(rule);
    this.saveConfig(this.config);
    console.log(`✅ Added routing rule for ${rule.taskType}`);
  }

  /**
   * Get available models for display
   */
  public getAvailableModels(): Map<string, ModelConfig[]> {
    return this.availableModels;
  }

  /**
   * Get current configuration
   */
  public getConfig(): RouterConfig {
    return this.config;
  }

  /**
   * Test model routing
   */
  public async testRouting(): Promise<void> {
    console.log('\n🧪 Testing Smart Model Routing...\n');
    
    const testTasks = [
      'create a new React component with TypeScript',
      'review this code for security issues',
      'document the API endpoints',
      'write jest tests for the service',
      'design a modern dashboard UI'
    ];
    
    for (const task of testTasks) {
      const result = await this.routeTask(task);
      console.log(`Task: "${task.substring(0, 50)}..."`);
      console.log(`  → Model: ${result.model.provider}/${result.model.model}`);
      console.log(`  → Reason: ${result.reason}`);
      if (result.estimated_cost) {
        console.log(`  → Est. Cost: $${result.estimated_cost.toFixed(4)}`);
      }
      console.log();
    }
  }

  /**
   * Setup Ollama if not installed
   */
  public async setupOllama(): Promise<boolean> {
    console.log('🔧 Checking Ollama installation...');
    
    try {
      execFileSync('ollama', ['--version'], { stdio: 'ignore' });
      console.log('✅ Ollama is already installed');
      
      // Pull default models if none exist
      const models = await this.discoverOllamaModels();
      if (models.length === 0) {
        console.log('📦 Pulling default Ollama models...');
        execFileSync('ollama', ['pull', 'llama2:7b'], { stdio: 'inherit' });
        execFileSync('ollama', ['pull', 'codellama:7b'], { stdio: 'inherit' });
        execFileSync('ollama', ['pull', 'mistral:latest'], { stdio: 'inherit' });
      }
      
      return true;
    } catch {
      console.log('❌ Ollama not found. Please install from https://ollama.ai');
      return false;
    }
  }

  /**
   * Setup LM Studio if not installed
   */
  public async setupLMStudio(): Promise<boolean> {
    console.log('🔧 Checking LM Studio...');
    
    try {
      const response = await fetch('http://localhost:1234/v1/models');
      if (response.ok) {
        console.log('✅ LM Studio is running');
        return true;
      }
    } catch {
      console.log('⚠️ LM Studio not running. Please start LM Studio and load a model');
      console.log('  Download from: https://lmstudio.ai');
      console.log('  1. Start LM Studio');
      console.log('  2. Download and load a model');
      console.log('  3. Start the local server (port 1234)');
    }
    return false;
  }
}