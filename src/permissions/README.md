# Permission Bypass System

The Permission Bypass System enables Agentwise to function without requiring the `--dangerously-skip-permissions` flag by implementing intelligent workspace sandboxing and permission management.

## Overview

The Permission Bypass System provides:
- **Workspace Sandboxing**: Limits file operations to project workspaces
- **Intelligent Permission Handling**: Automatically responds to Claude Code permission prompts
- **Security**: Prevents unauthorized system access while maintaining functionality
- **Transparency**: Works seamlessly in the background
- **Configurability**: Highly customizable through configuration files and CLI commands

## Architecture

### Core Components

1. **PermissionBypassSystem** (`PermissionBypassSystem.ts`)
   - Main system class handling permission logic
   - Terminal output monitoring
   - Permission prompt analysis and response
   - Sandbox boundary validation

2. **PermissionIntegrationService** (`PermissionIntegrationService.ts`)
   - Integration with existing Agentwise components
   - Command execution wrapper with safety checks
   - Project context management

3. **PermissionCommand** (`PermissionCommand.ts`)
   - CLI interface for system management
   - Configuration wizard
   - Testing and troubleshooting tools

## How It Works

### 1. Workspace Sandboxing

The system creates isolated workspaces for each project:

```
workspace/
├── project-1/
│   ├── src/
│   ├── docs/
│   ├── tests/
│   └── .agentwise/
│       └── metadata.json
├── project-2/
│   └── ...
```

All Claude Code operations are restricted to:
- The specific project workspace directory
- Explicitly allowed system directories (configurable)
- Common safe locations (package.json, node_modules, etc.)

### 2. Permission Prompt Handling

The system monitors terminal output for permission prompts and automatically responds based on:
- **File Operations**: Auto-approve if within sandbox boundaries
- **Command Execution**: Auto-approve for known safe commands
- **Network Access**: Auto-approve for localhost and HTTPS requests
- **Unknown Operations**: Request manual approval or deny based on configuration

### 3. Security Model

- **Default Deny**: Operations outside sandbox are denied by default
- **Explicit Allow**: System commands can access broader system locations
- **User Override**: Manual approval system for edge cases
- **Audit Logging**: All permission decisions are logged

## Configuration

### Default Configuration

```typescript
{
  permissions: {
    enableBypass: true,
    workspaceRoot: './workspace',
    allowedDirectories: [
      './.agentwise',
      './.claude',
      './projects.json',
      './node_modules',
      './package.json',
      './package-lock.json',
      './tsconfig.json'
    ],
    systemAccessCommands: [
      '/monitor',
      '/setup-mcps',
      '/setup-ollama',
      '/setup-lmstudio',
      '/github'
    ],
    promptTimeout: 5000,
    verboseLogging: false,
    autoApproveCommon: true,
    fallbackToManual: true
  },
  system: {
    maxConcurrentAgents: 3,
    tokenOptimization: 'aggressive',
    enableMonitoring: true
  }
}
```

### Configuration File

The system creates and manages `.agentwise-config.json` in your project root:

```bash
# View current configuration
cat .agentwise-config.json

# Edit manually (restart required)
nano .agentwise-config.json
```

## Usage

### CLI Commands

```bash
# Check system status
/permissions status

# Enable/disable the bypass system
/permissions enable
/permissions disable

# Interactive configuration
/permissions configure

# Workspace management
/permissions workspace set ./my-workspace
/permissions workspace create my-project
/permissions workspace list

# Allowed directories management
/permissions allowed-dirs add ./custom-dir
/permissions allowed-dirs remove ./custom-dir
/permissions allowed-dirs list

# Test system functionality
/permissions test

# Reset to defaults
/permissions reset
```

### Programmatic Usage

```typescript
import { permissionIntegration } from './permissions/PermissionIntegrationService';

// Initialize the system
await permissionIntegration.initialize();

// Execute command with workspace safety
await permissionIntegration.withWorkspaceSafety(
  '/create my-app',
  'my-project',
  async () => {
    // Your command logic here
  }
);

// Validate file operations
const canWrite = await permissionIntegration.validateFileOperation(
  'write',
  './workspace/my-project/src/app.ts'
);
```

## Security Features

### Sandbox Boundaries

The system enforces strict boundaries:

✅ **Allowed Operations**
- Read/write within project workspace
- Read from allowed system directories
- Execute approved commands
- Access localhost and HTTPS endpoints

❌ **Blocked Operations**
- Write to system directories
- Execute arbitrary system commands
- Access restricted network endpoints
- Modify files outside workspace

### Permission Escalation

When an operation requires broader permissions:

1. **Analysis**: System analyzes the request context
2. **Decision**: Automatic approval, denial, or manual prompt
3. **Logging**: All decisions are logged for audit
4. **Timeout**: Manual prompts timeout after configured duration

## Integration with Existing Components

### PermissionChecker Integration

The system integrates with the existing `PermissionChecker` by monkey-patching the `withPermissionCheck` method to use the bypass system when enabled.

### Project Context Integration

Automatic integration with `ProjectContextManager` for context-aware permission decisions.

### Agent System Integration

All agent operations are automatically sandboxed to their respective project workspaces.

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**
   ```bash
   # Check if bypass is enabled
   /permissions status
   
   # Enable if disabled
   /permissions enable
   ```

2. **Operations Outside Workspace**
   ```bash
   # Add directory to allowed list
   /permissions allowed-dirs add /path/to/dir
   
   # Or create project workspace
   /permissions workspace create my-project
   ```

3. **System Commands Not Working**
   ```bash
   # Check system command configuration
   /permissions status
   
   # Add command to system access list
   # (Edit .agentwise-config.json)
   ```

### Testing

Run comprehensive system tests:

```bash
/permissions test
```

This will test:
- Workspace sandbox validation
- System directory restrictions
- Allowed directory access
- Integration status
- Configuration loading

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
/permissions configure
# Select "yes" for verbose logging

# Or edit config directly:
# Set permissions.verboseLogging: true
```

## Performance Impact

The Permission Bypass System is designed for minimal performance impact:

- **Lazy Initialization**: Components load only when needed
- **Efficient Monitoring**: Terminal monitoring uses optimized streams
- **Cached Decisions**: Permission decisions are cached
- **Background Operation**: All monitoring happens asynchronously

## Compatibility

### Claude Code Versions

The system is compatible with:
- Claude Code with `--dangerously-skip-permissions` (bypass disabled automatically)
- Claude Code without permissions (bypass enabled automatically)
- All Claude Code versions supporting file operations

### Operating Systems

Tested on:
- macOS (Darwin)
- Linux
- Windows (with PowerShell)

## Advanced Configuration

### Custom Permission Handlers

You can extend the system with custom permission handlers:

```typescript
import { PermissionBypassSystem } from './PermissionBypassSystem';

const system = new PermissionBypassSystem();

// Add custom prompt handler
system.on('manualApprovalRequired', (context) => {
  // Custom approval logic
});
```

### MCP Integration

The system is designed to work with MCP (Model Context Protocol) servers:

```typescript
// MCPs automatically get appropriate permissions
// based on their specialization and project requirements
```

## Security Considerations

### Threat Model

The system protects against:
- **Accidental System Modification**: Prevents unintended changes to system files
- **Path Traversal**: Validates all paths to prevent directory escape
- **Command Injection**: Sanitizes and validates all commands
- **Resource Exhaustion**: Limits concurrent operations

### Security Boundaries

- **File System**: Strict workspace boundaries with explicit allow lists
- **Network**: Localhost and HTTPS-only by default
- **Process**: Safe command execution with validation
- **Memory**: Efficient resource management

## Contributing

To contribute to the Permission Bypass System:

1. **Follow Security Guidelines**: All changes must maintain security boundaries
2. **Add Tests**: New features require comprehensive tests
3. **Update Documentation**: Keep this README current
4. **Consider Compatibility**: Ensure backward compatibility

## License

The Permission Bypass System is part of Agentwise and follows the same license terms.

---

For more information, see the [Agentwise documentation](https://agentwise-docs.vercel.app) or run `/permissions help`.