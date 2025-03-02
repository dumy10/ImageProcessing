import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { ImageModel } from '../models/ImageModel';
import { ImageTreeComponent } from './image-tree.component';

describe('ImageTreeComponent', () => {
  let component: ImageTreeComponent;
  let fixture: ComponentFixture<ImageTreeComponent>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<any>>;

  beforeEach(async () => {
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(of(true));
    dialogSpy.open.and.returnValue(dialogRefSpy);

    await TestBed.configureTestingModule({
      imports: [ImageTreeComponent],
      providers: [{ provide: MatDialog, useValue: dialogSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
      parentUrl: undefined,
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
});
