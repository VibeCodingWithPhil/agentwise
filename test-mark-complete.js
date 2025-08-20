// Test marking tasks as complete manually
const fs = require('fs-extra');
const path = require('path');

async function markTasksComplete() {
  console.log('🔧 Manually testing task completion marking...\n');
  
  const phaseFile = path.join(__dirname, 'workspace/react-todo-app/agent-todos/frontend-specialist/phase1-todo.md');
  
  if (await fs.pathExists(phaseFile)) {
    console.log('📋 Reading phase file...');
    const content = await fs.readFile(phaseFile, 'utf-8');
    const lines = content.split('\n');
    
    // Tasks to mark complete (line numbers from our analysis)
    const tasksToComplete = [
      { line: 20, description: "Configure ESLint for React/TypeScript" },
      { line: 21, description: "Setup Prettier with Tailwind plugin" },
      { line: 27, description: "Create TypeScript types for Todo model" },
      { line: 28, description: "Setup base App component structure" },
      { line: 34, description: "Create basic layout structure" }
    ];
    
    console.log('🎯 Marking tasks as complete:');
    let changesMode = false;
    
    for (const task of tasksToComplete) {
      if (task.line < lines.length) {
        const line = lines[task.line];
        const taskMatch = line.match(/^(\s*)[-*]\s*\[\s*\]\s*(.+)/);
        
        if (taskMatch) {
          // Replace [ ] with [x] and add timestamp
          const indent = taskMatch[1];
          const taskText = taskMatch[2];
          const timestamp = new Date().toISOString().split('T')[0];
          const newLine = `${indent}- [x] ${taskText} <!-- completed: ${timestamp} -->`;
          
          lines[task.line] = newLine;
          changesMode = true;
          console.log(`   ✅ Line ${task.line + 1}: "${task.description}"`);
        } else {
          console.log(`   ⚠️  Line ${task.line + 1}: Task format not recognized`);
        }
      }
    }
    
    if (changesMode) {
      // Create backup first
      const backupFile = phaseFile.replace('.md', '_backup.md');
      await fs.copyFile(phaseFile, backupFile);
      console.log(`\n💾 Created backup: ${path.basename(backupFile)}`);
      
      // Write updated content
      await fs.writeFile(phaseFile, lines.join('\n'), 'utf-8');
      console.log('✅ Updated phase file with completed tasks');
      
      // Verify changes
      console.log('\n🔍 Verifying changes...');
      const updatedContent = await fs.readFile(phaseFile, 'utf-8');
      const updatedLines = updatedContent.split('\n');
      
      let totalTasks = 0;
      let completedTasks = 0;
      
      for (const line of updatedLines) {
        const taskMatch = line.match(/^(\s*)[-*]\s*\[([ xX])\]/);
        if (taskMatch) {
          totalTasks++;
          if (taskMatch[2].toLowerCase() === 'x') {
            completedTasks++;
          }
        }
      }
      
      console.log(`📊 New status: ${completedTasks}/${totalTasks} tasks completed`);
      console.log(`📈 Progress: ${((completedTasks / totalTasks) * 100).toFixed(1)}%`);
      
    } else {
      console.log('❌ No changes were made');
    }
    
  } else {
    console.log('❌ Phase file not found');
  }
}

markTasksComplete().catch(console.error);