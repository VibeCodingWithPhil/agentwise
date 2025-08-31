# create-agentwise

Interactive installer for Agentwise - AI Multi-Agent Development Platform

## Installation (Recommended)

```bash
# Install Agentwise with interactive prompts
npm create agentwise@latest

# Or with yarn
yarn create agentwise

# Or with pnpm  
pnpm create agentwise
```

## What This Package Does

The `create-agentwise` package provides a secure, transparent, and user-friendly way to install Agentwise without shell scripts. Here's exactly what it does:

### 🔒 Security Features

- **No Shell Scripts**: Pure JavaScript/TypeScript implementation
- **Transparent Actions**: Every step is clearly explained before execution
- **User Confirmation**: All important actions require your approval
- **No Hidden Operations**: Everything is visible and logged
- **Safe Dependencies**: Only trusted, well-maintained packages

### 📋 Installation Process

1. **System Check**: Verifies Node.js 18+ is installed
2. **Path Detection**: Automatically finds existing installations
3. **User Choice**: Lets you choose installation location
4. **Transparent Download**: Shows progress while cloning from GitHub
5. **Dependency Installation**: Installs packages with clear progress
6. **Environment Setup**: Creates configuration files
7. **Cross-Platform Scripts**: Creates appropriate startup files

### 🔍 What Gets Installed

- **Core Agentwise**: Complete development platform
- **Dependencies**: All required npm packages
- **Environment File**: Template .env configuration  
- **Startup Scripts**: Platform-specific launchers
- **Directory Structure**: Workspace, agents, commands folders

### 🎯 User Control

- **Installation Path**: Choose default (`~/agentwise`) or custom location
- **Update Mode**: Safely update existing installations with backup
- **Cancellation**: Exit at any point without changes
- **Confirmation**: Confirm before any system modifications

## Manual Installation Alternative

If you prefer manual control:

```bash
# Clone the repository
git clone https://github.com/VibeCodingWithPhil/agentwise.git
cd agentwise

# Install dependencies
npm install --legacy-peer-deps

# Start Agentwise
node start.js
```

## Features

- ✅ **Interactive Setup**: Beautiful prompts guide you through installation
- ✅ **Cross-Platform**: Works on Windows, macOS, and Linux
- ✅ **Auto-Detection**: Finds existing installations automatically  
- ✅ **Safe Updates**: Backs up workspace before updating
- ✅ **No Shell Scripts**: Pure Node.js for maximum security
- ✅ **Transparent**: Every action is clearly explained
- ✅ **Cancellable**: Exit safely at any point

## System Requirements

- **Node.js**: 18.0.0 or higher
- **Git**: For cloning the repository
- **OS**: Windows 10+, macOS 10.15+, or Linux

## Troubleshooting

### Node.js Version Error
```
Error: Node.js 18+ required. Current: v16.x.x
```
**Solution**: Update Node.js at [nodejs.org](https://nodejs.org/)

### Permission Error
```
Error: EACCES: permission denied
```
**Solution**: Choose a different installation path where you have write access

### Git Not Found
```
Error: git: command not found
```
**Solution**: Install Git from [git-scm.com](https://git-scm.com/)

## Support

- **Documentation**: https://agentwise-docs.vercel.app
- **GitHub Issues**: https://github.com/VibeCodingWithPhil/agentwise/issues
- **Discord**: @vibecodingwithphil

## License

MIT License - see the [LICENSE](https://github.com/VibeCodingWithPhil/agentwise/blob/main/LICENSE) file for details.

---

**Note**: This installer prioritizes security and transparency. No shell scripts, no hidden operations, and full user control over the installation process.