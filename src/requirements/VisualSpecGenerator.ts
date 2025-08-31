import { Requirements, Feature, TechStack, Timeline, TeamConfig, DatabaseConfig } from './types';

export interface VisualSpecOptions {
  includeInteractivity?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  includeDatabase?: boolean;
  includeTimeline?: boolean;
  includeTeam?: boolean;
  includeTechStack?: boolean;
  customCSS?: string;
  title?: string;
  generateDownload?: boolean;
}

export interface VisualSpecResult {
  html: string;
  css: string;
  javascript: string;
  fullHtml: string; // Complete self-contained HTML
  metadata: {
    generatedAt: Date;
    requirementsId: string;
    featuresCount: number;
    complexity: string;
  };
}

export class VisualSpecGenerator {
  private readonly VERSION = '1.0.0';

  async generateVisualSpec(
    requirements: Requirements,
    options: VisualSpecOptions = {}
  ): Promise<VisualSpecResult> {
    console.log('🎨 Generating visual specification...');

    const opts = this.processOptions(options);
    
    const css = this.generateCSS(opts.theme || 'light', opts.customCSS);
    const javascript = this.generateJavaScript(opts.includeInteractivity || false);
    const html = await this.generateHTML(requirements, opts);
    
    const fullHtml = this.combineIntoSelfContained(html, css, javascript, requirements.title);

    console.log('✅ Visual specification generated successfully');

    return {
      html,
      css,
      javascript,
      fullHtml,
      metadata: {
        generatedAt: new Date(),
        requirementsId: requirements.id,
        featuresCount: requirements.features.length,
        complexity: requirements.complexity
      }
    };
  }

  async exportToFile(
    visualSpec: VisualSpecResult,
    filename: string = 'requirements-spec.html'
  ): Promise<string> {
    const fs = require('fs').promises;
    const path = require('path');
    
    const fullPath = path.resolve(filename);
    await fs.writeFile(fullPath, visualSpec.fullHtml, 'utf-8');
    
    console.log(`📄 Visual specification exported to: ${fullPath}`);
    return fullPath;
  }

  private processOptions(options: VisualSpecOptions): VisualSpecOptions {
    return {
      includeInteractivity: options.includeInteractivity ?? true,
      theme: options.theme ?? 'light',
      includeDatabase: options.includeDatabase ?? true,
      includeTimeline: options.includeTimeline ?? true,
      includeTeam: options.includeTeam ?? true,
      includeTechStack: options.includeTechStack ?? true,
      generateDownload: options.generateDownload ?? false,
      ...options
    };
  }

  private generateCSS(theme: string, customCSS?: string): string {
    const baseCSS = `
/* Visual Specification Styles */
:root {
  --primary-color: ${theme === 'dark' ? '#3b82f6' : '#2563eb'};
  --secondary-color: ${theme === 'dark' ? '#6366f1' : '#7c3aed'};
  --accent-color: ${theme === 'dark' ? '#10b981' : '#059669'};
  --background-color: ${theme === 'dark' ? '#111827' : '#ffffff'};
  --surface-color: ${theme === 'dark' ? '#1f2937' : '#f8fafc'};
  --border-color: ${theme === 'dark' ? '#374151' : '#e2e8f0'};
  --text-primary: ${theme === 'dark' ? '#f9fafb' : '#1e293b'};
  --text-secondary: ${theme === 'dark' ? '#d1d5db' : '#64748b'};
  --text-muted: ${theme === 'dark' ? '#9ca3af' : '#94a3b8'};
  --shadow-sm: ${theme === 'dark' ? '0 1px 2px 0 rgba(0, 0, 0, 0.5)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'};
  --shadow-md: ${theme === 'dark' ? '0 4px 6px -1px rgba(0, 0, 0, 0.5)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'};
  --shadow-lg: ${theme === 'dark' ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'};
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: var(--background-color);
  color: var(--text-primary);
  line-height: 1.6;
  transition: all 0.3s ease;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header Styles */
.spec-header {
  text-align: center;
  margin-bottom: 3rem;
  padding: 2rem 0;
  border-bottom: 2px solid var(--border-color);
}

.spec-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--primary-color);
}

.spec-subtitle {
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.spec-meta {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
  margin-top: 1.5rem;
}

.meta-item {
  background: var(--surface-color);
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Navigation */
.spec-nav {
  position: sticky;
  top: 0;
  background: var(--background-color);
  border-bottom: 1px solid var(--border-color);
  padding: 1rem 0;
  margin-bottom: 2rem;
  z-index: 100;
}

.nav-list {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
  list-style: none;
}

.nav-item {
  padding: 0.5rem 1rem;
  background: var(--surface-color);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  color: var(--text-primary);
  font-weight: 500;
}

.nav-item:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.nav-item.active {
  background: var(--primary-color);
  color: white;
}

/* Section Styles */
.section {
  margin-bottom: 3rem;
  padding: 2rem;
  background: var(--surface-color);
  border-radius: 1rem;
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-icon {
  font-size: 1.5rem;
}

/* Feature Cards */
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.feature-card {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.feature-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
  border-color: var(--primary-color);
}

.feature-card.expanded {
  grid-column: 1 / -1;
  max-width: none;
}

.feature-priority {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom-left-radius: 0.5rem;
}

.priority-critical { background: #dc2626; color: white; }
.priority-high { background: #ea580c; color: white; }
.priority-medium { background: #ca8a04; color: white; }
.priority-low { background: #65a30d; color: white; }
.priority-optional { background: #6b7280; color: white; }

.feature-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.feature-category {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: capitalize;
}

.feature-description {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.feature-details {
  display: none;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.feature-card.expanded .feature-details {
  display: grid;
}

.detail-section {
  background: var(--surface-color);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

.detail-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-list {
  list-style: none;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.detail-list li {
  padding: 0.25rem 0;
  border-bottom: 1px solid var(--border-color);
}

.detail-list li:last-child {
  border-bottom: none;
}

.feature-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--surface-color);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary-color);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Tech Stack */
.tech-stack {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.tech-category {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.tech-category-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tech-list {
  list-style: none;
}

.tech-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background: var(--surface-color);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  transition: all 0.2s ease;
}

.tech-item:hover {
  background: var(--primary-color);
  color: white;
}

.tech-name {
  font-weight: 500;
}

.tech-version {
  font-size: 0.875rem;
  color: var(--text-muted);
}

/* Timeline */
.timeline {
  position: relative;
  margin: 2rem 0;
}

.timeline-line {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--border-color);
  transform: translateX(-50%);
}

.timeline-item {
  display: flex;
  margin-bottom: 2rem;
  position: relative;
}

.timeline-item:nth-child(odd) {
  flex-direction: row-reverse;
}

.timeline-content {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  width: calc(50% - 1rem);
  position: relative;
  box-shadow: var(--shadow-sm);
}

.timeline-content::before {
  content: '';
  position: absolute;
  top: 1.5rem;
  width: 0;
  height: 0;
  border-style: solid;
}

.timeline-item:nth-child(odd) .timeline-content::before {
  left: -10px;
  border-width: 10px 10px 10px 0;
  border-color: transparent var(--border-color) transparent transparent;
}

.timeline-item:nth-child(even) .timeline-content::before {
  right: -10px;
  border-width: 10px 0 10px 10px;
  border-color: transparent transparent transparent var(--border-color);
}

.timeline-marker {
  position: absolute;
  left: 50%;
  top: 1.5rem;
  width: 1rem;
  height: 1rem;
  background: var(--primary-color);
  border: 3px solid var(--background-color);
  border-radius: 50%;
  transform: translateX(-50%);
  z-index: 1;
}

.phase-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.phase-duration {
  color: var(--primary-color);
  font-weight: 500;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.phase-description {
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

.phase-features {
  list-style: none;
  margin-top: 1rem;
}

.phase-features li {
  padding: 0.25rem 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Team Structure */
.team-structure {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.team-role {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  text-align: center;
}

.role-icon {
  width: 4rem;
  height: 4rem;
  background: var(--primary-color);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  font-size: 1.5rem;
  color: white;
}

.role-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.role-count {
  color: var(--primary-color);
  font-weight: 500;
  margin-bottom: 1rem;
}

.role-skills {
  list-style: none;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.role-skills li {
  padding: 0.25rem 0;
  border-bottom: 1px solid var(--border-color);
}

.role-skills li:last-child {
  border-bottom: none;
}

/* Database Schema */
.database-schema {
  background: var(--background-color);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.db-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.db-detail {
  background: var(--surface-color);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
  text-align: center;
}

.db-detail-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  margin-bottom: 0.5rem;
}

.db-detail-value {
  font-weight: 600;
  color: var(--text-primary);
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .spec-title {
    font-size: 2rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .feature-details {
    grid-template-columns: 1fr;
  }
  
  .tech-stack {
    grid-template-columns: 1fr;
  }
  
  .team-structure {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .timeline-content {
    width: calc(100% - 2rem);
  }
  
  .timeline-item {
    flex-direction: column !important;
  }
  
  .timeline-line {
    left: 1rem;
  }
  
  .timeline-marker {
    left: 1rem;
  }
  
  .nav-list {
    flex-direction: column;
    align-items: center;
  }
}

/* Print Styles */
@media print {
  body {
    background: white !important;
    color: black !important;
  }
  
  .spec-nav {
    display: none;
  }
  
  .section {
    break-inside: avoid;
    box-shadow: none;
    border: 1px solid #ccc;
  }
  
  .feature-card {
    break-inside: avoid;
  }
}

/* Custom animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.section {
  animation: fadeIn 0.6s ease-out;
}

.feature-card {
  animation: fadeIn 0.4s ease-out;
}

/* Theme Toggle Button */
.theme-toggle {
  position: fixed;
  top: 1rem;
  right: 1rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: var(--shadow-lg);
  transition: all 0.3s ease;
  z-index: 1000;
}

.theme-toggle:hover {
  transform: scale(1.1);
  background: var(--secondary-color);
}
`;

    return baseCSS + (customCSS ? `\n\n/* Custom CSS */\n${customCSS}` : '');
  }

  private generateJavaScript(includeInteractivity: boolean): string {
    if (!includeInteractivity) return '';

    return `
// Visual Specification Interactive Features
(function() {
  'use strict';

  // Initialize when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    initializeInteractivity();
    initializeNavigation();
    initializeThemeToggle();
    initializeFeatureCards();
    initializeScrollSpy();
  });

  function initializeInteractivity() {
    console.log('🎯 Initializing visual specification interactivity...');
  }

  function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      item.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Remove active class from all items
        navItems.forEach(navItem => navItem.classList.remove('active'));
        
        // Add active class to clicked item
        this.classList.add('active');
        
        // Smooth scroll to section
        const targetId = this.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
          targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  function initializeThemeToggle() {
    const toggleButton = document.querySelector('.theme-toggle');
    if (!toggleButton) return;

    const currentTheme = localStorage.getItem('spec-theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(toggleButton, currentTheme);

    toggleButton.addEventListener('click', function() {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('spec-theme', newTheme);
      updateThemeIcon(this, newTheme);
      
      // Update CSS variables
      updateThemeColors(newTheme);
    });
  }

  function updateThemeIcon(button, theme) {
    button.innerHTML = theme === 'light' ? '🌙' : '☀️';
    button.setAttribute('aria-label', 
      theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'
    );
  }

  function updateThemeColors(theme) {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.style.setProperty('--primary-color', '#3b82f6');
      root.style.setProperty('--background-color', '#111827');
      root.style.setProperty('--surface-color', '#1f2937');
      root.style.setProperty('--text-primary', '#f9fafb');
      root.style.setProperty('--text-secondary', '#d1d5db');
      root.style.setProperty('--border-color', '#374151');
    } else {
      root.style.setProperty('--primary-color', '#2563eb');
      root.style.setProperty('--background-color', '#ffffff');
      root.style.setProperty('--surface-color', '#f8fafc');
      root.style.setProperty('--text-primary', '#1e293b');
      root.style.setProperty('--text-secondary', '#64748b');
      root.style.setProperty('--border-color', '#e2e8f0');
    }
  }

  function initializeFeatureCards() {
    const featureCards = document.querySelectorAll('.feature-card');
    
    featureCards.forEach(card => {
      card.addEventListener('click', function() {
        const wasExpanded = this.classList.contains('expanded');
        
        // Collapse all cards
        featureCards.forEach(c => c.classList.remove('expanded'));
        
        // Expand clicked card if it wasn't already expanded
        if (!wasExpanded) {
          this.classList.add('expanded');
          
          // Smooth scroll to show full card
          setTimeout(() => {
            this.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            });
          }, 300);
        }
      });
    });

    // Close expanded card when clicking outside
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.feature-card')) {
        featureCards.forEach(card => card.classList.remove('expanded'));
      }
    });
  }

  function initializeScrollSpy() {
    const sections = document.querySelectorAll('.section');
    const navItems = document.querySelectorAll('.nav-item');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          
          // Update navigation
          navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('href') === '#' + sectionId) {
              item.classList.add('active');
            }
          });
        }
      });
    }, {
      threshold: 0.3,
      rootMargin: '-10% 0px -10% 0px'
    });

    sections.forEach(section => {
      observer.observe(section);
    });
  }

  // Utility functions
  function formatDuration(days) {
    if (days < 7) return days + ' days';
    if (days < 30) return Math.round(days / 7) + ' weeks';
    return Math.round(days / 30) + ' months';
  }

  function animateCounters() {
    const counters = document.querySelectorAll('.stat-value[data-count]');
    
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-count'));
      const increment = target / 100;
      let current = 0;
      
      const updateCounter = () => {
        if (current < target) {
          current += increment;
          counter.textContent = Math.ceil(current);
          setTimeout(updateCounter, 20);
        } else {
          counter.textContent = target;
        }
      };
      
      updateCounter();
    });
  }

  // Export utilities for external use
  window.VisualSpecUtils = {
    formatDuration,
    animateCounters,
    updateThemeColors
  };

})();
`;
  }

  private async generateHTML(requirements: Requirements, options: VisualSpecOptions): Promise<string> {
    const title = options.title || requirements.title || 'Project Requirements Specification';
    
    let html = `
<div class="container">
  <header class="spec-header">
    <h1 class="spec-title">${this.escapeHtml(title)}</h1>
    <p class="spec-subtitle">${this.escapeHtml(requirements.description)}</p>
    <div class="spec-meta">
      <div class="meta-item">
        <strong>Project Type:</strong> ${this.formatProjectType(requirements.projectType)}
      </div>
      <div class="meta-item">
        <strong>Complexity:</strong> ${this.formatComplexity(requirements.complexity)}
      </div>
      <div class="meta-item">
        <strong>Architecture:</strong> ${this.formatArchitecture(requirements.architecture)}
      </div>
      <div class="meta-item">
        <strong>Timeline:</strong> ${requirements.timeline.totalDuration} days
      </div>
      <div class="meta-item">
        <strong>Team Size:</strong> ${requirements.team.size} members
      </div>
    </div>
  </header>

  <nav class="spec-nav">
    <ul class="nav-list">
      <li><a href="#overview" class="nav-item active">Overview</a></li>
      <li><a href="#features" class="nav-item">Features</a></li>
      ${options.includeTechStack ? '<li><a href="#techstack" class="nav-item">Tech Stack</a></li>' : ''}
      ${options.includeTimeline ? '<li><a href="#timeline" class="nav-item">Timeline</a></li>' : ''}
      ${options.includeTeam ? '<li><a href="#team" class="nav-item">Team</a></li>' : ''}
      ${options.includeDatabase && requirements.database ? '<li><a href="#database" class="nav-item">Database</a></li>' : ''}
    </ul>
  </nav>
`;

    // Overview Section
    html += this.generateOverviewSection(requirements);

    // Features Section
    html += this.generateFeaturesSection(requirements.features);

    // Tech Stack Section
    if (options.includeTechStack) {
      html += this.generateTechStackSection(requirements.techStack);
    }

    // Timeline Section
    if (options.includeTimeline) {
      html += this.generateTimelineSection(requirements.timeline);
    }

    // Team Section
    if (options.includeTeam) {
      html += this.generateTeamSection(requirements.team);
    }

    // Database Section
    if (options.includeDatabase && requirements.database) {
      html += this.generateDatabaseSection(requirements.database);
    }

    html += `
</div>

<!-- Theme Toggle Button -->
<button class="theme-toggle" aria-label="Toggle theme">🌙</button>
`;

    return html;
  }

  private generateOverviewSection(requirements: Requirements): string {
    const featuresByCategory = this.groupFeaturesByCategory(requirements.features);
    const totalHours = requirements.features.reduce((sum, f) => sum + f.estimatedHours, 0);

    return `
<section id="overview" class="section">
  <h2 class="section-title">
    <span class="section-icon">📋</span>
    Project Overview
  </h2>
  
  <div class="overview-stats" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
    <div class="stat-card" style="background: var(--background-color); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border-color); text-align: center;">
      <div class="stat-value" style="font-size: 2rem; font-weight: 700; color: var(--primary-color);" data-count="${requirements.features.length}">${requirements.features.length}</div>
      <div class="stat-label">Features</div>
    </div>
    <div class="stat-card" style="background: var(--background-color); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border-color); text-align: center;">
      <div class="stat-value" style="font-size: 2rem; font-weight: 700; color: var(--primary-color);" data-count="${totalHours}">${totalHours}</div>
      <div class="stat-label">Est. Hours</div>
    </div>
    <div class="stat-card" style="background: var(--background-color); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border-color); text-align: center;">
      <div class="stat-value" style="font-size: 2rem; font-weight: 700; color: var(--primary-color);" data-count="${Object.keys(featuresByCategory).length}">${Object.keys(featuresByCategory).length}</div>
      <div class="stat-label">Categories</div>
    </div>
    <div class="stat-card" style="background: var(--background-color); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border-color); text-align: center;">
      <div class="stat-value" style="font-size: 2rem; font-weight: 700; color: var(--primary-color);" data-count="${requirements.constraints.length}">${requirements.constraints.length}</div>
      <div class="stat-label">Constraints</div>
    </div>
  </div>

  <div class="overview-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
    <div class="detail-panel" style="background: var(--background-color); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border-color);">
      <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Feature Categories</h3>
      <div class="category-list">
        ${Object.entries(featuresByCategory).map(([category, features]) => `
          <div class="category-item" style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--border-color);">
            <span style="text-transform: capitalize;">${category.replace('-', ' ')}</span>
            <span style="background: var(--primary-color); color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">${features.length}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="detail-panel" style="background: var(--background-color); padding: 1.5rem; border-radius: 0.75rem; border: 1px solid var(--border-color);">
      <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Priority Distribution</h3>
      <div class="priority-list">
        ${this.getPriorityDistribution(requirements.features).map(({ priority, count, percentage }) => `
          <div class="priority-item" style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span style="text-transform: capitalize;">${priority}</span>
              <span>${count} (${percentage}%)</span>
            </div>
            <div style="background: var(--border-color); height: 0.5rem; border-radius: 0.25rem; overflow: hidden;">
              <div style="background: var(--primary-color); height: 100%; width: ${percentage}%; border-radius: 0.25rem;"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</section>
`;
  }

  private generateFeaturesSection(features: Feature[]): string {
    return `
<section id="features" class="section">
  <h2 class="section-title">
    <span class="section-icon">⚡</span>
    Features & Requirements
  </h2>
  
  <div class="features-grid">
    ${features.map(feature => `
      <div class="feature-card" data-priority="${feature.priority}" data-category="${feature.category}">
        <div class="feature-priority priority-${feature.priority}">${feature.priority}</div>
        
        <div class="feature-header">
          <div>
            <h3 class="feature-title">${this.escapeHtml(feature.name)}</h3>
            <span class="feature-category">${this.formatCategory(feature.category)}</span>
          </div>
        </div>
        
        <p class="feature-description">${this.escapeHtml(feature.description)}</p>
        
        <div class="feature-stats">
          <div class="stat-item">
            <div class="stat-value">${feature.estimatedHours}h</div>
            <div class="stat-label">Estimate</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${this.formatComplexity(feature.complexity)}</div>
            <div class="stat-label">Complexity</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${feature.dependencies.length}</div>
            <div class="stat-label">Dependencies</div>
          </div>
        </div>
        
        <div class="feature-details">
          <div class="detail-section">
            <h4 class="detail-title">Requirements</h4>
            <ul class="detail-list">
              ${feature.requirements.map(req => `<li>${this.escapeHtml(req)}</li>`).join('')}
            </ul>
          </div>
          
          <div class="detail-section">
            <h4 class="detail-title">Acceptance Criteria</h4>
            <ul class="detail-list">
              ${feature.acceptance_criteria.map(criteria => `<li>${this.escapeHtml(criteria)}</li>`).join('')}
            </ul>
          </div>
          
          ${feature.dependencies.length > 0 ? `
          <div class="detail-section">
            <h4 class="detail-title">Dependencies</h4>
            <ul class="detail-list">
              ${feature.dependencies.map(dep => `<li>${this.escapeHtml(dep)}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${feature.tags.length > 0 ? `
          <div class="detail-section">
            <h4 class="detail-title">Tags</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              ${feature.tags.map(tag => `
                <span style="background: var(--secondary-color); color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">
                  ${this.escapeHtml(tag)}
                </span>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  </div>
</section>
`;
  }

  private generateTechStackSection(techStack: TechStack): string {
    return `
<section id="techstack" class="section">
  <h2 class="section-title">
    <span class="section-icon">🛠️</span>
    Technology Stack
  </h2>
  
  <div class="tech-stack">
    ${techStack.frontend ? `
    <div class="tech-category">
      <h3 class="tech-category-title">
        <span>🎨</span>
        Frontend
      </h3>
      <ul class="tech-list">
        <li class="tech-item">
          <span class="tech-name">Framework</span>
          <span class="tech-version">${techStack.frontend.framework}</span>
        </li>
        <li class="tech-item">
          <span class="tech-name">Language</span>
          <span class="tech-version">${techStack.frontend.language}</span>
        </li>
        ${techStack.frontend.cssFramework ? `
        <li class="tech-item">
          <span class="tech-name">CSS Framework</span>
          <span class="tech-version">${techStack.frontend.cssFramework}</span>
        </li>
        ` : ''}
        <li class="tech-item">
          <span class="tech-name">Build Tool</span>
          <span class="tech-version">${techStack.frontend.buildTool}</span>
        </li>
        <li class="tech-item">
          <span class="tech-name">Package Manager</span>
          <span class="tech-version">${techStack.frontend.packageManager}</span>
        </li>
        ${techStack.frontend.stateManagement ? techStack.frontend.stateManagement.map(sm => `
        <li class="tech-item">
          <span class="tech-name">State Management</span>
          <span class="tech-version">${sm}</span>
        </li>
        `).join('') : ''}
      </ul>
    </div>
    ` : ''}

    ${techStack.backend ? `
    <div class="tech-category">
      <h3 class="tech-category-title">
        <span>⚙️</span>
        Backend
      </h3>
      <ul class="tech-list">
        <li class="tech-item">
          <span class="tech-name">Runtime</span>
          <span class="tech-version">${techStack.backend.runtime}</span>
        </li>
        <li class="tech-item">
          <span class="tech-name">Framework</span>
          <span class="tech-version">${techStack.backend.framework}</span>
        </li>
        <li class="tech-item">
          <span class="tech-name">Language</span>
          <span class="tech-version">${techStack.backend.language}</span>
        </li>
        <li class="tech-item">
          <span class="tech-name">API Type</span>
          <span class="tech-version">${techStack.backend.apiType}</span>
        </li>
        ${techStack.backend.authentication.map(auth => `
        <li class="tech-item">
          <span class="tech-name">Authentication</span>
          <span class="tech-version">${auth}</span>
        </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${techStack.database ? `
    <div class="tech-category">
      <h3 class="tech-category-title">
        <span>🗄️</span>
        Database
      </h3>
      <ul class="tech-list">
        <li class="tech-item">
          <span class="tech-name">Primary DB</span>
          <span class="tech-version">${techStack.database.primary.type}</span>
        </li>
        ${techStack.database.primary.orm ? `
        <li class="tech-item">
          <span class="tech-name">ORM</span>
          <span class="tech-version">${techStack.database.primary.orm}</span>
        </li>
        ` : ''}
        ${techStack.database.caching ? `
        <li class="tech-item">
          <span class="tech-name">Caching</span>
          <span class="tech-version">${techStack.database.caching.provider}</span>
        </li>
        ` : ''}
      </ul>
    </div>
    ` : ''}

    ${techStack.testing ? `
    <div class="tech-category">
      <h3 class="tech-category-title">
        <span>🧪</span>
        Testing
      </h3>
      <ul class="tech-list">
        ${techStack.testing.unit.map(tool => `
        <li class="tech-item">
          <span class="tech-name">Unit Testing</span>
          <span class="tech-version">${tool}</span>
        </li>
        `).join('')}
        ${techStack.testing.integration.map(tool => `
        <li class="tech-item">
          <span class="tech-name">Integration</span>
          <span class="tech-version">${tool}</span>
        </li>
        `).join('')}
        ${techStack.testing.e2e.map(tool => `
        <li class="tech-item">
          <span class="tech-name">E2E Testing</span>
          <span class="tech-version">${tool}</span>
        </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    ${techStack.deployment ? `
    <div class="tech-category">
      <h3 class="tech-category-title">
        <span>🚀</span>
        Deployment
      </h3>
      <ul class="tech-list">
        ${techStack.deployment.platform.map(platform => `
        <li class="tech-item">
          <span class="tech-name">Platform</span>
          <span class="tech-version">${platform}</span>
        </li>
        `).join('')}
        ${techStack.deployment.containerization ? `
        <li class="tech-item">
          <span class="tech-name">Containerization</span>
          <span class="tech-version">${techStack.deployment.containerization.technology}</span>
        </li>
        ` : ''}
        ${techStack.deployment.cicd.provider.map(provider => `
        <li class="tech-item">
          <span class="tech-name">CI/CD</span>
          <span class="tech-version">${provider}</span>
        </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}
  </div>
</section>
`;
  }

  private generateTimelineSection(timeline: Timeline): string {
    return `
<section id="timeline" class="section">
  <h2 class="section-title">
    <span class="section-icon">📅</span>
    Project Timeline
  </h2>
  
  <div style="margin-bottom: 2rem; text-align: center;">
    <div style="display: inline-flex; gap: 2rem; background: var(--background-color); padding: 1rem 2rem; border-radius: 0.75rem; border: 1px solid var(--border-color);">
      <div>
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${timeline.totalDuration}</div>
        <div style="font-size: 0.875rem; color: var(--text-muted);">Total Days</div>
      </div>
      <div>
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${timeline.phases.length}</div>
        <div style="font-size: 0.875rem; color: var(--text-muted);">Phases</div>
      </div>
      <div>
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${timeline.bufferTime}</div>
        <div style="font-size: 0.875rem; color: var(--text-muted);">Buffer Days</div>
      </div>
    </div>
  </div>

  <div class="timeline">
    <div class="timeline-line"></div>
    ${timeline.phases.map((phase, index) => `
      <div class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <h3 class="phase-title">${this.escapeHtml(phase.name)}</h3>
          <div class="phase-duration">${phase.duration} days</div>
          <p class="phase-description">${this.escapeHtml(phase.description)}</p>
          
          ${phase.deliverables.length > 0 ? `
          <div>
            <h4 style="margin-top: 1rem; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; color: var(--text-primary);">Deliverables</h4>
            <ul class="phase-features">
              ${phase.deliverables.map(deliverable => `
                <li>📦 ${this.escapeHtml(deliverable.name)}</li>
              `).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${phase.features.length > 0 ? `
          <div>
            <h4 style="margin-top: 1rem; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 600; text-transform: uppercase; color: var(--text-primary);">Features</h4>
            <ul class="phase-features">
              ${phase.features.slice(0, 5).map(featureId => `
                <li>⚡ Feature ID: ${this.escapeHtml(featureId)}</li>
              `).join('')}
              ${phase.features.length > 5 ? `<li style="color: var(--text-muted); font-style: italic;">...and ${phase.features.length - 5} more</li>` : ''}
            </ul>
          </div>
          ` : ''}
        </div>
      </div>
    `).join('')}
  </div>
</section>
`;
  }

  private generateTeamSection(team: TeamConfig): string {
    return `
<section id="team" class="section">
  <h2 class="section-title">
    <span class="section-icon">👥</span>
    Team Structure
  </h2>
  
  <div style="margin-bottom: 2rem; text-align: center;">
    <div style="display: inline-flex; gap: 2rem; background: var(--background-color); padding: 1rem 2rem; border-radius: 0.75rem; border: 1px solid var(--border-color);">
      <div>
        <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${team.size}</div>
        <div style="font-size: 0.875rem; color: var(--text-muted);">Team Size</div>
      </div>
      <div>
        <div style="font-size: 1rem; font-weight: 700; color: var(--primary-color); text-transform: capitalize;">${team.structure.replace('-', ' ')}</div>
        <div style="font-size: 0.875rem; color: var(--text-muted);">Structure</div>
      </div>
      <div>
        <div style="font-size: 1rem; font-weight: 700; color: var(--primary-color); text-transform: capitalize;">${team.development.replace('-', ' ')}</div>
        <div style="font-size: 0.875rem; color: var(--text-muted);">Methodology</div>
      </div>
    </div>
  </div>

  <div class="team-structure">
    ${team.roles.map(role => `
      <div class="team-role">
        <div class="role-icon">${this.getRoleIcon(role.name)}</div>
        <h3 class="role-title">${this.escapeHtml(role.name)}</h3>
        <div class="role-count">${role.count} ${role.count === 1 ? 'person' : 'people'}</div>
        
        <div style="margin-bottom: 1rem;">
          <h4 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase; color: var(--text-primary);">Responsibilities</h4>
          <ul style="list-style: none; font-size: 0.875rem; color: var(--text-secondary);">
            ${role.responsibilities.slice(0, 3).map(resp => `
              <li style="padding: 0.25rem 0; border-bottom: 1px solid var(--border-color);">${this.escapeHtml(resp)}</li>
            `).join('')}
          </ul>
        </div>
        
        <div>
          <h4 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase; color: var(--text-primary);">Key Skills</h4>
          <ul class="role-skills">
            ${role.skills.slice(0, 4).map(skill => `
              <li>${this.escapeHtml(skill)}</li>
            `).join('')}
          </ul>
        </div>
        
        <div style="margin-top: 1rem; padding: 0.5rem; background: var(--surface-color); border-radius: 0.5rem; border: 1px solid var(--border-color); text-align: center;">
          <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">Seniority Level</span>
          <div style="font-weight: 600; color: var(--primary-color); text-transform: capitalize;">${role.seniority}</div>
        </div>
      </div>
    `).join('')}
  </div>
</section>
`;
  }

  private generateDatabaseSection(database: DatabaseConfig): string {
    return `
<section id="database" class="section">
  <h2 class="section-title">
    <span class="section-icon">🗄️</span>
    Database Schema
  </h2>
  
  <div class="database-schema">
    <div class="db-info">
      <div class="db-detail">
        <div class="db-detail-label">Database Type</div>
        <div class="db-detail-value">${database.type}</div>
      </div>
      <div class="db-detail">
        <div class="db-detail-label">Name</div>
        <div class="db-detail-value">${database.name}</div>
      </div>
      ${database.version ? `
      <div class="db-detail">
        <div class="db-detail-label">Version</div>
        <div class="db-detail-value">${database.version}</div>
      </div>
      ` : ''}
      ${database.orm ? `
      <div class="db-detail">
        <div class="db-detail-label">ORM</div>
        <div class="db-detail-value">${database.orm}</div>
      </div>
      ` : ''}
    </div>

    <div style="margin-top: 2rem;">
      <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Configuration</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div style="background: var(--background-color); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>Migrations</span>
            <span style="color: ${database.migrations ? 'var(--accent-color)' : 'var(--text-muted)'};">
              ${database.migrations ? '✅' : '❌'}
            </span>
          </div>
        </div>
        <div style="background: var(--background-color); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>Seeding</span>
            <span style="color: ${database.seeding ? 'var(--accent-color)' : 'var(--text-muted)'};">
              ${database.seeding ? '✅' : '❌'}
            </span>
          </div>
        </div>
        <div style="background: var(--background-color); padding: 1rem; border-radius: 0.5rem; border: 1px solid var(--border-color);">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <span>Backup</span>
            <span style="color: ${database.backup ? 'var(--accent-color)' : 'var(--text-muted)'};">
              ${database.backup ? '✅' : '❌'}
            </span>
          </div>
        </div>
      </div>
    </div>

    ${database.constraints.length > 0 ? `
    <div style="margin-top: 2rem;">
      <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Constraints</h3>
      <div style="background: var(--background-color); border-radius: 0.5rem; border: 1px solid var(--border-color); overflow: hidden;">
        ${database.constraints.map((constraint, index) => `
          <div style="padding: 1rem; ${index > 0 ? 'border-top: 1px solid var(--border-color);' : ''}">
            <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-weight: 600; text-transform: capitalize;">${constraint.type.replace('-', ' ')}</span>
              <span style="background: var(--primary-color); color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">
                ${constraint.fields.join(', ')}
              </span>
            </div>
            ${constraint.reference ? `<div style="font-size: 0.875rem; color: var(--text-secondary);">References: ${constraint.reference}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
  </div>
</section>
`;
  }

  private combineIntoSelfContained(html: string, css: string, javascript: string, title: string): string {
    return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)} - Visual Specification</title>
  <style>
    ${css}
  </style>
</head>
<body>
  ${html}
  
  <script>
    ${javascript}
  </script>
</body>
</html>`;
  }

  // Helper methods
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private formatProjectType(type: string): string {
    return type.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private formatComplexity(complexity: string): string {
    return complexity.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private formatArchitecture(architecture: string): string {
    return architecture.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private formatCategory(category: string): string {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  private groupFeaturesByCategory(features: Feature[]): Record<string, Feature[]> {
    return features.reduce((acc, feature) => {
      const category = feature.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(feature);
      return acc;
    }, {} as Record<string, Feature[]>);
  }

  private getPriorityDistribution(features: Feature[]): Array<{priority: string, count: number, percentage: number}> {
    const priorities = features.reduce((acc, feature) => {
      acc[feature.priority] = (acc[feature.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = features.length;
    return Object.entries(priorities).map(([priority, count]) => ({
      priority,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  }

  private getRoleIcon(roleName: string): string {
    const icons: Record<string, string> = {
      'frontend developer': '💻',
      'backend developer': '⚙️',
      'full-stack developer': '🌐',
      'devops engineer': '🔧',
      'ui/ux designer': '🎨',
      'product manager': '📋',
      'project manager': '📊',
      'tech lead': '👨‍💻',
      'architect': '🏗️',
      'qa engineer': '🧪',
      'data scientist': '📊',
      'mobile developer': '📱',
      'security engineer': '🔒'
    };

    return icons[roleName.toLowerCase()] || '👤';
  }
}