# Create Project - Unified Project Wizard

Create a new project with AI-powered assistance, including requirements generation, database setup, GitHub integration, and protection systems.

## Overview

The Unified Project Wizard is the crown jewel of Agentwise that brings together all our powerful systems into one seamless experience:

- 🧠 **AI Requirements Generation** - Intelligent project analysis and specification
- 🗄️ **Database Integration** - Automated setup with type generation
- 🐙 **GitHub Integration** - Repository creation, workflows, and protection
- 🛡️ **Protection System** - Security monitoring, auto-commits, and backups
- 📊 **Progress Tracking** - Real-time status and beautiful terminal UI

## Usage

### Basic Usage
```bash
# Create a new project interactively
npx agentwise create-project my-app

# Specify project path
npx agentwise create-project my-app --path ./projects/my-app

# Use a specific template
npx agentwise create-project my-api --template "Express API Server"
```

### Advanced Options
```bash
# Non-interactive mode with auto-confirm
npx agentwise create-project my-app --no-interactive --auto-confirm

# Skip specific steps
npx agentwise create-project my-app --skip database,github

# Verbose output for debugging
npx agentwise create-project my-app --verbose

# Dry run to see what would happen
npx agentwise create-project my-app --dry-run
```

### Template Options
```bash
# List available templates
npx agentwise create-project --list-templates

# Use built-in templates
npx agentwise create-project my-app --template "Next.js Full-Stack App"
npx agentwise create-project my-api --template "Express API Server"  
npx agentwise create-project my-tool --template "CLI Tool"
npx agentwise create-project my-frontend --template "React Frontend App"
```

## Command Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--path <path>` | `-p` | Project directory path | `./[project-name]` |
| `--template <name>` | `-t` | Project template to use | Interactive selection |
| `--interactive` | `-i` | Run in interactive mode | `true` |
| `--auto-confirm` | `-y` | Auto-confirm all prompts | `false` |
| `--skip <steps>` | `-s` | Skip comma-separated steps | `[]` |
| `--verbose` | `-v` | Verbose output | `false` |
| `--dry-run` | `-n` | Show what would be done without executing | `false` |
| `--timeout <minutes>` | | Maximum execution time | `60` |
| `--max-retries <count>` | | Maximum step retries | `3` |
| `--theme <name>` | | UI theme (default, dark, light, colorful, minimal) | `default` |
| `--no-colors` | | Disable colored output | `false` |
| `--list-templates` | | List available project templates | |
| `--config <file>` | `-c` | Use configuration file | |
| `--save-config <file>` | | Save current options as config | |

## Available Steps

The wizard includes the following steps that can be customized or skipped:

1. **initialization** - Create project directory and basic structure
2. **requirements** - AI-powered requirements generation and analysis  
3. **database** - Database setup, type generation, and MCP configuration
4. **github** - Repository creation, workflows, and branch protection
5. **protection** - Security monitoring, auto-commits, and backup systems
6. **summary** - Project documentation and next steps generation
7. **finalization** - Cleanup and final validation

## Project Templates

### Next.js Full-Stack App
Complete React application with TypeScript, database, and authentication.
- **Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Prisma
- **Features:** SSR, Authentication, Database, API Routes, Responsive UI
- **Estimated Time:** 45 minutes
- **Complexity:** Moderate

### Express API Server  
REST API server with TypeScript, database, and authentication.
- **Tech Stack:** Express, TypeScript, Prisma, Jest, Helmet
- **Features:** REST API, Authentication, Validation, Security, Testing
- **Estimated Time:** 30 minutes
- **Complexity:** Simple

### React Frontend App
Modern React application with TypeScript and styling.
- **Tech Stack:** React, TypeScript, Vite, Tailwind CSS, React Router
- **Features:** SPA, Routing, State Management, Responsive UI
- **Estimated Time:** 20 minutes
- **Complexity:** Simple

### CLI Tool
Command-line application with TypeScript and testing.
- **Tech Stack:** Node.js, TypeScript, Commander.js, Inquirer, Jest
- **Features:** CLI Interface, Configuration, Help System, Testing
- **Estimated Time:** 25 minutes
- **Complexity:** Simple

## Configuration File

You can use a configuration file to preset options:

```json
{
  "projectName": "my-app",
  "projectPath": "./my-app",
  "template": "Next.js Full-Stack App",
  "interactive": true,
  "skipSteps": [],
  "preferences": {
    "preferredLanguages": ["typescript"],
    "preferredFrameworks": ["react", "next.js"],
    "preferredDatabase": "postgresql",
    "alwaysUseGit": true,
    "alwaysSetupDatabase": true,
    "alwaysEnableProtection": false,
    "securityLevel": "standard",
    "useColorOutput": true,
    "verboseOutput": false
  }
}
```

Usage:
```bash
npx agentwise create-project --config ./project-config.json
```

## Interactive Wizard Flow

When running interactively, the wizard will guide you through:

1. **Welcome & System Check** - Verify prerequisites and show overview
2. **Template Selection** - Choose from recommended templates based on your preferences
3. **Project Configuration** - Customize project name, path, and options
4. **Step Confirmation** - Review which steps will be executed
5. **Execution** - Watch real-time progress with beautiful terminal UI
6. **Summary** - Review what was created and get next steps

## Examples

### Create a Full-Stack Web Application
```bash
npx agentwise create-project ecommerce-app \
  --template "Next.js Full-Stack App" \
  --path ./projects/ecommerce-app \
  --verbose
```

This creates a complete Next.js application with:
- TypeScript configuration
- Tailwind CSS for styling  
- Prisma database setup
- GitHub repository with workflows
- Security monitoring and protection
- Comprehensive documentation

### Create an API Server
```bash
npx agentwise create-project my-api \
  --template "Express API Server" \
  --skip github,protection \
  --auto-confirm
```

This creates an Express API server with database but skips GitHub and protection setup.

### Create with Custom Configuration
```bash
# Save your preferences
npx agentwise create-project my-app --save-config ./my-template.json

# Use saved configuration later
npx agentwise create-project another-app --config ./my-template.json
```

## Output and Files

The wizard creates a comprehensive project structure:

### Generated Files
- **requirements.json** - Detailed project requirements
- **REQUIREMENTS.md** - Human-readable requirements document
- **project-summary.json** - Complete setup summary with statistics
- **PROJECT-SUMMARY.md** - Comprehensive project documentation
- **package.json** - Node.js dependencies and scripts
- **tsconfig.json** - TypeScript configuration
- **.eslintrc.json** - Code linting rules
- **prettier.config.js** - Code formatting rules

### Database Files (if enabled)
- **prisma/schema.prisma** - Database schema definition
- **.env** - Environment variables with database connection
- **types/database.ts** - Generated TypeScript types

### GitHub Files (if enabled)
- **.github/workflows/ci.yml** - Continuous integration workflow
- **.github/workflows/deploy.yml** - Deployment workflow (for web apps)
- **.gitignore** - Git ignore rules
- **README.md** - Project documentation

### Protection Files (if enabled)
- **.protection.config.json** - Security and protection configuration
- **.monitoring.config.json** - Monitoring and alerting configuration
- **.backup.config.json** - Backup strategy configuration

## Next Steps After Creation

The wizard provides personalized next steps, typically including:

1. **Development Setup**
   ```bash
   cd my-app
   npm install
   npm run dev
   ```

2. **Database Setup** (if enabled)
   ```bash
   npm run db:migrate
   npm run db:seed
   npm run db:studio
   ```

3. **Git Integration** (if enabled)
   ```bash
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

4. **Development Tasks**
   - Review and customize generated requirements
   - Implement your first feature or API endpoint
   - Set up testing framework
   - Configure additional tooling

## Troubleshooting

### Common Issues

**Permission Errors**
```bash
# Run with appropriate permissions
sudo npx agentwise create-project my-app
```

**Git Not Found**
```bash
# Install Git first
brew install git  # macOS
apt-get install git  # Ubuntu
```

**Node.js Version Issues**
```bash
# Use Node.js 16 or higher
node --version
nvm use 18  # If using nvm
```

**Database Connection Issues**
- Check your database provider credentials
- Ensure database server is running
- Verify network connectivity

### Debug Mode
```bash
# Enable verbose logging
npx agentwise create-project my-app --verbose

# Save session logs
npx agentwise create-project my-app --verbose > wizard.log 2>&1
```

### Getting Help

- Check the generated **PROJECT-SUMMARY.md** for project-specific guidance
- Review **requirements.json** for detailed specifications  
- Visit GitHub workflows in **.github/workflows/** for CI/CD setup
- Check **.protection.config.json** for security configuration

## User Preferences

The wizard learns from your choices and automatically detects project preferences:

- **Auto-Detection** - Analyzes existing files to suggest frameworks and tools
- **Preference Learning** - Remembers your choices for future projects
- **Smart Defaults** - Provides intelligent suggestions based on project type
- **Configuration Saving** - Save and reuse project templates

Preferences are stored in `~/.agentwise/wizard-preferences.json` and can be customized:

```json
{
  "preferredLanguages": ["typescript", "javascript"],
  "preferredFrameworks": ["react", "next.js", "express"],
  "preferredDatabase": "postgresql", 
  "defaultProjectType": "web-application",
  "alwaysUseGit": true,
  "preferPrivateRepos": false,
  "alwaysSetupDatabase": false,
  "alwaysEnableProtection": false,
  "securityLevel": "standard",
  "useColorOutput": true,
  "showProgressBars": true,
  "verboseOutput": false
}
```

## Integration with Other Commands

The create-project wizard integrates seamlessly with other Agentwise commands:

```bash
# Check project status after creation
npx agentwise project-status

# Add database to existing project
npx agentwise database-connect

# Set up GitHub integration
npx agentwise github-setup

# Enable protection system
npx agentwise enable-protection
```

---

The Unified Project Wizard represents the culmination of Agentwise capabilities, providing a polished, user-friendly experience that handles all edge cases gracefully while creating professional, well-structured projects ready for development.

**Happy coding! 🚀**