import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { TableOfContentsItem, Command } from '@/types/api'

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


// Mock command data - in a real implementation, this would come from the actual command definitions
export const commands: Command[] = [
  // Project Creation & Management (11 commands)
  {
    name: "/create",
    syntax: "/create \"<project description>\"",
    description: "Creates a new project with AI agent orchestration. The system analyzes your description and assigns appropriate specialized agents to handle different aspects of development.",
    category: "Project Management",
    tags: ["core", "project", "creation"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/create "a todo app with React and Firebase"',
        description: "Creates a React-based todo application with Firebase backend"
      },
      {
        command: '/create "an e-commerce platform with Next.js and Stripe"',
        description: "Generates a full e-commerce solution with payment processing"
      }
    ]
  },
  {
    name: "/create-plan",
    syntax: "/create-plan \"<project idea>\"",
    description: "Collaborative planning mode with project folder setup for comprehensive project planning.",
    category: "Project Management",
    tags: ["planning", "collaboration"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/create-plan "social media dashboard"',
        description: "Creates a collaborative planning session for a social media dashboard"
      }
    ]
  },
  {
    name: "/create-project",
    syntax: "/create-project \"<project idea>\"",
    description: "Complete project setup wizard with all features including database, security, and deployment configuration.",
    category: "Project Management",
    tags: ["wizard", "complete-setup"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/create-project "e-commerce platform"',
        description: "Launches complete project wizard for e-commerce platform"
      }
    ]
  },
  {
    name: "/projects",
    syntax: "/projects",
    description: "Lists all your projects and allows you to switch between them. Shows project status, creation date, and agent activity.",
    category: "Project Management",
    tags: ["management", "switching"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/projects",
        description: "Shows all projects with selection menu"
      }
    ]
  },
  {
    name: "/project-status",
    syntax: "/project-status",
    description: "View current project status and progress including active agents, task completion, and health metrics.",
    category: "Project Management",
    tags: ["status", "monitoring"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/project-status",
        description: "Shows current project status and agent activity"
      }
    ]
  },
  {
    name: "/task",
    syntax: "/task \"<feature description>\"",
    description: "Adds a new feature or task to your active project. Agents will analyze the current codebase and implement the requested functionality.",
    category: "Project Management",
    tags: ["task", "feature"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/task "add user authentication with OAuth"',
        description: "Implements OAuth-based user authentication system"
      },
      {
        command: '/task "create a responsive navigation menu"',
        description: "Adds a mobile-friendly navigation component"
      }
    ]
  },
  {
    name: "/task-dynamic",
    syntax: "/task-dynamic \"<feature description>\"",
    description: "Dynamic task distribution to agents with intelligent load balancing and specialization matching.",
    category: "Project Management",
    tags: ["dynamic", "distribution"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/task-dynamic "implement payment system"',
        description: "Dynamically distributes payment implementation across specialized agents"
      }
    ]
  },
  {
    name: "/task-plan",
    syntax: "/task-plan \"<feature description>\"",
    description: "Plan tasks before execution with comprehensive analysis and resource estimation.",
    category: "Project Management",
    tags: ["planning", "analysis"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/task-plan "user dashboard with analytics"',
        description: "Creates detailed plan for dashboard implementation"
      }
    ]
  },
  {
    name: "/task-import",
    syntax: "/task-import \"<source>\"",
    description: "Import tasks from external sources like GitHub issues, Trello boards, or Jira tickets.",
    category: "Project Management",
    tags: ["import", "external"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/task-import "https://github.com/user/repo/issues"',
        description: "Imports GitHub issues as tasks"
      }
    ]
  },
  {
    name: "/init-import",
    syntax: "/init-import",
    description: "Initializes the import process for existing projects. Analyzes the current directory and prepares it for agent-based development.",
    category: "Project Management",
    tags: ["import", "initialization"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/init-import",
        description: "Scans current directory and prepares import configuration"
      }
    ]
  },
  {
    name: "/clone-website",
    syntax: "/clone-website \"<url>\"",
    description: "Clone and customize existing websites with intelligent analysis and recreation.",
    category: "Project Management",
    tags: ["clone", "website"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/clone-website "https://example.com"',
        description: "Clones and analyzes website for customization"
      }
    ]
  },

  // Requirements & Planning (4 commands)
  {
    name: "/requirements",
    syntax: "/requirements \"<project idea>\"",
    description: "Generate comprehensive project requirements with functional and technical specifications.",
    category: "Requirements & Planning",
    tags: ["requirements", "planning"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/requirements "mobile banking app"',
        description: "Generates comprehensive requirements for mobile banking app"
      }
    ]
  },
  {
    name: "/requirements-enhance",
    syntax: "/requirements-enhance",
    description: "Enhance existing requirements with AI-driven analysis and additional specifications.",
    category: "Requirements & Planning",
    tags: ["enhancement", "analysis"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/requirements-enhance",
        description: "Enhances current project requirements with AI analysis"
      }
    ]
  },
  {
    name: "/requirements-visualize",
    syntax: "/requirements-visualize",
    description: "Create visual HTML specifications with diagrams, wireframes, and interactive mockups.",
    category: "Requirements & Planning",
    tags: ["visualization", "mockups"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/requirements-visualize",
        description: "Creates visual specification document with mockups"
      }
    ]
  },
  {
    name: "/requirements-to-tasks",
    syntax: "/requirements-to-tasks",
    description: "Convert requirements into actionable tasks with priority and dependency mapping.",
    category: "Requirements & Planning",
    tags: ["conversion", "tasks"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/requirements-to-tasks",
        description: "Converts requirements into prioritized task list"
      }
    ]
  },

  // Database Integration (3 commands)
  {
    name: "/database-wizard",
    syntax: "/database-wizard",
    description: "Interactive database setup wizard with schema design and optimization recommendations.",
    category: "Database Integration",
    tags: ["database", "wizard"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/database-wizard",
        description: "Launches interactive database setup wizard"
      }
    ]
  },
  {
    name: "/database-setup",
    syntax: "/database-setup \"<database-type>\"",
    description: "Quick database configuration for common database systems.",
    category: "Database Integration",
    tags: ["setup", "configuration"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/database-setup "postgresql"',
        description: "Configures PostgreSQL database for current project"
      }
    ]
  },
  {
    name: "/database-connect",
    syntax: "/database-connect \"<connection-string>\"",
    description: "Connect to existing database with automatic schema analysis and integration.",
    category: "Database Integration",
    tags: ["connection", "existing"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/database-connect "postgresql://user:pass@host:5432/db"',
        description: "Connects to existing PostgreSQL database"
      }
    ]
  },

  // Security & Protection (5 commands)
  {
    name: "/enable-protection",
    syntax: "/enable-protection",
    description: "Enable automated backup and security scanning for comprehensive project protection.",
    category: "Security & Protection",
    tags: ["security", "protection"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/enable-protection",
        description: "Enables automated protection for current project"
      }
    ]
  },
  {
    name: "/protection-status",
    syntax: "/protection-status",
    description: "View real-time protection status including backups, security scans, and system health.",
    category: "Security & Protection",
    tags: ["status", "monitoring"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/protection-status",
        description: "Shows detailed protection status and metrics"
      }
    ]
  },
  {
    name: "/security-review",
    syntax: "/security-review",
    description: "Comprehensive security analysis including vulnerability scanning and code review.",
    category: "Security & Protection",
    tags: ["security", "review"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/security-review",
        description: "Performs comprehensive security analysis"
      }
    ]
  },
  {
    name: "/security-report",
    syntax: "/security-report",
    description: "Generate detailed security report with recommendations and action items.",
    category: "Security & Protection",
    tags: ["report", "analysis"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/security-report",
        description: "Generates detailed security report"
      }
    ]
  },
  {
    name: "/rollback",
    syntax: "/rollback [backup-id]",
    description: "Rollback to previous safe state with automatic integrity verification.",
    category: "Security & Protection",
    tags: ["rollback", "recovery"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/rollback",
        description: "Rollback to latest backup"
      },
      {
        command: "/rollback backup-123",
        description: "Rollback to specific backup"
      }
    ]
  },

  // Figma Integration (8 commands)
  {
    name: "/figma",
    syntax: "/figma [url]",
    description: "Main Figma integration menu with design processing and code generation capabilities.",
    category: "Figma Integration",
    tags: ["figma", "design"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/figma",
        description: "Opens Figma integration menu"
      },
      {
        command: "/figma https://figma.com/file/abc123",
        description: "Processes specific Figma file"
      }
    ]
  },
  {
    name: "/figma-auth",
    syntax: "/figma-auth",
    description: "Authenticate with Figma account for full API access and collaboration features.",
    category: "Figma Integration",
    tags: ["authentication", "api"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/figma-auth",
        description: "Initiates Figma authentication process"
      }
    ]
  },
  {
    name: "/figma-list",
    syntax: "/figma-list",
    description: "List available Figma files from your account with preview and metadata.",
    category: "Figma Integration",
    tags: ["listing", "files"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/figma-list",
        description: "Shows available Figma files"
      }
    ]
  },
  {
    name: "/figma-select",
    syntax: "/figma-select \"<file-name>\"",
    description: "Select Figma file to work with including frame and component analysis.",
    category: "Figma Integration",
    tags: ["selection", "analysis"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/figma-select "Mobile App Design"',
        description: "Selects and analyzes mobile app design file"
      }
    ]
  },
  {
    name: "/figma-inspect",
    syntax: "/figma-inspect [component-name]",
    description: "Inspect Figma components with detailed design specifications and code suggestions.",
    category: "Figma Integration",
    tags: ["inspection", "components"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/figma-inspect",
        description: "Inspects all components in selected file"
      },
      {
        command: '/figma-inspect "Button Component"',
        description: "Inspects specific button component"
      }
    ]
  },
  {
    name: "/figma-generate",
    syntax: "/figma-generate [options]",
    description: "Generate code from Figma designs with high-fidelity conversion and responsive design.",
    category: "Figma Integration",
    tags: ["generation", "code"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/figma-generate",
        description: "Generates code for all components"
      },
      {
        command: "/figma-generate --responsive",
        description: "Generates responsive code"
      }
    ]
  },
  {
    name: "/figma-sync",
    syntax: "/figma-sync",
    description: "Sync changes with Figma including design updates and component modifications.",
    category: "Figma Integration",
    tags: ["sync", "updates"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/figma-sync",
        description: "Syncs all changes with Figma"
      }
    ]
  },
  {
    name: "/figma-create",
    syntax: "/figma-create \"<component-spec>\"",
    description: "Create new Figma components from code or specifications with automatic design generation.",
    category: "Figma Integration",
    tags: ["creation", "reverse-engineering"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/figma-create "modern button with hover effects"',
        description: "Creates Figma component from specification"
      }
    ]
  },

  // Models & Agent Management (6 commands)
  {
    name: "/generate-agent",
    syntax: "/generate-agent \"<specialization>\"",
    description: "Create custom specialized agents for specific domains with learning capabilities.",
    category: "Models & Agent Management",
    tags: ["agent", "custom"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: '/generate-agent "SEO optimization specialist"',
        description: "Creates an agent specialized in SEO optimization"
      },
      {
        command: '/generate-agent "API documentation generator"',
        description: "Creates an agent for generating API documentation"
      }
    ]
  },
  {
    name: "/setup-ollama",
    syntax: "/setup-ollama",
    description: "Install and configure Ollama for local model execution with GPU optimization.",
    category: "Models & Agent Management",
    tags: ["local", "ollama"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/setup-ollama",
        description: "Installs and configures Ollama"
      }
    ]
  },
  {
    name: "/setup-lmstudio",
    syntax: "/setup-lmstudio",
    description: "Configure LM Studio integration for local model management and execution.",
    category: "Models & Agent Management",
    tags: ["local", "lmstudio"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/setup-lmstudio",
        description: "Configures LM Studio integration"
      }
    ]
  },
  {
    name: "/local-models",
    syntax: "/local-models",
    description: "List available local models with performance metrics and usage statistics.",
    category: "Models & Agent Management",
    tags: ["local", "listing"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/local-models",
        description: "Shows available local models"
      }
    ]
  },
  {
    name: "/configure-routing",
    syntax: "/configure-routing",
    description: "Configure smart model routing with automatic optimization and load balancing.",
    category: "Models & Agent Management",
    tags: ["routing", "optimization"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/configure-routing",
        description: "Opens interactive routing configuration"
      }
    ]
  },
  {
    name: "/setup-mcps",
    syntax: "/setup-mcps",
    description: "Configure all 25 MCP servers for Claude Code with automatic setup and testing.",
    category: "Models & Agent Management",
    tags: ["mcp", "setup"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/setup-mcps",
        description: "Configures all MCP servers"
      }
    ]
  },

  // Monitoring & Analysis (3 commands)
  {
    name: "/monitor",
    syntax: "/monitor",
    description: "Launch real-time monitoring dashboard with agent activity, performance metrics, and system health.",
    category: "Monitoring & Analysis",
    tags: ["monitoring", "dashboard"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/monitor",
        description: "Opens monitoring dashboard at http://localhost:3001"
      }
    ]
  },
  {
    name: "/visual-test",
    syntax: "/visual-test [options]",
    description: "Run visual regression tests with screenshot comparison and automated reporting.",
    category: "Monitoring & Analysis",
    tags: ["testing", "visual"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/visual-test",
        description: "Runs visual regression tests"
      },
      {
        command: "/visual-test --baseline",
        description: "Creates new baseline screenshots"
      }
    ]
  },
  {
    name: "/docs",
    syntax: "/docs [topic]",
    description: "Open local documentation hub with search, examples, and interactive tutorials.",
    category: "Monitoring & Analysis",
    tags: ["documentation", "help"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/docs",
        description: "Opens documentation hub"
      },
      {
        command: '/docs "commands"',
        description: "Opens command reference documentation"
      }
    ]
  },

  // Deployment & Updates (2 commands)
  {
    name: "/deploy",
    syntax: "/deploy [target]",
    description: "Deploy project to production with automated testing, optimization, and rollback capabilities.",
    category: "Deployment & Updates",
    tags: ["deployment", "production"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/deploy",
        description: "Deploys to default production environment"
      },
      {
        command: "/deploy staging",
        description: "Deploys to staging environment"
      }
    ]
  },
  {
    name: "/update-agentwise",
    syntax: "/update-agentwise",
    description: "Update Agentwise to latest version with automatic backup and migration.",
    category: "Deployment & Updates",
    tags: ["update", "maintenance"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/update-agentwise",
        description: "Updates to latest Agentwise version"
      }
    ]
  },

  // Configuration & Tools (3 commands)
  {
    name: "/configure-agentwise",
    syntax: "/configure-agentwise",
    description: "Configure Agentwise settings including API keys, preferences, and optimization parameters.",
    category: "Configuration & Tools",
    tags: ["configuration", "settings"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/configure-agentwise",
        description: "Opens configuration wizard"
      }
    ]
  },
  {
    name: "/upload",
    syntax: "/upload [file-path]",
    description: "Upload and process documents (PDFs, Word docs, images) with OCR and content extraction.",
    category: "Configuration & Tools",
    tags: ["upload", "processing"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/upload",
        description: "Opens file picker for document upload"
      },
      {
        command: "/upload requirements.pdf",
        description: "Uploads and processes specific PDF file"
      }
    ]
  },
  {
    name: "/image",
    syntax: "/image [image-path]",
    description: "Visual context processing with file browser for image analysis and mockup generation.",
    category: "Configuration & Tools",
    tags: ["image", "visual"],
    version: "2.3.0",
    deprecated: false,
    examples: [
      {
        command: "/image",
        description: "Opens image file browser"
      },
      {
        command: "/image mockup.png",
        description: "Processes specific image file"
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