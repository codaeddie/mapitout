/**
 * Layout Switcher Component
 * 
 * This component provides buttons to switch between different layout types.
 * Each layout type has different connection behaviors and visual styles.
 * 
 * Update when: Adding new layout types or modifying layout switching behavior.
 */

import React from 'react';
import { useMapStore } from '../../stores';

const layoutOptions = [
  { key: 'hierarchical', label: 'Tree', icon: '🌳', description: 'Hierarchical tree structure' },
  { key: 'web', label: 'Web', icon: '🕸️', description: 'Hub-spoke network' },
  { key: 'snake', label: 'Flow', icon: '🐍', description: 'Force-directed flow' },
  { key: 'command', label: 'Command', icon: '⚙️', description: 'Parameter grouping' },
];

export const LayoutSwitcher: React.FC = () => {
  const { layoutType, setLayoutType } = useMapStore();

  return (
    <div className="flex items-center space-x-1">
      <span className="text-slate-400 text-sm mr-2">Layout:</span>
      {layoutOptions.map((option) => (
        <button
          key={option.key}
          onClick={() => setLayoutType(option.key)}
          className={`
            flex items-center space-x-1 px-2 py-1 rounded text-sm font-medium transition-colors
            ${layoutType === option.key
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
            }
          `}
          title={option.description}
        >
          <span className="text-xs">{option.icon}</span>
          <span className="hidden sm:inline">{option.label}</span>
        </button>
      ))}
    </div>
  );
}; 