import JSZip from 'jszip';
import { MediaItem, StorageStats } from '../types';

const DB_NAME = 'prismcam_db';
const DB_VERSION = 1;
const STORE_NAME = 'media';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a photo or video record to IndexedDB
 */
export async function saveMediaToDb(item: MediaItem): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    // Don't persist object URLs in DB, persist blob and recreate on retrieval
    const record = {
      ...item,
      previewUrl: '', // ephemeral, created upon loading
    };
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve all captured photos and videos sorted newest first
 */
export async function getAllMediaFromDb(): Promise<MediaItem[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    const request = index.openCursor(null, 'prev');
    const results: MediaItem[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        const value = cursor.value;
        const previewUrl = URL.createObjectURL(value.blob);
        results.push({
          ...value,
          previewUrl,
        });
        cursor.continue();
      } else {
        resolve(results);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a media item from IndexedDB
 */
export async function deleteMediaFromDb(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all media from IndexedDB
 */
export async function clearAllMediaFromDb(): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieve storage estimate and app item statistics
 */
export async function getStorageStats(): Promise<StorageStats> {
  let usedBytes = 0;
  let quotaBytes = 0;
  let percentage = 0;

  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      usedBytes = estimate.usage || 0;
      quotaBytes = estimate.quota || 0;
      percentage = quotaBytes > 0 ? (usedBytes / quotaBytes) * 100 : 0;
    } catch {
      // Ignore estimation errors
    }
  }

  // Count items
  let itemCount = 0;
  try {
    const db = await openDatabase();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    itemCount = await new Promise<number>((resolve) => {
      const countReq = store.count();
      countReq.onsuccess = () => resolve(countReq.result);
      countReq.onerror = () => resolve(0);
    });
  } catch {
    itemCount = 0;
  }

  return {
    usedBytes,
    quotaBytes,
    percentage,
    itemCount,
  };
}

/**
 * Trigger immediate download of media directly to phone storage.
 * On Chrome on Android, this saves directly into the device's Downloads/Camera folder
 * and appears in the notification shade as "Download complete".
 */
export function downloadMediaToPhone(item: MediaItem): void {
  const link = document.createElement('a');
  const downloadUrl = URL.createObjectURL(item.blob);
  link.href = downloadUrl;
  link.download = item.filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  // Clean up
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  }, 1000);
}

/**
 * Share media file via Android Native Web Share API.
 * Android Chrome forwards this to native apps: Google Photos, Files by Google, WhatsApp, Drive, etc.
 */
export async function shareMediaToPhone(item: MediaItem): Promise<boolean> {
  try {
    const file = new File([item.blob], item.filename, { type: item.mimeType });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: item.filename,
        text: `Captured with PrismCam (${item.type === 'video' ? 'Video' : 'Photo'})`,
      });
      return true;
    } else if (navigator.share) {
      // Fallback share with URL/text if file share is unsupported
      const tempUrl = URL.createObjectURL(item.blob);
      await navigator.share({
        title: item.filename,
        text: `Captured with PrismCam`,
        url: tempUrl,
      });
      setTimeout(() => URL.revokeObjectURL(tempUrl), 5000);
      return true;
    }
  } catch (err: unknown) {
    if ((err as Error)?.name === 'AbortError') {
      // User cancelled share dialog, normal behavior
      return false;
    }
    console.warn('Native share failed, falling back to download:', err);
  }

  // Fallback to direct phone download
  downloadMediaToPhone(item);
  return true;
}

/**
 * Export multiple media items as a single zip file to phone storage
 */
export async function batchDownloadToPhone(items: MediaItem[]): Promise<void> {
  if (items.length === 0) return;

  if (items.length === 1) {
    downloadMediaToPhone(items[0]);
    return;
  }

  const zip = new JSZip();
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const folder = zip.folder(`PrismCam_${dateStr}`) || zip;

  for (const item of items) {
    folder.file(item.filename, item.blob);
  }

  const content = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipFilename = `PrismCam_Export_${dateStr}.zip`;
  const link = document.createElement('a');
  const url = URL.createObjectURL(content);
  link.href = url;
  link.download = zipFilename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Format bytes into human-readable string (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
