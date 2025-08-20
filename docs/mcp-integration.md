# MCP Integration Documentation

## Overview
Agentwise features comprehensive Model Context Protocol (MCP) integration, providing specialized AI agents with access to 24+ MCP servers tailored to their expertise areas.

## Architecture

### MCP Integration Manager
Central system that manages all MCP servers and agent assignments:
- Dynamic MCP discovery and registration
- Agent-specific MCP assignment
- Project-optimized MCP selection
- Automatic installation and configuration

### Available MCP Servers

#### Design & UI MCPs
- **Figma**: Design tokens, component export, Dev Mode integration
- **Shadcn UI**: React/Vue/Svelte component libraries
- **Canva**: Design creation and template access

#### Database MCPs
- **PostgreSQL**: Read-only queries, schema inspection
- **MongoDB**: NoSQL operations, aggregation pipelines
- **MySQL**: Database queries, schema management

#### Development MCPs
- **GitHub**: Repository management, PR/issue creation
- **Git**: Version control operations
- **Docker**: Container management, compose operations

#### API & Service MCPs
- **Stripe**: Payment processing, subscriptions
- **PayPal**: Payment services, invoicing
- **Twilio**: SMS, voice calls, notifications
- **Apollo GraphQL**: GraphQL schema orchestration

#### Cloud & Infrastructure MCPs
- **AWS**: AWS services, cost analysis, CDK
- **Azure**: Azure services, storage, Cosmos DB
- **Terraform**: Infrastructure as Code

#### Testing MCPs
- **Playwright**: Browser automation, E2E testing
- **Cypress**: Component and E2E testing
- **Jest**: Unit testing, coverage analysis

#### Documentation MCPs
- **Confluence**: Page management, documentation
- **Notion**: Workspace and database operations

## Agent-Specific MCP Assignments

### Frontend Specialist
```json
{
  "mcpServers": [
    "figma",
    "shadcn-ui",
    "github",
    "playwright",
    "memory"
  ]
}
```

### Backend Specialist
```json
{
  "mcpServers": [
    "postgresql",
    "mongodb",
    "github",
    "docker",
    "jest",
    "memory"
  ]
}
```

### Designer Specialist
```json
{
  "mcpServers": [
    "figma",
    "canva",
    "shadcn-ui",
    "brave-search",
    "memory"
  ]
}
```

### Database Specialist
```json
{
  "mcpServers": [
    "postgresql",
    "mongodb",
    "mysql",
    "memory"
  ]
}
```

### DevOps Specialist
```json
{
  "mcpServers": [
    "docker",
    "aws",
    "terraform",
    "github",
    "memory"
  ]
}
```

## Configuration

### MCP Configuration File
Located at `config/mcp-config.json`:

```json
{
  "mcpServers": {
    "figma": {
      "name": "figma",
      "command": "npx",
      "args": ["-y", "figma-mcp-server"],
      "capabilities": ["design-access", "component-export"],
      "requiredAuth": {
        "type": "token",
        "envVar": "FIGMA_TOKEN"
      }
    }
  },
  "agentMappings": [...],
  "globalSettings": {
    "autoInstall": true,
    "securityMode": "standard",
    "cacheDuration": 3600000
  }
}
```

### Environment Variables
Required environment variables for MCP authentication:

```bash
# Design MCPs
export FIGMA_TOKEN="your-figma-token"
export CANVA_API_KEY="your-canva-key"

# Development MCPs
export GITHUB_TOKEN="your-github-token"

# Database MCPs
export POSTGRES_URL="postgresql://..."
export MONGODB_URI="mongodb://..."

# API MCPs
export STRIPE_API_KEY="your-stripe-key"
export TWILIO_AUTH_TOKEN="your-twilio-token"

# Cloud MCPs
export AWS_ACCESS_KEY_ID="your-aws-key"
export AZURE_SUBSCRIPTION_ID="your-azure-id"
```

## Usage

### Automatic MCP Setup
MCPs are automatically configured when creating a project:

```bash
/create "E-commerce platform with Stripe payments"
# Automatically sets up Stripe MCP for backend agent
```

### Manual MCP Configuration
Add custom MCP mappings for agents:

```typescript
await mcpManager.addCustomMCPMapping(
  'custom-agent',
  ['github', 'postgresql', 'jest'],
  true // auto-install
);
```

### Project-Specific Optimization
MCPs are selected based on project requirements:

```typescript
// Analyzes project specs
const neededMCPs = await mcpManager.analyzeMCPNeeds(projectSpecs);
// Returns: ['stripe', 'postgresql', 'github', 'docker']

// Optimizes MCPs for selected agents
await mcpManager.optimizeMCPsForProject(specs, selectedAgents);
```

## MCP Capabilities

### Design Integration
- **Figma Dev Mode**: Direct access to designs with semantic details
- **Design Tokens**: Extract colors, typography, spacing
- **Component Generation**: Auto-generate UI components from designs

### Database Operations
- **Schema Management**: Inspect and modify database schemas
- **Query Optimization**: Analyze and optimize queries
- **Migration Support**: Generate and run migrations

### Testing Automation
- **Browser Testing**: Automated cross-browser testing
- **Visual Regression**: Compare against design mockups
- **Coverage Analysis**: Track test coverage metrics

### CI/CD Integration
- **GitHub Actions**: Direct pipeline management
- **Docker Builds**: Container creation and deployment
- **Infrastructure Provisioning**: Terraform/CDK integration

## Security

### Authentication Methods
- **API Keys**: Secure key storage in environment variables
- **OAuth 2.0**: Token-based authentication
- **Token Rotation**: Automatic token refresh where supported

### Security Modes
- **Strict**: All MCPs require authentication
- **Standard**: Mixed authentication requirements
- **Permissive**: Development mode with relaxed security

### Access Control
- Agent-specific MCP access
- Read-only database connections
- Scoped permissions per MCP

## Troubleshooting

### Common Issues

#### MCP Installation Fails
```bash
# Check npm/npx availability
which npx

# Manually install MCP
npm install -g figma-mcp-server
```

#### Authentication Errors
```bash
# Verify environment variables
echo $GITHUB_TOKEN

# Check MCP validation
node -e "require('./src/mcp/MCPIntegrationManager').validateMCPSetup()"
```

#### Missing Capabilities
```bash
# List available MCPs
node -e "require('./src/mcp/MCPIntegrationManager').getAvailableMCPs()"

# Check agent MCPs
node -e "require('./src/mcp/MCPIntegrationManager').getMCPsForAgent('frontend-specialist')"
```

## Best Practices

### 1. Environment Setup
- Store credentials securely
- Use `.env` files for local development
- Never commit credentials to version control

### 2. MCP Selection
- Only enable MCPs needed for project
- Consider performance impact
- Monitor MCP usage and costs

### 3. Agent Optimization
- Assign MCPs based on agent expertise
- Avoid overlapping MCP assignments
- Update MCPs as project evolves

## Future Enhancements

- Custom MCP development framework
- MCP marketplace integration
- Performance monitoring dashboard
- Cost optimization recommendations
- MCP orchestration workflows