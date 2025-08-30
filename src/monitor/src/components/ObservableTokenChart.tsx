'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as Plot from '@observablehq/plot';
import * as d3 from 'd3';

interface TokenData {
  timestamp: Date;
  tokensUsed: number;
  tokensSaved: number;
  optimizationRate: number;
  agentCount: number;
}

interface ObservableTokenChartProps {
  realTimeOptimization: number;
  className?: string;
}

export function ObservableTokenChart({ realTimeOptimization, className = '' }: ObservableTokenChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tokenData, setTokenData] = useState<TokenData[]>([]);

  // Generate initial data and update in real-time
  useEffect(() => {
    // Initialize with historical data
    const now = new Date();
    const initialData: TokenData[] = Array.from({ length: 20 }, (_, i) => {
      const timestamp = new Date(now.getTime() - (19 - i) * 60000); // Last 20 minutes
      return {
        timestamp,
        tokensUsed: 10000 - Math.random() * 2000,
        tokensSaved: 6000 + Math.random() * 3000 + i * 150, // Trending upward
        optimizationRate: 60 + Math.random() * 30 + i * 0.5,
        agentCount: Math.floor(3 + Math.random() * 5)
      };
    });
    setTokenData(initialData);

    // Update data every 3 seconds
    const interval = setInterval(() => {
      setTokenData(prev => {
        const newData = [...prev.slice(1)]; // Remove oldest
        const lastPoint = prev[prev.length - 1];
        
        // Add new data point with realistic progression
        newData.push({
          timestamp: new Date(),
          tokensUsed: 10000 - Math.random() * 2000,
          tokensSaved: lastPoint.tokensSaved + realTimeOptimization / 20 + Math.random() * 100,
          optimizationRate: Math.min(99.3, lastPoint.optimizationRate + Math.random() * 2 - 0.5),
          agentCount: Math.floor(3 + Math.random() * 5)
        });
        
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [realTimeOptimization]);

  // Render chart with Observable Plot
  useEffect(() => {
    if (!containerRef.current || tokenData.length === 0) return;
    if (typeof window === 'undefined') return; // Skip SSR

    // Clear previous chart
    containerRef.current.innerHTML = '';

    // Create multi-series line chart
    const chart = Plot.plot({
      width: containerRef.current.clientWidth,
      height: 320,
      marginLeft: 60,
      marginRight: 120,
      style: {
        backgroundColor: 'transparent',
        color: 'currentColor',
      },
      grid: true,
      x: {
        type: 'time',
        label: 'Time',
        tickFormat: d3.timeFormat('%H:%M'),
      },
      y: {
        label: 'Tokens',
        domain: [0, Math.max(...tokenData.map(d => Math.max(d.tokensUsed, d.tokensSaved))) * 1.1],
      },
      marks: [
        // Area for tokens saved
        Plot.areaY(tokenData, {
          x: 'timestamp',
          y: 'tokensSaved',
          fill: '#10b981',
          fillOpacity: 0.1,
          curve: 'catmull-rom',
        }),
        // Line for tokens saved
        Plot.lineY(tokenData, {
          x: 'timestamp',
          y: 'tokensSaved',
          stroke: '#10b981',
          strokeWidth: 2,
          curve: 'catmull-rom',
          tip: true,
        }),
        // Line for tokens used
        Plot.lineY(tokenData, {
          x: 'timestamp',
          y: 'tokensUsed',
          stroke: '#ef4444',
          strokeWidth: 2,
          curve: 'catmull-rom',
          strokeDasharray: '5,5',
          tip: true,
        }),
        // Dots for current values
        Plot.dot(tokenData.slice(-1), {
          x: 'timestamp',
          y: 'tokensSaved',
          r: 6,
          fill: '#10b981',
          stroke: '#fff',
          strokeWidth: 2,
        }),
        // Text labels
        Plot.text(tokenData.slice(-1), {
          x: 'timestamp',
          y: 'tokensSaved',
          text: d => `${d.tokensSaved.toFixed(0)} saved`,
          dy: -10,
          fill: '#10b981',
          fontWeight: 'bold',
        }),
        // Optimization rate as secondary axis
        Plot.ruleY([0], { stroke: '#e5e7eb' }),
      ],
      color: {
        legend: true,
      },
    });

    containerRef.current.appendChild(chart);

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [tokenData]);

  // Calculate statistics
  const latestData = tokenData[tokenData.length - 1];
  const avgOptimization = tokenData.reduce((acc, d) => acc + d.optimizationRate, 0) / tokenData.length;
  const totalSaved = tokenData.reduce((acc, d) => acc + d.tokensSaved, 0);

  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Real-time Token Optimization Trend
        </h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-400">Tokens Saved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500" style={{ borderTop: '2px dashed' }}></div>
            <span className="text-gray-600 dark:text-gray-400">Tokens Used</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div ref={containerRef} className="w-full min-h-[320px]" />

      {/* Statistics Bar */}
      <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Current Rate</div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            +{realTimeOptimization.toFixed(0)} tokens/min
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Avg Optimization</div>
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {avgOptimization.toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Saved (20m)</div>
          <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
            {(totalSaved / 1000).toFixed(1)}k
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Active Agents</div>
          <div className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
            {latestData?.agentCount || 0}
          </div>
        </div>
      </div>
    </div>
  );
}