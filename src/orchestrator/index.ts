import * as path from 'path';
import * as fs from 'fs-extra';
import { DynamicAgentManager } from './DynamicAgentManager';
import { PhaseController } from './PhaseController';
import { SpecGenerator } from './SpecGenerator';
import { DynamicTaskDistributor } from './DynamicTaskDistributor';
import { DynamicAgentGenerator } from '../agents/DynamicAgentGenerator';
import { MCPIntegrationManager } from '../mcp/MCPIntegrationManager';
import { SmartModelRouter } from '../models/SmartModelRouter';
import { ModelCommands } from '../commands/ModelCommands';
import { UsageAnalytics } from '../analytics/UsageAnalytics';

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
    await analytics.trackCommand(command, false, duration, error.message);
    
    process.exit(1);
  }
}

async function handleCreate(_projectId: string, projectIdea: string) {
  console.log('📝 Generating project specifications...');
  
  const projectPath = process.cwd();
  const specsPath = path.join(projectPath, 'specs');
  
  // Initialize components
  const specGenerator = new SpecGenerator();
  const agentManager = new DynamicAgentManager();
  const phaseController = new PhaseController();
  const taskDistributor = new DynamicTaskDistributor();
  const agentGenerator = new DynamicAgentGenerator();
  const mcpManager = new MCPIntegrationManager();
  const modelRouter = new SmartModelRouter();
  
  // Generate enhanced specs with validation
  const specs = await specGenerator.generate(projectIdea, 'create');
  
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
  
  // Distribute tasks to agents (this will create agent-todo folders for required agents only)
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
  
  // Create phase files for agents with tasks
  for (const agent of selectedAgents) {
    const agentPath = path.join(projectPath, 'agent-todo', agent.name);
    
    // Create phase files
    for (let i = 0; i < phases.length; i++) {
      const phaseTasks = agentTasks[agent.name]?.[i] || [];
      const phaseFile = path.join(agentPath, `phase${i + 1}-todo.md`);
      
      await fs.writeFile(phaseFile, formatPhaseTasks(phaseTasks, agent.name, i + 1));
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
  
  console.log('✅ Orchestration complete! Agents are now working on your project.');
}

async function handleTask(_projectId: string, _feature: string) {
  console.log('📝 Adding feature to existing project...');
  // Implementation for task command
}

async function handleCreatePlan(_projectId: string, _projectIdea: string) {
  console.log('🤝 Starting collaborative planning session...');
  // Implementation for create-plan command
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

// Run orchestrator
if (require.main === module) {
  main().catch(console.error);
}