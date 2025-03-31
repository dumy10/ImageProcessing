import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ImageModel } from '../models/ImageModel';
import { CacheService } from './cache.service';
import { ImageService } from './image.service';

describe('ImageService', () => {
  let service: ImageService;
  let httpMock: HttpTestingController;
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

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ImageService, { provide: CacheService, useValue: cacheSpy }],
    });

    service = TestBed.inject(ImageService);
    httpMock = TestBed.inject(HttpTestingController);
    cacheServiceSpy = TestBed.inject(
      CacheService
    ) as jasmine.SpyObj<CacheService>;
  });

  afterEach(() => {
    httpMock.verify();
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
      httpMock.expectNone(`${service.baseURL}`);

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

      // Call service
      let result: ImageModel[] | undefined;
      service.getImages().subscribe((images) => {
        result = images;
      });

      // Respond to HTTP request
      const req = httpMock.expectOne(`${service.baseURL}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockImages);

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
      httpMock.expectNone(`${service.baseURL}/1`);

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

      // Call service
      let result: ImageModel | undefined;
      service.getImage('1').subscribe((image) => {
        result = image;
      });

      // Respond to HTTP request
      const req = httpMock.expectOne(`${service.baseURL}/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockImage);

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

      // Call service
      service.editImage('1', 'grayscale').subscribe();

      // Respond to HTTP request
      const req = httpMock.expectOne(`${service.baseURL}/edit/1`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockImage);

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
      httpMock.expectNone(`${service.baseURL}/download/1`);

      // Verify result matches mock data
      expect(result).toBe(mockBlob);

      // Verify cache was checked
      expect(cacheServiceSpy.getBlobCache).toHaveBeenCalledWith('1');
    });

    it('should fetch from server and cache when blob not in cache', () => {
      const mockBlob = new Blob(['test data'], { type: 'image/jpeg' });

      // Set up cache to return nothing
      cacheServiceSpy.getBlobCache.and.returnValue(null);

      // Call service
      let result: Blob | undefined;
      service.downloadImage('1').subscribe((blob) => {
        result = blob;
      });

      // Respond to HTTP request
      const req = httpMock.expectOne(`${service.baseURL}/download/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);

      // Verify blob was cached
      expect(cacheServiceSpy.setBlobCache).toHaveBeenCalled();
    });
  });

  describe('preloadImage', () => {
    it('should not download if blob is already cached', () => {
      // Set up cache to indicate blob exists
      cacheServiceSpy.hasBlobCache.and.returnValue(true);

      // Call service
      service.preloadImage('1');

      // Verify no HTTP requests were made
      httpMock.expectNone(`${service.baseURL}/download/1`);

      // Verify cache was checked
      expect(cacheServiceSpy.hasBlobCache).toHaveBeenCalledWith('1');
    });

    it('should download and cache image if not already cached', () => {
      const mockBlob = new Blob(['test data'], { type: 'image/jpeg' });

      // Set up cache to indicate blob doesn't exist
      cacheServiceSpy.hasBlobCache.and.returnValue(false);

      // Call service
      service.preloadImage('1');

      // Respond to HTTP request
      const req = httpMock.expectOne(`${service.baseURL}/download/1`);
      expect(req.request.method).toBe('GET');
      req.flush(mockBlob);

      // Verify blob was cached
      expect(cacheServiceSpy.setBlobCache).toHaveBeenCalled();
    });

    it('should invalidate cache if preloading fails', () => {
      // Set up cache to indicate blob doesn't exist
      cacheServiceSpy.hasBlobCache.and.returnValue(false);

      // Call service
      service.preloadImage('1');

      // Respond with error
      const req = httpMock.expectOne(`${service.baseURL}/download/1`);
      req.error(new ErrorEvent('Network error'));

      // Verify cache was invalidated
      expect(cacheServiceSpy.invalidateImage).toHaveBeenCalledWith('1');
    });
  });

  describe('uploadImage', () => {
    it('should clear all caches when uploading an image', () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockResponse = { id: '1', name: 'test.jpg' } as ImageModel;

      // Call service
      service.uploadImage(mockFile).subscribe();

      // Respond to HTTP request
      const req = httpMock.expectOne(`${service.baseURL}/upload`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);

      // Verify all caches were cleared
      expect(cacheServiceSpy.clearAll).toHaveBeenCalled();
    });
  });
});
