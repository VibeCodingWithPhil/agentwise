import { Agent, MCPServer, PerformanceMetrics } from '@/types/api'

// Mock data for agents - in production this would come from a database or external service
export const agents: Agent[] = [
  {
    id: 'frontend-specialist',
    name: 'Frontend Specialist',
    description: 'Specialized in React, Vue, Angular, and modern frontend technologies. Handles UI/UX implementation, component architecture, and responsive design.',
    capabilities: [
      'React/Vue/Angular development',
      'Responsive design implementation',
      'Component architecture',
      'State management (Redux, Vuex, Zustand)',
      'CSS frameworks (Tailwind, Bootstrap)',
      'Frontend testing (Jest, Cypress)',
      'Performance optimization',
      'Accessibility compliance'
    ],
    category: 'Development',
    version: '2.1.0',
    status: 'active',
    tags: ['react', 'vue', 'angular', 'frontend', 'ui', 'ux'],
    documentation: '/docs/agents/frontend-specialist',
    examples: [
      {
        title: 'React Component Creation',
        description: 'Create reusable React components with TypeScript',
        usage: '/task "create a responsive navigation component with dark mode support"'
      },
      {
        title: 'State Management Setup',
        description: 'Set up Redux or Zustand for state management',
        usage: '/task "implement global state management for user authentication"'
      }
    ],
    dependencies: ['node', 'npm'],
    requirements: {
      memory: '512MB',
      cpu: '1 core',
      disk: '100MB'
    },
    lastUpdated: '2024-08-15T10:00:00Z',
    downloadCount: 15420,
    rating: 4.8
  },
  {
    id: 'backend-specialist',
    name: 'Backend Specialist',
    description: 'Expert in server-side development, API design, database management, and cloud services. Handles scalable backend architecture.',
    capabilities: [
      'REST/GraphQL API development',
      'Database design and optimization',
      'Authentication and authorization',
      'Message queues and caching',
      'Microservices architecture',
      'Cloud deployment (AWS, Azure, GCP)',
      'Performance monitoring',
      'Security implementation'
    ],
    category: 'Development',
    version: '2.0.5',
    status: 'active',
    tags: ['backend', 'api', 'database', 'cloud', 'security'],
    documentation: '/docs/agents/backend-specialist',
    examples: [
      {
        title: 'API Development',
        description: 'Create RESTful APIs with authentication',
        usage: '/task "create user management API with JWT authentication"'
      },
      {
        title: 'Database Setup',
        description: 'Design and implement database schemas',
        usage: '/task "design database schema for e-commerce platform"'
      }
    ],
    dependencies: ['docker', 'database'],
    requirements: {
      memory: '1GB',
      cpu: '2 cores',
      disk: '500MB'
    },
    lastUpdated: '2024-08-10T14:30:00Z',
    downloadCount: 12890,
    rating: 4.7
  },
  {
    id: 'devops-specialist',
    name: 'DevOps Specialist',
    description: 'Focuses on deployment, CI/CD pipelines, infrastructure as code, monitoring, and automation for reliable software delivery.',
    capabilities: [
      'CI/CD pipeline setup',
      'Docker containerization',
      'Kubernetes orchestration',
      'Infrastructure as Code (Terraform)',
      'Monitoring and logging',
      'Automated testing',
      'Performance optimization',
      'Security scanning'
    ],
    category: 'Operations',
    version: '1.9.2',
    status: 'active',
    tags: ['devops', 'cicd', 'docker', 'kubernetes', 'terraform'],
    documentation: '/docs/agents/devops-specialist',
    examples: [
      {
        title: 'CI/CD Pipeline',
        description: 'Set up automated deployment pipeline',
        usage: '/task "create GitHub Actions workflow for automated testing and deployment"'
      },
      {
        title: 'Infrastructure Setup',
        description: 'Deploy infrastructure using Terraform',
        usage: '/task "create AWS infrastructure for scalable web application"'
      }
    ],
    dependencies: ['docker', 'kubectl', 'terraform'],
    requirements: {
      memory: '2GB',
      cpu: '2 cores',
      disk: '1GB'
    },
    lastUpdated: '2024-08-12T09:15:00Z',
    downloadCount: 8760,
    rating: 4.6
  },
  {
    id: 'mobile-specialist',
    name: 'Mobile Specialist',
    description: 'Expert in mobile app development for iOS and Android platforms using React Native, Flutter, and native technologies.',
    capabilities: [
      'React Native development',
      'Flutter development',
      'Native iOS (Swift)',
      'Native Android (Kotlin/Java)',
      'Mobile UI/UX patterns',
      'App store deployment',
      'Push notifications',
      'Offline functionality'
    ],
    category: 'Development',
    version: '1.8.0',
    status: 'active',
    tags: ['mobile', 'react-native', 'flutter', 'ios', 'android'],
    documentation: '/docs/agents/mobile-specialist',
    examples: [
      {
        title: 'Cross-platform App',
        description: 'Create mobile app with React Native',
        usage: '/task "develop cross-platform mobile app with offline support"'
      }
    ],
    dependencies: ['expo', 'android-studio', 'xcode'],
    requirements: {
      memory: '4GB',
      cpu: '4 cores',
      disk: '2GB'
    },
    lastUpdated: '2024-08-08T16:45:00Z',
    downloadCount: 6540,
    rating: 4.5
  },
  {
    id: 'data-specialist',
    name: 'Data Specialist',
    description: 'Specializes in data analysis, machine learning, ETL processes, and building data-driven applications and insights.',
    capabilities: [
      'Data analysis and visualization',
      'Machine learning models',
      'ETL pipeline development',
      'Database optimization',
      'Statistical analysis',
      'Data cleaning and preprocessing',
      'Business intelligence dashboards',
      'Big data processing'
    ],
    category: 'Data & Analytics',
    version: '2.2.1',
    status: 'active',
    tags: ['data', 'ml', 'analytics', 'python', 'sql'],
    documentation: '/docs/agents/data-specialist',
    examples: [
      {
        title: 'Data Pipeline',
        description: 'Create automated data processing pipeline',
        usage: '/task "build ETL pipeline for customer analytics"'
      }
    ],
    dependencies: ['python', 'jupyter', 'pandas'],
    requirements: {
      memory: '8GB',
      cpu: '4 cores',
      disk: '5GB'
    },
    lastUpdated: '2024-08-14T11:20:00Z',
    downloadCount: 4320,
    rating: 4.9
  }
]

// Mock data for MCP servers
export const mcpServers: MCPServer[] = [
  {
    id: 'filesystem-mcp',
    name: 'Filesystem MCP',
    description: 'Provides secure file system access with read/write operations, directory traversal, and file monitoring capabilities.',
    version: '1.2.0',
    status: 'active',
    url: 'mcp://filesystem',
    capabilities: [
      {
        name: 'read_file',
        description: 'Read file contents with permission checking',
        type: 'tool'
      },
      {
        name: 'write_file',
        description: 'Write data to files with backup creation',
        type: 'tool'
      },
      {
        name: 'list_directory',
        description: 'List directory contents with metadata',
        type: 'tool'
      },
      {
        name: 'watch_file',
        description: 'Monitor file changes in real-time',
        type: 'resource'
      }
    ],
    configuration: {
      maxFileSize: '10MB',
      allowedExtensions: ['txt', 'md', 'json', 'yaml', 'js', 'ts', 'py'],
      watchEnabled: true
    },
    healthCheck: {
      lastCheck: '2024-08-21T10:00:00Z',
      status: 'healthy',
      responseTime: 45
    },
    metrics: {
      requests: 15420,
      errors: 12,
      averageResponseTime: 38
    },
    documentation: '/docs/mcp/filesystem',
    examples: [
      {
        title: 'Read Configuration',
        description: 'Read a JSON configuration file',
        request: '{"tool": "read_file", "arguments": {"path": "./config.json"}}',
        response: '{"content": "{\\"setting\\": \\"value\\"}", "size": 20, "modified": "2024-08-21T09:00:00Z"}'
      }
    ]
  },
  {
    id: 'database-mcp',
    name: 'Database MCP',
    description: 'Database connectivity and query execution for multiple database types with connection pooling and query optimization.',
    version: '2.1.3',
    status: 'active',
    url: 'mcp://database',
    capabilities: [
      {
        name: 'execute_query',
        description: 'Execute SQL queries with parameter binding',
        type: 'tool'
      },
      {
        name: 'get_schema',
        description: 'Retrieve database schema information',
        type: 'tool'
      },
      {
        name: 'manage_connections',
        description: 'Connection pool management and health monitoring',
        type: 'resource'
      }
    ],
    configuration: {
      supportedDatabases: ['PostgreSQL', 'MySQL', 'SQLite', 'MongoDB'],
      maxConnections: 100,
      queryTimeout: 30000
    },
    healthCheck: {
      lastCheck: '2024-08-21T10:00:00Z',
      status: 'healthy',
      responseTime: 120
    },
    metrics: {
      requests: 8950,
      errors: 45,
      averageResponseTime: 95
    },
    documentation: '/docs/mcp/database'
  },
  {
    id: 'web-scraping-mcp',
    name: 'Web Scraping MCP',
    description: 'Web content extraction and scraping with respect for robots.txt, rate limiting, and data processing.',
    version: '1.5.2',
    status: 'active',
    url: 'mcp://web-scraper',
    capabilities: [
      {
        name: 'fetch_page',
        description: 'Fetch and parse web pages with metadata',
        type: 'tool'
      },
      {
        name: 'extract_data',
        description: 'Extract structured data using selectors',
        type: 'tool'
      },
      {
        name: 'monitor_changes',
        description: 'Track changes to web pages over time',
        type: 'resource'
      }
    ],
    healthCheck: {
      lastCheck: '2024-08-21T10:00:00Z',
      status: 'healthy',
      responseTime: 890
    },
    metrics: {
      requests: 3420,
      errors: 89,
      averageResponseTime: 1250
    },
    documentation: '/docs/mcp/web-scraping'
  },
  {
    id: 'git-mcp',
    name: 'Git MCP',
    description: 'Git repository management with branch operations, commit history, and collaboration features.',
    version: '1.8.0',
    status: 'active',
    url: 'mcp://git',
    capabilities: [
      {
        name: 'git_operations',
        description: 'Perform git commands safely with validation',
        type: 'tool'
      },
      {
        name: 'branch_management',
        description: 'Create, merge, and manage git branches',
        type: 'tool'
      },
      {
        name: 'repository_status',
        description: 'Monitor repository state and changes',
        type: 'resource'
      }
    ],
    healthCheck: {
      lastCheck: '2024-08-21T10:00:00Z',
      status: 'healthy',
      responseTime: 65
    },
    metrics: {
      requests: 12080,
      errors: 23,
      averageResponseTime: 78
    },
    documentation: '/docs/mcp/git'
  },
  {
    id: 'email-mcp',
    name: 'Email MCP',
    description: 'Email sending and receiving with template support, attachment handling, and delivery tracking.',
    version: '1.3.5',
    status: 'inactive',
    url: 'mcp://email',
    capabilities: [
      {
        name: 'send_email',
        description: 'Send emails with templates and attachments',
        type: 'tool'
      },
      {
        name: 'email_templates',
        description: 'Manage and render email templates',
        type: 'resource'
      }
    ],
    healthCheck: {
      lastCheck: '2024-08-20T15:30:00Z',
      status: 'unhealthy',
      responseTime: 5000
    },
    metrics: {
      requests: 890,
      errors: 45,
      averageResponseTime: 2100
    },
    documentation: '/docs/mcp/email'
  }
]

// Mock performance metrics
export function generateMockMetrics(): PerformanceMetrics {
  const now = new Date()
  
  return {
    system: {
      cpu: {
        usage: Math.random() * 80 + 10, // 10-90%
        cores: 8,
        model: 'Intel Core i7-12700K'
      },
      memory: {
        total: 32 * 1024 * 1024 * 1024, // 32GB
        used: Math.random() * 16 * 1024 * 1024 * 1024 + 8 * 1024 * 1024 * 1024, // 8-24GB
        free: 0, // Will be calculated
        percentage: 0 // Will be calculated
      },
      disk: {
        total: 1024 * 1024 * 1024 * 1024, // 1TB
        used: Math.random() * 512 * 1024 * 1024 * 1024 + 256 * 1024 * 1024 * 1024, // 256-768GB
        free: 0, // Will be calculated
        percentage: 0 // Will be calculated
      }
    },
    api: {
      requests: {
        total: Math.floor(Math.random() * 100000 + 50000),
        perMinute: Math.floor(Math.random() * 100 + 20),
        perHour: Math.floor(Math.random() * 5000 + 1000),
        errors: Math.floor(Math.random() * 50 + 5),
        averageResponseTime: Math.random() * 200 + 50
      },
      endpoints: [
        {
          path: '/api/docs',
          method: 'GET',
          requests: Math.floor(Math.random() * 10000 + 5000),
          averageResponseTime: Math.random() * 100 + 30,
          errors: Math.floor(Math.random() * 10)
        },
        {
          path: '/api/search',
          method: 'GET',
          requests: Math.floor(Math.random() * 5000 + 2000),
          averageResponseTime: Math.random() * 300 + 100,
          errors: Math.floor(Math.random() * 20)
        },
        {
          path: '/api/commands',
          method: 'GET',
          requests: Math.floor(Math.random() * 3000 + 1000),
          averageResponseTime: Math.random() * 80 + 20,
          errors: Math.floor(Math.random() * 5)
        }
      ]
    },
    agents: {
      active: Math.floor(Math.random() * 10 + 5),
      total: agents.length,
      averageExecutionTime: Math.random() * 5000 + 1000,
      successRate: Math.random() * 10 + 90
    },
    cache: {
      hits: Math.floor(Math.random() * 10000 + 5000),
      misses: Math.floor(Math.random() * 2000 + 500),
      hitRate: Math.random() * 20 + 75,
      size: Math.floor(Math.random() * 100 + 50) * 1024 * 1024 // MB
    },
    uptime: Math.random() * 30 + 70, // 70-100 days
    timestamp: now.toISOString()
  }
}

// Calculate derived metrics
export function enhanceMetrics(metrics: PerformanceMetrics): PerformanceMetrics {
  // Calculate memory percentages
  metrics.system.memory.free = metrics.system.memory.total - metrics.system.memory.used
  metrics.system.memory.percentage = (metrics.system.memory.used / metrics.system.memory.total) * 100

  // Calculate disk percentages
  metrics.system.disk.free = metrics.system.disk.total - metrics.system.disk.used
  metrics.system.disk.percentage = (metrics.system.disk.used / metrics.system.disk.total) * 100

  return metrics
}

// Get filtered agents
export function getAgentsByCategory(category?: string): Agent[] {
  if (!category) return agents
  return agents.filter(agent => agent.category.toLowerCase() === category.toLowerCase())
}

export function getAgentsByStatus(status?: Agent['status']): Agent[] {
  if (!status) return agents
  return agents.filter(agent => agent.status === status)
}

export function searchAgents(query: string): Agent[] {
  const searchTerm = query.toLowerCase()
  return agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm) ||
    agent.description.toLowerCase().includes(searchTerm) ||
    agent.capabilities.some(cap => cap.toLowerCase().includes(searchTerm)) ||
    agent.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  )
}

// Get filtered MCP servers
export function getMCPServersByStatus(status?: MCPServer['status']): MCPServer[] {
  if (!status) return mcpServers
  return mcpServers.filter(server => server.status === status)
}

export function searchMCPServers(query: string): MCPServer[] {
  const searchTerm = query.toLowerCase()
  return mcpServers.filter(server =>
    server.name.toLowerCase().includes(searchTerm) ||
    server.description.toLowerCase().includes(searchTerm) ||
    server.capabilities.some(cap => 
      cap.name.toLowerCase().includes(searchTerm) ||
      cap.description.toLowerCase().includes(searchTerm)
    )
  )
}