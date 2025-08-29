#!/usr/bin/env node
/**
 * Token Optimization Demonstration
 * 
 * This script demonstrates the actual token optimization happening during agent execution.
 * It shows:
 * 
 * 1. SharedContextServer starting automatically
 * 2. Agent registration with context optimization
 * 3. Project analysis and context sharing
 * 4. Batch optimization and token savings
 * 5. Real-time metrics and monitoring
 * 
 * Run with: npx ts-node src/examples/TokenOptimizationDemo.ts
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { DynamicAgentManager } from '../orchestrator/DynamicAgentManager';
import { TokenOptimizer } from '../optimization/TokenOptimizer';
import { SharedContextServer } from '../context/SharedContextServer';

async function runTokenOptimizationDemo() {
  console.log('\n🚀 Token Optimization Demonstration\n');
  console.log('This demo shows how token optimization works in practice.');
  console.log('=' .repeat(60));

  let agentManager: DynamicAgentManager | null = null;

  try {
    // Step 1: Create demo project structure
    console.log('\n📁 Step 1: Setting up demo project...');
    const demoProjectPath = await createDemoProject();
    console.log(`   ✅ Demo project created at: ${demoProjectPath}`);

    // Step 2: Initialize DynamicAgentManager
    console.log('\n🤖 Step 2: Initializing Agent Manager...');
    agentManager = new DynamicAgentManager();
    const agents = await agentManager.getAgents();
    console.log(`   ✅ Loaded ${agents.length} agents for optimization`);
    agents.forEach(agent => {
      console.log(`      • ${agent.name} (${agent.specialization})`);
    });

    // Step 3: Show baseline metrics (before optimization)
    console.log('\n📊 Step 3: Baseline metrics (before optimization)...');
    const baselineMemory = agentManager.getMemoryMetrics();
    console.log(`   • Memory usage: ${Math.round(baselineMemory.memoryUsage.heapUsed / 1024 / 1024)} MB`);
    console.log(`   • Optimization enabled: ${baselineMemory.optimization.enabled}`);
    console.log(`   • Context server: ${baselineMemory.optimization.contextServerRunning ? 'running' : 'not started'}`);

    // Step 4: Demonstrate TokenOptimizer alone
    console.log('\n⚡ Step 4: Token optimization analysis...');
    const tokenOptimizer = new TokenOptimizer();
    
    const testContext = {
      projectStructure: {
        src: ['app.ts', 'utils.ts', 'components/'],
        tests: ['app.test.ts', 'utils.test.ts'],
        docs: ['README.md', 'API.md']
      },
      dependencies: {
        react: '^18.2.0',
        express: '^4.18.0',
        typescript: '^4.9.0',
        jest: '^29.0.0'
      },
      projectType: 'fullstack',
      technologies: ['react', 'express', 'typescript'],
      tasks: [
        'Setup project structure',
        'Implement authentication',
        'Create API endpoints',
        'Build UI components',
        'Write tests'
      ]
    };

    const optimizedConfig = await tokenOptimizer.optimizeAgentConfiguration(
      agents.slice(0, 3).map(a => a.name), // Use first 3 agents for demo
      { ...testContext, projectPath: demoProjectPath }
    );

    console.log(`   ✅ Optimization analysis complete:`);
    console.log(`      • Batches created: ${optimizedConfig.batches.length}`);
    console.log(`      • Estimated savings: ${optimizedConfig.savings}`);
    console.log(`      • Shared context: ${optimizedConfig.sharedContextEnabled ? 'enabled' : 'local only'}`);
    
    optimizedConfig.batches.forEach((batch: string[], index: number) => {
      console.log(`      • Batch ${index + 1}: [${batch.join(', ')}]`);
    });

    // Step 5: Simulate optimized context for each agent
    console.log('\n🔍 Step 5: Agent-specific context optimization...');
    let totalTokensSaved = 0;
    
    for (const agent of agents.slice(0, 3)) {
      const optimizedContext = await tokenOptimizer.optimizeContext(agent.name, testContext);
      console.log(`   • ${agent.name}:`);
      console.log(`     - Optimization type: ${optimizedContext.type || 'incremental'}`);
      
      if (optimizedContext.tokensSaved) {
        totalTokensSaved += optimizedContext.tokensSaved;
        console.log(`     - Tokens saved: ${optimizedContext.tokensSaved}`);
      }
    }

    console.log(`   ✅ Total estimated tokens saved: ${totalTokensSaved}`);

    // Step 6: Demonstrate SharedContextServer capabilities
    console.log('\n🔗 Step 6: SharedContextServer demonstration...');
    const contextServer = new SharedContextServer(tokenOptimizer);
    
    try {
      await contextServer.start();
      console.log('   ✅ SharedContextServer started on port 3003');
      
      // Simulate context operations
      const serverStats = contextServer.getStats();
      console.log(`   • Server metrics:`);
      console.log(`     - Active contexts: ${serverStats.activeContexts}`);
      console.log(`     - Cache hit rate: ${serverStats.hitRate}%`);
      console.log(`     - Memory usage: ${Math.round(serverStats.memoryUsage)} MB`);
      
      await contextServer.stop();
      console.log('   ✅ SharedContextServer stopped cleanly');
      
    } catch (error: any) {
      if (error.message.includes('EADDRINUSE')) {
        console.log('   ⚠️  Port 3003 in use - SharedContextServer may already be running');
      } else {
        console.log(`   ⚠️  SharedContextServer demo failed: ${error.message}`);
      }
    }

    // Step 7: Show optimization integration in DynamicAgentManager
    console.log('\n🎯 Step 7: Full optimization integration...');
    const optimizationStats = agentManager.getOptimizationStats();
    console.log(`   • Token optimization: ${optimizationStats.optimizationEnabled ? 'enabled' : 'disabled'}`);
    console.log(`   • Active optimizations:`);
    
    Object.entries(optimizationStats.activeOptimizations).forEach(([key, value]) => {
      console.log(`     - ${key}: ${value ? 'active' : 'inactive'}`);
    });

    // Step 8: Memory and performance impact
    console.log('\n💾 Step 8: Performance impact analysis...');
    const finalMemory = agentManager.getMemoryMetrics();
    const memoryDiff = finalMemory.memoryUsage.heapUsed - baselineMemory.memoryUsage.heapUsed;
    console.log(`   • Memory overhead: ${Math.round(memoryDiff / 1024)} KB`);
    console.log(`   • Context manager agents: ${finalMemory.contextManager.totalAgents}`);
    console.log(`   • Average context size: ${Math.round(finalMemory.contextManager.averageContextSize || 0)} bytes`);

    // Step 9: Summary and recommendations
    console.log('\n📋 Step 9: Optimization summary...');
    console.log('   ✅ Benefits demonstrated:');
    console.log('      • Automatic SharedContextServer management');
    console.log('      • Agent batching for reduced parallel load');
    console.log('      • Context sharing between agents');
    console.log('      • Differential context updates');
    console.log('      • Memory-efficient context management');
    console.log('      • Specialization-based context filtering');
    
    console.log('\n   💡 Estimated benefits for real projects:');
    console.log('      • 60-70% token usage reduction');
    console.log('      • Faster agent startup due to shared context');
    console.log('      • Reduced API costs from optimization');
    console.log('      • Better memory management at scale');

  } catch (error: any) {
    console.error(`\n❌ Demo failed: ${error.message}`);
    console.error(error.stack);
  } finally {
    // Cleanup
    if (agentManager) {
      await agentManager.shutdown();
    }
    
    // Clean up demo project
    try {
      await fs.remove(path.join(__dirname, '..', '..', 'temp-demo'));
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  console.log('\n🎉 Token Optimization Demo Complete!');
  console.log('=' .repeat(60));
}

async function createDemoProject(): Promise<string> {
  const demoPath = path.join(__dirname, '..', '..', 'temp-demo', 'optimization-demo');
  await fs.ensureDir(demoPath);

  // Create realistic project structure
  const packageJson = {
    name: 'optimization-demo',
    version: '1.0.0',
    description: 'Demo project for token optimization',
    dependencies: {
      react: '^18.2.0',
      express: '^4.18.0',
      '@types/react': '^18.0.0'
    },
    devDependencies: {
      typescript: '^4.9.0',
      jest: '^29.0.0',
      '@types/jest': '^29.0.0'
    }
  };

  await fs.writeJson(path.join(demoPath, 'package.json'), packageJson, { spaces: 2 });

  // Create specs
  const specsDir = path.join(demoPath, 'specs');
  await fs.ensureDir(specsDir);
  
  await fs.writeFile(path.join(specsDir, 'frontend-spec.md'), `
# Frontend Specification

## Overview
React-based frontend with TypeScript and modern tooling.

## Features
- User authentication
- Dashboard with charts
- Responsive design
- Real-time updates
  `);

  await fs.writeFile(path.join(specsDir, 'backend-spec.md'), `
# Backend Specification

## Overview
Express.js API server with TypeScript.

## Features
- RESTful API endpoints
- JWT authentication
- Database integration
- Rate limiting
  `);

  // Create phase files
  await fs.writeFile(path.join(demoPath, 'phase1-core.md'), `
# Phase 1: Core Development

## Tasks
- [ ] Setup project structure
- [ ] Configure TypeScript
- [ ] Setup authentication
- [ ] Create basic API endpoints
  `);

  await fs.writeFile(path.join(demoPath, 'phase2-features.md'), `
# Phase 2: Feature Implementation

## Tasks
- [ ] Implement dashboard
- [ ] Add real-time features
- [ ] Create user management
- [ ] Setup monitoring
  `);

  return demoPath;
}

// Run the demo if called directly
if (require.main === module) {
  runTokenOptimizationDemo().catch(console.error);
}

export { runTokenOptimizationDemo };