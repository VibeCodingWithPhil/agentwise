# Performance Analytics

Comprehensive performance tracking and analytics for all Agentwise agents.

## Overview

The Performance Analytics system provides real-time insights into:
- Agent task execution metrics
- Success and failure rates
- Token usage optimization
- Error tracking and recovery
- Performance bottlenecks

## Key Metrics

### Agent Metrics
- **Tasks Completed**: Total successful task completions
- **Success Rate**: Percentage of successful operations
- **Average Duration**: Mean task completion time
- **Error Count**: Number of failures with categorization
- **Token Usage**: API tokens consumed per agent

### System Metrics
- **Total Throughput**: Tasks processed per hour
- **Parallel Efficiency**: Multi-agent coordination effectiveness
- **Resource Utilization**: CPU, memory, and network usage
- **Cost Analysis**: Token costs broken down by agent and task

## Dashboard Features

### Real-Time Monitoring
```javascript
// Accessible at http://localhost:3001 when monitor is running
{
  "agents": {
    "frontend-specialist": {
      "status": "active",
      "currentTask": "Building React component",
      "tasksCompleted": 45,
      "successRate": 95.5,
      "avgDuration": "2.3s"
    }
  }
}
```

### Historical Analysis
- Trend graphs for performance over time
- Comparative analysis between agents
- Task complexity vs. completion time
- Error pattern identification

## Implementation

### Starting Analytics

Analytics automatically start when agents are launched:

```typescript
const analytics = new PerformanceAnalytics();
await analytics.startTracking(agentName);
```

### Recording Metrics

```typescript
// Task completion
analytics.recordTaskCompletion(agentName, taskId, duration);

// Error tracking
analytics.recordError(agentName, errorType, details);

// Token usage
analytics.recordTokenUsage(agentName, tokens);
```

### Generating Reports

```typescript
// Get agent summary
const summary = await analytics.getAgentSummary('frontend-specialist');

// Get system-wide metrics
const metrics = await analytics.getSystemMetrics();

// Export detailed report
await analytics.exportReport('csv', './reports/performance.csv');
```

## Optimization Insights

### Automatic Recommendations

The system provides automatic optimization suggestions:

1. **Agent Load Balancing**
   - Identifies overloaded agents
   - Suggests task redistribution

2. **Token Optimization**
   - Highlights high token consumption patterns
   - Recommends context reduction strategies

3. **Error Prevention**
   - Identifies recurring error patterns
   - Suggests preventive measures

### Performance Patterns

Common patterns identified:

```javascript
{
  "patterns": {
    "morningPeak": {
      "time": "09:00-11:00",
      "load": "high",
      "recommendation": "Pre-warm agents"
    },
    "complexTasks": {
      "avgDuration": "5x normal",
      "recommendation": "Break into subtasks"
    }
  }
}
```

## Integration with Self-Improving Agents

Performance data feeds into agent learning:

```typescript
// Agent learns from performance data
const learningData = analytics.getLearningData(agentName);
await selfImprovingAgent.learn(learningData);
```

## Configuration

### Analytics Settings

Configure in `.agentwise/analytics.json`:

```json
{
  "enabled": true,
  "metricsInterval": 5000,
  "retentionDays": 30,
  "exportFormat": "json",
  "alerts": {
    "errorThreshold": 10,
    "successRateMin": 80,
    "tokenBudget": 100000
  }
}
```

### Custom Metrics

Add custom metrics for specific needs:

```typescript
analytics.defineCustomMetric('codeQuality', {
  type: 'gauge',
  unit: 'score',
  description: 'Code quality score from linter'
});

analytics.recordCustomMetric('codeQuality', 95);
```

## Alerts and Notifications

### Alert Types

1. **Error Spike**: Sudden increase in error rate
2. **Performance Degradation**: Slow task completion
3. **Token Budget Exceeded**: Over API usage limits
4. **Agent Failure**: Agent crashes or hangs

### Alert Configuration

```json
{
  "alerts": [
    {
      "type": "errorRate",
      "threshold": 20,
      "window": "5m",
      "action": "notify"
    },
    {
      "type": "tokenUsage",
      "threshold": 90,
      "unit": "percent",
      "action": "throttle"
    }
  ]
}
```

## Best Practices

### 1. Regular Monitoring

- Check dashboard daily for trends
- Review weekly performance reports
- Act on optimization recommendations

### 2. Baseline Establishment

- Run initial benchmarks
- Document expected performance
- Set realistic thresholds

### 3. Continuous Improvement

- Use data for agent training
- Implement suggested optimizations
- Track improvement over time

## API Reference

### Core Methods

```typescript
class PerformanceAnalytics {
  // Start tracking an agent
  startTracking(agentName: string): Promise<void>
  
  // Record metrics
  recordTaskCompletion(agent: string, task: string, duration: number): void
  recordError(agent: string, error: Error): void
  recordTokenUsage(agent: string, tokens: number): void
  
  // Get analytics
  getAgentSummary(agent: string): AgentSummary
  getSystemMetrics(): SystemMetrics
  getOptimizationSuggestions(): Suggestion[]
  
  // Export data
  exportReport(format: string, path: string): Promise<void>
  exportMetrics(timeRange: TimeRange): Promise<MetricsData>
}
```

## Troubleshooting

### High Token Usage

1. Check context sizes in analytics
2. Enable token optimization
3. Review agent task distribution

### Poor Success Rates

1. Analyze error patterns
2. Check agent specialization alignment
3. Review task complexity

### Performance Degradation

1. Check system resources
2. Review parallel agent count
3. Analyze task queuing

## Future Enhancements

- Machine learning for predictive analytics
- Advanced visualization dashboard
- Integration with external monitoring tools
- Cost prediction and budgeting