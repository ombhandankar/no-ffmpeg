import { TextOperation } from "../TextOperation";
import { FFmpegCommandBuilder } from "../../commands/FFmpegCommandBuilder";
import { Position } from "../../types";

describe("TextOperation", () => {
  let builder: FFmpegCommandBuilder;
  
  beforeEach(() => {
    builder = new FFmpegCommandBuilder();
    builder.withInput("input.mp4");
    
    // Mock the addComplexFilter method
    builder.addComplexFilter = jest.fn().mockReturnValue(builder);
  });
  
  it("should validate correctly with valid options", () => {
    const operation = new TextOperation({
      text: "Sample Text",
      position: Position.TOP,
      fontSize: 24,
      fontColor: "white",
    });
    
    expect(operation.validate()).toBe(true);
  });
  
  it("should fail validation with empty text", () => {
    const operation = new TextOperation({
      text: "",
      position: Position.TOP,
    });
    
    expect(operation.validate()).toBe(false);
  });
  
  it("should fail validation with invalid font size", () => {
    const operation = new TextOperation({
      text: "Sample Text",
      fontSize: -5, // Invalid: negative font size
    });
    
    expect(operation.validate()).toBe(false);
  });
  
  it("should fail validation when both position and x/y are set", () => {
    const operation = new TextOperation({
      text: "Sample Text",
      position: Position.CENTER,
      x: 10, // Conflicts with position
      y: 20,
    });
    
    expect(operation.validate()).toBe(false);
  });
  
  it("should apply to the builder correctly", () => {
    const operation = new TextOperation({
      text: "Sample Text",
      position: Position.TOP,
      fontSize: 24,
      fontColor: "white",
    });
    
    operation.applyTo(builder);
    
    // Check if a complex filter was added
    expect(builder.addComplexFilter).toHaveBeenCalled();
  });
  
  it("should generate a filter with the text content", () => {
    const operation = new TextOperation({
      text: "Sample Text",
    });
    
    operation.applyTo(builder);
    
    const filterCall = (builder.addComplexFilter as jest.Mock).mock.calls[0][0];
    
    // Check if the filter contains the text
    expect(filterCall).toContain("text='Sample Text'");
  });
  
  it("should escape special characters in text", () => {
    const operation = new TextOperation({
      text: "Sample: Text's with \\ backslash",
    });
    
    operation.applyTo(builder);
    
    const filterCall = (builder.addComplexFilter as jest.Mock).mock.calls[0][0];
    
    // Check if the special characters are escaped
    expect(filterCall).toContain("text='Sample\\\\: Text\\\\'s with \\\\ backslash'");
  });
  
  it("should generate a filter with absolute positioning", () => {
    const operation = new TextOperation({
      text: "Sample Text",
      x: 50,
      y: 100,
    });
    
    operation.applyTo(builder);
    
    const filterCall = (builder.addComplexFilter as jest.Mock).mock.calls[0][0];
    
    // Check if the filter contains the correct x/y coordinates
    expect(filterCall).toContain("x=50:y=100");
  });
  
  it("should generate a filter with relative positioning", () => {
    const operation = new TextOperation({
      text: "Sample Text",
      position: Position.CENTER,
    });
    
    operation.applyTo(builder);
    
    const filterCall = (builder.addComplexFilter as jest.Mock).mock.calls[0][0];
    
    // Check if the filter contains the center position formula
    expect(filterCall).toContain("x=(w-text_w)/2:y=(h-text_h)/2");
  });
  
  it("should include font properties when specified", () => {
    const operation = new TextOperation({
      text: "Sample Text",
      fontFile: "Arial.ttf",
      fontSize: 32,
      fontColor: "yellow",
    });
    
    operation.applyTo(builder);
    
    const filterCall = (builder.addComplexFilter as jest.Mock).mock.calls[0][0];
    
    // Check if the filter includes font properties
    expect(filterCall).toContain("fontfile='Arial.ttf'");
    expect(filterCall).toContain("fontsize=32");
    expect(filterCall).toContain("fontcolor=yellow");
  });
  
  it("should include background properties when specified", () => {
    const operation = new TextOperation({
      text: "Sample Text",
      backgroundColor: "black@0.5",
      boxBorder: 5,
    });
    
    operation.applyTo(builder);
    
    const filterCall = (builder.addComplexFilter as jest.Mock).mock.calls[0][0];
    
    // Check if the filter includes background properties
    expect(filterCall).toContain("box=1");
    expect(filterCall).toContain("boxcolor=black@0.5");
    expect(filterCall).toContain("boxborderw=5");
  });
  
  it("should include timing parameters when specified", () => {
    const operation = new TextOperation({
      text: "Sample Text",
      start: 5,
      end: 15,
    });
    
    operation.applyTo(builder);
    
    const filterCall = (builder.addComplexFilter as jest.Mock).mock.calls[0][0];
    
    // Check if the filter includes the enable expression with timing
    expect(filterCall).toContain("enable='between(t,00:00:05.000,00:00:15.000)'");
  });
}); 