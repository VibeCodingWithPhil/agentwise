export interface Agent {
  id: string
  name: string
  type: string
  icon: string
  color: string
  status: 'idle' | 'working' | 'completed' | 'error'
  progress: number
  currentTask: string
  completedTasks: number
  totalTasks: number
  duration: string
  tokens: number
}

export interface Task {
  id: string
  agentId: string
  agentName: string
  description: string
  status: 'pending' | 'in-progress' | 'completed' | 'failed'
  timestamp: string
  duration?: string
}

export interface Phase {
  id: string
  name: string
  status: 'pending' | 'active' | 'completed'
  progress: number
  agents: string[]
}

export interface SystemHealth {
  cpu: number
  memory: number
  disk: number
  network: number
}

export interface ProjectInfo {
  name: string
  path: string
}

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private messageHandlers: Set<(data: any) => void> = new Set()
  private connectionStatusHandlers: Set<(status: boolean) => void> = new Set()
  private url: string = 'ws://localhost:3002'

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return
    }

    try {
      this.ws = new WebSocket(this.url)

      this.ws.onopen = () => {
        console.log('WebSocket connected')
        this.notifyConnectionStatus(true)
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout)
          this.reconnectTimeout = null
        }
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.notifyMessageHandlers(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      this.ws.onclose = () => {
        console.log('WebSocket disconnected')
        this.notifyConnectionStatus(false)
        this.scheduleReconnect()
      }
    } catch (error) {
      console.error('Error creating WebSocket:', error)
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) return
    
    this.reconnectTimeout = setTimeout(() => {
      console.log('Attempting to reconnect...')
      this.connect()
    }, 5000)
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      console.error('WebSocket not connected')
    }
  }

  onMessage(handler: (data: any) => void) {
    this.messageHandlers.add(handler)
    return () => {
      this.messageHandlers.delete(handler)
    }
  }

  onConnectionStatus(handler: (status: boolean) => void) {
    this.connectionStatusHandlers.add(handler)
    return () => {
      this.connectionStatusHandlers.delete(handler)
    }
  }

  private notifyMessageHandlers(data: any) {
    this.messageHandlers.forEach(handler => handler(data))
  }

  private notifyConnectionStatus(status: boolean) {
    this.connectionStatusHandlers.forEach(handler => handler(status))
  }

  // Command methods
  refreshAgents() {
    this.send({ type: 'refresh' })
  }

  pauseAgent(agentId: string) {
    this.send({ type: 'pause_agent', agentId })
  }

  resumeAgent(agentId: string) {
    this.send({ type: 'resume_agent', agentId })
  }

  addTask(agentId: string, task: string) {
    this.send({ type: 'add_task', agentId, task })
  }

  emergencyShutdown() {
    this.send({ type: 'emergency_shutdown' })
  }
}

export const wsService = new WebSocketService()