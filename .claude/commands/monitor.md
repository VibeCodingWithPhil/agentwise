---
description: Launch real-time monitoring dashboard for active projects
argument-hint: [project-name]
allowed-tools: Bash, Read
---

# Launch Monitoring Dashboard

Launch the real-time monitoring dashboard for project: $ARGUMENTS

Steps:
1. Parse project name from arguments (or use active project if not specified)
2. Verify project exists in registry
3. Launch the monitoring dashboard with:
   ```bash
   npx ts-node src/monitoring/launch-dashboard.ts [project-name]
   ```

Dashboard features:
- Real-time progress tracking
- Phase status monitoring
- Agent activity visualization
- Active task tracking
- Live logs from all agents
- Token usage metrics
- Performance statistics

Keyboard shortcuts:
- `q` or `ESC`: Quit dashboard
- `r`: Refresh display
- `↑/↓`: Scroll logs

The dashboard will automatically update every second with the latest progress from all agents.