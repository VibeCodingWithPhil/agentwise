# 🚀 Agentwise Quick Start Guide

## Prerequisites

Before installing Agentwise, ensure you have:

### 1. **Node.js 18+** 
```bash
# Check your version
node --version  # Should show v18.0.0 or higher

# If not installed, download from:
# https://nodejs.org/en/download/
```

### 2. **Claude Code CLI** (REQUIRED)
```bash
# Install Claude Code from:
# https://docs.anthropic.com/en/docs/claude-code

# Verify installation
claude --version
```

### 3. **Git** 
```bash
# Check if installed
git --version
```

## ⚠️ CRITICAL: Claude Code Flag Requirement

**Agentwise REQUIRES Claude Code to be started with the `--dangerously-skip-permissions` flag:**

```bash
# ALWAYS start Claude Code like this:
claude --dangerously-skip-permissions

# NOT like this:
claude  # ❌ Will NOT work with Agentwise
```

### Why this flag is required:
- ✅ Enables file system operations for agents
- ✅ Allows monitor dashboard to access project files
- ✅ Permits global command installation
- ✅ Required for agent parallel execution

### Security Note:
This flag reduces Claude Code's security restrictions. Only use with trusted projects in secure environments.

## Installation Options

### Option 1: Quick Install (Recommended)

#### macOS/Linux:
```bash
# Clone the repository
git clone https://github.com/VibeCodingWithPhil/agentwise.git
cd agentwise

# Install dependencies
npm install

# Build the project
npm run build

# Start with Claude Code (with required flag!)
claude --dangerously-skip-permissions
```

#### Windows (Use WSL):
```powershell
# In WSL terminal:
git clone https://github.com/VibeCodingWithPhil/agentwise.git
cd agentwise
npm install
npm run build

# Start Claude Code with flag
claude --dangerously-skip-permissions
```

### Option 2: Using Installer Scripts

⚠️ **Note**: Installer scripts may have issues. Manual installation (Option 1) is more reliable.

```bash
# Download installer from releases
curl -O https://github.com/VibeCodingWithPhil/agentwise/releases/latest/download/install-macos.sh

# Make executable
chmod +x install-macos.sh

# Run installer
./install-macos.sh
```

## First Steps After Installation

### 1. Verify Installation
```bash
# In Claude Code (with --dangerously-skip-permissions flag):
/help

# You should see Agentwise commands listed
```

### 2. Install Monitor Dashboard Dependencies
```bash
# IMPORTANT: Do this before first use
cd src/monitor
npm install
cd ../..
```

### 3. Install Global Monitor Command
```bash
# In Claude Code:
/monitor install

# Or:
/monitor global

# This allows you to run 'agentwise-monitor' from anywhere
```

### 4. Test Monitor Dashboard
```bash
# Start the monitor
/monitor

# Should open browser at http://localhost:3001
# If it closes immediately, you forgot to install dependencies (Step 2)
```

## Creating Your First Project

### Step 1: Start Claude Code with Required Flag
```bash
claude --dangerously-skip-permissions
```

### Step 2: Create a Project
```bash
/create "a todo app with React and Firebase"
```

### What happens:
1. Agentwise analyzes your request
2. Selects appropriate specialist agents
3. Creates agent-todo folders with tasks
4. Agents work in PARALLEL (not sequentially)
5. Monitor dashboard shows real-time progress

### Step 3: Monitor Progress
```bash
# Open monitor dashboard
/monitor

# Or if global command installed:
agentwise-monitor
```

## Importing Existing Projects

### Step 1: Initialize Import
```bash
/init-import

# A file dialog will open
# Select your project folder
```

### Step 2: Execute Import
```bash
/task-import

# This will:
# - Copy project to workspace/
# - Create agent-todo folders
# - Generate analysis tasks
# - Launch agents in parallel
```

### Common Import Issues:
- ❌ No agent-todo folders created → Use the new ImportHandler (fixed in latest version)
- ❌ Agents work sequentially → Ensure using latest version with parallel execution
- ❌ Monitor shows no tasks → Check agent-todo folders exist in workspace/[project]/

## Common Problems & Solutions

### Problem: "Command not found: claude"
**Solution**: Install Claude Code from https://docs.anthropic.com/en/docs/claude-code

### Problem: Monitor closes immediately
**Solution**: 
```bash
cd src/monitor
npm install
cd ../..
/monitor
```

### Problem: "Permission denied" errors
**Solution**: Ensure Claude Code started with `--dangerously-skip-permissions` flag

### Problem: No agent-todo folders for imported projects
**Solution**: Update to latest version or manually create:
```bash
cd workspace/[project-name]
mkdir -p agent-todo/frontend-specialist
mkdir -p agent-todo/backend-specialist
# etc for each needed agent
```

### Problem: Agents not working in parallel
**Solution**: Check you're using latest version with ImportHandler fix

### Problem: "/monitor global" not working
**Solution**: Use `/monitor install` instead (both work now)

## Token Usage Information

### Actual Token Savings: 30-40%
- **NOT 99%** as previously claimed
- Realistic reduction through context sharing
- Savings increase with more agents
- Benchmark verified: 29-41% reduction

### How Optimization Works:
1. Context sharing between agents
2. Incremental updates instead of full context
3. Response caching for similar queries
4. Intelligent batching of requests

## Project Structure After Creation

```
workspace/
└── your-project/
    ├── agent-todo/           # Tasks for each agent
    │   ├── frontend-specialist/
    │   │   ├── phase1.md    # Analysis tasks
    │   │   ├── phase2.md    # Implementation
    │   │   └── phase3.md    # Testing
    │   ├── backend-specialist/
    │   └── [other-agents]/
    ├── src/                  # Your project code
    ├── package.json
    └── project-context.md    # Project overview
```

## Available Commands

### Core Commands
- `/create <idea>` - Create new project
- `/task <feature>` - Add feature to active project
- `/projects` - List and switch projects
- `/monitor` - Open monitoring dashboard

### Import Commands  
- `/init-import` - Select project to import
- `/task-import` - Execute import with agents

### Utility Commands
- `/monitor install` - Install global monitor command
- `/monitor status` - Check monitor installation
- `/docs` - Open documentation
- `/help` - Show all commands

## Best Practices

1. **Always use the --dangerously-skip-permissions flag**
2. **Install monitor dependencies before first use**
3. **Let agents work in parallel - don't interrupt**
4. **Use monitor dashboard to track progress**
5. **Check agent-todo folders if tasks aren't showing**

## Getting Help

### Documentation
- Local: `/docs` command
- Online: https://vibecodingwithphil.github.io/agentwise/

### Support
- Issues: https://github.com/VibeCodingWithPhil/agentwise/issues
- Ensure you've followed ALL steps above before reporting issues

## Next Steps

1. Create a test project to familiarize yourself
2. Import an existing project to see analysis
3. Explore the monitor dashboard features
4. Read full documentation at `/docs`

Remember: **ALWAYS start Claude Code with `--dangerously-skip-permissions` flag!**