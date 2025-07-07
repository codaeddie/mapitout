/**
 * MapItOut Node Component
 * 
 * This component renders individual nodes in the mind map with proper styling,
 * selection states, and multi-line text editing capabilities.
 * Enhanced with visual polish, animations, and improved styling for Phase 4.
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
  onDragStart?: (id: string, e: React.MouseEvent) => void;
}

export const NodeComponent: React.FC<NodeComponentProps> = ({
  node,
  isSelected,
  onSelect,
  onDoubleClick,
  onDragStart,
}) => {
  const { updateNode } = useMapStore();
  const [editText, setEditText] = useState(node.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when editing starts
  useEffect(() => {
    if (node.isEditing && textareaRef.current) {
      // Use setTimeout to ensure the textarea is rendered
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (onDragStart && e.button === 0) {
      onDragStart(node.id, e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleTextareaBlur = () => {
    const sanitizedText = sanitizeNodeText(editText);
    updateNode(node.id, { 
      text: sanitizedText, 
      isEditing: false 
    });
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Shift+Enter: Create new line
        // Default behavior - let it create new line
      } else {
        // Regular Enter: Finish editing
        e.preventDefault();
        const sanitizedText = sanitizeNodeText(editText);
        updateNode(node.id, { 
          text: sanitizedText, 
          isEditing: false 
        });
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setEditText(node.text); // Reset to original text
      updateNode(node.id, { isEditing: false });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab: Finish editing and create child node
      const sanitizedText = sanitizeNodeText(editText);
      updateNode(node.id, { 
        text: sanitizedText, 
        isEditing: false 
      });
      
      // Create child node after a brief delay to ensure editing is finished
      setTimeout(() => {
        const { createNode } = useMapStore.getState();
        createNode('New Node', 'leaf');
      }, 10);
    }
  };

  const getNodeColor = (category: number) => {
    return NODE_COLORS[category as keyof typeof NODE_COLORS] || NODE_COLORS[0];
  };

  const nodeColor = getNodeColor(node.category);

  // Calculate dynamic height for multi-line text
  const getNodeHeight = () => {
    if (node.isEditing) {
      return 'auto';
    }
    
    const lineCount = (node.text.match(/\n/g) || []).length + 1;
    const baseHeight = 40; // Base height for single line
    const lineHeight = 20; // Additional height per line
    return Math.max(baseHeight, baseHeight + (lineCount - 1) * lineHeight);
  };

  // Enhanced styling based on node type and layout hints
  const getNodeStyle = () => {
    const baseStyle: React.CSSProperties = {
      left: node.x,
      top: node.y,
      borderColor: nodeColor,
      backgroundColor: `${nodeColor}10`,
      minHeight: getNodeHeight(),
      height: getNodeHeight(),
      transition: 'all 0.3s ease-in-out', // Smooth transitions for Phase 4
      boxShadow: isSelected 
        ? `0 4px 12px ${nodeColor}40, 0 0 0 2px ${nodeColor}` 
        : `0 2px 8px rgba(0, 0, 0, 0.1)`,
      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
    };

    // Enhanced styling for special node types
    if (node.layoutHints.isRoot) {
      baseStyle.borderWidth = '3px';
      baseStyle.boxShadow = `0 6px 16px ${nodeColor}50, 0 0 0 3px ${nodeColor}`;
    } else if (node.layoutHints.isHub) {
      baseStyle.borderWidth = '2px';
      baseStyle.backgroundColor = `${nodeColor}15`;
    } else if (node.layoutHints.isCommandHub) {
      baseStyle.borderWidth = '2px';
      baseStyle.backgroundColor = `${nodeColor}20`;
      baseStyle.borderStyle = 'dashed';
    }

    return baseStyle;
  };

  // Enhanced CSS classes based on node properties
  const getNodeClasses = () => {
    const baseClasses = [
      'node-base',
      'transition-all',
      'duration-300',
      'ease-in-out',
      'hover:shadow-lg',
      'hover:scale-105',
    ];

    if (isSelected) {
      baseClasses.push('node-selected', 'z-10');
    }

    baseClasses.push(`node-category-${node.category}`);

    if (node.layoutHints.manualPosition) {
      baseClasses.push('node-manual-position');
    }

    if (node.layoutHints.isRoot) {
      baseClasses.push('node-root');
    } else if (node.layoutHints.isHub) {
      baseClasses.push('node-hub');
    } else if (node.layoutHints.isCommandHub) {
      baseClasses.push('node-command-hub');
    }

    return baseClasses.join(' ');
  };

  return (
    <div
      className={getNodeClasses()}
      style={getNodeStyle()}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      data-node-id={node.id}
      data-layer={node.layoutHints.layer || 0}
      data-category={node.category}
      data-node-type={node.nodeType}
    >
      {node.isEditing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={handleTextareaChange}
          onBlur={handleTextareaBlur}
          onKeyDown={handleTextareaKeyDown}
          className="node-textarea"
          placeholder="Enter text... (Enter to finish, Shift+Enter for new line, Tab for child)"
          maxLength={500}
          rows={1}
          style={{
            minHeight: '32px',
            lineHeight: '1.2',
            transition: 'all 0.2s ease-in-out',
          }}
        />
      ) : (
        <div className="node-text">
          {node.text || 'Empty Node'}
        </div>
      )}
      
      {/* Enhanced manual position indicator */}
      {node.layoutHints.manualPosition && (
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white opacity-90 shadow-sm" 
          title="Manually positioned"
          style={{
            animation: 'pulse 2s infinite',
          }}
        />
      )}
      
      {/* Enhanced selection indicator */}
      {isSelected && (
        <div
          className="absolute -inset-2 rounded-lg border-2 border-white opacity-60 pointer-events-none"
          style={{ 
            zIndex: -1,
            animation: 'pulse 1.5s infinite',
          }}
        />
      )}

      {/* Node type indicators */}
      {node.layoutHints.isRoot && (
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-white opacity-90" title="Root Node" />
      )}
      
      {node.layoutHints.isHub && (
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-purple-500 rounded-full border-2 border-white opacity-90" title="Hub Node" />
      )}
      
      {node.layoutHints.isCommandHub && (
        <div className="absolute -top-2 -left-2 w-4 h-4 bg-green-500 rounded-full border-2 border-white opacity-90" title="Command Hub" />
      )}
    </div>
  );
}; 