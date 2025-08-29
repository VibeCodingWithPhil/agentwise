# /figma-generate

Generate pixel-perfect, production-ready code from Figma designs with framework flexibility and responsive support.

## Usage

```bash
/figma-generate                        # Generate from current selection
/figma-generate --framework=react      # Generate React components
/figma-generate --full-app            # Generate complete application
/figma-generate --backend             # Include backend code
/figma-generate --pixel-perfect       # Maximum fidelity mode
```

## Description

This command transforms Figma designs into production-ready code with 100% pixel accuracy. It leverages the Figma Dev Mode MCP server, Code Connect, and AI-powered code generation to create maintainable, accessible, and performant applications.

## Generation Modes

### 1. Component Generation (Default)
```bash
/figma-generate
```
- Generates individual components
- Preserves component hierarchy
- Includes all variants
- Maintains design tokens

### 2. Full Application Generation
```bash
/figma-generate --full-app
```
- Complete project structure
- Routing and navigation
- State management
- API integration
- Build configuration

### 3. Pixel-Perfect Mode
```bash
/figma-generate --pixel-perfect
```
- Exact positioning (absolute if needed)
- Precise dimensions and spacing
- Exact colors and gradients
- Custom fonts and effects
- Image optimization

## Framework Support

### React (Default)
```bash
/figma-generate --framework=react
```
- TypeScript components
- Hooks and context
- CSS Modules or styled-components
- Next.js compatible

### Vue
```bash
/figma-generate --framework=vue
```
- Vue 3 Composition API
- Single File Components
- TypeScript support
- Nuxt.js compatible

### Angular
```bash
/figma-generate --framework=angular
```
- Standalone components
- TypeScript strict mode
- Angular Material integration
- RxJS patterns

### React Native
```bash
/figma-generate --framework=react-native
```
- Native components
- Platform-specific code
- Expo compatible
- Responsive scaling

### SwiftUI
```bash
/figma-generate --framework=swiftui
```
- iOS/macOS native
- Swift 5.9+
- Combine integration
- SF Symbols

### Flutter
```bash
/figma-generate --framework=flutter
```
- Dart widgets
- Material/Cupertino
- Responsive layouts
- Platform adaptive

### HTML/CSS
```bash
/figma-generate --framework=html
```
- Semantic HTML5
- Modern CSS (Grid, Flexbox)
- CSS custom properties
- No framework dependency

## Styling Options

### CSS Modules (Default)
```bash
/figma-generate --style=css-modules
```

### Tailwind CSS
```bash
/figma-generate --style=tailwind
```
- Utility classes
- Custom configuration
- JIT compilation
- Dark mode support

### Styled Components
```bash
/figma-generate --style=styled-components
```

### Emotion
```bash
/figma-generate --style=emotion
```

### Inline Styles
```bash
/figma-generate --style=inline
```

## Advanced Features

### Responsive Generation
```bash
/figma-generate --responsive
```
- Breakpoint detection
- Fluid typography
- Flexible grids
- Container queries

### Accessibility
```bash
/figma-generate --a11y
```
- ARIA labels
- Keyboard navigation
- Screen reader support
- WCAG 2.1 compliance

### Animation
```bash
/figma-generate --animations
```
- Micro-interactions
- Page transitions
- Scroll animations
- Gesture support

### Dark Mode
```bash
/figma-generate --dark-mode
```
- Automatic theme detection
- Color scheme switching
- System preference sync

## Backend Generation

### API Layer
```bash
/figma-generate --backend=api
```
Generates:
- RESTful endpoints
- GraphQL schema
- Authentication
- Database models

### Full Stack
```bash
/figma-generate --backend=fullstack
```
Includes:
- Frontend + Backend
- Database setup
- Authentication system
- API integration
- Deployment config

### Backend Frameworks
- **Node.js**: Express, Fastify, NestJS
- **Python**: FastAPI, Django, Flask
- **Ruby**: Rails, Sinatra
- **Go**: Gin, Echo, Fiber
- **Rust**: Actix, Rocket

## Code Quality

### Type Safety
```bash
/figma-generate --typescript --strict
```
- Full TypeScript
- Strict mode
- Type inference
- No any types

### Testing
```bash
/figma-generate --with-tests
```
Generates:
- Unit tests
- Component tests
- E2E test stubs
- Test utilities

### Documentation
```bash
/figma-generate --with-docs
```
Includes:
- Component documentation
- Props tables
- Usage examples
- Storybook stories

## Output Structure

### Component Output
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.module.css
│   │   ├── Button.test.tsx
│   │   ├── Button.stories.tsx
│   │   └── index.ts
│   └── Card/
│       ├── Card.tsx
│       └── ...
├── styles/
│   ├── tokens.css
│   └── globals.css
└── types/
    └── components.ts
```

### Full App Output
```
project/
├── src/
│   ├── app/            # Application logic
│   ├── components/     # UI components
│   ├── features/       # Feature modules
│   ├── pages/          # Route pages
│   ├── services/       # API services
│   ├── store/          # State management
│   └── utils/          # Utilities
├── public/             # Static assets
├── tests/              # Test files
├── .env.example        # Environment template
├── package.json        # Dependencies
└── README.md           # Documentation
```

## Design Token Integration

Automatically extracts and uses:
- **Colors**: RGB, HSL, with opacity
- **Typography**: Font families, sizes, weights
- **Spacing**: Padding, margins, gaps
- **Borders**: Radius, width, style
- **Shadows**: Box shadows, drop shadows
- **Effects**: Blur, backdrop filters

## Code Connect Integration

When Code Connect is available:
- Uses official component mappings
- Preserves prop interfaces
- Maintains component contracts
- Links to design source

## Performance Optimization

### Image Optimization
- Automatic format conversion
- Responsive images
- Lazy loading
- CDN integration

### Code Splitting
- Route-based splitting
- Component lazy loading
- Dynamic imports
- Bundle optimization

### Build Optimization
- Tree shaking
- Minification
- Compression
- Cache strategies

## Examples

### Generate React App from Design
```bash
/figma-select file_ABC123
/figma-generate --full-app --framework=react --style=tailwind
```

### Generate Mobile App
```bash
/figma-select file_XYZ789 --frames="Mobile/*"
/figma-generate --framework=react-native --responsive
```

### Generate with Backend
```bash
/figma-generate --backend=fullstack --database=postgres --auth=jwt
```

### Pixel-Perfect Landing Page
```bash
/figma-select file_123 node:456:789
/figma-generate --pixel-perfect --framework=html --animations
```

## Quality Assurance

Generated code includes:
- ✓ Linting configuration
- ✓ Prettier formatting
- ✓ TypeScript checking
- ✓ Accessibility audit
- ✓ Performance metrics

## Agent Integration

The generation process uses specialized agents:
- **Frontend Specialist**: Component structure
- **Designer Specialist**: Pixel perfection
- **Backend Specialist**: API generation
- **Testing Specialist**: Test creation
- **DevOps Specialist**: Build setup

## Error Handling

### Missing Design Data
- Fallback to sensible defaults
- Warning comments in code
- TODO markers for review

### Unsupported Features
- Generates closest equivalent
- Documents limitations
- Suggests alternatives

## Next Steps

After generation:
1. Run `/figma-review` to validate code
2. Use `/figma-test` to run tests
3. Run `/figma-deploy` to deploy
4. Use `/figma-sync` for updates