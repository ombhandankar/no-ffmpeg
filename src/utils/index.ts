import * as path from 'path';
import * as fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { TimeSpec, LogLevel } from '../types';
import { InvalidParameterError } from '../errors';

/**
 * Default logger implementation
 */
export function defaultLogger(message: string, level: LogLevel): void {
  const timestamp = new Date().toISOString();
  switch (level) {
    case LogLevel.INFO:
      console.log(`[${timestamp}] [INFO] ${message}`);
      break;
    case LogLevel.WARN:
      console.warn(`[${timestamp}] [WARN] ${message}`);
      break;
    case LogLevel.ERROR:
      console.error(`[${timestamp}] [ERROR] ${message}`);
      break;
    case LogLevel.DEBUG:
      console.debug(`[${timestamp}] [DEBUG] ${message}`);
      break;
  }
}

/**
 * Checks if a file exists and is accessible
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath, fs.constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Converts a TimeSpec to a string format acceptable by FFmpeg
 */
export function formatTimeSpec(time: TimeSpec): string {
  if (typeof time === 'number') {
    // Convert seconds to HH:MM:SS.mmm format
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = time % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toFixed(3).padStart(6, '0')}`;
  } else if (typeof time === 'string') {
    // Validate and normalize string format
    const timeRegex = /^(\d+:)?(\d+:)?(\d+)(\.\d+)?$/;
    if (!timeRegex.test(time)) {
      throw new InvalidParameterError('time', `Invalid time format: ${time}. Expected format: [[HH:]MM:]SS[.mmm]`);
    }
    return time;
  } else if (typeof time === 'object') {
    // Convert object to string
    const hours = time.hours || 0;
    const minutes = time.minutes || 0;
    const seconds = time.seconds;
    const frames = time.frames ? `:${time.frames}` : '';
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}${frames}`;
  }
  
  throw new InvalidParameterError('time', `Unsupported time format: ${time}`);
}

/**
 * Generates a temporary file path
 */
export function generateTempFilePath(extension: string, tempDir?: string): string {
  const uuid = uuidv4();
  const dir = tempDir || path.join(process.cwd(), 'temp');
  
  // Ensure the temp directory exists
  fs.ensureDirSync(dir);
  
  return path.join(dir, `${uuid}.${extension}`);
}

/**
 * Determines the file extension from a file path
 */
export function getFileExtension(filePath: string): string {
  return path.extname(filePath).slice(1).toLowerCase();
}

/**
 * Gets the MIME type for a given file extension
 */
export function getMimeType(extension: string): string {
  const mimeTypes: { [key: string]: string } = {
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    mkv: 'video/x-matroska',
    webm: 'video/webm',
    gif: 'image/gif',
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
}