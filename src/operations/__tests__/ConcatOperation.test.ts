import * as fs from 'fs-extra';
import * as path from 'path';
import { ConcatOperation } from '../ConcatOperation';
import { FFmpegCommand } from '../../commands/FFmpegCommand';
import { InvalidParameterError, InputFileError } from '../../errors';

jest.mock('fs-extra');
jest.mock('path');

describe('ConcatOperation', () => {
  let mockCommand: jest.Mocked<FFmpegCommand>;
  let mockFiles: string[];
  
  beforeEach(() => {
    // Clear mocks
    jest.clearAllMocks();
    
    // Mock file system operations
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.resolve as jest.Mock).mockImplementation((filePath) => `/resolved/${filePath}`);
    
    // Mock FFmpeg command
    mockCommand = {
      setInput: jest.fn().mockReturnThis(),
      addArgument: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<FFmpegCommand>;
    
    // Sample input files
    mockFiles = ['file1.mp4', 'file2.mp4', 'file3.mp4'];
  });
  
  describe('constructor', () => {
    it('should throw if no inputs are provided', () => {
      expect(() => {
        new ConcatOperation({ inputs: [] });
      }).toThrow(InvalidParameterError);
    });
    
    it('should throw if inputs is not an array', () => {
      expect(() => {
        // @ts-ignore - Testing invalid type
        new ConcatOperation({ inputs: 'not-an-array' });
      }).toThrow(InvalidParameterError);
    });
    
    it('should throw if any input file does not exist', () => {
      (fs.existsSync as jest.Mock).mockImplementation((file) => file !== 'file2.mp4');
      
      expect(() => {
        new ConcatOperation({ inputs: mockFiles });
      }).toThrow(InputFileError);
      
      expect(fs.existsSync).toHaveBeenCalledWith('file2.mp4');
    });
    
    it('should throw if strategy is invalid', () => {
      expect(() => {
        // @ts-ignore - Testing invalid value
        new ConcatOperation({ inputs: mockFiles, strategy: 'invalid-strategy' });
      }).toThrow(InvalidParameterError);
    });
    
    it('should create instance with filter strategy by default', () => {
      const operation = new ConcatOperation({ inputs: mockFiles });
      expect(operation).toBeInstanceOf(ConcatOperation);
      expect(operation.validate()).toBe(true);
    });
    
    it('should create instance with specified strategy', () => {
      const operation = new ConcatOperation({ inputs: mockFiles, strategy: 'demuxer' });
      expect(operation).toBeInstanceOf(ConcatOperation);
      expect(operation.validate()).toBe(true);
    });
  });
  
  describe('applyTo with filter strategy', () => {
    it('should add inputs and filter complex for filter strategy', () => {
      const operation = new ConcatOperation({ 
        inputs: mockFiles, 
        strategy: 'filter' 
      });
      
      operation.applyTo(mockCommand);
      
      // Should set the first input
      expect(mockCommand.setInput).toHaveBeenCalledWith('file1.mp4');
      
      // Should add the other inputs with -i flag
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-i', 'file2.mp4');
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-i', 'file3.mp4');
      
      // Should add filter complex
      expect(mockCommand.addArgument).toHaveBeenCalledWith(
        '-filter_complex',
        expect.stringContaining('concat=n=3:v=1:a=1[outv][outa]')
      );
      
      // Should map output streams
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-map', '[outv]');
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-map', '[outa]');
    });

    it('should handle video-only concatenation when specified', () => {
      const operation = new ConcatOperation({ 
        inputs: mockFiles, 
        strategy: 'filter',
        videoOnly: true
      });
      
      operation.applyTo(mockCommand);
      
      // Should set the first input
      expect(mockCommand.setInput).toHaveBeenCalledWith('file1.mp4');
      
      // Should add the other inputs with -i flag
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-i', 'file2.mp4');
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-i', 'file3.mp4');
      
      // Should add filter complex for video-only
      expect(mockCommand.addArgument).toHaveBeenCalledWith(
        '-filter_complex',
        expect.stringContaining('concat=n=3:v=1[outv]')
      );
      
      // Should map only video output stream
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-map', '[outv]');
      
      // Should disable audio
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-an', '');
    });
  });
  
  describe('applyTo with demuxer strategy', () => {
    it('should create concat file and use demuxer strategy', () => {
      const operation = new ConcatOperation({ 
        inputs: mockFiles, 
        strategy: 'demuxer' 
      });
      
      operation.applyTo(mockCommand);
      
      // Should create a temp file with the file list
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining("file '/resolved/file1.mp4'")
      );
      
      // Should set up concat demuxer
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-f', 'concat');
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-safe', '0');
      expect(mockCommand.setInput).toHaveBeenCalledWith(expect.any(String));
      
      // Should use copy codec
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-c', 'copy');
    });
  });
  
  describe('cleanup', () => {
    it('should remove the temporary file if it exists', () => {
      const operation = new ConcatOperation({ 
        inputs: mockFiles, 
        strategy: 'demuxer' 
      });
      
      // Apply operation to create temp file
      operation.applyTo(mockCommand);
      
      // Call cleanup
      operation.cleanup();
      
      // Should attempt to remove the temp file
      expect(fs.removeSync).toHaveBeenCalled();
    });
  });
}); 