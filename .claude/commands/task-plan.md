---
description: Collaborative planning for adding features to existing project
argument-hint: <feature description>
allowed-tools: Read, Write, Task
---

Start a collaborative feature planning session for: $ARGUMENTS

Steps:
1. Read the active project from src/project-registry/projects.json
2. Load project-context.md to understand existing architecture
3. Invoke all 5 specialist agents to plan the feature:

**Frontend Specialist** (/agent "frontend-specialist"):
- How to integrate UI components
- User interaction changes needed
- State management updates

**Backend Specialist** (/agent "backend-specialist"):
- API endpoints required
- Business logic modifications
- Data validation needs

**Database Specialist** (/agent "database-specialist"):
- Schema changes if needed
- Query optimizations
- Data migration requirements

**DevOps Specialist** (/agent "devops-specialist"):
- Deployment considerations
- Configuration changes
- Scaling requirements

**Testing Specialist** (/agent "testing-specialist"):
- Test cases for new feature
- Integration test updates
- Coverage requirements

4. Create feature-spec.md with collective recommendations
5. Update todo-spec.md with agreed implementation tasks
6. Generate implementation plan ready for /task command