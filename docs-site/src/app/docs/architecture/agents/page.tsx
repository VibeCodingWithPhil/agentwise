import { Users, Code, Database, TestTube, Palette, Server, Smartphone, Shield } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const agentTypes = [
  {
    name: "Frontend Specialist",
    icon: Code,
    description: "Handles UI/UX, components, and client-side functionality",
    responsibilities: ["React/Vue components", "Responsive design", "State management", "User interactions"],
    technologies: ["React", "Vue", "Angular", "TypeScript", "CSS", "Tailwind"]
  },
  {
    name: "Backend Specialist",
    icon: Server,
    description: "Manages server-side logic, APIs, and business rules",
    responsibilities: ["API development", "Business logic", "Authentication", "Data processing"],
    technologies: ["Node.js", "Python", "Go", "Java", "Express", "FastAPI"]
  },
  {
    name: "Database Specialist",
    icon: Database,
    description: "Designs and implements data storage solutions",
    responsibilities: ["Schema design", "Query optimization", "Data modeling", "Migrations"],
    technologies: ["PostgreSQL", "MongoDB", "MySQL", "Redis", "Prisma", "TypeORM"]
  },
  {
    name: "Testing Specialist",
    icon: TestTube,
    description: "Ensures code quality through comprehensive testing",
    responsibilities: ["Unit tests", "Integration tests", "E2E testing", "Test automation"],
    technologies: ["Jest", "Playwright", "Cypress", "Vitest", "Storybook", "Testing Library"]
  },
  {
    name: "Designer Specialist",
    icon: Palette,
    description: "Focuses on UI/UX design and visual consistency",
    responsibilities: ["Design systems", "Component styling", "Accessibility", "Visual design"],
    technologies: ["Figma", "Tailwind CSS", "CSS-in-JS", "Design tokens", "SCSS"]
  },
  {
    name: "DevOps Specialist",
    icon: Shield,
    description: "Handles deployment, CI/CD, and infrastructure",
    responsibilities: ["CI/CD pipelines", "Docker containers", "Cloud deployment", "Monitoring"],
    technologies: ["Docker", "Kubernetes", "GitHub Actions", "Vercel", "AWS", "Terraform"]
  },
  {
    name: "Mobile Specialist",
    icon: Smartphone,
    description: "Develops cross-platform mobile applications",
    responsibilities: ["Mobile UI", "Platform APIs", "Performance", "App store deployment"],
    technologies: ["React Native", "Flutter", "Expo", "Swift", "Kotlin"]
  },
  {
    name: "Research Specialist",
    icon: Users,
    description: "Provides real-time research and technology insights",
    responsibilities: ["Technology research", "Best practices", "Library selection", "Performance analysis"],
    technologies: ["Web scraping", "API research", "Documentation analysis", "Benchmarking"]
  }
]

const collaborationPatterns = [
  {
    pattern: "Sequential Handoffs",
    description: "Agents complete work in sequence, passing results to the next",
    example: "Database → Backend → Frontend → Testing"
  },
  {
    pattern: "Parallel Execution",
    description: "Multiple agents work simultaneously on independent tasks",
    example: "Frontend + Backend + Database working concurrently"
  },
  {
    pattern: "Cross-Agent Review",
    description: "Agents review and validate each other's work",
    example: "Testing agent validates Frontend and Backend implementations"
  },
  {
    pattern: "Dynamic Coordination",
    description: "Agents adapt and coordinate based on project needs",
    example: "Research agent provides insights to inform other agents"
  }
]

export default function AgentsArchitecturePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Users className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Agent System Architecture</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Specialized agents work together in perfect harmony to create complex applications efficiently.
            </p>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400">
            🎯 Multi-Agent Orchestration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-accent mb-1">8</div>
              <div className="text-sm text-muted-foreground">Specialized Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent mb-1">61</div>
              <div className="text-sm text-muted-foreground">MCP Integrations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent mb-1">3</div>
              <div className="text-sm text-muted-foreground">Max Concurrent</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Types */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🤖 Specialized Agents</h2>
        <p className="text-muted-foreground">
          Each agent is an expert in their domain with specialized knowledge and capabilities.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {agentTypes.map((agent, index) => {
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
                      <h4 className="font-medium text-sm mb-2">Key Responsibilities:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {agent.responsibilities.map((resp, respIndex) => (
                          <li key={respIndex}>• {resp}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Technologies:</h4>
                      <div className="flex flex-wrap gap-1">
                        {agent.technologies.map((tech, techIndex) => (
                          <Badge key={techIndex} variant="outline" className="text-xs">
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Collaboration Patterns */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🔄 Collaboration Patterns</h2>
        <p className="text-muted-foreground">
          Agents use different collaboration strategies depending on project requirements and complexity.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {collaborationPatterns.map((pattern, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <h3 className="font-semibold text-foreground">{pattern.pattern}</h3>
                  <p className="text-sm text-muted-foreground">{pattern.description}</p>
                  <div className="p-3 bg-muted/30 rounded text-xs">
                    <strong>Example:</strong> {pattern.example}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Agent Communication */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-400">
            🔗 Inter-Agent Communication
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Context Sharing</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Shared project context and requirements</li>
                <li>• Real-time progress updates and notifications</li>
                <li>• Automatic conflict detection and resolution</li>
                <li>• Token-optimized communication protocols</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Quality Assurance</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Cross-agent code review and validation</li>
                <li>• Consistency checks across all components</li>
                <li>• Automated integration testing</li>
                <li>• Performance and security auditing</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
