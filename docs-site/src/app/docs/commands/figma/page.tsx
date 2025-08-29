import { Figma, Code, Download, Key, Zap } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

export default function FigmaCommandPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Figma className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">/figma Command</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Convert Figma designs directly to production-ready code with intelligent component generation.
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
{`/figma "figma-url"`}
          </CodeBlock>
          <p className="text-sm text-muted-foreground mt-3">
            Provide a Figma file URL or design link to convert designs into code components.
          </p>
        </CardContent>
      </Card>

      {/* Requirements */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">⚙️ Prerequisites</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex-shrink-0">
                  <Figma className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Figma Dev Mode Access</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Required for accessing design specifications and assets
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Figma Professional Plan
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                  <Key className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">API Token Configured</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Personal access token for Figma API authentication
                  </p>
                  <Badge variant="outline" className="text-xs">
                    One-time Setup
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">✨ What Gets Generated</h2>
        
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Code className="h-8 w-8 text-accent mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">React Components</h3>
              <p className="text-sm text-muted-foreground">Production-ready components with props</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Download className="h-8 w-8 text-accent mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">Design Tokens</h3>
              <p className="text-sm text-muted-foreground">Colors, typography, and spacing</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6 text-center">
              <Zap className="h-8 w-8 text-accent mx-auto mb-3" />
              <h3 className="font-semibold text-foreground mb-2">CSS Styles</h3>
              <p className="text-sm text-muted-foreground">Responsive styling and layouts</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Usage Example */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📚 Usage Example</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Complete Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">1. Convert Figma design to components:</p>
                <CodeBlock language="bash">
{`/figma "https://www.figma.com/file/abc123/My-Design"`}
                </CodeBlock>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">2. Create project with generated components:</p>
                <CodeBlock language="bash">
{`/create "React app using the Figma components"`}
                </CodeBlock>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">3. Add custom functionality:</p>
                <CodeBlock language="bash">
{`/task "add interactive behavior to the components"`}
                </CodeBlock>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Setup Guide */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-400">
            🔧 Quick Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">1. Get Figma API Token</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Go to Figma Account Settings</li>
                <li>• Generate Personal Access Token</li>
                <li>• Copy token for configuration</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-2">2. Configure Agentwise</h3>
              <CodeBlock language="bash">
{`# Set up Figma integration
export FIGMA_TOKEN="your-figma-token"

# Verify configuration
/figma --test`}
              </CodeBlock>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-2">3. Start Converting Designs</h3>
              <p className="text-sm text-muted-foreground">
                Share any Figma file URL with Dev Mode enabled to begin automatic code generation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
