# Figma Dev Mode MCP Integration

## Overview

Agentwise now includes seamless integration with Figma's Dev Mode MCP Server, enabling AI-powered design-to-code workflows directly from your Figma designs. This integration brings design context and components directly into your development environment.

## Prerequisites

Before using the Figma integration, ensure you have:

1. **Figma Desktop App**: Latest version installed and running
2. **Figma Plan**: Dev or Full seat on Professional/Organization/Enterprise plan
3. **MCP Server Enabled**: Enable Dev Mode MCP Server in Figma Preferences
4. **Active Design File**: Open a Figma design file with frames/components

## Setup Instructions

### 1. Enable Figma Dev Mode MCP Server

1. Open Figma Desktop App
2. Navigate to **Menu > Preferences**
3. Find and enable **"Enable Dev Mode MCP Server"**
4. The server will run locally at `http://127.0.0.1:3845/mcp`

### 2. Connect Agentwise to Figma

```bash
/figma connect
```

This command will:
- Check if Figma desktop is running
- Verify MCP Server accessibility
- Establish connection for design operations

## Available Commands

### `/figma connect`
Establishes connection to Figma MCP Server
```bash
/figma connect
```

### `/figma generate [name]`
Generate component code from current Figma selection
```bash
/figma generate Button
# Interactive prompts for framework and options
```

**Supported Frameworks:**
- React (TSX)
- Vue
- Angular
- HTML
- Swift (iOS)
- Kotlin (Android)

### `/figma sync`
Synchronize design tokens and components with your codebase
```bash
/figma sync
```

**What gets synced:**
- Design variables (colors, spacing, typography)
- Component mappings via Code Connect
- Design system rules

### `/figma tokens [path]`
Export design tokens to JSON format
```bash
/figma tokens ./src/design-tokens.json
```

**Token Categories:**
- Colors
- Spacing
- Typography
- Border Radius
- Shadows/Effects

### `/figma image [path]`
Capture screenshot of current Figma selection
```bash
/figma image ./screenshots/button-design.png
```

### `/figma rules [dir]`
Generate design system rules for consistency
```bash
/figma rules ./src/design-system
```

### `/figma status`
Check connection status and available resources
```bash
/figma status
```

## Workflow Examples

### 1. Component Generation Workflow

```bash
# 1. Select a frame/component in Figma
# 2. Generate React component
/figma generate HeaderComponent

# 3. Component will be created at:
# src/components/HeaderComponent/HeaderComponent.tsx
# src/components/HeaderComponent/index.ts
```

### 2. Design Token Workflow

```bash
# 1. Define variables in Figma (colors, spacing, etc.)
# 2. Export tokens to your project
/figma tokens ./src/theme/tokens.json

# 3. Use tokens in your CSS/JS
import tokens from './theme/tokens.json';
```

### 3. Full Design Sync Workflow

```bash
# 1. Connect to Figma
/figma connect

# 2. Sync everything
/figma sync

# 3. Generated files:
# - src/design-tokens.json
# - Component mappings updated
# - Design rules applied
```

## Features

### Code Connect Integration
- Links Figma components to actual code components
- Maintains consistency between design and implementation
- Supports component property mapping

### Design Variable Extraction
- Automatically extracts design variables
- Categorizes into appropriate token types
- Maintains naming conventions

### Multi-Framework Support
- Generate code for multiple frameworks
- Framework-specific optimizations
- Proper typing and structure

### Real-time Synchronization
- Live connection to Figma desktop
- Instant access to selection changes
- Automatic context updates

## Best Practices

### 1. Semantic Naming
Use clear, semantic names for your Figma layers and components:
```
✅ Good: "PrimaryButton", "NavigationHeader"
❌ Bad: "Frame 123", "Rectangle 2"
```

### 2. Component Structure
Organize components hierarchically in Figma:
```
Components/
├── Buttons/
│   ├── PrimaryButton
│   ├── SecondaryButton
│   └── IconButton
└── Forms/
    ├── TextField
    └── Checkbox
```

### 3. Design Variables
Define variables for consistent theming:
- **Colors**: Primary, Secondary, Background, Text
- **Spacing**: 4px, 8px, 16px, 24px, 32px
- **Typography**: Heading, Body, Caption
- **Effects**: Shadow-sm, Shadow-md, Shadow-lg

### 4. Code Connect Setup
Link Figma components to code:
1. Use consistent naming between Figma and code
2. Map component properties correctly
3. Document prop mappings

## Troubleshooting

### Connection Issues

**Problem**: Cannot connect to Figma MCP Server
```bash
❌ Error: Figma MCP Server is not accessible
```

**Solutions:**
1. Ensure Figma desktop app is running
2. Enable Dev Mode MCP Server in Preferences
3. Check firewall settings for port 3845
4. Restart Figma desktop app

### Generation Failures

**Problem**: Code generation fails
```bash
❌ Error: Failed to generate code
```

**Solutions:**
1. Select a valid frame/component in Figma
2. Ensure selection has proper structure
3. Check component naming (avoid special characters)
4. Verify you have proper Figma plan access

### Token Export Issues

**Problem**: Design tokens not exporting correctly
```bash
❌ Error: No variables found
```

**Solutions:**
1. Define variables in Figma file
2. Publish variables to team library
3. Ensure variables are properly scoped
4. Check variable naming conventions

## Advanced Usage

### Custom Component Templates

Create custom generation templates:

```javascript
// figma.config.js
module.exports = {
  templates: {
    react: {
      component: 'functional', // or 'class'
      styling: 'styled-components', // or 'css-modules', 'tailwind'
      testing: true,
      storybook: true
    }
  }
};
```

### Batch Processing

Generate multiple components:

```bash
# Select multiple frames in Figma
/figma generate --batch
```

### CI/CD Integration

Automate design syncing in pipelines:

```yaml
# .github/workflows/design-sync.yml
- name: Sync Figma Designs
  run: |
    agentwise /figma sync
    agentwise /figma tokens ./src/tokens.json
```

## API Reference

### FigmaMCPClient Methods

```typescript
// Initialize connection
await client.initialize();

// Generate code from selection
const code = await client.getCode({
  framework: 'react',
  includeStyles: true,
  useCodeConnect: true
});

// Get design variables
const variables = await client.getVariableDefinitions();

// Export design tokens
await client.exportDesignTokens('./tokens.json');

// Capture screenshot
await client.getImage('./screenshot.png');

// Create design rules
await client.createDesignSystemRules('./design-system');
```

## Security Considerations

1. **Local Server Only**: MCP Server runs locally (127.0.0.1)
2. **No External Access**: Cannot be accessed from outside your machine
3. **Secure Communication**: All data stays on your local network
4. **No Credentials Stored**: Uses Figma desktop session

## Limitations

- **Beta Feature**: Some functionality may be unstable
- **Desktop Only**: Requires Figma desktop app (not web)
- **Plan Requirements**: Needs paid Figma plan with Dev Mode
- **Selection Based**: Operations work on current selection only

## Future Enhancements

- Automatic component library generation
- Two-way sync (code changes back to Figma)
- Design system documentation generation
- Visual regression testing integration
- Component playground generation

## Support

For issues or questions:
- Check Figma Dev Mode documentation
- Verify prerequisites are met
- Use `/figma status` for diagnostics
- Report issues to Agentwise GitHub repository