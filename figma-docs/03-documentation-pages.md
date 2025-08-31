# 03 - Documentation Pages

## Documentation Hub Structure

### 1. Documentation Landing Page (`/docs`)
**Design**: Clean sidebar navigation with content area

```jsx
<div className="docs-layout">
  {/* Fixed Sidebar */}
  <aside className="docs-sidebar glass">
    <SearchBar placeholder="Search docs..." />
    
    <nav className="docs-nav">
      <NavSection title="Getting Started">
        <NavItem href="/docs/installation">Installation</NavItem>
        <NavItem href="/docs/quick-start">Quick Start</NavItem>
        <NavItem href="/docs/concepts">Core Concepts</NavItem>
      </NavSection>
      
      <NavSection title="Core Features">
        <NavItem href="/docs/project-wizard">Project Wizard</NavItem>
        <NavItem href="/docs/requirements">Requirements Planning</NavItem>
        <NavItem href="/docs/database">Database Integration</NavItem>
      </NavSection>
      
      <NavSection title="Commands" collapsible>
        {/* 45 commands organized by category */}
      </NavSection>
    </nav>
  </aside>
  
  {/* Main Content */}
  <main className="docs-content">
    <Breadcrumbs />
    <article className="markdown-content">
      {/* Dynamic content */}
    </article>
    <PageNavigation prev={prevPage} next={nextPage} />
  </main>
  
  {/* Table of Contents */}
  <aside className="toc-sidebar">
    <h4>On This Page</h4>
    <TableOfContents headings={pageHeadings} />
  </aside>
</div>
```

### 2. Individual Documentation Page
**Design**: Structured content with code examples

```jsx
<article className="doc-page">
  {/* Page Header */}
  <header className="doc-header">
    <Badge>Feature</Badge>
    <h1>Project Wizard</h1>
    <p className="lead">Complete project setup with one command</p>
    
    <div className="doc-meta">
      <span>Last updated: 2 days ago</span>
      <span>Reading time: 5 min</span>
    </div>
  </header>
  
  {/* Content Sections */}
  <section className="doc-section">
    <h2>Overview</h2>
    <p>Content...</p>
    
    {/* Code Example */}
    <CodeBlock 
      language="bash"
      copy
      filename="terminal"
    >
      /create-project "e-commerce platform"
    </CodeBlock>
  </section>
  
  {/* Interactive Examples */}
  <section className="doc-section">
    <h2>Try It Out</h2>
    <InteractiveDemo>
      <DemoTerminal />
      <DemoOutput />
    </InteractiveDemo>
  </section>
  
  {/* Related Links */}
  <footer className="doc-footer">
    <RelatedLinks>
      <Link href="/docs/requirements">Requirements Planning →</Link>
      <Link href="/docs/database">Database Setup →</Link>
    </RelatedLinks>
  </footer>
</article>
```

### 3. API Reference Page
**Design**: Structured API documentation

```jsx
<div className="api-reference">
  {/* Endpoint List */}
  <div className="endpoint-sidebar">
    <EndpointGroup title="Projects">
      <Endpoint method="POST" path="/api/projects" />
      <Endpoint method="GET" path="/api/projects/:id" />
      <Endpoint method="PUT" path="/api/projects/:id" />
    </EndpointGroup>
  </div>
  
  {/* Endpoint Details */}
  <div className="endpoint-content">
    <EndpointHeader 
      method="POST"
      path="/api/projects"
      title="Create Project"
    />
    
    <TabGroup>
      <Tab label="Request">
        <CodeBlock language="json">
          {JSON.stringify(requestExample, null, 2)}
        </CodeBlock>
      </Tab>
      <Tab label="Response">
        <CodeBlock language="json">
          {JSON.stringify(responseExample, null, 2)}
        </CodeBlock>
      </Tab>
      <Tab label="Try It">
        <ApiPlayground endpoint="/api/projects" />
      </Tab>
    </TabGroup>
  </div>
</div>
```

### 4. Command Reference Page
**Design**: Searchable command list with filters

```jsx
<div className="commands-page">
  {/* Filters Bar */}
  <div className="filters-bar glass">
    <SearchInput placeholder="Search commands..." />
    <CategoryFilter categories={commandCategories} />
    <SortDropdown options={["Name", "Category", "Usage"]} />
  </div>
  
  {/* Commands Grid */}
  <div className="commands-grid">
    {commands.map(cmd => (
      <CommandCard key={cmd.name}>
        <CommandIcon category={cmd.category} />
        <h3>{cmd.name}</h3>
        <p>{cmd.description}</p>
        <CommandUsage>{cmd.usage}</CommandUsage>
        <div className="command-meta">
          <Badge>{cmd.category}</Badge>
          <span>{cmd.complexity}</span>
        </div>
      </CommandCard>
    ))}
  </div>
</div>
```

## Visual Documentation Editor (Webflow/Framer-inspired)

### Editor Interface
**Design**: Visual block-based editor

```jsx
<div className="doc-editor">
  {/* Editor Toolbar */}
  <Toolbar className="glass">
    <ToolGroup>
      <ToolButton icon="heading" tooltip="Heading" />
      <ToolButton icon="text" tooltip="Paragraph" />
      <ToolButton icon="code" tooltip="Code Block" />
      <ToolButton icon="image" tooltip="Image" />
    </ToolGroup>
    
    <ToolGroup>
      <ToolButton icon="bold" />
      <ToolButton icon="italic" />
      <ToolButton icon="link" />
    </ToolGroup>
    
    <ToolGroup>
      <ToolButton icon="preview" tooltip="Preview" />
      <ToolButton icon="save" tooltip="Save Draft" />
      <PublishButton />
    </ToolGroup>
  </Toolbar>
  
  {/* Canvas Area */}
  <div className="editor-canvas">
    {/* Draggable Blocks */}
    <EditableBlock type="heading" level={1}>
      <ContentEditable>Getting Started with Agentwise</ContentEditable>
    </EditableBlock>
    
    <EditableBlock type="paragraph">
      <ContentEditable>Type your content here...</ContentEditable>
    </EditableBlock>
    
    <EditableBlock type="code">
      <CodeEditor language="javascript" />
    </EditableBlock>
    
    {/* Add Block Button */}
    <AddBlockButton onClick={showBlockPicker} />
  </div>
  
  {/* Properties Panel */}
  <aside className="properties-panel glass">
    <h3>Block Properties</h3>
    <PropertyField label="Font Size" type="select" />
    <PropertyField label="Margin" type="spacing" />
    <PropertyField label="Background" type="color" />
  </aside>
</div>
```

### Block Types
1. **Text Blocks**: Heading, Paragraph, Quote, List
2. **Code Blocks**: Syntax highlighted, runnable
3. **Media Blocks**: Image, Video, GIF
4. **Interactive**: Tabs, Accordions, Demos
5. **Embeds**: CodeSandbox, GitHub Gists, YouTube

## Search Functionality

### Global Search Modal
```jsx
<SearchModal isOpen={isSearchOpen}>
  <SearchInput 
    placeholder="Search documentation..."
    autoFocus
  />
  
  <SearchResults>
    <ResultSection title="Documentation">
      <SearchResult 
        title="Project Wizard"
        snippet="Complete project setup with..."
        path="/docs/project-wizard"
      />
    </ResultSection>
    
    <ResultSection title="Commands">
      <SearchResult 
        title="/create-project"
        snippet="Creates a new project with..."
        path="/docs/commands/create-project"
      />
    </ResultSection>
  </SearchResults>
  
  <SearchFooter>
    <kbd>↑↓</kbd> Navigate
    <kbd>Enter</kbd> Select
    <kbd>Esc</kbd> Close
  </SearchFooter>
</SearchModal>
```

## Version Selector
```jsx
<VersionSelector currentVersion="2.3.0">
  <option value="2.3.0">v2.3.0 (latest)</option>
  <option value="1.2.0">v1.2.0</option>
  <option value="1.1.0">v1.1.0</option>
</VersionSelector>
```

## Responsive Behavior

### Mobile Documentation
- Collapsible sidebar (hamburger menu)
- Swipe to navigate between pages
- Floating TOC button
- Simplified code blocks with horizontal scroll

### Tablet
- Sidebar visible but collapsible
- TOC as dropdown
- Touch-friendly navigation

## Technical Implementation

### Markdown Processing
```typescript
// MDX support for interactive components
import { MDXProvider } from '@mdx-js/react'
import { components } from './mdx-components'

<MDXProvider components={components}>
  {children}
</MDXProvider>
```

### Syntax Highlighting
```typescript
// Prism.js or Shiki for code highlighting
import Prism from 'prismjs'
import 'prismjs/components/prism-typescript'
import 'prismjs/themes/prism-night-owl.css'
```

### Search Implementation
```typescript
// Algolia DocSearch or custom implementation
const searchIndex = {
  docs: [...],
  commands: [...],
  api: [...]
}

// Fuzzy search with Fuse.js
const fuse = new Fuse(searchIndex, {
  keys: ['title', 'content', 'tags'],
  threshold: 0.3
})
```

## SEO & Meta Tags
```html
<meta property="og:title" content="Agentwise Documentation" />
<meta name="description" content="Complete guide to using Agentwise" />
<link rel="canonical" href="https://agentwise.dev/docs" />
```

---

**Note**: Documentation pages should load instantly, be fully searchable, and provide excellent code examples with copy functionality.