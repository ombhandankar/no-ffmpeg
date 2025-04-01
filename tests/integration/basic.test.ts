import * as path from "path";
import * as fs from "fs-extra";
import { video, Processor } from "../../src";

// This test requires FFmpeg to be installed on the system
// If ffmpeg is not installed, the tests will be skipped

describe("Basic Integration Tests", () => {
  const testVideoPath = path.join(__dirname, "..", "fixtures", "test.mp4");
  const outputPath = path.join(__dirname, "..", "fixtures", "output.mp4");

  // Skip tests if ffmpeg is not installed
  let ffmpegInstalled = false;

  beforeAll(async () => {
    try {
      // Check if ffmpeg is installed
      await import("execa").then(({ default: execa }) =>
        execa("ffmpeg", ["-version"]),
      );
      ffmpegInstalled = true;

      // Create test fixtures directory if it doesn't exist
      await fs.ensureDir(path.join(__dirname, "..", "fixtures"));

      // Create a sample test file if it doesn't exist
      if (!(await fs.pathExists(testVideoPath))) {
        console.warn("Test video not found. Some tests will be skipped.");
      }
    } catch (error) {
      console.warn("FFmpeg not found. Integration tests will be skipped.");
    }
  });

  afterAll(async () => {
    // Clean up output files
    if (await fs.pathExists(outputPath)) {
      await fs.unlink(outputPath);
    }
  });

  it("should import the library correctly", () => {
    expect(video).toBeDefined();
    expect(Processor).toBeDefined();
  });

  it("should create a processor instance", () => {
    const processor = video("dummy.mp4");
    expect(processor).toBeInstanceOf(Processor);
  });

  // Only run this test if ffmpeg is installed and test video exists
  (ffmpegInstalled ? it : it.skip)(
    "should trim a video if test file exists",
    async () => {
      if (!(await fs.pathExists(testVideoPath))) {
        return;
      }

      const result = await video(testVideoPath)
        .trim({ start: 0, duration: 5 }) // Trim to 5 seconds
        .output(outputPath)
        .execute();

      expect(result.success).toBe(true);
      expect(await fs.pathExists(outputPath)).toBe(true);

      // Verify the file has been created and has content
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
    },
    30000,
  ); // Increase timeout to 30 seconds for ffmpeg processing
});
