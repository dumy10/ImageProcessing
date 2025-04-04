import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { ImageHierarchyComponent } from '../image-hierarchy/image-hierarchy.component';
import { LoadingComponent } from '../loading/loading.component';
import { ImageModel } from '../models/ImageModel';
import { TreeNode } from '../models/tree';
import { ErrorHandlingService } from '../services/error-handling.service';
import { ImageService } from '../services/image.service';
import {
  ErrorAction,
  ErrorBannerComponent,
} from '../shared/error-banner/error-banner.component';

/**
 * Interface for D3 node data structure
 */
interface D3TreeNodeData {
  name: string;
  image: ImageModel;
  hidden?: number;
  children: D3TreeNodeData[];
}

/**
 * ImageTreeComponent is a component that displays a tree structure of images using D3.js.
 * It allows users to view and interact with a hierarchy of images and their filtered versions.
 *
 * @component
 * @selector app-image-tree
 * @imports CommonModule, MatProgressSpinnerModule
 * @templateUrl ./image-tree.component.html
 * @styleUrl ./image-tree.component.scss
 */
@Component({
  selector: 'app-image-tree',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    ErrorBannerComponent,
    LoadingComponent,
  ],
  templateUrl: './image-tree.component.html',
  styleUrl: './image-tree.component.scss',
})
export class ImageTreeComponent implements OnChanges, AfterViewInit {
  /**
   * The root node of the image tree.
   * @type {TreeNode<ImageModel> | null}
   */
  @Input() node: TreeNode<ImageModel> | null = null;

  /**
   * Array of image pairs, each containing an original image and its filtered version.
   * @type {Array<{ originalImage: ImageModel; filteredImage: ImageModel }>}
   */
  @Input() imagePairs: Array<{
    originalImage: ImageModel;
    filteredImage: ImageModel;
  }> = [];

  /**
   * Maximum depth of nodes to display in the tree
   * @type {number}
   */
  @Input() maxDepth: number = Infinity;

  /**
   * Current depth level of this component instance in the tree
   * @type {number}
   */
  @Input() currentDepth: number = 1;

  /**
   * Total number of children to display horizontally
   * @type {number}
   */
  @Input() horizontalDisplayCount: number = 3;

  /**
   * Reference to the D3 tree container element
   */
  @ViewChild('treeContainer', { static: false }) treeContainer!: ElementRef;

  // D3 related properties
  private svg: any;
  private g: any;
  private width: number = 1200;
  private height: number = 800;
  private nodeRadius: number = 80;
  private nodeWidth: number = 180;
  private nodeHeight: number = 180;
  private d3Tree: any;
  private d3Data: any;
  private zoom: any;
  private tooltip: any;

  /**
   * Loading state for downloading or other operations
   */
  loading: boolean = false;

  /**
   * Message displayed while loading
   */
  loadingMessage: string = '';

  /**
   * Error state flag
   */
  errorState: boolean = false;

  /**
   * Error message to display
   */
  errorMessage: string = '';

  /**
   * Error actions for the banner
   */
  errorActions: ErrorAction[] = [];

  /**
   * Subscriptions to unsubscribe on component destruction
   */
  private subscriptions: Subscription[] = [];

  constructor(
    private dialog: MatDialog,
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private imageService: ImageService,
    private errorHandling: ErrorHandlingService
  ) {}

  /**
   * Initialize the loaded state to keep track of image loading
   */
  ngOnInit(): void {
    // Ensure node value has loaded property
    if (this.node && this.node.value && !('loaded' in this.node.value)) {
      this.node.value.loaded = false;
    }
  }

  /**
   * Clean up subscriptions when component is destroyed
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  /**
   * Listen for window resize events to update the visualization
   */
  @HostListener('window:resize')
  onResize() {
    if (this.svg) {
      this.updateTreeSize();
    }
  }

  /**
   * Update tree size based on container dimensions
   */
  private updateTreeSize() {
    const element = this.el.nativeElement.querySelector('.d3-tree-container');
    if (!element) return;

    this.width = element.offsetWidth || 1200;
    this.height = element.offsetHeight || 800;

    if (this.d3Tree && this.d3Data) {
      this.d3Tree.size([this.width - 100, this.height - 160]);

      // First zoom out to see the entire tree
      this.zoomToFit();

      // Then center the view for better visualization
      setTimeout(() => {
        this.centerView();
      }, 300);
    }
  }

  /**
   * Zoom out to fit the entire tree in view
   */
  private zoomToFit() {
    if (!this.svg || !this.g) return;

    // Get the bounds of the entire tree
    const bounds = this.g.node().getBBox();

    // Add padding to ensure we see a bit more than just the tree
    const padding = 50;

    // Calculate the scale to fit the entire tree with padding
    const scale =
      0.65 /
      Math.max(
        (bounds.width + padding) / this.width,
        (bounds.height + padding) / this.height
      );

    // Calculate the translation needed to center the tree
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;
    const translateX = this.width / 2 - scale * centerX;
    const translateY = this.height / 2 - scale * centerY;

    // Apply the zoom transformation with a smoother transition
    this.svg
      .transition()
      .duration(750)
      .call(
        this.zoom.transform,
        d3.zoomIdentity.translate(translateX, translateY).scale(scale)
      );
  }

  /**
   * Respond to input changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['node'] ||
        changes['maxDepth'] ||
        changes['horizontalDisplayCount']) &&
      this.node
    ) {
      if (this.svg) {
        // Clear existing visualization before redrawing
        d3.select(this.el.nativeElement)
          .select('.d3-tree-container svg')
          .remove();
        this.initTree();

        // When tree structure changes, ensure we see the full tree
        setTimeout(() => {
          this.zoomToFit();
        }, 100);
      }
    }
  }

  /**
   * Initialize the D3 tree after view initialization
   */
  ngAfterViewInit(): void {
    if (this.node) {
      // Use a slightly longer timeout to ensure the DOM is fully ready
      setTimeout(() => {
        this.initTree();

        // Force initial positioning to be centered and zoomed out
        setTimeout(() => {
          this.zoomToFit();
          this.cdr.detectChanges();
        }, 150);
      }, 100);
    }
  }

  /**
   * Initialize the D3 tree visualization
   */
  private initTree(): void {
    if (!this.node) return;

    // Always get a fresh reference to the container element
    const element = this.el.nativeElement.querySelector('.d3-tree-container');
    if (!element) {
      console.error('Tree container element not found');
      return;
    }

    // Clear any existing SVG
    d3.select(element).selectAll('svg').remove();

    // Ensure element has size
    if (element.offsetWidth === 0 || element.offsetHeight === 0) {
      console.debug('Container has zero dimension, setting defaults');
      this.width = 1200;
      this.height = 800;
    } else {
      // Get actual container dimensions
      this.width = element.offsetWidth || 1200;
      this.height = element.offsetHeight || 800;
      console.debug(`Container dimensions: ${this.width}x${this.height}`);
    }

    // Create SVG
    this.svg = d3
      .select(element)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${this.width} ${this.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Add zoom behavior
    this.zoom = d3
      .zoom()
      .scaleExtent([0.1, 5]) // Allow more zoom range
      .on('zoom', (event) => {
        this.g.attr('transform', event.transform);
      });

    this.svg.call(this.zoom);

    // Create root group for the tree, centered in the view initially
    this.g = this.svg
      .append('g')
      .attr('transform', `translate(${this.width / 2},${this.height / 2})`);

    // Create tooltip with theme-aware styling
    if (d3.select('body').select('.d3-tooltip').empty()) {
      this.tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'd3-tooltip')
        .style('opacity', 0)
        .style('position', 'absolute')
        .style('pointer-events', 'none')
        .style('background-color', 'var(--card-background)')
        .style('color', 'var(--text-color)')
        .style('border-radius', '5px')
        .style('padding', '10px')
        .style('box-shadow', '0 2px 8px rgba(0, 0, 0, 0.2)')
        .style('z-index', '1000')
        .style('border', '1px solid var(--border-color)');
    } else {
      this.tooltip = d3.select('body').select('.d3-tooltip');
    }

    // Convert our tree data to D3 hierarchical data
    this.transformData();

    // Create the tree layout with more space between nodes
    this.d3Tree = d3
      .tree()
      .size([this.width - 100, this.height - 160])
      .nodeSize([this.nodeWidth + 60, this.nodeHeight + 120]); // Increased spacing between nodes

    // Update the visualization
    this.updateVisualization();

    // Center the tree initially
    this.centerView();
  }

  /**
   * Transform our TreeNode data to D3 hierarchical data structure
   */
  private transformData(): void {
    if (!this.node) return;

    // Helper function to convert TreeNode to D3 hierarchy data
    const convertToD3Data = (
      node: TreeNode<ImageModel>,
      depth: number = 0
    ): D3TreeNodeData => {
      if (depth >= this.maxDepth) {
        return {
          name: node.value.name || 'Image',
          image: node.value,
          children: [], // Don't include children beyond max depth
        };
      }

      // Filter children based on horizontalDisplayCount
      let displayedChildren = node.children;
      if (node.children.length > this.horizontalDisplayCount) {
        const totalChildren = node.children.length;
        const childrenToShow = Math.min(
          totalChildren,
          this.horizontalDisplayCount
        );

        // Center the displayed children
        const startIndex = Math.max(
          0,
          Math.floor((totalChildren - childrenToShow) / 2)
        );
        displayedChildren = node.children.slice(
          startIndex,
          startIndex + childrenToShow
        );
      }

      return {
        name: node.value.name || 'Image',
        image: node.value,
        hidden:
          node.children.length > displayedChildren.length
            ? node.children.length - displayedChildren.length
            : 0,
        children: displayedChildren.map((child) =>
          convertToD3Data(child, depth + 1)
        ),
      };
    };

    // Create the root of the D3 hierarchy
    this.d3Data = d3.hierarchy(convertToD3Data(this.node));
  }

  /**
   * Update the D3 visualization with the current data
   */
  private updateVisualization(): void {
    if (!this.d3Data || !this.d3Tree) return;

    // Compute the new tree layout
    const treeData = this.d3Tree(this.d3Data);
    const nodes = treeData.descendants();
    const links = treeData.descendants().slice(1);

    // Create a link group for each link that will contain both the line and arrowhead
    const linkGroups = this.g
      .selectAll('.link-group')
      .data(links)
      .join('g')
      .attr('class', 'link-group');

    // Draw lines
    linkGroups
      .append('line')
      .attr('class', 'link')
      .attr('x1', (d: any) => d.x)
      .attr('y1', (d: any) => d.y)
      .attr('x2', (d: any) => d.parent.x)
      .attr('y2', (d: any) => d.parent.y)
      .style('stroke', 'var(--primary-color)')
      .style('stroke-width', '3px')
      .style('stroke-opacity', '0.85')
      .style(
        'filter',
        'drop-shadow(0px 0px 2px rgba(var(--primary-color-rgb), 0.6))'
      );

    // Add filter labels to the middle of each link
    linkGroups.each((d: any, i: number, groups: any) => {
      // Get the filter text from the child node's appliedFilters
      let filterText = '';
      if (
        d.data.image &&
        d.data.image.appliedFilters &&
        d.data.image.appliedFilters.length > 0
      ) {
        // Get the most recent filter applied
        filterText =
          d.data.image.appliedFilters[d.data.image.appliedFilters.length - 1];
      }

      if (filterText) {
        // Calculate the midpoint of the line
        const midX = (d.x + d.parent.x) / 2;
        const midY = (d.y + d.parent.y) / 2;

        // Calculate the angle of the line for proper text rotation
        const angle =
          Math.atan2(d.y - d.parent.y, d.x - d.parent.x) * (180 / Math.PI);

        // Determine if the child is to the left of the parent
        const isLeftChild = d.x < d.parent.x;

        // Calculate text offset perpendicular to the line
        const perpAngle = angle + 90; // Perpendicular angle
        const offsetDistance = 15; // Distance to offset the text from the line
        const offsetX = offsetDistance * Math.cos((perpAngle * Math.PI) / 180);
        const offsetY = offsetDistance * Math.sin((perpAngle * Math.PI) / 180);

        // Text anchor based on child position (start = left, end = right)
        const textAnchor = isLeftChild ? 'end' : 'start';

        // Add text element for the filter label with proper positioning
        d3.select(groups[i])
          .append('text')
          .attr('class', 'filter-label')
          .attr('x', midX + (isLeftChild ? -offsetX : offsetX))
          .attr('y', midY + (isLeftChild ? -offsetY : offsetY))
          .attr('text-anchor', textAnchor)
          .attr('fill', 'var(--text-color)')
          .text(filterText);
      }
    });

    // Add arrowheads as polygons
    linkGroups.each((d: any, i: number, groups: any) => {
      const sourceX = d.x;
      const sourceY = d.y;
      const targetX = d.parent.x;
      const targetY = d.parent.y;

      // Calculate the angle of the line
      const angle = Math.atan2(sourceY - targetY, sourceX - targetX);

      // Calculate arrowhead position at the child node instead of parent
      const arrowSize = 10; // Size of arrowhead
      const nodeOffset = this.nodeRadius; // Distance from the child node's center

      // Position the arrowhead at the border of the child node circle
      const arrowX = sourceX - Math.cos(angle) * nodeOffset;
      const arrowY = sourceY - Math.sin(angle) * nodeOffset;

      // Create points for arrowhead polygon
      const arrowPoints = [
        [arrowX, arrowY], // tip
        [
          arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
          arrowY - arrowSize * Math.sin(angle - Math.PI / 6),
        ], // right corner
        [
          arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
          arrowY - arrowSize * Math.sin(angle + Math.PI / 6),
        ], // left corner
      ];

      // Format points for the polygon
      const pointsStr = arrowPoints.map((p) => `${p[0]},${p[1]}`).join(' ');

      // Add the polygon element for the arrowhead
      d3.select(groups[i])
        .append('polygon')
        .attr('points', pointsStr)
        .attr('class', 'arrow')
        .style('fill', 'var(--primary-color)')
        .style('stroke', 'none')
        .style('opacity', '0.85');
    });

    // Create node groups
    const nodeGroups = this.g
      .selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
      .on('click', (event: any, d: any) => {
        // Only trigger click if not clicking on a button
        if (!event.defaultPrevented && d.data.image) {
          this.openDialog(d.data.image);
        }
      })
      .on('mouseover', (event: any, d: any) => {
        // Don't show tooltip when hovering buttons
        if (
          event.target.tagName === 'button' ||
          event.target.closest('.action-buttons')
        )
          return;

        this.tooltip.transition().duration(200).style('opacity', 0.9);

        const filterText =
          d.data.image.appliedFilters && d.data.image.appliedFilters.length > 0
            ? `Filter: ${
                d.data.image.appliedFilters[
                  d.data.image.appliedFilters.length - 1
                ]
              }`
            : 'Original Image';

        this.tooltip
          .html(
            `<strong class="tooltip-title">${
              d.data.name || 'Image'
            }</strong><div class="tooltip-filter">${filterText}</div>`
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', () => {
        this.tooltip.transition().duration(500).style('opacity', 0);
      });

    // Draw node image backgrounds (circle with theme-aware styling)
    nodeGroups
      .append('circle')
      .attr('r', this.nodeRadius)
      .attr('class', 'node-circle')
      .attr('fill', 'var(--card-background)')
      .attr('stroke', 'var(--border-color)')
      .attr('stroke-width', 3);

    // Add hidden children count if applicable
    nodeGroups.each((d: any, i: number, nodes: any) => {
      if (d.data.hidden > 0) {
        d3.select(nodes[i])
          .append('text')
          .attr('dy', -this.nodeRadius - 15)
          .attr('text-anchor', 'middle')
          .attr('class', 'hidden-count')
          .attr('fill', 'var(--text-color)')
          .text(`+${d.data.hidden} more`);
      }
    });

    // Create image clipPath
    this.svg
      .append('defs')
      .selectAll('clipPath')
      .data(nodes)
      .join('clipPath')
      .attr('id', (d: any, i: number) => `clip-${i}`)
      .append('circle')
      .attr('r', this.nodeRadius - 2);

    // Add image to nodes with proper loading handling
    nodeGroups
      .append('image')
      .attr('xlink:href', (d: any) => d.data.image.url)
      .attr('x', -this.nodeRadius)
      .attr('y', -this.nodeRadius)
      .attr('width', this.nodeRadius * 2)
      .attr('height', this.nodeRadius * 2)
      .attr('clip-path', (d: any, i: number) => `url(#clip-${i})`)
      .on('error', (event: any, d: any) => {
        // Handle image load error
        const currentNode = d3.select(event.currentTarget.parentNode);
        d3.select(event.currentTarget).attr(
          'xlink:href',
          'assets/images/notfound.jpg'
        );

        // Mark as loaded and remove loading indicators
        d.data.image.loaded = true;
        d.data.image.url = 'assets/images/notfound.jpg';

        // Remove loading spinner or text if it exists
        currentNode.select('.spinner-group').remove();

        // Add action buttons now that the image is loaded
        this.addActionButtonsToNode(currentNode, d);
      })
      .on('load', (event: any, d: any) => {
        // Mark as loaded and remove loading indicators
        d.data.image.loaded = true;

        // Remove loading spinner or text from this node
        const currentNode = d3.select(event.currentTarget.parentNode);
        currentNode.select('.spinner-group').remove();

        // Add action buttons now that the image is loaded
        this.addActionButtonsToNode(currentNode, d);
      });

    // Add action buttons for already loaded images
    nodeGroups.each((d: any, i: number, nodes: any) => {
      if (d.data.image && d.data.image.loaded) {
        // Add action buttons to already loaded images
        this.addActionButtonsToNode(d3.select(nodes[i]), d);
      }
    });

    // Add loading spinners only for unloaded images
    nodeGroups.each((d: any, i: number, nodes: any) => {
      // Only add loading indicators for images that haven't loaded yet
      // For previously loaded images, skip adding the loading indicator
      if (d.data.image && !d.data.image.loaded) {
        const spinner = d3
          .select(nodes[i])
          .append('g')
          .attr('class', 'spinner-group');

        // Add loading text
        spinner
          .append('text')
          .attr('dy', 5)
          .attr('text-anchor', 'middle')
          .attr('class', 'loading-text')
          .attr('fill', 'var(--text-color)')
          .text('Loading image..');
      }
    });
  }

  /**
   * Center the view on the tree
   */
  private centerView(): void {
    const bounds = this.g.node().getBBox();
    const dx = bounds.width;
    const dy = bounds.height;
    const x = bounds.x + bounds.width / 2;
    const y = bounds.y + bounds.height / 2;
    const scale = 0.85 / Math.max(dx / this.width, dy / this.height);
    const translate = [this.width / 2 - scale * x, this.height / 2 - scale * y];

    this.svg
      .transition()
      .duration(750)
      .call(
        this.zoom.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  }

  /**
   * Reset the tree view to the default centered position and zoom level
   * This can be called from the parent component
   */
  resetView(): void {
    if (this.svg && this.g) {
      // First apply zoom-to-fit to ensure we can see the entire tree
      this.zoomToFit();

      // Then after a short delay, center the view for optimal presentation
      setTimeout(() => {
        this.centerView();
      }, 300);
    }
  }

  openDialog(image: ImageModel): void {
    const dialogRef = this.dialog.open(ImageHierarchyComponent, {
      data: this.getImageHierarchy(image),
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('The dialog was closed');
    });
  }

  /**
   * Retrieves the hierarchy of the given image, including its parent images.
   * Uses an iterative approach for better performance.
   * @param {ImageModel} image - The image for which to retrieve the hierarchy.
   * @returns {ImageModel[]} - An array of images representing the hierarchy.
   */
  getImageHierarchy(image: ImageModel): ImageModel[] {
    const imageHierarchy: ImageModel[] = [];
    let currentImage = image;

    // Keep adding parents to the hierarchy until we reach the root
    while (true) {
      imageHierarchy.unshift(currentImage);

      if (!currentImage.parentId) {
        break;
      }

      const parentImage = this.imagePairs.find(
        (imgPair) => imgPair.originalImage.id === currentImage.parentId
      )?.originalImage;

      if (!parentImage) {
        break;
      }

      currentImage = parentImage;
    }

    return imageHierarchy;
  }

  /**
   * Handles the image error event.
   * @param {ImageModel} image - The image that failed to load.
   */
  onImageError(image: ImageModel): void {
    image.loaded = true;
    image.url = 'assets/images/notfound.jpg';
  }

  /**
   * Handles the image load event.
   * @param {ImageModel} image - The image that has been loaded.
   */
  onImageLoad(image: ImageModel): void {
    image.loaded = true;
  }

  /**
   * Check if we should display child nodes based on current depth
   */
  shouldDisplayChildren(): boolean {
    return this.currentDepth < this.maxDepth;
  }

  /**
   * Navigate to the editor page with the selected image
   * @param image The image to edit
   */
  editImage(image: ImageModel): void {
    this.router.navigate(['/edit', image.id]);
  }

  /**
   * Download the selected image using the image service
   * @param image The image to download
   */
  downloadImage(image: ImageModel): void {
    if (!image || !image.id) {
      console.error('No image to download');
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Downloading the image...';
    this.errorState = false;
    this.errorMessage = '';
    this.errorActions = [];

    const downloadSub = this.imageService.downloadImage(image.id).subscribe({
      next: (response) => {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = image.name || 'image.png';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        console.error('Failed to download image', error);
        this.loading = false;

        this.errorState = true;
        this.errorMessage = `Failed to download image: ${this.errorHandling.getReadableErrorMessage(
          error
        )}`;
        this.errorActions = [
          {
            label: 'Retry',
            icon: 'refresh',
            action: () => this.downloadImage(image),
          },
        ];

        this.errorHandling.showErrorWithRetry(
          'Download failed',
          this.errorHandling.getReadableErrorMessage(error),
          () => this.downloadImage(image)
        );
      },
      complete: () => {
        this.loading = false;
      },
    });
    this.subscriptions.push(downloadSub);
  }

  /**
   * Add action buttons to a node using foreignObject to enable HTML/Material icons
   * @param nodeSelection The D3 selection for the node
   * @param d The node data
   */
  private addActionButtonsToNode(nodeSelection: any, d: any): void {
    // Remove any existing action buttons to avoid duplicates
    nodeSelection.select('.action-buttons').remove();

    // Create a foreignObject to hold HTML content
    const buttonContainer = nodeSelection
      .append('foreignObject')
      .attr('class', 'action-buttons')
      .attr('x', -30) // Position the container at the top-right of the node
      .attr('y', -this.nodeRadius - 10)
      .attr('width', 60)
      .attr('height', 40);

    // Create a div to hold the buttons (with proper styling)
    const buttonsDiv = buttonContainer
      .append('xhtml:div')
      .style('width', '100%')
      .style('height', '100%')
      .style('display', 'flex')
      .style('gap', '0.3rem')
      .style('justify-content', 'center');

    // Primary and accent colors for theming
    const primaryColor = 'var(--primary-color)';
    const accentColor = 'var(--accent-color)';

    // Download button
    const downloadButton = buttonsDiv
      .append('xhtml:button')
      .style('background', 'none')
      .style('border', 'none')
      .style('padding', '0.3rem')
      .style('cursor', 'pointer')
      .style('transition', 'transform 0.3s ease')
      .attr('aria-label', 'Download image')
      .on('click', (event: any) => {
        event.preventDefault();
        event.stopPropagation();
        this.downloadImage(d.data.image);
      })
      .on('mouseover', function (this: any): void {
        d3.select(this).style('transform', 'scale(1.2)');
        d3.select(this).select('i').style('color', accentColor);
      })
      .on('mouseout', function (this: any): void {
        d3.select(this).style('transform', 'scale(1.0)');
        d3.select(this).select('i').style('color', primaryColor);
      });

    // Add Material Icon
    downloadButton
      .append('xhtml:i')
      .attr('class', 'material-icons')
      .style('font-size', '1.2rem')
      .style('color', primaryColor)
      .style('text-shadow', '1px 1px 3px rgba(0, 0, 0, 0.7)')
      .style('transition', 'color 0.3s ease')
      .text('download');

    // Edit button
    const editButton = buttonsDiv
      .append('xhtml:button')
      .style('background', 'none')
      .style('border', 'none')
      .style('padding', '0.3rem')
      .style('cursor', 'pointer')
      .style('transition', 'transform 0.3s ease')
      .attr('aria-label', 'Edit image')
      .on('click', (event: any) => {
        event.preventDefault();
        event.stopPropagation();
        this.editImage(d.data.image);
      })
      .on('mouseover', function (this: any): void {
        d3.select(this).style('transform', 'scale(1.2)');
        d3.select(this).select('i').style('color', accentColor);
      })
      .on('mouseout', function (this: any): void {
        d3.select(this).style('transform', 'scale(1.0)');
        d3.select(this).select('i').style('color', primaryColor);
      });

    // Add Material Icon
    editButton
      .append('xhtml:i')
      .attr('class', 'material-icons')
      .style('font-size', '1.2rem')
      .style('color', primaryColor)
      .style('text-shadow', '1px 1px 3px rgba(0, 0, 0, 0.7)')
      .style('transition', 'color 0.3s ease')
      .text('edit');
  }
}
