import { jest } from '@jest/globals';
import { RequirementsValidator } from '../src/requirements/RequirementsValidator';
import { RequirementsEnhancer } from '../src/requirements/RequirementsEnhancer';
import { RequirementsGenerator } from '../src/requirements/RequirementsGenerator';
import { 
  Requirements, 
  ValidationResult, 
  ComplexityLevel,
  Priority,
  TechStack,
  Feature
} from '../src/requirements/types';

describe('Requirements System Tests', () => {
  let validator: RequirementsValidator;
  let enhancer: RequirementsEnhancer;
  let generator: RequirementsGenerator;

  beforeEach(() => {
    validator = new RequirementsValidator();
    enhancer = new RequirementsEnhancer();
    generator = new RequirementsGenerator();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('RequirementsValidator', () => {
    const createMockRequirements = (overrides: Partial<Requirements> = {}): Requirements => {
      const defaultTechStack: TechStack = {
        frontend: {
          framework: 'React',
          language: 'TypeScript',
          cssFramework: 'Tailwind CSS'
        },
        backend: {
          runtime: 'Node.js',
          framework: 'Express',
          language: 'TypeScript'
        },
        database: {
          primary: {
            type: 'PostgreSQL',
            orm: 'Prisma'
          }
        },
        testing: {
          framework: 'Jest',
          coverage: true,
          e2e: 'Cypress'
        }
      };

      const defaultFeatures: Feature[] = [
        {
          id: 'f1',
          name: 'User Authentication',
          description: 'User login and registration',
          category: 'core',
          priority: 'critical' as Priority,
          estimatedHours: 40,
          dependencies: [],
          acceptance_criteria: [
            'Users can register with email',
            'Users can login with credentials',
            'Password reset functionality'
          ],
          techRequirements: [
            { requirement: 'JWT authentication', rationale: 'Secure token-based auth' }
          ]
        },
        {
          id: 'f2', 
          name: 'Dashboard',
          description: 'Main application dashboard',
          category: 'ui',
          priority: 'high' as Priority,
          estimatedHours: 60,
          dependencies: ['f1'],
          acceptance_criteria: [
            'Display user data',
            'Navigation menu',
            'Responsive design'
          ],
          techRequirements: []
        },
        {
          id: 'f3',
          name: 'API Integration',
          description: 'Third-party API integration',
          category: 'integration',
          priority: 'medium' as Priority,
          estimatedHours: 32,
          dependencies: [],
          acceptance_criteria: ['Connect to external API', 'Handle API errors'],
          techRequirements: []
        }
      ];

      return {
        id: 'req-1',
        title: 'Test Project',
        description: 'A comprehensive test project for requirements validation',
        projectType: 'web-application',
        scope: 'full-stack',
        complexity: 'moderate' as ComplexityLevel,
        features: defaultFeatures,
        techStack: defaultTechStack,
        architecture: 'microservices',
        timeline: {
          totalDuration: 90,
          phases: [
            {
              id: 'phase1',
              name: 'Foundation',
              description: 'Basic setup and core features',
              duration: 30,
              startDate: new Date('2024-01-01'),
              endDate: new Date('2024-01-31'),
              deliverables: ['Authentication', 'Database setup'],
              dependencies: []
            }
          ],
          milestones: [
            {
              id: 'milestone1',
              title: 'MVP Release',
              date: new Date('2024-03-01'),
              description: 'Minimum viable product',
              criteria: ['Core features complete', 'Testing complete']
            }
          ],
          dependencies: [],
          bufferTime: 15
        },
        team: {
          size: 3,
          structure: 'cross-functional',
          development: 'agile',
          roles: [
            {
              name: 'Full Stack Developer',
              count: 2,
              skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
              responsibilities: ['Frontend development', 'Backend development', 'Database design']
            },
            {
              name: 'DevOps Engineer',
              count: 1,
              skills: ['AWS', 'Docker', 'CI/CD'],
              responsibilities: ['Deployment', 'Infrastructure', 'Monitoring']
            }
          ],
          skills: [
            { name: 'Frontend Developer', skills: ['React', 'TypeScript', 'CSS'] },
            { name: 'Backend Developer', skills: ['Node.js', 'PostgreSQL', 'Docker'] }
          ]
        },
        constraints: [
          {
            id: 'c1',
            type: 'budgetary',
            description: 'Limited budget of $50,000',
            impact: 'blocking',
            severity: 'high'
          }
        ],
        database: {
          type: 'PostgreSQL',
          name: 'test_project_db',
          orm: 'Prisma',
          migrations: true,
          seeding: true,
          backup: true,
          constraints: []
        },
        ...overrides
      };
    };

    describe('validateRequirements', () => {
      it('should validate complete requirements successfully', async () => {
        const requirements = createMockRequirements();
        const result = await validator.validateRequirements(requirements);

        expect(result.isValid).toBe(true);
        expect(result.errors.filter(e => e.severity === 'critical')).toHaveLength(0);
        expect(result.score.overall).toBeGreaterThan(80);
        expect(result.completeness.coverage).toBeGreaterThan(70);
      });

      it('should identify missing required fields', async () => {
        const requirements = createMockRequirements();
        delete (requirements as any).title;
        delete (requirements as any).description;

        const result = await validator.validateRequirements(requirements);

        expect(result.isValid).toBe(false);
        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'title',
              severity: 'critical',
              category: 'completeness'
            }),
            expect.objectContaining({
              field: 'description', 
              severity: 'critical',
              category: 'completeness'
            })
          ])
        );
      });

      it('should validate feature consistency', async () => {
        const requirements = createMockRequirements();
        requirements.complexity = 'simple';
        // Add too many features for a simple project
        for (let i = 4; i <= 15; i++) {
          requirements.features.push({
            id: `f${i}`,
            name: `Feature ${i}`,
            description: `Description ${i}`,
            category: 'feature',
            priority: 'low' as Priority,
            estimatedHours: 8,
            dependencies: [],
            acceptance_criteria: ['Criteria'],
            techRequirements: []
          });
        }

        const result = await validator.validateRequirements(requirements);

        expect(result.warnings).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'features-too-many',
              type: 'risky'
            })
          ])
        );
      });

      it('should identify invalid feature dependencies', async () => {
        const requirements = createMockRequirements();
        requirements.features[0].dependencies = ['nonexistent-feature'];

        const result = await validator.validateRequirements(requirements);

        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              field: 'features',
              message: expect.stringContaining('invalid dependency')
            })
          ])
        );
      });

      it('should validate team feasibility', async () => {
        const requirements = createMockRequirements();
        // Create impossible timeline with too much work for small team
        requirements.features.forEach(feature => {
          feature.estimatedHours = 500; // Total: 1500 hours for 3 features
        });
        requirements.team.size = 1;
        requirements.timeline.totalDuration = 30; // 30 days

        const result = await validator.validateRequirements(requirements);

        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'team-undersized',
              category: 'feasibility'
            })
          ])
        );
      });

      it('should validate timeline realism', async () => {
        const requirements = createMockRequirements();
        requirements.timeline.totalDuration = 5; // Unrealistic 5 days for complex project
        requirements.timeline.bufferTime = 0;

        const result = await validator.validateRequirements(requirements);

        expect(result.errors).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'timeline-unrealistic',
              category: 'feasibility'
            })
          ])
        );
        expect(result.warnings).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: 'insufficient-buffer'
            })
          ])
        );
      });

      it('should calculate validation scores correctly', async () => {
        const requirements = createMockRequirements();
        const result = await validator.validateRequirements(requirements);

        expect(result.score).toMatchObject({
          overall: expect.any(Number),
          categories: expect.objectContaining({
            completeness: expect.any(Number),
            feasibility: expect.any(Number),
            clarity: expect.any(Number),
            consistency: expect.any(Number),
            testability: expect.any(Number),
            maintainability: expect.any(Number)
          })
        });

        // All scores should be between 0 and 100
        Object.values(result.score.categories).forEach(score => {
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        });
      });

      it('should generate actionable recommendations', async () => {
        const requirements = createMockRequirements();
        requirements.complexity = 'very-complex';
        // Remove security features
        requirements.features = requirements.features.filter(f => f.category !== 'security');

        const result = await validator.validateRequirements(requirements);

        expect(result.recommendations).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              category: 'security',
              title: expect.stringContaining('Security'),
              implementation: expect.objectContaining({
                steps: expect.any(Array),
                timeline: expect.any(Number)
              })
            }),
            expect.objectContaining({
              category: 'performance',
              title: expect.stringContaining('Performance')
            })
          ])
        );
      });
    });

    describe('Error Handling', () => {
      it('should handle invalid input gracefully', async () => {
        const invalidRequirements = {} as Requirements;

        const result = await validator.validateRequirements(invalidRequirements);

        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(() => result).not.toThrow();
      });

      it('should handle circular feature dependencies', async () => {
        const requirements = createMockRequirements();
        requirements.features[0].dependencies = ['f2'];
        requirements.features[1].dependencies = ['f1']; // Circular dependency

        const result = await validator.validateRequirements(requirements);

        // Should complete without infinite loops
        expect(result).toBeDefined();
        expect(result.isValid).toBeDefined();
      });
    });

    describe('Performance Tests', () => {
      it('should validate large requirements set within reasonable time', async () => {
        const requirements = createMockRequirements();
        // Add many features to test performance
        for (let i = 0; i < 100; i++) {
          requirements.features.push({
            id: `perf-${i}`,
            name: `Performance Feature ${i}`,
            description: `Performance test feature ${i}`,
            category: 'performance',
            priority: 'low' as Priority,
            estimatedHours: 8,
            dependencies: [],
            acceptance_criteria: [`Criteria for feature ${i}`],
            techRequirements: []
          });
        }

        const startTime = Date.now();
        const result = await validator.validateRequirements(requirements);
        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        expect(result).toBeDefined();
      });
    });
  });

  describe('RequirementsEnhancer', () => {
    it('should enhance requirements with intelligent suggestions', async () => {
      const basicRequirements = {
        title: 'Basic Project',
        description: 'A basic project',
        projectType: 'web-application' as any,
        features: [
          {
            id: 'f1',
            name: 'User Login',
            description: 'Basic login',
            category: 'auth' as any,
            priority: 'high' as Priority,
            estimatedHours: 20,
            dependencies: [],
            acceptance_criteria: [],
            techRequirements: []
          }
        ]
      } as Requirements;

      const enhanced = await enhancer.enhanceRequirements(basicRequirements, {
        includeSecurityFeatures: true,
        addPerformanceOptimizations: true,
        generateTestingStrategy: true
      });

      expect(enhanced.features.length).toBeGreaterThan(basicRequirements.features.length);
      expect(enhanced.features).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            category: expect.stringMatching(/security|testing|performance/)
          })
        ])
      );
    });

    it('should respect existing requirements while enhancing', async () => {
      const requirements = {
        title: 'Existing Project',
        description: 'Existing description',
        features: [{ id: 'existing', name: 'Existing Feature' }]
      } as any;

      const enhanced = await enhancer.enhanceRequirements(requirements);

      expect(enhanced.title).toBe('Existing Project');
      expect(enhanced.description).toBe('Existing description');
      expect(enhanced.features.find(f => f.id === 'existing')).toBeDefined();
    });
  });

  describe('RequirementsGenerator', () => {
    it('should generate complete requirements from basic input', async () => {
      const generated = await generator.generateRequirements({
        projectName: 'E-commerce Platform',
        projectType: 'web-application',
        description: 'Modern e-commerce platform',
        userPreferences: {
          languages: ['TypeScript'],
          frameworks: ['React', 'Node.js'],
          database: 'PostgreSQL',
          deployment: 'cloud'
        }
      });

      expect(generated).toMatchObject({
        title: expect.stringContaining('E-commerce'),
        description: expect.any(String),
        projectType: 'web-application',
        features: expect.any(Array),
        techStack: expect.objectContaining({
          frontend: expect.objectContaining({
            framework: 'React',
            language: 'TypeScript'
          })
        }),
        timeline: expect.objectContaining({
          totalDuration: expect.any(Number),
          phases: expect.any(Array)
        }),
        team: expect.objectContaining({
          size: expect.any(Number),
          roles: expect.any(Array)
        })
      });

      expect(generated.features.length).toBeGreaterThan(0);
      expect(generated.features.some(f => f.priority === 'critical')).toBe(true);
    });

    it('should generate appropriate features for different project types', async () => {
      const apiProject = await generator.generateRequirements({
        projectName: 'API Service',
        projectType: 'api-service',
        description: 'REST API service'
      });

      const mobileProject = await generator.generateRequirements({
        projectName: 'Mobile App',
        projectType: 'mobile-application',
        description: 'Mobile application'
      });

      // API project should have API-specific features
      expect(apiProject.features.some(f => 
        f.name.toLowerCase().includes('api') || 
        f.name.toLowerCase().includes('endpoint')
      )).toBe(true);

      // Mobile project should have mobile-specific features
      expect(mobileProject.features.some(f => 
        f.name.toLowerCase().includes('mobile') || 
        f.name.toLowerCase().includes('offline')
      )).toBe(true);
    });

    it('should handle template-based generation', async () => {
      const generated = await generator.generateRequirements({
        projectName: 'SaaS Platform',
        template: 'saas-starter',
        userPreferences: {
          languages: ['TypeScript']
        }
      });

      // SaaS template should include subscription/billing features
      expect(generated.features.some(f => 
        f.name.toLowerCase().includes('subscription') ||
        f.name.toLowerCase().includes('billing') ||
        f.name.toLowerCase().includes('payment')
      )).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('should work together: generate, enhance, and validate', async () => {
      // Generate basic requirements
      const generated = await generator.generateRequirements({
        projectName: 'Full Stack App',
        projectType: 'web-application',
        description: 'Comprehensive web application'
      });

      // Enhance the generated requirements
      const enhanced = await enhancer.enhanceRequirements(generated, {
        includeSecurityFeatures: true,
        addPerformanceOptimizations: true
      });

      // Validate the enhanced requirements
      const validation = await validator.validateRequirements(enhanced);

      expect(validation.isValid).toBe(true);
      expect(validation.score.overall).toBeGreaterThan(70);
      expect(enhanced.features.length).toBeGreaterThan(generated.features.length);
    });

    it('should maintain data integrity throughout the pipeline', async () => {
      const original = await generator.generateRequirements({
        projectName: 'Data Integrity Test',
        projectType: 'web-application'
      });

      const originalTitle = original.title;
      const originalProjectType = original.projectType;
      const originalFeatureCount = original.features.length;

      const enhanced = await enhancer.enhanceRequirements(original);
      const validation = await validator.validateRequirements(enhanced);

      // Core data should remain unchanged
      expect(enhanced.title).toBe(originalTitle);
      expect(enhanced.projectType).toBe(originalProjectType);
      // Features should only be added, not removed
      expect(enhanced.features.length).toBeGreaterThanOrEqual(originalFeatureCount);
      // Validation should not modify the requirements
      expect(validation.isValid).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty or minimal requirements', async () => {
      const minimal = {
        title: '',
        description: '',
        features: []
      } as any;

      const validation = await validator.validateRequirements(minimal);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);

      // Should not throw errors
      expect(() => validation).not.toThrow();
    });

    it('should handle invalid dates in timeline', async () => {
      const requirements = createMockRequirements();
      requirements.timeline.phases[0].startDate = new Date('invalid');
      requirements.timeline.phases[0].endDate = new Date('2024-01-01');

      const result = await validator.validateRequirements(requirements);
      
      // Should handle gracefully without crashing
      expect(result).toBeDefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle extremely large feature sets', async () => {
      const requirements = createMockRequirements();
      // Add 1000 features
      for (let i = 0; i < 1000; i++) {
        requirements.features.push({
          id: `bulk-${i}`,
          name: `Bulk Feature ${i}`,
          description: `Generated feature ${i}`,
          category: 'bulk',
          priority: 'low' as Priority,
          estimatedHours: 1,
          dependencies: [],
          acceptance_criteria: [],
          techRequirements: []
        });
      }

      const startTime = Date.now();
      const result = await validator.validateRequirements(requirements);
      const duration = Date.now() - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });
});