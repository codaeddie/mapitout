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
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MapState, Node, ViewBox } from '../types';


const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
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
        const isFirstNode = state.nodes.size === 0;
        const parent = state.nodes.get(parentId);

        const newNode: Node = {
          id: nanoid(),
          text,
          x: 0,
          y: 0,
          parentId: isFirstNode ? null : parentId,
          children: [],
          tier: isFirstNode ? 0 : (parent ? parent.tier + 1 : 0),
          category: isFirstNode ? 0 : (parent ? parent.category : 0),
          isEditing: false,
        };

        if (isFirstNode) {
          // Root node logic
          newNode.x = 800;
          newNode.y = 600;
          newNode.tier = 0;
          newNode.parentId = null;
        } else if (parent) {
          // Child node logic
          const childIndex = parent.children.length;
          const tier = parent.tier + 1;
          const maxChildren = tier === 1 ? 8 : 6;
          const angle = (childIndex * 2 * Math.PI) / maxChildren;
          const radius = 200 + (tier - 1) * 150;
          newNode.x = parent.x + Math.cos(angle) * radius;
          newNode.y = parent.y + Math.sin(angle) * radius;
          newNode.angle = angle;
          newNode.radius = radius;
          newNode.tier = tier;
        }

        set((state) => {
          const newNodes = new Map(state.nodes);
          newNodes.set(newNode.id, newNode);

          let updatedRootId = state.rootId;
          // Set rootId only if this is the first node
          if (isFirstNode) {
            updatedRootId = newNode.id;
          }

          // Only update parent's children if parent exists and this is not the first node
          if (parent && !isFirstNode) {
            const updatedParent = { ...parent, children: [...parent.children, newNode.id] };
            newNodes.set(parentId, updatedParent);
          }

          // Update connections only if parent exists and not first node
          const newConnections = (parent && !isFirstNode)
            ? [...state.connections, { from: parentId, to: newNode.id }]
            : state.connections;

          return {
            nodes: newNodes,
            rootId: updatedRootId,
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

      updateNodePosition: (id: string, x: number, y: number) => {
        set((state) => {
          const newNodes = new Map(state.nodes);
          const node = newNodes.get(id);
          if (node) {
            newNodes.set(id, { ...node, x, y });
          }
          return { nodes: newNodes };
        });
      },
    }),
    {
      name: 'mapitout-store',
      storage: createJSONStorage(() => {
        try {
          return window.localStorage;
        } catch (e) {
          console.error('Failed to access localStorage:', e);
          // Fallback to in-memory storage
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
      }),
      partialize: (state) => ({
        nodes: Array.from(state.nodes.entries()),
        rootId: state.rootId,
        viewBox: state.viewBox,
        zoomLevel: state.zoomLevel,
      }),
      merge: (persisted, current) => {
        const { nodes = [], rootId = '', viewBox = { x: 0, y: 0, width: 1600, height: 1200 }, zoomLevel = 1 } = persisted as any;
        return {
          ...current,
          nodes: new Map(nodes),
          rootId,
          viewBox,
          zoomLevel,
        };
      },
    }
  )
);

export default useMapStore; 