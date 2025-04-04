import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoadingComponent } from '../loading/loading.component';
import { ErrorHandlingService } from '../services/error-handling.service';
import { ImageService } from '../services/image.service';
import {
  ProgressTrackerService,
  ProgressUpdate,
} from '../services/progress-tracker.service';
import {
  ErrorAction,
  ErrorBannerComponent,
} from '../shared/error-banner/error-banner.component';

/**
 * HomeComponent is the main component for the home page of the application.
 * It handles the drag-and-drop functionality for image uploads and displays
 * a loading message while the image is being uploaded.
 *
 * @component
 * @selector app-home
 * @imports CommonModule, LoadingComponent, MatIconModule, MatButtonModule, ErrorBannerComponent
 * @templateUrl ./home.component.html
 * @styleUrl ./home.component.scss
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    LoadingComponent,
    MatIconModule,
    MatButtonModule,
    ErrorBannerComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit, OnDestroy {
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
   * Indicates whether there's an error to display
   * @type {boolean}
   */
  errorState: boolean = false;

  /**
   * Error message to display
   * @type {string}
   */
  errorMessage: string = '';

  /**
   * Available actions for the error
   * @type {ErrorAction[]}
   */
  errorActions: ErrorAction[] = [];

  /**
   * Progress tracking variables
   */
  progressPercentage: number = 0;
  showProgress: boolean = false;
  private progressSubscription: Subscription | null = null;
  private uploadingFile: File | null = null;
  private uploadingFileId: string | null = null;

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
   * @param {ErrorHandlingService} errorHandling - Service for handling errors.
   * @param {ProgressTrackerService} progressTracker - Service for tracking progress.
   */
  constructor(
    private imageService: ImageService,
    private router: Router,
    private errorHandling: ErrorHandlingService,
    private progressTracker: ProgressTrackerService
  ) {}

  /**
   * Initialize the component
   */
  ngOnInit(): void {
    // Connect to the SignalR hub for progress updates
    this.connectToProgressHub();
  }

  /**
   * Clean up subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }

    // Stop the SignalR connection
    this.progressTracker.stopConnection();
  }

  /**
   * Connect to the SignalR hub for progress updates
   */
  private async connectToProgressHub(): Promise<void> {
    try {
      // Start the connection and give it time to connect
      this.progressSubscription = this.progressTracker
        .startConnection()
        .subscribe((update: ProgressUpdate) => {
          // For upload progress, filter is 'upload'
          if (
            update.imageId === this.uploadingFileId &&
            update.filter.toLowerCase() === 'upload'
          ) {
            this.handleProgressUpdate(update.progress);
          }
        });

      // Wait for connection to be established
      const connected = await this.progressTracker.waitForConnection(5000);
      if (!connected) {
        console.warn(
          'Could not establish SignalR connection within timeout. Progress updates may be delayed.'
        );
      }
    } catch (error) {
      console.error('Error connecting to progress hub:', error);
    }
  }

  /**
   * Handle progress updates from the server
   * @param {number} progress - The progress percentage (0-100)
   */
  private handleProgressUpdate(progress: number): void {
    // Handle error case (-1) separately
    if (progress === -1) {
      this.showProgress = false;
      return;
    }

    // Update the progress bar
    this.progressPercentage = progress;
    this.showProgress = true;

    // If we reach 100%, hide the progress bar after a delay
    if (progress >= 100) {
      setTimeout(() => {
        this.showProgress = false;
        this.progressPercentage = 0;
      }, 500); // Keep it visible for half a second after completion
    }
  }

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
      // Reset any previous errors
      this.dismissError();

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
      this.uploadingFile = file;
      this.uploadImage(file);
    } catch (error) {
      this.showError(
        'There was an unexpected error. Please try another file.',
        error
      );
    }
  }

  /**
   * Dismisses the current error message
   */
  dismissError(): void {
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];
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
   * Displays an error message using the error handling service.
   * @param {string} message - The error message to display.
   * @param {any} [error] - Optional error object for logging.
   */
  private showError(message: string, error?: any): void {
    if (error) {
      console.error(message, error);
    } else {
      console.error(message);
    }

    this.errorState = true;
    this.errorMessage = message;
    this.errorActions = [
      {
        label: 'Dismiss',
        icon: 'close',
        action: () => this.dismissError(),
      },
      {
        label: 'Try Again',
        icon: 'refresh',
        action: () => {
          this.dismissError();
          this.onUploadClick();
        },
      },
    ];
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
    // Reset progress tracking
    this.progressPercentage = 0;
    this.showProgress = true;
    this.loadingMessage = `Uploading ${file.name}...`;

    // Generate a temporary ID for tracking progress
    this.uploadingFileId = `upload_${Date.now()}`;

    // Upload the image with SignalR progress tracking
    this.imageService
      .uploadImage(
        file,
        true, // Enable progress tracking
        true, // Use SignalR for progress tracking
        this.uploadingFileId // Pass the temporary ID to the backend
      )
      .subscribe({
        next: (response: any) => {
          // Filter out progress updates and process only the final response
          if (typeof response !== 'number') {
            // Wait before navigating to the edit page
            setTimeout(() => {
              this.loading = false;
              this.showProgress = false;
              this.uploadingFile = null;
              this.router.navigate(['/edit', response.id]);
            }, 500);
          }
        },
        error: (error: HttpErrorResponse) => {
          this.loading = false;
          this.showProgress = false;
          this.uploadingFile = null;

          const errorMessage = this.errorHandling.getErrorMessageByStatus(
            error,
            'image upload'
          );

          this.errorState = true;
          this.errorMessage = errorMessage;
          this.errorActions = [
            {
              label: 'Try Again',
              icon: 'refresh',
              action: () => {
                this.dismissError();
                this.uploadImage(file);
              },
            },
          ];

          this.errorHandling.showErrorWithRetry(
            'Error uploading image',
            this.errorHandling.getReadableErrorMessage(error),
            () => this.uploadImage(file)
          );
        },
        complete: () => {
          this.loading = false;
          this.showProgress = false;
          console.log('Upload complete');
        },
      });
  }
}
