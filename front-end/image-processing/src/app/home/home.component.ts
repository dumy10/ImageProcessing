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
   * Maximum file size in bytes (10MB) - matching backend limit in ImagesProcessor.h
   * @type {number}
   */
  private readonly MAX_FILE_SIZE: number = 10 * 1024 * 1024;

  /**
   * Maximum image dimension (width or height) in pixels
   * @type {number}
   */
  private readonly MAX_IMAGE_DIMENSION: number = 5000;

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
  async handleFiles(files: FileList | File[]): Promise<void> {
    try {
      // Validate file count
      if (files.length > 1) {
        this.showError('Invalid file count. Only one file is allowed.');
        return;
      }

      const file = files[0]; // Handle only the first file
      if (!file) return;

      // Run complete validation workflow
      const isValid = await this.validateImage(file);
      if (!isValid) return;

      // If we reached here, the file is valid - upload it
      this.loading = true;
      this.uploadImage(file);
    } catch (error) {
      this.showError(
        'There was an unexpected error. Please try another file.',
        error
      );
    }
  }

  /**
   * Performs all validation checks on the provided image file.
   * @param {File} file - The file to validate.
   * @returns {Promise<boolean>} - A promise that resolves to true if the file is valid, false otherwise.
   */
  private async validateImage(file: File): Promise<boolean> {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      this.showError(
        `File size exceeds the maximum limit of ${
          this.MAX_FILE_SIZE / (1024 * 1024)
        }MB.`
      );
      return false;
    }

    // Check MIME type
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validImageTypes.includes(file.type)) {
      this.showError('Please upload a valid image file (JPEG, JPG, PNG).');
      return false;
    }

    // Check file signature (magic numbers)
    const isValidSignature = await this.validateFileSignature(file);
    if (!isValidSignature) {
      this.showError(
        'The file does not appear to be a valid image. Please upload a valid JPEG or PNG image.'
      );
      return false;
    }

    // Check image content
    const isValidContent = await this.validateImageContent(file);
    return isValidContent;
  }

  /**
   * Displays an error message in the console and as an alert.
   * @param {string} message - The error message to display.
   * @param {any} [error] - Optional error object for logging.
   */
  private showError(message: string, error?: any): void {
    if (error) {
      console.error(message, error);
    } else {
      console.error(message);
    }
    alert(message);
  }

  /**
   * Validates the file signature (magic numbers) to ensure it's actually an image file.
   * @param {File} file - The file to validate.
   * @returns {Promise<boolean>} - A promise that resolves to true if the file signature is valid, false otherwise.
   */
  private validateFileSignature(file: File): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const arr = new Uint8Array(e.target?.result as ArrayBuffer);

        // Check for common image file signatures (magic numbers)

        // JPEG: Starts with FF D8 FF
        const isJpeg = arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff;

        // PNG: Starts with 89 50 4E 47 0D 0A 1A 0A
        const isPng =
          arr[0] === 0x89 &&
          arr[1] === 0x50 &&
          arr[2] === 0x4e &&
          arr[3] === 0x47 &&
          arr[4] === 0x0d &&
          arr[5] === 0x0a &&
          arr[6] === 0x1a &&
          arr[7] === 0x0a;

        resolve(isJpeg || isPng);
      };

      reader.onerror = () => {
        resolve(false);
      };

      // Read the first few bytes of the file
      const blob = file.slice(0, 8);
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * Validates that the file actually contains a valid image by loading it into an HTMLImageElement.
   * @param {File} file - The file to validate.
   * @returns {Promise<boolean>} - A promise that resolves to true if the file is a valid image, false otherwise.
   */
  private validateImageContent(file: File): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      // Create a FileReader to read the file content
      const reader = new FileReader();

      // Set up the load event handler
      reader.onload = (e) => {
        // Create an image element to verify the file content
        const img = new Image();

        // Set up the load event for the image
        img.onload = () => {
          // Validate image dimensions
          if (
            img.width > this.MAX_IMAGE_DIMENSION ||
            img.height > this.MAX_IMAGE_DIMENSION
          ) {
            this.showError(
              `Image dimensions (${img.width}x${img.height}) exceed the maximum allowed (${this.MAX_IMAGE_DIMENSION}px).`
            );
            resolve(false);
            return;
          }

          // If we reach here, the image is valid
          resolve(true);
        };

        // Set up the error event for the image
        img.onerror = () => {
          // If the image fails to load, it's not a valid image
          this.showError(
            'The file appears to be corrupted or is not a valid image format.'
          );
          resolve(false);
        };

        // Try to load the image with the data URL
        img.src = e.target?.result as string;
      };

      // Set up the error event handler for the FileReader
      reader.onerror = () => {
        this.showError('Error reading file.');
        resolve(false);
      };

      // Read the file as a data URL
      reader.readAsDataURL(file);
    });
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
        this.showError('Error uploading image', error);
      },
      complete: () => {
        this.loading = false;
        console.log('Upload complete');
      },
    });
  }
}
