import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

/**
 * Returns the path to the ffmpeg binary
 * If the user supplies their own path, it will be used
 * Otherwise, it will use the path from ffmpeg-installer
 */
export function getFFmpegPath(customPath?: string): string {
  return customPath || ffmpegInstaller.path;
} 