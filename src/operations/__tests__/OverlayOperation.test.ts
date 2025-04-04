import { OverlayOperation } from "../OverlayOperation";
import { FFmpegCommandBuilder } from "../../commands/FFmpegCommandBuilder";
import { Position } from "../../types";
import * as fs from "fs-extra";

// Mock fs.existsSync
jest.mock("fs-extra", () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

describe("OverlayOperation", () => {
  let builder: FFmpegCommandBuilder;
  
  beforeEach(() => {
    builder = new FFmpegCommandBuilder();
    builder.withInput("input.mp4");
    
    // Mock the addInput method
    builder.addInput = jest.fn().mockReturnValue(builder);
    
    // Mock the addComplexFilter method
    builder.addComplexFilter = jest.fn().mockReturnValue(builder);
    
    // Reset the fs.existsSync mock
    (fs.existsSync as jest.Mock).mockReturnValue(true);
  });
  
  it("should validate correctly with valid options", () => {
    const operation = new OverlayOperation({
      source: "logo.png",
      position: Position.BOTTOM_RIGHT,
      opacity: 0.7,
    });
    
    expect(operation.validate()).toBe(true);
  });
  
  it("should fail validation when source file doesn't exist", () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    const operation = new OverlayOperation({
      source: "missing.png",
    });
    
    expect(operation.validate()).toBe(false);
  });
  
  it("should fail validation with invalid opacity", () => {
    const operation = new OverlayOperation({
      source: "logo.png",
      opacity: 1.5, // Invalid: greater than 1
    });
    
    expect(operation.validate()).toBe(false);
  });
  
  it("should fail validation with invalid scale", () => {
    const operation = new OverlayOperation({
      source: "logo.png",
      scale: -0.5, // Invalid: negative scale
    });
    
    expect(operation.validate()).toBe(false);
  });
  
  it("should fail validation when both position and x/y are set", () => {
    const operation = new OverlayOperation({
      source: "logo.png",
      position: Position.CENTER,
      x: 10, // Conflicts with position
      y: 20,
    });
    
    expect(operation.validate()).toBe(false);
  });
  
  it("should apply to the builder correctly", () => {
    const operation = new OverlayOperation({
      source: "logo.png",
      position: Position.BOTTOM_RIGHT,
      padding: 20,
      opacity: 0.7,
    });
    
    operation.applyTo(builder);
    
    // Check if the source was added as input
    expect(builder.addInput).toHaveBeenCalledWith("logo.png");
    
    // Check if a complex filter was added
    expect(builder.addComplexFilter).toHaveBeenCalled();
  });
  
  it("should generate a filter with absolute positioning", () => {
    const operation = new OverlayOperation({
      source: "logo.png",
      x: 50,
      y: 100,
    });
    
    operation.applyTo(builder);
    
    const filterCall = (builder.addComplexFilter as jest.Mock).mock.calls[0][0];
    
    // Check if the filter contains the correct x/y coordinates
    expect(filterCall).toContain("overlay=50:100");
  });
  
  it("should generate a filter with relative positioning", () => {
    const operation = new OverlayOperation({
      source: "logo.png",
      position: Position.CENTER,
    });
    
    operation.applyTo(builder);
    
    const filterCall = (builder.addComplexFilter as jest.Mock).mock.calls[0][0];
    
    // Check if the filter contains the center position formula
    expect(filterCall).toContain("(main_w-overlay_w)/2:(main_h-overlay_h)/2");
  });
  
  it("should include opacity when specified", () => {
    const operation = new OverlayOperation({
      source: "logo.png",
      opacity: 0.5,
    });
    
    operation.applyTo(builder);
    
    const filterCall = (builder.addComplexFilter as jest.Mock).mock.calls[0][0];
    
    // Check if the filter includes opacity adjustment
    expect(filterCall).toContain("colorchannelmixer=a=0.5");
  });
  
  it("should include timing parameters when specified", () => {
    const operation = new OverlayOperation({
      source: "logo.png",
      start: 5,
      end: 15,
    });
    
    operation.applyTo(builder);
    
    const filterCall = (builder.addComplexFilter as jest.Mock).mock.calls[0][0];
    
    // Check if the filter includes the enable expression with timing
    expect(filterCall).toContain("enable='between(t,00:00:05.000,00:00:15.000)'");
  });
}); 