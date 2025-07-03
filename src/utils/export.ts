/**
 * MapItOut Export Utilities
 * 
 * This file handles exporting mind maps as PNG images and JSON data.
 * Provides high DPI export capabilities and progress tracking.
 * 
 * Update when: Modifying export format, adding new export options, or changing export quality settings.
 */

import html2canvas from 'html2canvas';
import type { Node, Connection } from '../types';

export interface ExportOptions {
  scale?: number;
  backgroundColor?: string;
  width?: number;
  height?: number;
  filename?: string;
  format?: 'png' | 'json';
}

export interface ExportProgress {
  stage: 'preparing' | 'rendering' | 'processing' | 'complete';
  progress: number;
  message: string;
}

const DEFAULT_OPTIONS: Required<ExportOptions> = {
  scale: 2,
  backgroundColor: '#0f172a',
  width: 1600,
  height: 1200,
  filename: `mindmap-${Date.now()}`,
  format: 'png',
};

/**
 * Export mind map as PNG image
 */
export async function exportAsPNG(
  container: HTMLElement,
  options: ExportOptions = {},
  onProgress?: (progress: ExportProgress) => void
): Promise<string> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  onProgress?.({
    stage: 'preparing',
    progress: 0,
    message: 'Preparing export...'
  });

  try {
    // Configure html2canvas options for high quality export
    const html2canvasOptions = {
      backgroundColor: config.backgroundColor,
      scale: config.scale,
      useCORS: true,
      logging: false,
      width: config.width,
      height: config.height,
      allowTaint: true,
      foreignObjectRendering: true,
      imageTimeout: 0,
      removeContainer: false,
    };

    onProgress?.({
      stage: 'rendering',
      progress: 25,
      message: 'Rendering canvas...'
    });

    const canvas = await html2canvas(container, html2canvasOptions);

    onProgress?.({
      stage: 'processing',
      progress: 75,
      message: 'Processing image...'
    });

    // Convert to data URL
    const dataURL = canvas.toDataURL('image/png', 1.0);

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Export complete!'
    });

    return dataURL;
  } catch (error) {
    console.error('Export failed:', error);
    throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Download data URL as file
 */
export function downloadDataURL(dataURL: string, filename: string): void {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataURL;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export mind map data as JSON
 */
export function exportAsJSON(
  nodes: Map<string, Node>,
  connections: Connection[],
  metadata: Record<string, any> = {}
): string {
  const exportData = {
    nodes: Array.from(nodes.entries()),
    connections,
    metadata: {
      exportDate: new Date().toISOString(),
      version: '1.0',
      nodeCount: nodes.size,
      connectionCount: connections.length,
      ...metadata,
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Complete export function with both PNG and JSON
 */
export async function exportMindMap(
  container: HTMLElement,
  nodes: Map<string, Node>,
  connections: Connection[],
  options: ExportOptions = {},
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Export PNG
    if (config.format === 'png') {
      const pngDataURL = await exportAsPNG(container, config, onProgress);
      downloadDataURL(pngDataURL, `${config.filename}.png`);
    }

    // Export JSON
    const jsonData = exportAsJSON(nodes, connections, {
      exportOptions: config,
    });
    const jsonBlob = new Blob([jsonData], { type: 'application/json' });
    const jsonURL = URL.createObjectURL(jsonBlob);
    downloadDataURL(jsonURL, `${config.filename}.json`);
    URL.revokeObjectURL(jsonURL);

  } catch (error) {
    console.error('Export failed:', error);
    throw error;
  }
}

/**
 * Create a temporary container for export
 */
export function createExportContainer(
  originalContainer: HTMLElement,
  options: ExportOptions = {}
): HTMLElement {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  // Clone the original container
  const exportContainer = originalContainer.cloneNode(true) as HTMLElement;
  
  // Apply export-specific styles
  exportContainer.style.position = 'absolute';
  exportContainer.style.left = '-9999px';
  exportContainer.style.top = '0';
  exportContainer.style.width = `${config.width}px`;
  exportContainer.style.height = `${config.height}px`;
  exportContainer.style.backgroundColor = config.backgroundColor;
  exportContainer.style.transform = 'none';
  exportContainer.style.transformOrigin = 'top left';
  
  // Add to DOM temporarily
  document.body.appendChild(exportContainer);
  
  return exportContainer;
}

/**
 * Clean up temporary export container
 */
export function cleanupExportContainer(container: HTMLElement): void {
  if (container.parentNode) {
    container.parentNode.removeChild(container);
  }
}

/**
 * Validate export options
 */
export function validateExportOptions(options: ExportOptions): string[] {
  const errors: string[] = [];
  
  if (options.scale && (options.scale < 0.1 || options.scale > 5)) {
    errors.push('Scale must be between 0.1 and 5');
  }
  
  if (options.width && (options.width < 100 || options.width > 4000)) {
    errors.push('Width must be between 100 and 4000');
  }
  
  if (options.height && (options.height < 100 || options.height > 4000)) {
    errors.push('Height must be between 100 and 4000');
  }
  
  return errors;
} 