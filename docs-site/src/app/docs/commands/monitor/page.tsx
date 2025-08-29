import { Monitor, Activity, BarChart3, Zap, Users, TrendingUp } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const dashboardFeatures = [
  {
    title: "Real-time Agent Status",
    description: "Live view of all active agents and their current tasks",
    icon: Users,
    metrics: ["Agent health", "Task assignment", "Execution status", "Error tracking"]
  },
  {
    title: "Task Completion Tracking",
    description: "Visual progress bars for all ongoing project tasks",
    icon: Activity,
    metrics: ["Progress percentage", "Time estimates", "Completion rates", "Bottlenecks"]
  },
  {
    title: "Performance Metrics",
    description: "Detailed analytics on system performance and efficiency",
    icon: TrendingUp,
    metrics: ["Response times", "Throughput", "Quality scores", "Success rates"]
  },
  {
    title: "Token Usage Statistics",
    description: "Real-time tracking of API token consumption and optimization",
    icon: Zap,
    metrics: ["Token usage", "Cost tracking", "Optimization savings", "Rate limits"]
  }
]

const liveMetrics = [
  { label: "Active Agents", value: "5/8", status: "optimal", color: "text-green-600" },
  { label: "Current Tasks", value: "12", status: "active", color: "text-blue-600" },
  { label: "Completion Rate", value: "94.2%", status: "excellent", color: "text-green-600" },
  { label: "Token Usage", value: "45,234", status: "optimized", color: "text-purple-600" },
  { label: "Avg Response", value: "1.4s", status: "fast", color: "text-green-600" },
  { label: "Error Rate", value: "0.6%", status: "low", color: "text-green-600" }
]

const monitoringBenefits = [
  {
    title: "Proactive Issue Detection",
    description: "Spot problems before they impact your project"
  },
  {
    title: "Resource Optimization",
    description: "Identify bottlenecks and optimize agent allocation"
  },
  {
    title: "Performance Insights",
    description: "Understand patterns and improve future projects"
  },
  {
    title: "Cost Management",
    description: "Track token usage and optimize API costs"
  }
]

export default function MonitorCommandPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Monitor className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">/monitor Command</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Real-time monitoring dashboard for comprehensive agent progress and performance tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Quick Start */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400">
            🚀 Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Launch Dashboard</h3>
              <CodeBlock language="bash">
/monitor
              </CodeBlock>
              <p className="text-sm text-muted-foreground mt-2">
                Opens monitoring dashboard at http://localhost:3001
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Live Metrics Sample</h3>
              <div className="grid grid-cols-2 gap-2">
                {liveMetrics.slice(0, 4).map((metric, index) => (
                  <div key={index} className="text-center p-2 bg-white/50 dark:bg-white/5 rounded">
                    <div className={`text-sm font-bold ${metric.color}`}>{metric.value}</div>
                    <div className="text-xs text-muted-foreground">{metric.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📊 Dashboard Features</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {dashboardFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-accent" />
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {feature.metrics.map((metric, metricIndex) => (
                      <div key={metricIndex} className="text-xs bg-muted/50 p-2 rounded text-center">
                        {metric}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Live Dashboard Preview */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🔴 Live Metrics Overview</h2>
        <p className="text-muted-foreground">
          Real-time metrics you'll see in your monitoring dashboard.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {liveMetrics.map((metric, index) => (
            <Card key={index}>
              <CardContent className="pt-6 text-center">
                <div className={`text-2xl font-bold ${metric.color} mb-1`}>{metric.value}</div>
                <div className="text-sm text-foreground mb-2">{metric.label}</div>
                <Badge variant="secondary" className="text-xs">
                  {metric.status}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Access Information */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Dashboard Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Local Development</h3>
              <div className="p-3 bg-white/50 dark:bg-white/5 rounded flex items-center justify-between">
                <code className="text-sm">http://localhost:3001</code>
                <Badge variant="outline">Auto-opens</Badge>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-foreground mb-2">Keyboard Shortcuts</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• <kbd>R</kbd> - Refresh all metrics</li>
                  <li>• <kbd>F</kbd> - Toggle fullscreen</li>
                  <li>• <kbd>D</kbd> - Toggle dark mode</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Auto-Refresh</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Metrics update every 5 seconds</li>
                  <li>• Charts refresh every 30 seconds</li>
                  <li>• Logs stream in real-time</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">✨ Monitoring Benefits</h2>
        
        <div className="grid md:grid-cols-2 gap-4">
          {monitoringBenefits.map((benefit, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
