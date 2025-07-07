/**
 * MapItOut Tier-based Color System
 * 
 * This module provides utilities for calculating node tiers/depths and mapping them to colors.
 * Implements the tier-based color scheme where H1,H2 share colors and H3+ have unique colors.
 * 
 * Update when: Modifying tier calculation logic or changing color schemes.
 */

import type { Node } from '../types';

/**
 * Calculate the tier/depth of a node in the hierarchy.
 * Tier 0 = root, Tier 1 = children of root, etc.
 */
export function calculateNodeTier(nodeId: string, nodes: Map<string, Node>): number {
  const node = nodes.get(nodeId);
  if (!node) return 0;
  
  let tier = 0;
  let currentNode = node;
  
  // Traverse up to root, counting levels
  while (currentNode.parent) {
    tier++;
    const parentNode = nodes.get(currentNode.parent);
    if (!parentNode) break;
    currentNode = parentNode;
  }
  
  return tier;
}

/**
 * Get color scheme for a node based on its tier.
 * H1 (tier 0) and H2 (tier 1) share the same color scheme.
 * H3+ (tier 2+) each get their own unique color.
 */
export function getTierColorScheme(tier: number): {
  borderColor: string;
  backgroundColor: string;
  cssClass: string;
} {
  // H1 and H2 share the same color (orange)
  if (tier === 0 || tier === 1) {
    return {
      borderColor: 'border-orange-500',
      backgroundColor: 'bg-orange-500/10',
      cssClass: 'node-tier-h1h2'
    };
  }
  
  // H3+ each get their own color
  const colorSchemes = [
    // Tier 2 (H3) - Red
    {
      borderColor: 'border-red-500',
      backgroundColor: 'bg-red-500/10',
      cssClass: 'node-tier-h3'
    },
    // Tier 3 (H4) - Blue
    {
      borderColor: 'border-blue-500',
      backgroundColor: 'bg-blue-500/10',
      cssClass: 'node-tier-h4'
    },
    // Tier 4 (H5) - Green
    {
      borderColor: 'border-green-500',
      backgroundColor: 'bg-green-500/10',
      cssClass: 'node-tier-h5'
    },
    // Tier 5 (H6) - Purple
    {
      borderColor: 'border-purple-500',
      backgroundColor: 'bg-purple-500/10',
      cssClass: 'node-tier-h6'
    },
    // Tier 6+ - Amber
    {
      borderColor: 'border-amber-500',
      backgroundColor: 'bg-amber-500/10',
      cssClass: 'node-tier-h7plus'
    }
  ];
  
  // For tier 2+, map to color schemes (tier 2 = index 0, tier 3 = index 1, etc.)
  const schemeIndex = tier - 2;
  
  // If we go beyond our defined schemes, use the last one (amber)
  if (schemeIndex >= colorSchemes.length) {
    return colorSchemes[colorSchemes.length - 1];
  }
  
  return colorSchemes[schemeIndex];
}

/**
 * Get the complete color information for a node based on its position in the hierarchy.
 */
export function getNodeColorInfo(nodeId: string, nodes: Map<string, Node>) {
  const tier = calculateNodeTier(nodeId, nodes);
  const colorScheme = getTierColorScheme(tier);
  
  return {
    tier,
    ...colorScheme
  };
} 