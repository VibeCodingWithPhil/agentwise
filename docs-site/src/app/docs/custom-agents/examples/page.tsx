import { Code, Shield, Search, Zap, Database, Palette, TestTube, GitBranch } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const agentExamples = [
  {
    name: "Code Review Specialist",
    description: "Automated code review with best practices enforcement",
    icon: Search,
    category: "Quality",
    features: ["Style checking", "Security scanning", "Performance analysis", "Documentation review"],
    definition: `# Code Review Specialist

## Role
You are a code review specialist focused on ensuring code quality, security, and maintainability.

## Capabilities
- Analyze code for bugs and vulnerabilities
- Check adherence to coding standards
- Suggest performance improvements
- Verify test coverage
- Review documentation completeness

## Review Checklist
1. Code correctness and logic
2. Security vulnerabilities
3. Performance bottlenecks
4. Code style and formatting
5. Test coverage adequacy
6. Documentation quality`,
    usage: "/generate-agent code-review-specialist"
  },
  {
    name: "Security Audit Agent",
    description: "Comprehensive security vulnerability detection and remediation",
    icon: Shield,
    category: "Security",
    features: ["OWASP scanning", "Dependency audit", "Secret detection", "Compliance checks"],
    definition: `# Security Audit Agent

## Role
You are a security specialist focused on identifying and fixing vulnerabilities.

## Capabilities
- OWASP Top 10 vulnerability scanning
- Dependency vulnerability checking
- Secret and credential detection
- Security header validation
- SQL injection prevention
- XSS attack prevention

## Security Frameworks
- OWASP Security Guidelines
- CWE/SANS Top 25
- PCI DSS Compliance
- GDPR Requirements`,
    usage: "/task 'Perform security audit'"
  },
  {
    name: "Performance Optimizer",
    description: "Application performance analysis and optimization",
    icon: Zap,
    category: "Performance",
    features: ["Bundle analysis", "Memory profiling", "Load time optimization", "Caching strategies"],
    definition: `# Performance Optimizer

## Role
You specialize in improving application performance and resource efficiency.

## Optimization Areas
- Frontend bundle size reduction
- API response time improvement
- Database query optimization
- Memory leak detection
- Caching implementation
- Lazy loading strategies

## Metrics Tracked
- Page Load Time
- Time to Interactive
- First Contentful Paint
- API Response Times
- Memory Usage`,
    usage: "/task 'Optimize application performance'"
  },
  {
    name: "Database Migration Specialist",
    description: "Handles complex database migrations and schema updates",
    icon: Database,
    category: "Data",
    features: ["Schema migration", "Data transformation", "Rollback planning", "Zero-downtime updates"],
    definition: `# Database Migration Specialist

## Role
You manage database migrations, schema updates, and data transformations.

## Capabilities
- Schema design and optimization
- Migration script generation
- Data transformation pipelines
- Rollback strategy planning
- Performance impact analysis

## Supported Databases
- PostgreSQL
- MySQL
- MongoDB
- Redis
- SQLite`,
    usage: "/task 'Migrate database schema'"
  }
]

const implementationExamples = [
  {
    title: "E-Commerce Platform Agent Team",
    description: "Complete agent setup for building an e-commerce platform",
    agents: ["Frontend Specialist", "Backend API Developer", "Database Architect", "Payment Integration Expert"],
    code: `// Agent team configuration
const ecommerceTeam = {
  agents: [
    { name: 'frontend', focus: 'React storefront' },
    { name: 'backend', focus: 'Node.js API' },
    { name: 'database', focus: 'PostgreSQL + Redis' },
    { name: 'payments', focus: 'Stripe integration' }
  ],
  workflow: 'parallel-execution',
  contextSharing: true
}`
  },
  {
    title: "DevOps Pipeline Agent",
    description: "CI/CD pipeline automation specialist",
    agents: ["DevOps Engineer", "Test Automation", "Security Scanner"],
    code: `# DevOps Pipeline Agent

## Automated Tasks
1. Code checkout and validation
2. Dependency installation
3. Unit and integration testing
4. Security vulnerability scanning
5. Docker image building
6. Kubernetes deployment
7. Health check monitoring`
  },
  {
    title: "Mobile App Development Team",
    description: "Cross-platform mobile application development",
    agents: ["React Native Developer", "iOS Specialist", "Android Specialist", "Backend API"],
    code: `// Mobile app agent configuration
const mobileTeam = {
  platforms: ['ios', 'android'],
  framework: 'react-native',
  agents: [
    'mobile-ui-designer',
    'react-native-developer',
    'platform-specialist',
    'api-developer'
  ]
}`
  }
]

const useCases = [
  { useCase: "Greenfield Project", agents: "Full team with all specialists", complexity: "High" },
  { useCase: "Legacy Modernization", agents: "Migration + Refactoring specialists", complexity: "High" },
  { useCase: "Bug Fixing", agents: "Debugging + Testing specialists", complexity: "Low" },
  { useCase: "Feature Addition", agents: "Relevant domain specialists", complexity: "Medium" },
  { useCase: "Performance Tuning", agents: "Performance + Database optimizers", complexity: "Medium" },
  { useCase: "Security Hardening", agents: "Security + DevOps specialists", complexity: "High" }
]

export default function ExamplesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Code className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Agent Examples</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Real-world examples of custom agents and implementation patterns.
            </p>
          </div>
        </div>
      </div>

      {/* Featured Agent Examples */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🌟 Featured Agent Examples</h2>
        <p className="text-muted-foreground">
          Production-ready agent definitions you can use immediately.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {agentExamples.map((agent, index) => {
            const IconComponent = agent.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-accent" />
                    {agent.name}
                  </CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">Key Features:</h4>
                        <Badge variant="outline" className="text-xs">
                          {agent.category}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {agent.features.map((feature, fIdx) => (
                          <Badge key={fIdx} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Definition:</h4>
                      <div className="max-h-48 overflow-y-auto">
                        <CodeBlock language="markdown">{agent.definition}</CodeBlock>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t">
                      <p className="text-xs font-medium mb-1">Usage:</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {agent.usage}
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Implementation Examples */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🛠️ Implementation Patterns</h2>
        <p className="text-muted-foreground">
          Complete agent team configurations for common projects.
        </p>
        
        <div className="space-y-4">
          {implementationExamples.map((example, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{example.title}</CardTitle>
                <CardDescription>{example.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Agent Team:</h4>
                    <div className="flex flex-wrap gap-1">
                      {example.agents.map((agent, aIdx) => (
                        <Badge key={aIdx} variant="outline" className="text-xs">
                          {agent}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Configuration:</h4>
                    <CodeBlock language="javascript">{example.code}</CodeBlock>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Use Cases */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🎯 Common Use Cases</h2>
        <p className="text-muted-foreground">
          Agent recommendations for different project scenarios.
        </p>
        
        <div className="space-y-3">
          {useCases.map((useCase, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{useCase.useCase}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{useCase.agents}</p>
                  </div>
                  <Badge 
                    variant={
                      useCase.complexity === "High" ? "destructive" :
                      useCase.complexity === "Medium" ? "secondary" : "outline"
                    }
                    className="ml-4"
                  >
                    {useCase.complexity} Complexity
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Start Guide */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Quick Start Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">1. Choose an Example</h3>
              <p className="text-sm text-muted-foreground">
                Select an agent example that matches your needs from the featured examples above.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">2. Generate the Agent</h3>
              <CodeBlock language="bash">{`# Use the generate command
/generate-agent "agent-name"

# Or copy the definition to .claude/agents/`}</CodeBlock>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">3. Test the Agent</h3>
              <CodeBlock language="bash">{`# Create a test project
/create "Test project for new agent"

# Use the agent in a task
/task "Task requiring the new agent"`}</CodeBlock>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">4. Customize as Needed</h3>
              <p className="text-sm text-muted-foreground">
                Modify the agent definition based on your specific requirements and feedback.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
