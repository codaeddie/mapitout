/**
 * MapItOut Main Canvas Component
 * 
 * This component serves as the main canvas for the mind mapping tool.
 * Combines connection and node layers, handles canvas interactions,
 * and manages the overall mind map display and interactions.
 * 
 * Update when: Modifying canvas structure, adding new interaction layers, or changing canvas behavior.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useMapStore } from '../stores';
import { useKeyboardNavigation } from '../hooks';
import { ConnectionLayer, NodeLayer } from './canvas';
import { useVirtualizedNodes } from '../hooks/use-node-positioning';


export const MapCanvas: React.FC = () => {
  const { 
    nodes, 
    rootId, 
    selectedId, 
    createNode, 
    zoomLevel,
    setZoom
  } = useMapStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1600, height: 1200 });
  const [isInitialized, setIsInitialized] = useState(false);
  const visibleNodes = useVirtualizedNodes(); // For debugging virtualization

  // Initialize keyboard navigation
  useKeyboardNavigation();

  // Initialize root node if none exists
  useEffect(() => {
    if (!rootId && nodes.size === 0) {
      createNode('', 'Central Topic');
      setIsInitialized(true);
    } else if (rootId) {
      setIsInitialized(true);
    }
  }, [rootId, nodes.size, createNode]);

  // Handle canvas resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, []);

  // Handle zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, zoomLevel * delta));
    
    if (newZoom !== zoomLevel) {
      setZoom(newZoom);
    }
  };

  // Handle canvas click to create root node if needed
  const handleCanvasClick = () => {
    if (!isInitialized && nodes.size === 0) {
      createNode('', 'Central Topic');
    }
  };

  if (!isInitialized) {
    return (
      <div
        ref={canvasRef}
        className="canvas-container w-full h-full"
        onClick={handleCanvasClick}
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-slate-400">
            <h2 className="text-xl font-semibold mb-2">MapItOut</h2>
            <p className="text-sm">Click anywhere to create your first node</p>
            <p className="text-xs mt-2 text-slate-500">
              Use Tab to create child nodes • Enter to edit • Arrow keys to navigate
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className="canvas-container w-full h-full relative overflow-hidden"
      onWheel={handleWheel}
      style={{
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'center center',
      }}
    >
      {/* Connection Layer (SVG) */}
      <ConnectionLayer
        width={canvasSize.width}
        height={canvasSize.height}
      />

      {/* Node Layer (DOM) */}
      <NodeLayer
        width={canvasSize.width}
        height={canvasSize.height}
      />

      {/* Zoom indicator */}
      {zoomLevel !== 1 && (
        <div className="absolute top-4 right-4 bg-slate-800/80 text-white px-2 py-1 rounded text-xs">
          {Math.round(zoomLevel * 100)}%
        </div>
      )}

      {/* Node count indicator */}
      <div className="absolute bottom-4 left-4 bg-slate-800/80 text-white px-2 py-1 rounded text-xs">
        {nodes.size} node{nodes.size !== 1 ? 's' : ''} ({visibleNodes.size} visible)
      </div>

      {/* Selection indicator */}
      {selectedId && (
        <div className="absolute bottom-4 right-4 bg-slate-800/80 text-white px-2 py-1 rounded text-xs">
          Selected: {nodes.get(selectedId)?.text || 'Unknown'}
        </div>
      )}
    </div>
  );
}; 