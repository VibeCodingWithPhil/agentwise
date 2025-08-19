---
description: Add a feature to the active project
argument-hint: <feature description>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

Add the following feature to the active project: $ARGUMENTS

Steps:
1. Read the active project from src/project-registry/projects.json
2. Navigate to the project's workspace folder
3. Read the existing project-context.md to understand current state
4. Analyze the feature requirements
5. Update the todo-spec.md with new tasks
6. Distribute new tasks to appropriate agents
7. Create or update phase files as needed
8. Trigger agent coordination for implementation

Ensure the feature integrates properly with existing architecture.