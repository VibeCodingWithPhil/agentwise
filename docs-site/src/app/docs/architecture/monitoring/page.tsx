import { Monitor, Activity, BarChart3, Gauge, Bell, Database, LineChart, Shield } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const monitoringComponents = [
  {
    name: "Real-time Dashboard",
    description: "Live visualization of all agent activities and metrics",
    icon: Monitor,
    features: ["Agent status tracking", "Task progress bars", "Token usage graphs", "Error monitoring"],
    technology: "WebSocket + React"
  },
  {
    name: "Performance Analytics",
    description: "Deep insights into system performance and optimization",
    icon: BarChart3,
    features: ["Completion time analysis", "Resource utilization", "Cost tracking", "Quality metrics"],
    technology: "Time-series database"
  },
  {
    name: "Alert System",
    description: "Proactive notifications for issues and thresholds",
    icon: Bell,
    features: ["Error alerts", "Performance warnings", "Threshold notifications", "SLA monitoring"],
    technology: "Event-driven architecture"
  },
  {
    name: "Data Collection",
    description: "Comprehensive telemetry and logging infrastructure",
    icon: Database,
    features: ["Event logging", "Metric collection", "Trace aggregation", "Context capture"],
    technology: "Structured logging"
  }
]

const metricsTracked = [
  {
    category: "Agent Metrics",
    metrics: ["Status (active/idle/error)", "Task assignments", "Completion rates", "Response times"],
    frequency: "Real-time"
  },
  {
    category: "Performance Metrics",
    metrics: ["Token usage per task", "API response times", "Queue depths", "Throughput rates"],
    frequency: "5 seconds"
  },
  {
    category: "Quality Metrics",
    metrics: ["Code quality scores", "Test coverage", "Error rates", "Validation passes"],
    frequency: "Per completion"
  },
  {
    category: "System Metrics",
    metrics: ["CPU usage", "Memory consumption", "Network latency", "Disk I/O"],
    frequency: "30 seconds"
  }
]

const dashboardPanels = [
  { panel: "Agent Overview", description: "Grid view of all agents with status indicators", priority: "High" },
  { panel: "Task Timeline", description: "Gantt chart of task execution and dependencies", priority: "Medium" },
  { panel: "Token Analytics", description: "Real-time token usage and optimization metrics", priority: "High" },
  { panel: "Error Console", description: "Live error stream with stack traces and context", priority: "Critical" },
  { panel: "Performance Graphs", description: "Time-series charts for key performance indicators", priority: "Medium" },
  { panel: "Cost Dashboard", description: "Running cost calculations and projections", priority: "Low" }
]

export default function MonitoringArchitecturePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Monitor className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Monitoring System Architecture</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Comprehensive real-time monitoring, analytics, and alerting for multi-agent orchestration.
            </p>
          </div>
        </div>
      </div>

      {/* System Overview */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400 flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Monitoring Coverage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-accent">100%</div>
              <div className="text-sm text-muted-foreground">Agent Coverage</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">5ms</div>
              <div className="text-sm text-muted-foreground">Update Latency</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">30 days</div>
              <div className="text-sm text-muted-foreground">Data Retention</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">15+</div>
              <div className="text-sm text-muted-foreground">Metric Types</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monitoring Components */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🛠️ Core Components</h2>
        <p className="text-muted-foreground">
          Integrated monitoring stack provides complete visibility into the multi-agent system.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {monitoringComponents.map((component, index) => {
            const IconComponent = component.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-accent" />
                    {component.name}
                  </CardTitle>
                  <CardDescription>{component.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Key Features:</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {component.features.map((feature, fIndex) => (
                          <li key={fIndex}>• {feature}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t">
                      <Badge variant="outline" className="text-xs">
                        {component.technology}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Metrics Tracked */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📊 Metrics Collection</h2>
        <p className="text-muted-foreground">
          Comprehensive metrics provide insights into every aspect of system operation.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {metricsTracked.map((category, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{category.category}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {category.frequency}
                  </Badge>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {category.metrics.map((metric, mIndex) => (
                    <li key={mIndex}>• {metric}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dashboard Panels */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📺 Dashboard Panels</h2>
        <p className="text-muted-foreground">
          Interactive dashboard panels provide real-time visibility and control.
        </p>
        
        <div className="space-y-3">
          {dashboardPanels.map((panel, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{panel.panel}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{panel.description}</p>
                  </div>
                  <Badge 
                    variant={
                      panel.priority === "Critical" ? "destructive" :
                      panel.priority === "High" ? "default" :
                      panel.priority === "Medium" ? "secondary" : "outline"
                    }
                    className="ml-4"
                  >
                    {panel.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* WebSocket Integration */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🔌 Real-time Integration</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>WebSocket Architecture</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="typescript">{`class MonitoringWebSocket {
  private ws: WebSocket;
  private metrics: MetricsCollector;
  
  connect(): void {
    this.ws = new WebSocket('ws://localhost:3001');
    
    this.ws.on('connect', () => {
      this.subscribeToMetrics();
    });
    
    this.ws.on('agent:update', (data) => {
      this.updateDashboard({
        agentId: data.id,
        status: data.status,
        task: data.currentTask,
        metrics: data.metrics
      });
    });
  }
  
  broadcast(event: MonitoringEvent): void {
    this.ws.emit('metric', {
      timestamp: Date.now(),
      type: event.type,
      data: event.data,
      severity: event.severity
    });
  }
}`}</CodeBlock>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Features */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="text-purple-700 dark:text-purple-400 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Advanced Monitoring Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Predictive Analytics</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Anomaly detection using ML models</li>
                <li>• Performance degradation predictions</li>
                <li>• Capacity planning recommendations</li>
                <li>• Cost optimization suggestions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Intelligent Alerting</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Smart alert grouping and deduplication</li>
                <li>• Contextual alert enrichment</li>
                <li>• Escalation policies and routing</li>
                <li>• Self-healing automation triggers</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}