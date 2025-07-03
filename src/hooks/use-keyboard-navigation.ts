/**
 * MapItOut Keyboard Navigation Hook
 * 
 * This hook handles all keyboard interactions for the mind mapping tool.
 * Implements the primary interface for node creation, editing, and navigation.
 * 
 * Update when: Adding new keyboard shortcuts or modifying existing key bindings.
 */

import { useEffect, useCallback } from 'react';
import { useMapStore } from '../stores';
import type { Node } from '../types';

export const useKeyboardNavigation = () => {
  const { 
    nodes, 
    selectedId, 
    createNode, 
    updateNode, 
    deleteNode, 
    selectNode 
  } = useMapStore();

  const getSelectedNode = useCallback((): Node | null => {
    return selectedId ? nodes.get(selectedId) || null : null;
  }, [nodes, selectedId]);

  const getNextNode = useCallback((direction: 'up' | 'down' | 'left' | 'right'): Node | null => {
    const selected = getSelectedNode();
    if (!selected) return null;

    const allNodes = Array.from(nodes.values());
    let closestNode: Node | null = null;
    let minDistance = Infinity;

    allNodes.forEach(node => {
      if (node.id === selected.id) return;

      let shouldConsider = false;
      switch (direction) {
        case 'up':
          shouldConsider = node.y < selected.y;
          break;
        case 'down':
          shouldConsider = node.y > selected.y;
          break;
        case 'left':
          shouldConsider = node.x < selected.x;
          break;
        case 'right':
          shouldConsider = node.x > selected.x;
          break;
      }

      if (shouldConsider) {
        const distance = Math.sqrt(
          Math.pow(node.x - selected.x, 2) + Math.pow(node.y - selected.y, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestNode = node;
        }
      }
    });

    return closestNode;
  }, [nodes, getSelectedNode]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const selected = getSelectedNode();
    
    // Prevent default behavior for our shortcuts
    if (['Tab', 'Enter', 'Escape', 'Delete', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      event.preventDefault();
    }

    switch (event.key) {
      case 'Tab':
        if (selected) {
          createNode(selected.id);
        }
        break;

      case 'Enter':
        if (selected) {
          if (selected.isEditing) {
            // Finish editing
            updateNode(selected.id, { isEditing: false });
          } else {
            // Start editing
            updateNode(selected.id, { isEditing: true });
          }
        }
        break;

      case 'Escape':
        if (selected?.isEditing) {
          updateNode(selected.id, { isEditing: false });
        }
        break;

      case 'Delete':
        if (selected && selected.id !== useMapStore.getState().rootId) {
          deleteNode(selected.id);
        }
        break;

      case 'ArrowUp':
        const upNode = getNextNode('up');
        if (upNode) selectNode(upNode.id);
        break;

      case 'ArrowDown':
        const downNode = getNextNode('down');
        if (downNode) selectNode(downNode.id);
        break;

      case 'ArrowLeft':
        const leftNode = getNextNode('left');
        if (leftNode) selectNode(leftNode.id);
        break;

      case 'ArrowRight':
        const rightNode = getNextNode('right');
        if (rightNode) selectNode(rightNode.id);
        break;

      case ' ':
        if (event.shiftKey && selected) {
          // Shift + Space: Create sibling node
          const parent = selected.parentId ? nodes.get(selected.parentId) : null;
          if (parent) {
            createNode(parent.id);
          }
        }
        break;
    }
  }, [getSelectedNode, createNode, updateNode, deleteNode, selectNode, getNextNode, nodes]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    getSelectedNode,
    getNextNode,
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