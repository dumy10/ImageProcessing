import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ImageModel } from '../models/ImageModel';
import { ImageService } from './image.service';

describe('ImageService', () => {
  let service: ImageService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ImageService,
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ImageService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should upload an image', () => {
    const dummyImage: ImageModel = {
      id: '1',
      url: 'http://example.com/image.jpg',
      name: 'image.jpg',
      parentId: '0',
      parentUrl: '',
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };
    const imageFile = new File([''], 'image.jpg');

    service.uploadImage(imageFile).subscribe((image) => {
      expect(image).toEqual(dummyImage);
    });

    const req = httpMock.expectOne(`${service.baseURL}/upload`);
    expect(req.request.method).toBe('POST');
    req.flush(dummyImage);
  });

  it('should fetch all images', () => {
    const dummyImages: ImageModel[] = [
      {
        id: '1',
        url: 'http://example.com/image1.jpg',
        name: 'image1.jpg',
        parentId: '0',
        parentUrl: '',
        width: 800,
        height: 600,
        appliedFilters: [],
        loaded: true,
      },
      {
        id: '2',
        url: 'http://example.com/image2.jpg',
        name: 'image2.jpg',
        parentId: '0',
        parentUrl: '',
        width: 800,
        height: 600,
        appliedFilters: [],
        loaded: true,
      },
    ];

    service.getImages().subscribe((images) => {
      expect(images.length).toBe(2);
      expect(images).toEqual(dummyImages);
    });

    const req = httpMock.expectOne(service.baseURL);
    expect(req.request.method).toBe('GET');
    req.flush(dummyImages);
  });

  it('should fetch a single image by ID', () => {
    const dummyImage: ImageModel = {
      id: '1',
      url: 'http://example.com/image.jpg',
      name: 'image.jpg',
      parentId: '0',
      parentUrl: '',
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };

    service.getImage('1').subscribe((image) => {
      expect(image).toEqual(dummyImage);
    });

    const req = httpMock.expectOne(`${service.baseURL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyImage);
  });

  it('should edit an image by applying a filter', () => {
    const dummyImage: ImageModel = {
      id: '1',
      url: 'http://example.com/image.jpg',
      name: 'image.jpg',
      parentId: '0',
      parentUrl: '',
      width: 800,
      height: 600,
      appliedFilters: [],
      loaded: true,
    };
    const filter = 'grayscale';

    service.editImage('1', filter).subscribe((image) => {
      expect(image.appliedFilters).toContain(filter);
    });

    const req = httpMock.expectOne(`${service.baseURL}/edit/1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...dummyImage, appliedFilters: [filter] });
  });

  it('should download an image', () => {
    const dummyBlob = new Blob([''], { type: 'image/jpeg' });

    service.downloadImage('1').subscribe((blob) => {
      expect(blob).toEqual(dummyBlob);
    });

    const req = httpMock.expectOne(`${service.baseURL}/download/1`);
    expect(req.request.method).toBe('GET');
    req.flush(dummyBlob);
  });
});
