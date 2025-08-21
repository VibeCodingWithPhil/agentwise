import Link from "next/link"
import { ArrowRight, Brain, Cpu, Database, GitBranch, Layers, Network, Shield, Zap } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import { SystemArchitectureDiagram, AgentWorkflowDiagram, TokenOptimizationDiagram } from "@/components/ui/mermaid-diagram"

const architectureComponents = [
  {
    name: "Agent Orchestrator",
    icon: Brain,
    description: "Central brain coordinating all agent activities",
    features: [
      "Dynamic agent discovery and loading",
      "Parallel execution management",
      "Task priority scheduling",
      "Resource allocation"
    ]
  },
  {
    name: "Task Distributor",
    icon: GitBranch,
    description: "Intelligently assigns tasks to specialized agents",
    features: [
      "Smart agent selection",
      "Load balancing",
      "Dependency resolution",
      "Conflict prevention"
    ]
  },
  {
    name: "Phase Manager",
    icon: Layers,
    description: "Manages multi-phase project execution",
    features: [
      "Phase synchronization",
      "Progress tracking",
      "Checkpoint management",
      "Rollback capability"
    ]
  },
  {
    name: "Context Manager",
    icon: Database,
    description: "Maintains shared context across all agents",
    features: [
      "Persistent storage",
      "Context compression",
      "Version control",
      "24-hour retention"
    ]
  },
  {
    name: "Token Optimizer",
    icon: Zap,
    description: "Reduces API token usage by 30-40%",
    features: [
      "Context sharing",
      "Response caching",
      "Incremental updates",
      "Batch processing"
    ]
  },
  {
    name: "MCP Integration",
    icon: Network,
    description: "Manages 61 MCP servers for extended capabilities",
    features: [
      "Dynamic loading",
      "Protocol handling",
      "Error recovery",
      "Performance monitoring"
    ]
  }
]

const dataFlow = [
  { step: 1, name: "User Command", description: "User initiates command via Claude Code CLI" },
  { step: 2, name: "Command Handler", description: "Validates and processes the command" },
  { step: 3, name: "Project Analysis", description: "Analyzes requirements and tech stack" },
  { step: 4, name: "Agent Selection", description: "Selects appropriate specialized agents" },
  { step: 5, name: "Task Distribution", description: "Distributes tasks to selected agents" },
  { step: 6, name: "Parallel Execution", description: "Agents work simultaneously" },
  { step: 7, name: "Progress Monitoring", description: "Real-time tracking via WebSocket" },
  { step: 8, name: "Result Integration", description: "Combines outputs from all agents" },
  { step: 9, name: "Validation", description: "Syntax, style, and quality checks" },
  { step: 10, name: "Project Output", description: "Delivers completed project" }
]

export default function ArchitecturePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-foreground">
            System Architecture
          </h1>
          <Badge variant="outline">Advanced</Badge>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Explore the sophisticated architecture that powers Agentwise's multi-agent orchestration,
          enabling parallel execution with 30-40% token optimization.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8+</div>
            <p className="text-xs text-muted-foreground">Specialized AI agents</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              MCP Servers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">61</div>
            <p className="text-xs text-muted-foreground">Integrated tools</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Token Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">30-40%</div>
            <p className="text-xs text-muted-foreground">Optimization rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Parallel Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">∞</div>
            <p className="text-xs text-muted-foreground">Concurrent execution</p>
          </CardContent>
        </Card>
      </div>

      {/* System Overview Diagram */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">System Overview</h2>
        <SystemArchitectureDiagram />
      </div>

      {/* Core Components */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Core Components</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {architectureComponents.map((component, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <component.icon className="h-5 w-5 text-accent-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{component.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {component.description}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {component.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Agent Workflow */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Agent Workflow</h2>
        <AgentWorkflowDiagram />
      </div>

      {/* Data Flow */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Data Flow Pipeline</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {dataFlow.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium text-foreground">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  {index < dataFlow.length - 1 && (
                    <div className="flex items-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Token Optimization */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Token Optimization Strategy</h2>
        <TokenOptimizationDiagram />
        <Card>
          <CardHeader>
            <CardTitle>How We Achieve 30-40% Token Reduction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Context Sharing</h4>
                <p className="text-sm text-muted-foreground">
                  Agents share a common context pool, eliminating redundant information
                  transfer and reducing overall token consumption.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Incremental Updates</h4>
                <p className="text-sm text-muted-foreground">
                  Only changes are transmitted between agents, not entire contexts,
                  dramatically reducing token usage.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Response Caching</h4>
                <p className="text-sm text-muted-foreground">
                  Common queries and responses are cached, preventing duplicate
                  API calls and saving tokens.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Smart Batching</h4>
                <p className="text-sm text-muted-foreground">
                  Related operations are batched together, reducing overhead
                  and improving efficiency.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Technical Stack */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Technical Stack</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Core Technologies</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock language="json">
{`{
  "runtime": "Node.js 18+",
  "language": "TypeScript 5.0",
  "framework": "Claude Code Extension",
  "monitoring": "WebSocket + Next.js",
  "storage": "File System + JSON",
  "protocols": "MCP (Model Context Protocol)"
}`}
              </CodeBlock>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Key Libraries</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock language="json">
{`{
  "orchestration": "Custom multi-agent system",
  "validation": "TypeScript + ESLint",
  "monitoring": "Socket.io + React",
  "mcp": "61 integrated servers",
  "optimization": "Custom token optimizer",
  "persistence": "fs-extra + JSON"
}`}
              </CodeBlock>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Security & Validation */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Security & Validation</h2>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Multi-Layer Validation Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2 text-sm">Pre-Execution</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Tech stack validation</li>
                    <li>• Dependency checking</li>
                    <li>• Security scanning</li>
                    <li>• License verification</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-sm">During Execution</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Hallucination detection</li>
                    <li>• Phantom code prevention</li>
                    <li>• Context drift monitoring</li>
                    <li>• Error recovery</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-sm">Post-Execution</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Syntax validation</li>
                    <li>• Style checking</li>
                    <li>• Test verification</li>
                    <li>• Build confirmation</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Explore More */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Explore Architecture</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Button asChild variant="outline" className="h-auto p-4">
            <Link href="/docs/architecture/agents" className="flex flex-col items-start gap-2">
              <Brain className="h-5 w-5 text-accent-600" />
              <div className="text-left">
                <div className="font-medium">Agent System</div>
                <div className="text-xs text-muted-foreground">Deep dive into agents</div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4">
            <Link href="/docs/architecture/tokens" className="flex flex-col items-start gap-2">
              <Zap className="h-5 w-5 text-accent-600" />
              <div className="text-left">
                <div className="font-medium">Token Optimization</div>
                <div className="text-xs text-muted-foreground">30-40% reduction details</div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4">
            <Link href="/docs/architecture/monitoring" className="flex flex-col items-start gap-2">
              <Cpu className="h-5 w-5 text-accent-600" />
              <div className="text-left">
                <div className="font-medium">Monitoring System</div>
                <div className="text-xs text-muted-foreground">Real-time tracking</div>
              </div>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}