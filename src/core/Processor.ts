import * as path from 'path';
import * as fs from 'fs-extra';
import execa from 'execa';
import { CommandBuilder } from '../commands/CommandBuilder';
import { 
  ProcessorOptions, 
  TrimOptions, 
  ResizeOptions, 
  OutputOptions,
  ExecutionResult,
  LogLevel,
  TimeSpec
} from '../types';
import { 
  defaultLogger, 
  fileExists, 
  generateTempFilePath, 
  getFileExtension 
} from '../utils';
import { 
  FFmpegExecutionError, 
  FFmpegNotFoundError, 
  InputFileError, 
  MissingParameterError 
} from '../errors';
import { CommandRegistry } from '../commands/CommandRegistry';
import { FFmpegCommandBuilder } from '../commands/FFmpegCommandBuilder';
import { DefaultCommandExecutor } from '../commands/DefaultCommandExecutor';
import { CommandExecutor } from '../commands/CommandExecutor.interface';
import { TrimOperation } from '../operations';

/**
 * Main processor class for handling video operations with a fluent API
 */
export class Processor {
  private inputPath: string | null = null;
  private outputPath: string | null = null;
  private ffmpegPath: string;
  private tempDir: string;
  private builder: CommandBuilder | null = null;
  private logger: NonNullable<ProcessorOptions['logger']>;
  private executor: CommandExecutor;

  constructor(options?: ProcessorOptions) {
    this.ffmpegPath = options?.ffmpegPath || 'ffmpeg';
    this.tempDir = options?.tempDir || path.join(process.cwd(), 'temp');
    this.logger = options?.logger || defaultLogger;
    
    // Get or create command executor
    this.executor = new DefaultCommandExecutor('FFmpegExecutor');
    
    // Ensure temp directory exists
    fs.ensureDirSync(this.tempDir);
  }

  /**
   * Set the input file path
   */
  input(filePath: string): Processor {
    this.inputPath = filePath;
    this.builder = new CommandBuilder(filePath, this.ffmpegPath);
    this.logger(`Input file set to: ${filePath}`, LogLevel.DEBUG);
    return this;
  }

  /**
   * Trim the video by start/end times or duration
   */
  trim(options: TrimOptions): Processor {
    this.ensureInput();
    
    // Create and validate a TrimOperation
    const trimOperation = new TrimOperation(options);
    
    if (!trimOperation.validate()) {
      throw new Error('Invalid trim options provided');
    }
    
    // Apply the operation to the builder
    if (this.builder instanceof CommandBuilder) {
      // Legacy approach for backward compatibility
      this.builder.addTrimOperation(options);
    } else if (this.builder) {
      // Use the new Operation pattern if builder supports it
      (this.builder as any).addOperation(trimOperation);
    }
    
    const logMessage = options.start && (options.end || options.duration)
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
    this.ensureInput();
    
    this.builder!.addResizeOperation(options);
    
    const dimensionStr = [
      options.width ? `width: ${options.width}` : null,
      options.height ? `height: ${options.height}` : null
    ].filter(Boolean).join(', ');
    
    this.logger(`Resizing to ${dimensionStr} (maintain aspect ratio: ${options.maintainAspectRatio !== false})`, LogLevel.DEBUG);
    return this;
  }

  /**
   * Crop the video
   */
  crop(width: number, height: number, x = 0, y = 0): Processor {
    this.ensureInput();
    
    this.builder!.addCropOperation(width, height, x, y);
    this.logger(`Cropping to ${width}x${height} at position (${x},${y})`, LogLevel.DEBUG);
    return this;
  }

  /**
   * Rotate the video
   */
  rotate(degrees: number): Processor {
    this.ensureInput();
    
    this.builder!.addRotateOperation(degrees);
    this.logger(`Rotating by ${degrees} degrees`, LogLevel.DEBUG);
    return this;
  }

  /**
   * Set the output file path and options
   */
  output(outputPath: string, options?: OutputOptions): Processor {
    this.ensureInput();
    
    this.outputPath = outputPath;
    this.builder!.setOutput(outputPath, options);
    
    const optionsStr = options
      ? Object.entries(options)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
      : 'default';
    
    this.logger(`Output set to: ${outputPath} (options: ${optionsStr})`, LogLevel.DEBUG);
    return this;
  }

  /**
   * Execute the FFmpeg command and process the media
   */
  async execute(): Promise<ExecutionResult> {
    this.ensureInput();
    
    if (!this.outputPath) {
      const inputExt = getFileExtension(this.inputPath!);
      this.outputPath = generateTempFilePath(inputExt, this.tempDir);
      this.builder!.setOutput(this.outputPath);
      this.logger(`No output specified, using temporary file: ${this.outputPath}`, LogLevel.DEBUG);
    }
    
    // Check if input file exists
    if (!(await fileExists(this.inputPath!))) {
      throw new InputFileError(this.inputPath!, 'File does not exist');
    }
    
    // Using legacy approach for backward compatibility
    // In future versions, this should use the CommandRegistry and CommandExecutor
    
    const commandArgs = this.builder!.build();
    const command = `${this.ffmpegPath} ${commandArgs.join(' ')}`;
    
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
        stderr
      };
      
      this.logger(`Processing completed in ${duration}ms`, LogLevel.INFO);
      return result;
    } catch (error: any) {
      const stderr = error.stderr || 'Unknown error';
      throw new FFmpegExecutionError(command, stderr);
    }
  }

  /**
   * Helper function to ensure input is set
   */
  private ensureInput(): void {
    if (!this.inputPath || !this.builder) {
      throw new MissingParameterError('input');
    }
  }

  /**
   * Static convenience method to create a processor with input
   */
  static fromFile(filePath: string, options?: ProcessorOptions): Processor {
    return new Processor(options).input(filePath);
  }
}