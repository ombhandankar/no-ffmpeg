import { Operation } from "./Operation.interface";
import { OverlayOptions, Position, FilterType } from "../types";
import { FFmpegCommandBuilder } from "../commands/FFmpegCommandBuilder";
import { formatTimeSpec } from "../utils";
import * as path from "path";
import * as fs from "fs-extra";

/**
 * Operation for adding an image overlay to a video
 */
export class OverlayOperation implements Operation {
  private options: OverlayOptions;
  
  /**
   * Create a new overlay operation
   * @param options Options for the overlay
   */
  constructor(options: OverlayOptions) {
    this.options = options;
  }
  
  /**
   * Validate the overlay options
   */
  validate(): boolean {
    // Check if source file exists
    if (!this.options.source || !fs.existsSync(this.options.source)) {
      return false;
    }
    
    // Validate opacity
    if (this.options.opacity !== undefined && (this.options.opacity < 0 || this.options.opacity > 1)) {
      return false;
    }
    
    // Validate scale
    if (this.options.scale !== undefined && this.options.scale <= 0) {
      return false;
    }
    
    // Check if both absolute and relative positioning are specified
    if (this.options.position && (this.options.x !== undefined || this.options.y !== undefined)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Apply the overlay operation to the command builder
   * @param builder The command builder to apply the operation to
   */
  applyTo(builder: any): void {
    if (!(builder instanceof FFmpegCommandBuilder)) {
      throw new Error("OverlayOperation requires an FFmpegCommandBuilder");
    }
    
    // Add the overlay image as an input
    builder.addInput(this.options.source);
    
    // Determine the input index (0 is the main video, additional inputs start at 1)
    const overlayIndex = builder["additionalInputs"]?.length || 1;
    
    // Build the filter string
    let filterStr = this.buildOverlayFilter(overlayIndex);
    
    // Add to the filter chain as a complex filter (needs multiple inputs)
    builder.addComplexFilter(filterStr, FilterType.COMPLEX);
  }
  
  /**
   * Build the overlay filter string
   * @param inputIndex The index of the overlay input
   * @returns The complete overlay filter string
   */
  private buildOverlayFilter(inputIndex: number): string {
    // The FilterChain should handle input/output labels, so we need to return
    // only the filter operation without the input/output labels
    
    // If we need to scale the overlay
    let scaleFilter = "";
    if (this.options.scale || this.options.width || this.options.height) {
      scaleFilter = `scale=`;
      
      if (this.options.width && this.options.height) {
        scaleFilter += `${this.options.width}:${this.options.height}`;
      } else if (this.options.width) {
        scaleFilter += `${this.options.width}:-1`;
      } else if (this.options.height) {
        scaleFilter += `-1:${this.options.height}`;
      } else if (this.options.scale) {
        // Use the input's width and height with scale factor
        scaleFilter += `iw*${this.options.scale}:ih*${this.options.scale}`;
      }
    }
    
    // If we need to set opacity
    let opacityFilter = "";
    if (this.options.opacity !== undefined && this.options.opacity < 1) {
      opacityFilter = `format=rgba,colorchannelmixer=a=${this.options.opacity}`;
    }
    
    // The overlay filter
    let overlayFilter = "overlay=";
    
    // Position the overlay
    if (this.options.position) {
      // Predefined position
      const position = this.getPositionCoordinates(this.options.position);
      overlayFilter += position;
    } else if (this.options.x !== undefined && this.options.y !== undefined) {
      // Absolute position
      overlayFilter += `${this.options.x}:${this.options.y}`;
    } else {
      // Default to top-left
      overlayFilter += "0:0";
    }
    
    // Add timing if needed
    if (this.options.start || this.options.end) {
      const startTime = this.options.start ? formatTimeSpec(this.options.start, true) : "0";
      const endTime = this.options.end ? formatTimeSpec(this.options.end, true) : "999999";
      
      // FFmpeg between function doesn't like spaces after commas
      overlayFilter += `:enable='between(t,${startTime},${endTime})'`;
    }
    
    // Return the combined filter string for the FilterChain to handle
    return `overlay=${overlayFilter.substring(8)}`; // Remove the duplicate "overlay=" prefix
  }
  
  /**
   * Convert position enum to x:y coordinates with padding
   * @param position The position enum or string
   * @returns The FFmpeg overlay position string
   */
  private getPositionCoordinates(position: Position | string): string {
    const padding = this.options.padding || 10;
    
    switch (position) {
      case Position.TOP_LEFT:
        return `${padding}:${padding}`;
      case Position.TOP:
        return `(main_w-overlay_w)/2:${padding}`;
      case Position.TOP_RIGHT:
        return `main_w-overlay_w-${padding}:${padding}`;
      case Position.LEFT:
        return `${padding}:(main_h-overlay_h)/2`;
      case Position.CENTER:
        return `(main_w-overlay_w)/2:(main_h-overlay_h)/2`;
      case Position.RIGHT:
        return `main_w-overlay_w-${padding}:(main_h-overlay_h)/2`;
      case Position.BOTTOM_LEFT:
        return `${padding}:main_h-overlay_h-${padding}`;
      case Position.BOTTOM:
        return `(main_w-overlay_w)/2:main_h-overlay_h-${padding}`;
      case Position.BOTTOM_RIGHT:
        return `main_w-overlay_w-${padding}:main_h-overlay_h-${padding}`;
      default:
        return `${padding}:${padding}`;
    }
  }
} 