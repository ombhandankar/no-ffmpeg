import { FFmpegCommandBuilder } from "../../commands/FFmpegCommandBuilder";
import { OverlayOperation } from "../OverlayOperation";
import { TextOperation } from "../TextOperation";
import { Position } from "../../types";
import * as fs from "fs";

// Mock fs.existsSync
jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

describe("Combined Operations", () => {
  let builder: FFmpegCommandBuilder;
  
  beforeEach(() => {
    builder = new FFmpegCommandBuilder();
    builder.withInput("input.mp4");
    
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
}); 