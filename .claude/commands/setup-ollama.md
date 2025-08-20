# Setup Ollama Command

Setup and configure Ollama for local model support in Agentwise.

## Usage
```
/setup-ollama
```

## What it does
1. Checks if Ollama is installed on your system
2. If installed, discovers available models
3. If no models exist, pulls default models (llama2, codellama, mistral)
4. Configures Agentwise to use Ollama for appropriate tasks
5. Updates model routing configuration

## Requirements
- Ollama must be installed from https://ollama.ai
- System must have sufficient RAM (8GB+ recommended)
- Disk space for model storage (models range from 4GB to 40GB)

## Default Models Installed
- `llama2:7b` - General purpose language model
- `codellama:7b` - Specialized for code generation
- `mistral:latest` - Fast and efficient model

## Post-Setup
After setup, you can:
- Use `/local-models` to see available models
- Use `/configure-routing` to customize model selection
- Models will be automatically used based on task type