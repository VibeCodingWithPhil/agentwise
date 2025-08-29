# /figma-select

Select a Figma file, frame, or component for design-to-code conversion with intelligent context loading.

## Usage

```bash
/figma-select <file-id>                    # Select entire file
/figma-select <file-id> <node-id>         # Select specific node
/figma-select <file-url>                  # Select from Figma URL
/figma-select --interactive               # Interactive selection
/figma-select --recent                    # Select from recent files
```

## Description

This command selects a Figma design context for code generation. It can work with entire files, specific frames, or individual components, loading all necessary design data including styles, components, and variables.

## Selection Methods

### 1. Direct File Selection
```bash
/figma-select file_ABC123XYZ
```
Loads entire file with all pages and frames.

### 2. Specific Node Selection
```bash
/figma-select file_ABC123XYZ node:456:789
```
Focuses on specific frame or component.

### 3. URL-based Selection
```bash
/figma-select "https://www.figma.com/file/ABC123/Project-Name?node-id=456:789"
```
Automatically extracts file and node IDs from URL.

### 4. Interactive Selection
```bash
/figma-select --interactive
```
Provides UI for browsing and selecting:
- Shows file preview thumbnails
- Lists all pages and frames
- Displays component hierarchy
- Allows multi-selection

## Context Loading

### What Gets Loaded

#### Design Data
- Selected nodes and children
- Component instances and masters
- Styles and effects
- Layout constraints
- Auto-layout properties

#### Design Tokens
- Color variables
- Typography styles
- Spacing tokens
- Effect styles
- Grid configurations

#### Assets
- Exported images
- Icons and vectors
- Component thumbnails

#### Code Connect (if available)
- Component mappings
- Code snippets
- Props documentation

### Smart Context Detection

The command intelligently determines what to load:

```bash
/figma-select <file> --smart
```

- **For Components**: Loads component + all variants
- **For Frames**: Loads frame + child components
- **For Pages**: Loads all frames in page
- **For Systems**: Loads tokens + components

## Selection Options

### Scope Options
```bash
--full              # Load entire file (default)
--shallow           # Load only selected node
--deep=<number>     # Load N levels deep
--components-only   # Load only components
--frames-only       # Load only frames
```

### Filter Options
```bash
--published         # Only published components
--has-code-connect  # Only with Code Connect
--type=<type>       # Filter by node type
--name=<pattern>    # Filter by name pattern
```

### Performance Options
```bash
--no-images         # Skip image downloads
--no-styles         # Skip style processing
--cache             # Use cached data if available
--lightweight       # Minimal data for quick preview
```

## Multi-Selection

### Select Multiple Frames
```bash
/figma-select <file> --frames="Login,Dashboard,Profile"
```

### Select Page Range
```bash
/figma-select <file> --pages="1-3,5"
```

### Select by Pattern
```bash
/figma-select <file> --pattern="Button*"
```

## Context Validation

After selection, validates:
- ✓ File accessibility
- ✓ Node existence
- ✓ Required permissions
- ✓ Dev Mode availability
- ✓ Code Connect setup

## Output

### Selection Summary
```
Selected: Mobile App Design
File ID: ABC123XYZ
Nodes: 5 frames, 23 components
Tokens: 48 colors, 12 typography, 8 spacing
Code Connect: ✓ Available
Dev Mode: ✓ Enabled
```

### Context Structure
```json
{
  "file": {
    "id": "ABC123XYZ",
    "name": "Mobile App Design",
    "version": "2.1.0"
  },
  "selection": {
    "nodes": [...],
    "components": [...],
    "styles": {...},
    "variables": {...}
  },
  "metadata": {
    "lastModified": "2025-01-10T10:00:00Z",
    "codeConnect": true,
    "devMode": true
  }
}
```

## Integration with Dev Mode MCP

When Dev Mode is active:
- Real-time selection sync
- Live preview in terminal
- Automatic context updates
- Component usage tracking

## Examples

### Select Latest Design
```bash
/figma-select --recent
# Shows list of recent files to choose from
```

### Select Specific Component
```bash
/figma-select file_ABC123 --component="PrimaryButton"
# Selects the PrimaryButton component and all variants
```

### Select Mobile Screens
```bash
/figma-select file_ABC123 --frames="Mobile/*"
# Selects all frames starting with "Mobile/"
```

### Select for Code Generation
```bash
/figma-select file_ABC123 node:456:789 --with-context
# Loads node with full context for accurate code generation
```

## Workspace Integration

Selected context is saved to:
```
workspace/[project]/
├── .figma/
│   ├── selection.json      # Current selection
│   ├── context.json        # Full context data
│   ├── tokens.json         # Design tokens
│   └── components.json     # Component registry
```

## Error Handling

### File Not Found
- Verify file ID is correct
- Check file permissions
- Ensure file isn't deleted

### Node Not Found
- Node might be deleted
- Check if node is in different page
- Verify node ID format

### Access Denied
- Check authentication
- Verify team membership
- Ensure file is shared with you

## Next Steps

After selection:
1. Run `/figma-inspect` to analyze the design
2. Use `/figma-generate` to create component code
3. Run `/figma-create` to build full application
4. Use `/figma-sync` to keep code updated