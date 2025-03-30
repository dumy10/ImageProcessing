import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { LoadingComponent } from '../loading/loading.component';
import { ImageModel } from '../models/ImageModel';
import { ImageService } from '../services/image.service';

/**
 * HomeComponent is the main component for the home page of the application.
 * It handles the drag-and-drop functionality for image uploads and displays
 * a loading message while the image is being uploaded.
 *
 * @component
 * @selector app-home
 * @imports CommonModule, LoadingComponent, MatIconModule, MatButtonModule
 * @templateUrl ./home.component.html
 * @styleUrl ./home.component.scss
 */
@Component({
  selector: 'app-home',
  imports: [CommonModule, LoadingComponent, MatIconModule, MatButtonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  /**
   * Indicates whether the application is currently loading.
   * @type {boolean}
   */
  loading: boolean = false;

  /**
   * Message displayed while the image is being uploaded.
   * @type {string}
   */
  loadingMessage: string = 'Uploading image, please wait..';

  /**
   * Constructor for HomeComponent.
   * @param {ImageService} imageService - Service for handling image operations.
   * @param {Router} router - Router for navigating between pages.
   */
  constructor(private imageService: ImageService, private router: Router) {}

  /**
   * Handles the drag over event to allow image drop.
   * @param {DragEvent} event - The drag event.
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault(); // Necessary to allow drop
    event.stopPropagation();

    // Find the dropzone element
    const dropzone = document.querySelector('.inner-box.dropzone');
    if (dropzone) {
      dropzone.classList.add('dragging');
    }
  }

  /**
   * Handles the drag leave event to remove the dragging class.
   * @param {DragEvent} event - The drag event.
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Check if the mouse has actually left the dropzone
    // Only remove class if relatedTarget is not inside the dropzone
    const dropzone = document.querySelector(
      '.inner-box.dropzone'
    ) as HTMLElement;
    const relatedTarget = event.relatedTarget as Node;

    if (
      dropzone &&
      !dropzone.contains(relatedTarget) &&
      relatedTarget !== dropzone
    ) {
      dropzone.classList.remove('dragging');
    }
  }

  /**
   * Handles the drop event to process the dropped image file.
   * @param {DragEvent} event - The drop event.
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    // Find the dropzone element and remove the dragging class
    const dropzone = document.querySelector('.inner-box.dropzone');
    if (dropzone) {
      dropzone.classList.remove('dragging');
    }

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Handle the dropped file
      this.handleFiles(files);
    }
  }

  /**
   * Handles the click event to trigger the file upload input.
   */
  onUploadClick(): void {
    const uploadInput = document.getElementById(
      'imageUpload'
    ) as HTMLInputElement;
    uploadInput.click();
  }

  /**
   * Handles the image selection event to process the selected image file.
   * @param {Event} event - The image selection event.
   */
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.handleFiles([file]);
    }
  }

  /**
   * Processes the selected or dropped image files.
   * @param {FileList | File[]} files - The image files to process.
   */
  handleFiles(files: FileList | File[]): void {
    // The user isnt allowed to select multiple files but he can drop them, throw an error as it is not allowed
    if (files.length > 1) {
      console.error('Invalid file count. Only one file is allowed.');
      alert('Please upload only one file.');
      return;
    }

    const file = files[0]; // Handle only the first file

    if (file) {
      const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];

      // Check if file is an image
      if (validImageTypes.includes(file.type)) {
        this.loading = true;
        // Process the image file
        this.uploadImage(file);
      } else {
        console.error('Invalid file type. Only images are allowed.');
        alert('Please upload a valid image file (JPEG, JPG, PNG).');
      }
    }
  }

  /**
   * Uploads the image file to the server.
   * @param {File} file - The image file to upload.
   */
  uploadImage(file: File): void {
    this.imageService.uploadImage(file).subscribe({
      next: (response: ImageModel) => {
        this.loading = false;
        this.router.navigate(['/edit', response.id]);
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        console.error('Error uploading image:', error);
        alert(error.message);
      },
      complete: () => {
        this.loading = false;
        console.log('Upload complete');
      },
    });
  }
}
