import { MDFileWatcher } from './MDFileWatcher';
import { MDTaskParser } from './MDTaskParser';
import * as path from 'path';
import * as fs from 'fs-extra';

async function testMonitoring() {
  const projectPath = path.join(process.cwd(), 'workspace', 'dashboard-app');
  
  console.log('Testing Monitoring System...');
  console.log('Project Path:', projectPath);
  console.log('Path exists:', await fs.pathExists(projectPath));
  
  // Test MDTaskParser directly
  const parser = new MDTaskParser();
  
  // Find MD files
  const mdFiles: string[] = [];
  async function findMDFiles(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isFile() && entry.name.endsWith('.md')) {
        mdFiles.push(fullPath);
      } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        // Don't recurse too deep for this test
        if (fullPath === projectPath) {
          await findMDFiles(fullPath);
        }
      }
    }
  }
  
  await findMDFiles(projectPath);
  console.log('\nFound MD files:', mdFiles.length);
  
  // Parse tasks from each file
  for (const file of mdFiles.slice(0, 5)) {  // Test first 5 files
    console.log('\nFile:', path.basename(file));
    const content = await fs.readFile(file, 'utf-8');
    const lines = content.split('\n');
    
    let checkboxCount = 0;
    let completedCount = 0;
    
    lines.forEach((line, index) => {
      const checkboxMatch = line.match(/^(\s*)[-*]\s*\[([ xX])\]\s*(.+)/);
      if (checkboxMatch) {
        checkboxCount++;
        if (checkboxMatch[2].toLowerCase() === 'x') {
          completedCount++;
        }
        if (checkboxCount <= 3) {  // Show first 3 checkboxes
          console.log(`  Line ${index + 1}: [${checkboxMatch[2]}] ${checkboxMatch[3].substring(0, 50)}...`);
        }
      }
    });
    
    if (checkboxCount > 0) {
      console.log(`  Total: ${checkboxCount} checkboxes, ${completedCount} completed`);
    }
  }
  
  // Test MDFileWatcher
  console.log('\n\nTesting MDFileWatcher...');
  const workspacePath = path.join(process.cwd(), 'workspace');
  const watcher = new MDFileWatcher(workspacePath);
  
  // Get tasks for dashboard-app project
  const projectId = 'dashboard-app';
  const tasks = await watcher.getProjectTasks(projectId);
  console.log('Tasks found:', tasks.length);
  
  if (tasks.length > 0) {
    console.log('\nFirst 5 tasks:');
    tasks.slice(0, 5).forEach(task => {
      console.log(`  - [${task.isCompleted ? 'x' : ' '}] ${task.taskDescription.substring(0, 50)}...`);
    });
  }
  
  // Get statistics
  const stats = await parser.getProjectStatistics(projectPath);
  console.log('\nProject Statistics:');
  console.log('  Total tasks:', stats.totalTasks);
  console.log('  Completed tasks:', stats.completedTasks);
  console.log('  Completion %:', stats.completionPercentage.toFixed(1));
  
  console.log('\n\nTest complete!');
}

testMonitoring().catch(console.error);