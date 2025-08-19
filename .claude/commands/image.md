---
command: image
description: Select an image for visual context to help solve problems or provide guidance
arguments:
  - name: description
    description: Describe what you need help with regarding the image
    required: false
---

# Image Context Command

This command allows you to select an image file (.png, .jpg, .jpeg, .webp, .gif, .svg, .bmp) from your file system to provide visual context for your request. The image won't be copied to your project - it will only be used as reference context.

## Usage

```bash
/image [description of what you need help with]
```

## Examples

```bash
# Select an image and describe the issue
/image fix the alignment issues in this UI screenshot

# Select a design mockup for implementation
/image implement this Figma design as a React component

# Debug visual issues
/image why does this chart look broken on mobile

# Get help understanding an error
/image explain this error message screenshot

# Convert design to code
/image create HTML/CSS based on this wireframe
```

## How It Works

1. **File Selection**: Opens your system file browser to select an image
2. **Context Loading**: Loads the image as visual context (not copied to project)
3. **Prompt Enhancement**: Your description is enhanced for clarity
4. **Agent Analysis**: Appropriate agents analyze the image and your request
5. **Solution Delivery**: Agents provide solution based on visual context

## Supported File Types

- **Images**: .png, .jpg, .jpeg, .webp, .gif, .svg, .bmp
- **Screenshots**: Any image format
- **Design Files**: Exported images from Figma, Sketch, etc.
- **Diagrams**: Architecture diagrams, flowcharts, wireframes
- **Error Screenshots**: Console errors, UI bugs, layout issues

## Agent Coordination

Based on your image and description, the appropriate specialists will be engaged:

- **Frontend Specialist**: UI/UX issues, component implementation, styling
- **Backend Specialist**: API errors, server logs, architecture diagrams  
- **Database Specialist**: Schema diagrams, query results, ER diagrams
- **DevOps Specialist**: Deployment errors, infrastructure diagrams
- **Testing Specialist**: Test results, coverage reports, bug screenshots

## Use Cases

### UI/UX Development
- "implement this button design with hover states"
- "match this color scheme in my components"
- "recreate this layout with responsive breakpoints"

### Debugging
- "fix this rendering issue in Safari"
- "why is this component overlapping"
- "debug this console error"

### Design to Code
- "convert this mockup to React components"
- "create this form with validation"
- "build this dashboard layout"

### Architecture Planning
- "implement this microservices architecture"
- "create database schema from this ER diagram"
- "set up CI/CD pipeline from this flow diagram"

## Privacy & Security

- Images are only read from their original location
- No files are copied to your project
- Image paths are not stored or logged
- Context is only used for the current session

## Tips

1. **Clear Descriptions**: Be specific about what you need help with
2. **High Quality**: Use clear, high-resolution images when possible
3. **Annotations**: Feel free to annotate images with arrows or notes
4. **Multiple Views**: For complex issues, you can run the command multiple times with different images
5. **Context Matters**: Include relevant code context in your description

## Integration with Agentwise

This command seamlessly integrates with Agentwise's orchestration system:
- Prompt enhancement ensures clarity
- Intelligent agent selection based on image content
- Parallel processing when multiple agents are needed
- Maintains project context while analyzing images

## Error Handling

If image selection fails or file type is unsupported, you'll receive:
- Clear error message
- Supported format list
- Alternative suggestions

The command ensures smooth workflow without disrupting your project structure.