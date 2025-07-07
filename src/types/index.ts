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
  nodeType: 'root' | 'hub' | 'leaf' | 'category' | 'parameter' | 'command';
  category: number;        // Color category (0-5)
  isEditing: boolean;      // Text editing state
  layoutHints: {
    manualPosition?: boolean; // User dragged
    angle?: number;          // For radial layouts
    layer?: number;          // For hierarchical layouts
    sticky?: boolean;        // Position locked
    
    // Phase 4: Enhanced layout hints for visual polish
    isRoot?: boolean;        // Root node indicator
    isHub?: boolean;         // Hub node indicator
    isCommandHub?: boolean;  // Command hub indicator
    tierRadius?: number;     // Radius for tier positioning
    tierIndex?: number;      // Index within tier
    totalInTier?: number;    // Total nodes in tier
    spokeIndex?: number;     // Index within spokes
    totalSpokes?: number;    // Total spokes
    distanceFromHub?: number; // Distance from hub
    categoryIndex?: number;  // Index within category
    totalInCategory?: number; // Total nodes in category
    forceSimulated?: boolean; // Force simulation applied
    initialized?: boolean;   // Position initialized
  };
}

export interface ViewBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Connection {
  id: string;
  from: string;            // Source node ID
  to: string;              // Target node ID
  type: 'hierarchy' | 'association' | 'flow' | 'parameter';
  style: 'straight' | 'curved';
}

export interface LayoutEngine {
  type: 'hierarchical' | 'web' | 'snake' | 'command';
  calculatePositions(nodes: Map<string, Node>, connections: Connection[]): void;
}

export interface MapState {
  nodes: Map<string, Node>;      // All nodes in the map
  connections: Connection[];     // All connections between nodes
  rootId: string;                // Root node ID
  selectedId: string | null;     // Currently selected node
  selectedConnectionId: string | null; // Currently selected connection
  layoutType: 'hierarchical' | 'web' | 'snake' | 'command';
  viewBox: ViewBox;              // Canvas viewport
  zoomLevel: number;             // Current zoom level
  
  // Actions
  createNode: (text?: string, nodeType?: string) => void;
  createConnection: (from: string, to: string, type?: string) => void;
  deleteNode: (id: string) => void;
  deleteConnection: (id: string) => void;
  setLayoutType: (type: string) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  selectNode: (id: string) => void;
  selectConnection: (id: string | null) => void;
  setZoom: (level: number) => void;
  setViewBox: (viewBox: ViewBox) => void;
  commitNodePosition: (id: string, x: number, y: number) => void;
  recalculateLayout: () => void;
  resetForDevelopment: () => void;
}

export interface UIState {
  isDragging: boolean;
  dragOffset: { x: number; y: number };
  isPanning: boolean;
  showHelp: boolean;
  exportProgress: number;
  draggedNodeId: string | null;
  dragStartPos: { x: number; y: number } | null;
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