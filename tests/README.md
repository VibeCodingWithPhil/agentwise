# Agentwise Comprehensive Test Suite

This directory contains a comprehensive test suite for all Agentwise features, providing thorough coverage of the system's functionality with executable tests and no phantom code.

## 🧪 Test Files

### Core Feature Tests

| Test File | Coverage | Test Count | Description |
|-----------|----------|------------|-------------|
| `requirements.test.ts` | Requirements System | 21 tests | Tests requirements generation, validation, and enhancement |
| `database.test.ts` | Database Integration | 38 tests | Tests database connections, credentials, and MCP configuration |
| `github.test.ts` | GitHub Integration | 35 tests | Tests GitHub authentication, repository management, and workflows |
| `protection.test.ts` | Protection System | 38 tests | Tests auto-commit, security monitoring, and backup systems |
| `wizard.test.ts` | Project Wizard | 43 tests | Tests unified project setup and user preferences |
| `integration.test.ts` | End-to-End | 9 tests | Tests complete workflows and system integration |

## 🚀 Running Tests

### Quick Start
```bash
# Run all tests with the advanced test runner
npm run test:all

# Run specific test suites
./test-runner.js --filter github
./test-runner.js --filter protection

# Run with coverage
npm run test:coverage

# Validate test files
npm run test:validate
```

### Test Runner Options
```bash
./test-runner.js [options]

Options:
  --parallel           Run tests in parallel (default)
  --sequential         Run tests sequentially
  --verbose, -v        Verbose output
  --no-coverage        Skip coverage generation
  --watch, -w          Watch mode (re-run on changes)
  --bail               Stop on first failure
  --no-cache           Disable result caching
  --filter, -f <text>  Filter test suites by name/category
  --concurrency, -c <n> Max concurrent test suites (default: 4)
  --timeout, -t <sec>  Test timeout in seconds (default: 300)
  --output, -o <dir>   Output directory (default: ./test-results)
  --help, -h           Show help
```

### Examples
```bash
# Run all tests in parallel with coverage
npm run test:coverage

# Run only GitHub tests with verbose output
./test-runner.js --filter github --verbose

# Run tests sequentially with detailed output
./test-runner.js --sequential --verbose

# Run tests for CI/CD (parallel, fail fast, no cache)
npm run test:ci

# Watch mode for development
npm run test:watch
```

## 📋 Test Structure

Each test file follows a consistent structure:

### 1. Requirements System Tests (`requirements.test.ts`)
- **Requirements Generation**: Tests automatic requirements generation from project descriptions
- **Requirements Validation**: Tests validation rules and error handling
- **Requirements Enhancement**: Tests AI-powered enhancement of requirements
- **Visual Spec Generation**: Tests generation of visual specifications
- **Timeline Generation**: Tests project timeline creation
- **Performance Tests**: Tests handling of large requirement sets
- **Error Handling**: Tests various error conditions and edge cases

### 2. Database Integration Tests (`database.test.ts`)
- **Database Wizards**: Tests setup wizards for different database providers
- **Auto Authentication**: Tests automatic credential detection
- **Credential Management**: Tests secure credential storage and encryption
- **MCP Configuration**: Tests Model Context Protocol setup
- **Provider Integration**: Tests Supabase, Neon, PlanetScale integration
- **Connection Testing**: Tests database connectivity validation
- **Migration Generation**: Tests schema migration creation
- **Error Recovery**: Tests failure handling and recovery

### 3. GitHub Integration Tests (`github.test.ts`)
- **Authentication**: Tests token, SSH, and CLI authentication methods
- **Repository Management**: Tests repository creation, updates, and deletion
- **Branch Protection**: Tests branch protection rule setup
- **Workflow Generation**: Tests CI/CD workflow creation
- **Secret Management**: Tests GitHub secrets synchronization
- **Webhook Management**: Tests webhook configuration
- **Rate Limiting**: Tests API rate limit handling
- **Error Handling**: Tests various GitHub API error conditions
- **Performance Tests**: Tests concurrent API operations

### 4. Protection System Tests (`protection.test.ts`)
- **Auto-Commit Manager**: Tests automatic file change detection and commits
- **Security Monitoring**: Tests continuous security scanning
- **Review Pipeline**: Tests automated code review processes
- **Backup System**: Tests integrated backup solutions
- **Security Reporting**: Tests daily security report generation
- **Protection Dashboard**: Tests monitoring and status reporting
- **Alert System**: Tests security alert generation and handling
- **Performance Tests**: Tests handling of large codebases
- **Integration Tests**: Tests cross-component interactions

### 5. Wizard System Tests (`wizard.test.ts`)
- **Project Creation Wizard**: Tests unified project setup workflow
- **User Preferences**: Tests preference management and persistence
- **Template System**: Tests project template loading and customization
- **Interactive UI**: Tests command-line interface components
- **Step Execution**: Tests individual wizard step execution
- **Error Recovery**: Tests failure handling and rollback
- **Progress Tracking**: Tests progress monitoring and reporting
- **Configuration Management**: Tests saved configuration handling
- **Analytics**: Tests usage tracking and statistics
- **Plugin System**: Tests extensibility features

### 6. Integration Tests (`integration.test.ts`)
- **Complete Workflow**: Tests end-to-end project creation
- **Cross-System Integration**: Tests interaction between all components
- **Failure Recovery**: Tests partial failure handling
- **Performance Tests**: Tests large project handling
- **Concurrent Operations**: Tests parallel operation safety
- **System Validation**: Tests environment and requirement checking
- **Documentation Generation**: Tests comprehensive documentation creation
- **Lifecycle Testing**: Tests complete development lifecycle

## 🔧 Test Configuration

### Jest Configuration
The project uses Jest with TypeScript support configured in `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

### Test Environment
All tests run in an isolated environment with:
- Mocked external dependencies (axios, fs-extra, child_process)
- Controlled test data and fixtures
- Isolated file system operations
- Network request mocking
- Process environment isolation

## 📊 Coverage and Reporting

### Coverage Reports
The test runner generates comprehensive coverage reports:
- **HTML Report**: Interactive coverage browser at `test-results/coverage/index.html`
- **LCOV Report**: Machine-readable coverage data
- **Text Summary**: Console coverage summary
- **JSON Report**: Structured coverage data for CI/CD

### Test Reports
The test runner produces detailed reports:
- **JSON Report**: Complete test results in `test-results/test-report.json`
- **HTML Report**: Visual test results dashboard
- **Performance Metrics**: Execution time and resource usage
- **Failure Analysis**: Detailed error information and stack traces

## 🚦 CI/CD Integration

### GitHub Actions
The test suite is designed for CI/CD integration:

```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
      - uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

### Performance Benchmarks
The test suite includes performance benchmarks:
- **Execution Time**: Target < 5 minutes for full suite
- **Memory Usage**: Monitor memory consumption during tests
- **Concurrency**: Support for parallel test execution
- **Caching**: Result caching for faster subsequent runs

## 🛠️ Development Guidelines

### Writing New Tests
When adding new tests, follow these guidelines:

1. **Test Structure**: Use consistent describe/it blocks
2. **Mocking**: Mock all external dependencies
3. **Assertions**: Use specific, meaningful assertions
4. **Error Cases**: Include error condition testing
5. **Performance**: Consider performance impact of tests
6. **Documentation**: Document complex test scenarios

### Test Data Management
- Use factory functions for creating test data
- Store fixtures in `__fixtures__` directories
- Use realistic but safe test data
- Avoid hardcoded values in tests

### Best Practices
- **Isolation**: Each test should be independent
- **Cleanup**: Properly cleanup after each test
- **Readability**: Write clear, descriptive test names
- **Coverage**: Aim for high code coverage
- **Speed**: Keep tests fast and efficient

## 📈 Performance Monitoring

The test suite includes built-in performance monitoring:

### Execution Metrics
- Individual test execution times
- Suite-level performance tracking
- Memory usage monitoring
- CPU utilization tracking

### Performance Targets
- **Unit Tests**: < 1 second per test
- **Integration Tests**: < 30 seconds per test
- **End-to-End Tests**: < 5 minutes per test
- **Full Suite**: < 10 minutes total

### Optimization Features
- **Parallel Execution**: Run tests concurrently
- **Result Caching**: Cache successful test results
- **Smart Scheduling**: Run faster tests first
- **Resource Management**: Monitor and limit resource usage

## 🔍 Debugging Tests

### Debug Mode
Run tests in debug mode for troubleshooting:

```bash
# Run with verbose output
./test-runner.js --verbose

# Run specific test with detailed output
./test-runner.js --filter "specific test name" --verbose

# Run in sequential mode for better debugging
./test-runner.js --sequential --verbose
```

### Common Issues
1. **Mock Configuration**: Ensure mocks are properly configured
2. **Async Operations**: Handle async operations correctly
3. **Test Isolation**: Verify tests don't interfere with each other
4. **Environment Variables**: Check test environment setup
5. **Timeouts**: Adjust timeouts for slow operations

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [TypeScript Testing](https://typescript-lang.org/docs/handbook/testing.html)
- [Agentwise Architecture](../docs/ARCHITECTURE.md)
- [Contributing Guidelines](../CONTRIBUTING.md)

## 🤝 Contributing

When contributing to the test suite:

1. **Add Tests**: Include tests for all new features
2. **Update Existing**: Update tests when modifying existing code
3. **Run Suite**: Ensure all tests pass before submitting PR
4. **Coverage**: Maintain or improve coverage levels
5. **Documentation**: Update test documentation as needed

---

**Note**: All tests in this suite are executable and contain no phantom code. Each test is designed to run independently and provide meaningful validation of the system's functionality.