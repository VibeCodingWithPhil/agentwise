# Enable Protection System

Enable and configure the Agentwise Automated Protection System to secure your project with comprehensive monitoring, automated backups, and security scanning.

## Usage

Use this command to enable protection for your project with smart defaults and customization options.

```bash
# Enable with default configuration
npm run protection:enable

# Enable with custom settings
npm run protection:enable -- --config=custom
```

## What This Command Does

### 1. **System Initialization**
- Sets up the complete Automated Protection System
- Configures all five core protection components:
  - AutoCommitManager (Smart auto-commits)
  - ContinuousSecurityMonitor (Real-time security scanning)
  - AutomatedReviewPipeline (Code quality checks)
  - IntegratedBackupSystem (Multi-destination backups)
  - DailySecurityReport (Automated reporting)

### 2. **Smart Configuration**
- Analyzes your project structure and Git setup
- Creates optimized configuration based on project type
- Sets up intelligent commit rules and security patterns
- Configures backup destinations and schedules

### 3. **Security Setup**
- Initializes vulnerability scanning with OWASP Top 10 checks
- Sets up secret detection with 15+ common patterns
- Configures dependency vulnerability monitoring
- Establishes security alert thresholds

### 4. **Backup Configuration**
- Sets up local backup destination by default
- Optionally configures GitHub backup integration
- Establishes retention policies (7 daily, 4 weekly, 12 monthly)
- Enables compression and integrity verification

### 5. **Dashboard Activation**
- Starts the real-time protection dashboard
- Displays system status, metrics, and alerts
- Shows recent activity and next recommended actions
- Provides interactive controls for all systems

## Configuration Options

### Default Settings
```typescript
{
  autoCommit: {
    enabled: true,
    intervalMinutes: 60,
    immediateForCritical: true,
    securityCheck: true
  },
  security: {
    realTimeScan: true,
    scanInterval: 30, // minutes
    autoFix: true,
    owaspChecks: true
  },
  backup: {
    strategy: "event-based",
    compression: true,
    encryption: false,
    verifyBackups: true
  },
  reporting: {
    enabled: true,
    schedule: "9:00", // Daily at 9 AM
    commitToRepo: true
  }
}
```

### Custom Configuration
Create a `protection.config.js` file in your project root:

```javascript
module.exports = {
  autoCommit: {
    enabled: true,
    watchPaths: ["src/", "config/"],
    excludePaths: ["temp/", "*.log"],
    commitRules: [
      {
        pattern: "*.ts",
        immediate: false,
        priority: "medium"
      },
      {
        pattern: "package.json",
        immediate: true,
        priority: "critical"
      }
    ]
  },
  security: {
    secretPatterns: [
      "CUSTOM_API_KEY_.*",
      "SECRET_TOKEN_.*"
    ],
    alertThresholds: {
      critical: 1,
      high: 3,
      medium: 10
    }
  },
  backup: {
    destinations: [
      {
        type: "local",
        path: "./backups",
        priority: 1
      },
      {
        type: "github",
        path: "backup-branch",
        priority: 2
      }
    ]
  }
};
```

## Post-Activation Features

### 1. **Smart Auto-Commits**
- Watches file changes in real-time
- Commits critical files immediately (package.json, configs)
- Batches regular changes into scheduled commits
- Generates intelligent commit messages
- Runs security checks before each commit

### 2. **Continuous Security Monitoring**
- Scans code for 15+ types of secrets and vulnerabilities
- Checks against OWASP Top 10 security risks
- Monitors dependencies for known vulnerabilities
- Auto-fixes certain security issues when safe
- Real-time alerts for critical findings

### 3. **Automated Code Review**
- Analyzes code quality on every change
- Checks complexity, maintainability, test coverage
- Validates security practices
- Enforces style guidelines with auto-fix
- Blocks commits that fail quality thresholds

### 4. **Integrated Backup System**
- Creates backups on critical file changes
- Maintains scheduled backup intervals
- Supports multiple destinations (local, GitHub, cloud)
- Verifies backup integrity with checksums
- Manages retention policies automatically

### 5. **Daily Security Reports**
- Generates comprehensive security reports
- Tracks trends and improvements over time
- Calculates security scores and risk levels
- Provides actionable recommendations
- Commits reports to repository for history

### 6. **Real-time Dashboard**
- Interactive terminal-based interface
- Shows system status and health metrics
- Displays recent activity and alerts
- Lists next recommended actions
- Allows manual triggering of operations

## Quick Start

1. **Enable Protection**:
   ```bash
   npm run protection:enable
   ```

2. **View Dashboard**:
   ```bash
   npm run protection:status
   ```

3. **Generate Security Report**:
   ```bash
   npm run protection:report
   ```

## Verification

After enabling, you can verify the system is working:

```bash
# Check overall status
npm run protection:status

# View recent activity
git log --oneline -10

# Check for security scan results
ls -la .security-scan-*.json

# View backup history
ls -la ./backups/

# Check generated reports
ls -la ./reports/security-report-*.md
```

## Customization

### File Patterns
Configure which files trigger immediate commits:
- Configuration files (package.json, tsconfig.json)
- Security files (.env, certificates)
- Critical source files (main modules)

### Security Rules
Add custom security patterns:
- API key formats specific to your services
- Database connection patterns
- Custom secret formats

### Backup Strategies
Choose backup approach:
- **Continuous**: Backup on every change
- **Interval**: Scheduled backups (daily/weekly)
- **Event-based**: Backup on significant events

### Report Delivery
Configure how reports are delivered:
- Commit to repository
- Send via email (if SMTP configured)
- Export to external systems

## Troubleshooting

### Common Issues

1. **Git Repository Not Found**
   - Ensure you're in a Git repository
   - Run `git init` if needed

2. **Permission Errors**
   - Check file/directory permissions
   - Ensure write access to backup locations

3. **High Resource Usage**
   - Adjust scan intervals
   - Reduce watched file patterns
   - Optimize backup frequency

4. **False Security Positives**
   - Add patterns to exclusion list
   - Adjust sensitivity thresholds
   - Review custom patterns

### Getting Help

- Check logs in `.protection-logs/`
- Review dashboard alerts and recommendations
- Use `npm run protection:status` for diagnostic info
- Check generated reports for detailed analysis

## Security Notes

- The system never transmits sensitive data externally
- All scans and backups happen locally by default
- Secrets are detected but never logged or stored
- Backup encryption is recommended for sensitive projects
- Regular security reports help track improvements

## Performance Impact

- Minimal CPU usage during normal operation
- File watching uses native OS capabilities
- Backups are compressed and incremental
- Security scans are optimized for speed
- Dashboard updates every 30 seconds by default

Enable the Automated Protection System to ensure your project maintains the highest security standards with minimal manual intervention.