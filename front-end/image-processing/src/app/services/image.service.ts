import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
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
  baseURL: string = 'https://localhost:7156/Images';

  /**
   * Constructor for ImageService.
   * @param {HttpClient} httpClient - The HTTP client for making requests.
   */
  constructor(private httpClient: HttpClient) {}

  /**
   * Uploads an image to the server.
   * @param {File} image - The image file to upload.
   * @returns {Observable<ImageModel>} - An observable containing the uploaded image data.
   */
  uploadImage(image: File): Observable<ImageModel> {
    const formData = new FormData();
    formData.append('image', image);
    return this.httpClient.post<ImageModel>(`${this.baseURL}/upload`, formData);
  }

  /**
   * Fetches all images from the server.
   * @returns {Observable<ImageModel[]>} - An observable containing an array of image data.
   */
  getImages(): Observable<ImageModel[]> {
    return this.httpClient.get<ImageModel[]>(`${this.baseURL}`);
  }

  /**
   * Fetches a single image by its ID.
   * @param {string} id - The ID of the image to fetch.
   * @returns {Observable<ImageModel>} - An observable containing the image data.
   */
  getImage(id: string): Observable<ImageModel> {
    return this.httpClient.get<ImageModel>(`${this.baseURL}/${id}`);
  }

  /**
   * Edits an image by applying a filter.
   * @param {string} id - The ID of the image to edit.
   * @param {string} filter - The filter to apply to the image.
   * @returns {Observable<ImageModel>} - An observable containing the edited image data.
   */
  editImage(id: string, filter: string): Observable<ImageModel> {
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
}
