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
});
