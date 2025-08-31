import * as fs from 'fs-extra';
import * as path from 'path';
import * as crypto from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  SecurityMonitorConfig,
  SecurityVulnerability,
  SecurityScanResult,
  SecurityError,
  Logger,
  PerformanceMonitor,
  FileSystem,
  HttpClient
} from './types';

const execAsync = promisify(exec);

interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface DependencyVulnerability {
  name: string;
  version: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  cve: string;
  description: string;
  fixedIn?: string;
}

interface OwaspCheck {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  check: (content: string, filePath: string) => SecurityVulnerability[];
}

export class ContinuousSecurityMonitor {
  private config: SecurityMonitorConfig;
  private logger: Logger;
  private performanceMonitor: PerformanceMonitor;
  private fileSystem: FileSystem;
  private httpClient: HttpClient;
  private scanTimer: NodeJS.Timeout | null = null;
  private isRunning = false;
  private isScanning = false;
  private lastScanResult: SecurityScanResult | null = null;
  private fileHashes = new Map<string, string>();
  private secretPatterns: SecretPattern[] = [];
  private owaspChecks: OwaspCheck[] = [];

  constructor(
    config: SecurityMonitorConfig,
    logger: Logger,
    performanceMonitor: PerformanceMonitor,
    fileSystem: FileSystem,
    httpClient: HttpClient
  ) {
    this.config = config;
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
    this.fileSystem = fileSystem;
    this.httpClient = httpClient;
    
    this.initializeSecretPatterns();
    this.initializeOwaspChecks();
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('SecurityMonitor is already running');
      return;
    }

    const perfId = this.performanceMonitor.start('security-monitor-start');
    
    try {
      this.logger.info('Starting ContinuousSecurityMonitor', { config: this.config });
      
      // Perform initial scan
      await this.performSecurityScan();
      
      // Start scheduled scanning
      if (this.config.scanInterval > 0) {
        this.startScheduledScanning();
      }
      
      this.isRunning = true;
      this.logger.info('ContinuousSecurityMonitor started successfully');
      
    } catch (error) {
      this.logger.error('Failed to start SecurityMonitor', { error });
      throw new SecurityError(
        'Failed to start security monitor',
        'SECURITY_MONITOR_START_FAILED',
        { error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      this.performanceMonitor.end(perfId);
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('SecurityMonitor is not running');
      return;
    }

    this.logger.info('Stopping ContinuousSecurityMonitor');
    
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
    
    this.isRunning = false;
    this.logger.info('ContinuousSecurityMonitor stopped successfully');
  }

  private initializeSecretPatterns(): void {
    this.secretPatterns = [
      {
        name: 'AWS Access Key',
        pattern: /AKIA[0-9A-Z]{16}/g,
        severity: 'critical',
        description: 'AWS Access Key detected'
      },
      {
        name: 'AWS Secret Key',
        pattern: /[A-Za-z0-9/+=]{40}/g,
        severity: 'critical',
        description: 'AWS Secret Key detected'
      },
      {
        name: 'GitHub Token',
        pattern: /ghp_[a-zA-Z0-9]{36}/g,
        severity: 'high',
        description: 'GitHub Personal Access Token detected'
      },
      {
        name: 'Generic API Key',
        pattern: /api[_-]?key\s*[:=]\s*["']?[a-zA-Z0-9]{20,}["']?/gi,
        severity: 'high',
        description: 'Generic API Key detected'
      },
      {
        name: 'Database URL',
        pattern: /(mongodb|mysql|postgresql|redis):\/\/[^\s"']+/gi,
        severity: 'medium',
        description: 'Database connection string detected'
      },
      {
        name: 'Private Key',
        pattern: /-----BEGIN.*PRIVATE KEY-----[\s\S]*?-----END.*PRIVATE KEY-----/g,
        severity: 'critical',
        description: 'Private key detected'
      },
      {
        name: 'JWT Token',
        pattern: /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g,
        severity: 'medium',
        description: 'JWT token detected'
      },
      {
        name: 'Password',
        pattern: /password\s*[:=]\s*["']?[^"'\s]{8,}["']?/gi,
        severity: 'medium',
        description: 'Hardcoded password detected'
      },
      {
        name: 'Slack Token',
        pattern: /xox[baprs]-[0-9a-zA-Z]{10,48}/g,
        severity: 'high',
        description: 'Slack token detected'
      },
      {
        name: 'Discord Token',
        pattern: /[MN][A-Za-z\d]{23}\.[\w-]{6}\.[\w-]{27}/g,
        severity: 'high',
        description: 'Discord bot token detected'
      },
      // Add more patterns from config
      ...this.config.secretPatterns.map(pattern => ({
        name: 'Custom Pattern',
        pattern: new RegExp(pattern, 'gi'),
        severity: 'medium' as const,
        description: 'Custom secret pattern match'
      }))
    ];
  }

  private initializeOwaspChecks(): void {
    this.owaspChecks = [
      {
        id: 'A01-2021',
        title: 'Broken Access Control',
        severity: 'high',
        check: this.checkBrokenAccessControl.bind(this)
      },
      {
        id: 'A02-2021',
        title: 'Cryptographic Failures',
        severity: 'high',
        check: this.checkCryptographicFailures.bind(this)
      },
      {
        id: 'A03-2021',
        title: 'Injection',
        severity: 'critical',
        check: this.checkInjectionVulnerabilities.bind(this)
      },
      {
        id: 'A04-2021',
        title: 'Insecure Design',
        severity: 'medium',
        check: this.checkInsecureDesign.bind(this)
      },
      {
        id: 'A05-2021',
        title: 'Security Misconfiguration',
        severity: 'high',
        check: this.checkSecurityMisconfiguration.bind(this)
      },
      {
        id: 'A06-2021',
        title: 'Vulnerable Components',
        severity: 'high',
        check: this.checkVulnerableComponents.bind(this)
      },
      {
        id: 'A07-2021',
        title: 'Identification Failures',
        severity: 'medium',
        check: this.checkIdentificationFailures.bind(this)
      },
      {
        id: 'A08-2021',
        title: 'Software Integrity Failures',
        severity: 'medium',
        check: this.checkSoftwareIntegrityFailures.bind(this)
      },
      {
        id: 'A09-2021',
        title: 'Logging Failures',
        severity: 'low',
        check: this.checkLoggingFailures.bind(this)
      },
      {
        id: 'A10-2021',
        title: 'Server-Side Request Forgery',
        severity: 'high',
        check: this.checkSSRFVulnerabilities.bind(this)
      }
    ];
  }

  private startScheduledScanning(): void {
    const intervalMs = this.config.scanInterval * 60 * 1000;
    
    this.scanTimer = setInterval(async () => {
      if (!this.isScanning) {
        await this.performSecurityScan();
      }
    }, intervalMs);
    
    this.logger.info('Scheduled scanning started', { intervalMinutes: this.config.scanInterval });
  }

  async performSecurityScan(paths?: string[]): Promise<SecurityScanResult> {
    if (this.isScanning) {
      this.logger.warn('Security scan already in progress');
      return this.lastScanResult!;
    }

    this.isScanning = true;
    const perfId = this.performanceMonitor.start('security-scan');
    const scanId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      this.logger.info('Starting security scan', { scanId });
      
      const scanPaths = paths || [process.cwd()];
      const allFiles = await this.getAllFiles(scanPaths);
      const vulnerabilities: SecurityVulnerability[] = [];
      
      // Filter files to scan
      const filesToScan = allFiles.filter(file => !this.shouldExcludeFile(file));
      
      this.logger.info('Scanning files for vulnerabilities', { 
        totalFiles: filesToScan.length,
        scanId 
      });
      
      // Scan for secrets
      const secretVulns = await this.scanForSecrets(filesToScan);
      vulnerabilities.push(...secretVulns);
      
      // OWASP compliance checks
      if (this.config.owaspChecks) {
        const owaspVulns = await this.performOwaspChecks(filesToScan);
        vulnerabilities.push(...owaspVulns);
      }
      
      // Dependency vulnerability check
      if (this.config.dependencyCheck) {
        const depVulns = await this.scanDependencies();
        vulnerabilities.push(...depVulns);
      }
      
      // Auto-fix vulnerabilities if enabled
      if (this.config.autoFix) {
        await this.autoFixVulnerabilities(vulnerabilities);
      }
      
      const duration = Date.now() - startTime;
      const summary = this.calculateSummary(vulnerabilities);
      
      const result: SecurityScanResult = {
        timestamp: new Date(),
        scanId,
        vulnerabilities,
        summary,
        duration,
        filesScanned: filesToScan.length
      };
      
      this.lastScanResult = result;
      
      // Check alert thresholds
      await this.checkAlertThresholds(result);
      
      this.logger.info('Security scan completed', { 
        scanId, 
        duration, 
        vulnerabilities: vulnerabilities.length,
        summary
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('Security scan failed', { scanId, error });
      throw new SecurityError(
        'Security scan failed',
        'SECURITY_SCAN_FAILED',
        { scanId, error: error instanceof Error ? error.message : String(error) }
      );
    } finally {
      this.isScanning = false;
      this.performanceMonitor.end(perfId);
    }
  }

  private async getAllFiles(scanPaths: string[]): Promise<string[]> {
    const allFiles: string[] = [];
    
    for (const scanPath of scanPaths) {
      await this.collectFilesRecursively(scanPath, allFiles);
    }
    
    return allFiles;
  }

  private async collectFilesRecursively(dir: string, files: string[]): Promise<void> {
    try {
      const entries = await this.fileSystem.list(dir);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = await this.fileSystem.stat(fullPath);
        
        if (stat.size === -1) { // Directory
          await this.collectFilesRecursively(fullPath, files);
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      this.logger.warn('Error reading directory', { dir, error: error instanceof Error ? error.message : String(error) });
    }
  }

  private shouldExcludeFile(filePath: string): boolean {
    const excludePatterns = [
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /\.min\./,
      /\.(jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/i,
      ...this.config.excludeFiles.map(pattern => new RegExp(pattern))
    ];
    
    return excludePatterns.some(pattern => pattern.test(filePath));
  }

  private async scanForSecrets(files: string[]): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    for (const filePath of files) {
      try {
        const content = await this.fileSystem.read(filePath);
        
        for (const secretPattern of this.secretPatterns) {
          const matches = content.matchAll(secretPattern.pattern);
          
          for (const match of matches) {
            const lineNumber = this.getLineNumber(content, match.index!);
            
            vulnerabilities.push({
              id: crypto.randomUUID(),
              severity: secretPattern.severity,
              type: 'secret',
              file: filePath,
              line: lineNumber,
              description: secretPattern.description,
              recommendation: `Remove or secure the ${secretPattern.name.toLowerCase()}`,
              autoFixAvailable: false
            });
          }
        }
      } catch (error) {
        this.logger.warn('Error scanning file for secrets', { filePath, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    return vulnerabilities;
  }

  private async performOwaspChecks(files: string[]): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    for (const filePath of files) {
      try {
        const content = await this.fileSystem.read(filePath);
        
        for (const owaspCheck of this.owaspChecks) {
          const checkVulns = owaspCheck.check(content, filePath);
          vulnerabilities.push(...checkVulns);
        }
      } catch (error) {
        this.logger.warn('Error performing OWASP checks', { filePath, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    return vulnerabilities;
  }

  // OWASP Check Implementations
  private checkBrokenAccessControl(content: string, filePath: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for missing authorization
    const authPatterns = [
      /app\.(get|post|put|delete)\s*\([^,]+,\s*(?!.*auth|.*login|.*permission)/gi,
      /router\.(get|post|put|delete)\s*\([^,]+,\s*(?!.*auth|.*login|.*permission)/gi
    ];
    
    authPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index!);
        vulnerabilities.push({
          id: crypto.randomUUID(),
          severity: 'high',
          type: 'code',
          file: filePath,
          line: lineNumber,
          description: 'Potential missing access control on endpoint',
          recommendation: 'Add proper authentication and authorization middleware',
          autoFixAvailable: false,
          cwe: 'CWE-862'
        });
      }
    });
    
    return vulnerabilities;
  }

  private checkCryptographicFailures(content: string, filePath: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for weak cryptographic practices
    const cryptoPatterns = [
      { pattern: /md5\s*\(/gi, desc: 'MD5 hash function is cryptographically broken' },
      { pattern: /sha1\s*\(/gi, desc: 'SHA1 hash function is cryptographically weak' },
      { pattern: /des\s*\(/gi, desc: 'DES encryption is cryptographically broken' },
      { pattern: /rc4\s*\(/gi, desc: 'RC4 cipher is cryptographically weak' }
    ];
    
    cryptoPatterns.forEach(({ pattern, desc }) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index!);
        vulnerabilities.push({
          id: crypto.randomUUID(),
          severity: 'high',
          type: 'code',
          file: filePath,
          line: lineNumber,
          description: desc,
          recommendation: 'Use strong cryptographic algorithms like AES-256, SHA-256, or bcrypt',
          autoFixAvailable: false,
          cwe: 'CWE-327'
        });
      }
    });
    
    return vulnerabilities;
  }

  private checkInjectionVulnerabilities(content: string, filePath: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // SQL Injection patterns
    const sqlInjectionPatterns = [
      /query\s*\(\s*["'`][^"'`]*\+[^"'`]*["'`]/gi,
      /execute\s*\(\s*["'`][^"'`]*\+[^"'`]*["'`]/gi,
      /\$\{.*\}.*SELECT|INSERT|UPDATE|DELETE/gi
    ];
    
    sqlInjectionPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index!);
        vulnerabilities.push({
          id: crypto.randomUUID(),
          severity: 'critical',
          type: 'code',
          file: filePath,
          line: lineNumber,
          description: 'Potential SQL injection vulnerability',
          recommendation: 'Use parameterized queries or prepared statements',
          autoFixAvailable: false,
          cwe: 'CWE-89'
        });
      }
    });
    
    // Command Injection patterns
    const cmdInjectionPatterns = [
      /exec\s*\(\s*.*\+.*\)/gi,
      /system\s*\(\s*.*\+.*\)/gi,
      /shell_exec\s*\(\s*.*\+.*\)/gi
    ];
    
    cmdInjectionPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index!);
        vulnerabilities.push({
          id: crypto.randomUUID(),
          severity: 'critical',
          type: 'code',
          file: filePath,
          line: lineNumber,
          description: 'Potential command injection vulnerability',
          recommendation: 'Avoid dynamic command execution or use safe alternatives',
          autoFixAvailable: false,
          cwe: 'CWE-78'
        });
      }
    });
    
    return vulnerabilities;
  }

  private checkInsecureDesign(content: string, filePath: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for missing rate limiting
    if (/app\.(get|post|put|delete)/.test(content) && !/rate.*limit/gi.test(content)) {
      vulnerabilities.push({
        id: crypto.randomUUID(),
        severity: 'medium',
        type: 'code',
        file: filePath,
        line: 1,
        description: 'Missing rate limiting on API endpoints',
        recommendation: 'Implement rate limiting to prevent abuse',
        autoFixAvailable: false,
        cwe: 'CWE-799'
      });
    }
    
    return vulnerabilities;
  }

  private checkSecurityMisconfiguration(content: string, filePath: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for debug mode in production
    const debugPatterns = [
      { pattern: /debug\s*[:=]\s*true/gi, desc: 'Debug mode enabled' },
      { pattern: /NODE_ENV\s*===?\s*["']development["']/gi, desc: 'Development environment check' },
      { pattern: /console\.log\s*\(/gi, desc: 'Console logging statements found' }
    ];
    
    debugPatterns.forEach(({ pattern, desc }) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index!);
        vulnerabilities.push({
          id: crypto.randomUUID(),
          severity: 'medium',
          type: 'config',
          file: filePath,
          line: lineNumber,
          description: desc,
          recommendation: 'Disable debug features in production',
          autoFixAvailable: true,
          cwe: 'CWE-489'
        });
      }
    });
    
    return vulnerabilities;
  }

  private checkVulnerableComponents(content: string, filePath: string): SecurityVulnerability[] {
    // This would typically check package.json against known vulnerabilities
    // For now, return empty array as full implementation would require vulnerability database
    return [];
  }

  private checkIdentificationFailures(content: string, filePath: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for weak session management
    const sessionPatterns = [
      /session\s*\.\s*cookie\s*\.\s*secure\s*=\s*false/gi,
      /session\s*\.\s*cookie\s*\.\s*httpOnly\s*=\s*false/gi
    ];
    
    sessionPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index!);
        vulnerabilities.push({
          id: crypto.randomUUID(),
          severity: 'medium',
          type: 'config',
          file: filePath,
          line: lineNumber,
          description: 'Insecure session cookie configuration',
          recommendation: 'Enable secure and httpOnly flags for session cookies',
          autoFixAvailable: true,
          cwe: 'CWE-614'
        });
      }
    });
    
    return vulnerabilities;
  }

  private checkSoftwareIntegrityFailures(content: string, filePath: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for missing integrity checks on external resources
    if (filePath.endsWith('.html')) {
      const scriptPattern = /<script[^>]*src=["']https?:\/\/[^"']*["'][^>]*>/gi;
      const matches = content.matchAll(scriptPattern);
      
      for (const match of matches) {
        if (!/integrity=/gi.test(match[0])) {
          const lineNumber = this.getLineNumber(content, match.index!);
          vulnerabilities.push({
            id: crypto.randomUUID(),
            severity: 'medium',
            type: 'code',
            file: filePath,
            line: lineNumber,
            description: 'External script without integrity check',
            recommendation: 'Add integrity attribute with SRI hash',
            autoFixAvailable: false,
            cwe: 'CWE-353'
          });
        }
      }
    }
    
    return vulnerabilities;
  }

  private checkLoggingFailures(content: string, filePath: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for sensitive data in logs
    const sensitiveLogPatterns = [
      /log.*password/gi,
      /log.*token/gi,
      /log.*key/gi,
      /console\.log.*password/gi
    ];
    
    sensitiveLogPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index!);
        vulnerabilities.push({
          id: crypto.randomUUID(),
          severity: 'low',
          type: 'code',
          file: filePath,
          line: lineNumber,
          description: 'Potential sensitive data in logs',
          recommendation: 'Avoid logging sensitive information',
          autoFixAvailable: false,
          cwe: 'CWE-532'
        });
      }
    });
    
    return vulnerabilities;
  }

  private checkSSRFVulnerabilities(content: string, filePath: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    // Check for user-controlled URLs in HTTP requests
    const ssrfPatterns = [
      /fetch\s*\(\s*.*req\.(body|params|query)/gi,
      /axios\.(get|post)\s*\(\s*.*req\.(body|params|query)/gi,
      /request\s*\(\s*.*req\.(body|params|query)/gi
    ];
    
    ssrfPatterns.forEach(pattern => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        const lineNumber = this.getLineNumber(content, match.index!);
        vulnerabilities.push({
          id: crypto.randomUUID(),
          severity: 'high',
          type: 'code',
          file: filePath,
          line: lineNumber,
          description: 'Potential Server-Side Request Forgery (SSRF) vulnerability',
          recommendation: 'Validate and whitelist allowed URLs',
          autoFixAvailable: false,
          cwe: 'CWE-918'
        });
      }
    });
    
    return vulnerabilities;
  }

  private async scanDependencies(): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];
    
    try {
      // Check if package.json exists
      if (!(await this.fileSystem.exists('package.json'))) {
        return vulnerabilities;
      }
      
      // Try to run npm audit
      try {
        const { stdout } = await execAsync('npm audit --json');
        const auditResult = JSON.parse(stdout);
        
        if (auditResult.vulnerabilities) {
          Object.entries(auditResult.vulnerabilities).forEach(([name, vuln]: [string, any]) => {
            vulnerabilities.push({
              id: crypto.randomUUID(),
              severity: vuln.severity || 'medium',
              type: 'dependency',
              file: 'package.json',
              line: 1,
              description: `Vulnerable dependency: ${name} - ${vuln.title}`,
              recommendation: vuln.fixAvailable ? 'Run npm audit fix' : 'Update to secure version',
              autoFixAvailable: vuln.fixAvailable,
              cve: vuln.cves?.[0],
              cvss: vuln.cvss?.score
            });
          });
        }
      } catch (error) {
        this.logger.warn('npm audit failed', { error: error instanceof Error ? error.message : String(error) });
      }
      
    } catch (error) {
      this.logger.error('Error scanning dependencies', { error });
    }
    
    return vulnerabilities;
  }

  private async autoFixVulnerabilities(vulnerabilities: SecurityVulnerability[]): Promise<void> {
    const fixableVulns = vulnerabilities.filter(v => v.autoFixAvailable);
    
    for (const vuln of fixableVulns) {
      try {
        await this.applyAutoFix(vuln);
        this.logger.info('Auto-fixed vulnerability', { 
          id: vuln.id, 
          file: vuln.file,
          description: vuln.description 
        });
      } catch (error) {
        this.logger.error('Failed to auto-fix vulnerability', { 
          id: vuln.id, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    }
  }

  private async applyAutoFix(vulnerability: SecurityVulnerability): Promise<void> {
    const content = await this.fileSystem.read(vulnerability.file);
    let fixedContent = content;
    
    switch (vulnerability.type) {
      case 'config':
        if (vulnerability.description.includes('Debug mode')) {
          fixedContent = content.replace(/debug\s*[:=]\s*true/gi, 'debug: false');
        } else if (vulnerability.description.includes('Console logging')) {
          fixedContent = content.replace(/console\.log\s*\([^)]*\);?/gi, '// console.log removed for security');
        } else if (vulnerability.description.includes('session cookie')) {
          fixedContent = content
            .replace(/secure\s*=\s*false/gi, 'secure: true')
            .replace(/httpOnly\s*=\s*false/gi, 'httpOnly: true');
        }
        break;
        
      case 'dependency':
        if (vulnerability.recommendation.includes('npm audit fix')) {
          await execAsync('npm audit fix');
          return;
        }
        break;
    }
    
    if (fixedContent !== content) {
      await this.fileSystem.write(vulnerability.file, fixedContent);
    }
  }

  private calculateSummary(vulnerabilities: SecurityVulnerability[]) {
    return {
      total: vulnerabilities.length,
      critical: vulnerabilities.filter(v => v.severity === 'critical').length,
      high: vulnerabilities.filter(v => v.severity === 'high').length,
      medium: vulnerabilities.filter(v => v.severity === 'medium').length,
      low: vulnerabilities.filter(v => v.severity === 'low').length
    };
  }

  private async checkAlertThresholds(result: SecurityScanResult): Promise<void> {
    const { critical, high, medium } = result.summary;
    const { alertThresholds } = this.config;
    
    if (critical >= alertThresholds.critical) {
      this.logger.error('Critical vulnerability threshold exceeded', { 
        count: critical, 
        threshold: alertThresholds.critical 
      });
    }
    
    if (high >= alertThresholds.high) {
      this.logger.warn('High vulnerability threshold exceeded', { 
        count: high, 
        threshold: alertThresholds.high 
      });
    }
    
    if (medium >= alertThresholds.medium) {
      this.logger.warn('Medium vulnerability threshold exceeded', { 
        count: medium, 
        threshold: alertThresholds.medium 
      });
    }
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  // Public API methods
  async scanFile(filePath: string): Promise<SecurityVulnerability[]> {
    return this.scanForSecrets([filePath]);
  }

  getLastScanResult(): SecurityScanResult | null {
    return this.lastScanResult;
  }

  getStatus(): {
    isRunning: boolean;
    isScanning: boolean;
    lastScan: Date | null;
    vulnerabilityCount: number;
  } {
    return {
      isRunning: this.isRunning,
      isScanning: this.isScanning,
      lastScan: this.lastScanResult?.timestamp || null,
      vulnerabilityCount: this.lastScanResult?.vulnerabilities.length || 0
    };
  }

  async updateConfig(newConfig: Partial<SecurityMonitorConfig>): Promise<void> {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      await this.stop();
    }
    
    this.config = { ...this.config, ...newConfig };
    
    // Re-initialize patterns if they changed
    if (newConfig.secretPatterns) {
      this.initializeSecretPatterns();
    }
    
    if (wasRunning) {
      await this.start();
    }
    
    this.logger.info('SecurityMonitor configuration updated', { config: this.config });
  }
}