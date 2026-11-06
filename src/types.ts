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

export type CameraMode = 'photo' | 'video' | 'beauty' | 'pro';

export type ResolutionMode = 'max' | '4k' | '1080p' | '720p';

export type BeautyPresetId =
  | 'angel_glow'
  | 'glass_skin'
  | 'paris'
  | 'blushing_doll'
  | 'soft_honey'
  | 'sunset_kiss'
  | 'custom';

export interface BeautySettings {
  enabled: boolean;
  preset: BeautyPresetId;
  smoothLevel: number; // 0 to 100
  rosyLevel: number; // 0 to 100
  glowLevel: number; // 0 to 100
  brightenLevel: number; // 0 to 100
  slimLevel: number; // 0 to 100 (New: Face slimming)
  enlargeEyeLevel: number; // 0 to 100 (New: Bigger eyes)
  portraitDepthLevel: number; // 0 to 100 (New: Bokeh/DOF effect)
}

export const DEFAULT_BEAUTY_SETTINGS: BeautySettings = {
  enabled: false,
  preset: 'angel_glow',
  smoothLevel: 60,
  rosyLevel: 50,
  glowLevel: 45,
  brightenLevel: 40,
  slimLevel: 35,
  enlargeEyeLevel: 40,
  portraitDepthLevel: 0,
};

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
  // Manual Image Adjustments (Live)
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  vignette: number;
  beauty: BeautySettings;
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
