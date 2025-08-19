---
description: Create a new project with multi-agent orchestration
argument-hint: <project idea>
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
---

Create a new Agentwise project with the following idea: $ARGUMENTS

Please follow these steps:

1. Generate a unique project name from the idea
2. Create workspace directory at workspace/[project-name]
3. Initialize project structure with src/ and specs/ folders
4. Generate enhanced specifications:
   - main-spec.md: Core concept and architecture
   - project-spec.md: Technical implementation details
   - todo-spec.md: Task breakdown and phases
5. Analyze project complexity to determine number of phases
6. Create agent-todo folders for each of the 5 specialists
7. Distribute tasks across agents based on their expertise
8. Generate phase[n]-todo.md files for each agent
9. Create phase-status.json to track progress
10. Update the project registry at src/project-registry/projects.json

The 5 specialist agents are:
- frontend-specialist: UI/UX and client-side development
- backend-specialist: Server and API development
- database-specialist: Data modeling and persistence
- devops-specialist: Infrastructure and deployment
- testing-specialist: Quality assurance and testing

Ensure all specifications are optimized for minimal token usage while maintaining clarity.