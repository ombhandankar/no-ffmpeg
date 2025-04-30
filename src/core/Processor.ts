import * as path from "path";
import * as fs from "fs-extra";
import execa from "execa";
import { CommandBuilder } from "../commands/CommandBuilder.interface";
import {
  ProcessorOptions,
  TrimOptions,
  ResizeOptions,
  OutputOptions,
  ExecutionResult,
  LogLevel,
  TimeSpec,
  TextOptions,
  OverlayOptions,
  AdjustColorOptions,
  EncodingOptions,
  ConcatOptions,
} from "../types";
import {
  defaultLogger,
  fileExists,
  generateTempFilePath,
  getFileExtension,
} from "../utils";
import {
  FFmpegExecutionError,
  FFmpegNotFoundError,
  InputFileError,
  MissingParameterError,
} from "../errors";
import { CommandRegistry } from "../commands/CommandRegistry";
import { FFmpegCommandBuilder } from "../commands/FFmpegCommandBuilder";
import { DefaultCommandExecutor } from "../commands/DefaultCommandExecutor";
import { CommandExecutor } from "../commands/CommandExecutor.interface";
import { TrimOperation } from "../operations";
import { TextOperation } from "../operations/TextOperation";
import { OverlayOperation } from "../operations/OverlayOperation";
import { SpeedOperation } from "../operations/SpeedOperation";
import { AdjustColorOperation } from "../operations/AdjustColorOperation";
import { EncodingOptionsOperation } from "../operations/EncodingOptionsOperation";
import { ConcatOperation } from "../operations/ConcatOperation";

/**
 * Main processor class for handling video operations with a fluent API
 */
export class Processor {
  private inputPath: string | null = null;
  private outputPath: string | null = null;
  private ffmpegPath: string;
  private tempDir: string;
  private builder: FFmpegCommandBuilder | null = null;
  private logger: NonNullable<ProcessorOptions["logger"]>;
  private executor: CommandExecutor;

  constructor(options?: ProcessorOptions) {
    this.ffmpegPath = options?.ffmpegPath || "ffmpeg";
    this.tempDir = options?.tempDir || path.join(process.cwd(), "temp");
    this.logger = options?.logger || defaultLogger;

    // Get or create command executor
    this.executor = new DefaultCommandExecutor("FFmpegExecutor");

    // Ensure temp directory exists
    fs.ensureDirSync(this.tempDir);
  }

  /**
   * Set the input file path
   */
  input(filePath: string): Processor {
    this.inputPath = filePath;
    this.builder = new FFmpegCommandBuilder(this.ffmpegPath);
    this.builder.withInput(filePath);
    this.logger(`Input file set to: ${filePath}`, LogLevel.DEBUG);
    return this;
  }

  /**
   * Trim the video by start/end times or duration
   */
  trim(options: TrimOptions): Processor {
    this.ensureBuilder();
    const trimOperation = new TrimOperation(options);
    if (trimOperation.validate()) {
      this.builder!.addOperation(trimOperation);
    }

    const logMessage =
      options.start && (options.end || options.duration)
        ? `Trimming from ${options.start} to ${options.end || `duration: ${options.duration}`}`
        : options.start
          ? `Trimming from ${options.start} to end`
          : options.end
            ? `Trimming from beginning to ${options.end}`
            : `Trimming with duration ${options.duration}`;

    this.logger(logMessage, LogLevel.DEBUG);
    return this;
  }

  /**
   * Resize the video
   */
  resize(options: ResizeOptions): Processor {
    this.ensureBuilder();
    this.builder!.addResizeOperation(options);

    const dimensionStr = [
      options.width ? `width: ${options.width}` : null,
      options.height ? `height: ${options.height}` : null,
    ]
      .filter(Boolean)
      .join(", ");

    this.logger(
      `Resizing to ${dimensionStr} (maintain aspect ratio: ${options.maintainAspectRatio !== false})`,
      LogLevel.DEBUG,
    );
    return this;
  }

  /**
   * Crop the video
   */
  crop(width: number, height: number, x = 0, y = 0): Processor {
    this.ensureBuilder();
    this.builder!.addCropOperation(width, height, x, y);
    this.logger(
      `Cropping to ${width}x${height} at position (${x},${y})`,
      LogLevel.DEBUG,
    );
    return this;
  }

  /**
   * Rotate the video
   */
  rotate(degrees: number): Processor {
    this.ensureBuilder();
    this.builder!.addRotateOperation(degrees);
    this.logger(`Rotating by ${degrees} degrees`, LogLevel.DEBUG);
    return this;
  }

  /**
   * Add text overlay to the video
   */
  addTextOperation(options: TextOptions): Processor {
    this.ensureBuilder();
    const textOp = new TextOperation(options);
    if (textOp.validate()) {
      this.builder!.addOperation(textOp);
      this.logger(`Adding text overlay: ${options.text}`, LogLevel.DEBUG);
    }
    return this;
  }

  /**
   * Add text overlay to the video (alias for addTextOperation)
   */
  text(options: TextOptions): Processor {
    return this.addTextOperation(options);
  }

  /**
   * Add image overlay to the video
   */
  addOverlayOperation(options: OverlayOptions): Processor {
    this.ensureBuilder();
    const overlayOp = new OverlayOperation(options);
    if (overlayOp.validate()) {
      this.builder!.addOperation(overlayOp);
      this.logger(`Adding overlay from: ${options.source}`, LogLevel.DEBUG);
    }
    return this;
  }

  /**
   * Add image overlay to the video (alias for addOverlayOperation)
   */
  overlay(options: OverlayOptions): Processor {
    return this.addOverlayOperation(options);
  }

  /**
   * Changes the playback speed of the video and audio.
   * @param factor - The speed multiplication factor (e.g., 2.0 for double speed, 0.5 for half speed).
   * @returns The processor instance for chaining.
   */
  speed(factor: number): this {
    this.ensureBuilder();
    const speedOp = new SpeedOperation(factor);
    this.builder!.addOperation(speedOp);
    this.logger(`Setting speed factor to ${factor}`, LogLevel.DEBUG);
    return this;
  }

  /**
   * Adjusts the brightness, contrast, and/or saturation of the video.
   * @param options - An object containing the desired adjustments.
   * @returns The processor instance for chaining.
   */
  adjustColor(options: AdjustColorOptions): this {
    this.ensureBuilder();
    if (Object.keys(options).length === 0) {
       this.logger(`AdjustColor called with empty options, skipping.`, LogLevel.WARN);
       return this;
    }
    const adjustColorOp = new AdjustColorOperation(options);
    this.builder!.addOperation(adjustColorOp);

    const adjustments = Object.entries(options)
        .map(([key, value]) => `${key}: ${value}`)
        .join(", ");
    this.logger(`Adjusting color: ${adjustments}`, LogLevel.DEBUG);
    return this;
  }

  /**
   * Set the output file path and options
   */
  output(outputPath: string, options?: OutputOptions): Processor {
    this.ensureBuilder();
    this.outputPath = outputPath;
    this.builder!.withOutput(outputPath, options);

    const optionsStr = options
      ? Object.entries(options)
          .map(([key, value]) => `${key}: ${value}`)
          .join(", ")
      : "default";

    this.logger(
      `Output set to: ${outputPath} (options: ${optionsStr})`,
      LogLevel.DEBUG,
    );
    return this;
  }

  /**
   * Sets encoding options for the output, like bitrate, quality (CRF), preset, and codec.
   * @param options - An object containing the encoding parameters.
   * @returns The processor instance for chaining.
   */
  encoding(options: EncodingOptions): this {
    this.ensureBuilder();
    if (Object.keys(options).length === 0) {
      this.logger(`Encoding called with empty options, skipping.`, LogLevel.WARN);
      return this;
    }
    const encodingOp = new EncodingOptionsOperation(options);
    this.builder!.addOperation(encodingOp);

    const encodingParams = Object.entries(options)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
    this.logger(`Setting encoding options: ${encodingParams}`, LogLevel.DEBUG);
    return this;
  }

  /**
   * Concatenates multiple video files.
   * @param options - Options for concatenation including array of input files and strategy.
   * @returns The processor instance for chaining.
   */
  concat(options: ConcatOptions): this {
    // Initialize the builder if it doesn't exist already
    if (!this.builder) {
      // Use the first input file to initialize
      if (options.inputs.length > 0) {
        this.inputPath = options.inputs[0];
        this.builder = new FFmpegCommandBuilder(this.ffmpegPath);
        // Note: We don't call builder.withInput() here because the ConcatOperation will handle all inputs
      } else {
        throw new Error("Concat operation requires at least one input file");
      }
    }
    
    const concatOp = new ConcatOperation(options);
    this.builder!.addOperation(concatOp);
    this.logger(
      `Concatenating ${options.inputs.length} files using ${options.strategy || 'filter'} strategy`,
      LogLevel.DEBUG
    );
    return this;
  }

  /**
   * Execute the FFmpeg command and process the media
   */
  async execute(): Promise<ExecutionResult> {
    this.ensureBuilder();

    if (!this.outputPath) {
      const inputExt = getFileExtension(this.inputPath!);
      this.outputPath = generateTempFilePath(inputExt, this.tempDir);
      this.builder!.withOutput(this.outputPath);
      this.logger(
        `No output specified, using temporary file: ${this.outputPath}`,
        LogLevel.DEBUG,
      );
    }

    // Check if input file exists
    if (!(await fileExists(this.inputPath!))) {
      throw new InputFileError(this.inputPath!, "File does not exist");
    }

    // Using legacy approach for backward compatibility
    // In future versions, this should use the CommandRegistry and CommandExecutor

    const commandInstance = this.builder!.build();
    const commandArgs = commandInstance.getArgs();
    const command = `${this.ffmpegPath} ${commandArgs.join(" ")}`;

    this.logger(`Executing command: ${command}`, LogLevel.INFO);

    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execa(this.ffmpegPath, commandArgs);

      const endTime = Date.now();
      const duration = endTime - startTime;

      const result: ExecutionResult = {
        success: true,
        outputPath: this.outputPath,
        duration,
        commandExecuted: command,
        stdout,
        stderr,
      };

      this.logger(`Processing completed in ${duration}ms`, LogLevel.INFO);
      return result;
    } catch (error: any) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const stderr = error.stderr || error.message || "Unknown execution error";
      this.logger(`Command execution failed: ${stderr}`, LogLevel.ERROR);
      throw new FFmpegExecutionError(command, stderr);
    }
  }

  /**
   * Ensure that the builder has been initialized.
   */
  private ensureBuilder(): void {
    if (!this.builder) {
      throw new Error("Input must be set before adding operations or output.");
    }
  }

  /**
   * Static convenience method to create a processor with input
   */
  static fromFile(filePath: string, options?: ProcessorOptions): Processor {
    return new Processor(options).input(filePath);
  }

  /**
   * Static convenience method to concatenate multiple video files
   */
  static concat(options: ConcatOptions, processorOptions?: ProcessorOptions): Processor {
    const processor = new Processor(processorOptions);
    if (options.inputs.length === 0) {
      throw new Error("Concat operation requires at least one input file");
    }
    
    // Initialize the builder properly for the new processor
    processor.inputPath = options.inputs[0];
    processor.builder = new FFmpegCommandBuilder(processor.ffmpegPath);
    // Note: We don't call builder.withInput() here because ConcatOperation will handle all inputs
    
    // Now add the concat operation
    return processor.concat(options);
  }
}
