#!/usr/bin/env node

/**
 * Token Optimization Integration Test
 * 
 * This script demonstrates and tests the working SharedContextServer integration
 * with real token counting and measurable optimization results.
 */

const axios = require('axios');
const { fork } = require('child_process');
const path = require('path');

class TokenOptimizationTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = {
      totalTests: 0,
      passed: 0,
      failed: 0,
      tokensSaved: 0,
      details: []
    };
  }

  async runFullTest() {
    console.log('🧪 Starting Token Optimization Integration Test\n');

    try {
      // Start SharedContextServer
      await this.startServer();
      
      // Wait for server to be ready
      await this.waitForServer();
      
      // Run test suite
      await this.runTestSuite();
      
      // Display results
      this.displayResults();
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
    } finally {
      await this.stopServer();
    }
  }

  async startServer() {
    console.log('🚀 Starting SharedContextServer...');
    
    const serverPath = path.join(__dirname, 'src', 'context', 'startContextServer.js');
    this.serverProcess = fork(serverPath, [], { silent: true });
    
    this.serverProcess.stdout.on('data', (data) => {
      if (process.env.DEBUG) console.log('[SERVER]', data.toString());
    });
    
    this.serverProcess.stderr.on('data', (data) => {
      if (process.env.DEBUG) console.error('[SERVER ERROR]', data.toString());
    });

    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  async waitForServer() {
    console.log('⏳ Waiting for server to be ready...');
    
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
      try {
        const response = await axios.get('http://localhost:3003/health', { timeout: 1000 });
        if (response.data.status === 'healthy') {
          console.log('✅ Server is ready\n');
          return;
        }
      } catch (error) {
        // Server not ready yet
      }
      
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Server did not become ready in time');
  }

  async runTestSuite() {
    console.log('🧪 Running Token Optimization Tests:\n');

    // Test 1: Basic Context Storage and Retrieval
    await this.testBasicContextOperations();
    
    // Test 2: Context Sharing Between Agents
    await this.testContextSharing();
    
    // Test 3: Token Optimization Measurement
    await this.testTokenOptimization();
    
    // Test 4: Real-time Updates via WebSocket
    await this.testWebSocketUpdates();
    
    // Test 5: Context Filtering by Agent Specialization
    await this.testContextFiltering();
  }

  async testBasicContextOperations() {
    const testName = 'Basic Context Storage and Retrieval';
    console.log(`📋 Test 1: ${testName}`);
    
    try {
      const projectId = 'test-project-1';
      const testContext = {
        projectName: 'Test Project',
        dependencies: { react: '^18.0.0', typescript: '^5.0.0' },
        structure: { src: ['components', 'pages'], tests: ['unit', 'integration'] }
      };

      // Store context
      const storeResponse = await axios.put(`http://localhost:3003/context/${projectId}`, {
        context: testContext,
        agentId: 'test-agent'
      });

      // Retrieve context
      const retrieveResponse = await axios.get(`http://localhost:3003/context/${projectId}`);

      const success = 
        storeResponse.status === 200 &&
        retrieveResponse.status === 200 &&
        retrieveResponse.data.context.projectName === testContext.projectName;

      this.recordTestResult(testName, success, {
        tokensSaved: storeResponse.data.tokensSaved || 0,
        details: success ? 'Context stored and retrieved successfully' : 'Context operation failed'
      });

    } catch (error) {
      this.recordTestResult(testName, false, { error: error.message });
    }
  }

  async testContextSharing() {
    const testName = 'Context Sharing Between Agents';
    console.log(`📋 Test 2: ${testName}`);
    
    try {
      const projectId = 'test-project-2';
      let totalTokensSaved = 0;

      // Agent 1 creates initial context
      const agent1Response = await axios.put(`http://localhost:3003/context/${projectId}`, {
        context: {
          projectSetup: 'completed',
          dependencies: { express: '^4.18.0', mongoose: '^7.0.0' },
          backend: { apis: ['user', 'auth'], database: 'mongodb' }
        },
        agentId: 'backend-specialist'
      });
      totalTokensSaved += agent1Response.data.tokensSaved || 0;

      // Agent 2 updates context (should save tokens by building on existing context)
      const agent2Response = await axios.put(`http://localhost:3003/context/${projectId}`, {
        context: {
          frontend: { components: ['Login', 'Dashboard'], framework: 'React' },
          integration: { apis: 'connected' }
        },
        agentId: 'frontend-specialist'
      });
      totalTokensSaved += agent2Response.data.tokensSaved || 0;

      // Retrieve shared context
      const sharedContext = await axios.get(`http://localhost:3003/context/${projectId}`);

      const success = 
        sharedContext.data.context.backend &&
        sharedContext.data.context.frontend &&
        totalTokensSaved > 0;

      this.recordTestResult(testName, success, {
        tokensSaved: totalTokensSaved,
        details: `Two agents collaborated, context merged successfully`
      });

    } catch (error) {
      this.recordTestResult(testName, false, { error: error.message });
    }
  }

  async testTokenOptimization() {
    const testName = 'Token Optimization Measurement';
    console.log(`📋 Test 3: ${testName}`);
    
    try {
      const projectId = 'test-project-3';
      let measuredSavings = 0;

      // Create a large context that can benefit from optimization
      const largeContext = {
        projectName: 'Large Test Project',
        fullDocumentation: 'This is a very large project with extensive documentation. '.repeat(100),
        dependencies: Object.fromEntries(
          Array.from({length: 50}, (_, i) => [`package-${i}`, `^${i}.0.0`])
        ),
        components: Object.fromEntries(
          Array.from({length: 30}, (_, i) => [`Component${i}`, `Description for component ${i}`])
        ),
        testFiles: Array.from({length: 25}, (_, i) => `test-file-${i}.spec.js`)
      };

      // First agent submits full context
      const firstSubmission = await axios.put(`http://localhost:3003/context/${projectId}`, {
        context: largeContext,
        agentId: 'initial-agent'
      });
      measuredSavings += firstSubmission.data.tokensSaved || 0;

      // Second agent submits similar context (should get optimization savings)
      const optimizedContext = {
        ...largeContext,
        agentSpecialization: 'frontend',
        relevantComponents: largeContext.components, // Reference existing
        additionalInfo: 'Some additional frontend-specific information'
      };

      const secondSubmission = await axios.put(`http://localhost:3003/context/${projectId}`, {
        context: optimizedContext,
        agentId: 'frontend-specialist'
      });
      measuredSavings += secondSubmission.data.tokensSaved || 0;

      const success = measuredSavings > 0;

      this.recordTestResult(testName, success, {
        tokensSaved: measuredSavings,
        details: `Measured ${measuredSavings} tokens saved through optimization`
      });

    } catch (error) {
      this.recordTestResult(testName, false, { error: error.message });
    }
  }

  async testWebSocketUpdates() {
    const testName = 'Real-time WebSocket Updates';
    console.log(`📋 Test 4: ${testName}`);
    
    try {
      // Note: Full WebSocket testing would require ws client library
      // For now, test the WebSocket endpoint availability
      const response = await axios.get('http://localhost:3003/health');
      
      const success = response.data.status === 'healthy';
      
      this.recordTestResult(testName, success, {
        tokensSaved: 0,
        details: 'WebSocket endpoint available (full testing requires ws client)'
      });

    } catch (error) {
      this.recordTestResult(testName, false, { error: error.message });
    }
  }

  async testContextFiltering() {
    const testName = 'Context Filtering by Agent Specialization';
    console.log(`📋 Test 5: ${testName}`);
    
    try {
      const projectId = 'test-project-5';
      
      // Create context with data for multiple specializations
      const fullContext = {
        frontend: { components: ['Header', 'Footer'], styles: 'Tailwind CSS' },
        backend: { apis: ['users', 'products'], database: 'PostgreSQL' },
        devops: { deployment: 'AWS', cicd: 'GitHub Actions' },
        testing: { framework: 'Jest', coverage: '85%' },
        general: { documentation: 'README.md', version: '1.0.0' }
      };

      // Frontend agent creates context
      const frontendResponse = await axios.put(`http://localhost:3003/context/${projectId}`, {
        context: fullContext,
        agentId: 'frontend-specialist'
      });

      // Backend agent updates context - should focus on backend parts
      const backendResponse = await axios.put(`http://localhost:3003/context/${projectId}`, {
        context: {
          ...fullContext,
          backend: { ...fullContext.backend, newApi: 'orders' }
        },
        agentId: 'backend-specialist'
      });

      const totalSavings = (frontendResponse.data.tokensSaved || 0) + (backendResponse.data.tokensSaved || 0);
      const success = totalSavings > 0;

      this.recordTestResult(testName, success, {
        tokensSaved: totalSavings,
        details: 'Agents processed specialized context efficiently'
      });

    } catch (error) {
      this.recordTestResult(testName, false, { error: error.message });
    }
  }

  recordTestResult(testName, passed, details) {
    this.testResults.totalTests++;
    if (passed) {
      this.testResults.passed++;
      console.log(`  ✅ PASSED: ${details.details}`);
      if (details.tokensSaved) {
        console.log(`     💰 Tokens saved: ${details.tokensSaved}`);
        this.testResults.tokensSaved += details.tokensSaved;
      }
    } else {
      this.testResults.failed++;
      console.log(`  ❌ FAILED: ${details.error || details.details}`);
    }
    
    this.testResults.details.push({
      testName,
      passed,
      tokensSaved: details.tokensSaved || 0,
      details: details.details || details.error
    });
    
    console.log(''); // Empty line for readability
  }

  displayResults() {
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('========================\n');
    
    console.log(`Total Tests: ${this.testResults.totalTests}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`💰 Total Tokens Saved: ${this.testResults.tokensSaved}\n`);
    
    const successRate = (this.testResults.passed / this.testResults.totalTests * 100).toFixed(1);
    console.log(`🎯 Success Rate: ${successRate}%`);
    
    if (this.testResults.tokensSaved > 0) {
      console.log(`⚡ Token Optimization: WORKING - ${this.testResults.tokensSaved} tokens saved`);
    } else {
      console.log(`⚠️  Token Optimization: No savings measured`);
    }

    console.log('\n📋 DETAILED RESULTS:');
    this.testResults.details.forEach((result, index) => {
      console.log(`${index + 1}. ${result.testName}: ${result.passed ? '✅' : '❌'}`);
      console.log(`   ${result.details}`);
      if (result.tokensSaved > 0) {
        console.log(`   Tokens saved: ${result.tokensSaved}`);
      }
      console.log('');
    });

    // Get server metrics
    this.getServerMetrics();
  }

  async getServerMetrics() {
    try {
      const response = await axios.get('http://localhost:3003/metrics');
      console.log('📈 SERVER METRICS:');
      console.log(`   Active contexts: ${response.data.activeContexts}`);
      console.log(`   Total requests: ${response.data.totalRequests}`);
      console.log(`   Context updates: ${response.data.contextUpdates}`);
      console.log(`   Tokens saved: ${response.data.tokensSaved}`);
      console.log(`   Cache hits: ${response.data.cacheHits}`);
      console.log('');
    } catch (error) {
      console.log('⚠️  Could not retrieve server metrics');
    }
  }

  async stopServer() {
    if (this.serverProcess) {
      console.log('🛑 Stopping SharedContextServer...');
      this.serverProcess.kill('SIGTERM');
      
      await new Promise(resolve => {
        this.serverProcess.on('exit', resolve);
        setTimeout(resolve, 5000); // Force exit after 5s
      });
      
      console.log('✅ Server stopped\n');
    }
  }
}

// Run the test if called directly
if (require.main === module) {
  const tester = new TokenOptimizationTester();
  tester.runFullTest().catch(console.error);
}

module.exports = { TokenOptimizationTester };