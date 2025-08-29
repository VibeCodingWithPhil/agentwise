# Agentwise Configuration Command

## Overview
The `/configure-agentwise` command provides comprehensive configuration management for Agentwise settings, including the permission bypass system, workspace restrictions, monitoring options, and token optimization.

## Usage

### Interactive Configuration Wizard
```bash
/configure-agentwise
```
Launches the interactive configuration wizard that guides you through all available settings.

### Specific Configuration Areas
```bash
/configure-agentwise permissions    # Configure permission bypass system
/configure-agentwise workspace      # Set workspace restrictions
/configure-agentwise monitoring     # Configure terminal monitoring
/configure-agentwise reset          # Reset to defaults
/configure-agentwise export         # Export current configuration
/configure-agentwise import <file>  # Import configuration from file
/configure-agentwise show           # Display current configuration
/configure-agentwise validate       # Validate current configuration
```

## Configuration Areas

### Permission System
Controls security and access restrictions:
- **Bypass Enabled**: Allow bypassing file system restrictions
- **Safety Mode**: strict/moderate/permissive security levels
- **Auto Response**: Automatically respond to permission prompts
- **Restricted Commands**: Commands that require confirmation
- **File Extensions**: Allowed file extensions for operations
- **Dangerous Operations**: Allow system-level commands

### Workspace Settings
Manages file and directory access:
- **Sandbox Enabled**: Restrict operations to specific directories
- **Allowed Paths**: Directories that can be accessed
- **Restricted Paths**: Directories that are forbidden
- **Max File Size**: Maximum file size for operations (MB)
- **Auto Backup**: Automatically backup before operations
- **Preserve Git Ignore**: Respect .gitignore rules

### Monitoring Configuration
Controls logging and performance tracking:
- **Terminal Enabled**: Enable terminal monitoring
- **Verbosity Level**: quiet/normal/verbose/debug output levels
- **Log Retention**: Days to keep log files
- **Performance Tracking**: Monitor operation performance
- **Real-time Updates**: Enable live status updates
- **Error Reporting**: Automatic error reporting

### Token Optimization
Manages API usage and performance:
- **Enabled**: Enable token optimization system
- **Max Tokens Per Agent**: Token limit for individual agents
- **Context Window Size**: Maximum context size
- **Cache Enabled**: Enable response caching
- **Compression Level**: none/low/medium/high compression

### Custom Commands
Controls command availability and behavior:
- **Enabled Commands**: Commands available for use
- **Disabled Commands**: Commands that are blocked
- **Custom Command Paths**: Directories to search for custom commands
- **Require Confirmation**: Commands that need user confirmation

## Configuration Storage

### Local Project Configuration
Stored in `.agentwise-config.json` in the project root:
- Applies only to the current project
- Overrides global settings
- Version controlled (if desired)

### Global User Configuration
Stored in `~/.agentwise/config.json`:
- Applies to all Agentwise projects
- User-specific defaults
- Persists across projects

### Environment Variable Overrides
Environment variables can override any setting:
```bash
AGENTWISE_BYPASS_ENABLED=true
AGENTWISE_SAFETY_MODE=strict
AGENTWISE_SANDBOX_ENABLED=false
AGENTWISE_MONITORING_ENABLED=true
AGENTWISE_VERBOSITY=debug
AGENTWISE_TOKEN_OPTIMIZATION=true
AGENTWISE_MAX_FILE_SIZE=50
```

## Examples

### Basic Configuration
```bash
# Launch interactive wizard
/configure-agentwise

# Configure only permissions
/configure-agentwise permissions

# Export current settings
/configure-agentwise export
```

### Advanced Configuration
```bash
# Import configuration from file
/configure-agentwise import ./team-config.json

# Validate current settings
/configure-agentwise validate

# Reset everything to defaults
/configure-agentwise reset
```

### Environment-Specific Setup
```bash
# Development environment (permissive)
AGENTWISE_SAFETY_MODE=permissive /configure-agentwise permissions

# Production environment (strict)
AGENTWISE_SAFETY_MODE=strict /configure-agentwise permissions
```

## Security Considerations

### Permission Bypass System
- **High Risk**: Bypassing permissions can expose system vulnerabilities
- **Use Cases**: Trusted environments, specific automation needs
- **Recommendations**: Enable only when necessary, use strict safety mode

### Safety Modes
- **Strict**: Maximum security, limited functionality
- **Moderate**: Balanced approach (recommended)
- **Permissive**: Maximum functionality, minimal restrictions

### Workspace Sandboxing
- **Enabled**: Restricts file access to specified directories
- **Disabled**: Allows system-wide file access (use with caution)
- **Best Practice**: Always use sandboxing in production

## Configuration Validation

The system automatically validates all configuration settings:

### Validation Checks
- **Syntax**: Correct JSON structure and data types
- **Logic**: No conflicting or contradictory settings
- **Security**: Warns about dangerous combinations
- **Performance**: Identifies settings that may impact performance
- **Environment**: Checks system compatibility

### Error Handling
- **Errors**: Configuration rejected, must be fixed
- **Warnings**: Configuration accepted with notifications
- **Migration**: Automatic updates for version changes

## Integration with Other Systems

### Permission Bypass System
```typescript
// Access current permission settings
const config = await new AgentwiseConfiguration().load();
if (config.permissions.bypassEnabled) {
    // Bypass permission checks
}
```

### Terminal Monitor
```typescript
// Configure monitoring based on settings
if (config.monitoring.terminalEnabled) {
    monitor.setVerbosity(config.monitoring.verbosityLevel);
}
```

### Token Optimizer
```typescript
// Apply token optimization settings
if (config.tokenOptimization.enabled) {
    optimizer.setMaxTokens(config.tokenOptimization.maxTokensPerAgent);
}
```

## Best Practices

### Security
1. Start with strict safety mode
2. Enable sandboxing in production
3. Regularly review permission settings
4. Use environment variables for sensitive settings

### Performance
1. Enable token optimization
2. Use appropriate verbosity levels
3. Configure reasonable file size limits
4. Enable caching for better performance

### Team Collaboration
1. Use exported configurations for consistency
2. Document custom settings
3. Version control project-specific configs
4. Use global configs for personal preferences

## Troubleshooting

### Common Issues
- **Permission Denied**: Check bypass and sandbox settings
- **Invalid Configuration**: Run validation to identify issues
- **Performance Problems**: Review monitoring and optimization settings
- **Command Not Found**: Check enabled commands configuration

### Debug Mode
Enable debug verbosity for detailed troubleshooting:
```bash
AGENTWISE_VERBOSITY=debug /configure-agentwise
```

### Reset to Defaults
If configuration becomes corrupted:
```bash
/configure-agentwise reset
```

This command provides comprehensive control over Agentwise behavior while maintaining security and performance standards.