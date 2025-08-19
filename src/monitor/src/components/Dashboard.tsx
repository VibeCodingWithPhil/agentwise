'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Header } from './Header'
import { AgentGrid } from './AgentGrid'
import { SystemHealth } from './SystemHealth'
import { TaskFeed } from './TaskFeed'
import { OverallProgress } from './OverallProgress'
import { PauseModal } from './PauseModal'
import { 
  wsService, 
  Agent, 
  Task, 
  Phase, 
  SystemHealth as SystemHealthType,
  ProjectInfo 
} from '@/services/WebSocketService'

export function Dashboard() {
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
        }
        break

      case 'agents_update':
        setAgents(data.data || [])
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
        break

      case 'shutdown':
        handleEmergencyShutdown()
        break
    }
  }, [])

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

        {/* Agent Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Active Agents
          </h2>
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