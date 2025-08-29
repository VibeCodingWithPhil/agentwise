import { Plug, Palette, Database, Cloud, TestTube, Wrench, Code2, Layers } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const mcpCategories = [
  {
    name: "Design & UI",
    description: "Visual design and user interface tools",
    icon: Palette,
    count: "15+",
    servers: ["Figma", "Canva", "Shadcn UI", "Tailwind CSS", "Framer", "Material UI", "Ant Design"],
    color: "purple"
  },
  {
    name: "Backend Development",
    description: "Server-side development and API tools",
    icon: Code2,
    count: "10+",
    servers: ["REST API", "GraphQL", "TestSprite", "Fetch", "Stripe", "PayPal", "WebSocket"],
    color: "blue"
  },
  {
    name: "Database",
    description: "Database management and query tools",
    icon: Database,
    count: "8+",
    servers: ["PostgreSQL", "MongoDB", "MySQL", "Redis", "SQLite", "Multi-Database"],
    color: "green"
  },
  {
    name: "DevOps & Infrastructure",
    description: "Deployment, monitoring, and infrastructure",
    icon: Cloud,
    count: "12+",
    servers: ["Kubernetes", "Terraform", "Docker", "AWS", "Azure", "Cloudflare", "Jenkins"],
    color: "orange"
  },
  {
    name: "Testing & Quality",
    description: "Testing frameworks and quality assurance",
    icon: TestTube,
    count: "11+",
    servers: ["Jest", "Playwright", "Cypress", "Storybook", "Puppeteer", "BrowserStack"],
    color: "red"
  },
  {
    name: "Utilities & Tools",
    description: "Development utilities and productivity tools",
    icon: Wrench,
    count: "8+",
    servers: ["Memory", "Sequential Thinking", "Brave Search", "Claude Desktop", "Slack", "Discord"],
    color: "indigo"
  }
]

const integrationFeatures = [
  {
    feature: "Dynamic Assignment",
    description: "Each agent gets role-specific MCP tools",
    benefit: "Optimized tool selection"
  },
  {
    feature: "Smart Selection",
    description: "MCPs assigned based on agent expertise",
    benefit: "Reduced complexity"
  },
  {
    feature: "Project Optimization",
    description: "MCPs selected based on project requirements",
    benefit: "Efficient resource usage"
  },
  {
    feature: "Automatic Discovery",
    description: "New MCPs automatically integrated",
    benefit: "Always up-to-date"
  }
]

const implementationSteps = [
  {
    step: "1. Discovery",
    description: "Scan for available MCP servers",
    code: "await mcpManager.discoverServers()"
  },
  {
    step: "2. Assignment",
    description: "Match MCPs to agent specialties",
    code: "mcpManager.assignToAgent(agent, mcps)"
  },
  {
    step: "3. Connection",
    description: "Establish connections to selected MCPs",
    code: "await mcpServer.connect(config)"
  },
  {
    step: "4. Execution",
    description: "Use MCP tools during task execution",
    code: "await mcp.execute(tool, params)"
  }
]

export default function MCPIntegrationPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Plug className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">MCP Integration</h1>
            <p className="text-xl text-muted-foreground mt-2">
              61+ Model Context Protocol servers providing specialized tools for every agent.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Card */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400 flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Integration Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-accent">61+</div>
              <div className="text-sm text-muted-foreground">MCP Servers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">6</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">100%</div>
              <div className="text-sm text-muted-foreground">Agent Coverage</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">Dynamic</div>
              <div className="text-sm text-muted-foreground">Assignment</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MCP Categories */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🔌 MCP Categories</h2>
        <p className="text-muted-foreground">
          Comprehensive coverage across all development domains.
        </p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mcpCategories.map((category, index) => {
            const IconComponent = category.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-accent" />
                    {category.name}
                  </CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Servers:</span>
                      <Badge variant="secondary" className="text-xs">
                        {category.count}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {category.servers.slice(0, 5).map((server, sIdx) => (
                        <Badge key={sIdx} variant="outline" className="text-xs">
                          {server}
                        </Badge>
                      ))}
                      {category.servers.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{category.servers.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Integration Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">✨ Key Features</h2>
        <p className="text-muted-foreground">
          Intelligent MCP management for optimal agent performance.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {integrationFeatures.map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-foreground">{item.feature}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="pt-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.benefit}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Implementation Steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🚀 Implementation</h2>
        <p className="text-muted-foreground">
          How MCP integration works under the hood.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {implementationSteps.map((step, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{step.step}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  </div>
                  <div className="pt-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded block">
                      {step.code}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Configuration Example */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📁 Configuration</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>MCP Server Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="typescript">{`class MCPIntegrationManager {
  private mcpServers: Map<string, MCPServer> = new Map();
  
  async assignMCPsToAgent(agent: Agent): Promise<void> {
    const relevantMCPs = this.selectMCPsForSpecialty(
      agent.specialty
    );
    
    for (const mcpName of relevantMCPs) {
      const server = await this.connectToMCP(mcpName);
      agent.addTool(server);
    }
  }
  
  private selectMCPsForSpecialty(
    specialty: string
  ): string[] {
    const mcpMap = {
      'frontend': ['figma', 'shadcn-ui', 'tailwind'],
      'backend': ['rest-api', 'graphql', 'database'],
      'devops': ['kubernetes', 'terraform', 'aws'],
      'testing': ['jest', 'playwright', 'cypress']
    };
    
    return mcpMap[specialty] || [];
  }
}`}</CodeBlock>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Features */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800">
        <CardHeader>
          <CardTitle className="text-indigo-700 dark:text-indigo-400 flex items-center gap-2">
            <Plug className="h-5 w-5" />
            Advanced MCP Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Smart Routing</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Automatic server selection</li>
                <li>• Load balancing across MCPs</li>
                <li>• Fallback mechanisms</li>
                <li>• Performance optimization</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Enterprise Features</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Custom MCP development</li>
                <li>• Private server hosting</li>
                <li>• Authentication & security</li>
                <li>• Usage analytics & monitoring</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
