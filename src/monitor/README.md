# Agentwise Monitor Dashboard

Real-time monitoring dashboard for Agentwise AI agents with WebSocket connectivity.

**Location**: This monitor is part of the Agentwise project and located at `src/monitor/`

## Features

- **Real-time Agent Monitoring**: Track all active agents, their progress, and current tasks
- **System Health Metrics**: Monitor CPU, memory, disk, and network usage
- **Task Feed**: Live updates of agent activities
- **Overall Progress**: Project-wide completion tracking
- **Theme Support**: Light/dark mode with system detection
- **Claude Code Integration**: Pause/resume agents and send commands directly
- **Emergency Kill Switch**: Immediate system shutdown capability

## Installation

```bash
# Install dependencies
npm install
```

## Running the Monitor

Start both the WebSocket server and the web UI:

```bash
# Terminal 1: Start the WebSocket server
npm run server

# Terminal 2: Start the Next.js dashboard
npm run dev
```

The dashboard will be available at: http://localhost:3001

## How It Works

1. **WebSocket Server** (port 3002): 
   - Monitors Agentwise workspace for active projects
   - Watches agent-todos MD files for real-time updates
   - Broadcasts changes to connected dashboard clients

2. **Web Dashboard** (port 3001):
   - Connects to WebSocket server for live data
   - Displays agent status, progress, and tasks
   - Provides controls for pausing and managing agents

## Integration with Agentwise

The monitor automatically detects active Agentwise projects by:
1. Checking `.agentwise-context.json` for active project info
2. Scanning workspace folders for agent-todos directories
3. Parsing phase MD files to track task completion

## Agent Controls

- **Pause Button**: Opens modal to pause execution and send new tasks
- **Kill Switch**: Emergency shutdown of all agents
- **Refresh**: Manually refresh agent status

## Project Structure

```
monitor/
├── src/
│   ├── app/           # Next.js app router
│   ├── components/    # React components
│   ├── services/      # WebSocket service
│   └── lib/           # Utilities
├── server/
│   └── index.js       # WebSocket server
└── package.json
```

## Development

The dashboard uses:
- Next.js 14 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- WebSocket for real-time updates
- Radix UI components

## Troubleshooting

- **No agents showing**: Ensure an Agentwise project is active in the workspace
- **Connection issues**: Check that port 3002 is available for WebSocket server
- **Dashboard not loading**: Verify port 3001 is free and restart the dev server