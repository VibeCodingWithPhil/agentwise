# 02 - Homepage

## Page Structure

### 1. Hero Section
**Design**: Full viewport height with gradient mesh background

```jsx
<section className="hero">
  {/* Animated gradient background */}
  <div className="gradient-mesh" />
  
  {/* Content */}
  <div className="container">
    <Badge>✨ Version 2.3.0 Released</Badge>
    <h1>Transform Development with Intelligent Automation</h1>
    <p>Multi-agent orchestration for Claude Code with 99.3% token reduction</p>
    
    {/* CTA Buttons */}
    <div className="cta-group">
      <Button variant="primary" size="lg">
        Get Started
        <ArrowRight />
      </Button>
      <Button variant="ghost" size="lg">
        View Documentation
      </Button>
    </div>
    
    {/* Stats Bar */}
    <div className="stats-bar glass">
      <Stat number="335,998+" label="Lines of Code" />
      <Stat number="8" label="AI Agents" />
      <Stat number="45" label="Commands" />
      <Stat number="99.3%" label="Token Reduction" />
    </div>
  </div>
  
  {/* Scroll indicator */}
  <ScrollIndicator />
</section>
```

**Animations**:
- Gradient mesh: Slow morphing animation
- Heading: Fade in + slide up on load
- Stats: Animated counting effect
- Scroll indicator: Bouncing arrow

### 2. Features Grid (Bento Box Style)
**Design**: Asymmetric grid layout like Linear

```jsx
<section className="features">
  <div className="container">
    <SectionHeader 
      title="Everything You Need"
      subtitle="Complete development automation in one platform"
    />
    
    <div className="bento-grid">
      {/* Large feature card */}
      <FeatureCard size="large" gradient="primary">
        <Icon name="wizard" />
        <h3>Project Wizard</h3>
        <p>One-command complete project setup</p>
        <CodePreview>
          /create-project "e-commerce platform"
        </CodePreview>
      </FeatureCard>
      
      {/* Medium cards */}
      <FeatureCard size="medium" gradient="accent">
        <Icon name="brain" />
        <h3>AI Requirements</h3>
        <p>Generate specs from ideas</p>
      </FeatureCard>
      
      {/* Small cards */}
      <FeatureCard size="small">
        <Icon name="database" />
        <h3>Database Integration</h3>
      </FeatureCard>
      
      {/* Continue pattern... */}
    </div>
  </div>
</section>
```

**Grid Layout**:
```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.large { grid-column: span 2; grid-row: span 2; }
.medium { grid-column: span 2; }
.small { grid-column: span 1; }
```

### 3. How It Works
**Design**: Three-step visual process

```jsx
<section className="how-it-works">
  <div className="container">
    <SectionHeader title="Simple as 1-2-3" />
    
    <div className="steps">
      <Step number="1" icon="idea">
        <h3>Describe Your Project</h3>
        <p>Tell Agentwise what you want to build</p>
      </Step>
      
      <AnimatedConnector />
      
      <Step number="2" icon="agents">
        <h3>Agents Plan & Build</h3>
        <p>AI agents work in parallel</p>
      </Step>
      
      <AnimatedConnector />
      
      <Step number="3" icon="rocket">
        <h3>Deploy to Production</h3>
        <p>Get production-ready code</p>
      </Step>
    </div>
  </div>
</section>
```

### 4. Live Demo Section
**Design**: Interactive terminal with real output

```jsx
<section className="live-demo">
  <div className="container">
    <SectionHeader title="See It In Action" />
    
    <div className="terminal-container glass">
      <TerminalHeader />
      <TerminalContent>
        <TypewriterEffect commands={[
          "$ /create-project 'task management app'",
          "🚀 Starting project creation...",
          "✅ Requirements generated",
          "✅ Database configured",
          "✅ 8 agents working..."
        ]} />
      </TerminalContent>
    </div>
    
    {/* Agent status visualization */}
    <AgentStatusGrid>
      <AgentCard name="Frontend" status="working" progress={67} />
      <AgentCard name="Backend" status="working" progress={45} />
      {/* More agents... */}
    </AgentStatusGrid>
  </div>
</section>
```

### 5. Testimonials
**Design**: Carousel with glassmorphism cards

```jsx
<section className="testimonials">
  <div className="container">
    <SectionHeader title="Loved by Developers" />
    
    <TestimonialCarousel>
      <TestimonialCard>
        <Quote>
          "Reduced our development time by 80%"
        </Quote>
        <Author 
          name="Sarah Chen"
          role="CTO at TechStart"
          avatar="/avatars/sarah.jpg"
        />
      </TestimonialCard>
    </TestimonialCarousel>
  </div>
</section>
```

### 6. Pricing/License Section
**Design**: Two-tier comparison

```jsx
<section className="pricing">
  <div className="container">
    <SectionHeader 
      title="Choose Your License"
      subtitle="Open source or commercial"
    />
    
    <div className="pricing-grid">
      <PricingCard tier="opensource">
        <h3>Open Source</h3>
        <Price>Free</Price>
        <Features>
          <li>✅ All features</li>
          <li>✅ Community support</li>
          <li>✅ MIT License</li>
        </Features>
        <Button variant="secondary">Get Started</Button>
      </PricingCard>
      
      <PricingCard tier="commercial" featured>
        <Badge>Most Popular</Badge>
        <h3>Commercial</h3>
        <Price>Contact Us</Price>
        <Features>
          <li>✅ Everything in Open Source</li>
          <li>✅ Priority support</li>
          <li>✅ Custom integrations</li>
          <li>✅ SLA guarantees</li>
        </Features>
        <Button variant="primary">Contact Sales</Button>
      </PricingCard>
    </div>
  </div>
</section>
```

### 7. CTA Section
**Design**: Gradient background with centered CTA

```jsx
<section className="cta gradient-bg">
  <div className="container">
    <h2>Ready to Transform Your Development?</h2>
    <p>Join thousands of developers building faster with Agentwise</p>
    <div className="cta-buttons">
      <Button size="lg" variant="white">
        Start Building
      </Button>
      <Button size="lg" variant="ghost-white">
        Schedule Demo
      </Button>
    </div>
  </div>
</section>
```

## Page-Specific Animations

### Scroll Animations (Framer Motion)
```javascript
// Fade in on scroll
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 }
}

// Stagger children
const staggerContainer = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.1
    }
  }
}
```

### Interactive Elements
- **Hover Effects**: Scale and glow on feature cards
- **Parallax**: Subtle parallax on scroll for depth
- **Mouse Follow**: Gradient follows cursor in hero
- **Loading States**: Skeleton screens for dynamic content

## Responsive Behavior

### Mobile (< 768px)
- Single column layout
- Simplified animations
- Touch-friendly tap targets
- Collapsed navigation

### Tablet (768px - 1024px)
- Two column grid
- Reduced spacing
- Medium animations

### Desktop (> 1024px)
- Full grid layout
- All animations enabled
- Hover states active

## Performance Optimizations
- Lazy load images below fold
- Defer non-critical JavaScript
- Optimize hero gradient (CSS only)
- Use Intersection Observer for animations

## SEO Metadata
```html
<title>Agentwise - AI Multi-Agent Development Platform</title>
<meta name="description" content="Transform development with intelligent automation. 8 AI agents, 99.3% token reduction, complete project setup in minutes." />
<meta property="og:image" content="/og-image.png" />
```

## Accessibility
- Skip to main content link
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Focus trap in modals

---

**Note**: The homepage is the most important page. It should load fast, look stunning, and clearly communicate value proposition.