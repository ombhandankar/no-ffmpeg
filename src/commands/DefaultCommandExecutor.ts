import * as fs from 'fs-extra';
import execa from 'execa';
import { BaseCommand } from './BaseCommand';
import { CommandExecutor } from './CommandExecutor.interface';
import { ExecutionResult } from '../types';
import { fileExists } from '../utils';
import { FFmpegExecutionError } from '../errors';

/**
 * Default implementation of CommandExecutor that can execute any command
 */
export class DefaultCommandExecutor implements CommandExecutor {
  private executorName: string;
  
  constructor(name = 'DefaultCommandExecutor') {
    this.executorName = name;
  }
  
  /**
   * Execute a command and return the result
   */
  public async execute(command: BaseCommand): Promise<ExecutionResult> {
    // Validate command before execution
    if (!command.validate()) {
      throw new Error(`Invalid command configuration for ${command.getProgram()}`);
    }
    
    const program = command.getProgram();
    const args = command.getArgs();
    const commandStr = command.toString();
    
    const startTime = Date.now();
    
    try {
      // Check if program exists
      await this.checkProgramExists(program);
      
      // Execute the command
      const { stdout, stderr } = await execa(program, args);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      return {
        success: true,
        outputPath: this.extractOutputPath(args),
        duration,
        commandExecuted: commandStr,
        stdout,
        stderr
      };
    } catch (error: any) {
      const stderr = error.stderr || 'Unknown error';
      throw new FFmpegExecutionError(commandStr, stderr);
    }
  }
  
  /**
   * Check if the command executor can run a specific command
   */
  public async canExecute(command: BaseCommand): Promise<boolean> {
    try {
      await this.checkProgramExists(command.getProgram());
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Get the name of this executor
   */
  public getName(): string {
    return this.executorName;
  }
  
  /**
   * Check if the command program exists and is executable
   */
  private async checkProgramExists(program: string): Promise<void> {
    try {
      await execa(program, ['--version']);
    } catch (error) {
      throw new Error(`Program not found: ${program}`);
    }
  }
  
  /**
   * Extract the output file path from the command arguments
   */
  private extractOutputPath(args: string[]): string {
    // The output path is typically the last argument
    const outputPath = args[args.length - 1];
    return outputPath;
  }
} 