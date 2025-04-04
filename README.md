# no-ffmpeg

A high-level, extensible wrapper for FFmpeg and other command-line tools with a fluent API.

## Features

- 🔄 Fluent API for media processing operations
- 🧩 Extensible command abstraction framework
- 🛠️ Support for common video and audio operations
- 📝 Text and image overlay capabilities
- 🔌 Pluggable executor system
- 🧪 Comprehensive test coverage

## Installation

```bash
npm install no-ffmpeg
```

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

## License

MIT