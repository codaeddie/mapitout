/**
 * MapItOut Node Layer Component
 * 
 * This component renders all nodes in the mind map with proper positioning.
 * Handles node selection, editing, and interaction events.
 * 
 * Update when: Modifying node rendering logic, adding new interaction behaviors, or changing node layout.
 */

import React from 'react';
import { useMapStore } from '../../stores';
import { NodeComponent } from '../nodes/NodeComponent';
import { useVirtualizedNodes } from '../../hooks/use-node-positioning';


interface NodeLayerProps {
  width: number;
  height: number;
}

export const NodeLayer: React.FC<NodeLayerProps> = () => {
  const { selectedId, selectNode, updateNode } = useMapStore();

  const handleNodeSelect = (id: string) => {
    selectNode(id);
  };

  const handleNodeDoubleClick = (id: string) => {
    updateNode(id, { isEditing: true });
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    // Only deselect if clicking on the canvas background, not on a node
    if (e.target === e.currentTarget) {
      selectNode('');
    }
  };

  // Convert nodes Map to array for rendering
  const visibleNodes = useVirtualizedNodes();
  const nodesArray = Array.from(visibleNodes.values());

  return (
    <div
      className="absolute inset-0 pointer-events-auto"
      style={{ zIndex: 1 }}
      onClick={handleCanvasClick}
    >
      {nodesArray.map((node) => (
        <NodeComponent
          key={node.id}
          node={node}
          isSelected={selectedId === node.id}
          onSelect={handleNodeSelect}
          onDoubleClick={handleNodeDoubleClick}
        />
      ))}
    </div>
  );
}; 