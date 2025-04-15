import { AdjustColorOperation } from '../AdjustColorOperation';
import { FFmpegCommand } from '../../commands/FFmpegCommand';
import { InvalidParameterError } from '../../errors';
import { AdjustColorOptions } from '../../types';

describe('AdjustColorOperation', () => {
  let command: FFmpegCommand;

  beforeEach(() => {
    command = {
      addFilter: jest.fn(),
      addArgument: jest.fn(),
    } as unknown as FFmpegCommand;
  });

  it('should throw InvalidParameterError for out-of-range brightness', () => {
    expect(() => new AdjustColorOperation({ brightness: 2 })).toThrow(InvalidParameterError);
    expect(() => new AdjustColorOperation({ brightness: -1.1 })).toThrow(InvalidParameterError);
  });

  it('should throw InvalidParameterError for out-of-range contrast', () => {
    expect(() => new AdjustColorOperation({ contrast: -2.1 })).toThrow(InvalidParameterError);
    expect(() => new AdjustColorOperation({ contrast: 2.1 })).toThrow(InvalidParameterError);
  });

  it('should throw InvalidParameterError for out-of-range saturation', () => {
    expect(() => new AdjustColorOperation({ saturation: -0.1 })).toThrow(InvalidParameterError);
    expect(() => new AdjustColorOperation({ saturation: 3.1 })).toThrow(InvalidParameterError);
  });

  it('should throw InvalidParameterError if no options are provided', () => {
    expect(() => new AdjustColorOperation({})).toThrow(InvalidParameterError);
    expect(() => new AdjustColorOperation({})).toThrow('AdjustColorOperation requires at least one option');
  });

  it('should not throw for valid options', () => {
    expect(() => new AdjustColorOperation({ brightness: 0.1 })).not.toThrow();
    expect(() => new AdjustColorOperation({ contrast: 1.5 })).not.toThrow();
    expect(() => new AdjustColorOperation({ saturation: 2.0 })).not.toThrow();
    expect(() => new AdjustColorOperation({ brightness: -0.5, contrast: 0.8, saturation: 1.2 })).not.toThrow();
  });

  it('should call validate and return true', () => {
     const op = new AdjustColorOperation({ brightness: 0.1 });
     expect(op.validate()).toBe(true);
   });

  it('should apply eq filter with brightness only', () => {
    const op = new AdjustColorOperation({ brightness: 0.2 });
    op.applyTo(command);
    expect(command.addFilter).toHaveBeenCalledTimes(1);
    expect(command.addFilter).toHaveBeenCalledWith('eq', 'brightness=0.2');
  });

  it('should apply eq filter with contrast only', () => {
    const op = new AdjustColorOperation({ contrast: 1.5 });
    op.applyTo(command);
    expect(command.addFilter).toHaveBeenCalledTimes(1);
    expect(command.addFilter).toHaveBeenCalledWith('eq', 'contrast=1.5');
  });

  it('should apply eq filter with saturation only', () => {
    const op = new AdjustColorOperation({ saturation: 0.8 });
    op.applyTo(command);
    expect(command.addFilter).toHaveBeenCalledTimes(1);
    expect(command.addFilter).toHaveBeenCalledWith('eq', 'saturation=0.8');
  });

  it('should apply eq filter with multiple options', () => {
    const options: AdjustColorOptions = { brightness: -0.1, saturation: 1.2 };
    const op = new AdjustColorOperation(options);
    op.applyTo(command);
    expect(command.addFilter).toHaveBeenCalledTimes(1);
    expect(command.addFilter).toHaveBeenCalledWith('eq', 'brightness=-0.1:saturation=1.2');
  });

   it('should apply eq filter with all options', () => {
    const options: AdjustColorOptions = { brightness: 0.1, contrast: 1.1, saturation: 1.3 };
    const op = new AdjustColorOperation(options);
    op.applyTo(command);
    expect(command.addFilter).toHaveBeenCalledTimes(1);
    expect(command.addFilter).toHaveBeenCalledWith('eq', 'brightness=0.1:contrast=1.1:saturation=1.3');
  });

  it('should not apply filter if constructor validation is bypassed (theoretical test)', () => {
     // This state should not be reachable due to constructor validation
     const op = new AdjustColorOperation({ brightness: 0.1 }); // Valid construction
     (op as any).options = {}; // Force invalid state post-construction for test
     op.applyTo(command);
     expect(command.addFilter).not.toHaveBeenCalled();
   });
}); 