const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;
const chokidar = require('chokidar');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Agentwise project tracking
let activeProject = null;
let agents = new Map();
let tasks = [];
let phases = [];
let systemHealth = {
  cpu: 0,
  memory: 0,
  disk: 0,
  network: 0
};

// Watch for Agentwise workspace changes
const workspacePath = path.join(__dirname, '../../../workspace');
const agentTodoPath = path.join(workspacePath);

// Initialize file watcher
let watcher = null;

// Parse MD files for task status
async function parseTaskFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    let totalTasks = 0;
    let completedTasks = 0;
    const taskList = [];

    for (const line of lines) {
      const checkboxMatch = line.match(/^(\s*)[-*]\s*\[([ xX])\]\s*(.+)/);
      if (checkboxMatch) {
        totalTasks++;
        const isCompleted = checkboxMatch[2].toLowerCase() === 'x';
        if (isCompleted) completedTasks++;
        
        taskList.push({
          description: checkboxMatch[3].trim(),
          completed: isCompleted
        });
      }
    }

    return {
      totalTasks,
      completedTasks,
      progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      tasks: taskList
    };
  } catch (error) {
    console.error('Error parsing task file:', error);
    return { totalTasks: 0, completedTasks: 0, progress: 0, tasks: [] };
  }
}

// Update agent status from file system
async function updateAgentStatus(projectPath) {
  const agentTodoDir = path.join(projectPath, 'agent-todos');
  
  try {
    const agentDirs = await fs.readdir(agentTodoDir);
    
    for (const agentName of agentDirs) {
      const agentDir = path.join(agentTodoDir, agentName);
      const stats = await fs.stat(agentDir);
      
      if (stats.isDirectory()) {
        // Find all phase files
        const files = await fs.readdir(agentDir);
        const phaseFiles = files.filter(f => f.match(/^phase\d+-todo\.md$/));
        
        let totalTasks = 0;
        let completedTasks = 0;
        let currentPhase = 1;
        let currentTask = '';
        
        // Parse each phase file
        for (const phaseFile of phaseFiles.sort()) {
          const phaseNumber = parseInt(phaseFile.match(/phase(\d+)/)[1], 10);
          const filePath = path.join(agentDir, phaseFile);
          const phaseData = await parseTaskFile(filePath);
          
          totalTasks += phaseData.totalTasks;
          completedTasks += phaseData.completedTasks;
          
          // Find current task
          if (phaseData.progress < 100 && currentPhase === 1) {
            currentPhase = phaseNumber;
            const inProgressTask = phaseData.tasks.find(t => !t.completed);
            if (inProgressTask) {
              currentTask = inProgressTask.description;
            }
          }
        }
        
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Update or create agent
        const agent = {
          id: agentName,
          name: agentName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          type: agentName.split('-')[0],
          icon: getAgentIcon(agentName),
          color: getAgentColor(agentName),
          status: progress === 100 ? 'completed' : progress > 0 ? 'working' : 'idle',
          progress,
          currentTask: currentTask || 'Waiting for tasks...',
          completedTasks,
          totalTasks,
          duration: '0h 0m',
          tokens: Math.round(Math.random() * 10000)
        };
        
        agents.set(agentName, agent);
      }
    }
    
    return Array.from(agents.values());
  } catch (error) {
    console.error('Error updating agent status:', error);
    return [];
  }
}

// Get agent icon based on type
function getAgentIcon(agentName) {
  const icons = {
    'frontend': '🎨',
    'backend': '⚙️',
    'database': '🗄️',
    'devops': '🚀',
    'testing': '🧪',
    'security': '🔒',
    'mobile': '📱',
    'ai': '🤖'
  };
  
  const type = agentName.split('-')[0];
  return icons[type] || '🤖';
}

// Get agent color based on type
function getAgentColor(agentName) {
  const colors = {
    'frontend': 'blue',
    'backend': 'green',
    'database': 'purple',
    'devops': 'orange',
    'testing': 'red',
    'security': 'yellow',
    'mobile': 'cyan',
    'ai': 'pink'
  };
  
  const type = agentName.split('-')[0];
  return colors[type] || 'gray';
}

// Watch for project changes
async function watchProject(projectPath) {
  if (watcher) {
    watcher.close();
  }
  
  const agentTodoDir = path.join(projectPath, 'agent-todos');
  
  watcher = chokidar.watch(agentTodoDir, {
    persistent: true,
    ignoreInitial: true,
    depth: 3
  });
  
  watcher.on('change', async (filePath) => {
    if (filePath.endsWith('.md')) {
      console.log(`File changed: ${filePath}`);
      const agentData = await updateAgentStatus(projectPath);
      broadcast({
        type: 'agents_update',
        data: agentData
      });
      
      // Update task feed
      const fileName = path.basename(filePath);
      const agentName = path.basename(path.dirname(filePath));
      
      const newTask = {
        id: `task-${Date.now()}`,
        agentId: agentName,
        agentName: agentName.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        description: `Updated ${fileName}`,
        status: 'in-progress',
        timestamp: new Date().toISOString()
      };
      
      tasks.unshift(newTask);
      if (tasks.length > 50) tasks = tasks.slice(0, 50);
      
      broadcast({
        type: 'task_update',
        data: newTask
      });
    }
  });
  
  console.log(`Watching project: ${projectPath}`);
}

// Find active project
async function findActiveProject() {
  try {
    const contextFile = path.join(__dirname, '../../../.agentwise-context.json');
    if (await fs.access(contextFile).then(() => true).catch(() => false)) {
      const context = JSON.parse(await fs.readFile(contextFile, 'utf-8'));
      if (context.projectPath) {
        return {
          name: context.projectName,
          path: context.projectPath
        };
      }
    }
    
    // Fallback: find most recent project in workspace
    const projects = await fs.readdir(workspacePath);
    for (const project of projects) {
      const projectPath = path.join(workspacePath, project);
      const stats = await fs.stat(projectPath);
      if (stats.isDirectory()) {
        const agentTodoDir = path.join(projectPath, 'agent-todos');
        if (await fs.access(agentTodoDir).then(() => true).catch(() => false)) {
          return {
            name: project,
            path: projectPath
          };
        }
      }
    }
  } catch (error) {
    console.error('Error finding active project:', error);
  }
  
  return null;
}

// Update system health metrics
function updateSystemHealth() {
  // Simulate system metrics (in production, use actual system monitoring)
  systemHealth = {
    cpu: Math.round(20 + Math.random() * 30),
    memory: Math.round(40 + Math.random() * 20),
    disk: Math.round(30 + Math.random() * 10),
    network: Math.round(1 + Math.random() * 5)
  };
}

// Broadcast to all connected clients
function broadcast(message) {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}

// WebSocket connection handler
wss.on('connection', async (ws) => {
  console.log('New client connected');
  
  // Send initial data
  if (activeProject) {
    const agentData = await updateAgentStatus(activeProject.path);
    
    ws.send(JSON.stringify({
      type: 'initial_data',
      data: {
        project: activeProject,
        agents: agentData,
        tasks: tasks,
        phases: phases,
        systemHealth: systemHealth
      }
    }));
  } else {
    ws.send(JSON.stringify({
      type: 'no_project',
      message: 'No active Agentwise project found'
    }));
  }
  
  // Handle client messages
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'refresh':
          if (activeProject) {
            const agentData = await updateAgentStatus(activeProject.path);
            ws.send(JSON.stringify({
              type: 'agents_update',
              data: agentData
            }));
          }
          break;
          
        case 'pause_agent':
          // Handle pause command
          console.log(`Pausing agent: ${data.agentId}`);
          // In production, send actual pause command to agent
          break;
          
        case 'resume_agent':
          // Handle resume command
          console.log(`Resuming agent: ${data.agentId}`);
          break;
          
        case 'add_task':
          // Handle task addition
          console.log(`Adding task for agent ${data.agentId}: ${data.task}`);
          break;
          
        case 'emergency_shutdown':
          // Handle emergency shutdown
          console.log('Emergency shutdown initiated');
          broadcast({
            type: 'shutdown',
            message: 'Emergency shutdown initiated'
          });
          break;
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Initialize server
async function initialize() {
  // Find active project
  activeProject = await findActiveProject();
  
  if (activeProject) {
    console.log(`Active project: ${activeProject.name}`);
    await updateAgentStatus(activeProject.path);
    await watchProject(activeProject.path);
  } else {
    console.log('No active project found. Waiting for project activation...');
  }
  
  // Update system health periodically
  setInterval(() => {
    updateSystemHealth();
    broadcast({
      type: 'system_health',
      data: systemHealth
    });
  }, 5000);
  
  // Check for new projects periodically
  setInterval(async () => {
    const newProject = await findActiveProject();
    if (newProject && (!activeProject || newProject.path !== activeProject.path)) {
      activeProject = newProject;
      console.log(`Switched to project: ${activeProject.name}`);
      await updateAgentStatus(activeProject.path);
      await watchProject(activeProject.path);
      
      broadcast({
        type: 'project_changed',
        data: {
          project: activeProject,
          agents: Array.from(agents.values())
        }
      });
    }
  }, 10000);
}

// Start server
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  initialize();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  if (watcher) watcher.close();
  wss.close();
  server.close();
  process.exit(0);
});