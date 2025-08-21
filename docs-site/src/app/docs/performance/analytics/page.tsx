import { LineChart, PieChart, BarChart, TrendingUp, Activity, Zap } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const analyticsMetrics = [
  {
    title: "Token Efficiency",
    value: "35%",
    description: "Reduction in API token usage",
    icon: Zap,
    trend: "+12%",
    color: "text-green-600"
  },
  {
    title: "Parallel Execution",
    value: "8 agents",
    description: "Simultaneous active agents",
    icon: Activity,
    trend: "optimal",
    color: "text-blue-600"
  },
  {
    title: "Code Quality",
    value: "8.8/10",
    description: "Average quality score",
    icon: TrendingUp,
    trend: "+1.6",
    color: "text-purple-600"
  }
]

const performanceData = [
  {
    category: "Frontend Development",
    improvement: "42%",
    avgTime: "12 min",
    agents: ["Frontend Specialist", "Designer", "Testing Specialist"],
    projects: 245
  },
  {
    category: "Backend Services", 
    improvement: "38%",
    avgTime: "18 min",
    agents: ["Backend Specialist", "Database Specialist", "DevOps Specialist"],
    projects: 189
  },
  {
    category: "Full-Stack Applications",
    improvement: "45%",
    avgTime: "35 min",
    agents: ["Frontend", "Backend", "Database", "Testing", "DevOps"],
    projects: 156
  }
]

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <LineChart className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Performance Analytics</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Deep insights into Agentwise performance metrics and optimization opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📊 Key Performance Indicators</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          {analyticsMetrics.map((metric, index) => {
            const IconComponent = metric.icon
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComponent className={`h-5 w-5 ${metric.color}`} />
                        <h3 className="font-semibold text-foreground">{metric.title}</h3>
                      </div>
                      <div className="text-2xl font-bold text-foreground mb-1">{metric.value}</div>
                      <p className="text-sm text-muted-foreground">{metric.description}</p>
                    </div>
                    <Badge variant="secondary" className={`${metric.color} bg-opacity-10 text-xs`}>
                      {metric.trend}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Performance by Category */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🎯 Performance by Category</h2>
        <p className="text-muted-foreground">
          Breakdown of performance improvements across different development categories.
        </p>
        
        <div className="space-y-4">
          {performanceData.map((category, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground">{category.category}</h3>
                    <p className="text-sm text-muted-foreground">{category.projects} projects completed</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{category.improvement}</div>
                    <div className="text-sm text-muted-foreground">avg: {category.avgTime}</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Primary Agents:</p>
                    <div className="flex flex-wrap gap-2">
                      {category.agents.map((agent, agentIndex) => (
                        <Badge key={agentIndex} variant="outline" className="text-xs">
                          {agent}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Analytics Insights */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400 flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Analytics Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Performance Patterns</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Complex projects benefit most from parallel execution</li>
                <li>• Token optimization scales linearly with project size</li>
                <li>• Quality scores improve with agent specialization</li>
                <li>• Multi-agent validation reduces post-completion fixes</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Optimization Opportunities</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Database-heavy projects show highest improvement potential</li>
                <li>• Testing automation contributes significantly to quality</li>
                <li>• DevOps integration reduces deployment time by 60%</li>
                <li>• Custom agents can improve domain-specific performance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
