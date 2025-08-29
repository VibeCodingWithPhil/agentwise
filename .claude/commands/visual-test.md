# /visual-test

Perform visual testing and validation of frontend implementations using Playwright MCP browser automation.

## Usage

```bash
/visual-test                          # Test current development server
/visual-test <url>                    # Test specific URL
/visual-test --responsive             # Test all viewports
/visual-test --flow <flow-name>       # Test user flow
/visual-test --review                 # Comprehensive design review
/visual-test --fix                    # Auto-fix detected issues
```

## Description

This command uses Playwright MCP to perform visual testing, ensuring that frontend implementations match design specifications and work correctly across devices and browsers.

## Prerequisites

### Install Playwright MCP
```bash
claude mcp add @modelcontextprotocol/server-playwright
```

### Verify Installation
```bash
claude mcp list
# Should show: playwright (21 tools available)
```

## Testing Modes

### 1. Quick Visual Check
```bash
/visual-test
```
- Tests current development server (localhost:3000)
- Takes screenshots of main pages
- Checks for console errors
- Reports basic issues

### 2. Responsive Testing
```bash
/visual-test --responsive
```
Tests across all viewports:
- **Mobile**: 375 x 812px (iPhone X)
- **Tablet**: 768 x 1024px (iPad)
- **Desktop**: 1440 x 900px (MacBook)
- **Wide**: 1920 x 1080px (Full HD)

### 3. User Flow Testing
```bash
/visual-test --flow login
/visual-test --flow checkout
/visual-test --flow onboarding
```
Tests complete user journeys:
- Navigation between pages
- Form interactions
- State changes
- Error handling

### 4. Comprehensive Design Review
```bash
/visual-test --review
```
Performs full design validation:
- All interactive states
- Responsive design
- Accessibility checks
- Performance metrics
- Cross-browser testing

### 5. Auto-Fix Mode
```bash
/visual-test --fix
```
Automatically fixes common issues:
- Responsive layout problems
- Missing alt text
- Color contrast issues
- Z-index conflicts
- Console errors

## Visual Testing Workflow

### Step 1: Initial Setup
```javascript
// Navigate to application
playwright_navigate('http://localhost:3000')

// Set viewport for testing
playwright_setViewport(1440, 900)

// Take baseline screenshot
playwright_screenshot('homepage-baseline')
```

### Step 2: Interaction Testing
```javascript
// Test navigation
playwright_click('[data-testid="nav-products"]')
playwright_waitForSelector('.product-grid')
playwright_screenshot('products-page')

// Test form interaction
playwright_click('[data-testid="search-input"]')
playwright_type('[data-testid="search-input"]', 'test query')
playwright_press('Enter')
playwright_screenshot('search-results')
```

### Step 3: Responsive Validation
```javascript
// Mobile viewport
playwright_setViewport(375, 812)
playwright_screenshot('mobile-view')

// Check for overflow
const hasOverflow = playwright_evaluate(`
  document.body.scrollWidth > window.innerWidth
`)

if (hasOverflow) {
  // Fix responsive issue
}
```

### Step 4: Error Checking
```javascript
// Get console errors
const consoleErrors = playwright_getConsole()
  .filter(msg => msg.type === 'error')

// Get network failures
const networkErrors = playwright_getNetwork()
  .filter(req => req.status >= 400)

// Report issues
if (consoleErrors.length > 0) {
  console.log('Console errors detected:', consoleErrors)
}
```

## Testing Scenarios

### Login Flow
```bash
/visual-test --flow login --data user@example.com:password123
```
Tests:
1. Navigate to login page
2. Enter credentials
3. Submit form
4. Verify successful login
5. Check dashboard loads

### E-commerce Checkout
```bash
/visual-test --flow checkout
```
Tests:
1. Add item to cart
2. Navigate to checkout
3. Fill shipping details
4. Enter payment info
5. Complete purchase

### Responsive Navigation
```bash
/visual-test --responsive --focus navigation
```
Tests:
1. Desktop menu
2. Tablet menu
3. Mobile hamburger menu
4. Menu interactions

## Validation Checks

### Visual Consistency
- Layout alignment
- Spacing consistency
- Color accuracy
- Typography rendering
- Image display

### Responsive Design
- No horizontal overflow
- Readable text sizes
- Touch target sizes
- Flexible layouts
- Proper breakpoints

### Accessibility
- Color contrast (WCAG AA)
- Keyboard navigation
- Focus indicators
- ARIA labels
- Screen reader support

### Performance
- Load time < 3s
- FCP < 1.5s
- LCP < 2.5s
- CLS < 0.1
- No render blocking

## Output & Reports

### Screenshot Storage
```
.playwright/
├── screenshots/
│   ├── baseline/
│   ├── current/
│   └── diff/
├── reports/
│   ├── visual-test-report.html
│   └── visual-test-report.json
└── videos/
    └── test-recording.mp4
```

### Report Format
```json
{
  "timestamp": "2025-01-10T10:00:00Z",
  "url": "http://localhost:3000",
  "passed": false,
  "issues": [
    {
      "type": "responsive",
      "severity": "major",
      "viewport": "mobile",
      "description": "Sidebar overlaps content",
      "screenshot": "mobile-issue-001.png"
    }
  ],
  "metrics": {
    "loadTime": 2300,
    "fcp": 1200,
    "lcp": 2100
  }
}
```

## Integration with Agents

### Automatic Testing
All frontend agents automatically perform visual testing after changes:

```javascript
// Agent makes UI change
await implementFeature()

// Automatic visual validation
await visualTest.quickCheck()

// If issues found, auto-fix
if (issues.length > 0) {
  await visualTest.autoFix(issues)
}
```

### Design Review Agent
For comprehensive testing:
```bash
@design-review-specialist Please review the current implementation
```

## Common Issues & Fixes

### Responsive Problems
```javascript
// Issue: Content overflow on mobile
// Fix: Add responsive CSS
.container {
  max-width: 100%;
  overflow-x: hidden;
}
```

### Console Errors
```javascript
// Issue: Undefined variable error
// Fix: Add null check
if (element) {
  element.addEventListener('click', handler)
}
```

### Accessibility Issues
```javascript
// Issue: Missing alt text
// Fix: Add descriptive alt
<img src="product.jpg" alt="Product name - front view">

// Issue: Low contrast
// Fix: Adjust colors
color: #333333; // Instead of #666666
```

## Advanced Options

### Custom Viewport
```bash
/visual-test --viewport 1024x768
```

### Specific Pages
```bash
/visual-test --pages "/home,/about,/contact"
```

### Browser Selection
```bash
/visual-test --browser chrome,firefox,safari
```

### Network Throttling
```bash
/visual-test --network slow-3g
```

### Generate Video
```bash
/visual-test --record
```

## Best Practices

1. **Test Early**: Run visual tests during development
2. **Test Often**: Validate after each change
3. **Test Completely**: Cover all user flows
4. **Fix Immediately**: Address issues as found
5. **Document Issues**: Keep record of problems
6. **Automate Tests**: Create reusable scenarios

## Troubleshooting

### Playwright MCP Not Connected
```bash
# Restart Claude Code
# Reinstall MCP
claude mcp remove playwright
claude mcp add @modelcontextprotocol/server-playwright
```

### Screenshots Not Capturing
```bash
# Check server is running
# Verify URL is accessible
# Ensure viewport is set
```

### Tests Timing Out
```bash
# Increase timeout
/visual-test --timeout 30000
```

## Next Steps

After visual testing:
1. Review screenshot evidence
2. Fix identified issues
3. Re-run tests to verify
4. Document changes
5. Commit validated code