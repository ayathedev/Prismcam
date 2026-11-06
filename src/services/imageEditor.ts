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
 * Build CSS filter string from ImageAdjustments
 */
export function buildCssFilterString(adj: ImageAdjustments): string {
  const brightnessVal = 1 + (adj.brightness + adj.exposure * 0.8) / 100;
  const contrastVal = 1 + adj.contrast / 100;
  const saturationVal = Math.max(0, 1 + adj.saturation / 100);

  let filterStr = `brightness(${brightnessVal.toFixed(2)}) contrast(${contrastVal.toFixed(2)}) saturate(${saturationVal.toFixed(2)})`;

  if (adj.warmth !== 0) {
    if (adj.warmth > 0) {
      // Warm: sepia + negative hue-rotate
      const sepiaAmount = (adj.warmth / 100) * 0.45;
      filterStr += ` sepia(${sepiaAmount.toFixed(2)}) hue-rotate(-${(adj.warmth * 0.3).toFixed(1)}deg)`;
    } else {
      // Cool: hue rotate towards cyan/blue
      const hueShift = Math.abs(adj.warmth) * 0.4;
      filterStr += ` hue-rotate(${hueShift.toFixed(1)}deg)`;
    }
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
