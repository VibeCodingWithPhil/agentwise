# Agentwise Documentation Website

A modern, interactive documentation website built with Next.js 14, showcasing the Agentwise multi-agent orchestration system.

## Features

- 🎨 **Modern Design System** - Professional design with dark/light theme toggle
- 🔍 **Instant Search** - Keyboard shortcut (⌘K) powered search with filtering
- 📱 **Fully Responsive** - Optimized for all devices and screen sizes
- ⚡ **Performance Optimized** - Built for speed with code splitting and lazy loading
- 🎯 **Interactive Components** - Mermaid diagrams, code blocks with copy functionality
- 📚 **Comprehensive Docs** - Installation, commands, architecture, and performance guides
- ♿ **Accessibility First** - WCAG 2.1 AA compliant with keyboard navigation

## Tech Stack

- **Framework:** Next.js 14 with App Router
- **Styling:** Tailwind CSS + Shadcn UI components  
- **Typography:** Inter font family with Fira Code for code
- **Icons:** Lucide React
- **Theme:** next-themes with localStorage persistence
- **Search:** CMDK command palette
- **Diagrams:** Mermaid for interactive flowcharts
- **Code Highlighting:** Custom code block components

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/                 # Next.js App Router pages
│   ├── docs/           # Documentation pages
│   ├── performance/    # Performance metrics
│   └── layout.tsx      # Root layout
├── components/
│   ├── ui/             # Reusable UI components
│   ├── layout/         # Layout components (navbar, sidebar)
│   └── features/       # Feature-specific components
├── lib/                # Utilities and configurations
├── styles/             # Global styles and CSS
└── types/              # TypeScript type definitions
```

## Key Components

### Navigation
- **Navbar** - Responsive top navigation with theme toggle
- **Sidebar** - Collapsible documentation navigation
- **Breadcrumbs** - Automatic breadcrumb generation

### Content
- **CodeBlock** - Syntax highlighted code with copy functionality
- **MermaidDiagram** - Interactive diagram rendering
- **SearchDialog** - Full-text search with keyboard shortcuts

### UI Components
- **ThemeToggle** - Dark/light mode switcher with persistence
- **Cards** - Flexible card components for content layout
- **Progress** - Animated progress indicators

## Documentation Content

The site includes comprehensive documentation for Agentwise:

- **Getting Started** - Installation and first steps
- **Commands Reference** - Complete command documentation
- **Architecture Guide** - System architecture and design
- **Performance Metrics** - Token optimization benchmarks
- **Agent Showcase** - Available agents and capabilities

## Performance Features

- **30-40% Token Reduction** - Verified optimization techniques
- **Code Splitting** - Dynamic imports for optimal loading
- **Image Optimization** - Next.js automatic image optimization  
- **Font Optimization** - Efficient font loading strategies
- **SEO Optimized** - Meta tags, structured data, and sitemap

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Environment Variables

Create a `.env.local` file for local development:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Customization

The design system is built with CSS custom properties and can be easily customized by modifying the Tailwind configuration and global CSS variables.

## Deployment

The site is optimized for deployment on:

- **Vercel** (recommended)
- **Netlify**  
- **GitHub Pages**
- **Any Node.js hosting platform**

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure build settings (auto-detected)
3. Deploy with zero configuration

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `.next` folder and `package.json` to your hosting platform

## Contributing

This documentation website is part of the Agentwise project. For contributing guidelines, please see the main repository.

## License

This project is licensed under the same terms as the main Agentwise project - see the LICENSE file for details.

---

Built with ❤️ for the Agentwise community