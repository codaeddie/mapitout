# mapitout
Chaos mapped



# MapItOut - Software Design Document

## Executive Summary

MapItOut is a web-based knowledge graph builder that creates professional, structured mind maps similar to cybersecurity tool diagrams and technical documentation visuals. The tool prioritizes speed of creation, visual clarity, and professional aesthetics over organic mind mapping approaches.

### Core Value Proposition

- **Rapid Knowledge Structuring**: Build complex hierarchical information maps in minutes
- **Professional Output**: Generate publication-ready visuals for technical documentation
- **Keyboard-Driven Speed**: Hot-key based creation for maximum velocity
- **Export Ready**: PNG download for presentations and documentation

------

## Visual Design System

### Color Palette (Based on Reference Images)

**Primary Colors:**

- **Central Hub**: `#f97316` (Orange) - Main concept nodes
- **Category 1**: `#ef4444` (Red) - High-priority categories
- **Category 2**: `#3b82f6` (Blue) - Secondary categories
- **Category 3**: `#10b981` (Green) - Supporting categories
- **Category 4**: `#8b5cf6` (Purple) - Specialized categories
- **Category 5**: `#f59e0b` (Amber) - Additional categories

**Supporting Colors:**

- **Background**: `#0f172a` (Dark Slate) - Deep professional dark
- **Node Border**: `#1e293b` (Slate 800) - Subtle node outlines
- **Connection Lines**: `#64748b` (Slate 500) - Connecting paths
- **Text**: `#f1f5f9` (Slate 100) - High contrast text
- **UI Elements**: `#334155` (Slate 700) - Buttons, controls

### Typography

- **Node Text**: `font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 500`
- **Category Headers**: `font-size: 16px; font-weight: 600`
- **Central Node**: `font-size: 18px; font-weight: 700`

### Node Design

- **Shape**: Rounded rectangles with `border-radius: 8px`
- **Size**: Dynamic width (min: 100px, max: 250px), fixed height: 40px
- **Borders**: 2px solid, color matches node category
- **Hover State**: Subtle glow effect using `box-shadow`
- **Selected State**: Bright border with `border-width: 3px`

------

## Technical Architecture

### Core Technologies

- **Imports:** `uv` only. No `npm`.  
- **Frontend**: React 18 with hooks
- **Styling**: Tailwind CSS 4.x
- **Canvas**: HTML5 Canvas for connections, DOM nodes for text
- **State Management**: Zustand for global state
- **Export**: html2canvas for PNG generation
- **Deployment**: Vercel (already configured)

### Data Structure

```typescript
interface Node {
  id: string;                    // Unique identifier
  text: string;                  // Display text
  x: number;                     // X coordinate
  y: number;                     // Y coordinate
  parentId: string | null;       // Parent node ID
  children: string[];            // Child node IDs
  tier: number;                  // Depth level (0 = root)
  category: number;              // Color category (0-5)
  isEditing: boolean;            // Edit mode state
  angle?: number;                // Radial position angle
  radius?: number;               // Distance from parent
}

interface MapState {
  nodes: Map<string, Node>;      // All nodes
  rootId: string;                // Root node ID
  selectedId: string | null;     // Currently selected node
  viewBox: {x: number, y: number, width: number, height: number};
  zoomLevel: number;
  isDragging: boolean;
  dragOffset: {x: number, y: number};
}
```

### Component Architecture

```
App
├── MapCanvas
│   ├── ConnectionLayer (SVG)
│   ├── NodeLayer (DOM)
│   └── InteractionLayer (Events)
├── Toolbar
│   ├── ZoomControls
│   ├── ExportButton
│   └── ResetButton
└── KeyboardHandler
```

------

## User Interaction Model

### Node Creation Flow

1. **Start**: Single central node with placeholder text
2. **Selection**: Click node to select (visual highlight)
3. **Child Creation**: Tab key creates child node at next tier
4. **Sibling Creation**: Shift+Space creates sibling node at same tier
5. **Text Editing**: Enter key activates inline editing
6. **Navigation**: Arrow keys traverse between nodes

### Keyboard Shortcuts

| Key             | Action              | Context                  |
| --------------- | ------------------- | ------------------------ |
| `Tab`           | Create child node   | Node selected            |
| `Shift + Space` | Create sibling node | Node selected            |
| `Enter`         | Start text editing  | Node selected            |
| `Enter`         | New line in text    | Text editing mode        |
| `Escape`        | Exit text editing   | Text editing mode        |
| `Delete`        | Delete node         | Node selected (non-root) |
| `Arrow Keys`    | Navigate nodes      | Node selected            |
| `+` / `-`       | Zoom in/out         | Global                   |
| `Space`         | Pan mode toggle     | Global                   |
| `Ctrl + z`      | Undo                | Global                   |
| `Ctrl + x`      | Redo                | Global                   |

### Mouse Interactions

| Action            | Result                         |
| ----------------- | ------------------------------ |
| Click node        | Select node                    |
| Double-click node | Start text editing             |
| Click empty space | Deselect all                   |
| Drag node         | Move node (manual positioning) |
| Mouse wheel       | Zoom in/out                    |
| Middle-click drag | Pan canvas                     |

------

## Layout Algorithm

### Radial Layout System

**Central Node Positioning:**

- Root node at canvas center `(800, 600)`
- Fixed position, unmovable

**Tier 1 (Primary Categories):**

- Positioned in circle around root
- Radius: 200px from center
- Even angular distribution: `360° / nodeCount`
- Color assignment: Sequential through color palette

**Tier 2+ (Sub-categories):**

- Positioned relative to parent node
- Radius: 150px from parent
- Angular spread: ±60° from parent's angle
- Color inheritance: Same as parent category

**Algorithm Implementation:**

```javascript
function calculateNodePosition(node, parent) {
  if (node.tier === 0) return { x: 800, y: 600 }; // Root
  
  if (node.tier === 1) {
    // Primary categories - circle around root
    const angle = (node.siblingIndex * 2 * Math.PI) / parent.children.length;
    const radius = 200;
    return {
      x: 800 + Math.cos(angle) * radius,
      y: 600 + Math.sin(angle) * radius
    };
  }
  
  // Sub-categories - arc around parent
  const baseAngle = parent.angle || 0;
  const spread = Math.PI / 3; // 60 degrees
  const angleStep = spread / (parent.children.length - 1);
  const nodeAngle = baseAngle - spread/2 + (node.siblingIndex * angleStep);
  const radius = 150;
  
  return {
    x: parent.x + Math.cos(nodeAngle) * radius,
    y: parent.y + Math.sin(nodeAngle) * radius
  };
}
```

### Manual Fine-Tuning

- Drag nodes to override automatic positioning
- Maintain parent-child relationships
- Snap to grid (optional, 20px grid)
- Collision detection and avoidance

------

## State Management

### Zustand Store Structure

```javascript
const useMapStore = create((set, get) => ({
  // Core state
  nodes: new Map(),
  rootId: null,
  selectedId: null,
  
  // View state
  viewBox: { x: 0, y: 0, width: 1600, height: 1200 },
  zoomLevel: 1,
  
  // Actions
  createNode: (parentId, text = 'New Node') => {
    const parent = get().nodes.get(parentId);
    const newNode = {
      id: nanoid(),
      text,
      parentId,
      children: [],
      tier: parent ? parent.tier + 1 : 0,
      category: parent ? parent.category : 0,
      isEditing: false,
      ...calculatePosition(parent)
    };
    
    set(state => {
      const newNodes = new Map(state.nodes);
      newNodes.set(newNode.id, newNode);
      
      if (parent) {
        const updatedParent = { ...parent, children: [...parent.children, newNode.id] };
        newNodes.set(parentId, updatedParent);
      }
      
      return { nodes: newNodes, selectedId: newNode.id };
    });
  },
  
  updateNode: (id, updates) => {
    set(state => {
      const newNodes = new Map(state.nodes);
      const node = newNodes.get(id);
      newNodes.set(id, { ...node, ...updates });
      return { nodes: newNodes };
    });
  },
  
  deleteNode: (id) => {
    // Implementation with cascade delete of children
  },
  
  selectNode: (id) => set({ selectedId: id }),
  
  setZoom: (level) => set({ zoomLevel: Math.max(0.1, Math.min(3, level)) })
}));
```

------

## Rendering System

### Canvas Architecture

**Two-Layer Approach:**

1. **SVG Layer**: Connection lines and background elements
2. **DOM Layer**: Node elements for text rendering and interaction

**Connection Rendering:**

```javascript
function renderConnection(parent, child) {
  const controlPointX = (parent.x + child.x) / 2;
  const controlPointY = (parent.y + child.y) / 2;
  
  return `
    <path
      d="M ${parent.x} ${parent.y} Q ${controlPointX} ${controlPointY} ${child.x} ${child.y}"
      stroke="#64748b"
      stroke-width="2"
      fill="none"
      opacity="0.8"
    />
  `;
}
```

**Node Rendering:**

```jsx
function NodeComponent({ node, isSelected, onSelect, onEdit }) {
  return (
    <div
      className={`
        absolute transform -translate-x-1/2 -translate-y-1/2 
        px-3 py-2 rounded-lg border-2 cursor-pointer
        ${isSelected ? 'border-white' : 'border-gray-600'}
        ${getCategoryColor(node.category)}
        hover:shadow-lg transition-all duration-200
      `}
      style={{ left: node.x, top: node.y }}
      onClick={() => onSelect(node.id)}
      onDoubleClick={() => onEdit(node.id)}
    >
      {node.isEditing ? (
        <input
          value={node.text}
          onChange={(e) => updateNode(node.id, { text: e.target.value })}
          onBlur={() => updateNode(node.id, { isEditing: false })}
          onKeyDown={handleEditKeyDown}
          className="bg-transparent border-none outline-none text-white"
          autoFocus
        />
      ) : (
        <span className="text-white font-medium">{node.text}</span>
      )}
    </div>
  );
}
```

------

## Export System

### PNG Export Implementation

```javascript
async function exportMapAsPNG() {
  const mapContainer = document.getElementById('map-container');
  
  // Configure html2canvas options
  const options = {
    backgroundColor: '#0f172a',
    scale: 2, // High DPI
    useCORS: true,
    logging: false,
    width: 1600,
    height: 1200
  };
  
  try {
    const canvas = await html2canvas(mapContainer, options);
    
    // Download as PNG
    const link = document.createElement('a');
    link.download = `mindmap-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    // Optional: Also export as JSON for re-importing
    const jsonData = {
      nodes: Array.from(get().nodes.entries()),
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0'
      }
    };
    
    const jsonLink = document.createElement('a');
    jsonLink.download = `mindmap-${Date.now()}.json`;
    jsonLink.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(jsonData, null, 2));
    jsonLink.click();
  } catch (error) {
    console.error('Export failed:', error);
  }
}
```

## Performance Optimizations

### Memory Management

- **Node Cleanup**: Remove deleted nodes from all references
- **Event Listeners**: Clean up keyboard/mouse listeners on unmount
- **Image Caching**: Cache exported images to avoid re-processing

## Success Metrics

### Functional Requirements

- **Creation Speed**: Build 20+ node map in under 5 minutes
- **Export Quality**: PNG output at 300 DPI suitable for presentations
- **Responsiveness**: All interactions < 100ms response time
- **Browser Support**: Works in Chrome, Firefox, Safari, Edge

### Technical Requirements

- **Performance**: 60 FPS rendering with 100+ nodes
- **Memory**: < 100MB RAM usage for typical maps
- **Bundle Size**: < 2MB total JavaScript
- **Accessibility**: Keyboard navigation, screen reader support

## Risk Assessment

### Technical Risks

- Canvas Performance

    : Large node counts may cause slowdowns

    - *Mitigation*: Implement virtualization early

- Export Quality

    : html2canvas may not capture all visual elements

    - *Mitigation*: Test export functionality with complex maps

- Browser Compatibility

    : Different rendering behaviors across browsers

    - *Mitigation*: Cross-browser testing during development

### User Experience Risks

- Learning Curve

    : Keyboard shortcuts may be unfamiliar

    - *Mitigation*: On-screen help and progressive disclosure

- Layout Complexity

    : Automatic positioning may not always be optimal

    - *Mitigation*: Manual override capabilities

## Conclusion

MapItOut focuses on rapid creation of professional knowledge graphs with a clean, technical aesthetic. The design prioritizes speed, visual clarity, and export quality over complex features. The phased development approach ensures core functionality is solid before adding enhancements.

The tool will serve as a foundation for creating structured visual documentation that matches the professional quality of the reference cybersecurity diagrams while providing the speed and flexibility needed for rapid knowledge capture and organization.
