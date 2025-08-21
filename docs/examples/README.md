# Agentwise Examples

Comprehensive examples demonstrating Agentwise capabilities.

## Quick Start Examples

### 1. Creating Your First Project

```bash
# Start Claude Code with required permissions
claude --dangerously-skip-permissions

# Create a new e-commerce project
/create "e-commerce platform with Next.js, Stripe, and PostgreSQL"

# Monitor progress in real-time
/monitor

# Agents will automatically:
# - Frontend: Build Next.js UI with shopping cart
# - Backend: Create API endpoints and Stripe integration
# - Database: Design PostgreSQL schema for products/orders
# - Testing: Write comprehensive test suite
# - DevOps: Setup deployment configuration
```

### 2. Adding Features to Existing Project

```bash
# Add authentication to active project
/task "add user authentication with OAuth and JWT"

# Add specific feature
/task "implement product search with filters and sorting"

# Add payment processing
/task "integrate Stripe checkout with webhooks"
```

### 3. Importing Existing Projects

```bash
# Step 1: Analyze existing project
/init-import
# Select your project folder when prompted

# Step 2: Import with AI agents
/task-import
# Agents will analyze and enhance your codebase
```

## Advanced Examples

### 4. Document-Driven Development

```bash
# Upload requirements document
/upload requirements.pdf spec

# Agentwise will:
# 1. Extract all requirements
# 2. Generate project specification
# 3. Create implementation plan
# 4. Build the entire application
```

### 5. Figma to Code Workflow

```bash
# Connect to Figma
/figma connect

# Select component in Figma, then:
/figma generate Button

# Sync all design tokens
/figma sync

# Export design system
/figma tokens ./design-tokens.json
```

### 6. Website Cloning & Customization

```bash
# Clone website with exact styling
/clone-website https://example.com exact

# Clone structure but apply your brand
/clone-website https://site.com similar "tech startup, modern, blue theme"
```

### 7. Research-Driven Development

The Research Agent automatically:
- Researches best practices for your tech stack
- Finds current library versions
- Identifies security considerations
- Recommends optimal architectures

```bash
# Create project with research
/create "social media app with real-time features"

# Research Agent will:
# - Research WebSocket vs SSE for real-time
# - Find best practices for social features
# - Recommend scalable architecture
# - Identify security requirements
```

### 8. Custom Agent Creation

```bash
# Create specialized agent
/generate-agent "blockchain-specialist"

# Create domain expert
/generate-agent "healthcare-compliance-expert"

# Agents automatically integrate with system
```

### 9. Multi-Project Management

```bash
# List all projects
/projects

# Switch between projects
# Select from interactive list

# Add feature to specific project
/task-myapp "add dashboard analytics"
```

### 10. Local Model Integration

```bash
# Setup Ollama for local models
/setup-ollama

# Configure smart routing
/configure-routing optimize

# System will use:
# - Local models for simple tasks (free)
# - Claude for complex reasoning
# - Optimal cost/performance balance
```

## Real-World Project Examples

### Full-Stack SaaS Application

```bash
/create "SaaS project management tool with team collaboration, Kanban boards, time tracking, and billing"
```

**Result:**
- Frontend: React with drag-drop Kanban, real-time updates
- Backend: Node.js API with WebSocket support
- Database: PostgreSQL with optimized schema
- Auth: JWT + OAuth providers
- Billing: Stripe subscription integration
- Testing: 80%+ test coverage
- Deployment: Docker + Kubernetes configs

### Mobile-First E-Learning Platform

```bash
/create "mobile-first e-learning platform with video courses, quizzes, progress tracking, and certificates"
```

**Result:**
- Frontend: Next.js with PWA support
- Video: HLS streaming integration
- Quiz Engine: Dynamic question types
- Progress: Detailed analytics
- Certificates: PDF generation
- Payment: Multiple payment gateways

### Real-Time Collaboration Tool

```bash
/create "real-time collaborative whiteboard with video chat, screen sharing, and cloud storage"
```

**Result:**
- Canvas: WebGL-based drawing
- Real-time: WebRTC for video/audio
- Collaboration: Operational Transforms
- Storage: S3 integration
- Performance: Optimized for 50+ users

## MCP Integration Examples

### Using Design MCPs

```bash
# Figma to React components
/figma generate ComponentName

# Tailwind utilities
# Automatically applied by Frontend agent

# Material UI components
# Auto-selected for Material Design projects
```

### Using Database MCPs

```bash
# PostgreSQL optimization
# Database agent automatically:
# - Suggests indexes
# - Optimizes queries
# - Handles migrations
```

### Using Testing MCPs

```bash
# Playwright E2E tests
# Testing agent automatically:
# - Generates test scenarios
# - Creates page objects
# - Implements assertions
```

## Performance Examples

### Token Optimization in Action

```bash
# Traditional approach: 100,000 tokens
# Agentwise approach: 60,000-70,000 tokens

# Savings come from:
# - Shared context between agents
# - Incremental updates
# - Response caching
# - Smart batching
```

### Parallel Execution Benefits

```bash
# Sequential: 45 minutes
# Parallel with Agentwise: 8-10 minutes

# 5 agents working simultaneously:
# - Frontend building UI
# - Backend creating APIs
# - Database designing schema
# - Testing writing tests
# - DevOps configuring deployment
```

## Troubleshooting Examples

### Common Issues & Solutions

```bash
# Issue: Agents not starting
# Solution: Ensure Claude Code started with flag
claude --dangerously-skip-permissions

# Issue: Monitor not opening
# Solution: Install globally
/monitor install

# Issue: Import failing
# Solution: Check project has package.json
/init-import  # Then select valid project

# Issue: High token usage
# Solution: Enable optimization
/task "optimize token usage"  # System self-optimizes
```

## Integration Examples

### CI/CD Pipeline

```yaml
# .github/workflows/agentwise.yml
name: Agentwise CI/CD
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm test  # Tests generated by Testing agent
      - run: npm run build
```

### Docker Deployment

```dockerfile
# Dockerfile generated by DevOps agent
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## Best Practices

1. **Always start with clear requirements**
   ```bash
   /create "detailed description with tech preferences"
   ```

2. **Use document upload for complex projects**
   ```bash
   /upload detailed-spec.pdf spec
   ```

3. **Monitor progress actively**
   ```bash
   /monitor  # Keep open during development
   ```

4. **Leverage parallel execution**
   - Let multiple agents work simultaneously
   - Don't interrupt unless necessary

5. **Use appropriate models**
   ```bash
   /configure-routing optimize  # Auto-selects best model
   ```

## Next Steps

- Explore [Custom Agents](../custom-agents.md)
- Learn about [MCP Integration](../mcp-integration.md)
- Read [Architecture Details](../architecture.md)
- Join our [Discord Community](https://discord.gg/agentwise)