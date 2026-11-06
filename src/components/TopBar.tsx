import React, { useState } from 'react';
import {
  Zap,
  ZapOff,
  Flame,
  Clock,
  Grid,
  Settings,
  Maximize2,
  Minimize2,
  HardDriveDownload,
} from 'lucide-react';
import { AspectRatio, CameraSettings, FlashMode, GridType } from '../types';
import { triggerHaptic } from '../services/audioFeedback';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  settings: CameraSettings;
  onUpdateSettings: (updates: Partial<CameraSettings>) => void;
  onOpenSettings: () => void;
  onOpenGallery: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  hasTorch: boolean;
  torchActive: boolean;
  onToggleTorch: () => void;
  totalMediaCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  settings,
  onUpdateSettings,
  onOpenSettings,
  isFullscreen,
  onToggleFullscreen,
  hasTorch,
  torchActive,
  onToggleTorch,
  totalMediaCount,
}) => {
  const [activeMenu, setActiveMenu] = useState<'flash' | 'ratio' | 'timer' | null>(null);

  const toggleMenu = (menu: 'flash' | 'ratio' | 'timer') => {
    triggerHaptic(settings.haptics, 10);
    setActiveMenu((prev) => (prev === menu ? null : menu));
  };

  const handleSelectFlash = (mode: FlashMode) => {
    triggerHaptic(settings.haptics, 15);
    onUpdateSettings({ flashMode: mode });
    setActiveMenu(null);
  };

  const handleSelectRatio = (ratio: AspectRatio) => {
    triggerHaptic(settings.haptics, 15);
    onUpdateSettings({ aspectRatio: ratio });
    setActiveMenu(null);
  };

  const handleSelectTimer = (seconds: 0 | 3 | 5 | 10) => {
    triggerHaptic(settings.haptics, 15);
    onUpdateSettings({ timerSeconds: seconds });
    setActiveMenu(null);
  };

  const handleCycleGrid = () => {
    triggerHaptic(settings.haptics, 15);
    const grids: GridType[] = ['none', 'rule_of_thirds', 'golden_ratio', 'square'];
    const currentIndex = grids.indexOf(settings.gridType);
    const nextIndex = (currentIndex + 1) % grids.length;
    onUpdateSettings({ gridType: grids[nextIndex] });
  };

  return (
    <header className="relative z-30 w-full bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-safe px-3 pb-2 transition-all">
      {/* Top Bar Row */}
      <div className="flex items-center justify-between text-white/90">
        {/* Flash Toggle */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('flash')}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full p-2 transition-colors ${
              settings.flashMode !== 'off' || torchActive
                ? 'text-amber-400 bg-white/10'
                : 'text-white/80 hover:bg-white/10 active:bg-white/20'
            }`}
            title="Flash Settings"
            aria-label="Flash Settings"
          >
            {torchActive ? (
              <Flame className="w-5 h-5 fill-amber-400" />
            ) : settings.flashMode === 'off' ? (
              <ZapOff className="w-5 h-5" />
            ) : (
              <Zap className="w-5 h-5 fill-amber-400 text-amber-400" />
            )}
          </button>

          {/* Flash Dropdown */}
          {activeMenu === 'flash' && (
            <div className="absolute top-12 left-0 z-40 flex items-center gap-1 p-1 bg-neutral-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <button
                onClick={() => handleSelectFlash('off')}
                className={`min-h-[40px] px-3 flex items-center gap-1.5 text-xs font-medium rounded-xl transition-colors ${
                  settings.flashMode === 'off' && !torchActive
                    ? 'bg-white text-black font-semibold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <ZapOff className="w-3.5 h-3.5" />
                <span>Off</span>
              </button>
              <button
                onClick={() => handleSelectFlash('auto')}
                className={`min-h-[40px] px-3 flex items-center gap-1.5 text-xs font-medium rounded-xl transition-colors ${
                  settings.flashMode === 'auto'
                    ? 'bg-amber-400 text-black font-semibold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Auto</span>
              </button>
              <button
                onClick={() => handleSelectFlash('on')}
                className={`min-h-[40px] px-3 flex items-center gap-1.5 text-xs font-medium rounded-xl transition-colors ${
                  settings.flashMode === 'on'
                    ? 'bg-amber-400 text-black font-semibold'
                    : 'text-white/70 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>On</span>
              </button>
              {hasTorch && (
                <button
                  onClick={() => {
                    onToggleTorch();
                    setActiveMenu(null);
                  }}
                  className={`min-h-[40px] px-3 flex items-center gap-1.5 text-xs font-medium rounded-xl transition-colors ${
                    torchActive
                      ? 'bg-amber-400 text-black font-semibold'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>Torch</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Aspect Ratio Selector */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('ratio')}
            className="min-h-[44px] px-2.5 flex items-center justify-center text-xs font-bold tracking-wider rounded-full hover:bg-white/10 active:bg-white/20 transition-colors uppercase text-white/90"
            title="Aspect Ratio"
            aria-label="Aspect Ratio"
          >
            {settings.aspectRatio}
          </button>

          {/* Ratio Dropdown */}
          {activeMenu === 'ratio' && (
            <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 p-1 bg-neutral-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              {(['4:3', '16:9', '1:1', 'full'] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => handleSelectRatio(ratio)}
                  className={`min-h-[40px] px-3 text-xs font-bold rounded-xl transition-colors ${
                    settings.aspectRatio === ratio
                      ? 'bg-white text-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {ratio.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Timer Selector */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('timer')}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full p-2 transition-colors ${
              settings.timerSeconds > 0
                ? 'text-amber-400 bg-white/10'
                : 'text-white/80 hover:bg-white/10 active:bg-white/20'
            }`}
            title="Timer"
            aria-label="Timer"
          >
            <Clock className="w-5 h-5" />
            {settings.timerSeconds > 0 && (
              <span className="absolute text-[10px] font-bold bottom-1 text-amber-400">
                {settings.timerSeconds}s
              </span>
            )}
          </button>

          {/* Timer Dropdown */}
          {activeMenu === 'timer' && (
            <div className="absolute top-12 right-0 z-40 flex items-center gap-1 p-1 bg-neutral-900/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              {([0, 3, 5, 10] as (0 | 3 | 5 | 10)[]).map((sec) => (
                <button
                  key={sec}
                  onClick={() => handleSelectTimer(sec)}
                  className={`min-h-[40px] px-3 text-xs font-bold rounded-xl transition-colors ${
                    settings.timerSeconds === sec
                      ? 'bg-amber-400 text-black'
                      : 'text-white/70 hover:text-white'
                  }`}
                >
                  {sec === 0 ? 'Off' : `${sec}s`}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grid Overlay Toggle */}
        <button
          onClick={handleCycleGrid}
          className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full p-2 transition-colors ${
            settings.gridType !== 'none'
              ? 'text-amber-400 bg-white/10'
              : 'text-white/80 hover:bg-white/10 active:bg-white/20'
          }`}
          title={`Grid: ${settings.gridType}`}
          aria-label="Grid overlay toggle"
        >
          <Grid className="w-5 h-5" />
        </button>

        {/* Auto-Save to Phone Status Indicator */}
        <div
          className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-[11px] font-medium text-emerald-300"
          title="Auto-saves directly to your phone's storage"
        >
          <HardDriveDownload className="w-3.5 h-3.5 text-emerald-400" />
          <span>Auto-Save</span>
        </div>

        {/* PWA Install Button */}
        <PWAInstallButton />

        {/* Fullscreen Toggle */}
        <button
          onClick={() => {
            triggerHaptic(settings.haptics, 10);
            onToggleFullscreen();
          }}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full p-2 text-white/80 hover:bg-white/10 active:bg-white/20 transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          aria-label="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>

        {/* Settings Button */}
        <button
          onClick={() => {
            triggerHaptic(settings.haptics, 10);
            onOpenSettings();
          }}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full p-2 text-white/80 hover:bg-white/10 active:bg-white/20 transition-colors"
          title="Camera Settings"
          aria-label="Camera Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};
