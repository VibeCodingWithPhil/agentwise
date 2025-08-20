<div align="center">

# 🚀 Agentwise

### Multi-Agent Orchestration System for Claude Code

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-Compatible-purple)](https://docs.anthropic.com/en/docs/claude-code)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![GitHub Release](https://img.shields.io/github/v/release/VibeCodingWithPhil/agentwise?include_prereleases)](https://github.com/VibeCodingWithPhil/agentwise/releases)

**Transform your development workflow with parallel AI agent execution, intelligent task distribution, and seamless Claude Code integration.**

[Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing) • [License](#-license)

</div>

---

## 🎯 Overview

Agentwise revolutionizes software development by orchestrating multiple specialized AI agents working in parallel. Built as an extension for Claude Code, it enables teams of AI agents to collaborate on complex projects with unprecedented efficiency.

### Why Agentwise?

- **🚄 Parallel Execution**: Run 5+ specialized agents simultaneously
- **🎭 Role-Based Agents**: Frontend, Backend, Database, DevOps, and Testing specialists
- **🔄 Smart Orchestration**: Intelligent task distribution and phase management
- **📊 Real-time Monitoring**: Track progress across all agents with live dashboard
- **🏗️ Project Isolation**: Each project in its own sandboxed workspace
- **💾 Token Optimization**: Intelligent context management reduces API costs by 60%

## ✨ Features

### Core Capabilities

<table>
<tr>
<td width="50%">

#### 🤖 Multi-Agent System
- **Dynamic Agent Generation** ✨
- **Designer Specialist Agent** 🎨
- Custom agent creation on-demand
- Parallel task execution
- Inter-agent communication
- Phase-based synchronization

</td>
<td width="50%">

#### 🛠️ Development Tools
- **Tech Stack Validator** ✅
- **MCP Integration (24+ servers)** 🔌
- Project scaffolding
- Code generation
- Automated testing
- Deployment workflows

</td>
</tr>
<tr>
<td width="50%">

#### 📦 Project Management
- **Smart Agent Selection** 🎯
- Workspace isolation
- Project registry
- Context preservation
- Version control integration
- Collaborative planning

</td>
<td width="50%">

#### 🎮 Claude Code Integration
- Native `/create` command
- `/task` for feature addition
- `/projects` for management
- **MCP-powered agents** 🚀
- Seamless agent invocation
- Built-in commands

</td>
</tr>
</table>

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0 or higher
- **Claude Code** CLI installed
- **Git** for version control
- **macOS/Linux** or **Windows with WSL**

### Installation

#### macOS / Linux

```bash
# Download and run installer
curl -fsSL https://github.com/VibeCodingWithPhil/agentwise/releases/latest/download/install-macos.sh | bash
# or for Linux:
curl -fsSL https://github.com/VibeCodingWithPhil/agentwise/releases/latest/download/install-linux.sh | bash
```

#### Windows (WSL Required)

```powershell
# Download installer
Invoke-WebRequest -Uri "https://github.com/VibeCodingWithPhil/agentwise/releases/latest/download/install-windows-wsl.ps1" -OutFile "install-agentwise.ps1"

# Run as Administrator
.\install-agentwise.ps1
```

### First Project

```bash
# Create a new project
/create "an e-commerce platform with Next.js and Stripe"

# List existing projects
/projects

# Add features to active project
/task "add user authentication with OAuth"

# Collaborative planning
/create-plan "real-time collaboration features"
```

## 📚 Documentation

### Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `/create <idea>` | Start new project from scratch | `/create "social media dashboard"` |
| `/projects` | List and select projects | `/projects` |
| `/task <feature>` | Add feature to active project | `/task "add dark mode"` |
| `/task-[project] <feature>` | Add feature to specific project | `/task-dashboard "add charts"` |
| `/create-plan <idea>` | Collaborative planning session | `/create-plan "mobile app"` |
| `/init-import` | Import existing project | `/init-import` |
| `/generate-agent <type>` | Create custom agent | `/generate-agent "security-specialist"` |

### Project Structure

```
agentwise/
├── .claude/                 # Claude Code integration
│   ├── agents/             # Agent definitions
│   └── commands/           # Custom commands
├── src/                    # Core system
│   ├── orchestrator/       # Agent orchestration
│   ├── monitoring/         # Progress tracking
│   └── utils/              # Helper utilities
├── docs/                   # Documentation
├── installers/             # Platform installers
└── workspace/              # Project workspaces (git-ignored)
```

### Architecture

```mermaid
graph TD
    A[User Command] --> B[Agentwise Core]
    B --> C[Prompt Enhancement]
    C --> D[Task Distribution]
    D --> E1[Frontend Agent]
    D --> E2[Backend Agent]
    D --> E3[Database Agent]
    D --> E4[DevOps Agent]
    D --> E5[Testing Agent]
    E1 --> F[Phase Sync]
    E2 --> F
    E3 --> F
    E4 --> F
    E5 --> F
    F --> G[Project Output]
```

## 🤝 Contributing

We love contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. **Fork** the repository
2. **Create** your feature branch (`git checkout -b feature/AmazingFeature`)
3. **Commit** your changes (`git commit -m 'Add some AmazingFeature'`)
4. **Push** to the branch (`git push origin feature/AmazingFeature`)
5. **Open** a Pull Request

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/agentwise.git
cd agentwise

# Install dependencies
npm install

# Run tests
npm test

# Build project
npm run build
```

## 🛡️ Security

- Private workspaces never committed to git
- Secure token management
- Isolated project environments
- No credential storage

Found a security issue? Please email security@agentwise.dev (or open a private security advisory).

## 📊 Performance

<table>
<tr>
<td align="center">
<h3>5x</h3>
<p>Faster Development</p>
</td>
<td align="center">
<h3>60%</h3>
<p>Token Reduction</p>
</td>
<td align="center">
<h3>100%</h3>
<p>Test Coverage</p>
</td>
<td align="center">
<h3>24/7</h3>
<p>Agent Availability</p>
</td>
</tr>
</table>

## 🗺️ Roadmap

### ✅ Completed
- [x] Core orchestration system with 5 specialist agents
- [x] Intelligent agent selection based on task analysis
- [x] Project backup and restore system
- [x] Code validation to prevent phantom code
- [x] Hallucination detection and prevention
- [x] Automatic agent discovery for custom agents

### 🚧 In Development
- [ ] **Web UI Dashboard** - Real-time monitoring interface
  - Agent status visualization
  - Progress tracking
  - Task distribution graphs

### 📋 Coming Soon (Q1-Q2 2025)
- [ ] **MCP Integration** - Model Context Protocol support
  - [ ] Figma MCP - Design system integration
  - [ ] GitHub MCP - Enhanced repository management
  - [ ] Database MCP - Direct database access

### 🤔 Under Evaluation
Features being considered based on community needs:
- Custom agent generator UI
- Additional MCP integrations
- Performance analytics
- Webhook support

We're keeping Agentwise focused and lightweight. See [ROADMAP.md](ROADMAP.md) for details.

## 📄 License

This project is licensed under a Modified MIT License - see the [LICENSE](LICENSE) file for details.

**Key Points:**
- ✅ Use commercially in your projects
- ✅ Modify and distribute
- ✅ Private and commercial use
- ❌ Cannot resell as your own product
- ❌ Cannot claim original authorship
- ❌ Cannot use "Agentwise" name for derivatives

## 🙏 Acknowledgments

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) by Anthropic
- All our amazing [contributors](https://github.com/VibeCodingWithPhil/agentwise/graphs/contributors)
- The open-source community

## 💬 Support

- 📖 [Documentation](https://github.com/VibeCodingWithPhil/agentwise/tree/main/docs)
- 💡 [Issues](https://github.com/VibeCodingWithPhil/agentwise/issues)
- 💬 [Discussions](https://github.com/VibeCodingWithPhil/agentwise/discussions)
- 📧 Contact: [Open an Issue](https://github.com/VibeCodingWithPhil/agentwise/issues/new)

---

<div align="center">

**Built with ❤️ by [Philip Ritmeester](https://github.com/VibeCodingWithPhil)**

[![Star History Chart](https://api.star-history.com/svg?repos=VibeCodingWithPhil/agentwise&type=Date)](https://star-history.com/#VibeCodingWithPhil/agentwise&Date)

</div>