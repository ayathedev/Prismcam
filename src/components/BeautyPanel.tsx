import React from 'react';
import { Sparkles, X, RotateCcw, Heart, Droplets, Sun, Wand2, Power, Eye } from 'lucide-react';
import { BeautySettings, BeautyPresetId, CameraSettings } from '../types';
import { BEAUTY_PRESETS, BeautyPreset } from '../services/filters';
import { triggerHaptic } from '../services/audioFeedback';

interface BeautyPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CameraSettings;
  onUpdateSettings: (updates: Partial<CameraSettings>) => void;
}

export const BeautyPanel: React.FC<BeautyPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const beauty = settings.beauty;

  const handleUpdateBeauty = (updates: Partial<BeautySettings>) => {
    onUpdateSettings({
      beauty: {
        ...beauty,
        ...updates,
      },
    });
  };

  const handleSelectPreset = (preset: BeautyPreset) => {
    triggerHaptic(settings.haptics, 12);
    handleUpdateBeauty({
      enabled: true,
      preset: preset.id,
      smoothLevel: preset.smoothLevel,
      rosyLevel: preset.rosyLevel,
      glowLevel: preset.glowLevel,
      brightenLevel: preset.brightenLevel,
      slimLevel: preset.slimLevel,
      enlargeEyeLevel: preset.enlargeEyeLevel,
      portraitDepthLevel: preset.portraitDepthLevel,
    });
  };

  const handleReset = () => {
    triggerHaptic(settings.haptics, 20);
    const natural = BEAUTY_PRESETS[0];
    handleUpdateBeauty({
      enabled: true,
      preset: natural.id,
      smoothLevel: natural.smoothLevel,
      rosyLevel: natural.rosyLevel,
      glowLevel: natural.glowLevel,
      brightenLevel: natural.brightenLevel,
      slimLevel: natural.slimLevel,
      enlargeEyeLevel: natural.enlargeEyeLevel,
      portraitDepthLevel: natural.portraitDepthLevel,
    });
  };

  const toggleEnabled = () => {
    triggerHaptic(settings.haptics, 15);
    handleUpdateBeauty({ enabled: !beauty.enabled });
  };

  return (
    <div className="absolute inset-x-0 bottom-36 z-40 px-3 select-none animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="w-full max-w-md mx-auto bg-neutral-950/40 backdrop-blur-3xl border border-pink-500/30 rounded-3xl p-4 shadow-2xl flex flex-col gap-3.5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-full bg-pink-500/20 text-pink-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wide text-white flex items-center gap-1.5">
                <span>Beauty Retouch</span>
                {beauty.enabled && (
                  <span className="text-[10px] bg-pink-500 text-white font-extrabold px-1.5 py-0.5 rounded-full uppercase">
                    Live
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-white/50">Skin smoothing, blush & radiant glow</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Master Toggle */}
            <button
              onClick={toggleEnabled}
              className={`min-h-[34px] px-3 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
                beauty.enabled
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
              title="Toggle Beauty Effect"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{beauty.enabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title="Reset Beauty Settings"
              aria-label="Reset Beauty Settings"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={() => {
                triggerHaptic(settings.haptics, 10);
                onClose();
              }}
              className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close Beauty Controls"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Beauty Looks Presets Carousel */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs text-white/70">
            <span className="font-semibold flex items-center gap-1">
              <Wand2 className="w-3.5 h-3.5 text-pink-400" />
              Snapchat Beauty Looks
            </span>
            <span className="text-[10px] text-pink-400 font-mono capitalize">
              {BEAUTY_PRESETS.find((p) => p.id === beauty.preset)?.name || 'Custom'}
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {BEAUTY_PRESETS.map((preset) => {
              const isSelected = beauty.enabled && beauty.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`min-h-[38px] px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold shadow-lg scale-105 border border-white/30'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-black/30 shrink-0"
                    style={{ backgroundColor: preset.previewColor }}
                  />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Preset Tagline */}
          {beauty.preset !== 'custom' && (
            <p className="text-[11px] text-pink-300/80 italic px-1">
              {BEAUTY_PRESETS.find((p) => p.id === beauty.preset)?.description}
            </p>
          )}
        </div>

        {/* Sliders Deck */}
        <div className="flex flex-col gap-3 pt-1">
          {/* 1. Skin Smoothing Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-white/90 font-medium">
                <Droplets className="w-3.5 h-3.5 text-pink-300" />
                <span>Skin Smoothing</span>
              </span>
              <span className="font-mono text-pink-400 font-bold">
                {beauty.smoothLevel}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/40">0</span>
              <input
                type="range"
                min="0"
                max="100"
                value={beauty.smoothLevel}
                onChange={(e) => {
                  triggerHaptic(settings.haptics, 4);
                  handleUpdateBeauty({
                    enabled: true,
                    preset: 'custom',
                    smoothLevel: parseInt(e.target.value, 10),
                  });
                }}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
              />
              <span className="text-[10px] font-mono text-white/40">100</span>
            </div>
          </div>

          {/* 2. Rosy Blush Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-white/90 font-medium">
                <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/40" />
                <span>Rosy Blush Tone</span>
              </span>
              <span className="font-mono text-rose-400 font-bold">
                {beauty.rosyLevel}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/40">0</span>
              <input
                type="range"
                min="0"
                max="100"
                value={beauty.rosyLevel}
                onChange={(e) => {
                  triggerHaptic(settings.haptics, 4);
                  handleUpdateBeauty({
                    enabled: true,
                    preset: 'custom',
                    rosyLevel: parseInt(e.target.value, 10),
                  });
                }}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500"
              />
              <span className="text-[10px] font-mono text-white/40">100</span>
            </div>
          </div>

          {/* 3. Soft Dream Glow Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-white/90 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Dream Glow / Diffusion</span>
              </span>
              <span className="font-mono text-amber-300 font-bold">
                {beauty.glowLevel}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/40">0</span>
              <input
                type="range"
                min="0"
                max="100"
                value={beauty.glowLevel}
                onChange={(e) => {
                  triggerHaptic(settings.haptics, 4);
                  handleUpdateBeauty({
                    enabled: true,
                    preset: 'custom',
                    glowLevel: parseInt(e.target.value, 10),
                  });
                }}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <span className="text-[10px] font-mono text-white/40">100</span>
            </div>
          </div>

          {/* 4. Brighten & Radiance */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-white/90 font-medium">
                <Sun className="w-3.5 h-3.5 text-sky-300" />
                <span>Skin Brighten & Clarity</span>
              </span>
              <span className="font-mono text-sky-300 font-bold">
                {beauty.brightenLevel}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/40">0</span>
              <input
                type="range"
                min="0"
                max="100"
                value={beauty.brightenLevel}
                onChange={(e) => {
                  triggerHaptic(settings.haptics, 4);
                  handleUpdateBeauty({
                    enabled: true,
                    preset: 'custom',
                    brightenLevel: parseInt(e.target.value, 10),
                  });
                }}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-sky-400"
              />
              <span className="text-[10px] font-mono text-white/40">100</span>
            </div>
          </div>

          {/* 5. Face Slimming */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-white/90 font-medium">
                <Power className="w-3.5 h-3.5 text-indigo-300 rotate-180" />
                <span>Face Slimming</span>
              </span>
              <span className="font-mono text-indigo-300 font-bold">
                {beauty.slimLevel}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/40">0</span>
              <input
                type="range"
                min="0"
                max="100"
                value={beauty.slimLevel}
                onChange={(e) => {
                  triggerHaptic(settings.haptics, 4);
                  handleUpdateBeauty({
                    enabled: true,
                    preset: 'custom',
                    slimLevel: parseInt(e.target.value, 10),
                  });
                }}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
              <span className="text-[10px] font-mono text-white/40">100</span>
            </div>
          </div>

          {/* 6. Big Eyes */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-white/90 font-medium">
                <Eye className="w-3.5 h-3.5 text-emerald-300" />
                <span>Make Eyes Bigger</span>
              </span>
              <span className="font-mono text-emerald-300 font-bold">
                {beauty.enlargeEyeLevel}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/40">0</span>
              <input
                type="range"
                min="0"
                max="100"
                value={beauty.enlargeEyeLevel}
                onChange={(e) => {
                  triggerHaptic(settings.haptics, 4);
                  handleUpdateBeauty({
                    enabled: true,
                    preset: 'custom',
                    enlargeEyeLevel: parseInt(e.target.value, 10),
                  });
                }}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <span className="text-[10px] font-mono text-white/40">100</span>
            </div>
          </div>

          {/* 7. Portrait Depth / Bokeh */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-white/90 font-medium">
                <Sun className="w-3.5 h-3.5 text-orange-300" />
                <span>Portrait Depth (Bokeh)</span>
              </span>
              <span className="font-mono text-orange-300 font-bold">
                {beauty.portraitDepthLevel}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-mono text-white/40">0</span>
              <input
                type="range"
                min="0"
                max="100"
                value={beauty.portraitDepthLevel}
                onChange={(e) => {
                  triggerHaptic(settings.haptics, 4);
                  handleUpdateBeauty({
                    enabled: true,
                    preset: 'custom',
                    portraitDepthLevel: parseInt(e.target.value, 10),
                  });
                }}
                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-orange-400"
              />
              <span className="text-[10px] font-mono text-white/40">100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
