import { CommandRegistry } from '../CommandRegistry';
import { BaseCommand } from '../BaseCommand';
import { CommandBuilder } from '../CommandBuilder.interface';
import { CommandExecutor } from '../CommandExecutor.interface';
import { ExecutionResult } from '../../types';

// Mock implementations for testing
class MockCommand extends BaseCommand {
  constructor() {
    super('mock');
  }
  
  validate(): boolean {
    return true;
  }
}

class MockBuilder implements CommandBuilder<MockCommand> {
  withInput(input: string): this {
    return this;
  }
  
  withOutput(output: string): this {
    return this;
  }
  
  build(): MockCommand {
    return new MockCommand();
  }
  
  validate(): boolean {
    return true;
  }
  
  toString(): string {
    return 'mock command';
  }
}

class MockExecutor implements CommandExecutor {
  async execute(command: BaseCommand): Promise<ExecutionResult> {
    return {
      success: true,
      outputPath: 'mock-output.mp4',
      duration: 100,
      commandExecuted: command.toString(),
      stdout: 'mock stdout',
      stderr: 'mock stderr'
    };
  }
  
  async canExecute(command: BaseCommand): Promise<boolean> {
    return command.getProgram() === 'mock';
  }
  
  getName(): string {
    return 'MockExecutor';
  }
}

describe('CommandRegistry', () => {
  let registry: CommandRegistry;
  
  beforeEach(() => {
    // Reset singleton for testing
    (CommandRegistry as any).instance = undefined;
    registry = CommandRegistry.getInstance();
  });
  
  it('should register and retrieve command constructors', () => {
    registry.registerCommand('mock', MockCommand);
    const commandConstructor = registry.getCommandConstructor('mock');
    expect(commandConstructor).toBe(MockCommand);
  });
  
  it('should register and retrieve builder constructors', () => {
    registry.registerBuilder('mock', MockBuilder);
    const builderConstructor = registry.getBuilderConstructor('mock');
    expect(builderConstructor).toBe(MockBuilder);
  });
  
  it('should create builder instances', () => {
    registry.registerBuilder('mock', MockBuilder);
    const builder = registry.createBuilder('mock');
    expect(builder).toBeInstanceOf(MockBuilder);
  });
  
  it('should register and retrieve executors', () => {
    const executor = new MockExecutor();
    registry.registerExecutor(executor);
    const executors = registry.getExecutors();
    expect(executors).toContain(executor);
  });
  
  it('should find appropriate executor for a command', async () => {
    const executor = new MockExecutor();
    registry.registerExecutor(executor);
    const command = new MockCommand();
    const foundExecutor = await registry.findExecutor(command);
    expect(foundExecutor).toBe(executor);
  });
  
  it('should return undefined when no suitable executor is found', async () => {
    class UnknownCommand extends BaseCommand {
      constructor() {
        super('unknown');
      }
      
      validate(): boolean {
        return true;
      }
    }
    
    const command = new UnknownCommand();
    const foundExecutor = await registry.findExecutor(command);
    expect(foundExecutor).toBeUndefined();
  });
}); 