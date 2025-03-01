import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoadingComponent } from '../loading/loading.component';
import { Filters } from '../models/filters';
import { ImageModel } from '../models/ImageModel';
import { ImageService } from '../services/image.service';

/**
 * EditImageComponent is a component that allows users to edit an image by applying various filters.
 * It fetches the image from the server and provides a UI for applying filters.
 *
 * @component
 * @selector app-edit-image
 * @imports CommonModule, MatButtonModule, LoadingComponent, MatIconModule
 * @templateUrl ./edit-image.component.html
 * @styleUrl ./edit-image.component.scss
 */
@Component({
  selector: 'app-edit-image',
  imports: [MatButtonModule, LoadingComponent, CommonModule, MatIconModule],
  templateUrl: './edit-image.component.html',
  styleUrl: './edit-image.component.scss',
})
export class EditImageComponent implements OnInit {
  /**
   * Indicates whether the application is currently loading.
   * @type {boolean}
   */
  loading: boolean = false;

  /**
   * Message displayed while loading the image.
   * @type {string}
   */
  loadingMessage: string = 'Loading the image...';

  /**
   * The image being edited.
   * @type {ImageModel | undefined}
   */
  image: ImageModel | undefined;

  /**
   * Path to the image being edited.
   * @type {string}
   */
  imagePath: string = '';

  /**
   * Array of available filters.
   * @type {Filters[]}
   */
  filters: Filters[] = [];

  /**
   * Indicates whether the dropdown menu is open.
   */
  dropdownOpen = false;

  /**
   * Indicates whether the view is mobile.
   */
  isMobileView = false;
  /**
   * Constructor for EditImageComponent.
   * @param {Router} router - The router for navigating between pages.
   * @param {ImageService} imageService - Service for handling image operations.
   */
  constructor(private router: Router, private imageService: ImageService) {}

  /**
   * Initializes the component and loads the image.
   */
  ngOnInit(): void {
    this.checkScreenSize();
    this.loading = true;
    const id = this.getIdFromUrl();

    if (id === undefined) {
      console.error('Invalid image ID');
      this.router.navigate(['/']);
    }

    this.filters = Object.values(Filters);

    // fetch the image from the server
    this.loadImage(id as string);

    // listen for navigation events to load the new image when going back
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const newId = this.getIdFromUrl();

        if (newId === undefined) {
          return;
        }

        if (newId !== this.image?.id) {
          this.loadImage(newId as string);
        }
      });
  }

  /**
   * Extracts the image ID from the URL.
   * @returns {string | undefined} - The image ID or undefined if not found.
   */
  getIdFromUrl(): string | undefined {
    const url = window.location.href;
    const editIndex = url.indexOf('/edit/');

    if (editIndex === -1) {
      return undefined;
    }

    return url.substring(editIndex + '/edit/'.length);
  }

  /**
   * Loads the image from the server using the provided ID.
   * @param {string} id - The ID of the image to load.
   */
  loadImage(id: string): void {
    this.imageService.getImage(id).subscribe({
      next: (response) => {
        this.image = response as ImageModel;
        this.imagePath = this.image.url;
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to fetch image', error);
        alert(error.message);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  /**
   * Applies a filter to the image.
   * @param {Filters} filter - The filter to apply to the image.
   */
  filterImage(filter: Filters): void {
    if (!this.image) {
      console.error('No image to edit');
      return;
    }

    this.loading = true;
    this.loadingMessage = `Applying filter: ${filter}...`;

    this.imageService
      .editImage(this.image.id, filter.toString().toLowerCase())
      .subscribe({
        next: (response) => {
          this.image = response as ImageModel;
          this.imagePath = this.image.url;
          this.router.navigate(['/edit', response.id]);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to edit image', error);
          alert(error.message);
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  /**
   * Downloads the given image.
   */
  downloadImage(): void {
    if (!this.image) {
      console.error('No image to download');
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Downloading the image...';

    this.imageService.downloadImage(this.image.id).subscribe({
      next: (response) => {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = this.image?.name || 'image';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to download image', error);
        alert(error.message);
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
  /**
   * Handles the image error event.
   */
  onImageError(): void {
    this.imagePath = 'assets/images/notfound.jpg';
  }

  /**
   * Undoes the last filter applied to the image.
   */
  undoFilter(): void {
    if (!this.image) {
      console.error('No image to undo');
      return;
    }

    if (!this.image.parentId) {
      alert("The image hasn't been edited yet");
      return;
    }

    this.imageService.getImage(this.image.parentId as string).subscribe({
      next: (response) => {
        this.image = response as ImageModel;
        this.imagePath = this.image.url;
        this.router.navigate(['/edit', response.id]);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to fetch image', error);
        alert(error.message);
      },
    });
  }

  /**
   * Toggles the dropdown menu.
   */
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  /**
   * Listens for window resize events and updates the isMobileView flag
   * based on the current window width.
   *
   * @param event The resize event
   */
  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.checkScreenSize();
  }

  /**
   * Checks the screen size and sets the isMobileView flag accordingly.
   */
  checkScreenSize() {
    this.isMobileView = window.innerWidth <= 768;
  }
}
