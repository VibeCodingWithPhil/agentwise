# Database Connect

Quick database connection commands and utilities for testing and managing database connections.

## Usage

```bash
# Quick connection test
npm run database:connect

# Test specific provider
npm run database:connect supabase

# Interactive connection builder
npm run database:connect --interactive

# List stored connections
npm run database:connect --list

# Remove stored connection
npm run database:connect --remove <alias>
```

## Quick Connection

Test database connections quickly:

```javascript
const { AutoAuthManager } = require('./src/database/AutoAuthManager.js');

// Test all auto-detected connections
const authManager = new AutoAuthManager();
const results = await authManager.autoDetect('./');

for (const result of results.filter(r => r.success)) {
  const test = await authManager.testConnection(result.credentials);
  console.log(`${result.provider}: ${test.success ? '✅' : '❌'} ${test.latency}ms`);
}
```

## Connection Strings

### Supabase
```
https://your-project.supabase.co
```

**Required:**
- Project URL
- Anonymous/Public API Key

**Optional:**
- Service Role Key (for admin operations)

**Environment Variables:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Neon
```
postgresql://user:password@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**Format:**
- `postgresql://[user]:[password]@[host]/[database]?sslmode=require`
- Host always includes region: `ep-xxx-xxx.region.aws.neon.tech`
- SSL is always required

**Environment Variables:**
```env
DATABASE_URL=postgresql://user:password@ep-cool-darkness-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
NEON_PROJECT_ID=cool-darkness-123456
NEON_BRANCH=main
```

### PlanetScale
```
mysql://user:pscale_pw_xyz@aws.connect.psdb.cloud/database?sslaccept=strict
```

**Format:**
- `mysql://[user]:[password]@aws.connect.psdb.cloud/[database]?sslaccept=strict`
- Password always starts with `pscale_pw_`
- SSL accept strict is required

**Environment Variables:**
```env
DATABASE_URL=mysql://user:pscale_pw_xyz@aws.connect.psdb.cloud/database?sslaccept=strict
PLANETSCALE_DB=database
PLANETSCALE_BRANCH=main
```

### PostgreSQL
```
postgresql://user:password@localhost:5432/database
```

**Format:**
- `postgresql://[user]:[password]@[host]:[port]/[database]`
- Default port: 5432
- Optional SSL parameters

**Environment Variables:**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/database
# OR individual variables
PGHOST=localhost
PGPORT=5432
PGDATABASE=database
PGUSER=user
PGPASSWORD=password
PGSSLMODE=prefer
```

### MySQL
```
mysql://user:password@localhost:3306/database
```

**Format:**
- `mysql://[user]:[password]@[host]:[port]/[database]`
- Default port: 3306
- Optional SSL parameters

**Environment Variables:**
```env
DATABASE_URL=mysql://user:password@localhost:3306/database
# OR individual variables
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DATABASE=database
MYSQL_USER=user
MYSQL_PASSWORD=password
```

### SQLite
```
file:./database.sqlite
```

**Format:**
- `file:[path_to_database_file]`
- Can be relative or absolute path

**Environment Variables:**
```env
DATABASE_PATH=./database.sqlite
DATABASE_URL=file:./database.sqlite
```

## Connection Testing

### Basic Connection Test

```javascript
const { AutoAuthManager } = require('./src/database/AutoAuthManager.js');

const authManager = new AutoAuthManager();
const credentials = {
  provider: 'postgresql',
  connectionUrl: 'postgresql://user:password@localhost:5432/mydb',
  createdAt: new Date(),
  lastUsed: new Date()
};

const result = await authManager.testConnection(credentials);

if (result.success) {
  console.log('✅ Connection successful');
  console.log(`Response time: ${result.latency}ms`);
  console.log(`Database version: ${result.version || 'Unknown'}`);
  console.log(`Available features: ${result.features.join(', ')}`);
  
  if (result.warnings.length > 0) {
    console.log('⚠️ Warnings:');
    result.warnings.forEach(warning => console.log(`  • ${warning}`));
  }
} else {
  console.log('❌ Connection failed');
  result.errors.forEach(error => console.log(`  • ${error}`));
}
```

### Batch Connection Testing

```javascript
const connections = [
  { alias: 'prod', provider: 'supabase', connectionUrl: '...' },
  { alias: 'dev', provider: 'postgresql', host: 'localhost', ... },
  { alias: 'test', provider: 'sqlite', database: './test.db' }
];

const results = await Promise.all(
  connections.map(async (conn) => {
    const test = await authManager.testConnection(conn);
    return { alias: conn.alias, success: test.success, latency: test.latency };
  })
);

results.forEach(result => {
  const status = result.success ? '✅' : '❌';
  const latency = result.latency ? `${result.latency}ms` : 'N/A';
  console.log(`${result.alias}: ${status} ${latency}`);
});
```

## Connection Management

### Store Connection

```javascript
const { SecureCredentialStore } = require('./src/database/SecureCredentialStore.js');

const store = new SecureCredentialStore();

// Store in OS keychain (recommended)
await store.store('prod-db', credentials, 'keychain');

// Store in encrypted file
await store.store('dev-db', credentials, 'encrypted_file');

// Store in environment variables
await store.store('test-db', credentials, 'environment');
```

### Retrieve Connection

```javascript
// Retrieve stored credentials
const storedCreds = await store.retrieve('prod-db', 'supabase');

if (storedCreds) {
  console.log('Retrieved credentials for:', storedCreds.provider);
  
  // Test the retrieved connection
  const test = await authManager.testConnection(storedCreds);
  console.log('Connection test:', test.success ? 'Pass' : 'Fail');
}
```

### List Connections

```javascript
const connections = await store.list();

console.log('Stored connections:');
connections.forEach(conn => {
  console.log(`  ${conn.alias} (${conn.provider}) - Last used: ${conn.lastUsed}`);
});
```

### Remove Connection

```javascript
const removed = await store.delete('old-connection', 'postgresql');
console.log('Connection removed:', removed);
```

## Connection Validation

### URL Validation

```javascript
function validateConnectionUrl(url, provider) {
  try {
    const parsed = new URL(url);
    
    switch (provider) {
      case 'supabase':
        return parsed.protocol === 'https:' && parsed.hostname.includes('supabase');
      case 'neon':
        return parsed.protocol === 'postgresql:' && parsed.hostname.includes('neon');
      case 'planetscale':
        return parsed.protocol === 'mysql:' && parsed.hostname.includes('psdb.cloud');
      case 'postgresql':
        return ['postgresql:', 'postgres:'].includes(parsed.protocol);
      case 'mysql':
        return parsed.protocol === 'mysql:';
      case 'sqlite':
        return parsed.protocol === 'file:';
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

// Usage
const isValid = validateConnectionUrl(
  'postgresql://user:pass@localhost:5432/db', 
  'postgresql'
);
```

### Credential Validation

```javascript
function validateCredentials(credentials) {
  const errors = [];
  
  if (!credentials.provider) {
    errors.push('Provider is required');
  }
  
  switch (credentials.provider) {
    case 'supabase':
      if (!credentials.connectionUrl) errors.push('Supabase URL is required');
      if (!credentials.apiKey) errors.push('Supabase API key is required');
      break;
      
    case 'neon':
    case 'planetscale':
      if (!credentials.connectionUrl) errors.push('Connection URL is required');
      break;
      
    case 'postgresql':
    case 'mysql':
      if (!credentials.connectionUrl && (!credentials.host || !credentials.database)) {
        errors.push('Connection URL or host/database is required');
      }
      break;
      
    case 'sqlite':
      if (!credentials.database) errors.push('Database file path is required');
      break;
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
```

## Environment Detection

### Auto-detect from Environment

```javascript
function detectFromEnvironment() {
  const detected = [];
  
  // Check for common patterns
  const env = process.env;
  
  if (env.SUPABASE_URL && env.SUPABASE_ANON_KEY) {
    detected.push({
      provider: 'supabase',
      connectionUrl: env.SUPABASE_URL,
      apiKey: env.SUPABASE_ANON_KEY,
      serviceKey: env.SUPABASE_SERVICE_ROLE_KEY
    });
  }
  
  if (env.DATABASE_URL) {
    const url = env.DATABASE_URL;
    let provider = 'postgresql';
    
    if (url.includes('neon')) provider = 'neon';
    if (url.includes('planetscale')) provider = 'planetscale';
    if (url.startsWith('mysql:')) provider = 'mysql';
    if (url.startsWith('file:')) provider = 'sqlite';
    
    detected.push({
      provider,
      connectionUrl: url
    });
  }
  
  // PostgreSQL individual variables
  if (env.PGHOST && env.PGDATABASE) {
    detected.push({
      provider: 'postgresql',
      host: env.PGHOST,
      port: parseInt(env.PGPORT || '5432'),
      database: env.PGDATABASE,
      username: env.PGUSER,
      password: env.PGPASSWORD
    });
  }
  
  // MySQL individual variables
  if (env.MYSQL_HOST && env.MYSQL_DATABASE) {
    detected.push({
      provider: 'mysql',
      host: env.MYSQL_HOST,
      port: parseInt(env.MYSQL_PORT || '3306'),
      database: env.MYSQL_DATABASE,
      username: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD
    });
  }
  
  return detected;
}
```

## Connection Troubleshooting

### Common Issues

#### Connection Timeouts
```javascript
// Increase timeout for slow networks
const credentials = {
  ...baseCredentials,
  metadata: {
    connectionTimeout: 30000 // 30 seconds
  }
};
```

#### SSL Certificate Issues
```javascript
// For development environments, you might need to disable SSL verification
const credentials = {
  ...baseCredentials,
  ssl: false, // Only for development!
  metadata: {
    rejectUnauthorized: false
  }
};
```

#### Network Connectivity
```javascript
async function diagnoseTenwork(host, port = 5432) {
  const net = require('net');
  
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ reachable: false, error: 'Timeout' });
    }, 5000);
    
    socket.connect(port, host, () => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({ reachable: true });
    });
    
    socket.on('error', (error) => {
      clearTimeout(timeout);
      resolve({ reachable: false, error: error.message });
    });
  });
}

// Usage
const diagnosis = await diagnoseNetwork('localhost', 5432);
console.log('Network diagnosis:', diagnosis);
```

### Debug Connection

```javascript
async function debugConnection(credentials) {
  console.log('🔍 Debugging connection...');
  
  // 1. Validate credentials format
  const validation = validateCredentials(credentials);
  console.log('Credential validation:', validation);
  
  if (!validation.valid) {
    return { success: false, errors: validation.errors };
  }
  
  // 2. Network connectivity test (for host-based connections)
  if (credentials.host) {
    const network = await diagnoseNetwork(credentials.host, credentials.port);
    console.log('Network connectivity:', network);
    
    if (!network.reachable) {
      return { success: false, errors: [`Cannot reach ${credentials.host}:${credentials.port}`] };
    }
  }
  
  // 3. Connection test with detailed logging
  console.log('Testing database connection...');
  const startTime = Date.now();
  
  try {
    const result = await authManager.testConnection(credentials);
    const duration = Date.now() - startTime;
    
    console.log(`Connection test completed in ${duration}ms`);
    console.log('Result:', result);
    
    return result;
  } catch (error) {
    console.error('Connection test failed:', error.message);
    return { success: false, errors: [error.message] };
  }
}
```

## Interactive Connection Builder

```javascript
const readline = require('readline');

async function buildConnectionInteractively() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const ask = (question) => new Promise(resolve => 
    rl.question(question, resolve)
  );
  
  try {
    console.log('🔗 Interactive Database Connection Builder\n');
    
    // Provider selection
    console.log('Available providers:');
    console.log('1. Supabase');
    console.log('2. Neon');
    console.log('3. PlanetScale');
    console.log('4. PostgreSQL');
    console.log('5. MySQL');
    console.log('6. SQLite');
    
    const choice = await ask('Select provider (1-6): ');
    const providers = ['supabase', 'neon', 'planetscale', 'postgresql', 'mysql', 'sqlite'];
    const provider = providers[parseInt(choice) - 1];
    
    if (!provider) {
      throw new Error('Invalid provider selection');
    }
    
    const credentials = { provider, createdAt: new Date(), lastUsed: new Date() };
    
    // Collect provider-specific credentials
    switch (provider) {
      case 'supabase':
        credentials.connectionUrl = await ask('Supabase URL: ');
        credentials.apiKey = await ask('Anonymous Key: ');
        const serviceKey = await ask('Service Role Key (optional): ');
        if (serviceKey) credentials.serviceKey = serviceKey;
        break;
        
      case 'neon':
      case 'planetscale':
        credentials.connectionUrl = await ask('Connection URL: ');
        break;
        
      case 'postgresql':
      case 'mysql':
        const useUrl = await ask('Use connection URL? (y/N): ');
        if (useUrl.toLowerCase().startsWith('y')) {
          credentials.connectionUrl = await ask('Connection URL: ');
        } else {
          credentials.host = await ask('Host: ');
          credentials.port = parseInt(await ask(`Port (${provider === 'postgresql' ? '5432' : '3306'}): `) || (provider === 'postgresql' ? '5432' : '3306'));
          credentials.database = await ask('Database: ');
          credentials.username = await ask('Username: ');
          credentials.password = await ask('Password: ');
        }
        break;
        
      case 'sqlite':
        credentials.database = await ask('Database file path: ');
        break;
    }
    
    // Test connection
    console.log('\n🔌 Testing connection...');
    const result = await authManager.testConnection(credentials);
    
    if (result.success) {
      console.log('✅ Connection successful!');
      
      const save = await ask('Save connection? (Y/n): ');
      if (!save.toLowerCase().startsWith('n')) {
        const alias = await ask('Connection alias: ') || `${provider}-${Date.now()}`;
        await store.store(alias, credentials, 'keychain');
        console.log(`💾 Connection saved as '${alias}'`);
      }
    } else {
      console.log('❌ Connection failed:');
      result.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    return credentials;
    
  } finally {
    rl.close();
  }
}
```

This comprehensive connection system provides secure, flexible database connectivity with automatic detection, secure storage, and comprehensive testing capabilities.