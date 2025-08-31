/**
 * Requirements Planning System
 * 
 * A comprehensive system for generating, enhancing, and validating project requirements.
 * This system takes a simple project idea and transforms it into detailed, structured
 * requirements with tech stack recommendations, timeline estimates, and team suggestions.
 */

// Main components
export { RequirementsGenerator } from './RequirementsGenerator';
export { RequirementsEnhancer } from './RequirementsEnhancer';
export { RequirementsValidator } from './RequirementsValidator';
export { VisualSpecGenerator } from './VisualSpecGenerator';

// Types and interfaces
export * from './types';

// Test utilities
export { testRequirementsSystem } from './test-requirements';

// Quick usage examples:
// 
// Basic usage:
// import { RequirementsGenerator } from './requirements';
// 
// const generator = new RequirementsGenerator();
// const result = await generator.generateRequirements({
//   projectIdea: 'A social media platform for developers',
//   targetAudience: 'intermediate'
// });
// 
// Advanced usage with validation:
// const result = await generator.generateRequirements({
//   projectIdea: 'An e-commerce site with real-time inventory',
//   validateOutput: true,
//   optimizeForCompatibility: true,
//   preferredTechnologies: ['React', 'Node.js', 'PostgreSQL'],
//   budgetConstraint: '50k-100k',
//   timelineConstraint: 120 // days
// });
// 
// Multiple variants:
// const variants = await generator.generateMultipleOptions({
//   projectIdea: 'A task management app for remote teams'
// }, 3);