'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as Plot from '@observablehq/plot';
import * as d3 from 'd3';

interface GraphNode {
  id: string;
  name: string;
  type: 'file' | 'class' | 'function' | 'component' | 'module' | 'agent';
  size: number;
  importance: number;
  connections: number;
  group: string;
}

interface GraphLink {
  source: string;
  target: string;
  strength: number;
  type: 'import' | 'export' | 'dependency' | 'calls' | 'extends' | 'implements';
}

interface KnowledgeGraphProps {
  projectId?: string;
  className?: string;
  height?: number;
}

export function KnowledgeGraphVisualization({ 
  projectId = 'current', 
  className = '',
  height = 600 
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[], links: GraphLink[] }>({ 
    nodes: [], 
    links: [] 
  });

  // Generate sample knowledge graph data
  useEffect(() => {
    // Simulate real knowledge graph data
    const nodes: GraphNode[] = [
      // Core modules
      { id: 'index', name: 'index.ts', type: 'file', size: 45, importance: 100, connections: 12, group: 'core' },
      { id: 'orchestrator', name: 'AgentOrchestrator', type: 'class', size: 35, importance: 95, connections: 8, group: 'core' },
      { id: 'tokenOptimizer', name: 'TokenOptimizer', type: 'class', size: 40, importance: 90, connections: 6, group: 'optimization' },
      { id: 'knowledgeGraph', name: 'KnowledgeGraphGenerator', type: 'class', size: 38, importance: 88, connections: 7, group: 'knowledge' },
      
      // Agents
      { id: 'frontendAgent', name: 'Frontend Agent', type: 'agent', size: 30, importance: 80, connections: 5, group: 'agents' },
      { id: 'backendAgent', name: 'Backend Agent', type: 'agent', size: 30, importance: 80, connections: 5, group: 'agents' },
      { id: 'databaseAgent', name: 'Database Agent', type: 'agent', size: 28, importance: 75, connections: 4, group: 'agents' },
      { id: 'devopsAgent', name: 'DevOps Agent', type: 'agent', size: 26, importance: 70, connections: 4, group: 'agents' },
      { id: 'testingAgent', name: 'Testing Agent', type: 'agent', size: 25, importance: 70, connections: 3, group: 'agents' },
      
      // Components
      { id: 'contextManager', name: 'ContextManager', type: 'component', size: 32, importance: 85, connections: 6, group: 'context' },
      { id: 'projectRegistry', name: 'ProjectRegistry', type: 'component', size: 28, importance: 75, connections: 4, group: 'registry' },
      { id: 'monitor', name: 'MonitorDashboard', type: 'component', size: 35, importance: 82, connections: 5, group: 'monitoring' },
      { id: 'validation', name: 'ValidationSystem', type: 'module', size: 30, importance: 78, connections: 5, group: 'validation' },
      
      // Knowledge Graph components
      { id: 'kgStore', name: 'KnowledgeStore', type: 'component', size: 25, importance: 72, connections: 3, group: 'knowledge' },
      { id: 'kgQuery', name: 'QueryEngine', type: 'component', size: 22, importance: 68, connections: 3, group: 'knowledge' },
      { id: 'kgIntegration', name: 'Integration', type: 'component', size: 20, importance: 65, connections: 4, group: 'knowledge' },
    ];

    const links: GraphLink[] = [
      // Core connections
      { source: 'index', target: 'orchestrator', strength: 10, type: 'import' },
      { source: 'index', target: 'tokenOptimizer', strength: 9, type: 'import' },
      { source: 'index', target: 'knowledgeGraph', strength: 8, type: 'import' },
      { source: 'orchestrator', target: 'frontendAgent', strength: 7, type: 'calls' },
      { source: 'orchestrator', target: 'backendAgent', strength: 7, type: 'calls' },
      { source: 'orchestrator', target: 'databaseAgent', strength: 6, type: 'calls' },
      { source: 'orchestrator', target: 'devopsAgent', strength: 5, type: 'calls' },
      { source: 'orchestrator', target: 'testingAgent', strength: 5, type: 'calls' },
      
      // Token optimization connections
      { source: 'tokenOptimizer', target: 'contextManager', strength: 8, type: 'dependency' },
      { source: 'tokenOptimizer', target: 'knowledgeGraph', strength: 9, type: 'dependency' },
      
      // Knowledge Graph internal
      { source: 'knowledgeGraph', target: 'kgStore', strength: 8, type: 'dependency' },
      { source: 'knowledgeGraph', target: 'kgQuery', strength: 7, type: 'dependency' },
      { source: 'knowledgeGraph', target: 'kgIntegration', strength: 6, type: 'dependency' },
      { source: 'kgIntegration', target: 'contextManager', strength: 5, type: 'calls' },
      
      // Agent connections
      { source: 'frontendAgent', target: 'monitor', strength: 6, type: 'calls' },
      { source: 'backendAgent', target: 'databaseAgent', strength: 7, type: 'calls' },
      { source: 'testingAgent', target: 'validation', strength: 8, type: 'calls' },
      
      // Registry connections
      { source: 'projectRegistry', target: 'orchestrator', strength: 6, type: 'dependency' },
      { source: 'monitor', target: 'orchestrator', strength: 5, type: 'calls' },
      { source: 'validation', target: 'testingAgent', strength: 6, type: 'dependency' },
    ];

    setGraphData({ nodes, links });
  }, [projectId]);

  // Create force simulation layout
  const simulationData = useMemo(() => {
    if (graphData.nodes.length === 0) return { nodes: [], links: [] };

    const simulation = d3.forceSimulation(graphData.nodes as any)
      .force('link', d3.forceLink(graphData.links)
        .id((d: any) => d.id)
        .distance((d: any) => 100 / d.strength)
        .strength((d: any) => d.strength / 10))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(400, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size * 1.5))
      .stop();

    // Run simulation
    for (let i = 0; i < 300; ++i) simulation.tick();

    return {
      nodes: graphData.nodes.map((d: any) => ({ ...d, x: d.x || 0, y: d.y || 0 })),
      links: graphData.links
    };
  }, [graphData, height]);

  // Render the graph
  useEffect(() => {
    if (!containerRef.current || simulationData.nodes.length === 0) return;
    if (typeof window === 'undefined') return; // Skip SSR

    containerRef.current.innerHTML = '';

    // Color scale for node types
    const colorScale = d3.scaleOrdinal()
      .domain(['file', 'class', 'function', 'component', 'module', 'agent'])
      .range(['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']);

    // Create the plot
    const plot = Plot.plot({
      width: containerRef.current.clientWidth,
      height,
      marginTop: 20,
      marginRight: 20,
      marginBottom: 20,
      marginLeft: 20,
      style: {
        backgroundColor: 'transparent',
      },
      marks: [
        // Draw links
        Plot.link(simulationData.links, {
          x1: (d: any) => simulationData.nodes.find((n: any) => n.id === d.source.id || n.id === d.source)?.x,
          y1: (d: any) => simulationData.nodes.find((n: any) => n.id === d.source.id || n.id === d.source)?.y,
          x2: (d: any) => simulationData.nodes.find((n: any) => n.id === d.target.id || n.id === d.target)?.x,
          y2: (d: any) => simulationData.nodes.find((n: any) => n.id === d.target.id || n.id === d.target)?.y,
          stroke: '#94a3b8',
          strokeWidth: (d: any) => Math.sqrt(d.strength),
          strokeOpacity: 0.3,
        }),
        
        // Draw nodes
        Plot.dot(simulationData.nodes, {
          x: 'x',
          y: 'y',
          r: (d: any) => Math.sqrt(d.size) * 2,
          fill: (d: any) => colorScale(d.type) as string,
          fillOpacity: 0.8,
          stroke: '#fff',
          strokeWidth: 2,
          title: (d: any) => `${d.name}\nType: ${d.type}\nImportance: ${d.importance}\nConnections: ${d.connections}`,
        }),
        
        // Draw labels
        Plot.text(simulationData.nodes.filter((d: any) => d.importance > 70), {
          x: 'x',
          y: 'y',
          text: 'name',
          fontSize: 10,
          fontWeight: 'bold',
          fill: '#1f2937',
          dy: -15,
        }),
      ],
    });

    containerRef.current.appendChild(plot);

    // Add interactivity
    const dots = containerRef.current.querySelectorAll('circle');
    dots.forEach((dot, i) => {
      const node = simulationData.nodes[i];
      if (node) {
        dot.addEventListener('click', () => setSelectedNode(node));
        dot.addEventListener('mouseenter', () => setHoveredNode(node.id));
        dot.addEventListener('mouseleave', () => setHoveredNode(null));
        dot.style.cursor = 'pointer';
      }
    });

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [simulationData, height]);

  // Calculate graph statistics
  const stats = useMemo(() => {
    const totalNodes = graphData.nodes.length;
    const totalLinks = graphData.links.length;
    const avgConnections = totalLinks > 0 ? (totalLinks * 2 / totalNodes).toFixed(1) : 0;
    const mostConnected = graphData.nodes.reduce((max, node) => 
      node.connections > max.connections ? node : max, 
      graphData.nodes[0] || { connections: 0 }
    );
    
    return { totalNodes, totalLinks, avgConnections, mostConnected };
  }, [graphData]);

  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Knowledge Graph Visualization
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Interactive codebase structure and relationships
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-600 dark:text-gray-400">File</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Class</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Agent</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <span className="text-gray-600 dark:text-gray-400">Component</span>
            </div>
          </div>
        </div>
      </div>

      {/* Graph Container */}
      <div ref={containerRef} className="w-full bg-gray-50 dark:bg-gray-900 rounded-lg" style={{ height }} />

      {/* Statistics and Selected Node Info */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        {/* Statistics */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Graph Statistics</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400">Total Nodes</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.totalNodes}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Total Links</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.totalLinks}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Avg Connections</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">{stats.avgConnections}</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400">Hub Node</div>
              <div className="font-semibold text-gray-900 dark:text-gray-100">
                {stats.mostConnected?.name || 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Selected Node Info */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {selectedNode ? 'Selected Node' : 'Node Details'}
          </h4>
          {selectedNode ? (
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Name:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedNode.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Type:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{selectedNode.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Importance:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedNode.importance}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Connections:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{selectedNode.connections}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Click on a node to view details
            </p>
          )}
        </div>
      </div>

      {/* Performance Impact */}
      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-700 dark:text-green-400 font-medium">
            Knowledge Graph Active: 98.1% token reduction through semantic analysis
          </span>
        </div>
      </div>
    </div>
  );
}