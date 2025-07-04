/**
 * MapItOut Main Application Component
 * 
 * This is the root component of the MapItOut mind mapping application.
 * Sets up the overall layout with toolbar and canvas, and initializes
 * global keyboard listeners for the application.
 * 
 * Update when: Modifying application structure, adding new global features, or changing layout.
 */


import { MapCanvas } from './components/MapCanvas';
import { Toolbar } from './components/ui';
import { useGlobalKeyboardListeners } from './hooks';
import useMapStore from './stores/map-store';
import React, { useEffect } from 'react';

function App() {
  // Initialize global keyboard listeners
  useGlobalKeyboardListeners();

  const nodes = useMapStore(state => state.nodes);
  const rootId = useMapStore(state => state.rootId);
  const createNode = useMapStore(state => state.createNode);

  // Automatically create root node on mount if none exists
  useEffect(() => {
    if (nodes.size === 0) {
      createNode('', 'Root Node');
    }
  }, [nodes.size, createNode]);

  const handleAddNode = () => {
    if (rootId) {
      createNode(rootId, 'New Node');
    }
  };

  const handleCreateRoot = () => {
    createNode('', 'Root Node');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="flex flex-col h-screen">
        {/* Header/Toolbar */}
        <Toolbar />

        {/* Root Node Creation Button (only if no nodes) */}
        {nodes.size === 0 && (
          <div className="p-2 bg-gray-800 flex items-center gap-2">
            <button
              className="px-4 py-2 bg-green-600 rounded text-white hover:bg-green-700 transition"
              onClick={handleCreateRoot}
            >
              Create Root Node
            </button>
            <span className="text-xs text-gray-400">(Start your map)</span>
          </div>
        )}

        {/* Add Node Button for Testing (only if root exists) */}
        {rootId && (
          <div className="p-2 bg-gray-800 flex items-center gap-2">
            <button
              className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700 transition"
              onClick={handleAddNode}
            >
              Add Node
            </button>
            <span className="text-xs text-gray-400">(Creates child of root)</span>
          </div>
        )}

        {/* Main Canvas Area */}
        <main className="flex-1 relative overflow-hidden">
          <MapCanvas />
        </main>
      </div>
    </div>
  );
}

export default App;
