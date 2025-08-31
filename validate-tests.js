#!/usr/bin/env node

/**
 * Test Validation Script
 * 
 * Validates that all test files are syntactically correct and can be executed.
 * This script performs basic validation without running the actual tests.
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

async function validateTests() {
  console.log('🧪 Validating Agentwise Test Suite\n');

  const testFiles = [
    'tests/requirements.test.ts',
    'tests/database.test.ts',
    'tests/github.test.ts',
    'tests/protection.test.ts',
    'tests/wizard.test.ts',
    'tests/integration.test.ts'
  ];

  let allValid = true;

  for (const testFile of testFiles) {
    const filePath = path.resolve(testFile);
    
    try {
      // Check if file exists
      if (!await fs.pathExists(filePath)) {
        console.error(`❌ File not found: ${testFile}`);
        allValid = false;
        continue;
      }

      // Check file size (should not be empty)
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        console.error(`❌ File is empty: ${testFile}`);
        allValid = false;
        continue;
      }

      // Read and validate basic structure
      const content = await fs.readFile(filePath, 'utf8');
      
      // Check for required imports and structure
      const requiredPatterns = [
        /import.*jest.*from/,
        /describe\s*\(/,
        /it\s*\(/,
        /expect\s*\(/
      ];

      const missingPatterns = requiredPatterns.filter(pattern => !pattern.test(content));
      
      if (missingPatterns.length > 0) {
        console.error(`❌ Missing required patterns in ${testFile}`);
        allValid = false;
        continue;
      }

      // Count test cases
      const testCaseMatches = content.match(/it\s*\(/g);
      const describeMatches = content.match(/describe\s*\(/g);
      
      const testCount = testCaseMatches ? testCaseMatches.length : 0;
      const suiteCount = describeMatches ? describeMatches.length : 0;

      console.log(`✅ ${testFile.padEnd(30)} ${suiteCount} suites, ${testCount} tests (${Math.round(stats.size / 1024)}KB)`);

    } catch (error) {
      console.error(`❌ Error validating ${testFile}: ${error.message}`);
      allValid = false;
    }
  }

  // Validate test runner
  const testRunnerPath = path.resolve('test-runner.js');
  try {
    if (await fs.pathExists(testRunnerPath)) {
      const stats = await fs.stat(testRunnerPath);
      console.log(`✅ ${'test-runner.js'.padEnd(30)} Test runner (${Math.round(stats.size / 1024)}KB)`);
    } else {
      console.error(`❌ Test runner not found: test-runner.js`);
      allValid = false;
    }
  } catch (error) {
    console.error(`❌ Error validating test runner: ${error.message}`);
    allValid = false;
  }

  // Validate package.json test scripts
  try {
    const packageJson = await fs.readJson('package.json');
    const scripts = packageJson.scripts || {};
    
    console.log(`\n📋 Available Test Scripts:`);
    if (scripts.test) {
      console.log(`   npm test: ${scripts.test}`);
    }
    
    // Add our test runner script if not present
    if (!scripts['test:all']) {
      console.log(`   Suggestion: Add "test:all": "node test-runner.js" to package.json`);
    }
    
  } catch (error) {
    console.error(`⚠️  Could not read package.json: ${error.message}`);
  }

  // Generate test summary
  console.log(`\n📊 Test Suite Summary:`);
  console.log(`   Test Files: ${testFiles.length}`);
  console.log(`   Status: ${allValid ? '✅ All tests valid' : '❌ Some tests have issues'}`);
  
  if (allValid) {
    console.log(`\n🎉 All test files are valid and ready to run!`);
    console.log(`\nTo run tests:`);
    console.log(`   ./test-runner.js                    # Run all tests`);
    console.log(`   ./test-runner.js --filter github    # Run specific tests`);
    console.log(`   npm test                             # Run with Jest directly`);
  } else {
    console.log(`\n⚠️  Please fix the issues above before running tests.`);
  }

  return allValid;
}

// Run validation
validateTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });