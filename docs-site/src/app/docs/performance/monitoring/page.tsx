import { Monitor, Activity, TrendingUp, Cpu, BarChart3, Gauge } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const monitoringFeatures = [
  {
    title: "Real-time Dashboard",
    description: "Live monitoring of all agent activities",
    icon: Monitor,
    metrics: ["Agent Status", "Token Usage", "Task Progress", "Performance Metrics"]
  },
  {
    title: "Performance Analytics",
    description: "Detailed insights into system performance",
    icon: BarChart3,
    metrics: ["Completion Times", "Error Rates", "Resource Usage", "Quality Scores"]
  },
  {
    title: "Resource Tracking",
    description: "Monitor system resource utilization",
    icon: Cpu,
    metrics: ["CPU Usage", "Memory Consumption", "Network Activity", "Disk I/O"]
  },
  {
    title: "Performance Alerts",
    description: "Automated notifications for performance issues",
    icon: Activity,
    metrics: ["Threshold Alerts", "Error Notifications", "Performance Warnings", "System Status"]
  }
]

const dashboardMetrics = [
  { label: "Active Agents", value: "3/8", status: "normal", color: "text-green-600" },
  { label: "Token Usage", value: "65,234", status: "optimized", color: "text-blue-600" },
  { label: "Current Tasks", value: "12", status: "active", color: "text-orange-600" },
  { label: "Completion Rate", value: "94.2%", status: "excellent", color: "text-purple-600" },
  { label: "Avg Response Time", value: "1.2s", status: "fast", color: "text-green-600" },
  { label: "Error Rate", value: "0.8%", status: "low", color: "text-green-600" }
]

export default function MonitoringPerformancePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Monitor className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Performance Monitoring</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Real-time performance tracking and analytics for optimal system health.
            </p>
          </div>
        </div>
      </div>

      {/* Dashboard Overview */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400 flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Live Performance Dashboard
          </CardTitle>
          <CardDescription>
            Access your monitoring dashboard at http://localhost:3001
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {dashboardMetrics.map((metric, index) => (
              <div key={index} className="text-center p-3 bg-white/50 dark:bg-white/5 rounded">
                <div className={`text-xl font-bold ${metric.color}`}>{metric.value}</div>
                <div className="text-sm text-muted-foreground">{metric.label}</div>
                <Badge variant="secondary" className="text-xs mt-1">{metric.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📊 Monitoring Capabilities</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          {monitoringFeatures.map((feature, index) => {
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

      {/* Monitoring Setup */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">⚙️ Setup & Configuration</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Start Monitoring Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="bash">
{`# Start monitoring dashboard
/monitor

# Dashboard will open at:
# http://localhost:3001

# Features available:
# - Real-time agent status
# - Token usage graphs
# - Performance metrics
# - System health indicators`}
            </CodeBlock>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="bg-gradient-to-r from-success/5 to-accent/5 border-success/20">
        <CardHeader>
          <CardTitle className="text-success-700 dark:text-success-400 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Key Metrics</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Token usage optimization in real-time</li>
                <li>• Agent performance and efficiency tracking</li>
                <li>• Task completion rates and quality metrics</li>
                <li>• Resource utilization monitoring</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Benefits</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Identify performance bottlenecks early</li>
                <li>• Optimize resource allocation</li>
                <li>• Track cost efficiency improvements</li>
                <li>• Ensure system reliability</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
