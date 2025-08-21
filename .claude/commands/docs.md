# /docs - Local Documentation Hub

## Purpose
Launch local documentation website for offline access to comprehensive Agentwise documentation.

## Usage
```
/docs [command]
```

## Commands
- `/docs` - Start local documentation server
- `/docs open` - Open documentation in browser
- `/docs build` - Build documentation site
- `/docs stop` - Stop documentation server

## Implementation

When `/docs` is called:

1. **Check if docs-site exists**
   ```bash
   if [ -d "docs-site" ]; then
     cd docs-site
   else
     echo "❌ docs-site directory not found"
     echo "Please run from Agentwise root directory"
     exit 1
   fi
   ```

2. **Install dependencies if needed**
   ```bash
   if [ ! -d "node_modules" ]; then
     echo "📦 Installing documentation dependencies..."
     npm install
   fi
   ```

3. **Start development server**
   ```bash
   echo "🚀 Starting local documentation server..."
   echo "📚 Documentation will be available at: http://localhost:3000"
   echo "🌐 Live site: https://agentwise-docs.vercel.app"
   echo ""
   echo "Press Ctrl+C to stop the server"
   npm run dev
   ```

4. **For other commands**:
   - `open`: `npm run dev & sleep 3 && open http://localhost:3000`
   - `build`: `npm run build`
   - `stop`: `pkill -f "next dev"`

## Features Available Locally

### Core Documentation
- Installation Guide
- Quick Start Tutorial  
- First Project Walkthrough
- Configuration Options

### Command Reference
- All 20+ Agentwise commands
- Usage examples and parameters
- Best practices and tips

### Architecture Deep-dive
- Agent System Overview
- Task Distribution Logic
- Token Optimization Details
- Monitoring & Analytics

### Integration Guides
- Figma Dev Mode Integration
- GitHub Workflow Integration
- CI/CD Pipeline Setup
- MCP Server Management (61 servers)

### Performance & Optimization
- Token Usage Optimization (35% reduction)
- Performance Benchmarks
- Analytics Dashboard
- Monitoring Setup

### Custom Development
- Custom Agent Creation
- Agent Types & Specializations
- Best Practices & Examples
- Community Contributions

## Benefits of Local Documentation

1. **Offline Access** - Work without internet connection
2. **Fast Search** - Instant local search functionality
3. **Latest Updates** - Always synchronized with codebase
4. **Development Integration** - Quick reference while coding
5. **Customization** - Modify docs for team needs

## Error Handling

If documentation fails to start:
1. Check Node.js version (18+ required)
2. Clear node_modules and reinstall
3. Check port 3000 availability
4. Verify docs-site directory structure

## Success Message
```
✅ Local documentation server started successfully!
📚 Browse documentation at: http://localhost:3000
🌐 Live version available at: https://agentwise-docs.vercel.app
🔍 Use Cmd+K for search, navigate with sidebar
```