// Terminal monitoring and auto-continuation system
export { TerminalMonitor, type TerminalConfig, type MonitorEvent } from './TerminalMonitor';
export { 
  OutputParser, 
  TerminalState, 
  type ParsedOutput, 
  type PatternMatch 
} from './OutputParser';
export { 
  AutoContinuation, 
  type ResponseTemplate, 
  type ContinuationConfig 
} from './AutoContinuation';
export { 
  TerminalIntegration, 
  type TerminalSession, 
  type IntegrationConfig 
} from './TerminalIntegration';