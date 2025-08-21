import { Figma, Upload, Code, Zap, Download, Palette } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const figmaFeatures = [
  {
    title: "Design Upload",
    description: "Upload Figma files directly to Agentwise",
    icon: Upload,
    command: "/upload figma-design.fig",
    benefit: "Instant design analysis and component extraction"
  },
  {
    title: "Auto Code Generation",
    description: "Convert designs to production-ready code",
    icon: Code,
    command: "/figma generate-components",
    benefit: "React, Vue, or vanilla components with proper styling"
  },
  {
    title: "Design System Integration",
    description: "Extract design tokens and component library",
    icon: Palette,
    command: "/figma extract-tokens",
    benefit: "Consistent styling across your entire application"
  },
  {
    title: "Real-time Sync",
    description: "Keep code in sync with design changes",
    icon: Zap,
    command: "/figma sync",
    benefit: "Automatic updates when designs change"
  }
]

const supportedElements = [
  { element: "Frames & Sections", support: "Full", description: "Complete layout structure" },
  { element: "Text Layers", support: "Full", description: "Typography and text content" },
  { element: "Shapes & Icons", support: "Full", description: "Vector graphics and SVG export" },
  { element: "Components", support: "Full", description: "Reusable component generation" },
  { element: "Auto Layout", support: "Full", description: "Flexbox and CSS Grid layouts" },
  { element: "Variants", support: "Partial", description: "State management for components" },
  { element: "Prototyping", support: "Planned", description: "Interactive behavior (coming soon)" }
]

export default function FigmaIntegrationPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Figma className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Figma Integration</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Convert Figma designs directly to production-ready code with intelligent component generation.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400">
            🚀 Quick Start: Design to Code in Minutes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="p-3 bg-white/50 dark:bg-white/5 rounded-lg mb-2">
                <Upload className="h-8 w-8 text-accent mx-auto" />
              </div>
              <h3 className="font-semibold text-foreground">1. Upload Design</h3>
              <p className="text-xs text-muted-foreground">Drag & drop your .fig file</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-white/50 dark:bg-white/5 rounded-lg mb-2">
                <Code className="h-8 w-8 text-accent mx-auto" />
              </div>
              <h3 className="font-semibold text-foreground">2. Generate Code</h3>
              <p className="text-xs text-muted-foreground">AI creates components</p>
            </div>
            <div className="text-center">
              <div className="p-3 bg-white/50 dark:bg-white/5 rounded-lg mb-2">
                <Download className="h-8 w-8 text-accent mx-auto" />
              </div>
              <h3 className="font-semibold text-foreground">3. Use in Project</h3>
              <p className="text-xs text-muted-foreground">Import to your codebase</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Core Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🎨 Core Features</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {figmaFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                      <CodeBlock language="bash" copy={false} className="text-xs">
                        {feature.command}
                      </CodeBlock>
                      <div className="mt-3 p-2 bg-muted/30 rounded text-xs">
                        <strong>Benefit:</strong> {feature.benefit}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Support Matrix */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📋 Figma Element Support</h2>
        <p className="text-muted-foreground">
          Comprehensive support for Figma design elements and features.
        </p>
        
        <div className="grid gap-4">
          {supportedElements.map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{item.element}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Badge 
                    variant={
                      item.support === "Full" ? "default" : 
                      item.support === "Partial" ? "secondary" : "outline"
                    }
                    className="ml-4"
                  >
                    {item.support}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Usage Examples */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📚 Usage Examples</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Basic Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="bash">
{`# Upload a Figma design file
/upload my-design.fig

# Create a new project from the design
/create "React app from Figma design"

# Generate specific components
/figma generate-component "LoginForm"

# Extract design tokens
/figma extract-tokens

# Sync with updated design
/figma sync`}
            </CodeBlock>
          </CardContent>
        </Card>
      </div>

      {/* Benefits */}
      <Card className="bg-gradient-to-r from-success/5 to-accent/5 border-success/20">
        <CardHeader>
          <CardTitle className="text-success-700 dark:text-success-400">
            ✨ Why Use Figma Integration?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Development Speed</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• 70% faster design-to-code workflow</li>
                <li>• Automatic component generation</li>
                <li>• Consistent design system implementation</li>
                <li>• Reduced manual coding time</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Design Fidelity</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Pixel-perfect code generation</li>
                <li>• Proper spacing and typography</li>
                <li>• Responsive design patterns</li>
                <li>• Design token extraction</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
