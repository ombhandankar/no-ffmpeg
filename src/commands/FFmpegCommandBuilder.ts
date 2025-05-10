import { CommandBuilder } from "./CommandBuilder.interface";
import { FFmpegCommand } from "./FFmpegCommand";
import { OutputOptions, TrimOptions, ResizeOptions, FilterType } from "../types";
import { formatTimeSpec, getFFmpegPath } from "../utils";
import { Operation } from "../operations";
import { FilterChain } from "./FilterChain";

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
  private filterChain: FilterChain;
  private additionalInputs: string[] = [];

  constructor(ffmpegPath?: string) {
    this.ffmpegPath = getFFmpegPath(ffmpegPath);
    this.command = new FFmpegCommand(this.ffmpegPath);
    this.filterChain = new FilterChain();
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
   * Add an additional input (for overlays, etc)
   */
  public addInput(input: string): this {
    this.additionalInputs.push(input);
    this.command!.addArgs("-i", input);
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
        this.command!.addArgument("-f", options.format);
      }

      if (options.codec) {
        this.command!.addArgument("-c:v", options.codec);
      }

      if (options.quality) {
        // For x264 and x265, use CRF
        this.command!.addArgument("-crf", options.quality.toString());
      }

      if (options.bitrate) {
        this.command!.addArgument("-b:v", options.bitrate);
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
      this.command!.addArgument("-ss", startTime);
    }

    if (options.end) {
      const endTime = formatTimeSpec(options.end);
      this.command!.addArgument("-to", endTime);
    } else if (options.duration) {
      const duration = formatTimeSpec(options.duration);
      this.command!.addArgument("-t", duration);
    }

    return this;
  }

  /**
   * Add resize operation to the command
   */
  public addResizeOperation(options: ResizeOptions): this {
    const { width, height, maintainAspectRatio = true } = options;

    let scaleFilter = "scale=";

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
    
    // Also add to the new filter chain
    this.filterChain.addFilter(scaleFilter);
    
    return this;
  }

  /**
   * Add crop operation to the command
   */
  public addCropOperation(width: number, height: number, x = 0, y = 0): this {
    const cropFilter = `crop=${width}:${height}:${x}:${y}`;
    this.filters.push(cropFilter);
    
    // Also add to the new filter chain
    this.filterChain.addFilter(cropFilter);
    
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
    let filter: string;

    switch (degrees) {
      case 90:
        rotationValue = "1";
        filter = `transpose=${rotationValue}`;
        break;
      case 180:
        filter = "transpose=2,transpose=2"; // Two 90° rotations
        break;
      case 270:
        rotationValue = "2";
        filter = `transpose=${rotationValue}`;
        break;
      default:
        // For non-standard rotations, use the rotation filter
        filter = `rotate=${(degrees * Math.PI) / 180}`;
        break;
    }

    this.filters.push(filter);
    
    // Also add to the new filter chain
    this.filterChain.addFilter(filter);
    
    return this;
  }

  /**
   * Add a filter to the complex filter chain
   */
  public addComplexFilter(
    filter: string, 
    filterType: FilterType = FilterType.SIMPLE
  ): this {
    this.filterChain.addFilter(filter, filterType);
    return this;
  }

  /**
   * Build the command
   */
  public build(): FFmpegCommand {
    // Process filters through the new filter chain system 
    const complexFilterString = this.filterChain.getComplexFilterString();
    if (complexFilterString) {
      this.command!.addArgument("-filter_complex", complexFilterString);
      
      // If we have complex filters, we need to map the output
      const finalOutput = this.filterChain.getFinalOutputLabel();
      this.command!.addArgument("-map", finalOutput);
    } else {
      // Maintain backward compatibility - use existing filters array if no complex filtering
      if (this.filters.length > 0) {
        this.command!.addFilters(this.filters);
      }
    }

    // Validate the command to ensure output path is added to arguments
    this.command!.validate();

    return this.command!;
  }

  /**
   * Reset the filter chain
   */
  public resetFilters(): this {
    this.filters = [];
    this.filterChain.reset();
    return this;
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
