import { useCallback, useEffect, useRef, useState } from 'react';
import { AspectRatio, CameraCapabilities, CameraSettings, MediaItem } from '../types';
import { applyFilterToContext } from '../services/filters';
import { playRecordStartSound, playRecordStopSound, playShutterSound, triggerHaptic } from '../services/audioFeedback';
import { downloadMediaToPhone, saveMediaToDb } from '../services/storage';
import { createSimulatedCameraStream } from '../services/cameraSimulator';

export interface UseCameraOptions {
  settings: CameraSettings;
  onNewMediaCaptured: (item: MediaItem) => void;
  showToast: (msg: string, onAction?: () => void, actionLabel?: string) => void;
  onOpenGallery?: () => void;
}

export function useCamera({ settings, onNewMediaCaptured, showToast, onOpenGallery }: UseCameraOptions) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const simulatorCleanupRef = useRef<(() => void) | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordStartTimeRef = useRef<number>(0);
  const recordTimerRef = useRef<number | null>(null);

  // States
  const [isReady, setIsReady] = useState(false);
  const [isSimulator, setIsSimulator] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [exposureLevel, setExposureLevel] = useState<number>(0);
  const [torchActive, setTorchActive] = useState(false);
  const [isShutterActive, setIsShutterActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [screenFlash, setScreenFlash] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{ x: number; y: number } | null>(null);

  const [capabilities, setCapabilities] = useState<CameraCapabilities>({
    hasTorch: false,
    hasZoom: false,
    minZoom: 1,
    maxZoom: 1,
    zoomStep: 0.1,
    currentZoom: 1,
    hasExposure: false,
    minExposure: 0,
    maxExposure: 0,
    exposureStep: 0.1,
    currentExposure: 0,
    facingMode: 'environment',
    deviceLabel: '',
  });

  // Query and enumerate available cameras
  const enumerateCameras = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices(videoInputs);
    } catch (err) {
      console.warn('Failed to enumerate devices:', err);
    }
  }, []);

interface ExtendedTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  zoom?: { min: number; max: number; step: number };
  exposureCompensation?: { min: number; max: number; step: number };
}

  // Update track constraints (zoom, torch, exposure) safely
  const applyTrackConstraint = useCallback(async (constraints: Record<string, unknown>) => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      await (track as unknown as { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [constraints],
      });
    } catch (err) {
      console.warn('Could not apply track constraints:', constraints, err);
    }
  }, []);

  // Start interactive simulated camera stream (for testing or permission-denied fallback)
  const startSimulator = useCallback((desiredFacing = facingMode) => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (simulatorCleanupRef.current) {
      simulatorCleanupRef.current();
      simulatorCleanupRef.current = null;
    }

    const { stream, cleanup } = createSimulatedCameraStream(desiredFacing);
    simulatorCleanupRef.current = cleanup;
    streamRef.current = stream;

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }

    setFacingMode(desiredFacing);
    setIsSimulator(true);
    setPermissionError(null);
    setIsReady(true);

    setCapabilities({
      hasTorch: true,
      hasZoom: true,
      minZoom: 1,
      maxZoom: 5,
      zoomStep: 0.1,
      currentZoom: 1,
      hasExposure: true,
      minExposure: -2,
      maxExposure: 2,
      exposureStep: 0.1,
      currentExposure: 0,
      facingMode: desiredFacing,
      deviceLabel: 'Interactive Camera Simulator (Demo Feed)',
    });
    setZoomLevel(1);
    setExposureLevel(0);
    setTorchActive(false);
  }, [facingMode]);

  // Start or restart camera stream
  const startCamera = useCallback(async (desiredFacing = facingMode, deviceId = settings.selectedDeviceId) => {
    setIsReady(false);
    setPermissionError(null);

    // Stop existing streams
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (simulatorCleanupRef.current) {
      simulatorCleanupRef.current();
      simulatorCleanupRef.current = null;
    }

    try {
      // Build constraints based on resolution setting
      let widthIdeal = 3840;
      let heightIdeal = 2160;

      if (settings.resolution === '1080p') {
        widthIdeal = 1920;
        heightIdeal = 1080;
      } else if (settings.resolution === '720p') {
        widthIdeal = 1280;
        heightIdeal = 720;
      } else if (settings.resolution === '4k' || settings.resolution === 'max') {
        widthIdeal = 3840;
        heightIdeal = 2160;
      }

      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: widthIdeal },
        height: { ideal: heightIdeal },
        frameRate: { ideal: 60, min: 24 },
      };

      if (deviceId) {
        videoConstraints.deviceId = { exact: deviceId };
      } else {
        videoConstraints.facingMode = { ideal: desiredFacing };
      }

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera device access is not supported in this browser window.');
      }

      // Request stream (camera only; mic is requested on video recording)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      // Read capabilities
      const track = stream.getVideoTracks()[0];
      if (track) {
        const settingsActual = track.getSettings();
        const caps = (typeof track.getCapabilities === 'function' ? track.getCapabilities() : {}) as ExtendedTrackCapabilities;

        const hasTorch = Boolean(caps.torch);
        const hasZoom = Boolean(caps.zoom);
        const minZ = caps.zoom?.min ?? 1;
        const maxZ = caps.zoom?.max ?? 1;
        const stepZ = caps.zoom?.step ?? 0.1;
        const hasExp = Boolean(caps.exposureCompensation);
        const minExp = caps.exposureCompensation?.min ?? 0;
        const maxExp = caps.exposureCompensation?.max ?? 0;
        const stepExp = caps.exposureCompensation?.step ?? 0.1;

        const actualFacing = (settingsActual.facingMode as 'user' | 'environment') || desiredFacing;
        setFacingMode(actualFacing);

        setCapabilities({
          hasTorch,
          hasZoom,
          minZoom: minZ,
          maxZoom: maxZ,
          zoomStep: stepZ,
          currentZoom: minZ,
          hasExposure: hasExp,
          minExposure: minExp,
          maxExposure: maxExp,
          exposureStep: stepExp,
          currentExposure: 0,
          facingMode: actualFacing,
          deviceLabel: track.label || 'Default Camera',
        });

        setZoomLevel(minZ);
        setExposureLevel(0);
        setTorchActive(false);
      }

      setIsSimulator(false);
      setIsReady(true);
      enumerateCameras();
    } catch (err: unknown) {
      const error = err as Error;
      console.warn('Physical camera access restricted by browser or permissions:', error?.message || error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError' || error.message?.includes('Permission denied')) {
        setPermissionError('Camera permission was denied. Please allow camera access in Chrome settings, or launch the interactive camera simulator below.');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setPermissionError('No physical camera detected. You can launch the camera simulator to test all features.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setPermissionError('Camera is in use by another app or background process.');
      } else {
        setPermissionError(`Camera could not be started: ${error.message || 'Unknown error'}`);
      }
      setIsReady(false);
    }
  }, [facingMode, settings.resolution, settings.selectedDeviceId, enumerateCameras]);

  // Initial camera mount
  useEffect(() => {
    startCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (simulatorCleanupRef.current) {
        simulatorCleanupRef.current();
      }
      if (recordTimerRef.current) {
        clearInterval(recordTimerRef.current);
      }
    };
  }, []); // Run on mount

  // Flip camera between front (user) and rear (environment)
  const flipCamera = useCallback(async () => {
    triggerHaptic(settings.haptics, 25);
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    if (isSimulator) {
      startSimulator(newFacing);
    } else {
      await startCamera(newFacing, '');
    }
  }, [facingMode, settings.haptics, isSimulator, startSimulator, startCamera]);

  // Handle Torch / Flash toggle
  const toggleTorch = useCallback(async () => {
    triggerHaptic(settings.haptics, 15);
    if (capabilities.hasTorch) {
      const nextState = !torchActive;
      await applyTrackConstraint({ torch: nextState });
      setTorchActive(nextState);
    } else {
      // If front camera has no torch, we can flash screen
      setTorchActive((prev) => !prev);
    }
  }, [capabilities.hasTorch, torchActive, settings.haptics, applyTrackConstraint]);

  // Handle Zoom change
  const setZoom = useCallback(async (newZoom: number) => {
    const clamped = Math.max(capabilities.minZoom, Math.min(capabilities.maxZoom, newZoom));
    setZoomLevel(clamped);

    if (capabilities.hasZoom) {
      await applyTrackConstraint({ zoom: clamped });
    }
  }, [capabilities, applyTrackConstraint]);

  // Handle Exposure change
  const setExposure = useCallback(async (newExp: number) => {
    const clamped = Math.max(capabilities.minExposure, Math.min(capabilities.maxExposure, newExp));
    setExposureLevel(clamped);

    if (capabilities.hasExposure) {
      await applyTrackConstraint({ exposureCompensation: clamped });
    }
  }, [capabilities, applyTrackConstraint]);

  // Tap to focus animation and point calculation
  const handleTapToFocus = useCallback((x: number, y: number) => {
    triggerHaptic(settings.haptics, 12);
    setFocusPoint({ x, y });

    // Auto-dismiss focus box after 2.5s
    setTimeout(() => {
      setFocusPoint((prev) => (prev && prev.x === x && prev.y === y ? null : prev));
    }, 2500);
  }, [settings.haptics]);

  // Helper: crop canvas to match requested aspect ratio
  const cropCanvasToAspectRatio = (sourceCanvas: HTMLCanvasElement, targetAspect: AspectRatio): HTMLCanvasElement => {
    if (targetAspect === 'full') return sourceCanvas;

    let targetRatio = 4 / 3;
    if (targetAspect === '16:9') targetRatio = 16 / 9;
    else if (targetAspect === '1:1') targetRatio = 1;
    else if (targetAspect === '4:3') targetRatio = 4 / 3;

    const srcW = sourceCanvas.width;
    const srcH = sourceCanvas.height;
    const srcRatio = srcW / srcH;

    let cropW = srcW;
    let cropH = srcH;
    let offsetX = 0;
    let offsetY = 0;

    if (srcRatio > targetRatio) {
      cropW = srcH * targetRatio;
      offsetX = (srcW - cropW) / 2;
    } else {
      cropH = srcW / targetRatio;
      offsetY = (srcH - cropH) / 2;
    }

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = Math.round(cropW);
    outputCanvas.height = Math.round(cropH);
    const outCtx = outputCanvas.getContext('2d');
    if (outCtx) {
      outCtx.drawImage(sourceCanvas, offsetX, offsetY, cropW, cropH, 0, 0, cropW, cropH);
      return outputCanvas;
    }
    return sourceCanvas;
  };

  // Capture high-resolution photo
  const capturePhoto = useCallback(async (): Promise<MediaItem | null> => {
    if (!videoRef.current || !streamRef.current) return null;

    setIsShutterActive(true);
    triggerHaptic(settings.haptics, [20, 40, 20]);
    playShutterSound(settings.shutterSound);

    // Screen flash effect for selfies or low light
    if (facingMode === 'user' && settings.flashMode !== 'off') {
      setScreenFlash(true);
      setTimeout(() => setScreenFlash(false), 240);
    }

    setTimeout(() => setIsShutterActive(false), 200);

    const video = videoRef.current;
    const videoWidth = video.videoWidth || 1920;
    const videoHeight = video.videoHeight || 1080;

    const rawCanvas = document.createElement('canvas');
    rawCanvas.width = videoWidth;
    rawCanvas.height = videoHeight;
    const ctx = rawCanvas.getContext('2d');
    if (!ctx) return null;

    // Handle selfie mirror
    const isFrontCamera = facingMode === 'user';
    if (isFrontCamera && settings.mirrorFrontCamera) {
      ctx.translate(videoWidth, 0);
      ctx.scale(-1, 1);
    }

    // Apply digital zoom if hardware zoom isn't native or if zoomed in
    if (!capabilities.hasZoom && zoomLevel > 1) {
      const cropW = videoWidth / zoomLevel;
      const cropH = videoHeight / zoomLevel;
      const startX = (videoWidth - cropW) / 2;
      const startY = (videoHeight - cropH) / 2;
      applyFilterToContext(ctx, settings.activeFilterId);
      ctx.drawImage(video, startX, startY, cropW, cropH, 0, 0, videoWidth, videoHeight);
    } else {
      applyFilterToContext(ctx, settings.activeFilterId);
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    }

    // Apply aspect ratio crop
    const finalCanvas = cropCanvasToAspectRatio(rawCanvas, settings.aspectRatio);

    // Export to JPEG blob
    const blob = await new Promise<Blob | null>((resolve) => {
      finalCanvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
    });

    if (!blob) return null;

    const timestamp = Date.now();
    const dateFormatted = new Date(timestamp).toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `IMG_${dateFormatted}.jpg`;
    const previewUrl = URL.createObjectURL(blob);

    const mediaItem: MediaItem = {
      id: `photo_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
      type: 'photo',
      blob,
      previewUrl,
      filename,
      fileSize: blob.size,
      width: finalCanvas.width,
      height: finalCanvas.height,
      createdAt: timestamp,
      filterId: settings.activeFilterId,
      facingMode,
      mimeType: 'image/jpeg',
    };

    // Save to IndexedDB
    await saveMediaToDb(mediaItem);

    // Direct save to phone storage if auto-save enabled!
    if (settings.autoSaveToDevice) {
      downloadMediaToPhone(mediaItem);
      showToast('Photo saved to phone storage!', onOpenGallery, 'View');
    } else {
      showToast('Photo captured & stored in gallery', onOpenGallery, 'View');
    }

    onNewMediaCaptured(mediaItem);
    return mediaItem;
  }, [
    facingMode,
    settings,
    capabilities.hasZoom,
    zoomLevel,
    onNewMediaCaptured,
    showToast,
  ]);

  // Photo snap trigger with timer support
  const takePhotoWithTimer = useCallback(async () => {
    if (settings.timerSeconds === 0) {
      return capturePhoto();
    }

    let remaining = settings.timerSeconds;
    setCountdown(remaining);
    playShutterSound(false);

    const timerInterval = setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdown(remaining);
        triggerHaptic(settings.haptics, 15);
      } else {
        clearInterval(timerInterval);
        setCountdown(null);
        capturePhoto();
      }
    }, 1000);
  }, [settings.timerSeconds, settings.haptics, capturePhoto]);

  // Start video recording with audio
  const startRecording = useCallback(async () => {
    if (!streamRef.current || isRecording) return;

    try {
      // Request audio stream for microphone recording
      let combinedStream = streamRef.current;
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        const tracks = [...streamRef.current.getVideoTracks(), ...audioStream.getAudioTracks()];
        combinedStream = new MediaStream(tracks);
      } catch (audioErr) {
        console.warn('Microphone permission not granted, continuing with muted video:', audioErr);
      }

      // Pick supported video container format
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2')) {
        mimeType = 'video/mp4;codecs=avc1,mp4a.40.2';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) {
        mimeType = 'video/webm;codecs=vp9,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }

      recordedChunksRef.current = [];
      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 6000000, // 6 Mbps HD
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const durationSec = Math.max(1, Math.round((Date.now() - recordStartTimeRef.current) / 1000));
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const finalBlob = new Blob(recordedChunksRef.current, { type: mimeType });

        const timestamp = Date.now();
        const dateFormatted = new Date(timestamp).toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const filename = `VID_${dateFormatted}.${extension}`;
        const previewUrl = URL.createObjectURL(finalBlob);

        const videoW = videoRef.current?.videoWidth || 1920;
        const videoH = videoRef.current?.videoHeight || 1080;

        const mediaItem: MediaItem = {
          id: `video_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'video',
          blob: finalBlob,
          previewUrl,
          filename,
          fileSize: finalBlob.size,
          width: videoW,
          height: videoH,
          duration: durationSec,
          createdAt: timestamp,
          filterId: settings.activeFilterId,
          facingMode,
          mimeType,
        };

        // Save to IndexedDB
        await saveMediaToDb(mediaItem);

        // Auto-save to phone storage
        if (settings.autoSaveToDevice) {
          downloadMediaToPhone(mediaItem);
          showToast('Video saved to phone storage!', onOpenGallery, 'Scrub Frames');
        } else {
          showToast('Video saved to gallery', onOpenGallery, 'Scrub Frames');
        }

        onNewMediaCaptured(mediaItem);
      };

      recorder.start(1000); // 1-second timeslices
      mediaRecorderRef.current = recorder;
      recordStartTimeRef.current = Date.now();
      setIsRecording(true);
      setIsRecordingPaused(false);
      setRecordingSeconds(0);

      playRecordStartSound(settings.shutterSound);
      triggerHaptic(settings.haptics, [40, 60]);

      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start video recording:', err);
      showToast('Could not start video recording');
    }
  }, [isRecording, settings, facingMode, onNewMediaCaptured, showToast]);

  // Pause or resume video recording
  const pauseResumeRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) return;
    triggerHaptic(settings.haptics, 20);

    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsRecordingPaused(true);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    } else if (mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsRecordingPaused(false);
      recordTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    }
  }, [isRecording, settings.haptics]);

  // Stop video recording
  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || !isRecording) return;

    triggerHaptic(settings.haptics, [30, 30, 40]);
    playRecordStopSound(settings.shutterSound);

    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }

    try {
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    } catch (err) {
      console.warn('Error stopping media recorder:', err);
    }

    setIsRecording(false);
    setIsRecordingPaused(false);
  }, [isRecording, settings.shutterSound, settings.haptics]);

  return {
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
    takePhoto: takePhotoWithTimer,
    startRecording,
    pauseResumeRecording,
    stopRecording,
  };
}
