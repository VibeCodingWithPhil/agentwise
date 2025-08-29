# Configure Agentwise Command Demo

This demonstrates the new `/configure-agentwise` command that provides comprehensive configuration management for the Agentwise system.

## Quick Start

```bash
# Launch interactive configuration wizard
/configure-agentwise

# Configure specific areas
/configure-agentwise permissions
/configure-agentwise workspace
/configure-agentwise monitoring

# Configuration management
/configure-agentwise export
/configure-agentwise import ./my-config.json
/configure-agentwise reset
```

## Features Implemented

### 1. Configuration Command Handler
- **File**: `src/commands/ConfigureAgentwiseCommand.ts`
- Interactive wizard for all settings
- Specific configuration areas (permissions, workspace, monitoring)
- Export/import configuration
- Validation and reset capabilities

### 2. Configuration Management
- **File**: `src/config/AgentwiseConfiguration.ts`
- Local project configs (`.agentwise-config.json`)
- Global user configs (`~/.agentwise/config.json`)
- Environment variable overrides
- Configuration merging and defaults

### 3. Interactive Wizard
- **File**: `src/config/ConfigurationWizard.ts`
- Step-by-step configuration guide
- Context-aware questions
- Safety warnings for dangerous settings
- Configuration summary

### 4. Comprehensive Validation
- **File**: `src/config/ConfigurationValidator.ts`
- Security validation (dangerous combinations)
- Logic validation (conflicting settings)
- Performance warnings
- Environment compatibility checks

### 5. Command Integration
- Added to main `src/index.ts`
- Shows in help output
- Full command line integration

## Configuration Areas

### Permission System
- Enable/disable permission bypass
- Safety modes (strict/moderate/permissive)
- Auto-response behavior
- Restricted commands
- Allowed file extensions

### Workspace Settings
- Sandbox restrictions
- Allowed/restricted paths
- File size limits
- Auto-backup settings
- Git ignore preservation

### Monitoring Configuration
- Terminal monitoring
- Verbosity levels
- Log retention
- Performance tracking
- Real-time updates

### Token Optimization
- Enable/disable optimization
- Token limits per agent
- Context window sizes
- Response caching
- Compression levels

### Custom Commands
- Enabled/disabled commands
- Custom command paths
- Commands requiring confirmation

## Integration Points

### Permission Bypass System
The configuration system is designed to integrate with the `PermissionBypassSystem` and `TerminalMonitor` that other agents are creating:

```typescript
// Example integration
const config = await new AgentwiseConfiguration().load();
if (config.permissions.bypassEnabled) {
    // Enable bypass system
    PermissionBypassSystem.enable();
}
```

### Terminal Monitor
```typescript
// Configure monitoring based on settings
if (config.monitoring.terminalEnabled) {
    TerminalMonitor.setVerbosity(config.monitoring.verbosityLevel);
}
```

## Security Features

1. **Environment Variable Overrides**: Allow secure deployment configuration
2. **Validation System**: Prevents dangerous configuration combinations
3. **Safety Warnings**: Alerts users to security implications
4. **Default Security**: Secure defaults with opt-in for dangerous features
5. **Configuration Migration**: Automatic updates for config format changes

## Usage Examples

### Development Environment
```bash
# Quick setup for development
AGENTWISE_SAFETY_MODE=permissive /configure-agentwise permissions
```

### Production Environment
```bash
# Secure production setup
AGENTWISE_SAFETY_MODE=strict /configure-agentwise
```

### Team Configuration
```bash
# Export team settings
/configure-agentwise export

# Import on other machines
/configure-agentwise import ./team-agentwise-config.json
```

## File Structure

```
src/config/
├── AgentwiseConfiguration.ts    # Core configuration management
├── ConfigurationWizard.ts       # Interactive configuration wizard
├── ConfigurationValidator.ts    # Validation system
└── index.ts                     # Module exports

.claude/commands/
└── configure-agentwise.md       # Command documentation
```

## Environment Variables

All settings can be overridden with environment variables:

```bash
AGENTWISE_BYPASS_ENABLED=true
AGENTWISE_SAFETY_MODE=strict
AGENTWISE_SANDBOX_ENABLED=false
AGENTWISE_MONITORING_ENABLED=true
AGENTWISE_VERBOSITY=debug
AGENTWISE_TOKEN_OPTIMIZATION=true
AGENTWISE_MAX_FILE_SIZE=50
```

## Integration Ready

The configuration system is designed to integrate seamlessly with:
- PermissionBypassSystem (being created by other agents)
- TerminalMonitor (being created by other agents)
- TokenOptimizer (existing system)
- MonitoringDashboard (existing system)

This provides a centralized configuration management system that all Agentwise components can use for consistent behavior and user preferences.