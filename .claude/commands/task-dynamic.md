---
description: Handler for /task-[project] dynamic commands
argument-hint: <feature description>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Dynamic Task Command Handler

This handles commands in the format: /task-[project-name] <feature>

Parse the command to extract:
1. Project name from the command itself
2. Feature description from $ARGUMENTS

Steps:
1. Extract project name from the command pattern
2. Navigate to workspace/[project-name]/
3. Verify project exists in src/project-registry/projects.json
4. Read existing project-context.md
5. Analyze the feature: $ARGUMENTS
6. Update todo-spec.md with new tasks
7. Distribute tasks to appropriate agents
8. Update phase files as needed
9. Log activity in project registry

Ensure feature integrates with existing project architecture.