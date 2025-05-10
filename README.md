# no-ffmpeg

A high-level, extensible wrapper for FFmpeg and other command-line tools with a fluent API.

## Features

- 🔄 Fluent API for media processing operations
- 🧩 Extensible command abstraction framework
- 🛠️ Support for common video and audio operations
 - trim and resize operation support
- 📝 Text and image overlay capabilities
- 🎨 Color adjustment and speed modification
- 🔌 Pluggable executor system
- 🧪 Comprehensive test coverage
- 📦 Bundled ffmpeg binary - no need to install ffmpeg separately!

## Installation

```bash
npm install no-ffmpeg
```

No need to install FFmpeg separately! The package includes an FFmpeg binary that works on Windows, Mac OS X, and Linux.

## Basic Usage

```typescript
import { video } from 'no-ffmpeg';

// Simple trimming and resizing
async function processVideo() {
  const result = await video('input.mp4')
    .trim({ start: '00:00:10', duration: 30 })
    .resize({ width: 640 })
    .output('output.mp4')
    .execute();
  
  console.log(`Output saved to: ${result.outputPath}`);
}
```

## Video Speed and Color Adjustments

```typescript
import { video } from 'no-ffmpeg';

// Adjust video speed
async function adjustVideoSpeed() {
  await video('input.mp4')
    .speed(1.5) // Speed up by 1.5x
    .output('fast-video.mp4')
    .execute();
}

// Adjust video colors
async function adjustVideoColors() {
  await video('input.mp4')
    .adjustColor({
      brightness: 0.1,    // Increase brightness by 10%
      contrast: 1.2,      // Increase contrast by 20%
      saturation: 0.8     // Decrease saturation by 20%
    })
    .output('color-adjusted.mp4')
    .execute();
}
```

## Text and Image Overlays

```typescript
import { video, Position } from 'no-ffmpeg';

// Add text overlay
async function addTextToVideo() {
  await video('input.mp4')
    .text({
      text: 'Hello World!',
      position: Position.TOP,  // Predefined position
      fontSize: 48,
      fontColor: 'white',
      backgroundColor: 'black@0.5',  // Semi-transparent background
      start: 2,  // Start at 2 seconds
      end: 10    // End at 10 seconds
    })
    .output('output-with-text.mp4')
    .execute();
}

// Add image overlay
async function addImageOverlay() {
  await video('input.mp4')
    .overlay({
      source: 'logo.png',
      position: Position.BOTTOM_RIGHT,
      scale: 0.5,  // Scale to 50% of original size
      opacity: 0.8,  // 80% opacity
      padding: 20,  // 20px padding from the edge
      start: 5,  // Start at 5 seconds
      end: 15    // End at 15 seconds
    })
    .output('output-with-overlay.mp4')
    .execute();
}

// Combine operations
async function combinedOperations() {
  await video('input.mp4')
    .trim({ start: 10, end: 20 })
    .resize({ width: 1280, height: 720 })
    .speed(1.25) // Speed up by 25%
    .adjustColor({
      brightness: 0.05,
      contrast: 1.1,
      saturation: 1.2
    })
    .text({
      text: 'Resized Video',
      position: Position.TOP,
      fontSize: 36
    })
    .overlay({
      source: 'watermark.png',
      position: Position.BOTTOM_RIGHT
    })
    .output('output-combined.mp4')
    .execute();
}
```

## Command Abstraction Framework

The library uses a modular command abstraction framework, which allows it to:

1. Work with any command-line tool, not just FFmpeg
2. Enable easy extension with custom commands
3. Provide robust validation and error handling

### Core Classes and Interfaces

- **BaseCommand**: Abstract base class for all command-line operations
- **CommandBuilder**: Interface for fluent command construction
- **CommandExecutor**: Interface for executing commands
- **CommandRegistry**: Registry for command types and builders

### Creating Custom Commands

You can extend the framework to work with other command-line tools:

```typescript
// Create a custom command for ImageMagick
class ImageMagickCommand extends BaseCommand {
  constructor() {
    super('convert');
  }
  
  // Implement required methods...
}

// Create a custom builder
class ImageMagickCommandBuilder implements CommandBuilder<ImageMagickCommand> {
  // Implement required methods...
}

// Register with the registry
const registry = CommandRegistry.getInstance();
registry.registerCommand('imagemagick', ImageMagickCommand);
registry.registerBuilder('imagemagick', ImageMagickCommandBuilder);
```

## Advanced Usage

```typescript
import { createProcessor, LogLevel } from 'no-ffmpeg';

// Custom processor with logging
const processor = createProcessor('input.mp4', {
  ffmpegPath: '/usr/local/bin/ffmpeg',
  tempDir: './temp',
  logger: (message, level) => {
    if (level === LogLevel.INFO || level === LogLevel.ERROR) {
      console.log(`[${level}] ${message}`);
    }
  }
});

// Multiple operations
await processor
  .trim({ start: '00:01:00', end: '00:02:00' })
  .resize({ width: 1280, height: 720 })
  .crop(1200, 700, 40, 10)
  .rotate(90)
  .speed(0.75) // Slow down to 75% of original speed
  .adjustColor({
    brightness: 0.1,
    contrast: 1.15,
    saturation: 1.1
  })
  .text({
    text: 'Processed Video',
    position: Position.CENTER,
    fontSize: 48,
    fontColor: 'yellow'
  })
  .output('output.mp4', {
    codec: 'libx264',
    quality: 23,
    format: 'mp4'
  })
  .execute();
```

## Video Concatenation

```typescript
import { concat, Processor } from 'no-ffmpeg';

// Concatenate multiple videos using the convenience function
async function combineVideos() {
  await concat({
    inputs: ['clip1.mp4', 'clip2.mp4', 'clip3.mp4'],
    strategy: 'filter'  // Uses filter_complex strategy (more compatible)
  })
  .output('combined-video.mp4')
  .execute();
}

// Concatenate videos with only video streams (no audio)
async function combineVideoOnlyFiles() {
  await concat({
    inputs: ['clip1.mp4', 'clip2.mp4'],
    strategy: 'filter',
    videoOnly: true  // Use this when some files might not have audio
  })
  .output('combined-video-only.mp4')
  .execute();
}

// Concatenate videos using the demuxer strategy (faster for similar files)
async function combineVideosWithDemuxer() {
  await concat({
    inputs: ['clip1.mp4', 'clip2.mp4', 'clip3.mp4'],
    strategy: 'demuxer'  // Faster but requires similar formats/codecs
  })
  .output('combined-video-demuxer.mp4')
  .execute();
}

// Alternate syntax using the Processor instance method
async function combineWithProcessorInstance() {
  const processor = new Processor();
  await processor
    .concat({
      inputs: ['clip1.mp4', 'clip2.mp4'],
      strategy: 'filter'
    })
    .output('combined-video-alt.mp4')
    .execute();
}
```

## Encoding Options

```typescript
import { video } from 'no-ffmpeg';

// Control output video quality with CRF
async function highQualityEncoding() {
  await video('input.mp4')
    .resize({ width: 1920, height: 1080 })
    .encoding({
      codec: 'libx264',  // H.264 codec
      crf: 18,           // High quality (lower value = better quality)
      preset: 'slow'     // Slower encoding = better compression
    })
    .output('high-quality.mp4')
    .execute();
}

// Control bitrate instead of CRF
async function bitrateControlledEncoding() {
  await video('input.mp4')
    .encoding({
      codec: 'libx264', 
      videoBitrate: '5M',  // 5 Mbps
      preset: 'fast'       // Faster encoding
    })
    .output('bitrate-limited.mp4')
    .execute();
}

// Combine with other operations
async function combineOperationsWithEncoding() {
  await video('input.mp4')
    .trim({ start: 10, end: 30 })
    .resize({ width: 1280, height: 720 })
    .speed(1.5)
    .adjustColor({ contrast: 1.2 })
    .encoding({
      codec: 'libx265',  // H.265/HEVC codec
      crf: 23,
      preset: 'medium'
    })
    .output('processed-video.mp4')
    .execute();
}

// Combine concatenation with encoding
async function combineVideosThenEncode() {
  await concat({
    inputs: ['clip1.mp4', 'clip2.mp4']
  })
  .encoding({
    codec: 'libx264',
    crf: 22,
    preset: 'medium'
  })
  .output('combined-encoded.mp4')
  .execute();
}
```

## License

MIT