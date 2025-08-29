import Link from "next/link"
import { Settings, FileText, Globe, Shield, Cpu, Monitor } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const configFiles = [
  {
    file: ".agentwise-config.json",
    description: "Sandboxed execution and permission bypass configuration",
    location: "~/.agentwise-config.json (User home)",
    icon: Shield,
    example: `{
  "version": "1.0.0",
  "permissions": {
    "bypassEnabled": true,
    "safetyMode": "moderate",
    "autoResponse": true,
    "restrictedCommands": []
  },
  "workspace": {
    "enableSandbox": true,
    "restrictPaths": true,
    "maxFileSize": 104857600,
    "allowedPaths": ["~/agentwise/workspace"],
    "deniedPaths": ["/etc", "/usr", "/bin", "/sbin"]
  },
  "monitoring": {
    "enableTerminalMonitoring": true,
    "verbosity": "normal",
    "logRetention": 7
  },
  "tokenOptimization": {
    "enabled": true,
    "maxAgents": 5,
    "contextWindow": 8000,
    "cacheEnabled": true
  }
}`,
    required: false
  },
  {
    file: "projects.json",
    description: "Central project registry with metadata and tracking",
    location: "Root directory",
    icon: FileText,
    example: `{
  "projects": {
    "todo-app": {
      "name": "todo-app",
      "created": "2024-01-15T10:30:00Z",
      "status": "active",
      "phase": "development",
      "agents": ["frontend", "backend", "database"]
    }
  }
}`,
    required: true
  },
  {
    file: "config/settings.json",
    description: "Global Agentwise configuration and preferences",
    location: "config/settings.json",
    icon: Settings,
    example: `{
  "tokenOptimization": {
    "enabled": true,
    "maxAgents": 3,
    "contextWindow": 8000
  },
  "monitoring": {
    "autoStart": true,
    "port": 3001
  },
  "agents": {
    "autoRegenerate": true,
    "customPath": ".claude/agents"
  }
}`,
    required: false
  },
  {
    file: ".claude/",
    description: "Agent definitions and custom commands",
    location: ".claude/ directory",
    icon: Cpu,
    example: `# Directory structure:
.claude/
├── agents/
│   ├── frontend-specialist.md
│   ├── backend-specialist.md
│   └── custom-agent.md
├── commands/
│   ├── custom-create.ts
│   └── custom-deploy.ts
└── config.json`,
    required: true
  }
]

const envVariables = [
  {
    name: "AGENTWISE_HOME",
    description: "Override default installation directory",
    example: "/usr/local/agentwise",
    required: false,
    usage: "Path customization"
  },
  {
    name: "AGENTWISE_BYPASS_PERMISSIONS",
    description: "Enable permission bypass system globally",
    example: "true",
    required: false,
    usage: "No --dangerously-skip-permissions needed"
  },
  {
    name: "CLAUDE_FLAGS",
    description: "Default flags for Claude Code startup (deprecated - no longer needed)",
    example: "--dangerously-skip-permissions --debug",
    required: false,
    usage: "Legacy startup configuration"
  },
  {
    name: "AGENTWISE_DEBUG",
    description: "Enable detailed debug logging",
    example: "true",
    required: false,
    usage: "Development debugging"
  },
  {
    name: "MONITOR_PORT",
    description: "Custom port for monitoring dashboard",
    example: "3002",
    required: false,
    usage: "Port customization"
  }
]

const configurationSteps = [
  {
    step: 1,
    title: "Initial Setup",
    description: "Create basic configuration structure",
    code: `# Create configuration directory
mkdir -p config

# Initialize projects registry
echo '{"projects": {}}' > projects.json

# Create .claude directory structure  
mkdir -p .claude/agents .claude/commands`,
    icon: Settings
  },
  {
    step: 2,
    title: "Environment Setup",
    description: "Configure environment variables",
    code: `# Add to your shell profile (.bashrc, .zshrc, etc.)
export AGENTWISE_HOME=/path/to/agentwise
export CLAUDE_FLAGS="--dangerously-skip-permissions"

# Reload shell
source ~/.zshrc  # or ~/.bashrc`,
    icon: Globe
  },
  {
    step: 3,
    title: "Verify Configuration",
    description: "Test that everything is properly configured",
    code: `# Start Claude Code with configuration
claude $CLAUDE_FLAGS

# Test Agentwise commands
/projects
/monitor`,
    icon: Shield
  }
]

export default function ConfigurationPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Settings className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Configuration</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Configure Agentwise to suit your development workflow and optimize performance.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Overview */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400">
            Configuration Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <FileText className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="font-semibold text-foreground">Configuration Files</h3>
              <p className="text-sm text-muted-foreground">JSON-based settings and project registry</p>
            </div>
            <div className="text-center">
              <Globe className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="font-semibold text-foreground">Environment Variables</h3>
              <p className="text-sm text-muted-foreground">System-wide configuration options</p>
            </div>
            <div className="text-center">
              <Cpu className="h-8 w-8 text-accent mx-auto mb-2" />
              <h3 className="font-semibold text-foreground">Agent Settings</h3>
              <p className="text-sm text-muted-foreground">Custom agent definitions and commands</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Files */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📁 Configuration Files</h2>
        <p className="text-muted-foreground">
          Agentwise uses several configuration files to manage projects, settings, and agent definitions.
        </p>
        
        <div className="space-y-6">
          {configFiles.map((file, index) => {
            const IconComponent = file.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-5 w-5 text-accent" />
                      <div>
                        <CardTitle className="text-lg">
                          <code className="bg-muted px-2 py-1 rounded text-sm">{file.file}</code>
                        </CardTitle>
                        <CardDescription>{file.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant={file.required ? "default" : "secondary"} className="text-xs">
                      {file.required ? "Required" : "Optional"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Location:</p>
                      <code className="text-xs bg-muted px-2 py-1 rounded">{file.location}</code>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Example:</p>
                      <CodeBlock language={file.file.endsWith('.json') ? 'json' : 'bash'}>
                        {file.example}
                      </CodeBlock>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Environment Variables */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🌍 Environment Variables</h2>
        <p className="text-muted-foreground">
          Set these environment variables to customize Agentwise behavior and defaults.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {envVariables.map((env, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">
                      <code className="bg-muted px-2 py-1 rounded text-sm">{env.name}</code>
                    </h3>
                    <Badge variant={env.required ? "default" : "secondary"} className="text-xs">
                      {env.required ? "Required" : "Optional"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{env.description}</p>
                  <div>
                    <p className="text-xs font-medium mb-1">Example:</p>
                    <CodeBlock language="bash" copy={false}>
{`export ${env.name}="${env.example}"`}
                    </CodeBlock>
                  </div>
                  <div className="pt-2 border-t">
                    <span className="text-xs text-muted-foreground">Use case: {env.usage}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Configuration Steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">⚙️ Configuration Setup</h2>
        <p className="text-muted-foreground">
          Follow these steps to properly configure Agentwise for your environment.
        </p>
        
        <div className="space-y-6">
          {configurationSteps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold flex-shrink-0">
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className="h-5 w-5 text-accent" />
                        <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <CodeBlock language="bash">
                        {step.code}
                      </CodeBlock>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Advanced Configuration */}
      <Card className="border-warning-200 bg-warning-50 dark:bg-warning-900/20">
        <CardHeader>
          <CardTitle className="text-warning-700 dark:text-warning-400 flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Advanced Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-foreground">
              For advanced users, additional configuration options are available:
            </p>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Custom agent creation with specialized MCPs</li>
              <li>• Token optimization fine-tuning</li>
              <li>• Monitoring dashboard customization</li>
              <li>• Performance analytics configuration</li>
            </ul>
            <div className="flex gap-3 mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/custom-agents">Custom Agents</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/docs/performance">Performance Tuning</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card className="bg-gradient-to-r from-success/5 to-accent/5 border-success/20">
        <CardHeader>
          <CardTitle className="text-success-700 dark:text-success-400">
            🎯 Configuration Complete!
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground mb-4">
            Your Agentwise configuration is now set up. Ready to start building?
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/docs/first-project">Create Your First Project</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs/commands">Learn Commands</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/docs/integrations">Explore Integrations</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
