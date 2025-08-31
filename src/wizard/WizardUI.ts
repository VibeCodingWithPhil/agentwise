/**
 * Wizard UI Components
 * 
 * Beautiful terminal interfaces for the unified project wizard.
 * Provides colorful output, progress bars, interactive prompts,
 * and responsive layouts for an excellent user experience.
 */

import * as readline from 'readline';
import { promisify } from 'util';
import {
  UITheme,
  ProgressBarOptions,
  TableColumn,
  TableOptions,
  PromptOptions,
  PromptChoice,
  WizardProgress,
  WizardStep,
  WizardError
} from './types';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  // Foreground colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
  
  // 256 color support
  fg256: (code: number) => `\x1b[38;5;${code}m`,
  bg256: (code: number) => `\x1b[48;5;${code}m`,
  
  // RGB color support
  rgb: (r: number, g: number, b: number) => `\x1b[38;2;${r};${g};${b}m`,
  bgRgb: (r: number, g: number, b: number) => `\x1b[48;2;${r};${g};${b}m`,
};

// Predefined themes
export const themes: Record<string, UITheme> = {
  default: {
    primary: colors.blue,
    secondary: colors.cyan,
    success: colors.green,
    warning: colors.yellow,
    error: colors.red,
    info: colors.cyan,
    dim: colors.dim,
    bold: colors.bright,
    underline: colors.underscore
  },
  dark: {
    primary: colors.fg256(39), // bright blue
    secondary: colors.fg256(51), // bright cyan
    success: colors.fg256(46), // bright green
    warning: colors.fg256(226), // bright yellow
    error: colors.fg256(196), // bright red
    info: colors.fg256(117), // light blue
    dim: colors.fg256(243), // gray
    bold: colors.bright,
    underline: colors.underscore
  },
  light: {
    primary: colors.fg256(21), // dark blue
    secondary: colors.fg256(31), // dark cyan
    success: colors.fg256(28), // dark green
    warning: colors.fg256(172), // orange
    error: colors.fg256(124), // dark red
    info: colors.fg256(75), // medium blue
    dim: colors.fg256(240), // dark gray
    bold: colors.bright,
    underline: colors.underscore
  },
  colorful: {
    primary: colors.rgb(138, 43, 226), // blue violet
    secondary: colors.rgb(0, 191, 255), // deep sky blue
    success: colors.rgb(50, 205, 50), // lime green
    warning: colors.rgb(255, 165, 0), // orange
    error: colors.rgb(220, 20, 60), // crimson
    info: colors.rgb(30, 144, 255), // dodger blue
    dim: colors.rgb(128, 128, 128), // gray
    bold: colors.bright,
    underline: colors.underscore
  },
  minimal: {
    primary: colors.white,
    secondary: colors.white,
    success: colors.white,
    warning: colors.white,
    error: colors.white,
    info: colors.white,
    dim: colors.dim,
    bold: colors.bright,
    underline: colors.underscore
  }
};

export class WizardUI {
  private theme: UITheme;

  /**
   * Get the current UI theme
   */
  getTheme(): UITheme {
    return this.theme;
  }
  private terminalWidth: number;
  private useColors: boolean;
  private rl?: readline.Interface;

  constructor(themeName: string = 'default', useColors: boolean = true) {
    this.theme = themes[themeName] || themes.default;
    this.useColors = useColors && process.stdout.isTTY;
    this.terminalWidth = process.stdout.columns || 80;
  }

  // Color utility methods
  private colorize(text: string, color: string): string {
    if (!this.useColors) return text;
    return `${color}${text}${colors.reset}`;
  }

  primary(text: string): string {
    return this.colorize(text, this.theme.primary);
  }

  secondary(text: string): string {
    return this.colorize(text, this.theme.secondary);
  }

  success(text: string): string {
    return this.colorize(text, this.theme.success);
  }

  warning(text: string): string {
    return this.colorize(text, this.theme.warning);
  }

  error(text: string): string {
    return this.colorize(text, this.theme.error);
  }

  info(text: string): string {
    return this.colorize(text, this.theme.info);
  }

  dim(text: string): string {
    return this.colorize(text, this.theme.dim);
  }

  bold(text: string): string {
    return this.colorize(text, this.theme.bold);
  }

  underline(text: string): string {
    return this.colorize(text, this.theme.underline);
  }

  // Layout and formatting
  center(text: string, width?: number): string {
    const w = width || this.terminalWidth;
    const lines = text.split('\n');
    return lines.map(line => {
      const padding = Math.max(0, Math.floor((w - line.length) / 2));
      return ' '.repeat(padding) + line;
    }).join('\n');
  }

  box(content: string, title?: string, padding: number = 1): string {
    const lines = content.split('\n');
    const maxWidth = Math.max(...lines.map(line => line.length));
    const boxWidth = maxWidth + (padding * 2) + 2;
    
    let result = '';
    
    // Top border
    if (title) {
      const titleLine = `┌─ ${this.bold(title)} `;
      const remainingWidth = Math.max(0, boxWidth - titleLine.length + this.theme.bold.length + colors.reset.length);
      result += this.dim(titleLine + '─'.repeat(remainingWidth - 1) + '┐') + '\n';
    } else {
      result += this.dim('┌' + '─'.repeat(boxWidth - 2) + '┐') + '\n';
    }
    
    // Content
    lines.forEach(line => {
      const paddedLine = ' '.repeat(padding) + line + ' '.repeat(maxWidth - line.length + padding);
      result += this.dim('│') + paddedLine + this.dim('│') + '\n';
    });
    
    // Bottom border
    result += this.dim('└' + '─'.repeat(boxWidth - 2) + '┘');
    
    return result;
  }

  banner(text: string, subtitle?: string): string {
    const bannerText = this.bold(this.primary(text));
    let result = '\n' + this.center(bannerText) + '\n';
    
    if (subtitle) {
      result += this.center(this.dim(subtitle)) + '\n';
    }
    
    result += this.center(this.dim('─'.repeat(Math.min(text.length + 4, this.terminalWidth - 10)))) + '\n';
    
    return result;
  }

  // Progress indicators
  progressBar(options: ProgressBarOptions): string {
    const { total, current, width, label, showPercentage, showEta, showElapsed, theme } = options;
    
    const percentage = Math.min(100, Math.max(0, Math.round((current / total) * 100)));
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    
    let bar = '';
    if (this.useColors) {
      bar += theme.success + '█'.repeat(filled) + colors.reset;
      bar += theme.dim + '░'.repeat(empty) + colors.reset;
    } else {
      bar += '█'.repeat(filled) + '░'.repeat(empty);
    }
    
    let result = '';
    if (label) {
      result += `${label} `;
    }
    
    result += `[${bar}]`;
    
    if (showPercentage) {
      result += ` ${percentage}%`;
    }
    
    result += ` (${current}/${total})`;
    
    return result;
  }

  spinner(message: string, isSpinning: boolean = true): string {
    const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    const spinnerChar = isSpinning ? 
      spinnerChars[Math.floor(Date.now() / 100) % spinnerChars.length] : 
      '✓';
    
    const colorizedSpinner = isSpinning ? 
      this.primary(spinnerChar) : 
      this.success(spinnerChar);
      
    return `${colorizedSpinner} ${message}`;
  }

  // Tables
  table(options: TableOptions): string {
    const { columns, data, theme, borders, padding, maxWidth } = options;
    
    if (data.length === 0) {
      return this.dim('No data to display');
    }
    
    // Calculate column widths
    const columnWidths = columns.map(col => {
      const headerWidth = col.label.length;
      const dataWidth = Math.max(...data.map(row => {
        const value = col.formatter ? col.formatter(row[col.key]) : String(row[col.key] || '');
        return value.length;
      }));
      return Math.max(headerWidth, dataWidth, col.width || 0);
    });
    
    // Adjust widths if maxWidth is specified
    if (maxWidth) {
      const totalPadding = columns.length * padding * 2;
      const totalBorders = borders ? columns.length + 1 : 0;
      const availableWidth = maxWidth - totalPadding - totalBorders;
      const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      
      if (totalWidth > availableWidth) {
        const scale = availableWidth / totalWidth;
        for (let i = 0; i < columnWidths.length; i++) {
          columnWidths[i] = Math.floor(columnWidths[i] * scale);
        }
      }
    }
    
    let result = '';
    
    // Header
    if (borders) {
      result += this.dim('┌' + columnWidths.map(width => 
        '─'.repeat(width + padding * 2)).join('┬') + '┐') + '\n';
    }
    
    const headerRow = columns.map((col, index) => {
      const width = columnWidths[index];
      const text = col.label.padEnd(width).substring(0, width);
      const paddedText = ' '.repeat(padding) + this.bold(text) + ' '.repeat(padding);
      return paddedText;
    });
    
    if (borders) {
      result += this.dim('│') + headerRow.join(this.dim('│')) + this.dim('│') + '\n';
      result += this.dim('├' + columnWidths.map(width => 
        '─'.repeat(width + padding * 2)).join('┼') + '┤') + '\n';
    } else {
      result += headerRow.join(' ') + '\n';
      result += columnWidths.map(width => '─'.repeat(width + padding * 2)).join(' ') + '\n';
    }
    
    // Data rows
    data.forEach(row => {
      const dataRow = columns.map((col, index) => {
        const width = columnWidths[index];
        const value = col.formatter ? col.formatter(row[col.key]) : String(row[col.key] || '');
        let text = value.substring(0, width);
        
        if (col.align === 'right') {
          text = text.padStart(width);
        } else if (col.align === 'center') {
          const leftPad = Math.floor((width - text.length) / 2);
          const rightPad = width - text.length - leftPad;
          text = ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
        } else {
          text = text.padEnd(width);
        }
        
        const paddedText = ' '.repeat(padding) + text + ' '.repeat(padding);
        return paddedText;
      });
      
      if (borders) {
        result += this.dim('│') + dataRow.join(this.dim('│')) + this.dim('│') + '\n';
      } else {
        result += dataRow.join(' ') + '\n';
      }
    });
    
    // Bottom border
    if (borders) {
      result += this.dim('└' + columnWidths.map(width => 
        '─'.repeat(width + padding * 2)).join('┴') + '┘');
    }
    
    return result;
  }

  // Interactive prompts
  async prompt(options: PromptOptions): Promise<any> {
    if (!this.rl) {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }

    const question = (prompt: string): Promise<string> => {
      return new Promise((resolve) => {
        this.rl!.question(prompt, (answer) => {
          resolve(answer);
        });
      });
    };

    switch (options.type) {
      case 'input':
        return await this.inputPrompt(options, question);
      case 'password':
        return await this.passwordPrompt(options);
      case 'confirm':
        return await this.confirmPrompt(options, question);
      case 'select':
        return await this.selectPrompt(options);
      case 'multiselect':
        return await this.multiselectPrompt(options);
      default:
        throw new Error(`Unsupported prompt type: ${options.type}`);
    }
  }

  private async inputPrompt(options: PromptOptions, question: (q: string) => Promise<string>): Promise<string> {
    let prompt = `${this.primary('?')} ${options.message}`;
    if (options.default) {
      prompt += this.dim(` (${options.default})`);
    }
    prompt += this.primary(': ');

    while (true) {
      const answer = await question(prompt);
      const value = answer.trim() || options.default;

      if (options.required && !value) {
        console.log(this.error('This field is required.'));
        continue;
      }

      if (options.validation) {
        const validationResult = options.validation(value);
        if (validationResult !== true) {
          console.log(this.error(typeof validationResult === 'string' ? validationResult : 'Invalid input.'));
          continue;
        }
      }

      return value;
    }
  }

  private async passwordPrompt(options: PromptOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const stdin = process.stdin;
      const stdout = process.stdout;
      
      let password = '';
      
      stdout.write(`${this.primary('?')} ${options.message}${this.primary(': ')}`);
      
      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');
      
      const onData = (char: string): void => {
        switch (char) {
          case '\n':
          case '\r':
          case '\u0004': // Ctrl+D
            stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener('data', onData);
            stdout.write('\n');
            
            if (options.required && !password) {
              stdout.write(this.error('This field is required.') + '\n');
              this.passwordPrompt(options).then(resolve).catch(reject);
              return;
            }
            
            if (options.validation) {
              const validationResult = options.validation(password);
              if (validationResult !== true) {
                const errorMessage = typeof validationResult === 'string' ? validationResult : 'Invalid input.';
                stdout.write(this.error(errorMessage) + '\n');
                this.passwordPrompt(options).then(resolve).catch(reject);
                return;
              }
            }
            
            resolve(password);
            break;
          case '\u0003': // Ctrl+C
            stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener('data', onData);
            reject(new Error('User cancelled'));
            break;
          case '\u007f': // Backspace
            if (password.length > 0) {
              password = password.slice(0, -1);
            }
            break;
          default:
            password += char;
            break;
        }
      };
      
      stdin.on('data', onData);
    });
  }

  private async confirmPrompt(options: PromptOptions, question: (q: string) => Promise<string>): Promise<boolean> {
    const defaultValue = options.default !== undefined ? options.default : true;
    const yesNo = defaultValue ? 'Y/n' : 'y/N';
    const prompt = `${this.primary('?')} ${options.message} ${this.dim(`(${yesNo})`)}${this.primary(': ')}`;

    while (true) {
      const answer = (await question(prompt)).trim().toLowerCase();
      
      if (answer === '') {
        return defaultValue;
      }
      
      if (['y', 'yes', 'true', '1'].includes(answer)) {
        return true;
      }
      
      if (['n', 'no', 'false', '0'].includes(answer)) {
        return false;
      }
      
      console.log(this.error('Please enter y/yes or n/no.'));
    }
  }

  private async selectPrompt(options: PromptOptions): Promise<any> {
    if (!options.choices || options.choices.length === 0) {
      throw new Error('Select prompt requires choices');
    }

    console.log(`${this.primary('?')} ${options.message}`);
    
    options.choices.forEach((choice, index) => {
      const prefix = `  ${this.dim(`${index + 1})`)} `;
      const name = choice.disabled ? this.dim(choice.name) : choice.name;
      const description = choice.description ? this.dim(` - ${choice.description}`) : '';
      console.log(prefix + name + description);
    });

    while (true) {
      const answer = await this.prompt({
        type: 'input',
        message: 'Enter your choice',
        validation: (value) => {
          const num = parseInt(value);
          if (isNaN(num) || num < 1 || num > options.choices!.length) {
            return `Please enter a number between 1 and ${options.choices!.length}`;
          }
          const choice = options.choices![num - 1];
          if (choice.disabled) {
            return 'This option is not available';
          }
          return true;
        },
        theme: options.theme,
        required: options.required
      });

      const index = parseInt(answer) - 1;
      return options.choices[index].value;
    }
  }

  private async multiselectPrompt(options: PromptOptions): Promise<any[]> {
    if (!options.choices || options.choices.length === 0) {
      throw new Error('Multiselect prompt requires choices');
    }

    console.log(`${this.primary('?')} ${options.message}`);
    console.log(this.dim('  (Use space to select, enter to confirm)'));
    
    const selected = new Set<number>();
    options.choices.forEach((choice, index) => {
      if (choice.selected) {
        selected.add(index);
      }
    });

    const display = () => {
      console.clear();
      console.log(`${this.primary('?')} ${options.message}`);
      console.log(this.dim('  (Use space to select, enter to confirm)'));
      
      options.choices!.forEach((choice, index) => {
        const isSelected = selected.has(index);
        const checkbox = isSelected ? this.success('◉') : this.dim('◯');
        const name = choice.disabled ? this.dim(choice.name) : choice.name;
        const description = choice.description ? this.dim(` - ${choice.description}`) : '';
        console.log(`  ${checkbox} ${name}${description}`);
      });
    };

    display();

    return new Promise((resolve) => {
      const stdin = process.stdin;
      let currentIndex = 0;

      stdin.setRawMode(true);
      stdin.resume();
      stdin.setEncoding('utf8');

      const onData = (key: string) => {
        switch (key) {
          case ' ':
            if (!options.choices![currentIndex].disabled) {
              if (selected.has(currentIndex)) {
                selected.delete(currentIndex);
              } else {
                selected.add(currentIndex);
              }
              display();
            }
            break;
          case '\r':
          case '\n':
            stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener('data', onData);
            const result = Array.from(selected).map(index => options.choices![index].value);
            resolve(result);
            break;
          case '\u0003': // Ctrl+C
            stdin.setRawMode(false);
            stdin.pause();
            stdin.removeListener('data', onData);
            process.exit(1);
            break;
        }
      };

      stdin.on('data', onData);
    });
  }

  // Status and messaging
  showStep(step: WizardStep, progress: WizardProgress): void {
    console.log('\n' + this.box(
      `${this.bold('Step ' + (progress.currentStep + 1) + '/' + progress.totalSteps)}: ${step.name}\n\n` +
      this.dim(step.description) + '\n\n' +
      `${this.dim('Estimated time:')} ${step.estimatedTime} minutes`,
      undefined,
      2
    ));
  }

  showProgress(progress: WizardProgress): void {
    const progressBar = this.progressBar({
      total: progress.totalSteps,
      current: progress.completedSteps,
      width: 30,
      label: 'Overall Progress',
      showPercentage: true,
      showEta: true,
      showElapsed: false,
      theme: this.theme
    });
    
    console.log('\n' + progressBar);
    
    if (progress.estimatedTimeRemaining > 0) {
      console.log(this.dim(`Estimated time remaining: ${progress.estimatedTimeRemaining} minutes`));
    }
  }

  showError(error: WizardError): void {
    let icon = '';
    let color = this.error;
    
    switch (error.type) {
      case 'warning':
        icon = '⚠️';
        color = this.warning;
        break;
      case 'error':
        icon = '❌';
        color = this.error;
        break;
      case 'critical':
        icon = '🚨';
        color = this.error;
        break;
    }
    
    console.log('\n' + color(`${icon} ${error.message}`));
    if (error.details) {
      console.log(this.dim(JSON.stringify(error.details, null, 2)));
    }
  }

  showSuccess(message: string): void {
    console.log('\n' + this.success(`✅ ${message}`));
  }

  showWarning(message: string): void {
    console.log('\n' + this.warning(`⚠️  ${message}`));
  }

  showInfo(message: string): void {
    console.log('\n' + this.info(`ℹ️  ${message}`));
  }

  // Utility methods
  clear(): void {
    console.clear();
  }

  pause(): void {
    console.log('\n' + this.dim('Press any key to continue...'));
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
    });
  }

  showSummary(title: string, items: Array<{ label: string; value: string; status?: 'success' | 'warning' | 'error' }>): void {
    console.log('\n' + this.bold(title));
    console.log(this.dim('─'.repeat(title.length)));
    
    items.forEach(item => {
      let statusIcon = '';
      let colorFn = (text: string) => text;
      
      if (item.status) {
        switch (item.status) {
          case 'success':
            statusIcon = this.success('✓');
            break;
          case 'warning':
            statusIcon = this.warning('⚠');
            break;
          case 'error':
            statusIcon = this.error('✗');
            break;
        }
      }
      
      console.log(`${statusIcon ? statusIcon + ' ' : ''}${this.dim(item.label + ':')} ${item.value}`);
    });
  }

  cleanup(): void {
    if (this.rl) {
      this.rl.close();
      this.rl = undefined;
    }
  }
}