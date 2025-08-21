# Repository Protection Guide

## Overview
This guide helps you protect your Agentwise repository from malicious contributions and accidental overwrites. While some features require GitHub Pro, we've included free alternatives that provide substantial protection.

## 🆓 Free Protection Methods (Available Now)

### 1. Manual Settings Configuration
Even without GitHub Pro, you can enable basic protections:

#### Go to Your Repository Settings:
1. Navigate to: https://github.com/VibeCodingWithPhil/agentwise
2. Click **Settings** tab
3. Click **General** in the sidebar

#### Enable These Settings:
- [ ] **Disable "Allow merge commits"** - Use squash or rebase only
- [ ] **Disable "Allow rebase merging"** - Keep history clean
- [ ] **Enable "Always suggest updating pull request branches"**
- [ ] **Enable "Automatically delete head branches"** - Cleanup after merge
- [ ] **Disable "Allow auto-merge"** - Require manual review

### 2. Use CODEOWNERS File (We've Set This Up)
The `.github/CODEOWNERS` file marks you as the required reviewer for critical files:
- Works even on free tier for public repos
- Provides notification when protected files are modified
- Creates social pressure for proper review

### 3. Security Workflow (Active)
Our `.github/workflows/security-check.yml` automatically:
- Detects large file deletions (>30% of codebase blocks PR)
- Scans for suspicious patterns
- Checks for sensitive file modifications
- Validates dependencies
- Generates security reports

### 4. Manual Review Process
For each PR, manually check:
- [ ] Changes match PR description
- [ ] No unexpected file deletions
- [ ] No suspicious dependencies added
- [ ] No obfuscated code
- [ ] Tests pass
- [ ] No sensitive data exposed

## 💰 Pro/Enterprise Features (When You Upgrade)

### Branch Protection Rules
Once you have GitHub Pro, enable these:

```bash
# Run our setup script
./scripts/setup-branch-protection.sh
```

Or manually in Settings > Branches:
- **Require pull request reviews** (1-2 reviewers)
- **Dismiss stale reviews**
- **Require review from CODEOWNERS**
- **Require status checks**
- **Require conversation resolution**
- **Require linear history**
- **Include administrators**
- **Restrict who can push**

### Rulesets (Pro Feature)
More advanced than branch protection:
- Pattern-based file protection
- Bypass rules for emergencies
- Metadata restrictions
- Commit message requirements
- File size limits

## 🚨 Immediate Actions You Can Take

### 1. Set Up Your Local Git Hooks
```bash
# Create pre-push hook
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash
echo "🔍 Running security checks before push..."

# Check for large deletions
DELETIONS=$(git diff --stat origin/main..HEAD 2>/dev/null | grep deletion | awk '{sum+=$4} END {print sum}')
if [ "$DELETIONS" -gt 1000 ]; then
  echo "❌ ERROR: Attempting to delete $DELETIONS lines!"
  echo "Large deletions require careful review."
  exit 1
fi

# Check for sensitive files
if git diff --name-only origin/main..HEAD | grep -E "\.env|secrets|credentials|private"; then
  echo "⚠️  WARNING: Sensitive files detected in commit"
  read -p "Are you sure you want to push? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "✅ Security checks passed"
EOF

chmod +x .git/hooks/pre-push
```

### 2. Enable GitHub Security Features (Free)
In Settings > Security & analysis:
- [x] **Dependency graph** - Track dependencies
- [x] **Dependabot alerts** - Vulnerability notifications
- [x] **Secret scanning alerts** - Detect exposed secrets

### 3. Set Up Protected Tags
Protect release tags from deletion:
1. Go to Settings > Tags
2. Add rule: `v*` (protects all version tags)
3. Only allow repository admin to create/delete

## 📋 Contributor Guidelines We've Created

### Files Added for Protection:
1. **`.github/CODEOWNERS`** - Defines ownership of critical files
2. **`.github/CONTRIBUTING.md`** - Clear contribution guidelines
3. **`.github/SECURITY.md`** - Security policy and reporting
4. **`.github/workflows/security-check.yml`** - Automated security scanning
5. **`.github/branch-protection.json`** - Configuration reference

## 🔒 How This Protects You

### Against Malicious PRs:
- **CODEOWNERS** ensures you're notified of critical changes
- **Security workflow** automatically detects suspicious patterns
- **Contributing guidelines** set clear expectations
- **PR template** requires detailed explanations

### Against Accidental Damage:
- **No direct pushes** to main (when branch protection enabled)
- **Required reviews** catch mistakes
- **Automated tests** prevent broken code
- **Deletion detection** prevents accidental file removal

## 🚀 Quick Setup Checklist

### Today (Free Tier):
- [x] CODEOWNERS file created
- [x] Security workflow added
- [x] Contributing guidelines established
- [x] Security policy documented
- [ ] Enable Dependabot alerts in Settings
- [ ] Set up local git hooks
- [ ] Review and merge PR with these changes

### When You Upgrade to Pro:
- [ ] Run `./scripts/setup-branch-protection.sh`
- [ ] Enable rulesets for additional protection
- [ ] Set up required status checks
- [ ] Enable enforce admins option

## 🆘 If Something Goes Wrong

### Someone Merged Malicious Code:
1. **Immediately**: Revert the commit
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Lock the repository** (Settings > Manage access > Lock repository)

3. **Review the damage**:
   ```bash
   git diff <bad-commit>^ <bad-commit>
   ```

4. **Restore from backup if needed**

### Someone Deleted Important Files:
1. **Find the commit**:
   ```bash
   git log --diff-filter=D --summary
   ```

2. **Restore the files**:
   ```bash
   git checkout <commit-before-deletion> -- path/to/deleted/files
   ```

3. **Push the restoration**

## 📚 Additional Resources

- [GitHub Docs: Managing a branch protection rule](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)
- [GitHub Docs: About CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Docs: Repository security advisories](https://docs.github.com/en/code-security/security-advisories/repository-security-advisories)

## 💡 Pro Tips

1. **Review Everything**: Even with automation, manually review every PR
2. **Trust But Verify**: Check contributor history before accepting PRs
3. **Backup Regularly**: Keep local backups of your repository
4. **Document Changes**: Require clear commit messages and PR descriptions
5. **Stay Alert**: Watch for unusual activity patterns

## 🎯 Summary

While full branch protection and rulesets require GitHub Pro, the combination of:
- CODEOWNERS file
- Security workflows
- Clear guidelines
- Manual review process
- Local git hooks

Provides significant protection against both malicious and accidental damage to your repository.

**Remember**: The best protection is vigilance. Review every change carefully!