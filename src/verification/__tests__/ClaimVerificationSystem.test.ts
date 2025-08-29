/**
 * Comprehensive tests for the Agent Claim Verification System
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import ClaimVerificationSystem from '../ClaimVerificationSystem';
import { AgentClaim, ClaimType, ValidationConfig } from '../types';

describe('ClaimVerificationSystem', () => {
  let tempDir: string;
  let verificationSystem: ClaimVerificationSystem;

  beforeEach(async () => {
    // Create temporary directory for tests
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'claim-verification-test-'));
    
    // Initialize verification system with test configuration
    const config: Partial<ValidationConfig> = {
      enabled: true,
      strictMode: false,
      timeouts: {
        testExecution: 10000,
        overallValidation: 30000
      },
      tolerances: {
        performance: 20, // Higher tolerance for tests
        coverage: 10,
        size: 25
      }
    };
    
    verificationSystem = new ClaimVerificationSystem(tempDir, config);
  });

  afterEach(async () => {
    // Cleanup
    await verificationSystem.shutdown();
    await fs.remove(tempDir);
  });

  describe('Claim Extraction', () => {
    test('should extract performance claims from agent response', async () => {
      const response = `I have successfully optimized the token usage by 45% and improved performance by 30%. The execution time was reduced from 2.5 seconds to 1.8 seconds.`;
      
      const claims = await verificationSystem.extractClaims(
        'test-agent-1',
        'Performance Agent',
        response,
        { files: ['src/optimizer.ts'], projectId: 'test-project' }
      );

      expect(claims).toHaveLength(3); // token reduction, performance improvement, speed improvement
      
      const tokenClaim = claims.find(c => c.claimType === 'token_reduction');
      expect(tokenClaim).toBeDefined();
      expect(tokenClaim?.specificClaims).toHaveLength(1);
      expect(tokenClaim?.specificClaims[0].claimedValue).toBe(45);
      
      const perfClaim = claims.find(c => c.claimType === 'performance');
      expect(perfClaim).toBeDefined();
      expect(perfClaim?.specificClaims[0].claimedValue).toBe(30);
    });

    test('should extract feature completion claims', async () => {
      const response = `Feature implementation completed successfully. I have added the new authentication system and implemented user management functionality.`;
      
      const claims = await verificationSystem.extractClaims(
        'test-agent-2',
        'Feature Agent',
        response,
        { files: ['src/auth.ts', 'src/users.ts'] }
      );

      expect(claims).toHaveLength(1);
      expect(claims[0].claimType).toBe('feature_completion');
      expect(claims[0].specificClaims[0].type).toBe('binary');
      expect(claims[0].specificClaims[0].claimedValue).toBe(true);
    });

    test('should extract bug fix claims', async () => {
      const response = `Fixed 3 critical bugs in the payment processing module. All error handling has been resolved.`;
      
      const claims = await verificationSystem.extractClaims(
        'test-agent-3',
        'Bug Fix Agent',
        response,
        { files: ['src/payments.ts'] }
      );

      expect(claims).toHaveLength(2); // One for number count, one for general bug fix
      
      const quantitativeClaim = claims.find(c => 
        c.specificClaims.some(sc => sc.type === 'quantitative')
      );
      expect(quantitativeClaim).toBeDefined();
      
      const bugCountClaim = quantitativeClaim?.specificClaims.find(sc => sc.type === 'quantitative');
      expect(bugCountClaim?.claimedValue).toBe(3);
    });

    test('should extract test coverage claims', async () => {
      const response = `Test coverage increased to 85% with 15 new unit tests added.`;
      
      const claims = await verificationSystem.extractClaims(
        'test-agent-4',
        'Testing Agent',
        response
      );

      expect(claims).toHaveLength(1);
      expect(claims[0].claimType).toBe('test_coverage');
      expect(claims[0].specificClaims).toHaveLength(2); // Coverage percentage + test count
      
      const coverageClaim = claims[0].specificClaims.find(sc => sc.description.includes('coverage'));
      const testCountClaim = claims[0].specificClaims.find(sc => sc.description.includes('tests'));
      
      expect(coverageClaim?.claimedValue).toBe(85);
      expect(testCountClaim?.claimedValue).toBe(15);
    });
  });

  describe('Claim Validation', () => {
    test('should validate performance claims', async () => {
      // Create test files
      await fs.ensureDir(path.join(tempDir, 'src'));
      await fs.writeFile(
        path.join(tempDir, 'src', 'test.ts'),
        `// Test implementation\nconsole.log('performance test');`
      );

      const claims = await verificationSystem.extractClaims(
        'perf-agent',
        'Performance Agent',
        'Performance improved by 25%',
        { files: ['src/test.ts'] }
      );

      expect(claims).toHaveLength(1);
      
      // Wait for validation to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const validation = await verificationSystem.verifyClaim(claims[0].id);
      expect(validation).toBeDefined();
      expect(validation?.tests).toHaveLength(1);
      expect(validation?.overallResult.score).toBeGreaterThan(0);
    });

    test('should detect phantom implementations', async () => {
      // Create file with TODO/placeholder code
      await fs.ensureDir(path.join(tempDir, 'src'));
      await fs.writeFile(
        path.join(tempDir, 'src', 'phantom.ts'),
        `function doSomething() {\n  // TODO: implement this\n  return null;\n}`
      );

      const claims = await verificationSystem.extractClaims(
        'phantom-agent',
        'Phantom Agent',
        'Feature implementation completed',
        { files: ['src/phantom.ts'] }
      );

      expect(claims).toHaveLength(1);
      
      const validation = await verificationSystem.verifyClaim(claims[0].id);
      expect(validation).toBeDefined();
      expect(validation?.overallResult.passed).toBe(false);
      expect(validation?.overallResult.issues).toContainEqual(
        expect.objectContaining({
          type: 'phantom_implementation',
          severity: 'high'
        })
      );
    });

    test('should detect exaggerated claims', async () => {
      const claims = await verificationSystem.extractClaims(
        'exaggerated-agent',
        'Exaggerated Agent',
        'Achieved 100% improvement with perfect optimization and infinite speed'
      );

      expect(claims).toHaveLength(1);
      
      const validation = await verificationSystem.verifyClaim(claims[0].id);
      expect(validation).toBeDefined();
      expect(validation?.discrepancies).toContainEqual(
        expect.objectContaining({
          type: 'exaggerated_improvement',
          severity: 'major'
        })
      );
    });
  });

  describe('Trust Score Management', () => {
    test('should initialize agent trust scores', async () => {
      await verificationSystem.extractClaims(
        'new-agent',
        'New Agent',
        'Simple task completed'
      );

      const trustScore = verificationSystem.getAgentTrustScore('new-agent');
      expect(trustScore).toBeDefined();
      expect(trustScore?.overallScore).toBe(100);
      expect(trustScore?.totalClaims).toBe(1);
    });

    test('should update trust scores based on verification results', async () => {
      // Create a valid implementation
      await fs.ensureDir(path.join(tempDir, 'src'));
      await fs.writeFile(
        path.join(tempDir, 'src', 'valid.ts'),
        `function validImplementation() {\n  return 'working code';\n}`
      );

      // Make a reasonable claim
      const claims = await verificationSystem.extractClaims(
        'trust-agent',
        'Trust Agent',
        'Feature implemented successfully',
        { files: ['src/valid.ts'] }
      );

      // Wait for validation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const trustScore = verificationSystem.getAgentTrustScore('trust-agent');
      expect(trustScore).toBeDefined();
      expect(trustScore?.totalClaims).toBeGreaterThan(0);
    });

    test('should apply penalties for false claims', async () => {
      // Create phantom implementation
      await fs.ensureDir(path.join(tempDir, 'src'));
      await fs.writeFile(
        path.join(tempDir, 'src', 'fake.ts'),
        `// TODO: implement feature\nthrow new Error('Not implemented');`
      );

      const claims = await verificationSystem.extractClaims(
        'penalty-agent',
        'Penalty Agent',
        'Complex feature fully implemented and tested',
        { files: ['src/fake.ts'] }
      );

      const validation = await verificationSystem.verifyClaim(claims[0].id);
      expect(validation?.overallResult.passed).toBe(false);
      
      const trustScore = verificationSystem.getAgentTrustScore('penalty-agent');
      expect(trustScore?.penalties).toHaveLength(1);
      expect(trustScore?.overallScore).toBeLessThan(100);
    });

    test('should award badges for good performance', async () => {
      const agentId = 'badge-agent';
      
      // Create multiple verified claims to earn badges
      for (let i = 0; i < 10; i++) {
        await fs.ensureFile(path.join(tempDir, 'src', `file${i}.ts`));
        await fs.writeFile(
          path.join(tempDir, 'src', `file${i}.ts`),
          `export function feature${i}() { return 'implemented'; }`
        );

        await verificationSystem.extractClaims(
          agentId,
          'Badge Agent',
          `Feature ${i} completed successfully`,
          { files: [`src/file${i}.ts`] }
        );
      }

      // Wait for validations
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const trustScore = verificationSystem.getAgentTrustScore(agentId);
      expect(trustScore?.totalClaims).toBeGreaterThan(5);
      
      // Should have high accuracy if implementations are valid
      if (trustScore && trustScore.accuracyRate >= 95) {
        expect(trustScore.badges.some(b => b.name === 'Precision Master')).toBe(true);
      }
    });
  });

  describe('Report Generation', () => {
    test('should generate comprehensive verification report', async () => {
      // Create some test claims
      await verificationSystem.extractClaims(
        'report-agent-1',
        'Report Agent 1',
        'Performance improved by 20%'
      );

      await verificationSystem.extractClaims(
        'report-agent-2',
        'Report Agent 2',
        'Bug fixes completed'
      );

      // Wait for some processing
      await new Promise(resolve => setTimeout(resolve, 1000));

      const report = await verificationSystem.generateReport();
      
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalClaims).toBeGreaterThan(0);
      expect(report.agentPerformance).toHaveLength(2);
      expect(report.claimTypes.length).toBeGreaterThan(0);
      expect(report.recommendations).toBeDefined();
    });

    test('should include system issues in report', async () => {
      // Trigger a system issue by providing invalid context
      try {
        await verificationSystem.extractClaims(
          'error-agent',
          'Error Agent',
          null as any, // Invalid input
          { invalidContext: true }
        );
      } catch (error) {
        // Expected error
      }

      const report = await verificationSystem.generateReport();
      expect(report.issues).toBeDefined();
    });
  });

  describe('Configuration Management', () => {
    test('should allow configuration updates', () => {
      const newConfig: Partial<ValidationConfig> = {
        strictMode: true,
        tolerances: {
          performance: 5,
          coverage: 2,
          size: 10
        }
      };

      verificationSystem.updateConfig(newConfig);
      
      // Configuration should be applied (we can't directly test internal config,
      // but we can verify the system continues to work)
      expect(() => {
        verificationSystem.getMetrics();
      }).not.toThrow();
    });

    test('should enable/disable verification process', () => {
      verificationSystem.updateConfig({ enabled: false });
      // System should still be functional but not auto-verify
      expect(() => {
        verificationSystem.getMetrics();
      }).not.toThrow();

      verificationSystem.updateConfig({ enabled: true });
      expect(() => {
        verificationSystem.getMetrics();
      }).not.toThrow();
    });
  });

  describe('System Metrics', () => {
    test('should provide comprehensive metrics', async () => {
      // Create some test data
      await verificationSystem.extractClaims(
        'metrics-agent',
        'Metrics Agent',
        'Multiple improvements: 15% performance boost, 3 bugs fixed, test coverage at 90%'
      );

      const metrics = verificationSystem.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics.totalClaims).toBe('number');
      expect(typeof metrics.overallAccuracy).toBe('number');
      expect(metrics.claimsByType).toBeInstanceOf(Map);
      expect(metrics.claimsByAgent).toBeInstanceOf(Map);
    });

    test('should track validation performance', async () => {
      const startTime = Date.now();
      
      await verificationSystem.extractClaims(
        'timing-agent',
        'Timing Agent',
        'Quick optimization completed'
      );

      // Wait for validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const metrics = verificationSystem.getMetrics();
      const endTime = Date.now();
      
      // Validation should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000);
      expect(metrics.averageValidationTime).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty agent responses', async () => {
      const claims = await verificationSystem.extractClaims(
        'empty-agent',
        'Empty Agent',
        ''
      );

      expect(claims).toHaveLength(0);
    });

    test('should handle malformed claims', async () => {
      const claims = await verificationSystem.extractClaims(
        'malformed-agent',
        'Malformed Agent',
        'Random text without any recognizable claims'
      );

      expect(claims).toHaveLength(0);
    });

    test('should handle non-existent files in context', async () => {
      const claims = await verificationSystem.extractClaims(
        'missing-file-agent',
        'Missing File Agent',
        'Feature implemented in non-existent file',
        { files: ['src/nonexistent.ts'] }
      );

      if (claims.length > 0) {
        const validation = await verificationSystem.verifyClaim(claims[0].id);
        expect(validation?.overallResult.issues).toContainEqual(
          expect.objectContaining({
            type: 'missing_file'
          })
        );
      }
    });

    test('should handle validation timeouts gracefully', async () => {
      // Create a claim that might take long to validate
      const claims = await verificationSystem.extractClaims(
        'timeout-agent',
        'Timeout Agent',
        'Extremely complex optimization with 99.9% improvement'
      );

      if (claims.length > 0) {
        // Should complete within configured timeout
        const validation = await verificationSystem.verifyClaim(claims[0].id);
        expect(validation).toBeDefined();
      }
    }, 35000); // Allow extra time for this test
  });

  describe('Data Persistence', () => {
    test('should persist trust scores', async () => {
      const agentId = 'persist-agent';
      
      await verificationSystem.extractClaims(
        agentId,
        'Persist Agent',
        'Data persistence test completed'
      );

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const trustScore = verificationSystem.getAgentTrustScore(agentId);
      expect(trustScore).toBeDefined();
      
      // Trust scores should be saved to file
      const trustPath = path.join(tempDir, '.agentwise', 'trust-scores.json');
      const exists = await fs.pathExists(trustPath);
      expect(exists).toBe(true);
    });

    test('should cleanup old data', async () => {
      // Create some test data
      await verificationSystem.extractClaims(
        'cleanup-agent',
        'Cleanup Agent',
        'Test claim for cleanup'
      );

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Run cleanup
      await verificationSystem.cleanup();
      
      // System should still be functional after cleanup
      const metrics = verificationSystem.getMetrics();
      expect(metrics).toBeDefined();
    });
  });

  describe('System Integration', () => {
    test('should integrate all components correctly', async () => {
      // Test full workflow: extract -> verify -> update trust -> generate report
      const claims = await verificationSystem.extractClaims(
        'integration-agent',
        'Integration Agent',
        'Full integration test: 25% performance improvement, 5 bugs fixed, coverage increased to 80%'
      );

      expect(claims.length).toBeGreaterThan(0);
      
      // Wait for validations to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check trust scores were updated
      const trustScore = verificationSystem.getAgentTrustScore('integration-agent');
      expect(trustScore).toBeDefined();
      expect(trustScore?.totalClaims).toBeGreaterThan(0);
      
      // Generate report
      const report = await verificationSystem.generateReport();
      expect(report.agentPerformance.some(a => a.agentId === 'integration-agent')).toBe(true);
      
      // Get system metrics
      const metrics = verificationSystem.getMetrics();
      expect(metrics.totalClaims).toBeGreaterThan(0);
    });
  });
});

// Helper function to create mock package.json
async function createMockPackageJson(tempDir: string): Promise<void> {
  const packageJson = {
    name: 'test-project',
    version: '1.0.0',
    scripts: {
      test: 'jest',
      build: 'tsc'
    },
    dependencies: {
      typescript: '^4.9.0'
    }
  };
  
  await fs.writeJson(path.join(tempDir, 'package.json'), packageJson, { spaces: 2 });
}

// Helper function to create mock test files
async function createMockTestFiles(tempDir: string): Promise<void> {
  await fs.ensureDir(path.join(tempDir, '__tests__'));
  
  const testFile = `
describe('Mock Test', () => {
  test('should pass', () => {
    expect(true).toBe(true);
  });
  
  test('should calculate correctly', () => {
    expect(2 + 2).toBe(4);
  });
});
`;
  
  await fs.writeFile(path.join(tempDir, '__tests__', 'mock.test.js'), testFile);
}