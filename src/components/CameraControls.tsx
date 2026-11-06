import React, { useState } from 'react';
import {
  RotateCcw,
  Pause,
  Play,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { CameraCapabilities, CameraMode, MediaItem } from '../types';
import { triggerHaptic } from '../services/audioFeedback';

interface CameraControlsProps {
  mode: CameraMode;
  onChangeMode: (newMode: CameraMode) => void;
  isRecording: boolean;
  isRecordingPaused: boolean;
  recordingSeconds: number;
  onTakePhoto: () => void;
  onStartRecording: () => void;
  onPauseResumeRecording: () => void;
  onStopRecording: () => void;
  onFlipCamera: () => void;
  lastMediaItem: MediaItem | null;
  totalMediaCount: number;
  onOpenGallery: () => void;
  zoomLevel: number;
  onZoomChange: (level: number) => void;
  capabilities: CameraCapabilities;
  haptics: boolean;
  onToggleProPanel: () => void;
  isProPanelOpen: boolean;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
  mode,
  onChangeMode,
  isRecording,
  isRecordingPaused,
  recordingSeconds,
  onTakePhoto,
  onStartRecording,
  onPauseResumeRecording,
  onStopRecording,
  onFlipCamera,
  lastMediaItem,
  totalMediaCount,
  onOpenGallery,
  zoomLevel,
  onZoomChange,
  capabilities,
  haptics,
  onToggleProPanel,
  isProPanelOpen,
}) => {
  const [showZoomSlider, setShowZoomSlider] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleFlipClick = () => {
    setIsFlipping(true);
    onFlipCamera();
    setTimeout(() => setIsFlipping(false), 500);
  };

  const handleShutterClick = () => {
    if (mode === 'photo' || mode === 'pro') {
      onTakePhoto();
    } else if (mode === 'video') {
      if (isRecording) {
        onStopRecording();
      } else {
        onStartRecording();
      }
    }
  };

  // Preset zoom values clamped by capabilities
  const zoomPresets = [0.5, 1, 2, 5].filter(
    (z) => z >= Math.floor(capabilities.minZoom) && z <= Math.ceil(capabilities.maxZoom * 10) / 10
  );
  if (!zoomPresets.includes(1)) zoomPresets.unshift(1);

  return (
    <footer className="relative z-30 w-full bg-gradient-to-t from-black via-black/95 to-transparent pb-safe pt-2 px-4 select-none flex flex-col items-center gap-3">
      {/* Zoom Controls Bar */}
      {!isRecording && (
        <div className="flex flex-col items-center gap-1.5 w-full max-w-xs">
          {showZoomSlider && (
            <div className="w-full flex items-center gap-3 px-3 py-1.5 bg-neutral-900/90 backdrop-blur-md rounded-full border border-white/10 animate-in fade-in slide-in-from-bottom-2">
              <span className="text-[11px] font-mono text-white/60">
                {capabilities.minZoom.toFixed(1)}x
              </span>
              <input
                type="range"
                min={capabilities.minZoom}
                max={capabilities.maxZoom}
                step={capabilities.zoomStep || 0.1}
                value={zoomLevel}
                onChange={(e) => {
                  triggerHaptic(haptics, 5);
                  onZoomChange(parseFloat(e.target.value));
                }}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[11px] font-mono text-white/60">
                {capabilities.maxZoom.toFixed(1)}x
              </span>
            </div>
          )}

          {/* Quick Zoom Buttons */}
          <div className="flex items-center gap-2 p-1 bg-black/60 backdrop-blur-md border border-white/10 rounded-full">
            {zoomPresets.map((preset) => {
              const isActive = Math.abs(zoomLevel - preset) < 0.15;
              return (
                <button
                  key={preset}
                  onClick={() => {
                    triggerHaptic(haptics, 10);
                    onZoomChange(preset);
                  }}
                  className={`min-h-[32px] px-2.5 rounded-full text-xs font-semibold font-mono transition-all ${
                    isActive
                      ? 'bg-amber-400 text-black shadow-md scale-105'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {preset}x
                </button>
              );
            })}

            {/* Custom slider toggle */}
            <button
              onClick={() => {
                triggerHaptic(haptics, 10);
                setShowZoomSlider(!showZoomSlider);
              }}
              className={`min-h-[32px] px-2 rounded-full text-xs font-mono transition-colors ${
                showZoomSlider ? 'text-amber-400 bg-white/10' : 'text-white/60 hover:text-white'
              }`}
              title="Manual Zoom Slider"
              aria-label="Manual Zoom Slider"
            >
              {zoomLevel.toFixed(1)}x
            </button>
          </div>
        </div>
      )}

      {/* Video Recording Status Badge */}
      {isRecording && (
        <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-red-950/80 border border-red-500/50 backdrop-blur-md animate-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-sm font-mono font-bold text-white tracking-widest">
            {formatTime(recordingSeconds)}
          </span>
          {isRecordingPaused && (
            <span className="text-xs font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              PAUSED
            </span>
          )}
        </div>
      )}

      {/* Mode Switcher Carousel */}
      {!isRecording && (
        <div className="flex items-center gap-6 py-1 text-sm font-semibold tracking-wider uppercase">
          <button
            onClick={() => {
              triggerHaptic(haptics, 12);
              onChangeMode('photo');
            }}
            className={`transition-colors min-h-[36px] px-2 ${
              mode === 'photo'
                ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-0.5'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Photo
          </button>
          <button
            onClick={() => {
              triggerHaptic(haptics, 12);
              onChangeMode('video');
            }}
            className={`transition-colors min-h-[36px] px-2 ${
              mode === 'video'
                ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-0.5'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Video
          </button>
          <button
            onClick={() => {
              triggerHaptic(haptics, 12);
              onChangeMode('pro');
              onToggleProPanel();
            }}
            className={`transition-colors min-h-[36px] px-2 flex items-center gap-1.5 ${
              mode === 'pro' || isProPanelOpen
                ? 'text-amber-400 font-bold border-b-2 border-amber-400 pb-0.5'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Pro</span>
          </button>
        </div>
      )}

      {/* Bottom Main Controls Row: Gallery Thumbnail | Shutter Button | Flip Camera */}
      <div className="w-full flex items-center justify-between px-2 max-w-sm mt-1 mb-1">
        {/* Left: Gallery Thumbnail */}
        <div className="w-16 flex items-center justify-center">
          <button
            onClick={() => {
              triggerHaptic(haptics, 15);
              onOpenGallery();
            }}
            className="group relative min-w-[50px] min-h-[50px] w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/30 bg-neutral-900 active:scale-95 transition-all shadow-lg flex items-center justify-center"
            title="Open Gallery"
            aria-label="Open Camera Gallery"
          >
            {lastMediaItem?.previewUrl ? (
              <img
                src={lastMediaItem.previewUrl}
                alt="Latest capture"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center text-white/40">
                <Sparkles className="w-5 h-5 text-white/40" />
              </div>
            )}

            {/* Total Media Count Badge */}
            {totalMediaCount > 0 && (
              <span className="absolute bottom-0.5 right-0.5 bg-black/80 backdrop-blur-sm text-[10px] font-mono font-bold text-amber-300 px-1 rounded-sm border border-white/20">
                {totalMediaCount}
              </span>
            )}
          </button>
        </div>

        {/* Center: Tactile Shutter Button */}
        <div className="flex items-center gap-4">
          {/* Pause / Resume Button during video recording */}
          {isRecording && (
            <button
              onClick={onPauseResumeRecording}
              className="min-h-[48px] min-w-[48px] w-12 h-12 rounded-full bg-neutral-800/90 border border-white/20 text-white flex items-center justify-center active:scale-90 transition-transform shadow-lg"
              title={isRecordingPaused ? 'Resume Recording' : 'Pause Recording'}
              aria-label={isRecordingPaused ? 'Resume' : 'Pause'}
            >
              {isRecordingPaused ? (
                <Play className="w-5 h-5 fill-white text-white" />
              ) : (
                <Pause className="w-5 h-5 fill-white text-white" />
              )}
            </button>
          )}

          {/* Primary Shutter Button */}
          <button
            onClick={handleShutterClick}
            className={`relative min-h-[76px] min-w-[76px] w-20 h-20 rounded-full flex items-center justify-center transition-all duration-150 active:scale-95 ${
              mode === 'video'
                ? isRecording
                  ? 'border-4 border-red-500 bg-red-950/40 shadow-[0_0_24px_rgba(239,68,68,0.5)]'
                  : 'border-4 border-white/90 bg-black/40 hover:border-red-400'
                : 'border-4 border-white/95 bg-black/30 hover:border-white shadow-xl'
            }`}
            title={
              mode === 'video'
                ? isRecording
                  ? 'Stop Recording'
                  : 'Start Recording'
                : 'Take Photo'
            }
            aria-label={
              mode === 'video'
                ? isRecording
                  ? 'Stop Recording'
                  : 'Start Recording'
                : 'Take Photo'
            }
          >
            {/* Inner Shutter Shape */}
            {mode === 'video' ? (
              isRecording ? (
                // Recording active: Red rounded square
                <div className="w-7 h-7 rounded-md bg-red-500 shadow-md transition-all duration-200" />
              ) : (
                // Video standby: Red filled circle
                <div className="w-14 h-14 rounded-full bg-red-500 shadow-md transition-all duration-200" />
              )
            ) : (
              // Photo mode: White tactile circle
              <div className="w-14 h-14 rounded-full bg-white shadow-md active:bg-neutral-200 transition-all duration-100 flex items-center justify-center" />
            )}
          </button>
        </div>

        {/* Right: Camera Flip Button */}
        <div className="w-16 flex items-center justify-center">
          <button
            onClick={handleFlipClick}
            disabled={isRecording}
            className={`min-h-[50px] min-w-[50px] w-12 h-12 rounded-full bg-neutral-900/90 border border-white/20 text-white flex items-center justify-center active:scale-90 transition-all shadow-lg ${
              isRecording ? 'opacity-40 cursor-not-allowed' : 'hover:bg-neutral-800'
            }`}
            title="Switch Front/Back Camera"
            aria-label="Switch Camera"
          >
            <RotateCcw
              className={`w-6 h-6 transition-transform duration-500 ${
                isFlipping ? '-rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>
    </footer>
  );
};
