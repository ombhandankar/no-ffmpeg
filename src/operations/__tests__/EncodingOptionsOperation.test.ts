import { EncodingOptionsOperation } from '../EncodingOptionsOperation';
import { FFmpegCommand } from '../../commands/FFmpegCommand';
import { InvalidParameterError } from '../../errors';

describe('EncodingOptionsOperation', () => {
  let mockCommand: jest.Mocked<FFmpegCommand>;

  beforeEach(() => {
    mockCommand = {
      addArgument: jest.fn().mockReturnThis(),
    } as unknown as jest.Mocked<FFmpegCommand>;
  });

  describe('constructor', () => {
    it('should throw if no options are provided', () => {
      expect(() => {
        new EncodingOptionsOperation({});
      }).toThrow(InvalidParameterError);
    });

    it('should throw if CRF is out of range', () => {
      expect(() => {
        new EncodingOptionsOperation({ crf: -1 });
      }).toThrow(InvalidParameterError);

      expect(() => {
        new EncodingOptionsOperation({ crf: 52 });
      }).toThrow(InvalidParameterError);
    });

    it('should throw if preset is invalid', () => {
      expect(() => {
        new EncodingOptionsOperation({ preset: 'invalid-preset' });
      }).toThrow(InvalidParameterError);
    });

    it('should create instance with valid options', () => {
      const operation = new EncodingOptionsOperation({
        codec: 'libx264',
        crf: 23,
        preset: 'medium',
        videoBitrate: '2M',
      });
      expect(operation).toBeInstanceOf(EncodingOptionsOperation);
      expect(operation.validate()).toBe(true);
    });
  });

  describe('applyTo', () => {
    it('should add codec argument when provided', () => {
      const operation = new EncodingOptionsOperation({ codec: 'libx264' });
      operation.applyTo(mockCommand);
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-c:v', 'libx264');
    });

    it('should add video bitrate argument when provided', () => {
      const operation = new EncodingOptionsOperation({ videoBitrate: '2M' });
      operation.applyTo(mockCommand);
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-b:v', '2M');
    });

    it('should add CRF argument when provided', () => {
      const operation = new EncodingOptionsOperation({ crf: 23 });
      operation.applyTo(mockCommand);
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-crf', '23');
    });

    it('should add preset argument when provided', () => {
      const operation = new EncodingOptionsOperation({ preset: 'medium' });
      operation.applyTo(mockCommand);
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-preset', 'medium');
    });

    it('should add all arguments when all options are provided', () => {
      const operation = new EncodingOptionsOperation({
        codec: 'libx264',
        crf: 23,
        preset: 'medium',
        videoBitrate: '2M',
      });
      operation.applyTo(mockCommand);
      
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-c:v', 'libx264');
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-b:v', '2M');
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-crf', '23');
      expect(mockCommand.addArgument).toHaveBeenCalledWith('-preset', 'medium');
    });
  });
}); 