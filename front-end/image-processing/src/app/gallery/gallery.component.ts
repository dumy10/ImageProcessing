import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { ImageDialogComponent } from '../image-dialog/image-dialog.component';
import { LoadingComponent } from '../loading/loading.component';
import { ImageModel } from '../models/ImageModel';
import { Tree, TreeNode } from '../models/tree';
import { ImageService } from '../services/image.service';

/**
 * GalleryComponent is a component that displays a gallery of images with pagination.
 * It allows users to view and interact with a collection of original and filtered images.
 *
 * @component
 * @selector app-gallery
 * @imports CommonModule, LoadingComponent, MatPaginatorModule, MatIconModule, MatButtonModule
 * @providers ImageService
 * @templateUrl ./gallery.component.html
 * @styleUrl ./gallery.component.scss
 */
@Component({
  selector: 'app-gallery',
  imports: [
    CommonModule,
    LoadingComponent,
    MatPaginatorModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent implements OnInit {
  /**
   * Indicates whether the application is currently loading.
   * @type {boolean}
   */
  loading: boolean = false;

  /**
   * Message displayed while loading images.
   * @type {string}
   */
  loadingMessage: string = 'Loading images...';

  /**
   * Array of image pairs, each containing an original image and its filtered version.
   * @type {Array<{ originalImage: ImageModel; filteredImage: ImageModel }>}
   */
  imagePairs: Array<{ originalImage: ImageModel; filteredImage: ImageModel }> =
    [];

  /**
   * Array of paginated image pairs for the current page.
   * @type {Array<{ originalImage: ImageModel; filteredImage: ImageModel }>}
   */
  paginatedImagePairs: Array<{
    originalImage: ImageModel;
    filteredImage: ImageModel;
  }> = [];

  /**
   * Current page number in the pagination.
   * @type {number}
   */
  currentPage: number = 0;

  /**
   * Number of items to display per page.
   * @type {number}
   */
  itemsPerPage: number = 6;

  /**
   * Total number of pages in the pagination.
   * @type {number}
   */
  totalPages: number = 1;

  /**
   * Constructor for GalleryComponent.
   * @param {MatDialog} dialog - The dialog service for opening dialogs.
   * @param {ImageService} imageService - Service for handling image operations.
   * @param {Router} router - Router for navigating between pages.
   * @param {ActivatedRoute} route - The activated route for accessing URL parameters.
   */
  constructor(
    private dialog: MatDialog,
    private imageService: ImageService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /**
   * Initializes the component and loads the images.
   */
  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.currentPage = params['page'] ? +params['page'] : 0;
      this.itemsPerPage = params['pageSize'] ? +params['pageSize'] : 6;
      this.onPageChange({
        pageIndex: this.currentPage,
        pageSize: this.itemsPerPage,
      });
    });
    this.loading = true;
    this.loadImages();
  }

  /**
   * Loads the images from the server and sets up pagination.
   */
  loadImages(): void {
    this.imageService.getImages().subscribe({
      next: (response: ImageModel[]) => {
        response.forEach((image) => {
          if (!image.parentUrl) {
            return;
          }

          this.imagePairs.push({
            originalImage: response.find(
              (img) => img.id === image.parentId
            ) as ImageModel,
            filteredImage: image,
          });
        });

        if (this.imagePairs.length === 0) {
          this.loading = false;
          alert('No filtered images found');
          return;
        }

        this.updatePagination();
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 404) {
          console.error('No images found', error);
          this.loading = false;
          alert(error.message || 'No images found');
          return;
        }
        console.error('Failed to fetch images', error);
        this.loading = false;
        alert(error.message || 'An error occurred while fetching images.');
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  /**
   * Paginates the images based on the current page and items per page.
   */
  updatePagination(): void {
    this.totalPages = Math.ceil(this.imagePairs.length / this.itemsPerPage);
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedImagePairs = this.imagePairs.slice(startIndex, endIndex);
  }

  /**
   * Handles page change event from the paginator.
   * @param {any} event - The event.
   */
  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.itemsPerPage = event.pageSize;
    this.updatePagination();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: this.currentPage, pageSize: this.itemsPerPage },
      queryParamsHandling: 'merge',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Navigates to the edit image page for the given image.
   * @param {ImageModel} image - The image to edit.
   */
  editImage(image: ImageModel): void {
    this.router.navigate(['/edit', image.id]);
  }

  /**
   * Opens a dialog to display the details of the given image.
   * @param {ImageModel} image - The image for which to display the details.
   */
  openDialog(image: ImageModel): void {
    const dialogRef = this.dialog.open(ImageDialogComponent, {
      data: {
        tree: this.getImageTree(image),
        imagePairs: this.imagePairs,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }

  /**
   * Builds a tree structure of images based on their parent-child relationships.
   * @param {ImageModel} image - The image for which to build the tree.
   * @returns {Tree<ImageModel>} - The tree structure of images.
   */
  getImageTree(image: ImageModel): Tree<ImageModel> {
    const imageTree: Tree<ImageModel> = new Tree<ImageModel>();
    const nodeMap: Map<string, TreeNode<ImageModel>> = new Map();

    // Create nodes for all images and store them in the map
    this.imagePairs.forEach((imgPair) => {
      const originalNode = new TreeNode<ImageModel>(imgPair.originalImage);
      const filteredNode = new TreeNode<ImageModel>(imgPair.filteredImage);
      nodeMap.set(imgPair.originalImage.id, originalNode);
      nodeMap.set(imgPair.filteredImage.id, filteredNode);
    });

    // Set the root node as the original image
    const originalImage = this.getOriginalImage(image);
    const rootNode = nodeMap.get(originalImage.id);
    if (rootNode) {
      imageTree.setRoot(rootNode);
    }

    // Traverse the images and build the tree
    nodeMap.forEach((node, id) => {
      const parentId = node.value.parentId;
      if (parentId) {
        const parentNode = nodeMap.get(parentId);
        if (parentNode) {
          parentNode.addChild(node);
        }
      }
    });

    return imageTree;
  }

  /**
   * Retrieves the original image by traversing up the hierarchy.
   * @param {ImageModel} image - The image for which to retrieve the original.
   * @returns {ImageModel} - The original image.
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
    return currentImage as ImageModel;
  }

  /**
   * Downloads the given image.
   * @param {ImageModel} image - The image to download.
   */
  downloadImage(image: ImageModel): void {
    if (!image) {
      console.error('No image to download');
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Downloading the image...';

    this.imageService.downloadImage(image.id).subscribe({
      next: (response) => {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = image?.name || 'image';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to download image', error);
        alert(
          error.message || 'An error occurred while downloading the image.'
        );
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  /**
   * Handles the image error event.
   * @param {ImageModel} image - The image that has been loaded.
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
}
