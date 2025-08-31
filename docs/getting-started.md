# Getting Started with Agentwise

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git
- Claude Desktop App (for MCP integration)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Agentwise/agentwise.git
cd agentwise

# Install dependencies
npm install

# Build the project
npm run build

# Start the system
npm start
```

## Initial Setup

### 1. Configure Environment

Create a `.env` file:

```env
# Required
OPENAI_API_KEY=your-api-key

# Optional - Database
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key

# Optional - GitHub
GITHUB_TOKEN=your-github-token

# Optional - Local Models
OLLAMA_HOST=http://localhost:11434
LM_STUDIO_HOST=http://localhost:1234
```

### 2. Setup MCP Servers

Run the automated setup:

```bash
npm run setup-mcps
```

This configures all 25 MCP servers for Claude Desktop.

### 3. Start Monitoring

Launch the web dashboard:

```bash
npm run monitor
```

Access at: http://localhost:3002

## Your First Project

### Using the Wizard

The easiest way to create a project:

```bash
/create-project "A task management app with real-time collaboration"
```

This launches an interactive wizard that:
1. Generates comprehensive requirements
2. Creates visual specifications
3. Sets up database (optional)
4. Configures GitHub repository (optional)
5. Enables protection system (optional)
6. Distributes tasks to agents

### Manual Approach

For more control:

```bash
# 1. Generate requirements
/requirements "A task management app"

# 2. Create visual specification
/requirements-visualize

# 3. Setup database (optional)
/database-wizard

# 4. Configure GitHub (optional)
/github-setup

# 5. Enable protection (optional)
/enable-protection

# 6. Start development
/task "implement user authentication"
```

## Project Structure

```
agentwise/
├── src/                    # Core source code (335,998+ lines)
│   ├── agents/            # Agent definitions
│   ├── commands/          # Custom commands
│   ├── context/           # Context 3.0 system
│   ├── database/          # Database integration
│   ├── github/            # GitHub integration
│   ├── knowledge/         # Knowledge graph
│   ├── mcp/              # MCP integration
│   ├── monitoring/        # Monitoring system
│   ├── orchestrator/      # Agent orchestration
│   ├── protection/        # Protection system
│   ├── requirements/      # Requirements planning
│   ├── validation/        # Validation pipeline
│   └── wizard/           # Project wizard
├── workspace/             # Project workspaces
├── .claude/              # Claude configuration
│   ├── agents/           # Agent definitions
│   └── commands/         # Command definitions
├── tests/                # Test suite (184 tests)
├── docs/                 # Documentation
└── dist/                 # Build output
```

## Commands Reference

### Core Commands
- `/create <idea>` - Create project with smart agent selection
- `/create-project <idea>` - Complete project setup wizard
- `/projects` - List and select projects
- `/task <feature>` - Add features to active project

### Requirements & Planning
- `/requirements <idea>` - Generate project requirements
- `/requirements-visualize` - Create visual specifications

### Database & GitHub
- `/database-wizard` - Interactive database setup
- `/github-setup` - Configure GitHub repository

### Protection & Security
- `/enable-protection` - Enable automated protection
- `/protection-status` - View protection status
- `/security-review` - Security analysis

### Development Tools
- `/monitor` - Launch monitoring dashboard
- `/docs` - Open documentation
- `/setup-mcps` - Configure MCP servers

## Working with Agents

### Available Agents

**Core Agents (8)**
- Project Manager
- Frontend Specialist
- Backend Specialist
- Database Specialist
- DevOps Specialist
- Documentation Specialist
- Designer Specialist
- Testing Specialist

**Local-Only Agents (3)**
- Code Review Specialist
- Security Specialist
- Performance Specialist

### Agent Coordination

Agents automatically coordinate based on:
- Project requirements
- Task dependencies
- Available resources
- Token optimization

### Custom Agents

Create custom agents in `.claude/agents/`:

```markdown
# custom-specialist.md
You are a Custom Specialist focused on specific domain...
```

Agents are automatically discovered and integrated.

## Configuration

### Project Settings

Edit `agentwise.config.json`:

```json
{
  "context": {
    "enabled": true,
    "tokenOptimization": true,
    "sharedContext": true
  },
  "validation": {
    "syntax": true,
    "style": true,
    "security": true
  },
  "protection": {
    "autoBackup": true,
    "securityScanning": true,
    "codeReview": true
  }
}
```

### Model Configuration

Configure model routing:

```bash
/configure-routing
```

Options:
- Cost-optimized
- Quality-optimized
- Speed-optimized
- Balanced

## Testing

### Run Tests

```bash
# All tests
npm test

# Specific suite
npm test -- requirements
npm test -- database
npm test -- protection

# With coverage
npm run test:coverage
```

### Test Statistics
- Total Tests: 184
- Test Suites: 6
- Coverage: >80%

## Troubleshooting

### Common Issues

**Context Server Not Starting**
```bash
npm run context:restart
```

**MCP Connection Failed**
```bash
/setup-mcps check
/setup-mcps env
```

**Token Limit Exceeded**
- Enable Context Sharing: 15-20% reduction
- Enable Smart Caching: 10-15% additional reduction

**Build Errors**
```bash
npm run clean
npm install
npm run build
```

### Debug Mode

Enable detailed logging:

```bash
DEBUG=agentwise:* npm start
```

### Support

- GitHub Issues: https://github.com/Agentwise/agentwise/issues
- Documentation: https://agentwise-docs.vercel.app
- Community: Discord (coming soon)

## Next Steps

1. Explore example projects in `workspace/`
2. Read the [Architecture Guide](./architecture.md)
3. Check [API Reference](./api-reference.md)
4. Join the community

## Updates

Agentwise is actively developed with weekly updates:

```bash
git pull
npm install
npm run build
```

Check [CHANGELOG.md](../CHANGELOG.md) for latest changes.