import { FilterType, FilterStream } from "../types";

/**
 * Class to manage complex filter chains in FFmpeg commands
 */
export class FilterChain {
  private filters: FilterNode[] = [];
  private nextLabelIndex = 0;
  
  /**
   * Add a filter to the chain
   * @param filter The filter string (e.g., "scale=640:360")
   * @param filterType Type of filter (simple or complex)
   * @param inputs Input streams for this filter
   * @param outputs Output streams for this filter
   * @returns This chain instance for chaining
   */
  public addFilter(
    filter: string, 
    filterType: FilterType = FilterType.SIMPLE,
    inputs: FilterStream[] = [],
    outputs: FilterStream[] = []
  ): this {
    // If no inputs are specified, assume main video stream
    if (inputs.length === 0) {
      inputs = [{ label: "[0:v]", isInput: true, isMain: true }];
    }
    
    // If no outputs are specified, create a temporary label
    if (outputs.length === 0) {
      outputs = [{ 
        label: `[temp${this.nextLabelIndex++}]`, 
        isInput: false, 
        isMain: true 
      }];
    }
    
    this.filters.push({
      filter,
      filterType,
      inputs,
      outputs
    });
    
    return this;
  }
  
  /**
   * Generate a simple filter string (-vf format)
   * @returns Filter string for -vf parameter
   */
  public getSimpleFilterString(): string | null {
    const simpleFilters = this.filters
      .filter(node => node.filterType === FilterType.SIMPLE)
      .map(node => node.filter);
    
    if (simpleFilters.length === 0) {
      return null;
    }
    
    return simpleFilters.join(",");
  }
  
  /**
   * Generate a complex filter graph (-filter_complex format)
   * @returns Complex filter graph string
   */
  public getComplexFilterString(): string | null {
    // Only process the chain if we have complex filters
    if (!this.hasComplexFilters()) {
      return null;
    }
    
    // Build the filter graph
    const filterParts: string[] = [];
    
    // For text and simple filters, just use the main video stream as input
    this.filters.forEach((node, index) => {
      if (node.filterType === FilterType.COMPLEX) {
        // For each complex filter, create a unique output label
        const outputLabel = this.generateLabel("out");
        
        // Use the main video stream [0:v] as the default input
        const inputLabel = "[0:v]";
        
        // Create the filter string with proper input and output labels
        const filterStr = `${inputLabel}${node.filter}${outputLabel}`;
        filterParts.push(filterStr);
      }
    });
    
    return filterParts.join(";");
  }
  
  /**
   * Check if the chain has any complex filters
   */
  public hasComplexFilters(): boolean {
    return this.filters.some(node => node.filterType === FilterType.COMPLEX);
  }
  
  /**
   * Get the final output label from the filter chain
   */
  public getFinalOutputLabel(): string {
    const complexFilters = this.filters.filter(node => node.filterType === FilterType.COMPLEX);
    
    if (complexFilters.length === 0) {
      return "[0:v]";
    }
    
    // Return the output label from the last complex filter
    // Since we're generating output labels in getComplexFilterString, we know the pattern
    return `[out${this.nextLabelIndex - 1}]`;
  }
  
  /**
   * Generate a new unique label for a filter node
   */
  public generateLabel(prefix: string = "temp"): string {
    return `[${prefix}${this.nextLabelIndex++}]`;
  }
  
  /**
   * Reset the filter chain
   */
  public reset(): void {
    this.filters = [];
    this.nextLabelIndex = 0;
  }
}

/**
 * Interface representing a node in the filter graph
 */
interface FilterNode {
  filter: string;
  filterType: FilterType;
  inputs: FilterStream[];
  outputs: FilterStream[];
} 