/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { CameraSettings, CameraMode, MediaItem, StorageStats } from './types';
import { useCamera } from './hooks/useCamera';
import { getAllMediaFromDb, getStorageStats } from './services/storage';
import { TopBar } from './components/TopBar';
import { Viewfinder } from './components/Viewfinder';
import { CameraControls } from './components/CameraControls';
import { ProPanel } from './components/ProPanel';
import { GalleryModal } from './components/GalleryModal';
import { SettingsModal } from './components/SettingsModal';
import { PermissionPrompt } from './components/PermissionPrompt';
import { Toast } from './components/Toast';
import { Sparkles } from 'lucide-react';

const DEFAULT_SETTINGS: CameraSettings = {
  aspectRatio: '4:3',
  flashMode: 'off',
  timerSeconds: 0,
  gridType: 'none',
  resolution: 'max',
  autoSaveToDevice: true, // Auto-save enabled by default to fulfill user request
  shutterSound: true,
  haptics: true,
  mirrorFrontCamera: true,
  activeFilterId: 'none',
  selectedDeviceId: '',
};

export default function App() {
  // Saved settings from localStorage
  const [settings, setSettings] = useState<CameraSettings>(() => {
    try {
      const stored = localStorage.getItem('prismcam_settings');
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [mode, setMode] = useState<CameraMode>('photo');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProPanelOpen, setIsProPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<(() => void) | undefined>(undefined);
  const [toastActionLabel, setToastActionLabel] = useState<string | undefined>(undefined);

  const [storageStats, setStorageStats] = useState<StorageStats>({
    usedBytes: 0,
    quotaBytes: 0,
    percentage: 0,
    itemCount: 0,
  });

  // Display quick toast notification
  const showToast = useCallback((msg: string, onAction?: () => void, actionLabel?: string) => {
    setToastMessage(msg);
    setToastAction(() => onAction);
    setToastActionLabel(actionLabel);

    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Persist settings
  const updateSettings = useCallback((updates: Partial<CameraSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('prismcam_settings', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Refresh storage stats
  const refreshStorageStats = useCallback(async () => {
    const stats = await getStorageStats();
    setStorageStats(stats);
  }, []);

  // Handle new media item captured
  const handleNewMediaCaptured = useCallback((item: MediaItem) => {
    setMediaItems((prev) => [item, ...prev]);
    refreshStorageStats();
  }, [refreshStorageStats]);

  // Handle updated media item (e.g. photo edited in place)
  const handleUpdateMedia = useCallback((updatedItem: MediaItem) => {
    setMediaItems((prev) =>
      prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
    );
    refreshStorageStats();
  }, [refreshStorageStats]);

  // Load existing media from IndexedDB on startup
  useEffect(() => {
    getAllMediaFromDb()
      .then((items) => {
        setMediaItems(items);
        refreshStorageStats();
      })
      .catch((err) => {
        console.warn('Could not load media from DB:', err);
      });
  }, [refreshStorageStats]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Setup camera hook
  const {
    videoRef,
    isReady,
    permissionError,
    facingMode,
    capabilities,
    devices,
    zoomLevel,
    exposureLevel,
    torchActive,
    isShutterActive,
    screenFlash,
    countdown,
    focusPoint,
    isRecording,
    isRecordingPaused,
    recordingSeconds,
    isSimulator,
    startCamera,
    startSimulator,
    flipCamera,
    toggleTorch,
    setZoom,
    setExposure,
    handleTapToFocus,
    takePhoto,
    startRecording,
    pauseResumeRecording,
    stopRecording,
  } = useCamera({
    settings,
    onNewMediaCaptured: handleNewMediaCaptured,
    showToast,
    onOpenGallery: () => setIsGalleryOpen(true),
  });

  // Handle pinch to zoom delta
  const handlePinchZoom = (delta: number) => {
    const newZoom = zoomLevel + delta;
    setZoom(newZoom);
  };

  // Delete item from local state and DB
  const handleDeleteMedia = async (id: string) => {
    const { deleteMediaFromDb } = await import('./services/storage');
    await deleteMediaFromDb(id);
    setMediaItems((prev) => prev.filter((m) => m.id !== id));
    refreshStorageStats();
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black flex flex-col justify-between select-none touch-none">
      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        onAction={toastAction}
        actionLabel={toastActionLabel}
      />

      {/* Top Bar Controls */}
      <TopBar
        settings={settings}
        onUpdateSettings={updateSettings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGallery={() => setIsGalleryOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        hasTorch={capabilities.hasTorch}
        torchActive={torchActive}
        onToggleTorch={toggleTorch}
        totalMediaCount={mediaItems.length}
      />

      {/* Main Viewfinder Frame */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center overflow-hidden">
        {/* Simulator mode banner */}
        {isSimulator && (
          <div className="absolute top-3 inset-x-0 z-30 flex justify-center pointer-events-none px-4">
            <button
              onClick={() => {
                showToast('Connecting physical camera...');
                startCamera();
              }}
              className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-400 text-black text-xs font-bold shadow-2xl backdrop-blur-md active:scale-95 transition-all"
              title="Tap to attempt physical camera connection"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulator Feed · Tap to Connect Physical Camera</span>
            </button>
          </div>
        )}

        <Viewfinder
          videoRef={videoRef}
          aspectRatio={settings.aspectRatio}
          gridType={settings.gridType}
          filterId={settings.activeFilterId}
          isShutterActive={isShutterActive}
          screenFlash={screenFlash}
          countdown={countdown}
          focusPoint={focusPoint}
          facingMode={facingMode}
          mirrorFront={settings.mirrorFrontCamera}
          onTapToFocus={handleTapToFocus}
          onPinchZoom={handlePinchZoom}
        />
      </div>

      {/* Pro Panel Drawer */}
      <ProPanel
        isOpen={isProPanelOpen}
        onClose={() => setIsProPanelOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        capabilities={capabilities}
        exposureLevel={exposureLevel}
        onExposureChange={setExposure}
        devices={devices}
        onSelectDevice={(deviceId) => {
          updateSettings({ selectedDeviceId: deviceId });
          startCamera(facingMode, deviceId);
        }}
      />

      {/* Bottom Main Controls */}
      <CameraControls
        mode={mode}
        onChangeMode={(newMode) => {
          setMode(newMode);
          if (newMode === 'pro') {
            setIsProPanelOpen(true);
          } else {
            setIsProPanelOpen(false);
          }
        }}
        isRecording={isRecording}
        isRecordingPaused={isRecordingPaused}
        recordingSeconds={recordingSeconds}
        onTakePhoto={takePhoto}
        onStartRecording={startRecording}
        onPauseResumeRecording={pauseResumeRecording}
        onStopRecording={stopRecording}
        onFlipCamera={flipCamera}
        lastMediaItem={mediaItems[0] || null}
        totalMediaCount={mediaItems.length}
        onOpenGallery={() => setIsGalleryOpen(true)}
        zoomLevel={zoomLevel}
        onZoomChange={setZoom}
        capabilities={capabilities}
        haptics={settings.haptics}
        onToggleProPanel={() => setIsProPanelOpen(!isProPanelOpen)}
        isProPanelOpen={isProPanelOpen}
      />

      {/* Gallery Modal */}
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        mediaItems={mediaItems}
        onDeleteMedia={handleDeleteMedia}
        onNewMediaCaptured={handleNewMediaCaptured}
        onUpdateMedia={handleUpdateMedia}
        storageStats={storageStats}
        haptics={settings.haptics}
        showToast={showToast}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
        storageStats={storageStats}
        onRefreshStorageStats={refreshStorageStats}
        showToast={showToast}
      />

      {/* Permission Fallback Screen */}
      {permissionError && !isReady && (
        <PermissionPrompt
          error={permissionError}
          onRetry={() => startCamera()}
          onUseSimulator={() => startSimulator()}
        />
      )}
    </main>
  );
}
