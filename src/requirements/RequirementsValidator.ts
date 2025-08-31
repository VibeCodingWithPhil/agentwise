import { TechSpecValidator, ValidationResult as BaseValidationResult, TechStackComponents } from '../validation/TechSpecValidator';
import { ProjectSpecs } from '../orchestrator/SpecGenerator';
import {
  Requirements,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  Recommendation,
  ValidationScore,
  CompletenessCheck,
  CompatibilityCheck,
  Feature,
  TechStack,
  TeamConfig,
  Timeline,
  Priority,
  Severity,
  ComplexityLevel
} from './types';

export class RequirementsValidator extends TechSpecValidator {
  private readonly REQUIRED_FIELDS = [
    'title', 'description', 'projectType', 'features', 'techStack', 
    'architecture', 'timeline', 'team'
  ];

  private readonly RECOMMENDED_FIELDS = [
    'database', 'deployment', 'constraints', 'budget', 'scope'
  ];

  private readonly MIN_FEATURES_BY_COMPLEXITY: Record<ComplexityLevel, number> = {
    'simple': 3,
    'moderate': 5,
    'complex': 8,
    'very-complex': 12
  };

  private readonly MAX_FEATURES_BY_COMPLEXITY: Record<ComplexityLevel, number> = {
    'simple': 8,
    'moderate': 15,
    'complex': 25,
    'very-complex': 50
  };

  async validateRequirements(requirements: Requirements): Promise<ValidationResult> {
    console.log('🔍 Validating requirements completeness and feasibility...');

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const recommendations: Recommendation[] = [];

    // 1. Validate completeness
    const completeness = await this.validateCompleteness(requirements, errors, warnings);

    // 2. Validate tech stack compatibility
    const compatibility = await this.validateRequirementsCompatibility(requirements, errors, warnings, recommendations);

    // 3. Validate feature consistency
    await this.validateFeatures(requirements, errors, warnings, recommendations);

    // 4. Validate team feasibility
    await this.validateTeam(requirements, errors, warnings, recommendations);

    // 5. Validate timeline realism
    await this.validateTimeline(requirements, errors, warnings, recommendations);

    // 6. Validate constraints
    await this.validateConstraints(requirements, errors, warnings);

    // 7. Generate overall recommendations
    await this.generateOverallRecommendations(requirements, recommendations);

    // 8. Calculate validation score
    const score = this.calculateValidationScore(requirements, errors, warnings);

    const isValid = errors.filter(e => e.severity === 'critical').length === 0;

    return {
      isValid,
      errors,
      warnings,
      recommendations,
      score,
      completeness,
      compatibility
    };
  }

  private async validateCompleteness(
    requirements: Requirements,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<CompletenessCheck> {
    const requiredFields: any[] = [];
    const recommendedFields: any[] = [];
    const missingCritical: string[] = [];
    const missingRecommended: string[] = [];

    // Check required fields
    for (const field of this.REQUIRED_FIELDS) {
      const present = this.isFieldPresent(requirements, field);
      const quality = this.assessFieldQuality(requirements, field);

      requiredFields.push({
        field,
        present,
        quality,
        suggestions: this.getFieldSuggestions(field, present, quality)
      });

      if (!present) {
        missingCritical.push(field);
        errors.push({
          id: `completeness-${field}`,
          type: 'missing',
          severity: 'critical',
          category: 'completeness',
          message: `Required field '${field}' is missing`,
          field,
          suggestions: [`Add ${field} to requirements`, `Provide detailed ${field} information`],
          impact: 'blocks-development',
          fix: {
            applicable: true,
            description: `Add ${field} field with appropriate content`,
            commands: [],
            risk: 'minor',
            backup: false
          }
        });
      } else if (quality === 'poor') {
        warnings.push({
          id: `quality-${field}`,
          type: 'unclear',
          category: 'best-practice',
          message: `Field '${field}' has poor quality and needs improvement`,
          field,
          impact: 'moderate',
          suggestions: [`Provide more detailed ${field}`, `Add specific examples`, `Clarify requirements`],
          ignorable: false
        });
      }
    }

    // Check recommended fields
    for (const field of this.RECOMMENDED_FIELDS) {
      const present = this.isFieldPresent(requirements, field);
      const quality = this.assessFieldQuality(requirements, field);

      recommendedFields.push({
        field,
        present,
        quality,
        suggestions: this.getFieldSuggestions(field, present, quality)
      });

      if (!present) {
        missingRecommended.push(field);
        warnings.push({
          id: `recommended-${field}`,
          type: 'suboptimal',
          category: 'best-practice',
          message: `Recommended field '${field}' is missing`,
          field,
          impact: 'minor',
          suggestions: [`Consider adding ${field}`, `Evaluate if ${field} is needed for your project`],
          ignorable: true
        });
      }
    }

    // Calculate coverage
    const totalFields = this.REQUIRED_FIELDS.length + this.RECOMMENDED_FIELDS.length;
    const presentFields = requiredFields.filter(f => f.present).length + recommendedFields.filter(f => f.present).length;
    const coverage = Math.round((presentFields / totalFields) * 100);

    return {
      requiredFields,
      recommendedFields,
      coverage,
      missingCritical,
      missingRecommended
    };
  }

  private async validateRequirementsCompatibility(
    requirements: Requirements,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: Recommendation[]
  ): Promise<CompatibilityCheck> {
    // Convert requirements to ProjectSpecs format for base validator
    const projectSpecs: ProjectSpecs = {
      mainSpec: this.convertToMainSpec(requirements),
      projectSpec: this.convertToProjectSpec(requirements),
      todoSpec: this.convertToTodoSpec(requirements)
    };

    // Use base validator for tech stack validation
    const baseValidationResult = await super.validateTechStack(projectSpecs);

    // Convert base validation results to our format
    this.convertBaseValidationResults(baseValidationResult, errors, warnings, recommendations);

    const techCompatibility = {
      compatible: baseValidationResult.isValid,
      conflicts: this.convertTechConflicts(baseValidationResult.errors),
      gaps: this.identifyTechGaps(requirements, baseValidationResult.warnings),
      optimizations: this.identifyTechOptimizations(baseValidationResult.recommendations)
    };

    const architectureCompatibility = await this.validateArchitectureCompatibility(requirements);
    const teamCompatibility = await this.validateTeamCompatibility(requirements);
    const timelineCompatibility = await this.validateTimelineCompatibility(requirements);

    return {
      techStack: techCompatibility,
      architecture: architectureCompatibility,
      team: teamCompatibility,
      timeline: timelineCompatibility
    };
  }

  private async validateFeatures(
    requirements: Requirements,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: Recommendation[]
  ): Promise<void> {
    const features = requirements.features;

    // Check feature count against complexity
    const minFeatures = this.MIN_FEATURES_BY_COMPLEXITY[requirements.complexity];
    const maxFeatures = this.MAX_FEATURES_BY_COMPLEXITY[requirements.complexity];

    if (features.length < minFeatures) {
      warnings.push({
        id: 'features-too-few',
        type: 'suboptimal',
        category: 'best-practice',
        message: `Only ${features.length} features for ${requirements.complexity} project (minimum recommended: ${minFeatures})`,
        field: 'features',
        impact: 'moderate',
        suggestions: [
          'Consider adding more features to justify complexity',
          'Reduce project complexity if feature set is intentionally minimal',
          'Add infrastructure and operational features'
        ],
        ignorable: false
      });
    }

    if (features.length > maxFeatures) {
      warnings.push({
        id: 'features-too-many',
        type: 'risky',
        category: 'scalability',
        message: `${features.length} features for ${requirements.complexity} project (maximum recommended: ${maxFeatures})`,
        field: 'features',
        impact: 'significant',
        suggestions: [
          'Consider breaking into multiple phases',
          'Prioritize features and defer some to later releases',
          'Increase complexity level if feature set is comprehensive'
        ],
        ignorable: false
      });
    }

    // Check for critical features
    const criticalFeatures = features.filter(f => f.priority === 'critical');
    if (criticalFeatures.length === 0) {
      errors.push({
        id: 'no-critical-features',
        type: 'missing',
        severity: 'high',
        category: 'completeness',
        message: 'No critical features identified - every project needs core functionality',
        field: 'features',
        suggestions: [
          'Identify core business functionality',
          'Mark essential features as critical priority',
          'Define MVP features clearly'
        ],
        impact: 'blocks-development',
        fix: {
          applicable: false,
          description: 'Manual review required to identify critical features',
          commands: [],
          risk: 'minor',
          backup: false
        }
      });
    }

    // Check feature dependencies
    await this.validateFeatureDependencies(features, errors, warnings);

    // Check feature completeness
    await this.validateFeatureCompleteness(features, warnings, recommendations);

    // Check for duplicate features
    await this.checkForDuplicateFeatures(features, warnings);
  }

  private async validateTeam(
    requirements: Requirements,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: Recommendation[]
  ): Promise<void> {
    const team = requirements.team;
    const features = requirements.features;
    const complexity = requirements.complexity;

    // Calculate effort requirements
    const totalEffort = features.reduce((sum, f) => sum + f.estimatedHours, 0);
    const developmentHours = team.size * 40 * 4; // 4 weeks per team member

    if (totalEffort > developmentHours * 3) { // 3 months capacity
      errors.push({
        id: 'team-undersized',
        type: 'incompatible',
        severity: 'high',
        category: 'feasibility',
        message: `Team size (${team.size}) insufficient for estimated effort (${totalEffort} hours)`,
        field: 'team',
        suggestions: [
          'Increase team size',
          'Reduce scope or feature complexity',
          'Extend timeline',
          'Consider outsourcing some components'
        ],
        impact: 'affects-timeline',
        fix: {
          applicable: false,
          description: 'Requires business decision on team size or scope',
          commands: [],
          risk: 'high',
          backup: false
        }
      });
    }

    // Check for required skills
    const requiredSkills = this.extractRequiredSkills(requirements.techStack, features);
    const teamSkills = team.skills.flatMap(s => s.skills);
    const missingSkills = requiredSkills.filter(skill => !teamSkills.includes(skill));

    if (missingSkills.length > 0) {
      warnings.push({
        id: 'missing-skills',
        type: 'risky',
        category: 'best-practice',
        message: `Team lacks required skills: ${missingSkills.join(', ')}`,
        field: 'team',
        impact: 'significant',
        suggestions: [
          'Hire team members with missing skills',
          'Provide training for existing team members',
          'Consider consulting or contractors',
          'Simplify tech stack to match team skills'
        ],
        ignorable: false
      });

      recommendations.push({
        id: 'skill-gap-rec',
        category: 'enhancement',
        type: 'add',
        title: 'Address Skill Gaps',
        description: `Team needs additional expertise in ${missingSkills.join(', ')}`,
        rationale: 'Ensures successful project execution with required technical skills',
        benefits: ['Faster development', 'Higher code quality', 'Reduced technical risk'],
        risks: ['Increased hiring costs', 'Potential timeline delays for training'],
        effort: 'high',
        impact: 'high',
        priority: 'high',
        alternatives: [
          {
            name: 'Training Existing Team',
            description: 'Train current team members in missing skills',
            pros: ['Lower cost', 'Team retention', 'Knowledge stays internal'],
            cons: ['Takes time', 'May not reach expert level', 'Productivity dip during training'],
            effort: 'medium',
            risk: 'medium'
          },
          {
            name: 'Hire New Team Members',
            description: 'Recruit team members with required skills',
            pros: ['Immediate expertise', 'Faster execution', 'Knowledge transfer'],
            cons: ['Higher cost', 'Hiring time', 'Team integration challenges'],
            effort: 'high',
            risk: 'medium'
          }
        ],
        implementation: {
          steps: [
            {
              order: 1,
              title: 'Skill Gap Analysis',
              description: 'Detailed analysis of current vs required skills',
              duration: 8,
              dependencies: [],
              deliverables: ['Skill gap report', 'Training plan or hiring plan']
            },
            {
              order: 2,
              title: 'Execute Solution',
              description: 'Implement chosen approach (training or hiring)',
              duration: 160,
              dependencies: [1],
              deliverables: ['Skilled team ready for project']
            }
          ],
          prerequisites: ['Approved budget for training or hiring'],
          dependencies: ['Project timeline flexibility'],
          timeline: 30,
          resources: ['HR support', 'Training budget or hiring budget']
        }
      });
    }
  }

  private async validateTimeline(
    requirements: Requirements,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: Recommendation[]
  ): Promise<void> {
    const timeline = requirements.timeline;
    const features = requirements.features;
    const team = requirements.team;

    // Calculate realistic timeline based on features and team
    const totalEffort = features.reduce((sum, f) => sum + f.estimatedHours, 0);
    const teamVelocity = team.size * 30; // 30 productive hours per week per team member
    const realisticDuration = Math.ceil(totalEffort / teamVelocity);

    if (timeline.totalDuration < realisticDuration * 0.8) {
      errors.push({
        id: 'timeline-unrealistic',
        type: 'incompatible',
        severity: 'high',
        category: 'feasibility',
        message: `Timeline (${timeline.totalDuration} days) is unrealistic for estimated effort (needs ~${realisticDuration} days)`,
        field: 'timeline',
        suggestions: [
          'Extend timeline to realistic duration',
          'Reduce project scope',
          'Increase team size',
          'Parallelize development tracks'
        ],
        impact: 'affects-timeline',
        fix: {
          applicable: true,
          description: 'Adjust timeline to match realistic estimates',
          commands: [],
          risk: 'low',
          backup: true
        }
      });
    }

    // Check phase dependencies
    for (const dependency of timeline.dependencies) {
      const fromPhase = timeline.phases.find(p => p.id === dependency.from);
      const toPhase = timeline.phases.find(p => p.id === dependency.to);

      if (!fromPhase || !toPhase) {
        errors.push({
          id: `invalid-dependency-${dependency.from}-${dependency.to}`,
          type: 'invalid',
          severity: 'medium',
          category: 'consistency',
          message: `Invalid phase dependency: ${dependency.from} -> ${dependency.to}`,
          field: 'timeline.dependencies',
          suggestions: ['Remove invalid dependency', 'Correct phase IDs'],
          impact: 'degrades-quality',
          fix: {
            applicable: true,
            description: 'Remove or correct invalid phase dependency',
            commands: [],
            risk: 'low',
            backup: true
          }
        });
      }
    }

    // Check for missing buffer time
    if (timeline.bufferTime < timeline.totalDuration * 0.1) {
      warnings.push({
        id: 'insufficient-buffer',
        type: 'risky',
        category: 'best-practice',
        message: `Buffer time (${timeline.bufferTime} days) is less than 10% of project duration`,
        field: 'timeline.bufferTime',
        impact: 'moderate',
        suggestions: [
          'Increase buffer time to 15-20% of project duration',
          'Account for unexpected delays and scope changes',
          'Consider additional time for testing and bug fixes'
        ],
        ignorable: false
      });
    }
  }

  private async validateConstraints(
    requirements: Requirements,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    const constraints = requirements.constraints;

    // Check for conflicting constraints
    const budgetConstraints = constraints.filter(c => c.type === 'budgetary');
    const timelineConstraints = constraints.filter(c => c.type === 'timeline');
    const techConstraints = constraints.filter(c => c.type === 'technical');

    // Check for conflicting technical constraints
    for (let i = 0; i < techConstraints.length; i++) {
      for (let j = i + 1; j < techConstraints.length; j++) {
        const conflict = this.checkConstraintConflict(techConstraints[i], techConstraints[j]);
        if (conflict) {
          errors.push({
            id: `constraint-conflict-${i}-${j}`,
            type: 'conflict',
            severity: 'medium',
            category: 'consistency',
            message: `Conflicting constraints: ${techConstraints[i].description} vs ${techConstraints[j].description}`,
            field: 'constraints',
            suggestions: ['Resolve constraint conflict', 'Prioritize constraints', 'Remove conflicting constraint'],
            impact: 'blocks-development',
            fix: {
              applicable: false,
              description: 'Manual review required to resolve constraint conflict',
              commands: [],
              risk: 'medium',
              backup: false
            }
          });
        }
      }
    }

    // Validate constraint impact on project
    for (const constraint of constraints) {
      if (constraint.impact === 'blocking' && constraint.severity !== 'critical') {
        warnings.push({
          id: `blocking-constraint-${constraint.id}`,
          type: 'suboptimal',
          category: 'best-practice',
          message: `Blocking constraint "${constraint.description}" should be marked as critical severity`,
          field: 'constraints',
          impact: 'minor',
          suggestions: ['Update constraint severity to critical', 'Review constraint impact level'],
          ignorable: true
        });
      }
    }
  }

  private async generateOverallRecommendations(
    requirements: Requirements,
    recommendations: Recommendation[]
  ): Promise<void> {
    // Performance optimization recommendations
    if (requirements.complexity === 'complex' || requirements.complexity === 'very-complex') {
      recommendations.push({
        id: 'performance-optimization',
        category: 'performance',
        type: 'add',
        title: 'Implement Performance Optimization Strategy',
        description: 'Complex projects require systematic performance optimization',
        rationale: 'Prevents performance issues as the application scales',
        benefits: ['Better user experience', 'Reduced infrastructure costs', 'Improved scalability'],
        risks: ['Additional development time', 'Increased complexity'],
        effort: 'medium',
        impact: 'high',
        priority: 'medium',
        alternatives: [],
        implementation: {
          steps: [
            {
              order: 1,
              title: 'Performance Baseline',
              description: 'Establish performance benchmarks and monitoring',
              duration: 16,
              dependencies: [],
              deliverables: ['Performance benchmarks', 'Monitoring setup']
            },
            {
              order: 2,
              title: 'Optimization Implementation',
              description: 'Implement caching, lazy loading, and other optimizations',
              duration: 40,
              dependencies: [1],
              deliverables: ['Optimized application', 'Performance improvements']
            }
          ],
          prerequisites: ['Performance monitoring tools'],
          dependencies: ['Core application features'],
          timeline: 14,
          resources: ['Senior developer', 'Performance testing tools']
        }
      });
    }

    // Security recommendations for all projects
    const hasSecurityFeatures = requirements.features.some(f => f.category === 'security');
    if (!hasSecurityFeatures) {
      recommendations.push({
        id: 'security-features',
        category: 'security',
        type: 'add',
        title: 'Add Security Features',
        description: 'Every application needs basic security measures',
        rationale: 'Protects against common security vulnerabilities',
        benefits: ['Data protection', 'User trust', 'Compliance readiness'],
        risks: ['Development overhead', 'User experience complexity'],
        effort: 'medium',
        impact: 'very-high',
        priority: 'high',
        alternatives: [
          {
            name: 'Third-party Security Service',
            description: 'Use services like Auth0 or AWS Cognito',
            pros: ['Quick implementation', 'Expert security', 'Maintained externally'],
            cons: ['Vendor dependency', 'Cost', 'Less customization'],
            effort: 'low',
            risk: 'low'
          },
          {
            name: 'Custom Security Implementation',
            description: 'Build security features in-house',
            pros: ['Full control', 'Customization', 'No vendor lock-in'],
            cons: ['High complexity', 'Security risk', 'Maintenance burden'],
            effort: 'high',
            risk: 'high'
          }
        ],
        implementation: {
          steps: [
            {
              order: 1,
              title: 'Security Assessment',
              description: 'Analyze security requirements and threats',
              duration: 16,
              dependencies: [],
              deliverables: ['Security requirements', 'Threat model']
            },
            {
              order: 2,
              title: 'Security Implementation',
              description: 'Implement authentication, authorization, and other security measures',
              duration: 80,
              dependencies: [1],
              deliverables: ['Security features', 'Security documentation']
            }
          ],
          prerequisites: ['Security requirements defined'],
          dependencies: ['User management system'],
          timeline: 21,
          resources: ['Security-aware developer', 'Security audit tools']
        }
      });
    }
  }

  private calculateValidationScore(
    requirements: Requirements,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): ValidationScore {
    let overallScore = 100;

    // Deduct points for errors
    for (const error of errors) {
      const deduction = error.severity === 'critical' ? 20 : 
                       error.severity === 'high' ? 15 : 
                       error.severity === 'medium' ? 10 : 5;
      overallScore -= deduction;
    }

    // Deduct points for warnings
    for (const warning of warnings) {
      const deduction = warning.impact === 'significant' ? 5 : 
                       warning.impact === 'moderate' ? 3 : 1;
      overallScore -= deduction;
    }

    overallScore = Math.max(0, overallScore);

    // Calculate category scores
    const categories = {
      completeness: this.calculateCompletenessScore(requirements, errors, warnings),
      feasibility: this.calculateFeasibilityScore(requirements, errors, warnings),
      clarity: this.calculateClarityScore(requirements, warnings),
      consistency: this.calculateConsistencyScore(requirements, errors),
      testability: this.calculateTestabilityScore(requirements),
      maintainability: this.calculateMaintainabilityScore(requirements)
    };

    const breakdown = {
      completeness: categories.completeness,
      feasibility: categories.feasibility,
      clarity: categories.clarity,
      consistency: categories.consistency,
      testability: categories.testability,
      maintainability: categories.maintainability
    };

    return {
      overall: overallScore,
      categories,
      breakdown
    };
  }

  // Helper methods with simplified implementations

  private isFieldPresent(requirements: Requirements, field: string): boolean {
    const value = (requirements as any)[field];
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
    return value !== undefined && value !== null && value !== '';
  }

  private assessFieldQuality(requirements: Requirements, field: string): any {
    const value = (requirements as any)[field];
    if (!this.isFieldPresent(requirements, field)) return 'missing';
    
    if (field === 'description') {
      if (typeof value === 'string') {
        if (value.length < 50) return 'poor';
        if (value.length < 200) return 'fair';
        if (value.length < 500) return 'good';
        return 'excellent';
      }
    }
    
    if (field === 'features') {
      if (Array.isArray(value)) {
        if (value.length < 3) return 'poor';
        if (value.length < 8) return 'fair';
        if (value.length < 15) return 'good';
        return 'excellent';
      }
    }
    
    return 'good';
  }

  private getFieldSuggestions(field: string, present: boolean, quality: any): string[] {
    if (!present) {
      return [`Add ${field} field`, `Provide detailed ${field} information`];
    }
    
    if (quality === 'poor') {
      return [`Improve ${field} quality`, `Add more detail to ${field}`, `Provide examples in ${field}`];
    }
    
    return [];
  }

  private convertToMainSpec(requirements: Requirements): string {
    return `# ${requirements.title}

${requirements.description}

**Project Type:** ${requirements.projectType}
**Architecture:** ${requirements.architecture}
**Complexity:** ${requirements.complexity}

## Features
${requirements.features.map(f => `- ${f.name}: ${f.description}`).join('\n')}

## Tech Stack
${this.formatTechStackForSpec(requirements.techStack)}
`;
  }

  private convertToProjectSpec(requirements: Requirements): string {
    return `# Project Specifications

## Timeline
- Total Duration: ${requirements.timeline.totalDuration} days
- Phases: ${requirements.timeline.phases.length}
- Buffer Time: ${requirements.timeline.bufferTime} days

## Team Configuration
- Team Size: ${requirements.team.size}
- Structure: ${requirements.team.structure}
- Methodology: ${requirements.team.development}

## Constraints
${requirements.constraints.map(c => `- ${c.type}: ${c.description}`).join('\n')}
`;
  }

  private convertToTodoSpec(requirements: Requirements): string {
    return `# Implementation Plan

## Core Features
${requirements.features.filter(f => f.priority === 'critical').map(f => `- [ ] ${f.name}`).join('\n')}

## High Priority Features  
${requirements.features.filter(f => f.priority === 'high').map(f => `- [ ] ${f.name}`).join('\n')}

## Additional Features
${requirements.features.filter(f => f.priority === 'medium' || f.priority === 'low').map(f => `- [ ] ${f.name}`).join('\n')}
`;
  }

  private formatTechStackForSpec(techStack: TechStack): string {
    let spec = '';
    
    if (techStack.frontend) {
      spec += `**Frontend:** ${techStack.frontend.framework} with ${techStack.frontend.language}\n`;
    }
    
    if (techStack.backend) {
      spec += `**Backend:** ${techStack.backend.framework} (${techStack.backend.runtime})\n`;
    }
    
    if (techStack.database) {
      spec += `**Database:** ${techStack.database.primary.type}\n`;
    }
    
    return spec;
  }

  private convertBaseValidationResults(
    baseResult: BaseValidationResult,
    errors: ValidationError[],
    warnings: ValidationWarning[],
    recommendations: Recommendation[]
  ): void {
    // Convert base errors
    for (const baseError of baseResult.errors) {
      errors.push({
        id: `tech-${baseError.type}`,
        type: baseError.type === 'compatibility' ? 'incompatible' : 
              baseError.type === 'conflict' ? 'conflict' : 'invalid',
        severity: baseError.severity === 'critical' ? 'critical' : 
                 baseError.severity === 'high' ? 'high' : 'medium',
        category: 'feasibility',
        message: baseError.message,
        field: 'techStack',
        suggestions: baseError.solution ? [baseError.solution] : [],
        impact: 'blocks-development',
        fix: {
          applicable: !!baseError.solution,
          description: baseError.solution || 'Manual resolution required',
          commands: [],
          risk: 'medium',
          backup: true
        }
      });
    }

    // Convert base warnings
    for (const baseWarning of baseResult.warnings) {
      warnings.push({
        id: `tech-warning-${baseWarning.type}`,
        type: 'suboptimal',
        category: 'best-practice',
        message: baseWarning.message,
        field: 'techStack',
        impact: 'moderate',
        suggestions: [baseWarning.impact || 'Review and consider alternatives'],
        ignorable: false
      });
    }

    // Convert base recommendations
    for (const baseRec of baseResult.recommendations) {
      recommendations.push({
        id: `tech-rec-${baseRec.category}`,
        category: baseRec.category as any,
        type: 'modify',
        title: baseRec.suggestion,
        description: baseRec.reason,
        rationale: baseRec.reason,
        benefits: ['Improved compatibility', 'Better performance', 'Industry best practices'],
        risks: ['Migration effort', 'Learning curve'],
        effort: 'medium',
        impact: 'medium',
        priority: 'medium',
        alternatives: baseRec.alternatives?.map(alt => ({
          name: alt,
          description: `Alternative option: ${alt}`,
          pros: ['Different approach', 'May fit better'],
          cons: ['Needs evaluation', 'Unknown trade-offs'],
          effort: 'medium',
          risk: 'medium'
        })) || [],
        implementation: {
          steps: [
            {
              order: 1,
              title: 'Evaluate Recommendation',
              description: `Assess the impact of ${baseRec.suggestion}`,
              duration: 8,
              dependencies: [],
              deliverables: ['Evaluation report', 'Implementation plan']
            }
          ],
          prerequisites: ['Current implementation stable'],
          dependencies: [],
          timeline: 7,
          resources: ['Technical lead']
        }
      });
    }
  }

  private convertTechConflicts(baseErrors: any[]): any[] {
    return baseErrors
      .filter(e => e.type === 'conflict' || e.type === 'compatibility')
      .map(e => ({
        component1: e.affectedComponents?.[0] || 'unknown',
        component2: e.affectedComponents?.[1] || 'unknown',
        severity: e.severity,
        description: e.message,
        resolution: e.solution ? [e.solution] : ['Manual resolution required']
      }));
  }

  private identifyTechGaps(requirements: Requirements, baseWarnings: any[]): any[] {
    const gaps = [];
    
    // Check for missing essential components
    if (!requirements.techStack.testing) {
      gaps.push({
        category: 'testing',
        missing: ['Testing framework', 'Test runners', 'Coverage tools'],
        impact: 'high',
        alternatives: ['Jest', 'Vitest', 'Mocha', 'Cypress', 'Playwright']
      });
    }

    if (!requirements.techStack.deployment) {
      gaps.push({
        category: 'deployment',
        missing: ['CI/CD pipeline', 'Deployment strategy', 'Environment management'],
        impact: 'high',
        alternatives: ['GitHub Actions', 'Jenkins', 'GitLab CI', 'Docker', 'Kubernetes']
      });
    }

    return gaps;
  }

  private identifyTechOptimizations(baseRecommendations: any[]): any[] {
    return baseRecommendations.map(rec => ({
      category: rec.category,
      current: 'Current configuration',
      recommended: rec.suggestion,
      benefit: rec.reason,
      effort: 'medium' as const
    }));
  }

  private async validateArchitectureCompatibility(requirements: Requirements): Promise<any> {
    return {
      suitable: true,
      concerns: [],
      alternatives: []
    };
  }

  private async validateTeamCompatibility(requirements: Requirements): Promise<any> {
    return {
      adequate: true,
      gaps: [],
      overallocations: [],
      recommendations: []
    };
  }

  private async validateTimelineCompatibility(requirements: Requirements): Promise<any> {
    return {
      realistic: true,
      risks: [],
      optimizations: []
    };
  }

  private async validateFeatureDependencies(
    features: Feature[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    for (const feature of features) {
      for (const depId of feature.dependencies) {
        const dependency = features.find(f => f.id === depId);
        if (!dependency) {
          errors.push({
            id: `invalid-dependency-${feature.id}-${depId}`,
            type: 'invalid',
            severity: 'medium',
            category: 'consistency',
            message: `Feature "${feature.name}" has invalid dependency: ${depId}`,
            field: 'features',
            suggestions: ['Remove invalid dependency', 'Add missing dependent feature'],
            impact: 'degrades-quality',
            fix: {
              applicable: true,
              description: 'Remove or correct invalid feature dependency',
              commands: [],
              risk: 'low',
              backup: true
            }
          });
        }
      }
    }
  }

  private async validateFeatureCompleteness(
    features: Feature[],
    warnings: ValidationWarning[],
    recommendations: Recommendation[]
  ): Promise<void> {
    for (const feature of features) {
      if (!feature.acceptance_criteria || feature.acceptance_criteria.length === 0) {
        warnings.push({
          id: `missing-criteria-${feature.id}`,
          type: 'unclear',
          category: 'best-practice',
          message: `Feature "${feature.name}" lacks acceptance criteria`,
          field: 'features',
          impact: 'moderate',
          suggestions: [
            'Add clear acceptance criteria',
            'Define measurable success conditions',
            'Include edge cases and error conditions'
          ],
          ignorable: false
        });
      }

      if (feature.estimatedHours <= 0) {
        warnings.push({
          id: `invalid-estimate-${feature.id}`,
          type: 'invalid',
          category: 'best-practice',
          message: `Feature "${feature.name}" has invalid time estimate: ${feature.estimatedHours} hours`,
          field: 'features',
          impact: 'moderate',
          suggestions: [
            'Provide realistic time estimate',
            'Break down feature into smaller tasks',
            'Consider complexity and dependencies'
          ],
          ignorable: false
        });
      }
    }
  }

  private async checkForDuplicateFeatures(features: Feature[], warnings: ValidationWarning[]): Promise<void> {
    const featureNames = new Map<string, Feature[]>();
    
    for (const feature of features) {
      const normalizedName = feature.name.toLowerCase().trim();
      if (!featureNames.has(normalizedName)) {
        featureNames.set(normalizedName, []);
      }
      featureNames.get(normalizedName)!.push(feature);
    }

    for (const [name, duplicates] of Array.from(featureNames.entries())) {
      if (duplicates.length > 1) {
        warnings.push({
          id: `duplicate-features-${name.replace(/\s+/g, '-')}`,
          type: 'redundant',
          category: 'best-practice',
          message: `Duplicate features found: "${duplicates[0].name}" (${duplicates.length} instances)`,
          field: 'features',
          impact: 'moderate',
          suggestions: [
            'Merge duplicate features',
            'Rename if features are actually different',
            'Remove unnecessary duplicates'
          ],
          ignorable: false
        });
      }
    }
  }

  private extractRequiredSkills(techStack: TechStack, features: Feature[]): string[] {
    const skills = new Set<string>();

    // Extract from tech stack
    if (techStack.frontend) {
      skills.add(techStack.frontend.framework);
      skills.add(techStack.frontend.language);
      if (techStack.frontend.cssFramework) skills.add(techStack.frontend.cssFramework);
    }

    if (techStack.backend) {
      skills.add(techStack.backend.runtime);
      skills.add(techStack.backend.framework);
      skills.add(techStack.backend.language);
    }

    if (techStack.database?.primary) {
      skills.add(techStack.database.primary.type);
      if (techStack.database.primary.orm) skills.add(techStack.database.primary.orm);
    }

    // Extract from features
    for (const feature of features) {
      for (const techReq of feature.techRequirements) {
        skills.add(techReq.requirement);
      }
    }

    return Array.from(skills);
  }

  private checkConstraintConflict(constraint1: any, constraint2: any): boolean {
    // Simplified conflict detection
    // In reality, this would have sophisticated logic to detect conflicts
    return false;
  }

  private calculateCompletenessScore(requirements: Requirements, errors: ValidationError[], warnings: ValidationWarning[]): number {
    const completenessErrors = errors.filter(e => e.category === 'completeness').length;
    const score = 100 - (completenessErrors * 15);
    return Math.max(0, score);
  }

  private calculateFeasibilityScore(requirements: Requirements, errors: ValidationError[], warnings: ValidationWarning[]): number {
    const feasibilityErrors = errors.filter(e => e.category === 'feasibility').length;
    const score = 100 - (feasibilityErrors * 20);
    return Math.max(0, score);
  }

  private calculateClarityScore(requirements: Requirements, warnings: ValidationWarning[]): number {
    const clarityWarnings = warnings.filter(w => w.type === 'unclear').length;
    const score = 100 - (clarityWarnings * 10);
    return Math.max(0, score);
  }

  private calculateConsistencyScore(requirements: Requirements, errors: ValidationError[]): number {
    const consistencyErrors = errors.filter(e => e.category === 'consistency').length;
    const score = 100 - (consistencyErrors * 12);
    return Math.max(0, score);
  }

  private calculateTestabilityScore(requirements: Requirements): number {
    const hasTestingFramework = requirements.techStack.testing !== undefined;
    const featuresWithCriteria = requirements.features.filter(f => f.acceptance_criteria.length > 0).length;
    const criteriaScore = (featuresWithCriteria / requirements.features.length) * 50;
    const frameworkScore = hasTestingFramework ? 50 : 0;
    return criteriaScore + frameworkScore;
  }

  private calculateMaintainabilityScore(requirements: Requirements): number {
    let score = 70; // Base score

    // Add points for good practices
    if (requirements.techStack.testing) score += 10;
    if (requirements.techStack.tools?.documentation) score += 10;
    if (requirements.team.development === 'agile') score += 10;

    return Math.min(100, score);
  }
}