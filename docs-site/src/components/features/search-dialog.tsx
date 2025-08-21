"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FileText, Hash, Code, Users, BarChart3, Gamepad2, Search } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"

interface SearchResult {
  id: string
  title: string
  description?: string
  href: string
  category: "docs" | "commands" | "agents" | "performance" | "guides"
  icon?: React.ComponentType<{ className?: string }>
}

// Mock search data - in a real app, this would come from an API or search index
const searchData: SearchResult[] = [
  // Documentation
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Learn how to install and set up Agentwise",
    href: "/docs",
    category: "docs",
    icon: FileText,
  },
  {
    id: "installation",
    title: "Installation",
    description: "Install Agentwise on your system",
    href: "/docs/installation",
    category: "docs",
    icon: FileText,
  },
  {
    id: "quick-start",
    title: "Quick Start Guide",
    description: "Get up and running with your first project",
    href: "/docs/quick-start",
    category: "guides",
    icon: FileText,
  },
  {
    id: "architecture",
    title: "Architecture",
    description: "Understand how Agentwise works under the hood",
    href: "/docs/architecture",
    category: "docs",
    icon: FileText,
  },
  
  // Commands
  {
    id: "create-command",
    title: "/create",
    description: "Create a new project with AI agent orchestration",
    href: "/docs/commands/create",
    category: "commands",
    icon: Code,
  },
  {
    id: "task-command",
    title: "/task",
    description: "Add a new task to your active project",
    href: "/docs/commands/task",
    category: "commands",
    icon: Code,
  },
  {
    id: "monitor-command",
    title: "/monitor",
    description: "Open the monitoring dashboard",
    href: "/docs/commands/monitor",
    category: "commands",
    icon: Code,
  },
  {
    id: "projects-command",
    title: "/projects",
    description: "List and switch between projects",
    href: "/docs/commands/projects",
    category: "commands",
    icon: Code,
  },
  {
    id: "figma-command",
    title: "/figma",
    description: "Integrate with Figma designs",
    href: "/docs/commands/figma",
    category: "commands",
    icon: Code,
  },
  
  // Agent-related
  {
    id: "custom-agents",
    title: "Custom Agents",
    description: "Create and manage custom AI agents",
    href: "/docs/custom-agents",
    category: "agents",
    icon: Users,
  },
  {
    id: "agent-showcase",
    title: "Agent Showcase",
    description: "Explore available agents and their capabilities",
    href: "/agent-showcase",
    category: "agents",
    icon: Users,
  },
  
  // Performance
  {
    id: "token-optimization",
    title: "Token Optimization",
    description: "Learn about Agentwise's token reduction techniques",
    href: "/docs/performance/tokens",
    category: "performance",
    icon: BarChart3,
  },
  {
    id: "performance-metrics",
    title: "Performance Metrics",
    description: "View real-time performance analytics",
    href: "/performance",
    category: "performance",
    icon: BarChart3,
  },
  
  // Playground
  {
    id: "playground",
    title: "Interactive Playground",
    description: "Try Agentwise features interactively",
    href: "/playground",
    category: "guides",
    icon: Gamepad2,
  },
]

const categoryIcons = {
  docs: FileText,
  commands: Hash,
  agents: Users,
  performance: BarChart3,
  guides: Gamepad2,
}

const categoryLabels = {
  docs: "Documentation",
  commands: "Commands",
  agents: "Agents",
  performance: "Performance",
  guides: "Guides",
}

interface SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState("")

  // Filter results based on search query
  const filteredResults = React.useMemo(() => {
    if (!query) return searchData

    const lowercaseQuery = query.toLowerCase()
    return searchData.filter(
      (item) =>
        item.title.toLowerCase().includes(lowercaseQuery) ||
        item.description?.toLowerCase().includes(lowercaseQuery)
    )
  }, [query])

  // Group results by category
  const groupedResults = React.useMemo(() => {
    const groups = filteredResults.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = []
      }
      acc[item.category].push(item)
      return acc
    }, {} as Record<string, SearchResult[]>)

    return groups
  }, [filteredResults])

  const handleSelect = (href: string) => {
    onOpenChange(false)
    router.push(href)
    setQuery("")
  }

  // Keyboard shortcut to open search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        onOpenChange(true)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onOpenChange])

  return (
    <>
      <CommandDialog open={open} onOpenChange={onOpenChange}>
        <CommandInput
          placeholder="Search documentation, commands, and more..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          <CommandEmpty>
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Search className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                No results found for "{query}"
              </p>
            </div>
          </CommandEmpty>

          {Object.entries(groupedResults).map(([category, results], index) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons]
            const label = categoryLabels[category as keyof typeof categoryLabels]

            return (
              <React.Fragment key={category}>
                {index > 0 && <CommandSeparator />}
                <CommandGroup heading={label}>
                  {results.map((result) => {
                    const ItemIcon = result.icon || Icon
                    return (
                      <CommandItem
                        key={result.id}
                        value={`${result.title} ${result.description || ""}`}
                        onSelect={() => handleSelect(result.href)}
                        className="cursor-pointer"
                      >
                        <ItemIcon className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.description && (
                            <span className="text-xs text-muted-foreground">
                              {result.description}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </React.Fragment>
            )
          })}
        </CommandList>
        
        <div className="flex items-center border-t px-3 py-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
            to search
          </div>
        </div>
      </CommandDialog>

      {/* Search trigger button for mobile/fallback */}
      <Button
        variant="ghost"
        size="sm"
        className="hidden"
        onClick={() => onOpenChange(true)}
      >
        <Search className="h-4 w-4 mr-2" />
        Search...
      </Button>
    </>
  )
}

// Hook to control the search dialog
export function useSearch() {
  const [isOpen, setIsOpen] = React.useState(false)

  const openSearch = React.useCallback(() => setIsOpen(true), [])
  const closeSearch = React.useCallback(() => setIsOpen(false), [])
  
  return {
    isOpen,
    openSearch,
    closeSearch,
    setIsOpen,
  }
}