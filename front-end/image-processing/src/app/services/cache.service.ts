import { Injectable } from '@angular/core';
import { Observable, of, timer } from 'rxjs';
import { ImageModel } from '../models/ImageModel';

interface CacheEntry<T> {
  data: T;
  expiry: number;
  size?: number;
}

/**
 * Service responsible for caching data to improve application performance
 * This service handles both observable-based caching and binary data caching
 */
@Injectable({
  providedIn: 'root',
})
export class CacheService {
  /**
   * Cache for storing images collection.
   * @type {Observable<ImageModel[]> | null}
   */
  private imagesCache$: Observable<ImageModel[]> | null = null;

  /**
   * Cache for storing individual images.
   * @type {Map<string, Observable<ImageModel>>}
   */
  private imageCache: Map<string, Observable<ImageModel>> = new Map();

  /**
   * Cache for storing binary image data.
   * @type {Map<string, CacheEntry<Blob>>}
   */
  private blobCache: Map<string, CacheEntry<Blob>> = new Map();

  /**
   * The maximum size of the blob cache
   * @type {number}
   */
  private readonly maxBlobCacheSize: number = 20;

  /**
   * Current size of blob cache in bytes (approximate)
   * @type {number}
   */
  private currentBlobCacheSize: number = 0;

  /**
   * Maximum allowed cache size in bytes (100MB)
   * @type {number}
   */
  private readonly maxBlobCacheSizeBytes: number = 100 * 1024 * 1024;

  /**
   * Cache expiration time in milliseconds (1 hour)
   * @type {number}
   */
  private readonly cacheExpiryMs: number = 60 * 60 * 1000;

  /**
   * Cache hit counter for analytics
   * @type {Map<string, number>}
   */
  private cacheHits: Map<string, number> = new Map();

  constructor() {
    // Set up an interval to clean expired cache entries every 15 minutes
    timer(15 * 60 * 1000, 15 * 60 * 1000).subscribe(() => {
      this.cleanExpiredCache();
    });
  }

  /**
   * Sets the images collection cache
   * @param images$ Observable of images collection
   */
  setImagesCache(images$: Observable<ImageModel[]> | null): void {
    this.imagesCache$ = images$;
  }

  /**
   * Gets the cached images collection, if available
   * @returns Observable of images collection or null if not cached
   */
  getImagesCache(): Observable<ImageModel[]> | null {
    if (this.imagesCache$) {
      this.incrementCacheHit('images_collection');
    }
    return this.imagesCache$;
  }

  /**
   * Sets an individual image in the cache
   * @param id Image ID
   * @param image$ Observable of the image
   */
  setImageCache(id: string, image$: Observable<ImageModel>): void {
    this.imageCache.set(id, image$);
  }

  /**
   * Gets a cached image, if available
   * @param id Image ID
   * @returns Observable of the image or undefined if not cached
   */
  getImageCache(id: string): Observable<ImageModel> | undefined {
    const cached = this.imageCache.get(id);
    if (cached) {
      this.incrementCacheHit(`image_${id}`);
    }
    return cached;
  }

  /**
   * Checks if an image exists in the cache
   * @param id Image ID
   * @returns True if the image is cached, false otherwise
   */
  hasImageCache(id: string): boolean {
    return this.imageCache.has(id);
  }

  /**
   * Stores a blob in the cache
   * @param id Image ID
   * @param blob Blob data to cache
   */
  setBlobCache(id: string, blob: Blob): void {
    // Get the existing entry if it exists
    const existingEntry = this.blobCache.get(id);

    // Calculate what the new total size would be
    let newSize = blob.size;
    if (existingEntry && existingEntry.size) {
      // If we're replacing an existing entry, adjust the size calculation
      newSize -= existingEntry.size;
    }

    // Calculate potential new cache size
    const potentialNewSize = this.currentBlobCacheSize + newSize;

    // If we're adding a new entry (not replacing) and we've reached the max number of entries
    if (!existingEntry && this.blobCache.size >= this.maxBlobCacheSize) {
      this.evictOldestIfNeeded();
    }

    // If potential new size exceeds the max size, free up space
    if (potentialNewSize > this.maxBlobCacheSizeBytes) {
      // We need to free this many bytes
      const bytesToFree = potentialNewSize - this.maxBlobCacheSizeBytes;

      // If we're updating an existing entry, remove it first
      if (existingEntry) {
        this.blobCache.delete(id);
        if (existingEntry.size) {
          this.currentBlobCacheSize -= existingEntry.size;
        }
      }

      // Now free up space by evicting older entries
      this.evictBlobsUntilSize(bytesToFree);
    } else if (existingEntry) {
      // If we're not evicting but just updating, remove the old entry first
      this.blobCache.delete(id);
      if (existingEntry.size) {
        this.currentBlobCacheSize -= existingEntry.size;
      }
    }

    // Now add the new entry
    this.blobCache.set(id, {
      data: blob,
      expiry: Date.now() + this.cacheExpiryMs,
      size: blob.size,
    });

    // Update the total cache size with the new blob's size
    this.currentBlobCacheSize += blob.size;
  }

  /**
   * Gets a cached blob, if available and not expired
   * @param id Image ID
   * @returns Observable of the blob or null if not cached or expired
   */
  getBlobCache(id: string): Observable<Blob> | null {
    const now = Date.now();
    const cachedBlob = this.blobCache.get(id);

    if (cachedBlob && cachedBlob.expiry > now) {
      this.incrementCacheHit(`blob_${id}`);
      // Update expiry time on access to implement LRU behavior
      this.blobCache.set(id, {
        ...cachedBlob,
        expiry: now + this.cacheExpiryMs,
      });
      return of(cachedBlob.data);
    }

    return null;
  }

  /**
   * Checks if a blob exists in the cache and is not expired
   * @param id Image ID
   * @returns True if the blob is cached and not expired, false otherwise
   */
  hasBlobCache(id: string): boolean {
    const now = Date.now();
    const cachedBlob = this.blobCache.get(id);
    return cachedBlob !== undefined && cachedBlob.expiry > now;
  }

  /**
   * Clears image cache for a specific ID
   * @param id Image ID
   */
  invalidateImage(id: string): void {
    this.imageCache.delete(id);

    // Update size tracking when removing blob
    const cachedBlob = this.blobCache.get(id);
    if (cachedBlob && cachedBlob.size) {
      this.currentBlobCacheSize -= cachedBlob.size;
    }

    this.blobCache.delete(id);
  }

  /**
   * Clears all caches.
   */
  clearAll(): void {
    this.imagesCache$ = null;
    this.imageCache.clear();
    this.blobCache.clear();
    this.currentBlobCacheSize = 0;
  }

  /**
   * Gets cache statistics
   * @returns Object with cache stats
   */
  getCacheStats(): {
    imageCount: number;
    blobCount: number;
    blobSizeBytes: number;
    cacheHits: Record<string, number>;
  } {
    return {
      imageCount: this.imageCache.size,
      blobCount: this.blobCache.size,
      blobSizeBytes: this.currentBlobCacheSize,
      cacheHits: Object.fromEntries(this.cacheHits),
    };
  }

  /**
   * Removes expired entries from the cache.
   */
  private cleanExpiredCache(): void {
    const now = Date.now();

    // Clear expired blob cache entries
    for (const [id, entry] of this.blobCache.entries()) {
      if (entry.expiry < now) {
        // Update size tracking
        if (entry.size) {
          this.currentBlobCacheSize -= entry.size;
        }
        this.blobCache.delete(id);
      }
    }
  }

  /**
   * Evicts the oldest entries from the blob cache if it exceeds max size.
   */
  private evictOldestIfNeeded(): void {
    if (this.blobCache.size >= this.maxBlobCacheSize) {
      // Find the oldest entries by expiry time
      const entries = Array.from(this.blobCache.entries()).sort(
        (a, b) => a[1].expiry - b[1].expiry
      );

      // Remove oldest entries until we're under the limit
      const toRemove = entries.slice(0, entries.length - this.maxBlobCacheSize + 1);
      for (const [id, entry] of toRemove) {
        // Update size tracking
        if (entry.size) {
          this.currentBlobCacheSize -= entry.size;
        }
        this.blobCache.delete(id);
      }
    }
  }

  /**
   * Evicts blobs until the specified amount of space is freed
   * @param bytesToFree The number of bytes to free
   */
  private evictBlobsUntilSize(bytesToFree: number): void {
    if (bytesToFree <= 0) return;

    // Don't try to evict if there's nothing in the cache
    if (this.blobCache.size === 0) return;

    // Sort by expiry (oldest first) for LRU eviction policy
    const entries = Array.from(this.blobCache.entries()).sort(
      (a, b) => a[1].expiry - b[1].expiry
    );

    let freedBytes = 0;
    let i = 0;

    // Continue evicting until we've freed enough space or gone through all entries
    while (freedBytes < bytesToFree && i < entries.length) {
      const [id, entry] = entries[i];

      if (entry.size) {
        // Only count the entry if we're actually deleting it
        this.blobCache.delete(id);
        freedBytes += entry.size;
        this.currentBlobCacheSize -= entry.size;
      }

      i++;
    }
  }

  /**
   * Increment cache hit counter for the given key
   * @param key The cache key
   */
  private incrementCacheHit(key: string): void {
    const currentHits = this.cacheHits.get(key) || 0;
    this.cacheHits.set(key, currentHits + 1);
  }
}
