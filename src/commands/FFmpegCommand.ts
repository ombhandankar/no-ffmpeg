import { BaseCommand } from "./BaseCommand";
import { MissingParameterError } from "../errors";
import { getFFmpegPath } from "../utils";

/**
 * FFmpeg-specific command implementation
 */
export class FFmpegCommand extends BaseCommand {
  private inputPath: string | null = null;
  private outputPath: string | null = null;

  constructor(ffmpegPath?: string) {
    super(getFFmpegPath(ffmpegPath));
  }

  /**
   * Set the input file
   */
  public setInput(inputPath: string): this {
    this.inputPath = inputPath;
    this.addArgs("-i", inputPath);
    return this;
  }

  /**
   * Set the output file
   */
  public setOutput(outputPath: string): this {
    this.outputPath = outputPath;
    // The output path should be the last argument
    // Store it separately and add it during validate()
    return this;
  }

  /**
   * Add a key-value argument
   */
  public addArgument(key: string, value: string): this {
    this.addArgs(key, value);
    return this;
  }

  /**
   * Add a filter to the command
   */
  public addFilter(filterName: string, filterValue: string): this {
    this.addArgs("-filter:v", `${filterName}=${filterValue}`);
    return this;
  }

  /**
   * Add multiple filters at once
   */
  public addFilters(filters: string[]): this {
    if (filters.length > 0) {
      this.addArgs("-vf", filters.join(","));
    }
    return this;
  }

  /**
   * Validate the command configuration
   */
  public validate(): boolean {
    if (!this.inputPath) {
      throw new MissingParameterError("input");
    }

    if (!this.outputPath) {
      throw new MissingParameterError("output");
    }

    // Add output path as the last argument if it's not already there
    const lastArg = this.args[this.args.length - 1];
    if (lastArg !== this.outputPath) {
      this.addArgs(this.outputPath);
    }

    return true;
  }

  /**
   * Get the input path
   */
  public getInputPath(): string | null {
    return this.inputPath;
  }

  /**
   * Get the output path
   */
  public getOutputPath(): string | null {
    return this.outputPath;
  }
}
