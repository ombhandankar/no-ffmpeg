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
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  DEBUG = 'debug',
}

/**
 * Time specification in various formats
 */
export type TimeSpec = number | string | { hours?: number; minutes?: number; seconds: number; frames?: number };

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
export type OutputFormat = 'mp4' | 'mov' | 'mkv' | 'avi' | 'webm' | 'gif' | string;

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