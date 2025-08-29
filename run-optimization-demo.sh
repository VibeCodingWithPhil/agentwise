#!/bin/bash

# Token Optimization Demo Runner
# This script demonstrates the actual token optimization in action

echo "🚀 Starting Token Optimization Demo"
echo "======================================"

# Check if we have the required dependencies
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    echo "❌ npx is required but not installed" 
    exit 1
fi

# Check if TypeScript is available
if ! command -v npx ts-node &> /dev/null; then
    echo "📦 Installing ts-node for demo..."
    npm install -g ts-node typescript
fi

# Set up the environment
export NODE_ENV=development

# Run the demo
echo "🎭 Running Token Optimization Demo..."
echo "This will show you exactly how the optimization works!"
echo ""

npx ts-node src/examples/TokenOptimizationDemo.ts

echo ""
echo "✅ Demo completed!"
echo ""
echo "💡 To see optimization in action with real agents:"
echo "   1. Create a project: /create a todo app"
echo "   2. Watch the console output for optimization metrics"
echo "   3. Check token savings in the optimization report"
echo ""
echo "🔗 More info: https://agentwise-docs.vercel.app/docs/architecture/tokens"