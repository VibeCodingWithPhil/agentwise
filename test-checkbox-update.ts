import { MDTaskUpdater } from './src/monitoring/MDTaskUpdater';
import * as path from 'path';

async function testCheckboxUpdate() {
  const updater = new MDTaskUpdater();
  
  // Test updating a checkbox in the dashboard-app project
  const filePath = path.join(process.cwd(), 'workspace', 'dashboard-app', 'phase-1-implementation.md');
  
  console.log('Testing checkbox update...');
  console.log('File:', filePath);
  
  // Mark the first task as completed
  const tasks = [{
    filePath: filePath,
    taskId: 'task-1',
    description: 'Next.js app running with TypeScript',
    completed: true,
    agentId: 'frontend-specialist'
  }];
  
  const results = await updater.updateTasks(tasks);
  
  if (results.length > 0 && results[0].success) {
    console.log('✓ Successfully marked task as completed!');
    console.log('  Updated tasks:', results[0].updatedCount);
  } else {
    console.log('✗ Failed to update task');
    if (results[0]?.error) {
      console.log('  Error:', results[0].error);
    }
  }
}

testCheckboxUpdate().catch(console.error);