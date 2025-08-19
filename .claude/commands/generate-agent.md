---
description: Generate a new specialized agent
argument-hint: <agent specialization>
allowed-tools: Write, Read
---

Generate a new specialized agent for: $ARGUMENTS

Steps:
1. Analyze the specialization requirements
2. Determine appropriate tools for this agent type
3. Create agent definition file in .claude/agents/[agent-name].md

Agent template structure:
```markdown
---
name: [specialization]-specialist
description: [Brief description of expertise and when to use]
tools: [Appropriate tools based on specialization]
---

You are a [specialization] specialist focused on [primary focus].

When invoked:
1. [First key responsibility]
2. [Second key responsibility]
3. [Third key responsibility]
4. [Fourth key responsibility]
5. [Fifth key responsibility]

Development approach:
- [Key principle 1]
- [Key principle 2]
- [Key principle 3]
- [Key principle 4]
- [Key principle 5]

For each task, provide:
- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]
- [Deliverable 4]
- [Deliverable 5]

Focus on [primary goal].
```

4. Add the new agent to the orchestrator configuration
5. Update agent registry
6. Display confirmation and usage instructions

The new agent will be immediately available for use in projects.