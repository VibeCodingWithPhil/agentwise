import React from 'react'
import { Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Task } from '@/services/WebSocketService'
import { cn } from '@/lib/utils'

interface TaskFeedProps {
  tasks: Task[]
  maxItems?: number
}

export function TaskFeed({ tasks, maxItems = 10 }: TaskFeedProps) {
  const displayTasks = tasks.slice(0, maxItems)

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-3 h-3 text-gray-500" />
      case 'in-progress':
        return <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle className="w-3 h-3 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-3 h-3 text-red-500" />
    }
  }

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
      case 'in-progress':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Task Feed
      </h2>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {displayTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No tasks to display
          </div>
        ) : (
          displayTasks.map((task) => (
            <div
              key={task.id}
              className={cn(
                'rounded-lg p-3 transition-all duration-300',
                getStatusColor(task.status)
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1">
                  {getStatusIcon(task.status)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {task.agentName}
                    </p>
                    <p className="text-xs opacity-75 mt-0.5">
                      {task.description}
                    </p>
                  </div>
                </div>
                <div className="text-xs opacity-60 whitespace-nowrap">
                  {formatTimestamp(task.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}