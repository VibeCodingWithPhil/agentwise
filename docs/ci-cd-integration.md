# CI/CD Integration Documentation

Agentwise provides comprehensive CI/CD integration capabilities that enable seamless automation of development workflows, from code creation to production deployment. This documentation covers setup, configuration, and best practices for integrating Agentwise with popular CI/CD platforms.

## Overview

Agentwise CI/CD integration features:
- **Automated Project Generation**: Trigger project creation from CI/CD pipelines
- **Multi-Agent Testing**: Coordinate testing across multiple specialist agents
- **Quality Gates**: Automated code quality and security validation
- **Deployment Automation**: Seamless deployment through DevOps specialists
- **Performance Monitoring**: Continuous performance tracking and optimization

## Supported CI/CD Platforms

### GitHub Actions Integration

Agentwise provides native GitHub Actions integration through the GitHub MCP server.

#### Basic Workflow Setup

Create `.github/workflows/agentwise.yml`:

```yaml
name: Agentwise CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  agentwise-validation:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        
    - name: Install Agentwise
      run: |
        npm install -g agentwise
        
    - name: Setup Claude Code
      run: |
        # Install Claude Code CLI
        curl -fsSL https://claude.ai/install | bash
        
    - name: Run Agentwise Validation
      env:
        CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
        AGENTWISE_PROJECT_PATH: ${{ github.workspace }}
      run: |
        claude --dangerously-skip-permissions &
        sleep 5
        agentwise-monitor validate --project-path="${{ github.workspace }}"
```

#### Advanced GitHub Actions Integration

```yaml
name: Agentwise Advanced Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]
  workflow_dispatch:
    inputs:
      task_description:
        description: 'Task for Agentwise to execute'
        required: true
        type: string

jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      project-exists: ${{ steps.check-project.outputs.exists }}
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Check if Agentwise project exists
      id: check-project
      run: |
        if [ -f "projects.json" ]; then
          echo "exists=true" >> $GITHUB_OUTPUT
        else
          echo "exists=false" >> $GITHUB_OUTPUT
        fi

  agentwise-task:
    needs: setup
    if: github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Agentwise Environment
      uses: ./.github/actions/setup-agentwise
      
    - name: Execute Agentwise Task
      env:
        CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
      run: |
        /task "${{ github.event.inputs.task_description }}"
        
    - name: Commit Agentwise Changes
      run: |
        git config --local user.email "agentwise@github.action"
        git config --local user.name "Agentwise Bot"
        git add .
        git diff --staged --quiet || git commit -m "Agentwise: ${{ github.event.inputs.task_description }}"
        git push

  quality-validation:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Agentwise Environment
      uses: ./.github/actions/setup-agentwise
      
    - name: Run Multi-Agent Testing
      env:
        CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
      run: |
        # Run comprehensive testing across all agents
        agentwise-monitor test --agents=testing-specialist,security-specialist,code-review-specialist
        
    - name: Generate Test Reports
      run: |
        agentwise-monitor report --format=junit --output=test-results.xml
        
    - name: Upload Test Results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: test-results
        path: test-results.xml

  deployment:
    needs: [quality-validation]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      
    - name: Setup Agentwise Environment
      uses: ./.github/actions/setup-agentwise
      
    - name: Deploy with DevOps Specialist
      env:
        CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
        DEPLOYMENT_ENV: production
      run: |
        /task-deployment "deploy to production with monitoring and rollback capability"
```

### GitLab CI Integration

Create `.gitlab-ci.yml`:

```yaml
stages:
  - validate
  - test
  - deploy

variables:
  AGENTWISE_VERSION: "latest"
  NODE_VERSION: "18"

.agentwise_setup: &agentwise_setup
  before_script:
    - apt-get update -qq && apt-get install -y -qq git curl
    - curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    - apt-get install -y nodejs
    - npm install -g agentwise
    - curl -fsSL https://claude.ai/install | bash

agentwise_validation:
  stage: validate
  image: ubuntu:22.04
  <<: *agentwise_setup
  script:
    - claude --dangerously-skip-permissions &
    - sleep 5
    - agentwise-monitor validate --project-path="$CI_PROJECT_DIR"
  artifacts:
    reports:
      junit: validation-report.xml
    paths:
      - validation-report.xml
    expire_in: 1 week

agentwise_testing:
  stage: test
  image: ubuntu:22.04
  <<: *agentwise_setup
  script:
    - claude --dangerously-skip-permissions &
    - sleep 5
    - agentwise-monitor test --comprehensive
  artifacts:
    reports:
      junit: test-results.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml
    paths:
      - test-results.xml
      - coverage.xml
    expire_in: 1 week

agentwise_deployment:
  stage: deploy
  image: ubuntu:22.04
  <<: *agentwise_setup
  script:
    - claude --dangerously-skip-permissions &
    - sleep 5
    - /task-deployment "deploy to $CI_ENVIRONMENT_NAME with full monitoring"
  environment:
    name: production
    url: https://production.example.com
  only:
    - main
```

### Jenkins Integration

Create `Jenkinsfile`:

```groovy
pipeline {
    agent any
    
    environment {
        CLAUDE_API_KEY = credentials('claude-api-key')
        NODE_VERSION = '18'
        AGENTWISE_VERSION = 'latest'
    }
    
    stages {
        stage('Setup') {
            steps {
                script {
                    // Install Node.js and Agentwise
                    sh '''
                        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
                        sudo apt-get install -y nodejs
                        npm install -g agentwise
                        curl -fsSL https://claude.ai/install | bash
                    '''
                }
            }
        }
        
        stage('Agentwise Validation') {
            steps {
                script {
                    sh '''
                        claude --dangerously-skip-permissions &
                        sleep 5
                        agentwise-monitor validate --project-path="${WORKSPACE}"
                    '''
                }
            }
            post {
                always {
                    publishTestResults testResultsPattern: 'validation-report.xml'
                }
            }
        }
        
        stage('Multi-Agent Testing') {
            parallel {
                stage('Frontend Testing') {
                    steps {
                        sh 'agentwise-monitor test --agent=frontend-specialist'
                    }
                }
                stage('Backend Testing') {
                    steps {
                        sh 'agentwise-monitor test --agent=backend-specialist'
                    }
                }
                stage('Security Testing') {
                    steps {
                        sh 'agentwise-monitor test --agent=security-specialist'
                    }
                }
            }
        }
        
        stage('Deployment') {
            when {
                branch 'main'
            }
            steps {
                script {
                    sh '''
                        /task-deployment "deploy to production with comprehensive monitoring and automated rollback"
                    '''
                }
            }
        }
    }
    
    post {
        always {
            publishTestResults testResultsPattern: '**/test-results.xml'
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'coverage',
                reportFiles: 'index.html',
                reportName: 'Coverage Report'
            ])
        }
        failure {
            script {
                sh 'agentwise-monitor rollback --to-last-known-good'
            }
        }
    }
}
```

### Azure DevOps Integration

Create `azure-pipelines.yml`:

```yaml
trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '18'
  agentwise.version: 'latest'

stages:
- stage: Validation
  displayName: 'Agentwise Validation'
  jobs:
  - job: ValidateProject
    displayName: 'Validate Project with Agentwise'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: $(nodeVersion)
      displayName: 'Install Node.js'
      
    - script: |
        npm install -g agentwise
        curl -fsSL https://claude.ai/install | bash
      displayName: 'Install Agentwise and Claude Code'
      
    - script: |
        claude --dangerously-skip-permissions &
        sleep 5
        agentwise-monitor validate --project-path="$(Build.SourcesDirectory)"
      displayName: 'Run Agentwise Validation'
      env:
        CLAUDE_API_KEY: $(CLAUDE_API_KEY)
        
    - task: PublishTestResults@2
      inputs:
        testResultsFormat: 'JUnit'
        testResultsFiles: 'validation-report.xml'
        mergeTestResults: true
      condition: always()

- stage: Testing
  displayName: 'Multi-Agent Testing'
  dependsOn: Validation
  jobs:
  - job: ComprehensiveTesting
    displayName: 'Run All Agent Tests'
    steps:
    - script: |
        agentwise-monitor test --all-agents --parallel
      displayName: 'Execute Multi-Agent Tests'
      env:
        CLAUDE_API_KEY: $(CLAUDE_API_KEY)

- stage: Deployment
  displayName: 'Production Deployment'
  dependsOn: Testing
  condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
  jobs:
  - deployment: DeployProduction
    displayName: 'Deploy to Production'
    environment: 'production'
    strategy:
      runOnce:
        deploy:
          steps:
          - script: |
              /task-deployment "deploy to Azure production with monitoring"
            displayName: 'Deploy with DevOps Specialist'
            env:
              CLAUDE_API_KEY: $(CLAUDE_API_KEY)
```

## Advanced CI/CD Patterns

### Multi-Environment Deployment

```yaml
name: Multi-Environment Deployment

on:
  push:
    branches: [ main, develop, feature/* ]

jobs:
  determine-environment:
    runs-on: ubuntu-latest
    outputs:
      environment: ${{ steps.determine.outputs.environment }}
    steps:
    - name: Determine target environment
      id: determine
      run: |
        if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
          echo "environment=production" >> $GITHUB_OUTPUT
        elif [[ "${{ github.ref }}" == "refs/heads/develop" ]]; then
          echo "environment=staging" >> $GITHUB_OUTPUT
        else
          echo "environment=development" >> $GITHUB_OUTPUT
        fi

  agentwise-deploy:
    needs: determine-environment
    runs-on: ubuntu-latest
    environment: ${{ needs.determine-environment.outputs.environment }}
    
    steps:
    - name: Deploy to ${{ needs.determine-environment.outputs.environment }}
      run: |
        /task-deployment "deploy to ${{ needs.determine-environment.outputs.environment }} with environment-specific configuration"
```

### Progressive Deployment with Monitoring

```yaml
name: Progressive Deployment

jobs:
  canary-deployment:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy Canary
      run: |
        /task-deployment "deploy canary version with 10% traffic"
        
    - name: Monitor Canary
      run: |
        agentwise-monitor watch --deployment=canary --duration=30m
        
    - name: Validate Canary Metrics
      run: |
        agentwise-monitor validate --deployment=canary --metrics=error-rate,latency,throughput

  full-deployment:
    needs: canary-deployment
    if: success()
    runs-on: ubuntu-latest
    steps:
    - name: Full Production Deployment
      run: |
        /task-deployment "promote canary to full production deployment"
```

### Automated Rollback on Failure

```yaml
name: Deployment with Automated Rollback

jobs:
  deploy-with-monitoring:
    runs-on: ubuntu-latest
    steps:
    - name: Deploy to Production
      id: deploy
      run: |
        /task-deployment "deploy to production with health checks"
        
    - name: Post-Deployment Health Check
      id: health-check
      run: |
        agentwise-monitor health-check --timeout=10m
        
    - name: Rollback on Failure
      if: failure()
      run: |
        /task-deployment "emergency rollback to previous stable version"
        agentwise-monitor alert --severity=critical --message="Deployment failed, rollback executed"
```

## Environment Configuration

### Environment-Specific Settings

Create environment configuration files:

**`.agentwise/environments/development.json`**:
```json
{
  "agents": {
    "enabled": ["frontend-specialist", "backend-specialist", "testing-specialist"],
    "parallelization": 2,
    "debug": true
  },
  "deployment": {
    "strategy": "direct",
    "monitoring": "basic",
    "rollback": "manual"
  },
  "testing": {
    "coverage_threshold": 70,
    "performance_budget": "relaxed"
  }
}
```

**`.agentwise/environments/production.json`**:
```json
{
  "agents": {
    "enabled": "all",
    "parallelization": 5,
    "debug": false
  },
  "deployment": {
    "strategy": "blue-green",
    "monitoring": "comprehensive",
    "rollback": "automatic"
  },
  "testing": {
    "coverage_threshold": 90,
    "performance_budget": "strict",
    "security_scanning": true
  }
}
```

### Secret Management

#### GitHub Secrets Integration

```yaml
- name: Deploy with Secrets
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    API_KEY: ${{ secrets.API_KEY }}
    CLAUDE_API_KEY: ${{ secrets.CLAUDE_API_KEY }}
  run: |
    /task-deployment "deploy with production secrets and encryption"
```

#### HashiCorp Vault Integration

```yaml
- name: Retrieve Secrets from Vault
  uses: hashicorp/vault-action@v2
  with:
    url: ${{ secrets.VAULT_URL }}
    token: ${{ secrets.VAULT_TOKEN }}
    secrets: |
      secret/production/database url | DATABASE_URL ;
      secret/production/api key | API_KEY

- name: Deploy with Vault Secrets
  run: |
    /task-deployment "deploy with Vault-managed secrets"
```

## Quality Gates and Validation

### Comprehensive Quality Pipeline

```yaml
name: Quality Gates Pipeline

jobs:
  code-quality:
    runs-on: ubuntu-latest
    steps:
    - name: Code Review with AI
      run: |
        agentwise-monitor review --agent=code-review-specialist
        
    - name: Security Scan
      run: |
        agentwise-monitor security-scan --comprehensive
        
    - name: Performance Analysis
      run: |
        agentwise-monitor performance --baseline=main
        
    - name: Quality Gate Check
      run: |
        agentwise-monitor quality-gate --strict
```

### Custom Quality Metrics

```yaml
- name: Custom Quality Validation
  run: |
    agentwise-monitor validate \
      --code-coverage=85 \
      --security-score=A \
      --performance-budget=2s \
      --accessibility-score=95
```

## Monitoring and Observability

### Continuous Monitoring Setup

```yaml
name: Continuous Monitoring

on:
  schedule:
    - cron: '0 * * * *'  # Every hour

jobs:
  health-monitoring:
    runs-on: ubuntu-latest
    steps:
    - name: System Health Check
      run: |
        agentwise-monitor health \
          --check-services \
          --check-performance \
          --check-security
          
    - name: Alert on Issues
      if: failure()
      run: |
        agentwise-monitor alert \
          --webhook=${{ secrets.SLACK_WEBHOOK }} \
          --severity=warning
```

### Performance Tracking

```yaml
- name: Performance Monitoring
  run: |
    agentwise-monitor performance \
      --track-metrics \
      --compare-baseline \
      --alert-thresholds
```

## Integration with External Tools

### Slack Integration

```yaml
- name: Notify Slack on Deployment
  uses: 8398a7/action-slack@v3
  with:
    status: custom
    custom_payload: |
      {
        "text": "Agentwise deployment completed",
        "attachments": [{
          "color": "good",
          "fields": [{
            "title": "Environment",
            "value": "${{ env.ENVIRONMENT }}",
            "short": true
          }, {
            "title": "Agents Used",
            "value": "${{ env.ACTIVE_AGENTS }}",
            "short": true
          }]
        }]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### Jira Integration

```yaml
- name: Update Jira on Deployment
  run: |
    agentwise-monitor jira-update \
      --project=${{ env.JIRA_PROJECT }} \
      --issue=${{ env.JIRA_ISSUE }} \
      --status="Deployed" \
      --comment="Deployed via Agentwise CI/CD"
```

## Best Practices

### Security Best Practices

1. **Secret Management**: Never commit secrets to repositories
2. **Principle of Least Privilege**: Grant minimal necessary permissions
3. **Audit Trails**: Maintain comprehensive deployment logs
4. **Security Scanning**: Include security validation in all pipelines

### Performance Optimization

1. **Parallel Agent Execution**: Utilize multiple agents simultaneously
2. **Caching**: Cache dependencies and build artifacts
3. **Incremental Builds**: Only rebuild changed components
4. **Resource Limits**: Set appropriate resource limits for agents

### Reliability Patterns

1. **Health Checks**: Implement comprehensive health monitoring
2. **Graceful Degradation**: Handle agent failures gracefully
3. **Circuit Breakers**: Prevent cascade failures
4. **Automated Recovery**: Implement self-healing mechanisms

## Troubleshooting

### Common Issues

#### Agent Not Found in CI/CD
```bash
# Check agent availability
agentwise-monitor agents --list

# Verify agent configuration
agentwise-monitor config --validate
```

#### Permission Issues
```bash
# Check Claude Code permissions
claude --version --check-permissions

# Verify API key configuration
echo $CLAUDE_API_KEY | head -c 10
```

#### Deployment Failures
```bash
# Check deployment logs
agentwise-monitor logs --deployment --tail=100

# Validate deployment configuration
agentwise-monitor validate --deployment-config
```

### Debug Mode

Enable debug mode for detailed logging:

```yaml
- name: Debug Agentwise Pipeline
  env:
    AGENTWISE_DEBUG: true
    AGENTWISE_LOG_LEVEL: debug
  run: |
    agentwise-monitor debug --full-trace
```

## Advanced Configurations

### Custom Agent Selection in CI/CD

```yaml
- name: Context-Aware Agent Selection
  run: |
    PROJECT_TYPE=$(agentwise-monitor analyze --project-type)
    
    if [ "$PROJECT_TYPE" == "web-app" ]; then
      AGENTS="frontend-specialist,backend-specialist,testing-specialist"
    elif [ "$PROJECT_TYPE" == "api" ]; then
      AGENTS="backend-specialist,database-specialist,security-specialist"
    fi
    
    agentwise-monitor deploy --agents="$AGENTS"
```

### Dynamic Pipeline Generation

```yaml
- name: Generate Dynamic Pipeline
  run: |
    agentwise-monitor generate-pipeline \
      --based-on-project \
      --output=.github/workflows/dynamic-pipeline.yml
      
    git add .github/workflows/dynamic-pipeline.yml
    git commit -m "Update dynamic pipeline configuration"
```

This comprehensive CI/CD integration enables teams to leverage Agentwise's full potential in automated development workflows, ensuring consistent quality, security, and performance across all deployments.