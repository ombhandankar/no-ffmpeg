/**
 * Abstract base class representing a command-line tool command
 */
export abstract class BaseCommand {
  protected args: string[] = [];
  protected program: string;

  constructor(program: string) {
    this.program = program;
  }

  /**
   * Get all command arguments as an array
   */
  public getArgs(): string[] {
    return [...this.args];
  }

  /**
   * Get the complete command as a string for debugging
   */
  public toString(): string {
    return [this.program, ...this.args].join(" ");
  }

  /**
   * Add command arguments
   */
  public addArgs(...newArgs: string[]): this {
    this.args.push(...newArgs);
    return this;
  }

  /**
   * Validate that the command is properly configured
   */
  public abstract validate(): boolean;

  /**
   * Get the command executable name
   */
  public getProgram(): string {
    return this.program;
  }
}
