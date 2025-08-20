# Dynamic Agent Generation Documentation

## Overview
Agentwise can automatically generate new specialized agents based on project requirements, ensuring every project has the exact expertise it needs.

## Features

### Automatic Agent Creation
- Analyzes project specifications for capability gaps
- Generates specialized agents on-demand
- Creates agent definitions with appropriate tools and expertise
- Integrates seamlessly with existing agent ecosystem

### Smart Agent Selection
- Only loads agents required for the project
- Creates agent-todo folders only for active agents
- Optimizes token usage by selective agent loading
- Supports unlimited custom agents

## How It Works

### 1. Project Analysis
When creating a new project, the system analyzes specifications for:
- Required expertise areas
- Technology-specific needs
- Capability gaps in existing agents
- Specialized domain requirements

### 2. Agent Generation
If gaps are detected, the system:
- Creates new agent definition files
- Assigns appropriate tools and permissions
- Configures expertise areas
- Sets up MCP integrations

### 3. Integration
Generated agents are immediately:
- Added to the agent registry
- Assigned project tasks
- Configured with MCPs
- Given agent-todo folders

## Available Specialized Agents

### Designer Specialist
**Purpose**: UI/UX design and frontend aesthetics
```markdown
Capabilities:
- Create wireframes and mockups
- Design component libraries
- Develop design systems
- Ensure visual consistency
- Optimize user experience
- Implement accessibility standards
```

### AI Integration Specialist
**Purpose**: Implementing AI/ML features
```markdown
Capabilities:
- Integrate LLM APIs
- Implement AI-powered features
- Optimize prompts and context
- Handle AI responses
- Implement RAG systems
- Create embeddings
```

### Performance Specialist
**Purpose**: Application optimization
```markdown
Capabilities:
- Profile application performance
- Optimize bundle sizes
- Implement caching strategies
- Optimize database queries
- Configure CDN and edge computing
```

### Accessibility Specialist
**Purpose**: Ensuring inclusive experiences
```markdown
Capabilities:
- Implement WCAG 2.1 standards
- Add ARIA labels and roles
- Ensure keyboard navigation
- Test with screen readers
- Implement focus management
```

### Mobile Specialist
**Purpose**: Native and cross-platform apps
```markdown
Capabilities:
- Develop React Native applications
- Implement mobile-specific features
- Optimize for mobile performance
- Handle device permissions
- Implement push notifications
```

### Blockchain Specialist
**Purpose**: Web3 and decentralized apps
```markdown
Capabilities:
- Develop smart contracts
- Integrate Web3 wallets
- Implement token systems
- Create DeFi features
- Ensure contract security
```

### Data Specialist
**Purpose**: Analytics and BI
```markdown
Capabilities:
- Design data pipelines
- Create analytics dashboards
- Implement data visualization
- Build reporting systems
- Optimize data queries
```

## Creating Custom Agents

### Manual Agent Creation
Create a new agent file in `.claude/agents/`:

```markdown
---
description: custom-specialist - Your specialized agent
allowed-tools: Read, Write, Edit, Bash, Task
---

# Custom Specialist

You are a specialist focused on [domain].

## Capabilities
- [Capability 1]
- [Capability 2]
- [Capability 3]

## Expertise Areas
- [Area 1]
- [Area 2]

## Working Process
1. Analyze requirements
2. Plan implementation
3. Execute with best practices
4. Validate results
5. Document solution
```

### Programmatic Agent Generation

```typescript
const agentGenerator = new DynamicAgentGenerator();

// Generate agent for specific specialization
const result = await agentGenerator.generateAgent(
  'security',
  'E-commerce platform with PCI compliance'
);

// Result includes:
// - success: boolean
// - agentPath: string
// - agent: AgentTemplate
```

### Agent Template Structure

```typescript
interface AgentTemplate {
  name: string;
  specialization: string;
  description: string;
  capabilities: string[];
  tools: string[];
  expertise: string[];
  prompts: {
    system: string;
    taskHandler: string;
    reviewProcess: string;
  };
}
```

## Project-Based Agent Selection

### Automatic Detection
The system automatically detects need for agents based on keywords:

```typescript
// Designer agent triggered by:
['design', 'figma', 'ui/ux', 'wireframe', 'mockup']

// AI agent triggered by:
['ai', 'machine learning', 'llm', 'openai', 'claude']

// Performance agent triggered by:
['optimize', 'performance', 'speed', 'cache', 'cdn']
```

### Manual Agent Specification
Specify required agents in project description:

```bash
/create "E-commerce with React, needs design specialist and performance optimization"
# Automatically creates designer and performance agents if not present
```

## Agent Collaboration

### Inter-Agent Communication
Generated agents can:
- Share context with other agents
- Coordinate on shared interfaces
- Maintain consistent standards
- Ensure smooth phase handoffs

### Task Distribution
Tasks are intelligently distributed based on:
- Agent expertise matching
- Keyword analysis
- Capability requirements
- Workload balancing

## Configuration

### Agent Discovery
Agents are discovered from multiple sources:
- `.claude/agents/` directory
- Dynamically generated agents
- Project-specific agents

### Agent Registry
All agents are registered in the system:
```typescript
// Get all available agents
const agents = await agentManager.getAgents();

// Check if agent exists
const hasDesigner = await agentGenerator.ensureAgentExists('designer-specialist');
```

## Best Practices

### 1. Agent Specialization
- Keep agents focused on specific domains
- Avoid overlapping responsibilities
- Define clear expertise boundaries

### 2. Tool Assignment
- Only assign necessary tools
- Consider security implications
- Follow principle of least privilege

### 3. Capability Definition
- Be specific about capabilities
- Include both technical and soft skills
- Define quality standards

### 4. Documentation
- Document agent purpose clearly
- Provide usage examples
- Include integration guidelines

## Troubleshooting

### Agent Not Created
```bash
# Check agent generation logs
cat workspace/[project]/logs/agent-generation.log

# Verify agent exists
ls .claude/agents/

# Manually trigger generation
node -e "require('./src/agents/DynamicAgentGenerator').generateAgent('designer')"
```

### Agent Not Selected
```bash
# Check project analysis
cat workspace/[project]/specs/validation-report.md

# View selected agents
cat workspace/[project]/agent-todo/
```

### Task Distribution Issues
```bash
# Check task distribution
cat workspace/[project]/logs/task-distribution.log

# Verify agent capabilities
cat .claude/agents/[agent-name].md
```

## Future Enhancements

- Visual agent designer UI
- Agent performance metrics
- Self-improving agents through feedback
- Cross-project agent learning
- Agent marketplace for community sharing