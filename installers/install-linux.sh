#!/bin/bash

# Agentwise Installer for Linux
# Supports: Ubuntu 20.04+, Debian 10+, Fedora 34+, Arch Linux

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Installation directory
INSTALL_DIR="$HOME/.agentwise"
CLAUDE_DIR="$HOME/.claude"

echo "🚀 Agentwise Installer for Linux"
echo "================================"
echo ""

# Detect Linux distribution
detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
        VERSION=$VERSION_ID
        echo "Detected: $NAME $VERSION"
    else
        echo -e "${RED}Cannot detect Linux distribution${NC}"
        exit 1
    fi
}

# Install system dependencies
install_system_deps() {
    echo "Installing system dependencies..."
    
    case $DISTRO in
        ubuntu|debian)
            sudo apt-get update
            sudo apt-get install -y git curl build-essential
            ;;
        fedora|rhel|centos)
            sudo dnf install -y git curl gcc-c++ make
            ;;
        arch|manjaro)
            sudo pacman -Sy --needed git curl base-devel
            ;;
        *)
            echo -e "${YELLOW}Please install git, curl, and build tools manually${NC}"
            ;;
    esac
    
    echo "✓ System dependencies installed"
    echo ""
}

# Install Node.js if needed
install_nodejs() {
    if ! command -v node &> /dev/null; then
        echo "Installing Node.js..."
        
        # Install via NodeSource repository
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        
        case $DISTRO in
            ubuntu|debian)
                sudo apt-get install -y nodejs
                ;;
            fedora|rhel|centos)
                sudo dnf install -y nodejs
                ;;
            arch|manjaro)
                sudo pacman -S nodejs npm
                ;;
        esac
        
        echo "✓ Node.js installed"
    else
        NODE_VERSION=$(node -v)
        echo "✓ Node.js already installed: $NODE_VERSION"
    fi
    echo ""
}

# Check requirements
check_requirements() {
    echo "Checking requirements..."
    
    # Check Node.js version
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
    
    if [ "$NODE_MAJOR" -lt 18 ]; then
        echo -e "${RED}Node.js 18+ required. Current version: $NODE_VERSION${NC}"
        exit 1
    fi
    
    echo "✓ Node.js version: v$NODE_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}npm not found${NC}"
        exit 1
    fi
    
    NPM_VERSION=$(npm -v)
    echo "✓ npm version: $NPM_VERSION"
    
    # Check Claude Code
    if ! command -v claude &> /dev/null; then
        echo -e "${YELLOW}⚠ Claude Code CLI not found${NC}"
        echo "Please install Claude Code from https://docs.anthropic.com/en/docs/claude-code"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        CLAUDE_VERSION=$(claude --version 2>/dev/null || echo "unknown")
        echo "✓ Claude Code version: $CLAUDE_VERSION"
    fi
    
    echo ""
}

# Create directories
create_directories() {
    echo "Creating directories..."
    
    mkdir -p "$INSTALL_DIR"
    mkdir -p "$CLAUDE_DIR/agents"
    mkdir -p "$CLAUDE_DIR/commands"
    mkdir -p "$HOME/agentwise-projects/workspace"
    
    echo "✓ Directories created"
    echo ""
}

# Clone repository
clone_repository() {
    echo "Downloading Agentwise..."
    
    if [ -d "$INSTALL_DIR/agentwise" ]; then
        echo "Existing installation found. Updating..."
        cd "$INSTALL_DIR/agentwise"
        git pull
    else
        cd "$INSTALL_DIR"
        git clone https://github.com/VibeCodingWithPhil/agentwise.git
        cd agentwise
    fi
    
    echo "✓ Agentwise downloaded"
    echo ""
}

# Install dependencies
install_dependencies() {
    echo "Installing dependencies..."
    
    cd "$INSTALL_DIR/agentwise"
    npm install --production
    
    echo "✓ Dependencies installed"
    echo ""
}

# Build project
build_project() {
    echo "Building Agentwise..."
    
    cd "$INSTALL_DIR/agentwise"
    npm run build
    
    echo "✓ Build complete"
    echo ""
}

# Install agents and commands
install_claude_components() {
    echo "Installing Claude Code components..."
    
    # Copy agents
    cp -r "$INSTALL_DIR/agentwise/.claude/agents/"* "$CLAUDE_DIR/agents/"
    
    # Copy commands
    cp -r "$INSTALL_DIR/agentwise/.claude/commands/"* "$CLAUDE_DIR/commands/"
    
    echo "✓ Agents and commands installed"
    echo ""
}

# Create launcher script
create_launcher() {
    echo "Creating launcher script..."
    
    sudo tee /usr/local/bin/agentwise > /dev/null << 'EOF'
#!/bin/bash
cd $HOME/.agentwise/agentwise
node dist/index.js "$@"
EOF
    
    sudo chmod +x /usr/local/bin/agentwise
    
    echo "✓ Launcher created"
    echo ""
}

# Configure environment
configure_environment() {
    echo "Configuring environment..."
    
    # Create config file
    cat > "$INSTALL_DIR/agentwise/.env" << EOF
# Agentwise Configuration
DEFAULT_WORKSPACE_PATH=$HOME/agentwise-projects
MAX_PARALLEL_AGENTS=5
ENABLE_DASHBOARD=true
DASHBOARD_PORT=3001
ENABLE_TOKEN_OPTIMIZATION=true
EOF
    
    # Detect shell and add to profile
    if [ -n "$ZSH_VERSION" ]; then
        SHELL_PROFILE="$HOME/.zshrc"
    elif [ -n "$BASH_VERSION" ]; then
        SHELL_PROFILE="$HOME/.bashrc"
    else
        SHELL_PROFILE="$HOME/.profile"
    fi
    
    if ! grep -q "agentwise" "$SHELL_PROFILE" 2>/dev/null; then
        echo "" >> "$SHELL_PROFILE"
        echo "# Agentwise" >> "$SHELL_PROFILE"
        echo "export AGENTWISE_HOME=$INSTALL_DIR/agentwise" >> "$SHELL_PROFILE"
        echo "export PATH=\$PATH:/usr/local/bin" >> "$SHELL_PROFILE"
    fi
    
    echo "✓ Environment configured"
    echo ""
}

# Setup systemd service (optional)
setup_service() {
    echo "Would you like to set up Agentwise as a systemd service? (y/n)"
    read -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo tee /etc/systemd/system/agentwise.service > /dev/null << EOF
[Unit]
Description=Agentwise Multi-Agent Orchestration System
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR/agentwise
ExecStart=/usr/bin/node $INSTALL_DIR/agentwise/dist/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable agentwise
        echo "✓ Systemd service created"
        echo "Start with: sudo systemctl start agentwise"
    fi
    echo ""
}

# Run tests
run_tests() {
    echo "Running tests..."
    
    cd "$INSTALL_DIR/agentwise"
    
    # Test Claude integration
    if command -v claude &> /dev/null; then
        echo "Testing Claude Code integration..."
        claude --version &> /dev/null && echo "✓ Claude Code accessible"
    fi
    
    # Test commands
    if [ -f "$CLAUDE_DIR/commands/create.md" ]; then
        echo "✓ Commands installed correctly"
    fi
    
    # Test agents
    if [ -f "$CLAUDE_DIR/agents/frontend-specialist.md" ]; then
        echo "✓ Agents installed correctly"
    fi
    
    echo ""
}

# Main installation
main() {
    echo -e "${GREEN}Starting Agentwise installation...${NC}"
    echo ""
    
    detect_distro
    install_system_deps
    install_nodejs
    check_requirements
    create_directories
    clone_repository
    install_dependencies
    build_project
    install_claude_components
    create_launcher
    configure_environment
    setup_service
    run_tests
    
    echo -e "${GREEN}✅ Agentwise installation complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Restart your terminal or run: source $SHELL_PROFILE"
    echo "2. Test installation: agentwise --version"
    echo "3. Create your first project: /create \"Your project idea\""
    echo ""
    echo "Documentation: $INSTALL_DIR/agentwise/docs/"
    echo "Support: https://github.com/VibeCodingWithPhil/agentwise/issues"
    echo ""
    echo "Happy coding with Agentwise! 🚀"
}

# Handle errors
trap 'echo -e "${RED}Installation failed. Please check the error messages above.${NC}"' ERR

# Run installation
main