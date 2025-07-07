/**
 * MapItOut Layout Engines
 *
 * This module provides two layout algorithms:
 * - Center Layout: Mind map style, root in center, children alternate left/right
 * - Top Layout: Hierarchical tree, root at top, children in rows below
 *
 * Update when: Adding new layouts or modifying layout logic.
 */

import type { Node, Position, LayoutType } from '../types';

// Layout constants
const CANVAS_CENTER_X = 800;
const CANVAS_CENTER_Y = 400;
const BASE_TIER_DISTANCE = 250;
const TIER_DISTANCE_INCREMENT = 50;
const SIBLING_VERTICAL_SPACING = 80;
const TIER_VERTICAL_SPACING = 120;
const MIN_NODE_SPACING = 60;

function getNodeWidth(text: string): number {
  return Math.max(100, text.length * 8);
}

function getNodeHeight(): number {
  return 40;
}

/**
 * Center Layout (Mind Map Style)
 * - Root at center
 * - Tier 1: Alternate left/right
 * - Tier 2+: Branch based on parent position
 */
export function calculateCenterLayout(nodes: Map<string, Node>): Map<string, Position> {
  const positions = new Map<string, Position>();
  if (nodes.size === 0) return positions;

  // Find root (no parent)
  const rootNode = Array.from(nodes.values()).find(n => n.parent === null);
  if (!rootNode) return positions;

  // Place root at center
  positions.set(rootNode.id, {
    x: CANVAS_CENTER_X,
    y: CANVAS_CENTER_Y,
    width: getNodeWidth(rootNode.text),
    height: getNodeHeight(),
  });

  // Recursively position children
  function positionTier(parentId: string, tier: number, side: 'left' | 'right' | null) {
    const parent = nodes.get(parentId);
    if (!parent) return;
    const children = parent.children.map(id => nodes.get(id)).filter(Boolean) as Node[];
    if (children.length === 0) return;

    // Alternate left/right for tier 1, inherit for deeper tiers
    let currentSide = side;
    if (tier === 1) {
      // Alternate left/right
      children.forEach((child, i) => {
        currentSide = i % 2 === 0 ? 'left' : 'right';
        const parentPos = positions.get(parentId)!;
        const x = parentPos.x + (currentSide === 'left' ? -BASE_TIER_DISTANCE : BASE_TIER_DISTANCE);
        const y = parentPos.y + (i * SIBLING_VERTICAL_SPACING) - ((children.length - 1) * SIBLING_VERTICAL_SPACING / 2);
        positions.set(child.id, {
          x,
          y,
          width: getNodeWidth(child.text),
          height: getNodeHeight(),
        });
        positionTier(child.id, tier + 1, currentSide);
      });
    } else {
      // Inherit side from parent
      children.forEach((child, i) => {
        const parentPos = positions.get(parentId)!;
        const x = parentPos.x + (currentSide === 'left' ? -(BASE_TIER_DISTANCE + (tier - 1) * TIER_DISTANCE_INCREMENT) : (BASE_TIER_DISTANCE + (tier - 1) * TIER_DISTANCE_INCREMENT));
        const y = parentPos.y + (i * SIBLING_VERTICAL_SPACING) - ((children.length - 1) * SIBLING_VERTICAL_SPACING / 2);
        positions.set(child.id, {
          x,
          y,
          width: getNodeWidth(child.text),
          height: getNodeHeight(),
        });
        positionTier(child.id, tier + 1, currentSide);
      });
    }
  }

  positionTier(rootNode.id, 1, null);
  return positions;
}

/**
 * Top Layout (Hierarchical Tree)
 * - Root at top center
 * - Each tier is a horizontal row
 * - Even distribution within tiers
 */
export function calculateTopLayout(nodes: Map<string, Node>): Map<string, Position> {
  const positions = new Map<string, Position>();
  if (nodes.size === 0) return positions;

  // Find root (no parent)
  const rootNode = Array.from(nodes.values()).find(n => n.parent === null);
  if (!rootNode) return positions;

  // Build depth map
  const depthMap = new Map<string, number>();
  function assignDepth(node: Node, depth: number) {
    depthMap.set(node.id, depth);
    node.children.forEach(childId => {
      const child = nodes.get(childId);
      if (child) assignDepth(child, depth + 1);
    });
  }
  assignDepth(rootNode, 0);

  // Group nodes by depth
  const maxDepth = Math.max(...depthMap.values());
  for (let depth = 0; depth <= maxDepth; depth++) {
    const tierNodes = Array.from(nodes.values()).filter(n => depthMap.get(n.id) === depth);
    if (tierNodes.length === 0) continue;
    const y = 50 + (depth * TIER_VERTICAL_SPACING);
    const totalWidth = tierNodes.reduce((sum, node) => sum + getNodeWidth(node.text), 0) + (tierNodes.length - 1) * MIN_NODE_SPACING;
    let x = CANVAS_CENTER_X - (totalWidth / 2);
    tierNodes.forEach(node => {
      const width = getNodeWidth(node.text);
      positions.set(node.id, {
        x: x + (width / 2),
        y,
        width,
        height: getNodeHeight(),
      });
      x += width + MIN_NODE_SPACING;
    });
  }

  return positions;
}

/**
 * Layout manager: chooses the correct layout based on type
 */
export function calculateLayout(nodes: Map<string, Node>, layoutType: LayoutType): Map<string, Position> {
  if (layoutType === 'center') return calculateCenterLayout(nodes);
  if (layoutType === 'top') return calculateTopLayout(nodes);
  return new Map();
} 