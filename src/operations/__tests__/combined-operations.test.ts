import { FFmpegCommandBuilder } from "../../commands/FFmpegCommandBuilder";
import { OverlayOperation } from "../OverlayOperation";
import { TextOperation } from "../TextOperation";
import { Position } from "../../types";
import * as fs from "fs";
import { SpeedOperation } from '../SpeedOperation';
import { AdjustColorOperation } from '../AdjustColorOperation';
import { FFmpegCommand } from "../../commands/FFmpegCommand";

// Mock fs.existsSync
jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

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