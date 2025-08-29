import * as path from 'path';
import * as fs from 'fs-extra';
import { DynamicAgentManager } from './DynamicAgentManager';
import { PhaseController } from './PhaseController';
import { EnhancedPhaseManager } from './EnhancedPhaseManager';
import { SpecGenerator } from './SpecGenerator';
import { DynamicTaskDistributor } from './DynamicTaskDistributor';
import { DynamicAgentGenerator } from '../agents/DynamicAgentGenerator';
import { MCPIntegrationManager } from '../mcp/MCPIntegrationManager';
import { SmartModelRouter } from '../models/SmartModelRouter';
import { ModelCommands } from '../commands/ModelCommands';
import { UsageAnalytics } from '../analytics/UsageAnalytics';
import { ProjectRegistrySync } from '../project-registry/ProjectRegistrySync';
import { ProjectIntegrationManager } from '../integration/ProjectIntegrationManager';
import { ProgressTracker } from '../monitoring/ProgressTracker';
import { WebSocketIntegration } from '../monitoring/WebSocketIntegration';

/**
 * Main orchestrator entry point
 */
async function main() {
  const [, , command, projectId, ...args] = process.argv;
  const projectIdea = args.join(' ');

  console.log('🎭 Agentwise Orchestrator Starting...');
  console.log(`Command: ${command}`);
  console.log(`Project: ${projectId}`);
  console.log(`Idea: ${projectIdea}`);

  // Initialize analytics (privacy-respecting)
  const analytics = new UsageAnalytics();
  const startTime = Date.now();

  // Initialize monitoring
  const progressTracker = new ProgressTracker();
  const wsIntegration = new WebSocketIntegration(progressTracker);
  
  // Connect to monitor dashboard if available
  try {
    await wsIntegration.connect();
    console.log('📊 Monitor integration initialized');
  } catch (error) {
    console.log('📊 Monitor dashboard not available (this is optional)');
  }

  try {
    // Handle model-related commands
    if (command === 'setup-ollama' || command === 'setup-lmstudio' || 
        command === 'local-models' || command === 'configure-routing') {
      const modelCommands = new ModelCommands();
      
      switch (command) {
        case 'setup-ollama':
          await modelCommands.handleSetupOllama();
          break;
        case 'setup-lmstudio':
          await modelCommands.handleSetupLMStudio();
          break;
        case 'local-models':
          await modelCommands.handleLocalModels();
          break;
        case 'configure-routing':
          await modelCommands.handleConfigureRouting(args);
          break;
      }
      return;
    }
    
    switch (command) {
      case 'create':
        await handleCreate(projectId, projectIdea);
        break;
      case 'task':
        await handleTask(projectId, projectIdea);
        break;
      case 'create-plan':
        await handleCreatePlan(projectId, projectIdea);
        break;
      case 'task-plan':
        await handleTaskPlan(projectId, projectIdea);
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
    
    // Track successful command execution
    const duration = Date.now() - startTime;
    await analytics.trackCommand(command, true, duration);
    
  } catch (error) {
    console.error('❌ Orchestration failed:', error);
    
    // Track failed command execution
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    await analytics.trackCommand(command, false, duration, errorMessage);
    
    process.exit(1);
  }
}

async function handleCreate(projectId: string, projectIdea: string) {
  console.log('📝 Generating project specifications...');
  
  // Extract project name and create proper workspace structure
  const projectName = projectId || extractProjectName(projectIdea);
  const workspacePath = path.join(process.cwd(), 'workspace');
  const projectPath = path.join(workspacePath, projectName);
  
  // Initialize project with full integration
  const integrationManager = new ProjectIntegrationManager();
  await integrationManager.initializeProject(projectPath, {
    validateStructure: true,
    initializeContext: true,
    syncRegistry: true,
    createAgentsMd: true,
    startWatching: true
  });
  
  // Create temporary analysis folder for initial tech stack validation
  const analysisPath = path.join(projectPath, '.analysis');
  console.log('🔬 Creating analysis workspace for tech validation...');
  await fs.ensureDir(analysisPath);
  
  const specsPath = path.join(projectPath, 'specs');
  
  // Initialize components
  const specGenerator = new SpecGenerator();
  const agentManager = new DynamicAgentManager();
  const phaseController = new PhaseController();
  const taskDistributor = new DynamicTaskDistributor();
  const agentGenerator = new DynamicAgentGenerator();
  const mcpManager = new MCPIntegrationManager();
  const modelRouter = new SmartModelRouter();
  
  try {
    // Save initial analysis context
    await fs.writeFile(
      path.join(analysisPath, 'analysis-context.md'),
      `# Analysis Session for ${projectName}\n\n## Original Idea\n${projectIdea}\n\n## Analysis Status\nStatus: In Progress\nStarted: ${new Date().toISOString()}\n`
    );
    
    // Generate enhanced specs with validation
    console.log('🔍 Analyzing tech stack compatibility...');
    const specs = await specGenerator.generate(projectIdea, 'create');
    
    // Save tech analysis results
    await fs.writeFile(
      path.join(analysisPath, 'tech-validation.json'),
      JSON.stringify({
        projectName,
        techStack: specs.validationReport || 'Tech stack validated',
        isValid: specs.isValid !== false,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
  
  // Check if new agents need to be generated based on project needs
  console.log('🔍 Analyzing if new specialist agents are needed...');
  const generationResults = await agentGenerator.generateRequiredAgents(specs);
  
  if (generationResults.length > 0) {
    console.log(`✨ Generated ${generationResults.filter(r => r.success).length} new specialist agents`);
    // Refresh agent manager to include new agents
    await agentManager.scanForAgents();
  }
  
  // Save specs
  await fs.writeFile(
    path.join(specsPath, 'main-spec.md'),
    specs.mainSpec
  );
  await fs.writeFile(
    path.join(specsPath, 'project-spec.md'),
    specs.projectSpec
  );
  await fs.writeFile(
    path.join(specsPath, 'todo-spec.md'),
    specs.todoSpec
  );
  
  console.log('✅ Specifications generated');
  
  // Analyze complexity and determine phases
  const phases = phaseController.analyzeComplexity(specs);
  console.log(`📊 Project complexity: ${phases.length} phases`);
  
  // Distribute tasks to agents (this will create agent-todos folders for required agents only)
  const agentTasks = await taskDistributor.distribute(specs, phases, projectPath);
  
  // Get only the agents that have tasks
  const agentsWithTasks = Object.keys(agentTasks);
  const availableAgents = await agentManager.getAgents();
  const selectedAgents = availableAgents.filter(a => agentsWithTasks.includes(a.name));
  
  // Setup MCP integrations for selected agents
  console.log('🔌 Setting up MCP integrations for agents...');
  await mcpManager.optimizeMCPsForProject(specs, agentsWithTasks);
  
  for (const agentName of agentsWithTasks) {
    await mcpManager.setupAgentMCPs(agentName);
  }
  
  // Setup smart model routing
  console.log('🧠 Configuring smart model routing...');
  await modelRouter.discoverModels();
  const availableModels = modelRouter.getAvailableModels();
  const localModelsCount = (availableModels.get('ollama')?.length || 0) + 
                           (availableModels.get('lmstudio')?.length || 0);
  
  if (localModelsCount > 0) {
    console.log(`  ✅ Found ${localModelsCount} local models for cost optimization`);
  }
  
  // Create phase files for agents with tasks (with MCP task integration)
  for (const agent of selectedAgents) {
    const agentPath = path.join(projectPath, 'agent-todos', agent.name);
    await fs.ensureDir(agentPath);
    
    // Create phase files
    for (let i = 0; i < phases.length; i++) {
      const phaseTasks = agentTasks[agent.name]?.[i] || [];
      const phaseFile = path.join(agentPath, `phase${i + 1}-todo.md`);
      
      // Enhance tasks with MCP capabilities
      const enhancedTasks = await enhanceTasksWithMCP(phaseTasks, agent.name, mcpManager);
      await fs.writeFile(phaseFile, formatPhaseTasksWithMCP(enhancedTasks, agent.name, i + 1));
    }
    
    // Create phase status file
    const statusFile = path.join(agentPath, 'phase-status.json');
    await fs.writeJson(statusFile, {
      current_phase: 1,
      total_phases: phases.length,
      completed_phases: [],
      status: 'ready',
      tasks_completed: 0,
      tasks_total: agentTasks[agent.name]?.[0]?.length || 0
    }, { spaces: 2 });
  }
  
  console.log('🚀 Launching agent terminals...');
  
  // Launch only selected agents
  await agentManager.launchAgentsOptimized(projectPath, agentsWithTasks);
  
  // Start enhanced phase monitoring for task completion tracking
  console.log('🔍 Starting enhanced phase monitoring...');
  const enhancedPhaseManager = new EnhancedPhaseManager(projectPath);
  await enhancedPhaseManager.startPhaseMonitoring();
  
    // Clean up analysis folder and other temporary folders after successful setup
    console.log('🧹 Cleaning up analysis workspace...');
    await fs.remove(analysisPath);
    await integrationManager.cleanTemporaryFolders(projectName);
    
    // Update project registry in workspace
    const workspaceRegistryPath = path.join(process.cwd(), 'workspace', '.registry');
    await fs.ensureDir(workspaceRegistryPath);
    const projectRegistry = path.join(workspaceRegistryPath, 'projects.json');
    let registry: Record<string, any> = {};
    if (await fs.pathExists(projectRegistry)) {
      registry = await fs.readJson(projectRegistry);
    }
    
    registry[projectName] = {
      name: projectName,
      path: projectPath,
      created: new Date().toISOString(),
      status: 'active',
      agents: agentsWithTasks,
      phases: phases.length,
      description: projectIdea,
      mcpIntegrations: await mcpManager.getProjectMCPs(projectName)
    };
    
    await fs.writeJson(projectRegistry, registry, { spaces: 2 });
    
    console.log('✅ Orchestration complete! Agents are now working on your project.');
    console.log(`📂 Project location: ${projectPath}`);
    console.log(`👥 ${agentsWithTasks.length} agents are actively working`);
    
  } catch (error) {
    console.error('❌ Project creation failed:', error);
    
    // Clean up analysis folder on error
    if (await fs.pathExists(analysisPath)) {
      console.log('🧹 Cleaning up failed analysis session...');
      await fs.remove(analysisPath);
    }
    
    throw error;
  }
}

async function handleTask(_projectId: string, _feature: string) {
  console.log('📝 Adding feature to existing project...');
  
  // Sync registry before project operations
  const registrySync = new ProjectRegistrySync();
  console.log('🔄 Syncing project registry...');
  await registrySync.syncRegistry();
  
  // Implementation for task command
}

async function handleCreatePlan(projectId: string, projectIdea: string) {
  console.log('🤝 Starting collaborative planning session...');
  
  // Extract project name from idea or use projectId
  const projectName = projectId || extractProjectName(projectIdea);
  const workspacePath = path.join(process.cwd(), 'workspace');
  const projectPath = path.join(workspacePath, projectName);
  
  // Initialize project with full integration
  const integrationManager = new ProjectIntegrationManager();
  await integrationManager.initializeProject(projectPath, {
    validateStructure: true,
    initializeContext: true,
    syncRegistry: true,
    createAgentsMd: true,
    startWatching: true
  });
  
  // Create temporary planning folder
  const planningPath = path.join(projectPath, '.planning');
  console.log('📝 Creating planning workspace...');
  await fs.ensureDir(planningPath);
  
  // Save planning context
  await fs.writeFile(
    path.join(planningPath, 'planning-context.md'),
    `# Planning Session for ${projectName}\n\n## Original Idea\n${projectIdea}\n\n## Planning Status\nStatus: In Progress\nStarted: ${new Date().toISOString()}\n`
  );
  
  // Initialize components
  const specGenerator = new SpecGenerator();
  const agentManager = new DynamicAgentManager();
  const agentGenerator = new DynamicAgentGenerator();
  const taskDistributor = new DynamicTaskDistributor();
  const phaseController = new PhaseController();
  const mcpManager = new MCPIntegrationManager();
  
  try {
    // Planning phase - generate initial specifications
    console.log('🔍 Analyzing project requirements...');
    const specs = await specGenerator.generate(projectIdea, 'plan');
    
    // Save initial specs to planning folder
    await fs.writeFile(
      path.join(planningPath, 'initial-spec.md'),
      specs.mainSpec
    );
    
    // Collaborative planning process
    console.log('💭 Engaging collaborative planning agents...');
    
    // Check if specialized agents need to be generated
    console.log('🔍 Determining required specialist agents...');
    const generationResults = await agentGenerator.generateRequiredAgents(specs);
    
    if (generationResults.length > 0) {
      console.log(`✨ Generated ${generationResults.filter(r => r.success).length} new specialist agents for planning`);
      await agentManager.scanForAgents();
    }
    
    // Analyze complexity and determine phases
    const phases = phaseController.analyzeComplexity(specs);
    console.log(`📊 Planned project complexity: ${phases.length} phases`);
    
    // Determine which agents will be needed
    const plannedAgentTasks = await taskDistributor.distribute(specs, phases, projectPath);
    const agentsNeeded = Object.keys(plannedAgentTasks);
    
    console.log(`👥 Agents identified for project: ${agentsNeeded.join(', ')}`);
    
    // Save planning results
    await fs.writeFile(
      path.join(planningPath, 'planning-results.json'),
      JSON.stringify({
        projectName,
        projectIdea,
        agentsNeeded,
        phases: phases.length,
        timestamp: new Date().toISOString(),
        specs: {
          main: specs.mainSpec,
          project: specs.projectSpec,
          todo: specs.todoSpec
        }
      }, null, 2)
    );
    
    // Finalize planning - save actual specs
    console.log('💾 Finalizing project specifications...');
    const specsPath = path.join(projectPath, 'specs');
    
    await fs.writeFile(
      path.join(specsPath, 'main-spec.md'),
      specs.mainSpec
    );
    await fs.writeFile(
      path.join(specsPath, 'project-spec.md'),
      specs.projectSpec
    );
    await fs.writeFile(
      path.join(specsPath, 'todo-spec.md'),
      specs.todoSpec
    );
    
    console.log('✅ Planning phase completed');
    
    // Create agent-todos folders for identified agents
    console.log('📁 Creating agent-todos folders...');
    for (const agentName of agentsNeeded) {
      const agentTodoPath = path.join(projectPath, 'agent-todos', agentName);
      await fs.ensureDir(agentTodoPath);
      
      // Create phase files for each agent
      for (let i = 0; i < phases.length; i++) {
        const phaseTasks = plannedAgentTasks[agentName]?.[i] || [];
        const phaseFile = path.join(agentTodoPath, `phase${i + 1}-todo.md`);
        
        await fs.writeFile(phaseFile, formatPhaseTasks(phaseTasks, agentName, i + 1));
      }
      
      // Create phase status file
      const statusFile = path.join(agentTodoPath, 'phase-status.json');
      await fs.writeJson(statusFile, {
        current_phase: 1,
        total_phases: phases.length,
        completed_phases: [],
        status: 'ready',
        tasks_completed: 0,
        tasks_total: plannedAgentTasks[agentName]?.[0]?.length || 0
      }, { spaces: 2 });
    }
    
    // Setup MCP integrations for planned agents
    console.log('🔌 Configuring MCP integrations...');
    await mcpManager.optimizeMCPsForProject(specs, agentsNeeded);
    
    for (const agentName of agentsNeeded) {
      await mcpManager.setupAgentMCPs(agentName);
    }
    
    // Clean up planning folder and other temporary folders
    console.log('🧹 Cleaning up planning workspace...');
    await fs.remove(planningPath);
    await integrationManager.cleanTemporaryFolders(projectName);
    
    // Update project registry in workspace
    const workspaceRegistryPath = path.join(process.cwd(), 'workspace', '.registry');
    await fs.ensureDir(workspaceRegistryPath);
    const projectRegistry = path.join(workspaceRegistryPath, 'projects.json');
    let registry: Record<string, any> = {};
    if (await fs.pathExists(projectRegistry)) {
      registry = await fs.readJson(projectRegistry);
    }
    
    registry[projectName] = {
      name: projectName,
      path: projectPath,
      created: new Date().toISOString(),
      status: 'planned',
      agents: agentsNeeded,
      phases: phases.length,
      description: projectIdea
    };
    
    await fs.writeJson(projectRegistry, registry, { spaces: 2 });
    
    // Launch agents with the planned structure
    console.log('🚀 Launching agents with planned tasks...');
    const availableAgents = await agentManager.getAgents();
    const selectedAgents = availableAgents.filter(a => agentsNeeded.includes(a.name));
    
    await agentManager.launchAgentsOptimized(projectPath, agentsNeeded);
    
    // Start enhanced phase monitoring
    console.log('🔍 Starting phase monitoring...');
    const enhancedPhaseManager = new EnhancedPhaseManager(projectPath);
    await enhancedPhaseManager.startPhaseMonitoring();
    
    console.log('✅ Project successfully planned and initiated!');
    console.log(`📂 Project location: ${projectPath}`);
    console.log(`👥 ${agentsNeeded.length} agents are now working on your project`);
    
  } catch (error) {
    console.error('❌ Planning failed:', error);
    
    // Clean up planning folder on error
    if (await fs.pathExists(planningPath)) {
      console.log('🧹 Cleaning up failed planning session...');
      await fs.remove(planningPath);
    }
    
    throw error;
  }
}

async function handleTaskPlan(_projectId: string, _feature: string) {
  console.log('🤝 Starting collaborative feature planning...');
  // Implementation for task-plan command
}

function formatPhaseTasks(tasks: any[], agentName: string, phaseNum: number): string {
  return `# Phase ${phaseNum} Tasks for ${agentName}

## Agent Prompt
You are ${agentName}. Complete the following tasks for phase ${phaseNum} of the project.

## Tasks
${tasks.map((task, i) => `${i + 1}. ${task.description}`).join('\n')}

## Instructions
1. Read the project specifications in the specs folder
2. Complete each task in order
3. Update phase-status.json when complete
4. Wait for next phase synchronization

## Status
Mark each task as complete by updating this file and phase-status.json.
`;
}

function extractProjectName(projectIdea: string): string {
  // Try to extract project name from the idea
  const nameMatch = projectIdea.match(/(?:called|named|project)\s+["']?(\w+)["']?/i);
  if (nameMatch) {
    return nameMatch[1].toLowerCase();
  }
  
  // Generate from first few words
  const words = projectIdea.split(' ')
    .filter(word => !['a', 'an', 'the', 'create', 'build', 'make'].includes(word.toLowerCase()))
    .slice(0, 3);
  
  return words.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
}

async function enhanceTasksWithMCP(
  tasks: any[], 
  agentName: string, 
  mcpManager: MCPIntegrationManager
): Promise<any[]> {
  // Get available MCPs for this agent
  const agentMCPs = await mcpManager.getAgentMCPs(agentName);
  
  return tasks.map(task => {
    // Analyze task to determine which MCPs might be useful
    const relevantMCPs = analyzeMCPRelevance(task.description, agentMCPs);
    
    if (relevantMCPs.length > 0) {
      return {
        ...task,
        mcpTools: relevantMCPs,
        enhancedDescription: `${task.description}\n  📌 Available MCP tools: ${relevantMCPs.join(', ')}`
      };
    }
    
    return task;
  });
}

function analyzeMCPRelevance(taskDescription: string, availableMCPs: string[]): string[] {
  const relevantMCPs: string[] = [];
  const taskLower = taskDescription.toLowerCase();
  
  // Map keywords to MCP tools
  const mcpKeywords: Record<string, string[]> = {
    'figma': ['design', 'ui', 'component', 'mockup', 'prototype'],
    'github': ['repository', 'commit', 'push', 'pull request', 'issue'],
    'database': ['schema', 'query', 'table', 'migration', 'data'],
    'docker': ['container', 'deploy', 'image', 'compose'],
    'stripe': ['payment', 'billing', 'subscription', 'checkout'],
    'firecrawl': ['clone', 'scrape', 'website', 'extract'],
    'jest': ['test', 'unit test', 'testing', 'coverage'],
    'playwright': ['e2e', 'end-to-end', 'browser test', 'automation']
  };
  
  for (const [mcp, keywords] of Object.entries(mcpKeywords)) {
    if (availableMCPs.includes(mcp)) {
      if (keywords.some(keyword => taskLower.includes(keyword))) {
        relevantMCPs.push(mcp);
      }
    }
  }
  
  return relevantMCPs;
}

function formatPhaseTasksWithMCP(tasks: any[], agentName: string, phaseNum: number): string {
  // Generate tasks with validation checks
  const tasksWithValidation: string[] = [];
  
  tasks.forEach((task, i) => {
    const taskNum = i + 1;
    const mcpNote = task.mcpTools?.length > 0 
      ? `\n   🔧 Use MCP: ${task.mcpTools.join(', ')}` 
      : '';
    
    // Add the main task with checkbox
    tasksWithValidation.push(
      `${taskNum}. [ ] ${task.enhancedDescription || task.description}${mcpNote}`
    );
    
    // Add validation reminder after each task
    tasksWithValidation.push(
      `   📌 After completing: Mark task ${taskNum} as [x] in this file`
    );
    tasksWithValidation.push(
      `   🔍 Validation: Confirm task ${taskNum} outputs are correct and complete\n`
    );
  });
  
  return `# Phase ${phaseNum} Tasks for ${agentName}

## Agent Prompt
You are ${agentName}. Complete the following tasks for phase ${phaseNum} of the project.
IMPORTANT: You MUST mark each task as complete [x] in this file after finishing it.

## Available MCP Tools
${[...new Set(tasks.flatMap(t => t.mcpTools || []))].join(', ') || 'Standard tools only'}

## Tasks
${tasksWithValidation.join('\n')}

## Task Completion Requirements
1. Complete the task as described
2. **Mark the task checkbox as [x] when done**
3. Verify outputs/results are correct
4. Update phase-status.json with completion status
5. Only proceed to next task after marking current as complete

## Instructions
1. Read the project specifications in the specs folder
2. Use available MCP tools when relevant to tasks
3. Complete each task in order
4. **CRITICAL**: Update this MD file marking tasks as [x] when completed
5. Update phase-status.json when all tasks complete
6. Wait for next phase synchronization

## MCP Usage Guidelines
- When a task mentions design work, use Figma MCP if available
- For database operations, use the appropriate database MCP
- For testing tasks, utilize Jest/Playwright MCPs
- For deployment, leverage Docker/Kubernetes MCPs

## Validation Process
Each task MUST be:
1. ✅ Completed according to specifications
2. ✅ Marked as [x] in this file
3. ✅ Validated for correctness
4. ✅ Reflected in phase-status.json

## Status Tracking
- [ ] = Task pending
- [x] = Task completed and validated
- Update immediately after task completion
`;
}

// Run orchestrator
if (require.main === module) {
  main().catch(console.error);
}