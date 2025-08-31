# Agentwise Installation Guide v2.3.0

## 🚀 Recommended: NPM Package Installation (Secure & Easy)

**No shell scripts, no security concerns, full transparency.**

```bash
# Install Agentwise with interactive prompts
npm create agentwise@latest

# Or with yarn
yarn create agentwise

# Or with pnpm  
pnpm create agentwise
```

### What This Does (100% Transparent)

The NPM installer provides a secure, user-friendly installation process:

✅ **Interactive Menu**: Choose your installation path  
✅ **Auto-Detection**: Finds existing installations  
✅ **Full Control**: Confirm every action before execution  
✅ **No Shell Scripts**: Pure JavaScript for maximum security  
✅ **Cross-Platform**: Works on Windows, macOS, Linux  
✅ **Safe Updates**: Backs up your workspace automatically  

## 🛠️ Manual Installation (Advanced Users)

If you prefer complete manual control:

```bash
# 1. Clone the repository
git clone https://github.com/VibeCodingWithPhil/agentwise.git
cd agentwise

# 2. Install dependencies
npm install --legacy-peer-deps

# 3. Setup environment (optional)
cp .env.example .env

# 4. Start Agentwise
node start.js
```

## ⚡ Quick Start After Installation

### For New Users:
```bash
# Navigate to your Agentwise installation
cd ~/agentwise  # (or your chosen path)

# Start Agentwise
node start.js

# Or use platform-specific scripts:
# Windows: start-agentwise.bat  
# Mac/Linux: ./start-agentwise.sh
```

### For Claude Code Integration:
```bash
# In Claude Code, run:
/setup-mcps

# Then create your first project:
/create-project "my awesome app"
```

## 🔧 System Requirements

- **Node.js**: 18.0.0 or higher ([Download](https://nodejs.org/))
- **Git**: For repository cloning ([Download](https://git-scm.com/))
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 2GB free space

## 🏗️ Installation Options Comparison

| Method | Security | Ease of Use | Control | Recommended |
|--------|----------|-------------|---------|-------------|
| **NPM Package** | ✅ Highest | ✅ Easiest | ✅ Full | ✅ **Yes** |
| **Manual Git Clone** | ✅ High | ⚠️ Advanced | ✅ Complete | For developers |
| ~~Shell Scripts~~ | ❌ Concerns | ✅ Easy | ❌ Limited | ❌ **Deprecated** |

## 🔍 What Gets Installed

```
~/agentwise/                    # Installation directory
├── src/                        # Core Agentwise source
├── .claude/                    # Agent definitions
│   ├── agents/                 # AI agent configurations  
│   └── commands/               # Custom commands
├── workspace/                  # Your projects
├── backups/                    # Automatic backups
├── logs/                       # System logs
├── node_modules/               # Dependencies
├── .env                        # Environment configuration
├── start.js                    # Cross-platform launcher
├── start-agentwise.sh          # Unix startup script
└── start-agentwise.bat         # Windows startup script
```

## 🚨 Troubleshooting

### Common Issues & Solutions

**Node.js Version Error:**
```bash
# Check your Node version
node --version

# If < 18.0.0, update at: https://nodejs.org/
```

**Permission Denied:**
```bash
# Choose a different installation path
npm create agentwise@latest
# Select "Custom location" and use a writable directory
```

**Git Not Found:**
```bash
# Install Git: https://git-scm.com/
# Or use GitHub Desktop: https://desktop.github.com/
```

**Port Already in Use:**
```bash
# Edit .env file and change PORT=3001 to another port
```

**Dependencies Installation Failed:**
```bash
# Clear npm cache and retry
npm cache clean --force
npm create agentwise@latest
```

## 🔄 Updating Agentwise

### Automatic Update (Recommended):
```bash
npm create agentwise@latest
# Choose "Update existing installation" when prompted
```

### Manual Update:
```bash
cd ~/agentwise
git pull origin main
npm install --legacy-peer-deps
```

## 🆘 Getting Help

- **📚 Documentation**: https://agentwise-docs.vercel.app
- **🐛 Bug Reports**: https://github.com/VibeCodingWithPhil/agentwise/issues
- **💬 Community**: Join our Discord server
- **📧 Support**: Contact support@agentwise.dev

## 🔒 Security Notice

**Why We Moved Away from Shell Scripts:**

- Shell scripts can be modified by malicious actors
- Difficult to audit and understand for non-technical users
- Platform-specific issues and compatibility problems
- Security concerns raised by the community

**Our NPM Package is Secure:**

- ✅ Pure JavaScript/TypeScript - no shell commands
- ✅ Transparent operations with user confirmation
- ✅ Audited dependencies from trusted sources
- ✅ Open source - review the code yourself
- ✅ Cross-platform without platform-specific scripts

---

## 🎉 Welcome to Agentwise!

Once installed, you'll have access to:

- 🤖 **8 Core AI Agents** for development automation
- 📋 **45 Specialized Commands** for every development task
- 🔧 **Project Wizard** for complete setup in minutes
- 📊 **99.3% Token Reduction** with Context 3.0
- 🔗 **25+ MCP Integrations** with popular tools
- 📚 **Complete Documentation** and tutorials

**Ready to transform your development workflow?**

Start with: `npm create agentwise@latest`