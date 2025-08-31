import { RequirementsEnhancer, EnhancementOptions } from './RequirementsEnhancer';
import { RequirementsValidator } from './RequirementsValidator';
import {
  Requirements,
  ValidationResult,
  ProjectOptions,
  ProjectType,
  ComplexityLevel,
  ProjectScope,
  TechStack,
  Feature,
  DatabaseConfig
} from './types';

export interface RequirementsGenerationOptions {
  projectIdea: string;
  projectOptions?: ProjectOptions;
  enhancementOptions?: EnhancementOptions;
  validateOutput?: boolean;
  optimizeForCompatibility?: boolean;
  includeValidationReport?: boolean;
  targetAudience?: 'beginner' | 'intermediate' | 'advanced';
  budgetConstraint?: string;
  timelineConstraint?: number; // in days
  teamSizeConstraint?: number;
  preferredTechnologies?: string[];
  avoidTechnologies?: string[];
  complianceRequirements?: string[];
  performanceRequirements?: {
    maxResponseTime?: number;
    expectedUsers?: number;
    dataVolume?: string;
  };
}

export interface GenerationResult {
  requirements: Requirements;
  validationResult?: ValidationResult;
  optimizedRequirements?: Requirements;
  warnings: string[];
  recommendations: string[];
  processingTime: number;
  confidence: number;
  metadata: {
    version: string;
    generatedAt: Date;
    generator: string;
    inputHash: string;
    iterations: number;
  };
}

export class RequirementsGenerator {
  private enhancer: RequirementsEnhancer;
  private validator: RequirementsValidator;
  private readonly MAX_OPTIMIZATION_ITERATIONS = 3;

  constructor() {
    this.enhancer = new RequirementsEnhancer();
    this.validator = new RequirementsValidator();
  }

  async generateRequirements(options: RequirementsGenerationOptions): Promise<GenerationResult> {
    const startTime = Date.now();
    console.log('🚀 Starting requirements generation...');

    try {
      // 1. Input validation and preprocessing
      const processedOptions = await this.preprocessOptions(options);

      // 2. Generate enhanced requirements
      console.log('📝 Generating enhanced requirements...');
      const enhancementOptions = this.buildEnhancementOptions(processedOptions);
      let requirements = await this.enhancer.enhanceRequirements(
        processedOptions.projectIdea,
        enhancementOptions
      );

      // 3. Apply constraints and preferences
      requirements = await this.applyConstraints(requirements, processedOptions);
      requirements = await this.applyPreferences(requirements, processedOptions);

      let validationResult: ValidationResult | undefined;
      let optimizedRequirements: Requirements | undefined;
      const warnings: string[] = [];
      const recommendations: string[] = [];
      let iterations = 1;

      // 4. Validation and optimization loop
      if (processedOptions.validateOutput) {
        console.log('🔍 Validating requirements...');
        validationResult = await this.validator.validateRequirements(requirements);

        // 5. Optimization iterations if needed
        if (processedOptions.optimizeForCompatibility && !validationResult.isValid) {
          console.log('⚡ Optimizing requirements for compatibility...');
          const optimizationResult = await this.optimizeRequirements(
            requirements,
            validationResult,
            processedOptions
          );
          optimizedRequirements = optimizationResult.requirements;
          iterations = optimizationResult.iterations;

          // Re-validate optimized requirements
          if (optimizedRequirements) {
            validationResult = await this.validator.validateRequirements(optimizedRequirements);
          }
        }
      }

      // 6. Generate warnings and recommendations
      if (validationResult) {
        warnings.push(...this.extractWarnings(validationResult));
        recommendations.push(...this.extractRecommendations(validationResult));
      }

      // 7. Calculate confidence score
      const confidence = this.calculateConfidence(
        requirements,
        validationResult,
        processedOptions
      );

      // 8. Final quality checks
      const finalRequirements = optimizedRequirements || requirements;
      await this.performFinalQualityChecks(finalRequirements, warnings);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Requirements generation completed in ${processingTime}ms`);

      return {
        requirements: finalRequirements,
        validationResult: processedOptions.includeValidationReport ? validationResult : undefined,
        optimizedRequirements: optimizedRequirements !== requirements ? optimizedRequirements : undefined,
        warnings,
        recommendations,
        processingTime,
        confidence,
        metadata: {
          version: '1.0.0',
          generatedAt: new Date(),
          generator: 'AgentWise Requirements Generator',
          inputHash: this.generateInputHash(options),
          iterations
        }
      };

    } catch (error) {
      console.error('❌ Requirements generation failed:', error);
      throw new Error(`Requirements generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateMultipleOptions(
    options: RequirementsGenerationOptions,
    variants: number = 3
  ): Promise<GenerationResult[]> {
    console.log(`🔄 Generating ${variants} requirement variants...`);

    const baseOptions = { ...options };
    const results: GenerationResult[] = [];

    for (let i = 0; i < variants; i++) {
      // Create variations in the options
      const variantOptions = this.createVariant(baseOptions, i, variants);
      
      try {
        const result = await this.generateRequirements(variantOptions);
        results.push(result);
        console.log(`✅ Generated variant ${i + 1}/${variants}`);
      } catch (error) {
        console.warn(`⚠️ Failed to generate variant ${i + 1}:`, error);
        // Continue with other variants
      }
    }

    // Sort by confidence score (highest first)
    results.sort((a, b) => b.confidence - a.confidence);

    console.log(`🏆 Generated ${results.length} successful variants`);
    return results;
  }

  async compareRequirements(requirements1: Requirements, requirements2: Requirements): Promise<{
    similarities: string[];
    differences: string[];
    recommendations: string[];
    betterChoice?: 'first' | 'second' | 'neither';
    reasoning: string;
  }> {
    console.log('🔄 Comparing requirements...');

    const similarities: string[] = [];
    const differences: string[] = [];
    const recommendations: string[] = [];

    // Compare basic properties
    if (requirements1.projectType === requirements2.projectType) {
      similarities.push(`Both are ${requirements1.projectType} projects`);
    } else {
      differences.push(`Project type: ${requirements1.projectType} vs ${requirements2.projectType}`);
    }

    if (requirements1.complexity === requirements2.complexity) {
      similarities.push(`Both have ${requirements1.complexity} complexity`);
    } else {
      differences.push(`Complexity: ${requirements1.complexity} vs ${requirements2.complexity}`);
    }

    if (requirements1.architecture === requirements2.architecture) {
      similarities.push(`Both use ${requirements1.architecture} architecture`);
    } else {
      differences.push(`Architecture: ${requirements1.architecture} vs ${requirements2.architecture}`);
    }

    // Compare features
    const features1 = new Set(requirements1.features.map(f => f.name));
    const features2 = new Set(requirements2.features.map(f => f.name));
    const commonFeatures = Array.from(features1).filter(f => features2.has(f));
    const uniqueFeatures1 = Array.from(features1).filter(f => !features2.has(f));
    const uniqueFeatures2 = Array.from(features2).filter(f => !features1.has(f));

    if (commonFeatures.length > 0) {
      similarities.push(`Common features: ${commonFeatures.join(', ')}`);
    }

    if (uniqueFeatures1.length > 0) {
      differences.push(`First has unique features: ${uniqueFeatures1.join(', ')}`);
    }

    if (uniqueFeatures2.length > 0) {
      differences.push(`Second has unique features: ${uniqueFeatures2.join(', ')}`);
    }

    // Compare tech stacks
    const techStackComparison = this.compareTechStacks(requirements1.techStack, requirements2.techStack);
    similarities.push(...techStackComparison.similarities);
    differences.push(...techStackComparison.differences);

    // Generate recommendations
    recommendations.push('Consider combining the best aspects of both approaches');
    if (uniqueFeatures1.length > 0 || uniqueFeatures2.length > 0) {
      recommendations.push('Evaluate which unique features provide the most value');
    }
    if (requirements1.complexity !== requirements2.complexity) {
      recommendations.push('Choose complexity level based on team capabilities and timeline');
    }

    // Determine better choice
    const score1 = this.scoreRequirements(requirements1);
    const score2 = this.scoreRequirements(requirements2);
    
    let betterChoice: 'first' | 'second' | 'neither' = 'neither';
    let reasoning = 'Both requirements are comparable in quality';

    if (score1 > score2 + 10) {
      betterChoice = 'first';
      reasoning = 'First requirements have significantly more comprehensive features and better structure';
    } else if (score2 > score1 + 10) {
      betterChoice = 'second';
      reasoning = 'Second requirements have significantly more comprehensive features and better structure';
    }

    return {
      similarities,
      differences,
      recommendations,
      betterChoice,
      reasoning
    };
  }

  async exportRequirements(
    requirements: Requirements,
    format: 'json' | 'yaml' | 'markdown' | 'pdf' = 'json'
  ): Promise<string> {
    console.log(`📤 Exporting requirements as ${format}...`);

    switch (format) {
      case 'json':
        return JSON.stringify(requirements, null, 2);
      
      case 'yaml':
        return this.convertToYaml(requirements);
      
      case 'markdown':
        return this.convertToMarkdown(requirements);
      
      case 'pdf':
        // This would require a PDF generation library
        throw new Error('PDF export not implemented - would require PDF generation library');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  private async preprocessOptions(options: RequirementsGenerationOptions): Promise<RequirementsGenerationOptions> {
    // Set defaults
    const processed: RequirementsGenerationOptions = {
      ...options,
      projectOptions: options.projectOptions || this.getDefaultProjectOptions(),
      enhancementOptions: options.enhancementOptions || this.getDefaultEnhancementOptions(),
      validateOutput: options.validateOutput ?? true,
      optimizeForCompatibility: options.optimizeForCompatibility ?? true,
      includeValidationReport: options.includeValidationReport ?? true,
      targetAudience: options.targetAudience || 'intermediate'
    };

    // Validate project idea
    if (!processed.projectIdea || processed.projectIdea.trim().length < 10) {
      throw new Error('Project idea must be at least 10 characters long');
    }

    // Clean and normalize project idea
    processed.projectIdea = processed.projectIdea.trim();

    return processed;
  }

  private buildEnhancementOptions(options: RequirementsGenerationOptions): EnhancementOptions {
    return {
      includeAdvancedFeatures: options.targetAudience === 'advanced',
      optimizeForScaling: options.performanceRequirements?.expectedUsers ? options.performanceRequirements.expectedUsers > 1000 : true,
      includeSecurityFeatures: true,
      includeTestingFramework: options.targetAudience !== 'beginner',
      includeMonitoring: options.targetAudience === 'advanced',
      includeDocumentation: true,
      targetAudience: options.targetAudience || 'intermediate',
      budgetConstraint: options.budgetConstraint,
      timelineConstraint: options.timelineConstraint,
      ...options.enhancementOptions
    };
  }

  private async applyConstraints(
    requirements: Requirements,
    options: RequirementsGenerationOptions
  ): Promise<Requirements> {
    const constrainedRequirements = { ...requirements };

    // Apply team size constraint
    if (options.teamSizeConstraint) {
      constrainedRequirements.team = {
        ...constrainedRequirements.team,
        size: Math.min(constrainedRequirements.team.size, options.teamSizeConstraint)
      };
    }

    // Apply timeline constraint
    if (options.timelineConstraint) {
      if (constrainedRequirements.timeline.totalDuration > options.timelineConstraint) {
        // Reduce scope to fit timeline
        constrainedRequirements.features = this.prioritizeFeatures(
          constrainedRequirements.features,
          options.timelineConstraint,
          constrainedRequirements.team.size
        );

        // Recalculate timeline
        constrainedRequirements.timeline = this.recalculateTimeline(
          constrainedRequirements.features,
          constrainedRequirements.team.size,
          options.timelineConstraint
        );
      }
    }

    // Apply compliance requirements
    if (options.complianceRequirements && options.complianceRequirements.length > 0) {
      constrainedRequirements.features = this.addComplianceFeatures(
        constrainedRequirements.features,
        options.complianceRequirements
      );
    }

    // Apply performance requirements
    if (options.performanceRequirements) {
      constrainedRequirements.features = this.addPerformanceFeatures(
        constrainedRequirements.features,
        options.performanceRequirements
      );
    }

    return constrainedRequirements;
  }

  private async applyPreferences(
    requirements: Requirements,
    options: RequirementsGenerationOptions
  ): Promise<Requirements> {
    let modifiedRequirements = { ...requirements };

    // Apply preferred technologies
    if (options.preferredTechnologies && options.preferredTechnologies.length > 0) {
      modifiedRequirements.techStack = this.applyTechPreferences(
        modifiedRequirements.techStack,
        options.preferredTechnologies,
        'prefer'
      );
    }

    // Avoid specified technologies
    if (options.avoidTechnologies && options.avoidTechnologies.length > 0) {
      modifiedRequirements.techStack = this.applyTechPreferences(
        modifiedRequirements.techStack,
        options.avoidTechnologies,
        'avoid'
      );
    }

    return modifiedRequirements;
  }

  private async optimizeRequirements(
    requirements: Requirements,
    validationResult: ValidationResult,
    options: RequirementsGenerationOptions
  ): Promise<{ requirements: Requirements; iterations: number }> {
    let currentRequirements = { ...requirements };
    let iterations = 0;

    while (iterations < this.MAX_OPTIMIZATION_ITERATIONS) {
      iterations++;
      console.log(`🔧 Optimization iteration ${iterations}...`);

      // Apply fixes for critical errors
      for (const error of validationResult.errors) {
        if (error.severity === 'critical' && error.fix?.applicable) {
          currentRequirements = await this.applyFix(currentRequirements, error);
        }
      }

      // Apply high-impact recommendations
      for (const recommendation of validationResult.recommendations) {
        if (recommendation.priority === 'high' && recommendation.effort !== 'very-high') {
          currentRequirements = await this.applyRecommendation(currentRequirements, recommendation);
        }
      }

      // Re-validate to see if we've improved
      const newValidationResult = await this.validator.validateRequirements(currentRequirements);
      
      if (newValidationResult.isValid || newValidationResult.score.overall >= validationResult.score.overall + 10) {
        console.log(`✅ Optimization successful after ${iterations} iterations`);
        break;
      }

      validationResult = newValidationResult;
    }

    return { requirements: currentRequirements, iterations };
  }

  private extractWarnings(validationResult: ValidationResult): string[] {
    return validationResult.warnings.map(w => `${w.category}: ${w.message}`);
  }

  private extractRecommendations(validationResult: ValidationResult): string[] {
    return validationResult.recommendations
      .filter(r => r.priority === 'high' || r.priority === 'critical')
      .map(r => `${r.category}: ${r.title} - ${r.description}`);
  }

  private calculateConfidence(
    requirements: Requirements,
    validationResult?: ValidationResult,
    options?: RequirementsGenerationOptions
  ): number {
    let confidence = 70; // Base confidence

    // Factor in validation results
    if (validationResult) {
      confidence = validationResult.score.overall * 0.3 + confidence * 0.7;
      
      // Reduce confidence for critical errors
      const criticalErrors = validationResult.errors.filter(e => e.severity === 'critical').length;
      confidence -= criticalErrors * 10;
      
      // Increase confidence for comprehensive features
      if (requirements.features.length >= 8) confidence += 5;
      if (requirements.features.length >= 15) confidence += 5;
    }

    // Factor in completeness
    if (requirements.database) confidence += 3;
    if (requirements.constraints.length > 0) confidence += 2;
    if (requirements.techStack.testing) confidence += 5;
    if (requirements.techStack.deployment) confidence += 3;

    // Factor in complexity appropriateness
    const featureComplexityScore = this.assessFeatureComplexityAlignment(requirements);
    confidence += featureComplexityScore;

    return Math.max(0, Math.min(100, Math.round(confidence)));
  }

  private async performFinalQualityChecks(
    requirements: Requirements,
    warnings: string[]
  ): Promise<void> {
    // Check for essential components
    if (!requirements.techStack.testing) {
      warnings.push('No testing framework specified - consider adding automated testing');
    }

    if (!requirements.database && requirements.features.some(f => f.category === 'data-management')) {
      warnings.push('Data management features present but no database configured');
    }

    if (requirements.team.size === 1 && requirements.complexity === 'very-complex') {
      warnings.push('Single person team for very complex project - consider increasing team size');
    }

    // Check timeline realism
    const totalEffort = requirements.features.reduce((sum, f) => sum + f.estimatedHours, 0);
    const teamCapacity = requirements.team.size * requirements.timeline.totalDuration * 6; // 6 hours/day
    
    if (totalEffort > teamCapacity * 1.2) {
      warnings.push('Timeline may be too aggressive for the planned scope');
    }
  }

  private createVariant(
    baseOptions: RequirementsGenerationOptions,
    variantIndex: number,
    totalVariants: number
  ): RequirementsGenerationOptions {
    const variant = { ...baseOptions };

    // Create variations based on variant index
    switch (variantIndex) {
      case 0:
        // Conservative variant
        variant.enhancementOptions = {
          ...variant.enhancementOptions,
          includeAdvancedFeatures: false,
          targetAudience: 'beginner'
        };
        break;
      
      case 1:
        // Balanced variant (default)
        variant.enhancementOptions = {
          ...variant.enhancementOptions,
          includeAdvancedFeatures: true,
          targetAudience: 'intermediate'
        };
        break;
      
      case 2:
        // Advanced variant
        variant.enhancementOptions = {
          ...variant.enhancementOptions,
          includeAdvancedFeatures: true,
          includeMonitoring: true,
          optimizeForScaling: true,
          targetAudience: 'advanced'
        };
        break;
      
      default:
        // Additional variants with random variations
        const isAdvanced = Math.random() > 0.5;
        variant.enhancementOptions = {
          ...variant.enhancementOptions,
          includeAdvancedFeatures: isAdvanced,
          includeMonitoring: isAdvanced,
          targetAudience: isAdvanced ? 'advanced' : 'intermediate'
        };
    }

    return variant;
  }

  private compareTechStacks(stack1: TechStack, stack2: TechStack): {
    similarities: string[];
    differences: string[];
  } {
    const similarities: string[] = [];
    const differences: string[] = [];

    // Compare frontend
    if (stack1.frontend && stack2.frontend) {
      if (stack1.frontend.framework === stack2.frontend.framework) {
        similarities.push(`Both use ${stack1.frontend.framework} frontend`);
      } else {
        differences.push(`Frontend: ${stack1.frontend.framework} vs ${stack2.frontend.framework}`);
      }

      if (stack1.frontend.language === stack2.frontend.language) {
        similarities.push(`Both use ${stack1.frontend.language} for frontend`);
      } else {
        differences.push(`Frontend language: ${stack1.frontend.language} vs ${stack2.frontend.language}`);
      }
    }

    // Compare backend
    if (stack1.backend && stack2.backend) {
      if (stack1.backend.framework === stack2.backend.framework) {
        similarities.push(`Both use ${stack1.backend.framework} backend`);
      } else {
        differences.push(`Backend: ${stack1.backend.framework} vs ${stack2.backend.framework}`);
      }
    }

    // Compare database
    if (stack1.database?.primary && stack2.database?.primary) {
      if (stack1.database.primary.type === stack2.database.primary.type) {
        similarities.push(`Both use ${stack1.database.primary.type} database`);
      } else {
        differences.push(`Database: ${stack1.database.primary.type} vs ${stack2.database.primary.type}`);
      }
    }

    return { similarities, differences };
  }

  private scoreRequirements(requirements: Requirements): number {
    let score = 0;

    // Feature completeness
    score += requirements.features.length * 2;
    score += requirements.features.filter(f => f.priority === 'critical').length * 3;
    score += requirements.features.filter(f => f.acceptance_criteria.length > 0).length * 2;

    // Tech stack completeness
    if (requirements.techStack.frontend) score += 10;
    if (requirements.techStack.backend) score += 10;
    if (requirements.techStack.database) score += 8;
    if (requirements.techStack.testing) score += 8;
    if (requirements.techStack.deployment) score += 6;

    // Team and timeline realism
    if (requirements.team.size > 0) score += 5;
    if (requirements.timeline.bufferTime > 0) score += 5;
    if (requirements.constraints.length > 0) score += 3;

    return score;
  }

  private convertToYaml(requirements: Requirements): string {
    // Simplified YAML conversion - in production would use a proper YAML library
    const yaml = [
      `title: "${requirements.title}"`,
      `description: |`,
      `  ${requirements.description.split('\n').join('\n  ')}`,
      `projectType: ${requirements.projectType}`,
      `complexity: ${requirements.complexity}`,
      `architecture: ${requirements.architecture}`,
      ``,
      `features:`,
      ...requirements.features.map(f => [
        `  - name: "${f.name}"`,
        `    description: "${f.description}"`,
        `    priority: ${f.priority}`,
        `    category: ${f.category}`,
        `    estimatedHours: ${f.estimatedHours}`
      ].join('\n')),
      ``,
      `techStack:`,
      requirements.techStack.frontend ? [
        `  frontend:`,
        `    framework: ${requirements.techStack.frontend.framework}`,
        `    language: ${requirements.techStack.frontend.language}`
      ].join('\n') : '',
      requirements.techStack.backend ? [
        `  backend:`,
        `    runtime: ${requirements.techStack.backend.runtime}`,
        `    framework: ${requirements.techStack.backend.framework}`
      ].join('\n') : ''
    ].filter(Boolean).join('\n');

    return yaml;
  }

  private convertToMarkdown(requirements: Requirements): string {
    const sections = [
      `# ${requirements.title}`,
      ``,
      `## Overview`,
      requirements.description,
      ``,
      `**Project Type:** ${requirements.projectType}`,
      `**Complexity:** ${requirements.complexity}`,
      `**Architecture:** ${requirements.architecture}`,
      ``,
      `## Features`,
      ``,
      ...requirements.features.map(f => 
        `### ${f.name} (${f.priority} priority)\n${f.description}\n`
      ),
      `## Tech Stack`,
      ``,
      requirements.techStack.frontend ? [
        `### Frontend`,
        `- **Framework:** ${requirements.techStack.frontend.framework}`,
        `- **Language:** ${requirements.techStack.frontend.language}`,
        requirements.techStack.frontend.cssFramework ? `- **CSS Framework:** ${requirements.techStack.frontend.cssFramework}` : '',
        `- **Build Tool:** ${requirements.techStack.frontend.buildTool}`,
        ``
      ].filter(Boolean).join('\n') : '',
      requirements.techStack.backend ? [
        `### Backend`,
        `- **Runtime:** ${requirements.techStack.backend.runtime}`,
        `- **Framework:** ${requirements.techStack.backend.framework}`,
        `- **Language:** ${requirements.techStack.backend.language}`,
        `- **API Type:** ${requirements.techStack.backend.apiType}`,
        ``
      ].join('\n') : '',
      requirements.database ? [
        `### Database`,
        `- **Type:** ${requirements.database.type}`,
        `- **ORM:** ${requirements.database.orm || 'Not specified'}`,
        ``
      ].join('\n') : '',
      `## Timeline`,
      ``,
      `**Total Duration:** ${requirements.timeline.totalDuration} days`,
      `**Buffer Time:** ${requirements.timeline.bufferTime} days`,
      `**Phases:** ${requirements.timeline.phases.length}`,
      ``,
      `## Team`,
      ``,
      `**Size:** ${requirements.team.size} members`,
      `**Structure:** ${requirements.team.structure}`,
      `**Methodology:** ${requirements.team.development}`,
      ``
    ].filter(Boolean);

    return sections.join('\n');
  }

  // Helper methods with simplified implementations
  private getDefaultProjectOptions(): ProjectOptions {
    return {
      generateSampleData: true,
      includeTestData: true,
      generateDocumentation: true,
      includeSecurityFeatures: true,
      optimizeForPerformance: true,
      includeAnalytics: false,
      generateAPIDocumentation: true,
      includeErrorHandling: true,
      includeLogging: true,
      includeMonitoring: false,
      containerized: false,
      cloudReady: true,
      mobileOptimized: true,
      accessibilityCompliant: true,
      internationalized: false,
      seoOptimized: true,
      pwа: false,
      offlineCapable: false
    };
  }

  private getDefaultEnhancementOptions(): EnhancementOptions {
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

  private generateInputHash(options: RequirementsGenerationOptions): string {
    // Simple hash generation - in production would use proper hashing
    const input = JSON.stringify({
      idea: options.projectIdea,
      audience: options.targetAudience,
      budget: options.budgetConstraint,
      timeline: options.timelineConstraint
    });
    
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  private prioritizeFeatures(features: Feature[], maxDays: number, teamSize: number): Feature[] {
    const maxHours = maxDays * teamSize * 6; // 6 productive hours per day
    let totalHours = 0;
    const prioritizedFeatures: Feature[] = [];

    // Sort by priority and complexity
    const sortedFeatures = [...features].sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1, 'optional': 0 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      const complexityOrder = { 'simple': 1, 'moderate': 2, 'complex': 3, 'very-complex': 4 };
      return complexityOrder[a.complexity] - complexityOrder[b.complexity];
    });

    for (const feature of sortedFeatures) {
      if (totalHours + feature.estimatedHours <= maxHours) {
        prioritizedFeatures.push(feature);
        totalHours += feature.estimatedHours;
      } else if (feature.priority === 'critical') {
        // Always include critical features, even if over budget
        prioritizedFeatures.push(feature);
        totalHours += feature.estimatedHours;
      }
    }

    return prioritizedFeatures;
  }

  private recalculateTimeline(features: Feature[], teamSize: number, maxDays: number): any {
    // Simplified timeline recalculation
    const totalHours = features.reduce((sum, f) => sum + f.estimatedHours, 0);
    const workingHoursPerDay = teamSize * 6;
    const calculatedDays = Math.ceil(totalHours / workingHoursPerDay);
    const actualDays = Math.min(calculatedDays, maxDays);
    
    return {
      phases: [
        {
          id: 'phase-1',
          name: 'Development',
          description: 'Core development phase',
          duration: actualDays * 0.8,
          features: features.map(f => f.id),
          deliverables: [],
          risks: [],
          resources: []
        },
        {
          id: 'phase-2',
          name: 'Testing & Deployment',
          description: 'Testing and deployment phase',
          duration: actualDays * 0.2,
          features: [],
          deliverables: [],
          risks: [],
          resources: []
        }
      ],
      totalDuration: actualDays,
      milestones: [],
      dependencies: [],
      bufferTime: Math.ceil(actualDays * 0.1),
      criticalPath: ['phase-1', 'phase-2']
    };
  }

  private addComplianceFeatures(features: Feature[], requirements: string[]): Feature[] {
    // Add compliance-related features based on requirements
    const additionalFeatures: Feature[] = [];
    
    for (const req of requirements) {
      if (req.toLowerCase().includes('gdpr')) {
        additionalFeatures.push({
          id: 'compliance-gdpr',
          name: 'GDPR Compliance',
          description: 'Implement GDPR compliance features including data consent and right to deletion',
          category: 'security',
          priority: 'critical',
          complexity: 'complex',
          estimatedHours: 40,
          dependencies: [],
          requirements: ['Data consent management', 'Data deletion capabilities'],
          acceptance_criteria: ['Cookie consent implemented', 'Data deletion endpoint available'],
          tags: ['compliance', 'gdpr', 'privacy'],
          status: 'proposed',
          techRequirements: []
        });
      }
    }
    
    return [...features, ...additionalFeatures];
  }

  private addPerformanceFeatures(features: Feature[], requirements: any): Feature[] {
    const additionalFeatures: Feature[] = [];
    
    if (requirements.expectedUsers && requirements.expectedUsers > 1000) {
      additionalFeatures.push({
        id: 'performance-scaling',
        name: 'Performance Scaling',
        description: 'Implement caching and performance optimization for high user load',
        category: 'performance',
        priority: 'high',
        complexity: 'complex',
        estimatedHours: 32,
        dependencies: [],
        requirements: ['Caching layer', 'Load balancing', 'Performance monitoring'],
        acceptance_criteria: ['Response time under 200ms', 'Handles concurrent users'],
        tags: ['performance', 'scaling', 'caching'],
        status: 'proposed',
        techRequirements: []
      });
    }
    
    return [...features, ...additionalFeatures];
  }

  private applyTechPreferences(
    techStack: TechStack,
    technologies: string[],
    action: 'prefer' | 'avoid'
  ): TechStack {
    const modifiedStack = { ...techStack };
    
    // This would contain sophisticated logic to apply tech preferences
    // For now, simplified implementation
    
    return modifiedStack;
  }

  private async applyFix(requirements: Requirements, error: any): Promise<Requirements> {
    // Apply automated fixes based on error type
    // Simplified implementation
    return requirements;
  }

  private async applyRecommendation(requirements: Requirements, recommendation: any): Promise<Requirements> {
    // Apply recommendations to improve requirements
    // Simplified implementation
    return requirements;
  }

  private assessFeatureComplexityAlignment(requirements: Requirements): number {
    // Check if feature complexity aligns with overall project complexity
    const complexityScores = { 'simple': 1, 'moderate': 2, 'complex': 3, 'very-complex': 4 };
    const projectScore = complexityScores[requirements.complexity];
    
    const featureScores = requirements.features.map(f => complexityScores[f.complexity]);
    const avgFeatureScore = featureScores.reduce((sum, score) => sum + score, 0) / featureScores.length;
    
    // Score based on how well aligned they are
    const alignment = 1 - Math.abs(projectScore - avgFeatureScore) / 3;
    return Math.round(alignment * 10); // 0-10 points
  }
}