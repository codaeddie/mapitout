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

function App() {
  // Initialize global keyboard listeners
  useGlobalKeyboardListeners();
  
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="flex flex-col h-screen">
        {/* Header/Toolbar */}
        <Toolbar />
        
        {/* Main Canvas Area */}
        <main className="flex-1 relative overflow-hidden">
          <MapCanvas />
        </main>
      </div>
    </div>
  );
}

export default App;
