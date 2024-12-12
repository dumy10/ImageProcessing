import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ImageService } from '../services/image.service';
import { ImageModel } from '../models/ImageModel';
import { LoadingComponent } from '../loading/loading.component';
import { ImageDialogComponent } from '../image-dialog/image-dialog.component';
import { Tree, TreeNode } from '../models/tree';

@Inject('ImageService')
@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, LoadingComponent, MatPaginatorModule, MatIconModule, MatButtonModule],
  providers: [ImageService],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent implements OnInit {
  loading: boolean = false;
  loadingMessage: string = 'Loading images...';
  imagePairs: Array<{ originalImage: ImageModel; filteredImage: ImageModel }> =
    [];
  paginatedImagePairs: Array<{
    originalImage: ImageModel;
    filteredImage: ImageModel;
  }> = [];

  currentPage: number = 0;
  itemsPerPage: number = 6;
  totalPages: number = 1;

  constructor(
    private dialog: MatDialog,
    private imageService: ImageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadImages();
  }

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
      error: (error) => {
        if (error.status === 404) {
          console.error('No images found', error);
          this.loading = false;
          alert('No images found');
          return;
        }
        console.error('Failed to fetch images', error);
        this.loading = false;
        alert('Failed to fetch images');
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.imagePairs.length / this.itemsPerPage);
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedImagePairs = this.imagePairs.slice(startIndex, endIndex);
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex;
    this.itemsPerPage = event.pageSize;
    this.updatePagination();
  }

  editImage(image: ImageModel): void {
    this.router.navigate(['/edit', image.id]);
  }

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
}
