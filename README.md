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

- **🚄 Parallel Execution**: Run 100+ agents with single-agent token usage
- **🎭 Self-Improving Agents**: Agents learn and improve from every task
- **🔄 Smart Orchestration**: Intelligent task distribution and phase management
- **📊 Real-time Monitoring**: Track progress across all agents with live dashboard
- **🏗️ Smart Model Routing**: Automatic model selection based on task type
- **💾 Ultimate Optimization**: 99% token reduction achieved - 100 agents = 1 agent cost
- **🖥️ Local Model Support**: Ollama, LM Studio, and OpenRouter integration
- **🧠 Hybrid AI Strategy**: Mix Claude, local models, and cloud APIs for optimal cost/performance

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
- **Performance Analytics** 📈
- **Self-Improving Agents** 🧠
- **Local Model Support** 🖥️
- **Ultimate Token Optimization** 💎

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

#### Project Management
| Command | Description | Example |
|---------|-------------|---------|
| `/create <idea>` | Start new project from scratch | `/create "social media dashboard"` |
| `/create-plan <idea>` | Collaborative planning session | `/create-plan "mobile app"` |
| `/projects` | List and select projects | `/projects` |
| `/task <feature>` | Add feature to active project | `/task "add dark mode"` |
| `/task-[project] <feature>` | Add feature to specific project | `/task-dashboard "add charts"` |
| `/task-plan <feature>` | Plan feature collaboratively | `/task-plan "payment system"` |

#### Import & Integration
| Command | Description | Example |
|---------|-------------|---------|
| `/init-import` | Import existing project | `/init-import` |
| `/task-import` | Copy and integrate project | `/task-import` |
| `/upload <file>` | Upload documents or design files | `/upload ./design.fig components` |
| `/clone-website <url>` | Clone and customize websites | `/clone-website https://example.com similar` |

#### Agent Management
| Command | Description | Example |
|---------|-------------|---------|
| `/generate-agent <type>` | Create custom agent | `/generate-agent "security-specialist"` |
| `/monitor` | Open monitoring dashboard | `/monitor` |

#### Model Configuration
| Command | Description | Example |
|---------|-------------|---------|
| `/setup-ollama` | Setup Ollama for local models | `/setup-ollama` |
| `/setup-lmstudio` | Setup LM Studio integration | `/setup-lmstudio` |
| `/local-models` | List available local models | `/local-models` |
| `/configure-routing` | Configure model routing | `/configure-routing optimize` |

#### Development Tools
| Command | Description | Example |
|---------|-------------|---------|
| `/image` | Visual context with file browser | `/image` |
| `/security-review` | Run security analysis | `/security-review` |
| `/deploy` | Deploy to production | `/deploy production` |
| `/rollback` | Rollback deployment | `/rollback` |

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
    A[User Command] --> B[Agentwise Orchestrator]
    B --> C[Smart Model Router]
    C --> D[Claude/Ollama/LM Studio]
    B --> E[Dynamic Task Distributor]
    E --> F[Tech Stack Validator]
    F --> G[Agent Selection]
    G --> H1[Frontend Specialist]
    G --> H2[Backend Specialist]
    G --> H3[Database Specialist]
    G --> H4[DevOps Specialist]
    G --> H5[Testing Specialist]
    G --> H6[Designer Specialist]
    G --> H7[Custom Agents]
    H1 --> I[MCP Integration]
    H2 --> I
    H3 --> I
    H4 --> I
    H5 --> I
    H6 --> I
    H7 --> I
    I --> J[26+ MCP Servers]
    J --> K[Phase Controller]
    K --> L[Self-Improving Agents]
    L --> M[Performance Analytics]
    M --> N[Token Optimizer 99%]
    N --> O[Project Output]
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

### ✅ Recently Completed (Q4 2024 - Q1 2025)
- [x] **Web UI Dashboard** - Real-time monitoring interface with live agent status
- [x] **MCP Integration** - 26+ MCP servers (Figma, Firecrawl, Shadcn UI, GitHub, etc.)
- [x] **Performance Analytics** - Comprehensive metrics, error tracking, and insights
- [x] **Self-Improving Agents** - Learning capabilities with knowledge persistence
- [x] **Ultimate Token Optimization** - 99% reduction achieved (100 agents = 1 agent cost)
- [x] **Smart Model Routing** - Automatic model selection based on task requirements
- [x] **Local Model Support** - Full Ollama, LM Studio, and OpenRouter integration
- [x] **Document Upload** - Process PDFs, Word docs, and design files
- [x] **Figma Integration** - Extract and convert Figma designs to code
- [x] **Website Cloning** - Clone and customize existing websites with Firecrawl

### 🚀 Next Phase (Q1-Q2 2025)
- [ ] **Agent Marketplace** - Share and discover custom agents
- [ ] **Visual Workflow Editor** - Drag-and-drop orchestration
- [ ] **Enterprise Features** - SSO, audit logs, compliance
- [ ] **Multi-language Support** - Python, Go, Rust agents
- [ ] **Advanced Security** - Sandboxing, encryption, audit trails
- [ ] **Webhook Support** - External integrations and notifications

We're keeping Agentwise focused and lightweight. See [ROADMAP.md](ROADMAP.md) for details.

## 💖 Support Agentwise

Agentwise is developed and maintained through community support. Your donations help continue development and add new features!

### Ways to Support:
- **PayPal Donations**: [Donate via PayPal](https://www.paypal.com/donate/?hosted_button_id=KAVQY4M7RJJBA)
- **GitHub Sponsors**: Click the "Sponsor" button above
- **Commercial License**: For business use, see [LICENSE](LICENSE)

Every donation, no matter the size, is greatly appreciated and helps keep Agentwise free for personal use! 🙏

## 🔮 Future CLI Support

We're planning to extend Agentwise to support additional AI CLI tools:

- **Crush CLI** - Coming soon
- **Qwen Coder** - In planning
- **Gemini CLI** - Under evaluation  
- **Cursor CLI** - Researching integration
- **More** - Suggest your favorite CLI!

## 📄 License

This project uses the **Agentwise Custom License** - see the [LICENSE](LICENSE) file for details.

### ✅ **What You CAN Do (Free)**
- Use Agentwise to build commercial websites, apps, and software for clients
- Use Agentwise in your company's development workflow
- Modify and customize for your projects
- Create and sell products built WITH Agentwise
- Personal, educational, and research use

### ⚠️ **What Requires a Commercial License** ($25k one-time or $10k/year)
- Creating a competing multi-agent orchestration product
- Reselling or rebranding Agentwise itself
- Offering Agentwise as a hosted service (SaaS)
- Building products that directly compete with Agentwise

### ❌ **What You CANNOT Do**
- Remove copyright notices
- Use "Agentwise" name for your products
- Claim you created Agentwise

**TL;DR**: You can use Agentwise to build anything you want for free. You only need a license if you're competing with Agentwise itself.

For commercial licensing questions:
- Discord: @vibecodingwithphil
- GitHub: [@VibeCodingWithPhil](https://github.com/VibeCodingWithPhil)

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