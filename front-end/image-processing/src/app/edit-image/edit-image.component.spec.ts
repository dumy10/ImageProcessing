import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { EditImageComponent } from './edit-image.component';
import { ImageService } from '../services/image.service';
import { of, throwError } from 'rxjs';
import { ImageModel } from '../models/ImageModel';
import { Filters } from '../models/filters';
import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('EditImageComponent', () => {
  let component: EditImageComponent;
  let fixture: ComponentFixture<EditImageComponent>;
  let imageService: jasmine.SpyObj<ImageService>;

  beforeEach(async () => {
    const imageServiceSpy = jasmine.createSpyObj('ImageService', [
      'getImage',
      'editImage',
      'downloadImage',
    ]);

    await TestBed.configureTestingModule({
      imports: [EditImageComponent],
      providers: [
        { provide: ImageService, useValue: imageServiceSpy },
        provideHttpClientTesting(),
        provideHttpClient(withInterceptorsFromDi()),
        provideAnimationsAsync(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditImageComponent);
    component = fixture.componentInstance;
    imageService = TestBed.inject(ImageService) as jasmine.SpyObj<ImageService>;

    imageService.getImage.and.returnValue(of({} as ImageModel));
    imageService.editImage.and.returnValue(of({} as ImageModel));
    imageService.downloadImage.and.returnValue(of(new Blob()));

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
    fixture.detectChanges();

    expect(component.image).toEqual(mockImage);
    expect(component.imagePath).toBe(mockImage.url);
    expect(component.loading).toBeFalse();
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
    imageService.editImage.and.returnValue(
      throwError(() => new Error('Failed to edit image'))
    );

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
  });

  it('should download image', () => {
    const mockBlob = new Blob(['image content'], { type: 'image/jpeg' });
    imageService.downloadImage.and.returnValue(of(mockBlob));

    spyOn(window.URL, 'createObjectURL').and.returnValue('mock-url');
    const a = document.createElement('a');
    spyOn(document, 'createElement').and.returnValue(a);
    spyOn(document.body, 'appendChild');
    spyOn(a, 'click');
    spyOn(window.URL, 'revokeObjectURL');
    spyOn(document.body, 'removeChild');

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
    expect(window.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
    expect(document.createElement).toHaveBeenCalledWith('a');
    expect(document.body.appendChild).toHaveBeenCalledWith(a);
    expect(a.click).toHaveBeenCalled();
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
    expect(document.body.removeChild).toHaveBeenCalledWith(a);
  });

  it('should handle image download error', () => {
    imageService.downloadImage.and.returnValue(
      throwError(() => new Error('Failed to download image'))
    );

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
    imageService.getImage.and.returnValue(
      throwError(() => new Error('Failed to fetch image'))
    );

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
  });
});
