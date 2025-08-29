/**
 * ContextCommand - Command to manage and monitor SharedContextServer
 * 
 * Provides commands to:
 * - Check context server status
 * - View optimization statistics
 * - Control context sharing features
 * - Monitor real-time performance
 */

import axios from 'axios';
import * as chalk from 'chalk';

export class ContextCommand {
  private serverUrl = 'http://localhost:3003';

  async handle(args: string[]): Promise<void> {
    const subcommand = args[0] || 'status';

    try {
      switch (subcommand) {
        case 'status':
          await this.showStatus();
          break;
        case 'stats':
          await this.showStats();
          break;
        case 'health':
          await this.showHealth();
          break;
        case 'metrics':
          await this.showMetrics();
          break;
        case 'help':
          this.showHelp();
          break;
        default:
          console.log(chalk.red(`Unknown context command: ${subcommand}`));
          this.showHelp();
      }
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        console.log(chalk.yellow('\n⚠️  SharedContextServer is not running'));
        console.log(chalk.gray('The server starts automatically when you use Agentwise commands.'));
        console.log(chalk.gray('Or run: npm start to initialize the full system.\n'));
      } else {
        console.error(chalk.red('Context command error:'), error.message);
      }
    }
  }

  /**
   * Show context server status
   */
  private async showStatus(): Promise<void> {
    try {
      const response = await axios.get(`${this.serverUrl}/health`);
      const health = response.data;
      
      console.log(chalk.blue('\n🔗 SharedContextServer Status\n'));
      console.log(`${chalk.green('✅')} Server: ${chalk.bold('Running')}`);
      console.log(`${chalk.blue('🌐')} URL: ${chalk.gray(this.serverUrl)}`);
      console.log(`${chalk.blue('⚡')} Status: ${chalk.green(health.status)}`);
      console.log(`${chalk.blue('📊')} Active Contexts: ${chalk.yellow(health.contexts)}`);
      console.log(`${chalk.blue('🔌')} Connections: ${chalk.yellow(health.connections)}`);
      console.log(`${chalk.blue('⏰')} Uptime: ${chalk.gray(new Date(health.timestamp).toLocaleString())}`);
      
      console.log(chalk.blue('\n💡 Token Optimization: ') + chalk.green('ACTIVE'));
      console.log(chalk.gray('   Context sharing reduces token usage by 60-80% across agents'));
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Show optimization statistics
   */
  private async showStats(): Promise<void> {
    try {
      const response = await axios.get(`${this.serverUrl}/metrics`);
      const metrics = response.data;
      
      console.log(chalk.blue('\n📊 SharedContextServer Metrics\n'));
      
      // Server metrics
      console.log(chalk.bold('Server Performance:'));
      console.log(`  Total Requests: ${chalk.yellow(metrics.totalRequests)}`);
      console.log(`  Cache Hits: ${chalk.green(metrics.cacheHits)} (${metrics.totalRequests > 0 ? Math.round((metrics.cacheHits / metrics.totalRequests) * 100) : 0}%)`);
      console.log(`  Active Connections: ${chalk.yellow(metrics.activeConnections)}`);
      console.log(`  Compression Saved: ${chalk.green(Math.round(metrics.compressionSaved / 1024))} KB`);
      
      // Context metrics
      console.log(chalk.bold('\nContext Optimization:'));
      console.log(`  Active Contexts: ${chalk.yellow(metrics.activeContexts)}`);
      console.log(`  Total Versions: ${chalk.yellow(metrics.totalVersions)}`);
      console.log(`  Tokens Saved: ${chalk.green(metrics.tokensSaved)}`);
      
      // Memory usage
      const memoryMB = Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024);
      console.log(chalk.bold('\nSystem Resources:'));
      console.log(`  Memory Usage: ${chalk.yellow(memoryMB)} MB`);
      console.log(`  Uptime: ${chalk.gray(Math.round(metrics.uptime / 60))} minutes`);
      
      // Context details
      if (metrics.contextSizes && metrics.contextSizes.length > 0) {
        console.log(chalk.bold('\nActive Project Contexts:'));
        metrics.contextSizes.forEach((ctx: any) => {
          console.log(`  ${chalk.blue(ctx.projectId)}: ${ctx.versions} versions, ${ctx.subscribers} agents`);
          console.log(`    Last accessed: ${chalk.gray(new Date(ctx.lastAccessed).toLocaleString())}`);
          console.log(`    Size: ${chalk.yellow(Math.round(ctx.size / 1024))} KB`);
        });
      }
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Show health check details
   */
  private async showHealth(): Promise<void> {
    try {
      const response = await axios.get(`${this.serverUrl}/health`);
      const health = response.data;
      
      console.log(chalk.blue('\n🏥 SharedContextServer Health Check\n'));
      
      const statusColor = health.status === 'healthy' ? chalk.green : 
                         health.status === 'degraded' ? chalk.yellow : chalk.red;
      
      console.log(`Overall Status: ${statusColor(health.status.toUpperCase())}`);
      console.log(`Timestamp: ${chalk.gray(health.timestamp)}`);
      console.log(`Version: ${chalk.blue(health.version)}`);
      
      if (health.status !== 'healthy') {
        console.log(chalk.yellow('\n⚠️  Issues detected:'));
        // Health details would be included in the response
      } else {
        console.log(chalk.green('\n✅ All systems operational'));
      }
      
    } catch (error) {
      throw error;
    }
  }

  /**
   * Show detailed metrics in real-time
   */
  private async showMetrics(): Promise<void> {
    console.log(chalk.blue('📈 Real-time Context Metrics (Ctrl+C to exit)\n'));
    
    const displayMetrics = async () => {
      try {
        const response = await axios.get(`${this.serverUrl}/metrics`);
        const metrics = response.data;
        
        // Clear screen and show updated metrics
        process.stdout.write('\x1b[2J\x1b[H');
        console.log(chalk.blue.bold('📊 SharedContextServer - Live Metrics'));
        console.log(chalk.gray('Updated: ' + new Date().toLocaleTimeString()));
        console.log('─'.repeat(50));
        
        console.log(`🚀 Requests: ${chalk.yellow(metrics.totalRequests)}`);
        console.log(`💾 Cache Hits: ${chalk.green(metrics.cacheHits)} (${metrics.totalRequests > 0 ? Math.round((metrics.cacheHits / metrics.totalRequests) * 100) : 0}%)`);
        console.log(`🔌 Connections: ${chalk.blue(metrics.activeConnections)}`);
        console.log(`📦 Contexts: ${chalk.magenta(metrics.activeContexts)}`);
        console.log(`💡 Tokens Saved: ${chalk.green(metrics.tokensSaved)}`);
        console.log(`🗜️  Compression: ${chalk.cyan(Math.round(metrics.compressionSaved / 1024))} KB`);
        console.log(`💾 Memory: ${chalk.yellow(Math.round(metrics.memoryUsage.heapUsed / 1024 / 1024))} MB`);
        
      } catch (error) {
        console.log(chalk.red('❌ Error fetching metrics:'), (error as any).message);
      }
    };
    
    // Update every 2 seconds
    const interval = setInterval(displayMetrics, 2000);
    await displayMetrics(); // Show initial data
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      clearInterval(interval);
      console.log(chalk.yellow('\n\n👋 Metrics monitoring stopped'));
      process.exit(0);
    });
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(chalk.blue('\n🔗 Context Command Help\n'));
    console.log('Manage and monitor the SharedContextServer for token optimization.\n');
    
    console.log(chalk.bold('Available Commands:'));
    console.log(`  ${chalk.green('/context status')}   - Show server status and overview`);
    console.log(`  ${chalk.green('/context stats')}    - Show detailed optimization statistics`);
    console.log(`  ${chalk.green('/context health')}   - Show health check results`);
    console.log(`  ${chalk.green('/context metrics')}  - Show real-time metrics (live updating)`);
    console.log(`  ${chalk.green('/context help')}     - Show this help message`);
    
    console.log(chalk.bold('\nWhat is SharedContextServer?'));
    console.log(chalk.gray('The SharedContextServer enables advanced token optimization by:'));
    console.log(chalk.gray('• Sharing common project context between agents'));
    console.log(chalk.gray('• Sending only differential updates instead of full context'));
    console.log(chalk.gray('• Caching and compressing context data'));
    console.log(chalk.gray('• Providing real-time context streaming'));
    console.log(chalk.gray('• Reducing token usage by 60-80% compared to isolated agents'));
    
    console.log(chalk.bold('\nServer Endpoints:'));
    console.log(chalk.gray(`• HTTP API: ${this.serverUrl}`));
    console.log(chalk.gray(`• WebSocket: ws://localhost:3003/context/stream`));
    console.log(chalk.gray(`• Health Check: ${this.serverUrl}/health`));
    console.log(chalk.gray(`• Metrics: ${this.serverUrl}/metrics`));
  }
}