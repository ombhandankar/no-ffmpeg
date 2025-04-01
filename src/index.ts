/**
 * no-ffmpeg - A high-level wrapper around ffmpeg with a fluent API
 */

// Export main Processor class
export { Processor } from './core/Processor';

// Export types
export {
  ProcessorOptions,
  TrimOptions,
  ResizeOptions,
  OutputOptions,
  ExecutionResult,
  TimeSpec,
  LogLevel,
  OutputFormat,
} from './types';

// Export errors
export {
  NoFFmpegError,
  FFmpegNotFoundError,
  InputFileError,
  FFmpegExecutionError,
  InvalidParameterError,
  MissingParameterError,
} from './errors';

// Convenience factory function
import { Processor } from './core/Processor';
import { ProcessorOptions } from './types';

/**
 * Create a processor instance with an input file
 */
export function createProcessor(inputPath: string, options?: ProcessorOptions): Processor {
  return Processor.fromFile(inputPath, options);
}

/**
 * Video processing convenience function
 */
export function video(inputPath: string, options?: ProcessorOptions): Processor {
  return createProcessor(inputPath, options);
}

/**
 * Audio processing convenience function
 */
export function audio(inputPath: string, options?: ProcessorOptions): Processor {
  return createProcessor(inputPath, options);
}

// Export default as the video processor factory
export default video;