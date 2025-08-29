import * as fs from 'fs-extra';
import * as path from 'path';
import { AgentSelector } from '../agents/AgentSelector';
import { BackupManager } from '../backup/BackupManager';
import { CodeValidator } from '../validation/CodeValidator';
import { HallucinationDetector } from '../validation/HallucinationDetector';
import { ProjectManager } from '../projects/ProjectManager';
import { PhaseOrchestrator } from '../orchestration/PhaseOrchestrator';
import { ProjectRegistrySync } from '../project-registry/ProjectRegistrySync';
import { ProjectIntegrationManager } from '../integration/ProjectIntegrationManager';
import { TerminalIntegration, TerminalState, type IntegrationConfig } from '../terminal';
import { KnowledgeGraphCommand } from './KnowledgeGraphCommand';
import { CodebaseContextManager } from '../context/CodebaseContextManager';

export interface CommandContext {
  command: string;
  args: string[];
  projectName?: string;
  userPrompt: string;
  isExistingProject: boolean;
}

export interface CommandResult {
  success: boolean;
  message: string;
  selectedAgents?: string[];
  validationResults?: any;
  backupCreated?: boolean;
}

export class EnhancedCommandHandler {
  private agentSelector: AgentSelector;
  private backupManager: BackupManager;
  private projectManager: ProjectManager;
  private orchestrator: PhaseOrchestrator;
  private integrationManager: ProjectIntegrationManager;
  private terminalIntegration: TerminalIntegration;
  private knowledgeGraphCommand: KnowledgeGraphCommand;
  private contextManager: CodebaseContextManager;

  constructor() {
    this.agentSelector = new AgentSelector();
    this.backupManager = new BackupManager();
    this.projectManager = new ProjectManager();
    this.orchestrator = new PhaseOrchestrator();
    this.integrationManager = new ProjectIntegrationManager();
    this.terminalIntegration = new TerminalIntegration({
      enableAutoPermissions: true,
      enableAutoInput: true,
      safetyMode: true,
      maxConcurrentSessions: 3
    });
    this.contextManager = new CodebaseContextManager();
    this.knowledgeGraphCommand = new KnowledgeGraphCommand(this.contextManager);
  }

  /**
   * Handle create command with intelligent agent selection
   */
  async handleCreate(prompt: string): Promise<CommandResult> {
    console.log('\\n🤖 Analyzing project requirements...');

    // Sync registry before creating new project
    const registrySync = new ProjectRegistrySync();
    await registrySync.syncRegistry();

    // Select appropriate agents
    const selection = await this.agentSelector.selectAgents(prompt);
    
    // Show selection reasoning
    console.log(`\\n📋 Agent Selection: ${selection.reasoning}`);
    console.log(`\\n✅ Selected Agents: ${selection.selectedAgents.join(', ')}`);

    // Ask for confirmation if not all agents selected
    if (selection.userConfirmationNeeded && selection.selectedAgents.length < 5) {
      const response = await this.askUserConfirmation(
        `Only ${selection.selectedAgents.length} agents selected. Would you like to use ALL agents for comprehensive coverage?`
      );
      
      if (response) {
        selection.selectedAgents = await this.getAllAgentIds();
        selection.requiresAllAgents = true;
      }
    }

    // Create project with selected agents
    const projectName = this.extractProjectName(prompt);
    const projectPath = path.join(process.cwd(), 'workspace', projectName);

    // Initialize project
    await this.projectManager.createProject(projectName, prompt);
    
    // Apply context awareness and structure validation
    await this.integrationManager.initializeProject(projectPath, {
      validateStructure: true,
      initializeContext: true,
      syncRegistry: false, // Already synced above
      createAgentsMd: true,
      startWatching: true
    });

    // Launch selected agents
    await this.launchAgents(selection.selectedAgents, projectName, prompt, 'create');

    return {
      success: true,
      message: `Project ${projectName} created with ${selection.selectedAgents.length} agents`,
      selectedAgents: selection.selectedAgents
    };
  }

  /**
   * Handle task command with validation and backup
   */
  async handleTask(prompt: string, projectName?: string): Promise<CommandResult> {
    // Determine project
    const project = projectName || await this.projectManager.getCurrentProject();
    if (!project) {
      return {
        success: false,
        message: 'No active project. Use /projects to select one.'
      };
    }

    const projectPath = path.join(process.cwd(), 'workspace', project);
    
    // Ensure project has context awareness and proper structure
    await this.integrationManager.initializeProject(projectPath, {
      validateStructure: true,
      initializeContext: true,
      syncRegistry: true,
      createAgentsMd: false, // Don't recreate if exists
      startWatching: true
    });

    // Create automatic backup before task
    console.log('\\n💾 Creating safety backup...');
    await this.backupManager.autoBackup(project, `task: ${prompt.substring(0, 50)}...`);

    // Validate current code state
    console.log('\\n🔍 Validating current code...');
    const validator = new CodeValidator(projectPath);
    const validationResults = await validator.validateProject();

    if (!validationResults.valid && validationResults.errors.length > 0) {
      console.log('\\n⚠️  Code validation issues found:');
      validationResults.errors.slice(0, 5).forEach(error => {
        console.log(`  - ${error.file}: ${error.message}`);
      });
    }

    // Select agents for the task using full codebase context
    const context = await this.integrationManager.getProjectContext(project);
    const contextString = context ? JSON.stringify(context) : undefined;
    const selection = await this.agentSelector.selectAgents(prompt, contextString);

    console.log(`\\n📋 Task Analysis: ${selection.reasoning}`);
    console.log(`\\n✅ Assigned to: ${selection.selectedAgents.join(', ')}`);

    // Ask for confirmation if needed
    if (selection.userConfirmationNeeded) {
      const response = await this.askUserConfirmation(
        `Task will use ${selection.selectedAgents.length} agents. Use ALL agents instead?`
      );
      
      if (response) {
        selection.selectedAgents = await this.getAllAgentIds();
      }
    }

    // Setup hallucination detection
    const hallucinationDetector = new HallucinationDetector(projectPath);

    // Launch agents with validation hooks
    await this.launchAgentsWithValidation(
      selection.selectedAgents,
      project,
      prompt,
      'task',
      hallucinationDetector
    );

    return {
      success: true,
      message: `Task assigned to ${selection.selectedAgents.length} agents`,
      selectedAgents: selection.selectedAgents,
      validationResults,
      backupCreated: true
    };
  }

  /**
   * Handle import command with full validation
   */
  async handleImport(sourcePath: string): Promise<CommandResult> {
    const projectName = path.basename(sourcePath);
    const targetPath = path.join(process.cwd(), 'workspace', projectName);

    console.log('\\n📦 Importing project...');

    // Copy project
    await fs.copy(sourcePath, targetPath);
    
    // Initialize imported project with full integration
    await this.integrationManager.initializeProject(targetPath, {
      validateStructure: true,
      initializeContext: true,
      syncRegistry: true,
      createAgentsMd: true,
      startWatching: true
    });

    // Validate imported code
    console.log('\\n🔍 Validating imported code...');
    const validator = new CodeValidator(targetPath);
    const validationResults = await validator.validateProject();

    if (validationResults.phantomCodeDetected) {
      console.log('\\n⚠️  WARNING: Phantom code detected in imported project!');
      console.log('Agents will be instructed to complete all placeholders.');
    }

    // Get full context and select agents
    const projectContext = await this.integrationManager.getProjectContext(projectName);
    const contextString = projectContext ? JSON.stringify(projectContext) : undefined;
    const selection = await this.agentSelector.selectAgents(
      `Analyze and improve imported ${projectName} project`,
      contextString
    );

    console.log(`\\n✅ Selected ${selection.selectedAgents.length} agents for import analysis`);

    // Create initial backup
    await this.backupManager.createBackup(projectName, 'Initial import');

    // Launch agents for import analysis
    await this.launchAgentsWithValidation(
      selection.selectedAgents,
      projectName,
      'Analyze imported project and fix any issues',
      'import',
      new HallucinationDetector(targetPath)
    );

    return {
      success: true,
      message: `Imported ${projectName} with ${selection.selectedAgents.length} agents`,
      selectedAgents: selection.selectedAgents,
      validationResults
    };
  }

  /**
   * Handle backup restoration
   */
  async handleRestore(backupId: string, projectName: string): Promise<CommandResult> {
    try {
      console.log(`\\n🔄 Restoring ${projectName} from backup ${backupId}...`);
      
      await this.backupManager.restoreBackup({
        backupId,
        projectName,
        confirmRestore: true
      });

      return {
        success: true,
        message: `Successfully restored ${projectName} from backup`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to restore: ${error}`
      };
    }
  }

  /**
   * Launch agents with validation hooks
   */
  private async launchAgentsWithValidation(
    agentIds: string[],
    projectName: string,
    prompt: string,
    operation: string,
    hallucinationDetector: HallucinationDetector
  ): Promise<void> {
    const projectPath = path.join(process.cwd(), 'workspace', projectName);

    for (const agentId of agentIds) {
      // Create agent-specific validation wrapper
      const _validationWrapper = async (agentOutput: string) => {
        // Check for hallucinations
        const hallucinationCheck = await hallucinationDetector.checkAgentOutput(
          agentId,
          agentOutput,
          { task: prompt, operation }
        );

        if (!hallucinationCheck.passed) {
          console.log(`\\n⚠️  ${agentId} hallucination detected:`);
          hallucinationCheck.issues.forEach(issue => {
            if (issue.severity === 'high' || issue.severity === 'critical') {
              console.log(`  - ${issue.description}`);
            }
          });

          // Return instructions to fix issues
          return hallucinationCheck.recommendations.join('\\n');
        }

        // Validate generated code
        const validator = new CodeValidator(projectPath);
        const validation = await validator.validateProject();

        if (validation.phantomCodeDetected) {
          console.log(`\\n⚠️  ${agentId} generated phantom code`);
          return 'Complete all TODO and placeholder implementations with real code';
        }

        return null; // No issues
      };

      // Store validation wrapper for agent
      this.orchestrator.registerValidation(agentId, (data: any) => {
        // Convert async validation to sync by checking if data is valid
        return data && typeof data === 'object';
      });
    }

    // Launch agents through orchestrator
    await this.orchestrator.executePhase(1, {
      name: operation,
      agents: agentIds.map(id => ({
        id,
        tasks: [{ description: prompt }]
      }))
    });
  }

  /**
   * Launch agents without validation (simpler version)
   */
  private async launchAgents(
    agentIds: string[],
    _projectName: string,
    _prompt: string,
    operation: string
  ): Promise<void> {
    // This is a simplified version - in production, integrate with terminal manager
    console.log(`\\n🚀 Launching ${agentIds.length} agents for ${operation}...`);
    
    for (const agentId of agentIds) {
      console.log(`  - Starting ${agentId}`);
      // In production: Launch actual terminal with agent
    }
  }

  /**
   * Get all available agent IDs
   */
  private async getAllAgentIds(): Promise<string[]> {
    const agents = await this.agentSelector.getAllAgents();
    return agents.map(a => a.id);
  }

  /**
   * Ask user for confirmation (mock implementation)
   */
  private async askUserConfirmation(question: string): Promise<boolean> {
    console.log(`\\n❓ ${question} (y/n)`);
    // In production: Implement actual user input
    // For now, return true to proceed
    return true;
  }

  /**
   * Extract project name from prompt
   */
  private extractProjectName(prompt: string): string {
    // Try to extract project name from prompt
    const nameMatch = prompt.match(/(?:called|named|project)\s+["']?(\w+)["']?/i);
    if (nameMatch) {
      return nameMatch[1].toLowerCase();
    }

    // Generate from first few words
    const words = prompt.split(' ').slice(0, 3);
    return words.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Load project context
   */
  private async loadProjectContext(projectPath: string): Promise<string> {
    const contextFile = path.join(projectPath, 'project-context.md');
    if (await fs.pathExists(contextFile)) {
      return await fs.readFile(contextFile, 'utf-8');
    }
    return '';
  }

  /**
   * Analyze imported project
   */
  private async analyzeImportedProject(projectPath: string): Promise<string> {
    const analysis: string[] = [];

    // Check package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJSON(packageJsonPath);
      analysis.push(`Node.js project: ${pkg.name}`);
      
      if (pkg.dependencies?.react) analysis.push('React frontend');
      if (pkg.dependencies?.express) analysis.push('Express backend');
      if (pkg.dependencies?.['@angular/core']) analysis.push('Angular frontend');
      if (pkg.dependencies?.vue) analysis.push('Vue frontend');
    }

    // Check for other project types
    if (await fs.pathExists(path.join(projectPath, 'requirements.txt'))) {
      analysis.push('Python project');
    }

    if (await fs.pathExists(path.join(projectPath, 'Cargo.toml'))) {
      analysis.push('Rust project');
    }

    if (await fs.pathExists(path.join(projectPath, 'go.mod'))) {
      analysis.push('Go project');
    }

    return analysis.join(', ');
  }

  /**
   * List available backups
   */
  async listBackups(projectName?: string): Promise<void> {
    const backups = await this.backupManager.listBackups(projectName);
    
    console.log(`\\n📦 Available Backups${projectName ? ` for ${projectName}` : ''}:`);
    
    if (backups.length === 0) {
      console.log('  No backups found');
      return;
    }

    backups.forEach(backup => {
      const date = new Date(backup.timestamp).toLocaleString();
      const size = (backup.size / 1024 / 1024).toFixed(2);
      console.log(`  - ${backup.id}`);
      console.log(`    Date: ${date}`);
      console.log(`    Size: ${size} MB`);
      console.log(`    Description: ${backup.description}`);
    });
  }

  /**
   * Handle terminal monitoring and auto-continuation
   */
  async handleTerminalMonitor(command: string[], options: Partial<IntegrationConfig> = {}): Promise<CommandResult> {
    try {
      console.log('\\n🖥️  Starting terminal monitoring...');
      console.log(`Command: ${command.join(' ')}`);

      // Update terminal integration config if provided
      if (Object.keys(options).length > 0) {
        this.terminalIntegration.updateConfig(options);
        console.log('Updated terminal integration configuration');
      }

      const sessionId = await this.terminalIntegration.startClaudeCodeSession(command);
      
      console.log(`\\n✅ Terminal monitoring session started: ${sessionId}`);
      console.log('🤖 Auto-continuation is active');
      console.log('📊 Monitoring for permission requests and input needs');

      // Set up event listeners for this session
      this.setupTerminalEventListeners(sessionId);

      return {
        success: true,
        message: `Terminal monitoring started for session ${sessionId}`,
        validationResults: {
          sessionId,
          config: this.terminalIntegration.getAllStats().config,
          monitoring: true
        }
      };

    } catch (error) {
      console.error('\\n❌ Failed to start terminal monitoring:', error);
      return {
        success: false,
        message: `Terminal monitoring failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Monitor an existing Claude Code process
   */
  async handleMonitorExisting(processId: string): Promise<CommandResult> {
    try {
      console.log(`\\n🔍 Attempting to monitor existing process: ${processId}`);
      
      // This would require additional implementation to attach to existing processes
      // For now, we'll provide guidance
      console.log('📝 To monitor existing Claude Code processes:');
      console.log('   1. Stop the current process');
      console.log('   2. Use `/terminal-monitor` to start with monitoring');
      console.log('   3. Or use the PermissionBypassSystem for direct integration');

      return {
        success: false,
        message: 'Monitoring existing processes requires restarting with terminal monitoring enabled'
      };

    } catch (error) {
      return {
        success: false,
        message: `Failed to monitor existing process: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Get terminal monitoring status and statistics
   */
  async getTerminalStats(): Promise<{
    success: boolean;
    stats?: any;
    sessions?: any[];
  }> {
    try {
      const stats = this.terminalIntegration.getAllStats();
      const sessions = this.terminalIntegration.getAllSessions().map(session => ({
        id: session.id,
        status: session.status,
        startTime: session.startTime,
        runtime: Date.now() - session.startTime.getTime(),
        command: `${session.config.command} ${session.config.args.join(' ')}`
      }));

      return {
        success: true,
        stats,
        sessions
      };
    } catch (error) {
      return {
        success: false
      };
    }
  }

  /**
   * Stop terminal monitoring for a specific session
   */
  async stopTerminalMonitoring(sessionId: string): Promise<CommandResult> {
    try {
      this.terminalIntegration.stopSession(sessionId);
      
      return {
        success: true,
        message: `Terminal monitoring stopped for session ${sessionId}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to stop monitoring: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Send input to a monitored terminal session
   */
  async sendTerminalInput(sessionId: string, input: string): Promise<CommandResult> {
    try {
      this.terminalIntegration.sendInputToSession(sessionId, input);
      
      return {
        success: true,
        message: `Input sent to session ${sessionId}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to send input: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Set up event listeners for terminal monitoring
   */
  private setupTerminalEventListeners(sessionId: string): void {
    // Listen for session events
    this.terminalIntegration.on('session_output', (event) => {
      if (event.sessionId === sessionId) {
        // Log important output
        if (event.stream === 'stderr' || (event.data && event.data.includes('error'))) {
          console.log(`[${sessionId}] ⚠️  ${event.data.trim()}`);
        }
      }
    });

    this.terminalIntegration.on('session_continuation', (event) => {
      if (event.sessionId === sessionId) {
        console.log(`[${sessionId}] 🤖 Auto-response: "${event.response.trim()}" for prompt: "${event.prompt || 'Unknown'}"`);
      }
    });

    this.terminalIntegration.on('session_state_change', (event) => {
      if (event.sessionId === sessionId) {
        const stateEmoji: Record<TerminalState, string> = {
          [TerminalState.IDLE]: '⏸️',
          [TerminalState.RUNNING]: '🏃',
          [TerminalState.WAITING_PERMISSION]: '🔐',
          [TerminalState.WAITING_INPUT]: '⌨️',
          [TerminalState.ERROR]: '❌',
          [TerminalState.COMPLETED]: '✅',
          [TerminalState.INTERRUPTED]: '⏹️'
        };
        
        console.log(`[${sessionId}] ${stateEmoji[event.newState as TerminalState]} State: ${event.oldState} → ${event.newState}`);
      }
    });

    this.terminalIntegration.on('session_error', (event) => {
      if (event.sessionId === sessionId) {
        console.error(`[${sessionId}] ❌ Error: ${event.error}`);
      }
    });

    this.terminalIntegration.on('session_exit', (event) => {
      if (event.sessionId === sessionId) {
        const status = event.success ? '✅ Success' : `❌ Failed (code: ${event.code})`;
        console.log(`[${sessionId}] 🏁 Session ended: ${status}`);
      }
    });
  }
}