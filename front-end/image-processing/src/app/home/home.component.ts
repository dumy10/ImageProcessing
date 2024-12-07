import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ImageService } from '../services/image.service';
import { ImageModel } from '../models/ImageModel';
import { LoadingComponent } from '../loading/loading.component';

@Inject('ImageService')
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, LoadingComponent],
  providers: [ImageService],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  loading: boolean = false;
  loadingMessage: string = 'Uploading image, please wait..';

  constructor(private imageService: ImageService, private router: Router) {}

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow drop
    const dropzone = event.target as HTMLElement;
    dropzone.classList.add('dragging');
  }

  onDragLeave(event: DragEvent) {
    const dropzone = event.target as HTMLElement;
    dropzone.classList.remove('dragging');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const dropzone = event.target as HTMLElement;
    dropzone.classList.remove('dragging');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Handle the dropped file
      this.handleFiles(files);
    }
  }

  onUploadClick() {
    const uploadInput = document.getElementById(
      'imageUpload'
    ) as HTMLInputElement;
    uploadInput.click();
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFiles([file]);
    }
  }

  handleFiles(files: FileList | File[]) {
    // The user isnt allowed to select multiple files but he can drop them, throw an error as it is not allowed
    if (files.length > 1) {
      console.error('Invalid file count. Only one file is allowed.');
      alert('Please upload only one file.');
      return;
    }

    const file = files[0]; // Handle only the first file
    if (file) {
      const validImageTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];

      // Check if file is an image
      if (validImageTypes.includes(file.type)) {
        this.loading = true;
        // Process the image file
        this.imageService.uploadImage(file).subscribe({
          next: (response: ImageModel) => {
            this.loading = false;
            this.router.navigate(['/edit', response.id]);
          },
          error: (error) => {
            this.loading = false;
            console.error('Error uploading image:', error);
            alert(
              'An error occurred while uploading the image. Please try again.'
            );
          },
          complete: () => {
            this.loading = false;
            console.log('Upload complete');
          },
        });
      } else {
        console.error('Invalid file type. Only images are allowed.');
        alert(
          'Please upload a valid image file (JPEG, JPG, PNG, GIF, WebP, SVG).'
        );
      }
    }
  }
}
