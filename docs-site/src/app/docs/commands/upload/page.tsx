import { Upload, FileText, Image, Figma, File, CheckCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const supportedFormats = [
  {
    type: "PDF Documents",
    description: "Extract text, requirements, and specifications",
    icon: FileText,
    extensions: [".pdf"],
    maxSize: "10MB",
    useCase: "Requirements docs, specifications, user manuals"
  },
  {
    type: "Word Documents",
    description: "Process text content and formatting",
    icon: File,
    extensions: [".docx", ".doc"],
    maxSize: "5MB",
    useCase: "Project briefs, feature descriptions, documentation"
  },
  {
    type: "Images",
    description: "Visual analysis and component extraction",
    icon: Image,
    extensions: [".png", ".jpg", ".jpeg", ".svg"],
    maxSize: "2MB",
    useCase: "Mockups, wireframes, design references, logos"
  },
  {
    type: "Figma Files",
    description: "Design-to-code conversion with components",
    icon: Figma,
    extensions: [".fig"],
    maxSize: "20MB",
    useCase: "UI designs, component libraries, design systems"
  }
]

const uploadWorkflow = [
  {
    step: 1,
    title: "File Analysis",
    description: "AI analyzes uploaded content and extracts key information"
  },
  {
    step: 2,
    title: "Context Integration",
    description: "Incorporates file contents into your project context"
  },
  {
    step: 3,
    title: "Code Generation",
    description: "Generates relevant code based on uploaded specifications"
  },
  {
    step: 4,
    title: "Project Enhancement",
    description: "Enhances existing project with new requirements or assets"
  }
]

const uploadExamples = [
  {
    command: '/upload requirements.pdf',
    description: 'Process project requirements document',
    outcome: 'Extract features and generate implementation plan'
  },
  {
    command: '/upload mockup.png',
    description: 'Analyze UI mockup for component extraction',
    outcome: 'Generate React components matching the design'
  },
  {
    command: '/upload design-system.fig',
    description: 'Import complete Figma design system',
    outcome: 'Create component library with design tokens'
  }
]

export default function UploadCommandPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Upload className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">/upload Command</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Upload documents and assets to incorporate into your project with intelligent content processing.
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
{`/upload [file-path]`}
          </CodeBlock>
          <p className="text-sm text-muted-foreground mt-3">
            Upload files by dragging & dropping or specifying file path. Supports multiple file formats.
          </p>
        </CardContent>
      </Card>

      {/* Supported Formats */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📁 Supported File Formats</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {supportedFormats.map((format, index) => {
            const IconComponent = format.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-accent" />
                    {format.type}
                  </CardTitle>
                  <CardDescription>{format.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        <span className="font-medium">Extensions:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {format.extensions.map((ext, extIndex) => (
                            <Badge key={extIndex} variant="secondary" className="text-xs">
                              {ext}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Max: {format.maxSize}
                      </div>
                    </div>
                    <div className="text-xs bg-muted/30 p-2 rounded">
                      <strong>Use case:</strong> {format.useCase}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Upload Workflow */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">⚙️ Processing Workflow</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {uploadWorkflow.map((step, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold flex-shrink-0">
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Upload Examples */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">💡 Usage Examples</h2>
        
        <div className="space-y-4">
          {uploadExamples.map((example, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div>
                    <CodeBlock language="bash" copy={false} className="text-sm">
                      {example.command}
                    </CodeBlock>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-foreground">Action:</span>
                      <p className="text-muted-foreground">{example.description}</p>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">Result:</span>
                      <p className="text-muted-foreground">{example.outcome}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features & Benefits */}
      <Card className="bg-gradient-to-r from-success/5 to-accent/5 border-success/20">
        <CardHeader>
          <CardTitle className="text-success-700 dark:text-success-400 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Smart Processing Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Content Analysis</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Automatic text extraction from PDFs and documents</li>
                <li>• Image analysis for UI component detection</li>
                <li>• Requirement parsing and feature identification</li>
                <li>• Design token extraction from Figma files</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Project Integration</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Seamless integration with existing projects</li>
                <li>• Context-aware code generation</li>
                <li>• Automatic asset optimization and placement</li>
                <li>• Intelligent component library generation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
