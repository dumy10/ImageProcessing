import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoadingComponent } from './loading.component';

describe('LoadingComponent', () => {
  let component: LoadingComponent;
  let fixture: ComponentFixture<LoadingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display loading message when loading is true', () => {
    component.loading = true;
    component.message = 'Loading...';
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.loading-message').textContent).toContain(
      'Loading...'
    );
  });

  it('should not display loading message when loading is false', () => {
    component.loading = false;
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.loading-message')).toBeNull();
  });

  it('should display the correct loading message', () => {
    component.loading = true;
    component.message = 'Please wait...';
    fixture.detectChanges();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('.loading-message').textContent).toContain(
      'Please wait...'
    );
  });
});
