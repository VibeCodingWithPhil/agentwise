# Security Policy

## 🔒 Repository Protection

This repository is protected against malicious contributions through multiple layers of security:

### 1. Branch Protection Rules
- **Main branch is protected**: No direct pushes allowed
- **Pull requests required**: All changes must go through PR review
- **Code owner reviews**: Critical files require owner approval
- **No force pushes**: History cannot be rewritten
- **No deletions**: Branch cannot be deleted

### 2. CODEOWNERS File
Protected directories and files that require owner approval:
- `/.github/` - All GitHub configurations
- `/src/core/` - Core system files
- `/src/orchestrator/` - Critical orchestration logic
- `/.claude/` - Agent configurations
- `/config/` - System configurations
- Root configuration files

### 3. Automated Security Checks
- Dependency vulnerability scanning
- Code security analysis
- Sensitive data detection
- Large file deletion prevention

## 🚨 Reporting Security Vulnerabilities

### Do NOT:
- Create public GitHub issues for security vulnerabilities
- Share vulnerability details in discussions or comments
- Attempt to exploit vulnerabilities

### Do:
1. **Email privately**: vibephilcoding@gmail.com
2. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. **Wait for response**: We'll acknowledge within 48 hours

## 🛡️ Security Best Practices for Contributors

### Never Commit:
- API keys or tokens
- Passwords or credentials
- Private keys or certificates
- `.env` files with real values
- Personal information
- Internal URLs or endpoints

### Always:
- Review your code for sensitive data before committing
- Use environment variables for configuration
- Keep dependencies up to date
- Report suspicious code or behavior
- Follow secure coding practices

## 🔍 What We Monitor

### Automated Detection:
- **File deletions**: Large-scale file removals are flagged
- **Dependency changes**: New or modified dependencies are reviewed
- **Permission changes**: File permission modifications are tracked
- **Binary files**: Binary additions are scrutinized
- **External calls**: Network requests to external services

### Manual Review Focus:
- Changes to security-related code
- Modifications to validation logic
- Updates to authentication/authorization
- Changes to data handling
- Modifications to build or deploy scripts

## ⚠️ Suspicious Activity Indicators

The following patterns may indicate malicious intent:

### High Risk:
- Deleting multiple core files
- Adding obfuscated or minified code
- Modifying security validations
- Adding suspicious dependencies
- Changing GitHub Actions workflows
- Attempting to modify CODEOWNERS

### Medium Risk:
- Large binary file additions
- Extensive permission changes
- Adding external scripts
- Modifying build processes
- Changing test configurations

### Automatic Rejection:
- PRs that delete >30% of codebase
- PRs with detected malware patterns
- PRs with known vulnerable dependencies
- PRs attempting to bypass protections

## 📋 Security Checklist for Maintainers

Before merging any PR:
- [ ] No sensitive data exposed
- [ ] No suspicious dependencies added
- [ ] No security features disabled
- [ ] No unexplained large deletions
- [ ] All tests pass
- [ ] Code review completed
- [ ] No obfuscated code
- [ ] Changes align with PR description

## 🔐 Access Control

### Repository Permissions:
- **Owner**: Full access (VibeCodingWithPhil)
- **Maintainers**: Write access with restrictions
- **Contributors**: Fork and PR only
- **Public**: Read-only access

### Protected Resources:
- Production deployments
- Security configurations
- CI/CD pipelines
- Secret management
- Database access

## 📊 Security Metrics

We track:
- Time to patch vulnerabilities
- Number of security issues found
- PR rejection rate for security reasons
- Dependency update frequency
- Security training completion

## 🚀 Incident Response

If a security incident occurs:

1. **Immediate Actions**:
   - Revert malicious changes
   - Lock affected branches
   - Disable compromised access
   - Document the incident

2. **Investigation**:
   - Identify scope of impact
   - Determine root cause
   - Collect evidence
   - Review logs

3. **Recovery**:
   - Fix vulnerabilities
   - Restore from backups if needed
   - Update security measures
   - Communicate with affected users

4. **Post-Incident**:
   - Conduct review meeting
   - Update security policies
   - Implement preventive measures
   - Share lessons learned

## 📚 Resources

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## 🔍 Recent Security Audits

### January 29, 2025 - Comprehensive Security Hardening

**Complete security audit and remediation completed:**

#### Critical Issues Fixed:
- ✅ **Command Injection Prevention** - Replaced all shell command executions with secure Node.js methods (ImportHandler.ts)
- ✅ **Path Traversal Protection** - Added comprehensive path validation to prevent directory traversal attacks (MonitorCommand.ts, GlobalMonitorInstaller.ts)
- ✅ **Process Spawning Security** - Secured all subprocess executions with proper validation and containment (index.ts)
- ✅ **Network Security Hardening** - CORS configuration now restricted to local origins only (SharedContextServer.ts)
- ✅ **Input Validation Framework** - Implemented comprehensive input sanitization system (InputValidator.ts)

#### Previously Fixed (Earlier Audit):
- ✅ **Removed unauthorized HTTP-Referer headers** from OpenRouter API calls (src/models/LocalModelSupport.ts)
- ✅ **No backdoors or unauthorized network calls detected** in comprehensive codebase scan
- ✅ **All background services verified** to operate locally only (localhost:3001-3003)
- ✅ **Analytics confirmed local-only** - no external data transmission

### Security Improvements Implemented:

#### Input Validation (NEW)
- Comprehensive InputValidator class with pattern matching
- SQL injection prevention
- XSS attack prevention
- Path injection blocking
- Command injection prevention
- Dangerous pattern detection

#### Process Security (NEW)
- All exec() calls replaced with secure alternatives
- Process spawning now uses validation and timeouts
- Working directory containment enforced
- Script execution validation before running

#### File System Security (NEW)
- Path traversal prevention in all file operations
- Symbolic link detection and blocking
- Project boundary enforcement
- Safe file permission management

### Audit Scope:
- Complete network call analysis across entire codebase
- Background service and process verification
- Command execution security review
- Path validation implementation
- Input sanitization framework
- CORS and network configuration
- File system access permission validation

### Transparency Commitment:
- All network calls documented and legitimate
- Local-only monitoring services (ports 3001-3003)
- Optional analytics stored locally in `~/.agentwise/analytics/`
- No data transmission to external servers
- Complete source code available for inspection
- All security fixes documented in commits

**Status: ✅ SECURE** - All critical and high-severity issues resolved.

## ✉️ Contact

- **Security Issues**: vibephilcoding@gmail.com
- **General Questions**: Use GitHub Discussions
- **Urgent**: Create private security advisory

---

**Remember**: Security is everyone's responsibility. When in doubt, ask!