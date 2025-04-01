import {
  HttpErrorResponse,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
} from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ErrorHandlingService } from '../services/error-handling.service';
import { ImageService } from '../services/image.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let imageService: jasmine.SpyObj<ImageService>;
  let errorHandlingService: jasmine.SpyObj<ErrorHandlingService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const imageServiceSpy = jasmine.createSpyObj('ImageService', [
      'uploadImage',
    ]);
    const errorHandlingSpy = jasmine.createSpyObj('ErrorHandlingService', [
      'showErrorWithRetry',
      'showErrorWithActions',
      'getReadableErrorMessage',
      'getErrorMessageByStatus',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        { provide: ImageService, useValue: imageServiceSpy },
        { provide: ErrorHandlingService, useValue: errorHandlingSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    imageService = TestBed.inject(ImageService) as jasmine.SpyObj<ImageService>;
    errorHandlingService = TestBed.inject(
      ErrorHandlingService
    ) as jasmine.SpyObj<ErrorHandlingService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Set up default return values
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

  it('should handle drag over event', () => {
    // Create a mock dropzone element
    const dropzone = document.createElement('div');
    dropzone.classList.add('inner-box', 'dropzone');
    document.body.appendChild(dropzone);

    // Mock querySelector to return our dropzone
    spyOn(document, 'querySelector').and.returnValue(dropzone);

    const event = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });

    spyOn(event, 'preventDefault');
    spyOn(event, 'stopPropagation');

    component.onDragOver(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(event.stopPropagation).toHaveBeenCalled();
    expect(document.querySelector).toHaveBeenCalledWith('.inner-box.dropzone');
    expect(dropzone.classList.contains('dragging')).toBeTrue();

    // Clean up
    document.body.removeChild(dropzone);
  });

  it('should handle drag leave event', () => {
    const dropzone = document.createElement('div');
    const event = new DragEvent('dragleave', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: dropzone });
    component.onDragLeave(event);
    if (event.target) {
      expect(dropzone.classList.contains('dragging')).toBeFalse();
    }
  });

  it('should handle drop event', () => {
    const event = new DragEvent('drop');
    const dropzone = document.createElement('div');
    const file = new File([''], 'test.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
    Object.defineProperty(event, 'target', { value: dropzone });
    spyOn(event, 'preventDefault');
    spyOn(component, 'handleFiles');
    component.onDrop(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.handleFiles).toHaveBeenCalledWith(dataTransfer.files);
  });

  it('should handle drop event with multiple files', () => {
    const event = new DragEvent('drop');
    const dropzone = document.createElement('div');
    const file1 = new File([''], 'test1.png', { type: 'image/png' });
    const file2 = new File([''], 'test2.png', { type: 'image/png' });
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file1);
    dataTransfer.items.add(file2);
    Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
    Object.defineProperty(event, 'target', { value: dropzone });
    spyOn(event, 'preventDefault');
    spyOn(console, 'error');
    component.onDrop(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'Invalid file count. Only one file is allowed.'
    );
    expect(component.errorState).toBeTrue();
    expect(component.errorMessage).toBe(
      'Invalid file count. Only one file is allowed.'
    );
    expect(component.errorActions.length).toBeGreaterThan(0);
  });

  it('should handle invalid file type', () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [file] } };
    spyOn(console, 'error');
    component.onImageSelected(event);
    expect(console.error).toHaveBeenCalledWith(
      'Please upload a valid image file (JPEG, JPG, PNG).'
    );
    expect(component.errorState).toBeTrue();
    expect(component.errorMessage).toBe(
      'Please upload a valid image file (JPEG, JPG, PNG).'
    );
  });

  it('should handle empty file list', () => {
    const event = new DragEvent('drop');
    const dropzone = document.createElement('div');
    const dataTransfer = new DataTransfer();
    Object.defineProperty(event, 'dataTransfer', { value: dataTransfer });
    Object.defineProperty(event, 'target', { value: dropzone });
    spyOn(event, 'preventDefault');
    spyOn(component, 'handleFiles');
    component.onDrop(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.handleFiles).not.toHaveBeenCalled();
  });

  it('should handle image selection', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const event = { target: { files: [file] } };
    spyOn(component, 'handleFiles');
    component.onImageSelected(event);
    expect(component.handleFiles).toHaveBeenCalledWith([file]);
  });

  it('should upload image successfully', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const response = { id: '123' } as any;
    imageService.uploadImage.and.returnValue(of(response));
    component.uploadImage(file);
    expect(component.loading).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/edit', response.id]);
  });

  it('should handle upload image error', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const errorResponse = new HttpErrorResponse({
      error: 'Error uploading image',
      status: 500,
    });
    imageService.uploadImage.and.returnValue(throwError(() => errorResponse));
    spyOn(console, 'error');

    component.uploadImage(file);

    expect(component.loading).toBeFalse();
    expect(component.errorState).toBeTrue();
    expect(errorHandlingService.getErrorMessageByStatus).toHaveBeenCalledWith(
      errorResponse,
      'image upload'
    );
    expect(errorHandlingService.showErrorWithRetry).toHaveBeenCalled();
  });

  it('should dismiss error when dismissError is called', () => {
    component.errorState = true;
    component.errorMessage = 'Test error';
    component.errorActions = [{ label: 'Test', action: () => {} }];

    component.dismissError();

    expect(component.errorState).toBeFalse();
    expect(component.errorMessage).toBe('');
    expect(component.errorActions.length).toBe(0);
  });

  it('should reset loading state after file upload completes', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const response = { id: '123' } as any;
    imageService.uploadImage.and.returnValue(of(response));
    component.uploadImage(file);
    expect(component.loading).toBeFalse();
  });

  describe('Image Validation', () => {
    beforeEach(() => {
      spyOn(console, 'error');
    });

    it('should reject files larger than MAX_FILE_SIZE', async () => {
      // Create a mock file with size exceeding the limit
      const largeFile = new File([''], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 11 * 1024 * 1024 }); // 11MB

      await component.handleFiles([largeFile]);

      expect(console.error).toHaveBeenCalled();
      expect(component.errorState).toBeTrue();
      expect(component.loading).toBeFalse();
      expect(imageService.uploadImage).not.toHaveBeenCalled();
    });

    it('should reject files with invalid MIME types', async () => {
      // Create a mock file with invalid MIME type
      const invalidTypeFile = new File([''], 'document.pdf', {
        type: 'application/pdf',
      });

      await component.handleFiles([invalidTypeFile]);

      expect(console.error).toHaveBeenCalledWith(
        'Please upload a valid image file (JPEG, JPG, PNG).'
      );
      expect(component.errorState).toBeTrue();
      expect(component.errorMessage).toBe(
        'Please upload a valid image file (JPEG, JPG, PNG).'
      );
      expect(component.loading).toBeFalse();
      expect(imageService.uploadImage).not.toHaveBeenCalled();
    });

    it('should reject files with invalid image signatures', async () => {
      // Create a spy for the validateFileSignature method
      const validateSpy = spyOn<any>(
        component,
        'validateFileSignature'
      ).and.returnValue(Promise.resolve(false));

      // Create a mock image file
      const file = new File([''], 'fake.jpg', { type: 'image/jpeg' });

      await component.handleFiles([file]);

      expect(validateSpy).toHaveBeenCalledWith(file);
      expect(console.error).toHaveBeenCalled();
      expect(component.errorState).toBeTrue();
      expect(component.loading).toBeFalse();
      expect(imageService.uploadImage).not.toHaveBeenCalled();
    });

    it('should reject files that fail image content validation', async () => {
      // Create spies for the validation methods
      spyOn<any>(component, 'validateFileSignature').and.returnValue(
        Promise.resolve(true)
      );
      spyOn<any>(component, 'validateImageContent').and.returnValue(
        Promise.resolve(false)
      );

      // Create a mock image file
      const file = new File([''], 'image.jpg', { type: 'image/jpeg' });

      await component.handleFiles([file]);

      expect(component.loading).toBeFalse();
      expect(imageService.uploadImage).not.toHaveBeenCalled();
    });

    it('should accept and upload valid image files', async () => {
      // Create spies for the validation methods
      spyOn<any>(component, 'validateFileSignature').and.returnValue(
        Promise.resolve(true)
      );
      spyOn<any>(component, 'validateImageContent').and.returnValue(
        Promise.resolve(true)
      );

      imageService.uploadImage.and.returnValue(of({ id: '123' } as any));

      // Create a mock valid image file
      const validFile = new File([''], 'valid.jpg', { type: 'image/jpeg' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB

      await component.handleFiles([validFile]);

      expect(component.loading).toBeFalse(); // Loading will be done after upload completes
      expect(imageService.uploadImage).toHaveBeenCalledWith(validFile);
      expect(router.navigate).toHaveBeenCalledWith(['/edit', '123']);
    });

    it('should handle errors during image validation', async () => {
      // Create a spy for validateFileSignature that throws an error
      spyOn<any>(component, 'validateFileSignature').and.throwError(
        'Test error'
      );

      // Create a mock image file
      const file = new File([''], 'image.jpg', { type: 'image/jpeg' });

      await component.handleFiles([file]);

      expect(console.error).toHaveBeenCalledWith(
        'There was an unexpected error. Please try another file.',
        jasmine.any(Error)
      );
      expect(component.errorState).toBeTrue();
      expect(component.loading).toBeFalse();
      expect(imageService.uploadImage).not.toHaveBeenCalled();
    });
  });

  describe('File Signature Validation', () => {
    it('should detect valid JPEG signature', fakeAsync(() => {
      // Create a JPEG file with correct signature
      const fileContent = new Uint8Array([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
      ]);
      const jpegFile = new File([fileContent], 'test.jpg', {
        type: 'image/jpeg',
      });

      // Create the FileReader mock
      spyOn(window, 'FileReader').and.returnValue({
        readAsArrayBuffer: function () {
          setTimeout(() => {
            this.onload({ target: { result: fileContent.buffer } });
          }, 0);
        },
      } as any);

      let result: boolean | undefined;
      (component as any)
        .validateFileSignature(jpegFile)
        .then((valid: boolean) => {
          result = valid;
        });

      tick();

      expect(result).toBeTrue();
    }));

    it('should detect valid PNG signature', fakeAsync(() => {
      // Create a PNG file with correct signature
      const fileContent = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const pngFile = new File([fileContent], 'test.png', {
        type: 'image/png',
      });

      // Create the FileReader mock
      spyOn(window, 'FileReader').and.returnValue({
        readAsArrayBuffer: function () {
          setTimeout(() => {
            this.onload({ target: { result: fileContent.buffer } });
          }, 0);
        },
      } as any);

      let result: boolean | undefined;
      (component as any)
        .validateFileSignature(pngFile)
        .then((valid: boolean) => {
          result = valid;
        });

      tick();

      expect(result).toBeTrue();
    }));

    it('should reject invalid image signatures', fakeAsync(() => {
      // Create a file with invalid signature
      const fileContent = new Uint8Array([
        0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x35,
      ]); // PDF signature
      const invalidFile = new File([fileContent], 'test.pdf', {
        type: 'image/jpeg',
      });

      // Create the FileReader mock
      spyOn(window, 'FileReader').and.returnValue({
        readAsArrayBuffer: function () {
          setTimeout(() => {
            this.onload({ target: { result: fileContent.buffer } });
          }, 0);
        },
      } as any);

      let result: boolean | undefined;
      (component as any)
        .validateFileSignature(invalidFile)
        .then((valid: boolean) => {
          result = valid;
        });

      tick();

      expect(result).toBeFalse();
    }));
  });

  describe('Image Content Validation', () => {
    it('should validate images with proper dimensions', fakeAsync(() => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });

      // Mock FileReader
      spyOn(window, 'FileReader').and.returnValue({
        readAsDataURL: function () {
          setTimeout(() => {
            this.onload({ target: { result: 'data:image/jpeg;base64,test' } });
          }, 0);
        },
      } as any);

      // Mock Image
      spyOn(window, 'Image').and.returnValue({
        onload: null,
        onerror: null,
        set src(value: string) {
          setTimeout(() => {
            this.width = 800;
            this.height = 600;
            this.onload();
          }, 0);
        },
      } as any);

      let result: boolean | undefined;
      (component as any).validateImageContent(file).then((valid: boolean) => {
        result = valid;
      });

      tick();

      expect(result).toBeTrue();
    }));

    it('should reject images with excessive dimensions', fakeAsync(() => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      spyOn(console, 'error');

      // Mock FileReader
      spyOn(window, 'FileReader').and.returnValue({
        readAsDataURL: function () {
          setTimeout(() => {
            this.onload({ target: { result: 'data:image/jpeg;base64,test' } });
          }, 0);
        },
      } as any);

      // Mock Image with excessive dimensions
      spyOn(window, 'Image').and.returnValue({
        onload: null,
        onerror: null,
        set src(value: string) {
          setTimeout(() => {
            this.width = 10000;
            this.height = 10000;
            this.onload();
          }, 0);
        },
      } as any);

      let result: boolean | undefined;
      (component as any).validateImageContent(file).then((valid: boolean) => {
        result = valid;
      });

      tick();

      expect(result).toBeFalse();
      expect(console.error).toHaveBeenCalled();
      expect(component.errorState).toBeTrue();
    }));

    it('should reject files that cannot be loaded as images', fakeAsync(() => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      spyOn(console, 'error');

      // Mock FileReader
      spyOn(window, 'FileReader').and.returnValue({
        readAsDataURL: function () {
          setTimeout(() => {
            this.onload({ target: { result: 'data:image/jpeg;base64,test' } });
          }, 0);
        },
      } as any);

      // Mock Image with error
      spyOn(window, 'Image').and.returnValue({
        onload: null,
        onerror: null,
        set src(value: string) {
          setTimeout(() => {
            this.onerror();
          }, 0);
        },
      } as any);

      let result: boolean | undefined;
      (component as any).validateImageContent(file).then((valid: boolean) => {
        result = valid;
      });

      tick();

      expect(result).toBeFalse();
      expect(console.error).toHaveBeenCalled();
      expect(component.errorState).toBeTrue();
    }));
  });
});
