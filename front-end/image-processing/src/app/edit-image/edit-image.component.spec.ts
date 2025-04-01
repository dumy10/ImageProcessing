import {
  HttpErrorResponse,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { NavigationEnd, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ImageModel } from '../models/ImageModel';
import { Filters } from '../models/filters';
import { ErrorHandlingService } from '../services/error-handling.service';
import { ImageService } from '../services/image.service';
import { EditImageComponent } from './edit-image.component';

describe('EditImageComponent', () => {
  let component: EditImageComponent;
  let fixture: ComponentFixture<EditImageComponent>;
  let imageService: jasmine.SpyObj<ImageService>;
  let errorHandlingService: jasmine.SpyObj<ErrorHandlingService>;
  let router: jasmine.SpyObj<Router>;
  let routerEventsSubject: Subject<any>;

  beforeEach(async () => {
    const imageServiceSpy = jasmine.createSpyObj('ImageService', [
      'getImage',
      'editImage',
      'downloadImage',
    ]);

    const errorHandlingServiceSpy = jasmine.createSpyObj(
      'ErrorHandlingService',
      [
        'showErrorWithRetry',
        'showErrorWithActions',
        'getReadableErrorMessage',
        'getErrorMessageByStatus',
      ]
    );

    // Create a subject to simulate router events
    routerEventsSubject = new Subject();

    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      events: routerEventsSubject.asObservable(),
    });

    await TestBed.configureTestingModule({
      imports: [EditImageComponent],
      providers: [
        { provide: ImageService, useValue: imageServiceSpy },
        { provide: ErrorHandlingService, useValue: errorHandlingServiceSpy },
        { provide: Router, useValue: routerSpy },
        provideHttpClientTesting(),
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditImageComponent);
    component = fixture.componentInstance;
    imageService = TestBed.inject(ImageService) as jasmine.SpyObj<ImageService>;
    errorHandlingService = TestBed.inject(
      ErrorHandlingService
    ) as jasmine.SpyObj<ErrorHandlingService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    imageService.getImage.and.returnValue(of({} as ImageModel));
    imageService.editImage.and.returnValue(of({} as ImageModel));
    imageService.downloadImage.and.returnValue(of(new Blob()));

    errorHandlingService.getReadableErrorMessage.and.returnValue(
      'Test error message'
    );
    errorHandlingService.getErrorMessageByStatus.and.returnValue(
      'Server error while processing filter'
    );
    errorHandlingService.showErrorWithRetry.and.returnValue();
    errorHandlingService.showErrorWithActions.and.returnValue();

    // Mock the getIdFromUrl method to return a test ID
    spyOn(component, 'getIdFromUrl').and.returnValue('1');

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load image on init', () => {
    const mockImage: ImageModel = {
      id: '1',
      name: 'Test Image',
      url: 'http://example.com/image.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };
    imageService.getImage.and.returnValue(of(mockImage));

    component.ngOnInit();

    // Force the subscription callback to execute
    imageService.getImage.calls
      .mostRecent()
      .returnValue.subscribe((response: any) => {
        expect(component.image).toEqual(mockImage);
        expect(component.imagePath).toBe(mockImage.url);
        expect(component.loading).toBeFalse();
      });
  });

  it('should apply filter to image', () => {
    const mockImage: ImageModel = {
      id: '1',
      name: 'Test Image',
      url: 'http://example.com/image.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };
    imageService.editImage.and.returnValue(of(mockImage));

    component.image = mockImage;
    component.filterImage(Filters.GrayScale);
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component.image).toEqual(mockImage);
    expect(component.imagePath).toBe(mockImage.url);
  });

  it('should handle filter application error', () => {
    const error = new HttpErrorResponse({
      error: 'Failed to edit image',
      status: 500,
      statusText: 'Internal Server Error',
    });
    imageService.editImage.and.returnValue(throwError(() => error));

    component.image = {
      id: '1',
      name: 'Test Image',
      url: '',
      parentId: undefined,
      parentUrl: undefined,
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };

    component.filterImage(Filters.GrayScale);
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component['errorState']).toBeTrue();
    expect(errorHandlingService.getErrorMessageByStatus).toHaveBeenCalledWith(
      error,
      'grayscale filter'
    );
    expect(errorHandlingService.showErrorWithActions).toHaveBeenCalled();
  });

  it('should dismiss error when dismissError is called', () => {
    // Set up error state
    component['errorState'] = true;
    component['errorMessage'] = 'Test error message';

    // Call dismiss error
    component.dismissError();

    // Verify error was dismissed
    expect(component['errorState']).toBeFalse();
    expect(component['errorMessage']).toBe('');
  });

  it('should handle different HTTP error status codes appropriately', () => {
    // Test different error status codes
    const errorCases = [
      { status: 400, expectedContext: 'grayscale filter' },
      { status: 404, expectedContext: 'grayscale filter' },
      { status: 413, expectedContext: 'grayscale filter' },
      { status: 429, expectedContext: 'grayscale filter' },
      { status: 0, expectedContext: 'grayscale filter' },
      { status: 500, expectedContext: 'grayscale filter' },
    ];

    errorCases.forEach((testCase) => {
      const error = new HttpErrorResponse({
        error: 'Test error',
        status: testCase.status,
      });

      // Reset spy between test cases
      errorHandlingService.getErrorMessageByStatus.calls.reset();
      errorHandlingService.showErrorWithActions.calls.reset();

      // Call the method directly
      component['handleFilterError'](error, Filters.GrayScale);

      expect(errorHandlingService.getErrorMessageByStatus).toHaveBeenCalledWith(
        error,
        testCase.expectedContext
      );
      expect(errorHandlingService.showErrorWithActions).toHaveBeenCalled();
    });
  });

  it('should download image', () => {
    component.image = {
      id: '1',
      name: 'Test Image',
      url: 'test-url',
      parentId: undefined,
      parentUrl: undefined,
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };

    imageService.downloadImage.and.returnValue(of(new Blob()));
    spyOn(window.URL, 'createObjectURL').and.returnValue('blob-url');
    const anchor = document.createElement('a');
    spyOn(document, 'createElement').and.returnValue(anchor);
    spyOn(anchor, 'click');

    component.downloadImage();

    expect(imageService.downloadImage).toHaveBeenCalled();
    expect(window.URL.createObjectURL).toHaveBeenCalled();
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(anchor.href).toContain('blob-url');
    expect(anchor.download).toBe('Test Image');
    expect(anchor.click).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('should handle image download error', () => {
    const error = new HttpErrorResponse({
      error: 'Failed to download image',
      status: 500,
    });
    imageService.downloadImage.and.returnValue(throwError(() => error));

    component.image = {
      id: '1',
      name: 'Test Image',
      url: '',
      parentId: undefined,
      parentUrl: undefined,
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };

    component.downloadImage();
    fixture.detectChanges();

    expect(component.loading).toBeFalse();
    expect(component['errorState']).toBeTrue();
    expect(component['errorMessage']).toContain('Failed to download image');
    expect(errorHandlingService.showErrorWithRetry).toHaveBeenCalled();
  });

  it('should undo last filter', () => {
    const mockImage: ImageModel = {
      id: '1',
      name: 'Test Image',
      url: 'http://example.com/image.jpg',
      parentId: '0',
      parentUrl: 'http://example.com/parent.jpg',
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };
    const parentImage: ImageModel = {
      id: '0',
      name: 'Parent Image',
      url: 'http://example.com/parent.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };
    imageService.getImage.and.returnValue(of(parentImage));

    component.image = mockImage;
    component.undoFilter();
    fixture.detectChanges();

    expect(component.image).toEqual(parentImage);
    expect(component.imagePath).toBe(parentImage.url);
  });

  it('should handle undo filter error', () => {
    const error = new HttpErrorResponse({
      error: 'Failed to fetch image',
      status: 404,
    });
    imageService.getImage.and.returnValue(throwError(() => error));

    component.image = {
      id: '1',
      name: 'Test Image',
      url: '',
      parentId: '0',
      parentUrl: '',
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };

    component.undoFilter();
    fixture.detectChanges();

    expect(component.image).toBeDefined();
    expect(component['errorState']).toBeTrue();
    expect(errorHandlingService.getErrorMessageByStatus).toHaveBeenCalledWith(
      error,
      'image'
    );
    expect(errorHandlingService.showErrorWithRetry).toHaveBeenCalled();
  });

  it('should restore last successful state when recovery is needed', () => {
    const originalImage: ImageModel = {
      id: '1',
      name: 'Original Image',
      url: 'original-url',
      parentId: undefined,
      parentUrl: undefined,
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };

    // Set up the component with a last successful operation
    component.image = {
      id: '2',
      name: 'Filtered Image',
      url: 'filtered-url',
      parentId: '1',
      parentUrl: 'original-url',
      width: 800,
      height: 600,
      appliedFilters: ['grayscale'],
      loaded: true,
    };
    component['lastSuccessfulOperation'] = originalImage;
    component['errorState'] = true;
    component['errorMessage'] = 'Test error that should be cleared';

    // Call the restore method
    component.restoreLastSuccessfulState();

    // Verify the image was restored and error state cleared
    expect(component.image).toEqual(originalImage);
    expect(component.imagePath).toBe('original-url');
    expect(component['errorState']).toBeFalse();
    expect(component['errorMessage']).toBe('');
  });

  it('should react to navigation events', () => {
    const mockImage: ImageModel = {
      id: '2',
      name: 'Test Image',
      url: 'http://example.com/image2.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };

    // First setup component with image
    component.image = {
      id: '1',
      name: 'Initial Image',
      url: 'initial-url',
      parentId: undefined,
      parentUrl: undefined,
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };

    // Set up mock for new ID
    (component.getIdFromUrl as jasmine.Spy).and.returnValue('2');
    imageService.getImage.and.returnValue(of(mockImage));

    // Trigger navigation event
    routerEventsSubject.next(new NavigationEnd(1, '/edit/2', '/edit/2'));

    // Verify loadImage was called with the new ID
    expect(imageService.getImage).toHaveBeenCalledWith('2');
  });

  it('should show error when undoing with no edits', () => {
    component.image = {
      id: '1',
      name: 'Test Image',
      url: 'test-url',
      parentId: undefined, // No parent ID means no previous state
      parentUrl: undefined,
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };

    component.undoFilter();

    expect(errorHandlingService.showErrorWithRetry).toHaveBeenCalledWith(
      'Cannot undo',
      "The image hasn't been edited yet",
      jasmine.any(Function)
    );
  });
});
