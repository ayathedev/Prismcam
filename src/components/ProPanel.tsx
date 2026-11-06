import React from 'react';
import { CameraCapabilities, CameraSettings } from '../types';
import { CAMERA_FILTERS, CameraFilter } from '../services/filters';
import { triggerHaptic } from '../services/audioFeedback';
import { 
  SunMedium, 
  X, 
  Sparkles, 
  HardDriveDownload, 
  Contrast, 
  Droplet, 
  Flame, 
  CircleDot,
  RotateCcw
} from 'lucide-react';

interface ProPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CameraSettings;
  onUpdateSettings: (updates: Partial<CameraSettings>) => void;
  capabilities: CameraCapabilities;
  exposureLevel: number;
  onExposureChange: (val: number) => void;
  devices: MediaDeviceInfo[];
  onSelectDevice: (deviceId: string) => void;
}

export const ProPanel: React.FC<ProPanelProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  capabilities,
  exposureLevel,
  onExposureChange,
  devices,
  onSelectDevice,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-x-0 bottom-36 z-40 px-3 select-none animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="w-full max-w-md mx-auto bg-neutral-950/40 backdrop-blur-3xl border border-white/20 rounded-3xl p-4 shadow-2xl flex flex-col gap-4 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold tracking-wide uppercase text-white">
              Pro Camera Controls
            </h3>
          </div>
          <button
            onClick={() => {
              triggerHaptic(settings.haptics, 10);
              onClose();
            }}
            className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10"
            aria-label="Close pro controls"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Exposure Compensation Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-white/80 font-medium">
              <SunMedium className="w-3.5 h-3.5 text-amber-400" />
              Exposure EV
            </span>
            <span className="font-mono text-amber-400 font-bold">
              {exposureLevel > 0 ? `+${exposureLevel.toFixed(1)}` : exposureLevel.toFixed(1)} EV
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-white/50">
              {capabilities.minExposure < 0 ? capabilities.minExposure.toFixed(1) : '-2.0'}
            </span>
            <input
              type="range"
              min={capabilities.minExposure !== 0 ? capabilities.minExposure : -2}
              max={capabilities.maxExposure !== 0 ? capabilities.maxExposure : 2}
              step={capabilities.exposureStep || 0.1}
              value={exposureLevel}
              onChange={(e) => {
                triggerHaptic(settings.haptics, 5);
                onExposureChange(parseFloat(e.target.value));
              }}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
            <span className="text-[10px] font-mono text-white/50">
              {capabilities.maxExposure !== 0 ? `+${capabilities.maxExposure.toFixed(1)}` : '+2.0'}
            </span>
          </div>
        </div>

        {/* Live Filter Presets */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/80">Color Grading & Tone</span>
            <span className="text-[10px] text-pink-400 font-semibold">Includes Beauty Filters</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {CAMERA_FILTERS.map((f: CameraFilter) => {
              const isSelected = settings.activeFilterId === f.id;
              const isBeauty = f.category === 'beauty';
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    triggerHaptic(settings.haptics, 10);
                    onUpdateSettings({ activeFilterId: f.id });
                  }}
                  className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? isBeauty
                        ? 'bg-pink-500 text-white font-bold shadow-md scale-105'
                        : 'bg-amber-400 text-black font-bold shadow-md scale-105'
                      : isBeauty
                      ? 'bg-pink-500/15 text-pink-300 border border-pink-500/30 hover:bg-pink-500/25'
                      : 'bg-white/10 text-white/80 hover:bg-white/20 hover:text-white'
                  }`}
                >
                  {f.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual Image Adjustments (Tune) */}
        <div className="flex flex-col gap-3 py-1 border-t border-white/10 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Live Picture Tuning</span>
            <button 
              onClick={() => {
                triggerHaptic(settings.haptics, 20);
                onUpdateSettings({
                  brightness: 0,
                  contrast: 0,
                  saturation: 0,
                  warmth: 0,
                  vignette: 0
                });
              }}
              className="text-[10px] text-white/50 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Brightness */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-white/70">
                  <SunMedium className="w-3 h-3" /> Brightness
                </span>
                <span className="font-mono text-amber-400">{settings.brightness}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={settings.brightness}
                onChange={(e) => {
                  triggerHaptic(settings.haptics, 5);
                  onUpdateSettings({ brightness: parseInt(e.target.value, 10) });
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Contrast */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-white/70">
                  <Contrast className="w-3 h-3" /> Contrast
                </span>
                <span className="font-mono text-amber-400">{settings.contrast}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={settings.contrast}
                onChange={(e) => {
                  triggerHaptic(settings.haptics, 5);
                  onUpdateSettings({ contrast: parseInt(e.target.value, 10) });
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Saturation */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-white/70">
                  <Droplet className="w-3 h-3" /> Saturation
                </span>
                <span className="font-mono text-amber-400">{settings.saturation}</span>
              </div>
              <input
                type="range"
                min="-100"
                max="100"
                value={settings.saturation}
                onChange={(e) => {
                  triggerHaptic(settings.haptics, 5);
                  onUpdateSettings({ saturation: parseInt(e.target.value, 10) });
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Warmth */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-white/70">
                  <Flame className="w-3 h-3" /> Warmth
                </span>
                <span className="font-mono text-amber-400">{settings.warmth}</span>
              </div>
              <input
                type="range"
                min="-50"
                max="50"
                value={settings.warmth}
                onChange={(e) => {
                  triggerHaptic(settings.haptics, 5);
                  onUpdateSettings({ warmth: parseInt(e.target.value, 10) });
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Vignette */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-white/70">
                  <CircleDot className="w-3 h-3" /> Vignette
                </span>
                <span className="font-mono text-amber-400">{settings.vignette}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={settings.vignette}
                onChange={(e) => {
                  triggerHaptic(settings.haptics, 5);
                  onUpdateSettings({ vignette: parseInt(e.target.value, 10) });
                }}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>
        </div>

        {/* Camera Sensor Selection (if multiple cameras available) */}
        {devices.length > 1 && (
          <div className="flex flex-col gap-1.5 border-t border-white/10 pt-2">
            <span className="text-xs font-medium text-white/80">Camera Lens Selection</span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {devices.map((device, idx) => {
                const isSelected = settings.selectedDeviceId === device.deviceId;
                const cleanLabel =
                  device.label || `Camera Lens ${idx + 1} (${device.deviceId.slice(0, 4)})`;
                return (
                  <button
                    key={device.deviceId}
                    onClick={() => {
                      triggerHaptic(settings.haptics, 12);
                      onSelectDevice(device.deviceId);
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs whitespace-nowrap font-medium transition-colors ${
                      isSelected
                        ? 'bg-white text-black font-bold'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {cleanLabel.replace(/facing\s*/i, '').slice(0, 22)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Auto-Save to Phone Switch */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-2">
            <HardDriveDownload className="w-4 h-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">Auto-save to phone storage</span>
              <span className="text-[10px] text-white/50">Downloads directly on each capture</span>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic(settings.haptics, 10);
              onUpdateSettings({ autoSaveToDevice: !settings.autoSaveToDevice });
            }}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              settings.autoSaveToDevice ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                settings.autoSaveToDevice ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
};
