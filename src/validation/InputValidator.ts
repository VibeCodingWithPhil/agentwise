/**
 * Comprehensive Input Validation Framework
 * Provides centralized validation for all user inputs across the system
 */

import * as path from 'path';
import * as fs from 'fs';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

export class InputValidator {
  // Dangerous patterns that could lead to security issues
  private static readonly DANGEROUS_PATTERNS = [
    /\.\./g,                  // Path traversal
    /[`${}]/g,                // Command injection
    /[|;&<>]/g,               // Shell operators
    /[\x00-\x1f\x7f]/g,       // Control characters
    /^~/,                     // Home directory expansion
    /\${.*}/g,                // Variable expansion
    /\$\(.*\)/g,              // Command substitution
  ];

  // SQL injection patterns
  private static readonly SQL_INJECTION_PATTERNS = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|FROM|WHERE|ORDER BY|GROUP BY|HAVING)\b)/gi,
    /(-{2}|\/\*|\*\/|;|\||@@|char|nchar|varchar|nvarchar|alter|begin|cast|create|cursor|declare|delete|drop|end|exec|execute|fetch|insert|kill|select|sys|sysobjects|syscolumns|table|update)/gi,
  ];

  // XSS patterns
  private static readonly XSS_PATTERNS = [
    /<script[^>]*>.*?<\/\s*script\s*>/gi,  // Matches </script> with optional spaces
    /<iframe[^>]*>.*?<\/\s*iframe\s*>/gi,  // Matches </iframe> with optional spaces
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<img[^>]*onerror[^>]*>/gi,
    /<style[^>]*>.*?<\/\s*style\s*>/gi,  // Also check style tags
    /<object[^>]*>.*?<\/\s*object\s*>/gi,  // Check object tags
    /<embed[^>]*>/gi,  // Check embed tags
  ];

  /**
   * Validate and sanitize file paths
   */
  static validatePath(inputPath: string, basePath?: string): ValidationResult {
    const errors: string[] = [];

    if (!inputPath || typeof inputPath !== 'string') {
      errors.push('Path must be a non-empty string');
      return { isValid: false, errors };
    }

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(inputPath)) {
        errors.push(`Path contains dangerous pattern: ${pattern}`);
      }
    }

    // Resolve to absolute path
    const resolvedPath = path.resolve(inputPath);
    
    // If basePath provided, ensure resolved path is within it
    if (basePath) {
      const resolvedBase = path.resolve(basePath);
      if (!resolvedPath.startsWith(resolvedBase)) {
        errors.push('Path traversal detected: path is outside allowed directory');
      }
    }

    // Check if path exists (optional validation)
    try {
      if (fs.existsSync(resolvedPath)) {
        const stats = fs.statSync(resolvedPath);
        if (stats.isSymbolicLink && stats.isSymbolicLink()) {
          errors.push('Symbolic links are not allowed');
        }
      }
    } catch (error) {
      // Path doesn't exist yet, which might be okay for new files
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? resolvedPath : undefined
    };
  }

  /**
   * Validate and sanitize command arguments
   */
  static validateCommand(command: string, allowedCommands?: string[]): ValidationResult {
    const errors: string[] = [];

    if (!command || typeof command !== 'string') {
      errors.push('Command must be a non-empty string');
      return { isValid: false, errors };
    }

    // Check against allowed commands if provided
    if (allowedCommands && allowedCommands.length > 0) {
      const baseCommand = command.split(' ')[0];
      if (!allowedCommands.includes(baseCommand)) {
        errors.push(`Command '${baseCommand}' is not in allowed list`);
      }
    }

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(command)) {
        errors.push(`Command contains dangerous pattern: ${pattern}`);
      }
    }

    // Check for shell operators that could chain commands
    if (/[;&|]/.test(command)) {
      errors.push('Command chaining operators are not allowed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? command.trim() : undefined
    };
  }

  /**
   * Validate and sanitize project names
   */
  static validateProjectName(name: string): ValidationResult {
    const errors: string[] = [];

    if (!name || typeof name !== 'string') {
      errors.push('Project name must be a non-empty string');
      return { isValid: false, errors };
    }

    // Check length
    if (name.length < 2 || name.length > 100) {
      errors.push('Project name must be between 2 and 100 characters');
    }

    // Check for valid characters (alphanumeric, dash, underscore)
    if (!/^[a-zA-Z0-9\-_]+$/.test(name)) {
      errors.push('Project name can only contain letters, numbers, dashes, and underscores');
    }

    // Check for reserved names
    const reserved = ['con', 'prn', 'aux', 'nul', 'com1', 'lpt1'];
    if (reserved.includes(name.toLowerCase())) {
      errors.push('Project name is reserved by the system');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? name.toLowerCase().replace(/\s+/g, '-') : undefined
    };
  }

  /**
   * Validate and sanitize URLs
   */
  static validateURL(url: string, allowedProtocols: string[] = ['http:', 'https:']): ValidationResult {
    const errors: string[] = [];

    if (!url || typeof url !== 'string') {
      errors.push('URL must be a non-empty string');
      return { isValid: false, errors };
    }

    try {
      const parsed = new URL(url);
      
      // Check protocol
      if (!allowedProtocols.includes(parsed.protocol)) {
        errors.push(`Protocol ${parsed.protocol} is not allowed`);
      }

      // Check for localhost/private IPs (if needed)
      const hostname = parsed.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        errors.push('Local URLs are not allowed');
      }

      // Check for suspicious patterns
      if (url.includes('javascript:') || url.includes('data:')) {
        errors.push('URL contains suspicious protocol');
      }

    } catch (error) {
      errors.push('Invalid URL format');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? url : undefined
    };
  }

  /**
   * Validate and sanitize JSON input
   */
  static validateJSON(input: string): ValidationResult {
    const errors: string[] = [];

    if (!input || typeof input !== 'string') {
      errors.push('JSON input must be a non-empty string');
      return { isValid: false, errors };
    }

    try {
      const parsed = JSON.parse(input);
      
      // Check for prototype pollution
      if ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed) {
        errors.push('JSON contains dangerous properties');
      }

      // Recursively check for dangerous patterns in values
      const checkValue = (value: any): void => {
        if (typeof value === 'string') {
          for (const pattern of this.DANGEROUS_PATTERNS) {
            if (pattern.test(value)) {
              errors.push(`JSON value contains dangerous pattern: ${pattern}`);
            }
          }
        } else if (typeof value === 'object' && value !== null) {
          Object.values(value).forEach(checkValue);
        }
      };

      checkValue(parsed);

      return {
        isValid: errors.length === 0,
        errors,
        sanitized: errors.length === 0 ? parsed : undefined
      };

    } catch (error) {
      errors.push('Invalid JSON format');
      return { isValid: false, errors };
    }
  }

  /**
   * Validate and sanitize SQL input (for database operations)
   */
  static validateSQL(input: string): ValidationResult {
    const errors: string[] = [];

    if (!input || typeof input !== 'string') {
      errors.push('SQL input must be a non-empty string');
      return { isValid: false, errors };
    }

    // Check for SQL injection patterns
    for (const pattern of this.SQL_INJECTION_PATTERNS) {
      if (pattern.test(input)) {
        errors.push('Input contains potential SQL injection pattern');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? input : undefined
    };
  }

  /**
   * Validate and sanitize HTML input
   */
  static validateHTML(input: string): ValidationResult {
    const errors: string[] = [];

    if (!input || typeof input !== 'string') {
      errors.push('HTML input must be a non-empty string');
      return { isValid: false, errors };
    }

    // Check for XSS patterns
    for (const pattern of this.XSS_PATTERNS) {
      if (pattern.test(input)) {
        errors.push('Input contains potential XSS pattern');
      }
    }

    // Sanitize HTML by escaping dangerous characters
    const sanitized = input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined
    };
  }

  /**
   * Validate environment variable names
   */
  static validateEnvVar(name: string): ValidationResult {
    const errors: string[] = [];

    if (!name || typeof name !== 'string') {
      errors.push('Environment variable name must be a non-empty string');
      return { isValid: false, errors };
    }

    // Check for valid environment variable name pattern
    if (!/^[A-Z_][A-Z0-9_]*$/.test(name)) {
      errors.push('Environment variable name must contain only uppercase letters, numbers, and underscores');
    }

    // Check for reserved names
    const reserved = ['PATH', 'HOME', 'USER', 'SHELL', 'PWD'];
    if (reserved.includes(name)) {
      errors.push('Cannot override system environment variable');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? name : undefined
    };
  }

  /**
   * Validate port numbers
   */
  static validatePort(port: number | string): ValidationResult {
    const errors: string[] = [];
    const portNum = typeof port === 'string' ? parseInt(port, 10) : port;

    if (isNaN(portNum)) {
      errors.push('Port must be a valid number');
      return { isValid: false, errors };
    }

    if (portNum < 1 || portNum > 65535) {
      errors.push('Port must be between 1 and 65535');
    }

    // Check for privileged ports
    if (portNum < 1024) {
      errors.push('Privileged ports (below 1024) require special permissions');
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? portNum : undefined
    };
  }

  /**
   * Validate email addresses
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email || typeof email !== 'string') {
      errors.push('Email must be a non-empty string');
      return { isValid: false, errors };
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }

    // Check for dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(email)) {
        errors.push('Email contains dangerous characters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? email.toLowerCase().trim() : undefined
    };
  }

  /**
   * Generic input sanitization
   */
  static sanitizeInput(input: string, maxLength: number = 1000): ValidationResult {
    const errors: string[] = [];

    if (typeof input !== 'string') {
      errors.push('Input must be a string');
      return { isValid: false, errors };
    }

    // Check length
    if (input.length > maxLength) {
      errors.push(`Input exceeds maximum length of ${maxLength} characters`);
    }

    // Remove control characters
    const sanitized = input.replace(/[\x00-\x1f\x7f]/g, '');

    // Check for remaining dangerous patterns
    for (const pattern of this.DANGEROUS_PATTERNS) {
      if (pattern.test(sanitized)) {
        errors.push('Input contains potentially dangerous patterns');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : undefined
    };
  }
}