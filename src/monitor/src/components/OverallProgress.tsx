import React from 'react'
import { TrendingUp, Users, CheckSquare, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OverallProgressProps {
  progress: number
  totalAgents: number
  completedTasks: number
  totalTasks: number
  totalTokens: number
}

export function OverallProgress({
  progress,
  totalAgents,
  completedTasks,
  totalTasks,
  totalTokens
}: OverallProgressProps) {
  const getProgressColor = () => {
    if (progress === 100) return 'bg-green-500'
    if (progress > 75) return 'bg-blue-500'
    if (progress > 50) return 'bg-yellow-500'
    if (progress > 25) return 'bg-orange-500'
    return 'bg-gray-400'
  }

  const metrics = [
    { icon: Users, label: 'Active Agents', value: totalAgents },
    { icon: CheckSquare, label: 'Tasks', value: `${completedTasks}/${totalTasks}` },
    { icon: Zap, label: 'Tokens Used', value: totalTokens.toLocaleString() }
  ]

  return (
    <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Overall Progress
        </h2>
        <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          {progress}%
        </span>
      </div>

      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-6">
        <div 
          className={cn('h-full transition-all duration-1000 ease-out', getProgressColor())}
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <div key={metric.label} className="text-center">
              <div className="flex justify-center mb-2">
                <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {metric.value}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {metric.label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}