import React from 'react';
import {
  X,
  HardDriveDownload,
  Volume2,
  VolumeX,
  Vibrate,
  FlipHorizontal,
  Video,
  Info,
  Trash2,
  Smartphone,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { CameraSettings, ResolutionMode, StorageStats } from '../types';
import { clearAllMediaFromDb, formatBytes } from '../services/storage';
import { triggerHaptic } from '../services/audioFeedback';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CameraSettings;
  onUpdateSettings: (updates: Partial<CameraSettings>) => void;
  storageStats: StorageStats;
  onRefreshStorageStats: () => void;
  showToast: (msg: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  storageStats,
  onRefreshStorageStats,
  showToast,
}) => {
  if (!isOpen) return null;

  const handleClearCache = async () => {
    if (window.confirm('Clear all locally cached camera media? Any photos already saved to your phone storage will remain intact.')) {
      triggerHaptic(settings.haptics, [30, 30]);
      await clearAllMediaFromDb();
      onRefreshStorageStats();
      showToast('Camera cache cleared');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-lg bg-neutral-900/60 backdrop-blur-2xl border border-white/15 rounded-t-3xl sm:rounded-3xl p-5 max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl text-white flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Camera Settings</h2>
          </div>
          <button
            onClick={() => {
              triggerHaptic(settings.haptics, 10);
              onClose();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-white/70 hover:text-white"
            aria-label="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Storage & Saving Behavior (Crucial User Requirement) */}
        <section className="flex flex-col gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Phone Storage & Saving
          </span>

          {/* Auto-Save Toggle */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <HardDriveDownload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  Auto-Save to Phone Storage
                </h4>
                <p className="text-xs text-white/50 mt-0.5">
                  Automatically triggers download directly into your Android device's Downloads/Camera folder on every photo snap and video completion.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic(settings.haptics, 10);
                onUpdateSettings({ autoSaveToDevice: !settings.autoSaveToDevice });
              }}
              className={`w-12 h-7 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
                settings.autoSaveToDevice ? 'bg-emerald-500' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  settings.autoSaveToDevice ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Storage Meter */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-white/70 font-medium">In-App Vault Storage</span>
              <span className="font-mono text-white font-bold">
                {formatBytes(storageStats.usedBytes)} used ({storageStats.itemCount} items)
              </span>
            </div>
            {storageStats.quotaBytes > 0 && (
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full"
                  style={{ width: `${Math.min(100, storageStats.percentage)}%` }}
                />
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-white/40">
                IndexedDB offline backup ensures zero media loss
              </span>
              <button
                onClick={handleClearCache}
                className="text-[11px] font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cache</span>
              </button>
            </div>
          </div>
        </section>

        {/* Beauty & Retouch Settings */}
        <section className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-pink-400">
            Beauty & Skin Retouch
          </span>
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Live Beauty Retouch</h4>
                  <p className="text-xs text-white/50">
                    Smooths skin, adds rosy tone and diffusion glow on camera
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(settings.haptics, 10);
                  onUpdateSettings({
                    beauty: {
                      ...settings.beauty,
                      enabled: !settings.beauty.enabled,
                    },
                  });
                }}
                className={`w-12 h-7 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
                  settings.beauty.enabled ? 'bg-pink-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    settings.beauty.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {settings.beauty.enabled && (
              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70">Default Skin Smoothing</span>
                  <span className="font-mono text-pink-400 font-bold">{settings.beauty.smoothLevel}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.beauty.smoothLevel}
                  onChange={(e) => {
                    onUpdateSettings({
                      beauty: {
                        ...settings.beauty,
                        smoothLevel: parseInt(e.target.value, 10),
                      },
                    });
                  }}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>
            )}
          </div>
        </section>

        {/* 2. Capture Quality & Resolution */}
        <section className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Capture Resolution
          </span>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { id: 'max', label: 'Max (4K)', desc: 'Ultra HD' },
                { id: '1080p', label: '1080p', desc: 'Full HD' },
                { id: '720p', label: '720p', desc: 'Fast' },
              ] as { id: ResolutionMode; label: string; desc: string }[]
            ).map((res) => (
              <button
                key={res.id}
                onClick={() => {
                  triggerHaptic(settings.haptics, 10);
                  onUpdateSettings({ resolution: res.id });
                }}
                className={`p-3 rounded-2xl border text-left flex flex-col transition-all ${
                  settings.resolution === res.id
                    ? 'bg-amber-400/10 border-amber-400 text-white'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <span className="text-xs font-bold text-white">{res.label}</span>
                <span className="text-[10px] text-white/50">{res.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* 3. Audio & Haptics */}
        <section className="flex flex-col gap-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Feedback & Preferences
          </span>

          {/* Shutter Sound */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              {settings.shutterSound ? (
                <Volume2 className="w-5 h-5 text-amber-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-white/40" />
              )}
              <div>
                <span className="text-xs font-semibold text-white block">Shutter Sound</span>
                <span className="text-[10px] text-white/40">Synthesized mechanical camera click</span>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic(settings.haptics, 10);
                onUpdateSettings({ shutterSound: !settings.shutterSound });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                settings.shutterSound ? 'bg-amber-400' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                  settings.shutterSound ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Vibration / Haptics */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <Vibrate className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-xs font-semibold text-white block">Haptic Feedback</span>
                <span className="text-[10px] text-white/40">Tactile buzz on shutter and buttons</span>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic(settings.haptics, 10);
                onUpdateSettings({ haptics: !settings.haptics });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                settings.haptics ? 'bg-amber-400' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                  settings.haptics ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Mirror Front Camera */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <FlipHorizontal className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-xs font-semibold text-white block">Mirror Front Camera</span>
                <span className="text-[10px] text-white/40">Flips selfie preview like a mirror</span>
              </div>
            </div>
            <button
              onClick={() => {
                triggerHaptic(settings.haptics, 10);
                onUpdateSettings({ mirrorFrontCamera: !settings.mirrorFrontCamera });
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                settings.mirrorFrontCamera ? 'bg-amber-400' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform duration-200 ${
                  settings.mirrorFrontCamera ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </section>

        {/* 4. Android Chrome Tips */}
        <section className="p-3.5 rounded-2xl bg-neutral-950 border border-white/10 flex flex-col gap-2 text-xs text-white/70">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <Info className="w-4 h-4" />
            <span>Chrome on Android Tips</span>
          </div>
          <ul className="space-y-1.5 text-[11px] text-white/60">
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Files on Phone:</strong> Captured media saved to phone storage can be found in your <strong>Files app &rarr; Downloads</strong> or in Google Photos.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Install App:</strong> Tap the button below or Chrome menu (⋮) &rarr; <strong>"Install app"</strong> for a native fullscreen camera experience.
              </span>
            </li>
          </ul>
          <div className="pt-1 flex items-center justify-start">
            <PWAInstallButton />
          </div>
        </section>
      </div>
    </div>
  );
};
