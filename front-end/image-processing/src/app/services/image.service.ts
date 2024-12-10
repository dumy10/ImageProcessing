import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ImageModel } from '../models/ImageModel';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  baseURL = 'https://localhost:7156/Images';

  constructor(private httpClient: HttpClient) {}

  uploadImage(image: File): Observable<ImageModel> {
    const formData = new FormData();
    formData.append('image', image);
    return this.httpClient.post<ImageModel>(`${this.baseURL}/upload`, formData);
  }

  getImages(): Observable<ImageModel[]> {
    return this.httpClient.get<ImageModel[]>(`${this.baseURL}`);
  }

  getImage(id: string): Observable<ImageModel> {
    return this.httpClient.get<ImageModel>(`${this.baseURL}/${id}`);
  }

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
