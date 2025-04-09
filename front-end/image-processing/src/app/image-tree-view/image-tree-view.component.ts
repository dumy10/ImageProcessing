import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ImageTreeComponent } from '../image-tree/image-tree.component';
import { LoadingComponent } from '../loading/loading.component';
import { ImageModel } from '../models/ImageModel';
import { Tree, TreeNode } from '../models/tree';
import { ErrorHandlingService } from '../services/error-handling.service';
import { ImageService } from '../services/image.service';
import {
  ErrorAction,
  ErrorBannerComponent,
} from '../shared/error-banner/error-banner.component';

/**
 * ImageTreeViewComponent is a standalone page component that displays the tree visualization
 * of an image and all its filtered versions.
 *
 * @component
 * @selector app-image-tree-view
 * @imports CommonModule, MatButtonModule, MatIconModule, ImageTreeComponent, LoadingComponent, ErrorBannerComponent
 * @templateUrl ./image-tree-view.component.html
 * @styleUrl ./image-tree-view.component.scss
 */
@Component({
  selector: 'app-image-tree-view',
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    ImageTreeComponent,
    LoadingComponent,
    ErrorBannerComponent,
  ],
  templateUrl: './image-tree-view.component.html',
  styleUrl: './image-tree-view.component.scss',
})
export class ImageTreeViewComponent implements OnInit, OnDestroy {
  /**
   * Indicates whether the application is currently loading.
   */
  loading: boolean = false;

  /**
   * Message displayed while loading images.
   */
  loadingMessage: string = 'Loading image tree...';

  /**
   * The tree structure for displaying images.
   */
  imageTree: Tree<ImageModel> = new Tree<ImageModel>();

  /**
   * Array of image pairs for building the tree and related operations.
   */
  imagePairs: Array<{
    originalImage: ImageModel;
    filteredImage: ImageModel;
  }> = [];

  /**
   * Maximum number of levels in the tree (vertical depth).
   */
  maxLevel: number = 0;

  /**
   * Controls the number of image levels displayed in the tree (vertical depth).
   */
  displayLevel: number = 3;

  /**
   * Controls the number of children displayed horizontally per node.
   * Will be initialized based on root node's children count.
   */
  horizontalDisplayCount: number = 3;

  /**
   * Maximum number of children in the widest node.
   */
  maxHorizontalCount: number = 0;

  /**
   * Flag to indicate if there are more levels with actual nodes to display
   */
  hasMoreNodesToShow: boolean = true;

  /**
   * Image ID from the route parameter.
   */
  imageId: string | null = null;

  /**
   * Error state flag
   */
  errorState: boolean = false;

  /**
   * Error message to display
   */
  errorMessage: string = '';

  /**
   * Error actions for the banner
   */
  errorActions: ErrorAction[] = [];

  /**
   * Subscriptions to unsubscribe on component destruction
   */
  private subscriptions: Subscription[] = [];

  /**
   * Cached page number from URL query parameters
   */
  cachedPage: number = 0;

  /**
   * Cached page size from URL query parameters
   */
  cachedPageSize: number = 6;

  /**
   * Reference to the child ImageTreeComponent
   */
  @ViewChild(ImageTreeComponent) imageTreeComponent!: ImageTreeComponent;

  constructor(
    private imageService: ImageService,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandling: ErrorHandlingService
  ) {}

  /**
   * Initializes the component and loads the necessary data.
   */
  ngOnInit(): void {
    // Cache the current page and page size from query params if available
    const queryParamSub = this.route.queryParams.subscribe((params) => {
      this.cachedPage = params['page'] ? +params['page'] : 0;
      this.cachedPageSize = params['pageSize'] ? +params['pageSize'] : 6;
    });
    this.subscriptions.push(queryParamSub);

    const paramsSub = this.route.paramMap.subscribe((params) => {
      this.imageId = params.get('id');

      if (!this.imageId) {
        this.handleError('No image ID provided');
        return;
      }

      this.loading = true;
      this.loadImageData();
    });

    this.subscriptions.push(paramsSub);
  }

  /**
   * Clean up subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Loads image data and builds the tree
   */
  loadImageData(): void {
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];

    const imagesSub = this.imageService.getImages().subscribe({
      next: (response: ImageModel[]) => {
        // Build image pairs
        this.imagePairs = [];
        response.forEach((image) => {
          if (!image.parentUrl) {
            return;
          }

          const originalImage = response.find(
            (img) => img.id === image.parentId
          ) as ImageModel;

          if (originalImage) {
            this.imagePairs.push({
              originalImage,
              filteredImage: image,
            });
          }
        });

        if (this.imagePairs.length === 0) {
          this.handleError('No filtered images found');
          return;
        }

        // Find the requested image
        const requestedImage = response.find((img) => img.id === this.imageId);
        if (!requestedImage) {
          this.handleError(`Image with ID ${this.imageId} not found`);
          return;
        }

        // Build the tree
        this.imageTree = this.buildImageTree(requestedImage);

        // Calculate maximum tree depth and width
        if (this.imageTree.root) {
          this.maxLevel = this.calculateTreeDepth(this.imageTree.root);
          this.maxHorizontalCount = this.calculateMaxChildrenCount(
            this.imageTree.root
          );

          // Initialize horizontalDisplayCount based on root's children
          const rootChildrenCount = this.imageTree.root.children.length;
          this.horizontalDisplayCount = Math.min(rootChildrenCount, 3);
          if (this.horizontalDisplayCount === 0) {
            // If root has no children, default to 3 for future operations
            this.horizontalDisplayCount = 3;
          }

          // We need to check if there are more nodes to show at the next level
          // after building the tree, as the initial check might not be accurate
          this.hasMoreNodesToShow = this.checkForNodesAtNextLevel();
        }

        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.handleError(this.errorHandling.getReadableErrorMessage(error));
        console.error('Failed to load images', error);
      },
    });

    this.subscriptions.push(imagesSub);
  }

  /**
   * Handles displaying error messages to the user
   */
  private handleError(message: string): void {
    this.loading = false;
    this.errorState = true;
    this.errorMessage = message;
    this.errorActions = [
      {
        label: 'Back to Gallery',
        icon: 'arrow_back',
        action: () => this.router.navigate(['/gallery']),
      },
      {
        label: 'Retry',
        icon: 'refresh',
        action: () => this.loadImageData(),
      },
    ];
  }

  /**
   * Builds a tree structure of images based on their parent-child relationships.
   */
  buildImageTree(image: ImageModel): Tree<ImageModel> {
    const imageTree: Tree<ImageModel> = new Tree<ImageModel>();

    // First find the original (root) image to establish the tree's root
    const originalImage = this.getOriginalImage(image);
    if (!originalImage) {
      console.error('Could not find original image for:', image);
      return imageTree; // Return empty tree if original image not found
    }

    // Create a map to store all nodes that are part of this image's lineage
    const nodeMap: Map<string, TreeNode<ImageModel>> = new Map();

    // Find all images that share the same original image
    const relevantPairs = this.imagePairs.filter(
      (pair) =>
        this.getOriginalImage(pair.filteredImage).id === originalImage.id
    );

    if (relevantPairs.length === 0) {
      // If no relevant pairs, just add the original image as a standalone node
      const rootNode = new TreeNode<ImageModel>(originalImage);
      imageTree.setRoot(rootNode);
      return imageTree;
    }

    // First pass: create nodes for all relevant images
    relevantPairs.forEach((pair) => {
      // Only create nodes if they don't already exist in the map
      if (!nodeMap.has(pair.originalImage.id)) {
        nodeMap.set(
          pair.originalImage.id,
          new TreeNode<ImageModel>(pair.originalImage)
        );
      }
      if (!nodeMap.has(pair.filteredImage.id)) {
        nodeMap.set(
          pair.filteredImage.id,
          new TreeNode<ImageModel>(pair.filteredImage)
        );
      }
    });

    // Ensure the root is in the map (in case it wasn't part of any pair)
    if (!nodeMap.has(originalImage.id)) {
      nodeMap.set(originalImage.id, new TreeNode<ImageModel>(originalImage));
    }

    // Set the root node
    const rootNode = nodeMap.get(originalImage.id);
    if (rootNode) {
      imageTree.setRoot(rootNode);
    }

    // Second pass: establish parent-child relationships
    relevantPairs.forEach((pair) => {
      const childNode = nodeMap.get(pair.filteredImage.id);
      if (childNode && childNode.value.parentId) {
        const parentNode = nodeMap.get(childNode.value.parentId);
        if (parentNode) {
          // Check if this child is already added to prevent duplicates
          const alreadyAdded = parentNode.children.some(
            (existingChild) => existingChild.value.id === childNode.value.id
          );
          if (!alreadyAdded) {
            parentNode.addChild(childNode);
          }
        }
      }
    });

    // After building the tree, check if there are more nodes to display beyond current display level
    if (imageTree.root) {
      this.hasMoreNodesToShow =
        this.maxLevel > this.displayLevel && this.checkForNodesAtNextLevel();
    }

    return imageTree;
  }

  /**
   * Retrieves the original image by traversing up the hierarchy.
   */
  getOriginalImage(image: ImageModel): ImageModel {
    let currentImage = image;
    while (currentImage.parentId) {
      const parentImage = this.imagePairs.find(
        (imgPair) => imgPair.originalImage.id === currentImage.parentId
      )?.originalImage;

      if (!parentImage) {
        break;
      }

      currentImage = parentImage;
    }
    return currentImage;
  }

  /**
   * Calculates the maximum depth of the tree using an iterative approach
   */
  calculateTreeDepth(root: TreeNode<ImageModel>): number {
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
   * Calculates the maximum number of children for any node in the tree
   */
  calculateMaxChildrenCount(root: TreeNode<ImageModel>): number {
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

  /**
   * Checks if there are actual nodes at the next depth level
   * Returns true if there are nodes at display level + 1
   */
  private checkForNodesAtNextLevel(): boolean {
    if (!this.imageTree.root) return false;

    // Use BFS to check if there are any nodes at the next depth level
    // Only including the nodes that would be visible with current horizontalDisplayCount
    const queue: Array<{ node: TreeNode<ImageModel>; level: number }> = [];
    queue.push({ node: this.imageTree.root, level: 1 });

    while (queue.length > 0) {
      const { node, level } = queue.shift()!;

      // If we find nodes at the next level we want to show, return true
      if (level === this.displayLevel + 1) {
        return true;
      }

      // Only add children if we haven't reached the target level yet
      if (level < this.displayLevel + 1 && node.children.length > 0) {
        // Apply horizontalDisplayCount filtering similar to the D3 visualization
        let displayedChildren = node.children;
        if (node.children.length > this.horizontalDisplayCount) {
          const totalChildren = node.children.length;
          const childrenToShow = Math.min(
            totalChildren,
            this.horizontalDisplayCount
          );

          // Center the displayed children
          const startIndex = Math.max(
            0,
            Math.floor((totalChildren - childrenToShow) / 2)
          );
          displayedChildren = node.children.slice(
            startIndex,
            startIndex + childrenToShow
          );
        }

        // Add only the visible children to the queue
        for (const child of displayedChildren) {
          queue.push({ node: child, level: level + 1 });
        }
      }
    }

    return false;
  }

  /**
   * Increases the vertical depth of the tree display
   */
  showMoreLevels(): void {
    if (this.displayLevel < this.maxLevel) {
      this.displayLevel++;

      // Check if there are any more levels with actual nodes to display
      this.hasMoreNodesToShow = this.checkForNodesAtNextLevel();
    }
  }

  /**
   * Decreases the vertical depth of the tree display
   */
  showLessLevels(): void {
    if (this.displayLevel > 1) {
      this.displayLevel--;
      // When decreasing levels, there will always be more nodes to show if we haven't reached max depth
      this.hasMoreNodesToShow =
        this.displayLevel < this.maxLevel && this.checkForNodesAtNextLevel();
    }
  }

  /**
   * Increases the number of horizontally displayed children per node
   */
  showMoreHorizontalImages(): void {
    if (this.horizontalDisplayCount < this.maxHorizontalCount) {
      this.horizontalDisplayCount = Math.min(
        this.horizontalDisplayCount + 2,
        this.maxHorizontalCount
      );

      // Recalculate the maximum visible level with the new horizontal display count
      // This might reveal additional levels that were previously hidden
      const maxVisibleLevel = this.calculateMaxVisibleLevel();

      // After changing horizontal display count, check if there are more nodes at next level
      // This is important because showing more nodes horizontally might reveal nodes with children
      // at the next level that weren't visible before
      this.hasMoreNodesToShow =
        this.displayLevel < maxVisibleLevel && this.checkForNodesAtNextLevel();
    }
  }

  /**
   * Decreases the number of horizontally displayed children per node
   */
  showLessHorizontalImages(): void {
    if (this.horizontalDisplayCount > 1) {
      this.horizontalDisplayCount = Math.max(
        this.horizontalDisplayCount - 2,
        1
      );

      // After changing horizontal display count, check if there are more nodes at next level
      // This is necessary because hiding nodes horizontally might hide nodes that had children
      // at the next level
      this.hasMoreNodesToShow =
        this.displayLevel < this.maxLevel && this.checkForNodesAtNextLevel();

      // Find the maximum level that has visible nodes with the new horizontal display count
      const maxVisibleLevel = this.calculateMaxVisibleLevel();

      // If current display level is higher than max visible level, adjust it
      if (this.displayLevel > maxVisibleLevel) {
        this.displayLevel = Math.max(1, maxVisibleLevel);
      }
    }
  }

  /**
   * Calculates the maximum tree level that has visible nodes
   * based on the current horizontalDisplayCount
   */
  private calculateMaxVisibleLevel(): number {
    if (!this.imageTree.root) return 1;

    let maxVisibleLevel = 1;
    const queue: Array<{ node: TreeNode<ImageModel>; level: number }> = [];
    queue.push({ node: this.imageTree.root, level: 1 });

    while (queue.length > 0) {
      const { node, level } = queue.shift()!;
      maxVisibleLevel = Math.max(maxVisibleLevel, level);

      // Only include children that would be visible with current horizontalDisplayCount
      let displayedChildren = node.children;
      if (node.children.length > this.horizontalDisplayCount) {
        const totalChildren = node.children.length;
        const childrenToShow = Math.min(
          totalChildren,
          this.horizontalDisplayCount
        );

        // Center the displayed children
        const startIndex = Math.max(
          0,
          Math.floor((totalChildren - childrenToShow) / 2)
        );
        displayedChildren = node.children.slice(
          startIndex,
          startIndex + childrenToShow
        );
      }

      // Add visible children to the queue
      for (const child of displayedChildren) {
        queue.push({ node: child, level: level + 1 });
      }
    }

    return maxVisibleLevel;
  }

  /**
   * Navigates back to the gallery while preserving pagination state
   */
  navigateBack(): void {
    // Navigate back to gallery with the same page and page size
    this.router.navigate(['/gallery'], {
      queryParams: {
        page: this.cachedPage,
        pageSize: this.cachedPageSize,
      },
    });
  }

  /**
   * Resets the tree view to its default centered position
   */
  resetTreeView(): void {
    if (this.imageTreeComponent) {
      // Call the resetView method in the child component
      this.imageTreeComponent.resetView();
    }
  }
}
