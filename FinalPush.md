# Final Push

## Current State vs Target State

### What You Have
- Basic node system with parent-child relationships
- Two simple layouts (center: left/right alternating, top: horizontal rows)
- Single node type (rounded rectangles)
- Canvas setup but **NO CONNECTIONS DRAWN**
- Basic interactions (select, edit, create)

### Target Output (Based on Reference Images)
- **Image 1**: Network graph with tags, curved connections, clustered layout
- **Image 2**: Hierarchical categories with colored sections, orthogonal connections
- **Image 3**: Radial/spider layout with curved paths radiating from center
- **Image 4**: Tree structure with consistent styling and branding

### Critical Gaps
1. **No connections** - This is the #1 issue. Without lines, it's just floating text
2. **Single node appearance** - Everything looks the same
3. **No visual hierarchy** - Flat appearance, no depth
4. **Basic layouts** - Current layouts need enhancement to match references

## Phase Plan

### Phase 1: Basic Connection System 
**Goal**: Get SOMETHING drawing between nodes. Without this, nothing else matters.

#### Implementation Details
- **File**: `src/components/MapCanvas.tsx`
- **Location**: Inside the `useEffect` at line ~296 that has `canvas.getContext('2d')`
- **After**: `ctx.clearRect(0, 0, canvas.width, canvas.height)`
- **Available Data**: Both `positions` and `nodes` are in scope

**Drawing Logic**:
1. Apply pan transform to canvas: `ctx.translate(pan.x, pan.y)`
2. Iterate through all nodes in the Map
3. For each node with a parent:
   - Get parent position from `positions` Map
   - Get child position from `positions` Map
   - Draw a line from parent center to child center

**Canvas Drawing Steps**:
```
ctx.save()
ctx.translate(pan.x, pan.y)  // CRITICAL: Match the node container transform
ctx.beginPath()
ctx.moveTo(parentPos.x, parentPos.y)
ctx.lineTo(childPos.x, childPos.y)
ctx.strokeStyle = '#64748b' // slate-600
ctx.lineWidth = 2
ctx.stroke()
ctx.restore()
```

**Validation**: Canvas element exists, positions Map has x,y coordinates, implementation point is clearly marked with comment `// (No connection lines)`

**Expected Result**: Gray lines connecting all parent-child nodes. The app will immediately look like a mind map.

---

### Phase 2: Bezier Curve Connections 
**Goal**: Replace straight lines with smooth curves matching all reference images.

#### 2.1 Connection Renderer Module
- **New File**: `src/utils/connection-renderer.ts`
- **Main Function**: `drawConnections(ctx, nodes, positions, layoutType, pan)`
- **Note**: Must pass pan offset to handle canvas transform

#### 2.2 Bezier Curve Mathematics
**For Center Layout** (horizontal movement):
- Nodes move left/right, so use horizontal S-curves
- Control points offset horizontally:
  - P1: `(parent.x + (child.x - parent.x) * 0.3, parent.y)`
  - P2: `(parent.x + (child.x - parent.x) * 0.7, child.y)`

**For Top Layout** (vertical movement):
- Nodes move up/down, so use vertical S-curves
- Control points offset vertically:
  - P1: `(parent.x, parent.y + (child.y - parent.y) * 0.3)`
  - P2: `(child.x, parent.y + (child.y - parent.y) * 0.7)`

**Canvas Implementation**:
```
ctx.save()
ctx.translate(pan.x, pan.y)
ctx.beginPath()
ctx.moveTo(start.x, start.y)
ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, end.x, end.y)
ctx.stroke()
ctx.restore()
```

#### 2.3 Connection Styling
- Line width based on tier (thicker near root)
- Color matches parent node's tier color (use `getTierColorScheme` from `tier-colors.ts`)
- Optional: Calculate edge-to-edge connections using position.width/height

**Validation**: Layout-specific curves match node movement patterns. Math for control points creates proper S-curves.

**Expected Result**: Smooth, professional curves between all nodes.

---

### Phase 3: Node Type System 
**Goal**: Different node types for different purposes, matching reference variety.

#### 3.1 Update Data Model
- **File**: `src/types/index.ts`
- Add to Node interface: `nodeType?: 'standard' | 'tag' | 'header' | 'category'`
- Default to 'standard' for backward compatibility
- Add: `displayStyle?: { icon?: string, minWidth?: number, minHeight?: number }`

#### 3.2 Node Rendering Strategy
- **Update**: `src/components/nodes/NodeComponent.tsx`
- **Approach**: Branch rendering within NodeComponent rather than separate files
- Already has tier detection via `getNodeColorInfo()`
- Detect `nodeType` and render differently:
  - **Tag**: Small pill, minimal padding, inline-block style
  - **Header**: Large text, bold, no border
  - **Category**: Container with background, contains other nodes
  - **Standard**: Current rounded rectangle

#### 3.3 Size Calculations
- **Update**: `src/utils/layout-engines.ts`
- Modify `getNodeWidth()` and `getNodeHeight()` to accept node parameter
- Check node.nodeType:
  - Tags: `text.length * 6 + 20` (smaller multiplier)
  - Headers: `text.length * 12 + 40` (larger)
  - Categories: Calculate based on children bounds
  - Standard: Current calculation

#### 3.4 Visual Hierarchy
- Implement tier-based sizing:
  - Root: 100% size
  - Tier 1: 90% size
  - Tier 2: 80% size
  - Tier 3+: 70% size
- Font weight decreases with depth

**Validation**: Node interface can be extended without breaking existing code. NodeComponent already has branching logic for tiers.

**Expected Result**: Visual variety matching reference images, clear hierarchy.

---

### Phase 4: Category Containers
**Goal**: Implement the grouped sections 

#### 4.1 Container Detection
- Nodes with `nodeType: 'category'` become containers
- Calculate bounding box of all descendant nodes recursively
- Add padding around bounds

#### 4.2 Background Rendering
- **Location**: Same canvas, after clear, before connections
- **Order**: 
  1. Clear canvas
  2. Draw category backgrounds
  3. Draw connections
  4. Nodes render via React
- Draw rounded rectangle with semi-transparent fill
- Use node's tier color at 10% opacity
- Subtle border matching tier color

#### 4.3 Layout Adjustments
- Category nodes don't participate in normal layout
- Their position is calculated from children center
- Children layout within category bounds

**Validation**: Single canvas can handle multiple drawing passes. Draw order ensures proper layering.

**Expected Result**: Visual grouping boxes.

---

### Phase 5: Polish & Professional Styling
**Goal**: Match the professional appearance of reference images.

#### 5.1 Enhanced Node Styling
- **CSS Gradients**: Use in NodeComponent styles
- **Shadows**: CSS box-shadow for depth (stronger on hover)
- **Borders**: 2px solid with 1px lighter inner border
- **Hover Effects**: Scale to 105%, increase shadow

#### 5.2 Connection Enhancements
- **Canvas Gradients**: Use `ctx.createLinearGradient()` along path
- **Glow Effect**: Set `ctx.shadowBlur` before stroke
- **Arrow Heads**: Small triangles at connection endpoints

#### 5.3 Canvas Improvements
- **Background**: Draw dot grid pattern before everything else
- **Vignette**: Darker edges using radial gradient
- **Anti-aliasing**: Handle device pixel ratio for sharp rendering

**Validation**: Both CSS and Canvas API support all required effects.

**Expected Result**: Professional, polished appearance matching references.

---

## Critical Implementation Notes

### Pan Transform Handling
The node container uses `transform: translate(${pan.x}px, ${pan.y}px)` which means:
- **Canvas connections MUST apply the same transform**: `ctx.translate(pan.x, pan.y)`
- Always save/restore context when applying transforms
- Pass pan offset to any utility functions that draw

### Dynamic Canvas Sizing
- Canvas uses window dimensions, not hardcoded 800x400
- Layout engines should accept canvas size as parameter
- Update `CANVAS_CENTER_X` and `CANVAS_CENTER_Y` to be dynamic

### Rendering Order
1. Clear canvas
2. Apply pan transform
3. Draw background elements (grid, categories)
4. Draw connections
5. Restore transform
6. React renders nodes (they handle their own transform)

### Color Consistency
- Use existing `getTierColorScheme()` from `tier-colors.ts`
- Tier colors: H1/H2 (orange), H3 (red), H4 (blue), H5 (green), H6 (purple), H7+ (amber)
- Keep consistent opacity (10% for backgrounds, 100% for borders)

---

## Implementation Order & Testing

### 1: Foundation 
1. **Phase 1**: Basic Connections 
   - Test: Lines appear between all nodes
   - Verify: Pan/zoom still works correctly
2. **Phase 2**: Bezier Curves 
   - Test: Smooth curves replace straight lines
   - Verify: Curves adapt to layout type

### 2: Enhancement 
3. **Phase 3**: Node Types 
   - Test: Different node appearances based on type
   - Verify: Layouts handle different sizes correctly
4. **Phase 4**: Categories 
   - Test: Container nodes show backgrounds
   - Verify: Children contained within bounds

### 3: Polish 
5. **Phase 5**: Professional Styling 
   - Test: Matches reference image quality
   - Verify: Performance remains smooth

## Technical Considerations

### Performance
- Canvas rendering in `useEffect` with proper dependencies
- Consider `requestAnimationFrame` for animations
- Limit shadow/gradient effects based on node count
- Profile with 100+ nodes

### Architecture
- Keep layout engines pure (no side effects)
- Connection renderer separate from node renderer
- Style calculations separate from position calculations
- Maintain single source of truth (node relationships)

### Browser Compatibility
- Canvas API is well supported
- Use `ctx.ellipse()` fallback to `ctx.arc()` if needed
- Test on different DPI displays (handle `window.devicePixelRatio`)
- Handle touch events for mobile

## Validation Checkpoints

After each phase, the app should:
1. Still build without errors
2. Render something visible
3. Maintain all previous functionality
4. Look progressively more like reference images

The goal is **working software after each phase**, not perfect code that doesn't run.

---

## Future Work

### Radial Layout Engine
**Goal**: Implement the spider/radial layout from Image 3 for distinctive visualization options.

#### Implementation Overview
- **New File**: `src/utils/layout-engines/radial-layout.ts`
- **Algorithm**: Position nodes in concentric circles using polar coordinates
- **Integration**: Add to layout switcher as third option

#### Implementation Notes When Ready
1. Place root at canvas center
2. Calculate tier for each node
3. Position using: `x = centerX + radius * cos(angle)`, `y = centerY + radius * sin(angle)`
4. Handle text rotation for readability
5. Implement force-directed adjustments to prevent overlap