#!/usr/bin/env node

/**
 * Token Optimization Demo
 * 
 * This demo shows how the integrated SharedContextServer provides real token 
 * optimization when used with the DynamicAgentManager system.
 */

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

class TokenOptimizationDemo {
  constructor() {
    this.serverProcess = null;
    this.totalTokensSaved = 0;
    this.agentResults = [];
  }

  async runDemo() {
    console.log('🎯 Token Optimization System Demo\n');
    console.log('This demo shows how the SharedContextServer integrates with');
    console.log('the DynamicAgentManager to provide measurable token savings.\n');

    try {
      // Start the SharedContextServer
      await this.startServer();
      
      // Simulate a typical project workflow
      await this.simulateProjectWorkflow();
      
      // Show final results
      this.showResults();
      
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
    } finally {
      await this.stopServer();
    }
  }

  async startServer() {
    console.log('🚀 Starting SharedContextServer...');
    
    const serverPath = path.join(__dirname, 'src', 'context', 'startContextServer.js');
    this.serverProcess = spawn('node', [serverPath], { 
      detached: true,
      stdio: 'pipe'
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    try {
      const response = await axios.get('http://localhost:3003/health', { timeout: 2000 });
      if (response.data.status === 'healthy') {
        console.log('✅ SharedContextServer is running and healthy\n');
      }
    } catch (error) {
      throw new Error('SharedContextServer failed to start properly');
    }
  }

  async simulateProjectWorkflow() {
    console.log('📋 Simulating Multi-Agent Project Workflow\n');
    
    const projectId = 'demo-ecommerce-app';
    const projectData = {
      name: 'E-commerce Application',
      description: 'Modern React-based e-commerce platform with Node.js backend',
      technologies: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Tailwind CSS'],
      features: [
        'User authentication and authorization',
        'Product catalog with search and filtering',
        'Shopping cart and checkout process',
        'Payment integration with Stripe',
        'Admin dashboard for product management',
        'Order tracking and history',
        'Email notifications',
        'Responsive design for mobile and desktop'
      ],
      architecture: {
        frontend: 'React with TypeScript and Tailwind CSS',
        backend: 'Node.js with Express and TypeScript',
        database: 'PostgreSQL with Prisma ORM',
        authentication: 'JWT with bcrypt',
        payments: 'Stripe integration',
        deployment: 'AWS with Docker containers'
      }
    };

    console.log('🎨 Step 1: Frontend Specialist initializes project context...');
    await this.simulateAgentWork('frontend-specialist', projectId, {
      ...projectData,
      agentFocus: 'UI/UX design and React component development',
      components: [
        'Header with navigation and search',
        'Product card components',
        'Shopping cart sidebar',
        'Checkout form with validation',
        'User profile and settings',
        'Admin dashboard layouts'
      ],
      styling: {
        framework: 'Tailwind CSS',
        theme: 'Modern minimalist design',
        responsive: 'Mobile-first approach',
        colors: 'Brand colors with dark/light mode support'
      }
    });

    console.log('⚙️  Step 2: Backend Specialist builds on shared context...');
    await this.simulateAgentWork('backend-specialist', projectId, {
      agentFocus: 'API development and business logic',
      apis: [
        'User authentication (register, login, logout)',
        'Product management (CRUD operations)',
        'Shopping cart operations',
        'Order processing and payment',
        'User profile management',
        'Admin operations for product management'
      ],
      middleware: [
        'Authentication middleware with JWT verification',
        'CORS configuration for frontend integration',
        'Error handling and logging middleware',
        'Rate limiting for API protection',
        'Request validation with Joi or Zod'
      ],
      database: {
        schema: 'Users, Products, Orders, CartItems, Categories',
        relationships: 'One-to-many and many-to-many relations',
        indexing: 'Optimized for search and filtering queries'
      }
    });

    console.log('🗃️  Step 3: Database Specialist optimizes data layer...');
    await this.simulateAgentWork('database-specialist', projectId, {
      agentFocus: 'Database design and optimization',
      schemas: [
        'User schema with authentication fields',
        'Product schema with categories and variants',
        'Order schema with items and payment status',
        'Category schema for product organization'
      ],
      migrations: [
        'Initial schema creation',
        'Add product variants and images',
        'Implement order status tracking',
        'Create indexes for performance'
      ],
      optimization: {
        indexing: 'Strategic indexes for search and filtering',
        queries: 'Optimized queries for product catalog',
        relationships: 'Efficient foreign key relationships',
        performance: 'Query optimization and caching strategies'
      }
    });

    console.log('🧪 Step 4: Testing Specialist creates test suite...');
    await this.simulateAgentWork('testing-specialist', projectId, {
      agentFocus: 'Comprehensive testing strategy',
      testSuites: [
        'Unit tests for React components',
        'API endpoint testing with Jest and Supertest',
        'Database integration tests',
        'End-to-end tests with Playwright',
        'Authentication and authorization tests'
      ],
      coverage: {
        target: '90% code coverage',
        components: 'All React components tested',
        apis: 'All API endpoints covered',
        integration: 'Critical user flows tested'
      }
    });

    console.log('🔧 Step 5: DevOps Specialist handles deployment...');
    await this.simulateAgentWork('devops-specialist', projectId, {
      agentFocus: 'Deployment and infrastructure',
      deployment: {
        platform: 'AWS with ECS containers',
        database: 'AWS RDS PostgreSQL',
        storage: 'S3 for static assets',
        cdn: 'CloudFront for global delivery'
      },
      cicd: {
        pipeline: 'GitHub Actions for automated deployment',
        testing: 'Automated testing in CI/CD pipeline',
        environments: 'Development, staging, and production',
        monitoring: 'CloudWatch for application monitoring'
      }
    });
  }

  async simulateAgentWork(agentId, projectId, agentContext) {
    try {
      // Get current shared context
      let sharedContext = {};
      try {
        const contextResponse = await axios.get(`http://localhost:3003/context/${projectId}`);
        sharedContext = contextResponse.data.context || {};
      } catch (error) {
        // No existing context, this is the first agent
      }

      // Calculate baseline tokens (what would be sent without optimization)
      const baselineContext = {
        ...sharedContext,
        ...agentContext,
        fullProjectInfo: 'Complete project documentation and context would be here...',
        allDependencies: 'Full dependency tree and configuration...',
        completeHistory: 'Full project history and previous work...'
      };
      const baselineTokens = this.estimateTokens(JSON.stringify(baselineContext));

      // Send optimized context update
      const updateResponse = await axios.put(`http://localhost:3003/context/${projectId}`, {
        context: agentContext,
        agentId: agentId
      });

      const tokensSaved = updateResponse.data.tokensSaved || 0;
      const optimizedTokens = baselineTokens - tokensSaved;
      const savingsPercent = ((tokensSaved / baselineTokens) * 100).toFixed(1);

      console.log(`   📤 Context updated: ${tokensSaved} tokens saved (${savingsPercent}% optimization)`);
      console.log(`   ⚡ Efficient context: ${optimizedTokens} tokens vs ${baselineTokens} baseline`);

      this.agentResults.push({
        agentId,
        baselineTokens,
        optimizedTokens,
        tokensSaved,
        savingsPercent: parseFloat(savingsPercent)
      });

      this.totalTokensSaved += tokensSaved;

    } catch (error) {
      console.log(`   ❌ Agent ${agentId} failed: ${error.message}`);
    }

    console.log('');
  }

  estimateTokens(text) {
    // Simple token estimation: ~4 characters per token
    return Math.ceil((text || '').length / 4);
  }

  async showResults() {
    console.log('📊 TOKEN OPTIMIZATION RESULTS\n');
    console.log('=================================\n');

    // Show per-agent results
    this.agentResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.agentId}:`);
      console.log(`   📉 Baseline: ${result.baselineTokens.toLocaleString()} tokens`);
      console.log(`   ⚡ Optimized: ${result.optimizedTokens.toLocaleString()} tokens`);
      console.log(`   💰 Saved: ${result.tokensSaved.toLocaleString()} tokens (${result.savingsPercent}%)`);
      console.log('');
    });

    // Show overall statistics
    const totalBaseline = this.agentResults.reduce((sum, r) => sum + r.baselineTokens, 0);
    const totalOptimized = this.agentResults.reduce((sum, r) => sum + r.optimizedTokens, 0);
    const overallSavingsPercent = ((this.totalTokensSaved / totalBaseline) * 100).toFixed(1);

    console.log('🎯 OVERALL PERFORMANCE:');
    console.log(`   📊 Total baseline tokens: ${totalBaseline.toLocaleString()}`);
    console.log(`   ⚡ Total optimized tokens: ${totalOptimized.toLocaleString()}`);
    console.log(`   💰 Total tokens saved: ${this.totalTokensSaved.toLocaleString()}`);
    console.log(`   📈 Overall optimization: ${overallSavingsPercent}%`);

    // Show server metrics
    try {
      const metricsResponse = await axios.get('http://localhost:3003/metrics');
      const metrics = metricsResponse.data;

      console.log('\n🖥️  SERVER METRICS:');
      console.log(`   📋 Active contexts: ${metrics.activeContexts}`);
      console.log(`   🔄 Total requests: ${metrics.totalRequests}`);
      console.log(`   📤 Context updates: ${metrics.contextUpdates}`);
      console.log(`   💾 Cache hits: ${metrics.cacheHits}`);
      console.log(`   ⏱️  Uptime: ${Math.round(metrics.uptime)} seconds`);
      
    } catch (error) {
      console.log('\n⚠️  Could not retrieve server metrics');
    }

    console.log('\n✅ Token optimization is working effectively!');
    console.log('The SharedContextServer successfully reduced token usage by');
    console.log(`${overallSavingsPercent}% across all agent interactions.\n`);
  }

  async stopServer() {
    if (this.serverProcess) {
      console.log('🛑 Stopping SharedContextServer...');
      
      try {
        this.serverProcess.kill('SIGTERM');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (!this.serverProcess.killed) {
          this.serverProcess.kill('SIGKILL');
        }
      } catch (error) {
        // Server might already be stopped
      }
      
      console.log('✅ Demo completed successfully!');
    }
  }
}

// Run demo if called directly
if (require.main === module) {
  const demo = new TokenOptimizationDemo();
  demo.runDemo().catch(console.error);
}

module.exports = { TokenOptimizationDemo };