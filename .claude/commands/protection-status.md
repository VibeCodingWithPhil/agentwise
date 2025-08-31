# Protection Status Dashboard

Display the real-time status and health of the Agentwise Automated Protection System with detailed metrics, alerts, and actionable insights.

## Usage

```bash
# Show interactive dashboard
npm run protection:status

# Show status summary in console
npm run protection:status -- --summary

# Export status as JSON
npm run protection:status -- --json

# Show specific component status
npm run protection:status -- --component=security
```

## Dashboard Features

### 1. **Real-time System Overview**
```
┌─────────────────────────────────────────────────────────────────┐
│    Agentwise Protection Dashboard | 2024-08-31 14:30:25        │
│    Uptime: 99.8% | Press 'r' to refresh, 'q' to quit           │
└─────────────────────────────────────────────────────────────────┘

┌─── System Status ───────────┬─── Metrics ─────────────────────┐
│                             │                                 │
│  ● Auto Commit: Online      │  Total Commits (30d): 47       │
│  ● Security Monitor: Online │  Active Days (30d): 23         │
│  ● Review Pipeline: Online  │  Average Score: 88.5           │
│  ● Backup System: Online    │  Risk Level: LOW               │
│  ● Report Generator: Online │                                │
│                             │  Recent Trends (7d):          │
│  Overall Status: Healthy    │    Security: ↗ 91.2           │
│                             │                                │
└─────────────────────────────┴─────────────────────────────────┘
```

### 2. **Component Health Details**

#### Auto Commit Manager
- **Status**: Online/Offline/Warning/Error
- **Last Activity**: Timestamp of last commit
- **Pending Changes**: Number of files waiting to be committed
- **Success Rate**: Percentage of successful commits
- **Response Time**: Average time to process commits

#### Security Monitor
- **Status**: Online/Offline/Scanning/Error
- **Last Scan**: Timestamp of most recent security scan
- **Vulnerabilities Found**: Current count by severity
- **Scan Duration**: Time taken for last scan
- **Auto-fixes Applied**: Number of issues automatically resolved

#### Review Pipeline
- **Status**: Online/Offline/Reviewing/Error
- **Last Review**: Timestamp of most recent code review
- **Quality Score**: Current code quality rating (0-100)
- **Issues Found**: Count of quality issues by type
- **Coverage**: Current test coverage percentage

#### Backup System
- **Status**: Online/Offline/Backing Up/Error
- **Last Backup**: Timestamp of most recent successful backup
- **Success Rate**: Percentage of successful backups
- **Storage Used**: Total backup storage consumed
- **Destinations**: Status of each backup destination

#### Report Generator
- **Status**: Online/Offline/Generating/Error
- **Last Report**: Timestamp of most recent report
- **Reports Generated**: Total count of generated reports
- **Next Scheduled**: Time of next scheduled report
- **Recipients**: Number of configured recipients

### 3. **Performance Metrics**

#### Security Metrics
```
Security Score Trend (7 days):
[████████████████████████████████████████] 91.2/100 ↗

Vulnerabilities by Severity:
Critical: 0    High: 1    Medium: 3    Low: 5

Recent Security Events:
• 14:25 ✓ Security scan completed - 0 critical issues
• 14:20 ⚠ Medium severity issue detected in config.js
• 14:15 ✓ Auto-fixed insecure session configuration
```

#### Quality Metrics
```
Code Quality Trend (7 days):
[████████████████████████████████████████] 88.7/100 →

Quality Breakdown:
Maintainability: 92/100    Test Coverage: 85%
Complexity: 7.2/10         Technical Debt: 4.2h

Recent Quality Events:
• 14:28 ✓ Review pipeline passed for src/utils/helper.ts
• 14:22 ⚠ High complexity detected in data-processor.ts
• 14:18 ✓ Test coverage increased to 85%
```

#### Backup Metrics
```
Backup Success Rate (30 days):
[████████████████████████████████████████] 98.5% ✓

Storage Overview:
Total Backups: 47         Total Size: 2.3 GB
Local: 2.1 GB             GitHub: 245 MB

Recent Backup Events:
• 14:20 ✓ Incremental backup completed (47 files, 12 MB)
• 13:45 ✓ Critical file backup: package.json
• 12:30 ✓ Scheduled daily backup completed
```

### 4. **Active Alerts**

#### Alert Priority System
- 🔴 **Critical**: Immediate attention required
- 🟠 **High**: Address within 24 hours
- 🟡 **Medium**: Address within week
- 🟢 **Low**: Monitor and plan resolution

#### Sample Alerts
```
Active Alerts (3):
🟠 14:25 HIGH: Security scan found SQL injection vulnerability
     File: src/database/queries.ts:45
     Action: Use parameterized queries

🟡 14:20 MEDIUM: Test coverage below threshold (85% < 90%)
     Action: Add tests for uncovered functions

🟡 14:15 MEDIUM: Backup destination 'github' unreachable
     Action: Check GitHub authentication
```

### 5. **Recent Activity Log**
```
Recent Activity (Last 10 events):
14:30:15 ✓ Dashboard refreshed
14:25:33 ✓ Security scan completed - 9 files scanned
14:20:45 ⚠ Vulnerability detected in config.js
14:18:22 ✓ Auto-commit: Update README.md
14:15:10 ✓ Backup completed successfully
14:12:05 ✓ Code review passed for feature branch
14:08:33 ✓ Security auto-fix applied to auth.js
14:05:17 ✓ Daily report generation started
14:02:44 ✓ New commit detected: Add user validation
14:00:01 ✓ System health check completed
```

### 6. **Next Recommended Actions**
```
Recommended Actions (Priority Order):
! 1. Fix SQL injection vulnerability in queries.ts (~15 min)
  2. Increase test coverage for user module (~30 min)
  3. Review backup configuration for GitHub (~10 min)
  4. Update security patterns for new API format (~5 min)
  5. Schedule manual security review (~45 min)

Automated Actions Available:
⚡ Auto-fix 3 style issues with Prettier
⚡ Update 2 dependencies with known fixes
⚡ Generate missing JSDoc comments
```

## Command Line Options

### Summary Mode
```bash
npm run protection:status -- --summary
```
Output:
```
Agentwise Protection System Status

Overall Health: ✅ HEALTHY (91.2/100)
Components: 5/5 Online
Active Alerts: 2 Medium, 0 Critical
Last Activity: Auto-commit completed (2 min ago)

Recent Stats:
- Commits Today: 12
- Security Scans: 24/24 successful
- Backups: 3/3 successful
- Reports Generated: 1 today

Next Actions: 3 recommended (highest: medium priority)
```

### JSON Export
```bash
npm run protection:status -- --json > status.json
```
Exports complete system status as structured JSON for integration with external monitoring tools.

### Component-Specific Status
```bash
# Security component only
npm run protection:status -- --component=security

# Backup system only  
npm run protection:status -- --component=backup

# All components (default)
npm run protection:status -- --component=all
```

## Interactive Commands

While in dashboard mode, use these keyboard shortcuts:

- **`r`**: Refresh all data immediately
- **`q`** or **`Ctrl+C`**: Quit dashboard
- **`1-5`**: Focus on specific component details
- **`a`**: Show all alerts with details
- **`l`**: Show extended activity log
- **`m`**: Toggle between summary and detailed metrics view
- **`h`**: Show help and keyboard shortcuts

## Status Indicators

### Component Status Colors
- 🟢 **Online**: Component running normally
- 🟡 **Warning**: Component running with issues
- 🔴 **Error**: Component failed or offline
- ⚪ **Unknown**: Status cannot be determined

### Health Score Ranges
- **90-100**: Excellent (Green)
- **80-89**: Good (Light Green) 
- **70-79**: Fair (Yellow)
- **60-69**: Poor (Orange)
- **Below 60**: Critical (Red)

### Trend Indicators
- **↗**: Improving trend
- **→**: Stable trend
- **↘**: Declining trend

## Automated Monitoring

The status dashboard automatically:

1. **Refreshes data** every 30 seconds
2. **Detects system changes** in real-time
3. **Generates alerts** based on thresholds
4. **Logs all activities** with timestamps
5. **Calculates health scores** using weighted metrics
6. **Tracks performance trends** over time
7. **Suggests actions** based on current state

## Integration Options

### External Monitoring
Export status data for integration with:
- Prometheus/Grafana dashboards
- Slack/Discord notifications
- Email alert systems
- Custom monitoring solutions

### Webhook Integration
Configure webhooks to send status updates:
```javascript
// protection.config.js
module.exports = {
  alerts: {
    webhookUrl: "https://hooks.slack.com/...",
    channels: ["webhook", "console", "file"]
  }
};
```

### API Access
Query status programmatically:
```javascript
const { ProtectionSystem } = require('./src/protection');
const system = new ProtectionSystem();
const status = await system.getStatus();
console.log(status.overall); // 'healthy', 'warning', 'critical'
```

## Troubleshooting Dashboard Issues

### Dashboard Won't Start
1. Check if protection system is enabled
2. Verify terminal supports colors/unicode
3. Ensure no other process is using the interface
4. Check system permissions for file access

### Missing Data
1. Verify components are properly initialized
2. Check log files in `.protection-logs/`
3. Ensure Git repository is properly configured
4. Verify backup destinations are accessible

### Performance Issues
1. Reduce refresh interval if CPU usage is high
2. Limit activity log history size
3. Disable detailed metrics if memory is constrained
4. Use summary mode for basic monitoring

The Protection Status Dashboard provides complete visibility into your project's security and quality posture, enabling proactive maintenance and rapid issue resolution.