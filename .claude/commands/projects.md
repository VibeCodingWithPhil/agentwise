---
description: List and select from existing Agentwise projects
allowed-tools: Read, Bash
---

List all existing Agentwise projects and allow selection:

1. Read the project registry from src/project-registry/projects.json
2. Display all projects with:
   - Project name
   - Creation date
   - Current status
   - Last modified
   - Brief description
3. Show project count and workspace usage
4. If projects exist, prompt user to select one to make it active
5. Update the active project in the registry

Format the output as a clean, numbered list for easy selection.