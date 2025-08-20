# Monitor Command Documentation

The `/monitor` command provides comprehensive monitoring capabilities for Agentwise, including a real-time dashboard and global command installation.

## Overview

The monitor command serves dual purposes:
1. **Dashboard Access**: Launch the real-time monitoring dashboard
2. **Global Installation**: Install the `agentwise-monitor` command globally for system-wide access

## Usage

### Basic Usage
```bash
/monitor                    # Start monitor dashboard and auto-install global command
```

### Subcommands
```bash
/monitor install            # Install global agentwise-monitor command
/monitor uninstall          # Remove global command
/monitor status             # Show installation and system status
/monitor help               # Show detailed help information
```

## Global Command Installation

### What Gets Installed
The `/monitor install` command creates a global `agentwise-monitor` command that works across all platforms:

- **macOS**: Installs to `/usr/local/bin` or `~/.local/bin`
- **Linux**: Installs to `~/.local/bin`
- **Windows**: Creates batch file in `%LOCALAPPDATA%\bin`
- **WSL**: Installs with Windows/Linux compatibility

### Cross-Platform Compatibility

#### Windows
Creates a `.bat` file that:
- Changes to the Agentwise project directory
- Launches the monitor dashboard
- Opens browser automatically

#### WSL (Windows Subsystem for Linux)
Creates a smart script that:
- Detects WSL environment automatically
- Uses Windows browser if available
- Falls back to Linux behavior otherwise

#### macOS/Linux
Creates a bash script that:
- Validates project directory existence
- Provides clear error messages
- Handles all edge cases gracefully

### Security Features

#### Path Validation
- All paths are escaped and validated
- Protection against path traversal attacks
- Absolute path resolution to prevent confusion

#### Permission Checks
- Verifies write permissions before installation
- Creates directories with appropriate permissions
- Provides clear feedback on permission issues

#### Script Safety
- No arbitrary code execution
- Input sanitization for all parameters
- Error handling for all operations

## Dashboard Features

### Real-Time Monitoring
- **Agent Status**: Live tracking of all active agents
- **Task Progress**: Real-time task completion updates
- **System Health**: CPU, memory, and network monitoring
- **Performance Metrics**: Token usage and optimization stats

### Interactive Controls
- **Agent Management**: Pause, resume, or stop individual agents
- **Emergency Controls**: Quick shutdown of all operations
- **Project Switching**: Automatic detection and switching between projects

### Visual Interface
- **Agent Grid**: Visual cards showing agent status and progress
- **Task Feed**: Live activity stream with timestamps
- **Progress Bars**: Visual completion indicators
- **Health Indicators**: System status at a glance

## Technical Implementation

### Architecture
```
MonitorCommand.ts
├── GlobalMonitorInstaller.ts (Cross-platform installation)
├── MonitorPath validation
├── Process management (spawn vs exec)
└── Security checks
```

### Process Management
The monitor uses `spawn` instead of `exec` for better process control:
- Non-blocking execution
- Proper signal handling
- Graceful shutdown capabilities
- Error recovery mechanisms

### File System Operations
- Creates necessary directories safely
- Sets appropriate file permissions
- Handles path resolution across platforms
- Validates all file operations

## Configuration

### Environment Variables
The monitor respects these environment variables:
- `PATH`: For global command discovery
- `HOME`: For user directory resolution
- `LOCALAPPDATA`: For Windows local storage

### Installation Paths
| Platform | Installation Path |
|----------|-------------------|
| macOS | `/usr/local/bin` or `~/.local/bin` |
| Linux | `~/.local/bin` |
| Windows | `%LOCALAPPDATA%\bin` |
| WSL | `~/.local/bin` with Windows compatibility |

## Troubleshooting

### Common Issues

#### Global Command Not Found
```bash
# Check if PATH includes installation directory
echo $PATH

# Manually add to shell profile
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.bashrc
source ~/.bashrc
```

#### Permission Denied
```bash
# Check permissions
ls -la ~/.local/bin/agentwise-monitor

# Fix permissions if needed
chmod +x ~/.local/bin/agentwise-monitor
```

#### Windows Path Issues
```powershell
# Check Windows PATH
echo $env:PATH

# Add to PATH manually if needed
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";$env:LOCALAPPDATA\bin", "User")
```

### Error Messages

#### "Monitor directory not found"
- Ensure you're running from the Agentwise project root
- Check that `src/monitor` directory exists
- Verify project structure is intact

#### "Installation failed"
- Check write permissions to installation directory
- Verify PATH environment variable
- Try running with elevated permissions if needed

#### "Path traversal detected"
- Security feature preventing malicious path access
- Ensure you're running from legitimate project directory
- Check for unusual characters in project path

## Best Practices

### Security
1. **Always verify installation path** before proceeding
2. **Use trusted project directories** only
3. **Review generated scripts** if suspicious activity occurs
4. **Keep PATH environment** clean and organized

### Performance
1. **Close monitor** when not actively needed
2. **Monitor resource usage** during long operations
3. **Use status command** to check health periodically
4. **Clean up old installations** if switching projects

### Maintenance
1. **Update regularly** with project updates
2. **Check status** after system changes
3. **Reinstall if needed** after major updates
4. **Keep documentation** current with changes

## API Reference

### MonitorCommand Class
```typescript
class MonitorCommand {
  constructor()
  async handle(args: string[]): Promise<void>
  private async startMonitor(): Promise<void>
  private async installGlobalCommand(): Promise<void>
  private async uninstallGlobalCommand(): Promise<void>
  private async showStatus(): Promise<void>
  private showHelp(): void
}
```

### GlobalMonitorInstaller Class
```typescript
class GlobalMonitorInstaller {
  constructor()
  async install(): Promise<InstallResult>
  async isInstalled(): Promise<boolean>
  async uninstall(): Promise<InstallResult>
  async getStatus(): Promise<StatusInfo>
}
```

### Return Types
```typescript
interface InstallResult {
  success: boolean;
  message: string;
  commandPath?: string;
  platform: string;
}

interface StatusInfo {
  installed: boolean;
  platform: string;
  commandPath?: string;
  version?: string;
}
```

## Examples

### Basic Monitor Usage
```bash
# Start monitoring dashboard
/monitor

# Check current status
/monitor status

# Get help
/monitor help
```

### Global Command Management
```bash
# Install global command
/monitor install

# Use global command
agentwise-monitor

# Check global command status
agentwise-monitor status

# Uninstall global command
/monitor uninstall
```

### Cross-Platform Examples

#### Windows
```batch
@echo off
cd /d "C:\Users\username\projects\agentwise"
cd src\monitor
start "" cmd /c "start.sh"
```

#### Linux/macOS
```bash
#!/bin/bash
AGENTWISE_PATH='/home/user/projects/agentwise'
cd "$AGENTWISE_PATH" || {
    echo "❌ Error: Agentwise directory not found"
    exit 1
}
cd src/monitor
./start.sh
```

## Requirements

### System Requirements
- Node.js 18.0 or higher
- Claude Code with --dangerously-skip-permissions flag
- Bash support (WSL on Windows)
- Network access for dashboard (localhost:3001)

### Dependencies
- fs-extra: File system operations
- path: Path manipulation
- child_process: Process spawning
- os: Operating system detection

## Integration

### With Claude Code
The monitor command integrates seamlessly with Claude Code through:
- Command registration in main index.ts
- Argument parsing and routing
- Error handling and user feedback
- Consistent command interface

### With Agentwise Core
The monitor connects to:
- Agent orchestration system
- Task completion tracking
- Performance analytics
- Real-time event streaming

This documentation provides comprehensive coverage of the monitor command functionality, ensuring users can effectively utilize both the dashboard and global installation features across all supported platforms.