/**
 * MapItOut Connection Layer Component
 * 
 * This component renders SVG connection lines between parent and child nodes.
 * Uses curved paths for visual appeal and proper z-indexing.
 * 
 * Update when: Modifying connection appearance, adding new line styles, or changing rendering logic.
 */

import React from 'react';
import { useMapStore } from '../../stores';
import type { Connection } from '../../types';
import { useVirtualizedConnections } from '../../hooks/use-node-positioning';

interface ConnectionLayerProps {
  width: number;
  height: number;
}

export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({
  width,
  height,
}) => {
  const { nodes } = useMapStore();
  const connections = useVirtualizedConnections();

  const renderConnection = (connection: Connection): string => {
    const fromNode = nodes.get(connection.from);
    const toNode = nodes.get(connection.to);

    if (!fromNode || !toNode) {
      return '';
    }

    // Calculate control points for curved line
    const dx = toNode.x - fromNode.x;
    const dy = toNode.y - fromNode.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Control point offset based on distance
    const offset = Math.min(distance * 0.3, 100);
    
    // Calculate control point
    const controlPointX = fromNode.x + dx * 0.5;
    const controlPointY = fromNode.y + dy * 0.5 + offset;

    // Create curved path
    return `M ${fromNode.x} ${fromNode.y} Q ${controlPointX} ${controlPointY} ${toNode.x} ${toNode.y}`;
  };

  const getConnectionColor = (connection: Connection): string => {
    const fromNode = nodes.get(connection.from);
    const toNode = nodes.get(connection.to);

    if (!fromNode || !toNode) {
      return '#64748b'; // Default color
    }

    // Use parent node's category color for the connection
    const parentNode = fromNode.tier < toNode.tier ? fromNode : toNode;
    const category = parentNode.category;

    // Map category to connection color with reduced opacity
    const colors = {
      0: '#f97316', // Orange
      1: '#ef4444', // Red
      2: '#3b82f6', // Blue
      3: '#10b981', // Green
      4: '#8b5cf6', // Purple
      5: '#f59e0b', // Amber
    };

    return colors[category as keyof typeof colors] || '#64748b';
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ zIndex: 0 }}
    >
      <defs>
        {/* Gradient definitions for connections */}
        <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.8" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.6" />
        </linearGradient>
        
        {/* Arrow marker */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="currentColor"
            opacity="0.8"
          />
        </marker>
      </defs>

      {/* Render all connections */}
      {connections.map((connection, index) => {
        const pathData = renderConnection(connection);
        const color = getConnectionColor(connection);

        if (!pathData) return null;

        return (
          <g key={`${connection.from}-${connection.to}-${index}`}>
            {/* Main connection line */}
            <path
              d={pathData}
              stroke={color}
              strokeWidth="2"
              fill="none"
              opacity="0.8"
              className="connection-line"
              markerEnd="url(#arrowhead)"
            />
            
            {/* Glow effect */}
            <path
              d={pathData}
              stroke={color}
              strokeWidth="6"
              fill="none"
              opacity="0.1"
              className="connection-line"
            />
          </g>
        );
      })}
    </svg>
  );
}; 