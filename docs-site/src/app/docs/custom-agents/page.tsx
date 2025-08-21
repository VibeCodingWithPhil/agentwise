import Link from "next/link"
import { ArrowRight, Bot, Code, FileText, Lightbulb, Package, Rocket, Settings, Users } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/ui/code-block"

const agentTypes = [
  {
    name: "Domain Specialist",
    icon: Lightbulb,
    description: "Expert in specific domains like healthcare, finance, or legal",
    examples: ["healthcare-compliance", "financial-analyst", "legal-reviewer"],
    useCase: "When you need specialized domain knowledge"
  },
  {
    name: "Language Expert",
    icon: Code,
    description: "Specialized in specific programming languages or frameworks",
    examples: ["rust-specialist", "swift-developer", "kotlin-expert"],
    useCase: "For language-specific optimizations"
  },
  {
    name: "Tool Integrator",
    icon: Package,
    description: "Integrates with specific tools or platforms",
    examples: ["salesforce-connector", "sap-integrator", "jira-manager"],
    useCase: "When working with enterprise tools"
  },
  {
    name: "Process Automator",
    icon: Settings,
    description: "Automates specific workflows or processes",
    examples: ["ci-cd-optimizer", "release-manager", "deployment-specialist"],
    useCase: "For workflow automation"
  }
]

const creationSteps = [
  {
    step: 1,
    title: "Define Agent Purpose",
    description: "Clearly define what your agent will specialize in",
    code: `/generate-agent "blockchain-specialist"`
  },
  {
    step: 2,
    title: "Agent File Creation",
    description: "System creates agent definition in .claude/agents/",
    code: `.claude/agents/blockchain-specialist.md`
  },
  {
    step: 3,
    title: "Configure Capabilities",
    description: "Define agent's skills, tools, and MCPs",
    code: `capabilities:
  - Smart contract development
  - DeFi protocols
  - Web3 integration`
  },
  {
    step: 4,
    title: "Automatic Integration",
    description: "Agent is automatically discovered and integrated",
    code: `Agent ready for use in projects`
  }
]

export default function CustomAgentsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-foreground">
            Custom Agents
          </h1>
          <Badge className="bg-green-500/10 text-green-600 border-green-200">
            Extensible
          </Badge>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Create specialized AI agents tailored to your specific needs. Extend Agentwise with 
          domain experts, tool specialists, or workflow automators.
        </p>
      </div>

      {/* Quick Start */}
      <Card className="bg-accent/5 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Quick Start: Create Your First Agent
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CodeBlock language="bash">
{`# Generate a new specialized agent
/generate-agent "blockchain-specialist"

# Agent will be created at:
# .claude/agents/blockchain-specialist.md

# Use in your next project:
/create "DeFi lending platform"
# Blockchain specialist will automatically be included!`}
          </CodeBlock>
        </CardContent>
      </Card>

      {/* Agent Types */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Types of Custom Agents</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {agentTypes.map((type, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <type.icon className="h-5 w-5 text-accent-600" />
                  </div>
                  <div className="flex-grow">
                    <CardTitle className="text-lg">{type.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {type.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {type.examples.map((example, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Use case:</span> {type.useCase}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Creation Process */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Agent Creation Process</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {creationSteps.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                  </div>
                  <div className="flex-grow space-y-2">
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    {item.code && (
                      <CodeBlock language="bash" className="text-xs">
                        {item.code}
                      </CodeBlock>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Agent Definition Structure */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Agent Definition Structure</h2>
        <Card>
          <CardHeader>
            <CardTitle>Example: blockchain-specialist.md</CardTitle>
            <CardDescription>
              Located in .claude/agents/ folder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CodeBlock language="markdown">
{`# Blockchain Specialist Agent

## Role
Expert in blockchain development, smart contracts, and Web3 technologies.

## Capabilities
- Smart contract development (Solidity, Rust)
- DeFi protocol implementation
- NFT marketplace creation
- Cross-chain bridge development
- Gas optimization strategies
- Security auditing

## Tools & Technologies
- Ethereum, Polygon, Arbitrum
- Hardhat, Truffle, Foundry
- Web3.js, Ethers.js
- IPFS, Arweave
- TheGraph, Chainlink

## MCP Integrations
- ethereum-mcp
- web3-tools-mcp
- defi-protocols-mcp

## Best Practices
- Always implement reentrancy guards
- Use OpenZeppelin contracts when possible
- Optimize for gas efficiency
- Implement comprehensive testing
- Follow security best practices

## Phase Approach
1. Architecture design
2. Smart contract development
3. Frontend integration
4. Testing & auditing
5. Deployment & monitoring`}
            </CodeBlock>
          </CardContent>
        </Card>
      </div>

      {/* Real-World Examples */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Real-World Agent Examples</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <Bot className="h-6 w-6 text-accent-600 mb-2" />
              <CardTitle className="text-base">Mobile Specialist</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Expert in React Native, Flutter, and native mobile development.
              </p>
              <CodeBlock language="bash" className="text-xs">
{`/generate-agent "mobile-specialist"`}
              </CodeBlock>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <Bot className="h-6 w-6 text-accent-600 mb-2" />
              <CardTitle className="text-base">ML Engineer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Specializes in machine learning, AI models, and data pipelines.
              </p>
              <CodeBlock language="bash" className="text-xs">
{`/generate-agent "ml-engineer"`}
              </CodeBlock>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <Bot className="h-6 w-6 text-accent-600 mb-2" />
              <CardTitle className="text-base">Security Auditor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Performs security audits, penetration testing, and vulnerability assessment.
              </p>
              <CodeBlock language="bash" className="text-xs">
{`/generate-agent "security-auditor"`}
              </CodeBlock>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Integration */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">System Integration</h2>
        <Card>
          <CardHeader>
            <CardTitle>How Custom Agents Work with Agentwise</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Automatic Discovery</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Agents are automatically discovered from the .claude/agents/ folder 
                  every 5 seconds. No registration required.
                </p>
                <CodeBlock language="typescript" className="text-xs">
{`// Auto-discovery in action
const agents = await discoverAgents();
// Includes all custom agents`}
                </CodeBlock>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Smart Selection</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Custom agents are intelligently selected based on project requirements,
                  just like built-in agents.
                </p>
                <CodeBlock language="typescript" className="text-xs">
{`// Project: "blockchain app"
// Selected: blockchain-specialist
// Automatic inclusion`}
                </CodeBlock>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">MCP Support</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Custom agents can use any of the 61 integrated MCP servers or
                  define their own custom MCPs.
                </p>
                <CodeBlock language="typescript" className="text-xs">
{`// Agent can use MCPs
mcp: ['ethereum-mcp', 'web3-mcp']`}
                </CodeBlock>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Token Optimization</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Custom agents benefit from the same 30-40% token optimization
                  as built-in agents.
                </p>
                <CodeBlock language="typescript" className="text-xs">
{`// Shared context & caching
// Automatic optimization`}
                </CodeBlock>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Best Practices */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Best Practices</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <FileText className="inline h-4 w-4 mr-2" />
                Agent Design
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2" />
                  <span>Keep agents focused on specific domains</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2" />
                  <span>Define clear capabilities and limitations</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2" />
                  <span>Include relevant MCP integrations</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 mt-2" />
                  <span>Document best practices for the domain</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <Users className="inline h-4 w-4 mr-2" />
                Agent Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2" />
                  <span>Design agents to work with existing ones</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2" />
                  <span>Avoid overlapping responsibilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2" />
                  <span>Use shared context effectively</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-2" />
                  <span>Follow phase management patterns</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Explore More */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Learn More</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <Button asChild variant="outline" className="h-auto p-4">
            <Link href="/docs/custom-agents/creating" className="flex flex-col items-start gap-2">
              <Code className="h-5 w-5 text-accent-600" />
              <div className="text-left">
                <div className="font-medium">Creating Agents</div>
                <div className="text-xs text-muted-foreground">Step-by-step guide</div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4">
            <Link href="/docs/custom-agents/examples" className="flex flex-col items-start gap-2">
              <Lightbulb className="h-5 w-5 text-accent-600" />
              <div className="text-left">
                <div className="font-medium">Examples</div>
                <div className="text-xs text-muted-foreground">Real-world agents</div>
              </div>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4">
            <Link href="/docs/custom-agents/best-practices" className="flex flex-col items-start gap-2">
              <FileText className="h-5 w-5 text-accent-600" />
              <div className="text-left">
                <div className="font-medium">Best Practices</div>
                <div className="text-xs text-muted-foreground">Design patterns</div>
              </div>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
