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
import type { MapState, Node, ViewBox, Connection } from '../types';
import { layoutEngines, getConnectionTypeForLayout } from '../utils/layout-engines';

// Development mode state management
const isDevelopment = import.meta.env.DEV;

const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      // Initial State
      nodes: new Map(),
      connections: [],
      rootId: '',
      selectedId: null,
      selectedConnectionId: null, // Phase 4: Connection selection
      layoutType: 'hierarchical',
      viewBox: { x: 0, y: 0, width: 1600, height: 1200 },
      zoomLevel: 1,

      // Actions
      createNode: (text: string = 'New Node', nodeType: string = 'leaf') => {
        const { nodes, selectedId, layoutType } = get();
        
        const newNode: Node = {
          id: nanoid(),
          text,
          x: 400,
          y: 300,
          nodeType: nodeType as Node['nodeType'],
          category: 0,
          isEditing: true,
          layoutHints: {},
        };

        // If this is the first node, make it root and center it
        const isFirstNode = nodes.size === 0;
        if (isFirstNode) {
          newNode.nodeType = 'root';
          newNode.x = 800;
          newNode.y = 400;
          newNode.isEditing = false;
        }

        set(state => {
          const newNodes = new Map(state.nodes);
          newNodes.set(newNode.id, newNode);
          
          const newConnections = [...state.connections];
          let updatedRootId = state.rootId;
          
          // Set rootId if this is the first node
          if (isFirstNode) {
            updatedRootId = newNode.id;
          }
          
          // Auto-connect based on layout type and selection
          if (selectedId && !isFirstNode) {
            const connectionType = getConnectionTypeForLayout(layoutType);
            newConnections.push({
              id: nanoid(),
              from: selectedId,
              to: newNode.id,
              type: connectionType,
              style: connectionType === 'hierarchy' || connectionType === 'flow' ? 'curved' : 'straight',
            });
          }
          
          // Recalculate layout
          const engine = layoutEngines[state.layoutType];
          if (engine) {
            engine.calculatePositions(newNodes, newConnections);
          }
          
          // Auto-center view on first node creation
          if (isFirstNode) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            return {
              nodes: newNodes,
              connections: newConnections,
              rootId: updatedRootId,
              selectedId: newNode.id,
              viewBox: {
                x: newNode.x - viewportWidth / 2,
                y: newNode.y - viewportHeight / 2,
                width: viewportWidth,
                height: viewportHeight,
              },
            };
          }
          
          return {
            nodes: newNodes,
            connections: newConnections,
            rootId: updatedRootId,
            selectedId: newNode.id,
          };
        });
      },

      createConnection: (from: string, to: string, type: string = 'association') => {
        set(state => ({
          connections: [...state.connections, {
            id: nanoid(),
            from,
            to,
            type: type as Connection['type'],
            style: type === 'hierarchy' || type === 'flow' ? 'curved' : 'straight',
          }]
        }));
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

        set((state) => {
          const newNodes = new Map(state.nodes);
          newNodes.delete(id);
          
          // Remove all connections involving this node
          const newConnections = state.connections.filter(c => 
            c.from !== id && c.to !== id
          );
          
          return {
            nodes: newNodes,
            connections: newConnections,
            selectedId: state.selectedId === id ? null : state.selectedId,
          };
        });
      },

      deleteConnection: (connectionId: string) => {
        set(state => ({
          connections: state.connections.filter(c => c.id !== connectionId)
        }));
      },

      selectNode: (id: string) => {
        set({ selectedId: id });
      },

      selectConnection: (id: string | null) => {
        set({ selectedConnectionId: id });
      },

      setLayoutType: (type: string) => {
        set(state => {
          const engine = layoutEngines[type as keyof typeof layoutEngines];
          if (engine) {
            // Recalculate positions with new layout
            const newNodes = new Map(state.nodes);
            engine.calculatePositions(newNodes, state.connections);
            return { 
              layoutType: type as 'hierarchical' | 'web' | 'snake' | 'command',
              nodes: newNodes,
            };
          }
          return { layoutType: type as 'hierarchical' | 'web' | 'snake' | 'command' };
        });
      },

      setZoom: (level: number) => {
        set({ zoomLevel: Math.max(0.1, Math.min(3, level)) });
      },

      setViewBox: (viewBox: ViewBox) => {
        set({ viewBox });
      },

      commitNodePosition: (id: string, x: number, y: number) => {
        set((state) => {
          const newNodes = new Map(state.nodes);
          const node = newNodes.get(id);
          if (node) {
            newNodes.set(id, { 
              ...node, 
              x, 
              y,
              layoutHints: {
                ...node.layoutHints,
                manualPosition: true,
              }
            });
          }
          return { nodes: newNodes };
        });
      },

      recalculateLayout: () => {
        const { nodes, connections, layoutType } = get();
        
        const engine = layoutEngines[layoutType];
        if (engine) {
          const newNodes = new Map(nodes);
          engine.calculatePositions(newNodes, connections);
          set({ nodes: newNodes });
        }
      },

      resetForDevelopment: () => {
        if (!isDevelopment) return;
        
        // Create a simple test structure
        const rootNode: Node = {
          id: nanoid(),
          text: 'Root Concept',
          x: 800,
          y: 400,
          nodeType: 'root',
          category: 0,
          isEditing: false,
          layoutHints: {},
        };

        const child1: Node = {
          id: nanoid(),
          text: 'Category 1',
          x: 600,
          y: 300,
          nodeType: 'category',
          category: 1,
          isEditing: false,
          layoutHints: {},
        };

        const child2: Node = {
          id: nanoid(),
          text: 'Category 2',
          x: 1000,
          y: 300,
          nodeType: 'category',
          category: 2,
          isEditing: false,
          layoutHints: {},
        };

        const connection1: Connection = {
          id: nanoid(),
          from: rootNode.id,
          to: child1.id,
          type: 'hierarchy',
          style: 'curved',
        };

        const connection2: Connection = {
          id: nanoid(),
          from: rootNode.id,
          to: child2.id,
          type: 'association',
          style: 'straight',
        };

        // Add more nodes for diverse connection testing
        const child3: Node = {
          id: nanoid(),
          text: 'Flow Node',
          x: 800,
          y: 500,
          nodeType: 'leaf',
          category: 3,
          isEditing: false,
          layoutHints: {},
        };

        const child4: Node = {
          id: nanoid(),
          text: 'Parameter Node',
          x: 600,
          y: 500,
          nodeType: 'parameter',
          category: 4,
          isEditing: false,
          layoutHints: {},
        };

        // Add diverse connection types
        const connection3: Connection = {
          id: nanoid(),
          from: child1.id,
          to: child3.id,
          type: 'flow',
          style: 'curved',
        };

        const connection4: Connection = {
          id: nanoid(),
          from: rootNode.id,
          to: child4.id,
          type: 'parameter',
          style: 'straight',
        };

        const nodes = new Map([
          [rootNode.id, rootNode],
          [child1.id, child1],
          [child2.id, child2],
          [child3.id, child3],
          [child4.id, child4],
        ]);

        set({
          nodes,
          connections: [connection1, connection2, connection3, connection4],
          rootId: rootNode.id,
          selectedId: rootNode.id,
          layoutType: 'hierarchical',
          viewBox: { x: 0, y: 0, width: 1600, height: 1200 },
          zoomLevel: 1,
        });
      },
    }),
    {
      name: 'mapitout-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        nodes: Array.from(state.nodes.entries()),
        connections: state.connections,
        rootId: state.rootId,
        layoutType: state.layoutType,
        viewBox: state.viewBox,
        zoomLevel: state.zoomLevel,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert array back to Map
          state.nodes = new Map(state.nodes as unknown as [string, Node][]);
        }
      },
    }
  )
);

export default useMapStore; 