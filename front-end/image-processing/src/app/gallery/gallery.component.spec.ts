import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogModule } from '@angular/material/dialog';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ImageHierarchyComponent } from '../image-hierarchy/image-hierarchy.component';
import { ImageModel } from '../models/ImageModel';
import { CacheService } from '../services/cache.service';
import { ErrorHandlingService } from '../services/error-handling.service';
import { ImageService } from '../services/image.service';
import { GalleryComponent } from './gallery.component';

describe('GalleryComponent', () => {
  let component: GalleryComponent;
  let fixture: ComponentFixture<GalleryComponent>;
  let imageService: ImageService;
  let errorHandlingService: jasmine.SpyObj<ErrorHandlingService>;

  beforeEach(async () => {
    // Create spy objects for ErrorHandlingService and MatSnackBar
    const errorHandlingSpy = jasmine.createSpyObj('ErrorHandlingService', [
      'showErrorWithRetry',
      'showErrorWithActions',
      'getReadableErrorMessage',
      'getErrorMessageByStatus',
    ]);

    await TestBed.configureTestingModule({
      imports: [GalleryComponent, MatDialogModule, RouterModule.forRoot([])],
      providers: [
        ImageService,
        CacheService,
        { provide: ErrorHandlingService, useValue: errorHandlingSpy },
        provideHttpClientTesting(),
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GalleryComponent);
    component = fixture.componentInstance;
    imageService = TestBed.inject(ImageService);
    errorHandlingService = TestBed.inject(
      ErrorHandlingService
    ) as jasmine.SpyObj<ErrorHandlingService>;

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

    component.loadImages();

    expect(component.imagePairs.length).toBe(1);
    expect(component.paginatedImagePairs.length).toBe(1);
    expect(component.loading).toBeFalse();
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

    component.onPageChange({ pageIndex: 1, pageSize: 10 });

    expect(component.currentPage).toBe(1);
    expect(component.itemsPerPage).toBe(10);
    expect(component.updatePagination).toHaveBeenCalled();
    expect(window.scrollTo as any).toHaveBeenCalledWith(
      jasmine.objectContaining({ top: 0, behavior: 'smooth' })
    );
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

  it('should build image hierarchy correctly', () => {
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

    const hierarchy = component.getImageHierarchy(image);

    expect(hierarchy.length).toBe(2);
    expect(hierarchy[0].id).toBe('1');
    expect(hierarchy[1].id).toBe('2');
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
          appliedFilters: ['grayscale'],
          loaded: false,
        },
      },
    ];

    component.openDialog(image);

    expect(dialogSpy).toHaveBeenCalledWith(ImageHierarchyComponent, {
      data: jasmine.any(Array),
    });
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
    expect(component.itemsPerPage).toBe(8);
  });

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

  // Test for new viewImageTree method
  it('should navigate to image tree view', () => {
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

    component.currentPage = 2;
    component.itemsPerPage = 8;
    component.viewImageTree(image);

    expect(routerSpy).toHaveBeenCalledWith(['/image-tree', '1'], {
      queryParams: {
        page: 2,
        pageSize: 8,
      },
    });
  });
});
