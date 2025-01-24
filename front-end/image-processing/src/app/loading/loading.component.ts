import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

/**
 * LoadingComponent is a reusable component that displays a loading message
 * when the application is performing an asynchronous operation.
 *
 * @component
 * @selector app-loading
 * @imports CommonModule
 * @templateUrl ./loading.component.html
 * @styleUrl ./loading.component.scss
 */
@Component({
  selector: 'app-loading',
  imports: [CommonModule],
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss',
})
export class LoadingComponent {
  /**
   * Indicates whether the application is currently loading.
   * @type {boolean}
   */
  @Input() loading: boolean = false;

  /**
   * Message to display while loading.
   * @type {string}
   */
  @Input() message: string = '';

  /**
   * Constructor for LoadingComponent.
   */
  constructor() {}
}
