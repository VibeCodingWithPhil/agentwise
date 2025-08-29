# /setup-mcps

Configure all verified Model Context Protocol (MCP) servers for Claude Code with interactive API key setup.

## Usage

```bash
/setup-mcps              # Interactive setup with API key prompts
/setup-mcps quick        # Quick setup (skip API key prompts)
/setup-mcps check        # Check current MCP status
/setup-mcps list         # List all available verified MCPs
/setup-mcps help         # Show this help message
```

## Description

This command provides an automated way to configure all 25+ verified MCP servers that actually exist and work. It will:
1. Prompt for required API keys interactively
2. Configure each MCP with the correct command
3. Save API keys securely for future use
4. Verify installation and provide status

## Interactive API Key Setup

When you run `/setup-mcps`, you'll be prompted for the following API keys:

### 🔑 Required API Keys

1. **Context7 API Key**
   - Get from: https://context7.com/dashboard
   - Used for: Real-time documentation fetching
   - Example: `ctx7sk-xxxxx-xxxxx-xxxxx`

2. **Figma API Key** (Personal)
   - Get from: Figma Settings > Personal Access Tokens
   - Used for: Design file access and component export
   - Example: `figd_xxxxx-xxxxx`
   - Note: Personal use only - each user needs their own

3. **Firecrawl API Key**
   - Get from: https://firecrawl.dev
   - Used for: Website scraping and cloning
   - Example: `fc-xxxxx-xxxxx`

4. **GitHub Personal Access Token**
   - Get from: GitHub Settings > Developer Settings > Personal Access Tokens
   - Used for: Repository management and GitHub API access
   - Permissions needed: repo, workflow, read:org

5. **Brave Search API Key**
   - Get from: https://brave.com/search/api/
   - Used for: Web search capabilities
   - Free tier available

6. **Upstash Redis URL**
   - Get from: https://upstash.com
   - Used for: Context persistence and distributed sessions
   - Format: `https://xxxxx.upstash.io`

7. **PostgreSQL Connection String** (Optional)
   - Format: `postgresql://user:pass@localhost/dbname`
   - Used for: Database operations

8. **MySQL Connection String** (Optional)
   - Format: `mysql://user:pass@localhost/dbname`
   - Used for: MySQL database operations

9. **Canva API Key** (Optional)
   - Get from: Canva Developer Portal
   - Used for: Design creation and templates

10. **Azure DevOps Token** (Optional)
    - Get from: Azure DevOps > User Settings > Personal Access Tokens
    - Used for: CI/CD and work item management

## Verified MCP Servers (25 Total)

### ✅ Core Official MCPs (7)
- `filesystem` - File operations
- `memory` - Persistent context
- `fetch` - HTTP requests
- `puppeteer` - Browser automation
- `brave-search` - Web search
- `sequential-thinking` - Multi-step reasoning
- `everything` - Comprehensive utilities

### ✅ Design & UI MCPs (4)
- `figma-dev-mode` - Figma Dev Mode (local server)
- `figma-personal` - Personal Figma access
- `shadcn` - Component library
- `canva` - Design creation

### ✅ Development MCPs (4)
- `github` - GitHub integration
- `git-mcp` - Git operations
- `docker-mcp` - Container management
- `context7` - Real-time docs

### ✅ Database MCPs (4)
- `postgresql` - PostgreSQL operations
- `mysql` - MySQL operations
- `postgres-advanced` - Advanced PostgreSQL
- `database-multi` - Multi-database support

### ✅ Testing MCPs (4)
- `playwright` - Browser testing
- `testsprite` - API testing
- `mcp-inspector` - MCP debugging
- `mcp-tester` - MCP validation

### ✅ Infrastructure MCPs (2)
- `kubernetes` - K8s management
- `azure-devops` - CI/CD pipelines

### ✅ Additional MCPs (3)
- `firecrawl` - Web scraping
- `upstash-context` - Redis context
- `rest-api` - API testing

## Setup Process

### Step 1: Run Interactive Setup
```bash
agentwise setup-mcps
```

### Step 2: Enter API Keys
You'll be prompted for each API key with:
- Clear description of what it's for
- Where to get it
- Example format
- Option to skip (press Enter)

Example prompt:
```
🔑 Context7 API Key
   Get from: https://context7.com/dashboard
   Used for: Real-time documentation fetching
   Format: ctx7sk-xxxxx-xxxxx-xxxxx
   
   Enter key (or press Enter to skip): 
```

### Step 3: Automatic Configuration
The command will:
1. Save API keys to `.env.local` (gitignored)
2. Configure each MCP with Claude CLI
3. Build necessary servers from source
4. Verify installation

### Step 4: Restart Claude Code
After setup, restart Claude Code to activate MCPs.

## Quick Setup Mode

For users who already have API keys in environment:
```bash
agentwise setup-mcps quick
```

This will:
- Skip API key prompts
- Use existing environment variables
- Configure all MCPs automatically

## Checking Status

### List Configured MCPs
```bash
agentwise setup-mcps check
```

This will show:
- Currently configured MCPs in Claude
- Running local MCP servers
- Port status for local servers

### Verify Installation
```bash
claude mcp list
```

## Local MCP Servers

Some MCPs run as local servers and need to be started:

### Figma Dev Mode (Port 3845)
```bash
# Start server
cd ~/.claude/mcps/figma-dev-mode
npm start

# Or run in background
nohup npm start > figma.log 2>&1 &
```

## Configuration Files

### `.env.local` (Created automatically, gitignored)
```env
# MCP API Keys (DO NOT COMMIT)
CONTEXT7_API_KEY=your-key-here
FIGMA_API_KEY=your-key-here
FIRECRAWL_API_KEY=your-key-here
GITHUB_PAT=your-token-here
BRAVE_API_KEY=your-key-here
UPSTASH_REDIS_REST_URL=your-url-here
POSTGRES_URL=postgresql://user:pass@localhost/db
MYSQL_URL=mysql://user:pass@localhost/db
CANVA_API_KEY=your-key-here
AZURE_DEVOPS_TOKEN=your-token-here
```

### Project-specific vs User-specific
- **Project MCPs**: Stored in `.claude.json` in project
- **User MCPs**: Can be configured globally
- **API Keys**: Always in `.env.local` (never committed)

## Troubleshooting

### MCP Not Working
1. Check if configured: `claude mcp list`
2. Verify environment variables are set
3. For local servers, check if running: `lsof -ti:PORT`
4. Re-run setup: `agentwise setup-mcps`

### Authentication Issues
1. Ensure API keys/tokens are valid
2. Check `.env` file has correct values
3. Some MCPs require paid accounts (Figma Dev Mode, etc.)

### Installation Failed
1. Check npm/node versions
2. Clear npm cache: `npm cache clean --force`
3. Try manual installation: `npm install -g @mcp-package-name`

## Examples

### Setup All MCPs
```bash
agentwise setup-mcps
# Select: 🚀 Setup All MCPs (Recommended)
# Skip install: No
# Verbose: Yes
```

### Setup Essential MCPs Only
```bash
agentwise setup-mcps
# Select: 🎯 Setup Essential MCPs Only
# This installs: Development, Database, Testing, Design categories
```

### Check What's Configured
```bash
agentwise setup-mcps check
# Shows all configured MCPs and their status
```

### Generate Environment Template
```bash
agentwise setup-mcps env
# Creates .env.mcp.template with all required variables
```

## Benefits

1. **Automated Configuration**: No manual Claude CLI commands needed
2. **Batch Installation**: Configure multiple MCPs at once
3. **Smart Categorization**: Organized by function
4. **Environment Management**: Automatic .env template generation
5. **Status Monitoring**: Check configuration and running servers
6. **Agent Integration**: MCPs automatically available to relevant agents

## Security Notes

- Never commit `.env` files with real API keys
- Use `.env.example` for templates
- Rotate API keys regularly
- Some MCPs require paid services
- Local servers should be secured if exposed

## Next Steps

After running `/setup-mcps`:
1. Restart Claude Code (Cmd+Q and reopen)
2. Run `/mcp` to verify MCPs are available
3. Test with: "use context7 for Next.js docs"
4. MCPs will activate as agents need them

## MCP Commands for Manual Setup

If you prefer manual setup, here are the verified commands:

```bash
# Core Official MCPs
claude mcp add playwright npx @playwright/mcp@latest
claude mcp add puppeteer -- npx -y @modelcontextprotocol/server-puppeteer
claude mcp add memory -- npx -y @modelcontextprotocol/server-memory
claude mcp add brave-search -- npx -y @modelcontextprotocol/server-brave-search
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
claude mcp add fetch -- npx -y @modelcontextprotocol/server-fetch
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem
claude mcp add everything -- npx -y @modelcontextprotocol/server-everything

# Design MCPs
claude mcp add --transport http figma-dev-mode-mcp-server http://127.0.0.1:3845/mcp
claude mcp add "Framelink_Figma_MCP" -- npx -y figma-developer-mcp --figma-api-key=YOUR_KEY --stdio
pnpm dlx shadcn@latest mcp init --client claude
claude mcp add canva-dev -- npx -y @canva/cli@latest mcp

# Development MCPs
claude mcp add --transport http github https://api.githubcopilot.com/mcp -H "Authorization: Bearer YOUR_GITHUB_PAT"
claude mcp add git-mcp -- npx -y git-mcp
claude mcp add docker-mcp -- npx -y docker-mcp

# Context & Scraping
claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: YOUR_KEY"
claude mcp add firecrawl -e FIRECRAWL_API_KEY=YOUR_KEY -- npx -y firecrawl-mcp
claude mcp add upstash-context -- npx -y @upstash/context-mcp

# Database MCPs (requires building from source)
# PostgreSQL: https://github.com/modelcontextprotocol/servers-archived/tree/HEAD/src/postgres
claude mcp add mcp_server_mysql

# Testing & Infrastructure
claude mcp add rest-api -- npx -y @smithery/cli install dkmaker-mcp-rest-api --client claude
claude mcp add testsprite -- npm install -g @testsprite/testsprite-mcp@latest
claude mcp add postgres-advanced -- npm install -g @henkey/postgres-mcp-server
claude mcp add database-multi -- npx -y @executeautomation/database-server
claude mcp add kubernetes -- npx kubernetes-mcp-server@latest
claude mcp add azure-devops -- npx -y @azure-devops/mcp
claude mcp add mcp-inspector -- npx @modelcontextprotocol/inspector
claude mcp add mcp-tester -- npx -y mcp-server-tester
```

## Support

For issues or questions:
- Check documentation: https://docs.agentwise.ai/mcps
- GitHub Issues: https://github.com/yourusername/agentwise/issues
- Run help: `agentwise setup-mcps help`