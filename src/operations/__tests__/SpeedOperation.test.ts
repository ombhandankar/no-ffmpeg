import { SpeedOperation } from '../SpeedOperation';
import { FFmpegCommand } from '../../commands/FFmpegCommand';
import { InvalidParameterError } from '../../errors';

describe('SpeedOperation', () => {
  let command: FFmpegCommand;

  beforeEach(() => {
    // Mock the command
    command = {
      addFilter: jest.fn(),
      addArgument: jest.fn(),
      // Mock other command methods if needed
    } as unknown as FFmpegCommand;
  });

  it('should throw InvalidParameterError if factor is zero', () => {
    expect(() => new SpeedOperation(0)).toThrow(InvalidParameterError);
    expect(() => new SpeedOperation(0)).toThrow('Speed factor must be positive');
  });

  it('should throw InvalidParameterError if factor is negative', () => {
    expect(() => new SpeedOperation(-1)).toThrow(InvalidParameterError);
    expect(() => new SpeedOperation(-1)).toThrow('Speed factor must be positive');
  });

  it('should not throw for positive factors', () => {
    expect(() => new SpeedOperation(1)).not.toThrow();
    expect(() => new SpeedOperation(0.5)).not.toThrow();
    expect(() => new SpeedOperation(2)).not.toThrow();
    expect(() => new SpeedOperation(4)).not.toThrow();
  });

  it('should call validate and return true', () => {
     const op = new SpeedOperation(1.5);
     expect(op.validate()).toBe(true);
   });

  it('should apply setpts filter for video', () => {
    const op = new SpeedOperation(1.5);
    op.applyTo(command);
    expect(command.addFilter).toHaveBeenCalledWith('setpts', 'PTS/1.5');
  });

   it('should apply simple atempo filter string for audio (factor 0.5-2.0)', () => {
    const op = new SpeedOperation(1.5);
    op.applyTo(command);
    expect(command.addFilter).toHaveBeenCalledWith('setpts', 'PTS/1.5');
    expect(command.addArgument).toHaveBeenCalledWith('-filter:a', 'atempo=1.5000');
  });

   it('should apply simple atempo filter string for audio (factor 0.75)', () => {
    const op = new SpeedOperation(0.75);
    op.applyTo(command);
    expect(command.addFilter).toHaveBeenCalledWith('setpts', 'PTS/0.75');
    expect(command.addArgument).toHaveBeenCalledWith('-filter:a', 'atempo=0.7500');
  });


  it('should apply chained atempo filter string for audio (factor > 2.0)', () => {
    const op = new SpeedOperation(4);
    op.applyTo(command);
    expect(command.addFilter).toHaveBeenCalledWith('setpts', 'PTS/4');
    expect(command.addArgument).toHaveBeenCalledWith('-filter:a', 'atempo=2.0,atempo=2.0');
  });

  it('should apply chained atempo filter string for audio (factor < 0.5)', () => {
    const op = new SpeedOperation(0.25);
    op.applyTo(command);
    expect(command.addFilter).toHaveBeenCalledWith('setpts', 'PTS/0.25');
    expect(command.addArgument).toHaveBeenCalledWith('-filter:a', 'atempo=0.5,atempo=0.5');
  });

  it('should apply complex chained atempo filter string for audio (factor 3.5)', () => {
    const op = new SpeedOperation(3.5);
    op.applyTo(command);
    expect(command.addFilter).toHaveBeenCalledWith('setpts', 'PTS/3.5');
    expect(command.addArgument).toHaveBeenCalledWith('-filter:a', 'atempo=2.0,atempo=1.7500');
  });

  it('should only apply setpts filter if factor is 1.0', () => {
     const op = new SpeedOperation(1.0);
     op.applyTo(command);
     // Only setpts should be called
     expect(command.addFilter).toHaveBeenCalledWith('setpts', 'PTS/1.0');
     expect(command.addArgument).not.toHaveBeenCalled();
   });
}); 