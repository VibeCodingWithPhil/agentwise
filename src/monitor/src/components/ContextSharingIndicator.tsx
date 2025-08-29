'use client'

import React, { useState, useEffect } from 'react'

interface ContextShare {
  id: string
  fromAgent: string
  toAgent: string
  contextType: string
  size: number
  compressionRatio: number
  timestamp: string
  status: 'pending' | 'active' | 'completed' | 'expired'
  tokensSaved: number
  hitCount: number
}

interface ContextSharingIndicatorProps {
  contextShares: ContextShare[]
  totalTokensSaved: number
  activeShares: number
  cacheHitRate: number
  isConnected: boolean
}

export function ContextSharingIndicator({ 
  contextShares, 
  totalTokensSaved, 
  activeShares, 
  cacheHitRate, 
  isConnected 
}: ContextSharingIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [pulseAnimation, setPulseAnimation] = useState(false)

  // Trigger pulse animation when new shares are added
  useEffect(() => {
    setPulseAnimation(true)
    const timer = setTimeout(() => setPulseAnimation(false), 1000)
    return () => clearTimeout(timer)
  }, [contextShares.length, activeShares])

  // Filter context shares
  const filteredShares = contextShares.filter(share => {
    if (filter === 'all') return true
    if (filter === 'active') return share.status === 'active' || share.status === 'pending'
    if (filter === 'completed') return share.status === 'completed'
    return true
  })

  // Get status color
  const getStatusColor = (status: string): string => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'expired': 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
    return colors[status as keyof typeof colors] || colors.expired
  }

  // Format file size
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Get context type icon
  const getContextTypeIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      'project': '📁',
      'file': '📄',
      'component': '🧩',
      'api': '🔌',
      'database': '🗄️',
      'config': '⚙️',
      'cache': '💾',
      'session': '🔐'
    }
    return icons[type.toLowerCase()] || '📋'
  }

  // Calculate efficiency score
  const getEfficiencyScore = (): number => {
    if (contextShares.length === 0) return 0
    const avgCompressionRatio = contextShares.reduce((sum, share) => sum + share.compressionRatio, 0) / contextShares.length
    const avgTokensSaved = totalTokensSaved / contextShares.length
    return Math.min(((avgCompressionRatio - 1) * 25) + (cacheHitRate * 0.5) + Math.min(avgTokensSaved / 100, 25), 100)
  }

  const efficiencyScore = getEfficiencyScore()

  return (
    <div className="space-y-4">
      {/* Main Indicator */}
      <div className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-300 ${
        isConnected 
          ? 'border-green-200 dark:border-green-800' 
          : 'border-red-200 dark:border-red-800'
      } ${pulseAnimation ? 'ring-4 ring-green-200 dark:ring-green-800' : ''}`}>
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg transition-colors duration-300 ${
                isConnected 
                  ? 'bg-green-100 dark:bg-green-900' 
                  : 'bg-red-100 dark:bg-red-900'
              }`}>
                <div className="text-xl">
                  {isConnected ? '🔗' : '🔌'}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Context Sharing
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Real-time context optimization status
                </p>
              </div>
            </div>
            
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold transition-all duration-300 ${
              activeShares > 0 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-gray-400 dark:text-gray-500'
            }`}>
              {activeShares}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Active Shares</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalTokensSaved.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tokens Saved</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {cacheHitRate.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Hit Rate</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {efficiencyScore.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Efficiency</div>
          </div>
        </div>

        {/* Efficiency Progress Bar */}
        <div className="px-4 pb-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                efficiencyScore >= 80 
                  ? 'bg-green-500 dark:bg-green-400'
                  : efficiencyScore >= 60
                    ? 'bg-yellow-500 dark:bg-yellow-400'
                    : efficiencyScore >= 40
                      ? 'bg-orange-500 dark:bg-orange-400'
                      : 'bg-red-500 dark:bg-red-400'
              }`}
              style={{ width: `${efficiencyScore}%` }}
            />
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center">
            Context Sharing Efficiency: {efficiencyScore.toFixed(1)}%
          </div>
        </div>

        {/* Toggle Details Button */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
            <span className={`ml-2 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}>
              ↓
            </span>
          </button>
        </div>
      </div>

      {/* Detailed Context Shares */}
      {showDetails && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Context Shares ({filteredShares.length})
              </h4>
              
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-80 overflow-y-auto">
            {filteredShares.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No context shares found
              </div>
            ) : (
              filteredShares.map(share => (
                <div key={share.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">
                        {getContextTypeIcon(share.contextType)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(share.status)}`}>
                            {share.status}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {share.contextType}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                          <div>
                            <span className="font-medium">{share.fromAgent}</span>
                            <span className="mx-2">→</span>
                            <span className="font-medium">{share.toAgent}</span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs">
                            <span>Size: {formatSize(share.size)}</span>
                            <span>Compression: {share.compressionRatio.toFixed(1)}:1</span>
                            <span>Hits: {share.hitCount}</span>
                            <span>Saved: {share.tokensSaved.toLocaleString()} tokens</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                      <div>{new Date(share.timestamp).toLocaleTimeString()}</div>
                      <div>{new Date(share.timestamp).toLocaleDateString()}</div>
                    </div>
                  </div>
                  
                  {/* Context sharing flow visualization */}
                  <div className="mt-3 flex items-center justify-center">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <div className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                        {share.fromAgent.split('-')[0]}
                      </div>
                      <div className={`w-8 h-px ${
                        share.status === 'active' 
                          ? 'bg-green-400 animate-pulse' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`} />
                      <div className="text-lg">
                        {share.status === 'active' ? '⚡' : '📤'}
                      </div>
                      <div className={`w-8 h-px ${
                        share.status === 'active' 
                          ? 'bg-green-400 animate-pulse' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`} />
                      <div className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded">
                        {share.toAgent.split('-')[0]}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Real-time Activity Indicator */}
      {isConnected && activeShares > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="flex">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-1" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse ml-1" style={{ animationDelay: '0.4s' }} />
            </div>
            
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Active Context Sharing
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {activeShares} context{activeShares !== 1 ? 's' : ''} being shared between agents
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}