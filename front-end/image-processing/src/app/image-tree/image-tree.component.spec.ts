import { CommonModule } from '@angular/common';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoadingComponent } from '../loading/loading.component';
import { ImageModel } from '../models/ImageModel';
import { TreeNode } from '../models/tree';
import { ErrorHandlingService } from '../services/error-handling.service';
import { ImageService } from '../services/image.service';
import { ErrorBannerComponent } from '../shared/error-banner/error-banner.component';
import { ImageTreeComponent } from './image-tree.component';

describe('ImageTreeComponent', () => {
  let component: ImageTreeComponent;
  let fixture: ComponentFixture<ImageTreeComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<any>>;
  let imageServiceSpy: jasmine.SpyObj<ImageService>;
  let errorHandlingSpy: jasmine.SpyObj<ErrorHandlingService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let httpTestingController: HttpTestingController;

  beforeEach(async () => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    imageServiceSpy = jasmine.createSpyObj('ImageService', ['downloadImage']);
    errorHandlingSpy = jasmine.createSpyObj('ErrorHandlingService', [
      'getReadableErrorMessage',
      'showErrorWithRetry',
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    dialogRefSpy.afterClosed.and.returnValue(of(true));
    dialogSpy.open.and.returnValue(dialogRefSpy);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        MatProgressSpinnerModule,
        MatIconModule,
        NoopAnimationsModule,
        ErrorBannerComponent,
        LoadingComponent,
      ],
      providers: [
        { provide: MatDialog, useValue: dialogSpy },
        { provide: ImageService, useValue: imageServiceSpy },
        { provide: ErrorHandlingService, useValue: errorHandlingSpy },
        { provide: Router, useValue: routerSpy },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageTreeComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);

    // Mock ElementRef for D3 container
    spyOn(component['el'].nativeElement, 'querySelector').and.returnValue({
      offsetWidth: 1200,
      offsetHeight: 800,
    });

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with null node', () => {
    expect(component.node).toBeNull();
    expect(component.imagePairs).toEqual([]);
  });

  it('should open dialog with image hierarchy', () => {
    const image: ImageModel = {
      id: '1',
      name: 'Test Image',
      url: 'test.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };
    component.imagePairs = [{ originalImage: image, filteredImage: image }];
    component.openDialog(image);
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('should retrieve image hierarchy', () => {
    const image1: ImageModel = {
      id: '1',
      name: 'Test Image 1',
      url: 'test1.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };
    const image2: ImageModel = {
      id: '2',
      name: 'Test Image 2',
      url: 'test2.jpg',
      parentId: '1',
      parentUrl: 'test1.jpg',
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };
    component.imagePairs = [
      { originalImage: image1, filteredImage: image1 },
      { originalImage: image2, filteredImage: image2 },
    ];
    const hierarchy = component.getImageHierarchy(image2);
    expect(hierarchy).toEqual([image1, image2]);
  });

  it('should handle image error', () => {
    const image: ImageModel = {
      id: '1',
      name: 'Test Image',
      url: 'test.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };
    component.onImageError(image);
    expect(image.url).toBe('assets/images/notfound.jpg');
  });

  it('should handle deep image hierarchy with multiple levels', () => {
    const image1: ImageModel = {
      id: '1',
      name: 'Root Image',
      url: 'root.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    const image2: ImageModel = {
      id: '2',
      name: 'Level 1 Image',
      url: 'level1.jpg',
      parentId: '1',
      parentUrl: 'root.jpg',
      width: 100,
      height: 100,
      appliedFilters: ['Grayscale'],
      loaded: true,
    };

    const image3: ImageModel = {
      id: '3',
      name: 'Level 2 Image',
      url: 'level2.jpg',
      parentId: '2',
      parentUrl: 'level1.jpg',
      width: 100,
      height: 100,
      appliedFilters: ['Grayscale', 'Blur'],
      loaded: true,
    };

    component.imagePairs = [
      { originalImage: image1, filteredImage: image1 },
      { originalImage: image2, filteredImage: image2 },
      { originalImage: image3, filteredImage: image3 },
    ];

    const hierarchy = component.getImageHierarchy(image3);
    expect(hierarchy).toEqual([image1, image2, image3]);
    expect(hierarchy.length).toBe(3);
  });

  it('should handle missing parent in hierarchy', () => {
    const image1: ImageModel = {
      id: '1',
      name: 'Test Image 1',
      url: 'test1.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    const image2: ImageModel = {
      id: '2',
      name: 'Test Image 2',
      url: 'test2.jpg',
      parentId: '999', // Non-existent parent ID
      parentUrl: 'nonexistent.jpg',
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    component.imagePairs = [
      { originalImage: image1, filteredImage: image1 },
      { originalImage: image2, filteredImage: image2 },
    ];

    const hierarchy = component.getImageHierarchy(image2);
    expect(hierarchy).toEqual([image2]);
    expect(hierarchy.length).toBe(1);
  });

  it('should navigate to edit page when editImage is called', () => {
    const image: ImageModel = {
      id: '1',
      name: 'Test Image',
      url: 'test.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    component.editImage(image);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/edit', '1']);
  });

  it('should download image successfully', () => {
    const image: ImageModel = {
      id: '1',
      name: 'Test Image',
      url: 'test.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    // Mock the download response
    const mockBlob = new Blob(['test content'], { type: 'image/png' });
    imageServiceSpy.downloadImage.and.returnValue(of(mockBlob));

    // Mock createObjectURL
    spyOn(URL, 'createObjectURL').and.returnValue('blob:url');
    spyOn(URL, 'revokeObjectURL');

    // Mock document methods
    const mockAnchor = document.createElement('a');
    spyOn(document, 'createElement').and.returnValue(mockAnchor);
    spyOn(mockAnchor, 'click');
    spyOn(document.body, 'appendChild');
    spyOn(document.body, 'removeChild');

    // Call the download function
    component.downloadImage(image);

    // Expectations
    expect(component.loading).toBe(false);
    expect(imageServiceSpy.downloadImage).toHaveBeenCalledWith('1');
    expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(mockAnchor.download).toBe('Test Image');
    expect(mockAnchor.href).toBe('blob:url');
    expect(mockAnchor.click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:url');
  });

  it('should handle download error', () => {
    const image: ImageModel = {
      id: '1',
      name: 'Test Image',
      url: 'test.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    // Mock error response
    const errorResponse = new HttpErrorResponse({
      error: 'test error',
      status: 404,
      statusText: 'Not Found',
    });

    imageServiceSpy.downloadImage.and.returnValue(
      throwError(() => errorResponse)
    );
    errorHandlingSpy.getReadableErrorMessage.and.returnValue('Image not found');

    // Call the download function
    component.downloadImage(image);

    // Expectations
    expect(component.loading).toBe(false);
    expect(component.errorState).toBe(true);
    expect(errorHandlingSpy.showErrorWithRetry).toHaveBeenCalled();
    expect(component.errorActions.length).toBeGreaterThan(0);
  });

  it('should respect maxDepth parameter when transforming data', () => {
    // Create a deep tree structure
    const rootImage: ImageModel = {
      id: '1',
      name: 'Root',
      url: 'root.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    const level1Image: ImageModel = {
      id: '2',
      name: 'Level 1',
      url: 'level1.jpg',
      parentId: '1',
      parentUrl: 'root.jpg',
      width: 100,
      height: 100,
      appliedFilters: ['Filter1'],
      loaded: true,
    };

    const level2Image: ImageModel = {
      id: '3',
      name: 'Level 2',
      url: 'level2.jpg',
      parentId: '2',
      parentUrl: 'level1.jpg',
      width: 100,
      height: 100,
      appliedFilters: ['Filter2'],
      loaded: true,
    };

    // Create the tree nodes
    const level2Node = new TreeNode<ImageModel>(level2Image);
    const level1Node = new TreeNode<ImageModel>(level1Image);
    level1Node.children = [level2Node];
    const rootNode = new TreeNode<ImageModel>(rootImage);
    rootNode.children = [level1Node];

    // Set the node with maxDepth = 1
    component.node = rootNode;
    component.maxDepth = 1;

    // Access the private transformData method using any cast
    (component as any).transformData();

    // After transformation, check the D3 data structure
    // Level 2 nodes should not be included in the children array of level1
    expect((component as any).d3Data.data.children.length).toBe(1); // Level 1 node
    expect((component as any).d3Data.data.children[0].children.length).toBe(0); // No level 2 nodes
  });

  it('should properly determine if children should be displayed based on currentDepth and maxDepth', () => {
    // Test the shouldDisplayChildren method

    // Case 1: currentDepth < maxDepth
    component.currentDepth = 1;
    component.maxDepth = 2;
    expect(component.shouldDisplayChildren()).toBeTrue();

    // Case 2: currentDepth = maxDepth
    component.currentDepth = 2;
    component.maxDepth = 2;
    expect(component.shouldDisplayChildren()).toBeFalse();

    // Case 3: currentDepth > maxDepth
    component.currentDepth = 3;
    component.maxDepth = 2;
    expect(component.shouldDisplayChildren()).toBeFalse();
  });

  it('should clean up subscriptions on component destruction', () => {
    const subscription = jasmine.createSpyObj('Subscription', ['unsubscribe']);
    (component as any).subscriptions = [subscription];

    component.ngOnDestroy();
    expect(subscription.unsubscribe).toHaveBeenCalled();
  });
});
