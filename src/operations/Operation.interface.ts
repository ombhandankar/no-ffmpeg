/**
 * Operation interface representing a single processing operation
 *
 * This is part of the Strategy Pattern where each concrete Operation
 * knows how to apply itself to a CommandBuilder.
 */
export interface Operation {
  /**
   * Applies this operation to the given command builder
   * @param builder The command builder to apply this operation to
   */
  applyTo(builder: any): void;

  /**
   * Validates that the operation parameters are valid
   * @returns true if the operation is valid, false otherwise
   */
  validate(): boolean;
}
