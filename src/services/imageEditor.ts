import { applySnapchatBeautyToCanvas } from './filters';

export interface ImageAdjustments {
  brightness: number; // -50 to 50
  contrast: number; // -50 to 50
  saturation: number; // -100 to 100
  warmth: number; // -50 to 50 (negative = cool, positive = warm)
  exposure: number; // -50 to 50
  vignette: number; // 0 to 100
  filterId: string; // 'none', 'vivid', 'noir', 'warm', 'cinematic', 'vintage', 'fade', 'cool'
  rotation: number; // 0, 90, 180, 270 degrees
  flipH: boolean;
  flipV: boolean;
  cropAspect: 'original' | '1:1' | '4:3' | '16:9' | '9:16' | '3:2';
  // Beauty & Retouch adjustments
  beautySmooth: number; // 0 to 100
  beautyRosy: number; // 0 to 100
  beautyGlow: number; // 0 to 100
  beautyBrighten: number; // 0 to 100
  beautySlim: number; // 0 to 100
  beautyEnlargeEye: number; // 0 to 100
  beautyPortraitDepth: number; // 0 to 100
  beautyPreset: string; // 'none' | 'natural' | 'rosy' | 'porcelain' | 'golden' | 'glamour' | 'fresh'
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  exposure: 0,
  vignette: 0,
  filterId: 'none',
  rotation: 0,
  flipH: false,
  flipV: false,
  cropAspect: 'original',
  beautySmooth: 0,
  beautyRosy: 0,
  beautyGlow: 0,
  beautyBrighten: 0,
  beautySlim: 0,
  beautyEnlargeEye: 0,
  beautyPortraitDepth: 0,
  beautyPreset: 'none',
};

export interface FilterPreset {
  id: string;
  name: string;
  previewColor: string;
  adjustments: Partial<ImageAdjustments>;
  cssFilter?: string;
}

export const FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'none',
    name: 'Original',
    previewColor: '#ffffff',
    adjustments: {},
  },
  {
    id: 'beauty_angel_glow',
    name: 'Angel Glow',
    previewColor: '#f472b6',
    adjustments: { beautySmooth: 65, beautyRosy: 50, beautyGlow: 60, beautyBrighten: 45, beautySlim: 40, beautyEnlargeEye: 45, beautyPortraitDepth: 25 },
  },
  {
    id: 'beauty_glass_skin',
    name: 'Glass Skin',
    previewColor: '#e0e7ff',
    adjustments: { beautySmooth: 75, beautyRosy: 30, beautyGlow: 50, beautyBrighten: 55, beautySlim: 50, beautyEnlargeEye: 30, beautyPortraitDepth: 20 },
  },
  {
    id: 'beauty_paris',
    name: 'Paris Velvet',
    previewColor: '#fed7aa',
    adjustments: { beautySmooth: 70, beautyRosy: 35, beautyGlow: 25, beautyBrighten: 40, beautySlim: 45, beautyEnlargeEye: 35, beautyPortraitDepth: 30 },
  },
  {
    id: 'beauty_blushing_doll',
    name: 'Blushing Doll',
    previewColor: '#fb7185',
    adjustments: { beautySmooth: 60, beautyRosy: 80, beautyGlow: 45, beautyBrighten: 40, beautySlim: 55, beautyEnlargeEye: 65, beautyPortraitDepth: 40 },
  },
  {
    id: 'beauty_soft_honey',
    name: 'Soft Honey',
    previewColor: '#fbbf24',
    adjustments: { beautySmooth: 55, beautyRosy: 45, beautyGlow: 65, beautyBrighten: 35, beautySlim: 35, beautyEnlargeEye: 40, beautyPortraitDepth: 35 },
  },
  {
    id: 'beauty_sunset_kiss',
    name: 'Sunset Kiss',
    previewColor: '#f97316',
    adjustments: { beautySmooth: 50, beautyRosy: 60, beautyGlow: 75, beautyBrighten: 40, beautySlim: 30, beautyEnlargeEye: 45, beautyPortraitDepth: 50 },
  },
  {
    id: 'vivid',
    name: 'Vivid',
    previewColor: '#38bdf8',
    adjustments: { saturation: 35, contrast: 15, brightness: 5 },
    cssFilter: 'saturate(1.35) contrast(1.15) brightness(1.05)',
  },
  {
    id: 'noir',
    name: 'B&W Noir',
    previewColor: '#a1a1aa',
    adjustments: { saturation: -100, contrast: 25, brightness: -5 },
    cssFilter: 'grayscale(1) contrast(1.25) brightness(0.95)',
  },
  {
    id: 'warm',
    name: 'Warm Sun',
    previewColor: '#f59e0b',
    adjustments: { warmth: 30, saturation: 15, brightness: 5 },
    cssFilter: 'sepia(0.2) saturate(1.2) hue-rotate(-8deg) brightness(1.05)',
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    previewColor: '#06b6d4',
    adjustments: { warmth: -10, contrast: 20, saturation: 20 },
    cssFilter: 'contrast(1.2) saturate(1.2) hue-rotate(-12deg)',
  },
  {
    id: 'vintage',
    name: '90s Film',
    previewColor: '#ea580c',
    adjustments: { warmth: 25, contrast: 15, saturation: -10, vignette: 30 },
    cssFilter: 'sepia(0.3) contrast(1.15) brightness(0.98) saturate(1.1)',
  },
  {
    id: 'fade',
    name: 'Matte Fade',
    previewColor: '#c084fc',
    adjustments: { contrast: -15, brightness: 10, saturation: -15 },
    cssFilter: 'contrast(0.9) brightness(1.1) saturate(0.85)',
  },
  {
    id: 'cool',
    name: 'Glacier',
    previewColor: '#67e8f9',
    adjustments: { warmth: -35, saturation: 5, brightness: 5 },
    cssFilter: 'saturate(1.05) hue-rotate(15deg) brightness(1.05) contrast(1.05)',
  },
];

/**
 * Build CSS filter string from ImageAdjustments including beauty tuning
 */
export function buildCssFilterString(adj: ImageAdjustments): string {
  // Beauty adjustments contribution
  const beautyBrighten = (adj.beautyBrighten / 100) * 16;
  const beautySmoothContrast = -(adj.beautySmooth / 100) * 12;
  const beautyRosySat = (adj.beautyRosy / 100) * 28 + (adj.beautyGlow / 100) * 10;
  const beautyRosySepia = (adj.beautyRosy / 100) * 0.12 + (adj.beautyGlow / 100) * 0.08;
  const beautyHue = -(adj.beautyRosy / 100) * 7;

  const brightnessVal = 1 + (adj.brightness + adj.exposure * 0.8 + beautyBrighten) / 100;
  const contrastVal = Math.max(0.2, 1 + (adj.contrast + beautySmoothContrast) / 100);
  const saturationVal = Math.max(0, 1 + (adj.saturation + beautyRosySat) / 100);

  let filterStr = `brightness(${brightnessVal.toFixed(2)}) contrast(${contrastVal.toFixed(2)}) saturate(${saturationVal.toFixed(2)})`;

  const totalSepia = (adj.warmth > 0 ? (adj.warmth / 100) * 0.45 : 0) + beautyRosySepia;
  if (totalSepia > 0.01) {
    filterStr += ` sepia(${Math.min(0.8, totalSepia).toFixed(2)})`;
  }

  const totalHue =
    (adj.warmth > 0 ? -(adj.warmth * 0.3) : Math.abs(adj.warmth) * 0.4) + beautyHue;
  if (Math.abs(totalHue) > 0.5) {
    filterStr += ` hue-rotate(${totalHue.toFixed(1)}deg)`;
  }

  // Base preset filter if selected
  const preset = FILTER_PRESETS.find((p) => p.id === adj.filterId);
  if (preset && preset.cssFilter) {
    filterStr += ` ${preset.cssFilter}`;
  }

  return filterStr;
}

/**
 * Render edited image to an HTML5 Canvas at full high-resolution
 */
export async function renderEditedImageToCanvas(
  imageSource: HTMLImageElement | ImageBitmap,
  adjustments: ImageAdjustments,
  targetCanvas?: HTMLCanvasElement
): Promise<HTMLCanvasElement> {
  const canvas = targetCanvas || document.createElement('canvas');

  const srcWidth =
    'naturalWidth' in imageSource && (imageSource as HTMLImageElement).naturalWidth
      ? (imageSource as HTMLImageElement).naturalWidth
      : imageSource.width;
  const srcHeight =
    'naturalHeight' in imageSource && (imageSource as HTMLImageElement).naturalHeight
      ? (imageSource as HTMLImageElement).naturalHeight
      : imageSource.height;

  if (!srcWidth || !srcHeight) {
    console.warn('renderEditedImageToCanvas: zero dimensions', srcWidth, srcHeight);
    return canvas;
  }

  // Determine crop dimensions
  let cropWidth = srcWidth;
  let cropHeight = srcHeight;
  let cropX = 0;
  let cropY = 0;

  if (adjustments.cropAspect !== 'original') {
    let targetRatio = 1;
    switch (adjustments.cropAspect) {
      case '1:1':
        targetRatio = 1;
        break;
      case '4:3':
        targetRatio = 4 / 3;
        break;
      case '16:9':
        targetRatio = 16 / 9;
        break;
      case '9:16':
        targetRatio = 9 / 16;
        break;
      case '3:2':
        targetRatio = 3 / 2;
        break;
    }

    const currentRatio = srcWidth / srcHeight;
    if (currentRatio > targetRatio) {
      cropWidth = Math.round(srcHeight * targetRatio);
      cropHeight = srcHeight;
      cropX = Math.round((srcWidth - cropWidth) / 2);
      cropY = 0;
    } else {
      cropWidth = srcWidth;
      cropHeight = Math.round(srcWidth / targetRatio);
      cropX = 0;
      cropY = Math.round((srcHeight - cropHeight) / 2);
    }
  }

  // Rotation determines canvas width and height
  const isRotated90or270 = adjustments.rotation === 90 || adjustments.rotation === 270;
  canvas.width = isRotated90or270 ? cropHeight : cropWidth;
  canvas.height = isRotated90or270 ? cropWidth : cropHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.save();

  // Apply CSS color filters to rendering context
  ctx.filter = buildCssFilterString(adjustments);

  // Position transform center
  ctx.translate(canvas.width / 2, canvas.height / 2);

  // Rotate
  if (adjustments.rotation !== 0) {
    ctx.rotate((adjustments.rotation * Math.PI) / 180);
  }

  // Flip horizontal / vertical
  const scaleX = adjustments.flipH ? -1 : 1;
  const scaleY = adjustments.flipV ? -1 : 1;
  ctx.scale(scaleX, scaleY);

  // Draw cropped slice
  ctx.drawImage(
    imageSource,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    -cropWidth / 2,
    -cropHeight / 2,
    cropWidth,
    cropHeight
  );

  ctx.restore();

  // Apply full Snapchat multi-pass beauty engine (skin smoothing, angel bloom, blush, clarity)
  if (
    adjustments.beautySmooth > 0 ||
    adjustments.beautyRosy > 0 ||
    adjustments.beautyGlow > 0 ||
    adjustments.beautyBrighten > 0 ||
    adjustments.beautySlim > 0 ||
    adjustments.beautyEnlargeEye > 0 ||
    adjustments.beautyPortraitDepth > 0
  ) {
    applySnapchatBeautyToCanvas(canvas, {
      enabled: true,
      preset: (adjustments.beautyPreset as any) || 'custom',
      smoothLevel: adjustments.beautySmooth,
      rosyLevel: adjustments.beautyRosy,
      glowLevel: adjustments.beautyGlow,
      brightenLevel: adjustments.beautyBrighten,
      slimLevel: adjustments.beautySlim,
      enlargeEyeLevel: adjustments.beautyEnlargeEye,
      portraitDepthLevel: adjustments.beautyPortraitDepth,
    });
  }

  // Apply Vignette effect if requested
  if (adjustments.vignette > 0) {
    ctx.save();
    const radius = Math.max(canvas.width, canvas.height) * 0.75;
    const vignetteGrad = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      radius * 0.3,
      canvas.width / 2,
      canvas.height / 2,
      radius
    );
    const opacity = (adjustments.vignette / 100) * 0.85;
    vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignetteGrad.addColorStop(0.65, `rgba(0, 0, 0, ${opacity * 0.3})`);
    vignetteGrad.addColorStop(1, `rgba(0, 0, 0, ${opacity})`);

    ctx.fillStyle = vignetteGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  return canvas;
}
