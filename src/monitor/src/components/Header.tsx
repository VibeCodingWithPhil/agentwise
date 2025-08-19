import React from 'react'
import { Moon, Sun, Monitor, Power, Pause, RefreshCw } from 'lucide-react'
import { AppleButton } from './AppleButton'
import { useTheme } from './ThemeProvider'

interface HeaderProps {
  projectName: string
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
  onPause: () => void
  onRefresh: () => void
  onEmergencyShutdown: () => void
}

export function Header({ 
  projectName, 
  connectionStatus, 
  onPause, 
  onRefresh,
  onEmergencyShutdown 
}: HeaderProps) {
  const { theme, setTheme } = useTheme()

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'bg-green-500'
      case 'connecting':
        return 'bg-yellow-500 animate-pulse'
      case 'disconnected':
        return 'bg-red-500'
    }
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="w-4 h-4" />
      case 'dark':
        return <Moon className="w-4 h-4" />
      case 'system':
        return <Monitor className="w-4 h-4" />
    }
  }

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Agentwise Monitor
          </h1>
          {projectName && (
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">|</span>
              <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                {projectName}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className={cn('w-2 h-2 rounded-full', getStatusColor())} />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {connectionStatus}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <AppleButton
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            aria-label="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </AppleButton>
          
          <AppleButton
            variant="secondary"
            size="sm"
            onClick={onPause}
            aria-label="Pause execution"
          >
            <Pause className="w-4 h-4" />
            Pause
          </AppleButton>

          <AppleButton
            variant="destructive"
            size="sm"
            onClick={onEmergencyShutdown}
            aria-label="Emergency shutdown - stops all agents"
          >
            <Power className="w-4 h-4" />
            Kill Switch
          </AppleButton>

          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700" />

          <AppleButton
            variant="ghost"
            size="sm"
            onClick={cycleTheme}
            aria-label="Toggle theme"
          >
            {getThemeIcon()}
          </AppleButton>
        </div>
      </div>
    </header>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}