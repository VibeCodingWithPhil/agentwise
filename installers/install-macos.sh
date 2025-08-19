#!/bin/bash

# Agentwise Installer for macOS
# Requirements: macOS 10.15+, Node.js 18+, Claude Code CLI

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Installation directory
INSTALL_DIR="$HOME/.agentwise"
CLAUDE_DIR="$HOME/.claude"

echo "🚀 Agentwise Installer for macOS"
echo "================================"
echo ""

# Check system requirements
check_requirements() {
    echo "Checking system requirements..."
    
    # Check macOS version
    OS_VERSION=$(sw_vers -productVersion)
    echo "✓ macOS version: $OS_VERSION"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js not found${NC}"
        echo "Please install Node.js 18+ from https://nodejs.org"
        exit 1
    fi
    
    NODE_VERSION=$(node -v)
    echo "✓ Node.js version: $NODE_VERSION"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}✗ npm not found${NC}"
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
    
    cat > /usr/local/bin/agentwise << 'EOF'
#!/bin/bash
cd $HOME/.agentwise/agentwise
node dist/index.js "$@"
EOF
    
    chmod +x /usr/local/bin/agentwise
    
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
    
    # Add to shell profile
    SHELL_PROFILE="$HOME/.zshrc"
    if [ ! -f "$SHELL_PROFILE" ]; then
        SHELL_PROFILE="$HOME/.bash_profile"
    fi
    
    if ! grep -q "agentwise" "$SHELL_PROFILE"; then
        echo "" >> "$SHELL_PROFILE"
        echo "# Agentwise" >> "$SHELL_PROFILE"
        echo "export AGENTWISE_HOME=$INSTALL_DIR/agentwise" >> "$SHELL_PROFILE"
        echo "export PATH=\$PATH:/usr/local/bin" >> "$SHELL_PROFILE"
    fi
    
    echo "✓ Environment configured"
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
    
    check_requirements
    create_directories
    clone_repository
    install_dependencies
    build_project
    install_claude_components
    create_launcher
    configure_environment
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