# GitHub Integration

Complete repository management with CI/CD and security.

## Overview

Agentwise provides comprehensive GitHub integration including repository creation, branch protection, CI/CD pipeline setup, secrets management, and automated workflows. Transform your local project into a fully-configured GitHub repository with enterprise-grade DevOps practices in minutes.

## Quick Start

```bash
# Complete GitHub setup
/github-setup

# Within project creation
/create-project "app with github"

# Enable for existing project
/github-integrate

# Sync secrets to GitHub
/github-secrets-sync
```

## Features

### Repository Management
- Automatic repository creation
- README generation with project details
- License selection (MIT, Apache, GPL, etc.)
- .gitignore templates for your tech stack
- Issue and PR templates
- Code of conduct
- Contributing guidelines
- Security policy

### Branch Protection
- Protect main/master branch
- Require pull request reviews
- Dismiss stale reviews
- Require status checks to pass
- Require branches to be up to date
- Include administrators in restrictions
- Restrict who can push
- Enforce linear history

### CI/CD Pipeline
- GitHub Actions workflows
- Automated testing on every push
- Code quality checks (linting, formatting)
- Type checking for TypeScript
- Security vulnerability scanning
- Dependency updates with Dependabot
- Auto-deployment to staging/production
- Review apps for pull requests

### Secrets Management
- Automatic sync from .env to GitHub Secrets
- Environment-specific secrets
- Secure storage and encryption
- Access control per environment
- Audit logging

## Integration Flow

### 1. Repository Creation
The system can either create a new repository or connect to an existing one:
- Sets repository visibility (public/private)
- Configures default branch
- Adds description and topics
- Enables relevant features (Issues, Wiki, Projects)

### 2. Security Configuration
Implements security best practices automatically:
- Branch protection rules
- Security scanning with CodeQL
- Secret scanning
- Dependency vulnerability alerts
- Security advisories

### 3. CI/CD Pipeline
Creates comprehensive GitHub Actions workflows:
- Build and test pipeline
- Security scanning pipeline
- Deployment pipeline
- Release automation

## GitHub Actions Workflows

### CI/CD Pipeline Example
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Type check
        run: npm run typecheck
      
      - name: Run tests
        run: npm test
      
      - name: Build application
        run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run security scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
      
      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./

  deploy:
    needs: [test, security]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## Branch Protection Rules

### Protection Configuration
Automatically configured protection rules ensure code quality:

#### Required Checks
- Build must pass
- All tests must pass
- Linting must pass
- Type checking must pass
- Security scan must pass
- Code coverage threshold met

#### Review Requirements
- At least 1 approval required
- Dismiss stale reviews on new commits
- Require review from code owners
- No self-approval allowed

#### Additional Rules
- Require branches to be up to date
- Enforce linear history
- Include administrators
- Restrict force pushes
- Prevent deletions

## Secrets Management

### Automatic Secrets Sync
Environment variables are automatically synced to GitHub Secrets:

```bash
# Sync local .env to GitHub Secrets
/github-secrets-sync

# Secrets synced:
✅ DATABASE_URL
✅ OPENAI_API_KEY
✅ SUPABASE_ANON_KEY
✅ VERCEL_TOKEN
✅ NEXT_PUBLIC_API_URL
```

### Environment-Specific Secrets
Different secrets for each environment:
- Development secrets
- Staging secrets
- Production secrets
- Preview/PR secrets

## Example Setup Session

```bash
$ /github-setup

🔗 GitHub Integration Setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Checking GitHub authentication...
✅ Authenticated as @VibeCodingWithPhil

? Repository setup: Create new repository
? Repository name: task-management-app
? Description: A modern task management platform
? Visibility: Public
? Initialize with: README, .gitignore (Node), MIT License

📦 Creating repository...
✅ Repository created: VibeCodingWithPhil/task-management-app
✅ Default branch: main
✅ Added .gitignore for Node.js
✅ Added MIT license
✅ Generated README.md

🔐 Configuring branch protection...
✅ Protected main branch
✅ Required pull request reviews: 1
✅ Dismiss stale reviews: enabled
✅ Required status checks: build, test, lint
✅ Enforce for administrators: enabled

🚀 Setting up CI/CD...
✅ Created .github/workflows/ci.yml
✅ Created .github/workflows/deploy.yml
✅ Created .github/workflows/security.yml

🔑 Syncing secrets...
✅ DATABASE_URL → GitHub Secrets
✅ OPENAI_API_KEY → GitHub Secrets
✅ SUPABASE_ANON_KEY → GitHub Secrets
✅ VERCEL_TOKEN → GitHub Secrets

🪝 Configuring webhooks...
✅ Deployment webhook configured
✅ Issue tracking webhook configured

📊 Enabling features...
✅ Issues enabled
✅ Projects enabled
✅ Wiki enabled
✅ Discussions enabled
✅ Security advisories enabled

✨ GitHub integration complete!

🔗 Repository: https://github.com/VibeCodingWithPhil/task-management-app
📋 Clone: git clone git@github.com:VibeCodingWithPhil/task-management-app.git
🚀 First push: git push -u origin main
```

## Automated Workflows

### Pull Request Workflow
1. Developer creates feature branch
2. Opens pull request
3. CI/CD runs automatically:
   - Build verification
   - Test execution
   - Code quality checks
   - Security scanning
4. Review app deployed
5. Code review required
6. All checks must pass
7. Merge to main branch
8. Auto-deploy to production

### Release Workflow
1. Tag creation triggers release
2. Changelog generated automatically
3. Assets built and packaged
4. GitHub Release created
5. Deployment to production
6. Notifications sent

## Best Practices

1. **Branch Strategy**: Use feature branches and pull requests
2. **Commit Messages**: Follow conventional commits format
3. **Code Reviews**: Always require at least one review
4. **Testing**: Maintain high test coverage (>80%)
5. **Security**: Enable all security features
6. **Documentation**: Keep README and docs updated
7. **Secrets**: Never commit secrets to repository
8. **CI/CD**: Fix failing builds immediately

## Troubleshooting

### Authentication Issues
- Ensure GitHub token has necessary permissions
- Check token expiration
- Verify organization access

### CI/CD Failures
- Check workflow syntax
- Verify secrets are properly set
- Review error logs
- Ensure dependencies are correct

### Branch Protection Issues
- Verify admin permissions
- Check protection rule conflicts
- Review status check requirements

## Advanced Features

### Custom Workflows
Create custom GitHub Actions workflows:
```bash
/github-workflow create custom-deploy
```

### Issue Templates
Generate issue templates for:
- Bug reports
- Feature requests
- Documentation updates
- Security vulnerabilities

### PR Templates
Create pull request templates with:
- Description checklist
- Testing requirements
- Review guidelines
- Deployment notes

### Dependabot Configuration
Automatic dependency updates:
- Security updates
- Version updates
- Grouped updates
- Auto-merge for patches

## Integration with Other Features

### Database Migrations
- Migration scripts in CI/CD
- Automatic schema updates
- Rollback on failure

### Protection System
- Backup before deployment
- Security scan integration
- Automated recovery

### Monitoring
- Deployment tracking
- Performance metrics
- Error reporting

## Related Commands

- `/create-project` - Complete project setup with GitHub
- `/database-wizard` - Database setup with migration scripts
- `/enable-protection` - Security and backup integration
- `/monitor` - Track deployments and performance