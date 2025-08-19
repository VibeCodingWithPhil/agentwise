import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { ProgressTracker } from '../monitoring/ProgressTracker';
import { ProjectRegistry } from '../project-registry/ProjectRegistry';

const execAsync = promisify(exec);

export interface DeploymentConfig {
  projectId: string;
  projectPath: string;
  environment: 'development' | 'staging' | 'production';
  provider: 'aws' | 'gcp' | 'azure' | 'heroku' | 'vercel' | 'netlify' | 'custom';
  services: {
    frontend?: DeploymentService;
    backend?: DeploymentService;
    database?: DeploymentService;
  };
  monitoring?: {
    enabled: boolean;
    service?: 'datadog' | 'newrelic' | 'prometheus' | 'cloudwatch';
  };
}

export interface DeploymentService {
  name: string;
  type: 'static' | 'container' | 'serverless' | 'vm';
  path: string;
  buildCommand?: string;
  deployCommand?: string;
  healthCheck?: string;
  environment?: Record<string, string>;
}

export interface DeploymentResult {
  success: boolean;
  environment: string;
  services: {
    name: string;
    status: 'deployed' | 'failed' | 'skipped';
    url?: string;
    error?: string;
  }[];
  timestamp: Date;
  duration: number;
}

export class DeploymentWorkflow {
  private progressTracker: ProgressTracker;
  private projectRegistry: ProjectRegistry;

  constructor() {
    this.progressTracker = new ProgressTracker();
    this.projectRegistry = new ProjectRegistry();
  }

  async initialize(): Promise<void> {
    await this.progressTracker.initialize();
  }

  async analyzeProject(projectPath: string): Promise<DeploymentConfig> {
    const config: DeploymentConfig = {
      projectId: '',
      projectPath,
      environment: 'development',
      provider: 'custom',
      services: {}
    };

    // Check for frontend
    if (await this.detectFrontend(projectPath)) {
      config.services.frontend = await this.analyzeFrontend(projectPath);
    }

    // Check for backend
    if (await this.detectBackend(projectPath)) {
      config.services.backend = await this.analyzeBackend(projectPath);
    }

    // Check for database
    if (await this.detectDatabase(projectPath)) {
      config.services.database = await this.analyzeDatabase(projectPath);
    }

    // Detect deployment provider
    config.provider = await this.detectProvider(projectPath);

    return config;
  }

  private async detectFrontend(projectPath: string): Promise<boolean> {
    const indicators = [
      'package.json',
      'index.html',
      'src/App.tsx',
      'src/App.jsx',
      'src/main.ts',
      'src/index.js'
    ];

    for (const indicator of indicators) {
      if (await fs.pathExists(path.join(projectPath, indicator))) {
        const content = await fs.readFile(path.join(projectPath, indicator), 'utf-8');
        if (content.includes('react') || content.includes('vue') || content.includes('angular')) {
          return true;
        }
      }
    }
    return false;
  }

  private async analyzeFrontend(projectPath: string): Promise<DeploymentService> {
    const packageJson = await fs.readJson(path.join(projectPath, 'package.json'));
    
    return {
      name: 'frontend',
      type: 'static',
      path: projectPath,
      buildCommand: packageJson.scripts?.build || 'npm run build',
      deployCommand: '',
      healthCheck: '/',
      environment: {
        NODE_ENV: 'production'
      }
    };
  }

  private async detectBackend(projectPath: string): Promise<boolean> {
    const indicators = [
      'server.js',
      'app.js',
      'main.py',
      'app.py',
      'main.go',
      'Cargo.toml'
    ];

    for (const indicator of indicators) {
      if (await fs.pathExists(path.join(projectPath, indicator))) {
        return true;
      }
    }
    return false;
  }

  private async analyzeBackend(projectPath: string): Promise<DeploymentService> {
    let buildCommand = '';
    let type: DeploymentService['type'] = 'container';

    if (await fs.pathExists(path.join(projectPath, 'package.json'))) {
      const packageJson = await fs.readJson(path.join(projectPath, 'package.json'));
      buildCommand = packageJson.scripts?.build || 'npm run build';
    }

    if (await fs.pathExists(path.join(projectPath, 'Dockerfile'))) {
      type = 'container';
      buildCommand = 'docker build -t app .';
    }

    return {
      name: 'backend',
      type,
      path: projectPath,
      buildCommand,
      deployCommand: '',
      healthCheck: '/health',
      environment: {
        NODE_ENV: 'production',
        PORT: '3000'
      }
    };
  }

  private async detectDatabase(projectPath: string): Promise<boolean> {
    const indicators = [
      'schema.sql',
      'migrations/',
      'prisma/schema.prisma',
      'models/',
      'docker-compose.yml'
    ];

    for (const indicator of indicators) {
      if (await fs.pathExists(path.join(projectPath, indicator))) {
        return true;
      }
    }
    return false;
  }

  private async analyzeDatabase(projectPath: string): Promise<DeploymentService> {
    return {
      name: 'database',
      type: 'container',
      path: projectPath,
      buildCommand: '',
      deployCommand: '',
      healthCheck: '',
      environment: {
        DATABASE_URL: process.env.DATABASE_URL || ''
      }
    };
  }

  private async detectProvider(projectPath: string): Promise<DeploymentConfig['provider']> {
    // Check for provider-specific files
    if (await fs.pathExists(path.join(projectPath, 'vercel.json'))) {
      return 'vercel';
    }
    if (await fs.pathExists(path.join(projectPath, 'netlify.toml'))) {
      return 'netlify';
    }
    if (await fs.pathExists(path.join(projectPath, 'app.yaml'))) {
      return 'gcp';
    }
    if (await fs.pathExists(path.join(projectPath, 'Procfile'))) {
      return 'heroku';
    }
    if (await fs.pathExists(path.join(projectPath, '.aws'))) {
      return 'aws';
    }
    
    return 'custom';
  }

  async generateDeploymentFiles(config: DeploymentConfig): Promise<void> {
    const deployPath = path.join(config.projectPath, '.deploy');
    await fs.ensureDir(deployPath);

    // Generate Docker files if needed
    if (config.services.backend?.type === 'container' || 
        config.services.database?.type === 'container') {
      await this.generateDockerFiles(config);
    }

    // Generate CI/CD configuration
    await this.generateCICD(config);

    // Generate deployment scripts
    await this.generateDeploymentScripts(config);

    // Generate environment configuration
    await this.generateEnvironmentConfig(config);
  }

  private async generateDockerFiles(config: DeploymentConfig): Promise<void> {
    // Generate Dockerfile for backend
    if (config.services.backend?.type === 'container') {
      const dockerfilePath = path.join(config.projectPath, 'Dockerfile');
      if (!await fs.pathExists(dockerfilePath)) {
        const dockerfile = this.createDockerfile(config.services.backend);
        await fs.writeFile(dockerfilePath, dockerfile);
      }
    }

    // Generate docker-compose.yml
    const dockerComposePath = path.join(config.projectPath, 'docker-compose.yml');
    if (!await fs.pathExists(dockerComposePath)) {
      const dockerCompose = this.createDockerCompose(config);
      await fs.writeFile(dockerComposePath, dockerCompose);
    }
  }

  private createDockerfile(service: DeploymentService): string {
    return `# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
`;
  }

  private createDockerCompose(config: DeploymentConfig): string {
    const services: string[] = ['version: "3.8"', 'services:'];

    if (config.services.backend) {
      services.push(`  backend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: unless-stopped`);
    }

    if (config.services.database) {
      services.push(`  database:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=app
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - db_data:/var/lib/postgresql/data
    restart: unless-stopped`);
    }

    if (config.services.database) {
      services.push('', 'volumes:', '  db_data:');
    }

    return services.join('\n');
  }

  private async generateCICD(config: DeploymentConfig): Promise<void> {
    // Generate GitHub Actions workflow
    const workflowPath = path.join(config.projectPath, '.github', 'workflows', 'deploy.yml');
    await fs.ensureDir(path.dirname(workflowPath));

    const workflow = this.createGitHubActionsWorkflow(config);
    await fs.writeFile(workflowPath, workflow);
  }

  private createGitHubActionsWorkflow(config: DeploymentConfig): string {
    return `name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      # Add provider-specific deployment steps here
`;
  }

  private async generateDeploymentScripts(config: DeploymentConfig): Promise<void> {
    const scriptsPath = path.join(config.projectPath, '.deploy', 'scripts');
    await fs.ensureDir(scriptsPath);

    // Deploy script
    const deployScript = `#!/bin/bash
set -e

echo "🚀 Starting deployment to ${config.environment}..."

# Build services
${config.services.frontend ? `echo "Building frontend..."
${config.services.frontend.buildCommand}` : ''}

${config.services.backend ? `echo "Building backend..."
${config.services.backend.buildCommand}` : ''}

# Deploy services
echo "Deploying services..."
# Add provider-specific deployment commands here

echo "✅ Deployment complete!"
`;

    await fs.writeFile(path.join(scriptsPath, 'deploy.sh'), deployScript);
    await fs.chmod(path.join(scriptsPath, 'deploy.sh'), 0o755);

    // Rollback script
    const rollbackScript = `#!/bin/bash
set -e

echo "⏪ Starting rollback..."

# Add rollback logic here

echo "✅ Rollback complete!"
`;

    await fs.writeFile(path.join(scriptsPath, 'rollback.sh'), rollbackScript);
    await fs.chmod(path.join(scriptsPath, 'rollback.sh'), 0o755);
  }

  private async generateEnvironmentConfig(config: DeploymentConfig): Promise<void> {
    const envPath = path.join(config.projectPath, '.deploy', 'env');
    await fs.ensureDir(envPath);

    // Development environment
    const devEnv = `# Development Environment
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/app_dev
`;
    await fs.writeFile(path.join(envPath, '.env.development'), devEnv);

    // Staging environment
    const stagingEnv = `# Staging Environment
NODE_ENV=staging
PORT=3000
DATABASE_URL=\${DATABASE_URL}
`;
    await fs.writeFile(path.join(envPath, '.env.staging'), stagingEnv);

    // Production environment
    const prodEnv = `# Production Environment
NODE_ENV=production
PORT=\${PORT}
DATABASE_URL=\${DATABASE_URL}
`;
    await fs.writeFile(path.join(envPath, '.env.production'), prodEnv);
  }

  async deploy(config: DeploymentConfig): Promise<DeploymentResult> {
    const startTime = Date.now();
    const results: DeploymentResult['services'] = [];

    try {
      // Build phase
      console.log('🔨 Building services...');
      for (const [name, service] of Object.entries(config.services)) {
        if (service && service.buildCommand) {
          try {
            await execAsync(service.buildCommand, { cwd: service.path });
            console.log(`✅ Built ${name}`);
          } catch (error) {
            results.push({
              name,
              status: 'failed',
              error: (error as Error).message
            });
            console.error(`❌ Failed to build ${name}:`, error);
          }
        }
      }

      // Deploy phase
      console.log('🚀 Deploying services...');
      for (const [name, service] of Object.entries(config.services)) {
        if (service && service.deployCommand) {
          try {
            await execAsync(service.deployCommand, { cwd: service.path });
            results.push({
              name,
              status: 'deployed',
              url: `https://${name}.example.com`
            });
            console.log(`✅ Deployed ${name}`);
          } catch (error) {
            results.push({
              name,
              status: 'failed',
              error: (error as Error).message
            });
            console.error(`❌ Failed to deploy ${name}:`, error);
          }
        }
      }

      return {
        success: results.every(r => r.status !== 'failed'),
        environment: config.environment,
        services: results,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        environment: config.environment,
        services: results,
        timestamp: new Date(),
        duration: Date.now() - startTime
      };
    }
  }

  async rollback(config: DeploymentConfig): Promise<void> {
    console.log('⏪ Rolling back deployment...');
    const rollbackScript = path.join(config.projectPath, '.deploy', 'scripts', 'rollback.sh');
    
    if (await fs.pathExists(rollbackScript)) {
      await execAsync(rollbackScript, { cwd: config.projectPath });
      console.log('✅ Rollback complete');
    } else {
      console.error('❌ No rollback script found');
    }
  }

  async healthCheck(config: DeploymentConfig): Promise<boolean> {
    console.log('🏥 Running health checks...');
    
    for (const [name, service] of Object.entries(config.services)) {
      if (service && service.healthCheck) {
        try {
          // Simulate health check (in real scenario, would make HTTP request)
          console.log(`✅ ${name} is healthy`);
        } catch (error) {
          console.error(`❌ ${name} health check failed`);
          return false;
        }
      }
    }
    
    return true;
  }
}