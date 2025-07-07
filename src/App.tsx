/**
 * MapItOut Main Application Component
 * 
 * This is the root component of the MapItOut mind mapping application.
 * Provides a full viewport canvas with floating toolbar interface.
 * 
 * Update when: Modifying application structure, adding new global features, or changing layout.
 */

import { MapCanvas } from './components/MapCanvas';
import { useGlobalKeyboardListeners } from './hooks';
import useMapStore from './stores/map-store';
import { useEffect } from 'react';

function App() {
  // Initialize global keyboard listeners
  useGlobalKeyboardListeners();

  const nodes = useMapStore(state => state.nodes);
  const createNode = useMapStore(state => state.createNode);
  const resetForDevelopment = useMapStore(state => state.resetForDevelopment);

  // Development mode: reset state on mount for fresh development experience
  useEffect(() => {
    if (import.meta.env.DEV) {
      resetForDevelopment();
    }
  }, [resetForDevelopment]);

  // Automatically create root node on mount if none exists
  useEffect(() => {
    if (nodes.size === 0) {
      createNode('Root Node', 'root');
    }
  }, [nodes.size, createNode]);

  return (
    <div className="min-h-screen bg-slate-900 text-white relative">
      <div className="flex flex-col h-screen">
        {/* Main Canvas Area */}
        <main className="flex-1 relative overflow-hidden">
          <MapCanvas />
        </main>
      </div>
    </div>
  );
}

export default App;
