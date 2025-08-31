# GitHub Sync

Synchronize local development with GitHub repository including code, workflows, and configurations.

## Usage

```bash
@github-sync [options]
```

## Options

- `--owner <string>` - GitHub username or organization (required)
- `--repo <string>` - Repository name (required)
- `--local-path <path>` - Local repository path (default: current directory)
- `--direction <push|pull|both>` - Sync direction (default: both)
- `--include <pattern>` - Include files matching pattern (can be used multiple times)
- `--exclude <pattern>` - Exclude files matching pattern (can be used multiple times)
- `--dry-run` - Preview changes without making them
- `--force` - Force sync even with conflicts
- `--ssh` - Use SSH for git operations (default: HTTPS)
- `--branch <name>` - Specific branch to sync (default: current branch)

## Examples

```bash
# Basic sync with current directory
@github-sync --owner myusername --repo my-project

# Sync specific directory
@github-sync --owner myorg --repo project --local-path ./my-project

# Pull only (download from GitHub)
@github-sync --owner myusername --repo project --direction pull

# Push only (upload to GitHub)
@github-sync --owner myusername --repo project --direction push

# Sync with SSH
@github-sync --owner myusername --repo project --ssh

# Dry run to preview changes
@github-sync --owner myusername --repo project --dry-run
```

## Features

### 🔄 Bidirectional Sync
- **Pull**: Download latest changes from GitHub
- **Push**: Upload local changes to GitHub
- **Both**: Intelligent merge of local and remote changes
- **Conflict resolution**: Interactive conflict resolution

### 📁 Selective Sync
- **Include patterns**: Sync only specific files/directories
- **Exclude patterns**: Skip files matching patterns
- **Workflow sync**: Sync GitHub Actions workflows
- **Config sync**: Sync repository configuration

### 🔐 Secure Operations
- **Authentication**: Uses existing GitHub authentication
- **SSH support**: Secure operations with SSH keys
- **Permission checks**: Verifies repository access
- **Backup**: Creates local backups before sync

### ⚡ Smart Sync
- **Change detection**: Only sync modified files
- **Fast-forward**: Intelligent merge strategies
- **Status reporting**: Detailed sync progress
- **Rollback**: Undo sync operations if needed

## Sync Types

### Code Sync
```bash
@github-sync --owner myusername --repo project --include "src/**" --include "*.json"
```
- Source code files
- Configuration files
- Package definitions
- Documentation

### Workflow Sync
```bash
@github-sync --owner myusername --repo project --include ".github/workflows/**"
```
- GitHub Actions workflows
- CI/CD configurations
- Security workflows
- Deployment scripts

### Full Repository Sync
```bash
@github-sync --owner myusername --repo project
```
- All repository contents
- Git history preservation
- Branch synchronization
- Tag synchronization

## Sync Strategies

### Pull Strategy (`--direction pull`)
1. **Fetch**: Download remote changes
2. **Compare**: Check for conflicts
3. **Merge**: Apply changes locally
4. **Report**: Show updated files

### Push Strategy (`--direction push`)
1. **Status**: Check local changes
2. **Stage**: Prepare files for upload
3. **Commit**: Create commit with changes
4. **Push**: Upload to GitHub

### Bidirectional Strategy (`--direction both`)
1. **Fetch**: Get remote status
2. **Compare**: Analyze differences
3. **Resolve**: Handle conflicts interactively
4. **Sync**: Apply changes both directions
5. **Verify**: Confirm synchronization

## File Patterns

### Include Patterns
```bash
# Include specific file types
--include "*.js" --include "*.ts" --include "*.json"

# Include directories
--include "src/**" --include "docs/**"

# Include workflows
--include ".github/workflows/**"
```

### Exclude Patterns
```bash
# Exclude build artifacts
--exclude "node_modules/**" --exclude "dist/**" --exclude "build/**"

# Exclude sensitive files
--exclude ".env*" --exclude "*.key" --exclude "*.pem"

# Exclude logs and caches
--exclude "*.log" --exclude ".cache/**" --exclude "tmp/**"
```

## Interactive Mode

When no options are provided, interactive mode starts:

1. **Repository Selection**: Choose or enter repository details
2. **Local Path**: Select local directory
3. **Sync Direction**: Choose sync strategy
4. **File Selection**: Configure include/exclude patterns
5. **Conflict Resolution**: Handle any conflicts
6. **Preview**: Review changes before applying
7. **Execute**: Perform the synchronization

## Conflict Resolution

### Automatic Resolution
- **Fast-forward**: Apply if no conflicts
- **Auto-merge**: Merge compatible changes
- **Skip unchanged**: Ignore identical files

### Interactive Resolution
- **File comparison**: Side-by-side diff view
- **Manual selection**: Choose local or remote version
- **Custom merge**: Edit merged content
- **Skip file**: Leave file unchanged

### Conflict Strategies
```bash
# Use local version for conflicts
@github-sync --owner user --repo project --strategy local

# Use remote version for conflicts  
@github-sync --owner user --repo project --strategy remote

# Interactive resolution (default)
@github-sync --owner user --repo project --strategy interactive
```

## Backup and Recovery

### Automatic Backups
- Creates `.agentwise/backups/` directory
- Timestamps all backup files
- Preserves git history
- Stores sync metadata

### Manual Backup
```bash
# Create backup before sync
@github-sync --owner user --repo project --backup-first

# Restore from backup
@github-sync --restore .agentwise/backups/20231201_143022/
```

## Status and Reporting

### Sync Status
```bash
@github-sync --owner user --repo project --status
```
Shows:
- Local vs remote file differences
- Pending changes
- Last sync timestamp
- Conflict status

### Sync Report
After sync completion:
- 📊 Files synchronized
- ⚡ Performance metrics
- ⚠️ Warnings and conflicts
- 🎯 Next steps

## Environment Integration

### Local Development
```bash
# Sync before starting work
@github-sync --owner user --repo project --direction pull

# Sync after making changes
@github-sync --owner user --repo project --direction push
```

### CI/CD Integration
```bash
# In GitHub Actions workflow
- name: Sync repository
  run: @github-sync --owner ${{ github.repository_owner }} --repo ${{ github.event.repository.name }}
```

### Git Hooks Integration
```bash
# Pre-commit hook
#!/bin/sh
@github-sync --owner myuser --repo myproject --direction pull --dry-run

# Post-commit hook
#!/bin/sh
@github-sync --owner myuser --repo myproject --direction push
```

## Configuration

### Global Configuration
Create `~/.agentwise/github-sync.json`:
```json
{
  "defaultOwner": "myusername",
  "defaultStrategy": "both",
  "autoBackup": true,
  "excludePatterns": [
    "node_modules/**",
    ".env*",
    "*.log"
  ],
  "includePatterns": [
    "src/**",
    "docs/**",
    "*.json",
    "*.md"
  ]
}
```

### Repository Configuration
Create `.github/sync.yml` in repository:
```yaml
sync:
  exclude:
    - "build/**"
    - "dist/**"
    - ".cache/**"
  include:
    - "src/**"
    - ".github/workflows/**"
  strategy: both
  autoResolve: fast-forward
```

## Advanced Usage

### Branch Synchronization
```bash
# Sync specific branch
@github-sync --owner user --repo project --branch feature/new-feature

# Sync all branches
@github-sync --owner user --repo project --all-branches

# Create branch and sync
@github-sync --owner user --repo project --create-branch feature/sync
```

### Tag Synchronization
```bash
# Sync tags
@github-sync --owner user --repo project --include-tags

# Sync specific tag
@github-sync --owner user --repo project --tag v1.0.0
```

### Workflow Synchronization
```bash
# Sync only workflows
@github-sync --owner user --repo project --workflows-only

# Update workflow from template
@github-sync --owner user --repo project --update-workflow ci.yml
```

## Troubleshooting

### Common Issues

#### Authentication Problems
```bash
# Check authentication
gh auth status

# Re-authenticate
@github-setup --owner user --repo project --auth-method cli
```

#### Permission Errors
- Ensure repository access rights
- Check branch protection rules
- Verify token scopes

#### Sync Conflicts
```bash
# Reset to last successful sync
@github-sync --reset-to-last-sync

# Force overwrite local changes
@github-sync --force --direction pull

# Force overwrite remote changes  
@github-sync --force --direction push
```

#### Large File Issues
```bash
# Use Git LFS for large files
git lfs track "*.zip"
@github-sync --owner user --repo project --lfs
```

### Debug Mode
```bash
# Enable verbose logging
@github-sync --owner user --repo project --debug --verbose

# Save debug log
@github-sync --owner user --repo project --debug --log-file sync.log
```

## Performance Optimization

### Incremental Sync
- Only processes changed files
- Uses git diff for change detection
- Parallel file transfers
- Compressed data transfer

### Large Repository Handling
```bash
# Shallow sync for large repos
@github-sync --owner user --repo project --shallow --depth 10

# Partial sync with patterns
@github-sync --owner user --repo project --include "src/**" --exclude "assets/**"
```

## Related Commands

- `@github-setup` - Initial repository setup
- `@github-secrets` - Manage repository secrets
- `git pull` - Standard git pull
- `git push` - Standard git push
- `gh repo sync` - GitHub CLI sync

## Examples

### Daily Development Workflow
```bash
# Morning: Get latest changes
@github-sync --owner myteam --repo project --direction pull

# Evening: Upload day's work
@github-sync --owner myteam --repo project --direction push
```

### Team Collaboration
```bash
# Sync before team standup
@github-sync --owner company --repo project --branch main

# Sync feature branch
@github-sync --owner company --repo project --branch feature/new-ui
```

### Release Preparation
```bash
# Sync everything for release
@github-sync --owner company --repo project --include-tags --all-branches

# Sync documentation
@github-sync --owner company --repo project --include "docs/**" --include "*.md"
```

---

**Need help?** Run `@github-sync --help` or check the [GitHub Integration Documentation](../../docs/github-integration.md).