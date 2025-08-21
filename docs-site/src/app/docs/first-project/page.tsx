import Link from "next/link"
import { Rocket, Users, Monitor, Plus, CheckCircle, AlertCircle, Clock, Terminal } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const projectSteps = [
  {
    step: 1,
    title: "Start Claude Code",
    description: "Launch Claude Code with the required permissions flag",
    code: "claude --dangerously-skip-permissions",
    icon: Terminal,
    duration: "30 seconds",
    tips: [
      "Always use this flag - Agentwise won't work without it",
      "Keep Claude Code running throughout your project",
      "You'll see a confirmation message when it starts"
    ]
  },
  {
    step: 2,
    title: "Create Your Project",
    description: "Describe your project idea in natural language",
    code: '/create "a todo app with React and TypeScript"',
    icon: Rocket,
    duration: "1-2 minutes",
    tips: [
      "Be specific about technologies you want to use",
      "Mention key features like authentication, database, etc.",
      "Don't worry about technical details - agents will figure it out"
    ]
  },
  {
    step: 3,
    title: "Watch Agent Collaboration",
    description: "Observe as 8 specialized agents work together",
    code: "# Agents will automatically start creating:\n# - Project structure\n# - Dependencies\n# - Core functionality",
    icon: Users,
    duration: "5-15 minutes",
    tips: [
      "Each agent handles their specialty (frontend, backend, etc.)",
      "You'll see agent-todo folders being created",
      "Progress is tracked automatically"
    ]
  },
  {
    step: 4,
    title: "Monitor Progress",
    description: "Open the real-time monitoring dashboard",
    code: "/monitor",
    icon: Monitor,
    duration: "Throughout project",
    tips: [
      "Dashboard opens at http://localhost:3001",
      "See real-time progress from all agents",
      "Watch token usage and optimization"
    ]
  },
  {
    step: 5,
    title: "Add Features",
    description: "Enhance your project with additional functionality",
    code: '/task "add user authentication"',
    icon: Plus,
    duration: "2-10 minutes",
    tips: [
      "Add features to existing projects anytime",
      "Use specific descriptions for better results",
      "Agents will coordinate to avoid conflicts"
    ]
  }
]

const projectTypes = [
  {
    type: "Web Application",
    description: "Full-stack web apps with modern frameworks",
    examples: [
      "React dashboard with charts",
      "Next.js blog with CMS",
      "Vue.js e-commerce platform"
    ],
    agents: ["Frontend", "Backend", "Database", "Testing"],
    complexity: "Medium",
    timeEstimate: "10-20 minutes"
  },
  {
    type: "Mobile App",
    description: "Cross-platform mobile applications", 
    examples: [
      "React Native weather app",
      "Flutter expense tracker",
      "Expo social media app"
    ],
    agents: ["Mobile", "Backend", "Database", "Testing"],
    complexity: "Medium",
    timeEstimate: "15-25 minutes"
  },
  {
    type: "API Service",
    description: "Backend APIs and microservices",
    examples: [
      "REST API with authentication",
      "GraphQL server",
      "Microservice with Redis"
    ],
    agents: ["Backend", "Database", "Testing", "DevOps"],
    complexity: "Low",
    timeEstimate: "5-15 minutes"
  },
  {
    type: "Desktop App",
    description: "Cross-platform desktop applications",
    examples: [
      "Electron text editor",
      "Tauri system monitor",
      "Desktop file manager"
    ],
    agents: ["Desktop", "Frontend", "Testing"],
    complexity: "High", 
    timeEstimate: "20-30 minutes"
  }
]

const commonIssues = [
  {
    issue: "No agent-todo folders created",
    solution: "Ensure Claude Code started with --dangerously-skip-permissions flag",
    severity: "high"
  },
  {
    issue: "Monitor dashboard won't open",
    solution: "Install monitor dependencies manually with: cd src/monitor && npm install",
    severity: "medium"
  },
  {
    issue: "Agents seem stuck or inactive",
    solution: "Check project registry with /projects command and reactivate if needed",
    severity: "medium"
  },
  {
    issue: "TypeScript errors during build",
    solution: "Agents will auto-fix most issues, or use npm run build 2>/dev/null to ignore",
    severity: "low"
  }
]

export default function FirstProjectPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Rocket className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Creating Your First Project</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Learn how to create and manage your first Agentwise project with step-by-step guidance.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Card */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400">
            What You'll Learn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Core Concepts</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• How agents collaborate automatically</li>
                <li>• Project structure and organization</li>
                <li>• Real-time monitoring and progress tracking</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Practical Skills</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Writing effective project descriptions</li>
                <li>• Using the monitoring dashboard</li>
                <li>• Adding features to existing projects</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Guide */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">📋 Complete Step-by-Step Guide</h2>
        
        <div className="space-y-6">
          {projectSteps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <Card key={index} className="relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="text-xs">
                    ~{step.duration}
                  </Badge>
                </div>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold flex-shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-5 w-5 text-accent" />
                        <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      
                      <CodeBlock language="bash" className="mb-4">
                        {step.code}
                      </CodeBlock>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-foreground">💡 Pro Tips:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {step.tips.map((tip, tipIndex) => (
                            <li key={tipIndex}>• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Project Types */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🎯 Choose Your Project Type</h2>
        <p className="text-muted-foreground">
          Different project types engage different agents and have varying complexity levels.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {projectTypes.map((project, index) => (
            <Card key={index} className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{project.type}</CardTitle>
                  <Badge 
                    variant={project.complexity === "Low" ? "secondary" : project.complexity === "Medium" ? "outline" : "destructive"}
                    className="text-xs"
                  >
                    {project.complexity}
                  </Badge>
                </div>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2">Examples:</h4>
                  <div className="space-y-1">
                    {project.examples.map((example, exampleIndex) => (
                      <div key={exampleIndex} className="text-xs bg-muted/50 p-2 rounded">
                        <code className="text-accent">/create</code>{' '}
                        <span className="text-muted-foreground">"{example}"</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Agents: {project.agents.join(", ")}</span>
                    <span>~{project.timeEstimate}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Common Issues */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🛠️ Troubleshooting Common Issues</h2>
        
        <div className="space-y-4">
          {commonIssues.map((issue, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {issue.severity === "high" ? (
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    ) : issue.severity === "medium" ? (
                      <Clock className="h-5 w-5 text-warning-600" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-success-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-2">{issue.issue}</h3>
                    <p className="text-sm text-muted-foreground">{issue.solution}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Success Card */}
      <Card className="bg-gradient-to-r from-success/5 to-accent/5 border-success/20">
        <CardHeader>
          <CardTitle className="text-success-700 dark:text-success-400 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            🎉 Congratulations!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-4">
            You've successfully created your first Agentwise project! Here's what to explore next:
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/docs/commands">
                Learn All Commands
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs/architecture">
                Understanding Architecture
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs/performance">
                Performance & Optimization
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs/custom-agents">
                Create Custom Agents
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
