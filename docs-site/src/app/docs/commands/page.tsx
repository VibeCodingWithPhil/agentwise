import Link from "next/link"
import { Terminal, Copy, ExternalLink } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"
import { commands } from "@/lib/markdown"

// Group commands by category
const groupedCommands = commands.reduce((acc, command) => {
  if (!acc[command.category]) {
    acc[command.category] = []
  }
  acc[command.category].push(command)
  return acc
}, {} as Record<string, typeof commands>)

export default function CommandsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Commands Reference</h1>
        <p className="text-xl text-muted-foreground">
          Complete reference for all Agentwise commands. Master these to unlock the full power 
          of multi-agent orchestration.
        </p>
      </div>

      {/* Quick Reference */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Quick Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium mb-2">Essential Commands:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li><code className="bg-background px-1 rounded">/create</code> - Start new project</li>
                <li><code className="bg-background px-1 rounded">/task</code> - Add feature</li>
                <li><code className="bg-background px-1 rounded">/monitor</code> - View dashboard</li>
                <li><code className="bg-background px-1 rounded">/projects</code> - Switch projects</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-2">Remember:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Always start Claude Code with <code className="bg-background px-1 rounded">--dangerously-skip-permissions</code></li>
                <li>• Use quotes for multi-word descriptions</li>
                <li>• Monitor shows real-time progress</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commands by Category */}
      {Object.entries(groupedCommands).map(([category, categoryCommands]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground border-b pb-2">
            {category}
          </h2>
          
          <div className="space-y-6">
            {categoryCommands.map((command, index) => (
              <Card key={index} id={command.name.replace('/', '')}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl flex items-center gap-2">
                        <code className="bg-accent/10 text-accent-600 px-2 py-1 rounded font-mono">
                          {command.name}
                        </code>
                        <Badge variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="mt-2 text-base">
                        {command.description}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}${window.location.pathname}#${command.name.replace('/', '')}`
                        navigator.clipboard.writeText(url)
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Syntax */}
                  <div>
                    <h4 className="font-medium mb-2">Syntax</h4>
                    <CodeBlock language="bash" copy={false}>
                      {command.syntax}
                    </CodeBlock>
                  </div>

                  {/* Examples */}
                  <div>
                    <h4 className="font-medium mb-3">Examples</h4>
                    <div className="space-y-3">
                      {command.examples.map((example, exampleIndex) => (
                        <div key={exampleIndex} className="space-y-2">
                          <CodeBlock language="bash">
                            {example.command}
                          </CodeBlock>
                          <p className="text-sm text-muted-foreground">
                            {example.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Options (if any) */}
                  {command.options && command.options.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Options</h4>
                      <div className="space-y-2">
                        {command.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex gap-3">
                            <code className="bg-muted px-2 py-1 rounded text-sm font-mono flex-shrink-0">
                              {option.flag}
                            </code>
                            <span className="text-sm text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Command Flow */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Typical Command Flow</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">For New Projects:</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <code className="bg-muted px-2 py-1 rounded">/create "project description"</code>
                  <span className="text-muted-foreground text-sm">Create new project</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <code className="bg-muted px-2 py-1 rounded">/monitor</code>
                  <span className="text-muted-foreground text-sm">Open dashboard</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <code className="bg-muted px-2 py-1 rounded">/task "add feature"</code>
                  <span className="text-muted-foreground text-sm">Add features as needed</span>
                </div>
              </div>

              <h3 className="text-lg font-medium mt-6">For Existing Projects:</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <code className="bg-muted px-2 py-1 rounded">/init-import</code>
                  <span className="text-muted-foreground text-sm">Analyze existing project</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <code className="bg-muted px-2 py-1 rounded">/task-import</code>
                  <span className="text-muted-foreground text-sm">Import with agents</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <code className="bg-muted px-2 py-1 rounded">/monitor</code>
                  <span className="text-muted-foreground text-sm">Monitor progress</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips and Best Practices */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Tips & Best Practices</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">💡 Pro Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Use descriptive project names in <code className="bg-muted px-1 rounded">/create</code></li>
                <li>• Keep the monitor dashboard open for real-time updates</li>
                <li>• Break large features into smaller tasks</li>
                <li>• Use <code className="bg-muted px-1 rounded">/projects</code> to organize multiple projects</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">⚠️ Common Mistakes</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Forgetting the <code className="bg-muted px-1 rounded">--dangerously-skip-permissions</code> flag</li>
                <li>• Not using quotes for multi-word descriptions</li>
                <li>• Running commands outside of project directory</li>
                <li>• Closing Claude Code before agents complete</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Related Documentation */}
      <Card className="bg-accent/5 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400">
            Related Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/docs/architecture">
                <ExternalLink className="h-4 w-4 mr-1" />
                System Architecture
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/docs/custom-agents">
                <ExternalLink className="h-4 w-4 mr-1" />
                Custom Agents
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/docs/performance">
                <ExternalLink className="h-4 w-4 mr-1" />
                Performance Guide
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/agent-showcase">
                <ExternalLink className="h-4 w-4 mr-1" />
                Agent Showcase
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}