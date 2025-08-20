# Setup LM Studio Command

Setup and configure LM Studio for local model support in Agentwise.

## Usage
```
/setup-lmstudio
```

## What it does
1. Checks if LM Studio is running on the default port (1234)
2. Discovers available models loaded in LM Studio
3. Configures Agentwise to use LM Studio for appropriate tasks
4. Updates model routing configuration

## Requirements
- LM Studio must be installed from https://lmstudio.ai
- LM Studio must be running with:
  - At least one model loaded
  - Local server started on port 1234
- System requirements depend on model size (8GB+ RAM recommended)

## Setup Instructions
1. Download and install LM Studio from https://lmstudio.ai
2. Open LM Studio and download a model (e.g., Mistral 7B, Llama 2)
3. Load the model in LM Studio
4. Start the local server (Settings → Local Server → Start)
5. Run `/setup-lmstudio` in Agentwise

## Benefits
- Complete privacy - models run locally
- No API costs
- Fast inference for small to medium models
- Works offline once models are downloaded

## Post-Setup
After setup, you can:
- Use `/local-models` to see available models
- Use `/configure-routing` to customize model selection
- Models will be automatically used based on task type