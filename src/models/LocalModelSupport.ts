import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

// Use fetch instead of axios to avoid dependency
const fetch = globalThis.fetch || require('node-fetch');

const execAsync = promisify(exec);

export interface LocalModelProvider {
  name: 'ollama' | 'lm-studio' | 'openrouter';
  baseUrl: string;
  apiKey?: string;
  models: string[];
  status: 'connected' | 'disconnected' | 'error';
  capabilities: string[];
}

export interface ModelConfig {
  provider: LocalModelProvider['name'];
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  systemPrompt?: string;
}

export interface ModelResponse {
  text: string;
  tokensUsed: number;
  latency: number;
  provider: string;
  model: string;
}

export class LocalModelSupport {
  private providers: Map<string, LocalModelProvider>;
  private activeProvider: LocalModelProvider | null;
  private configPath: string;
  private testResults: Map<string, any>;
  
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    this.configPath = path.join(process.cwd(), 'config', 'local-models.json');
    this.testResults = new Map();
    
    this.initializeProviders();
  }

  private async initializeProviders(): Promise<void> {
    // Ollama configuration
    this.providers.set('ollama', {
      name: 'ollama',
      baseUrl: 'http://localhost:11434',
      models: [],
      status: 'disconnected',
      capabilities: [
        'text-generation',
        'code-generation',
        'embeddings',
        'streaming',
        'custom-models'
      ]
    });
    
    // LM Studio configuration
    this.providers.set('lm-studio', {
      name: 'lm-studio',
      baseUrl: 'http://localhost:1234/v1',
      models: [],
      status: 'disconnected',
      capabilities: [
        'text-generation',
        'code-generation',
        'openai-compatible',
        'gpu-acceleration',
        'model-management'
      ]
    });
    
    // OpenRouter configuration
    this.providers.set('openrouter', {
      name: 'openrouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY,
      models: [],
      status: 'disconnected',
      capabilities: [
        'text-generation',
        'code-generation',
        'multiple-providers',
        'model-routing',
        'usage-tracking'
      ]
    });
    
    await this.loadConfiguration();
  }

  private async loadConfiguration(): Promise<void> {
    try {
      if (await fs.pathExists(this.configPath)) {
        const config = await fs.readJson(this.configPath);
        
        // Update providers with saved configuration
        for (const [name, providerConfig] of Object.entries(config.providers || {})) {
          const provider = this.providers.get(name);
          if (provider) {
            Object.assign(provider, providerConfig);
          }
        }
        
        console.log('📋 Loaded local model configuration');
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
    }
  }

  private async saveConfiguration(): Promise<void> {
    try {
      await fs.ensureDir(path.dirname(this.configPath));
      
      const config = {
        providers: Object.fromEntries(this.providers),
        activeProvider: this.activeProvider?.name,
        lastUpdated: new Date()
      };
      
      await fs.writeJson(this.configPath, config, { spaces: 2 });
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  }

  /**
   * Test Ollama connectivity and capabilities
   */
  async testOllama(): Promise<boolean> {
    console.log('🔍 Testing Ollama connectivity...');
    
    const provider = this.providers.get('ollama')!;
    
    try {
      // Check if Ollama is installed
      const { stdout: version } = await execAsync('ollama --version');
      console.log(`  ✅ Ollama installed: ${version.trim()}`);
      
      // Check if Ollama is running
      const response = await fetch(`${provider.baseUrl}/api/tags`);
      const data = await response.json();
      
      if (response.ok) {
        provider.status = 'connected';
        provider.models = data.models?.map((m: any) => m.name) || [];
        
        console.log(`  ✅ Ollama running with ${provider.models.length} models`);
        
        // Test model inference
        if (provider.models.length > 0) {
          const testResult = await this.testModelInference('ollama', provider.models[0]);
          this.testResults.set('ollama', testResult);
          
          if (testResult.success) {
            console.log(`  ✅ Model inference successful (${testResult.latency}ms)`);
            return true;
          }
        } else {
          console.log('  ⚠️  No models available. Run: ollama pull llama2');
        }
      }
    } catch (error: any) {
      provider.status = 'error';
      
      if (error.code === 'ECONNREFUSED') {
        console.log('  ❌ Ollama not running. Start with: ollama serve');
      } else if (error.code === 'ENOENT') {
        console.log('  ❌ Ollama not installed. Visit: https://ollama.ai');
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    
    await this.saveConfiguration();
    return false;
  }

  /**
   * Test LM Studio connectivity and capabilities
   */
  async testLMStudio(): Promise<boolean> {
    console.log('🔍 Testing LM Studio connectivity...');
    
    const provider = this.providers.get('lm-studio')!;
    
    try {
      // Check if LM Studio server is running
      const response = await fetch(`${provider.baseUrl}/models`);
      const data = await response.json();
      
      if (response.ok) {
        provider.status = 'connected';
        provider.models = data.data?.map((m: any) => m.id) || [];
        
        console.log(`  ✅ LM Studio running with ${provider.models.length} models`);
        
        // Test OpenAI-compatible endpoint
        if (provider.models.length > 0) {
          const testResult = await this.testModelInference('lm-studio', provider.models[0]);
          this.testResults.set('lm-studio', testResult);
          
          if (testResult.success) {
            console.log(`  ✅ Model inference successful (${testResult.latency}ms)`);
            return true;
          }
        } else {
          console.log('  ⚠️  No models loaded in LM Studio');
        }
      }
    } catch (error: any) {
      provider.status = 'error';
      
      if (error.code === 'ECONNREFUSED') {
        console.log('  ❌ LM Studio server not running');
        console.log('  💡 Start server in LM Studio: Settings → Local Server → Start');
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    
    await this.saveConfiguration();
    return false;
  }

  /**
   * Test OpenRouter connectivity
   */
  async testOpenRouter(): Promise<boolean> {
    console.log('🔍 Testing OpenRouter connectivity...');
    
    const provider = this.providers.get('openrouter')!;
    
    if (!provider.apiKey) {
      console.log('  ❌ OpenRouter API key not set');
      console.log('  💡 Set OPENROUTER_API_KEY environment variable');
      provider.status = 'error';
      return false;
    }
    
    try {
      // Get available models
      const response = await fetch(`${provider.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${provider.apiKey}`,
          'X-Title': 'Agentwise'
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        provider.status = 'connected';
        provider.models = data.data?.map((m: any) => m.id) || [];
        
        console.log(`  ✅ OpenRouter connected with ${provider.models.length} models`);
        
        // Test with a small model
        const testModel = provider.models.find(m => m.includes('tinyllama')) || provider.models[0];
        
        if (testModel) {
          const testResult = await this.testModelInference('openrouter', testModel);
          this.testResults.set('openrouter', testResult);
          
          if (testResult.success) {
            console.log(`  ✅ Model inference successful (${testResult.latency}ms)`);
            return true;
          }
        }
      }
    } catch (error: any) {
      provider.status = 'error';
      
      if ((error as any).status === 401) {
        console.log('  ❌ Invalid API key');
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    
    await this.saveConfiguration();
    return false;
  }

  /**
   * Test model inference
   */
  private async testModelInference(
    providerName: string,
    modelName: string
  ): Promise<any> {
    const provider = this.providers.get(providerName)!;
    const startTime = Date.now();
    
    try {
      let response;
      const testPrompt = 'Write a simple hello world function in Python';
      
      switch (providerName) {
        case 'ollama':
          response = await fetch(`${provider.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: modelName,
              prompt: testPrompt,
              stream: false
            })
          });
          const ollamaData = await response.json();
          
          return {
            success: true,
            response: ollamaData.response,
            latency: Date.now() - startTime,
            tokensUsed: ollamaData.total_tokens || 0
          };
          
        case 'lm-studio':
          response = await fetch(`${provider.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'user', content: testPrompt }
              ],
              temperature: 0.7,
              max_tokens: 100
            })
          });
          const lmData = await response.json();
          
          return {
            success: true,
            response: lmData.choices[0].message.content,
            latency: Date.now() - startTime,
            tokensUsed: lmData.usage?.total_tokens || 0
          };
          
        case 'openrouter':
          response = await fetch(`${provider.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${provider.apiKey}`,
              'X-Title': 'Agentwise'
            },
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: 'user', content: testPrompt }
              ],
              temperature: 0.7,
              max_tokens: 100
            })
          });
          const orData = await response.json();
          
          return {
            success: true,
            response: orData.choices[0].message.content,
            latency: Date.now() - startTime,
            tokensUsed: orData.usage?.total_tokens || 0
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime
      };
    }
  }

  /**
   * Run comprehensive local model tests
   */
  async runComprehensiveTests(): Promise<any> {
    console.log('\n🧪 Running Comprehensive Local Model Tests\n');
    
    const results = {
      ollama: await this.testOllama(),
      lmStudio: await this.testLMStudio(),
      openRouter: await this.testOpenRouter(),
      recommendations: [] as string[]
    };
    
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    
    // Analyze results
    const connectedProviders = Array.from(this.providers.values())
      .filter(p => p.status === 'connected');
    
    console.log(`✅ Connected providers: ${connectedProviders.length}/3`);
    
    if (connectedProviders.length === 0) {
      results.recommendations.push('Install Ollama for free local model support');
      results.recommendations.push('Or set up OpenRouter API key for cloud models');
    } else {
      for (const provider of connectedProviders) {
        console.log(`  - ${provider.name}: ${provider.models.length} models available`);
      }
    }
    
    // Performance comparison
    if (this.testResults.size > 0) {
      console.log('\n⚡ Performance Comparison:');
      for (const [name, result] of this.testResults) {
        if (result.success) {
          console.log(`  ${name}: ${result.latency}ms latency, ${result.tokensUsed} tokens`);
        }
      }
    }
    
    return results;
  }

  /**
   * Generate completion using local model
   */
  async generateCompletion(
    prompt: string,
    config: ModelConfig
  ): Promise<ModelResponse> {
    const provider = this.providers.get(config.provider);
    
    if (!provider || provider.status !== 'connected') {
      throw new Error(`Provider ${config.provider} not connected`);
    }
    
    const startTime = Date.now();
    
    try {
      let response;
      
      switch (config.provider) {
        case 'ollama': {
          const requestResponse = await fetch(`${provider.baseUrl}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
            model: config.model,
            prompt: config.systemPrompt ? `${config.systemPrompt}\n\n${prompt}` : prompt,
            stream: false,
              options: {
                temperature: config.temperature,
                top_p: config.topP,
                num_predict: config.maxTokens
              }
            })
          });
          response = { data: await requestResponse.json() };
          
          return {
            text: response.data.response,
            tokensUsed: response.data.total_tokens || 0,
            latency: Date.now() - startTime,
            provider: config.provider,
            model: config.model
          };
        }
          
        case 'lm-studio':
        case 'openrouter': {
          const messages = config.systemPrompt
            ? [
                { role: 'system', content: config.systemPrompt },
                { role: 'user', content: prompt }
              ]
            : [{ role: 'user', content: prompt }];
          
          const requestBody = {
            model: config.model,
            messages,
            temperature: config.temperature || 0.7,
            max_tokens: config.maxTokens || 1000,
            top_p: config.topP || 1,
            frequency_penalty: config.frequencyPenalty || 0,
            presence_penalty: config.presencePenalty || 0
          };
          
          const headers = config.provider === 'openrouter'
            ? {
                'Authorization': `Bearer ${provider.apiKey}`,
                'X-Title': 'Agentwise'
              }
            : {};
          
          const requestResponse = await fetch(
            `${provider.baseUrl}/chat/completions`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', ...headers },
              body: JSON.stringify(requestBody)
            }
          );
          response = { data: await requestResponse.json() };
          
          return {
            text: response.data.choices[0].message.content,
            tokensUsed: response.data.usage?.total_tokens || 0,
            latency: Date.now() - startTime,
            provider: config.provider,
            model: config.model
          };
        }
          
        default:
          throw new Error(`Unsupported provider: ${config.provider}`);
      }
    } catch (error: any) {
      throw new Error(`Model generation failed: ${error.message}`);
    }
  }

  /**
   * Get available models for a provider
   */
  async getAvailableModels(providerName: string): Promise<string[]> {
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    
    if (provider.status !== 'connected') {
      // Try to connect
      switch (providerName) {
        case 'ollama':
          await this.testOllama();
          break;
        case 'lm-studio':
          await this.testLMStudio();
          break;
        case 'openrouter':
          await this.testOpenRouter();
          break;
      }
    }
    
    return provider.models;
  }

  /**
   * Set active provider
   */
  setActiveProvider(providerName: string): void {
    const provider = this.providers.get(providerName);
    
    if (!provider) {
      throw new Error(`Unknown provider: ${providerName}`);
    }
    
    if (provider.status !== 'connected') {
      throw new Error(`Provider ${providerName} not connected`);
    }
    
    this.activeProvider = provider;
    this.saveConfiguration();
  }

  /**
   * Get provider status
   */
  getProviderStatus(): Map<string, LocalModelProvider> {
    return this.providers;
  }

  /**
   * Generate setup instructions
   */
  generateSetupInstructions(): string {
    const instructions: string[] = [
      '# Local Model Setup Instructions\n'
    ];
    
    // Ollama instructions
    instructions.push('## Ollama (Recommended for local models)');
    instructions.push('1. Install Ollama: https://ollama.ai');
    instructions.push('2. Pull a model: `ollama pull llama2` or `ollama pull codellama`');
    instructions.push('3. Start server: `ollama serve`');
    instructions.push('4. Test connection: This system will auto-detect\n');
    
    // LM Studio instructions
    instructions.push('## LM Studio (GUI for local models)');
    instructions.push('1. Download LM Studio: https://lmstudio.ai');
    instructions.push('2. Download a model from the app');
    instructions.push('3. Start local server: Settings → Local Server → Start');
    instructions.push('4. Default port: 1234\n');
    
    // OpenRouter instructions
    instructions.push('## OpenRouter (Cloud models with unified API)');
    instructions.push('1. Sign up: https://openrouter.ai');
    instructions.push('2. Get API key from dashboard');
    instructions.push('3. Set environment variable: `export OPENROUTER_API_KEY=your-key`');
    instructions.push('4. Supports Claude, GPT-4, and many other models\n');
    
    // Usage with Claude Code
    instructions.push('## Using with Agentwise');
    instructions.push('Once configured, agents can use local models with:');
    instructions.push('`claude --dangerously-skip-permissions`');
    instructions.push('This allows continuous work without API limits\n');
    
    return instructions.join('\n');
  }
}