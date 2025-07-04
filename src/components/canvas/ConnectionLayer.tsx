/**
 * ConnectionLayer.tsx
 *
 * Renders a <canvas> for drawing Bezier curve connections between parent and child nodes in MapItOut.
 * Supports high-DPI (devicePixelRatio) and only renders visible connections (viewport culling).
 *
 * Update when: Modifying connection rendering, optimizing performance, or changing layout logic.
 */

import React, { useRef, useEffect } from 'react';
import type { Connection, Node, ViewBox } from '../../types';

interface ConnectionLayerProps {
  connections: Connection[];
  nodes: Map<string, Node>;
  viewBox: ViewBox;
  width?: number;
  height?: number;
}

const isConnectionVisible = (from: Node, to: Node, viewBox: ViewBox, buffer = 100) => {
  // Simple culling: if either endpoint is in/near the viewport, draw it
  const inView = (n: Node) => (
    n.x >= viewBox.x - buffer &&
    n.x <= viewBox.x + viewBox.width + buffer &&
    n.y >= viewBox.y - buffer &&
    n.y <= viewBox.y + viewBox.height + buffer
  );
  return inView(from) || inView(to);
};

export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({
  connections,
  nodes,
  viewBox,
  width = 1600,
  height = 1200,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(-viewBox.x, -viewBox.y); // Pan to viewBox

    connections.forEach(({ from, to }) => {
      const fromNode = nodes.get(from);
      const toNode = nodes.get(to);
      if (!fromNode || !toNode) return;
      if (!isConnectionVisible(fromNode, toNode, viewBox)) return;

      // Bezier curve: control point at midpoint
      const cpX = (fromNode.x + toNode.x) / 2;
      const cpY = (fromNode.y + toNode.y) / 2;
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.quadraticCurveTo(cpX, cpY, toNode.x, toNode.y);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    ctx.restore();
  }, [connections, nodes, viewBox, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}; 