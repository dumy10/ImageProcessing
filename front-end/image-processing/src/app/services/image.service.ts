import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  baseURL = 'http://localhost:'; // will change this once the back-end is in place

  readonly httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'multipart/form-data',
    }),
  };

  constructor(private httpClient: HttpClient) {}

  uploadImage(image: File) {
    const formData = new FormData();
    formData.append('image', image);

    return this.httpClient.post(`${this.baseURL}/upload`, formData, {
      headers: this.httpOptions.headers,
      responseType: 'text' as 'json',
    });
  }

  getImages() {
    return this.httpClient.get(`${this.baseURL}/images`);
  }

  getImage(id: string) {
    return this.httpClient.get(`${this.baseURL}/image/${id}`);
  }

  editImage(id: string, filter: string) {
    return this.httpClient.post(
      `${this.baseURL}/edit/${id}`,
      { filter },
      this.httpOptions
    );
  }
}
