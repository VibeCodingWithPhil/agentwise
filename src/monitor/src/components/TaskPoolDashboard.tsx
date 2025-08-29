'use client'

import React, { useState, useEffect } from 'react'
import { AppleButton } from './AppleButton'

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

interface AgentCapability {
  agentId: string
  skills: string[]
  currentLoad: number
  maxLoad: number
  averageTokensPerTask: number
  successRate: number
  isActive: boolean
  lastTaskCompleted?: string
}

interface TaskDistributionMetrics {
  totalTasks: number
  pendingTasks: number
  inProgressTasks: number
  completedTasks: number
  failedTasks: number
  blockedTasks: number
  averageWaitTime: number
  averageExecutionTime: number
  agentUtilization: { [agentId: string]: number }
  tokenOptimizationSavings: number
}

interface TaskPoolDashboardProps {
  tasks: PooledTask[]
  agents: AgentCapability[]
  metrics: TaskDistributionMetrics
  onRebalanceTasks: () => void
}

export function TaskPoolDashboard({ tasks, agents, metrics, onRebalanceTasks }: TaskPoolDashboardProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [showAgentDetails, setShowAgentDetails] = useState(false)

  // Get status color
  const getStatusColor = (status: string): string => {
    const colors: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'assigned': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'in-progress': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'failed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'blocked': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  // Get priority color
  const getPriorityColor = (priority: string): string => {
    const colors: { [key: string]: string } = {
      'low': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'medium': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'high': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      'critical': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    }
    return colors[priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }

  // Format duration
  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`
    } else {
      return `${seconds}s`
    }
  }

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (selectedStatus !== 'all' && task.status !== selectedStatus) return false
    if (selectedPriority !== 'all' && task.priority !== selectedPriority) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Task Pool Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Task Pool Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Shared task queue with intelligent agent coordination
          </p>
        </div>
        
        <div className="flex gap-2">
          <AppleButton
            variant="secondary"
            size="sm"
            onClick={() => setShowAgentDetails(!showAgentDetails)}
          >
            {showAgentDetails ? 'Hide Agents' : 'Show Agents'}
          </AppleButton>
          <AppleButton
            variant="primary"
            size="sm"
            onClick={onRebalanceTasks}
          >
            Rebalance Tasks
          </AppleButton>
        </div>
      </div>

      {/* Task Pool Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {metrics.totalTasks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {metrics.pendingTasks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {metrics.inProgressTasks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">In Progress</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {metrics.completedTasks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {metrics.failedTasks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {metrics.blockedTasks}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Blocked</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Average Wait Time
          </h3>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatDuration(metrics.averageWaitTime)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Time from task creation to assignment
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Average Execution Time
          </h3>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatDuration(metrics.averageExecutionTime)}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Time from assignment to completion
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Token Optimization Savings
          </h3>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {metrics.tokenOptimizationSavings.toLocaleString()}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Tokens saved through context sharing
          </p>
        </div>
      </div>

      {/* Agent Details Panel */}
      {showAgentDetails && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Agent Utilization
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(agent => (
              <div key={agent.agentId} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {agent.agentId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${agent.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                    {agent.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Load:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {agent.currentLoad}/{agent.maxLoad}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((agent.currentLoad / agent.maxLoad) * 100, 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Success Rate:</span>
                    <span className="text-gray-900 dark:text-gray-100">
                      {Math.round(agent.successRate * 100)}%
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Skills: {agent.skills.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task List Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status Filter
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Priority Filter
          </label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="all">All Priority</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Task Queue ({filteredTasks.length} tasks)
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No tasks match the selected filters
            </div>
          ) : (
            filteredTasks.map(task => (
              <div key={task.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status.replace('-', ' ')}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Phase {task.phase}
                      </span>
                      {task.retryCount > 0 && (
                        <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300">
                          Retry {task.retryCount}/{task.maxRetries}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                      {task.description}
                    </h4>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <div>ID: {task.id}</div>
                      {task.assignedAgent && (
                        <div>Assigned to: {task.assignedAgent.replace(/-/g, ' ')}</div>
                      )}
                      <div>Estimated tokens: {task.estimatedTokens.toLocaleString()}</div>
                      {task.requiredSkills.length > 0 && (
                        <div>Skills: {task.requiredSkills.join(', ')}</div>
                      )}
                      {task.dependencies.length > 0 && (
                        <div>Dependencies: {task.dependencies.length} tasks</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                    <div>Created: {new Date(task.createdAt).toLocaleTimeString()}</div>
                    {task.assignedAt && (
                      <div>Assigned: {new Date(task.assignedAt).toLocaleTimeString()}</div>
                    )}
                    {task.completedAt && (
                      <div>Completed: {new Date(task.completedAt).toLocaleTimeString()}</div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}