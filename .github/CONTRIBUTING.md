# Contributing to Agentwise

Thank you for your interest in contributing to Agentwise! This document provides guidelines and instructions for contributing to the project.

## 🛡️ Security First

**IMPORTANT**: This repository has strict security measures in place to prevent malicious contributions that could overwrite or damage the codebase.

### Protected Files and Directories
The following areas require owner approval for any changes:
- `/.github/` - GitHub configuration and workflows
- `/src/core/` - Core system functionality
- `/src/orchestrator/` - Agent orchestration logic
- `/.claude/` - Claude-specific configurations
- `/config/` - System configuration files
- All root configuration files (`package.json`, `tsconfig.json`, etc.)

## 📋 Contribution Process

### 1. Fork the Repository
- Fork the repository to your GitHub account
- Clone your fork locally
```bash
git clone https://github.com/YOUR-USERNAME/agentwise.git
cd agentwise
```

### 2. Create a Branch
- Create a new branch for your feature or fix
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Make Your Changes
- Follow the existing code style and conventions
- Add tests for new functionality
- Update documentation as needed
- Ensure no sensitive information is included

### 4. Test Your Changes
```bash
npm install
npm run lint
npm run typecheck
npm test
```

### 5. Commit Your Changes
- Use clear, descriptive commit messages
- Follow conventional commit format:
```
feat: Add new feature
fix: Fix bug in component
docs: Update documentation
style: Format code
refactor: Refactor existing code
test: Add tests
chore: Update dependencies
```

### 6. Push and Create Pull Request
```bash
git push origin feature/your-feature-name
```
- Create a pull request from your fork to the main repository
- Fill out the pull request template completely
- Wait for code review

## 🚫 What NOT to Do

### Never:
- Force push to main branch (it's protected)
- Commit directly to main branch
- Include API keys, tokens, or passwords
- Make massive file deletions without discussion
- Modify core security features
- Bypass pull request requirements

### Red Flags That Will Get Your PR Rejected:
- Deleting large portions of code without explanation
- Adding suspicious dependencies
- Modifying security validations
- Changing GitHub Actions without justification
- Attempting to modify CODEOWNERS file
- Including obfuscated or minified code
- Adding external scripts or trackers

## ✅ What We're Looking For

### Good Contributions:
- Bug fixes with clear explanations
- New features that align with project goals
- Performance improvements with benchmarks
- Documentation improvements
- Test coverage increases
- Security enhancements
- Code refactoring that improves maintainability

## 📝 Code Style Guidelines

### TypeScript
- Use TypeScript for all new code
- Define proper types and interfaces
- Avoid `any` types unless absolutely necessary
- Use async/await over callbacks

### File Structure
```typescript
// Good structure example
import { necessary, imports } from 'modules';

interface ClearInterface {
    property: string;
    method(): void;
}

export class WellNamedClass {
    // Implementation
}
```

### Naming Conventions
- Classes: PascalCase (`MyClass`)
- Functions/Methods: camelCase (`myFunction`)
- Constants: UPPER_SNAKE_CASE (`MY_CONSTANT`)
- Files: kebab-case (`my-file.ts`)

## 🔍 Review Process

### What Happens After You Submit a PR:

1. **Automated Checks**: Your PR will run through automated tests
2. **Code Review**: Maintainers will review your code for:
   - Security issues
   - Code quality
   - Alignment with project goals
   - Potential impacts on existing functionality
3. **Feedback**: You may receive feedback requesting changes
4. **Approval**: Once approved, your PR will be merged

### Review Criteria:
- [ ] No security vulnerabilities
- [ ] Follows code style guidelines
- [ ] Includes appropriate tests
- [ ] Documentation is updated
- [ ] No breaking changes (unless discussed)
- [ ] Performance impact is acceptable

## 🐛 Reporting Issues

### Security Issues
**DO NOT** create public issues for security vulnerabilities. Instead:
- Email: vibephilcoding@gmail.com
- Use GitHub's security advisory feature

### Bug Reports
Include:
- Clear description of the issue
- Steps to reproduce
- Expected behavior
- Actual behavior
- System information
- Error messages/logs

### Feature Requests
Include:
- Clear description of the feature
- Use case and benefits
- Potential implementation approach
- Any mockups or examples

## 💡 Getting Help

- Check existing issues and discussions
- Read the documentation thoroughly
- Ask questions in discussions (not issues)
- Be respectful and patient

## 📜 License

By contributing to Agentwise, you agree that your contributions will be licensed under the project's custom commercial license.

## 🙏 Thank You!

Your contributions help make Agentwise better for everyone. We appreciate your time and effort in improving the project!

---

**Remember**: Quality over quantity. A single well-thought-out contribution is worth more than many hasty ones.