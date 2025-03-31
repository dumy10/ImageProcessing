import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ImageModel } from '../models/ImageModel';

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
    CommonModule,
  ],
  templateUrl: './image-hierarchy.component.html',
  styleUrl: './image-hierarchy.component.scss',
})
export class ImageHierarchyComponent {
  /**
   * Controls how many images are displayed in the hierarchy view
   */
  displayCount: number = 3;

  constructor(
    public dialogRef: MatDialogRef<ImageHierarchyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageModel[]
  ) {}

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
    image.url = 'assets/images/notfound.jpg';
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
  get displayImages(): ImageModel[] {
    return this.data.slice(0, this.displayCount);
  }
}
