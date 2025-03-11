import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, shareReplay, tap } from 'rxjs';
import { ImageModel } from '../models/ImageModel';

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
  baseURL: string =
    'https://imageprocessingapi-hdb5gpfah7h3bbdh.eastus-01.azurewebsites.net/Images';

  /**
   * Cache for storing images.
   * @type {Observable<ImageModel[]> | null}
   */
  private imagesCache$: Observable<ImageModel[]> | null = null;

  /**
   * Cache for storing images.
   * @type {Map<string, Observable<ImageModel>>}
   */
  private imageCache: Map<string, Observable<ImageModel>> = new Map();

  /**
   * Constructor for ImageService.
   * @param {HttpClient} httpClient - The HTTP client for making requests.
   */
  constructor(private httpClient: HttpClient) {}

  /**
   * Uploads an image to the server and clears the cache.
   * @param {File} image - The image file to upload.
   * @returns {Observable<ImageModel>} - An observable containing the uploaded image data.
   */
  uploadImage(image: File): Observable<ImageModel> {
    const formData = new FormData();
    formData.append('image', image);

    this.imagesCache$ = null;

    return this.httpClient.post<ImageModel>(`${this.baseURL}/upload`, formData);
  }

  /**
   * Fetches all images from the server and caches them.
   * @returns {Observable<ImageModel[]>} - An observable containing an array of image data.
   */
  getImages(): Observable<ImageModel[]> {
    if (!this.imagesCache$) {
      this.imagesCache$ = this.httpClient
        .get<ImageModel[]>(`${this.baseURL}`)
        .pipe(
          tap((images: ImageModel[]) => {
            images.forEach((image: ImageModel) => {
              if (!this.imageCache.has(image.id)) {
                this.imageCache.set(image.id, of(image));
              }
            });
          }),
          shareReplay(1)
        );
    }

    return this.imagesCache$;
  }

  /**
   * Fetches a single image by its ID from the server and caches it.
   * @param {string} id - The ID of the image to fetch.
   * @returns {Observable<ImageModel>} - An observable containing the image data.
   */
  getImage(id: string): Observable<ImageModel> {
    if (!this.imageCache.has(id)) {
      const image$ = this.httpClient
        .get<ImageModel>(`${this.baseURL}/${id}`)
        .pipe(shareReplay(1));
      this.imageCache.set(id, image$);
    }

    return this.imageCache.get(id)!;
  }

  /**
   * Edits an image by applying a filter to it and clears the cache.
   * @param {string} id - The ID of the image to edit.
   * @param {string} filter - The filter to apply to the image.
   * @returns {Observable<ImageModel>} - An observable containing the edited image data.
   */
  editImage(id: string, filter: string): Observable<ImageModel> {
    this.imageCache.delete(id);
    this.imagesCache$ = null;

    return this.httpClient.put<ImageModel>(
      `${this.baseURL}/edit/${id}`,
      JSON.stringify(filter),
      {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
        }),
      }
    );
  }
  /**
   * Downloads an image from the server.
   * @param {string} id - The ID of the image to download.
   * @returns {Observable<Blob>} - An observable containing the image data.
   */
  downloadImage(id: string): Observable<Blob> {
    return this.httpClient.get(`${this.baseURL}/download/${id}`, {
      responseType: 'blob',
    });
  }
}
