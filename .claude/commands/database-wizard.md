# Database Wizard

Interactive database setup wizard that guides you through configuring database integration for your project.

## Usage

```bash
npm run database:wizard
# or
node -e "
const { DatabaseWizard } = require('./src/database/DatabaseWizard.js');
new DatabaseWizard().runWizard().then(result => {
  console.log('Wizard completed:', result.success ? 'Success' : 'Failed');
  if (result.errors.length > 0) {
    console.error('Errors:', result.errors);
  }
});
"
```

## What the Wizard Does

The database wizard provides a step-by-step interactive setup process:

### Step 1: Auto-Detection
- Scans your project for existing database configurations
- Checks `.env` files, config files, and `package.json`
- Supports Supabase, Neon, PlanetScale, PostgreSQL, MySQL, SQLite

### Step 2: Provider Selection
- Lists available database providers
- Shows requirements for each provider
- Popular providers are highlighted

### Step 3: Credential Configuration
- Collects database credentials securely
- Provider-specific input fields
- Validates input format

### Step 4: Connection Testing
- Tests database connection
- Shows response time and available features
- Allows retry if connection fails

### Step 5: Type Generation Options
- Configure TypeScript type generation
- Choose between types, interfaces, enums
- Select ORM schema generation (Prisma, Drizzle, TypeORM)

### Step 6: Schema Requirements (Optional)
- Define required database tables
- Specify relationships and constraints
- Generate migrations and seed data

### Step 7: Integration Setup
- Set up environment variables
- Configure MCP integration
- Generate TypeScript types
- Update build configurations

### Step 8: Final Verification
- Test complete integration
- Verify all components work together
- Provide next steps

## Supported Providers

### Supabase
- **Requirements**: Project URL, API keys
- **Features**: Auth, Storage, Real-time, Functions
- **Detection**: Config files, environment variables, package.json

### Neon
- **Requirements**: Connection URL
- **Features**: PostgreSQL, Branching, Auto-scaling
- **Detection**: Environment variables

### PlanetScale
- **Requirements**: Connection URL  
- **Features**: MySQL, Branching, Online DDL
- **Detection**: Environment variables

### PostgreSQL
- **Requirements**: Host, Database, Username, Password
- **Features**: ACID, JSONB, Full-text Search, Extensions
- **Detection**: Config files, environment variables

### MySQL
- **Requirements**: Host, Database, Username, Password
- **Features**: InnoDB, MyISAM, Full-text Search, Replication
- **Detection**: Config files, environment variables

### SQLite
- **Requirements**: Database file path
- **Features**: Serverless, File-based, ACID, Full-text Search
- **Detection**: File system scan, environment variables

## Generated Files

The wizard creates and updates several files:

### Environment Files
- `.env` - Environment variables
- `types/environment.d.ts` - TypeScript environment definitions

### Database Types
- `types/database/types.ts` - TypeScript type definitions
- `types/database/interfaces.ts` - TypeScript interfaces
- `types/database/enums.ts` - TypeScript enums
- `types/database/client.ts` - Typed database client

### ORM Schemas (if selected)
- `types/database/schema.prisma` - Prisma schema
- `types/database/schema.ts` - Drizzle or TypeORM schema

### Configuration Files
- `.mcp.json` - MCP server configuration
- Updates to `.gitignore`
- Updates to build configs (Next.js, Vite, Webpack)

## Environment Variables

The wizard sets up environment variables based on your provider:

### Supabase
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### Neon
```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname
```

### PlanetScale
```env
DATABASE_URL=mysql://user:pass@aws.connect.psdb.cloud/dbname?sslaccept=strict
```

### PostgreSQL
```env
DATABASE_URL=postgresql://user:pass@host:5432/dbname
# or individual variables
PGHOST=your_host
PGPORT=5432
PGDATABASE=your_database
PGUSER=your_username
PGPASSWORD=your_password
```

### MySQL
```env
DATABASE_URL=mysql://user:pass@host:3306/dbname
# or individual variables
MYSQL_HOST=your_host
MYSQL_PORT=3306
MYSQL_DATABASE=your_database
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
```

### SQLite
```env
DATABASE_PATH=./database.sqlite
```

## MCP Integration

The wizard automatically configures MCP (Model Context Protocol) integration:

1. Creates `.mcp.json` configuration file
2. Updates Claude Desktop configuration (if available)
3. Sets up environment variables for MCP server
4. Enables database queries through Claude

## Type Generation

When enabled, the wizard generates:

### TypeScript Types
- Table types with proper column types
- Insert/Update interfaces
- Enum types from database constraints
- Typed database client

### ORM Schemas
- **Prisma**: Complete schema with models, relations, and constraints
- **Drizzle**: Table definitions with typed columns
- **TypeORM**: Entity classes with decorators

## Next Steps

After running the wizard, you should:

1. **Test Connection**: Verify database connectivity in your app
2. **Import Types**: Use generated types in your TypeScript code
3. **Use Client**: Leverage the typed database client for queries
4. **Run ORM Setup**: Generate ORM client if using Prisma/Drizzle
5. **Restart Claude**: Reload Claude Desktop for MCP integration
6. **Version Control**: Commit generated files (except `.env`)

## Troubleshooting

### Connection Issues
- Verify credentials are correct
- Check network connectivity
- Ensure database is running and accessible
- Verify SSL settings for cloud providers

### Type Generation Issues
- Ensure database schema exists
- Check database permissions for schema introspection
- Verify TypeScript is configured in your project

### MCP Issues
- Restart Claude Desktop after configuration
- Check MCP server installation
- Verify environment variables are set correctly

## Examples

### Quick Setup for Supabase
1. Run `npm run database:wizard`
2. Select "Supabase" when prompted
3. Enter your Supabase URL and API keys
4. Accept defaults for type generation
5. Complete setup and restart Claude Desktop

### Custom PostgreSQL Setup
1. Run the wizard
2. Select "PostgreSQL"
3. Choose individual credentials over connection URL
4. Configure host, port, database, username, password
5. Enable ORM schema generation
6. Choose Prisma for ORM
7. Complete setup

The wizard handles all the complex setup automatically while giving you full control over the configuration options.