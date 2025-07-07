/**
 * MapCanvas.tsx - Simplified
 *
 * Main container for the MapItOut tree map. Renders nodes at calculated positions.
 * Simplified to focus on basic rendering and keyboard interactions.
 *
 * Update when: Modifying canvas structure or basic rendering logic.
 */

import React, { useRef, useMemo, useState } from 'react';
import { useMapStore } from '../stores/map-store';
import { useUIStore } from '../stores/ui-store';
import { NodeComponent } from './nodes/NodeComponent';
import { LayoutSwitcher } from './ui/LayoutSwitcher';
import { useKeyboardNavigation } from '../hooks';
import { calculateLayout } from '../utils/layout-engines';

// Simple toolbar component
const FloatingToolbar = () => {
  const { nodes, selectedId } = useMapStore();

  const handleDeleteNode = () => {
    if (!selectedId) return;
    
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
  };

  const handleResetCanvas = () => {
    useMapStore.setState({ nodes: new Map(), selectedId: null });
  };

  const handleExportPNG = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    try {
      // Create a temporary canvas for high-quality export
      const exportCanvas = document.createElement('canvas');
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) return;
      
      // Set high resolution
      const scale = 2;
      exportCanvas.width = canvas.width * scale;
      exportCanvas.height = canvas.height * scale;
      
      // Scale the context
      ctx.scale(scale, scale);
      
      // Draw background
      ctx.fillStyle = '#0f172a'; // slate-900
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw connections
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      
      nodes.forEach(node => {
        if (!node.parent) return;
        
        const parentPos = calculateLayout(nodes, useMapStore.getState().layoutType).get(node.parent);
        const childPos = calculateLayout(nodes, useMapStore.getState().layoutType).get(node.id);
        
        if (!parentPos || !childPos) return;
        
        ctx.beginPath();
        ctx.moveTo(parentPos.x, parentPos.y);
        ctx.lineTo(childPos.x, childPos.y);
        ctx.stroke();
      });
      
      // Draw nodes
      const positions = calculateLayout(nodes, useMapStore.getState().layoutType);
      positions.forEach((pos, nodeId) => {
        const node = nodes.get(nodeId);
        if (!node) return;
        
        // Node background
        ctx.fillStyle = nodeId === selectedId ? '#1e293b' : '#334155';
        ctx.strokeStyle = nodeId === selectedId ? '#3b82f6' : '#64748b';
        ctx.lineWidth = nodeId === selectedId ? 2 : 1;
        
        ctx.beginPath();
        ctx.roundRect(pos.x - pos.width / 2, pos.y - pos.height / 2, pos.width, pos.height, 8);
        ctx.fill();
        ctx.stroke();
        
        // Node text
        ctx.fillStyle = 'white';
        ctx.font = '14px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.text, pos.x, pos.y);
      });
      
      // Convert to blob and download
      exportCanvas.toBlob((blob) => {
        if (!blob) return;
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mapitout-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 'image/png');
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  return (
    <div className="absolute top-4 left-4 z-50 bg-slate-800/90 backdrop-blur-sm border border-slate-700 rounded-lg px-4 py-2 flex items-center space-x-2 shadow-lg">
      {/* Title */}
      <div className="flex items-center space-x-4 mr-4">
        <h1 className="text-lg font-bold text-white">MapItOut</h1>
        <span className="text-slate-400 text-sm hidden sm:inline">
          Tree Mapping Tool
        </span>
      </div>

      {/* Layout switcher */}
      <LayoutSwitcher />

      {/* Node count */}
      <span className="text-slate-400 text-sm">
        {nodes.size} nodes
      </span>

      {/* Action buttons */}
      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={handleDeleteNode}
          disabled={!selectedId}
          className="bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          title="Delete selected node and all children"
        >
          Delete Node
        </button>
        
        <button
          onClick={handleResetCanvas}
          className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          title="Clear all nodes"
        >
          Reset Canvas
        </button>
        
        <button
          onClick={handleExportPNG}
          disabled={nodes.size === 0}
          className="bg-green-600 hover:bg-green-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium transition-colors"
          title="Export as high-quality PNG"
        >
          Export PNG
        </button>
      </div>
    </div>
  );
};

export const MapCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { nodes, selectedId, layoutType, createNode } = useMapStore();
  const { isEditing } = useUIStore();
  const [helpOpen, setHelpOpen] = useState(false);

  // Initialize keyboard navigation
  useKeyboardNavigation();

  // Initialize with root node if no nodes exist
  React.useEffect(() => {
    if (nodes.size === 0) {
      createNode('', 'Start Here');
    }
  }, [nodes.size, createNode]);

  // Calculate positions using layout engine
  const positions = useMemo(() => {
    return calculateLayout(nodes, useMapStore.getState().layoutType);
  }, [nodes, layoutType]);

  // Render to canvas
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections (parent-child lines)
    /*
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    
    nodes.forEach(node => {
      if (!node.parent) return;
      
      const parentPos = positions.get(node.parent);
      const childPos = positions.get(node.id);
      
      if (!parentPos || !childPos) return;
      
      // Draw straight line from parent to child
      ctx.beginPath();
      ctx.moveTo(parentPos.x, parentPos.y);
      ctx.lineTo(childPos.x, childPos.y);
      ctx.stroke();
    });
    */
  }, [positions, nodes]);

  return (
    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
      {/* Canvas for connections */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        width={1600}
        height={800}
      />
      {/* Node components positioned absolutely */}
      {Array.from(nodes.values()).map((node) => {
        const position = positions.get(node.id);
        if (!position) return null;
        return (
          <NodeComponent
            key={node.id}
            node={node}
            position={position}
            isSelected={node.id === selectedId}
          />
        );
      })}
      {/* Floating toolbar */}
      <FloatingToolbar />
      {/* Help button and popover */}
      {!isEditing && (
        <div className="absolute bottom-4 right-4 z-50">
          <div
            className="relative"
            onMouseEnter={() => setHelpOpen(true)}
            onMouseLeave={() => setHelpOpen(false)}
          >
            <button
              className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded shadow-lg text-sm font-semibold focus:outline-none"
              tabIndex={0}
            >
              Help
            </button>
            {helpOpen && (
              <div className="absolute bottom-12 right-0 w-max bg-slate-800/95 text-slate-200 text-xs px-4 py-3 rounded shadow-xl border border-slate-700 whitespace-nowrap transition-opacity duration-150">
                <div className="mb-1 font-bold text-white">Keyboard Shortcuts</div>
                <div>Tab: Create child</div>
                <div>Enter: Create sibling</div>
                <div>Shift+Space: Edit node</div>
                <div>Escape: Clear selection</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 