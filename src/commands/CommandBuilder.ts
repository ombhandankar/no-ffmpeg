import { OutputOptions, TrimOptions, ResizeOptions } from "../types";
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
