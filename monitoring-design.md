# Agentwise Monitoring Dashboard - Design Specifications

## Overview
Create a real-time monitoring dashboard that visualizes the progress of multiple AI agents working on projects in parallel. The dashboard should auto-launch when agents start working and provide live updates as tasks complete. **IMPORTANT**: The system supports dynamic agent creation, so the UI must handle any number of agents beyond the default 5.

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
- Scroll Track: #1a1a1e
- Scroll Thumb: #7c3aed

### 2. Dynamic Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  [Logo] Agentwise Monitor    [Project: Name]    [●] Live    │
├─────────────────────────────────────────────────────────────┤
│                          ▼ SCROLLABLE AREA ▼               │
│  ┌──────────────┐  ┌─────────────────────────────────────┐ │
│  │              │  │    Agent Progress Grid (Dynamic)     │ │
│  │   Overall    │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │ │
│  │   Progress   │  │  │Agent│ │Agent│ │Agent│ │Agent│  │ │
│  │              │  │  └─────┘ └─────┘ └─────┘ └─────┘  │ │
│  │   [Sticky]   │  │  ┌─────┐ ┌─────┐ ┌─────┐ [+MORE]  │ │
│  └──────────────┘  │  │Agent│ │Agent│ │Agent│  ↓ ↓ ↓   │ │
│                    └─────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Phase Timeline (Horizontal Scroll)     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │          Live Task Feed (Virtual Scroll)               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────┐  ┌─────────────────────────────────────┐ │
│  │   Metrics    │  │    Token Usage Graph (Scrollable)    │ │
│  └──────────────┘  └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 3. Components Specification (ENHANCED)

#### Header Bar (Fixed Position)
- **Logo**: Agentwise icon (stylized "A" with orbiting dots)
- **Project Name**: Current active project
- **Live Indicator**: Pulsing green dot when agents active
- **Time Elapsed**: Running timer since project start
- **Agent Count Badge**: Shows total number of active agents (e.g., "12 Agents")
- **Quick Actions**: Pause, Stop, Settings, Add Agent buttons

#### Overall Progress (Sticky Left Panel)
- **Position**: Fixed on scroll, always visible
- **Large Circular Progress Ring**
  - Diameter: 200px
  - Stroke: Gradient animation from purple to green
  - Center: Large percentage with smooth transitions
  - Below: "X of Y tasks completed"
- **Estimated Time Remaining**
  - Display: "~X minutes remaining"
  - Updates with smooth number transitions
- **Phase Indicator**: Current phase name with progress

#### Agent Progress Grid (DYNAMIC & SCROLLABLE)
**Grid Layout**:
```javascript
// Responsive grid calculation
const gridColumns = Math.min(4, agentCount);
const gridRows = Math.ceil(agentCount / gridColumns);
const cardWidth = (containerWidth - (gaps * (gridColumns - 1))) / gridColumns;
```

**Agent Card Design**:
- **Size**: Min 180px × 200px, Max 250px × 280px
- **Default Agent Icons**:
  - Frontend: Monitor (🖥️)
  - Backend: Server (🗄️)
  - Database: Database (🗃️)
  - DevOps: Gear (⚙️)
  - Testing: Check (✓)
- **Custom Agent Icons**: Dynamic icon based on specialization
  - Security: Shield (🛡️)
  - AI/ML: Brain (🧠)
  - Mobile: Phone (📱)
  - Custom: First letter of name in circle

**Card Content**:
```html
<div class="agent-card" data-agent-id="{{agentId}}">
  <div class="agent-header">
    <div class="agent-icon {{status}}">{{icon}}</div>
    <div class="agent-name">{{name}}</div>
  </div>
  <div class="agent-status">{{status}}</div>
  <div class="progress-bar">
    <div class="progress-fill" style="width: {{progress}}%"></div>
  </div>
  <div class="current-task">{{currentTask}}</div>
  <div class="task-count">{{completed}}/{{total}} tasks</div>
  <div class="agent-metrics">
    <span class="duration">{{duration}}</span>
    <span class="tokens">{{tokens}}</span>
  </div>
</div>
```

**Grid Scrolling**:
- Vertical scroll when > 8 agents
- Smooth scroll with momentum
- Lazy loading for performance
- Show "X more agents" indicator

#### Phase Timeline (Horizontal Scroll)
- **Scrollable Container**: Overflow-x: auto
- **Dynamic Width**: Adjusts based on number of phases
- **Phase Blocks**: 
  - Min width: 150px per phase
  - Connected by animated progress lines
  - Show agent assignments on hover
- **Smart Scrolling**: Auto-scroll to active phase

#### Live Task Feed (Virtual Scrolling)
```javascript
// Virtual scrolling for performance
const VirtualTaskFeed = {
  visibleItems: 50,
  totalItems: allTasks.length,
  itemHeight: 40,
  containerHeight: 400,
  
  renderVisibleItems() {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = startIndex + visibleItems;
    return tasks.slice(startIndex, endIndex);
  }
};
```

#### Metrics Panel (Responsive Grid)
```css
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}
```

### 4. Animations & Interactions (DETAILED)

#### CSS Animations
```css
/* Pulse animation for live indicator */
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.2); }
}

/* Progress bar fill animation */
@keyframes progressFill {
  from { width: var(--from-width); }
  to { width: var(--to-width); }
}

/* Agent card entrance animation */
@keyframes slideIn {
  from { 
    opacity: 0; 
    transform: translateY(20px) scale(0.95);
  }
  to { 
    opacity: 1; 
    transform: translateY(0) scale(1);
  }
}

/* Task completion celebration */
@keyframes celebrate {
  0% { transform: scale(1) rotate(0deg); }
  50% { transform: scale(1.1) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); }
}
```

#### JavaScript Animations
```javascript
// Smooth number transitions
function animateNumber(element, from, to, duration = 300) {
  const startTime = performance.now();
  const update = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOutCubic(progress);
    const current = from + (to - from) * eased;
    element.textContent = Math.round(current);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  };
  requestAnimationFrame(update);
}

// Stagger animation for agent cards
function animateAgentCards() {
  const cards = document.querySelectorAll('.agent-card');
  cards.forEach((card, index) => {
    card.style.animationDelay = `${index * 50}ms`;
    card.classList.add('animate-in');
  });
}
```

### 5. Real-time Updates (WebSocket Implementation)

```javascript
// WebSocket connection for real-time updates
class DashboardSocket {
  constructor() {
    this.ws = new WebSocket('ws://localhost:3001/dashboard');
    this.reconnectAttempts = 0;
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleUpdate(data);
    };

    this.ws.onclose = () => {
      this.reconnect();
    };
  }

  handleUpdate(data) {
    switch(data.type) {
      case 'agent:added':
        this.addAgentCard(data.agent);
        break;
      case 'task:completed':
        this.updateTaskProgress(data.taskId);
        this.animateCompletion(data.agentId);
        break;
      case 'phase:changed':
        this.scrollToPhase(data.phase);
        break;
      case 'progress:update':
        this.smoothUpdateProgress(data.progress);
        break;
    }
  }

  addAgentCard(agent) {
    const grid = document.getElementById('agent-grid');
    const card = this.createAgentCard(agent);
    grid.appendChild(card);
    
    // Animate entrance
    requestAnimationFrame(() => {
      card.classList.add('animate-in');
    });
    
    // Recalculate grid layout
    this.recalculateGrid();
  }

  recalculateGrid() {
    const grid = document.getElementById('agent-grid');
    const agentCount = grid.children.length;
    
    if (agentCount > 8) {
      grid.classList.add('scrollable');
      grid.style.maxHeight = '600px';
    }
    
    // Adjust columns based on count
    const columns = Math.min(4, Math.ceil(Math.sqrt(agentCount)));
    grid.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  }
}
```

### 6. Responsive Design (Breakpoints & Behavior)

```css
/* Desktop (1920px+) */
@media (min-width: 1920px) {
  .agent-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
  .dashboard-container {
    max-width: 1800px;
    margin: 0 auto;
  }
}

/* Laptop (1366px - 1919px) */
@media (min-width: 1366px) and (max-width: 1919px) {
  .agent-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
  .agent-card {
    min-width: 160px;
  }
}

/* Tablet (768px - 1365px) */
@media (min-width: 768px) and (max-width: 1365px) {
  .agent-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  .overall-progress {
    position: relative;
    width: 100%;
    margin-bottom: 20px;
  }
}

/* Mobile (< 768px) */
@media (max-width: 767px) {
  .agent-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .dashboard-container {
    padding: 10px;
  }
  .phase-timeline {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
```

### 7. Dynamic Agent Handling

```javascript
class AgentManager {
  constructor() {
    this.agents = new Map();
    this.defaultAgents = ['frontend', 'backend', 'database', 'devops', 'testing'];
    this.customAgentCount = 0;
  }

  addAgent(agentData) {
    const agent = {
      id: agentData.id,
      name: agentData.name,
      type: agentData.type || 'custom',
      icon: this.getAgentIcon(agentData),
      color: this.getAgentColor(agentData),
      status: 'idle',
      progress: 0,
      tasks: []
    };

    this.agents.set(agent.id, agent);
    this.renderAgent(agent);
    
    // Update UI counters
    this.updateAgentCount();
    
    // Trigger layout recalculation
    this.recalculateLayout();
  }

  getAgentIcon(agentData) {
    const iconMap = {
      'frontend': '🖥️',
      'backend': '🗄️',
      'database': '🗃️',
      'devops': '⚙️',
      'testing': '✓',
      'security': '🛡️',
      'ai-ml': '🧠',
      'mobile': '📱',
      'cloud': '☁️',
      'analytics': '📊'
    };

    // Check for known types
    if (iconMap[agentData.type]) {
      return iconMap[agentData.type];
    }

    // Generate custom icon
    return this.generateCustomIcon(agentData.name);
  }

  generateCustomIcon(name) {
    // Create SVG with first letter
    const letter = name.charAt(0).toUpperCase();
    return `
      <svg class="custom-agent-icon" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="18" fill="#7c3aed"/>
        <text x="20" y="26" text-anchor="middle" fill="white" font-size="20">
          ${letter}
        </text>
      </svg>
    `;
  }

  getAgentColor(agentData) {
    // Generate consistent color based on agent name
    const colors = [
      '#7c3aed', // Purple
      '#3b82f6', // Blue
      '#10b981', // Green
      '#f59e0b', // Orange
      '#ef4444', // Red
      '#8b5cf6', // Violet
      '#14b8a6', // Teal
      '#f97316', // Dark Orange
      '#ec4899', // Pink
      '#06b6d4'  // Cyan
    ];

    const index = agentData.name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  recalculateLayout() {
    const container = document.getElementById('agent-grid');
    const agentCount = this.agents.size;
    
    // Enable scrolling for many agents
    if (agentCount > 8) {
      container.classList.add('scroll-container');
      container.style.maxHeight = '600px';
      container.style.overflowY = 'auto';
    }

    // Adjust grid columns
    let columns;
    if (agentCount <= 4) columns = agentCount;
    else if (agentCount <= 8) columns = 4;
    else if (agentCount <= 12) columns = 4;
    else columns = 5;

    container.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
  }
}
```

### 8. Scroll Management

```javascript
class ScrollManager {
  constructor() {
    this.setupSmoothScroll();
    this.setupScrollIndicators();
    this.setupVirtualScrolling();
  }

  setupSmoothScroll() {
    // Custom smooth scrolling with easing
    document.querySelectorAll('.scrollable').forEach(element => {
      element.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY;
        const scrollSpeed = 0.8;
        
        element.scrollBy({
          top: delta * scrollSpeed,
          behavior: 'smooth'
        });
      });
    });
  }

  setupScrollIndicators() {
    // Show scroll indicators when content overflows
    const checkScroll = (element) => {
      const hasScroll = element.scrollHeight > element.clientHeight;
      
      if (hasScroll) {
        element.classList.add('has-scroll');
        
        // Add top/bottom shadows based on scroll position
        element.addEventListener('scroll', () => {
          const scrollTop = element.scrollTop;
          const scrollHeight = element.scrollHeight - element.clientHeight;
          
          element.classList.toggle('scrolled-top', scrollTop > 10);
          element.classList.toggle('scrolled-bottom', scrollTop < scrollHeight - 10);
        });
      }
    };

    document.querySelectorAll('.scrollable').forEach(checkScroll);
  }

  setupVirtualScrolling() {
    // Virtual scrolling for task feed
    const taskFeed = document.getElementById('task-feed');
    const virtualScroller = new VirtualScroller(taskFeed, {
      itemHeight: 40,
      buffer: 5,
      renderItem: (task) => this.renderTaskItem(task)
    });
  }
}
```

### 9. Performance Optimization

```javascript
// Use requestAnimationFrame for smooth updates
class UpdateQueue {
  constructor() {
    this.updates = [];
    this.isProcessing = false;
  }

  add(update) {
    this.updates.push(update);
    if (!this.isProcessing) {
      this.process();
    }
  }

  process() {
    this.isProcessing = true;
    
    requestAnimationFrame(() => {
      const batch = this.updates.splice(0, 10); // Process 10 updates per frame
      
      batch.forEach(update => update());
      
      if (this.updates.length > 0) {
        this.process();
      } else {
        this.isProcessing = false;
      }
    });
  }
}

// Debounce resize events
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    dashboard.recalculateLayout();
  }, 250);
});
```

### 10. Auto-Launch Configuration

```javascript
// Auto-launch dashboard when agents start
class DashboardLauncher {
  static launch(projectData) {
    const dashboardUrl = 'http://localhost:3001/dashboard';
    
    // Check if dashboard is already open
    fetch(`${dashboardUrl}/ping`)
      .then(response => {
        if (!response.ok) {
          this.openDashboard(dashboardUrl, projectData);
        } else {
          // Dashboard already open, just update project
          this.updateDashboard(projectData);
        }
      })
      .catch(() => {
        this.openDashboard(dashboardUrl, projectData);
      });
  }

  static openDashboard(url, projectData) {
    // Open in default browser
    const { exec } = require('child_process');
    const platform = process.platform;
    
    let command;
    if (platform === 'darwin') {
      command = `open "${url}?project=${projectData.id}"`;
    } else if (platform === 'win32') {
      command = `start "${url}?project=${projectData.id}"`;
    } else {
      command = `xdg-open "${url}?project=${projectData.id}"`;
    }
    
    exec(command);
  }
}
```

## Implementation Notes for Figma Make

### Required Libraries
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.5.0",
    "framer-motion": "^10.16.0",
    "recharts": "^2.5.0",
    "react-window": "^1.8.8",
    "tailwindcss": "^3.3.0"
  }
}
```

### Component Structure
```
src/
├── components/
│   ├── Dashboard.tsx
│   ├── Header.tsx
│   ├── OverallProgress.tsx
│   ├── AgentGrid.tsx
│   ├── AgentCard.tsx
│   ├── PhaseTimeline.tsx
│   ├── TaskFeed.tsx
│   ├── Metrics.tsx
│   └── TokenGraph.tsx
├── hooks/
│   ├── useWebSocket.ts
│   ├── useAnimations.ts
│   └── useVirtualScroll.ts
├── utils/
│   ├── scrollManager.ts
│   ├── updateQueue.ts
│   └── agentManager.ts
└── styles/
    ├── dashboard.css
    ├── animations.css
    └── responsive.css
```

This enhanced design ensures the dashboard can handle any number of agents dynamically, with smooth scrolling, responsive layouts, and real-time updates while maintaining excellent performance.