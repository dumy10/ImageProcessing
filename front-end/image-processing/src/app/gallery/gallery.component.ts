import { Component, OnInit } from '@angular/core';
import { ImageService } from '../services/image.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [],
  providers: [ImageService],
  templateUrl: './gallery.component.html',
  styleUrl: './gallery.component.scss',
})
export class GalleryComponent implements OnInit {
  
  // Will need an array with the images
  
  constructor(private imageService : ImageService) {}

  ngOnInit(): void {
    /* 
      TO DO:
      - Fetch images from the server
      - Display already processed images in the gallery
      */
  }
}
