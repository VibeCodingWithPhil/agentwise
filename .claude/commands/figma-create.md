# /figma-create

Create a complete, production-ready application from Figma designs with full backend integration and deployment configuration.

## Usage

```bash
/figma-create <project-name>           # Create full application
/figma-create <project-name> <file-id> # Create from specific file
/figma-create --from-selection         # Create from current selection
/figma-create --plan                   # Plan before creating
```

## Description

This command orchestrates Agentwise's multi-agent system to create a complete application from Figma designs. It generates pixel-perfect frontend code, implements backend logic, sets up databases, and configures deployment—all based on your design.

## Workflow

### 1. Design Analysis Phase
```bash
/figma-create my-app --analyze
```
- Analyzes entire Figma file
- Identifies application structure
- Detects components and patterns
- Infers functionality from design
- Determines tech stack

### 2. Planning Phase
```bash
/figma-create my-app --plan
```
- Creates project specification
- Assigns specialized agents
- Generates phase breakdown
- Estimates timeline
- Identifies requirements

### 3. Generation Phase
```bash
/figma-create my-app --generate
```
- Frontend code generation
- Backend implementation
- Database schema creation
- API development
- Testing suite

### 4. Integration Phase
```bash
/figma-create my-app --integrate
```
- Connects frontend to backend
- Sets up authentication
- Implements data flow
- Configures deployment

## Intelligent Context Understanding

### Design Pattern Recognition
The system recognizes common patterns:
- **Authentication**: Login/signup screens → Auth system
- **Dashboard**: Data displays → API + Database
- **E-commerce**: Product cards → Shopping cart logic
- **Social**: Feed layouts → Real-time updates
- **Forms**: Input fields → Validation + Submission

### Automatic Feature Detection
From design elements, infers:
- User authentication needs
- Database requirements
- API endpoints
- State management
- Real-time features
- Payment processing
- File uploads

## Full Stack Generation

### Frontend Features
- **Pixel-Perfect UI**: 100% design accuracy
- **Responsive Design**: All breakpoints
- **Interactions**: Hover, click, animations
- **Routing**: Navigation from design flow
- **State Management**: Redux/Zustand/Context
- **Forms**: Validation and submission
- **Dark Mode**: If designed

### Backend Features
- **API Layer**: RESTful or GraphQL
- **Authentication**: JWT/OAuth/Magic Links
- **Database**: PostgreSQL/MongoDB/MySQL
- **File Storage**: S3/Cloudinary integration
- **Email Service**: SendGrid/Postmark
- **Payment**: Stripe/PayPal integration
- **WebSockets**: Real-time features

### Infrastructure
- **Docker**: Containerization
- **CI/CD**: GitHub Actions/GitLab CI
- **Monitoring**: Sentry/LogRocket
- **Analytics**: Google Analytics/Mixpanel
- **CDN**: CloudFlare/Fastly
- **SSL**: Let's Encrypt

## Tech Stack Selection

### Automatic Selection
Based on design analysis:
```bash
/figma-create my-app --auto-stack
```

### Manual Override
```bash
/figma-create my-app \
  --frontend=next \
  --backend=fastapi \
  --database=postgres \
  --hosting=vercel
```

### Popular Stacks

#### MEAN Stack
```bash
/figma-create my-app --stack=mean
```
- MongoDB, Express, Angular, Node.js

#### MERN Stack
```bash
/figma-create my-app --stack=mern
```
- MongoDB, Express, React, Node.js

#### T3 Stack
```bash
/figma-create my-app --stack=t3
```
- TypeScript, Next.js, Prisma, tRPC, Tailwind

#### JAMstack
```bash
/figma-create my-app --stack=jamstack
```
- JavaScript, APIs, Markup

## Context-Aware Backend

### From Login Screen
Generates:
```javascript
// Authentication system
POST /api/auth/login
POST /api/auth/register
POST /api/auth/logout
GET  /api/auth/me

// User management
GET    /api/users/:id
PUT    /api/users/:id
DELETE /api/users/:id
```

### From Dashboard
Generates:
```javascript
// Analytics endpoints
GET /api/analytics/overview
GET /api/analytics/charts
GET /api/analytics/export

// Real-time updates
WebSocket /ws/dashboard
```

### From E-commerce Design
Generates:
```javascript
// Product management
GET  /api/products
POST /api/cart/add
POST /api/checkout
GET  /api/orders

// Payment integration
POST /api/payments/intent
POST /api/payments/confirm
```

## Agent Orchestration

### Phase 1: Analysis & Planning
- **Research Agent**: Analyzes design patterns
- **Designer Agent**: Validates design system
- **Frontend Agent**: Plans component architecture
- **Backend Agent**: Designs API structure

### Phase 2: Implementation
- **Frontend Agent**: Builds UI components
- **Backend Agent**: Creates API and database
- **Database Agent**: Sets up schema
- **Testing Agent**: Writes test suites

### Phase 3: Integration
- **DevOps Agent**: Configures deployment
- **Testing Agent**: Runs integration tests
- **Security Agent**: Audits application
- **Documentation Agent**: Creates docs

## Examples

### Create SaaS Application
```bash
# Select Figma file with dashboard designs
/figma-select file_SAAS123

# Create full application
/figma-create saas-platform \
  --backend=fullstack \
  --auth=auth0 \
  --payments=stripe \
  --database=postgres
```

### Create Mobile App Backend
```bash
# Select mobile app designs
/figma-select file_MOBILE456 --frames="Mobile/*"

# Create API backend
/figma-create mobile-backend \
  --frontend=react-native \
  --backend=fastapi \
  --realtime=websocket
```

### Create E-commerce Site
```bash
# Select e-commerce designs
/figma-select file_SHOP789

# Create complete store
/figma-create my-store \
  --stack=mern \
  --payments=stripe \
  --email=sendgrid \
  --cdn=cloudflare
```

## Smart Context Features

### Component Context
```bash
/figma-create my-app --component-context
```
- Maps design components to code
- Preserves component relationships
- Maintains design system

### Data Context
```bash
/figma-create my-app --data-context
```
- Infers data models from designs
- Creates appropriate schemas
- Sets up relationships

### User Flow Context
```bash
/figma-create my-app --flow-context
```
- Maps screen flows to routes
- Implements navigation logic
- Sets up state transitions

## Output Structure

```
workspace/my-app/
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/
│   ├── api/
│   ├── models/
│   ├── services/
│   └── requirements.txt
├── database/
│   ├── migrations/
│   └── schema.sql
├── infrastructure/
│   ├── docker/
│   ├── k8s/
│   └── terraform/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── API.md
│   ├── SETUP.md
│   └── DEPLOYMENT.md
├── .env.example
├── docker-compose.yml
└── README.md
```

## Quality Assurance

### Automatic Testing
- Unit tests for components
- API endpoint tests
- Integration tests
- E2E test scenarios

### Code Quality
- ESLint/Prettier configured
- TypeScript strict mode
- Security scanning
- Performance auditing

### Documentation
- API documentation
- Component storybook
- Setup instructions
- Deployment guide

## Deployment Options

### Vercel
```bash
/figma-create my-app --deploy=vercel
```

### AWS
```bash
/figma-create my-app --deploy=aws
```

### Google Cloud
```bash
/figma-create my-app --deploy=gcp
```

### Self-Hosted
```bash
/figma-create my-app --deploy=docker
```

## Advanced Options

### Monorepo Setup
```bash
/figma-create my-app --monorepo
```

### Microservices
```bash
/figma-create my-app --architecture=microservices
```

### Progressive Web App
```bash
/figma-create my-app --pwa
```

### Serverless
```bash
/figma-create my-app --serverless
```

## Success Metrics

After creation:
- ✅ 100% design fidelity
- ✅ All screens implemented
- ✅ Backend fully functional
- ✅ Database configured
- ✅ Tests passing
- ✅ Ready to deploy

## Next Steps

1. Review generated code: `/figma-review`
2. Run tests: `npm test`
3. Start development: `npm run dev`
4. Deploy: `/figma-deploy`
5. Monitor: `/figma-monitor`