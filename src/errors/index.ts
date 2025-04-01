/**
 * Custom error classes for the no-ffmpeg library
 */

/**
 * Base error class for all no-ffmpeg errors
 */
export class NoFFmpegError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NoFFmpegError';
    Object.setPrototypeOf(this, NoFFmpegError.prototype);
  }
}

/**
 * Error thrown when FFmpeg executable is not found
 */
export class FFmpegNotFoundError extends NoFFmpegError {
  constructor(path?: string) {
    super(
      path
        ? `FFmpeg executable not found at ${path}`
        : 'FFmpeg executable not found. Make sure FFmpeg is installed and available in your PATH'
    );
    this.name = 'FFmpegNotFoundError';
    Object.setPrototypeOf(this, FFmpegNotFoundError.prototype);
  }
}

/**
 * Error thrown when input file is invalid or not found
 */
export class InputFileError extends NoFFmpegError {
  constructor(path: string, details?: string) {
    super(`Error with input file at ${path}${details ? `: ${details}` : ''}`);
    this.name = 'InputFileError';
    Object.setPrototypeOf(this, InputFileError.prototype);
  }
}

/**
 * Error thrown when FFmpeg command execution fails
 */
export class FFmpegExecutionError extends NoFFmpegError {
  readonly stderr: string;
  readonly command: string;

  constructor(command: string, stderr: string) {
    super(`FFmpeg command execution failed: ${stderr.split('\n')[0]}`);
    this.name = 'FFmpegExecutionError';
    this.stderr = stderr;
    this.command = command;
    Object.setPrototypeOf(this, FFmpegExecutionError.prototype);
  }
}

/**
 * Error thrown when an invalid parameter is provided
 */
export class InvalidParameterError extends NoFFmpegError {
  constructor(paramName: string, details: string) {
    super(`Invalid parameter '${paramName}': ${details}`);
    this.name = 'InvalidParameterError';
    Object.setPrototypeOf(this, InvalidParameterError.prototype);
  }
}

/**
 * Error thrown when a required parameter is missing
 */
export class MissingParameterError extends NoFFmpegError {
  constructor(paramName: string) {
    super(`Missing required parameter: ${paramName}`);
    this.name = 'MissingParameterError';
    Object.setPrototypeOf(this, MissingParameterError.prototype);
  }
}

/**
 * Helper function to create a friendly error message from an FFmpeg stderr
 */
export function parseFFmpegError(stderr: string): string {
  // Extract the most relevant error message from FFmpeg's stderr
  const errorLines = stderr.split('\n').filter(line => line.includes('Error') || line.includes('error'));
  if (errorLines.length > 0) {
    return errorLines[0].trim();
  }
  return stderr.split('\n')[0] || 'Unknown FFmpeg error';
}