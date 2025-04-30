import { FFmpegCommandBuilder } from "../../commands/FFmpegCommandBuilder";
import { OverlayOperation } from "../OverlayOperation";
import { TextOperation } from "../TextOperation";
import { Position } from "../../types";
import { SpeedOperation } from '../SpeedOperation';
import { AdjustColorOperation } from '../AdjustColorOperation';
import { FFmpegCommand } from "../../commands/FFmpegCommand";
import { Processor } from '../../core/Processor';

// Mock dependencies before importing them
jest.mock('fs-extra', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  ensureDirSync: jest.fn(),
  writeFileSync: jest.fn(),
  removeSync: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

jest.mock('execa', () => jest.fn().mockResolvedValue({
  stdout: 'success',
  stderr: '',
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn(path => `/resolved/${path}`),
}));

// Mock the fileExists utility function
jest.mock('../../utils', () => ({
  ...jest.requireActual('../../utils'),
  fileExists: jest.fn().mockResolvedValue(true),
  defaultLogger: jest.fn(),
  generateTempFilePath: jest.fn().mockReturnValue('temp/file.mp4'),
  getFileExtension: jest.fn().mockReturnValue('mp4'),
}));

// Import after mocking
import * as fs from 'fs';
import * as fsExtra from 'fs-extra';
import * as path from 'path';
import execa from 'execa';
import * as utils from '../../utils';

describe("Combined Operations", () => {
  let builder: FFmpegCommandBuilder;
  let command: FFmpegCommand; // For our new operations that use FFmpegCommand
  
  beforeEach(() => {
    builder = new FFmpegCommandBuilder();
    builder.withInput("input.mp4");
    
    // Mock the FFmpegCommand for our operations
    command = {
      addFilter: jest.fn(),
      addArgument: jest.fn(),
      // Add other methods needed
    } as unknown as FFmpegCommand;
    
    // Reset mocks
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });
  
  it("should correctly build a command with overlay and text", () => {
    // Add an overlay
    const overlayOp = new OverlayOperation({
      source: "logo.png",
      position: Position.BOTTOM_RIGHT,
      opacity: 0.7,
    });
    
    // Add text
    const textOp = new TextOperation({
      text: "Sample Video",
      position: Position.TOP,
      fontColor: "white",
      backgroundColor: "black@0.5",
    });
    
    // Apply both operations
    overlayOp.applyTo(builder);
    textOp.applyTo(builder);
    
    // Set output
    builder.withOutput("output.mp4");
    
    // Build the command
    const command = builder.build();
    
    // Check that both filter components are included
    const commandStr = command.toString();
    
    // Verify that the command includes both operations
    expect(commandStr).toContain("-filter_complex");
    expect(commandStr).toContain("overlay");
    expect(commandStr).toContain("drawtext");
  });
  
  it("should correctly build a command with resize, overlay, and text", () => {
    // Add resize
    builder.addResizeOperation({
      width: 1280,
      height: 720,
    });
    
    // Add overlay
    const overlayOp = new OverlayOperation({
      source: "logo.png",
      position: Position.BOTTOM_RIGHT,
    });
    
    // Add text
    const textOp = new TextOperation({
      text: "Sample Video",
      position: Position.TOP,
    });
    
    // Apply operations
    overlayOp.applyTo(builder);
    textOp.applyTo(builder);
    
    // Set output
    builder.withOutput("output.mp4");
    
    // Build the command
    const command = builder.build();
    
    // Check the command
    const commandStr = command.toString();
    
    // Verify that the command includes all operations
    expect(commandStr).toContain("-filter_complex");
    expect(commandStr).toContain("scale=1280:720");
    expect(commandStr).toContain("overlay");
    expect(commandStr).toContain("drawtext");
  });
  
  it("should handle operations with timing parameters", () => {
    // Add overlay with timing
    const overlayOp = new OverlayOperation({
      source: "logo.png",
      position: Position.BOTTOM_RIGHT,
      start: 5,
      end: 15,
    });
    
    // Add text with different timing
    const textOp = new TextOperation({
      text: "Introduction",
      position: Position.TOP,
      start: 0,
      end: 10,
    });
    
    // Apply operations
    overlayOp.applyTo(builder);
    textOp.applyTo(builder);
    
    // Set output
    builder.withOutput("output.mp4");
    
    // Build the command
    const command = builder.build();
    
    // Check the command
    const commandStr = command.toString();
    
    // Verify that the command includes timing parameters
    expect(commandStr).toContain("between(t,5,15)");
    expect(commandStr).toContain("between(t,0,10)");
  });

  it('should apply both speed and color adjustments in sequence', () => {
    // Create operations
    const speedOp = new SpeedOperation(1.5);
    const colorOp = new AdjustColorOperation({ 
      brightness: 0.1,
      contrast: 1.2 
    });

    // Apply operations to our mock command
    speedOp.applyTo(command);
    colorOp.applyTo(command);

    // Verify command methods were called appropriately
    expect(command.addFilter).toHaveBeenCalledWith('setpts', 'PTS/1.5');
    expect(command.addArgument).toHaveBeenCalledWith('-filter:a', 'atempo=1.5000');
    expect(command.addFilter).toHaveBeenCalledWith('eq', 'brightness=0.1:contrast=1.2');
  });

  it('should apply operations in reverse order correctly', () => {
    // Create operations in the opposite order
    const colorOp = new AdjustColorOperation({ saturation: 1.5 });
    const speedOp = new SpeedOperation(0.75);

    // Apply operations
    colorOp.applyTo(command);
    speedOp.applyTo(command);

    // Verify the color filter was added first
    expect(command.addFilter).toHaveBeenNthCalledWith(1, 'eq', 'saturation=1.5');
    
    // Verify the video speed filter was added second
    expect(command.addFilter).toHaveBeenNthCalledWith(2, 'setpts', 'PTS/0.75');
    
    // Verify the audio speed filter was added
    expect(command.addArgument).toHaveBeenCalledWith('-filter:a', 'atempo=0.7500');
  });

  it('should work with extreme speed factor requiring chained atempo filters', () => {
    const speedOp = new SpeedOperation(4.0);
    const colorOp = new AdjustColorOperation({ 
      brightness: -0.1,
      saturation: 0.8 
    });

    // Apply operations
    speedOp.applyTo(command);
    colorOp.applyTo(command);

    // Verify the video speed filter was added
    expect(command.addFilter).toHaveBeenCalledWith('setpts', 'PTS/4');
    
    // Verify the chained audio speed filters were added
    expect(command.addArgument).toHaveBeenCalledWith('-filter:a', 'atempo=2.0,atempo=2.0');
    
    // Verify the color adjustment filter was added
    expect(command.addFilter).toHaveBeenCalledWith('eq', 'brightness=-0.1:saturation=0.8');
  });

  it('should handle speed factor of 1.0 correctly with color adjustments', () => {
    const speedOp = new SpeedOperation(1.0);
    const colorOp = new AdjustColorOperation({ contrast: 1.3 });

    // Apply operations
    speedOp.applyTo(command);
    colorOp.applyTo(command);

    // Verify the video speed filter was added
    expect(command.addFilter).toHaveBeenCalledWith('setpts', 'PTS/1.0');
    
    // Verify the color adjustment filter was added
    expect(command.addFilter).toHaveBeenCalledWith('eq', 'contrast=1.3');
    
    // No audio filter should be added for speed 1.0
    expect(command.addArgument).not.toHaveBeenCalled();
  });
});

describe('Combined Operations Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock file system
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fsExtra.ensureDirSync as jest.Mock).mockImplementation(() => {});
    
    // Mock fileExists utility
    (utils.fileExists as jest.Mock).mockResolvedValue(true);
    
    // Silence the default logger
    (utils.defaultLogger as jest.Mock).mockImplementation(() => {});
    
    // Mock execa to capture the command
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'success',
      stderr: '',
    });
    
    // Mock path.join to just concatenate with /
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
  });
  
  describe('Concat with Encoding Options', () => {
    it('should correctly combine concat and encoding operations', async () => {
      // Create a processor first and then use concat method instead of static method
      const processor = new Processor();
      processor.input('file1.mp4'); // Set an initial input
      
      // Now use concat
      processor.concat({
        inputs: ['file1.mp4', 'file2.mp4'],
        strategy: 'filter'
      }).encoding({
        codec: 'libx264',
        crf: 23,
        preset: 'medium'
      }).output('output.mp4');
      
      // Execute
      await processor.execute();
      
      // Check the command that was executed
      expect(execa).toHaveBeenCalled();
      
      // Get the args from the mock
      const mockExecaCall = (execa as unknown as jest.Mock).mock.calls[0];
      const ffmpegPath = mockExecaCall[0];
      const args = mockExecaCall[1];
      
      // Check ffmpeg path
      expect(ffmpegPath).toBe('ffmpeg');
      
      // Check input args
      expect(args).toContain('-i');
      expect(args).toContain('file1.mp4');
      expect(args).toContain('file2.mp4');
      
      // Check filter complex for concat
      expect(args).toContain('-filter_complex');
      const filterComplexIndex = args.indexOf('-filter_complex');
      expect(args[filterComplexIndex + 1]).toContain('concat=n=2:v=1:a=1');
      
      // Check encoding options
      expect(args).toContain('-c:v');
      expect(args).toContain('libx264');
      expect(args).toContain('-crf');
      expect(args).toContain('23');
      expect(args).toContain('-preset');
      expect(args).toContain('medium');
      
      // Check output
      expect(args).toContain('output.mp4');
    });
  });
  
  describe('Resize with Encoding Options', () => {
    it('should correctly combine resize and encoding operations', async () => {
      // Setup processor
      const processor = Processor.fromFile('input.mp4')
        .resize({ width: 1280, height: 720, maintainAspectRatio: false })
        .encoding({
          codec: 'libx264',
          crf: 23,
          preset: 'medium'
        })
        .output('output.mp4');
      
      // Execute
      await processor.execute();
      
      // Check the command that was executed
      expect(execa).toHaveBeenCalled();
      
      // Get the args from the mock
      const mockExecaCall = (execa as unknown as jest.Mock).mock.calls[0];
      const args = mockExecaCall[1];
      
      // Check input args
      expect(args).toContain('-i');
      expect(args).toContain('input.mp4');
      
      // Check resize filter
      const filterIndex = args.indexOf('-vf');
      expect(filterIndex).not.toBe(-1);
      expect(args[filterIndex + 1]).toContain('scale=1280:720');
      
      // Check encoding options
      expect(args).toContain('-c:v');
      expect(args).toContain('libx264');
      expect(args).toContain('-crf');
      expect(args).toContain('23');
      expect(args).toContain('-preset');
      expect(args).toContain('medium');
      
      // Check output
      expect(args).toContain('output.mp4');
    });
  });
});

describe('Static Concat Method', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock file system
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fsExtra.ensureDirSync as jest.Mock).mockImplementation(() => {});
    
    // Mock fileExists utility
    (utils.fileExists as jest.Mock).mockResolvedValue(true);
    
    // Silence the default logger
    (utils.defaultLogger as jest.Mock).mockImplementation(() => {});
    
    // Mock execa to capture the command
    (execa as unknown as jest.Mock).mockResolvedValue({
      stdout: 'success',
      stderr: '',
    });
  });
  
  it('should initialize properly when called directly without input()', async () => {
    // Create processor and use concat directly without calling input first
    const processor = new Processor();
    
    // Call concat without input
    processor
      .concat({
        inputs: ['file1.mp4', 'file2.mp4'],
        strategy: 'filter'
      })
      .output('output-combined.mp4');
    
    // Execute
    await processor.execute();
    
    // Check the command that was executed
    expect(execa).toHaveBeenCalled();
    
    // Get the args from the mock
    const mockExecaCall = (execa as unknown as jest.Mock).mock.calls[0];
    const args = mockExecaCall[1];
    
    // Check filter complex for concat
    expect(args).toContain('-filter_complex');
    expect(args).toContain('-i');
    expect(args).toContain('file1.mp4');
    expect(args).toContain('file2.mp4');
  });
  
  it('should allow static concat method to work directly', async () => {
    // Use the static concat method
    await Processor.concat({
      inputs: ['file1.mp4', 'file2.mp4'],
      strategy: 'filter'
    })
    .output('output-combined.mp4')
    .execute();
    
    // Check the command that was executed
    expect(execa).toHaveBeenCalled();
    
    // Get the args from the mock
    const mockExecaCall = (execa as unknown as jest.Mock).mock.calls[0];
    const args = mockExecaCall[1];
    
    // Check filter complex for concat
    expect(args).toContain('-filter_complex');
    expect(args).toContain('-i');
    expect(args).toContain('file1.mp4');
    expect(args).toContain('file2.mp4');
  });
}); 