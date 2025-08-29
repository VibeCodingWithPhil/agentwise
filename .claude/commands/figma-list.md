# /figma-list

List all your Figma teams, projects, and files with filtering and search capabilities.

## Usage

```bash
/figma-list                    # List all teams and recent files
/figma-list teams             # List all teams
/figma-list projects [team]   # List projects for a team
/figma-list files [project]   # List files in a project
/figma-list recent            # List recently modified files
/figma-list search <query>    # Search files by name
```

## Description

This command provides comprehensive access to your Figma workspace, allowing you to browse teams, projects, and files. It integrates with both the Figma REST API and the Dev Mode MCP server for enhanced functionality.

## Features

### Team Listing
```bash
/figma-list teams
```
Shows:
- Team name and ID
- Member count
- Plan type (Starter/Professional/Organization/Enterprise)
- Projects count

### Project Listing
```bash
/figma-list projects [team-id]
```
Shows:
- Project name and ID
- File count
- Last modified date
- Collaborators
- Project type (Design/FigJam/Slides)

### File Listing
```bash
/figma-list files [project-id]
```
Shows:
- File name and ID
- File type (Design/Component Library/Design System)
- Last modified
- Version history
- Published status
- Dev Mode availability

### Smart Filtering

#### By Type
```bash
/figma-list files --type=component-library
/figma-list files --type=design-system
/figma-list files --type=prototype
```

#### By Status
```bash
/figma-list files --published
/figma-list files --dev-mode
/figma-list files --has-code-connect
```

#### By Date
```bash
/figma-list files --modified=today
/figma-list files --modified=week
/figma-list files --modified=month
```

## Output Format

### Default (Table)
```
┌─────────────────────────┬──────────────┬──────────────┬─────────┐
│ Name                    │ Type         │ Modified     │ Status  │
├─────────────────────────┼──────────────┼──────────────┼─────────┤
│ Mobile App Design       │ Design       │ 2 hours ago  │ ✓ Dev   │
│ Component Library v2    │ Components   │ 1 day ago    │ ✓ Pub   │
│ Design System          │ System       │ 3 days ago   │ ✓ Both  │
└─────────────────────────┴──────────────┴──────────────┴─────────┘
```

### JSON Output
```bash
/figma-list files --json
```
Returns structured data for programmatic use.

### Tree View
```bash
/figma-list --tree
```
Shows hierarchical structure:
```
Team: Acme Corp
├── Project: Mobile App
│   ├── iOS Designs
│   ├── Android Designs
│   └── Shared Components
├── Project: Web Platform
│   ├── Landing Pages
│   ├── Dashboard
│   └── Component Library
```

## Integration with Dev Mode

When Dev Mode MCP server is connected:
- Shows real-time file status
- Indicates which files have Code Connect
- Displays component usage metrics
- Shows design token availability

## Caching

Results are cached for performance:
- Teams: 1 hour
- Projects: 30 minutes
- Files: 5 minutes
- Use `--refresh` to force update

## Examples

### List Everything
```bash
/figma-list
# Shows all teams, then recent files from all teams
```

### List Specific Team's Projects
```bash
/figma-list projects team_123456
# Shows all projects in the specified team
```

### Search for Files
```bash
/figma-list search "button component"
# Searches across all accessible files
```

### List Component Libraries
```bash
/figma-list files --type=component-library --published
# Shows only published component libraries
```

### List Recently Modified
```bash
/figma-list recent --limit=10
# Shows 10 most recently modified files
```

## Permissions

Requires authentication with appropriate scopes:
- `file_read`: View files
- `file_dev_resources`: Access Dev Mode features
- Team access for team/project listing

## Error Handling

### No Files Found
- Check authentication status
- Verify team membership
- Ensure files are shared with you

### Rate Limiting
- API has rate limits (varies by plan)
- Implements automatic retry with backoff
- Shows remaining quota in verbose mode

## Next Steps

After listing files:
1. Use `/figma-select <file-id>` to choose a file
2. Run `/figma-inspect` to analyze the design
3. Use `/figma-generate` to create code
4. Run `/figma-create` to build full application