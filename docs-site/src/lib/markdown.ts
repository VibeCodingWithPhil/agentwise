import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { TableOfContentsItem } from '@/types/api'

export interface DocMatter {
  title?: string
  description?: string
  date?: string
  tags?: string[]
  category?: string
  order?: number
  slug?: string
  readingTime?: number
}

export interface DocPage {
  slug: string
  content: string
  data: DocMatter
  excerpt?: string
  tableOfContents?: TableOfContentsItem[]
  lastModified?: string
  wordCount?: number
}

// Path to the original docs folder
const DOCS_PATH = path.join(process.cwd(), '..', 'docs')

export async function getDocContent(filename: string): Promise<DocPage | null> {
  try {
    const filePath = path.join(DOCS_PATH, `${filename}.md`)
    
    if (!fs.existsSync(filePath)) {
      return null
    }

    const fileContents = fs.readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContents)
    
    // Generate excerpt from first paragraph
    const excerpt = content
      .split('\\n\\n')[0]
      .replace(/[#*`]/g, '')
      .substring(0, 160)
      .trim() + '...'

    // Get file stats for last modified
    const stats = fs.statSync(filePath)
    
    // Generate table of contents
    const tableOfContents = generateTableOfContents(content)
    
    // Calculate word count
    const wordCount = content.trim().split(/\s+/).length
    
    // Calculate reading time
    const readingTime = Math.ceil(wordCount / 200) // 200 words per minute
    
    // Enhanced data with additional metadata
    const enhancedData: DocMatter = {
      ...data as DocMatter,
      slug: filename,
      readingTime
    }

    return {
      slug: filename,
      content: processMarkdown(content),
      data: enhancedData,
      excerpt,
      tableOfContents,
      lastModified: stats.mtime.toISOString(),
      wordCount
    }
  } catch (error) {
    console.error(`Error reading ${filename}.md:`, error)
    return null
  }
}

export async function getAllDocs(): Promise<DocPage[]> {
  try {
    if (!fs.existsSync(DOCS_PATH)) {
      console.warn(`Docs path does not exist: ${DOCS_PATH}`)
      return []
    }

    const files = fs.readdirSync(DOCS_PATH)
    const markdownFiles = files.filter(file => file.endsWith('.md'))

    const docs = await Promise.all(
      markdownFiles.map(async (file) => {
        const slug = file.replace(/\\.md$/, '')
        return await getDocContent(slug)
      })
    )

    return docs.filter((doc): doc is DocPage => doc !== null)
  } catch (error) {
    console.error('Error getting all docs:', error)
    return []
  }
}

export async function getDocBySlug(slug: string): Promise<DocPage | null> {
  return await getDocContent(slug)
}

export function getReadingTime(content: string): number {
  const wordsPerMinute = 200
  const words = content.trim().split(/\s+/).length
  return Math.ceil(words / wordsPerMinute)
}

// Process markdown content for better display
export function processMarkdown(content: string): string {
  // Convert relative links to absolute paths
  content = content.replace(
    /\[([^\]]+)\]\((?!http)([^)]+)\)/g,
    '[$1](/docs/$2)'
  )
  
  // Enhance code blocks
  content = content.replace(
    /```([\w]*)\n([\s\S]*?)```/g,
    (match, language, code) => {
      return `\`\`\`${language || 'text'}
${code.trim()}
\`\`\``
    }
  )
  
  return content
}

// Command data structure
export interface Command {
  name: string
  syntax: string
  description: string
  examples: Array<{
    command: string
    description: string
  }>
  options?: Array<{
    flag: string
    description: string
  }>
  category: string
}

// Mock command data - in a real implementation, this would come from the actual command definitions
export const commands: Command[] = [
  {
    name: "/create",
    syntax: "/create \"<project description>\"",
    description: "Creates a new project with AI agent orchestration. The system analyzes your description and assigns appropriate specialized agents to handle different aspects of development.",
    category: "Core Commands",
    examples: [
      {
        command: '/create "a todo app with React and Firebase"',
        description: "Creates a React-based todo application with Firebase backend"
      },
      {
        command: '/create "an e-commerce platform with Next.js and Stripe"',
        description: "Generates a full e-commerce solution with payment processing"
      },
      {
        command: '/create "a blog using WordPress and custom theme"',
        description: "Sets up a WordPress blog with custom theme development"
      }
    ]
  },
  {
    name: "/task",
    syntax: "/task \"<feature description>\"",
    description: "Adds a new feature or task to your active project. Agents will analyze the current codebase and implement the requested functionality.",
    category: "Core Commands",
    examples: [
      {
        command: '/task "add user authentication with OAuth"',
        description: "Implements OAuth-based user authentication system"
      },
      {
        command: '/task "create a responsive navigation menu"',
        description: "Adds a mobile-friendly navigation component"
      },
      {
        command: '/task "integrate payment processing with Stripe"',
        description: "Adds Stripe payment integration to the project"
      }
    ]
  },
  {
    name: "/monitor",
    syntax: "/monitor",
    description: "Opens the real-time monitoring dashboard where you can track agent progress, view performance metrics, and monitor task completion status.",
    category: "Monitoring",
    examples: [
      {
        command: "/monitor",
        description: "Opens dashboard at http://localhost:3001"
      }
    ]
  },
  {
    name: "/projects",
    syntax: "/projects",
    description: "Lists all your projects and allows you to switch between them. Shows project status, creation date, and agent activity.",
    category: "Project Management",
    examples: [
      {
        command: "/projects",
        description: "Shows all projects with selection menu"
      }
    ]
  },
  {
    name: "/figma",
    syntax: "/figma <figma-url>",
    description: "Integrates with Figma designs by processing design files and generating corresponding code with high fidelity to the original design.",
    category: "Integrations",
    examples: [
      {
        command: "/figma https://figma.com/file/abc123/My-Design",
        description: "Processes Figma design and generates components"
      }
    ]
  },
  {
    name: "/upload",
    syntax: "/upload",
    description: "Upload and process documents (PDFs, Word docs, images) to incorporate their content into your project context.",
    category: "Content Processing",
    examples: [
      {
        command: "/upload",
        description: "Opens file picker to select documents for processing"
      }
    ]
  },
  {
    name: "/init-import",
    syntax: "/init-import",
    description: "Initializes the import process for existing projects. Analyzes the current directory and prepares it for agent-based development.",
    category: "Import/Export",
    examples: [
      {
        command: "/init-import",
        description: "Scans current directory and prepares import configuration"
      }
    ]
  },
  {
    name: "/task-import",
    syntax: "/task-import",
    description: "Executes the import process with specialized agents. Should be run after /init-import to actually import and process the existing project.",
    category: "Import/Export",
    examples: [
      {
        command: "/task-import",
        description: "Imports existing project with full agent orchestration"
      }
    ]
  },
  {
    name: "/generate-agent",
    syntax: "/generate-agent \"<agent specification>\"",
    description: "Creates a custom specialized agent based on your requirements. The new agent can be reused across projects.",
    category: "Advanced",
    examples: [
      {
        command: '/generate-agent "SEO optimization specialist"',
        description: "Creates an agent specialized in SEO optimization tasks"
      },
      {
        command: '/generate-agent "API documentation generator"',
        description: "Creates an agent that generates comprehensive API docs"
      }
    ]
  },
  {
    name: "/resume",
    syntax: "/resume",
    description: "Resumes agent work after a system restart or interruption. Agents will continue from where they left off.",
    category: "Utilities",
    examples: [
      {
        command: "/resume",
        description: "Continues interrupted agent tasks"
      }
    ]
  }
]

// Generate table of contents from markdown headers
export function generateTableOfContents(content: string): TableOfContentsItem[] {
  const headings = content.match(/^#{1,6}\s+.+$/gm)
  if (!headings) return []

  const toc: TableOfContentsItem[] = []
  const stack: TableOfContentsItem[] = []

  headings.forEach((heading, index) => {
    const level = heading.match(/^#+/)?.[0]?.length || 1
    const title = heading.replace(/^#+\s+/, '').trim()
    const id = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50)

    const item: TableOfContentsItem = {
      id: `${id}-${index}`,
      title,
      level,
      children: []
    }

    // Find the correct parent
    while (stack.length > 0 && stack[stack.length - 1].level >= level) {
      stack.pop()
    }

    if (stack.length === 0) {
      // Top level item
      toc.push(item)
    } else {
      // Child item
      const parent = stack[stack.length - 1]
      if (!parent.children) parent.children = []
      parent.children.push(item)
    }

    stack.push(item)
  })

  return toc
}

// Enhanced markdown processing with additional features
export function enhancedProcessMarkdown(content: string): string {
  let processed = processMarkdown(content)
  
  // Add heading anchors
  processed = processed.replace(
    /^(#{1,6})\s+(.+)$/gm,
    (match, hashes, title) => {
      const level = hashes.length
      const id = title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50)
      
      return `${hashes} ${title} {#${id}}`
    }
  )

  // Enhance tables with responsive wrapper
  processed = processed.replace(
    /(\|.+\|[\s\S]*?\|.+\|)/g,
    '<div class="overflow-x-auto"><table>$1</table></div>'
  )

  // Add copy buttons to code blocks
  processed = processed.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    (match, language, code) => {
      const lang = language || 'text'
      return `\`\`\`${lang}
${code.trim()}
\`\`\``
    }
  )

  // Process mermaid diagrams
  processed = processed.replace(
    /```mermaid\n([\s\S]*?)```/g,
    '<div class="mermaid">$1</div>'
  )

  // Add warning/info/tip callouts
  processed = processed.replace(
    /^>\s*\*\*(Warning|Info|Tip|Note):\*\*\s*(.+)$/gm,
    '<div class="callout callout-$1"><strong>$1:</strong> $2</div>'
  )

  return processed
}

// Extract frontmatter and content separately
export function parseFrontmatter(content: string): { data: DocMatter; content: string } {
  const { data, content: markdownContent } = matter(content)
  return {
    data: data as DocMatter,
    content: markdownContent
  }
}

// Generate document breadcrumbs
export function generateBreadcrumbs(slug: string, docs: DocPage[]): Array<{ title: string; href: string }> {
  const breadcrumbs = [{ title: 'Documentation', href: '/docs' }]
  
  const doc = docs.find(d => d.slug === slug)
  if (!doc) return breadcrumbs

  // If the document has a category, add it as a breadcrumb
  if (doc.data.category && doc.data.category !== 'General') {
    breadcrumbs.push({
      title: doc.data.category,
      href: `/docs/category/${doc.data.category.toLowerCase().replace(/\s+/g, '-')}`
    })
  }

  // Add current document
  breadcrumbs.push({
    title: doc.data.title || doc.slug,
    href: `/docs/${doc.slug}`
  })

  return breadcrumbs
}

// Get related documents based on tags and category
export function getRelatedDocs(currentDoc: DocPage, allDocs: DocPage[], limit: number = 5): DocPage[] {
  const related = allDocs
    .filter(doc => doc.slug !== currentDoc.slug)
    .map(doc => {
      let score = 0
      
      // Same category gets higher score
      if (doc.data.category === currentDoc.data.category) {
        score += 3
      }
      
      // Shared tags
      const sharedTags = (doc.data.tags || []).filter(tag => 
        (currentDoc.data.tags || []).includes(tag)
      )
      score += sharedTags.length * 2
      
      return { doc, score }
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.doc)

  return related
}

// Validate document structure
export function validateDocStructure(doc: DocPage): string[] {
  const issues: string[] = []
  
  if (!doc.data.title) {
    issues.push('Missing title in frontmatter')
  }
  
  if (!doc.data.description) {
    issues.push('Missing description in frontmatter')
  }
  
  if (doc.content.length < 100) {
    issues.push('Content is very short (less than 100 characters)')
  }
  
  if (!doc.content.match(/^#{1,6}/m)) {
    issues.push('No headings found in content')
  }
  
  // Check for broken links (basic check for markdown links)
  const links = doc.content.match(/\[([^\]]+)\]\(([^)]+)\)/g)
  if (links) {
    links.forEach(link => {
      const url = link.match(/\]\(([^)]+)\)/)?.[1]
      if (url && url.startsWith('./') && !url.includes('.md')) {
        issues.push(`Potentially broken relative link: ${url}`)
      }
    })
  }
  
  return issues
}

// Search within document content
export function searchInDocument(doc: DocPage, query: string): Array<{ line: number; content: string; context: string }> {
  const lines = doc.content.split('\n')
  const results: Array<{ line: number; content: string; context: string }> = []
  const searchTerm = query.toLowerCase()
  
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(searchTerm)) {
      // Get context (previous and next lines)
      const start = Math.max(0, index - 1)
      const end = Math.min(lines.length, index + 2)
      const context = lines.slice(start, end).join('\n')
      
      results.push({
        line: index + 1,
        content: line,
        context
      })
    }
  })
  
  return results
}