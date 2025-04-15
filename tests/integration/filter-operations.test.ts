import * as path from "path";
import * as fs from "fs-extra";
import { video, Processor } from "../../src";

// This test requires FFmpeg to be installed on the system
// If ffmpeg is not installed, the tests will be skipped

describe("Filter Operations Integration Tests", () => {
  const testVideoPath = path.join(__dirname, "..", "fixtures", "test.mp4");
  const outputDir = path.join(__dirname, "..", "fixtures", "output");
  const speed1_5xOutput = path.join(outputDir, "speed_1.5x.mp4");
  const speed0_5xOutput = path.join(outputDir, "speed_0.5x.mp4");
  const brightnessOutput = path.join(outputDir, "brightness.mp4");
  const contrastOutput = path.join(outputDir, "contrast.mp4");
  const saturationOutput = path.join(outputDir, "saturation.mp4");
  const combinedOutput = path.join(outputDir, "combined.mp4");

  // Skip tests if ffmpeg is not installed
  let ffmpegInstalled = false;
  let testVideoExists = false;

  beforeAll(async () => {
    try {
      // Check if ffmpeg is installed
      await import("execa").then(({ default: execa }) =>
        execa("ffmpeg", ["-version"]),
      );
      ffmpegInstalled = true;
      console.log("FFmpeg is installed. Running integration tests.");

      // Create test fixtures directory if it doesn't exist
      await fs.ensureDir(path.join(__dirname, "..", "fixtures"));
      await fs.ensureDir(outputDir);

      // Check if test video exists
      testVideoExists = await fs.pathExists(testVideoPath);
      if (!testVideoExists) {
        console.warn("Test video not found at:", testVideoPath);
        console.warn("Filter operation tests will be skipped.");
      }
    } catch (error) {
      console.warn("FFmpeg not found. Integration tests will be skipped.");
    }
  });

  afterAll(async () => {
    // Clean up output files
    try {
      if (await fs.pathExists(outputDir)) {
        await fs.emptyDir(outputDir);
      }
    } catch (error) {
      console.error("Error cleaning up output files:", error);
    }
  });

  // Only run tests if ffmpeg is installed and the test video exists
  const conditionalTest = (ffmpegInstalled && testVideoExists) ? it : it.skip;

  conditionalTest(
    "should increase playback speed",
    async () => {
      const result = await video(testVideoPath)
        .speed(1.5) // Make video 1.5x faster
        .output(speed1_5xOutput)
        .execute();

      expect(result.success).toBe(true);
      expect(await fs.pathExists(speed1_5xOutput)).toBe(true);

      // Verify the file has been created and has content
      const stats = await fs.stat(speed1_5xOutput);
      expect(stats.size).toBeGreaterThan(0);
    },
    30000, // 30 seconds timeout
  );

  conditionalTest(
    "should decrease playback speed",
    async () => {
      const result = await video(testVideoPath)
        .speed(0.5) // Make video 2x slower
        .output(speed0_5xOutput)
        .execute();

      expect(result.success).toBe(true);
      expect(await fs.pathExists(speed0_5xOutput)).toBe(true);

      // Verify the file has been created and has content
      const stats = await fs.stat(speed0_5xOutput);
      expect(stats.size).toBeGreaterThan(0);
    },
    30000,
  );

  conditionalTest(
    "should adjust brightness",
    async () => {
      const result = await video(testVideoPath)
        .adjustColor({ brightness: 0.2 }) // Increase brightness
        .output(brightnessOutput)
        .execute();

      expect(result.success).toBe(true);
      expect(await fs.pathExists(brightnessOutput)).toBe(true);

      // Verify the file has been created and has content
      const stats = await fs.stat(brightnessOutput);
      expect(stats.size).toBeGreaterThan(0);
    },
    30000,
  );

  conditionalTest(
    "should adjust contrast",
    async () => {
      const result = await video(testVideoPath)
        .adjustColor({ contrast: 1.3 }) // Increase contrast
        .output(contrastOutput)
        .execute();

      expect(result.success).toBe(true);
      expect(await fs.pathExists(contrastOutput)).toBe(true);

      // Verify the file has been created and has content
      const stats = await fs.stat(contrastOutput);
      expect(stats.size).toBeGreaterThan(0);
    },
    30000,
  );

  conditionalTest(
    "should adjust saturation",
    async () => {
      const result = await video(testVideoPath)
        .adjustColor({ saturation: 1.5 }) // Increase saturation
        .output(saturationOutput)
        .execute();

      expect(result.success).toBe(true);
      expect(await fs.pathExists(saturationOutput)).toBe(true);

      // Verify the file has been created and has content
      const stats = await fs.stat(saturationOutput);
      expect(stats.size).toBeGreaterThan(0);
    },
    30000,
  );

  conditionalTest(
    "should chain speed and color adjustments",
    async () => {
      const result = await video(testVideoPath)
        .speed(1.25) // Speed up slightly
        .adjustColor({
          brightness: 0.1,
          contrast: 1.1,
          saturation: 1.2,
        }) // Enhance colors
        .output(combinedOutput)
        .execute();

      expect(result.success).toBe(true);
      expect(await fs.pathExists(combinedOutput)).toBe(true);

      // Verify the file has been created and has content
      const stats = await fs.stat(combinedOutput);
      expect(stats.size).toBeGreaterThan(0);
    },
    30000,
  );

  // Optional: tests combining with other operations
  conditionalTest(
    "should chain with trim, scale, and other operations",
    async () => {
      const chainedOutput = path.join(outputDir, "chained.mp4");
      
      const result = await video(testVideoPath)
        .trim({ start: 0, duration: 5 }) // First 5 seconds
        .speed(1.5) // 1.5x speed
        .adjustColor({ brightness: 0.1, saturation: 1.2 }) // Adjust colors
        .output(chainedOutput)
        .execute();

      expect(result.success).toBe(true);
      expect(await fs.pathExists(chainedOutput)).toBe(true);

      // Verify the file has been created and has content
      const stats = await fs.stat(chainedOutput);
      expect(stats.size).toBeGreaterThan(0);
    },
    30000,
  );
}); 