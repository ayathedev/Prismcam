import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  HardDriveDownload,
  Share2,
  Sparkles,
  Layers,
  Clock,
  Scissors,
  Check,
  Maximize2,
  RotateCcw,
} from 'lucide-react';
import { MediaItem } from '../types';
import { applyFilterToContext } from '../services/filters';
import { triggerHaptic } from '../services/audioFeedback';
import { downloadMediaToPhone, saveMediaToDb, shareMediaToPhone } from '../services/storage';

interface FrameScrubberModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoItem: MediaItem;
  onFrameExported: (item: MediaItem) => void;
  haptics: boolean;
  showToast: (msg: string) => void;
}

interface FilmstripThumb {
  timestamp: number;
  url: string;
}

export const FrameScrubberModal: React.FC<FrameScrubberModalProps> = ({
  isOpen,
  onClose,
  videoItem,
  onFrameExported,
  haptics,
  showToast,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const filmstripScrollRef = useRef<HTMLDivElement | null>(null);

  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [filmstrip, setFilmstrip] = useState<FilmstripThumb[]>([]);
  const [isLoadingThumbnails, setIsLoadingThumbnails] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [lastExportedUrl, setLastExportedUrl] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [exportedCount, setExportedCount] = useState<number>(0);
  const [recentExportNotice, setRecentExportNotice] = useState<string | null>(null);

  // Video FPS assumption (standard mobile Chrome recording is 30fps)
  const FPS = 30;
  const FRAME_STEP = 1 / FPS; // ~0.0333 seconds per frame

  // Format time with milliseconds mm:ss.mmm
  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, '0');
    const millis = Math.floor((seconds % 1) * 1000)
      .toString()
      .padStart(3, '0');
    return `${mins}:${secs}.${millis}`;
  };

  const currentFrameNumber = Math.min(
    Math.max(1, Math.round(currentTime * FPS) + 1),
    Math.max(1, Math.round(duration * FPS))
  );
  const totalFrames = Math.max(1, Math.round(duration * FPS));

  // Sync state when video loads metadata
  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration || videoItem.duration || 1;
    setDuration(dur);
    setCurrentTime(0);
    generateFilmstrip(dur);
  };

  // Video time update listener
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  // Generate visual filmstrip thumbnails along the timeline
  const generateFilmstrip = async (videoDuration: number) => {
    setIsLoadingThumbnails(true);
    const count = Math.min(16, Math.max(8, Math.round(videoDuration * 2)));
    const step = videoDuration / count;
    const thumbs: FilmstripThumb[] = [];

    // Create an offscreen video element to seek without interrupting main preview
    const offscreenVideo = document.createElement('video');
    offscreenVideo.src = videoItem.previewUrl;
    offscreenVideo.muted = true;
    offscreenVideo.playsInline = true;

    await new Promise<void>((resolve) => {
      offscreenVideo.onloadedmetadata = () => resolve();
    });

    const offscreenCanvas = document.createElement('canvas');
    // Compact thumbnail resolution (160px width)
    const aspect = (offscreenVideo.videoWidth || 16) / (offscreenVideo.videoHeight || 9);
    offscreenCanvas.width = 140;
    offscreenCanvas.height = Math.round(140 / aspect);
    const offCtx = offscreenCanvas.getContext('2d');

    for (let i = 0; i <= count; i++) {
      const targetTime = Math.min(videoDuration - 0.05, Math.max(0, i * step));
      offscreenVideo.currentTime = targetTime;

      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          offscreenVideo.removeEventListener('seeked', onSeeked);
          if (offCtx) {
            applyFilterToContext(offCtx, videoItem.filterId || 'none');
            offCtx.drawImage(
              offscreenVideo,
              0,
              0,
              offscreenCanvas.width,
              offscreenCanvas.height
            );
            thumbs.push({
              timestamp: targetTime,
              url: offscreenCanvas.toDataURL('image/jpeg', 0.65),
            });
          }
          resolve();
        };
        offscreenVideo.addEventListener('seeked', onSeeked);
      });
    }

    setFilmstrip(thumbs);
    setIsLoadingThumbnails(false);
  };

  // Seek video safely
  const seekTo = useCallback(
    (newTime: number) => {
      if (!videoRef.current) return;
      const clamped = Math.max(0, Math.min(duration, newTime));
      videoRef.current.currentTime = clamped;
      setCurrentTime(clamped);
    },
    [duration]
  );

  // Stepping controls (Frame by frame)
  const stepFrames = (frameDelta: number) => {
    triggerHaptic(haptics, 10);
    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
    seekTo(currentTime + frameDelta * FRAME_STEP);
  };

  // Stepping controls (Seconds)
  const stepSeconds = (secondsDelta: number) => {
    triggerHaptic(haptics, 15);
    if (isPlaying) {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
    seekTo(currentTime + secondsDelta);
  };

  // Play / Pause toggle
  const togglePlayPause = () => {
    if (!videoRef.current) return;
    triggerHaptic(haptics, 15);

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  // Cycle playback speed (1x -> 0.5x -> 0.25x slow motion for frame inspection)
  const cyclePlaybackRate = () => {
    triggerHaptic(haptics, 12);
    const rates = [1, 0.5, 0.25];
    const nextIdx = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIdx];
    setPlaybackRate(newRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
    }
  };

  // Export current video frame as high-resolution photo
  const exportCurrentFrame = async (customTime?: number): Promise<MediaItem | null> => {
    if (!videoRef.current) return null;
    setIsExporting(true);
    triggerHaptic(haptics, [20, 40, 20]);

    const targetTime = customTime !== undefined ? customTime : currentTime;
    if (customTime !== undefined && videoRef.current.currentTime !== customTime) {
      videoRef.current.currentTime = customTime;
      await new Promise<void>((resolve) => {
        const onSeek = () => {
          videoRef.current?.removeEventListener('seeked', onSeek);
          resolve();
        };
        videoRef.current?.addEventListener('seeked', onSeek);
      });
    }

    const video = videoRef.current;
    const videoW = video.videoWidth || 1920;
    const videoH = video.videoHeight || 1080;

    const canvas = document.createElement('canvas');
    canvas.width = videoW;
    canvas.height = videoH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return null;
    }

    // Apply color filter if original video used one
    applyFilterToContext(ctx, videoItem.filterId || 'none');
    ctx.drawImage(video, 0, 0, videoW, videoH);

    // Export to full-quality JPEG
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.96);
    });

    if (!blob) {
      setIsExporting(false);
      return null;
    }

    const timestamp = Date.now();
    const timeFormatted = formatTimecode(targetTime).replace(/[:.]/g, '-');
    const cleanBaseName = videoItem.filename.replace(/\.[^/.]+$/, '');
    const filename = `FRAME_${cleanBaseName}_${timeFormatted}.jpg`;
    const previewUrl = URL.createObjectURL(blob);

    const frameMediaItem: MediaItem = {
      id: `frame_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'photo',
      blob,
      previewUrl,
      filename,
      fileSize: blob.size,
      width: videoW,
      height: videoH,
      createdAt: timestamp,
      filterId: videoItem.filterId,
      facingMode: videoItem.facingMode,
      mimeType: 'image/jpeg',
      sourceVideoId: videoItem.id,
      timestampSeconds: targetTime,
    };

    // Save to IndexedDB (In-app gallery)
    await saveMediaToDb(frameMediaItem);

    // Direct download to phone storage (Downloads folder)
    downloadMediaToPhone(frameMediaItem);

    setLastExportedUrl(previewUrl);
    setExportedCount((prev) => prev + 1);
    const notice = `Frame at ${formatTimecode(targetTime)} saved to Phone Downloads!`;
    setRecentExportNotice(notice);
    setIsExporting(false);

    showToast(notice);
    onFrameExported(frameMediaItem);

    setTimeout(() => {
      setRecentExportNotice((prev) => (prev === notice ? null : prev));
    }, 3200);

    return frameMediaItem;
  };

  // Export a burst sequence of 5 frames around the current point
  const exportBurstSequence = async () => {
    if (!videoRef.current || duration <= 0) return;
    setIsExporting(true);
    triggerHaptic(haptics, [30, 30, 30]);

    showToast('Extracting 5-frame burst sequence to phone storage...');

    // 5 consecutive frames spaced by 1/15s (0.066s)
    const base = currentTime;
    const offsets = [-0.133, -0.066, 0, 0.066, 0.133];

    for (const offset of offsets) {
      const t = Math.max(0, Math.min(duration - 0.01, base + offset));
      await exportCurrentFrame(t);
      await new Promise((r) => setTimeout(r, 120));
    }

    setIsExporting(false);
    setRecentExportNotice('5 consecutive frames saved to phone storage!');
    showToast('5 frames extracted & saved to phone storage!');
    setTimeout(() => {
      setRecentExportNotice(null);
    }, 3500);
  };

  // Direct share extracted frame
  const handleShareCurrentFrame = async () => {
    const frameItem = await exportCurrentFrame();
    if (frameItem) {
      await shareMediaToPhone(frameItem);
    }
  };

  // Touch jog wheel handler
  const touchStartXRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  const handleJogTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartTimeRef.current = currentTime;
    if (isPlaying && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleJogTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    // 1 frame per 10 pixels of drag
    const frameDelta = deltaX / 12;
    const newTarget = touchStartTimeRef.current + frameDelta * FRAME_STEP;
    seekTo(newTarget);
    triggerHaptic(haptics, 4);
  };

  const handleJogTouchEnd = () => {
    touchStartXRef.current = null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-in fade-in duration-200 select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between px-3 pt-safe pb-2 bg-gradient-to-b from-black via-black/80 to-transparent border-b border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic(haptics, 10);
              onClose();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10"
            aria-label="Back to Gallery"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <Scissors className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold tracking-tight text-white">
                Frame-by-Frame Scrubber
              </h2>
              {exportedCount > 0 && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                  <span>{exportedCount} saved</span>
                </span>
              )}
            </div>
            <p className="text-[10px] text-white/50 truncate max-w-[200px]">
              {videoItem.filename}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1.5">
          {/* Zoom Toggle */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-xs transition-colors ${
              isZoomed ? 'text-amber-400 bg-white/10' : 'text-white/70 hover:text-white'
            }`}
            title="Inspect Zoom"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            onClick={() => {
              triggerHaptic(haptics, 10);
              onClose();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Video Frame Viewer Area */}
      <div className="relative flex-1 bg-neutral-950 flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={videoItem.previewUrl}
          playsInline
          muted
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
          className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
            isZoomed ? 'scale-125 cursor-move' : 'scale-100'
          }`}
        />

        {/* Current Timecode & Frame Counter Badge */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 shadow-xl">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono text-xs font-bold text-white tracking-wider">
              {formatTimecode(currentTime)}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-xs font-mono font-semibold text-white/80 shadow-xl">
            <span className="text-amber-400">Frame {currentFrameNumber}</span>
            <span className="text-white/40"> / {totalFrames}</span>
          </div>
        </div>

        {/* Floating Export Confirmation Banner */}
        {recentExportNotice && (
          <div className="absolute bottom-4 inset-x-3 z-30 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="px-4 py-2 rounded-full bg-emerald-500 text-black text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-md">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{recentExportNotice}</span>
            </div>
          </div>
        )}

        {/* Playback speed badge when slow motion active */}
        {playbackRate !== 1 && (
          <div className="absolute top-12 left-3 px-2 py-0.5 rounded-md bg-amber-400 text-black font-mono font-bold text-[10px] shadow-lg">
            SLOW MO: {playbackRate}x
          </div>
        )}
      </div>

      {/* Frame Scrubber Controls Deck */}
      <div className="bg-neutral-900 border-t border-white/10 px-3 pt-3 pb-safe flex flex-col gap-3">
        {/* Visual Filmstrip Timeline Scrubber */}
        <div className="relative flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] text-white/50 px-1">
            <span>Video Timeline Filmstrip</span>
            <span>Tap or drag to scrub</span>
          </div>

          {/* Filmstrip Track */}
          <div
            ref={filmstripScrollRef}
            onClick={(e) => {
              if (duration <= 0) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const ratio = Math.max(0, Math.min(1, clickX / rect.width));
              seekTo(ratio * duration);
              triggerHaptic(haptics, 10);
            }}
            className="relative h-14 w-full bg-neutral-950 rounded-xl overflow-hidden border border-white/20 cursor-pointer flex items-center select-none"
          >
            {/* Thumbnails strip */}
            {isLoadingThumbnails ? (
              <div className="w-full h-full flex items-center justify-center text-xs text-white/40 gap-2">
                <span className="w-3 h-3 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
                <span>Generating filmstrip...</span>
              </div>
            ) : (
              <div className="flex w-full h-full">
                {filmstrip.map((thumb, idx) => (
                  <div key={idx} className="flex-1 h-full relative overflow-hidden border-r border-black/30">
                    <img
                      src={thumb.url}
                      alt={`frame-${idx}`}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Glowing Red/Amber Playhead Needle */}
            {duration > 0 && (
              <div
                style={{
                  left: `${(currentTime / duration) * 100}%`,
                }}
                className="absolute top-0 bottom-0 w-1 bg-amber-400 -translate-x-1/2 shadow-[0_0_12px_rgba(250,204,21,0.9)] pointer-events-none z-10 flex flex-col items-center justify-between"
              >
                <div className="w-2.5 h-2 rounded-b-sm bg-amber-400 shadow-md" />
                <div className="w-2.5 h-2 rounded-t-sm bg-amber-400 shadow-md" />
              </div>
            )}
          </div>
        </div>

        {/* Precision Jog Wheel Drag Bar */}
        <div
          onTouchStart={handleJogTouchStart}
          onTouchMove={handleJogTouchMove}
          onTouchEnd={handleJogTouchEnd}
          className="w-full h-10 bg-neutral-950 rounded-xl border border-white/15 px-2 flex items-center justify-between cursor-ew-resize relative overflow-hidden"
          title="Drag horizontally to scrub frame-by-frame"
        >
          {/* Tick marks simulation */}
          <div className="absolute inset-0 flex items-center justify-around px-4 pointer-events-none opacity-40">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className={`w-[1px] ${i % 5 === 0 ? 'h-5 bg-amber-400' : 'h-2.5 bg-white/40'}`}
              />
            ))}
          </div>

          <div className="relative z-10 w-full flex items-center justify-center gap-1.5 text-xs text-white/70 font-mono pointer-events-none">
            <span className="text-[10px] uppercase font-bold text-amber-400">Tactile Jog Dial</span>
            <span className="text-white/40">·</span>
            <span className="text-[11px] text-white/60">Drag left / right for 1-frame precision</span>
          </div>
        </div>

        {/* Stepping Navigation Controls Row */}
        <div className="flex items-center justify-between gap-1 py-1">
          {/* Step -1s */}
          <button
            onClick={() => stepSeconds(-1)}
            className="min-h-[40px] px-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-medium hover:bg-white/10 active:scale-95 transition-all text-white/80"
            title="Step back 1 second"
          >
            -1.0s
          </button>

          {/* Step -1 Frame */}
          <button
            onClick={() => stepFrames(-1)}
            className="min-h-[44px] px-3.5 rounded-xl bg-neutral-800 border border-white/15 flex items-center gap-1 text-xs font-bold text-amber-300 hover:bg-neutral-700 active:scale-95 transition-all"
            title="Step back 1 single frame"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            <span>-1 Frame</span>
          </button>

          {/* Center Play / Pause */}
          <button
            onClick={togglePlayPause}
            className="min-h-[46px] min-w-[46px] rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-black" />
            ) : (
              <Play className="w-5 h-5 fill-black ml-0.5" />
            )}
          </button>

          {/* Step +1 Frame */}
          <button
            onClick={() => stepFrames(1)}
            className="min-h-[44px] px-3.5 rounded-xl bg-neutral-800 border border-white/15 flex items-center gap-1 text-xs font-bold text-amber-300 hover:bg-neutral-700 active:scale-95 transition-all"
            title="Step forward 1 single frame"
          >
            <span>+1 Frame</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Step +1s */}
          <button
            onClick={() => stepSeconds(1)}
            className="min-h-[40px] px-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono font-medium hover:bg-white/10 active:scale-95 transition-all text-white/80"
            title="Step forward 1 second"
          >
            +1.0s
          </button>

          {/* Playback speed button */}
          <button
            onClick={cyclePlaybackRate}
            className={`min-h-[40px] px-2 rounded-xl text-xs font-mono font-bold transition-colors ${
              playbackRate !== 1
                ? 'bg-amber-400 text-black shadow-md'
                : 'bg-white/5 border border-white/10 text-white/70 hover:text-white'
            }`}
            title="Change Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Primary Export Actions Bar */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
          {/* Export Current Frame to Phone Storage */}
          <button
            onClick={() => exportCurrentFrame()}
            disabled={isExporting}
            className="min-h-[46px] py-2.5 px-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-black font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            title="Export high-res still image directly to phone Downloads"
          >
            <HardDriveDownload className="w-4 h-4 stroke-[2.5]" />
            <span>{isExporting ? 'Saving Frame...' : 'Export Frame'}</span>
          </button>

          {/* Burst Sequence Exporter (5 continuous frames) */}
          <button
            onClick={exportBurstSequence}
            disabled={isExporting}
            className="min-h-[46px] py-2.5 px-3 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-98 border border-white/15 text-white font-semibold text-xs tracking-wide flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            title="Extract 5 rapid consecutive frames around current moment"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Extract 5-Burst</span>
          </button>
        </div>
      </div>
    </div>
  );
};
