/**
 * Knowledge Graph System Tests
 * Comprehensive tests for the knowledge graph functionality
 */

import * as path from 'path';
import * as fs from 'fs-extra';
import { 
  KnowledgeGraphGenerator, 
  KnowledgeGraphStore, 
  KnowledgeGraphQuery,
  KnowledgeGraphIntegration,
  DEFAULT_ANALYSIS_CONFIG,
  DEFAULT_INTEGRATION_CONFIG
} from '../index';
import { CodebaseContextManager } from '../../context/CodebaseContextManager';

describe('Knowledge Graph System', () => {
  const testProjectPath = path.join(__dirname, 'test-project');
  let contextManager: CodebaseContextManager;
  let integration: KnowledgeGraphIntegration;

  beforeAll(async () => {
    // Create test project structure
    await createTestProject();
    
    // Initialize system
    contextManager = new CodebaseContextManager();
    integration = new KnowledgeGraphIntegration(
      contextManager,
      {
        ...DEFAULT_INTEGRATION_CONFIG,
        storageConfig: {
          ...DEFAULT_INTEGRATION_CONFIG.storageConfig!,
          basePath: path.join(testProjectPath, '.knowledge-test')
        }
      }
    );
    
    await integration.initialize();
  });

  afterAll(async () => {
    // Cleanup
    integration.dispose();
    contextManager.dispose();
    await fs.remove(testProjectPath);
  });

  describe('Knowledge Graph Generation', () => {
    test('should generate knowledge graph for test project', async () => {
      const graphId = await integration.generateProjectKnowledgeGraph(testProjectPath);
      
      expect(graphId).toBeDefined();
      expect(typeof graphId).toBe('string');

      const graph = await integration.getProjectGraph(testProjectPath);
      expect(graph).toBeDefined();
      expect(graph!.nodes.size).toBeGreaterThan(0);
      expect(graph!.relationships.size).toBeGreaterThan(0);
    }, 30000);

    test('should create knowledge files', async () => {
      const knowledgeDir = path.join(testProjectPath, '.knowledge-test');
      const indexFile = path.join(knowledgeDir, 'index.md');
      
      expect(await fs.pathExists(knowledgeDir)).toBe(true);
      expect(await fs.pathExists(indexFile)).toBe(true);

      const indexContent = await fs.readFile(indexFile, 'utf-8');
      expect(indexContent).toContain('Knowledge Graph Index');
      expect(indexContent).toContain('Total Nodes:');
      expect(indexContent).toContain('Total Relationships:');
    });
  });

  describe('Knowledge Graph Querying', () => {
    test('should query nodes by type', async () => {
      const result = await integration.queryProject(testProjectPath, {
        select: { nodes: '*' },
        where: [{ field: 'type', operator: 'equals', value: 'class' }],
        limit: 10,
        includeMetadata: true
      });

      expect(result.nodes).toBeDefined();
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
    });

    test('should search knowledge base', async () => {
      const result = await integration.queryProject(testProjectPath, {
        select: { nodes: '*' },
        where: [
          { field: 'name', operator: 'contains', value: 'User' },
          { field: 'semantics.purpose', operator: 'contains', value: 'service', connector: 'or' }
        ],
        limit: 5,
        includeMetadata: true
      });

      expect(result.nodes).toBeDefined();
      expect(result.totalCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Knowledge Graph Analysis', () => {
    test('should find related files', async () => {
      const userServicePath = path.join(testProjectPath, 'src', 'services', 'UserService.ts');
      const related = await integration.findRelatedFiles(testProjectPath, userServicePath, 5);

      expect(Array.isArray(related)).toBe(true);
      expect(related.length).toBeGreaterThanOrEqual(0);
      
      for (const relation of related) {
        expect(relation.file).toBeDefined();
        expect(relation.relationship).toBeDefined();
        expect(typeof relation.score).toBe('number');
      }
    });

    test('should analyze dependencies', async () => {
      const userServicePath = path.join(testProjectPath, 'src', 'services', 'UserService.ts');
      const deps = await integration.getModuleDependencies(testProjectPath, userServicePath);

      expect(deps).toBeDefined();
      expect(Array.isArray(deps.dependencies)).toBe(true);
      expect(Array.isArray(deps.dependents)).toBe(true);
      expect(Array.isArray(deps.circularDependencies)).toBe(true);
    });

    test('should get file knowledge', async () => {
      const userServicePath = path.join(testProjectPath, 'src', 'services', 'UserService.ts');
      const knowledge = await integration.getFileKnowledge(testProjectPath, userServicePath);

      expect(Array.isArray(knowledge)).toBe(true);
      
      for (const node of knowledge) {
        expect(node.id).toBeDefined();
        expect(node.type).toBeDefined();
        expect(node.path).toBeDefined();
        expect(node.metadata).toBeDefined();
        expect(node.semantics).toBeDefined();
      }
    });
  });

  describe('Knowledge Graph Updates', () => {
    test('should update knowledge graph incrementally', async () => {
      const userServicePath = path.join(testProjectPath, 'src', 'services', 'UserService.ts');
      
      // Modify the file
      let content = await fs.readFile(userServicePath, 'utf-8');
      content += '\n\n// Added comment for test';
      await fs.writeFile(userServicePath, content);

      const result = await integration.updateKnowledgeGraph(testProjectPath, [userServicePath]);

      expect(result).toBeDefined();
      expect(result!.duration).toBeGreaterThan(0);
      expect(result!.added.length + result!.modified.length).toBeGreaterThan(0);
    });
  });

  describe('Advanced Graph Operations', () => {
    test('should perform graph analysis', async () => {
      const graph = await integration.getProjectGraph(testProjectPath);
      expect(graph).toBeDefined();
      
      const stats = graph!.statistics;
      expect(stats.nodeCount).toBeGreaterThan(0);
      expect(stats.relationshipCount).toBeGreaterThanOrEqual(0);
      expect(typeof stats.averageConnectivity).toBe('number');
      expect(typeof stats.maxDepth).toBe('number');
      expect(typeof stats.complexityDistribution).toBe('object');
    });
  });

  // Helper function to create test project
  async function createTestProject(): Promise<void> {
    await fs.ensureDir(testProjectPath);
    
    // Create package.json
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      dependencies: {
        'react': '^18.0.0',
        'axios': '^1.0.0'
      },
      devDependencies: {
        'typescript': '^5.0.0',
        '@types/react': '^18.0.0'
      }
    };
    await fs.writeJson(path.join(testProjectPath, 'package.json'), packageJson, { spaces: 2 });

    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        lib: ['ES2020', 'DOM'],
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };
    await fs.writeJson(path.join(testProjectPath, 'tsconfig.json'), tsconfig, { spaces: 2 });

    // Create src structure
    await fs.ensureDir(path.join(testProjectPath, 'src', 'components'));
    await fs.ensureDir(path.join(testProjectPath, 'src', 'services'));
    await fs.ensureDir(path.join(testProjectPath, 'src', 'types'));
    await fs.ensureDir(path.join(testProjectPath, 'src', 'utils'));

    // Create User type
    const userTypeContent = `
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  name: string;
  email: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
}

export type UserStatus = 'active' | 'inactive' | 'pending';
`;
    await fs.writeFile(path.join(testProjectPath, 'src', 'types', 'User.ts'), userTypeContent);

    // Create UserService
    const userServiceContent = `
import { User, CreateUserRequest, UpdateUserRequest, UserStatus } from '../types/User';
import { ApiClient } from '../utils/ApiClient';

/**
 * Service for managing user operations
 * Provides CRUD operations for user management
 */
export class UserService {
  private apiClient: ApiClient;

  constructor(apiClient: ApiClient) {
    this.apiClient = apiClient;
  }

  /**
   * Get user by ID
   * @param id - User identifier
   * @returns Promise<User | null>
   */
  async getUser(id: string): Promise<User | null> {
    try {
      const response = await this.apiClient.get(\`/users/\${id}\`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Create new user
   * @param userData - User creation data
   * @returns Promise<User>
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await this.apiClient.post('/users', userData);
    return response.data;
  }

  /**
   * Update existing user
   * @param id - User identifier
   * @param updates - User update data
   * @returns Promise<User>
   */
  async updateUser(id: string, updates: UpdateUserRequest): Promise<User> {
    const response = await this.apiClient.patch(\`/users/\${id}\`, updates);
    return response.data;
  }

  /**
   * Delete user
   * @param id - User identifier
   * @returns Promise<boolean>
   */
  async deleteUser(id: string): Promise<boolean> {
    try {
      await this.apiClient.delete(\`/users/\${id}\`);
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      return false;
    }
  }

  /**
   * List all users with pagination
   * @param page - Page number
   * @param limit - Items per page
   * @returns Promise<User[]>
   */
  async listUsers(page: number = 1, limit: number = 20): Promise<User[]> {
    const response = await this.apiClient.get('/users', {
      params: { page, limit }
    });
    return response.data;
  }

  /**
   * Update user status
   * @param id - User identifier
   * @param status - New user status
   * @returns Promise<User>
   */
  async updateUserStatus(id: string, status: UserStatus): Promise<User> {
    return this.updateUser(id, { status } as any);
  }
}

export default UserService;
`;
    await fs.writeFile(path.join(testProjectPath, 'src', 'services', 'UserService.ts'), userServiceContent);

    // Create ApiClient utility
    const apiClientContent = `
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * API Client for HTTP requests
 * Provides centralized HTTP communication
 */
export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string, config?: AxiosRequestConfig) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      ...config,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = \`Bearer \${token}\`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized access
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }
}

export default ApiClient;
`;
    await fs.writeFile(path.join(testProjectPath, 'src', 'utils', 'ApiClient.ts'), apiClientContent);

    // Create UserProfile component
    const userProfileContent = `
import React, { useState, useEffect } from 'react';
import { User } from '../types/User';
import { UserService } from '../services/UserService';

interface UserProfileProps {
  userId: string;
  userService: UserService;
  onUserUpdate?: (user: User) => void;
}

/**
 * UserProfile component
 * Displays and manages user profile information
 */
const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  userService, 
  onUserUpdate 
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editing, setEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<{ name: string; email: string }>({
    name: '',
    email: ''
  });

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async (): Promise<void> => {
    try {
      setLoading(true);
      const userData = await userService.getUser(userId);
      setUser(userData);
      if (userData) {
        setFormData({
          name: userData.name,
          email: userData.email
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (): Promise<void> => {
    if (!user) return;

    try {
      const updatedUser = await userService.updateUser(user.id, formData);
      setUser(updatedUser);
      setEditing(false);
      onUserUpdate?.(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleCancel = (): void => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email
      });
    }
    setEditing(false);
  };

  if (loading) {
    return <div className="loading">Loading user profile...</div>;
  }

  if (!user) {
    return <div className="error">User not found</div>;
  }

  return (
    <div className="user-profile">
      <h2>User Profile</h2>
      
      {editing ? (
        <div className="edit-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          
          <div className="form-actions">
            <button onClick={handleSave}>Save</button>
            <button onClick={handleCancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="profile-display">
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          <p><strong>Updated:</strong> {new Date(user.updatedAt).toLocaleDateString()}</p>
          
          <button onClick={() => setEditing(true)}>Edit Profile</button>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
`;
    await fs.writeFile(path.join(testProjectPath, 'src', 'components', 'UserProfile.tsx'), userProfileContent);

    // Create App component
    const appContent = `
import React, { useState } from 'react';
import UserProfile from './components/UserProfile';
import { UserService } from './services/UserService';
import { ApiClient } from './utils/ApiClient';
import { User } from './types/User';

/**
 * Main App component
 * Root component of the application
 */
const App: React.FC = () => {
  const [currentUserId, setCurrentUserId] = useState<string>('user-123');
  const [apiClient] = useState(() => new ApiClient('https://api.example.com'));
  const [userService] = useState(() => new UserService(apiClient));

  const handleUserUpdate = (user: User): void => {
    console.log('User updated:', user);
    // Handle user update logic
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>User Management System</h1>
      </header>
      
      <main className="app-main">
        <UserProfile
          userId={currentUserId}
          userService={userService}
          onUserUpdate={handleUserUpdate}
        />
      </main>
      
      <footer className="app-footer">
        <p>&copy; 2024 User Management System</p>
      </footer>
    </div>
  );
};

export default App;
`;
    await fs.writeFile(path.join(testProjectPath, 'src', 'App.tsx'), appContent);

    // Create index file
    const indexContent = `
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

/**
 * Application entry point
 */
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
    await fs.writeFile(path.join(testProjectPath, 'src', 'index.tsx'), indexContent);
  }
});

// Simple integration test to run manually
if (require.main === module) {
  describe.only('Manual Knowledge Graph Test', () => {
    test('should work with real project', async () => {
      const projectPath = process.cwd(); // Current Agentwise project
      
      const contextManager = new CodebaseContextManager();
      const integration = new KnowledgeGraphIntegration(
        contextManager,
        DEFAULT_INTEGRATION_CONFIG
      );
      
      await integration.initialize();
      
      console.log('Generating knowledge graph for current project...');
      const graphId = await integration.generateProjectKnowledgeGraph(projectPath);
      
      console.log(`Generated graph: ${graphId}`);
      
      const graph = await integration.getProjectGraph(projectPath);
      console.log(`Nodes: ${graph?.nodes.size}, Relationships: ${graph?.relationships.size}`);
      
      // Test query
      const classes = await integration.queryProject(projectPath, {
        select: { nodes: '*' },
        where: [{ field: 'type', operator: 'equals', value: 'class' }],
        limit: 5,
        includeMetadata: true
      });
      
      console.log(`Found ${classes.nodes.length} classes`);
      for (const node of classes.nodes) {
        console.log(`- ${node.name} (${node.metadata.linesOfCode} LOC)`);
      }
      
      integration.dispose();
      contextManager.dispose();
      
      expect(graphId).toBeDefined();
    }, 60000);
  });
}