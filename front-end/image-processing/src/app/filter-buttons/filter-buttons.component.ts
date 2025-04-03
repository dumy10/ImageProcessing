import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Filters } from '../models/filters';
import { ErrorHandlingService } from '../services/error-handling.service';

/**
 * FilterButtonsComponent is a component that displays a set of buttons for applying filters to an image.
 * It allows users to select a filter to apply to the image.
 *
 * @component
 * @selector app-filter-buttons
 * @imports CommonModule, MatButtonModule, MatIconModule
 * @templateUrl ./filter-buttons.component.html
 * @styleUrl './filter-buttons.component.scss'
 */
@Component({
  selector: 'app-filter-buttons',
  templateUrl: './filter-buttons.component.html',
  styleUrl: './filter-buttons.component.scss',
  imports: [CommonModule, MatButtonModule, MatIconModule],
})
export class FilterButtonsComponent {
  /**
   * Array of available filters.
   * @type {Filters[]}
   * @Input
   */
  @Input() filters!: Filters[];

  /**
   * Flag to indicate if a filter operation is in progress
   * @type {boolean}
   * @Input
   */
  @Input() isFilteringInProgress: boolean = false;

  /**
   * Event emitter for when a filter is selected.
   * @type {EventEmitter<Filters>}
   * @Output
   */
  @Output() filterSelected: EventEmitter<Filters> = new EventEmitter<Filters>();

  /**
   * Currently active filter - used to track which button is being processed
   */
  activeFilter: Filters | null = null;

  constructor(private errorHandling: ErrorHandlingService) {}

  /**
   * Method to emit the selected filter if no filter operation is already in progress.
   * @param {Filters} filter - The filter to apply to the image.
   */
  filterImage(filter: Filters): void {
    // Check if a filtering operation is already in progress
    if (this.isFilteringInProgress) {
      this.errorHandling.showErrorWithRetry(
        'Filter in progress',
        'A filter operation is already in progress. Please wait.',
        () => {}, // No retry action needed, just a dismiss
        'Dismiss'
      );
      return;
    }

    // Set the active filter to highlight the clicked button
    this.activeFilter = filter;

    // Emit the filter selection event
    this.filterSelected.emit(filter);
  }

  /**
   * Checks if a filter button should be disabled
   * @param {Filters} filter - The filter to check
   * @returns {boolean} - Whether the button should be disabled
   */
  isButtonDisabled(filter: Filters): boolean {
    // Disable all buttons when filtering is in progress
    return this.isFilteringInProgress;
  }

  /**
   * Checks if a filter button is the currently active one
   * @param {Filters} filter - The filter to check
   * @returns {boolean} - Whether this button is active
   */
  isActiveFilter(filter: Filters): boolean {
    return this.isFilteringInProgress && this.activeFilter === filter;
  }
}
