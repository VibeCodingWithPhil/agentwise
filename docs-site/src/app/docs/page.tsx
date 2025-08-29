import Link from "next/link"
import { ArrowRight, Download, Play, BookOpen, Code, Users, BarChart3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"
import { SystemArchitectureDiagram } from "@/components/ui/mermaid-diagram"

const quickLinks = [
  {
    title: "Installation",
    description: "Get Agentwise up and running in minutes",
    href: "/docs/installation",
    icon: Download,
  },
  {
    title: "Quick Start",
    description: "Your first project with Agentwise",
    href: "/docs/quick-start", 
    icon: Play,
  },
  {
    title: "Commands Reference",
    description: "Complete guide to all Agentwise commands",
    href: "/docs/commands",
    icon: Code,
  },
  {
    title: "Custom Agents",
    description: "Create your own specialized AI agents",
    href: "/docs/custom-agents",
    icon: Users,
  },
]

const prerequisites = [
  "Node.js 18+ (Required)",
  "Claude Code CLI (Required)", 
  "Git (Recommended)",
  "Basic CLI familiarity",
]

export default function DocsHomePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-foreground">
            Documentation
          </h1>
          <Badge variant="outline" className="text-xs">
            v2.0.0
          </Badge>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Welcome to Agentwise documentation. Learn how to harness the power of multi-agent 
          orchestration to accelerate your development workflow with verified 64.6% token reduction 
          (up to 94.8% with 10 agents).
        </p>
      </div>

      {/* Quick Start Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {quickLinks.map((link, index) => (
          <Card key={index} className="group hover:shadow-lg transition-all duration-200 hover:border-accent/50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <link.icon className="h-5 w-5 text-accent-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">{link.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">
                {link.description}
              </CardDescription>
              <Button asChild variant="ghost" className="p-0 h-auto text-accent-600 hover:text-accent-700">
                <Link href={link.href}>
                  Get started <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prerequisites */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Prerequisites</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              Before getting started with Agentwise, ensure you have the following:
            </p>
            <ul className="space-y-2">
              {prerequisites.map((prereq, index) => (
                <li key={index} className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full bg-green-500/20 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                  </div>
                  <span className="text-foreground">{prereq}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* New: No Permissions Flag Needed! */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🎉 NEW: Works Without --dangerously-skip-permissions!</h2>
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <p className="text-foreground font-medium mb-3">
              Agentwise now includes sandboxed execution with automatic permission handling:
            </p>
            <CodeBlock language="bash">
{`# Works without any flags!
claude /create "my amazing app"

# Old way (still supported but not needed):
claude --dangerously-skip-permissions`}
            </CodeBlock>
            <div className="mt-4 space-y-2">
              <p className="text-muted-foreground">
                ✅ <strong>Automatic Permission Handling:</strong> Responds to prompts intelligently
              </p>
              <p className="text-muted-foreground">
                ✅ <strong>Workspace Sandboxing:</strong> Restricts execution to safe directories
              </p>
              <p className="text-muted-foreground">
                ✅ <strong>Smart Safety Modes:</strong> Configurable levels of automation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Installation */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">⚡ Quick Installation</h2>
        
        {/* One-Click Claude Code Setup */}
        <Card className="border-accent/50 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              🚀 One-Click Setup for Claude Code
              <Badge>Recommended</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Copy this prompt and paste into Claude Code for automatic setup:
            </p>
            <CodeBlock language="text" title="Setup Prompt">
{`Please set up Agentwise by:
1. Clone: git clone https://github.com/VibeCodingWithPhil/agentwise.git ~/agentwise
2. Install: cd ~/agentwise && npm install && npm run build
3. Configure: Create workspace directory and set up global monitor
4. Start: node dist/index.js
5. Enable sandboxed execution (no --dangerously-skip-permissions needed)

Full setup: https://github.com/VibeCodingWithPhil/agentwise/blob/main/CLAUDE_CODE_SETUP_PROMPT.md`}
            </CodeBlock>
            <div className="mt-4">
              <Button asChild>
                <Link href="https://github.com/VibeCodingWithPhil/agentwise/blob/main/CLAUDE_CODE_SETUP_PROMPT.md" target="_blank">
                  View Full Setup Prompt
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">macOS/Linux</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock language="bash" title="One-line installer">
{`curl -fsSL https://raw.githubusercontent.com/VibeCodingWithPhil/agentwise/main/installers/install.sh | bash`}
              </CodeBlock>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Windows</CardTitle>
            </CardHeader>
            <CardContent>
              <CodeBlock language="powershell" title="PowerShell (as Administrator)">
{`Invoke-WebRequest -Uri "https://raw.githubusercontent.com/VibeCodingWithPhil/agentwise/main/installers/install.ps1" -OutFile "install.ps1"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\\install.ps1`}
              </CodeBlock>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-center">
          <Button asChild size="lg">
            <Link href="/docs/installation">
              View Complete Installation Guide
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* First Steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Your First Agentwise Project</h2>
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-medium">Start Claude Code (no flags needed!)</p>
                  <CodeBlock language="bash">{`claude`}</CodeBlock>
                  <p className="text-sm text-muted-foreground">Agentwise handles permissions automatically</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-medium">Verify installation</p>
                  <CodeBlock language="bash">{`/help`}</CodeBlock>
                  <p className="text-sm text-muted-foreground">You should see Agentwise commands listed.</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-medium">Create your first project</p>
                  <CodeBlock language="bash">{`/create "a todo app with React and Firebase"`}</CodeBlock>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <p className="font-medium">Monitor progress</p>
                  <CodeBlock language="bash">{`/monitor`}</CodeBlock>
                  <p className="text-sm text-muted-foreground">Opens the dashboard at http://localhost:3001</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Architecture Overview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">System Architecture</h2>
        <p className="text-muted-foreground">
          Understanding how Agentwise orchestrates multiple AI agents for optimal performance:
        </p>
        <SystemArchitectureDiagram />
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link href="/docs/architecture">
              Learn More About Architecture
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* What's Next */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">What's Next?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <BarChart3 className="h-6 w-6 text-accent-600" />
              <CardTitle className="text-base">Performance</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm mb-3">
                Learn about token optimization and benchmarks
              </CardDescription>
              <Button asChild variant="ghost" size="sm" className="p-0 h-auto">
                <Link href="/docs/performance">
                  View metrics <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <Users className="h-6 w-6 text-accent-600" />
              <CardTitle className="text-base">Custom Agents</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm mb-3">
                Create specialized agents for your workflow
              </CardDescription>
              <Button asChild variant="ghost" size="sm" className="p-0 h-auto">
                <Link href="/docs/custom-agents">
                  Create agents <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <BookOpen className="h-6 w-6 text-accent-600" />
              <CardTitle className="text-base">Examples</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="text-sm mb-3">
                Explore real-world usage examples
              </CardDescription>
              <Button asChild variant="ghost" size="sm" className="p-0 h-auto">
                <Link href="/docs/examples">
                  See examples <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Community */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Community & Support</h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground mb-4">
              Need help or want to contribute? Join our community:
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="https://github.com/VibeCodingWithPhil/agentwise" target="_blank" rel="noopener noreferrer">
                  GitHub Repository
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="https://github.com/VibeCodingWithPhil/agentwise/issues" target="_blank" rel="noopener noreferrer">
                  Report Issues
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="https://github.com/VibeCodingWithPhil/agentwise/discussions" target="_blank" rel="noopener noreferrer">
                  Discussions
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}