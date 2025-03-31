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
import { ImageTreeComponent } from '../image-tree/image-tree.component';
import { ImageModel } from '../models/ImageModel';
import { Tree } from '../models/tree';

/**
 * ImageDialogComponent is a component that displays a dialog containing an image tree and image pairs.
 * It allows users to view and interact with a hierarchy of images and their filtered versions.
 *
 * @component
 * @selector app-image-dialog
 * @imports CommonModule, MatDialogTitle, MatDialogContent, MatDialogActions, ImageTreeComponent
 * @templateUrl ./image-dialog.component.html
 * @styleUrl ./image-dialog.component.scss
 */
@Component({
  selector: 'app-image-dialog',
  imports: [
    MatButtonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    CommonModule,
    ImageTreeComponent,
  ],
  templateUrl: './image-dialog.component.html',
  styleUrl: './image-dialog.component.scss',
})
export class ImageDialogComponent {
  /**
   * Array of image pairs, each containing an original image and its filtered version.
   * @type {Array<{ originalImage: ImageModel; filteredImage: ImageModel }>}
   */
  imagePairs: Array<{
    originalImage: ImageModel;
    filteredImage: ImageModel;
  }> = [];

  /**
   * Constructor for ImageDialogComponent.
   * @param {MatDialogRef<ImageDialogComponent>} dialogRef - Reference to the dialog containing this component.
   * @param {any} data - Data passed to the dialog, typically containing the image tree and image pairs.
   */
  constructor(
    public dialogRef: MatDialogRef<ImageDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      tree: Tree<ImageModel>;
      imagePairs: Array<{
        originalImage: ImageModel;
        filteredImage: ImageModel;
      }>;
    }
  ) {
    this.imagePairs = data.imagePairs;

    // Set the dialog width to better accommodate the tree
    // Only call updateSize if it exists (for testing compatibility)
    if (dialogRef && typeof dialogRef.updateSize === 'function') {
      dialogRef.updateSize('80vw', 'auto');
    }
  }

  /**
   * Closes the dialog.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }
}
