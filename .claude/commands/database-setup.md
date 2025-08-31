# Database Setup

Manual database setup commands for advanced configuration and troubleshooting.

## Usage

```bash
# Auto-detect existing database configurations
npm run database:detect

# Authenticate with specific provider
npm run database:auth <provider>

# Generate types from database schema
npm run database:types

# Set up MCP integration
npm run database:mcp

# Test database connection
npm run database:test

# Complete setup programmatically
node -e "
const { AutoAuthManager } = require('./src/database/AutoAuthManager.js');
const auth = new AutoAuthManager();
// Setup code here
"
```

## Auto-Detection

Automatically detect database configurations from your project:

```javascript
const { AutoAuthManager } = require('./src/database/AutoAuthManager.js');

const authManager = new AutoAuthManager();
const results = await authManager.autoDetect('./');

for (const result of results) {
  if (result.success) {
    console.log(`Found ${result.provider}:`, result.credentials);
  }
}
```

### Detection Methods

**Supabase Detection:**
- `supabase/config.toml`
- `.supabase/config.toml`
- Environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Package dependencies: `@supabase/supabase-js`

**Neon Detection:**
- Environment variables containing `neon` or `@ep-`
- DATABASE_URL with Neon patterns

**PlanetScale Detection:**
- Environment variables containing `planetscale` or `pscale_pw_`
- DATABASE_URL with PlanetScale patterns

**PostgreSQL Detection:**
- `postgresql.conf`, `pg_hba.conf`, `.pgpass` files
- Environment variables: `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
- DATABASE_URL with `postgresql://` or `postgres://` scheme

**MySQL Detection:**
- `my.cnf`, `.my.cnf`, `mysql.conf` files
- Environment variables: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`
- DATABASE_URL with `mysql://` scheme

**SQLite Detection:**
- Common file names: `database.sqlite`, `db.sqlite`, `app.db`
- Environment variables: `DATABASE_PATH`, `SQLITE_PATH`
- DATABASE_URL with `file:` scheme

## Manual Authentication

Set up database authentication manually:

```javascript
const { AutoAuthManager } = require('./src/database/AutoAuthManager.js');

const authManager = new AutoAuthManager();

// Supabase authentication
const supabaseResult = await authManager.authenticate({
  provider: 'supabase',
  connectionUrl: 'https://your-project.supabase.co',
  apiKey: 'your_anon_key',
  serviceKey: 'your_service_key', // optional
  createdAt: new Date(),
  lastUsed: new Date()
}, 'supabase-main');

// PostgreSQL authentication
const pgResult = await authManager.authenticate({
  provider: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'myuser',
  password: 'mypassword',
  ssl: true,
  createdAt: new Date(),
  lastUsed: new Date()
}, 'postgres-main');
```

## Secure Credential Storage

The system uses secure credential storage:

```javascript
const { SecureCredentialStore } = require('./src/database/SecureCredentialStore.js');

const store = new SecureCredentialStore({
  keyPrefix: 'myapp_db',
  namespace: 'production',
  autoWipe: true
});

// Store credentials
await store.store('main', credentials, 'keychain');

// Retrieve credentials
const stored = await store.retrieve('main', 'supabase');

// List stored credentials
const list = await store.list();

// Delete credentials
await store.delete('main', 'supabase');
```

### Storage Types

1. **Keychain** (Recommended): Uses OS keychain/credential manager
2. **Encrypted File**: AES-256-GCM encrypted files
3. **Environment**: Environment variables
4. **Memory**: In-memory storage (temporary)

## Environment Variable Management

Set up environment variables automatically:

```javascript
const { EnvironmentPropagator } = require('./src/database/EnvironmentPropagator.js');

const propagator = new EnvironmentPropagator();

const result = await propagator.propagateCredentials(credentials, {
  targetEnvFile: '.env.local',
  createTypeDefinitions: true,
  updateBuildConfigs: true,
  ensureGitignore: true,
  prefix: 'DB',
  backup: true
});

console.log('Updated files:', result.updatedFiles);
console.log('Created files:', result.createdFiles);
```

### Generated Environment Variables

The system generates appropriate environment variables:

```env
# Supabase
DB_URL=https://your-project.supabase.co
DB_API_KEY=your_anon_key
DB_SERVICE_KEY=your_service_key
DB_PROJECT_ID=your_project_id
DB_PROVIDER=supabase

# PostgreSQL
DB_URL=postgresql://user:pass@host:5432/dbname
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=myuser
DB_PASSWORD=mypassword
DB_SSL=true
DB_PROVIDER=postgresql
```

## Type Generation

Generate TypeScript types from your database schema:

```javascript
const { DatabaseTypeGenerator } = require('./src/database/DatabaseTypeGenerator.js');

const generator = new DatabaseTypeGenerator();

const result = await generator.generateTypes(credentials, {
  outputPath: './types/database',
  namespace: 'Database',
  generateInterfaces: true,
  generateTypes: true,
  generateEnums: true,
  generateClient: true,
  generateORM: true,
  ormType: 'prisma',
  includeComments: true,
  camelCase: true
});

if (result.success) {
  console.log('Generated files:', result.generatedFiles);
} else {
  console.error('Errors:', result.errors);
}
```

### Generated Files

- `types.ts` - TypeScript type definitions
- `interfaces.ts` - TypeScript interfaces
- `enums.ts` - TypeScript enums
- `client.ts` - Typed database client
- `schema.prisma` - Prisma schema (if ORM enabled)
- `index.ts` - Export index

### Type Generation Options

```typescript
interface TypeGenerationOptions {
  outputPath?: string;          // Output directory
  namespace?: string;           // Type namespace
  generateInterfaces?: boolean; // Generate interfaces
  generateTypes?: boolean;      // Generate type aliases
  generateEnums?: boolean;      // Generate enums
  generateClient?: boolean;     // Generate typed client
  generateORM?: boolean;        // Generate ORM schema
  ormType?: 'prisma' | 'drizzle' | 'typeorm';
  includeComments?: boolean;    // Include DB comments
  camelCase?: boolean;          // Convert to camelCase
}
```

## MCP Configuration

Set up MCP (Model Context Protocol) integration:

```javascript
const { MCPAutoConfigurator } = require('./src/database/MCPAutoConfigurator.js');

const configurator = new MCPAutoConfigurator();

const result = await configurator.configureMCP(credentials, {
  targetFile: '.mcp.json',
  backupExisting: true,
  mergeWithExisting: true,
  updateClaudeDesktop: true,
  agentSpecific: false
});

console.log('MCP configured:', result.serverName);
console.log('Config file:', result.configFile);
```

### Agent-Specific MCP

Configure MCP for specific agents:

```javascript
const agentConfigFile = await configurator.configureAgentMCP(
  credentials,
  'agent-001',
  'Database Agent',
  {
    backupExisting: true,
    mergeWithExisting: true
  }
);
```

### MCP Management

```javascript
// List MCP servers
const servers = await configurator.listMCPServers();

// Test MCP server
const testResult = await configurator.testMCPServer('supabase-db');

// Remove MCP configuration
await configurator.removeMCPConfig('supabase-db');
```

## Connection Testing

Test database connections:

```javascript
const connectionTest = await authManager.testConnection(credentials);

if (connectionTest.success) {
  console.log('Connection successful');
  console.log('Latency:', connectionTest.latency, 'ms');
  console.log('Features:', connectionTest.features);
} else {
  console.error('Connection failed:', connectionTest.errors);
}
```

## Provider-Specific Setup

### Supabase Setup

```javascript
const supabaseCredentials = {
  provider: 'supabase',
  connectionUrl: 'https://your-project.supabase.co',
  apiKey: 'your_anon_key',
  serviceKey: 'your_service_key',
  projectId: 'your_project_id',
  createdAt: new Date(),
  lastUsed: new Date()
};

await authManager.authenticate(supabaseCredentials, 'supabase-main', true);
```

### Neon Setup

```javascript
const neonCredentials = {
  provider: 'neon',
  connectionUrl: 'postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname',
  projectId: 'your_project_id',
  region: 'us-east-1',
  createdAt: new Date(),
  lastUsed: new Date()
};

await authManager.authenticate(neonCredentials, 'neon-main', true);
```

### PlanetScale Setup

```javascript
const planetscaleCredentials = {
  provider: 'planetscale',
  connectionUrl: 'mysql://user:pass@aws.connect.psdb.cloud/dbname?sslaccept=strict',
  database: 'your_database',
  createdAt: new Date(),
  lastUsed: new Date()
};

await authManager.authenticate(planetscaleCredentials, 'planetscale-main', true);
```

## Configuration Files

### .mcp.json

```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_ANON_KEY": "your_anon_key",
        "NODE_ENV": "production",
        "MCP_PROVIDER": "supabase"
      },
      "disabled": false
    }
  }
}
```

### Environment Type Definitions

Generated `types/environment.d.ts`:

```typescript
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** Supabase project URL */
      DB_URL: string;
      /** Supabase anonymous/public API key */
      DB_API_KEY: string;
      /** Supabase service role key for admin operations */
      DB_SERVICE_KEY?: string;
      /** Database provider type */
      DB_PROVIDER: string;
    }
  }
}

export interface DBEnvironment {
  DB_URL: string;
  DB_API_KEY: string;
  DB_SERVICE_KEY?: string;
  DB_PROVIDER: string;
}

export function getDBEnvironment(): DBEnvironment;
export function validateDBEnvironment(): { valid: boolean; missing: string[] };
```

## Error Handling

The system provides comprehensive error handling:

```javascript
try {
  const result = await authManager.authenticate(credentials, 'main');
} catch (error) {
  if (error instanceof CredentialError) {
    console.error('Credential error:', error.message);
    console.error('Provider:', error.provider);
  } else if (error instanceof ConnectionError) {
    console.error('Connection error:', error.message);
  } else if (error instanceof ConfigurationError) {
    console.error('Configuration error:', error.message);
  }
}
```

## Security Best Practices

1. **Use Keychain Storage**: Always prefer keychain over file storage
2. **Encrypt Credentials**: Files are encrypted with AES-256-GCM
3. **Machine-Specific Keys**: Encryption keys are machine-specific
4. **Memory Wiping**: Credentials are wiped from memory after use
5. **Environment Isolation**: Separate credentials by environment
6. **Gitignore**: Ensure `.env` files are not committed

## Troubleshooting

### Common Issues

**Connection Timeouts:**
```javascript
// Increase timeout for slow connections
const testResult = await authManager.testConnection(credentials);
```

**Permission Errors:**
- Ensure database user has required permissions
- Check SSL certificate validity for cloud providers
- Verify network connectivity and firewall settings

**Type Generation Failures:**
- Ensure database schema exists and is accessible
- Check user permissions for schema introspection
- Verify TypeScript configuration in project

**MCP Integration Issues:**
- Restart Claude Desktop after configuration changes
- Check MCP server installation and dependencies
- Verify environment variables are correctly set

### Debug Mode

Enable debug logging:

```javascript
process.env.DEBUG = 'agentwise:database:*';
```

This provides detailed logging for troubleshooting setup issues.