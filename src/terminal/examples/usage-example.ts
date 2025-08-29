import { TerminalIntegration, TerminalMonitor, OutputParser, AutoContinuation } from '../index';

/**
 * Example: Basic terminal monitoring setup
 */
export async function basicMonitoringExample(): Promise<void> {
  console.log('🚀 Starting basic terminal monitoring example');
  
  const integration = new TerminalIntegration({
    enableAutoPermissions: true,
    enableAutoInput: true,
    safetyMode: true,
    maxConcurrentSessions: 2
  });

  try {
    // Start monitoring a Claude Code session
    const sessionId = await integration.startClaudeCodeSession([
      '/create', 'Modern React dashboard with authentication'
    ]);

    console.log(`✅ Started monitoring session: ${sessionId}`);

    // Set up event listeners
    integration.on('session_continuation', (event) => {
      console.log(`🤖 Auto-continued: ${event.response} for "${event.prompt}"`);
    });

    integration.on('session_state_change', (event) => {
      console.log(`📊 State change: ${event.oldState} → ${event.newState}`);
    });

    // Wait for completion or timeout
    setTimeout(() => {
      console.log('⏰ Example timeout reached');
      integration.stopAllSessions();
    }, 300000); // 5 minutes

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example: Advanced terminal monitoring with custom patterns
 */
export async function advancedMonitoringExample(): Promise<void> {
  console.log('🚀 Starting advanced terminal monitoring example');

  // Create custom output parser with additional patterns
  const outputParser = new OutputParser();
  outputParser.addCustomPattern({
    pattern: /Agentwise requires (?:confirmation|approval) for/i,
    state: 'waiting_permission' as any,
    actionType: 'continue',
    confidence: 0.95
  });

  // Create custom auto-continuation with templates
  const autoContinuation = new AutoContinuation({
    enableAutoPermissions: true,
    enableAutoInput: true,
    safetyMode: false, // Disable for demo - be careful in production
    defaultPermissionResponse: 'yes',
    maxAutoResponses: 100
  });

  // Add custom response template
  autoContinuation.addResponseTemplate({
    pattern: /Would you like to install additional packages\?/i,
    response: 'y\n',
    confidence: 0.9,
    description: 'Package installation prompt'
  });

  const integration = new TerminalIntegration({
    enableAutoPermissions: true,
    enableAutoInput: true,
    safetyMode: false,
    maxConcurrentSessions: 5
  });

  try {
    // Start multiple sessions
    const sessions = await Promise.all([
      integration.startClaudeCodeSession(['/create', 'Next.js e-commerce site']),
      integration.startClaudeCodeSession(['/task', 'Add payment integration'])
    ]);

    console.log(`✅ Started ${sessions.length} monitoring sessions`);

    // Monitor sessions
    sessions.forEach((sessionId, index) => {
      integration.on('session_output', (event) => {
        if (event.sessionId === sessionId) {
          console.log(`[Session ${index + 1}] ${event.data.trim()}`);
        }
      });
    });

    // Get stats periodically
    const statsInterval = setInterval(async () => {
      const stats = await integration.getAllStats();
      console.log(`📊 Stats: ${stats.activeSessions} active, ${stats.totalSessions} total`);
    }, 30000);

    // Cleanup after timeout
    setTimeout(() => {
      clearInterval(statsInterval);
      integration.stopAllSessions();
      console.log('🏁 Advanced example completed');
    }, 600000); // 10 minutes

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Example: Integration with existing command handler
 */
export async function commandHandlerIntegrationExample(): Promise<void> {
  console.log('🚀 Starting command handler integration example');

  const integration = new TerminalIntegration({
    enableAutoPermissions: true,
    safetyMode: true
  });

  // Simulate command handler usage
  const mockCommandHandler = {
    async handleTerminalMonitor(command: string[]): Promise<any> {
      try {
        console.log(`🖥️ Starting terminal monitoring for: ${command.join(' ')}`);
        
        const sessionId = await integration.startClaudeCodeSession(command);
        
        // Set up comprehensive event handling
        integration.on('session_continuation', (event) => {
          if (event.sessionId === sessionId) {
            console.log(`🤖 [${sessionId}] Auto-response: "${event.response.trim()}"`);
          }
        });

        integration.on('session_error', (event) => {
          if (event.sessionId === sessionId) {
            console.error(`❌ [${sessionId}] Error: ${event.error}`);
          }
        });

        return {
          success: true,
          sessionId,
          message: 'Terminal monitoring started successfully'
        };

      } catch (error) {
        return {
          success: false,
          message: `Failed to start monitoring: ${error instanceof Error ? error.message : String(error)}`
        };
      }
    }
  };

  // Test the handler
  const result = await mockCommandHandler.handleTerminalMonitor([
    '/create-plan', 'AI-powered project management tool'
  ]);

  if (result.success) {
    console.log(`✅ ${result.message}`);
    console.log(`📝 Session ID: ${result.sessionId}`);
  } else {
    console.error(`❌ ${result.message}`);
  }

  // Cleanup
  setTimeout(() => {
    integration.stopAllSessions();
    console.log('🏁 Integration example completed');
  }, 180000); // 3 minutes
}

/**
 * Example: Permission bypass integration
 */
export async function permissionBypassExample(): Promise<void> {
  console.log('🚀 Starting permission bypass example');

  const integration = new TerminalIntegration({
    enableAutoPermissions: true,
    enableAutoInput: true,
    safetyMode: true, // Start with safety mode
    maxAutoResponses: 50
  });

  // Simulate permission bypass system integration
  const permissionBypassConfig = {
    autoApproveFileOperations: true,
    autoApprovePackageInstalls: true,
    autoApproveGitOperations: false, // Keep git operations manual for safety
    dangerousOperationsRequireConfirmation: true
  };

  // Update configuration based on bypass settings
  integration.updateConfig({
    safetyMode: !permissionBypassConfig.autoApproveFileOperations,
    enableAutoPermissions: true,
    enableAutoInput: true
  });

  try {
    const sessionId = await integration.startClaudeCodeSession([
      '/task', 'Add comprehensive testing suite'
    ]);

    console.log(`✅ Started session with permission bypass: ${sessionId}`);

    // Monitor bypass decisions
    integration.on('session_continuation', (event) => {
      if (event.sessionId === sessionId) {
        console.log(`🔓 Permission bypassed: ${event.type} - "${event.response.trim()}"`);
      }
    });

    // Cleanup
    setTimeout(() => {
      integration.stopSession(sessionId);
      console.log('🏁 Permission bypass example completed');
    }, 120000); // 2 minutes

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🎯 Running all terminal monitoring examples\n');

  try {
    await basicMonitoringExample();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause

    await advancedMonitoringExample();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause

    await commandHandlerIntegrationExample();
    await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause

    await permissionBypassExample();

    console.log('\n✅ All examples completed successfully');

  } catch (error) {
    console.error('\n❌ Example failed:', error);
  }
}

// Export for testing
export {
  basicMonitoringExample,
  advancedMonitoringExample,
  commandHandlerIntegrationExample,
  permissionBypassExample,
  runAllExamples
};

// If run directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}