import * as fs from 'fs-extra';
import * as path from 'path';

export type EnhancementMode = 'create' | 'task' | 'image-analysis';

export interface EnhancementOptions {
  mode: EnhancementMode;
  projectContext?: string;
  existingSpecs?: {
    mainSpec?: string;
    projectSpec?: string;
    todoSpec?: string;
  };
}

export interface EnhancedPrompt {
  original: string;
  enhanced: string;
  clarifications: string[];
  assumptions: string[];
  recommendations: string[];
  complexity: 'simple' | 'moderate' | 'complex' | 'enterprise';
  estimatedPhases: number;
  suggestedTech: {
    frontend?: string[];
    backend?: string[];
    database?: string[];
    devops?: string[];
    testing?: string[];
  };
}

export class PromptEnhancer {
  private tokenLimit: number = 2000; // Target token limit for prompts

  async enhance(
    prompt: string, 
    options: EnhancementOptions | string
  ): Promise<EnhancedPrompt | string> {
    // Handle string parameter for backward compatibility and image mode
    if (typeof options === 'string') {
      if (options === 'image-analysis') {
        return this.enhanceForImageAnalysis(prompt);
      }
      // Legacy string mode handling
      return this.enhanceForTask(prompt, '');
    }
    
    if (options.mode === 'create') {
      return this.enhanceForCreation(prompt);
    } else if (options.mode === 'image-analysis') {
      return this.enhanceForImageAnalysis(prompt);
    } else {
      return this.enhanceForTask(prompt, options.projectContext || '');
    }
  }

  private async enhanceForCreation(prompt: string): Promise<EnhancedPrompt> {
    // Analyze the prompt for key indicators
    const analysis = this.analyzePrompt(prompt);
    
    // Generate clarifications
    const clarifications = this.generateClarifications(prompt, analysis);
    
    // Make assumptions based on common patterns
    const assumptions = this.generateAssumptions(analysis);
    
    // Provide recommendations
    const recommendations = this.generateRecommendations(analysis);
    
    // Determine complexity
    const complexity = this.determineComplexity(analysis);
    
    // Estimate phases
    const estimatedPhases = this.estimatePhases(complexity, analysis);
    
    // Suggest technologies
    const suggestedTech = this.suggestTechnologies(analysis);
    
    // Create enhanced prompt
    const enhanced = this.createEnhancedPrompt(
      prompt,
      clarifications,
      assumptions,
      recommendations,
      suggestedTech
    );
    
    return {
      original: prompt,
      enhanced,
      clarifications,
      assumptions,
      recommendations,
      complexity,
      estimatedPhases,
      suggestedTech
    };
  }

  private async enhanceForTask(
    prompt: string, 
    projectContext: string
  ): Promise<EnhancedPrompt> {
    // Parse existing project context
    const context = this.parseProjectContext(projectContext);
    
    // Analyze the feature request
    const analysis = this.analyzePrompt(prompt);
    
    // Check compatibility with existing architecture
    const compatibility = this.checkCompatibility(analysis, context);
    
    // Generate context-aware clarifications
    const clarifications = this.generateTaskClarifications(prompt, context);
    
    // Make context-aware assumptions
    const assumptions = this.generateTaskAssumptions(analysis, context);
    
    // Provide integration recommendations
    const recommendations = this.generateIntegrationRecommendations(
      analysis, 
      context, 
      compatibility
    );
    
    // Determine feature complexity
    const complexity = this.determineFeatureComplexity(analysis, context);
    
    // Estimate additional phases needed
    const estimatedPhases = Math.ceil(this.estimateFeatureEffort(analysis) / 5);
    
    // Suggest complementary technologies
    const suggestedTech = this.suggestComplementaryTech(analysis, context);
    
    // Create context-aware enhanced prompt
    const enhanced = this.createTaskEnhancedPrompt(
      prompt,
      context,
      clarifications,
      assumptions,
      recommendations
    );
    
    return {
      original: prompt,
      enhanced,
      clarifications,
      assumptions,
      recommendations,
      complexity,
      estimatedPhases,
      suggestedTech
    };
  }

  private analyzePrompt(prompt: string): any {
    const analysis: any = {
      keywords: [],
      domains: [],
      features: [],
      patterns: []
    };
    
    // Extract keywords
    const techKeywords = [
      'api', 'database', 'auth', 'real-time', 'mobile', 'web', 'desktop',
      'microservice', 'serverless', 'cloud', 'docker', 'kubernetes',
      'react', 'vue', 'angular', 'node', 'python', 'java', 'go',
      'postgres', 'mysql', 'mongodb', 'redis', 'elasticsearch'
    ];
    
    const promptLower = prompt.toLowerCase();
    analysis.keywords = techKeywords.filter(keyword => 
      promptLower.includes(keyword)
    );
    
    // Identify domains
    const domains = [
      { pattern: /e-?commerce|shop|store/i, domain: 'ecommerce' },
      { pattern: /social|network|community/i, domain: 'social' },
      { pattern: /blog|content|cms/i, domain: 'content' },
      { pattern: /game|gaming/i, domain: 'gaming' },
      { pattern: /finance|banking|payment/i, domain: 'finance' },
      { pattern: /health|medical|fitness/i, domain: 'healthcare' },
      { pattern: /education|learning|course/i, domain: 'education' },
      { pattern: /saas|subscription/i, domain: 'saas' }
    ];
    
    analysis.domains = domains
      .filter(d => d.pattern.test(prompt))
      .map(d => d.domain);
    
    // Extract features
    const features = [
      { pattern: /auth|login|sign/i, feature: 'authentication' },
      { pattern: /payment|billing|stripe/i, feature: 'payments' },
      { pattern: /chat|message|communication/i, feature: 'messaging' },
      { pattern: /search/i, feature: 'search' },
      { pattern: /upload|file|image/i, feature: 'file-handling' },
      { pattern: /notification|alert/i, feature: 'notifications' },
      { pattern: /admin|dashboard/i, feature: 'admin-panel' },
      { pattern: /api/i, feature: 'api' },
      { pattern: /real-?time/i, feature: 'realtime' },
      { pattern: /mobile|responsive/i, feature: 'mobile' }
    ];
    
    analysis.features = features
      .filter(f => f.pattern.test(prompt))
      .map(f => f.feature);
    
    // Identify architectural patterns
    if (promptLower.includes('microservice')) {
      analysis.patterns.push('microservices');
    } else if (promptLower.includes('serverless')) {
      analysis.patterns.push('serverless');
    } else {
      analysis.patterns.push('monolithic');
    }
    
    return analysis;
  }

  private generateClarifications(prompt: string, analysis: any): string[] {
    const clarifications: string[] = [];
    
    // User type clarifications
    if (!prompt.toLowerCase().includes('user')) {
      clarifications.push('Single user type or multiple roles (admin, customer, etc.)?');
    }
    
    // Scale clarifications
    clarifications.push('Expected number of users (hundreds, thousands, millions)?');
    
    // Platform clarifications
    if (!analysis.keywords.includes('mobile') && !analysis.keywords.includes('web')) {
      clarifications.push('Web-only, mobile-only, or cross-platform?');
    }
    
    // Data persistence
    if (analysis.features.length > 0) {
      clarifications.push('Data persistence requirements (relational, NoSQL, hybrid)?');
    }
    
    // Deployment
    clarifications.push('Deployment target (cloud provider, self-hosted, hybrid)?');
    
    return clarifications;
  }

  private generateAssumptions(analysis: any): string[] {
    const assumptions: string[] = [];
    
    // Technology assumptions
    if (analysis.keywords.length === 0) {
      assumptions.push('Using modern web stack (React/Node.js/PostgreSQL)');
    }
    
    // Architecture assumptions
    if (analysis.patterns.includes('monolithic')) {
      assumptions.push('Monolithic architecture for simplicity');
    }
    
    // Feature assumptions
    if (analysis.features.includes('authentication')) {
      assumptions.push('JWT-based authentication with refresh tokens');
    }
    
    if (analysis.domains.includes('ecommerce')) {
      assumptions.push('Shopping cart, product catalog, and checkout flow needed');
    }
    
    // General assumptions
    assumptions.push('Production-ready with proper error handling');
    assumptions.push('Responsive design for all screen sizes');
    assumptions.push('Basic SEO optimization');
    
    return assumptions;
  }

  private generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];
    
    // Security recommendations
    if (analysis.features.includes('authentication')) {
      recommendations.push('Implement OAuth2 for third-party login');
      recommendations.push('Add two-factor authentication');
    }
    
    // Performance recommendations
    if (analysis.features.includes('search')) {
      recommendations.push('Use Elasticsearch for advanced search capabilities');
    }
    
    if (analysis.features.includes('realtime')) {
      recommendations.push('Implement WebSocket connections with Socket.io');
    }
    
    // Scalability recommendations
    if (analysis.patterns.includes('microservices')) {
      recommendations.push('Use message queue (RabbitMQ/Kafka) for service communication');
      recommendations.push('Implement service discovery and API gateway');
    }
    
    // General recommendations
    recommendations.push('Add comprehensive logging and monitoring');
    recommendations.push('Implement CI/CD pipeline from the start');
    recommendations.push('Include unit and integration tests');
    
    return recommendations;
  }

  private determineComplexity(analysis: any): EnhancedPrompt['complexity'] {
    const featureCount = analysis.features.length;
    const hasComplexPatterns = analysis.patterns.includes('microservices') || 
                               analysis.patterns.includes('serverless');
    
    if (featureCount <= 2 && !hasComplexPatterns) {
      return 'simple';
    } else if (featureCount <= 5 && !hasComplexPatterns) {
      return 'moderate';
    } else if (featureCount <= 8 || hasComplexPatterns) {
      return 'complex';
    } else {
      return 'enterprise';
    }
  }

  private estimatePhases(
    complexity: EnhancedPrompt['complexity'], 
    analysis: any
  ): number {
    const basePhases = {
      'simple': 2,
      'moderate': 3,
      'complex': 5,
      'enterprise': 7
    };
    
    let phases = basePhases[complexity];
    
    // Add phases for specific features
    if (analysis.features.includes('payments')) phases++;
    if (analysis.features.includes('realtime')) phases++;
    if (analysis.patterns.includes('microservices')) phases += 2;
    
    return Math.min(phases, 10); // Cap at 10 phases
  }

  private suggestTechnologies(analysis: any): EnhancedPrompt['suggestedTech'] {
    const tech: EnhancedPrompt['suggestedTech'] = {};
    
    // Frontend suggestions
    if (analysis.features.includes('realtime')) {
      tech.frontend = ['React', 'Socket.io-client', 'Redux'];
    } else if (analysis.domains.includes('ecommerce')) {
      tech.frontend = ['Next.js', 'Tailwind CSS', 'Stripe Elements'];
    } else {
      tech.frontend = ['React', 'Tailwind CSS', 'React Router'];
    }
    
    // Backend suggestions
    if (analysis.patterns.includes('microservices')) {
      tech.backend = ['Node.js', 'Express', 'gRPC', 'Redis'];
    } else if (analysis.patterns.includes('serverless')) {
      tech.backend = ['AWS Lambda', 'API Gateway', 'DynamoDB'];
    } else {
      tech.backend = ['Node.js', 'Express', 'JWT'];
    }
    
    // Database suggestions
    if (analysis.domains.includes('social') || analysis.features.includes('messaging')) {
      tech.database = ['PostgreSQL', 'Redis', 'MongoDB'];
    } else if (analysis.domains.includes('ecommerce')) {
      tech.database = ['PostgreSQL', 'Redis'];
    } else {
      tech.database = ['PostgreSQL'];
    }
    
    // DevOps suggestions
    tech.devops = ['Docker', 'GitHub Actions', 'Kubernetes'];
    
    // Testing suggestions
    tech.testing = ['Jest', 'Cypress', 'Supertest'];
    
    return tech;
  }

  private createEnhancedPrompt(
    original: string,
    clarifications: string[],
    assumptions: string[],
    recommendations: string[],
    tech: EnhancedPrompt['suggestedTech']
  ): string {
    const parts = [
      `PROJECT: ${original}`,
      '',
      'CLARIFICATIONS NEEDED:',
      ...clarifications.map(c => `- ${c}`),
      '',
      'ASSUMPTIONS:',
      ...assumptions.map(a => `- ${a}`),
      '',
      'RECOMMENDATIONS:',
      ...recommendations.map(r => `- ${r}`),
      '',
      'SUGGESTED STACK:',
      `- Frontend: ${tech.frontend?.join(', ')}`,
      `- Backend: ${tech.backend?.join(', ')}`,
      `- Database: ${tech.database?.join(', ')}`,
      `- DevOps: ${tech.devops?.join(', ')}`,
      `- Testing: ${tech.testing?.join(', ')}`
    ];
    
    return parts.join('\n');
  }

  // Task mode methods
  private parseProjectContext(context: string): any {
    // Parse the project context markdown
    return {
      technologies: [],
      architecture: 'monolithic',
      features: [],
      phase: 1
    };
  }

  private checkCompatibility(analysis: any, context: any): boolean {
    // Check if new feature is compatible with existing architecture
    return true;
  }

  private generateTaskClarifications(prompt: string, context: any): string[] {
    return [
      'Integration points with existing features?',
      'UI changes required?',
      'Database schema modifications needed?'
    ];
  }

  private generateTaskAssumptions(analysis: any, context: any): string[] {
    return [
      'Maintaining existing authentication system',
      'Following current code patterns',
      'Preserving backward compatibility'
    ];
  }

  private generateIntegrationRecommendations(
    analysis: any, 
    context: any, 
    compatibility: boolean
  ): string[] {
    return [
      'Add feature flag for gradual rollout',
      'Update API documentation',
      'Add integration tests'
    ];
  }

  private determineFeatureComplexity(analysis: any, context: any): EnhancedPrompt['complexity'] {
    return 'moderate';
  }

  private estimateFeatureEffort(analysis: any): number {
    return 10; // Story points or hours
  }

  private suggestComplementaryTech(analysis: any, context: any): EnhancedPrompt['suggestedTech'] {
    return {
      frontend: ['Existing React components'],
      backend: ['Existing API framework'],
      database: ['Existing database']
    };
  }

  private createTaskEnhancedPrompt(
    prompt: string,
    context: any,
    clarifications: string[],
    assumptions: string[],
    recommendations: string[]
  ): string {
    return `FEATURE: ${prompt}\n\nCONTEXT: Existing project\n\n${clarifications.join('\n')}`;
  }

  private async enhanceForImageAnalysis(prompt: string): Promise<string> {
    // Parse the image context from the prompt
    const imageMatch = prompt.match(/\[Image Context: ([^\]]+)\]/);
    const userDescription = prompt.replace(/\[Image Context: [^\]]+\]/, '').trim();
    
    // Analyze what the user is asking for
    const analysis = this.analyzeImageRequest(userDescription);
    
    // Build enhanced prompt with clear instructions
    const enhancedParts = [
      '## Visual Analysis Request',
      '',
      '### User Request',
      userDescription || 'Analyze the provided image and suggest improvements or implementation.',
      '',
      '### Analysis Focus Areas',
    ];

    // Add specific focus areas based on the request
    if (analysis.isUI) {
      enhancedParts.push(
        '1. **UI/UX Analysis**',
        '   - Component structure and hierarchy',
        '   - Layout and spacing issues',
        '   - Color scheme and visual consistency',
        '   - Responsive design considerations',
        '   - Accessibility concerns'
      );
    }

    if (analysis.isError) {
      enhancedParts.push(
        '2. **Error Analysis**',
        '   - Error message interpretation',
        '   - Stack trace analysis',
        '   - Potential root causes',
        '   - Debugging steps',
        '   - Solution recommendations'
      );
    }

    if (analysis.isArchitecture) {
      enhancedParts.push(
        '3. **Architecture Analysis**',
        '   - System components and relationships',
        '   - Data flow patterns',
        '   - Integration points',
        '   - Scalability considerations',
        '   - Security implications'
      );
    }

    if (analysis.isImplementation) {
      enhancedParts.push(
        '4. **Implementation Guidance**',
        '   - Required components/modules',
        '   - Technology stack recommendations',
        '   - Code structure suggestions',
        '   - Best practices to follow',
        '   - Step-by-step implementation plan'
      );
    }

    // Add general instructions
    enhancedParts.push(
      '',
      '### Expected Deliverables',
      '1. Detailed analysis of the visual elements',
      '2. Identification of issues or requirements',
      '3. Concrete implementation suggestions with code examples',
      '4. Best practices and optimization recommendations',
      '5. Potential edge cases and considerations',
      '',
      '### Technical Context',
      '- Provide code snippets in appropriate languages',
      '- Consider modern web standards and practices',
      '- Ensure accessibility and performance',
      '- Include error handling and validation',
      '- Follow clean code principles'
    );

    return enhancedParts.join('\n');
  }

  private analyzeImageRequest(description: string): any {
    const lower = description.toLowerCase();
    
    return {
      isUI: /ui|ux|design|layout|component|style|css|button|form|page|screen|interface/.test(lower),
      isError: /error|bug|issue|problem|broken|fix|debug|wrong|incorrect/.test(lower),
      isArchitecture: /architecture|diagram|flow|system|structure|database|schema/.test(lower),
      isImplementation: /implement|build|create|develop|code|convert|make/.test(lower),
      isResponsive: /responsive|mobile|tablet|desktop|breakpoint/.test(lower),
      needsAccessibility: /accessibility|a11y|aria|screen reader/.test(lower),
      needsOptimization: /optimize|performance|speed|fast|slow/.test(lower)
    };
  }
}