#!/usr/bin/env node

import { intro, outro, text, select, confirm, spinner, isCancel, cancel, note } from '@clack/prompts'
import chalk from 'chalk'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import simpleGit from 'simple-git'

interface InstallOptions {
  installPath: string
  action: 'install' | 'update'
  existingPath?: string
}

class AgentwiseInstaller {
  private homeDir = os.homedir()
  private defaultPath = path.join(this.homeDir, 'agentwise')

  async main() {
    console.clear()
    
    intro(chalk.bgBlue.white(' Agentwise Installer v2.3.0 '))
    
    note(
      `🚀 Welcome to Agentwise - AI Multi-Agent Development Platform
      
📋 This installer will:
• Check for existing installation
• Allow you to choose installation location
• Download and setup Agentwise
• Configure your development environment
      
🔒 Security: All actions are transparent and require your confirmation`,
      'What this installer does'
    )

    try {
      const options = await this.gatherOptions()
      if (!options) return

      if (options.action === 'install') {
        await this.performInstallation(options)
      } else {
        await this.performUpdate(options)
      }

      outro(chalk.green('✅ Agentwise setup completed successfully!'))
      this.showNextSteps(options)
      
    } catch (error) {
      cancel('Installation failed: ' + (error as Error).message)
      process.exit(1)
    }
  }

  private async gatherOptions(): Promise<InstallOptions | null> {
    // Check for existing installation
    const existingInstallation = await this.findExistingInstallation()
    
    if (existingInstallation) {
      note(
        `Found existing Agentwise installation at:
${chalk.cyan(existingInstallation)}`,
        'Existing Installation Detected'
      )

      const action = await select({
        message: 'What would you like to do?',
        options: [
          { value: 'update', label: 'Update existing installation' },
          { value: 'install', label: 'Install in a different location' },
          { value: 'cancel', label: 'Cancel installation' }
        ]
      })

      if (isCancel(action) || action === 'cancel') {
        cancel('Installation cancelled')
        return null
      }

      if (action === 'update') {
        return {
          action: 'update',
          installPath: existingInstallation,
          existingPath: existingInstallation
        }
      }
    }

    // Get installation path
    const pathChoice = await select({
      message: 'Where would you like to install Agentwise?',
      options: [
        { 
          value: 'default', 
          label: `Default location (${this.defaultPath})`,
          hint: 'Recommended'
        },
        { 
          value: 'custom', 
          label: 'Custom location',
          hint: 'You choose the path'
        }
      ]
    })

    if (isCancel(pathChoice)) {
      cancel('Installation cancelled')
      return null
    }

    let installPath = this.defaultPath

    if (pathChoice === 'custom') {
      const customPath = await text({
        message: 'Enter the full path where you want to install Agentwise:',
        placeholder: '/path/to/agentwise',
        validate: (value) => {
          if (!value) return 'Path is required'
          if (!path.isAbsolute(value)) return 'Please provide an absolute path'
          return undefined
        }
      })

      if (isCancel(customPath)) {
        cancel('Installation cancelled')
        return null
      }

      installPath = customPath as string
    }

    // Confirm installation
    const confirmed = await confirm({
      message: `Install Agentwise to: ${chalk.cyan(installPath)}?`
    })

    if (isCancel(confirmed) || !confirmed) {
      cancel('Installation cancelled')
      return null
    }

    return {
      action: 'install',
      installPath
    }
  }

  private async findExistingInstallation(): Promise<string | null> {
    const commonPaths = [
      this.defaultPath,
      path.join(this.homeDir, 'Documents', 'agentwise'),
      path.join(this.homeDir, 'Desktop', 'agentwise'),
      path.join(process.cwd(), 'agentwise')
    ]

    for (const checkPath of commonPaths) {
      if (await this.isAgentwiseDirectory(checkPath)) {
        return checkPath
      }
    }

    return null
  }

  private async isAgentwiseDirectory(dirPath: string): Promise<boolean> {
    try {
      if (!await fs.pathExists(dirPath)) return false
      
      const packageJsonPath = path.join(dirPath, 'package.json')
      if (!await fs.pathExists(packageJsonPath)) return false
      
      const packageJson = await fs.readJson(packageJsonPath)
      return packageJson.name === 'agentwise'
    } catch {
      return false
    }
  }

  private async performInstallation(options: InstallOptions) {
    const s = spinner()
    
    try {
      // Check Node.js version
      s.start('Checking system requirements...')
      await this.checkNodeVersion()
      s.stop('✅ System requirements met')

      // Create directory
      s.start(`Creating directory: ${options.installPath}`)
      await fs.ensureDir(options.installPath)
      s.stop('✅ Directory created')

      // Clone repository
      s.start('Downloading Agentwise from GitHub...')
      const git = simpleGit()
      await git.clone(
        'https://github.com/VibeCodingWithPhil/agentwise.git',
        options.installPath,
        ['--depth', '1']
      )
      s.stop('✅ Repository cloned')

      // Install dependencies
      s.start('Installing dependencies... (this may take a few minutes)')
      process.chdir(options.installPath)
      execSync('npm install --legacy-peer-deps', { 
        stdio: 'pipe',
        cwd: options.installPath 
      })
      s.stop('✅ Dependencies installed')

      // Setup environment
      s.start('Setting up environment...')
      await this.setupEnvironment(options.installPath)
      s.stop('✅ Environment configured')

      // Create start script
      s.start('Creating startup scripts...')
      await this.createStartupScripts(options.installPath)
      s.stop('✅ Startup scripts created')

    } catch (error) {
      s.stop('❌ Installation failed')
      throw error
    }
  }

  private async performUpdate(options: InstallOptions) {
    const s = spinner()
    
    try {
      s.start('Backing up workspace...')
      await this.backupWorkspace(options.installPath)
      s.stop('✅ Workspace backed up')

      s.start('Updating from GitHub...')
      const git = simpleGit(options.installPath)
      await git.stash()
      await git.pull('origin', 'main')
      s.stop('✅ Code updated')

      s.start('Updating dependencies...')
      execSync('npm install --legacy-peer-deps', { 
        stdio: 'pipe',
        cwd: options.installPath 
      })
      s.stop('✅ Dependencies updated')

    } catch (error) {
      s.stop('❌ Update failed')
      throw error
    }
  }

  private async checkNodeVersion() {
    const nodeVersion = process.version
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0])
    
    if (majorVersion < 18) {
      throw new Error(`Node.js 18+ required. Current: ${nodeVersion}. Please upgrade at https://nodejs.org/`)
    }
  }

  private async setupEnvironment(installPath: string) {
    const envPath = path.join(installPath, '.env')
    
    if (!await fs.pathExists(envPath)) {
      const envContent = `# Agentwise Configuration
NODE_ENV=production
PORT=3001

# Optional: Add your API keys here
# OPENAI_API_KEY=your_key_here
# GITHUB_TOKEN=your_token_here
# ANTHROPIC_API_KEY=your_key_here
`
      await fs.writeFile(envPath, envContent)
    }

    // Create necessary directories
    const dirs = ['workspace', '.claude/agents', '.claude/commands', 'logs', 'backups']
    for (const dir of dirs) {
      await fs.ensureDir(path.join(installPath, dir))
    }
  }

  private async createStartupScripts(installPath: string) {
    // Cross-platform start script (JavaScript)
    const startScript = `#!/usr/bin/env node

const path = require('path')
const { spawn } = require('child_process')

console.log('🚀 Starting Agentwise...')

// Find entry point
const entryPoints = [
  path.join(__dirname, 'dist', 'index.js'),
  path.join(__dirname, 'src', 'index.js'),
  path.join(__dirname, 'index.js')
]

let entryPoint = null
for (const point of entryPoints) {
  if (require('fs').existsSync(point)) {
    entryPoint = point
    break
  }
}

if (!entryPoint) {
  console.error('❌ Could not find entry point. Please check installation.')
  process.exit(1)
}

// Start the application
const child = spawn('node', [entryPoint], { 
  stdio: 'inherit',
  cwd: __dirname 
})

child.on('close', (code) => {
  console.log(\`Agentwise exited with code \${code}\`)
})`

    await fs.writeFile(path.join(installPath, 'start.js'), startScript)
    
    // Make executable on Unix systems
    if (process.platform !== 'win32') {
      await fs.chmod(path.join(installPath, 'start.js'), '755')
    }

    // Create platform-specific shortcuts
    if (process.platform === 'win32') {
      // Windows batch file
      const batScript = `@echo off
cd /d "%~dp0"
node start.js
pause`
      await fs.writeFile(path.join(installPath, 'start-agentwise.bat'), batScript)
    } else {
      // Unix shell script
      const shellScript = `#!/bin/bash
cd "$(dirname "$0")"
node start.js`
      await fs.writeFile(path.join(installPath, 'start-agentwise.sh'), shellScript)
      await fs.chmod(path.join(installPath, 'start-agentwise.sh'), '755')
    }
  }

  private async backupWorkspace(installPath: string) {
    const workspacePath = path.join(installPath, 'workspace')
    const backupPath = path.join(installPath, 'backups', `workspace-backup-${Date.now()}`)
    
    if (await fs.pathExists(workspacePath)) {
      await fs.copy(workspacePath, backupPath)
    }
  }

  private showNextSteps(options: InstallOptions) {
    const platform = process.platform
    const startCommand = platform === 'win32' 
      ? 'start-agentwise.bat' 
      : './start-agentwise.sh'
    
    note(
      `To start Agentwise:
${chalk.cyan(`cd ${options.installPath}`)}
${chalk.cyan(platform === 'win32' ? 'start-agentwise.bat' : 'node start.js')}

Or double-click: ${chalk.yellow(startCommand)}

For Claude Code integration:
${chalk.cyan('Open Claude Code and run: /setup-mcps')}

Documentation: ${chalk.blue('https://agentwise-docs.vercel.app')}
GitHub: ${chalk.blue('https://github.com/VibeCodingWithPhil/agentwise')}`,
      'Next Steps'
    )
  }
}

// Run the installer
const installer = new AgentwiseInstaller()
installer.main().catch((error) => {
  console.error(chalk.red('Installation failed:'), error.message)
  process.exit(1)
})