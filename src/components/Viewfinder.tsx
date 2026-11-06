import React, { useRef } from 'react';
import { AspectRatio, GridType } from '../types';
import { getFilterById } from '../services/filters';

interface ViewfinderProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  aspectRatio: AspectRatio;
  gridType: GridType;
  filterId: string;
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
  isShutterActive,
  screenFlash,
  countdown,
  focusPoint,
  facingMode,
  mirrorFront,
  onTapToFocus,
  onPinchZoom,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const touchStartDistRef = useRef<number | null>(null);

  const activeFilter = getFilterById(filterId);

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
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover pointer-events-none transition-transform duration-200 ${
            isMirrored ? '-scale-x-100' : ''
          }`}
          style={{
            filter: activeFilter.cssFilter,
          }}
        />

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
            {/* Golden ratio horizontal and vertical lines */}
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
            {/* Corner brackets */}
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
    </div>
  );
};
