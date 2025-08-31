import {
  Requirements,
  Feature,
  TechStack,
  ProjectType,
  ProjectScope,
  FeatureCategory,
  Priority,
  ComplexityLevel,
  ArchitecturePattern,
  DatabaseConfig,
  DatabaseType,
  ProjectOptions,
  TechRequirement,
  Timeline,
  ProjectPhase,
  TeamConfig,
  Constraint,
  RequirementsMetadata,
  RequirementsSource
} from './types';

export interface EnhancementContext {
  projectIdea: string;
  detectedType: ProjectType;
  suggestedScope: ProjectScope;
  complexity: ComplexityLevel;
  keywords: string[];
  domains: string[];
  techHints: string[];
}

export interface EnhancementOptions {
  includeAdvancedFeatures: boolean;
  optimizeForScaling: boolean;
  includeSecurityFeatures: boolean;
  includeTestingFramework: boolean;
  includeMonitoring: boolean;
  includeDocumentation: boolean;
  targetAudience: 'beginner' | 'intermediate' | 'advanced';
  budgetConstraint?: string;
  timelineConstraint?: number;
}

export class RequirementsEnhancer {
  private featureTemplates: Map<FeatureCategory, Feature[]>;
  private techStackTemplates: Map<ProjectType, TechStack>;
  private architecturePatterns: Map<ProjectType, ArchitecturePattern[]>;
  private domainKeywords: Map<string, { type: ProjectType; features: FeatureCategory[] }>;
  private complexityIndicators: Map<string, ComplexityLevel>;

  constructor() {
    this.featureTemplates = this.initializeFeatureTemplates();
    this.techStackTemplates = this.initializeTechStackTemplates();
    this.architecturePatterns = this.initializeArchitecturePatterns();
    this.domainKeywords = this.initializeDomainKeywords();
    this.complexityIndicators = this.initializeComplexityIndicators();
  }

  async enhanceRequirements(
    projectIdea: string,
    options: EnhancementOptions = this.getDefaultOptions()
  ): Promise<Requirements> {
    console.log('🧠 Analyzing project requirements...');

    // 1. Analyze the project idea
    const context = await this.analyzeProjectIdea(projectIdea);

    // 2. Generate enhanced description
    const enhancedDescription = await this.generateEnhancedDescription(context, options);

    // 3. Detect and suggest features
    const features = await this.suggestFeatures(context, options);

    // 4. Recommend tech stack
    const techStack = await this.recommendTechStack(context, features, options);

    // 5. Determine architecture
    const architecture = this.determineArchitecture(context, features, techStack);

    // 6. Generate timeline
    const timeline = this.generateTimeline(features, context.complexity, options);

    // 7. Suggest team configuration
    const team = this.suggestTeamConfiguration(features, context.complexity, techStack);

    // 8. Identify constraints
    const constraints = this.identifyConstraints(context, options);

    // 9. Generate database configuration if needed
    const database = this.generateDatabaseConfig(features, techStack, context);

    // 10. Create metadata
    const metadata = this.generateMetadata(context, projectIdea);

    return {
      id: this.generateId(),
      title: this.generateTitle(context, projectIdea),
      description: enhancedDescription,
      projectType: context.detectedType,
      scope: context.suggestedScope,
      features,
      techStack,
      database,
      architecture,
      deployment: this.generateDeploymentConfig(techStack, architecture, options),
      timeline,
      complexity: context.complexity,
      team,
      constraints,
      metadata
    };
  }

  private async analyzeProjectIdea(projectIdea: string): Promise<EnhancementContext> {
    const lowerIdea = projectIdea.toLowerCase();
    const words = lowerIdea.split(/\s+/);
    
    // Extract keywords
    const keywords = this.extractKeywords(lowerIdea);
    
    // Detect domains
    const domains = this.detectDomains(keywords);
    
    // Extract tech hints
    const techHints = this.extractTechHints(lowerIdea);
    
    // Detect project type
    const detectedType = this.detectProjectType(lowerIdea, keywords, domains);
    
    // Suggest scope based on complexity indicators
    const complexity = this.assessComplexity(lowerIdea, keywords, domains);
    const suggestedScope = this.suggestScope(complexity, domains.length);

    return {
      projectIdea,
      detectedType,
      suggestedScope,
      complexity,
      keywords,
      domains,
      techHints
    };
  }

  private extractKeywords(idea: string): string[] {
    const keywords: string[] = [];
    const importantWords = [
      // Actions
      'create', 'build', 'develop', 'make', 'design', 'implement', 'manage', 'track', 'monitor',
      'analyze', 'process', 'handle', 'store', 'retrieve', 'search', 'filter', 'sort', 'display',
      'authenticate', 'authorize', 'validate', 'integrate', 'synchronize', 'backup', 'export',
      'import', 'share', 'collaborate', 'communicate', 'notify', 'schedule', 'automate',
      
      // Entities
      'user', 'admin', 'customer', 'client', 'employee', 'student', 'teacher', 'doctor', 'patient',
      'product', 'service', 'order', 'payment', 'invoice', 'report', 'data', 'file', 'document',
      'image', 'video', 'audio', 'message', 'notification', 'email', 'calendar', 'event',
      'task', 'project', 'team', 'organization', 'company', 'business',
      
      // Features
      'dashboard', 'profile', 'settings', 'preferences', 'permissions', 'roles', 'groups',
      'categories', 'tags', 'search', 'filter', 'sort', 'pagination', 'comments', 'reviews',
      'ratings', 'favorites', 'bookmarks', 'history', 'analytics', 'reporting', 'charts',
      'graphs', 'statistics', 'metrics', 'alerts', 'notifications', 'email', 'sms',
      
      // Platforms/Types
      'web', 'mobile', 'desktop', 'api', 'service', 'application', 'app', 'website', 'portal',
      'platform', 'system', 'tool', 'utility', 'dashboard', 'cms', 'crm', 'erp', 'blog',
      'ecommerce', 'marketplace', 'social', 'chat', 'game', 'educational',
      
      // Technologies
      'react', 'vue', 'angular', 'nodejs', 'python', 'java', 'database', 'mysql', 'postgresql',
      'mongodb', 'redis', 'api', 'rest', 'graphql', 'websocket', 'real-time', 'cloud',
      'microservices', 'serverless', 'docker', 'kubernetes',
      
      // Scale/Performance
      'scalable', 'high-performance', 'fast', 'efficient', 'secure', 'reliable', 'robust',
      'enterprise', 'large-scale', 'multi-tenant', 'global', 'distributed',
      
      // Business
      'marketplace', 'ecommerce', 'payment', 'subscription', 'billing', 'invoice', 'accounting',
      'inventory', 'shipping', 'logistics', 'crm', 'hr', 'recruiting', 'training', 'learning',
      'education', 'healthcare', 'medical', 'legal', 'finance', 'banking', 'insurance'
    ];

    for (const word of importantWords) {
      if (idea.includes(word)) {
        keywords.push(word);
      }
    }

    return Array.from(new Set(keywords));
  }

  private detectDomains(keywords: string[]): string[] {
    const domainMap: Record<string, string[]> = {
      'ecommerce': ['product', 'payment', 'order', 'cart', 'checkout', 'inventory', 'shipping', 'marketplace'],
      'social': ['user', 'profile', 'friend', 'follow', 'post', 'comment', 'like', 'share', 'message', 'chat'],
      'business': ['crm', 'erp', 'invoice', 'accounting', 'billing', 'hr', 'employee', 'organization'],
      'education': ['student', 'teacher', 'course', 'lesson', 'grade', 'assignment', 'learning', 'training'],
      'healthcare': ['patient', 'doctor', 'medical', 'appointment', 'prescription', 'healthcare', 'clinic'],
      'finance': ['payment', 'transaction', 'banking', 'finance', 'loan', 'investment', 'insurance'],
      'media': ['image', 'video', 'audio', 'content', 'media', 'gallery', 'upload', 'stream'],
      'analytics': ['analytics', 'reporting', 'dashboard', 'metrics', 'statistics', 'charts', 'data'],
      'gaming': ['game', 'player', 'score', 'level', 'achievement', 'multiplayer', 'gaming'],
      'iot': ['device', 'sensor', 'monitoring', 'automation', 'smart', 'connected', 'iot'],
      'productivity': ['task', 'project', 'calendar', 'schedule', 'productivity', 'organization', 'planning']
    };

    const domains: string[] = [];
    for (const [domain, domainKeywords] of Object.entries(domainMap)) {
      const matches = keywords.filter(k => domainKeywords.includes(k));
      if (matches.length >= 2) {
        domains.push(domain);
      }
    }

    return domains;
  }

  private extractTechHints(idea: string): string[] {
    const techHints: string[] = [];
    const techMap: Record<string, string> = {
      'react': 'React',
      'vue': 'Vue.js',
      'angular': 'Angular',
      'nodejs': 'Node.js',
      'node.js': 'Node.js',
      'python': 'Python',
      'java': 'Java',
      'php': 'PHP',
      'ruby': 'Ruby',
      'golang': 'Go',
      'typescript': 'TypeScript',
      'mysql': 'MySQL',
      'postgresql': 'PostgreSQL',
      'postgres': 'PostgreSQL',
      'mongodb': 'MongoDB',
      'redis': 'Redis',
      'graphql': 'GraphQL',
      'rest api': 'REST API',
      'websocket': 'WebSocket',
      'docker': 'Docker',
      'kubernetes': 'Kubernetes',
      'aws': 'AWS',
      'azure': 'Azure',
      'gcp': 'Google Cloud',
      'firebase': 'Firebase',
      'supabase': 'Supabase'
    };

    for (const [hint, tech] of Object.entries(techMap)) {
      if (idea.includes(hint)) {
        techHints.push(tech);
      }
    }

    return techHints;
  }

  private detectProjectType(idea: string, keywords: string[], domains: string[]): ProjectType {
    // Check for explicit type mentions
    if (idea.includes('mobile app') || idea.includes('mobile application') || idea.includes('ios') || idea.includes('android')) {
      return 'mobile-application';
    }
    
    if (idea.includes('desktop') || idea.includes('desktop app')) {
      return 'desktop-application';
    }
    
    if (idea.includes('api') || idea.includes('service') || idea.includes('microservice')) {
      return 'api-service';
    }
    
    if (idea.includes('cli') || idea.includes('command line') || idea.includes('terminal tool')) {
      return 'cli-tool';
    }
    
    if (idea.includes('library') || idea.includes('package') || idea.includes('npm package')) {
      return 'library';
    }
    
    if (idea.includes('game')) {
      return 'game';
    }
    
    if (idea.includes('data pipeline') || idea.includes('etl') || idea.includes('data processing')) {
      return 'data-pipeline';
    }
    
    if (idea.includes('ai') || idea.includes('machine learning') || idea.includes('ml model')) {
      return 'ai-ml-model';
    }
    
    if (idea.includes('iot') || idea.includes('internet of things') || idea.includes('sensor')) {
      return 'iot-application';
    }
    
    if (idea.includes('blockchain') || idea.includes('crypto') || idea.includes('web3')) {
      return 'blockchain-application';
    }
    
    if (idea.includes('extension') || idea.includes('browser extension') || idea.includes('chrome extension')) {
      return 'extension';
    }

    // Domain-based detection
    if (domains.includes('ecommerce') || domains.includes('business')) {
      return 'web-application';
    }

    // Default to web application if web-related keywords are present
    const webKeywords = ['web', 'website', 'portal', 'dashboard', 'cms', 'admin', 'frontend', 'backend'];
    if (webKeywords.some(k => keywords.includes(k))) {
      return 'web-application';
    }

    // Default fallback
    return 'web-application';
  }

  private assessComplexity(idea: string, keywords: string[], domains: string[]): ComplexityLevel {
    let complexityScore = 0;

    // Length and detail indicators
    if (idea.length > 500) complexityScore += 2;
    else if (idea.length > 200) complexityScore += 1;

    // Multiple domains increase complexity
    complexityScore += domains.length;

    // Complex feature indicators
    const complexFeatures = [
      'real-time', 'multi-tenant', 'microservices', 'distributed', 'scalable',
      'machine learning', 'ai', 'blockchain', 'payment processing', 'analytics',
      'reporting', 'dashboard', 'admin panel', 'role-based', 'permissions',
      'integration', 'api', 'third-party', 'workflow', 'automation',
      'multi-language', 'internationalization', 'mobile app', 'cross-platform'
    ];

    const matchedComplex = keywords.filter(k => complexFeatures.includes(k));
    complexityScore += matchedComplex.length;

    // Enterprise/Scale indicators
    const enterpriseKeywords = ['enterprise', 'large-scale', 'high-performance', 'global', 'multi-region'];
    if (enterpriseKeywords.some(k => idea.includes(k))) {
      complexityScore += 3;
    }

    // Determine complexity level
    if (complexityScore >= 8) return 'very-complex';
    if (complexityScore >= 5) return 'complex';
    if (complexityScore >= 2) return 'moderate';
    return 'simple';
  }

  private suggestScope(complexity: ComplexityLevel, domainCount: number): ProjectScope {
    if (complexity === 'very-complex' || domainCount >= 3) return 'enterprise';
    if (complexity === 'complex' || domainCount >= 2) return 'comprehensive';
    if (complexity === 'moderate') return 'standard';
    return 'minimal';
  }

  private async generateEnhancedDescription(context: EnhancementContext, options: EnhancementOptions): Promise<string> {
    let description = `Enhanced ${context.detectedType.replace('-', ' ')} based on: "${context.projectIdea}"\n\n`;

    // Add project overview
    description += `**Project Overview:**\n`;
    description += `This ${context.detectedType.replace('-', ' ')} will serve as a ${context.suggestedScope} solution `;
    
    if (context.domains.length > 0) {
      description += `focusing on ${context.domains.join(', ')} domains. `;
    }

    description += `The system is designed with ${context.complexity} complexity in mind, `;
    description += `ensuring scalability and maintainability.\n\n`;

    // Add key capabilities
    if (context.keywords.length > 0) {
      description += `**Key Capabilities:**\n`;
      const capabilities = this.generateCapabilities(context.keywords, context.domains);
      for (const capability of capabilities) {
        description += `- ${capability}\n`;
      }
      description += '\n';
    }

    // Add technical highlights
    if (context.techHints.length > 0) {
      description += `**Technical Highlights:**\n`;
      description += `- Leverages modern technologies including ${context.techHints.join(', ')}\n`;
      description += `- Built with ${options.targetAudience}-friendly architecture\n`;
      if (options.includeSecurityFeatures) {
        description += '- Includes comprehensive security features\n';
      }
      if (options.includeTestingFramework) {
        description += '- Comprehensive testing framework included\n';
      }
      if (options.includeMonitoring) {
        description += '- Built-in monitoring and analytics\n';
      }
    }

    return description;
  }

  private generateCapabilities(keywords: string[], domains: string[]): string[] {
    const capabilities: string[] = [];

    // Domain-specific capabilities
    const domainCapabilities: Record<string, string[]> = {
      'ecommerce': [
        'Complete product catalog management',
        'Secure payment processing integration',
        'Order tracking and fulfillment',
        'Inventory management with alerts',
        'Customer relationship management'
      ],
      'social': [
        'User profile and authentication system',
        'Social networking features (follow, friends)',
        'Content sharing and interaction',
        'Real-time messaging and notifications',
        'Community building and moderation tools'
      ],
      'business': [
        'Customer relationship management (CRM)',
        'Business process automation',
        'Financial tracking and reporting',
        'Employee management system',
        'Document and workflow management'
      ],
      'education': [
        'Student and instructor management',
        'Course creation and delivery system',
        'Assessment and grading tools',
        'Progress tracking and analytics',
        'Interactive learning features'
      ],
      'healthcare': [
        'Patient management system',
        'Appointment scheduling and management',
        'Medical records and documentation',
        'Prescription and treatment tracking',
        'Healthcare provider collaboration'
      ]
    };

    for (const domain of domains) {
      if (domainCapabilities[domain]) {
        capabilities.push(...domainCapabilities[domain]);
      }
    }

    // Feature-based capabilities
    if (keywords.includes('dashboard')) {
      capabilities.push('Comprehensive dashboard with real-time data visualization');
    }
    if (keywords.includes('analytics')) {
      capabilities.push('Advanced analytics and reporting capabilities');
    }
    if (keywords.includes('search')) {
      capabilities.push('Powerful search and filtering functionality');
    }
    if (keywords.includes('api')) {
      capabilities.push('RESTful API for third-party integrations');
    }
    if (keywords.includes('real-time')) {
      capabilities.push('Real-time updates and live data synchronization');
    }
    if (keywords.includes('mobile')) {
      capabilities.push('Mobile-responsive design and native app support');
    }

    return Array.from(new Set(capabilities)).slice(0, 8); // Limit to 8 capabilities
  }

  private async suggestFeatures(context: EnhancementContext, options: EnhancementOptions): Promise<Feature[]> {
    const features: Feature[] = [];
    let featureId = 1;

    // Core features based on project type
    const coreFeatures = this.getCoreFeatures(context.detectedType);
    for (const feature of coreFeatures) {
      features.push({
        ...feature,
        id: `feature-${featureId++}`,
        status: 'proposed' as const
      });
    }

    // Domain-specific features
    for (const domain of context.domains) {
      const domainFeatures = this.getDomainFeatures(domain);
      for (const feature of domainFeatures) {
        if (!features.find(f => f.name === feature.name)) {
          features.push({
            ...feature,
            id: `feature-${featureId++}`,
            status: 'proposed' as const
          });
        }
      }
    }

    // Keyword-based features
    const keywordFeatures = this.getKeywordFeatures(context.keywords);
    for (const feature of keywordFeatures) {
      if (!features.find(f => f.name === feature.name)) {
        features.push({
          ...feature,
          id: `feature-${featureId++}`,
          status: 'proposed' as const
        });
      }
    }

    // Optional advanced features
    if (options.includeAdvancedFeatures) {
      const advancedFeatures = this.getAdvancedFeatures(context);
      for (const feature of advancedFeatures) {
        if (!features.find(f => f.name === feature.name)) {
          features.push({
            ...feature,
            id: `feature-${featureId++}`,
            status: 'proposed' as const,
            priority: 'medium' as const
          });
        }
      }
    }

    // Security features
    if (options.includeSecurityFeatures) {
      const securityFeatures = this.getSecurityFeatures();
      for (const feature of securityFeatures) {
        if (!features.find(f => f.name === feature.name)) {
          features.push({
            ...feature,
            id: `feature-${featureId++}`,
            status: 'proposed' as const
          });
        }
      }
    }

    // Testing features
    if (options.includeTestingFramework) {
      const testingFeatures = this.getTestingFeatures();
      for (const feature of testingFeatures) {
        features.push({
          ...feature,
          id: `feature-${featureId++}`,
          status: 'proposed' as const
        });
      }
    }

    // Monitoring features
    if (options.includeMonitoring) {
      const monitoringFeatures = this.getMonitoringFeatures();
      for (const feature of monitoringFeatures) {
        features.push({
          ...feature,
          id: `feature-${featureId++}`,
          status: 'proposed' as const
        });
      }
    }

    // Sort by priority and complexity
    return features.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'optional': 0 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      const complexityOrder = { 'simple': 1, 'moderate': 2, 'complex': 3, 'very-complex': 4 };
      return complexityOrder[a.complexity] - complexityOrder[b.complexity];
    });
  }

  private async recommendTechStack(
    context: EnhancementContext, 
    features: Feature[], 
    options: EnhancementOptions
  ): Promise<TechStack> {
    // Start with base template
    let techStack = this.techStackTemplates.get(context.detectedType) || this.getDefaultTechStack();

    // Apply tech hints from the project idea
    techStack = this.applyTechHints(techStack, context.techHints);

    // Optimize based on features
    techStack = this.optimizeTechStackForFeatures(techStack, features);

    // Apply complexity optimizations
    techStack = this.applyComplexityOptimizations(techStack, context.complexity, options);

    // Ensure consistency and best practices
    techStack = this.ensureTechStackConsistency(techStack);

    return techStack;
  }

  private determineArchitecture(
    context: EnhancementContext, 
    features: Feature[], 
    techStack: TechStack
  ): ArchitecturePattern {
    const patterns = this.architecturePatterns.get(context.detectedType) || ['monolithic'];
    
    // Check for complexity indicators
    if (context.complexity === 'very-complex' || features.length > 20) {
      if (patterns.includes('microservices')) return 'microservices';
      if (patterns.includes('layered')) return 'layered';
    }

    // Check for serverless indicators
    const serverlessFeatures = features.filter(f => 
      f.tags.includes('api') || f.tags.includes('real-time') || f.category === 'integration'
    );
    if (serverlessFeatures.length > 0 && patterns.includes('serverless')) {
      return 'serverless';
    }

    // Check for SPA indicators
    if (techStack.frontend && patterns.includes('spa')) {
      const spaFeatures = features.filter(f => f.category === 'ui-ux');
      if (spaFeatures.length > 5) return 'spa';
    }

    // Check for SSR indicators
    if (features.some(f => f.tags.includes('seo') || f.tags.includes('performance'))) {
      if (patterns.includes('ssr')) return 'ssr';
      if (patterns.includes('ssg')) return 'ssg';
    }

    // Default to first pattern
    return patterns[0];
  }

  private generateTimeline(features: Feature[], complexity: ComplexityLevel, options: EnhancementOptions): Timeline {
    const phases: ProjectPhase[] = [];
    const milestones: any[] = [];
    
    // Calculate base duration multiplier
    const complexityMultipliers = {
      'simple': 1,
      'moderate': 1.5,
      'complex': 2.5,
      'very-complex': 4
    };
    
    const multiplier = complexityMultipliers[complexity];
    
    // Group features by phases
    const phaseGroups = this.groupFeaturesByPhases(features);
    
    let phaseId = 1;
    let totalDuration = 0;
    
    for (const [phaseName, phaseFeatures] of Object.entries(phaseGroups)) {
      const phaseDuration = Math.ceil(
        phaseFeatures.reduce((sum, f) => sum + f.estimatedHours, 0) / 40 * multiplier
      );
      
      phases.push({
        id: `phase-${phaseId++}`,
        name: phaseName,
        description: `${phaseName} phase including ${phaseFeatures.length} features`,
        duration: phaseDuration,
        features: phaseFeatures.map(f => f.id),
        deliverables: this.generatePhaseDeliverables(phaseName, phaseFeatures),
        risks: this.generatePhaseRisks(phaseName, complexity),
        resources: this.generateResourceRequirements(phaseName, phaseFeatures)
      });
      
      totalDuration += phaseDuration;
      
      // Add milestone
      milestones.push({
        id: `milestone-${phaseId - 1}`,
        name: `${phaseName} Completion`,
        description: `Complete all ${phaseName.toLowerCase()} features and deliverables`,
        dueDate: new Date(Date.now() + totalDuration * 24 * 60 * 60 * 1000),
        criteria: [`All ${phaseName.toLowerCase()} features implemented`, `Testing completed`, `Documentation updated`],
        dependencies: phases.slice(0, -1).map(p => p.id),
        critical: phaseName === 'Core Development' || phaseName === 'Production Deployment'
      });
    }
    
    // Add buffer time (20% of total)
    const bufferTime = Math.ceil(totalDuration * 0.2);
    totalDuration += bufferTime;
    
    return {
      phases,
      totalDuration,
      milestones,
      dependencies: this.generatePhaseDependencies(phases),
      bufferTime,
      criticalPath: this.calculateCriticalPath(phases)
    };
  }

  private suggestTeamConfiguration(features: Feature[], complexity: ComplexityLevel, techStack: TechStack): TeamConfig {
    const baseRoles = this.getBaseTeamRoles(complexity);
    const techSpecificRoles = this.getTechSpecificRoles(techStack);
    const featureSpecificRoles = this.getFeatureSpecificRoles(features);
    
    // Merge and deduplicate roles
    const allRoles = [...baseRoles, ...techSpecificRoles, ...featureSpecificRoles];
    const uniqueRoles = this.mergeTeamRoles(allRoles);
    
    const teamSize = uniqueRoles.reduce((sum, role) => sum + role.count, 0);
    
    return {
      size: teamSize,
      roles: uniqueRoles,
      skills: this.generateSkillRequirements(uniqueRoles, techStack),
      structure: this.determineTeamStructure(teamSize, complexity),
      communication: this.generateCommunicationPlan(teamSize, complexity),
      development: this.suggestDevelopmentMethodology(teamSize, complexity)
    };
  }

  private identifyConstraints(context: EnhancementContext, options: EnhancementOptions): Constraint[] {
    const constraints: Constraint[] = [];
    let constraintId = 1;

    // Budget constraints
    if (options.budgetConstraint) {
      constraints.push({
        id: `constraint-${constraintId++}`,
        type: 'budgetary',
        description: `Project budget is limited to ${options.budgetConstraint}`,
        impact: 'limiting',
        severity: 'high',
        workaround: ['Phase development to spread costs', 'Use open-source alternatives', 'Consider cloud services with pay-as-you-go'],
        acceptance_criteria: ['Stay within budget limits', 'Regular budget tracking', 'Cost optimization reviews']
      });
    }

    // Timeline constraints
    if (options.timelineConstraint) {
      constraints.push({
        id: `constraint-${constraintId++}`,
        type: 'timeline',
        description: `Project must be completed within ${options.timelineConstraint} days`,
        impact: 'limiting',
        severity: 'high',
        workaround: ['Parallel development tracks', 'Scope reduction if needed', 'Additional resources'],
        acceptance_criteria: ['Meet all critical milestones', 'Deliver MVP on time', 'Quality not compromised']
      });
    }

    // Technology constraints from hints
    if (context.techHints.length > 0) {
      constraints.push({
        id: `constraint-${constraintId++}`,
        type: 'technical',
        description: `Must use specified technologies: ${context.techHints.join(', ')}`,
        impact: 'limiting',
        severity: 'medium',
        acceptance_criteria: ['Use only approved technologies', 'Maintain compatibility', 'Follow best practices']
      });
    }

    // Complexity-based constraints
    if (context.complexity === 'very-complex') {
      constraints.push({
        id: `constraint-${constraintId++}`,
        type: 'technical',
        description: 'High complexity requires extensive testing and quality assurance',
        impact: 'limiting',
        severity: 'medium',
        acceptance_criteria: ['Comprehensive test coverage', 'Performance benchmarks met', 'Security audit passed']
      });
    }

    return constraints;
  }

  private generateDatabaseConfig(features: Feature[], techStack: TechStack, context: EnhancementContext): DatabaseConfig | undefined {
    // Determine if database is needed
    const needsDatabase = features.some(f => 
      f.category === 'data-management' || 
      f.category === 'user-management' || 
      f.category === 'analytics' ||
      f.tags.includes('persistence') ||
      f.tags.includes('storage')
    );

    if (!needsDatabase) return undefined;

    // Determine database type based on features and tech stack
    let dbType: DatabaseType = 'PostgreSQL'; // default

    // Check for specific database requirements
    if (features.some(f => f.tags.includes('document-store') || f.tags.includes('flexible-schema'))) {
      dbType = 'MongoDB';
    } else if (features.some(f => f.tags.includes('graph') || f.tags.includes('relationships'))) {
      dbType = 'Neo4j';
    } else if (features.some(f => f.tags.includes('cache') || f.tags.includes('session'))) {
      dbType = 'Redis';
    } else if (features.some(f => f.tags.includes('search') || f.tags.includes('full-text'))) {
      dbType = 'Elasticsearch';
    } else if (context.complexity === 'simple' && !features.some(f => f.priority === 'critical')) {
      dbType = 'SQLite';
    }

    // Override with tech hints
    if (context.techHints.includes('MongoDB')) dbType = 'MongoDB';
    if (context.techHints.includes('PostgreSQL') || context.techHints.includes('Postgres')) dbType = 'PostgreSQL';
    if (context.techHints.includes('MySQL')) dbType = 'MySQL';
    if (context.techHints.includes('Redis')) dbType = 'Redis';

    return {
      type: dbType,
      name: `${context.detectedType.replace('-', '_')}_db`,
      orm: this.getRecommendedORM(dbType, techStack),
      migrations: true,
      seeding: context.complexity !== 'simple',
      backup: context.complexity === 'complex' || context.complexity === 'very-complex',
      indexing: this.generateIndexingStrategies(features, dbType),
      constraints: this.generateDatabaseConstraints(features)
    };
  }

  private generateMetadata(context: EnhancementContext, originalIdea: string): RequirementsMetadata {
    return {
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'Requirements Enhancer AI',
      stakeholders: [],
      approvals: [],
      changeLog: [{
        version: '1.0.0',
        date: new Date(),
        author: 'Requirements Enhancer AI',
        changes: ['Initial requirements generation', 'AI-enhanced feature analysis', 'Tech stack optimization'],
        impact: 'major' as const,
        reason: 'Initial project requirements based on: ' + originalIdea
      }],
      tags: [...context.keywords, ...context.domains, context.detectedType],
      source: 'ai-generated' as RequirementsSource
    };
  }

  // Helper methods for initialization
  private initializeFeatureTemplates(): Map<FeatureCategory, Feature[]> {
    const templates = new Map<FeatureCategory, Feature[]>();

    // Authentication features
    templates.set('authentication', [
      {
        id: 'auth-1',
        name: 'User Registration',
        description: 'Allow users to create new accounts with email verification',
        category: 'authentication',
        priority: 'critical',
        complexity: 'moderate',
        estimatedHours: 16,
        dependencies: [],
        requirements: ['Email service integration', 'Password validation', 'GDPR compliance'],
        acceptance_criteria: ['User can register with valid email', 'Email verification required', 'Password meets security requirements'],
        tags: ['user', 'email', 'security'],
        status: 'proposed',
        techRequirements: [
          {
            category: 'security',
            requirement: 'Password hashing library (bcrypt/argon2)',
            justification: 'Secure password storage',
            alternatives: ['scrypt', 'pbkdf2'],
            priority: 'critical'
          }
        ]
      },
      {
        id: 'auth-2',
        name: 'User Login',
        description: 'Secure user authentication with session management',
        category: 'authentication',
        priority: 'critical',
        complexity: 'moderate',
        estimatedHours: 12,
        dependencies: ['auth-1'],
        requirements: ['Session management', 'Rate limiting', 'Account lockout'],
        acceptance_criteria: ['Users can login with credentials', 'Session timeout works', 'Failed login attempts are tracked'],
        tags: ['user', 'session', 'security'],
        status: 'proposed',
        techRequirements: []
      }
    ]);

    // User Management features
    templates.set('user-management', [
      {
        id: 'user-1',
        name: 'User Profile Management',
        description: 'Users can view and update their profile information',
        category: 'user-management',
        priority: 'high',
        complexity: 'simple',
        estimatedHours: 8,
        dependencies: ['auth-1'],
        requirements: ['Form validation', 'Image upload', 'Privacy settings'],
        acceptance_criteria: ['Profile data can be updated', 'Profile images can be uploaded', 'Changes are persisted'],
        tags: ['user', 'profile', 'crud'],
        status: 'proposed',
        techRequirements: []
      }
    ]);

    // Add more feature templates for other categories...
    // This is a simplified version - in reality, you'd have comprehensive templates for all categories

    return templates;
  }

  private initializeTechStackTemplates(): Map<ProjectType, TechStack> {
    const templates = new Map<ProjectType, TechStack>();

    templates.set('web-application', {
      frontend: {
        framework: 'React',
        version: '18.x',
        language: 'TypeScript',
        cssFramework: 'Tailwind CSS',
        stateManagement: ['React Context', 'Zustand'],
        buildTool: 'Vite',
        packageManager: 'npm',
        additionalLibraries: ['React Router', 'React Query', 'React Hook Form'],
        designSystem: 'Custom',
        componentLibrary: 'Headless UI'
      },
      backend: {
        runtime: 'Node.js',
        framework: 'Express',
        version: '20.x',
        language: 'TypeScript',
        apiType: 'REST',
        authentication: ['JWT', 'Passport.js'],
        authorization: ['RBAC'],
        middleware: ['cors', 'helmet', 'morgan'],
        logging: ['winston'],
        monitoring: ['express-status-monitor'],
        additionalLibraries: ['express-validator', 'express-rate-limit']
      },
      testing: {
        unit: ['Jest', 'React Testing Library'],
        integration: ['Supertest'],
        e2e: ['Playwright'],
        performance: ['Artillery'],
        security: ['npm audit'],
        coverage: {
          threshold: 80,
          reports: ['html', 'json', 'lcov'],
          exclude: ['dist/', 'coverage/', '*.config.js']
        },
        ci: true
      }
    });

    templates.set('api-service', {
      backend: {
        runtime: 'Node.js',
        framework: 'Fastify',
        version: '20.x',
        language: 'TypeScript',
        apiType: 'REST',
        authentication: ['JWT'],
        authorization: ['RBAC'],
        middleware: ['cors', 'helmet', 'rate-limiting'],
        logging: ['pino'],
        monitoring: ['prometheus'],
        additionalLibraries: ['joi', 'swagger']
      },
      testing: {
        unit: ['Jest'],
        integration: ['Supertest'],
        e2e: ['Newman'],
        performance: ['Artillery'],
        security: ['OWASP ZAP'],
        coverage: {
          threshold: 90,
          reports: ['html', 'json'],
          exclude: ['dist/', 'coverage/']
        },
        ci: true
      }
    });

    // Add more templates for other project types...

    return templates;
  }

  private initializeArchitecturePatterns(): Map<ProjectType, ArchitecturePattern[]> {
    const patterns = new Map<ProjectType, ArchitecturePattern[]>();

    patterns.set('web-application', ['spa', 'ssr', 'monolithic', 'layered']);
    patterns.set('api-service', ['layered', 'microservices', 'serverless']);
    patterns.set('mobile-application', ['mvvm', 'component-based']);
    patterns.set('microservice', ['microservices', 'event-driven']);
    patterns.set('game', ['component-based', 'event-driven']);

    return patterns;
  }

  private initializeDomainKeywords(): Map<string, { type: ProjectType; features: FeatureCategory[] }> {
    const keywords = new Map();

    keywords.set('ecommerce', {
      type: 'web-application' as ProjectType,
      features: ['user-management', 'data-management', 'payment', 'api', 'search'] as FeatureCategory[]
    });

    keywords.set('social', {
      type: 'web-application' as ProjectType,
      features: ['user-management', 'communication', 'real-time', 'notification', 'analytics'] as FeatureCategory[]
    });

    return keywords;
  }

  private initializeComplexityIndicators(): Map<string, ComplexityLevel> {
    const indicators = new Map<string, ComplexityLevel>();

    indicators.set('simple', 'simple');
    indicators.set('basic', 'simple');
    indicators.set('moderate', 'moderate');
    indicators.set('standard', 'moderate');
    indicators.set('complex', 'complex');
    indicators.set('advanced', 'complex');
    indicators.set('enterprise', 'very-complex');
    indicators.set('large-scale', 'very-complex');

    return indicators;
  }

  // Additional helper methods (simplified implementations)
  private getDefaultOptions(): EnhancementOptions {
    return {
      includeAdvancedFeatures: true,
      optimizeForScaling: true,
      includeSecurityFeatures: true,
      includeTestingFramework: true,
      includeMonitoring: true,
      includeDocumentation: true,
      targetAudience: 'intermediate'
    };
  }

  private generateId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTitle(context: EnhancementContext, originalIdea: string): string {
    const maxLength = 80;
    let title = originalIdea;
    
    // Clean and capitalize
    title = title.replace(/[^\w\s-]/g, '').trim();
    title = title.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    
    // Add type suffix if not already present
    const typeWords = context.detectedType.split('-').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
    
    if (!title.toLowerCase().includes(typeWords.toLowerCase())) {
      title = `${title} - ${typeWords}`;
    }
    
    // Truncate if too long
    if (title.length > maxLength) {
      title = title.substring(0, maxLength - 3) + '...';
    }
    
    return title;
  }

  // Placeholder implementations for complex methods that would need full implementation
  private getCoreFeatures(projectType: ProjectType): Feature[] {
    // Basic core features for any project type
    const baseFeatures: Feature[] = [
      {
        id: 'core-setup',
        name: 'Project Setup',
        description: 'Initial project structure and configuration',
        category: 'deployment',
        priority: 'critical',
        complexity: 'simple',
        estimatedHours: 8,
        dependencies: [],
        requirements: ['Development environment'],
        acceptance_criteria: ['Project builds successfully', 'Development server runs'],
        tags: ['setup', 'configuration'],
        status: 'proposed',
        techRequirements: []
      }
    ];
    return baseFeatures;
  }

  private getDomainFeatures(domain: string): Feature[] {
    return [];
  }

  private getKeywordFeatures(keywords: string[]): Feature[] {
    return [];
  }

  private getAdvancedFeatures(context: EnhancementContext): Feature[] {
    return [];
  }

  private getSecurityFeatures(): Feature[] {
    return [];
  }

  private getTestingFeatures(): Feature[] {
    return [];
  }

  private getMonitoringFeatures(): Feature[] {
    return [];
  }

  private getDefaultTechStack(): TechStack {
    return {
      frontend: {
        framework: 'React',
        language: 'TypeScript',
        buildTool: 'Vite',
        packageManager: 'npm',
        additionalLibraries: []
      }
    };
  }

  private applyTechHints(techStack: TechStack, techHints: string[]): TechStack {
    // Apply technology hints to tech stack
    // Simplified implementation
    return techStack;
  }

  private optimizeTechStackForFeatures(techStack: TechStack, features: Feature[]): TechStack {
    // Optimize tech stack based on features
    // Simplified implementation
    return techStack;
  }

  private applyComplexityOptimizations(techStack: TechStack, complexity: ComplexityLevel, options: EnhancementOptions): TechStack {
    // Apply optimizations based on complexity
    // Simplified implementation
    return techStack;
  }

  private ensureTechStackConsistency(techStack: TechStack): TechStack {
    // Ensure tech stack consistency
    // Simplified implementation
    return techStack;
  }

  private generateDeploymentConfig(techStack: TechStack, architecture: ArchitecturePattern, options: EnhancementOptions): any {
    // Generate deployment configuration
    // Simplified implementation
    return {
      platform: ['Vercel', 'Netlify'],
      containerization: options.optimizeForScaling ? { technology: 'Docker' as const, registry: 'Docker Hub', optimization: [] } : undefined,
      cicd: {
        provider: ['GitHub Actions'],
        triggers: [{ type: 'push' as const, branches: ['main'] }],
        stages: [],
        environments: [],
        approvals: false,
        rollback: true
      }
    };
  }

  // Additional placeholder methods with simplified implementations
  private groupFeaturesByPhases(features: Feature[]): Record<string, Feature[]> {
    return {
      'Planning & Design': features.filter(f => f.priority === 'critical').slice(0, 3),
      'Core Development': features.filter(f => f.priority === 'high'),
      'Feature Enhancement': features.filter(f => f.priority === 'medium'),
      'Testing & Optimization': features.filter(f => f.category === 'testing'),
      'Production Deployment': []
    };
  }

  private generatePhaseDeliverables(phaseName: string, features: Feature[]): any[] {
    return [
      {
        id: `deliverable-${phaseName.toLowerCase().replace(/\s+/g, '-')}`,
        name: `${phaseName} Implementation`,
        description: `Complete implementation of ${phaseName.toLowerCase()} features`,
        type: 'code' as const,
        acceptance_criteria: ['All features implemented', 'Tests passing', 'Documentation complete'],
        reviewer: 'Tech Lead'
      }
    ];
  }

  private generatePhaseRisks(phaseName: string, complexity: ComplexityLevel): any[] {
    return [
      {
        id: `risk-${phaseName.toLowerCase().replace(/\s+/g, '-')}`,
        description: `${phaseName} may face technical challenges`,
        probability: 'medium' as const,
        impact: 'moderate' as const,
        mitigation: ['Regular code reviews', 'Pair programming', 'Technical spikes'],
        contingency: ['Additional resources', 'Scope reduction'],
        owner: 'Tech Lead'
      }
    ];
  }

  private generateResourceRequirements(phaseName: string, features: Feature[]): any[] {
    return [
      {
        role: 'Full-Stack Developer',
        skillLevel: 'mid' as const,
        allocation: 100,
        duration: 30,
        responsibilities: [`Implement ${phaseName.toLowerCase()} features`, 'Write tests', 'Create documentation']
      }
    ];
  }

  private generatePhaseDependencies(phases: any[]): any[] {
    const dependencies = [];
    for (let i = 1; i < phases.length; i++) {
      dependencies.push({
        from: phases[i - 1].id,
        to: phases[i].id,
        type: 'finish-start' as const
      });
    }
    return dependencies;
  }

  private calculateCriticalPath(phases: any[]): string[] {
    return phases.map(p => p.id);
  }

  private getBaseTeamRoles(complexity: ComplexityLevel): any[] {
    const baseRoles = [
      {
        name: 'Full-Stack Developer',
        count: complexity === 'simple' ? 1 : complexity === 'moderate' ? 2 : 3,
        responsibilities: ['Frontend development', 'Backend development', 'API integration'],
        skills: ['JavaScript/TypeScript', 'React', 'Node.js', 'Database'],
        seniority: 'mid' as const,
        collaboration: ['Designer', 'QA Engineer']
      }
    ];

    if (complexity !== 'simple') {
      baseRoles.push({
        name: 'QA Engineer',
        count: 1,
        responsibilities: ['Test planning', 'Manual testing', 'Automation'],
        skills: ['Testing frameworks', 'Test automation', 'Bug tracking'],
        seniority: 'mid' as const,
        collaboration: ['Developer', 'Product Owner']
      });
    }

    return baseRoles;
  }

  private getTechSpecificRoles(techStack: TechStack): any[] {
    // Return roles based on tech stack
    return [];
  }

  private getFeatureSpecificRoles(features: Feature[]): any[] {
    // Return roles based on features
    return [];
  }

  private mergeTeamRoles(roles: any[]): any[] {
    // Merge and deduplicate roles
    const uniqueRoles = new Map();
    for (const role of roles) {
      if (uniqueRoles.has(role.name)) {
        uniqueRoles.get(role.name).count += role.count;
      } else {
        uniqueRoles.set(role.name, role);
      }
    }
    return Array.from(uniqueRoles.values());
  }

  private generateSkillRequirements(roles: any[], techStack: TechStack): any[] {
    return [
      {
        category: 'technical' as const,
        skills: ['TypeScript', 'React', 'Node.js'],
        level: 'mid' as const,
        priority: 'critical' as const,
        training: false
      }
    ];
  }

  private determineTeamStructure(teamSize: number, complexity: ComplexityLevel): any {
    if (teamSize <= 3) return 'small-team';
    if (teamSize <= 8) return 'cross-functional';
    return 'specialized';
  }

  private generateCommunicationPlan(teamSize: number, complexity: ComplexityLevel): any {
    return {
      meetings: ['standup' as const, 'planning' as const, 'review' as const],
      tools: ['Slack', 'Zoom', 'Notion'],
      reporting: [{ schedule: 'weekly' as const }],
      escalation: []
    };
  }

  private suggestDevelopmentMethodology(teamSize: number, complexity: ComplexityLevel): any {
    if (teamSize <= 3) return 'kanban';
    return 'agile';
  }

  private getRecommendedORM(dbType: DatabaseType, techStack: TechStack): string {
    const ormMap: Record<DatabaseType, string> = {
      'PostgreSQL': 'Prisma',
      'MySQL': 'Prisma',
      'SQLite': 'Prisma',
      'MongoDB': 'Mongoose',
      'Redis': 'ioredis',
      'Elasticsearch': 'elasticsearch',
      'DynamoDB': 'DynamoDB SDK',
      'Firestore': 'Firebase SDK',
      'CouchDB': 'nano',
      'Neo4j': 'neo4j-driver',
      'InfluxDB': 'influxdb-client',
      'Cassandra': 'cassandra-driver',
      'MariaDB': 'Prisma',
      'Oracle': 'oracledb',
      'SQL Server': 'tedious'
    };
    
    return ormMap[dbType] || 'Prisma';
  }

  private generateIndexingStrategies(features: Feature[], dbType: DatabaseType): any[] {
    return [
      {
        type: 'btree' as const,
        fields: ['id'],
        unique: true,
        partial: false
      }
    ];
  }

  private generateDatabaseConstraints(features: Feature[]): any[] {
    return [
      {
        type: 'primary-key' as const,
        fields: ['id'],
        reference: undefined,
        condition: undefined
      }
    ];
  }
}