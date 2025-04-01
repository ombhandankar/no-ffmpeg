import { Processor } from '../../src/core/Processor';
import { CommandBuilder } from '../../src/commands/CommandBuilder';

// Mock the dependencies
jest.mock('execa');
jest.mock('fs-extra', () => ({
  access: jest.fn().mockResolvedValue(true),
  ensureDirSync: jest.fn(),
}));

describe('Processor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize properly', () => {
    const processor = new Processor();
    expect(processor).toBeInstanceOf(Processor);
  });

  it('should set input and return itself for chaining', () => {
    const processor = new Processor();
    const result = processor.input('test.mp4');
    
    expect(result).toBe(processor);
  });

  it('should create a processor from a static method', () => {
    const processor = Processor.fromFile('test.mp4');
    
    expect(processor).toBeInstanceOf(Processor);
  });

  it('should build a trim operation correctly', () => {
    const processor = new Processor();
    processor.input('test.mp4');
    
    // Mock the command builder
    const mockAddTrimOperation = jest.fn().mockReturnThis();
    (processor as any).builder = {
      addTrimOperation: mockAddTrimOperation,
      setOutput: jest.fn().mockReturnThis(),
    };
    
    processor.trim({ start: 10, end: 20 });
    
    expect(mockAddTrimOperation).toHaveBeenCalledWith({ start: 10, end: 20 });
  });

  it('should chain multiple operations', () => {
    const processor = new Processor();
    processor.input('test.mp4');
    
    // Mock the command builder
    const mockFunctions = {
      addTrimOperation: jest.fn().mockReturnThis(),
      addResizeOperation: jest.fn().mockReturnThis(),
      addCropOperation: jest.fn().mockReturnThis(),
      setOutput: jest.fn().mockReturnThis(),
    };
    
    (processor as any).builder = mockFunctions;
    
    processor
      .trim({ start: 10, end: 20 })
      .resize({ width: 640, height: 480 })
      .crop(300, 300, 10, 10)
      .output('output.mp4');
    
    expect(mockFunctions.addTrimOperation).toHaveBeenCalledWith({ start: 10, end: 20 });
    expect(mockFunctions.addResizeOperation).toHaveBeenCalledWith({ width: 640, height: 480 });
    expect(mockFunctions.addCropOperation).toHaveBeenCalledWith(300, 300, 10, 10);
    expect(mockFunctions.setOutput).toHaveBeenCalledWith('output.mp4', undefined);
  });
});