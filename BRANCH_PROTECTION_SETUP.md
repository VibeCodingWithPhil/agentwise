# Branch Protection Setup Guide

Since you have GitHub Pro/Team, follow these steps to enable branch protection:

## 📍 Quick Setup Link
Go directly to: https://github.com/VibeCodingWithPhil/agentwise/settings/branches

## 🔒 Step-by-Step Setup

### 1. Navigate to Branch Protection Settings
1. Go to your repository: https://github.com/VibeCodingWithPhil/agentwise
2. Click **Settings** tab
3. In the left sidebar, click **Branches** under "Code and automation"

### 2. Add Branch Protection Rule
1. Click **"Add rule"** or **"Add branch protection rule"**
2. In **"Branch name pattern"**, enter: `main`

### 3. Configure Protection Settings

#### ✅ Recommended Settings (Check these boxes):

**Protect matching branches:**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: `1`
  - ✅ Dismiss stale pull request approvals when new commits are pushed
  - ✅ Require review from CODEOWNERS (optional)
  - ✅ Require approval of the most recent reviewable push (optional)

- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - Add status checks if you have CI/CD (optional)

- ✅ **Require conversation resolution before merging**
  - Ensures all PR comments are resolved

- ✅ **Require signed commits** (optional but recommended)
  - Adds extra security layer

- ✅ **Require linear history** (optional)
  - Prevents merge commits, enforces clean history

- ✅ **Include administrators** (optional but recommended)
  - Even you must use PRs (best practice)

**Do not allow bypassing the above settings:**
- ✅ **Lock branch** (only if you want to make it read-only)
- ❌ **Allow force pushes** (keep unchecked)
- ❌ **Allow deletions** (keep unchecked)

### 4. Save Changes
Click **"Create"** or **"Save changes"** at the bottom

## 🧪 Testing Branch Protection

After setup, let's test that it works:

```bash
# Try to push directly to main (should fail)
cd ~/Agentwise
echo "test" >> test.txt
git add test.txt
git commit -m "Test direct push"
git push origin main
# This should be rejected!

# Create a feature branch instead (should work)
git checkout -b test/branch-protection
git push origin test/branch-protection
# This should succeed!

# Clean up
git checkout main
git branch -d test/branch-protection
git push origin --delete test/branch-protection
rm test.txt
```

## 📝 Working with Protected Branch

### For You (Repository Owner):

**Option 1: Include Administrators (Recommended)**
- You must also create PRs for all changes
- Most secure, prevents accidental pushes
- Best practice for production code

**Option 2: Exclude Administrators**
- You can push directly to main
- Other contributors must use PRs
- Less secure but more convenient

### For Contributors:
1. Fork the repository
2. Create feature branch
3. Make changes
4. Push to their fork
5. Create Pull Request
6. You review and merge

## 🔧 Additional Security Settings

While in Settings, also configure:

### General Settings
1. Go to **Settings → General**
2. Under **Pull Requests**:
   - ✅ Allow squash merging
   - ✅ Allow merge commits
   - ✅ Allow rebase merging
   - ✅ Automatically delete head branches

### Security Settings
1. Go to **Settings → Security & analysis**
2. Enable:
   - ✅ Dependency graph
   - ✅ Dependabot alerts
   - ✅ Dependabot security updates
   - ✅ Secret scanning (if available)

## 🚀 GitHub CLI Commands (After Web Setup)

Once branch protection is enabled via web, you can check it with:

```bash
# View branch protection status
gh api repos/VibeCodingWithPhil/agentwise/branches/main/protection

# Check if protection is enabled
gh api repos/VibeCodingWithPhil/agentwise/branches/main --jq '.protected'
```

## 📊 Verification Checklist

After setup, verify:
- [ ] Direct pushes to main are blocked
- [ ] PRs require at least 1 approval
- [ ] Force pushes are disabled
- [ ] Branch deletion is disabled
- [ ] All PR conversations must be resolved
- [ ] New commits dismiss old reviews

## 💡 Tips

1. **Start strict**: It's easier to relax rules than tighten them
2. **Document exceptions**: If you need to bypass, document why
3. **Regular reviews**: Periodically review and adjust settings
4. **Team communication**: Inform all contributors about the rules

## 🔗 Useful Links

- [GitHub Docs: Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches)
- [Your Repository Settings](https://github.com/VibeCodingWithPhil/agentwise/settings/branches)
- [GitHub Status Checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)

---

Once you've completed the web setup, the repository will be fully protected and ready for secure collaboration!