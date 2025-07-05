/**
 * NodeLayer.tsx
 *
 * Renders DOM-based nodes as absolutely positioned <div>s for MapItOut.
 * Each node is positioned using transform: translate(x, y) and styled by category.
 * Handles click events for node selection and drag events for manual positioning.
 *
 * Update when: Modifying node rendering, selection logic, or category styling.
 */

import React from 'react';
import type { Node, NodeCategory } from '../../types';
import { NODE_COLORS } from '../../types';

interface NodeLayerProps {
  nodes: Map<string, Node>;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onUpdateNode?: (id: string, updates: Partial<Node>) => void;
  onDragStart?: (id: string, e: React.MouseEvent) => void;
  draggedNodeId?: string | null;
}

export const NodeLayer: React.FC<NodeLayerProps> = ({ nodes, selectedId, onSelect, onUpdateNode, onDragStart, draggedNodeId }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from(nodes.values()).map((node) => {
        const isSelected = node.id === selectedId;
        const isDragging = node.id === draggedNodeId;
        const color = NODE_COLORS[node.category as NodeCategory] || '#64748b';
        return (
          <div
            key={node.id}
            className={`pointer-events-auto px-3 py-2 rounded-lg border-2 font-medium text-sm select-none transition-all duration-200 absolute shadow-md ${isSelected ? 'border-white ring-2 ring-white' : 'border-gray-600'} ${isDragging ? 'ring-4 ring-blue-400 cursor-grabbing' : ''}`}
            style={{
              left: 0,
              top: 0,
              transform: `translate(${node.x}px, ${node.y}px)`,
              background: color + '22', // subtle background tint
              borderColor: color,
              zIndex: isSelected ? 2 : 1,
              minWidth: 100,
              maxWidth: 250,
              height: 40,
              cursor: isDragging ? 'grabbing' : 'pointer',
            }}
            tabIndex={0}
            aria-selected={isSelected}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(node.id);
            }}
            onMouseDown={onDragStart ? (e) => onDragStart(node.id, e) : undefined}
          >
            {node.isEditing ? (
              <input
                type="text"
                value={node.text}
                onChange={(e) => onUpdateNode?.(node.id, { text: e.target.value })}
                onBlur={() => onUpdateNode?.(node.id, { isEditing: false })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    onUpdateNode?.(node.id, { isEditing: false });
                  }
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    onUpdateNode?.(node.id, { isEditing: false });
                  }
                }}
                className="bg-transparent border-none outline-none text-white font-medium w-full"
                autoFocus
                style={{ fontSize: '14px' }}
              />
            ) : (
              <span className="text-white truncate block w-full" title={node.text}>{node.text}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}; 