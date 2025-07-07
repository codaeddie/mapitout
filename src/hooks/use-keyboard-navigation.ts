/**
 * MapItOut Keyboard Navigation Hook - Simplified
 * 
 * This hook handles keyboard interactions for the tree mapping tool.
 * Focuses on Tab (create child) and Enter (create sibling) as per design document.
 * 
 * Update when: Adding new keyboard shortcuts or modifying existing key bindings.
 */

import { useEffect } from 'react';
import { useMapStore } from '../stores/map-store';
import { useUIStore } from '../stores/ui-store';

export const useKeyboardNavigation = () => {
  const { 
    nodes, 
    selectedId,
    createNode, 
    selectNode,
  } = useMapStore();

  const { isEditing, startEditing } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if user is editing text
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      // Don't handle if user is typing in a contenteditable
      if (e.target instanceof HTMLElement && e.target.contentEditable === 'true') {
        return;
      }
      
      // Don't handle if we're in editing mode
      if (isEditing) {
        return;
      }
      
      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          if (selectedId) {
            // Create child of selected node
            createNode(selectedId);
          } else if (nodes.size === 0) {
            // Create root node if no nodes exist
            createNode('', 'Root Node');
          }
          break;
          
        case 'Enter':
          e.preventDefault();
          if (selectedId) {
            const node = nodes.get(selectedId);
            if (node?.parent) {
              // Create sibling of selected node
              createNode(node.parent);
            }
          }
          break;

        // --- ADDED: Shift+Spacebar to start editing ---
        case ' ': // Spacebar
          if (e.shiftKey && selectedId && !isEditing) {
            e.preventDefault();
            startEditing(selectedId);
          }
          break;

        case 'Escape':
          e.preventDefault();
          selectNode(null);
          break;
          
        case 'Delete':
        case 'Backspace':
          e.preventDefault();
          if (selectedId) {
            // Delete the selected node and all its descendants
            const deleteNodeAndChildren = (nodeId: string) => {
              const node = nodes.get(nodeId);
              if (!node) return;
              
              // Recursively delete all children first
              node.children.forEach(childId => {
                deleteNodeAndChildren(childId);
              });
              
              // Remove from parent's children array
              if (node.parent) {
                const parent = nodes.get(node.parent);
                if (parent) {
                  parent.children = parent.children.filter(id => id !== nodeId);
                }
              }
              
              // Delete the node
              const newNodes = new Map(nodes);
              newNodes.delete(nodeId);
              useMapStore.setState({ nodes: newNodes, selectedId: null });
            };
            
            deleteNodeAndChildren(selectedId);
          }
          break;
          
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          e.preventDefault();
          navigateToAdjacentNode(e.key);
          break;
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedId, nodes, isEditing, createNode, selectNode]);

  const navigateToAdjacentNode = (direction: string) => {
    if (!selectedId) return;
    
    const selectedNode = nodes.get(selectedId);
    if (!selectedNode) return;
    
    let targetId: string | null = null;
    
    switch (direction) {
      case 'ArrowUp':
        // Find node above in same tier
        targetId = findNodeAbove(selectedNode);
        break;
        
      case 'ArrowDown':
        // Find node below in same tier
        targetId = findNodeBelow(selectedNode);
        break;
        
      case 'ArrowLeft':
        // Find node to the left
        targetId = findNodeLeft(selectedNode);
        break;
        
      case 'ArrowRight':
        // Find node to the right
        targetId = findNodeRight(selectedNode);
        break;
    }
    
    if (targetId) {
      selectNode(targetId);
    }
  };

  const findNodeAbove = (node: any): string | null => {
    // Simple implementation - find sibling with lower index
    if (!node.parent) return null;
    
    const parent = nodes.get(node.parent);
    if (!parent) return null;
    
    const siblings = parent.children;
    const currentIndex = siblings.indexOf(node.id);
    
    if (currentIndex > 0) {
      return siblings[currentIndex - 1];
    }
    
    return null;
  };

  const findNodeBelow = (node: any): string | null => {
    // Simple implementation - find sibling with higher index
    if (!node.parent) return null;
    
    const parent = nodes.get(node.parent);
    if (!parent) return null;
    
    const siblings = parent.children;
    const currentIndex = siblings.indexOf(node.id);
    
    if (currentIndex < siblings.length - 1) {
      return siblings[currentIndex + 1];
    }
    
    return null;
  };

  const findNodeLeft = (node: any): string | null => {
    // For now, just return parent
    return node.parent;
  };

  const findNodeRight = (node: any): string | null => {
    // For now, just return first child
    if (node.children.length > 0) {
      return node.children[0];
    }
    
    return null;
  };
}; 