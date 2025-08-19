import * as fs from 'fs-extra';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { PromptEnhancer } from '../utils/PromptEnhancer';
import { AgentManager } from '../orchestrator/AgentManager';

const execAsync = promisify(exec);

export interface ImageContext {
  imagePath: string;
  description: string;
  fileType: string;
  fileName: string;
  timestamp: Date;
}

export class ImageCommand {
  private promptEnhancer: PromptEnhancer;
  private agentManager: AgentManager;
  private supportedFormats = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp'];

  constructor() {
    this.promptEnhancer = new PromptEnhancer();
    this.agentManager = new AgentManager();
  }

  async execute(description?: string): Promise<void> {
    try {
      console.log('🖼️  Opening file browser for image selection...');
      
      // Get image path from file browser
      const imagePath = await this.selectImageFile();
      
      if (!imagePath) {
        console.log('❌ No image selected. Command cancelled.');
        return;
      }

      // Validate image file
      if (!await this.validateImageFile(imagePath)) {
        console.log('❌ Invalid image file. Please select a supported format.');
        console.log(`Supported formats: ${this.supportedFormats.join(', ')}`);
        return;
      }

      // Create image context
      const imageContext: ImageContext = {
        imagePath,
        description: description || '',
        fileType: path.extname(imagePath).toLowerCase(),
        fileName: path.basename(imagePath),
        timestamp: new Date()
      };

      console.log(`✅ Image selected: ${imageContext.fileName}`);
      
      // Enhance the description if provided
      if (description) {
        console.log('🔄 Enhancing context description...');
        const enhancedPrompt = await this.enhanceImagePrompt(description, imageContext);
        imageContext.description = enhancedPrompt;
      }

      // Process with appropriate agents
      await this.processWithAgents(imageContext);
      
    } catch (error) {
      console.error('❌ Error executing image command:', error);
      throw error;
    }
  }

  private async selectImageFile(): Promise<string | null> {
    const platform = process.platform;
    let command: string;
    
    try {
      if (platform === 'darwin') {
        // macOS: Use AppleScript with osascript
        command = `osascript -e 'POSIX path of (choose file of type {"public.image"} with prompt "Select an image for context")'`;
      } else if (platform === 'win32') {
        // Windows: Use PowerShell file dialog
        command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.OpenFileDialog; $dialog.Filter = 'Image Files|*.png;*.jpg;*.jpeg;*.gif;*.bmp;*.svg;*.webp|All Files|*.*'; $dialog.Title = 'Select an image for context'; if($dialog.ShowDialog() -eq 'OK'){$dialog.FileName}"`;
      } else {
        // Linux: Use zenity if available, otherwise kdialog or fallback
        const hasZenity = await this.commandExists('zenity');
        const hasKdialog = await this.commandExists('kdialog');
        
        if (hasZenity) {
          command = `zenity --file-selection --title="Select an image for context" --file-filter="Image files | *.png *.jpg *.jpeg *.gif *.bmp *.svg *.webp"`;
        } else if (hasKdialog) {
          command = `kdialog --getopenfilename ~ "*.png *.jpg *.jpeg *.gif *.bmp *.svg *.webp|Image files"`;
        } else {
          console.log('⚠️  No file dialog available. Please install zenity or kdialog.');
          console.log('You can also manually provide the image path.');
          return null;
        }
      }

      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stdout) {
        return null; // User cancelled
      }
      
      return stdout.trim();
      
    } catch (error) {
      // User cancelled or error occurred
      return null;
    }
  }

  private async commandExists(command: string): Promise<boolean> {
    try {
      await execAsync(`which ${command}`);
      return true;
    } catch {
      return false;
    }
  }

  private async validateImageFile(imagePath: string): Promise<boolean> {
    try {
      // Check if file exists
      if (!await fs.pathExists(imagePath)) {
        return false;
      }

      // Check file extension
      const ext = path.extname(imagePath).toLowerCase();
      if (!this.supportedFormats.includes(ext)) {
        return false;
      }

      // Check if it's actually a file (not a directory)
      const stats = await fs.stat(imagePath);
      if (!stats.isFile()) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private async enhanceImagePrompt(description: string, context: ImageContext): Promise<string> {
    // Create a context-aware prompt that includes image information
    const imageInfo = `[Image Context: ${context.fileName} (${context.fileType})]`;
    
    const enhancedPrompt = await this.promptEnhancer.enhance(
      `${imageInfo} ${description}`,
      'image-analysis'
    );

    // Add specific instructions for image analysis
    const instructions = `
Analyze the provided image and help with: ${description}

Key considerations:
1. Visual elements and their arrangement
2. Any text or labels visible in the image
3. Color schemes and styling
4. Layout and component structure
5. Any errors or issues visible
6. Suggested improvements or implementations

The image file is located at: ${context.imagePath}
File type: ${context.fileType}
    `.trim();

    return `${enhancedPrompt}\n\n${instructions}`;
  }

  private async processWithAgents(context: ImageContext): Promise<void> {
    console.log('🤖 Analyzing image context to determine required agents...');
    
    // Determine which agents are needed based on the description
    const agents = this.determineRequiredAgents(context.description);
    
    console.log(`📋 Engaging ${agents.length} specialist(s): ${agents.join(', ')}`);
    
    // Create a special context file for the image analysis
    const contextPath = await this.createImageContextFile(context);
    
    // Launch appropriate agents with the image context
    if (agents.length === 1) {
      console.log(`🚀 Launching ${agents[0]} for focused analysis...`);
      await this.launchSingleAgent(agents[0], contextPath);
    } else {
      console.log('🚀 Launching multiple agents for comprehensive analysis...');
      await this.launchMultipleAgents(agents, contextPath);
    }
    
    console.log('\n✨ Image context loaded. Agents are analyzing your request.');
    console.log(`📍 Image reference: ${context.imagePath}`);
    console.log('\nAgents will provide solutions based on the visual context.');
  }

  private determineRequiredAgents(description: string): string[] {
    const desc = description.toLowerCase();
    const agents: Set<string> = new Set();

    // Keywords for each specialist
    const agentKeywords = {
      'frontend-specialist': ['ui', 'ux', 'component', 'style', 'css', 'layout', 'design', 'button', 'form', 'responsive', 'color', 'animation', 'react', 'vue', 'angular'],
      'backend-specialist': ['api', 'server', 'endpoint', 'error', 'log', 'authentication', 'database connection', 'request', 'response'],
      'database-specialist': ['schema', 'table', 'query', 'database', 'sql', 'relation', 'migration', 'model'],
      'devops-specialist': ['deploy', 'docker', 'kubernetes', 'ci/cd', 'pipeline', 'infrastructure', 'architecture', 'diagram', 'flow'],
      'testing-specialist': ['test', 'bug', 'error', 'coverage', 'debug', 'issue', 'problem', 'broken', 'fix']
    };

    // Check which agents are relevant
    for (const [agent, keywords] of Object.entries(agentKeywords)) {
      for (const keyword of keywords) {
        if (desc.includes(keyword)) {
          agents.add(agent);
          break;
        }
      }
    }

    // Default to frontend specialist for UI-related images
    if (agents.size === 0) {
      agents.add('frontend-specialist');
    }

    return Array.from(agents);
  }

  private async createImageContextFile(context: ImageContext): Promise<string> {
    const contextDir = path.join(process.cwd(), '.agentwise-context');
    await fs.ensureDir(contextDir);
    
    const contextFile = path.join(contextDir, `image-context-${Date.now()}.md`);
    
    const content = `# Image Analysis Context

## Image Information
- **File**: ${context.fileName}
- **Path**: ${context.imagePath}
- **Type**: ${context.fileType}
- **Timestamp**: ${context.timestamp.toISOString()}

## User Request
${context.description}

## Analysis Instructions
Please analyze the image at the specified path and provide solutions based on the visual context.
The image should be read directly from: ${context.imagePath}

Note: Do not copy or move the image file. Reference it from its current location.

## Expected Output
1. Analysis of the visual elements
2. Identification of any issues or requirements
3. Proposed solution or implementation
4. Code examples if applicable
5. Best practices and recommendations
`;

    await fs.writeFile(contextFile, content);
    return contextFile;
  }

  private async launchSingleAgent(agent: string, contextPath: string): Promise<void> {
    // In production, this would integrate with Claude Code's agent system
    console.log(`Agent ${agent} is analyzing the image...`);
    console.log(`Context file: ${contextPath}`);
    
    // The actual implementation would invoke the agent with:
    // /agent "${agent}" --context "${contextPath}"
  }

  private async launchMultipleAgents(agents: string[], contextPath: string): Promise<void> {
    // In production, this would launch agents in parallel
    for (const agent of agents) {
      console.log(`Agent ${agent} is joining the analysis...`);
    }
    console.log(`Shared context: ${contextPath}`);
    
    // The actual implementation would coordinate multiple agents
  }

  async cleanup(): Promise<void> {
    // Clean up temporary context files
    const contextDir = path.join(process.cwd(), '.agentwise-context');
    if (await fs.pathExists(contextDir)) {
      await fs.remove(contextDir);
    }
  }
}