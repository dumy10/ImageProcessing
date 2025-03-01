import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Filters } from '../models/filters';

/**
 * FilterButtonsComponent is a component that displays a set of buttons for applying filters to an image.
 * It allows users to select a filter to apply to the image.
 *
 * @component
 * @selector app-filter-buttons
 * @imports CommonModule, MatButtonModule, MatIconModule
 * @templateUrl ./filter-buttons.component.html
 * @styleUrl ./filter-buttons.component.scss
 */
@Component({
  selector: 'app-filter-buttons',
  templateUrl: './filter-buttons.component.html',
  styleUrls: ['./filter-buttons.component.scss'],
  imports: [CommonModule, MatButtonModule, MatIconModule],
})
export class FilterButtonsComponent {
  /**
   * Array of available filters.
   * @type {Filters[]}
   * @Input
   */
  @Input()
  filters!: Filters[];

  /**
   * Event emitter for when a filter is selected.
   * @type {EventEmitter<Filters>}
   * @Output
   */
  @Output() filterSelected: EventEmitter<Filters> = new EventEmitter<Filters>();

  /**
   * Method to emit the selected filter.
   * @param {Filters} filter - The filter to apply to the image.
   */
  filterImage(filter: Filters): void {
    this.filterSelected.emit(filter);
  }
}
