import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NavigationEnd, Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, filter, finalize } from 'rxjs/operators';
import { FilterSidebarComponent } from '../filter-sidebar/filter-sidebar.component';
import { LoadingComponent } from '../loading/loading.component';
import { Filters } from '../models/filters';
import { ImageModel } from '../models/ImageModel';
import { ErrorHandlingService } from '../services/error-handling.service';
import { ImageService } from '../services/image.service';
import {
  ErrorAction,
  ErrorBannerComponent,
} from '../shared/error-banner/error-banner.component';

/**
 * EditImageComponent is a component that allows users to edit an image by applying various filters.
 * It fetches the image from the server and provides a UI for applying filters.
 */
@Component({
  selector: 'app-edit-image',
  standalone: true,
  imports: [
    MatButtonModule,
    MatSnackBarModule,
    LoadingComponent,
    CommonModule,
    MatIconModule,
    FilterSidebarComponent,
    ErrorBannerComponent,
  ],
  templateUrl: './edit-image.component.html',
  styleUrl: './edit-image.component.scss',
})
export class EditImageComponent implements OnInit {
  loading = false;
  loadingMessage = 'Loading the image...';
  image: ImageModel | undefined;
  imagePath = '';
  filters: Filters[] = [];
  isMobileView = false;
  undoStack: string[] = [];
  redoStack: string[] = [];
  sidebarCollapsed = false;
  lastAppliedFilter: Filters | null = null;
  lastSuccessfulOperation: ImageModel | undefined;
  errorState = false;
  errorMessage = '';
  errorActions: ErrorAction[] = [];
  imageLoadTimeout: any = null;
  imageLoadDelayMs = 3000; // 3 seconds delay before showing error

  constructor(
    private router: Router,
    private imageService: ImageService,
    private errorHandling: ErrorHandlingService
  ) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.loading = true;
    const id = this.getIdFromUrl();

    if (id === undefined) {
      console.error('Invalid image ID');
      this.router.navigate(['/']);
      return;
    }

    this.filters = Object.values(Filters);
    this.loadImage(id);

    // listen for navigation events to load the new image when going back
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const newId = this.getIdFromUrl();
        if (newId && newId !== this.image?.id) {
          this.loadImage(newId);
        }
      });
  }

  getIdFromUrl(): string | undefined {
    const url = window.location.href;
    const editIndex = url.indexOf('/edit/');
    return editIndex === -1
      ? undefined
      : url.substring(editIndex + '/edit/'.length);
  }

  loadImage(id: string): void {
    this.loading = true;
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];

    // Clear any existing timeout
    if (this.imageLoadTimeout) {
      clearTimeout(this.imageLoadTimeout);
      this.imageLoadTimeout = null;
    }

    this.imageService
      .getImage(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.image = response as ImageModel;
          this.lastSuccessfulOperation = this.cloneImageModel(this.image);
          this.imagePath = this.image.url;
        },
        error: (error: HttpErrorResponse) => {
          // Set a timeout before showing the error state
          this.imageLoadTimeout = setTimeout(() => {
            this.errorState = true;

            if (error.status === 404) {
              this.errorMessage = `Image not found. The requested image may have been deleted or is unavailable.`;
            } else {
              this.errorMessage = `Failed to load image: ${this.errorHandling.getReadableErrorMessage(
                error
              )}`;
            }

            console.error('Failed to fetch image', error);
            this.errorActions = [
              {
                label: 'Retry',
                icon: 'refresh',
                action: () => this.loadImage(id),
              },
            ];

            this.errorHandling.showErrorWithRetry(
              'Failed to load image',
              this.errorHandling.getReadableErrorMessage(error),
              () => this.loadImage(id)
            );

            this.imageLoadTimeout = null;
          }, this.imageLoadDelayMs);
        },
      });
  }

  filterImage(filter: Filters): void {
    if (!this.image) {
      console.error('No image to edit');
      return;
    }

    this.loading = true;
    this.loadingMessage = `Applying filter: ${filter}...`;
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];
    this.lastAppliedFilter = filter;

    // Store the current image ID in the undo stack before applying a new filter
    if (this.image.id) {
      this.undoStack.push(this.image.id);
      this.redoStack = []; // Clear redo stack when a new filter is applied

      // Save current state for recovery if needed
      this.lastSuccessfulOperation = this.cloneImageModel(this.image);
    }

    this.imageService
      .editImage(this.image.id, filter.toString().toLowerCase())
      .pipe(
        finalize(() => (this.loading = false)),
        catchError((error: HttpErrorResponse) => {
          this.errorState = true;
          this.handleFilterError(error, filter);
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.image = response as ImageModel;
            this.lastSuccessfulOperation = this.cloneImageModel(this.image);
            this.imagePath = this.image.url;
            this.router.navigate(['/edit', response.id]);
          }
        },
      });
  }

  private handleFilterError(error: HttpErrorResponse, filter: Filters): void {
    console.error(
      `Failed to apply ${filter.toString().toLowerCase()} filter`,
      error
    );

    // Set error message for the banner
    this.errorMessage = this.errorHandling.getErrorMessageByStatus(
      error,
      `${filter} filter`
    );

    // Set up error actions
    this.errorActions = [
      {
        label: 'Retry',
        icon: 'refresh',
        action: () => this.filterImage(filter),
      },
      {
        label: 'Restore',
        icon: 'restore',
        action: () => this.restoreLastSuccessfulState(),
      },
    ];

    this.errorHandling.showErrorWithActions(
      this.errorMessage,
      this.errorHandling.getReadableErrorMessage(error),
      this.errorActions
    );
  }

  restoreLastSuccessfulState(): void {
    if (this.lastSuccessfulOperation) {
      this.image = this.cloneImageModel(this.lastSuccessfulOperation);
      this.imagePath = this.image.url;
      this.errorState = false;
      this.errorMessage = '';
      this.errorActions = [];
    } else {
      // If we don't have a saved state, try to undo
      this.undoFilter();
    }
  }

  downloadImage(): void {
    if (!this.image) {
      console.error('No image to download');
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Downloading the image...';
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];

    this.imageService
      .downloadImage(this.image.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          const url = window.URL.createObjectURL(response);
          const a = document.createElement('a');
          a.href = url;
          a.download = this.image?.name || 'image';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        error: (error: HttpErrorResponse) => {
          this.errorState = true;
          this.errorMessage = `Failed to download image: ${this.errorHandling.getReadableErrorMessage(
            error
          )}`;
          console.error('Failed to download image', error);

          this.errorActions = [
            {
              label: 'Retry',
              icon: 'refresh',
              action: () => this.downloadImage(),
            },
          ];

          this.errorHandling.showErrorWithRetry(
            'Download failed',
            this.errorHandling.getReadableErrorMessage(error),
            () => this.downloadImage()
          );
        },
      });
  }

  onImageError(): void {
    // Clear any previous timeout
    if (this.imageLoadTimeout) {
      clearTimeout(this.imageLoadTimeout);
    }

    // Set a timeout to delay showing the error state
    this.imageLoadTimeout = setTimeout(() => {
      this.imagePath = 'assets/images/notfound.jpg';
      this.errorState = true;
      this.errorMessage = 'Failed to load image. Using placeholder instead.';
      this.errorActions = [];
      this.imageLoadTimeout = null;
    }, this.imageLoadDelayMs);
  }

  onImageLoad(): void {
    // Clear any pending error timeout since the image loaded successfully
    if (this.imageLoadTimeout) {
      clearTimeout(this.imageLoadTimeout);
      this.imageLoadTimeout = null;
    }

    if (this.image) {
      this.image.loaded = true;
    }
  }

  undoFilter(): void {
    if (!this.image) {
      console.error('No image to undo');
      return;
    }

    if (this.undoStack.length === 0) {
      // If no items in undo stack but image has a parent, use it (for initial state)
      if (!this.image.parentId) {
        this.errorHandling.showErrorWithRetry(
          'Cannot undo',
          "The image hasn't been edited yet",
          () => {}
        );
        return;
      }

      if (this.image.id) {
        this.redoStack.push(this.image.id);
      }

      this.navigateToImage(this.image.parentId);
      return;
    }

    const previousImageId = this.undoStack.pop();

    if (this.image.id) {
      this.redoStack.push(this.image.id);
    }

    this.navigateToImage(previousImageId as string);
  }

  redoFilter(): void {
    if (this.redoStack.length === 0) {
      return; // Nothing to redo
    }

    const nextImageId = this.redoStack.pop();

    if (this.image?.id) {
      this.undoStack.push(this.image.id);
    }

    this.navigateToImage(nextImageId as string);
  }

  private navigateToImage(imageId: string): void {
    this.loading = true;
    this.loadingMessage = 'Loading image...';
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];

    this.imageService
      .getImage(imageId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.image = response as ImageModel;
          this.lastSuccessfulOperation = this.cloneImageModel(this.image);
          this.imagePath = this.image.url;
          this.router.navigate(['/edit', response.id]);
        },
        error: (error: HttpErrorResponse) => {
          this.errorState = true;

          this.errorMessage = this.errorHandling.getErrorMessageByStatus(
            error,
            'image'
          );

          console.error('Failed to fetch image', error);

          this.errorActions = [
            {
              label: 'Retry',
              icon: 'refresh',
              action: () => this.navigateToImage(imageId),
            },
          ];

          this.errorHandling.showErrorWithRetry(
            'Failed to load image',
            this.errorHandling.getReadableErrorMessage(error),
            () => this.navigateToImage(imageId)
          );
        },
      });
  }

  dismissError(): void {
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];
  }

  hasAppliedFilters(): boolean {
    // Use optional chaining and nullish coalescing to safely check if appliedFilters exists and has items
    return (this.image?.appliedFilters?.length ?? 0) > 0;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0 || !!this.image?.parentId;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobileView = window.innerWidth <= 768;
  }

  // Helper to create a deep copy of an ImageModel for state recovery
  private cloneImageModel(image: ImageModel): ImageModel {
    return {
      ...image,
      appliedFilters: [...(image.appliedFilters || [])],
    };
  }

  ngOnDestroy(): void {
    // Clean up any pending timeouts when component is destroyed
    if (this.imageLoadTimeout) {
      clearTimeout(this.imageLoadTimeout);
    }
  }
}
