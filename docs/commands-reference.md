# Complete Commands Reference

Agentwise provides **45 powerful commands** organized by category for comprehensive project automation.

## 📦 Project Creation & Management (11 commands)

### Core Creation
- **`/create <idea>`** - Create project with smart agent selection
- **`/create-plan <idea>`** - Collaborative planning mode with project folder
- **`/create-project <idea>`** - Complete project setup wizard with all features
- **`/projects`** - List and select active projects
- **`/project-status`** - View current project status and progress

### Task Management
- **`/task <feature>`** - Add features to active project (context-aware)
- **`/task-dynamic <feature>`** - Dynamic task distribution to agents
- **`/task-plan <feature>`** - Plan tasks before execution
- **`/task-import <source>`** - Import tasks from external sources

### Import & Migration
- **`/init-import`** - Import external project into Agentwise
- **`/clone-website <url>`** - Clone and customize existing websites

## 📋 Requirements & Planning (4 commands)

- **`/requirements <idea>`** - Generate comprehensive project requirements
- **`/requirements-enhance`** - Enhance existing requirements with AI
- **`/requirements-visualize`** - Create visual HTML specifications
- **`/requirements-to-tasks`** - Convert requirements into actionable tasks

## 🗄️ Database Integration (3 commands)

- **`/database-wizard`** - Interactive database setup wizard
- **`/database-setup`** - Quick database configuration
- **`/database-connect`** - Connect to existing database

## 🔐 Security & Protection (4 commands)

- **`/enable-protection`** - Enable automated backup and security
- **`/protection-status`** - View real-time protection status
- **`/security-review`** - Comprehensive security analysis
- **`/security-report`** - Generate detailed security report
- **`/rollback`** - Rollback to previous safe state

## 🎨 Figma Integration (8 commands)

- **`/figma`** - Main Figma integration menu
- **`/figma-auth`** - Authenticate with Figma account
- **`/figma-list`** - List available Figma files
- **`/figma-select`** - Select Figma file to work with
- **`/figma-inspect`** - Inspect Figma components
- **`/figma-generate`** - Generate code from Figma designs
- **`/figma-sync`** - Sync changes with Figma
- **`/figma-create`** - Create new Figma components

## 🤖 Model & Agent Management (6 commands)

### Agent Management
- **`/generate-agent <specialization>`** - Create custom specialized agents

### Local Models
- **`/setup-ollama`** - Install and configure Ollama
- **`/setup-lmstudio`** - Configure LM Studio integration
- **`/local-models`** - List available local models
- **`/configure-routing`** - Configure smart model routing

### MCP Integration
- **`/setup-mcps`** - Configure all 25 MCP servers for Claude Code

## 📊 Monitoring & Analysis (3 commands)

- **`/monitor`** - Launch real-time monitoring dashboard
- **`/visual-test`** - Run visual regression tests
- **`/docs`** - Open local documentation hub

## 🚀 Deployment & Updates (2 commands)

- **`/deploy`** - Deploy project to production
- **`/update-agentwise`** - Update Agentwise to latest version

## 🛠️ Configuration & Tools (3 commands)

- **`/configure-agentwise`** - Configure Agentwise settings
- **`/upload <file>`** - Upload documents (PDF, Word, Figma)
- **`/image`** - Visual context with file browser

## Command Categories Summary

| Category | Count | Purpose |
|----------|-------|---------|
| Project Management | 11 | Creating and managing projects |
| Requirements | 4 | Planning and specifications |
| Database | 3 | Database integration |
| Security | 5 | Protection and security |
| Figma | 8 | Design integration |
| Models & Agents | 6 | AI configuration |
| Monitoring | 3 | Analytics and testing |
| Deployment | 2 | Production deployment |
| Configuration | 3 | System settings |
| **Total** | **45** | **Complete automation** |

## Quick Start Commands

For new users, start with these essential commands:

1. **`/setup-mcps`** - Configure MCP servers
2. **`/create-project "your idea"`** - Create your first project
3. **`/monitor`** - Watch agents work
4. **`/docs`** - Learn more

## Command Patterns

### Context-Aware Commands
Many commands work with your active project context:
- `/task` - Adds to current project
- `/protection-status` - Shows current project protection
- `/deploy` - Deploys current project

### Project-Specific Commands
Target specific projects:
- `/task-[project-name] "feature"` - Add to specific project
- Example: `/task-todoapp "add dark mode"`

### Interactive Commands
Some commands launch interactive wizards:
- `/database-wizard` - Step-by-step database setup
- `/create-project` - Complete project wizard
- `/configure-routing` - Interactive model configuration

## Advanced Usage

### Command Chaining
```bash
/create-project "e-commerce site" && /enable-protection && /monitor
```

### Batch Operations
```bash
/requirements "social app" | /requirements-visualize | /requirements-to-tasks
```

### Custom Workflows
Create custom command sequences for your workflow:
```bash
# Morning routine
/projects && /protection-status && /monitor

# Before deployment
/security-review && /visual-test && /deploy
```

## Command Help

Each command supports help flags:
- `/command --help` - Show command usage
- `/command -h` - Quick help
- `/docs` - Full documentation

## Latest Additions

### Recently Added (August 2025)
- Requirements planning system (4 commands)
- Database integration (3 commands)
- Protection system (5 commands)
- Figma integration (8 commands)
- Visual testing capabilities

## Notes

- All commands are prefixed with `/`
- Commands are case-insensitive
- Tab completion available for all commands
- Context persistence maintains state between commands
- Token optimization active for all operations