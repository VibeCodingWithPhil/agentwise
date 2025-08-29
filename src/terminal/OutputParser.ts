import { EventEmitter } from 'events';

export enum TerminalState {
  IDLE = 'idle',
  RUNNING = 'running',
  WAITING_PERMISSION = 'waiting_permission',
  WAITING_INPUT = 'waiting_input',
  ERROR = 'error',
  COMPLETED = 'completed',
  INTERRUPTED = 'interrupted'
}

export interface ParsedOutput {
  originalText: string;
  state: TerminalState;
  requiresAction: boolean;
  actionType?: 'continue' | 'overwrite' | 'skip' | 'abort' | 'custom';
  prompt?: string;
  options?: string[];
  confidence: number;
  context: string;
  metadata?: Record<string, any>;
}

export interface PatternMatch {
  pattern: RegExp;
  state: TerminalState;
  actionType?: ParsedOutput['actionType'];
  confidence: number;
  extractor?: (match: RegExpMatchArray, context: string) => Partial<ParsedOutput>;
}

export class OutputParser extends EventEmitter {
  private previousState = TerminalState.IDLE;
  private patterns: PatternMatch[] = [];
  private responseCache = new Map<string, ParsedOutput>();
  private contextWindow = 500; // characters

  constructor() {
    super();
    this.initializePatterns();
  }

  private initializePatterns(): void {
    this.patterns = [
      // Permission requests
      {
        pattern: /Do you want to (?:continue|proceed)\?\s*\(y\/n\)/i,
        state: TerminalState.WAITING_PERMISSION,
        actionType: 'continue',
        confidence: 0.95
      },
      {
        pattern: /Permission denied.*proceed\?\s*\(y\/n\)/i,
        state: TerminalState.WAITING_PERMISSION,
        actionType: 'continue',
        confidence: 0.9
      },
      {
        pattern: /File (?:already )?exists.*overwrite\?\s*\([yn]\/[yn]\)/i,
        state: TerminalState.WAITING_PERMISSION,
        actionType: 'overwrite',
        confidence: 0.95
      },
      {
        pattern: /Would you like to (?:overwrite|replace).*\?\s*\([yn]\)/i,
        state: TerminalState.WAITING_PERMISSION,
        actionType: 'overwrite',
        confidence: 0.9
      },
      {
        pattern: /Are you sure\?\s*\(y\/n\)/i,
        state: TerminalState.WAITING_PERMISSION,
        actionType: 'continue',
        confidence: 0.85
      },

      // Claude Code specific patterns
      {
        pattern: /Claude Code is requesting permission to/i,
        state: TerminalState.WAITING_PERMISSION,
        actionType: 'continue',
        confidence: 0.95,
        extractor: (match, context) => ({
          prompt: this.extractPromptFromContext(context, match.index || 0)
        })
      },
      {
        pattern: /\[Claude\].*\?\s*$/m,
        state: TerminalState.WAITING_INPUT,
        actionType: 'custom',
        confidence: 0.8
      },
      {
        pattern: /Press any key to continue/i,
        state: TerminalState.WAITING_INPUT,
        actionType: 'continue',
        confidence: 0.9
      },

      // Input requests
      {
        pattern: /Enter (?:your )?(?:choice|selection|option).*:/i,
        state: TerminalState.WAITING_INPUT,
        actionType: 'custom',
        confidence: 0.8,
        extractor: (match, context) => ({
          options: this.extractOptionsFromContext(context, match.index || 0)
        })
      },
      {
        pattern: /Please (?:enter|provide|specify).*:/i,
        state: TerminalState.WAITING_INPUT,
        actionType: 'custom',
        confidence: 0.75
      },
      {
        pattern: /\?[^\n]*$$/m,
        state: TerminalState.WAITING_INPUT,
        actionType: 'custom',
        confidence: 0.6
      },

      // Status indicators
      {
        pattern: /✓|✔|SUCCESS|COMPLETED|DONE/i,
        state: TerminalState.COMPLETED,
        confidence: 0.8
      },
      {
        pattern: /✗|✖|ERROR|FAILED|FAILURE/i,
        state: TerminalState.ERROR,
        confidence: 0.8
      },
      {
        pattern: /^>\s|Running|Executing|Processing/i,
        state: TerminalState.RUNNING,
        confidence: 0.7
      },
      {
        pattern: /Interrupted|Cancelled|Aborted/i,
        state: TerminalState.INTERRUPTED,
        confidence: 0.8
      },

      // Agent-specific patterns
      {
        pattern: /Agent (?:completed|finished|done)/i,
        state: TerminalState.COMPLETED,
        confidence: 0.85
      },
      {
        pattern: /Agent (?:failed|error|crashed)/i,
        state: TerminalState.ERROR,
        confidence: 0.85
      },
      {
        pattern: /Waiting for (?:agent|response|input)/i,
        state: TerminalState.WAITING_INPUT,
        confidence: 0.8
      },

      // File operation patterns
      {
        pattern: /mkdir -p.*\(y\/n\)/i,
        state: TerminalState.WAITING_PERMISSION,
        actionType: 'continue',
        confidence: 0.9
      },
      {
        pattern: /rm -rf.*confirm\?\s*\(y\/n\)/i,
        state: TerminalState.WAITING_PERMISSION,
        actionType: 'continue',
        confidence: 0.95
      },

      // Package manager patterns
      {
        pattern: /npm install.*\?\s*\([yn]\)/i,
        state: TerminalState.WAITING_PERMISSION,
        actionType: 'continue',
        confidence: 0.9
      },
      {
        pattern: /yarn add.*\?\s*\([yn]\)/i,
        state: TerminalState.WAITING_PERMISSION,
        actionType: 'continue',
        confidence: 0.9
      },

      // Git patterns
      {
        pattern: /git (?:push|pull|merge).*\?\s*\([yn]\)/i,
        state: TerminalState.WAITING_PERMISSION,
        actionType: 'continue',
        confidence: 0.9
      },

      // Generic continuation patterns
      {
        pattern: /\([yn]\/[yn]\)\s*$/i,
        state: TerminalState.WAITING_PERMISSION,
        actionType: 'continue',
        confidence: 0.7
      },
      {
        pattern: /\(yes\/no\)\s*$/i,
        state: TerminalState.WAITING_PERMISSION,
        actionType: 'continue',
        confidence: 0.7
      }
    ];
  }

  public parse(output: string, context = ''): ParsedOutput {
    const fullContext = (context + output).slice(-this.contextWindow);
    const cacheKey = this.generateCacheKey(output, fullContext);
    
    // Check cache first
    if (this.responseCache.has(cacheKey)) {
      const cached = this.responseCache.get(cacheKey)!;
      this.updateState(cached.state);
      return cached;
    }

    let bestMatch: ParsedOutput | null = null;
    let highestConfidence = 0;

    // Test against all patterns
    for (const patternMatch of this.patterns) {
      const match = output.match(patternMatch.pattern);
      if (match && patternMatch.confidence > highestConfidence) {
        highestConfidence = patternMatch.confidence;
        
        let parsedOutput: ParsedOutput = {
          originalText: output,
          state: patternMatch.state,
          requiresAction: this.requiresAction(patternMatch.state),
          actionType: patternMatch.actionType,
          confidence: patternMatch.confidence,
          context: fullContext
        };

        // Apply custom extractor if available
        if (patternMatch.extractor) {
          const extracted = patternMatch.extractor(match, fullContext);
          parsedOutput = { ...parsedOutput, ...extracted };
        }

        // Extract prompt if not already extracted
        if (!parsedOutput.prompt && this.requiresAction(patternMatch.state)) {
          parsedOutput.prompt = this.extractPromptFromMatch(match, fullContext);
        }

        bestMatch = parsedOutput;
      }
    }

    // Fallback analysis if no pattern matched
    if (!bestMatch) {
      bestMatch = this.fallbackAnalysis(output, fullContext);
    }

    // Cache the result
    this.responseCache.set(cacheKey, bestMatch);
    
    // Clean cache if it gets too large
    if (this.responseCache.size > 1000) {
      const keys = Array.from(this.responseCache.keys());
      keys.slice(0, 500).forEach(key => this.responseCache.delete(key));
    }

    this.updateState(bestMatch.state);
    return bestMatch;
  }

  private requiresAction(state: TerminalState): boolean {
    return state === TerminalState.WAITING_PERMISSION || 
           state === TerminalState.WAITING_INPUT;
  }

  private fallbackAnalysis(output: string, context: string): ParsedOutput {
    let state = TerminalState.IDLE;
    let confidence = 0.3;

    // Simple heuristics
    if (output.includes('?')) {
      state = TerminalState.WAITING_INPUT;
      confidence = 0.4;
    } else if (output.includes('error') || output.includes('Error')) {
      state = TerminalState.ERROR;
      confidence = 0.5;
    } else if (output.trim().length > 0) {
      state = TerminalState.RUNNING;
      confidence = 0.3;
    }

    return {
      originalText: output,
      state,
      requiresAction: this.requiresAction(state),
      confidence,
      context
    };
  }

  private extractPromptFromContext(context: string, matchIndex: number): string {
    const beforeMatch = context.substring(0, matchIndex);
    const lines = beforeMatch.split('\n');
    
    // Look for the last non-empty line that looks like a prompt
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line && (line.includes('?') || line.includes(':'))) {
        return line;
      }
    }
    
    return context.split('\n').pop()?.trim() || '';
  }

  private extractPromptFromMatch(match: RegExpMatchArray, context: string): string {
    const matchText = match[0];
    const contextLines = context.split('\n');
    
    // Find the line containing the match
    for (const line of contextLines) {
      if (line.includes(matchText)) {
        return line.trim();
      }
    }
    
    return matchText;
  }

  private extractOptionsFromContext(context: string, matchIndex: number): string[] {
    const options: string[] = [];
    const contextLines = context.split('\n');
    
    // Look for lines that look like options (numbered, lettered, or bulleted)
    for (const line of contextLines) {
      const trimmed = line.trim();
      if (/^[\d\w]\)|^\d+\.|^[-*+]\s/.test(trimmed)) {
        options.push(trimmed);
      }
    }
    
    return options;
  }

  private generateCacheKey(output: string, context: string): string {
    // Create a simple hash for caching
    const content = output + context.slice(-100);
    return Buffer.from(content).toString('base64').slice(0, 32);
  }

  private updateState(newState: TerminalState): void {
    if (newState !== this.previousState) {
      const oldState = this.previousState;
      this.previousState = newState;
      
      if (newState === TerminalState.WAITING_PERMISSION) {
        this.emit('permission_required');
      } else if (newState === TerminalState.WAITING_INPUT) {
        this.emit('input_required');
      }
      
      this.emit('state_change', oldState, newState);
    }
  }

  public addCustomPattern(pattern: PatternMatch): void {
    this.patterns.unshift(pattern); // Add to beginning for higher priority
  }

  public clearCache(): void {
    this.responseCache.clear();
  }

  public getStats(): {
    cacheSize: number;
    patternCount: number;
    currentState: TerminalState;
  } {
    return {
      cacheSize: this.responseCache.size,
      patternCount: this.patterns.length,
      currentState: this.previousState
    };
  }
}