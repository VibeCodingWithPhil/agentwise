# Monitoring System Fix Plan

## Problem Identified

The current monitoring system (`ProgressTracker.ts`) is not connected to the actual MD files in workspace projects. It only tracks progress in memory and saves to `progress.json`, but doesn't:
1. Watch the todo-spec.md files for checkbox changes
2. Update phase-X-implementation.md files with progress
3. Parse existing MD files to extract task status

## Current System Architecture

### What Exists:
- **ProgressTracker.ts**: Tracks progress in memory, saves to progress.json
- **Dashboard.ts**: Web dashboard for viewing progress
- **TaskDistributor.ts**: Parses todo-spec.md but doesn't track completion
- **AgentManager.ts**: Launches agents but doesn't monitor their progress

### What's Missing:
- **File Watcher**: No component watches MD files for changes
- **MD Parser**: No parser to extract checkbox states from MD files
- **MD Updater**: No utility to update checkboxes in MD files
- **Integration**: No connection between file changes and ProgressTracker

## Required Fixes

### 1. Create MDFileWatcher Component
```typescript
// src/monitoring/MDFileWatcher.ts
- Watch workspace/*/todo-spec.md files
- Watch workspace/*/phase-*.md files
- Detect checkbox state changes ([ ] vs [x])
- Emit events when tasks are checked/unchecked
```

### 2. Create MDTaskParser Component
```typescript
// src/monitoring/MDTaskParser.ts
- Parse MD files to extract tasks with checkboxes
- Identify task descriptions and priorities
- Map tasks to agents based on content
- Track completion percentage per phase
```

### 3. Create MDTaskUpdater Component
```typescript
// src/monitoring/MDTaskUpdater.ts
- Update checkbox states in MD files
- Preserve file formatting and structure
- Add timestamps as comments when tasks complete
- Update phase completion percentages
```

### 4. Integrate with ProgressTracker
```typescript
// Modifications to ProgressTracker.ts
- Subscribe to MDFileWatcher events
- Update progress when MD files change
- Sync progress.json with MD file states
- Trigger dashboard updates
```

## Implementation Plan

### Phase 1: File Monitoring
1. Install chokidar for file watching
2. Create MDFileWatcher class
3. Set up event emitters for file changes
4. Test with sample MD files

### Phase 2: MD Parsing
1. Create regex patterns for checkbox detection
2. Build task extraction logic
3. Map tasks to phases and agents
4. Calculate completion percentages

### Phase 3: MD Updating
1. Create safe file update mechanism
2. Preserve original formatting
3. Add completion timestamps
4. Test with real project files

### Phase 4: Integration
1. Connect MDFileWatcher to ProgressTracker
2. Sync progress.json with MD states
3. Update Dashboard to show real progress
4. Test end-to-end workflow

## File Structure After Fix

```
src/monitoring/
├── Dashboard.ts           (existing - web UI)
├── ProgressTracker.ts     (modified - add MD sync)
├── MDFileWatcher.ts       (new - watch MD files)
├── MDTaskParser.ts        (new - parse MD tasks)
├── MDTaskUpdater.ts       (new - update MD files)
├── launch-dashboard.ts    (existing)
└── test-dashboard.ts      (existing)
```

## Expected MD File Format

### todo-spec.md
```markdown
## Phase 1: Foundation
- [ ] Initialize project
- [x] Set up database
- [ ] Configure authentication
```

### phase-1-implementation.md
```markdown
## Frontend Specialist Tasks
1. [ ] Create React app
2. [x] Install dependencies <!-- completed: 2024-08-19 10:30 -->
3. [ ] Set up routing
```

## Success Criteria

1. ✅ When agent checks a box in MD file, progress.json updates
2. ✅ Dashboard shows real-time progress from MD files
3. ✅ Phase completion percentage calculated from checkboxes
4. ✅ Timestamps added when tasks complete
5. ✅ Progress persists across restarts
6. ✅ Multiple projects tracked independently

## Testing Strategy

1. Create test project with sample MD files
2. Manually check/uncheck boxes
3. Verify progress.json updates
4. Confirm dashboard reflects changes
5. Test with multiple concurrent projects
6. Verify file integrity after updates