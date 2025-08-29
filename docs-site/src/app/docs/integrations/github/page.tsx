import { GitBranch, GitCommit, GitPullRequest, GitMerge, Code2, Shield, Users, Clock } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const gitFeatures = [
  {
    name: "Automated Commits",
    description: "Intelligent commit messages with semantic versioning",
    icon: GitCommit,
    features: ["Semantic commit messages", "Automatic staging", "Multi-file commits", "Branch management"],
    command: "git commit -m 'feat: add user authentication'"
  },
  {
    name: "Pull Request Creation",
    description: "Generate PRs with comprehensive descriptions and test plans",
    icon: GitPullRequest,
    features: ["Auto-generated descriptions", "Test plan creation", "Label assignment", "Reviewer suggestions"],
    command: "gh pr create --title 'Feature' --body 'Description'"
  },
  {
    name: "Branch Management",
    description: "Smart branching strategies and automated workflows",
    icon: GitBranch,
    features: ["Feature branch creation", "Hotfix workflows", "Release management", "Branch protection"],
    command: "git checkout -b feature/new-feature"
  },
  {
    name: "Merge Strategies",
    description: "Intelligent merge conflict resolution and strategies",
    icon: GitMerge,
    features: ["Conflict resolution", "Rebase workflows", "Squash commits", "Merge queues"],
    command: "git merge --strategy=recursive"
  }
]

const workflowSteps = [
  {
    step: "1. Initialize",
    description: "Set up repository and configure Git",
    commands: ["git init", "git remote add origin <url>"],
    duration: "~30s"
  },
  {
    step: "2. Development",
    description: "Create feature branch and make changes",
    commands: ["git checkout -b feature", "git add .", "git commit"],
    duration: "Varies"
  },
  {
    step: "3. Review",
    description: "Create PR and run automated checks",
    commands: ["gh pr create", "gh pr checks"],
    duration: "~2min"
  },
  {
    step: "4. Deploy",
    description: "Merge to main and trigger deployment",
    commands: ["gh pr merge", "git push origin main"],
    duration: "~1min"
  }
]

const integrationFeatures = [
  { feature: "Branch Protection", description: "Enforce review requirements", status: "Active" },
  { feature: "CI/CD Triggers", description: "Automated testing on push", status: "Active" },
  { feature: "Issue Linking", description: "Connect commits to issues", status: "Active" },
  { feature: "Code Review", description: "Automated review suggestions", status: "Beta" }
]

export default function GitHubIntegrationPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <GitBranch className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">GitHub Integration</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Seamless version control and collaboration with intelligent Git operations.
            </p>
          </div>
        </div>
      </div>

      {/* Overview Card */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400 flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            GitHub Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-accent">100+</div>
              <div className="text-sm text-muted-foreground">Daily Commits</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">15s</div>
              <div className="text-sm text-muted-foreground">PR Creation</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">98%</div>
              <div className="text-sm text-muted-foreground">Merge Success</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">24/7</div>
              <div className="text-sm text-muted-foreground">CI/CD Active</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Git Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🚀 Core Features</h2>
        <p className="text-muted-foreground">
          Powerful Git operations with intelligent automation and best practices.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {gitFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-accent" />
                    {feature.name}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Features:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {feature.features.map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-3 border-t">
                      <CodeBlock language="bash">{feature.command}</CodeBlock>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📋 Development Workflow</h2>
        <p className="text-muted-foreground">
          Streamlined Git workflow from initialization to deployment.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {workflowSteps.map((step, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{step.step}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {step.duration}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {step.commands.map((cmd, cmdIdx) => (
                    <code key={cmdIdx} className="block text-xs bg-muted px-2 py-1 rounded">
                      {cmd}
                    </code>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Integration Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🔧 Platform Integration</h2>
        <p className="text-muted-foreground">
          Deep integration with GitHub's platform features.
        </p>
        
        <div className="space-y-3">
          {integrationFeatures.map((feature, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{feature.feature}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                  <Badge 
                    variant={feature.status === "Active" ? "default" : "secondary"}
                    className="ml-4"
                  >
                    {feature.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Advanced Features */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-purple-700 dark:text-purple-400 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Advanced GitHub Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Security & Compliance</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Signed commits with GPG</li>
                <li>• Secret scanning and alerts</li>
                <li>• Dependency vulnerability checks</li>
                <li>• Security policy enforcement</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Collaboration Tools</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Code review automation</li>
                <li>• Team notifications</li>
                <li>• Project board integration</li>
                <li>• Discussion threads</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
