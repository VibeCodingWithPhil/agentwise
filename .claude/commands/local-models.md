# Local Models Command

Display all available local models from Ollama and LM Studio.

## Usage
```
/local-models
```

## What it does
1. Discovers all Ollama models installed on your system
2. Checks for LM Studio models if server is running
3. Displays model information including:
   - Model name and size
   - Provider (Ollama/LM Studio)
   - Capabilities (code, chat, etc.)
   - Current routing assignments

## Output Example
```
🤖 Available Local Models:

Ollama Models:
  • llama2:7b (3.8GB) - General purpose
  • codellama:34b (19GB) - Code generation
  • mistral:latest (4.1GB) - Fast inference
  
LM Studio Models:
  • wizardcoder-15b (8.9GB) - Code specialist
  • phi-2 (1.6GB) - Small but capable

Current Routing:
  • Code Generation → codellama:34b (Ollama)
  • Documentation → llama2:7b (Ollama)
  • Testing → wizardcoder-15b (LM Studio)

Total Models: 5
Total Size: 37.4GB
```

## Related Commands
- `/setup-ollama` - Install and configure Ollama
- `/setup-lmstudio` - Configure LM Studio
- `/configure-routing` - Customize which models handle which tasks
- `/models` - Show Claude models (built-in command)