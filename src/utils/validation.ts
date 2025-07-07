/**
 * MapItOut Validation Utilities
 * 
 * This file provides validation functions for node data, connections, and map structure.
 * Ensures data integrity and provides helpful error messages for debugging.
 * 
 * Update when: Modifying Node interface, adding new validation rules, or changing data structure.
 */

import type { Node, Connection, ViewBox } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate node data structure
 */
export function validateNode(node: Node): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!node.id || typeof node.id !== 'string') {
    errors.push('Node ID is required and must be a string');
  }

  if (typeof node.text !== 'string') {
    errors.push('Node text must be a string');
  }

  if (typeof node.x !== 'number' || isNaN(node.x)) {
    errors.push('Node X coordinate must be a valid number');
  }

  if (typeof node.y !== 'number' || isNaN(node.y)) {
    errors.push('Node Y coordinate must be a valid number');
  }

  if (typeof node.category !== 'number' || node.category < 0 || node.category > 5) {
    errors.push('Node category must be between 0 and 5');
  }

  if (typeof node.isEditing !== 'boolean') {
    errors.push('Node isEditing must be a boolean');
  }

  // Node type validation
  const validNodeTypes = ['root', 'hub', 'leaf', 'category', 'parameter'];
  if (!validNodeTypes.includes(node.nodeType)) {
    errors.push(`Node type must be one of: ${validNodeTypes.join(', ')}`);
  }

  // Position validation
  if (node.x < -10000 || node.x > 10000) {
    warnings.push('Node X coordinate is outside normal range');
  }

  if (node.y < -10000 || node.y > 10000) {
    warnings.push('Node Y coordinate is outside normal range');
  }

  // Text length validation
  if (node.text.length > 200) {
    warnings.push('Node text is longer than recommended (200 characters)');
  }

  // Layout hints validation
  if (node.layoutHints) {
    if (node.layoutHints.angle !== undefined && (typeof node.layoutHints.angle !== 'number' || isNaN(node.layoutHints.angle))) {
      errors.push('Layout hint angle must be a valid number');
    }
    
    if (node.layoutHints.layer !== undefined && (typeof node.layoutHints.layer !== 'number' || node.layoutHints.layer < 0)) {
      errors.push('Layout hint layer must be a non-negative number');
    }
    
    if (node.layoutHints.manualPosition !== undefined && typeof node.layoutHints.manualPosition !== 'boolean') {
      errors.push('Layout hint manualPosition must be a boolean');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate connection data structure
 */
export function validateConnection(connection: Connection): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!connection.id || typeof connection.id !== 'string') {
    errors.push('Connection ID is required and must be a string');
  }

  if (!connection.from || typeof connection.from !== 'string') {
    errors.push('Connection from field is required and must be a string');
  }

  if (!connection.to || typeof connection.to !== 'string') {
    errors.push('Connection to field is required and must be a string');
  }

  if (connection.from === connection.to) {
    errors.push('Connection cannot connect a node to itself');
  }

  // Connection type validation
  const validConnectionTypes = ['hierarchy', 'association', 'flow', 'parameter'];
  if (!validConnectionTypes.includes(connection.type)) {
    errors.push(`Connection type must be one of: ${validConnectionTypes.join(', ')}`);
  }

  // Connection style validation
  const validConnectionStyles = ['straight', 'curved'];
  if (!validConnectionStyles.includes(connection.style)) {
    errors.push(`Connection style must be one of: ${validConnectionStyles.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate viewport data
 */
export function validateViewBox(viewBox: ViewBox): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof viewBox.x !== 'number' || isNaN(viewBox.x)) {
    errors.push('ViewBox X must be a valid number');
  }

  if (typeof viewBox.y !== 'number' || isNaN(viewBox.y)) {
    errors.push('ViewBox Y must be a valid number');
  }

  if (typeof viewBox.width !== 'number' || viewBox.width <= 0) {
    errors.push('ViewBox width must be a positive number');
  }

  if (typeof viewBox.height !== 'number' || viewBox.height <= 0) {
    errors.push('ViewBox height must be a positive number');
  }

  if (viewBox.width > 10000 || viewBox.height > 10000) {
    warnings.push('ViewBox dimensions are very large');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate entire map structure
 */
export function validateMap(
  nodes: Map<string, Node>,
  connections: Connection[],
  rootId: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate root node exists
  if (!rootId) {
    errors.push('Root node ID is required');
  } else if (!nodes.has(rootId)) {
    errors.push('Root node does not exist in nodes map');
  }

  // Validate all nodes
  nodes.forEach((node, id) => {
    const result = validateNode(node);
    if (!result.isValid) {
      result.errors.forEach(error => {
        errors.push(`Node '${id}': ${error}`);
      });
    }
    result.warnings.forEach(warning => {
      warnings.push(`Node '${id}': ${warning}`);
    });
  });

  // Validate connections
  connections.forEach((connection, index) => {
    const result = validateConnection(connection);
    if (!result.isValid) {
      result.errors.forEach(error => {
        errors.push(`Connection ${index}: ${error}`);
      });
    }
    result.warnings.forEach(warning => {
      warnings.push(`Connection ${index}: ${warning}`);
    });
  });

  // Validate connection references
  connections.forEach((connection, index) => {
    if (!nodes.has(connection.from)) {
      errors.push(`Connection ${index}: from node '${connection.from}' does not exist`);
    }
    if (!nodes.has(connection.to)) {
      errors.push(`Connection ${index}: to node '${connection.to}' does not exist`);
    }
  });

  // Check for orphaned nodes (nodes without connections that aren't root)
  const connectedNodeIds = new Set<string>();
  connections.forEach(conn => {
    connectedNodeIds.add(conn.from);
    connectedNodeIds.add(conn.to);
  });

  nodes.forEach((_node, id) => {
    if (id !== rootId && !connectedNodeIds.has(id)) {
      warnings.push(`Node '${id}' has no connections and is not the root node`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate user input text
 */
export function validateNodeText(text: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof text !== 'string') {
    errors.push('Text must be a string');
  }

  if (text.length > 500) {
    errors.push('Text must be 500 characters or less');
  }

  if (text.length > 200) {
    warnings.push('Text longer than 200 characters may not display well');
  }

  // Check for potentially problematic characters
  if (text.includes('<script>') || text.includes('</script>')) {
    errors.push('Text cannot contain script tags');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize user input text
 */
export function sanitizeNodeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 500); // Limit length
}

/**
 * Validate zoom level
 */
export function validateZoomLevel(zoom: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof zoom !== 'number' || isNaN(zoom)) {
    errors.push('Zoom level must be a valid number');
  }

  if (zoom <= 0) {
    errors.push('Zoom level must be positive');
  }

  if (zoom < 0.1) {
    warnings.push('Zoom level is very small and may cause display issues');
  }

  if (zoom > 5) {
    warnings.push('Zoom level is very large and may cause performance issues');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
} 