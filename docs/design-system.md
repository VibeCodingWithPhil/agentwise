# Agentwise Documentation Design System
## Comprehensive UI/UX Specification

*Version 1.0 | Created for Agentwise Multi-Agent Orchestration System*

---

## Table of Contents

1. [Design Principles](#design-principles)
2. [Brand & Identity](#brand--identity)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Grid](#spacing--grid)
6. [Component Library](#component-library)
7. [Page Templates](#page-templates)
8. [Interactive Elements](#interactive-elements)
9. [Accessibility Guidelines](#accessibility-guidelines)
10. [Implementation Guidelines](#implementation-guidelines)

---

## Design Principles

### Core Philosophy
The Agentwise documentation design system is built on four foundational principles:

#### 1. **Developer-First Experience**
- **Clear Information Hierarchy**: Critical information is immediately visible
- **Scannable Content**: Headers, code blocks, and navigation elements are easily identifiable
- **Minimal Cognitive Load**: Users can find what they need without thinking

#### 2. **Professional Trust**
- **Consistent Visual Language**: Every interaction feels cohesive and intentional
- **Enterprise-Grade Aesthetics**: Clean, modern design that instills confidence
- **Attention to Detail**: Micro-interactions and polish that demonstrate quality

#### 3. **Performance & Speed**
- **Fast Loading**: Optimized assets and minimal bundle sizes
- **Smooth Interactions**: 60fps animations and instant feedback
- **Progressive Enhancement**: Works on all devices and connection speeds

#### 4. **Accessibility & Inclusion**
- **WCAG 2.1 AA Compliance**: Usable by everyone, regardless of ability
- **Keyboard Navigation**: Full functionality without a mouse
- **Screen Reader Optimized**: Semantic HTML and ARIA labels throughout

---

## Brand & Identity

### Brand Personality
- **Intelligent**: Sophisticated AI orchestration capabilities
- **Reliable**: Enterprise-grade stability and performance
- **Innovative**: Cutting-edge features like Figma integration and document upload
- **Approachable**: Developer-friendly interface and comprehensive documentation

### Visual Style
- **Modern Minimalism**: Clean lines, generous whitespace, purposeful design
- **Tech-Forward**: Subtle gradients, sophisticated shadows, contemporary typography
- **Trustworthy**: Professional color palette, consistent spacing, reliable interactions

---

## Color System

### Light Theme Palette

#### Primary Colors
```css
/* Primary Brand Colors */
--primary-900: hsl(222, 84%, 4.9%)     /* Deep Navy - Headers, emphasis */
--primary-800: hsl(222, 47%, 11.2%)    /* Dark Navy - Primary buttons */
--primary-700: hsl(222, 35%, 20%)      /* Medium Navy - Secondary text */
--primary-600: hsl(222, 25%, 35%)      /* Light Navy - Borders, dividers */
--primary-500: hsl(222, 20%, 50%)      /* Neutral Navy - Muted text */

/* Accent Colors */
--accent-600: hsl(262, 83%, 58%)       /* Purple - Links, interactive elements */
--accent-500: hsl(262, 73%, 68%)       /* Light Purple - Hover states */
--accent-100: hsl(262, 83%, 96%)       /* Purple Tint - Backgrounds */

/* Success & Status */
--success-600: hsl(142, 76%, 36%)      /* Green - Success states */
--success-100: hsl(142, 76%, 96%)      /* Light Green - Success backgrounds */

--warning-600: hsl(38, 92%, 50%)       /* Orange - Warning states */
--warning-100: hsl(38, 92%, 96%)       /* Light Orange - Warning backgrounds */

--error-600: hsl(0, 84%, 60%)          /* Red - Error states */
--error-100: hsl(0, 84%, 96%)          /* Light Red - Error backgrounds */
```

#### Neutral Colors
```css
/* Grays & Neutrals */
--neutral-50: hsl(210, 40%, 98%)       /* Pure white - Page backgrounds */
--neutral-100: hsl(210, 40%, 96.1%)    /* Off-white - Card backgrounds */
--neutral-200: hsl(214, 31.8%, 91.4%)  /* Light gray - Borders */
--neutral-300: hsl(213, 27%, 84%)      /* Medium light - Dividers */
--neutral-400: hsl(215, 20.2%, 65.1%)  /* Medium gray - Placeholder text */
--neutral-500: hsl(215, 16.3%, 46.9%)  /* Dark gray - Secondary text */
--neutral-600: hsl(215, 19%, 35%)      /* Darker gray - Body text */
--neutral-700: hsl(215, 25%, 27%)      /* Very dark - Emphasis text */
--neutral-800: hsl(222, 47%, 11.2%)    /* Almost black - Headers */
--neutral-900: hsl(222, 84%, 4.9%)     /* True black - Maximum emphasis */
```

### Dark Theme Palette

#### Primary Colors (Dark Mode)
```css
/* Primary Brand Colors - Dark */
--primary-900: hsl(210, 40%, 98%)      /* Light - Headers, emphasis */
--primary-800: hsl(210, 40%, 90%)      /* Off-white - Primary buttons */
--primary-700: hsl(213, 27%, 84%)      /* Light gray - Secondary text */
--primary-600: hsl(215, 20%, 65%)      /* Medium gray - Borders */
--primary-500: hsl(215, 16%, 47%)      /* Dark gray - Muted text */

/* Accent Colors - Dark */
--accent-600: hsl(262, 83%, 68%)       /* Light Purple - Links */
--accent-500: hsl(262, 73%, 78%)       /* Lighter Purple - Hover */
--accent-100: hsl(262, 50%, 12%)       /* Dark Purple - Backgrounds */

/* Success & Status - Dark */
--success-600: hsl(142, 76%, 46%)      /* Brighter Green */
--success-100: hsl(142, 50%, 8%)       /* Dark Green - Backgrounds */

--warning-600: hsl(38, 92%, 60%)       /* Brighter Orange */
--warning-100: hsl(38, 50%, 8%)        /* Dark Orange - Backgrounds */

--error-600: hsl(0, 84%, 70%)          /* Brighter Red */
--error-100: hsl(0, 50%, 8%)           /* Dark Red - Backgrounds */
```

#### Neutral Colors (Dark Mode)
```css
/* Grays & Neutrals - Dark */
--neutral-50: hsl(222, 84%, 4.9%)      /* True black - Page backgrounds */
--neutral-100: hsl(222, 84%, 6%)       /* Very dark - Card backgrounds */
--neutral-200: hsl(217, 33%, 17.5%)    /* Dark gray - Borders */
--neutral-300: hsl(217, 27%, 25%)      /* Medium dark - Dividers */
--neutral-400: hsl(215, 20%, 46.9%)    /* Medium - Placeholder text */
--neutral-500: hsl(215, 16%, 65.1%)    /* Light gray - Secondary text */
--neutral-600: hsl(213, 27%, 78%)      /* Lighter - Body text */
--neutral-700: hsl(210, 40%, 85%)      /* Very light - Emphasis text */
--neutral-800: hsl(210, 40%, 92%)      /* Off-white - Headers */
--neutral-900: hsl(210, 40%, 98%)      /* Pure white - Maximum emphasis */
```

### Semantic Color Usage

#### Light Theme Usage
```css
/* Backgrounds */
--background-primary: var(--neutral-50)     /* Main page background */
--background-secondary: var(--neutral-100)  /* Card/panel backgrounds */
--background-tertiary: var(--neutral-200)   /* Input backgrounds */

/* Text */
--text-primary: var(--neutral-900)          /* Primary text */
--text-secondary: var(--neutral-600)        /* Secondary text */
--text-muted: var(--neutral-500)            /* Muted text */

/* Interactive */
--button-primary: var(--primary-800)        /* Primary button background */
--button-secondary: var(--neutral-100)      /* Secondary button background */
--link-color: var(--accent-600)             /* Link color */
--border-color: var(--neutral-200)          /* Border color */
```

#### Dark Theme Usage
```css
/* Backgrounds - Dark */
--background-primary: var(--neutral-50)     /* Main page background (dark) */
--background-secondary: var(--neutral-100)  /* Card/panel backgrounds (dark) */
--background-tertiary: var(--neutral-200)   /* Input backgrounds (dark) */

/* Text - Dark */
--text-primary: var(--neutral-900)          /* Primary text (white) */
--text-secondary: var(--neutral-600)        /* Secondary text (light gray) */
--text-muted: var(--neutral-500)            /* Muted text (gray) */

/* Interactive - Dark */
--button-primary: var(--primary-800)        /* Primary button (light) */
--button-secondary: var(--neutral-200)      /* Secondary button (dark gray) */
--link-color: var(--accent-600)             /* Link color (light purple) */
--border-color: var(--neutral-200)          /* Border color (dark gray) */
```

---

## Typography

### Font Stack
```css
/* Primary Font - Inter */
--font-primary: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace Font - Fira Code */
--font-mono: 'Fira Code', 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;

/* Display Font - Inter with tighter spacing */
--font-display: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
```

### Type Scale
```css
/* Font Sizes - Based on 1.125 (Major Second) Scale */
--text-xs: 0.75rem;      /* 12px - Captions, small labels */
--text-sm: 0.875rem;     /* 14px - Secondary text, code comments */
--text-base: 1rem;       /* 16px - Body text, base size */
--text-lg: 1.125rem;     /* 18px - Large body text */
--text-xl: 1.25rem;      /* 20px - Small headings */
--text-2xl: 1.5rem;      /* 24px - Section headings */
--text-3xl: 1.875rem;    /* 30px - Page headings */
--text-4xl: 2.25rem;     /* 36px - Hero headings */
--text-5xl: 3rem;        /* 48px - Display headings */
--text-6xl: 3.75rem;     /* 60px - Large display */
--text-7xl: 4.5rem;      /* 72px - Hero display */
```

### Font Weights
```css
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
```

### Line Heights
```css
--line-height-tight: 1.25;    /* Headlines */
--line-height-snug: 1.375;    /* Subheadings */
--line-height-normal: 1.5;    /* Body text */
--line-height-relaxed: 1.625; /* Large text */
--line-height-loose: 2;       /* Captions */
```

### Typography Hierarchy
```css
/* Display Headers */
.text-display-1 {
  font-family: var(--font-display);
  font-size: var(--text-7xl);
  font-weight: var(--font-weight-extrabold);
  line-height: var(--line-height-tight);
  letter-spacing: -0.02em;
}

.text-display-2 {
  font-family: var(--font-display);
  font-size: var(--text-6xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: -0.015em;
}

/* Page Headers */
.text-h1 {
  font-family: var(--font-primary);
  font-size: var(--text-5xl);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: -0.01em;
}

.text-h2 {
  font-family: var(--font-primary);
  font-size: var(--text-4xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
}

.text-h3 {
  font-family: var(--font-primary);
  font-size: var(--text-3xl);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
}

.text-h4 {
  font-family: var(--font-primary);
  font-size: var(--text-2xl);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
}

.text-h5 {
  font-family: var(--font-primary);
  font-size: var(--text-xl);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
}

.text-h6 {
  font-family: var(--font-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
}

/* Body Text */
.text-body-large {
  font-family: var(--font-primary);
  font-size: var(--text-lg);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-relaxed);
}

.text-body {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
}

.text-body-small {
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
}

/* Monospace Text */
.text-code {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
}

.text-code-large {
  font-family: var(--font-mono);
  font-size: var(--text-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
}
```

---

## Spacing & Grid

### Spacing Scale
```css
/* Spacing - Based on 4px base unit */
--space-0: 0;
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
--space-32: 8rem;     /* 128px */
--space-40: 10rem;    /* 160px */
--space-48: 12rem;    /* 192px */
--space-56: 14rem;    /* 224px */
--space-64: 16rem;    /* 256px */
```

### Grid System
```css
/* Container Sizes */
--container-sm: 640px;    /* Small devices */
--container-md: 768px;    /* Medium devices */
--container-lg: 1024px;   /* Large devices */
--container-xl: 1280px;   /* Extra large */
--container-2xl: 1536px;  /* 2X large */

/* Layout Grid */
.container {
  max-width: var(--container-xl);
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--space-6);
  padding-right: var(--space-6);
}

.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-cols-12 { grid-template-columns: repeat(12, minmax(0, 1fr)); }

/* Documentation Layout */
.docs-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--space-8);
  max-width: var(--container-2xl);
  margin: 0 auto;
  padding: 0 var(--space-6);
}

.docs-sidebar {
  position: sticky;
  top: var(--space-8);
  height: fit-content;
  max-height: calc(100vh - var(--space-16));
  overflow-y: auto;
}

.docs-content {
  min-width: 0; /* Prevent overflow */
  max-width: 65ch; /* Optimal reading width */
}

@media (max-width: 1024px) {
  .docs-layout {
    grid-template-columns: 1fr;
    gap: var(--space-6);
  }
  
  .docs-sidebar {
    position: static;
    max-height: none;
  }
}
```

### Border Radius
```css
--radius-none: 0;
--radius-sm: 0.125rem;   /* 2px */
--radius-default: 0.25rem; /* 4px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-2xl: 1rem;      /* 16px */
--radius-3xl: 1.5rem;    /* 24px */
--radius-full: 9999px;   /* Fully rounded */
```

### Shadows
```css
/* Elevation System */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
--shadow-inner: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05);
```

---

## Component Library

### Navigation Components

#### 1. Top Navigation Bar
```css
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background: var(--background-primary);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(10px);
  background-color: rgba(255, 255, 255, 0.8);
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 var(--space-6);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: var(--container-2xl);
  margin: 0 auto;
}

.navbar-logo {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-weight: var(--font-weight-bold);
  font-size: var(--text-lg);
  color: var(--text-primary);
  text-decoration: none;
}

.navbar-nav {
  display: flex;
  align-items: center;
  gap: var(--space-8);
}

.navbar-link {
  color: var(--text-secondary);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  transition: color 0.15s ease;
}

.navbar-link:hover {
  color: var(--text-primary);
}

.navbar-link.active {
  color: var(--accent-600);
}
```

#### 2. Sidebar Navigation
```css
.sidebar {
  width: 280px;
  background: var(--background-secondary);
  border-right: 1px solid var(--border-color);
  padding: var(--space-6);
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: var(--space-8);
}

.sidebar-title {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sidebar-link {
  display: block;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: var(--font-weight-medium);
  transition: all 0.15s ease;
  position: relative;
}

.sidebar-link:hover {
  background: var(--neutral-100);
  color: var(--text-primary);
}

.sidebar-link.active {
  background: var(--accent-100);
  color: var(--accent-600);
}

.sidebar-link.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--accent-600);
  border-radius: 0 2px 2px 0;
}
```

#### 3. Breadcrumbs
```css
.breadcrumbs {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-6);
  font-size: var(--text-sm);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-muted);
}

.breadcrumb-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.15s ease;
}

.breadcrumb-link:hover {
  color: var(--accent-600);
}

.breadcrumb-separator {
  color: var(--text-muted);
  font-size: var(--text-xs);
}
```

### Content Components

#### 1. Feature Cards
```css
.feature-card {
  background: var(--background-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: all 0.2s ease;
  box-shadow: var(--shadow-sm);
}

.feature-card:hover {
  box-shadow: var(--shadow-lg);
  border-color: var(--accent-600);
  transform: translateY(-2px);
}

.feature-card-icon {
  width: 48px;
  height: 48px;
  margin-bottom: var(--space-4);
  background: var(--accent-100);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-600);
}

.feature-card-title {
  font-size: var(--text-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.feature-card-description {
  color: var(--text-secondary);
  line-height: var(--line-height-relaxed);
}
```

#### 2. Code Blocks
```css
.code-block {
  position: relative;
  background: var(--neutral-900);
  border: 1px solid var(--neutral-200);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin: var(--space-6) 0;
}

.code-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--neutral-100);
  border-bottom: 1px solid var(--neutral-200);
}

.code-language {
  font-size: var(--text-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.code-copy {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-2);
  background: transparent;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-default);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  cursor: pointer;
  transition: all 0.15s ease;
}

.code-copy:hover {
  background: var(--neutral-50);
  color: var(--text-primary);
}

.code-content {
  padding: var(--space-4);
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  line-height: var(--line-height-relaxed);
  color: var(--neutral-100);
}

/* Syntax Highlighting Colors */
.token.comment { color: #6A9955; }
.token.keyword { color: #569CD6; }
.token.string { color: #CE9178; }
.token.function { color: #DCDCAA; }
.token.number { color: #B5CEA8; }
.token.operator { color: #D4D4D4; }
.token.punctuation { color: #D4D4D4; }
```

#### 3. Alert Components
```css
.alert {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  border-left: 4px solid;
  margin: var(--space-4) 0;
}

.alert-info {
  background: var(--accent-100);
  border-left-color: var(--accent-600);
  color: var(--accent-600);
}

.alert-success {
  background: var(--success-100);
  border-left-color: var(--success-600);
  color: var(--success-600);
}

.alert-warning {
  background: var(--warning-100);
  border-left-color: var(--warning-600);
  color: var(--warning-600);
}

.alert-error {
  background: var(--error-100);
  border-left-color: var(--error-600);
  color: var(--error-600);
}

.alert-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.alert-content {
  flex: 1;
  min-width: 0;
}

.alert-title {
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--space-1);
}

.alert-description {
  font-size: var(--text-sm);
  line-height: var(--line-height-relaxed);
}
```

### Form Components

#### 1. Buttons
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn-primary {
  background: var(--primary-800);
  color: white;
  border-color: var(--primary-800);
}

.btn-primary:hover {
  background: var(--primary-700);
  border-color: var(--primary-700);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background: var(--background-secondary);
  color: var(--text-primary);
  border-color: var(--border-color);
}

.btn-secondary:hover {
  background: var(--neutral-200);
  transform: translateY(-1px);
}

.btn-ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: transparent;
}

.btn-ghost:hover {
  background: var(--neutral-100);
  color: var(--text-primary);
}

.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--text-xs);
}

.btn-lg {
  padding: var(--space-3) var(--space-6);
  font-size: var(--text-base);
}
```

#### 2. Input Fields
```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--background-tertiary);
  color: var(--text-primary);
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  transition: all 0.15s ease;
}

.input:focus {
  outline: none;
  border-color: var(--accent-600);
  box-shadow: 0 0 0 3px rgba(var(--accent-600), 0.1);
}

.input::placeholder {
  color: var(--text-muted);
}

.input-group {
  margin-bottom: var(--space-4);
}

.input-label {
  display: block;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.input-help {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: var(--space-1);
}
```

#### 3. Search Component
```css
.search-container {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-input {
  width: 100%;
  padding: var(--space-3) var(--space-4) var(--space-3) var(--space-12);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  background: var(--background-secondary);
  color: var(--text-primary);
  font-size: var(--text-sm);
  transition: all 0.15s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-600);
  box-shadow: 0 0 0 3px rgba(var(--accent-600), 0.1);
}

.search-icon {
  position: absolute;
  left: var(--space-4);
  top: 50%;
  transform: translateY(-50%);
  width: 16px;
  height: 16px;
  color: var(--text-muted);
  pointer-events: none;
}

.search-results {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--background-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  z-index: 50;
  max-height: 300px;
  overflow-y: auto;
  margin-top: var(--space-2);
}

.search-result {
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.15s ease;
}

.search-result:hover {
  background: var(--neutral-100);
}

.search-result:last-child {
  border-bottom: none;
}
```

### Interactive Components

#### 1. Theme Toggle
```css
.theme-toggle {
  position: relative;
  width: 56px;
  height: 28px;
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background 0.3s ease;
  border: none;
  outline: none;
}

.theme-toggle.dark {
  background: var(--accent-600);
}

.theme-toggle-handle {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: var(--radius-full);
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-sm);
}

.theme-toggle.dark .theme-toggle-handle {
  transform: translateX(28px);
}

.theme-toggle-icon {
  width: 14px;
  height: 14px;
  color: var(--text-muted);
}
```

#### 2. Tabs Component
```css
.tabs {
  border-bottom: 1px solid var(--border-color);
}

.tabs-list {
  display: flex;
  gap: var(--space-6);
}

.tab-trigger {
  position: relative;
  padding: var(--space-3) 0;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-family: var(--font-primary);
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: color 0.15s ease;
}

.tab-trigger:hover {
  color: var(--text-primary);
}

.tab-trigger.active {
  color: var(--accent-600);
}

.tab-trigger.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-600);
  border-radius: 2px 2px 0 0;
}

.tab-content {
  padding: var(--space-6) 0;
}
```

#### 3. Progress Indicators
```css
.progress {
  width: 100%;
  height: 8px;
  background: var(--neutral-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--accent-600);
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
  background-image: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.2) 25%,
    transparent 25%,
    transparent 50%,
    rgba(255, 255, 255, 0.2) 50%,
    rgba(255, 255, 255, 0.2) 75%,
    transparent 75%,
    transparent
  );
  background-size: 16px 16px;
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  0% { background-position: 0 0; }
  100% { background-position: 16px 0; }
}
```

---

## Page Templates

### 1. Landing Page Template
```html
<div class="landing-page">
  <!-- Hero Section -->
  <section class="hero">
    <div class="container">
      <div class="hero-content">
        <h1 class="text-display-1">Agentwise</h1>
        <p class="text-body-large hero-subtitle">
          Multi-Agent Orchestration System for Claude Code
        </p>
        <div class="hero-features">
          <span class="feature-badge">30-40% Token Reduction</span>
          <span class="feature-badge">Parallel Execution</span>
          <span class="feature-badge">Self-Improving Agents</span>
        </div>
        <div class="hero-actions">
          <a href="/docs/getting-started" class="btn btn-primary btn-lg">
            Get Started
          </a>
          <a href="/docs" class="btn btn-secondary btn-lg">
            Documentation
          </a>
        </div>
      </div>
      <div class="hero-visual">
        <!-- Architecture diagram or demo video -->
      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features">
    <div class="container">
      <h2 class="text-h2 section-title">Groundbreaking Features</h2>
      <div class="grid grid-cols-3">
        <div class="feature-card">
          <div class="feature-card-icon">📄</div>
          <h3 class="feature-card-title">Document Upload</h3>
          <p class="feature-card-description">
            Process PDFs, Word docs, and design files directly
          </p>
        </div>
        <!-- More feature cards... -->
      </div>
    </div>
  </section>
</div>
```

### 2. Documentation Hub Template
```html
<div class="docs-hub">
  <div class="container">
    <div class="docs-header">
      <h1 class="text-h1">Documentation</h1>
      <p class="text-body-large">
        Everything you need to get started with Agentwise
      </p>
      <div class="search-container">
        <input type="search" class="search-input" placeholder="Search documentation...">
        <svg class="search-icon"><!-- Search icon --></svg>
      </div>
    </div>

    <div class="docs-categories">
      <div class="grid grid-cols-3">
        <div class="category-card">
          <h3 class="category-title">Getting Started</h3>
          <ul class="category-links">
            <li><a href="/docs/installation">Installation</a></li>
            <li><a href="/docs/quickstart">Quick Start</a></li>
            <li><a href="/docs/first-project">First Project</a></li>
          </ul>
        </div>
        <!-- More categories... -->
      </div>
    </div>
  </div>
</div>
```

### 3. API Reference Template
```html
<div class="api-reference">
  <div class="docs-layout">
    <nav class="docs-sidebar">
      <div class="sidebar-section">
        <h4 class="sidebar-title">Commands</h4>
        <div class="sidebar-nav">
          <a href="#create" class="sidebar-link">/create</a>
          <a href="#task" class="sidebar-link">/task</a>
          <a href="#monitor" class="sidebar-link">/monitor</a>
        </div>
      </div>
    </nav>

    <main class="docs-content">
      <div class="api-endpoint">
        <h2 class="text-h2">/create</h2>
        <div class="endpoint-meta">
          <span class="method-badge">COMMAND</span>
          <code class="endpoint-path">/create "project description"</code>
        </div>
        
        <div class="endpoint-description">
          <p>Creates a new project with AI agent orchestration</p>
        </div>

        <div class="code-block">
          <div class="code-header">
            <span class="code-language">bash</span>
            <button class="code-copy">Copy</button>
          </div>
          <div class="code-content">
            <pre><code>/create "an e-commerce platform with Next.js and Stripe"</code></pre>
          </div>
        </div>
      </div>
    </main>
  </div>
</div>
```

---

## Interactive Elements

### Micro-interactions
```css
/* Button Press Effect */
.btn:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

/* Card Hover Effects */
.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Link Hover Animations */
.link-animated {
  position: relative;
  color: var(--accent-600);
  text-decoration: none;
}

.link-animated::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--accent-600);
  transition: width 0.3s ease;
}

.link-animated:hover::after {
  width: 100%;
}
```

### Loading States
```css
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid var(--neutral-200);
  border-top-color: var(--accent-600);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-skeleton {
  background: var(--neutral-200);
  border-radius: var(--radius-md);
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

### Smooth Transitions
```css
/* Theme Transition */
* {
  transition: 
    background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1),
    color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Page Transitions */
.page-enter {
  opacity: 0;
  transform: translateY(20px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.page-exit {
  opacity: 1;
  transform: translateY(0);
}

.page-exit-active {
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
```

---

## Accessibility Guidelines

### Keyboard Navigation
- All interactive elements must be keyboard accessible
- Tab order follows logical document flow
- Focus indicators are clearly visible with 3px outline
- Skip links provided for main content areas

### Screen Reader Support
```html
<!-- Semantic HTML Structure -->
<main role="main" aria-labelledby="main-heading">
  <h1 id="main-heading">Page Title</h1>
  
  <nav aria-label="Primary navigation">
    <ul role="list">
      <li><a href="/docs" aria-current="page">Documentation</a></li>
    </ul>
  </nav>
  
  <section aria-labelledby="features-heading">
    <h2 id="features-heading">Features</h2>
    <!-- Content -->
  </section>
</main>

<!-- Interactive Elements -->
<button type="button" 
        aria-expanded="false" 
        aria-controls="menu-dropdown"
        aria-label="Open navigation menu">
  Menu
</button>

<div id="menu-dropdown" 
     role="menu" 
     aria-labelledby="menu-button"
     hidden>
  <!-- Menu items -->
</div>
```

### Color Contrast
- All text meets WCAG 2.1 AA standards (4.5:1 contrast ratio)
- Interactive elements have 3:1 minimum contrast
- Focus indicators have 3:1 contrast against background
- Information is never conveyed by color alone

### Motion & Animation
```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Implementation Guidelines

### Framework Integration

#### Shadcn UI Integration
```typescript
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Use the color tokens defined in this design system
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... rest of color system
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
```

#### React Component Example
```typescript
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  className?: string
}

export function FeatureCard({ 
  icon, 
  title, 
  description, 
  className 
}: FeatureCardProps) {
  return (
    <Card className={cn(
      "feature-card transition-all duration-200 hover:shadow-lg hover:border-accent-600 hover:-translate-y-1",
      className
    )}>
      <CardHeader>
        <div className="feature-card-icon">
          {icon}
        </div>
        <CardTitle className="feature-card-title">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="feature-card-description">
          {description}
        </p>
      </CardContent>
    </Card>
  )
}
```

### Theme Implementation

#### CSS Custom Properties Setup
```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Light theme colors */
    --background: 210 40% 98%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    /* ... rest of light theme */
  }

  .dark {
    /* Dark theme colors */
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    /* ... rest of dark theme */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

#### Theme Provider Component
```typescript
'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null
    if (stored) {
      setTheme(stored)
    }
  }, [])

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
```

### Performance Considerations

#### Asset Optimization
- Use next/image for optimized images
- Implement lazy loading for non-critical content
- Use CSS containment for performance isolation
- Minimize JavaScript bundle sizes

#### Critical CSS
```css
/* Inline critical CSS for above-the-fold content */
.header, .hero, .navigation {
  /* Critical styles here */
}

/* Load non-critical CSS asynchronously */
```

### Responsive Design
```css
/* Mobile-first responsive breakpoints */
.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 640px) {
  .responsive-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-6);
  }
}

@media (min-width: 1024px) {
  .responsive-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-8);
  }
}
```

---

## Conclusion

This design system provides a comprehensive foundation for building the Agentwise documentation website. It emphasizes:

- **Developer-centric user experience** with clear information hierarchy
- **Professional aesthetics** that build trust and credibility  
- **Modern technical implementation** using Shadcn UI and best practices
- **Full accessibility compliance** for inclusive design
- **Performance optimization** for fast loading and smooth interactions

The system is designed to scale with the product while maintaining consistency and usability across all touchpoints. Regular reviews and updates should be conducted to ensure the design system evolves with user needs and industry standards.

### Next Steps

1. **Implementation Phase**: Set up the base components and color system
2. **Content Creation**: Populate with Agentwise-specific content and examples
3. **Testing Phase**: Conduct usability testing and accessibility audits
4. **Documentation**: Create implementation guides for developers
5. **Maintenance**: Establish processes for design system updates and governance

*This design system serves as the single source of truth for all Agentwise documentation interface decisions.*