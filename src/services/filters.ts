export interface CameraFilter {
  id: string;
  name: string;
  cssFilter: string;
  category: 'natural' | 'artistic' | 'retro' | 'mood';
}

export const CAMERA_FILTERS: CameraFilter[] = [
  {
    id: 'none',
    name: 'Original',
    cssFilter: 'none',
    category: 'natural',
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
