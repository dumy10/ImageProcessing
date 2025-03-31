import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialog,
  MatDialogConfig,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { ImageModel } from '../models/ImageModel';
import { TreeNode } from '../models/tree';
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
      imports: [
        ImageTreeComponent,
        MatButtonModule,
        MatIconModule,
        NoopAnimationsModule,
      ],
      providers: [{ provide: MatDialog, useValue: dialogSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageTreeComponent);
    component = fixture.componentInstance;
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

  it('should handle node with multiple children', () => {
    // Create test data for a node with multiple children
    const parentImage: ImageModel = {
      id: '1',
      name: 'Parent',
      url: 'parent.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    const child1: ImageModel = {
      id: '2',
      name: 'Child 1',
      url: 'child1.jpg',
      parentId: '1',
      parentUrl: 'parent.jpg',
      width: 100,
      height: 100,
      appliedFilters: ['Blur'],
      loaded: true,
    };

    const child2: ImageModel = {
      id: '3',
      name: 'Child 2',
      url: 'child2.jpg',
      parentId: '1',
      parentUrl: 'parent.jpg',
      width: 100,
      height: 100,
      appliedFilters: ['Grayscale'],
      loaded: true,
    };

    // Create tree node structure
    const childNode1 = new TreeNode<ImageModel>(child1);
    const childNode2 = new TreeNode<ImageModel>(child2);
    const parentNode = new TreeNode<ImageModel>(parentImage);
    parentNode.children.push(childNode1, childNode2);

    // Set the node for the component
    component.node = parentNode;
    component.imagePairs = [
      { originalImage: parentImage, filteredImage: parentImage },
      { originalImage: child1, filteredImage: child1 },
      { originalImage: child2, filteredImage: child2 },
    ];

    fixture.detectChanges();

    // Verify component state
    expect(component.node.children.length).toBe(2);
    expect(component.node.value.id).toBe('1');
    expect(component.node.children[0].value.id).toBe('2');
    expect(component.node.children[1].value.id).toBe('3');
  });

  it('should render the SVG with correct dimensions for multiple children', () => {
    // Set up a node with multiple children
    const parentImage: ImageModel = {
      id: '1',
      name: 'Parent',
      url: 'parent.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    const child1: ImageModel = {
      id: '2',
      name: 'Child 1',
      url: 'child1.jpg',
      parentId: '1',
      parentUrl: 'parent.jpg',
      width: 100,
      height: 100,
      appliedFilters: ['Blur'],
      loaded: true,
    };

    const child2: ImageModel = {
      id: '3',
      name: 'Child 2',
      url: 'child2.jpg',
      parentId: '1',
      parentUrl: 'parent.jpg',
      width: 100,
      height: 100,
      appliedFilters: ['Grayscale'],
      loaded: true,
    };

    // Create tree node structure
    const childNode1 = new TreeNode<ImageModel>(child1);
    const childNode2 = new TreeNode<ImageModel>(child2);
    const parentNode = new TreeNode<ImageModel>(parentImage);
    parentNode.children.push(childNode1, childNode2);

    component.node = parentNode;
    fixture.detectChanges();

    // Get the SVG element
    const svgElement = fixture.debugElement.query(By.css('.treeArrowsSvg'));
    expect(svgElement).toBeTruthy();

    // Check SVG dimensions are calculated correctly based on children count
    expect(svgElement.attributes['width']).toBe('400'); // 2 children * 200
    expect(svgElement.attributes['viewBox']).toBe('0 0 400 80');
  });

  it('should display horizontal connector line only when multiple children exist', () => {
    // Test with a single child
    const parentImage: ImageModel = {
      id: '1',
      name: 'Parent',
      url: 'parent.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    const childImage: ImageModel = {
      id: '2',
      name: 'Child',
      url: 'child.jpg',
      parentId: '1',
      parentUrl: 'parent.jpg',
      width: 100,
      height: 100,
      appliedFilters: ['Blur'],
      loaded: true,
    };

    // Create tree node structure with a single child
    const childNode = new TreeNode<ImageModel>(childImage);
    const parentNode = new TreeNode<ImageModel>(parentImage);
    parentNode.children.push(childNode);

    component.node = parentNode;
    fixture.detectChanges();

    // Should not have horizontal connector with a single child
    const horizontalConnectors = fixture.debugElement
      .queryAll(By.css('.treeArrowsSvg line:not([y1="0"])'))
      .filter(
        (el) => el.attributes['y1'] === '30' && el.attributes['y2'] === '30'
      );

    expect(horizontalConnectors.length).toBe(0);

    // Now add a second child
    const child2Image: ImageModel = {
      id: '3',
      name: 'Child 2',
      url: 'child2.jpg',
      parentId: '1',
      parentUrl: 'parent.jpg',
      width: 100,
      height: 100,
      appliedFilters: ['Grayscale'],
      loaded: true,
    };

    const child2Node = new TreeNode<ImageModel>(child2Image);
    parentNode.children.push(child2Node);

    component.node = parentNode;
    fixture.detectChanges();

    // Should now have a horizontal connector with multiple children
    const updatedHorizontalConnectors = fixture.debugElement
      .queryAll(By.css('.treeArrowsSvg line'))
      .filter(
        (el) => el.attributes['y1'] === '30' && el.attributes['y2'] === '30'
      );

    expect(updatedHorizontalConnectors.length).toBe(1);
  });

  it('should show filter labels on lines to each child node', () => {
    // Set up a parent with children having different filters
    const parentImage: ImageModel = {
      id: '1',
      name: 'Parent',
      url: 'parent.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    const child1: ImageModel = {
      id: '2',
      name: 'Child 1',
      url: 'child1.jpg',
      parentId: '1',
      parentUrl: 'parent.jpg',
      width: 100,
      height: 100,
      appliedFilters: ['Blur'],
      loaded: true,
    };

    const child2: ImageModel = {
      id: '3',
      name: 'Child 2',
      url: 'child2.jpg',
      parentId: '1',
      parentUrl: 'parent.jpg',
      width: 100,
      height: 100,
      appliedFilters: ['Grayscale'],
      loaded: true,
    };

    // Create tree structure
    const childNode1 = new TreeNode<ImageModel>(child1);
    const childNode2 = new TreeNode<ImageModel>(child2);
    const parentNode = new TreeNode<ImageModel>(parentImage);
    parentNode.children.push(childNode1, childNode2);

    component.node = parentNode;
    fixture.detectChanges();

    // Check that filter labels are displayed and show the correct filter
    const filterLabels = fixture.debugElement.queryAll(By.css('.filterLabel'));
    expect(filterLabels.length).toBe(2);

    // Check the content of the filter labels
    expect(filterLabels[0].nativeElement.textContent.trim()).toBe('Blur');
    expect(filterLabels[1].nativeElement.textContent.trim()).toBe('Grayscale');
  });

  it('should not render child nodes and arrows if node has no children', () => {
    // Create a node with no children
    const image: ImageModel = {
      id: '1',
      name: 'Single Node',
      url: 'single.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    const node = new TreeNode<ImageModel>(image);
    component.node = node;
    fixture.detectChanges();

    // Should not have SVG, child nodes, or connecting arrows
    const svg = fixture.debugElement.query(By.css('.treeArrowsSvg'));
    const childContainer = fixture.debugElement.query(
      By.css('.treeNodeChildren')
    );

    expect(svg).toBeNull();
    expect(childContainer).toBeNull();
  });

  it('should handle click on image to open dialog', () => {
    // Create a node
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

    const node = new TreeNode<ImageModel>(image);
    component.node = node;
    component.imagePairs = [{ originalImage: image, filteredImage: image }];

    fixture.detectChanges();

    // Simulate click on the image
    const imgElement = fixture.debugElement.query(By.css('.treeNodeImage'));
    imgElement.triggerEventHandler('click', null);

    // Verify dialog was opened with the correct data
    expect(dialogSpy.open).toHaveBeenCalled();

    // The dialog should be opened with the correct data
    if (dialogSpy.open.calls.mostRecent()) {
      const dialogCall = dialogSpy.open.calls.mostRecent();
      const dialogConfig = dialogCall.args[1] as MatDialogConfig<any>;
      expect(dialogConfig.data).toEqual([image]);
    } else {
      fail('Dialog was not opened');
    }
  });

  it('should limit displayed children based on horizontalDisplayCount', () => {
    // Create parent with more children than the display limit
    const parentImage: ImageModel = {
      id: '1',
      name: 'Parent',
      url: 'parent.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    // Create 5 children
    const children = Array(5)
      .fill(null)
      .map((_, i) => {
        const child = new TreeNode<ImageModel>({
          id: `child-${i + 1}`,
          name: `Child ${i + 1}`,
          url: `child-${i + 1}.jpg`,
          parentId: '1',
          parentUrl: 'parent.jpg',
          width: 100,
          height: 100,
          appliedFilters: [`Filter${i + 1}`],
          loaded: true,
        });
        return child;
      });

    // Set up the parent node with children
    const parentNode = new TreeNode<ImageModel>(parentImage);
    parentNode.children = children;

    // Set horizontalDisplayCount to 3 (should show only 3 of 5 children)
    component.node = parentNode;
    component.horizontalDisplayCount = 3;
    fixture.detectChanges();

    // Check that only 3 child nodes are rendered
    expect(component.getDisplayedChildren().length).toBe(3);

    // The hidden children count should be 2
    expect(component.getHiddenChildrenCount()).toBe(2);
  });

  it('should display indicator when some children are hidden', () => {
    // Setup parent with more children than display limit
    const parentImage: ImageModel = {
      id: '1',
      name: 'Parent',
      url: 'parent.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    // Create 5 children
    const children = Array(5)
      .fill(null)
      .map((_, i) => {
        const child = new TreeNode<ImageModel>({
          id: `child-${i + 1}`,
          name: `Child ${i + 1}`,
          url: `child-${i + 1}.jpg`,
          parentId: '1',
          parentUrl: 'parent.jpg',
          width: 100,
          height: 100,
          appliedFilters: [`Filter${i + 1}`],
          loaded: true,
        });
        return child;
      });

    // Set up the parent node
    const parentNode = new TreeNode<ImageModel>(parentImage);
    parentNode.children = children;

    // Set horizontalDisplayCount to 3 (should hide 2 children)
    component.node = parentNode;
    component.horizontalDisplayCount = 3;
    fixture.detectChanges();

    // Check if the hidden children indicator is displayed
    const hiddenIndicator = fixture.debugElement.query(
      By.css('.hiddenChildrenIndicator')
    );
    expect(hiddenIndicator).toBeTruthy();
    expect(hiddenIndicator.nativeElement.textContent).toContain(
      '+ 2 more filtered images'
    );
  });

  it('should respect maxDepth parameter and not display children beyond the limit', () => {
    // Create a three-level deep tree structure
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

    // Set root node with maxDepth = 1 (should only show root and level 1)
    component.node = rootNode;
    component.maxDepth = 1;
    component.currentDepth = 0;
    fixture.detectChanges();

    // Check if root is displayed
    const rootImg = fixture.debugElement.query(By.css('.treeNodeImage'));
    expect(rootImg).toBeTruthy();

    // Check if level 1 is displayed (children of root)
    const childrenContainer = fixture.debugElement.query(
      By.css('.treeNodeChildren')
    );
    expect(childrenContainer).toBeTruthy();

    // There should be no level 2 nodes (grandchildren)
    // We need to check if app-image-tree components are correctly limited by depth
    const recursiveImageTrees = fixture.debugElement.queryAll(
      By.css('app-image-tree app-image-tree')
    );
    expect(recursiveImageTrees.length).toBe(0);
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

  it('should handle image accessibility attributes correctly', () => {
    // Create a simple node
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

    const node = new TreeNode<ImageModel>(image);
    component.node = node;
    fixture.detectChanges();

    // Check accessibility attributes on the image
    const imgElement = fixture.debugElement.query(By.css('.treeNodeImage'));
    expect(imgElement.attributes['alt']).toBe('Image');
    expect(imgElement.attributes['loading']).toBe('lazy');
    expect(imgElement.attributes['role']).toBe('button');
    expect(imgElement.attributes['aria-label']).toBe('Open image dialog');
  });

  it('should dynamically adjust SVG dimensions based on number of displayed children', () => {
    // Create a parent with varying numbers of children
    const parentImage: ImageModel = {
      id: '1',
      name: 'Parent',
      url: 'parent.jpg',
      parentId: undefined,
      parentUrl: undefined,
      width: 100,
      height: 100,
      appliedFilters: [],
      loaded: true,
    };

    // Test with 2 children
    const twoChildren = Array(2)
      .fill(null)
      .map((_, i) => {
        return new TreeNode<ImageModel>({
          id: `child-${i}`,
          name: `Child ${i}`,
          url: `child-${i}.jpg`,
          parentId: '1',
          parentUrl: 'parent.jpg',
          width: 100,
          height: 100,
          appliedFilters: [],
          loaded: true,
        });
      });

    const parentNode = new TreeNode<ImageModel>(parentImage);
    parentNode.children = twoChildren;
    component.node = parentNode;
    component.horizontalDisplayCount = 2;
    fixture.detectChanges();

    // Check SVG dimensions for 2 children
    let svg = fixture.debugElement.query(By.css('.treeArrowsSvg'));
    expect(svg.attributes['width']).toBe('400'); // 2 children * 200px
    expect(svg.attributes['viewBox']).toBe('0 0 400 80');

    // Test with 4 children but horizontalDisplayCount = 3
    const fourChildren = Array(4)
      .fill(null)
      .map((_, i) => {
        return new TreeNode<ImageModel>({
          id: `child-${i}`,
          name: `Child ${i}`,
          url: `child-${i}.jpg`,
          parentId: '1',
          parentUrl: 'parent.jpg',
          width: 100,
          height: 100,
          appliedFilters: [],
          loaded: true,
        });
      });

    parentNode.children = fourChildren;
    component.node = parentNode;
    component.horizontalDisplayCount = 3;
    fixture.detectChanges();

    // Check SVG dimensions for 3 displayed children (out of 4)
    svg = fixture.debugElement.query(By.css('.treeArrowsSvg'));
    expect(svg.attributes['width']).toBe('600'); // 3 children * 200px
    expect(svg.attributes['viewBox']).toBe('0 0 600 80');
  });
});
