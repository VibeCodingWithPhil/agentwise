/**
 * Agent Claim Verification System - Usage Examples
 * Demonstrates how to integrate the verification system with Agentwise
 */

import { AgentClaimVerificationIntegration, getVerificationIntegration } from './integration';
import { PerformanceAnalytics } from '../analytics/PerformanceAnalytics';
import { TokenOptimizer } from '../optimization/TokenOptimizer';
import { ValidationConfig } from './types';

// Example 1: Basic Setup and Integration
export async function basicSetupExample(): Promise<void> {
  console.log('🚀 Starting Agent Claim Verification System');
  
  // Initialize with production-ready configuration
  const config: Partial<ValidationConfig> = {
    enabled: true,
    strictMode: false,
    tolerances: {
      performance: 15, // Allow 15% deviation for performance claims
      coverage: 5,     // Allow 5% deviation for test coverage
      size: 20         // Allow 20% deviation for size claims
    },
    notifications: {
      onClaimDebunked: true,
      onSystemIssue: true,
      onTrustScoreChanged: true
    }
  };

  const verification = new AgentClaimVerificationIntegration(
    process.cwd(),
    config
  );

  // Simulate agent responses
  await simulateAgentInteractions(verification);
  
  // Generate and display report
  const report = await verification.generateSystemReport();
  console.log('📊 System Report Generated:', {
    totalClaims: report.summary.totalClaims,
    accuracy: report.summary.overallAccuracy.toFixed(2) + '%',
    systemHealth: report.summary.systemHealth,
    riskLevel: report.summary.riskLevel
  });

  await verification.shutdown();
}

// Example 2: Integration with Existing Components
export async function integratedSetupExample(): Promise<void> {
  console.log('🔧 Setting up integrated verification system');

  // Initialize existing Agentwise components
  const performanceAnalytics = new PerformanceAnalytics();
  const tokenOptimizer = new TokenOptimizer();

  // Create integrated verification system
  const verification = new AgentClaimVerificationIntegration(
    process.cwd(),
    {
      enabled: true,
      strictMode: false,
      retryPolicy: {
        maxRetries: 3,
        backoffMultiplier: 2,
        initialDelay: 2000
      }
    },
    performanceAnalytics,
    tokenOptimizer
  );

  // Simulate realistic agent scenarios
  await simulateComplexScenarios(verification);
  
  // Show integration benefits
  const analytics = performanceAnalytics.getRealtimeSnapshot();
  const optimizationReport = tokenOptimizer.getOptimizationReport();
  
  console.log('🔗 Integration Results:');
  console.log('  Analytics metrics recorded:', Object.keys(analytics.metrics).length);
  console.log('  Token optimization active:', optimizationReport.totalTokensUsed > 0);

  await verification.cleanup();
  await performanceAnalytics.cleanup();
}

// Example 3: Agent Orchestration Integration
export async function agentOrchestrationExample(): Promise<void> {
  console.log('🤖 Demonstrating agent orchestration integration');

  const verification = getVerificationIntegration(
    process.cwd(),
    { enabled: true, strictMode: false }
  );

  // Simulate agent orchestration workflow
  const agents = [
    { id: 'frontend-specialist', name: 'Frontend Specialist' },
    { id: 'backend-specialist', name: 'Backend Specialist' },
    { id: 'testing-specialist', name: 'Testing Specialist' },
    { id: 'performance-specialist', name: 'Performance Specialist' }
  ];

  const projectContext = {
    projectId: 'example-project',
    files: ['src/components/Dashboard.tsx', 'src/api/users.ts', 'src/tests/', 'src/utils/optimizer.ts'],
    dependencies: ['react', 'express', 'jest', 'typescript']
  };

  // Simulate each agent completing their tasks
  for (const agent of agents) {
    await simulateAgentExecution(verification, agent, projectContext);
    
    // Check agent performance after each interaction
    const performance = verification.getAgentPerformanceReport(agent.id);
    console.log(`  ${agent.name} Trust Score: ${performance.trustScore?.overallScore?.toFixed(1) || 'N/A'}`);
  }

  // Generate final orchestration report
  const dashboardData = verification.getDashboardData();
  console.log('🎯 Orchestration Results:');
  console.log('  Total verified claims:', dashboardData.metrics.verifiedClaims);
  console.log('  System accuracy:', dashboardData.metrics.overallAccuracy.toFixed(1) + '%');
  console.log('  Trust distribution:', dashboardData.trustScoreDistribution);
}

// Example 4: Real-time Monitoring and Alerting
export async function monitoringExample(): Promise<void> {
  console.log('📊 Setting up real-time monitoring');

  const verification = new AgentClaimVerificationIntegration(
    process.cwd(),
    {
      enabled: true,
      notifications: {
        onClaimDebunked: true,
        onSystemIssue: true,
        onTrustScoreChanged: true
      }
    }
  );

  // Setup event listeners for monitoring
  setupMonitoringListeners(verification);

  // Simulate various scenarios that trigger different alerts
  await simulateMonitoringScenarios(verification);

  // Display monitoring dashboard
  const dashboardData = verification.getDashboardData();
  displayMonitoringDashboard(dashboardData);

  await verification.shutdown();
}

// Example 5: Claim Validation Scenarios
export async function validationScenariosExample(): Promise<void> {
  console.log('🧪 Testing claim validation scenarios');

  const verification = new AgentClaimVerificationIntegration(
    process.cwd(),
    { enabled: true, strictMode: true } // Strict mode for detailed validation
  );

  // Scenario 1: Valid performance claim
  console.log('\n📈 Scenario 1: Valid Performance Claim');
  await verification.interceptAgentResponse(
    'perf-agent-1',
    'Performance Agent',
    'I optimized the token usage and achieved a 35% reduction in processing time. Memory usage decreased by 20%.',
    { files: ['src/optimizer.ts'], projectId: 'test-project' }
  );

  // Scenario 2: Exaggerated claim
  console.log('\n⚠️  Scenario 2: Exaggerated Claim');
  await verification.interceptAgentResponse(
    'exag-agent-1',
    'Exaggerated Agent',
    'Achieved 100% performance improvement with perfect optimization and infinite speed boost!',
    { files: ['src/fake-optimizer.ts'], projectId: 'test-project' }
  );

  // Scenario 3: Feature completion claim
  console.log('\n✅ Scenario 3: Feature Completion Claim');
  await verification.interceptAgentResponse(
    'feature-agent-1',
    'Feature Agent',
    'Successfully implemented the user authentication system with JWT tokens and password hashing.',
    { files: ['src/auth/jwt.ts', 'src/auth/password.ts'], projectId: 'test-project' }
  );

  // Scenario 4: Bug fix claim
  console.log('\n🐛 Scenario 4: Bug Fix Claim');
  await verification.interceptAgentResponse(
    'bug-agent-1',
    'Bug Fix Agent',
    'Fixed 3 critical security vulnerabilities and resolved all memory leaks in the payment processing module.',
    { files: ['src/payment/security.ts', 'src/payment/processor.ts'], projectId: 'test-project' }
  );

  // Wait for validations to complete
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Show validation results
  const report = await verification.generateSystemReport();
  console.log('\n📋 Validation Results:');
  console.log(`  Total claims processed: ${report.summary.totalClaims}`);
  console.log(`  Claims verified: ${report.summary.verifiedClaims}`);
  console.log(`  Claims debunked: ${report.summary.debunkedClaims}`);
  console.log(`  Overall accuracy: ${report.summary.overallAccuracy.toFixed(1)}%`);

  await verification.shutdown();
}

// Helper Functions

async function simulateAgentInteractions(verification: AgentClaimVerificationIntegration): Promise<void> {
  const interactions = [
    {
      agent: { id: 'agent-1', name: 'Code Optimizer' },
      response: 'Optimized codebase and reduced bundle size by 25%. Token usage improved by 40%.',
      context: { files: ['src/optimizer.ts'], projectId: 'demo-project' }
    },
    {
      agent: { id: 'agent-2', name: 'Bug Hunter' },
      response: 'Fixed 4 critical bugs in the authentication module. All security tests now pass.',
      context: { files: ['src/auth.ts'], projectId: 'demo-project' }
    },
    {
      agent: { id: 'agent-3', name: 'Test Master' },
      response: 'Increased test coverage to 92% with 15 new unit tests and 5 integration tests.',
      context: { files: ['src/tests/'], projectId: 'demo-project' }
    }
  ];

  for (const interaction of interactions) {
    await verification.interceptAgentResponse(
      interaction.agent.id,
      interaction.agent.name,
      interaction.response,
      interaction.context
    );
    
    // Small delay between interactions
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

async function simulateComplexScenarios(verification: AgentClaimVerificationIntegration): Promise<void> {
  // Simulate a complex development scenario with multiple agents
  const scenarios = [
    {
      phase: 'Setup',
      agent: 'setup-specialist',
      response: 'Project initialized with TypeScript configuration. All dependencies installed and configured.',
      files: ['tsconfig.json', 'package.json']
    },
    {
      phase: 'Development',
      agent: 'fullstack-developer',
      response: 'Implemented user management API with CRUD operations. Database schema optimized for 50% faster queries.',
      files: ['src/api/users.ts', 'src/models/user.ts']
    },
    {
      phase: 'Testing',
      agent: 'qa-specialist',
      response: 'Created comprehensive test suite with 95% code coverage. Found and documented 2 edge cases.',
      files: ['src/tests/users.test.ts', 'src/tests/integration.test.ts']
    },
    {
      phase: 'Performance',
      agent: 'performance-engineer',
      response: 'Optimized API endpoints reducing response time by 60%. Implemented caching layer saving 1000+ tokens per request.',
      files: ['src/middleware/cache.ts', 'src/utils/performance.ts']
    },
    {
      phase: 'Security',
      agent: 'security-auditor',
      response: 'Conducted security audit and fixed 3 vulnerabilities. Implemented rate limiting and input validation.',
      files: ['src/middleware/security.ts', 'src/validators/input.ts']
    }
  ];

  for (const scenario of scenarios) {
    console.log(`  📍 ${scenario.phase} Phase - ${scenario.agent}`);
    
    await verification.interceptAgentResponse(
      scenario.agent,
      scenario.agent.replace('-', ' '),
      scenario.response,
      {
        projectId: 'complex-project',
        phase: scenarios.indexOf(scenario) + 1,
        files: scenario.files
      }
    );
    
    await new Promise(resolve => setTimeout(resolve, 800));
  }
}

async function simulateAgentExecution(
  verification: AgentClaimVerificationIntegration,
  agent: { id: string; name: string },
  context: any
): Promise<void> {
  const agentResponses: Record<string, string> = {
    'frontend-specialist': 'Implemented responsive dashboard with 15% faster load times. Added 8 new React components with full accessibility support.',
    'backend-specialist': 'Created RESTful API with 99.9% uptime. Database queries optimized for 40% better performance.',
    'testing-specialist': 'Achieved 88% test coverage with 25 new tests. All critical paths covered with integration tests.',
    'performance-specialist': 'Reduced overall system latency by 45%. Memory usage optimized by 30% through efficient algorithms.'
  };

  const response = agentResponses[agent.id] || 'Task completed successfully with improvements.';
  
  await verification.interceptAgentResponse(
    agent.id,
    agent.name,
    response,
    context
  );
}

function setupMonitoringListeners(verification: AgentClaimVerificationIntegration): void {
  const verificationSystem = verification.getVerificationSystem();

  verificationSystem.on('claim-verified', (claim) => {
    console.log(`✅ [MONITOR] Claim verified: ${claim.agentName} - ${claim.description.substring(0, 50)}...`);
  });

  verificationSystem.on('claim-debunked', (claim, discrepancies) => {
    console.log(`❌ [MONITOR] Claim debunked: ${claim.agentName} - ${discrepancies.length} issues found`);
    if (discrepancies.some((d: any) => d.severity === 'critical')) {
      console.log(`🚨 [ALERT] Critical discrepancy detected for agent ${claim.agentName}`);
    }
  });

  verificationSystem.on('trust-score-updated', (agentId, oldScore, newScore) => {
    const change = newScore - oldScore;
    const emoji = change > 0 ? '📈' : '📉';
    console.log(`${emoji} [MONITOR] Trust score updated for ${agentId}: ${oldScore.toFixed(1)} → ${newScore.toFixed(1)}`);
    
    if (newScore < 60) {
      console.log(`⚠️  [ALERT] Low trust score detected for agent ${agentId}: ${newScore.toFixed(1)}`);
    }
  });

  verificationSystem.on('system-issue-detected', (issue) => {
    console.log(`🔧 [MONITOR] System issue: ${issue.type} - ${issue.description}`);
    if (issue.severity === 'critical') {
      console.log(`🚨 [CRITICAL ALERT] ${issue.description}`);
    }
  });
}

async function simulateMonitoringScenarios(verification: AgentClaimVerificationIntegration): Promise<void> {
  // Scenario that should trigger trust score alert
  await verification.interceptAgentResponse(
    'unreliable-agent',
    'Unreliable Agent',
    'Achieved impossible 200% performance improvement with magical optimizations!',
    { projectId: 'monitoring-test' }
  );

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Scenario that should pass verification
  await verification.interceptAgentResponse(
    'reliable-agent',
    'Reliable Agent',
    'Implemented feature with standard practices. Code reviewed and tested.',
    { files: ['src/feature.ts'], projectId: 'monitoring-test' }
  );

  await new Promise(resolve => setTimeout(resolve, 1000));

  // Scenario with missing files (should trigger system issue)
  await verification.interceptAgentResponse(
    'confused-agent',
    'Confused Agent',
    'Updated configuration in non-existent files.',
    { files: ['config/missing.json'], projectId: 'monitoring-test' }
  );

  await new Promise(resolve => setTimeout(resolve, 2000));
}

function displayMonitoringDashboard(data: any): void {
  console.log('\n📊 MONITORING DASHBOARD');
  console.log('═══════════════════════');
  
  console.log('\n📈 System Metrics:');
  console.log(`  Total Claims: ${data.metrics.totalClaims}`);
  console.log(`  Verified: ${data.metrics.verifiedClaims}`);
  console.log(`  Debunked: ${data.metrics.debunkedClaims}`);
  console.log(`  Accuracy: ${data.metrics.overallAccuracy.toFixed(1)}%`);
  
  console.log('\n🎯 Trust Score Distribution:');
  console.log(`  Excellent (90-100): ${data.trustScoreDistribution.excellent}`);
  console.log(`  Good (75-89): ${data.trustScoreDistribution.good}`);
  console.log(`  Fair (60-74): ${data.trustScoreDistribution.fair}`);
  console.log(`  Poor (<60): ${data.trustScoreDistribution.poor}`);
  
  console.log('\n⚠️  System Issues:');
  console.log(`  Critical: ${data.issueStats.critical}`);
  console.log(`  High: ${data.issueStats.high}`);
  console.log(`  Medium: ${data.issueStats.medium}`);
  console.log(`  Low: ${data.issueStats.low}`);
  
  console.log('\n💡 Recommendations:');
  data.recommendations.forEach((rec: string, index: number) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
  
  console.log('\n🕒 Recent Activity:');
  data.recentClaims.slice(0, 5).forEach((claim: any) => {
    const status = claim.status === 'verified' ? '✅' : claim.status === 'debunked' ? '❌' : '⏳';
    console.log(`  ${status} ${claim.agent}: ${claim.type} (${claim.confidence}% confidence)`);
  });
}

// Main execution function for testing all examples
export async function runAllExamples(): Promise<void> {
  console.log('🚀 Running Agent Claim Verification System Examples\n');
  
  try {
    await basicSetupExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await integratedSetupExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await agentOrchestrationExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await monitoringExample();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await validationScenariosExample();
    
    console.log('\n✅ All examples completed successfully!');
    console.log('\n📚 The Agent Claim Verification System is now ready for production use.');
    console.log('   • Automatic claim detection and validation');
    console.log('   • Trust score management with penalties and badges');
    console.log('   • Real-time monitoring and alerting');
    console.log('   • Comprehensive reporting and analytics');
    console.log('   • Integration with existing Agentwise components');
    
  } catch (error) {
    console.error('❌ Error running examples:', error);
    process.exit(1);
  }
}

// Functions are already exported individually above

// Run all examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}