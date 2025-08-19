# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### Claude Code Not Found
**Problem:** `claude: command not found`

**Solution:**
```bash
# Verify Claude Code installation
which claude

# If not found, install Claude Code:
# Visit https://docs.anthropic.com/en/docs/claude-code
```

#### Node Version Mismatch
**Problem:** `Error: Node version 16 not supported`

**Solution:**
```bash
# Check Node version
node --version

# Update Node to 18+
nvm install 18
nvm use 18
```

#### Permission Denied
**Problem:** `EACCES: permission denied`

**Solution:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use npm with proper permissions
npm install --unsafe-perm
```

### Command Issues

#### Command Not Found
**Problem:** `/create: command not found`

**Solution:**
1. Verify command files exist:
   ```bash
   ls ~/.claude/commands/
   ```
2. Ensure commands are `.md` files, not `.js`
3. Restart Claude Code

#### No Active Project
**Problem:** `Error: No active project selected`

**Solution:**
```bash
# List and select project
/projects

# Or create new project
/create "Your project idea"
```

#### Agent Not Launching
**Problem:** Agents don't start after command

**Solution:**
1. Check terminal permissions:
   ```bash
   # macOS
   System Preferences > Security & Privacy > Privacy > Automation
   # Allow Terminal/iTerm access
   ```

2. Verify Claude CLI path:
   ```bash
   which claude
   # Should return path like /Users/you/.claude/local/claude
   ```

3. Test manual agent launch:
   ```bash
   claude --dangerously-skip-permissions /agent "frontend-specialist"
   ```

### Project Issues

#### Workspace Not Found
**Problem:** `Error: Workspace directory not found`

**Solution:**
```bash
# Create workspace directory
mkdir -p ~/agentwise-projects/workspace

# Update configuration
export DEFAULT_WORKSPACE_PATH=~/agentwise-projects
```

#### Project Registry Corrupted
**Problem:** `Error: Failed to load project registry`

**Solution:**
```bash
# Backup existing registry
cp src/project-registry/projects.json projects.backup.json

# Reset registry
echo '{"projects":[],"lastUpdated":"'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"}' > src/project-registry/projects.json
```

#### Phase Files Missing
**Problem:** `Error: Phase files not found`

**Solution:**
```bash
# Regenerate phase files
cd workspace/your-project
npm run regenerate-phases
```

### Agent Issues

#### Agent Timeout
**Problem:** Agent tasks timing out

**Solution:**
1. Increase timeout in configuration:
   ```javascript
   // src/orchestrator/AgentManager.ts
   const AGENT_TIMEOUT = 600000; // 10 minutes
   ```

2. Check for infinite loops in agent tasks

3. Monitor agent logs:
   ```bash
   /monitor
   ```

#### Agent Conflict
**Problem:** Multiple agents editing same file

**Solution:**
1. Phase synchronization should prevent this
2. If occurs, check phase-status.json:
   ```bash
   cat workspace/project/agent-todo/*/phase-status.json
   ```
3. Manually resolve conflicts and update status

#### Token Limit Exceeded
**Problem:** `Error: Token limit exceeded`

**Solution:**
1. Enable token optimization:
   ```bash
   export ENABLE_TOKEN_OPTIMIZATION=true
   ```

2. Reduce context size in prompts

3. Split large tasks into smaller phases

### Monitoring Issues

#### Dashboard Not Loading
**Problem:** Dashboard shows blank screen

**Solution:**
```bash
# Check if blessed is installed
npm list blessed

# Reinstall if needed
npm install blessed

# Try alternative monitoring
tail -f progress.json | jq '.'
```

#### Progress Not Updating
**Problem:** Progress stuck at same percentage

**Solution:**
1. Check agent status files:
   ```bash
   find workspace -name "phase-status.json" -exec cat {} \;
   ```

2. Restart progress tracker:
   ```bash
   npm run restart-monitor
   ```

### Deployment Issues

#### Build Failures
**Problem:** Deployment fails during build

**Solution:**
```bash
# Check build logs
cat workspace/project/.deploy/logs/build.log

# Run build manually
cd workspace/project
npm run build

# Fix any errors and retry
/deploy
```

#### Environment Variables Missing
**Problem:** `Error: DATABASE_URL not defined`

**Solution:**
```bash
# Create environment file
cat > workspace/project/.env.production << EOF
DATABASE_URL=your_database_url
API_KEY=your_api_key
EOF

# Retry deployment
/deploy production
```

#### Rollback Failed
**Problem:** Rollback script not working

**Solution:**
```bash
# Manual rollback
cd workspace/project

# Restore previous version
git checkout HEAD~1

# Redeploy
/deploy production
```

### Performance Issues

#### Slow Agent Response
**Problem:** Agents taking too long to respond

**Causes & Solutions:**
1. **High token usage**
   - Enable optimization
   - Reduce context size

2. **System resources**
   ```bash
   # Check system resources
   top
   
   # Reduce parallel agents
   export MAX_PARALLEL_AGENTS=3
   ```

3. **Network latency**
   - Check internet connection
   - Use local Claude instance if available

#### Memory Leaks
**Problem:** Memory usage increasing over time

**Solution:**
```bash
# Monitor memory
node --expose-gc --max-old-space-size=4096 src/index.js

# Enable garbage collection logging
export NODE_OPTIONS="--trace-gc"
```

### Error Messages

#### "Cannot read property of undefined"
**Cause:** Missing project context

**Solution:**
```bash
# Regenerate context
cd workspace/project
npm run generate-context
```

#### "ENOENT: no such file or directory"
**Cause:** File path issue

**Solution:**
- Use absolute paths
- Verify workspace structure
- Check file permissions

#### "Agent communication failed"
**Cause:** Terminal process died

**Solution:**
```bash
# Kill all agent processes
pkill -f "claude --dangerously"

# Restart agents
/task "Continue current work"
```

## Debugging Techniques

### Enable Debug Mode
```bash
export DEBUG=agentwise:*
export VERBOSE=true
```

### Check Logs
```bash
# System logs
tail -f ~/.agentwise/logs/system.log

# Agent logs
tail -f workspace/project/logs/agents.log

# Error logs
tail -f ~/.agentwise/logs/error.log
```

### Validate Configuration
```bash
# Run diagnostic
npm run diagnose

# Check configuration
npm run validate-config
```

## Getting Help

### Resources
1. Check documentation: `/docs/`
2. Search issues: GitHub Issues
3. Ask community: Discord

### Reporting Issues
When reporting issues, include:
1. Error message
2. Command used
3. System information:
   ```bash
   npm run system-info
   ```
4. Relevant logs
5. Steps to reproduce

### Emergency Recovery
If system is completely broken:
```bash
# Backup current state
cp -r ~/.agentwise ~/.agentwise.backup

# Reset to defaults
npm run factory-reset

# Restore projects
npm run restore-projects
```

## Preventive Measures

1. **Regular Backups**
   ```bash
   npm run backup
   ```

2. **Monitor Resources**
   ```bash
   /monitor
   ```

3. **Update Regularly**
   ```bash
   git pull
   npm update
   ```

4. **Test in Development**
   ```bash
   /deploy development
   ```

5. **Use Version Control**
   ```bash
   cd workspace/project
   git init
   git add .
   git commit -m "Checkpoint"
   ```