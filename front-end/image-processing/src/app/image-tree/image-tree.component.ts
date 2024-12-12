import { Component, Inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TreeNode } from '../models/tree';
import { ImageModel } from '../models/ImageModel';
import { ImageService } from '../services/image.service';
import { ImageHierarchyComponent } from '../image-hierarchy/image-hierarchy.component';

@Inject('ImageService')
@Component({
  selector: 'app-image-tree',
  standalone: true,
  imports: [CommonModule],
  providers: [ImageService],
  templateUrl: './image-tree.component.html',
  styleUrl: './image-tree.component.scss',
})
export class ImageTreeComponent {
  @Input() node: TreeNode<ImageModel> | null = null;
  @Input() imagePairs: Array<{
    originalImage: ImageModel;
    filteredImage: ImageModel;
  }> = [];

  constructor(private dialog: MatDialog) {}

  openDialog(image: ImageModel): void {
    const dialogRef = this.dialog.open(ImageHierarchyComponent, {
      data: this.getImageHierarchy(image),
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }

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
}
