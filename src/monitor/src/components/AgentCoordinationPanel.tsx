'use client'

import React, { useState, useEffect } from 'react'
import { AppleButton } from './AppleButton'

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

interface CoordinationMetrics {
  totalAgents: number
  activeCoordinations: number
  averageLatency: number
  contextSharingActive: number
  communicationHealth: number
  loadBalanceScore: number
}

interface AgentCoordinationPanelProps {
  agents: AgentCoordination[]
  metrics: CoordinationMetrics
  onPauseAgent: (agentId: string) => void
  onResumeAgent: (agentId: string) => void
  onReassignTasks: (fromAgent: string, toAgent: string) => void
}

export function AgentCoordinationPanel({ 
  agents, 
  metrics, 
  onPauseAgent, 
  onResumeAgent, 
  onReassignTasks 
}: AgentCoordinationPanelProps) {
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [showCoordinationMap, setShowCoordinationMap] = useState(false)
  const [sortBy, setSortBy] = useState<'name' | 'load' | 'latency' | 'status'>('name')

  // Get status color and icon
  const getStatusInfo = (status: string): { color: string; icon: string; bgColor: string } => {
    const statusMap = {
      'idle': { 
        color: 'text-gray-600 dark:text-gray-400', 
        icon: '⏸️', 
        bgColor: 'bg-gray-100 dark:bg-gray-700' 
      },
      'working': { 
        color: 'text-blue-600 dark:text-blue-400', 
        icon: '⚡', 
        bgColor: 'bg-blue-100 dark:bg-blue-900' 
      },
      'coordinating': { 
        color: 'text-purple-600 dark:text-purple-400', 
        icon: '🔗', 
        bgColor: 'bg-purple-100 dark:bg-purple-900' 
      },
      'waiting': { 
        color: 'text-yellow-600 dark:text-yellow-400', 
        icon: '⏳', 
        bgColor: 'bg-yellow-100 dark:bg-yellow-900' 
      },
      'error': { 
        color: 'text-red-600 dark:text-red-400', 
        icon: '❌', 
        bgColor: 'bg-red-100 dark:bg-red-900' 
      }
    }
    return statusMap[status as keyof typeof statusMap] || statusMap.idle
  }

  // Sort agents
  const sortedAgents = [...agents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'load':
        return (b.currentLoad / b.maxLoad) - (a.currentLoad / a.maxLoad)
      case 'latency':
        return b.communicationLatency - a.communicationLatency
      case 'status':
        return a.status.localeCompare(b.status)
      default:
        return 0
    }
  })

  // Get load color
  const getLoadColor = (load: number, maxLoad: number): string => {
    const percentage = (load / maxLoad) * 100
    if (percentage >= 90) return 'text-red-600 dark:text-red-400'
    if (percentage >= 70) return 'text-orange-600 dark:text-orange-400'
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const getLoadBarColor = (load: number, maxLoad: number): string => {
    const percentage = (load / maxLoad) * 100
    if (percentage >= 90) return 'bg-red-500 dark:bg-red-400'
    if (percentage >= 70) return 'bg-orange-500 dark:bg-orange-400'
    if (percentage >= 50) return 'bg-yellow-500 dark:bg-yellow-400'
    return 'bg-green-500 dark:bg-green-400'
  }

  // Get health score color
  const getHealthColor = (score: number): string => {
    if (score >= 90) return 'text-green-600 dark:text-green-400'
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 50) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  // Format latency
  const formatLatency = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Agent Coordination
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time agent communication and task coordination
          </p>
        </div>
        
        <div className="flex gap-2">
          <AppleButton
            variant="secondary"
            size="sm"
            onClick={() => setShowCoordinationMap(!showCoordinationMap)}
          >
            {showCoordinationMap ? 'Hide Map' : 'Show Map'}
          </AppleButton>
        </div>
      </div>

      {/* Coordination Metrics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {metrics.totalAgents}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Agents</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {metrics.activeCoordinations}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Active Coords</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatLatency(metrics.averageLatency)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Avg Latency</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            {metrics.contextSharingActive}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Context Shares</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className={`text-2xl font-bold ${getHealthColor(metrics.communicationHealth)}`}>
            {metrics.communicationHealth.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Comm Health</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className={`text-2xl font-bold ${getHealthColor(metrics.loadBalanceScore)}`}>
            {metrics.loadBalanceScore.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Load Balance</div>
        </div>
      </div>

      {/* Coordination Map */}
      {showCoordinationMap && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Agent Coordination Network
          </h3>
          
          <div className="h-64 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg flex items-center justify-center relative overflow-hidden">
            {/* Network visualization placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-8">
                {agents.slice(0, 9).map((agent, index) => {
                  const statusInfo = getStatusInfo(agent.status)
                  return (
                    <div key={agent.agentId} className="relative">
                      <div className={`w-16 h-16 rounded-full border-4 border-white dark:border-gray-700 ${statusInfo.bgColor} flex items-center justify-center shadow-lg`}>
                        <div className="text-2xl">{statusInfo.icon}</div>
                      </div>
                      <div className="text-xs text-center mt-1 text-gray-700 dark:text-gray-300 truncate max-w-16">
                        {agent.name.split(' ')[0]}
                      </div>
                      
                      {/* Connection lines to coordinating agents */}
                      {agent.coordinatingWith.length > 0 && (
                        <div className="absolute top-8 left-8 w-px h-8 bg-purple-300 dark:bg-purple-600 opacity-50" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow text-xs">
              <div className="flex gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span>Working</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full" />
                  <span>Coordinating</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full" />
                  <span>Idle</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Agent Controls */}
      <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sort By
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="name">Name</option>
            <option value="load">Load</option>
            <option value="latency">Latency</option>
            <option value="status">Status</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Selected Agent
          </label>
          <select
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="">Select Agent</option>
            {agents.map(agent => (
              <option key={agent.agentId} value={agent.agentId}>
                {agent.name}
              </option>
            ))}
          </select>
        </div>
        
        {selectedAgent && (
          <div className="flex gap-2 items-end">
            <AppleButton
              variant="secondary"
              size="sm"
              onClick={() => onPauseAgent(selectedAgent)}
              disabled={agents.find(a => a.agentId === selectedAgent)?.status === 'idle'}
            >
              Pause
            </AppleButton>
            <AppleButton
              variant="primary"
              size="sm"
              onClick={() => onResumeAgent(selectedAgent)}
              disabled={agents.find(a => a.agentId === selectedAgent)?.status !== 'idle'}
            >
              Resume
            </AppleButton>
          </div>
        )}
      </div>

      {/* Agent Details List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Agent Status & Coordination ({agents.length} agents)
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedAgents.map(agent => {
            const statusInfo = getStatusInfo(agent.status)
            const loadPercentage = (agent.currentLoad / agent.maxLoad) * 100
            
            return (
              <div key={agent.agentId} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Agent Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${statusInfo.bgColor}`}>
                        <div className="text-lg">{statusInfo.icon}</div>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {agent.name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className={`px-2 py-1 rounded-full text-xs ${statusInfo.bgColor} ${statusInfo.color}`}>
                            {agent.status}
                          </span>
                          <span>•</span>
                          <span>ID: {agent.agentId}</span>
                        </div>
                      </div>
                    </div>

                    {/* Current Task */}
                    {agent.currentTask && (
                      <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Current Task
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {agent.currentTask}
                        </div>
                      </div>
                    )}

                    {/* Load and Performance Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Load</div>
                        <div className="flex items-center gap-2">
                          <div className={`text-lg font-bold ${getLoadColor(agent.currentLoad, agent.maxLoad)}`}>
                            {agent.currentLoad}/{agent.maxLoad}
                          </div>
                          <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                            <div 
                              className={`${getLoadBarColor(agent.currentLoad, agent.maxLoad)} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${Math.min(loadPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Queued</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {agent.queuedTasks}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Response Time</div>
                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {formatLatency(agent.averageResponseTime)}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Success Rate</div>
                        <div className={`text-lg font-bold ${getHealthColor(agent.successRate * 100)}`}>
                          {Math.round(agent.successRate * 100)}%
                        </div>
                      </div>
                    </div>

                    {/* Coordination Info */}
                    {agent.coordinatingWith.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Coordinating With ({agent.coordinatingWith.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {agent.coordinatingWith.map(coordAgent => (
                            <span key={coordAgent} className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300 rounded-full text-xs">
                              {coordAgent.replace(/-/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Shared Contexts */}
                    {agent.sharedContexts.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Shared Contexts ({agent.sharedContexts.length})
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {agent.sharedContexts.map(context => (
                            <span key={context} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 rounded-full text-xs">
                              {context}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Capabilities */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Capabilities
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {agent.capabilities.map(capability => (
                          <span key={capability} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-xs">
                            {capability}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right side - Status indicators */}
                  <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                    <div>Latency: {formatLatency(agent.communicationLatency)}</div>
                    <div>Last HB: {new Date(agent.lastHeartbeat).toLocaleTimeString()}</div>
                    {agent.errorCount > 0 && (
                      <div className="text-red-600 dark:text-red-400">
                        Errors: {agent.errorCount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}