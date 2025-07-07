/**
 * MapItOut Keyboard Navigation Hook
 * 
 * This hook handles all keyboard interactions for the mind mapping tool.
 * Implements layout-aware navigation and smart node creation based on connection types.
 * 
 * Update when: Adding new keyboard shortcuts or modifying existing key bindings.
 */

import { useEffect, useCallback } from 'react';
import useMapStore from '../stores/map-store';
import { getConnectionTypeForLayout } from '../utils/layout-engines';
import type { Node, Connection } from '../types';

export const useKeyboardNavigation = () => {
  const { 
    nodes, 
    connections,
    selectedId, 
    layoutType,
    createNode, 
    updateNode, 
    deleteNode, 
    selectNode,
    setLayoutType,
    recalculateLayout,
    setZoom,
    zoomLevel
  } = useMapStore();

  const getSelectedNode = useCallback((): Node | null => {
    return selectedId ? nodes.get(selectedId) || null : null;
  }, [nodes, selectedId]);

  // Get connected nodes for navigation
  const getConnectedNodes = useCallback((nodeId: string): Node[] => {
    return connections
      .filter(c => c.from === nodeId || c.to === nodeId)
      .map(c => c.from === nodeId ? c.to : c.from)
      .map(id => nodes.get(id))
      .filter(Boolean) as Node[];
  }, [connections, nodes]);

  // Get incoming connections (where this node is the target)
  const getIncomingConnections = useCallback((nodeId: string): Connection[] => {
    return connections.filter(c => c.to === nodeId);
  }, [connections]);

  // Get outgoing connections (where this node is the source)
  const getOutgoingConnections = useCallback((nodeId: string): Connection[] => {
    return connections.filter(c => c.from === nodeId);
  }, [connections]);

  // Layout-aware navigation
  const navigateToConnectedNode = useCallback((direction: 'up' | 'down' | 'left' | 'right'): Node | null => {
    const selected = getSelectedNode();
    if (!selected) return null;

    const connectedNodes = getConnectedNodes(selected.id);
    if (connectedNodes.length === 0) return null;

    // For now, use simple navigation - could be enhanced with spatial awareness
    switch (direction) {
      case 'up':
        // Navigate to first connected node
        return connectedNodes[0];
      case 'down':
        // Navigate to second connected node if available, otherwise first
        return connectedNodes.length > 1 ? connectedNodes[1] : connectedNodes[0];
      case 'left': {
        // Navigate to source node (incoming connection)
        const incoming = getIncomingConnections(selected.id);
        if (incoming.length > 0) {
          const sourceNode = nodes.get(incoming[0].from);
          return sourceNode || null;
        }
        // Fallback to first connected node
        return connectedNodes[0];
      }
      case 'right': {
        // Navigate to target node (outgoing connection)
        const outgoing = getOutgoingConnections(selected.id);
        if (outgoing.length > 0) {
          const targetNode = nodes.get(outgoing[0].to);
          return targetNode || null;
        }
        // Fallback to first connected node
        return connectedNodes[0];
      }
      default:
        return null;
    }
  }, [getSelectedNode, getConnectedNodes, getIncomingConnections, getOutgoingConnections, nodes]);

  // Smart node creation based on layout type
  const createSmartNode = useCallback((parentId?: string) => {
    const connectionType = getConnectionTypeForLayout(layoutType);
    const defaultText = getDefaultNodeText(layoutType, connectionType);
    
    if (parentId) {
      createNode(defaultText, 'leaf');
    } else {
      // Create unconnected node
      createNode(defaultText, 'leaf');
    }
  }, [layoutType, createNode]);

  // Get default text based on layout and connection type
  const getDefaultNodeText = (layout: string, connectionType: string): string => {
    switch (layout) {
      case 'hierarchical':
        return connectionType === 'hierarchy' ? 'New Child' : 'New Node';
      case 'web':
        return connectionType === 'association' ? 'New Spoke' : 'New Node';
      case 'snake':
        return connectionType === 'flow' ? 'New Flow' : 'New Node';
      case 'command':
        return connectionType === 'parameter' ? 'New Parameter' : 'New Node';
      default:
        return 'New Node';
    }
  };

  // Layout switching shortcuts
  const switchLayout = useCallback((layoutKey: string) => {
    const layoutMap: Record<string, string> = {
      '1': 'hierarchical',
      '2': 'web',
      '3': 'snake',
      '4': 'command',
    };
    
    const layoutType = layoutMap[layoutKey];
    if (layoutType) {
      setLayoutType(layoutType);
    }
  }, [setLayoutType]);

  const handleGlobalShortcuts = useCallback((event: KeyboardEvent) => {
    // Layout switching shortcuts
    if (['1', '2', '3', '4'].includes(event.key)) {
      event.preventDefault();
      switchLayout(event.key);
      return true;
    }

    // Zoom controls
    if ((event.ctrlKey || event.metaKey) && (event.key === '+' || event.key === '=')) {
      event.preventDefault();
      setZoom(Math.min(3, zoomLevel * 1.2));
      return true;
    }

    if ((event.ctrlKey || event.metaKey) && event.key === '-') {
      event.preventDefault();
      setZoom(Math.max(0.1, zoomLevel * 0.8));
      return true;
    }

    // Fit to screen
    if ((event.ctrlKey || event.metaKey) && event.key === '0') {
      event.preventDefault();
      recalculateLayout();
      return true;
    }

    return false;
  }, [switchLayout, setZoom, zoomLevel, recalculateLayout]);

  const handleNodeShortcuts = useCallback((event: KeyboardEvent, selected: Node) => {
    switch (event.key) {
      case 'Tab':
        event.preventDefault();
        // Create connected node based on layout type
        createSmartNode(selected.id);
        break;

      case ' ':
        if (event.shiftKey) {
          event.preventDefault();
          // Create unconnected node
          createSmartNode();
        }
        break;

      case 'Enter':
        event.preventDefault();
        if (!selected.isEditing) {
          // Start editing
          updateNode(selected.id, { isEditing: true });
        }
        break;

      case 'Escape':
        event.preventDefault();
        if (selected.isEditing) {
          // Stop editing
          updateNode(selected.id, { isEditing: false });
        }
        break;

      case 'Delete':
      case 'Backspace': {
        event.preventDefault();
        // Don't delete root node
        const { rootId } = useMapStore.getState();
        if (selected.id !== rootId) {
          deleteNode(selected.id);
        }
        break;
      }

      case 'ArrowUp': {
        event.preventDefault();
        const upNode = navigateToConnectedNode('up');
        if (upNode) selectNode(upNode.id);
        break;
      }

      case 'ArrowDown': {
        event.preventDefault();
        const downNode = navigateToConnectedNode('down');
        if (downNode) selectNode(downNode.id);
        break;
      }

      case 'ArrowLeft': {
        event.preventDefault();
        const leftNode = navigateToConnectedNode('left');
        if (leftNode) selectNode(leftNode.id);
        break;
      }

      case 'ArrowRight': {
        event.preventDefault();
        const rightNode = navigateToConnectedNode('right');
        if (rightNode) selectNode(rightNode.id);
        break;
      }
    }
  }, [createSmartNode, updateNode, deleteNode, selectNode, navigateToConnectedNode]);

  const handleNoSelectionShortcuts = useCallback((event: KeyboardEvent) => {
    const { rootId } = useMapStore.getState();
    
    switch (event.key) {
      case 'Tab':
      case 'Enter':
        event.preventDefault();
        // Select root node if no node is selected
        if (rootId) {
          selectNode(rootId);
        }
        break;
    }
  }, [selectNode]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const selected = getSelectedNode();
    
    // Don't handle keyboard shortcuts if user is editing text
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    // Global shortcuts (always available)
    if (handleGlobalShortcuts(event)) {
      return;
    }
    
    // Node-specific shortcuts (require selected node)
    if (selected) {
      handleNodeShortcuts(event, selected);
    } else {
      handleNoSelectionShortcuts(event);
    }
  }, [getSelectedNode, handleGlobalShortcuts, handleNodeShortcuts, handleNoSelectionShortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    getSelectedNode,
    getConnectedNodes,
    navigateToConnectedNode,
    createSmartNode,
    switchLayout,
  };
};

export const useGlobalKeyboardListeners = () => {
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Global shortcuts that work anywhere
      switch (event.key) {
        case '?':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            // Toggle help - would need to be implemented in UI store
            console.log('Toggle help');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);
}; 