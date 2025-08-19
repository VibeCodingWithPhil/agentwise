# Contributing to Agentwise

Thank you for your interest in contributing to Agentwise! This document explains how to contribute to the project and how the contribution process works.

## 🎯 How Contributions Work

Since this is a private repository with protected branches, all contributions follow a **Fork and Pull Request** workflow:

### For Contributors

1. **Fork the Repository**
   - Since this is a private repo, you'll need to be granted access first
   - Contact the maintainer to request access
   - Once granted, fork the repository to your GitHub account

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/agentwise.git
   cd agentwise
   ```

3. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

4. **Make Your Changes**
   - Write clean, documented code
   - Follow the existing code style
   - Add tests if applicable
   - Update documentation as needed

5. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing new feature"
   # or
   git commit -m "fix: resolve issue with X"
   ```

6. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Go to the original repository
   - Click "Pull Requests" → "New Pull Request"
   - Choose your fork and branch
   - Fill out the PR template with details about your changes
   - Submit the pull request

## 🔒 Repository Protection

The main branch is protected with the following rules:
- **No direct pushes** - All changes must go through pull requests
- **Required reviews** - At least one approval needed before merging
- **Status checks** - All tests must pass
- **No force pushes** - History is preserved
- **Dismiss stale reviews** - New commits require re-review

## 👨‍💼 For the Repository Owner (You)

### Setting Up Branch Protection

1. Go to Settings → Branches in your GitHub repository
2. Add a branch protection rule for `main`:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (set to 1)
   - ✅ Dismiss stale pull request approvals when new commits are pushed
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators (optional, but recommended)
   - ✅ Restrict who can push to matching branches (only you)

### Reviewing Pull Requests

When someone submits a PR, you'll:

1. **Review the Code**
   - Go to the Pull Requests tab
   - Click on the PR to review
   - Check the "Files changed" tab
   - Leave comments on specific lines if needed

2. **Test the Changes**
   ```bash
   # Add the contributor's fork as a remote
   git remote add contributor https://github.com/CONTRIBUTOR/agentwise.git
   
   # Fetch their branch
   git fetch contributor feature/their-feature
   
   # Check out their branch locally
   git checkout -b test-feature contributor/feature/their-feature
   
   # Test the changes
   npm install
   npm test
   npm run build
   ```

3. **Approve or Request Changes**
   - Click "Review changes" in the PR
   - Choose:
     - ✅ **Approve** - Changes look good
     - 💬 **Comment** - General feedback
     - ❌ **Request changes** - Changes needed before merge

4. **Merge the PR**
   - Once approved and all checks pass
   - Click "Merge pull request"
   - Choose merge strategy:
     - **Merge commit** - Preserves all commits
     - **Squash and merge** - Combines into one commit
     - **Rebase and merge** - Applies commits on top of main

### Managing Contributors

1. **Adding Contributors**
   - Go to Settings → Manage access
   - Click "Invite a collaborator"
   - Set their permission level:
     - **Read** - Can view and fork
     - **Write** - Can push to non-protected branches
     - **Admin** - Full access (use sparingly)

2. **Recommended Setup**
   - Give contributors **Write** access
   - They still can't push to `main` due to branch protection
   - They must create PRs for all changes

## 📝 Commit Message Convention

We follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

## 🧪 Testing Requirements

Before submitting a PR:

1. **Run Tests**
   ```bash
   npm test
   ```

2. **Check Linting**
   ```bash
   npm run lint
   ```

3. **Verify Build**
   ```bash
   npm run build
   ```

4. **Test Your Feature**
   - Manually test your changes
   - Ensure no existing features are broken

## 📋 Pull Request Template

When creating a PR, include:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Lint checks pass
- [ ] Build succeeds

## Checklist
- [ ] Code follows project style
- [ ] Self-reviewed code
- [ ] Updated documentation
- [ ] Added tests (if applicable)
```

## 🚀 Release Process

1. Contributors submit PRs to `main`
2. Owner reviews and merges PRs
3. Owner creates releases:
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```
4. GitHub Actions automatically create release artifacts

## 💡 Getting Help

- **Questions**: Open a discussion in the Issues tab
- **Bugs**: Create an issue with reproduction steps
- **Features**: Propose in an issue first, then implement
- **Support**: Contact the maintainer

## 🎓 First-Time Contributors

New to contributing? Here's how to start:

1. Look for issues labeled `good first issue`
2. Comment on the issue to claim it
3. Ask questions if you need help
4. Submit your PR when ready

## 🙏 Thank You!

Every contribution helps make Agentwise better. Whether it's:
- 🐛 Reporting bugs
- 💡 Suggesting features
- 📝 Improving documentation
- 💻 Writing code

Your help is appreciated!

---

**Remember**: The main branch is protected. All changes must go through pull requests, even for the repository owner (if "Include administrators" is enabled). This ensures code quality and provides a clear history of changes.