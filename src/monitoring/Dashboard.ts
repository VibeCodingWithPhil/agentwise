import * as blessed from 'blessed';
import { ProgressTracker, ProjectProgress } from './ProgressTracker';
import chalk from 'chalk';

export class Dashboard {
  private screen: blessed.Widgets.Screen;
  private progressTracker: ProgressTracker;
  private boxes: {
    header: blessed.Widgets.BoxElement;
    progress: blessed.Widgets.BoxElement;
    phases: blessed.Widgets.BoxElement;
    agents: blessed.Widgets.BoxElement;
    tasks: blessed.Widgets.BoxElement;
    logs: any; // blessed.log returns a special log element
  };
  private projectId: string;
  private refreshInterval: NodeJS.Timeout | null = null;

  constructor(progressTracker: ProgressTracker, projectId: string) {
    this.progressTracker = progressTracker;
    this.projectId = projectId;
    this.screen = blessed.screen({
      smartCSR: true,
      title: 'Agentwise Dashboard'
    });

    this.boxes = this.createLayout();
    this.setupEventHandlers();
    this.startRefresh();
  }

  private createLayout(): Dashboard['boxes'] {
    const header = blessed.box({
      parent: this.screen,
      top: 0,
      left: 0,
      width: '100%',
      height: 3,
      content: '{center}Agentwise Multi-Agent Dashboard{/center}',
      tags: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'cyan',
        border: {
          fg: 'cyan'
        }
      }
    });

    const progress = blessed.box({
      parent: this.screen,
      label: ' Overall Progress ',
      top: 3,
      left: 0,
      width: '50%',
      height: 6,
      tags: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: 'green'
        }
      }
    });

    const phases = blessed.box({
      parent: this.screen,
      label: ' Phase Status ',
      top: 3,
      left: '50%',
      width: '50%',
      height: 6,
      tags: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: 'yellow'
        }
      }
    });

    const agents = blessed.box({
      parent: this.screen,
      label: ' Agent Activity ',
      top: 9,
      left: 0,
      width: '50%',
      height: 10,
      tags: true,
      scrollable: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: 'magenta'
        }
      }
    });

    const tasks = blessed.box({
      parent: this.screen,
      label: ' Active Tasks ',
      top: 9,
      left: '50%',
      width: '50%',
      height: 10,
      tags: true,
      scrollable: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: 'blue'
        }
      }
    });

    const logs = (blessed as any).log({
      parent: this.screen,
      label: ' Live Logs ',
      top: 19,
      left: 0,
      width: '100%',
      height: 'shrink',
      bottom: 0,
      tags: true,
      scrollable: true,
      alwaysScroll: true,
      border: {
        type: 'line'
      },
      style: {
        fg: 'white',
        border: {
          fg: 'white'
        }
      }
    });

    return { header, progress, phases, agents, tasks, logs };
  }

  private setupEventHandlers(): void {
    this.screen.key(['escape', 'q', 'C-c'], () => {
      this.destroy();
      process.exit(0);
    });

    this.progressTracker.on('task:started', (data) => {
      this.logEvent(`Task started: ${data.task.task} by ${data.task.agentId}`, 'info');
      this.refresh();
    });

    this.progressTracker.on('task:completed', (data) => {
      this.logEvent(`Task completed: ${data.task.task} by ${data.task.agentId}`, 'success');
      this.refresh();
    });

    this.progressTracker.on('task:failed', (data) => {
      this.logEvent(`Task failed: ${data.task.task} - ${data.task.error}`, 'error');
      this.refresh();
    });

    this.progressTracker.on('phase:started', (data) => {
      this.logEvent(`Phase ${data.phase.phase} started: ${data.phase.name}`, 'info');
      this.refresh();
    });

    this.progressTracker.on('phase:completed', (data) => {
      this.logEvent(`Phase ${data.phase.phase} completed: ${data.phase.name}`, 'success');
      this.refresh();
    });

    this.progressTracker.on('tokens:updated', (data) => {
      this.logEvent(`Tokens used: ${data.tokens}`, 'info');
      this.refresh();
    });
  }

  private startRefresh(): void {
    this.refresh();
    this.refreshInterval = setInterval(() => this.refresh(), 1000);
  }

  private refresh(): void {
    const progress = this.progressTracker.getProjectProgress(this.projectId);
    if (!progress) return;

    this.updateProgress(progress);
    this.updatePhases(progress);
    this.updateAgents(progress);
    this.updateTasks(progress);
    
    this.screen.render();
  }

  private updateProgress(progress: ProjectProgress): void {
    const progressBar = this.createProgressBar(progress.overallProgress);
    const content = [
      `Project: ${progress.projectName}`,
      '',
      progressBar,
      `${progress.overallProgress}% Complete`,
      `Tasks: ${progress.metrics.completedTasks}/${progress.metrics.totalTasks}`,
      `Tokens: ${progress.metrics.tokensUsed.toLocaleString()}`
    ];
    
    this.boxes.progress.setContent(content.join('\n'));
  }

  private updatePhases(progress: ProjectProgress): void {
    const phaseLines = progress.phases.map(phase => {
      const icon = phase.status === 'completed' ? '✅' :
                   phase.status === 'in_progress' ? '🔄' : '⏳';
      const progressPct = phase.totalTasks > 0 
        ? Math.round((phase.completedTasks / phase.totalTasks) * 100)
        : 0;
      return `${icon} Phase ${phase.phase}: ${phase.name} (${progressPct}%)`;
    });
    
    this.boxes.phases.setContent(phaseLines.join('\n'));
  }

  private updateAgents(progress: ProjectProgress): void {
    const agentStats: Map<string, { tasks: number; completed: number; failed: number }> = new Map();
    
    for (const phase of progress.phases) {
      for (const [agentId, stats] of Object.entries(phase.agents)) {
        const existing = agentStats.get(agentId) || { tasks: 0, completed: 0, failed: 0 };
        agentStats.set(agentId, {
          tasks: existing.tasks + stats.tasks,
          completed: existing.completed + stats.completed,
          failed: existing.failed + stats.failed
        });
      }
    }

    const agentLines = Array.from(agentStats.entries()).map(([agentId, stats]) => {
      const successRate = stats.tasks > 0 
        ? Math.round((stats.completed / stats.tasks) * 100)
        : 0;
      const status = progress.activeTasks.some(t => t.agentId === agentId) ? '🟢' : '⚪';
      return `${status} ${agentId}: ${stats.completed}/${stats.tasks} (${successRate}% success)`;
    });
    
    this.boxes.agents.setContent(agentLines.join('\n'));
  }

  private updateTasks(progress: ProjectProgress): void {
    const taskLines = progress.activeTasks.map(task => {
      const duration = task.startTime 
        ? Math.round((Date.now() - new Date(task.startTime).getTime()) / 1000)
        : 0;
      return `[${task.agentId}] ${task.task} (${duration}s)`;
    });
    
    if (taskLines.length === 0) {
      taskLines.push('No active tasks');
    }
    
    this.boxes.tasks.setContent(taskLines.join('\n'));
  }

  private createProgressBar(percentage: number): string {
    const width = 40;
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;
    
    return `[${chalk.green('█'.repeat(filled))}${chalk.gray('░'.repeat(empty))}]`;
  }

  private logEvent(message: string, type: 'info' | 'success' | 'error' | 'warning'): void {
    const timestamp = new Date().toLocaleTimeString();
    let formattedMessage = `[${timestamp}] `;
    
    switch (type) {
      case 'success':
        formattedMessage += chalk.green(message);
        break;
      case 'error':
        formattedMessage += chalk.red(message);
        break;
      case 'warning':
        formattedMessage += chalk.yellow(message);
        break;
      default:
        formattedMessage += chalk.cyan(message);
    }
    
    this.boxes.logs.log(formattedMessage);
  }

  destroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    this.screen.destroy();
  }
}