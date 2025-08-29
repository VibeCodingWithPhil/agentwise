/**
 * Production Optimization System Example
 * Demonstrates how to integrate and use the production-grade optimization system
 */

import ProductionOptimizationSystem from '../src/optimization/ProductionOptimizationSystem';

async function main() {
  console.log('🚀 Production Optimization System Example\n');

  try {
    // Initialize the optimization system
    console.log('1. Initializing production optimization system...');
    const optimizationSystem = await ProductionOptimizationSystem.create({
      environment: 'development', // Use development for example
      projectId: 'example-project',
      enableSharedContext: false, // Disable for simplicity
      configFile: './config/optimization.development.json'
    });

    console.log('✅ System initialized successfully\n');

    // Check initial system status
    console.log('2. Checking system status...');
    const initialStatus = optimizationSystem.getStatus();
    console.log(`   Environment: ${initialStatus.environment}`);
    console.log(`   Components active: ${initialStatus.componentsCount || 'N/A'}`);
    console.log(`   Overall score: ${initialStatus.overallScore?.toFixed(1) || 'N/A'}\n`);

    // Example: Optimize context for a frontend agent
    console.log('3. Optimizing context for frontend agent...');
    const sampleContext = {
      projectStructure: {
        'src/': ['components/', 'pages/', 'utils/'],
        'public/': ['index.html', 'favicon.ico']
      },
      currentTask: 'Create responsive navigation component',
      uiRequirements: {
        framework: 'React',
        styling: 'Tailwind CSS',
        responsiveness: true
      },
      recentChanges: ['Added dark mode toggle', 'Updated color scheme'],
      dependencies: ['react', 'react-dom', 'tailwindcss'],
      // Large dummy data to test optimization
      largeData: Array(1000).fill('sample data').join(' ')
    };

    const optimizedContext = await optimizationSystem.optimizeAgentContext(
      'frontend-specialist',
      sampleContext,
      { 
        maxSize: 10 * 1024 * 1024, // 10MB limit
        prioritizeRecent: true 
      }
    );

    console.log(`   Original context size: ${JSON.stringify(sampleContext).length} bytes`);
    console.log(`   Optimized context type: ${optimizedContext.type || 'N/A'}`);
    console.log(`   Tokens saved: ${optimizedContext.tokensSaved || 0}\n`);

    // Example: Test caching
    console.log('4. Testing cache functionality...');
    const cacheQuery = 'How to create a responsive navigation component in React?';
    const cacheResponse = {
      answer: 'Use flexbox with Tailwind CSS classes...',
      code: '<nav className="flex items-center justify-between p-4">...</nav>',
      timestamp: new Date()
    };

    // Cache the response
    await optimizationSystem.cacheResponse(cacheQuery, cacheResponse, 3600); // 1 hour TTL
    console.log('   ✅ Response cached');

    // Try to retrieve from cache
    const cachedResult = await optimizationSystem.getCachedResponse(cacheQuery);
    if (cachedResult) {
      console.log('   ✅ Cache hit! Retrieved cached response');
    } else {
      console.log('   ❌ Cache miss');
    }
    console.log('');

    // Example: Check agent throttling
    console.log('5. Checking agent throttling...');
    const agentsToCheck = ['frontend-specialist', 'backend-specialist', 'database-specialist'];
    
    for (const agentId of agentsToCheck) {
      const shouldThrottle = optimizationSystem.shouldThrottleAgent(agentId);
      const recommendedSize = optimizationSystem.getRecommendedContextSize(agentId, 50 * 1024 * 1024);
      
      console.log(`   ${agentId}:`);
      console.log(`     Throttled: ${shouldThrottle ? '🟡 Yes' : '🟢 No'}`);
      console.log(`     Recommended context size: ${(recommendedSize / 1024 / 1024).toFixed(1)}MB`);
    }
    console.log('');

    // Example: System health monitoring
    console.log('6. Monitoring system health...');
    const healthStatus = optimizationSystem.getHealthStatus();
    console.log(`   Overall health: ${getHealthIcon(healthStatus.overall)} ${healthStatus.overall}`);
    console.log(`   Health score: ${healthStatus.score?.toFixed(1) || 'N/A'}/100`);
    
    if (healthStatus.recommendations?.length > 0) {
      console.log('   Recommendations:');
      healthStatus.recommendations.slice(0, 3).forEach((rec: string) => {
        console.log(`     • ${rec}`);
      });
    }
    console.log('');

    // Example: Performance maintenance
    console.log('7. Performing system maintenance...');
    await optimizationSystem.performMaintenance();
    console.log('   ✅ Maintenance completed\n');

    // Example: Generate system report
    console.log('8. Generating system report...');
    const reportPath = await optimizationSystem.generateSystemReport();
    console.log(`   📊 Report saved to: ${reportPath}\n`);

    // Final status check
    console.log('9. Final system status...');
    const finalStatus = optimizationSystem.getStatus();
    const finalHealth = optimizationSystem.getHealthStatus();
    
    console.log(`   System uptime: ${finalStatus.uptime?.toFixed(0) || 'N/A'} seconds`);
    console.log(`   Health score: ${finalHealth.score?.toFixed(1) || 'N/A'}/100`);
    console.log(`   Production ready: ${optimizationSystem.isProductionReady() ? '✅ Yes' : '❌ No'}\n`);

    // Simulate some load for demonstration
    console.log('10. Simulating workload...');
    await simulateWorkload(optimizationSystem);

    console.log('🎉 Example completed successfully!');
    console.log('\n📝 Key takeaways:');
    console.log('   • The system automatically optimizes context based on agent specialization');
    console.log('   • Multi-layer caching provides significant performance improvements');  
    console.log('   • Memory management prevents resource exhaustion');
    console.log('   • Real-time monitoring ensures system health');
    console.log('   • Auto-tuning adapts to workload patterns\n');

    // Graceful shutdown
    await optimizationSystem.shutdown();
    console.log('✅ System shutdown completed');

  } catch (error) {
    console.error('❌ Error running example:', error);
    process.exit(1);
  }
}

/**
 * Simulate workload to demonstrate optimization features
 */
async function simulateWorkload(system: ProductionOptimizationSystem) {
  const agents = ['frontend-specialist', 'backend-specialist', 'database-specialist'];
  const tasks = [
    'Create user authentication',
    'Design responsive layout',
    'Implement API endpoints',
    'Optimize database queries',
    'Add error handling'
  ];

  console.log('   Simulating concurrent agent requests...');

  const promises = agents.map(async (agentId, index) => {
    const context = {
      agentId,
      task: tasks[index % tasks.length],
      timestamp: new Date(),
      // Variable data size to test memory management
      data: Array(Math.floor(Math.random() * 500) + 100).fill(`data-${agentId}`).join(' ')
    };

    return system.optimizeAgentContext(agentId, context);
  });

  await Promise.all(promises);
  console.log(`   ✅ Processed ${promises.length} concurrent requests`);

  // Check system status after load
  const loadHealth = system.getHealthStatus();
  console.log(`   Health after load: ${getHealthIcon(loadHealth.overall)} ${loadHealth.overall} (${loadHealth.score?.toFixed(1) || 'N/A'}/100)`);
}

/**
 * Get health status icon
 */
function getHealthIcon(status: string): string {
  switch (status) {
    case 'healthy': return '🟢';
    case 'warning': return '🟡';
    case 'critical': return '🔴';
    default: return '⚪';
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export default main;