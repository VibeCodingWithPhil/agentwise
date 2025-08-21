# Getting Started with Agentwise

## Prerequisites

Before installing Agentwise, ensure you have:

1. **Claude Code CLI** installed and configured
   ```bash
   # Install Claude Code (if not already installed)
   # Visit: https://docs.anthropic.com/en/docs/claude-code
   ```

2. **Node.js 18+** and npm
   ```bash
   node --version  # Should be 18.0.0 or higher
   npm --version   # Should be 8.0.0 or higher
   ```

3. **Git** for version control
   ```bash
   git --version
   ```

## Installation

### Method 1: Global Installation (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/agentwise.git
cd agentwise

# Install dependencies
npm install

# Build the project
npm run build

# Link globally
npm link
```

### Method 2: Local Installation

```bash
# Clone to your preferred location
git clone https://github.com/yourusername/agentwise.git ~/agentwise

# Install dependencies
cd ~/agentwise
npm install

# Build
npm run build
```

## Configuration

### 1. Set up Claude Code Integration

Agentwise integrates directly with Claude Code. The agents and commands are automatically available after installation.

```bash
# Verify Claude Code is accessible
claude --version

# Check Agentwise agents are loaded
ls ~/.claude/agents/
```

### 2. Configure Environment Variables

Create a `.env` file in the Agentwise root directory:

```env
# Claude Configuration
CLAUDE_API_KEY=your_api_key_here

# Project Defaults
DEFAULT_WORKSPACE_PATH=~/agentwise-projects
MAX_PARALLEL_AGENTS=5

# Monitoring
ENABLE_DASHBOARD=true
DASHBOARD_PORT=3001
```

### 3. Initialize Agentwise

```bash
# Run initial setup
npm run setup

# This will:
# - Create workspace directory
# - Initialize project registry
# - Set up monitoring
# - Verify Claude Code integration
```

## Your First Project

### Creating a New Project

1. **Simple Creation**
   ```bash
   /create "Build a task management app with React and Express"
   ```

2. **With Collaborative Planning**
   ```bash
   /create-plan "Build a real-time chat application with video calling"
   ```

### Working with Projects

```bash
# List all projects
/projects

# Switch active project
/projects  # Then select from list

# Add feature to active project
/task "Add dark mode support"

# Add feature with planning
/task-plan "Implement payment processing with Stripe"
```

### Importing Existing Projects

```bash
# Initialize import (opens file browser)
/init-import

# Execute import with analysis
/task-import
```

## Monitoring Progress

### Real-time Dashboard

```bash
# Launch monitoring dashboard
/monitor

# Or monitor specific project
/monitor my-project
```

Dashboard shows:
- Overall progress
- Phase status
- Agent activity
- Active tasks
- Token usage
- Live logs

### Keyboard Shortcuts

- `q` or `ESC`: Quit dashboard
- `↑/↓`: Scroll logs
- `r`: Refresh display

## Project Structure

After creating a project, you'll find:

```
workspace/
└── your-project/
    ├── main-spec.md           # Project vision
    ├── project-spec.md        # Technical specs
    ├── todo-spec.md          # Task breakdown
    ├── project-context.md    # Continuity file
    ├── agent-todo/          # Agent-specific tasks
    │   ├── frontend/
    │   ├── backend/
    │   ├── database/
    │   ├── devops/
    │   └── testing/
    └── .deploy/             # Deployment configs
```

## Common Workflows

### 1. Full-Stack Web Application

```bash
# Create with planning
/create-plan "E-commerce platform with admin dashboard"

# Agents automatically:
# - Design database schema
# - Create API endpoints
# - Build UI components
# - Set up authentication
# - Configure deployment
```

### 2. Adding Features

```bash
# Simple feature
/task "Add search functionality"

# Complex feature with planning
/task-plan "Implement real-time notifications"
```

### 3. Deployment

```bash
# Deploy to staging
/deploy staging

# Deploy to production
/deploy production

# Rollback if needed
/rollback
```

## Next Steps

- Read the [Architecture Guide](./architecture.md) to understand the system
- Explore [Commands Reference](./commands.md) for all available commands
- Learn about [Custom Agents](./custom-agents.md)
- Set up [CI/CD Integration](./ci-cd-integration.md)

## Getting Help

- Check [Troubleshooting Guide](./troubleshooting.md)
- Join our [Discord Community](https://discord.gg/agentwise)
- Report issues on [GitHub](https://github.com/yourusername/agentwise/issues)