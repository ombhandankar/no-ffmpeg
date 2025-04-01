import { Operation } from "./Operation.interface";
import { TrimOptions, TimeSpec } from "../types";
import { formatTimeSpec } from "../utils";

/**
 * Operation for trimming media files by specifying start time, end time, or duration
 */
export class TrimOperation implements Operation {
  private options: TrimOptions;

  /**
   * Creates a new TrimOperation
   * @param options Options for the trim operation, including start time, end time, or duration
   */
  constructor(options: TrimOptions) {
    this.options = options;
  }

  /**
   * Validates that the operation parameters are valid
   * @returns true if the operation is valid, false otherwise
   */
  validate(): boolean {
    // At least one of start, end, or duration must be provided
    if (!this.options.start && !this.options.end && !this.options.duration) {
      return false;
    }

    // If both end and duration are provided, ensure they don't conflict
    if (this.options.end && this.options.duration && this.options.start) {
      const startTime = this.parseTimeToSeconds(this.options.start);
      const endTime = this.parseTimeToSeconds(this.options.end);
      const duration = this.parseTimeToSeconds(this.options.duration);

      // Check if end time doesn't match start + duration
      if (Math.abs(startTime + duration - endTime) > 0.001) {
        return false;
      }
    }

    return true;
  }

  /**
   * Applies this trim operation to the given command builder
   * @param builder The command builder to apply this operation to
   */
  applyTo(builder: any): void {
    if (this.options.start) {
      const startTime = formatTimeSpec(this.options.start);
      builder.addArgument("-ss", startTime);
    }

    if (this.options.end) {
      const endTime = formatTimeSpec(this.options.end);
      builder.addArgument("-to", endTime);
    } else if (this.options.duration) {
      const duration = formatTimeSpec(this.options.duration);
      builder.addArgument("-t", duration);
    }
  }

  /**
   * Helper method to parse a TimeSpec to seconds for validation
   */
  private parseTimeToSeconds(time: TimeSpec): number {
    if (typeof time === "number") {
      return time;
    }

    if (typeof time === "string") {
      // Simple parser for HH:MM:SS format
      const parts = time.split(":").map(Number);
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      } else {
        return Number(time);
      }
    }

    if (typeof time === "object") {
      const hours = time.hours || 0;
      const minutes = time.minutes || 0;
      const seconds = time.seconds || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }

    return 0;
  }
}
