import { Code, Palette, Database, Shield, TestTube, Cloud, Brain, Users } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const agentCategories = [
  {
    category: "Development Agents",
    description: "Code generation and implementation specialists",
    icon: Code,
    color: "blue",
    agents: [
      { name: "Frontend Specialist", focus: "React, Vue, Angular", tasks: "UI components, state management" },
      { name: "Backend Specialist", focus: "Node.js, Python, APIs", tasks: "Server logic, data processing" },
      { name: "Full-Stack Developer", focus: "End-to-end solutions", tasks: "Complete features, integrations" },
      { name: "Mobile Developer", focus: "React Native, Flutter", tasks: "Mobile apps, responsive design" }
    ]
  },
  {
    category: "Design Agents",
    description: "User interface and experience specialists",
    icon: Palette,
    color: "purple",
    agents: [
      { name: "UI Designer", focus: "Visual design, layouts", tasks: "Mockups, design systems" },
      { name: "UX Specialist", focus: "User flows, research", tasks: "Wireframes, prototypes" },
      { name: "Design System Architect", focus: "Component libraries", tasks: "Style guides, tokens" },
      { name: "Accessibility Expert", focus: "WCAG compliance", tasks: "A11y audits, improvements" }
    ]
  },
  {
    category: "Data Agents",
    description: "Database and data processing specialists",
    icon: Database,
    color: "green",
    agents: [
      { name: "Database Architect", focus: "Schema design, optimization", tasks: "Data modeling, migrations" },
      { name: "Data Engineer", focus: "ETL pipelines, processing", tasks: "Data flows, transformations" },
      { name: "Analytics Specialist", focus: "Business intelligence", tasks: "Reports, dashboards" },
      { name: "Cache Optimizer", focus: "Redis, Memcached", tasks: "Caching strategies, performance" }
    ]
  },
  {
    category: "Quality Agents",
    description: "Testing and quality assurance specialists",
    icon: TestTube,
    color: "orange",
    agents: [
      { name: "Test Engineer", focus: "Unit, integration tests", tasks: "Test suites, coverage" },
      { name: "QA Automation", focus: "E2E testing, CI/CD", tasks: "Test automation, pipelines" },
      { name: "Performance Tester", focus: "Load testing, profiling", tasks: "Benchmarks, optimization" },
      { name: "Security Auditor", focus: "Vulnerability scanning", tasks: "Security reviews, fixes" }
    ]
  },
  {
    category: "Infrastructure Agents",
    description: "DevOps and infrastructure specialists",
    icon: Cloud,
    color: "indigo",
    agents: [
      { name: "DevOps Engineer", focus: "CI/CD, automation", tasks: "Pipelines, deployments" },
      { name: "Cloud Architect", focus: "AWS, Azure, GCP", tasks: "Infrastructure design" },
      { name: "Container Specialist", focus: "Docker, Kubernetes", tasks: "Containerization, orchestration" },
      { name: "Monitoring Expert", focus: "Observability, logging", tasks: "Metrics, alerting" }
    ]
  },
  {
    category: "Specialized Agents",
    description: "Domain-specific and advanced specialists",
    icon: Brain,
    color: "pink",
    agents: [
      { name: "AI/ML Engineer", focus: "Machine learning models", tasks: "Model training, deployment" },
      { name: "Blockchain Developer", focus: "Smart contracts, DApps", tasks: "Web3 integration" },
      { name: "Game Developer", focus: "Game engines, physics", tasks: "Game mechanics, graphics" },
      { name: "IoT Specialist", focus: "Embedded systems", tasks: "Device integration" }
    ]
  }
]

const agentCapabilities = [
  { capability: "Code Generation", description: "Write production-ready code", agents: ["Frontend", "Backend", "Full-Stack"] },
  { capability: "Architecture Design", description: "System design and planning", agents: ["Cloud Architect", "Database Architect"] },
  { capability: "Testing & QA", description: "Comprehensive quality assurance", agents: ["Test Engineer", "QA Automation"] },
  { capability: "Performance Optimization", description: "Speed and efficiency improvements", agents: ["Performance Tester", "Cache Optimizer"] },
  { capability: "Security Hardening", description: "Vulnerability detection and fixes", agents: ["Security Auditor", "DevOps Engineer"] },
  { capability: "Documentation", description: "Technical documentation and guides", agents: ["All Agents"] }
]

export default function AgentTypesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Users className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Agent Types</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Comprehensive catalog of specialized AI agents for every development need.
            </p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400">
            📊 Agent Ecosystem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-accent">6</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">24+</div>
              <div className="text-sm text-muted-foreground">Agent Types</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">100+</div>
              <div className="text-sm text-muted-foreground">Capabilities</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">Unlimited</div>
              <div className="text-sm text-muted-foreground">Customization</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Categories */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🤖 Agent Categories</h2>
        <p className="text-muted-foreground">
          Organized by specialization and primary responsibilities.
        </p>
        
        <div className="space-y-6">
          {agentCategories.map((category, index) => {
            const IconComponent = category.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-accent" />
                    {category.category}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {category.agents.map((agent, agentIdx) => (
                      <div key={agentIdx} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-sm">{agent.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            Active
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">
                          <strong>Focus:</strong> {agent.focus}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          <strong>Tasks:</strong> {agent.tasks}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Core Capabilities */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🚀 Core Capabilities</h2>
        <p className="text-muted-foreground">
          Key capabilities across all agent types.
        </p>
        
        <div className="space-y-3">
          {agentCapabilities.map((capability, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{capability.capability}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{capability.description}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {capability.agents.map((agent, aIdx) => (
                        <Badge key={aIdx} variant="secondary" className="text-xs">
                          {agent}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Selection Guide */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Agent Selection Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">By Project Type</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Web App:</strong> Frontend + Backend + Database</li>
                <li>• <strong>Mobile App:</strong> Mobile + Backend + UI Designer</li>
                <li>• <strong>API Service:</strong> Backend + Database + DevOps</li>
                <li>• <strong>Enterprise:</strong> Full team with all specialists</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">By Development Phase</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• <strong>Planning:</strong> Architect agents</li>
                <li>• <strong>Development:</strong> Developer agents</li>
                <li>• <strong>Testing:</strong> QA and test agents</li>
                <li>• <strong>Deployment:</strong> DevOps agents</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
