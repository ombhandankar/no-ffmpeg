/**
 * Core types for the no-ffmpeg library
 */

/**
 * Options for initializing a processor
 */
export interface ProcessorOptions {
  ffmpegPath?: string;
  tempDir?: string;
  logger?: (message: string, level: LogLevel) => void;
}

/**
 * Log level enum for the logger
 */
export enum LogLevel {
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  DEBUG = "debug",
}

/**
 * Time specification in various formats
 */
export type TimeSpec =
  | number
  | string
  | { hours?: number; minutes?: number; seconds: number; frames?: number };

/**
 * Video trim options
 */
export interface TrimOptions {
  start?: TimeSpec;
  end?: TimeSpec;
  duration?: TimeSpec;
}

/**
 * Video resize options
 */
export interface ResizeOptions {
  width?: number;
  height?: number;
  maintainAspectRatio?: boolean;
}

/**
 * Output file format
 */
export type OutputFormat =
  | "mp4"
  | "mov"
  | "mkv"
  | "avi"
  | "webm"
  | "gif"
  | string;

/**
 * Output options
 */
export interface OutputOptions {
  format?: OutputFormat;
  quality?: number; // 1-100 for constant quality mode
  bitrate?: string; // e.g., '5M', '1000k'
  codec?: string; // e.g., 'libx264', 'libvpx'
}

/**
 * Command execution result
 */
export interface ExecutionResult {
  success: boolean;
  outputPath: string;
  duration: number; // execution time in ms
  commandExecuted: string;
  stderr?: string;
  stdout?: string;
}

/**
 * Position types for overlay and text operations
 */
export enum Position {
  TOP_LEFT = "topleft",
  TOP = "top",
  TOP_RIGHT = "topright",
  LEFT = "left",
  CENTER = "center",
  RIGHT = "right",
  BOTTOM_LEFT = "bottomleft",
  BOTTOM = "bottom",
  BOTTOM_RIGHT = "bottomright",
}

/**
 * Options for overlay operation
 */
export interface OverlayOptions {
  source: string;                 // Path to the overlay image
  position?: Position | string;   // Predefined position or custom position
  x?: number;                     // X coordinate (if not using predefined position)
  y?: number;                     // Y coordinate (if not using predefined position)
  padding?: number;               // Padding from the edge when using predefined position
  scale?: number;                 // Scale factor for the overlay (1.0 = original size)
  width?: number;                 // Target width for the overlay
  height?: number;                // Target height for the overlay
  opacity?: number;               // Opacity of the overlay (0-1)
  start?: TimeSpec;               // When to start showing the overlay
  end?: TimeSpec;                 // When to stop showing the overlay
}

/**
 * Options for text operation
 */
export interface TextOptions {
  text: string;                   // The text to display
  position?: Position | string;   // Predefined position or custom position
  x?: number;                     // X coordinate (if not using predefined position)
  y?: number;                     // Y coordinate (if not using predefined position)
  padding?: number;               // Padding from the edge when using predefined position
  fontFile?: string;              // Font file to use
  fontSize?: number;              // Font size
  fontColor?: string;             // Font color (hex, named color, or rgba)
  backgroundColor?: string;       // Background color with optional alpha
  boxBorder?: number;             // Border width for the text box
  start?: TimeSpec;               // When to start showing the text
  end?: TimeSpec;                 // When to stop showing the text
}

/**
 * Types of filter operations
 */
export enum FilterType {
  SIMPLE = "simple",              // Can be combined with comma in -vf
  COMPLEX = "complex"             // Requires -filter_complex with labels
}

/**
 * Filter stream information
 */
export interface FilterStream {
  label: string;                  // Stream label (e.g., "[0:v]", "[text]", "[overlay]")
  isInput: boolean;               // Whether this is an input or output stream
  isMain: boolean;                // Whether this is the main video stream
}

export interface AdjustColorOptions {
  /**
   * Adjust video brightness. Range approximately -1.0 to 1.0. Default: 0.
   */
  brightness?: number;
  /**
   * Adjust video contrast. Range approximately -2.0 to 2.0. Default: 1.0.
   */
  contrast?: number;
  /**
   * Adjust video saturation. Range approximately 0.0 to 3.0. Default: 1.0.
   */
  saturation?: number;
}
