import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { ImageModel } from '../models/ImageModel';
import { Tree, TreeNode } from '../models/tree';
import { ImageDialogComponent } from './image-dialog.component';

describe('ImageDialogComponent', () => {
  let component: ImageDialogComponent;
  let fixture: ComponentFixture<ImageDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<ImageDialogComponent>>;
  let mockData: {
    tree: Tree<ImageModel>;
    imagePairs: Array<{
      originalImage: ImageModel;
      filteredImage: ImageModel;
    }>;
  };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockData = {
      tree: new Tree<ImageModel>(),
      imagePairs: [
        {
          originalImage: {
            id: '1',
            name: 'Original Image 1',
            url: 'http://example.com/original1.jpg',
            parentId: undefined,
            parentUrl: undefined,
            width: 800,
            height: 600,
            appliedFilters: [],
            loaded: true,
          },
          filteredImage: {
            id: '2',
            name: 'Filtered Image 1',
            url: 'http://example.com/filtered1.jpg',
            parentId: '1',
            parentUrl: 'http://example.com/original1.jpg',
            width: 800,
            height: 600,
            appliedFilters: ['filter1'],
            loaded: true,
          },
        },
      ],
    };

    const rootNode = new TreeNode<ImageModel>({
      id: 'root',
      name: 'Root Image',
      url: '',
      parentId: undefined,
      parentUrl: undefined,
      width: 0,
      height: 0,
      appliedFilters: [],
      loaded: true,
    });
    mockData.tree.setRoot(rootNode);

    await TestBed.configureTestingModule({
      imports: [ImageDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize imagePairs from data', () => {
    expect(component.imagePairs).toEqual(mockData.imagePairs);
  });

  it('should close the dialog when closeDialog is called', () => {
    component.closeDialog();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  it('should display the correct dialog title', () => {
    const titleElement = fixture.debugElement.query(
      By.css('.dialogTitle')
    ).nativeElement;
    expect(titleElement.textContent.trim()).toContain(
      'Tree of Image: Root Image'
    );
  });

  it('should display the image tree component', () => {
    const imageTreeElement = fixture.debugElement.query(
      By.css('app-image-tree')
    );
    expect(imageTreeElement).toBeTruthy();
  });

  it('should display the close button', () => {
    const closeButton = fixture.debugElement.query(
      By.css('button[aria-label="Close Dialog"]')
    ).nativeElement;
    expect(closeButton.textContent).toContain('Close');
  });

  it('should call closeDialog when the close button is clicked', () => {
    const closeButton = fixture.debugElement.query(
      By.css('button[aria-label="Close Dialog"]')
    ).nativeElement;
    closeButton.click();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });
});
