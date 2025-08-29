import { TechSpecValidator, ValidationResult } from '../validation/TechSpecValidator';
import * as fs from 'fs-extra';
import * as path from 'path';

export interface ProjectSpecs {
  mainSpec: string;
  projectSpec: string;
  todoSpec: string;
  validationReport?: string;
  isValid?: boolean;
}

export class SpecGenerator {
  private validator: TechSpecValidator;
  
  constructor() {
    this.validator = new TechSpecValidator();
  }
  
  async generate(projectIdea: string, mode: 'create' | 'task' | 'plan'): Promise<ProjectSpecs> {
    console.log('🤖 Enhancing project specifications...');
    
    // For now, we'll use templates and enhance them
    // In production, this would call Claude API for enhancement
    const enhanced = await this.enhanceWithAI(projectIdea, mode);
    
    // Generate initial specs
    let specs: ProjectSpecs = {
      mainSpec: this.generateMainSpec(enhanced),
      projectSpec: this.generateProjectSpec(enhanced),
      todoSpec: this.generateTodoSpec(enhanced)
    };
    
    // Validate tech stack
    console.log('🔍 Validating tech stack for accuracy...');
    const validationResult = await this.validator.validateTechStack(specs);
    
    // If there are critical errors, regenerate with optimized stack
    if (!validationResult.isValid && validationResult.optimizedStack) {
      console.log('⚠️  Tech stack has conflicts. Optimizing...');
      enhanced.tech = this.mapOptimizedStackToTech(validationResult.optimizedStack);
      
      // Regenerate specs with optimized stack
      specs = {
        mainSpec: this.generateMainSpec(enhanced),
        projectSpec: this.generateProjectSpec(enhanced),
        todoSpec: this.generateTodoSpec(enhanced)
      };
      
      // Re-validate to ensure fixes worked
      const revalidation = await this.validator.validateTechStack(specs);
      validationResult.isValid = revalidation.isValid;
      validationResult.errors = revalidation.errors;
    }
    
    // Generate validation report
    const report = await this.validator.generateValidationReport(validationResult);
    specs.validationReport = report;
    specs.isValid = validationResult.isValid;
    
    // Save validation report
    const projectPath = process.cwd();
    const specsPath = path.join(projectPath, 'specs');
    await fs.ensureDir(specsPath);
    await fs.writeFile(path.join(specsPath, 'validation-report.md'), report);
    
    // Log validation summary
    console.log(`✅ Tech Stack Validation: ${validationResult.isValid ? 'PASSED' : 'FAILED'}`);
    console.log(`   Errors: ${validationResult.errors.length}, Warnings: ${validationResult.warnings.length}`);
    console.log(`   Recommendations: ${validationResult.recommendations.length}`);
    
    return specs;
  }
  
  private mapOptimizedStackToTech(optimizedStack: any): any {
    return {
      frontend: optimizedStack.frontend?.framework || 'React',
      backend: optimizedStack.backend?.framework || 'Node.js',
      database: optimizedStack.backend?.database || 'PostgreSQL',
      deployment: optimizedStack.deployment?.containerization || 'Docker',
      testing: optimizedStack.testing?.framework || 'Jest'
    };
  }
  
  private async enhanceWithAI(projectIdea: string, _mode: string): Promise<any> {
    // Simulate AI enhancement
    // In production, this would call Claude API
    
    // Parse project idea for key components
    const keywords = projectIdea.toLowerCase();
    
    const tech = {
      frontend: 'React',
      backend: 'Node.js',
      database: 'PostgreSQL',
      deployment: 'Docker',
      testing: 'Jest'
    };
    
    // Detect technology preferences
    if (keywords.includes('vue')) tech.frontend = 'Vue';
    if (keywords.includes('angular')) tech.frontend = 'Angular';
    if (keywords.includes('python')) tech.backend = 'Python/FastAPI';
    if (keywords.includes('go')) tech.backend = 'Go';
    if (keywords.includes('mongo')) tech.database = 'MongoDB';
    if (keywords.includes('mysql')) tech.database = 'MySQL';
    
    return {
      idea: projectIdea,
      name: projectIdea.split(' ').slice(0, 3).join('-').toLowerCase(),
      description: `A ${projectIdea} built with modern technologies`,
      tech,
      features: this.extractFeatures(projectIdea),
      architecture: this.determineArchitecture(projectIdea)
    };
  }
  
  private extractFeatures(idea: string): string[] {
    const features = [];
    
    // Common feature keywords
    const featurePatterns = [
      { pattern: /auth|login|user/i, feature: 'User authentication and authorization' },
      { pattern: /real[\s-]?time/i, feature: 'Real-time data synchronization' },
      { pattern: /payment|billing/i, feature: 'Payment processing integration' },
      { pattern: /search/i, feature: 'Advanced search functionality' },
      { pattern: /admin|dashboard/i, feature: 'Admin dashboard and analytics' },
      { pattern: /api/i, feature: 'RESTful API endpoints' },
      { pattern: /mobile|responsive/i, feature: 'Mobile-responsive design' },
      { pattern: /notification/i, feature: 'Push notifications system' },
      { pattern: /chat|message/i, feature: 'Chat/messaging functionality' },
      { pattern: /file|upload/i, feature: 'File upload and management' }
    ];
    
    for (const { pattern, feature } of featurePatterns) {
      if (pattern.test(idea)) {
        features.push(feature);
      }
    }
    
    // Add default features if none detected
    if (features.length === 0) {
      features.push(
        'Core application functionality',
        'User interface',
        'Data management',
        'Basic CRUD operations'
      );
    }
    
    return features;
  }
  
  private determineArchitecture(idea: string): string {
    const keywords = idea.toLowerCase();
    
    if (keywords.includes('microservice')) {
      return 'microservices';
    } else if (keywords.includes('serverless')) {
      return 'serverless';
    } else if (keywords.includes('monolith')) {
      return 'monolithic';
    } else if (keywords.includes('mobile')) {
      return 'mobile-first';
    } else {
      return 'modular-monolith';
    }
  }
  
  private generateMainSpec(enhanced: any): string {
    return `# ${enhanced.name} - Main Specification

## Overview
${enhanced.description}

## Core Concept
${enhanced.idea}

## Architecture
- Type: ${enhanced.architecture}
- Frontend: ${enhanced.tech.frontend}
- Backend: ${enhanced.tech.backend}
- Database: ${enhanced.tech.database}
- Deployment: ${enhanced.tech.deployment}

## Key Features
${enhanced.features.map((f: string) => `- ${f}`).join('\n')}

## Success Criteria
- Fully functional application
- Responsive and intuitive UI
- Secure and scalable backend
- Comprehensive test coverage
- Production-ready deployment

## Technical Requirements
- Modern development practices
- Clean, maintainable code
- Documentation
- Performance optimization
- Security best practices
`;
  }
  
  private generateProjectSpec(enhanced: any): string {
    return `# ${enhanced.name} - Project Specification

## Technical Stack

### Frontend
- Framework: ${enhanced.tech.frontend}
- State Management: ${enhanced.tech.frontend === 'React' ? 'Redux/Context' : 'Vuex/Pinia'}
- Styling: Tailwind CSS
- Build Tool: Vite

### Backend
- Runtime: ${enhanced.tech.backend}
- Framework: ${enhanced.tech.backend.includes('Node') ? 'Express/Fastify' : enhanced.tech.backend}
- Authentication: JWT
- Validation: Joi/Zod

### Database
- Primary: ${enhanced.tech.database}
- ORM: ${enhanced.tech.database === 'PostgreSQL' ? 'Prisma' : 'Mongoose'}
- Caching: Redis

### DevOps
- Containerization: ${enhanced.tech.deployment}
- CI/CD: GitHub Actions
- Monitoring: Prometheus/Grafana

## Project Structure
\`\`\`
${enhanced.name}/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/
│   ├── src/
│   ├── tests/
│   └── package.json
├── database/
│   ├── migrations/
│   └── seeds/
├── docker/
│   └── docker-compose.yml
└── docs/
    └── README.md
\`\`\`

## Development Phases
1. Setup and Architecture
2. Core Implementation
3. Integration
4. Testing and Optimization
5. Deployment Preparation
`;
  }
  
  private generateTodoSpec(enhanced: any): string {
    const todos = [];
    
    // Phase 1: Setup
    todos.push(
      '## Phase 1: Setup & Architecture',
      '- [ ] Initialize project structure',
      '- [ ] Set up development environment',
      '- [ ] Configure build tools',
      '- [ ] Set up version control',
      '- [ ] Create base architecture'
    );
    
    // Phase 2: Frontend
    todos.push(
      '\n## Phase 2: Frontend Development',
      `- [ ] Set up ${enhanced.tech.frontend} application`,
      '- [ ] Create component structure',
      '- [ ] Implement routing',
      '- [ ] Design UI components',
      '- [ ] Add state management'
    );
    
    // Phase 3: Backend
    todos.push(
      '\n## Phase 3: Backend Development',
      `- [ ] Set up ${enhanced.tech.backend} server`,
      '- [ ] Create API structure',
      '- [ ] Implement authentication',
      '- [ ] Add data validation',
      '- [ ] Create business logic'
    );
    
    // Phase 4: Database
    todos.push(
      '\n## Phase 4: Database & Integration',
      `- [ ] Set up ${enhanced.tech.database}`,
      '- [ ] Design schema',
      '- [ ] Create migrations',
      '- [ ] Implement data models',
      '- [ ] Connect backend to database'
    );
    
    // Phase 5: Features
    todos.push(
      '\n## Phase 5: Feature Implementation'
    );
    for (const feature of enhanced.features) {
      todos.push(`- [ ] Implement ${feature}`);
    }
    
    // Phase 6: Testing
    todos.push(
      '\n## Phase 6: Testing & Optimization',
      '- [ ] Write unit tests',
      '- [ ] Create integration tests',
      '- [ ] Perform E2E testing',
      '- [ ] Optimize performance',
      '- [ ] Fix bugs and issues'
    );
    
    // Phase 7: Deployment
    todos.push(
      '\n## Phase 7: Deployment',
      '- [ ] Configure Docker containers',
      '- [ ] Set up CI/CD pipeline',
      '- [ ] Prepare production environment',
      '- [ ] Create deployment scripts',
      '- [ ] Write documentation'
    );
    
    return `# ${enhanced.name} - Todo Specification

${todos.join('\n')}

## Notes
- Each phase should be completed before moving to the next
- All agents work in parallel within each phase
- Regular synchronization points ensure consistency
`;
  }
}