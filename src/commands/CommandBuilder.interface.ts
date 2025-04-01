import { BaseCommand } from "./BaseCommand";

/**
 * Generic interface for building commands
 */
export interface CommandBuilder<T extends BaseCommand> {
  /**
   * Sets the input source for the command
   */
  withInput(input: string): this;

  /**
   * Sets the output destination for the command
   */
  withOutput(output: string, options?: any): this;

  /**
   * Builds and returns the final command object
   */
  build(): T;

  /**
   * Validates the command configuration
   */
  validate(): boolean;

  /**
   * Converts the command to string for debugging
   */
  toString(): string;
}
