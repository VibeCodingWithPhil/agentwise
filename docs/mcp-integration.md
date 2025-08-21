# MCP Integration Guide

## Overview

Agentwise features the most comprehensive MCP (Model Context Protocol) integration with **61 specialized servers** covering every aspect of modern development.

## Complete MCP Server List

### Design & UI Libraries (12 MCPs)

#### Design Tools (5)
- **Figma** - Complete Figma Dev Mode integration
- **Canva** - Design asset creation and manipulation
- **Framer** - Interactive design and prototyping
- **Sketch** - Design file processing
- **Adobe XD** - Adobe design integration

#### UI Component Libraries (6)
- **Shadcn UI** - Modern React components
- **Material UI** - Material Design components
- **Ant Design** - Enterprise UI library
- **Chakra UI** - Modular component library
- **Radix UI** - Unstyled accessible components
- **Mantine** - Full-featured React library

#### Styling (1)
- **Tailwind CSS** - Utility-first CSS framework

### Backend & API Tools (6 MCPs)

- **REST API** - RESTful API development
- **GraphQL** - GraphQL schema and resolvers
- **TestSprite** - API testing automation
- **Fetch** - HTTP client utilities
- **Stripe** - Payment processing
- **PayPal** - Payment gateway integration

### Database Systems (6 MCPs)

- **PostgreSQL** - Standard PostgreSQL operations
- **PostgreSQL Advanced** - Advanced features and optimization
- **MongoDB** - NoSQL database operations
- **MongoDB Atlas** - Cloud MongoDB management
- **MySQL** - MySQL database operations
- **Multi-Database** - Cross-database operations

### DevOps & Cloud (9 MCPs)

#### Infrastructure (2)
- **Kubernetes** - Container orchestration
- **Terraform** - Infrastructure as Code

#### CI/CD (2)
- **Azure DevOps** - Pipeline automation
- **Buildkite** - CI/CD workflows

#### Cloud Providers (5)
- **AWS** - Amazon Web Services
- **Azure** - Microsoft Azure (2 variants)
- **Cloudflare** - CDN and edge computing (2 variants)

### Testing & Quality (13 MCPs)

#### Testing Frameworks (4)
- **Jest** - JavaScript testing
- **Playwright** - E2E browser testing
- **Cypress** - Component and E2E testing
- **Puppeteer** - Headless browser automation

#### Visual & Component Testing (2)
- **Storybook** - Component development
- **BrowserStack** - Cross-browser testing

#### Testing Tools (3)
- **MCP Inspector** - MCP debugging
- **MCP Tester** - MCP validation
- **Frontend Testing** - UI testing utilities

#### Quality Tools (4)
- **A11y** - Accessibility testing
- **Lighthouse** - Performance auditing
- **Web Vitals** - Core Web Vitals monitoring
- **TestSprite** - API testing

### Build & Framework Tools (5 MCPs)

- **Webpack** - Module bundler
- **Vite** - Fast build tool (appears twice for different configs)
- **Next.js** - React framework
- **Remix** - Full-stack web framework
- **Astro** - Static site generator

### Communication & Documentation (4 MCPs)

- **Slack** - Team communication
- **Discord** - Community integration
- **Confluence** - Documentation platform
- **Notion** - Knowledge base

### AI & Utility Tools (6 MCPs)

- **Memory** - Persistent memory across sessions
- **Sequential Thinking** - Step-by-step reasoning
- **Brave Search** - Web search capabilities
- **Claude Desktop MCP** - Desktop integration
- **Firecrawl** - Web scraping and crawling
- **GitHub** - Repository management

## Agent-Specific MCP Assignments

### Frontend Specialist
- Figma, Shadcn UI, Material UI, Ant Design
- Chakra UI, Radix UI, Mantine, Tailwind CSS
- Vite, Webpack, Next.js, Remix, Astro

### Backend Specialist
- REST API, GraphQL, TestSprite, Fetch
- Stripe, PayPal, AWS, Azure
- Node.js specific tools

### Database Specialist
- All 6 database MCPs
- Multi-Database for cross-platform operations
- Query optimization tools

### DevOps Specialist
- Kubernetes, Terraform, Docker
- Azure DevOps, Buildkite
- AWS, Azure, Cloudflare

### Testing Specialist
- All 13 testing MCPs
- Comprehensive test coverage tools
- Performance monitoring

### Designer Specialist
- All design tool MCPs
- UI component libraries
- Design token management

### Research Agent
- Brave Search for real-time research
- Memory for context retention
- Sequential Thinking for analysis

## How MCP Integration Works

### 1. Automatic Discovery
```typescript
// MCPs are automatically discovered and loaded
const availableMCPs = await MCPManager.discover();
// Returns all 61 configured MCPs
```

### 2. Agent Assignment
```typescript
// Each agent gets relevant MCPs
const frontendMCPs = MCPManager.getForAgent('frontend');
// Returns: [Figma, Shadcn UI, Material UI, ...]
```

### 3. Dynamic Loading
```typescript
// MCPs load only when needed
await agent.useMCP('figma');
// Loads Figma MCP on demand
```

### 4. Cross-Agent Sharing
```typescript
// MCPs can be shared between agents
const sharedMCP = await MCPManager.getShared('github');
// Multiple agents can use same MCP instance
```

## Usage Examples

### Figma Integration
```bash
# Connect to Figma
/figma connect

# Generate component from selection
/figma generate Button

# Sync design tokens
/figma sync

# Export variables
/figma tokens ./tokens.json
```

### Database Operations
```typescript
// Database agent automatically uses PostgreSQL MCP
const result = await dbAgent.optimize('SELECT * FROM users');
// MCP suggests: "Add index on email column"
```

### Testing Automation
```typescript
// Testing agent uses multiple MCPs
await testAgent.runTests({
  unit: 'jest',      // Jest MCP
  e2e: 'playwright', // Playwright MCP
  a11y: true        // A11y MCP
});
```

### Cloud Deployment
```typescript
// DevOps agent orchestrates deployment
await devOpsAgent.deploy({
  infrastructure: 'terraform', // Terraform MCP
  orchestration: 'kubernetes', // Kubernetes MCP
  provider: 'aws'              // AWS MCP
});
```

## Configuration

### MCP Settings
```json
{
  "mcp": {
    "enabled": true,
    "servers": 61,
    "autoLoad": false,
    "sharedContext": true,
    "caching": true
  }
}
```

### Custom MCP Integration
```typescript
// Add custom MCP server
MCPManager.register({
  name: 'custom-tool',
  version: '1.0.0',
  endpoint: 'http://localhost:8080',
  capabilities: ['read', 'write', 'execute']
});
```

## Performance Optimization

### Token Usage
- MCPs reduce token usage by 30-40%
- Shared context between MCPs
- Response caching
- Batch operations

### Parallel Execution
- Multiple MCPs can run simultaneously
- Non-blocking operations
- Queue management for rate limits

## Troubleshooting

### Common Issues

#### MCP Not Loading
```bash
# Check MCP status
/mcp-status figma

# Restart MCP service
/mcp-restart figma
```

#### Connection Errors
```bash
# Verify MCP endpoint
/mcp-test figma

# Check network connectivity
/mcp-ping all
```

#### Performance Issues
```bash
# Enable MCP caching
/mcp-cache enable

# Optimize MCP loading
/mcp-optimize
```

## Best Practices

1. **Selective Loading**: Only load MCPs when needed
2. **Batch Operations**: Group MCP calls for efficiency
3. **Error Handling**: Always handle MCP failures gracefully
4. **Caching**: Enable caching for frequently used MCPs
5. **Monitoring**: Track MCP usage and performance

## Future Additions

We're constantly adding new MCP integrations. Upcoming:
- Jira for project management
- Datadog for monitoring
- Redis for caching
- Elasticsearch for search
- Supabase for backend services

## Contributing

To add a new MCP:
1. Create MCP configuration in `src/mcp/servers/`
2. Add agent mapping in `src/mcp/MCPIntegrationManager.ts`
3. Test with `/mcp-test your-mcp`
4. Submit PR with documentation

## Resources

- [MCP Protocol Spec](https://github.com/modelcontextprotocol/spec)
- [Creating Custom MCPs](./custom-mcp-guide.md)
- [MCP Performance Guide](./mcp-performance.md)
- [Agentwise MCP API](./api/mcp.md)