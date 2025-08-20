// Test script for task completion detection
const { TaskCompletionDetector } = require('./dist/monitoring/TaskCompletionDetector');
const path = require('path');

async function testTaskCompletion() {
  console.log('🧪 Testing Task Completion Detection...\n');
  
  const projectPath = path.join(__dirname, 'workspace/react-todo-app');
  const detector = new TaskCompletionDetector(__dirname);
  
  console.log(`Testing on project: ${projectPath}\n`);
  
  try {
    // Scan for completed tasks
    const results = await detector.scanAndUpdateCompletedTasks(projectPath);
    
    console.log('📊 Results:');
    console.log(`Found ${results.length} agents with potential task completions\n`);
    
    let totalTasksCompleted = 0;
    let totalTasksScanned = 0;
    
    for (const result of results) {
      console.log(`🤖 Agent: ${result.agent}`);
      console.log(`   Phase: ${result.phase}`);
      console.log(`   Tasks completed: ${result.tasksCompleted}/${result.totalTasks}`);
      
      totalTasksCompleted += result.tasksCompleted;
      totalTasksScanned += result.totalTasks;
      
      if (result.completedTasks.length > 0) {
        console.log('   Completed tasks:');
        result.completedTasks.forEach(task => {
          console.log(`     ✅ "${task.description}" (${(task.confidence * 100).toFixed(0)}% confidence)`);
          task.evidence.forEach(evidence => {
            console.log(`        - ${evidence}`);
          });
        });
      }
      console.log('');
    }
    
    console.log(`🎯 Summary:`);
    console.log(`   Total tasks scanned: ${totalTasksScanned}`);
    console.log(`   Total tasks auto-completed: ${totalTasksCompleted}`);
    console.log(`   Success rate: ${totalTasksScanned > 0 ? ((totalTasksCompleted / totalTasksScanned) * 100).toFixed(1) : 0}%`);
    
    if (totalTasksCompleted > 0) {
      console.log('\n✅ Task completion detection working! Check the phase files for updates.');
    } else {
      console.log('\n⚠️  No tasks were automatically completed. This might be expected if all tasks are already marked complete.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTaskCompletion();