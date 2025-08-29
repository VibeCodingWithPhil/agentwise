/**
 * Design Principles
 * Core design system and principles that all agents follow for UI development
 */

export const DesignPrinciples = {
  // Layout & Spacing
  spacing: {
    unit: 4, // Base spacing unit in pixels
    scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64],
    containerPadding: {
      mobile: 16,
      tablet: 24,
      desktop: 32
    },
    sectionSpacing: {
      mobile: 32,
      tablet: 48,
      desktop: 64
    }
  },

  // Typography
  typography: {
    fontFamily: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      secondary: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
      mono: "'SF Mono', 'Monaco', 'Inconsolata', 'Fira Code', monospace"
    },
    scale: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
      loose: 2
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },

  // Colors
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a'
    },
    neutral: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b'
    },
    semantic: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  },

  // Breakpoints
  breakpoints: {
    mobile: 375,
    tablet: 768,
    desktop: 1440,
    wide: 1920
  },

  // Borders
  borders: {
    radius: {
      none: 0,
      sm: 4,
      base: 8,
      md: 12,
      lg: 16,
      xl: 24,
      full: 9999
    },
    width: {
      none: 0,
      thin: 1,
      base: 2,
      thick: 4
    }
  },

  // Shadows
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },

  // Animation
  animation: {
    duration: {
      instant: 0,
      fast: 150,
      base: 250,
      slow: 350,
      slower: 500
    },
    easing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out'
    }
  },

  // Component Guidelines
  components: {
    button: {
      minHeight: 44, // Touch target minimum
      padding: '12px 24px',
      borderRadius: 8,
      fontSize: 16,
      fontWeight: 500
    },
    input: {
      minHeight: 44,
      padding: '12px 16px',
      borderRadius: 8,
      fontSize: 16
    },
    card: {
      padding: 24,
      borderRadius: 12,
      shadow: 'base'
    },
    modal: {
      maxWidth: 600,
      padding: 32,
      borderRadius: 16,
      overlay: 'rgba(0, 0, 0, 0.5)'
    }
  },

  // Accessibility
  accessibility: {
    minTouchTarget: 44,
    minContrastRatio: {
      normal: 4.5,
      large: 3
    },
    focusOutline: '2px solid #3b82f6',
    focusOffset: 2
  },

  // Performance
  performance: {
    maxLoadTime: 3000,
    maxFirstContentfulPaint: 1500,
    maxLargestContentfulPaint: 2500,
    maxTotalBlockingTime: 300,
    maxCumulativeLayoutShift: 0.1
  }
};

/**
 * Validation rules for visual testing
 */
export const ValidationRules = {
  responsive: {
    // Check if element fits within viewport
    fitInViewport: (element: any, viewport: { width: number; height: number }) => {
      return element.width <= viewport.width && element.height <= viewport.height;
    },
    
    // Check for horizontal overflow
    noHorizontalScroll: (bodyWidth: number, viewportWidth: number) => {
      return bodyWidth <= viewportWidth;
    },
    
    // Check text readability
    readableText: (fontSize: number, viewport: string) => {
      const minSizes = { mobile: 14, tablet: 14, desktop: 16 };
      return fontSize >= minSizes[viewport as keyof typeof minSizes];
    }
  },

  accessibility: {
    // Check color contrast
    sufficientContrast: (contrast: number, isLargeText: boolean) => {
      return isLargeText ? contrast >= 3 : contrast >= 4.5;
    },
    
    // Check touch target size
    adequateTouchTarget: (width: number, height: number) => {
      return width >= 44 && height >= 44;
    },
    
    // Check for alt text
    hasAltText: (image: any) => {
      return image.alt && image.alt.length > 0;
    }
  },

  performance: {
    // Check image optimization
    optimizedImage: (image: any) => {
      return image.loading === 'lazy' || image.srcset || image.format === 'webp';
    },
    
    // Check bundle size
    acceptableBundleSize: (size: number) => {
      return size < 500000; // 500KB
    },
    
    // Check render blocking resources
    noRenderBlocking: (resource: any) => {
      return resource.async || resource.defer || resource.media;
    }
  }
};

/**
 * Design compliance checklist
 */
export const ComplianceChecklist = {
  layout: [
    'Consistent spacing using 4px grid',
    'Proper container padding for each breakpoint',
    'Section spacing follows guidelines',
    'No horizontal overflow on any viewport'
  ],
  
  typography: [
    'Using approved font families',
    'Font sizes follow scale',
    'Line height provides readability',
    'Font weights are consistent'
  ],
  
  colors: [
    'Using colors from palette',
    'Semantic colors for states',
    'Sufficient color contrast',
    'Dark mode compatibility'
  ],
  
  responsive: [
    'Mobile-first implementation',
    'All breakpoints tested',
    'Touch targets adequate on mobile',
    'Images responsive'
  ],
  
  accessibility: [
    'Keyboard navigable',
    'Screen reader compatible',
    'ARIA labels present',
    'Focus indicators visible',
    'Color contrast passes WCAG AA'
  ],
  
  performance: [
    'Load time under 3 seconds',
    'Images lazy loaded',
    'CSS/JS optimized',
    'No layout shifts'
  ]
};

export default DesignPrinciples;