/**
 * Example Usage of Visual Specification Generator
 * 
 * This file demonstrates how to use the Visual Specification Generator
 * with the Requirements system to create beautiful HTML specifications.
 */

import { RequirementsGenerator, VisualSpecGenerator } from './index';

// Example: Complete workflow from idea to visual spec
async function exampleWorkflow() {
  console.log('🚀 AgentWise Requirements to Visual Spec Example\n');

  // Step 1: Generate requirements from project idea
  console.log('Step 1: Generate requirements from project idea...');
  const requirementsGenerator = new RequirementsGenerator();
  
  const generationResult = await requirementsGenerator.generateRequirements({
    projectIdea: 'A social media platform for developers to share code snippets, collaborate on projects, and build their professional network. Should include real-time chat, code highlighting, project showcases, and integration with GitHub.',
    targetAudience: 'intermediate',
    validateOutput: true,
    optimizeForCompatibility: true,
    timelineConstraint: 120, // 4 months
    teamSizeConstraint: 6,
    preferredTechnologies: ['React', 'Node.js', 'PostgreSQL'],
    performanceRequirements: {
      expectedUsers: 10000,
      maxResponseTime: 200
    }
  });

  console.log(`✅ Requirements generated with ${generationResult.requirements.features.length} features`);
  console.log(`   Confidence score: ${generationResult.confidence}%`);
  console.log(`   Processing time: ${generationResult.processingTime}ms\n`);

  // Step 2: Generate visual specification
  console.log('Step 2: Generate visual specification...');
  const visualGenerator = new VisualSpecGenerator();

  const visualSpec = await visualGenerator.generateVisualSpec(generationResult.requirements, {
    theme: 'light',
    includeInteractivity: true,
    includeDatabase: true,
    includeTimeline: true,
    includeTeam: true,
    includeTechStack: true,
    title: 'DevConnect - Visual Requirements Specification'
  });

  console.log(`✅ Visual specification generated`);
  console.log(`   HTML size: ${(visualSpec.fullHtml.length / 1024).toFixed(1)} KB`);
  console.log(`   Features visualized: ${visualSpec.metadata.featuresCount}`);
  console.log(`   Complexity level: ${visualSpec.metadata.complexity}\n`);

  // Step 3: Export to file (example)
  console.log('Step 3: Export specification to file...');
  try {
    // In a real Node.js environment, this would work:
    // await visualGenerator.exportToFile(visualSpec, 'devconnect-spec.html');
    console.log('✅ Specification would be exported to "devconnect-spec.html"');
  } catch (error) {
    console.log('⚠️ File export requires Node.js environment');
  }

  console.log('\n🎉 Complete workflow finished!');
  console.log('📄 Generated self-contained HTML specification ready for sharing');

  return {
    requirements: generationResult.requirements,
    visualSpec: visualSpec
  };
}

// Example: Multiple theme variations
async function exampleThemeVariations() {
  console.log('🎨 Theme Variations Example\n');

  const visualGenerator = new VisualSpecGenerator();
  
  // Sample requirements for demonstration
  const sampleRequirements = {
    id: 'sample-001',
    title: 'Sample Project',
    description: 'A demonstration project for visual specification themes',
    projectType: 'web-application' as const,
    scope: 'standard' as const,
    complexity: 'moderate' as const,
    architecture: 'spa' as const,
    features: [
      {
        id: 'feat-001',
        name: 'User Authentication',
        description: 'Basic user login and registration',
        category: 'authentication' as const,
        priority: 'high' as const,
        complexity: 'moderate' as const,
        estimatedHours: 20,
        dependencies: [] as any[],
        requirements: ['Email/password login', 'Registration form'],
        acceptance_criteria: ['Users can register', 'Users can login'],
        tags: ['auth', 'security'],
        status: 'approved' as const,
        techRequirements: [] as any[]
      }
    ],
    techStack: {
      frontend: {
        framework: 'React',
        language: 'TypeScript',
        buildTool: 'Vite',
        packageManager: 'npm',
        additionalLibraries: [] as string[]
      }
    },
    timeline: {
      phases: [] as any[],
      totalDuration: 30,
      milestones: [] as any[],
      dependencies: [] as any[],
      bufferTime: 5,
      criticalPath: [] as string[]
    },
    team: {
      size: 3,
      roles: [] as any[],
      skills: [] as any[],
      structure: 'small-team' as const,
      communication: {
        meetings: [] as any[],
        tools: [] as string[],
        reporting: [] as any[],
        escalation: [] as any[]
      },
      development: 'agile' as const
    },
    constraints: [] as any[],
    metadata: {
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'Demo User',
      stakeholders: [] as any[],
      approvals: [] as any[],
      changeLog: [] as any[],
      tags: [] as string[],
      source: 'template-based' as const
    },
    deployment: {
      platform: ['vercel'],
      cicd: {} as any,
      monitoring: {} as any,
      backup: {} as any,
      scaling: {} as any
    } as any
  };

  // Generate light theme
  console.log('Generating light theme specification...');
  const lightSpec = await visualGenerator.generateVisualSpec(sampleRequirements, {
    theme: 'light',
    title: 'Light Theme Demo'
  });

  // Generate dark theme
  console.log('Generating dark theme specification...');
  const darkSpec = await visualGenerator.generateVisualSpec(sampleRequirements, {
    theme: 'dark',
    title: 'Dark Theme Demo'
  });

  // Generate custom styled version
  console.log('Generating custom styled specification...');
  const customCSS = `
    :root {
      --primary-color: #ff6b6b;
      --secondary-color: #4ecdc4;
      --accent-color: #45b7d1;
    }
    .spec-title {
      background: linear-gradient(45deg, var(--primary-color), var(--secondary-color));
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
  `;

  const customSpec = await visualGenerator.generateVisualSpec(sampleRequirements, {
    theme: 'light',
    customCSS: customCSS,
    title: 'Custom Brand Demo'
  });

  console.log(`✅ Generated 3 theme variations:`);
  console.log(`   Light theme: ${(lightSpec.fullHtml.length / 1024).toFixed(1)} KB`);
  console.log(`   Dark theme: ${(darkSpec.fullHtml.length / 1024).toFixed(1)} KB`);
  console.log(`   Custom theme: ${(customSpec.fullHtml.length / 1024).toFixed(1)} KB\n`);

  return {
    light: lightSpec,
    dark: darkSpec,
    custom: customSpec
  };
}

// Example: Minimal specification for quick documentation
async function exampleMinimalSpec() {
  console.log('📝 Minimal Specification Example\n');

  const visualGenerator = new VisualSpecGenerator();

  // Create minimal requirements
  const minimalRequirements = {
    id: 'minimal-001',
    title: 'Quick Project Spec',
    description: 'A minimal example for quick documentation',
    projectType: 'cli-tool' as const,
    scope: 'minimal' as const,
    complexity: 'simple' as const,
    architecture: 'monolithic' as const,
    features: [
      {
        id: 'feat-001',
        name: 'Command Line Interface',
        description: 'Basic CLI with help and version commands',
        category: 'ui-ux' as const,
        priority: 'critical' as const,
        complexity: 'simple' as const,
        estimatedHours: 8,
        dependencies: [] as any[],
        requirements: ['Argument parsing', 'Help system'],
        acceptance_criteria: ['CLI accepts commands', 'Help text displays'],
        tags: ['cli'],
        status: 'approved' as const,
        techRequirements: [] as any[]
      }
    ],
    techStack: {
      backend: {
        runtime: 'Node.js',
        framework: 'Commander.js',
        language: 'JavaScript',
        apiType: 'REST' as const,
        authentication: [] as any[],
        authorization: [] as any[],
        middleware: [] as any[],
        logging: [] as any[],
        monitoring: [] as any[],
        additionalLibraries: [] as string[]
      }
    },
    timeline: {
      phases: [] as any[],
      totalDuration: 7,
      milestones: [] as any[],
      dependencies: [] as any[],
      bufferTime: 1,
      criticalPath: [] as string[]
    },
    team: {
      size: 1,
      roles: [] as any[],
      skills: [] as any[],
      structure: 'single-developer' as const,
      communication: {
        meetings: [] as any[],
        tools: [] as string[],
        reporting: [] as any[],
        escalation: [] as any[]
      },
      development: 'lean' as const
    },
    constraints: [] as any[],
    metadata: {
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'Solo Developer',
      stakeholders: [] as any[],
      approvals: [] as any[],
      changeLog: [] as any[],
      tags: ['cli', 'simple'],
      source: 'template-based' as const
    },
    deployment: {
      platform: ['npm'],
      cicd: {} as any,
      monitoring: {} as any,
      backup: {} as any,
      scaling: {} as any
    } as any
  };

  // Generate minimal spec without interactivity or extra sections
  const minimalSpec = await visualGenerator.generateVisualSpec(minimalRequirements, {
    theme: 'light',
    includeInteractivity: false,
    includeDatabase: false,
    includeTimeline: false,
    includeTeam: false,
    includeTechStack: true,
    title: 'Quick CLI Tool Specification'
  });

  console.log(`✅ Minimal specification generated:`);
  console.log(`   Size: ${(minimalSpec.fullHtml.length / 1024).toFixed(1)} KB`);
  console.log(`   Interactive features: ${minimalSpec.javascript.length > 0 ? 'Yes' : 'No'}`);
  console.log(`   Sections included: Features + Tech Stack only\n`);

  return minimalSpec;
}

// Export examples for use
export {
  exampleWorkflow,
  exampleThemeVariations,
  exampleMinimalSpec
};

// Demo runner (uncomment to run examples)
/*
async function runExamples() {
  try {
    await exampleWorkflow();
    console.log('\n' + '='.repeat(60) + '\n');
    await exampleThemeVariations();
    console.log('\n' + '='.repeat(60) + '\n');
    await exampleMinimalSpec();
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Uncomment to run examples:
// runExamples();
*/