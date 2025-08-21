"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

import { cn } from "@/lib/utils"

interface BreadcrumbItem {
  href: string
  label: string
  isCurrentPage?: boolean
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const pathSegments = pathname.split("/").filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = [
    { href: "/", label: "Home" }
  ]

  let currentPath = ""
  
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    
    // Convert segment to readable label
    let label = segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
    
    // Special cases for common paths
    if (segment === "docs") label = "Documentation"
    if (segment === "agent-showcase") label = "Agent Showcase"
    if (segment === "performance") label = "Performance"
    if (segment === "playground") label = "Playground"
    if (segment === "getting-started") label = "Getting Started"
    if (segment === "commands") label = "Commands"
    if (segment === "architecture") label = "Architecture"
    if (segment === "custom-agents") label = "Custom Agents"
    if (segment === "integrations") label = "Integrations"

    breadcrumbs.push({
      href: currentPath,
      label,
      isCurrentPage: index === pathSegments.length - 1
    })
  })

  return breadcrumbs
}

interface BreadcrumbsProps {
  className?: string
  separator?: React.ReactNode
  showHome?: boolean
}

export function Breadcrumbs({ 
  className, 
  separator = <ChevronRight className="h-4 w-4" />,
  showHome = true 
}: BreadcrumbsProps) {
  const pathname = usePathname()
  const breadcrumbs = generateBreadcrumbs(pathname)

  // Don't show breadcrumbs on home page
  if (pathname === "/") {
    return null
  }

  // Filter out home if not wanted
  const displayBreadcrumbs = showHome ? breadcrumbs : breadcrumbs.slice(1)

  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground mb-6", className)}
    >
      <ol className="flex items-center space-x-1">
        {displayBreadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-muted-foreground/60">
                {separator}
              </span>
            )}
            {crumb.isCurrentPage ? (
              <span 
                className="font-medium text-foreground" 
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors flex items-center"
              >
                {crumb.href === "/" && (
                  <Home className="h-4 w-4 mr-1" />
                )}
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Static breadcrumbs for custom paths
interface StaticBreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
  separator?: React.ReactNode
}

export function StaticBreadcrumbs({ 
  items, 
  className, 
  separator = <ChevronRight className="h-4 w-4" /> 
}: StaticBreadcrumbsProps) {
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={cn("flex items-center space-x-1 text-sm text-muted-foreground mb-6", className)}
    >
      <ol className="flex items-center space-x-1">
        {items.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-muted-foreground/60">
                {separator}
              </span>
            )}
            {crumb.isCurrentPage ? (
              <span 
                className="font-medium text-foreground" 
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}