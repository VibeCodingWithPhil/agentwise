# Changelog

All notable changes to Agentwise will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security
- **FIXED**: Removed unauthorized HTTP-Referer headers from OpenRouter API calls in LocalModelSupport.ts
- **AUDIT**: Completed comprehensive security audit in response to user concerns
- **VERIFIED**: No backdoors, unauthorized network calls, or remote access mechanisms found
- **CONFIRMED**: All background services operate locally only (localhost:3001-3002)
- **VALIDATED**: Analytics data stored locally only with no external transmission

### Changed
- Updated security documentation with audit findings and transparency information
- Clarified token optimization claims to be more accurate about context sharing benefits
- Improved documentation accuracy around performance metrics

### Documentation
- Added security audit results to README.md and SECURITY.md
- Enhanced transparency around local-only operation and analytics
- Updated project description to be more accurate about capabilities

## [1.0.0] - 2025-01-29

### Added
- Context 3.0: Dual-context system combining AGENTS.md (OpenAI spec) with CodebaseContextManager
- Real-time codebase analysis with file watching and automatic updates
- Project structure validation and auto-fixing
- Comprehensive MCP integration with 25+ verified servers
- Multi-agent orchestration with parallel task execution
- Local model support (Ollama, LM Studio, OpenRouter)
- Smart model routing and automatic selection
- Visual testing integration with Playwright MCP
- Real-time monitoring dashboard with WebSocket connectivity
- Document upload system (PDF, Word, Figma)
- Website cloning with Firecrawl MCP integration
- Figma Dev Mode integration
- Security hardening and audit systems

### Security
- Implemented comprehensive security validation pipeline
- Added local-only analytics with opt-out capability
- Established secure token management
- Created isolated project environments
- Implemented permission checking and access control

### Performance
- Context sharing optimization reduces token multiplication (5 agents use ~3x tokens instead of 5x)
- Real-time file watching with incremental updates
- Efficient agent coordination and task distribution
- Smart caching and context management

### Documentation
- Complete documentation site at https://agentwise-docs.vercel.app
- Comprehensive API documentation
- Agent development guides
- Security policies and best practices
- Dual licensing model (Apache 2.0 + Commercial)