---
description: Launch real-time web monitoring dashboard for Agentwise
argument-hint: 
allowed-tools: Bash, Read, WebFetch
---

# Launch Agentwise Monitor Dashboard

Open the real-time web monitoring dashboard for Agentwise projects.

## Steps:
1. Check if monitor servers are already running on ports 3001 and 3002
2. If not running, start the monitoring system:
   ```bash
   cd /Users/philipritmeester/Agentwise/src/monitor && ./start.sh
   ```
3. Open the dashboard in the default browser:
   ```bash
   open http://localhost:3001
   ```

## Dashboard Features:
- **Real-time Agent Monitoring**: Track all active agents and their progress
- **System Health Metrics**: Monitor CPU, memory, disk, and network usage
- **Task Feed**: Live updates of agent activities
- **Overall Progress**: Project-wide completion tracking
- **Theme Support**: Light/dark mode with system detection
- **Claude Code Integration**: Pause/resume agents and send commands
- **Emergency Kill Switch**: Immediate system shutdown capability

## Controls:
- **Pause Button**: Opens modal to pause execution and send new tasks
- **Kill Switch**: Emergency shutdown of all agents
- **Refresh**: Manually refresh agent status
- **Theme Toggle**: Switch between light/dark modes

## WebSocket Integration:
- Server runs on port 3002 and monitors the Agentwise workspace
- Automatically detects active projects from `.agentwise-context.json`
- Watches agent-todo MD files for real-time progress updates

The dashboard will automatically connect to any active Agentwise project and display live updates.