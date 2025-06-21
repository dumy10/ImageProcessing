import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ImageHierarchyComponent } from '../image-hierarchy/image-hierarchy.component';
import { LoadingComponent } from '../loading/loading.component';
import { ImageModel } from '../models/ImageModel';
import { CacheService } from '../services/cache.service';
import { ErrorHandlingService } from '../services/error-handling.service';
import { ImageService } from '../services/image.service';
import {
  ErrorAction,
  ErrorBannerComponent,
} from '../shared/error-banner/error-banner.component';
import { environment } from '../../environments/environment';

/**
 * GalleryComponent is a component that displays a gallery of images with pagination.
 * It allows users to view and interact with a collection of original and filtered images.
 *
 * @component
 * @selector app-gallery
 * @imports CommonModule, LoadingComponent, MatPaginatorModule, MatIconModule, MatButtonModule
 * @providers ImageService
 * @templateUrl ./gallery.component.html
 * @styleUrl ./gallery.component.scss
 */
@Component({
  selector: 'app-gallery',
  imports: [
    CommonModule,
    LoadingComponent,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    ErrorBannerComponent,
  ],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent implements OnInit, OnDestroy {
  /**
   * Indicates whether the application is currently loading.
   * @type {boolean}
   */
  loading: boolean = false;

  /**
   * Message displayed while loading images.
   * @type {string}
   */
  loadingMessage: string = 'Loading images...';

  /**
   * Array of image pairs, each containing an original image and its filtered version.
   * @type {Array<{ originalImage: ImageModel; filteredImage: ImageModel }>}
   */
  imagePairs: Array<{ originalImage: ImageModel; filteredImage: ImageModel }> =
    [];

  /**
   * Array of paginated image pairs for the current page.
   * @type {Array<{ originalImage: ImageModel; filteredImage: ImageModel }>}
   */
  paginatedImagePairs: Array<{
    originalImage: ImageModel;
    filteredImage: ImageModel;
  }> = [];

  /**
   * Current page number in the pagination.
   * @type {number}
   */
  currentPage: number = 0;

  /**
   * Number of items to display per page.
   * @type {number}
   */
  itemsPerPage: number = 8;

  /**
   * Array of page size options for the paginator.
   * @type {number[]}
   */
  pageSizeOptions: number[] = [8, 16, 24];

  /**
   * Total number of pages in the pagination.
   * @type {number}
   */
  totalPages: number = 1;

  /**
   * Subscriptions to unsubscribe on component destruction
   * @type {Subscription[]}
   */
  private subscriptions: Subscription[] = [];

  /**
   * Flag to track if initial preloading has been performed
   * @type {boolean}
   */
  private initialPreloadDone: boolean = false;

  /**
   * Error state flag
   * @type {boolean}
   */
  errorState: boolean = false;

  /**
   * Error message to display
   * @type {string}
   */
  errorMessage: string = '';

  /**
   * Error actions for the banner
   * @type {ErrorAction[]}
   */
  errorActions: ErrorAction[] = [];

  /**
   * Constructor for GalleryComponent.
   * @param {MatDialog} dialog - The dialog service for opening dialogs.
   * @param {ImageService} imageService - Service for handling image operations.
   * @param {CacheService} cacheService - Service for caching images.
   * @param {Router} router - Router for navigating between pages.
   * @param {ActivatedRoute} route - The activated route for accessing URL parameters.
   * @param {ErrorHandlingService} errorHandling - Service for handling errors.
   */
  constructor(
    private dialog: MatDialog,
    private imageService: ImageService,
    private cacheService: CacheService,
    private router: Router,
    private route: ActivatedRoute,
    private errorHandling: ErrorHandlingService
  ) {}

  /**
   * Initializes the component and loads the images.
   */
  ngOnInit(): void {
    const paramsSub = this.route.queryParams.subscribe((params) => {
      this.currentPage = params['page'] ? +params['page'] : 0;
      this.itemsPerPage = params['pageSize'] ? +params['pageSize'] : 8;
      this.onPageChange({
        pageIndex: this.currentPage,
        pageSize: this.itemsPerPage,
      });
    });
    this.subscriptions.push(paramsSub);

    this.loading = true;
    this.loadImages();
  }

  /**
   * Clean up subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Loads the images from the server and sets up pagination.
   */
  loadImages(): void {
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];

    const imagesSub = this.imageService.getImages().subscribe({
      next: (response: ImageModel[]) => {
        // Reset the imagePairs array
        this.imagePairs = [];

        response.forEach((image) => {
          if (!image.parentUrl) {
            return;
          }

          const originalImage = response.find(
            (img) => img.id === image.parentId
          ) as ImageModel;

          if (originalImage) {
            this.imagePairs.push({
              originalImage,
              filteredImage: image,
            });
          }
        });

        if (this.imagePairs.length === 0) {
          this.loading = false;
          this.errorState = true;
          this.errorMessage = 'No filtered images found';
          this.errorActions = [
            {
              label: 'Retry',
              icon: 'refresh',
              action: () => this.loadImages(),
            },
          ];
          return;
        }

        this.updatePagination();
        this.loading = false;

        // Perform smart preloading
        this.performSmartPreloading();
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to fetch images', error);
        this.loading = false;

        this.errorState = true;
        if (error.status === 404) {
          this.errorMessage = 'No images found';
        } else {
          this.errorMessage = this.errorHandling.getErrorMessageByStatus(
            error,
            'images'
          );
        }

        this.errorActions = [
          {
            label: 'Retry',
            icon: 'refresh',
            action: () => this.loadImages(),
          },
        ];

        this.errorHandling.showErrorWithRetry(
          'Failed to load images',
          this.errorHandling.getReadableErrorMessage(error),
          () => this.loadImages()
        );
      },
      complete: () => {
        this.loading = false;
      },
    });
    this.subscriptions.push(imagesSub);
  }

  /**
   * Implements a smart preloading strategy based on user behavior and current page
   */
  performSmartPreloading(): void {
    if (!this.initialPreloadDone) {
      // First-time preloading strategy - preload current page plus some from next page
      this.preloadImagesForCurrentAndNextPage();

      // Mark initial preload as done
      this.initialPreloadDone = true;

      // Schedule additional preloading after a delay to not block initial render
      setTimeout(() => {
        // Preload additional pages based on navigation direction (default: forward)
        this.preloadAdditionalImages();
      }, 3000); // Wait 3 seconds before preloading more
    } else {
      // For subsequent navigation, just preload current and next page
      this.preloadImagesForCurrentAndNextPage();
    }

    // Log cache statistics for debugging
    console.debug('Cache stats:', this.cacheService.getCacheStats());
  }

  /**
   * Preloads images for the current page and next page to improve browsing experience
   */
  preloadImagesForCurrentAndNextPage(): void {
    // Preload all images on the current page
    this.paginatedImagePairs.forEach((pair) => {
      this.imageService.preloadImage(pair.originalImage.id);
      this.imageService.preloadImage(pair.filteredImage.id);
    });

    // Preload images for the next page if it exists
    if (this.currentPage < this.totalPages - 1) {
      const nextPageStartIndex = (this.currentPage + 1) * this.itemsPerPage;
      const nextPageEndIndex = nextPageStartIndex + this.itemsPerPage;
      const nextPageItems = this.imagePairs.slice(
        nextPageStartIndex,
        nextPageEndIndex
      );

      // Preload the first few images from the next page (limit to avoid too many requests)
      const preloadLimit = Math.min(nextPageItems.length, 3);
      nextPageItems.slice(0, preloadLimit).forEach((pair) => {
        this.imageService.preloadImage(pair.originalImage.id);
        this.imageService.preloadImage(pair.filteredImage.id);
      });
    }
  }

  /**
   * Preloads additional images for improved user experience beyond the current/next page
   */
  preloadAdditionalImages(): void {
    // Only preload additional images if there are multiple pages
    if (this.totalPages <= 2) return;

    // Determine how many additional pages to preload based on available bandwidth/cache
    const additionalPagesToPreload = Math.min(
      2,
      this.totalPages - this.currentPage - 2
    );
    if (additionalPagesToPreload <= 0) return;

    for (let i = 2; i <= additionalPagesToPreload + 1; i++) {
      const pageIndex = this.currentPage + i;
      if (pageIndex >= this.totalPages) break;

      const pageStartIndex = pageIndex * this.itemsPerPage;
      const pageEndIndex = pageStartIndex + this.itemsPerPage;
      const pageItems = this.imagePairs.slice(pageStartIndex, pageEndIndex);

      // For distant pages, only preload the first image or two
      const distantPreloadLimit = Math.min(pageItems.length, 2);
      for (let j = 0; j < distantPreloadLimit; j++) {
        // Use lower priority (setTimeout) to prevent blocking more important loads
        setTimeout(() => {
          if (pageItems[j]) {
            this.imageService.preloadImage(pageItems[j].originalImage.id);
            this.imageService.preloadImage(pageItems[j].filteredImage.id);
          }
        }, i * 1000); // Stagger the preloading
      }
    }
  }

  /**
   * Paginates the images based on the current page and items per page.
   */
  updatePagination(): void {
    this.totalPages = Math.ceil(this.imagePairs.length / this.itemsPerPage);
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedImagePairs = this.imagePairs.slice(startIndex, endIndex);
  }

  /**
   * Handles page change event from the paginator.
   * @param {any} event - The event.
   */
  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.itemsPerPage = event.pageSize;
    this.updatePagination();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: this.currentPage, pageSize: this.itemsPerPage },
      queryParamsHandling: 'merge',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Preload images when page changes
    this.performSmartPreloading();
  }

  /**
   * Navigates to the edit image page for the given image.
   * @param {ImageModel} image - The image to edit.
   */
  editImage(image: ImageModel): void {
    this.router.navigate(['/edit', image.id]);
  }

  /**
   * Opens a dialog to display the image hierarchy (vertical history).
   * For full tree visualization, navigates to the dedicated image-tree view.
   * @param {ImageModel} image - The image for which to display details.
   */
  openDialog(image: ImageModel): void {
    // Preload related images before opening the dialog
    this.preloadRelatedImages(image);

    // Open a dialog showing the vertical hierarchy (history) of this image
    const dialogRef = this.dialog.open(ImageHierarchyComponent, {
      data: this.getImageHierarchy(image),
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The hierarchy dialog was closed');
    });
  }

  /**
   * Navigate to the dedicated image tree view page for the full tree visualization
   * @param {ImageModel} image - The image for which to display the tree
   */
  viewImageTree(image: ImageModel): void {
    this.router.navigate(['/image-tree', image.id], {
      queryParams: {
        page: this.currentPage,
        pageSize: this.itemsPerPage,
      },
    });
  }

  /**
   * Preloads related images for a specific image
   * @param {ImageModel} image - The image whose related images should be preloaded
   */
  preloadRelatedImages(image: ImageModel): void {
    // Find all images related to this one in the image hierarchy
    const originalImage = this.getOriginalImage(image);

    // Find all filtered versions of the original image
    this.imagePairs
      .filter((pair) => pair.originalImage.id === originalImage.id)
      .forEach((pair) => {
        this.imageService.preloadImage(pair.filteredImage.id);
      });
  }

  /**
   * Gets the image hierarchy for the given image (for vertical history).
   * @param {ImageModel} image - The image for which to retrieve the hierarchy.
   * @returns {ImageModel[]} - An array of images representing the hierarchy.
   */
  getImageHierarchy(image: ImageModel): ImageModel[] {
    const imageHierarchy: ImageModel[] = [];
    let currentImage = image;

    // Keep adding parents to the hierarchy until we reach the root
    while (true) {
      imageHierarchy.unshift(currentImage);

      if (!currentImage.parentId) {
        break;
      }

      const parentImage = this.imagePairs.find(
        (imgPair) => imgPair.originalImage.id === currentImage.parentId
      )?.originalImage;

      if (!parentImage) {
        break;
      }

      currentImage = parentImage;
    }

    return imageHierarchy;
  }

  /**
   * Retrieves the original image by traversing up the hierarchy.
   * @param {ImageModel} image - The image for which to retrieve the original.
   * @returns {ImageModel} - The original image.
   */
  getOriginalImage(image: ImageModel): ImageModel {
    let currentImage = image;
    while (currentImage.parentId) {
      const parentImage = this.imagePairs.find(
        (imgPair) => imgPair.originalImage.id === currentImage.parentId
      )?.originalImage;

      if (!parentImage) {
        break;
      }

      currentImage = parentImage;
    }
    return currentImage;
  }

  /**
   * Downloads the given image.
   * @param {ImageModel} image - The image to download.
   */
  downloadImage(image: ImageModel): void {
    if (!image) {
      console.error('No image to download');
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Downloading the image...';
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];

    const downloadSub = this.imageService.downloadImage(image.id).subscribe({
      next: (response) => {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = image?.name || 'image';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to download image', error);
        this.loading = false;

        this.errorState = true;
        this.errorMessage = `Failed to download image: ${this.errorHandling.getReadableErrorMessage(
          error
        )}`;

        this.errorActions = [
          {
            label: 'Retry',
            icon: 'refresh',
            action: () => this.downloadImage(image),
          },
        ];

        this.errorHandling.showErrorWithRetry(
          'Download failed',
          this.errorHandling.getReadableErrorMessage(error),
          () => this.downloadImage(image)
        );
      },
      complete: () => {
        this.loading = false;
      },
    });
    this.subscriptions.push(downloadSub);
  }

  /**
   * Handles the image error event.
   * @param {ImageModel} image - The image that has been loaded.
   */
  onImageError(image: ImageModel): void {
    image.loaded = true;
    image.url = 'assets/images/notfound.jpg';
  }

  /**
   * Handles the image load event.
   * @param {ImageModel} image - The image that has been loaded.
   */
  onImageLoad(image: ImageModel): void {
    image.loaded = true;
  }
}
