# Documentation Command (`/docs`)

The `/docs` command provides instant access to the comprehensive Agentwise documentation hub directly from your terminal, opening an interactive web-based documentation interface in your default browser.

## Overview

The documentation command serves as your gateway to all Agentwise documentation, providing:
- **Interactive Documentation Hub**: Beautiful, searchable web interface
- **Comprehensive Guides**: All documentation in one organized location
- **Cross-Platform Support**: Works on Windows, macOS, and Linux
- **Offline Access**: Documentation available without internet connection

## Usage

### Basic Command
```bash
/docs
```
Opens the documentation hub in your default browser.

### Help Command
```bash
/docs help
```
Displays help information about the documentation command.

## Features

### Interactive Documentation Hub

The documentation hub provides:

1. **Quick Stats Dashboard**
   - Number of specialist agents
   - MCP integrations count
   - Token optimization percentage
   - Parallel agent capacity
   - Development speed multiplier

2. **Searchable Content**
   - Real-time search across all documentation
   - Keyboard shortcut (Ctrl/Cmd + K) for quick search
   - Filter documentation by category

3. **Organized Categories**
   - **Getting Started**: Overview, quick start, and commands
   - **Core Features**: Architecture, custom agents, dynamic agents
   - **Advanced Features**: MCP integration, model routing, analytics
   - **DevOps & Monitoring**: CI/CD integration, monitor dashboard
   - **Help & Support**: Troubleshooting, contributing, roadmap

4. **Quick Actions**
   - Direct links to common commands
   - Code examples with syntax highlighting
   - External links to GitHub resources

## Documentation Structure

The documentation hub includes:

### Core Documentation Files
- `README.md` - Complete project overview
- `getting-started.md` - Installation and setup guide
- `commands.md` - Command reference
- `architecture.md` - System architecture details
- `troubleshooting.md` - Common issues and solutions

### Feature Documentation
- `custom-agents.md` - Creating custom specialist agents
- `dynamic-agents.md` - Dynamic agent discovery system
- `mcp-integration.md` - MCP server integration guide
- `smart-model-routing.md` - Intelligent model routing
- `performance-analytics.md` - Performance tracking and optimization
- `tech-stack-validator.md` - Technology validation system

### Integration Documentation
- `ci-cd-integration.md` - CI/CD pipeline integration
- `monitor-command.md` - Monitor dashboard documentation
- `docs-command.md` - This documentation file

## Technical Implementation

### Browser Detection

The command automatically detects your operating system and opens documentation using the appropriate method:

- **macOS**: Uses `open` command
- **Windows**: Uses `start` command
- **Linux**: Tries multiple browsers (xdg-open, firefox, chrome, etc.)

### File System Integration

```typescript
// Documentation path resolution
this.docsPath = path.resolve(path.join(process.cwd(), 'docs'));
this.indexPath = path.join(this.docsPath, 'index.html');
```

### Error Handling

The command includes comprehensive error handling:
- Checks for documentation directory existence
- Verifies index.html presence
- Provides fallback instructions if browser fails to open

## User Interface Features

### Search Functionality
```javascript
// Real-time search implementation
function filterDocs() {
  const searchTerm = document.getElementById('searchBar').value.toLowerCase();
  const docCards = document.querySelectorAll('.doc-card');
  
  docCards.forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(searchTerm) ? 'block' : 'none';
  });
}
```

### Keyboard Shortcuts
- **Ctrl/Cmd + K**: Focus search bar
- **Click any card**: Open documentation file
- **Smooth scrolling**: Navigation between sections

### Responsive Design
- Mobile-friendly layout
- Adaptive grid system
- Touch-friendly interface
- Optimized for all screen sizes

## Visual Design

### Dark Theme
The documentation hub features a modern dark theme with:
- Primary color: `#6366f1` (Indigo)
- Secondary color: `#8b5cf6` (Purple)
- Background: `#0f172a` (Dark slate)
- High contrast for readability

### Interactive Elements
- Hover effects on cards
- Gradient animations
- Smooth transitions
- Visual feedback for interactions

## Benefits

### For Developers
- **Quick Reference**: Instant access to all documentation
- **Searchable**: Find information quickly
- **Offline Access**: No internet required
- **Interactive**: Better than static markdown files

### For Teams
- **Centralized Knowledge**: All documentation in one place
- **Consistent Experience**: Same interface for everyone
- **Easy Onboarding**: New team members can explore easily
- **Version Controlled**: Documentation updates with code

## Integration with Agentwise

The `/docs` command integrates seamlessly with other Agentwise features:

1. **Command Discovery**: Learn about all available commands
2. **Agent Documentation**: Understand specialist agents
3. **Configuration Guides**: Setup and customization instructions
4. **Troubleshooting**: Quick access to problem solutions

## Troubleshooting

### Common Issues

#### Documentation Won't Open
```bash
# Check if running from project root
pwd
# Should show: /path/to/agentwise

# Verify documentation exists
ls docs/index.html
```

#### Browser Not Found (Linux)
```bash
# Install a browser
sudo apt-get install firefox
# or
sudo apt-get install chromium-browser
```

#### Permission Denied
```bash
# Make sure you have read permissions
chmod +r docs/index.html
```

### Manual Access

If the command fails to open the browser, you can manually access documentation:

1. **File URL**: Open `file:///path/to/agentwise/docs/index.html` in browser
2. **HTTP Server**: Run `python -m http.server 8000` in docs folder
3. **VS Code**: Use Live Server extension to serve documentation

## Command Options

### Future Enhancements

Planned features for the `/docs` command:

```bash
/docs search <term>     # Search documentation from terminal
/docs list              # List all documentation files
/docs open <file>       # Open specific documentation file
/docs update            # Check for documentation updates
/docs export            # Export documentation as PDF
```

## Best Practices

### Using Documentation Effectively

1. **Start with Overview**: Read README.md first
2. **Follow Getting Started**: Complete setup properly
3. **Reference Commands**: Keep commands.md handy
4. **Explore Features**: Learn about advanced capabilities
5. **Check Troubleshooting**: When encountering issues

### Contributing to Documentation

When contributing:
1. Update relevant `.md` files in `docs/`
2. Test that `/docs` command still works
3. Ensure links are relative and working
4. Add new files to index.html if needed
5. Follow markdown best practices

## API Reference

### DocsCommand Class

```typescript
export class DocsCommand {
  constructor()
  async handle(args: string[]): Promise<void>
  private async openInBrowser(): Promise<void>
  private showHelp(): void
  async listDocumentationFiles(): Promise<string[]>
  async searchDocumentation(searchTerm: string): Promise<void>
  async checkDocumentationStatus(): Promise<void>
}
```

### Usage in Code

```typescript
import { DocsCommand } from './commands/DocsCommand';

// Create instance
const docsCommand = new DocsCommand();

// Open documentation
await docsCommand.handle([]);

// Show help
await docsCommand.handle(['help']);

// Future: Search documentation
await docsCommand.searchDocumentation('agents');
```

## Security Considerations

The documentation command:
- **Read-only**: Only reads files, never modifies
- **Local files**: Uses file:// protocol for security
- **Path validation**: Ensures paths are within project
- **No external requests**: Completely offline operation

## Performance

The documentation hub is optimized for performance:
- **Static HTML**: No server required
- **Inline CSS**: Single file load
- **Minimal JavaScript**: Fast interaction
- **Lazy Loading**: Resources load as needed

## Accessibility

The documentation hub follows accessibility best practices:
- **Semantic HTML**: Proper heading structure
- **Keyboard Navigation**: Full keyboard support
- **Color Contrast**: WCAG AA compliant
- **Responsive Text**: Scalable typography

## Summary

The `/docs` command transforms Agentwise documentation from static files into an interactive, searchable, and beautiful documentation experience. It provides instant access to all the information developers need to effectively use Agentwise, making it an essential tool for both new users and experienced developers.

Use `/docs` anytime you need to:
- Learn about Agentwise features
- Find command references
- Troubleshoot issues
- Explore advanced capabilities
- Contribute to the project

The documentation hub is your comprehensive resource for mastering Agentwise!