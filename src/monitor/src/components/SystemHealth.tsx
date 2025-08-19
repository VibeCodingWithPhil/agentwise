import React from 'react'
import { Cpu, HardDrive, Wifi, MemoryStick } from 'lucide-react'
import { SystemHealth as SystemHealthType } from '@/services/WebSocketService'
import { cn } from '@/lib/utils'

interface SystemHealthProps {
  health: SystemHealthType
}

export function SystemHealth({ health }: SystemHealthProps) {
  const getHealthColor = (value: number) => {
    if (value > 80) return 'text-red-500'
    if (value > 60) return 'text-yellow-500'
    return 'text-green-500'
  }

  const getHealthBg = (value: number) => {
    if (value > 80) return 'bg-red-500'
    if (value > 60) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const metrics = [
    { icon: Cpu, label: 'CPU', value: health.cpu, unit: '%' },
    { icon: MemoryStick, label: 'Memory', value: health.memory, unit: '%' },
    { icon: HardDrive, label: 'Disk', value: health.disk, unit: '%' },
    { icon: Wifi, label: 'Network', value: health.network, unit: 'ms' }
  ]

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        System Health
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          const isPercentage = metric.unit === '%'
          
          return (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-4 h-4', getHealthColor(metric.value))} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {metric.label}
                  </span>
                </div>
                <span className={cn('text-sm font-bold', getHealthColor(metric.value))}>
                  {metric.value}{metric.unit}
                </span>
              </div>
              {isPercentage && (
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={cn('h-full transition-all duration-500', getHealthBg(metric.value))}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}