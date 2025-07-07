# Structured Tree Map Tool - Implementation Design Document v2

## 📋 Overview & Purpose

### Core Concept (Unchanged)

A visual tree mapping tool for organizing complex systems, technical knowledge, and hierarchical information. Inspired by hacker culture's approach to understanding dense information through visual tree traversal.

### What Makes This Different

- **Not a generic mind mapper** - Specifically designed for technical documentation
- **Two focused layouts** - Not trying to be everything
- **Keyboard-first** - Rapid creation without mouse gymnastics
- **Professional output** - Export-ready for documentation

------

## 🧠 Implementation Philosophy

### Learning from the Giants

**Markmap's Approach:**

- Single source of truth: Markdown structure
- Zero stored positions - everything calculated
- One layout, perfected
- Positions are ephemeral, regenerated every render

**Miro's Approach:**

- Nodes know relationships, not positions
- Internal engine handles all spatial logic
- Direction-aware positioning (left/right, top/bottom)
- Consistent spacing rules applied automatically

**Our Approach:**

- Hybrid: Interactive creation (like Miro) with calculated layouts (like markmap)
- Structure is permanent, positions are temporary
- Two specific layouts, not generic "anything goes"
- Keyboard-driven for speed

------

## 🏗️ Core Architecture

### Data Model Philosophy

**What We Store (Permanent):**

```
Node: {
  id: string              // Unique identifier
  text: string            // Display content
  children: string[]      // Child node IDs
  parent: string | null   // Parent node ID
  metadata: {
    created: timestamp
    modified: timestamp
    collapsed: boolean
  }
}
```

**What We Calculate (Temporary):**

```
Position: {
  x: number              // Calculated by layout engine
  y: number              // Calculated by layout engine
  width: number          // Based on text content
  height: number         // Fixed or content-based
}
```

### The Key Insight

Positions are NOT data - they're a view of the data. Like markmap, we calculate fresh positions every time we need them.

------

## 📐 Layout Engines - Detailed Logic

### Center Layout (Mind Map Style)

**Visual Pattern:**

```
         [Child]
           |
[Child]--[Root]--[Child]
           |
         [Child]
```

**Algorithm Logic:**

1. Root Positioning
    - Always at canvas center (800, 400)
    - Immovable anchor point
2. Tier 1 Distribution
    - Count children of root
    - Alternate left/right placement
    - First child: left side
    - Second child: right side
    - Continue alternating
3. Distance Calculation
    - Base distance: 250px from root
    - Increase by 50px for each tier
    - Prevents overlap in dense maps
4. Child Node Positioning
    - Inherit parent's side (left/right)
    - Position vertically relative to parent
    - Spacing: 80px between siblings
    - Offset slightly toward parent's side

**Comparison to Miro:**

- Miro: Radial distribution (360°)
- Ours: Bilateral distribution (left/right only)
- Simpler, cleaner for technical docs

### Top Layout (Hierarchical Tree)

**Visual Pattern:**

```
        [Root]
      /   |   \
  [C1]   [C2]  [C3]
  / \     |     / \
[G1][G2] [G3] [G4][G5]
```

**Algorithm Logic:**

1. Tier Calculation
    - Build depth map of entire tree
    - Assign Y coordinate per tier
    - Tier spacing: 120px
2. Horizontal Distribution
    - Calculate subtree width for each node
    - Position parent centered above children
    - Minimum node spacing: 60px
    - Account for text width
3. Collision Avoidance
    - Bottom-up positioning
    - Leaves positioned first
    - Parents centered over children
    - Shift siblings if overlap detected

**Comparison to markmap:**

- Markmap: Reingold-Tilford with variable spacing
- Ours: Simpler tier-based with fixed vertical spacing
- Easier to implement, predictable results

------

## 🎮 Interaction Model

### Creation Flow

**Keyboard-Driven Creation:**

1. Tab

     → Create child

    - New node appears in next tier
    - Automatically positioned by layout
    - Immediately editable
    - Parent-child relationship established

2. Enter

     → Create sibling

    - New node at same tier
    - Positioned after existing siblings
    - Maintains tier alignment
    - Share same parent

**Why This Works:**

- Matches how people outline thoughts
- No manual positioning needed
- Instant visual feedback
- Can build entire map without mouse

### Editing Flow

**Text Editing States:**

```
Idle → Click/Enter → Editing → Enter/Escape → Idle
```

**Smart Behaviors:**

- Single click: Select node
- Double click: Edit text
- Enter in edit mode: New line in text
- Shift+Enter in edit mode: Complete edit
- Escape: Cancel edit

### Layout Switching

**Key Principle:** Structure stays, presentation changes

When switching layouts:

1. Preserve all relationships
2. Recalculate all positions
3. Maintain selection state
4. Smooth transition animation (optional)

**Implementation Options:**

**Option A: Instant Switch**

- Clear positions
- Run new layout algorithm
- Render at new positions
- Pro: Simple, fast
- Con: Jarring for users

**Option B: Animated Transition**

- Calculate new positions
- Interpolate from old to new
- Smooth animation over 300ms
- Pro: Visual continuity
- Con: More complex

------

## 🔧 Technical Implementation Strategy

### Rendering Pipeline

**Every Frame:**

1. Get current node structure
2. Run active layout algorithm
3. Calculate all positions
4. Render nodes at positions
5. Draw connections

**Why Recalculate Every Time?**

- Guarantees consistency
- No position state to manage
- Layout changes are trivial
- Matches markmap approach

### Layout Engine Interface

**Common Pattern for All Layouts:**

```
Input: 
  - Nodes map (id → node)
  - Root node ID
  - Canvas dimensions

Output:
  - Positions map (id → {x, y})
  - Connection paths

Process:
  1. Build relationship graph
  2. Calculate tier assignments  
  3. Apply layout-specific rules
  4. Return position mapping
```

### Performance Considerations

**For 100+ nodes:**

- Layout calculation: ~10-20ms
- Acceptable for real-time
- No optimization needed initially

**For 1000+ nodes:**

- Consider viewport culling
- Only render visible nodes
- Progressive rendering
- But: Not initial target

------

## 📤 Export

Options for export: 

- png image of map. 
- 4k png image of map 