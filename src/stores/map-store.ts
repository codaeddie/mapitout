/**
 * MapItOut Main Store
 * 
 * This file contains the primary Zustand store for managing the mind map state.
 * Handles node creation, updates, deletion, selection, and viewport management.
 * 
 * Update when: Adding new state properties, modifying node operations, or changing store structure.
 */

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { MapState, Node, ViewBox } from '../types';


const useMapStore = create<MapState>((set, get) => ({
  // Core state
  nodes: new Map(),
  rootId: '',
  selectedId: null,
  viewBox: { x: 0, y: 0, width: 1600, height: 1200 },
  zoomLevel: 1,
  connections: [],

  // Actions
  createNode: (parentId: string, text: string = 'New Node') => {
    const state = get();
    const parent = state.nodes.get(parentId);
    
    const newNode: Node = {
      id: nanoid(),
      text,
      x: 0,
      y: 0,
      parentId,
      children: [],
      tier: parent ? parent.tier + 1 : 0,
      category: parent ? parent.category : 0,
      isEditing: false,
    };

    // Calculate position based on parent
    if (parent) {
      const childCount = parent.children.length;
      const angle = (childCount * 2 * Math.PI) / (parent.children.length + 1);
      const radius = 200;
      
      newNode.x = parent.x + Math.cos(angle) * radius;
      newNode.y = parent.y + Math.sin(angle) * radius;
      newNode.angle = angle;
      newNode.radius = radius;
    } else {
      // Root node
      newNode.x = 800;
      newNode.y = 600;
      newNode.tier = 0;
      newNode.category = 0;
    }

    set((state) => {
      const newNodes = new Map(state.nodes);
      newNodes.set(newNode.id, newNode);

      // Update parent's children array
      if (parent) {
        const updatedParent = { ...parent, children: [...parent.children, newNode.id] };
        newNodes.set(parentId, updatedParent);
      }

      // Update connections
      const newConnections = parent 
        ? [...state.connections, { from: parentId, to: newNode.id }]
        : state.connections;

      // --- Collision resolution can be integrated here ---
      // const resolvedNodes = resolveCollisions(Array.from(newNodes.values()));
      // (Apply resolved positions back to newNodes if desired)

      return {
        nodes: newNodes,
        rootId: parent ? state.rootId : newNode.id,
        selectedId: newNode.id,
        connections: newConnections,
      };
    });
  },

  updateNode: (id: string, updates: Partial<Node>) => {
    set((state) => {
      const newNodes = new Map(state.nodes);
      const node = newNodes.get(id);
      
      if (node) {
        newNodes.set(id, { ...node, ...updates });
      }

      return { nodes: newNodes };
    });
  },

  deleteNode: (id: string) => {
    const state = get();
    const node = state.nodes.get(id);
    
    if (!node || node.id === state.rootId) return;

    // Recursively delete all children
    const nodesToDelete = new Set<string>();
    const collectNodesToDelete = (nodeId: string) => {
      nodesToDelete.add(nodeId);
      const node = state.nodes.get(nodeId);
      if (node) {
        node.children.forEach(collectNodesToDelete);
      }
    };
    collectNodesToDelete(id);

    set((state) => {
      const newNodes = new Map(state.nodes);
      const newConnections = state.connections.filter(
        conn => !nodesToDelete.has(conn.from) && !nodesToDelete.has(conn.to)
      );

      // Remove nodes
      nodesToDelete.forEach(nodeId => newNodes.delete(nodeId));

      // Update parent's children array
      if (node.parentId) {
        const parent = newNodes.get(node.parentId);
        if (parent) {
          const updatedParent = {
            ...parent,
            children: parent.children.filter(childId => !nodesToDelete.has(childId))
          };
          newNodes.set(node.parentId, updatedParent);
        }
      }

      return {
        nodes: newNodes,
        selectedId: state.selectedId === id ? null : state.selectedId,
        connections: newConnections,
      };
    });
  },

  selectNode: (id: string) => {
    set({ selectedId: id });
  },

  setZoom: (level: number) => {
    set({ zoomLevel: Math.max(0.1, Math.min(3, level)) });
  },

  setViewBox: (viewBox: ViewBox) => {
    set({ viewBox });
  },
}));

export default useMapStore; 