import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TreeNode } from '../models/tree';
import { ImageModel } from '../models/ImageModel';
import { ImageHierarchyComponent } from '../image-hierarchy/image-hierarchy.component';

/**
 * ImageTreeComponent is a component that displays a tree structure of images.
 * It allows users to view and interact with a hierarchy of images and their filtered versions.
 *
 * @component
 * @selector app-image-tree
 * @imports CommonModule
 * @templateUrl ./image-tree.component.html
 * @styleUrl ./image-tree.component.scss
 */
@Component({
  selector: 'app-image-tree',
  imports: [CommonModule],
  templateUrl: './image-tree.component.html',
  styleUrl: './image-tree.component.scss',
})
export class ImageTreeComponent {
  /**
   * The root node of the image tree.
   * @type {TreeNode<ImageModel> | null}
   */
  @Input() node: TreeNode<ImageModel> | null = null;

  /**
   * Array of image pairs, each containing an original image and its filtered version.
   * @type {Array<{ originalImage: ImageModel; filteredImage: ImageModel }>}
   */
  @Input() imagePairs: Array<{
    originalImage: ImageModel;
    filteredImage: ImageModel;
  }> = [];

  /**
   * Constructor for ImageTreeComponent.
   * @param {MatDialog} dialog - The dialog service for opening dialogs.
   */
  constructor(private dialog: MatDialog) {}

  /**
   * Opens a dialog to display the hierarchy of the given image.
   * @param {ImageModel} image - The image for which to display the hierarchy.
   */
  openDialog(image: ImageModel): void {
    const dialogRef = this.dialog.open(ImageHierarchyComponent, {
      data: this.getImageHierarchy(image),
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }

  /**
   * Retrieves the hierarchy of the given image, including its parent images.
   * @param {ImageModel} image - The image for which to retrieve the hierarchy.
   * @returns {ImageModel[]} - An array of images representing the hierarchy.
   */
  getImageHierarchy(image: ImageModel): ImageModel[] {
    const imageHierarchy: ImageModel[] = [];

    let currentImage = image;
    imageHierarchy.unshift(currentImage);
    while (currentImage.parentId) {
      const parentImage = this.imagePairs.find(
        (imgPair) => imgPair.originalImage.id === currentImage.parentId
      )?.originalImage;

      if (!parentImage) {
        break;
      }

      imageHierarchy.unshift(parentImage);
      currentImage = parentImage;
    }
    return imageHierarchy;
  }

  /**
   * Handles the image error event.
   */
  onImageError(image: ImageModel): void {
    image.url = 'assets/images/notfound.jpg';
  }
}
