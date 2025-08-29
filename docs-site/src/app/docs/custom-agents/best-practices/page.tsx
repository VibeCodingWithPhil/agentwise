import { CheckCircle, XCircle, AlertTriangle, Lightbulb, Shield, Target, Book, Zap } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/ui/code-block"

const designPrinciples = [
  {
    principle: "Single Responsibility",
    description: "Each agent should excel at one specific domain",
    icon: Target,
    dos: ["Focus on one specialty", "Master specific tools", "Deep domain knowledge"],
    donts: ["Jack of all trades", "Overlapping responsibilities", "Generic capabilities"]
  },
  {
    principle: "Clear Communication",
    description: "Agents should provide clear, actionable outputs",
    icon: Book,
    dos: ["Structured responses", "Progress updates", "Error explanations"],
    donts: ["Vague messages", "Silent failures", "Ambiguous results"]
  },
  {
    principle: "Efficient Resource Usage",
    description: "Optimize token usage and processing time",
    icon: Zap,
    dos: ["Context sharing", "Incremental updates", "Smart caching"],
    donts: ["Redundant processing", "Full context resends", "Unnecessary API calls"]
  },
  {
    principle: "Robust Error Handling",
    description: "Gracefully handle failures and edge cases",
    icon: Shield,
    dos: ["Validate inputs", "Retry mechanisms", "Fallback strategies"],
    donts: ["Crash on errors", "Ignore failures", "Assume success"]
  }
]

const implementationGuidelines = [
  {
    category: "Agent Definition",
    guidelines: [
      "Start with a clear role statement",
      "List specific capabilities and limitations",
      "Define success metrics and KPIs",
      "Include example use cases"
    ],
    priority: "Critical"
  },
  {
    category: "Tool Selection",
    guidelines: [
      "Choose minimal required MCPs",
      "Verify tool compatibility",
      "Test tool performance",
      "Document tool dependencies"
    ],
    priority: "High"
  },
  {
    category: "Testing Strategy",
    guidelines: [
      "Create comprehensive test scenarios",
      "Include edge case testing",
      "Validate output quality",
      "Monitor performance metrics"
    ],
    priority: "High"
  },
  {
    category: "Documentation",
    guidelines: [
      "Document all capabilities",
      "Provide usage examples",
      "Maintain changelog",
      "Include troubleshooting guide"
    ],
    priority: "Medium"
  }
]

const commonPitfalls = [
  {
    pitfall: "Over-Engineering",
    description: "Making agents too complex or feature-rich",
    icon: AlertTriangle,
    solution: "Start simple, iterate based on needs",
    impact: "High"
  },
  {
    pitfall: "Poor Context Management",
    description: "Not sharing context between agents effectively",
    icon: AlertTriangle,
    solution: "Implement shared context pools",
    impact: "High"
  },
  {
    pitfall: "Lack of Validation",
    description: "Not validating agent outputs and quality",
    icon: AlertTriangle,
    solution: "Add validation layers and quality checks",
    impact: "Medium"
  },
  {
    pitfall: "Ignoring Performance",
    description: "Not optimizing for speed and efficiency",
    icon: AlertTriangle,
    solution: "Profile and optimize critical paths",
    impact: "Medium"
  }
]

export default function BestPracticesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-accent/10 rounded-lg">
            <Lightbulb className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-foreground">Agent Best Practices</h1>
            <p className="text-xl text-muted-foreground mt-2">
              Proven guidelines for building effective, maintainable, and efficient AI agents.
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
        <CardHeader>
          <CardTitle className="text-green-700 dark:text-green-400">
            ✨ Following Best Practices Results In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">40%</div>
              <div className="text-sm text-muted-foreground">Faster Development</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">60%</div>
              <div className="text-sm text-muted-foreground">Fewer Errors</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">35%</div>
              <div className="text-sm text-muted-foreground">Token Savings</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">95%</div>
              <div className="text-sm text-muted-foreground">Task Success Rate</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Design Principles */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">🎯 Design Principles</h2>
        <p className="text-muted-foreground">
          Core principles for effective agent design.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          {designPrinciples.map((principle, index) => {
            const IconComponent = principle.icon
            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5 text-accent" />
                    {principle.principle}
                  </CardTitle>
                  <CardDescription>{principle.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="flex items-center gap-1 text-sm font-medium text-green-600 mb-2">
                        <CheckCircle className="h-4 w-4" /> Do
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {principle.dos.map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-1 text-sm font-medium text-red-600 mb-2">
                        <XCircle className="h-4 w-4" /> Don't
                      </h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {principle.donts.map((item, idx) => (
                          <li key={idx}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Implementation Guidelines */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">📋 Implementation Guidelines</h2>
        <p className="text-muted-foreground">
          Step-by-step guidelines for agent implementation.
        </p>
        
        <div className="grid md:grid-cols-2 gap-4">
          {implementationGuidelines.map((guideline, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-foreground">{guideline.category}</h3>
                  <Badge 
                    variant={
                      guideline.priority === "Critical" ? "destructive" :
                      guideline.priority === "High" ? "default" : "secondary"
                    }
                    className="text-xs"
                  >
                    {guideline.priority}
                  </Badge>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {guideline.guidelines.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-3 w-3 text-green-600 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Code Example */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">💻 Example Implementation</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Well-Structured Agent Definition</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeBlock language="typescript">{`class WellDesignedAgent extends BaseAgent {
  constructor() {
    super({
      name: 'performance-optimizer',
      specialty: 'Performance Optimization',
      version: '1.0.0'
    });
  }
  
  // Single responsibility: performance only
  async analyzePerformance(code: string): Promise<Analysis> {
    // Validate input
    if (!this.validateInput(code)) {
      throw new ValidationError('Invalid code input');
    }
    
    // Use shared context to reduce tokens
    const context = await this.getSharedContext();
    
    // Process with error handling
    try {
      const result = await this.processWithRetry(code, context);
      
      // Validate output quality
      if (!this.validateOutput(result)) {
        return this.fallbackStrategy();
      }
      
      return result;
    } catch (error) {
      this.logger.error('Analysis failed', error);
      return this.handleError(error);
    }
  }
}`}</CodeBlock>
          </CardContent>
        </Card>
      </div>

      {/* Common Pitfalls */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">⚠️ Common Pitfalls</h2>
        <p className="text-muted-foreground">
          Avoid these common mistakes when building agents.
        </p>
        
        <div className="space-y-3">
          {commonPitfalls.map((pitfall, index) => {
            const IconComponent = pitfall.icon
            return (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-foreground">{pitfall.pitfall}</h3>
                        <Badge 
                          variant={pitfall.impact === "High" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {pitfall.impact} Impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{pitfall.description}</p>
                      <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                        <strong className="text-green-700 dark:text-green-400">Solution:</strong> {pitfall.solution}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Success Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Tips for Success
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3">Development Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Start with a minimal viable agent</li>
                <li>• Test with real-world scenarios</li>
                <li>• Monitor performance metrics</li>
                <li>• Iterate based on feedback</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-3">Maintenance Tips</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Keep agents updated with latest tools</li>
                <li>• Regular performance audits</li>
                <li>• Document all changes</li>
                <li>• Version control agent definitions</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
