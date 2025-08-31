# Database Integration

Zero-configuration database setup with automatic type generation.

## Overview

Agentwise provides seamless database integration with multiple providers, automatic schema detection, type generation, and migration management. Set up a production-ready database in seconds without manual configuration.

## Quick Start

```bash
# Interactive database wizard
/database-wizard

# Quick setup with provider
/database-setup supabase

# Connect to existing database
/database-connect "postgresql://..."

# Within project creation
/create-project "app with database"
```

## Supported Providers

### Cloud Providers

#### Supabase (Recommended)
- Built-in authentication
- Real-time subscriptions
- File storage
- Edge functions
- Row Level Security (RLS)
- Free tier available

#### Neon
- Serverless PostgreSQL
- Branching for dev/staging
- Auto-scaling
- Pay-per-use pricing
- Instant provisioning

#### PlanetScale
- MySQL compatible
- Non-blocking migrations
- Horizontal scaling
- Global replication
- Vitess technology

### Local Development

#### PostgreSQL
- Full local control
- No internet required
- Docker support
- Complete privacy
- Production-ready

#### SQLite
- Zero configuration
- File-based storage
- Embedded database
- Perfect for prototypes
- Lightweight

#### Docker Compose
- Multi-container setup
- Redis, PostgreSQL, etc.
- One command start
- Production-like environment

## Integration Flow

### 1. Provider Selection
Choose from supported database providers based on your needs:
- Production requirements
- Scaling needs
- Budget constraints
- Feature requirements

### 2. Automatic Configuration
The system handles all configuration automatically:
- Connection string generation
- Environment variable setup
- Client initialization
- SSL/TLS configuration

### 3. Type Generation
TypeScript types are generated automatically from your schema:
- Interface definitions
- Zod schemas for validation
- Prisma models for ORM
- Type-safe queries

## Features

### Integration Features
- ✅ Zero-configuration setup
- ✅ Automatic schema detection
- ✅ Type generation
- ✅ Migration management
- ✅ Seed data support
- ✅ Connection pooling
- ✅ Encrypted credentials
- ✅ Multi-environment support

### Security Features
- ✅ Encrypted .env storage
- ✅ Row Level Security (RLS)
- ✅ SSL/TLS connections
- ✅ Connection string validation
- ✅ Automatic backups
- ✅ Access logging
- ✅ SQL injection prevention
- ✅ Query parameterization

## Supabase Architecture

When using Supabase, you get a complete backend-as-a-service:

### Services Included
- **Authentication**: User management, OAuth, magic links
- **Database**: PostgreSQL with extensions
- **Storage**: File and media storage
- **Realtime**: WebSocket subscriptions
- **Edge Functions**: Serverless functions

### Integration Points
- Next.js app connects to Auth Service
- API routes connect to Database
- Client components use Realtime
- File uploads to Storage
- Serverless logic in Edge Functions

## Type Generation

### Automatic Type Creation
From your database schema, the system generates:

```typescript
// Automatically generated from database schema
export interface User {
  id: string
  email: string
  name: string | null
  created_at: Date
  updated_at: Date
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  completed: boolean
  due_date: Date | null
  created_at: Date
}

// Zod schemas for validation
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  created_at: z.date(),
  updated_at: z.date()
})

// Prisma models for ORM
model User {
  id         String   @id @default(uuid())
  email      String   @unique
  name       String?
  tasks      Task[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

## Example Setup Session

```bash
$ /database-wizard

🗄️ Database Setup Wizard
━━━━━━━━━━━━━━━━━━━━━━━━

? Select database provider: Supabase (Recommended)

? Enter your Supabase project URL: https://xyzabc.supabase.co
? Enter your Supabase anon key: eyJhbGc...
? Enter your Supabase service key (optional): eyJhbGc...

📝 Configuring Supabase...
✅ Connection established
✅ Credentials saved to .env.local (encrypted)
✅ Database client initialized

🔍 Analyzing database schema...
✅ Found 5 tables
✅ Found 2 views
✅ Found 3 functions

📝 Generating TypeScript types...
✅ Generated types/database.ts
✅ Generated lib/supabase.ts
✅ Generated middleware/auth.ts

🔄 Setting up migrations...
✅ Created migrations folder
✅ Initial migration created
✅ Migration applied

🌱 Creating seed data...
✅ Seed file created at seeds/initial.ts
✅ Sample data ready

✨ Database integration complete!

📁 Files created:
  • .env.local (credentials)
  • types/database.ts (TypeScript types)
  • lib/supabase.ts (client)
  • middleware/auth.ts (authentication)
  • migrations/001_initial.sql
  • seeds/initial.ts

🚀 Ready to use in your code:
  import { supabase } from '@/lib/supabase'
  import { User, Task } from '@/types/database'
```

## Usage in Code

After setup, use the database in your application:

```typescript
// Import the generated client and types
import { supabase } from '@/lib/supabase'
import { User, Task } from '@/types/database'

// Fetch data with full type safety
const { data: users, error } = await supabase
  .from('users')
  .select('*')
  .returns<User[]>()

// Insert data with validation
const newTask: Task = {
  id: crypto.randomUUID(),
  user_id: currentUser.id,
  title: 'Complete project',
  description: 'Finish the implementation',
  completed: false,
  due_date: new Date('2025-02-01'),
  created_at: new Date()
}

const { error } = await supabase
  .from('tasks')
  .insert(newTask)

// Real-time subscriptions
const subscription = supabase
  .channel('tasks')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'tasks' },
    (payload) => {
      console.log('Change received!', payload)
    }
  )
  .subscribe()
```

## Migration Management

### Automatic Migrations
- Schema changes detected automatically
- Migration files generated
- Rollback support
- Version tracking

### Manual Migrations
```bash
# Create new migration
/database-migrate create add_users_table

# Apply migrations
/database-migrate up

# Rollback last migration
/database-migrate down
```

## Best Practices

1. **Environment Variables**: Never commit credentials to version control
2. **Connection Pooling**: Use connection pools for production
3. **Row Level Security**: Enable RLS for Supabase tables
4. **Backups**: Regular automated backups are configured
5. **Monitoring**: Track query performance and errors
6. **Type Safety**: Always use generated types
7. **Migrations**: Use migration system for schema changes

## Troubleshooting

### Connection Issues
- Verify credentials are correct
- Check network connectivity
- Ensure SSL is properly configured
- Verify firewall rules

### Type Generation Issues
- Re-run type generation after schema changes
- Check for naming conflicts
- Ensure schema is properly structured

### Performance Issues
- Enable connection pooling
- Add appropriate indexes
- Use query optimization
- Monitor slow queries

## Related Commands

- `/create-project` - Complete project setup with database
- `/github-setup` - GitHub integration for database migrations
- `/enable-protection` - Backup and security for database
- `/monitor` - Monitor database performance