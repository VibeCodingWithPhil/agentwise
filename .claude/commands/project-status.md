# Project Status - Complete Project Overview

View comprehensive status of Agentwise projects, including setup completion, health metrics, recent activity, and recommendations.

## Overview

The Project Status command provides a complete overview of your Agentwise-managed projects, showing:

- 📊 **Setup Status** - Which components are configured and working
- 🔍 **Health Monitoring** - Real-time system health and performance
- 📈 **Activity Summary** - Recent commits, scans, backups, and alerts
- 🎯 **Progress Tracking** - Development milestones and timeline
- 💡 **Smart Recommendations** - Actionable insights for improvement
- 🛡️ **Security Overview** - Vulnerability status and protection health

## Usage

### Basic Status Check
```bash
# Show status for current directory
npx agentwise project-status

# Show status for specific project
npx agentwise project-status --path /path/to/project

# Show detailed status with all metrics
npx agentwise project-status --detailed
```

### Specific Component Status
```bash
# Check only database status
npx agentwise project-status --component database

# Check protection system status
npx agentwise project-status --component protection

# Check GitHub integration status  
npx agentwise project-status --component github

# Check multiple components
npx agentwise project-status --component database,github,protection
```

### Output Formats
```bash
# JSON output for scripts
npx agentwise project-status --format json

# Markdown report
npx agentwise project-status --format markdown --output status-report.md

# CSV export for spreadsheet analysis
npx agentwise project-status --format csv --output project-metrics.csv

# Terminal table format (default)
npx agentwise project-status --format table
```

## Command Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--path <path>` | `-p` | Project directory path | Current directory |
| `--component <names>` | `-c` | Specific components to check | All |
| `--detailed` | `-d` | Show detailed metrics and logs | `false` |
| `--format <type>` | `-f` | Output format (table, json, markdown, csv) | `table` |
| `--output <file>` | `-o` | Save output to file | Console |
| `--watch` | `-w` | Watch mode with live updates | `false` |
| `--history <days>` | `-h` | Show history for N days | `7` |
| `--no-colors` | | Disable colored output | `false` |
| `--quiet` | `-q` | Minimal output | `false` |
| `--verbose` | `-v` | Verbose output with debug info | `false` |
| `--refresh` | `-r` | Force refresh cached status | `false` |
| `--alerts-only` | | Show only projects with alerts | `false` |
| `--summary` | `-s` | Show summary across all projects | `false` |

## Status Components

### Project Overview
- **Project Name & Type** - Basic project information
- **Creation Date** - When the project was created with Agentwise
- **Last Activity** - Most recent activity timestamp
- **Overall Health** - Aggregate health score (0-100)
- **Setup Completion** - Percentage of wizard steps completed

### Requirements Status
```
📋 Requirements: ✅ Generated
   ├── Features Defined: 12 features
   ├── Tech Stack: Next.js, TypeScript, Prisma
   ├── Timeline: 35 days estimated
   ├── Complexity: Moderate
   └── Last Updated: 2 days ago
```

### Database Integration
```
🗄️ Database: ✅ Configured (PostgreSQL)
   ├── Connection: ✅ Active (15ms latency)
   ├── Schema: ✅ Up to date (3 tables)
   ├── Types: ✅ Generated (last sync: 1 hour ago)
   ├── MCP Server: ✅ Running
   ├── Migrations: ✅ All applied (latest: 2023-12-01)
   └── Backup: ✅ Daily backups enabled
```

### GitHub Integration
```
🐙 GitHub: ✅ Connected (my-org/my-project)
   ├── Repository: ✅ Active (15 commits this week)
   ├── Branch Protection: ✅ Enabled on main
   ├── Workflows: ✅ 2 active (CI, Deploy)
   ├── Last CI Run: ✅ Passed (5 minutes ago)
   ├── Security Alerts: ⚠️ 2 medium vulnerabilities
   └── Collaborators: 3 active developers
```

### Protection System
```
🛡️ Protection: ✅ Active (Standard Security)
   ├── Auto-Commit: ✅ Running (last commit: 30 minutes ago)
   ├── Security Monitoring: ✅ Active (last scan: 1 hour ago)
   ├── Backup System: ✅ Healthy (last backup: 4 hours ago)
   ├── Quality Metrics: 📊 85/100 score
   ├── Vulnerabilities: ⚠️ 3 medium, 1 low
   └── Uptime: ✅ 99.8% (last 30 days)
```

### Development Progress
```
🚀 Development: 📈 65% Complete
   ├── Current Phase: Core Development (Day 15/21)
   ├── Next Milestone: MVP Complete (in 6 days)
   ├── Features: 8/12 completed
   ├── Test Coverage: 74% (target: 80%)
   ├── Code Quality: B+ grade
   └── Technical Debt: 4.2 days estimated
```

## Status Indicators

### Health Colors
- 🟢 **Green** - Healthy, all systems operational
- 🟡 **Yellow** - Warning, attention needed but functional  
- 🔴 **Red** - Critical issue, immediate action required
- ⚫ **Gray** - Offline, disabled, or not configured

### Common Status Icons
- ✅ **Success** - Component is working properly
- ⚠️ **Warning** - Minor issues or recommendations
- ❌ **Error** - Serious problems requiring attention
- ⏭️ **Skipped** - Component was not set up
- 🔄 **In Progress** - Currently being processed
- ⏸️ **Paused** - Temporarily disabled
- 🛠️ **Maintenance** - Under maintenance

## Detailed Metrics

### Performance Metrics
```bash
# Show detailed performance data
npx agentwise project-status --detailed --component performance
```

Output includes:
- **Response Times** - API and database response times
- **Resource Usage** - CPU, memory, disk usage
- **Request Rates** - API requests per minute/hour
- **Error Rates** - Error percentages and trends
- **Throughput** - Data processing rates

### Security Metrics
```bash
# Show security analysis
npx agentwise project-status --detailed --component security
```

Includes:
- **Vulnerability Scan Results** - OWASP, dependency, and code analysis
- **Security Score** - Overall security rating
- **Recent Security Events** - Alerts and incidents
- **Compliance Status** - GDPR, SOC2, etc. compliance
- **Access Patterns** - Authentication and authorization metrics

### Quality Metrics
```bash
# Show code quality analysis
npx agentwise project-status --detailed --component quality
```

Shows:
- **Code Coverage** - Test coverage percentages
- **Complexity Scores** - Cyclomatic complexity analysis
- **Maintainability Index** - Code maintainability rating
- **Technical Debt** - Estimated debt and trends
- **Style Violations** - Linting and formatting issues

## Watch Mode

Monitor project status in real-time:

```bash
# Watch status with live updates every 30 seconds
npx agentwise project-status --watch

# Watch specific components every 10 seconds  
npx agentwise project-status --watch --component protection --interval 10

# Watch with desktop notifications
npx agentwise project-status --watch --notify
```

Watch mode displays:
- Live status updates with timestamps
- Change notifications and alerts
- Performance graphs and trends
- Real-time metrics dashboard
- Alert summaries and actions needed

## Historical Analysis

### Activity History
```bash
# Show 30-day activity history
npx agentwise project-status --history 30

# Show detailed timeline
npx agentwise project-status --history 7 --detailed --format markdown
```

Displays:
- **Commit Activity** - Git commits over time
- **Security Scans** - Vulnerability scan results and trends
- **Backup History** - Success/failure rates and sizes
- **Performance Trends** - Response times and error rates
- **Quality Evolution** - Code quality changes over time

### Trend Analysis
```
📊 7-Day Trends:
   ├── Commits: 23 (+15% from last week)
   ├── Test Coverage: 74% → 78% (+4%)
   ├── Security Score: 85 → 87 (+2 points)
   ├── Performance: 245ms → 198ms (-19%)
   └── Vulnerabilities: 5 → 3 (-2 fixed)
```

## Multi-Project Summary

```bash
# Show summary across all Agentwise projects
npx agentwise project-status --summary
```

Provides:
- **Project Portfolio** - All projects with health status
- **Aggregate Metrics** - Combined statistics and trends
- **Resource Utilization** - Total resource usage
- **Security Overview** - Portfolio-wide security status
- **Maintenance Schedule** - Upcoming maintenance tasks

## Alert Management

### Active Alerts
```
🚨 Active Alerts (3):
   ├── HIGH: Database connection pool exhausted (2 hours ago)
   ├── MED: Test coverage dropped below 80% (1 day ago)
   └── LOW: Unused dependencies detected (3 days ago)
```

### Alert Actions
```bash
# Show only projects with critical alerts
npx agentwise project-status --alerts-only --severity critical

# Acknowledge specific alerts
npx agentwise project-status --acknowledge-alert ABC123

# Export alerts for incident tracking
npx agentwise project-status --alerts-only --format json --output alerts.json
```

## Examples

### Quick Health Check
```bash
# Simple status check
npx agentwise project-status

# Output:
# 🎯 my-ecommerce-app
# ├── Overall Health: 🟢 92/100
# ├── Database: ✅ PostgreSQL (Connected)
# ├── GitHub: ✅ 15 commits this week  
# ├── Protection: ✅ All systems active
# └── Development: 📈 65% complete
```

### Comprehensive Project Report
```bash
# Generate detailed markdown report
npx agentwise project-status \
  --detailed \
  --format markdown \
  --output project-health-report.md \
  --history 30
```

### CI/CD Integration
```bash
# Check status in CI pipeline
npx agentwise project-status \
  --format json \
  --quiet \
  --component database,protection > status.json

# Exit with error code if health below threshold
npx agentwise project-status --min-health 80 --exit-code
```

### Development Dashboard
```bash
# Real-time development dashboard
npx agentwise project-status \
  --watch \
  --component development,quality,security \
  --detailed \
  --interval 15
```

## Integration with Other Tools

### VS Code Extension
The status command integrates with the Agentwise VS Code extension to show:
- Real-time status in status bar
- Project health indicators in explorer
- Alert notifications and quick actions
- Integrated terminal commands

### GitHub Actions
```yaml
# .github/workflows/status-check.yml
- name: Check Project Health
  run: |
    npx agentwise project-status --min-health 80 --exit-code
    npx agentwise project-status --alerts-only --severity critical --exit-code
```

### Slack/Teams Integration
```bash
# Send daily status to Slack
npx agentwise project-status --format json | \
  jq '.summary' | \
  slack-webhook --channel "#dev-updates"
```

## Configuration

Customize status checks with `.agentwise/status.config.json`:

```json
{
  "healthThresholds": {
    "excellent": 90,
    "good": 75,
    "fair": 60,
    "poor": 40
  },
  "alertLevels": {
    "critical": ["database_down", "security_breach"],
    "high": ["high_vulnerabilities", "backup_failures"],
    "medium": ["coverage_drop", "performance_degradation"],
    "low": ["code_quality", "unused_dependencies"]
  },
  "watchInterval": 30,
  "historyRetention": 90,
  "notifications": {
    "desktop": true,
    "email": false,
    "slack": {
      "enabled": false,
      "webhook": "",
      "channel": "#alerts"
    }
  },
  "components": {
    "database": {
      "enabled": true,
      "checkInterval": 60,
      "healthChecks": ["connection", "performance", "backup"]
    },
    "github": {
      "enabled": true,
      "checkInterval": 300,
      "healthChecks": ["connectivity", "workflows", "security"]
    },
    "protection": {
      "enabled": true,
      "checkInterval": 30,
      "healthChecks": ["monitoring", "backups", "security"]
    }
  }
}
```

## Troubleshooting

### Common Issues

**Status Not Available**
```bash
# Refresh and recalculate status
npx agentwise project-status --refresh --verbose
```

**Slow Status Updates**
```bash
# Check system performance
npx agentwise project-status --component performance --detailed
```

**Missing Components**
```bash
# Verify project was created with Agentwise wizard
ls -la .agentwise/
npx agentwise project-status --component initialization
```

### Debug Information
```bash
# Enable verbose debugging
npx agentwise project-status --verbose --component all

# Check logs
cat ~/.agentwise/logs/status-check.log

# Validate configuration
npx agentwise validate-config --component status
```

---

The Project Status command provides comprehensive visibility into your Agentwise projects, helping you maintain healthy, secure, and well-performing applications with real-time insights and actionable recommendations.

**Stay informed, stay ahead! 📊**