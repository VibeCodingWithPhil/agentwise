"use client"

import { useEffect, useRef } from "react"
import mermaid from "mermaid"

interface MermaidDiagramProps {
  chart: string
  id?: string
}

export function MermaidDiagram({ chart, id = "mermaid-diagram" }: MermaidDiagramProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "dark",
      themeVariables: {
        primaryColor: "#8b5cf6",
        primaryTextColor: "#fff",
        primaryBorderColor: "#7c3aed",
        lineColor: "#6366f1",
        secondaryColor: "#6366f1",
        tertiaryColor: "#a78bfa",
        background: "#1f2937",
        mainBkg: "#1f2937",
        secondBkg: "#374151",
        tertiaryBkg: "#4b5563",
      },
    })

    if (ref.current) {
      mermaid.contentLoaded()
    }
  }, [])

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = chart
      mermaid.contentLoaded()
    }
  }, [chart])

  return (
    <div className="mermaid-wrapper rounded-lg bg-gray-100 dark:bg-gray-800 p-4 overflow-x-auto">
      <div ref={ref} id={id} className="mermaid">
        {chart}
      </div>
    </div>
  )
}

// Example diagrams for Agentwise
export function AgentWorkflowDiagram() {
  const chart = `
    graph TB
      A[User Command] --> B[Agentwise Orchestrator]
      B --> C[Agent Selection]
      C --> D[Frontend Agent]
      C --> E[Backend Agent]
      C --> F[Database Agent]
      C --> G[DevOps Agent]
      D --> H[Phase 1: Analysis]
      E --> H
      F --> H
      G --> H
      H --> I[Phase 2: Implementation]
      I --> J[Phase 3: Testing]
      J --> K[Final Output]
  `
  return <MermaidDiagram chart={chart} id="agent-workflow" />
}

export function TokenOptimizationDiagram() {
  const chart = `
    graph LR
      A[Traditional Approach] --> B[100% Token Usage]
      C[Agentwise Approach] --> D[Context Sharing]
      D --> E[Incremental Updates]
      E --> F[Response Caching]
      F --> G[30-40% Token Reduction]
      style A fill:#ef4444
      style B fill:#ef4444
      style C fill:#10b981
      style G fill:#10b981
  `
  return <MermaidDiagram chart={chart} id="token-optimization" />
}