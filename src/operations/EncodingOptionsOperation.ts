import { FFmpegCommand } from "../commands/FFmpegCommand";
import { EncodingOptions } from "../types";
import { Operation } from "./Operation.interface";
import { InvalidParameterError } from "../errors";

/**
 * Operation to control video encoding parameters like bitrate, quality (CRF), preset, and codec
 */
export class EncodingOptionsOperation implements Operation {
  private options: EncodingOptions;

  constructor(options: EncodingOptions) {
    this.validateOptions(options);
    this.options = options;
  }

  /**
   * Validates the encoding options during construction
   */
  private validateOptions(options: EncodingOptions): void {
    // Check that at least one option is provided
    if (Object.keys(options).length === 0) {
      throw new InvalidParameterError("options", "EncodingOptions requires at least one option to be set");
    }

    // Validate CRF is in a reasonable range if provided
    if (options.crf !== undefined) {
      if (options.crf < 0 || options.crf > 51) {
        throw new InvalidParameterError("crf", "CRF must be between 0 and 51");
      }
    }

    // Validate preset if provided
    if (options.preset !== undefined) {
      const validPresets = [
        "ultrafast",
        "superfast",
        "veryfast",
        "faster",
        "fast",
        "medium",
        "slow",
        "slower",
        "veryslow",
      ];
      if (!validPresets.includes(options.preset)) {
        throw new InvalidParameterError("preset", `Preset must be one of: ${validPresets.join(', ')}`);
      }
    }
  }

  /**
   * Validate the encoding options
   */
  validate(): boolean {
    // Validation is done in the constructor
    return true;
  }

  /**
   * Apply encoding options to the command builder
   */
  applyTo(command: FFmpegCommand): void {
    if (this.options.codec) {
      command.addArgument("-c:v", this.options.codec);
    }

    if (this.options.videoBitrate) {
      command.addArgument("-b:v", this.options.videoBitrate);
    }

    if (this.options.crf !== undefined) {
      command.addArgument("-crf", this.options.crf.toString());
    }

    if (this.options.preset) {
      command.addArgument("-preset", this.options.preset);
    }
  }
} 