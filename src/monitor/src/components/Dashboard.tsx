'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Header } from './Header'
import { AgentGrid } from './AgentGrid'
import { SystemHealth } from './SystemHealth'
import { TaskFeed } from './TaskFeed'
import { OverallProgress } from './OverallProgress'
import { PauseModal } from './PauseModal'
import { TaskPoolDashboard } from './TaskPoolDashboard'
import { TokenOptimizationMetrics } from './TokenOptimizationMetrics'
import { KnowledgeGraphVisualization } from './KnowledgeGraphVisualization'
import { AgentCoordinationPanel } from './AgentCoordinationPanel'
import { ContextSharingIndicator } from './ContextSharingIndicator'
import { AppleButton } from './AppleButton'
import { 
  wsService, 
  Agent, 
  Task, 
  Phase, 
  SystemHealth as SystemHealthType,
  ProjectInfo 
} from '@/services/WebSocketService'

// Task Pool interfaces
interface PooledTask {
  id: string
  projectId: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedTokens: number
  requiredSkills: string[]
  dependencies: string[]
  assignedAgent?: string
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'failed' | 'blocked'
  createdAt: string
  assignedAt?: string
  completedAt?: string
  phase: number
  retryCount: number
  maxRetries: number
}

interface AgentCoordination {
  agentId: string
  name: string
  status: 'idle' | 'working' | 'coordinating' | 'waiting' | 'error'
  currentTask?: string
  coordinatingWith: string[]
  sharedContexts: string[]
  communicationLatency: number
  lastHeartbeat: string
  capabilities: string[]
  currentLoad: number
  maxLoad: number
  queuedTasks: number
  averageResponseTime: number
  errorCount: number
  successRate: number
}

interface ContextShare {
  id: string
  fromAgent: string
  toAgent: string
  contextType: string
  size: number
  compressionRatio: number
  timestamp: string
  status: 'pending' | 'active' | 'completed' | 'expired'
  tokensSaved: number
  hitCount: number
}

export function Dashboard() {
  // Original state
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealthType>({
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0
  })
  const [project, setProject] = useState<ProjectInfo | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting')
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false)
  const [overallProgress, setOverallProgress] = useState(0)
  const [totalTokens, setTotalTokens] = useState(0)

  // New task pool state
  const [activeView, setActiveView] = useState<'agents' | 'task-pool' | 'coordination' | 'optimization' | 'knowledge-graph'>('agents')
  const [pooledTasks, setPooledTasks] = useState<PooledTask[]>([])
  const [agentCoordination, setAgentCoordination] = useState<AgentCoordination[]>([])
  const [contextShares, setContextShares] = useState<ContextShare[]>([])
  const [sharedContextConnected, setSharedContextConnected] = useState(false)

  // Task pool metrics
  const [taskPoolMetrics, setTaskPoolMetrics] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    blockedTasks: 0,
    averageWaitTime: 0,
    averageExecutionTime: 0,
    agentUtilization: {} as { [agentId: string]: number },
    tokenOptimizationSavings: 0
  })

  // Token optimization metrics
  const [tokenMetrics, setTokenMetrics] = useState({
    totalTokensSaved: 0,
    averageSavingsPerTask: 0,
    contextShareRate: 0,
    cachingEfficiency: 0,
    compressionRatio: 0,
    realTimeOptimization: 0
  })

  // Coordination metrics
  const [coordinationMetrics, setCoordinationMetrics] = useState({
    totalAgents: 0,
    activeCoordinations: 0,
    averageLatency: 0,
    contextSharingActive: 0,
    communicationHealth: 0,
    loadBalanceScore: 0
  })

  // Calculate overall progress from agents
  useEffect(() => {
    if (agents.length > 0) {
      const totalProgress = agents.reduce((sum, agent) => sum + agent.progress, 0)
      const avgProgress = Math.round(totalProgress / agents.length)
      setOverallProgress(avgProgress)

      const tokens = agents.reduce((sum, agent) => sum + agent.tokens, 0)
      setTotalTokens(tokens)
    } else {
      setOverallProgress(0)
      setTotalTokens(0)
    }
  }, [agents])

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'initial_data':
        if (data.data) {
          setProject(data.data.project || null)
          setAgents(data.data.agents || [])
          setTasks(data.data.tasks || [])
          setPhases(data.data.phases || [])
          setSystemHealth(data.data.systemHealth || {
            cpu: 0,
            memory: 0,
            disk: 0,
            network: 0
          })
          
          // Initialize task pool data with mock data if not provided
          setPooledTasks(data.data.pooledTasks || generateMockPooledTasks())
          setAgentCoordination(data.data.agentCoordination || generateMockCoordination(data.data.agents || []))
          setContextShares(data.data.contextShares || generateMockContextShares())
          setSharedContextConnected(data.data.sharedContextConnected || true)
        }
        break

      case 'agents_update':
        setAgents(data.data || [])
        // Update coordination data when agents change
        setAgentCoordination(prev => updateCoordinationFromAgents(prev, data.data || []))
        break

      case 'task_update':
        if (data.data) {
          setTasks((prev) => [data.data, ...prev].slice(0, 50))
        }
        break

      case 'system_health':
        setSystemHealth(data.data || {
          cpu: 0,
          memory: 0,
          disk: 0,
          network: 0
        })
        break

      case 'project_changed':
        if (data.data) {
          setProject(data.data.project || null)
          setAgents(data.data.agents || [])
        }
        break

      case 'no_project':
        setProject(null)
        setAgents([])
        setTasks([])
        setPooledTasks([])
        setAgentCoordination([])
        setContextShares([])
        break

      case 'shutdown':
        handleEmergencyShutdown()
        break

      // New task pool message types
      case 'task_pool_update':
        if (data.data) {
          setPooledTasks(data.data.tasks || [])
          setTaskPoolMetrics(data.data.metrics || taskPoolMetrics)
        }
        break

      case 'agent_coordination_update':
        if (data.data) {
          setAgentCoordination(data.data.agents || [])
          setCoordinationMetrics(data.data.metrics || coordinationMetrics)
        }
        break

      case 'context_sharing_update':
        if (data.data) {
          setContextShares(data.data.contextShares || [])
          setTokenMetrics(data.data.tokenMetrics || tokenMetrics)
        }
        break

      case 'shared_context_connected':
        setSharedContextConnected(data.connected || false)
        break
    }
  }, [taskPoolMetrics, coordinationMetrics, tokenMetrics])

  // WebSocket connection management
  useEffect(() => {
    // Connect to WebSocket
    wsService.connect()

    // Set up message handler
    const unsubscribeMessage = wsService.onMessage(handleWebSocketMessage)

    // Set up connection status handler
    const unsubscribeStatus = wsService.onConnectionStatus((status) => {
      setConnectionStatus(status ? 'connected' : 'disconnected')
    })

    // Cleanup on unmount
    return () => {
      unsubscribeMessage()
      unsubscribeStatus()
      wsService.disconnect()
    }
  }, [handleWebSocketMessage])

  const handleRefresh = () => {
    wsService.refreshAgents()
  }

  const handlePause = () => {
    setIsPauseModalOpen(true)
  }

  const handleSendCommand = (command: string, type: 'continue' | 'task') => {
    // Send command to WebSocket server which will relay to Claude Code
    wsService.send({
      type: 'claude_command',
      command,
      commandType: type
    })
  }

  const handlePauseAgent = (agentId: string) => {
    wsService.pauseAgent(agentId)
  }

  const handleResumeAgent = (agentId: string) => {
    wsService.resumeAgent(agentId)
  }

  const handleEmergencyShutdown = () => {
    if (confirm('Are you sure you want to perform an emergency shutdown? This will stop all agents immediately.')) {
      wsService.emergencyShutdown()
      setTimeout(() => {
        window.close()
      }, 1000)
    }
  }

  // Task Pool Event Handlers
  const handleRebalanceTasks = () => {
    wsService.send({
      type: 'rebalance_tasks'
    })
  }

  const handleReassignTasks = (fromAgent: string, toAgent: string) => {
    wsService.send({
      type: 'reassign_tasks',
      fromAgent,
      toAgent
    })
  }

  // Mock data generators (will be replaced by real data from SharedContextServer)
  const generateMockPooledTasks = (): PooledTask[] => {
    return [
      {
        id: 'task_1',
        projectId: project?.path || 'unknown',
        description: 'Implement user authentication system',
        priority: 'high',
        estimatedTokens: 2500,
        requiredSkills: ['backend', 'security'],
        dependencies: [],
        assignedAgent: 'backend-specialist',
        status: 'in-progress',
        createdAt: new Date(Date.now() - 300000).toISOString(),
        assignedAt: new Date(Date.now() - 240000).toISOString(),
        phase: 1,
        retryCount: 0,
        maxRetries: 3
      },
      {
        id: 'task_2',
        projectId: project?.path || 'unknown',
        description: 'Create responsive dashboard components',
        priority: 'medium',
        estimatedTokens: 1800,
        requiredSkills: ['frontend', 'ui'],
        dependencies: [],
        assignedAgent: 'frontend-specialist',
        status: 'completed',
        createdAt: new Date(Date.now() - 600000).toISOString(),
        assignedAt: new Date(Date.now() - 540000).toISOString(),
        completedAt: new Date(Date.now() - 60000).toISOString(),
        phase: 1,
        retryCount: 0,
        maxRetries: 3
      },
      {
        id: 'task_3',
        projectId: project?.path || 'unknown',
        description: 'Setup database schema and migrations',
        priority: 'critical',
        estimatedTokens: 3200,
        requiredSkills: ['database', 'backend'],
        dependencies: [],
        status: 'pending',
        createdAt: new Date(Date.now() - 180000).toISOString(),
        phase: 1,
        retryCount: 0,
        maxRetries: 3
      },
      {
        id: 'task_4',
        projectId: project?.path || 'unknown',
        description: 'Write comprehensive unit tests',
        priority: 'medium',
        estimatedTokens: 2100,
        requiredSkills: ['testing', 'qa'],
        dependencies: ['task_1', 'task_2'],
        status: 'blocked',
        createdAt: new Date(Date.now() - 120000).toISOString(),
        phase: 2,
        retryCount: 0,
        maxRetries: 3
      }
    ]
  }

  const generateMockCoordination = (agentList: Agent[]): AgentCoordination[] => {
    return agentList.map((agent, index) => ({
      agentId: agent.id,
      name: agent.name,
      status: ['working', 'coordinating', 'idle', 'waiting'][Math.floor(Math.random() * 4)] as any,
      currentTask: agent.currentTask || undefined,
      coordinatingWith: index > 0 ? [agentList[index - 1].id] : [],
      sharedContexts: ['project-context', 'component-specs'].slice(0, Math.floor(Math.random() * 3)),
      communicationLatency: Math.floor(Math.random() * 200) + 50,
      lastHeartbeat: new Date().toISOString(),
      capabilities: agent.type ? [agent.type] : ['general'],
      currentLoad: agent.progress > 0 ? Math.floor(agent.progress / 25) : 0,
      maxLoad: 4,
      queuedTasks: Math.floor(Math.random() * 5),
      averageResponseTime: Math.floor(Math.random() * 1000) + 200,
      errorCount: Math.floor(Math.random() * 3),
      successRate: 0.8 + Math.random() * 0.2
    }))
  }

  const generateMockContextShares = (): ContextShare[] => {
    return [
      {
        id: 'share_1',
        fromAgent: 'frontend-specialist',
        toAgent: 'backend-specialist',
        contextType: 'component',
        size: 45600,
        compressionRatio: 2.3,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        status: 'active',
        tokensSaved: 1250,
        hitCount: 8
      },
      {
        id: 'share_2',
        fromAgent: 'backend-specialist',
        toAgent: 'database-specialist',
        contextType: 'api',
        size: 23400,
        compressionRatio: 1.8,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'completed',
        tokensSaved: 890,
        hitCount: 12
      },
      {
        id: 'share_3',
        fromAgent: 'database-specialist',
        toAgent: 'backend-specialist',
        contextType: 'schema',
        size: 67200,
        compressionRatio: 3.1,
        timestamp: new Date(Date.now() - 60000).toISOString(),
        status: 'active',
        tokensSaved: 1840,
        hitCount: 5
      }
    ]
  }

  const updateCoordinationFromAgents = (prevCoordination: AgentCoordination[], newAgents: Agent[]): AgentCoordination[] => {
    return newAgents.map(agent => {
      const existing = prevCoordination.find(c => c.agentId === agent.id)
      return existing ? {
        ...existing,
        name: agent.name,
        currentTask: agent.currentTask,
        status: agent.status === 'working' ? 'working' : agent.status === 'idle' ? 'idle' : existing.status,
        currentLoad: Math.floor(agent.progress / 25),
        lastHeartbeat: new Date().toISOString()
      } : {
        agentId: agent.id,
        name: agent.name,
        status: agent.status === 'working' ? 'working' : 'idle',
        currentTask: agent.currentTask,
        coordinatingWith: [],
        sharedContexts: [],
        communicationLatency: Math.floor(Math.random() * 200) + 50,
        lastHeartbeat: new Date().toISOString(),
        capabilities: agent.type ? [agent.type] : ['general'],
        currentLoad: Math.floor(agent.progress / 25),
        maxLoad: 4,
        queuedTasks: 0,
        averageResponseTime: Math.floor(Math.random() * 1000) + 200,
        errorCount: 0,
        successRate: 0.95
      }
    })
  }

  // Update metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Update task pool metrics
      setTaskPoolMetrics(prev => ({
        ...prev,
        totalTasks: pooledTasks.length,
        pendingTasks: pooledTasks.filter(t => t.status === 'pending').length,
        inProgressTasks: pooledTasks.filter(t => ['assigned', 'in-progress'].includes(t.status)).length,
        completedTasks: pooledTasks.filter(t => t.status === 'completed').length,
        failedTasks: pooledTasks.filter(t => t.status === 'failed').length,
        blockedTasks: pooledTasks.filter(t => t.status === 'blocked').length,
        tokenOptimizationSavings: contextShares.reduce((sum, share) => sum + share.tokensSaved, 0)
      }))

      // Update token metrics
      setTokenMetrics(prev => ({
        ...prev,
        totalTokensSaved: contextShares.reduce((sum, share) => sum + share.tokensSaved, 0),
        averageSavingsPerTask: contextShares.length > 0 
          ? contextShares.reduce((sum, share) => sum + share.tokensSaved, 0) / contextShares.length 
          : 0,
        contextShareRate: pooledTasks.length > 0 
          ? (contextShares.filter(s => s.status === 'active').length / pooledTasks.length) * 100 
          : 0,
        cachingEfficiency: Math.min(85 + Math.random() * 10, 100),
        compressionRatio: contextShares.length > 0 
          ? contextShares.reduce((sum, share) => sum + share.compressionRatio, 0) / contextShares.length 
          : 2.0,
        realTimeOptimization: Math.floor(Math.random() * 50) + 10
      }))

      // Update coordination metrics
      setCoordinationMetrics(prev => ({
        ...prev,
        totalAgents: agentCoordination.length,
        activeCoordinations: agentCoordination.filter(a => a.coordinatingWith.length > 0).length,
        averageLatency: agentCoordination.length > 0 
          ? agentCoordination.reduce((sum, agent) => sum + agent.communicationLatency, 0) / agentCoordination.length 
          : 0,
        contextSharingActive: contextShares.filter(s => s.status === 'active').length,
        communicationHealth: Math.min(80 + Math.random() * 15, 100),
        loadBalanceScore: calculateLoadBalanceScore(agentCoordination)
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [pooledTasks, contextShares, agentCoordination])

  const calculateLoadBalanceScore = (agents: AgentCoordination[]): number => {
    if (agents.length === 0) return 100
    
    const utilizationRates = agents.map(a => a.maxLoad > 0 ? (a.currentLoad / a.maxLoad) * 100 : 0)
    const avgUtilization = utilizationRates.reduce((sum, rate) => sum + rate, 0) / utilizationRates.length
    const variance = utilizationRates.reduce((sum, rate) => sum + Math.pow(rate - avgUtilization, 2), 0) / utilizationRates.length
    
    // Lower variance means better load balance
    return Math.max(100 - Math.sqrt(variance), 0)
  }

  const totalCompletedTasks = agents.reduce((sum, agent) => sum + agent.completedTasks, 0)
  const totalTasks = agents.reduce((sum, agent) => sum + agent.totalTasks, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      <Header
        projectName={project?.name || ''}
        connectionStatus={connectionStatus}
        onPause={handlePause}
        onRefresh={handleRefresh}
        onEmergencyShutdown={handleEmergencyShutdown}
      />

      <main className="container mx-auto px-6 py-6 space-y-6">
        {/* Overall Progress */}
        <OverallProgress
          progress={overallProgress}
          totalAgents={agents.length}
          completedTasks={totalCompletedTasks}
          totalTasks={totalTasks}
          totalTokens={totalTokens}
        />

        {/* Navigation Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'agents', name: 'Agent Overview', icon: '🤖' },
                { id: 'task-pool', name: 'Task Pool', icon: '📋' },
                { id: 'coordination', name: 'Coordination', icon: '🔗' },
                { id: 'optimization', name: 'Token Optimization', icon: '⚡' },
                { id: 'knowledge-graph', name: 'Knowledge Graph', icon: '🧠' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as any)}
                  className={`${
                    activeView === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors duration-200`}
                >
                  <span>{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeView === 'agents' && (
              <div className="space-y-6">
                {/* Agent Grid */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      Active Agents
                    </h2>
                    <ContextSharingIndicator
                      contextShares={contextShares.slice(0, 3)}
                      totalTokensSaved={tokenMetrics.totalTokensSaved}
                      activeShares={contextShares.filter(s => s.status === 'active').length}
                      cacheHitRate={tokenMetrics.cachingEfficiency}
                      isConnected={sharedContextConnected}
                    />
                  </div>
                  <AgentGrid
                    agents={agents}
                    onPauseAgent={handlePauseAgent}
                    onResumeAgent={handleResumeAgent}
                  />
                </div>

                {/* System Health and Task Feed */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SystemHealth health={systemHealth} />
                  <TaskFeed tasks={tasks} />
                </div>
              </div>
            )}

            {activeView === 'task-pool' && (
              <TaskPoolDashboard
                tasks={pooledTasks}
                agents={agentCoordination.map(ac => ({
                  agentId: ac.agentId,
                  skills: ac.capabilities,
                  currentLoad: ac.currentLoad,
                  maxLoad: ac.maxLoad,
                  averageTokensPerTask: 1000,
                  successRate: ac.successRate,
                  isActive: ac.status !== 'error',
                  lastTaskCompleted: ac.lastHeartbeat
                }))}
                metrics={taskPoolMetrics}
                onRebalanceTasks={handleRebalanceTasks}
              />
            )}

            {activeView === 'coordination' && (
              <AgentCoordinationPanel
                agents={agentCoordination}
                metrics={coordinationMetrics}
                onPauseAgent={handlePauseAgent}
                onResumeAgent={handleResumeAgent}
                onReassignTasks={handleReassignTasks}
              />
            )}

            {activeView === 'optimization' && (
              <div className="space-y-6">
                <TokenOptimizationMetrics
                  metrics={tokenMetrics}
                  isConnected={sharedContextConnected}
                />
                <ContextSharingIndicator
                  contextShares={contextShares}
                  totalTokensSaved={tokenMetrics.totalTokensSaved}
                  activeShares={contextShares.filter(s => s.status === 'active').length}
                  cacheHitRate={tokenMetrics.cachingEfficiency}
                  isConnected={sharedContextConnected}
                />
              </div>
            )}

            {activeView === 'knowledge-graph' && (
              <div className="space-y-6">
                <KnowledgeGraphVisualization
                  projectId={project?.name || 'current'}
                  height={600}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Pause Modal */}
      <PauseModal
        isOpen={isPauseModalOpen}
        onClose={() => setIsPauseModalOpen(false)}
        onSendCommand={handleSendCommand}
        currentProject={project?.name}
      />
    </div>
  )
}