/**
 * no-ffmpeg - A high-level wrapper around ffmpeg with a fluent API
 */

// Export main Processor class
export { Processor } from "./core/Processor";

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
  // New types from Phase 4
  OverlayOptions,
  TextOptions,
  Position,
  FilterType,
  FilterStream,
  // New types from Phase 4 Batch 2
  AdjustColorOptions,
  // New types from Phase 4 Batch 3
  EncodingOptions,
  ConcatOptions,
} from "./types";

// Export errors
export {
  NoFFmpegError,
  FFmpegNotFoundError,
  InputFileError,
  FFmpegExecutionError,
  InvalidParameterError,
  MissingParameterError,
} from "./errors";

// Export operations
export { Operation } from "./operations/Operation.interface";
export { TrimOperation } from "./operations/TrimOperation";
// New operations from Phase 4
export { OverlayOperation } from "./operations/OverlayOperation";
export { TextOperation } from "./operations/TextOperation";
// New operations from Phase 4 Batch 2
export { SpeedOperation } from "./operations/SpeedOperation";
export { AdjustColorOperation } from "./operations/AdjustColorOperation";
// New operations from Phase 4 Batch 3
export { EncodingOptionsOperation } from "./operations/EncodingOptionsOperation";
export { ConcatOperation } from "./operations/ConcatOperation";

// Export commands
export { CommandBuilder } from "./commands/CommandBuilder";
export { FFmpegCommandBuilder } from "./commands/FFmpegCommandBuilder";
export { FFmpegCommand } from "./commands/FFmpegCommand";
// New filter chain from Phase 4
export { FilterChain } from "./commands/FilterChain";

// Convenience factory function
import { Processor } from "./core/Processor";
import { ProcessorOptions, ConcatOptions } from "./types";

/**
 * Create a processor instance with an input file
 */
export function createProcessor(
  inputPath: string,
  options?: ProcessorOptions,
): Processor {
  return Processor.fromFile(inputPath, options);
}

/**
 * Video processing convenience function
 */
export function video(
  inputPath: string,
  options?: ProcessorOptions,
): Processor {
  return createProcessor(inputPath, options);
}

/**
 * Audio processing convenience function
 */
export function audio(
  inputPath: string,
  options?: ProcessorOptions,
): Processor {
  return createProcessor(inputPath, options);
}

/**
 * Concat multiple video files
 */
export function concat(
  options: ConcatOptions,
  processorOptions?: ProcessorOptions,
): Processor {
  return Processor.concat(options, processorOptions);
}

// Export default as the video processor factory
export default video;
