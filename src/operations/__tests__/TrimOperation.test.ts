import { TrimOperation } from '../TrimOperation';

describe('TrimOperation', () => {
  describe('validate', () => {
    it('should return false if no trim parameters are provided', () => {
      const operation = new TrimOperation({});
      expect(operation.validate()).toBe(false);
    });
    
    it('should return true if only start time is provided', () => {
      const operation = new TrimOperation({ start: 10 });
      expect(operation.validate()).toBe(true);
    });
    
    it('should return true if only end time is provided', () => {
      const operation = new TrimOperation({ end: 20 });
      expect(operation.validate()).toBe(true);
    });
    
    it('should return true if only duration is provided', () => {
      const operation = new TrimOperation({ duration: 10 });
      expect(operation.validate()).toBe(true);
    });
    
    it('should return true if start and end times are provided', () => {
      const operation = new TrimOperation({ start: 10, end: 20 });
      expect(operation.validate()).toBe(true);
    });
    
    it('should return true if start and duration are provided', () => {
      const operation = new TrimOperation({ start: 10, duration: 10 });
      expect(operation.validate()).toBe(true);
    });
    
    it('should validate consistent start, end, and duration', () => {
      const operation = new TrimOperation({ start: 10, end: 20, duration: 10 });
      expect(operation.validate()).toBe(true);
    });
    
    it('should invalidate inconsistent start, end, and duration', () => {
      const operation = new TrimOperation({ start: 10, end: 25, duration: 10 });
      expect(operation.validate()).toBe(false);
    });
  });
  
  describe('applyTo', () => {
    it('should apply start time to the builder', () => {
      const mockBuilder = {
        addArgument: jest.fn()
      };
      
      const operation = new TrimOperation({ start: 10 });
      operation.applyTo(mockBuilder);
      
      expect(mockBuilder.addArgument).toHaveBeenCalledWith('-ss', '00:00:10.000');
    });
    
    it('should apply end time to the builder', () => {
      const mockBuilder = {
        addArgument: jest.fn()
      };
      
      const operation = new TrimOperation({ end: 20 });
      operation.applyTo(mockBuilder);
      
      expect(mockBuilder.addArgument).toHaveBeenCalledWith('-to', '00:00:20.000');
    });
    
    it('should apply duration to the builder when no end time is specified', () => {
      const mockBuilder = {
        addArgument: jest.fn()
      };
      
      const operation = new TrimOperation({ start: 10, duration: 10 });
      operation.applyTo(mockBuilder);
      
      expect(mockBuilder.addArgument).toHaveBeenCalledWith('-ss', '00:00:10.000');
      expect(mockBuilder.addArgument).toHaveBeenCalledWith('-t', '00:00:10.000');
    });
    
    it('should apply start and end time to the builder', () => {
      const mockBuilder = {
        addArgument: jest.fn()
      };
      
      const operation = new TrimOperation({ start: 10, end: 20 });
      operation.applyTo(mockBuilder);
      
      expect(mockBuilder.addArgument).toHaveBeenCalledWith('-ss', '00:00:10.000');
      expect(mockBuilder.addArgument).toHaveBeenCalledWith('-to', '00:00:20.000');
    });
    
    it('should handle string time formats', () => {
      const mockBuilder = {
        addArgument: jest.fn()
      };
      
      const operation = new TrimOperation({ start: '00:01:30', end: '00:02:45' });
      operation.applyTo(mockBuilder);
      
      expect(mockBuilder.addArgument).toHaveBeenCalledWith('-ss', '00:01:30');
      expect(mockBuilder.addArgument).toHaveBeenCalledWith('-to', '00:02:45');
    });
    
    it('should handle object time formats', () => {
      const mockBuilder = {
        addArgument: jest.fn()
      };
      
      const operation = new TrimOperation({ 
        start: { minutes: 1, seconds: 30 }, 
        end: { minutes: 2, seconds: 45 } 
      });
      operation.applyTo(mockBuilder);
      
      // The actual formatting will depend on the formatTimeSpec implementation
      // This test assumes it returns a properly formatted string
      expect(mockBuilder.addArgument).toHaveBeenCalledTimes(2);
      expect(mockBuilder.addArgument.mock.calls[0][0]).toBe('-ss');
      expect(mockBuilder.addArgument.mock.calls[1][0]).toBe('-to');
    });
  });
}); 