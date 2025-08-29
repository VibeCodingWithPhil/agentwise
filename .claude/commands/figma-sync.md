# /figma-sync

Keep your code synchronized with Figma designs in real-time, automatically updating when designs change.

## Usage

```bash
/figma-sync                    # Start sync for current project
/figma-sync --watch           # Watch mode with auto-update
/figma-sync --preview         # Preview changes before applying
/figma-sync --selective       # Choose which changes to sync
```

## Description

This command maintains synchronization between Figma designs and generated code, detecting changes and intelligently updating only what's needed while preserving custom code.

## Sync Modes

### Manual Sync
```bash
/figma-sync
```
- Checks for design changes
- Shows diff preview
- Requires confirmation
- Updates code

### Watch Mode
```bash
/figma-sync --watch
```
- Monitors designs continuously
- Auto-updates on changes
- Preserves custom code
- Shows notifications

### Selective Sync
```bash
/figma-sync --selective
```
- Lists all changes
- Choose what to sync
- Skip certain updates
- Preserve overrides

## Change Detection

### What Gets Tracked
- **Visual Changes**: Colors, sizes, spacing
- **Structure Changes**: New/removed components
- **Content Changes**: Text, images
- **Style Changes**: Typography, effects
- **Layout Changes**: Positioning, alignment
- **Token Changes**: Design system updates

### Smart Diffing
```bash
/figma-sync --diff
```
Shows exactly what changed:
```diff
Component: Button
- background-color: #3B82F6
+ background-color: #2563EB
- padding: 12px 24px
+ padding: 14px 28px
+ border-radius: 8px (new)
```

## Code Preservation

### Protected Regions
```javascript
// @figma-preserve-start
// Custom logic here won't be overwritten
const handleCustomClick = () => {
  // Your code safe here
};
// @figma-preserve-end
```

### Merge Strategies
- **Replace**: Full replacement (default)
- **Merge**: Intelligent merging
- **Append**: Add new, keep existing
- **Manual**: Review each change

## Real-time Collaboration

### Team Sync
```bash
/figma-sync --team
```
- Notifies team of updates
- Coordinates changes
- Prevents conflicts
- Maintains version history

### Branch Management
```bash
/figma-sync --branch=feature/new-design
```
- Creates feature branch
- Commits changes
- Opens pull request
- Tags with design version

## Design Tokens Sync

### Automatic Token Updates
```bash
/figma-sync --tokens
```
Updates:
- Color variables
- Typography scales
- Spacing systems
- Border radii
- Shadow definitions

### Token Propagation
Changes propagate through:
1. Design token files
2. CSS variables
3. Theme configuration
4. Component styles

## Component Sync

### New Components
When new components are added:
```bash
New component detected: SearchBar
- Generate component code? [Y/n]
- Add to component library? [Y/n]
- Create tests? [Y/n]
```

### Component Updates
When components change:
```bash
Component updated: Button
Changes:
  - Added 'size' variant
  - New 'ghost' style
  - Updated padding
Apply updates? [Y/n]
```

### Component Deletion
When components are removed:
```bash
Component removed: OldCard
- Remove from codebase? [Y/n]
- Keep as deprecated? [Y/n]
```

## Version Control Integration

### Automatic Commits
```bash
/figma-sync --auto-commit
```
Creates commits like:
```
feat: Sync design updates from Figma

- Updated Button component styles
- Added new SearchBar component
- Updated color tokens

Figma file: ABC123XYZ
Version: 2.1.0
```

### Design Versioning
```bash
/figma-sync --tag-version
```
Tags code with design version:
- `design-v1.0.0`
- `design-v1.1.0`
- `design-v2.0.0`

## Conflict Resolution

### Style Conflicts
```bash
Component has local changes:
  Local:  padding: 16px
  Figma:  padding: 20px
  
Resolution:
  1. Keep local
  2. Use Figma
  3. Merge (create variant)
```

### Structure Conflicts
```bash
Component structure changed:
  Local:  <div><span>Text</span></div>
  Figma:  <button><span>Text</span></button>
  
Resolution:
  1. Update structure
  2. Keep current
  3. Review manually
```

## Rollback Support

### Undo Sync
```bash
/figma-sync --undo
```
Reverts last sync operation

### Restore Version
```bash
/figma-sync --restore=v1.2.0
```
Restores to specific version

### History
```bash
/figma-sync --history
```
Shows sync history:
```
2025-01-10 14:30 - Synced 5 components
2025-01-10 10:15 - Updated tokens
2025-01-09 16:45 - Added SearchBar
```

## Performance

### Incremental Sync
Only syncs changed elements:
- Analyzes diff
- Updates minimal code
- Preserves unchanged
- Optimizes build

### Batch Processing
```bash
/figma-sync --batch
```
Groups changes for efficiency:
- Collects all changes
- Applies in one operation
- Single rebuild
- Faster updates

## Notifications

### Desktop Notifications
```bash
/figma-sync --notify
```
Shows notifications for:
- Design updates available
- Sync completed
- Conflicts detected
- Errors occurred

### Slack/Discord Integration
```bash
/figma-sync --slack-webhook=URL
```
Sends updates to team channels

## Advanced Options

### Dry Run
```bash
/figma-sync --dry-run
```
Shows what would change without applying

### Force Sync
```bash
/figma-sync --force
```
Overwrites all local changes (dangerous!)

### Partial Sync
```bash
/figma-sync --only=components/Button
```
Syncs specific components only

### Exclude Patterns
```bash
/figma-sync --exclude="*Test*,*Draft*"
```
Skips matching components

## Quality Checks

After sync:
- ✓ Runs linting
- ✓ Type checking
- ✓ Test execution
- ✓ Build verification
- ✓ Visual regression tests

## Examples

### Basic Sync
```bash
/figma-sync
# Checks for updates and applies them
```

### Watch with Auto-commit
```bash
/figma-sync --watch --auto-commit
# Continuously syncs and commits changes
```

### Selective Token Sync
```bash
/figma-sync --tokens --selective
# Choose which tokens to update
```

### Team Collaboration
```bash
/figma-sync --team --branch --notify
# Full team sync workflow
```

## Error Handling

### Connection Issues
- Retries automatically
- Falls back to cached data
- Queues changes for later

### Invalid Changes
- Validates before applying
- Shows warnings
- Suggests fixes

### Build Failures
- Reverts changes
- Shows error details
- Provides solutions

## Next Steps

After syncing:
1. Review changes: `git diff`
2. Run tests: `npm test`
3. Check build: `npm run build`
4. Deploy updates: `/figma-deploy`