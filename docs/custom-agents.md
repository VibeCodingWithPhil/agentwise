# Custom Agents Documentation

Agentwise provides a powerful system for creating and managing custom agents that extend the platform's capabilities beyond the built-in specialists. Custom agents are dynamically discovered and integrated into the orchestration system.

## Overview

The custom agent system allows you to:
- Create specialized agents for unique project requirements
- Dynamically discover and load agents from the `.claude/agents/` directory
- Integrate custom agents seamlessly with the existing orchestration
- Leverage agent-specific MCP integrations for enhanced capabilities

## Built-in Specialist Agents

Agentwise comes with 8 built-in specialist agents:

1. **Frontend Specialist** (`frontend-specialist.md`)
   - React, Vue, Angular, and modern frontend frameworks
   - UI/UX implementation and responsive design
   - State management and component architecture

2. **Backend Specialist** (`backend-specialist.md`)
   - API development and microservices
   - Server-side logic and business rules
   - Database integration and optimization

3. **Database Specialist** (`database-specialist.md`)
   - Schema design and optimization
   - Query performance and indexing
   - Data migration and backup strategies

4. **DevOps Specialist** (`devops-specialist.md`)
   - CI/CD pipeline configuration
   - Infrastructure as Code (IaC)
   - Containerization and orchestration

5. **Testing Specialist** (`testing-specialist.md`)
   - Unit, integration, and end-to-end testing
   - Test automation and coverage analysis
   - Performance and security testing

6. **Deployment Specialist** (`deployment-specialist.md`)
   - Production deployment strategies
   - Environment configuration and management
   - Monitoring and alerting setup

7. **Designer Specialist** (`designer-specialist.md`)
   - UI/UX design and prototyping
   - Design system creation and maintenance
   - Accessibility and user experience optimization

8. **Code Review Specialist** (`code-review-specialist.md`)
   - Code quality analysis and improvements
   - Security vulnerability detection
   - Best practices enforcement and documentation

## Creating Custom Agents

### Agent File Structure

Custom agents are defined as Markdown files in the `.claude/agents/` directory. Each agent follows a specific structure:

```markdown
# Agent Name

## Role
Brief description of the agent's primary responsibility

## Capabilities
- List of specific capabilities
- Technologies and frameworks
- Specialized knowledge areas

## MCP Integrations
- Relevant MCP servers for this agent
- Tool-specific integrations

## Examples
- Common use cases
- Sample tasks and scenarios

## Best Practices
- Guidelines for effective use
- Common pitfalls to avoid
```

### Example Custom Agent

Here's an example of a Security Specialist agent:

```markdown
# Security Specialist

## Role
Specialized in application security, vulnerability assessment, and secure coding practices.

## Capabilities
- Security code reviews and vulnerability scanning
- OWASP compliance and security best practices
- Authentication and authorization implementation
- Encryption and data protection strategies
- Security testing and penetration testing coordination
- Compliance frameworks (SOC2, GDPR, HIPAA)

## MCP Integrations
- GitHub MCP for security scanning
- Security-focused linting tools
- Vulnerability database integrations
- Compliance checking tools

## Examples
- Implementing JWT authentication with refresh tokens
- Setting up rate limiting and DDoS protection
- Conducting security audits of existing codebases
- Implementing end-to-end encryption for sensitive data

## Best Practices
- Always follow principle of least privilege
- Implement defense in depth strategies
- Keep security libraries and dependencies updated
- Document security decisions and threat models
```

### Advanced Agent Features

#### Context-Aware Specialization

Agents can be made context-aware by including conditional logic in their definitions:

```markdown
## Context Adaptations
- **Web Applications**: Focus on HTTPS, CSP, and XSS prevention
- **Mobile Apps**: Emphasize secure storage and network communication
- **APIs**: Priority on authentication, rate limiting, and input validation
- **Enterprise**: Compliance frameworks and audit trails
```

#### Tool Integration

Custom agents can specify their preferred tools and integrations:

```markdown
## Required Tools
- Static analysis tools (SonarQube, CodeQL)
- Dependency scanners (Snyk, OWASP Dependency Check)
- Secret detection (GitLeaks, TruffleHog)
- Container security (Trivy, Clair)

## Optional Enhancements
- SIEM integration for security monitoring
- Threat intelligence feeds
- Automated penetration testing tools
```

## Dynamic Agent Discovery

### How It Works

The `DynamicAgentManager` automatically discovers and loads custom agents:

1. **Scanning**: Scans `.claude/agents/` directory every 5 seconds
2. **Parsing**: Extracts agent metadata from Markdown files
3. **Registration**: Registers new agents with the orchestration system
4. **Integration**: Makes agents available for project assignment

### Agent Selection Logic

The `AgentSelector` uses intelligent matching to determine which agents are needed:

```typescript
// Example agent selection logic
const projectAnalysis = await analyzeProject(projectSpec);
const requiredAgents = [];

if (projectAnalysis.needsFrontend) {
  requiredAgents.push('frontend-specialist');
}

if (projectAnalysis.hasSecurityRequirements) {
  requiredAgents.push('security-specialist');
}

if (projectAnalysis.needsCompliance) {
  requiredAgents.push('compliance-specialist');
}
```

### Custom Agent Generator

Use the `/generate-agent` command to create new agents dynamically:

```bash
# Create a new specialist agent
/generate-agent "machine-learning-specialist"

# Create a domain-specific agent
/generate-agent "healthcare-compliance-specialist"

# Create a technology-specific agent
/generate-agent "blockchain-specialist"
```

## Agent Orchestration

### Task Distribution

Custom agents participate in the same task distribution system as built-in agents:

1. **Project Analysis**: Determine which agents are needed
2. **Task Breakdown**: Create agent-specific tasks
3. **Phase Coordination**: Synchronize work across agents
4. **Progress Tracking**: Monitor completion and quality

### Inter-Agent Communication

Agents can coordinate through the orchestration system:

- **Shared Context**: Access to project specifications and progress
- **Dependency Management**: Handle task dependencies between agents
- **Knowledge Sharing**: Pass insights between related agents

## MCP Integration for Custom Agents

### Agent-Specific MCPs

Custom agents can leverage specialized MCP servers:

```json
{
  "security-specialist": [
    "github-mcp",
    "vulnerability-scanner-mcp",
    "compliance-checker-mcp"
  ],
  "machine-learning-specialist": [
    "jupyter-mcp",
    "model-registry-mcp",
    "experiment-tracking-mcp"
  ]
}
```

### MCP Configuration

Configure MCPs for custom agents in `config/mcp-config.json`:

```json
{
  "agents": {
    "security-specialist": {
      "mcps": ["github", "security-scanner"],
      "tools": ["vulnerability-scan", "compliance-check"],
      "priority": "high"
    }
  }
}
```

## Agent Performance Analytics

### Metrics Tracking

Custom agents automatically participate in performance analytics:

- **Task Completion Rate**: Success rate for assigned tasks
- **Quality Metrics**: Code quality and review scores
- **Efficiency Tracking**: Time to completion and resource usage
- **Learning Progress**: Improvement over time

### Performance Optimization

The system continuously optimizes agent performance:

```typescript
// Example performance tracking
interface AgentMetrics {
  taskCompletionRate: number;
  averageQualityScore: number;
  learningProgress: number;
  resourceEfficiency: number;
}
```

## Best Practices for Custom Agents

### Agent Design Principles

1. **Single Responsibility**: Each agent should have a clear, focused purpose
2. **Composability**: Agents should work well with others
3. **Adaptability**: Agents should handle various project contexts
4. **Quality Focus**: Prioritize output quality over speed

### Documentation Standards

- **Clear Role Definition**: Exactly what the agent does
- **Capability Boundaries**: What the agent can and cannot do
- **Integration Points**: How it works with other agents
- **Example Scenarios**: Common use cases and edge cases

### Testing Custom Agents

```bash
# Test agent discovery
/projects  # Check if custom agent appears in available agents

# Test agent selection
/create "project requiring custom specialist"  # Verify agent is selected

# Test agent execution
/task "specific task for custom agent"  # Monitor agent performance
```

## Common Custom Agent Patterns

### Domain-Specific Agents

- **Healthcare Specialist**: HIPAA compliance, medical data handling
- **Financial Specialist**: PCI compliance, financial regulations
- **Gaming Specialist**: Game engines, performance optimization
- **IoT Specialist**: Embedded systems, sensor integration

### Technology-Specific Agents

- **Blockchain Specialist**: Smart contracts, DeFi applications
- **AI/ML Specialist**: Model training, data pipelines
- **Mobile Specialist**: React Native, Flutter, native development
- **Cloud Specialist**: AWS, Azure, GCP specific implementations

### Process-Specific Agents

- **Quality Assurance Specialist**: Testing strategies, quality gates
- **Performance Specialist**: Optimization, monitoring, benchmarking
- **Documentation Specialist**: Technical writing, API documentation
- **Integration Specialist**: Third-party services, API integrations

## Troubleshooting Custom Agents

### Common Issues

1. **Agent Not Discovered**
   - Check file location in `.claude/agents/`
   - Verify Markdown format and structure
   - Ensure file has `.md` extension

2. **Agent Not Selected**
   - Review project analysis logic
   - Check agent capability matching
   - Verify agent role description clarity

3. **Poor Agent Performance**
   - Review agent instructions for clarity
   - Check MCP integrations are working
   - Analyze task completion metrics

### Debugging Tools

```bash
# Check agent discovery
/monitor  # View agent status in dashboard

# Analyze agent selection
grep "agent selection" logs/agentwise.log

# Review agent performance
npm run analytics  # View performance dashboard
```

## Advanced Customization

### Agent Hierarchies

Create specialized sub-agents:

```
security-specialist.md
├── web-security-specialist.md
├── mobile-security-specialist.md
└── api-security-specialist.md
```

### Conditional Agent Loading

Agents can include environment-specific logic:

```markdown
## Environment Adaptations
- **Development**: Focus on developer experience and debugging
- **Staging**: Emphasize testing and validation
- **Production**: Priority on performance and monitoring
```

### Agent Templates

Create reusable agent templates:

```bash
# Use template to create new agents
/generate-agent "new-specialist" --template="specialist-template"
```

## Integration with External Systems

### Webhook Integration

Custom agents can integrate with external systems via webhooks:

```json
{
  "webhooks": {
    "security-specialist": {
      "vulnerability-detected": "https://security.company.com/webhook",
      "compliance-check": "https://compliance.company.com/webhook"
    }
  }
}
```

### API Integration

Agents can call external APIs for enhanced capabilities:

```markdown
## External Integrations
- Security vulnerability databases
- Compliance checking services
- Code quality assessment tools
- Performance monitoring platforms
```

## Future Enhancements

### Agent Marketplace

Planned features for sharing and discovering custom agents:

- **Community Agents**: Shared agent library
- **Agent Ratings**: Community feedback and ratings
- **Version Management**: Agent versioning and updates
- **Dependency Management**: Agent dependency resolution

### Visual Agent Builder

Future GUI for creating custom agents:

- **Drag-and-Drop Interface**: Visual agent configuration
- **Template Library**: Pre-built agent templates
- **Test Environment**: Safe agent testing sandbox
- **Performance Profiler**: Agent optimization tools

This comprehensive custom agent system enables unlimited extensibility while maintaining the performance and reliability of the core Agentwise platform.