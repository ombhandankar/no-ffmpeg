import { Operation } from "./Operation.interface";
import { TextOptions, Position, FilterType } from "../types";
import { FFmpegCommandBuilder } from "../commands/FFmpegCommandBuilder";
import { FFmpegCommand } from "../commands/FFmpegCommand";
import { formatTimeSpec } from "../utils";

/**
 * Operation for adding text overlays to a video
 */
export class TextOperation implements Operation {
  private options: TextOptions;
  
  /**
   * Create a new text operation
   * @param options Options for the text overlay
   */
  constructor(options: TextOptions) {
    this.options = options;
  }
  
  /**
   * Validate the text options
   */
  validate(): boolean {
    // Check if text is provided
    if (!this.options.text || this.options.text.trim() === "") {
      return false;
    }
    
    // Check if both absolute and relative positioning are specified
    if (this.options.position && (this.options.x !== undefined || this.options.y !== undefined)) {
      return false;
    }
    
    // Validate font size
    if (this.options.fontSize !== undefined && this.options.fontSize <= 0) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Apply the text operation to the command builder
   * @param builder The command builder to apply the operation to
   */
  applyTo(builder: any): void {
    if (!(builder instanceof FFmpegCommandBuilder) && !(builder instanceof FFmpegCommand)) {
      throw new Error("TextOperation requires an FFmpegCommandBuilder or FFmpegCommand");
    }
    
    // Build the filter string
    let filterStr = this.buildTextFilter();
    
    if (builder instanceof FFmpegCommandBuilder) {
      // Add to the filter chain as a complex filter
      // Let FilterChain handle the input and output labels
      builder.addComplexFilter(filterStr, FilterType.COMPLEX);
    } else {
      // For FFmpegCommand, add as a video filter
      builder.addFilter("drawtext", filterStr.replace("drawtext=", ""));
    }
  }
  
  /**
   * Build the text filter string
   * @returns The complete text filter string
   */
  private buildTextFilter(): string {
    // Start with main video stream - no need to include it here as the filter chain will handle input labels
    let filter = "";
    
    // Build the drawtext filter
    filter += "drawtext=";
    
    // Escape special characters in text
    const escapedText = this.options.text
      .replace(/:/g, "\\:")
      .replace(/'/g, "\\'")
      .replace(/\\/g, "\\\\");
    
    // Add text
    filter += `text='${escapedText}'`;
    
    // Add font file if specified
    if (this.options.fontFile) {
      filter += `:fontfile='${this.options.fontFile}'`;
    }
    
    // Add font size
    filter += `:fontsize=${this.options.fontSize || 24}`;
    
    // Add font color
    filter += `:fontcolor=${this.options.fontColor || "white"}`;
    
    // Add background color if specified
    if (this.options.backgroundColor) {
      filter += `:box=1:boxcolor=${this.options.backgroundColor}`;
      
      // Add border width if specified
      if (this.options.boxBorder) {
        filter += `:boxborderw=${this.options.boxBorder}`;
      }
    }
    
    // Add position
    if (this.options.position) {
      const position = this.getPositionCoordinates(this.options.position);
      filter += position;
    } else if (this.options.x !== undefined && this.options.y !== undefined) {
      filter += `:x=${this.options.x}:y=${this.options.y}`;
    } else {
      // Default to center
      filter += `:x=(w-text_w)/2:y=(h-text_h)/2`;
    }
    
    // Add timing if needed
    if (this.options.start || this.options.end) {
      const startTime = this.options.start ? formatTimeSpec(this.options.start, true) : "0";
      const endTime = this.options.end ? formatTimeSpec(this.options.end, true) : "999999";
      
      // FFmpeg between function doesn't like spaces after commas
      filter += `:enable='between(t,${startTime},${endTime})'`;
    }
    
    // No need to add an output label here, the filter chain will handle it
    return filter;
  }
  
  /**
   * Convert position enum to x:y coordinates for drawtext
   * @param position The position enum or string
   * @returns The FFmpeg drawtext position parameters
   */
  private getPositionCoordinates(position: Position | string): string {
    const padding = this.options.padding || 10;
    
    switch (position) {
      case Position.TOP_LEFT:
        return `:x=${padding}:y=${padding}`;
      case Position.TOP:
        return `:x=(w-text_w)/2:y=${padding}`;
      case Position.TOP_RIGHT:
        return `:x=w-text_w-${padding}:y=${padding}`;
      case Position.LEFT:
        return `:x=${padding}:y=(h-text_h)/2`;
      case Position.CENTER:
        return `:x=(w-text_w)/2:y=(h-text_h)/2`;
      case Position.RIGHT:
        return `:x=w-text_w-${padding}:y=(h-text_h)/2`;
      case Position.BOTTOM_LEFT:
        return `:x=${padding}:y=h-text_h-${padding}`;
      case Position.BOTTOM:
        return `:x=(w-text_w)/2:y=h-text_h-${padding}`;
      case Position.BOTTOM_RIGHT:
        return `:x=w-text_w-${padding}:y=h-text_h-${padding}`;
      default:
        return `:x=${padding}:y=${padding}`;
    }
  }
} 