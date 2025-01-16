import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageModel } from '../models/ImageModel';

/**
 * ImageHierarchyComponent is a component that displays the hierarchy of an image and its filtered versions.
 * It is used within a dialog to show the relationships between the original image and its filtered versions.
 *
 * @component
 * @selector app-image-hierarchy
 * @imports CommonModule, MatDialogTitle, MatDialogContent, MatDialogActions, MatButtonModule
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
    CommonModule,
  ],
  templateUrl: './image-hierarchy.component.html',
  styleUrl: './image-hierarchy.component.scss',
})
export class ImageHierarchyComponent {
  /**
   * Constructor for ImageHierarchyComponent.
   * @param {MatDialogRef<ImageHierarchyComponent>} dialogRef - Reference to the dialog containing this component.
   * @param {ImageModel} data - Data passed to the dialog, typically the image model.
   */
  constructor(
    public dialogRef: MatDialogRef<ImageHierarchyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageModel[]
  ) {}

  /**
   * Closes the dialog.
   */
  closeDialog(): void {
    this.dialogRef.close();
  }
  /**
   * Handles the image error event.
   */
  onImageError(): void {
    throw new Error('Method not implemented.');
  }
}
