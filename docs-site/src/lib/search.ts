import { SearchResult, SearchQuery, SearchResponse, DocPage, Command, Agent } from '@/types/api'

// Simple search implementation using fuzzy matching
// In production, you might want to use a more sophisticated search engine like Elasticsearch

interface SearchIndex {
  docs: IndexedDoc[]
  commands: IndexedCommand[]
  agents: IndexedAgent[]
}

interface IndexedDoc {
  slug: string
  title: string
  content: string
  category: string
  tags: string[]
  searchableText: string
}

interface IndexedCommand {
  name: string
  description: string
  category: string
  tags: string[]
  searchableText: string
}

interface IndexedAgent {
  id: string
  name: string
  description: string
  category: string
  capabilities: string[]
  tags: string[]
  searchableText: string
}

class SearchEngine {
  private index: SearchIndex = {
    docs: [],
    commands: [],
    agents: []
  }

  // Build search index
  buildIndex(docs: DocPage[], commands: Command[], agents: Agent[]): void {
    console.log('Building search index...')
    
    // Index documents
    this.index.docs = docs.map(doc => ({
      slug: doc.slug,
      title: doc.data.title || doc.slug,
      content: doc.content,
      category: doc.data.category || 'General',
      tags: doc.data.tags || [],
      searchableText: this.createSearchableText([
        doc.data.title || doc.slug,
        doc.data.description || '',
        doc.content,
        doc.data.category || '',
        ...(doc.data.tags || [])
      ])
    }))

    // Index commands
    this.index.commands = commands.map(cmd => ({
      name: cmd.name,
      description: cmd.description,
      category: cmd.category,
      tags: cmd.tags || [],
      searchableText: this.createSearchableText([
        cmd.name,
        cmd.description,
        cmd.syntax,
        cmd.category,
        ...(cmd.tags || []),
        ...cmd.examples.map(ex => `${ex.command} ${ex.description}`)
      ])
    }))

    // Index agents
    this.index.agents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      category: agent.category,
      capabilities: agent.capabilities,
      tags: agent.tags,
      searchableText: this.createSearchableText([
        agent.name,
        agent.description,
        agent.category,
        ...agent.capabilities,
        ...agent.tags
      ])
    }))

    console.log(`Search index built: ${this.index.docs.length} docs, ${this.index.commands.length} commands, ${this.index.agents.length} agents`)
  }

  private createSearchableText(terms: string[]): string {
    return terms
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  // Perform search
  search(query: SearchQuery): SearchResponse {
    const normalizedQuery = this.normalizeQuery(query.query)
    const results: SearchResult[] = []

    if (!normalizedQuery) {
      return {
        results: [],
        total: 0,
        query: query.query,
        facets: {
          categories: [],
          types: []
        }
      }
    }

    // Search documents
    if (!query.type || query.type === 'all' || query.type === 'docs') {
      const docResults = this.searchDocs(normalizedQuery)
      results.push(...docResults)
    }

    // Search commands
    if (!query.type || query.type === 'all' || query.type === 'commands') {
      const commandResults = this.searchCommands(normalizedQuery)
      results.push(...commandResults)
    }

    // Search agents
    if (!query.type || query.type === 'all' || query.type === 'agents') {
      const agentResults = this.searchAgents(normalizedQuery)
      results.push(...agentResults)
    }

    // Sort by score
    results.sort((a, b) => b.score - a.score)

    // Apply pagination
    const offset = query.offset || 0
    const limit = query.limit || 50
    const paginatedResults = results.slice(offset, offset + limit)

    // Generate facets
    const facets = this.generateFacets(results)

    // Generate suggestions
    const suggestions = this.generateSuggestions(normalizedQuery, results.length === 0)

    return {
      results: paginatedResults,
      total: results.length,
      query: query.query,
      suggestions,
      facets
    }
  }

  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
  }

  private searchDocs(query: string): SearchResult[] {
    return this.index.docs
      .map(doc => {
        const score = this.calculateScore(query, doc.searchableText, doc.title)
        if (score === 0) return null

        const highlights = this.extractHighlights(query, doc.content)
        const excerpt = this.generateExcerpt(doc.content, query)

        return {
          type: 'doc' as const,
          title: doc.title,
          slug: doc.slug,
          excerpt,
          category: doc.category,
          score,
          highlights
        }
      })
      .filter((result): result is SearchResult => result !== null)
  }

  private searchCommands(query: string): SearchResult[] {
    return this.index.commands
      .map(cmd => {
        const score = this.calculateScore(query, cmd.searchableText, cmd.name)
        if (score === 0) return null

        const highlights = this.extractHighlights(query, cmd.description)

        return {
          type: 'command' as const,
          title: cmd.name,
          slug: cmd.name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          excerpt: cmd.description,
          category: cmd.category,
          score,
          highlights
        }
      })
      .filter((result): result is SearchResult => result !== null)
  }

  private searchAgents(query: string): SearchResult[] {
    return this.index.agents
      .map(agent => {
        const score = this.calculateScore(query, agent.searchableText, agent.name)
        if (score === 0) return null

        const highlights = this.extractHighlights(query, agent.description)

        return {
          type: 'agent' as const,
          title: agent.name,
          slug: agent.id,
          excerpt: agent.description,
          category: agent.category,
          score,
          highlights
        }
      })
      .filter((result): result is SearchResult => result !== null)
  }

  private calculateScore(query: string, searchableText: string, title: string): number {
    const queryTerms = query.split(' ').filter(term => term.length > 0)
    let score = 0

    for (const term of queryTerms) {
      // Exact match in title gets highest score
      if (title.toLowerCase().includes(term)) {
        score += 10
      }

      // Exact match in content
      if (searchableText.includes(term)) {
        score += 5
      }

      // Fuzzy match (simple implementation)
      const fuzzyMatches = this.findFuzzyMatches(term, searchableText)
      score += fuzzyMatches * 2
    }

    // Boost score for multi-term matches
    const allTermsMatch = queryTerms.every(term => 
      searchableText.includes(term) || title.toLowerCase().includes(term)
    )
    if (allTermsMatch && queryTerms.length > 1) {
      score *= 1.5
    }

    return score
  }

  private findFuzzyMatches(term: string, text: string): number {
    if (term.length < 3) return 0

    let matches = 0
    const words = text.split(' ')

    for (const word of words) {
      if (this.isPartialMatch(term, word)) {
        matches++
      }
    }

    return matches
  }

  private isPartialMatch(term: string, word: string): boolean {
    if (word.length < 3) return false
    
    // Check if term is a substring of word or vice versa
    if (word.includes(term) || term.includes(word)) {
      return true
    }

    // Simple edit distance check for very short terms
    if (term.length <= 4 && word.length <= 6) {
      return this.levenshteinDistance(term, word) <= 1
    }

    return false
  }

  private levenshteinDistance(a: string, b: string): number {
    if (a.length === 0) return b.length
    if (b.length === 0) return a.length

    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null))

    for (let i = 0; i <= a.length; i++) matrix[0][i] = i
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j

    for (let j = 1; j <= b.length; j++) {
      for (let i = 1; i <= a.length; i++) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        )
      }
    }

    return matrix[b.length][a.length]
  }

  private extractHighlights(query: string, text: string): string[] {
    const queryTerms = query.split(' ').filter(term => term.length > 2)
    const highlights: string[] = []
    
    for (const term of queryTerms) {
      const regex = new RegExp(`\\b\\w*${term}\\w*\\b`, 'gi')
      const matches = text.match(regex)
      if (matches) {
        highlights.push(...matches.slice(0, 3)) // Limit to 3 highlights per term
      }
    }

    return [...new Set(highlights)].slice(0, 5) // Remove duplicates and limit total
  }

  private generateExcerpt(content: string, query: string): string {
    const queryTerms = query.split(' ').filter(term => term.length > 2)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    
    // Find sentence with most query terms
    let bestSentence = sentences[0] || ''
    let maxMatches = 0

    for (const sentence of sentences) {
      const matches = queryTerms.filter(term => 
        sentence.toLowerCase().includes(term.toLowerCase())
      ).length

      if (matches > maxMatches) {
        maxMatches = matches
        bestSentence = sentence
      }
    }

    return bestSentence.trim().substring(0, 200) + '...'
  }

  private generateFacets(results: SearchResult[]) {
    const categoryCount = new Map<string, number>()
    const typeCount = new Map<string, number>()

    for (const result of results) {
      // Count categories
      if (result.category) {
        categoryCount.set(result.category, (categoryCount.get(result.category) || 0) + 1)
      }

      // Count types
      typeCount.set(result.type, (typeCount.get(result.type) || 0) + 1)
    }

    return {
      categories: Array.from(categoryCount.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      types: Array.from(typeCount.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
    }
  }

  private generateSuggestions(query: string, noResults: boolean): string[] {
    if (!noResults) return []

    const suggestions: string[] = []
    
    // Common typo corrections (simple implementation)
    const corrections = {
      'creat': 'create',
      'instalation': 'installation',
      'comand': 'command',
      'agnet': 'agent',
      'documantation': 'documentation'
    }

    const words = query.split(' ')
    let hasCorrection = false

    const correctedWords = words.map(word => {
      const correction = corrections[word.toLowerCase()]
      if (correction) {
        hasCorrection = true
        return correction
      }
      return word
    })

    if (hasCorrection) {
      suggestions.push(correctedWords.join(' '))
    }

    // Add some common search suggestions
    if (query.length < 3) {
      suggestions.push('installation', 'commands', 'agents', 'getting started')
    }

    return suggestions.slice(0, 3)
  }
}

// Global search engine instance
let searchEngineInstance: SearchEngine | null = null

export function getSearchEngine(): SearchEngine {
  if (!searchEngineInstance) {
    searchEngineInstance = new SearchEngine()
  }
  return searchEngineInstance
}

export async function initializeSearchIndex(
  docs: DocPage[],
  commands: Command[],
  agents: Agent[]
): Promise<void> {
  const engine = getSearchEngine()
  engine.buildIndex(docs, commands, agents)
}

export async function performSearch(query: SearchQuery): Promise<SearchResponse> {
  const engine = getSearchEngine()
  return engine.search(query)
}