/**
 * MapItOut UI Store - Simplified
 * 
 * This file contains the Zustand store for managing UI state and interactions.
 * Simplified to focus on text editing and basic UI state.
 * 
 * Update when: Adding new UI state properties or modifying interaction behaviors.
 */

import { create } from 'zustand';
import type { UIState } from '../types';

interface UIStore extends UIState {
  startEditing: (nodeId: string) => void;
  stopEditing: () => void;
}

const useUIStore = create<UIStore>((set) => ({
  isEditing: false,
  editingNodeId: null,

  // Actions
  startEditing: (nodeId: string) => {
    set({ isEditing: true, editingNodeId: nodeId });
  },

  stopEditing: () => {
    set({ isEditing: false, editingNodeId: null });
  },
}));

export { useUIStore }; 