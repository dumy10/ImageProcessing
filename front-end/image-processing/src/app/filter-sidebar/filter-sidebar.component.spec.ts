import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatIconModule } from '@angular/material/icon';
import { By } from '@angular/platform-browser';
import { Filters } from '../models/filters';
import { ImageModel } from '../models/ImageModel';
import { FilterSidebarComponent } from './filter-sidebar.component';

describe('FilterSidebarComponent', () => {
  let component: FilterSidebarComponent;
  let fixture: ComponentFixture<FilterSidebarComponent>;
  let mockImage: ImageModel;

  beforeEach(async () => {
    mockImage = {
      id: '123',
      name: 'test-image.jpg',
      url: 'test-url.jpg',
      width: 800,
      height: 600,
      appliedFilters: ['grayscale', 'invert'],
      loaded: true,
      parentId: undefined,
      parentUrl: undefined,
    };

    await TestBed.configureTestingModule({
      imports: [FilterSidebarComponent, MatIconModule],
      schemas: [NO_ERRORS_SCHEMA], // To ignore child components like app-filter-buttons for now
    }).compileComponents();

    fixture = TestBed.createComponent(FilterSidebarComponent);
    component = fixture.componentInstance;

    // Setup input properties
    component.image = mockImage;
    component.filters = [Filters.GrayScale, Filters.Invert, Filters.Blur];
    component.canUndo = true;
    component.canRedo = false;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should populate filter categories on init', () => {
    // Check if categorization has been set up
    expect(Object.keys(component.filterCategories).length).toBeGreaterThan(0);
    expect(component.filterCategories['adjustments']).toContain(
      Filters.GrayScale
    );
    expect(component.filterCategories['effects']).toContain(Filters.Glitch);
    expect(component.filterCategories['transform']).toContain(
      Filters.FlipHorizontal
    );
  });

  it('should display the image stats correctly', () => {
    const statsContainer = fixture.debugElement.query(
      By.css('.stats-container')
    );
    expect(statsContainer).toBeTruthy();
    expect(statsContainer.nativeElement.textContent).toContain('800px');
    expect(statsContainer.nativeElement.textContent).toContain('600px');
  });

  it('should display applied filters if available', () => {
    const filtersApplied = fixture.debugElement.query(
      By.css('.filters-applied')
    );
    expect(filtersApplied).toBeTruthy();
    expect(filtersApplied.nativeElement.textContent).toContain('grayscale');
    expect(filtersApplied.nativeElement.textContent).toContain('invert');
  });

  it('should toggle sidebar when button is clicked', () => {
    const toggleButton = fixture.debugElement.query(By.css('.sidebar-toggle'));
    spyOn(component.toggleSidebarEvent, 'emit');

    toggleButton.triggerEventHandler('click', null);

    expect(component.toggleSidebarEvent.emit).toHaveBeenCalled();
  });

  it('should toggle category when header is clicked', () => {
    const effectsHeader = fixture.debugElement.queryAll(
      By.css('.category-header')
    )[1]; // Effects category
    const initialState = component.isCategoryOpen('effects');

    effectsHeader.triggerEventHandler('click', null);

    expect(component.isCategoryOpen('effects')).toBe(!initialState);
  });

  it('should emit filter selected event when onFilterSelected is called', () => {
    spyOn(component.filterSelected, 'emit');

    component.onFilterSelected(Filters.Blur);

    expect(component.filterSelected.emit).toHaveBeenCalledWith(Filters.Blur);
  });

  it('should emit download event when downloadImage is called', () => {
    spyOn(component.downloadImageEvent, 'emit');

    component.downloadImage();

    expect(component.downloadImageEvent.emit).toHaveBeenCalled();
  });

  it('should emit undo event when undoFilter is called', () => {
    spyOn(component.undoEvent, 'emit');

    component.undoFilter();

    expect(component.undoEvent.emit).toHaveBeenCalled();
  });

  it('should emit redo event when redoFilter is called', () => {
    spyOn(component.redoEvent, 'emit');

    component.redoFilter();

    expect(component.redoEvent.emit).toHaveBeenCalled();
  });

  it('should show undo/redo buttons when applicable', () => {
    const historyButtons = fixture.debugElement.query(
      By.css('.history-buttons')
    );
    expect(historyButtons).toBeTruthy();

    const undoButton = historyButtons.queryAll(By.css('button'))[0];
    const redoButton = historyButtons.queryAll(By.css('button'))[1];

    expect(undoButton.attributes['disabled']).toBeFalsy(); // Undo is enabled
    expect(redoButton.attributes['disabled']).toBeTruthy(); // Redo is disabled
  });

  it('should show correct icon for sidebar toggle based on collapsed state', () => {
    const toggleButton = fixture.debugElement.query(By.css('.sidebar-toggle'));
    const matIcon = toggleButton.query(By.css('mat-icon'));

    // Initially not collapsed
    expect(matIcon.nativeElement.textContent.trim()).toBe('chevron_left');

    // Set to collapsed
    component.sidebarCollapsed = true;
    fixture.detectChanges();

    expect(matIcon.nativeElement.textContent.trim()).toBe('chevron_right');
  });

  it('should show correct category icons based on expanded state', () => {
    const categoryHeaders = fixture.debugElement.queryAll(
      By.css('.category-header')
    );

    // Adjustments category is open by default
    let adjustmentIcon = categoryHeaders[0].query(By.css('mat-icon'));
    expect(adjustmentIcon.nativeElement.textContent.trim()).toBe('expand_less');

    // Effects category is closed by default
    let effectsIcon = categoryHeaders[1].query(By.css('mat-icon'));
    expect(effectsIcon.nativeElement.textContent.trim()).toBe('expand_more');

    // Toggle effects category
    component.toggleCategory('effects');
    fixture.detectChanges();

    effectsIcon = categoryHeaders[1].query(By.css('mat-icon'));
    expect(effectsIcon.nativeElement.textContent.trim()).toBe('expand_less');
  });

  it('should disable undo/redo buttons when filtering is in progress', () => {
    component.isFilteringInProgress = true;
    fixture.detectChanges();

    const historyButtons = fixture.debugElement.query(
      By.css('.history-buttons')
    );
    const undoButton = historyButtons.queryAll(By.css('button'))[0];
    const redoButton = historyButtons.queryAll(By.css('button'))[1];

    expect(undoButton.nativeElement.disabled).toBeTrue();
    expect(redoButton.nativeElement.disabled).toBeTrue();
  });

  it('should disable download button when filtering is in progress', () => {
    component.isFilteringInProgress = true;
    fixture.detectChanges();

    const saveButton = fixture.debugElement.query(
      By.css('.save-button button')
    );
    expect(saveButton.nativeElement.disabled).toBeTrue();
  });

  it('should not emit events when operations are attempted during filtering', () => {
    spyOn(component.filterSelected, 'emit');
    spyOn(component.downloadImageEvent, 'emit');
    spyOn(component.undoEvent, 'emit');
    spyOn(component.redoEvent, 'emit');
    spyOn(console, 'warn');

    component.isFilteringInProgress = true;

    // Try to perform operations while filtering is in progress
    component.onFilterSelected(Filters.Blur);
    component.downloadImage();
    component.undoFilter();
    component.redoFilter();

    // Verify no events were emitted
    expect(component.filterSelected.emit).not.toHaveBeenCalled();
    expect(component.downloadImageEvent.emit).not.toHaveBeenCalled();
    expect(component.undoEvent.emit).not.toHaveBeenCalled();
    expect(component.redoEvent.emit).not.toHaveBeenCalled();
  });

  it('should pass isFilteringInProgress flag to filter-buttons component', () => {
    component.isFilteringInProgress = true;

    // Make sure 'adjustments' category is open (which should be the default)
    component.openCategories = {
      adjustments: true,
      effects: false,
      transform: false,
    };

    fixture.detectChanges();

    // Get expanded categories
    const categoryContent = fixture.debugElement.query(
      By.css('.category-content.expanded')
    );

    expect(categoryContent).withContext('No expanded category content found');

    if (categoryContent) {
      const filterButtonsComponent = categoryContent.query(
        By.css('app-filter-buttons')
      );

      expect(filterButtonsComponent).withContext(
        'Filter buttons component not found'
      );

      // Access the component instance instead of properties
      const filterButtonsComponentInstance =
        filterButtonsComponent.componentInstance;
      expect(filterButtonsComponentInstance.isFilteringInProgress).toBeTrue();
    }
  });
});
