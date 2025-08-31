/**
 * DatabaseTypeGenerator - Database type generation system
 * 
 * Introspects database schema and generates TypeScript types:
 * - Introspects database schema from various providers
 * - Generates TypeScript interfaces and types
 * - Creates typed database clients
 * - Generates ORM schemas (Prisma, Drizzle, TypeORM)
 * - Handles relationships and constraints
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync } from 'fs';
import {
  DatabaseCredentials,
  DatabaseProvider,
  DatabaseSchema,
  DatabaseTable,
  DatabaseColumn,
  DatabaseView,
  DatabaseFunction,
  DatabaseCustomType,
  DatabaseRelationship,
  TypeGenerationOptions,
  TypeGenerationResult,
  TypeGenerationError
} from './types.js';

export class DatabaseTypeGenerator {
  private readonly projectRoot: string;
  private readonly typeMapping: Map<DatabaseProvider, Map<string, string>>;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
    this.typeMapping = this.initializeTypeMapping();
  }

  /**
   * Generate types from database schema
   */
  async generateTypes(
    credentials: DatabaseCredentials,
    options: TypeGenerationOptions = {}
  ): Promise<TypeGenerationResult> {
    const result: TypeGenerationResult = {
      success: false,
      generatedFiles: [],
      types: '',
      interfaces: '',
      enums: '',
      errors: []
    };

    try {
      // Introspect database schema
      const schema = await this.introspectSchema(credentials);

      // Generate TypeScript types
      if (options.generateTypes !== false) {
        result.types = this.generateTypeDefinitions(schema, credentials.provider, options);
      }

      // Generate TypeScript interfaces
      if (options.generateInterfaces !== false) {
        result.interfaces = this.generateInterfaceDefinitions(schema, credentials.provider, options);
      }

      // Generate enums
      if (options.generateEnums !== false) {
        result.enums = this.generateEnumDefinitions(schema, credentials.provider, options);
      }

      // Generate typed client
      if (options.generateClient) {
        result.client = this.generateTypedClient(schema, credentials.provider, options);
      }

      // Generate ORM schema
      if (options.generateORM && options.ormType) {
        result.orm = await this.generateORMSchema(schema, credentials.provider, options.ormType, options);
      }

      // Write files to disk
      await this.writeGeneratedFiles(result, options);

      result.success = true;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Introspect database schema
   */
  private async introspectSchema(credentials: DatabaseCredentials): Promise<DatabaseSchema> {
    switch (credentials.provider) {
      case 'supabase':
        return this.introspectSupabaseSchema(credentials);
      case 'neon':
        return this.introspectPostgreSQLSchema(credentials);
      case 'planetscale':
        return this.introspectMySQLSchema(credentials);
      case 'postgresql':
        return this.introspectPostgreSQLSchema(credentials);
      case 'mysql':
        return this.introspectMySQLSchema(credentials);
      case 'sqlite':
        return this.introspectSQLiteSchema(credentials);
      default:
        throw new TypeGenerationError(`Unsupported provider for schema introspection: ${credentials.provider}`);
    }
  }

  /**
   * Introspect Supabase schema
   */
  private async introspectSupabaseSchema(credentials: DatabaseCredentials): Promise<DatabaseSchema> {
    if (!credentials.connectionUrl || !credentials.apiKey) {
      throw new TypeGenerationError('Supabase introspection requires URL and API key');
    }

    try {
      // Use Supabase REST API to introspect schema
      const response = await fetch(`${credentials.connectionUrl}/rest/v1/`, {
        headers: {
          'apikey': credentials.apiKey,
          'Authorization': `Bearer ${credentials.apiKey}`,
          'Accept': 'application/vnd.pgrst.object+json'
        }
      });

      if (!response.ok) {
        throw new TypeGenerationError(`Supabase API error: ${response.status} ${response.statusText}`);
      }

      // Get OpenAPI schema
      const openAPIResponse = await fetch(`${credentials.connectionUrl}/rest/v1/`, {
        headers: {
          'apikey': credentials.apiKey,
          'Accept': 'application/openapi+json'
        }
      });

      if (openAPIResponse.ok) {
        const openAPISchema = await openAPIResponse.json();
        return this.parseSupabaseOpenAPISchema(openAPISchema);
      }

      // Fallback to basic introspection
      return this.introspectPostgreSQLSchema(credentials);
    } catch (error) {
      throw new TypeGenerationError(
        `Failed to introspect Supabase schema: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Parse Supabase OpenAPI schema
   */
  private parseSupabaseOpenAPISchema(openAPISchema: any): DatabaseSchema {
    const schema: DatabaseSchema = {
      tables: [],
      views: [],
      functions: [],
      types: [],
      relationships: []
    };

    // Parse components/schemas for table definitions
    if (openAPISchema.components?.schemas) {
      for (const [tableName, tableSchema] of Object.entries(openAPISchema.components.schemas)) {
        if (typeof tableSchema === 'object' && tableSchema !== null) {
          const table = this.parseOpenAPITableSchema(tableName, tableSchema as any);
          if (table) {
            schema.tables.push(table);
          }
        }
      }
    }

    // Parse paths for additional information
    if (openAPISchema.paths) {
      this.parseOpenAPIPaths(openAPISchema.paths, schema);
    }

    return schema;
  }

  /**
   * Parse OpenAPI table schema
   */
  private parseOpenAPITableSchema(tableName: string, tableSchema: any): DatabaseTable | null {
    if (tableSchema.type !== 'object' || !tableSchema.properties) {
      return null;
    }

    const columns: DatabaseColumn[] = [];
    
    for (const [columnName, columnSchema] of Object.entries(tableSchema.properties)) {
      if (typeof columnSchema === 'object' && columnSchema !== null) {
        const column = this.parseOpenAPIColumnSchema(columnName, columnSchema as any, tableSchema.required || []);
        columns.push(column);
      }
    }

    return {
      name: tableName,
      schema: 'public',
      columns,
      primaryKey: this.extractPrimaryKey(columns),
      foreignKeys: [],
      indexes: [],
      constraints: []
    };
  }

  /**
   * Parse OpenAPI column schema
   */
  private parseOpenAPIColumnSchema(columnName: string, columnSchema: any, required: string[]): DatabaseColumn {
    const type = this.mapOpenAPITypeToPostgreSQL(columnSchema);
    
    return {
      name: columnName,
      type,
      nullable: !required.includes(columnName),
      isPrimaryKey: columnName === 'id' || columnName.endsWith('_id'), // Simple heuristic
      isForeignKey: columnName.endsWith('_id') && columnName !== 'id',
      isUnique: false,
      comment: columnSchema.description
    };
  }

  /**
   * Map OpenAPI type to PostgreSQL type
   */
  private mapOpenAPITypeToPostgreSQL(schema: any): string {
    if (schema.type === 'string') {
      if (schema.format === 'uuid') return 'uuid';
      if (schema.format === 'date-time') return 'timestamp with time zone';
      if (schema.format === 'date') return 'date';
      return schema.maxLength ? `varchar(${schema.maxLength})` : 'text';
    }
    
    if (schema.type === 'integer') {
      return schema.format === 'int64' ? 'bigint' : 'integer';
    }
    
    if (schema.type === 'number') {
      return 'numeric';
    }
    
    if (schema.type === 'boolean') {
      return 'boolean';
    }
    
    if (schema.type === 'array') {
      const itemType = this.mapOpenAPITypeToPostgreSQL(schema.items || { type: 'text' });
      return `${itemType}[]`;
    }
    
    if (schema.type === 'object') {
      return 'jsonb';
    }

    return 'text';
  }

  /**
   * Parse OpenAPI paths for additional schema information
   */
  private parseOpenAPIPaths(paths: any, schema: DatabaseSchema): void {
    // Extract relationship information from paths
    for (const [pathName, pathObj] of Object.entries(paths)) {
      if (typeof pathObj === 'object' && pathObj !== null) {
        // This is a simplified implementation
        // In practice, you'd analyze the path parameters and responses
        // to extract relationship information
      }
    }
  }

  /**
   * Introspect PostgreSQL schema
   */
  private async introspectPostgreSQLSchema(credentials: DatabaseCredentials): Promise<DatabaseSchema> {
    // This is a placeholder implementation
    // In practice, you'd use pg library to connect and query information_schema
    
    const schema: DatabaseSchema = {
      tables: [
        {
          name: 'users',
          schema: 'public',
          columns: [
            {
              name: 'id',
              type: 'uuid',
              nullable: false,
              isPrimaryKey: true,
              isForeignKey: false,
              isUnique: true
            },
            {
              name: 'email',
              type: 'varchar(255)',
              nullable: false,
              isPrimaryKey: false,
              isForeignKey: false,
              isUnique: true
            },
            {
              name: 'name',
              type: 'text',
              nullable: true,
              isPrimaryKey: false,
              isForeignKey: false,
              isUnique: false
            },
            {
              name: 'created_at',
              type: 'timestamp with time zone',
              nullable: false,
              isPrimaryKey: false,
              isForeignKey: false,
              isUnique: false,
              defaultValue: 'now()'
            }
          ],
          primaryKey: ['id'],
          foreignKeys: [],
          indexes: [
            {
              name: 'users_email_idx',
              columns: ['email'],
              unique: true
            }
          ],
          constraints: []
        }
      ],
      views: [],
      functions: [],
      types: [],
      relationships: []
    };

    return schema;
  }

  /**
   * Introspect MySQL schema
   */
  private async introspectMySQLSchema(credentials: DatabaseCredentials): Promise<DatabaseSchema> {
    // Placeholder implementation
    // In practice, you'd use mysql2 library to connect and query information_schema
    
    return {
      tables: [],
      views: [],
      functions: [],
      types: [],
      relationships: []
    };
  }

  /**
   * Introspect SQLite schema
   */
  private async introspectSQLiteSchema(credentials: DatabaseCredentials): Promise<DatabaseSchema> {
    // Placeholder implementation
    // In practice, you'd use sqlite3 library to connect and query sqlite_master
    
    return {
      tables: [],
      views: [],
      functions: [],
      types: [],
      relationships: []
    };
  }

  /**
   * Generate TypeScript type definitions
   */
  private generateTypeDefinitions(
    schema: DatabaseSchema, 
    provider: DatabaseProvider, 
    options: TypeGenerationOptions
  ): string {
    const lines: string[] = [];
    
    lines.push('/**');
    lines.push(' * Database Types');
    lines.push(` * Generated from ${provider} database schema`);
    lines.push(' * Do not edit manually - this file will be regenerated');
    lines.push(' */');
    lines.push('');

    // Generate table types
    for (const table of schema.tables) {
      const typeName = this.formatTypeName(table.name, options);
      
      lines.push(`export type ${typeName} = {`);
      
      for (const column of table.columns) {
        const tsType = this.mapDatabaseTypeToTypeScript(column.type, provider);
        const optional = column.nullable && !column.isPrimaryKey ? '?' : '';
        
        if (options.includeComments && column.comment) {
          lines.push(`  /** ${column.comment} */`);
        }
        
        lines.push(`  ${this.formatPropertyName(column.name, options)}${optional}: ${tsType};`);
      }
      
      lines.push('};');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate TypeScript interface definitions
   */
  private generateInterfaceDefinitions(
    schema: DatabaseSchema,
    provider: DatabaseProvider,
    options: TypeGenerationOptions
  ): string {
    const lines: string[] = [];
    
    lines.push('/**');
    lines.push(' * Database Interfaces');
    lines.push(` * Generated from ${provider} database schema`);
    lines.push(' * Do not edit manually - this file will be regenerated');
    lines.push(' */');
    lines.push('');

    // Generate table interfaces
    for (const table of schema.tables) {
      const interfaceName = `I${this.formatTypeName(table.name, options)}`;
      
      lines.push(`export interface ${interfaceName} {`);
      
      for (const column of table.columns) {
        const tsType = this.mapDatabaseTypeToTypeScript(column.type, provider);
        const optional = column.nullable && !column.isPrimaryKey ? '?' : '';
        
        if (options.includeComments && column.comment) {
          lines.push(`  /** ${column.comment} */`);
        }
        
        lines.push(`  ${this.formatPropertyName(column.name, options)}${optional}: ${tsType};`);
      }
      
      lines.push('}');
      lines.push('');

      // Generate insert interface (without auto-generated fields)
      const insertInterfaceName = `I${this.formatTypeName(table.name, options)}Insert`;
      lines.push(`export interface ${insertInterfaceName} {`);
      
      for (const column of table.columns) {
        // Skip auto-generated fields for insert interface
        if (column.isPrimaryKey && column.defaultValue) continue;
        if (column.name === 'created_at' || column.name === 'updated_at') continue;
        
        const tsType = this.mapDatabaseTypeToTypeScript(column.type, provider);
        const optional = column.nullable || column.defaultValue ? '?' : '';
        
        lines.push(`  ${this.formatPropertyName(column.name, options)}${optional}: ${tsType};`);
      }
      
      lines.push('}');
      lines.push('');

      // Generate update interface (all fields optional except primary key)
      const updateInterfaceName = `I${this.formatTypeName(table.name, options)}Update`;
      lines.push(`export interface ${updateInterfaceName} {`);
      
      for (const column of table.columns) {
        // Skip auto-generated fields for update interface
        if (column.name === 'created_at') continue;
        
        const tsType = this.mapDatabaseTypeToTypeScript(column.type, provider);
        const optional = column.isPrimaryKey ? '' : '?';
        
        lines.push(`  ${this.formatPropertyName(column.name, options)}${optional}: ${tsType};`);
      }
      
      lines.push('}');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate enum definitions
   */
  private generateEnumDefinitions(
    schema: DatabaseSchema,
    provider: DatabaseProvider,
    options: TypeGenerationOptions
  ): string {
    const lines: string[] = [];
    
    lines.push('/**');
    lines.push(' * Database Enums');
    lines.push(` * Generated from ${provider} database schema`);
    lines.push(' * Do not edit manually - this file will be regenerated');
    lines.push(' */');
    lines.push('');

    // Generate enums from custom types
    for (const customType of schema.types) {
      if (customType.type === 'enum' && customType.values) {
        const enumName = this.formatTypeName(customType.name, options);
        
        lines.push(`export enum ${enumName} {`);
        
        for (const value of customType.values) {
          const enumValue = this.formatEnumValue(value);
          lines.push(`  ${enumValue} = '${value}',`);
        }
        
        lines.push('}');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate typed client
   */
  private generateTypedClient(
    schema: DatabaseSchema,
    provider: DatabaseProvider,
    options: TypeGenerationOptions
  ): string {
    const lines: string[] = [];
    const namespace = options.namespace || 'Database';
    
    lines.push('/**');
    lines.push(' * Typed Database Client');
    lines.push(` * Generated from ${provider} database schema`);
    lines.push(' * Do not edit manually - this file will be regenerated');
    lines.push(' */');
    lines.push('');
    
    lines.push(`export class ${namespace}Client {`);
    lines.push('  private client: any;');
    lines.push('');
    lines.push('  constructor(client: any) {');
    lines.push('    this.client = client;');
    lines.push('  }');
    lines.push('');

    // Generate methods for each table
    for (const table of schema.tables) {
      const tableName = table.name;
      const typeName = this.formatTypeName(table.name, options);
      const insertType = `I${typeName}Insert`;
      const updateType = `I${typeName}Update`;
      
      // Find all method
      lines.push(`  async find${typeName}All(): Promise<${typeName}[]> {`);
      lines.push(`    return this.client.from('${tableName}').select('*');`);
      lines.push('  }');
      lines.push('');
      
      // Find by ID method
      const primaryKeyColumn = table.columns.find(col => col.isPrimaryKey);
      if (primaryKeyColumn) {
        const keyType = this.mapDatabaseTypeToTypeScript(primaryKeyColumn.type, provider);
        lines.push(`  async find${typeName}ById(id: ${keyType}): Promise<${typeName} | null> {`);
        lines.push(`    const result = await this.client.from('${tableName}').select('*').eq('${primaryKeyColumn.name}', id).single();`);
        lines.push('    return result.data;');
        lines.push('  }');
        lines.push('');
      }
      
      // Create method
      lines.push(`  async create${typeName}(data: ${insertType}): Promise<${typeName}> {`);
      lines.push(`    const result = await this.client.from('${tableName}').insert(data).select().single();`);
      lines.push('    return result.data;');
      lines.push('  }');
      lines.push('');
      
      // Update method
      if (primaryKeyColumn) {
        const keyType = this.mapDatabaseTypeToTypeScript(primaryKeyColumn.type, provider);
        lines.push(`  async update${typeName}(id: ${keyType}, data: Partial<${updateType}>): Promise<${typeName}> {`);
        lines.push(`    const result = await this.client.from('${tableName}').update(data).eq('${primaryKeyColumn.name}', id).select().single();`);
        lines.push('    return result.data;');
        lines.push('  }');
        lines.push('');
        
        // Delete method
        lines.push(`  async delete${typeName}(id: ${keyType}): Promise<void> {`);
        lines.push(`    await this.client.from('${tableName}').delete().eq('${primaryKeyColumn.name}', id);`);
        lines.push('  }');
        lines.push('');
      }
    }
    
    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Generate ORM schema
   */
  private async generateORMSchema(
    schema: DatabaseSchema,
    provider: DatabaseProvider,
    ormType: string,
    options: TypeGenerationOptions
  ): Promise<string> {
    switch (ormType) {
      case 'prisma':
        return this.generatePrismaSchema(schema, provider, options);
      case 'drizzle':
        return this.generateDrizzleSchema(schema, provider, options);
      case 'typeorm':
        return this.generateTypeORMSchema(schema, provider, options);
      default:
        throw new TypeGenerationError(`Unsupported ORM type: ${ormType}`);
    }
  }

  /**
   * Generate Prisma schema
   */
  private generatePrismaSchema(
    schema: DatabaseSchema,
    provider: DatabaseProvider,
    options: TypeGenerationOptions
  ): string {
    const lines: string[] = [];
    
    // Generator and datasource blocks
    lines.push('generator client {');
    lines.push('  provider = "prisma-client-js"');
    lines.push('}');
    lines.push('');
    
    lines.push('datasource db {');
    lines.push(`  provider = "${this.mapProviderToPrisma(provider)}"`);
    lines.push('  url      = env("DATABASE_URL")');
    lines.push('}');
    lines.push('');

    // Generate models
    for (const table of schema.tables) {
      const modelName = this.formatTypeName(table.name, options);
      
      lines.push(`model ${modelName} {`);
      
      for (const column of table.columns) {
        const prismaType = this.mapDatabaseTypeToPrisma(column.type, provider);
        const optional = column.nullable && !column.isPrimaryKey ? '?' : '';
        const primaryKey = column.isPrimaryKey ? ' @id' : '';
        const unique = column.isUnique ? ' @unique' : '';
        const defaultValue = column.defaultValue ? ` @default(${this.formatPrismaDefault(column.defaultValue, column.type)})` : '';
        
        lines.push(`  ${this.formatPropertyName(column.name, options)} ${prismaType}${optional}${primaryKey}${unique}${defaultValue}`);
      }
      
      lines.push(`  @@map("${table.name}")`);
      lines.push('}');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate Drizzle schema
   */
  private generateDrizzleSchema(
    schema: DatabaseSchema,
    provider: DatabaseProvider,
    options: TypeGenerationOptions
  ): string {
    const lines: string[] = [];
    
    // Import statements
    const drizzleImports = this.getDrizzleImports(provider);
    lines.push(`import { ${drizzleImports.join(', ')} } from 'drizzle-orm/${this.mapProviderToDrizzle(provider)}';`);
    lines.push('');

    // Generate table definitions
    for (const table of schema.tables) {
      const tableName = this.formatPropertyName(table.name, options);
      
      lines.push(`export const ${tableName} = ${this.mapProviderToDrizzleTable(provider)}('${table.name}', {`);
      
      for (const column of table.columns) {
        const drizzleType = this.mapDatabaseTypeToDrizzle(column.type, provider);
        const constraints: string[] = [];
        
        if (column.isPrimaryKey) constraints.push('primaryKey()');
        if (column.isUnique) constraints.push('unique()');
        if (!column.nullable) constraints.push('notNull()');
        if (column.defaultValue) constraints.push(`default(${this.formatDrizzleDefault(column.defaultValue, column.type)})`);
        
        const constraintString = constraints.length > 0 ? `.${constraints.join('.')}` : '';
        
        lines.push(`  ${this.formatPropertyName(column.name, options)}: ${drizzleType}('${column.name}')${constraintString},`);
      }
      
      lines.push('});');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate TypeORM schema
   */
  private generateTypeORMSchema(
    schema: DatabaseSchema,
    provider: DatabaseProvider,
    options: TypeGenerationOptions
  ): string {
    const lines: string[] = [];
    
    // Import statements
    lines.push(`import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';`);
    lines.push('');

    // Generate entity classes
    for (const table of schema.tables) {
      const entityName = this.formatTypeName(table.name, options);
      
      lines.push(`@Entity('${table.name}')`);
      lines.push(`export class ${entityName} {`);
      
      for (const column of table.columns) {
        const decorators: string[] = [];
        
        if (column.isPrimaryKey) {
          if (column.type === 'uuid') {
            decorators.push('@PrimaryGeneratedColumn("uuid")');
          } else {
            decorators.push('@PrimaryGeneratedColumn()');
          }
        } else {
          const columnOptions: string[] = [];
          
          if (column.type.includes('varchar')) {
            const match = column.type.match(/varchar\((\d+)\)/);
            if (match) {
              columnOptions.push(`length: ${match[1]}`);
            }
          }
          
          if (column.nullable) {
            columnOptions.push('nullable: true');
          }
          
          if (column.isUnique) {
            columnOptions.push('unique: true');
          }
          
          if (column.defaultValue) {
            columnOptions.push(`default: ${this.formatTypeORMDefault(column.defaultValue, column.type)}`);
          }
          
          const optionsString = columnOptions.length > 0 ? `{ ${columnOptions.join(', ')} }` : '';
          decorators.push(`@Column(${optionsString})`);
        }
        
        for (const decorator of decorators) {
          lines.push(`  ${decorator}`);
        }
        
        const tsType = this.mapDatabaseTypeToTypeScript(column.type, provider);
        const optional = column.nullable && !column.isPrimaryKey ? '?' : '';
        
        lines.push(`  ${this.formatPropertyName(column.name, options)}${optional}: ${tsType};`);
        lines.push('');
      }
      
      lines.push('}');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Write generated files to disk
   */
  private async writeGeneratedFiles(
    result: TypeGenerationResult,
    options: TypeGenerationOptions
  ): Promise<void> {
    const outputPath = options.outputPath || path.join(this.projectRoot, 'types', 'database');
    await fs.mkdir(outputPath, { recursive: true });

    // Write types file
    if (result.types) {
      const typesFile = path.join(outputPath, 'types.ts');
      await fs.writeFile(typesFile, result.types, 'utf8');
      result.generatedFiles.push(typesFile);
    }

    // Write interfaces file
    if (result.interfaces) {
      const interfacesFile = path.join(outputPath, 'interfaces.ts');
      await fs.writeFile(interfacesFile, result.interfaces, 'utf8');
      result.generatedFiles.push(interfacesFile);
    }

    // Write enums file
    if (result.enums) {
      const enumsFile = path.join(outputPath, 'enums.ts');
      await fs.writeFile(enumsFile, result.enums, 'utf8');
      result.generatedFiles.push(enumsFile);
    }

    // Write client file
    if (result.client) {
      const clientFile = path.join(outputPath, 'client.ts');
      await fs.writeFile(clientFile, result.client, 'utf8');
      result.generatedFiles.push(clientFile);
    }

    // Write ORM schema file
    if (result.orm && options.ormType) {
      const extension = options.ormType === 'prisma' ? '.prisma' : '.ts';
      const ormFile = path.join(outputPath, `schema${extension}`);
      await fs.writeFile(ormFile, result.orm, 'utf8');
      result.generatedFiles.push(ormFile);
    }

    // Write index file
    const indexFile = path.join(outputPath, 'index.ts');
    const indexContent = this.generateIndexFile(result, options);
    await fs.writeFile(indexFile, indexContent, 'utf8');
    result.generatedFiles.push(indexFile);
  }

  /**
   * Generate index file
   */
  private generateIndexFile(result: TypeGenerationResult, options: TypeGenerationOptions): string {
    const lines: string[] = [];
    
    lines.push('/**');
    lines.push(' * Database Types Index');
    lines.push(' * Auto-generated - do not edit manually');
    lines.push(' */');
    lines.push('');

    if (result.types) {
      lines.push("export * from './types.js';");
    }

    if (result.interfaces) {
      lines.push("export * from './interfaces.js';");
    }

    if (result.enums) {
      lines.push("export * from './enums.js';");
    }

    if (result.client) {
      lines.push("export * from './client.js';");
    }

    return lines.join('\n');
  }

  /**
   * Initialize type mapping
   */
  private initializeTypeMapping(): Map<DatabaseProvider, Map<string, string>> {
    const mapping = new Map();

    // PostgreSQL type mapping
    const postgresqlMapping = new Map([
      ['text', 'string'],
      ['varchar', 'string'],
      ['char', 'string'],
      ['integer', 'number'],
      ['int', 'number'],
      ['bigint', 'number'],
      ['smallint', 'number'],
      ['decimal', 'number'],
      ['numeric', 'number'],
      ['real', 'number'],
      ['double precision', 'number'],
      ['boolean', 'boolean'],
      ['timestamp', 'Date'],
      ['timestamp with time zone', 'Date'],
      ['timestamp without time zone', 'Date'],
      ['date', 'Date'],
      ['time', 'string'],
      ['uuid', 'string'],
      ['jsonb', 'object'],
      ['json', 'object'],
      ['bytea', 'Buffer']
    ]);

    mapping.set('postgresql', postgresqlMapping);
    mapping.set('supabase', postgresqlMapping);
    mapping.set('neon', postgresqlMapping);

    // MySQL type mapping
    const mysqlMapping = new Map([
      ['varchar', 'string'],
      ['text', 'string'],
      ['char', 'string'],
      ['int', 'number'],
      ['integer', 'number'],
      ['bigint', 'number'],
      ['smallint', 'number'],
      ['tinyint', 'boolean'],
      ['decimal', 'number'],
      ['float', 'number'],
      ['double', 'number'],
      ['datetime', 'Date'],
      ['timestamp', 'Date'],
      ['date', 'Date'],
      ['time', 'string'],
      ['json', 'object'],
      ['blob', 'Buffer']
    ]);

    mapping.set('mysql', mysqlMapping);
    mapping.set('planetscale', mysqlMapping);

    // SQLite type mapping
    const sqliteMapping = new Map([
      ['TEXT', 'string'],
      ['INTEGER', 'number'],
      ['REAL', 'number'],
      ['BLOB', 'Buffer'],
      ['NUMERIC', 'number']
    ]);

    mapping.set('sqlite', sqliteMapping);

    return mapping;
  }

  /**
   * Map database type to TypeScript type
   */
  private mapDatabaseTypeToTypeScript(dbType: string, provider: DatabaseProvider): string {
    const providerMapping = this.typeMapping.get(provider);
    if (!providerMapping) return 'unknown';

    // Handle array types
    if (dbType.endsWith('[]')) {
      const baseType = dbType.slice(0, -2);
      const tsType = providerMapping.get(baseType) || 'unknown';
      return `${tsType}[]`;
    }

    // Handle varchar with length
    if (dbType.startsWith('varchar')) {
      return 'string';
    }

    return providerMapping.get(dbType) || 'unknown';
  }

  /**
   * Utility methods for formatting
   */
  private formatTypeName(name: string, options: TypeGenerationOptions): string {
    let formatted = name;
    
    if (options.camelCase) {
      formatted = this.toPascalCase(formatted);
    } else {
      formatted = this.toPascalCase(formatted);
    }
    
    return formatted;
  }

  private formatPropertyName(name: string, options: TypeGenerationOptions): string {
    if (options.camelCase) {
      return this.toCamelCase(name);
    }
    return name;
  }

  private formatEnumValue(value: string): string {
    return value.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  }

  private toPascalCase(str: string): string {
    return str.replace(/(^|_)([a-z])/g, (_, __, char) => char.toUpperCase());
  }

  private toCamelCase(str: string): string {
    return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
  }

  /**
   * Helper methods for different ORMs
   */
  private mapProviderToPrisma(provider: DatabaseProvider): string {
    const mapping: Record<DatabaseProvider, string> = {
      postgresql: 'postgresql',
      supabase: 'postgresql',
      neon: 'postgresql',
      mysql: 'mysql',
      planetscale: 'mysql',
      sqlite: 'sqlite'
    };
    return mapping[provider] || 'postgresql';
  }

  private mapProviderToDrizzle(provider: DatabaseProvider): string {
    const mapping: Record<DatabaseProvider, string> = {
      postgresql: 'pg-core',
      supabase: 'pg-core',
      neon: 'pg-core',
      mysql: 'mysql-core',
      planetscale: 'mysql-core',
      sqlite: 'sqlite-core'
    };
    return mapping[provider] || 'pg-core';
  }

  private mapProviderToDrizzleTable(provider: DatabaseProvider): string {
    const mapping: Record<DatabaseProvider, string> = {
      postgresql: 'pgTable',
      supabase: 'pgTable',
      neon: 'pgTable',
      mysql: 'mysqlTable',
      planetscale: 'mysqlTable',
      sqlite: 'sqliteTable'
    };
    return mapping[provider] || 'pgTable';
  }

  private getDrizzleImports(provider: DatabaseProvider): string[] {
    const baseImports = ['text', 'integer', 'boolean', 'timestamp'];
    
    if (provider === 'postgresql' || provider === 'supabase' || provider === 'neon') {
      return [...baseImports, 'pgTable', 'uuid', 'jsonb'];
    } else if (provider === 'mysql' || provider === 'planetscale') {
      return [...baseImports, 'mysqlTable', 'varchar', 'json'];
    } else if (provider === 'sqlite') {
      return [...baseImports, 'sqliteTable'];
    }
    
    return baseImports;
  }

  private mapDatabaseTypeToPrisma(dbType: string, provider: DatabaseProvider): string {
    // Simplified mapping - would need more comprehensive implementation
    if (dbType === 'uuid') return 'String';
    if (dbType.startsWith('varchar') || dbType === 'text') return 'String';
    if (dbType === 'integer' || dbType === 'int' || dbType === 'bigint') return 'Int';
    if (dbType === 'boolean' || dbType === 'tinyint') return 'Boolean';
    if (dbType.includes('timestamp') || dbType === 'datetime') return 'DateTime';
    if (dbType === 'jsonb' || dbType === 'json') return 'Json';
    return 'String';
  }

  private mapDatabaseTypeToDrizzle(dbType: string, provider: DatabaseProvider): string {
    // Simplified mapping - would need more comprehensive implementation
    if (dbType === 'uuid') return 'uuid';
    if (dbType.startsWith('varchar')) return 'varchar';
    if (dbType === 'text') return 'text';
    if (dbType === 'integer' || dbType === 'int') return 'integer';
    if (dbType === 'bigint') return 'bigint';
    if (dbType === 'boolean') return 'boolean';
    if (dbType.includes('timestamp')) return 'timestamp';
    if (dbType === 'jsonb') return 'jsonb';
    if (dbType === 'json') return 'json';
    return 'text';
  }

  private formatPrismaDefault(defaultValue: any, columnType: string): string {
    if (defaultValue === 'now()') return 'now()';
    if (typeof defaultValue === 'string') return `"${defaultValue}"`;
    return String(defaultValue);
  }

  private formatDrizzleDefault(defaultValue: any, columnType: string): string {
    if (defaultValue === 'now()') return 'sql`now()`';
    if (typeof defaultValue === 'string') return `'${defaultValue}'`;
    return String(defaultValue);
  }

  private formatTypeORMDefault(defaultValue: any, columnType: string): string {
    if (defaultValue === 'now()') return '() => "CURRENT_TIMESTAMP"';
    if (typeof defaultValue === 'string') return `'${defaultValue}'`;
    return String(defaultValue);
  }

  private extractPrimaryKey(columns: DatabaseColumn[]): string[] {
    return columns.filter(col => col.isPrimaryKey).map(col => col.name);
  }
}