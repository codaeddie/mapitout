/**
 * MapItOut Core Types - Simplified
 * 
 * This file defines the core TypeScript interfaces for the MapItOut tree mapping tool.
 * Simplified to focus on parent/child relationships with calculated positions.
 * 
 * Update when: Adding new node properties, modifying state structure, or changing data relationships.
 */

export interface Node {
  id: string;              // nanoid() generated unique identifier
  text: string;            // User-visible text content
  children: string[];      // Child node IDs
  parent: string | null;   // Parent node ID (null for root)
  metadata: {
    created: number;       // Creation timestamp
    modified: number;      // Last modification timestamp
    collapsed: boolean;    // Whether node is collapsed
  };
}

export interface Position {
  x: number;              // Calculated X coordinate
  y: number;              // Calculated Y coordinate
  width: number;          // Text width
  height: number;         // Node height
}

export interface LayoutEngine {
  calculatePositions(nodes: Map<string, Node>): Map<string, Position>;
}

export interface MapState {
  nodes: Map<string, Node>;      // All nodes in the map
  selectedId: string | null;     // Currently selected node
  layoutType: 'center' | 'top';  // Only two layout types
  
  // Actions
  createNode: (parentId: string, text?: string) => void;
  updateNode: (id: string, updates: Partial<Node>) => void;
  selectNode: (id: string | null) => void;
  setLayoutType: (type: 'center' | 'top') => void;
}

export interface UIState {
  isEditing: boolean;     // Text editing state
  editingNodeId: string | null; // Node being edited
}

export type LayoutType = 'center' | 'top'; 