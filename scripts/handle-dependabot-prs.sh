#!/bin/bash

# Script to handle Dependabot PRs efficiently
# Run this weekly to keep dependencies updated

echo "🤖 Dependabot PR Handler"
echo "========================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI (gh) is not installed${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not in a git repository${NC}"
    exit 1
fi

echo "📋 Fetching Dependabot PRs..."
echo ""

# Get all Dependabot PRs
DEPENDABOT_PRS=$(gh pr list --author "app/dependabot" --json number,title,labels --limit 50)

if [ -z "$DEPENDABOT_PRS" ] || [ "$DEPENDABOT_PRS" == "[]" ]; then
    echo -e "${GREEN}✅ No Dependabot PRs to process!${NC}"
    exit 0
fi

# Count PRs
PR_COUNT=$(echo "$DEPENDABOT_PRS" | jq length)
echo "Found $PR_COUNT Dependabot PR(s)"
echo ""

# Process security updates first
echo -e "${RED}🔴 Security Updates (URGENT):${NC}"
SECURITY_PRS=$(echo "$DEPENDABOT_PRS" | jq -r '.[] | select(.labels[].name == "security") | .number')

if [ -z "$SECURITY_PRS" ]; then
    echo "  No security updates found"
else
    for pr in $SECURITY_PRS; do
        TITLE=$(gh pr view $pr --json title -q .title)
        echo "  PR #$pr: $TITLE"
        
        # Approve and merge security updates
        echo "    → Approving..."
        gh pr review $pr --approve --body "Auto-approved: Security update" 2>/dev/null
        
        echo "    → Merging..."
        if gh pr merge $pr --squash --body "Security update" 2>/dev/null; then
            echo -e "    ${GREEN}✅ Merged${NC}"
        else
            echo -e "    ${YELLOW}⚠️  Could not merge (may need manual review)${NC}"
        fi
    done
fi

echo ""
echo -e "${YELLOW}🟡 Dependency Updates:${NC}"

# Process non-security updates
REGULAR_PRS=$(echo "$DEPENDABOT_PRS" | jq -r '.[] | select(.labels[].name != "security") | .number')

if [ -z "$REGULAR_PRS" ]; then
    echo "  No regular updates found"
else
    echo "  Found $(echo "$REGULAR_PRS" | wc -w) regular update(s)"
    echo ""
    echo "  Would you like to:"
    echo "  1) Merge all automatically"
    echo "  2) Review each one"
    echo "  3) Skip for now"
    echo ""
    read -p "  Choose option (1-3): " choice
    
    case $choice in
        1)
            echo ""
            for pr in $REGULAR_PRS; do
                TITLE=$(gh pr view $pr --json title -q .title)
                echo "  PR #$pr: $TITLE"
                
                # Approve
                gh pr review $pr --approve --body "Auto-approved: Dependency update" 2>/dev/null
                
                # Try to merge
                if gh pr merge $pr --squash --body "Dependency update" 2>/dev/null; then
                    echo -e "    ${GREEN}✅ Merged${NC}"
                else
                    echo -e "    ${YELLOW}⚠️  Could not merge${NC}"
                fi
                
                # Small delay to avoid rate limiting
                sleep 1
            done
            ;;
        2)
            echo ""
            for pr in $REGULAR_PRS; do
                TITLE=$(gh pr view $pr --json title -q .title)
                echo "  PR #$pr: $TITLE"
                read -p "    Merge this PR? (y/n/q to quit): " merge_choice
                
                case $merge_choice in
                    y|Y)
                        gh pr review $pr --approve 2>/dev/null
                        if gh pr merge $pr --squash 2>/dev/null; then
                            echo -e "    ${GREEN}✅ Merged${NC}"
                        else
                            echo -e "    ${YELLOW}⚠️  Could not merge${NC}"
                        fi
                        ;;
                    q|Q)
                        echo "  Stopping review"
                        break
                        ;;
                    *)
                        echo "    Skipped"
                        ;;
                esac
            done
            ;;
        3)
            echo "  Skipping regular updates"
            ;;
        *)
            echo "  Invalid option, skipping"
            ;;
    esac
fi

echo ""
echo "🧹 Cleaning up..."

# Check for duplicate PRs
DUPLICATES=$(gh pr list --author "app/dependabot" --json number,title | jq -r 'group_by(.title) | .[] | select(length > 1) | .[1:][].number')

if [ ! -z "$DUPLICATES" ]; then
    echo "  Found duplicate PRs, closing them..."
    for pr in $DUPLICATES; do
        gh pr close $pr --comment "Closing as duplicate" 2>/dev/null
        echo "  Closed PR #$pr"
    done
fi

# Pull latest changes
echo ""
echo "📥 Updating local repository..."
git pull origin main 2>/dev/null

echo ""
echo -e "${GREEN}✅ Done!${NC}"
echo ""
echo "Summary:"
echo "  • Security updates processed: $(echo "$SECURITY_PRS" | wc -w)"
echo "  • Regular updates available: $(echo "$REGULAR_PRS" | wc -w)"
echo "  • Duplicates closed: $(echo "$DUPLICATES" | wc -w)"
echo ""
echo "💡 Tip: Run this script weekly to keep dependencies updated!"
echo "   You can add it to your calendar or set a reminder."