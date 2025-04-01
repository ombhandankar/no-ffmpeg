# no-ffmpeg Examples

This document provides example usage patterns for the no-ffmpeg library. These examples demonstrate how to use the fluent API for common video and audio processing tasks without needing to know the underlying FFmpeg commands.

## Basic Usage

### Trimming a video

```javascript
const { video } = require('no-ffmpeg');

// Trim a video from 10 seconds to 20 seconds
video('input.mp4')
  .trim({ start: 10, end: 20 })
  .output('output.mp4')
  .execute()
  .then(result => {
    console.log('Video trimmed successfully!');
    console.log(`Output file: ${result.outputPath}`);
    console.log(`Processing time: ${result.duration}ms`);
  })
  .catch(error => {
    console.error('Error processing video:', error.message);
  });
```

### Resize a video

```javascript
const { video } = require('no-ffmpeg');

// Resize a video to 720p width (height will adjust automatically to maintain aspect ratio)
video('input.mp4')
  .resize({ width: 1280, height: 720 })
  .output('output.mp4')
  .execute()
  .then(result => {
    console.log('Video resized successfully!');
  })
  .catch(error => {
    console.error('Error processing video:', error.message);
  });
```

## Chaining Operations

You can chain multiple operations together:

```javascript
const { video } = require('no-ffmpeg');

video('input.mp4')
  .trim({ start: 10, end: 30 })
  .resize({ width: 1280 })
  .crop(1280, 720, 0, 0)  // Crop to 1280x720 starting at position (0,0)
  .rotate(90)             // Rotate 90 degrees clockwise
  .output('output.mp4', { 
    quality: 23,          // Lower is better quality but larger file size (0-51)
    codec: 'libx264'      // Use H.264 codec
  })
  .execute()
  .then(result => {
    console.log('Video processed successfully!');
    console.log(`Command used: ${result.commandExecuted}`);
  })
  .catch(error => {
    console.error('Error processing video:', error.message);
  });
```

## TypeScript Usage

```typescript
import { video, TrimOptions, ResizeOptions, OutputOptions } from 'no-ffmpeg';

async function processVideo() {
  try {
    const trimOptions: TrimOptions = { 
      start: 5,
      duration: 10
    };
    
    const resizeOptions: ResizeOptions = {
      width: 1280,
      maintainAspectRatio: true
    };
    
    const outputOptions: OutputOptions = {
      format: 'mp4',
      quality: 23,
      codec: 'libx264'
    };
    
    const result = await video('input.mp4')
      .trim(trimOptions)
      .resize(resizeOptions)
      .output('output.mp4', outputOptions)
      .execute();
      
    console.log(`Video processed successfully in ${result.duration}ms`);
  } catch (error) {
    console.error('Error processing video:', error);
  }
}

processVideo();
```

## Advanced Usage

### Custom FFmpeg Path

If FFmpeg is installed in a non-standard location, you can specify the path:

```javascript
const { video } = require('no-ffmpeg');

video('input.mp4', { 
  ffmpegPath: '/path/to/ffmpeg' 
})
.trim({ start: 10, end: 20 })
.output('output.mp4')
.execute();
```

### Custom Logging

You can provide a custom logger function:

```javascript
const { video, LogLevel } = require('no-ffmpeg');

function myLogger(message, level) {
  // Only log errors and warnings
  if (level === LogLevel.ERROR || level === LogLevel.WARN) {
    console.log(`[${level}] ${message}`);
  }
}

video('input.mp4', { 
  logger: myLogger 
})
.trim({ start: 10, end: 20 })
.output('output.mp4')
.execute();
```

## Error Handling

The library provides specific error types for better error handling:

```javascript
const { 
  video, 
  FFmpegNotFoundError, 
  InputFileError, 
  FFmpegExecutionError 
} = require('no-ffmpeg');

video('input.mp4')
  .trim({ start: 10, end: 20 })
  .output('output.mp4')
  .execute()
  .catch(error => {
    if (error instanceof FFmpegNotFoundError) {
      console.error('FFmpeg not found. Please install FFmpeg first.');
    } else if (error instanceof InputFileError) {
      console.error('Input file error:', error.message);
    } else if (error instanceof FFmpegExecutionError) {
      console.error('FFmpeg execution failed:', error.message);
      console.error('Command:', error.command);
      console.error('FFmpeg stderr:', error.stderr);
    } else {
      console.error('Unknown error:', error);
    }
  });
```