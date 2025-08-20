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
6. Analyze project requirements to determine which agents are needed
7. Dynamically scan available agents from .claude/agents/ folder
8. Create agent-todo folders ONLY for agents required by this project
9. Distribute tasks across selected agents based on their expertise
10. Generate phase[n]-todo.md files for each selected agent
11. Create phase-status.json to track progress
12. Update the project registry at src/project-registry/projects.json

Available agents are dynamically loaded from .claude/agents/ and may include:
- frontend-specialist: UI/UX and client-side development
- backend-specialist: Server and API development
- database-specialist: Data modeling and persistence
- devops-specialist: Infrastructure and deployment
- testing-specialist: Quality assurance and testing
- code-review-specialist: Code quality and review
- deployment-specialist: Production deployment
- Any other custom agents added to .claude/agents/

Ensure all specifications are optimized for minimal token usage while maintaining clarity.