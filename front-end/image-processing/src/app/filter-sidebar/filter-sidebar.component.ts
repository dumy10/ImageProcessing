import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FilterButtonsComponent } from '../filter-buttons/filter-buttons.component';
import { Filters } from '../models/filters';
import { ImageModel } from '../models/ImageModel';
import { ErrorHandlingService } from '../services/error-handling.service';

/**
 * Component for displaying the sidebar with filter categories and other image information
 */
@Component({
  selector: 'app-filter-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    FilterButtonsComponent,
  ],
  templateUrl: './filter-sidebar.component.html',
  styleUrls: ['./filter-sidebar.component.scss'],
})
export class FilterSidebarComponent implements OnInit {
  /**
   * The image being edited
   */
  @Input() image: ImageModel | undefined;

  /**
   * Whether the sidebar is collapsed
   */
  @Input() sidebarCollapsed = false;

  /**
   * All available filters
   */
  @Input() filters: Filters[] = [];

  /**
   * Whether undo is available
   */
  @Input() canUndo = false;

  /**
   * Whether redo is available
   */
  @Input() canRedo = false;

  /**
   * Whether a filter operation is in progress
   */
  @Input() isFilteringInProgress = false;

  /**
   * Event emitted when a filter is selected
   */
  @Output() filterSelected = new EventEmitter<Filters>();

  /**
   * Event emitted when the sidebar toggle button is clicked
   */
  @Output() toggleSidebarEvent = new EventEmitter<void>();

  /**
   * Event emitted when the download button is clicked
   */
  @Output() downloadImageEvent = new EventEmitter<void>();

  /**
   * Event emitted when the undo button is clicked
   */
  @Output() undoEvent = new EventEmitter<void>();

  /**
   * Event emitted when the redo button is clicked
   */
  @Output() redoEvent = new EventEmitter<void>();

  /**
   * Stores the state of open/closed filter categories
   */
  openCategories: { [key: string]: boolean } = {
    adjustments: true,
    effects: false,
    transform: false,
  };

  /**
   * Filter categories mapping
   */
  filterCategories: { [key: string]: Filters[] } = {};

  constructor(private errorHandling: ErrorHandlingService) {}

  /**
   * Initializes the component and populates the filter categories
   */
  ngOnInit(): void {
    this.populateFilterCategories();
  }

  /**
   * Populates the filter categories based on available filters
   */
  private populateFilterCategories(): void {
    // Define category groups
    this.filterCategories = {
      adjustments: [Filters.GrayScale, Filters.Invert, Filters.Blur],
      effects: [
        Filters.OilPaint,
        Filters.Kaleidoscope,
        Filters.Glitch,
        Filters.Canny,
        Filters.Sobel,
        Filters.Sepia,
        Filters.Mosaic,
      ],
      transform: [Filters.FlipVertical, Filters.FlipHorizontal],
    };

    // Initialize open state for each category
    Object.keys(this.filterCategories).forEach((category) => {
      if (!this.openCategories.hasOwnProperty(category)) {
        this.openCategories[category] = category === 'adjustments'; // Open adjustments by default
      }
    });
  }

  /**
   * Toggles the sidebar between collapsed and expanded states
   */
  toggleSidebar(): void {
    this.toggleSidebarEvent.emit();
  }

  /**
   * Toggles a filter category between open and closed states
   * Only one category can be open at a time, or all can be closed
   * @param category The category to toggle
   */
  toggleCategory(category: string): void {
    const isCurrentlyOpen = this.openCategories[category];

    // First close all categories
    Object.keys(this.openCategories).forEach((key) => {
      this.openCategories[key] = false;
    });

    // If the clicked category wasn't open before, open it
    // If it was already open, it will remain closed (all categories closed)
    if (!isCurrentlyOpen) {
      this.openCategories[category] = true;
    }
  }

  /**
   * Checks if a category is currently open
   * @param category The category to check
   * @returns True if the category is open
   */
  isCategoryOpen(category: string): boolean {
    return this.openCategories[category];
  }

  /**
   * Gets filters that belong to a specific category
   * @param category The category name
   * @returns Array of filters in that category
   */
  getFiltersByCategory(category: string): Filters[] {
    return this.filterCategories[category] || [];
  }

  /**
   * Gets all filter category names
   * @returns Array of category names
   */
  getCategories(): string[] {
    return Object.keys(this.filterCategories);
  }

  /**
   * Handles a filter selection and emits the event to the parent
   * @param filter The selected filter
   */
  onFilterSelected(filter: Filters): void {
    if (this.isFilteringInProgress) {
      this.errorHandling.showErrorWithRetry(
        'Filter in progress',
        'A filter operation is already in progress. Please wait.',
        () => {}, // No retry action needed, just a dismiss
        'Dismiss'
      );
      return;
    }
    this.filterSelected.emit(filter);
  }

  /**
   * Initiates the download of the image
   */
  downloadImage(): void {
    if (this.isFilteringInProgress) {
      this.errorHandling.showErrorWithRetry(
        'Filter in progress',
        'A filter operation is already in progress. Please wait.',
        () => {}, // No retry action needed, just a dismiss
        'Dismiss'
      );
      return;
    }
    this.downloadImageEvent.emit();
  }

  /**
   * Triggers undo action
   */
  undoFilter(): void {
    if (this.isFilteringInProgress) {
      this.errorHandling.showErrorWithRetry(
        'Filter in progress',
        'A filter operation is already in progress. Please wait.',
        () => {}, // No retry action needed, just a dismiss
        'Dismiss'
      );
      return;
    }
    this.undoEvent.emit();
  }

  /**
   * Triggers redo action
   */
  redoFilter(): void {
    if (this.isFilteringInProgress) {
      this.errorHandling.showErrorWithRetry(
        'Filter in progress',
        'A filter operation is already in progress. Please wait.',
        () => {}, // No retry action needed, just a dismiss
        'Dismiss'
      );
      return;
    }
    this.redoEvent.emit();
  }
}
