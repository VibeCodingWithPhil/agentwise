# Generate Project Requirements

Generate comprehensive project requirements from a project idea using AgentWise's intelligent requirements generation system.

## Description

This command creates detailed, structured requirements for software projects using AI-powered analysis. It generates features, tech stack recommendations, timeline estimates, team structure, and more based on your project description.

## Usage

Simply describe your project idea and any specific constraints or preferences you have. The system will generate:
- Detailed feature breakdown with priorities and estimates
- Technology stack recommendations
- Project timeline and phases
- Team structure and roles
- Database schema (if applicable)
- Architecture patterns
- Deployment considerations
- Testing strategies

## Examples

**Web Application:**
```
I want to build a task management application where teams can collaborate on projects, assign tasks, track progress, and generate reports. It should have real-time updates, file attachments, and integration with popular tools like Slack and GitHub.
```

**E-commerce Platform:**
```
Create an e-commerce platform for small businesses with product catalog, shopping cart, payment processing, order management, and basic analytics. Should be mobile-friendly and easy to customize.
```

**API Service:**
```
Build a RESTful API for managing customer data with authentication, CRUD operations, data validation, rate limiting, and comprehensive logging. Need to handle 10,000+ requests per day.
```

## Additional Context

You can provide additional context to get more tailored requirements:

**Budget Constraints:**
- "Budget under $50k" 
- "Enterprise budget available"

**Timeline Constraints:**
- "Need to launch in 3 months"
- "Have 6-month timeline"

**Team Constraints:**
- "Solo developer project"
- "Team of 5 developers available"

**Technology Preferences:**
- "Must use React and Node.js"
- "Prefer cloud-native solutions"
- "Avoid Microsoft technologies"

**Performance Requirements:**
- "Expecting 100,000 users"
- "Response time under 100ms"
- "Handle 1TB of data"

**Compliance Requirements:**
- "Must be GDPR compliant"
- "HIPAA compliance needed"
- "SOC 2 requirements"

## Output

The system will generate:

1. **Project Overview** - Summary, complexity, and key metrics
2. **Features** - Detailed breakdown with priorities, estimates, and acceptance criteria
3. **Technology Stack** - Frontend, backend, database, and tooling recommendations
4. **Architecture** - System design patterns and structure
5. **Timeline** - Project phases, milestones, and delivery schedule
6. **Team** - Roles, responsibilities, and skill requirements
7. **Database** - Schema design and configuration (if applicable)
8. **Deployment** - Infrastructure and deployment strategy
9. **Testing** - Testing strategy and tools
10. **Constraints & Risks** - Project limitations and risk mitigation

## Follow-up Commands

After generating requirements, you can use these related commands:

- `requirements-enhance` - Enhance existing requirements with additional features
- `requirements-visualize` - Create visual specification documents
- `requirements-to-tasks` - Convert requirements into development tasks
- `requirements-validate` - Validate and score requirements quality

## Tips

- Be as specific as possible about your project vision
- Include target users and use cases
- Mention any existing systems or integrations needed
- Specify non-functional requirements (performance, security, etc.)
- Include business constraints and success criteria

The more context you provide, the more accurate and tailored your requirements will be!