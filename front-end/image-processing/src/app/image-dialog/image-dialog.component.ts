import { Component, Inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { ImageModel } from '../models/ImageModel';
import { Tree } from '../models/tree';
import { ImageTreeComponent } from '../image-tree/image-tree.component';

@Component({
  selector: 'app-image-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
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
  imagePairs: Array<{
    originalImage: ImageModel;
    filteredImage: ImageModel;
  }> = [];

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
  }

  close(): void {
    this.dialogRef.close();
  }
}
