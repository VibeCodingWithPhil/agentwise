import { Plus, Zap, Target, Clock, CheckCircle, Users } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const taskExamples = [
  {
    description: "add user authentication",
    category: "Security",
    complexity: "Medium",
    timeEstimate: "8-12 min",
    agents: ["Backend", "Frontend", "Database"],
    features: ["Login/Register", "JWT tokens", "Protected routes"]
  },
  {
    description: "create responsive navigation",
    category: "UI/UX",
    complexity: "Easy",
    timeEstimate: "5-8 min",
    agents: ["Frontend", "Designer"],
    features: ["Mobile menu", "Breadcrumbs", "Active states"]
  },
  {
    description: "implement payment processing",
    category: "Integration",
    complexity: "Hard",
    timeEstimate: "15-25 min",
    agents: ["Backend", "Frontend", "Testing"],
    features: ["Stripe integration", "Order management", "Webhooks"]
  },
  {
    description: "add real-time chat",
    category: "Feature",
    complexity: "Medium",
    timeEstimate: "12-18 min",
    agents: ["Backend", "Frontend", "Database"],
    features: ["WebSocket connection", "Message history", "Online status"]
  }
]

const taskWorkflow = [
  {
    step: 1,
    title: "Context Analysis",
    description: "Analyzes existing project structure and requirements",
    icon: Target
  },
  {
    step: 2,
    title: "Agent Selection",
    description: "Selects appropriate agents based on feature needs",
    icon: Users
  },
  {
    step: 3,
    title: "Integration Planning",
    description: "Plans how the feature integrates with existing code",
    icon: Zap
  },
  {
    step: 4,
    title: "Implementation",
    description: "Develops and tests the feature incrementally",
    icon: CheckCircle
  }
]

const taskCategories = [
  { name: "Authentication", examples: ["user login", "OAuth integration", "password reset"] },
  { name: "UI Components", examples: ["responsive navigation", "data tables", "modal dialogs"] },
  { name: "API Integration", examples: ["payment processing", "third-party APIs", "webhooks"] },
  { name: "Database", examples: ["new models", "relationships", "migrations"] },
  { name: "Real-time Features", examples: ["live chat", "notifications", "collaborative editing"] },
  { name: "Performance", examples: ["caching layer", "image optimization", "lazy loading"] }
]

export default function TaskCommandPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Plus className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">/task Command</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Add features to your active project with intelligent context-aware development.
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
{`/task "feature description"`}
          </CodeBlock>
          <div className="mt-4 p-3 bg-white/50 dark:bg-white/5 rounded">
            <p className="text-sm text-foreground font-medium mb-2">💡 Context-Aware Execution</p>
            <p className="text-xs text-muted-foreground">
              The /task command automatically detects your active project and integrates the new feature seamlessly with your existing codebase.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Workflow */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">⚙️ How Tasks Work</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {taskWorkflow.map((step, index) => {
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
                        <h3 className="font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Task Examples */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">💡 Task Examples</h2>
        <p className="text-muted-foreground">
          Real-world examples showing different types of features you can add to your projects.
        </p>
        
        <div className="space-y-4">
          {taskExamples.map((task, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CodeBlock language="bash" copy={false} className="text-sm inline-block">{`/task "${task.description}"`}</CodeBlock>
                      <Badge variant="outline" className="text-xs">
                        {task.category}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {task.features.map((feature, featureIndex) => (
                        <Badge key={featureIndex} variant="secondary" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <Badge 
                      variant={task.complexity === "Easy" ? "secondary" : task.complexity === "Medium" ? "outline" : "destructive"}
                      className="mb-2"
                    >
                      {task.complexity}
                    </Badge>
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {task.timeEstimate}
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Agents involved:</span> {task.agents.join(", ")}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Feature Categories */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📋 Popular Feature Categories</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {taskCategories.map((category, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-base">{category.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {category.examples.map((example, exampleIndex) => (
                    <div key={exampleIndex} className="text-xs bg-muted/50 p-2 rounded">
                      <code className="text-accent">/task</code>{' '}
                      <span className="text-muted-foreground">"{example}"</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Best Practices */}
      <Card className="bg-gradient-to-r from-success/5 to-accent/5 border-success/20">
        <CardHeader>
          <CardTitle className="text-success-700 dark:text-success-400">
            ✨ Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Effective Task Descriptions</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Be specific about functionality ("add user login with email")</li>
                <li>• Mention integration requirements ("integrate with Stripe API")</li>
                <li>• Include UI/UX preferences ("responsive mobile-first design")</li>
                <li>• Specify validation needs ("with form validation and error handling")</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Context Awareness</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Analyzes existing codebase for consistency</li>
                <li>• Maintains current architecture patterns</li>
                <li>• Preserves coding style and conventions</li>
                <li>• Ensures compatibility with existing features</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
