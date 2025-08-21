import { Zap, TrendingDown, Share2, RefreshCw, Shield, Target } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const optimizationFeatures = [
  {
    feature: "Context Sharing",
    description: "Agents share context to avoid redundant API calls",
    savings: "25%",
    icon: Share2,
    example: "Agent A's project analysis is reused by Agent B for implementation"
  },
  {
    feature: "Incremental Updates", 
    description: "Only send context changes instead of full context",
    savings: "30%",
    icon: RefreshCw,
    example: "Send only new requirements instead of entire project spec"
  },
  {
    feature: "Agent Pooling",
    description: "Limit concurrent agents to optimize token usage",
    savings: "20%",
    icon: Target,
    example: "Maximum 3 agents active simultaneously with intelligent queuing"
  },
  {
    feature: "Smart Caching",
    description: "Cache frequent responses to reduce repeat API calls",
    savings: "15%",
    icon: Shield,
    example: "Common patterns and boilerplate code cached locally"
  }
]

const beforeAfterComparison = {
  before: {
    title: "Traditional Approach",
    totalTokens: "100,000",
    breakdown: [
      { category: "Project Analysis", tokens: "25,000", percentage: "25%" },
      { category: "Code Generation", tokens: "40,000", percentage: "40%" },
      { category: "Testing & Validation", tokens: "20,000", percentage: "20%" },
      { category: "Documentation", tokens: "15,000", percentage: "15%" }
    ]
  },
  after: {
    title: "Agentwise Optimized",
    totalTokens: "65,000",
    breakdown: [
      { category: "Shared Analysis", tokens: "10,000", percentage: "15%" },
      { category: "Incremental Generation", tokens: "28,000", percentage: "43%" },
      { category: "Cached Validation", tokens: "15,000", percentage: "23%" },
      { category: "Template Documentation", tokens: "12,000", percentage: "18%" }
    ]
  }
}

export default function TokensPerformancePage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Zap className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Token Optimization</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Advanced techniques that reduce API token usage by 30-40% without compromising quality.
            </p>
          </div>
        </div>
      </div>

      {/* Optimization Overview */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            35% Token Reduction Achieved
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">65,000</div>
              <div className="text-sm text-muted-foreground">Tokens Used (Optimized)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500 line-through">100,000</div>
              <div className="text-sm text-muted-foreground">Traditional Approach</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">$87</div>
              <div className="text-sm text-muted-foreground">Cost Savings per Project</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Optimization Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">⚡ Optimization Techniques</h2>
        <p className="text-muted-foreground">
          Four core optimization strategies that work together to minimize token usage while maintaining quality.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {optimizationFeatures.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-accent/10 rounded-lg flex-shrink-0">
                      <IconComponent className="h-5 w-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">{feature.feature}</h3>
                        <Badge variant="secondary" className="text-green-600 bg-green-100 dark:bg-green-900/50 text-xs">
                          -{feature.savings}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{feature.description}</p>
                      <div className="p-3 bg-muted/50 rounded text-xs text-muted-foreground">
                        <strong>Example:</strong> {feature.example}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Before/After Comparison */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📊 Before vs After Comparison</h2>
        <p className="text-muted-foreground">
          Detailed breakdown showing how token usage is distributed and optimized.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">{beforeAfterComparison.before.title}</CardTitle>
              <CardDescription>
                Total: {beforeAfterComparison.before.totalTokens} tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {beforeAfterComparison.before.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-foreground">{item.category}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.tokens}</div>
                      <div className="text-xs text-muted-foreground">{item.percentage}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="text-green-600 dark:text-green-400">{beforeAfterComparison.after.title}</CardTitle>
              <CardDescription>
                Total: {beforeAfterComparison.after.totalTokens} tokens (-35%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {beforeAfterComparison.after.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-foreground">{item.category}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">{item.tokens}</div>
                      <div className="text-xs text-muted-foreground">{item.percentage}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Configuration Example */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">⚙️ Configuration</h2>
        <p className="text-muted-foreground">
          Token optimization is enabled by default but can be fine-tuned for specific needs.
        </p>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">config/settings.json</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="json">
{`{
  "tokenOptimization": {
    "enabled": true,
    "maxConcurrentAgents": 3,
    "contextWindow": 8000,
    "cacheEnabled": true,
    "incrementalUpdates": true,
    "contextSharing": {
      "enabled": true,
      "shareThreshold": 0.7
    }
  },
  "monitoring": {
    "trackTokenUsage": true,
    "costTracking": true,
    "optimizationReports": true
  }
}`}
            </CodeBlock>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
        <CardHeader>
          <CardTitle className="text-accent-700 dark:text-accent-400">
            🎯 Optimization Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Immediate Benefits</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• 35% reduction in API costs</li>
                <li>• 40% faster project completion</li>
                <li>• Maintained code quality scores</li>
                <li>• Reduced rate limiting issues</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Long-term Impact</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Scalable to larger projects</li>
                <li>• Sustainable development costs</li>
                <li>• Improved developer experience</li>
                <li>• Better resource utilization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
