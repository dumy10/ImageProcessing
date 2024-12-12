import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ImageService } from '../services/image.service';
import { ImageModel } from '../models/ImageModel';
import { LoadingComponent } from '../loading/loading.component';
import { Filters } from '../models/filters';

@Inject('ImageService')
@Component({
  selector: 'app-edit-image',
  standalone: true,
  imports: [MatButtonModule, LoadingComponent, CommonModule],
  providers: [ImageService],
  templateUrl: './edit-image.component.html',
  styleUrl: './edit-image.component.scss',
})
export class EditImageComponent implements OnInit {
  loading: boolean = false;
  loadingMessage: string = 'Loading the image...';
  image: ImageModel | undefined;
  imagePath: string = '';

  filters: Filters[] = [];

  constructor(private router: Router, private imageService: ImageService) {}

  ngOnInit(): void {
    this.loading = true;
    const id = this.getIdFromUrl();

    if (id === undefined) {
      console.error('Invalid image ID');
      this.router.navigate(['/']);
    }

    this.filters = Object.values(Filters);

    // fetch the image from the server
    this.loadImage(id as string);
  }

  loadImage(id: string): void {
    this.imageService.getImage(id).subscribe({
      next: (response) => {
        this.image = response as ImageModel;
        this.imagePath = this.image.url;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to fetch image', error);
        alert('Failed to fetch the image');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  getIdFromUrl(): string | undefined {
    const url = window.location.href;
    return url.split('/').pop();
  }

  filterImage(filter: Filters): void {
    if (!this.image) {
      console.error('No image to edit');
      return;
    }

    this.loading = true;
    this.loadingMessage = `Applying filter: ${filter}...`;

    this.imageService
      .editImage(this.image.id, filter.toString().toLowerCase())
      .subscribe({
        next: (response) => {
          this.image = response as ImageModel;
          this.imagePath = this.image.url;
          this.router.navigate(['/edit', response.id]);
        },
        error: (error) => {
          console.error('Failed to edit image', error);
          alert('Failed to edit the image');
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }
}
