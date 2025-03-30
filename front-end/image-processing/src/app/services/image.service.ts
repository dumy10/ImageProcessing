import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ImageModel } from '../models/ImageModel';
import { CacheService } from './cache.service';

/**
 * Service for handling image-related operations such as uploading and fetching images.
 */
@Injectable({
  providedIn: 'root',
})
export class ImageService {
  /**
   * Base URL for the image API.
   * @type {string}
   */
  baseURL: string = environment.apiUrl;

  /**
   * API Key for authentication
   * @type {string}
   */
  private apiKey: string = environment.apiKey;

  /**
   * Common HTTP headers used in requests
   * @type {HttpHeaders}
   */
  private get commonHeaders(): HttpHeaders {
    return new HttpHeaders({
      'X-API-Key': this.apiKey,
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    });
  }

  /**
   * Constructor for ImageService.
   * @param {HttpClient} httpClient - The HTTP client for making requests.
   * @param {CacheService} cacheService - The cache service for caching images.
   */
  constructor(
    private httpClient: HttpClient,
    private cacheService: CacheService
  ) {}

  /**
   * Uploads an image to the server and clears the cache.
   * @param {File} image - The image file to upload.
   * @returns {Observable<ImageModel>} - An observable containing the uploaded image data.
   */
  uploadImage(image: File): Observable<ImageModel> {
    const formData = new FormData();
    formData.append('image', image);

    // Clear all caches as the collection has changed
    this.cacheService.clearAll();

    return this.httpClient.post<ImageModel>(
      `${this.baseURL}/upload`,
      formData,
      {
        headers: new HttpHeaders({
          'X-API-Key': this.apiKey,
        }),
      }
    );
  }

  /**
   * Fetches all images from the server and caches them.
   * @returns {Observable<ImageModel[]>} - An observable containing an array of image data.
   */
  getImages(): Observable<ImageModel[]> {
    // Check if we have a cached response first
    const cachedImages$ = this.cacheService.getImagesCache();
    if (cachedImages$) {
      return cachedImages$;
    }

    // If not cached, fetch from server and cache the result
    const images$ = this.httpClient
      .get<ImageModel[]>(`${this.baseURL}`, {
        headers: this.commonHeaders,
      })
      .pipe(
        tap((images: ImageModel[]) => {
          // Cache individual images for later retrieval
          images.forEach((image: ImageModel) => {
            if (!this.cacheService.hasImageCache(image.id)) {
              // Use of() instead of deprecated Observable.create
              this.cacheService.setImageCache(image.id, of(image));
            }
          });
        }),
        catchError((error) => {
          return throwError(() => error);
        }),
        // Use shareReplay with a configuration object that allows resubscription when source completes
        shareReplay({ bufferSize: 1, refCount: true })
      );

    // Store in cache
    this.cacheService.setImagesCache(images$);

    return images$;
  }

  /**
   * Fetches a single image by its ID from the server and caches it.
   * @param {string} id - The ID of the image to fetch.
   * @returns {Observable<ImageModel>} - An observable containing the image data.
   */
  getImage(id: string): Observable<ImageModel> {
    // Check if we have a cached response first
    const cachedImage$ = this.cacheService.getImageCache(id);
    if (cachedImage$) {
      return cachedImage$;
    }

    // If not cached, fetch from server and cache the result
    const image$ = this.httpClient
      .get<ImageModel>(`${this.baseURL}/${id}`, {
        headers: this.commonHeaders,
      })
      .pipe(
        catchError((error) => {
          // If there's an error, don't cache
          return throwError(() => error);
        }),
        shareReplay(1)
      );

    // Store in cache
    this.cacheService.setImageCache(id, image$);

    return image$;
  }

  /**
   * Edits an image by applying a filter to it and clears the cache.
   * @param {string} id - The ID of the image to edit.
   * @param {string} filter - The filter to apply to the image.
   * @returns {Observable<ImageModel>} - An observable containing the edited image data.
   */
  editImage(id: string, filter: string): Observable<ImageModel> {
    // For edit operations, invalidate both the individual image cache
    // and the collection cache since this changes an existing image
    this.cacheService.invalidateImage(id);
    this.cacheService.setImagesCache(null);

    return this.httpClient.put<ImageModel>(
      `${this.baseURL}/edit/${id}`,
      JSON.stringify(filter),
      {
        headers: new HttpHeaders({
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        }),
      }
    );
  }

  /**
   * Downloads an image from the server with caching.
   * @param {string} id - The ID of the image to download.
   * @returns {Observable<Blob>} - An observable containing the image data.
   */
  downloadImage(id: string): Observable<Blob> {
    // Check if we have a cached blob first
    const cachedBlob$ = this.cacheService.getBlobCache(id);
    if (cachedBlob$) {
      return cachedBlob$;
    }

    // If not cached, fetch from server and cache the result
    return this.httpClient
      .get(`${this.baseURL}/download/${id}`, {
        responseType: 'blob',
        headers: this.commonHeaders,
      })
      .pipe(
        tap((blob) => {
          // Store blob in cache
          this.cacheService.setBlobCache(id, blob);
        })
      );
  }

  /**
   * Preloads an image to improve user experience.
   * @param {string} id - The ID of the image to preload.
   */
  preloadImage(id: string): void {
    // If we already have the image in cache, don't reload it
    if (this.cacheService.hasBlobCache(id)) {
      return;
    }

    // Load the image in the background
    this.downloadImage(id).subscribe({
      // No need to do anything with the result, just cache it
      next: () => {},
      error: () => {
        // If preloading fails, remove from cache to allow retry
        this.cacheService.invalidateImage(id);
      },
    });
  }
}
