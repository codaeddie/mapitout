/**
 * MapItOut Core Types
 * 
 * This file defines the core TypeScript interfaces for the MapItOut mind mapping tool.
 * These types establish the data structure for nodes, connections, and application state.
 * 
 * Update when: Adding new node properties, modifying state structure, or changing data relationships.
 */

export interface Node {
  id: string;              // nanoid() generated unique identifier
  text: string;            // User-visible text content
  x: number;               // Canvas X coordinate
  y: number;               // Canvas Y coordinate
  parentId: string | null; // null for root node
  children: string[];      // Array of child node IDs
  tier: number;            // Depth level (0 = root)
  category: number;        // Color category (0-5)
  isEditing: boolean;      // Text editing state
  angle?: number;          // Radial position angle (for layout)
  radius?: number;         // Distance from parent (for layout)
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Connection {
  from: string;            // Source node ID
  to: string;              // Target node ID
}

export interface MapState {
  nodes: Map<string, Node>;      // All nodes in the map
  rootId: string;                // Root node ID
  selectedId: string | null;     // Currently selected node
  viewBox: ViewBox;              // Canvas viewport
  zoomLevel: number;             // Current zoom level
  connections: Connection[];     // All connections between nodes
  
  // Actions
  createNode: (parentId: string, text?: string) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string) => void;
  setZoom: (level: number) => void;
  setViewBox: (viewBox: ViewBox) => void;
}

export interface UIState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  isPanning: boolean;
  showHelp: boolean;
  exportProgress: number;
}

export type NodeCategory = 0 | 1 | 2 | 3 | 4 | 5;

export const NODE_COLORS: Record<NodeCategory, string> = {
  0: '#f97316', // Orange - Central/Primary
  1: '#ef4444', // Red - High Priority
  2: '#3b82f6', // Blue - Secondary
  3: '#10b981', // Green - Supporting
  4: '#8b5cf6', // Purple - Specialized
  5: '#f59e0b', // Amber - Additional
} as const;

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: string;
  description: string;
} 