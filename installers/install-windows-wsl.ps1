# Agentwise Installer for Windows with WSL
# Requirements: Windows 10+, WSL2, PowerShell 5+, Node.js 18+ (in WSL)
# Claude Code requires WSL on Windows

param(
    [switch]$Silent = $false,
    [string]$InstallPath = "~/.agentwise",
    [switch]$SkipWSLCheck = $false
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

Write-Host "🚀 Agentwise Installer for Windows (WSL Edition)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Claude Code requires WSL (Windows Subsystem for Linux) on Windows." -ForegroundColor Yellow
Write-Host "This installer will help you set up Agentwise in your WSL environment." -ForegroundColor Yellow
Write-Host ""

# Check if running as administrator
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

# Check and enable WSL
function Test-WSL {
    Write-Host "Checking WSL status..." -ForegroundColor Yellow
    
    # Check if WSL is installed
    try {
        $wslStatus = wsl --status 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "WSL not properly configured"
        }
        Write-Host "✓ WSL is installed" -ForegroundColor Green
        
        # Check WSL version
        $wslVersion = wsl --list --verbose 2>$null
        Write-Host "✓ WSL configuration:" -ForegroundColor Green
        Write-Host $wslVersion
        
    }
    catch {
        Write-Host "✗ WSL is not installed or not properly configured" -ForegroundColor Red
        Write-Host ""
        Write-Host "WSL needs to be installed for Claude Code to work on Windows." -ForegroundColor Yellow
        
        if (-not $Silent) {
            $install = Read-Host "Would you like to install WSL now? (y/n)"
            if ($install -eq 'y') {
                Install-WSL
            }
            else {
                Write-Host "Please install WSL manually and run this installer again." -ForegroundColor Yellow
                Write-Host "Instructions: https://docs.microsoft.com/en-us/windows/wsl/install" -ForegroundColor Cyan
                exit 1
            }
        }
        else {
            exit 1
        }
    }
    
    # Check for default distribution
    try {
        $defaultDistro = wsl -l -q | Select-Object -First 1
        if (-not $defaultDistro) {
            throw "No WSL distribution found"
        }
        Write-Host "✓ Default WSL distribution: $defaultDistro" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ No WSL distribution found" -ForegroundColor Red
        Write-Host "Installing Ubuntu..." -ForegroundColor Yellow
        wsl --install -d Ubuntu
        Write-Host "Ubuntu installed. Please set up your Linux user and run this installer again." -ForegroundColor Yellow
        exit 0
    }
    
    Write-Host ""
}

# Install WSL
function Install-WSL {
    Write-Host "Installing WSL..." -ForegroundColor Yellow
    
    if (-not (Test-Administrator)) {
        Write-Host "Administrator privileges required to install WSL" -ForegroundColor Red
        Write-Host "Please run this installer as Administrator" -ForegroundColor Yellow
        
        # Restart as admin
        $scriptPath = $MyInvocation.MyCommand.Path
        Start-Process powershell -Verb RunAs -ArgumentList "-File `"$scriptPath`""
        exit 0
    }
    
    # Enable WSL feature
    Write-Host "Enabling WSL feature..." -ForegroundColor Yellow
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    
    # Enable Virtual Machine feature
    Write-Host "Enabling Virtual Machine feature..." -ForegroundColor Yellow
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
    
    # Download and install WSL2 kernel update
    Write-Host "Downloading WSL2 kernel update..." -ForegroundColor Yellow
    $kernelUrl = "https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi"
    $kernelPath = "$env:TEMP\wsl_update_x64.msi"
    Invoke-WebRequest -Uri $kernelUrl -OutFile $kernelPath
    Start-Process msiexec.exe -Wait -ArgumentList "/i `"$kernelPath`" /quiet"
    
    # Set WSL2 as default
    wsl --set-default-version 2
    
    # Install Ubuntu
    Write-Host "Installing Ubuntu..." -ForegroundColor Yellow
    wsl --install -d Ubuntu
    
    Write-Host "✓ WSL installed successfully" -ForegroundColor Green
    Write-Host "Please restart your computer and run this installer again." -ForegroundColor Yellow
    exit 0
}

# Check Claude Code in WSL
function Test-ClaudeInWSL {
    Write-Host "Checking Claude Code in WSL..." -ForegroundColor Yellow
    
    $claudeCheck = wsl bash -c "command -v claude" 2>$null
    if ($claudeCheck) {
        $claudeVersion = wsl claude --version 2>$null
        Write-Host "✓ Claude Code found in WSL: $claudeVersion" -ForegroundColor Green
    }
    else {
        Write-Host "⚠ Claude Code not found in WSL" -ForegroundColor Yellow
        Write-Host "Please install Claude Code in your WSL environment:" -ForegroundColor Yellow
        Write-Host "1. Open WSL terminal (run 'wsl' in PowerShell)" -ForegroundColor Cyan
        Write-Host "2. Follow instructions at: https://docs.anthropic.com/en/docs/claude-code" -ForegroundColor Cyan
        
        if (-not $Silent) {
            $continue = Read-Host "Continue anyway? (y/n)"
            if ($continue -ne 'y') {
                exit 1
            }
        }
    }
    
    Write-Host ""
}

# Install in WSL
function Install-InWSL {
    Write-Host "Installing Agentwise in WSL..." -ForegroundColor Yellow
    
    # Create installation script for WSL
    $wslScript = @'
#!/bin/bash
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Installing Agentwise in WSL...${NC}"

# Installation directory
INSTALL_DIR="$HOME/.agentwise"
CLAUDE_DIR="$HOME/.claude"

# Create directories
mkdir -p "$INSTALL_DIR"
mkdir -p "$CLAUDE_DIR/agents"
mkdir -p "$CLAUDE_DIR/commands"
mkdir -p "$HOME/agentwise-projects/workspace"

# Install Node.js if needed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Clone repository
cd "$INSTALL_DIR"
if [ -d "agentwise" ]; then
    echo "Updating existing installation..."
    cd agentwise
    git pull
else
    git clone https://github.com/VibeCodingWithPhil/agentwise.git
    cd agentwise
fi

# Install dependencies
npm install --production

# Build project
npm run build

# Copy Claude components
cp -r .claude/agents/* "$CLAUDE_DIR/agents/" 2>/dev/null || true
cp -r .claude/commands/* "$CLAUDE_DIR/commands/" 2>/dev/null || true

# Create launcher script
cat > ~/.local/bin/agentwise << 'EOF'
#!/bin/bash
cd $HOME/.agentwise/agentwise
node dist/index.js "$@"
EOF

chmod +x ~/.local/bin/agentwise

# Add to PATH
if ! grep -q "agentwise" ~/.bashrc; then
    echo "" >> ~/.bashrc
    echo "# Agentwise" >> ~/.bashrc
    echo "export AGENTWISE_HOME=$HOME/.agentwise/agentwise" >> ~/.bashrc
    echo "export PATH=\$PATH:$HOME/.local/bin" >> ~/.bashrc
fi

# Create config
cat > "$INSTALL_DIR/agentwise/.env" << EOF
DEFAULT_WORKSPACE_PATH=$HOME/agentwise-projects
MAX_PARALLEL_AGENTS=5
ENABLE_DASHBOARD=true
DASHBOARD_PORT=3001
ENABLE_TOKEN_OPTIMIZATION=true
EOF

echo -e "${GREEN}✅ Agentwise installed successfully in WSL!${NC}"
echo ""
echo "Next steps:"
echo "1. Restart your WSL terminal or run: source ~/.bashrc"
echo "2. Test installation: agentwise --version"
echo "3. Create your first project using Claude Code: /create 'Your project idea'"
'@

    # Save script to temp file
    $scriptPath = "$env:TEMP\install-agentwise.sh"
    $wslScript | Out-File -FilePath $scriptPath -Encoding UTF8

    # Copy to WSL and execute
    wsl cp $(wsl wslpath -a "$scriptPath") /tmp/install-agentwise.sh
    wsl chmod +x /tmp/install-agentwise.sh
    wsl bash /tmp/install-agentwise.sh
    
    Write-Host "✓ Agentwise installed in WSL" -ForegroundColor Green
    Write-Host ""
}

# Create Windows shortcuts
function New-WindowsShortcuts {
    Write-Host "Creating Windows shortcuts..." -ForegroundColor Yellow
    
    # Create desktop shortcut for WSL with Agentwise
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = "$desktopPath\Agentwise WSL.lnk"
    
    $WScriptShell = New-Object -ComObject WScript.Shell
    $shortcut = $WScriptShell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = "wsl"
    $shortcut.Arguments = "cd ~ && bash"
    $shortcut.WorkingDirectory = "%USERPROFILE%"
    $shortcut.Description = "Open WSL terminal for Agentwise"
    $shortcut.Save()
    
    Write-Host "✓ Desktop shortcut created" -ForegroundColor Green
    
    # Create Start Menu entry
    $startMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Agentwise"
    if (-not (Test-Path $startMenuPath)) {
        New-Item -ItemType Directory -Path $startMenuPath -Force | Out-Null
    }
    
    $startShortcutPath = "$startMenuPath\Agentwise WSL.lnk"
    $shortcut = $WScriptShell.CreateShortcut($startShortcutPath)
    $shortcut.TargetPath = "wsl"
    $shortcut.Arguments = "cd ~ && bash"
    $shortcut.WorkingDirectory = "%USERPROFILE%"
    $shortcut.Description = "Open WSL terminal for Agentwise"
    $shortcut.Save()
    
    Write-Host "✓ Start Menu entry created" -ForegroundColor Green
    Write-Host ""
}

# Create helper scripts
function New-HelperScripts {
    Write-Host "Creating helper scripts..." -ForegroundColor Yellow
    
    # Create PowerShell helper to run Agentwise commands from Windows
    $helperScript = @'
# Agentwise Windows Helper
# This script allows you to run Agentwise commands from Windows PowerShell

param(
    [Parameter(Position=0, ValueFromRemainingArguments=$true)]
    [string[]]$Arguments
)

if ($Arguments.Count -eq 0) {
    Write-Host "Usage: agentwise-wsl <command> [arguments]"
    Write-Host ""
    Write-Host "Examples:"
    Write-Host "  agentwise-wsl /create 'an ecommerce platform'"
    Write-Host "  agentwise-wsl /projects"
    Write-Host "  agentwise-wsl /task 'add payment processing'"
    exit 0
}

# Run command in WSL
wsl bash -c "source ~/.bashrc && agentwise $($Arguments -join ' ')"
'@

    $helperPath = "$env:USERPROFILE\agentwise-wsl.ps1"
    $helperScript | Out-File -FilePath $helperPath -Encoding UTF8
    
    Write-Host "✓ Helper script created at: $helperPath" -ForegroundColor Green
    Write-Host ""
}

# Main installation
function Start-Installation {
    Write-Host "Starting Agentwise installation for Windows (WSL)..." -ForegroundColor Green
    Write-Host ""
    
    if (-not $SkipWSLCheck) {
        Test-WSL
        Test-ClaudeInWSL
    }
    
    Install-InWSL
    New-WindowsShortcuts
    New-HelperScripts
    
    Write-Host "✅ Agentwise installation complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "=== IMPORTANT INSTRUCTIONS ===" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Claude Code must be used within WSL, not Windows PowerShell" -ForegroundColor Yellow
    Write-Host "2. Open WSL by:" -ForegroundColor Yellow
    Write-Host "   - Using the desktop shortcut 'Agentwise WSL'" -ForegroundColor Cyan
    Write-Host "   - Running 'wsl' in PowerShell" -ForegroundColor Cyan
    Write-Host "   - Using Windows Terminal with Ubuntu profile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. In WSL, use Claude Code commands:" -ForegroundColor Yellow
    Write-Host "   /create 'your project idea'" -ForegroundColor Cyan
    Write-Host "   /projects" -ForegroundColor Cyan
    Write-Host "   /task 'add new feature'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "4. Your projects will be stored in:" -ForegroundColor Yellow
    Write-Host "   WSL: ~/agentwise-projects" -ForegroundColor Cyan
    Write-Host "   Windows: \\wsl$\Ubuntu\home\$env:USERNAME\agentwise-projects" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Documentation: https://github.com/VibeCodingWithPhil/agentwise" -ForegroundColor Cyan
    Write-Host "Support: https://github.com/VibeCodingWithPhil/agentwise/issues" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Happy coding with Agentwise! 🚀" -ForegroundColor Green
}

# Handle errors
trap {
    Write-Host "Installation failed: $_" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
    exit 1
}

# Run installation
Start-Installation