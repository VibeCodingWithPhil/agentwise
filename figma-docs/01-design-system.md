# 01 - Design System & Foundation

## Important Design Note
**DO NOT CHANGE THE OVERALL DESIGN** - The website uses a Linear-inspired design that looks great. Maintain all existing design patterns, colors, spacing, and typography.

## Design System Overview

### Core Design Principles (Linear-Inspired)
- **Clean & Minimal**: Lots of whitespace, clear hierarchy
- **Glass Morphism**: Subtle transparency and blur effects
- **Gradient Accents**: Subtle gradients for emphasis
- **Dark Mode First**: Primary dark theme with light mode option
- **Smooth Animations**: Framer Motion for all transitions

### Color Palette
```css
/* Primary Colors */
--primary: #6366F1; /* Indigo */
--secondary: #8B5CF6; /* Purple */
--accent: #10B981; /* Emerald */

/* Dark Mode (Default) */
--background: #0F0F0F;
--surface: #1A1A1A;
--surface-hover: #252525;
--text-primary: #FFFFFF;
--text-secondary: #A3A3A3;
--text-muted: #737373;
--border: #2A2A2A;

/* Light Mode */
--background-light: #FFFFFF;
--surface-light: #F9FAFB;
--surface-hover-light: #F3F4F6;
--text-primary-light: #111827;
--text-secondary-light: #6B7280;
--text-muted-light: #9CA3AF;
--border-light: #E5E7EB;

/* Gradients */
--gradient-primary: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
--gradient-accent: linear-gradient(135deg, #10B981 0%, #34D399 100%);
--gradient-dark: linear-gradient(180deg, #0F0F0F 0%, #1A1A1A 100%);
```

### Typography
```css
/* Font Stack */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
--text-6xl: 3.75rem;   /* 60px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing System
```css
/* Spacing Scale (rem) */
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
```

### Border Radius
```css
--radius-sm: 0.25rem;   /* 4px */
--radius-md: 0.5rem;    /* 8px */
--radius-lg: 0.75rem;   /* 12px */
--radius-xl: 1rem;      /* 16px */
--radius-2xl: 1.5rem;   /* 24px */
--radius-full: 9999px;  /* Pill shape */
```

### Shadows (Glass Morphism)
```css
/* Dark Mode Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
--shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);

/* Glass Effect */
--glass-bg: rgba(26, 26, 26, 0.8);
--glass-border: rgba(255, 255, 255, 0.1);
--backdrop-blur: blur(10px);
```

### Animation Standards
```css
/* Transitions */
--transition-fast: 150ms ease;
--transition-base: 250ms ease;
--transition-slow: 350ms ease;

/* Animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes scale-in {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}
```

## Component Library

### Button Variants
1. **Primary**: Gradient background, white text
2. **Secondary**: Glass background, primary border
3. **Ghost**: Transparent, hover effect only
4. **Danger**: Red accent for destructive actions
5. **Success**: Green accent for confirmations

### Card Styles
1. **Glass Card**: Semi-transparent with blur
2. **Solid Card**: Opaque surface color
3. **Gradient Card**: Subtle gradient background
4. **Interactive Card**: Hover lift effect

### Form Elements
1. **Input Fields**: Glass effect with focus glow
2. **Selects**: Custom dropdown with animations
3. **Checkboxes**: Custom styled with transitions
4. **Radio Buttons**: Smooth selection animations
5. **Switches**: iOS-style toggle switches

### Navigation Components
1. **Header**: Fixed, glass effect, blur on scroll
2. **Sidebar**: Collapsible with smooth transitions
3. **Breadcrumbs**: Subtle with hover effects
4. **Tabs**: Underline or pill style
5. **Pagination**: Number or infinite scroll

### Feedback Elements
1. **Toasts**: Slide in from top-right
2. **Modals**: Center with backdrop blur
3. **Tooltips**: On hover with arrow
4. **Progress Bars**: Gradient fill animation
5. **Spinners**: Custom loading animations

## Responsive Breakpoints
```css
/* Mobile First Approach */
--screen-sm: 640px;   /* Small devices */
--screen-md: 768px;   /* Tablets */
--screen-lg: 1024px;  /* Desktops */
--screen-xl: 1280px;  /* Large desktops */
--screen-2xl: 1536px; /* Extra large */
```

## Accessibility Requirements
- **WCAG 2.1 AA Compliance**
- **Keyboard Navigation**: All interactive elements
- **Screen Reader Support**: Proper ARIA labels
- **Focus Indicators**: Visible focus states
- **Color Contrast**: Minimum 4.5:1 for text
- **Motion Preferences**: Respect prefers-reduced-motion

## Icon Library
- **Primary**: Lucide React (consistent with Linear)
- **Size Standards**: 16px, 20px, 24px
- **Stroke Width**: 1.5px or 2px
- **Color**: Inherit from parent text color

## Layout Grid
```css
/* Container */
--container-sm: 640px;
--container-md: 768px;
--container-lg: 1024px;
--container-xl: 1280px;
--container-2xl: 1536px;

/* Grid System */
--grid-cols: 12;
--gap: 1rem;
```

## Performance Guidelines
- **Lazy Loading**: Images and heavy components
- **Code Splitting**: Route-based splitting
- **Image Optimization**: WebP with fallbacks
- **Font Loading**: FOUT strategy
- **Animation Performance**: GPU-accelerated transforms

## Dark/Light Mode Implementation
```javascript
// Theme Context
const ThemeContext = {
  theme: 'dark' | 'light',
  toggleTheme: () => void,
  systemPreference: boolean
}

// CSS Variables Switch
[data-theme="dark"] { /* dark mode vars */ }
[data-theme="light"] { /* light mode vars */ }
```

## File Naming Convention
- **Components**: PascalCase (e.g., `UserDashboard.tsx`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Styles**: kebab-case (e.g., `user-dashboard.css`)
- **Assets**: kebab-case (e.g., `hero-background.svg`)

---

**Note**: This design system should be implemented consistently across all pages. Do not deviate from these standards unless specifically requested.