import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Filters } from '../models/filters';
import { FilterButtonsComponent } from './filter-buttons.component';

describe('FilterButtonsComponent', () => {
  let component: FilterButtonsComponent;
  let fixture: ComponentFixture<FilterButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterButtonsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display the correct number of filter buttons', () => {
    const filters: Filters[] = [
      Filters.GrayScale,
      Filters.Invert,
      Filters.Blur,
    ];
    component.filters = filters;
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(buttons.length).toBe(filters.length);
  });

  it('should emit the selected filter when a button is clicked', () => {
    spyOn(component.filterSelected, 'emit');
    const filters: Filters[] = [
      Filters.GrayScale,
      Filters.Invert,
      Filters.Blur,
    ];
    component.filters = filters;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', null);

    expect(component.filterSelected.emit).toHaveBeenCalledWith(
      Filters.GrayScale
    );
  });

  it('should disable all buttons when isFilteringInProgress is true', () => {
    const filters: Filters[] = [
      Filters.GrayScale,
      Filters.Invert,
      Filters.Blur,
    ];
    component.filters = filters;
    component.isFilteringInProgress = true;
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    buttons.forEach((button) => {
      expect(button.nativeElement.disabled).toBeTrue();
    });
  });

  it('should not emit filter when a button is clicked while filtering is in progress', () => {
    spyOn(component.filterSelected, 'emit');

    const filters: Filters[] = [Filters.GrayScale, Filters.Invert];
    component.filters = filters;
    component.isFilteringInProgress = true;
    fixture.detectChanges();

    const button = fixture.debugElement.query(By.css('button'));
    button.triggerEventHandler('click', null);

    expect(component.filterSelected.emit).not.toHaveBeenCalled();
  });

  it('should mark the clicked button as active when filtering starts', () => {
    const filters: Filters[] = [Filters.GrayScale, Filters.Invert];
    component.filters = filters;
    fixture.detectChanges();

    // First click the button (not in filtering mode yet)
    component.filterImage(Filters.GrayScale);
    expect(component.activeFilter).toBe(Filters.GrayScale);

    // Then set filtering to in-progress
    component.isFilteringInProgress = true;
    fixture.detectChanges();

    // Check that the correct button has the active-filter class
    const buttons = fixture.debugElement.queryAll(By.css('button'));
    expect(
      buttons[0].nativeElement.classList.contains('active-filter')
    ).toBeTrue();
    expect(
      buttons[1].nativeElement.classList.contains('active-filter')
    ).toBeFalse();
  });

  it('should correctly identify the active filter button', () => {
    component.activeFilter = Filters.Invert;
    component.isFilteringInProgress = true;

    expect(component.isActiveFilter(Filters.Invert)).toBeTrue();
    expect(component.isActiveFilter(Filters.GrayScale)).toBeFalse();

    // When not filtering, no button should be active
    component.isFilteringInProgress = false;
    expect(component.isActiveFilter(Filters.Invert)).toBeFalse();
  });
});
