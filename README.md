# 🎭 Agentwise

**Multi-Agent Orchestration System for Claude Code**

Agentwise extends Claude Code's capabilities by enabling parallel execution of specialized AI agents with coordinated task management and phase-based workflows.

## ✨ Features

- **5 Specialized Agents**: Frontend, Backend, Database, DevOps, and Testing specialists
- **Parallel Execution**: True concurrent processing with multiple Claude instances
- **Dynamic Phases**: Automatically adjusts phases based on project complexity
- **Collaborative Planning**: All agents work together for better project specs
- **Project Isolation**: Each project in its own workspace
- **Token Optimization**: ~70% reduction in token usage
- **Import Existing Projects**: Bring external projects into Agentwise

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/agentwise.git
cd agentwise

# Install dependencies
npm install

# Build the project
npm run build

# Run Agentwise
npm start
```

### Basic Usage

Within Claude Code, use these commands:

```bash
# Create a new project
/create a todo app with React and Node.js

# Collaborative planning for new project
/create-plan an e-commerce platform

# List all projects
/projects

# Add feature to active project
/task add user authentication

# Import existing project
/init-import
/task-import
```

## 📁 Project Structure

```
Agentwise/
├── .claude/
│   ├── agents/          # Agent definitions
│   └── commands/        # Custom commands
├── workspace/           # All projects
├── src/
│   ├── orchestrator/    # Core system
│   └── agent-todo/      # Task management
└── docs/               # Documentation
```

## 🤖 Available Agents

1. **frontend-specialist**: UI/UX, React/Vue/Angular expert
2. **backend-specialist**: API and server development
3. **database-specialist**: Schema design and optimization
4. **devops-specialist**: CI/CD and infrastructure
5. **testing-specialist**: Quality assurance and testing

## 📋 Commands

| Command | Description |
|---------|-------------|
| `/create <idea>` | Create new project |
| `/create-plan <idea>` | Collaborative planning for new project |
| `/projects` | List existing projects |
| `/task <feature>` | Add feature to active project |
| `/task-[project] <feature>` | Add feature to specific project |
| `/task-plan <feature>` | Plan feature collaboratively |
| `/init-import` | Initialize external project import |
| `/task-import` | Execute import with planning |
| `/generate-agent <spec>` | Create custom agent |

## 🔧 Development

```bash
# Run in development mode
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint

# Testing
npm test
```

## 📊 Token Optimization

Agentwise implements several strategies to minimize token usage:
- Compressed spec files
- Phase-based context loading
- Smart tool selection
- Response caching
- Incremental updates

Result: **~70% reduction** in token consumption

## 🏗️ Architecture

### Dynamic Phase System
- Phases generated based on project complexity
- Each agent tracks progress independently
- Automatic synchronization between phases
- Flexible task distribution

### Terminal Management
- Native OS terminal tabs (primary)
- TMUX support for power users
- Fallback process management

## 📚 Documentation

- [Getting Started](docs/getting-started.md)
- [Command Reference](docs/commands-reference.md)
- [Agent Guide](docs/agent-guide.md)
- [Troubleshooting](docs/troubleshooting.md)

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built for and with Claude Code by Anthropic

---

**Status**: 🟢 Active Development

For issues or questions, please open an issue on GitHub.