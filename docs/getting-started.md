# Getting Started with Agentwise

## Prerequisites

Before installing Agentwise, ensure you have:

### 1. **Node.js 18+** (REQUIRED)
```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 8.0.0 or higher
```
If not installed, download from: https://nodejs.org

### 2. **Claude Code CLI** (REQUIRED)
```bash
# Check if installed
claude --version

# If not installed, get it from:
# https://docs.anthropic.com/en/docs/claude-code
```

### 3. **Git** (REQUIRED)
```bash
git --version
```
If not installed, download from: https://git-scm.com

## ⚠️ CRITICAL REQUIREMENT

**Agentwise REQUIRES Claude Code to be started with a special flag:**

```bash
# ALWAYS start Claude Code like this:
claude --dangerously-skip-permissions

# NOT like this:
claude  # ❌ Will NOT work properly
```

This flag is required for:
- File system operations
- Monitor dashboard functionality
- Agent parallel execution
- Global command installation

## Installation

### Quick Install (Recommended)

#### macOS/Linux:
```bash
# Download and run installer
curl -fsSL https://raw.githubusercontent.com/VibeCodingWithPhil/agentwise/main/installers/install.sh | bash
```

#### Windows (PowerShell as Administrator):
```powershell
# Download and run installer
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/VibeCodingWithPhil/agentwise/main/installers/install.ps1" -OutFile "install.ps1"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\install.ps1
```

### Manual Installation

If the installers don't work, use manual installation:

```bash
# 1. Clone the repository
git clone https://github.com/VibeCodingWithPhil/agentwise.git
cd agentwise

# 2. Install dependencies
npm install

# 3. Build the project (ignore TypeScript errors)
npm run build 2>/dev/null || true

# 4. Install monitor dependencies
cd src/monitor
npm install
cd ../..

# 5. Start Claude Code with required flag
claude --dangerously-skip-permissions
```

## First Steps

### 1. Start Claude Code Correctly
```bash
# IMPORTANT: Always use this flag!
claude --dangerously-skip-permissions
```

### 2. Verify Installation
In Claude Code, type:
```bash
/help
```
You should see Agentwise commands listed.

### 3. Test Monitor Dashboard
```bash
# Start the monitor
/monitor

# This will:
# - Auto-install global command if needed
# - Install dependencies if needed
# - Open dashboard at http://localhost:3001
```

### 4. Create Your First Project
```bash
/create "a todo app with React and Firebase"
```

### 5. Import Existing Project
```bash
# Step 1: Select project
/init-import

# Step 2: Import with agents
/task-import
```

## Project Structure

After creating a project, you'll have:

```
workspace/
└── your-project/
    ├── agent-todo/          # Agent task files
    │   ├── frontend-specialist/
    │   │   ├── phase1.md   # Analysis
    │   │   ├── phase2.md   # Implementation
    │   │   └── phase3.md   # Testing
    │   └── [other-agents]/
    ├── src/                 # Your code
    └── project-context.md   # Project overview
```

## Available Commands

### Core Commands
- `/create "description"` - Create new project
- `/task "feature"` - Add feature to active project
- `/projects` - List and switch projects
- `/monitor` - Open monitoring dashboard

### Import Commands
- `/init-import` - Select project to import
- `/task-import` - Execute import with agents

### Advanced Commands
- `/generate-agent "spec"` - Create custom agent
- `/figma` - Figma integration
- `/upload` - Upload documents
- `/clone-website` - Clone websites
- `/resume` - Resume after restart

## Common Issues & Solutions

### "Command not found: claude"
Install Claude Code from: https://docs.anthropic.com/en/docs/claude-code

### Monitor closes immediately
```bash
cd src/monitor
npm install
cd ../..
/monitor
```

### "Permission denied" errors
Ensure Claude Code started with: `claude --dangerously-skip-permissions`

### No agent-todo folders created
Update to latest version and use `/init-import` + `/task-import`

### Agents not working in parallel
Check agent-todo folders exist in workspace/[project]/

## Token Optimization

Agentwise achieves **30-40% token reduction** (verified by benchmarks) through:
- Context sharing between agents
- Incremental updates
- Response caching
- Intelligent batching

**Note**: Previous claims of 99% reduction were inaccurate and have been corrected.

## Getting Help

- **Documentation**: `/docs` or https://vibecodingwithphil.github.io/agentwise/
- **Issues**: https://github.com/VibeCodingWithPhil/agentwise/issues
- **Quick Start Guide**: `/help`

## Next Steps

1. Create a test project to learn the workflow
2. Explore the monitor dashboard
3. Try importing an existing project
4. Read the full documentation with `/docs`

Remember: **ALWAYS start Claude Code with `--dangerously-skip-permissions`!**