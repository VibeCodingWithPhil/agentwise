import { Rocket, Zap, Users, Target, Code, Database, Globe } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const projectExamples = [
  {
    description: "todo app with React and Firebase",
    agents: ["Frontend", "Database", "Testing"],
    complexity: "Beginner",
    timeEstimate: "8-12 min",
    features: ["User auth", "Real-time sync", "CRUD operations"]
  },
  {
    description: "e-commerce platform with Next.js",
    agents: ["Frontend", "Backend", "Database", "Testing", "DevOps"],
    complexity: "Advanced",
    timeEstimate: "25-35 min",
    features: ["Product catalog", "Payment processing", "Admin dashboard"]
  },
  {
    description: "blog with WordPress theme",
    agents: ["Frontend", "Backend", "Designer"],
    complexity: "Intermediate",
    timeEstimate: "15-20 min",
    features: ["Content management", "SEO optimization", "Responsive design"]
  },
  {
    description: "REST API with Node.js and PostgreSQL",
    agents: ["Backend", "Database", "Testing"],
    complexity: "Intermediate",
    timeEstimate: "12-18 min",
    features: ["Authentication", "Rate limiting", "API documentation"]
  }
]

const workflowSteps = [
  {
    step: 1,
    title: "Project Analysis",
    description: "AI analyzes your project description and requirements",
    icon: Target,
    details: ["Technology stack detection", "Feature extraction", "Complexity assessment"]
  },
  {
    step: 2,
    title: "Agent Selection",
    description: "Automatically selects the optimal specialized agents",
    icon: Users,
    details: ["Frontend/Backend needs", "Database requirements", "Testing strategy"]
  },
  {
    step: 3,
    title: "Project Setup",
    description: "Creates project structure and initializes components",
    icon: Code,
    details: ["Directory structure", "Package.json setup", "Config files"]
  },
  {
    step: 4,
    title: "Parallel Development",
    description: "Agents work simultaneously on different aspects",
    icon: Zap,
    details: ["Concurrent execution", "Progress tracking", "Quality assurance"]
  }
]

export default function CreateCommandPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Rocket className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">/create Command</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Create new projects with intelligent agent orchestration and automated setup.
            </p>
          </div>
        </div>
      </div>

      {/* Command Syntax */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400">Command Syntax</CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock language="bash">
{`/create "project description"`}
          </CodeBlock>
          <p className="text-sm text-muted-foreground mt-3">
            Describe your project in natural language. Be specific about technologies, features, and requirements.
          </p>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🚀 How It Works</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {workflowSteps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold flex-shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-5 w-5 text-accent" />
                        <h3 className="font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex}>• {detail}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Project Examples */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">💡 Project Examples</h2>
        <p className="text-muted-foreground">
          Real examples showing how different project types engage various agents and complexity levels.
        </p>
        
        <div className="space-y-4">
          {projectExamples.map((example, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CodeBlock language="bash" copy={false} className="text-sm inline-block">{`/create "${example.description}"`}</CodeBlock>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {example.features.map((feature, featureIndex) => (
                        <Badge key={featureIndex} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <Badge 
                      variant={example.complexity === "Beginner" ? "secondary" : example.complexity === "Intermediate" ? "outline" : "destructive"}
                      className="mb-2"
                    >
                      {example.complexity}
                    </Badge>
                    <div className="text-sm text-muted-foreground">{example.timeEstimate}</div>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Agents:</span> {example.agents.join(", ")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {example.agents.length} agents selected
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Best Practices */}
      <Card className="bg-gradient-to-r from-success/5 to-accent/5 border-success/20">
        <CardHeader>
          <CardTitle className="text-success-700 dark:text-success-400">
            ✨ Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Effective Descriptions</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Specify desired technologies ("React", "Node.js", "PostgreSQL")</li>
                <li>• Mention key features ("user authentication", "real-time chat")</li>
                <li>• Include architecture preferences ("microservices", "monolith")</li>
                <li>• State deployment targets ("Vercel", "AWS", "Docker")</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">What Happens Next</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Project registered in workspace/[project-name]/</li>
                <li>• Agent-todo folders created for selected agents</li>
                <li>• Real-time progress tracking via /monitor</li>
                <li>• Token optimization automatically enabled</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
