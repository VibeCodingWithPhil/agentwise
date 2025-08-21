# Agentwise Windows Installer Script
# Requires PowerShell 5.0+ and Administrator privileges

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator"))
{
    Write-Host "This script requires Administrator privileges." -ForegroundColor Red
    Write-Host "Please run PowerShell as Administrator and try again." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "🚀 Agentwise Installer for Windows" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        $major = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
        if ($major -lt 18) {
            Write-Host "❌ Node.js 18+ required. Current: $nodeVersion" -ForegroundColor Red
            Write-Host "Download from: https://nodejs.org" -ForegroundColor Yellow
            pause
            exit 1
        }
        Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    Write-Host "Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Yellow
    pause
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version 2>$null
    Write-Host "✓ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm not found" -ForegroundColor Red
    pause
    exit 1
}

# Check Git
try {
    $gitVersion = git --version 2>$null
    Write-Host "✓ Git installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Git not found" -ForegroundColor Red
    Write-Host "Please install Git from https://git-scm.com" -ForegroundColor Yellow
    pause
    exit 1
}

# Check Claude Code (warning only)
try {
    $claudeVersion = claude --version 2>$null
    Write-Host "✓ Claude Code detected" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Claude Code CLI not found" -ForegroundColor Yellow
    Write-Host "Install from: https://docs.anthropic.com/en/docs/claude-code" -ForegroundColor Yellow
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
}

# Installation directory
$installDir = "$env:USERPROFILE\agentwise"

Write-Host ""
Write-Host "Installing to: $installDir" -ForegroundColor Cyan
Write-Host ""

# Clone or update repository
if (Test-Path $installDir) {
    Write-Host "Existing installation found. Updating..." -ForegroundColor Yellow
    Set-Location $installDir
    git pull origin main
} else {
    Write-Host "Cloning repository..." -ForegroundColor Yellow
    git clone https://github.com/VibeCodingWithPhil/agentwise.git $installDir
    Set-Location $installDir
}

Write-Host "✓ Repository ready" -ForegroundColor Green

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Build project
Write-Host ""
Write-Host "Building project..." -ForegroundColor Yellow
npm run build 2>$null

Write-Host "✓ Build complete" -ForegroundColor Green

# Install monitor dependencies
Write-Host ""
Write-Host "Setting up monitor dashboard..." -ForegroundColor Yellow
Set-Location "src\monitor"
npm install
Set-Location $installDir

Write-Host "✓ Monitor ready" -ForegroundColor Green

# Create .claude directories
Write-Host ""
Write-Host "Setting up Claude integration..." -ForegroundColor Yellow
$claudeDir = "$env:USERPROFILE\.claude"
New-Item -ItemType Directory -Force -Path "$claudeDir\agents" | Out-Null
New-Item -ItemType Directory -Force -Path "$claudeDir\commands" | Out-Null

# Copy Claude files
if (Test-Path ".claude") {
    Copy-Item -Path ".claude\agents\*" -Destination "$claudeDir\agents\" -Force -ErrorAction SilentlyContinue
    Copy-Item -Path ".claude\commands\*" -Destination "$claudeDir\commands\" -Force -ErrorAction SilentlyContinue
    Write-Host "✓ Claude integration configured" -ForegroundColor Green
}

# Create batch file for easy access
Write-Host ""
Write-Host "Creating command shortcuts..." -ForegroundColor Yellow

$batchContent = @"
@echo off
cd /d "$installDir"
npm start %*
"@

$batchPath = "$env:USERPROFILE\agentwise.bat"
Set-Content -Path $batchPath -Value $batchContent

# Add to PATH if not already present
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$env:USERPROFILE*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$env:USERPROFILE", "User")
}

Write-Host "✓ Commands configured" -ForegroundColor Green

# Success message
Write-Host ""
Write-Host "✅ Agentwise installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Open a new terminal window"
Write-Host ""
Write-Host "2. Start Claude Code with the required flag:" -ForegroundColor Yellow
Write-Host "   claude --dangerously-skip-permissions" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Create your first project:"
Write-Host "   /create `"your project idea`""
Write-Host ""
Write-Host "4. Monitor progress:"
Write-Host "   /monitor"
Write-Host ""
Write-Host "📚 Documentation: https://vibecodingwithphil.github.io/agentwise/"
Write-Host "❓ Issues: https://github.com/VibeCodingWithPhil/agentwise/issues"
Write-Host ""
Write-Host "⚠️  IMPORTANT: Always start Claude Code with --dangerously-skip-permissions flag" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")