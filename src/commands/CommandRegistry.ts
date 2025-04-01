import { BaseCommand } from "./BaseCommand";
import { CommandBuilder } from "./CommandBuilder.interface";
import { CommandExecutor } from "./CommandExecutor.interface";
import { DefaultCommandExecutor } from "./DefaultCommandExecutor";

type CommandConstructor<T extends BaseCommand> = new (...args: any[]) => T;
type BuilderConstructor<
  T extends BaseCommand,
  B extends CommandBuilder<T>,
> = new (...args: any[]) => B;

/**
 * Registry for command types and their associated builders
 */
export class CommandRegistry {
  private static instance: CommandRegistry;
  private commandMap: Map<string, CommandConstructor<BaseCommand>> = new Map();
  private builderMap: Map<
    string,
    BuilderConstructor<BaseCommand, CommandBuilder<BaseCommand>>
  > = new Map();
  private executors: CommandExecutor[] = [];

  private constructor() {
    // Register default executor
    this.registerExecutor(new DefaultCommandExecutor());
  }

  /**
   * Get the singleton instance of the registry
   */
  public static getInstance(): CommandRegistry {
    if (!CommandRegistry.instance) {
      CommandRegistry.instance = new CommandRegistry();
    }
    return CommandRegistry.instance;
  }

  /**
   * Register a command type
   */
  public registerCommand<T extends BaseCommand>(
    name: string,
    commandConstructor: CommandConstructor<T>,
  ): void {
    this.commandMap.set(
      name,
      commandConstructor as CommandConstructor<BaseCommand>,
    );
  }

  /**
   * Register a builder for a command type
   */
  public registerBuilder<T extends BaseCommand, B extends CommandBuilder<T>>(
    commandType: string,
    builderConstructor: BuilderConstructor<T, B>,
  ): void {
    this.builderMap.set(
      commandType,
      builderConstructor as BuilderConstructor<
        BaseCommand,
        CommandBuilder<BaseCommand>
      >,
    );
  }

  /**
   * Register a command executor
   */
  public registerExecutor(executor: CommandExecutor): void {
    this.executors.push(executor);
  }

  /**
   * Get a command constructor by name
   */
  public getCommandConstructor(
    name: string,
  ): CommandConstructor<BaseCommand> | undefined {
    return this.commandMap.get(name);
  }

  /**
   * Get a builder constructor for a command type
   */
  public getBuilderConstructor(
    commandType: string,
  ): BuilderConstructor<BaseCommand, CommandBuilder<BaseCommand>> | undefined {
    return this.builderMap.get(commandType);
  }

  /**
   * Create a new builder for a command type
   */
  public createBuilder(
    commandType: string,
    ...args: any[]
  ): CommandBuilder<BaseCommand> | undefined {
    const BuilderClass = this.getBuilderConstructor(commandType);
    if (!BuilderClass) {
      return undefined;
    }
    return new BuilderClass(...args);
  }

  /**
   * Find an appropriate executor for a command
   */
  public async findExecutor(
    command: BaseCommand,
  ): Promise<CommandExecutor | undefined> {
    for (const executor of this.executors) {
      if (await executor.canExecute(command)) {
        return executor;
      }
    }
    return undefined;
  }

  /**
   * Get all registered executors
   */
  public getExecutors(): CommandExecutor[] {
    return [...this.executors];
  }
}
