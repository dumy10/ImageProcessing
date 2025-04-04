import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  HostListener,
  Inject,
  OnInit,
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
   * Tracks whether the timeline view is active
   */
  timelineView: boolean = true;

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

  constructor(
    public dialogRef: MatDialogRef<ImageHierarchyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageModel[]
  ) {
    // Set the dialog width based on the number of images
    if (data.length === 3 || data.length === 2) {
      dialogRef.updateSize('90%', 'auto');
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
      this.timelineWidthMultiplier = Math.max(1, imageCount / 3);
    }

    // Ensure it's at least 1 and not excessively large
    this.timelineWidthMultiplier = Math.min(
      Math.max(this.timelineWidthMultiplier, 1),
      5
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
  startPanning(event: MouseEvent): void {
    if (!this.hasOverflow) return;

    // Only enable panning with the primary mouse button
    if (event.button !== 0) return;

    this.isPanning = true;
    this.panStartX = event.clientX - this.panX;
    this.panStartY = event.clientY - this.panY;

    // Change cursor
    if (this.timelineContainer) {
      this.timelineContainer.nativeElement.style.cursor = 'grabbing';
    }

    event.preventDefault();
  }

  /**
   * Mouse move event handler for panning
   */
  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isPanning) return;

    this.panX = event.clientX - this.panStartX;
    this.panY = event.clientY - this.panStartY;

    // Apply transform to the timeline track
    this.applyTransform();

    event.preventDefault();
  }

  /**
   * Mouse up event handler for stopping panning
   */
  @HostListener('mouseup', ['$event'])
  @HostListener('mouseleave', ['$event'])
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

    const delta = Math.sign(event.deltaY) * -0.1;
    this.zoomLevel = Math.min(
      this.maxZoom,
      Math.max(this.minZoom, this.zoomLevel + delta)
    );

    this.applyTransform();
  }

  /**
   * Apply current transform (zoom and pan) to the timeline track
   */
  applyTransform(): void {
    if (!this.timelineContainer) return;

    const trackElement = this.timelineContainer.nativeElement.querySelector(
      '.timelineTrack'
    ) as HTMLElement;
    if (trackElement) {
      trackElement.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoomLevel})`;
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
    this.zoomLevel = Math.min(this.maxZoom, this.zoomLevel + 0.1);
    this.applyTransform();
  }

  /**
   * Zoom out by a preset increment
   */
  zoomOut(): void {
    this.zoomLevel = Math.max(this.minZoom, this.zoomLevel - 0.1);
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
    if (imageCount > 10) {
      this.zoomLevel = 0.2; // Very small zoom for very large trees
    } else if (imageCount > 7) {
      this.zoomLevel = 0.3; // Small zoom for large trees
    } else if (imageCount > 5) {
      this.zoomLevel = 0.5; // Medium zoom for medium trees
    } else {
      this.zoomLevel = 0.7; // Larger zoom for smaller trees
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
      this.panX = containerCenter - middleNodeOffsetLeft;

      // Apply the transform with the new pan position
      this.applyTransform();
    }, 50);
  }

  /**
   * Gets formatted tooltip text for an image with proper line breaks
   * @param imageModel The image model to create tooltip for
   * @returns Formatted tooltip text with newlines
   */
  getImageTooltip(imageModel: ImageModel): string {
    let tooltip = `Size: ${imageModel.width}x${imageModel.height}`;

    if (imageModel.appliedFilters?.length) {
      tooltip += `\nFilters: ${imageModel.appliedFilters.join(', ')}`;
    }

    return tooltip;
  }
}
