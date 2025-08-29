/**
 * Context Module Exports
 * 
 * Shared context system for token optimization across agents
 */

export { SharedContextServer } from './SharedContextServer';
export { SharedContextClient } from './SharedContextClient';
export { ContextIntegration } from './ContextIntegration';
export { ProjectContextManager } from './ProjectContextManager';
export { startContextServer } from './startContextServer';

// Type exports
export type {
  ContextVersion,
  ContextDiff,
  SharedContext,
  ContextSubscription
} from './SharedContextServer';

export type {
  ClientConfig,
  ContextUpdateEvent
} from './SharedContextClient';

export type {
  ContextIntegrationConfig
} from './ContextIntegration';

export type {
  ProjectContext
} from './ProjectContextManager';