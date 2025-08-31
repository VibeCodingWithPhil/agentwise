/**
 * Project Summary Generator
 * 
 * Creates comprehensive project summaries, shows what was configured,
 * provides next steps, generates markdown reports, and provides
 * actionable recommendations for project development.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  ProjectSummaryResult,
  WizardStepResults,
  UserPreferences,
  ProjectTimeline,
  TimelinePhase,
  TimelineMilestone,
  WizardAnalytics 
} from './types';
import { Requirements } from '../requirements/types';

interface SummaryGenerationOptions {
  projectName: string;
  projectPath: string;
  results: WizardStepResults;
  preferences: UserPreferences;
  analytics: {
    sessionId: string;
    startTime: Date;
    duration: number;
  };
}

interface ProjectStatistics {
  totalFiles: number;
  configurationFiles: number;
  sourceFiles: number;
  documentationFiles: number;
  estimatedLinesOfCode: number;
  technologies: string[];
  features: string[];
}

export class ProjectSummaryGenerator {
  
  /**
   * Generate comprehensive project summary
   */
  async generate(options: SummaryGenerationOptions): Promise<ProjectSummaryResult> {
    try {
      const startTime = Date.now();
      
      // Analyze project structure
      const statistics = await this.analyzeProjectStructure(options.projectPath);
      
      // Generate timeline
      const timeline = await this.generateProjectTimeline(options);
      
      // Generate next steps
      const nextSteps = await this.generateNextSteps(options);
      
      // Generate recommendations
      const recommendations = await this.generateRecommendations(options, statistics);
      
      // Create markdown report
      const markdownReport = await this.generateMarkdownReport(options, statistics, timeline);
      
      // Save summary to file
      const summaryFile = await this.saveSummaryFile(options, statistics, timeline, nextSteps, recommendations);
      
      const result: ProjectSummaryResult = {
        success: true,
        summaryFile,
        markdownReport,
        nextSteps,
        recommendations,
        estimatedTimeline: timeline
      };
      
      // Save detailed analytics
      await this.saveAnalytics(options, result, Date.now() - startTime);
      
      return result;
      
    } catch (error) {
      return {
        success: false,
        nextSteps: ['Fix project summary generation issues'],
        recommendations: ['Check project structure and permissions']
      };
    }
  }

  /**
   * Analyze project structure and gather statistics
   */
  private async analyzeProjectStructure(projectPath: string): Promise<ProjectStatistics> {
    const statistics: ProjectStatistics = {
      totalFiles: 0,
      configurationFiles: 0,
      sourceFiles: 0,
      documentationFiles: 0,
      estimatedLinesOfCode: 0,
      technologies: [],
      features: []
    };

    try {
      const files = await this.getAllFiles(projectPath);
      
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const basename = path.basename(file).toLowerCase();
        
        statistics.totalFiles++;
        
        // Categorize files
        if (this.isConfigFile(file)) {
          statistics.configurationFiles++;
        } else if (this.isSourceFile(file)) {
          statistics.sourceFiles++;
        } else if (this.isDocumentationFile(file)) {
          statistics.documentationFiles++;
        }
        
        // Detect technologies
        statistics.technologies.push(...this.detectTechnologiesFromFile(file));
        
        // Detect features
        statistics.features.push(...await this.detectFeaturesFromFile(path.join(projectPath, file)));
        
        // Estimate lines of code for source files
        if (this.isSourceFile(file)) {
          try {
            const content = await fs.readFile(path.join(projectPath, file), 'utf-8');
            statistics.estimatedLinesOfCode += content.split('\n').length;
          } catch {
            // Ignore files we can't read
          }
        }
      }
      
      // Remove duplicates and clean up
      statistics.technologies = [...new Set(statistics.technologies)].filter(Boolean);
      statistics.features = [...new Set(statistics.features)].filter(Boolean);
      
    } catch (error) {
      console.warn('Failed to analyze project structure:', error);
    }

    return statistics;
  }

  /**
   * Generate project development timeline
   */
  private async generateProjectTimeline(options: SummaryGenerationOptions): Promise<ProjectTimeline> {
    const phases = await this.generateTimelinePhases(options);
    const milestones = await this.generateTimelineMilestones(options);
    const criticalPath = this.calculateCriticalPath(phases);
    const totalDuration = this.calculateTotalDuration(phases);

    return {
      totalDuration,
      phases,
      criticalPath,
      milestones
    };
  }

  /**
   * Generate development phases
   */
  private async generateTimelinePhases(options: SummaryGenerationOptions): Promise<TimelinePhase[]> {
    const baseDate = new Date();
    const phases: TimelinePhase[] = [];

    // Setup phase
    phases.push({
      name: 'Project Setup & Configuration',
      duration: 3,
      startDate: new Date(baseDate),
      endDate: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
      tasks: [
        'Set up development environment',
        'Install dependencies',
        'Configure tooling and linting',
        'Set up database connections',
        'Configure CI/CD pipelines'
      ],
      dependencies: []
    });

    // Core development phase
    const setupEndDate = new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    const coreDuration = this.estimateCoreDevelopmentDuration(options);
    
    phases.push({
      name: 'Core Development',
      duration: coreDuration,
      startDate: new Date(setupEndDate),
      endDate: new Date(setupEndDate.getTime() + coreDuration * 24 * 60 * 60 * 1000),
      tasks: await this.generateCoreDevelopmentTasks(options),
      dependencies: ['Project Setup & Configuration']
    });

    // Testing phase
    const coreEndDate = new Date(setupEndDate.getTime() + coreDuration * 24 * 60 * 60 * 1000);
    phases.push({
      name: 'Testing & Quality Assurance',
      duration: 5,
      startDate: new Date(coreEndDate.getTime() - 2 * 24 * 60 * 60 * 1000), // Overlap with core development
      endDate: new Date(coreEndDate.getTime() + 3 * 24 * 60 * 60 * 1000),
      tasks: [
        'Write unit tests',
        'Integration testing',
        'End-to-end testing',
        'Performance testing',
        'Security testing',
        'Code review and refactoring'
      ],
      dependencies: ['Core Development']
    });

    // Deployment phase
    const testingEndDate = new Date(coreEndDate.getTime() + 3 * 24 * 60 * 60 * 1000);
    phases.push({
      name: 'Deployment & Launch',
      duration: 4,
      startDate: new Date(testingEndDate),
      endDate: new Date(testingEndDate.getTime() + 4 * 24 * 60 * 60 * 1000),
      tasks: [
        'Production environment setup',
        'Database migration and seeding',
        'Deploy application',
        'Monitor and verify deployment',
        'Documentation and handover'
      ],
      dependencies: ['Testing & Quality Assurance']
    });

    return phases;
  }

  /**
   * Generate timeline milestones
   */
  private async generateTimelineMilestones(options: SummaryGenerationOptions): Promise<TimelineMilestone[]> {
    const baseDate = new Date();
    const milestones: TimelineMilestone[] = [];

    milestones.push({
      name: 'Project Kickoff',
      date: baseDate,
      description: 'Project setup complete, development ready to begin',
      deliverables: [
        'Project requirements documented',
        'Development environment configured',
        'Team onboarded'
      ]
    });

    milestones.push({
      name: 'MVP Complete',
      date: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000), // 2 weeks
      description: 'Minimum viable product features implemented',
      deliverables: [
        'Core functionality working',
        'Basic UI/UX implemented',
        'Initial testing complete'
      ]
    });

    milestones.push({
      name: 'Beta Release',
      date: new Date(baseDate.getTime() + 28 * 24 * 60 * 60 * 1000), // 4 weeks
      description: 'Feature-complete version ready for testing',
      deliverables: [
        'All planned features implemented',
        'Comprehensive testing complete',
        'Beta deployment ready'
      ]
    });

    milestones.push({
      name: 'Production Launch',
      date: new Date(baseDate.getTime() + 35 * 24 * 60 * 60 * 1000), // 5 weeks
      description: 'Application launched in production',
      deliverables: [
        'Production deployment complete',
        'Monitoring and logging active',
        'Documentation complete',
        'Support processes established'
      ]
    });

    return milestones;
  }

  /**
   * Generate actionable next steps
   */
  private async generateNextSteps(options: SummaryGenerationOptions): Promise<string[]> {
    const steps: string[] = [];

    // Always include basic setup steps
    steps.push('Review and customize the generated project structure');
    steps.push('Install project dependencies with `npm install` or `yarn install`');

    // Database-specific steps
    if (options.results.database?.success) {
      steps.push('Run database migrations: `npm run db:migrate`');
      steps.push('Seed initial data: `npm run db:seed`');
      steps.push('Open Prisma Studio to explore your database: `npm run db:studio`');
    }

    // GitHub-specific steps
    if (options.results.github?.success) {
      steps.push('Make your first commit: `git add . && git commit -m "Initial commit"`');
      steps.push('Push to GitHub: `git push -u origin main`');
      steps.push('Review and customize GitHub workflows in `.github/workflows/`');
    }

    // Protection-specific steps
    if (options.results.protection?.success) {
      steps.push('Review protection configuration in `.protection.config.json`');
      steps.push('Configure notification channels for security alerts');
    }

    // Development steps based on project type
    const requirements = options.results.requirements;
    if (requirements) {
      switch (requirements.projectType) {
        case 'web-application':
          steps.push('Start the development server: `npm run dev`');
          steps.push('Begin implementing your first feature or component');
          steps.push('Set up authentication and user management');
          break;
        case 'api-service':
          steps.push('Define your API routes and endpoints');
          steps.push('Implement authentication middleware');
          steps.push('Set up API documentation with Swagger/OpenAPI');
          break;
        case 'cli-tool':
          steps.push('Define your CLI commands and options');
          steps.push('Implement core CLI functionality');
          steps.push('Add help documentation and examples');
          break;
        default:
          steps.push('Start implementing your core application logic');
          steps.push('Set up basic testing framework');
      }
    }

    // Testing and quality steps
    steps.push('Set up testing framework and write initial tests');
    steps.push('Configure linting and formatting tools');
    steps.push('Set up pre-commit hooks for code quality');

    // Documentation steps
    steps.push('Update README.md with project-specific information');
    steps.push('Document API endpoints and usage examples');
    steps.push('Create contributing guidelines for team members');

    return steps;
  }

  /**
   * Generate intelligent recommendations
   */
  private async generateRecommendations(
    options: SummaryGenerationOptions, 
    statistics: ProjectStatistics
  ): Promise<string[]> {
    const recommendations: string[] = [];
    const requirements = options.results.requirements;

    // Technology stack recommendations
    if (statistics.technologies.includes('typescript')) {
      recommendations.push('Consider using strict TypeScript configuration for better type safety');
      recommendations.push('Set up path mapping in tsconfig.json for cleaner imports');
    }

    if (statistics.technologies.includes('react')) {
      recommendations.push('Consider using React Query/SWR for efficient data fetching');
      recommendations.push('Implement proper error boundaries for better error handling');
      recommendations.push('Use React.memo and useMemo for performance optimization');
    }

    // Database recommendations
    if (options.results.database?.success) {
      recommendations.push('Implement database connection pooling for better performance');
      recommendations.push('Set up database backups and recovery procedures');
      recommendations.push('Consider implementing database query optimization and indexing');
    }

    // Security recommendations based on project type
    if (requirements?.projectType === 'web-application') {
      recommendations.push('Implement proper input validation and sanitization');
      recommendations.push('Set up HTTPS and security headers');
      recommendations.push('Consider implementing rate limiting for API endpoints');
      recommendations.push('Use Content Security Policy (CSP) headers');
    }

    // Performance recommendations
    if (statistics.estimatedLinesOfCode > 5000) {
      recommendations.push('Consider implementing code splitting for better performance');
      recommendations.push('Set up bundle analysis to monitor build size');
    }

    // Testing recommendations
    recommendations.push('Aim for at least 80% test coverage for critical components');
    recommendations.push('Implement both unit and integration tests');
    recommendations.push('Set up automated testing in your CI/CD pipeline');

    // Monitoring and observability
    recommendations.push('Implement proper logging and error tracking');
    recommendations.push('Set up application performance monitoring (APM)');
    recommendations.push('Configure health check endpoints');

    // Team collaboration
    if (options.results.github?.success) {
      recommendations.push('Set up code review guidelines and templates');
      recommendations.push('Implement semantic versioning and changelog automation');
      recommendations.push('Configure automated dependency updates with Dependabot');
    }

    // Documentation
    recommendations.push('Maintain up-to-date API documentation');
    recommendations.push('Create architecture decision records (ADRs) for important decisions');
    recommendations.push('Set up automated documentation generation');

    return recommendations;
  }

  /**
   * Generate comprehensive markdown report
   */
  private async generateMarkdownReport(
    options: SummaryGenerationOptions,
    statistics: ProjectStatistics,
    timeline: ProjectTimeline
  ): Promise<string> {
    const { projectName, results, preferences, analytics } = options;
    
    let report = `# ${projectName} - Project Summary

*Generated by Agentwise Project Wizard on ${new Date().toLocaleDateString()}*

## 📋 Project Overview

**Project Name:** ${projectName}  
**Project Type:** ${results.requirements?.projectType || 'Not specified'}  
**Setup Duration:** ${Math.round(analytics.duration / 1000 / 60)} minutes  
**Session ID:** ${analytics.sessionId}

${results.requirements?.description ? `**Description:** ${results.requirements.description}` : ''}

## 📊 Project Statistics

- **Total Files:** ${statistics.totalFiles}
- **Source Files:** ${statistics.sourceFiles}
- **Configuration Files:** ${statistics.configurationFiles}
- **Documentation Files:** ${statistics.documentationFiles}
- **Estimated Lines of Code:** ${statistics.estimatedLinesOfCode.toLocaleString()}

## 🛠️ Technology Stack

${statistics.technologies.length > 0 ? statistics.technologies.map(tech => `- ${tech}`).join('\n') : '- No technologies detected'}

## ✅ Setup Results

`;

    // Requirements section
    if (results.requirements) {
      report += `### Requirements Generation
- ✅ **Completed** - Intelligent requirements generated
- **Features Identified:** ${results.requirements.features.length}
- **Tech Stack Defined:** Yes
- **Timeline Estimated:** ${results.requirements.timeline.totalDuration} days

`;
    }

    // Database section
    if (results.database) {
      if (results.database.success) {
        report += `### Database Setup
- ✅ **Completed** - Database integration configured
- **Provider:** ${results.database.configuration?.credentials?.provider || 'Not specified'}
- **Type Generation:** ${results.database.generatedFiles?.includes('.ts') ? 'Yes' : 'No'}
- **MCP Configuration:** Yes

`;
      } else {
        report += `### Database Setup
- ❌ **Failed** - ${results.database.errors?.[0] || 'Unknown error'}

`;
      }
    } else {
      report += `### Database Setup
- ⏭️ **Skipped** - No database setup requested

`;
    }

    // GitHub section
    if (results.github) {
      if (results.github.success) {
        report += `### GitHub Integration
- ✅ **Completed** - Repository and workflows created
- **Repository:** ${results.github.repository?.fullName || 'Created'}
- **Branch Protection:** ${results.github.protectionEnabled ? 'Enabled' : 'Disabled'}
- **Workflows:** ${results.github.workflowsCreated.join(', ') || 'None'}
- **Clone URL:** ${results.github.cloneUrl || 'Not available'}

`;
      } else {
        report += `### GitHub Integration
- ❌ **Failed** - ${results.github.error || 'Unknown error'}

`;
      }
    } else {
      report += `### GitHub Integration
- ⏭️ **Skipped** - No GitHub setup requested

`;
    }

    // Protection section
    if (results.protection) {
      if (results.protection.success) {
        report += `### Protection System
- ✅ **Completed** - Security and monitoring enabled
- **Services:** ${results.protection.servicesStarted.join(', ') || 'None'}
- **Backup System:** ${results.protection.backupConfigured ? 'Configured' : 'Not configured'}
- **Monitoring:** ${results.protection.monitoringEnabled ? 'Enabled' : 'Disabled'}

`;
      } else {
        report += `### Protection System
- ❌ **Failed** - ${results.protection.error || 'Unknown error'}

`;
      }
    } else {
      report += `### Protection System
- ⏭️ **Skipped** - No protection setup requested

`;
    }

    // Timeline section
    report += `## 🗓️ Development Timeline

**Total Estimated Duration:** ${timeline.totalDuration} days

### Phases
${timeline.phases.map(phase => 
  `**${phase.name}** (${phase.duration} days)  
${phase.tasks.map(task => `  - ${task}`).join('\n')}
`).join('\n')}

### Milestones
${timeline.milestones.map(milestone => 
  `**${milestone.name}** - ${milestone.date.toLocaleDateString()}  
${milestone.description}
`).join('\n')}

`;

    // Next steps section
    const nextSteps = await this.generateNextSteps(options);
    report += `## 🚀 Next Steps

${nextSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

`;

    // Recommendations section
    const recommendations = await this.generateRecommendations(options, statistics);
    report += `## 💡 Recommendations

${recommendations.map(rec => `- ${rec}`).join('\n')}

`;

    // Features detected section
    if (statistics.features.length > 0) {
      report += `## 🎯 Detected Features

${statistics.features.map(feature => `- ${feature}`).join('\n')}

`;
    }

    // Configuration section
    report += `## ⚙️ Configuration Summary

### User Preferences
- **Preferred Languages:** ${preferences.preferredLanguages.join(', ')}
- **Preferred Frameworks:** ${preferences.preferredFrameworks.join(', ')}
- **Default Project Type:** ${preferences.defaultProjectType}
- **Security Level:** ${preferences.securityLevel}
- **Auto-commit Frequency:** ${preferences.autoCommitFrequency} minutes

### Setup Options
- **Interactive Mode:** ${options.preferences.verboseOutput ? 'Enabled' : 'Disabled'}
- **Verbose Output:** ${options.preferences.verboseOutput ? 'Yes' : 'No'}
- **Color Output:** ${options.preferences.useColorOutput ? 'Yes' : 'No'}

`;

    // Footer
    report += `---

*This summary was generated automatically by the Agentwise Project Wizard.*  
*For more information and updates, visit the project repository.*

**Need Help?**
- Review the next steps above
- Check the generated documentation
- Refer to the technology-specific guides
- Join our community for support

Happy coding! 🎉
`;

    return report;
  }

  /**
   * Save summary file
   */
  private async saveSummaryFile(
    options: SummaryGenerationOptions,
    statistics: ProjectStatistics,
    timeline: ProjectTimeline,
    nextSteps: string[],
    recommendations: string[]
  ): Promise<string> {
    const summaryData = {
      projectName: options.projectName,
      generatedAt: new Date().toISOString(),
      sessionId: options.analytics.sessionId,
      statistics,
      timeline,
      nextSteps,
      recommendations,
      setupResults: options.results,
      preferences: {
        languages: options.preferences.preferredLanguages,
        frameworks: options.preferences.preferredFrameworks,
        database: options.preferences.preferredDatabase,
        securityLevel: options.preferences.securityLevel
      }
    };

    const summaryPath = path.join(options.projectPath, 'project-summary.json');
    await fs.writeFile(summaryPath, JSON.stringify(summaryData, null, 2));

    return summaryPath;
  }

  /**
   * Save analytics data
   */
  private async saveAnalytics(
    options: SummaryGenerationOptions,
    result: ProjectSummaryResult,
    generationTime: number
  ): Promise<void> {
    const analyticsData = {
      sessionId: options.analytics.sessionId,
      projectName: options.projectName,
      startTime: options.analytics.startTime.toISOString(),
      duration: options.analytics.duration,
      summaryGenerationTime: generationTime,
      success: result.success,
      stepsCompleted: Object.keys(options.results),
      preferences: options.preferences,
      timestamp: new Date().toISOString()
    };

    const analyticsPath = path.join(options.projectPath, '.agentwise', 'analytics.json');
    
    try {
      await fs.mkdir(path.dirname(analyticsPath), { recursive: true });
      await fs.writeFile(analyticsPath, JSON.stringify(analyticsData, null, 2));
    } catch (error) {
      console.warn('Failed to save analytics:', error);
    }
  }

  // Helper methods

  private async getAllFiles(dirPath: string, relativePath = ''): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const items = await fs.readdir(path.join(dirPath, relativePath));
      
      for (const item of items) {
        if (item.startsWith('.') && !['..env', '.gitignore', '.github'].includes(item)) {
          continue; // Skip hidden files except important ones
        }
        
        const fullPath = path.join(dirPath, relativePath, item);
        const itemRelativePath = path.join(relativePath, item);
        
        try {
          const stats = await fs.stat(fullPath);
          
          if (stats.isDirectory()) {
            if (item !== 'node_modules' && item !== 'dist' && item !== 'build' && item !== '.git') {
              files.push(...await this.getAllFiles(dirPath, itemRelativePath));
            }
          } else {
            files.push(itemRelativePath);
          }
        } catch {
          // Skip items we can't access
        }
      }
    } catch (error) {
      console.warn(`Failed to read directory ${dirPath}:`, error);
    }
    
    return files;
  }

  private isConfigFile(filePath: string): boolean {
    const configExtensions = ['.json', '.config.js', '.config.ts', '.yml', '.yaml', '.toml'];
    const configFiles = [
      'package.json', 'tsconfig.json', '.eslintrc', 'prettier.config', 
      'tailwind.config', 'next.config', 'vite.config', 'jest.config',
      '.env', '.gitignore', 'docker-compose', 'Dockerfile'
    ];
    
    const basename = path.basename(filePath, path.extname(filePath));
    const fullname = path.basename(filePath);
    
    return configExtensions.includes(path.extname(filePath)) || 
           configFiles.some(config => fullname.includes(config) || basename.includes(config));
  }

  private isSourceFile(filePath: string): boolean {
    const sourceExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte', '.py', '.java', '.cpp', '.c', '.go', '.rs'];
    return sourceExtensions.includes(path.extname(filePath));
  }

  private isDocumentationFile(filePath: string): boolean {
    const docExtensions = ['.md', '.txt', '.rst'];
    const docFiles = ['readme', 'changelog', 'license', 'contributing'];
    const basename = path.basename(filePath, path.extname(filePath)).toLowerCase();
    
    return docExtensions.includes(path.extname(filePath)) || 
           docFiles.some(doc => basename.includes(doc));
  }

  private detectTechnologiesFromFile(filePath: string): string[] {
    const technologies: string[] = [];
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath).toLowerCase();
    
    // Language detection
    switch (ext) {
      case '.ts': case '.tsx':
        technologies.push('TypeScript');
        break;
      case '.js': case '.jsx':
        technologies.push('JavaScript');
        break;
      case '.vue':
        technologies.push('Vue.js');
        break;
      case '.svelte':
        technologies.push('Svelte');
        break;
      case '.py':
        technologies.push('Python');
        break;
    }
    
    // Framework detection
    if (basename.includes('next.config')) {
      technologies.push('Next.js');
    }
    if (basename.includes('vite.config')) {
      technologies.push('Vite');
    }
    if (basename.includes('tailwind.config')) {
      technologies.push('Tailwind CSS');
    }
    if (basename === 'package.json') {
      technologies.push('Node.js');
    }
    if (basename === 'requirements.txt') {
      technologies.push('Python');
    }
    if (basename === 'cargo.toml') {
      technologies.push('Rust');
    }
    if (basename === 'go.mod') {
      technologies.push('Go');
    }
    
    return technologies;
  }

  private async detectFeaturesFromFile(filePath: string): Promise<string[]> {
    const features: string[] = [];
    
    try {
      if (this.isSourceFile(filePath)) {
        const content = await fs.readFile(filePath, 'utf-8');
        
        // Feature detection based on code patterns
        if (content.includes('useState') || content.includes('useEffect')) {
          features.push('React Hooks');
        }
        if (content.includes('router') || content.includes('route')) {
          features.push('Routing');
        }
        if (content.includes('auth') || content.includes('login')) {
          features.push('Authentication');
        }
        if (content.includes('api') || content.includes('fetch') || content.includes('axios')) {
          features.push('API Integration');
        }
        if (content.includes('test') || content.includes('describe') || content.includes('it(')) {
          features.push('Testing');
        }
        if (content.includes('database') || content.includes('prisma') || content.includes('mongoose')) {
          features.push('Database');
        }
      }
    } catch {
      // Ignore files we can't read
    }
    
    return features;
  }

  private estimateCoreDevelopmentDuration(options: SummaryGenerationOptions): number {
    const requirements = options.results.requirements;
    if (!requirements) return 14; // Default 2 weeks
    
    let baseDuration = 7; // 1 week minimum
    
    // Add time based on features
    baseDuration += Math.min(requirements.features.length * 1.5, 21); // Max 3 weeks for features
    
    // Add time based on complexity
    switch (requirements.complexity) {
      case 'simple':
        baseDuration += 3;
        break;
      case 'moderate':
        baseDuration += 7;
        break;
      case 'complex':
        baseDuration += 14;
        break;
      case 'very-complex':
        baseDuration += 21;
        break;
    }
    
    // Add time based on project type
    switch (requirements.projectType) {
      case 'web-application':
        baseDuration += 5;
        break;
      case 'mobile-application':
        baseDuration += 10;
        break;
      case 'api-service':
        baseDuration += 3;
        break;
      case 'cli-tool':
        baseDuration += 2;
        break;
    }
    
    return Math.min(baseDuration, 42); // Max 6 weeks
  }

  private async generateCoreDevelopmentTasks(options: SummaryGenerationOptions): Promise<string[]> {
    const tasks: string[] = [
      'Implement core application logic',
      'Create user interface components',
      'Set up routing and navigation'
    ];
    
    const requirements = options.results.requirements;
    if (requirements) {
      // Add feature-specific tasks
      if (requirements.features.some(f => f.category === 'authentication')) {
        tasks.push('Implement user authentication system');
        tasks.push('Create login and registration flows');
      }
      
      if (requirements.features.some(f => f.category === 'api')) {
        tasks.push('Design and implement API endpoints');
        tasks.push('Set up API documentation');
      }
      
      if (requirements.features.some(f => f.category === 'data-management')) {
        tasks.push('Design database schema');
        tasks.push('Implement data access layer');
      }
      
      // Add project-specific tasks
      switch (requirements.projectType) {
        case 'web-application':
          tasks.push('Implement responsive design');
          tasks.push('Optimize for performance');
          tasks.push('Add SEO optimization');
          break;
        case 'api-service':
          tasks.push('Implement rate limiting');
          tasks.push('Add request validation');
          tasks.push('Set up monitoring endpoints');
          break;
        case 'cli-tool':
          tasks.push('Implement command parsing');
          tasks.push('Add help and usage documentation');
          tasks.push('Create interactive prompts');
          break;
      }
    }
    
    return tasks;
  }

  private calculateCriticalPath(phases: TimelinePhase[]): string[] {
    // For now, return all phase names as critical path
    // In a more sophisticated implementation, this would calculate the actual critical path
    return phases.map(phase => phase.name);
  }

  private calculateTotalDuration(phases: TimelinePhase[]): number {
    return phases.reduce((total, phase) => total + phase.duration, 0);
  }
}