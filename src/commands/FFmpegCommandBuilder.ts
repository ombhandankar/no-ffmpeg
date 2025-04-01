import { CommandBuilder } from './CommandBuilder.interface';
import { FFmpegCommand } from './FFmpegCommand';
import { OutputOptions, TrimOptions, ResizeOptions } from '../types';
import { formatTimeSpec } from '../utils';
import { Operation } from '../operations';

/**
 * FFmpeg-specific command builder implementation
 */
export class FFmpegCommandBuilder implements CommandBuilder<FFmpegCommand> {
  private inputPath: string | null = null;
  private outputPath: string | null = null;
  private ffmpegPath: string;
  private inputArgs: string[] = [];
  private outputArgs: string[] = [];
  private filters: string[] = [];
  private command: FFmpegCommand | null = null;
  
  constructor(ffmpegPath = 'ffmpeg') {
    this.ffmpegPath = ffmpegPath;
    this.command = new FFmpegCommand(ffmpegPath);
  }
  
  /**
   * Set the input source
   */
  public withInput(input: string): this {
    this.inputPath = input;
    this.command!.setInput(input);
    return this;
  }
  
  /**
   * Set the output destination
   */
  public withOutput(output: string, options?: OutputOptions): this {
    this.outputPath = output;
    this.command!.setOutput(output);
    
    if (options) {
      if (options.format) {
        this.command!.addArgument('-f', options.format);
      }
      
      if (options.codec) {
        this.command!.addArgument('-c:v', options.codec);
      }
      
      if (options.quality) {
        // For x264 and x265, use CRF
        this.command!.addArgument('-crf', options.quality.toString());
      }
      
      if (options.bitrate) {
        this.command!.addArgument('-b:v', options.bitrate);
      }
    }
    
    return this;
  }
  
  /**
   * Add an operation to the command
   */
  public addOperation(operation: Operation): this {
    if (operation.validate()) {
      operation.applyTo(this.command);
    }
    return this;
  }
  
  /**
   * Add trim operation to the command
   */
  public addTrimOperation(options: TrimOptions): this {
    if (options.start) {
      const startTime = formatTimeSpec(options.start);
      this.command!.addArgument('-ss', startTime);
    }
    
    if (options.end) {
      const endTime = formatTimeSpec(options.end);
      this.command!.addArgument('-to', endTime);
    } else if (options.duration) {
      const duration = formatTimeSpec(options.duration);
      this.command!.addArgument('-t', duration);
    }
    
    return this;
  }
  
  /**
   * Add resize operation to the command
   */
  public addResizeOperation(options: ResizeOptions): this {
    const { width, height, maintainAspectRatio = true } = options;
    
    let scaleFilter = 'scale=';
    
    if (width && height) {
      scaleFilter += maintainAspectRatio ? `${width}:-1` : `${width}:${height}`;
    } else if (width) {
      scaleFilter += `${width}:-1`;
    } else if (height) {
      scaleFilter += `-1:${height}`;
    } else {
      return this; // No resize needed
    }
    
    this.filters.push(scaleFilter);
    return this;
  }
  
  /**
   * Add crop operation to the command
   */
  public addCropOperation(width: number, height: number, x = 0, y = 0): this {
    this.filters.push(`crop=${width}:${height}:${x}:${y}`);
    return this;
  }
  
  /**
   * Add rotate operation to the command
   */
  public addRotateOperation(degrees: number): this {
    // FFmpeg uses a different rotation system
    // 0 = 90° CounterCLockwise and Vertical Flip
    // 1 = 90° Clockwise
    // 2 = 90° CounterClockwise
    // 3 = 90° Clockwise and Vertical Flip
    
    let rotationValue: string;
    
    switch (degrees) {
      case 90:
        rotationValue = '1';
        break;
      case 180:
        rotationValue = '2,transpose=2'; // Two 90° rotations
        break;
      case 270:
        rotationValue = '2';
        break;
      default:
        // For non-standard rotations, use the rotation filter
        this.filters.push(`rotate=${degrees * Math.PI / 180}`);
        return this;
    }
    
    this.filters.push(`transpose=${rotationValue}`);
    return this;
  }
  
  /**
   * Build the command
   */
  public build(): FFmpegCommand {
    // Add filters if any
    if (this.filters.length > 0) {
      this.command!.addFilters(this.filters);
    }
    
    return this.command!;
  }
  
  /**
   * Validate the command configuration
   */
  public validate(): boolean {
    if (!this.inputPath) {
      return false;
    }
    
    if (!this.outputPath) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Convert the command to string for debugging
   */
  public toString(): string {
    return this.command!.toString();
  }
} 