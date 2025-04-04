import { OutputOptions, TrimOptions, ResizeOptions, OverlayOptions, TextOptions } from "../types";
import { FFmpegCommandBuilder } from "./FFmpegCommandBuilder";
import { FFmpegCommand } from "./FFmpegCommand";

/**
 * CommandBuilder class that is a facade for the FFmpegCommandBuilder
 * This maintains backward compatibility with existing code
 */
export class CommandBuilder {
  private builder: FFmpegCommandBuilder;

  constructor(inputPath: string, ffmpegPath = "ffmpeg") {
    this.builder = new FFmpegCommandBuilder(ffmpegPath);
    this.builder.withInput(inputPath);
  }

  /**
   * Add trim operation
   */
  addTrimOperation(options: TrimOptions): CommandBuilder {
    this.builder.addTrimOperation(options);
    return this;
  }

  /**
   * Add resize operation
   */
  addResizeOperation(options: ResizeOptions): CommandBuilder {
    this.builder.addResizeOperation(options);
    return this;
  }

  /**
   * Add crop operation
   */
  addCropOperation(
    width: number,
    height: number,
    x: number,
    y: number,
  ): CommandBuilder {
    this.builder.addCropOperation(width, height, x, y);
    return this;
  }

  /**
   * Add rotate operation
   */
  addRotateOperation(degrees: number): CommandBuilder {
    this.builder.addRotateOperation(degrees);
    return this;
  }

  /**
   * Add overlay operation
   */
  addOverlayOperation(options: OverlayOptions): CommandBuilder {
    // Forward to the FFmpegCommandBuilder
    // The actual implementation will be handled by the OverlayOperation class
    const { OverlayOperation } = require("../operations/OverlayOperation");
    const overlayOperation = new OverlayOperation(options);
    
    if (overlayOperation.validate()) {
      overlayOperation.applyTo(this.builder);
    }
    
    return this;
  }

  /**
   * Add text operation
   */
  addTextOperation(options: TextOptions): CommandBuilder {
    // Forward to the FFmpegCommandBuilder
    // The actual implementation will be handled by the TextOperation class
    const { TextOperation } = require("../operations/TextOperation");
    const textOperation = new TextOperation(options);
    
    if (textOperation.validate()) {
      textOperation.applyTo(this.builder);
    }
    
    return this;
  }

  /**
   * Set output file path and options
   */
  setOutput(outputPath: string, options?: OutputOptions): CommandBuilder {
    this.builder.withOutput(outputPath, options);
    return this;
  }

  /**
   * Build the complete FFmpeg command array
   */
  build(): string[] {
    const command = this.builder.build();
    return command.getArgs();
  }

  /**
   * Get the command as a string for debugging
   */
  toString(): string {
    return this.builder.toString();
  }
}
