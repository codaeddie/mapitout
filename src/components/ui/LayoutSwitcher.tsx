/**
 * Layout Switcher Component - Simplified
 * 
 * This component provides buttons to switch between the two supported layout types.
 * 
 * Update when: Adding new layout types or modifying layout switching behavior.
 */

import React from 'react';
import { useMapStore } from '../../stores/map-store';

const layoutOptions = [
  { key: 'center', label: 'Center', icon: '🎯', description: 'Mind map style with center root' },
  { key: 'top', label: 'Top', icon: '🌳', description: 'Hierarchical tree from top' },
];

export const LayoutSwitcher: React.FC = () => {
  const { layoutType, setLayoutType } = useMapStore();

  return (
    <div className="flex items-center space-x-1">
      <span className="text-slate-400 text-sm mr-2">Layout:</span>
      {layoutOptions.map((option) => (
        <button
          key={option.key}
          onClick={() => setLayoutType(option.key as 'center' | 'top')}
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