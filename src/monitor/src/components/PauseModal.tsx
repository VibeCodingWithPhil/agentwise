import React, { useEffect, useRef, useState } from 'react'
import { X, Send, Play } from 'lucide-react'
import { AppleButton } from './AppleButton'
import { cn } from '@/lib/utils'

interface PauseModalProps {
  isOpen: boolean
  onClose: () => void
  onSendCommand: (command: string, type: 'continue' | 'task') => void
  currentProject?: string
}

export function PauseModal({ isOpen, onClose, onSendCommand, currentProject }: PauseModalProps) {
  const [input, setInput] = useState('')
  const [isPlaceholderVisible, setIsPlaceholderVisible] = useState(true)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleContinue = () => {
    onSendCommand('continue', 'continue')
    onClose()
  }

  const handleSendTask = () => {
    if (input.trim()) {
      const command = currentProject 
        ? `/task-${currentProject} ${input.trim()}`
        : input.trim()
      onSendCommand(command, 'task')
      setInput('')
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendTask()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Claude Code Control
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="relative mb-4">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setIsPlaceholderVisible(e.target.value === '')
              }}
              onKeyDown={handleKeyDown}
              className={cn(
                'w-full min-h-[120px] p-4 rounded-lg border resize-none',
                'bg-gray-50 dark:bg-gray-800',
                'border-gray-200 dark:border-gray-700',
                'text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                'transition-all duration-200'
              )}
            />
            {isPlaceholderVisible && (
              <div className="absolute top-4 left-4 text-gray-400 dark:text-gray-500 pointer-events-none transition-opacity duration-300">
                Type to continue or add new task/context...
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <AppleButton
              variant="secondary"
              onClick={handleContinue}
              className="flex-1"
            >
              <Play className="w-4 h-4" />
              Continue
            </AppleButton>
            <AppleButton
              variant="primary"
              onClick={handleSendTask}
              disabled={!input.trim()}
              className="flex-1"
            >
              <Send className="w-4 h-4" />
              Send Task
            </AppleButton>
          </div>

          {currentProject && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
              Commands will be sent to project: <span className="font-medium">{currentProject}</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}