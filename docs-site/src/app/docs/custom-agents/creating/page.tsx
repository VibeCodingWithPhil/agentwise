import { Plus, FileCode, Wrench, Rocket, Brain, CheckCircle, Settings, Book } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const creationSteps = [
  {
    step: "1. Define Specialty",
    description: "Identify the agent's unique expertise and capabilities",
    icon: Brain,
    example: "Code review specialist, Performance optimizer, Security auditor",
    duration: "5 min"
  },
  {
    step: "2. Create Definition",
    description: "Write the agent definition file in Markdown format",
    icon: FileCode,
    example: ".claude/agents/my-specialist.md",
    duration: "10 min"
  },
  {
    step: "3. Configure Tools",
    description: "Assign MCP servers and tools for the agent",
    icon: Wrench,
    example: "Testing tools, database connections, API integrations",
    duration: "5 min"
  },
  {
    step: "4. Test & Deploy",
    description: "Validate agent behavior and deploy to system",
    icon: Rocket,
    example: "Run test tasks, verify outputs, monitor performance",
    duration: "15 min"
  }
]

const agentComponents = [
  {
    component: "System Prompt",
    description: "Defines the agent's role and expertise",
    required: true,
    example: "You are a performance optimization specialist..."
  },
  {
    component: "Capabilities",
    description: "List of specific skills and knowledge areas",
    required: true,
    example: "- Code profiling\n- Memory optimization\n- Query tuning"
  },
  {
    component: "MCP Tools",
    description: "Associated Model Context Protocol servers",
    required: false,
    example: "lighthouse, web-vitals, performance-monitor"
  },
  {
    component: "Task Templates",
    description: "Predefined templates for common tasks",
    required: false,
    example: "Performance audit template, optimization checklist"
  }
]

const bestPractices = [
  {
    practice: "Single Responsibility",
    description: "Each agent should focus on one specialty",
    icon: CheckCircle
  },
  {
    practice: "Clear Documentation",
    description: "Document capabilities and limitations clearly",
    icon: Book
  },
  {
    practice: "Tool Integration",
    description: "Leverage existing MCP servers and tools",
    icon: Settings
  },
  {
    practice: "Testing Coverage",
    description: "Include test scenarios and validation",
    icon: CheckCircle
  }
]

export default function CreatingAgentsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Plus className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Creating Custom Agents</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Build specialized AI agents tailored to your specific needs and workflows.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400">
            🚀 Quick Start Command
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock language="bash">{`# Generate a new agent with a single command
/generate-agent "security-audit-specialist"

# Or manually create an agent
touch .claude/agents/my-specialist.md`}</CodeBlock>
        </CardContent>
      </Card>

      {/* Creation Steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🛠️ Creation Process</h2>
        <p className="text-muted-foreground">
          Four simple steps to create your custom agent.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {creationSteps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-accent" />
                    {step.step}
                  </CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-muted/30 rounded">
                      <p className="text-xs"><strong>Example:</strong> {step.example}</p>
                    </div>
                    <div className="flex justify-end">
                      <Badge variant="secondary" className="text-xs">
                        {step.duration}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Agent Components */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📦 Agent Components</h2>
        <p className="text-muted-foreground">
          Essential components that make up an agent definition.
        </p>
        
        <div className="space-y-3">
          {agentComponents.map((component, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-foreground">{component.component}</h3>
                      {component.required && (
                        <Badge variant="destructive" className="text-xs">Required</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{component.description}</p>
                    <div className="mt-3">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {component.example}
                      </code>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Example Agent Definition */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📄 Example Agent Definition</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Performance Optimization Specialist</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="markdown">{`# Performance Optimization Specialist

## Role
You are a performance optimization specialist focused on improving application speed, reducing resource usage, and enhancing user experience.

## Capabilities
- Analyze code for performance bottlenecks
- Optimize database queries and indexes
- Implement caching strategies
- Reduce bundle sizes and load times
- Profile memory usage and fix leaks

## MCP Tools
- lighthouse
- web-vitals
- performance-monitor
- bundle-analyzer

## Task Templates
### Performance Audit
1. Run Lighthouse analysis
2. Identify Core Web Vitals issues
3. Analyze bundle composition
4. Profile runtime performance
5. Generate optimization report

## Success Metrics
- Page load time < 2s
- First Contentful Paint < 1s
- Time to Interactive < 3s
- Bundle size reduction > 30%`}</CodeBlock>
          </CardContent>
        </Card>
      </div>

      {/* Best Practices */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">✨ Best Practices</h2>
        <p className="text-muted-foreground">
          Guidelines for creating effective and maintainable agents.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {bestPractices.map((practice, index) => {
            const IconComponent = practice.icon
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-5 w-5 text-accent mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-foreground">{practice.practice}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{practice.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Advanced Features */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-purple-700 dark:text-purple-400 flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Advanced Agent Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Dynamic Capabilities</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Self-improving with experience</li>
                <li>• Learning from task outcomes</li>
                <li>• Adaptive tool selection</li>
                <li>• Performance optimization</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Collaboration Features</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Inter-agent communication</li>
                <li>• Shared context and knowledge</li>
                <li>• Task delegation capabilities</li>
                <li>• Consensus decision making</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
