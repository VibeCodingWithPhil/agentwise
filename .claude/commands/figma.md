# /figma

Complete Figma integration for Agentwise, enabling pixel-perfect design-to-code conversion with full application generation.

## Overview

The Figma integration allows you to transform any Figma design into production-ready code with 100% pixel accuracy. It leverages the Figma Dev Mode MCP server, multiple Figma MCPs, and Agentwise's multi-agent system to create complete applications from designs.

## Quick Start

```bash
# 1. Authenticate with Figma
/figma-auth

# 2. List your projects
/figma-list

# 3. Select a design
/figma-select <file-id>

# 4. Generate code
/figma-generate

# 5. Or create full application
/figma-create my-app
```

## Available Commands

### Authentication & Setup
- **`/figma-auth`** - Authenticate with Figma account
- **`/setup-mcps`** - Configure Figma MCPs for Claude Code

### Design Access
- **`/figma-list`** - List teams, projects, and files
- **`/figma-select`** - Select design for conversion
- **`/figma-inspect`** - Analyze design structure

### Code Generation
- **`/figma-generate`** - Generate pixel-perfect components
- **`/figma-create`** - Create complete application
- **`/figma-sync`** - Keep code synced with designs

### Additional Tools
- **`/figma-tokens`** - Export design tokens
- **`/figma-assets`** - Export images and icons
- **`/figma-preview`** - Preview generated code
- **`/figma-deploy`** - Deploy generated application

## Pixel-Perfect Code Generation

### How It Works

1. **Design Analysis**
   - Extracts complete design structure
   - Identifies components and patterns
   - Analyzes layouts and constraints
   - Detects interactions and animations

2. **Intelligent Conversion**
   - Maps designs to framework components
   - Preserves exact styling and spacing
   - Maintains responsive behavior
   - Includes accessibility features

3. **Full Stack Generation**
   - Creates frontend from designs
   - Generates backend from context
   - Sets up database schemas
   - Implements business logic

## Supported Frameworks

### Frontend
- **React** (TypeScript, Next.js)
- **Vue** (Vue 3, Nuxt)
- **Angular** (Standalone components)
- **React Native** (iOS/Android)
- **Flutter** (Cross-platform)
- **SwiftUI** (Native iOS)
- **HTML/CSS** (No framework)

### Backend (Auto-generated)
- **Node.js** (Express, NestJS)
- **Python** (FastAPI, Django)
- **Go** (Gin, Fiber)
- **Rust** (Actix, Rocket)

## MCP Integration

### Figma Dev Mode MCP Server
- **Official Figma server** (requires paid plan)
- **Local server** at http://127.0.0.1:3845
- **Real-time sync** with Figma desktop
- **Code Connect** support

### Figma Context MCP
- **Enhanced analysis** by @GLips
- **Layout information** extraction
- **Component relationships**
- **No enterprise license** required

### Additional MCPs
- **Upstash Context** - Session management
- **Playwright** - Testing generated UI
- **Database MCPs** - Backend integration

## Design-to-Application Workflow

### Step 1: Authenticate
```bash
/figma-auth token
# Enter your Figma personal access token
```

### Step 2: Browse Designs
```bash
/figma-list
# Shows all your teams and recent files

/figma-list projects team_123
# Lists projects in specific team

/figma-list files project_456
# Shows files in project
```

### Step 3: Select Design
```bash
/figma-select file_ABC123
# Selects entire file

/figma-select file_ABC123 node:789
# Selects specific frame/component
```

### Step 4: Inspect & Analyze
```bash
/figma-inspect --deep
# Analyzes design structure
# Shows components, tokens, patterns
# Recommends tech stack
```

### Step 5: Generate Application
```bash
/figma-create my-app --fullstack
# Creates complete application:
# - Pixel-perfect frontend
# - API backend
# - Database setup
# - Authentication
# - Deployment config
```

## Context-Aware Features

### Automatic Detection

From your designs, Agentwise automatically detects and implements:

#### Authentication Systems
- Login/Signup screens → JWT authentication
- Social login buttons → OAuth integration
- Password fields → Secure hashing

#### Data Management
- Table designs → Database schemas
- Form layouts → API endpoints
- List views → CRUD operations

#### E-commerce
- Product cards → Shopping cart
- Checkout forms → Payment integration
- Order screens → Order management

#### Real-time Features
- Chat interfaces → WebSocket setup
- Notifications → Push services
- Live feeds → Real-time updates

## Advanced Capabilities

### Design Token System
```bash
/figma-tokens export
```
- Color palettes
- Typography scales
- Spacing systems
- Component tokens

### Responsive Design
```bash
/figma-generate --responsive
```
- All breakpoints
- Fluid typography
- Flexible layouts
- Container queries

### Dark Mode
```bash
/figma-generate --dark-mode
```
- Automatic theme generation
- System preference detection
- Smooth transitions

### Accessibility
```bash
/figma-generate --a11y
```
- ARIA labels
- Keyboard navigation
- Screen reader support
- WCAG compliance

## Multi-Agent Orchestration

The Figma workflow uses specialized agents:

1. **Designer Agent**
   - Analyzes design system
   - Ensures pixel perfection
   - Validates consistency

2. **Frontend Agent**
   - Generates UI components
   - Implements interactions
   - Sets up routing

3. **Backend Agent**
   - Creates API from context
   - Sets up database
   - Implements logic

4. **Testing Agent**
   - Writes component tests
   - Creates E2E scenarios
   - Validates accessibility

5. **DevOps Agent**
   - Configures deployment
   - Sets up CI/CD
   - Optimizes performance

## Real-time Synchronization

### Watch Mode
```bash
/figma-sync --watch
```
- Monitors design changes
- Auto-updates code
- Preserves customizations
- Commits changes

### Design Versioning
- Tags code with design versions
- Tracks design history
- Enables rollback
- Manages branches

## Quality Assurance

### Generated Code Includes
- ✅ TypeScript types
- ✅ Unit tests
- ✅ Integration tests
- ✅ Storybook stories
- ✅ Documentation
- ✅ Linting setup
- ✅ Performance optimization

### Validation
- Pixel-perfect accuracy
- Responsive behavior
- Accessibility compliance
- Performance metrics
- Security scanning

## Examples

### SaaS Dashboard
```bash
# Select dashboard design
/figma-select file_DASHBOARD

# Create full SaaS application
/figma-create saas-platform \
  --backend=fullstack \
  --auth=auth0 \
  --database=postgres \
  --payments=stripe
```

### Mobile App
```bash
# Select mobile designs
/figma-select file_MOBILE --frames="iPhone/*"

# Generate React Native app
/figma-generate \
  --framework=react-native \
  --backend=api
```

### Marketing Website
```bash
# Select landing pages
/figma-select file_LANDING

# Generate static site
/figma-generate \
  --framework=html \
  --style=tailwind \
  --animations \
  --seo
```

## Deployment

### Automatic Deployment Setup
```bash
/figma-deploy
```
Configures:
- Vercel/Netlify for frontend
- AWS/GCP for backend
- Database hosting
- CDN setup
- SSL certificates

## Troubleshooting

### Common Issues

#### Figma MCP Server Not Running
```bash
# Start Figma desktop app
# Enable in Preferences > Dev Mode MCP Server
# Verify at http://127.0.0.1:3845
```

#### Missing Design Data
```bash
# Use Figma Context MCP as fallback
/setup-mcps
# Install @glips/figma-context-mcp
```

#### Code Generation Issues
```bash
# Validate design first
/figma-inspect --validate

# Check for missing tokens
/figma-tokens check
```

## Best Practices

1. **Organize Designs**
   - Use consistent naming
   - Create component libraries
   - Define design tokens
   - Document patterns

2. **Prepare for Generation**
   - Name layers properly
   - Use auto-layout
   - Define components
   - Set up variants

3. **Optimize Results**
   - Review generated code
   - Customize as needed
   - Run tests
   - Profile performance

## Support & Resources

- **Documentation**: https://docs.agentwise.ai/figma
- **Figma Dev Mode**: Requires paid plan
- **MCP Servers**: Install via `/setup-mcps`
- **Community**: Discord/Slack channels

## Summary

The Figma integration transforms the design-to-development workflow:
- 🎨 **100% pixel-perfect** code generation
- 🚀 **Full-stack applications** from designs
- 🔄 **Real-time sync** with design changes
- 🤖 **AI-powered** context understanding
- 📦 **Production-ready** output

Start with `/figma-auth` and transform your Figma designs into fully functional applications!