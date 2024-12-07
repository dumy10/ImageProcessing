import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { ImageService } from '../services/image.service';
import { ImageModel } from '../models/ImageModel';
import { LoadingComponent } from '../loading/loading.component';
import { ImageDialogComponent } from '../image-dialog/image-dialog.component';

@Inject('ImageService')
@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, LoadingComponent, MatPaginatorModule],
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
  itemsPerPage: number = 5;
  totalPages: number = 1;

  constructor(private dialog: MatDialog, private imageService: ImageService) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadImages();
  }

  loadImages() {
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
        this.updatePagination();
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to fetch images', error);
        this.loading = false;
        alert('Failed to fetch images');
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  updatePagination() {
    this.totalPages = Math.ceil(this.imagePairs.length / this.itemsPerPage);
    const startIndex = this.currentPage * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedImagePairs = this.imagePairs.slice(startIndex, endIndex);
  }

  onPageChange(event: any) {
    this.currentPage = event.pageIndex;
    this.itemsPerPage = event.pageSize;
    this.updatePagination();
  }

  openDialog(image: ImageModel) {
    const dialogRef = this.dialog.open(ImageDialogComponent, { data: image });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }
}
