# GitHub Secrets

Manage GitHub repository and organization secrets with advanced synchronization and security features.

## Usage

```bash
@github-secrets [command] [options]
```

## Commands

- `sync` - Synchronize secrets from environment files
- `list` - List all repository or organization secrets
- `get` - Get secret metadata (not the actual value)
- `set` - Create or update a secret
- `delete` - Delete secrets
- `compare` - Compare local environment with GitHub secrets
- `backup` - Backup secret configurations
- `restore` - Restore secrets from backup

## Options

- `--owner <string>` - GitHub username or organization (required)
- `--repo <string>` - Repository name (required for repo secrets)
- `--org` - Manage organization secrets instead of repository secrets
- `--env-file <path>` - Environment file path (default: .env)
- `--dry-run` - Preview changes without making them
- `--force` - Force operation without confirmation
- `--prefix <string>` - Only process secrets with this prefix
- `--include <pattern>` - Include secrets matching pattern (can be used multiple times)
- `--exclude <pattern>` - Exclude secrets matching pattern (can be used multiple times)
- `--overwrite` - Overwrite existing secrets

## Examples

### Sync Operations
```bash
# Sync .env file to repository secrets
@github-secrets sync --owner myusername --repo my-project

# Sync with specific environment file
@github-secrets sync --owner myusername --repo project --env-file .env.production

# Dry run to preview sync
@github-secrets sync --owner myusername --repo project --dry-run

# Sync to organization secrets
@github-secrets sync --owner myorg --org --env-file .env.shared
```

### List and Query Operations
```bash
# List repository secrets
@github-secrets list --owner myusername --repo my-project

# List organization secrets
@github-secrets list --owner myorg --org

# Compare local .env with GitHub secrets
@github-secrets compare --owner myusername --repo project
```

### Individual Secret Operations
```bash
# Set a single secret
@github-secrets set API_KEY "your-secret-value" --owner user --repo project

# Get secret metadata
@github-secrets get API_KEY --owner user --repo project

# Delete a secret
@github-secrets delete API_KEY --owner user --repo project
```

### Backup and Restore
```bash
# Backup secret configurations
@github-secrets backup --owner user --repo project --output secrets-backup.json

# Restore from backup
@github-secrets restore --owner user --repo project --input secrets-backup.json
```

## Features

### 🔄 Environment Synchronization
- **Automatic parsing**: Reads .env, .env.local, .env.production files
- **Smart filtering**: Excludes common non-secret variables
- **Pattern matching**: Include/exclude based on patterns
- **Validation**: Ensures secret names meet GitHub requirements

### 🔐 Security Features
- **Encryption**: All secrets encrypted before upload
- **Secure storage**: Uses GitHub's encryption at rest
- **Access control**: Repository and organization level permissions
- **Audit trail**: Track secret creation and updates

### 📊 Management Tools
- **Bulk operations**: Handle multiple secrets efficiently
- **Conflict resolution**: Handle overwrites intelligently
- **Status reporting**: Detailed operation summaries
- **Backup/Restore**: Export and import secret configurations

### 🎯 Advanced Features
- **Organization secrets**: Manage org-wide secrets
- **Repository selection**: Control which repos can access org secrets
- **Environment targeting**: Different secrets for different environments
- **Template generation**: Create .env.example files

## Command Details

### Sync Command
```bash
@github-secrets sync [options]
```

Synchronizes environment variables from local files to GitHub secrets.

**Options:**
- `--env-file <path>` - Source environment file (default: .env)
- `--prefix <string>` - Only sync variables with this prefix
- `--exclude <pattern>` - Exclude variables matching pattern
- `--include <pattern>` - Include only variables matching pattern
- `--overwrite` - Overwrite existing secrets (default: false)
- `--dry-run` - Preview without making changes

**Example:**
```bash
@github-secrets sync --owner myteam --repo api-server \
  --env-file .env.production \
  --prefix "API_" \
  --exclude "*_LOCAL" \
  --overwrite
```

### List Command
```bash
@github-secrets list [options]
```

Lists all secrets with their metadata (not actual values).

**Output includes:**
- Secret name
- Creation date
- Last updated date
- Organization visibility (for org secrets)

**Example:**
```bash
@github-secrets list --owner mycompany --org
```

### Set Command
```bash
@github-secrets set <name> <value> [options]
```

Creates or updates a single secret.

**Options:**
- `--description <text>` - Add description to secret
- `--overwrite` - Allow overwriting existing secrets

**Example:**
```bash
@github-secrets set DATABASE_URL "postgresql://user:pass@host/db" \
  --owner myteam --repo backend \
  --description "Production database connection"
```

### Compare Command
```bash
@github-secrets compare [options]
```

Compares local environment files with GitHub secrets.

**Output shows:**
- Secrets only in local environment
- Secrets only in GitHub
- Secrets present in both
- Recommendations for sync

**Example:**
```bash
@github-secrets compare --owner myteam --repo project --env-file .env.staging
```

### Delete Command
```bash
@github-secrets delete <name> [options]
```

Deletes one or more secrets.

**Options:**
- `--pattern <glob>` - Delete multiple secrets matching pattern
- `--force` - Skip confirmation prompt
- `--dry-run` - Preview deletions

**Example:**
```bash
# Delete single secret
@github-secrets delete OLD_API_KEY --owner user --repo project

# Delete multiple secrets with pattern
@github-secrets delete --pattern "TEMP_*" --owner user --repo project --force
```

## Environment File Parsing

### Supported Formats
```bash
# Standard key=value
API_KEY=abc123
DATABASE_URL=postgresql://localhost/mydb

# Quoted values
SECRET_KEY="my secret with spaces"
JSON_CONFIG='{"key": "value"}'

# Comments and empty lines
# This is a comment
API_VERSION=v1

# Complex values
PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC..."
```

### Auto-Exclusion Rules

The following patterns are automatically excluded from sync:
- `NODE_ENV`, `PORT`, `HOST` - Common non-secret variables
- `PUBLIC_*`, `NEXT_PUBLIC_*`, `REACT_APP_*` - Public environment variables
- `*_URL` ending in localhost or 127.0.0.1 - Local development URLs
- Comments and empty lines

### Custom Filtering
```bash
# Include only API keys
@github-secrets sync --include "*_API_KEY" --include "*_SECRET"

# Exclude development and test variables
@github-secrets sync --exclude "*_DEV" --exclude "*_TEST" --exclude "*_LOCAL"

# Sync only production variables
@github-secrets sync --prefix "PROD_"
```

## Organization Secrets

### Creating Organization Secrets
```bash
@github-secrets set SHARED_API_KEY "value" --owner myorg --org \
  --visibility private \
  --selected-repos "repo1,repo2"
```

**Visibility Options:**
- `all` - All repositories in organization
- `private` - Only private repositories
- `selected` - Specific repositories only

### Managing Repository Access
```bash
# Grant access to specific repositories
@github-secrets set-repo-access SHARED_SECRET --owner myorg --org \
  --add-repos "new-repo,another-repo"

# Remove repository access
@github-secrets set-repo-access SHARED_SECRET --owner myorg --org \
  --remove-repos "old-repo"
```

## Backup and Restore

### Creating Backups
```bash
@github-secrets backup --owner myteam --repo project \
  --output backups/secrets-$(date +%Y%m%d).json \
  --encrypt --password "backup-password"
```

**Backup includes:**
- Secret names and metadata
- Creation/update timestamps
- Organization visibility settings
- Repository access lists

### Restoring from Backup
```bash
@github-secrets restore --owner myteam --repo new-project \
  --input backups/secrets-20231201.json \
  --decrypt --password "backup-password" \
  --dry-run
```

## Advanced Configuration

### Configuration File
Create `.agentwise/github-secrets.json`:
```json
{
  "defaultOwner": "mycompany",
  "autoExclude": [
    "NODE_ENV",
    "*_LOCAL",
    "*_DEV",
    "PUBLIC_*"
  ],
  "autoInclude": [
    "*_API_KEY",
    "*_SECRET",
    "*_TOKEN"
  ],
  "backupDirectory": "~/.agentwise/backups",
  "encryptBackups": true
}
```

### Repository Configuration
Create `.github/secrets.yml`:
```yaml
secrets:
  sources:
    - .env.production
    - .env.staging
  exclude:
    - "*_LOCAL"
    - "*_DEV"
  include:
    - "API_*"
    - "*_SECRET"
  validation:
    required:
      - "DATABASE_URL"
      - "API_KEY"
    optional:
      - "REDIS_URL"
```

## Validation and Security

### Secret Name Validation
GitHub secret names must:
- Contain only alphanumeric characters and underscores
- Not start with `GITHUB_`
- Not start with a number
- Be maximum 200 characters
- Be case insensitive

### Security Best Practices
- ✅ Use strong, unique secrets
- ✅ Rotate secrets regularly
- ✅ Use organization secrets for shared resources
- ✅ Limit repository access appropriately
- ❌ Don't store secrets in code or comments
- ❌ Don't use predictable secret names

### Automatic Validation
```bash
# Validate secret names before sync
@github-secrets sync --validate-names --dry-run

# Check for common security issues
@github-secrets audit --owner myteam --repo project
```

## Integration Examples

### CI/CD Pipeline Secrets
```bash
# Development environment
@github-secrets sync --owner myteam --repo project \
  --env-file .env.development \
  --prefix "DEV_"

# Staging environment
@github-secrets sync --owner myteam --repo project \
  --env-file .env.staging \
  --prefix "STAGING_"

# Production environment
@github-secrets sync --owner myteam --repo project \
  --env-file .env.production \
  --prefix "PROD_"
```

### Multi-Repository Setup
```bash
# Sync shared secrets to organization
@github-secrets sync --owner mycompany --org \
  --env-file .env.shared \
  --visibility selected \
  --selected-repos "api,frontend,backend"

# Sync repository-specific secrets
@github-secrets sync --owner mycompany --repo api \
  --env-file .env.api-specific
```

### Development Workflow
```bash
# Daily sync check
@github-secrets compare --owner myteam --repo project

# Update secrets after configuration changes
@github-secrets sync --owner myteam --repo project --overwrite

# Backup before major changes
@github-secrets backup --owner myteam --repo project \
  --output "backup-$(date +%Y%m%d).json"
```

## Monitoring and Auditing

### Usage Reports
```bash
# Generate secret usage report
@github-secrets report --owner myteam --repo project \
  --format json --output secrets-report.json

# Check secret age and rotation needs
@github-secrets audit --owner myteam --repo project --check-age
```

### Integration with Monitoring
```bash
# Export metrics for monitoring systems
@github-secrets metrics --owner myteam --repo project \
  --format prometheus --output metrics.txt
```

## Troubleshooting

### Common Issues

#### Authentication Errors
```bash
# Check GitHub authentication
gh auth status

# Re-authenticate with required scopes
gh auth login --scopes "repo,admin:org"
```

#### Permission Errors
- Ensure account has admin access to repository
- Check organization permissions for org secrets
- Verify token scopes include `secrets` access

#### Sync Failures
```bash
# Debug sync operation
@github-secrets sync --debug --verbose --dry-run

# Check secret name validation
@github-secrets validate-names --env-file .env
```

#### Large Environment Files
```bash
# Sync in batches
@github-secrets sync --batch-size 10 --delay 1000

# Filter to reduce size
@github-secrets sync --include "PROD_*" --exclude "*_CACHE*"
```

### Debug Mode
```bash
# Enable detailed logging
@github-secrets sync --debug --log-file debug.log

# Verify GitHub API access
@github-secrets test-connection --owner myteam --repo project
```

## Related Commands

- `@github-setup` - Initial repository setup with secrets
- `@github-sync` - Sync code and configurations
- `gh secret set` - GitHub CLI secret management
- `gh secret list` - GitHub CLI secret listing

---

**Need help?** Run `@github-secrets --help` or check the [GitHub Integration Documentation](../../docs/github-integration.md).