import {
  HttpErrorResponse,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ImageService } from '../services/image.service';
import { HomeComponent } from './home.component';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let imageService: jasmine.SpyObj<ImageService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const imageServiceSpy = jasmine.createSpyObj('ImageService', [
      'uploadImage',
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideHttpClient(withInterceptorsFromDi()),
        { provide: ImageService, useValue: imageServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    imageService = TestBed.inject(ImageService) as jasmine.SpyObj<ImageService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should handle drag over event', () => {
    const dropzone = document.createElement('div');
    const event = new DragEvent('dragover', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: dropzone });
    spyOn(event, 'preventDefault');
    component.onDragOver(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(dropzone.classList.contains('dragging')).toBeTrue();
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
    spyOn(window, 'alert');
    spyOn(console, 'error');
    component.onDrop(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'Invalid file count. Only one file is allowed.'
    );
    expect(window.alert).toHaveBeenCalledWith('Please upload only one file.');
  });

  it('should handle invalid file type', () => {
    const file = new File([''], 'test.txt', { type: 'text/plain' });
    const event = { target: { files: [file] } };
    spyOn(window, 'alert');
    spyOn(console, 'error');
    component.onImageSelected(event);
    expect(console.error).toHaveBeenCalledWith(
      'Invalid file type. Only images are allowed.'
    );
    expect(window.alert).toHaveBeenCalledWith(
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
    });
    imageService.uploadImage.and.returnValue(throwError(() => errorResponse));
    spyOn(console, 'error');
    component.uploadImage(file);
    expect(component.loading).toBeFalse();
    expect(console.error).toHaveBeenCalledWith(
      'Error uploading image:',
      errorResponse
    );
  });

  it('should reset loading state after file upload completes', () => {
    const file = new File([''], 'test.png', { type: 'image/png' });
    const response = { id: '123' } as any;
    imageService.uploadImage.and.returnValue(of(response));
    component.uploadImage(file);
    expect(component.loading).toBeFalse();
  });
});
