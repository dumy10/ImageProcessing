import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, HostListener, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router } from '@angular/router';
import { filter, finalize } from 'rxjs/operators';
import { FilterSidebarComponent } from '../filter-sidebar/filter-sidebar.component';
import { LoadingComponent } from '../loading/loading.component';
import { Filters } from '../models/filters';
import { ImageModel } from '../models/ImageModel';
import { ImageService } from '../services/image.service';

/**
 * EditImageComponent is a component that allows users to edit an image by applying various filters.
 * It fetches the image from the server and provides a UI for applying filters.
 */
@Component({
  selector: 'app-edit-image',
  imports: [
    MatButtonModule,
    LoadingComponent,
    CommonModule,
    MatIconModule,
    FilterSidebarComponent,
  ],
  templateUrl: './edit-image.component.html',
  styleUrl: './edit-image.component.scss',
})
export class EditImageComponent implements OnInit {
  loading = false;
  loadingMessage = 'Loading the image...';
  image: ImageModel | undefined;
  imagePath = '';
  filters: Filters[] = [];
  isMobileView = false;
  undoStack: string[] = [];
  redoStack: string[] = [];
  sidebarCollapsed = false;

  constructor(private router: Router, private imageService: ImageService) {}

  ngOnInit(): void {
    this.checkScreenSize();
    this.loading = true;
    const id = this.getIdFromUrl();

    if (id === undefined) {
      console.error('Invalid image ID');
      this.router.navigate(['/']);
      return;
    }

    this.filters = Object.values(Filters);
    this.loadImage(id);

    // listen for navigation events to load the new image when going back
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const newId = this.getIdFromUrl();
        if (newId && newId !== this.image?.id) {
          this.loadImage(newId);
        }
      });
  }

  getIdFromUrl(): string | undefined {
    const url = window.location.href;
    const editIndex = url.indexOf('/edit/');
    return editIndex === -1
      ? undefined
      : url.substring(editIndex + '/edit/'.length);
  }

  loadImage(id: string): void {
    this.loading = true;
    this.imageService
      .getImage(id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.image = response as ImageModel;
          this.imagePath = this.image.url;
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to fetch image', error);
          alert(error.message);
        },
      });
  }

  filterImage(filter: Filters): void {
    if (!this.image) {
      console.error('No image to edit');
      return;
    }

    this.loading = true;
    this.loadingMessage = `Applying filter: ${filter}...`;

    // Store the current image ID in the undo stack before applying a new filter
    if (this.image.id) {
      this.undoStack.push(this.image.id);
      this.redoStack = []; // Clear redo stack when a new filter is applied
    }

    this.imageService
      .editImage(this.image.id, filter.toString().toLowerCase())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          this.image = response as ImageModel;
          this.imagePath = this.image.url;
          this.router.navigate(['/edit', response.id]);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to edit image', error);
          alert(error.message);
        },
      });
  }

  downloadImage(): void {
    if (!this.image) {
      console.error('No image to download');
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Downloading the image...';

    this.imageService
      .downloadImage(this.image.id)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (response) => {
          const url = window.URL.createObjectURL(response);
          const a = document.createElement('a');
          a.href = url;
          a.download = this.image?.name || 'image';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        },
        error: (error: HttpErrorResponse) => {
          console.error('Failed to download image', error);
          alert(error.message);
        },
      });
  }

  onImageError(): void {
    this.imagePath = 'assets/images/notfound.jpg';
  }

  undoFilter(): void {
    if (!this.image) {
      console.error('No image to undo');
      return;
    }

    if (this.undoStack.length === 0) {
      // If no items in undo stack but image has a parent, use it (for initial state)
      if (!this.image.parentId) {
        alert("The image hasn't been edited yet");
        return;
      }

      if (this.image.id) {
        this.redoStack.push(this.image.id);
      }

      this.navigateToImage(this.image.parentId);
      return;
    }

    const previousImageId = this.undoStack.pop();

    if (this.image.id) {
      this.redoStack.push(this.image.id);
    }

    this.navigateToImage(previousImageId as string);
  }

  redoFilter(): void {
    if (this.redoStack.length === 0) {
      return; // Nothing to redo
    }

    const nextImageId = this.redoStack.pop();

    if (this.image?.id) {
      this.undoStack.push(this.image.id);
    }

    this.navigateToImage(nextImageId as string);
  }

  private navigateToImage(imageId: string): void {
    this.loading = true;
    this.loadingMessage = 'Loading image...';

    this.imageService
      .getImage(imageId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
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

  hasAppliedFilters(): boolean {
    // Use optional chaining and nullish coalescing to safely check if appliedFilters exists and has items
    return (this.image?.appliedFilters?.length ?? 0) > 0;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0 || !!this.image?.parentId;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    this.isMobileView = window.innerWidth <= 768;
  }

  onImageLoad(): void {
    if (this.image) {
      this.image.loaded = true;
    }
  }
}
