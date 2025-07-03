/**
 * MapItOut Debounced Layout Calculation Hook
 *
 * Debounces expensive layout recalculations to avoid excessive computation
 * when nodes are added, moved, or updated rapidly.
 *
 * Update when: Changing debounce timing or layout recalculation logic.
 */

import { useEffect, useState } from 'react';
import type { Node } from '@/types';

export function useDebouncedNodes(nodes: Map<string, Node>, delay = 100) {
  const [debouncedNodes, setDebouncedNodes] = useState(nodes);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedNodes(nodes);
    }, delay);
    return () => clearTimeout(timer);
  }, [nodes, delay]);

  return debouncedNodes;
} 