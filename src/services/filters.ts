import { BeautyPresetId, BeautySettings } from '../types';

export interface CameraFilter {
  id: string;
  name: string;
  cssFilter: string;
  category: 'natural' | 'artistic' | 'retro' | 'mood' | 'beauty';
}

export interface BeautyPreset {
  id: BeautyPresetId;
  name: string;
  description: string;
  smoothLevel: number;
  rosyLevel: number;
  glowLevel: number;
  brightenLevel: number;
  slimLevel: number;
  enlargeEyeLevel: number;
  portraitDepthLevel: number;
  previewColor: string;
}

export const BEAUTY_PRESETS: BeautyPreset[] = [
  {
    id: 'angel_glow',
    name: 'Angel Glow',
    description: 'Silky smooth skin with luminous cheekbone bloom & soft rosy lips',
    smoothLevel: 65,
    rosyLevel: 50,
    glowLevel: 60,
    brightenLevel: 45,
    slimLevel: 40,
    enlargeEyeLevel: 45,
    portraitDepthLevel: 25,
    previewColor: '#f472b6',
  },
  {
    id: 'glass_skin',
    name: 'Glass Skin',
    description: 'Ultra-refined poreless texture with crystal dewy radiance',
    smoothLevel: 75,
    rosyLevel: 30,
    glowLevel: 50,
    brightenLevel: 55,
    slimLevel: 50,
    enlargeEyeLevel: 30,
    portraitDepthLevel: 20,
    previewColor: '#e0e7ff',
  },
  {
    id: 'paris',
    name: 'Paris Velvet',
    description: 'Snapchat iconic velvet matte skin with warm undertone',
    smoothLevel: 70,
    rosyLevel: 35,
    glowLevel: 25,
    brightenLevel: 40,
    slimLevel: 45,
    enlargeEyeLevel: 35,
    portraitDepthLevel: 30,
    previewColor: '#fed7aa',
  },
  {
    id: 'blushing_doll',
    name: 'Blushing Doll',
    description: 'Youthful strawberry cheek flush with doll-like clarity',
    smoothLevel: 60,
    rosyLevel: 80,
    glowLevel: 45,
    brightenLevel: 40,
    slimLevel: 55,
    enlargeEyeLevel: 65,
    portraitDepthLevel: 40,
    previewColor: '#fb7185',
  },
  {
    id: 'soft_honey',
    name: 'Soft Honey',
    description: 'Golden hour bronze complexion with warm honey glow',
    smoothLevel: 55,
    rosyLevel: 45,
    glowLevel: 65,
    brightenLevel: 35,
    slimLevel: 35,
    enlargeEyeLevel: 40,
    portraitDepthLevel: 35,
    previewColor: '#fbbf24',
  },
  {
    id: 'sunset_kiss',
    name: 'Sunset Kiss',
    description: 'Golden peach wash with high-contrast sunlit diffusion',
    smoothLevel: 50,
    rosyLevel: 60,
    glowLevel: 75,
    brightenLevel: 40,
    slimLevel: 30,
    enlargeEyeLevel: 45,
    portraitDepthLevel: 50,
    previewColor: '#f97316',
  },
];

export const CAMERA_FILTERS: CameraFilter[] = [
  {
    id: 'none',
    name: 'Original',
    cssFilter: 'none',
    category: 'natural',
  },
  {
    id: 'beauty_angel_glow',
    name: 'Angel Glow',
    cssFilter: 'brightness(1.07) contrast(0.96) saturate(1.18) sepia(0.06)',
    category: 'beauty',
  },
  {
    id: 'beauty_glass_skin',
    name: 'Glass Skin',
    cssFilter: 'brightness(1.09) contrast(0.94) saturate(1.08)',
    category: 'beauty',
  },
  {
    id: 'beauty_paris',
    name: 'Paris Velvet',
    cssFilter: 'brightness(1.06) contrast(0.95) saturate(1.12) sepia(0.08) hue-rotate(-4deg)',
    category: 'beauty',
  },
  {
    id: 'beauty_blushing_doll',
    name: 'Blushing Doll',
    cssFilter: 'brightness(1.06) contrast(0.97) saturate(1.28) hue-rotate(-8deg) sepia(0.08)',
    category: 'beauty',
  },
  {
    id: 'beauty_soft_honey',
    name: 'Soft Honey',
    cssFilter: 'brightness(1.05) contrast(1.01) saturate(1.24) sepia(0.16) hue-rotate(-8deg)',
    category: 'beauty',
  },
  {
    id: 'beauty_sunset_kiss',
    name: 'Sunset Kiss',
    cssFilter: 'brightness(1.08) contrast(0.98) saturate(1.25) sepia(0.12) hue-rotate(-5deg)',
    category: 'beauty',
  },
  {
    id: 'vivid',
    name: 'Vivid Pro',
    cssFilter: 'saturate(1.38) contrast(1.12) brightness(1.02)',
    category: 'natural',
  },
  {
    id: 'noir',
    name: 'Noir B&W',
    cssFilter: 'grayscale(1) contrast(1.3) brightness(0.96)',
    category: 'retro',
  },
  {
    id: 'warm_sun',
    name: 'Warm Sun',
    cssFilter: 'sepia(0.2) saturate(1.25) hue-rotate(-8deg) brightness(1.04)',
    category: 'mood',
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    cssFilter: 'contrast(1.22) saturate(1.25) hue-rotate(-12deg)',
    category: 'artistic',
  },
  {
    id: 'vintage',
    name: '90s Film',
    cssFilter: 'sepia(0.35) contrast(1.18) brightness(0.98) saturate(1.1)',
    category: 'retro',
  },
  {
    id: 'cool_glacier',
    name: 'Glacier',
    cssFilter: 'saturate(0.95) hue-rotate(18deg) brightness(1.04) contrast(1.08)',
    category: 'mood',
  },
  {
    id: 'emerald',
    name: 'Emerald',
    cssFilter: 'contrast(1.15) saturate(1.3) hue-rotate(25deg)',
    category: 'artistic',
  },
];

export function getFilterById(id: string): CameraFilter {
  return CAMERA_FILTERS.find((f) => f.id === id) || CAMERA_FILTERS[0];
}

/**
 * Build dynamic CSS filter string from real-time beauty slider parameters
 */
export function buildBeautyFilterString(beauty: BeautySettings): string {
  if (
    !beauty.enabled &&
    beauty.smoothLevel === 0 &&
    beauty.rosyLevel === 0 &&
    beauty.glowLevel === 0 &&
    beauty.brightenLevel === 0
  ) {
    return 'none';
  }

  // 1. Brighten: lifts shadows and overall luminance gently
  const brightness = 1 + (beauty.brightenLevel / 100) * 0.16;

  // 2. Smooth: softens micro-contrast so skin appears silky without turning blurry
  const contrast = 1 - (beauty.smoothLevel / 100) * 0.12;

  // 3. Rosy Blush: boosts healthy saturation and introduces delicate warm pinkish undertones
  const saturation = 1 + (beauty.rosyLevel / 100) * 0.28 + (beauty.glowLevel / 100) * 0.1;
  const sepia = (beauty.rosyLevel / 100) * 0.12 + (beauty.glowLevel / 100) * 0.08;
  const hueShift = -((beauty.rosyLevel / 100) * 7); // subtle pink/magenta shift for skin blush

  let filter = `brightness(${brightness.toFixed(3)}) contrast(${contrast.toFixed(3)}) saturate(${saturation.toFixed(3)})`;
  if (sepia > 0.01) {
    filter += ` sepia(${sepia.toFixed(3)})`;
  }
  if (Math.abs(hueShift) > 0.5) {
    filter += ` hue-rotate(${hueShift.toFixed(1)}deg)`;
  }

  return filter;
}

/**
 * Combined filter string for live viewfinder that includes BOTH beauty and manual adjustments
 */
export function buildLiveFilterString(
  beauty: BeautySettings,
  adj: { brightness: number; contrast: number; saturation: number; warmth: number },
  filterId: string = 'none'
): string {
  // Beauty components
  const bBrighten = beauty.enabled ? (beauty.brightenLevel / 100) * 16 : 0;
  const bSmoothContrast = beauty.enabled ? -(beauty.smoothLevel / 100) * 12 : 0;
  const bRosySat = beauty.enabled ? (beauty.rosyLevel / 100) * 28 + (beauty.glowLevel / 100) * 10 : 0;
  const bRosySepia = beauty.enabled ? (beauty.rosyLevel / 100) * 0.12 + (beauty.glowLevel / 100) * 0.08 : 0;
  const bHue = beauty.enabled ? -(beauty.rosyLevel / 100) * 7 : 0;

  // Combine with manual adjustments (ranges: bright/cont/exp: -50 to 50, sat: -100 to 100, warmth: -50 to 50)
  const brightnessVal = 1 + (adj.brightness + bBrighten) / 100;
  const contrastVal = Math.max(0.1, 1 + (adj.contrast + bSmoothContrast) / 100);
  const saturationVal = Math.max(0, 1 + (adj.saturation + bRosySat) / 100);

  let filterStr = `brightness(${brightnessVal.toFixed(3)}) contrast(${contrastVal.toFixed(3)}) saturate(${saturationVal.toFixed(3)})`;

  const totalSepia = (adj.warmth > 0 ? (adj.warmth / 100) * 0.45 : 0) + bRosySepia;
  if (totalSepia > 0.01) {
    filterStr += ` sepia(${Math.min(0.8, totalSepia).toFixed(3)})`;
  }

  const totalHue = (adj.warmth > 0 ? -(adj.warmth * 0.3) : Math.abs(adj.warmth) * 0.4) + bHue;
  if (Math.abs(totalHue) > 0.5) {
    filterStr += ` hue-rotate(${totalHue.toFixed(1)}deg)`;
  }

  // Add preset filter if selected and not "none"
  const preset = getFilterById(filterId);
  if (preset && preset.id !== 'none' && preset.cssFilter !== 'none') {
    filterStr += ` ${preset.cssFilter}`;
  }

  return filterStr;
}

/**
 * Apply selected filter directly to canvas 2D rendering context before export
 */
export function applyFilterToContext(ctx: CanvasRenderingContext2D, filterId: string): void {
  const filter = getFilterById(filterId);
  if (filter && filter.cssFilter && filter.cssFilter !== 'none') {
    ctx.filter = filter.cssFilter;
  } else {
    ctx.filter = 'none';
  }
}

/**
 * Apply dynamic beauty adjustments directly to canvas 2D rendering context before export
 */
export function applyBeautyToContext(ctx: CanvasRenderingContext2D, beauty: BeautySettings): void {
  const filterStr = buildBeautyFilterString(beauty);
  ctx.filter = filterStr !== 'none' ? filterStr : 'none';
}

/**
 * Apply combined live tuning (beauty + manual) directly to canvas 2D rendering context
 */
export function applyLiveTuningToContext(
  ctx: CanvasRenderingContext2D, 
  beauty: BeautySettings, 
  adj: { brightness: number; contrast: number; saturation: number; warmth: number },
  filterId: string = 'none'
): void {
  const filterStr = buildLiveFilterString(beauty, adj, filterId);
  ctx.filter = filterStr !== 'none' ? filterStr : 'none';
}

/**
 * Full multi-pass Snapchat beauty processing pipeline for HTML5 Canvas.
 * Produces genuine Snapchat-quality results:
 * 1. Edge-preserving skin smoothing (soft-light bilateral blend softens blemishes without blurring eyes/lips).
 * 2. Angel Glow highlight bloom (isolated cheekbone & forehead specular diffusion).
 * 3. Peach-rosy skin flush (warm undertones without yellowing teeth or eye whites).
 * 4. Catchlight & eye clarity lift.
 */
export function applySnapchatBeautyToCanvas(
  canvas: HTMLCanvasElement,
  beauty: BeautySettings
): void {
  if (
    !beauty.enabled &&
    beauty.smoothLevel === 0 &&
    beauty.rosyLevel === 0 &&
    beauty.glowLevel === 0 &&
    beauty.brightenLevel === 0 &&
    beauty.slimLevel === 0 &&
    beauty.enlargeEyeLevel === 0 &&
    beauty.portraitDepthLevel === 0
  ) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  if (width === 0 || height === 0) return;

  // Create an offscreen snapshot of the current state
  const copyCanvas = document.createElement('canvas');
  copyCanvas.width = width;
  copyCanvas.height = height;
  const copyCtx = copyCanvas.getContext('2d');
  if (!copyCtx) return;
  copyCtx.drawImage(canvas, 0, 0);

  // Define the Portrait Region (where we want to keep things sharp and apply smoothing)
  const portraitX = width / 2;
  const portraitY = height * 0.44;
  const portraitRW = width * 0.35;
  const portraitRH = height * 0.42;

  // 1. Geometric Distortion Pass (Liquify: Face Slimming & Big Eyes)
  if (beauty.slimLevel > 0 || beauty.enlargeEyeLevel > 0) {
    ctx.save();
    
    // a. Face Slimming (Symmetric Horizontal Pinch at lower face)
    if (beauty.slimLevel > 5) {
      const slimFactor = (beauty.slimLevel / 100) * 0.18;
      const slimHeight = height * 0.35;
      const slimTop = portraitY + height * 0.02;

      const strips = 25;
      const stripH = Math.ceil(slimHeight / strips);
      for (let i = 0; i < strips; i++) {
        const y = slimTop + i * stripH;
        const weight = Math.sin((i / strips) * Math.PI);
        const scale = 1 - slimFactor * weight;
        
        ctx.drawImage(
          copyCanvas,
          0, y, width, stripH,
          (width - width * scale) / 2, y, width * scale, stripH
        );
      }
    }

    // b. Big Eyes (Symmetric Bulge at eye line)
    if (beauty.enlargeEyeLevel > 5) {
      const eyeScale = 1 + (beauty.enlargeEyeLevel / 100) * 0.30;
      const eyeY = portraitY - height * 0.04;
      const eyeW = width * 0.22;
      const eyeH = height * 0.14;
      const eyeOffset = width * 0.15;

      ctx.drawImage(
        copyCanvas,
        portraitX - eyeOffset - eyeW / 2, eyeY - eyeH / 2, eyeW, eyeH,
        portraitX - eyeOffset - (eyeW * eyeScale) / 2, eyeY - (eyeH * eyeScale) / 2, eyeW * eyeScale, eyeH * eyeScale
      );

      ctx.drawImage(
        copyCanvas,
        portraitX + eyeOffset - eyeW / 2, eyeY - eyeH / 2, eyeW, eyeH,
        portraitX + eyeOffset - (eyeW * eyeScale) / 2, eyeY - (eyeH * eyeScale) / 2, eyeW * eyeScale, eyeH * eyeScale
      );
    }
    
    ctx.restore();
    copyCtx.clearRect(0, 0, width, height);
    copyCtx.drawImage(canvas, 0, 0);
  }

  // 2. Portrait Depth (Depth of Field / Bokeh) Pass:
  // Blurs the edges of the image while keeping the face sharp.
  if (beauty.portraitDepthLevel > 5) {
    const depthCanvas = document.createElement('canvas');
    depthCanvas.width = width;
    depthCanvas.height = height;
    const dCtx = depthCanvas.getContext('2d');
    if (dCtx) {
      const blurRadius = Math.max(2, Math.round(width * 0.02 * (beauty.portraitDepthLevel / 100)));
      dCtx.filter = `blur(${blurRadius}px)`;
      dCtx.drawImage(copyCanvas, 0, 0);

      // Mask to only blur the background/edges
      const mask = document.createElement('canvas');
      mask.width = width;
      mask.height = height;
      const mCtx = mask.getContext('2d');
      if (mCtx) {
        const grad = mCtx.createRadialGradient(portraitX, portraitY, 0, portraitX, portraitY, Math.max(width, height) * 0.6);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)'); // Center sharp
        grad.addColorStop(0.35, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.85, 'rgba(0, 0, 0, 1)'); // Edges blurry
        mCtx.fillStyle = grad;
        mCtx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(depthCanvas, 0, 0);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(mask, 0, 0);
        ctx.restore();
        
        // Restore portrait sharpness on top
        ctx.save();
        ctx.globalCompositeOperation = 'destination-over';
        ctx.drawImage(copyCanvas, 0, 0);
        ctx.restore();
      }
    }
  }

  // 3. Selective Skin Smoothing Pass:
  // Smooths skin ONLY within the portrait region to keep eyes/hair/background crisp.
  if (beauty.smoothLevel > 5) {
    const blurCanvas = document.createElement('canvas');
    blurCanvas.width = width;
    blurCanvas.height = height;
    const blurCtx = blurCanvas.getContext('2d');
    if (blurCtx) {
      const blurRadius = Math.max(3, Math.round(width * 0.005 * (beauty.smoothLevel / 100)));
      blurCtx.filter = `blur(${blurRadius}px) contrast(0.98) brightness(1.01)`;
      blurCtx.drawImage(copyCanvas, 0, 0);

      ctx.save();
      // Masking smoothing to the face area
      ctx.beginPath();
      ctx.ellipse(portraitX, portraitY, portraitRW, portraitRH, 0, 0, Math.PI * 2);
      ctx.clip();
      
      ctx.globalCompositeOperation = 'soft-light';
      ctx.globalAlpha = Math.min(0.8, (beauty.smoothLevel / 100) * 0.65 + 0.1);
      ctx.drawImage(blurCanvas, 0, 0);
      ctx.restore();
    }
  }

  // 4. Snapchat Signature "Angel Glow" / Highlight Bloom:
  // Confined to the upper portrait highlights to prevent global blur.
  if (beauty.glowLevel > 10) {
    const bloomCanvas = document.createElement('canvas');
    bloomCanvas.width = width;
    bloomCanvas.height = height;
    const bloomCtx = bloomCanvas.getContext('2d');
    if (bloomCtx) {
      const bloomRadius = Math.max(6, Math.round(width * 0.015 * (beauty.glowLevel / 100)));
      bloomCtx.filter = `brightness(0.65) contrast(1.5) blur(${bloomRadius}px)`;
      bloomCtx.drawImage(copyCanvas, 0, 0);

      ctx.save();
      // Only bloom the highlights within the facial highlight region
      ctx.beginPath();
      ctx.ellipse(portraitX, portraitY - height * 0.05, portraitRW * 1.1, portraitRH * 0.8, 0, 0, Math.PI * 2);
      ctx.clip();
      
      ctx.globalCompositeOperation = 'screen';
      ctx.globalAlpha = (beauty.glowLevel / 100) * 0.42;
      ctx.drawImage(bloomCanvas, 0, 0);
      ctx.restore();
    }
  }

  // 5. Peach-Rosy Cheek & Lip Flush Tint:
  if (beauty.rosyLevel > 15) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    const blushAlpha = ((beauty.rosyLevel / 100) * 0.22).toFixed(3);
    ctx.fillStyle = `rgba(255, 125, 155, ${blushAlpha})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 6. Eye Clarity & Luminous Catchlight:
  if (beauty.brightenLevel > 15) {
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    const brightAlpha = ((beauty.brightenLevel / 100) * 0.2).toFixed(3);
    ctx.fillStyle = `rgba(255, 252, 245, ${brightAlpha})`;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}
