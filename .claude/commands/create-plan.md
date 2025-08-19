---
description: Collaborative planning session with all 5 agents for a new project
argument-hint: <project idea>
allowed-tools: Read, Write, Task
---

Start a collaborative planning session for: $ARGUMENTS

Invoke all 5 specialist agents to contribute to the project planning:

1. **Frontend Specialist** (/agent "frontend-specialist"):
   - Analyze UI/UX requirements
   - Suggest component architecture
   - Recommend frontend technologies
   - Define user interaction flows

2. **Backend Specialist** (/agent "backend-specialist"):
   - Design API structure
   - Plan authentication and authorization
   - Define data flow and business logic
   - Suggest backend technologies

3. **Database Specialist** (/agent "database-specialist"):
   - Design data models
   - Plan database schema
   - Recommend database technologies
   - Define relationships and indexes

4. **DevOps Specialist** (/agent "devops-specialist"):
   - Plan infrastructure requirements
   - Design CI/CD pipeline
   - Define deployment strategy
   - Recommend monitoring solutions

5. **Testing Specialist** (/agent "testing-specialist"):
   - Define testing strategy
   - Plan test coverage requirements
   - Suggest testing frameworks
   - Define quality metrics

Synthesize all inputs into enhanced specification files:
- main-spec.md with collective insights
- project-spec.md with agreed technical stack
- todo-spec.md with prioritized tasks

Allow iterative refinement based on user feedback.