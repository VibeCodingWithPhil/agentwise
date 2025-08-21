/**
 * Tests for ImportHandler functionality
 */

import { ImportHandler } from '../src/commands/ImportHandler';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('ImportHandler', () => {
  let importHandler: ImportHandler;
  const testWorkspace = path.join(process.cwd(), 'test-workspace');

  beforeEach(() => {
    importHandler = new ImportHandler();
  });

  afterEach(async () => {
    // Clean up test workspace
    await fs.remove(testWorkspace);
  });

  describe('Project Analysis', () => {
    it('should detect Node.js projects', async () => {
      // Create test project structure
      const testProject = path.join(testWorkspace, 'test-node-project');
      await fs.ensureDir(testProject);
      
      // Create package.json
      await fs.writeJson(path.join(testProject, 'package.json'), {
        name: 'test-project',
        dependencies: {
          express: '^4.0.0',
          react: '^18.0.0'
        }
      });

      // Test analysis
      const analysis = await importHandler['analyzeProject'](testProject);
      
      expect(analysis.technologies).toContain('Node.js');
      expect(analysis.frameworks).toContain('Express');
      expect(analysis.frameworks).toContain('React');
      expect(analysis.hasFrontend).toBe(true);
      expect(analysis.hasBackend).toBe(true);
      expect(analysis.projectType).toBe('fullstack');
    });

    it('should detect Python projects', async () => {
      const testProject = path.join(testWorkspace, 'test-python-project');
      await fs.ensureDir(testProject);
      
      // Create requirements.txt
      await fs.writeFile(
        path.join(testProject, 'requirements.txt'),
        'django==4.0.0\nnumpy==1.21.0'
      );

      const analysis = await importHandler['analyzeProject'](testProject);
      
      expect(analysis.technologies).toContain('Python');
      expect(analysis.hasBackend).toBe(true);
    });
  });

  describe('Agent Selection', () => {
    it('should select appropriate agents for frontend project', async () => {
      const analysis = {
        hasFrontend: true,
        hasBackend: false,
        hasDatabase: false,
        testFrameworks: []
      };

      const agents = await importHandler['selectAgentsForProject'](analysis);
      
      expect(agents).toContain('frontend-specialist');
      expect(agents).toContain('designer-specialist');
      expect(agents).toContain('orchestrator-specialist');
      expect(agents).not.toContain('backend-specialist');
      expect(agents).not.toContain('database-specialist');
    });

    it('should select all relevant agents for fullstack project', async () => {
      const analysis = {
        hasFrontend: true,
        hasBackend: true,
        hasDatabase: true,
        hasDocker: true,
        hasCI: true,
        testFrameworks: ['jest']
      };

      const agents = await importHandler['selectAgentsForProject'](analysis);
      
      expect(agents).toContain('frontend-specialist');
      expect(agents).toContain('backend-specialist');
      expect(agents).toContain('database-specialist');
      expect(agents).toContain('devops-specialist');
      expect(agents).toContain('testing-specialist');
      expect(agents).toContain('orchestrator-specialist');
    });
  });

  describe('Agent Todo Creation', () => {
    it('should create agent-todo folders for each selected agent', async () => {
      const projectName = 'test-project';
      const agents = ['frontend-specialist', 'backend-specialist'];
      const projectPath = path.join(testWorkspace, projectName);
      
      await fs.ensureDir(projectPath);
      await importHandler['createAgentTodoFolders'](projectName, agents);

      // Check folders exist
      for (const agent of agents) {
        const agentPath = path.join(projectPath, 'agent-todo', agent);
        expect(await fs.pathExists(agentPath)).toBe(true);
        
        // Check phase files exist
        for (let phase = 1; phase <= 3; phase++) {
          const phaseFile = path.join(agentPath, `phase${phase}.md`);
          expect(await fs.pathExists(phaseFile)).toBe(true);
        }
      }
    });
  });

  describe('Task Generation', () => {
    it('should generate appropriate tasks for each agent', async () => {
      const projectName = 'test-project';
      const agents = ['frontend-specialist'];
      const analysis = {
        projectType: 'frontend',
        technologies: ['React', 'TypeScript']
      };
      const projectPath = path.join(testWorkspace, projectName);
      
      // Create structure
      await fs.ensureDir(path.join(projectPath, 'agent-todo', 'frontend-specialist'));
      
      await importHandler['generateImportTasks'](projectName, agents, analysis);
      
      // Check task file content
      const taskFile = path.join(
        projectPath, 
        'agent-todo', 
        'frontend-specialist', 
        'phase1.md'
      );
      
      const content = await fs.readFile(taskFile, 'utf-8');
      expect(content).toContain('Import Analysis Tasks');
      expect(content).toContain('Project Type: frontend');
      expect(content).toContain('Technologies: React, TypeScript');
      expect(content).toContain('Analyze UI component structure');
    });
  });
});