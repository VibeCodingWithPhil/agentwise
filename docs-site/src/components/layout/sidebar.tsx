"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, FileText, Zap, Code, Users, BarChart3, Gamepad2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  items?: NavItem[]
}

const sidebarNavItems: NavItem[] = [
  {
    title: "Getting Started",
    href: "/docs",
    icon: Zap,
    items: [
      { title: "Installation", href: "/docs/installation" },
      { title: "Quick Start", href: "/docs/quick-start" },
      { title: "First Project", href: "/docs/first-project" },
      { title: "Configuration", href: "/docs/configuration" },
    ],
  },
  {
    title: "Commands",
    href: "/docs/commands",
    icon: Code,
    items: [
      { title: "Overview", href: "/docs/commands" },
      { title: "/create", href: "/docs/commands/create" },
      { title: "/task", href: "/docs/commands/task" },
      { title: "/monitor", href: "/docs/commands/monitor" },
      { title: "/projects", href: "/docs/commands/projects" },
      { title: "/figma", href: "/docs/commands/figma" },
      { title: "/upload", href: "/docs/commands/upload" },
    ],
  },
  {
    title: "Architecture",
    href: "/docs/architecture",
    icon: FileText,
    items: [
      { title: "Overview", href: "/docs/architecture" },
      { title: "Agent System", href: "/docs/architecture/agents" },
      { title: "Task Distribution", href: "/docs/architecture/tasks" },
      { title: "Token Optimization", href: "/docs/architecture/tokens" },
      { title: "Monitoring", href: "/docs/architecture/monitoring" },
    ],
  },
  {
    title: "Custom Agents",
    href: "/docs/custom-agents",
    icon: Users,
    items: [
      { title: "Creating Agents", href: "/docs/custom-agents/creating" },
      { title: "Agent Types", href: "/docs/custom-agents/types" },
      { title: "Best Practices", href: "/docs/custom-agents/best-practices" },
      { title: "Examples", href: "/docs/custom-agents/examples" },
    ],
  },
  {
    title: "Performance",
    href: "/docs/performance",
    icon: BarChart3,
    items: [
      { title: "Token Optimization", href: "/docs/performance/tokens" },
      { title: "Benchmarks", href: "/docs/performance/benchmarks" },
      { title: "Analytics", href: "/docs/performance/analytics" },
      { title: "Monitoring", href: "/docs/performance/monitoring" },
    ],
  },
  {
    title: "Integrations",
    href: "/docs/integrations",
    icon: Gamepad2,
    items: [
      { title: "Figma", href: "/docs/integrations/figma" },
      { title: "GitHub", href: "/docs/integrations/github" },
      { title: "CI/CD", href: "/docs/integrations/cicd" },
      { title: "MCP", href: "/docs/integrations/mcp" },
    ],
  },
]

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("w-64 border-r bg-background", className)}>
      <ScrollArea className="h-full py-6">
        <div className="px-3 space-y-2">
          {sidebarNavItems.map((item, index) => (
            <div key={index} className="space-y-1">
              <SidebarNavItem
                item={item}
                pathname={pathname}
                level={0}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

interface SidebarNavItemProps {
  item: NavItem
  pathname: string
  level: number
}

function SidebarNavItem({ item, pathname, level }: SidebarNavItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(() => {
    // Expand if current path is within this section
    return item.items?.some(subItem => pathname.startsWith(subItem.href)) || false
  })
  
  const hasChildren = item.items && item.items.length > 0
  const isActive = pathname === item.href
  const Icon = item.icon

  React.useEffect(() => {
    // Auto-expand if a child is active
    if (hasChildren && item.items?.some(subItem => pathname.startsWith(subItem.href))) {
      setIsExpanded(true)
    }
  }, [pathname, hasChildren, item.items])

  return (
    <div>
      <div
        className={cn(
          "flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
          {
            "bg-accent text-accent-foreground": isActive,
            "text-muted-foreground": !isActive && level === 0,
            "pl-6": level === 1,
          }
        )}
        onClick={() => {
          if (hasChildren) {
            setIsExpanded(!isExpanded)
          }
        }}
      >
        <Link
          href={item.href}
          className="flex items-center flex-1 space-x-2"
          onClick={(e) => {
            if (hasChildren) {
              e.preventDefault()
            }
          }}
        >
          {Icon && <Icon className="h-4 w-4" />}
          <span>{item.title}</span>
        </Link>
        {hasChildren && (
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div className="ml-4 space-y-1 border-l border-border pl-2">
          {item.items?.map((subItem, index) => (
            <SidebarNavItem
              key={index}
              item={subItem}
              pathname={pathname}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Mobile Sidebar with overlay
export function MobileSidebar({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean
  onClose: () => void 
}) {
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-background border-r md:hidden">
        <Sidebar />
      </div>
    </>
  )
}