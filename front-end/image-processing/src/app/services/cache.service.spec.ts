import {
  TestBed,
  discardPeriodicTasks,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { of } from 'rxjs';
import { ImageModel } from '../models/ImageModel';
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ImageModel caching tests
  describe('Image metadata caching', () => {
    it('should set and get images cache', () => {
      const mockImages = [
        { id: '1', name: 'Image 1', url: 'url1' },
        { id: '2', name: 'Image 2', url: 'url2' },
      ] as ImageModel[];

      const images$ = of(mockImages);

      service.setImagesCache(images$);
      const cachedImages$ = service.getImagesCache();

      expect(cachedImages$).toBeTruthy();
      cachedImages$?.subscribe((images) => {
        expect(images.length).toBe(2);
        expect(images[0].id).toBe('1');
        expect(images[1].id).toBe('2');
      });
    });

    it('should set and get individual image cache', () => {
      const mockImage = { id: '1', name: 'Image 1', url: 'url1' } as ImageModel;
      const image$ = of(mockImage);

      service.setImageCache('1', image$);
      const cachedImage$ = service.getImageCache('1');

      expect(cachedImage$).toBeTruthy();
      cachedImage$?.subscribe((image) => {
        expect(image.id).toBe('1');
        expect(image.name).toBe('Image 1');
      });
    });

    it('should check if image exists in cache', () => {
      const mockImage = { id: '1', name: 'Image 1', url: 'url1' } as ImageModel;
      const image$ = of(mockImage);

      service.setImageCache('1', image$);

      expect(service.hasImageCache('1')).toBeTrue();
      expect(service.hasImageCache('2')).toBeFalse();
    });

    it('should invalidate image cache', () => {
      // Setup image metadata cache
      const mockImage = { id: '1', name: 'Image 1', url: 'url1' } as ImageModel;
      const image$ = of(mockImage);
      service.setImageCache('1', image$);

      // Setup image blob cache
      const mockBlob = new Blob(['test data'], { type: 'image/jpeg' });
      service.setBlobCache('1', mockBlob);

      // Invalidate
      service.invalidateImage('1');

      expect(service.hasImageCache('1')).toBeFalse();
      expect(service.hasBlobCache('1')).toBeFalse();
    });

    it('should clear all caches', () => {
      // Setup image collection cache
      const mockImages = [
        { id: '1', name: 'Image 1', url: 'url1' },
        { id: '2', name: 'Image 2', url: 'url2' },
      ] as ImageModel[];
      service.setImagesCache(of(mockImages));

      // Setup individual image cache
      service.setImageCache('1', of(mockImages[0]));

      // Setup blob cache
      const mockBlob = new Blob(['test data'], { type: 'image/jpeg' });
      service.setBlobCache('1', mockBlob);

      // Clear all
      service.clearAll();

      expect(service.getImagesCache()).toBeNull();
      expect(service.hasImageCache('1')).toBeFalse();
      expect(service.hasBlobCache('1')).toBeFalse();

      // Check size stats
      const stats = service.getCacheStats();
      expect(stats.imageCount).toBe(0);
      expect(stats.blobCount).toBe(0);
      expect(stats.blobSizeBytes).toBe(0);
    });
  });

  // Blob caching tests
  describe('Blob caching', () => {
    it('should set and get blob cache', () => {
      const mockBlob = new Blob(['test data'], { type: 'image/jpeg' });

      service.setBlobCache('1', mockBlob);
      const cachedBlob$ = service.getBlobCache('1');

      expect(cachedBlob$).toBeTruthy();
      cachedBlob$?.subscribe((blob) => {
        expect(blob.size).toBe(mockBlob.size);
        expect(blob.type).toBe(mockBlob.type);
      });
    });

    it('should check if blob exists in cache', () => {
      const mockBlob = new Blob(['test data'], { type: 'image/jpeg' });

      service.setBlobCache('1', mockBlob);

      expect(service.hasBlobCache('1')).toBeTrue();
      expect(service.hasBlobCache('2')).toBeFalse();
    });

    it('should evict oldest entries when exceeding max size', fakeAsync(() => {
      // Spy on evictOldestIfNeeded to verify it's called
      const evictSpy = spyOn<any>(
        service,
        'evictOldestIfNeeded'
      ).and.callThrough();

      // Set the maxBlobCacheSize property to a smaller value for testing
      (service as any).maxBlobCacheSize = 3;

      // Add blobs to exceed the limit
      for (let i = 0; i < 5; i++) {
        const mockBlob = new Blob([`test data ${i}`], { type: 'image/jpeg' });
        service.setBlobCache(`blob${i}`, mockBlob);

        // Simulate time passing between insertions
        tick(100);
      }

      expect(evictSpy).toHaveBeenCalled();

      // Verify that older entries were removed
      expect(service.hasBlobCache('blob0')).toBeFalse();
      expect(service.hasBlobCache('blob1')).toBeFalse();

      // Verify newer entries are still there
      expect(service.hasBlobCache('blob2')).toBeTrue();
      expect(service.hasBlobCache('blob3')).toBeTrue();
      expect(service.hasBlobCache('blob4')).toBeTrue();

      discardPeriodicTasks();
    }));

    it('should expire cache entries after time period', fakeAsync(() => {
      // Set a shorter expiry time for testing
      (service as any).cacheExpiryMs = 1000; // 1 second

      const mockBlob = new Blob(['test data'], { type: 'image/jpeg' });
      service.setBlobCache('1', mockBlob);

      expect(service.hasBlobCache('1')).toBeTrue();

      // Advance time beyond expiration
      tick(1500);

      // Force cleanup
      (service as any).cleanExpiredCache();

      expect(service.hasBlobCache('1')).toBeFalse();

      discardPeriodicTasks();
    }));

    it('should update expiry time when accessing blob', fakeAsync(() => {
      // Set a shorter expiry time for testing
      (service as any).cacheExpiryMs = 1000; // 1 second

      const mockBlob = new Blob(['test data'], { type: 'image/jpeg' });
      service.setBlobCache('1', mockBlob);

      // Advance time partially
      tick(500);

      // Access the blob which should refresh the expiry time
      service.getBlobCache('1');

      // Advance time again but total is more than expiry time
      tick(800);

      // Force cleanup
      (service as any).cleanExpiredCache();

      // Should still be valid since expiry was refreshed
      expect(service.hasBlobCache('1')).toBeTrue();

      discardPeriodicTasks();
    }));

    it('should evict blobs when total size exceeds limit', () => {
      // Set a small size limit for testing
      (service as any).maxBlobCacheSizeBytes = 1000;

      // Spy on evictBlobsUntilSize to verify it's called
      const evictSpy = spyOn<any>(
        service,
        'evictBlobsUntilSize'
      ).and.callThrough();

      // Create a blob that exceeds the size limit
      const largeBlob = new Blob([new ArrayBuffer(1200)], {
        type: 'image/jpeg',
      });

      // Create a small blob first
      const smallBlob = new Blob(['small'], { type: 'image/jpeg' });
      service.setBlobCache('small', smallBlob);

      // Add the large blob - should trigger eviction
      service.setBlobCache('large', largeBlob);

      expect(evictSpy).toHaveBeenCalled();

      // Small blob should be evicted to make room
      expect(service.hasBlobCache('small')).toBeFalse();

      // Large blob should be cached
      expect(service.hasBlobCache('large')).toBeTrue();
    });
  });

  // Cache analytics tests
  describe('Cache analytics', () => {
    it('should track cache hits', () => {
      // Setup caches
      const mockImage = { id: '1', name: 'Image 1', url: 'url1' } as ImageModel;
      const image$ = of(mockImage);
      service.setImageCache('1', image$);

      const mockBlob = new Blob(['test data'], { type: 'image/jpeg' });
      service.setBlobCache('1', mockBlob);

      const mockImages = [mockImage] as ImageModel[];
      service.setImagesCache(of(mockImages));

      // Access caches multiple times
      service.getImageCache('1');
      service.getImageCache('1');
      service.getBlobCache('1');
      service.getImagesCache();

      // Verify hit counts
      const stats = service.getCacheStats();
      expect(stats.cacheHits['image_1']).toBe(2);
      expect(stats.cacheHits['blob_1']).toBe(1);
      expect(stats.cacheHits['images_collection']).toBe(1);
    });

    it('should provide accurate cache statistics', () => {
      // Setup caches with various sizes
      const mockImage1 = {
        id: '1',
        name: 'Image 1',
        url: 'url1',
      } as ImageModel;
      const mockImage2 = {
        id: '2',
        name: 'Image 2',
        url: 'url2',
      } as ImageModel;

      service.setImageCache('1', of(mockImage1));
      service.setImageCache('2', of(mockImage2));

      const blob1 = new Blob(['small blob'], { type: 'image/jpeg' });
      const blob2 = new Blob([new ArrayBuffer(1000)], { type: 'image/png' });

      service.setBlobCache('1', blob1);
      service.setBlobCache('2', blob2);

      // Get statistics
      const stats = service.getCacheStats();

      // Verify counts
      expect(stats.imageCount).toBe(2);
      expect(stats.blobCount).toBe(2);

      // Verify size is tracked (approximate due to different browser implementations)
      expect(stats.blobSizeBytes).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('Images collection cache', () => {
    it('should set and get images collection cache', () => {
      const images$ = of([{ id: '1' } as ImageModel]);
      service.setImagesCache(images$);

      const result = service.getImagesCache();
      expect(result).toBe(images$);
    });

    it('should return null when images collection cache is not set', () => {
      service.setImagesCache(null);
      expect(service.getImagesCache()).toBeNull();
    });

    it('should clear images collection cache on clearAll', () => {
      service.setImagesCache(of([{ id: '1' } as ImageModel]));
      service.clearAll();
      expect(service.getImagesCache()).toBeNull();
    });
  });

  describe('Image cache', () => {
    it('should set, check and get image cache', () => {
      const image$ = of({ id: '1' } as ImageModel);
      service.setImageCache('1', image$);

      expect(service.hasImageCache('1')).toBeTrue();
      const result = service.getImageCache('1');
      expect(result).toBe(image$);
    });

    it('should return undefined when image is not in cache', () => {
      expect(service.hasImageCache('non-existent')).toBeFalse();
      expect(service.getImageCache('non-existent')).toBeUndefined();
    });

    it('should invalidate specific image cache', () => {
      service.setImageCache('1', of({ id: '1' } as ImageModel));
      service.invalidateImage('1');
      expect(service.hasImageCache('1')).toBeFalse();
    });

    it('should clear all image caches on clearAll', () => {
      service.setImageCache('1', of({ id: '1' } as ImageModel));
      service.setImageCache('2', of({ id: '2' } as ImageModel));
      service.clearAll();

      expect(service.hasImageCache('1')).toBeFalse();
      expect(service.hasImageCache('2')).toBeFalse();
    });
  });

  describe('Blob cache', () => {
    it('should set, check and get blob cache', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      service.setBlobCache('1', blob);

      expect(service.hasBlobCache('1')).toBeTrue();
      service.getBlobCache('1')?.subscribe((result) => {
        expect(result).toBe(blob);
      });
    });

    it('should return null when blob is not in cache', () => {
      expect(service.hasBlobCache('non-existent')).toBeFalse();
      expect(service.getBlobCache('non-existent')).toBeNull();
    });

    it('should invalidate specific blob cache', () => {
      const blob = new Blob(['test'], { type: 'text/plain' });
      service.setBlobCache('1', blob);
      service.invalidateImage('1');
      expect(service.hasBlobCache('1')).toBeFalse();
    });

    it('should clear all blob caches on clearAll', () => {
      service.setBlobCache('1', new Blob(['test1']));
      service.setBlobCache('2', new Blob(['test2']));
      service.clearAll();

      expect(service.hasBlobCache('1')).toBeFalse();
      expect(service.hasBlobCache('2')).toBeFalse();
    });

    it('should update existing blob cache entry', () => {
      const blob1 = new Blob(['test1'], { type: 'text/plain' });
      const blob2 = new Blob(['test2'], { type: 'text/plain' });

      service.setBlobCache('1', blob1);
      service.setBlobCache('1', blob2);

      service.getBlobCache('1')?.subscribe((result) => {
        expect(result).toBe(blob2);
      });
    });

    it('should handle blob expiration', fakeAsync(() => {
      // Access private property for testing
      const originalExpiryMs = (service as any).cacheExpiryMs;
      // Override with a shorter time for testing
      (service as any).cacheExpiryMs = 1000;

      const blob = new Blob(['test'], { type: 'text/plain' });
      service.setBlobCache('1', blob);

      // Initially the blob should be available
      expect(service.hasBlobCache('1')).toBeTrue();

      // Advance time past expiration
      tick(1100);

      // After expiration, cache entry should report as not available
      expect(service.hasBlobCache('1')).toBeFalse();
      expect(service.getBlobCache('1')).toBeNull();

      // Restore original expiry
      (service as any).cacheExpiryMs = originalExpiryMs;
    }));
  });

  describe('Cache size management', () => {
    it('should track blob cache size correctly', () => {
      // Clear any existing cache
      service.clearAll();

      // Create blobs of known size
      const blob1 = new Blob([new ArrayBuffer(1000)]);
      const blob2 = new Blob([new ArrayBuffer(2000)]);

      service.setBlobCache('1', blob1);
      service.setBlobCache('2', blob2);

      const stats = service.getCacheStats();
      // The exact size may vary slightly due to browser implementations, but should be around 3000
      expect(stats.blobSizeBytes).toBeGreaterThanOrEqual(3000);
      expect(stats.blobCount).toBe(2);
    });

    it('should evict oldest entries when exceeding max cache count', () => {
      // Set a small limit for testing
      (service as any).maxBlobCacheSize = 3;
      service.clearAll();

      // Add more entries than the limit
      for (let i = 0; i < 5; i++) {
        service.setBlobCache(`id_${i}`, new Blob([`test_${i}`]));
      }

      // Check cache stats
      const stats = service.getCacheStats();
      expect(stats.blobCount).toBe(3);

      // The oldest entries should be evicted
      expect(service.hasBlobCache('id_0')).toBeFalse();
      expect(service.hasBlobCache('id_1')).toBeFalse();

      // The newest entries should be kept
      expect(service.hasBlobCache('id_2')).toBeTrue();
      expect(service.hasBlobCache('id_3')).toBeTrue();
      expect(service.hasBlobCache('id_4')).toBeTrue();

      // Reset to default
      (service as any).maxBlobCacheSize = 20;
    });
  });

  describe('Cache stats', () => {
    it('should track cache hit counts', () => {
      service.clearAll();

      // Set up cache entries
      service.setImagesCache(of([{ id: '1' } as ImageModel]));
      service.setImageCache('1', of({ id: '1' } as ImageModel));
      service.setBlobCache('1', new Blob(['test']));

      // Access entries multiple times
      service.getImagesCache();
      service.getImagesCache();
      service.getImageCache('1');
      service.getImageCache('1');
      service.getImageCache('1');
      service.getBlobCache('1');

      // Check stats
      const stats = service.getCacheStats();
      expect(stats.cacheHits['images_collection']).toBe(2);
      expect(stats.cacheHits['image_1']).toBe(3);
      expect(stats.cacheHits['blob_1']).toBe(1);
    });
  });

  describe('Clean expired cache', () => {
    it('should clean expired entries', fakeAsync(() => {
      // Set a short expiry time for testing
      (service as any).cacheExpiryMs = 1000;
      service.clearAll();

      // Add entries
      service.setBlobCache('1', new Blob(['test1']));
      service.setBlobCache('2', new Blob(['test2']));

      // Initially both should be available
      expect(service.hasBlobCache('1')).toBeTrue();
      expect(service.hasBlobCache('2')).toBeTrue();

      // Advance time past expiration
      tick(1100);

      // Manually trigger clean (normally done by timer)
      (service as any).cleanExpiredCache();

      // Both entries should now be removed
      expect(service.hasBlobCache('1')).toBeFalse();
      expect(service.hasBlobCache('2')).toBeFalse();

      // Check cache stats
      const stats = service.getCacheStats();
      expect(stats.blobCount).toBe(0);
      expect(stats.blobSizeBytes).toBe(0);

      // Reset to default
      (service as any).cacheExpiryMs = 60 * 60 * 1000;
    }));
  });
});
