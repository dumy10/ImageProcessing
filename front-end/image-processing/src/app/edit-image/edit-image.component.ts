import { Component, Inject, OnInit } from '@angular/core';
import { ImageService } from '../services/image.service';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Inject('ImageService')
@Component({
  selector: 'app-edit-image',
  standalone: true,
  imports: [MatButtonModule],
  providers: [ImageService],
  templateUrl: './edit-image.component.html',
  styleUrl: './edit-image.component.scss',
})
export class EditImageComponent implements OnInit {
  imagePath: string = '';

  constructor(private router: Router, private imageService: ImageService) {}

  // TO DO: Implement the image editing functionality
  // - Fetch the image from the server
  // - Allow the user to edit the image
  // - Save the edited image

  ngOnInit(): void {
    /* 
      TO DO:
      - Fetch the image from the server
      - Display the image in the editor
      */
    // fetch the image id from the URL
    const id = this.getIdFromUrl();
    if (!id) {
      console.error('Invalid image ID');
      this.router.navigate(['/']);
    }

    // fetch the image from the server
    this.imageService.getImage(id as string).subscribe(() => {
      // TO DO: Implement the logic to display the image in the editor
    });
  }

  private getIdFromUrl(): string | null {
    const url = window.location.href;
    const idMatch = url.match(/\/edit\/(\d+)/);
    return idMatch ? idMatch[1] : null;
  }
}
