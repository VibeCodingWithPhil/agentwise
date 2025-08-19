#!/bin/bash

echo "Starting Agentwise Monitor..."
echo "================================"
echo ""

# Kill any existing processes on our ports
echo "Checking for existing processes..."
lsof -ti:3001,3002 | xargs kill -9 2>/dev/null
sleep 1

# Start WebSocket server in background
echo "Starting WebSocket server on port 3002..."
npm run server &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Start Next.js dashboard
echo "Starting dashboard on port 3001..."
echo ""
echo "Dashboard will be available at: http://localhost:3001"
echo "Press Ctrl+C to stop both servers"
echo ""
npm run dev

# Cleanup on exit
trap "kill $SERVER_PID 2>/dev/null; lsof -ti:3001 | xargs kill -9 2>/dev/null" EXIT