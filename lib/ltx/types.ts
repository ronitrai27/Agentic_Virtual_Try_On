export type SceneId = 'base' | 'scene' | 'clothing' | 'cast';

export type ControlKey = 'scene' | 'clothing' | 'cast';

export type Direction = 'forward' | 'reverse';

export type PlaybackState = 'loading' | 'ready' | 'starting' | 'playing' | 'selected' | 'error';

export interface VideoClipConfig {
  id: string;
  control: ControlKey;
  direction: Direction;
  fileName: string;
  url: string;
  duration: number;
  holdThreshold: number;
  targetHoldTime: number;
}

export interface ControlColumn {
  index: number;
  label: string;
  key?: ControlKey;
  isAction: boolean;
}

export interface CapsulePosition {
  left: string;
  width: string;
}

export interface LtxEngineState {
  activeScene: SceneId;
  playbackState: PlaybackState;
  activeVideoId: string;
  visibleVideoId: string;
  activeControl: ControlKey | null;
  direction: Direction | null;
  isLocked: boolean;
  readyVideos: Record<string, boolean>;
  allReady: boolean;
  errorMessage: string | null;
  focusedIndex: number | null;
  hoveredIndex: number | null;
  titleHidden: boolean;
  selectedLabelOffset: { x: number; y: number } | null;
}
