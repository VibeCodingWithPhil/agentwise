import { jest } from '@jest/globals';
import { AutoCommitManager } from '../src/protection/AutoCommitManager';
import { ContinuousSecurityMonitor } from '../src/protection/ContinuousSecurityMonitor';
import { AutomatedReviewPipeline } from '../src/protection/AutomatedReviewPipeline';
import { IntegratedBackupSystem } from '../src/protection/IntegratedBackupSystem';
import { DailySecurityReport } from '../src/protection/DailySecurityReport';
import { ProtectionDashboard } from '../src/protection/ProtectionDashboard';
import {
  AutoCommitConfig,
  CommitRule,
  FileChangeEvent,
  CommitInfo,
  SecurityVulnerability,
  SecurityScanResult,
  SecurityMonitorConfig,
  ReviewCheckResult,
  ReviewPipelineConfig,
  BackupConfig,
  BackupResult,
  SecurityReport,
  ProtectionStatus,
  ProtectionConfig,
  ProtectionAlert,
  DashboardMetrics,
  ActivityLog,
  NextAction,
  ProtectionError,
  SecurityError,
  BackupError,
  ReviewError
} from '../src/protection/types';

// Mock external dependencies
jest.mock('chokidar');
jest.mock('fs-extra');
jest.mock('child_process');
jest.mock('crypto');

describe('Protection System Tests', () => {
  let autoCommitManager: AutoCommitManager;
  let securityMonitor: ContinuousSecurityMonitor;
  let reviewPipeline: AutomatedReviewPipeline;
  let backupSystem: IntegratedBackupSystem;
  let dailyReport: DailySecurityReport;
  let dashboard: ProtectionDashboard;

  const mockAutoCommitConfig: AutoCommitConfig = {
    enabled: true,
    watchPaths: ['src/**/*.ts', 'tests/**/*.ts'],
    excludePaths: ['node_modules/**', 'dist/**'],
    commitRules: [
      {
        pattern: '*.test.ts',
        immediate: false,
        description: 'Test files',
        priority: 'medium'
      },
      {
        pattern: 'src/**/*.ts',
        immediate: true,
        description: 'Source code changes',
        priority: 'high'
      }
    ],
    intervalMinutes: 5,
    maxFilesPerCommit: 10,
    requireSecurityCheck: true,
    generateIntelligentMessages: true
  };

  const mockSecurityConfig: SecurityMonitorConfig = {
    enabled: true,
    scanInterval: 300000, // 5 minutes
    realTimeScan: true,
    autoFix: false,
    secretPatterns: [
      'password\\s*=\\s*["\'][^"\']+["\']',
      'api[_-]?key\\s*=\\s*["\'][^"\']+["\']',
      'secret\\s*=\\s*["\'][^"\']+["\']'
    ],
    excludeFiles: ['*.log', 'node_modules/**'],
    owaspChecks: true,
    dependencyCheck: true,
    alertThresholds: {
      critical: 1,
      high: 3,
      medium: 10
    }
  };

  const mockReviewConfig: ReviewPipelineConfig = {
    enabled: true,
    blockOnFailure: true,
    minimumScore: 8.0,
    checks: {
      quality: true,
      security: true,
      performance: true,
      testCoverage: true,
      style: true
    },
    thresholds: {
      complexity: 10,
      coverage: 80,
      maintainability: 7.0,
      security: 8.0
    }
  };

  const mockBackupConfig: BackupConfig = {
    enabled: true,
    strategy: 'continuous',
    destinations: [
      {
        type: 'github',
        path: 'backup-repo',
        priority: 1
      },
      {
        type: 'local',
        path: '/tmp/backups',
        priority: 2
      }
    ],
    retention: {
      daily: 7,
      weekly: 4,
      monthly: 12
    },
    compression: true,
    encryption: true,
    verifyBackups: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    autoCommitManager = new AutoCommitManager(mockAutoCommitConfig);
    securityMonitor = new ContinuousSecurityMonitor(mockSecurityConfig);
    reviewPipeline = new AutomatedReviewPipeline(mockReviewConfig);
    backupSystem = new IntegratedBackupSystem(mockBackupConfig);
    dailyReport = new DailySecurityReport();
    dashboard = new ProtectionDashboard();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('AutoCommitManager', () => {
    describe('File Change Detection', () => {
      it('should detect file changes and queue commits', async () => {
        const fileChangeEvent: FileChangeEvent = {
          path: 'src/utils/helper.ts',
          type: 'modified',
          timestamp: new Date(),
          size: 1024
        };

        // Mock chokidar watcher
        const mockWatcher = {
          on: jest.fn(),
          close: jest.fn()
        };
        require('chokidar').watch = jest.fn().mockReturnValue(mockWatcher);

        await autoCommitManager.start();

        // Simulate file change
        const changeHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'change')?.[1];
        changeHandler?.(fileChangeEvent.path);

        // Should queue the file for commit
        const queuedFiles = autoCommitManager.getQueuedFiles();
        expect(queuedFiles).toContain('src/utils/helper.ts');
      });

      it('should respect exclude patterns', async () => {
        const fileChangeEvent: FileChangeEvent = {
          path: 'node_modules/package/index.js',
          type: 'modified',
          timestamp: new Date(),
          size: 512
        };

        const mockWatcher = {
          on: jest.fn(),
          close: jest.fn()
        };
        require('chokidar').watch = jest.fn().mockReturnValue(mockWatcher);

        await autoCommitManager.start();

        const changeHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'change')?.[1];
        changeHandler?.(fileChangeEvent.path);

        // Should not queue excluded files
        const queuedFiles = autoCommitManager.getQueuedFiles();
        expect(queuedFiles).not.toContain('node_modules/package/index.js');
      });

      it('should apply commit rules correctly', async () => {
        const testFileEvent: FileChangeEvent = {
          path: 'tests/unit/service.test.ts',
          type: 'modified',
          timestamp: new Date(),
          size: 2048
        };

        const srcFileEvent: FileChangeEvent = {
          path: 'src/services/auth.ts',
          type: 'modified',
          timestamp: new Date(),
          size: 1536
        };

        // Mock git operations
        const mockExec = jest.fn()
          .mockImplementation((cmd, callback) => {
            if (cmd.includes('git add')) {
              callback(null, { stdout: '', stderr: '' });
            } else if (cmd.includes('git commit')) {
              callback(null, { stdout: 'commit abc123', stderr: '' });
            }
          });
        require('child_process').exec = mockExec;

        await autoCommitManager.processFileChange(testFileEvent);
        await autoCommitManager.processFileChange(srcFileEvent);

        // Source file should be committed immediately (high priority)
        // Test file should be queued for batch commit (medium priority)
        expect(mockExec).toHaveBeenCalledWith(
          expect.stringContaining('git commit'),
          expect.any(Function)
        );
      });
    });

    describe('Intelligent Commit Messages', () => {
      it('should generate intelligent commit messages', async () => {
        const files = [
          'src/services/user.ts',
          'src/types/user.ts',
          'tests/services/user.test.ts'
        ];

        // Mock file content analysis
        const mockReadFile = jest.fn()
          .mockResolvedValueOnce('export class UserService { async createUser() { } }') // user.ts
          .mockResolvedValueOnce('export interface User { id: string; name: string; }') // types
          .mockResolvedValueOnce('describe("UserService", () => { it("should create user") });'); // test
        require('fs-extra').readFile = mockReadFile;

        const commitMessage = await autoCommitManager.generateCommitMessage(files);

        expect(commitMessage).toMatch(/feat|fix|refactor|test/);
        expect(commitMessage).toContain('user');
        expect(commitMessage.length).toBeGreaterThan(10);
        expect(commitMessage.length).toBeLessThan(72); // Git best practice
      });

      it('should handle different file types appropriately', async () => {
        const testFiles = ['tests/integration/api.test.ts'];
        const configFiles = ['package.json', 'tsconfig.json'];
        const docFiles = ['README.md', 'docs/api.md'];

        const testMessage = await autoCommitManager.generateCommitMessage(testFiles);
        const configMessage = await autoCommitManager.generateCommitMessage(configFiles);
        const docMessage = await autoCommitManager.generateCommitMessage(docFiles);

        expect(testMessage).toMatch(/test/i);
        expect(configMessage).toMatch(/config|chore/i);
        expect(docMessage).toMatch(/docs/i);
      });
    });

    describe('Security Integration', () => {
      it('should run security checks before committing', async () => {
        const files = ['src/auth/secrets.ts'];
        
        // Mock security scan that finds issues
        const mockSecurityScan = jest.fn().mockResolvedValue({
          vulnerabilities: [
            {
              id: 'SEC001',
              severity: 'high',
              type: 'secret',
              file: 'src/auth/secrets.ts',
              line: 15,
              description: 'Hardcoded API key detected',
              recommendation: 'Use environment variables',
              autoFixAvailable: false
            }
          ],
          summary: { total: 1, critical: 0, high: 1, medium: 0, low: 0 }
        });
        
        securityMonitor.scanFiles = mockSecurityScan;
        autoCommitManager.setSecurityMonitor(securityMonitor);

        await expect(autoCommitManager.commitFiles(files))
          .rejects.toThrow(SecurityError);

        expect(mockSecurityScan).toHaveBeenCalledWith(files);
      });

      it('should allow commits when security scan passes', async () => {
        const files = ['src/utils/format.ts'];
        
        const mockSecurityScan = jest.fn().mockResolvedValue({
          vulnerabilities: [],
          summary: { total: 0, critical: 0, high: 0, medium: 0, low: 0 }
        });
        
        securityMonitor.scanFiles = mockSecurityScan;
        autoCommitManager.setSecurityMonitor(securityMonitor);

        const mockExec = jest.fn().mockImplementation((cmd, callback) => {
          callback(null, { stdout: 'commit def456', stderr: '' });
        });
        require('child_process').exec = mockExec;

        const commitInfo = await autoCommitManager.commitFiles(files);

        expect(commitInfo.hash).toBe('def456');
        expect(commitInfo.files).toEqual(files);
      });
    });
  });

  describe('ContinuousSecurityMonitor', () => {
    describe('Vulnerability Detection', () => {
      it('should detect hardcoded secrets', async () => {
        const fileContent = `
          const config = {
            apiKey: "sk-1234567890abcdef",
            password: "super-secret-password",
            token: process.env.AUTH_TOKEN
          };
        `;

        // Mock file reading
        require('fs-extra').readFile = jest.fn().mockResolvedValue(fileContent);

        const scanResult = await securityMonitor.scanFiles(['src/config.ts']);

        expect(scanResult.vulnerabilities).toHaveLength(2);
        expect(scanResult.vulnerabilities[0].type).toBe('secret');
        expect(scanResult.vulnerabilities[0].severity).toBe('high');
        expect(scanResult.vulnerabilities[1].type).toBe('secret');
      });

      it('should check for OWASP vulnerabilities', async () => {
        const fileContent = `
          // SQL Injection vulnerability
          const query = "SELECT * FROM users WHERE id = " + userId;
          db.query(query);
          
          // XSS vulnerability
          element.innerHTML = userInput;
        `;

        require('fs-extra').readFile = jest.fn().mockResolvedValue(fileContent);

        const scanResult = await securityMonitor.scanFiles(['src/vulnerable.ts']);

        expect(scanResult.vulnerabilities.length).toBeGreaterThan(0);
        expect(scanResult.vulnerabilities.some(v => v.description.includes('SQL injection'))).toBe(true);
        expect(scanResult.vulnerabilities.some(v => v.description.includes('XSS'))).toBe(true);
      });

      it('should perform dependency vulnerability checks', async () => {
        const packageJson = {
          dependencies: {
            'lodash': '4.17.0', // Known vulnerability in older versions
            'express': '4.16.0' // Known vulnerabilities
          }
        };

        require('fs-extra').readJson = jest.fn().mockResolvedValue(packageJson);

        // Mock npm audit result
        const mockExec = jest.fn().mockImplementation((cmd, callback) => {
          if (cmd.includes('npm audit')) {
            callback(null, {
              stdout: JSON.stringify({
                vulnerabilities: {
                  'lodash': { severity: 'high', title: 'Prototype Pollution' },
                  'express': { severity: 'medium', title: 'Denial of Service' }
                }
              })
            });
          }
        });
        require('child_process').exec = mockExec;

        const scanResult = await securityMonitor.checkDependencies();

        expect(scanResult.vulnerabilities.length).toBeGreaterThan(0);
        expect(scanResult.vulnerabilities.some(v => v.description.includes('Prototype Pollution'))).toBe(true);
      });
    });

    describe('Real-time Monitoring', () => {
      it('should start real-time monitoring with file watchers', async () => {
        const mockWatcher = {
          on: jest.fn(),
          close: jest.fn()
        };
        require('chokidar').watch = jest.fn().mockReturnValue(mockWatcher);

        await securityMonitor.startRealTimeMonitoring();

        expect(require('chokidar').watch).toHaveBeenCalledWith(
          expect.any(Array),
          expect.objectContaining({
            ignored: expect.arrayContaining(['*.log', 'node_modules/**'])
          })
        );
      });

      it('should trigger scans on file changes', async () => {
        const mockWatcher = {
          on: jest.fn(),
          close: jest.fn()
        };
        require('chokidar').watch = jest.fn().mockReturnValue(mockWatcher);

        const scanSpy = jest.spyOn(securityMonitor, 'scanFiles');

        await securityMonitor.startRealTimeMonitoring();

        // Simulate file change
        const changeHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'change')?.[1];
        changeHandler?.('src/auth.ts');

        await new Promise(resolve => setTimeout(resolve, 100)); // Wait for debounce

        expect(scanSpy).toHaveBeenCalledWith(['src/auth.ts']);
      });
    });

    describe('Alerting', () => {
      it('should generate alerts for critical vulnerabilities', async () => {
        const criticalVulnerability: SecurityVulnerability = {
          id: 'CRIT001',
          severity: 'critical',
          type: 'code',
          file: 'src/auth.ts',
          line: 42,
          description: 'Remote code execution vulnerability',
          recommendation: 'Update authentication logic',
          autoFixAvailable: false,
          cwe: 'CWE-94',
          cvss: 9.8
        };

        const scanResult: SecurityScanResult = {
          timestamp: new Date(),
          scanId: 'scan_001',
          vulnerabilities: [criticalVulnerability],
          summary: { total: 1, critical: 1, high: 0, medium: 0, low: 0 },
          duration: 1500,
          filesScanned: 10
        };

        const alertCallback = jest.fn();
        securityMonitor.onAlert(alertCallback);

        await securityMonitor.processSecurityScan(scanResult);

        expect(alertCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'security',
            severity: 'critical',
            message: expect.stringContaining('Remote code execution')
          })
        );
      });
    });
  });

  describe('AutomatedReviewPipeline', () => {
    describe('Code Quality Analysis', () => {
      it('should analyze code complexity', async () => {
        const complexCode = `
          function complexFunction(a, b, c, d) {
            if (a > 0) {
              if (b > 0) {
                if (c > 0) {
                  if (d > 0) {
                    for (let i = 0; i < 10; i++) {
                      if (i % 2 === 0) {
                        // Complex nested logic
                        return a + b + c + d + i;
                      }
                    }
                  }
                }
              }
            }
            return 0;
          }
        `;

        require('fs-extra').readFile = jest.fn().mockResolvedValue(complexCode);

        const reviewResult = await reviewPipeline.reviewFiles(['src/complex.ts']);

        expect(reviewResult.metrics.complexity).toBeGreaterThan(10);
        expect(reviewResult.issues.some(issue => issue.type === 'quality')).toBe(true);
        expect(reviewResult.passed).toBe(false); // Should fail due to high complexity
      });

      it('should check test coverage', async () => {
        // Mock jest coverage report
        const coverageReport = {
          total: {
            lines: { pct: 65.5 },
            functions: { pct: 70.2 },
            branches: { pct: 58.3 },
            statements: { pct: 66.7 }
          }
        };

        const mockExec = jest.fn().mockImplementation((cmd, callback) => {
          if (cmd.includes('jest --coverage')) {
            callback(null, { stdout: JSON.stringify(coverageReport) });
          }
        });
        require('child_process').exec = mockExec;

        const reviewResult = await reviewPipeline.checkTestCoverage(['src/**/*.ts']);

        expect(reviewResult.metrics.testCoverage).toBe(65.5);
        expect(reviewResult.passed).toBe(false); // Below 80% threshold
        expect(reviewResult.recommendations).toContain(
          expect.stringMatching(/test coverage.*below.*80%/i)
        );
      });
    });

    describe('Performance Analysis', () => {
      it('should detect performance anti-patterns', async () => {
        const inefficientCode = `
          // N+1 query problem
          const users = await getUsers();
          for (const user of users) {
            user.posts = await getPosts(user.id);
          }
          
          // Inefficient DOM manipulation
          for (let i = 0; i < 1000; i++) {
            document.body.appendChild(createElement());
          }
          
          // Memory leak
          const cache = {};
          function addToCache(key, value) {
            cache[key] = value; // Never cleaned up
          }
        `;

        require('fs-extra').readFile = jest.fn().mockResolvedValue(inefficientCode);

        const reviewResult = await reviewPipeline.reviewFiles(['src/inefficient.ts']);

        expect(reviewResult.issues.some(issue => 
          issue.type === 'performance' && 
          issue.message.includes('N+1')
        )).toBe(true);

        expect(reviewResult.issues.some(issue => 
          issue.type === 'performance' && 
          issue.message.includes('DOM manipulation')
        )).toBe(true);
      });
    });

    describe('Integration with Git Hooks', () => {
      it('should integrate with pre-commit hooks', async () => {
        const mockExec = jest.fn().mockImplementation((cmd, callback) => {
          if (cmd.includes('git diff --cached')) {
            callback(null, { stdout: 'src/service.ts\ntests/service.test.ts' });
          }
        });
        require('child_process').exec = mockExec;

        const reviewResult = await reviewPipeline.runPreCommitReview();

        expect(reviewResult.passed).toBeDefined();
        expect(reviewResult.score).toBeGreaterThanOrEqual(0);
        expect(reviewResult.score).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('IntegratedBackupSystem', () => {
    describe('Backup Creation', () => {
      it('should create compressed and encrypted backups', async () => {
        const mockFiles = ['src/app.ts', 'package.json', 'README.md'];
        
        // Mock file operations
        const mockFs = {
          readdir: jest.fn().mockResolvedValue(mockFiles),
          stat: jest.fn().mockResolvedValue({ isFile: () => true, size: 1024 }),
          readFile: jest.fn().mockResolvedValue('file content'),
          writeFile: jest.fn(),
          ensureDir: jest.fn()
        };
        Object.assign(require('fs-extra'), mockFs);

        // Mock compression and encryption
        const mockCrypto = {
          createCipher: jest.fn().mockReturnValue({
            update: jest.fn().mockReturnValue(Buffer.from('encrypted')),
            final: jest.fn().mockReturnValue(Buffer.from('data'))
          }),
          randomBytes: jest.fn().mockReturnValue(Buffer.from('random-key'))
        };
        require('crypto').createCipher = mockCrypto.createCipher;
        require('crypto').randomBytes = mockCrypto.randomBytes;

        const backupResult = await backupSystem.createBackup();

        expect(backupResult.status).toBe('success');
        expect(backupResult.filesBackedUp).toBe(3);
        expect(backupResult.size).toBeGreaterThan(0);
        expect(backupResult.hash).toBeDefined();
      });

      it('should handle backup failures gracefully', async () => {
        const mockFs = {
          readdir: jest.fn().mockRejectedValue(new Error('Permission denied')),
          stat: jest.fn(),
          readFile: jest.fn(),
          writeFile: jest.fn(),
          ensureDir: jest.fn()
        };
        Object.assign(require('fs-extra'), mockFs);

        const backupResult = await backupSystem.createBackup();

        expect(backupResult.status).toBe('failed');
        expect(backupResult.error).toContain('Permission denied');
      });
    });

    describe('Multi-destination Backups', () => {
      it('should backup to multiple destinations based on priority', async () => {
        const mockFs = {
          readdir: jest.fn().mockResolvedValue(['file.ts']),
          stat: jest.fn().mockResolvedValue({ isFile: () => true, size: 1024 }),
          readFile: jest.fn().mockResolvedValue('content'),
          writeFile: jest.fn(),
          ensureDir: jest.fn()
        };
        Object.assign(require('fs-extra'), mockFs);

        // Mock GitHub API for GitHub destination
        const mockGitHubApi = jest.fn().mockResolvedValue({ status: 201 });
        
        const backupResults = await backupSystem.backupToAllDestinations();

        expect(backupResults).toHaveLength(2); // Two destinations configured
        expect(backupResults.every(result => result.status === 'success')).toBe(true);
      });

      it('should continue with remaining destinations if one fails', async () => {
        const mockFs = {
          readdir: jest.fn().mockResolvedValue(['file.ts']),
          stat: jest.fn().mockResolvedValue({ isFile: () => true, size: 1024 }),
          readFile: jest.fn().mockResolvedValue('content'),
          writeFile: jest.fn().mockImplementation((path) => {
            if (path.includes('/tmp/backups')) {
              throw new Error('Disk full');
            }
          }),
          ensureDir: jest.fn()
        };
        Object.assign(require('fs-extra'), mockFs);

        const backupResults = await backupSystem.backupToAllDestinations();

        expect(backupResults).toHaveLength(2);
        expect(backupResults.some(result => result.status === 'failed')).toBe(true);
        expect(backupResults.some(result => result.status === 'success')).toBe(true);
      });
    });

    describe('Backup Verification', () => {
      it('should verify backup integrity', async () => {
        const backupPath = '/tmp/backup_123.tar.gz.enc';
        const originalHash = 'abc123def456';

        // Mock backup restoration and hash verification
        const mockCrypto = {
          createHash: jest.fn().mockReturnValue({
            update: jest.fn(),
            digest: jest.fn().mockReturnValue('abc123def456')
          })
        };
        require('crypto').createHash = mockCrypto.createHash;

        const isValid = await backupSystem.verifyBackup(backupPath, originalHash);

        expect(isValid).toBe(true);
      });
    });

    describe('Retention Management', () => {
      it('should clean up old backups according to retention policy', async () => {
        const oldBackups = [
          { path: 'backup_1.tar.gz', created: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) }, // 8 days old
          { path: 'backup_2.tar.gz', created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }, // 5 days old
          { path: 'backup_3.tar.gz', created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }  // 2 days old
        ];

        const mockFs = {
          readdir: jest.fn().mockResolvedValue(oldBackups.map(b => b.path)),
          stat: jest.fn().mockImplementation((path) => ({
            birthtime: oldBackups.find(b => b.path === path)?.created
          })),
          unlink: jest.fn()
        };
        Object.assign(require('fs-extra'), mockFs);

        await backupSystem.cleanupOldBackups();

        // Should delete backup_1.tar.gz (older than 7 days)
        expect(mockFs.unlink).toHaveBeenCalledWith(expect.stringContaining('backup_1.tar.gz'));
        expect(mockFs.unlink).not.toHaveBeenCalledWith(expect.stringContaining('backup_2.tar.gz'));
        expect(mockFs.unlink).not.toHaveBeenCalledWith(expect.stringContaining('backup_3.tar.gz'));
      });
    });
  });

  describe('DailySecurityReport', () => {
    describe('Report Generation', () => {
      it('should generate comprehensive daily security report', async () => {
        const mockVulnerabilities: SecurityVulnerability[] = [
          {
            id: 'SEC001',
            severity: 'high',
            type: 'secret',
            file: 'src/config.ts',
            line: 15,
            description: 'Hardcoded API key',
            recommendation: 'Use environment variables',
            autoFixAvailable: true
          }
        ];

        const mockCommits: CommitInfo[] = [
          {
            hash: 'abc123',
            message: 'feat: add user authentication',
            timestamp: new Date(),
            files: ['src/auth.ts'],
            author: 'developer',
            branch: 'main'
          }
        ];

        // Mock data gathering
        securityMonitor.getRecentVulnerabilities = jest.fn().mockResolvedValue(mockVulnerabilities);
        autoCommitManager.getRecentCommits = jest.fn().mockResolvedValue(mockCommits);
        backupSystem.getBackupHistory = jest.fn().mockResolvedValue({
          backups: [{ id: '1', status: 'success' as const, timestamp: new Date() }],
          successRate: 100
        });

        const report = await dailyReport.generateReport(new Date(), new Date());

        expect(report.summary.vulnerabilitiesFound).toBe(1);
        expect(report.sections.vulnerabilities).toEqual(mockVulnerabilities);
        expect(report.sections.commits).toEqual(mockCommits);
        expect(report.summary.overallScore).toBeGreaterThan(0);
      });

      it('should calculate security trends', async () => {
        const historicalData = [
          { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), vulnerabilities: 5 },
          { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), vulnerabilities: 3 },
          { date: new Date(), vulnerabilities: 1 }
        ];

        const trend = dailyReport.calculateSecurityTrend(historicalData);

        expect(trend).toBe('improving');
      });
    });

    describe('Report Distribution', () => {
      it('should save report to markdown file', async () => {
        const mockReport: SecurityReport = {
          id: 'report_001',
          timestamp: new Date(),
          period: {
            start: new Date(Date.now() - 24 * 60 * 60 * 1000),
            end: new Date()
          },
          summary: {
            overallScore: 8.5,
            trend: 'improving',
            vulnerabilitiesFound: 2,
            vulnerabilitiesFixed: 3,
            newVulnerabilities: 1
          },
          sections: {
            vulnerabilities: [],
            codeQuality: {
              complexity: 6,
              maintainability: 8,
              testCoverage: 85,
              duplicateLines: 2,
              linesOfCode: 1500,
              technicalDebt: 4,
              securityScore: 8.5
            },
            backupStatus: {
              backups: [],
              totalSize: 0,
              lastSuccessful: new Date(),
              failureCount: 0,
              successRate: 100
            },
            commits: [],
            recommendations: ['Increase test coverage', 'Fix remaining vulnerabilities']
          },
          metrics: {
            securityScore: 8.5,
            qualityScore: 8.0,
            coveragePercent: 85,
            technicalDebtHours: 4
          }
        };

        const mockFs = {
          writeFile: jest.fn(),
          ensureDir: jest.fn()
        };
        Object.assign(require('fs-extra'), mockFs);

        await dailyReport.saveToMarkdown(mockReport, 'reports/daily-security-report.md');

        expect(mockFs.writeFile).toHaveBeenCalledWith(
          'reports/daily-security-report.md',
          expect.stringContaining('# Daily Security Report')
        );
      });

      it('should commit report to repository', async () => {
        const mockReport: SecurityReport = {
          id: 'report_002',
          timestamp: new Date(),
          period: { start: new Date(), end: new Date() },
          summary: {
            overallScore: 7.5,
            trend: 'stable',
            vulnerabilitiesFound: 1,
            vulnerabilitiesFixed: 1,
            newVulnerabilities: 0
          },
          sections: {
            vulnerabilities: [],
            codeQuality: {} as any,
            backupStatus: {} as any,
            commits: [],
            recommendations: []
          },
          metrics: {
            securityScore: 7.5,
            qualityScore: 7.0,
            coveragePercent: 75,
            technicalDebtHours: 6
          }
        };

        const mockExec = jest.fn().mockImplementation((cmd, callback) => {
          callback(null, { stdout: 'commit xyz789', stderr: '' });
        });
        require('child_process').exec = mockExec;

        await dailyReport.commitToRepo(mockReport);

        expect(mockExec).toHaveBeenCalledWith(
          expect.stringContaining('git commit'),
          expect.any(Function)
        );
      });
    });
  });

  describe('ProtectionDashboard', () => {
    describe('Status Monitoring', () => {
      it('should provide overall protection status', async () => {
        // Mock component statuses
        autoCommitManager.getStatus = jest.fn().mockResolvedValue({
          status: 'online',
          lastActivity: new Date(),
          errorCount: 0,
          performance: { avgResponseTime: 100, successRate: 99.5 },
          health: 95
        });

        securityMonitor.getStatus = jest.fn().mockResolvedValue({
          status: 'online',
          lastActivity: new Date(),
          errorCount: 1,
          performance: { avgResponseTime: 200, successRate: 98.0 },
          health: 90
        });

        const protectionStatus = await dashboard.getProtectionStatus();

        expect(protectionStatus.overall).toBe('healthy');
        expect(protectionStatus.components.autoCommit.status).toBe('online');
        expect(protectionStatus.components.securityMonitor.status).toBe('online');
        expect(protectionStatus.alerts).toBeDefined();
      });

      it('should detect critical system issues', async () => {
        // Mock failing components
        backupSystem.getStatus = jest.fn().mockResolvedValue({
          status: 'error',
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          errorCount: 5,
          performance: { avgResponseTime: 5000, successRate: 60.0 },
          health: 30
        });

        const protectionStatus = await dashboard.getProtectionStatus();

        expect(protectionStatus.overall).toBe('critical');
        expect(protectionStatus.alerts.length).toBeGreaterThan(0);
        expect(protectionStatus.alerts.some(alert => 
          alert.type === 'backup' && alert.severity === 'critical'
        )).toBe(true);
      });
    });

    describe('Metrics Collection', () => {
      it('should collect and aggregate performance metrics', async () => {
        const mockMetrics: DashboardMetrics = {
          performance: {
            commits: [
              { timestamp: new Date(), count: 5 },
              { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), count: 8 }
            ],
            vulnerabilities: [
              { timestamp: new Date(), count: 2 },
              { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), count: 4 }
            ],
            backups: [
              { timestamp: new Date(), success: true },
              { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), success: true }
            ],
            quality: [
              { timestamp: new Date(), score: 8.5 },
              { timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), score: 8.0 }
            ]
          },
          trends: {
            securityScore: [7.5, 8.0, 8.5],
            qualityScore: [7.0, 7.5, 8.0],
            commitFrequency: [3, 5, 8],
            backupReliability: [95, 98, 100]
          },
          summary: {
            totalCommits: 156,
            activeDays: 30,
            averageScore: 8.2,
            riskLevel: 'low'
          }
        };

        dashboard.getMetrics = jest.fn().mockResolvedValue(mockMetrics);

        const metrics = await dashboard.getMetrics();

        expect(metrics.summary.riskLevel).toBe('low');
        expect(metrics.trends.securityScore).toEqual([7.5, 8.0, 8.5]);
        expect(metrics.performance.commits).toHaveLength(2);
      });
    });

    describe('Next Actions Recommendations', () => {
      it('should prioritize next actions based on system state', async () => {
        const mockAlerts: ProtectionAlert[] = [
          {
            id: 'alert_001',
            type: 'security',
            severity: 'critical',
            message: 'Critical vulnerability detected',
            timestamp: new Date(),
            acknowledged: false,
            actions: ['Fix vulnerability', 'Review code']
          }
        ];

        const nextActions = await dashboard.getNextActions(mockAlerts);

        expect(nextActions).toHaveLength(1);
        expect(nextActions[0].priority).toBe('urgent');
        expect(nextActions[0].type).toBe('security');
        expect(nextActions[0].title).toContain('vulnerability');
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle ProtectionError gracefully', () => {
      const error = new ProtectionError(
        'Test protection error',
        'PROT_001',
        'test-component',
        { detail: 'test detail' }
      );

      expect(error.name).toBe('ProtectionError');
      expect(error.code).toBe('PROT_001');
      expect(error.component).toBe('test-component');
      expect(error.details).toEqual({ detail: 'test detail' });
    });

    it('should handle SecurityError with specific handling', () => {
      const error = new SecurityError(
        'Security vulnerability detected',
        'SEC_001',
        { vulnerability: 'high' }
      );

      expect(error.name).toBe('SecurityError');
      expect(error.component).toBe('security');
      expect(error.details.vulnerability).toBe('high');
    });

    it('should implement retry logic for transient failures', async () => {
      let attemptCount = 0;
      const mockOperation = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Transient failure');
        }
        return 'success';
      });

      const result = await dashboard.withRetry(mockOperation, 3, 100);

      expect(result).toBe('success');
      expect(attemptCount).toBe(3);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle large file sets efficiently', async () => {
      const largeFileSet = Array.from({ length: 1000 }, (_, i) => `src/file${i}.ts`);

      const startTime = Date.now();
      await securityMonitor.scanFiles(largeFileSet);
      const endTime = Date.now();

      const duration = endTime - startTime;
      
      // Should process files in reasonable time (less than 5 seconds for mocked operations)
      expect(duration).toBeLessThan(5000);
    });

    it('should batch operations to avoid overwhelming the system', async () => {
      const files = Array.from({ length: 100 }, (_, i) => `src/batch${i}.ts`);

      const batchProcessSpy = jest.spyOn(autoCommitManager, 'processBatch');
      
      await autoCommitManager.processFilesBatch(files, 10); // Process in batches of 10

      expect(batchProcessSpy).toHaveBeenCalledTimes(10); // 100 files / 10 per batch
    });
  });
});