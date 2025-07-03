/**
 * MapItOut Node Component
 * 
 * This component renders individual nodes in the mind map with proper styling,
 * selection states, and text editing capabilities.
 * 
 * Update when: Modifying node appearance, adding new interaction behaviors, or changing styling.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useMapStore } from '../../stores';
import { NODE_COLORS } from '../../types';
import { sanitizeNodeText } from '../../utils';
import type { Node } from '../../types';

interface NodeComponentProps {
  node: Node;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDoubleClick: (id: string) => void;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  onSelect,
  onDoubleClick,
}) => {
  const { updateNode } = useMapStore();
  const [editText, setEditText] = useState(node.text);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (node.isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [node.isEditing]);

  // Update edit text when node text changes
  useEffect(() => {
    setEditText(node.text);
  }, [node.text]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(node.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick(node.id);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditText(e.target.value);
  };

  const handleInputBlur = () => {
    const sanitizedText = sanitizeNodeText(editText);
    updateNode(node.id, { 
      text: sanitizedText, 
      isEditing: false 
    });
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const sanitizedText = sanitizeNodeText(editText);
      updateNode(node.id, { 
        text: sanitizedText, 
        isEditing: false 
      });
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditText(node.text); // Reset to original text
      updateNode(node.id, { isEditing: false });
    }
  };

  const getNodeColor = (category: number) => {
    return NODE_COLORS[category as keyof typeof NODE_COLORS] || NODE_COLORS[0];
  };

  const nodeColor = getNodeColor(node.category);

  return (
    <div
      className={`
        node-base
        ${isSelected ? 'node-selected' : ''}
        node-category-${node.category}
      `}
      style={{
        left: node.x,
        top: node.y,
        borderColor: nodeColor,
        backgroundColor: `${nodeColor}10`,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      data-node-id={node.id}
      data-tier={node.tier}
      data-category={node.category}
    >
      {node.isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="
            bg-transparent border-none outline-none text-white
            font-medium text-sm w-full min-w-[80px] max-w-[200px]
            placeholder-slate-400
          "
          placeholder="Enter text..."
          maxLength={200}
        />
      ) : (
        <span className="text-white font-medium text-sm text-shadow">
          {node.text || 'Empty Node'}
        </span>
      )}
      
      {/* Selection indicator */}
      {isSelected && (
        <div
          className="absolute -inset-1 rounded-lg border-2 border-white opacity-50 pointer-events-none"
          style={{ zIndex: -1 }}
        />
      )}
    </div>
  );
}; 