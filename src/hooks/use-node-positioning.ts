/**
 * MapItOut Node Positioning & Virtualization Hook
 *
 * Provides virtualization for large node counts by only returning nodes and connections
 * that are visible in the current viewport (with a buffer).
 *
 * Update when: Changing viewport logic, buffer size, or node visibility rules.
 */

import { useMemo } from 'react';
import { useMapStore } from '../stores';
import type { Node, ViewBox } from '../types';

const BUFFER = 100; // px outside viewport

function isNodeInViewport(node: Node, viewBox: ViewBox): boolean {
  return (
    node.x >= viewBox.x - BUFFER &&
    node.x <= viewBox.x + viewBox.width + BUFFER &&
    node.y >= viewBox.y - BUFFER &&
    node.y <= viewBox.y + viewBox.height + BUFFER
  );
}

export function useVirtualizedNodes() {
  const { nodes, viewBox } = useMapStore();

  return useMemo(() => {
    const visibleNodes = new Map<string, Node>();
    nodes.forEach((node, id) => {
      if (isNodeInViewport(node, viewBox)) {
        visibleNodes.set(id, node);
      }
    });
    return visibleNodes;
  }, [nodes, viewBox]);
}

export function useVirtualizedConnections() {
  const { connections } = useMapStore();
  const visibleNodes = useVirtualizedNodes();

  return useMemo(() => {
    return connections.filter(
      (conn) => visibleNodes.has(conn.from) || visibleNodes.has(conn.to)
    );
  }, [connections, visibleNodes]);
} 