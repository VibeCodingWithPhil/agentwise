# Clone Website Command

Clone and recreate websites with customization using Firecrawl MCP integration.

## Usage
```
/clone-website <url> [customization_level]
```

## Customization Levels

- `exact` - 1:1 replica with same design and structure
- `similar` - Keep design patterns but customize colors/fonts
- `inspired` - Use as inspiration, significant customization
- `structure` - Clone structure only, new design

## Examples

### Clone Exact Design
```
/clone-website https://example.com exact
```
Creates an exact replica of the website's design and components.

### Create Similar Site
```
/clone-website https://example.com similar
```
Maintains design patterns but applies your brand colors and fonts.

### Get Inspired
```
/clone-website https://example.com inspired
```
Uses the site as inspiration while creating unique implementation.

## Features

### What Gets Cloned

1. **Visual Design**
   - Layout and grid systems
   - Color schemes and gradients
   - Typography and font choices
   - Spacing and padding patterns
   - Visual effects and animations

2. **Components**
   - Navigation menus
   - Hero sections
   - Cards and containers
   - Forms and inputs
   - Footers and headers

3. **Interactions**
   - Hover effects
   - Click animations
   - Scroll behaviors
   - Modal/popup patterns
   - Dropdown menus

4. **Structure**
   - Page hierarchy
   - Section organization
   - Content flow
   - Responsive breakpoints

### What Gets Customized

Based on your preferences:
- Brand colors and palette
- Logo and brand assets
- Font selections
- Content and copy
- Images and media
- Custom functionality

## Customization Options

Create `.agentwise-clone.json`:
```json
{
  "brand": {
    "primaryColor": "#007AFF",
    "secondaryColor": "#5856D6",
    "fontFamily": "Inter, system-ui",
    "logoUrl": "./assets/logo.svg"
  },
  "preferences": {
    "framework": "react",
    "styling": "tailwind",
    "animations": true,
    "darkMode": true
  },
  "content": {
    "replaceText": true,
    "customImages": true,
    "preserveStructure": true
  }
}
```

## MCP Integration

The command uses Firecrawl MCP to:
1. Crawl and analyze the target website
2. Extract design patterns and components
3. Generate clean, semantic HTML
4. Identify reusable patterns
5. Create component library

## Output Structure

```
cloned-site/
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── Navigation.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── Features.tsx
│   │   └── Testimonials.tsx
│   └── ui/
│       ├── Button.tsx
│       ├── Card.tsx
│       └── Input.tsx
├── styles/
│   ├── extracted-theme.css
│   ├── customized-theme.css
│   └── animations.css
├── pages/
│   ├── index.tsx
│   ├── about.tsx
│   └── contact.tsx
└── assets/
    ├── images/
    └── icons/
```

## Workflow

1. **Analysis Phase**
   - Firecrawl analyzes target website
   - Extracts design system
   - Identifies component patterns

2. **Generation Phase**
   - Designer agent processes design
   - Frontend agent builds components
   - Styles are extracted and customized

3. **Customization Phase**
   - Apply brand preferences
   - Replace placeholder content
   - Add custom functionality

4. **Optimization Phase**
   - Clean up generated code
   - Optimize performance
   - Ensure accessibility

## Legal and Ethical Considerations

⚠️ **Important**: 
- Only clone websites you have permission to replicate
- Respect copyright and intellectual property
- Use for learning and inspiration
- Don't clone trademarked designs
- Always create unique content

## Advanced Features

### Multi-page Cloning
```
/clone-website https://example.com exact --pages 5
```
Clones up to 5 pages from the site.

### Specific Section Cloning
```
/clone-website https://example.com/pricing exact --section pricing
```
Clones only specific sections.

### Progressive Enhancement
```
/clone-website https://example.com similar --enhance
```
Adds modern features like dark mode, animations, and accessibility.

## Integration with Other Commands

Combine with other Agentwise features:
```
# Clone a website then add features
/clone-website https://example.com similar
/task "add user authentication"
/task "integrate payment system"
```

## Performance Optimization

The cloned site includes:
- Lazy loading for images
- Code splitting for routes
- Optimized bundle sizes
- SEO optimization
- Performance best practices

## Troubleshooting

### Site Not Accessible
- Check if site allows crawling
- Verify URL is correct
- Try with different customization level

### Missing Styles
- Some dynamic styles may not be captured
- JavaScript-generated styles need manual review
- Check browser console for errors

### Large Sites
- Use page limit for large sites
- Clone incrementally
- Focus on specific sections