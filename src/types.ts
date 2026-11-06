export type MediaType = 'photo' | 'video';

export interface MediaItem {
  id: string;
  type: MediaType;
  blob: Blob;
  previewUrl: string;
  filename: string;
  fileSize: number;
  width: number;
  height: number;
  createdAt: number;
  duration?: number; // In seconds, for video
  filterId?: string;
  facingMode: 'user' | 'environment';
  mimeType: string;
  sourceVideoId?: string;
  timestampSeconds?: number;
}

export type AspectRatio = '4:3' | '16:9' | '1:1' | 'full';

export type FlashMode = 'off' | 'auto' | 'on' | 'torch';

export type GridType = 'none' | 'rule_of_thirds' | 'golden_ratio' | 'square';

export type CameraMode = 'photo' | 'video' | 'pro';

export type ResolutionMode = 'max' | '4k' | '1080p' | '720p';

export interface CameraSettings {
  aspectRatio: AspectRatio;
  flashMode: FlashMode;
  timerSeconds: 0 | 3 | 5 | 10;
  gridType: GridType;
  resolution: ResolutionMode;
  autoSaveToDevice: boolean;
  shutterSound: boolean;
  haptics: boolean;
  mirrorFrontCamera: boolean;
  activeFilterId: string;
  selectedDeviceId: string;
}

export interface CameraCapabilities {
  hasTorch: boolean;
  hasZoom: boolean;
  minZoom: number;
  maxZoom: number;
  zoomStep: number;
  currentZoom: number;
  hasExposure: boolean;
  minExposure: number;
  maxExposure: number;
  exposureStep: number;
  currentExposure: number;
  facingMode: 'user' | 'environment';
  deviceLabel: string;
}

export interface StorageStats {
  usedBytes: number;
  quotaBytes: number;
  percentage: number;
  itemCount: number;
}
