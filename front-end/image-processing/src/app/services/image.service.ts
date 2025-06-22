import {
  HttpClient,
  HttpEvent,
  HttpEventType,
  HttpHeaders,
  HttpParams,
  HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
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
   * @param {boolean} trackProgress - Whether to track upload progress (default: false).
   * @param {boolean} useSignalR - Whether to use SignalR for progress tracking (default: false).
   * @param {string} tempId - Optional temporary ID for progress tracking with SignalR
   * @param {Function} progressCallback - Optional callback to handle progress updates.
   * @returns {Observable<ImageModel | number>} - An observable containing either the uploaded image data or progress updates.
   */
  uploadImage(
    image: File,
    trackProgress: boolean = false,
    useSignalR: boolean = false,
    tempId?: string,
    progressCallback?: (progress: number) => void
  ): Observable<ImageModel | number> {
    const formData = new FormData();
    formData.append('image', image);

    // Clear all caches as the collection has changed
    this.cacheService.clearAll();

    // Add query parameters for progress tracking
    let params = new HttpParams();

    if (trackProgress && useSignalR) {
      params = params.set('trackProgress', 'true');

      // Add tempId parameter if provided
      if (tempId) {
        params = params.set('tempId', tempId);
      }
    }

    // Create the request
    const req = new HttpRequest('POST', `${this.baseURL}/upload`, formData, {
      headers: new HttpHeaders({
        'X-API-Key': this.apiKey,
      }),
      params: params,
      reportProgress: trackProgress && !useSignalR, // Only use HTTP progress if not using SignalR
    });

    // Send the request and handle events
    return this.httpClient.request<ImageModel>(req).pipe(
      map((event: HttpEvent<ImageModel>) => {
        // Only process progress events if HTTP progress tracking is enabled
        if (trackProgress && !useSignalR) {
          switch (event.type) {
            case HttpEventType.UploadProgress:
              const progress = event.total
                ? Math.round((100 * event.loaded) / event.total)
                : 0;
              if (progressCallback) {
                progressCallback(progress);
              }
              return progress;

            case HttpEventType.Response:
              return event.body as ImageModel;

            default:
              return 0;
          }
        } else if (event.type === HttpEventType.Response) {
          // For SignalR tracking or no tracking, just return the final response
          return event.body as ImageModel;
        }
        return 0;
      })
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
   * @param {boolean} trackProgress - Whether to track progress using SignalR (default: false).
   * @returns {Observable<ImageModel>} - An observable containing the edited image data.
   */
  editImage(
    id: string,
    filter: string,
    trackProgress: boolean = false
  ): Observable<ImageModel> {
    // For edit operations, invalidate both the individual image cache
    // and the collection cache since this changes an existing image
    this.cacheService.invalidateImage(id);
    this.cacheService.setImagesCache(null);

    // Add trackProgress query parameter if enabled
    let params = new HttpParams();
    if (trackProgress) {
      params = params.set('trackProgress', 'true');
    }

    return this.httpClient.put<ImageModel>(
      `${this.baseURL}/edit/${id}`,
      JSON.stringify(filter),
      {
        headers: new HttpHeaders({
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        }),
        params: params,
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
}
