import Link from "next/link"
import { Figma, Github, Layers, Plug } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"

const integrations = [
  {
    name: "Figma Dev Mode",
    icon: Figma,
    description: "Direct connection to Figma for design-to-code workflows",
    status: "Active",
    commands: ["/figma connect", "/figma generate", "/figma sync"]
  },
  {
    name: "GitHub",
    icon: Github,
    description: "Repository management and CI/CD integration",
    status: "Active",
    commands: ["/github create-pr", "/github issues", "/github actions"]
  },
  {
    name: "MCP Servers",
    icon: Plug,
    description: "61 integrated Model Context Protocol servers",
    status: "Active",
    commands: ["Auto-assigned", "61 servers", "Dynamic loading"]
  },
  {
    name: "Cloud Platforms",
    icon: Layers,
    description: "AWS, Azure, Cloudflare deployment integration",
    status: "Active", 
    commands: ["Auto-deployment", "Infrastructure as Code", "Monitoring"]
  }
]

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-foreground">Integrations</h1>
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-200">
            61 MCPs
          </Badge>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Connect Agentwise with your development tools and workflows. 
          Deep integrations with 61 MCP servers plus direct tool connections.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {integrations.map((integration, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <integration.icon className="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {integration.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge className="bg-green-500/10 text-green-600 border-green-200">
                  {integration.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">Available Commands:</p>
                <div className="flex flex-wrap gap-2">
                  {integration.commands.map((cmd, i) => (
                    <code key={i} className="bg-muted px-2 py-1 rounded text-xs">
                      {cmd}
                    </code>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Quick Integration Examples</h2>
        <Card>
          <CardHeader>
            <CardTitle>Figma to Code Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="bash">
{`# Connect to Figma Desktop
/figma connect

# Generate component from selection
/figma generate Button

# Export design tokens
/figma tokens ./tokens.json

# Create project with design integration
/create "e-commerce app with Figma components"`}
            </CodeBlock>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Button asChild variant="outline" className="h-auto p-4">
          <Link href="/docs/integrations/figma" className="flex flex-col items-start gap-2">
            <Figma className="h-5 w-5 text-accent-600" />
            <div className="text-left">
              <div className="font-medium">Figma</div>
              <div className="text-xs text-muted-foreground">Design integration</div>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto p-4">
          <Link href="/docs/integrations/github" className="flex flex-col items-start gap-2">
            <Github className="h-5 w-5 text-accent-600" />
            <div className="text-left">
              <div className="font-medium">GitHub</div>
              <div className="text-xs text-muted-foreground">Repository management</div>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto p-4">
          <Link href="/docs/integrations/mcp" className="flex flex-col items-start gap-2">
            <Plug className="h-5 w-5 text-accent-600" />
            <div className="text-left">
              <div className="font-medium">MCP Servers</div>
              <div className="text-xs text-muted-foreground">61 integrations</div>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto p-4">
          <Link href="/docs/integrations/cicd" className="flex flex-col items-start gap-2">
            <Layers className="h-5 w-5 text-accent-600" />
            <div className="text-left">
              <div className="font-medium">CI/CD</div>
              <div className="text-xs text-muted-foreground">Pipeline automation</div>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  )
}
