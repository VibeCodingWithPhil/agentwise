---
description: Initialize import of an external project
allowed-tools: Bash, Read, Write, Glob
---

Initialize the import of an existing external project into Agentwise.

Steps:
1. Use system file dialog to select project folder:
   ```bash
   # macOS: Use osascript
   # Windows: Use PowerShell
   # Linux: Use zenity or kdialog
   ```

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