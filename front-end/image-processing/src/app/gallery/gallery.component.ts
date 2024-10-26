import { Component, Inject, OnInit } from '@angular/core';
import { ImageService } from '../services/image.service';
import { CommonModule } from '@angular/common';

@Inject('ImageService')
@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  providers: [ImageService],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent implements OnInit {
  // Will need an array with the images
  imagePairs: Array<{ original: string; filtered: string }> = [];
  constructor(private imageService: ImageService) {}

  ngOnInit(): void {
    /* 
      TO DO:
      - Fetch images from the server
      - Display already processed images in the gallery
      */
    this.imageService.getImages().subscribe(() => {
      // TO DO: Implement the logic to display the images in the gallery
    });
  }

  openDialog(image: string) {
    // TO DO: Implement the dialog to display the original and filtered images
  }
}
