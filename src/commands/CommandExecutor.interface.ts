import { BaseCommand } from "./BaseCommand";
import { ExecutionResult } from "../types";

/**
 * Interface for executing commands
 */
export interface CommandExecutor {
  /**
   * Execute a command and return the result
   */
  execute(command: BaseCommand): Promise<ExecutionResult>;

  /**
   * Check if the command executor is capable of running a specific command
   */
  canExecute(command: BaseCommand): Promise<boolean>;

  /**
   * Get the name of the executor for identification
   */
  getName(): string;
}
