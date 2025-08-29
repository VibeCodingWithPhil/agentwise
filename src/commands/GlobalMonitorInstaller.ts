/**
 * Global Monitor Command Installer - Creates a global 'agentwise-monitor' command
 * Works cross-platform: Windows, WSL, Linux, macOS
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface InstallResult {
  success: boolean;
  message: string;
  commandPath?: string;
  platform: string;
}

export class GlobalMonitorInstaller {
  private platform: string;
  private homeDir: string;
  private agentWisePath: string;

  constructor() {
    this.platform = this.detectPlatform();
    this.homeDir = os.homedir();
    this.agentWisePath = process.cwd();
  }

  /**
   * Install the global monitor command
   */
  async install(): Promise<InstallResult> {
    console.log('🔧 Installing global agentwise-monitor command...');
    console.log(`Platform detected: ${this.platform}`);

    try {
      switch (this.platform) {
        case 'windows':
          return await this.installWindows();
        case 'wsl':
          return await this.installWSL();
        case 'linux':
          return await this.installLinux();
        case 'macos':
          return await this.installMacOS();
        default:
          throw new Error(`Unsupported platform: ${this.platform}`);
      }
    } catch (error) {
      return {
        success: false,
        message: `Installation failed: ${error instanceof Error ? error.message : String(error)}`,
        platform: this.platform
      };
    }
  }

  /**
   * Check if global command is already installed
   */
  async isInstalled(): Promise<boolean> {
    try {
      await execAsync('agentwise-monitor --version', { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Uninstall the global command
   */
  async uninstall(): Promise<InstallResult> {
    console.log('🗑️  Uninstalling global agentwise-monitor command...');

    try {
      const binPath = await this.getGlobalBinPath();
      const commandPath = path.join(binPath, 'agentwise-monitor');
      
      if (await fs.pathExists(commandPath)) {
        await fs.remove(commandPath);
      }

      // Windows batch file
      if (this.platform === 'windows') {
        const batPath = path.join(binPath, 'agentwise-monitor.bat');
        if (await fs.pathExists(batPath)) {
          await fs.remove(batPath);
        }
      }

      return {
        success: true,
        message: 'Global command uninstalled successfully',
        platform: this.platform
      };
    } catch (error) {
      return {
        success: false,
        message: `Uninstall failed: ${error instanceof Error ? error.message : String(error)}`,
        platform: this.platform
      };
    }
  }

  /**
   * Install on Windows
   */
  private async installWindows(): Promise<InstallResult> {
    const binPath = await this.getGlobalBinPath();
    await fs.ensureDir(binPath);

    // SECURITY: Validate path before creating batch file
    if (!this.validateAgentWisePath(this.agentWisePath)) {
      throw new Error('Security validation failed: Invalid Agentwise path');
    }
    
    // Create batch file for Windows with secure path handling
    // Use absolute path and validate it's within expected boundaries
    const resolvedPath = path.resolve(this.agentWisePath);
    const batContent = `@echo off
rem Agentwise Monitor Launcher - Security Enhanced
set "AGENTWISE_PATH=${resolvedPath}"
if not exist "%AGENTWISE_PATH%" (
  echo Error: Agentwise path not found
  exit /b 1
)
cd /d "%AGENTWISE_PATH%"
cd src\\monitor
start "" cmd /c "start.sh"
`;

    const batPath = path.join(binPath, 'agentwise-monitor.bat');
    await fs.writeFile(batPath, batContent);

    // Also create shell script for WSL compatibility
    await this.createUnixScript(binPath);

    return {
      success: true,
      message: 'Global command installed successfully for Windows',
      commandPath: batPath,
      platform: this.platform
    };
  }

  /**
   * Install on WSL
   */
  private async installWSL(): Promise<InstallResult> {
    const binPath = await this.getGlobalBinPath();
    await fs.ensureDir(binPath);

    // SECURITY: Validate path before creating script
    if (!this.validateAgentWisePath(this.agentWisePath)) {
      throw new Error('Security validation failed: Invalid Agentwise path');
    }
    
    // Create script that works in WSL environment with secure path handling
    const resolvedPath = path.resolve(this.agentWisePath);
    const scriptContent = `#!/bin/bash
# Agentwise Monitor - WSL Compatible - Security Enhanced

# Validate path exists and is safe
AGENTWISE_PATH="${resolvedPath}"
if [ ! -d "$AGENTWISE_PATH" ]; then
  echo "Error: Agentwise path not found"
  exit 1
fi
cd "$AGENTWISE_PATH"

# Check if we're in WSL
if grep -qi microsoft /proc/version; then
    echo "🔍 WSL detected - starting monitor..."
    cd src/monitor
    ./start.sh
    
    # Try to open browser in Windows
    if command -v cmd.exe > /dev/null 2>&1; then
        cmd.exe /c start http://localhost:3001 > /dev/null 2>&1 &
    fi
else
    echo "🔍 Linux environment detected"
    cd src/monitor
    ./start.sh
fi
`;

    return await this.createUnixScript(binPath, scriptContent);
  }

  /**
   * Install on Linux
   */
  private async installLinux(): Promise<InstallResult> {
    const binPath = await this.getGlobalBinPath();
    await fs.ensureDir(binPath);

    return await this.createUnixScript(binPath);
  }

  /**
   * Install on macOS
   */
  private async installMacOS(): Promise<InstallResult> {
    const binPath = await this.getGlobalBinPath();
    await fs.ensureDir(binPath);

    return await this.createUnixScript(binPath);
  }

  /**
   * Create Unix-style script
   */
  private async createUnixScript(binPath: string, customContent?: string): Promise<InstallResult> {
    const escapedPath = this.agentWisePath.replace(/'/g, "'\"'\"'"); // Escape single quotes for bash
    const scriptContent = customContent || `#!/bin/bash
# Agentwise Monitor Global Command

AGENTWISE_PATH='${escapedPath}'
cd "$AGENTWISE_PATH" || {
    echo "❌ Error: Agentwise directory not found at $AGENTWISE_PATH"
    echo "Please reinstall Agentwise or run the monitor from the project directory"
    exit 1
}

echo "🚀 Starting Agentwise Monitor..."
echo "📍 Project path: $AGENTWISE_PATH"

cd src/monitor || {
    echo "❌ Error: Monitor directory not found"
    exit 1
}

./start.sh
`;

    const scriptPath = path.join(binPath, 'agentwise-monitor');
    await fs.writeFile(scriptPath, scriptContent);
    await fs.chmod(scriptPath, '755'); // Make executable

    return {
      success: true,
      message: `Global command installed successfully for ${this.platform}`,
      commandPath: scriptPath,
      platform: this.platform
    };
  }

  /**
   * Get the global bin path for the current platform
   */
  private async getGlobalBinPath(): Promise<string> {
    let binPath: string;

    switch (this.platform) {
      case 'windows':
        // Windows: Use user's local bin or create one
        binPath = path.join(this.homeDir, 'AppData', 'Local', 'bin');
        await this.ensurePathInEnvironment(binPath);
        break;

      case 'wsl':
      case 'linux':
        // Linux/WSL: Use ~/.local/bin (standard user bin directory)
        binPath = path.join(this.homeDir, '.local', 'bin');
        await this.ensurePathInEnvironment(binPath);
        break;

      case 'macos':
        // macOS: Use /usr/local/bin if accessible, otherwise ~/.local/bin
        try {
          await fs.access('/usr/local/bin', fs.constants.W_OK);
          binPath = '/usr/local/bin';
        } catch {
          binPath = path.join(this.homeDir, '.local', 'bin');
          await this.ensurePathInEnvironment(binPath);
        }
        break;

      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }

    return binPath;
  }

  /**
   * Ensure the bin path is in the system PATH
   */
  private async ensurePathInEnvironment(binPath: string): Promise<void> {
    const currentPath = process.env.PATH || '';
    
    if (!currentPath.includes(binPath)) {
      console.log(`⚠️  Note: ${binPath} is not in your PATH`);
      console.log('You may need to add it to your shell profile:');
      
      switch (this.platform) {
        case 'windows':
          console.log(`   Add ${binPath} to your Windows PATH environment variable`);
          break;
        case 'wsl':
        case 'linux':
          console.log(`   echo 'export PATH="$PATH:${binPath}"' >> ~/.bashrc`);
          console.log(`   source ~/.bashrc`);
          break;
        case 'macos':
          console.log(`   echo 'export PATH="$PATH:${binPath}"' >> ~/.zshrc`);
          console.log(`   source ~/.zshrc`);
          break;
      }
    }
  }

  /**
   * Detect the current platform
   */
  private detectPlatform(): string {
    const platform = os.platform();

    if (platform === 'win32') {
      // Check if we're in WSL
      try {
        const release = os.release();
        if (release.includes('Microsoft') || release.includes('WSL')) {
          return 'wsl';
        }
      } catch {
        // Fallback to checking /proc/version
        try {
          const procVersion = require('fs').readFileSync('/proc/version', 'utf8');
          if (procVersion.includes('Microsoft') || procVersion.includes('WSL')) {
            return 'wsl';
          }
        } catch {
          // Not WSL
        }
      }
      return 'windows';
    }

    if (platform === 'darwin') {
      return 'macos';
    }

    if (platform === 'linux') {
      // Double-check for WSL
      try {
        const procVersion = require('fs').readFileSync('/proc/version', 'utf8');
        if (procVersion.includes('Microsoft') || procVersion.includes('WSL')) {
          return 'wsl';
        }
      } catch {
        // Pure Linux
      }
      return 'linux';
    }

    return platform;
  }

  /**
   * Get installation status and info
   */
  async getStatus(): Promise<{
    installed: boolean;
    platform: string;
    commandPath?: string;
    version?: string;
  }> {
    const installed = await this.isInstalled();
    const status = {
      installed,
      platform: this.platform
    };

    if (installed) {
      try {
        const binPath = await this.getGlobalBinPath();
        const commandPath = path.join(binPath, 'agentwise-monitor');
        
        if (await fs.pathExists(commandPath)) {
          Object.assign(status, {
            commandPath,
            version: '1.0.0'
          });
        }
      } catch {
        // Ignore errors getting additional info
      }
    }

    return status;
  }

  /**
   * SECURITY: Validate Agentwise path to prevent path injection
   */
  private validateAgentWisePath(inputPath: string): boolean {
    try {
      // Basic validation
      if (!inputPath || typeof inputPath !== 'string') {
        return false;
      }

      // Resolve to absolute path
      const resolvedPath = path.resolve(inputPath);
      
      // Check for dangerous patterns
      const dangerousPatterns = ['..', '~', '${', '`', '|', ';', '&', '>', '<'];
      for (const pattern of dangerousPatterns) {
        if (inputPath.includes(pattern)) {
          console.log('⚠️  Path contains dangerous patterns');
          return false;
        }
      }

      // Ensure path exists and is a directory
      if (!fs.existsSync(resolvedPath)) {
        console.log('⚠️  Agentwise path does not exist');
        return false;
      }

      const stats = fs.statSync(resolvedPath);
      if (!stats.isDirectory()) {
        console.log('⚠️  Agentwise path is not a directory');
        return false;
      }

      // Ensure it looks like an Agentwise installation
      const expectedFiles = ['package.json', 'src'];
      for (const file of expectedFiles) {
        const filePath = path.join(resolvedPath, file);
        if (!fs.existsSync(filePath)) {
          console.log(`⚠️  Missing expected Agentwise file/directory: ${file}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.log('⚠️  Path validation failed:', error);
      return false;
    }
  }
}