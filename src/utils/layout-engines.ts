/**
 * Layout Engines for MapItOut
 * 
 * This file contains the layout engine implementations for different diagram types.
 * Each engine operates on explicit connections rather than hierarchy.
 * Enhanced with visual polish and improved algorithms for Phase 4.
 * 
 * Update when: Adding new layout algorithms or modifying positioning logic.
 */

import type { Node, Connection, LayoutEngine } from '../types';

// Helper function for connection type selection (moved to export at bottom)

export class HierarchicalLayout implements LayoutEngine {
  type = 'hierarchical' as const;
  
  calculatePositions(nodes: Map<string, Node>, connections: Connection[]): void {
    const hierarchy = this.buildHierarchy(nodes, connections);
    this.positionHierarchy(hierarchy, nodes);
  }
  
  private buildHierarchy(_nodes: Map<string, Node>, connections: Connection[]) {
    const children = new Map<string, string[]>();
    const parents = new Map<string, string>();
    
    // Build parent-child relationships from hierarchy connections
    connections.forEach(conn => {
      if (conn.type === 'hierarchy') {
        children.set(conn.from, [...(children.get(conn.from) || []), conn.to]);
        parents.set(conn.to, conn.from);
      }
    });
    
    return { children, parents };
  }
  
  private positionHierarchy(hierarchy: { children: Map<string, string[]>; parents: Map<string, string> }, nodes: Map<string, Node>): void {
    const { children } = hierarchy;
    const rootNode = Array.from(nodes.values()).find(n => n.nodeType === 'root');
    if (!rootNode) return;
    
    // Center root with enhanced positioning
    if (!rootNode.layoutHints.manualPosition) {
      rootNode.x = 800;
      rootNode.y = 400;
      
      // Update root layout hints
      rootNode.layoutHints = {
        ...rootNode.layoutHints,
        layer: 0,
        isRoot: true,
      };
    }
    
    // Position children in tiers with improved spacing
    this.positionTier(rootNode.id, children, nodes, 1, 250);
  }
  
  private positionTier(parentId: string, children: Map<string, string[]>, nodes: Map<string, Node>, tier: number, radius: number): void {
    const childIds = children.get(parentId) || [];
    const parent = nodes.get(parentId);
    if (!parent || childIds.length === 0) return;
    
    const angleStep = (2 * Math.PI) / childIds.length;
    
    childIds.forEach((childId, index) => {
      const child = nodes.get(childId);
      if (!child || child.layoutHints.manualPosition) return;
      
      const angle = angleStep * index;
      child.x = parent.x + radius * Math.cos(angle);
      child.y = parent.y + radius * Math.sin(angle);
      
      // Enhanced layout hints with visual polish
      child.layoutHints = {
        ...child.layoutHints,
        angle,
        layer: tier,
        tierRadius: radius,
        tierIndex: index,
        totalInTier: childIds.length,
      };
      
      // Recursively position grandchildren with adaptive radius
      const nextRadius = Math.max(radius * 0.75, 150); // Minimum radius for readability
      this.positionTier(childId, children, nodes, tier + 1, nextRadius);
    });
  }
}

export class WebLayout implements LayoutEngine {
  type = 'web' as const;
  
  calculatePositions(nodes: Map<string, Node>, connections: Connection[]): void {
    const hub = this.findHubNode(nodes, connections);
    if (!hub) return;
    
    // Center hub with enhanced positioning
    if (!hub.layoutHints.manualPosition) {
      hub.x = 800;
      hub.y = 400;
      
      // Update hub layout hints
      hub.layoutHints = {
        ...hub.layoutHints,
        layer: 0,
        isHub: true,
      };
    }
    
    // Position spokes with improved spacing
    this.positionSpokes(hub, nodes, connections);
  }
  
  private findHubNode(nodes: Map<string, Node>, connections: Connection[]): Node | null {
    // Priority 1: Node explicitly marked as hub
    for (const node of nodes.values()) {
      if (node.nodeType === 'hub') return node;
    }
    
    // Priority 2: Node with most connections
    let maxConnections = 0;
    let hubNode: Node | null = null;
    
    for (const node of nodes.values()) {
      const connectionCount = connections.filter(c => 
        c.from === node.id || c.to === node.id
      ).length;
      
      if (connectionCount > maxConnections) {
        maxConnections = connectionCount;
        hubNode = node;
      }
    }
    
    // Priority 3: Root node as fallback
    return hubNode || Array.from(nodes.values()).find(n => n.nodeType === 'root') || null;
  }
  
  private positionSpokes(hub: Node, nodes: Map<string, Node>, connections: Connection[]): void {
    const connectedIds = this.getConnectedNodeIds(hub.id, connections);
    const spokes = connectedIds.map(id => nodes.get(id)).filter(Boolean) as Node[];
    
    if (spokes.length === 0) return;
    
    const baseRadius = 300; // Increased for better spacing
    const angleStep = (2 * Math.PI) / spokes.length;
    
    spokes.forEach((spoke, index) => {
      if (spoke.layoutHints.manualPosition) return;
      
      const angle = angleStep * index;
      spoke.x = hub.x + baseRadius * Math.cos(angle);
      spoke.y = hub.y + baseRadius * Math.sin(angle);
      
      // Enhanced layout hints for visual polish
      spoke.layoutHints = {
        ...spoke.layoutHints,
        angle,
        layer: 1,
        spokeIndex: index,
        totalSpokes: spokes.length,
        distanceFromHub: baseRadius,
      };
    });
  }
  
  private getConnectedNodeIds(hubId: string, connections: Connection[]): string[] {
    return connections
      .filter(c => c.from === hubId || c.to === hubId)
      .map(c => c.from === hubId ? c.to : c.from);
  }
}

export class SnakeLayout implements LayoutEngine {
  type = 'snake' as const;
  
  calculatePositions(nodes: Map<string, Node>, connections: Connection[]): void {
    // Enhanced force-directed layout with flow bias and better convergence
    this.runForceSimulation(nodes, connections);
  }
  
  private runForceSimulation(nodes: Map<string, Node>, connections: Connection[]): void {
    const iterations = 100; // Increased for better convergence
    const nodeArray = Array.from(nodes.values());
    
    // Initialize positions if not set
    nodeArray.forEach((node, index) => {
      if (!node.layoutHints.manualPosition && !node.layoutHints.initialized) {
        node.x = 400 + (index * 50);
        node.y = 300 + (index * 30);
        node.layoutHints.initialized = true;
      }
    });
    
    for (let i = 0; i < iterations; i++) {
      // Calculate forces for each node
      nodeArray.forEach(node => {
        if (node.layoutHints.manualPosition) return;
        
        const forces = this.calculateForces(node, nodeArray, connections);
        
        // Apply forces with adaptive cooling
        const cooling = Math.pow(0.95, i / 10); // Smoother cooling curve
        const maxMovement = 10; // Limit maximum movement per iteration
        
        const dx = Math.max(-maxMovement, Math.min(maxMovement, forces.x * cooling));
        const dy = Math.max(-maxMovement, Math.min(maxMovement, forces.y * cooling));
        
        node.x += dx;
        node.y += dy;
      });
    }
    
    // Update layout hints with final positions
    nodeArray.forEach(node => {
      if (!node.layoutHints.manualPosition) {
        node.layoutHints = {
          ...node.layoutHints,
          layer: 1, // All nodes at same level in snake layout
          forceSimulated: true,
        };
      }
    });
  }
  
  private calculateForces(node: Node, allNodes: Node[], connections: Connection[]): { x: number; y: number } {
    let fx = 0, fy = 0;
    
    // Enhanced repulsion from all other nodes
    allNodes.forEach(other => {
      if (other.id === node.id) return;
      
      const dx = node.x - other.x;
      const dy = node.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      // Stronger repulsion for closer nodes
      const repulsion = 2000 / (distance * distance);
      fx += (dx / distance) * repulsion;
      fy += (dy / distance) * repulsion;
    });
    
    // Enhanced attraction to connected nodes
    connections.forEach(conn => {
      const isConnected = conn.from === node.id || conn.to === node.id;
      if (!isConnected) return;
      
      const otherId = conn.from === node.id ? conn.to : conn.from;
      const other = allNodes.find(n => n.id === otherId);
      if (!other) return;
      
      const dx = other.x - node.x;
      const dy = other.y - node.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      
      // Optimal distance for connected nodes
      const optimalDistance = 200;
      const attraction = (distance - optimalDistance) * 0.2;
      fx += (dx / distance) * attraction;
      fy += (dy / distance) * attraction;
    });
    
    // Enhanced flow bias (slight rightward and downward drift)
    fx += 3;
    fy += 1;
    
    // Add some randomness to prevent nodes from getting stuck
    fx += (Math.random() - 0.5) * 2;
    fy += (Math.random() - 0.5) * 2;
    
    return { x: fx, y: fy };
  }
}

export class CommandLayout implements LayoutEngine {
  type = 'command' as const;
  
  calculatePositions(nodes: Map<string, Node>, connections: Connection[]): void {
    const hub = this.findCommandHub(nodes);
    if (!hub) return;
    
    // Center hub with enhanced positioning
    if (!hub.layoutHints.manualPosition) {
      hub.x = 800;
      hub.y = 400;
      
      // Update hub layout hints
      hub.layoutHints = {
        ...hub.layoutHints,
        layer: 0,
        isCommandHub: true,
      };
    }
    
    // Position parameter groups with improved organization
    this.positionParameterGroups(hub, nodes, connections);
  }
  
  private findCommandHub(nodes: Map<string, Node>): Node | null {
    // Priority 1: Node explicitly marked as command
    for (const node of nodes.values()) {
      if (node.nodeType === 'command') return node;
    }
    
    // Priority 2: Root node as fallback
    return Array.from(nodes.values()).find(n => n.nodeType === 'root') || null;
  }
  
  private positionParameterGroups(hub: Node, nodes: Map<string, Node>, connections: Connection[]): void {
    const parameterCategories = this.getParametersByCategory(hub, nodes, connections);
    const categories = Object.keys(parameterCategories);
    
    if (categories.length === 0) return;
    
    const angleStep = (2 * Math.PI) / categories.length;
    
    categories.forEach((category, categoryIndex) => {
      const categoryNodes = parameterCategories[category];
      const categoryAngle = angleStep * categoryIndex;
      
      // Position nodes in this category
      this.positionCategoryNodes(hub, categoryNodes, categoryAngle);
    });
  }
  
  private getParametersByCategory(hub: Node, nodes: Map<string, Node>, connections: Connection[]): Record<string, Node[]> {
    const categories: Record<string, Node[]> = {};
    
    // Get all nodes connected to hub
    const connectedIds = connections
      .filter(c => c.from === hub.id || c.to === hub.id)
      .map(c => c.from === hub.id ? c.to : c.from);
    
    connectedIds.forEach(id => {
      const node = nodes.get(id);
      if (!node) return;
      
      const category = node.category.toString();
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(node);
    });
    
    return categories;
  }
  
  private positionCategoryNodes(hub: Node, categoryNodes: Node[], categoryAngle: number): void {
    const baseRadius = 250; // Increased for better spacing
    const radiusStep = 60; // Increased step for better separation
    
    categoryNodes.forEach((node, index) => {
      if (node.layoutHints.manualPosition) return;
      
      const radius = baseRadius + (index * radiusStep);
      node.x = hub.x + radius * Math.cos(categoryAngle);
      node.y = hub.y + radius * Math.sin(categoryAngle);
      
      // Enhanced layout hints for visual polish
      node.layoutHints = {
        ...node.layoutHints,
        angle: categoryAngle,
        layer: index + 1,
        categoryIndex: index,
        totalInCategory: categoryNodes.length,
        distanceFromHub: radius,
      };
    });
  }
}

// Layout engine factory with enhanced error handling
export const layoutEngines = {
  hierarchical: new HierarchicalLayout(),
  web: new WebLayout(),
  snake: new SnakeLayout(),
  command: new CommandLayout(),
};

export function getLayoutEngine(type: string): LayoutEngine | null {
  return layoutEngines[type as keyof typeof layoutEngines] || null;
}

// Enhanced connection type selection with validation
export function getConnectionTypeForLayout(layoutType: string): Connection['type'] {
  switch (layoutType) {
    case 'hierarchical': return 'hierarchy';
    case 'web': return 'association';
    case 'snake': return 'flow';
    case 'command': return 'parameter';
    default: return 'association';
  }
} 