# /figma-auth

Authenticate with Figma to enable access to your design files, projects, and teams for design-to-code conversion.

## Usage

```bash
/figma-auth                    # Start authentication flow
/figma-auth status            # Check authentication status
/figma-auth refresh           # Refresh authentication token
/figma-auth logout            # Clear authentication
```

## Description

This command handles Figma authentication using OAuth2 flow or Personal Access Token, enabling Agentwise to access your Figma designs for pixel-perfect code generation.

## Authentication Methods

### 1. Personal Access Token (Recommended)
```bash
/figma-auth token
```
- Generate token at: https://www.figma.com/developers/api#access-tokens
- Scopes needed: `file_read`, `file_dev_resources`
- Stored securely in `.env` file

### 2. OAuth2 Flow
```bash
/figma-auth oauth
```
- Redirects to Figma for authorization
- Automatically handles callback
- Stores refresh token for persistent access

### 3. Dev Mode MCP Server
```bash
/figma-auth dev-mode
```
- Requires Figma Dev Mode (paid plan)
- Connects to local server at http://127.0.0.1:3845
- Enables real-time design sync

## Configuration

### Environment Variables
```env
# Figma Authentication
FIGMA_ACCESS_TOKEN=your_personal_access_token
FIGMA_CLIENT_ID=your_oauth_client_id
FIGMA_CLIENT_SECRET=your_oauth_client_secret
FIGMA_TEAM_ID=your_team_id

# Dev Mode MCP Server
FIGMA_DEV_MODE_ENABLED=true
FIGMA_DEV_MODE_PORT=3845
```

## Features

### After Authentication
- List all teams and projects
- Access design files
- Extract components and styles
- Generate pixel-perfect code
- Sync design tokens
- Monitor design changes

### Permissions Required
- **Read access**: View files and projects
- **Dev resources**: Access developer features
- **Code Connect**: Link designs to code (Enterprise)

## Examples

### Authenticate with Token
```bash
/figma-auth token
# Enter your personal access token when prompted
# Token is validated and stored securely
```

### Check Authentication Status
```bash
/figma-auth status
# Shows:
# - Authentication method (Token/OAuth)
# - Connected team
# - Available permissions
# - Token expiration (if applicable)
```

### Enable Dev Mode Server
```bash
/figma-auth dev-mode
# Checks if Figma desktop is running
# Verifies Dev Mode server at port 3845
# Connects for real-time sync
```

## Security

- Tokens are never logged or exposed
- Stored in `.env` with restricted permissions
- OAuth tokens auto-refresh before expiration
- Supports token rotation

## Troubleshooting

### Authentication Failed
- Verify token has correct scopes
- Check if token is expired
- Ensure Figma API access is enabled

### Dev Mode Not Working
- Requires Figma desktop app running
- Needs Dev/Full seat on paid plan
- Enable in Figma Preferences > Dev Mode MCP Server

### No Projects Found
- Verify team permissions
- Check if projects are shared with you
- Ensure token has file_read scope

## Next Steps

After authentication:
1. Run `/figma-list` to see your projects
2. Use `/figma-select` to choose a project
3. Run `/figma-generate` to create code
4. Use `/figma-sync` for real-time updates