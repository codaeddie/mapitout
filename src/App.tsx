/**
 * MapItOut Main Application Component - Simplified
 * 
 * This is the root component of the MapItOut tree mapping application.
 * Provides a full viewport canvas with floating toolbar interface.
 * 
 * Update when: Modifying application structure, adding new global features, or changing layout.
 */

import { MapCanvas } from './components/MapCanvas';

function App() {
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
