import React, { useRef, useMemo, useState } from 'react';
import { AspectRatio, BeautySettings, GridType } from '../types';
import { getFilterById, buildLiveFilterString } from '../services/filters';
import { Eye } from 'lucide-react';

interface ViewfinderProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  aspectRatio: AspectRatio;
  gridType: GridType;
  filterId: string;
  beauty?: BeautySettings;
  brightness: number;
  contrast: number;
  saturation: number;
  warmth: number;
  vignette: number;
  isBeautyActive?: boolean;
  isShutterActive: boolean;
  screenFlash: boolean;
  countdown: number | null;
  focusPoint: { x: number; y: number } | null;
  facingMode: 'user' | 'environment';
  mirrorFront: boolean;
  onTapToFocus: (x: number, y: number) => void;
  onPinchZoom: (delta: number) => void;
}

export const Viewfinder: React.FC<ViewfinderProps> = ({
  videoRef,
  aspectRatio,
  gridType,
  filterId,
  beauty,
  brightness,
  contrast,
  saturation,
  warmth,
  vignette,
  isBeautyActive,
  isShutterActive,
  screenFlash,
  countdown,
  focusPoint,
  facingMode,
  mirrorFront,
  onTapToFocus,
  onPinchZoom,
}) => {
  const [isComparing, setIsComparing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartDistRef = useRef<number | null>(null);

  const activeFilter = getFilterById(filterId);

  // Generate dynamic SVG displacement map for live geometric warp (Slimming & Big Eyes)
  // This map uses the Red channel for X-displacement and Green for Y-displacement.
  // 128 (middle grey) is 0 displacement.
  const faceWarpMapUrl = useMemo(() => {
    if (!beauty || (beauty.slimLevel < 5 && beauty.enlargeEyeLevel < 5)) return null;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return null;

    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    // Fill with neutral 128,128,0 (no displacement)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 128;     // Red (X)
      data[i + 1] = 128; // Green (Y)
      data[i + 2] = 0;   // Blue (unused)
      data[i + 3] = 255; // Alpha
    }

    const slimAmount = (beauty.slimLevel / 100) * 55; // max 55 units shift
    const eyeAmount = (beauty.enlargeEyeLevel / 100) * 45; // max 45 units shift

    // a. Face Slimming Map (Red channel)
    if (beauty.slimLevel > 5) {
      const slimY = 72; // lower face center (approx 56% down)
      const slimH = 38; // coverage
      for (let y = 0; y < size; y++) {
        if (y < slimY - slimH || y > slimY + slimH) continue;
        const yWeight = Math.cos(((y - slimY) / slimH) * (Math.PI / 2));
        for (let x = 0; x < size; x++) {
          const xWeight = Math.sin((x / size) * Math.PI);
          const shift = slimAmount * yWeight * xWeight;
          const idx = (y * size + x) * 4;
          // Left side shifts right (R > 128), Right side shifts left (R < 128)
          if (x < size / 2) {
            data[idx] = Math.min(255, Math.max(0, 128 + shift));
          } else {
            data[idx] = Math.min(255, Math.max(0, 128 - shift));
          }
        }
      }
    }

    // b. Big Eyes Map (Red/Green channels for radial bulge)
    if (beauty.enlargeEyeLevel > 5) {
      const eyesY = 54; // eye line (approx 42% down)
      const eyeL_X = 46;
      const eyeR_X = 82;
      const eyeRadius = 20;

      const applyEye = (ex: number, ey: number) => {
        const startY = Math.max(0, ey - eyeRadius);
        const endY = Math.min(size, ey + eyeRadius);
        const startX = Math.max(0, ex - eyeRadius);
        const endX = Math.min(size, ex + eyeRadius);

        for (let y = startY; y < endY; y++) {
          for (let x = startX; x < endX; x++) {
            const dx = x - ex;
            const dy = y - ey;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < eyeRadius) {
              const weight = Math.cos((dist / eyeRadius) * (Math.PI / 2));
              const idx = (y * size + x) * 4;
              // Radial bulge: shift pixels AWAY from eye center
              // (Red controls X shift, Green controls Y shift)
              data[idx] = Math.min(255, Math.max(0, data[idx] - (dx / eyeRadius) * eyeAmount * weight));
              data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] - (dy / eyeRadius) * eyeAmount * weight));
            }
          }
        }
      };
      applyEye(eyeL_X, eyesY);
      applyEye(eyeR_X, eyesY);
    }

    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
  }, [beauty?.slimLevel, beauty?.enlargeEyeLevel]);

  // Compute active CSS filter for live viewfinder (combined beauty + manual tune)
  const effectiveFilter =
    (isBeautyActive || (beauty && beauty.enabled) || brightness !== 0 || contrast !== 0 || saturation !== 0 || warmth !== 0 || filterId !== 'none') && !isComparing
      ? beauty
        ? `${buildLiveFilterString(beauty, { brightness, contrast, saturation, warmth }, filterId)} url(#snapchat-beauty-svg)`
        : activeFilter.cssFilter
      : isComparing ? 'none' : activeFilter.cssFilter;

  // Handle tap on viewfinder
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    onTapToFocus(x, y);
  };

  // Handle pinch to zoom touch events
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartDistRef.current = Math.hypot(dx, dy);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStartDistRef.current !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      const delta = (dist - touchStartDistRef.current) / 150;
      touchStartDistRef.current = dist;
      onPinchZoom(delta);
    }
  };

  const handleTouchEnd = () => {
    touchStartDistRef.current = null;
  };

  // Determine aspect ratio class
  let aspectStyle: React.CSSProperties = { width: '100%', height: '100%' };
  if (aspectRatio === '4:3') {
    aspectStyle = { aspectRatio: '3/4', maxHeight: '100%', maxWidth: '100%' };
  } else if (aspectRatio === '16:9') {
    aspectStyle = { aspectRatio: '9/16', maxHeight: '100%', maxWidth: '100%' };
  } else if (aspectRatio === '1:1') {
    aspectStyle = { aspectRatio: '1/1', maxHeight: '100%', maxWidth: '100%' };
  }

  const isMirrored = facingMode === 'user' && mirrorFront;

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden bg-black select-none"
    >
      {/* Video Container with Aspect Ratio framing */}
      <div
        style={aspectStyle}
        className="relative w-full h-full overflow-hidden flex items-center justify-center bg-neutral-950 transition-all duration-300"
      >
        <div 
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{
            filter: effectiveFilter,
          }}
          onMouseDown={() => (isBeautyActive || beauty?.enabled) && setIsComparing(true)}
          onMouseUp={() => setIsComparing(false)}
          onMouseLeave={() => setIsComparing(false)}
          onTouchStart={() => (isBeautyActive || beauty?.enabled) && setIsComparing(true)}
          onTouchEnd={() => setIsComparing(false)}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover pointer-events-none transition-all duration-300 ${
              isMirrored ? '-scale-x-100' : ''
            }`}
          />
        </div>

        {/* Floating Compare Button (Live Camera) */}
        {(isBeautyActive || beauty?.enabled) && (
          <div className="absolute top-4 right-4 z-40">
            <div
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 backdrop-blur-md border transition-all duration-200 ${
                isComparing 
                  ? 'bg-amber-400 text-black border-amber-300 shadow-lg scale-110' 
                  : 'bg-black/60 text-white border-white/20'
              }`}
            >
              <Eye className={`w-3 h-3 ${isComparing ? 'animate-pulse' : ''}`} />
              <span>{isComparing ? 'ORIGINAL' : 'COMPARE'}</span>
            </div>
          </div>
        )}

        {/* Live Snapchat "Angel Glow" Specular Highlight Bloom Overlay */}
        {/* Optimized: No longer uses backdrop-blur on whole screen to prevent "terrible blurry" issue */}
        {(isBeautyActive || (beauty && beauty.enabled)) && !isComparing && beauty && beauty.glowLevel > 15 && (
          <div
            className="absolute inset-0 pointer-events-none mix-blend-screen transition-opacity duration-300"
            style={{
              background:
                'radial-gradient(circle at 50% 40%, rgba(255, 230, 242, 0.2) 0%, rgba(255, 240, 230, 0.1) 40%, rgba(0, 0, 0, 0) 70%)',
              opacity: Math.min(0.8, (beauty.glowLevel / 100) * 0.6),
            }}
          />
        )}

        {/* Live Portrait Depth (Depth of Field / Bokeh) Overlay */}
        {/* Only blurs the background/edges using a radial mask, keeping the face sharp */}
        {(isBeautyActive || (beauty && beauty.enabled)) && !isComparing && beauty && beauty.portraitDepthLevel > 10 && (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              backdropFilter: `blur(${Math.max(1.5, ((beauty.portraitDepthLevel / 100) * 8)).toFixed(1)}px)`,
              WebkitMaskImage: 'radial-gradient(circle at 50% 44%, transparent 0%, transparent 35%, black 85%)',
              maskImage: 'radial-gradient(circle at 50% 44%, transparent 0%, transparent 35%, black 85%)',
              opacity: (beauty.portraitDepthLevel / 100) * 0.9,
            }}
          />
        )}

        {/* Live Peach & Rosy Skin Tone Blush Overlay */}
        {(isBeautyActive || (beauty && beauty.enabled)) && !isComparing && beauty && beauty.rosyLevel > 20 && (
          <div
            className="absolute inset-0 pointer-events-none mix-blend-soft-light transition-opacity duration-300"
            style={{
              backgroundColor: 'rgba(255, 125, 160, 0.12)',
              opacity: (beauty.rosyLevel / 100) * 0.6,
            }}
          />
        )}

        {/* Live Vignette Overlay */}
        {vignette > 0 && !isComparing && (
          <div 
            className="absolute inset-0 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle, transparent 40%, rgba(0,0,0,${(vignette / 100) * 0.8}) 100%)`,
            }}
          />
        )}

        {/* Grid Overlays */}
        {gridType === 'rule_of_thirds' && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 border border-white/20">
            <div className="border-r border-b border-white/20"></div>
            <div className="border-r border-b border-white/20"></div>
            <div className="border-b border-white/20"></div>
            <div className="border-r border-b border-white/20"></div>
            <div className="border-r border-b border-white/20"></div>
            <div className="border-b border-white/20"></div>
            <div className="border-r border-white/20"></div>
            <div className="border-r border-white/20"></div>
            <div></div>
          </div>
        )}

        {gridType === 'golden_ratio' && (
          <div className="absolute inset-0 pointer-events-none border border-white/20">
            <div className="absolute top-[38.2%] left-0 right-0 h-[1px] bg-white/25"></div>
            <div className="absolute top-[61.8%] left-0 right-0 h-[1px] bg-white/25"></div>
            <div className="absolute left-[38.2%] top-0 bottom-0 w-[1px] bg-white/25"></div>
            <div className="absolute left-[61.8%] top-0 bottom-0 w-[1px] bg-white/25"></div>
          </div>
        )}

        {gridType === 'square' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-full aspect-square border border-dashed border-white/40"></div>
          </div>
        )}

        {/* Tap to Focus Box Indicator */}
        {focusPoint && (
          <div
            style={{
              left: `${focusPoint.x}px`,
              top: `${focusPoint.y}px`,
            }}
            className="absolute pointer-events-none w-16 h-16 -translate-x-1/2 -translate-y-1/2 border-2 border-amber-400 rounded-lg animate-focus-ring flex items-center justify-center"
          >
            <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-amber-400" />
            <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-amber-400" />
            <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-amber-400" />
            <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-amber-400" />
          </div>
        )}

        {/* Timer Countdown Big Overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
            <span className="text-8xl font-black text-amber-400 tracking-tighter drop-shadow-2xl animate-pulse scale-125">
              {countdown}
            </span>
          </div>
        )}

        {/* Shutter flash animation effect */}
        {isShutterActive && (
          <div className="absolute inset-0 bg-white animate-shutter pointer-events-none z-20" />
        )}

        {/* Screen flash for selfie / low-light */}
        {screenFlash && (
          <div className="absolute inset-0 bg-amber-50 pointer-events-none z-30 transition-opacity duration-150" />
        )}
      </div>

      {/* SVG Filter Definition - Moved outside layout container to prevent flex-shift quirks */}
      <svg
        className="absolute inset-0 pointer-events-none opacity-0 invisible"
        width="0"
        height="0"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
      >
        <defs>
          <filter id="snapchat-beauty-svg" x="0" y="0" width="100%" height="100%" filterUnits="objectBoundingBox">
            {/* Displacement Map for Geometric Warp (Face Slimming & Big Eyes) */}
            {faceWarpMapUrl && (
              <>
                <feImage href={faceWarpMapUrl} x="0" y="0" width="100%" height="100%" result="map" preserveAspectRatio="none" />
                <feDisplacementMap 
                  in="SourceGraphic" 
                  in2="map" 
                  scale="0.12" 
                  xChannelSelector="R" 
                  yChannelSelector="G" 
                  result="warped"
                />
              </>
            )}
            
            {/* Blur pass for edge-preserving skin smoothing */}
            <feGaussianBlur
              in={faceWarpMapUrl ? 'warped' : 'SourceGraphic'}
              stdDeviation={beauty ? Math.max(0.4, (beauty.smoothLevel / 100) * 1.1).toFixed(2) : '0.6'}
              result="skinBlur"
            />
            {/* Blend blurred copy with original using soft-light: softens blemishes while keeping pupils, lashes, and hair sharp */}
            <feBlend in={faceWarpMapUrl ? 'warped' : 'SourceGraphic'} in2="skinBlur" mode="soft-light" result="skinSmoothed" />
            
            {/* Highlight bloom pass: isolate upper luminance and bloom in screen mode */}
            <feComponentTransfer in="skinSmoothed" result="highlights">
              <feFuncR type="linear" slope="1.4" intercept="-0.25" />
              <feFuncG type="linear" slope="1.4" intercept="-0.25" />
              <feFuncB type="linear" slope="1.4" intercept="-0.25" />
            </feComponentTransfer>
            <feGaussianBlur
              in="highlights"
              stdDeviation={beauty ? Math.max(0.8, (beauty.glowLevel / 100) * 2.5).toFixed(2) : '1.2'}
              result="bloomGlow"
            />
            <feBlend in="skinSmoothed" in2="bloomGlow" mode="screen" result="finalBeauty" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};
