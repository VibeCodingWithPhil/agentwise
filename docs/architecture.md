# Agentwise Architecture

## System Overview

Agentwise is built as a modular, event-driven system that orchestrates multiple Claude Code agents to work collaboratively on software projects.

```
┌─────────────────────────────────────────────────────────┐
│                     Claude Code CLI                      │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                      Agentwise Core                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  Orchestrator │  │    Phase     │  │   Progress   │ │
│  │              │  │  Controller  │  │   Tracker    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │      │   Backend    │      │   Database   │
│  Specialist  │      │  Specialist  │      │  Specialist  │
└──────────────┘      └──────────────┘      └──────────────┘
        ▼                     ▼                     ▼
┌──────────────┐      ┌──────────────┐
│    DevOps    │      │   Testing    │
│  Specialist  │      │  Specialist  │
└──────────────┘      └──────────────┘
```

## Core Components

### 1. Orchestrator (`src/orchestrator/`)

The central coordination system that manages the entire workflow.

**Responsibilities:**
- Command routing and execution
- Agent lifecycle management
- Phase coordination
- Resource allocation

**Key Classes:**
- `Orchestrator` - Main orchestration logic
- `AgentManager` - Agent spawning and communication
- `TaskDistributor` - Task allocation to agents

### 2. Phase Controller (`src/orchestrator/PhaseController.ts`)

Manages dynamic phase-based execution.

**Features:**
- Dynamic phase generation based on complexity
- Phase synchronization across agents
- Progress monitoring
- Automatic phase transitions

**Phase Types:**
1. Setup & Architecture
2. Core Implementation
3. Integration
4. Enhancement
5. Testing & Polish
6. Deployment

### 3. Project Registry (`src/project-registry/`)

Centralized project management system.

**Capabilities:**
- Project tracking and persistence
- Active project management
- Metrics collection
- Project state management

**Data Structure:**
```typescript
interface Project {
  id: string;
  name: string;
  path: string;
  status: 'active' | 'completed' | 'archived';
  phases: PhaseInfo;
  metrics: ProjectMetrics;
}
```

### 4. Spec Generator (`src/orchestrator/SpecGenerator.ts`)

Generates structured specifications from prompts.

**Outputs:**
- `main-spec.md` - Project vision and goals
- `project-spec.md` - Technical specifications
- `todo-spec.md` - Task breakdown
- `project-context.md` - Continuity information

### 5. Progress Tracker (`src/monitoring/`)

Real-time monitoring and metrics collection.

**Features:**
- Task-level tracking
- Phase progress monitoring
- Token usage tracking
- Performance metrics
- Event-driven updates

### 6. Prompt Enhancer (`src/utils/PromptEnhancer.ts`)

AI-powered prompt enhancement with dual modes.

**Modes:**
- **Create Mode**: New project enhancement
- **Task Mode**: Feature addition with context

**Enhancements:**
- Technology suggestions
- Complexity analysis
- Assumption generation
- Clarification requests

## Agent Architecture

### Agent Definition Format

```yaml
---
name: agent-name
description: Agent purpose and expertise
tools: Read, Edit, Write, Bash, Grep, Glob, WebFetch
---

Agent instructions and behavior...
```

### Agent Communication

Agents communicate through:
1. **File System** - Shared workspace files
2. **Phase Files** - Task assignments per phase
3. **Status Files** - Progress tracking
4. **Context Files** - Project continuity

### Agent Specializations

1. **Frontend Specialist**
   - UI/UX implementation
   - Component architecture
   - State management
   - Responsive design

2. **Backend Specialist**
   - API development
   - Business logic
   - Authentication
   - Data processing

3. **Database Specialist**
   - Schema design
   - Query optimization
   - Migration management
   - Data modeling

4. **DevOps Specialist**
   - CI/CD pipelines
   - Infrastructure setup
   - Container orchestration
   - Environment configuration

5. **Testing Specialist**
   - Test strategy
   - Unit/integration tests
   - E2E testing
   - Performance testing

6. **Deployment Specialist**
   - Production deployment
   - Monitoring setup
   - Rollback strategies
   - Health checks

## Workflow Engine

### Phase Execution Flow

```
1. Prompt Input
      │
      ▼
2. Enhancement & Analysis
      │
      ▼
3. Spec Generation
      │
      ▼
4. Phase Planning
      │
      ▼
5. Task Distribution
      │
      ▼
6. Parallel Execution ──┐
      │                 │
      ▼                 │
7. Synchronization ◄────┘
      │
      ▼
8. Phase Transition
      │
      ▼
9. Completion
```

### Task Distribution Algorithm

```typescript
function distributeTasks(tasks: Task[], agents: Agent[]): Distribution {
  // Analyze task requirements
  const categorized = categorizeTasks(tasks);
  
  // Match tasks to agent specializations
  const distribution = matchTasksToAgents(categorized, agents);
  
  // Balance workload
  return balanceDistribution(distribution);
}
```

## Data Flow

### Project Workspace Structure

```
workspace/
└── project-name/
    ├── specs/
    │   ├── main-spec.md
    │   ├── project-spec.md
    │   └── todo-spec.md
    ├── agent-todo/
    │   ├── frontend/
    │   │   ├── phase1-todo.md
    │   │   ├── phase2-todo.md
    │   │   └── phase-status.json
    │   ├── backend/
    │   ├── database/
    │   ├── devops/
    │   └── testing/
    ├── src/
    │   └── [project code]
    └── .deploy/
        ├── scripts/
        ├── env/
        └── config/
```

### State Management

**Project State:**
- Stored in `projects.json`
- Includes metadata, progress, metrics
- Synchronized across all components

**Agent State:**
- Individual `phase-status.json` files
- Task completion tracking
- Error reporting

**System State:**
- Global configuration
- Active processes
- Resource usage

## Event System

### Event Types

1. **Project Events**
   - `project:created`
   - `project:started`
   - `project:completed`

2. **Phase Events**
   - `phase:started`
   - `phase:completed`
   - `phase:failed`

3. **Task Events**
   - `task:assigned`
   - `task:started`
   - `task:completed`
   - `task:failed`

4. **Agent Events**
   - `agent:spawned`
   - `agent:ready`
   - `agent:idle`
   - `agent:terminated`

### Event Flow

```javascript
progressTracker.on('task:completed', (data) => {
  // Update metrics
  updateProjectMetrics(data.projectId);
  
  // Check phase completion
  if (isPhaseComplete(data.phase)) {
    emit('phase:completed', data.phase);
  }
  
  // Update dashboard
  dashboard.refresh();
});
```

## Terminal Management

### Spawning Strategy

**macOS:**
```bash
osascript -e 'tell app "Terminal" to do script "command"'
```

**Linux:**
```bash
gnome-terminal -- bash -c "command"
```

**Windows:**
```bash
start cmd /k "command"
```

### Process Management

- Each agent runs in isolated terminal
- Process monitoring via PID tracking
- Graceful shutdown on completion
- Error recovery mechanisms

## Token Optimization

### Strategies

1. **Prompt Compression**
   - Remove redundant information
   - Use references instead of repetition
   - Compress file contents

2. **Context Management**
   - Load only relevant context
   - Progressive context loading
   - Context caching

3. **Response Filtering**
   - Extract essential information
   - Remove verbose outputs
   - Summarize when possible

### Implementation

```typescript
class TokenOptimizer {
  compress(text: string): string {
    // Remove comments
    // Compress whitespace
    // Use abbreviations
    return optimized;
  }
  
  filterContext(context: Context): Context {
    // Remove irrelevant files
    // Summarize large files
    // Cache frequently used
    return filtered;
  }
}
```

## Security Considerations

### Access Control

- Agents run with `--dangerously-skip-permissions` flag
- Workspace isolation per project
- No cross-project file access

### Data Protection

- Environment variables for secrets
- No hardcoded credentials
- Secure deployment configurations

### Audit Trail

- All agent actions logged
- Command history tracking
- Error reporting and analysis

## Performance Optimization

### Parallel Processing

- 5+ agents working simultaneously
- Independent task execution
- Minimal synchronization overhead

### Resource Management

- Memory usage monitoring
- CPU allocation per agent
- Disk I/O optimization

### Caching Strategy

- Specification caching
- Context caching
- Build artifact caching

## Extensibility

### Plugin Architecture

```typescript
interface AgentPlugin {
  name: string;
  initialize(): void;
  execute(task: Task): Promise<Result>;
  cleanup(): void;
}
```

### Custom Agents

- Define in `.claude/agents/`
- Automatic discovery
- Hot-reload support

### Command Extensions

- Add to `.claude/commands/`
- YAML configuration
- Markdown-based logic

## Future Enhancements

1. **Distributed Execution**
   - Multi-machine agent distribution
   - Cloud-based agent pools

2. **Machine Learning Integration**
   - Task prediction
   - Performance optimization
   - Error prevention

3. **Advanced Monitoring**
   - Predictive analytics
   - Anomaly detection
   - Resource forecasting

4. **Ecosystem Integration**
   - IDE plugins
   - CI/CD integrations
   - Cloud platform connectors