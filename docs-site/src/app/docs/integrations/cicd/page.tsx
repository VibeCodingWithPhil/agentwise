import { PlayCircle, CheckCircle, XCircle, RefreshCw, Zap, Shield, GitBranch, Rocket } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const pipelineStages = [
  {
    name: "Build Stage",
    description: "Compile code and prepare artifacts",
    icon: Zap,
    steps: ["Install dependencies", "TypeScript compilation", "Bundle optimization", "Asset generation"],
    duration: "~2 min",
    status: "success"
  },
  {
    name: "Test Stage",
    description: "Run comprehensive test suites",
    icon: CheckCircle,
    steps: ["Unit tests", "Integration tests", "E2E tests", "Coverage reports"],
    duration: "~5 min",
    status: "success"
  },
  {
    name: "Security Scan",
    description: "Analyze code for vulnerabilities",
    icon: Shield,
    steps: ["Dependency audit", "SAST scanning", "License compliance", "Secret detection"],
    duration: "~3 min",
    status: "success"
  },
  {
    name: "Deploy Stage",
    description: "Release to production environment",
    icon: Rocket,
    steps: ["Environment setup", "Database migrations", "Service deployment", "Health checks"],
    duration: "~4 min",
    status: "success"
  }
]

const platformSupport = [
  {
    platform: "GitHub Actions",
    description: "Native GitHub CI/CD with Actions workflows",
    features: ["Matrix builds", "Secrets management", "Artifact storage", "Reusable workflows"],
    config: ".github/workflows/ci.yml"
  },
  {
    platform: "Vercel",
    description: "Automatic deployment for Next.js applications",
    features: ["Preview deployments", "Edge functions", "Analytics", "A/B testing"],
    config: "vercel.json"
  },
  {
    platform: "Netlify",
    description: "JAMstack deployment with build plugins",
    features: ["Deploy previews", "Split testing", "Forms handling", "Functions"],
    config: "netlify.toml"
  },
  {
    platform: "Jenkins",
    description: "Enterprise CI/CD with extensive plugins",
    features: ["Pipeline as code", "Distributed builds", "Plugin ecosystem", "Blue-green deploy"],
    config: "Jenkinsfile"
  }
]

const deploymentMetrics = [
  { metric: "Deployment Frequency", value: "12/day", baseline: "2/week", improvement: "+500%" },
  { metric: "Lead Time", value: "15 min", baseline: "2 hours", improvement: "-87%" },
  { metric: "Failure Rate", value: "0.2%", baseline: "5%", improvement: "-96%" },
  { metric: "Recovery Time", value: "5 min", baseline: "45 min", improvement: "-89%" }
]

export default function CICDIntegrationPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <PlayCircle className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">CI/CD Integration</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Automated testing, building, and deployment pipelines for continuous delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Deployment Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            {deploymentMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{metric.value}</div>
                  <div className="text-sm font-medium text-foreground">{metric.metric}</div>
                </div>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Before:</span>
                    <span className="text-red-600">{metric.baseline}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">After:</span>
                    <span className="text-green-600">{metric.improvement}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Stages */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🎯 Pipeline Stages</h2>
        <p className="text-muted-foreground">
          Automated pipeline with comprehensive testing and security checks.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {pipelineStages.map((stage, index) => {
            const IconComponent = stage.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-accent" />
                    {stage.name}
                  </CardTitle>
                  <CardDescription>{stage.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Steps:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {stage.steps.map((step, stepIdx) => (
                          <li key={stepIdx}>• {step}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t">
                      <Badge variant="secondary" className="text-xs">
                        {stage.duration}
                      </Badge>
                      <Badge 
                        variant={stage.status === "success" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {stage.status === "success" ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Passed</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Failed</>
                        )}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Platform Support */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🛠️ Platform Support</h2>
        <p className="text-muted-foreground">
          Integration with major CI/CD platforms and services.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {platformSupport.map((platform, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{platform.platform}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{platform.description}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium mb-2">Features:</h4>
                    <div className="flex flex-wrap gap-1">
                      {platform.features.map((feature, fIdx) => (
                        <Badge key={fIdx} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      Config: {platform.config}
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Example Configuration */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📁 Example Configuration</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>GitHub Actions Workflow</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="yaml">{`name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build-test-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: Build application
        run: npm run build
      
      - name: Deploy to Vercel
        if: github.ref == 'refs/heads/main'
        run: vercel --prod --token=\${{ secrets.VERCEL_TOKEN }}`}</CodeBlock>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Features */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Advanced CI/CD Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Deployment Strategies</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Blue-green deployments</li>
                <li>• Canary releases</li>
                <li>• Feature flags integration</li>
                <li>• Rollback automation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Quality Gates</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Code coverage thresholds</li>
                <li>• Performance benchmarks</li>
                <li>• Security scan requirements</li>
                <li>• Manual approval steps</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
