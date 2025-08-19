import React from 'react'
import { Clock, Zap, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Agent } from '@/services/WebSocketService'
import { cn } from '@/lib/utils'

interface AgentCardProps {
  agent: Agent
  onPause?: (agentId: string) => void
  onResume?: (agentId: string) => void
}

export function AgentCard({ agent, onPause, onResume }: AgentCardProps) {
  const getStatusIcon = () => {
    switch (agent.status) {
      case 'idle':
        return <Clock className="w-4 h-4 text-gray-500" />
      case 'working':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusText = () => {
    return agent.status.charAt(0).toUpperCase() + agent.status.slice(1)
  }

  const getProgressColor = () => {
    if (agent.progress === 100) return 'bg-green-500'
    if (agent.progress > 75) return 'bg-blue-500'
    if (agent.progress > 50) return 'bg-yellow-500'
    if (agent.progress > 25) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  const getAgentColorClass = () => {
    const colors: Record<string, string> = {
      blue: 'border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/30',
      green: 'border-green-500/30 bg-green-50/50 dark:bg-green-950/30',
      purple: 'border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/30',
      orange: 'border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/30',
      red: 'border-red-500/30 bg-red-50/50 dark:bg-red-950/30',
      yellow: 'border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-950/30',
      cyan: 'border-cyan-500/30 bg-cyan-50/50 dark:bg-cyan-950/30',
      pink: 'border-pink-500/30 bg-pink-50/50 dark:bg-pink-950/30',
      gray: 'border-gray-500/30 bg-gray-50/50 dark:bg-gray-950/30'
    }
    return colors[agent.color] || colors.gray
  }

  return (
    <div className={cn(
      'rounded-xl border-2 p-4 transition-all duration-300 hover:shadow-lg',
      'backdrop-blur-sm',
      getAgentColorClass()
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{agent.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              {agent.name}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {agent.type}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {agent.progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className={cn('h-full transition-all duration-500', getProgressColor())}
              style={{ width: `${agent.progress}%` }}
            />
          </div>
        </div>

        <div className="text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Current Task:</span>
            <span className="text-gray-800 dark:text-gray-200 font-medium truncate max-w-[60%]">
              {agent.currentTask}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Tasks:</span>
            <span className="text-gray-800 dark:text-gray-200">
              {agent.completedTasks}/{agent.totalTasks}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Duration:</span>
            <span className="text-gray-800 dark:text-gray-200">{agent.duration}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Tokens:</span>
            <span className="text-gray-800 dark:text-gray-200 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {agent.tokens.toLocaleString()}
            </span>
          </div>
        </div>

        {agent.status === 'working' && (
          <button
            onClick={() => onPause?.(agent.id)}
            className="w-full mt-2 py-1 px-2 text-xs bg-orange-500/20 hover:bg-orange-500/30 text-orange-700 dark:text-orange-300 rounded-md transition-colors"
          >
            Pause Agent
          </button>
        )}
      </div>
    </div>
  )
}