/**
 * MapCanvas.tsx
 *
 * Main container for the MapItOut mind map. Combines ConnectionLayer and NodeLayer.
 * Manages viewport and zoom transforms, and handles mouse events for pan, zoom, node selection, and node dragging.
 *
 * Update when: Modifying canvas structure, viewport logic, or event handling.
 */

import React, { useRef, useState, useCallback } from 'react';
import useMapStore from '../stores/map-store';
import useUIStore from '../stores/ui-store';
import { ConnectionLayer } from './canvas/ConnectionLayer';
import { NodeLayer } from './canvas/NodeLayer';
import type { ViewBox } from '../types';

const CANVAS_WIDTH = 1600;
const CANVAS_HEIGHT = 1200;

export const MapCanvas: React.FC = () => {
  const {
    nodes,
    connections,
    viewBox,
    zoomLevel,
    selectedId,
    selectNode,
    setViewBox,
    setZoom,
    updateNodePosition,
  } = useMapStore();

  const {
    isDragging,
    draggedNodeId,
    dragStartPos,
    dragOffset,
    startDragging,
    updateDragOffset,
    stopDragging,
  } = useUIStore();

  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<{ x: number; y: number } | null>(null);
  const viewBoxStart = useRef<ViewBox | null>(null);

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
      updateNodePosition(draggedNodeId, node.x + dx, node.y + dy);
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
      stopDragging();
    }
    setIsPanning(false);
    panStart.current = null;
    viewBoxStart.current = null;
  };

  // Mouse wheel to zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(zoomLevel + delta);
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
      className={`relative w-full h-full bg-gray-900 overflow-hidden select-none ${isDragging ? 'cursor-grabbing' : ''}`}
      style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onClick={handleBackgroundClick}
      tabIndex={0}
    >
      <div
        className="absolute left-0 top-0"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform,
          transformOrigin: 'top left',
          pointerEvents: 'auto', // Allow pointer events to reach nodes
        }}
      >
        <ConnectionLayer
          connections={connections}
          nodes={nodes}
          viewBox={viewBox}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />
        <NodeLayer
          nodes={nodes}
          selectedId={selectedId}
          onSelect={handleNodeSelect}
          onDragStart={handleNodeDragStart}
          draggedNodeId={draggedNodeId}
        />
      </div>
    </div>
  );
}; 