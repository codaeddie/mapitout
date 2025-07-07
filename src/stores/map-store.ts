/**
 * MapItOut Main Store - Simplified
 * 
 * This file contains the primary Zustand store for managing the tree map state.
 * Simplified to focus on parent/child relationships with calculated positions.
 * 
 * Update when: Adding new state properties, modifying node operations, or changing store structure.
 */

import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MapState, Node } from '../types';

const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      // Initial State
      nodes: new Map(),
      selectedId: null,
      layoutType: 'center',

      // Actions
      createNode: (parentId: string, text: string = 'New Node') => {
        const newNode: Node = {
          id: nanoid(),
          text,
          children: [],
          parent: parentId || null,
          metadata: {
            created: Date.now(),
            modified: Date.now(),
            collapsed: false,
          },
        };

        set(state => {
          const newNodes = new Map(state.nodes);
          newNodes.set(newNode.id, newNode);
          
          // Update parent's children array if parent exists
          if (parentId) {
            const parent = newNodes.get(parentId);
            if (parent) {
              parent.children.push(newNode.id);
              parent.metadata.modified = Date.now();
            }
          }
          
          return { 
            nodes: newNodes, 
            selectedId: newNode.id 
          };
        });
      },

      updateNode: (id: string, updates: Partial<Node>) => {
        set((state) => {
          const newNodes = new Map(state.nodes);
          const node = newNodes.get(id);
          
          if (node) {
            // Don't allow updating id, children, or parent directly
            const { id: _, children: __, parent: ___, ...safeUpdates } = updates;
            Object.assign(node, safeUpdates);
            node.metadata.modified = Date.now();
          }

          return { nodes: newNodes };
        });
      },

      selectNode: (id: string | null) => {
        set({ selectedId: id });
      },

      setLayoutType: (type: 'center' | 'top') => {
        set({ layoutType: type });
      },
    }),
    {
      name: 'mapitout-store',
      storage: createJSONStorage(() => localStorage),
      // Persist nodes as array of entries
      partialize: (state) => ({
        nodes: Array.from(state.nodes.entries()),
        layoutType: state.layoutType,
      }),
      // Always rehydrate nodes as Map, even if old object format is present
      merge: (persisted, current) => {
        let nodesArr = [];
        const persistedObj = persisted as Record<string, any>;
        if (Array.isArray(persistedObj.nodes)) {
          nodesArr = persistedObj.nodes;
        } else if (persistedObj.nodes && typeof persistedObj.nodes === 'object') {
          // Handle legacy object format
          nodesArr = Object.entries(persistedObj.nodes);
        }
        return {
          nodes: new Map(nodesArr),
          selectedId: persistedObj.selectedId ?? current.selectedId,
          layoutType: persistedObj.layoutType ?? current.layoutType,
          createNode: current.createNode,
          updateNode: current.updateNode,
          selectNode: current.selectNode,
          setLayoutType: current.setLayoutType,
        };
      },
    }
  )
);

export { useMapStore }; 