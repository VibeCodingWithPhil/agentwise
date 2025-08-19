import { ProgressTracker } from './ProgressTracker';
import * as path from 'path';

async function startMonitoring() {
  console.log('Starting Agentwise Monitoring System...\n');
  
  // Test with the dashboard-app project
  const projectPath = path.join(process.cwd(), 'workspace', 'dashboard-app');
  console.log(`Monitoring project: ${projectPath}\n`);
  
  // Create tracker - it starts monitoring automatically in constructor
  const tracker = new ProgressTracker(projectPath);
  
  // Display initial progress
  const allProgress = tracker.getAllProgress();
  console.log('Initial Progress:');
  console.log(JSON.stringify(allProgress, null, 2));
  
  // Set up periodic progress display
  setInterval(() => {
    const currentProgress = tracker.getAllProgress();
    
    if (currentProgress.length > 0) {
      console.log('\n--- Progress Update ---');
      
      currentProgress.forEach(project => {
        console.log(`\nProject: ${project.projectName}`);
        console.log(`Overall Progress: ${project.overallProgress.toFixed(1)}%`);
        console.log(`Tasks: ${project.metrics.completedTasks}/${project.metrics.totalTasks} completed`);
        
        if (project.metrics.failedTasks > 0) {
          console.log(`Failed Tasks: ${project.metrics.failedTasks}`);
        }
        
        // Show phase progress
        if (project.phases && project.phases.length > 0) {
          console.log('\nPhase Progress:');
          project.phases.forEach(phase => {
            const phaseProgress = phase.totalTasks > 0 
              ? (phase.completedTasks / phase.totalTasks * 100) 
              : 0;
            console.log(`  ${phase.name}: ${phaseProgress.toFixed(1)}% (${phase.status})`);
          });
        }
        
        // Show active tasks
        if (project.activeTasks && project.activeTasks.length > 0) {
          console.log('\nActive Tasks:');
          project.activeTasks.slice(0, 3).forEach(task => {
            console.log(`  - ${task.task} (${task.agentId}): ${task.status}`);
          });
        }
      });
    }
  }, 5000);
  
  console.log('\nMonitoring system is running. Watching for MD file changes...');
  console.log('Try checking/unchecking task checkboxes in the MD files to see updates.');
  console.log('Press Ctrl+C to stop.\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down monitoring system...');
  process.exit(0);
});

// Start the monitoring
startMonitoring().catch(console.error);