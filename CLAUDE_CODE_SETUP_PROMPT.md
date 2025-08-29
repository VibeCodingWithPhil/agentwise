# 🚀 Agentwise One-Click Setup Prompt for Claude Code

## Quick Setup (Copy & Paste into Claude Code)

Copy the entire prompt below and paste it into Claude Code for automatic setup:

```
I need you to set up Agentwise, a multi-agent orchestration system that enhances Claude Code with parallel agent execution, token optimization, and automatic permission handling.

Please perform the following setup steps:

## 1. Clone and Install Agentwise

```bash
# Clone the repository
git clone https://github.com/VibeCodingWithPhil/agentwise.git ~/agentwise
cd ~/agentwise

# Install dependencies
npm install

# Build the TypeScript project
npm run build

# Create the workspace directory
mkdir -p workspace
```

## 2. Set Up Global Monitor Command

```bash
# Install the monitor globally (works from any directory)
cd ~/agentwise
npm run monitor:install

# This enables the /monitor command globally in your system
```

## 3. Configure Agentwise for First Use

```bash
# Start Agentwise
node dist/index.js

# In a new terminal, test the installation
cd ~/agentwise
claude /projects
```

## 4. Configure Sandboxed Execution (Optional - No --dangerously-skip-permissions needed)

Create the configuration file at `~/agentwise/.agentwise-config.json`:

```json
{
  "version": "1.0.0",
  "permissions": {
    "bypassEnabled": true,
    "safetyMode": "moderate",
    "autoResponse": true,
    "restrictedCommands": []
  },
  "workspace": {
    "enableSandbox": true,
    "restrictPaths": true,
    "maxFileSize": 104857600,
    "allowedPaths": ["~/agentwise/workspace"],
    "deniedPaths": ["/etc", "/usr", "/bin", "/sbin"]
  },
  "monitoring": {
    "enableTerminalMonitoring": true,
    "verbosity": "normal",
    "logRetention": 7
  },
  "tokenOptimization": {
    "enabled": true,
    "maxAgents": 5,
    "contextWindow": 8000,
    "cacheEnabled": true,
    "compressionEnabled": false
  }
}
```

## 5. Test the Installation

```bash
# Test creating a project WITHOUT --dangerously-skip-permissions
cd ~/agentwise
claude /create "a simple todo app with React"

# Test the monitor dashboard
/monitor start

# Open browser to http://localhost:3001 to see the dashboard
```

## 6. Verify Everything is Working

Run these commands to verify:
```bash
# Check Agentwise is running
ps aux | grep "node.*agentwise"

# Check monitor is accessible globally
/monitor status

# Check SharedContextServer for token optimization
curl http://localhost:3003/health

# List available commands
claude /help
```

Please execute these steps and let me know when everything is set up successfully. The system will:
- Enable parallel agent execution for faster development
- Reduce token usage by 25-35% through context optimization
- Handle permissions automatically without the dangerous flag
- Provide real-time monitoring of all agent activities
- Create sandboxed workspaces for safe execution
```

## 📋 What This Setup Does

When you paste this prompt into Claude Code, it will:

### ✅ **Core Installation**
- Clones Agentwise from GitHub to `~/agentwise`
- Installs all npm dependencies
- Builds the TypeScript project
- Creates the workspace directory structure

### 🌍 **Global Commands**
- Installs `/monitor` command globally (accessible from anywhere)
- Enables monitor dashboard at http://localhost:3001
- Sets up real-time agent activity tracking

### 🔐 **Sandboxed Execution**
- Configures automatic permission handling
- No need for `--dangerously-skip-permissions` flag
- Restricts execution to safe workspace directories
- Auto-responds to permission prompts

### 💎 **Token Optimization**
- Starts SharedContextServer on port 3003
- Enables 25-35% token reduction
- Shares context between agents
- Tracks token usage metrics

### 🎯 **Multi-Agent System**
- 11+ specialized agents ready to use
- Parallel execution for faster development
- Smart task distribution
- Phase-based project management

## 🔧 Configuration Details

The setup creates a default configuration that:

| Setting | Value | Purpose |
|---------|-------|---------|
| **bypassEnabled** | true | Enables automatic permission handling |
| **safetyMode** | moderate | Balances automation with safety |
| **enableSandbox** | true | Restricts execution to workspace |
| **tokenOptimization** | enabled | Reduces API token usage |
| **maxAgents** | 5 | Limits concurrent agents |
| **contextWindow** | 8000 | Optimizes context size |

## 🚀 Quick Commands After Setup

Once installed, you can use:

```bash
# Create projects without flags
claude /create "your project idea"

# Monitor agent activity
/monitor start
/monitor status
/monitor stop

# Configure settings
claude /configure-agentwise

# List projects
claude /projects

# Add features to projects
claude /task "add dark mode"
```

## 🛡️ Security Features

The sandboxed execution ensures:
- **Workspace Isolation**: Code execution limited to `~/agentwise/workspace`
- **Path Restrictions**: System directories protected
- **Permission Control**: Dangerous operations require confirmation
- **Audit Logging**: All permissions tracked

## 📊 Monitoring Dashboard

Access the monitoring dashboard at http://localhost:3001 to see:
- Real-time agent activity
- Token usage metrics
- Task progress tracking
- System performance stats
- Error logs and debugging

## 🔍 Troubleshooting

If you encounter issues:

```bash
# Check if Agentwise is running
ps aux | grep agentwise

# View logs
tail -f ~/agentwise/logs/agentwise.log

# Restart services
cd ~/agentwise
npm run restart

# Reset configuration
claude /configure-agentwise reset
```

## 📚 Additional Resources

- **Documentation**: https://agentwise-docs.vercel.app
- **GitHub**: https://github.com/VibeCodingWithPhil/agentwise
- **Issues**: https://github.com/VibeCodingWithPhil/agentwise/issues

## ⚡ Why Use This Setup?

1. **No More Flags**: Works without `--dangerously-skip-permissions`
2. **Faster Development**: Multiple agents work in parallel
3. **Cost Savings**: 25-35% reduction in token usage
4. **Safer Execution**: Sandboxed to project directories
5. **Better Monitoring**: Real-time dashboard for all activities

---

**Note**: This setup prompt is designed to work with Claude Code's latest version. Make sure you have Node.js 18+ installed before running.