import { Operation } from './Operation.interface';
import { FFmpegCommand } from '../commands/FFmpegCommand';
import { AdjustColorOptions } from '../types';
import { InvalidParameterError } from '../errors';

/**
 * Represents an operation to adjust video brightness, contrast, and saturation.
 */
export class AdjustColorOperation implements Operation {
  readonly options: AdjustColorOptions;

  /**
   * Creates an instance of AdjustColorOperation.
   * @param options - The color adjustment parameters.
   */
  constructor(options: AdjustColorOptions) {
    this.validateOptions(options); // Perform validation during construction
    this.options = options;
  }

  private validateOptions(options: AdjustColorOptions): void {
    // Basic validation - refine ranges as needed based on FFmpeg behavior
    if (options.brightness !== undefined && (options.brightness < -1.0 || options.brightness > 1.0)) {
      throw new InvalidParameterError('brightness', 'Brightness must be between -1.0 and 1.0.');
    }
    if (options.contrast !== undefined && (options.contrast < -2.0 || options.contrast > 2.0)) {
      throw new InvalidParameterError('contrast', 'Contrast must be between -2.0 and 2.0.');
    }
    if (options.saturation !== undefined && (options.saturation < 0.0 || options.saturation > 3.0)) {
      throw new InvalidParameterError('saturation', 'Saturation must be between 0.0 and 3.0.');
    }
    if (
      options.brightness === undefined &&
      options.contrast === undefined &&
      options.saturation === undefined
    ) {
      throw new InvalidParameterError('options', 'AdjustColorOperation requires at least one option (brightness, contrast, or saturation).');
    }
  }

  /**
   * Validates the operation parameters.
   * @returns true if the parameters are valid.
   */
  validate(): boolean {
    // Validation logic is in the constructor
    return true;
  }

  /**
   * Applies the color adjustment operation to the FFmpeg command.
   * @param command - The FFmpeg command instance.
   */
  applyTo(command: FFmpegCommand): void {
    const eqOptions: string[] = [];
    if (this.options.brightness !== undefined) {
      eqOptions.push(`brightness=${this.options.brightness}`);
    }
    if (this.options.contrast !== undefined) {
      eqOptions.push(`contrast=${this.options.contrast}`);
    }
    if (this.options.saturation !== undefined) {
      eqOptions.push(`saturation=${this.options.saturation}`);
    }

    if (eqOptions.length > 0) {
      command.addFilter('eq', eqOptions.join(':'));
    }
  }
} 