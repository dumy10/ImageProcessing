import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ImageModel } from '../models/ImageModel';
import { ImageHierarchyComponent } from './image-hierarchy.component';

describe('ImageHierarchyComponent', () => {
  let component: ImageHierarchyComponent;
  let fixture: ComponentFixture<ImageHierarchyComponent>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ImageHierarchyComponent>>;
  let mockData: ImageModel[];

  beforeEach(async () => {
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    // Create mock image data
    mockData = [
      {
        id: '1',
        name: 'Original Image',
        url: 'original.jpg',
        parentId: undefined,
        parentUrl: undefined,
        width: 100,
        height: 100,
        appliedFilters: [],
        loaded: true,
      },
      {
        id: '2',
        name: 'Filtered Image',
        url: 'filtered.jpg',
        parentId: '1',
        parentUrl: 'original.jpg',
        width: 100,
        height: 100,
        appliedFilters: ['Grayscale'],
        loaded: true,
      },
    ];

    await TestBed.configureTestingModule({
      imports: [ImageHierarchyComponent, NoopAnimationsModule, MatIconModule],
      providers: [
        {
          provide: MatDialogRef,
          useValue: dialogRefSpy,
        },
        { provide: MAT_DIALOG_DATA, useValue: mockData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageHierarchyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close the dialog', () => {
    component.closeDialog();
    expect(component.dialogRef.close).toHaveBeenCalled();
  });

  it('should handle image error', () => {
    const imageModel = { url: 'invalid-url' } as ImageModel;
    component.onImageError(imageModel);
    expect(imageModel.url).toBe('assets/images/notfound.jpg');
  });

  it('should properly display the hierarchy title with image name', () => {
    const titleEl = fixture.nativeElement.querySelector('.dialogTitle');
    expect(titleEl.textContent).toContain('Filtered Image');
  });

  it('should handle empty data array', () => {
    component.data = [];
    fixture.detectChanges();

    const titleEl = fixture.nativeElement.querySelector('.dialogTitle');
    expect(titleEl.textContent).toContain('Unknown');

    const imageContainers =
      fixture.nativeElement.querySelectorAll('.imageContainer');
    expect(imageContainers.length).toBe(0);
  });

  it('should render all images in the hierarchy', () => {
    const imageContainers =
      fixture.nativeElement.querySelectorAll('.imageContainer');
    expect(imageContainers.length).toBe(2);

    const images = fixture.nativeElement.querySelectorAll('.image');
    expect(images.length).toBe(2);

    expect(images[0].getAttribute('src')).toBe('original.jpg');
    expect(images[1].getAttribute('src')).toBe('filtered.jpg');
  });

  it('should display arrows between images', () => {
    // Should have 1 arrow between 2 images
    const arrows = fixture.nativeElement.querySelectorAll('.arrowContainer');
    expect(arrows.length).toBe(1);
  });

  it('should display filter name on arrows', () => {
    const filterLabel = fixture.nativeElement.querySelector('.filterLabel');
    expect(filterLabel.textContent.trim()).toBe('Grayscale');
  });

  it('should handle complex hierarchy with multiple applied filters', () => {
    // Create a more complex hierarchy with multiple filters
    const complexData: ImageModel[] = [
      {
        id: '1',
        name: 'Original',
        url: 'original.jpg',
        parentId: undefined,
        parentUrl: undefined,
        width: 100,
        height: 100,
        appliedFilters: [],
        loaded: true,
      },
      {
        id: '2',
        name: 'Level 1',
        url: 'level1.jpg',
        parentId: '1',
        parentUrl: 'original.jpg',
        width: 100,
        height: 100,
        appliedFilters: ['Grayscale'],
        loaded: true,
      },
      {
        id: '3',
        name: 'Level 2',
        url: 'level2.jpg',
        parentId: '2',
        parentUrl: 'level1.jpg',
        width: 100,
        height: 100,
        appliedFilters: ['Grayscale', 'Blur'],
        loaded: true,
      },
    ];

    component.data = complexData;
    fixture.detectChanges();

    const imageContainers =
      fixture.nativeElement.querySelectorAll('.imageContainer');
    expect(imageContainers.length).toBe(3);

    const arrows = fixture.nativeElement.querySelectorAll('.arrowContainer');
    expect(arrows.length).toBe(2);

    const filterLabels = fixture.nativeElement.querySelectorAll('.filterLabel');
    expect(filterLabels.length).toBe(2);
    expect(filterLabels[0].textContent.trim()).toBe('Grayscale');
    expect(filterLabels[1].textContent.trim()).toBe('Blur');
  });

  it('should have accessible elements with appropriate ARIA attributes', () => {
    // Check the dialog title has an aria-label
    const titleEl = fixture.debugElement.query(By.css('.dialogTitle'));
    expect(titleEl.attributes['aria-label']).toBe('Image title');

    // Check images have appropriate alt text and aria-labels
    const images = fixture.debugElement.queryAll(By.css('.image'));
    images.forEach((img) => {
      expect(img.attributes['alt']).toBe('Image');
      expect(img.attributes['aria-label']).toBe('Image');
    });

    // Check close button has an aria-label - use specific selector for close button
    const closeButton = fixture.debugElement.query(By.css('.btn.btn-primary'));
    expect(closeButton.attributes['aria-label']).toBe('Close dialog');
  });

  it('should handle image loading with lazy loading attribute', () => {
    const images = fixture.debugElement.queryAll(By.css('.image'));
    images.forEach((img) => {
      expect(img.attributes['loading']).toBe('lazy');
    });
  });

  it('should handle case when image has no applied filters', () => {
    // Create data with no applied filters
    const noFiltersData: ImageModel[] = [
      {
        id: '1',
        name: 'Original',
        url: 'original.jpg',
        parentId: undefined,
        parentUrl: undefined,
        width: 100,
        height: 100,
        appliedFilters: [],
        loaded: true,
      },
      {
        id: '2',
        name: 'Child',
        url: 'child.jpg',
        parentId: '1',
        parentUrl: 'original.jpg',
        width: 100,
        height: 100,
        appliedFilters: [], // Empty filters array
        loaded: true,
      },
    ];

    component.data = noFiltersData;
    fixture.detectChanges();

    // Should have an arrow but no filter label
    const arrows = fixture.debugElement.queryAll(By.css('.arrowContainer'));
    expect(arrows.length).toBe(1);

    const filterLabels = fixture.debugElement.queryAll(By.css('.filterLabel'));
    expect(filterLabels.length).toBe(0);
  });

  it('should handle case when image has undefined applied filters', () => {
    // Create data with undefined applied filters
    const undefinedFiltersData: ImageModel[] = [
      {
        id: '1',
        name: 'Original',
        url: 'original.jpg',
        parentId: undefined,
        parentUrl: undefined,
        width: 100,
        height: 100,
        appliedFilters: [],
        loaded: true,
      },
      {
        id: '2',
        name: 'Child',
        url: 'child.jpg',
        parentId: '1',
        parentUrl: 'original.jpg',
        width: 100,
        height: 100,
        appliedFilters: undefined, // Undefined filters
        loaded: true,
      } as ImageModel, // Need to cast as we're intentionally making appliedFilters undefined
    ];

    component.data = undefinedFiltersData;
    fixture.detectChanges();

    // Should have an arrow but no filter label
    const arrows = fixture.debugElement.queryAll(By.css('.arrowContainer'));
    expect(arrows.length).toBe(1);

    const filterLabels = fixture.debugElement.queryAll(By.css('.filterLabel'));
    expect(filterLabels.length).toBe(0);
  });

  it('should handle click on close button', () => {
    // Get the close button and click it - use specific selector for close button
    const closeButton = fixture.debugElement.query(By.css('.btn.btn-primary'));
    closeButton.nativeElement.click();

    // Verify the dialog.close method was called
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

  it('should show correct arrow structure with multiple images', () => {
    const complexData: ImageModel[] = [
      {
        id: '1',
        name: 'Original',
        url: 'original.jpg',
        parentId: undefined,
        parentUrl: undefined,
        width: 100,
        height: 100,
        appliedFilters: [],
        loaded: true,
      },
      {
        id: '2',
        name: 'Level 1',
        url: 'level1.jpg',
        parentId: '1',
        parentUrl: 'original.jpg',
        width: 100,
        height: 100,
        appliedFilters: ['Grayscale'],
        loaded: true,
      },
      {
        id: '3',
        name: 'Level 2',
        url: 'level2.jpg',
        parentId: '2',
        parentUrl: 'level1.jpg',
        width: 100,
        height: 100,
        appliedFilters: ['Grayscale', 'Blur'],
        loaded: true,
      },
      {
        id: '4',
        name: 'Level 3',
        url: 'level3.jpg',
        parentId: '3',
        parentUrl: 'level2.jpg',
        width: 100,
        height: 100,
        appliedFilters: ['Grayscale', 'Blur', 'Invert'],
        loaded: true,
      },
    ];

    component.data = complexData;
    // Initialize the display count to show all images
    component.displayCount = complexData.length;
    fixture.detectChanges();

    // Should have 3 arrows between 4 images
    const arrows = fixture.debugElement.queryAll(By.css('.arrowContainer'));
    expect(arrows.length).toBe(3);

    // Check arrow SVG elements are rendered correctly
    const svgElements = fixture.debugElement.queryAll(
      By.css('.hierarchyArrowSvg')
    );
    expect(svgElements.length).toBe(3);

    // Each SVG should have the same viewBox dimensions
    svgElements.forEach((svg) => {
      expect(svg.attributes['viewBox']).toBe('0 0 100 60');
      expect(svg.attributes['width']).toBe('100');
      expect(svg.attributes['height']).toBe('60');
    });

    // Check arrow heads (polygons) are present
    const arrowHeads = fixture.debugElement.queryAll(By.css('.arrowHead'));
    expect(arrowHeads.length).toBe(3);

    // Check filter labels
    const filterLabels = fixture.debugElement.queryAll(By.css('.filterLabel'));
    expect(filterLabels.length).toBe(3);
    expect(filterLabels[0].nativeElement.textContent.trim()).toBe('Grayscale');
    expect(filterLabels[1].nativeElement.textContent.trim()).toBe('Blur');
    expect(filterLabels[2].nativeElement.textContent.trim()).toBe('Invert');
  });

  it('should handle images with long filter names', () => {
    // Create data with a very long filter name
    const longFilterNameData: ImageModel[] = [
      {
        id: '1',
        name: 'Original',
        url: 'original.jpg',
        parentId: undefined,
        parentUrl: undefined,
        width: 100,
        height: 100,
        appliedFilters: [],
        loaded: true,
      },
      {
        id: '2',
        name: 'Filtered',
        url: 'filtered.jpg',
        parentId: '1',
        parentUrl: 'original.jpg',
        width: 100,
        height: 100,
        appliedFilters: ['VeryLongFilterNameThatMightCauseLayoutIssues'],
        loaded: true,
      },
    ];

    component.data = longFilterNameData;
    fixture.detectChanges();

    // Verify the filter label contains the long name
    const filterLabel = fixture.debugElement.query(By.css('.filterLabel'));
    expect(filterLabel.nativeElement.textContent.trim()).toBe(
      'VeryLongFilterNameThatMightCauseLayoutIssues'
    );

    // The label should have centered text alignment to display properly
    expect(filterLabel.attributes['text-anchor']).toBe('middle');
    expect(filterLabel.attributes['dominant-baseline']).toBe('middle');
  });

  it('should have mat-icon elements in control buttons', () => {
    const buttons = fixture.debugElement.queryAll(
      By.css('.imageDialogActions button')
    );
    expect(buttons.length).toBe(3); // Show Less, Close, Show More

    // Check mat-icons are present
    const buttonIcons = fixture.debugElement.queryAll(
      By.css('.imageDialogActions button mat-icon')
    );
    expect(buttonIcons.length).toBe(2); // Both Show Less and Show More should have icons

    // Verify the icons
    expect(buttonIcons[0].nativeElement.textContent.trim()).toBe('remove');
    expect(buttonIcons[1].nativeElement.textContent.trim()).toBe('add');
  });

  it('should enable/disable show more/less buttons based on current display count', () => {
    // Test with enough data to show more
    const moreData: ImageModel[] = Array(5)
      .fill(null)
      .map((_, index) => ({
        id: String(index + 1),
        name: `Image ${index + 1}`,
        url: `image${index + 1}.jpg`,
        parentId: index > 0 ? String(index) : undefined,
        parentUrl: index > 0 ? `image${index}.jpg` : undefined,
        width: 100,
        height: 100,
        appliedFilters: index > 0 ? [`Filter${index}`] : [],
        loaded: true,
      }));

    component.data = moreData;
    component.displayCount = 3; // Set to show only 3 of 5 images
    fixture.detectChanges();

    const showLessButton = fixture.debugElement.query(
      By.css('button[aria-label="Show less images"]')
    );
    const showMoreButton = fixture.debugElement.query(
      By.css('button[aria-label="Show more images"]')
    );

    // Should be able to show less since displayCount > 1
    expect(showLessButton.attributes['disabled']).not.toBeDefined();

    // Should be able to show more since displayCount < data.length
    expect(showMoreButton.attributes['disabled']).not.toBeDefined();

    // Test when displayCount = 1 (min)
    component.displayCount = 1;
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(
        By.css('button[aria-label="Show less images"]')
      ).attributes['disabled']
    ).toBeDefined();

    // Test when displayCount = data.length (max)
    component.displayCount = moreData.length;
    fixture.detectChanges();
    expect(
      fixture.debugElement.query(
        By.css('button[aria-label="Show more images"]')
      ).attributes['disabled']
    ).toBeDefined();
  });

  it('should update display count when show more/less buttons are clicked', () => {
    // Setup data with multiple images
    const moreData: ImageModel[] = Array(5)
      .fill(null)
      .map((_, index) => ({
        id: String(index + 1),
        name: `Image ${index + 1}`,
        url: `image${index + 1}.jpg`,
        parentId: index > 0 ? String(index) : undefined,
        parentUrl: index > 0 ? `image${index}.jpg` : undefined,
        width: 100,
        height: 100,
        appliedFilters: index > 0 ? [`Filter${index}`] : [],
        loaded: true,
      }));

    component.data = moreData;
    component.displayCount = 3; // Set to show only 3 of 5 images
    fixture.detectChanges();

    // Initial state check
    expect(component.displayCount).toBe(3);
    expect(
      fixture.debugElement.queryAll(By.css('.imageContainer')).length
    ).toBe(3);

    // Click Show More
    const showMoreButton = fixture.debugElement.query(
      By.css('button[aria-label="Show more images"]')
    );
    showMoreButton.nativeElement.click();
    fixture.detectChanges();

    // Should show 5 images now (min(3+2, 5))
    expect(component.displayCount).toBe(5);
    expect(
      fixture.debugElement.queryAll(By.css('.imageContainer')).length
    ).toBe(5);

    // Click Show Less
    const showLessButton = fixture.debugElement.query(
      By.css('button[aria-label="Show less images"]')
    );
    showLessButton.nativeElement.click();
    fixture.detectChanges();

    // Should show 3 images now (max(5-2, 1))
    expect(component.displayCount).toBe(3);
    expect(
      fixture.debugElement.queryAll(By.css('.imageContainer')).length
    ).toBe(3);
  });
});
