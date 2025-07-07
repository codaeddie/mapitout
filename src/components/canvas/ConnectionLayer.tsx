/**
 * MapItOut Connection Layer Component
 * 
 * This component renders connection lines between nodes and visual grouping backgrounds.
 * Uses HTML5 Canvas for efficient rendering of connections and category groupings.
 * Enhanced with connection selection, hit testing, and visual feedback for Phase 4.
 * 
 * Update when: Modifying connection rendering, adding new visual effects, or changing grouping logic.
 */

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useMapStore } from '../../stores';
import { NODE_COLORS } from '../../types';
import type { Connection } from '../../types';

interface ConnectionLayerProps {
  width: number;
  height: number;
  zoomLevel: number;
  viewBox: { x: number; y: number; width: number; height: number };
}

export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({
  width,
  height,
  zoomLevel,
  viewBox,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { nodes, connections, selectConnection, selectedConnectionId } = useMapStore();

  // Polyfill for roundRect if not available
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Polyfill roundRect method if it doesn't exist
    if (!('roundRect' in ctx)) {
      (ctx as CanvasRenderingContext2D & { roundRect: (x: number, y: number, width: number, height: number, radius: number) => void }).roundRect = function(x: number, y: number, width: number, height: number, radius: number) {
        this.beginPath();
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
      };
    }
  }, []);

  // Group nodes by category for visual grouping
  const categoryGroups = useMemo(() => {
    const groups = new Map<number, Array<{ id: string; x: number; y: number; layer: number }>>();
    
    nodes.forEach((node) => {
      if (!groups.has(node.category)) {
        groups.set(node.category, []);
      }
      groups.get(node.category)!.push({
        id: node.id,
        x: node.x,
        y: node.y,
        layer: node.layoutHints.layer || 0,
      });
    });
    
    return groups;
  }, [nodes]);

  // Get connection style based on type and selection state
  const getConnectionStyle = (connection: Connection) => {
    const isSelected = selectedConnectionId === connection.id;
    const baseStyle = {
      hierarchy: { color: '#64748b', width: 2 },
      association: { color: '#f97316', width: 2 },
      flow: { color: '#3b82f6', width: 3 },
      parameter: { color: '#10b981', width: 1 },
    }[connection.type];
    
    return {
      ...baseStyle,
      width: isSelected ? baseStyle.width + 2 : baseStyle.width,
      opacity: isSelected ? 1 : 0.8,
      color: isSelected ? '#fbbf24' : baseStyle.color, // Highlight selected connections
    };
  };

  // Draw connection based on style with enhanced visual effects
  const drawConnection = (
    ctx: CanvasRenderingContext2D,
    connection: Connection,
    fromNode: import('../../types').Node,
    toNode: import('../../types').Node
  ) => {
    const style = getConnectionStyle(connection);
    
    ctx.strokeStyle = style.color;
    ctx.lineWidth = style.width;
    ctx.globalAlpha = style.opacity;
    
    // Add shadow for selected connections
    if (selectedConnectionId === connection.id) {
      ctx.shadowColor = style.color;
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    }
    
    if (connection.style === 'curved') {
      // Draw curved connection with enhanced control points
      const dx = toNode.x - fromNode.x;
      const dy = toNode.y - fromNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Adaptive control point based on distance
      const controlOffset = Math.min(distance * 0.3, 100);
      const controlPointX = (fromNode.x + toNode.x) / 2 + (dy / distance) * controlOffset;
      const controlPointY = (fromNode.y + toNode.y) / 2 - (dx / distance) * controlOffset;
      
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.quadraticCurveTo(controlPointX, controlPointY, toNode.x, toNode.y);
      ctx.stroke();
      
      // Add arrowhead for flow connections
      if (connection.type === 'flow') {
        drawArrowhead(ctx, fromNode, toNode, style);
      }
    } else {
      // Draw straight connection
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();
    }
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  };

  // Enhanced arrowhead drawing with better positioning
  const drawArrowhead = (
    ctx: CanvasRenderingContext2D,
    fromNode: import('../../types').Node,
    toNode: import('../../types').Node,
    style: { width: number; color: string }
  ) => {
    const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
    const arrowLength = 15;
    const arrowAngle = 0.5;
    
    // Position arrowhead slightly before the target node
    const offset = 20;
    const arrowX = toNode.x - offset * Math.cos(angle);
    const arrowY = toNode.y - offset * Math.sin(angle);
    
    const x1 = arrowX - arrowLength * Math.cos(angle - arrowAngle);
    const y1 = arrowY - arrowLength * Math.sin(angle - arrowAngle);
    const x2 = arrowX - arrowLength * Math.cos(angle + arrowAngle);
    const y2 = arrowY - arrowLength * Math.sin(angle + arrowAngle);
    
    ctx.lineWidth = style.width;
    ctx.beginPath();
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(x1, y1);
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  };

  // Connection hit testing
  const handleCanvasClick = useCallback((event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left + viewBox.x) / zoomLevel;
    const y = (event.clientY - rect.top + viewBox.y) / zoomLevel;

    // Find clicked connection
    const clickedConnection = findConnectionAt(x, y, connections, nodes);
    
    if (clickedConnection) {
      selectConnection(clickedConnection.id);
    } else {
      selectConnection(null);
    }
  }, [connections, nodes, viewBox, zoomLevel, selectConnection]);

  // Find connection at point
  const findConnectionAt = (x: number, y: number, connections: Connection[], nodes: Map<string, import('../../types').Node>): Connection | null => {
    const hitTolerance = 8 / zoomLevel; // Adjust tolerance based on zoom
    
    for (const connection of connections) {
      const fromNode = nodes.get(connection.from);
      const toNode = nodes.get(connection.to);
      
      if (!fromNode || !toNode) continue;
      
      const distance = distanceToLine(x, y, fromNode.x, fromNode.y, toNode.x, toNode.y);
      
      if (distance < hitTolerance) {
        return connection;
      }
    }
    
    return null;
  };

  // Calculate distance from point to line
  const distanceToLine = (x: number, y: number, x1: number, y1: number, x2: number, y2: number): number => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }
    
    let xx, yy;
    
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    
    const dx = x - xx;
    const dy = y - yy;
    
    return Math.sqrt(dx * dx + dy * dy);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply zoom and pan transformations
    ctx.save();
    ctx.translate(-viewBox.x, -viewBox.y);
    ctx.scale(zoomLevel, zoomLevel);

    // Draw category grouping backgrounds with enhanced styling
    categoryGroups.forEach((groupNodes, category) => {
      if (groupNodes.length < 2) return; // Only group if multiple nodes

      const color = NODE_COLORS[category as keyof typeof NODE_COLORS] || NODE_COLORS[0];
      
      // Calculate group bounds
      const xs = groupNodes.map(n => n.x);
      const ys = groupNodes.map(n => n.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      
      // Add padding to group bounds
      const padding = 80; // Increased padding for better visual separation
      const groupX = minX - padding;
      const groupY = minY - padding;
      const groupWidth = maxX - minX + 2 * padding;
      const groupHeight = maxY - minY + 2 * padding;
      
      // Only draw if group is large enough and not just a single layer
      const layers = new Set(groupNodes.map(n => n.layer));
      if (groupWidth > 120 && groupHeight > 120 && layers.size > 1) {
        // Draw group background with enhanced styling
        ctx.save();
        ctx.globalAlpha = 0.08; // Slightly more visible
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(groupX, groupY, groupWidth, groupHeight, 25);
        ctx.fill();
        
        // Draw group border with enhanced styling
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
    });

    // Draw connection lines with enhanced rendering
    connections.forEach((connection) => {
      const fromNode = nodes.get(connection.from);
      const toNode = nodes.get(connection.to);

      if (!fromNode || !toNode) return;

      drawConnection(ctx, connection, fromNode, toNode);
    });

    ctx.restore();
  }, [connections, nodes, width, height, zoomLevel, viewBox, categoryGroups, selectedConnectionId]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-auto cursor-pointer"
      style={{ zIndex: 0 }}
      onClick={handleCanvasClick}
    />
  );
}; 