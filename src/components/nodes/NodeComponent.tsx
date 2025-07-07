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
import type { Node, Position } from '../../types';

interface NodeComponentProps {
  node: Node;
  position: Position;
  isSelected: boolean;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  position,
  isSelected,
}) => {
  const { updateNode, selectNode } = useMapStore();
  const { isEditing, editingNodeId, startEditing, stopEditing } = useUIStore();
  const [editText, setEditText] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isCurrentlyEditing = isEditing && editingNodeId === node.id;

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

  // Node styling
  const nodeStyle: React.CSSProperties = {
    position: 'absolute',
    left: position.x - (position.width / 2),
    top: position.y - (position.height / 2),
    width: position.width,
    height: position.height,
    border: isSelected ? '2px solid #3b82f6' : '1px solid #64748b',
    backgroundColor: isSelected ? '#1e293b' : '#334155',
    borderRadius: '8px',
    padding: '8px 12px',
    color: 'white',
    fontSize: '14px',
    lineHeight: '1.4',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxShadow: isSelected 
      ? '0 4px 12px rgba(59, 130, 246, 0.3)' 
      : '0 2px 8px rgba(0, 0, 0, 0.1)',
    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
    zIndex: isSelected ? 10 : 1,
  };

  return (
    <div
      style={nodeStyle}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className="node-component"
    >
      {isCurrentlyEditing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={handleTextareaChange}
          onBlur={handleTextareaBlur}
          onKeyDown={handleTextareaKeyDown}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'white',
            fontSize: '14px',
            lineHeight: '1.4',
            resize: 'none',
            fontFamily: 'inherit',
          }}
          placeholder="Enter text..."
        />
      ) : (
        <div style={{ 
          width: '100%', 
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}>
          {node.text}
        </div>
      )}
    </div>
  );
}; 