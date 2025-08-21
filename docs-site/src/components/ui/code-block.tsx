"use client"

import * as React from "react"
import { Check, Copy, Terminal } from "lucide-react"
import { useTheme } from "next-themes"

import { cn, copyToClipboard } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CodeBlockProps {
  children: string
  language?: string
  title?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
  className?: string
  copy?: boolean
}

export function CodeBlock({
  children,
  language = "text",
  title,
  showLineNumbers = false,
  highlightLines = [],
  className,
  copy = true,
}: CodeBlockProps) {
  const { theme } = useTheme()
  const [isCopied, setIsCopied] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleCopy = async () => {
    try {
      await copyToClipboard(children.trim())
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy code:", error)
    }
  }

  return (
    <div className={cn("relative rounded-lg border overflow-hidden bg-slate-950 dark:bg-slate-900", className)}>
      {/* Header with title and copy button */}
      {(title || copy) && (
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2 bg-slate-800/50">
          <div className="flex items-center gap-2">
            {language === "bash" || language === "sh" || language === "terminal" ? (
              <Terminal className="h-4 w-4 text-slate-400" />
            ) : null}
            {title && (
              <span className="text-sm font-medium text-slate-300">
                {title}
              </span>
            )}
            {!title && language && (
              <span className="text-xs uppercase font-medium text-slate-400 tracking-wider">
                {language}
              </span>
            )}
          </div>
          {copy && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
              onClick={handleCopy}
            >
              {isCopied ? (
                <Check className="h-3 w-3" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
              <span className="sr-only">
                {isCopied ? "Copied" : "Copy code"}
              </span>
            </Button>
          )}
        </div>
      )}

      {/* Code content */}
      <div className="relative">
        <pre className="p-4 text-sm overflow-x-auto">
          <code 
            className="text-slate-100 font-mono leading-relaxed"
            style={{
              fontFamily: "Fira Code, JetBrains Mono, SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace",
            }}
          >
            {children.trim()}
          </code>
        </pre>

        {/* Copy button overlay for code without header */}
        {copy && !title && !language && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-auto p-1.5 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700/80"
            onClick={handleCopy}
          >
            {isCopied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            <span className="sr-only">
              {isCopied ? "Copied" : "Copy code"}
            </span>
          </Button>
        )}
      </div>
    </div>
  )
}

// Inline code component
interface InlineCodeProps {
  children: React.ReactNode
  className?: string
}

export function InlineCode({ children, className }: InlineCodeProps) {
  return (
    <code
      className={cn(
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-medium text-foreground",
        className
      )}
    >
      {children}
    </code>
  )
}

// Pre-formatted code block wrapper for MDX
interface PreProps {
  children: React.ReactElement
  title?: string
  showLineNumbers?: boolean
  highlightLines?: number[]
}

export function Pre({ children, title, showLineNumbers, highlightLines }: PreProps) {
  const codeElement = React.Children.only(children)
  
  if (codeElement.type !== "code") {
    return <pre>{children}</pre>
  }

  const { className, children: code } = codeElement.props
  const language = className?.replace(/language-/, "") || "text"

  return (
    <CodeBlock
      language={language}
      title={title}
      showLineNumbers={showLineNumbers}
      highlightLines={highlightLines}
    >
      {code}
    </CodeBlock>
  )
}