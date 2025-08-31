# Complete Project Setup Wizard

One command to set up everything: requirements, database, GitHub, and protection.

## Quick Start

```bash
# Complete project setup with interactive wizard
/create-project "an e-commerce platform with Next.js"
```

The wizard will guide you through:
1. Requirements generation
2. Visual specification
3. Database setup (optional)
4. GitHub integration (optional)
5. Protection system (optional)
6. Agent selection
7. Task distribution

## How It Works

### Step 1: Project Analysis
AI analyzes your idea and generates comprehensive requirements including:
- Feature list
- Tech stack recommendations
- Timeline estimation
- Team structure

### Step 2: Optional Features
Choose which features to enable:
- **Database**: Supabase, Neon, PlanetScale, or local PostgreSQL
- **GitHub**: Repository creation, CI/CD, branch protection
- **Protection**: Automatic backups, security scanning, code review

### Step 3: Automatic Setup
Everything configured automatically with best practices:
- Zero manual configuration
- Credentials securely stored
- Type generation
- Migration setup
- CI/CD pipelines

## Integrated Features

- ✅ Requirements Planning System
- ✅ Visual Specification Generator
- ✅ Database Integration (Supabase/Neon)
- ✅ GitHub Repository Setup
- ✅ CI/CD Pipeline Configuration
- ✅ Automated Protection System
- ✅ Security Scanning
- ✅ Backup Management

## Wizard Options

### Work Modes
- **Full Integration Mode**: All features enabled
- **Local-Only Mode**: No external services
- **Custom Configuration**: Choose specific features

### Database Providers
- Supabase (Recommended)
- Neon
- PlanetScale
- Local PostgreSQL

### Protection Levels
- **Basic**: Backup only
- **Standard**: Backup + Security
- **Advanced**: Full protection + Auto-commit

## Example Session

```bash
$ /create-project "task management app with real-time updates"

🚀 Agentwise Project Setup Wizard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Step 1: Analyzing Requirements...
✅ Generated 15 features
✅ Identified tech stack: Next.js, Socket.io, PostgreSQL
✅ Estimated timeline: 6 weeks

📊 Step 2: Creating Visual Specification...
✅ HTML specification generated
🌐 View at: http://localhost:3002/spec

🗄️ Step 3: Database Setup
? Select database provider: Supabase (Recommended)
✅ Supabase configured successfully
📝 Connection string saved to .env.local

🔐 Step 4: GitHub Integration
? Enable GitHub integration? Y
✅ Repository created: task-management-app
✅ CI/CD pipeline configured
✅ Branch protection enabled

🛡️ Step 5: Protection System
? Enable automated protection? Y
✅ Auto-backup enabled
✅ Security scanning active
✅ Code review automation configured

🤖 Step 6: Agent Selection
✅ Selected agents:
  • Frontend Specialist
  • Backend Specialist
  • Database Specialist
  • Testing Specialist

🎯 Step 7: Task Distribution
✅ Created 47 tasks across 3 phases
✅ Agents starting work in parallel...

✨ Project setup complete!
📁 Location: workspace/task-management-app
🚀 Run: cd workspace/task-management-app && npm start
📊 Monitor: /monitor
```

## Traditional vs Agentwise Setup

### Traditional Setup (2-3 hours)
- Manual configuration of each service
- Multiple tools and platforms
- Error-prone manual steps
- Inconsistent configurations
- Security often overlooked

### Agentwise Wizard (5 minutes)
- Single unified command
- Automated best practices
- Consistent every time
- Security built-in
- Zero manual configuration

## Benefits

- **5-minute setup** vs 2-3 hours traditional
- **Zero configuration** required
- **Best practices** automatically applied
- **Security** built-in from the start
- **Consistent** results every time
- **All features** integrated seamlessly

## Related Commands

- `/requirements` - Generate requirements only
- `/database-wizard` - Database setup only
- `/github-setup` - GitHub integration only
- `/enable-protection` - Protection system only
- `/monitor` - Monitor agent progress