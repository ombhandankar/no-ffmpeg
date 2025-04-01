import { FFmpegCommand } from '../FFmpegCommand';
import { MissingParameterError } from '../../errors';

describe('FFmpegCommand', () => {
  let command: FFmpegCommand;
  
  beforeEach(() => {
    command = new FFmpegCommand('ffmpeg');
  });
  
  it('should set input correctly', () => {
    command.setInput('input.mp4');
    expect(command.getInputPath()).toBe('input.mp4');
    expect(command.getArgs()).toContain('input.mp4');
  });
  
  it('should set output correctly', () => {
    command.setOutput('output.mp4');
    expect(command.getOutputPath()).toBe('output.mp4');
  });
  
  it('should add filters correctly', () => {
    command.addFilter('scale', '640:480');
    expect(command.getArgs()).toContain('-filter:v');
    expect(command.getArgs()).toContain('scale=640:480');
  });
  
  it('should add multiple filters correctly', () => {
    command.addFilters(['scale=640:480', 'rotate=90']);
    expect(command.getArgs()).toContain('-vf');
    expect(command.getArgs()).toContain('scale=640:480,rotate=90');
  });
  
  it('should throw error when validating without input', () => {
    command.setOutput('output.mp4');
    expect(() => command.validate()).toThrow(MissingParameterError);
    expect(() => command.validate()).toThrow('input');
  });
  
  it('should throw error when validating without output', () => {
    command.setInput('input.mp4');
    expect(() => command.validate()).toThrow(MissingParameterError);
    expect(() => command.validate()).toThrow('output');
  });
  
  it('should validate successfully with input and output', () => {
    command.setInput('input.mp4');
    command.setOutput('output.mp4');
    expect(command.validate()).toBe(true);
  });
  
  it('should add output to args during validation', () => {
    command.setInput('input.mp4');
    command.setOutput('output.mp4');
    command.validate();
    
    const args = command.getArgs();
    expect(args[args.length - 1]).toBe('output.mp4');
  });
}); 