# Smart Model Routing

Agentwise includes intelligent model routing that automatically selects the best AI model for each task, optimizing for both cost and performance.

## Overview

Smart Model Routing allows you to:
- Use Claude for complex reasoning tasks
- Leverage local models (Ollama, LM Studio) for simple tasks
- Route to OpenRouter for cost-effective cloud processing
- Automatically fall back to alternative models if preferred ones are unavailable

## Supported Providers

### Claude (Default)
- **Models**: Opus, Sonnet
- **Best for**: Complex code generation, architecture decisions, debugging
- **Cost**: Premium (API-based)

### Ollama (Local)
- **Models**: Llama2, CodeLlama, Mistral, and more
- **Best for**: Documentation, simple code, testing
- **Cost**: Free (runs locally)

### LM Studio (Local)
- **Models**: Any GGUF model
- **Best for**: Specialized tasks, custom models
- **Cost**: Free (runs locally)

### OpenRouter (Cloud)
- **Models**: GPT-4, GPT-3.5, Mistral, Llama, and more
- **Best for**: Cost-effective cloud processing
- **Cost**: Variable (pay-per-use)

## Setup

### 1. Setup Ollama

```bash
# Install Ollama from https://ollama.ai
# Then run:
/setup-ollama
```

This will:
- Check if Ollama is installed
- Pull default models (llama2, codellama, mistral)
- Configure routing for local model usage

### 2. Setup LM Studio

```bash
# Install LM Studio from https://lmstudio.ai
# Start LM Studio and load a model
# Start the local server on port 1234
# Then run:
/setup-lmstudio
```

### 3. Configure OpenRouter

```bash
# Set your API key
export OPENROUTER_API_KEY=your-key-here

# Models will be automatically available
```

## Commands

### List Available Models

```bash
/local-models
```

Shows all discovered local models and current routing configuration.

### Configure Routing

```bash
# Set specific model for task type
/configure-routing code-generation ollama codellama:34b

# Auto-optimize based on available models
/configure-routing optimize

# Test routing with sample tasks
/configure-routing test

# Show current configuration
/configure-routing show

# Reset to defaults
/configure-routing reset
```

## Task Types

The router recognizes these task types:

- **code-generation**: Creating new code
- **code-review**: Reviewing and analyzing code
- **documentation**: Writing docs and comments
- **testing**: Generating tests
- **ui-design**: UI/UX and styling
- **debugging**: Finding and fixing bugs
- **refactoring**: Improving code structure
- **planning**: Architecture and design decisions

## Default Routing Rules

```json
{
  "code-generation": "claude/opus → ollama/codellama",
  "code-review": "claude/sonnet → ollama/mistral",
  "documentation": "ollama/llama2",
  "testing": "lmstudio/local → openrouter/gpt-3.5",
  "ui-design": "claude/opus"
}
```

Arrow (→) indicates fallback model if primary is unavailable.

## Cost Optimization

The router automatically optimizes for cost:

1. **Local First**: Uses local models when appropriate
2. **Smart Fallback**: Falls back to cloud only when needed
3. **Task Analysis**: Routes complex tasks to powerful models
4. **Batch Processing**: Groups similar tasks for efficiency

## Configuration File

Settings are stored in `.agentwise-models.json`:

```json
{
  "rules": [
    {
      "taskType": "code-generation",
      "patterns": ["create", "implement", "write"],
      "preferredModel": {
        "provider": "claude",
        "model": "claude-3-opus-20240229"
      },
      "fallbackModel": {
        "provider": "ollama",
        "model": "codellama:34b"
      }
    }
  ],
  "defaultModel": {
    "provider": "claude",
    "model": "claude-3-sonnet-20240229"
  },
  "enableFallback": true,
  "costOptimization": true
}
```

## Best Practices

### 1. Install Local Models

For best cost optimization, install Ollama with these models:
- `codellama:34b` - Best for code generation
- `mistral:latest` - Good general purpose
- `llama2:13b` - Documentation and explanations

### 2. Configure Task Routing

Customize routing based on your needs:
```bash
# Use local models for documentation
/configure-routing documentation ollama llama2:13b

# Use GPT-3.5 for testing (cheaper than Claude)
/configure-routing testing openrouter gpt-3.5-turbo
```

### 3. Monitor Usage

Check which models are being used:
```bash
/configure-routing show
```

## Troubleshooting

### Ollama Not Found

If `/setup-ollama` fails:
1. Install Ollama from https://ollama.ai
2. Ensure `ollama` command is in PATH
3. Try `ollama --version` to verify

### LM Studio Not Connecting

If `/setup-lmstudio` fails:
1. Ensure LM Studio is running
2. Load a model in LM Studio
3. Start local server (Settings → Local Server)
4. Verify it's on port 1234

### Models Not Routing

If models aren't routing correctly:
1. Run `/local-models` to see available models
2. Check `.agentwise-models.json` for configuration
3. Run `/configure-routing test` to debug

## Performance Tips

1. **Large Models**: Use for complex tasks only
2. **Small Models**: Perfect for documentation, simple code
3. **Hybrid Strategy**: Mix local and cloud for optimal balance
4. **Context Caching**: Router caches contexts for efficiency

## Security Notes

- Local models never send data externally
- API keys are stored in environment variables
- Configuration files should not be committed to git
- Add `.agentwise-models.json` to `.gitignore`