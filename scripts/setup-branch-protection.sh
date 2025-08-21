#!/bin/bash

# Setup Branch Protection Rules for Agentwise Repository
# This script configures branch protection to prevent repository overwrites

REPO="VibeCodingWithPhil/agentwise"
BRANCH="main"

echo "🔒 Setting up branch protection for $REPO..."

# Enable branch protection on main branch
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/$REPO/branches/$BRANCH/protection \
  --input - <<EOF
{
  "required_status_checks": null,
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismissal_restrictions": {},
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": true,
    "required_approving_review_count": 1,
    "require_last_push_approval": false,
    "bypass_pull_request_allowances": {}
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true,
  "lock_branch": false,
  "allow_fork_syncing": false
}
EOF

if [ $? -eq 0 ]; then
    echo "✅ Branch protection enabled successfully!"
    echo ""
    echo "Protection settings applied:"
    echo "  • Pull requests required for all changes"
    echo "  • At least 1 review required before merging"
    echo "  • CODEOWNERS review required for protected files"
    echo "  • Stale reviews dismissed on new commits"
    echo "  • All conversations must be resolved"
    echo "  • Force pushes disabled"
    echo "  • Branch deletion disabled"
else
    echo "❌ Failed to enable branch protection"
    echo "You may need to enable this manually in GitHub Settings > Branches"
fi