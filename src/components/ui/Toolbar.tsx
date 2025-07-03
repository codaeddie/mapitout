/**
 * MapItOut Toolbar Component
 * 
 * This component provides basic controls for the mind mapping tool.
 * Includes zoom controls, export functionality, and help access.
 * 
 * Update when: Adding new toolbar controls, modifying existing controls, or changing toolbar layout.
 */

import React from 'react';
import { useMapStore, useUIStore } from '../../stores';
import { exportMindMap } from '../../utils';

export const Toolbar: React.FC = () => {
  const { zoomLevel, setZoom, nodes, connections, selectedId, createNode } = useMapStore();
  const { setExportProgress } = useUIStore();

  const handleZoomIn = () => {
    setZoom(Math.min(3, zoomLevel * 1.2));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(0.1, zoomLevel / 1.2));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  const handleExport = async () => {
    const container = document.querySelector('.canvas-container') as HTMLElement;
    if (!container) {
      alert('Canvas not found');
      return;
    }

    try {
      await exportMindMap(
        container,
        nodes,
        connections,
        {
          filename: `mindmap-${Date.now()}`,
          scale: 2,
        },
        (progress) => {
          setExportProgress(progress.progress);
        }
      );
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExportProgress(0);
    }
  };

  const handleTestVirtualization = () => {
    // Create many nodes quickly to test virtualization
    const selectedNode = selectedId ? nodes.get(selectedId) : null;
    if (!selectedNode) {
      alert('Please select a node first');
      return;
    }

    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        createNode(selectedNode.id, `Test Node ${i + 1}`);
      }, i * 10); // Stagger creation
    }
  };

  return (
    <div className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between">
      {/* Left side - Title */}
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold text-white">MapItOut</h1>
        <span className="text-slate-400 text-sm">
          Professional Mind Mapping
        </span>
      </div>

      {/* Center - Zoom controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleZoomOut}
          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm transition-colors"
          title="Zoom Out"
        >
          −
        </button>
        <span className="text-white text-sm min-w-[60px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={handleZoomReset}
          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm transition-colors"
          title="Reset Zoom"
        >
          Reset
        </button>
      </div>

      {/* Right side - Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handleTestVirtualization}
          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm transition-colors"
          title="Test Virtualization (Creates 50 nodes)"
        >
          Test
        </button>
        <button
          onClick={handleExport}
          className="bg-node-orange hover:bg-orange-600 text-white px-4 py-1 rounded text-sm font-medium transition-colors"
          title="Export as PNG"
        >
          Export
        </button>
        <button
          className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-sm transition-colors"
          title="Keyboard Shortcuts"
        >
          ?
        </button>
      </div>
    </div>
  );
}; 