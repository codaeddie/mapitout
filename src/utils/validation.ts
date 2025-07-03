/**
 * MapItOut Validation Utilities
 * 
 * This file contains validation functions for ensuring data integrity.
 * Validates node data, user input, and export options.
 * 
 * Update when: Adding new validation rules, modifying data constraints, or changing validation logic.
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

  if (!node.text || typeof node.text !== 'string') {
    errors.push('Node text is required and must be a string');
  }

  if (typeof node.x !== 'number' || isNaN(node.x)) {
    errors.push('Node X coordinate must be a valid number');
  }

  if (typeof node.y !== 'number' || isNaN(node.y)) {
    errors.push('Node Y coordinate must be a valid number');
  }

  if (typeof node.tier !== 'number' || node.tier < 0) {
    errors.push('Node tier must be a non-negative number');
  }

  if (typeof node.category !== 'number' || node.category < 0 || node.category > 5) {
    errors.push('Node category must be between 0 and 5');
  }

  if (typeof node.isEditing !== 'boolean') {
    errors.push('Node isEditing must be a boolean');
  }

  // Array validation
  if (!Array.isArray(node.children)) {
    errors.push('Node children must be an array');
  } else {
    node.children.forEach((childId, index) => {
      if (typeof childId !== 'string') {
        errors.push(`Child ID at index ${index} must be a string`);
      }
    });
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

  if (!connection.from || typeof connection.from !== 'string') {
    errors.push('Connection from field is required and must be a string');
  }

  if (!connection.to || typeof connection.to !== 'string') {
    errors.push('Connection to field is required and must be a string');
  }

  if (connection.from === connection.to) {
    errors.push('Connection cannot connect a node to itself');
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
  const nodeValidationResults: ValidationResult[] = [];
  nodes.forEach((node) => {
    const result = validateNode(node);
    if (!result.isValid) {
      nodeValidationResults.push(result);
    }
  });

  // Collect node validation errors
  nodeValidationResults.forEach((result, index) => {
    result.errors.forEach(error => {
      errors.push(`Node ${index}: ${error}`);
    });
    result.warnings.forEach(warning => {
      warnings.push(`Node ${index}: ${warning}`);
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

  // Validate parent-child relationships
  nodes.forEach((node, id) => {
    if (node.parentId && !nodes.has(node.parentId)) {
      errors.push(`Node '${id}': parent '${node.parentId}' does not exist`);
    }
    
    node.children.forEach(childId => {
      if (!nodes.has(childId)) {
        errors.push(`Node '${id}': child '${childId}' does not exist`);
      }
    });
  });

  // Check for orphaned nodes (nodes without parent that aren't root)
  nodes.forEach((node, id) => {
    if (id !== rootId && !node.parentId) {
      warnings.push(`Node '${id}' has no parent and is not the root node`);
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

  if (!text || text.trim().length === 0) {
    errors.push('Node text cannot be empty');
  }

  if (text.length > 200) {
    errors.push('Node text cannot exceed 200 characters');
  }

  if (text.includes('\n')) {
    warnings.push('Node text contains line breaks which may affect layout');
  }

  // Check for potentially problematic characters
  const problematicChars = /[<>]/;
  if (problematicChars.test(text)) {
    warnings.push('Node text contains characters that may cause display issues');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize node text input
 */
export function sanitizeNodeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove potentially problematic characters
    .substring(0, 200); // Limit length
}

/**
 * Validate zoom level
 */
export function validateZoomLevel(zoom: number): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof zoom !== 'number' || isNaN(zoom)) {
    errors.push('Zoom level must be a valid number');
  } else {
    if (zoom < 0.1) {
      errors.push('Zoom level cannot be less than 0.1');
    }
    if (zoom > 3) {
      errors.push('Zoom level cannot be greater than 3');
    }
    if (zoom < 0.5) {
      warnings.push('Zoom level is very low, may affect usability');
    }
    if (zoom > 2) {
      warnings.push('Zoom level is very high, may affect performance');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
} 