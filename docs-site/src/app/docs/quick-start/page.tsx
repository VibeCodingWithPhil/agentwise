import Link from "next/link"
import { Play, Zap, Terminal, CheckCircle, ArrowRight } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const quickStartSteps = [
  {
    step: 1,
    title: "Start Claude Code",
    description: "Launch Claude Code normally (no flags needed!)",
    code: "claude",
    icon: Terminal,
    duration: "10 seconds",
  },
  {
    step: 2,
    title: "Create Your Project", 
    description: "Use natural language to describe what you want to build",
    code: '/create "a modern React todo app with dark mode"',
    icon: Play,
    duration: "2-5 minutes",
  },
  {
    step: 3,
    title: "Monitor Progress",
    description: "Watch your agents collaborate in real-time",
    code: "/monitor",
    icon: Zap,
    duration: "Ongoing",
  },
]

const exampleProjects = [
  {
    title: "Web Applications",
    examples: [
      'a React dashboard with charts',
      'a Next.js blog with CMS',
      'a Vue.js e-commerce site'
    ],
    icon: "🌐",
  },
  {
    title: "Mobile Apps", 
    examples: [
      'a React Native weather app',
      'a Flutter expense tracker',
      'an Expo social media app'
    ],
    icon: "📱",
  },
  {
    title: "Backend Services",
    examples: [
      'a Node.js REST API',
      'a Python FastAPI service',
      'a GraphQL server with auth'
    ],
    icon: "⚙️",
  },
]

const features = [
  {
    title: "Multi-Agent Orchestration",
    description: "8 specialized agents work together automatically"
  },
  {
    title: "Smart Task Distribution",
    description: "Tasks are intelligently assigned to the right agents"
  },
  {
    title: "Token Optimization", 
    description: "Verified 64.6% reduction in API usage (94.8% with 10 agents)"
  },
  {
    title: "Real-time Monitoring",
    description: "Web dashboard shows progress across all agents"
  },
]

export default function QuickStartPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Zap className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Quick Start Guide</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Get up and running with Agentwise in under 5 minutes. From installation to your first project.
            </p>
          </div>
        </div>
      </div>

      {/* Prerequisites Check */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" />
            <CardTitle className="text-accent-700 dark:text-accent-400">
              Prerequisites Checklist
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <span className="text-sm font-medium">Node.js 18+</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <span className="text-sm font-medium">Claude Code CLI</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <span className="text-sm font-medium">Git (recommended)</span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/docs/installation">Installation Guide</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Install */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">⚡ Fastest Setup: One-Click Claude Code Prompt</h2>
        
        {/* One-Click Setup */}
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🚀 Copy & Paste Into Claude Code
              <Badge>Easiest Method</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Simply copy this prompt and paste it into Claude Code for automatic setup:
            </p>
            <CodeBlock language="text" title="Setup Prompt">
{`Please set up Agentwise:
1. Clone: git clone https://github.com/VibeCodingWithPhil/agentwise.git ~/agentwise
2. Install: cd ~/agentwise && npm install && npm run build
3. Configure sandboxed execution (no --dangerously-skip-permissions needed)
4. Start: node dist/index.js

Full setup: https://github.com/VibeCodingWithPhil/agentwise/blob/main/CLAUDE_CODE_SETUP_PROMPT.md`}
            </CodeBlock>
            <div className="mt-4">
              <Button asChild size="sm">
                <Link href="https://github.com/VibeCodingWithPhil/agentwise/blob/main/CLAUDE_CODE_SETUP_PROMPT.md" target="_blank">
                  View Detailed Instructions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Methods */}
        <h3 className="text-lg font-semibold text-foreground">Alternative: Script Installers</h3>
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  macOS / Linux
                </h3>
                <CodeBlock language="bash" title="Terminal">
{`curl -fsSL https://raw.githubusercontent.com/VibeCodingWithPhil/agentwise/main/installers/install.sh | bash`}
                </CodeBlock>
              </div>
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Terminal className="h-4 w-4" />
                  Windows PowerShell
                </h3>
                <CodeBlock language="powershell" title="PowerShell">
{`iwr "https://raw.githubusercontent.com/VibeCodingWithPhil/agentwise/main/installers/install.ps1" | iex`}
                </CodeBlock>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* NEW: No Permissions Flag Needed */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle>
              🎉 NEW: Works Without --dangerously-skip-permissions!
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-4">
            Agentwise now includes automatic permission handling, so you can use all features without any special flags:
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">✅ Features Enabled</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Automatic permission responses</li>
                <li>• Workspace sandboxing</li>
                <li>• Terminal monitoring</li>
                <li>• Smart safety modes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">🔧 Configure It</h4>
              <CodeBlock language="bash">
{`# Run configuration wizard
claude /configure-agentwise

# Or check current settings
cat ~/.agentwise-config.json`}
              </CodeBlock>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Process */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">🚀 Three Steps to Your First Project</h2>
        
        <div className="grid gap-6">
          {quickStartSteps.map((item, index) => {
            const IconComponent = item.icon
            return (
              <Card key={index} className="relative overflow-hidden">
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="text-xs">
                    ~{item.duration}
                  </Badge>
                </div>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold flex-shrink-0">
                      {item.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-5 w-5 text-accent" />
                        <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-4">{item.description}</p>
                      <CodeBlock language="bash">
                        {item.code}
                      </CodeBlock>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Example Projects */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">💡 Project Ideas to Try</h2>
        <p className="text-muted-foreground">
          Here are some example projects you can create with Agentwise. Just use natural language!
        </p>
        
        <div className="grid md:grid-cols-3 gap-6">
          {exampleProjects.map((category, index) => (
            <Card key={index} className="h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <CardTitle className="text-base">{category.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.examples.map((example, exampleIndex) => (
                    <div key={exampleIndex} className="p-2 bg-muted/50 rounded text-sm">
                      <code className="text-accent">/create</code>{' '}
                      <span className="text-muted-foreground">"{example}"</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Key Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">✨ What Makes Agentwise Special</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <Card className="bg-gradient-to-r from-success/5 to-accent/5 border-success/20">
        <CardHeader>
          <CardTitle className="text-success-700 dark:text-success-400 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            You're All Set!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-4">
            Now that you've created your first project, explore more advanced features and capabilities:
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/docs/commands">
                Explore Commands
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs/architecture">Learn Architecture</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs/custom-agents">Custom Agents</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs/integrations">Integrations</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
