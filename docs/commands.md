# Commands Reference

All Agentwise commands are available directly in Claude Code as custom commands.

## Project Creation Commands

### `/create <project idea>`
Creates a new project with automatic agent orchestration.

**Arguments:**
- `project idea` - Description of what you want to build

**Example:**
```bash
/create "Build a social media dashboard with analytics"
```

**Process:**
1. Enhances prompt with AI
2. Generates specifications
3. Creates workspace
4. Launches agents
5. Begins development

---

### `/create-plan <project idea>`
Creates a new project with collaborative planning from all agents.

**Arguments:**
- `project idea` - Description of what you want to build

**Example:**
```bash
/create-plan "Build a machine learning pipeline for image classification"
```

**Process:**
1. All 5 agents analyze requirements
2. Collaborative specification generation
3. Consensus on architecture
4. Detailed phase planning
5. Begins development

---

## Project Management Commands

### `/projects`
Lists all projects and allows switching between them.

**Arguments:** None

**Example:**
```bash
/projects
```

**Output:**
```
1. [ACTIVE] my-app - E-commerce platform (75% complete)
2. chat-app - Real-time chat (100% complete)
3. dashboard - Analytics dashboard (30% complete)

Select project number to activate:
```

---

## Feature Development Commands

### `/task <feature description>`
Adds a new feature to the active project.

**Arguments:**
- `feature description` - What feature to add

**Example:**
```bash
/task "Add two-factor authentication"
```

---

### `/task-[project] <feature>`
Adds a feature to a specific project.

**Arguments:**
- `project` - Project name (part of command)
- `feature` - Feature description

**Example:**
```bash
/task-myapp "Add payment processing"
```

---

### `/task-plan <feature>`
Adds a feature with collaborative planning.

**Arguments:**
- `feature` - Feature to add

**Example:**
```bash
/task-plan "Implement video streaming with WebRTC"
```

---

## Import Commands

### `/init-import`
Initialize import of an existing project.

**Arguments:** None (opens file browser)

**Example:**
```bash
/init-import
# Opens system file browser to select project
```

---

### `/task-import`
Execute import with automatic analysis.

**Arguments:** None (uses initialized project)

**Example:**
```bash
/task-import
```

**Process:**
1. Copies project to workspace
2. All agents analyze codebase
3. Generates project context
4. Creates continuation plan

---

## Agent Commands

### `/generate-agent <specialization>`
Creates a new specialized agent.

**Arguments:**
- `specialization` - Agent's area of expertise

**Example:**
```bash
/generate-agent "mobile development"
/generate-agent "blockchain specialist"
/generate-agent "security auditor"
```

**Output:**
- Creates agent file in `.claude/agents/`
- Agent immediately available for use

---

## Monitoring Commands

### `/monitor [project-name]`
Launch real-time monitoring dashboard.

**Arguments:**
- `project-name` (optional) - Specific project to monitor

**Examples:**
```bash
/monitor              # Monitor active project
/monitor my-app       # Monitor specific project
```

**Dashboard Features:**
- Real-time progress tracking
- Phase status
- Agent activity
- Task tracking
- Token usage
- Live logs

---

## Deployment Commands

### `/deploy [environment]`
Deploy project to specified environment.

**Arguments:**
- `environment` - Target environment (development/staging/production)

**Examples:**
```bash
/deploy               # Deploy to development
/deploy staging       # Deploy to staging
/deploy production    # Deploy to production
```

---

### `/rollback`
Rollback to previous deployment.

**Arguments:** None

**Example:**
```bash
/rollback
```

---

## Command Patterns

### Dynamic Commands
Some commands support dynamic project targeting:

```bash
/task-myproject "Add feature"     # Targets 'myproject'
/task-dashboard "Fix bug"         # Targets 'dashboard'
```

### Command Chaining
Commands can be used in sequence:

```bash
/create "Build app"
/task "Add authentication"  
/task "Add database"
/deploy staging
```

### Batch Operations
Some commands support batch operations:

```bash
/task-plan "Add authentication, payment processing, and admin panel"
```

## Command Options

### Global Options
Available for all commands:

- `--verbose` - Detailed output
- `--quiet` - Minimal output
- `--no-agents` - Skip agent launch
- `--dry-run` - Preview without execution

### Examples with Options
```bash
/create "Build app" --verbose
/deploy production --dry-run
/task "Add feature" --no-agents
```

## Error Handling

Commands will show clear error messages:

```bash
/task "Add feature"
Error: No active project. Use /projects to select one.

/deploy production
Error: Tests failing. Fix issues before deploying.
```

## Best Practices

1. **Use Planning for Complex Features**
   ```bash
   # Simple feature
   /task "Add logout button"
   
   # Complex feature
   /task-plan "Implement real-time collaboration"
   ```

2. **Project Naming Convention**
   ```bash
   /create "my-app: E-commerce platform"  # Clear project name
   ```

3. **Descriptive Feature Requests**
   ```bash
   # Good
   /task "Add user authentication with email verification and password reset"
   
   # Too vague
   /task "Add login"
   ```

4. **Monitor Long-Running Tasks**
   ```bash
   /create-plan "Complex project"
   /monitor  # In another terminal
   ```

## Command Aliases

Some commands have shorter aliases:

- `/c` → `/create`
- `/cp` → `/create-plan`
- `/t` → `/task`
- `/tp` → `/task-plan`
- `/m` → `/monitor`
- `/d` → `/deploy`

## Custom Command Creation

To create your own commands:

1. Create `.claude/commands/your-command.md`
2. Add YAML frontmatter
3. Define command logic

Example:
```markdown
---
description: Your command description
argument-hint: <arguments>
allowed-tools: Read, Write, Bash
---

# Command logic here
```

## Getting Help

- Use `/help` for command list
- Check individual command files in `.claude/commands/`
- Refer to [Troubleshooting Guide](./troubleshooting.md)