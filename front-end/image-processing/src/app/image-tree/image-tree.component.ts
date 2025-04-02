import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ImageHierarchyComponent } from '../image-hierarchy/image-hierarchy.component';
import { ImageModel } from '../models/ImageModel';
import { TreeNode } from '../models/tree';

/**
 * ImageTreeComponent is a component that displays a tree structure of images.
 * It allows users to view and interact with a hierarchy of images and their filtered versions.
 *
 * @component
 * @selector app-image-tree
 * @imports CommonModule, MatProgressSpinnerModule
 * @templateUrl ./image-tree.component.html
 * @styleUrl ./image-tree.component.scss
 */
@Component({
  selector: 'app-image-tree',
  imports: [CommonModule, MatProgressSpinnerModule],
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
   * Maximum depth of nodes to display in the tree
   * @type {number}
   */
  @Input() maxDepth: number = Infinity;

  /**
   * Current depth level of this component instance in the tree
   * @type {number}
   */
  @Input() currentDepth: number = 1;

  /**
   * Total number of children to display horizontally
   * @type {number}
   */
  @Input() horizontalDisplayCount: number = 3;

  constructor(private dialog: MatDialog) {}

  /**
   * Initialize the loaded state to keep track of image loading
   */
  ngOnInit(): void {
    // Ensure node value has loaded property
    if (this.node && this.node.value && !('loaded' in this.node.value)) {
      this.node.value.loaded = false;
    }
  }

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
   * Uses an iterative approach for better performance.
   * @param {ImageModel} image - The image for which to retrieve the hierarchy.
   * @returns {ImageModel[]} - An array of images representing the hierarchy.
   */
  getImageHierarchy(image: ImageModel): ImageModel[] {
    const imageHierarchy: ImageModel[] = [];
    let currentImage = image;

    // Keep adding parents to the hierarchy until we reach the root
    while (true) {
      imageHierarchy.unshift(currentImage);

      if (!currentImage.parentId) {
        break;
      }

      const parentImage = this.imagePairs.find(
        (imgPair) => imgPair.originalImage.id === currentImage.parentId
      )?.originalImage;

      if (!parentImage) {
        break;
      }

      currentImage = parentImage;
    }

    return imageHierarchy;
  }

  /**
   * Handles the image error event.
   * @param {ImageModel} image - The image that failed to load.
   */
  onImageError(image: ImageModel): void {
    image.loaded = true;
    image.url = 'assets/images/notfound.jpg';
  }

  /**
   * Handles the image load event.
   * @param {ImageModel} image - The image that has been loaded.
   */
  onImageLoad(image: ImageModel): void {
    image.loaded = true;
  }

  shouldDisplayChildren(): boolean {
    return this.currentDepth < this.maxDepth;
  }

  /**
   * Returns the array of children to display, centered around the mid-point
   * @returns {TreeNode<ImageModel>[]} - The array of child nodes to display
   */
  getDisplayedChildren(): TreeNode<ImageModel>[] {
    if (!this.node?.children?.length) return [];

    const totalChildren = this.node.children.length;
    const childrenToShow = Math.min(totalChildren, this.horizontalDisplayCount);

    // If we have fewer children than the display count or odd number to display
    if (
      totalChildren <= this.horizontalDisplayCount ||
      childrenToShow % 2 === 1
    ) {
      // Calculate the start index to center the children
      const startIndex = Math.max(
        0,
        Math.floor((totalChildren - childrenToShow) / 2)
      );
      return this.node.children.slice(startIndex, startIndex + childrenToShow);
    } else {
      // For even number of children, center them around the parent
      const halfPoint = Math.floor(totalChildren / 2);
      const halfToShow = childrenToShow / 2;

      // Take half from left of center and half from right of center
      const leftIndex = Math.max(0, halfPoint - halfToShow);
      return this.node.children.slice(leftIndex, leftIndex + childrenToShow);
    }
  }

  /**
   * Gets the number of hidden children.
   * @returns {number} - The number of hidden children.
   */
  getHiddenChildrenCount(): number {
    if (!this.node?.children) return 0;
    return Math.max(0, this.node.children.length - this.horizontalDisplayCount);
  }

  /**
   * Gets the SVG viewBox width based on the number of displayed children
   * @returns {number} - The width of the SVG viewBox
   */
  getSvgViewBoxWidth(): number {
    return this.getDisplayedChildren().length * 200;
  }

  /**
   * Gets the horizontal center point of the SVG viewBox
   * @returns {number} - The horizontal center point
   */
  getSvgCenterX(): number {
    return this.getSvgViewBoxWidth() / 2;
  }
}
