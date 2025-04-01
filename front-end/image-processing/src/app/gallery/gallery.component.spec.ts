import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ImageDialogComponent } from '../image-dialog/image-dialog.component';
import { ImageModel } from '../models/ImageModel';
import { CacheService } from '../services/cache.service';
import { ErrorHandlingService } from '../services/error-handling.service';
import { ImageService } from '../services/image.service';
import { GalleryComponent } from './gallery.component';

describe('GalleryComponent', () => {
  let component: GalleryComponent;
  let fixture: ComponentFixture<GalleryComponent>;
  let imageService: ImageService;
  let cacheService: CacheService;
  let errorHandlingService: jasmine.SpyObj<ErrorHandlingService>;
  let matSnackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(async () => {
    // Create spy objects for ErrorHandlingService and MatSnackBar
    const errorHandlingSpy = jasmine.createSpyObj('ErrorHandlingService', [
      'showErrorWithRetry',
      'showErrorWithActions',
      'getReadableErrorMessage',
      'getErrorMessageByStatus',
    ]);

    const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      imports: [GalleryComponent, MatDialogModule, RouterModule.forRoot([])],
      providers: [
        ImageService,
        CacheService,
        { provide: ErrorHandlingService, useValue: errorHandlingSpy },
        { provide: MatSnackBar, useValue: snackBarSpy },
        provideHttpClientTesting(),
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryComponent);
    component = fixture.componentInstance;
    imageService = TestBed.inject(ImageService);
    cacheService = TestBed.inject(CacheService);
    errorHandlingService = TestBed.inject(
      ErrorHandlingService
    ) as jasmine.SpyObj<ErrorHandlingService>;
    matSnackBar = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;

    // Setup default return values for error handling methods
    errorHandlingService.getReadableErrorMessage.and.returnValue(
      'Error message'
    );
    errorHandlingService.getErrorMessageByStatus.and.returnValue(
      'Error by status'
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should download image', () => {
    const image: ImageModel = {
      id: '1',
      url: 'test-url',
      name: 'test-image',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: false,
    };
    spyOn(imageService, 'downloadImage').and.returnValue(of(new Blob()));
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob-url');
    const anchor = document.createElement('a');
    spyOn(document, 'createElement').and.returnValue(anchor);
    spyOn(anchor, 'click');

    component.downloadImage(image);

    expect(imageService.downloadImage).toHaveBeenCalledWith('1');
    expect(anchor.href).toContain('blob-url');
    expect(anchor.download).toBe('test-image');
    expect(anchor.click).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('should handle download image error', () => {
    const image: ImageModel = {
      id: '1',
      url: 'test-url',
      name: 'test-image',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: false,
    };
    spyOn(imageService, 'downloadImage').and.returnValue(
      throwError(() => new Error('error'))
    );

    component.downloadImage(image);

    expect(imageService.downloadImage).toHaveBeenCalledWith('1');
    expect(errorHandlingService.showErrorWithRetry).toHaveBeenCalled();
    expect(component.errorState).toBeTrue();
    expect(component.loading).toBeFalse();
  });

  it('should handle image error', () => {
    const image: ImageModel = {
      id: '1',
      url: 'test-url',
      name: 'test-image',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: false,
    };

    component.onImageError(image);

    expect(image.loaded).toBeTrue();
    expect(image.url).toBe('assets/images/notfound.jpg');
  });

  it('should handle image load', () => {
    const image: ImageModel = {
      id: '1',
      url: 'test-url',
      name: 'test-image',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: false,
    };

    component.onImageLoad(image);

    expect(image.loaded).toBeTrue();
  });

  it('should load images and update pagination', () => {
    const images: ImageModel[] = [
      {
        id: '1',
        url: 'url1',
        name: 'image1',
        parentId: undefined,
        parentUrl: undefined,
        width: 100,
        height: 100,
        appliedFilters: [],
        loaded: false,
      },
      {
        id: '2',
        url: 'url2',
        name: 'image2',
        parentId: '1',
        parentUrl: 'url1',
        width: 100,
        height: 100,
        appliedFilters: [],
        loaded: false,
      },
    ];
    spyOn(imageService, 'getImages').and.returnValue(of(images));
    spyOn(component, 'performSmartPreloading');

    component.loadImages();

    expect(component.imagePairs.length).toBe(1);
    expect(component.paginatedImagePairs.length).toBe(1);
    expect(component.loading).toBeFalse();
    expect(component.performSmartPreloading).toHaveBeenCalled();
  });

  it('should handle no images found', () => {
    spyOn(imageService, 'getImages').and.returnValue(of([]));

    component.loadImages();

    expect(component.imagePairs.length).toBe(0);
    expect(component.errorState).toBeTrue();
    expect(component.errorMessage).toBe('No filtered images found');
    expect(component.loading).toBeFalse();
  });

  it('should handle error while fetching images', () => {
    const error = new Error('An error occurred while fetching images.');
    spyOn(imageService, 'getImages').and.returnValue(throwError(() => error));

    component.loadImages();

    expect(errorHandlingService.showErrorWithRetry).toHaveBeenCalled();
    expect(component.errorState).toBeTrue();
    expect(component.loading).toBeFalse();
  });

  it('should update pagination', () => {
    component.imagePairs = [
      {
        originalImage: {
          id: '1',
          url: 'url1',
          name: 'image1',
          parentId: undefined,
          parentUrl: undefined,
          width: 100,
          height: 100,
          appliedFilters: [],
          loaded: false,
        },
        filteredImage: {
          id: '2',
          url: 'url2',
          name: 'image2',
          parentId: '1',
          parentUrl: 'url1',
          width: 100,
          height: 100,
          appliedFilters: [],
          loaded: false,
        },
      },
    ];
    component.itemsPerPage = 1;

    component.updatePagination();

    expect(component.totalPages).toBe(1);
    expect(component.paginatedImagePairs.length).toBe(1);
  });

  it('should handle page change', () => {
    spyOn(component, 'updatePagination');
    spyOn(window, 'scrollTo');
    spyOn(component, 'performSmartPreloading');

    component.onPageChange({ pageIndex: 1, pageSize: 10 });

    expect(component.currentPage).toBe(1);
    expect(component.itemsPerPage).toBe(10);
    expect(component.updatePagination).toHaveBeenCalled();
    expect(window.scrollTo as any).toHaveBeenCalledWith(
      jasmine.objectContaining({ top: 0, behavior: 'smooth' })
    );
    expect(component.performSmartPreloading).toHaveBeenCalled();
  });

  it('should navigate to edit image page', () => {
    const routerSpy = spyOn(component['router'], 'navigate');

    const image: ImageModel = {
      id: '1',
      url: 'test-url',
      name: 'test-image',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: false,
    };
    component.editImage(image);

    expect(routerSpy).toHaveBeenCalledWith(['/edit', '1']);
  });

  it('should open dialog with image details', () => {
    const dialogSpy = spyOn(component['dialog'], 'open').and.callThrough();
    spyOn(component, 'preloadRelatedImages');

    const image: ImageModel = {
      id: '1',
      url: 'test-url',
      name: 'test-image',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: false,
    };
    component.imagePairs = [
      {
        originalImage: image,
        filteredImage: {
          id: '2',
          url: 'url2',
          name: 'image2',
          parentId: '1',
          parentUrl: 'url1',
          width: 100,
          height: 100,
          appliedFilters: [],
          loaded: false,
        },
      },
    ];

    component.openDialog(image);

    expect(dialogSpy).toHaveBeenCalled();
    expect(component.preloadRelatedImages).toHaveBeenCalledWith(image);
  });

  it('should build image tree correctly', () => {
    const image: ImageModel = {
      id: '2',
      url: 'url2',
      name: 'image2',
      parentId: '1',
      parentUrl: 'url1',
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: false,
    };
    component.imagePairs = [
      {
        originalImage: {
          id: '1',
          url: 'url1',
          name: 'image1',
          parentId: undefined,
          parentUrl: undefined,
          width: 100,
          height: 100,
          appliedFilters: [],
          loaded: false,
        },
        filteredImage: image,
      },
    ];

    const tree = component.getImageTree(image);

    expect(tree.root?.value.id).toBe('1');
    expect(tree.root?.children[0].value.id).toBe('2');
  });

  it('should retrieve original image correctly', () => {
    const image: ImageModel = {
      id: '2',
      url: 'url2',
      name: 'image2',
      parentId: '1',
      parentUrl: 'url1',
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: false,
    };
    component.imagePairs = [
      {
        originalImage: {
          id: '1',
          url: 'url1',
          name: 'image1',
          parentId: undefined,
          parentUrl: undefined,
          width: 100,
          height: 100,
          appliedFilters: [],
          loaded: false,
        },
        filteredImage: image,
      },
    ];

    const originalImage = component.getOriginalImage(image);

    expect(originalImage.id).toBe('1');
  });

  it('should call loadImages on init', () => {
    spyOn(component, 'loadImages');

    component.ngOnInit();

    expect(component.loadImages).toHaveBeenCalled();
  });

  it('should open dialog with correct data', () => {
    const dialogSpy = spyOn(component['dialog'], 'open').and.callThrough();
    spyOn(component, 'preloadRelatedImages');

    const image: ImageModel = {
      id: '1',
      url: 'test-url',
      name: 'test-image',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: false,
    };
    component.imagePairs = [
      {
        originalImage: image,
        filteredImage: {
          id: '2',
          url: 'url2',
          name: 'image2',
          parentId: '1',
          parentUrl: 'url1',
          width: 100,
          height: 100,
          appliedFilters: [],
          loaded: false,
        },
      },
    ];

    component.openDialog(image);

    expect(dialogSpy).toHaveBeenCalledWith(ImageDialogComponent, {
      data: {
        tree: jasmine.any(Object),
        imagePairs: component.imagePairs,
      },
    });
    expect(component.preloadRelatedImages).toHaveBeenCalledWith(image);
  });

  it('should set currentPage and itemsPerPage from query params', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.queryParams = of({ page: '2', pageSize: '10' });

    component.ngOnInit();

    expect(component.currentPage).toBe(2);
    expect(component.itemsPerPage).toBe(10);
  });

  it('should set default currentPage and itemsPerPage if query params are not provided', () => {
    const activatedRoute = TestBed.inject(ActivatedRoute);
    activatedRoute.queryParams = of({});

    component.ngOnInit();

    expect(component.currentPage).toBe(0);
    expect(component.itemsPerPage).toBe(6);
  });

  // New tests for caching and preloading

  describe('Smart preloading', () => {
    it('should perform initial preloading when images are loaded for the first time', fakeAsync(() => {
      // Setup image pairs
      component.imagePairs = createMultipleImagePairs(10);
      component.currentPage = 0;
      component.itemsPerPage = 6;
      component.updatePagination();

      // Reset initial preload flag
      (component as any).initialPreloadDone = false;

      // Spy on preload methods
      spyOn(component as any, 'preloadImagesForCurrentAndNextPage');
      spyOn(component as any, 'preloadAdditionalImages');

      // Call the method
      component.performSmartPreloading();

      // Verify first-time preloading strategy
      expect(
        (component as any).preloadImagesForCurrentAndNextPage
      ).toHaveBeenCalled();
      expect((component as any).initialPreloadDone).toBeTrue();

      // Fast-forward time to trigger the delayed preloading (use tick instead of jasmine clock)
      tick(3500);

      // Verify delayed preloading was triggered
      expect((component as any).preloadAdditionalImages).toHaveBeenCalled();
    }));

    it('should preload current and next page images', () => {
      // Setup image pairs
      component.imagePairs = createMultipleImagePairs(12);
      component.currentPage = 0;
      component.itemsPerPage = 6;
      component.updatePagination();

      // Spy on preload method in image service
      spyOn(imageService, 'preloadImage');

      // Call the method
      (component as any).preloadImagesForCurrentAndNextPage();

      // Should preload all images on current page (6 pairs = 12 images)
      // Plus first 3 pairs from next page = 6 more images
      expect(imageService.preloadImage).toHaveBeenCalledTimes(18);
    });

    it('should preload related images for dialog view', () => {
      // Setup image pairs
      const originalImage = {
        id: '1',
        url: 'url1',
        name: 'image1',
        parentId: undefined,
        parentUrl: undefined,
        width: 100,
        height: 100,
        appliedFilters: [],
        loaded: false,
      } as ImageModel;

      const filteredImages = [];
      for (let i = 2; i <= 5; i++) {
        filteredImages.push({
          id: i.toString(),
          url: 'url' + i,
          name: 'image' + i,
          parentId: '1',
          parentUrl: 'url1',
          width: 100,
          height: 100,
          appliedFilters: [],
          loaded: false,
        } as ImageModel);
      }

      component.imagePairs = filteredImages.map((img) => ({
        originalImage,
        filteredImage: img,
      }));

      // Spy on preload method in image service
      spyOn(imageService, 'preloadImage');

      // Call the method with a filtered image
      component.preloadRelatedImages(filteredImages[0]);

      // Should preload all filtered versions of the original image (4 images)
      expect(imageService.preloadImage).toHaveBeenCalledTimes(4);
      expect(imageService.preloadImage).toHaveBeenCalledWith('2');
      expect(imageService.preloadImage).toHaveBeenCalledWith('3');
      expect(imageService.preloadImage).toHaveBeenCalledWith('4');
      expect(imageService.preloadImage).toHaveBeenCalledWith('5');
    });

    it('should skip preloading if image is already in cache', fakeAsync(() => {
      // Setup test
      spyOn(cacheService, 'hasBlobCache').and.returnValue(true);
      spyOn(imageService, 'downloadImage');

      // Call the preload method
      imageService.preloadImage('1');

      // Advance timers
      tick();

      // Verify that downloadImage was not called
      expect(imageService.downloadImage).not.toHaveBeenCalled();
    }));
  });

  // Helper function to create multiple image pairs for testing
  function createMultipleImagePairs(count: number) {
    const pairs = [];
    for (let i = 0; i < count; i++) {
      pairs.push({
        originalImage: {
          id: `original_${i}`,
          url: `url_original_${i}`,
          name: `original_${i}`,
          parentId: undefined,
          parentUrl: undefined,
          width: 100,
          height: 100,
          appliedFilters: [],
          loaded: false,
        } as ImageModel,
        filteredImage: {
          id: `filtered_${i}`,
          url: `url_filtered_${i}`,
          name: `filtered_${i}`,
          parentId: `original_${i}`,
          parentUrl: `url_original_${i}`,
          width: 100,
          height: 100,
          appliedFilters: ['grayscale'],
          loaded: false,
        } as ImageModel,
      });
    }
    return pairs;
  }

  // Test cleanup of subscriptions on destroy
  it('should unsubscribe from all subscriptions on ngOnDestroy', () => {
    // Create a mock subscription
    const mockSubscription = jasmine.createSpyObj('Subscription', [
      'unsubscribe',
    ]);
    (component as any).subscriptions = [mockSubscription, mockSubscription];

    // Call ngOnDestroy
    component.ngOnDestroy();

    // Verify all subscriptions were unsubscribed
    expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(2);
  });
});
