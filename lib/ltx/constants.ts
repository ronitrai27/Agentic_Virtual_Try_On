import { ControlColumn, ControlKey, VideoClipConfig } from './types';

export const MEDIA_BASE_URL = 'https://pub-86dc5b5484314368ac5436a674b0d919.r2.dev/designs/';

export const VIDEO_CLIPS: VideoClipConfig[] = [
  // Clothing (video-1.mp4) - Base parked scene is clothing forward at frame 0
  {
    id: 'clothing-forward',
    control: 'clothing',
    direction: 'forward',
    fileName: 'video-1.mp4',
    url: `${MEDIA_BASE_URL}video-1.mp4`,
    duration: 2.08,
    holdThreshold: 0.08,
    targetHoldTime: 2.00,
  },
  {
    id: 'clothing-reverse',
    control: 'clothing',
    direction: 'reverse',
    fileName: 'video-1-reverse.mp4',
    url: `${MEDIA_BASE_URL}video-1-reverse.mp4`,
    duration: 2.08,
    holdThreshold: 0.08,
    targetHoldTime: 2.00,
  },

  // Scene (video-2.mp4)
  {
    id: 'scene-forward',
    control: 'scene',
    direction: 'forward',
    fileName: 'video-2.mp4',
    url: `${MEDIA_BASE_URL}video-2.mp4`,
    duration: 2.08,
    holdThreshold: 0.08,
    targetHoldTime: 2.00,
  },
  {
    id: 'scene-reverse',
    control: 'scene',
    direction: 'reverse',
    fileName: 'video-2-reverse.mp4',
    url: `${MEDIA_BASE_URL}video-2-reverse.mp4`,
    duration: 2.08,
    // Verified empirically in spec: Scene REVERSE hold guard is 0.18s before duration
    holdThreshold: 0.18,
    targetHoldTime: 1.90,
  },

  // Cast (video-4.mp4)
  {
    id: 'cast-forward',
    control: 'cast',
    direction: 'forward',
    fileName: 'video-4.mp4',
    url: `${MEDIA_BASE_URL}video-4.mp4`,
    duration: 3.00,
    holdThreshold: 0.08,
    targetHoldTime: 2.92,
  },
  {
    id: 'cast-reverse',
    control: 'cast',
    direction: 'reverse',
    fileName: 'video-4-reverse.mp4',
    url: `${MEDIA_BASE_URL}video-4-reverse.mp4`,
    duration: 2.48,
    holdThreshold: 0.08,
    targetHoldTime: 2.40,
  },
];

// Initial parked video element is clothing-forward at frame 0
export const BASE_VIDEO_ID = 'clothing-forward';

export const CONTROL_COLUMNS: ControlColumn[] = [
  { index: 0, label: 'Select state →', isAction: false },
  { index: 1, label: 'Scene', key: 'scene', isAction: true },
  { index: 2, label: 'Clothing', key: 'clothing', isAction: true },
  { index: 3, label: 'Cast', key: 'cast', isAction: true },
];

export const CAPSULE_POSITIONS: Record<number, { left: string; width: string }> = {
  0: { left: '0%', width: '25%' },
  1: { left: '25%', width: '25%' },
  2: { left: '50%', width: '25%' },
  3: { left: '75%', width: '25%' },
};

export const CONTROL_INDEX_MAP: Record<ControlKey, number> = {
  scene: 1,
  clothing: 2,
  cast: 3,
};
