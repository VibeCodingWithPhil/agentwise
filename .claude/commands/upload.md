# Upload Command

Upload documents, PDFs, and design files for context and conversion to Agentwise projects.

## Usage
```
/upload <file_path> [conversion_type]
```

## Supported File Types

### Documents
- `.pdf` - PDF documents
- `.doc`, `.docx` - Microsoft Word documents  
- `.txt` - Plain text files
- `.md` - Markdown files
- `.rtf` - Rich text format

### Design Files
- `.fig`, `.figma` - Figma design files
- `.sketch` - Sketch design files (coming soon)
- `.xd` - Adobe XD files (coming soon)

## Conversion Types

### For Documents
- `spec` - Convert to project specification
- `requirements` - Extract requirements
- `context` - Use as project context
- `documentation` - Convert to project docs

### For Design Files
- `components` - Extract and build components
- `full-app` - Build complete application from design
- `styles` - Extract design tokens and styles only
- `prototype` - Create interactive prototype

## Examples

### Upload Project Specification
```
/upload ./requirements.pdf spec
```
Converts PDF requirements into Agentwise project specifications.

### Upload Figma Design
```
/upload ./app-design.fig components
```
Extracts all components from Figma file and generates React/Vue components.

### Upload Word Document
```
/upload ./project-brief.docx context
```
Uses document as context for project creation.

## Figma Integration Features

When uploading Figma files, the system will:

1. **Component Extraction**
   - Identify all components and variants
   - Extract component properties and states
   - Preserve component hierarchy

2. **Style Extraction**
   - Colors, typography, spacing
   - Effects (shadows, blurs, etc.)
   - Design tokens generation

3. **Layout Analysis**
   - Grid systems and constraints
   - Responsive behavior
   - Auto-layout properties

4. **Asset Handling**
   - Export images and icons
   - Generate SVG components
   - Optimize assets

5. **Animation Detection**
   - Micro-interactions
   - Transitions
   - Prototype flows

## Output Structure

```
project/
├── components/
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Layout.tsx
├── styles/
│   ├── tokens.css
│   ├── theme.ts
│   └── globals.css
├── assets/
│   ├── icons/
│   └── images/
└── docs/
    └── design-system.md
```

## Integration with Agents

The uploaded content is automatically distributed to relevant agents:

- **Designer Specialist**: Processes design files
- **Frontend Specialist**: Implements components
- **Backend Specialist**: Creates APIs for dynamic content
- **Testing Specialist**: Generates tests for components

## Best Practices

1. **File Preparation**
   - Organize Figma files with clear component names
   - Use consistent naming conventions
   - Include component descriptions

2. **Conversion Options**
   - Start with `components` for gradual implementation
   - Use `full-app` for complete projects
   - Extract `styles` first for design system setup

3. **Mock Data Handling**
   - Mock data is preserved for testing
   - Real data integration points are marked
   - API stubs are generated automatically

## Advanced Options

### Custom Configuration
Create `.agentwise-upload.json`:
```json
{
  "figma": {
    "componentPrefix": "AG",
    "framework": "react",
    "typescript": true,
    "cssFramework": "tailwind",
    "exportFormat": "components"
  },
  "documents": {
    "extractImages": true,
    "preserveFormatting": false,
    "generateOutline": true
  }
}
```

## Troubleshooting

### Large Files
- Files over 50MB are processed in chunks
- Progress indicator shows processing status
- Partial results available during processing

### Figma Access
- Ensure Figma file is accessible
- Use Figma API token for private files
- Check network connectivity

### Conversion Issues
- Verify file format is supported
- Check file isn't corrupted
- Review error logs for details