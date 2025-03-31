import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
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
      imports: [ImageDialogComponent, NoopAnimationsModule, MatIconModule],
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

  it('should have mat-icon elements in the horizontal control buttons', () => {
    const horizontalButtons = fixture.debugElement.queryAll(
      By.css('.horizontalControlsContainer button')
    );
    expect(horizontalButtons.length).toBe(2);

    // Check both buttons have mat-icon
    const buttonIcons = fixture.debugElement.queryAll(
      By.css('.horizontalControlsContainer button mat-icon')
    );
    expect(buttonIcons.length).toBe(2);
    expect(buttonIcons[0].nativeElement.textContent.trim()).toBe('remove');
    expect(buttonIcons[1].nativeElement.textContent.trim()).toBe('add');
  });

  it('should have mat-icon elements in the vertical control buttons', () => {
    const verticalButtons = fixture.debugElement.queryAll(
      By.css('.imageDialogActions button')
    );
    expect(verticalButtons.length).toBe(3); // 2 vertical controls and 1 close button

    // Check the vertical control buttons have mat-icon
    const verticalButtonIcons = fixture.debugElement.queryAll(
      By.css(
        '.imageDialogActions button:not([aria-label="Close Dialog"]) mat-icon'
      )
    );
    expect(verticalButtonIcons.length).toBe(2);
    expect(verticalButtonIcons[0].nativeElement.textContent.trim()).toBe(
      'remove'
    );
    expect(verticalButtonIcons[1].nativeElement.textContent.trim()).toBe('add');
  });

  it('should enable/disable horizontal control buttons based on limits', () => {
    // Initially horizontalDisplayCount is 3, max should be 0 since our mock tree has no children
    const lessButton = fixture.debugElement.query(
      By.css('button[aria-label="Show fewer images horizontally"]')
    );
    const moreButton = fixture.debugElement.query(
      By.css('button[aria-label="Show more images horizontally"]')
    );

    // Check initial state (less should be disabled if count is 1)
    if (component.horizontalDisplayCount <= 1) {
      expect(lessButton.attributes['disabled']).toBeDefined();
    } else {
      expect(lessButton.attributes['disabled']).not.toBeDefined();
    }

    // More should be disabled if count is at max
    if (component.horizontalDisplayCount >= component.maxHorizontalCount) {
      expect(moreButton.attributes['disabled']).toBeDefined();
    } else {
      expect(moreButton.attributes['disabled']).not.toBeDefined();
    }
  });

  it('should enable/disable vertical control buttons based on limits', () => {
    const lessButton = fixture.debugElement.query(
      By.css('button[aria-label="Show fewer levels vertically"]')
    );
    const moreButton = fixture.debugElement.query(
      By.css('button[aria-label="Show more levels vertically"]')
    );

    // Check initial state (less should be disabled if level is 1)
    if (component.displayLevel <= 1) {
      expect(lessButton.attributes['disabled']).toBeDefined();
    } else {
      expect(lessButton.attributes['disabled']).not.toBeDefined();
    }

    // More should be disabled if level is at max
    if (component.displayLevel >= component.maxLevel) {
      expect(moreButton.attributes['disabled']).toBeDefined();
    } else {
      expect(moreButton.attributes['disabled']).not.toBeDefined();
    }
  });
});
