/**
 * Upload Handler for documents and design files
 * Supports PDF, Word, Figma, and other file formats
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { execFileSync } from 'child_process';

interface UploadConfig {
  figma?: {
    componentPrefix?: string;
    framework?: 'react' | 'vue' | 'angular';
    typescript?: boolean;
    cssFramework?: 'tailwind' | 'css-modules' | 'styled-components';
    exportFormat?: 'components' | 'full-app' | 'styles' | 'prototype';
  };
  documents?: {
    extractImages?: boolean;
    preserveFormatting?: boolean;
    generateOutline?: boolean;
  };
}

interface ProcessedFile {
  type: 'document' | 'design';
  format: string;
  content: any;
  metadata: {
    pages?: number;
    components?: string[];
    styles?: any;
    assets?: string[];
  };
}

export class UploadHandler {
  private config: UploadConfig;
  private supportedFormats = {
    documents: ['.pdf', '.doc', '.docx', '.txt', '.md', '.rtf'],
    designs: ['.fig', '.figma', '.sketch', '.xd']
  };

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * Load configuration
   */
  private loadConfig(): UploadConfig {
    const configPath = path.join(process.cwd(), '.agentwise-upload.json');
    if (fs.existsSync(configPath)) {
      return fs.readJsonSync(configPath);
    }
    
    // Default configuration
    return {
      figma: {
        componentPrefix: 'AG',
        framework: 'react',
        typescript: true,
        cssFramework: 'tailwind',
        exportFormat: 'components'
      },
      documents: {
        extractImages: true,
        preserveFormatting: false,
        generateOutline: true
      }
    };
  }

  /**
   * Handle file upload
   */
  async handleUpload(
    filePath: string, 
    conversionType?: string
  ): Promise<ProcessedFile> {
    console.log(`📤 Processing upload: ${filePath}`);
    
    // Security: Validate file path to prevent directory traversal
    const resolvedPath = path.resolve(filePath);
    const workingDir = process.cwd();
    
    if (!resolvedPath.startsWith(workingDir)) {
      throw new Error('Security: File must be within project directory');
    }
    
    // Validate file exists
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }
    
    // Check file size (50MB limit)
    const stats = await fs.stat(resolvedPath);
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (stats.size > maxSize) {
      throw new Error(`File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max: 50MB)`);
    }
    
    const ext = path.extname(resolvedPath).toLowerCase();
    
    // Determine file type
    if (this.supportedFormats.documents.includes(ext)) {
      return await this.processDocument(filePath, conversionType);
    } else if (this.supportedFormats.designs.includes(ext)) {
      return await this.processDesignFile(filePath, conversionType);
    } else {
      throw new Error(`Unsupported file format: ${ext}`);
    }
  }

  /**
   * Process document files (PDF, Word, etc.)
   */
  private async processDocument(
    filePath: string,
    conversionType?: string
  ): Promise<ProcessedFile> {
    console.log('📄 Processing document...');
    
    const ext = path.extname(filePath);
    let content = '';
    let metadata: any = {};
    
    switch (ext) {
      case '.pdf':
        content = await this.extractPDFContent(filePath);
        metadata.pages = await this.getPDFPageCount(filePath);
        break;
        
      case '.doc':
      case '.docx':
        content = await this.extractWordContent(filePath);
        break;
        
      case '.txt':
      case '.md':
        content = await fs.readFile(filePath, 'utf-8');
        break;
        
      case '.rtf':
        content = await this.extractRTFContent(filePath);
        break;
    }
    
    // Apply conversion based on type
    const processed = await this.applyDocumentConversion(
      content, 
      conversionType || 'context'
    );
    
    return {
      type: 'document',
      format: ext,
      content: processed,
      metadata
    };
  }

  /**
   * Process design files (Figma, Sketch, etc.)
   */
  private async processDesignFile(
    filePath: string,
    conversionType?: string
  ): Promise<ProcessedFile> {
    console.log('🎨 Processing design file...');
    
    const ext = path.extname(filePath);
    
    if (ext === '.fig' || ext === '.figma') {
      return await this.processFigmaFile(filePath, conversionType);
    }
    
    throw new Error(`Design format ${ext} not yet supported`);
  }

  /**
   * Process Figma files
   */
  private async processFigmaFile(
    filePath: string,
    conversionType?: string
  ): Promise<ProcessedFile> {
    console.log('🎨 Extracting Figma components...');
    
    const exportType = conversionType || this.config.figma?.exportFormat || 'components';
    
    // Parse Figma file structure
    const figmaData = await this.parseFigmaFile(filePath);
    
    // Extract components
    const components = await this.extractFigmaComponents(figmaData);
    
    // Extract styles
    const styles = await this.extractFigmaStyles(figmaData);
    
    // Extract assets
    const assets = await this.extractFigmaAssets(figmaData);
    
    // Generate code based on export type
    const generatedCode = await this.generateFromFigma(
      components,
      styles,
      assets,
      exportType
    );
    
    return {
      type: 'design',
      format: '.figma',
      content: generatedCode,
      metadata: {
        components: components.map(c => c.name),
        styles,
        assets: assets.map(a => a.name)
      }
    };
  }

  /**
   * Parse Figma file
   */
  private async parseFigmaFile(filePath: string): Promise<any> {
    // Figma files are actually JSON when unzipped
    // This is a simplified version - real implementation would use Figma API
    
    return {
      document: {
        children: [],
        name: 'Figma Design'
      },
      components: {},
      styles: {},
      assets: []
    };
  }

  /**
   * Extract Figma components
   */
  private async extractFigmaComponents(figmaData: any): Promise<any[]> {
    const components: any[] = [];
    
    // Extract component definitions
    // This would parse the Figma node tree
    
    return components;
  }

  /**
   * Extract Figma styles
   */
  private async extractFigmaStyles(figmaData: any): Promise<any> {
    return {
      colors: {},
      typography: {},
      effects: {},
      grids: {}
    };
  }

  /**
   * Extract Figma assets
   */
  private async extractFigmaAssets(figmaData: any): Promise<any[]> {
    return [];
  }

  /**
   * Generate code from Figma data
   */
  private async generateFromFigma(
    components: any[],
    styles: any,
    assets: any[],
    exportType: string
  ): Promise<any> {
    const framework = this.config.figma?.framework || 'react';
    const typescript = this.config.figma?.typescript !== false;
    const cssFramework = this.config.figma?.cssFramework || 'tailwind';
    
    const output: any = {
      components: {},
      styles: {},
      assets: {},
      pages: {}
    };
    
    // Generate components
    for (const component of components) {
      output.components[component.name] = this.generateComponent(
        component,
        framework,
        typescript,
        cssFramework
      );
    }
    
    // Generate styles
    output.styles = this.generateStyles(styles, cssFramework);
    
    // Process assets
    output.assets = assets;
    
    return output;
  }

  /**
   * Generate component code
   */
  private generateComponent(
    component: any,
    framework: string,
    typescript: boolean,
    cssFramework: string
  ): string {
    const ext = typescript ? 'tsx' : 'jsx';
    
    if (framework === 'react') {
      return this.generateReactComponent(component, typescript, cssFramework);
    } else if (framework === 'vue') {
      return this.generateVueComponent(component, typescript, cssFramework);
    }
    
    return '';
  }

  /**
   * Generate React component
   */
  private generateReactComponent(
    component: any,
    typescript: boolean,
    cssFramework: string
  ): string {
    const componentName = component.name;
    
    return `${typescript ? "import React from 'react';\n\n" : ''}
${typescript ? `interface ${componentName}Props {\n  // Add props here\n}\n\n` : ''}
export ${typescript ? 'const' : 'function'} ${componentName}${typescript ? ': React.FC<' + componentName + 'Props>' : ''}${typescript ? ' = (props)' : '(props)'} ${typescript ? '=>' : ''} {
  return (
    <div className="${cssFramework === 'tailwind' ? 'component' : componentName}">
      {/* Component content */}
    </div>
  );
}${typescript ? '' : ';'}

export default ${componentName};`;
  }

  /**
   * Generate Vue component
   */
  private generateVueComponent(
    component: any,
    typescript: boolean,
    cssFramework: string
  ): string {
    return `<template>
  <div class="${cssFramework === 'tailwind' ? 'component' : component.name}">
    <!-- Component content -->
  </div>
</template>

<script${typescript ? ' lang="ts"' : ''}>
${typescript ? "import { defineComponent } from 'vue';\n\n" : ''}
export default ${typescript ? 'defineComponent(' : ''}{
  name: '${component.name}',
  props: {
    // Add props here
  }
}${typescript ? ')' : ''};
</script>

<style${cssFramework === 'css-modules' ? ' module' : ''}>
/* Component styles */
</style>`;
  }

  /**
   * Generate styles
   */
  private generateStyles(styles: any, cssFramework: string): any {
    if (cssFramework === 'tailwind') {
      return this.generateTailwindConfig(styles);
    }
    
    return {
      colors: styles.colors,
      typography: styles.typography,
      spacing: styles.spacing
    };
  }

  /**
   * Generate Tailwind config
   */
  private generateTailwindConfig(styles: any): string {
    return `module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(styles.colors || {}, null, 2)},
      fontFamily: ${JSON.stringify(styles.typography || {}, null, 2)}
    }
  }
}`;
  }

  /**
   * Extract PDF content
   */
  private async extractPDFContent(filePath: string): Promise<string> {
    try {
      // Use pdftotext if available
      const result = execFileSync('pdftotext', [filePath, '-'], {
        encoding: 'utf-8'
      });
      return result;
    } catch {
      // Fallback to basic text extraction
      console.warn('pdftotext not available, using fallback method');
      return 'PDF content extraction requires pdftotext tool';
    }
  }

  /**
   * Get PDF page count
   */
  private async getPDFPageCount(filePath: string): Promise<number> {
    try {
      const result = execFileSync('pdfinfo', [filePath], {
        encoding: 'utf-8'
      });
      const match = result.match(/Pages:\s+(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Extract Word content
   */
  private async extractWordContent(filePath: string): Promise<string> {
    // This would use a library like mammoth or docx
    return 'Word document content extraction requires additional libraries';
  }

  /**
   * Extract RTF content
   */
  private async extractRTFContent(filePath: string): Promise<string> {
    // This would use an RTF parser
    return 'RTF content extraction requires additional libraries';
  }

  /**
   * Apply document conversion
   */
  private async applyDocumentConversion(
    content: string,
    conversionType: string
  ): Promise<any> {
    switch (conversionType) {
      case 'spec':
        return this.convertToSpecification(content);
      case 'requirements':
        return this.extractRequirements(content);
      case 'documentation':
        return this.convertToDocumentation(content);
      case 'context':
      default:
        return { text: content, type: 'context' };
    }
  }

  /**
   * Convert to specification
   */
  private convertToSpecification(content: string): any {
    return {
      type: 'specification',
      sections: this.parseSpecificationSections(content),
      requirements: this.extractRequirements(content)
    };
  }

  /**
   * Parse specification sections
   */
  private parseSpecificationSections(content: string): any[] {
    const sections = [];
    const lines = content.split('\n');
    
    let currentSection = null;
    let sectionContent = [];
    
    for (const line of lines) {
      if (line.match(/^#+\s+/)) {
        if (currentSection) {
          sections.push({
            title: currentSection,
            content: sectionContent.join('\n')
          });
        }
        currentSection = line.replace(/^#+\s+/, '');
        sectionContent = [];
      } else {
        sectionContent.push(line);
      }
    }
    
    if (currentSection) {
      sections.push({
        title: currentSection,
        content: sectionContent.join('\n')
      });
    }
    
    return sections;
  }

  /**
   * Extract requirements
   */
  private extractRequirements(content: string): string[] {
    const requirements = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.match(/^[\-\*]\s+/) || line.match(/^\d+\.\s+/)) {
        requirements.push(line.replace(/^[\-\*\d\.]\s+/, '').trim());
      }
    }
    
    return requirements;
  }

  /**
   * Convert to documentation
   */
  private convertToDocumentation(content: string): any {
    return {
      type: 'documentation',
      content: content,
      outline: this.generateOutline(content)
    };
  }

  /**
   * Generate outline
   */
  private generateOutline(content: string): any[] {
    const outline = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(#+)\s+(.+)/);
      if (match) {
        outline.push({
          level: match[1].length,
          title: match[2]
        });
      }
    }
    
    return outline;
  }
}