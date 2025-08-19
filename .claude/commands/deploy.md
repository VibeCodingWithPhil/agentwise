---
description: Deploy project to specified environment
argument-hint: [environment]
allowed-tools: Bash, Read, Write, Edit, Task
---

# Deploy Project

Deploy the active project to environment: $ARGUMENTS

Steps:
1. Get active project from registry
2. Navigate to workspace/[project-name]/
3. Analyze project structure for deployment requirements
4. Generate deployment configuration if not exists
5. Invoke deployment specialist agent:
   ```
   /agent "deployment-specialist"
   ```
6. Agent responsibilities:
   - Review deployment configuration
   - Create/update CI/CD pipelines
   - Generate Docker/container files
   - Set up environment variables
   - Configure monitoring and logging
   - Create deployment scripts
   - Run deployment process

Deployment environments:
- **development**: Local/dev server deployment
- **staging**: Pre-production environment
- **production**: Live production deployment

Deployment providers supported:
- AWS (EC2, ECS, Lambda)
- Google Cloud Platform
- Azure
- Heroku
- Vercel
- Netlify
- Custom VPS

The deployment specialist will:
1. Analyze the project architecture
2. Generate appropriate deployment files
3. Configure CI/CD pipelines
4. Set up monitoring
5. Execute deployment
6. Run health checks
7. Provide deployment summary

Use `/rollback` if deployment fails and rollback is needed.