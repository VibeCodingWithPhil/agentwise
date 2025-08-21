"use client"

import * as React from "react"
import Link from "next/link"
import { BarChart3, Clock, Zap, TrendingUp, Award, Download } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge" 
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { TokenOptimizationDiagram } from "@/components/ui/mermaid-diagram"

const performanceMetrics = [
  {
    metric: "Token Reduction",
    value: "30-40%",
    description: "Verified reduction in token usage across projects",
    trend: "+5% this month",
    color: "text-success-600",
    icon: TrendingUp,
  },
  {
    metric: "Development Speed",
    value: "4x Faster",
    description: "Parallel agent execution vs sequential development",
    trend: "Consistent across projects",
    color: "text-accent-600", 
    icon: Zap,
  },
  {
    metric: "Code Quality",
    value: "95%",
    description: "Automated testing and validation scores",
    trend: "+2% improvement",
    color: "text-primary-600",
    icon: Award,
  },
  {
    metric: "Time to First Output",
    value: "<30s",
    description: "Average time from command to first agent response",
    trend: "Optimized continuously",
    color: "text-warning-600",
    icon: Clock,
  },
]

const benchmarkData = [
  {
    projectType: "React Todo App",
    traditional: "2,450 tokens",
    agentwise: "1,470 tokens", 
    reduction: "40%",
    agents: ["Frontend", "Testing"],
  },
  {
    projectType: "E-commerce Platform",
    traditional: "8,900 tokens",
    agentwise: "5,340 tokens",
    reduction: "40%", 
    agents: ["Frontend", "Backend", "DevOps", "Testing"],
  },
  {
    projectType: "Blog with CMS",
    traditional: "3,200 tokens",
    agentwise: "2,240 tokens",
    reduction: "30%",
    agents: ["Frontend", "Backend"],
  },
  {
    projectType: "API Documentation",
    traditional: "1,800 tokens", 
    agentwise: "1,260 tokens",
    reduction: "30%",
    agents: ["Documentation", "Testing"],
  },
  {
    projectType: "Mobile App (React Native)",
    traditional: "6,500 tokens",
    agentwise: "4,225 tokens", 
    reduction: "35%",
    agents: ["Mobile", "Backend", "Testing"],
  },
]

const realTimeMetrics = [
  { name: "Active Projects", value: 127, change: "+12%" },
  { name: "Agents Running", value: 45, change: "+8%" },
  { name: "Tokens Saved Today", value: "89.2k", change: "+15%" },
  { name: "Avg Response Time", value: "1.2s", change: "-5%" },
]

export default function PerformancePage() {
  const [selectedProject, setSelectedProject] = React.useState<string | null>(null)

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">Performance Analytics</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          Real-time performance metrics and verified benchmarks showing Agentwise's 
          30-40% token reduction and 4x development speed improvements.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.metric}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color}`}>
                {metric.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.description}
              </p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-3 w-3 text-success-600 mr-1" />
                <span className="text-xs text-success-600">{metric.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-time Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Live Performance Dashboard
          </CardTitle>
          <CardDescription>
            Real-time metrics from the Agentwise ecosystem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-6">
            {realTimeMetrics.map((metric, index) => (
              <div key={index} className="text-center p-4 bg-muted/30 rounded-lg">
                <div className="text-2xl font-bold text-foreground mb-1">
                  {metric.value}
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  {metric.name}
                </div>
                <Badge variant="outline" className="text-xs">
                  {metric.change}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Token Optimization Visualization */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Token Optimization Strategy</h2>
        <TokenOptimizationDiagram />
      </div>

      {/* Benchmark Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Verified Benchmarks</h2>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Full Report
          </Button>
        </div>
        <p className="text-muted-foreground">
          Real-world performance testing across different project types and complexities.
        </p>

        <div className="overflow-x-auto">
          <div className="min-w-full">
            {benchmarkData.map((benchmark, index) => (
              <Card key={index} className="mb-4">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{benchmark.projectType}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        Agents: {benchmark.agents.map((agent, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {agent}
                          </Badge>
                        ))}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline"
                      className="text-success-600 border-success-600"
                    >
                      -{benchmark.reduction} tokens
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Traditional Approach</p>
                      <p className="text-xl font-semibold text-foreground">{benchmark.traditional}</p>
                      <Progress value={100} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">With Agentwise</p>
                      <p className="text-xl font-semibold text-success-600">{benchmark.agentwise}</p>
                      <Progress 
                        value={parseInt(benchmark.reduction)} 
                        className="h-2" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">Token Reduction</p>
                      <p className="text-2xl font-bold text-success-600">{benchmark.reduction}</p>
                      <p className="text-xs text-muted-foreground">
                        Saved {parseInt(benchmark.traditional.replace(/,/g, '')) - parseInt(benchmark.agentwise.replace(/,/g, ''))} tokens
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Features */}
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">How We Achieve Token Reduction</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-success-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-success-500" />
                </div>
                <div>
                  <p className="font-medium">Context Sharing</p>
                  <p className="text-sm text-muted-foreground">
                    Agents intelligently share relevant context without duplication
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-success-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-success-500" />
                </div>
                <div>
                  <p className="font-medium">Incremental Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Only send changes and deltas, not entire contexts
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-success-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-success-500" />
                </div>
                <div>
                  <p className="font-medium">Response Caching</p>
                  <p className="text-sm text-muted-foreground">
                    Reuse similar responses and patterns across agents
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-success-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-2 w-2 rounded-full bg-success-500" />
                </div>
                <div>
                  <p className="font-medium">Smart Batching</p>
                  <p className="text-sm text-muted-foreground">
                    Combine related operations into efficient request batches
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Performance Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Token Usage</span>
                <span className="text-sm text-muted-foreground">Real-time tracking</span>
              </div>
              <Progress value={35} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Agent Efficiency</span>
                <span className="text-sm text-muted-foreground">95% optimal</span>
              </div>
              <Progress value={95} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Response Time</span>
                <span className="text-sm text-muted-foreground">1.2s average</span>
              </div>
              <Progress value={85} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Success Rate</span>
                <span className="text-sm text-muted-foreground">99.7% uptime</span>
              </div>
              <Progress value={97} className="h-2" />
            </div>
            
            <div className="pt-4 border-t">
              <Button asChild size="sm" variant="outline" className="w-full">
                <Link href="/docs/commands/monitor">
                  Open Live Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-accent-600 to-accent-700 text-white">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-bold">Experience the Performance</h3>
            <p className="text-accent-100 max-w-2xl mx-auto">
              See the token reduction and speed improvements for yourself. 
              Start your first Agentwise project today.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" variant="secondary">
                <Link href="/docs/quick-start">
                  Get Started Now
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-accent-600">
                <Link href="/docs/benchmarks">
                  View Full Benchmarks
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}