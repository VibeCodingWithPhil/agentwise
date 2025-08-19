#!/bin/bash

# Universal Agentwise Installer
# Detects OS and runs appropriate installer

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "    _                    _            _          "
echo "   / \   __ _  ___ _ __ | |___      _(_)___  ___ "
echo "  / _ \ / _\` |/ _ \ '_ \| __\ \ /\ / / / __|/ _ \\"
echo " / ___ \ (_| |  __/ | | | |_ \ V  V /| \__ \  __/"
echo "/_/   \_\__, |\___|_| |_|\__| \_/\_/ |_|___/\___|"
echo "        |___/                                     "
echo -e "${NC}"
echo "Multi-Agent Orchestration System for Claude Code"
echo "================================================="
echo ""

# Detect operating system
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        echo -e "${GREEN}Detected: macOS${NC}"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        echo -e "${GREEN}Detected: Linux${NC}"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="windows"
        echo -e "${GREEN}Detected: Windows${NC}"
    else
        echo -e "${RED}Unsupported operating system: $OSTYPE${NC}"
        exit 1
    fi
    echo ""
}

# Run OS-specific installer
run_installer() {
    case $OS in
        macos)
            echo -e "${CYAN}Running macOS installer...${NC}"
            echo ""
            bash "$(dirname "$0")/installers/install-macos.sh"
            ;;
        linux)
            echo -e "${CYAN}Running Linux installer...${NC}"
            echo ""
            bash "$(dirname "$0")/installers/install-linux.sh"
            ;;
        windows)
            echo -e "${CYAN}Running Windows installer...${NC}"
            echo ""
            powershell -ExecutionPolicy Bypass -File "$(dirname "$0")/installers/install-windows.ps1"
            ;;
        *)
            echo -e "${RED}No installer available for $OS${NC}"
            exit 1
            ;;
    esac
}

# Quick install option
quick_install() {
    echo -e "${YELLOW}Quick Install Mode${NC}"
    echo "This will install Agentwise with default settings."
    echo ""
    
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
    
    echo ""
    run_installer
}

# Custom install option
custom_install() {
    echo -e "${YELLOW}Custom Install Mode${NC}"
    echo ""
    
    read -p "Installation directory [$HOME/.agentwise]: " INSTALL_DIR
    INSTALL_DIR=${INSTALL_DIR:-$HOME/.agentwise}
    
    read -p "Workspace directory [$HOME/agentwise-projects]: " WORKSPACE_DIR
    WORKSPACE_DIR=${WORKSPACE_DIR:-$HOME/agentwise-projects}
    
    read -p "Max parallel agents [5]: " MAX_AGENTS
    MAX_AGENTS=${MAX_AGENTS:-5}
    
    export CUSTOM_INSTALL_DIR=$INSTALL_DIR
    export CUSTOM_WORKSPACE_DIR=$WORKSPACE_DIR
    export CUSTOM_MAX_AGENTS=$MAX_AGENTS
    
    echo ""
    run_installer
}

# Uninstall option
uninstall() {
    echo -e "${YELLOW}Uninstall Agentwise${NC}"
    echo "This will remove Agentwise and all its components."
    echo -e "${RED}Warning: This action cannot be undone!${NC}"
    echo ""
    
    read -p "Are you sure? (yes/no): " CONFIRM
    if [[ "$CONFIRM" != "yes" ]]; then
        echo "Uninstall cancelled."
        exit 0
    fi
    
    echo ""
    echo "Removing Agentwise..."
    
    # Remove directories
    rm -rf "$HOME/.agentwise"
    rm -rf "$HOME/.claude/agents"/*-specialist.md
    rm -rf "$HOME/.claude/commands"/create*.md
    rm -rf "$HOME/.claude/commands"/task*.md
    rm -rf "$HOME/.claude/commands"/project*.md
    rm -rf "$HOME/.claude/commands"/deploy*.md
    rm -rf "$HOME/.claude/commands"/monitor*.md
    rm -rf "$HOME/.claude/commands"/rollback*.md
    rm -rf "$HOME/.claude/commands"/generate-agent.md
    rm -rf "$HOME/.claude/commands"/init-import.md
    
    # Remove from PATH
    if [[ "$OS" == "macos" ]] || [[ "$OS" == "linux" ]]; then
        sed -i.bak '/agentwise/d' ~/.bashrc 2>/dev/null || true
        sed -i.bak '/agentwise/d' ~/.zshrc 2>/dev/null || true
        rm -f /usr/local/bin/agentwise
    fi
    
    echo -e "${GREEN}✓ Agentwise has been uninstalled${NC}"
    echo ""
}

# Update option
update() {
    echo -e "${YELLOW}Updating Agentwise...${NC}"
    echo ""
    
    if [ ! -d "$HOME/.agentwise/agentwise" ]; then
        echo -e "${RED}Agentwise not found. Please install first.${NC}"
        exit 1
    fi
    
    cd "$HOME/.agentwise/agentwise"
    
    # Pull latest changes
    git pull origin main
    
    # Reinstall dependencies
    npm install --production
    
    # Rebuild
    npm run build
    
    # Update Claude components
    cp -r .claude/agents/* "$HOME/.claude/agents/"
    cp -r .claude/commands/* "$HOME/.claude/commands/"
    
    echo ""
    echo -e "${GREEN}✓ Agentwise has been updated${NC}"
    echo ""
}

# Main menu
main() {
    if [ "$1" == "--quick" ] || [ "$1" == "-q" ]; then
        detect_os
        quick_install
    elif [ "$1" == "--custom" ] || [ "$1" == "-c" ]; then
        detect_os
        custom_install
    elif [ "$1" == "--uninstall" ] || [ "$1" == "-u" ]; then
        detect_os
        uninstall
    elif [ "$1" == "--update" ] || [ "$1" == "-U" ]; then
        detect_os
        update
    elif [ "$1" == "--help" ] || [ "$1" == "-h" ]; then
        echo "Agentwise Installer"
        echo ""
        echo "Usage: ./install.sh [option]"
        echo ""
        echo "Options:"
        echo "  --quick, -q      Quick install with defaults"
        echo "  --custom, -c     Custom installation"
        echo "  --update, -U     Update existing installation"
        echo "  --uninstall, -u  Remove Agentwise"
        echo "  --help, -h       Show this help message"
        echo ""
        echo "Without options, interactive mode will be launched."
    else
        echo "Choose installation type:"
        echo ""
        echo "1) Quick Install (recommended)"
        echo "2) Custom Install"
        echo "3) Update Existing Installation"
        echo "4) Uninstall"
        echo "5) Exit"
        echo ""
        
        read -p "Enter choice [1-5]: " choice
        echo ""
        
        detect_os
        
        case $choice in
            1)
                quick_install
                ;;
            2)
                custom_install
                ;;
            3)
                update
                ;;
            4)
                uninstall
                ;;
            5)
                echo "Installation cancelled."
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice${NC}"
                exit 1
                ;;
        esac
    fi
}

# Check if script is run with sudo (not recommended)
if [ "$EUID" -eq 0 ]; then 
   echo -e "${YELLOW}Warning: Running as root is not recommended.${NC}"
   echo "Agentwise should be installed as a regular user."
   echo ""
   read -p "Continue anyway? (y/n) " -n 1 -r
   echo
   if [[ ! $REPLY =~ ^[Yy]$ ]]; then
       exit 0
   fi
fi

# Run main function
main "$@"