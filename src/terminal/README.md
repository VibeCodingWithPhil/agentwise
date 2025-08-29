# Terminal Output Monitoring and Auto-Continuation System

A comprehensive system for monitoring terminal output, detecting when Claude Code stops for permission or input, and automatically providing appropriate responses to continue execution seamlessly.

## Overview

The terminal monitoring system consists of four main components:

1. **TerminalMonitor**: Monitors terminal processes and captures output in real-time
2. **OutputParser**: Analyzes terminal output to detect various states and requirements
3. **AutoContinuation**: Generates intelligent responses to permission prompts and input requests
4. **TerminalIntegration**: High-level interface that combines all components

## Key Features

- ✅ **Real-time Terminal Monitoring**: Capture stdout/stderr from any command
- 🤖 **Intelligent Auto-Continuation**: Automatically respond to permission requests
- 🔍 **Pattern Recognition**: Detect various prompt types and contexts
- 📊 **State Management**: Track execution states (running, waiting, error, etc.)
- 🛡️ **Safety Mode**: Configurable safety checks for destructive operations
- 🔄 **Session Management**: Handle multiple concurrent monitoring sessions
- 📈 **Observable Streams**: Real-time event streaming for integration
- 💾 **Response Caching**: Minimize token usage through intelligent caching

## Quick Start

```typescript
import { TerminalIntegration } from './terminal';

// Create terminal integration
const integration = new TerminalIntegration({
  enableAutoPermissions: true,
  enableAutoInput: true,
  safetyMode: true,
  maxConcurrentSessions: 3
});

// Start monitoring a Claude Code session
const sessionId = await integration.startClaudeCodeSession([
  '/create', 'Modern React dashboard'
]);

// Listen for events
integration.on('session_continuation', (event) => {
  console.log(`Auto-response: ${event.response}`);
});

console.log(`Started monitoring session: ${sessionId}`);
```

## Architecture

### TerminalMonitor

The core monitoring component that:
- Spawns and manages child processes
- Captures stdout/stderr in real-time  
- Handles process lifecycle events
- Provides activity monitoring and timeout detection
- Supports auto-restart on unexpected exits

```typescript
import { TerminalMonitor } from './terminal';

const monitor = new TerminalMonitor({
  command: 'claude',
  args: ['code', '/create', 'My project'],
  timeout: 30000,
  maxRetries: 3
});

await monitor.start();
```

### OutputParser

Intelligent output analysis that:
- Uses regex patterns to detect various prompt types
- Maintains state machine for execution flow
- Extracts context and options from prompts
- Provides confidence scoring for pattern matches
- Supports custom pattern registration

```typescript
import { OutputParser, TerminalState } from './terminal';

const parser = new OutputParser();

// Add custom pattern
parser.addCustomPattern({
  pattern: /Custom prompt pattern\?/i,
  state: TerminalState.WAITING_PERMISSION,
  actionType: 'continue',
  confidence: 0.9
});

const result = parser.parse(terminalOutput);
console.log(`State: ${result.state}, Action: ${result.actionType}`);
```

### AutoContinuation

Response generation system that:
- Maintains templates for common prompt types
- Generates contextual responses based on output analysis
- Supports custom response templates
- Includes safety checks for destructive operations
- Tracks response history and statistics

```typescript
import { AutoContinuation } from './terminal';

const continuation = new AutoContinuation({
  enableAutoPermissions: true,
  safetyMode: true,
  defaultPermissionResponse: 'yes'
});

// Add custom response template
continuation.addResponseTemplate({
  pattern: /Install packages\?/i,
  response: 'y\n',
  confidence: 0.9,
  description: 'Package installation'
});

const response = continuation.generatePermissionResponse(parsedOutput);
```

### TerminalIntegration

High-level integration interface that:
- Combines all components into a unified system
- Manages multiple concurrent sessions
- Provides convenient methods for common operations
- Handles event forwarding and session lifecycle
- Supports configuration updates and statistics

## Configuration

### IntegrationConfig

```typescript
interface IntegrationConfig {
  maxConcurrentSessions?: number;  // Default: 5
  sessionTimeout?: number;         // Default: 300000 (5 minutes)
  enableLogging?: boolean;         // Default: true
  enableAutoPermissions?: boolean; // Default: true
  enableAutoInput?: boolean;       // Default: true
  safetyMode?: boolean;           // Default: true
  defaultPermissionResponse?: 'yes' | 'no' | 'ask'; // Default: 'yes'
  maxAutoResponses?: number;       // Default: 50
  responseDelay?: number;          // Default: 100ms
}
```

## Supported Patterns

The system recognizes various prompt patterns:

### Permission Requests
- "Do you want to continue? (y/n)"
- "Permission denied, proceed? (y/n)"
- "File exists, overwrite? (y/n)"
- "Are you sure? (y/n)"

### Claude Code Specific
- "Claude Code is requesting permission to..."
- "[Claude] ..." prompts
- Agent confirmation requests

### File Operations
- Directory creation prompts
- File deletion confirmations
- Overwrite confirmations

### Package Management
- npm install confirmations
- yarn add prompts
- Dependency installation requests

### Git Operations
- Push/pull confirmations
- Merge confirmations
- Branch operation prompts

## Integration with Command Handler

The system integrates seamlessly with the existing `EnhancedCommandHandler`:

```typescript
import { EnhancedCommandHandler } from '../commands/EnhancedCommandHandler';

const handler = new EnhancedCommandHandler();

// Start terminal monitoring
const result = await handler.handleTerminalMonitor([
  '/create', 'AI-powered dashboard'
]);

if (result.success) {
  console.log(`Monitoring started: ${result.validationResults.sessionId}`);
}

// Get monitoring stats
const stats = await handler.getTerminalStats();
console.log(`Active sessions: ${stats.stats.activeSessions}`);

// Stop monitoring
await handler.stopTerminalMonitoring(sessionId);
```

## Permission Bypass System Integration

Works seamlessly with the `PermissionBypassSystem`:

```typescript
// Configure bypass settings
const integration = new TerminalIntegration({
  enableAutoPermissions: true,
  safetyMode: false, // Disable for full bypass
  maxAutoResponses: 100
});

// Monitor with bypass enabled
const sessionId = await integration.startClaudeCodeSession([
  '/task', 'Add comprehensive testing'
]);
```

## Event System

The monitoring system provides comprehensive event streaming:

```typescript
integration.on('session_started', (event) => {
  console.log(`Session ${event.sessionId} started`);
});

integration.on('session_output', (event) => {
  console.log(`[${event.sessionId}] ${event.data}`);
});

integration.on('session_continuation', (event) => {
  console.log(`Auto-response: ${event.response}`);
});

integration.on('session_state_change', (event) => {
  console.log(`State: ${event.oldState} → ${event.newState}`);
});

integration.on('session_error', (event) => {
  console.error(`Error: ${event.error}`);
});

integration.on('session_exit', (event) => {
  console.log(`Exit code: ${event.code}`);
});
```

## Error Handling

Comprehensive error handling throughout:

```typescript
try {
  const sessionId = await integration.startClaudeCodeSession(command);
  // Monitor session...
} catch (error) {
  if (error.message.includes('Maximum concurrent sessions')) {
    // Handle session limit
  } else if (error.message.includes('Command not found')) {
    // Handle missing command
  } else {
    // Handle other errors
  }
}
```

## Safety Features

### Safety Mode
- Prevents automatic approval of destructive operations
- Requires manual confirmation for dangerous commands
- Validates file paths for system directories

### Response Limits
- Maximum number of auto-responses per session
- Timeout-based session termination
- Activity monitoring with inactivity detection

### Validation
- Pattern confidence scoring
- Context analysis before response generation
- Response history tracking and analysis

## Performance Optimization

### Token Usage
- Response caching to minimize repeated API calls
- Context windowing to limit analysis scope
- Intelligent pattern matching with confidence thresholds

### Memory Management
- Bounded output buffers
- Automatic cleanup of completed sessions
- Efficient event handler management

### Concurrent Sessions
- Configurable session limits
- Resource pooling and sharing
- Load balancing across sessions

## Testing

Run the example usage scenarios:

```bash
# Basic monitoring example
npm run terminal-monitor:basic

# Advanced monitoring with custom patterns
npm run terminal-monitor:advanced

# Integration with command handler
npm run terminal-monitor:integration

# Permission bypass integration
npm run terminal-monitor:bypass

# Run all examples
npm run terminal-monitor:examples
```

## File Structure

```
src/terminal/
├── index.ts                 # Main exports
├── TerminalMonitor.ts       # Core monitoring
├── OutputParser.ts          # Output analysis
├── AutoContinuation.ts      # Response generation
├── TerminalIntegration.ts   # High-level interface
├── examples/
│   └── usage-example.ts     # Usage examples
└── README.md               # This documentation
```

## Use Cases

### Development Automation
- Automatically approve package installations
- Continue through file overwrite prompts
- Handle git operation confirmations

### CI/CD Integration
- Unattended execution of Claude Code commands
- Automated testing and deployment workflows
- Error detection and recovery

### Interactive Development
- Seamless agent orchestration
- Continuous project development
- Real-time monitoring and feedback

### Enterprise Deployment
- Batch processing of projects
- Automated code review and validation
- Large-scale project management

## Best Practices

1. **Start with Safety Mode**: Always begin with `safetyMode: true`
2. **Monitor Resource Usage**: Set appropriate session limits
3. **Handle Events**: Always set up proper event listeners
4. **Graceful Shutdown**: Stop sessions cleanly on exit
5. **Log Everything**: Enable logging for debugging
6. **Test Patterns**: Validate custom patterns thoroughly
7. **Review Responses**: Monitor auto-responses for accuracy

## Troubleshooting

### Common Issues

**Session Won't Start**
- Check command availability
- Verify working directory permissions
- Review session limit configuration

**No Auto-Responses**
- Enable auto-permissions/auto-input
- Check pattern matching confidence
- Review safety mode settings

**High Resource Usage**
- Reduce concurrent session limit
- Increase cleanup intervals
- Monitor buffer sizes

**Pattern Recognition Failures**
- Add custom patterns for specific cases
- Adjust confidence thresholds
- Review output parsing logic

## Integration Examples

See `examples/usage-example.ts` for comprehensive integration examples including:
- Basic monitoring setup
- Advanced pattern recognition
- Command handler integration
- Permission bypass configuration

This terminal monitoring system provides a robust foundation for automating Claude Code interactions and ensuring continuous execution without manual intervention.