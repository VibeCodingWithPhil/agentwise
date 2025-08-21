"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import mermaid from "mermaid"

import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

interface MermaidDiagramProps {
  chart: string
  className?: string
  title?: string
}

export function MermaidDiagram({ chart, className, title }: MermaidDiagramProps) {
  const { theme } = useTheme()
  const [svg, setSvg] = React.useState<string>("")
  const [error, setError] = React.useState<string>("")
  const [mounted, setMounted] = React.useState(false)
  const mermaidRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    if (!mounted) return

    const renderDiagram = async () => {
      try {
        // Configure Mermaid with theme-appropriate settings
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === "dark" ? "dark" : "default",
          themeVariables: {
            primaryColor: theme === "dark" ? "#262626" : "#ffffff",
            primaryTextColor: theme === "dark" ? "#ffffff" : "#000000",
            primaryBorderColor: theme === "dark" ? "#404040" : "#e5e7eb",
            lineColor: theme === "dark" ? "#666666" : "#374151",
            sectionBkgColor: theme === "dark" ? "#1f1f1f" : "#f9fafb",
            altSectionBkgColor: theme === "dark" ? "#2a2a2a" : "#f3f4f6",
            gridColor: theme === "dark" ? "#404040" : "#e5e7eb",
            background: theme === "dark" ? "#171717" : "#ffffff",
            mainBkg: theme === "dark" ? "#262626" : "#ffffff",
            secondBkg: theme === "dark" ? "#1f1f1f" : "#f9fafb",
          },
          fontFamily: "Inter, system-ui, -apple-system, sans-serif",
        })

        // Generate unique ID for this diagram
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        
        // Render the diagram
        const { svg: renderedSvg } = await mermaid.render(id, chart)
        setSvg(renderedSvg)
        setError("")
      } catch (err) {
        console.error("Mermaid rendering error:", err)
        setError(err instanceof Error ? err.message : "Failed to render diagram")
      }
    }

    renderDiagram()
  }, [chart, theme, mounted])

  if (!mounted) {
    return (
      <Card className={cn("p-6", className)}>
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          Loading diagram...
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={cn("p-6 border-destructive", className)}>
        {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
        <div className="text-destructive">
          <p className="font-medium">Error rendering diagram:</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("p-6", className)}>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <div 
        ref={mermaidRef}
        className="flex justify-center overflow-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </Card>
  )
}

// Common Agentwise diagrams
export function AgentWorkflowDiagram() {
  const chart = `
graph TD
    A[User Request] --> B[Project Analysis]
    B --> C{Agent Selection}
    C --> D[Frontend Specialist]
    C --> E[Backend Specialist]
    C --> F[Testing Specialist]
    C --> G[DevOps Specialist]
    
    D --> H[Phase 1: Analysis]
    E --> I[Phase 1: Analysis]
    F --> J[Phase 1: Analysis]
    G --> K[Phase 1: Analysis]
    
    H --> L[Phase 2: Implementation]
    I --> M[Phase 2: Implementation]
    J --> N[Phase 2: Implementation]
    K --> O[Phase 2: Implementation]
    
    L --> P[Phase 3: Testing]
    M --> Q[Phase 3: Testing]
    N --> R[Phase 3: Testing]
    O --> S[Phase 3: Testing]
    
    P --> T[Integration]
    Q --> T
    R --> T
    S --> T
    
    T --> U[Final Output]
  `

  return (
    <MermaidDiagram
      chart={chart}
      title="Agent Workflow Process"
      className="my-6"
    />
  )
}

export function TokenOptimizationDiagram() {
  const chart = `
graph LR
    A[Original Request] --> B[Context Analysis]
    B --> C[Token Reduction]
    C --> D[Shared Context]
    C --> E[Incremental Updates]
    C --> F[Response Caching]
    
    D --> G[30-40% Reduction]
    E --> G
    F --> G
    
    G --> H[Optimized Response]
    
    style G fill:#10b981,stroke:#059669,stroke-width:2px,color:#ffffff
  `

  return (
    <MermaidDiagram
      chart={chart}
      title="Token Optimization Strategy"
      className="my-6"
    />
  )
}

export function SystemArchitectureDiagram() {
  const chart = `
graph TB
    subgraph "Claude Code CLI"
        A[User Commands]
        B[Command Handler]
        C[Project Manager]
    end
    
    subgraph "Agentwise Core"
        D[Agent Orchestrator]
        E[Task Distributor]
        F[Phase Manager]
        G[Context Manager]
    end
    
    subgraph "Specialized Agents"
        H[Frontend Agent]
        I[Backend Agent]
        J[Testing Agent]
        K[DevOps Agent]
        L[Custom Agents]
    end
    
    subgraph "Monitoring System"
        M[WebSocket Server]
        N[Progress Tracker]
        O[Dashboard UI]
    end
    
    subgraph "Storage & Cache"
        P[File System]
        Q[Project Registry]
        R[Response Cache]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    
    E --> H
    E --> I
    E --> J
    E --> K
    E --> L
    
    F --> M
    M --> N
    N --> O
    
    G --> P
    G --> Q
    G --> R
  `

  return (
    <MermaidDiagram
      chart={chart}
      title="System Architecture Overview"
      className="my-8"
    />
  )
}