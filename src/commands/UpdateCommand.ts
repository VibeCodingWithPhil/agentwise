import { execSync } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';
import chalk from 'chalk';

export class UpdateCommand {
  private agentwisePath: string;
  private currentVersion: string;
  private latestVersion: string;

  constructor() {
    this.agentwisePath = path.join(process.env.HOME || '', 'agentwise');
    this.currentVersion = '';
    this.latestVersion = '';
  }

  async execute(): Promise<void> {
    console.log(chalk.blue('🔄 Agentwise Update System\n'));
    
    try {
      // Step 1: Check current version
      await this.checkCurrentVersion();
      
      // Step 2: Fetch latest version
      await this.fetchLatestVersion();
      
      // Step 3: Compare versions
      if (this.currentVersion === this.latestVersion) {
        console.log(chalk.green(`✅ Agentwise is already up to date (v${this.currentVersion})`));
        console.log(chalk.gray('No update necessary.'));
        return;
      }
      
      // Step 4: Perform update
      await this.performUpdate();
      
      // Step 5: Verify update
      await this.verifyUpdate();
      
      console.log(chalk.green(`\n✅ Successfully updated Agentwise from v${this.currentVersion} to v${this.latestVersion}!`));
      console.log(chalk.cyan('\n📝 What\'s new:'));
      console.log(chalk.gray(`  Check release notes at: https://github.com/VibeCodingWithPhil/agentwise/releases/tag/v${this.latestVersion}`));
      console.log(chalk.blue('\n🚀 Agentwise is ready to use!'));
      
    } catch (error: any) {
      console.error(chalk.red('❌ Update failed:'), error.message);
      this.showTroubleshooting(error);
    }
  }

  private async checkCurrentVersion(): Promise<void> {
    console.log(chalk.cyan('📦 Checking current version...'));
    
    const packagePath = path.join(this.agentwisePath, 'package.json');
    if (!await fs.pathExists(packagePath)) {
      throw new Error('Agentwise not found. Please install it first.');
    }
    
    const packageJson = await fs.readJson(packagePath);
    this.currentVersion = packageJson.version;
    console.log(chalk.gray(`  Current version: v${this.currentVersion}`));
  }

  private async fetchLatestVersion(): Promise<void> {
    console.log(chalk.cyan('🔍 Checking for updates...'));
    
    try {
      // Stash local changes
      execSync('git stash', { cwd: this.agentwisePath, stdio: 'pipe' });
      
      // Fetch latest from remote
      execSync('git fetch origin main', { cwd: this.agentwisePath, stdio: 'pipe' });
      
      // Get latest version from remote
      const remotePackageJson = execSync(
        'git show origin/main:package.json',
        { cwd: this.agentwisePath, encoding: 'utf8' }
      );
      
      const remotePackage = JSON.parse(remotePackageJson);
      this.latestVersion = remotePackage.version;
      console.log(chalk.gray(`  Latest version: v${this.latestVersion}`));
      
    } catch (error) {
      throw new Error('Failed to fetch latest version from GitHub');
    }
  }

  private async performUpdate(): Promise<void> {
    console.log(chalk.yellow(`\n🔄 Updating from v${this.currentVersion} to v${this.latestVersion}...`));
    
    // Step 1: Pull latest changes
    console.log(chalk.cyan('  📥 Downloading updates...'));
    try {
      execSync('git pull origin main', { cwd: this.agentwisePath, stdio: 'pipe' });
    } catch (error) {
      throw new Error('Failed to pull updates. You may have conflicts.');
    }
    
    // Step 2: Install dependencies
    console.log(chalk.cyan('  📦 Installing dependencies...'));
    try {
      execSync('npm install', { cwd: this.agentwisePath, stdio: 'pipe' });
    } catch (error) {
      console.warn(chalk.yellow('  ⚠️ Some dependencies failed to install'));
    }
    
    // Step 3: Build project
    console.log(chalk.cyan('  🔨 Building project...'));
    try {
      execSync('npm run build', { cwd: this.agentwisePath, stdio: 'pipe' });
    } catch (error) {
      console.warn(chalk.yellow('  ⚠️ Build completed with warnings'));
    }
    
    // Step 4: Update global monitor if exists
    await this.updateGlobalMonitor();
    
    // Step 5: Run migration scripts if any
    await this.runMigrations();
    
    // Step 6: Restart services
    await this.restartServices();
  }

  private async updateGlobalMonitor(): Promise<void> {
    const monitorPath = '/usr/local/bin/monitor';
    
    if (await fs.pathExists(monitorPath)) {
      console.log(chalk.cyan('  📊 Updating global monitor command...'));
      try {
        execSync(`sudo ln -sf ${this.agentwisePath}/dist/monitor/cli.js ${monitorPath}`, { stdio: 'pipe' });
      } catch (error) {
        console.warn(chalk.yellow('  ⚠️ Could not update global monitor (may need sudo)'));
      }
    }
  }

  private async runMigrations(): Promise<void> {
    const migrationScript = path.join(this.agentwisePath, `scripts/migrate-to-${this.latestVersion}.js`);
    
    if (await fs.pathExists(migrationScript)) {
      console.log(chalk.cyan('  🔧 Running migration script...'));
      try {
        execSync(`node ${migrationScript}`, { cwd: this.agentwisePath, stdio: 'pipe' });
      } catch (error) {
        console.warn(chalk.yellow('  ⚠️ Migration completed with warnings'));
      }
    }
  }

  private async restartServices(): Promise<void> {
    console.log(chalk.cyan('  🔄 Restarting services...'));
    
    // Restart Context Server if running
    try {
      const contextServerRunning = execSync('pgrep -f startContextServer', { encoding: 'utf8' }).trim();
      if (contextServerRunning) {
        execSync('pkill -f startContextServer', { stdio: 'pipe' });
        execSync(`nohup node ${this.agentwisePath}/dist/context/startContextServer.js > /dev/null 2>&1 &`, { 
          cwd: this.agentwisePath, 
          stdio: 'pipe' 
        });
        console.log(chalk.gray('    Context Server restarted'));
      }
    } catch (error) {
      // Server not running, ignore
    }
  }

  private async verifyUpdate(): Promise<void> {
    console.log(chalk.cyan('\n🔍 Verifying update...'));
    
    // Check new version
    const packagePath = path.join(this.agentwisePath, 'package.json');
    const packageJson = await fs.readJson(packagePath);
    const newVersion = packageJson.version;
    
    if (newVersion !== this.latestVersion) {
      throw new Error('Version mismatch after update');
    }
    
    // Test basic functionality
    try {
      execSync('node dist/index.js --version', { cwd: this.agentwisePath, stdio: 'pipe' });
      console.log(chalk.green('  ✅ Update verified successfully'));
    } catch (error) {
      console.warn(chalk.yellow('  ⚠️ Update completed but verification had warnings'));
    }
  }

  private showTroubleshooting(error: Error): void {
    console.log(chalk.yellow('\n🔧 Troubleshooting:'));
    
    if (error.message.includes('conflicts')) {
      console.log(chalk.gray('  • You have local changes that conflict with the update'));
      console.log(chalk.gray('  • Run: git stash (to save changes) or git reset --hard (to discard)'));
    } else if (error.message.includes('dependencies')) {
      console.log(chalk.gray('  • Try: npm cache clean --force'));
      console.log(chalk.gray('  • Then: npm install'));
    } else if (error.message.includes('build')) {
      console.log(chalk.gray('  • Check TypeScript errors: npm run typecheck'));
      console.log(chalk.gray('  • Try manual build: npm run build'));
    } else {
      console.log(chalk.gray('  • Check your internet connection'));
      console.log(chalk.gray('  • Ensure you have proper Git access'));
      console.log(chalk.gray('  • Try manual update: cd ~/agentwise && git pull && npm install && npm run build'));
    }
    
    console.log(chalk.cyan('\n📚 Rollback Instructions:'));
    console.log(chalk.gray('  If you need to rollback to the previous version:'));
    console.log(chalk.gray('  1. cd ~/agentwise'));
    console.log(chalk.gray('  2. git log --oneline -5'));
    console.log(chalk.gray('  3. git checkout <previous-commit-hash>'));
    console.log(chalk.gray('  4. npm install && npm run build'));
  }
}

// Export for use in main command handler
export async function handleUpdateCommand(): Promise<void> {
  const updater = new UpdateCommand();
  await updater.execute();
}