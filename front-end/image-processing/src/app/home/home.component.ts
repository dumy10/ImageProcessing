import { Component, Inject } from '@angular/core';
import { ImageService } from '../services/image.service';
import { CommonModule } from '@angular/common';

@Inject('ImageService')
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  providers: [ImageService],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  loading: boolean = false;

  constructor(private imageService: ImageService) {}

  onDragOver(event: DragEvent) {
    event.preventDefault(); // Necessary to allow drop
    const dropzone = event.target as HTMLElement;
    dropzone.classList.add('dragging');
  }

  onDragLeave(event: DragEvent) {
    const dropzone = event.target as HTMLElement;
    dropzone.classList.remove('dragging');
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const dropzone = event.target as HTMLElement;
    dropzone.classList.remove('dragging');

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      // Handle the dropped file
      this.handleFiles(files);
    }
  }

  onUploadClick() {
    const uploadInput = document.getElementById(
      'imageUpload'
    ) as HTMLInputElement;
    uploadInput.click();
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFiles([file]);
    }
  }

  handleFiles(files: FileList | File[]) {
    // The user isnt allowed to select multiple files but he can drop them, throw an error as is is not allowed
    if (files.length > 1) {
      console.error('Invalid file count. Only one file is allowed.');
      alert('Please upload only one file.');
      return;
    }

    const file = files[0]; // Handle only the first file
    if (file) {
      const validImageTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ];

      // Check if file is an image
      if (validImageTypes.includes(file.type)) {
        this.loading = true;
        // Process the image file
        /*
        TODO:
        - Send the image file to the back-end
        - Create a route which loads the edit-image taking the image ID from the back-end
        - Load a different component(edit-image) with the uploaded image in order to process it
        */

        this.imageService.uploadImage(file).subscribe({
          next: (response) => {
            this.loading = false;
            console.log('Image uploaded successfully:', response);
          },
          error: (error) => {
            this.loading = false;
            console.error('Error uploading image:', error);
            alert(
              'An error occurred while uploading the image. Please try again.'
            );
          },
          complete: () => {
            this.loading = false;
            console.log('Upload complete');
          },
        });
      } else {
        console.error('Invalid file type. Only images are allowed.');
        alert('Please upload a valid image file (JPEG, PNG, GIF, WebP, SVG).');
      }
    }
  }
}
