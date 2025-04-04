import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NavigationEnd, Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { catchError, filter, finalize } from 'rxjs/operators';
import { FilterSidebarComponent } from '../filter-sidebar/filter-sidebar.component';
import { LoadingComponent } from '../loading/loading.component';
import { Filters } from '../models/filters';
import { ImageModel } from '../models/ImageModel';
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
export class EditImageComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('imageElement') imageElement: ElementRef | undefined;

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
  isFilterOperation = false; // Flag to distinguish between initial load and filter operation
  imageLoaded = false; // Track image loaded state separately

  // Progress tracking variables
  progressPercentage = 0;
  showProgress = false;
  private progressSubscription: Subscription | null = null;

  constructor(
    private router: Router,
    private imageService: ImageService,
    private errorHandling: ErrorHandlingService,
    private cdr: ChangeDetectorRef,
    private progressTracker: ProgressTrackerService
  ) {}

  // Helper method to normalize filter names (remove spaces)
  private normalizeFilterName(filterName: string): string {
    return filterName.toLowerCase().replace(/\s+/g, '');
  }

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

    // Start the SignalR connection for progress updates
    this.connectToProgressHub();
  }

  ngAfterViewInit(): void {
    // Check if image is already loaded (from cache)
    this.checkImageLoadedStatus();
  }

  ngOnDestroy(): void {
    // Clean up any pending timeouts when component is destroyed
    if (this.imageLoadTimeout) {
      clearTimeout(this.imageLoadTimeout);
    }

    // Unsubscribe from progress updates
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
    }

    // Stop the SignalR connection
    this.progressTracker.stopConnection();
  }

  // Connect to the SignalR hub for progress updates
  private async connectToProgressHub(): Promise<void> {
    try {
      // Start the connection and give it time to connect
      this.progressSubscription = this.progressTracker
        .startConnection()
        .subscribe((update: ProgressUpdate) => {
          // Only update progress if it's for the current image or filter
          if (
            this.image?.id &&
            update.imageId === this.image.id &&
            this.lastAppliedFilter &&
            this.normalizeFilterName(update.filter) ===
              this.normalizeFilterName(this.lastAppliedFilter.toString())
          ) {
            // Handle the progress update
            this.handleProgressUpdate(update.progress);
          }
        });

      // Wait for connection to be established with a 5-second timeout
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

  // Handle progress updates
  private handleProgressUpdate(progress: number): void {
    // Handle error case (-1) separately
    if (progress === -1) {
      // Error state will be handled by the error pipeline
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
        this.cdr.detectChanges();
      }, 1000); // Keep it visible for a second after completion
    }

    // Force UI update
    this.cdr.detectChanges();
  }

  // Check if the image is already loaded (cached)
  private checkImageLoadedStatus(): void {
    setTimeout(() => {
      // First try using ViewChild reference
      if (this.imageElement) {
        const imgEl = this.imageElement.nativeElement as HTMLImageElement;
        if (imgEl && imgEl.complete && imgEl.naturalHeight !== 0) {
          this.onImageLoad();
          this.cdr.detectChanges();
          return;
        }
      }

      // Fallback to querySelector if ViewChild is not available yet
      const img = document.querySelector('.image') as HTMLImageElement;
      if (img && img.complete && img.naturalHeight !== 0) {
        this.onImageLoad();
        this.cdr.detectChanges();
      }
    }, 0);
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
    this.isFilterOperation = false;
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];
    this.imageLoaded = false; // Reset image loaded state
    this.showProgress = false;
    this.progressPercentage = 0;

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

          // Explicitly set loaded state for both component and model
          this.imageLoaded = true;
          this.image.loaded = true;

          // Handle the case where image might be loaded from cache
          // Set a small timeout to allow the browser to process the image
          setTimeout(() => this.checkImageLoadedStatus(), 50);
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
      this.errorHandling.showErrorWithRetry(
        'Image Filtering',
        'No image to filter. Please load an image first.',
        () => {}, // No retry action needed, just a dismiss
        'Dismiss'
      );
      return;
    }

    if (this.isFilterOperation) {
      this.errorHandling.showErrorWithRetry(
        'Filter in progress',
        'A filter operation is already in progress. Please wait.',
        () => {}, // No retry action needed, just a dismiss
        'Dismiss'
      );
      return;
    }

    this.loading = true;
    this.isFilterOperation = true; // Mark this as a filter operation
    this.loadingMessage = `Applying filter: ${filter}...`;
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];
    this.lastAppliedFilter = filter;
    this.showProgress = true;
    this.progressPercentage = 0;

    // Store the current image ID in the undo stack before applying a new filter
    if (this.image.id) {
      this.undoStack.push(this.image.id);
      this.redoStack = []; // Clear redo stack when a new filter is applied

      // Save current state for recovery if needed
      this.lastSuccessfulOperation = this.cloneImageModel(this.image);
    }

    this.imageService
      .editImage(
        this.image.id,
        this.normalizeFilterName(filter.toString()),
        true
      ) // Enable progress tracking
      .pipe(
        finalize(() => {
          this.loading = false;
          this.isFilterOperation = false;
        }),
        catchError((error: HttpErrorResponse) => {
          this.errorState = true;
          this.handleFilterError(error, filter);
          this.showProgress = false; // Hide progress on error
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            this.image = response as ImageModel;
            this.image.loaded = true; // Set loaded to true immediately for filtered images
            this.imageLoaded = true; // Also set component-level flag
            this.lastSuccessfulOperation = this.cloneImageModel(this.image);
            this.imagePath = this.image.url;
            this.router.navigate(['/edit', response.id], { replaceUrl: true });

            // In case we don't get a 100% progress update from SignalR
            setTimeout(() => {
              this.showProgress = false;
              this.progressPercentage = 0;
              this.cdr.detectChanges();
            }, 1000);
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
    this.isFilterOperation = true; // Use the overlay for downloads too
    this.loadingMessage = 'Downloading the image...';
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];

    this.imageService
      .downloadImage(this.image.id)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.isFilterOperation = false;
        })
      )
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

    // Set both component-level and model-level loaded flags
    this.imageLoaded = true;

    if (this.image) {
      this.image.loaded = true;
      // Force change detection to ensure UI updates
      this.cdr.detectChanges();
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
    this.isFilterOperation = true; // Use overlay for navigation
    this.loadingMessage = 'Loading image...';
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];
    this.imageLoaded = false; // Reset image loaded state
    this.showProgress = false;
    this.progressPercentage = 0;

    this.imageService
      .getImage(imageId)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.isFilterOperation = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.image = response as ImageModel;
          this.lastSuccessfulOperation = this.cloneImageModel(this.image);
          this.imagePath = this.image.url;

          // Explicitly set loaded state for both component and model
          this.imageLoaded = true;
          this.image.loaded = true;

          this.router.navigate(['/edit', response.id], { replaceUrl: true });

          // Check if image is already loaded (from cache)
          setTimeout(() => this.checkImageLoadedStatus(), 50);
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
}
