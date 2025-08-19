import React from 'react'
import { Agent } from '@/services/WebSocketService'
import { AgentCard } from './AgentCard'

interface AgentGridProps {
  agents: Agent[]
  onPauseAgent?: (agentId: string) => void
  onResumeAgent?: (agentId: string) => void
}

export function AgentGrid({ agents, onPauseAgent, onResumeAgent }: AgentGridProps) {
  if (agents.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400 mb-2">No agents active</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Start an Agentwise project to see agents here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          agent={agent}
          onPause={onPauseAgent}
          onResume={onResumeAgent}
        />
      ))}
    </div>
  )
}