---
name: security-review
type: agentwise-command
description: Perform security review of the project
---

# Security Review Command

Performs a comprehensive security review of the Agentwise project or workspace projects.

## Usage

```
/security-review [project-name]
```

## What it does

1. **Code Security Scan**
   - Checks for hardcoded credentials
   - Identifies potential SQL injection vulnerabilities
   - Detects insecure dependencies
   - Reviews authentication implementations

2. **Dependency Audit**
   - Runs npm audit for known vulnerabilities
   - Checks for outdated packages
   - Identifies packages with security advisories

3. **File Permission Check**
   - Ensures sensitive files have proper permissions
   - Verifies .env files are gitignored
   - Checks for exposed API keys or secrets

4. **Git Security**
   - Reviews commit history for accidentally committed secrets
   - Verifies branch protection settings
   - Checks .gitignore configuration

5. **Validation Results**
   - Uses CodeValidator to check for phantom code
   - Uses HallucinationDetector to verify agent outputs
   - Ensures no placeholder implementations

## Security Checklist

The command checks for:

- [ ] No hardcoded passwords or API keys
- [ ] Environment variables properly configured
- [ ] Dependencies up to date and secure
- [ ] Input validation on all user inputs
- [ ] Proper error handling without exposing internals
- [ ] Secure communication (HTTPS/TLS)
- [ ] Rate limiting implemented
- [ ] Authentication and authorization properly implemented
- [ ] No sensitive data in logs
- [ ] Proper data encryption for sensitive information

## Output

The command generates a security report with:
- **Critical Issues**: Must be fixed immediately
- **High Priority**: Should be fixed soon
- **Medium Priority**: Plan to fix
- **Low Priority**: Good to fix
- **Passed Checks**: Security measures in place

## Examples

```bash
# Review entire Agentwise project
/security-review

# Review specific workspace project
/security-review dashboard-app

# Review with detailed output
/security-review --verbose
```

## Implementation

The security review uses:
- `CodeValidator` for code quality checks
- `HallucinationDetector` for AI output validation
- Standard security scanning tools
- Git history analysis
- Dependency vulnerability databases