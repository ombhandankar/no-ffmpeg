import * as fs from "fs-extra";
import * as path from "path";
import * as os from "os";
import { Operation } from "./Operation.interface";
import { FFmpegCommand } from "../commands/FFmpegCommand";
import { ConcatOptions } from "../types";
import { InvalidParameterError, InputFileError } from "../errors";

/**
 * Operation to concatenate multiple video files
 */
export class ConcatOperation implements Operation {
  private options: ConcatOptions;
  private tempFilePath: string | null = null;

  constructor(options: ConcatOptions) {
    this.validateOptions(options);
    this.options = {
      ...options,
      strategy: options.strategy || 'filter', // Default to filter strategy
    };
  }

  /**
   * Validates the concat options during construction
   */
  private validateOptions(options: ConcatOptions): void {
    if (!options.inputs || !Array.isArray(options.inputs) || options.inputs.length === 0) {
      throw new InvalidParameterError(
        "inputs",
        "ConcatOperation requires at least one input file"
      );
    }

    // Check all files exist
    for (const filePath of options.inputs) {
      if (!fs.existsSync(filePath)) {
        throw new InputFileError(filePath, `File does not exist: ${filePath}`);
      }
    }

    // Validate strategy if provided
    if (options.strategy && !['demuxer', 'filter'].includes(options.strategy)) {
      throw new InvalidParameterError(
        "strategy",
        "Strategy must be either 'demuxer' or 'filter'"
      );
    }
  }

  /**
   * Validate the operation
   */
  validate(): boolean {
    // Validation is done in the constructor
    return true;
  }

  /**
   * Apply concat operation to the command
   */
  applyTo(command: FFmpegCommand): void {
    // Choose strategy
    if (this.options.strategy === 'demuxer') {
      this.applyDemuxerStrategy(command);
    } else {
      this.applyFilterStrategy(command);
    }
  }

  /**
   * Apply the concat filter complex strategy
   * Uses filter_complex to concat videos
   */
  private applyFilterStrategy(command: FFmpegCommand): void {
    const { inputs } = this.options;
    
    // Add each input file
    inputs.forEach((input, index) => {
      if (index === 0) {
        command.setInput(input);
      } else {
        // For additional inputs, use -i flag
        command.addArgument('-i', input);
      }
    });

    // Since we can't detect audio streams automatically without probing the files,
    // let's add an option to force video-only concatenation
    const videoOnly = this.options.videoOnly === true;
    
    // Build the filter complex string based on whether we're doing video-only or video+audio
    let filterComplex = '';
    
    if (videoOnly) {
      // Video-only concat filter
      // [0:v][1:v]...[n:v]concat=n=X:v=1[outv]
      for (let i = 0; i < inputs.length; i++) {
        filterComplex += `[${i}:v]`;
      }
      
      filterComplex += `concat=n=${inputs.length}:v=1[outv]`;
      
      // Add filter complex to command
      command.addArgument('-filter_complex', filterComplex);
      
      // Map output video stream
      command.addArgument('-map', '[outv]');
      
      // Disable audio - use addArgs directly to add a flag without a value
      command.addArgs('-an');
    } else {
      // Try with video + audio (the original approach)
      // [0:v][0:a][1:v][1:a]...[n:v][n:a]concat=n=X:v=1:a=1[outv][outa]
      for (let i = 0; i < inputs.length; i++) {
        filterComplex += `[${i}:v][${i}:a]`;
      }
      
      filterComplex += `concat=n=${inputs.length}:v=1:a=1[outv][outa]`;
      
      // Add filter complex to command
      command.addArgument('-filter_complex', filterComplex);
      
      // Map output streams
      command.addArgument('-map', '[outv]');
      command.addArgument('-map', '[outa]');
    }
  }

  /**
   * Apply the concat demuxer strategy
   * Creates a concat file and uses the concat demuxer
   */
  private applyDemuxerStrategy(command: FFmpegCommand): void {
    const { inputs } = this.options;
    
    // Create a temporary file listing all input files
    this.tempFilePath = path.join(os.tmpdir(), `concat-${Date.now()}.txt`);
    
    // Write file paths to temp file in format required by concat demuxer
    const fileContent = inputs
      .map(input => `file '${path.resolve(input).replace(/'/g, "'\\''")}'`)
      .join('\n');
    
    fs.writeFileSync(this.tempFilePath, fileContent);
    
    // Add concat demuxer input
    command.addArgument('-f', 'concat');
    command.addArgument('-safe', '0');
    command.setInput(this.tempFilePath);
    
    // Set copy codec to avoid re-encoding
    command.addArgument('-c', 'copy');
  }

  /**
   * Clean up any temporary files created by this operation
   */
  cleanup(): void {
    if (this.tempFilePath && fs.existsSync(this.tempFilePath)) {
      fs.removeSync(this.tempFilePath);
      this.tempFilePath = null;
    }
  }
} 