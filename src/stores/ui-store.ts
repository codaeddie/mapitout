/**
 * MapItOut UI Store
 * 
 * This file contains the Zustand store for managing UI state and interactions.
 * Handles dragging, panning, help visibility, and export progress.
 * 
 * Update when: Adding new UI state properties or modifying interaction behaviors.
 */

import { create } from 'zustand';
import type { UIState } from '../types';

interface UIStore extends UIState {
  setDragging: (isDragging: boolean, offset?: { x: number; y: number }) => void;
  setPanning: (isPanning: boolean) => void;
  toggleHelp: () => void;
  setExportProgress: (progress: number) => void;
  resetUI: () => void;
}

const useUIStore = create<UIStore>((set) => ({
  isDragging: false,
  dragOffset: { x: 0, y: 0 },
  isPanning: false,
  showHelp: false,
  exportProgress: 0,

  // Actions
  setDragging: (isDragging: boolean, offset?: { x: number; y: number }) => {
    set({ 
      isDragging, 
      dragOffset: offset || { x: 0, y: 0 } 
    });
  },

  setPanning: (isPanning: boolean) => {
    set({ isPanning });
  },

  toggleHelp: () => {
    set((state) => ({ showHelp: !state.showHelp }));
  },

  setExportProgress: (progress: number) => {
    set({ exportProgress: Math.max(0, Math.min(100, progress)) });
  },

  resetUI: () => {
    set({
      isDragging: false,
      dragOffset: { x: 0, y: 0 },
      isPanning: false,
      showHelp: false,
      exportProgress: 0,
    });
  },
}));

export default useUIStore; 