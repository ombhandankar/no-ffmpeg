# no-ffmpeg

A high-level, extensible wrapper for FFmpeg and other command-line tools with a fluent API.

## Features

- 🔄 Fluent API for media processing operations
- 🧩 Extensible command abstraction framework
- 🛠️ Support for common video and audio operations
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
  .output('output.mp4', {
    codec: 'libx264',
    quality: 23,
    format: 'mp4'
  })
  .execute();
```

## License

MIT