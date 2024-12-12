import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { ImageModel } from '../models/ImageModel';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-image-hierarchy',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
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
  constructor(
    public dialogRef: MatDialogRef<ImageHierarchyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ImageModel[]
  ) {}

  close(): void {
    this.dialogRef.close();
  }
}
