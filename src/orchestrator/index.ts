import * as path from 'path';
import * as fs from 'fs-extra';
import { AgentManager } from './AgentManager';
import { PhaseController } from './PhaseController';
import { SpecGenerator } from './SpecGenerator';
import { TaskDistributor } from './TaskDistributor';

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

  try {
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
  } catch (error) {
    console.error('❌ Orchestration failed:', error);
    process.exit(1);
  }
}

async function handleCreate(_projectId: string, projectIdea: string) {
  console.log('📝 Generating project specifications...');
  
  const projectPath = process.cwd();
  const specsPath = path.join(projectPath, 'specs');
  
  // Initialize components
  const specGenerator = new SpecGenerator();
  const agentManager = new AgentManager();
  const phaseController = new PhaseController();
  const taskDistributor = new TaskDistributor();
  
  // Generate enhanced specs
  const specs = await specGenerator.generate(projectIdea, 'create');
  
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
  
  // Distribute tasks to agents
  const agentTasks = await taskDistributor.distribute(specs, phases);
  
  // Create agent todo folders
  for (const agent of agentManager.getAgents()) {
    const agentPath = path.join(projectPath, 'agent-todo', agent.name);
    await fs.ensureDir(agentPath);
    
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
  
  // Launch agents
  await agentManager.launchAgents(projectPath);
  
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