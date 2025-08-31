/**
 * Database Integration System Types
 * 
 * Comprehensive TypeScript interfaces for the database integration system
 * supporting Supabase, Neon, PlanetScale, and other database providers.
 */

export type DatabaseProvider = 'supabase' | 'neon' | 'planetscale' | 'postgresql' | 'mysql' | 'sqlite';

export type AuthMethod = 'url' | 'credentials' | 'token' | 'service_key';

export type CredentialStorageType = 'keychain' | 'encrypted_file' | 'environment' | 'memory';

export interface DatabaseCredentials {
  provider: DatabaseProvider;
  connectionUrl?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  apiKey?: string;
  serviceKey?: string;
  projectId?: string;
  region?: string;
  ssl?: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  lastUsed: Date;
}

export interface SecureCredentialOptions {
  storageType: CredentialStorageType;
  encryptionKey?: string;
  keyPrefix?: string;
  namespace?: string;
  machineSpecific?: boolean;
  autoWipe?: boolean;
}

export interface StoredCredential {
  id: string;
  provider: DatabaseProvider;
  alias: string;
  encryptedData: string;
  metadata: {
    createdAt: string;
    lastUsed: string;
    machineId?: string;
    version: string;
  };
}

export interface AuthenticationResult {
  success: boolean;
  provider: DatabaseProvider;
  connectionString?: string;
  credentials?: DatabaseCredentials;
  error?: string;
  metadata?: {
    detectionMethod: string;
    configLocation: string;
    validatedAt: Date;
    connectionTestError?: string;
  };
}

export interface MCPConfiguration {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  disabled?: boolean;
}

export interface MCPConfigFile {
  mcpServers: Record<string, MCPConfiguration>;
}

export interface ClaudeDesktopConfig {
  globalShortcut?: string;
  mcpServers: Record<string, MCPConfiguration>;
}

export interface MCPAutoConfigOptions {
  targetFile?: string;
  backupExisting?: boolean;
  mergeWithExisting?: boolean;
  updateClaudeDesktop?: boolean;
  agentSpecific?: boolean;
  agentId?: string;
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  description?: string;
  required?: boolean;
  sensitive?: boolean;
}

export interface EnvironmentPropagationResult {
  success: boolean;
  updatedFiles: string[];
  createdFiles: string[];
  errors: string[];
  environmentVariables: EnvironmentVariable[];
}

export interface EnvironmentPropagationOptions {
  targetEnvFile?: string;
  createTypeDefinitions?: boolean;
  updateBuildConfigs?: boolean;
  ensureGitignore?: boolean;
  prefix?: string;
  backup?: boolean;
}

export interface DatabaseSchema {
  tables: DatabaseTable[];
  views: DatabaseView[];
  functions: DatabaseFunction[];
  types: DatabaseCustomType[];
  relationships: DatabaseRelationship[];
}

export interface DatabaseTable {
  name: string;
  schema: string;
  columns: DatabaseColumn[];
  primaryKey: string[];
  foreignKeys: DatabaseForeignKey[];
  indexes: DatabaseIndex[];
  constraints: DatabaseConstraint[];
  comment?: string;
}

export interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isUnique: boolean;
  comment?: string;
  constraints?: string[];
}

export interface DatabaseView {
  name: string;
  schema: string;
  definition: string;
  columns: DatabaseColumn[];
  comment?: string;
}

export interface DatabaseFunction {
  name: string;
  schema: string;
  returnType: string;
  parameters: DatabaseFunctionParameter[];
  definition: string;
  comment?: string;
}

export interface DatabaseFunctionParameter {
  name: string;
  type: string;
  defaultValue?: any;
  mode: 'IN' | 'OUT' | 'INOUT';
}

export interface DatabaseCustomType {
  name: string;
  schema: string;
  type: 'enum' | 'composite' | 'domain';
  definition: string;
  values?: string[];
}

export interface DatabaseRelationship {
  fromTable: string;
  fromColumn: string;
  toTable: string;
  toColumn: string;
  relationshipType: 'one-to-one' | 'one-to-many' | 'many-to-many';
  constraintName: string;
}

export interface DatabaseForeignKey {
  name: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}

export interface DatabaseIndex {
  name: string;
  columns: string[];
  unique: boolean;
  type?: string;
  method?: string;
}

export interface DatabaseConstraint {
  name: string;
  type: 'CHECK' | 'UNIQUE' | 'NOT NULL' | 'PRIMARY KEY' | 'FOREIGN KEY';
  definition: string;
}

export interface TypeGenerationOptions {
  outputPath?: string;
  namespace?: string;
  generateInterfaces?: boolean;
  generateTypes?: boolean;
  generateEnums?: boolean;
  generateClient?: boolean;
  generateORM?: boolean;
  ormType?: 'prisma' | 'drizzle' | 'typeorm';
  includeComments?: boolean;
  camelCase?: boolean;
}

export interface TypeGenerationResult {
  success: boolean;
  generatedFiles: string[];
  types: string;
  interfaces: string;
  enums: string;
  client?: string;
  orm?: string;
  errors: string[];
}

export interface WizardStep {
  id: string;
  title: string;
  description: string;
  required: boolean;
  completed: boolean;
  skipped: boolean;
}

export interface WizardProviderOption {
  provider: DatabaseProvider;
  name: string;
  description: string;
  icon?: string;
  popular?: boolean;
  requirements: string[];
  detectionMethods: string[];
}

export interface WizardCredentialInput {
  field: string;
  label: string;
  type: 'text' | 'password' | 'url' | 'number' | 'select';
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: string[];
  validation?: (value: string) => string | null;
}

export interface WizardConfiguration {
  provider: DatabaseProvider;
  credentials: DatabaseCredentials;
  mcpConfig: MCPConfiguration;
  environmentVariables: EnvironmentVariable[];
  typeGeneration: TypeGenerationOptions;
  steps: WizardStep[];
  metadata?: Record<string, any>;
}

export interface WizardResult {
  success: boolean;
  configuration: WizardConfiguration;
  generatedFiles: string[];
  errors: string[];
  warnings: string[];
  nextSteps: string[];
}

export interface ConnectionTestResult {
  success: boolean;
  provider: DatabaseProvider;
  latency?: number;
  version?: string;
  features: string[];
  warnings: string[];
  errors: string[];
  metadata: {
    testedAt: Date;
    method: string;
    endpoint?: string;
  };
}

export interface SchemaRequirement {
  table: string;
  columns: Array<{
    name: string;
    type: string;
    nullable?: boolean;
    primaryKey?: boolean;
    unique?: boolean;
  }>;
  relationships?: Array<{
    type: 'hasMany' | 'hasOne' | 'belongsTo' | 'manyToMany';
    relatedTable: string;
    foreignKey?: string;
    localKey?: string;
  }>;
  indexes?: string[][];
}

export interface RequirementBasedGeneration {
  requirements: SchemaRequirement[];
  generateMigrations?: boolean;
  generateSeedData?: boolean;
  enforceConstraints?: boolean;
}

export interface DatabaseProviderConfig {
  provider: DatabaseProvider;
  name: string;
  defaultPort: number;
  supportsSSL: boolean;
  authMethods: AuthMethod[];
  connectionStringFormat: string;
  mcpServerName?: string;
  environmentVariables: {
    required: string[];
    optional: string[];
    sensitive: string[];
  };
  typeMapping: Record<string, string>;
  features: {
    schemas: boolean;
    views: boolean;
    functions: boolean;
    customTypes: boolean;
    fullTextSearch: boolean;
    jsonb: boolean;
    arrays: boolean;
  };
}

export interface AutoDetectionMethod {
  name: string;
  description: string;
  priority: number;
  detect: (projectPath: string) => Promise<DatabaseCredentials | null>;
}

export interface ValidationRule {
  field: string;
  rule: 'required' | 'url' | 'port' | 'email' | 'alphanumeric' | 'custom';
  message: string;
  customValidator?: (value: any) => boolean;
}

export interface SecurityOptions {
  encryptCredentials: boolean;
  useKeychain: boolean;
  autoWipeMemory: boolean;
  requireConfirmation: boolean;
  auditLog: boolean;
  rotateKeys: boolean;
  keyRotationInterval?: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  provider: DatabaseProvider;
  success: boolean;
  error?: string;
  metadata?: Record<string, any>;
}

export interface BackupConfiguration {
  enabled: boolean;
  retentionDays: number;
  compressionEnabled: boolean;
  encryptBackups: boolean;
  backupLocation: string;
}

export interface DatabaseIntegrationConfig {
  version: string;
  providers: DatabaseProviderConfig[];
  security: SecurityOptions;
  backup: BackupConfiguration;
  autoDetection: {
    enabled: boolean;
    methods: string[];
    priority: DatabaseProvider[];
  };
  typeGeneration: {
    defaultOptions: TypeGenerationOptions;
    supportedORMs: string[];
  };
  mcp: {
    autoSetup: boolean;
    updateClaudeDesktop: boolean;
    backupConfigs: boolean;
  };
}

// Error types
export class DatabaseIntegrationError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: DatabaseProvider,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'DatabaseIntegrationError';
  }
}

export class CredentialError extends DatabaseIntegrationError {
  constructor(message: string, provider?: DatabaseProvider, details?: Record<string, any>) {
    super(message, 'CREDENTIAL_ERROR', provider, details);
    this.name = 'CredentialError';
  }
}

export class ConnectionError extends DatabaseIntegrationError {
  constructor(message: string, provider?: DatabaseProvider, details?: Record<string, any>) {
    super(message, 'CONNECTION_ERROR', provider, details);
    this.name = 'ConnectionError';
  }
}

export class ConfigurationError extends DatabaseIntegrationError {
  constructor(message: string, provider?: DatabaseProvider, details?: Record<string, any>) {
    super(message, 'CONFIGURATION_ERROR', provider, details);
    this.name = 'ConfigurationError';
  }
}

export class TypeGenerationError extends DatabaseIntegrationError {
  constructor(message: string, provider?: DatabaseProvider, details?: Record<string, any>) {
    super(message, 'TYPE_GENERATION_ERROR', provider, details);
    this.name = 'TypeGenerationError';
  }
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Event types for the system
export interface DatabaseEvent {
  type: string;
  timestamp: Date;
  data: Record<string, any>;
}

export interface CredentialStoredEvent extends DatabaseEvent {
  type: 'credential_stored';
  data: {
    provider: DatabaseProvider;
    alias: string;
    storageType: CredentialStorageType;
  };
}

export interface ConnectionTestedEvent extends DatabaseEvent {
  type: 'connection_tested';
  data: {
    provider: DatabaseProvider;
    success: boolean;
    latency?: number;
  };
}

export interface TypesGeneratedEvent extends DatabaseEvent {
  type: 'types_generated';
  data: {
    provider: DatabaseProvider;
    outputPath: string;
    fileCount: number;
  };
}

export interface MCPConfiguredEvent extends DatabaseEvent {
  type: 'mcp_configured';
  data: {
    provider: DatabaseProvider;
    configFile: string;
    serverName: string;
  };
}

// Plugin interface for extensibility
export interface DatabasePlugin {
  name: string;
  version: string;
  provider?: DatabaseProvider;
  initialize(config: Record<string, any>): Promise<void>;
  authenticate?(credentials: DatabaseCredentials): Promise<AuthenticationResult>;
  testConnection?(credentials: DatabaseCredentials): Promise<ConnectionTestResult>;
  generateTypes?(schema: DatabaseSchema, options: TypeGenerationOptions): Promise<TypeGenerationResult>;
  cleanup?(): Promise<void>;
}