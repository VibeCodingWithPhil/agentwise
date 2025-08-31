# GitHub Setup

Complete GitHub repository setup with CI/CD, security, and secrets management.

## Usage

```bash
@github-setup [options]
```

## Options

- `--owner <string>` - GitHub username or organization (required)
- `--repo <string>` - Repository name (optional, will prompt if not provided)
- `--type <node|python|go|static>` - Project type for quick setup (optional)
- `--private` - Create private repository (default: public)
- `--auth-method <cli|token|ssh|oauth>` - Authentication method (default: auto-detect)
- `--env-file <path>` - Environment file to sync secrets from (default: .env)
- `--dry-run` - Preview actions without making changes
- `--skip-ci` - Skip CI/CD pipeline setup
- `--skip-security` - Skip security scanning setup
- `--skip-secrets` - Skip secrets synchronization

## Examples

```bash
# Quick setup for Node.js project
@github-setup --owner myusername --repo my-node-app --type node

# Custom setup with specific options
@github-setup --owner myorg --repo my-project --private --env-file .env.production

# Setup with existing repository
@github-setup --owner myusername --repo existing-repo --skip-ci

# Dry run to preview changes
@github-setup --owner myusername --repo test-repo --dry-run
```

## Features

### 🔐 Authentication
- **Multi-method**: Automatically tries GitHub CLI, SSH keys, tokens, and OAuth
- **Secure storage**: Credentials stored securely in ~/.agentwise/
- **Auto-detection**: Detects and uses existing GitHub CLI authentication

### 📁 Repository Management
- **Create new**: Set up new repositories with templates
- **Connect existing**: Connect to and configure existing repositories
- **Branch protection**: Configure branch protection rules
- **Webhooks**: Set up webhook integrations

### ⚙️ CI/CD Pipeline
- **GitHub Actions**: Generate comprehensive workflow files
- **Multi-language**: Support for Node.js, Python, Go, and more
- **Testing**: Automated test execution with coverage
- **Deployment**: Configure deployment to various platforms

### 🔒 Security
- **CodeQL**: Automated code scanning
- **Dependency review**: Security analysis of dependencies  
- **Secret scanning**: Detect exposed secrets
- **Vulnerability alerts**: Automated security updates

### 🔑 Secrets Management
- **Environment sync**: Sync .env files to GitHub secrets
- **Bulk operations**: Manage multiple secrets efficiently
- **Validation**: Ensure secret names follow GitHub requirements
- **Backup**: Export and backup secret configurations

## Project Types

### Node.js (`--type node`)
- Sets up npm-based workflows
- Configures Node.js versions: 16, 18, 20
- Includes linting, testing, and building
- Creates package.json and .gitignore

### Python (`--type python`)
- Sets up pip-based workflows  
- Configures Python versions: 3.8, 3.9, 3.10, 3.11
- Includes pytest and flake8
- Creates requirements.txt and .gitignore

### Go (`--type go`)
- Sets up Go module workflows
- Configures Go versions: 1.19, 1.20, 1.21
- Includes testing and building
- Creates go.mod and .gitignore

### Static Site (`--type static`)
- Sets up static site deployment
- Configures Netlify/Vercel deployment
- Creates basic HTML template
- Sets up build/deploy pipeline

## Configuration

The command will create/update the following files:

### GitHub Actions Workflows
- `.github/workflows/ci.yml` - Continuous Integration
- `.github/workflows/test.yml` - Test execution
- `.github/workflows/security.yml` - Security scanning
- `.github/workflows/deploy-production.yml` - Deployment (if configured)

### Repository Settings
- Branch protection rules on main/master
- Required status checks
- Pull request reviews
- Admin enforcement settings

### Secrets
- Syncs environment variables from .env files
- Excludes common non-secret variables
- Validates secret names against GitHub requirements
- Provides dry-run option to preview changes

## Interactive Setup

If no options are provided, the command will start an interactive setup:

1. **Authentication**: Choose or configure authentication method
2. **Repository**: Select existing or create new repository
3. **Project Type**: Choose from templates or custom configuration
4. **CI/CD**: Configure workflows and pipelines
5. **Security**: Enable security scanning features
6. **Secrets**: Configure secret synchronization
7. **Review**: Preview and confirm all changes

## Post-Setup

After successful setup, you'll receive:

- 📊 **Summary report** of all configured features
- 🔗 **Repository URL** and access information  
- 📋 **Next steps** for development workflow
- 🚀 **Commands** to clone and start development

## Environment Variables

The command recognizes these environment variables:

- `GITHUB_TOKEN` - Personal access token
- `GH_TOKEN` - Alternative token variable
- `GITHUB_USERNAME` - Default username
- `GITHUB_ORG` - Default organization

## Troubleshooting

### Authentication Issues
```bash
# Check GitHub CLI status
gh auth status

# Login to GitHub CLI
gh auth login

# Set token manually
export GITHUB_TOKEN="your_token_here"
```

### Permission Issues
- Ensure token has `repo` and `workflow` scopes
- Check organization permissions for private repos
- Verify SSH key is added to GitHub account

### Repository Issues
- Repository name must be unique within owner scope
- Check if repository already exists
- Ensure owner has permission to create repositories

## Related Commands

- `@github-sync` - Sync local changes with GitHub
- `@github-secrets` - Manage repository secrets
- `gh repo create` - GitHub CLI repository creation
- `gh workflow run` - Trigger workflow runs

## Examples

### Complete Node.js Setup
```bash
@github-setup --owner mycompany --repo awesome-app --type node --private
```

This creates:
- Private repository with Node.js template
- CI/CD pipeline with npm workflows
- Security scanning with CodeQL
- Branch protection on main branch
- Synced secrets from .env file

### Custom Configuration
```bash
@github-setup --owner myusername --repo custom-project \
  --skip-ci --env-file .env.staging --dry-run
```

This previews:
- Repository creation/connection
- Security setup (CI skipped)
- Secret sync from .env.staging
- No actual changes made (dry run)

### Existing Repository Setup
```bash
@github-setup --owner myteam --repo existing-repo \
  --auth-method token --skip-secrets
```

This configures:
- Connect to existing repository
- Use token authentication
- Set up CI/CD and security
- Skip secret synchronization

---

**Need help?** Run `@github-setup --help` or check the [GitHub Integration Documentation](../../docs/github-integration.md).