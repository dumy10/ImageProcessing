import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { ImageService } from '../services/image.service';
import { ImageModel } from '../models/ImageModel';
import { LoadingComponent } from '../loading/loading.component';

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
  imagePath: string = '';

  constructor(private router: Router, private imageService: ImageService) {}

  // TO DO: Implement the image editing functionality
  // - Allow the user to edit the image
  // - Save the edited image

  ngOnInit(): void {
    this.loading = true;
    const id = this.getIdFromUrl();

    if (id === undefined) {
      console.error('Invalid image ID');
      this.router.navigate(['/']);
    }
    // fetch the image from the server
    this.loadImage(id as string);
  }

  loadImage(id: string): void {
    this.imageService.getImage(id).subscribe({
      next: (response) => {
        const image = response as ImageModel;
        this.imagePath = image.url;
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to fetch image', error);
        alert('Failed to fetch the image');
        this.loading = false;
        this.router.navigate(['/']);
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private getIdFromUrl(): string | undefined {
    const url = window.location.href;
    return url.split('/').pop();
  }
}
