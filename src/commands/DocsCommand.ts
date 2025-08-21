/**
 * Documentation Command Handler - Opens local documentation in browser
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class DocsCommand {
  private docsPath: string;
  private indexPath: string;

  constructor() {
    // First try docs-site for development, then fallback to docs folder
    const docsSitePath = path.resolve(path.join(process.cwd(), 'docs-site'));
    const docsPath = path.resolve(path.join(process.cwd(), 'docs'));
    
    // Check if we're in development mode with docs-site
    if (fs.pathExistsSync(docsSitePath)) {
      this.docsPath = docsSitePath;
      this.indexPath = path.join(docsSitePath, 'out', 'index.html');
      
      // If out folder doesn't exist, try to serve dev version
      if (!fs.pathExistsSync(this.indexPath)) {
        this.indexPath = path.join(docsSitePath, 'src', 'app', 'page.tsx');
      }
    } else {
      this.docsPath = docsPath;
      this.indexPath = path.join(this.docsPath, 'index.html');
    }
  }

  /**
   * Handle the /docs command
   */
  async handle(args: string[] = []): Promise<void> {
    try {
      // Check if help is requested
      if (args.includes('help') || args.includes('--help')) {
        this.showHelp();
        return;
      }

      // Check if docs directory exists
      if (!await fs.pathExists(this.docsPath)) {
        console.error('❌ Documentation directory not found');
        console.log('Please ensure you are running from the Agentwise project root');
        return;
      }

      // Check if index.html exists
      if (!await fs.pathExists(this.indexPath)) {
        console.error('❌ Documentation index.html not found');
        console.log('Documentation files may be missing or corrupted');
        return;
      }

      // If docs-site exists and has package.json, offer to run dev server
      const docsSitePath = path.join(process.cwd(), 'docs-site');
      const packageJsonPath = path.join(docsSitePath, 'package.json');
      
      if (await fs.pathExists(packageJsonPath)) {
        console.log('📚 Starting Agentwise Documentation Development Server...');
        console.log('🚀 Running: npm run dev in docs-site folder');
        console.log('⏳ Please wait for the server to start...\n');
        
        // Start the Next.js dev server
        const devProcess = exec('npm run dev', { cwd: docsSitePath });
        
        // Wait a bit for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('✅ Documentation server started at http://localhost:3000');
        console.log('📝 Press Ctrl+C to stop the server\n');
        
        // Open browser
        await execAsync('open http://localhost:3000').catch(() => {
          console.log('Please open http://localhost:3000 in your browser');
        });
        
        // Keep process alive
        process.stdin.resume();
        process.on('SIGINT', () => {
          devProcess.kill();
          process.exit();
        });
      } else {
        console.log('📚 Opening Agentwise Documentation...');
        console.log(`📁 Location: ${this.indexPath}`);

        // Open the documentation in the default browser
        await this.openInBrowser();

        console.log('✅ Documentation opened in your default browser');
        console.log('\n💡 Tip: Use Ctrl/Cmd + K in the documentation to search');
        console.log('📝 Documentation is also available at: https://vibecodingwithphil.github.io/agentwise/');
      }
      
    } catch (error) {
      console.error('❌ Error opening documentation:', error instanceof Error ? error.message : error);
      console.log('\nYou can manually open the documentation by navigating to:');
      console.log(`file://${this.indexPath}`);
    }
  }

  /**
   * Open documentation in the default browser
   */
  private async openInBrowser(): Promise<void> {
    const url = `file://${this.indexPath}`;
    
    // Detect platform and use appropriate command
    const platform = process.platform;
    let command: string;

    switch (platform) {
      case 'darwin': // macOS
        command = `open "${url}"`;
        break;
      case 'win32': // Windows
        command = `start "" "${url}"`;
        break;
      default: // Linux and others
        // Try multiple commands for Linux
        const commands = [
          `xdg-open "${url}"`,
          `gnome-open "${url}"`,
          `kde-open "${url}"`,
          `firefox "${url}"`,
          `google-chrome "${url}"`,
          `chromium-browser "${url}"`
        ];

        // Try each command until one works
        for (const cmd of commands) {
          try {
            await execAsync(cmd);
            return; // Success, exit
          } catch {
            // Try next command
            continue;
          }
        }
        
        // If we get here, no command worked
        throw new Error('Could not find a suitable browser command');
    }

    // Execute the platform-specific command
    await execAsync(command);
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(`
📚 Agentwise Documentation Command

Usage: /docs [options]

Description:
  Opens the Agentwise documentation hub in your default browser.
  The documentation provides comprehensive guides, references, and examples.

Options:
  help, --help    Show this help message

Features:
  • Interactive documentation hub with search
  • All documentation files in one place
  • Quick access to commands and guides
  • Links to GitHub and external resources
  • Responsive design for all screen sizes

Documentation Sections:
  • Getting Started - Installation and setup guides
  • Core Features - Architecture and agent documentation
  • Advanced Features - MCP integration, model routing
  • DevOps & Monitoring - CI/CD and monitoring guides
  • Help & Support - Troubleshooting and contribution guides

Keyboard Shortcuts (in documentation):
  • Ctrl/Cmd + K - Focus search bar
  • Click any card to open documentation

Examples:
  /docs           # Open documentation hub
  /docs help      # Show this help message

Online Documentation:
  https://github.com/VibeCodingWithPhil/agentwise/docs
    `);
  }

  /**
   * Get list of available documentation files
   */
  async listDocumentationFiles(): Promise<string[]> {
    try {
      const files = await fs.readdir(this.docsPath);
      return files
        .filter(file => file.endsWith('.md') || file.endsWith('.html'))
        .sort();
    } catch (error) {
      console.error('Error listing documentation files:', error);
      return [];
    }
  }

  /**
   * Search documentation content
   */
  async searchDocumentation(searchTerm: string): Promise<void> {
    console.log(`🔍 Searching for "${searchTerm}" in documentation...`);
    
    try {
      const files = await this.listDocumentationFiles();
      const results: Array<{file: string, matches: string[]}> = [];

      for (const file of files) {
        if (file === 'index.html') continue; // Skip HTML file
        
        const filePath = path.join(this.docsPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        
        const lines = content.split('\n');
        const matches: string[] = [];
        
        lines.forEach((line, index) => {
          if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
            matches.push(`  Line ${index + 1}: ${line.trim()}`);
          }
        });
        
        if (matches.length > 0) {
          results.push({ file, matches: matches.slice(0, 3) }); // Show max 3 matches per file
        }
      }

      if (results.length === 0) {
        console.log(`No results found for "${searchTerm}"`);
      } else {
        console.log(`\nFound ${results.length} file(s) with matches:\n`);
        results.forEach(result => {
          console.log(`📄 ${result.file}`);
          result.matches.forEach(match => console.log(match));
          console.log('');
        });
      }
    } catch (error) {
      console.error('Error searching documentation:', error);
    }
  }

  /**
   * Check if documentation is up to date
   */
  async checkDocumentationStatus(): Promise<void> {
    console.log('🔍 Checking documentation status...\n');
    
    const expectedFiles = [
      'README.md',
      'getting-started.md',
      'commands.md',
      'architecture.md',
      'custom-agents.md',
      'ci-cd-integration.md',
      'dynamic-agents.md',
      'mcp-integration.md',
      'monitor-command.md',
      'performance-analytics.md',
      'smart-model-routing.md',
      'tech-stack-validator.md',
      'troubleshooting.md',
      'index.html'
    ];

    for (const file of expectedFiles) {
      const filePath = path.join(this.docsPath, file);
      const exists = await fs.pathExists(filePath);
      
      if (exists) {
        const stats = await fs.stat(filePath);
        const lastModified = stats.mtime.toLocaleDateString();
        console.log(`✅ ${file} (Modified: ${lastModified})`);
      } else {
        console.log(`❌ ${file} (Missing)`);
      }
    }
  }
}

// Export for use in other modules
export default DocsCommand;