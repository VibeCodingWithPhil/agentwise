# Token Optimization Strategy for Agentwise

## Overview
Multi-agent systems can consume significant tokens. This document outlines strategies to minimize token usage while maintaining speed and accuracy.

## Core Optimization Strategies

### 1. Spec File Compression
- **Problem**: Full project specs can be thousands of tokens
- **Solution**: Use structured, minimal spec format
- **Implementation**:
  ```markdown
  Instead of: "The frontend should have a navigation bar with links to home, about, contact..."
  Use: "nav: home|about|contact"
  ```
- **Token Savings**: ~70% reduction

### 2. Agent Communication Protocol
- **Problem**: Agents reading full context repeatedly
- **Solution**: Incremental context updates
- **Implementation**:
  - Use delta files instead of full specs
  - Agents only read changes since last check
  - Implement checksum-based change detection
- **Token Savings**: ~80% reduction on subsequent reads

### 3. Task Granularity
- **Problem**: Large task descriptions consume tokens
- **Solution**: Hierarchical task structure
- **Implementation**:
  ```yaml
  task: auth
  subtasks:
    - login: email|password
    - register: email|password|confirm
    - reset: email
  ```
- **Token Savings**: ~60% reduction

### 4. Prompt Templates
- **Problem**: Repetitive prompt structures
- **Solution**: Use template variables
- **Implementation**:
  ```javascript
  const promptTemplate = "Create ${component} with ${features}";
  // Reuse template with different variables
  ```
- **Token Savings**: ~50% reduction

### 5. Response Caching
- **Problem**: Re-generating similar responses
- **Solution**: Cache and reuse common patterns
- **Implementation**:
  - Cache agent responses by task hash
  - Reuse for similar tasks
  - Implement semantic similarity matching
- **Token Savings**: ~40% for repeated patterns

### 6. Selective Tool Usage
- **Problem**: Unnecessary tool calls consume tokens
- **Solution**: Smart tool selection
- **Implementation**:
  - Pre-filter files with glob before grep
  - Use file checksums to skip unchanged files
  - Batch similar operations
- **Token Savings**: ~30% reduction

### 7. Phase-Based Context Loading
- **Problem**: Loading entire project context
- **Solution**: Load only phase-relevant context
- **Implementation**:
  ```javascript
  // Phase 1: Only load setup specs
  // Phase 2: Only load implementation specs
  // Phase 3: Only load testing specs
  ```
- **Token Savings**: ~65% reduction per phase

### 8. Compressed Agent Instructions
- **Problem**: Verbose agent definitions
- **Solution**: Minimal agent specs with expansion on demand
- **Implementation**:
  ```yaml
  name: frontend
  focus: ui|ux|react
  expand: on-demand  # Full instructions loaded only when needed
  ```
- **Token Savings**: ~50% on agent initialization

## Implementation Priority

1. **Immediate (Before MVP)**:
   - Spec file compression
   - Task granularity
   - Phase-based context loading

2. **Short-term (With MVP)**:
   - Prompt templates
   - Selective tool usage
   - Compressed agent instructions

3. **Long-term (Post-MVP)**:
   - Response caching
   - Agent communication protocol
   - Semantic similarity matching

## Measurement Metrics

### Token Usage Targets:
- **Project Creation**: < 10,000 tokens per project
- **Feature Addition**: < 5,000 tokens per feature
- **Agent Communication**: < 500 tokens per message
- **Phase Transition**: < 1,000 tokens per phase

### Speed Targets:
- **Project Creation**: < 5 minutes
- **Feature Addition**: < 3 minutes
- **Agent Response**: < 10 seconds

## Best Practices

1. **Always use structured formats** (YAML/JSON) over prose
2. **Implement lazy loading** for all context
3. **Use checksums** to detect changes
4. **Batch operations** when possible
5. **Cache aggressively** but invalidate smartly
6. **Monitor token usage** per operation
7. **Set token budgets** per phase

## Example Optimized Workflow

```javascript
// Before optimization: ~5000 tokens
const spec = await readFullProjectSpec();
const tasks = await generateDetailedTasks(spec);
await distributeToAgents(tasks);

// After optimization: ~1000 tokens
const specHash = await getSpecChecksum();
if (hasChanged(specHash)) {
  const delta = await readSpecDelta();
  const tasks = await generateCompressedTasks(delta);
  await batchDistributeToAgents(tasks);
}
```

## Conclusion

By implementing these strategies, Agentwise can reduce token consumption by approximately **70%** while maintaining full functionality and accuracy. The key is intelligent context management and efficient communication protocols.