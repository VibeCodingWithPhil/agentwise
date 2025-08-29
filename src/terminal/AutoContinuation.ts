import { EventEmitter } from 'events';
import { ParsedOutput, TerminalState } from './OutputParser';

export interface ResponseTemplate {
  pattern: RegExp;
  response: string | ((match: ParsedOutput) => string);
  confidence: number;
  description: string;
  conditions?: (match: ParsedOutput) => boolean;
}

export interface ContinuationConfig {
  enableAutoPermissions: boolean;
  enableAutoInput: boolean;
  safetyMode: boolean;
  defaultPermissionResponse: 'yes' | 'no' | 'ask';
  maxAutoResponses: number;
  responseDelay: number;
}

export class AutoContinuation extends EventEmitter {
  private config: ContinuationConfig;
  private responseTemplates: ResponseTemplate[] = [];
  private responseCount = 0;
  private sessionStartTime = Date.now();
  private responseHistory: Array<{ prompt: string; response: string; timestamp: Date }> = [];

  constructor(config: Partial<ContinuationConfig> = {}) {
    super();
    
    this.config = {
      enableAutoPermissions: true,
      enableAutoInput: true,
      safetyMode: true,
      defaultPermissionResponse: 'yes',
      maxAutoResponses: 50,
      responseDelay: 100,
      ...config
    };

    this.initializeResponseTemplates();
  }

  private initializeResponseTemplates(): void {
    this.responseTemplates = [
      // Permission responses
      {
        pattern: /Do you want to (?:continue|proceed)\?\s*\(y\/n\)/i,
        response: 'y\n',
        confidence: 0.95,
        description: 'General continuation prompt'
      },
      {
        pattern: /Permission denied.*proceed\?\s*\(y\/n\)/i,
        response: 'y\n',
        confidence: 0.9,
        description: 'Permission denied override',
        conditions: (match) => !this.config.safetyMode
      },
      {
        pattern: /File (?:already )?exists.*overwrite\?\s*\([yn]\/[yn]\)/i,
        response: 'y\n',
        confidence: 0.95,
        description: 'File overwrite confirmation'
      },
      {
        pattern: /Would you like to (?:overwrite|replace).*\?\s*\([yn]\)/i,
        response: 'y\n',
        confidence: 0.9,
        description: 'File replacement confirmation'
      },
      {
        pattern: /Are you sure\?\s*\(y\/n\)/i,
        response: 'y\n',
        confidence: 0.85,
        description: 'General confirmation'
      },

      // Claude Code specific responses
      {
        pattern: /Claude Code is requesting permission to/i,
        response: 'y\n',
        confidence: 0.95,
        description: 'Claude Code permission request'
      },
      {
        pattern: /Press any key to continue/i,
        response: '\n',
        confidence: 0.9,
        description: 'Press any key prompt'
      },

      // Package management
      {
        pattern: /npm install.*\?\s*\([yn]\)/i,
        response: 'y\n',
        confidence: 0.9,
        description: 'NPM install confirmation'
      },
      {
        pattern: /yarn add.*\?\s*\([yn]\)/i,
        response: 'y\n',
        confidence: 0.9,
        description: 'Yarn add confirmation'
      },
      {
        pattern: /Do you want to install.*packages\?/i,
        response: 'y\n',
        confidence: 0.9,
        description: 'Package installation prompt'
      },

      // Git operations
      {
        pattern: /git (?:push|pull|merge).*\?\s*\([yn]\)/i,
        response: 'y\n',
        confidence: 0.9,
        description: 'Git operation confirmation',
        conditions: (match) => !this.isDestructiveGitOperation(match.originalText)
      },

      // File operations
      {
        pattern: /mkdir -p.*\(y\/n\)/i,
        response: 'y\n',
        confidence: 0.9,
        description: 'Directory creation'
      },
      {
        pattern: /rm -rf.*confirm\?\s*\(y\/n\)/i,
        response: (match) => this.config.safetyMode ? 'n\n' : 'y\n',
        confidence: 0.95,
        description: 'Destructive file removal',
        conditions: (match) => !this.containsImportantPaths(match.originalText)
      },

      // Development tools
      {
        pattern: /Would you like to (?:start|run|execute).*\?\s*\([yn]\)/i,
        response: 'y\n',
        confidence: 0.8,
        description: 'Tool execution prompt'
      },
      {
        pattern: /Save changes\?\s*\([yn]\)/i,
        response: 'y\n',
        confidence: 0.9,
        description: 'Save changes confirmation'
      },

      // Input responses
      {
        pattern: /Enter (?:your )?(?:choice|selection|option).*:/i,
        response: (match) => this.generateChoiceResponse(match),
        confidence: 0.8,
        description: 'Choice selection prompt'
      },
      {
        pattern: /Please enter (?:a )?(?:name|title|description).*:/i,
        response: (match) => this.generateNameResponse(match),
        confidence: 0.7,
        description: 'Name/title input prompt'
      },
      {
        pattern: /Enter (?:port|number).*:/i,
        response: (match) => this.generateNumberResponse(match),
        confidence: 0.8,
        description: 'Number input prompt'
      },

      // Agent-specific responses
      {
        pattern: /Agent requires (?:confirmation|approval)/i,
        response: 'y\n',
        confidence: 0.9,
        description: 'Agent confirmation request'
      },
      {
        pattern: /Continue with (?:next phase|execution)\?/i,
        response: 'y\n',
        confidence: 0.95,
        description: 'Phase continuation'
      },

      // Generic patterns (lower confidence)
      {
        pattern: /\([yn]\/[yn]\)\s*$/i,
        response: 'y\n',
        confidence: 0.7,
        description: 'Generic yes/no prompt'
      },
      {
        pattern: /\(yes\/no\)\s*$/i,
        response: 'yes\n',
        confidence: 0.7,
        description: 'Generic yes/no prompt (verbose)'
      },
      {
        pattern: /\?\s*$/m,
        response: (match) => this.generateContextualResponse(match),
        confidence: 0.5,
        description: 'Generic question prompt'
      }
    ];
  }

  public generatePermissionResponse(parsedOutput: ParsedOutput): string | null {
    if (!this.config.enableAutoPermissions) {
      return null;
    }

    if (this.responseCount >= this.config.maxAutoResponses) {
      this.emit('max_responses_reached', this.responseCount);
      return null;
    }

    const response = this.findBestResponse(parsedOutput);
    if (response) {
      this.recordResponse(parsedOutput.prompt || parsedOutput.originalText, response);
      this.emit('response_sent', response);
    }

    return response;
  }

  public generateInputResponse(parsedOutput: ParsedOutput): string | null {
    if (!this.config.enableAutoInput) {
      return null;
    }

    if (this.responseCount >= this.config.maxAutoResponses) {
      return null;
    }

    const response = this.findBestResponse(parsedOutput);
    if (response) {
      this.recordResponse(parsedOutput.prompt || parsedOutput.originalText, response);
      this.emit('response_sent', response);
    }

    return response;
  }

  public generateCustomResponse(parsedOutput: ParsedOutput): string | null {
    const response = this.findBestResponse(parsedOutput);
    if (response) {
      this.recordResponse(parsedOutput.prompt || parsedOutput.originalText, response);
      this.emit('response_sent', response);
    }

    return response;
  }

  private findBestResponse(parsedOutput: ParsedOutput): string | null {
    let bestTemplate: ResponseTemplate | null = null;
    let highestConfidence = 0;

    for (const template of this.responseTemplates) {
      const match = parsedOutput.originalText.match(template.pattern);
      if (match && template.confidence > highestConfidence) {
        // Check conditions if they exist
        if (template.conditions && !template.conditions(parsedOutput)) {
          continue;
        }

        highestConfidence = template.confidence;
        bestTemplate = template;
      }
    }

    if (bestTemplate && highestConfidence > 0.6) {
      const response = typeof bestTemplate.response === 'function'
        ? bestTemplate.response(parsedOutput)
        : bestTemplate.response;

      return response;
    }

    return null;
  }

  private generateChoiceResponse(match: ParsedOutput): string {
    // Extract options and choose the most appropriate one
    const options = match.options || [];
    
    if (options.length > 0) {
      // Prefer options that contain "continue", "yes", "proceed", or numbers like "1"
      for (const option of options) {
        if (/(?:continue|yes|proceed|^1\))/i.test(option)) {
          const number = option.match(/^(\d+)/)?.[1];
          return number ? `${number}\n` : '1\n';
        }
      }
      // Default to first option
      const firstNumber = options[0].match(/^(\d+)/)?.[1];
      return firstNumber ? `${firstNumber}\n` : '1\n';
    }

    return '1\n'; // Default choice
  }

  private generateNameResponse(match: ParsedOutput): string {
    const text = match.originalText.toLowerCase();
    
    if (text.includes('project')) {
      return 'agentwise-project\n';
    } else if (text.includes('component')) {
      return 'NewComponent\n';
    } else if (text.includes('service')) {
      return 'NewService\n';
    } else if (text.includes('file')) {
      return 'newfile\n';
    }
    
    return 'default\n';
  }

  private generateNumberResponse(match: ParsedOutput): string {
    const text = match.originalText.toLowerCase();
    
    if (text.includes('port')) {
      return '3000\n';
    } else if (text.includes('timeout')) {
      return '30\n';
    } else if (text.includes('retry') || text.includes('attempts')) {
      return '3\n';
    }
    
    return '1\n';
  }

  private generateContextualResponse(match: ParsedOutput): string {
    const text = match.originalText.toLowerCase();
    
    // Analyze context to determine appropriate response
    if (text.includes('continue') || text.includes('proceed')) {
      return 'y\n';
    } else if (text.includes('install') || text.includes('download')) {
      return 'y\n';
    } else if (text.includes('delete') || text.includes('remove')) {
      return this.config.safetyMode ? 'n\n' : 'y\n';
    } else if (text.includes('save') || text.includes('write')) {
      return 'y\n';
    }
    
    // Default to the configured default
    return this.config.defaultPermissionResponse === 'yes' ? 'y\n' : 'n\n';
  }

  private isDestructiveGitOperation(text: string): boolean {
    const destructivePatterns = [
      /git reset --hard/i,
      /git clean -fd/i,
      /git branch -D/i,
      /git push --force/i,
      /git rebase.*--force/i
    ];

    return destructivePatterns.some(pattern => pattern.test(text));
  }

  private containsImportantPaths(text: string): boolean {
    const importantPaths = [
      /\/home/i,
      /\/root/i,
      /\/usr/i,
      /\/etc/i,
      /\/var/i,
      /\/System/i,
      /\/Applications/i,
      /node_modules/i,
      /\.git/i
    ];

    return importantPaths.some(pattern => pattern.test(text));
  }

  private recordResponse(prompt: string, response: string): void {
    this.responseCount++;
    this.responseHistory.push({
      prompt: prompt.trim(),
      response: response.trim(),
      timestamp: new Date()
    });

    // Keep history manageable
    if (this.responseHistory.length > 100) {
      this.responseHistory = this.responseHistory.slice(-50);
    }
  }

  public addResponseTemplate(template: ResponseTemplate): void {
    this.responseTemplates.unshift(template); // Add to beginning for higher priority
  }

  public updateConfig(updates: Partial<ContinuationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public resetSession(): void {
    this.responseCount = 0;
    this.sessionStartTime = Date.now();
    this.responseHistory = [];
  }

  public getStats(): {
    responseCount: number;
    sessionDuration: number;
    templateCount: number;
    historySize: number;
    config: ContinuationConfig;
    recentResponses: Array<{ prompt: string; response: string; timestamp: Date }>;
  } {
    return {
      responseCount: this.responseCount,
      sessionDuration: Date.now() - this.sessionStartTime,
      templateCount: this.responseTemplates.length,
      historySize: this.responseHistory.length,
      config: { ...this.config },
      recentResponses: this.responseHistory.slice(-10)
    };
  }

  public exportResponseHistory(): string {
    return JSON.stringify({
      sessionStart: new Date(this.sessionStartTime),
      responses: this.responseHistory,
      stats: this.getStats()
    }, null, 2);
  }

  public getResponseHistory(): Array<{ prompt: string; response: string; timestamp: Date }> {
    return [...this.responseHistory];
  }
}