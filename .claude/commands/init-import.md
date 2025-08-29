---
description: Initialize import of an external project
allowed-tools: Bash, Read, Write, Glob
---

Initialize the import of an existing external project into Agentwise.

Steps:
1. Run the secured import initialization:
   ```bash
   cd /Users/philipritmeester/Agentwise && node src/index.ts /init-import
   ```
   This will prompt for the project folder path using secure readline input

2. Analyze the selected project:
   - Detect programming languages
   - Identify frameworks and libraries
   - Check for package.json, requirements.txt, go.mod, etc.
   - Find build configuration files
   - Locate test files

3. Create project entry in src/project-registry/projects.json with:
   - Project name (from folder name)
   - Original path (linked, not copied)
   - Detected technologies
   - Project type
   - Import status: "initialized"

4. Generate initial project-context.md with:
   - Project structure overview
   - Detected tech stack
   - Build commands found
   - Test commands identified

5. Prepare for /task-import command

Display summary of detected project characteristics and confirm readiness for import.