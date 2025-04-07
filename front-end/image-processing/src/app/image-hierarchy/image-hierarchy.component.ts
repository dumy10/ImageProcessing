import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ImageModel } from '../models/ImageModel';

interface FilterInfo {
  name: string;
  description: string;
  icon: string;
}

/**
 * ImageHierarchyComponent displays a vertical hierarchy of images showing the
 * processing steps from the original image to the final filtered image.
 *
 * @component
 * @selector app-image-hierarchy
 * @imports MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule, CommonModule
 * @templateUrl ./image-hierarchy.component.html
 * @styleUrl ./image-hierarchy.component.scss
 */
@Component({
  selector: 'app-image-hierarchy',
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSliderModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './image-hierarchy.component.html',
  styleUrl: './image-hierarchy.component.scss',
})
export class ImageHierarchyComponent implements OnInit {
  /**
   * Controls how many images are displayed in the hierarchy view
   */
  displayCount: number = 3;

  /**
   * Math object exposed to the template
   */
  Math = Math;

  /**
   * Reference to the timeline container element
   */
  @ViewChild('timelineContainer')
  timelineContainer?: ElementRef<HTMLDivElement>;

  /**
   * Current zoom level
   */
  zoomLevel: number = 1; // 100%

  /**
   * Minimum zoom level
   */
  minZoom: number = 0.1; // 10%

  /**
   * Maximum zoom level
   */
  maxZoom: number = 2;

  /**
   * Whether the user is currently panning
   */
  isPanning: boolean = false;

  /**
   * Starting X position for panning
   */
  panStartX: number = 0;

  /**
   * Starting Y position for panning
   */
  panStartY: number = 0;

  /**
   * Current X offset from panning
   */
  panX: number = 0;

  /**
   * Current Y offset from panning
   */
  panY: number = 0;

  /**
   * Timeline width multiplier - adjusts based on number of images
   */
  timelineWidthMultiplier: number = 1;

  /**
   * Whether the timeline container is scrollable (has overflow)
   */
  hasOverflow: boolean = false;

  /**
   * Device pixel ratio for DPI-aware rendering
   */
  devicePixelRatio: number = 1;

  /**
   * Whether the device is a mobile device (touch-based)
   */
  isMobileDevice: boolean = false;

  /**
   * Tracks whether the timeline view is active
   */
  timelineView: boolean = !this.isMobileDevice;

  /**
   * Whether the device is in portrait orientation
   */
  isPortraitOrientation: boolean = false;

  private resizeTimeout: any = null;

  constructor(
    public dialogRef: MatDialogRef<ImageHierarchyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageModel[],
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize device-specific variables
    this.detectDeviceProperties();

    // Set the dialog width based on the number of images and DPI
    this.updateDialogSize();
  }

  /**
   * Updates the dialog size based on DPI and number of images
   */
  private updateDialogSize(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Get base width depending on number of images
      let baseWidth = '90%';
      let baseMaxWidth = '1200px';

      if (this.data.length <= 2) {
        baseWidth = '85%';
        baseMaxWidth = '900px';
      } else if (this.data.length >= 5) {
        baseWidth = '95%';
        baseMaxWidth = '1400px';
      }

      // Scale width by DPI but cap it to avoid excessive sizes
      const scaleFactor = Math.min(this.devicePixelRatio, 1.5);
      const maxWidthValue = parseInt(baseMaxWidth, 10);
      const scaledMaxWidth = `${Math.round(maxWidthValue * scaleFactor)}px`;

      // Auto-height with max-height based on viewport and DPI
      const viewportHeight = window.innerHeight;
      const maxHeight = `${Math.min(Math.round(viewportHeight * 0.9), 800)}px`;

      // Apply dialog size with DPI scaling
      this.dialogRef.updateSize(baseWidth, 'auto');

      // Set dialog position to center
      this.dialogRef.updatePosition({
        top: '',
        bottom: '',
        left: '',
        right: '',
      });

      try {
        // Access the dialog container
        const dialogElement = document.querySelector(
          '.mat-mdc-dialog-container'
        ) as HTMLElement;

        if (dialogElement) {
          if (this.isMobileDevice) {
            // For mobile, set dialog position to take up more screen space
            dialogElement.style.maxWidth = '98%';
            dialogElement.style.maxHeight = maxHeight;
            // Reset any previous positioning that might cause alignment issues
            dialogElement.style.position = '';
            dialogElement.style.left = '';
            dialogElement.style.transform = '';
            dialogElement.style.margin = '0 auto';
          } else {
            // For desktop, apply DPI scaling but use standard dialog positioning
            dialogElement.style.maxWidth = scaledMaxWidth;
            dialogElement.style.maxHeight = maxHeight;
            // Reset any positioning that might interfere with centering
            dialogElement.style.position = '';
            dialogElement.style.left = '';
            dialogElement.style.transform = '';
            dialogElement.style.margin = '0 auto';

            // Scale padding based on DPI for better UI proportions
            const basePadding = 16;
            const scaledPadding = `${Math.round(
              basePadding * Math.sqrt(scaleFactor)
            )}px`;
            dialogElement.style.padding = scaledPadding;
          }
        }

        // Fix overlay pane positioning
        const dialogOverlay = document.querySelector(
          '.cdk-overlay-pane'
        ) as HTMLElement;
        if (dialogOverlay) {
          // Allow Angular CDK to handle positioning
          dialogOverlay.style.position = '';
          dialogOverlay.style.left = '';
          dialogOverlay.style.transform = '';
          dialogOverlay.style.margin = '0 auto';
        }
      } catch (error) {
        // Silently handle errors - dialog styling is non-critical
        console.debug('Could not adjust dialog container styles based on DPI');
      }
    }
  }

  /**
   * Initialize component
   */
  ngOnInit(): void {
    // Calculate the timeline width multiplier based on image count
    this.calculateTimelineWidth();

    // Slightly delay fitToView to ensure DOM is ready
    setTimeout(() => {
      this.fitToView();
    }, 100);

    // Listen for orientation changes
    if (isPlatformBrowser(this.platformId)) {
      window.addEventListener('resize', this.onOrientationChange.bind(this));
      this.checkOrientation();
    }
  }

  /**
   * Detect device properties like DPI and mobile status
   */
  private detectDeviceProperties(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Get device pixel ratio for DPI awareness
      this.devicePixelRatio = window.devicePixelRatio || 1;

      // Check if the device is a mobile/touch device
      this.isMobileDevice =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        );

      // Set timeline view based on device type
      this.timelineView = !this.isMobileDevice;

      this.checkOrientation();
    }
  }

  /**
   * Check and update the device orientation
   */
  private checkOrientation(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.isPortraitOrientation = window.innerHeight > window.innerWidth;
    }
  }

  /**
   * Handle orientation changes
   */
  private onOrientationChange(): void {
    this.checkOrientation();
    // Adjust the view based on new orientation
    setTimeout(() => {
      // Update dialog size when window resizes or orientation changes
      this.updateDialogSize();
      this.calculateTimelineWidth();
      this.fitToView();
    }, 100);
  }

  /**
   * Listen for window resize events to update dialog dimensions
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    // Throttle resize events
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      this.updateDialogSize();
    }, 200);
  }

  /**
   * Calculate the timeline width multiplier based on number of images
   */
  calculateTimelineWidth(): void {
    const imageCount = this.data.length;

    // Adjust width multiplier based on the number of images
    if (imageCount <= 3) {
      this.timelineWidthMultiplier = 1;
    } else {
      // For more than 3 images, increase width proportionally
      // Apply a larger multiplier on mobile in portrait mode to ensure better visibility
      const mobileMultiplierBoost =
        this.isMobileDevice && this.isPortraitOrientation ? 1.5 : 1;
      this.timelineWidthMultiplier = Math.max(
        1,
        (imageCount / 3) * mobileMultiplierBoost
      );
    }

    // Ensure it's at least 1 and not excessively large
    this.timelineWidthMultiplier = Math.min(
      Math.max(this.timelineWidthMultiplier, 1),
      this.isMobileDevice ? 7 : 5 // Allow larger width on mobile
    );

    // Set overflow flag
    this.hasOverflow = imageCount > 3;
  }

  /**
   * Closes the dialog
   */
  closeDialog(): void {
    this.dialogRef.close();
  }

  /**
   * Handles image loading errors by replacing the source with a placeholder
   */
  onImageError(image: ImageModel): void {
    image.loaded = true; // Set to true to hide the loading indicator
    image.url = 'assets/images/notfound.jpg';
  }

  /**
   * Handles the image load event
   * @param {ImageModel} image - The image that has been loaded
   */
  onImageLoad(image: ImageModel): void {
    image.loaded = true;
  }

  /**
   * Increases the number of displayed images in the hierarchy
   */
  showMoreImages(): void {
    if (this.displayCount < this.data.length) {
      this.displayCount = Math.min(this.displayCount + 2, this.data.length);
    }
  }

  /**
   * Decreases the number of displayed images in the hierarchy
   */
  showLessImages(): void {
    if (this.displayCount > 1) {
      this.displayCount = Math.max(this.displayCount - 2, 1);
    }
  }

  /**
   * Checks if more images can be shown
   */
  canShowMore(): boolean {
    return this.displayCount < this.data.length;
  }

  /**
   * Checks if fewer images can be shown
   */
  canShowLess(): boolean {
    if (this.data.length <= 1) {
      return false;
    }

    return this.displayCount > 1;
  }

  /**
   * Returns the subset of images to be displayed based on the current display count
   */
  getDisplayImages(): ImageModel[] {
    return this.data.slice(0, this.displayCount);
  }

  /**
   * Toggles between timeline view and standard view
   */
  toggleView(): void {
    this.timelineView = !this.timelineView;
    if (this.timelineView) {
      // Reset pan and zoom when switching to timeline view
      setTimeout(() => {
        this.resetView();
      }, 0);
    }
  }

  /**
   * Gets the filter information including description and icon
   * @param filterName Name of the filter
   * @returns FilterInfo object with filter details
   */
  getFilterInfo(filterName: string): FilterInfo {
    const filterMap: { [key: string]: FilterInfo } = {
      Grayscale: {
        name: 'Grayscale',
        description: 'Converts image to black and white',
        icon: 'filter_b_and_w',
      },
      Blur: {
        name: 'Blur',
        description: 'Applies a gaussian blur effect',
        icon: 'blur_on',
      },
      Invert: {
        name: 'Invert',
        description: 'Inverts all colors in the image',
        icon: 'invert_colors',
      },
      FlipHorizontal: {
        name: 'Flip Horizontal',
        description: 'Flips the image horizontally',
        icon: 'flip',
      },
      FlipVertical: {
        name: 'Flip Vertical',
        description: 'Flips the image vertically',
        icon: 'flip',
      },
      Canny: {
        name: 'Edge Detection',
        description: 'Detects edges using Canny algorithm',
        icon: 'architecture',
      },
      Kaleidoscope: {
        name: 'Kaleidoscope',
        description: 'Creates a kaleidoscope effect',
        icon: 'flourescent',
      },
      Glitch: {
        name: 'Glitch',
        description: 'Applies a digital glitch effect',
        icon: 'flash_on',
      },
    };

    // If the filter exists in our map, return it
    if (filterMap[filterName]) {
      return filterMap[filterName];
    }

    // For unknown filters, create a meaningful default using the filter name
    const displayName = this.getDisplayFilterName(filterName);
    return {
      name: displayName,
      description: `Applies ${displayName} filter to the image`,
      icon: 'filter',
    };
  }

  /**
   * Gets the difference in filters between two consecutive images
   * @param currentImage Current image in the hierarchy
   * @param index Index of the current image
   * @returns Array of new filters applied
   */
  getNewFiltersApplied(currentImage: ImageModel, index: number): string[] {
    if (index === 0) {
      return currentImage.appliedFilters || [];
    }

    const previousImage = this.getDisplayImages()[index - 1];
    const previousFilters = previousImage.appliedFilters || [];
    const currentFilters = currentImage.appliedFilters || [];

    return currentFilters.filter((filter) => !previousFilters.includes(filter));
  }

  /**
   * Gets a formatted display name for a filter
   */
  getDisplayFilterName(filterName: string): string {
    // Insert spaces before capital letters and ensure first character is uppercase
    return filterName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  }

  /**
   * Calculates the position for timeline nodes to prevent overlap and ensure proper distribution
   * @param index Index of the current node
   * @returns CSS position as percentage
   */
  calculateNodePosition(index: number): string {
    // Special case: single image is centered
    if (this.displayCount === 1 || this.data.length === 1) {
      return '50%';
    }

    // Special case: two images, position at 20% and 80% for better spacing
    if (this.displayCount === 2 || this.data.length === 2) {
      return index === 0 ? '20%' : '80%';
    }

    // Special case: exactly 3 images - position with enough margin to avoid cutoff
    if (this.displayCount === 3 || this.data.length === 3) {
      if (index === 0) return '25%'; // First image at 25%
      if (index === 1) return '50%'; // Middle image centered
      if (index === 2) return '75%'; // Last image at 75%
    }

    // For more than 3 images, distribute evenly across the full timeline width
    // Consider the total width of the timeline (which scales with the multiplier)
    const positionPercentage = (index / (this.displayCount - 1)) * 100;

    return positionPercentage + '%';
  }

  /**
   * Mouse down event handler for starting panning
   */
  startPanning(event: MouseEvent | TouchEvent): void {
    if (!this.hasOverflow) return;

    // Handle both mouse and touch events
    if (event instanceof MouseEvent) {
      // Only enable panning with the primary mouse button
      if (event.button !== 0) return;
      this.isPanning = true;
      this.panStartX = event.clientX - this.panX;
      this.panStartY = event.clientY - this.panY;
    } else if (event instanceof TouchEvent && event.touches.length === 1) {
      // Single touch point for panning
      this.isPanning = true;
      this.panStartX = event.touches[0].clientX - this.panX;
      this.panStartY = event.touches[0].clientY - this.panY;
    }

    // Change cursor
    if (this.timelineContainer) {
      this.timelineContainer.nativeElement.style.cursor = 'grabbing';
    }

    event.preventDefault();
  }

  /**
   * Mouse/touch move event handler for panning
   */
  @HostListener('mousemove', ['$event'])
  @HostListener('touchmove', ['$event'])
  onPanMove(event: MouseEvent | TouchEvent): void {
    if (!this.isPanning) return;

    let clientX: number;
    let clientY: number;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else if (event instanceof TouchEvent) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      return;
    }

    this.panX = clientX - this.panStartX;
    this.panY = clientY - this.panStartY;

    // Apply transform to the timeline track
    this.applyTransform();

    event.preventDefault();
  }

  /**
   * Mouse/touch up event handler for stopping panning
   */
  @HostListener('mouseup', ['$event'])
  @HostListener('mouseleave', ['$event'])
  @HostListener('touchend', ['$event'])
  @HostListener('touchcancel', ['$event'])
  stopPanning(): void {
    if (!this.isPanning) return;

    this.isPanning = false;

    // Reset cursor
    if (this.timelineContainer) {
      this.timelineContainer.nativeElement.style.cursor = 'grab';
    }
  }

  /**
   * Handle mouse wheel events for zooming
   */
  @HostListener('wheel', ['$event'])
  onMouseWheel(event: WheelEvent): void {
    if (!this.timelineView || !this.hasOverflow) return;

    // Prevent scrolling the page when interacting with the timeline
    event.preventDefault();

    // Scale the delta by the device pixel ratio for consistent zooming across different DPI settings
    const scaledDelta =
      (Math.sign(event.deltaY) * -0.1) / this.devicePixelRatio;
    this.zoomLevel = Math.min(
      this.maxZoom,
      Math.max(this.minZoom, this.zoomLevel + scaledDelta)
    );

    this.applyTransform();
  }

  /**
   * Handle touch-based pinch zoom
   */
  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 2) {
      // Two finger touch - prepare for pinch zoom
      const dx = event.touches[0].clientX - event.touches[1].clientX;
      const dy = event.touches[0].clientY - event.touches[1].clientY;
      // Store the initial distance between fingers for pinch zoom reference
      this._initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
      this._initialZoomLevel = this.zoomLevel;
      event.preventDefault();
    }
  }

  private _initialPinchDistance: number = 0;
  private _initialZoomLevel: number = 1;

  /**
   * Handle pinch zoom gesture
   */
  @HostListener('touchmove', ['$event'])
  onPinchZoom(event: TouchEvent): void {
    if (!this.timelineView || !this.hasOverflow || event.touches.length !== 2)
      return;

    // Calculate current distance between touch points
    const dx = event.touches[0].clientX - event.touches[1].clientX;
    const dy = event.touches[0].clientY - event.touches[1].clientY;
    const currentDistance = Math.sqrt(dx * dx + dy * dy);

    // If we have a valid initial distance and current distance
    if (this._initialPinchDistance > 0 && currentDistance > 0) {
      // Calculate zoom ratio and apply it
      const ratio = currentDistance / this._initialPinchDistance;
      const newZoomLevel = this._initialZoomLevel * ratio;

      // Apply zoom level constraints
      this.zoomLevel = Math.min(
        this.maxZoom,
        Math.max(this.minZoom, newZoomLevel)
      );

      // Apply the transform
      this.applyTransform();
      event.preventDefault();
    }
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    // Reset pinch zoom tracking when fingers are lifted
    if (event.touches.length < 2) {
      this._initialPinchDistance = 0;
    }
  }

  /**
   * Apply current transform (zoom and pan) to the timeline track, accounting for device DPI
   */
  applyTransform(): void {
    if (!this.timelineContainer) return;

    const trackElement = this.timelineContainer.nativeElement.querySelector(
      '.timelineTrack'
    ) as HTMLElement;
    if (trackElement) {
      // Apply DPI-aware scaling to ensure consistent experience across devices
      const dpiScaledPanX = this.panX / this.devicePixelRatio;
      const dpiScaledPanY = this.panY / this.devicePixelRatio;
      trackElement.style.transform = `translate(${dpiScaledPanX}px, ${dpiScaledPanY}px) scale(${this.zoomLevel})`;
    }
  }

  /**
   * Reset zoom and pan to default values
   */
  resetView(): void {
    this.zoomLevel = 1;
    this.panX = 0;
    this.panY = 0;

    this.applyTransform();
  }

  /**
   * Zoom in by a preset increment
   */
  zoomIn(): void {
    // Scale the zoom increment by device pixel ratio for consistent experience
    const zoomIncrement = 0.1 / this.devicePixelRatio;
    this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + zoomIncrement);
    this.applyTransform();
  }

  /**
   * Zoom out by a preset increment
   */
  zoomOut(): void {
    // Scale the zoom increment by device pixel ratio for consistent experience
    const zoomIncrement = 0.1 / this.devicePixelRatio;
    this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - zoomIncrement);
    this.applyTransform();
  }

  /**
   * Update zoom level from slider
   */
  onZoomChange(): void {
    this.applyTransform();
  }

  /**
   * Fits the timeline view to show all images
   */
  fitToView(): void {
    if (this.data.length <= 3) {
      this.resetView();
      return;
    }

    // Calculate a more appropriate zoom level based on image count
    const imageCount = this.data.length;

    // Dynamic scaling: more images = smaller zoom
    // Scale zoom levels based on device pixel ratio for consistent appearance
    const dpiScalingFactor = 1 / this.devicePixelRatio;

    if (imageCount > 10) {
      this.zoomLevel = 0.2 * dpiScalingFactor; // Very small zoom for very large trees
    } else if (imageCount > 7) {
      this.zoomLevel = 0.3 * dpiScalingFactor; // Small zoom for large trees
    } else if (imageCount > 5) {
      this.zoomLevel = 0.5 * dpiScalingFactor; // Medium zoom for medium trees
    } else {
      this.zoomLevel = 0.7 * dpiScalingFactor; // Larger zoom for smaller trees
    }

    // Apply additional scaling for mobile devices to ensure visibility
    if (this.isMobileDevice) {
      if (this.isPortraitOrientation) {
        this.zoomLevel *= 0.7; // Reduce zoom level in portrait mode on mobile
      } else {
        this.zoomLevel *= 0.9; // Smaller reduction in landscape mode
      }
    }

    // Ensure zoom level is within bounds
    this.zoomLevel = Math.max(
      this.minZoom,
      Math.min(this.maxZoom, this.zoomLevel)
    );

    setTimeout(() => {
      // Wait for the DOM to update before calculating positions
      if (!this.timelineContainer) return;

      // Get the container and track
      const containerEl = this.timelineContainer.nativeElement;
      const trackEl = containerEl.querySelector(
        '.timelineTrack'
      ) as HTMLElement;
      if (!trackEl) return;

      // Get container dimensions
      const containerWidth = containerEl.offsetWidth;

      // Get all timeline nodes
      const nodes = Array.from(
        trackEl.querySelectorAll('.timelineNode')
      ) as HTMLElement[];
      if (nodes.length === 0) return;

      // Find the middle node
      const middleNodeIndex = Math.floor((nodes.length - 1) / 2);
      const middleNode = nodes[middleNodeIndex];

      // Calculate positions without any transforms applied
      const originalTransform = trackEl.style.transform;
      trackEl.style.transform = 'none'; // Temporarily remove transform

      const middleNodeRect = middleNode.getBoundingClientRect();
      const containerRect = containerEl.getBoundingClientRect();

      // Restore original transform
      trackEl.style.transform = originalTransform;

      // Calculate the offset from the container's left edge to the middle node's center
      const middleNodeOffsetLeft =
        middleNodeRect.left - containerRect.left + middleNodeRect.width / 2;

      // Calculate the center of the container
      const containerCenter = containerWidth / 2;

      // Calculate pan offset needed to center the middle node
      this.panX =
        (containerCenter - middleNodeOffsetLeft) * this.devicePixelRatio;

      // Apply the transform with the new pan position
      this.applyTransform();
    }, 50);
  }

  /**
   * Gets formatted tooltip text for an image with proper line breaks and DPI-adjusted dimensions
   * @param imageModel The image model to create tooltip for
   * @returns Formatted tooltip text with newlines
   */
  getImageTooltip(imageModel: ImageModel): string {
    // Calculate physical dimensions (adjust by DPI to show actual device pixels)
    const physicalWidth = Math.round(imageModel.width);
    const physicalHeight = Math.round(imageModel.height);

    let tooltip = `Size: ${physicalWidth}x${physicalHeight}`;

    if (imageModel.appliedFilters?.length) {
      tooltip += `\nFilters: ${imageModel.appliedFilters.join(', ')}`;
    }

    return tooltip;
  }

  /**
   * Clean up event listeners
   */
  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      window.removeEventListener('resize', this.onOrientationChange.bind(this));
    }
  }
}
