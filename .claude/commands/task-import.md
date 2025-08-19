---
description: Execute import with automatic collaborative planning
allowed-tools: Read, Write, Bash, Task, Glob
---

Execute the import of the initialized project with collaborative analysis.

Steps:
1. Read the initialized project from src/project-registry/projects.json
2. Copy the project to workspace/[project-name]/
3. Automatically trigger collaborative planning mode:

**All 5 Agents Analyze the Codebase:**

Frontend Specialist (/agent "frontend-specialist"):
- Identify UI frameworks and patterns
- Map component structure
- Analyze styling approach
- Document state management

Backend Specialist (/agent "backend-specialist"):
- Map API endpoints
- Identify business logic patterns
- Document middleware and services
- Analyze authentication implementation

Database Specialist (/agent "database-specialist"):
- Analyze data models
- Document database connections
- Map relationships
- Identify optimization opportunities

DevOps Specialist (/agent "devops-specialist"):
- Review deployment configuration
- Identify CI/CD setup
- Document infrastructure requirements
- Analyze environment variables

Testing Specialist (/agent "testing-specialist"):
- Assess current test coverage
- Identify testing frameworks
- Document test patterns
- Find testing gaps

4. Generate comprehensive project-context.md
5. Create initial phase files for continuation
6. Update project status to "imported"
7. Display project analysis summary

The project is now fully integrated with Agentwise and ready for feature development using /task commands.