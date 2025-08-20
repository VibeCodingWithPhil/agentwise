// Simple test to verify task completion detection works
const fs = require('fs-extra');
const path = require('path');

async function testTaskCompletionLogic() {
  console.log('🧪 Testing Task Completion Logic...\n');
  
  const projectPath = path.join(__dirname, 'workspace/react-todo-app');
  const frontendPhaseFile = path.join(projectPath, 'agent-todos/frontend-specialist/phase1-todo.md');
  
  console.log('📋 Checking current state of phase file...');
  
  if (await fs.pathExists(frontendPhaseFile)) {
    const content = await fs.readFile(frontendPhaseFile, 'utf-8');
    console.log('✅ Found phase file');
    
    // Count current tasks
    const lines = content.split('\n');
    let totalTasks = 0;
    let completedTasks = 0;
    const incompleteTasks = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const taskMatch = line.match(/^(\s*)[-*]\s*\[([ xX])\]\s*(.+)/);
      
      if (taskMatch) {
        totalTasks++;
        const isCompleted = taskMatch[2].toLowerCase() === 'x';
        const taskDescription = taskMatch[3].trim();
        
        if (isCompleted) {
          completedTasks++;
        } else {
          incompleteTasks.push({
            line: i,
            description: taskDescription
          });
        }
      }
    }
    
    console.log(`📊 Current status: ${completedTasks}/${totalTasks} tasks completed\n`);
    
    if (incompleteTasks.length > 0) {
      console.log('🔍 Incomplete tasks to check:');
      incompleteTasks.forEach(task => {
        console.log(`   - Line ${task.line + 1}: "${task.description}"`);
      });
      console.log('');
    }
    
    // Check if project files exist that should indicate task completion
    const projectStructure = {
      'package.json': 'React/TypeScript project initialization',
      'tsconfig.json': 'TypeScript configuration',
      'tailwind.config.js': 'Tailwind CSS setup',
      'eslint.config.js': 'ESLint configuration',
      '.prettierrc': 'Prettier configuration',
      'src/': 'Project structure setup'
    };
    
    console.log('🔍 Checking for evidence of completed tasks:');
    for (const [file, description] of Object.entries(projectStructure)) {
      const filePath = path.join(projectPath, file);
      const exists = await fs.pathExists(filePath);
      console.log(`   ${exists ? '✅' : '❌'} ${file} - ${description}`);
    }
    
    console.log('\n🎯 Analysis:');
    
    // Check package.json for dependencies
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJson(packageJsonPath);
      const hasReact = pkg.dependencies?.react;
      const hasVite = pkg.devDependencies?.vite;
      const hasTailwind = pkg.devDependencies?.tailwindcss;
      const hasESLint = pkg.devDependencies?.eslint;
      const hasPrettier = pkg.devDependencies?.prettier;
      
      console.log('   Package.json analysis:');
      console.log(`     React: ${hasReact ? '✅' : '❌'}`);
      console.log(`     Vite: ${hasVite ? '✅' : '❌'}`);
      console.log(`     Tailwind CSS: ${hasTailwind ? '✅' : '❌'}`);
      console.log(`     ESLint: ${hasESLint ? '✅' : '❌'}`);
      console.log(`     Prettier: ${hasPrettier ? '✅' : '❌'}`);
    }
    
    // Suggest which tasks should be marked complete
    console.log('\n💡 Tasks that should be marked complete based on evidence:');
    
    const shouldBeComplete = [];
    for (const task of incompleteTasks) {
      const desc = task.description.toLowerCase();
      
      if (desc.includes('eslint') && await fs.pathExists(path.join(projectPath, 'eslint.config.js'))) {
        shouldBeComplete.push(task);
      } else if (desc.includes('prettier') && await fs.pathExists(path.join(projectPath, '.prettierrc'))) {
        shouldBeComplete.push(task);
      } else if (desc.includes('tailwind') && await fs.pathExists(path.join(projectPath, 'tailwind.config.js'))) {
        shouldBeComplete.push(task);
      } else if (desc.includes('typescript') && await fs.pathExists(path.join(projectPath, 'tsconfig.json'))) {
        shouldBeComplete.push(task);
      } else if (desc.includes('structure') && await fs.pathExists(path.join(projectPath, 'src'))) {
        shouldBeComplete.push(task);
      }
    }
    
    if (shouldBeComplete.length > 0) {
      console.log(`   ${shouldBeComplete.length} tasks should be auto-completed:`);
      shouldBeComplete.forEach(task => {
        console.log(`     ✅ Line ${task.line + 1}: "${task.description}"`);
      });
    } else {
      console.log('   No obvious tasks to auto-complete detected');
    }
    
  } else {
    console.log('❌ Phase file not found');
  }
}

testTaskCompletionLogic().catch(console.error);