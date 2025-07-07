/**
 * MapCanvas.tsx
 *
 * Main container for the MapItOut mind map. Combines ConnectionLayer and NodeComponent.
 * Manages viewport and zoom transforms, and handles mouse events for pan, zoom, node selection, and node dragging.
 *
 * Update when: Modifying canvas structure, viewport logic, or event handling.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import useMapStore from '../stores/map-store';
import useUIStore from '../stores/ui-store';
import { ConnectionLayer } from './canvas/ConnectionLayer';
import { NodeComponent } from './nodes/NodeComponent';
import { LayoutSwitcher } from './ui/LayoutSwitcher';
import { useKeyboardNavigation } from '../hooks';
import { exportMindMap } from '../utils';
import type { ViewBox } from '../types';

// HelpModal component migrated from ui/Toolbar.tsx
interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Tab', description: 'Create connected node (layout-aware)' },
    { key: 'Shift + Space', description: 'Create unconnected node' },
    { key: 'Enter', description: 'Start/stop text editing' },
    { key: 'Shift + Enter', description: 'New line in edit mode' },
    { key: 'Escape', description: 'Exit edit mode' },
    { key: 'Delete/Backspace', description: 'Delete selected node' },
    { key: 'Arrow Keys', description: 'Navigate connections' },
    { key: '1-4', description: 'Switch layout (Tree/Web/Flow/Command)' },
    { key: 'Ctrl/Cmd + +/-', description: 'Zoom in/out' },
    { key: 'Ctrl/Cmd + 0', description: 'Recalculate layout' },
  ];

  const tips = [
    'Double-click nodes to edit text',
    'Drag nodes to override automatic positioning',
    'Use multi-line text with Shift+Enter in edit mode',
    'Nodes with yellow dots are manually positioned',
    'Tab creates different connection types based on layout',
    'Arrow keys navigate through connections, not hierarchy',
    'Switch layouts with 1-4 keys for different visual styles',
    'Export PNG for presentations and documentation',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">MapItOut Help</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between items-center bg-slate-700/50 rounded px-3 py-2">
                  <kbd className="bg-slate-600 text-white px-2 py-1 rounded text-sm font-mono">
                    {shortcut.key}
                  </kbd>
                  <span className="text-slate-300 text-sm">{shortcut.description}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Usage Tips */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Usage Tips</h3>
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li key={index} className="text-slate-300 text-sm flex items-start">
                  <span className="text-blue-400 mr-2">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Color Legend */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Color Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded border border-white"></div>
                <span className="text-slate-300 text-sm">Central/Primary</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded border border-white"></div>
                <span className="text-slate-300 text-sm">High Priority</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500 rounded border border-white"></div>
                <span className="text-slate-300 text-sm">Secondary</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded border border-white"></div>
                <span className="text-slate-300 text-sm">Supporting</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-purple-500 rounded border border-white"></div>
                <span className="text-slate-300 text-sm">Specialized</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-amber-500 rounded border border-white"></div>
                <span className="text-slate-300 text-sm">Additional</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded font-medium transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export const FloatingToolbar = () => {
  const {
    nodes,
    zoomLevel,
    selectedId,
    rootId,
    setZoom,
    createNode,
    recalculateLayout,
    resetForDevelopment,
  } = useMapStore();

  const {
    setExportProgress,
    exportProgress,
    exportStage,
  } = useUIStore();

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

  return (
    <div className="absolute top-4 left-4 z-50 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg px-4 py-2 flex items-center space-x-2 shadow-lg">
      {/* Title */}
      <div className="flex items-center space-x-4 mr-4">
        <h1 className="text-lg font-bold text-white">MapItOut</h1>
        <span className="text-slate-400 text-sm hidden sm:inline">
          Professional Mind Mapping
        </span>
      </div>

      {/* Zoom controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setZoom(Math.max(0.1, zoomLevel / 1.2))}
          className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-sm transition-colors"
          title="Zoom Out"
        >
          −
        </button>
        <span className="text-white text-sm min-w-[50px] text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={() => setZoom(Math.min(3, zoomLevel * 1.2))}
          className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-sm transition-colors"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoom(1)}
          className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-sm transition-colors"
          title="Reset Zoom"
        >
          Reset
        </button>
        <button
          onClick={() => {
            // Simple fit to content - could be enhanced
            recalculateLayout();
          }}
          className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-sm transition-colors"
          title="Recalculate Layout"
        >
          Layout
        </button>
      </div>

      {/* Layout Switcher */}
      <div className="flex items-center space-x-2 ml-4">
        <LayoutSwitcher />
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={() => {
            const selectedNode = selectedId ? nodes.get(selectedId) : null;
            if (selectedNode) {
              // Create child of selected node
              createNode('New Node', 'leaf');
            } else if (nodes.size === 0) {
              // Create root node if no nodes exist
              createNode('Central Topic', 'root');
            } else {
              // Create child of root node if no node is selected
              const rootNode = nodes.get(rootId);
              if (rootNode) {
                createNode('New Node', 'leaf');
              }
            }
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          title="Add Node (Creates child of selected node or root)"
        >
          Add Node
        </button>
        <button
          onClick={() => {
            const selectedNode = selectedId ? nodes.get(selectedId) : null;
            if (!selectedNode) {
              alert('Please select a node first');
              return;
            }

            for (let i = 0; i < 50; i++) {
              setTimeout(() => {
                createNode(`Test Node ${i + 1}`, 'leaf');
              }, i * 10);
            }
          }}
          className="bg-slate-700 hover:bg-slate-600 text-white px-2 py-1 rounded text-sm transition-colors"
          title="Test Virtualization (Creates 50 nodes)"
        >
          Test
        </button>
        {import.meta.env.DEV && (
          <button
            onClick={resetForDevelopment}
            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm transition-colors"
            title="Reset State (Development Only)"
          >
            Reset
          </button>
        )}
        <button
          onClick={async () => {
            const container = document.querySelector('.canvas-container') as HTMLElement;
            if (!container) {
              alert('Canvas not found');
              return;
            }

            try {
              setExportProgress(0);
              await exportMindMap(
                container,
                {
                  filename: `mindmap-${Date.now()}`,
                  scale: 2, // Better performance, still high quality
                  backgroundColor: '#0f172a',
                },
                (progress: any) => {
                  setExportProgress(progress.progress, progress.message);
                }
              );
            } catch (error) {
              console.error('Export failed:', error);
              alert('Export failed. Please try again.');
            } finally {
              setExportProgress(0);
            }
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          title="Export as High-DPI PNG"
        >
          Export PNG
        </button>
        
        {/* Export Progress Indicator */}
        {exportProgress > 0 && exportProgress < 100 && (
          <div className="flex items-center space-x-2 bg-slate-700/50 rounded px-2 py-1">
            <div className="w-16 h-2 bg-slate-600 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300 ease-out"
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-xs">{Math.round(exportProgress)}%</span>
              {exportStage && (
                <span className="text-gray-300 text-xs">{exportStage}</span>
              )}
            </div>
          </div>
        )}
        
        <button
          onClick={() => setIsHelpModalOpen(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          title="Help & Keyboard Shortcuts"
        >
          Help
        </button>
      </div>
      
      {/* Help Modal */}
      <HelpModal 
        isOpen={isHelpModalOpen} 
        onClose={() => setIsHelpModalOpen(false)} 
      />
    </div>
  );
};

export const MapCanvas: React.FC = () => {
  // Enable keyboard navigation
  useKeyboardNavigation();
  
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    nodes,
    viewBox,
    zoomLevel,
    selectedId,
    selectNode,
    setViewBox,
    setZoom,
    commitNodePosition,
    updateNode,
  } = useMapStore();

  const {
    isDragging,
    draggedNodeId,
    dragStartPos,
    startDragging,
    updateDragOffset,
    stopDragging,
  } = useUIStore();

  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const viewBoxStart = useRef<ViewBox | null>(null);

  // Update viewport size on window resize
  useEffect(() => {
    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent browser zoom with Ctrl +/- keys only
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl/Cmd + Plus/Minus zoom
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '=')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Prevent Ctrl/Cmd + 0 (reset zoom)
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Add global listeners for keyboard only
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    
    // Cleanup
    return () => {
      document.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, []);

  // Node drag start
  const handleNodeDragStart = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    if (e.button !== 0) return;
    const node = nodes.get(nodeId);
    if (!node) return;
    startDragging(nodeId, { x: e.clientX, y: e.clientY });
    selectNode(nodeId);
  };

  // Mouse down to start panning (only if not dragging and not on a node)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (isDragging) return;
    // Only start panning if not clicking on a node
    // Check for data-node-id attribute in event target
    let el = e.target as HTMLElement;
    while (el && el !== e.currentTarget) {
      if (el.hasAttribute('data-node-id')) return;
      el = el.parentElement as HTMLElement;
    }
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY };
    viewBoxStart.current = { ...viewBox };
  };

  // Mouse move to pan or drag
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && draggedNodeId && dragStartPos) {
      e.preventDefault(); // Prevent text selection
      const node = nodes.get(draggedNodeId);
      if (!node) return;
      const dx = (e.clientX - dragStartPos.x) / zoomLevel;
      const dy = (e.clientY - dragStartPos.y) / zoomLevel;
      updateDragOffset({ x: dx, y: dy });
      // Live update node position visually
      updateNode(draggedNodeId, { x: node.x + dx, y: node.y + dy });
      return;
    }
    if (!isDragging && isPanning && panStart.current && viewBoxStart.current) {
      const dx = (e.clientX - panStart.current.x) / zoomLevel;
      const dy = (e.clientY - panStart.current.y) / zoomLevel;
      setViewBox({
        ...viewBoxStart.current,
        x: viewBoxStart.current.x - dx,
        y: viewBoxStart.current.y - dy,
      });
    }
  };

  // Mouse up to end panning or dragging
  const handleMouseUp = () => {
    if (isDragging && draggedNodeId) {
      // Commit the final position
      const node = nodes.get(draggedNodeId);
      if (node) {
        commitNodePosition(draggedNodeId, node.x, node.y);
      }
      stopDragging();
    }
    setIsPanning(false);
    panStart.current = null;
    viewBoxStart.current = null;
  };

  // Mouse wheel to zoom with cursor-based centering
  const handleWheel = (e: React.WheelEvent) => {
    // Prevent browser zoom and ensure only canvas zoom works
    e.preventDefault();
    e.stopPropagation();
    
    // Only handle wheel events if not in a text input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(3, zoomLevel * delta));
    
    // Calculate cursor position relative to canvas
    const rect = e.currentTarget.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;
    
    // Calculate zoom center point
    const zoomCenterX = (cursorX + viewBox.x) / zoomLevel;
    const zoomCenterY = (cursorY + viewBox.y) / zoomLevel;
    
    // Update zoom and adjust viewBox to keep cursor position fixed
    setZoom(newZoom);
    setViewBox({
      ...viewBox,
      x: zoomCenterX * newZoom - cursorX,
      y: zoomCenterY * newZoom - cursorY,
    });
  };

  // Click background to deselect
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      selectNode('');
    }
  };

  // Node selection handler
  const handleNodeSelect = useCallback((id: string) => {
    selectNode(id);
  }, [selectNode]);

  // Transform style for zoom and pan
  const transform = `scale(${zoomLevel}) translate(${-viewBox.x}px, ${-viewBox.y}px)`;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-gray-900 overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleBackgroundClick}
      tabIndex={0}
    >
      <FloatingToolbar />
      <div
        className="canvas-container absolute left-0 top-0 w-full h-full"
        style={{
          transform,
          transformOrigin: 'top left',
          pointerEvents: 'auto', // Allow pointer events to reach nodes
        }}
      >
        <ConnectionLayer
          width={viewportSize.width}
          height={viewportSize.height}
          zoomLevel={zoomLevel}
          viewBox={viewBox}
        />
        {/* Node Components */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from(nodes.values()).map((node) => (
            <NodeComponent
              key={node.id}
              node={node}
              isSelected={node.id === selectedId}
              onSelect={handleNodeSelect}
              onDoubleClick={(id) => updateNode(id, { isEditing: true })}
              onDragStart={handleNodeDragStart}
            />
          ))}
        </div>
      </div>
    </div>
  );
}; 