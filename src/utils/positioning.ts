/**
 * MapItOut Node Positioning Utilities
 * 
 * This file provides utilities for calculating node positions, handling collisions,
 * and managing viewport coordinates. Uses layout hints for positioning logic.
 * 
 * Update when: Modifying positioning algorithms, adding collision detection, or changing coordinate systems.
 */

import type { Node } from '../types';

export interface Position {
  x: number;
  y: number;
}

export interface LayoutConfig {
  baseRadius: number;
  tierSpacing: number;
  angleSpread: number;
  minDistance: number;
}

const DEFAULT_CONFIG: LayoutConfig = {
  baseRadius: 200,
  tierSpacing: 150,
  angleSpread: Math.PI / 3, // 60 degrees
  minDistance: 100,
};

/**
 * Calculate position for a new node based on its parent
 */
export function calculateNodePosition(
  node: Node,
  parent: Node | null,
  siblings: Node[],
  config: Partial<LayoutConfig> = {}
): Position {
  const layoutConfig = { ...DEFAULT_CONFIG, ...config };

  if (!parent) {
    // Root node - center of canvas
    return { x: 800, y: 600 };
  }

  // Use layout hints for positioning
  const layer = node.layoutHints?.layer || 1;
  
  if (layer === 1) {
    // Primary categories - circle around root
    const siblingIndex = siblings.findIndex(s => s.id === node.id);
    const totalSiblings = siblings.length;
    const angle = (siblingIndex * 2 * Math.PI) / totalSiblings;
    
    return {
      x: parent.x + Math.cos(angle) * layoutConfig.baseRadius,
      y: parent.y + Math.sin(angle) * layoutConfig.baseRadius,
    };
  }

  // Sub-categories - arc around parent
  const siblingIndex = siblings.findIndex(s => s.id === node.id);
  const totalSiblings = siblings.length;
  
  // Calculate base angle from parent's position or use layout hints
  let baseAngle = 0;
  
  if (parent.layoutHints?.angle !== undefined) {
    baseAngle = parent.layoutHints.angle;
  } else {
    // Calculate angle based on parent's position relative to center
    baseAngle = Math.atan2(parent.y - 600, parent.x - 800); // Assuming center at 800,600
  }

  // Spread children in an arc
  const angleStep = layoutConfig.angleSpread / Math.max(1, totalSiblings - 1);
  const nodeAngle = baseAngle - layoutConfig.angleSpread / 2 + (siblingIndex * angleStep);

  return {
    x: parent.x + Math.cos(nodeAngle) * layoutConfig.tierSpacing,
    y: parent.y + Math.sin(nodeAngle) * layoutConfig.tierSpacing,
  };
}

/**
 * Check if two nodes are too close to each other
 */
export function checkCollision(node1: Node, node2: Node, minDistance: number = 100): boolean {
  const distance = Math.sqrt(
    Math.pow(node1.x - node2.x, 2) + Math.pow(node1.y - node2.y, 2)
  );
  return distance < minDistance;
}

/**
 * Resolve collisions by adjusting node positions
 */
export function resolveCollisions(nodes: Node[], config: Partial<LayoutConfig> = {}): Node[] {
  const layoutConfig = { ...DEFAULT_CONFIG, ...config };
  const updatedNodes = [...nodes];
  let hasCollisions = true;
  let iterations = 0;
  const maxIterations = 10;

  while (hasCollisions && iterations < maxIterations) {
    hasCollisions = false;
    iterations++;

    for (let i = 0; i < updatedNodes.length; i++) {
      for (let j = i + 1; j < updatedNodes.length; j++) {
        const node1 = updatedNodes[i];
        const node2 = updatedNodes[j];

        if (checkCollision(node1, node2, layoutConfig.minDistance)) {
          hasCollisions = true;
          
          // Move nodes apart
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0) {
            const moveDistance = (layoutConfig.minDistance - distance) / 2;
            const moveX = (dx / distance) * moveDistance;
            const moveY = (dy / distance) * moveDistance;

            updatedNodes[i] = { ...node1, x: node1.x - moveX, y: node1.y - moveY };
            updatedNodes[j] = { ...node2, x: node2.x + moveX, y: node2.y + moveY };
          }
        }
      }
    }
  }

  return updatedNodes;
}

/**
 * Snap position to grid
 */
export function snapToGrid(position: Position, gridSize: number = 20): Position {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

/**
 * Calculate optimal viewport to fit all nodes
 */
export function calculateViewport(nodes: Node[], padding: number = 100): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 1600, height: 1200 };
  }

  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + 2 * padding,
    height: maxY - minY + 2 * padding,
  };
}

/**
 * Convert screen coordinates to canvas coordinates
 */
export function screenToCanvas(
  screenPos: Position,
  viewport: { x: number; y: number; width: number; height: number },
  containerSize: { width: number; height: number },
  zoomLevel: number = 1
): Position {
  const scaleX = viewport.width / containerSize.width;
  const scaleY = viewport.height / containerSize.height;
  const scale = Math.min(scaleX, scaleY) / zoomLevel;

  return {
    x: viewport.x + screenPos.x * scale,
    y: viewport.y + screenPos.y * scale,
  };
}

/**
 * Convert canvas coordinates to screen coordinates
 */
export function canvasToScreen(
  canvasPos: Position,
  viewport: { x: number; y: number; width: number; height: number },
  containerSize: { width: number; height: number },
  zoomLevel: number = 1
): Position {
  const scaleX = viewport.width / containerSize.width;
  const scaleY = viewport.height / containerSize.height;
  const scale = Math.min(scaleX, scaleY) / zoomLevel;

  return {
    x: (canvasPos.x - viewport.x) / scale,
    y: (canvasPos.y - viewport.y) / scale,
  };
} 