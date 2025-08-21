import Link from "next/link"
import { AlertTriangle, Download, Terminal, CheckCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const prerequisites = [
  {
    name: "Node.js 18+",
    required: true,
    description: "JavaScript runtime required for Agentwise",
    checkCommand: "node --version",
    installUrl: "https://nodejs.org",
  },
  {
    name: "Claude Code CLI", 
    required: true,
    description: "Anthropic's official CLI tool",
    checkCommand: "claude --version",
    installUrl: "https://docs.anthropic.com/en/docs/claude-code",
  },
  {
    name: "Git",
    required: true,
    description: "Version control system",
    checkCommand: "git --version", 
    installUrl: "https://git-scm.com",
  },
]

const troubleshootingSteps = [
  {
    issue: "Command not found: claude",
    solution: "Install Claude Code from https://docs.anthropic.com/en/docs/claude-code"
  },
  {
    issue: "Monitor closes immediately",
    solution: "Install monitor dependencies manually"
  },
  {
    issue: "Permission denied errors",
    solution: "Ensure Claude Code started with --dangerously-skip-permissions flag"
  },
  {
    issue: "No agent-todo folders created",
    solution: "Update to latest version and use /init-import + /task-import"
  },
]

export default function InstallationPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Installation</h1>
        <p className="text-xl text-muted-foreground">
          Get Agentwise up and running in just a few minutes. Follow this step-by-step guide 
          for a smooth installation experience.
        </p>
      </div>

      {/* Prerequisites */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Prerequisites</h2>
        <p className="text-muted-foreground">
          Before installing Agentwise, ensure you have the following prerequisites:
        </p>
        
        <div className="grid gap-4">
          {prerequisites.map((prereq, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-foreground">{prereq.name}</h3>
                    {prereq.required && (
                      <Badge variant="outline" className="text-xs">Required</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{prereq.description}</p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Check if installed:</p>
                    <CodeBlock language="bash" copy={false}>
                      {prereq.checkCommand}
                    </CodeBlock>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href={prereq.installUrl} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4 mr-1" />
                    Install
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Critical Requirement */}
      <Card className="border-warning-200 bg-warning-50 dark:bg-warning-900/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning-600" />
            <CardTitle className="text-warning-700 dark:text-warning-400">
              Critical Requirement
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground font-medium mb-3">
            Agentwise REQUIRES Claude Code to be started with a special flag:
          </p>
          <CodeBlock language="bash" title="Required startup command">
{`# ALWAYS start Claude Code like this:
claude --dangerously-skip-permissions

# NOT like this:
claude  # ❌ Will NOT work properly`}
          </CodeBlock>
          <div className="mt-4">
            <p className="text-sm font-medium text-foreground mb-2">This flag is required for:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• File system operations</li>
              <li>• Monitor dashboard functionality</li>
              <li>• Agent parallel execution</li>
              <li>• Global command installation</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Quick Install */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Quick Install (Recommended)</h2>
        <p className="text-muted-foreground">
          Use our automated installers for the fastest setup experience:
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">macOS/Linux</CardTitle>
              <CardDescription>One-command installation</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="bash" title="Terminal">
{`curl -fsSL https://raw.githubusercontent.com/VibeCodingWithPhil/agentwise/main/installers/install.sh | bash`}
              </CodeBlock>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Windows</CardTitle>
              <CardDescription>PowerShell as Administrator</CardDescription>
            </CardHeader>
            <CardContent>
              <CodeBlock language="powershell" title="PowerShell">
{`Invoke-WebRequest -Uri "https://raw.githubusercontent.com/VibeCodingWithPhil/agentwise/main/installers/install.ps1" -OutFile "install.ps1"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
.\\install.ps1`}
              </CodeBlock>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manual Installation */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Manual Installation</h2>
        <p className="text-muted-foreground">
          If the automated installers don't work, follow these manual steps:
        </p>
        
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-2">Clone the repository</h3>
                  <CodeBlock language="bash">
{`git clone https://github.com/VibeCodingWithPhil/agentwise.git
cd agentwise`}
                  </CodeBlock>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-2">Install dependencies</h3>
                  <CodeBlock language="bash">
                    npm install
                  </CodeBlock>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-2">Build the project</h3>
                  <CodeBlock language="bash">
{`# Build (ignore TypeScript errors if any)
npm run build 2>/dev/null || true`}
                  </CodeBlock>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                  4
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-2">Install monitor dependencies</h3>
                  <CodeBlock language="bash">
{`cd src/monitor
npm install
cd ../..`}
                  </CodeBlock>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                  5
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-2">Start Claude Code with required flag</h3>
                  <CodeBlock language="bash">
                    claude --dangerously-skip-permissions
                  </CodeBlock>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Verify Installation</h2>
        <p className="text-muted-foreground">
          Follow these steps to ensure Agentwise is properly installed and working:
        </p>
        
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-4">
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Check Agentwise commands</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    In Claude Code, type <code className="bg-muted px-1 rounded text-xs">/help</code> 
                    and verify Agentwise commands are listed.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Test monitor dashboard</h3>
                  <CodeBlock language="bash">
                    /monitor
                  </CodeBlock>
                  <p className="text-sm text-muted-foreground">
                    Should open dashboard at http://localhost:3001
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Create a test project</h3>
                  <CodeBlock language="bash">
                    /create "a simple hello world app"
                  </CodeBlock>
                  <p className="text-sm text-muted-foreground">
                    Should start creating agent-todo folders and begin orchestration
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Troubleshooting */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Common Issues & Solutions</h2>
        <div className="space-y-4">
          {troubleshootingSteps.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base text-destructive">
                  {item.issue}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{item.solution}</p>
                {item.issue.includes("Monitor closes") && (
                  <CodeBlock language="bash" className="mt-3">
{`cd src/monitor
npm install
cd ../..
/monitor`}
                  </CodeBlock>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Next Steps */}
      <Card className="bg-accent/5 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400">
            🎉 Installation Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-4">
            Great! You now have Agentwise installed and ready to use. Here's what to do next:
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button asChild>
              <Link href="/docs/quick-start">
                Quick Start Guide
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs/commands">
                Learn Commands
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs/architecture">
                Understanding Architecture
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}