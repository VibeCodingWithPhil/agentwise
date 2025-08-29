# update-agentwise

Updates Agentwise to the latest version from GitHub.

## Usage
When the user types `/update-agentwise`, perform the following steps:

1. **Check Current Version**
   ```bash
   cd ~/agentwise
   # Check current version from package.json
   CURRENT_VERSION=$(node -p "require('./package.json').version")
   echo "Current Agentwise version: $CURRENT_VERSION"
   ```

2. **Fetch Latest Changes**
   ```bash
   # Stash any local changes
   git stash
   
   # Fetch latest from GitHub
   git fetch origin main
   
   # Check latest version on remote
   LATEST_VERSION=$(git show origin/main:package.json | node -p "JSON.parse(require('fs').readFileSync(0, 'utf8')).version")
   echo "Latest version available: $LATEST_VERSION"
   ```

3. **Version Comparison**
   ```bash
   if [ "$CURRENT_VERSION" = "$LATEST_VERSION" ]; then
     echo "✅ Agentwise is already up to date (v$CURRENT_VERSION)"
     echo "No update necessary."
     exit 0
   fi
   ```

4. **Perform Update**
   ```bash
   echo "🔄 Updating Agentwise from v$CURRENT_VERSION to v$LATEST_VERSION..."
   
   # Pull latest changes
   git pull origin main
   
   # Install new dependencies
   npm install
   
   # Build the project
   npm run build
   
   # Update global monitor if it exists
   if [ -f /usr/local/bin/monitor ]; then
     echo "📊 Updating global monitor command..."
     sudo ln -sf ~/agentwise/dist/monitor/cli.js /usr/local/bin/monitor
   fi
   ```

5. **Run Migration Scripts (if any)**
   ```bash
   # Check for migration scripts
   if [ -f "./scripts/migrate-to-$LATEST_VERSION.js" ]; then
     echo "🔧 Running migration script..."
     node "./scripts/migrate-to-$LATEST_VERSION.js"
   fi
   ```

6. **Verify Update**
   ```bash
   # Restart Context Server if running
   if pgrep -f "startContextServer" > /dev/null; then
     echo "🔄 Restarting Context Server..."
     pkill -f "startContextServer"
     nohup node dist/context/startContextServer.js > /dev/null 2>&1 &
   fi
   
   # Show success message
   echo "✅ Successfully updated Agentwise to v$LATEST_VERSION!"
   echo ""
   echo "📝 What's new in v$LATEST_VERSION:"
   echo "  • Check release notes at: https://github.com/VibeCodingWithPhil/agentwise/releases/tag/v$LATEST_VERSION"
   echo ""
   echo "🚀 Agentwise is ready to use!"
   ```

7. **Handle Errors**
   - If git pull fails due to conflicts:
     ```bash
     echo "⚠️ Update failed due to local changes"
     echo "Run 'git stash' to save your changes, then try updating again"
     ```
   - If npm install fails:
     ```bash
     echo "⚠️ Failed to install dependencies"
     echo "Try running 'npm cache clean --force' and update again"
     ```
   - If build fails:
     ```bash
     echo "⚠️ Build failed. Check for TypeScript errors"
     echo "Run 'npm run build' manually to see detailed errors"
     ```

## Manual Update Prompt

If users prefer to update manually, they can copy and run:

```
cd ~/agentwise && git stash && git pull origin main && npm install && npm run build && echo "✅ Agentwise updated successfully!"
```

## Safety Features
- Automatically stashes local changes before updating
- Checks version before updating to avoid unnecessary operations
- Preserves user configurations and workspace
- Restarts services after update
- Provides rollback instructions if needed

## Rollback Instructions
If an update causes issues:
```bash
cd ~/agentwise
git log --oneline -5  # Find previous version commit
git checkout <commit-hash>  # Revert to previous version
npm install && npm run build
```