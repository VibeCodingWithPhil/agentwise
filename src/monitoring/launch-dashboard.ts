#!/usr/bin/env node
import { ProgressTracker } from './ProgressTracker';
import { Dashboard } from './Dashboard';
import { ProjectRegistry } from '../project-registry/ProjectRegistry';

async function launchDashboard() {
  const projectName = process.argv[2];
  const registry = new ProjectRegistry();
  
  let project;
  if (projectName) {
    const projects = await registry.listProjects();
    project = projects.find(p => p.name === projectName);
  } else {
    project = await registry.getActiveProject();
  }
  
  if (!project) {
    console.error('No project found. Please specify a project name or set an active project.');
    process.exit(1);
  }
  
  console.log(`Launching dashboard for project: ${project.name}`);
  
  const progressTracker = new ProgressTracker();
  await progressTracker.initialize();
  
  const dashboard = new Dashboard(progressTracker, project.id);
  
  process.on('SIGINT', () => {
    dashboard.destroy();
    progressTracker.destroy();
    process.exit(0);
  });
}

launchDashboard().catch(error => {
  console.error('Failed to launch dashboard:', error);
  process.exit(1);
});