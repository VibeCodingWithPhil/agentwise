# Agentwise Installer for Windows
# Requirements: Windows 10+, PowerShell 5+, Node.js 18+

param(
    [switch]$Silent = $false,
    [string]$InstallPath = "$env:USERPROFILE\.agentwise"
)

$ErrorActionPreference = "Stop"

# Colors for output
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-Host "🚀 Agentwise Installer for Windows" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check system requirements
function Test-Requirements {
    Write-Host "Checking system requirements..." -ForegroundColor Yellow
    
    # Check Windows version
    $winVersion = [System.Environment]::OSVersion.Version
    if ($winVersion.Major -lt 10) {
        Write-Host "✗ Windows 10 or higher required" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Windows version: $($winVersion.ToString())" -ForegroundColor Green
    
    # Check PowerShell version
    $psVersion = $PSVersionTable.PSVersion
    if ($psVersion.Major -lt 5) {
        Write-Host "✗ PowerShell 5 or higher required" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ PowerShell version: $($psVersion.ToString())" -ForegroundColor Green
    
    # Check Node.js
    try {
        $nodeVersion = node --version 2>$null
        if (-not $nodeVersion) {
            throw "Node.js not found"
        }
        $nodeVersionNum = [version]($nodeVersion -replace 'v', '')
        if ($nodeVersionNum.Major -lt 18) {
            Write-Host "✗ Node.js 18+ required. Current version: $nodeVersion" -ForegroundColor Red
            Write-Host "Please download from https://nodejs.org" -ForegroundColor Yellow
            exit 1
        }
        Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ Node.js not found" -ForegroundColor Red
        Write-Host "Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Yellow
        
        if (-not $Silent) {
            $install = Read-Host "Would you like to download Node.js now? (y/n)"
            if ($install -eq 'y') {
                Start-Process "https://nodejs.org/en/download/"
                Write-Host "Please install Node.js and run this installer again" -ForegroundColor Yellow
                exit 0
            }
        }
        exit 1
    }
    
    # Check npm
    try {
        $npmVersion = npm --version 2>$null
        Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ npm not found" -ForegroundColor Red
        exit 1
    }
    
    # Check Git
    try {
        $gitVersion = git --version 2>$null
        Write-Host "✓ Git version: $gitVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠ Git not found - will download as zip instead" -ForegroundColor Yellow
    }
    
    # Check Claude Code
    try {
        $claudeVersion = claude --version 2>$null
        Write-Host "✓ Claude Code version: $claudeVersion" -ForegroundColor Green
    }
    catch {
        Write-Host "⚠ Claude Code CLI not found" -ForegroundColor Yellow
        Write-Host "Please install from https://docs.anthropic.com/en/docs/claude-code" -ForegroundColor Yellow
        
        if (-not $Silent) {
            $continue = Read-Host "Continue anyway? (y/n)"
            if ($continue -ne 'y') {
                exit 1
            }
        }
    }
    
    Write-Host ""
}

# Create directories
function New-Directories {
    Write-Host "Creating directories..." -ForegroundColor Yellow
    
    $directories = @(
        $InstallPath,
        "$env:USERPROFILE\.claude\agents",
        "$env:USERPROFILE\.claude\commands",
        "$env:USERPROFILE\agentwise-projects\workspace"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
        }
    }
    
    Write-Host "✓ Directories created" -ForegroundColor Green
    Write-Host ""
}

# Download Agentwise
function Get-Agentwise {
    Write-Host "Downloading Agentwise..." -ForegroundColor Yellow
    
    $repoPath = "$InstallPath\agentwise"
    
    if (Test-Path $repoPath) {
        Write-Host "Existing installation found. Updating..." -ForegroundColor Yellow
        Set-Location $repoPath
        
        if (Get-Command git -ErrorAction SilentlyContinue) {
            git pull
        }
        else {
            Write-Host "Cannot update without Git. Please reinstall." -ForegroundColor Red
            exit 1
        }
    }
    else {
        if (Get-Command git -ErrorAction SilentlyContinue) {
            Set-Location $InstallPath
            git clone https://github.com/VibeCodingWithPhil/agentwise.git
        }
        else {
            # Download as ZIP
            $zipUrl = "https://github.com/VibeCodingWithPhil/agentwise/archive/main.zip"
            $zipPath = "$InstallPath\agentwise.zip"
            
            Write-Host "Downloading from GitHub..." -ForegroundColor Yellow
            Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath
            
            Write-Host "Extracting..." -ForegroundColor Yellow
            Expand-Archive -Path $zipPath -DestinationPath $InstallPath -Force
            Rename-Item "$InstallPath\agentwise-main" "agentwise"
            Remove-Item $zipPath
        }
        
        Set-Location "$InstallPath\agentwise"
    }
    
    Write-Host "✓ Agentwise downloaded" -ForegroundColor Green
    Write-Host ""
}

# Install dependencies
function Install-Dependencies {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    
    Set-Location "$InstallPath\agentwise"
    npm install --production
    
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
    Write-Host ""
}

# Build project
function Build-Project {
    Write-Host "Building Agentwise..." -ForegroundColor Yellow
    
    Set-Location "$InstallPath\agentwise"
    npm run build
    
    Write-Host "✓ Build complete" -ForegroundColor Green
    Write-Host ""
}

# Install Claude components
function Install-ClaudeComponents {
    Write-Host "Installing Claude Code components..." -ForegroundColor Yellow
    
    # Copy agents
    Copy-Item -Path "$InstallPath\agentwise\.claude\agents\*" `
              -Destination "$env:USERPROFILE\.claude\agents\" `
              -Recurse -Force
    
    # Copy commands
    Copy-Item -Path "$InstallPath\agentwise\.claude\commands\*" `
              -Destination "$env:USERPROFILE\.claude\commands\" `
              -Recurse -Force
    
    Write-Host "✓ Agents and commands installed" -ForegroundColor Green
    Write-Host ""
}

# Create launcher
function New-Launcher {
    Write-Host "Creating launcher..." -ForegroundColor Yellow
    
    # Create batch file
    $batchContent = @"
@echo off
cd /d "$InstallPath\agentwise"
node dist\index.js %*
"@
    
    $batchPath = "$InstallPath\agentwise.bat"
    Set-Content -Path $batchPath -Value $batchContent
    
    # Create PowerShell script
    $psContent = @"
Set-Location "$InstallPath\agentwise"
node dist\index.js `$args
"@
    
    $psPath = "$InstallPath\agentwise.ps1"
    Set-Content -Path $psPath -Value $psContent
    
    # Add to PATH
    $currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($currentPath -notlike "*$InstallPath*") {
        [Environment]::SetEnvironmentVariable(
            "Path",
            "$currentPath;$InstallPath",
            "User"
        )
        Write-Host "✓ Added to PATH" -ForegroundColor Green
    }
    
    Write-Host "✓ Launcher created" -ForegroundColor Green
    Write-Host ""
}

# Configure environment
function Set-Environment {
    Write-Host "Configuring environment..." -ForegroundColor Yellow
    
    # Create config file
    $envContent = @"
# Agentwise Configuration
DEFAULT_WORKSPACE_PATH=$env:USERPROFILE\agentwise-projects
MAX_PARALLEL_AGENTS=5
ENABLE_DASHBOARD=true
DASHBOARD_PORT=3001
ENABLE_TOKEN_OPTIMIZATION=true
"@
    
    Set-Content -Path "$InstallPath\agentwise\.env" -Value $envContent
    
    # Set environment variables
    [Environment]::SetEnvironmentVariable("AGENTWISE_HOME", "$InstallPath\agentwise", "User")
    
    Write-Host "✓ Environment configured" -ForegroundColor Green
    Write-Host ""
}

# Create Start Menu shortcut
function New-StartMenuShortcut {
    Write-Host "Creating Start Menu shortcut..." -ForegroundColor Yellow
    
    $startMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
    $shortcutPath = "$startMenuPath\Agentwise.lnk"
    
    $WScriptShell = New-Object -ComObject WScript.Shell
    $shortcut = $WScriptShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "powershell.exe"
    $shortcut.Arguments = "-NoExit -Command `"& '$InstallPath\agentwise.ps1'`""
    $shortcut.WorkingDirectory = "$InstallPath\agentwise"
    $shortcut.IconLocation = "$InstallPath\agentwise\assets\icon.ico"
    $shortcut.Description = "Agentwise Multi-Agent Orchestration System"
    $shortcut.Save()
    
    Write-Host "✓ Start Menu shortcut created" -ForegroundColor Green
    Write-Host ""
}

# Run tests
function Test-Installation {
    Write-Host "Running tests..." -ForegroundColor Yellow
    
    Set-Location "$InstallPath\agentwise"
    
    # Test Node.js
    $nodeTest = node -e "console.log('Node.js works')" 2>&1
    if ($nodeTest -eq "Node.js works") {
        Write-Host "✓ Node.js test passed" -ForegroundColor Green
    }
    
    # Test commands installation
    if (Test-Path "$env:USERPROFILE\.claude\commands\create.md") {
        Write-Host "✓ Commands installed correctly" -ForegroundColor Green
    }
    
    # Test agents installation
    if (Test-Path "$env:USERPROFILE\.claude\agents\frontend-specialist.md") {
        Write-Host "✓ Agents installed correctly" -ForegroundColor Green
    }
    
    Write-Host ""
}

# Main installation
function Install-Agentwise {
    try {
        Test-Requirements
        New-Directories
        Get-Agentwise
        Install-Dependencies
        Build-Project
        Install-ClaudeComponents
        New-Launcher
        Set-Environment
        New-StartMenuShortcut
        Test-Installation
        
        Write-Host "✅ Agentwise installation complete!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Restart your terminal or PowerShell"
        Write-Host "2. Test installation: agentwise --version"
        Write-Host "3. Create your first project: /create 'Your project idea'"
        Write-Host ""
        Write-Host "Documentation: $InstallPath\agentwise\docs\"
        Write-Host "Support: https://github.com/VibeCodingWithPhil/agentwise/issues"
        Write-Host ""
        Write-Host "Happy coding with Agentwise! 🚀" -ForegroundColor Cyan
        
        if (-not $Silent) {
            Read-Host "Press Enter to exit"
        }
    }
    catch {
        Write-Host "❌ Installation failed: $_" -ForegroundColor Red
        Write-Host $_.ScriptStackTrace -ForegroundColor Red
        
        if (-not $Silent) {
            Read-Host "Press Enter to exit"
        }
        exit 1
    }
}

# Run installation
Install-Agentwise