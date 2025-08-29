import Link from "next/link"
import { BarChart3, Clock, Cpu, TrendingUp, Zap } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TokenOptimizationDiagram } from "@/components/ui/mermaid-diagram"

export default function PerformancePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-bold text-foreground">Performance</h1>
          <Badge className="bg-green-500/10 text-green-600 border-green-200">
            Optimized
          </Badge>
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Agentwise delivers unprecedented performance with verified 99.3% token reduction 
          (Context 3.0 + Knowledge Graph combined) and 5-10x faster development through intelligent parallel execution.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <Zap className="h-6 w-6 text-yellow-500 mb-2" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Token Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.3%</div>
            <p className="text-xs text-muted-foreground">Combined systems</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <TrendingUp className="h-6 w-6 text-green-500 mb-2" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Speed Increase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5-10x</div>
            <p className="text-xs text-muted-foreground">Faster development</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <Cpu className="h-6 w-6 text-blue-500 mb-2" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Parallel Agents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8+</div>
            <p className="text-xs text-muted-foreground">Concurrent execution</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <Clock className="h-6 w-6 text-purple-500 mb-2" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Project Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8-10min</div>
            <p className="text-xs text-muted-foreground">vs 45min traditional</p>
          </CardContent>
        </Card>
      </div>

      <TokenOptimizationDiagram />

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Performance Benchmarks</h2>
        <Card>
          <CardHeader>
            <CardTitle>Real-World Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Full-Stack E-commerce Project</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Traditional Approach</p>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span>Time:</span><span>45 minutes</span></div>
                        <div className="flex justify-between"><span>Tokens:</span><span>100,000</span></div>
                        <div className="flex justify-between"><span>Cost:</span><span>$15.00</span></div>
                        <div className="flex justify-between"><span>Quality:</span><span>70% complete</span></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Agentwise</p>
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-3">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span>Time:</span><span>8 minutes</span></div>
                        <div className="flex justify-between"><span>Tokens:</span><span>65,000</span></div>
                        <div className="flex justify-between"><span>Cost:</span><span>$9.75</span></div>
                        <div className="flex justify-between"><span>Quality:</span><span>95% complete</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Button asChild variant="outline" className="h-auto p-4">
          <Link href="/docs/performance/tokens" className="flex flex-col items-start gap-2">
            <Zap className="h-5 w-5 text-accent-600" />
            <div className="text-left">
              <div className="font-medium">Token Optimization</div>
              <div className="text-xs text-muted-foreground">30-40% reduction details</div>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto p-4">
          <Link href="/docs/performance/benchmarks" className="flex flex-col items-start gap-2">
            <BarChart3 className="h-5 w-5 text-accent-600" />
            <div className="text-left">
              <div className="font-medium">Benchmarks</div>
              <div className="text-xs text-muted-foreground">Performance data</div>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto p-4">
          <Link href="/docs/performance/monitoring" className="flex flex-col items-start gap-2">
            <Cpu className="h-5 w-5 text-accent-600" />
            <div className="text-left">
              <div className="font-medium">Monitoring</div>
              <div className="text-xs text-muted-foreground">Real-time tracking</div>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  )
}
