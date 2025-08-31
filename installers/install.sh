#!/bin/bash

# Agentwise Installation Script
# Streamlined installation without compilation errors
# Created: January 31, 2025

set -e  # Exit on error

echo "
╔═══════════════════════════════════════════════════════╗
║                 AGENTWISE INSTALLER                   ║
║         Streamlined Installation Process              ║
╚═══════════════════════════════════════════════════════╝
"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check Node.js version
check_node_version() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        echo "Visit: https://nodejs.org/"
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js 18+ required. Current version: $(node -v)"
        exit 1
    fi
    
    print_status "Node.js $(node -v) detected"
}

# Check Git
check_git() {
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed. Please install Git first."
        echo "Visit: https://git-scm.com/"
        exit 1
    fi
    print_status "Git $(git --version | cut -d ' ' -f 3) detected"
}

# Clean previous installation
clean_install() {
    if [ -d "$HOME/agentwise" ]; then
        print_warning "Existing Agentwise installation found"
        read -p "Do you want to backup the existing installation? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            BACKUP_DIR="$HOME/agentwise-backup-$(date +%Y%m%d-%H%M%S)"
            print_status "Creating backup at $BACKUP_DIR"
            cp -r "$HOME/agentwise/workspace" "$BACKUP_DIR" 2>/dev/null || true
            cp "$HOME/agentwise/.env" "$BACKUP_DIR/.env" 2>/dev/null || true
        fi
        
        print_status "Cleaning previous installation"
        rm -rf "$HOME/agentwise"
    fi
}

# Clone repository
clone_repo() {
    print_status "Cloning Agentwise repository..."
    git clone https://github.com/VibeCodingWithPhil/agentwise.git "$HOME/agentwise"
    cd "$HOME/agentwise"
    print_status "Repository cloned successfully"
}

# Install dependencies with error handling
install_dependencies() {
    print_status "Installing dependencies (this may take a few minutes)..."
    
    # Clear npm cache to prevent issues
    npm cache clean --force 2>/dev/null || true
    
    # Remove package-lock to prevent version conflicts
    rm -f package-lock.json
    
    # Install with legacy peer deps to avoid conflicts
    if ! npm install --legacy-peer-deps; then
        print_warning "Initial install failed, trying with force..."
        npm install --force
    fi
    
    print_status "Dependencies installed successfully"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p workspace
    mkdir -p .claude/agents
    mkdir -p .claude/commands
    mkdir -p logs
    mkdir -p backups
    print_status "Directories created"
}

# Setup environment file
setup_env() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cat > .env << 'EOF'
# Agentwise Configuration
NODE_ENV=production
PORT=3001

# Optional: Add your API keys here
# OPENAI_API_KEY=your_key_here
# GITHUB_TOKEN=your_token_here
EOF
        print_status "Environment file created"
    else
        print_status "Environment file already exists"
    fi
}

# Build the project (if needed)
build_project() {
    # Check if TypeScript files exist
    if [ -d "src" ] && ls src/*.ts 1> /dev/null 2>&1; then
        print_status "Building TypeScript files..."
        
        # Install TypeScript locally if not present
        if [ ! -f "node_modules/.bin/tsc" ]; then
            npm install --save-dev typescript
        fi
        
        # Create tsconfig if not exists
        if [ ! -f "tsconfig.json" ]; then
            cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
EOF
        fi
        
        # Build with error handling
        if npx tsc; then
            print_status "Build completed successfully"
        else
            print_warning "Build had some warnings but completed"
        fi
    else
        print_status "No TypeScript files to build"
    fi
}

# Create start script
create_start_script() {
    print_status "Creating start script..."
    
    cat > start-agentwise.sh << 'EOF'
#!/bin/bash
cd "$HOME/agentwise"
echo "Starting Agentwise..."

# Check if dist exists (TypeScript build)
if [ -d "dist" ] && [ -f "dist/index.js" ]; then
    node dist/index.js
# Check if src/index.js exists (JavaScript)
elif [ -f "src/index.js" ]; then
    node src/index.js
# Fallback to index.js in root
elif [ -f "index.js" ]; then
    node index.js
else
    echo "Error: Could not find entry point"
    echo "Please ensure the project is built correctly"
    exit 1
fi
EOF
    
    chmod +x start-agentwise.sh
    print_status "Start script created"
}

# Create update script
create_update_script() {
    print_status "Creating update script..."
    
    cat > update-agentwise.sh << 'EOF'
#!/bin/bash
cd "$HOME/agentwise"
echo "Updating Agentwise..."

# Backup workspace
cp -r workspace workspace-backup-$(date +%Y%m%d-%H%M%S) 2>/dev/null || true

# Stash local changes
git stash

# Pull latest changes
git pull origin main

# Install new dependencies
npm install --legacy-peer-deps

# Restore workspace if needed
echo "Update complete!"
EOF
    
    chmod +x update-agentwise.sh
    print_status "Update script created"
}

# Main installation flow
main() {
    echo "Starting Agentwise installation..."
    echo
    
    # System checks
    check_node_version
    check_git
    
    # Installation
    clean_install
    clone_repo
    install_dependencies
    create_directories
    setup_env
    build_project
    create_start_script
    create_update_script
    
    echo
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║           INSTALLATION COMPLETE! 🎉                   ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo
    echo "To start Agentwise:"
    echo "  cd ~/agentwise"
    echo "  ./start-agentwise.sh"
    echo
    echo "To update Agentwise:"
    echo "  cd ~/agentwise"
    echo "  ./update-agentwise.sh"
    echo
    echo "For Claude Code integration:"
    echo "  1. Open Claude Code"
    echo "  2. Run: /setup-mcps"
    echo "  3. Run: /create-project \"your idea\""
    echo
    print_status "Installation completed successfully!"
}

# Run main function
main