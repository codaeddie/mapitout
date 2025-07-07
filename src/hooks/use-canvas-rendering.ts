/**
 * MapItOut Canvas Rendering Performance Hooks
 *
 * Provides performance optimizations for canvas rendering, including
 * debounced layout calculations, virtualized rendering, and memory management.
 * Enhanced with Phase 4 optimizations for large node counts.
 *
 * Update when: Changing debounce timing, layout recalculation logic, or performance optimizations.
 */

import { useEffect, useState, useMemo, useCallback } from 'react';
import type { Node, Connection } from '@/types';

// Enhanced debounced nodes with better performance
export function useDebouncedNodes(nodes: Map<string, Node>, delay = 150) {
  const [debouncedNodes, setDebouncedNodes] = useState(nodes);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNodes(nodes);
    }, delay);
    return () => clearTimeout(timer);
  }, [nodes, delay]);

  return debouncedNodes;
}

// Virtualized rendering for large node counts (canvas-specific)
export function useCanvasVirtualizedNodes(nodes: Map<string, Node>, viewBox: { x: number; y: number; width: number; height: number }, zoomLevel: number) {
  return useMemo(() => {
    const visibleNodes = new Map<string, Node>();
    const margin = 200; // Extra margin for smooth scrolling
    
    const minX = viewBox.x - margin;
    const maxX = viewBox.x + viewBox.width + margin;
    const minY = viewBox.y - margin;
    const maxY = viewBox.y + viewBox.height + margin;
    
    for (const [id, node] of nodes) {
      if (node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY) {
        visibleNodes.set(id, node);
      }
    }
    
    return visibleNodes;
  }, [nodes, viewBox, zoomLevel]);
}

// Virtualized connections for performance (canvas-specific)
export function useCanvasVirtualizedConnections(connections: Connection[], visibleNodes: Map<string, Node>) {
  return useMemo(() => {
    return connections.filter(
      (conn) => visibleNodes.has(conn.from) || visibleNodes.has(conn.to)
    );
  }, [connections, visibleNodes]);
}

// Memory management for large datasets
export function useMemoryOptimization(nodes: Map<string, Node>, connections: Connection[]) {
  const [optimizedNodes, setOptimizedNodes] = useState(nodes);
  const [optimizedConnections, setOptimizedConnections] = useState(connections);
  
  useEffect(() => {
    // Batch updates to reduce re-renders
    const timer = setTimeout(() => {
      setOptimizedNodes(nodes);
      setOptimizedConnections(connections);
    }, 50);
    
    return () => clearTimeout(timer);
  }, [nodes, connections]);
  
  return { optimizedNodes, optimizedConnections };
}

// Layout calculation optimization
export function useLayoutOptimization() {
  const [isCalculating, setIsCalculating] = useState(false);
  const [lastCalculation, setLastCalculation] = useState(0);
  
  const debouncedCalculation = useCallback((callback: () => void, delay = 200) => {
    const now = Date.now();
    
    if (now - lastCalculation < delay) {
      return; // Skip if too soon
    }
    
    setIsCalculating(true);
    setLastCalculation(now);
    
    // Use requestAnimationFrame for smooth calculations
    requestAnimationFrame(() => {
      callback();
      setIsCalculating(false);
    });
  }, [lastCalculation]);
  
  return { isCalculating, debouncedCalculation };
}

// Canvas performance monitoring
export function useCanvasPerformance() {
  const [fps, setFps] = useState(60);
  const [frameCount, setFrameCount] = useState(0);
  const [lastTime, setLastTime] = useState(0);
  
  useEffect(() => {
    let animationId: number;
    
    const measurePerformance = (currentTime: number) => {
      setFrameCount(prev => prev + 1);
      
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (currentTime - lastTime)));
        setFrameCount(0);
        setLastTime(currentTime);
      }
      
      animationId = requestAnimationFrame(measurePerformance);
    };
    
    animationId = requestAnimationFrame(measurePerformance);
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [fps, frameCount, lastTime]);
  
  return { fps };
}

// Connection rendering optimization
export function useConnectionOptimization(connections: Connection[]) {
  const [optimizedConnections, setOptimizedConnections] = useState(connections);
  
  useEffect(() => {
    // Group connections by type for batch rendering
    connections.reduce((acc, conn) => {
      if (!acc[conn.type]) {
        acc[conn.type] = [];
      }
      acc[conn.type].push(conn);
      return acc;
    }, {} as Record<string, Connection[]>);
    
    setOptimizedConnections(connections);
  }, [connections]);
  
  return optimizedConnections;
}

// Node position interpolation for smooth animations
export function usePositionInterpolation(nodes: Map<string, Node>, targetNodes: Map<string, Node>) {
  const [interpolatedNodes, setInterpolatedNodes] = useState(nodes);
  
  useEffect(() => {
    const interpolate = () => {
      const newNodes = new Map<string, Node>();
      
      for (const [id, node] of nodes) {
        const targetNode = targetNodes.get(id);
        if (targetNode) {
          // Smooth interpolation
          const lerpFactor = 0.1;
          newNodes.set(id, {
            ...node,
            x: node.x + (targetNode.x - node.x) * lerpFactor,
            y: node.y + (targetNode.y - node.y) * lerpFactor,
          });
        } else {
          newNodes.set(id, node);
        }
      }
      
      setInterpolatedNodes(newNodes);
    };
    
    const animationId = requestAnimationFrame(interpolate);
    return () => cancelAnimationFrame(animationId);
  }, [nodes, targetNodes]);
  
  return interpolatedNodes;
} 