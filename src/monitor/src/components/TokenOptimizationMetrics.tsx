'use client'

import React, { useEffect, useState } from 'react'
import { ObservableTokenChart } from './ObservableTokenChart'

interface TokenMetrics {
  totalTokensSaved: number
  averageSavingsPerTask: number
  contextShareRate: number
  cachingEfficiency: number
  compressionRatio: number
  realTimeOptimization: number
}

interface TokenOptimizationMetricsProps {
  metrics: TokenMetrics
  isConnected: boolean
}

export function TokenOptimizationMetrics({ metrics, isConnected }: TokenOptimizationMetricsProps) {
  const [displayMetrics, setDisplayMetrics] = useState<TokenMetrics>(metrics)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (JSON.stringify(metrics) !== JSON.stringify(displayMetrics)) {
      setIsAnimating(true)
      setTimeout(() => {
        setDisplayMetrics(metrics)
        setIsAnimating(false)
      }, 150)
    }
  }, [metrics, displayMetrics])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const getEfficiencyColor = (percentage: number): string => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400'
    if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400'
    if (percentage >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getProgressBarColor = (percentage: number): string => {
    if (percentage >= 80) return 'bg-green-500 dark:bg-green-400'
    if (percentage >= 60) return 'bg-yellow-500 dark:bg-yellow-400'
    if (percentage >= 40) return 'bg-orange-500 dark:bg-orange-400'
    return 'bg-red-500 dark:bg-red-400'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Token Optimization
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Real-time token savings and efficiency metrics
          </p>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
          isConnected 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Main Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Tokens Saved */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-500 dark:bg-blue-400 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className={`transition-opacity duration-150 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {formatNumber(displayMetrics.totalTokensSaved)}
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Total Tokens Saved
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Cumulative savings through optimization
          </p>
          <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
            ↑ +{formatNumber(displayMetrics.realTimeOptimization)} this session
          </div>
        </div>

        {/* Average Savings Per Task */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-500 dark:bg-green-400 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className={`transition-opacity duration-150 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {displayMetrics.averageSavingsPerTask.toFixed(0)}
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Avg. Savings Per Task
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Average tokens saved per task
          </p>
          <div className="mt-3 text-xs text-green-600 dark:text-green-400">
            {displayMetrics.averageSavingsPerTask > 500 ? '↑ Above average' : '→ Within range'}
          </div>
        </div>

        {/* Context Share Rate */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-500 dark:bg-purple-400 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
            </div>
            <div className={`transition-opacity duration-150 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {displayMetrics.contextShareRate.toFixed(0)}%
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            Context Share Rate
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Percentage of tasks using shared context
          </p>
          <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={`${getProgressBarColor(displayMetrics.contextShareRate)} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${displayMetrics.contextShareRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Efficiency Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Caching Efficiency */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Caching Efficiency
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Cache Hit Rate</span>
              <span className={`text-lg font-bold ${getEfficiencyColor(displayMetrics.cachingEfficiency)}`}>
                {displayMetrics.cachingEfficiency.toFixed(1)}%
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className={`${getProgressBarColor(displayMetrics.cachingEfficiency)} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${displayMetrics.cachingEfficiency}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Cache Size</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatNumber(Math.round(displayMetrics.totalTokensSaved * 0.15))}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Hit/Miss Ratio</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {(displayMetrics.cachingEfficiency / (100 - displayMetrics.cachingEfficiency)).toFixed(1)}:1
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Compression Metrics */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Context Compression
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Compression Ratio</span>
              <span className={`text-lg font-bold ${getEfficiencyColor(displayMetrics.compressionRatio)}`}>
                {displayMetrics.compressionRatio.toFixed(1)}:1
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className={`${getProgressBarColor(Math.min(displayMetrics.compressionRatio * 25, 100))} h-3 rounded-full transition-all duration-500`}
                style={{ width: `${Math.min(displayMetrics.compressionRatio * 25, 100)}%` }}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Space Saved</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatNumber(Math.round(displayMetrics.totalTokensSaved * 0.25))}B
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Efficiency</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {Math.min(displayMetrics.compressionRatio * 25, 100).toFixed(0)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Optimization Chart with Observable Plot */}
      <ObservableTokenChart 
        realTimeOptimization={displayMetrics.realTimeOptimization} 
        className=""
      />

      {/* Optimization Tips */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-indigo-200 dark:border-indigo-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          💡 Optimization Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayMetrics.contextShareRate < 70 && (
            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-yellow-500 mt-0.5">⚠️</div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Low Context Sharing
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Consider increasing context reuse between agents
                </div>
              </div>
            </div>
          )}
          
          {displayMetrics.cachingEfficiency < 60 && (
            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-orange-500 mt-0.5">🔄</div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Cache Optimization Needed
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Cache hit rate could be improved
                </div>
              </div>
            </div>
          )}
          
          {displayMetrics.compressionRatio < 2 && (
            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-blue-500 mt-0.5">📦</div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Compression Opportunity
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Context compression could be enhanced
                </div>
              </div>
            </div>
          )}
          
          {displayMetrics.contextShareRate >= 80 && displayMetrics.cachingEfficiency >= 80 && (
            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="text-green-500 mt-0.5">✅</div>
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                  Excellent Optimization
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Your system is running at peak efficiency
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}