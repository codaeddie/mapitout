/**
 * MapItOut Export Utilities
 * 
 * This file provides functions for exporting mind maps as PNG images.
 * Uses html2canvas for high-quality rendering with progress tracking.
 * 
 * Update when: Modifying export options, adding new export formats, or changing export logic.
 */

import html2canvas from 'html2canvas';

export interface ExportOptions {
  scale?: number;
  backgroundColor?: string;
  width?: number;
  height?: number;
  filename?: string;
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
  
  // Validate container
  if (!container) {
    throw new Error('Export container is required');
  }
  
  // Validate options
  const validationErrors = validateExportOptions(config);
  if (validationErrors.length > 0) {
    throw new Error(`Invalid export options: ${validationErrors.join(', ')}`);
  }
  
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
      // Additional quality options
      letterRendering: true,
      scrollX: 0,
      scrollY: 0,
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

    // Convert to data URL with maximum quality
    const dataURL = canvas.toDataURL('image/png', 1.0);

    onProgress?.({
      stage: 'complete',
      progress: 100,
      message: 'Export complete!'
    });

    return dataURL;
  } catch (error) {
    console.error('Export failed:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('html2canvas')) {
        throw new Error('Canvas rendering failed. Please try again or reduce the export size.');
      } else if (error.message.includes('timeout')) {
        throw new Error('Export timed out. Please try again with a smaller scale or fewer nodes.');
      } else {
        throw new Error(`Export failed: ${error.message}`);
      }
    } else {
      throw new Error('Export failed due to an unknown error. Please try again.');
    }
  }
}

/**
 * Download data URL as file
 */
export function downloadDataURL(dataURL: string, filename: string): void {
  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download file. Please try again.');
  }
}

/**
 * Complete export function for PNG
 */
export async function exportMindMap(
  container: HTMLElement,
  options: ExportOptions = {},
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Export PNG
    const pngDataURL = await exportAsPNG(container, config, onProgress);
    downloadDataURL(pngDataURL, `${config.filename}.png`);
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