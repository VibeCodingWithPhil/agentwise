# Agentwise Monitoring Dashboard - Design Specifications

## Overview
Create a real-time monitoring dashboard that visualizes the progress of multiple AI agents working on projects in parallel. The dashboard should auto-launch when agents start working and provide live updates as tasks complete.

## Design Requirements

### 1. Color Scheme
**Dark Theme (Primary)**
- Background: #0a0a0b (deep black)
- Surface: #1a1a1e (dark gray panels)
- Accent: #7c3aed (purple - matches Claude Code)
- Success: #10b981 (green)
- Warning: #f59e0b (orange)
- Error: #ef4444 (red)
- Text Primary: #ffffff
- Text Secondary: #9ca3af
- Borders: #27272a

### 2. Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Agentwise Monitor    [Project: Name]    [●] Live    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐  ┌─────────────────────────────────────┐ │
│  │              │  │                                     │ │
│  │   Overall    │  │      Agent Progress Grid           │ │
│  │   Progress   │  │                                     │ │
│  │              │  │                                     │ │
│  └──────────────┘  └─────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Phase Timeline                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Live Task Feed                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────┐  ┌─────────────────────────────────────┐ │
│  │   Metrics    │  │      Token Usage Graph              │ │
│  └──────────────┘  └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3. Components Specification

#### Header Bar
- **Logo**: Agentwise icon (stylized "A" with orbiting dots)
- **Project Name**: Current active project
- **Live Indicator**: Pulsing green dot when agents active
- **Time Elapsed**: Running timer since project start
- **Quick Actions**: Pause, Stop, Settings buttons

#### Overall Progress (Left Panel)
- **Large Circular Progress Ring**
  - Diameter: 200px
  - Stroke: Gradient from purple to green
  - Center: Large percentage number
  - Below: "X of Y tasks completed"
- **Estimated Time Remaining**
  - Display: "~X minutes remaining"
  - Update: Real-time calculation

#### Agent Progress Grid (5 Cards)
Each agent card should display:
- **Agent Avatar**: Unique icon for each specialist
  - Frontend: Monitor icon (🖥️)
  - Backend: Server icon (🗄️)
  - Database: Database icon (🗃️)
  - DevOps: Gear icon (⚙️)
  - Testing: Check icon (✓)
- **Agent Name**: e.g., "Frontend Specialist"
- **Status Indicator**: 
  - Idle (gray)
  - Working (animated purple pulse)
  - Completed (green)
  - Error (red)
- **Progress Bar**: Individual task progress
- **Current Task**: Truncated text with tooltip
- **Tasks Count**: "12/15 tasks"

#### Phase Timeline (Horizontal)
- **Phase Blocks**: Connected by lines
  - Each phase shows name and progress
  - Color coding: Gray (pending), Purple (active), Green (complete)
  - Smooth animations between phases
- **Phase Details on Hover**:
  - Phase name
  - Start/end time
  - Task breakdown
  - Agent assignments

#### Live Task Feed (Scrollable)
- **Task Items** (newest on top):
  ```
  [10:45:23] ✅ Frontend Specialist: Created login component
  [10:44:15] 🔄 Backend Specialist: Setting up authentication...
  [10:43:02] ❌ Testing Specialist: Unit test failed - retrying
  ```
- **Filters**: All, Completed, In Progress, Failed
- **Auto-scroll**: Option to follow latest
- **Search**: Quick filter by keyword

#### Metrics Panel
- **Key Metrics Cards**:
  - Total Tasks
  - Completion Rate
  - Average Task Duration
  - Failed Tasks
  - Active Agents
- **Visual Style**: Mini cards with icons and numbers

#### Token Usage Graph
- **Line Chart**: Real-time token consumption
- **X-axis**: Time (last 30 minutes)
- **Y-axis**: Tokens used
- **Multiple Lines**: One per agent (color-coded)
- **Total Counter**: Cumulative tokens with cost estimate

### 4. Animations & Interactions

#### Smooth Transitions
- Progress bars: Ease-in-out animation (300ms)
- Task completion: Slide + fade effect
- Phase transitions: Glow effect when completing
- Agent status: Pulse animation when working

#### Hover States
- Cards: Subtle scale (1.02) and shadow
- Buttons: Brightness increase
- Progress rings: Show detailed tooltip

#### Real-time Updates
- WebSocket connection for live data
- Update frequency: Every 500ms
- Smooth number transitions (no jumps)
- Notification sounds (optional) for completions

### 5. Responsive Breakpoints
- **Desktop**: Full layout (1920x1080 optimal)
- **Laptop**: Compress spacing (1366x768)
- **Tablet**: Stack panels vertically
- **Mobile**: Single column, collapsible sections

### 6. Special Features

#### Alert System
- **Success Toast**: Green, top-right, auto-dismiss (3s)
- **Error Modal**: Red border, requires acknowledgment
- **Warning Banner**: Orange, persistent until resolved

#### Multi-Project Support
- **Project Switcher**: Dropdown in header
- **Project Tabs**: Optional tabbed interface
- **Quick Compare**: Side-by-side view (2 projects max)

#### Export Options
- **Download Report**: PDF with charts and metrics
- **Export Data**: JSON/CSV of all task data
- **Share Link**: Generate shareable dashboard URL

### 7. Performance Indicators

#### Visual Feedback for Performance
- **Fast Tasks** (< 30s): Green indicator
- **Normal Tasks** (30s - 2min): Default
- **Slow Tasks** (> 2min): Yellow indicator
- **Stalled Tasks** (> 5min): Red alert

#### Agent Health Status
- **CPU Usage**: Mini bar per agent
- **Memory**: Visual indicator if high
- **Queue Length**: Number of pending tasks

### 8. Accessibility
- **High Contrast Mode**: Toggle option
- **Font Size**: Adjustable (S/M/L)
- **Screen Reader**: Proper ARIA labels
- **Keyboard Navigation**: Tab through sections

### 9. Loading States
- **Initial Load**: Skeleton screens with shimmer
- **Data Refresh**: Subtle spinner in corner
- **Connection Lost**: Clear warning banner

### 10. Empty States
- **No Active Project**: Welcome screen with quick start
- **No Tasks**: Friendly message with suggestions
- **All Complete**: Celebration animation

## Technical Implementation Notes

### Auto-Launch Behavior
1. Dashboard opens automatically when:
   - `/create` command initiates new project
   - `/task` command starts work
   - `/init-import` begins import process
   - Any agent starts processing

2. Dashboard URL: `http://localhost:3001/dashboard`

3. Opens in default browser with:
   - Full screen mode preferred
   - Dark theme auto-selected
   - WebSocket connection established

### Data Structure
```javascript
{
  projectId: "project-123",
  projectName: "E-commerce Platform",
  startTime: "2024-08-19T10:00:00Z",
  overallProgress: 45,
  currentPhase: 2,
  agents: [
    {
      id: "frontend-specialist",
      status: "working",
      currentTask: "Building checkout component",
      progress: 60,
      tasksCompleted: 8,
      tasksTotal: 15
    }
  ],
  phases: [...],
  tasks: [...],
  metrics: {...}
}
```

## Figma Design Guidelines

When creating in Figma:
1. Use 8px grid system
2. Border radius: 8px for cards, 4px for buttons
3. Shadows: 0 4px 6px rgba(0, 0, 0, 0.1)
4. Typography:
   - Headers: Inter Bold, 24px
   - Subheaders: Inter Semibold, 18px
   - Body: Inter Regular, 14px
   - Mono: JetBrains Mono for code/logs

5. Create components for:
   - Agent cards
   - Progress rings
   - Task items
   - Phase blocks
   - Metric cards

6. Include states for:
   - Default
   - Hover
   - Active
   - Disabled
   - Loading
   - Error

This dashboard should feel professional, modern, and aligned with developer tools aesthetics while maintaining clarity and usability for monitoring multiple AI agents in real-time.