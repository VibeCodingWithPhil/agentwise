import axios from 'axios';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface FigmaConfig {
    serverUrl: string;
    port: number;
    enabled: boolean;
}

interface FigmaDesignContext {
    selection: any;
    variables: any[];
    components: any[];
    codeConnect: any;
}

interface CodeGenerationOptions {
    framework?: 'react' | 'vue' | 'angular' | 'html' | 'swift' | 'kotlin';
    includeStyles?: boolean;
    includeResponsive?: boolean;
    useCodeConnect?: boolean;
}

export class FigmaMCPClient extends EventEmitter {
    private config: FigmaConfig;
    private isConnected: boolean = false;
    private serverUrl: string;

    constructor() {
        super();
        this.config = {
            serverUrl: 'http://127.0.0.1',
            port: 3845,
            enabled: false
        };
        this.serverUrl = `${this.config.serverUrl}:${this.config.port}/mcp`;
    }

    private validatePath(userPath: string, baseDir?: string): string {
        const base = baseDir || process.cwd();
        const resolved = path.resolve(base, userPath);
        const resolvedBase = path.resolve(base);
        
        if (!resolved.startsWith(resolvedBase)) {
            throw new Error('Invalid path: Access denied outside project directory');
        }
        
        return resolved;
    }

    private validateComponentName(name: string): boolean {
        // Only allow alphanumeric, dash, and underscore
        const validName = /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(name);
        const validLength = name.length > 0 && name.length <= 50;
        return validName && validLength;
    }

    async initialize(): Promise<void> {
        try {
            await this.checkFigmaDesktop();
            await this.checkServerStatus();
            this.isConnected = true;
            this.emit('connected');
            console.log('✅ Connected to Figma Dev Mode MCP Server');
        } catch (error) {
            console.error('❌ Failed to initialize Figma MCP Client:', error);
            throw error;
        }
    }

    private async checkFigmaDesktop(): Promise<boolean> {
        try {
            const platform = process.platform;
            let processName: string;

            switch (platform) {
                case 'darwin':
                    processName = 'Figma';
                    break;
                case 'win32':
                    processName = 'Figma.exe';
                    break;
                case 'linux':
                    processName = 'figma';
                    break;
                default:
                    throw new Error(`Unsupported platform: ${platform}`);
            }

            // Safer process checking using pgrep on Unix-like systems
            const command = platform === 'win32' 
                ? `wmic process where "name='${processName}'" get ProcessId`
                : `pgrep -x "${processName}" || pgrep -f "${processName}"`;

            const { stdout } = await execAsync(command);
            if (!stdout || stdout.trim() === '') {
                console.warn('⚠️ Figma desktop app is not running. Please launch Figma to use MCP features.');
                return false;
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    private async checkServerStatus(): Promise<void> {
        try {
            const response = await axios.get(`${this.serverUrl}/status`, {
                timeout: 5000
            });
            
            if (response.status !== 200) {
                throw new Error('Figma MCP Server is not responding');
            }
        } catch (error) {
            throw new Error('Figma MCP Server is not accessible. Please enable it in Figma Preferences.');
        }
    }

    async getCode(options: CodeGenerationOptions = {}): Promise<string> {
        if (!this.isConnected) {
            throw new Error('Not connected to Figma MCP Server');
        }

        try {
            const response = await axios.post(`${this.serverUrl}/tools/get_code`, {
                framework: options.framework || 'react',
                includeStyles: options.includeStyles !== false,
                includeResponsive: options.includeResponsive || false,
                useCodeConnect: options.useCodeConnect || false
            });

            return response.data.code;
        } catch (error: any) {
            throw new Error(`Failed to generate code: ${error.message}`);
        }
    }

    async getVariableDefinitions(): Promise<any[]> {
        if (!this.isConnected) {
            throw new Error('Not connected to Figma MCP Server');
        }

        try {
            const response = await axios.post(`${this.serverUrl}/tools/get_variable_defs`, {});
            return response.data.variables;
        } catch (error: any) {
            throw new Error(`Failed to get variable definitions: ${error.message}`);
        }
    }

    async getCodeConnectMap(): Promise<any> {
        if (!this.isConnected) {
            throw new Error('Not connected to Figma MCP Server');
        }

        try {
            const response = await axios.post(`${this.serverUrl}/tools/get_code_connect_map`, {});
            return response.data.components;
        } catch (error: any) {
            throw new Error(`Failed to get Code Connect map: ${error.message}`);
        }
    }

    async getImage(outputPath?: string): Promise<Buffer | string> {
        if (!this.isConnected) {
            throw new Error('Not connected to Figma MCP Server');
        }

        try {
            const response = await axios.post(`${this.serverUrl}/tools/get_image`, {}, {
                responseType: 'arraybuffer'
            });

            const imageBuffer = Buffer.from(response.data);

            if (outputPath) {
                const safePath = this.validatePath(outputPath);
                fs.writeFileSync(safePath, imageBuffer);
                return safePath;
            }

            return imageBuffer;
        } catch (error: any) {
            console.error('Image capture error:', error);
            throw new Error('Failed to capture image. Please check your selection.');
        }
    }

    async createDesignSystemRules(outputDir: string): Promise<void> {
        if (!this.isConnected) {
            throw new Error('Not connected to Figma MCP Server');
        }

        try {
            const response = await axios.post(`${this.serverUrl}/tools/create_design_system_rules`, {});
            
            const rules = response.data.rules;
            const safeDir = this.validatePath(outputDir);
            const rulesPath = path.join(safeDir, 'design-system-rules.json');
            
            if (!fs.existsSync(safeDir)) {
                fs.mkdirSync(safeDir, { recursive: true });
            }
            
            fs.writeFileSync(rulesPath, JSON.stringify(rules, null, 2));
            
            console.log(`✅ Design system rules saved to: ${rulesPath}`);
        } catch (error: any) {
            console.error('Design rules error:', error);
            throw new Error('Failed to create design system rules.');
        }
    }

    async getDesignContext(): Promise<FigmaDesignContext> {
        if (!this.isConnected) {
            throw new Error('Not connected to Figma MCP Server');
        }

        try {
            const [variables, codeConnect] = await Promise.all([
                this.getVariableDefinitions(),
                this.getCodeConnectMap()
            ]);

            return {
                selection: null,
                variables,
                components: codeConnect.components || [],
                codeConnect
            };
        } catch (error: any) {
            throw new Error(`Failed to get design context: ${error.message}`);
        }
    }

    async generateComponent(name: string, framework: string = 'react'): Promise<void> {
        if (!this.validateComponentName(name)) {
            throw new Error('Invalid component name. Use only letters, numbers, dash, and underscore.');
        }

        const code = await this.getCode({ framework: framework as any });
        const componentDir = this.validatePath(path.join('src', 'components', name));
        
        if (!fs.existsSync(componentDir)) {
            fs.mkdirSync(componentDir, { recursive: true });
        }

        const extension = framework === 'react' ? 'tsx' : framework === 'vue' ? 'vue' : 'ts';
        const componentPath = path.join(componentDir, `${name}.${extension}`);
        
        fs.writeFileSync(componentPath, code);
        
        const indexPath = path.join(componentDir, 'index.ts');
        fs.writeFileSync(indexPath, `export { default } from './${name}';\n`);
        
        console.log(`✅ Component generated at: ${componentPath}`);
    }

    async exportDesignTokens(outputPath: string): Promise<void> {
        const variables = await this.getVariableDefinitions();
        
        const tokens = {
            colors: {},
            spacing: {},
            typography: {},
            borderRadius: {},
            shadows: {}
        };

        variables.forEach((variable: any) => {
            const { name, type, value } = variable;
            const category = this.categorizeVariable(type);
            
            if (category && tokens[category as keyof typeof tokens]) {
                (tokens[category as keyof typeof tokens] as any)[name] = value;
            }
        });

        const safePath = this.validatePath(outputPath);
        const dir = path.dirname(safePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(safePath, JSON.stringify(tokens, null, 2));
        console.log(`✅ Design tokens exported to: ${safePath}`);
    }

    private categorizeVariable(type: string): string | null {
        const typeMap: { [key: string]: string } = {
            'COLOR': 'colors',
            'FLOAT': 'spacing',
            'STRING': 'typography',
            'BORDER_RADIUS': 'borderRadius',
            'EFFECT': 'shadows'
        };
        
        return typeMap[type] || null;
    }

    async syncWithFigma(): Promise<void> {
        console.log('🔄 Syncing with Figma...');
        
        try {
            const context = await this.getDesignContext();
            await this.exportDesignTokens(path.join(process.cwd(), 'src', 'design-tokens.json'));
            
            if (context.components.length > 0) {
                console.log(`📦 Found ${context.components.length} connected components`);
            }
            
            if (context.variables.length > 0) {
                console.log(`🎨 Found ${context.variables.length} design variables`);
            }
            
            console.log('✅ Sync complete');
        } catch (error: any) {
            console.error('❌ Sync failed:', error.message);
            throw error;
        }
    }

    disconnect(): void {
        this.isConnected = false;
        this.emit('disconnected');
    }
}

export default FigmaMCPClient;