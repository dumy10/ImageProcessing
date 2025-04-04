import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ImageModel } from '../models/ImageModel';
import { TreeNode } from '../models/tree';
import { ErrorHandlingService } from '../services/error-handling.service';
import { ImageService } from '../services/image.service';
import { ImageTreeViewComponent } from './image-tree-view.component';

describe('ImageTreeViewComponent', () => {
  let component: ImageTreeViewComponent;
  let fixture: ComponentFixture<ImageTreeViewComponent>;
  let imageService: jasmine.SpyObj<ImageService>;
  let errorHandlingService: jasmine.SpyObj<ErrorHandlingService>;
  let router: jasmine.SpyObj<Router>;
  let mockActivatedRoute: any;

  // Sample image data for testing
  const mockImages: ImageModel[] = [
    {
      id: 'original1',
      url: 'url-original1',
      name: 'Original Image 1',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    },
    {
      id: 'filtered1',
      url: 'url-filtered1',
      name: 'Filtered Image 1',
      parentId: 'original1',
      parentUrl: 'url-original1',
      width: 100,
      height: 100,
      appliedFilters: ['grayscale'],
      loaded: true,
    },
    {
      id: 'filtered2',
      url: 'url-filtered2',
      name: 'Filtered Image 2',
      parentId: 'original1',
      parentUrl: 'url-original1',
      width: 100,
      height: 100,
      appliedFilters: ['blur'],
      loaded: true,
    },
    {
      id: 'filtered3',
      url: 'url-filtered3',
      name: 'Filtered Image 3',
      parentId: 'filtered1',
      parentUrl: 'url-filtered1',
      width: 100,
      height: 100,
      appliedFilters: ['grayscale', 'invert'],
      loaded: true,
    },
  ];

  beforeEach(async () => {
    // Create spy objects
    const imageSpy = jasmine.createSpyObj('ImageService', ['getImages']);
    const errorSpy = jasmine.createSpyObj('ErrorHandlingService', [
      'getReadableErrorMessage',
      'showErrorWithRetry',
      'getErrorMessageByStatus',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    // Mock ActivatedRoute
    mockActivatedRoute = {
      paramMap: of(convertToParamMap({ id: 'filtered3' })),
      queryParams: of({ page: '2', pageSize: '8' }),
    };

    await TestBed.configureTestingModule({
      imports: [ImageTreeViewComponent],
      providers: [
        { provide: ImageService, useValue: imageSpy },
        { provide: ErrorHandlingService, useValue: errorSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        provideHttpClient(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageTreeViewComponent);
    component = fixture.componentInstance;
    imageService = TestBed.inject(ImageService) as jasmine.SpyObj<ImageService>;
    errorHandlingService = TestBed.inject(
      ErrorHandlingService
    ) as jasmine.SpyObj<ErrorHandlingService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default return values for services
    imageService.getImages.and.returnValue(of(mockImages));
    errorHandlingService.getReadableErrorMessage.and.returnValue(
      'Error message'
    );

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load image data and build tree on init', () => {
    spyOn(component, 'loadImageData').and.callThrough();

    component.ngOnInit();

    expect(component.loadImageData).toHaveBeenCalled();
    expect(imageService.getImages).toHaveBeenCalled();
    expect(component.imageId).toEqual('filtered3');
    expect(component.cachedPage).toEqual(2);
    expect(component.cachedPageSize).toEqual(8);
    expect(component.loading).toBeFalse();
  });

  it('should handle empty image ID', () => {
    mockActivatedRoute.paramMap = of(convertToParamMap({}));
    spyOn(component as any, 'handleError');

    component.ngOnInit();

    expect((component as any).handleError).toHaveBeenCalledWith(
      'No image ID provided'
    );
  });

  it('should build image tree correctly', () => {
    // Find the filtered3 image from our mock data
    const testImage = mockImages.find(
      (img) => img.id === 'filtered3'
    ) as ImageModel;

    // Build tree for this image
    const tree = component.buildImageTree(testImage);

    // Verify tree structure
    expect(tree.root).toBeTruthy();
    expect(tree.root?.value.id).toBe('original1');

    // Root should have two children (filtered1 and filtered2)
    expect(tree.root?.children.length).toBe(2);

    // Find filtered1 node and check it has filtered3 as child
    const filtered1Node = tree.root?.children.find(
      (child) => child.value.id === 'filtered1'
    );
    expect(filtered1Node).toBeTruthy();
    expect(filtered1Node?.children.length).toBe(1);
    expect(filtered1Node?.children[0].value.id).toBe('filtered3');
  });

  it('should get original image correctly', () => {
    // Setup image pairs
    component.imagePairs = [
      {
        originalImage: mockImages[0], // original1
        filteredImage: mockImages[1], // filtered1
      },
      {
        originalImage: mockImages[1], // filtered1
        filteredImage: mockImages[3], // filtered3
      },
    ];

    // Get original for filtered3
    const originalImage = component.getOriginalImage(mockImages[3]);

    // Should return the root original image
    expect(originalImage.id).toBe('original1');
  });

  it('should calculate tree depth correctly', () => {
    // Create a tree with 3 levels
    const root = new TreeNode<ImageModel>(mockImages[0]);
    const child1 = new TreeNode<ImageModel>(mockImages[1]);
    const child2 = new TreeNode<ImageModel>(mockImages[2]);
    const grandChild = new TreeNode<ImageModel>(mockImages[3]);

    root.addChild(child1);
    root.addChild(child2);
    child1.addChild(grandChild);

    const depth = component.calculateTreeDepth(root);
    expect(depth).toBe(3);
  });

  it('should calculate max children count correctly', () => {
    // Create a tree where root has 2 children, one child has 1 child
    const root = new TreeNode<ImageModel>(mockImages[0]);
    const child1 = new TreeNode<ImageModel>(mockImages[1]);
    const child2 = new TreeNode<ImageModel>(mockImages[2]);
    const grandChild = new TreeNode<ImageModel>(mockImages[3]);

    root.addChild(child1);
    root.addChild(child2);
    child1.addChild(grandChild);

    const maxCount = component.calculateMaxChildrenCount(root);
    expect(maxCount).toBe(2); // Root has 2 children
  });

  it('should show more vertical levels', () => {
    component.maxLevel = 5;
    component.displayLevel = 2;

    component.showMoreLevels();

    expect(component.displayLevel).toBe(3);
  });

  it('should not increase displayLevel beyond maxLevel', () => {
    component.maxLevel = 3;
    component.displayLevel = 3;

    component.showMoreLevels();

    expect(component.displayLevel).toBe(3);
  });

  it('should show less vertical levels', () => {
    component.displayLevel = 3;

    component.showLessLevels();

    expect(component.displayLevel).toBe(2);
  });

  it('should not decrease displayLevel below 1', () => {
    component.displayLevel = 1;

    component.showLessLevels();

    expect(component.displayLevel).toBe(1);
  });

  it('should show more horizontal images', () => {
    component.maxHorizontalCount = 5;
    component.horizontalDisplayCount = 1;

    component.showMoreHorizontalImages();

    expect(component.horizontalDisplayCount).toBe(3);
  });

  it('should show less horizontal images', () => {
    component.horizontalDisplayCount = 5;

    component.showLessHorizontalImages();

    expect(component.horizontalDisplayCount).toBe(3);
  });

  it('should not decrease horizontalDisplayCount below 1', () => {
    component.horizontalDisplayCount = 1;

    component.showLessHorizontalImages();

    expect(component.horizontalDisplayCount).toBe(1);
  });

  it('should navigate back to gallery with cached pagination', () => {
    component.cachedPage = 3;
    component.cachedPageSize = 12;

    component.navigateBack();

    expect(router.navigate).toHaveBeenCalledWith(['/gallery'], {
      queryParams: {
        page: 3,
        pageSize: 12,
      },
    });
  });

  it('should handle error when fetching images fails', () => {
    const errorResponse = new HttpErrorResponse({
      error: 'test 404 error',
      status: 404,
      statusText: 'Not Found',
    });

    imageService.getImages.and.returnValue(throwError(() => errorResponse));
    spyOn(component as any, 'handleError');

    component.loadImageData();

    expect((component as any).handleError).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('should handle error when image is not found', () => {
    // Set image ID to one that doesn't exist in our data
    component.imageId = 'non-existent-id';
    spyOn(component as any, 'handleError');

    component.loadImageData();

    expect((component as any).handleError).toHaveBeenCalledWith(
      'Image with ID non-existent-id not found'
    );
  });

  it('should handle error when no filtered images are found', () => {
    // Return empty array from image service
    imageService.getImages.and.returnValue(of([]));
    spyOn(component as any, 'handleError');

    component.loadImageData();

    expect((component as any).handleError).toHaveBeenCalledWith(
      'No filtered images found'
    );
  });

  it('should clean up subscriptions on destroy', () => {
    // Create a mock subscription
    const mockSubscription = jasmine.createSpyObj('Subscription', [
      'unsubscribe',
    ]);
    (component as any).subscriptions = [mockSubscription, mockSubscription];

    component.ngOnDestroy();

    expect(mockSubscription.unsubscribe).toHaveBeenCalledTimes(2);
  });

  it('should set error state and actions when handling error', () => {
    // Access the private method using type assertion
    (component as any).handleError('Test error message');

    expect(component.errorState).toBeTrue();
    expect(component.errorMessage).toBe('Test error message');
    expect(component.errorActions.length).toBe(2);
    expect(component.errorActions[0].label).toBe('Back to Gallery');
    expect(component.errorActions[1].label).toBe('Retry');
  });
});
