#!/usr/bin/env node

/**
 * Startup script for SharedContextServer
 * 
 * This script initializes and starts the SharedContextServer as part of the Agentwise system.
 * It can be run standalone or integrated into the main system startup.
 */

import { SharedContextServer } from './SharedContextServer';
import { TokenOptimizer } from '../optimization/TokenOptimizer';
import { ContextIntegration } from './ContextIntegration';
import { DynamicAgentManager } from '../orchestrator/DynamicAgentManager';
import { ProjectContextManager } from './ProjectContextManager';
import { WebSocketIntegration } from '../monitoring/WebSocketIntegration';
import { ProgressTracker } from '../monitoring/ProgressTracker';
import * as path from 'path';

async function startContextServer() {
  console.log('🚀 Starting Agentwise SharedContextServer...');

  try {
    // Initialize components
    const tokenOptimizer = new TokenOptimizer();
    const agentManager = new DynamicAgentManager();
    const projectContextManager = new ProjectContextManager();
    
    // Initialize monitoring if available
    let wsIntegration: WebSocketIntegration | undefined;
    try {
      const progressTracker = new ProgressTracker();
      wsIntegration = new WebSocketIntegration(progressTracker);
      console.log('📊 Monitoring integration enabled');
    } catch (error) {
      console.log('⚠️  Monitoring integration not available:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Create context integration system
    const contextIntegration = new ContextIntegration(
      tokenOptimizer,
      agentManager,
      projectContextManager,
      wsIntegration,
      {
        enableServer: true,
        serverPort: 3003,
        enableMonitoringIntegration: !!wsIntegration,
        tokenOptimizationLevel: 'advanced',
        agentCoordinationEnabled: true
      }
    );

    // Setup event handlers
    contextIntegration.on('initialized', () => {
      console.log('✅ SharedContextServer fully initialized');
      console.log('📡 Context sharing enabled for all agents');
      console.log('💡 Token optimization active');
      
      // Show connection info
      console.log('\n🔗 Connection Details:');
      console.log('   HTTP API: http://localhost:3003');
      console.log('   WebSocket: ws://localhost:3003/context/stream');
      console.log('   Health Check: http://localhost:3003/health');
      console.log('   Metrics: http://localhost:3003/metrics');
    });

    contextIntegration.on('error', (error) => {
      console.error('❌ Context integration error:', error);
    });

    contextIntegration.on('agent_connected', ({ projectId, agentId }) => {
      console.log(`🔌 Agent ${agentId} connected to context stream for ${projectId}`);
    });

    contextIntegration.on('optimization_applied', ({ projectId, agentIds, tokensSaved }) => {
      console.log(`💡 Optimization applied to ${projectId}: ${tokensSaved} tokens saved for ${agentIds.length} agents`);
    });

    // Initialize the system
    await contextIntegration.initialize();

    // Setup graceful shutdown
    const shutdown = async () => {
      console.log('\n🛑 Shutting down SharedContextServer...');
      try {
        await contextIntegration.shutdown();
        console.log('✅ Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught exception:', error);
      shutdown();
    });

    // Health monitoring
    setInterval(async () => {
      try {
        const health = await contextIntegration.healthCheck();
        if (health.status !== 'healthy') {
          console.warn(`⚠️  System health: ${health.status}`, health.details);
        }
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, 30000); // Every 30 seconds

    // Performance reporting
    setInterval(async () => {
      try {
        const stats = contextIntegration.getStats();
        if (stats.totalTokensSaved > 0) {
          console.log(`📊 Performance: ${stats.totalTokensSaved} tokens saved, ${stats.contextsShared} contexts shared`);
        }
      } catch (error) {
        console.error('❌ Stats reporting failed:', error);
      }
    }, 300000); // Every 5 minutes

    console.log('\n🎯 SharedContextServer is ready and optimizing token usage!');
    console.log('   Use Ctrl+C to stop the server');

  } catch (error) {
    console.error('💥 Failed to start SharedContextServer:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { startContextServer };

// Run directly if called as a script
if (require.main === module) {
  startContextServer().catch(error => {
    console.error('💥 Startup failed:', error);
    process.exit(1);
  });
}