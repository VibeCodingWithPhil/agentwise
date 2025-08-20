import * as fs from 'fs-extra';
import * as path from 'path';
import { createHash } from 'crypto';

export interface LearningMetric {
  timestamp: Date;
  agentName: string;
  taskType: string;
  success: boolean;
  duration: number;
  tokensUsed: number;
  errorCount: number;
  improvementSuggestions: string[];
}

export interface AgentKnowledge {
  patterns: Map<string, PatternKnowledge>;
  solutions: Map<string, SolutionMemory>;
  mistakes: Map<string, MistakeRecord>;
  optimizations: Map<string, OptimizationStrategy>;
  performance: PerformanceProfile;
}

export interface PatternKnowledge {
  pattern: string;
  occurrences: number;
  successRate: number;
  bestApproach: string;
  alternativeApproaches: string[];
  lastUpdated: Date;
}

export interface SolutionMemory {
  problem: string;
  solution: string;
  effectiveness: number;
  reusabilityScore: number;
  dependencies: string[];
  timeSaved: number;
}

export interface MistakeRecord {
  error: string;
  context: string;
  resolution: string;
  preventionStrategy: string;
  occurrences: number;
  lastOccurred: Date;
}

export interface OptimizationStrategy {
  name: string;
  description: string;
  applicability: string[];
  performance: number;
  implementation: string;
}

export interface PerformanceProfile {
  averageTaskTime: number;
  successRate: number;
  tokenEfficiency: number;
  learningRate: number;
  specializations: string[];
  weaknesses: string[];
}

export interface FeedbackLoop {
  source: 'task' | 'review' | 'comparison' | 'user';
  feedback: string;
  impact: 'positive' | 'negative' | 'neutral';
  actionTaken: string;
  learningOutcome: string;
}

export class SelfImprovingAgent {
  private agentName: string;
  private knowledge: AgentKnowledge;
  private metrics: LearningMetric[];
  private feedbackHistory: FeedbackLoop[];
  private knowledgePath: string;
  private learningRate: number;
  private adaptationThreshold: number;
  
  constructor(agentName: string) {
    this.agentName = agentName;
    this.knowledgePath = path.join(
      process.cwd(),
      '.agent-knowledge',
      agentName
    );
    this.metrics = [];
    this.feedbackHistory = [];
    this.learningRate = 0.1;
    this.adaptationThreshold = 0.7;
    
    this.knowledge = {
      patterns: new Map(),
      solutions: new Map(),
      mistakes: new Map(),
      optimizations: new Map(),
      performance: {
        averageTaskTime: 0,
        successRate: 0,
        tokenEfficiency: 0,
        learningRate: 0,
        specializations: [],
        weaknesses: []
      }
    };
    
    this.loadKnowledge();
  }

  /**
   * Load existing knowledge from disk
   */
  private async loadKnowledge(): Promise<void> {
    try {
      if (await fs.pathExists(this.knowledgePath)) {
        const files = await fs.readdir(this.knowledgePath);
        
        for (const file of files) {
          const filePath = path.join(this.knowledgePath, file);
          const content = await fs.readJson(filePath);
          
          switch (file) {
            case 'patterns.json':
              this.knowledge.patterns = new Map(Object.entries(content));
              break;
            case 'solutions.json':
              this.knowledge.solutions = new Map(Object.entries(content));
              break;
            case 'mistakes.json':
              this.knowledge.mistakes = new Map(Object.entries(content));
              break;
            case 'optimizations.json':
              this.knowledge.optimizations = new Map(Object.entries(content));
              break;
            case 'performance.json':
              this.knowledge.performance = content;
              break;
            case 'metrics.json':
              this.metrics = content;
              break;
          }
        }
        
        console.log(`📚 Loaded knowledge for ${this.agentName}`);
      }
    } catch (error) {
      console.error(`Error loading knowledge: ${error}`);
    }
  }

  /**
   * Save knowledge to disk
   */
  private async saveKnowledge(): Promise<void> {
    try {
      await fs.ensureDir(this.knowledgePath);
      
      // Save each knowledge component
      await fs.writeJson(
        path.join(this.knowledgePath, 'patterns.json'),
        Object.fromEntries(this.knowledge.patterns),
        { spaces: 2 }
      );
      
      await fs.writeJson(
        path.join(this.knowledgePath, 'solutions.json'),
        Object.fromEntries(this.knowledge.solutions),
        { spaces: 2 }
      );
      
      await fs.writeJson(
        path.join(this.knowledgePath, 'mistakes.json'),
        Object.fromEntries(this.knowledge.mistakes),
        { spaces: 2 }
      );
      
      await fs.writeJson(
        path.join(this.knowledgePath, 'optimizations.json'),
        Object.fromEntries(this.knowledge.optimizations),
        { spaces: 2 }
      );
      
      await fs.writeJson(
        path.join(this.knowledgePath, 'performance.json'),
        this.knowledge.performance,
        { spaces: 2 }
      );
      
      await fs.writeJson(
        path.join(this.knowledgePath, 'metrics.json'),
        this.metrics.slice(-1000), // Keep last 1000 metrics
        { spaces: 2 }
      );
    } catch (error) {
      console.error(`Error saving knowledge: ${error}`);
    }
  }

  /**
   * Learn from task execution
   */
  async learnFromTask(
    taskDescription: string,
    taskResult: any,
    metrics: Partial<LearningMetric>
  ): Promise<void> {
    const metric: LearningMetric = {
      timestamp: new Date(),
      agentName: this.agentName,
      taskType: this.classifyTask(taskDescription),
      success: metrics.success || false,
      duration: metrics.duration || 0,
      tokensUsed: metrics.tokensUsed || 0,
      errorCount: metrics.errorCount || 0,
      improvementSuggestions: []
    };
    
    this.metrics.push(metric);
    
    // Extract patterns from the task
    const patterns = this.extractPatterns(taskDescription, taskResult);
    for (const pattern of patterns) {
      await this.updatePatternKnowledge(pattern, metric.success);
    }
    
    // If successful, remember the solution
    if (metric.success) {
      await this.rememberSolution(taskDescription, taskResult, metric);
    } else {
      // Learn from failure
      await this.learnFromFailure(taskDescription, taskResult, metric);
    }
    
    // Update performance profile
    await this.updatePerformanceProfile();
    
    // Save updated knowledge
    await this.saveKnowledge();
  }

  /**
   * Extract patterns from task
   */
  private extractPatterns(description: string, result: any): string[] {
    const patterns: string[] = [];
    
    // Extract common patterns
    const commonPatterns = [
      /implement\s+(\w+)/gi,
      /fix\s+(\w+)/gi,
      /create\s+(\w+)/gi,
      /update\s+(\w+)/gi,
      /optimize\s+(\w+)/gi,
      /refactor\s+(\w+)/gi
    ];
    
    for (const regex of commonPatterns) {
      const matches = description.matchAll(regex);
      for (const match of matches) {
        patterns.push(match[0].toLowerCase());
      }
    }
    
    // Extract technology patterns
    const techKeywords = [
      'react', 'vue', 'angular', 'typescript', 'javascript',
      'python', 'java', 'api', 'database', 'authentication',
      'testing', 'deployment', 'docker', 'kubernetes'
    ];
    
    for (const tech of techKeywords) {
      if (description.toLowerCase().includes(tech)) {
        patterns.push(`tech:${tech}`);
      }
    }
    
    return patterns;
  }

  /**
   * Update pattern knowledge
   */
  private async updatePatternKnowledge(
    pattern: string,
    success: boolean
  ): Promise<void> {
    const existing = this.knowledge.patterns.get(pattern);
    
    if (existing) {
      existing.occurrences++;
      existing.successRate = (
        (existing.successRate * (existing.occurrences - 1) + (success ? 1 : 0)) /
        existing.occurrences
      );
      existing.lastUpdated = new Date();
    } else {
      this.knowledge.patterns.set(pattern, {
        pattern,
        occurrences: 1,
        successRate: success ? 1 : 0,
        bestApproach: '',
        alternativeApproaches: [],
        lastUpdated: new Date()
      });
    }
  }

  /**
   * Remember successful solution
   */
  private async rememberSolution(
    problem: string,
    solution: any,
    metric: LearningMetric
  ): Promise<void> {
    const solutionKey = this.generateSolutionKey(problem);
    
    this.knowledge.solutions.set(solutionKey, {
      problem,
      solution: JSON.stringify(solution),
      effectiveness: 1 - (metric.errorCount / 10),
      reusabilityScore: this.calculateReusability(solution),
      dependencies: this.extractDependencies(solution),
      timeSaved: metric.duration
    });
  }

  /**
   * Learn from failure
   */
  private async learnFromFailure(
    task: string,
    result: any,
    metric: LearningMetric
  ): Promise<void> {
    const errorKey = this.generateErrorKey(result);
    const existing = this.knowledge.mistakes.get(errorKey);
    
    if (existing) {
      existing.occurrences++;
      existing.lastOccurred = new Date();
    } else {
      this.knowledge.mistakes.set(errorKey, {
        error: this.extractError(result),
        context: task,
        resolution: '',
        preventionStrategy: this.generatePreventionStrategy(result),
        occurrences: 1,
        lastOccurred: new Date()
      });
    }
    
    // Generate improvement suggestions
    metric.improvementSuggestions = this.generateImprovements(task, result);
  }

  /**
   * Update performance profile
   */
  private async updatePerformanceProfile(): Promise<void> {
    const recentMetrics = this.metrics.slice(-100);
    
    if (recentMetrics.length > 0) {
      // Calculate averages
      const totalTime = recentMetrics.reduce((acc, m) => acc + m.duration, 0);
      const successCount = recentMetrics.filter(m => m.success).length;
      const totalTokens = recentMetrics.reduce((acc, m) => acc + m.tokensUsed, 0);
      
      this.knowledge.performance.averageTaskTime = totalTime / recentMetrics.length;
      this.knowledge.performance.successRate = successCount / recentMetrics.length;
      this.knowledge.performance.tokenEfficiency = totalTokens / recentMetrics.length;
      
      // Calculate learning rate
      this.knowledge.performance.learningRate = this.calculateLearningRate();
      
      // Identify specializations and weaknesses
      this.identifySpecializations();
      this.identifyWeaknesses();
    }
  }

  /**
   * Apply learned knowledge to new task
   */
  async applyKnowledge(taskDescription: string): Promise<any> {
    const suggestions = {
      patterns: [] as PatternKnowledge[],
      solutions: [] as SolutionMemory[],
      avoidMistakes: [] as MistakeRecord[],
      optimizations: [] as OptimizationStrategy[],
      approach: ''
    };
    
    // Find relevant patterns
    for (const [key, pattern] of this.knowledge.patterns) {
      if (taskDescription.toLowerCase().includes(key.toLowerCase())) {
        suggestions.patterns.push(pattern);
      }
    }
    
    // Find similar solutions
    const solutionKey = this.generateSolutionKey(taskDescription);
    const similarSolutions = this.findSimilarSolutions(solutionKey);
    suggestions.solutions = similarSolutions;
    
    // Check for potential mistakes
    for (const [, mistake] of this.knowledge.mistakes) {
      if (this.contextMatches(taskDescription, mistake.context)) {
        suggestions.avoidMistakes.push(mistake);
      }
    }
    
    // Apply optimizations
    for (const [, optimization] of this.knowledge.optimizations) {
      if (optimization.applicability.some(a => taskDescription.includes(a))) {
        suggestions.optimizations.push(optimization);
      }
    }
    
    // Generate approach recommendation
    suggestions.approach = this.generateApproachRecommendation(suggestions);
    
    return suggestions;
  }

  /**
   * Share knowledge with other agents
   */
  async shareKnowledge(): Promise<any> {
    return {
      agentName: this.agentName,
      patterns: Array.from(this.knowledge.patterns.values())
        .filter(p => p.successRate > 0.8),
      solutions: Array.from(this.knowledge.solutions.values())
        .filter(s => s.reusabilityScore > 0.7),
      optimizations: Array.from(this.knowledge.optimizations.values())
        .filter(o => o.performance > 0.6),
      performance: this.knowledge.performance
    };
  }

  /**
   * Learn from other agents
   */
  async learnFromPeer(peerKnowledge: any): Promise<void> {
    // Merge patterns
    for (const pattern of peerKnowledge.patterns || []) {
      const existing = this.knowledge.patterns.get(pattern.pattern);
      if (!existing || pattern.successRate > existing.successRate) {
        this.knowledge.patterns.set(pattern.pattern, pattern);
      }
    }
    
    // Merge solutions
    for (const solution of peerKnowledge.solutions || []) {
      const key = this.generateSolutionKey(solution.problem);
      const existing = this.knowledge.solutions.get(key);
      if (!existing || solution.effectiveness > existing.effectiveness) {
        this.knowledge.solutions.set(key, solution);
      }
    }
    
    // Merge optimizations
    for (const optimization of peerKnowledge.optimizations || []) {
      const existing = this.knowledge.optimizations.get(optimization.name);
      if (!existing || optimization.performance > existing.performance) {
        this.knowledge.optimizations.set(optimization.name, optimization);
      }
    }
    
    await this.saveKnowledge();
  }

  /**
   * Process user feedback
   */
  async processFeedback(feedback: string, context: any): Promise<void> {
    const loop: FeedbackLoop = {
      source: 'user',
      feedback,
      impact: this.analyzeFeedbackSentiment(feedback),
      actionTaken: '',
      learningOutcome: ''
    };
    
    // Analyze feedback and determine action
    if (loop.impact === 'negative') {
      // Learn what went wrong
      const improvement = this.generateImprovementFromFeedback(feedback, context);
      loop.actionTaken = improvement.action;
      loop.learningOutcome = improvement.outcome;
      
      // Update mistake records
      await this.recordMistakeFromFeedback(feedback, context);
    } else if (loop.impact === 'positive') {
      // Reinforce what worked well
      const reinforcement = this.reinforcePositiveBehavior(feedback, context);
      loop.actionTaken = reinforcement.action;
      loop.learningOutcome = reinforcement.outcome;
    }
    
    this.feedbackHistory.push(loop);
    
    // Adjust learning rate based on feedback
    this.adjustLearningRate(loop.impact);
    
    await this.saveKnowledge();
  }

  // Helper methods
  private classifyTask(description: string): string {
    const taskTypes = [
      { pattern: /implement|create|build/i, type: 'implementation' },
      { pattern: /fix|debug|resolve/i, type: 'debugging' },
      { pattern: /optimize|improve|enhance/i, type: 'optimization' },
      { pattern: /refactor|restructure/i, type: 'refactoring' },
      { pattern: /test|verify|validate/i, type: 'testing' },
      { pattern: /document|explain/i, type: 'documentation' }
    ];
    
    for (const { pattern, type } of taskTypes) {
      if (pattern.test(description)) {
        return type;
      }
    }
    
    return 'general';
  }

  private generateSolutionKey(problem: string): string {
    return createHash('md5')
      .update(problem.toLowerCase().replace(/\s+/g, ' '))
      .digest('hex')
      .substring(0, 16);
  }

  private generateErrorKey(result: any): string {
    const errorStr = JSON.stringify(result).substring(0, 100);
    return createHash('md5').update(errorStr).digest('hex').substring(0, 16);
  }

  private calculateReusability(solution: any): number {
    // Simple heuristic: shorter, more general solutions are more reusable
    const solutionStr = JSON.stringify(solution);
    const generalityScore = 1 - (solutionStr.split('/').length / 100);
    const simplicityScore = Math.max(0, 1 - (solutionStr.length / 10000));
    
    return (generalityScore + simplicityScore) / 2;
  }

  private extractDependencies(solution: any): string[] {
    const deps: string[] = [];
    const solutionStr = JSON.stringify(solution);
    
    // Extract common dependency patterns
    const patterns = [
      /require\(['"]([^'"]+)['"]\)/g,
      /import.*from\s+['"]([^'"]+)['"]/g,
      /npm install\s+([^\s]+)/g
    ];
    
    for (const pattern of patterns) {
      const matches = solutionStr.matchAll(pattern);
      for (const match of matches) {
        deps.push(match[1]);
      }
    }
    
    return [...new Set(deps)];
  }

  private extractError(result: any): string {
    if (typeof result === 'string') {
      return result.substring(0, 200);
    }
    if (result.error) {
      return result.error.toString().substring(0, 200);
    }
    return 'Unknown error';
  }

  private generatePreventionStrategy(result: any): string {
    const errorStr = this.extractError(result).toLowerCase();
    
    if (errorStr.includes('type')) {
      return 'Add type checking and validation';
    }
    if (errorStr.includes('undefined') || errorStr.includes('null')) {
      return 'Add null checks and default values';
    }
    if (errorStr.includes('timeout')) {
      return 'Increase timeout or optimize performance';
    }
    if (errorStr.includes('permission')) {
      return 'Check permissions and access rights';
    }
    
    return 'Improve error handling and validation';
  }

  private generateImprovements(task: string, result: any): string[] {
    const improvements: string[] = [];
    
    // Based on common patterns
    if (task.includes('performance')) {
      improvements.push('Profile code for bottlenecks');
      improvements.push('Consider caching strategies');
    }
    
    if (result.errorCount > 0) {
      improvements.push('Add more comprehensive error handling');
      improvements.push('Implement retry logic');
    }
    
    return improvements;
  }

  private calculateLearningRate(): number {
    if (this.metrics.length < 10) return 0;
    
    const recent = this.metrics.slice(-10);
    const older = this.metrics.slice(-20, -10);
    
    if (older.length === 0) return 0;
    
    const recentSuccess = recent.filter(m => m.success).length / recent.length;
    const olderSuccess = older.filter(m => m.success).length / older.length;
    
    return Math.max(0, recentSuccess - olderSuccess);
  }

  private identifySpecializations(): void {
    const taskTypeCounts = new Map<string, number>();
    const taskTypeSuccess = new Map<string, number>();
    
    for (const metric of this.metrics) {
      const count = taskTypeCounts.get(metric.taskType) || 0;
      const success = taskTypeSuccess.get(metric.taskType) || 0;
      
      taskTypeCounts.set(metric.taskType, count + 1);
      if (metric.success) {
        taskTypeSuccess.set(metric.taskType, success + 1);
      }
    }
    
    const specializations: string[] = [];
    
    for (const [type, count] of taskTypeCounts) {
      const successRate = (taskTypeSuccess.get(type) || 0) / count;
      if (successRate > 0.8 && count > 5) {
        specializations.push(type);
      }
    }
    
    this.knowledge.performance.specializations = specializations;
  }

  private identifyWeaknesses(): void {
    const taskTypeCounts = new Map<string, number>();
    const taskTypeSuccess = new Map<string, number>();
    
    for (const metric of this.metrics) {
      const count = taskTypeCounts.get(metric.taskType) || 0;
      const success = taskTypeSuccess.get(metric.taskType) || 0;
      
      taskTypeCounts.set(metric.taskType, count + 1);
      if (metric.success) {
        taskTypeSuccess.set(metric.taskType, success + 1);
      }
    }
    
    const weaknesses: string[] = [];
    
    for (const [type, count] of taskTypeCounts) {
      const successRate = (taskTypeSuccess.get(type) || 0) / count;
      if (successRate < 0.5 && count > 3) {
        weaknesses.push(type);
      }
    }
    
    this.knowledge.performance.weaknesses = weaknesses;
  }

  private findSimilarSolutions(targetKey: string): SolutionMemory[] {
    const similar: SolutionMemory[] = [];
    
    for (const [key, solution] of this.knowledge.solutions) {
      if (this.calculateSimilarity(key, targetKey) > 0.7) {
        similar.push(solution);
      }
    }
    
    return similar.sort((a, b) => b.effectiveness - a.effectiveness).slice(0, 3);
  }

  private calculateSimilarity(key1: string, key2: string): number {
    // Simple character-based similarity
    let matches = 0;
    const minLen = Math.min(key1.length, key2.length);
    
    for (let i = 0; i < minLen; i++) {
      if (key1[i] === key2[i]) matches++;
    }
    
    return matches / Math.max(key1.length, key2.length);
  }

  private contextMatches(task: string, context: string): boolean {
    const taskWords = new Set(task.toLowerCase().split(/\s+/));
    const contextWords = new Set(context.toLowerCase().split(/\s+/));
    
    let matches = 0;
    for (const word of taskWords) {
      if (contextWords.has(word)) matches++;
    }
    
    return matches / taskWords.size > 0.3;
  }

  private generateApproachRecommendation(suggestions: any): string {
    const parts: string[] = [];
    
    if (suggestions.patterns.length > 0) {
      const bestPattern = suggestions.patterns
        .sort((a: any, b: any) => b.successRate - a.successRate)[0];
      parts.push(`Use approach: ${bestPattern.bestApproach || 'standard pattern'}`);
    }
    
    if (suggestions.solutions.length > 0) {
      parts.push(`Reference similar solution with ${suggestions.solutions[0].effectiveness * 100}% effectiveness`);
    }
    
    if (suggestions.avoidMistakes.length > 0) {
      parts.push(`Avoid: ${suggestions.avoidMistakes[0].preventionStrategy}`);
    }
    
    if (suggestions.optimizations.length > 0) {
      parts.push(`Apply optimization: ${suggestions.optimizations[0].name}`);
    }
    
    return parts.join('. ') || 'Use standard approach';
  }

  private analyzeFeedbackSentiment(feedback: string): 'positive' | 'negative' | 'neutral' {
    const lower = feedback.toLowerCase();
    
    const positiveWords = ['good', 'great', 'excellent', 'perfect', 'thanks', 'well done'];
    const negativeWords = ['bad', 'wrong', 'error', 'fail', 'poor', 'incorrect'];
    
    const positiveCount = positiveWords.filter(w => lower.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lower.includes(w)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private generateImprovementFromFeedback(feedback: string, context: any): any {
    return {
      action: 'Analyze feedback and identify improvement areas',
      outcome: 'Updated knowledge base with feedback insights'
    };
  }

  private reinforcePositiveBehavior(feedback: string, context: any): any {
    return {
      action: 'Reinforce successful patterns',
      outcome: 'Increased confidence in successful approaches'
    };
  }

  private async recordMistakeFromFeedback(feedback: string, context: any): Promise<void> {
    const errorKey = this.generateErrorKey(feedback);
    
    this.knowledge.mistakes.set(errorKey, {
      error: feedback.substring(0, 200),
      context: JSON.stringify(context).substring(0, 200),
      resolution: 'Pending resolution based on feedback',
      preventionStrategy: 'Learn from user feedback',
      occurrences: 1,
      lastOccurred: new Date()
    });
  }

  private adjustLearningRate(impact: 'positive' | 'negative' | 'neutral'): void {
    if (impact === 'positive') {
      this.learningRate = Math.min(1, this.learningRate * 1.1);
    } else if (impact === 'negative') {
      this.learningRate = Math.max(0.01, this.learningRate * 0.9);
    }
  }
}