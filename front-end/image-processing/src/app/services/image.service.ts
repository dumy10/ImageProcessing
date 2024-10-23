import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  baseURL = 'http://localhost'; // will change this once the back-end is in place

  constructor(private httpClient: HttpClient) {}

  uploadImage(image: File) {
    const formData = new FormData();
    formData.append('image', image);

    return this.httpClient.post(`${this.baseURL}/upload`, formData);
  }
}
