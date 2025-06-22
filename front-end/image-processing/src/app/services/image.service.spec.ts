import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ImageModel } from '../models/ImageModel';
import { CacheService } from './cache.service';
import { ImageService } from './image.service';

describe('ImageService', () => {
  let service: ImageService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let cacheServiceSpy: jasmine.SpyObj<CacheService>;

  beforeEach(() => {
    const cacheSpy = jasmine.createSpyObj('CacheService', [
      'getImagesCache',
      'setImagesCache',
      'getImageCache',
      'setImageCache',
      'hasImageCache',
      'getBlobCache',
      'setBlobCache',
      'hasBlobCache',
      'invalidateImage',
      'clearAll',
    ]);

    const httpSpy = jasmine.createSpyObj('HttpClient', [
      'get',
      'post',
      'put',
      'request',
    ]);

    TestBed.configureTestingModule({
      providers: [
        ImageService,
        { provide: CacheService, useValue: cacheSpy },
        { provide: HttpClient, useValue: httpSpy },
      ],
    });

    service = TestBed.inject(ImageService);
    httpClientSpy = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
    cacheServiceSpy = TestBed.inject(
      CacheService
    ) as jasmine.SpyObj<CacheService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getImages', () => {
    it('should return cached images if available', () => {
      const mockImages = [
        { id: '1', name: 'Image 1' },
        { id: '2', name: 'Image 2' },
      ] as ImageModel[];

      // Set up cache to return images
      cacheServiceSpy.getImagesCache.and.returnValue(of(mockImages));

      // Call service
      let result: ImageModel[] | undefined;
      service.getImages().subscribe((images) => {
        result = images;
      });

      // Verify no HTTP requests were made
      expect(httpClientSpy.get).not.toHaveBeenCalled();

      // Verify result matches mock data
      expect(result).toBeDefined();
      expect(result?.length).toBe(2);

      // Verify cache was checked
      expect(cacheServiceSpy.getImagesCache).toHaveBeenCalled();
    });

    it('should fetch from server and cache when cache is empty', () => {
      const mockImages = [
        { id: '1', name: 'Image 1' },
        { id: '2', name: 'Image 2' },
      ] as ImageModel[];

      // Set up cache to return nothing
      cacheServiceSpy.getImagesCache.and.returnValue(null);

      // Set up HTTP to return images
      httpClientSpy.get.and.returnValue(of(mockImages));

      // Call service
      let result: ImageModel[] | undefined;
      service.getImages().subscribe((images) => {
        result = images;
      });

      // Verify HTTP request was made
      expect(httpClientSpy.get).toHaveBeenCalledWith(
        `${service.baseURL}`,
        jasmine.any(Object)
      );

      // Verify result matches mock data
      expect(result).toBeDefined();
      expect(result?.length).toBe(2);

      // Verify cache was set
      expect(cacheServiceSpy.setImagesCache).toHaveBeenCalled();
      expect(cacheServiceSpy.setImageCache).toHaveBeenCalledTimes(2);
    });
  });

  describe('getImage', () => {
    it('should return cached image if available', () => {
      const mockImage = { id: '1', name: 'Image 1' } as ImageModel;

      // Set up cache to return image
      cacheServiceSpy.getImageCache.and.returnValue(of(mockImage));

      // Call service
      let result: ImageModel | undefined;
      service.getImage('1').subscribe((image) => {
        result = image;
      });

      // Verify no HTTP requests were made
      expect(httpClientSpy.get).not.toHaveBeenCalled();

      // Verify result matches mock data
      expect(result).toBeDefined();
      expect(result?.id).toBe('1');

      // Verify cache was checked
      expect(cacheServiceSpy.getImageCache).toHaveBeenCalledWith('1');
    });

    it('should fetch from server and cache when image not in cache', () => {
      const mockImage = { id: '1', name: 'Image 1' } as ImageModel;

      // Set up cache to return nothing
      cacheServiceSpy.getImageCache.and.returnValue(undefined);

      // Set up HTTP to return image
      httpClientSpy.get.and.returnValue(of(mockImage));

      // Call service
      let result: ImageModel | undefined;
      service.getImage('1').subscribe((image) => {
        result = image;
      });

      // Verify HTTP request was made
      expect(httpClientSpy.get).toHaveBeenCalledWith(
        `${service.baseURL}/1`,
        jasmine.any(Object)
      );

      // Verify result matches mock data
      expect(result).toBeDefined();
      expect(result?.id).toBe('1');

      // Verify cache was set
      expect(cacheServiceSpy.setImageCache).toHaveBeenCalled();
    });
  });

  describe('editImage', () => {
    it('should invalidate caches when editing an image', () => {
      const mockImage = { id: '1', name: 'Image 1' } as ImageModel;

      // Set up HTTP to return image
      httpClientSpy.put.and.returnValue(of(mockImage));

      // Call service
      service.editImage('1', 'grayscale').subscribe();

      // Verify HTTP request was made with correct parameters
      expect(httpClientSpy.put).toHaveBeenCalled();

      // The URL should be correct
      expect(httpClientSpy.put.calls.mostRecent().args[0]).toBe(
        `${service.baseURL}/edit/1`
      );

      // Verify cache was invalidated
      expect(cacheServiceSpy.invalidateImage).toHaveBeenCalledWith('1');
      expect(cacheServiceSpy.setImagesCache).toHaveBeenCalledWith(null);
    });
  });

  describe('downloadImage', () => {
    it('should return cached blob if available', () => {
      const mockBlob = new Blob(['test data'], { type: 'image/jpeg' });

      // Set up cache to return blob
      cacheServiceSpy.getBlobCache.and.returnValue(of(mockBlob));

      // Call service
      let result: Blob | undefined;
      service.downloadImage('1').subscribe((blob) => {
        result = blob;
      });

      // Verify no HTTP requests were made
      expect(httpClientSpy.get).not.toHaveBeenCalled();

      // Verify result matches mock data
      expect(result).toBe(mockBlob);

      // Verify cache was checked
      expect(cacheServiceSpy.getBlobCache).toHaveBeenCalledWith('1');
    });

    it('should fetch from server and cache when blob not in cache', () => {
      const mockBlob = new Blob(['test data'], { type: 'image/jpeg' });

      // Set up cache to return nothing
      cacheServiceSpy.getBlobCache.and.returnValue(null);

      // Set up HTTP to return blob
      httpClientSpy.get.and.returnValue(of(mockBlob));

      // Call service
      let result: Blob | undefined;
      service.downloadImage('1').subscribe((blob) => {
        result = blob;
      });

      // Verify HTTP request was made
      expect(httpClientSpy.get).toHaveBeenCalledWith(
        `${service.baseURL}/download/1`,
        jasmine.objectContaining({
          responseType: 'blob',
        })
      );

      // Verify blob was cached
      expect(cacheServiceSpy.setBlobCache).toHaveBeenCalled();
    });
  });

  describe('uploadImage', () => {
    it('should clear all caches when uploading an image', () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockResponse = { id: '1', name: 'test.jpg' } as ImageModel;

      // Set up HTTP to return response - for request method
      httpClientSpy.request.and.returnValue(of(mockResponse));

      // Call service
      service.uploadImage(mockFile).subscribe();

      // Verify HTTP request was made
      expect(httpClientSpy.request).toHaveBeenCalled();

      // Verify all caches were cleared
      expect(cacheServiceSpy.clearAll).toHaveBeenCalled();
    });
  });
});
