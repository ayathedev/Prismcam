import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ChevronLeft,
  HardDriveDownload,
  Share2,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  RotateCcw,
  Sliders,
  Sparkles,
  Crop,
  SunMedium,
  Contrast,
  Droplet,
  Flame,
  CircleDot,
  Eye,
  Check,
  Heart,
  Droplets,
  Wand2,
  Sun,
  Power,
  Focus,
} from 'lucide-react';
import { MediaItem } from '../types';
import {
  DEFAULT_ADJUSTMENTS,
  FILTER_PRESETS,
  FilterPreset,
  ImageAdjustments,
  renderEditedImageToCanvas,
} from '../services/imageEditor';
import { BEAUTY_PRESETS, BeautyPreset } from '../services/filters';
import { downloadMediaToPhone, saveMediaToDb, shareMediaToPhone } from '../services/storage';
import { triggerHaptic } from '../services/audioFeedback';

interface ImageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoItem: MediaItem;
  onSaveEdited: (editedItem: MediaItem, mode: 'copy' | 'replace') => void;
  haptics: boolean;
  showToast: (msg: string) => void;
}

type EditorTab = 'tune' | 'filters' | 'beauty' | 'crop';
type TuneProperty = 'brightness' | 'contrast' | 'saturation' | 'warmth' | 'exposure' | 'vignette';

export const ImageEditorModal: React.FC<ImageEditorModalProps> = ({
  isOpen,
  onClose,
  photoItem,
  onSaveEdited,
  haptics,
  showToast,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | ImageBitmap | null>(null);

  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [activeTab, setActiveTab] = useState<EditorTab>('tune');
  const [activeTuneProp, setActiveTuneProp] = useState<TuneProperty>('brightness');
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  // Robust image loading with createImageBitmap and fallback
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;
    setImageLoaded(false);

    const loadImage = async () => {
      // 1. First priority: Decode directly from photoItem.blob using createImageBitmap
      if (photoItem.blob && typeof createImageBitmap !== 'undefined') {
        try {
          const bmp = await createImageBitmap(photoItem.blob);
          if (isSubscribed) {
            sourceImageRef.current = bmp;
            setImageLoaded(true);
            setAdjustments(DEFAULT_ADJUSTMENTS);
            return;
          } else {
            bmp.close();
            return;
          }
        } catch (bitmapErr) {
          console.warn('createImageBitmap failed, falling back to Image():', bitmapErr);
        }
      }

      // 2. Fallback: HTMLImageElement without crossOrigin (same-origin Blob URL)
      const img = new Image();
      const objectUrl = photoItem.blob ? URL.createObjectURL(photoItem.blob) : photoItem.previewUrl;
      img.src = objectUrl;

      img.onload = () => {
        if (!isSubscribed) return;
        sourceImageRef.current = img;
        setImageLoaded(true);
        setAdjustments(DEFAULT_ADJUSTMENTS);
      };

      img.onerror = (e) => {
        console.error('Failed to load image in editor:', e);
        if (isSubscribed) {
          showToast('Failed to load photo for editing');
        }
      };
    };

    loadImage();

    return () => {
      isSubscribed = false;
      if (
        sourceImageRef.current &&
        'close' in sourceImageRef.current &&
        typeof sourceImageRef.current.close === 'function'
      ) {
        try {
          sourceImageRef.current.close();
        } catch {}
      }
      sourceImageRef.current = null;
      setImageLoaded(false);
    };
  }, [isOpen, photoItem, showToast]);

  // Re-render canvas whenever adjustments or comparison state change
  const updateCanvasPreview = useCallback(() => {
    if (!canvasRef.current || !sourceImageRef.current || !imageLoaded) return;

    const currentAdj = isComparing ? DEFAULT_ADJUSTMENTS : adjustments;
    renderEditedImageToCanvas(sourceImageRef.current, currentAdj, canvasRef.current);
  }, [adjustments, isComparing, imageLoaded]);

  useEffect(() => {
    updateCanvasPreview();
  }, [updateCanvasPreview]);

  // Update specific slider property
  const handleSliderChange = (prop: TuneProperty, value: number) => {
    triggerHaptic(haptics, 5);
    setAdjustments((prev) => ({
      ...prev,
      [prop]: value,
    }));
  };

  // Rotate 90 degrees clockwise
  const handleRotate = () => {
    triggerHaptic(haptics, 15);
    setAdjustments((prev) => ({
      ...prev,
      rotation: ((prev.rotation + 90) % 360) as 0 | 90 | 180 | 270,
    }));
  };

  // Flip horizontal
  const handleFlipHorizontal = () => {
    triggerHaptic(haptics, 15);
    setAdjustments((prev) => ({
      ...prev,
      flipH: !prev.flipH,
    }));
  };

  // Flip vertical
  const handleFlipVertical = () => {
    triggerHaptic(haptics, 15);
    setAdjustments((prev) => ({
      ...prev,
      flipV: !prev.flipV,
    }));
  };

  // Reset all adjustments
  const handleReset = () => {
    triggerHaptic(haptics, 20);
    setAdjustments(DEFAULT_ADJUSTMENTS);
    showToast('Reset to original photo');
  };

  // Save edited photo to phone storage & gallery
  const handleSave = async (mode: 'copy' | 'replace' = 'copy'): Promise<MediaItem | null> => {
    if (!sourceImageRef.current || !imageLoaded) {
      showToast('Photo is still loading, please wait a moment...');
      return null;
    }

    setIsSaving(true);
    triggerHaptic(haptics, [20, 40, 20]);

    try {
      // Render at full original resolution
      const fullCanvas = await renderEditedImageToCanvas(sourceImageRef.current, adjustments);

      const blob = await new Promise<Blob | null>((resolve) => {
        fullCanvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
      });

      if (!blob) {
        setIsSaving(false);
        showToast('Could not process edited photo');
        return null;
      }

      const timestamp = Date.now();
      const cleanBaseName = photoItem.filename.replace(/\.[^/.]+$/, '').replace(/^EDIT_/, '');
      const filename =
        mode === 'copy'
          ? `EDIT_${cleanBaseName}_${timestamp.toString().slice(-4)}.jpg`
          : photoItem.filename;
      const previewUrl = URL.createObjectURL(blob);

      const savedItem: MediaItem = {
        id:
          mode === 'copy'
            ? `edited_${timestamp}_${Math.random().toString(36).substring(2, 7)}`
            : photoItem.id,
        type: 'photo',
        blob,
        previewUrl,
        filename,
        fileSize: blob.size,
        width: fullCanvas.width,
        height: fullCanvas.height,
        createdAt: mode === 'copy' ? timestamp : photoItem.createdAt,
        facingMode: photoItem.facingMode,
        mimeType: 'image/jpeg',
      };

      // 1. Save to IndexedDB
      await saveMediaToDb(savedItem);

      // 2. Direct download to phone storage (Downloads)
      downloadMediaToPhone(savedItem);

      setIsSaving(false);
      showToast(
        mode === 'copy'
          ? 'New edited copy saved to Phone Downloads & Gallery!'
          : 'Photo changes saved to Phone Downloads & Gallery!'
      );
      onSaveEdited(savedItem, mode);
      onClose();

      return savedItem;
    } catch (err) {
      console.error('Error saving edited photo:', err);
      setIsSaving(false);
      showToast('Failed to save edited photo');
      return null;
    }
  };

  // Share edited photo
  const handleShare = async () => {
    const item = await handleSave('copy');
    if (item) {
      await shareMediaToPhone(item);
    }
  };

  if (!isOpen) return null;

  // Property configuration for Tune sliders
  const tuneConfig: Record<
    TuneProperty,
    { label: string; min: number; max: number; unit: string; icon: React.ReactNode }
  > = {
    brightness: { label: 'Brightness', min: -50, max: 50, unit: '', icon: <SunMedium className="w-4 h-4" /> },
    contrast: { label: 'Contrast', min: -50, max: 50, unit: '', icon: <Contrast className="w-4 h-4" /> },
    saturation: { label: 'Saturation', min: -100, max: 100, unit: '', icon: <Droplet className="w-4 h-4" /> },
    warmth: { label: 'Warmth', min: -50, max: 50, unit: '', icon: <Flame className="w-4 h-4" /> },
    exposure: { label: 'Exposure', min: -50, max: 50, unit: ' EV', icon: <SunMedium className="w-4 h-4" /> },
    vignette: { label: 'Vignette', min: 0, max: 100, unit: '%', icon: <CircleDot className="w-4 h-4" /> },
  };

  const currentPropConfig = tuneConfig[activeTuneProp];
  const currentValue = adjustments[activeTuneProp];

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-in fade-in duration-150 select-none">
      {/* Top Header Overlay */}
      <header className="absolute top-0 inset-x-0 z-40 flex items-center justify-between px-3 pt-safe pb-3 bg-black/40 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic(haptics, 10);
              onClose();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10"
            aria-label="Cancel editing"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Photo Editor</span>
            </h2>
            <p className="text-[10px] text-white/50 truncate max-w-[180px]">
              {photoItem.filename}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2">
          {/* Reset All */}
          <button
            onClick={handleReset}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10"
            title="Reset All Adjustments"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Share directly */}
          <button
            onClick={handleShare}
            disabled={isSaving}
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-50"
            title="Share edited photo"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Save to Phone (Copy) */}
          <button
            onClick={() => handleSave('copy')}
            disabled={isSaving || !imageLoaded}
            className="min-h-[38px] px-3.5 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 transition-all disabled:opacity-50"
            title="Save as a new edited copy in phone storage and gallery"
          >
            <HardDriveDownload className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isSaving ? 'Saving...' : 'Save Copy'}</span>
          </button>
        </div>
      </header>

      {/* Main Canvas Preview Area */}
      <div 
        className="relative flex-1 bg-neutral-950 flex items-center justify-center p-3 overflow-hidden cursor-pointer"
        onMouseDown={() => setIsComparing(true)}
        onMouseUp={() => setIsComparing(false)}
        onMouseLeave={() => setIsComparing(false)}
        onTouchStart={() => setIsComparing(true)}
        onTouchEnd={() => setIsComparing(false)}
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-all duration-75"
        />

        {/* Floating Compare Button */}
        <div className="absolute top-4 right-4 z-20">
          <div
            className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md border transition-all duration-200 ${
              isComparing 
                ? 'bg-amber-400 text-black border-amber-300 shadow-lg scale-110' 
                : 'bg-black/60 text-white border-white/20'
            }`}
          >
            <Eye className={`w-4 h-4 ${isComparing ? 'animate-pulse' : ''}`} />
            <span>{isComparing ? 'ORIGINAL' : 'HOLD TO COMPARE'}</span>
          </div>
        </div>

        {/* Loading Spinner */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-20">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-xs text-white/70">Loading photo...</span>
          </div>
        )}

        {/* Saving Overlay */}
        {isSaving && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm z-30">
            <div className="w-10 h-10 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-sm font-bold text-white">Saving photo edits...</span>
            <span className="text-xs text-white/60 mt-1">Exporting to Phone Downloads & Gallery</span>
          </div>
        )}

        {/* Comparing Hint (Bottom) */}
        {!isComparing && imageLoaded && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-50 animate-bounce">
            <span className="text-[10px] font-medium tracking-widest text-white/80 uppercase px-2 py-1 rounded bg-black/40">
              Long press image to compare
            </span>
          </div>
        )}
      </div>

      {/* Editing Controls Deck Overlay */}
      <div className="absolute bottom-0 inset-x-0 z-40 bg-neutral-900/60 backdrop-blur-xl border-t border-white/10 px-3 pt-3 pb-safe flex flex-col gap-3">
        {/* Dynamic Controls based on Active Tab */}
        {activeTab === 'tune' && (
          <div className="flex flex-col gap-2.5">
            {/* Active Slider Readout & Input */}
            <div className="flex flex-col gap-1 px-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white/90 flex items-center gap-1.5 capitalize">
                  {currentPropConfig.icon}
                  <span>{currentPropConfig.label}</span>
                </span>
                <span className="font-mono text-amber-400 font-bold">
                  {currentValue > 0 ? `+${currentValue}` : currentValue}
                  {currentPropConfig.unit}
                </span>
              </div>

              {/* Slider */}
              <div className="flex items-center gap-3 py-1">
                <span className="text-[10px] font-mono text-white/40">
                  {currentPropConfig.min}
                </span>
                <input
                  type="range"
                  min={currentPropConfig.min}
                  max={currentPropConfig.max}
                  value={currentValue}
                  onChange={(e) => handleSliderChange(activeTuneProp, parseInt(e.target.value, 10))}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <span className="text-[10px] font-mono text-white/40">
                  {currentPropConfig.max > 0 ? `+${currentPropConfig.max}` : currentPropConfig.max}
                </span>
              </div>
            </div>

            {/* Sub-selector row for Tune properties */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {(
                [
                  'brightness',
                  'contrast',
                  'saturation',
                  'warmth',
                  'exposure',
                  'vignette',
                ] as TuneProperty[]
              ).map((prop) => {
                const isSelected = activeTuneProp === prop;
                const isModified = adjustments[prop] !== 0;
                return (
                  <button
                    key={prop}
                    onClick={() => {
                      triggerHaptic(haptics, 10);
                      setActiveTuneProp(prop);
                    }}
                    className={`min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-black shadow-md scale-105'
                        : isModified
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {tuneConfig[prop].icon}
                    <span className="capitalize">{tuneConfig[prop].label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'filters' && (
          <div className="flex flex-col gap-2">
            <span className="text-[11px] text-white/50 px-1">Select Color Preset Look</span>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              {FILTER_PRESETS.map((preset: FilterPreset) => {
                const isSelected = adjustments.filterId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      triggerHaptic(haptics, 12);
                      setAdjustments((prev) => ({
                        ...prev,
                        filterId: preset.id,
                        ...preset.adjustments,
                      }));
                    }}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-2xl text-xs font-medium whitespace-nowrap flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-black font-bold shadow-lg scale-105'
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
          </div>
        )}

        {activeTab === 'crop' && (
          <div className="flex flex-col gap-3">
            {/* Transform Buttons (Rotate 90°, Flip H, Flip V) */}
            <div className="flex items-center justify-around py-1 border-b border-white/10 pb-2.5">
              <button
                onClick={handleRotate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold text-white transition-all"
              >
                <RotateCw className="w-4 h-4 text-amber-400" />
                <span>Rotate 90°</span>
              </button>

              <button
                onClick={handleFlipHorizontal}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  adjustments.flipH ? 'bg-amber-400 text-black' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <FlipHorizontal className="w-4 h-4" />
                <span>Flip H</span>
              </button>

              <button
                onClick={handleFlipVertical}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  adjustments.flipV ? 'bg-amber-400 text-black' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <FlipVertical className="w-4 h-4" />
                <span>Flip V</span>
              </button>
            </div>

            {/* Aspect Ratio Presets */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {(
                [
                  { id: 'original', label: 'Free / Original' },
                  { id: '1:1', label: '1:1 Square' },
                  { id: '4:3', label: '4:3 Standard' },
                  { id: '16:9', label: '16:9 Widescreen' },
                  { id: '9:16', label: '9:16 Story' },
                  { id: '3:2', label: '3:2 Classic' },
                ] as { id: ImageAdjustments['cropAspect']; label: string }[]
              ).map((aspect) => {
                const isSelected = adjustments.cropAspect === aspect.id;
                return (
                  <button
                    key={aspect.id}
                    onClick={() => {
                      triggerHaptic(haptics, 10);
                      setAdjustments((prev) => ({
                        ...prev,
                        cropAspect: aspect.id,
                      }));
                    }}
                    className={`min-h-[34px] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-amber-400 text-black font-bold shadow-md scale-105'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {aspect.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'beauty' && (
          <div className="flex flex-col gap-3">
            {/* Presets Row */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] text-white/50 px-1 flex items-center gap-1">
                <Wand2 className="w-3 h-3 text-pink-400" />
                Select Beauty Look
              </span>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                {BEAUTY_PRESETS.map((preset: BeautyPreset) => {
                  const isSelected = adjustments.beautyPreset === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => {
                        triggerHaptic(haptics, 12);
                        setAdjustments((prev) => ({
                          ...prev,
                          beautyPreset: preset.id,
                          beautySmooth: preset.smoothLevel,
                          beautyRosy: preset.rosyLevel,
                          beautyGlow: preset.glowLevel,
                          beautyBrighten: preset.brightenLevel,
                          beautySlim: preset.slimLevel,
                          beautyEnlargeEye: preset.enlargeEyeLevel,
                          beautyPortraitDepth: preset.portraitDepthLevel,
                        }));
                      }}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
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

              {/* Active Look Description */}
              {adjustments.beautyPreset !== 'none' && adjustments.beautyPreset !== 'custom' && (
                <p className="text-[11px] text-pink-300/80 italic px-1">
                  {BEAUTY_PRESETS.find((p) => p.id === adjustments.beautyPreset)?.description}
                </p>
              )}
            </div>

            {/* Beauty Sliders */}
            <div className="flex flex-col gap-2.5 px-1 max-h-[280px] overflow-y-auto pr-1 py-1 custom-scrollbar">

              {/* Skin Smoothing */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white/90 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-pink-300" />
                    <span>Skin Smoothing</span>
                  </span>
                  <span className="font-mono text-pink-400 font-bold">{adjustments.beautySmooth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.beautySmooth}
                  onChange={(e) => {
                    triggerHaptic(haptics, 4);
                    setAdjustments((prev) => ({
                      ...prev,
                      beautyPreset: 'custom',
                      beautySmooth: parseInt(e.target.value, 10),
                    }));
                  }}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
              </div>

              {/* Rosy Blush */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white/90 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/40" />
                    <span>Rosy Blush Tone</span>
                  </span>
                  <span className="font-mono text-rose-400 font-bold">{adjustments.beautyRosy}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.beautyRosy}
                  onChange={(e) => {
                    triggerHaptic(haptics, 4);
                    setAdjustments((prev) => ({
                      ...prev,
                      beautyPreset: 'custom',
                      beautyRosy: parseInt(e.target.value, 10),
                    }));
                  }}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
              </div>

              {/* Dream Glow */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white/90 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Dream Glow Diffusion</span>
                  </span>
                  <span className="font-mono text-amber-300 font-bold">{adjustments.beautyGlow}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.beautyGlow}
                  onChange={(e) => {
                    triggerHaptic(haptics, 4);
                    setAdjustments((prev) => ({
                      ...prev,
                      beautyPreset: 'custom',
                      beautyGlow: parseInt(e.target.value, 10),
                    }));
                  }}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Skin Brighten */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white/90 flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-sky-300" />
                    <span>Skin Brighten & Clarity</span>
                  </span>
                  <span className="font-mono text-sky-300 font-bold">{adjustments.beautyBrighten}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.beautyBrighten}
                  onChange={(e) => {
                    triggerHaptic(haptics, 4);
                    setAdjustments((prev) => ({
                      ...prev,
                      beautyPreset: 'custom',
                      beautyBrighten: parseInt(e.target.value, 10),
                    }));
                  }}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              {/* Face Slimming */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white/90 flex items-center gap-1.5">
                    <Power className="w-3.5 h-3.5 text-indigo-300 rotate-180" />
                    <span>Face Slimming</span>
                  </span>
                  <span className="font-mono text-indigo-300 font-bold">{adjustments.beautySlim}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.beautySlim}
                  onChange={(e) => {
                    triggerHaptic(haptics, 4);
                    setAdjustments((prev) => ({
                      ...prev,
                      beautyPreset: 'custom',
                      beautySlim: parseInt(e.target.value, 10),
                    }));
                  }}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                />
              </div>

              {/* Big Eyes */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white/90 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Make Eyes Bigger</span>
                  </span>
                  <span className="font-mono text-emerald-300 font-bold">{adjustments.beautyEnlargeEye}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.beautyEnlargeEye}
                  onChange={(e) => {
                    triggerHaptic(haptics, 4);
                    setAdjustments((prev) => ({
                      ...prev,
                      beautyPreset: 'custom',
                      beautyEnlargeEye: parseInt(e.target.value, 10),
                    }));
                  }}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
              </div>

              {/* Portrait Depth / Bokeh */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white/90 flex items-center gap-1.5">
                    <Focus className="w-3.5 h-3.5 text-blue-400" />
                    <span>Portrait Depth (Bokeh)</span>
                  </span>
                  <span className="font-mono text-blue-400 font-bold">{adjustments.beautyPortraitDepth}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={adjustments.beautyPortraitDepth}
                  onChange={(e) => {
                    triggerHaptic(haptics, 4);
                    setAdjustments((prev) => ({
                      ...prev,
                      beautyPreset: 'custom',
                      beautyPortraitDepth: parseInt(e.target.value, 10),
                    }));
                  }}
                  className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Primary Bottom Navigation Bar: Tune | Filters | Beauty | Crop */}
        <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-white/10">
          <button
            onClick={() => {
              triggerHaptic(haptics, 10);
              setActiveTab('tune');
            }}
            className={`min-h-[44px] py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'tune'
                ? 'bg-white/15 text-amber-400 font-bold border border-amber-400/40'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span className="text-[10px]">Tune</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic(haptics, 10);
              setActiveTab('filters');
            }}
            className={`min-h-[44px] py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'filters'
                ? 'bg-white/15 text-amber-400 font-bold border border-amber-400/40'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px]">Filters</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic(haptics, 10);
              setActiveTab('beauty');
            }}
            className={`min-h-[44px] py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'beauty'
                ? 'bg-pink-500/25 text-pink-400 font-bold border border-pink-400/50'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span className="text-[10px]">Beauty</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic(haptics, 10);
              setActiveTab('crop');
            }}
            className={`min-h-[44px] py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'crop'
                ? 'bg-white/15 text-amber-400 font-bold border border-amber-400/40'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Crop className="w-4 h-4" />
            <span className="text-[10px]">Crop</span>
          </button>
        </div>

        {/* Bottom Thumb-Friendly Save Actions */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/10">
          <button
            onClick={() => handleSave('copy')}
            disabled={isSaving || !imageLoaded}
            className="flex-1 min-h-[44px] px-3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            title="Save as a new edited copy in phone storage and gallery"
          >
            <HardDriveDownload className="w-4 h-4 stroke-[2.5]" />
            <span>{isSaving ? 'Saving...' : 'Save as Copy'}</span>
          </button>

          <button
            onClick={() => handleSave('replace')}
            disabled={isSaving || !imageLoaded}
            className="flex-1 min-h-[44px] px-3 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-black font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            title="Update and overwrite this photo with your edits"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
