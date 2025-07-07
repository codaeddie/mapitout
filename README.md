# MapItOut

Keyboard-driven mind mapping. Tab for children, Enter for siblings. That's it.

## What it actually does

Creates hierarchical node trees you can visualize two ways - center (mind map) or top (org chart). Navigate with arrow keys, pan with middle mouse, export to PNG. Positions are calculated every frame, never stored.

## Setup

```bash
# Install dependencies
npm install

# Run it
npm run dev

# Build for production
npm run build
```

## Controls

- **Tab**: Create child node
- **Enter**: Create sibling node  
- **Shift+Space**: Edit selected node
- **Delete/Backspace**: Delete node
- **Arrow keys**: Navigate between nodes (kinda broken)
- **Escape**: Clear selection
- **Middle mouse drag**: Pan around
- **H**: Toggle help

The UI has:
- Layout switcher (center/top view)
- Export PNG button
- Home button (centers on root)
- Hand/Select mode toggle

## Files that matter

- `src/components/MapCanvas.tsx`: Main canvas and rendering
- `src/stores/map-store.ts`: Node data and state (Zustand)
- `src/utils/layout-engines.ts`: Position calculation algorithms
- `src/hooks/use-keyboard-navigation.ts`: Keyboard event handling
- `src/types/index.ts`: TypeScript interfaces

## How it works

1. Nodes only store structure:
   ```typescript
   {
     id: string,
     text: string,
     parent: string | null,
     children: string[]
   }
   ```

2. Every render frame:
   - Layout engine calculates all positions
   - Canvas renders nodes at calculated positions
   - Draws connections between parent/child

3. No position storage = no position bugs = instant layout switching

## Current issues

- Arrow key navigation logic is wonky between tiers
- No undo/redo (Ctrl+Z does nothing)
- Performance tanks after ~200 nodes
- Text editing is single-line only
- Export quality could be better

## Config

No config file yet. Canvas size is hardcoded to 1600x800. Colors are in the components. Deal with it.

## Local storage

Saves your map to localStorage automatically. Clear your browser data to reset.

## Architecture decisions

**Why positions aren't stored:**
Every other mind mapping tool stores x,y coordinates with nodes. This creates sync bugs, makes layout changes hard, and generally sucks. We calculate positions from structure every frame instead. Slightly less efficient, way more reliable.

**Why only two layouts:**
Because 47 layout options is how you end up with Visio. Center for brainstorming, top for hierarchies. Done.

**Why Zustand over Redux:**
Because Redux for a tree of nodes is like bringing a tank to a knife fight.

## Maybe

- Undo/redo stack
- Better arrow key navigation 
- Collapsible nodes
- Multi-line text editing
- SVG export option
- Search nodes
- Better colors/themes