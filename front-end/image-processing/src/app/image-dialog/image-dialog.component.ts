import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  ViewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { ImageTreeComponent } from '../image-tree/image-tree.component';
import { ImageModel } from '../models/ImageModel';
import { Tree, TreeNode } from '../models/tree';

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
    MatIconModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    CommonModule,
    ImageTreeComponent,
  ],
  templateUrl: './image-dialog.component.html',
  styleUrl: './image-dialog.component.scss',
})
export class ImageDialogComponent implements AfterViewInit {
  /**
   * Reference to the tree container element
   */
  @ViewChild('treeContainer') treeContainer: ElementRef | undefined;

  /**
   * Array of image pairs, each containing an original image and its filtered version.
   */
  imagePairs: Array<{
    originalImage: ImageModel;
    filteredImage: ImageModel;
  }> = [];

  /**
   * Controls the number of image levels displayed in the tree (vertical depth).
   */
  displayLevel: number = 2;

  /**
   * Maximum number of levels in the tree (vertical depth).
   */
  maxLevel: number = 0;

  /**
   * Controls the number of children displayed horizontally per node.
   * This will be distributed on both sides of the parent
   */
  horizontalDisplayCount: number = 3;

  /**
   * Maximum number of children in the widest node.
   */
  maxHorizontalCount: number = 0;

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

    if (data.tree.root) {
      this.maxLevel = this.calculateTreeDepth(data.tree.root);
      this.maxHorizontalCount = this.calculateMaxChildrenCount(data.tree.root);
    }

    if (dialogRef && typeof dialogRef.updateSize === 'function') {
      dialogRef.updateSize('80vw', 'auto');
    }
  }

  ngAfterViewInit(): void {
    this.adjustTreeView();
  }

  /**
   * Returns the number of children displayed on each side (left and right) of the parent
   * @returns {number} The number of children per side
   */
  getChildrenPerSide(): number {
    return Math.floor(this.horizontalDisplayCount / 2);
  }

  /**
   * Centers the tree horizontally within the viewport container
   */
  centerTreeInViewport(): void {
    if (this.treeContainer) {
      const container = this.treeContainer.nativeElement;

      if (container.scrollWidth > container.clientWidth) {
        const scrollOffset =
          (container.scrollWidth - container.clientWidth) / 2;
        container.scrollLeft = scrollOffset;
      }
    }
  }

  /**
   * Closes the dialog
   */
  closeDialog(): void {
    this.dialogRef.close();
  }

  /**
   * Increases the vertical depth of the tree display
   */
  showMoreLevels(): void {
    if (this.displayLevel < this.maxLevel) {
      this.displayLevel++;
      this.adjustTreeView();
    }
  }

  /**
   * Decreases the vertical depth of the tree display
   */
  showLessLevels(): void {
    if (this.displayLevel > 1) {
      this.displayLevel--;
      this.adjustTreeView();
    }
  }

  /**
   * Increases the number of horizontally displayed children per node
   * Evenly distributes additional nodes on both sides
   */
  showMoreHorizontalImages(): void {
    if (this.horizontalDisplayCount < this.maxHorizontalCount) {
      this.horizontalDisplayCount = Math.min(
        this.horizontalDisplayCount + 2,
        this.maxHorizontalCount
      );
      this.adjustTreeView();
    }
  }

  /**
   * Decreases the number of horizontally displayed children per node
   * Evenly reduces nodes from both sides
   */
  showLessHorizontalImages(): void {
    if (this.horizontalDisplayCount > 1) {
      this.horizontalDisplayCount = Math.max(
        this.horizontalDisplayCount - 2,
        1
      );
      this.adjustTreeView();
    }
  }

  /**
   * Adjusts the tree view after display settings change
   */
  private adjustTreeView(): void {
    setTimeout(() => {
      this.centerTreeInViewport();
    }, 100);
  }

  /**
   * Calculates the maximum depth of the tree using an iterative approach
   * @param {TreeNode<ImageModel>} root - The root node of the tree
   * @returns {number} - The maximum depth of the tree
   */
  private calculateTreeDepth(root: TreeNode<ImageModel>): number {
    if (!root) return 0;

    // Use a breadth-first traversal to find the maximum depth
    const queue: Array<{ node: TreeNode<ImageModel>; depth: number }> = [];
    let maxDepth = 1; // Start with 1 for the root level

    // Add root node to queue
    queue.push({ node: root, depth: 1 });

    // Process nodes in the queue
    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;
      maxDepth = Math.max(maxDepth, depth);

      // Add children to the queue with increased depth
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          queue.push({ node: child, depth: depth + 1 });
        }
      }
    }

    return maxDepth;
  }

  /**
   * Calculates the maximum number of children for any node in the tree using an iterative approach
   * @param {TreeNode<ImageModel>} root - The root node of the tree
   * @returns {number} - The maximum number of children for any node in the tree
   */
  private calculateMaxChildrenCount(root: TreeNode<ImageModel>): number {
    if (!root) return 0;

    // Use breadth-first traversal to find the maximum children count
    const queue: Array<TreeNode<ImageModel>> = [root];
    let maxCount = root.children ? root.children.length : 0;

    // Process nodes in the queue
    while (queue.length > 0) {
      const node = queue.shift()!;

      if (node.children && node.children.length > 0) {
        // Update max count if this node has more children
        maxCount = Math.max(maxCount, node.children.length);

        // Add children to the queue
        queue.push(...node.children);
      }
    }

    return maxCount;
  }
}
