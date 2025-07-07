/**
 * MapItOut Node Component - Simplified
 * 
 * This component renders individual nodes in the tree map with basic styling,
 * selection states, and text editing capabilities.
 * 
 * Update when: Modifying node appearance, adding new interaction behaviors, or changing styling.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useMapStore } from '../../stores/map-store';
import { useUIStore } from '../../stores/ui-store';
import { getNodeColorInfo } from '../../utils/tier-colors';
import type { Node, Position } from '../../types';

interface NodeComponentProps {
  node: Node;
  position: Position;
  isSelected: boolean;
  disableEditing?: boolean;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  position,
  isSelected,
  disableEditing = false,
}) => {
  const { updateNode, selectNode, nodes } = useMapStore();
  const { isEditing, editingNodeId, startEditing, stopEditing } = useUIStore();
  const [editText, setEditText] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isCurrentlyEditing = isEditing && editingNodeId === node.id;
  
  // Get tier-based color information
  const colorInfo = getNodeColorInfo(node.id, nodes);

  // Focus textarea when editing starts
  useEffect(() => {
    if (isCurrentlyEditing && textareaRef.current) {
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.select();
          
          // Auto-resize textarea to fit content
          const textarea = textareaRef.current;
          textarea.style.height = 'auto';
          textarea.style.height = `${textarea.scrollHeight}px`;
        }
      }, 0);
    }
  }, [isCurrentlyEditing]);

  // Update edit text when node text changes
  useEffect(() => {
    setEditText(node.text);
  }, [node.text]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    selectNode(node.id);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (disableEditing) return;
    e.stopPropagation();
    startEditing(node.id);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleTextareaBlur = () => {
    updateNode(node.id, { text: editText });
    stopEditing();
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: Create new line
        // Default behavior - let it create new line
      } else {
        // Regular Enter: Finish editing
        e.preventDefault();
        updateNode(node.id, { text: editText });
        stopEditing();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditText(node.text); // Reset to original text
      stopEditing();
    }
  };

  // Node positioning (only position and size in inline styles)
  const nodeStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x - (position.width / 2),
    top: position.y - (position.height / 2),
    width: position.width,
    height: position.height,
    zIndex: isSelected ? 10 : 1,
  };

  // CSS classes for styling
  const nodeClasses = [
    'node-base',
    colorInfo.cssClass,
    isSelected ? 'node-selected' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      style={nodeStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={nodeClasses}
    >
      {isCurrentlyEditing && !disableEditing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={handleTextareaChange}
          onBlur={handleTextareaBlur}
          onKeyDown={handleTextareaKeyDown}
          className="node-textarea"
          placeholder="Enter text..."
        />
      ) : (
        <div className="node-text w-full h-full flex items-center justify-center">
          {node.text}
        </div>
      )}
    </div>
  );
}; 