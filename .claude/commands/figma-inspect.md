# /figma-inspect

Analyze and inspect Figma designs to understand structure, extract information, and prepare for code generation.

## Usage

```bash
/figma-inspect                      # Inspect current selection
/figma-inspect <file-id>           # Inspect specific file
/figma-inspect --deep              # Deep analysis with all details
/figma-inspect --components        # Focus on component analysis
/figma-inspect --report           # Generate detailed report
```

## Description

This command provides deep insights into Figma designs, analyzing structure, identifying patterns, extracting assets, and preparing comprehensive data for code generation.

## Inspection Modes

### Quick Inspect
```bash
/figma-inspect
```
Shows:
- File overview
- Page structure
- Component count
- Token summary
- Complexity score

### Deep Analysis
```bash
/figma-inspect --deep
```
Provides:
- Complete node tree
- All properties
- Style definitions
- Component relationships
- Asset inventory

### Component Analysis
```bash
/figma-inspect --components
```
Analyzes:
- Component hierarchy
- Variant structure
- Props and states
- Instance usage
- Override patterns

## Analysis Reports

### Structure Report
```
📁 Mobile App Design
├── 📄 Pages (3)
│   ├── 🎨 Design System
│   │   ├── Components (45)
│   │   ├── Tokens (120)
│   │   └── Icons (80)
│   ├── 📱 Screens
│   │   ├── Onboarding (5)
│   │   ├── Authentication (4)
│   │   ├── Dashboard (8)
│   │   └── Settings (6)
│   └── 🔄 Prototypes
│       ├── User Flow A
│       └── User Flow B
```

### Component Report
```
Component Analysis:
==================
✓ 45 Components detected
✓ 12 Component sets
✓ 156 Component instances
✓ 23 Variants per component (avg)

Top Components:
1. Button (42 instances)
2. Card (28 instances)
3. Input (24 instances)
4. Modal (12 instances)
5. Navigation (8 instances)

Complexity: Medium (Score: 6.5/10)
```

### Design System Report
```
Design System Analysis:
======================
Colors:
  Primary:   6 shades
  Secondary: 4 shades
  Neutral:   10 shades
  Semantic:  8 colors
  Total:     28 colors

Typography:
  Families:  2 (Inter, SF Pro)
  Styles:    12 text styles
  Sizes:     8 (12px - 48px)

Spacing:
  Scale:     8 values
  Pattern:   4px base unit

Effects:
  Shadows:   6 definitions
  Blurs:     3 types
```

## Pattern Detection

### UI Patterns
Automatically detects:
- Navigation patterns
- Form layouts
- Card designs
- List views
- Modal dialogs
- Tab interfaces

### Design Patterns
Identifies:
- Grid systems
- Color schemes
- Typography scales
- Spacing rhythms
- Component patterns

### Application Patterns
Recognizes:
- Authentication flows
- Dashboard layouts
- E-commerce patterns
- Social media designs
- Content management

## Asset Extraction

### Export Assets
```bash
/figma-inspect --export-assets
```
Extracts:
- Images (PNG, JPG, SVG)
- Icons (SVG, Icon fonts)
- Logos (Multiple formats)
- Illustrations
- Backgrounds

### Asset Organization
```
assets/
├── images/
│   ├── hero-banner.png
│   ├── hero-banner@2x.png
│   └── hero-banner.webp
├── icons/
│   ├── arrow-left.svg
│   ├── arrow-right.svg
│   └── sprite.svg
└── logos/
    ├── logo.svg
    ├── logo-dark.svg
    └── favicon.ico
```

## Code Readiness Analysis

### Implementation Complexity
```bash
/figma-inspect --complexity
```
Evaluates:
- Component complexity
- Animation requirements
- Interaction density
- State management needs
- API requirements

### Technology Recommendations
```bash
/figma-inspect --recommend-stack
```
Suggests:
```
Based on design analysis:
========================
Frontend:  React + TypeScript
  Reason:  Complex component hierarchy
  
Styling:   Tailwind CSS
  Reason:  Utility-first patterns detected
  
State:     Zustand
  Reason:  Moderate state complexity
  
Backend:   Node.js + Express
  Reason:  Form submissions detected
  
Database:  PostgreSQL
  Reason:  Structured data patterns
```

## Interactive Exploration

### Node Browser
```bash
/figma-inspect --interactive
```
Navigate through:
- Browse node tree
- Inspect properties
- View styles
- Check constraints
- Preview assets

### Property Inspector
```bash
/figma-inspect node:123:456
```
Shows:
```
Node: PrimaryButton
Type: COMPONENT
Properties:
  - Width: 120px (FIXED)
  - Height: 48px (HUG_CONTENTS)
  - Padding: 12px 24px
  - Background: #3B82F6
  - Border Radius: 8px
  - Text: "Click me"
  - Font: Inter Medium 16px
Constraints:
  - Horizontal: CENTER
  - Vertical: TOP
```

## Design Validation

### Consistency Check
```bash
/figma-inspect --validate
```
Checks for:
- Inconsistent spacing
- Off-brand colors
- Typography mismatches
- Component variations
- Naming conventions

### Accessibility Audit
```bash
/figma-inspect --a11y
```
Evaluates:
- Color contrast ratios
- Touch target sizes
- Text readability
- Focus indicators
- ARIA considerations

## Export Formats

### JSON Export
```bash
/figma-inspect --export=json
```
Complete design data in JSON

### Markdown Report
```bash
/figma-inspect --export=markdown
```
Human-readable documentation

### CSV Data
```bash
/figma-inspect --export=csv
```
Tabular data for analysis

### Design Tokens
```bash
/figma-inspect --export=tokens
```
Design tokens in various formats:
- CSS variables
- JSON tokens
- SCSS variables
- JS constants

## Integration Data

### Component Mapping
```bash
/figma-inspect --map-components
```
Creates mapping between:
- Figma components → Code components
- Design props → Component props
- Variants → Component states

### API Schema
```bash
/figma-inspect --infer-api
```
Infers from designs:
- Data models
- API endpoints
- Request/Response shapes
- Relationships

## Performance Metrics

```bash
/figma-inspect --performance
```
Analyzes:
- Asset sizes
- Component count
- Complexity score
- Estimated build size
- Rendering performance

## Examples

### Quick Overview
```bash
/figma-inspect file_ABC123
# Shows file summary and structure
```

### Full Analysis Report
```bash
/figma-inspect --deep --report --export=markdown
# Generates comprehensive analysis document
```

### Component Library Audit
```bash
/figma-inspect --components --validate
# Analyzes component library quality
```

### Pre-Generation Check
```bash
/figma-inspect --code-ready --recommend-stack
# Validates design is ready for code generation
```

## Cache Management

Inspection results are cached:
```bash
/figma-inspect --cache       # Use cached data
/figma-inspect --refresh     # Force fresh analysis
/figma-inspect --clear-cache # Clear cache
```

## Next Steps

After inspection:
1. Select specific nodes: `/figma-select`
2. Generate code: `/figma-generate`
3. Create application: `/figma-create`
4. Set up sync: `/figma-sync`