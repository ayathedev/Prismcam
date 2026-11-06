import React, { useState } from 'react';
import {
  X,
  Share2,
  Trash2,
  HardDriveDownload,
  Calendar,
  Layers,
  Archive,
  ChevronLeft,
  ChevronRight,
  Play,
  Info,
  CheckSquare,
  Square,
  Smartphone,
  Eye,
  Scissors,
  Film,
  Sliders,
} from 'lucide-react';
import { MediaItem, StorageStats } from '../types';
import {
  batchDownloadToPhone,
  downloadMediaToPhone,
  formatBytes,
  shareMediaToPhone,
} from '../services/storage';
import { triggerHaptic } from '../services/audioFeedback';
import { FrameScrubberModal } from './FrameScrubberModal';
import { ImageEditorModal } from './ImageEditorModal';

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaItems: MediaItem[];
  onDeleteMedia: (id: string) => void;
  onNewMediaCaptured?: (item: MediaItem) => void;
  onUpdateMedia?: (item: MediaItem) => void;
  storageStats: StorageStats;
  haptics: boolean;
  showToast: (msg: string) => void;
}

export const GalleryModal: React.FC<GalleryModalProps> = ({
  isOpen,
  onClose,
  mediaItems,
  onDeleteMedia,
  onNewMediaCaptured,
  onUpdateMedia,
  storageStats,
  haptics,
  showToast,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isScrubberOpen, setIsScrubberOpen] = useState(false);
  const [activeScrubVideo, setActiveScrubVideo] = useState<MediaItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeEditPhoto, setActiveEditPhoto] = useState<MediaItem | null>(null);

  if (!isOpen) return null;

  const currentItem: MediaItem | undefined = mediaItems[selectedIndex];

  const handleOpenScrubber = (video: MediaItem) => {
    setActiveScrubVideo(video);
    setIsScrubberOpen(true);
  };

  const handleFrameExported = (newFrame: MediaItem) => {
    // Keep selectedIndex pointing to the video when a new frame is prepended
    setSelectedIndex((prev) => prev + 1);
    onNewMediaCaptured?.(newFrame);
  };

  const handleOpenEditor = (photo: MediaItem) => {
    setActiveEditPhoto(photo);
    setIsEditorOpen(true);
  };

  const handlePhotoEdited = (savedItem: MediaItem, mode: 'copy' | 'replace') => {
    if (mode === 'copy') {
      // Point viewer directly to the new edited copy at index 0
      setSelectedIndex(0);
      onNewMediaCaptured?.(savedItem);
    } else {
      // Updated photo in place - keep selectedIndex where it is
      onUpdateMedia?.(savedItem);
    }
  };

  // Direct phone download
  const handleSaveToPhone = (item: MediaItem) => {
    triggerHaptic(haptics, 15);
    downloadMediaToPhone(item);
    showToast(`Saved ${item.filename} directly to phone storage!`);
  };

  // Android Native Web Share
  const handleShare = async (item: MediaItem) => {
    triggerHaptic(haptics, 15);
    const shared = await shareMediaToPhone(item);
    if (shared) {
      showToast('Opened phone share menu');
    }
  };

  // Delete media item
  const handleDelete = (id: string) => {
    triggerHaptic(haptics, [20, 20]);
    onDeleteMedia(id);
    if (selectedIndex >= mediaItems.length - 1 && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
    showToast('Item deleted from gallery');
  };

  // Toggle selection for bulk actions
  const toggleSelectId = (id: string) => {
    triggerHaptic(haptics, 10);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk save all selected items
  const handleBulkSaveZip = async () => {
    const itemsToExport =
      selectedIds.size > 0
        ? mediaItems.filter((m) => selectedIds.has(m.id))
        : mediaItems;

    if (itemsToExport.length === 0) return;

    triggerHaptic(haptics, 20);
    showToast(`Exporting ${itemsToExport.length} files to phone storage...`);
    await batchDownloadToPhone(itemsToExport);
    showToast(`Export complete! Saved to phone Downloads.`);
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  // Bulk delete selected
  const handleBulkDelete = () => {
    triggerHaptic(haptics, [25, 25]);
    selectedIds.forEach((id) => onDeleteMedia(id));
    setSelectedIds(new Set());
    setIsSelectionMode(false);
    setSelectedIndex(0);
    showToast('Selected items deleted');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col text-white animate-in fade-in duration-150 select-none">
      {/* Top Header */}
      <header className="flex items-center justify-between px-3 pt-safe pb-2 bg-gradient-to-b from-black via-black/80 to-transparent border-b border-white/10">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic(haptics, 10);
              onClose();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10"
            aria-label="Back to Camera"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>Camera Roll</span>
              <span className="text-xs font-normal text-white/50">({mediaItems.length})</span>
            </h2>
            <p className="text-[10px] text-white/40">
              {currentItem
                ? new Date(currentItem.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'No media'}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-1">
          {mediaItems.length > 0 && (
            <>
              {/* Toggle Grid vs Single View */}
              <button
                onClick={() => {
                  triggerHaptic(haptics, 10);
                  setViewMode(viewMode === 'grid' ? 'single' : 'grid');
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10"
                title={viewMode === 'grid' ? 'Single View' : 'Grid View'}
              >
                {viewMode === 'grid' ? <Eye className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
              </button>

              {/* Selection Mode Toggle */}
              <button
                onClick={() => {
                  triggerHaptic(haptics, 10);
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedIds(new Set());
                }}
                className={`min-h-[44px] px-2.5 flex items-center gap-1 rounded-xl text-xs font-medium transition-colors ${
                  isSelectionMode ? 'bg-amber-400 text-black font-bold' : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>{isSelectionMode ? 'Done' : 'Select'}</span>
              </button>
            </>
          )}

          {/* Close Gallery */}
          <button
            onClick={() => {
              triggerHaptic(haptics, 10);
              onClose();
            }}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10"
            aria-label="Close Gallery"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Empty State */}
      {mediaItems.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white/60">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white/30">
            <Smartphone className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-white">No photos or videos yet</h3>
          <p className="text-xs text-white/40 max-w-xs mt-1.5">
            Use the shutter button to take high-res photos or record videos. They will be saved to your phone storage automatically.
          </p>
          <button
            onClick={onClose}
            className="mt-6 px-5 py-2.5 rounded-full bg-amber-400 text-black font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-transform"
          >
            Start Shooting
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Gallery View */
        <div className="flex-1 overflow-y-auto p-2">
          {/* Storage Estimate Banner */}
          <div className="mb-3 px-3 py-2 rounded-2xl bg-neutral-900 border border-white/10 flex items-center justify-between text-xs text-white/70">
            <div className="flex items-center gap-2">
              <HardDriveDownload className="w-4 h-4 text-emerald-400" />
              <span>
                Phone Storage: <strong className="text-white">{formatBytes(storageStats.usedBytes)}</strong> used
              </span>
            </div>
            {mediaItems.length > 1 && (
              <button
                onClick={handleBulkSaveZip}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-semibold hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Export ZIP</span>
              </button>
            )}
          </div>

          {/* Grid of Thumbnails */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
            {mediaItems.map((item, idx) => {
              const isSelected = selectedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleSelectId(item.id);
                    } else {
                      setSelectedIndex(idx);
                      setViewMode('single');
                    }
                  }}
                  className={`group relative aspect-square rounded-xl overflow-hidden bg-neutral-900 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 ring-2 ring-amber-400'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  {item.type === 'video' ? (
                    <div className="relative w-full h-full">
                      <video src={item.previewUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white/90 fill-white/80" />
                      </div>
                      <span className="absolute bottom-1 right-1 text-[9px] font-mono bg-black/80 px-1 py-0.5 rounded text-white font-bold">
                        {item.duration ? `${item.duration}s` : 'VID'}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={item.previewUrl}
                      alt={item.filename}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Multi-select checkbox badge */}
                  {isSelectionMode && (
                    <div className="absolute top-1 right-1">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-amber-400 fill-black" />
                      ) : (
                        <Square className="w-5 h-5 text-white/70" />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Single Item Fullscreen Inspection View */
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* Main Viewer Area */}
          <div className="flex-1 relative flex items-center justify-center bg-black/90 overflow-hidden">
            {currentItem && currentItem.type === 'video' ? (
              <video
                src={currentItem.previewUrl}
                controls
                autoPlay
                playsInline
                className="max-w-full max-h-full object-contain"
              />
            ) : currentItem ? (
              <img
                src={currentItem.previewUrl}
                alt={currentItem.filename}
                className="max-w-full max-h-full object-contain"
              />
            ) : null}

            {/* When viewing a video: Frame-by-Frame Scrubber Quick Button */}
            {currentItem && currentItem.type === 'video' && (
              <button
                onClick={() => {
                  triggerHaptic(haptics, 15);
                  handleOpenScrubber(currentItem);
                }}
                className="absolute top-4 left-4 z-30 px-3.5 py-2 rounded-full bg-neutral-900/95 backdrop-blur-md border border-amber-400/60 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-2xl active:scale-95 transition-all hover:bg-neutral-800"
                title="Scroll frame by frame & export images"
              >
                <Scissors className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                <span>Frame by Frame</span>
              </button>
            )}

            {/* When viewing a photo: Quick Edit Photo Button */}
            {currentItem && currentItem.type === 'photo' && (
              <button
                onClick={() => {
                  triggerHaptic(haptics, 15);
                  handleOpenEditor(currentItem);
                }}
                className="absolute top-4 left-4 z-30 px-3.5 py-2 rounded-full bg-neutral-900/95 backdrop-blur-md border border-amber-400/60 text-amber-300 font-bold text-xs flex items-center gap-1.5 shadow-2xl active:scale-95 transition-all hover:bg-neutral-800"
                title="Edit colors, filters & crop"
              >
                <Sliders className="w-4 h-4 text-amber-400 stroke-[2.5]" />
                <span>Edit Photo</span>
              </button>
            )}

            {/* Edited Photo Indicator Badge */}
            {currentItem &&
              (currentItem.filename.startsWith('EDIT_') || currentItem.id.startsWith('edited_')) && (
                <div className="absolute top-4 right-4 z-30 px-3 py-1 rounded-full bg-amber-400 text-black font-extrabold text-[10px] tracking-wider uppercase shadow-xl flex items-center gap-1">
                  <span>Edited</span>
                </div>
              )}

            {/* Left / Right Navigation Arrows */}
            {selectedIndex > 0 && (
              <button
                onClick={() => {
                  triggerHaptic(haptics, 10);
                  setSelectedIndex((prev) => prev - 1);
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 border border-white/20 text-white/80 hover:text-white backdrop-blur-md active:scale-95"
                aria-label="Previous Media"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {selectedIndex < mediaItems.length - 1 && (
              <button
                onClick={() => {
                  triggerHaptic(haptics, 10);
                  setSelectedIndex((prev) => prev + 1);
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 border border-white/20 text-white/80 hover:text-white backdrop-blur-md active:scale-95"
                aria-label="Next Media"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Info Drawer Overlay */}
            {showInfo && currentItem && (
              <div className="absolute inset-x-3 bottom-3 z-40 bg-neutral-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-4 shadow-2xl text-xs space-y-2 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-white uppercase tracking-wider">
                    File Details
                  </span>
                  <button
                    onClick={() => setShowInfo(false)}
                    className="p-1 text-white/60 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 text-white/70">
                  <div>
                    <span className="text-white/40 block">Filename</span>
                    <span className="font-mono text-white text-[11px] truncate block">
                      {currentItem.filename}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Resolution</span>
                    <span className="font-mono text-white">
                      {currentItem.width} x {currentItem.height}
                    </span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Size</span>
                    <span className="font-mono text-white">{formatBytes(currentItem.fileSize)}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block">Date & Time</span>
                    <span className="font-mono text-white text-[11px]">
                      {new Date(currentItem.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {currentItem.duration && (
                    <div>
                      <span className="text-white/40 block">Duration</span>
                      <span className="font-mono text-white">{currentItem.duration} seconds</span>
                    </div>
                  )}
                  <div>
                    <span className="text-white/40 block">Camera Facing</span>
                    <span className="capitalize text-white">{currentItem.facingMode} Camera</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Thumbnails Scroller Bar */}
          <div className="h-16 bg-neutral-950 border-t border-white/10 px-2 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {mediaItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => {
                  triggerHaptic(haptics, 10);
                  setSelectedIndex(idx);
                }}
                className={`relative shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  idx === selectedIndex
                    ? 'border-amber-400 scale-105 shadow-md'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={item.previewUrl}
                  alt="thumb"
                  className="w-full h-full object-cover"
                />
                {item.type === 'video' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="w-3.5 h-3.5 fill-white text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Primary Action Buttons Bar */}
          {currentItem && (
            <div className="bg-neutral-900 border-t border-white/10 px-4 py-3 pb-safe flex items-center justify-between">
              {/* Info Button */}
              <button
                onClick={() => {
                  triggerHaptic(haptics, 10);
                  setShowInfo(!showInfo);
                }}
                className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center text-white/70 hover:text-white"
                title="File Details"
              >
                <Info className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Info</span>
              </button>

              {/* Share to Phone (WhatsApp / Photos / Drive) */}
              <button
                onClick={() => handleShare(currentItem)}
                className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center text-white/70 hover:text-white"
                title="Share to Apps"
              >
                <Share2 className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Share</span>
              </button>

              {/* If Video: Dedicated Frame Scrubber Button */}
              {currentItem.type === 'video' && (
                <button
                  onClick={() => {
                    triggerHaptic(haptics, 12);
                    handleOpenScrubber(currentItem);
                  }}
                  className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center text-amber-400 hover:text-amber-300"
                  title="Scroll Frame by Frame & Export Images"
                >
                  <Scissors className="w-5 h-5 stroke-[2.5]" />
                  <span className="text-[10px] mt-0.5 font-bold">Frames</span>
                </button>
              )}

              {/* If Photo: Dedicated Edit Button */}
              {currentItem.type === 'photo' && (
                <button
                  onClick={() => {
                    triggerHaptic(haptics, 12);
                    handleOpenEditor(currentItem);
                  }}
                  className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center text-amber-400 hover:text-amber-300"
                  title="Edit Colors, Filters & Crop"
                >
                  <Sliders className="w-5 h-5 stroke-[2.5]" />
                  <span className="text-[10px] mt-0.5 font-bold">Edit</span>
                </button>
              )}

              {/* Save directly to phone storage (Prominent Primary Action) */}
              <button
                onClick={() => handleSaveToPhone(currentItem)}
                className="min-h-[44px] px-5 py-2 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black font-bold text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 transition-transform"
                title="Save directly into phone storage (Downloads)"
              >
                <HardDriveDownload className="w-4 h-4 stroke-[2.5]" />
                <span>Save to Phone</span>
              </button>

              {/* Delete Button */}
              <button
                onClick={() => handleDelete(currentItem.id)}
                className="min-h-[44px] min-w-[44px] flex flex-col items-center justify-center text-red-400/80 hover:text-red-400"
                title="Delete item"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">Delete</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Multi-Selection Bottom Action Bar */}
      {isSelectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-50 bg-neutral-900 border-t border-amber-400/40 p-4 pb-safe flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom duration-150">
          <span className="text-xs font-bold text-white">
            {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 rounded-xl bg-red-950 text-red-300 border border-red-500/40 text-xs font-semibold flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <button
              onClick={handleBulkSaveZip}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <HardDriveDownload className="w-4 h-4" />
              <span>Save to Phone (ZIP)</span>
            </button>
          </div>
        </div>
      )}

      {/* Video Frame-by-Frame Inspector & Exporter Modal */}
      {activeScrubVideo && isScrubberOpen && (
        <FrameScrubberModal
          isOpen={isScrubberOpen}
          onClose={() => {
            setIsScrubberOpen(false);
            setActiveScrubVideo(null);
          }}
          videoItem={activeScrubVideo}
          onFrameExported={handleFrameExported}
          haptics={haptics}
          showToast={showToast}
        />
      )}

      {/* Image Color & Crop Editor Modal */}
      {activeEditPhoto && isEditorOpen && (
        <ImageEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setActiveEditPhoto(null);
          }}
          photoItem={activeEditPhoto}
          onSaveEdited={handlePhotoEdited}
          haptics={haptics}
          showToast={showToast}
        />
      )}
    </div>
  );
};
