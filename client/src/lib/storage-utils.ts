/**
 * Storage Management Utilities
 * Handles storage quota, cache management, and persistent storage
 */

export interface StorageEstimate {
  usage: number;
  quota: number;
  usagePercent: number;
  usageMB: number;
  quotaGB: number;
  freeGB: number;
}

export interface CacheInfo {
  name: string;
  size: number;
  entries: number;
}

/**
 * Get storage usage estimate
 */
export async function getStorageEstimate(): Promise<StorageEstimate> {
  if (!navigator.storage || !navigator.storage.estimate) {
    return {
      usage: 0,
      quota: 0,
      usagePercent: 0,
      usageMB: 0,
      quotaGB: 0,
      freeGB: 0,
    };
  }

  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage || 0;
  const quota = estimate.quota || 0;
  const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;
  const usageMB = usage / (1024 * 1024);
  const quotaGB = quota / (1024 * 1024 * 1024);
  const freeGB = (quota - usage) / (1024 * 1024 * 1024);

  return {
    usage,
    quota,
    usagePercent,
    usageMB,
    quotaGB,
    freeGB,
  };
}

/**
 * Get all cache storage info
 */
export async function getCacheStorageInfo(): Promise<CacheInfo[]> {
  if (!('caches' in window)) {
    return [];
  }

  const cacheNames = await caches.keys();
  const cacheInfos: CacheInfo[] = [];

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    // Estimate cache size (rough estimate based on number of entries)
    // Actual size calculation would require fetching each response
    const estimatedSize = keys.length * 100 * 1024; // ~100KB per entry average

    cacheInfos.push({
      name: cacheName,
      size: estimatedSize,
      entries: keys.length,
    });
  }

  return cacheInfos;
}

/**
 * Clear all cache storage
 */
export async function clearAllCaches(): Promise<number> {
  if (!('caches' in window)) {
    return 0;
  }

  const cacheNames = await caches.keys();
  let deletedCount = 0;

  for (const cacheName of cacheNames) {
    const deleted = await caches.delete(cacheName);
    if (deleted) {
      deletedCount++;
    }
  }

  return deletedCount;
}

/**
 * Request persistent storage
 */
export async function requestPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persist) {
    return false;
  }

  try {
    const isPersisted = await navigator.storage.persist();
    return isPersisted;
  } catch (error) {
    console.error("Failed to request persistent storage:", error);
    return false;
  }
}

/**
 * Check if storage is already persisted
 */
export async function isPersistentStorage(): Promise<boolean> {
  if (!navigator.storage || !navigator.storage.persisted) {
    return false;
  }

  try {
    return await navigator.storage.persisted();
  } catch (error) {
    console.error("Failed to check persistent storage:", error);
    return false;
  }
}

/**
 * Get IndexedDB database size estimate
 */
export async function getIndexedDBSize(): Promise<{ name: string; size: number }[]> {
  if (!('indexedDB' in window)) {
    return [];
  }

  // Get all database names
  const databases = await indexedDB.databases();
  const dbSizes: { name: string; size: number }[] = [];

  // Note: Actual size calculation requires opening each DB and counting data
  // This is a simplified estimate
  for (const db of databases) {
    if (db.name) {
      // Estimate based on database name (actual size would need full scan)
      dbSizes.push({
        name: db.name,
        size: 0, // Would need full scan to calculate
      });
    }
  }

  return dbSizes;
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Generate PWA icon as data URL
 */
export function generatePWAIcon(size: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) return '';

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#3B82F6');
  gradient.addColorStop(0.5, '#8B5CF6');
  gradient.addColorStop(1, '#EC4899');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  // Add text
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.4}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('HR', size / 2, size / 2);

  // Add subtitle
  ctx.font = `${size * 0.15}px sans-serif`;
  ctx.fillText('AI Mind', size / 2, size * 0.75);

  return canvas.toDataURL('image/png');
}

/**
 * Download PWA icons
 */
export async function downloadPWAIcons(): Promise<void> {
  const sizes = [192, 512];

  for (const size of sizes) {
    const dataUrl = generatePWAIcon(size);
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `icon-${size}x${size}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}
